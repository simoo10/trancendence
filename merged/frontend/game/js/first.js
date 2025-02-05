// 1. Create a scene
const scene = new THREE.Scene();

// 2. Create a camera
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 5;

// 3. Create a WebGL renderer
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Paddle Creation Code

// Paddle Creation Code

// 1. Create Paddle Face (Circular)
const paddleRadius = 0.5; // Radius of the paddle face
const paddleThickness = 0.1; // Thickness of the paddle face
const paddleFaceGeometry = new THREE.CylinderGeometry(paddleRadius, paddleRadius, paddleThickness, 32);
const paddleFaceMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 }); // Green color
const paddleFace = new THREE.Mesh(paddleFaceGeometry, paddleFaceMaterial);

// 2. Create Paddle Handle (Cylindrical)
const handleRadius = 0.1; // Radius of the handle
const handleHeight = 0.5; // Height of the handle
const paddleHandleGeometry = new THREE.CylinderGeometry(handleRadius, handleRadius, handleHeight, 16);
const paddleHandleMaterial = new THREE.MeshBasicMaterial({ color: 0x00f000 }); // Same color
const paddleHandle = new THREE.Mesh(paddleHandleGeometry, paddleHandleMaterial);

// 3. Position the Paddle Handle
paddleHandle.position.set(0, -0.6, 0); // Positioning it below the face of the paddle

// 4. Rotate the Paddle Face to align it horizontally
paddleFace.rotation.x = Math.PI / 2; // Rotate the face to be horizontal

// 5. Group the Paddle Components
const paddle = new THREE.Group();
paddle.add(paddleFace);
paddle.add(paddleHandle);

// 6. Position the Paddle in the Scene
paddle.position.set(0, -2, 0); // Position it lower on the Y-axis
scene.add(paddle);




// 5. Animation loop
function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}
animate();