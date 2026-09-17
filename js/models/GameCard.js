export default class GameCard {
    constructor(apiCardData){
        this.instanceId = 'card_' + Math.random().toString(36).substring(2,9);
        this.id = apiCardData.id;
        this.name = apiCardData.name;
        this.imageUrl = apiCardData.card_images[0].image_url;
        
        this.location = 'deck'; // 'hand', 'monsterZone', 'graveyard', etc.
        this.zoneKey = null;    // 'm1', 's3', etc.
        this.position = 'attack'; // 'attack' or 'defense'
        this.isFaceUp = true;
        this.rawApiData = apiCardData;
    }

    moveToLocation(newLocation, newZoneKey = null){
        this.location = newLocation;
        this.zoneKey = newZoneKey;
    }

    setBattlePosition(newPosition){
        this.position = newPosition;
    }

    setIsFaceUp(newIsSetUp){
        this.isFaceUp = newIsSetUp;
    }
}