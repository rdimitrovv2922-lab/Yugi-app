const EXTRA_DECK_TYPES = new Set([
    'fusion',
    'synchro',
    'xyz',
    'link'
]);

const MAX_COPIES_PER_CARD = 3;

function isExtraDeckMonster(card) {
    const frameType = card.frameType.replace(/_pendulum$/, '');
    return EXTRA_DECK_TYPES.has(frameType);
}

function validateDeckCards(cards, cardCatalog) {
    const errors = [];

    if (!Array.isArray(cards)) {
        return ['Deck cards must be provided as an array.'];
    }

    const sectionSizes = {
        main: 0,
        extra: 0,
        side: 0
    };
    const copiesByCardId = new Map();
    const seenCardSections = new Set();

    for (const entry of cards) {
        if (!entry || typeof entry !== 'object') {
            errors.push('Each deck entry must be an object.');
            continue;
        }

        const { cardId, section, quantity } = entry;

        if (!Number.isSafeInteger(cardId)) {
            errors.push('Each card must have a valid numeric card ID.');
            continue;
        }

        const card = cardCatalog.get(cardId);

        if (!card) {
            errors.push(`Card ID ${cardId} is not in the card catalog.`);
            continue;
        }

        if (!['main', 'extra', 'side'].includes(section)) {
            errors.push(`Card "${card.name}" has an invalid deck section.`);
            continue;
        }

        if (!Number.isSafeInteger(quantity) || quantity < 1) {
            errors.push(`Card "${card.name}" must have a positive whole-number quantity.`);
            continue;
        }

        const cardSectionKey = `${cardId}:${section}`;

        if (seenCardSections.has(cardSectionKey)) {
            errors.push(`"${card.name}" appears more than once in the ${section} section.`);
            continue;
        }

        seenCardSections.add(cardSectionKey);
        sectionSizes[section] += quantity;
        const currentCopies = copiesByCardId.get(cardId) || 0;
        copiesByCardId.set(cardId, currentCopies + quantity);

        if (section === 'extra' && !isExtraDeckMonster(card)) {
            errors.push(`"${card.name}" cannot be placed in the Extra Deck.`);
        }

        if (section === 'main' && isExtraDeckMonster(card)) {
            errors.push(`"${card.name}" must be placed in the Extra Deck.`);
        }
    }

    if (sectionSizes.main < 40 || sectionSizes.main > 60) {
        errors.push('The Main Deck must contain 40–60 cards.');
    }

    if (sectionSizes.extra > 15) {
        errors.push('The Extra Deck cannot contain more than 15 cards.');
    }

    if (sectionSizes.side > 15) {
        errors.push('The Side Deck cannot contain more than 15 cards.');
    }

    for (const [cardId, quantity] of copiesByCardId) {
        if (quantity > MAX_COPIES_PER_CARD) {
            const card = cardCatalog.get(cardId);
            errors.push(
                `You can include at most 3 copies of "${card.name}" across Main, Extra, and Side.`
            );
        }
    }

    return errors;
}

module.exports = {
    validateDeckCards
};
