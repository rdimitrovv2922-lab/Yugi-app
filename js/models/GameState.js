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
            monsterZones: { m1: null, m2: null, m3: null, m4: null, m5: null, m6: null, m7: null },
            spellTrapZones: {s1: null, s2: null, s3: null, s4: null, s5: null, s6: null }
        };
    }

    loadDeck(cardArray) {
        this.player.deck = cardArray.map(apiCard => new GameCard(apiCard));
    }
}