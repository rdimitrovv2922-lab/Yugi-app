import GameCard from "./GameCard.js";

export default class GameState {
    constructor() {
        this.player = {
            lp: 8000,
            deck: [],
            extradeck: [],
            graveyard: [],
            banish: [],
            hand: [],
            monsterZones: {
                m1: { card: null, materials: [] },
                m2: { card: null, materials: [] },
                m3: { card: null, materials: [] },
                m4: { card: null, materials: [] },
                m5: { card: null, materials: [] },
                m6: { card: null, materials: [] },
                m7: { card: null, materials: [] }
            },
            spellTrapZones: {s1: null, s2: null, s3: null, s4: null, s5: null, s6: null }
        };

        this.opponent = {
            lp: 8000,
            deck: [],
            extradeck: [],
            graveyard: [],
            banish: [],
            hand: [],
            monsterZones: {
                m1: { card: null, materials: [] },
                m2: { card: null, materials: [] },
                m3: { card: null, materials: [] },
                m4: { card: null, materials: [] },
                m5: { card: null, materials: [] },
                m6: { card: null, materials: [] },
                m7: { card: null, materials: [] }
            },
            spellTrapZones: {s1: null, s2: null, s3: null, s4: null, s5: null, s6: null }
        };
    }

    loadDeck(cardArray) {
        this.player.deck = cardArray.map(apiCard => new GameCard(apiCard));
    }

    hasXyzMonsterPresent() {
        const monsterZones = this.player.monsterZones;
        if (!monsterZones) return false;

        for (const key of Object.keys(monsterZones)) {
            const zoneData = monsterZones[key];
            if (!zoneData) continue;

            if (zoneData.card && zoneData.card.type === 'xyz') {
                return true;
            }
        }

        return false;
    }
}