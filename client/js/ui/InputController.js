import * as Renderer from './renderer.js';
import { CARD_BACK_URL } from './opRenderer.js';
import * as PhaseView from './PhaseView.js';
import * as BoardView from './BoardView.js';
import DropboxController from './DropboxController.js';
import WindowController from './WindowController.js';

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

        this.isSettingCard = false;
        this.isAttackPosition = true;

        this.dropboxController = new DropboxController(state);
        this.windowController = new WindowController();

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
            }
            return null;
        };

        return playerState.hand.find(c => c.instanceId === instanceId) ||
               playerState.deck.find(c => c.instanceId === instanceId) ||
               playerState.extradeck.find(c => c.instanceId === instanceId) ||
               playerState.graveyard.find(c => c.instanceId === instanceId) ||
               playerState.banish.find(c => c.instanceId === instanceId) ||
               findInMonsterZones(playerState.monsterZones) ||
               Object.values(playerState.spellTrapZones).find(c => c !== null && c.instanceId === instanceId);
    }

    resetInteractionState() {
        this.activeCardInstance = null;
        this.activePileLocation = null;
    
        this.isWaitingForMonsterZone = false;
        this.isWaitingForSpellTrapZone = false;
        this.isWaitingForAttach = false;
        this.isWaitingForOverlay = false;
    
        this.isSettingCard = false;
        this.isAttackPosition = true;

        this.clientX = null;
        this.clientY = null;
    
        BoardView.clearHighlightedZones();
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
                if (phaseCode) PhaseView.updatePhaseDisplay(phaseCode);
            });
        });
    }

    initCardClickListener() {
        document.getElementById('game-container').addEventListener('click', (event) => {
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
                    this.isWaitingForSpellTrapZone = true;
                    BoardView.highlightValidMonsterZones(this.state, this.isSettingCard);
                    BoardView.highlightValidSpellTrapZones(this.state);
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
                case 'target':
                    this.runRule('targetCard', this.activeCardInstance);
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

    initCardPreviewListeners() {
        const preview = document.getElementById('card-preview');
        const previewName = document.getElementById('card-preview-name');
        const previewImage = document.getElementById('card-preview-image');
        previewImage.src = CARD_BACK_URL;
        previewImage.alt = 'Card back';
        previewImage.classList.remove('hidden');
        const previewDetails = document.getElementById('card-preview-details');
        const previewDsc = document.getElementById('card-preview-dsc');

        document.addEventListener('pointerover', event => {
            const cardSlot = event.target.closest('[data-instance-id]');
            if (!cardSlot || cardSlot.contains(event.relatedTarget)) return;

            const instanceId = cardSlot.getAttribute('data-instance-id');
            
            let card = this.findCardInstance(instanceId, this.state.player);
            let isOwnerPlayer = true;
            if (!card) {
                card = this.findCardInstance(instanceId, this.state.opponent);
                isOwnerPlayer = false;
            }

            if (!card || card.location === 'deck') return;

            const displayedImage = cardSlot.querySelector('img');
            const cardImageUrl = new URL(card.imageUrl, document.baseURI).href;

            if (!displayedImage || (displayedImage.src !== cardImageUrl && !isOwnerPlayer)) {
                return;
            }
       
            const data = card.rawApiData || {};

            const levelOrLink = data.level !== undefined
                ? `Level / Rank: ${data.level}`
                : data.linkval !== undefined
                    ? `Link: ${data.linkval}`
                    : null;

            const rows = [
                { values: [data.type], fullWidth: true },
                { values: [
                    data.attribute && `Attribute: ${data.attribute}`,
                    data.race && `Type: ${data.race}`
                ] },
                { values: [
                    levelOrLink,
                    data.scale !== undefined && `Scale: ${data.scale}`
                ] },
                { values: [
                    data.atk !== undefined && `ATK: ${data.atk}`,
                    data.def !== undefined && `DEF: ${data.def}`
                ] }
            ].filter(row => row.values.some(Boolean));

            previewDetails.replaceChildren();

            for (const rowData of rows) {
                const rowElement = document.createElement('div');
                rowElement.className = 'card-preview-row';

                for (const value of rowData.values) {
                    const cell = document.createElement('span');
                    cell.textContent = value || '';

                    if (rowData.fullWidth) {
                        cell.classList.add('full-width');
                    }

                    rowElement.appendChild(cell);
                }

                previewDetails.appendChild(rowElement);
            }

            previewName.textContent = card.name;
            previewImage.src = card.imageUrl;
            previewImage.alt = card.name;
            previewImage.classList.remove('hidden');
            previewDsc.textContent = data.desc;
            preview.scrollTop = 0;
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

        this.initCardPreviewListeners();

        this.initOutsideWindowClickListener();
    }
}
