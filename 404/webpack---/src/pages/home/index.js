import "./style.scss";

import WebGL from "@/webgl";
import {
    TweenMax
} from "gsap";

class Home {
    constructor({
        $el
    }) {
        this.$el = $el;
    }

    init() {
        this.initDOM();
        this.initWebGL();
    }

    initDOM() {
        this.$el = document.querySelector(".Home");
        this.$els = {};
        this.$els = {
            ...this.$els,
            blow: this.$el.querySelector(".blow"),
            blowSpans: this.$el.querySelectorAll("span")
        };
    }

    initWebGL() {
        WebGL.init({
            $el: document.querySelector(".App-wrapWebGL")
        });
        // this.animSpans();
    }
}

export default Home;