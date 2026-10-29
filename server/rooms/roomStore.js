const { randomUUID, randomInt } = require('node:crypto');
const db = require('../storage/db');

const roomCodeCharacters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

const findDeckOwnedByUser = db.prepare(`
    SELECT id
    FROM decks
    WHERE id = ? AND user_id = ?
`);

const findRoomByCode = db.prepare(`
    SELECT id
    FROM rooms
    WHERE code = ?
`);

const insertRoom = db.prepare(`
    INSERT INTO rooms (id, code, created_by)
    VALUES (?, ?, ?)
`);

const insertRoomPlayer = db.prepare(`
    INSERT INTO room_players (room_id, user_id, deck_id, seat)
    VALUES (?, ?, ?, ?)
`);

const findRoomForJoin = db.prepare(`
    SELECT id, code, status
    FROM rooms
    WHERE code = ?
`);

const findRoomPlayers = db.prepare(`
    SELECT user_id, seat
    FROM room_players
    WHERE room_id = ?
`);

const updateRoomStatus = db.prepare(`
    UPDATE rooms
    SET status = ?
    WHERE id = ?
`);

const findRoomPlayersWithDecks = db.prepare(`
    SELECT
        room_players.user_id AS user_id,
        room_players.seat AS seat,
        room_players.deck_id AS deck_id,
        decks.name AS deck_name,
        users.display_name AS display_name,
        deck_cards.card_id AS card_id,
        deck_cards.section AS section,
        deck_cards.quantity AS quantity
    FROM room_players
    JOIN decks ON decks.id = room_players.deck_id
    JOIN users ON users.id = room_players.user_id
    LEFT JOIN deck_cards ON deck_cards.deck_id = room_players.deck_id
    WHERE room_players.room_id = ?
    ORDER BY room_players.seat, deck_cards.section, deck_cards.card_id
`);

const updateRoomGameState = db.prepare(`
    UPDATE rooms
    SET game_state_json = ?
    WHERE id = ? AND status = 'active'
`);

const findRoomGameState = db.prepare(`
    SELECT game_state_json
    FROM rooms
    WHERE id = ?
`);

function generateRoomCode() {
    let code = '';

    for (let index = 0; index < 6; index++) {
        const characterIndex = randomInt(roomCodeCharacters.length);
        code += roomCodeCharacters[characterIndex];
    }

    return code;
}

function generateAvailableRoomCode() {
    for (let attempt = 0; attempt < 10; attempt++) {
        const code = generateRoomCode();

        if (!findRoomByCode.get(code)) {
            return code;
        }
    }

    throw new Error('Could not generate a room code. Try again.');
}

function createRoom({ userId, deckId }) {
    if (typeof deckId !== 'string' || deckId.length === 0) {
        throw new Error('Choose one of your saved decks.');
    }

    const ownedDeck = findDeckOwnedByUser.get(deckId, userId);

    if (!ownedDeck) {
        throw new Error('Deck not found or you do not own it.');
    }

    const roomId = randomUUID();
    const code = generateAvailableRoomCode();

    db.exec('BEGIN');

    try {
        insertRoom.run(roomId, code, userId);
        insertRoomPlayer.run(roomId, userId, deckId, 1);
        db.exec('COMMIT');

        return {
            id: roomId,
            code,
            status: 'waiting'
        };
    } catch (error) {
        db.exec('ROLLBACK');
        throw error;
    }
}

function joinRoom({ userId, code, deckId }) {
    const cleanCode = typeof code === 'string'
        ? code.trim().toUpperCase()
        : '';

    if (!/^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$/.test(cleanCode)) {
        throw new Error('Enter a valid six-character room code.');
    }

    if (typeof deckId !== 'string' || deckId.length === 0) {
        throw new Error('Choose one of your saved decks.');
    }

    const ownedDeck = findDeckOwnedByUser.get(deckId, userId);

    if (!ownedDeck) {
        throw new Error('Deck not found or you do not own it.');
    }

    db.exec('BEGIN');

    try {
        const room = findRoomForJoin.get(cleanCode);

        if (!room) {
            throw new Error('Room not found.');
        }

        if (room.status !== 'waiting') {
            throw new Error('Room is not waiting for another player.');
        }

        const players = findRoomPlayers.all(room.id);

        if (players.some(player => player.user_id === userId)) {
            throw new Error('You already joined this room.');
        }

        if (players.length >= 2) {
            throw new Error('Room is full.');
        }

        const seat = players.some(player => player.seat === 1) ? 2 : 1;

        insertRoomPlayer.run(room.id, userId, deckId, seat);

        const status = players.length + 1 === 2 ? 'active' : 'waiting';

        if (status === 'active') {
            updateRoomStatus.run(status, room.id);
        }

        db.exec('COMMIT');

        return {
            id: room.id,
            code: room.code,
            status,
            seat
        };
    } catch (error) {
        db.exec('ROLLBACK');
        throw error;
    }
}

function getRoomByCode(code) {
    const cleanCode = typeof code === 'string'
        ? code.trim().toUpperCase()
        : '';

    if (!/^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$/.test(cleanCode)) {
        return null;
    }

    const room = findRoomForJoin.get(cleanCode);

    if (!room) {
        return null;
    }

    const rows = findRoomPlayersWithDecks.all(room.id);
    const playersBySeat = new Map();

    for (const row of rows) {
        let player = playersBySeat.get(row.seat);

        if (!player) {
            player = {
                userId: row.user_id,
                displayName: row.display_name,
                seat: row.seat,
                deckId: row.deck_id,
                deckName: row.deck_name,
                cards: []
            };
            playersBySeat.set(row.seat, player);
        }

        if (row.card_id !== null) {
            player.cards.push({
                cardId: row.card_id,
                section: row.section,
                quantity: row.quantity
            });
        }
    }

    return {
        ...room,
        players: [...playersBySeat.values()].sort(
            (first, second) => first.seat - second.seat
        )
    };
}

function saveRoomGameState(roomId, gameState) {
    const gameStateJson = JSON.stringify(gameState);

    if (!gameStateJson) {
        throw new Error('Could not serialize the game state.');
    }

    const result = updateRoomGameState.run(gameStateJson, roomId);

    if (result.changes !== 1) {
        throw new Error('Active room not found.');
    }
}

function getRoomGameState(roomId) {
    const row = findRoomGameState.get(roomId);

    if (!row || !row.game_state_json) {
        return null;
    }

    return JSON.parse(row.game_state_json);
}

module.exports = {
    createRoom,
    joinRoom,
    getRoomByCode,
    saveRoomGameState,
    getRoomGameState
};
