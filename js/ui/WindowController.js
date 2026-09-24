export default class WindowController {
    constructor() {
        this.window = document.getElementById('window');
    }

    hide(){
        console.log("In window hide!");
        this.window.classList.add('hidden');
        console.log("After window hide!");
    }

    showWindow(){
        console.log("In window show!");
        this.window.classList.remove('hidden');
        console.log("After window show!");
    }
}