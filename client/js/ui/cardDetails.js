function isLinkMonster(cardData) {
    const linkRating = cardData?.linkval;
    return cardData?.frameType?.toLowerCase() === 'link' ||
        (linkRating !== undefined && linkRating !== null);
}

export function getLinkRatingDetail(cardData) {
    return isLinkMonster(cardData)
        ? `Link Rating: ${cardData.linkval ?? '—'}`
        : null;
}

export function getAttackDefenseDisplay(cardData) {
    const attack = cardData?.atk ?? '?';

    if (isLinkMonster(cardData)) {
        return `${attack} / L${cardData?.linkval ?? '—'}`;
    }

    return `${attack} / ${cardData?.def ?? '?'}`;
}

export function getLevelOrLinkDetail(cardData) {
    const linkRatingDetail = getLinkRatingDetail(cardData);
    if (linkRatingDetail) return linkRatingDetail;

    const level = cardData?.level;
    return level !== undefined && level !== null
        ? `Level / Rank: ${level}`
        : null;
}
