const fs = require('fs');
let code = fs.readFileSync('game.js', 'utf8');

// Reduce global power application for smoother driving and harder climbs
code = code.replace(
    'let pwr = this.power * (this.boostT > 0 ? 1.6 : 1.0);',
    'let pwr = this.power * (this.boostT > 0 ? 1.6 : 1.0) * 0.5; // Power reduced by 50%'
);

// Reduce traction torque to match the lower power so it doesn't wheelie too aggressively with the new balance
code = code.replace(
    'this.vAngle -= (driveSpeed * 0.025) * dt;',
    'this.vAngle -= (driveSpeed * 0.035) * dt;' // increase torque slightly relative to the lowered drive speed to maintain fun factor
);

fs.writeFileSync('game.js', code);
console.log('Patched power');
