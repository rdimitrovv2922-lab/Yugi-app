const crypto = require('node:crypto');
const GameState = require('../../client/js/models/GameState.js').default;
const GameCard = require('../../client/js/models/GameCard.js').default;
const GameRules = require('../../client/js/core/GameRules.js');
const { cardCatalog, toClientCard } = require('../cards/cardCatalog');
function shuffleCards(cards) {
    for (let index = cards.length - 1; index > 0; index--) {
        const otherIndex = crypto.randomInt(index + 1);
        [cards[index], cards[otherIndex]] = [
            cards[otherIndex],
            cards[index]
        ];
    }
}

function createGameStateFromRoom(room) {
    if (!room || !Array.isArray(room.players) || room.players.length !== 2) {
        throw new Error('An active room must have exactly two players.');
    }

    const gameState = new GameState();
    const playersBySeat = [...room.players].sort(
        (first, second) => first.seat - second.seat
    );

    const gameSides = [
        { state: gameState.player, ownerRole: 'player1' },
        { state: gameState.opponent, ownerRole: 'player2' }
    ];

    for (let index = 0; index < playersBySeat.length; index++) {
        const roomPlayer = playersBySeat[index];
        const gameSide = gameSides[index];

        for (const entry of roomPlayer.cards) {
            if (entry.section === 'side') {
                continue;
            }

            const cardData = cardCatalog.get(entry.cardId);

            if (!cardData) {
                throw new Error(`Card ${entry.cardId} is missing from the catalog.`);
            }

            const pileName = entry.section === 'extra'
                ? 'extradeck'
                : 'deck';

            for (let copy = 0; copy < entry.quantity; copy++) {
                const card = new GameCard(cardData, gameSide.ownerRole);

                card.imageUrl = toClientCard(cardData).imageUrl;
                card.moveToLocation(pileName);
                card.changeVisibility(false);

                gameSide.state[pileName].push(card);
            }
        }

        shuffleCards(gameSide.state.deck);
    }

    for (const gameSide of gameSides) {
        for (let draw = 0; draw < 5; draw++) {
            GameRules.drawCard(gameSide.state);
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

        const attachedMaterial = zone.card?.attachedMaterials?.find(
            card => card.instanceId === instanceId
        );
        if (attachedMaterial) return attachedMaterial;
    }

    for (const card of Object.values(playerState.spellTrapZones)) {
        if (card?.instanceId === instanceId) return card;
        const attachedMaterial = card?.attachedMaterials?.find(
            material => material.instanceId === instanceId
        );
        if (attachedMaterial) return attachedMaterial;
    }

    return null;
}

function findCardOnEitherSide(gameState, instanceId) {
    const playerCard = findCard(gameState.player, instanceId);

    if (playerCard) {
        return {
            card: playerCard,
            playerState: gameState.player
        };
    }

    const opponentCard = findCard(gameState.opponent, instanceId);

    if (opponentCard) {
        return {
            card: opponentCard,
            playerState: gameState.opponent
        };
    }

    return null;
}

function restoreCardInstances(value) {
    if (Array.isArray(value)) {
        return value.map(restoreCardInstances);
    }

    if (!value || typeof value !== 'object') {
        return value;
    }

    if (value.instanceId && value.rawApiData) {
        const card = new GameCard(value.rawApiData, value.ownerRole ?? null);

        const properties = Object.fromEntries(
            Object.entries(value)
                .filter(([key]) => key !== 'ownerRole')
                .map(([key, item]) => [key, restoreCardInstances(item)])
        );

        return Object.assign(card, properties);
    }

    return Object.fromEntries(
        Object.entries(value).map(([key, item]) => [
            key,
            restoreCardInstances(item)
        ])
    );
}

function restoreGameState(savedState) {
    const restoredData = restoreCardInstances(savedState);
    return Object.assign(new GameState(), restoredData);
}

function createGameStateView(gameState, viewerRole) {
    function hideHiddenCards(value) {
        if (Array.isArray(value)) {
            return value.map(hideHiddenCards);
        }

        if (!value || typeof value !== 'object') {
            return value;
        }

        const safeValue = Object.fromEntries(
            Object.entries(value).map(([key, item]) => [
                key,
                hideHiddenCards(item)
            ])
        );

        const isCard = value.instanceId && value.rawApiData;
        const belongsToOpponent = value.ownerRole !== viewerRole;
        const isHidden = !value.isVisibleToOpponent || !value.isFaceUp;

        if (isCard && belongsToOpponent && isHidden) {
            delete safeValue.id;
            delete safeValue.rawApiData;
            safeValue.name = 'Hidden card';
            safeValue.type = '';
            safeValue.imageUrl = '';
            safeValue.isVisibleToOpponent = false;
        }

        return safeValue;
    }

    return hideHiddenCards(gameState);
}
module.exports = {
    createGameStateFromRoom,
    findCardOnEitherSide,
    restoreGameState,
    createGameStateView
};
