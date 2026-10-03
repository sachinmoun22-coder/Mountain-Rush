const fs = require('fs');
let code = fs.readFileSync('game.js', 'utf8');

const oldTerrain = `class Terrain {
    constructor(diff) {
        this.pts = [];
        this.diff = diff;
        this.genX = 0;
        this.lastY = 320;
        this.segW = 35;
        this.genNext(120);
    }
    
    // Generates authentic Hill Climb Racing rolling mountains, step ridges, and thrilling ramps
    genNext(count) {
        for(let i = 0; i < count; i++) {
            this.genX += this.segW;
            let h = 0;
            
            if (this.genX > 450) {
                // Classic HCR terrain: Smooth sweeping valleys but with sudden dangerous steep climbs
                let base = Math.sin(this.genX * 0.0012) * 160 * this.diff;
                let rolling = Math.sin(this.genX * 0.003 + 1.2) * 90 * this.diff;
                // Sharp drops/climbs created by exponentiating a sine wave (creates localized flat spots and sudden walls)
                let sharp = Math.pow(Math.sin(this.genX * 0.002), 4) * 120 * this.diff;
                let micro = Math.cos(this.genX * 0.015) * 15 * Math.min(1.0, this.diff); // Tiny bumps
                h = base + rolling - sharp + micro;
            }
            
            this.lastY = 340 - h;
            this.pts.push({ x: this.genX, y: this.lastY });
        }
    }`;

const newTerrain = `class Terrain {
    constructor(diff, seed) {
        this.pts = [];
        this.diff = diff;
        this.seed = seed !== undefined ? seed : (Math.random() * 1000);
        this.genX = 0;
        this.lastY = 320;
        this.segW = 35;
        this.genNext(120);
    }
    
    genNext(count) {
        for(let i = 0; i < count; i++) {
            this.genX += this.segW;
            let h = 0;
            
            if (this.genX > 450) {
                // Increased difficulty: steeper and higher mountains
                // Math.sin phase is shifted by this.seed to be random every time
                let base = Math.sin(this.genX * 0.0012 + this.seed) * 260 * this.diff; 
                let rolling = Math.sin(this.genX * 0.003 + this.seed * 2.1) * 150 * this.diff;
                let sharp = Math.pow(Math.sin(this.genX * 0.002 + this.seed * 0.7), 4) * 200 * this.diff;
                let micro = Math.cos(this.genX * 0.015 + this.seed * 1.3) * 25 * Math.min(1.0, this.diff);
                h = base + rolling - sharp + micro;
            }
            
            this.lastY = 340 - h;
            this.pts.push({ x: this.genX, y: this.lastY });
        }
    }`;

if (code.includes('class Terrain {\n    constructor(diff) {')) {
    code = code.replace(oldTerrain, newTerrain);
} else {
    console.log("Could not find exact Terrain class match");
}

// Update instantiation in resumeLevel
code = code.replace(`this.terrain = new Terrain(this.curLevel.diff);`, `this.terrain = new Terrain(this.curLevel.diff, rs.terrainSeed);`);

// Update instantiation in startLevel
code = code.replace(`this.terrain = new Terrain(level.diff);`, `this.terrain = new Terrain(level.diff);`);

// Update runState saving to include seed
code = code.replace(`levelId: this.curLevel.id,
                sessionCoins: this.sessionCoins,`, `levelId: this.curLevel.id,
                terrainSeed: this.terrain.seed,
                sessionCoins: this.sessionCoins,`);

fs.writeFileSync('game.js', code);
console.log('Patched terrain');
