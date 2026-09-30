export const CARD_BACK_URL = "https://images-wixmp-ed30a86b8c4ca887773594c2.wixmp.com/f/3c938f85-f834-4bb3-b3b2-97d295769464/dal6wsb-fc4aaba4-d6ff-4029-a83f-9b518abd511d.png?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJ1cm46YXBwOjdlMGQxODg5ODIyNjQzNzNhNWYwZDQxNWVhMGQyNmUwIiwic3ViIjoidXJuOmFwcDo3ZTBkMTg4OTgyMjY0MzczYTVmMGQ0MTVlYTBkMjZlMCIsImF1ZCI6WyJ1cm46c2VydmljZTpmaWxlLmRvd25sb2FkIl0sIm9iaiI6W1t7InBhdGgiOiIvZi8zYzkzOGY4NS1mODM0LTRiYjMtYjNiMi05N2QyOTU3Njk0NjQvZGFsNndzYi1mYzRhYWJhNC1kNmZmLTQwMjktYTgzZi05YjUxOGFiZDUxMWQucG5nIn1dXX0._Al6plUB_BwuHO4MI18fPE6GgtgvtaTTUGRHdqVo0sg";

import { updateHandContainerVisuals } from './renderer.js';

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
            if (gameState.opponent.monsterZones['m6'].card) {
                faceUpId = 'm6';
                setId = 'm6-set';
                isReverse = true;
            } else return;
        } else if (zoneKey === 'm7') {
            if (gameState.opponent.monsterZones['m7'].card) {
                faceUpId = 'm7'; 
                setId = 'm7-set'; 
                isReverse = true;
            }
            else return;
        } else {
            faceUpId = `op-${zoneKey}`;
            setId = `op-${zoneKey}-set`;
        }
        
        const faceUpSlot = document.getElementById(faceUpId);
        const setSlot = document.getElementById(setId);

        faceUpSlot.innerHTML = '';
        setSlot.innerHTML = '';
        faceUpSlot.removeAttribute('data-instance-id');
        setSlot.removeAttribute('data-instance-id');
        setSlot.classList.remove('full');

        if (!zoneData || !zoneData.card) return;

        const card = zoneData.card;

        if(card.isPositionAttack) {
            const img = document.createElement('img');
            img.src = card.imageUrl;
            img.alt = card.name;
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
        const cardSlot = document.getElementById(`op-${zoneKey}`);

        if (!cardSlot) {
            console.warn(`Spell/Trap DOM element not found for zoneKey: op-${zoneKey}`);
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

        if (card.isRevealedToOpponent) {
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
