export default class GameCard {
    constructor(apiCardData, ownerRole = null){
        this.instanceId = 'card_' + Math.random().toString(36).substring(2,9);
        this.id = apiCardData.id;
        this.name = apiCardData.name;
        this.imageUrl = `/assets/cards/${apiCardData.id}.jpg`;

        Object.defineProperty(this, 'ownerRole', {
            value: ownerRole,
            enumerable: true,
            writable: false,
            configurable: false
        });
        
        this.location = 'deck';
        this.zoneKey = null;  
        this.isPositionAttack = true; 
        this.isFaceUp = true;
        this.rawApiData = apiCardData;

        this.type = apiCardData.type;

        this.isVisibleToOpponent = true;

        this.isMaterial = false;
        this.isOwnerPlayer = true;
        this.isToken = false;
        this.attachedMaterials = [];

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
        this.isVisibleToOpponent = false;
        this.targetedBy = [];
    }
}
