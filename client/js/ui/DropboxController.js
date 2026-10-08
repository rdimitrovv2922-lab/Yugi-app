export default class DropboxController {
    constructor(gameState) {
        this.dropbox = document.getElementById('dropbox');
        this.dropboxMonster = document.getElementById('dropbox-monster');
        this.dropboxSpellTrap = document.getElementById('dropbox-spell-trap');
        this.dropboxSendTo = document.getElementById('dropbox-send-to');
        this.dropboxSwitchPosition = document.getElementById('dropbox-switch-position');

        this.dropboxPile = document.getElementById('dropbox-pile');

        this.state = gameState;
    }

    hideAll() {
        this.dropbox.classList.add('hidden');
        this.dropboxMonster.classList.add('hidden');
        this.dropboxSpellTrap.classList.add('hidden');
        this.dropboxSendTo.classList.add('hidden');
        this.dropboxSwitchPosition.classList.add('hidden');

        this.dropboxPile.classList.add('hidden');
    }

    showDropbox(x, y, dropboxId='dropbox') {
        const dropbox = document.getElementById(`${dropboxId}`);

        const visibleChildren = dropbox.querySelectorAll(':not(.hidden)');
        if (visibleChildren.length === 0) {
            dropbox.classList.add('hidden');
            return;
        }

        dropbox.classList.remove('hidden');
        
        let finalX = Math.min(x, window.innerWidth - dropbox.offsetWidth - 10);
        let finalY = Math.min(y, window.innerHeight - dropbox.offsetHeight - 10);
        
        dropbox.style.left = `${finalX}px`;
        dropbox.style.top = `${finalY}px`;
    }

    isInsideAnyDropbox(target) {
        return target.closest('.dropbox') !== null || target.closest('[id^="dropbox-"]') !== null;
    }

    setupDropboxes(activeCardInstance, isOwnerPlayer) {
        const sourceLocation = activeCardInstance.location;

        const show = (selector, context = this.dropbox) => context.querySelector(selector)?.classList.remove('hidden');
        const hide = (selector, context = this.dropbox) => context.querySelector(selector)?.classList.add('hidden');

        this.dropbox.querySelectorAll('.dropbox-item').forEach(el => el.classList.add('hidden'));
        this.dropboxSendTo.querySelectorAll('[data-action]').forEach(el => el.classList.remove('hidden'));
        this.dropboxSwitchPosition.querySelectorAll('[data-action]').forEach(el => el.classList.remove('hidden'));
        this.dropboxMonster.querySelectorAll('[data-action]').forEach(el => el.classList.remove('hidden'));

        if(!isOwnerPlayer) {
            if (sourceLocation === 'spellTrapZone' || sourceLocation === 'graveyard' || sourceLocation === 'banish') show('#target');

            if(sourceLocation === 'monsterZone') {
                show('#target');
                const zoneData = this.state.opponent.monsterZones[activeCardInstance.zoneKey];
                if (zoneData.card.instanceId === activeCardInstance.instanceId && zoneData.materials.length > 0) {
                    show('#view');
                } else if (zoneData.card.instanceId !== activeCardInstance.instanceId && zoneData.materials.length > 0) {
                    hide('#target');
                }
            }
            return;
        }

        const isXyz =
            activeCardInstance.rawApiData?.frameType?.toLowerCase() === 'xyz' ||
            activeCardInstance.type?.toLowerCase().includes('xyz');

        hide('[data-action="xyz-summon"]', this.dropboxMonster);
        if (this.state.hasXyzMonsterPresent()) show('#attach');

        switch (sourceLocation) {
            case 'extradeck':
                if (isXyz) show('[data-action="xyz-summon"]', this.dropboxMonster);
                hide('[data-action="normal-summon"]', this.dropboxMonster);
                hide('[data-action="set"]', this.dropboxMonster);
            case 'deck':
            case 'hand':
            case 'graveyard':
                show('#monster');
                show('#spell-trap');
                show('#send');
                if (sourceLocation !== 'deck') show('#activate');
                if (sourceLocation === 'graveyard') show('#target');
                hide(`[data-action="${sourceLocation}"]`, this.dropboxSendTo);
                break;

            case 'banish':
                show('#monster');
                show('#spell-trap');
                show('#send');
                show('#activate');
                show('#target');
                hide('[data-action="banish-up"]', this.dropboxSendTo);
                hide('[data-action="banish-down"]', this.dropboxSendTo);
                break;

            case 'monsterZone': {
                show('#activate');
                show('#send');
                show('#move');
                show('#switch');
                show('#target');

                const zoneData = this.state.player.monsterZones[activeCardInstance.zoneKey];
                if (zoneData?.card) {
                    if (zoneData.card.instanceId === activeCardInstance.instanceId && zoneData.materials.length > 0) {
                        show('#view');
                    } else if (zoneData.card.instanceId !== activeCardInstance.instanceId && zoneData.materials.length > 0) {
                        hide('#activate');
                        break;
                    }
                }

                if (activeCardInstance.isPositionAttack) {
                    hide('[data-action="to-atk"]', this.dropboxSwitchPosition);
                } else if (activeCardInstance.isFaceUp) {
                    hide('[data-action="to-def"]', this.dropboxSwitchPosition);
                } else {
                    hide('[data-action="to-set"]', this.dropboxSwitchPosition);
                }
                break;
            }

            case 'spellTrapZone':
                show('#activate');
                show('#send');
                show('#move');
                show('#target');
                show('#flip');
                break;
        }
    }

    setupDropboxPile(sourceLocation, isOwnerPlayer) {
        const allOptions = this.dropboxPile.querySelectorAll('.dropbox-item');
        allOptions.forEach(el => el.classList.add('hidden'));

        let pileActions = null;

        if(isOwnerPlayer) {
            pileActions = {
                deck: ['draw', 'shuffle', 'mill', 'banish-up', 'banish-down', 'view'],
                extradeck: ['view', 'shuffle', 'banish-r-up', 'banish-r-down', 'to-gy-r'],
                graveyard: ['view', 'banish-r-up', 'banish-r-down'],
                banish: ['view', 'to-gy-r', 'to-deck-r']
            };
        } else {
            pileActions = {
                deck: ['view'],
                extradeck: ['view'],
                graveyard: ['view'],
                banish: ['view']
            };
        }

        const actionsToShow = pileActions[sourceLocation] || [];
        actionsToShow.forEach(action => {
            const item = this.dropboxPile.querySelector(`[data-action="${action}"]`);
            if (item) item.classList.remove('hidden');
        });
    }
}