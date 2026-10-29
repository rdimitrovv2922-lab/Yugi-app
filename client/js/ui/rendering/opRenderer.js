import { CARD_BACK_URL } from '../cardAssets.js';
import { getLinkRatingDetail } from '../cardDetails.js';
export { CARD_BACK_URL };

import { updateHandContainerVisuals } from './renderer.js';

const mirrorZoneKey = (zoneKey) => {
    const map = {
        's1': 's5',
        's2': 's4',
        's3': 's3',
        's4': 's2',
        's5': 's1',
        's6': 's6',

        'm1': 'm5',
        'm2': 'm4',
        'm3': 'm3',
        'm4': 'm2',
        'm5': 'm1',
        'm6': 'm6',
        'm7': 'm7'
    };

    return map[zoneKey] || zoneKey; // Returns the mirrored key, or the original if not found
};

export function renderOpponentDeck(gameState) {
    const cardSlotDeck = document.getElementById('op-deck');
    cardSlotDeck.innerHTML = '';
    cardSlotDeck.removeAttribute('data-instance-id');

    const countOfCardsInDeck = gameState.opponent.deck.length;
    if( countOfCardsInDeck === 0 ) return;

    const card = gameState.opponent.deck[countOfCardsInDeck - 1];

    const img = document.createElement('img');
    img.src = CARD_BACK_URL;
    img.alt = "Set card";

    cardSlotDeck.appendChild(img);
    cardSlotDeck.setAttribute('data-instance-id', card.instanceId);
}

export function renderOpponentExtraDeck(gameState) {
     const cardSlotExtraDeck = document.getElementById('op-extradeck');
    cardSlotExtraDeck.innerHTML = '';
    cardSlotExtraDeck.removeAttribute('data-instance-id');

    const countOfCardsInExtraDeck = gameState.opponent.extradeck.length;
    if( countOfCardsInExtraDeck === 0 ) return;

    const card = gameState.opponent.extradeck[countOfCardsInExtraDeck - 1];

    const img = document.createElement('img');
    img.src = CARD_BACK_URL;
    img.alt = "Set card";

    cardSlotExtraDeck.appendChild(img);
    cardSlotExtraDeck.setAttribute('data-instance-id', card.instanceId);
}

export function renderOpponentMonsterZones(gameState) {
    Object.keys(gameState.opponent.monsterZones).forEach(zoneKey => {
        const zoneData = gameState.opponent.monsterZones[zoneKey];

        let faceUpId = null;
        let setId = null;
        let isReverse = false;

        if (zoneKey === 'm6') {
            faceUpId = 'm7';
            setId = 'm7-set';
            isReverse = true;
        } else if (zoneKey === 'm7') {
            faceUpId = 'm6';
            setId = 'm6-set';
            isReverse = true;
        } else {
            const mirrorKey = mirrorZoneKey(zoneKey);
            faceUpId = `op-${mirrorKey}`;
            setId = `op-${mirrorKey}-set`;
        }
        
        const faceUpSlot = document.getElementById(faceUpId);
        const setSlot = document.getElementById(setId);
        const monsterWrapper = faceUpSlot.closest('.monster-slot-wrapper');

        if ((zoneKey === 'm6' || zoneKey === 'm7') && !zoneData?.card) {
            const sharedOwnZoneKey = zoneKey === 'm6' ? 'm7' : 'm6';
            if (gameState.player.monsterZones[sharedOwnZoneKey]?.card) {
                monsterWrapper?.querySelector('.atk-def-indicator-opp')?.remove();
                return;
            }
        }

        monsterWrapper?.querySelector('.atk-def-indicator-opp')?.remove();
        if(monsterWrapper) console.log('Atk/Def indicator removed from monsterWrapper:', monsterWrapper.id);
        else console.warn('Monster wrapper not found for faceUpSlot:', faceUpId);

        faceUpSlot.innerHTML = '';
        setSlot.innerHTML = '';
        faceUpSlot.removeAttribute('data-instance-id');
        setSlot.removeAttribute('data-instance-id');
        setSlot.classList.remove('full');

        if (!zoneData || !zoneData.card) return;

        const card = zoneData.card;

        if(card.isFaceUp) {
            const cardData = card.rawApiData || {};
            const indicator = document.createElement('div');
            indicator.className = 'atk-def-indicator-opp';
            indicator.textContent = getLinkRatingDetail(cardData) ||
                `${cardData.atk ?? '?'} / ${cardData.def ?? '?'}`;

            monsterWrapper?.appendChild(indicator);
        }

        if(card.isPositionAttack) {
            const img = document.createElement('img');
            img.src = card.imageUrl;
            img.alt = card.name;
            if (card.isToken) img.classList.add('token-img');
            faceUpSlot.appendChild(img);
            faceUpSlot.setAttribute('data-instance-id', card.instanceId);

            if(isReverse) faceUpSlot.classList.add('reverse');
        } else {
            const img = document.createElement('img');

            if(!card.isFaceUp)
            {
                img.src = CARD_BACK_URL;
                img.alt = "Set card";
            } else {
                img.src = card.imageUrl;
                img.alt = card.name;
            }

            if (card.isToken) img.classList.add('token-img');

            setSlot.appendChild(img);
            setSlot.setAttribute('data-instance-id', card.instanceId);
            setSlot.classList.add('full');

            if(isReverse) setSlot.classList.add('reverse');
        }
    });
}

export function renderOpponentSpellTrapZones(gameState){
    Object.keys(gameState.opponent.spellTrapZones).forEach(zoneKey => {
        const card = gameState.opponent.spellTrapZones[zoneKey];
        
        const mirrorKey = mirrorZoneKey(zoneKey);
        const cardSlot = document.getElementById(`op-${mirrorKey}`);

        if (!cardSlot) {
            console.warn(`DEBUG -> Original zoneKey: "${zoneKey}" became mirrored: "${mirrorKey}", looking for element ID: "op-${mirrorKey}"`);
            return;
        }

        cardSlot.innerHTML = '';
        cardSlot.removeAttribute('data-instance-id');

        if(!card) return;

        const img = document.createElement('img');
        if(!card.isFaceUp){
            img.src = CARD_BACK_URL;
            img.alt = "Set card";
        } else {
            img.src = card.imageUrl;
            img.alt = card.name;
        }

        cardSlot.appendChild(img);
        cardSlot.setAttribute('data-instance-id', card.instanceId);
    });
}

export function renderOpponentHand(gameState) {
    const handContainer = document.getElementById('op-hand');
    handContainer.innerHTML = '';

    gameState.opponent.hand.forEach(card => {
        const cardSlot = document.createElement('div');
        cardSlot.classList.add('card-slot');

        cardSlot.setAttribute('data-instance-id', card.instanceId);

        const img = document.createElement('img');

        if (card.isVisibleToOpponent) {
            img.src = card.imageUrl;
            img.alt = card.name;
        } else {
            img.src = CARD_BACK_URL;
            img.alt = "Set card";
        }

        cardSlot.appendChild(img);
        handContainer.appendChild(cardSlot);
    });

    updateHandContainerVisuals('op-hand');
}

export function renderOpponentGraveyard(gameState) {
    const cardSlotGraveyard = document.getElementById('op-graveyard');
    cardSlotGraveyard.innerHTML = '';
    cardSlotGraveyard.removeAttribute('data-instance-id');

    const countOfCardsInGraveyard = gameState.opponent.graveyard.length;
    if( countOfCardsInGraveyard === 0 ) return;

    const card = gameState.opponent.graveyard[countOfCardsInGraveyard - 1];

    const img = document.createElement('img');
    img.src = card.imageUrl;
    img.alt = card.name;
    cardSlotGraveyard.appendChild(img);
    cardSlotGraveyard.setAttribute('data-instance-id', card.instanceId);
}

export function renderOpponentBanish(gameState) {
    const cardSlotBanish = document.getElementById('op-banish');
    cardSlotBanish.innerHTML = '';
    cardSlotBanish.removeAttribute('data-instance-id');

    const countOfCardsInBanish = gameState.opponent.banish.length;
    if( countOfCardsInBanish === 0 ) return;

    const card = gameState.opponent.banish[countOfCardsInBanish - 1];

    const img = document.createElement('img');
    if (card.isFaceUp) {
        img.src = card.imageUrl;
        img.alt = card.name;
    } else {
        img.src = CARD_BACK_URL;
        img.alt = "Set card";
    }

    cardSlotBanish.appendChild(img);
    cardSlotBanish.setAttribute('data-instance-id', card.instanceId);
}

export function renderOpponentBoard(gameState) {
    renderOpponentDeck(gameState);
    renderOpponentExtraDeck(gameState);
    renderOpponentMonsterZones(gameState);
    renderOpponentSpellTrapZones(gameState);
    renderOpponentHand(gameState);
    renderOpponentGraveyard(gameState);
    renderOpponentBanish(gameState);
}
