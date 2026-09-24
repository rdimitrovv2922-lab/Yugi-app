import * as Rules from './core/GameRules.js';
import * as Renderer from './ui/renderer.js';
import * as PhaseView from './ui/PhaseView.js';
import * as BoardView from './ui/BoardView.js';
import DropboxController from './ui/DropboxController.js';
import WindowController from './ui/WindowController.js';

export default class InputController {
    constructor(state) {
        this.state = state;

        this.activeCardInstance = null;
        this.activePileLocation = null;

        this.isWaitingForMonsterZone = false;
        this.isWaitingForSpellTrapZone = false;

        this.isSettingCard = false;
        this.isAttackPosition = true;

        this.dropboxController = new DropboxController();
        this.windowController = new WindowController();

        this.clientX = null;
        this.clientY = null;

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
        this.activePileLocation = null;
    
        this.isWaitingForMonsterZone = false;
        this.isWaitingForSpellTrapZone = false;
    
        this.isSettingCard = false;
        this.isAttackPosition = true;

        this.clientX = null;
        this.clientY = null;
    
        BoardView.clearHighlightedZones();
    }

    hideAllDropboxes() {
        this.dropboxController.hideAll();
    }

    hideWindow() {
        this.windowController.hide();
    }

    initPhaseTrackerListeners() {
        document.querySelectorAll('#phase-tracker .phase').forEach(phase => {
            phase.addEventListener('click', () => {
                const phaseCode = phase.getAttribute('data-phase');
                if (phaseCode) PhaseView.updatePhaseDisplay(phaseCode);
            });
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
            this.hideWindow();
            this.resetInteractionState();

            const isInsidePlayerGraveyard = cardSlot.closest('#graveyard');
            const isInsidePlayerBanish = cardSlot.closest('#banish');
            const isInsidePlayerDeck = cardSlot.closest('#deck');
            const isInsidePlayerExtraDeck = cardSlot.closest('#extradeck');

            const isInsidePile = (isInsidePlayerGraveyard || isInsidePlayerBanish || isInsidePlayerDeck || isInsidePlayerExtraDeck);
            
            this.clientX = event.clientX;
            this.clientY = event.clientY;

            const instanceId = cardSlot.getAttribute('data-instance-id')
            this.activeCardInstance = this.findCardInstance(instanceId);
            this.activePileLocation = this.activeCardInstance.location;

            if(isInsidePile) {
                this.dropboxController.setupDropboxPile(this.activePileLocation);
                this.dropboxController.showDropbox(this.clientX, this.clientY, 'dropbox-pile');
                return;
            }

            if(this.activeCardInstance) {
                console.log(this.activeCardInstance.instanceId);
                this.dropboxController.setupDropboxes(this.activeCardInstance);              
                this.dropboxController.showDropbox(this.clientX, this.clientY);
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
                    this.dropboxController.showDropbox(this.clientX, this.clientY, 'dropbox-monster');
                    break;
                case 'spell-trap':
                    this.dropboxController.showDropbox(this.clientX, this.clientY, 'dropbox-spell-trap');
                    break;
                case 'activate':
                    console.log(`Card ${this.activeCardInstance.name} has been activated from ${this.activeCardInstance.location}!`);
                    break;
                case 'send':
                    this.dropboxController.showDropbox(this.clientX, this.clientY, 'dropbox-send-to');
                    break;
                case 'move':
                    this.isAttackPosition = this.activeCardInstance.isPositionAttack;
                    this.isSettingCard = !(this.activeCardInstance.isFaceUp);
                    this.isWaitingForMonsterZone = true;
                    this.isWaitingForSpellTrapZone = true;
                    BoardView.highlightValidMonsterZones(this.state, this.isSettingCard);
                    BoardView.highlightValidSpellTrapZones(this.state);
                    break;
                case 'switch':
                    this.dropboxController.showDropbox(this.clientX, this.clientY, 'dropbox-switch-position');
                    break;
                case 'flip':
                    Rules.flipCard(this.state, this.activeCardInstance);
                    this.resetInteractionState();
                    Renderer.renderBoard(this.state);
                    break;
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
            
            this.hideWindow();
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
            
            this.hideWindow();
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
                case 'banish-up':
                    Rules.sendCardToBanish(this.state, this.activeCardInstance);
                    break;
                case 'banish-down':
                    Rules.sendCardToBanish(this.state, this.activeCardInstance, false);
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
            
            //this.hideWindow();
            this.resetInteractionState();
            Renderer.renderBoard(this.state);
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
            }

            //this.hideWindow();
            this.resetInteractionState();
            Renderer.renderBoard(this.state);
        });
    }

    initDropboxPileListener() {
        this.dropboxController.dropboxPile.addEventListener('click', (event) => {
            const action = event.target.getAttribute('data-action');

            this.hideAllDropboxes();

            switch (action) {
                case 'draw':
                    Rules.drawCard(this.state);
                    this.resetInteractionState();
                    Renderer.renderBoard(this.state);
                    break;
                case 'shuffle':
                    Rules.shufflePile(this.state, this.activePileLocation);
                    this.resetInteractionState();
                    Renderer.renderBoard(this.state);
                    break;
                case 'mill':
                    Rules.sendCardToGraveyard(this.state, this.activeCardInstance); 
                    this.resetInteractionState();
                    Renderer.renderBoard(this.state);
                    break;
                case 'banish-up':
                    Rules.sendCardToBanish(this.state, this.activeCardInstance); 
                    this.resetInteractionState();
                    Renderer.renderBoard(this.state);
                    break;
                case 'banish-down':
                    Rules.sendCardToBanish(this.state, this.activeCardInstance, false);
                    this.resetInteractionState();
                    Renderer.renderBoard(this.state);
                    break;
                case 'view':
                    event.stopPropagation();
                    console.log("Right before window render!");
                    Renderer.renderWindow(this.state, this.activePileLocation);
                    this.windowController.showWindow();
                    break;
                case 'banish-r-up':
                    Rules.moveRandomCardFromTo(this.state, this.activePileLocation, 'banish', true);
                    this.resetInteractionState();
                    Renderer.renderBoard(this.state);
                    break;
                case 'banish-r-down':
                    Rules.moveRandomCardFromTo(this.state, this.activePileLocation, 'banish', false);
                    this.resetInteractionState();
                    Renderer.renderBoard(this.state);
                    break;
                case 'to-gy-r':
                    Rules.moveRandomCardFromTo(this.state, this.activePileLocation, 'graveyard');
                    this.resetInteractionState();
                    Renderer.renderBoard(this.state);
                    break;
                case 'to-deck-r':
                    Rules.moveRandomCardFromTo(this.state, this.activePileLocation, 'deck');
                    this.resetInteractionState();
                    Renderer.renderBoard(this.state);
                    break;
            }
        });
    }

    initBoardPlacementListeners() {
        document.addEventListener('click', (event) => {
            if (!this.dropboxController.isInsideAnyDropbox(event.target) && 
                !event.target.closest('.card-hand')) {
                this.hideAllDropboxes();
            }

            if (!this.isWaitingForMonsterZone && !this.isWaitingForSpellTrapZone || !this.activeCardInstance) {
                return;
            }


            if (this.isWaitingForMonsterZone) {
                this.hideWindow();
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
                            Renderer.renderBoard(this.state);
                        } else {
                            console.warn("That monster zone is already occupied!");
                        }
                    }
                }
            }

            if (this.isWaitingForSpellTrapZone) {
                this.hideWindow();
                const targetSlot = event.target.closest('.card-slot');

                if (targetSlot) {
                    const zoneId = targetSlot.id;
                    if (/^s[1-6]$/.test(zoneId)) {
                        if (this.state.player.spellTrapZones[zoneId] === null) {
                            Rules.activateSpellTrapCard(this.state, this.activeCardInstance, zoneId, !this.isSettingCard);
                            
                            this.resetInteractionState();
                            Renderer.renderBoard(this.state);
                        } else {
                            console.warn("That spell/trap zone is already occupied!");
                        }
                    }
                }
            }
        });
    }

    initWindowListener() {
        this.windowController.window.addEventListener('click', (event) => {
            const cardSlot = event.target.closest('[data-instance-id]');
            if(!cardSlot) return;

            const isInsideWindow = cardSlot.closest('#window');
            if(!isInsideWindow) {
                console.log("here");
                this.hideWindow();
                return;
            }

            event.stopPropagation();
            this.resetInteractionState();

            const instanceId = cardSlot.getAttribute('data-instance-id')
            this.activeCardInstance = this.findCardInstance(instanceId);
            
            if(!this.activeCardInstance) return;

            console.log(`${instanceId} : ${this.activeCardInstance.name} : ${this.activeCardInstance.location}`);

            this.dropboxController.setupDropboxes(this.activeCardInstance);
            this.clientX = event.clientX;
            this.clientY = event.clientY;              
            this.dropboxController.showDropbox(this.clientX, this.clientY);
        });
    }

    initOutsideWindowClickListener() {
        document.addEventListener('click', (event) => {
            const isWindowVisible = !this.windowController.window.classList.contains('hidden');
            if (!isWindowVisible) return;

            const clickedInsideWindow = event.target.closest('#window');
            const clickedInsideDropbox = event.target.closest('#dropbox'); 

            if (!clickedInsideWindow && !clickedInsideDropbox) {
                this.hideWindow();
            }
        });
    }

    initListeners() {
        this.initPhaseTrackerListeners();

        this.initCardClickListener();
        this.initDropboxListener();
        this.initWindowListener();

        this.initDropboxMonsterListener();
        this.initDropboxSpellTrapListener();
        this.initDropboxSendToListener();
        this.initDropboxSwitchPositionListener();
        this.initDropboxPileListener();

        this.initBoardPlacementListeners();

        this.initOutsideWindowClickListener();
    }

}
