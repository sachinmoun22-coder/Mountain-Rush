const fs = require('fs');
let code = fs.readFileSync('game.js', 'utf8');

const oldLevelComplete = `        if (this.curLevel.id < LEVELS.length && !this.save.levels[this.curLevel.id+1]) {
            this.save.levels[this.curLevel.id+1] = { unlocked: true, best: 0 };
        }`;

const newLevelComplete = `        if (this.curLevel.id < LEVELS.length && !this.save.levels[this.curLevel.id+1]) {
            this.save.levels[this.curLevel.id+1] = { unlocked: true, best: 0 };
            // Auto-select the newly unlocked level for convenience
            this.save.selectedLevel = this.curLevel.id + 1;
        }`;

if (code.includes('if (this.curLevel.id < LEVELS.length && !this.save.levels[this.curLevel.id+1]) {')) {
    code = code.replace(oldLevelComplete, newLevelComplete);
    fs.writeFileSync('game.js', code);
    console.log('Patched auto select');
} else {
    console.log('Could not patch auto select');
}
