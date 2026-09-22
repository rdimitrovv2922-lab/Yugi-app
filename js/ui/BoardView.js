const MAX_MONSTERS = 7;
const MAX_SPELLS = 6;

export function highlightValidMonsterZones(state, isSetting) {
    for (let i = 1; i <= MAX_MONSTERS; i++) {
        const zoneKey = `m${i}`;
        if (state.player.monsterZones[zoneKey] === null) {
            const targetDom = document.getElementById(isSetting ? `${zoneKey}-set` : zoneKey);
            if (targetDom) targetDom.classList.add('valid-target');
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