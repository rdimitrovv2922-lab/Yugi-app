const { createDeck, updateDeck, getDecksForUser } = require('../decks/deckStore');
const { validateDeckCards } = require('../decks/validation');
const { cardCatalog } = require('../cards/cardCatalog');
const { readJsonBody } = require('../http/requestBody');
const { getSignedInUser } = require('../auth/sessions');

async function handleDeckRoute(request, response, url) {
    if (request.method === 'GET' && url.pathname === '/api/decks') {
        const user = getSignedInUser(request);

        if (!user) {
            response.writeHead(401, { 'Content-Type': 'application/json' });
            response.end(JSON.stringify({ error: 'Not signed in' }));
            return true;
        }

        const decks = getDecksForUser(user.id);
        response.writeHead(200, { 'Content-Type': 'application/json' });
        response.end(JSON.stringify({ decks }));
        return true;
    }

    if (request.method === 'POST' && url.pathname === '/api/decks') {
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
            response.end(JSON.stringify({ error: 'Invalid deck data' }));
            return true;
        }

        const name = typeof payload.name === 'string' ? payload.name.trim() : '';

        if (name.length < 1 || name.length > 40) {
            response.writeHead(400, { 'Content-Type': 'application/json' });
            response.end(JSON.stringify({ error: 'Deck name must be 1–40 characters' }));
            return true;
        }

        const errors = validateDeckCards(payload.cards, cardCatalog);

        if (errors.length > 0) {
            response.writeHead(400, { 'Content-Type': 'application/json' });
            response.end(JSON.stringify({ error: 'Deck is invalid', details: errors }));
            return true;
        }

        const cards = payload.cards.map(({ cardId, section, quantity }) => ({
            cardId,
            section,
            quantity
        }));

        try {
            const deckId = createDeck({
                userId: user.id,
                name,
                cards
            });

            response.writeHead(201, { 'Content-Type': 'application/json' });
            response.end(JSON.stringify({
                deck: {
                    id: deckId,
                    name,
                    cards
                }
            }));
        } catch {
            response.writeHead(500, { 'Content-Type': 'application/json' });
            response.end(JSON.stringify({ error: 'Could not save deck' }));
        }

        return true;
    }

    const deckUpdateMatch = url.pathname.match(
        /^\/api\/decks\/([0-9a-f-]+)$/i
    );

    if (request.method === 'PUT' && deckUpdateMatch) {
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
            response.end(JSON.stringify({ error: 'Invalid deck data' }));
            return true;
        }

        const name = typeof payload.name === 'string' ? payload.name.trim() : '';

        if (name.length < 1 || name.length > 40) {
            response.writeHead(400, { 'Content-Type': 'application/json' });
            response.end(JSON.stringify({ error: 'Deck name must be 1–40 characters' }));
            return true;
        }

        const errors = validateDeckCards(payload.cards, cardCatalog);

        if (errors.length > 0) {
            response.writeHead(400, { 'Content-Type': 'application/json' });
            response.end(JSON.stringify({ error: 'Deck is invalid', details: errors }));
            return true;
        }

        const deckId = deckUpdateMatch[1];
        const cards = payload.cards.map(({ cardId, section, quantity }) => ({
            cardId,
            section,
            quantity
        }));

        try {
            const wasUpdated = updateDeck({
                deckId,
                userId: user.id,
                name,
                cards
            });

            if (!wasUpdated) {
                response.writeHead(404, { 'Content-Type': 'application/json' });
                response.end(JSON.stringify({ error: 'Deck not found' }));
                return true;
            }

            response.writeHead(200, { 'Content-Type': 'application/json' });
            response.end(JSON.stringify({
                deck: {
                    id: deckId,
                    name,
                    cards
                }
            }));
        } catch {
            response.writeHead(500, { 'Content-Type': 'application/json' });
            response.end(JSON.stringify({ error: 'Could not update deck' }));
        }

        return true;
    }
    return false;
}

module.exports = { handleDeckRoute };
