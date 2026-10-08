import { CARD_BACK_URL, renderOpponentBoard } from './opRenderer.js';

export function renderDeck(gameState) {
    const cardSlotDeck = document.getElementById('deck');
    cardSlotDeck.innerHTML = '';
    cardSlotDeck.removeAttribute('data-instance-id');

    const countOfCardsInDeck = gameState.player.deck.length;
    if( countOfCardsInDeck === 0 ) return;

    const card = gameState.player.deck[countOfCardsInDeck - 1];

    const img = document.createElement('img');
    img.src = CARD_BACK_URL;
    img.alt = "Set card";

    cardSlotDeck.appendChild(img);
    cardSlotDeck.setAttribute('data-instance-id', card.instanceId);
}

export function renderExtraDeck(gameState) {
    const cardSlotExtraDeck = document.getElementById('extradeck');
    cardSlotExtraDeck.innerHTML = '';
    cardSlotExtraDeck.removeAttribute('data-instance-id');

    const countOfCardsInExtraDeck = gameState.player.extradeck.length;
    if( countOfCardsInExtraDeck === 0 ) return;

    const card = gameState.player.extradeck[countOfCardsInExtraDeck - 1];

    const img = document.createElement('img');
    img.src = CARD_BACK_URL;
    img.alt = "Set card";

    cardSlotExtraDeck.appendChild(img);
    cardSlotExtraDeck.setAttribute('data-instance-id', card.instanceId);
}

export function renderMonsterZones(gameState) {
    Object.keys(gameState.player.monsterZones).forEach(zoneKey => {
        const zoneData = gameState.player.monsterZones[zoneKey];

        let faceUpId = zoneKey;
        let setId = `${zoneKey}-set`;
        let isReverse = false;

        if (zoneKey === 'm6' && gameState.player.monsterZones['m6'].card) {
            faceUpId = 'm6';
            setId = 'm6-set'; 
            isReverse = true;
        } else if (zoneKey === 'm7' && gameState.player.monsterZones['m7'].card) { 
            faceUpId = 'm7'; 
            setId = 'm7-set'; 
            isReverse = true;
        }
        
        const faceUpSlot = document.getElementById(faceUpId);
        const setSlot = document.getElementById(setId);

        faceUpSlot.innerHTML = '';
        setSlot.innerHTML = '';
        faceUpSlot.removeAttribute('data-instance-id');
        setSlot.removeAttribute('data-instance-id');
        setSlot.classList.remove('full');

        if (isReverse){
            setSlot.classList.remove('reverse');
            faceUpSlot.classList.remove('reverse');
        }

        if (!zoneData || !zoneData.card) return;

        const card = zoneData.card;

        if(card.isPositionAttack) {
            const img = document.createElement('img');
            img.src = card.imageUrl;
            img.alt = card.name;
            faceUpSlot.appendChild(img);
            faceUpSlot.setAttribute('data-instance-id', card.instanceId);
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
        }
    });
}

export function renderSpellTrapZones(gameState){
    Object.keys(gameState.player.spellTrapZones).forEach(zoneKey => {
        const card = gameState.player.spellTrapZones[zoneKey];
        const cardSlot = document.getElementById(zoneKey);

        if (!cardSlot) {
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

export function renderHand(gameState) {
    const handContainer = document.getElementById('player-hand');
    handContainer.innerHTML = '';

    gameState.player.hand.forEach(card => {
        const cardSlot = document.createElement('div');
        cardSlot.classList.add('card-slot');

        cardSlot.setAttribute('data-instance-id', card.instanceId);

        const img = document.createElement('img');
        img.src = card.imageUrl;
        img.alt = card.name;
        cardSlot.appendChild(img);

        handContainer.appendChild(cardSlot);
    });

    updateHandContainerVisuals('player-hand');
}

export function updateHandContainerVisuals(handId) {
    const handContainer = document.getElementById(handId);
    if (!handContainer) return;

    const cardSlots = handContainer.querySelectorAll('.card-slot');
    const totalCards = cardSlots.length;
    if (totalCards === 0) return;

    cardSlots.forEach(card => card.style.marginLeft = '0px');
    const cardWidth = cardSlots[0].offsetWidth;
    const gap = 10;
    const maxWidth = handContainer.clientWidth;

    const totalWidth = (cardWidth * totalCards) + (gap * (totalCards - 1));
    if (totalWidth > maxWidth) {
        const totalOverlapNeeded = totalWidth - maxWidth;
        const overlapPerCard = totalOverlapNeeded / (totalCards - 1);

        cardSlots.forEach((slot, index) => {
            if (index > 0) {
                slot.style.marginLeft = `-${cardWidth - (cardWidth - overlapPerCard)}px`;
            }
        });
    }
}

export function renderGraveyard(gameState) {
    const cardSlotGraveyard = document.getElementById('graveyard');
    cardSlotGraveyard.innerHTML = '';
    cardSlotGraveyard.removeAttribute('data-instance-id');

    const countOfCardsInGraveyard = gameState.player.graveyard.length;
    if( countOfCardsInGraveyard === 0 ) return;

    const card = gameState.player.graveyard[countOfCardsInGraveyard - 1];

    const img = document.createElement('img');
    img.src = card.imageUrl;
    img.alt = card.name;
    cardSlotGraveyard.appendChild(img);
    cardSlotGraveyard.setAttribute('data-instance-id', card.instanceId);
}

export function renderBanish(gameState) {
    const cardSlotBanish = document.getElementById('banish');
    cardSlotBanish.innerHTML = '';
    cardSlotBanish.removeAttribute('data-instance-id');

    const countOfCardsInBanish = gameState.player.banish.length;
    if( countOfCardsInBanish === 0 ) return;

    const card = gameState.player.banish[countOfCardsInBanish - 1];

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

export function renderWindow(gameState, cardInstance, isOwnerPlayer) {
    const window = document.getElementById('window-container');
    const windowIdentifier = document.getElementById('window-identifier');
    window.innerHTML = '';
    windowIdentifier.innerHTML = '';

    let playerState = null;
    if (isOwnerPlayer) playerState = gameState.player;
    else playerState = gameState.opponent;

    let target = null;

    const location = cardInstance.location;

    switch (location) {
        case 'monsterZone':
            windowIdentifier.textContent = "Materials";
            target = playerState.monsterZones[cardInstance.zoneKey].materials;
            break;
        case 'graveyard':
            windowIdentifier.textContent = "Graveyard";
            target = playerState.graveyard;
            break;
        case 'banish':
            windowIdentifier.textContent = "Banish";
            target = playerState.banish;
            break;
        case 'deck':
            windowIdentifier.textContent = "Deck";
            target = playerState.deck; 
            break;
        case 'extradeck':
            windowIdentifier.textContent = "Extra Deck";
            target = playerState.extradeck;
            break;
    }

    if (!target || target.length === 0) return;

    target.forEach(card => {
        const cardSlot = document.createElement('div');
        cardSlot.classList.add('card-slot');

        cardSlot.setAttribute('data-instance-id', card.instanceId);

        const img = document.createElement('img');
        if (!card.isFaceUp || (!isOwnerPlayer && !card.isVisibleToOpponent)) {
            img.src = CARD_BACK_URL;
            img.alt = "Set card";
        } else {
           
            img.src = card.imageUrl;
            img.alt = card.name;
        }

        cardSlot.appendChild(img);
        window.appendChild(cardSlot);
    });

    applyTargetedCardClasses(gameState);
}

function applyTargetedCardClasses(gameState) {
    const viewerRole = gameState.viewerRole;
    if (!viewerRole) return;

    const otherRole = viewerRole === 'player1' ? 'player2' : 'player1';
    const targetClasses = ['target', 'target-opp', 'target-both'];

    document.querySelectorAll('.target, .target-opp, .target-both').forEach(element => {
        element.classList.remove(...targetClasses);
    });

    const cardsById = new Map();

    function rememberCard(card) {
        if (card?.instanceId) {
            cardsById.set(card.instanceId, card);
        }
    }

    function collectCards(playerState) {
        for (const pileName of ['deck', 'extradeck', 'graveyard', 'banish', 'hand']) {
            (playerState[pileName] || []).forEach(rememberCard);
        }

        for (const zone of Object.values(playerState.monsterZones || {})) {
            rememberCard(zone?.card);
            (zone?.materials || []).forEach(rememberCard);
        }

        Object.values(playerState.spellTrapZones || {}).forEach(rememberCard);
    }

    collectCards(gameState.player);
    collectCards(gameState.opponent);

    function applyTargetClasses(element, targetedBy) {
        if (!element) return;

        const byViewer = targetedBy.includes(viewerRole);
        const byOpponent = targetedBy.includes(otherRole);

        if (byViewer && byOpponent) {
            element.classList.add('target-both');
        } else if (byViewer) {
            element.classList.add('target');
        } else if (byOpponent) {
            element.classList.add('target-opp');
        }
    }

    const pileSlots = [
        ['graveyard', gameState.player.graveyard],
        ['banish', gameState.player.banish],
        ['op-graveyard', gameState.opponent.graveyard],
        ['op-banish', gameState.opponent.banish]
    ];

    const pileSlotIds = new Set(pileSlots.map(([id]) => id));

    document.querySelectorAll('[data-instance-id]').forEach(element => {
        // Highlight individual cards in the window, but handle pile slots below.
        if (pileSlotIds.has(element.id)) return;

        const card = cardsById.get(element.getAttribute('data-instance-id'));
        applyTargetClasses(element, card?.targetedBy || []);
    });

    for (const [slotId, cards] of pileSlots) {
        const pileTargeters = new Set();

        for (const card of cards || []) {
            for (const role of card.targetedBy || []) {
                pileTargeters.add(role);
            }
        }

        applyTargetClasses(
            document.getElementById(slotId),
            [...pileTargeters]
        );
    }
}

export function renderBoard(gameState){
    renderDeck(gameState);
    renderExtraDeck(gameState);
    renderMonsterZones(gameState);
    renderSpellTrapZones(gameState);
    renderHand(gameState);
    renderGraveyard(gameState);
    renderBanish(gameState);

    renderOpponentBoard(gameState);

    applyTargetedCardClasses(gameState);
}
