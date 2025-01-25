import { LoaderUtils } from "./LoaderUtils.js";
import { LoadingManager } from "./LoadingManager.js";
import { GLTFLoader } from "./GLTFLoader.js";
import { OrbitControls } from "./OrbitControls.js";
import { keyState, sendKeyState } from './keys.js';
import { FontLoader } from './FontLoader.js';
import { TextGeometry } from './TextGeometry.js';
import { username } from "../../js/main.js";

// Remember that the (x, z) plane is the (x, y) plane in the 3D world

class Demonsions {
    constructor() {
        this.table_x = 0;

        this.table_z = 0;
        this.table_width = 0.1;
        this.table_height = 0.2;
        this.player_width = 0.015;
        this.player_height = 0.002;
        this.player_depth = 0.002;
        this.ball_radius = 0.002;
        this.left_border_x = this.table_x - this.table_width / 2;
        this.right_border_x = this.table_x + this.table_width / 2;
        this.top_border_z = this.table_z + this.table_height / 2;
        this.bottom_border_z = this.table_z - this.table_height / 2;
        this.border_thickness = 0.002;
        this.leg_width = 0.008;
        this.leg_height = Math.abs(this.top_border_z - this.bottom_border_z) / 4;
        this.leg_depth = this.leg_width;

        // ball and player speed
        this.player_speed = this.player_height * 0.7;
        this.ball_speed  = this.player_speed * 2;
    }
}

let demonsions = new Demonsions;

// initialize the width and height of the scene
let width = window.innerWidth;
let height = window.innerHeight;

function onWindowResize2(camera, renderer) {
    // return;
    console.log("Resizing");
    console.log("Width: " + window.innerWidth + " Height: " + window.innerHeight);

    // // Update camera aspect and renderer size
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}


function cleanGroup(group) {
    // Iterate over each child in the group
    while (group.children.length > 0) {
        const child = group.children[0]; // Get the first child

        // Remove the child from the group
        group.remove(child);

        // Dispose of the geometry if present
        if (child.geometry) {
            child.geometry.dispose();
        }

        // Dispose of the material if present
        if (child.material) {
            // If the material is an array (e.g., for multi-material objects)
            if (Array.isArray(child.material)) {
                child.material.forEach((material) => material.dispose());
            } else {
                child.material.dispose();
            }
        }

        // Dispose of textures if present in the material
        if (child.material && child.material.map) {
            child.material.map.dispose();
        }
    }
}


// class Player {
//     constructor(group, demonsions, x, z, y, color) {
//         this.geometry = new THREE.BoxGeometry(demonsions.player_width, demonsions.player_height, demonsions.player_depth);
//         this.material = new THREE.MeshBasicMaterial({ color: color });
//         this.mesh = new THREE.Mesh(this.geometry, this.material);
//         this.mesh.position.x = x;
//         this.mesh.position.z = z;
//         group.add(this.mesh);
        
//         // Set up the player's position
//         this.x = x;
//         this.z = z;
//         this.y = y;
//         this.mesh.position.y = this.y;
        
//         // Set up the player's velocity
//         this.vx = 0;
//         this.vz = 0;
//         this.vy = 0;
//         this.gravity = -0.01;
        
//         // Set up the player's score
//         this.score = 0;
//     }
// }
class Player {
    constructor(group, dimensions, x, z, y, color = 0x00ffff) {
        // Create the player geometry (cube or box)
        this.geometry = new THREE.BoxGeometry(dimensions.player_width, dimensions.player_height, dimensions.player_depth);
        
        // Create a material with emissive properties for glowing effect
        this.material = new THREE.MeshStandardMaterial({
            color: color,
            emissive: color,        // Set the glow color
            emissiveIntensity: 1,   // Set the intensity of the glow
        });

        // Create the player mesh
        this.mesh = new THREE.Mesh(this.geometry, this.material);
        this.mesh.position.set(x, y, z); // Set the player's position
        this.mesh.castShadow = true; // Enable player to cast shadows
        this.mesh.receiveShadow = true; // Enable player to receive shadows
        group.add(this.mesh);

        // Create a PointLight attached to the player (light source)
        this.light = new THREE.PointLight(color, 1, 50); // Color, intensity, range
        this.light.position.copy(this.mesh.position); // Sync light position with the player
        this.light.castShadow = true; // Enable the light to cast shadows
        group.add(this.light);

        // Set up the player's position
        this.x = x;
        this.y = y;
        this.z = z;

        // Set up the player's velocity
        this.vx = 0;
        this.vz = 0;
        this.vy = 0;
        this.gravity = -0.01;

        // Set up the player's score
        this.score = 0;

        console.log("Player created with glowing effect and light source!");
    }

    // Method to update the light's position when the player moves
    updateLightPosition() {
        this.light.position.copy(this.mesh.position);
    }
}


// class Ball {
//     constructor(group, demonsions, y, color) {
//         this.geometry = new THREE.SphereGeometry(demonsions.ball_radius, 32, 32);
//         this.material = new THREE.MeshBasicMaterial({ color: color });
//         this.mesh = new THREE.Mesh(this.geometry, this.material);
//         this.mesh.position.x = demonsions.table_x;
//         this.mesh.position.z = demonsions.table_z;
//         this.mesh.position.y = y;
//         group.add(this.mesh);
        
//         // Set up the ball's position
//         this.x = demonsions.table_x;
//         this.z = demonsions.table_z;
//         this.y = y;
        
//         // Set up the ball's velocity
//         this.vx = 0;
//         this.vz = 0;
//         this.vy = 0;
//         this.gravity = -0.01;
        
//         console.log("ball created");
//     }
// }

class Ball {
    constructor(group, dimensions, y, color = 0x00ffff) {
        color = 0x00ffff;
        // Create the ball geometry
        this.geometry = new THREE.SphereGeometry(dimensions.ball_radius, 32, 32);

        // Create a material with emissive properties
        this.material = new THREE.MeshStandardMaterial({
            color: color,
            emissive: color,       // Glow color
            emissiveIntensity: 1, // Brightness of the glow
        });

        // Create the ball mesh
        this.mesh = new THREE.Mesh(this.geometry, this.material);
        this.mesh.position.set(dimensions.table_x, y, dimensions.table_z);
        this.mesh.castShadow = true; // Enable ball to cast shadows
        this.mesh.receiveShadow = true; // Enable ball to receive shadows
        group.add(this.mesh);

        // Add a PointLight attached to the ball
        this.light = new THREE.PointLight(color, 1, 50); // Color, intensity, range
        this.light.position.copy(this.mesh.position); // Sync light position with the ball
        this.light.castShadow = true; // Enable the light to cast shadows
        group.add(this.light);

        // Ball's physics properties
        this.x = dimensions.table_x;
        this.y = y;
        this.z = dimensions.table_z;

        this.vx = 0;
        this.vz = 0;
        this.vy = 0;
        this.gravity = -0.01;

        console.log("Glowing, light-emitting ball created with shadows!");
    }

    // Method to update the light's position when the ball moves
    updateLightPosition() {
        this.light.position.copy(this.mesh.position);
    }
}



// class Border {
//     constructor(group, demonsions, x, z, width, height, thickness) {
//         this.geometry = new THREE.BoxGeometry(height, thickness, width);
//         this.material = new THREE.MeshBasicMaterial({ color: 0xff00ff });
//         this.mesh = new THREE.Mesh(this.geometry, this.material);
//         this.mesh.position.x = x;
//         this.mesh.position.z = z;
//         group.add(this.mesh);
//     }
// }

class Border {
    constructor(group, dimensions, x, z, width, height, thickness) {
        // Create geometry
        this.geometry = new THREE.BoxGeometry(height, thickness, width);

        // Create materials for top and sides
        this.materialTop = new THREE.MeshStandardMaterial({ color: 0xff00ff }); // Bright top
        this.materialSides = new THREE.MeshStandardMaterial({ color: 0xff00ff }); // Darker sides

        // Use a multi-material for different faces
        this.materials = [
            this.materialSides, // Left
            this.materialSides, // Right
            this.materialTop,   // Top
            this.materialTop,   // Bottom
            this.materialSides, // Front
            this.materialSides  // Back
        ];

        // Create the mesh
        this.mesh = new THREE.Mesh(this.geometry, this.materials);

        // Position the mesh
        this.mesh.position.x = x;
        this.mesh.position.z = z;

        // Enable shadows
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;

        // Add the mesh to the group
        group.add(this.mesh);
    }
}


class Leg {
    constructor(group, demonsions, x, z) {
        this.geometry = new THREE.BoxGeometry(demonsions.leg_width, demonsions.leg_height, demonsions.leg_depth);
        this.material = new THREE.MeshBasicMaterial({ color: 0x654321 });
        this.mesh = new THREE.Mesh(this.geometry, this.material);
        this.mesh.position.x = x * 0.9;
        this.mesh.position.z = z * 0.9;
        this.mesh.position.y = -demonsions.leg_height / 2;
        group.add(this.mesh);
    }
}

class Table {
    constructor(group, demonsions) {
        this.group = group;
        
        // Set up the table's diameters
        this.table_height = Math.abs(demonsions.top_border_z - demonsions.bottom_border_z);
        this.table_width = Math.abs(demonsions.left_border_x - demonsions.right_border_x);
        
        this.geometry = new THREE.BoxGeometry(this.table_width,demonsions.border_thickness, this.table_height);
        this.material = new THREE.MeshBasicMaterial({ color: 0x1a1a4d });
        this.mesh = new THREE.Mesh(this.geometry, this.material);
        this.mesh.position.x = demonsions.table_x;
        this.mesh.position.z = demonsions.table_z;
        group.add(this.mesh);
        
        // Set up the table's position
        this.x = demonsions.table_x;
        this.z = demonsions.table_z;
        this.y = 0;
        
        // Set up the table's borders using demonsions of the table
        this.leftBorder = new Border(group, demonsions, demonsions.left_border_x - (this.table_width / 15) / 2, demonsions.table_z, this.table_height * 1.067, this.table_width / 15, this.table_width / 15);
        this.rightBorder = new Border(group, demonsions, demonsions.right_border_x + (this.table_width / 15) / 2, demonsions.table_z, this.table_height * 1.067, this.table_width / 15, this.table_width / 15);
        this.topBorder = new Border(group, demonsions, demonsions.table_x, demonsions.top_border_z + (this.table_width / 15) / 2, this.table_width / 15, this.table_width, this.table_width / 15);
        this.bottomBorder = new Border(group, demonsions, demonsions.table_x, demonsions.bottom_border_z - (this.table_width / 15) / 2, this.table_width / 15, this.table_width, this.table_width / 15);
        
        // Set up the table's score
        this.score = 0;
        
        // // Set up the table's legs
        // this.leftLeg = new Leg(group, demonsions, demonsions.left_border_x, demonsions.bottom_border_z);
        // this.rightLeg = new Leg(group, demonsions, demonsions.right_border_x, demonsions.bottom_border_z);
        // this.topLeg = new Leg(group, demonsions, demonsions.left_border_x, demonsions.top_border_z);
        // this.bottomLeg = new Leg(group, demonsions, demonsions.right_border_x, demonsions.top_border_z);
        
        this.textMesh1 = null;
        this.textMesh2 = null;
        this.textGeometry1 = null;
        this.textGeometry2 = null;
        this.textMaterial = null;
        this.font = null;
        
        // Set up the table's score text
        this.fontLoader = new FontLoader();
        this.fontLoader.load('../game/fonts/helvetiker_regular.typeface.json', (font) => {
            this.textGeometry1 = new TextGeometry('0', {
                font: font,
                size: 0.01,
                height: 0.001,
            });
            this.textGeometry2 = new TextGeometry('0', {
                font: font,
                size: 0.01,
                height: 0.001,
            });
            this.textMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
            this.textMesh1 = new THREE.Mesh(this.textGeometry1, this.textMaterial);
            this.textMesh2 = new THREE.Mesh(this.textGeometry2, this.textMaterial);
            
            this.font = font;
        });
        
        
    }
    updateText1(text, x, z) {
        if (this.font == null) {
            console.log('Font not loaded');
            return;
        }
        if (this.textMesh1 != null) {
            this.textGeometry1.dispose();
            this.group.remove(this.textMesh1);
        }
    
        // Create new geometry
        this.textGeometry1 = new TextGeometry(String(text), {
            font: this.font,
            size: 0.01,
            height: 0.001,
        });
    
        // Compute bounding box and center the geometry
        this.textGeometry1.computeBoundingBox();
        const bbox = this.textGeometry1.boundingBox;
        const centerOffsetX = (bbox.max.x - bbox.min.x) / 2;
        const centerOffsetY = (bbox.max.y - bbox.min.y) / 2;
    
        this.textGeometry1.translate(-centerOffsetX, -centerOffsetY, 0);
    
        // Update the mesh
        this.textMesh1.geometry = this.textGeometry1;
        this.textMesh1.position.x = x;
        this.textMesh1.position.z = z;
        this.textMesh1.position.y = this.table_width / 12;
        this.group.add(this.textMesh1);
    }
    
    updateText2(text, x, z) {
        if (this.font == null) {
            console.log('Font not loaded');
            return;
        }
        if (this.textMesh2 != null) {
            this.textGeometry2.dispose();
            this.group.remove(this.textMesh2);
        }
    
        // Create new geometry
        this.textGeometry2 = new TextGeometry(String(text), {
            font: this.font,
            size: 0.01,
            height: 0.001,
        });
    
        // Compute bounding box and center the geometry
        this.textGeometry2.computeBoundingBox();
        const bbox = this.textGeometry2.boundingBox;
        const centerOffsetX = (bbox.max.x - bbox.min.x) / 2;
        const centerOffsetY = (bbox.max.y - bbox.min.y) / 2;
    
        this.textGeometry2.translate(-centerOffsetX, -centerOffsetY, 0);
    
        // Update the mesh
        this.textMesh2.geometry = this.textGeometry2;
        this.textMesh2.position.x = x;
        this.textMesh2.position.z = z;
        this.textMesh2.position.y = this.table_width / 12;
        this.group.add(this.textMesh2);
    }
    
    updateText3(text, x, z, scene) {
        if (this.font == null) {
            console.log('Font not loaded');
            return;
        }
        if (this.textMesh2 != null) {
            this.textGeometry2.dispose();
            this.group.remove(this.textMesh2);
        }
    
        // Create new geometry
        this.textGeometry2 = new TextGeometry(text, {
            font: this.font,
            size: 0.01,
            height: 0.001,
        });
    
        // Compute bounding box and center the geometry
        this.textGeometry2.computeBoundingBox();
        const bbox = this.textGeometry2.boundingBox;
        const centerOffsetX = (bbox.max.x - bbox.min.x) / 2;
        const centerOffsetY = (bbox.max.y - bbox.min.y) / 2;
    
        this.textGeometry2.translate(-centerOffsetX, -centerOffsetY, 0);
    
        // Update the mesh
        this.textMesh2.geometry = this.textGeometry2;
        this.textMesh2.position.x = x;
        this.textMesh2.position.z = z;
        this.textMesh2.position.y = this.table_width / 12;
        scene.add(this.textMesh2);
    }
    
    
    // constructor(group, Path) {
        //     this.loader = new GLTFLoader();
        //     this.loader.load(Path, (gltf) => {
            //         this.mesh = gltf.scene;
            //         this.mesh.position.x = 0;
            //         this.mesh.position.z = 0;
            //         group.add(this.mesh);
            //     });
            // }
        }
         
// Set up the scene, camera, and renderer
class Setup {
    constructor() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({alpha: true});
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        const canvasContainer = document.getElementById('gameCanvas');
        canvasContainer.appendChild(this.renderer.domElement);
        
        // Set up the camera position
        // this.camera.position.x = 6.650006376616958e-18;
        // this.camera.position.y = 0.108602845836807;
        // this.camera.position.z = 0.1610103403070557;
        this.camera.position.set(0.1711846732526866, 0.1681856058588732, -0.0030675112476897864);
        
        
        // // Set up the lights
        // this.light = new THREE.DirectionalLight(0xffffff, 1);

        
        // this.light.position.set(0, 1, 0);
        
        // this.light.target.position.set(0, 0, 0); // Focus light on the center of the scene
        // this.scene.add(this.light.target);
        
        // this.light.castShadow = true;

        // // Configure shadow settings for the light
        // this.light.shadow.mapSize.width = 1024;
        // this.light.shadow.mapSize.height = 1024;
        // this.light.shadow.camera.near = 0.5;
        // this.light.shadow.camera.far = 50;

        // this.scene.add(this.light);
        this.ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(this.ambientLight);
        
        // Set up the group
        this.group = new THREE.Group();
        this.scene.add(this.group);
        
        // Set up the clock
        this.clock = new THREE.Clock();
        
        // Set up the font loader
        this.fontLoader = new FontLoader();
        
        // Set up the key state
        class Key {
            constructor() {
                this.UpKey1 = false;
                this.DownKey1 = false;
                this.RightKey1 = false;
                this.LeftKey1 = false;
                this.UpKey2 = false;
                this.DownKey2 = false;
                this.RightKey2 = false;
                this.LeftKey2 = false;
            }
        }

        this.keyState = new Key();
        console.log ("keys_initialized");
        this.sendKeyState = sendKeyState;
        
        // Set up the Fps counter
        this.states = new Stats();
        this.states.showPanel(0);
        document.body.appendChild(this.states.dom);
        
        // add GridHelper
        // this.gridHelper = new THREE.GridHelper(100, 1000);
        // this.scene.add(this.gridHelper);
        
        // // add AxesHelper
        // this.axesHelper = new THREE.AxesHelper(5);
        // this.scene.add(this.axesHelper);
        
        
        // add light
        // this.light = new THREE.DirectionalLight(0xffffff, 1);
        // this.light.position.set(0, 1, 0);
        // this.scene.add(this.light);
        
    }
}

function getStaticUrl(path) {
    // Get the STATIC_URL from a global variable that we'll set in the template
    const staticUrl = window.DJANGO_STATIC_URL || '/static/';
    console.log (staticUrl)
    return `${staticUrl}${path}`;
}

class ScoreDisplay {
    constructor(group, dimensions) {
        this.group = group;
        this.dimensions = dimensions;
        
        // Create loading manager first
        this.loadingManager = new LoadingManager();
        this.loadingManager.onError = (url) => {
            console.error('Error loading:', url);
        };
        
        // Create loader with the loading manager
        this.loader = new GLTFLoader(this.loadingManager);  // Pass manager directly here
        
        this.numberModels = new Map();
        this.currentScoreModels = {
            player1: null,
            player2: null
        };

        // Initialize loading
        this.loadNumberModels();
    }

    loadNumberModels() {
        // Load numbers 0-9
        for (let i = 0; i < 10; i++) {
            this.loader.load(
                `../game/models/numbers/0${i}.glb`,
                (gltf) => {
                    const model = gltf.scene;
                    
                    // Process materials to prevent shader errors
                    model.traverse((child) => {
                        if (child.isMesh) {
                            // Create new standard material
                            const newMaterial = new THREE.MeshStandardMaterial({
                                color: child.material.color || 0xffffff,
                                metalness: 0.5,
                                roughness: 0.5
                            });

                            // Copy relevant properties
                            if (child.material.map) newMaterial.map = child.material.map;
                            if (child.material.normalMap) newMaterial.normalMap = child.material.normalMap;
                            
                            // Assign new material
                            child.material = newMaterial;
                            
                            // Enable shadows
                            child.castShadow = true;
                            child.receiveShadow = true;
                        }
                    });

                    // Scale and adjust the model
                    model.scale.set(0.05, 0.05, 0.05);

                    model.rotation.set(0, Math.PI / 2, 0);
                    
                    this.numberModels.set(i, model);
                },
                (xhr) => {
                    // Progress callback
                    const percentComplete = (xhr.loaded / xhr.total) * 100;
                    console.log(`${i}.glb ${percentComplete}% loaded`);
                },
                (error) => {
                    console.error(`Error loading number model ${i}:`, error);
                }
            );
        }
    }

    updateScore(player, score, position) {
        const scoreStr = String(score);
        const currentModelKey = player === 1 ? 'player1' : 'player2';

        // Remove current score model if it exists
        if (this.currentScoreModels[currentModelKey]) {
            this.group.remove(this.currentScoreModels[currentModelKey]);
        }

        // Create a group for the new score
        const scoreGroup = new THREE.Group();

        // Calculate total width for centering
        const digitWidth = 0.005;
        const spacing = 0.05;
        const totalWidth = (scoreStr.length * digitWidth) + ((scoreStr.length - 1) * spacing);

        // Add each digit
        scoreStr.split('').forEach((digit, index) => {
            const numberModel = this.numberModels.get(parseInt(digit));
            if (numberModel) {
                const clone = numberModel.clone(true); // true for deep clone
                clone.position.x = (index * (digitWidth + spacing)) - (totalWidth / 2);
                scoreGroup.add(clone);
            }
        });

        // Position the score group
        scoreGroup.position.set(
            position.x,
            this.dimensions.border_thickness * 20,
            position.z
        );
        // console.log (currentModelKey, scoreGroup.position)

        // Store and add the new score group
        this.currentScoreModels[currentModelKey] = scoreGroup;
        this.group.add(scoreGroup);
    }

    dispose() {
        // Properly dispose of all materials and geometries
        this.numberModels.forEach((model) => {
            model.traverse((child) => {
                if (child.geometry) {
                    child.geometry.dispose();
                }
                if (child.material) {
                    if (Array.isArray(child.material)) {
                        child.material.forEach(material => material.dispose());
                    } else {
                        child.material.dispose();
                    }
                }
            });
        });

        // Clear current score models
        Object.values(this.currentScoreModels).forEach((model) => {
            if (model) {
                this.group.remove(model);
                model.traverse((child) => {
                    if (child.geometry) child.geometry.dispose();
                    if (child.material) {
                        if (Array.isArray(child.material)) {
                            child.material.forEach(material => material.dispose());
                        } else {
                            child.material.dispose();
                        }
                    }
                });
            }
        });

        // Clear maps
        this.numberModels.clear();
        this.currentScoreModels = { player1: null, player2: null };
    }
}

// Set up the game
class Game {
    constructor() {
        console.log("1--game starting");
        this.running = true;
        this.animationFrame = null
        this.gameSocket = null;
        // initialize the game
        this.setup = new Setup();
        this.scene = this.setup.scene;
        this.camera = this.setup.camera;
        this.renderer = this.setup.renderer;
        this.group = this.setup.group;
        this.clock = this.setup.clock;
        this.fontLoader = this.setup.fontLoader;
        this.keyState = this.setup.keyState;
        console.log(this.keyState)
        this.sendKeyState = this.setup.sendKeyState;
        this.states = this.setup.states;
        this.player = null;
        this.username = "";
        this.oppenentUserName = "";
        
        // for event listeners
        this.eventHandlers = {}; 
        
        // Variable to check the first time i enter the running field in animate
        this.first = false;

        // if its online or not
        this.online = false;
        
        this.stateOfGame = null;
        this.Iam = null;

        this.trnmt = false;

        this.message = null;
        
        // set up optimal camera position
        this.camera.lookAt(0, 0, 0);
        
        this.moving = {
            up: false,
            down: false,
            left: false,
            right: false,
            zoomin: false,
            zoomout: false,
            reset: false
        };
        
        // Set up the table and players and ball s demontions
        this.demonsions = demonsions;
        
        // Set up the table
        this.table = new Table(this.group, this.demonsions);
        
        // Set up the players
        this.player1 = new Player(this.group, this.demonsions, this.demonsions.table_x, this.demonsions.top_border_z * 0.9, (this.table.table_width / 15) / 3, 0x0000ff);
        this.player2 = new Player(this.group, this.demonsions, this.demonsions.table_x, this.demonsions.bottom_border_z * 0.9, (this.table.table_width / 15) / 3, 0xff0000);
        
        // Set up the ball
        this.ball = new Ball(this.group, this.demonsions, (this.table.table_width / 15) / 3, 0xffff00);
        
        
        // player and ball speed
        this.ball_speed = this.demonsions.ball_speed;
        this.player_speed = this.demonsions.player_speed;
        
        // variable to check if the data is to be sent
        this.send = false;
        
        // set up the camera distance
        this.cameraDistance = Math.sqrt(this.camera.position.x**2 + this.camera.position.y**2 + this.camera.position.z**2);
        this.theta = Math.acos(this.camera.position.z/this.cameraDistance);
        this.phi = Math.atan2(this.camera.position.y, this.camera.position.x);
        
        // create a pivot point
        this.pivot = new THREE.Object3D();
        this.pivot.add(this.player2.mesh);
        this.group.add(this.pivot);
        
        // GameOver Scene
        this.gameOverScene = new THREE.Scene();
        this.table.updateText3("Game Over", 0, 0, this.gameOverScene);
        this.gameOverScene.rotation.set(0, Math.PI / 2, 0);
        
        // Waiting Scene
        this.waitingScene = new THREE.Scene();
        this.table.updateText3("Waiting", 0, 0, this.waitingScene);
        this.waitingScene.rotation.set(0, Math.PI / 2, 0);
        
        // Game Start Scene
        this.gameStartScene = new THREE.Scene();
        this.table.updateText3("Match Found: Game Start Soon", 0, 0, this.gameStartScene);
        this.gameStartScene.rotation.set(0, Math.PI / 2, 0);
        
        this.scoreDisplay = new ScoreDisplay(this.group, this.demonsions);
        
        // Set up the controls from orbitControl
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enabled = true;
        this.controls.autoRotate = false;
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05; // Reduced from 0.25 for smoother movement
        this.controls.enableZoom = true;
        this.controls.enablePan = true;
        this.controls.screenSpacePanning = true;
        this.controls.minDistance = 0.24;
        this.controls.maxDistance = 0.5; // Reduced from 100 to keep camera closer
        this.controls.target = new THREE.Vector3(0, 0, 0);
        this.controls.update();
        // const controls = new OrbitControls(this.setup.camera, this.setup.renderer.domElement);
        // controls.enableDamping = true; // Smooth motion
        // controls.dampingFactor = 0.05;
        
        // this.controls = controls;
        this.group.children.forEach((child) => {
            if (child instanceof THREE.Mesh) { // Check if the child is a mesh
                child.castShadow = true; // Enable shadow casting
                child.receiveShadow = true; // Enable shadow receiving
            }
        });
        
        
        // this.loader = new GLTFLoader();
        // loader.load(
            //     '/static/obj/day_6_video_game.glb',
            //     function (gltf) {
                //         const model = gltf.scene;
                //         model.position.set(0, 0, 2);
                //         model.scale.set(0.1, 0.1, 0.1);
                //         model.rotation.set(Math.PI / 2, 0, 0);
                //         this.group.add(model); // Correct `this`
                //     }.bind(this), // Bind `this`
                //     undefined,
                //     function (error) {
                    //         console.error('An error occurred:', error);
        //     }
        // );
        
        this.animate = this.animate.bind(this);
        
        window.addEventListener('resize',  onWindowResize2.bind(this, this.camera, this.renderer));
        this.eventListeners();
        // Set up the game loop
        // this.animate();
    }
    
    updateGameStates(data) {
        this.player1.mesh.position.x = data.player1.x;
        this.player1.mesh.position.z = data.player1.z;
        this.player2.mesh.position.x = data.player2.x;
        this.player2.mesh.position.z = data.player2.z;
        this.ball.mesh.position.x = data.ball.x;
        this.ball.mesh.position.z = data.ball.z;
        
        this.player1.score = data.player1.score;
        this.player2.score = data.player2.score;
    }
    

    reinitializeGame() {
        // Reset game state
        this.first = false;
        this.player1.score = 0;
        this.player2.score = 0;

        // Reset positions
        this.player1.mesh.position.set(this.demonsions.table_x, (this.table.table_width / 15) / 3, this.demonsions.top_border_z * 0.9);
        this.player2.mesh.position.set(this.demonsions.table_x, (this.table.table_width / 15) / 3, this.demonsions.bottom_border_z * 0.9);
        this.ball.mesh.position.set(this.demonsions.table_x, (this.table.table_width / 15) / 3, this.demonsions.table_z);

        // Reset camera position based on player
        // if (this.Iam === "Blue") {
        //     this.camera.position.set(6.650006376616958e-18, 0.108602845836807, 0.1610103403070557);
        // } else {
        //     this.camera.position.set(6.650006376616958e-18, 0.108602845836807, -0.1610103403070557);
        // }
        this.camera.position.set(0.1711846732526866, 0.1681856058588732, -0.0030675112476897864);

        // Reset controls
        this.controls.reset();
        this.controls.update();

        // Reset animation state
        this.isInitialized = true;
    }


    animate() {
        this.cameraDistance = Math.sqrt(this.camera.position.x**2 + this.camera.position.y**2 + this.camera.position.z**2);
        this.theta = Math.acos(this.camera.position.z/this.cameraDistance);
        this.phi = Math.atan2(this.camera.position.y, this.camera.position.x);
        if (this.stateOfGame == "Running") {
            // this.scene.add(this.group);
            // set up camera
            if (!this.isInitialized) {
                this.reinitializeGame();
            }
            
            // Update controls before rendering
            this.controls.update();

            this.movingCamera();
            
            // add fps status
            this.setup.states.update();

            this.ball.updateLightPosition();
            this.player1.updateLightPosition();
            this.player2.updateLightPosition();

            
            document.addEventListener('contextmenu', (event) => event.preventDefault());
            
            // this.controls.update();
            
            // update Score
            // this.table.updateText1(this.player1.score, this.table.x + (this.table.table_width / 2) * 1.15, this.table.z + (this.table.table_height / 6));
            // this.table.updateText2(this.player2.score, this.table.x - (this.table.table_width / 2) * 1.3, this.table.z - (this.table.table_height / 6));
            // var x = this.table.x + (this.table.table_width / 2) * 1.15;
            var z = this.table.z + (this.table.table_height / 6);
            var x = (this.table.x - (this.table.table_width / 2) * 1.3);
            this.scoreDisplay.updateScore(1, this.player1.score, { x, z });
            var z = this.table.z - (this.table.table_height / 6);
            // this.loadScore (this.player1.score, x, 0, z);
            this.scoreDisplay.updateScore(2, this.player2.score, { x, z });
            // this.loadScore (this.player2.score, x, 0, z);
            
            // this.camera.position.set(0, 1, 0);
            // console.log ("camera: ", this.camera.position);
            this.renderer.render(this.scene, this.camera);
            // console.log (this.camera.position);
            
        }
        else if (this.stateOfGame == "Game Over") {
            // here render a scene for game over
            this.table.updateText3(this.message, 0, 0, this.gameOverScene);
            this.isInitialized = false;
            this.renderer.render(this.gameOverScene, this.camera);
            this.controls.update();

        }
        else if (this.stateOfGame == "Waiting") {

            // here render a this. for waiting for oppenent
            this.table.updateText3("Waiting", 0, 0, this.waitingScene);
            this.isInitialized = false;
            this.renderer.render(this.waitingScene, this.camera);
            this.controls.update();

        }
        else if (this.stateOfGame == "Game Start") {
            // here render a scene for waiting for oppenent
            console.log ("in game start scene");
            this.isInitialized = false;
            this.renderer.render(this.gameStartScene, this.camera);
            this.controls.update();
        }
        // to update on the resize

        this.animationFrame = requestAnimationFrame(this.animate);
    }
    
    // Function to check events
    eventListeners() {
        // Add event listeners to update key states
        this.eventHandlers.keydown = (event) => {
            if (!this.online) {
                switch (event.code) {
                    case 'KeyD': if (this.keyState.UpKey1 == false) this.send = true; this.keyState.UpKey1 = true; break;
                    case 'KeyA': if (this.keyState.DownKey1 == false) this.send = true; this.keyState.DownKey1 = true; break;
                    case 'KeyW': if (this.keyState.LeftKey1 == false) this.send = true; this.keyState.LeftKey1 = true; break;
                    case 'KeyS': if (this.keyState.RightKey1 == false) this.send = true; this.keyState.RightKey1 = true; break;
                    case 'ArrowRight': if (this.keyState.UpKey2 == false) this.send = true; this.keyState.UpKey2 = true; break;
                    case 'ArrowLeft': if (this.keyState.DownKey2 == false) this.send = true; this.keyState.DownKey2 = true; break;
                    case 'ArrowUp': if (this.keyState.LeftKey2 == false) this.send = true; this.keyState.LeftKey2 = true; break;
                    case 'ArrowDown': if (this.keyState.RightKey2 == false) this.send = true; this.keyState.RightKey2 = true; break;
                }
                console.log ("offlie  : ", this.online);
            }
            else if (this.online && this.Iam == "Blue") {
                switch (event.code) {
                    case 'KeyD': if (this.keyState.UpKey1 == false) this.send = true; this.keyState.UpKey1 = true; break;
                    case 'KeyA': if (this.keyState.DownKey1 == false) this.send = true; this.keyState.DownKey1 = true; break;
                    case 'KeyW': if (this.keyState.LeftKey1 == false) this.send = true; this.keyState.LeftKey1 = true; break;
                    case 'KeyS': if (this.keyState.RightKey1 == false) this.send = true; this.keyState.RightKey1 = true; break;
                }
                console.log ("Blue");
            }
            else {
                switch (event.code) {
                    case 'KeyD': if (this.keyState.UpKey2 == false) this.send = true; this.keyState.UpKey2 = true; break;
                    case 'KeyA': if (this.keyState.DownKey2 == false) this.send = true; this.keyState.DownKey2 = true; break;
                    case 'KeyW': if (this.keyState.LeftKey2 == false) this.send = true; this.keyState.LeftKey2 = true; break;
                    case 'KeyS': if (this.keyState.RightKey2 == false) this.send = true; this.keyState.RightKey2 = true; break;
                }
                console.log ("Red");
            }
            if (this.gameSocket != null && this.gameSocket.readyState === WebSocket.OPEN && this.send)
            {
                // send type game with keys holding keystate
                // console.log(this.keyState);
                this.gameSocket.send(JSON.stringify({type: 'game', keys: this.keyState}));
                this.send = false;
            }
                
        };
        
        this.eventHandlers.keyup = (event) => {
            if (!this.online) {
                switch (event.code) {
                    case 'KeyD': if (this.keyState.UpKey1 == true) this.send = true; this.keyState.UpKey1 = false; break;
                    case 'KeyA': if (this.keyState.DownKey1 == true) this.send = true; this.keyState.DownKey1 = false; break;
                    case 'KeyW': if (this.keyState.LeftKey1 == true) this.send = true; this.keyState.LeftKey1 = false; break;
                    case 'KeyS': if (this.keyState.RightKey1 == true) this.send = true; this.keyState.RightKey1 = false; break;
                    case 'ArrowRight': if (this.keyState.UpKey2 == true) this.send = true; this.keyState.UpKey2 = false; break;
                    case 'ArrowLeft': if (this.keyState.DownKey2 == true) this.send = true; this.keyState.DownKey2 = false; break;
                    case 'ArrowUp': if (this.keyState.LeftKey2 == true) this.send = true; this.keyState.LeftKey2 = false; break;
                    case 'ArrowDown': if (this.keyState.RightKey2 == true) this.send = true; this.keyState.RightKey2 = false; break;
                }
            }
            else if (this.online && this.Iam == "Blue") {
                switch (event.code) {
                    case 'KeyD': if (this.keyState.UpKey1 == true) this.send = true; this.keyState.UpKey1 = false; break;
                    case 'KeyA': if (this.keyState.DownKey1 == true) this.send = true; this.keyState.DownKey1 = false; break;
                    case 'KeyW': if (this.keyState.LeftKey1 == true) this.send = true; this.keyState.LeftKey1 = false; break;
                    case 'KeyS': if (this.keyState.RightKey1 == true) this.send = true; this.keyState.RightKey1 = false; break;
                }
            }
            else {
                switch (event.code) {
                    case 'KeyD': if (this.keyState.UpKey2 == true) this.send = true; this.keyState.UpKey2 = false; break;
                    case 'KeyA': if (this.keyState.DownKey2 == true) this.send = true; this.keyState.DownKey2 = false; break;
                    case 'KeyW': if (this.keyState.LeftKey2 == true) this.send = true; this.keyState.LeftKey2 = false; break;
                    case 'KeyS': if (this.keyState.RightKey2 == true) this.send = true; this.keyState.RightKey2 = false; break;
                }
            }
            if (this.gameSocket != null && this.gameSocket.readyState === WebSocket.OPEN && this.send)
            {
                // console.log(this.keyState);
                this.gameSocket.send(JSON.stringify({type: 'game', keys: this.keyState}));
                this.send = false;
            }
        };

        // Scroll wheel to zoom in/out
        this.eventHandlers.wheel = (event) => {
            const zoomSpeed = 1;
            this.cameraDistance = this.camera.position.distanceTo(this.pivot.position) + event.deltaY * zoomSpeed * 0.0001;// Update camera distance
            
            this.camera.position.x = this.cameraDistance * Math.sin(this.theta) * Math.cos(this.phi);
            this.camera.position.y = this.cameraDistance * Math.sin(this.theta) * Math.sin(this.phi);
            this.camera.position.z = this.cameraDistance * Math.cos(this.theta);
        };

        window.addEventListener('keydown', this.eventHandlers.keydown);
        window.addEventListener('keyup', this.eventHandlers.keyup);
        document.addEventListener('wheel', this.eventHandlers.wheel);

        document.getElementById("reset").addEventListener("mousedown", () => {
            // this.camera.position.x = 7.019341443249015e-18
            // this.camera.position.y = 0.11463454521150351
            // this.camera.position.z = 0.16995270237378324
            this.camera.position.set(0.1711846732526866, 0.1681856058588732, -0.0030675112476897864);
            
            this.cameraDistance = Math.sqrt(this.camera.position.x**2 + this.camera.position.y**2 + this.camera.position.z**2);
            this.theta = Math.acos(this.camera.position.z/this.cameraDistance);
            this.phi = Math.atan2(this.camera.position.y, this.camera.position.x);
            this.camera.lookAt(0, 0, 0);
            this.reset = false;
        });
        
        
        // Stop movement on mouse up
        document.addEventListener("mouseup", () => {
            this.moving.up = false;
            this.moving.down = false;
            this.moving.left = false;
            this.moving.right = false;
            this.moving.zoomin = false;
            this.moving.zoomout = false;
        });
        
    }

    movingCamera() {
        if (this.moving.up) {
            this.theta += Math.PI / 180;
            this.camera.position.x = this.cameraDistance * Math.sin(this.theta) * Math.cos(this.phi);
            this.camera.position.y = this.cameraDistance * Math.sin(this.theta) * Math.sin(this.phi);
            this.camera.position.z = this.cameraDistance * Math.cos(this.theta);
            //this.camera.lookAt(0, 0, 0);
        }
        if (this.moving.down) {
            this.theta -= Math.PI / 180;
            this.camera.position.x = this.cameraDistance * Math.sin(this.theta) * Math.cos(this.phi);
            this.camera.position.y = this.cameraDistance * Math.sin(this.theta) * Math.sin(this.phi);
            this.camera.position.z = this.cameraDistance * Math.cos(this.theta);
            //this.camera.lookAt(0, 0, 0);
        }
        if (this.moving.left) {
            this.phi += Math.PI / 180;
            this.camera.position.x = this.cameraDistance * Math.sin(this.theta) * Math.cos(this.phi);
            this.camera.position.y = this.cameraDistance * Math.sin(this.theta) * Math.sin(this.phi);
            this.camera.position.z = this.cameraDistance * Math.cos(this.theta);
            this.camera.lookAt(0, 0, 0);
        }
        if (this.moving.right) {
            this.phi -= Math.PI / 180;
            this.camera.position.x = this.cameraDistance * Math.sin(this.theta) * Math.cos(this.phi);
            this.camera.position.y = this.cameraDistance * Math.sin(this.theta) * Math.sin(this.phi);
            this.camera.position.z = this.cameraDistance * Math.cos(this.theta);
            this.camera.lookAt(0, 0, 0);
        }
        if (this.moving.zoomin) {
            this.cameraDistance -= 0.005;
            if (this.cameraDistance < 0.2) {
                this.cameraDistance = 0.2;
            }
            this.camera.position.x = this.cameraDistance * Math.sin(this.theta) * Math.cos(this.phi);
            this.camera.position.y = this.cameraDistance * Math.sin(this.theta) * Math.sin(this.phi);
            this.camera.position.z = this.cameraDistance * Math.cos(this.theta);
            //this.camera.lookAt(0, 0, 0);
            console.log(this.camera.position);
        }
        if (this.moving.zoomout) {
            this.cameraDistance += 0.005;
            this.camera.position.x = this.cameraDistance * Math.sin(this.theta) * Math.cos(this.phi);
            this.camera.position.y = this.cameraDistance * Math.sin(this.theta) * Math.sin(this.phi);
            this.camera.position.z = this.cameraDistance * Math.cos(this.theta);
            //camera.lookAt(0, 0, 0);
            console.log(this.camera.position);
        }
    }

    destroy() {
        console.log("Destroying the game...");

        this.running = false;

        window.removeEventListener('keydown', this.eventHandlers.keydown);
        window.removeEventListener('keyup', this.eventHandlers.keyup);
        document.removeEventListener('wheel', this.eventHandlers.wheel);
    
        // Stop the animation loop
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame); // Cancel the ongoing animation frame
            this.animationFrame = null; // Clear the stored frame ID
        }
    
        // Remove event listeners
        window.removeEventListener('resize', onWindowResize2.bind(this, this.camera, this.renderer));
        window.removeEventListener('keydown', this.keyDownHandler);
        window.removeEventListener('keyup', this.keyUpHandler);
    
        // Dispose of Three.js objects
        this.scene.traverse((object) => {
            if (object.geometry) {
                object.geometry.dispose();
            }
            if (object.material) {
                if (Array.isArray(object.material)) {
                    object.material.forEach((mat) => mat.dispose());
                } else {
                    object.material.dispose();
                }
            }
            if (object.texture) {
                object.texture.dispose();
            }
        });
    
        // Dispose of renderer
        if (this.renderer) {
            this.renderer.dispose();
        }
    
        // Remove the canvas from the DOM
        const canvas = document.getElementById('gameCanvas');
        if (canvas && canvas.parentNode) {
            canvas.parentNode.removeChild(canvas);
        }
    
        // Nullify references to objects
        this.setup = null;
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.group = null;
        this.clock = null;
        this.fontLoader = null;
        this.keyState = null;
        this.sendKeyState = null;
        this.states = null;
        this.table = null;
        this.player1 = null;
        this.player2 = null;
        this.ball = null;
        this.pivot = null;
        this.controls = null;
        this.gameSocket = null;
    
        console.log("Game destroyed successfully.");
    }
    
}

//////////////////////////////////////////////////////////
///////////////////
class TournamentDisplay {
    constructor() {
        this.displayElement = document.getElementById('tournament-display');
        this.currentData = null;
        this.handleClickOutside = this.handleClickOutside.bind(this);
    }

    show() {
        this.displayElement.style.display = 'block';
        
        // Create close button
        const closeButton = document.createElement('button');
        closeButton.textContent = '✕';
        closeButton.style.cssText = `
            position: absolute;
            right: 10px;
            top: 10px;
            background: #ff4444;
            color: white;
            border: none;
            border-radius: 50%;
            width: 30px;
            height: 30px;
            cursor: pointer;
            font-size: 16px;
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 10001;
        `;
        
        // Add click event for close button
        closeButton.addEventListener('click', () => this.hide());
        
        // Add click outside listener
        document.addEventListener('mousedown', this.handleClickOutside);
        
        // Append close button to display element instead of contentContainer
        this.displayElement.appendChild(closeButton);
    }

    hide() {
        this.displayElement.style.display = 'none';
        // Remove the click outside listener when hiding
        document.removeEventListener('mousedown', this.handleClickOutside);
        // Remove the close button
        const closeButton = this.displayElement.querySelector('button');
        if (closeButton) {
            closeButton.remove();
        }
    }
    
    handleClickOutside(event) {
        if (this.displayElement && !this.displayElement.contains(event.target)) {
            this.hide();
        }
    }

    update(displayData) {
        this.currentData = displayData;
        this.updateTournamentInfo();
        this.updatePlayersList();
        this.updateBracket();
        this.updateActiveMatches();
        this.show();
    }
    
    updateTournamentInfo() {
        const tournament = this.currentData.tournament;
        document.getElementById('tournament-name').textContent = tournament.name;
        document.getElementById('tournament-status').textContent = `Status: ${tournament.status}`;
        
        const statsContent = document.getElementById('tournament-stats-content');
        statsContent.innerHTML = `
            <p>Total Players: ${tournament.total_players}</p>
            <p>Current Players: ${tournament.current_players}</p>
            <p>Current Round: ${tournament.current_round + 1}</p>
            <p>Type: ${tournament.is_online ? 'Online' : 'Local'}</p>
        `;
    }

    updatePlayersList() {
        const playersList = document.getElementById('players-list');
        playersList.innerHTML = `
            <p>Registered Players: ${this.currentData.players.registered.length}/${this.currentData.players.total_needed}</p>
            <p>Spots Left: ${this.currentData.players.spots_left}</p>
            <div style="margin-top: 10px;">
                ${this.currentData.players.registered.map(player => 
                    `<div style="padding: 5px; background: rgba(255,255,255,0.05); margin: 2px; border-radius: 3px;">
                        ${player}
                    </div>`
                ).join('')}
            </div>
        `;
    }

    updateBracket() {
        const bracketDisplay = document.getElementById('bracket-display');
        bracketDisplay.innerHTML = '';

        this.currentData.bracket.forEach((round, roundIndex) => {
            const roundElement = document.createElement('div');
            roundElement.style.cssText = `
                display: inline-block;
                vertical-align: top;
                margin: 0 10px;
                min-width: 200px;
            `;

            roundElement.innerHTML = `
                <h4 style="text-align: center; color: #0088ff;">Round ${round.round_number}</h4>
                <div style="display: flex; flex-direction: column; gap: 10px;">
                    ${round.matches.map(match => this.createMatchElement(match)).join('')}
                </div>
            `;

            bracketDisplay.appendChild(roundElement);
        });
    }

    createMatchElement(match) {
        const getPlayerDisplay = (player) => player || 'TBD';
        const statusColor = match.status === 'completed' ? '#00ff00' : 
                          match.is_active ? '#ff9900' : '#666666';

        return `
            <div style="background: rgba(255,255,255,0.05); padding: 10px; border-radius: 5px; border-left: 3px solid ${statusColor};">
                <div style="margin-bottom: 5px;">${getPlayerDisplay(match.player1)}</div>
                <div style="margin-bottom: 5px;">${getPlayerDisplay(match.player2)}</div>
                ${match.winner ? `<div style="color: #00ff00; font-size: 0.8em;">Winner: ${match.winner}</div>` : ''}
                ${match.is_active ? '<div style="color: #ff9900; font-size: 0.8em;">Match in Progress</div>' : ''}
            </div>
        `;
    }

    updateActiveMatches() {
        const activeMatchesList = document.getElementById('active-matches-list');
        const activeMatches = Object.entries(this.currentData.active_matches);

        if (activeMatches.length === 0) {
            activeMatchesList.innerHTML = '<p>No active matches</p>';
            return;
        }

        activeMatchesList.innerHTML = activeMatches.map(([matchId, roomName]) => `
            <div style="background: rgba(255,255,255,0.05); padding: 10px; margin: 5px 0; border-radius: 5px;">
                <p>Match ID: ${matchId}</p>
                <p>Room: ${roomName}</p>
            </div>
        `).join('');
    }
}

///////////////////////////////////////////////
///////////////////////////
/////////////////////////////////

// make a web Socket manager to manage the websockets
class WebSocketManager {
    constructor(url, game, type, username) {
        this.url = url;
        this.game = game;
        this.username = username;
        this.game.username = username;
        this.socket = new WebSocket(this.url);
        this.game.gameSocket = this.socket;
        this.type = type;
        
        // Bind the methods
        this.onOpen = this.onOpen.bind(this);
        this.onMessage = this.onMessage.bind(this);
        this.onClose = this.onClose.bind(this);

        // Attach event handlers
        this.socket.onopen = this.onOpen;
        this.socket.onmessage = this.onMessage;
        this.socket.onclose = this.onClose;

        this.stateOfGame = null;
        this.wait = false;
        this.gameOver = false;
        this.gameState = false;
        this.gameStart = false;

        this.tournaments = null;

        this.tournamentDisplay = new TournamentDisplay();
    }

    handleTournamentUpdate(data) {
        this.tournamentDisplay.update(data);
    }

    // i need to know from where the connection came so i know what type to initialize
    onOpen(event) {
        console.log('WebSocket connection established');

        if (this.type === 'tournament_list') {
            this.showTournamentList(this.tournaments);
        }

        else if (this.type === "create_tournament") {
            this.createTournamentPopup((tournamentName, numPlayers) => {
                // Send the tournament details to the WebSocket server
                const message = {
                    type: this.type,
                    name: tournamentName,
                    num_players: numPlayers,
                    username: this.username
                };
                this.socket.send(JSON.stringify(message));
            });
        } else {
            const message = {
                type: this.type,
                username: this.username
            };
            this.socket.send(JSON.stringify(message));
        }
    }

    onMessage(event) {
        let data = JSON.parse(event.data);
        if (data.type != "game_state") console.log (data);
        
        if (data.type === 'tournament_update' || data.type === 'tournament_complete') {
            this.handleTournamentUpdate(data.display_data);
        }
        else {
            this.tournamentDisplay.hide();
        }

        if (data.type === "create_tournament") {
            this.createTournamentPopup((tournamentName, numPlayers) => {
                // Send the tournament details to the WebSocket server
                const message = {
                    type: "tournament_created",
                    name: tournamentName,
                    num_players: numPlayers
                };
                this.socket.send(JSON.stringify(message));
            });
        }
        if (data.type === 'tournament_list') {
            this.showTournamentList(data.tournaments);
        }
        
        if (data.type == 'landing') {
            console.log('Landing');
        }
        if (data.type == 'game_state') {
            this.game.updateGameStates(data);
            this.game.stateOfGame = "Running";
        }

        if (data.type == 'game_over') {
            console.log('Game Over');
            // if (this.game != null) {
            //     this.game.controls.enabled = false;
            //     this.game.controls.autoRotate = true;
            // }
            if (data.winner == "You won! Opponent disconnected.") {
                this.game.message = data.winner;
            }
            else if (data.winner == this.game.player) {
                this.game.message = "You Won";
                if (this.game.trnmt) this.game.message = "You Won, Wait For The Next Round :)";
            }
            else {
                this.game.message = "You Lost";
                if (this.game.trnmt) this.game.message = "You Lost, You Can Leave Now";
            }
            this.game.stateOfGame = "Game Over";
        }
        if ((data.type == 'waiting' || data.type == "tournament_created" || data.type == "tournament_joined")) {
            console.log ('waiting');
            this.game.stateOfGame = "Waiting";
        }
        if (data.type == 'game_start') {
            console.log('1-game_start');
            console.log (data.state);
            this.game.first = false;
            this.stateOfGame = "Game Start";
            if (data.Iam == "Blue")
                this.game.Iam = "Blue";
            else
                this.game.Iam = "Red";
            this.game.player = data.player;
            this.game.trnmt = data.tournament;
            // this.game.online = true;
        }

        if (data.type === "countdown") {
            // Show countdown overlay
            const countdownElement = document.getElementById('countdown-overlay');
            if (data.count === "GO!") {
                countdownElement.textContent = "GO!";
                // Remove countdown overlay after a short delay
                setTimeout(() => {
                    countdownElement.style.display = 'none';
                }, 500);
            } else {
                countdownElement.textContent = data.count;
                countdownElement.style.display = 'flex';
            }
            this.game.stateOfGame = "Running";
        }
        if (data.type == "failed") {
            console.log ("failed");
            // pop up a notification that the game failed to start and close the socket
            // this.game.destroy();
            this.toggleButtons(false);
            this.showErrorNotification(data);
            this.close();
        }
    }

    onClose(event) {
        console.error('WebSocket connection closed');
    }
    
    // New close method to safely close the WebSocket connection
    close() {
        if (this.socket) {
            console.log('Closing WebSocket connection');
            this.socket.close(); // Closes the WebSocket connection
            this.socket = null; // Clear the reference
        }
    }

    toggleButtons(play) {
        const modeButtons = document.getElementById('mode-selection');
        const tournamentControls = document.getElementById('tournament-controls');
        const closeButton = document.getElementById('close-button');
        
        if (play) {
            modeButtons.style.display = 'none';
            tournamentControls.style.display = 'none';
            closeButton.style.display = 'block';
        } else if (!play) {
            modeButtons.style.display = 'flex';
            tournamentControls.style.display = 'flex';
            closeButton.style.display = 'block';
        }
    }


    showErrorNotification(data) {
        // Check if the received data is valid and has the necessary fields
        if (data && data.type === "failed" && data.title && data.reason) {
            // Create a notification element
            const notification = document.createElement("div");
            notification.classList.add("notification");
            notification.style.position = "fixed";
            notification.style.top = "10px";
            notification.style.left = "50%";
            notification.style.transform = "translateX(-50%)";
            notification.style.padding = "10px 20px";
            notification.style.backgroundColor = "#f44336";
            notification.style.color = "#fff";
            notification.style.borderRadius = "5px";
            notification.style.boxShadow = "0 4px 6px rgba(0, 0, 0, 0.1)";
            notification.style.zIndex = "1000";
            
            // Set the notification content
            notification.innerHTML = `<strong>${data.title}</strong><br>${data.reason}`;
            
            // Append the notification to the body
            document.body.appendChild(notification);
    
            // Automatically remove the notification after 5 seconds
            setTimeout(() => {
                notification.remove();
            }, 5000);
        } else {
            console.error("Invalid notification data");
        }
    }
    // closeTournamentList() {
    //     const modal = document.getElementById('tournamentModal');
    //     if (modal) {
    //         modal.remove();
    //     }
    // }
    showTournamentList(tournaments) {
        // Create the modal container
        const modal = document.createElement('div');
        modal.id = 'tournamentModal';
        modal.style.position = 'fixed';
        modal.style.top = '0';
        modal.style.left = '0';
        modal.style.width = '100%';
        modal.style.height = '100%';
        modal.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        modal.style.display = 'flex';
        modal.style.flexDirection = 'column';
        modal.style.justifyContent = 'center';
        modal.style.alignItems = 'center';
        modal.style.zIndex = '9998';
    
        // Create the modal content
        const modalContent = document.createElement('div');
        modalContent.style.backgroundColor = '#fff';
        modalContent.style.padding = '20px';
        modalContent.style.borderRadius = '10px';
        modalContent.style.textAlign = 'center';
        modalContent.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.2)';
        modalContent.style.width = '60%';
        modalContent.style.maxHeight = '80%';
        modalContent.style.overflowY = 'auto';
        modal.appendChild(modalContent);
    
        // Add a title to the modal
        const modalTitle = document.createElement('h2');
        modalTitle.textContent = 'Available Tournaments';
        modalTitle.style.color = '#333';
        modalTitle.style.marginBottom = '20px';
        modalContent.appendChild(modalTitle);
    
        // Add tournament list
        if (tournaments.length > 0) {
            tournaments.forEach((tournament) => {
                const tournamentDiv = document.createElement('div');
                tournamentDiv.style.margin = '10px 0';
                tournamentDiv.style.padding = '15px';
                tournamentDiv.style.border = '1px solid #ddd';
                tournamentDiv.style.borderRadius = '5px';
                tournamentDiv.style.cursor = 'pointer';
                tournamentDiv.style.backgroundColor = '#f9f9f9';
                tournamentDiv.style.transition = 'background-color 0.3s, transform 0.2s';
                tournamentDiv.style.fontSize = '16px';
                tournamentDiv.style.color = '#555';
                tournamentDiv.style.fontWeight = 'bold';
                tournamentDiv.style.zIndex = '9999';
        
                // Tournament hover effects
                tournamentDiv.addEventListener('mouseover', () => {
                    tournamentDiv.style.backgroundColor = '#e6e6e6';
                    tournamentDiv.style.transform = 'scale(1.02)';
                });
                tournamentDiv.addEventListener('mouseout', () => {
                    tournamentDiv.style.backgroundColor = '#f9f9f9';
                    tournamentDiv.style.transform = 'scale(1)';
                });
        
                // Calculate open positions
                const openPositions = tournament.num_players - tournament.current_players;
        
                // Display tournament name and open positions
                tournamentDiv.textContent = `${tournament.name} - Open Positions: ${openPositions}`;
        
                modalContent.appendChild(tournamentDiv);
        
                // Add click event to join the tournament
                tournamentDiv.addEventListener('click', () => {
                    this.joinTournament(tournament.tournament_id);
                });
            });
        } else {
            const noTournaments = document.createElement('p');
            noTournaments.textContent = 'No tournaments available at the moment.';
            noTournaments.style.color = '#666';
            noTournaments.style.fontSize = '16px';
            modalContent.appendChild(noTournaments);
        }
    
        // Add close button
        const closeButton = document.createElement('button');
        closeButton.textContent = 'Close';
        closeButton.style.padding = '10px 20px';
        closeButton.style.marginTop = '20px';
        closeButton.style.cursor = 'pointer';
        closeButton.style.backgroundColor = '#007BFF';
        closeButton.style.color = '#fff';
        closeButton.style.border = 'none';
        closeButton.style.borderRadius = '5px';
        closeButton.style.fontSize = '16px';
        closeButton.style.transition = 'background-color 0.3s';
    
        // Close button hover effect
        closeButton.addEventListener('mouseover', () => {
            closeButton.style.backgroundColor = '#0056b3';
        });
        closeButton.addEventListener('mouseout', () => {
            closeButton.style.backgroundColor = '#007BFF';
        });
    
        modalContent.appendChild(closeButton);
    
        // Attach close event
        closeButton.addEventListener('click', this.closeTournamentList);
    
        // Append modal to body
        document.body.appendChild(modal);

        modal.addEventListener('click', (event) => {
            if (event.target === modal) {
                modal.remove();
            }
        });
    }
    

    closeTournamentList() {
        const modal = document.getElementById('tournamentModal');
        if (modal) {
            document.body.removeChild(modal);
        }
    }

    joinTournament(tournamentId) {
        const message = {
            type: 'join_tournament',
            tournament_id: tournamentId
        };
        this.socket.send(JSON.stringify(message));
        console.log(`Joining tournament with ID: ${tournamentId}`);
        this.closeTournamentList(); // Close the modal after joining
    }

    createTournamentPopup(callback) {
        // Create the modal container
        const modal = document.createElement('div');
        modal.style.position = 'fixed';
        modal.style.top = '0';
        modal.style.left = '0';
        modal.style.width = '100%';
        modal.style.height = '100%';
        modal.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        modal.style.display = 'flex';
        modal.style.flexDirection = 'column';
        modal.style.justifyContent = 'center';
        modal.style.alignItems = 'center';
        modal.style.zIndex = '9999';

        // Create the modal content
        const modalContent = document.createElement('div');
        modalContent.style.backgroundColor = 'white';
        modalContent.style.padding = '20px';
        modalContent.style.borderRadius = '10px';
        modalContent.style.textAlign = 'center';
        modal.appendChild(modalContent);

        // Tournament name input
        const nameInput = document.createElement('input');
        nameInput.type = 'text';
        nameInput.placeholder = 'Tournament Name';
        nameInput.style.marginBottom = '10px';
        nameInput.style.padding = '10px';
        nameInput.style.width = '100%';
        modalContent.appendChild(nameInput);

        // Number of players input
        const numPlayersInput = document.createElement('input');
        numPlayersInput.type = 'number';
        numPlayersInput.placeholder = 'Number of Players';
        numPlayersInput.style.marginBottom = '10px';
        numPlayersInput.style.padding = '10px';
        numPlayersInput.style.width = '100%';
        modalContent.appendChild(numPlayersInput);

        // Submit button
        const submitButton = document.createElement('button');
        submitButton.textContent = 'Create Tournament';
        submitButton.style.padding = '10px 20px';
        submitButton.style.marginTop = '10px';
        submitButton.style.cursor = 'pointer';
        modalContent.appendChild(submitButton);

        // Append modal to body
        document.body.appendChild(modal);

        // Submit button click handler
        submitButton.addEventListener('click', () => {
            const tournamentName = nameInput.value;
            const numPlayers = parseInt(numPlayersInput.value, 10);

            if (tournamentName && numPlayers > 0) {
                callback(tournamentName, numPlayers);
                document.body.removeChild(modal); // Remove the modal
            } else {
                alert('Please enter valid tournament details!');
            }
        });
    }
}

export { Game , WebSocketManager};