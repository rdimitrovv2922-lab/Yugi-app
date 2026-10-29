const fs = require('node:fs');
const path = require('node:path');

const cardCatalogData = JSON.parse(
    fs.readFileSync(path.join(__dirname, '..', 'data', 'cards.json'), 'utf8')
);

const cardCatalog = new Map(
    cardCatalogData.data.map(card => [card.id, card])
);
function toClientCard(card) {
    const cardImage = Array.isArray(card.card_images)
        ? card.card_images.find(image => image.id === card.id) || card.card_images[0]
        : null;

    return {
        id: card.id,
        name: card.name,
        type: card.type,
        frameType: card.frameType,
        desc: card.desc,
        attribute: card.attribute,
        race: card.race,
        level: card.level,
        atk: card.atk,
        def: card.def,
        scale: card.scale,
        linkval: card.linkval,
        imageUrl: cardImage?.image_url || '',
        thumbnailUrl: cardImage?.image_url_small || cardImage?.image_url || ''
    };
}
module.exports = { cardCatalog, toClientCard };
