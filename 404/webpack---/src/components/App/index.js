import "./style.scss";
import Home from "@/pages/home";

class App {
    constructor() {
        this.$el = document.querySelector(".App");

        this.home = new Home({
            $el: this.$el.querySelector(".Home")
        });
    }

    init() {
        this.home.init();
    }
}

export default new App();