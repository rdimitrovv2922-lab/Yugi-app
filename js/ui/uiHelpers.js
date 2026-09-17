export function showCardInHandDropbox(x, y) {
    const dropbox = document.getElementById('card-in-hand-dropbox');
    dropbox.classList.remove('hidden');
    
    let finalX = Math.min(x, window.innerWidth - dropbox.offsetWidth - 10);
    let finalY = Math.min(y, window.innerHeight - dropbox.offsetHeight - 10);
    
    dropbox.style.left = `${finalX}px`;
    dropbox.style.top = `${finalY}px`;
}

export function showCardInHandDropboxMonster(x, y) {
    const dropboxMonster = document.getElementById('card-in-hand-dropbox-monster');
    dropboxMonster.classList.remove('hidden');
    
    let finalX = Math.min(x, window.innerWidth - dropboxMonster.offsetWidth - 10);
    let finalY = Math.min(y, window.innerHeight - dropboxMonster.offsetHeight - 10);
    
    dropboxMonster.style.left = `${finalX}px`;
    dropboxMonster.style.top = `${finalY}px`;
}

export function showCardInHandDropboxSpellTrap(x, y) {
    const dropboxSpellTrap = document.getElementById('card-in-hand-dropbox-spell-trap');
    dropboxSpellTrap.classList.remove('hidden');
    
    let finalX = Math.min(x, window.innerWidth - dropboxSpellTrap.offsetWidth - 10);
    let finalY = Math.min(y, window.innerHeight - dropboxSpellTrap.offsetHeight - 10);
    
    dropboxSpellTrap.style.left = `${finalX}px`;
    dropboxSpellTrap.style.top = `${finalY}px`;
}

export function highlightValidMonsterZones(state, isSetting) {
    for (let i = 1; i <= 7; i++) {
        const zoneKey = `m${i}`;
        if (state.player.monsterZones[zoneKey] === null) {
            const targetDom = isSetting ? document.getElementById(`${zoneKey}-set`) : document.getElementById(zoneKey);
            if (targetDom) targetDom.classList.add('valid-target');
        }
    }
}

export function highlightValidSpellTrapZones(state){
    for (let i = 1; i <= 6; i++) {
        const zoneKey = `s${i}`;
        if(state.player.spellTrapZones[zoneKey] === null) {
            const targetDom = document.getElementById(zoneKey);
            if (targetDom) targetDom.classList.add('valid-target');
        }
    }
}

export function clearHighlightedZones() {
    for (let i = 1; i <= 7; i++) {
        const cardSlot = document.getElementById(`m${i}`);
        const setSlot = document.getElementById(`m${i}-set`);
        if (cardSlot) cardSlot.classList.remove('valid-target');
        if (setSlot) setSlot.classList.remove('valid-target');
    }

    for (let i = 1; i <= 6; i++) {
        const cardSlot = document.getElementById(`s${i}`);
        if (cardSlot) cardSlot.classList.remove('valid-target');
    }
}

const phaseRules = {
    'DP': ['SP'], 'SP': ['M1'], 'M1': ['BP', 'EP'],
    'BP': ['M2'], 'M2': ['EP'], 'EP': ['DP']
};

export function updatePhaseDisplay(targetPhaseCode) {
    if (!targetPhaseCode) return;
    const allPhases = document.querySelectorAll('#phase-tracker .phase');
    const suggestedPhases = phaseRules[targetPhaseCode] || [];

    allPhases.forEach(phase => {
        const phaseCode = phase.getAttribute('data-phase');
        phase.classList.remove('current', 'active');
        if (phaseCode === targetPhaseCode) phase.classList.add('current');
        else if (suggestedPhases.includes(phaseCode)) phase.classList.add('active');
    });
}