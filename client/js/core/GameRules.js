import GameCard from '../models/GameCard.js';

function getOwnerState(gameState, cardInstance, fallbackState) {
    if (cardInstance.ownerRole === 'player1') return gameState?.player || fallbackState;
    if (cardInstance.ownerRole === 'player2') return gameState?.opponent || fallbackState;
    return fallbackState;
}

function sendMaterialsToOwners(materials, fallbackState, gameState) {
    for (const material of materials) {
        material.returnToDefault();
        material.moveToLocation('graveyard');
        material.changeVisibility(true);
        getOwnerState(gameState, material, fallbackState).graveyard.push(material);
    }
}

function removeCardFromSource(playerState, cardInstance, sourceLocation = cardInstance.location, gameState = null){
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
                    const materials = [...(monsterZoneData.materials || []), ...(cardInstance.attachedMaterials || [])];
                    monsterZoneData.card = null;
                    monsterZoneData.materials = [];
                    cardInstance.attachedMaterials = [];
                    sendMaterialsToOwners(materials, playerState, gameState);
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
            if (spellTrapZoneIndex) {
                const spellTrapHost = playerState.spellTrapZones[spellTrapZoneIndex];
                if (spellTrapHost?.instanceId === cardInstance.instanceId) {
                    playerState.spellTrapZones[spellTrapZoneIndex] = null;
                    const materials = cardInstance.attachedMaterials || [];
                    cardInstance.attachedMaterials = [];
                    sendMaterialsToOwners(materials, playerState, gameState);
                } else if (spellTrapHost?.attachedMaterials) {
                    const materialIndex = spellTrapHost.attachedMaterials.findIndex(
                        material => material.instanceId === cardInstance.instanceId
                    );
                    if (materialIndex > -1) spellTrapHost.attachedMaterials.splice(materialIndex, 1);
                }
            }
            break;
    }

    cardInstance.returnToDefault();
}

function removeTokenIfPresent(playerState, cardInstance, gameState = null) {
    if (!cardInstance?.isToken) return false;

    removeCardFromSource(playerState, cardInstance, cardInstance.location, gameState);
    return true;
}

function detachMaterials(playerState, cardInstance) {
    let materials = [];

    if (cardInstance.location === 'monsterZone') {
        const sourceZoneData = playerState.monsterZones[cardInstance.zoneKey];
        if (sourceZoneData?.card === cardInstance) {
            materials = sourceZoneData.materials.splice(0);
        }
    }

    if (Array.isArray(cardInstance.attachedMaterials) && cardInstance.attachedMaterials.length > 0) {
        materials.push(...cardInstance.attachedMaterials.splice(0));
    }

    return materials;
}

function moveMaterials(playerState, cardInstance, zoneKey) {
    const materials = detachMaterials(playerState, cardInstance);
    return materials.map(material => {
        material.returnToDefault();
        material.moveToLocation('monsterZone', zoneKey);
        material.setIsMaterial(true);
        return material;
    });
}

function positionMaterials(materials, location, zoneKey) {
    for (const material of materials) {
        material.returnToDefault();
        material.moveToLocation(location, zoneKey);
        material.setIsMaterial(true);
    }
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

export function placeToken(playerState, zoneKey, ownerRole = null) {
    if (!/^m[1-7]$/.test(zoneKey) || playerState.monsterZones[zoneKey]?.card) return;

    const rawApiData = {
        id: 'token',
        name: 'Token',
        type: 'Token',
        frameType: 'token',
        atk: 0,
        def: 0,
        desc: 'This card can be used as any token.'
    };

    const token = new GameCard(rawApiData, ownerRole);
    token.imageUrl = 'https://images.ygoprodeck.com/images/cards/59160189.jpg';
    token.isToken = true;
    token.moveToLocation('monsterZone', zoneKey);
    token.changeVisibility(true);
    playerState.monsterZones[zoneKey].card = token;
}

export function summonMonsterCard(playerState, cardInstance, zoneKey, gameState = null){
    const transferredMaterials = moveMaterials(playerState, cardInstance, zoneKey);
    removeCardFromSource(playerState, cardInstance, cardInstance.location, gameState);

    cardInstance.moveToLocation('monsterZone', zoneKey);
    cardInstance.setIsPositionAttack(true);
    cardInstance.changeVisibility(true);
    
    playerState.monsterZones[zoneKey].card = cardInstance;
    playerState.monsterZones[zoneKey].materials = transferredMaterials;
}

export function setMonsterCard(playerState, cardInstance, zoneKey, isFaceUp, gameState = null){
     const transferredMaterials = moveMaterials(playerState, cardInstance, zoneKey);
    removeCardFromSource(playerState, cardInstance, cardInstance.location, gameState);

    cardInstance.moveToLocation('monsterZone', zoneKey);
    cardInstance.setIsPositionAttack(false);
    cardInstance.setIsFaceUp(isFaceUp);
    cardInstance.changeVisibility(true);

    playerState.monsterZones[zoneKey].card = cardInstance;
    playerState.monsterZones[zoneKey].materials = transferredMaterials;
}

export function activateSpellTrapCard(playerState, cardInstance, zoneKey, isFaceUp, gameState = null){
    const transferredMaterials = detachMaterials(playerState, cardInstance);
    removeCardFromSource(playerState, cardInstance, cardInstance.location, gameState);

    cardInstance.moveToLocation('spellTrapZone', zoneKey);
    cardInstance.setIsFaceUp(isFaceUp);
    cardInstance.changeVisibility(true);

    playerState.spellTrapZones[zoneKey] = cardInstance;
    cardInstance.attachedMaterials = transferredMaterials;
    positionMaterials(transferredMaterials, 'spellTrapZone', zoneKey);
}

export function sendCardToGraveyard(playerState, cardInstance, gameState = null) {
    if (removeTokenIfPresent(playerState, cardInstance, gameState)) return;

    removeCardFromSource(playerState, cardInstance, cardInstance.location, gameState);

    cardInstance.moveToLocation('graveyard');
    cardInstance.changeVisibility(true);

    getOwnerState(gameState, cardInstance, playerState).graveyard.push(cardInstance);
}

export function sendCardToBanish(playerState, cardInstance, isFaceUp = true, gameState = null) {
    if (typeof isFaceUp === 'object' && isFaceUp !== null && gameState === null) {
        gameState = isFaceUp;
        isFaceUp = true;
    }
    if (removeTokenIfPresent(playerState, cardInstance, gameState)) return;

    removeCardFromSource(playerState, cardInstance, cardInstance.location, gameState);

    cardInstance.setIsFaceUp(isFaceUp);
    cardInstance.moveToLocation('banish');
    cardInstance.changeVisibility(true);

    getOwnerState(gameState, cardInstance, playerState).banish.push(cardInstance);
}

export function sendCardToDeck(playerState, cardInstance, gameState = null) {
    if (removeTokenIfPresent(playerState, cardInstance, gameState)) return;

    removeCardFromSource(playerState, cardInstance, cardInstance.location, gameState);

    cardInstance.moveToLocation('deck');
    cardInstance.changeVisibility(false);

    getOwnerState(gameState, cardInstance, playerState).deck.push(cardInstance);
}

export function sendCardToExtraDeck(playerState, cardInstance, gameState = null) {
    if (removeTokenIfPresent(playerState, cardInstance, gameState)) return;

    removeCardFromSource(playerState, cardInstance, cardInstance.location, gameState);

    cardInstance.moveToLocation('extradeck');
    cardInstance.changeVisibility(false);

    getOwnerState(gameState, cardInstance, playerState).extradeck.push(cardInstance);
}

export function sendCardToHand(playerState, cardInstance, gameState = null) {
    if (removeTokenIfPresent(playerState, cardInstance, gameState)) return;

    removeCardFromSource(playerState, cardInstance, cardInstance.location, gameState);

    cardInstance.moveToLocation('hand');
    cardInstance.changeVisibility(false);

    getOwnerState(gameState, cardInstance, playerState).hand.push(cardInstance);
}

function isEligibleStealSource(sourceState, cardInstance) {
    if (sourceState.graveyard.includes(cardInstance)) return cardInstance.location === 'graveyard';
    if (sourceState.banish.includes(cardInstance)) return cardInstance.location === 'banish' && cardInstance.isFaceUp;
    if (Object.values(sourceState.spellTrapZones).some(card => card === cardInstance)) {
        return cardInstance.location === 'spellTrapZone';
    }

    return Object.values(sourceState.monsterZones).some(zone => zone?.card === cardInstance) &&
        cardInstance.location === 'monsterZone';
}

function isAvailableMonsterZone(playerState, opponentState, zoneKey) {
    const zone = playerState.monsterZones[zoneKey];
    if (!zone || zone.card !== null) return false;
    if (zoneKey === 'm6') return opponentState.monsterZones.m7?.card === null;
    if (zoneKey === 'm7') return opponentState.monsterZones.m6?.card === null;
    return /^m[1-5]$/.test(zoneKey);
}

export function stealCard(playerState, cardInstance, zoneKey, position, gameState) {
    if (!gameState || !cardInstance) throw new Error('A card and game state are required');

    const isPlayerOne = gameState.player === playerState;
    const opponentState = isPlayerOne ? gameState.opponent : gameState.player;
    if (!isEligibleStealSource(opponentState, cardInstance)) {
        throw new Error('This opponent card cannot be stolen');
    }

    const isMonsterDestination = /^m[1-7]$/.test(zoneKey);
    const isSpellTrapDestination = /^s[1-6]$/.test(zoneKey);
    if (isMonsterDestination) {
        if (!['attack', 'defense', 'set'].includes(position)) {
            throw new Error('Choose a valid Monster Zone position');
        }
        if (!isAvailableMonsterZone(playerState, opponentState, zoneKey)) {
            throw new Error('That Monster Zone is not available');
        }
    } else if (isSpellTrapDestination) {
        if (!['faceup', 'set'].includes(position)) {
            throw new Error('Choose a valid Spell/Trap Zone position');
        }
        if (playerState.spellTrapZones[zoneKey] !== null) {
            throw new Error('That Spell/Trap Zone is not available');
        }
    } else {
        throw new Error('Choose a valid destination zone');
    }

    let carriedMaterials = [];
    let sourceMonsterZone = null;
    if (cardInstance.location === 'monsterZone') {
        sourceMonsterZone = Object.values(opponentState.monsterZones)
            .find(zone => zone?.card === cardInstance);
        carriedMaterials = [...(sourceMonsterZone?.materials || []), ...(cardInstance.attachedMaterials || [])];
        if (sourceMonsterZone) {
            sourceMonsterZone.card = null;
            sourceMonsterZone.materials = [];
        }
        cardInstance.attachedMaterials = [];
    } else if (cardInstance.location === 'spellTrapZone') {
        const sourceZoneKey = Object.keys(opponentState.spellTrapZones)
            .find(key => opponentState.spellTrapZones[key] === cardInstance);
        if (sourceZoneKey) opponentState.spellTrapZones[sourceZoneKey] = null;
        carriedMaterials = [...(cardInstance.attachedMaterials || [])];
        cardInstance.attachedMaterials = [];
    } else {
        const sourcePile = cardInstance.location === 'graveyard'
            ? opponentState.graveyard
            : opponentState.banish;
        const sourceIndex = sourcePile.indexOf(cardInstance);
        if (sourceIndex < 0) throw new Error('This opponent card cannot be stolen');
        sourcePile.splice(sourceIndex, 1);
    }

    cardInstance.changeVisibility(true);
    if (isMonsterDestination) {
        cardInstance.moveToLocation('monsterZone', zoneKey);
        cardInstance.setIsPositionAttack(position === 'attack');
        cardInstance.setIsFaceUp(position !== 'set');
        const destination = playerState.monsterZones[zoneKey];
        destination.card = cardInstance;
        destination.materials = carriedMaterials;
        for (const material of carriedMaterials) {
            material.moveToLocation('monsterZone', zoneKey);
            material.setIsMaterial(true);
        }
        cardInstance.attachedMaterials = [];
    } else {
        cardInstance.moveToLocation('spellTrapZone', zoneKey);
        cardInstance.setIsFaceUp(position === 'faceup');
        playerState.spellTrapZones[zoneKey] = cardInstance;
        cardInstance.attachedMaterials = carriedMaterials;
        for (const material of carriedMaterials) {
            material.moveToLocation('spellTrapZone', zoneKey);
            material.setIsMaterial(true);
        }
    }
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

export function attachCard(playerState, cardInstance, zoneKey, gameState = null) {
    const zoneData = playerState.monsterZones[zoneKey];
    if  (!zoneData || !zoneData.card || cardInstance.instanceId === zoneData.card.instanceId) return;

    if (removeTokenIfPresent(playerState, cardInstance, gameState)) return;

    const transferredMaterials = detachMaterials(playerState, cardInstance);
    removeCardFromSource(playerState, cardInstance, cardInstance.location, gameState);
    cardInstance.moveToLocation('monsterZone', zoneKey);
    cardInstance.changeVisibility(true);

    positionMaterials(transferredMaterials, 'monsterZone', zoneKey);
    zoneData.materials.push(...transferredMaterials);
    zoneData.materials.push(cardInstance);
}

export function xyzSummon(playerState, cardInstance, zoneKey, gameState = null) {
    const zoneData = playerState.monsterZones[zoneKey];
    if  (!zoneData || !zoneData.card || cardInstance.instanceId === zoneData.card.instanceId) return;

    const transferredMaterials = detachMaterials(playerState, cardInstance);
    const existingMaterials = [
        ...zoneData.materials.filter(material => material !== cardInstance),
        ...(zoneData.card.attachedMaterials || [])
    ];
    const oldTopCard = zoneData.card;
    removeCardFromSource(playerState, cardInstance, cardInstance.location, gameState);
    
    cardInstance.moveToLocation('monsterZone', zoneKey);
    cardInstance.changeVisibility(true);

    oldTopCard.returnToDefault();
    oldTopCard.moveToLocation('monsterZone', zoneKey);
    oldTopCard.setIsMaterial(true);
    oldTopCard.attachedMaterials = [];

    zoneData.card = cardInstance;
    zoneData.materials = [...existingMaterials, ...transferredMaterials];
    positionMaterials(zoneData.materials, 'monsterZone', zoneKey);
    if (!oldTopCard.isToken) zoneData.materials.push(oldTopCard);
}

export function revealCard(playerState, cardInstance) {
    if (!cardInstance) return;
    cardInstance.changeVisibility(true);
}
export function hideCard(playerState, cardInstance) {
    if (!cardInstance) return;
    cardInstance.changeVisibility(false);
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
            (zone?.card?.attachedMaterials || []).forEach(clearCard);
        }

        Object.values(playerState.spellTrapZones || {}).forEach(card => {
            clearCard(card);
            (card?.attachedMaterials || []).forEach(clearCard);
        });
    }
}
