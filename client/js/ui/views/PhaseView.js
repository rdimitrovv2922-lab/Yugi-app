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