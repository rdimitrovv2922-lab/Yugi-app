const GameRules = require('../../client/js/core/GameRules.js');
const {
    createRoom,
    joinRoom,
    getRoomByCode,
    saveRoomGameState,
    getRoomGameState
} = require('../rooms/roomStore');
const { cardCatalog } = require('../cards/cardCatalog');
const { readJsonBody } = require('../http/requestBody');
const { getSignedInUser } = require('../auth/sessions');
const {
    createGameStateFromRoom,
    findCardOnEitherSide,
    restoreGameState,
    createGameStateView
} = require('../game/gameState');

const validPhases = new Set(['DP', 'SP', 'M1', 'BP', 'M2', 'EP']);

async function handleRoomRoute(request, response, url) {
    if (request.method === 'POST' && url.pathname === '/api/rooms') {
        const user = getSignedInUser(request);

        if (!user) {
            response.writeHead(401, { 'Content-Type': 'application/json' });
            response.end(JSON.stringify({ error: 'Not signed in' }));
            return true;
        }

        let payload;

        try {
            payload = await readJsonBody(request);
        } catch {
            response.writeHead(400, { 'Content-Type': 'application/json' });
            response.end(JSON.stringify({ error: 'Invalid JSON body' }));
            return true;
        }

        if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
            response.writeHead(400, { 'Content-Type': 'application/json' });
            response.end(JSON.stringify({ error: 'Invalid room data' }));
            return true;
        }

        try {
            const room = createRoom({
                userId: user.id,
                deckId: payload.deckId
            });

            response.writeHead(201, { 'Content-Type': 'application/json' });
            response.end(JSON.stringify({ room }));
        } catch (error) {
            const expectedErrors = [
                'Choose one of your saved decks.',
                'Deck not found or you do not own it.'
            ];

            if (expectedErrors.includes(error.message)) {
                response.writeHead(400, { 'Content-Type': 'application/json' });
                response.end(JSON.stringify({ error: error.message }));
                return true;
            }

            console.error('Could not create room:', error);
            response.writeHead(500, { 'Content-Type': 'application/json' });
            response.end(JSON.stringify({ error: 'Could not create room' }));
        }

        return true;
    }

    if (request.method === 'POST' && url.pathname === '/api/rooms/join') {
        const user = getSignedInUser(request);

        if (!user) {
            response.writeHead(401, { 'Content-Type': 'application/json' });
            response.end(JSON.stringify({ error: 'Not signed in' }));
            return true;
        }

        let payload;

        try {
            payload = await readJsonBody(request);
        } catch {
            response.writeHead(400, { 'Content-Type': 'application/json' });
            response.end(JSON.stringify({ error: 'Invalid JSON body' }));
            return true;
        }

        if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
            response.writeHead(400, { 'Content-Type': 'application/json' });
            response.end(JSON.stringify({ error: 'Invalid room data' }));
            return true;
        }

        try {
            const room = joinRoom({
                userId: user.id,
                code: payload.code,
                deckId: payload.deckId
            });

            if (room.status === 'active') {
                const roomData = getRoomByCode(room.code);

                if (!roomData) {
                    throw new Error('Room not found after joining.');
                }

                const savedGameState = getRoomGameState(room.id);

                if (!savedGameState) {
                    const gameState = createGameStateFromRoom(roomData);
                    saveRoomGameState(room.id, gameState);
                }
            }

            response.writeHead(201, { 'Content-Type': 'application/json' });
            response.end(JSON.stringify({ room }));
        } catch (error) {
            const expectedErrors = [
                'Enter a valid six-character room code.',
                'Choose one of your saved decks.',
                'Deck not found or you do not own it.',
                'Room not found.',
                'Room is not waiting for another player.',
                'You already joined this room.',
                'Room is full.'
            ];

            if (expectedErrors.includes(error.message)) {
                const status = error.message === 'Room not found.' ? 404 : 400;
                response.writeHead(status, { 'Content-Type': 'application/json' });
                response.end(JSON.stringify({ error: error.message }));
                return true;
            }

            console.error('Could not join room:', error);
            response.writeHead(500, { 'Content-Type': 'application/json' });
            response.end(JSON.stringify({ error: 'Could not join room' }));
        }

        return true;
    }

    const roomStateMatch = url.pathname.match(
        /^\/api\/rooms\/([^/]+)\/state$/
    );

    if (request.method === 'GET' && roomStateMatch) {
        const user = getSignedInUser(request);

        if (!user) {
            response.writeHead(401, { 'Content-Type': 'application/json' });
            response.end(JSON.stringify({ error: 'Not signed in' }));
            return true;
        }

        const room = getRoomByCode(roomStateMatch[1]);

        if (!room) {
            response.writeHead(404, { 'Content-Type': 'application/json' });
            response.end(JSON.stringify({ error: 'Room not found' }));
            return true;
        }

        const roomPlayer = room.players.find(
            player => player.userId === user.id
        );

        if (!roomPlayer) {
            response.writeHead(403, { 'Content-Type': 'application/json' });
            response.end(JSON.stringify({ error: 'You are not a member of this room' }));
            return true;
        }

        if (room.status !== 'active') {
            response.writeHead(409, { 'Content-Type': 'application/json' });
            response.end(JSON.stringify({ error: 'Room is waiting for another player' }));
            return true;
        }

        try {
            let savedState = getRoomGameState(room.id);

            if (!savedState) {
                savedState = createGameStateFromRoom(room);
                saveRoomGameState(room.id, savedState);
            }

            const gameState = restoreGameState(savedState);
            const role = roomPlayer.seat === 1 ? 'player1' : 'player2';

            response.writeHead(200, { 'Content-Type': 'application/json' });
            response.end(JSON.stringify({
                room: {
                    id: room.id,
                    code: room.code,
                    status: room.status
                },
                role,
                gameState: createGameStateView(gameState, role)
            }));
        } catch (error) {
            console.error('Could not load room state:', error);
            response.writeHead(500, { 'Content-Type': 'application/json' });
            response.end(JSON.stringify({ error: 'Could not load room state' }));
        }

        return true;
    }

    const roomEndTurnMatch = url.pathname.match(
        /^\/api\/rooms\/([^/]+)\/end-turn$/
    );

    if (request.method === 'POST' && roomEndTurnMatch) {
        const user = getSignedInUser(request);

        if (!user) {
            response.writeHead(401, { 'Content-Type': 'application/json' });
            response.end(JSON.stringify({ error: 'Not signed in' }));
            return true;
        }

        const room = getRoomByCode(roomEndTurnMatch[1]);

        if (!room) {
            response.writeHead(404, { 'Content-Type': 'application/json' });
            response.end(JSON.stringify({ error: 'Room not found' }));
            return true;
        }

        const roomPlayer = room.players.find(
            player => player.userId === user.id
        );

        if (!roomPlayer) {
            response.writeHead(403, { 'Content-Type': 'application/json' });
            response.end(JSON.stringify({ error: 'You are not a member of this room' }));
            return true;
        }

        if (room.status !== 'active') {
            response.writeHead(409, { 'Content-Type': 'application/json' });
            response.end(JSON.stringify({ error: 'Room is not active' }));
            return true;
        }

        try {
            const savedState = getRoomGameState(room.id);

            if (!savedState) {
                response.writeHead(409, { 'Content-Type': 'application/json' });
                response.end(JSON.stringify({ error: 'Game state is not initialized' }));
                return true;
            }

            const gameState = restoreGameState(savedState);
            const role = roomPlayer.seat === 1 ? 'player1' : 'player2';

            if (gameState.turn !== role) {
                response.writeHead(409, { 'Content-Type': 'application/json' });
                response.end(JSON.stringify({ error: 'It is not your turn' }));
                return true;
            }

            gameState.turn = role === 'player1' ? 'player2' : 'player1';
            saveRoomGameState(room.id, gameState);

            response.writeHead(200, { 'Content-Type': 'application/json' });
            response.end(JSON.stringify({
                role,
                gameState: createGameStateView(gameState, role)
            }));
        } catch (error) {
            console.error('Could not end room turn:', error);
            response.writeHead(500, { 'Content-Type': 'application/json' });
            response.end(JSON.stringify({ error: 'Could not end turn' }));
        }

        return true;
    }

    const roomPhaseMatch = url.pathname.match(
        /^\/api\/rooms\/([^/]+)\/phase$/
    );

    if (request.method === 'POST' && roomPhaseMatch) {
        const user = getSignedInUser(request);

        if (!user) {
            response.writeHead(401, { 'Content-Type': 'application/json' });
            response.end(JSON.stringify({ error: 'Not signed in' }));
            return true;
        }

        const room = getRoomByCode(roomPhaseMatch[1]);

        if (!room) {
            response.writeHead(404, { 'Content-Type': 'application/json' });
            response.end(JSON.stringify({ error: 'Room not found' }));
            return true;
        }

        const roomPlayer = room.players.find(
            player => player.userId === user.id
        );

        if (!roomPlayer) {
            response.writeHead(403, { 'Content-Type': 'application/json' });
            response.end(JSON.stringify({ error: 'You are not a member of this room' }));
            return true;
        }

        if (room.status !== 'active') {
            response.writeHead(409, { 'Content-Type': 'application/json' });
            response.end(JSON.stringify({ error: 'Room is not active' }));
            return true;
        }

        const phase = url.searchParams.get('phase');

        if (!validPhases.has(phase)) {
            response.writeHead(400, { 'Content-Type': 'application/json' });
            response.end(JSON.stringify({ error: 'Invalid duel phase' }));
            return true;
        }

        try {
            const savedState = getRoomGameState(room.id);

            if (!savedState) {
                response.writeHead(409, { 'Content-Type': 'application/json' });
                response.end(JSON.stringify({ error: 'Game state is not initialized' }));
                return true;
            }

            const gameState = restoreGameState(savedState);
            gameState.phase = phase;
            saveRoomGameState(room.id, gameState);

            response.writeHead(200, { 'Content-Type': 'application/json' });
            response.end(JSON.stringify({ ok: true, phase }));
        } catch (error) {
            console.error('Could not change room phase:', error);
            response.writeHead(500, { 'Content-Type': 'application/json' });
            response.end(JSON.stringify({ error: 'Could not change phase' }));
        }

        return true;
    }

    const roomActionMatch = url.pathname.match(
        /^\/api\/rooms\/([^/]+)\/action$/
    );

    if (request.method === 'POST' && roomActionMatch) {
        const user = getSignedInUser(request);

        if (!user) {
            response.writeHead(401, { 'Content-Type': 'application/json' });
            response.end(JSON.stringify({ error: 'Not signed in' }));
            return true;
        }

        const room = getRoomByCode(roomActionMatch[1]);

        if (!room) {
            response.writeHead(404, { 'Content-Type': 'application/json' });
            response.end(JSON.stringify({ error: 'Room not found' }));
            return true;
        }

        const roomPlayer = room.players.find(
            player => player.userId === user.id
        );

        if (!roomPlayer) {
            response.writeHead(403, { 'Content-Type': 'application/json' });
            response.end(JSON.stringify({ error: 'You are not a member of this room' }));
            return true;
        }

        if (room.status !== 'active') {
            response.writeHead(409, { 'Content-Type': 'application/json' });
            response.end(JSON.stringify({ error: 'Room is not active' }));
            return true;
        }

        let payload;

        try {
            payload = await readJsonBody(request);
        } catch {
            response.writeHead(400, { 'Content-Type': 'application/json' });
            response.end(JSON.stringify({ error: 'Invalid JSON body' }));
            return true;
        }

        if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
            response.writeHead(400, { 'Content-Type': 'application/json' });
            response.end(JSON.stringify({ error: 'Invalid game action' }));
            return true;
        }

        const rule = GameRules[payload.ruleName];

        if (typeof rule !== 'function' || !Array.isArray(payload.args)) {
            response.writeHead(400, { 'Content-Type': 'application/json' });
            response.end(JSON.stringify({ error: 'Invalid game action' }));
            return true;
        }

        const savedState = getRoomGameState(room.id);

        if (!savedState) {
            response.writeHead(409, { 'Content-Type': 'application/json' });
            response.end(JSON.stringify({ error: 'Game state is not initialized' }));
            return true;
        }

        const gameState = restoreGameState(savedState);
        const role = roomPlayer.seat === 1 ? 'player1' : 'player2';
        const ownState = role === 'player1'
            ? gameState.player
            : gameState.opponent;

        let selectedCardState = null;

        try {
            const args = payload.args.map(argument => {
                if (!argument || typeof argument !== 'object' || !argument.instanceId) {
                    return argument;
                }

                const found = findCardOnEitherSide(gameState, argument.instanceId);

                if (!found) {
                    throw new Error('Card was not found');
                }

                if (!['targetCard', 'stealCard'].includes(payload.ruleName)) {
                    if (selectedCardState && selectedCardState !== found.playerState) {
                        throw new Error('Selected cards must be on the same side');
                    }

                    selectedCardState = found.playerState;
                }

                return found.card;
            });

            const actionState = selectedCardState || ownState;

            if (payload.ruleName === 'clearTargets') {
                rule(gameState, role);
            } else if (payload.ruleName === 'targetCard') {
                rule(ownState, ...args, role);
            } else if (payload.ruleName === 'stealCard') {
                if (args.length !== 3) {
                    throw new Error('A card, destination zone, and position are required');
                }

                rule(ownState, args[0], args[1], args[2], gameState);
            } else if (payload.ruleName === 'placeToken') {
                rule(ownState, ...args, role);
            } else if (payload.ruleName === 'sendCardToBanish') {
                if (args.length === 1) {
                    rule(actionState, args[0], true, gameState);
                } else {
                    rule(actionState, ...args, gameState);
                }
            } else if ([
                'summonMonsterCard',
                'setMonsterCard',
                'activateSpellTrapCard',
                'sendCardToGraveyard',
                'sendCardToDeck',
                'sendCardToExtraDeck',
                'sendCardToHand',
                'attachCard',
                'xyzSummon'
            ].includes(payload.ruleName)) {
                rule(actionState, ...args, gameState);
            } else if (selectedCardState) {
                rule(actionState, ...args);
            } else {
                rule(ownState, ...args);
            }
        } catch (error) {
            response.writeHead(400, { 'Content-Type': 'application/json' });
            response.end(JSON.stringify({ error: error.message }));
            return true;
        }

        try {
            saveRoomGameState(room.id, gameState);
        } catch (error) {
            console.error('Could not save room action:', error);
            response.writeHead(500, { 'Content-Type': 'application/json' });
            response.end(JSON.stringify({ error: 'Could not save game action' }));
            return true;
        }

        response.writeHead(200, { 'Content-Type': 'application/json' });
        response.end(JSON.stringify({ ok: true }));
        return true;
    }

    const roomLpMatch = url.pathname.match(
        /^\/api\/rooms\/([^/]+)\/lp$/
    );

    if (request.method === 'POST' && roomLpMatch) {
        const user = getSignedInUser(request);

        if (!user) {
            response.writeHead(401, { 'Content-Type': 'application/json' });
            response.end(JSON.stringify({ error: 'Not signed in' }));
            return true;
        }

        const room = getRoomByCode(roomLpMatch[1]);

        if (!room) {
            response.writeHead(404, { 'Content-Type': 'application/json' });
            response.end(JSON.stringify({ error: 'Room not found' }));
            return true;
        }

        const roomPlayer = room.players.find(
            player => player.userId === user.id
        );

        if (!roomPlayer) {
            response.writeHead(403, { 'Content-Type': 'application/json' });
            response.end(JSON.stringify({ error: 'You are not a member of this room' }));
            return true;
        }

        if (room.status !== 'active') {
            response.writeHead(409, { 'Content-Type': 'application/json' });
            response.end(JSON.stringify({ error: 'Room is not active' }));
            return true;
        }

        let payload;

        try {
            payload = await readJsonBody(request);
        } catch {
            response.writeHead(400, { 'Content-Type': 'application/json' });
            response.end(JSON.stringify({ error: 'Invalid JSON body' }));
            return true;
        }

        if (
            !payload ||
            typeof payload !== 'object' ||
            Array.isArray(payload) ||
            !['player', 'opponent'].includes(payload.target) ||
            !['add', 'subtract'].includes(payload.action) ||
            !Number.isSafeInteger(payload.amount) ||
            payload.amount <= 0
        ) {
            response.writeHead(400, { 'Content-Type': 'application/json' });
            response.end(JSON.stringify({ error: 'Invalid LP update' }));
            return true;
        }

        try {
            const savedState = getRoomGameState(room.id);

            if (!savedState) {
                response.writeHead(409, { 'Content-Type': 'application/json' });
                response.end(JSON.stringify({ error: 'Game state is not initialized' }));
                return true;
            }

            const gameState = restoreGameState(savedState);
            const role = roomPlayer.seat === 1 ? 'player1' : 'player2';
            const ownState = role === 'player1'
                ? gameState.player
                : gameState.opponent;
            const otherState = role === 'player1'
                ? gameState.opponent
                : gameState.player;
            const targetState = payload.target === 'player' ? ownState : otherState;

            const newLP = payload.action === 'add'
                ? targetState.lp + payload.amount
                : Math.max(0, targetState.lp - payload.amount);

            if (!Number.isSafeInteger(newLP)) {
                response.writeHead(400, { 'Content-Type': 'application/json' });
                response.end(JSON.stringify({ error: 'LP total is out of range' }));
                return true;
            }

            targetState.lp = newLP;
            saveRoomGameState(room.id, gameState);

            response.writeHead(200, { 'Content-Type': 'application/json' });
            response.end(JSON.stringify({
                ok: true,
                target: payload.target,
                lp: newLP
            }));
        } catch (error) {
            console.error('Could not update room LP:', error);
            response.writeHead(500, { 'Content-Type': 'application/json' });
            response.end(JSON.stringify({ error: 'Could not update Life Points' }));
        }

        return true;
    }
    return false;
}

module.exports = { handleRoomRoute };
