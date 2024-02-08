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

const { innerWidth, innerHeight } = window;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, innerWidth / innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ canvas: document.querySelector('#canvas') });
const composer = new EffectComposer(renderer);
const loader = new GLTFLoader();
const clock = new THREE.Clock();
let controls;

let debug = true;
// Configuring renderer
scene.background = new THREE.Color(0xFAC898);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
composer.setSize(innerWidth, innerHeight);

// Setting camera properties
camera.position.set(-15, 0, 0);
camera.lookAt(0, 0, 0);
camera.zoom = 1;

let fontLoader = new FontLoader();

const font = fontLoader.load(
    '/fonts/kroeger 05_55_Regular.json',
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

const outputPass = new OutputPass();
composer.addPass( outputPass );


function init(font){
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
        height:20,
        curveSegments:1,
        bevelEnabled: false
    });

    let mediumText = new TextGeometry('MEDIUM', {
        font:font,
        size:25,
        height:20,
        curveSegments:1,
        bevelEnabled: false
    });

    let hardText = new TextGeometry('IMPOSSIBLE', {
        font:font,
        size:25,
        height:20,
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
        color:0xFFFFFF.
    });
    // let welcomeMaterial = new THREE.MeshToonMaterial();

    let welcomeMesh = new THREE.Mesh(welcomeText, welcomeMaterial);
    welcomeMesh.receiveShadow = true;
    welcomeMesh.castShadow = true;
    scene.add(welcomeMesh);

    let chooseDiffMesh = new THREE.Mesh(chooseDiffText, chooseDiffMaterial);
    chooseDiffMesh.receiveShadow = true;
    chooseDiffMesh.castShadow = true;
    scene.add(chooseDiffMesh);

    let easyButton = new THREE.Mesh(easyButtonGeo, buttonEasyMaterial);
    let mediumButton = new THREE.Mesh(mediumButtonGeo, buttonMediumMaterial);
    let hardButton = new THREE.Mesh(hardButtonGeo, buttonHardMaterial);

    let easyLabel = new THREE.Mesh(easyText, buttonLabelMaterial);
    
    easyButton.name = "easy";
    mediumButton.name = "medium";
    hardButton.name = "hard";

    scene.add(easyButton);
    scene.add(mediumButton);
    scene.add(hardButton);

    easyButton.position.set(125, -115, 0);
    mediumButton.position.set(125, -165, 0);
    hardButton.position.set(125, -215, 0);

    chooseDiffMesh.position.set(150, -60, 0);

    let ambientLight = new THREE.AmbientLight(0xffffff, 3);
    scene.add(ambientLight);

    animate();
}


addEventListener("resize", ()=>{
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect=window.innerWidth/window.innerHeight;
    camera.updateProjectionMatrix();
    composer.setSize(window.innerWidth, window.innerHeight);
});

function animate(){
    requestAnimationFrame(animate);
    composer.render();
    if (debug){
        controls.update();
    }
}