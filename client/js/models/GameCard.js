export default class GameCard {
    constructor(apiCardData){
        this.instanceId = 'card_' + Math.random().toString(36).substring(2,9);
        this.id = apiCardData.id;
        this.name = apiCardData.name;
        this.imageUrl = `/assets/cards/${apiCardData.id}.jpg`;
        
        this.location = 'deck';
        this.zoneKey = null;  
        this.isPositionAttack = true; 
        this.isFaceUp = true;
        this.rawApiData = apiCardData;

        this.type = apiCardData.type;

        this.isVisibleToOpponent = true;

        this.isMaterial = false;
        this.isOwnerPlayer = true;

        this.targetedBy = [];
    }

    moveToLocation(newLocation, newZoneKey = null){
        this.location = newLocation;
        this.zoneKey = newZoneKey;
    }

    setIsPositionAttack(newIsPositionAttack){
        this.isPositionAttack = newIsPositionAttack;
    }

    setIsFaceUp(newIsSetUp){
        this.isFaceUp = newIsSetUp;
    }

    setIsMaterial(newIsMaterial){
        this.isMaterial = newIsMaterial;
    }

    changeVisibility(newIsVisibleToOpponent) {
        this.isVisibleToOpponent = newIsVisibleToOpponent;
    }

    returnToDefault(){
        this.zoneKey = null;
        this.isPositionAttack = true;
        this.isFaceUp = true;
        this.isMaterial = false;
        this.isVisibleToOpponent = true;
    }
}