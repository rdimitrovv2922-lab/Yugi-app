const { randomUUID } = require('node:crypto');
const db = require('../storage/db');

const insertDeck = db.prepare(`
    INSERT INTO decks (id, user_id, name)
    VALUES (?, ?, ?)
`);

const insertDeckCard = db.prepare(`
    INSERT INTO deck_cards (deck_id, card_id, section, quantity)
    VALUES (?, ?, ?, ?)
`);

const findOwnedDeck = db.prepare(`
    SELECT id
    FROM decks
    WHERE id = ? AND user_id = ?
`);

const updateDeckName = db.prepare(`
    UPDATE decks
    SET name = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ? AND user_id = ?
`);

const deleteDeckCards = db.prepare(`
    DELETE FROM deck_cards
    WHERE deck_id = ?
`);

const findDecksByUserId = db.prepare(`
    SELECT
        decks.id AS deck_id,
        decks.name AS deck_name,
        decks.created_at,
        deck_cards.card_id,
        deck_cards.section,
        deck_cards.quantity
    FROM decks
    LEFT JOIN deck_cards ON deck_cards.deck_id = decks.id
    WHERE decks.user_id = ?
    ORDER BY decks.created_at DESC, deck_cards.section, deck_cards.card_id
`);

function createDeck({ userId, name, cards }) {
    const deckId = randomUUID();

    db.exec('BEGIN');

    try {
        insertDeck.run(deckId, userId, name);

        for (const card of cards) {
            insertDeckCard.run(
                deckId,
                card.cardId,
                card.section,
                card.quantity
            );
        }

        db.exec('COMMIT');
        return deckId;
    } catch (error) {
        db.exec('ROLLBACK');
        throw error;
    }
}

function updateDeck({ deckId, userId, name, cards }) {
    if (!findOwnedDeck.get(deckId, userId)) {
        return false;
    }

    db.exec('BEGIN');

    try {
        updateDeckName.run(name, deckId, userId);
        deleteDeckCards.run(deckId);

        for (const card of cards) {
            insertDeckCard.run(
                deckId,
                card.cardId,
                card.section,
                card.quantity
            );
        }

        db.exec('COMMIT');
        return true;
    } catch (error) {
        db.exec('ROLLBACK');
        throw error;
    }
}

function getDecksForUser(userId) {
    const rows = findDecksByUserId.all(userId);
    const decksById = new Map();

    for (const row of rows) {
        let deck = decksById.get(row.deck_id);

        if (!deck) {
            deck = {
                id: row.deck_id,
                name: row.deck_name,
                createdAt: row.created_at,
                cards: []
            };
            decksById.set(row.deck_id, deck);
        }

        if (row.card_id !== null) {
            deck.cards.push({
                cardId: row.card_id,
                section: row.section,
                quantity: row.quantity
            });
        }
    }

    return [...decksById.values()];
}

module.exports = {
    createDeck,
    updateDeck,
    getDecksForUser
};
