const MAX_MONSTERS = 7;
const MAX_EXTRAMONSTERS = 2;
const MAX_SPELLS = 6;

export function highlightValidMonsterZones(state, isSetting) {
    for (let i = 1; i <= MAX_MONSTERS - MAX_EXTRAMONSTERS; i++) {
        const zoneKey = `m${i}`;
        const zoneData = state.player.monsterZones[zoneKey];

        if (zoneData.card === null) {
            const targetDom = document.getElementById(isSetting ? `${zoneKey}-set` : zoneKey);
            if (targetDom) targetDom.classList.add('valid-target');
        }
    }

    let zoneKeyLeft = "m6";
    let zoneKeyRight = "m7";
    let zoneDataLeft = state.player.monsterZones[zoneKeyLeft];
    let zoneDataRight = state.player.monsterZones[zoneKeyRight];
    let zoneDataLeftOpp = state.opponent.monsterZones[zoneKeyLeft];
    let zoneDataRightOpp = state.opponent.monsterZones[zoneKeyRight];

    let targetDom = null;

    if (zoneDataLeft.card === null && zoneDataRightOpp.card === null) {
        targetDom = document.getElementById(isSetting ? `${zoneKeyLeft}-set` : zoneKeyLeft);
        if (targetDom) targetDom.classList.add('valid-target');
    }

    if (zoneDataRight.card === null && zoneDataLeftOpp.card === null) {
        targetDom = document.getElementById(isSetting ? `${zoneKeyRight}-set` : zoneKeyRight);
        if (targetDom) targetDom.classList.add('valid-target');
    }
}

export function highlightXYZMonsterZones(state) {
    for (let i = 1; i <= MAX_MONSTERS; i++) {
        const zoneKey = `m${i}`;
        const card = state.player.monsterZones[zoneKey]?.card;

        const frameType = card?.rawApiData?.frameType?.toLowerCase();
        const type = card?.type?.toLowerCase();
        const isXyz = frameType === 'xyz' || type?.includes('xyz');

        if (!isXyz) continue;

        const domId = card.isPositionAttack
            ? zoneKey
            : `${zoneKey}-set`;

        document.getElementById(domId)?.classList.add('valid-target');
    }
}

export function highlightFullMonsterZones(state) {
    for (let i = 1; i <= MAX_MONSTERS; i++) {
        const zoneKey = `m${i}`;
        const zoneData = state.player.monsterZones[zoneKey];

        if (zoneData.card) {
             
            const domId = zoneData.card.isPositionAttack ? zoneKey : `${zoneKey}-set`;
            const targetDom = document.getElementById(domId);
                
            if (targetDom) {
                targetDom.classList.add('valid-target');
            }
        }
    }
}

export function highlightValidSpellTrapZones(state) {
    for (let i = 1; i <= MAX_SPELLS; i++) {
        const zoneKey = `s${i}`;
        if (state.player.spellTrapZones[zoneKey] === null) {
            const targetDom = document.getElementById(zoneKey);
            if (targetDom) targetDom.classList.add('valid-target');
        }
    }
}

export function clearHighlightedZones() {
    for (let i = 1; i <= MAX_MONSTERS; i++) {
        const cardSlot = document.getElementById(`m${i}`);
        const setSlot = document.getElementById(`m${i}-set`);
        if (cardSlot) cardSlot.classList.remove('valid-target');
        if (setSlot) setSlot.classList.remove('valid-target');
    }

    for (let i = 1; i <= MAX_SPELLS; i++) {
        const cardSlot = document.getElementById(`s${i}`);
        if (cardSlot) cardSlot.classList.remove('valid-target');
    }
}