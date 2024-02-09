// Importing libraries
import './game.css';
import * as THREE from 'three';
import * as TWEEN from '@tweenjs/tween.js';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils'
import gsap from 'gsap';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
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

// Configuring renderer
scene.background = new THREE.Color(0xFAC898);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
composer.setSize(innerWidth, innerHeight);

// Setting camera properties
const camArenaLookAt = new THREE.Vector3(-1816.82, -69449.61, -71926.69);
const camArenaLocation = {   "x": 17.733316880083002,   "y": 16.205656198772562,   "z": 13.555062012063997 };
const camLookAt = new THREE.Vector3(93.76287057264722, -34.722557980013036, 1.6935375111408746);

camera.position.set(-15, 0, 0);
camera.lookAt(0, 0, 0);
camera.zoom = 1;

let score = 300;
let scoreDiv = document.getElementById("scoreBoard");
let scoreCounter = document.getElementById("score");
let counter = 300;
let debug = false;

let rockEmoji = '🪨';
let paperEmoji = '📄';
let scissorEmoji = '✂️';

let submitButton = document.getElementById("buttonSubmit");
let submitButtonDiv = document.getElementById("textSubmitDiv")
let submitIcon = document.getElementById("icon");
let submitText = document.getElementById("textSubmit");
let messageBarText = document.getElementById("messageBarText");
let messageBar = document.getElementById("messageBar");
let loadBlocker = document.getElementById("loadBlocker");

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
let userStatus = null;

let restartFlag = false;
let arenaFlag = false;

let params = new URLSearchParams(window.location.search);
let difficulty = params.get('difficulty');
if (difficulty === null){
    difficulty = "easy";
}

let winDict = {
    "rock": "scissor",
    "paperStack": "rock",
    "scissor": "paperStack"
};
let loseDict = {
    "rock": "paperStack",
    "paperStack": "scissor",
    "scissor": "rock"
}

const stats = new Stats();
document.body.appendChild(stats.dom);

// Loading models
loader.load(
    '/threeTest/3d/scissor/scissor.glb',
    function(gltf){
        scissor = gltf.scene;
        scissor.traverse((child)=>{
            if (child.type === "SkinnedMesh"){
                child.name='scissor';
            }
        });
        scissor.name = 'scissor';
        scissor.userData.isContainer = true;
        scene.add(scissor);

        // Positioning Scissor
        scissor.rotateY(-1.5708);
        scissor.position.set(-2.5, 0, -15);

        // Set up animations
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
    '/threeTest/3d/paper_stack.glb',
    function(gltf){
        paperStack = gltf.scene;
        paperStack.scale.set(0.15, 0.15, 0.15);
        paperStack.traverse((child)=>{
            if (child.type === "Mesh"){
                child.name='paperStack';
            }
        });
        paperStack.name = "paperStack"
        scene.add(paperStack);

        // Positioning Paper
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
    '/threeTest/3d/rock_and_plants.glb',
    function(gltf){
        rock = gltf.scene;
        rock.scale.set(0.5, 0.5, 0.5);
        rock.traverse((child)=>{
            if (child.type === "Mesh"){
                child.name = 'rock';
            }
        });
        rock.name="rock";
        scene.add(rock);

        // Positioning Rock
        rock.position.set(0, 0, 8);
        
    },
    function ( xhr ) {
		console.log( ( xhr.loaded / xhr.total * 100 ), '% loaded' );

        // Hide loading screen when all models are loaded
        if (xhr.loaded / xhr.total * 100 === 100){
            loadBlocker.style.opacity = 0;
            loadBlocker.style.zIndex = -2;
            loadBlocker.style.pointerEvents = "none";

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
            }, 100);
        }

	},
    function ( error ) {
        console.log(error);
		console.log( 'An error happened' );

	}
);

// Enable orbit controls for debugging
let controls;

if (debug) {
    controls = new OrbitControls(camera, renderer.domElement);
}

// Lighting
const ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.3);
scene.add(ambientLight);

const pointLight = new THREE.PointLight(0xFFFFFF, 1000);
pointLight.position.set(10, 10, -10);
scene.add(pointLight);

// Post processing
const renderPass = new RenderPass( scene, camera );
composer.addPass( renderPass );

const outlinePass = new OutlinePass(new THREE.Vector2(window.innerWidth, window.innerHeight), scene, camera);
composer.addPass(outlinePass);

const aaPass = new ShaderPass(FXAAShader);
aaPass.uniforms[ 'resolution' ].value.set( 1 / window.innerWidth, 1 / window.innerHeight );
composer.addPass(aaPass);

const outputPass = new OutputPass();
composer.addPass(outputPass);

// Setup Event Listeners and periodic updates
setInterval(() => {
    updateScoreBoard();
}, 10);

// Update visuals on resize
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

submitButton.addEventListener("click", submitHandler);
// Log Camera Position and Orientation when debugging
if (debug){
    controls.addEventListener( "change", () => {  
        console.log( "POS", controls.object.position ); 
        let target = new THREE.Vector3();
        controls.object.getWorldDirection(target);
        target.set(target.x*100, target.y*100, target.z*100);
        console.log( "OR", target );
    });
}

animate(); // Start animation loop

// Calculate pointer vector for raycasting
function onPointerMove( event ) {
	mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
	mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
}

// Handler for clicks
async function onMouseDown(){
    if (arenaFlag){
        return; // skip if anything is in the arena
    }

    const intersectsDown = raycaster.intersectObjects( scene.children, true); // raycast from camera to scene

    for ( let i = 0; i < intersectsDown.length; i ++ ) { // loop through all intersected objects
        let obj = intersectsDown[i].object;
        if (!rockMovingFlag && !paperMovingFlag && !scissorMovingFlag){
            // Handles the click event for the objects
            if (obj.name==='scissor'){
                arenaFlag = true;
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
                arenaFlag = true;
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
                arenaFlag = true;
                console.log("rock clicked");
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
                // If nothing is clicked
                console.log("Nothing was clicked");
            }
        }
    }
}

function animate(){
    
    // Animation loop
    requestAnimationFrame(animate);

    // Update the animation mixer
    if ( mixer ) {
        mixer.update(clock.getDelta());
    }

    // Handle raycasting
    raycastHandler();

    // Update Orbit Controls 
    if (debug){
        controls.update();
    }

    // Render the scene
    composer.render();
    TWEEN.update();

    // Update stats
    stats.update();
}

function raycastHandler(){
    raycaster.setFromCamera( mouse, camera );

	// calculate objects intersecting the picking ray
	const intersects = raycaster.intersectObjects( scene.children, true);
    let highlightedItems=[];

    if (intersects.length===0 && scissorPlayFlag){
        scissorPlayFlag=false; // schedule the scissor to stop playing
        return;
    }
	for ( let i = 0; i < intersects.length; i ++ ) {
        let obj = intersects[i].object;
        if (obj.name==='scissor'){
            highlightedItems = getAllObjectsInGroup(scissor, "SkinnedMesh"); // Highlight all parts of the scissor
            if (!scissorPlayFlag){
                scissorPlayFlag=true;
                action.reset();
                action.play();
                mixer.addEventListener("loop", ()=>{
                    if (!scissorPlayFlag) { // Stop animation if scissor should stop playing
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
            highlightedItems = getAllObjectsInGroup(paperStack, "Mesh"); // Highlight all parts of the paper stack
        } else if (obj.name==='rock') {
            highlightedItems = getAllObjectsInGroup(rock, "Mesh"); // Highlight all parts of the rock
        } else {
            highlightedItems = [obj]; 
        }
    
        outlinePass.selectedObjects = highlightedItems; // Push to outline pass
    }
}

function getAllObjectsInGroup(group, type) { // Function to get all objects in a group of a specific type
    let objects = [];

    group.traverse((object) => {
        if (object.type===type) {
            objects.push(object);
        }
    });

    return objects;
}

async function moveRock() {
    if (rockMovingFlag){
        await waitForTween("rock"); // Wait for the rock to finish moving
    }

    rockMovingFlag = true;
    arenaObject = rock;

    // Position interpolation for the rock to move to the arena
    const rockTween = new TWEEN.Tween({x:0, y:0, z:8})
    .to({x:10, y:0, z :0}, 2000)
    .easing(TWEEN.Easing.Circular.InOut);
    
    // Update the position of the rock
    rockTween.onUpdate(function(obj){
        rock.position.set(obj.x, obj.y, obj.z);
    });

    // Set the flag to false when the interpolation is complete
    rockTween.onComplete(()=>{
        rockMovingFlag=false;
    });

    // Starts the interpolation
    rockTween.start();
}

async function moveRockBack(){
    if (rockMovingFlag){
        await waitForTween("rock"); // Wait for the rock to finish moving
    }

    rockMovingFlag = true;

    // Position interpolation for the rock to move back to its original position
    const rockBackTween = new TWEEN.Tween({x:10, y:0, z:0})
    .to({x:0, y:0, z :8}, 2000)
    .easing(TWEEN.Easing.Circular.InOut);

    // Update the position of the rock
    rockBackTween.onUpdate(function(obj){
        rock.position.set(obj.x, obj.y, obj.z);
    });

    // Set the flag to false when the interpolation is complete
    rockBackTween.onComplete(()=>{
        rockMovingFlag=false;
        arenaObject = null;
        
    });

    // Starts the interpolation
    rockBackTween.start();
}

// Comments for the moveRock function apply to the movePaperStack function
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
        paperMovingFlag=false;
    });

    paperStackTween.start();
}

// Comments for the moveRockBack function apply to the moveBackPaperStack function
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
        paperMovingFlag=false;
        arenaObject=null;
    });

    paperBackStackTween.start();
}

// Comments for the moveRock function apply to the moveScissor function
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

// Comments for the moveRockBack function apply to the moveBackScissor function
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

// Function to wait for the interpolation to finish
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

// Function to check the object's location
// PURELY FOR SAFETY, HANDLE SOME EDGE CASES
function checkForTweenLocation(tween){
    let location = tween.position.x;
    if (tween.name === "scissor"){
        if (location === 8.5 || location!== -2.5) { // if it' between the arena and the original position (transition)
            arenaObject = scissor;
            return true;
        } else {
            return false;
        }
    } else if (tween.name === "rock"){
        if (location === 10 || location!== 0){ // if it' between the arena and the original position (transition)
            arenaObject = rock;
            return true;
        } else {
            return false;
        }
    } else if (tween.name === "paperStack"){
        if (location === 10 || location!== 0){ // if it' between the arena and the original position (transition)
            arenaObject = paperStack;
            return true;
        } else {
            return false;
        }
    }
}

// Checks for all the objects in the arena
function isAnyInArena(){
    if (checkForTweenLocation(rock)||checkForTweenLocation(paperStack)||checkForTweenLocation(scissor)){
        return true;
    } else {
        return false;
    }
}

// Function to handle the submit button
function submitHandler(){
    if (restartFlag){
        globalReset(); // Change button function to restart if the restart flag is set
        return;
    }
    if (arenaObject===null){
        console.log("NOTHING IN ARENA, SKIPPING"); // Skip if nothing is in the arena
        return;
    }

    submitButtonDiv.style.opacity=0; // Transition the camera to the arena
    gsap.to(camera.position, {
        x: camArenaLocation.x, 
        y: camArenaLocation.y, 
        z: camArenaLocation.z,
        duration:4,
        onUpdate: function(){
            camera.lookAt(camArenaLookAt);
        }
    });

    generateEnemyChoice(); // Generate the enemy's choice
}

let enemyObject;

function generateEnemyChoice(){
    let choices = ["rock", "paperStack", "scissor"];
    let choice;
    let name = arenaObject.name;

    if (difficulty === "easy"){ // Use difficulty to bias the enemy's choice
        let n = choices.indexOf(winDict[name]) // Get the index of the winning choice
        choice = generateBiasedNumber(n); // Generate a biased number biased towards the winning choice
    } else if (difficulty === "medium"){
        choice = Math.round(Math.random()*2); // Generate a 100% random, no bias, number
    } else if (difficulty === "hard"){
        let n = choices.indexOf(loseDict[name]); // Get the index of the losing choice
        choice = generateBiasedNumber(n); // Generate a biased number biased towards the losing choice
    }
    
    let enemyChoice = choices[choice];
    
    // Clone the object based on the enemy's choice
    if (enemyChoice === "rock"){
        enemyObject = SkeletonUtils.clone(rock);
    } else if (enemyChoice === "paperStack"){
        enemyObject = SkeletonUtils.clone(paperStack);  
    } else if (enemyChoice === "scissor"){
        enemyObject = SkeletonUtils.clone(scissor);
    } else {
        console.log("magic happened");
    }

    console.log("Enemy Chose: ", enemyChoice);

    // number interpolation for the enemy to move to the arena
    if (enemyChoice!=="scissor"){
        enemyObject.position.set(25, 5, 0);
        scene.add(enemyObject);
        isEnemyDescending = true;
        console.log(enemyObject.name);
        let enemyObjectTween = new TWEEN.Tween({x:25, y:5, z:0})
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
    } else {
        console.log("scissor");
        isEnemyDescending = true;
        enemyObject.position.set(25, 5, 6.5);
        enemyObject.rotateY(Math.PI);
        // enemyObject.name = "scissorEnemy";
        scene.add(enemyObject);

        let enemyObjectTween = new TWEEN.Tween({x:25, y:5, z:6.5})
        .to({x:25, y:0, z:6.5}, 3000)
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

// Function to handle the fighting in the arena
async function arenaFightHandler(){
    let userChoice = arenaObject.name;
    let enemyChoice = enemyObject.name;

    // Coordinates for the objects to move to according t the situation
    let enemyPos = {x:25, y:0, z:0};
    let enemyArenaPos = {x:20, y:0, z:0};
    let enemyFadePos = {x:20, y:-120, z:0}
    let userPos = {x:10, y:0, z:0};
    let userArenaPos = {x:20, y:0, z:0};
    let userFadePos = {x:20, y:-120, z:0};
    
    if (enemyChoice === "scissor") {
        enemyPos = {x:25, y:0, z:6.5};
        enemyArenaPos = {x:20, y:0, z:6.5};
        enemyFadePos = {x:20, y:-120, z:6.5};
    }

    if (userChoice === "scissor"){
        userPos = {x:8.5, y:0, z:-6.8};
        userArenaPos = {x:13.5, y:0, z:-6.8};
        userFadePos = {x:13.5, y:-120, z:-6.8};
    }

    if (userChoice === "paperStack"){ 
        userPos = {x:10, y:0, z:0};
        userArenaPos = {x:17, y:0, z:0};
        userFadePos = {x:17, y:-120, z:0};
    }

    if (userChoice === "rock" ){
        userPos = {x:10, y:0, z:0};
        userArenaPos = {x:16, y:0, z:0};
        userFadePos = {x:16, y:-120, z:0};
    }

    // Wait for movements to finish
    if (rockMovingFlag){
        await waitForTween("rock");
    } else if (paperMovingFlag){
        await waitForTween("paper");
    } else if (scissorMovingFlag){
        await waitForTween("scissor");
    }

    // Set the emojis for the choices
    let enemyEmoji = "";

    if (enemyChoice === "rock"){
        enemyEmoji = rockEmoji;
    } else if (enemyChoice === "paperStack"){
        enemyEmoji = paperEmoji;
    } else if (enemyChoice === "scissor"){
        enemyEmoji = scissorEmoji;
    }

    let userEmoji = "";

    if (userChoice === "rock"){
        userEmoji = rockEmoji;
    } else if (userChoice === "paperStack"){
        userEmoji = paperEmoji;
    } else if (userChoice === "scissor"){
        userEmoji = scissorEmoji;
    }
    
    await waitForTween("enemy");

    // Handle the fight
    if (userChoice === enemyChoice){
        console.log("TIE");
        userStatus = "tie";

        // Set the message bar to show the result
        messageBar.style.backgroundColor = "#74c7ec";
        messageBarText.innerHTML = "You Tied, Computer's Choice: " + enemyEmoji + " Your choice: " + userEmoji;
        messageBar.style.opacity = 1;
        setTimeout(()=>{
            messageBar.style.opacity = 0;
        }, 3000);

        // Interpolate the objects to move 
        let userTween = new TWEEN.Tween(userPos)
        .to(userArenaPos, 2000)
        .easing(TWEEN.Easing.Bounce.Out)
        .onUpdate(function(obj){
            arenaObject.position.set(obj.x, obj.y, obj.z);
        });
        
        let enemyTween = new TWEEN.Tween(enemyPos)
        .to(enemyArenaPos, 2000)
        .easing(TWEEN.Easing.Bounce.Out)
        .onUpdate(function(obj){
            enemyObject.position.set(obj.x, obj.y, obj.z);
        });

        let userFadeTween = new TWEEN.Tween(userArenaPos)
        .to(userFadePos, 2000)
        .easing(TWEEN.Easing.Quadratic.InOut)
        .onUpdate(function(obj){
            arenaObject.position.set(obj.x, obj.y, obj.z);
        });

        let enemeyFadeTween = new TWEEN.Tween(enemyArenaPos)
        .to(enemyFadePos, 2000)
        .easing(TWEEN.Easing.Quadratic.InOut)
        .onUpdate(function(obj){
            enemyObject.position.set(obj.x, obj.y, obj.z);
        });
        
        // Chain the interpolations
        userTween.chain(userFadeTween);
        enemyTween.chain(enemeyFadeTween);

        setTimeout(()=>{
            userTween.start();
            enemyTween.start();
        }, 1000);

    } else if (
        (userChoice === 'rock' && enemyChoice === 'scissor') ||
        (userChoice === 'paperStack' && enemyChoice === 'rock') ||
        (userChoice === 'scissor' && enemyChoice === 'paperStack')
    ) {
        console.log("USER WON!");
        userStatus = "won";
        
        // Set the message bar to show the result
        messageBar.style.backgroundColor = "#a6e3a1";
        messageBarText.innerHTML = "You Won, Computer's Choice: " + enemyEmoji + " Your choice: " + userEmoji;
        messageBar.style.opacity = 1;
        setTimeout(()=>{
            messageBar.style.opacity = 0;
        }, 3000);

        // Update the score based on the difficulty
        if (difficulty === "easy"){
            score+=100;
        } else if (difficulty === "medium"){
            score+=500;
        } else if (difficulty === "hard"){
            score+=1000;
        }
        if (userChoice === "scissor"){
            action.play();
        }

        // Interpolate the objects to move
        let userTween = new TWEEN.Tween(userPos)
        .to(userArenaPos, 750)
        .easing(TWEEN.Easing.Linear.None)
        .onUpdate(function(obj){
            arenaObject.position.set(obj.x, obj.y, obj.z);
        })
        .onComplete(()=>{
            if (userChoice === "scissor"){
                action.play();
            }
        });

        let enemeyFadeTween = new TWEEN.Tween(enemyArenaPos)
        .to(enemyFadePos, 1000)
        .easing(TWEEN.Easing.Linear.None)
        .onUpdate(function(obj){
            enemyObject.position.set(obj.x, obj.y, obj.z);
        });
    
        let enemyTween = new TWEEN.Tween(enemyPos)
        .to(enemyArenaPos, 2000)
        .easing(TWEEN.Easing.Bounce.Out)
        .onUpdate(function(obj){
            enemyObject.position.set(obj.x, obj.y, obj.z);
        })
        .onComplete(()=>{
            setTimeout(()=>{
                enemeyFadeTween.start();
            }, 1000);
        });

        setTimeout(()=>{
            userTween.start();
            enemyTween.start();
        }, 1000);

        
    } else {
        console.log("USER LOST!");
        userStatus = "lost";

        // Set the message bar to show the result
        messageBar.style.backgroundColor = "#f38ba8";
        messageBarText.innerHTML = "You Lost... Computer's Choice: " + enemyEmoji + " Your choice: " + userEmoji;
        messageBar.style.opacity = 1;
        setTimeout(()=>{
            messageBar.style.opacity = 0;
        }, 3000);

        // Update the score based on the difficulty
        if (difficulty === "easy"){
            score-=10;
        } else if (difficulty === "medium"){
            score-=50;
        } else if (difficulty === "hard"){
            score-=100;
        }

        // Interpolate the objects to move
        let userFadeTween = new TWEEN.Tween(userArenaPos)
        .to(userFadePos, 2000)
        .easing(TWEEN.Easing.Quadratic.InOut)
        .onUpdate(function(obj){
            arenaObject.position.set(obj.x, obj.y, obj.z);
        });
        
        let userTween = new TWEEN.Tween(userPos)
        .to(userArenaPos, 2000)
        .easing(TWEEN.Easing.Bounce.Out)
        .onUpdate(function(obj){
            arenaObject.position.set(obj.x, obj.y, obj.z);
        })
        .onComplete(()=>{
            setTimeout(()=>{
                userFadeTween.start();
            }, 1000);
        });

        let enemyTween = new TWEEN.Tween(enemyPos)
        .to(enemyArenaPos, 750)
        .easing(TWEEN.Easing.Quadratic.InOut)
        .onUpdate(function(obj){
            enemyObject.position.set(obj.x, obj.y, obj.z);
        });

        setTimeout(()=>{
            userTween.start();
            enemyTween.start();
        }, 1000);
    }
    if (score<0){ // Set the score to 0 if it's negative
        score = 0;
    }

    // Change the function of the submit button to restart
    restart();
}

function generateBiasedNumber(biasNumber = null) {
    const mean = biasNumber !== null && biasNumber >= 0 && biasNumber <= 2 ? biasNumber : 1; // Get the mean from the bias number
    const stdDev = 0.5; 
  
    // Function to generate a random number from a Guassian distribution
    function randomGaussian(mean, stdDev) {
      let u = 0,
        v = 0;
      while (u === 0) u = Math.random(); // Converting [0,1) to (0,1)
      while (v === 0) v = Math.random();
      const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
      return mean + z * stdDev;
    }
  
    let biasedValue = Math.round(randomGaussian(mean, stdDev));
    
    // Reject numbers outisde the range
    biasedValue = Math.min(Math.max(biasedValue, 0), 2);
  
    return biasedValue;
}

// Change the function of the submit button to restart
function restart(){
    submitIcon.innerHTML = "restart_alt";
    submitText.innerHTML = "Restart";
    submitButtonDiv.style.opacity=1;
    restartFlag = true;
}

 async function globalReset(){
    messageBar.style.opacity = 0;
    restartFlag = false;
    arenaFlag = false;

    // Move the objects back to their original positions
    if (userStatus === "won" || userStatus === "tie"){
        switch (arenaObject.name) {
            case "rock":
                moveRockBackFade();
                break;
            case "paperStack":
                moveBackPaperStackFade();
                break;
            case "scissor":
                moveBackScissorFade();
                break;
            default:
                break;
        }
    } else if (userStatus === "lost"){
        moveEnemyBack(enemyObject);
        switch (arenaObject.name) {
            case "rock":
                moveRockBackFade();
                break;
            case "paperStack":
                moveBackPaperStackFade();
                break;
            case "scissor":
                moveBackScissorFade();
                break;
            default:
                break;
        }
        await waitForTween("enemy");
    } 

    scene.remove(enemyObject);

    // Reset the flags
    arenaObject = null;
    enemyObject = null;
    userStatus = null;
    scissorPlayFlag = false;
    rockMovingFlag = false;
    paperMovingFlag = false;
    scissorMovingFlag=false;
    isEnemyDescending = false;
    submitIcon.innerHTML = "arrow_forward";
    submitText.innerHTML = "Select";
    submitButtonDiv.style.opacity=1;

    // Reset the camera
    gsap.to(camera.position, {
        x: -11.123218848096666, 
        y: 8.150632911308724, 
        z: 0.023543489967580447,
        duration:2,
        onUpdate: function(){
            camera.lookAt(camLookAt);
        }

    });
  }

// Move the rock back to the original position
async function moveRockBackFade(){
    if (rockMovingFlag){
        await waitForTween("rock"); 
    }
    rockMovingFlag = true;
    const rockBackTween = new TWEEN.Tween({x:20, y:-120, z:0})
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

// Move the paper back to the original position
async function moveBackPaperStackFade(){
    if (paperMovingFlag){
        await waitForTween("paper");
    }
    paperMovingFlag = true;
    const paperBackStackTween = new TWEEN.Tween({x:20, y:-120, z:0})
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

// Move the scissor back to the original position
async function moveBackScissorFade(){
    if (scissorMovingFlag){
        await waitForTween("scissor");
    }

    scissorMovingFlag = true;
    const scissorBackTween = new TWEEN.Tween({x:20, y:-120, z:0})
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

// Moves the enemy back to the fade position
async function moveEnemyBack(object) {
    await waitForTween("enemy");
    
    isEnemyDescending = true;

    let enemyPos = {x:25, y:0, z:0};
    let enemyArenaPos = {x:20, y:0, z:0};
    let enemyFadePos = {x:20, y:-120, z:0}
    
    if (object.name === "scissor") {
        enemyPos = {x:25, y:0, z:6.5};
        enemyArenaPos = {x:20, y:0, z:6.5};
        enemyFadePos = {x:20, y:-120, z:6.5};
    }

    let enemeyFadeTween = new TWEEN.Tween(enemyArenaPos)
        .to(enemyFadePos, 2000)
        .easing(TWEEN.Easing.Quadratic.InOut)
        .onUpdate(function(obj){
            object.position.set(obj.x, obj.y, obj.z);
        })
        .onComplete(()=>{
            scene.remove(object);
            isEnemyDescending = false;
        });
    
    enemeyFadeTween.start();
}

// A scrolling counter for the score board
function updateScoreBoard(){
    const target = score;
    if (counter<target){ // Increment the counter if it's less than the target
        counter++;
        scoreCounter.innerHTML = counter;
    } else if (counter>target){ // Decrement the counter if it's greater than the target
        counter--;
        scoreCounter.innerHTML = counter;
    } else { // Set the counter to the target if it's equal
        scoreCounter.innerHTML = target;
    }
}