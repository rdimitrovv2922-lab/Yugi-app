function removeCardFromSource(gameState, cardInstance, sourceLocation){
    switch(sourceLocation) {
        case 'hand':
            const handIndex = gameState.player.hand.indexOf(cardInstance);
            if (handIndex > -1) gameState.player.hand.splice(handIndex, 1);
            break;
        case 'deck':
            const deckIndex = gameState.player.deck.indexOf(cardInstance);
            if (deckIndex > -1) gameState.player.deck.splice(deckIndex, 1);
            break;
        case 'extradeck':
            const extradeckIndex = gameState.player.extradeck.indexOf(cardInstance);
            if (extradeckIndex > -1) gameState.player.extradeck.splice(extradeckIndex, 1);
            break;
        case 'graveyard':
            const graveyardIndex = gameState.player.graveyard.indexOf(cardInstance);
            if (graveyardIndex > -1) gameState.player.graveyard.splice(graveyardIndex, 1);
            break;
        case 'banish':
            const banishIndex = gameState.player.banish.indexOf(cardInstance);
            if (banishIndex > -1) gameState.player.banish.splice(banishIndex, 1);
            break;
        case 'monsterZone':
            const monsterZoneIndex = cardInstance.zoneKey;
            if (monsterZoneIndex) gameState.player.monsterZones[monsterZoneIndex] = null;
            break;
        case 'spellTrapZone':
            const spellTrapZoneIndex = cardInstance.zoneKey;
            if (spellTrapZoneIndex) gameState.player.spellTrapZones[spellTrapZoneIndex] = null;
            break;
    }

    cardInstance.returnToDefault();
}

export function drawCard(gameState){
    if(gameState.player.deck.length === 0) {
        console.log("Deck is empty!");
        return;
    }

    const cardInstance = gameState.player.deck.pop();

    cardInstance.moveToLocation('hand');
    gameState.player.hand.push(cardInstance);
}

export function summonMonsterCard(gameState, cardInstance, zoneKey){
    removeCardFromSource(gameState, cardInstance, cardInstance.location);

    cardInstance.moveToLocation('monsterZone', zoneKey);
    cardInstance.setIsPositionAttack(true);
    gameState.player.monsterZones[zoneKey] = cardInstance;
}

export function setMonsterCard(gameState, cardInstance, zoneKey, isFaceUp){
    removeCardFromSource(gameState, cardInstance, cardInstance.location);

    cardInstance.moveToLocation('monsterZone', zoneKey);
    cardInstance.setIsPositionAttack(false);
    cardInstance.setIsFaceUp(isFaceUp);
    gameState.player.monsterZones[zoneKey] = cardInstance;
}

export function activateSpellTrapCard(gameState, cardInstance, zoneKey, isFaceUp){
    removeCardFromSource(gameState, cardInstance, cardInstance.location);

    cardInstance.moveToLocation('spellTrapZone', zoneKey);
    cardInstance.setIsFaceUp(isFaceUp);
    gameState.player.spellTrapZones[zoneKey] = cardInstance;
}

export function sendCardToGraveyard(gameState, cardInstance) {
    removeCardFromSource(gameState, cardInstance, cardInstance.location);

    cardInstance.moveToLocation('graveyard');
    gameState.player.graveyard.push(cardInstance);
}

export function sendCardToBanish(gameState, cardInstance) {
    removeCardFromSource(gameState, cardInstance, cardInstance.location);

    cardInstance.moveToLocation('banish');
    gameState.player.banish.push(cardInstance);
}

export function sendCardToDeck(gameState, cardInstance) {
    removeCardFromSource(gameState, cardInstance, cardInstance.location);

    cardInstance.moveToLocation('deck');
    gameState.player.deck.push(cardInstance);
}

export function sendCardToExtraDeck(gameState, cardInstance) {
    removeCardFromSource(gameState, cardInstance, cardInstance.location);

    cardInstance.moveToLocation('extradeck');
    gameState.player.extradeck.push(cardInstance);
}

export function sendCardToHand(gameState, cardInstance) {
    removeCardFromSource(gameState, cardInstance, cardInstance.location);

    cardInstance.moveToLocation('hand');
    gameState.player.hand.push(cardInstance);
}

export function switchBattlePositionToAtk(gameState, cardInstance) {
    cardInstance.setIsPositionAttack(true);
    cardInstance.setIsFaceUp(true);
}

export function switchBattlePositionToDef(gameState, cardInstance, isFaceUp=true) {
    cardInstance.setIsPositionAttack(false);
    cardInstance.setIsFaceUp(isFaceUp);
}

export function flipCard(gameState, cardInstance) {
    cardInstance.setIsFaceUp(!cardInstance.isFaceUp);
}