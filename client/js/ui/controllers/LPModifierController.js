export default class LPModifierController {
    constructor(state) {
        this.state = state;
        this.activeSide = null;
        this.activeInfoBox = null;
    }

    initListeners() {
        this.initLPListeners();
        this.initLPModifierListeners();
    }

    initLPListeners() {
        document.getElementById('player-info-box').addEventListener('click', event => {
            event.stopPropagation();
            this.openModifier(event.currentTarget, 'player');
        });

        document.getElementById('opponent-info-box').addEventListener('click', event => {
            event.stopPropagation();
            this.openModifier(event.currentTarget, 'opponent');
        });
    }

    initLPModifierListeners() {
        const modifier = document.getElementById('lp-modifier');
        const input = document.getElementById('lp-modifier-input');

        modifier.addEventListener('click', event => {
            const button = event.target.closest('[data-action]');
            if (!button || !modifier.contains(button)) return;
            this.modifyLifePoints(button.dataset.action);
        });

        input.addEventListener('keydown', event => {
            if (event.key !== 'Enter') return;
            event.preventDefault();
            this.modifyLifePoints('add');
        });

        document.addEventListener('click', event => {
            if (modifier.classList.contains('hidden')) return;
            if (event.target.closest('#lp-modifier, .player-info-box')) return;
            this.closeModifier();
        });

        document.addEventListener('keydown', event => {
            if (event.key === 'Escape') this.closeModifier();
        });
    }

    openModifier(infoBox, side) {
        const modifier = document.getElementById('lp-modifier');
        const popup = modifier?.querySelector('.lp-modifier-container');
        const input = document.getElementById('lp-modifier-input');
        if (!modifier || !popup) return;

        this.activeSide = side;
        this.activeInfoBox = infoBox;
        modifier.classList.remove('hidden');

        const anchor = infoBox.getBoundingClientRect();
        const popupRect = popup.getBoundingClientRect();
        const gap = 10;
        const margin = 12;
        const fitsRight = anchor.right + gap + popupRect.width <= window.innerWidth - margin;
        const fitsLeft = anchor.left - gap - popupRect.width >= margin;

        let left;
        if (fitsRight) {
            left = anchor.right + gap;
        } else if (fitsLeft) {
            left = anchor.left - popupRect.width - gap;
        } else {
            left = anchor.left + (anchor.width - popupRect.width) / 2;
        }

        const maxLeft = Math.max(margin, window.innerWidth - popupRect.width - margin);
        const maxTop = Math.max(margin, window.innerHeight - popupRect.height - margin);
        const top = anchor.top + (anchor.height - popupRect.height) / 2;

        modifier.style.setProperty('--lp-popup-left', `${Math.max(margin, Math.min(left, maxLeft))}px`);
        modifier.style.setProperty('--lp-popup-top', `${Math.max(margin, Math.min(top, maxTop))}px`);

        if (input) {
            input.value = '';
            input.focus({ preventScroll: true });
        }
    }

    closeModifier() {
        document.getElementById('lp-modifier')?.classList.add('hidden');
        this.activeSide = null;
        this.activeInfoBox = null;
    }

    async modifyLifePoints(action) {
        if (!['add', 'subtract'].includes(action) || !this.activeSide) return;

        const target = this.activeSide;
        const input = document.getElementById('lp-modifier-input');
        const amount = Number(input.value);
        if (!Number.isSafeInteger(amount) || amount <= 0) {
            input.setCustomValidity('Enter a whole number greater than zero.');
            input.reportValidity();
            return;
        }
        input.setCustomValidity('');

        try {
            const response = await fetch('/api/lp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sessionId: sessionStorage.getItem('yugiSessionId'),
                    target,
                    action,
                    amount
                })
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'LP update failed');

            this.state[target].lp = result.lp;
            const lpElementId = target === 'player' ? 'player-lp' : 'opponent-lp';
            document.getElementById(lpElementId).textContent = `${result.lp} LP`;
            if (this.activeSide === target) this.closeModifier();
        } catch (error) {
            console.error('Could not update Life Points:', error);
        }
    }
}
