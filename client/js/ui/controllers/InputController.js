import * as Renderer from '../rendering/renderer.js';
import * as PhaseView from '../views/PhaseView.js';
import * as BoardView from '../views/BoardView.js';
import DropboxController from './DropboxController.js';
import WindowController from './WindowController.js';
import PreviewController from './PreviewController.js';
import LPModifierController from './LPModifierController.js';

export default class InputController {
    constructor(state) {
        this.state = state;

        this.activeCardInstance = null;
        this.activePileLocation = null;
        this.isOwnerPLayer = true;

        this.isWaitingForMonsterZone = false;
        this.isWaitingForSpellTrapZone = false;
        this.isWaitingForAttach = false;
        this.isWaitingForOverlay = false;
        this.isWaitingForToken = false;
        this.isWaitingForSteal = false;
        this.stealPlacement = null;

        this.isSettingCard = false;
        this.isAttackPosition = true;

        this.dropboxController = new DropboxController(state);
        this.windowController = new WindowController();
        this.previewController = new PreviewController();
        this.lpModifierController = new LPModifierController(state);

        this.clientX = null;
        this.clientY = null;

        this.initListeners();
    }

    runRule(ruleName, ...args) {
        const sessionId = sessionStorage.getItem('yugiSessionId');
        const serializedArgs = args.map(argument =>
            argument && typeof argument === 'object' && argument.instanceId
                ? { instanceId: argument.instanceId }
                : argument
        );

        fetch('/api/action', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionId, ruleName, args: serializedArgs })
        })
            .then(async response => {
                const result = await response.json();
                if (!response.ok) throw new Error(result.error);
            })
            .catch(error => console.error(`${ruleName} failed:`, error));
    }

    findCardInstance(instanceId, playerState) {
        const findInMonsterZones = (zones) => {
            for (const key of Object.keys(zones)) {
                const zoneData = zones[key];
                if (!zoneData) continue;
                if (zoneData.card && zoneData.card.instanceId === instanceId) return zoneData.card;
                if (zoneData.materials) {
                    const foundMat = zoneData.materials.find(m => m.instanceId === instanceId);
                    if (foundMat) return foundMat;
                }
                const attachedMaterial = zoneData.card?.attachedMaterials?.find(
                    material => material.instanceId === instanceId
                );
                if (attachedMaterial) return attachedMaterial;
            }
            return null;
        };

        const pileOrMonsterCard = playerState.hand.find(c => c.instanceId === instanceId) ||
               playerState.deck.find(c => c.instanceId === instanceId) ||
               playerState.extradeck.find(c => c.instanceId === instanceId) ||
               playerState.graveyard.find(c => c.instanceId === instanceId) ||
               playerState.banish.find(c => c.instanceId === instanceId) ||
               findInMonsterZones(playerState.monsterZones);
        if (pileOrMonsterCard) return pileOrMonsterCard;

        const spellTrapCard = Object.values(playerState.spellTrapZones)
            .find(card => card?.instanceId === instanceId);
        if (spellTrapCard) return spellTrapCard;

        return Object.values(playerState.spellTrapZones)
            .flatMap(card => card?.attachedMaterials || [])
            .find(card => card.instanceId === instanceId) || null;
    }

    resetInteractionState() {
        this.activeCardInstance = null;
        this.activePileLocation = null;
    
        this.isWaitingForMonsterZone = false;
        this.isWaitingForSpellTrapZone = false;
        this.isWaitingForAttach = false;
        this.isWaitingForOverlay = false;
        this.isWaitingForToken = false;
        this.isWaitingForSteal = false;
        this.stealPlacement = null;
    
        this.isSettingCard = false;
        this.isAttackPosition = true;

        this.clientX = null;
        this.clientY = null;
    
        BoardView.clearHighlightedZones();
        const tokenButton = document.getElementById('place-token-button');
        tokenButton?.setAttribute('aria-pressed', 'false');
    }

    clearInteractionState() {
        this.hideAllDropboxes();
        this.hideWindow();
        this.resetInteractionState();
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
                if (phaseCode) this.changePhase(phaseCode);
            });
        });
    }

    async changePhase(phaseCode) {
        const sessionId = sessionStorage.getItem('yugiSessionId');

        try {
            const response = await fetch(
                `/api/phase?sessionId=${encodeURIComponent(sessionId)}&phase=${encodeURIComponent(phaseCode)}`,
                { method: 'POST' }
            );
            const result = await response.json();
            if (!response.ok) throw new Error(result.error);

            this.state.phase = result.phase;
            PhaseView.updatePhaseDisplay(result.phase);
        } catch (error) {
            console.error('Could not change duel phase:', error);
        }
    }

    initCardClickListener() {
        document.getElementById('game-container').addEventListener('click', (event) => {
            if (this.isWaitingForToken || this.isWaitingForSteal) return;

            if (this.isWaitingForAttach || this.isWaitingForOverlay) {
                return; 
            }

            const cardSlot = event.target.closest('[data-instance-id]');
            if(!cardSlot) return;

            const isInsideOpponentHand = cardSlot.closest('#op-hand');
            const isInsideGameContainer = cardSlot.closest('#game-container-center');

            if (!isInsideGameContainer || isInsideOpponentHand) return;

            event.stopPropagation();
            this.clearInteractionState();

            const isInsideAnyGraveyard = cardSlot.closest('.graveyard');
            const isInsideAnyBanish = cardSlot.closest('.banish');
            const isInsideAnyDeck = cardSlot.closest('.deck');
            const isInsideAnyExtraDeck = cardSlot.closest('.extradeck');

            const isInsidePile = (isInsideAnyGraveyard || isInsideAnyBanish || isInsideAnyDeck || isInsideAnyExtraDeck);
            
            this.clientX = event.clientX;
            this.clientY = event.clientY;

            const instanceId = cardSlot.getAttribute('data-instance-id')
            this.activeCardInstance = this.findCardInstance(instanceId,this.state.player);
            if(this.activeCardInstance) {
                this.isOwnerPLayer = true;
            } else {
                this.activeCardInstance = this.findCardInstance(instanceId, this.state.opponent);
                if (this.activeCardInstance) {
                    this.isOwnerPLayer = false;
                }
            }
            this.activePileLocation = this.activeCardInstance.location;

            console.log(this.isOwnerPLayer);

            if(isInsidePile) {
                console.log(this.activeCardInstance.location);
                this.dropboxController.setupDropboxPile(this.activePileLocation, this.isOwnerPLayer);
                this.dropboxController.showDropbox(this.clientX, this.clientY, 'dropbox-pile');
                return;
            }

            if(this.activeCardInstance) {
                this.dropboxController.setupDropboxes(this.activeCardInstance, this.isOwnerPLayer);              
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
                    break;
                case 'send':
                    this.dropboxController.showDropbox(this.clientX, this.clientY, 'dropbox-send-to');
                    break;
                case 'move':
                    this.isAttackPosition = this.activeCardInstance.isFaceUp && this.activeCardInstance.isPositionAttack;
                    this.isSettingCard = !(this.activeCardInstance.isFaceUp);
                    this.isWaitingForMonsterZone = true;
                    this.isWaitingForSpellTrapZone = !this.activeCardInstance.isToken;
                    BoardView.highlightValidMonsterZones(this.state, this.isSettingCard);
                    if (this.isWaitingForSpellTrapZone) {
                        BoardView.highlightValidSpellTrapZones(this.state);
                    }
                    break;
                case 'switch':
                    this.dropboxController.showDropbox(this.clientX, this.clientY, 'dropbox-switch-position');
                    break;
                case 'flip':
                    this.runRule('flipCard', this.activeCardInstance);
                    this.resetInteractionState();
                    Renderer.renderBoard(this.state);
                    break;
                case 'attach':
                    this.isWaitingForAttach = true;
                    BoardView.highlightXYZMonsterZones(this.state);
                    break;
                case 'view':
                    event.stopPropagation();
                    Renderer.renderWindow(this.state, this.activeCardInstance, this.isOwnerPLayer);
                    this.windowController.showWindow();
                    break;
                case 'steal':
                    this.dropboxController.showDropbox(this.clientX, this.clientY, 'dropbox-steal-placement');
                    break;
                case 'target':
                    this.runRule('targetCard', this.activeCardInstance);
                    this.resetInteractionState();
                    Renderer.renderBoard(this.state);
                    break;
                case 'reveal':
                    this.runRule('revealCard', this.activeCardInstance);
                    //let currentCard = this.activeCardInstance;
                    this.resetInteractionState();
                    Renderer.renderBoard(this.state);
                    /*setTimeout(() => {
                        this.runRule('hideCard', currentCard);
                    }, 5000);*/
                    break;
                case 'hide':
                    this.runRule('hideCard', this.activeCardInstance);
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
            if (action === 'xyz-summon') {
                this.hideWindow();
                this.isAttackPosition = true;
                this.isSettingCard = false;
                this.isWaitingForOverlay = true;
                BoardView.highlightFullMonsterZones(this.state);
                return;
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
                    this.runRule('sendCardToGraveyard', this.activeCardInstance);
                    break;
                case 'banish-up':
                    this.runRule('sendCardToBanish', this.activeCardInstance);
                    break;
                case 'banish-down':
                    this.runRule('sendCardToBanish', this.activeCardInstance, false);
                    break;
                case 'hand':
                    this.runRule('sendCardToHand', this.activeCardInstance);
                    break;
                case 'deck':
                    this.runRule('sendCardToDeck', this.activeCardInstance);
                    break
                case 'extradeck':
                    this.runRule('sendCardToExtraDeck', this.activeCardInstance);
                    break;
            }
            
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
                    this.runRule('switchBattlePositionToAtk', this.activeCardInstance);
                    break;
                case 'to-def':
                    this.runRule('switchBattlePositionToDef', this.activeCardInstance, true);
                    break;
                case 'to-set':
                    this.runRule('switchBattlePositionToDef', this.activeCardInstance, false);
                    break;
            }

            this.resetInteractionState();
            Renderer.renderBoard(this.state);
        });
    }

    initDropboxStealPlacementListener() {
        this.dropboxController.dropboxStealPlacement.addEventListener('click', (event) => {
            const action = event.target.getAttribute('data-action');
            if (!action || !this.activeCardInstance || this.isOwnerPLayer) return;

            this.hideAllDropboxes();
            this.hideWindow();
            this.isWaitingForSteal = true;

            switch (action) {
                case 'monster-attack':
                    this.stealPlacement = { zoneFamily: 'monster', position: 'attack' };
                    BoardView.highlightValidMonsterZones(this.state, false);
                    break;
                case 'monster-defense':
                    this.stealPlacement = { zoneFamily: 'monster', position: 'defense' };
                    BoardView.highlightValidMonsterZones(this.state, true);
                    break;
                case 'monster-set':
                    this.stealPlacement = { zoneFamily: 'monster', position: 'set' };
                    BoardView.highlightValidMonsterZones(this.state, true);
                    break;
                case 'spell-faceup':
                    this.stealPlacement = { zoneFamily: 'spellTrap', position: 'faceup' };
                    BoardView.highlightValidSpellTrapZones(this.state);
                    break;
                case 'spell-set':
                    this.stealPlacement = { zoneFamily: 'spellTrap', position: 'set' };
                    BoardView.highlightValidSpellTrapZones(this.state);
                    break;
                default:
                    this.resetInteractionState();
            }
        });
    }

    initDropboxPileListener() {
        this.dropboxController.dropboxPile.addEventListener('click', (event) => {
            const action = event.target.getAttribute('data-action');

            this.hideAllDropboxes();

            switch (action) {
                case 'draw':{
                    this.runRule('drawCard');
                    this.resetInteractionState();
                    break;
                }
                case 'shuffle':
                    this.runRule('shufflePile', this.activePileLocation);
                    this.resetInteractionState();
                    Renderer.renderBoard(this.state);
                    break;
                case 'mill':
                    this.runRule('sendCardToGraveyard', this.activeCardInstance);
                    this.resetInteractionState();
                    Renderer.renderBoard(this.state);
                    break;
                case 'banish-up':
                    this.runRule('sendCardToBanish', this.activeCardInstance);
                    this.resetInteractionState();
                    Renderer.renderBoard(this.state);
                    break;
                case 'banish-down':
                    this.runRule('sendCardToBanish', this.activeCardInstance, false);
                    this.resetInteractionState();
                    Renderer.renderBoard(this.state);
                    break;
                case 'view':
                    console.log("inside view pile");
                    event.stopPropagation();
                    Renderer.renderWindow(this.state, this.activeCardInstance, this.isOwnerPLayer);
                    this.windowController.showWindow();
                    break;
                case 'banish-r-up':
                    this.runRule('moveRandomCardFromTo', this.activePileLocation, 'banish', true);
                    this.resetInteractionState();
                    Renderer.renderBoard(this.state);
                    break;
                case 'banish-r-down':
                    this.runRule('moveRandomCardFromTo', this.activePileLocation, 'banish', false);
                    this.resetInteractionState();
                    Renderer.renderBoard(this.state);
                    break;
                case 'to-gy-r':
                    this.runRule('moveRandomCardFromTo', this.activePileLocation, 'graveyard');
                    this.resetInteractionState();
                    Renderer.renderBoard(this.state);
                    break;
                case 'to-deck-r':
                    this.runRule('moveRandomCardFromTo', this.activePileLocation, 'deck');
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

            if (this.isWaitingForToken) {
                const targetSlot = event.target.closest('.card-slot');
                if (!targetSlot?.classList.contains('valid-target')) return;

                const zoneId = targetSlot.id;
                if (/^m[1-7]$/.test(zoneId) && !this.state.player.monsterZones[zoneId]?.card) {
                    this.runRule('placeToken', zoneId);
                    this.resetInteractionState();
                    Renderer.renderBoard(this.state);
                }
                return;
            }

            if (this.isWaitingForSteal) {
                const targetSlot = event.target.closest('.card-slot.valid-target, .set-slot.valid-target');
                if (!targetSlot || !this.stealPlacement) return;

                const zoneId = targetSlot.id.replace('-set', '');
                if (this.stealPlacement.zoneFamily === 'monster' && /^m[1-7]$/.test(zoneId)) {
                    if (this.state.player.monsterZones[zoneId]?.card !== null) return;
                    this.runRule('stealCard', this.activeCardInstance, zoneId, this.stealPlacement.position);
                } else if (this.stealPlacement.zoneFamily === 'spellTrap' && /^s[1-6]$/.test(zoneId)) {
                    if (this.state.player.spellTrapZones[zoneId] !== null) return;
                    this.runRule('stealCard', this.activeCardInstance, zoneId, this.stealPlacement.position);
                } else {
                    return;
                }

                this.resetInteractionState();
                Renderer.renderBoard(this.state);
                return;
            }

            if ((!this.isWaitingForMonsterZone && !this.isWaitingForSpellTrapZone 
                && !this.isWaitingForAttach && !this.isWaitingForOverlay) || !this.activeCardInstance) {
                return;
            }

            if (this.isWaitingForMonsterZone || this.isWaitingForAttach || this.isWaitingForOverlay) {
                this.hideWindow();
                const targetSlot = event.target.closest('.card-slot') || event.target.closest('.set-slot');

                if (targetSlot) {
                    const zoneId = targetSlot.id.replace('-set', '');
                    
                    if (/^m[1-7]$/.test(zoneId)) {
                        const zoneData = this.state.player.monsterZones[zoneId];

                        const card = zoneData.card;
                        const frameType = card?.rawApiData?.frameType?.toLowerCase();
                        const type = card?.type?.toLowerCase();
                        const isXyz = frameType === 'xyz' || type?.includes('xyz');

                        if (card === null && this.isWaitingForMonsterZone) {
                            if (this.isAttackPosition) {
                                this.runRule('summonMonsterCard', this.activeCardInstance, zoneId);
                            } else if (this.isSettingCard) {
                                this.runRule('setMonsterCard', this.activeCardInstance, zoneId, false); 
                            } else {
                                this.runRule('setMonsterCard', this.activeCardInstance, zoneId, true);
                            }
                        } else if (isXyz && this.isWaitingForAttach) {
                            this.runRule('attachCard', this.activeCardInstance, zoneId);
                        } else if (zoneData && this.isWaitingForOverlay) {
                            this.runRule('xyzSummon', this.activeCardInstance, zoneId);
                        }

                        this.resetInteractionState();
                        Renderer.renderBoard(this.state);
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
                            this.runRule('activateSpellTrapCard', this.activeCardInstance, zoneId, !this.isSettingCard);
                            
                            this.resetInteractionState();
                            Renderer.renderBoard(this.state);
                        }
                    }
                }
            }
        });
    }

    initWindowListener() {
        this.windowController.window.addEventListener('click', (event) => {
            console.log("inside window click listener");
            const cardSlot = event.target.closest('[data-instance-id]');
            if(!cardSlot) return;

            const isInsideWindow = cardSlot.closest('#window');
            if(!isInsideWindow) {
                this.hideWindow();
                return;
            }

            event.stopPropagation();
            this.resetInteractionState();
            this.hideAllDropboxes();

            const instanceId = cardSlot.getAttribute('data-instance-id')

            this.activeCardInstance = this.findCardInstance(instanceId,this.state.player);
            if(this.activeCardInstance) {
                this.isOwnerPLayer = true;
            } else {
                this.activeCardInstance = this.findCardInstance(instanceId, this.state.opponent);
                if (this.activeCardInstance) {
                    console.log("opponents");
                    this.isOwnerPLayer = false;
                }
            }
            
            if(!this.activeCardInstance) return;
            this.activePileLocation = this.activeCardInstance.location;

            this.dropboxController.setupDropboxes(this.activeCardInstance, this.isOwnerPLayer);
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
            const clickedInsideDropbox = event.target.closest('.dropbox'); 

            if (!clickedInsideWindow && !clickedInsideDropbox) {
                console.log("clicked outside window");
                this.hideWindow();
            }
        });
    }

    initCardPreviewListener() {
        document.addEventListener('pointerover', event => {
            const cardSlot = event.target.closest('[data-instance-id]');
            if (!cardSlot || cardSlot.contains(event.relatedTarget)) return;

            if(event.target.id === 'deck' || event.target.id === 'extradeck') return;

            const instanceId = cardSlot.getAttribute('data-instance-id');
            
            let card = this.findCardInstance(instanceId, this.state.player);
            let isOwnerPlayer = true;
            if (!card) {
                card = this.findCardInstance(instanceId, this.state.opponent);
                isOwnerPlayer = false;
            }

            if (!card || (!card.isVisibleToOpponent && !isOwnerPlayer)) return;

            const displayedImage = cardSlot.querySelector('img');
            const cardImageUrl = new URL(card.imageUrl, document.baseURI).href;
            if (!displayedImage || (displayedImage.src !== cardImageUrl && !isOwnerPlayer)) {
                return;
            }
            this.previewController.showCard(card);
        });
    }

    initTokenPlacementListener() {
        document.getElementById('place-token-button').addEventListener('click', () => {
            if (this.isWaitingForToken) {
                this.resetInteractionState();
                return;
            }

            this.clearInteractionState();
            this.isWaitingForToken = true;
            document.getElementById('place-token-button').setAttribute('aria-pressed', 'true');
            BoardView.highlightValidMonsterZones(this.state, false);
        });
    }

    initListeners() {
        this.initPhaseTrackerListeners();

        this.initTokenPlacementListener();

        this.initCardClickListener();
        this.initDropboxListener();
        this.initWindowListener();

        this.initDropboxMonsterListener();
        this.initDropboxSpellTrapListener();
        this.initDropboxSendToListener();
        this.initDropboxSwitchPositionListener();
        this.initDropboxStealPlacementListener();
        this.initDropboxPileListener();

        this.initBoardPlacementListeners();

        this.initCardPreviewListener();

        this.lpModifierController.initListeners();

        this.initOutsideWindowClickListener();
    }
}
