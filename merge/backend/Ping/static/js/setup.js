import { keyState, sendKeyState } from './keys.js';
import { OrbitControls } from './OrbitControls.js';
import { FontLoader } from './FontLoader.js';
import { TextGeometry } from './TextGeometry.js';
import { GLTFLoader } from './GLTFLoader.js';
import { OBJLoader } from './OBJLoader.js';
import { MTLLoader } from './MTLLoader.js';

// import { OBJLoader } from "https://cdn.jsdelivr.net/npm/three@0.135.0/examples/js/loaders/OBJLoader.js";
// import { MTLLoader } from "https://cdn.jsdelivr.net/npm/three@0.135.0/examples/js/loaders/MTLLoader.js";

let send = false;

const gameSocket = new WebSocket('ws://127.0.0.1:8000/ws/pong/');
let width = window.innerWidth;
let height = window.innerHeight;

let score1 = 0;
let score2 = 0;
let changeScore = false;

gameSocket.onopen = function (e) {
    console.log('WebSocket connection established');
    // Get the window width and height
    gameSocket.send(JSON.stringify({ width, height }));
};

gameSocket.onmessage = function (e) {
    const data = JSON.parse(e.data);
    // console.log('Received message:', data);
    updateGameState(data);
};

gameSocket.onclose = function (e) {
    console.error('WebSocket connection closed:', e);
};


var renderer = new THREE.WebGLRenderer({alpha: true});

// Add FPS Stats
const stats = new Stats();
stats.showPanel(0); // 0: FPS, 1: MS, 2: MB
document.body.appendChild(stats.dom);
			
var planQuality = 10;
var planWidth = window.innerWidth / 20.0;
var planHeight = planWidth / 2;

// Create a camera to see the scene
var fov = 60;  // Field of view in degrees
var aspect = window.innerWidth / window.innerHeight;  // Aspect ratio of the display
var near = 0.1;  // Near clipping plane
var far = 1000;  // Far clipping plane
var camera = new THREE.PerspectiveCamera( fov, aspect, near, far );

// for mouse coordinates
let isRightMouseDown = false;
let prevMouseX = 0;
let prevMouseY = 0;

var scene = new THREE.Scene();

var paddleWidth = planWidth / 100;
var paddleHeight = planHeight / 7;
var paddleDepth = 0.9;
var paddleQuality = 1;
var paddle1 = new THREE.Mesh(
    new THREE.BoxGeometry(paddleWidth, paddleHeight, paddleDepth, paddleQuality, paddleQuality, paddleQuality),
    new THREE.MeshLambertMaterial({color: 0x0000CC})
);
var paddle2 = new THREE.Mesh(
    new THREE.BoxGeometry(paddleWidth, paddleHeight, paddleDepth, paddleQuality, paddleQuality, paddleQuality),
    new THREE.MeshLambertMaterial({color: 0xCC0000})
);

// scene.add(paddle1);
// scene.add(paddle2);

paddle1.position.set(-(planWidth * 0.90) / 2, 0, paddleDepth);
paddle2.position.set((planWidth * 0.90) / 2, 0, paddleDepth);

// create the sphere's material
var sphereMaterial = new THREE.MeshLambertMaterial( { color: 0xCC0000 } );

// Create a sphere geometry
var sphereGeometry = new THREE.SphereGeometry(planWidth / 80, 6, 20);

var ball = new THREE.Mesh(sphereGeometry, sphereMaterial);

ball.position.z = 2;

// scene.add(ball);

renderer.setSize( window.innerWidth, window.innerHeight );

var canva = document.getElementById('gameCanvas');
canva.appendChild( renderer.domElement );


// Set the camera position
camera.position.x = -7.038951541088027
camera.position.y = -7.588416122072658e-14
camera.position.z = 3.586524947942372

// Create a point light
var light = new THREE.PointLight(0xffffff);
light.position.set(0, 0, 50);
scene.add(light);
const pointLightHelper = new THREE.PointLightHelper( light, 1 );
scene.add( pointLightHelper );

// light below the table
var lightB = new THREE.PointLight(0xffffff);
lightB.position.set(0, 0, -20);
scene.add(lightB);
const pointLightBHelper = new THREE.PointLightHelper( lightB, 1 );
scene.add( pointLightBHelper );

console.log ("Width: " + window.innerWidth + " Height: " + window.innerHeight);
// var plan = new THREE.Mesh(
//     new THREE.PlaneGeometry(planWidth * 0.95, planHeight, 0, 0),
//     new THREE.MeshLambertMaterial({color: 0x00CC00})
// );
// plan.position.set(0, 0, 0);

// scene.add(plan);

//////////////////////////////////////////////////////////////////////////////////////////
// Table top
var tableTopMaterial = new THREE.MeshLambertMaterial({ color: 0x005323 }); // Greenish material for the table
var tableTopGeometry = new THREE.BoxGeometry(planWidth, planHeight, 1); // Make it a box for thickness
var tableTop = new THREE.Mesh(tableTopGeometry, tableTopMaterial);
tableTop.position.set(0, 0, 0); // Adjust position if needed
// scene.add(tableTop);

// Table borders
var borderMaterial = new THREE.MeshLambertMaterial({ color: 0x654321 }); // Brown for the borders
var borderWidth = 1; // Border thickness
var borderHeight = 2; // Border height above the table

var topBorder = new THREE.Mesh(
    new THREE.BoxGeometry(planWidth, borderWidth, borderHeight),
    borderMaterial
);
topBorder.position.set(0, planHeight / 2 + borderWidth / 2, 0);

var bottomBorder = new THREE.Mesh(
    new THREE.BoxGeometry(planWidth, borderWidth, borderHeight),
    borderMaterial
);
bottomBorder.position.set(0, -planHeight / 2 - borderWidth / 2, 0);

var leftBorder = new THREE.Mesh(
    new THREE.BoxGeometry(borderWidth, planHeight + borderWidth * 2, borderHeight),
    borderMaterial
);
leftBorder.position.set(-planWidth / 2 - borderWidth / 2, 0, 0);

var rightBorder = new THREE.Mesh(
    new THREE.BoxGeometry(borderWidth, planHeight + borderWidth * 2, borderHeight),
    borderMaterial
);
rightBorder.position.set(planWidth / 2 + borderWidth / 2, 0, 0);
// scene.add(topBorder, bottomBorder, leftBorder, rightBorder);

// Table legs
var legMaterial = new THREE.MeshLambertMaterial({ color: 0x654321 }); // Same color as borders
var legWidth = 1.5; // Thickness of the legs
var legDepth = 15; // Depth of the legs
var legHeight = 1.5; // Height of the legs to raise the table above the ground

// Create each leg and position them under the table
var leg1 = new THREE.Mesh(new THREE.BoxGeometry(legWidth, legHeight, legDepth), legMaterial);
leg1.position.set(-planWidth * 0.95 / 2 + legWidth, -planHeight / 2 + legWidth, -legDepth / 2); // Bottom left

var leg2 = leg1.clone();
leg2.position.set(planWidth * 0.95 / 2 - legWidth, -planHeight / 2 + legWidth, -legDepth / 2); // Bottom right

var leg3 = leg1.clone();
leg3.position.set(-planWidth * 0.95 / 2 + legWidth, planHeight / 2 - legWidth, -legDepth / 2); // Top left

var leg4 = leg1.clone();
leg4.position.set(planWidth * 0.95 / 2 - legWidth, planHeight / 2 - legWidth, -legDepth / 2); // Top right

// Add legs to the scene
// scene.add(leg1, leg2, leg3, leg4);
//////////////////////////////////////////////////////////////////////////////////////////

// Get the dimensions of an object
function getScaledDimensions(object) {
    // Ensure the object has geometry
    if (!object.geometry) {
        console.error('Object does not have geometry.');
        return { width: 0, height: 0, depth: 0 };
    }

    // Compute bounding box if not already computed
    object.geometry.computeBoundingBox();

    // Get the bounding box dimensions
    const boundingBox = object.geometry.boundingBox;
    const originalWidth = boundingBox.max.x - boundingBox.min.x;
    const originalHeight = boundingBox.max.y - boundingBox.min.y;
    const originalDepth = boundingBox.max.z - boundingBox.min.z;

    // Scale the dimensions
    const width = originalWidth * object.scale.x;
    const height = originalHeight * object.scale.y;
    const depth = originalDepth * object.scale.z;

    return { width, height, depth };
}


// // Creating paddles
// paddle1.position.x = -(planWidth * 0.95) / 2;
// paddle2.position.x = (planWidth * 0.95) / 2;
// paddle1.position.z = paddleDepth + 1;
// paddle2.position.z = paddleDepth + 1;
// paddle1.position.y = 0;
// paddle2.position.y = 0;


// Create a pivot to rotate the camera around the plan
const pivot = new THREE.Object3D();
pivot.position.copy(tableTop.position); // Set pivot at the plan's position
scene.add(pivot); // Add the pivot to the scene

// Attach the camera to the pivot
pivot.add(camera);

const gameGroup = new THREE.Group();
scene.add(gameGroup);

// Create a plane to serve as the ground
function onWindowResize() {
    // return;
    console.log("Resizing");
    console.log("Width: " + window.innerWidth + " Height: " + window.innerHeight);

    // Update camera aspect and renderer size
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    return;
    // gameGroup.scale.set(0.1, 0.1, 0.1)
    // let demonsions = getScaledDimensions(tableTop);
    // Notify backend of window resize
    if (gameSocket.readyState === WebSocket.OPEN) {
        const message = {
            type: "resize",
            data: {
                width: window.innerWidth,
                height: window.innerHeight,
                // planWidth: demonsions.width,
                // planHeight: demonsions.height,
            },
        };
        
        // Send resize event with positions
        gameSocket.send(JSON.stringify(message));
        console.log("Sending resize event");
        // console.log ("demo width: " + demonsions.width + " demo height: " + demonsions.height)
    }
    let scale_width = window.innerWidth / width
    let scale_height = window.innerHeight / height

    width = window.innerWidth
    height = window.innerHeight
    planWidth = window.innerWidth / 20.0
    planHeight = planWidth / 2

    paddleWidth = planWidth / 100;
    paddleHeight = planHeight / 7;

    // paddle1.scale.set(scale_width, scale_height, 1)
    // paddle2.scale.set(scale_width, scale_height, 1)
    // gameGroup.remove(paddle1)
    // gameGroup.remove(paddle2)
    // paddle1.remove()
    // paddle2.remove()
    // paddle1 = new THREE.Mesh(
    //     new THREE.BoxGeometry(paddleWidth, paddleHeight, paddleDepth, paddleQuality, paddleQuality, paddleQuality),
    //     new THREE.MeshLambertMaterial({color: 0x0000CC})
    // );
    // paddle2 = new THREE.Mesh(
    //     new THREE.BoxGeometry(paddleWidth, paddleHeight, paddleDepth, paddleQuality, paddleQuality, paddleQuality),
    //     new THREE.MeshLambertMaterial({color: 0xCC0000})
    // );
    // // scene.add(paddle1)
    // // scene.add(paddle2)

    // gameGroup.remove(plan)
    // plan.remove()
    // plan = new THREE.Mesh(
    //     new THREE.PlaneGeometry(planWidth * 0.95, planHeight, 0, 0),
    //     new THREE.MeshLambertMaterial({color: 0x00CC00})
    // );
    // // scene.add(plan);

    // gameGroup.remove(ball)
    // ball.remove()
    // sphereGeometry = new THREE.SphereGeometry(planWidth / 80, 6, 20);
    // ball = new THREE.Mesh(sphereGeometry, sphereMaterial)
    // // scene.add(ball)

    // gameGroup.remove(tableTop)
    // tableTop.remove()
    // tableTopGeometry = new THREE.BoxGeometry(planWidth, planHeight, 1);
    // tableTop = new THREE.Mesh(tableTopGeometry, tableTopMaterial)
    
    // borderHeight = 2
    // borderWidth = 1
    // legWidth = 1.5
    // legDepth = 15
    // legHeight = 1.5


    // gameGroup.remove(topBorder)
    // topBorder.remove()
    // gameGroup.remove(bottomBorder)
    // bottomBorder.remove()
    // gameGroup.remove(leftBorder)
    // leftBorder.remove()
    // gameGroup.remove(rightBorder)
    // rightBorder.remove()
    // topBorder = new THREE.Mesh(
    //     new THREE.BoxGeometry(planWidth, borderWidth, borderHeight),
    //     borderMaterial
    // );
    // bottomBorder = new THREE.Mesh(
    //     new THREE.BoxGeometry(planWidth, borderWidth, borderHeight),
    //     borderMaterial
    // );
    // leftBorder = new THREE.Mesh(
    //     new THREE.BoxGeometry(borderWidth, planHeight + borderWidth * 2, borderHeight),
    //     borderMaterial
    // );
    // rightBorder = new THREE.Mesh(
    //     new THREE.BoxGeometry(borderWidth, planHeight + borderWidth * 2, borderHeight),
    //     borderMaterial
    // );


    // // scene.add(topBorder, bottomBorder, leftBorder, rightBorder);

    // gameGroup.remove(leg1)
    // leg1.remove()
    // gameGroup.remove(leg2)
    // leg2.remove()
    // gameGroup.remove(leg3)
    // leg3.remove()
    // gameGroup.remove(leg4)
    // leg4.remove()
    // leg1 = new THREE.Mesh(new THREE.BoxGeometry(legWidth, legHeight, legDepth), legMaterial);
    // leg2 = leg1.clone();
    // leg3 = leg1.clone();
    // leg4 = leg1.clone();
    // // Add legs to the scene
    // // scene.add(leg1, leg2, leg3, leg4);



    // gameGroup.add(paddle1);
    // gameGroup.add(paddle2);
    // gameGroup.add(ball);
    // gameGroup.add(plan);
    // gameGroup.add(tableTop);
    // gameGroup.add(topBorder, bottomBorder, leftBorder, rightBorder);
    // gameGroup.add(leg1, leg2, leg3, leg4);

    // gameGroup.scale.set(scale_width, scale_height, 1)

    console.log("Resized");
    const table = gameGroup.getObjectByName('tableTop'); // Assuming the table has a name
    // const newTableDimensions = getScaledDimensions(table);



    table.remove();
    // console.log("Resizing table to: " + newTableDimensions.width + " " + newTableDimensions.height);



    gameGroup.scale.set(0.1, 0.1, 0.1);
}



function updateGameState(data) {
    // return;
    // Update paddle 1 position
    // console.log("Updating game state: " + data.paddle1_x + " " + data.paddle1_y)
    paddle1.position.x = data.paddle1_x;
    paddle1.position.y = data.paddle1_y;

    // Update paddle 2 position
    paddle2.position.x = data.paddle2_x;
    paddle2.position.y = data.paddle2_y;

    // Update ball position
    ball.position.x = data.ball_x;
    ball.position.y = data.ball_y;

    // Update scores
    if (data.score1 !== score1) {
        score1 = data.score1;
        changeScore = true;
    }
    if (data.score2 !== score2) {
        score2 = data.score2;
        changeScore = true;
    }

    // Call the function again to update the game state
}

let moving = {
    up: false,
    down: false,
    left: false,
    right: false,
    zoomin: false,
    zoomout: false,
    reset: false
};

let cameraDistance = Math.sqrt(camera.position.x**2 + camera.position.y**2 + camera.position.z**2);
let theta = Math.acos(camera.position.z/cameraDistance);
let phi = Math.atan2(camera.position.y, camera.position.x);




// add paritcles
// Particle geometry
const particleCount = 50000; // Number of particles
const geometry = new THREE.BufferGeometry();
const positions = new Float32Array(particleCount * 3); // x, y, z for each particle

for (let i = 0; i < particleCount; i++) {
  positions[i * 3 + 0] = (Math.random() - 0.5) * 500; // x
  positions[i * 3 + 1] = (Math.random() - 0.5) * 500; // y
  positions[i * 3 + 2] = (Math.random() - 0.5) * 500; // z
}

geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

// Particle material
const material = new THREE.PointsMaterial({
  color: 0xffffff, // White particles
  size: 0.1,       // Smaller size for dust-like appearance
  transparent: true,
  opacity: 0.7,
});

// Create particle system
const particles = new THREE.Points(geometry, material);
scene.add(particles);

// Add orbit controls
var controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;       // Smooth the movements
controls.dampingFactor = 0.25;      // Adjust damping
controls.rotateSpeed = 0.35;       // Reverse the rotation speed
controls.autoRotate = false;         // Enable auto rotation
controls.autoRotateSpeed = 0.5;     // Speed of auto rotation
controls.minDistance = 10;          // Minimum zoom distance
controls.maxDistance = 1000;        // Maximum zoom distance
controls.screenSpacePanning = true; // Allow panning
controls.enableZoom = false;        // Disable zoom

// revers mouse click to rotate
controls.mouseButtons = {
    LEFT: THREE.MOUSE.RIGHT,
    // MIDDLE: THREE.MOUSE.MIDDLE,
    RIGHT: THREE.MOUSE.LEFT
};

// Ensure the target is correct
controls.target.set(0, 0, 0);
controls.update();


// add object for the table



// // Load the .obj model (replace 'path/to/your/model.obj' with the actual path to your .obj file)
// const loader = new OBJLoader();
// loader.load(
//     '../untitled.obj',  // Path to your .obj file
//     function (object) {
//         // Set position of the model (e.g., replace your table position here)
//         object.position.set(0, 0, -10);
        
//         // Optionally, scale or rotate the model
//         object.scale.set(20, 20, 20);  // Adjust scale if necessary
//         object.rotation.set(Math.PI / 2, 0 , 0);  // Optional rotation
//         object.color = 0x00CC00;

//         gameGroup.add(object);  // Add the model to the scene
//     },
//     function (xhr) {
//         console.log((xhr.loaded / xhr.total * 100) + '% loaded');  // Progress callback
//     },
//     function (error) {
//         console.log('An error happened while loading the model:', error);  // Error callback
//     }
// );

// const mtlLoader = new MTLLoader();
// mtlLoader.load('../untitled.mtl', function (materials) {
//     materials.preload();  // Preload materials
//     loader.setMaterials(materials);  // Apply materials to the model
//     loader.load('../untitled.obj', function (object) {
//         gameGroup.add(object);
//     });
// });

// Add a grid helper to the scene
const gridHelper = new THREE.GridHelper(100, 100);
scene.add(gridHelper);

// Add an axis helper to the scene
const axisHelper = new THREE.AxesHelper(100);
scene.add(axisHelper);

gameGroup.add(paddle1);
gameGroup.add(paddle2);
gameGroup.add(ball);
gameGroup.add(tableTop);
gameGroup.add(topBorder);
gameGroup.add(bottomBorder);
gameGroup.add(leftBorder);
gameGroup.add(rightBorder);
gameGroup.add(leg1);
gameGroup.add(leg2);
gameGroup.add(leg3);
gameGroup.add(leg4);


// Load the .gltf .glb model
const loader = new GLTFLoader();
loader.load(
    '/static/obj/day_6_video_game.glb',
    function (gltf) {
        const model = gltf.scene;
        model.position.set(0, 0, 2);
        model.scale.set(0.1, 0.1, 0.1);
        model.rotation.set(Math.PI / 2, 0, 0);
        scene.add(model);
    },
    undefined,
    function (error) {
        console.error('An error occurred:', error);
    }
);



console.log("tableWeight: " + planWidth + " tableHeight: " + planHeight)
console.log("Adding gameGroup")

gameGroup.scale.set(0.1, 0.1, 0.1);


// Load the font
const fontLoader = new THREE.FontLoader();
fontLoader.load('https://threejs.org/examples/fonts/helvetiker_regular.typeface.json', function (font) {
    const createScoreText = (text, position) => {
        const textGeometry = new TextGeometry(text, {
            font: font,
            size: 2, // Adjust size
            height: 0.5, // Thickness of the text
        });
        const textMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const scoreText = new THREE.Mesh(textGeometry, textMaterial);
        scoreText.position.set(position.x, position.y, position.z);
        return scoreText;
    };

    // Create score texts for paddles
    const paddle1Score = createScoreText('0', { x: -10, y: 10, z: 0 });
    const paddle2Score = createScoreText('0', { x: 10, y: 10, z: 0 });

    // Add to the scene
    gameGroup.add(paddle1Score);
    gameGroup.add(paddle2Score);

    paddle1Score.position.copy(paddle1.position);
    paddle2Score.position.copy(paddle2.position);

    // Update scores dynamically
    window.updateScore = function (paddle, score) {
        const textGeometry = new TextGeometry(score.toString(), {
            font: font,
            size: 2,
            height: 0.5,
        });

        if (paddle === 1) {
            paddle1Score.geometry.dispose(); // Clean up old geometry
            paddle1Score.geometry = textGeometry;
        } else if (paddle === 2) {
            paddle2Score.geometry.dispose();
            paddle2Score.geometry = textGeometry;
        }
    }

    // Example of updating scores
    updateScore(1, score1); // Paddle 1 gets 5 points
    updateScore(2, score2); // Paddle 2 gets 3 points
    console.log("Adding scores")
});




export function draw()
{
    // Add event listeners to update key states
    window.addEventListener('keydown', (event) => {
        switch (event.code) {
            case 'KeyA': if (keyState.UpKey1 == false) send = true; keyState.UpKey1 = true; break;
            case 'KeyD': if (keyState.DownKey1 == false) send = true; keyState.DownKey1 = true; break;
            case 'KeyS': if (keyState.LeftKey1 == false) send = true; keyState.LeftKey1 = true; break;
            case 'KeyW': if (keyState.RightKey1 == false) send = true; keyState.RightKey1 = true; break;
            case 'ArrowUp': if (keyState.UpKey2 == false) send = true; keyState.UpKey2 = true; break;
            case 'ArrowDown': if (keyState.DownKey2 == false) send = true; keyState.DownKey2 = true; break;
            case 'ArrowLeft': if (keyState.LeftKey2 == false) send = true; keyState.LeftKey2 = true; break;
            case 'ArrowRight': if (keyState.RightKey2 == false) send = true; keyState.RightKey2 = true; break;
        }
        if (gameSocket.readyState === WebSocket.OPEN && send)
        {
            gameSocket.send(JSON.stringify(keyState));
            send = false;
        }

    });

    window.addEventListener('keyup', (event) => {
        switch (event.code) {
            case 'KeyA': if (keyState.UpKey1 == true) send = true; keyState.UpKey1 = false; break;
            case 'KeyD': if (keyState.DownKey1 == true) send = true; keyState.DownKey1 = false; break;
            case 'KeyS': if (keyState.LeftKey1 == true) send = true; keyState.LeftKey1 = false; break;
            case 'KeyW': if (keyState.RightKey1 == true) send = true; keyState.RightKey1 = false; break;
            case 'ArrowUp': if (keyState.UpKey2 == true) send = true; keyState.UpKey2 = false; break;
            case 'ArrowDown': if (keyState.DownKey2 == true) send = true; keyState.DownKey2 = false; break;
            case 'ArrowLeft': if (keyState.LeftKey2 == true) send = true; keyState.LeftKey2 = false; break;
            case 'ArrowRight': if (keyState.RightKey2 == true) send = true; keyState.RightKey2 = false; break;
        }
        if (gameSocket.readyState === WebSocket.OPEN && send)
        {
            gameSocket.send(JSON.stringify(keyState));
            send = false;
        }
    });

    // Scroll wheel to zoom in/out
    document.addEventListener('wheel', (event) => {
        const zoomSpeed = 1;
        cameraDistance = camera.position.distanceTo(pivot.position) + event.deltaY * zoomSpeed * 0.0001;// Update camera distance

        camera.position.x = cameraDistance * Math.sin(theta) * Math.cos(phi);
        camera.position.y = cameraDistance * Math.sin(theta) * Math.sin(phi);
        camera.position.z = cameraDistance * Math.cos(theta);
    });

    // // // Right-click and drag to pan the camera
    // // document.addEventListener('mousedown', (event) => {
    // //     if (event.button === 2) {  // Right-click button
    // //         isRightMouseDown = true;
    // //         prevMouseX = event.clientX;
    // //         prevMouseY = event.clientY;
    // //     }
    // // });

    // // document.addEventListener('mouseup', (event) => {
    // //     if (event.button === 2) {
    // //         isRightMouseDown = false;
    // //     }
    // // });

    // // document.addEventListener("mousemove", (event) => {
    // //     if (isRightMouseDown) {
    // //         const sensitivity = 0.01;
    // //         const deltaX = event.clientX - prevMouseX;
    // //         const deltaY = event.clientY - prevMouseY;
    // //         phi += deltaX * sensitivity;
    // //         theta += deltaY * sensitivity;
    // //         theta = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, theta)); // Clamp vertical angle
    // //         prevMouseX = event.clientX;
    // //         prevMouseY = event.clientY;
    // //     }
    // // });

    // ///////////////
    // Arrow Button Click Event Listeners
    document.getElementById("up-arrow").addEventListener("mousedown", () => {
        moving.up = true;
    });
    document.getElementById("down-arrow").addEventListener("mousedown", () => {
        moving.down = true;
    });
    document.getElementById("left-arrow").addEventListener("mousedown", () => {
        moving.left = true;
    });
    document.getElementById("right-arrow").addEventListener("mousedown", () => {
        moving.right = true;
    });
    document.getElementById("zoom-in").addEventListener("mousedown", () => {
        moving.zoomin = true;
    });
    document.getElementById("zoom-out").addEventListener("mousedown", () => {
        moving.zoomout = true;
    });
    document.getElementById("reset").addEventListener("mousedown", () => {
        camera.position.x = -7.038951541088027
        camera.position.y = -7.588416122072658e-14
        camera.position.z = 3.586524947942372
        cameraDistance = Math.sqrt(camera.position.x**2 + camera.position.y**2 + camera.position.z**2);
        reset = false;
    });
    

    // Stop movement on mouse up
    document.addEventListener("mouseup", () => {
        moving.up = false;
        moving.down = false;
        moving.left = false;
        moving.right = false;
        moving.zoomin = false;
        moving.zoomout = false;
    });

    if (moving.up) {
        theta -= Math.PI / 180;
        camera.position.x = cameraDistance * Math.sin(theta) * Math.cos(phi);
        camera.position.y = cameraDistance * Math.sin(theta) * Math.sin(phi);
        camera.position.z = cameraDistance * Math.cos(theta);
        //camera.lookAt(0, 0, 0);
    }
    if (moving.down) {
        theta += Math.PI / 180;
        camera.position.x = cameraDistance * Math.sin(theta) * Math.cos(phi);
        camera.position.y = cameraDistance * Math.sin(theta) * Math.sin(phi);
        camera.position.z = cameraDistance * Math.cos(theta);
        //camera.lookAt(0, 0, 0);
    }
    if (moving.left) {
        phi -= Math.PI / 180;
        camera.position.x = cameraDistance * Math.sin(theta) * Math.cos(phi);
        camera.position.y = cameraDistance * Math.sin(theta) * Math.sin(phi);
        camera.position.z = cameraDistance * Math.cos(theta);
        //camera.lookAt(0, 0, 0);
    }
    if (moving.right) {
        phi += Math.PI / 180;
        camera.position.x = cameraDistance * Math.sin(theta) * Math.cos(phi);
        camera.position.y = cameraDistance * Math.sin(theta) * Math.sin(phi);
        camera.position.z = cameraDistance * Math.cos(theta);
        //camera.lookAt(0, 0, 0);
    }
    if (moving.zoomin) {
        cameraDistance -= 0.1;
        camera.position.x = cameraDistance * Math.sin(theta) * Math.cos(phi);
        camera.position.y = cameraDistance * Math.sin(theta) * Math.sin(phi);
        camera.position.z = cameraDistance * Math.cos(theta);
        //camera.lookAt(0, 0, 0);
    }
    if (moving.zoomout) {
        cameraDistance += 0.1;
        camera.position.x = cameraDistance * Math.sin(theta) * Math.cos(phi);
        camera.position.y = cameraDistance * Math.sin(theta) * Math.sin(phi);
        camera.position.z = cameraDistance * Math.cos(theta);
        //camera.lookAt(0, 0, 0);
    }

    camera.up.copy(new THREE.Vector3(0, 0, 1)); 
    camera.lookAt(0, 0, 0);
    controls.target.set(ball.position.x, ball.position.y, ball.position.z);

    // Prevent context menu from appearing on right-click
    document.addEventListener('contextmenu', (event) => event.preventDefault());

    window.addEventListener('resize', onWindowResize);

    // add fps status
    stats.update();

    if (changeScore == true) {
        updateScore(1, score1);
        updateScore(2, score2);
        changeScore = false;
    }

    renderer.render(scene, camera);

    cameraDistance = Math.sqrt(camera.position.x**2 + camera.position.y**2 + camera.position.z**2);
    theta = Math.acos(camera.position.z/cameraDistance);
    phi = Math.atan2(camera.position.y, camera.position.x);

    // if (gameSocket.readyState === WebSocket.OPEN)
    //     gameSocket.send(JSON.stringify(keyState));

    requestAnimationFrame(draw);
    
}