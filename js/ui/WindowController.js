export default class WindowController {
    constructor() {
        this.window = document.getElementById('window');
    }

    hide(){
        this.window.classList.add('hidden');
    }

    showWindow(){
        this.window.classList.remove('hidden');
    }
}