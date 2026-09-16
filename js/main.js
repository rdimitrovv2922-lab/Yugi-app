import GameState from './models/GameState.js';
import GameCard from './models/GameCard.js';
import { renderBoard } from './ui/renderer.js';
import { drawCard, summonMonsterCard, setMonsterCard } from './core/GameRules.js';

// Initialize global state
const state = new GameState();

// Track active selection state
let activeCardInstance = null;
let isWaitingForMonsterZone = false;
let isSettingCard = false;

// Mock for testing ------------------------------------------------------------------------- //
const mockCardData = {
    id: 46986414,
    name: "Dark Magician",
    card_images: [{ image_url: "https://images.ygoprodeck.com/images/cards/46986414.jpg" }]
};

function initializeMockDeck(gameState, cardData, count = 40) {
    gameState.player.deck = [];

    for (let i = 0; i < count; i++) {
        const cardInstance = new GameCard(cardData);
        cardInstance.moveToLocation('deck');
        gameState.player.deck.push(cardInstance);
    }

    console.log(`Initialized deck with ${gameState.player.deck.length} cards.`);
}
// ---------------------------------------------------------------------------------------- //

// --- DOM Event Listeners & Setup ---
document.addEventListener('DOMContentLoaded', () => {
    setupPhaseTracker();
    updatePhaseDisplay('DP');
    setupUIEventListeners();

    initializeMockDeck(state, mockCardData, 40);
});

function setupUIEventListeners() {
    // Draw Buttons
    document.getElementById('draw-btn-player').addEventListener('click', () => {
        drawCard(state);
        renderBoard(state);
    });

    // Hand Click Delegation (Opens Dropbox menu using data-instance-id)
    document.getElementById('player-hand').addEventListener('click', (event) => {
        event.stopPropagation()

        const cardSlot = event.target.closest('.card-slot');
        if (!cardSlot) return;

        const instanceId = cardSlot.getAttribute('data-instance-id');
        activeCardInstance = state.player.hand.find(c => c.instanceId === instanceId);

        if (activeCardInstance) {
            showCardInHandDropbox(event.clientX, event.clientY);
        }
    });

    // Dropbox Action Delegation
    const dropbox = document.getElementById('card-in-hand-dropbox');
    dropbox.addEventListener('click', (event) => {
        const action = event.target.getAttribute('data-action');
        if (!action || !activeCardInstance) return;

        if (action === 'summon') {
            isWaitingForMonsterZone = true;
            isSettingCard = false;
            highlightValidMonsterZones(false);
        } else if (action === 'set') {
            isWaitingForMonsterZone = true;
            isSettingCard = true;
            highlightValidMonsterZones(true);
        }

        dropbox.classList.add('hidden');
    });

    // Global Click Handler for Board Target Placement & Closing Menus
    document.addEventListener('click', (event) => {
        if (!dropbox.contains(event.target) && !event.target.closest('.card-hand')) {
            dropbox.classList.add('hidden');
        }

        if (!isWaitingForMonsterZone || !activeCardInstance) return;

        const targetSlot = isSettingCard 
            ? event.target.closest('.set-slot') 
            : event.target.closest('.card-slot');

        if (targetSlot) {
            const zoneId = targetSlot.id.replace('-set', '');
            
            // Validate it's a main monster zone (m1 through m5)
            if (/^m[1-7]$/.test(zoneId)) {
                if (state.player.monsterZones[zoneId] === null) {
                    if (!isSettingCard) {
                        summonMonsterCard(state, activeCardInstance, zoneId);
                    } else {
                        setMonsterCard(state, activeCardInstance, zoneId, true);
                    }

                    // Reset interaction states
                    isWaitingForMonsterZone = false;
                    isSettingCard = false;
                    clearHighlightedMonsterZones();
                    activeCardInstance = null;

                    // Redraw entire board state
                    renderBoard(state);
                } else {
                    console.warn("That zone is already occupied!");
                }
            }
        }
    });
}

// --- Helper UI Functions (Dropbox & Highlighting) ---
function showCardInHandDropbox(x, y) {
    const dropbox = document.getElementById('card-in-hand-dropbox');
    dropbox.classList.remove('hidden');
    
    let finalX = Math.min(x, window.innerWidth - dropbox.offsetWidth - 10);
    let finalY = Math.min(y, window.innerHeight - dropbox.offsetHeight - 10);
    
    dropbox.style.left = `${finalX}px`;
    dropbox.style.top = `${finalY}px`;
}

function highlightValidMonsterZones(isSetting) {
    for (let i = 1; i <= 7; i++) {
        const zoneKey = `m${i}`;
        if (state.player.monsterZones[zoneKey] === null) {
            const targetDom = isSetting ? document.getElementById(`${zoneKey}-set`) : document.getElementById(zoneKey);
            if (targetDom) targetDom.classList.add('valid-target');
        }
    }
}

function clearHighlightedMonsterZones() {
    for (let i = 1; i <= 7; i++) {
        const cardSlot = document.getElementById(`m${i}`);
        const setSlot = document.getElementById(`m${i}-set`);
        if (cardSlot) cardSlot.classList.remove('valid-target');
        if (setSlot) setSlot.classList.remove('valid-target');
    }
}

// Phase Tracker Logic (Keeping your working rules intact)
const phaseRules = {
    'DP': ['SP'], 'SP': ['M1'], 'M1': ['BP', 'EP'],
    'BP': ['M2'], 'M2': ['EP'], 'EP': ['DP']
};

function updatePhaseDisplay(targetPhaseCode) {
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

function setupPhaseTracker() {
    document.querySelectorAll('#phase-tracker .phase').forEach(phase => {
        phase.addEventListener('click', () => {
            const phaseCode = phase.getAttribute('data-phase');
            if (phaseCode) updatePhaseDisplay(phaseCode);
        });
    });
}