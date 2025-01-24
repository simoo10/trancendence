

// Tournament visualization class
class TournamentVisualizer {
    constructor(container) {
        this.container = container;
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        
        this.matches = new Map(); // Store match objects
        this.lines = new Map();   // Store connecting lines
        this.rounds = [];         // Store round information
        
        this.init();
    }
    
    init() {
        // Setup renderer
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.container.appendChild(this.renderer.domElement);
        
        // Setup camera
        this.camera.position.z = 15;
        
        // Add lights
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        const pointLight = new THREE.PointLight(0xffffff, 0.5);
        pointLight.position.set(10, 10, 10);
        this.scene.add(ambientLight, pointLight);
        
        // Handle window resize
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });
        
        this.animate();
    }
    
    createMatchBox(match, position) {
        // Create match box geometry
        const geometry = new THREE.BoxGeometry(2, 1, 0.2);
        const material = new THREE.MeshPhongMaterial({
            color: match.status === 'pending' ? 0xcccccc : 
                   match.status === 'in_progress' ? 0x3498db : 0x2ecc71
        });
        
        const box = new THREE.Mesh(geometry, material);
        box.position.copy(position);
        
        // Add match text
        const player1Text = this.createText(match.player1 ? 'Player 1' : 'TBD', -0.3);
        const player2Text = this.createText(match.player2 ? 'Player 2' : 'TBD', 0.3);
        box.add(player1Text, player2Text);
        
        return box;
    }
    
    createText(text, yOffset) {
        const loader = new THREE.FontLoader();
        return loader.load('helvetiker_regular.typeface.json', (font) => {
            const geometry = new THREE.TextGeometry(text, {
                font: font,
                size: 0.2,
                height: 0.05
            });
            const material = new THREE.MeshPhongMaterial({ color: 0x000000 });
            const textMesh = new THREE.Mesh(geometry, material);
            textMesh.position.y = yOffset;
            return textMesh;
        });
    }
    
    drawConnectingLine(startMatch, endMatch) {
        const points = [
            startMatch.position,
            new THREE.Vector3(
                (startMatch.position.x + endMatch.position.x) / 2,
                startMatch.position.y,
                startMatch.position.z
            ),
            new THREE.Vector3(
                (startMatch.position.x + endMatch.position.x) / 2,
                endMatch.position.y,
                endMatch.position.z
            ),
            endMatch.position
        ];
        
        const curve = new THREE.CatmullRomCurve3(points);
        const geometry = new THREE.TubeGeometry(curve, 20, 0.05, 8, false);
        const material = new THREE.MeshPhongMaterial({ color: 0x95a5a6 });
        
        return new THREE.Mesh(geometry, material);
    }
    
    updateTournament(tournamentData) {
        // Clear existing visualization
        this.matches.forEach(match => this.scene.remove(match));
        this.lines.forEach(line => this.scene.remove(line));
        this.matches.clear();
        this.lines.clear();
        
        // Calculate positions for each round
        const roundSpacing = 4;
        const matchSpacing = 3;
        
        tournamentData.bracket.forEach((round, roundIndex) => {
            const roundX = roundIndex * roundSpacing - (tournamentData.bracket.length * roundSpacing / 2);
            
            round.forEach((match, matchIndex) => {
                const matchY = matchIndex * matchSpacing - (round.length * matchSpacing / 2);
                const position = new THREE.Vector3(roundX, matchY, 0);
                
                // Create and store match box
                const matchBox = this.createMatchBox(match, position);
                this.matches.set(match.match_id, matchBox);
                this.scene.add(matchBox);
                
                // Create connecting line to next round if not final round
                if (roundIndex < tournamentData.bracket.length - 1) {
                    const nextMatch = tournamentData.bracket[roundIndex + 1]
                        .find(m => m.previous_matches?.includes(match.match_id));
                    
                    if (nextMatch) {
                        const line = this.drawConnectingLine(matchBox, this.matches.get(nextMatch.match_id));
                        this.lines.set(`${match.match_id}-${nextMatch.match_id}`, line);
                        this.scene.add(line);
                    }
                }
            });
        });
    }
    
    highlightCurrentMatch(matchId) {
        const match = this.matches.get(matchId);
        if (match) {
            match.material.emissive.setHex(0x555555);
        }
    }
    
    animate() {
        requestAnimationFrame(() => this.animate());
        
        // Add any animations here (e.g., rotating camera, floating matches)
        this.camera.position.x = Math.sin(Date.now() * 0.0005) * 2;
        
        this.renderer.render(this.scene, this.camera);
    }
}

export {TournamentVisualizer}