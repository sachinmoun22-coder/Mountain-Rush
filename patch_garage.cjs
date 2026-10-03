const fs = require('fs');
let code = fs.readFileSync('game.js', 'utf8');

const oldGarage = `        gCtx.clearRect(0,0,300,200); gCtx.save(); gCtx.translate(150, 100); VehicleDraw[v.draw](gCtx);
        gCtx.save(); gCtx.translate(40, 15); VehicleDraw.drawWheel(gCtx, v.wR); gCtx.restore();
        gCtx.save(); gCtx.translate(-40, 15); VehicleDraw.drawWheel(gCtx, v.wR); gCtx.restore(); gCtx.restore();`;

const newGarage = `        gCtx.clearRect(0,0,300,200); gCtx.save(); gCtx.translate(150, 100); VehicleDraw[v.draw](gCtx);
        gCtx.save(); gCtx.translate(v.wFx || 38, v.wFy || 14); VehicleDraw.drawWheel(gCtx, v.wRF || v.wR); gCtx.restore();
        gCtx.save(); gCtx.translate(v.wBx || -38, v.wBy || 14); VehicleDraw.drawWheel(gCtx, v.wRB || v.wR); gCtx.restore(); gCtx.restore();`;

code = code.replace(oldGarage, newGarage);
fs.writeFileSync('game.js', code);
console.log('Patched garage preview');
