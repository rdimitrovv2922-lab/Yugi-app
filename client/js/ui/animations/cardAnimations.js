import { CARD_BACK_URL } from '../cardAssets.js';

const hiddenDestinationCounts = new WeakMap();

function findRenderedCard(instanceId, includeWindow = false) {
    return Array.from(document.querySelectorAll('[data-instance-id]'))
        .find(element => element.dataset.instanceId === instanceId &&
            (includeWindow || !element.closest('#window-container'))) || null;
}

function findPileSlot(entry) {
    const prefix = entry.side === 'player' ? '' : 'op-';
    const pileIds = {
        deck: `${prefix}deck`,
        extradeck: `${prefix}extradeck`,
        graveyard: `${prefix}graveyard`,
        banish: `${prefix}banish`
    };
    return pileIds[entry.location] ? document.getElementById(pileIds[entry.location]) : null;
}

function findCardAnchor(entry, includeWindow = false) {
    return findRenderedCard(entry.card.instanceId, includeWindow) ||
        (entry.hostInstanceId ? findRenderedCard(entry.hostInstanceId) : null) ||
        findPileSlot(entry);
}

function copyRect(element) {
    if (!element) return null;
    const rect = element.getBoundingClientRect();
    if (!rect.width || !rect.height) return null;

    const transform = getComputedStyle(element).transform;
    let angle = 0;
    if (transform && transform !== 'none') {
        const matrix = new DOMMatrixReadOnly(transform);
        angle = Math.atan2(matrix.b, matrix.a) * (180 / Math.PI);
    }

    const isQuarterTurn = Math.abs(Math.sin(angle * (Math.PI / 180))) > 0.5;
    const width = isQuarterTurn ? rect.height : rect.width;
    const height = isQuarterTurn ? rect.width : rect.height;

    return {
        centerX: rect.left + rect.width / 2,
        centerY: rect.top + rect.height / 2,
        width,
        height,
        angle
    };
}

export function captureCardPosition(entry) {
    return copyRect(findCardAnchor(entry, true));
}

function isVisibleToViewer(entry) {
    if (!entry?.card || ['deck', 'extradeck'].includes(entry.location)) return false;
    if (entry.isMaterial) return true;
    if (entry.location === 'hand') {
        return entry.side === 'player' || entry.card.isVisibleToOpponent;
    }
    if (entry.location === 'banish') return entry.card.isFaceUp;
    if (entry.location === 'graveyard') return true;
    return Boolean(entry.card.isFaceUp);
}

function addStackLayers(flight, stackCards) {
    const visibleCards = stackCards.slice(-3).reverse();
    for (let index = 0; index < visibleCards.length; index++) {
        const layer = document.createElement('img');
        layer.className = 'card-transfer-animation__stack-layer';
        layer.src = visibleCards[index].imageUrl || CARD_BACK_URL;
        layer.alt = visibleCards[index].name || 'Card material';
        layer.style.transform = `translate(${(visibleCards.length - index) * 2}px, ${(visibleCards.length - index) * 2}px)`;
        flight.appendChild(layer);
    }
}

function hideDestination(element) {
    const count = hiddenDestinationCounts.get(element) || 0;
    hiddenDestinationCounts.set(element, count + 1);
    element.classList.add('is-moving');
}

function showDestination(element) {
    const count = hiddenDestinationCounts.get(element) || 0;
    if (count <= 1) {
        hiddenDestinationCounts.delete(element);
        element.classList.remove('is-moving');
    } else {
        hiddenDestinationCounts.set(element, count - 1);
    }
}

export function animateCardMove({ card, sourceEntry, destinationEntry, sourceRect, stackCards = [] }) {
    const destination = findCardAnchor(destinationEntry);
    const end = copyRect(destination);
    if (!card || !sourceRect || !destination || !end || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const flight = document.createElement('div');
    flight.className = 'card-transfer-animation';
    Object.assign(flight.style, {
        left: `${sourceRect.centerX - sourceRect.width / 2}px`,
        top: `${sourceRect.centerY - sourceRect.height / 2}px`,
        width: `${sourceRect.width}px`,
        height: `${sourceRect.height}px`
    });
    addStackLayers(flight, stackCards);

    const sourceVisible = isVisibleToViewer(sourceEntry);
    const destinationVisible = isVisibleToViewer(destinationEntry);
    const flip = document.createElement('div');
    flip.className = 'card-transfer-animation__flip';
    const back = document.createElement('img');
    back.src = CARD_BACK_URL;
    back.alt = 'Card back';
    flip.appendChild(back);

    if (sourceVisible || destinationVisible) {
        const front = document.createElement('img');
        front.className = 'card-transfer-animation__front';
        front.src = card.imageUrl;
        front.alt = destinationVisible ? card.name : '';
        flip.appendChild(front);
    }

    const sourceFlipAngle = sourceVisible ? 180 : 0;
    const destinationFlipAngle = destinationVisible ? 180 : 0;
    flip.style.transform = `rotateY(${sourceFlipAngle}deg)`;
    flight.appendChild(flip);
    document.body.appendChild(flight);
    if (typeof flight.animate !== 'function') {
        flight.remove();
        return;
    }

    const shouldHideDestination = !destinationEntry.isMaterial;
    const destinationImage = destination.querySelector(':scope > img') || destination;
    if (shouldHideDestination) hideDestination(destinationImage);

    const deltaX = end.centerX - sourceRect.centerX;
    const deltaY = end.centerY - sourceRect.centerY;
    const scale = end.width / sourceRect.width;
    const movement = flight.animate([
        { transform: `translate(0, 0) rotate(${sourceRect.angle}deg) scale(1)` },
        { transform: `translate(${deltaX}px, ${deltaY}px) rotate(${end.angle}deg) scale(${scale})` }
    ], {
        duration: 650,
        easing: 'cubic-bezier(0.22, 0.75, 0.25, 1)',
        fill: 'forwards'
    });
    const reveal = sourceFlipAngle !== destinationFlipAngle
        ? flip.animate([
            { transform: `rotateY(${sourceFlipAngle}deg)` },
            { transform: `rotateY(${destinationFlipAngle}deg)` }
        ], {
            duration: 650,
            easing: 'ease-in-out',
            fill: 'forwards'
        })
        : null;

    Promise.all([movement.finished, ...(reveal ? [reveal.finished] : [])])
        .catch(() => {})
        .finally(() => {
            flight.remove();
            if (shouldHideDestination) showDestination(destinationImage);
        });
}

export function animateCardDraw(gameState, side, instanceId, movement) {
    const card = gameState[side].hand.find(handCard => handCard.instanceId === instanceId);
    if (!card || !movement) return;
    animateCardMove({ ...movement, card });
}
