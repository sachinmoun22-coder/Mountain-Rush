const fs = require('fs');
let code = fs.readFileSync('game.js', 'utf8');

const oldTerrain = `            if (this.genX > 450) {
                // Increased difficulty: steeper and higher mountains
                // Math.sin phase is shifted by this.seed to be random every time
                let base = Math.sin(this.genX * 0.0012 + this.seed) * 260 * this.diff; 
                let rolling = Math.sin(this.genX * 0.003 + this.seed * 2.1) * 150 * this.diff;
                let sharp = Math.pow(Math.sin(this.genX * 0.002 + this.seed * 0.7), 4) * 200 * this.diff;
                let micro = Math.cos(this.genX * 0.015 + this.seed * 1.3) * 25 * Math.min(1.0, this.diff);
                h = base + rolling - sharp + micro;
            }`;

const newTerrain = `            if (this.genX > 450) {
                // Smooth transition multiplier to prevent a sudden wall right at the start (450 to 1500)
                let startMultiplier = Math.min(1.0, (this.genX - 450) / 1000);
                
                // Increased difficulty: steeper and higher mountains
                let base = Math.sin(this.genX * 0.0012 + this.seed) * 260 * this.diff; 
                let rolling = Math.sin(this.genX * 0.003 + this.seed * 2.1) * 150 * this.diff;
                let sharp = Math.pow(Math.sin(this.genX * 0.002 + this.seed * 0.7), 4) * 200 * this.diff;
                let micro = Math.cos(this.genX * 0.015 + this.seed * 1.3) * 25 * Math.min(1.0, this.diff);
                
                h = (base + rolling - sharp + micro) * startMultiplier;
            }`;

if (code.includes('if (this.genX > 450) {')) {
    code = code.replace(oldTerrain, newTerrain);
}

fs.writeFileSync('game.js', code);
console.log('Patched terrain smooth');
