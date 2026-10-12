import GameState from './models/GameState.js';
import GameCard from './models/GameCard.js';
import InputController from './ui/controllers/InputController.js';
import {animateCardDraw, animateCardMove, captureCardPosition} from './ui/animations/cardAnimations.js';
import {renderBoard} from './ui/rendering/renderer.js';
import { updatePhaseDisplay } from './ui/views/PhaseView.js';

function restoreCards(value) {
    if (Array.isArray(value)) {
        return value.map(restoreCards);
    }

    if (!value || typeof value !== 'object') {
        return value;
    }

    if (value.instanceId && value.rawApiData) {
        const restoredCard = new GameCard(value.rawApiData, value.ownerRole ?? null);
        const cardProperties = Object.fromEntries(
            Object.entries(value)
                .filter(([key]) => key !== 'ownerRole')
                .map(([key, item]) => [key, restoreCards(item)])
        );
        return Object.assign(restoredCard, cardProperties);
    }

    return Object.fromEntries(
        Object.entries(value).map(([key, item]) => [key, restoreCards(item)])
    );
}

function collectCardLocations(gameState) {
    const locations = new Map();
    const addCard = (card, side, location, zoneKey = null, isMaterial = false, hostInstanceId = null, stackCards = []) => {
        if (!card?.instanceId) return;
        locations.set(card.instanceId, {
            card,
            side,
            location,
            zoneKey,
            isMaterial,
            hostInstanceId,
            stackCards
        });
    };

    for (const side of ['player', 'opponent']) {
        const playerState = gameState[side];
        for (const pile of ['hand', 'deck', 'extradeck', 'graveyard', 'banish']) {
            for (const card of playerState[pile] || []) addCard(card, side, pile);
        }

        for (const [zoneKey, zone] of Object.entries(playerState.monsterZones || {})) {
            if (!zone?.card) continue;

            const materials = new Map();
            for (const material of [...(zone.materials || []), ...(zone.card.attachedMaterials || [])]) {
                if (material?.instanceId) materials.set(material.instanceId, material);
            }

            addCard(zone.card, side, 'monsterZone', zoneKey, false, null, [...materials.values()]);
            for (const material of materials.values()) {
                addCard(material, side, 'monsterZone', zoneKey, true, zone.card.instanceId);
            }
        }

        for (const [zoneKey, card] of Object.entries(playerState.spellTrapZones || {})) {
            if (!card) continue;
            addCard(card, side, 'spellTrapZone', zoneKey, false, null, card.attachedMaterials || []);
            for (const material of card.attachedMaterials || []) {
                addCard(material, side, 'spellTrapZone', zoneKey, true, card.instanceId);
            }
        }
    }

    return locations;
}

function getCardLocationKey(entry) {
    return [entry.side, entry.location, entry.zoneKey || '', entry.hostInstanceId || '', entry.isMaterial].join(':');
}

function findCardMoves(previousLocations, currentLocations) {
    const moves = [];
    for (const [instanceId, destinationEntry] of currentLocations) {
        const sourceEntry = previousLocations.get(instanceId);
        if (!sourceEntry || getCardLocationKey(sourceEntry) === getCardLocationKey(destinationEntry)) continue;

        moves.push({
            instanceId,
            card: destinationEntry.card,
            sourceEntry,
            destinationEntry,
            sourceRect: captureCardPosition(sourceEntry),
            stackCards: destinationEntry.stackCards || []
        });
    }

    const movedHostIds = new Set(
        moves
            .filter(move => !move.sourceEntry.isMaterial && !move.destinationEntry.isMaterial)
            .map(move => move.instanceId)
    );

    return moves.filter(move => {
        const stayedAttachedToMovingHost = move.sourceEntry.hostInstanceId &&
            move.sourceEntry.hostInstanceId === move.destinationEntry.hostInstanceId &&
            movedHostIds.has(move.sourceEntry.hostInstanceId);
        return !stayedAttachedToMovingHost;
    });
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
    state.viewerRole = joinInfo.role;
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

    document.querySelector('.remove-target-button').addEventListener('click', async () => {
        const sessionId = sessionStorage.getItem('yugiSessionId');

        const response = await fetch('/api/action', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                sessionId,
                ruleName: 'clearTargets',
                args: []
            })
        });

        const result = await response.json();

        if (!response.ok) {
            console.error('Could not clear your targets:', result.error);
        }
    });

    const turnLabel = document.getElementById('turn-number');
    const turnIndicator = document.getElementById('turn-indicator');
    let currentTurn = null;
    let currentPhase = null;

    let lastSnapshot = null;

    async function refreshTurn() {
        const response = await fetch(
            `/api/state?room=${encodeURIComponent(roomId)}`
        );

        if (!response.ok) return;

        const gameState = await response.json();

        const ownLP = joinInfo.role === 'player1'
            ? gameState.player.lp
            : gameState.opponent.lp;
        const opponentLP = joinInfo.role === 'player1'
            ? gameState.opponent.lp
            : gameState.player.lp;
        document.getElementById('player-lp').textContent = `${ownLP} LP`;
        document.getElementById('opponent-lp').textContent = `${opponentLP} LP`;

        const phase = gameState.phase || 'DP';
        if (phase !== currentPhase) {
            currentPhase = phase;
            state.phase = phase;
            updatePhaseDisplay(phase);
        }

        const snapshot = JSON.stringify(gameState);

        if (snapshot !== lastSnapshot) {
            const previousLocations = lastSnapshot === null ? null : collectCardLocations(state);
            lastSnapshot = snapshot;

            const ownSide = joinInfo.role === 'player1'
                ? gameState.player
                : gameState.opponent;
            const otherSide = joinInfo.role === 'player1'
                ? gameState.opponent
                : gameState.player;

            state.player = restoreCards(ownSide);
            state.opponent = restoreCards(otherSide);

            const moves = previousLocations
                ? findCardMoves(previousLocations, collectCardLocations(state))
                : [];

            renderBoard(state);
            for (const move of moves) {
                if (move.sourceEntry.location === 'deck' && move.destinationEntry.location === 'hand') {
                    animateCardDraw(state, move.destinationEntry.side, move.instanceId, move);
                } else {
                    animateCardMove(move);
                }
            }
        }

        if (gameState.turn !== currentTurn) {
            currentTurn = gameState.turn;
            const isYourTurn = currentTurn === joinInfo.role;
            turnLabel.textContent = isYourTurn ? 'You' : 'Opponent';
            turnIndicator.dataset.activeSide = isYourTurn ? 'player' : 'opponent';
        }
    }

    await refreshTurn();
    setInterval(() => {
        refreshTurn().catch(error => console.error('Could not refresh turn:', error));
    }, 1000);
    
    const inputController = new InputController(state);
    renderBoard(state);
});
