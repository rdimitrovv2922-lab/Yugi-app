import GameState from './models/GameState.js';
import GameCard from './models/GameCard.js';
//import InputController from './ui/InputController.js';
import InputController from './InputController.js';
import {renderBoard} from './ui/renderer.js';
import { updatePhaseDisplay } from './ui/PhaseView.js';
import { drawCard} from './core/GameRules.js';

const state = new GameState();

document.addEventListener('DOMContentLoaded', () => {
    updatePhaseDisplay('DP');

    const inputController = new InputController(state);

    initializeMockDeck(state, mockCardData, mockBlueEyesData,  40);

    for(let i = 0; i < 8; i++) {
        const cardInstance = new GameCard(mockCardDataFusion);
        cardInstance.moveToLocation('extradeck');
        state.player.extradeck.push(cardInstance);
    }

    for(let i = 8; i < 15; i++) {
        const cardInstance = new GameCard(mockUtopiaData);
        cardInstance.moveToLocation('extradeck');
        state.player.extradeck.push(cardInstance);
    }

    for(let i = 0; i < 5; i++) {
        drawCard(state);
    }
    renderBoard(state);
});

// Mock for testing ------------------------------------------------------------------------- //
const mockCardData = {
    id: 46986414,
    name: "Dark Magician",
    card_images: [{ image_url: "https://images.ygoprodeck.com/images/cards/46986414.jpg" }],
    type: 'normal'
};

const mockBlueEyesData = {
    id: 89631139,
    name: "Blue-Eyes White Dragon",
    card_images: [{ image_url: "https://images.ygoprodeck.com/images/cards/89631139.jpg" }],
    type: 'normal'
};

const mockUtopiaData = {
    id: 84013237,
    name: "Number 39: Utopia",
    card_images: [{ image_url: "https://images.ygoprodeck.com/images/cards/84013237.jpg" }],
    type: 'xyz'
};

const mockCardDataFusion = {
    id: 23995346,
    name: "Blue-Eyes Ultimate Dragon",
    card_images: [{ image_url: "https://images.ygoprodeck.com/images/cards/23995346.jpg" }],
    type: 'fusion'
};

function initializeMockDeck(gameState, cardData, cardData2, count = 40) {
    gameState.player.deck = [];

    for (let i = 0; i < count; i++) {
        if(i%2 === 0) {
            const cardInstance = new GameCard(cardData);
            cardInstance.moveToLocation('deck');
            gameState.player.deck.push(cardInstance);
        }
        else {
            const cardInstance = new GameCard(cardData2);
            cardInstance.moveToLocation('deck');
            gameState.player.deck.push(cardInstance);
        }
    }
    console.log(`Initialized deck with ${gameState.player.deck.length} cards.`);
}
// Mock for testing ------------------------------------------------------------------------- //