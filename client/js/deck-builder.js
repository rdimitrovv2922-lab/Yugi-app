import { getLevelOrLinkDetail } from './ui/cardDetails.js';

const cardSearchInput = document.querySelector('#card-search');
const cardSearchStatus = document.querySelector('#card-search-status');
const cardResults = document.querySelector('#card-results');
const cardPreviewName = document.querySelector('#card-preview-name');
const cardPreviewImage = document.querySelector('#card-preview-image');
const cardPreviewDetails = document.querySelector('#card-preview-details');
const cardPreviewDescription = document.querySelector('#card-preview-dsc');
const deckForm = document.querySelector('#deck-form');
const deckNameInput = document.querySelector('#deck-name');
const deckSaveStatus = document.querySelector('#deck-save-status');
const saveDeckButton = document.querySelector('#save-deck-button');
const savedDeckSelect = document.querySelector('#saved-deck-select');
const loadDeckButton = document.querySelector('#load-deck-button');
let savedDecks = [];
let loadedDeckId = null;

const cardCache = new Map();
const deckState = {
    main: new Map(),
    extra: new Map(),
    side: new Map()
};

const sectionElements = {
    main: document.querySelector('#main-deck-cards'),
    extra: document.querySelector('#extra-deck-cards'),
    side: document.querySelector('#side-deck-cards')
};

const sectionCountElements = {
    main: document.querySelector('#main-count'),
    extra: document.querySelector('#extra-count'),
    side: document.querySelector('#side-count')
};

const sectionLimits = {
    main: 60,
    extra: 15,
    side: 15
};

const extraDeckTypes = new Set(['fusion', 'synchro', 'xyz', 'link']);
const maxCopiesPerCard = 3;

let searchTimer;
let latestSearchId = 0;
let lastSavedFingerprint = '';

cardSearchInput.addEventListener('input', () => {
    const query = cardSearchInput.value.trim();
    const searchId = ++latestSearchId;

    clearTimeout(searchTimer);
    cardResults.replaceChildren();

    if (query.length < 2) {
        cardSearchStatus.textContent = 'Enter at least 2 characters to search.';
        return;
    }

    cardSearchStatus.textContent = 'Searching…';

    searchTimer = setTimeout(() => {
        searchCards(query, searchId);
    }, 500);
});

async function searchCards(query, searchId) {
    try {
        const response = await fetch(
            `/api/cards?q=${encodeURIComponent(query)}`
        );
        const result = await response.json();

        if (searchId !== latestSearchId) {
            return;
        }

        if (!response.ok) {
            throw new Error(result.error || 'Card search failed.');
        }

        renderCardResults(result.cards);
    } catch (error) {
        if (searchId === latestSearchId) {
            cardSearchStatus.textContent = error.message;
        }
    }
}

function renderCardResults(cards) {
    cardResults.replaceChildren();

    if (cards.length === 0) {
        cardSearchStatus.textContent = 'No matching cards found.';
        return;
    }

    cardSearchStatus.textContent = `Found ${cards.length} card(s). Drag a card into a deck section.`;

    for (const card of cards) {
        cardCache.set(card.id, card);

        const item = document.createElement('article');
        item.className = 'card-search-result';
        item.dataset.cardId = String(card.id);
        item.setAttribute('role', 'listitem');
        item.tabIndex = 0;
        item.draggable = true;

        const image = document.createElement('img');
        const thumbnailUrl = card.thumbnailUrl || card.imageUrl;
        if (thumbnailUrl) {
            image.src = thumbnailUrl;
        }
        image.alt = '';
        image.draggable = false;
        image.loading = 'lazy';

        const copy = document.createElement('div');
        copy.className = 'card-search-result-copy';

        const name = document.createElement('h3');
        name.textContent = card.name;

        const type = document.createElement('p');
        type.textContent = card.type || '';

        copy.append(name, type);
        item.append(image, copy);
        item.addEventListener('dragstart', event => {
            event.dataTransfer.setData('text/plain', String(card.id));
            event.dataTransfer.effectAllowed = 'copy';
        });

        cardResults.append(item);
    }
}

function isExtraDeckCard(card) {
    const frameType = typeof card.frameType === 'string'
        ? card.frameType.replace(/_pendulum$/, '')
        : '';
    return extraDeckTypes.has(frameType);
}

function getSectionCount(section) {
    let count = 0;
    for (const entry of deckState[section].values()) {
        count += entry.quantity;
    }
    return count;
}

function getTotalCopies(cardId) {
    let total = 0;
    for (const section of Object.keys(deckState)) {
        total += deckState[section].get(cardId)?.quantity || 0;
    }
    return total;
}

function getDeckPayload() {
    const cards = [];

    for (const section of Object.keys(deckState)) {
        for (const entry of deckState[section].values()) {
            cards.push({
                cardId: entry.cardId,
                section,
                quantity: entry.quantity
            });
        }
    }

    return cards;
}

function updateDeckCounts() {
    for (const section of Object.keys(deckState)) {
        sectionCountElements[section].textContent = String(getSectionCount(section));
    }

    const mainCount = getSectionCount('main');
    const extraCount = getSectionCount('extra');
    const sideCount = getSectionCount('side');
    const name = deckNameInput.value.trim();
    const currentFingerprint = JSON.stringify({ name, cards: getDeckPayload() });

    const deckHasValidSizes =
        mainCount >= 40 && mainCount <= 60 &&
        extraCount <= 15 &&
        sideCount <= 15;

    saveDeckButton.disabled =
        name.length === 0 ||
        !deckHasValidSizes ||
        currentFingerprint === lastSavedFingerprint;
}

function renderDeckSection(section) {
    const container = sectionElements[section];
    container.replaceChildren();

    for (const entry of deckState[section].values()) {
        const card = cardCache.get(entry.cardId);
        if (!card) continue;

        for (let copyNumber = 0; copyNumber < entry.quantity; copyNumber++) {
            const tile = document.createElement('article');
            tile.className = 'deck-card';
            tile.dataset.cardId = String(card.id);
            tile.setAttribute('role', 'listitem');
            tile.tabIndex = 0;
            tile.draggable = true;
            tile.setAttribute(
                'aria-label',
                `${card.name}, copy ${copyNumber + 1} of ${entry.quantity} in ${section} deck`
            );

            const image = document.createElement('img');
            image.src = card.imageUrl || card.thumbnailUrl;
            image.alt = card.name;
            image.draggable = false;
            image.loading = 'lazy';

            const removeButton = document.createElement('button');
            removeButton.className = 'remove-copy-button';
            removeButton.type = 'button';
            removeButton.textContent = '×';
            removeButton.setAttribute(
                'aria-label',
                `Remove one copy of ${card.name} from ${section} deck`
            );
            removeButton.addEventListener('click', () => {
                removeOneCopy(card.id, section);
            });

            tile.append(image, removeButton);
            tile.addEventListener('dragstart', event => {
                event.dataTransfer.setData('text/plain', String(card.id));
                event.dataTransfer.setData('application/x-yugi-source-section', section);
                event.dataTransfer.effectAllowed = 'move';
            });

            container.append(tile);
        }
    }
}

function renderDeck() {
    for (const section of Object.keys(deckState)) {
        renderDeckSection(section);
    }
    updateDeckCounts();
}

function addCardToSection(card, targetSection, sourceSection = null) {
    const targetDeck = deckState[targetSection];
    if (!targetDeck) return;

    if (sourceSection === targetSection) {
        return;
    }

    if (targetSection === 'extra' && !isExtraDeckCard(card)) {
        deckSaveStatus.textContent = 'Only Fusion, Synchro, Xyz, and Link monsters go in the Extra Deck.';
        return;
    }

    if (targetSection === 'main' && isExtraDeckCard(card)) {
        deckSaveStatus.textContent = 'That card belongs in the Extra Deck.';
        return;
    }

    if (getSectionCount(targetSection) >= sectionLimits[targetSection]) {
        deckSaveStatus.textContent = `${targetSection} deck is full.`;
        return;
    }

    if (sourceSection) {
        const sourceDeck = deckState[sourceSection];
        const sourceEntry = sourceDeck?.get(card.id);

        if (!sourceEntry) return;

        if (sourceEntry.quantity === 1) {
            sourceDeck.delete(card.id);
        } else {
            sourceEntry.quantity -= 1;
        }
    } else if (getTotalCopies(card.id) >= maxCopiesPerCard) {
        deckSaveStatus.textContent = `You can include at most 3 copies of ${card.name} across all sections.`;
        return;
    }

    const targetEntry = targetDeck.get(card.id);

    if (targetEntry) {
        targetEntry.quantity += 1;
    } else {
        targetDeck.set(card.id, { cardId: card.id, quantity: 1 });
    }

    deckSaveStatus.textContent = `${card.name} added to ${targetSection} deck.`;
    renderDeck();
}

function removeOneCopy(cardId, section) {
    const entry = deckState[section].get(cardId);
    if (!entry) return;

    if (entry.quantity === 1) {
        deckState[section].delete(cardId);
    } else {
        entry.quantity -= 1;
    }

    const card = cardCache.get(cardId);
    deckSaveStatus.textContent = `Removed one copy of ${card?.name || 'card'} from ${section} deck.`;
    renderDeck();
}

for (const [section, container] of Object.entries(sectionElements)) {
    container.addEventListener('dragover', event => {
        event.preventDefault();
        container.classList.add('is-drop-target');
    });

    container.addEventListener('dragleave', event => {
        if (!container.contains(event.relatedTarget)) {
            container.classList.remove('is-drop-target');
        }
    });

    container.addEventListener('drop', event => {
        event.preventDefault();
        container.classList.remove('is-drop-target');

        const cardId = Number(event.dataTransfer.getData('text/plain'));
        const card = cardCache.get(cardId);
        const sourceSection = event.dataTransfer.getData(
            'application/x-yugi-source-section'
        ) || null;

        if (card) {
            addCardToSection(card, section, sourceSection);
        }
    });
}

function showCardPreview(card) {
    cardPreviewName.textContent = card.name;
    cardPreviewImage.hidden = !card.imageUrl;

    if (card.imageUrl) {
        cardPreviewImage.src = card.imageUrl;
        cardPreviewImage.alt = card.name;
    }

    const levelOrLink = getLevelOrLinkDetail(card);

    const detailRows = [
        { values: [card.type], fullWidth: true },
        {
            values: [
                card.attribute && `Attribute: ${card.attribute}`,
                card.race && `Type: ${card.race}`
            ]
        },
        {
            values: [
                levelOrLink,
                card.scale !== undefined && `Scale: ${card.scale}`
            ]
        },
        {
            values: [
                card.atk !== undefined && `ATK: ${card.atk}`,
                card.def !== undefined && `DEF: ${card.def}`
            ]
        }
    ].filter(row => row.values.some(Boolean));

    cardPreviewDetails.replaceChildren();

    for (const rowData of detailRows) {
        const row = document.createElement('div');
        row.className = 'card-preview-row';

        for (const value of rowData.values.filter(Boolean)) {
            const cell = document.createElement('span');
            cell.textContent = value;

            if (rowData.fullWidth) {
                cell.classList.add('full-width');
            }

            row.append(cell);
        }

        cardPreviewDetails.append(row);
    }

    cardPreviewDescription.textContent = card.desc || 'No card description available.';
}

function getCardElement(target) {
    if (!(target instanceof Element)) return null;
    return target.closest('[data-card-id]');
}

document.addEventListener('pointerover', event => {
    const cardElement = getCardElement(event.target);
    if (!cardElement) return;

    const previousCardElement = getCardElement(event.relatedTarget);
    if (previousCardElement === cardElement) return;

    const card = cardCache.get(Number(cardElement.dataset.cardId));
    if (card) showCardPreview(card);
});

document.addEventListener('focusin', event => {
    const cardElement = getCardElement(event.target);
    if (!cardElement) return;

    const card = cardCache.get(Number(cardElement.dataset.cardId));
    if (card) showCardPreview(card);
});

deckNameInput.addEventListener('input', updateDeckCounts);

deckForm.addEventListener('submit', async event => {
    event.preventDefault();

    const name = deckNameInput.value.trim();
    const cards = getDeckPayload();
    const fingerprint = JSON.stringify({ name, cards });

    saveDeckButton.disabled = true;
    deckSaveStatus.textContent = 'Saving deck…';

    try {
        const isUpdating = loadedDeckId !== null;
        const saveUrl = isUpdating
            ? `/api/decks/${encodeURIComponent(loadedDeckId)}`
            : '/api/decks';
        const response = await fetch(saveUrl, {
            method: isUpdating ? 'PUT' : 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, cards })
        });
        const result = await response.json();

        if (!response.ok) {
            const details = Array.isArray(result.details)
                ? result.details.join(' ')
                : result.error || 'Could not save deck.';
            throw new Error(details);
        }

        loadedDeckId = result.deck.id;
        lastSavedFingerprint = fingerprint;
        await loadSavedDecks();
        savedDeckSelect.value = loadedDeckId;
        loadDeckButton.disabled = false;
        deckSaveStatus.textContent = `Saved “${result.deck.name}”.`;
    } catch (error) {
        deckSaveStatus.textContent = error.message;
    } finally {
        updateDeckCounts();
    }
});

async function loadSavedDecks() {
    savedDeckSelect.disabled = true;
    savedDeckSelect.replaceChildren();

    const loadingOption = document.createElement('option');
    loadingOption.value = '';
    loadingOption.textContent = 'Loading saved decks…';
    savedDeckSelect.append(loadingOption);

    try {
        const response = await fetch('/api/decks');
        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || 'Could not load saved decks.');
        }

        savedDecks = Array.isArray(result.decks) ? result.decks : [];
        savedDeckSelect.replaceChildren();

        const placeholder = document.createElement('option');
        placeholder.value = '';
        placeholder.textContent = savedDecks.length
            ? 'Choose a saved deck'
            : 'No saved decks yet';
        savedDeckSelect.append(placeholder);

        for (const deck of savedDecks) {
            const option = document.createElement('option');
            option.value = deck.id;
            option.textContent = deck.name;
            savedDeckSelect.append(option);
        }

        savedDeckSelect.disabled = savedDecks.length === 0;
    } catch (error) {
        savedDecks = [];

        const errorOption = document.createElement('option');
        errorOption.value = '';
        errorOption.textContent = 'Could not load saved decks';
        savedDeckSelect.replaceChildren(errorOption);

        deckSaveStatus.textContent = error.message;
    }
}

savedDeckSelect.addEventListener('change', () => {
    loadDeckButton.disabled = savedDeckSelect.value === '';
});

loadDeckButton.addEventListener('click', async () => {
    const selectedDeck = savedDecks.find(
        deck => deck.id === savedDeckSelect.value
    );

    if (!selectedDeck) return;

    loadDeckButton.disabled = true;
    deckSaveStatus.textContent = `Loading “${selectedDeck.name}”…`;

    try {
        const cardIds = [
            ...new Set(selectedDeck.cards.map(entry => entry.cardId))
        ];

        if (cardIds.length === 0) {
            throw new Error('This saved deck contains no cards.');
        }

        const response = await fetch(
            `/api/cards?ids=${encodeURIComponent(cardIds.join(','))}`
        );
        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || 'Could not load card data.');
        }

        const cardsById = new Map(
            result.cards.map(card => [card.id, card])
        );

        if (cardsById.size !== cardIds.length) {
            throw new Error('Some saved cards are missing from the card catalog.');
        }

        if (selectedDeck.cards.some(entry => !deckState[entry.section])) {
            throw new Error('This saved deck has an invalid section.');
        }

        for (const card of result.cards) {
            cardCache.set(card.id, card);
        }

        for (const section of Object.values(deckState)) {
            section.clear();
        }

        for (const entry of selectedDeck.cards) {
            deckState[entry.section].set(entry.cardId, {
                cardId: entry.cardId,
                quantity: entry.quantity
            });
        }

        deckNameInput.value = selectedDeck.name;
        loadedDeckId = selectedDeck.id;
        lastSavedFingerprint = JSON.stringify({
            name: selectedDeck.name,
            cards: getDeckPayload()
        });

        renderDeck();
        deckSaveStatus.textContent = `Loaded “${selectedDeck.name}”.`;
    } catch (error) {
        deckSaveStatus.textContent = error.message;
    } finally {
        loadDeckButton.disabled = savedDeckSelect.value === '';
    }
});

loadSavedDecks();
renderDeck();
