import * as Rules from './core/GameRules.js';
import * as PhaseView from './ui/PhaseView.js';
import DropboxController from './ui/DropboxController.js';
import * as BoardView from './ui/BoardView.js';

export default class InputController {
    constructor(state, renderBoardCallback) {
        this.state = state;
        this.renderBoard = renderBoardCallback;
        
        this.activeCardInstance = null;

        this.isWaitingForMonsterZone = false;
        this.isWaitingForSpellTrapZone = false;

        this.isSettingCard = false;
        this.isAttackPosition = true;

        this.dropboxController = new DropboxController();

        this.initListeners();
    }

    findCardInstance(instanceId) {
        const p = this.state.player;

        return p.hand.find(c => c.instanceId === instanceId) ||
               p.deck.find(c => c.instanceId === instanceId) ||
               p.extradeck.find(c => c.instanceId === instanceId) ||
               p.graveyard.find(c => c.instanceId === instanceId) ||
               p.banish.find(c => c.instanceId === instanceId) ||
               Object.values(p.monsterZones).find(c => c !== null && c.instanceId === instanceId) ||
               Object.values(p.spellTrapZones).find(c => c !== null && c.instanceId === instanceId);
    }

    resetInteractionState() {
        this.activeCardInstance = null;
    
        this.isWaitingForMonsterZone = false;
        this.isWaitingForSpellTrapZone = false;
    
        this.isSettingCard = false;
        this.isAttackPosition = true;
    
        BoardView.clearHighlightedZones();
    }

    hideAllDropboxes() {
        this.dropboxController.hideAll();
    }

    initPhaseTrackerListeners() {
        document.querySelectorAll('#phase-tracker .phase').forEach(phase => {
            phase.addEventListener('click', () => {
                const phaseCode = phase.getAttribute('data-phase');
                if (phaseCode) PhaseView.updatePhaseDisplay(phaseCode);
            });
        });
    }
    
    initDrawButtonListener() {
        document.getElementById('draw-btn-player').addEventListener('click', () => {
            if(this.isWaitingForMonsterZone || this.isWaitingForSpellTrapZone){
                return;
            }
    
            Rules.drawCard(this.state);
            this.renderBoard(this.state);
        });
    }

    initCardClickListener() {
        document.getElementById('game-container').addEventListener('click', (event) => {
            const cardSlot = event.target.closest('[data-instance-id]');
            if(!cardSlot) return;

            const isInsidePlayerField = cardSlot.closest('#player-field');
            const isInsidePlayerHand = cardSlot.closest('#player-hand');
            const isInsideExtraMonsterZone = cardSlot.closest('#extra-monster-zone');

            if (!isInsidePlayerField && !isInsidePlayerHand && !isInsideExtraMonsterZone) return;

            event.stopPropagation();
            this.hideAllDropboxes();
            this.resetInteractionState();

            const instanceId = cardSlot.getAttribute('data-instance-id')
            this.activeCardInstance = this.findCardInstance(instanceId);

            if(this.activeCardInstance) {
                console.log(this.activeCardInstance.instanceId);
                this.dropboxController.setupDropboxes(this.activeCardInstance);                
                this.dropboxController.showDropbox(event.clientX, event.clientY);
            }
        });
    }

    initDropboxListener() {
        this.dropboxController.dropbox.addEventListener('click', (event) => {
            const action = event.target.getAttribute('data-action');
            if (!action || !this.activeCardInstance) return;

            this.hideAllDropboxes();

            switch (action) {
                case 'monster':
                    this.dropboxController.showDropbox(event.clientX, event.clientY, 'dropbox-monster');
                    break;
                case 'spell-trap':
                    this.dropboxController.showDropbox(event.clientX, event.clientY, 'dropbox-spell-trap');
                    break;
                case 'activate':
                    console.log(`Card ${this.activeCardInstance.name} has been activated from ${this.activeCardInstance.location}!`);
                    break;
                case 'send':
                    this.dropboxController.showDropbox(event.clientX, event.clientY, 'dropbox-send-to');
                    break;
                case 'move':
                    break;
                case 'switch':
                    this.dropboxController.showDropbox(event.clientX, event.clientY, 'dropbox-switch-position');
            }
        });
    }

    initDropboxMonsterListener() {
       this.dropboxController.dropboxMonster.addEventListener('click', (event) => {
            const action = event.target.getAttribute('data-action');
            if (!action || !this.activeCardInstance) return;
            
            this.hideAllDropboxes();

            switch (action) {
                case 'normal-summon':
                case 'special-summon-atk':
                    this.isAttackPosition = true;
                    this.isSettingCard = false;
                    break;
                case 'set':
                    this.isAttackPosition = false;
                    this.isSettingCard = true;
                    break;
                case 'special-summon-def':
                    this.isAttackPosition = false;
                    this.isSettingCard = false;
                    break
            }
        
            this.isWaitingForMonsterZone = true;
            BoardView.highlightValidMonsterZones(this.state, this.isSettingCard);
        });
    }

    initDropboxSpellTrapListener() {
        this.dropboxController.dropboxSpellTrap.addEventListener('click', (event) => {
            const action = event.target.getAttribute('data-action');
            if (!action || !this.activeCardInstance) return;
            
            this.hideAllDropboxes();

            switch (action) {
                case 'activate':
                    this.isSettingCard = false;
                    break;
                case 'set':
                    this.isSettingCard = true;
                    break;
            }
        
            this.isWaitingForSpellTrapZone = true;
            BoardView.highlightValidSpellTrapZones(this.state);
        });
    }

    initDropboxSendToListener() {
        this.dropboxController.dropboxSendTo.addEventListener('click', (event) => {
            const action = event.target.getAttribute('data-action');
            if (!action || !this.activeCardInstance) return;
            
            this.hideAllDropboxes();

            switch (action) {
                case 'graveyard':
                    Rules.sendCardToGraveyard(this.state, this.activeCardInstance);
                    break;
                case 'banish':
                    Rules.sendCardToBanish(this.state, this.activeCardInstance);
                    break;
                case 'hand':
                    Rules.sendCardToHand(this.state, this.activeCardInstance);
                    break;
                case 'deck':
                    Rules.sendCardToDeck(this.state, this.activeCardInstance);
                    break
                case 'extradeck':
                    Rules.sendCardToExtraDeck(this.state, this.activeCardInstance);
                    break;
            }
        
            this.resetInteractionState();
            this.renderBoard(this.state);
        });
    }

    initDropboxSwitchPositionListener() {
        this.dropboxController.dropboxSwitchPosition.addEventListener('click', (event) => {
            const action = event.target.getAttribute('data-action');
            if(!action || !this.activeCardInstance) return;

            this.hideAllDropboxes();

            switch (action) {
                case 'to-atk':
                    Rules.switchBattlePositionToAtk(this.state, this.activeCardInstance);
                    break;
                case 'to-def':
                    Rules.switchBattlePositionToDef(this.state, this.activeCardInstance, true);
                    break;
                case 'to-set':
                    Rules.switchBattlePositionToDef(this.state, this.activeCardInstance, false);
                    break;
                case 'flip':
                    Rules.flipCard(this.state, this.activeCardInstance);
                    break;
            }

            this.resetInteractionState();
            this.renderBoard(this.state);
        });
    }

    initBoardPlacementListeners() {
        document.addEventListener('click', (event) => {
            // 1. Outside-click drop-down closing check via DropboxController
            if (!this.dropboxController.isInsideAnyDropbox(event.target) && 
                !event.target.closest('.card-hand')) {
                this.hideAllDropboxes();
            }

            // 2. If we aren't waiting to place a card, stop here
            if (!this.isWaitingForMonsterZone && !this.isWaitingForSpellTrapZone || !this.activeCardInstance) {
                return;
            }

            // 3. MONSTER ZONE PLACEMENT HANDLING
            if (this.isWaitingForMonsterZone) {
                const targetSlot = event.target.closest('.card-slot') || event.target.closest('.set-slot');

                if (targetSlot) {
                    const zoneId = targetSlot.id.replace('-set', '');
                    
                    if (/^m[1-7]$/.test(zoneId)) {
                        if (this.state.player.monsterZones[zoneId] === null) {
                            
                            console.log("Placing card:", {
                                action: this.activeCardInstance.name,
                                isAttackPosition: this.isAttackPosition,
                                isSettingCard: this.isSettingCard
                            });

                            if (this.isAttackPosition) {
                                Rules.summonMonsterCard(this.state, this.activeCardInstance, zoneId);
                            } else {
                                Rules.setMonsterCard(this.state, this.activeCardInstance, zoneId, !this.isSettingCard);
                            }

                            this.resetInteractionState();
                            this.renderBoard(this.state);
                        } else {
                            console.warn("That monster zone is already occupied!");
                        }
                    }
                }
            }

            // 4. SPELL/TRAP ZONE PLACEMENT HANDLING
            if (this.isWaitingForSpellTrapZone) {
                const targetSlot = event.target.closest('.card-slot');

                if (targetSlot) {
                    const zoneId = targetSlot.id;
                    if (/^s[1-6]$/.test(zoneId)) {
                        if (this.state.player.spellTrapZones[zoneId] === null) {
                            Rules.activateSpellTrapCard(this.state, this.activeCardInstance, zoneId, !this.isSettingCard);
                            
                            this.resetInteractionState();
                            this.renderBoard(this.state);
                        } else {
                            console.warn("That spell/trap zone is already occupied!");
                        }
                    }
                }
            }
        });
    }

    initListeners() {
        this.initPhaseTrackerListeners();
        this.initDrawButtonListener();

        //this.initOutsideClickListener();

        this.initCardClickListener();
        this.initDropboxListener();

        this.initDropboxMonsterListener();
        this.initDropboxSpellTrapListener();
        this.initDropboxSendToListener();
        this.initDropboxSwitchPositionListener();

        this.initBoardPlacementListeners();
    }

}
