function removeCardFromSource(gameState, cardInstance, sourceLocation = cardInstance.location){
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
            if (monsterZoneIndex) {
                const monsterZoneData = gameState.player.monsterZones[monsterZoneIndex];

                if (monsterZoneData.card.instanceId === cardInstance.instanceId) {
                    if (monsterZoneData.materials && monsterZoneData.materials.length > 0) {
                        while (monsterZoneData.materials.length > 0) {
                            const mat = monsterZoneData.materials.pop();
                            mat.returnToDefault();
                            mat.moveToLocation('graveyard');
                            gameState.player.graveyard.push(mat);
                        }
                    }

                    gameState.player.monsterZones[monsterZoneIndex] = null; 
                }
                else {
                    const matIndex = monsterZoneData.materials.findIndex(m => m.instanceId === cardInstance.instanceId);
                    if (matIndex > -1) {
                        monsterZoneData.materials.splice(matIndex, 1);
                    }
                }
            }
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
    
    gameState.player.monsterZones[zoneKey] = {
        card: cardInstance,
        materials: []
    };
}

export function setMonsterCard(gameState, cardInstance, zoneKey, isFaceUp){
    removeCardFromSource(gameState, cardInstance, cardInstance.location);

    cardInstance.moveToLocation('monsterZone', zoneKey);
    cardInstance.setIsPositionAttack(false);
    cardInstance.setIsFaceUp(isFaceUp);
    
    gameState.player.monsterZones[zoneKey] = {
        card: cardInstance,
        materials: []
    };
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

export function sendCardToBanish(gameState, cardInstance, isFaceUp = true) {
    removeCardFromSource(gameState, cardInstance, cardInstance.location);

    cardInstance.setIsFaceUp(isFaceUp);
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

export function shufflePile(gameState, pileName) {
    const pileArray = gameState.player[pileName]; 
    
    if (!pileArray || !Array.isArray(pileArray)) return;

    for (let i = pileArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [pileArray[i], pileArray[j]] = [pileArray[j], pileArray[i]];
    }
}

export function moveRandomCardFromTo(gameState, sourcePileFrom, sourcePileTo, isFaceUp = true) {
    const randomCard = getRandomCard(gameState, sourcePileFrom);

    if(!randomCard) return;    
    removeCardFromSource(gameState, randomCard, randomCard.location);

    randomCard.moveToLocation(sourcePileTo);
    randomCard.setIsFaceUp(isFaceUp);

    /*if(sourcePileTo === 'graveyard') {
        gameState.player.graveyard.push(randomCard);
    } else if (sourcePileTo === 'banish') {
        gameState.player.banish.push(randomCard);
    } else {
        gameState.player.deck.push(randomCard);
    }*/

    const targetArray = gameState.player[sourcePileTo];
    if (targetArray && Array.isArray(targetArray)) {
        targetArray.push(randomCard);
    }
}

export function attachOverlaySummon(gameState, cardInstance, zoneKey, isOverlaying = true) {
    const zoneData = gameState.player.monsterZones[zoneKey];
    if  (!zoneData || !zoneData.card || cardInstance.instanceId === zoneData.card.instanceId) return;

    let transferredMaterials = [];
    if (cardInstance.zoneKey && gameState.player.monsterZones[cardInstance.zoneKey]) {
        const sourceZoneData = gameState.player.monsterZones[cardInstance.zoneKey];
        
        if (sourceZoneData.card && sourceZoneData.card.instanceId === cardInstance.instanceId) {
            if (sourceZoneData.materials && sourceZoneData.materials.length > 0) {
                const materialsLength = sourceZoneData.materials.length;
                for (let i = 0; i < materialsLength; i++) {
                    const materialCard = sourceZoneData.materials.pop();
                    transferredMaterials.push(materialCard);
                }
            }
        }
    }

    removeCardFromSource(gameState, cardInstance);
    
    cardInstance.moveToLocation('monsterZone', zoneKey);
    
    if(isOverlaying) {
        const oldTopCard = zoneData.card; 
        oldTopCard.returnToDefault();
        oldTopCard.moveToLocation('monsterZone', zoneKey);

        zoneData.card = cardInstance;
        zoneData.materials.push(oldTopCard);
    }
    else {
        zoneData.materials.push(cardInstance);
    }

   if (transferredMaterials.length > 0) {
        transferredMaterials.forEach(mat => {
            mat.moveToLocation('monsterZone', zoneKey);
            targetZoneData.materials.push(mat);
        });
    }
}

export function attachCard(gameState, cardInstance, zoneKey) {
    const zoneData = gameState.player.monsterZones[zoneKey];
    if  (!zoneData || !zoneData.card || cardInstance.instanceId === zoneData.card.instanceId) return;

    if (cardInstance.zoneKey && gameState.player.monsterZones[cardInstance.zoneKey]) {
        const sourceZoneData = gameState.player.monsterZones[cardInstance.zoneKey];
        
        if (sourceZoneData.card && sourceZoneData.card.instanceId === cardInstance.instanceId) {
            if (sourceZoneData.materials && sourceZoneData.materials.length > 0) {
                const materialsLength = sourceZoneData.materials.length;
                for (let i = 0; i < materialsLength; i++) {
                    const materialCard = sourceZoneData.materials.pop();
                    
                    materialCard.returnToDefault();
                    materialCard.moveToLocation('monsterZone', zoneKey);
                    zoneData.materials.push(materialCard);
                }
            }
        }
    }

    removeCardFromSource(gameState, cardInstance);
    cardInstance.moveToLocation('monsterZone', zoneKey);
    zoneData.materials.push(cardInstance);
}

export function xyzSummon(gameState, cardInstance, zoneKey) {
    const zoneData = gameState.player.monsterZones[zoneKey];
    if  (!zoneData || !zoneData.card || cardInstance.instanceId === zoneData.card.instanceId) return;

    removeCardFromSource(gameState, cardInstance);
    
    cardInstance.moveToLocation('monsterZone', zoneKey);

    const oldTopCard = zoneData.card; 
    oldTopCard.returnToDefault();
    oldTopCard.moveToLocation('monsterZone', zoneKey);

    zoneData.card = cardInstance;
    zoneData.materials.push(oldTopCard);
}

function getRandomCard(gameState, pileName) {
    const pileArray = gameState.player[pileName];
    if (!pileArray || pileArray.length === 0) return null;
    
    const randomIndex = Math.floor(Math.random() * pileArray.length);
    return pileArray[randomIndex];
}