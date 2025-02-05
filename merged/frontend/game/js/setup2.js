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
class GameOverlay {
    constructor() {
        this.overlay = document.getElementById('gameOverlay');
        this.waitingContent = document.getElementById('waitingContent');
        this.gameOverContent = document.getElementById('gameOverContent');
        this.playAgainButton = document.getElementById('playAgainButton');
        
        // Player 1 elements
        this.player1Name = document.getElementById('player1Name');
        this.player1Info = document.getElementById('player1Info');
        
        this.playAgainButton.addEventListener('click', () => {
            window.location.reload();
        });
    }

    show(type, data = {}) {
        this.overlay.style.display = 'block';
        
        // Hide Three.js scene
        const canvas = document.querySelector('canvas');
        if (canvas) {
            canvas.style.opacity = '0.3';
            canvas.style.transition = 'opacity 0.3s ease';
        }
        
        switch(type) {
            case 'waiting':
                this.waitingContent.style.display = 'flex';
                this.gameOverContent.style.display = 'none';
                this.player1Name.textContent = data.username || 'Player 1';
                this.player1Info.textContent = 'Ready to play';
                break;
                
            case 'gameOver':
                this.waitingContent.style.display = 'none';
                this.gameOverContent.style.display = 'block';
                
                const winner = data.winner;
                const winnerName = winner === data.username ? 'You' : winner;
                
                document.querySelector('.winner-announcement').textContent = data.message;
                    // winner === data.username ? 'Victory!' : 'Game Over';
                
                document.getElementById('matchPlayers').textContent = 
                    `${data.username} vs ${data.opponentUsername || 'Opponent'}`;

                document.getElementById('player1Score').textContent = data.player1Score || '0';
                document.getElementById('player2Score').textContent = data.player2Score || '0';
                
                // Add victory effects if player won
                if (winner === data.username) {
                    this.gameOverContent.style.animation = 'victoryPulse 2s infinite';
                }
                break;
        }
    }

    hide() {
        this.overlay.style.display = 'none';
        // Show Three.js scene
        const canvas = document.querySelector('canvas');
        if (canvas) {
            canvas.style.opacity = '1';
        }
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

        this.friend = null;
        
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

        this.overlay = new GameOverlay();
        this.overlay.hide();
        
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
            this.overlay.hide();

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
            // // here render a scene for game over
            // this.table.updateText3(this.message, 0, 0, this.gameOverScene);
            // this.isInitialized = false;
            // this.renderer.render(this.gameOverScene, this.camera);
            // this.controls.update();

            this.overlay.show('gameOver', { 
                username: this.username,
                opponentUsername: this.oppenentUserName,
                winner: this.message.includes('won') ? this.message.split(' ')[0] : null,
                message: this.message,
                player1Score: this.player1.score,
                player2Score: this.player2.score
            });

        }
        else if (this.stateOfGame == "Waiting") {

            // // here render a this. for waiting for oppenent
            // this.table.updateText3("Waiting", 0, 0, this.waitingScene);
            // this.isInitialized = false;
            // this.renderer.render(this.waitingScene, this.camera);
            // this.controls.update();
            this.overlay.show('waiting', { 
                username: this.username,
                opponentUsername: this.oppenentUserName
            });

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
        this.overlay.hide();

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

        // dispose of overlay
        this.overlay = null;
    
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
import { handling_navigation } from "../../js/main.js";

export let currentWebSocket = null;
export let currentGame = null;
let playing = false;

export function getCurrentWebSocket ()  {
    return currentWebSocket;
}

export function setCurrentWebSocket (webSocket) {
    currentWebSocket = webSocket;
}

export function getCurrentGame () {
    return currentGame;
}

export function setCurrentGame (game) {
    currentGame = game;
}

export function getPlaying () {
    return playing;
}

export function setPlaying (play) {
    playing = play;
}

export function cleanupPreviousMode() {
    if (currentWebSocket != null) {
        currentWebSocket.close();
        currentWebSocket = null;
    }
    
    if (currentGame != null) {
        console.log ("destroying game : ", currentGame);
        currentGame.destroy();
        currentGame = null;
        console.log ("removed current game", currentGame);
    }
}
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
    constructor(url, game, type, username, friend) {
        this.url = url;
        this.game = game;
        this.username = username;
        this.game.username = username;
        this.socket = new WebSocket(this.url);
        this.game.gameSocket = this.socket;
        this.type = type;
        
        this.game.friend = friend;
        this.friend = friend;
        
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
                username: this.username,
                friend: this.friend
            };

            console.log("Sending message: ", message);
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
                    num_players: numPlayers,
                    username: this.username
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
            // if (data.winner == "You won! Opponent disconnected.") {
            //     this.game.message = data.winner;
            // }
            // else if (data.winner == this.game.player) {
            //     this.game.message = "You Won";
            //     if (this.game.trnmt) this.game.message = "You Won, Wait For The Next Round :)";
            // }
            // else {
            //     if (this.game.online) this.game.message = "You Lost";
            //     else if (this.game.trnmt) this.game.message = "You Lost, You Can Leave Now";
            //     else this.game.message = data.message;
            // }
            this.game.message = data.message;

            this.game.player1.score = data.player1.score;
            this.game.player2.score = data.player2.score;

            if (this.game.player1.score == -1) {
                this.game.player1.score = 0;
                this.game.player2.score = 3;
            }
            else if (this.game.player2.score == -1) {
                this.game.player1.score = 3;
                this.game.player2.score = 0;
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
            this.game.username = data.username;
            this.game.oppenentUserName = data.opp;
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
            this.toggleButtonss(false);
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

    toggleButtonss(play) {
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
        closeButton.addEventListener('click', this.closeTournamentListAll);
    
        // Append modal to body
        document.body.appendChild(modal);

        modal.addEventListener('click', (event) => {
            if (event.target === modal) {
                modal.remove();
            }
        });
    }

    closeTournamentListAll() {
        const modal = document.getElementById('tournamentModal');
        if (modal) {
            document.body.removeChild(modal);
        }
        cleanupPreviousMode();
        toggleButtons(false);
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
            tournament_id: tournamentId,
            username: this.username
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
    
        // Button container for better layout
        const buttonContainer = document.createElement('div');
        buttonContainer.style.display = 'flex';
        buttonContainer.style.justifyContent = 'space-between';
        buttonContainer.style.marginTop = '10px';
        modalContent.appendChild(buttonContainer);
    
        // Submit button
        const submitButton = document.createElement('button');
        submitButton.textContent = 'Create Tournament';
        submitButton.style.padding = '10px 20px';
        submitButton.style.cursor = 'pointer';
        submitButton.style.backgroundColor = '#4CAF50';
        submitButton.style.color = 'white';
        submitButton.style.border = 'none';
        submitButton.style.borderRadius = '5px';
        buttonContainer.appendChild(submitButton);
    
        // Cancel button
        const cancelButton = document.createElement('button');
        cancelButton.textContent = 'Cancel';
        cancelButton.style.padding = '10px 20px';
        cancelButton.style.cursor = 'pointer';
        cancelButton.style.backgroundColor = '#f44336';
        cancelButton.style.color = 'white';
        cancelButton.style.border = 'none';
        cancelButton.style.borderRadius = '5px';
        buttonContainer.appendChild(cancelButton);
    
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
    
        // Cancel button click handler
        cancelButton.addEventListener('click', () => {
            document.body.removeChild(modal); // Remove the modal
            cleanupPreviousMode();
            toggleButtons(false);
        });
    }
}

class GameChat {
    constructor() {
        this.currentUser = null;
        this.activeSockets = {};
        this.friendList = [];
        
        // DOM Elements
        this.chatContainer = document.getElementById('chat-container');
        this.chatHeader = document.getElementById('chat-header');
        this.chatMinimize = document.getElementById('chat-minimize');
        this.chatMessages = document.getElementById('chat-messages');
        this.chatInput = document.getElementById('chat-message-input');
        this.chatSendButton = document.getElementById('chat-send-button');
        this.friendListContainer = document.getElementById('friend-list');
        this.showFriendsBtn = document.getElementById('show-friends-btn');
        this.chatTabsContainer = document.getElementById('chat-tabs');

        this.setupEventListeners();
    }

    async login(username) {
        try {
            // Backend authentication
            const response = await fetch('/api/user_data/', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.getAuthToken()}`
                },
                // body: JSON.stringify({ username })
            });
            if (response.ok) {
                this.currentUser = username;
            }
        } catch (error) {
            console.error('Login failed:', error);
        }
    }

    async fetchFriendList() {
        try {
            const response = await fetch('/api/friends', {
                headers: {
                    'Authorization': `Bearer ${this.getAuthToken()}`
                }
            });
            
            this.friendList = await response.json();
            this.renderFriendList();
        } catch (error) {
            console.error('Failed to fetch friends:', error);
        }
    }

    renderFriendList() {
        this.friendListContainer.innerHTML = '';
        this.friendList.forEach(friend => {
            const friendItem = document.createElement('div');
            friendItem.classList.add('friend-item');
            friendItem.textContent = friend.username;
            friendItem.addEventListener('click', () => this.openChatWithFriend(friend.username));
            this.friendListContainer.appendChild(friendItem);
        });
    }

    openChatWithFriend(friendUsername) {
        // Close friend list
        this.friendListContainer.classList.remove('visible');

        // Create or focus existing chat tab
        let chatTab = document.querySelector(`[data-username="${friendUsername}"]`);
        if (!chatTab) {
            this.createChatTab(friendUsername);
        }

        // Establish WebSocket connection
        this.establishWebSocket(friendUsername);
    }

    createChatTab(friendUsername) {
        const chatTab = document.createElement('div');
        chatTab.classList.add('chat-tab');
        chatTab.dataset.username = friendUsername;
        chatTab.textContent = friendUsername;
        this.chatTabsContainer.appendChild(chatTab);
    }

    establishWebSocket(friendUsername) {
        // Close existing socket if exists
        if (this.activeSockets[friendUsername]) {
            this.activeSockets[friendUsername].close();
        }

        // Create new WebSocket
        const socket = new WebSocket(`ws://localhost:8000/chat/${this.currentUser}/${friendUsername}`);

        socket.onopen = () => {
            console.log(`WebSocket opened with ${friendUsername}`);
        };

        socket.onmessage = (event) => {
            this.displayMessage(friendUsername, event.data, false);
        };

        socket.onclose = () => {
            delete this.activeSockets[friendUsername];
        };

        // Idle timeout
        let idleTimeout = setTimeout(() => {
            socket.close();
        }, 10 * 60 * 1000); // 10 minutes

        // Reset idle timeout on activity
        socket.addEventListener('message', () => {
            clearTimeout(idleTimeout);
            idleTimeout = setTimeout(() => {
                socket.close();
            }, 10 * 60 * 1000);
        });

        this.activeSockets[friendUsername] = socket;
    }

    sendMessage(friendUsername, message) {
        const socket = this.activeSockets[friendUsername];
        if (socket && socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({
                from: this.currentUser,
                to: friendUsername,
                message: message
            }));
            this.displayMessage(friendUsername, message, true);
        }
    }

    displayMessage(friendUsername, message, isSent = false) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('chat-message');
        messageElement.classList.add(isSent ? 'sent' : 'received');
        messageElement.textContent = message;
        
        // Find or create chat tab for this friend
        let chatTab = document.querySelector(`[data-username="${friendUsername}"]`);
        if (!chatTab) {
            this.createChatTab(friendUsername);
        }

        this.chatMessages.appendChild(messageElement);
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    }

    setupEventListeners() {
        // Add direct username chat input
        const usernameInput = document.createElement('input');
        usernameInput.id = 'direct-username-input';
        usernameInput.type = 'text';
        usernameInput.placeholder = 'Enter username';
        
        const startChatButton = document.createElement('button');
        startChatButton.textContent = 'Start Chat';
        startChatButton.addEventListener('click', () => {
            const username = usernameInput.value.trim();
            if (username) {
                this.openChatWithFriend(username);
                usernameInput.value = '';
            }
        });

        // Insert these elements near the chat input
        const chatInputContainer = document.getElementById('chat-input');
        chatInputContainer.insertBefore(startChatButton, chatInputContainer.firstChild);
        chatInputContainer.insertBefore(usernameInput, chatInputContainer.firstChild);

        // Existing event listeners...
        // this.chatHeader.addEventListener('click', this.toggleChat.bind(this));
        this.chatSendButton.addEventListener('click', this.handleSendMessage.bind(this));
        
        // Friends list toggle listener
        // this.showFriendsBtn.addEventListener('click', () => {
        //     this.friendListContainer.classList.toggle('visible');
        // });
    }

    handleSendMessage() {
        const message = this.chatInput.value.trim();
        const activeTab = document.querySelector('.chat-tab.active');
        
        if (message && activeTab) {
            const friendUsername = activeTab.dataset.username;
            this.sendMessage(friendUsername, message);
            this.chatInput.value = '';
        }
    }

    toggleChat() {
        this.chatContainer.classList.toggle('minimized');
        this.chatContainer.classList.toggle('expanded');
        this.chatMinimize.textContent = this.chatContainer.classList.contains('minimized') ? '+' : '-';
    }

    getAuthToken() {
        // Implement token retrieval logic
        const access_token = this.getCookie('access_token');
        console.log('1-Access Token:', access_token);
        return access_token;
    }

    getCookie(name) {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) {
            const cookieValue = parts.pop().split(";").shift();
            return cookieValue;
        }
        return null;
    }
}

// chat-manager.js
export class ChatManager {
    constructor() {
        console.log('Initializing ChatManager');
        this.initialized = false;
        this.currentUser = null;
        this.activeChats = new Map();
        this.friends = new Set();
        this.initializeElements();
        this.attachEventListeners();
    }

    initializeElements() {
        // Cache DOM elements
        this.elements = {
            container: document.getElementById('chat-container'),
            header: document.getElementById('chat-header'),
            minimize: document.getElementById('chat-minimize'),
            messages: document.getElementById('chat-messages'),
            input: document.getElementById('chat-message-input'),
            sendButton: document.getElementById('chat-send-button'),
            usernameInput: document.getElementById('direct-username-input'),
            startChatBtn: document.getElementById('start-direct-chat-btn'),
            friendsList: document.getElementById('friend-list'),
            showFriendsBtn: document.getElementById('show-friends-btn'),
            closeFriendsBtn: document.getElementById('close-friends-list'),
            chatTabs: document.getElementById('chat-tabs'),
            connectionStatus: document.getElementById('connection-status')
        };
    }

    attachEventListeners() {
        console.log('Attaching event listeners');
        // Minimize/Maximize chat
        this.elements.minimize.addEventListener('click', () => this.toggleChat());
        
        // Show/Hide friends list
        this.elements.showFriendsBtn.addEventListener('click', () => this.toggleFriendsList());
        this.elements.closeFriendsBtn.addEventListener('click', () => this.toggleFriendsList());
        
        // Message sending
        // this.elements.sendButton.addEventListener('click', () => this.sendMessage());
        // this.elements.input.addEventListener('keypress', (e) => {
        //     if (e.key === 'Enter') this.sendMessage();
        // });
        
        // Start new chat
        this.elements.startChatBtn.addEventListener('click', () => this.startNewChat());
        this.elements.usernameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.startNewChat();
        });
    }

    login(username) {
        this.currentUser = username;
        this.elements.connectionStatus.className = 'status-online';
        this.addSystemMessage(`Logged in as ${username}`);
        // Here you would typically connect to your chat server
    }

    toggleChat() {
        console.log('Toggling chat');
        const isMinimized = this.elements.container.classList.toggle('minimized');
        this.elements.minimize.textContent = isMinimized ? '+' : '-';
    }

    toggleFriendsList() {
        this.elements.friendsList.classList.toggle('hidden');
    }

    startNewChat() {
        const username = this.elements.usernameInput.value.trim();
        if (!username) return;
        
        if (!this.activeChats.has(username)) {
            this.createNewChatTab(username);
            this.elements.usernameInput.value = '';
        }
        
        this.activateChat(username);
    }

    createNewChatTab(username) {
        const tab = document.createElement('div');
        tab.className = 'chat-tab';
        tab.dataset.username = username;
        tab.innerHTML = `
            <span class="tab-name">${username}</span>
            <button class="close-tab">×</button>
        `;
        
        tab.querySelector('.close-tab').addEventListener('click', (e) => {
            e.stopPropagation();
            this.closeChat(username);
        });
        
        tab.addEventListener('click', () => this.activateChat(username));
        
        this.elements.chatTabs.appendChild(tab);
        this.activeChats.set(username, {
            messages: [],
            tab: tab
        });
    }

    activateChat(username) {
        // Remove active class from all tabs
        this.elements.chatTabs.querySelectorAll('.chat-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        
        // Activate the selected tab
        const chatData = this.activeChats.get(username);
        if (chatData) {
            chatData.tab.classList.add('active');
            this.displayMessages(username);
        }
    }

    closeChat(username) {
        const chatData = this.activeChats.get(username);
        if (chatData) {
            chatData.tab.remove();
            this.activeChats.delete(username);
            
            // Activate another chat if available
            const nextChat = this.activeChats.keys().next().value;
            if (nextChat) {
                this.activateChat(nextChat);
            } else {
                this.elements.messages.innerHTML = '';
            }
        }
    }

    sendMessage() {
        const message = this.elements.input.value.trim();
        if (!message) return;

        const activeTab = this.elements.chatTabs.querySelector('.chat-tab.active');
        if (!activeTab) {
            this.addSystemMessage('Please select a chat first');
            return;
        }

        const recipient = activeTab.dataset.username;
        this.addMessage(recipient, message, true);
        this.elements.input.value = '';
        
        // Here you would typically send the message to your chat server
        // For demo purposes, we'll simulate a response
        setTimeout(() => {
            this.addMessage(recipient, `Echo: ${message}`, false);
        }, 1000);
    }

    addMessage(username, content, isSent) {
        const chatData = this.activeChats.get(username);
        if (!chatData) return;

        const message = {
            content,
            timestamp: new Date(),
            isSent
        };

        chatData.messages.push(message);
        
        if (this.elements.chatTabs.querySelector('.chat-tab.active')?.dataset.username === username) {
            this.displayMessage(message);
        }
    }

    addSystemMessage(content) {
        const messageElement = document.createElement('div');
        messageElement.className = 'chat-message system';
        messageElement.textContent = content;
        this.elements.messages.appendChild(messageElement);
        this.elements.messages.scrollTop = this.elements.messages.scrollHeight;
    }

    displayMessage(message) {
        const messageElement = document.createElement('div');
        messageElement.className = `chat-message ${message.isSent ? 'sent' : 'received'}`;
        messageElement.textContent = message.content;
        this.elements.messages.appendChild(messageElement);
        this.elements.messages.scrollTop = this.elements.messages.scrollHeight;
    }

    displayMessages(username) {
        const chatData = this.activeChats.get(username);
        if (!chatData) return;

        this.elements.messages.innerHTML = '';
        chatData.messages.forEach(message => this.displayMessage(message));
    }
}

import { getCookie } from "../../js/rendringData.js";
import { setUsername } from "../../js/main.js";

export async function check_expiration (route) {
    const access_token = getCookie('access_token');
    const response = await fetch('http://localhost:8000/api/user_data/', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${access_token}`,
            'Content-Type': 'application/json',
        },
    });
    if(response.ok){
        const responseData = await response.json();

        setUsername(responseData.login);
        console.log("User is logged in");
        combinedChat.login(username);
        return true;
    }
    else {
        console.error('Failed to fetch data, user not logged in anymore');
        // first checking if token expired 
        // if (route != '/login' && route != '/signup' ) {
        const refresh_token = getCookie('refresh_token');
        console.log ("1-refresh_token = ", refresh_token);
        if (refresh_token) {
            console.log ("2-refresh_token = ", refresh_token);

            const refreshResponse = await fetch("http://localhost:8000/api/token_refresh/", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ refresh: refresh_token }),
            });
    
            if (refreshResponse.ok) {
                const data = await refreshResponse.json();
                document.cookie = `access_token=${data.access}; path=/; Secure`;
                document.cookie = `refresh_token=${data.refresh}; path=/; Secure`;
                const response = await fetch('http://localhost:8000/api/user_data/', {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${data.access}`,
                        'Content-Type': 'application/json',
                    },
                });
                if(response.ok){
                    const responseData = await response.json();
            
                    setUsername(responseData.login);
                    combinedChat.login(username);
                    return true;
                }
                else {
                    cleanupPreviousMode ();
                    throw new Error("need to log in or sign up first");
                }
            }
            else {
                cleanupPreviousMode ();
                throw new Error("need to log in or sign up first");
            }
        }
        else {
            cleanupPreviousMode ();
            throw new Error("need to log in or sign up first");
            console.error ("no valid")
        }
        // }
        return false;
    }
}


export function toggleButtons(play) {
    const modeButtons = document.getElementById('mode-selection');
    // const tournamentControls = document.getElementById('tournament-controls');
    const closeButton = document.getElementById('close-button');
    
    if (!playing && !play) {
        // redirect to dashboard
        console.log("redirecting to dashboard : ", play, playing);
        handling_navigation('/dashboard');
    } else if (play) {
        modeButtons.style.display = 'none';
        // tournamentControls.style.display = 'none';
        closeButton.style.display = 'block';
        playing = true;
    } else if (!play && playing) {
        modeButtons.style.display = 'flex';
        // tournamentControls.style.display = 'flex';
        closeButton.style.display = 'block';
        playing = false;
    }
}

export async function startGame(mode, online, friend) {
    try {
        await check_expiration('/ping');
    }
    catch (error) {
        console.error('Failed to fetch data, user not logged in anymore');
        cleanupPreviousMode ();
        return (handling_navigation('/login'));
    }

    console.log("Starting game: ", mode, "for user: ", username);
    cleanupPreviousMode();
    
    const gameContainer = document.getElementById('game-container');
    const newCanvas = document.createElement('div');
    newCanvas.id = 'gameCanvas';
    gameContainer.appendChild(newCanvas);
    
    const wsUrl = "ws://localhost:8002/ws/pong/";
    currentGame = new Game();
    currentGame.online = online;
    currentWebSocket = new WebSocketManager(wsUrl, currentGame, mode, username, friend);
    
    currentGame.animate();
    
    toggleButtons(true);
    console.log("Game started");
}

// combined-chat-manager.js
export class CombinedChatManager {
    constructor() {
        this.initialized = false;
        this.currentUser = null;
        this.activeChats = new Map();
        this.activeSockets = {};
        this.friends = new Set();
        this.activeTab = null;
        this.socket = null;
        this.initializeElements();
        this.attachEventListeners();
    }

    initializeElements() {
        this.elements = {
            container: document.getElementById('chat-container'),
            header: document.getElementById('chat-header'),
            minimize: document.getElementById('chat-minimize'),
            messages: document.getElementById('chat-messages'),
            input: document.getElementById('chat-message-input'),
            sendButton: document.getElementById('chat-send-button'),
            usernameInput: document.getElementById('direct-username-input'),
            startChatBtn: document.getElementById('start-direct-chat-btn'),
            friendsList: document.getElementById('friend-list'),
            showFriendsBtn: document.getElementById('show-friends-btn'),
            closeFriendsBtn: document.getElementById('close-friends-list'),
            chatTabs: document.getElementById('chat-tabs'),
            connectionStatus: document.getElementById('connection-status'),
            gameInvite: document.getElementById('invite-to-game')
        };
    }

    attachEventListeners() {
        // UI Controls
        // this.elements.header.addEventListener('click', () => this.toggleMaximize());
        document.querySelector('.maximize-btn').addEventListener('click', function(e) {
            e.stopPropagation();
            document.getElementById('chat-container').classList.remove('minimized');
          });
        this.elements.minimize.addEventListener('click', () => this.toggleChat());
        this.elements.showFriendsBtn.addEventListener('click', () => this.toggleFriendsList());
        this.elements.closeFriendsBtn.addEventListener('click', () => this.toggleFriendsList());
        
        // Chat Controls
        this.elements.sendButton.addEventListener('click', () => this.handleSendMessage());
        this.elements.input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleSendMessage();
        });
        
        // New Chat
        this.elements.startChatBtn.addEventListener('click', () => this.startNewChat());
        this.elements.usernameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.startNewChat();
        });

        this.elements.gameInvite.addEventListener('click', () => this.sendGameInvite());

        // clicking on chat tabs to actiavate chat
        // this.elements.chatTabs.addEventListener('click', (e) => {
        //     if (e.target.classList.contains('chat-tab')) {
        //         console.log('Tab clicked:', e.target.dataset.username);
        //         this.activateChat(e.target.dataset.username);
        //     }
        // });
    }

    async login(username) {
        try {
            const response = await fetch('/api/user_data/', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.getAuthToken()}`
                }
            });

            if (response.ok) {
                this.currentUser = username;
                this.elements.connectionStatus.className = 'status-online';
                console.log('Login successful:', username);
                // await this.fetchFriendList();
                if (this.socket == null) {
                    this.addSystemMessage(`Logged in as ${username}`);
                    this.establishStandByWebSocket();
                }
            }
        } catch (error) {
            console.error('Login failed:', error);
            this.addSystemMessage('Login failed. Please try again.');
        }
    }

    async fetchFriendList() {
        try {
            const response = await fetch('/api/friends', {
                headers: {
                    'Authorization': `Bearer ${this.getAuthToken()}`
                }
            });
            
            const friends = await response.json();
            this.friends = new Set(friends.map(f => f.username));
            this.renderFriendList();
        } catch (error) {
            console.error('Failed to fetch friends:', error);
        }
    }

    renderFriendList() {
        this.elements.friendsList.innerHTML = '';
        this.friends.forEach(username => {
            const friendItem = document.createElement('div');
            friendItem.classList.add('friend-item');
            friendItem.textContent = username;
            friendItem.addEventListener('click', () => this.startNewChat(username));
            this.elements.friendsList.appendChild(friendItem);
        });
    }

    startNewChat(username = null) {
        const chatUsername = username || this.elements.usernameInput.value.trim();
        if (!chatUsername) return;

        // send a request to chat to the other user
        const message = {
            type: 'request',
            from: this.currentUser,
            to: chatUsername
        };
        this.activeSockets[this.currentUser].send(JSON.stringify(message));
        
        // if (!this.activeChats.has(chatUsername)) {
        //     this.createNewChatTab(chatUsername);
        //     this.elements.usernameInput.value = '';
        //     // this.establishWebSocket(chatUsername);
        // }
        
        // this.activateChat(chatUsername);
        this.elements.friendsList.classList.add('hidden');
    }

    createNewChatTab(username) {

        // Check if tab already exists
        if (this.activeChats.has(username)) {
            this.activateChat(username);
            return;
        }

        const tab = document.createElement('div');
        tab.className = 'chat-tab';
        tab.dataset.username = username;
        tab.innerHTML = `
            <span class="tab-name">${username}</span>
            <button class="close-tab">×</button>
        `;
        
        tab.querySelector('.close-tab').addEventListener('click', (e) => {
            e.stopPropagation();
            this.closeChat(username);
        });
        
        tab.addEventListener('click', () => this.activateChat(username));
        
        this.elements.chatTabs.appendChild(tab);
        this.activeChats.set(username, {
            messages: [],
            tab: tab,
            active: false
        });
    }

    async establishStandByWebSocket() {
        console.log('Establishing standby WebSocket connection');
        const socket = new WebSocket(`ws://localhost:8001/chat/`);
        this.socket = socket;

        socket.onopen = () => {
            socket.send(JSON.stringify({
                type: 'standby',
                username: this.currentUser
            }));
            console.log('Standby WebSocket opened');
        };
    
        socket.onmessage = async (event) => {
            try {
                const data = JSON.parse(event.data);
                console.log('Standby socket received:', data);
    
                if (data.type === 'request') {
                    // Create notification element
                    const notificationId = `chat-request-${Date.now()}`;
                    const notification = document.createElement('div');
                    notification.className = 'chat-request-notification';
                    notification.id = notificationId;
                    notification.innerHTML = `
                        <div class="notification-content">
                            <p>Chat request from ${data.from}</p>
                            <div class="notification-buttons">
                                <button class="accept-btn">Accept</button>
                                <button class="decline-btn">Decline</button>
                            </div>
                            <div class="notification-timer">30</div>
                        </div>
                    `;
    
                    document.body.appendChild(notification);
    
                    // Set up timeout for auto-decline
                    let timeLeft = 30;
                    const timerElement = notification.querySelector('.notification-timer');
                    const timerInterval = setInterval(() => {
                        timeLeft--;
                        timerElement.textContent = timeLeft;
                        if (timeLeft <= 0) {
                            handleDecline();
                        }
                    }, 1000);
    
                    // Handle accept
                    const handleAccept = () => {
                        clearInterval(timerInterval);
                        notification.remove();
                        
                        // Send acceptance
                        socket.send(JSON.stringify({
                            type: 'response',
                            from: this.currentUser,
                            to: data.from,
                            accepted: true
                        }));
    
                        // Create new chat UI
                        this.createNewChatTab(data.from);
                        this.activateChat(data.from);
                    };
    
                    // Handle decline
                    const handleDecline = () => {
                        clearInterval(timerInterval);
                        notification.remove();
                        
                        // Send declination
                        socket.send(JSON.stringify({
                            type: 'response',
                            from: this.currentUser,
                            to: data.from,
                            accepted: false
                        }));
                    };
    
                    // Add button event listeners
                    notification.querySelector('.accept-btn').addEventListener('click', handleAccept);
                    notification.querySelector('.decline-btn').addEventListener('click', handleDecline);
    
                    // Auto-remove after 30 seconds
                    setTimeout(() => {
                        if (document.getElementById(notificationId)) {
                            handleDecline();
                        }
                    }, 30000);
                }
                else if (data.type === 'previous_messages') {
                    this.loadPreviousMessages(data.from || this.activeTab, data.messages);
                }
                // Handle chat messages if this socket is being used for an active chat
                else if (data.type === 'message') {
                    const fromUser = data.from;
                    if (this.activeChats.has(fromUser)) {
                        this.addMessage(fromUser, data.message, false);
                    }
                }
                // Handle chat request responses
                else if (data.type === 'response') {
                    if (data.accepted) {
                        this.addSystemMessage(`${data.from} accepted your chat request`);
                        this.createNewChatTab(data.from);
                        this.activateChat(data.from);
                        // send to the backend to add it to connections
                        socket.send(JSON.stringify({
                            type: 'acceptedChat',
                            by: data.from,
                            to: this.currentUser
                        }));
                    } else {
                        this.addSystemMessage(`${data.from} declined your chat request`);
                    }
                }

                else if (data.type === 'close') {
                    console.log(`${data.from} has closed the chat`);
                    // this.closeChat(data.from);
                    this.activeChats.delete(data.from);
                    this.addSystemMessage(`${data.from} has closed the chat`);
                }
                else if (data.type === 'game_invite') {
                    console.log('Game invite received from', data.from);
                    this.addSystemMessage(`Game invite received from ${data.from}`);
                    const notificationId = `game-invite-${Date.now()}`;
                    const notification = document.createElement('div');
                    notification.className = 'chat-request-notification';
                    notification.id = notificationId;
                    notification.innerHTML = `
                        <div class="notification-content">
                            <p>Game invite from ${data.from}</p>
                            <div class="notification-buttons">
                                <button class="accept-btn">Accept</button>
                                <button class="decline-btn">Decline</button>
                            </div>
                            <div class="notification-timer">30</div>
                        </div>
                    `;
    
                    document.body.appendChild(notification);
    
                    // Set up timeout for auto-decline
                    let timeLeft = 30;
                    const timerElement = notification.querySelector('.notification-timer');
                    const timerInterval = setInterval(() => {
                        timeLeft--;
                        timerElement.textContent = timeLeft;
                        if (timeLeft <= 0) {
                            handleDecline();
                        }
                    }, 1000);
    
                    // Handle accept
                    const handleAccept = async () => {
                        clearInterval(timerInterval);
                        notification.remove();
                        
                        // Send acceptance
                        socket.send(JSON.stringify({
                            type: 'game_response',
                            from: this.currentUser,
                            to: data.from,
                            accepted: true
                        }));

                        // Create new chat UI
                        // this.createNewChatTab(data.from);
                        // this.activateChat(data.from);
                        // startthe game
                        
                        handling_navigation('/ping');
                        await startGame('OnlineMultiplayerOpenent', true, data.from);
                    };
    
                    // Handle decline
                    const handleDecline = () => {
                        clearInterval(timerInterval);
                        notification.remove();
                        
                        // Send declination
                        socket.send(JSON.stringify({
                            type: 'game_response',
                            from: this.currentUser,
                            to: data.from,
                            accepted: false
                        }));
                    };
    
                    // Add button event listeners
                    notification.querySelector('.accept-btn').addEventListener('click', handleAccept);
                    notification.querySelector('.decline-btn').addEventListener('click', handleDecline);
    
                    // Auto-remove after 30 seconds
                    setTimeout(() => {
                        if (document.getElementById(notificationId)) {
                            handleDecline();
                        }
                    }, 30000);
                }

                else if (data.type === 'game_response') {
                    if (data.accepted) {
                        this.addSystemMessage(`${data.from} accepted your game invite`);
                        // start the game
                        handling_navigation('/ping');
                        await startGame('OnlineMultiplayerOpenent', true, data.from);
                    } else {
                        this.addSystemMessage(`${data.from} declined your game invite`);
                    }
                }

                else if (data.type === 'error') {
                    console.error('Error:', data.message);
                    this.addSystemMessage(data.message);
                }
            } catch (error) {
                console.error('Error processing message:', error);
            }
        };
    
        socket.onclose = () => {
            console.log('Standby WebSocket closed');
            // Attempt to reconnect after a brief delay
            setTimeout(() => this.establishStandByWebSocket(), 3000);
        };
    
        socket.onerror = (error) => {
            console.error('WebSocket error:', error);
        };
    
        // this.activeSockets.standby = socket;
        this.activeSockets[this.currentUser] = socket;
    }

    // establishWebSocket(friendUsername) {
    //     if (this.activeSockets[friendUsername]) {
    //         this.activeSockets[friendUsername].close();
    //     }

    //     console.log(`Establishing WebSocket connection with ${friendUsername} from ${this.currentUser}`);

    //     const socket = new WebSocket(`ws://localhost:8000/chat/`);

        
    //     socket.onopen = () => {
    //         socket.send(JSON.stringify({
    //             type: 'init',
    //             from: this.currentUser,
    //             to: friendUsername
    //         }));
    //         console.log(`WebSocket opened with ${friendUsername}`);
    //         this.addSystemMessage(`Connected to chat with ${friendUsername}`);
    //     };

    //     socket.onmessage = (event) => {
    //         try {
    //             const data = JSON.parse(event.data);
    //             console.log(data);
    //             // Only process messages intended for this chat
    //             if (data.from === friendUsername || data.to === friendUsername) {
    //                 this.addMessage(friendUsername, data.message, data.from === this.currentUser);
    //             }
    //         } catch (error) {
    //             console.error('Error processing message:', error);
    //         }
    //     };

    //     socket.onclose = () => {
    //         console.log(`WebSocket closed with ${friendUsername}`);
    //         delete this.activeSockets[friendUsername];
    //         this.addSystemMessage(`Disconnected from chat with ${friendUsername}`);
    //     };

    //     socket.onerror = (error) => {
    //         console.error('WebSocket error:', error);
    //         this.addSystemMessage('Connection error. Please try again.');
    //     };

    //     // Idle timeout handling
    //     let idleTimeout = setTimeout(() => socket.close(), 10 * 60 * 1000);
    //     socket.addEventListener('message', () => {
    //         clearTimeout(idleTimeout);
    //         idleTimeout = setTimeout(() => socket.close(), 10 * 60 * 1000);
    //     });

    //     this.activeSockets[friendUsername] = socket;
    // }

    sendGameInvite() {
        const activeTab = this.elements.chatTabs.querySelector('.chat-tab.active');
        if (!activeTab) {
            this.addSystemMessage('Please select a chat first');
            return;
        }

        const recipient = activeTab.dataset.username;
        const message = {
            type: 'game_invite',
            from: this.currentUser,
            to: recipient
        };
        this.activeSockets[this.currentUser].send(JSON.stringify(message));
        this.addSystemMessage(`Game invite sent to ${recipient}`);
    }

    handleSendMessage() {
        const message = this.elements.input.value.trim();
        if (!message) return;

        const activeTab = this.elements.chatTabs.querySelector('.chat-tab.active');
        if (!activeTab) {
            this.addSystemMessage('Please select a chat first');
            return;
        }
        console.log('Chat not initialized. Requesting chat...',activeTab.dataset.username, this.activeChats.has(activeTab.dataset.username));

        if (!this.activeChats.has(activeTab.dataset.username)) {
            this.addSystemMessage('Chat not initialized. Please Request a chat first');            

            // const button = this.elements.messages.querySelector('.request-chat-button');
            // Check if the button already exists in the chat area
            // if (!this.elements.messages.querySelector('.request-chat-button')) {
                console.log('Creating request chat button');
                // Create the "Request Chat" button
                const requestButton = document.createElement('button');
                requestButton.className = 'request-chat-button';
                requestButton.textContent = 'Request Chat';
                requestButton.style.padding = '10px 20px';
                requestButton.style.marginTop = '10px';
                requestButton.style.border = '1px solid #ccc';
                requestButton.style.borderRadius = '5px';
                requestButton.style.cursor = 'pointer';
                requestButton.style.background = '#f0f0f0';
                requestButton.style.display = 'block'; // Ensure it appears as a block-level element


                // Add click event listener to the button
                requestButton.addEventListener('click', () => {
                    console.log('Requesting chat with', activeTab.dataset.username);
                    const message = {
                        type: 'request',
                        from: this.currentUser,
                        to: activeTab.dataset.username
                    };
                    this.activeSockets[this.currentUser].send(JSON.stringify(message));
                    this.addSystemMessage(`Chat request sent to ${activeTab.dataset.username}`);
                    requestButton.disabled = true; // Disable the button after the request
                    requestButton.textContent = 'Request Sent';
                    requestButton.style.background = '#d3d3d3';
                    requestButton.style.cursor = 'default';
                });

                // Add the button as a system message
                const buttonContainer = document.createElement('div');
                buttonContainer.className = 'chat-message system';
                buttonContainer.appendChild(requestButton);
                this.elements.messages.appendChild(buttonContainer);

                // Scroll to the bottom of the chat area
                this.elements.messages.scrollTop = this.elements.messages.scrollHeight;
            // }

            return;
        }

        const recipient = activeTab.dataset.username;
        this.sendMessage(recipient, message);
        this.elements.input.value = '';
    }

    sendMessage(friendUsername, message) {
        const socket = this.activeSockets[this.currentUser];
        if (socket && socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({
                type: 'message',
                from: this.currentUser,
                to: friendUsername,
                message: message
            }));
            this.addMessage(friendUsername, message, true);
        } else {
            this.addSystemMessage('Connection lost. Attempting to reconnect...');
            // this.establishWebSocket(friendUsername);
        }
    }

    activateChat(username) {
        if (!this.activeChats.has(username)) return;

        // Deactivate current active tab
        if (this.activeTab) {
            const currentActiveChat = this.activeChats.get(this.activeTab);
            if (currentActiveChat) {
                currentActiveChat.tab.classList.remove('active');
                currentActiveChat.active = false;
            }
        }

        // Activate new tab
        const chat = this.activeChats.get(username);
        chat.tab.classList.add('active');
        chat.active = true;
        this.activeTab = username;

        // Clear and display messages for this chat
        this.elements.messages.innerHTML = '';
        chat.messages.forEach(msg => {
            this.displayMessage(msg.sender, msg.message, msg.timestamp);
        });
    }

    // closeChat(username) {
    //     // if (this.activeSockets[username]) {
    //     //     this.activeSockets[username].close();
    //     //     delete this.activeSockets[username];
    //     // }

    //     const chatData = this.activeChats.get(username);
    //     if (chatData) {
    //         chatData.tab.remove();
    //         console.log('Closing chat with', username);
    //         this.activeChats.delete(username);
            
    //         const nextChat = this.activeChats.keys().next().value;
    //         if (nextChat) {
    //             this.activateChat(nextChat);
    //         } else {
    //             this.elements.messages.innerHTML = '';
    //         }

    //         // send a close notification for the other user
    //         const message = {
    //             type: 'close',
    //             from: this.currentUser,
    //             to: username
    //         };
    //         console.log('Sending close message:', message);
    //         this.activeSockets[this.currentUser].send(JSON.stringify(message));
    //     }
    // }

    closeChat(username) {
        if (!this.activeChats.has(username)) return;

        // Send close message to websocket
        const socket = this.activeSockets[this.currentUser];
        if (socket) {
            socket.send(JSON.stringify({
                type: 'close',
                from: this.currentUser,
                to: username
            }));
        }

        // Remove tab and chat data
        const chat = this.activeChats.get(username);
        chat.tab.remove();
        this.activeChats.delete(username);

        // If this was the active tab, clear messages
        if (this.activeTab === username) {
            this.elements.messages.innerHTML = '';
            this.activeTab = null;

            // Activate another tab if available
            const nextChat = this.activeChats.keys().next().value;
            if (nextChat) {
                this.activateChat(nextChat);
            }
        }
    }

    // addMessage(username, content, isSent) {
    //     const chatData = this.activeChats.get(username);
    //     if (!chatData) return;

    //     const message = {
    //         content,
    //         timestamp: new Date(),
    //         isSent
    //     };

    //     chatData.messages.push(message);
        
    //     if (this.elements.chatTabs.querySelector('.chat-tab.active')?.dataset.username === username) {
    //         this.displayMessage(message);
    //     }
    // }

    addMessage(username, message, isSent = false, timestamp = null) {
        if (!this.activeChats.has(username)) {
            this.createNewChatTab(username);
        }

        const chat = this.activeChats.get(username);
        const messageObj = {
            sender: isSent ? this.currentUser : username,
            message: message,
            timestamp: timestamp || new Date().toISOString()
        };
        
        chat.messages.push(messageObj);

        // If this is the active chat, display the message
        if (this.activeTab === username) {
            this.displayMessage(messageObj.sender, message, messageObj.timestamp);
        } else {
            // Add unread indicator to tab
            chat.tab.classList.add('unread');
        }
    }

    loadPreviousMessages(username, messages) {
        if (!this.activeChats.has(username)) {
            this.createNewChatTab(username);
        }

        const chat = this.activeChats.get(username);
        chat.messages = messages.map(msg => ({
            sender: msg.sender,
            message: msg.message,
            timestamp: msg.timestamp
        }));

        // If this is the active chat, display the messages
        if (this.activeTab === username) {
            this.elements.messages.innerHTML = '';
            chat.messages.forEach(msg => {
                this.displayMessage(msg.sender, msg.message, msg.timestamp);
            });
        }
    }

    addSystemMessage(content) {
        const messageElement = document.createElement('div');
        messageElement.className = 'chat-message system';
        messageElement.textContent = content;
        this.elements.messages.appendChild(messageElement);
        this.elements.messages.scrollTop = this.elements.messages.scrollHeight;
    }

    // displayMessage(message) {
    //     const messageElement = document.createElement('div');
    //     messageElement.className = `chat-message ${message.isSent ? 'sent' : 'received'}`;
    //     messageElement.textContent = message.content;
    //     this.elements.messages.appendChild(messageElement);
    //     this.elements.messages.scrollTop = this.elements.messages.scrollHeight;
    // }
    displayMessage(sender, message, timestamp = null) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `chat-message ${sender === this.currentUser ? 'sent' : 'received'}`;
        
        const time = timestamp ? new Date(timestamp) : new Date();
        const timeStr = time.toLocaleTimeString();
        
        messageDiv.innerHTML = `
            <div class="message-content">
                <span class="message-sender">${sender}</span>
                <p>${message}</p>
                <span class="message-time">${timeStr}</span>
            </div>
        `;
        
        this.elements.messages.appendChild(messageDiv);
        this.elements.messages.scrollTop = this.elements.messages.scrollHeight;
    }

    displayMessages(username) {
        const chatData = this.activeChats.get(username);
        if (!chatData) return;
        this.elements.messages.innerHTML = '';
        chatData.messages.forEach(message => this.displayMessage(message));
    }

    toggleChat() {
        const isMinimized = this.elements.container.classList.toggle('minimized');
        // this.elements.minimize.textContent = isMinimized ? '+' : '-';
    }

    // toggleMaximize() {
    //     if (this.elements.container.classList.contains('minimized')) {
    //         this.elements.container.classList.remove('minimized');
    //         this.elements.minimize.textContent = '-';
    //     }
    // }

    toggleFriendsList() {
        this.elements.friendsList.classList.toggle('hidden');
    }

    getAuthToken() {
        const access_token = this.getCookie('access_token');
        return access_token;
    }

    getCookie(name) {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) {
            return parts.pop().split(";").shift();
        }
        return null;
    }
}

///////////////////////////////////////

class WebSocketEstablisher {
    constructor() {
        // Store active connections
        this.connections = new Map();
        // Queue for pending messages while connection is being established
        this.messageQueue = new Map();
        // Store WebSocket server URL
        this.wsServerUrl = 'ws://localhost:8000/chat/';
        // Initialize the main WebSocket connection for receiving new chat requests
        this.initializeMainSocket();
    }

    initializeMainSocket() {
        // Create main WebSocket connection to listen for new chat requests
        this.mainSocket = new WebSocket(this.wsServerUrl);
        
        this.mainSocket.onopen = () => {
            console.log('Main WebSocket connection established');
        };

        this.mainSocket.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                this.handleIncomingMessage(data);
            } catch (error) {
                console.error('Error processing incoming message:', error);
            }
        };

        this.mainSocket.onclose = () => {
            console.log('Main WebSocket connection closed. Attempting to reconnect...');
            setTimeout(() => this.initializeMainSocket(), 5000);
        };
    }

    handleIncomingMessage(data) {
        console.log ('3--Incoming message:', data);
        switch (data.type) {
            case 'new_chat_request':
                this.handleNewChatRequest(data);
                break;
            case 'chat_accepted':
                this.establishChatConnection(data.from, data.to);
                break;
            case 'chat_declined':
                this.handleDeclinedChat(data.from, data.to);
                break;
            default:
                console.log('Unknown message type:', data.type);
        }
    }

    handleNewChatRequest(data) {
        // Notify the UI of new chat request
        const event = new CustomEvent('newChatRequest', {
            detail: {
                from: data.from,
                to: data.to
            }
        });
        window.dispatchEvent(event);
    }

    establishChatConnection(user1, user2) {
        const chatId = this.generateChatId(user1, user2);
        
        // Check if connection already exists
        if (this.connections.has(chatId)) {
            return this.connections.get(chatId);
        }

        // Create new WebSocket connection for this chat
        const chatSocket = new WebSocket(this.wsServerUrl);
        
        chatSocket.onopen = () => {
            console.log(`Chat connection established between ${user1} and ${user2}`);
            
            // Send any queued messages
            // send a init message to server
            chatSocket.send(JSON.stringify({
                type: 'init',
                from: user1,
                to: user2
            }));
            console.log ("chatid is", chatId, "messageQueue", this.messageQueue);
            if (this.messageQueue.has(chatId)) {
                this.messageQueue.get(chatId).forEach(message => {
                    chatSocket.send(JSON.stringify(message));
                });
                this.messageQueue.delete(chatId);
            }

            // Notify UI that chat is ready
            const event = new CustomEvent('chatEstablished', {
                detail: {
                    chatId,
                    users: [user1, user2]
                }
            });
            console.log ('event', event);
            window.dispatchEvent(event);
        };

        chatSocket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            // Dispatch message to UI
            const messageEvent = new CustomEvent('chatMessage', {
                detail: {
                    chatId,
                    message: data
                }
            });
            console.log ('data', data);
            console.log ('messageEvent', messageEvent);
            window.dispatchEvent(messageEvent);
        };

        chatSocket.onclose = () => {
            this.connections.delete(chatId);
            // Notify UI that chat has been closed
            const event = new CustomEvent('chatClosed', {
                detail: { chatId }
            });
            window.dispatchEvent(event);
        };

        // Set up idle timeout (10 minutes)
        let idleTimeout;
        const resetIdleTimeout = () => {
            clearTimeout(idleTimeout);
            idleTimeout = setTimeout(() => {
                chatSocket.close();
            }, 10 * 60 * 1000);
        };

        chatSocket.addEventListener('message', resetIdleTimeout);
        resetIdleTimeout();

        // Store the connection
        this.connections.set(chatId, chatSocket);
        return chatSocket;
    }

    sendMessage(fromUser, toUser, message) {
        const chatId = this.generateChatId(fromUser, toUser);
        const messageData = {
            type: 'message',
            from: fromUser,
            to: toUser,
            message: message,
            timestamp: new Date().toISOString()
        };

        if (this.connections.has(chatId)) {
            const socket = this.connections.get(chatId);
            if (socket.readyState === WebSocket.OPEN) {
                socket.send(JSON.stringify(messageData));
            } else {
                this.queueMessage(chatId, messageData);
                this.establishChatConnection(fromUser, toUser);
            }
        } else {
            this.queueMessage(chatId, messageData);
            this.establishChatConnection(fromUser, toUser);
        }
    }

    queueMessage(chatId, message) {
        if (!this.messageQueue.has(chatId)) {
            this.messageQueue.set(chatId, []);
        }
        this.messageQueue.get(chatId).push(message);
    }

    generateChatId(user1, user2) {
        // Create consistent chat ID regardless of user order
        return [user1, user2].sort().join('_');
    }

    closeChat(user1, user2) {
        const chatId = this.generateChatId(user1, user2);
        if (this.connections.has(chatId)) {
            this.connections.get(chatId).close();
            this.connections.delete(chatId);
        }
    }

    closeAllConnections() {
        this.connections.forEach(socket => socket.close());
        this.connections.clear();
        this.messageQueue.clear();
        if (this.mainSocket) {
            this.mainSocket.close();
        }
    }
}

class ChatEventHandlers {
    constructor(chatManager) {
        this.chatManager = chatManager;
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        // Listen for new chat requests
        window.addEventListener('newChatRequest', (event) => {
            const { from, to } = event.detail;
            
            // Create notification element
            const notification = document.createElement('div');
            notification.className = 'chat-notification';
            notification.innerHTML = `
                <div class="notification-content">
                    <p>New chat request from ${from}</p>
                    <div class="notification-actions">
                        <button class="accept-chat">Accept</button>
                        <button class="decline-chat">Decline</button>
                    </div>
                </div>
            `;

            // Add notification to DOM
            document.body.appendChild(notification);

            // Handle accept/decline actions
            notification.querySelector('.accept-chat').addEventListener('click', () => {
                this.chatManager.startNewChat(from);
                notification.remove();
            });

            notification.querySelector('.decline-chat').addEventListener('click', () => {
                notification.remove();
                // Send decline message through WebSocket if needed
                if (this.chatManager.activeSockets[from]) {
                    this.chatManager.activeSockets[from].send(JSON.stringify({
                        type: 'chat_declined',
                        from: to,
                        to: from
                    }));
                }
            });

            // Auto-remove notification after 30 seconds
            setTimeout(() => notification.remove(), 30000);
        });

        // Listen for established chat connections
        window.addEventListener('chatEstablished', (event) => {
            const { chatId, users } = event.detail;
            console.log('Chat established:', this.chatManager.activeChats, chatId, users);
            const otherUser = users.find(user => user !== this.chatManager.currentUser);

            console.log('Chat established with:', otherUser);
            
            // Create new chat tab if it doesn't exist
            if (!this.chatManager.activeChats.has(otherUser)) {
                this.chatManager.createNewChatTab(otherUser);
                this.chatManager.addSystemMessage(`Chat connected with ${otherUser}`);
                this.chatManager.activateChat(otherUser);
            }
            
            // Activate the chat tab

            // Update UI to show connected status
            const chatTab = document.querySelector(`[data-username="${otherUser}"]`);
            if (chatTab) {
                chatTab.classList.add('connected');
            }
            console.log('Chat established:', this.chatManager.activeChats, chatId, users);

        });

        // Listen for chat messages
        window.addEventListener('chatMessage', (event) => {
            const { chatId, message } = event.detail;

            console.log('Chat message received:', chatId, message);
            
            // Check if this is a previous messages batch
            if (message.type === 'previous_messages') {
                console.log('Processing previous messages:', message.messages);
                
                // // Iterate through the array of previous messages
                // message.messages.forEach(msg => {
                //     const { from, to, message: content, timestamp } = msg;
                //     this.processMessage(from, to, content, timestamp);
                // });
            } else {
                // Handle single message
                const { from, to, message: content } = message;

                console.log('Processing single message:', message);
                this.processMessage(from, to, content);
            }
        });
        
        
        // Listen for closed chats
        window.addEventListener('chatClosed', (event) => {
            const { chatId } = event.detail;
            const [user1, user2] = chatId.split('_');
            const otherUser = user1 === this.chatManager.currentUser ? user2 : user1;
            
            // Remove chat tab and cleanup
            this.chatManager.closeChat(otherUser);
            
            // Show disconnection message
            this.chatManager.addSystemMessage(`Chat with ${otherUser} has been disconnected`);
            
            // Remove 'connected' status from tab if it still exists
            const chatTab = document.querySelector(`[data-username="${otherUser}"]`);
            if (chatTab) {
                chatTab.classList.remove('connected');
            }
        });
    }

    // Helper method to process both types of messages
    processMessage(from, to, content, timestamp = null) {
        // Determine if message is sent or received
        const isSent = from === this.chatManager.currentUser;
        const otherUser = isSent ? to : from;

        // console.log('Processing message:', from, to, content, timestamp, otherUser);
    
        // Create chat tab if it doesn't exist (for first message)
        if (!this.chatManager.activeChats.has(otherUser)) {
            this.chatManager.createNewChatTab(otherUser);
        }
    
        // Add message to chat
        this.chatManager.addMessage(otherUser, content, isSent, timestamp);
    
        // console.log('Message processed:', content);
    
        // Only show notifications and play sounds for new messages, not previous ones
        if (!timestamp) {
            // Show notification if chat is not active
            const activeTab = document.querySelector('.chat-tab.active');
            if (!isSent && (!activeTab || activeTab.dataset.username !== otherUser)) {
                this.showMessageNotification(from, content);
            }
    
            // Play notification sound for received messages
            if (!isSent) {
                this.playMessageSound();
            }
        }
    }

    showMessageNotification(from, content) {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = 'message-notification';
        notification.innerHTML = `
        <div class="notification-content">
        <strong>${from}</strong>: ${this.truncateMessage(content)}
        </div>
        `;

        // Add notification to DOM
        document.body.appendChild(notification);

        // Remove notification after 5 seconds
        setTimeout(() => notification.remove(), 5000);

        // Handle click to focus chat
        notification.addEventListener('click', () => {
            this.chatManager.activateChat(from);
            notification.remove();
        });
    }

    truncateMessage(message, length = 50) {
        if (message.length <= length) return message;
        return message.substring(0, length) + '...';
    }

    playMessageSound() {
        // Create and play notification sound
        const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YWoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBhRxu/LhnzEFBDaR3/mytRAAAyKr/fnhkxcAEVTK/O7MfwYAK3/s/tinaQAGWsX/8cJ5AQBNp/v/x4UCAAhj3f/rqWEAAD+6/v/sjwMADm7n/96LPwAAUND//tW5CgAZhOz/x3wwAABPz///0IEFAAtx9f/WhCoAAETR//7biwAAB2n4/8x7JgAAQOL//9mIBAAFZ/j/w3UiAAA87f//1YYDAANq+f/GdB4AADr0//7ThgEAAWj6/8BxHAAANvr//9KGAQABZ/v/vW8aAAA1///+0YUAAAB0/P+7bBgAADGF//7WgwAAAXL7/7xsFwABM43//tOCAAAAcvv/umkWAAA2lv/+zXUAAABz/v+8aRUAADSd//7NdwAAAHX9/7tmFAAAM6P//sp0AAAAdv3/uWYTAAAyqP/+yHIAAAB3/f+3ZBEAADJ0//7GcQAAAHj9/7RjEAAAL3v//sRvAAAAef3/s2EPAAAuhP/+wm4AAAB6/f+xYA4AACyO//7AbQAAAHv9/69fDQAAKpj//r5rAAAAfP3/rV4MAAAo7//+vGsAAAB8/f+rXQsAACH1//66aQAAAH39/6lcCgAAIP///rhoAAAAff3/p1sJAAAAAAD+t2cAAAB+/f+lWggAAP////61ZgAAAH79/6NZBwAA/////rNkAAAAf/3/oVgGAAD/////sWMAAACA/f+fVwUAAP////+vYgAAAIH9/51WBAAA/////61hAAAAgf3/m1UDAAD/////q2AAAAACAgICAgYGBgYICQkJCQoLCwsLDQ0NDQ4PDw8PEBAQEBESEhISFBQUFBUXFwAAAAAAAAAAAAAAACH5BAEAAAEALAAAAAASAAMAAAIdhAOZh+ffplZnXomeXJ6Kc12gJnJch4aqyUkuAAA7');
        audio.play().catch(err => console.log('Error playing notification sound:', err));
    }
}

class IntegratedChatManager {
    constructor() {
        this.initialized = false;
        this.currentUser = null;
        this.activeChats = new Map();
        this.activeSockets = {};
        this.friends = new Set();
        this.initializeElements();
        this.wsEstablisher = new WebSocketEstablisher();
        this.eventHandlers = new ChatEventHandlers(this);
        this.attachEventListeners();
    }

    initializeElements() {
        this.elements = {
            container: document.getElementById('chat-container'),
            header: document.getElementById('chat-header'),
            minimize: document.getElementById('chat-minimize'),
            messages: document.getElementById('chat-messages'),
            input: document.getElementById('chat-message-input'),
            sendButton: document.getElementById('chat-send-button'),
            usernameInput: document.getElementById('direct-username-input'),
            startChatBtn: document.getElementById('start-direct-chat-btn'),
            friendsList: document.getElementById('friend-list'),
            showFriendsBtn: document.getElementById('show-friends-btn'),
            closeFriendsBtn: document.getElementById('close-friends-list'),
            chatTabs: document.getElementById('chat-tabs'),
            connectionStatus: document.getElementById('connection-status')
        };
    }

    attachEventListeners() {
        // UI Controls
        this.elements.minimize.addEventListener('click', () => this.toggleChat());
        this.elements.showFriendsBtn.addEventListener('click', () => this.toggleFriendsList());
        this.elements.closeFriendsBtn.addEventListener('click', () => this.toggleFriendsList());
        
        // Chat Controls
        this.elements.sendButton.addEventListener('click', () => this.handleSendMessage());
        this.elements.input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleSendMessage();
        });
        
        // New Chat
        this.elements.startChatBtn.addEventListener('click', () => this.startNewChat());
        this.elements.usernameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.startNewChat();
        });
    }

    async login(username) {
        try {
            const response = await fetch('/api/user_data/', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.getAuthToken()}`
                }
            });
            
            if (response.ok) {
                this.currentUser = username;
                this.elements.connectionStatus.className = 'status-online';
                this.addSystemMessage(`Logged in as ${username}`);
                console.log('Login successful:', username);
                // await this.fetchFriendList();
            }
        } catch (error) {
            console.error('Login failed:', error);
            this.addSystemMessage('Login failed. Please try again.');
        }
    }

    startNewChat(username = null) {
        const chatUsername = username || this.elements.usernameInput.value.trim();
        if (!chatUsername) return;
        
        // Create chat tab if it doesn't exist
        if (!this.activeChats.has(chatUsername)) {
            this.createNewChatTab(chatUsername);
            this.elements.usernameInput.value = '';
            
            // Establish WebSocket connection through WebSocketEstablisher
            this.wsEstablisher.establishChatConnection(this.currentUser, chatUsername);
        }
        
        this.activateChat(chatUsername);
        this.elements.friendsList.classList.add('hidden');
    }

    handleSendMessage() {
        const message = this.elements.input.value.trim();
        if (!message) return;
        
        const activeTab = this.elements.chatTabs.querySelector('.chat-tab.active');
        if (!activeTab) {
            this.addSystemMessage('Please select a chat first');
            return;
        }
        
        const recipient = activeTab.dataset.username;
        this.wsEstablisher.sendMessage(this.currentUser, recipient, message);
        this.elements.input.value = '';
    }

    createNewChatTab(username) {
        const tab = document.createElement('div');
        tab.className = 'chat-tab';
        tab.dataset.username = username;
        tab.innerHTML = `
            <span class="tab-name">${username}</span>
            <button class="close-tab">×</button>
        `;
        
        tab.querySelector('.close-tab').addEventListener('click', (e) => {
            e.stopPropagation();
            this.closeChat(username);
        });
        
        tab.addEventListener('click', () => this.activateChat(username));
        
        this.elements.chatTabs.appendChild(tab);
        this.activeChats.set(username, {
            messages: [],
            tab: tab
        });
    }

    closeChat(username) {
        // Close WebSocket connection through WebSocketEstablisher
        this.wsEstablisher.closeChat(this.currentUser, username);
        
        const chatData = this.activeChats.get(username);
        if (chatData) {
            chatData.tab.remove();
            this.activeChats.delete(username);
            
            const nextChat = this.activeChats.keys().next().value;
            if (nextChat) {
                this.activateChat(nextChat);
            } else {
                this.elements.messages.innerHTML = '';
            }
        }
    }

    addMessage(username, content, isSent) {
        const chatData = this.activeChats.get(username);
        if (!chatData) return;
        
        const message = {
            content,
            timestamp: new Date(),
            isSent
        };
        chatData.messages.push(message);
        
        if (this.elements.chatTabs.querySelector('.chat-tab.active')?.dataset.username === username) {
            this.displayMessage(message);
        }
    }

    activateChat(username) {
        this.elements.chatTabs.querySelectorAll('.chat-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        
        const chatData = this.activeChats.get(username);
        if (chatData) {
            chatData.tab.classList.add('active');
            this.displayMessages(username);
        }
    }

    displayMessage(message) {
        const messageElement = document.createElement('div');
        messageElement.className = `chat-message ${message.isSent ? 'sent' : 'received'}`;
        messageElement.textContent = message.content;
        this.elements.messages.appendChild(messageElement);
        this.elements.messages.scrollTop = this.elements.messages.scrollHeight;
    }

    displayMessages(username) {
        const chatData = this.activeChats.get(username);
        if (!chatData) return;
        this.elements.messages.innerHTML = '';
        chatData.messages.forEach(message => this.displayMessage(message));
    }

    addSystemMessage(content) {
        const messageElement = document.createElement('div');
        messageElement.className = 'chat-message system';
        messageElement.textContent = content;
        this.elements.messages.appendChild(messageElement);
        this.elements.messages.scrollTop = this.elements.messages.scrollHeight;
    }

    // Utility methods
    toggleChat() {
        const isMinimized = this.elements.container.classList.toggle('minimized');
        this.elements.minimize.textContent = isMinimized ? '+' : '-';
    }

    toggleFriendsList() {
        this.elements.friendsList.classList.toggle('hidden');
    }

    getAuthToken() {
        return this.getCookie('access_token');
    }

    getCookie(name) {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) {
            return parts.pop().split(";").shift();
        }
        return null;
    }

    // Cleanup method
    destroy() {
        this.wsEstablisher.closeAllConnections();
        this.activeChats.clear();
        this.elements.messages.innerHTML = '';
        this.elements.chatTabs.innerHTML = '';
    }
}

// export default IntegratedChatManager;
// export default WebSocketEstablisher;

// export const combinedChat = new IntegratedChatManager();
export const combinedChat = new CombinedChatManager();
// // Initialize chat on page load
// document.addEventListener('DOMContentLoaded', () => {
//     const gameChat = new GameChat();
    
//     // Example login (you'd replace this with actual login mechanism)
//     gameChat.login('currentUsername');
// });

export { Game , WebSocketManager, GameChat };