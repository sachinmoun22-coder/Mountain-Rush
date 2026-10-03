const fs = require('fs');
let code = fs.readFileSync('game.js', 'utf8');

const updateHook = `        this.particles.update(dt);
        
        // Auto-save run state every 2 seconds
        const now = performance.now();
        if (!this.lastSaveRunStateTime || now - this.lastSaveRunStateTime > 2000) {
            this.lastSaveRunStateTime = now;
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
                items: this.items.items.map(it => ({x: it.x, y: it.y, type: it.type, collected: it.collected, a: it.a}))
            };
            SaveManager.save(this.save);
        }`;

code = code.replace(`        this.particles.update(dt);`, updateHook);
fs.writeFileSync('game.js', code);
console.log('Patched game.js 2');
