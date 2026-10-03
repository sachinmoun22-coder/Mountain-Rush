const fs = require('fs');
let code = fs.readFileSync('game.js', 'utf8');

// 1. Add runState save logic to update()
const updateHook = `        if (this.veh.x > this.terrain.genX - 1500) {
            this.terrain.genNext(30);
        }
        
        // Auto-save run state every second
        const now = performance.now();
        if (!this.lastSaveTime || now - this.lastSaveTime > 1000) {
            this.lastSaveTime = now;
            this.save.runState = {
                levelId: this.curLevel.id,
                sessionCoins: this.sessionCoins,
                sessionStunts: this.sessionStunts,
                camX: this.camX,
                camY: this.camY,
                veh: {
                    x: this.veh.x,
                    y: this.veh.y,
                    vx: this.veh.vx,
                    vy: this.veh.vy,
                    angle: this.veh.angle,
                    angularVelocity: this.veh.angularVelocity,
                    engineRPM: this.veh.engineRPM,
                    fuel: this.veh.fuel,
                    crashed: this.veh.crashed
                },
                items: this.items.items
            };
            // Also ensure currently collected coins are saved to total coins!
            // Actually, we don't need to add sessionCoins to total coins yet, 
            // because when we resume, sessionCoins is restored.
            SaveManager.save(this.save);
        }`;

code = code.replace(`        if (this.veh.x > this.terrain.genX - 1500) {
            this.terrain.genNext(30);
        }`, updateHook);


// 2. Add resumeLevel method to Game class
const resumeLevelCode = `    resumeLevel() {
        let rs = this.save.runState;
        if (!rs) return;
        
        if (this.gameOverTimeout) {
            clearTimeout(this.gameOverTimeout);
            this.gameOverTimeout = null;
        }
        
        this.curLevel = LEVELS.find(l => l.id === rs.levelId) || LEVELS[0];
        this.env = ENVIRONMENTS.find(e => e.id === this.curLevel.env) || ENVIRONMENTS[0];
        this.terrain = new Terrain(this.curLevel.diff);
        
        let vDef = VEHICLES.find(v => v.id === this.save.selectedVehicle) || VEHICLES[0];
        let vSave = this.save.vehicles[vDef.id] || { unlocked: true, engine: 1, susp: 1, tires: 1, fuel: 1 };
        this.veh = new Vehicle(vDef, vSave, this.terrain);
        
        // Restore vehicle state
        Object.assign(this.veh, rs.veh);
        
        // Fast-forward terrain generation
        while(this.terrain.genX < this.veh.x + 2000) {
            this.terrain.genNext(50);
        }
        
        this.items = new Items();
        this.items.items = rs.items;
        this.particles = new Particles();
        
        this.camX = rs.camX;
        this.camY = rs.camY;
        this.sessionCoins = rs.sessionCoins;
        this.sessionStunts = rs.sessionStunts;
        this.input = { gas: false, brake: false };
        
        ['ui-main', 'ui-garage', 'ui-levels', 'ui-pause', 'ui-game-over', 'ui-level-complete'].forEach(id => {
            let el = document.getElementById(id);
            if (el) el.classList.add('hidden');
        });
        
        let hud = document.getElementById('ui-hud');
        if (hud) hud.classList.remove('hidden');
        let hudEnv = document.getElementById('hud-env');
        if (hudEnv) hudEnv.innerText = this.curLevel.name;
        
        this.state = 'PLAY';
        this.audio.startEngine();
    }
    
    startLevel(lid) {`;

code = code.replace(`    startLevel(lid) {`, resumeLevelCode);


// 3. Check for runState in Game constructor and resume if exists
const constructorHook = `        this.applyControlsLayout();
        
        if (this.save.runState && !this.save.runState.veh.crashed) {
            this.resumeLevel();
        } else {
            this.updateMainMenu();
            this.state = 'MENU';
            if (this.save.runState) {
                delete this.save.runState;
                SaveManager.save(this.save);
            }
        }`;

code = code.replace(`        this.applyControlsLayout();
        this.updateMainMenu();
        this.state = 'MENU';`, constructorHook);

// 4. Remove runState on Game Over / Level Complete so it doesn't resume a dead run
const gameOverHook = `        delete this.save.runState;
        this.state = 'GAMEOVER'; this.audio.stopEngine(); this.audio.stopMusic(); this.audio.playGameOver();`;

code = code.replace(`        this.state = 'GAMEOVER'; this.audio.stopEngine(); this.audio.stopMusic(); this.audio.playGameOver();`, gameOverHook);

const levelCompleteHook = `        delete this.save.runState;
        this.state = 'GAMEOVER'; this.audio.stopEngine(); this.audio.stopMusic(); this.audio.playUpgrade();`;

code = code.replace(`        this.state = 'GAMEOVER'; this.audio.stopEngine(); this.audio.stopMusic(); this.audio.playUpgrade();`, levelCompleteHook);

// 5. Delete runState on restart
const restartHook = `id('btn-restart').onclick = () => { this.audio.playClick(); delete this.save.runState; hide('ui-pause'); this.startLevel(this.curLevel?.id || 1); };`;
code = code.replace(`id('btn-restart').onclick = () => { this.audio.playClick(); hide('ui-pause'); this.startLevel(this.curLevel?.id || 1); };`, restartHook);

// 6. Delete runState on HUD restart
const hudRestartHook = `id('btn-hud-restart').onclick = () => { this.audio.playClick(); delete this.save.runState; this.startLevel(this.curLevel?.id || 1); };`;
code = code.replace(`id('btn-hud-restart').onclick = () => { this.audio.playClick(); this.startLevel(this.curLevel?.id || 1); };`, hudRestartHook);


// 7. Delete runState on go to main menu from pause
const pauseMenuHook = `id('btn-main-menu').onclick = () => { this.audio.playClick(); hide('ui-pause'); hide('ui-hud'); show('ui-main'); this.state = 'MENU'; this.updateMainMenu(); delete this.save.runState; SaveManager.save(this.save); };`;
code = code.replace(`id('btn-main-menu').onclick = () => { this.audio.playClick(); hide('ui-pause'); hide('ui-hud'); show('ui-main'); this.state = 'MENU'; this.updateMainMenu(); };`, pauseMenuHook);

fs.writeFileSync('game.js', code);
console.log('Patched game.js');
