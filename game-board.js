
const drawButtonOpponent = document.getElementById('draw-btn-opponent');
const drawButtonPlayer = document.getElementById('draw-btn-player');

drawButtonOpponent.addEventListener('click', () => {
    addCardToOpponentHand();
});

drawButtonPlayer.addEventListener('click', () => {
    addCardToPlayerHand();
});

function addCardToPlayerHand() {
    const handContainer = document.getElementById('player-hand');
    const cardSlot = document.createElement('div');
    cardSlot.classList.add('card-slot', 'card-hand');
    handContainer.appendChild(cardSlot);

    const cardImage = document.createElement('img');
    cardImage.src = 'https://images.ygoprodeck.com/images/cards/89631139.jpg';
    cardImage.alt = 'Blue-Eyes White Dragon';

    cardSlot.appendChild(cardImage);

    updateHandContainer('player-hand');
    
}

function addCardToOpponentHand() {
    const handContainer = document.getElementById('opponent-hand');
    const cardSlot = document.createElement('div');
    cardSlot.classList.add('card-slot', 'card-hand');
    handContainer.appendChild(cardSlot);
    
    const cardImage = document.createElement('img');
    cardImage.src = 'https://images.ygoprodeck.com/images/cards/89631139.jpg';
    cardImage.alt = 'Blue-Eyes White Dragon';

    cardSlot.appendChild(cardImage);

    updateHandContainer('opponent-hand');
    
}

function removeCardFromOpponentHand(card) {
    const handContainer = document.getElementById('opponent-hand');
    const cardSlot = handContainer.querySelector(`.card-slot[data-card="${card.id}"]`);
    if (cardSlot) {
        handContainer.removeChild(cardSlot);
        updateHandContainer('opponent-hand');
    }

    updateHandContainer('opponent-hand');
}

function removeCardFromPlayerHand(card) {
    const handContainer = document.getElementById('player-hand');
    const cardSlot = handContainer.querySelector(`.card-slot[data-card="${card.id}"]`);
    if (cardSlot) {
        handContainer.removeChild(cardSlot);
        updateHandContainer('player-hand');
    }

    updateHandContainer('player-hand');
}

function updateHandContainer(handId) {
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
    } else {
        cardSlots.forEach((slot, index) => {
            slot.style.marginLeft = `0px`;
        }); 
    }
}

const phaseRules = {
    'DP': ['SP'],
    'SP': ['M1'],
    'M1': ['BP', 'EP'],
    'BP': ['M2'],
    'M2': ['EP'],
    'EP': ['DP']
};

function updatePhaseDisplay(targetPhaseCode) {
    if (!targetPhaseCode) return;
    
    const allPhases = document.querySelectorAll('#phase-tracker .phase');
    console.log("Found phases:", allPhases.length); // Debug check

    const suggestedPhases = phaseRules[targetPhaseCode] || [];

    allPhases.forEach(phase => {
        const phaseCode = phase.getAttribute('data-phase');
        console.log("Phase element attribute:", phaseCode); // Debug check
        
        phase.classList.remove('current', 'active');

        if (phaseCode && phaseCode === targetPhaseCode) {
            phase.classList.add('current');
        } else if (phaseCode && suggestedPhases.includes(phaseCode)) {
            phase.classList.add('active');
        }
    });
}

function setupPhaseTracker() {
    const phaseElements = document.querySelectorAll('#phase-tracker .phase');

    phaseElements.forEach(phase => {
        phase.addEventListener('click', () => {
            const phaseCode = phase.getAttribute('data-phase');
            if (!phaseCode) return;
            updatePhaseDisplay(phaseCode);
        });
    });
}

document.addEventListener('DOMContentLoaded', () => {
    setupPhaseTracker();
    updatePhaseDisplay('M1');
});