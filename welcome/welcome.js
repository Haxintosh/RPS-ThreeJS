import './welcome.css';
import * as THREE from 'three';
import * as TWEEN from '@tweenjs/tween.js';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils'
import gsap from 'gsap';

import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import {RenderPixelatedPass} from 'three/examples/jsm/postprocessing/RenderPixelatedPass'
import Stats from 'three/examples/jsm/libs/stats.module';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { OutlinePass } from 'three/examples/jsm/postprocessing/OutlinePass';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass';
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader';

let loaded = false;
const { innerWidth, innerHeight } = window;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, innerWidth / innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ canvas: document.querySelector('#canvas') });
const composer = new EffectComposer(renderer);
const loader = new GLTFLoader();
let mouse = new THREE.Vector2();

let camOrigin = {
    "x": 329.1184433897465,
    "y": -143.55820963544724,
    "z": 344.70554127267064
  }

let cameraTarget = {
    "x": -3100,
    "y": 1400,
    "z": -9400
  }


let controls;

let debug = false;
// Configuring renderer
scene.background = new THREE.Color(0xFAC898);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
composer.setSize(innerWidth, innerHeight);

// Setting camera properties
camera.position.set(camOrigin.x, camOrigin.y, camOrigin.z);
camera.lookAt(cameraTarget.x, cameraTarget.y, cameraTarget.z);
camera.zoom = 1;

let fontLoader = new FontLoader();

const font = fontLoader.load(
    '/threeTest/fonts/kroeger 05_55_Regular.json',
    function (font){
        console.log(font);
        console.log("loaded");
        init(font);
    },
    function ( xhr ) {
		console.log( (xhr.loaded / xhr.total * 100) + '% loaded' );
	},
	// onError callback
	function ( err ) {
		console.log( 'An error happened' );
	}
)

const renderPixelatedPass = new RenderPixelatedPass( 3, scene, camera );
composer.addPass(renderPixelatedPass);

const outlinePass = new OutlinePass(new THREE.Vector2(window.innerWidth, window.innerHeight), scene, camera);
composer.addPass(outlinePass);
outlinePass.edgeStrength = 10;

const outputPass = new OutputPass();
composer.addPass( outputPass );

let easyButton;
let mediumButton;
let hardButton;
let easyLabel;
let mediumLabel;
let hardLabel;

let welcomeMesh;
function init(font){
    loaded = true;
    let buttonWidth = 125
    let buttonHeight = 40;
    let buttonDepth = 20;
    
    if (debug) {
        controls = new OrbitControls(camera, renderer.domElement);
    }
    let welcomeText = new TextGeometry('WELCOME!', {
        font:font,
        size:50,
        height:30,
        curveSegments:1,
        bevelEnabled:false,
        bevelThickness: 4,
        bevelSize: 4,
        bevelOffset: 0,
        bevelSegments: 5
    });

    let chooseDiffText = new TextGeometry('SELECT DIFFICULTY', {
        font:font,
        size:25,
        height:20,
        curveSegments:1,
        bevelEnabled: false
    });

    let easyText = new TextGeometry('EASY', {
        font:font,
        size:25,
        height:10,
        curveSegments:1,
        bevelEnabled: false
    });

    let mediumText = new TextGeometry('MEDIUM', {
        font:font,
        size:25,
        height:10,
        curveSegments:1,
        bevelEnabled: false
    });

    let hardText = new TextGeometry('IMPOSSIBLE', {
        font:font,
        size:25,
        height:10,
        curveSegments:1,
        bevelEnabled: false
    });
    
    let easyButtonGeo = new THREE.BoxGeometry(buttonWidth, buttonHeight, buttonDepth);
    let mediumButtonGeo = new THREE.BoxGeometry(buttonWidth, buttonHeight, buttonDepth);
    let hardButtonGeo = new THREE.BoxGeometry(buttonWidth, buttonHeight, buttonDepth);

    welcomeText.computeBoundingBox();
    chooseDiffText.computeBoundingBox();

    let welcomeMaterial = new THREE.MeshPhongMaterial({
        color: 0x68b7e9,
        emissive: 0x4f7e8b,
        shininess: 10,
        specular: 0xffffff
    });


    let chooseDiffMaterial= new THREE.MeshPhongMaterial({
        color:0x1c1c84,
        emissive: 0x4f7e8b,
        shininess:10,
        specular: 0xffffff
    });

    let buttonEasyMaterial = new THREE.MeshToonMaterial({
        color: 0x50C878,
    });

    let buttonMediumMaterial = new THREE.MeshToonMaterial({
        color: 0xffe078,
    });

    let buttonHardMaterial = new THREE.MeshToonMaterial({
        color: 0xD21F3C,
    });

    let buttonLabelMaterial = new THREE.MeshToonMaterial({
        color:0xFFFFFF
    });
    // let welcomeMaterial = new THREE.MeshToonMaterial();

    welcomeMesh = new THREE.Mesh(welcomeText, welcomeMaterial);
    welcomeMesh.receiveShadow = true;
    welcomeMesh.castShadow = true;
    scene.add(welcomeMesh);

    let chooseDiffMesh = new THREE.Mesh(chooseDiffText, chooseDiffMaterial);
    chooseDiffMesh.receiveShadow = true;
    chooseDiffMesh.castShadow = true;
    scene.add(chooseDiffMesh);

    easyButton = new THREE.Mesh(easyButtonGeo, buttonEasyMaterial);
    mediumButton = new THREE.Mesh(mediumButtonGeo, buttonMediumMaterial);
    hardButton = new THREE.Mesh(hardButtonGeo, buttonHardMaterial);

    easyLabel = new THREE.Mesh(easyText, buttonLabelMaterial);
    mediumLabel = new THREE.Mesh(mediumText, buttonLabelMaterial);
    hardLabel = new THREE.Mesh(hardText, buttonLabelMaterial);

    easyLabel.name = "easy";
    mediumLabel.name = "medium";
    hardLabel.name = "hard";
    
    easyButton.name = "easy";
    mediumButton.name = "medium";
    hardButton.name = "hard";

    scene.add(easyLabel);
    scene.add(mediumLabel);
    scene.add(hardLabel);

    scene.add(easyButton);
    scene.add(mediumButton);
    scene.add(hardButton);

    easyButton.position.set(125, -115, 0);
    mediumButton.position.set(125, -165, 0);
    hardButton.position.set(125, -215, 0);

    easyLabel.position.set(125 + buttonWidth - 20, -115 - (buttonHeight/4), 0);
    mediumLabel.position.set(125 + buttonWidth - 20 , -165 - (buttonHeight/4), 0);
    hardLabel.position.set(125 + buttonWidth - 20 , -215 - (buttonHeight/4), 0);


    chooseDiffMesh.position.set(150, -60, 0);

    let ambientLight = new THREE.AmbientLight(0xffffff, 1.5);
    scene.add(ambientLight);

    let pointLight = new THREE.PointLight(0xffffff, 5000000*1.2);
    pointLight.position.set(500, 1000, 75);
    scene.add(pointLight);

    let lightHelper = new THREE.PointLightHelper(pointLight);
    scene.add(lightHelper);

    renderPixelatedPass.depthEdgeStrength=1;

    let welcomeTween = new TWEEN.Tween({x: 0, y: 0, z: 0})
    .to({x: 0, y: 0, z: 20}, 4000)
    .easing(TWEEN.Easing.Quadratic.InOut)
    .onUpdate(function (obj){
        welcomeMesh.position.set(obj.x, obj.y, obj.z);
    });
    let welcomeTweenBack = new TWEEN.Tween({x: 0, y: 0, z: 20})
    .to({x: 0, y: 0, z: 0}, 4000)
    .easing(TWEEN.Easing.Quadratic.InOut)
    .onUpdate(function (obj){
        welcomeMesh.position.set(obj.x, obj.y, obj.z);
    });

    welcomeTween.chain(welcomeTweenBack);
    welcomeTweenBack.chain(welcomeTween);

    welcomeTween.start();

    animate();
    if (debug){
        controls.addEventListener( "change", () => {  
            console.log( "POS", controls.object.position ); 
            let target = new THREE.Vector3();
            controls.object.getWorldDirection(target);
            target.set(target.x*100, target.y*100, target.z*100);
            console.log( "OR", target );
        });
    }
    
}


addEventListener("resize", ()=>{
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect=window.innerWidth/window.innerHeight;
    camera.updateProjectionMatrix();
    composer.setSize(window.innerWidth, window.innerHeight);
});

addEventListener('mousemove', onPointerMove);

addEventListener('click', buttonHandler);

function onPointerMove( event ) {
	mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
	mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
}


function animate(){
    requestAnimationFrame(animate);
    // if (loaded){
    //     console.log("loaded");
    // }
    raycastHandler();
    TWEEN.update();
    composer.render();
    if (debug){
        controls.update();
    }
}

function raycastHandler(){
    let raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);
    let intersects = raycaster.intersectObjects(scene.children, true);
    if (intersects.length > 0){
        let object = intersects[0].object;
        if (object.name === "easy" || object.name === "medium" || object.name === "hard"){
            // console.log(object.name);
            outlinePass.selectedObjects = [object];
            object.position.z = -10;
        }
    } else {
        easyButton.position.z = 0;
        mediumButton.position.z = 0;
        hardButton.position.z = 0;
        easyLabel.position.z = 0;
        mediumLabel.position.z = 0;
        hardLabel.position.z = 0;
    }
}

function buttonHandler(){
    let raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);
    let intersects = raycaster.intersectObjects(scene.children, true);
    if (intersects.length > 0){
        let object = intersects[0].object;
        if (object.name === "easy" || object.name === "medium" || object.name === "hard"){
            console.log(object.name);
            let url = "/game/game.html"
            switch (object.name){ // omg there's something called switch :brainblown:
                case "easy":
                    url += "?difficulty=easy";
                    break;
                case "medium":
                    url += "?difficulty=medium";
                    break;
                case "hard":
                    url += "?difficulty=hard";
                    break;
            }
            console.log(url);
            window.location.replace(url);
        }
    }
}