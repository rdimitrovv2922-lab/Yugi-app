function removeCardFromSource(playerState, cardInstance, sourceLocation = cardInstance.location){
    switch(sourceLocation) {
        case 'hand':
            const handIndex = playerState.hand.indexOf(cardInstance);
            if (handIndex > -1) playerState.hand.splice(handIndex, 1);
            break;
        case 'deck':
            const deckIndex = playerState.deck.indexOf(cardInstance);
            if (deckIndex > -1) playerState.deck.splice(deckIndex, 1);
            break;
        case 'extradeck':
            const extradeckIndex = playerState.extradeck.indexOf(cardInstance);
            if (extradeckIndex > -1) playerState.extradeck.splice(extradeckIndex, 1);
            break;
        case 'graveyard':
            const graveyardIndex = playerState.graveyard.indexOf(cardInstance);
            if (graveyardIndex > -1) playerState.graveyard.splice(graveyardIndex, 1);
            break;
        case 'banish':
            const banishIndex = playerState.banish.indexOf(cardInstance);
            if (banishIndex > -1) playerState.banish.splice(banishIndex, 1);
            break;
        case 'monsterZone':
            const monsterZoneIndex = cardInstance.zoneKey;
            if (monsterZoneIndex) {
                const monsterZoneData = playerState.monsterZones[monsterZoneIndex];
                if (!monsterZoneData) break;

                const isMainCard = monsterZoneData.card && monsterZoneData.card.instanceId === cardInstance.instanceId;

                if (isMainCard) {
                    if (monsterZoneData.materials.length > 0) {
                        while (monsterZoneData.materials.length > 0) {
                            const mat = monsterZoneData.materials.pop();
                            mat.returnToDefault();
                            mat.moveToLocation('graveyard');
                            playerState.graveyard.push(mat);
                        }
                    }
                    monsterZoneData.card = null;
                    monsterZoneData.materials = [];
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
            if (spellTrapZoneIndex) playerState.spellTrapZones[spellTrapZoneIndex] = null;
            break;
    }

    cardInstance.returnToDefault();
}

function moveMaterials(playerState, cardInstance, zoneKey) {
    let transferredMaterials = [];

    if (cardInstance.location === 'monsterZone') {
        const sourceZoneData = playerState.monsterZones[cardInstance.zoneKey];
        if (!sourceZoneData.card || sourceZoneData.card != cardInstance) return transferredMaterials;

        if (/^m[1-7](-set)?$/.test(zoneKey)) {
            if (sourceZoneData.materials.length > 0) {
                const materialsLength = sourceZoneData.materials.length;
                for (let i = 0; i < materialsLength; i++) {
                    const materialCard = sourceZoneData.materials.pop();
                    
                    materialCard.returnToDefault();
                    materialCard.moveToLocation('monsterZone', zoneKey);
                    transferredMaterials.push(materialCard);
                }
            }
        }
    }

    return transferredMaterials;
}

function getRandomCard(playerState, pileName) {
    const pileArray = playerState[pileName];
    if (!pileArray || pileArray.length === 0) return null;
    
    const randomIndex = Math.floor(Math.random() * pileArray.length);
    return pileArray[randomIndex];
}

export function drawCard(playerState){
    if(playerState.deck.length === 0) {
        console.log("Deck is empty!");
        return;
    }

    const cardInstance = playerState.deck.pop();

    cardInstance.moveToLocation('hand');
    playerState.hand.push(cardInstance);
}

export function summonMonsterCard(playerState, cardInstance, zoneKey){
    const transferredMaterials = moveMaterials(playerState, cardInstance, zoneKey);
    removeCardFromSource(playerState, cardInstance, cardInstance.location);

    cardInstance.moveToLocation('monsterZone', zoneKey);
    cardInstance.setIsPositionAttack(true);
    cardInstance.changeVisibility(true);
    
    playerState.monsterZones[zoneKey].card = cardInstance;
    playerState.monsterZones[zoneKey].materials = transferredMaterials;
}

export function setMonsterCard(playerState, cardInstance, zoneKey, isFaceUp){
     const transferredMaterials = moveMaterials(playerState, cardInstance, zoneKey);
    removeCardFromSource(playerState, cardInstance, cardInstance.location);

    cardInstance.moveToLocation('monsterZone', zoneKey);
    cardInstance.setIsPositionAttack(false);
    cardInstance.setIsFaceUp(isFaceUp);
    cardInstance.changeVisibility(true);

    playerState.monsterZones[zoneKey].card = cardInstance;
    playerState.monsterZones[zoneKey].materials = transferredMaterials;
}

export function activateSpellTrapCard(playerState, cardInstance, zoneKey, isFaceUp){
    removeCardFromSource(playerState, cardInstance, cardInstance.location);

    cardInstance.moveToLocation('spellTrapZone', zoneKey);
    cardInstance.setIsFaceUp(isFaceUp);
    cardInstance.changeVisibility(true);

    playerState.spellTrapZones[zoneKey] = cardInstance;
}

export function sendCardToGraveyard(playerState, cardInstance) {
    removeCardFromSource(playerState, cardInstance, cardInstance.location);

    cardInstance.moveToLocation('graveyard');
    cardInstance.changeVisibility(true);

    playerState.graveyard.push(cardInstance);
}

export function sendCardToBanish(playerState, cardInstance, isFaceUp = true) {
    removeCardFromSource(playerState, cardInstance, cardInstance.location);

    cardInstance.setIsFaceUp(isFaceUp);
    cardInstance.moveToLocation('banish');
    cardInstance.changeVisibility(true);

    playerState.banish.push(cardInstance);
}

export function sendCardToDeck(playerState, cardInstance) {
    removeCardFromSource(playerState, cardInstance, cardInstance.location);

    cardInstance.moveToLocation('deck');
    cardInstance.changeVisibility(false);

    playerState.deck.push(cardInstance);
}

export function sendCardToExtraDeck(playerState, cardInstance) {
    removeCardFromSource(playerState, cardInstance, cardInstance.location);

    cardInstance.moveToLocation('extradeck');
    cardInstance.changeVisibility(false);

    playerState.extradeck.push(cardInstance);
}

export function sendCardToHand(playerState, cardInstance) {
    removeCardFromSource(playerState, cardInstance, cardInstance.location);

    cardInstance.moveToLocation('hand');
    cardInstance.changeVisibility(false);

    playerState.hand.push(cardInstance);
}

export function switchBattlePositionToAtk(playerState, cardInstance) {
    cardInstance.setIsPositionAttack(true);
    cardInstance.setIsFaceUp(true);
}

export function switchBattlePositionToDef(playerState, cardInstance, isFaceUp=true) {
    cardInstance.setIsPositionAttack(false);
    cardInstance.setIsFaceUp(isFaceUp);
}

export function flipCard(playerState, cardInstance) {
    cardInstance.setIsFaceUp(!cardInstance.isFaceUp);
}

export function shufflePile(playerState, pileName) {
    const pileArray = playerState[pileName]; 
    
    if (!pileArray || !Array.isArray(pileArray)) return;

    for (let i = pileArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [pileArray[i], pileArray[j]] = [pileArray[j], pileArray[i]];
    }
}

export function moveRandomCardFromTo(playerState, sourcePileFrom, sourcePileTo, isFaceUp = true) {
    const randomCard = getRandomCard(playerState, sourcePileFrom);

    if(!randomCard) return;    
    removeCardFromSource(playerState, randomCard, randomCard.location);

    randomCard.moveToLocation(sourcePileTo);
    randomCard.setIsFaceUp(isFaceUp);
    if(sourcePileTo === 'deck') randomCard.changeVisibility(false);

    const targetArray = playerState[sourcePileTo];
    if (targetArray && Array.isArray(targetArray)) {
        targetArray.push(randomCard);
    }
}

export function attachCard(playerState, cardInstance, zoneKey) {
    const zoneData = playerState.monsterZones[zoneKey];
    if  (!zoneData || !zoneData.card || cardInstance.instanceId === zoneData.card.instanceId) return;

    if (cardInstance.zoneKey && playerState.monsterZones[cardInstance.zoneKey]) {
        const sourceZoneData = playerState.monsterZones[cardInstance.zoneKey];
        
        if (sourceZoneData.card && sourceZoneData.card.instanceId === cardInstance.instanceId) {
            if (sourceZoneData.materials.length > 0) {
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

    removeCardFromSource(playerState, cardInstance);
    cardInstance.moveToLocation('monsterZone', zoneKey);
    cardInstance.changeVisibility(true);

    zoneData.materials.push(cardInstance);
}

export function xyzSummon(playerState, cardInstance, zoneKey) {
    const zoneData = playerState.monsterZones[zoneKey];
    if  (!zoneData || !zoneData.card || cardInstance.instanceId === zoneData.card.instanceId) return;

    removeCardFromSource(playerState, cardInstance);
    
    cardInstance.moveToLocation('monsterZone', zoneKey);
    cardInstance.changeVisibility(true);

    const oldTopCard = zoneData.card; 
    oldTopCard.returnToDefault();
    oldTopCard.moveToLocation('monsterZone', zoneKey);

    zoneData.card = cardInstance;
    zoneData.materials.push(oldTopCard);
}

export function targetCard(playerState, cardInstance, targetingRole) {
    if (!cardInstance || !['player1', 'player2'].includes(targetingRole)) return;

    if (!cardInstance.targetedBy.includes(targetingRole)) {
        cardInstance.targetedBy.push(targetingRole);
    }
}

export function clearTargets(gameState, targetingRole) {
    if (!['player1', 'player2'].includes(targetingRole)) return;

    function clearCard(card) {
        if (Array.isArray(card?.targetedBy)) {
            card.targetedBy = card.targetedBy.filter(role => role !== targetingRole);
        }
    }

    for (const playerState of [gameState.player, gameState.opponent]) {
        for (const pileName of ['deck', 'extradeck', 'graveyard', 'banish', 'hand']) {
            (playerState[pileName] || []).forEach(clearCard);
        }

        for (const zone of Object.values(playerState.monsterZones || {})) {
            clearCard(zone?.card);
            (zone?.materials || []).forEach(clearCard);
        }

        Object.values(playerState.spellTrapZones || {}).forEach(clearCard);
    }
}