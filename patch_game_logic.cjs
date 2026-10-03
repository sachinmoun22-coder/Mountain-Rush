const fs = require('fs');
let code = fs.readFileSync('game.js', 'utf8');

const oldStartLevel = `    startLevel(lid) {
        if (this.gameOverTimeout) {
            clearTimeout(this.gameOverTimeout);
            this.gameOverTimeout = null;
        }
        let level = LEVELS.find(l => l.id === lid) || LEVELS[0];`;

const newStartLevel = `    startLevel(lid) {
        if (this.gameOverTimeout) {
            clearTimeout(this.gameOverTimeout);
            this.gameOverTimeout = null;
        }
        let level = LEVELS.find(l => l.id === lid) || LEVELS[0];
        
        // Save current playing level
        this.save.selectedLevel = level.id;
        SaveManager.save(this.save);
        this.updateMainMenu();`;

code = code.replace(oldStartLevel, newStartLevel);

// Just to be sure we find it
if (!code.includes('this.save.selectedLevel = level.id;')) {
    console.log("Failed to patch startLevel");
}

fs.writeFileSync('game.js', code);
console.log('Patched startLevel');
