const lobbyStatus = document.querySelector('#lobby-status');
const lobbyMessage = document.querySelector('#lobby-message');
const roomActions = document.querySelector('#room-actions');
const createRoomForm = document.querySelector('#create-room-form');
const createDeckSelect = document.querySelector('#create-deck-select');
const createRoomButton = document.querySelector('#create-room-button');
const joinRoomForm = document.querySelector('#join-room-form');
const roomCodeInput = document.querySelector('#room-code-input');
const joinDeckSelect = document.querySelector('#join-deck-select');
const joinRoomButton = document.querySelector('#join-room-button');
const waitingPanel = document.querySelector('#waiting-panel');
const roomCodeDisplay = document.querySelector('#room-code-display');
const copyRoomCodeButton = document.querySelector('#copy-room-code-button');
const waitingStatus = document.querySelector('#waiting-status');
const deckBuilderPrompt = document.querySelector('#deck-builder-prompt');

let statusPollingTimer = null;
let isCheckingRoomStatus = false;

async function requestJson(url, options = {}) {
    const response = await fetch(url, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...options.headers
        }
    });

    let result;

    try {
        result = await response.json();
    } catch {
        result = {};
    }

    if (!response.ok) {
        const error = new Error(result.error || 'Request failed');
        error.status = response.status;
        throw error;
    }

    return result;
}

function fillDeckSelect(select, decks) {
    select.replaceChildren();

    const placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.textContent = decks.length
        ? 'Choose a saved deck'
        : 'No saved decks';
    select.append(placeholder);

    for (const deck of decks) {
        const option = document.createElement('option');
        option.value = deck.id;
        option.textContent = deck.name;
        select.append(option);
    }

    select.disabled = decks.length === 0;
}

function setRoomActionButtonsDisabled(disabled) {
    const hasCreateDeck = createDeckSelect.value !== '';
    const hasJoinDeck = joinDeckSelect.value !== '';

    createRoomButton.disabled = disabled || !hasCreateDeck;
    joinRoomButton.disabled = disabled || !hasJoinDeck;
}

function openGameBoard(code) {
    window.location.assign(
        `/game-board.html?room=${encodeURIComponent(code)}`
    );
}

function showRoomWaiting(code) {
    const cleanCode = code.trim().toUpperCase();

    roomActions.hidden = true;
    waitingPanel.hidden = false;
    roomCodeDisplay.textContent = cleanCode;
    waitingStatus.textContent = 'Waiting for another player to join…';
    lobbyMessage.textContent = '';
    window.history.replaceState(
        {},
        '',
        `?room=${encodeURIComponent(cleanCode)}`
    );

    if (statusPollingTimer !== null) {
        window.clearInterval(statusPollingTimer);
    }

    checkRoomStatus(cleanCode);
    statusPollingTimer = window.setInterval(
        () => checkRoomStatus(cleanCode),
        2000
    );
}

async function checkRoomStatus(code) {
    if (isCheckingRoomStatus) return;
    isCheckingRoomStatus = true;

    try {
        const result = await requestJson(
            `/api/rooms/${encodeURIComponent(code)}/status`
        );

        if (result.room.status === 'active') {
            if (statusPollingTimer !== null) {
                window.clearInterval(statusPollingTimer);
                statusPollingTimer = null;
            }

            openGameBoard(result.room.code);
            return;
        }

        waitingStatus.textContent = 'Waiting for another player to join…';
    } catch (error) {
        if ([401, 403, 404].includes(error.status)) {
            if (statusPollingTimer !== null) {
                window.clearInterval(statusPollingTimer);
                statusPollingTimer = null;
            }

            waitingPanel.hidden = true;
            roomActions.hidden = false;
            window.history.replaceState({}, '', window.location.pathname);
            lobbyMessage.textContent = error.message;
        } else {
            waitingStatus.textContent = 'Could not check room status; retrying…';
        }
    } finally {
        isCheckingRoomStatus = false;
    }
}

createDeckSelect.addEventListener('change', () => {
    setRoomActionButtonsDisabled(false);
});

joinDeckSelect.addEventListener('change', () => {
    setRoomActionButtonsDisabled(false);
});

roomCodeInput.addEventListener('input', () => {
    roomCodeInput.value = roomCodeInput.value
        .toUpperCase()
        .replace(/\s/g, '');
});

createRoomForm.addEventListener('submit', async event => {
    event.preventDefault();
    lobbyMessage.textContent = '';
    setRoomActionButtonsDisabled(true);

    try {
        const result = await requestJson('/api/rooms', {
            method: 'POST',
            body: JSON.stringify({ deckId: createDeckSelect.value })
        });

        showRoomWaiting(result.room.code);
    } catch (error) {
        lobbyMessage.textContent = error.message;
        setRoomActionButtonsDisabled(false);
    }
});

joinRoomForm.addEventListener('submit', async event => {
    event.preventDefault();
    lobbyMessage.textContent = '';
    setRoomActionButtonsDisabled(true);

    try {
        const result = await requestJson('/api/rooms/join', {
            method: 'POST',
            body: JSON.stringify({
                code: roomCodeInput.value,
                deckId: joinDeckSelect.value
            })
        });

        openGameBoard(result.room.code);
    } catch (error) {
        lobbyMessage.textContent = error.message;
        setRoomActionButtonsDisabled(false);
    }
});

copyRoomCodeButton.addEventListener('click', async () => {
    try {
        await navigator.clipboard.writeText(roomCodeDisplay.textContent);
        waitingStatus.textContent = 'Room code copied. Waiting for another player…';
    } catch {
        window.prompt('Copy this room code:', roomCodeDisplay.textContent);
    }
});

async function initializeLobby() {
    const pendingRoomCode = new URLSearchParams(window.location.search).get('room');

    try {
        await requestJson('/api/me');
    } catch (error) {
        lobbyStatus.textContent = error.status === 401
            ? 'Sign in before creating or joining a room.'
            : 'Could not check sign-in status.';
        lobbyMessage.textContent = error.message;
        return;
    }

    if (pendingRoomCode) {
        lobbyStatus.textContent = `Rejoining room ${pendingRoomCode.toUpperCase()}…`;
        showRoomWaiting(pendingRoomCode);
        return;
    }

    try {
        const result = await requestJson('/api/decks');
        const decks = Array.isArray(result.decks) ? result.decks : [];

        fillDeckSelect(createDeckSelect, decks);
        fillDeckSelect(joinDeckSelect, decks);
        roomActions.hidden = false;
        deckBuilderPrompt.hidden = decks.length !== 0;
        lobbyStatus.textContent = 'Choose a deck to create or join a room.';
        setRoomActionButtonsDisabled(false);
    } catch (error) {
        lobbyStatus.textContent = 'Could not load your saved decks.';
        lobbyMessage.textContent = error.message;
    }
}

initializeLobby();
