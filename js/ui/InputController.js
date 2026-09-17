import { drawCard, summonMonsterCard, setMonsterCard, activateSpellTrapCard } from '../core/GameRules.js';
import { highlightValidMonsterZones, highlightValidSpellTrapZones, clearHighlightedZones, showCardInHandDropbox,showCardInHandDropboxMonster, showCardInHandDropboxSpellTrap, updatePhaseDisplay } from './uiHelpers.js'; // if you split helpers out

export default class InputController {
    constructor(state, renderBoardCallback) {
        this.state = state;
        this.renderBoard = renderBoardCallback;
        
        this.activeCardInstance = null;

        this.isWaitingForMonsterZone = false;
        this.isWaitingForSpellTrapZone = false;

        this.isSettingCard = false;
        this.isAttackPosition = true;

        this.initListeners();
    }

    initListeners() {
        document.querySelectorAll('#phase-tracker .phase').forEach(phase => {
            phase.addEventListener('click', () => {
                const phaseCode = phase.getAttribute('data-phase');
                if (phaseCode) updatePhaseDisplay(phaseCode);
            });
        });

        document.getElementById('draw-btn-player').addEventListener('click', () => {
            if(this.isWaitingForMonsterZone || this.isWaitingForSpellTrapZone){
                return;
            }

            drawCard(this.state);
            this.renderBoard(this.state);
        });

        // Hand Click Delegation (Opens Dropbox menu using data-instance-id)
        document.getElementById('player-hand').addEventListener('click', (event) => {
            event.stopPropagation()

            const cardSlot = event.target.closest('.card-slot');
            if (!cardSlot) return;

            const instanceId = cardSlot.getAttribute('data-instance-id');
            this.activeCardInstance = this.state.player.hand.find(c => c.instanceId === instanceId);

            if (this.activeCardInstance) {
                showCardInHandDropbox(event.clientX, event.clientY);
            }
        });

        const dropbox = document.getElementById('card-in-hand-dropbox');
        const dropboxMonster = document.getElementById('card-in-hand-dropbox-monster');
        const dropboxSpellTrap = document.getElementById('card-in-hand-dropbox-spell-trap');
        
        dropbox.addEventListener('click', (event) => {
            const action = event.target.getAttribute('data-action');
            if (!action || !this.activeCardInstance) return;

            if (action === 'monster') {
                dropbox.classList.add('hidden');
                showCardInHandDropboxMonster(event.clientX, event.clientY);
            } else if (action === 'spell/trap') {
                dropbox.classList.add('hidden');
                showCardInHandDropboxSpellTrap(event.clientX, event.clientY);
            }   else {
                dropbox.classList.add('hidden');
            }
        });

        dropboxMonster.addEventListener('click', (eventMonster) => {
            const actionMonster = eventMonster.target.getAttribute('data-action');
            if (!actionMonster || !this.activeCardInstance) return;

            if (actionMonster === 'normal-summon' || actionMonster === 'special-summon-atk') {
                this.isAttackPosition = true;
                this.isSettingCard = false;
            } else if (actionMonster === 'set') {
                this.isAttackPosition = false;
                this.isSettingCard = true;
            } else if (actionMonster === 'special-summon-def') {
                this.isAttackPosition = false;
                this.isSettingCard = false; 
            }

            dropboxMonster.classList.add('hidden');
            this.isWaitingForMonsterZone = true;
            highlightValidMonsterZones(this.state, this.isSettingCard);
        });

        dropboxSpellTrap.addEventListener('click', (eventSpellTrap) => {
            const actionSpellTrap = eventSpellTrap.target.getAttribute('data-action');
            if (!actionSpellTrap || !this.activeCardInstance) return;

            if (actionSpellTrap === 'activate') {
                this.isSettingCard = false;
            } else if (actionSpellTrap === 'set') {
                this.isSettingCard = true;
            }    

            dropboxSpellTrap.classList.add('hidden');
            this.isWaitingForSpellTrapZone = true;
            highlightValidSpellTrapZones(this.state);
        });

        // Global Click Handler for Board Target Placement & Closing Menus
        document.addEventListener('click', (event) => {
            if (!dropbox.contains(event.target) && 
                !dropboxMonster.contains(event.target) &&
                !event.target.closest('.card-hand')) {
                
                dropbox.classList.add('hidden');
                dropboxMonster.classList.add('hidden');
            }

            if (!this.isWaitingForMonsterZone || !this.activeCardInstance) return;

            const targetSlot = this.isSettingCard 
                ? event.target.closest('.set-slot') 
                : event.target.closest('.card-slot');

            if (targetSlot) {
                const zoneId = targetSlot.id.replace('-set', '');
                
                if (/^m[1-7]$/.test(zoneId)) {
                    if (this.state.player.monsterZones[zoneId] === null) {
                        if (this.isAttackPosition) {
                            summonMonsterCard(this.state, this.activeCardInstance, zoneId);
                        } else {
                            setMonsterCard(this.state, this.activeCardInstance, zoneId, !this.isSettingCard);
                        }

                        this.isWaitingForMonsterZone = false;
                        this.isSettingCard = false;
                        this.isAttackPosition = true;
                        clearHighlightedZones();
                        this.activeCardInstance = null;

                        this.renderBoard(this.state);
                    } else {
                        console.warn("That zone is already occupied!");
                    }
                }
            }
        });

        document.addEventListener('click', (event) => {
            if (!dropbox.contains(event.target) &&
                !dropboxSpellTrap.contains(event.target) &&
                event.target.closest('.card-hand')) {

                dropbox.classList.add('hidden');
                dropboxSpellTrap.classLost.add('hidden');
            }

            if (!this.isWaitingForSpellTrapZone || !this.activeCardInstance) return;

            const targetSlot = event.target.closest('.card-slot');

            if(targetSlot) {
                const zoneId = targetSlot.id;
                if(/^s[1-6]$/.test(zoneId)) {
                    if (this.state.player.spellTrapZones[zoneId] === null) {
                        activateSpellTrapCard(this.state, this.activeCardInstance, zoneId, !this.isSettingCard);
                    }

                    this.isWaitingForSpellTrapZone = false;
                    this.isSettingCard = false;
                    clearHighlightedZones();
                    this.activeCardInstance = null;

                    this.renderBoard(this.state);
                }
            }
        });
    }
}