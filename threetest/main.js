// Importing libraries
import './style.css';
import * as THREE from 'three';
import * as TWEEN from '@tweenjs/tween.js';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils'
import gsap from 'gsap';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import Stats from 'three/examples/jsm/libs/stats.module';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { OutlinePass } from 'three/examples/jsm/postprocessing/OutlinePass';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass';
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader';

// Setting up scene and camera
const { innerWidth, innerHeight } = window;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, innerWidth / innerHeight, 0.1, 100);
const renderer = new THREE.WebGLRenderer({ canvas: document.querySelector('#canvas') });
const composer = new EffectComposer(renderer);
const loader = new GLTFLoader();
const clock = new THREE.Clock();

let debug = false;
// Configuring renderer
scene.background = new THREE.Color(0xFAC898);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
composer.setSize(innerWidth, innerHeight);


const camArenaLookAt = new THREE.Vector3(-0.11064547517417635, -85.2479187656342, -52.275999308541785);
const camArenaLocation = {x:16.376846037157872, y:12.796224937349221, z:7.527560527103185};
// Setting camera properties
let camLookAt = new THREE.Vector3(93.76287057264722, -34.722557980013036, 1.6935375111408746);
camera.position.set(-15, 0, 0);
camera.lookAt(0, 0, 0);
camera.zoom = 1;


let submitButton = document.getElementById("textSubmit");
let submitButtonDiv = document.getElementById("textSubmitDiv")

// Variables for objects and flags
let scissor;
let paperStack;
let rock;
let raycaster = new THREE.Raycaster();
let mouse = new THREE.Vector2();
let mixer;
let action;

let scissorPlayFlag = false;

let rockMovingFlag = false;
let paperMovingFlag = false;
let scissorMovingFlag=false;

let isEnemyDescending = false;

let arenaObject = null;
let stage;

const stats = new Stats();
document.body.appendChild(stats.dom);

loader.load(
    '/3d/scissor/scissor.glb',
    function(gltf){
        scissor = gltf.scene;
        // console.log(gltf.scene);
        scissor.traverse((child)=>{
            if (child.type === "SkinnedMesh"){
                child.name='scissor';
                // console.log(child);
            }
        });
        scissor.name = 'scissor';
        scissor.userData.isContainer = true;
        scene.add(scissor);
        scissor.rotateY(-1.5708);
        scissor.position.set(-2.5, 0, -15);
        mixer = new THREE.AnimationMixer(gltf.scene);
        const clips = gltf.animations;
        const clip = THREE.AnimationClip.findByName(clips, 'Armature.001Action.001');
        action = mixer.clipAction(clip);
        action.reset();
    },
    function ( xhr ) {
		console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' );

	},
    function ( error ) {
        console.log(error);
		console.log( 'An error happened' );

	}
);

loader.load(
    '/3d/paper_stack.glb',
    function(gltf){
        paperStack = gltf.scene;
        paperStack.scale.set(0.15, 0.15, 0.15);
        paperStack.traverse((child)=>{
            if (child.type === "Mesh"){
                child.name='paperStack';
                // console.log(child);
            }
        });
        paperStack.name = "paperStack"
        scene.add(paperStack);
        paperStack.rotateY(1.5708);
        
    },
    function ( xhr ) {
		console.log( ( xhr.loaded / xhr.total * 100 ), '% loaded' );

	},
    function ( error ) {
        console.log(error);
		console.log( 'An error happened' );

	}
);

loader.load(
    '/3d/rock_and_plants.glb',
    function(gltf){
        rock = gltf.scene;
        rock.scale.set(0.5, 0.5, 0.5);
        rock.traverse((child)=>{
            if (child.type === "Mesh"){
                child.name = 'rock';
                // console.log(child);
            }
        });
        rock.position.set(0, 0, 8);
        rock.name="rock";
        scene.add(rock);
    },
    function ( xhr ) {
		console.log( ( xhr.loaded / xhr.total * 100 ), '% loaded' );

	},
    function ( error ) {
        console.log(error);
		console.log( 'An error happened' );

	}
);
let controls;
if (debug) {
    controls = new OrbitControls(camera, renderer.domElement);
}
const ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.3);
scene.add(ambientLight);

const pointLight = new THREE.PointLight(0xFFFFFF, 1000);
pointLight.position.set(10, 10, -10);
scene.add(pointLight);

const lightHelper = new THREE.PointLightHelper(pointLight);
scene.add(lightHelper);

const axeHelper = new THREE.AxesHelper(5);
scene.add(axeHelper);

const icosahedronGeo = new THREE.IcosahedronGeometry(1, 0);
const icoMaterial = new THREE.MeshToonMaterial({
    color:"#74c7ec",
});
const icosahedron = new THREE.Mesh(icosahedronGeo, icoMaterial);

scene.add(icosahedron);

const renderPass = new RenderPass( scene, camera );
composer.addPass( renderPass );

const outlinePass = new OutlinePass(new THREE.Vector2(window.innerWidth, window.innerHeight), scene, camera);
composer.addPass(outlinePass);

const aaPass = new ShaderPass(FXAAShader);
aaPass.uniforms[ 'resolution' ].value.set( 1 / window.innerWidth, 1 / window.innerHeight );
composer.addPass(aaPass);

const outputPass = new OutputPass();
composer.addPass(outputPass);
setTimeout(()=>{
    gsap.to(camera.position, {
        x: -11.123218848096666, 
        y: 8.150632911308724, 
        z: 0.023543489967580447,
        duration:2,
        onUpdate: function(){
            camera.lookAt(camLookAt);
        }

    });
}, 2500);

setTimeout(() => {
    isAnyInArena();
}, 10000);

addEventListener("resize", ()=>{
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect=window.innerWidth/window.innerHeight;
    camera.updateProjectionMatrix();
    composer.setSize(window.innerWidth, window.innerHeight);
    aaPass.uniforms[ 'resolution' ].value.set( 1 / window.innerWidth, 1 / window.innerHeight );
});

addEventListener('mousemove', onPointerMove);

addEventListener('mouseup', onMouseDown); 
if (debug){
    controls.addEventListener( "change", () => {  
        console.log( "POS", controls.object.position ); 
        let target = new THREE.Vector3();
        controls.object.getWorldDirection(target);
        target.set(target.x*100, target.y*100, target.z*100);
        console.log( "OR", target );
    });
}
submitButton.addEventListener("click", submitHandler);

animate();

function onPointerMove( event ) {
	mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
	mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
}

async function onMouseDown(){
    const intersectsDown = raycaster.intersectObjects( scene.children, true);

    for ( let i = 0; i < intersectsDown.length; i ++ ) {
        let obj = intersectsDown[i].object;
        if (!rockMovingFlag && !paperMovingFlag && !scissorMovingFlag){
            if (obj.name==='scissor'){
                console.log("scissor clicked");
                isAnyInArena();
                if (!scissorMovingFlag){
                    if (arenaObject === null && !isAnyInArena()){
                        moveScissor();
                    } else if (arenaObject === rock){
                        moveRockBack();
                        await waitForTween("rock");
                        moveScissor();
                    } else if (arenaObject === paperStack){
                        moveBackPaperStack();
                        await waitForTween("paper");
                        moveScissor();
                    } else if (arenaObject === scissor){
                        moveBackScissor();
                    }                
                }
            } else if (obj.name==='paperStack') { 
                console.log("paper clicked");
                isAnyInArena();
                if (!paperMovingFlag){
                    if (arenaObject===null && !isAnyInArena()){
                        movePaperStack();
                    } else if (arenaObject === rock){
                        moveRockBack();
                        await waitForTween("rock");
                        movePaperStack();
                    } else if (arenaObject === scissor){
                        moveBackScissor();
                        await waitForTween("scissor");
                        movePaperStack();
                    } else if (arenaObject === paperStack){
                        moveBackPaperStack();
                    }
                }
            } else if (obj.name==='rock') {
                console.log("dwayne clicked");
                isAnyInArena();
                if (!rockMovingFlag){
                    if (arenaObject===null && !isAnyInArena()){
                        moveRock();
                    } else if (arenaObject === paperStack){
                        moveBackPaperStack();
                        await waitForTween("paper");
                        moveRock();
                    } else if (arenaObject === scissor){
                        moveBackScissor();
                        await waitForTween("scissor");
                        moveRock();
                    } else if (arenaObject === rock){
                        moveRockBack();
                    }
                }
            } else {
                console.log("what did you click");
            }
        }
    }
}

function animate(){
    requestAnimationFrame(animate);
    if ( mixer ) {
        mixer.update(clock.getDelta());
    }

    raycastHandler();
    if (debug){
        controls.update();
    }
    // renderer.render(scene, camera);
    // if (arenaObject === null){
    //     console.log("arena null");
    // } else {
    //     console.log(arenaObject.name);
    // }
    composer.render();
    TWEEN.update();
    stats.update();
}

function raycastHandler(){
    raycaster.setFromCamera( mouse, camera );

	// calculate objects intersecting the picking ray
	const intersects = raycaster.intersectObjects( scene.children, true);
    let highlightedItems=[];
    if (intersects.length===0 && scissorPlayFlag){
        scissorPlayFlag=false;
        return;
    }
	for ( let i = 0; i < intersects.length; i ++ ) {
        let obj = intersects[i].object;
        if (obj.name==='scissor'){
            highlightedItems = getAllObjectsInGroup(scissor, "SkinnedMesh");
            if (!scissorPlayFlag){
                scissorPlayFlag=true;
                action.reset();
                action.play();
                mixer.addEventListener("loop", ()=>{
                    if (!scissorPlayFlag) {
                        action.stop();
                        action.reset();
                        scissorPlayFlag = false;    
                        console.log('ENDED');
                    } else {
                        console.log("SKIPPING");
                    }
                });
            };
        } else if (obj.name==='paperStack') { 
            highlightedItems = getAllObjectsInGroup(paperStack, "Mesh");
        } else if (obj.name==='rock') {
            highlightedItems = getAllObjectsInGroup(rock, "Mesh");
        } else {
            highlightedItems = [obj];
        }
        // console.log(highlightedItems);
        outlinePass.selectedObjects = highlightedItems;
    }
}

function getAllObjectsInGroup(group, type) {
    let objects = [];

    group.traverse((object) => {
        if (object.type===type) {
            objects.push(object);
        }
    });

    return objects;
}

async function moveRock(){
    if (rockMovingFlag){
        await waitForTween("rock"); 
    }
    rockMovingFlag = true;
    arenaObject = rock;
    const rockTween = new TWEEN.Tween({x:0, y:0, z:8})
    .to({x:10, y:0, z :0}, 2000)
    .easing(TWEEN.Easing.Circular.InOut);

    rockTween.onUpdate(function(obj){
        rock.position.set(obj.x, obj.y, obj.z);
    });

    rockTween.onComplete(()=>{
        console.log("Dwayne has reached destination");
        rockMovingFlag=false;
    });
    rockTween.start();
}

async function moveRockBack(){
    if (rockMovingFlag){
        await waitForTween("rock"); 
    }
    rockMovingFlag = true;
    const rockBackTween = new TWEEN.Tween({x:10, y:0, z:0})
    .to({x:0, y:0, z :8}, 2000)
    .easing(TWEEN.Easing.Circular.InOut);

    rockBackTween.onUpdate(function(obj){
        rock.position.set(obj.x, obj.y, obj.z);
    });

    rockBackTween.onComplete(()=>{
        console.log("Dwayne has reached destination");
        rockMovingFlag=false;
        arenaObject = null;
        
    });
    rockBackTween.start();
}

async function movePaperStack(){
    if (paperMovingFlag){
        await waitForTween("paper");
    }
    paperMovingFlag = true;
    arenaObject = paperStack;
    const paperStackTween = new TWEEN.Tween({x:0, y:0, z:0})
    .to({x:10, y:0, z:0}, 2000)
    .easing(TWEEN.Easing.Circular.InOut);

    paperStackTween.onUpdate(function(obj){
        paperStack.position.set(obj.x, obj.y, obj.z);
    });

    paperStackTween.onComplete(()=>{
        console.log("papergo");
        paperMovingFlag=false;
    });

    paperStackTween.start();
}

async function moveBackPaperStack(){
    if (paperMovingFlag){
        await waitForTween("paper");
    }
    paperMovingFlag = true;
    const paperBackStackTween = new TWEEN.Tween({x:10, y:0, z:0})
    .to({x:0, y:0, z:0}, 2000)
    .easing(TWEEN.Easing.Circular.InOut);

    paperBackStackTween.onUpdate(function(obj){
        paperStack.position.set(obj.x, obj.y, obj.z);
    });

    paperBackStackTween.onComplete(()=>{
        console.log("paperback");
        paperMovingFlag=false;
        arenaObject=null;
    });

    paperBackStackTween.start();
}

async function moveScissor(){
    if (scissorMovingFlag){
        await waitForTween("scissor");
    }
    scissorMovingFlag = true;
    arenaObject = scissor;
    const scissorTween = new TWEEN.Tween({x: -2.5, y:0, z:-15})
    .to({x:8.5, y:0, z:-6.8}, 2000)
    .easing(TWEEN.Easing.Circular.InOut);

    scissorTween.onUpdate(function(obj){
        scissor.position.set(obj.x, obj.y, obj.z);
    });

    scissorTween.onComplete(()=>{
        scissorMovingFlag=false;
    });

    scissorTween.start();
}

async function moveBackScissor(){
    if (scissorMovingFlag){
        await waitForTween("scissor");
    }
    scissorMovingFlag = true;
    const scissorBackTween = new TWEEN.Tween({x:8.5, y:0, z:-6.8})
    .to({x: -2.5, y:0, z:-15})
    .easing(TWEEN.Easing.Circular.InOut);

    scissorBackTween.onUpdate(function(obj){
        scissor.position.set(obj.x, obj.y, obj.z);
    });

    scissorBackTween.onComplete(()=>{
        scissorMovingFlag=false;
        checkForTweenLocation(scissor);
        arenaObject = null;
    });
    
    scissorBackTween.start();
}


async function waitForTween(name) {
    return new Promise(resolve => {
        const intervalId = setInterval(() => {
            let thing;
            if (name === "paper"){
                thing = paperMovingFlag;
            } else if (name === "rock"){
                thing = rockMovingFlag;
            } else if (name === "scissor"){
                thing = scissorMovingFlag;
            } else if (name === "enemy"){
                thing = isEnemyDescending;
            }

            if (thing==false) {
                clearInterval(intervalId);
                resolve();
            }
        }, 100);
    });
}

// PURELT FOR SAFETY, HANDLE SOME EDGE CASES
function checkForTweenLocation(tween){
    let location = tween.position.x;
    if (tween.name === "scissor"){
        if (location === 8.5 || location!== -2.5) {
            arenaObject = scissor;
            return true;
        } else {
            return false;
        }
    } else if (tween.name === "rock"){
        if (location === 10 || location!== 0){
            arenaObject = rock;
            return true;
        } else {
            return false;
        }
    } else if (tween.name === "paperStack"){
        if (location === 10 || location!== 0){
            arenaObject = paperStack;
            return true;
        } else {
            return false;
        }
    }
}

function isAnyInArena(){
    if (checkForTweenLocation(rock)||checkForTweenLocation(paperStack)||checkForTweenLocation(scissor)){
        return true;
    } else {
        return false;
    }
}

function submitHandler(){
    if (arenaObject===null){
        console.log("NOTHING IN ARENA, SKIPPING");
        return;
    }
    stage = 1;
    submitButtonDiv.style.opacity=0;
    gsap.to(camera.position, {
        x: camArenaLocation.x, 
        y: camArenaLocation.y, 
        z: camArenaLocation.z,
        duration:4,
        onUpdate: function(){
            camera.lookAt(camArenaLookAt);
        }
    });
    generateEnemyChoice();
}

let enemyObject;
function generateEnemyChoice(){
    let choices = ["rock", "paperStack", "scissor"];
    let enemyChoice = choices[Math.round(Math.random()*2)];
    
    if (enemyChoice === "rock"){
        enemyObject = SkeletonUtils.clone(rock);
    } else if (enemyChoice === "paperStack"){
        enemyObject = SkeletonUtils.clone(paperStack);
    } else if (enemyChoice === "scissor"){
        enemyObject = SkeletonUtils.clone(scissor);
    } else {
        console.log("magic happened");
    }

    console.log(enemyChoice);
    if (enemyChoice!=="scissor"){
        enemyObject.position.set(20, 5, 0);
        scene.add(enemyObject);
        isEnemyDescending = true;
        console.log(enemyObject.name);
        let enemyObjectTween = new TWEEN.Tween({x:20, y:5, z:0})
        .to({x:25, y:0, z:0}, 3000)
        .easing(TWEEN.Easing.Circular.InOut);

        enemyObjectTween.onUpdate(function(obj){
            enemyObject.position.set(obj.x, obj.y, obj.z);
        });

        enemyObjectTween.onComplete(()=>{
            isEnemyDescending = false;
        });

        enemyObjectTween.start();
        arenaFightHandler();
    }
}

async function arenaFightHandler(){
    let userChoice = arenaObject.name;
    let enemyChoice = enemyObject.name;

    if (userChoice === enemyChoice){
        console.log("TIE");
        if (rockMovingFlag){
            await waitForTween("rock");
        } else if (paperMovingFlag){
            await waitForTween("paper");
        } else if (scissorMovingFlag){
            await waitForTween("scissor");
        }

        let userTween = new TWEEN.Tween({x:10, y:0, z:0})
        .to({x:15, y:0, z:0}, 1000)
        .easing(TWEEN.Easing.Bounce.Out)
        .onUpdate(function(obj){
            arenaObject.position.set(obj.x, obj.y, obj.z);
        });

        let enemyTween = new TWEEN.Tween({x:25, y:0, z:0})
        .to({x:20, y:0, z:0}, 1000)
        .easing(TWEEN.Easing.Bounce.Out)
        .onUpdate(function(obj){
            enemyObject.position.set(obj.x, obj.y, obj.z);
        });

        let userFadeTween = new TWEEN.Tween({x:15, y:0, z:0})
        .to({x:15, y:-120, z:0}, 2000)
        .easing(TWEEN.Easing.Quadratic.InOut)
        .onUpdate(function(obj){
            arenaObject.position.set(obj.x, obj.y, obj.z);
        });

        let enemeyFadeTween = new TWEEN.Tween({x:20, y:0, z:0})
        .to({x:20, y:-120, z:0}, 2000)
        .easing(TWEEN.Easing.Quadratic.InOut)
        .onUpdate(function(obj){
            enemyObject.position.set(obj.x, obj.y, obj.z);
        });
        
        userTween.chain(userFadeTween);
        enemyTween.chain(enemeyFadeTween);

        setTimeout(()=>{
            userTween.start();
            enemyTween.start();
        }, 3000);

    } else if (
        (userChoice === 'rock' && enemyChoice === 'scissor') ||
        (userChoice === 'paperStack' && enemyChoice === 'rock') ||
        (userChoice === 'scissor' && enemyChoice === 'paperStack')
    ) {
        console.log("USER WON!");
    } else {
        console.log("DUNDUNDUN");
    }
}