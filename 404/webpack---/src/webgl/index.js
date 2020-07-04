import {
    Scene,
    PerspectiveCamera,
    WebGLRenderer,
    BoxGeometry,
    MeshBasicMaterial,
    Vector3,
    BoxBufferGeometry,
    InstancedBufferGeometry,
    Mesh,
    BufferAttribute,
    InstancedBufferAttribute,
    RawShaderMaterial
} from 'three';

import {
    TweenLite,
    Power3
} from 'gsap';

import Zlib from 'three/examples/js/libs/inflate.min';
import FBXLoader from '@/webgl/loaders/FBXLoader';
import OrbitControls from '@/webgl/controls/OrbitControls';
import MiddleFinger from '@/webgl/objects/MiddleFinger';
// import { createComposer } from "./PostProcessing";
import volumeDetection from '@/components/VolumeDetection';
import gui from '@/utils/gui';
import blow from 'on-blow';

import './style.scss';
window.Zlib = Zlib.Zlib;

class WebGL {
    constructor() {
        this.$el = null;
        this.mixer = null;
        this.progressAnimation = 0;
        this.isFbxLoaded = false;
        this.canBlow = false;

        this.loopDoubleSideFuck = 1;
        this.isFirstAnimDone = false;
        this.speed = 0.11;

        this.colors = {
            middleFinger: 0xb9004c,
            ground: 0x0b004c
        };

        this.middleFingers = [];

        this.mixers = [];
        this.actions = [];

        this.update = this.update.bind(this);
    }

    init({
        $el
    }) {
        this.$el = $el;

        this.scene = new Scene();
        this.scene.background = new THREE.Color(0x333);
        this.scene.fog = new THREE.Fog(this.colors.ground, 100, 500);

        this.camera = new PerspectiveCamera(
            60,
            window.innerWidth / window.innerHeight,
            1,
            2000
        );

        // this.camera.position.set(-5, 0, 40);
        this.camera.position.set(-20, 50, 30);

        this.renderer = new WebGLRenderer({
            antialias: true
        });
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;

        this.$el.appendChild(this.renderer.domElement);

        this.controls = this.initControls(this.camera);
        this.clock = new THREE.Clock();

        this.loadModels();
        this.initLights();
        this.initSpace();
        this.update();

        // volumeDetection.init();
        // blow.run();

        this.initGui();
        this.initEvents();
        this.initDOM();
    }

    initDOM() {
        this.$el = document.querySelector('.Home');
        this.$els = {};
        this.$els = {
            ...this.$els,
            blow: this.$el.querySelector('.blow'),
            blowSpans: this.$el.querySelectorAll('span')
        };
    }

    initEvents() {
        window.addEventListener('resize', this.resize.bind(this), false);
        // blow.events.on("start", this.onBlow.bind(this));
    }

    initGui() {
        const settings = {
            progressAnimation: this.progressAnimation,
            speed: this.speed
        };

        const update = () => {
            this.speed = settings.speed;

            this.progressAnimation = settings.progressAnimation;
        };

        gui.add(settings, 'speed', 0.05, 0.3).onChange(update);
    }

    initControls(camera) {
        const controls = new THREE.OrbitControls(camera, this.renderer.domElement);
        controls.update();

        return controls;
    }

    initLights() {
        const light = new THREE.HemisphereLight(0xffffff, 0xffffff, 0.5);

        const shadowLight = new THREE.DirectionalLight(0xffffff, 0.8);
        shadowLight.position.set(200, 200, 100);
        shadowLight.castShadow = true;
        this.debugLight(-200, 200, 100, 0x000);

        const backLight = new THREE.DirectionalLight(0xffffff, 0.4);
        backLight.position.set(-200, 200, 100);
        backLight.castShadow = true;
        this.debugLight(-200, 200, 100, 0x000);

        this.scene.add(backLight);
        this.scene.add(light);
        this.scene.add(shadowLight);
    }

    debugLight(x, y, z, color) {
        var geometry = new THREE.SphereGeometry(5, 32, 32);
        var material = new THREE.MeshPhongMaterial({
            color: 0x000
        });
        var sphere = new THREE.Mesh(geometry, material);
        sphere.position.set(-200, 200, 100);
        this.scene.add(sphere);
    }

    initSpace() {
        const floor = new THREE.Mesh(
            new THREE.PlaneBufferGeometry(2000, 2000),
            new THREE.MeshPhongMaterial({
                color: this.colors.ground
            })
        );
        floor.rotation.x = -Math.PI / 2;
        floor.position.y = -30;
        this.scene.add(floor);

        var geometry = new THREE.SphereGeometry(800, 32, 32);
        var material = new THREE.MeshPhongMaterial({
            color: this.colors.ground,
            side: THREE.BackSide
        });
        var sphere = new THREE.Mesh(geometry, material);
        sphere.receiveShadow = true;
        sphere.position.y = 200;

        this.scene.add(sphere);
    }

    loadModels() {
        const loader = new THREE.FBXLoader();
        this.group = new THREE.Group();
        for (let i = 0; i < 2; i++) {
            loader.load('assets/models/fuck-emma.FBX', fbx => this.onLoaded(fbx));
        }
    }

    onLoaded(fbx) {
        this.isFbxLoaded = true;
        this.initMiddleFinger(fbx);
    }

    initMiddleFinger(fbx) {
        const middleFinger = fbx;
        middleFinger.children[0].material = new THREE.MeshLambertMaterial({
            color: this.colors.middleFinger,
            skinning: true,
            flatShading: true,
            side: THREE.DoubleSide
        });

        middleFinger.traverse(function(child) {
            if (child.isMesh) {
                // child.castShadow = true;
                child.receiveShadow = true;
            }
        });

        this.group.add(middleFinger);
        this.middleFingers.push(middleFinger);

        middleFinger.position.y = -112;
        middleFinger.position.z = -30;

        if (this.middleFingers.length == 1) {
            middleFinger.position.x = 35;

            this.showMiddleFinger(0);
        } else {
            middleFinger.position.x = -20;
            middleFinger.scale.x = -1;

            this.scene.add(this.group);
        }

        middleFinger.children[0].material.opacity = 0;
        middleFinger.children[0].material.transparent = true;

        this.initAnimations(this.middleFingers.length - 1);
    }

    initAnimations(index) {
        this.middleFingers[index].mixer = new THREE.AnimationMixer(
            this.middleFingers[index]
        );
        this.mixers.push(this.middleFingers[index].mixer);
        this.actions.push(
            this.mixers[index].clipAction(this.middleFingers[index].animations[0])
        );

        this.actions[index].play();
    }

    update() {
        requestAnimationFrame(this.update);
        this.controls.update();

        // to disable zoom
        this.controls.enableZoom = false;

        // to disable rotation
        this.controls.enableRotate = false;

        // to disable pan
        this.controls.enablePan = false;

        this.updateAnimation();
        this.renderer.render(this.scene, this.camera);
    }

    updateAnimation() {
        if (this.isFbxLoaded) {
            for (let i = 0; i < this.mixers.length; i++) {
                this.mixers[i].update(0);
            }
            // if (this.canBlow) {
            //   this.progressAnimation =
            //     volumeDetection.meter.volume > 0.05
            //       ? this.progressAnimation + 0.01
            //       : this.progressAnimation - 0.01;
            //   if (!this.isBlowEnd && this.progressAnimation > 0.66) {
            //     this.progressAnimation = 0.66;
            //     this.showMiddleFinger(1);
            //     this.moveX();
            //     this.animateTwice();

            //     this.isBlowEnd = true;
            //     return;
            //   }
            //   if (this.progressAnimation <= 0.3) this.progressAnimation = 0.3;
            // }
            for (let j = 0; j < this.actions.length; j++) {
                if (!this.isBlowEnd) this.actions[j].time = this.progressAnimation;
            }
        }

        if (this.isFbxLoaded && !this.isFirstAnimDone) {
            this.isFirstAnimDone = true;
            TweenLite.to(this, 2.3, {
                progressAnimation: 0.66,
                delay: 2.2,
                onComplete: () => {
                    this.showMiddleFinger(1);
                    this.moveX();
                    this.animateTwice();

                    this.isBlowEnd = true;
                }
            });
        }

        // if (this.canBlow) {
        //   if (volumeDetection.meter.volume > 0.05) {
        //     this.onStartBlow();
        //   } else {
        //     this.onStopBlow();
        //   }
        // }
    }

    resize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();

        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    showMiddleFinger(index) {
        TweenLite.to(this.middleFingers[index].children[0].material, 0.5, {
            opacity: 1,
            onComplete: () => {
                if (index == 0) this.animate();
            }
        });
    }

    animate() {
        // TweenLite.to(this, 2, { progressAnimation: 0.66, ease: Back.easeInOut, delay: 1 });
        // TweenLite.to(this.middleFingers[0].position, 1.5, { z: -30, ease: Quart.easeInOut });
        // TweenLite.set(this.middleFingers[0].position, { z: -30 });
        TweenLite.to(
            this.camera.position,
            4,
            // { x: -20, z: 50, y: 30 },
            {
                x: 0,
                z: 35,
                y: 0,
                ease: Expo.easeInOut
            }
        );

        TweenLite.to(this, 4, {
            progressAnimation: 0.3,
            ease: Expo.easeOut
        });
        TweenMax.delayedCall(0.4, this.showBlow.bind(this));
    }

    showBlow() {
        TweenMax.staggerFromTo(
            this.$els.blowSpans,
            0.5, {
                y: 200,
                opacity: 0
            }, {
                y: 0,
                opacity: 1,
                delay: 1,
                ease: Back.easeOut,
                delay: 2,
                onComplete: this.hideBlow.bind(this)
            },
            0.04
        );
    }

    hideBlow() {
        // const pos = window.innerHeight / 4;
        TweenMax.to(
            this.$els.blow,
            0.5, {
                y: 240,
                scale: 0.4,
                delay: 1,
                ease: Back.easeOut,
                onComplete: () => {
                    this.canBlow = true;
                }
            },
            0.04
        );
    }

    // onStartBlow() {
    //   this.$els.blow.classList.add("shake");
    // }

    // onStopBlow() {
    //   if (this.isBlowEnd) return;
    //   this.$els.blow.classList.remove("shake");
    // }

    moveX() {
        // let spans = "";
        // const stirng = "Coucou les pédès !";
        // const word = stirng.split("");
        // // console.log(word);
        // for (let i = 0; i < word.length; i++) {
        //   // console.log(word[i]);

        //   spans += `<span style="opacity: 1">${word[i]}</span>\n`;
        // }
        // // console.log(spans);
        // // this.$els.blow.innerHTML = spans;

        // TweenLite.to(this.$els.blow, 0.5, {
        //   scale: 0.1,
        //   opacity: 0,
        //   ease: Back.easeIn,
        //   onComplete: () => {
        //     this.$els.blow.innerHTML = spans;
        //     TweenLite.to(this.$els.blow, 0.8, {
        //       opacity: 1,
        //       scale: 0.2,
        //       ease: Back.easeOut
        //     });
        //   }
        // });

        TweenLite.to(this.group.position, 0.8, {
            x: -8,
            ease: Expo.easeOut
        });
    }

    animateTwice() {
        this.loopDoubleSideFuck = this.loopDoubleSideFuck * -1;
        if (this.loopDoubleSideFuck == 1) {
            TweenMax.to(this.middleFingers[0].position, this.speed, {
                z: -35,
                y: -120,
                onComplete: this.animateTwice.bind(this)
            });
            TweenMax.to(this.middleFingers[1].position, this.speed, {
                z: -30,
                y: -112
            });

            TweenMax.to(this.group.position, this.speed, {
                x: -6
            });
        } else {
            TweenMax.to(this.middleFingers[0].position, this.speed, {
                z: -30,
                y: -112,
                onComplete: this.animateTwice.bind(this)
            });
            TweenMax.to(this.middleFingers[1].position, this.speed, {
                z: -35,
                y: -120
            });

            TweenMax.to(this.group.position, this.speed, {
                x: -10
            });
        }
    }
}

export default new WebGL();