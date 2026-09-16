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
    const handIndex = gameState.player.hand.indexOf(cardInstance);

    if(handIndex > -1) gameState.player.hand.splice(handIndex, 1);

    cardInstance.moveToLocation('monsterZone', zoneKey);
    cardInstance.changeBattlePosition('attack', true);
    gameState.player.monsterZones[zoneKey] = cardInstance;
}

export function setMonsterCard(gameState, cardInstance, zoneKey, isFaceUp = false){
    const handIndex = gameState.player.hand.indexOf(cardInstance);

    if(handIndex > -1) gameState.player.hand.splice(handIndex, 1);

    cardInstance.moveToLocation('monsterZone', zoneKey);
    cardInstance.changeBattlePosition('defence', isFaceUp);
    gameState.player.monsterZones[zoneKey] = cardInstance;
}
