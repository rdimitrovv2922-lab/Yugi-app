export default class DropboxController {
    constructor() {
        this.dropbox = document.getElementById('dropbox');
        this.dropboxMonster = document.getElementById('dropbox-monster');
        this.dropboxSpellTrap = document.getElementById('dropbox-spell-trap');
        this.dropboxSendTo = document.getElementById('dropbox-send-to');
        this.dropboxSwitchPosition = document.getElementById('dropbox-switch-position');
    }

    hideAll() {
        this.dropbox.classList.add('hidden');
        this.dropboxMonster.classList.add('hidden');
        this.dropboxSpellTrap.classList.add('hidden');
        this.dropboxSendTo.classList.add('hidden');
        this.dropboxSwitchPosition.classList.add('hidden');
    }

    showDropbox(x, y, dropboxId='dropbox') {
        const dropbox = document.getElementById(`${dropboxId}`);
        dropbox.classList.remove('hidden');
        
        let finalX = Math.min(x, window.innerWidth - dropbox.offsetWidth - 10);
        let finalY = Math.min(y, window.innerHeight - dropbox.offsetHeight - 10);
        
        dropbox.style.left = `${finalX}px`;
        dropbox.style.top = `${finalY}px`;
    }

    isInsideAnyDropbox(target) {
        return target.closest('.dropbox') !== null || target.closest('[id^="dropbox-"]') !== null;
    }

    setupDropboxes(activeCardInstance) {
        const sourceLocation = activeCardInstance.location;

        const allOptions = this.dropbox.querySelectorAll('.dropbox-item');
        allOptions.forEach(el => el.classList.add('hidden'));

        const allSendToOptions = this.dropboxSendTo.querySelectorAll('[data-action]');
        allSendToOptions.forEach(el => el.classList.remove('hidden'));

        const allSwitchPositionOptions = this.dropboxSwitchPosition.querySelectorAll('[data-action]');
        allSwitchPositionOptions.forEach(el => el.classList.add('hidden'));

        switch(sourceLocation) {
            case 'deck':
            case 'extradeck':
            case 'hand':
            case 'graveyard':
            case 'banish':    
                this.dropbox.querySelector('#monster').classList.remove('hidden');
                this.dropbox.querySelector('#spell-trap').classList.remove('hidden');
                this.dropbox.querySelector('#send').classList.remove('hidden');
                if (sourceLocation != 'deck') this.dropbox.querySelector('#activate').classList.remove('hidden');

                this.dropboxSendTo.querySelector(`[data-action="${sourceLocation}"]`).classList.add('hidden');
                break;
            case 'monsterZone':
            case 'spellTrapZone':
                this.dropbox.querySelector('#activate').classList.remove('hidden');
                this.dropbox.querySelector('#send').classList.remove('hidden');
                this.dropbox.querySelector('#move').classList.remove('hidden');
                this.dropbox.querySelector('#switch').classList.remove('hidden');

                if (sourceLocation === 'spellTrapZone') {
                    this.dropboxSwitchPosition.querySelector('[data-action="flip"]').classList.remove('hidden');
                } else if (activeCardInstance.isPositionAttack) {
                    this.dropboxSwitchPosition.querySelector('[data-action="to-set"]').classList.remove('hidden');
                    this.dropboxSwitchPosition.querySelector('[data-action="to-def"]').classList.remove('hidden');
                } else if (activeCardInstance.isFaceUp) {
                    this.dropboxSwitchPosition.querySelector('[data-action="to-atk"]').classList.remove('hidden');
                    this.dropboxSwitchPosition.querySelector('[data-action="to-set"]').classList.remove('hidden');
                } else {
                    this.dropboxSwitchPosition.querySelector('[data-action="to-atk"]').classList.remove('hidden');
                    this.dropboxSwitchPosition.querySelector('[data-action="to-def"]').classList.remove('hidden');
                }
                break;   
        }
    }
}