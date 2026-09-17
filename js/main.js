import GameState from './models/GameState.js';
import GameCard from './models/GameCard.js';
import InputController from './ui/InputController.js';
import {renderBoard} from './ui/renderer.js';
import { updatePhaseDisplay } from './ui/uiHelpers.js';

const state = new GameState();

document.addEventListener('DOMContentLoaded', () => {
    updatePhaseDisplay('DP');

    const inputController = new InputController(state, (updatedState) => {
        renderBoard(updatedState);
    });

    initializeMockDeck(state, mockCardData, 40);

    renderBoard(state);
});

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
// Mock for testing ------------------------------------------------------------------------- //