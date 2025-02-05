export class Key {
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

// Create an instance to track key states
export let keyState = new Key();

// // Add event listeners to update key states
// window.addEventListener('keydown', (event) => {
//     switch (event.code) {
//         case 'KeyW': keyState.UpKey1 = true; break;
//         case 'KeyS': keyState.DownKey1 = true; break;
//         case 'KeyA': keyState.LeftKey1 = true; break;
//         case 'KeyD': keyState.RightKey1 = true; break;
//         case 'ArrowUp': keyState.UpKey2 = true; break;
//         case 'ArrowDown': keyState.DownKey2 = true; break;
//         case 'ArrowLeft': keyState.LeftKey2 = true; break;
//         case 'ArrowRight': keyState.RightKey2 = true; break;
//     }
//     sendKeyState();
// });

// window.addEventListener('keyup', (event) => {
//     switch (event.code) {
//         case 'KeyW': keyState.UpKey1 = false; break;
//         case 'KeyS': keyState.DownKey1 = false; break;
//         case 'KeyA': keyState.LeftKey1 = false; break;
//         case 'KeyD': keyState.RightKey1 = false; break;
//         case 'ArrowUp': keyState.UpKey2 = false; break;
//         case 'ArrowDown': keyState.DownKey2 = false; break;
//         case 'ArrowLeft': keyState.LeftKey2 = false; break;
//         case 'ArrowRight': keyState.RightKey2 = false; break;
//     }
//     sendKeyState();
// });

// Function to send key state to the backend
export function sendKeyState() {
    fetch('/update-keys/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(keyState),
    });
}