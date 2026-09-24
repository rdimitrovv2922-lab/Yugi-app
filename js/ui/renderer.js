export function renderDeck(gameState) {
    const cardSlotDeck = document.getElementById('deck');
    cardSlotDeck.innerHTML = '';
    cardSlotDeck.removeAttribute('data-instance-id');

    const countOfCardsInDeck = gameState.player.deck.length;
    if( countOfCardsInDeck === 0 ) return;

    const card = gameState.player.deck[countOfCardsInDeck - 1];

    const img = document.createElement('img');
    img.src = "https://images-wixmp-ed30a86b8c4ca887773594c2.wixmp.com/f/3c938f85-f834-4bb3-b3b2-97d295769464/dal6wsb-fc4aaba4-d6ff-4029-a83f-9b518abd511d.png?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJ1cm46YXBwOjdlMGQxODg5ODIyNjQzNzNhNWYwZDQxNWVhMGQyNmUwIiwic3ViIjoidXJuOmFwcDo3ZTBkMTg4OTgyMjY0MzczYTVmMGQ0MTVlYTBkMjZlMCIsImF1ZCI6WyJ1cm46c2VydmljZTpmaWxlLmRvd25sb2FkIl0sIm9iaiI6W1t7InBhdGgiOiIvZi8zYzkzOGY4NS1mODM0LTRiYjMtYjNiMi05N2QyOTU3Njk0NjQvZGFsNndzYi1mYzRhYWJhNC1kNmZmLTQwMjktYTgzZi05YjUxOGFiZDUxMWQucG5nIn1dXX0._Al6plUB_BwuHO4MI18fPE6GgtgvtaTTUGRHdqVo0sg";
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
    img.src = "https://images-wixmp-ed30a86b8c4ca887773594c2.wixmp.com/f/3c938f85-f834-4bb3-b3b2-97d295769464/dal6wsb-fc4aaba4-d6ff-4029-a83f-9b518abd511d.png?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJ1cm46YXBwOjdlMGQxODg5ODIyNjQzNzNhNWYwZDQxNWVhMGQyNmUwIiwic3ViIjoidXJuOmFwcDo3ZTBkMTg4OTgyMjY0MzczYTVmMGQ0MTVlYTBkMjZlMCIsImF1ZCI6WyJ1cm46c2VydmljZTpmaWxlLmRvd25sb2FkIl0sIm9iaiI6W1t7InBhdGgiOiIvZi8zYzkzOGY4NS1mODM0LTRiYjMtYjNiMi05N2QyOTU3Njk0NjQvZGFsNndzYi1mYzRhYWJhNC1kNmZmLTQwMjktYTgzZi05YjUxOGFiZDUxMWQucG5nIn1dXX0._Al6plUB_BwuHO4MI18fPE6GgtgvtaTTUGRHdqVo0sg";
    img.alt = "Set card";

    cardSlotExtraDeck.appendChild(img);
    cardSlotExtraDeck.setAttribute('data-instance-id', card.instanceId);
}

export function renderMonsterZones(gameState) {
    Object.keys(gameState.player.monsterZones).forEach(zoneKey => {
        const card = gameState.player.monsterZones[zoneKey];
        const faceUpSlot = document.getElementById(zoneKey);
        const setSlot = document.getElementById(`${zoneKey}-set`);

        faceUpSlot.innerHTML = '';
        setSlot.innerHTML = '';
        faceUpSlot.removeAttribute('data-instance-id');
        setSlot.removeAttribute('data-instance-id');
        setSlot.classList.remove('full');

        if(!card) return;

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
                img.src = "https://images-wixmp-ed30a86b8c4ca887773594c2.wixmp.com/f/3c938f85-f834-4bb3-b3b2-97d295769464/dal6wsb-fc4aaba4-d6ff-4029-a83f-9b518abd511d.png?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJ1cm46YXBwOjdlMGQxODg5ODIyNjQzNzNhNWYwZDQxNWVhMGQyNmUwIiwic3ViIjoidXJuOmFwcDo3ZTBkMTg4OTgyMjY0MzczYTVmMGQ0MTVlYTBkMjZlMCIsImF1ZCI6WyJ1cm46c2VydmljZTpmaWxlLmRvd25sb2FkIl0sIm9iaiI6W1t7InBhdGgiOiIvZi8zYzkzOGY4NS1mODM0LTRiYjMtYjNiMi05N2QyOTU3Njk0NjQvZGFsNndzYi1mYzRhYWJhNC1kNmZmLTQwMjktYTgzZi05YjUxOGFiZDUxMWQucG5nIn1dXX0._Al6plUB_BwuHO4MI18fPE6GgtgvtaTTUGRHdqVo0sg";
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
            console.warn(`Spell/Trap DOM element not found for zoneKey: ${zoneKey}`);
            return;
        }

        cardSlot.innerHTML = '';
        cardSlot.removeAttribute('data-instance-id');

        if(!card) return;

        const img = document.createElement('img');
        if(!card.isFaceUp){
            img.src = "https://images-wixmp-ed30a86b8c4ca887773594c2.wixmp.com/f/3c938f85-f834-4bb3-b3b2-97d295769464/dal6wsb-fc4aaba4-d6ff-4029-a83f-9b518abd511d.png?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJ1cm46YXBwOjdlMGQxODg5ODIyNjQzNzNhNWYwZDQxNWVhMGQyNmUwIiwic3ViIjoidXJuOmFwcDo3ZTBkMTg4OTgyMjY0MzczYTVmMGQ0MTVlYTBkMjZlMCIsImF1ZCI6WyJ1cm46c2VydmljZTpmaWxlLmRvd25sb2FkIl0sIm9iaiI6W1t7InBhdGgiOiIvZi8zYzkzOGY4NS1mODM0LTRiYjMtYjNiMi05N2QyOTU3Njk0NjQvZGFsNndzYi1mYzRhYWJhNC1kNmZmLTQwMjktYTgzZi05YjUxOGFiZDUxMWQucG5nIn1dXX0._Al6plUB_BwuHO4MI18fPE6GgtgvtaTTUGRHdqVo0sg";
            img.alt = "Set card";
        } else {
            img.src = card.imageUrl;
            img.alt = card.name;
        }

        cardSlot.appendChild(img);
        cardSlot.setAttribute('data-instance-id', card.instanceId);
    });
}

export function renderPlayerHand(gameState) {
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
        img.src = "https://images-wixmp-ed30a86b8c4ca887773594c2.wixmp.com/f/3c938f85-f834-4bb3-b3b2-97d295769464/dal6wsb-fc4aaba4-d6ff-4029-a83f-9b518abd511d.png?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJ1cm46YXBwOjdlMGQxODg5ODIyNjQzNzNhNWYwZDQxNWVhMGQyNmUwIiwic3ViIjoidXJuOmFwcDo3ZTBkMTg4OTgyMjY0MzczYTVmMGQ0MTVlYTBkMjZlMCIsImF1ZCI6WyJ1cm46c2VydmljZTpmaWxlLmRvd25sb2FkIl0sIm9iaiI6W1t7InBhdGgiOiIvZi8zYzkzOGY4NS1mODM0LTRiYjMtYjNiMi05N2QyOTU3Njk0NjQvZGFsNndzYi1mYzRhYWJhNC1kNmZmLTQwMjktYTgzZi05YjUxOGFiZDUxMWQucG5nIn1dXX0._Al6plUB_BwuHO4MI18fPE6GgtgvtaTTUGRHdqVo0sg";
        img.alt = "Set card";
    }

    cardSlotBanish.appendChild(img);
    cardSlotBanish.setAttribute('data-instance-id', card.instanceId);
}

export function renderWindow(gameState, location) {
    console.log("In window render!");
    const window = document.getElementById('window-container');
    const windowIdentifier = document.getElementById('window-identifier');
    window.innerHTML = '';
    windowIdentifier.innerHTML = '';

    let target = null;

    switch (location) {
        case 'graveyard':
            windowIdentifier.textContent = "Graveyard";
            target = gameState.player.graveyard;
            console.log("In graveyard window render!");
            break;
        case 'banish':
            windowIdentifier.textContent = "Banish";
            target = gameState.player.banish;
            break;
        case 'deck':
            windowIdentifier.textContent = "Deck";
            target = gameState.player.deck; 
            break;
        case 'extradeck':
            windowIdentifier.textContent = "Extra Deck";
            target = gameState.player.extradeck;
            break;
    }

    const countOfCardsInTarget = target.length;
    if( countOfCardsInTarget === 0 ) return;

    target.forEach(card => {
        const cardSlot = document.createElement('div');
        cardSlot.classList.add('card-slot');

        cardSlot.setAttribute('data-instance-id', card.instanceId);

        const img = document.createElement('img');
        if (card.isFaceUp) {
            img.src = card.imageUrl;
            img.alt = card.name;
        } else {
            img.src = "https://images-wixmp-ed30a86b8c4ca887773594c2.wixmp.com/f/3c938f85-f834-4bb3-b3b2-97d295769464/dal6wsb-fc4aaba4-d6ff-4029-a83f-9b518abd511d.png?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJ1cm46YXBwOjdlMGQxODg5ODIyNjQzNzNhNWYwZDQxNWVhMGQyNmUwIiwic3ViIjoidXJuOmFwcDo3ZTBkMTg4OTgyMjY0MzczYTVmMGQ0MTVlYTBkMjZlMCIsImF1ZCI6WyJ1cm46c2VydmljZTpmaWxlLmRvd25sb2FkIl0sIm9iaiI6W1t7InBhdGgiOiIvZi8zYzkzOGY4NS1mODM0LTRiYjMtYjNiMi05N2QyOTU3Njk0NjQvZGFsNndzYi1mYzRhYWJhNC1kNmZmLTQwMjktYTgzZi05YjUxOGFiZDUxMWQucG5nIn1dXX0._Al6plUB_BwuHO4MI18fPE6GgtgvtaTTUGRHdqVo0sg";
            img.alt = "Set card";
        }

        cardSlot.appendChild(img);
        window.appendChild(cardSlot);
    });
}

export function renderBoard(gameState){
    renderDeck(gameState);
    renderExtraDeck(gameState);
    renderMonsterZones(gameState);
    renderSpellTrapZones(gameState);
    renderPlayerHand(gameState);
    renderGraveyard(gameState);
    renderBanish(gameState);
}