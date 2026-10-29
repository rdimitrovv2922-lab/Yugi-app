export function getLinkRatingDetail(cardData) {
    const linkRating = cardData?.linkval;
    const isLinkMonster = cardData?.frameType?.toLowerCase() === 'link' ||
        (linkRating !== undefined && linkRating !== null);

    return isLinkMonster ? `Link Rating: ${linkRating ?? '—'}` : null;
}

export function getLevelOrLinkDetail(cardData) {
    const linkRatingDetail = getLinkRatingDetail(cardData);
    if (linkRatingDetail) return linkRatingDetail;

    const level = cardData?.level;
    return level !== undefined && level !== null
        ? `Level / Rank: ${level}`
        : null;
}
