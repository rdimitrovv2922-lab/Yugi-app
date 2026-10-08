export default class WindowController {
    constructor() {
        this.window = document.getElementById('window');
    }

    hide(){
        console.log("inside hide window");
        this.window.classList.add('hidden');
    }

    showWindow(){
        console.log("inside show window");
        this.window.classList.remove('hidden');
    }
}