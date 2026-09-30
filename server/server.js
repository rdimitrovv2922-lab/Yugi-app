const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const GameState = require('../client/js/models/GameState.js').default;
const GameCard = require('../client/js/models/GameCard.js').default;
const GameRules = require('../client/js/core/GameRules.js');

const clientRoot = path.join(__dirname, '..', 'client');
const contentTypes = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'text/javascript'
};

const rooms = new Map();
const sessions = new Map();

const deckCardsOpp = [
    {
        id: 74677422,
        name: 'Red-Eyes Black Dragon',
        type: 'normal',
        card_images: [{ image_url: 'https://images.ygoprodeck.com/images/cards/74677422.jpg' }]
    },
    {
        id: 70781052,
        name: 'Summoned Skull',
        type: 'normal',
        card_images: [{ image_url: 'https://images.ygoprodeck.com/images/cards/70781052.jpg' }]
    }
];

const deckCards = [
    {
        id: 46986414,
        name: 'Dark Magician',
        type: 'normal',
        card_images: [{ image_url: 'https://images.ygoprodeck.com/images/cards/46986414.jpg' }]
    },
    {
        id: 89631139,
        name: 'Blue-Eyes White Dragon',
        type: 'normal',
        card_images: [{ image_url: 'https://images.ygoprodeck.com/images/cards/89631139.jpg' }]
    },
];

const extraDeckCards = [
    {
        id: 23995346,
        name: 'Blue-Eyes Ultimate Dragon',
        type: 'fusion',
        card_images: [{ image_url: 'https://images.ygoprodeck.com/images/cards/23995346.jpg' }]
    },
    {
        id: 84013237,
        name: 'Number 39: Utopia',
        type: 'xyz',
        card_images: [{ image_url: 'https://images.ygoprodeck.com/images/cards/84013237.jpg' }]
    }
];

function createRoomGameState() {
    const gameState = new GameState();

    for (let i = 0; i < 40; i++) {
        const card = new GameCard(deckCards[i % deckCards.length]);
        card.moveToLocation('deck');
        gameState.player.deck.push(card);
    }

    for (let i = 0; i < 40; i++) {
        const card = new GameCard(deckCardsOpp[i % deckCardsOpp.length]);
        card.moveToLocation('deck');
        gameState.opponent.deck.push(card);
    } 

    for (const playerState of [gameState.player, gameState.opponent]) {
        for (let i = 0; i < 15; i++) {
            const card = new GameCard(extraDeckCards[i % extraDeckCards.length]);
            card.moveToLocation('extradeck');
            playerState.extradeck.push(card);
        }

        for (let i = 0; i < 5; i++) {
            GameRules.drawCard(playerState);
        }
    }

    gameState.turn = 'player1';
    return gameState;
}

function findCard(playerState, instanceId) {
    for (const pileName of ['hand', 'deck', 'extradeck', 'graveyard', 'banish']) {
        const card = playerState[pileName].find(
            card => card.instanceId === instanceId
        );
        if (card) return card;
    }

    for (const zone of Object.values(playerState.monsterZones)) {
        if (zone.card?.instanceId === instanceId) return zone.card;

        const material = zone.materials.find(
            card => card.instanceId === instanceId
        );
        if (material) return material;
    }

    return Object.values(playerState.spellTrapZones).find(
        card => card?.instanceId === instanceId
    ) || null;
}

const server = http.createServer(async (request, response) => {
    const url = new URL(request.url, 'http://localhost');

    if (request.method === 'GET' && url.pathname === '/api/join') {
        const roomId = url.searchParams.get('room');

        if (!roomId) {
            response.writeHead(400, { 'Content-Type': 'application/json' });
            response.end(JSON.stringify({ error: 'Room name is required' }));
            return;
        }

        let room = rooms.get(roomId);

        if (!room) {
            const gameState = createRoomGameState();

            room = {
                players: [],
                gameState
            };
            rooms.set(roomId, room);
        }

        if (room.players.length >= 2) {
            response.writeHead(409, { 'Content-Type': 'application/json' });
            response.end(JSON.stringify({ error: 'Room is full' }));
            return;
        }

        const role = room.players.length === 0 ? 'player1' : 'player2';
        room.players.push(role);

        const sessionId = crypto.randomUUID();
        sessions.set(sessionId, { roomId, role });

        response.writeHead(200, { 'Content-Type': 'application/json' });
        response.end(JSON.stringify({ roomId, role, sessionId }));
        return;
    }

    if (request.method === 'POST' && url.pathname === '/api/end-turn') {
        const sessionId = url.searchParams.get('sessionId');
        const session = sessions.get(sessionId);

        if (!session) {
            response.writeHead(401, { 'Content-Type': 'application/json' });
            response.end(JSON.stringify({ error: 'Unknown session' }));
            return;
        }

        const room = rooms.get(session.roomId);

        if (room.gameState.turn !== session.role) {
            response.writeHead(409, { 'Content-Type': 'application/json' });
            response.end(JSON.stringify({ error: 'It is not your turn' }));
            return;
        }

        room.gameState.turn =
            session.role === 'player1' ? 'player2' : 'player1';

        response.writeHead(200, { 'Content-Type': 'application/json' });
        response.end(JSON.stringify(room.gameState));
        return;
    }

    if (request.method === 'POST' && url.pathname === '/api/draw') {
        const sessionId = url.searchParams.get('sessionId');
        const session = sessions.get(sessionId);

        if (!session) {
            response.writeHead(401, { 'Content-Type': 'application/json' });
            response.end(JSON.stringify({ error: 'Unknown session' }));
            return;
        }

        const room = rooms.get(session.roomId);

        const playerState = session.role === 'player1'
            ? room.gameState.player
            : room.gameState.opponent;

        GameRules.drawCard(playerState);

        response.writeHead(200, { 'Content-Type': 'application/json' });
        response.end(JSON.stringify({ ok: true }));
        return;
    }

    if (request.method === 'POST' && url.pathname === '/api/action') {
        const chunks = [];

        for await (const chunk of request) {
            chunks.push(chunk);
        }

        let payload;

        try {
            payload = JSON.parse(Buffer.concat(chunks).toString());
        } catch {
            response.writeHead(400, { 'Content-Type': 'application/json' });
            response.end(JSON.stringify({ error: 'Invalid JSON body' }));
            return;
        }

        const session = sessions.get(payload.sessionId);
        const rule = GameRules[payload.ruleName];

        if (!session) {
            response.writeHead(401, { 'Content-Type': 'application/json' });
            response.end(JSON.stringify({ error: 'Unknown session' }));
            return;
        }

        if (typeof rule !== 'function' || !Array.isArray(payload.args)) {
            response.writeHead(400, { 'Content-Type': 'application/json' });
            response.end(JSON.stringify({ error: 'Invalid game action' }));
            return;
        }

        const room = rooms.get(session.roomId);
        const playerState = session.role === 'player1'
            ? room.gameState.player
            : room.gameState.opponent;

        try {
            const args = payload.args.map(argument => {
                if (argument && typeof argument === 'object' && argument.instanceId) {
                    const card = findCard(playerState, argument.instanceId);
                    if (!card) throw new Error('Card does not belong to this player');
                    return card;
                }
                return argument;
            });

            rule(playerState, ...args);
        } catch (error) {
            response.writeHead(400, { 'Content-Type': 'application/json' });
            response.end(JSON.stringify({ error: error.message }));
            return;
        }

        response.writeHead(200, { 'Content-Type': 'application/json' });
        response.end(JSON.stringify({ ok: true }));
        return;
    }

    if (request.method === 'GET' && url.pathname === '/api/state') {
        const roomId = url.searchParams.get('room');
        const room = rooms.get(roomId);

        if (!room) {
            response.writeHead(404, { 'Content-Type': 'application/json' });
            response.end(JSON.stringify({ error: 'Room not found' }));
            return;
        }

        response.writeHead(200, { 'Content-Type': 'application/json' });
        response.end(JSON.stringify(room.gameState));
        return;
    }

    const requestedPath = new URL(request.url, 'http://localhost').pathname;
    const filePath = path.resolve(
        clientRoot,
        `.${requestedPath === '/' ? '/game-board.html' : requestedPath}`
    );

    if (!filePath.startsWith(clientRoot + path.sep)) {
        response.writeHead(403, { 'Content-Type': 'text/plain' });
        response.end('Forbidden');
        return;
    }

    fs.readFile(filePath, (error, content) => {
        if (error) {
            response.writeHead(404, { 'Content-Type': 'text/plain' });
            response.end('File not found');
            return;
        }

        const extension = path.extname(filePath);
        const contentType = contentTypes[extension] || 'application/octet-stream';

        response.writeHead(200, { 'Content-Type': contentType });
        response.end(content);
    });
});

const port = 3000;
const HOST = '0.0.0.0';

server.listen(port, HOST, () => {
    console.log(`Server listening at http://localhost:${port}`);
});