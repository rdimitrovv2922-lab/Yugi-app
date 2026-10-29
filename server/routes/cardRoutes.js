const { cardCatalog, toClientCard } = require('../cards/cardCatalog');

async function handleCardRoute(request, response, url) {
    if (request.method === 'GET' && url.pathname === '/api/cards') {
        const query = (url.searchParams.get('q') || '').trim().toLowerCase();
        const idsQuery = url.searchParams.get('ids');

        if (idsQuery !== null) {
            const values = idsQuery.split(',');
            const cardIds = values.map(value => Number(value));
            const invalidIds =
                cardIds.length > 90 ||
                values.some((value, index) =>
                    value.trim() === '' ||
                    !Number.isSafeInteger(cardIds[index]) ||
                    cardIds[index] <= 0
                );

            if (invalidIds) {
                response.writeHead(400, { 'Content-Type': 'application/json' });
                response.end(JSON.stringify({ error: 'Invalid card IDs' }));
                return true;
            }

            const cards = [...new Set(cardIds)]
                .map(id => cardCatalog.get(id))
                .filter(Boolean)
                .map(toClientCard);

            response.writeHead(200, { 'Content-Type': 'application/json' });
            response.end(JSON.stringify({ cards }));
            return true;
        }

        if (query.length > 60) {
            response.writeHead(400, { 'Content-Type': 'application/json' });
            response.end(JSON.stringify({ error: 'Search query is too long' }));
            return true;
        }

        if (query.length < 2) {
            response.writeHead(200, { 'Content-Type': 'application/json' });
            response.end(JSON.stringify({ cards: [] }));
            return true;
        }

        const matches = [];

        for (const card of cardCatalog.values()) {
            if (
                typeof card.name === 'string' &&
                card.name.toLowerCase().includes(query)
            ) {
                matches.push(toClientCard(card));
            }
        }

        matches.sort((first, second) => first.name.localeCompare(second.name));

        response.writeHead(200, { 'Content-Type': 'application/json' });
        response.end(JSON.stringify({ cards: matches.slice(0, 20) }));
        return true;
    }
    return false;
}

module.exports = { handleCardRoute };
