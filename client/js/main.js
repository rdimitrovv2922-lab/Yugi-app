import GameState from './models/GameState.js';
import GameCard from './models/GameCard.js';
import InputController from './ui/InputController.js';
import {renderBoard} from './ui/renderer.js';
import { updatePhaseDisplay } from './ui/PhaseView.js';

function restoreCards(value) {
    if (Array.isArray(value)) {
        return value.map(restoreCards);
    }

    if (!value || typeof value !== 'object') {
        return value;
    }

    if (value.instanceId && value.rawApiData) {
        return Object.assign(new GameCard(value.rawApiData), value);
    }

    return Object.fromEntries(
        Object.entries(value).map(([key, item]) => [key, restoreCards(item)])
    );
}

const state = new GameState();

document.addEventListener('DOMContentLoaded', async () => {
    const roomId = new URLSearchParams(location.search).get('room') || 'demo';
    const joinResponse = await fetch(`/api/join?room=${encodeURIComponent(roomId)}`);
    const joinInfo = await joinResponse.json();

    if (!joinResponse.ok) {
        console.error('Could not join room:', joinInfo.error);
        return;
    }

    sessionStorage.setItem('yugiSessionId', joinInfo.sessionId);
    sessionStorage.setItem('yugiRole', joinInfo.role);
    console.log(`Joined room ${roomId} as ${joinInfo.role}`);

    document.querySelector('.end-turn-button').addEventListener('click', async () => {
        const sessionId = sessionStorage.getItem('yugiSessionId');
        const response = await fetch(
            `/api/end-turn?sessionId=${encodeURIComponent(sessionId)}`,
            { method: 'POST' }
        );
        const result = await response.json();

        if (!response.ok) {
            console.error('Action rejected:', result.error);
            return;
        }

        console.log('Server accepted end turn. Shared state:', result);
    });

    const turnLabel = document.getElementById('turn-number');
    let currentTurn = null;

    let lastSnapshot = null;

    async function refreshTurn() {
        const response = await fetch(
            `/api/state?room=${encodeURIComponent(roomId)}`
        );

        if (!response.ok) return;

        const gameState = await response.json();

        const snapshot = JSON.stringify(gameState);

        if (snapshot !== lastSnapshot) {
            lastSnapshot = snapshot;

            const ownSide = joinInfo.role === 'player1'
                ? gameState.player
                : gameState.opponent;
            const otherSide = joinInfo.role === 'player1'
                ? gameState.opponent
                : gameState.player;

            state.player = restoreCards(ownSide);
            state.opponent = restoreCards(otherSide);
            renderBoard(state);
        }

        if (gameState.turn !== currentTurn) {
            currentTurn = gameState.turn;
            turnLabel.textContent =
                currentTurn === joinInfo.role ? 'You' : 'Opponent';
        }
    }

    await refreshTurn();
    setInterval(() => {
        refreshTurn().catch(error => console.error('Could not refresh turn:', error));
    }, 1000);
    
    updatePhaseDisplay('DP');
    const inputController = new InputController(state);
    renderBoard(state);
});
