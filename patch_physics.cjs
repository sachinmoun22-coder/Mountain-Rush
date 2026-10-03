const fs = require('fs');
let code = fs.readFileSync('game.js', 'utf8');

// 1. Damping
code = code.replace(
    'this.dampK = Math.sqrt(this.suspK * this.def.mass) * 1.2; // Lower damping for more bounce',
    'this.dampK = Math.sqrt(this.suspK * this.def.mass) * 3.5; // Increased damping for better stability'
);

// 2. Reaction torques
code = code.replace(
    'this.vAngle -= 6.5 * dt;',
    'this.vAngle -= 4.0 * dt;'
);
code = code.replace(
    'this.vAngle += 6.5 * dt;',
    'this.vAngle += 4.0 * dt;'
);

// 3. Traction torque
code = code.replace(
    'this.vAngle -= (driveSpeed * 0.04) * dt;',
    'this.vAngle -= (driveSpeed * 0.015) * dt;'
);

// 4. Angular stabilization
code = code.replace(
    'this.vAngle *= (1 - 0.5 * dt);',
    'this.vAngle *= (1 - 2.0 * dt); // Better stabilization'
);
code = code.replace(
    'this.vAngle *= (1 - 0.4 * dt); // Less angular drag to keep flips spinning',
    'this.vAngle *= (1 - 1.8 * dt); // Increased angular drag for stability'
);

// 5. In-Air self-righting assist (minor)
code = code.replace(
    'this.airTime += dt;',
    `this.airTime += dt;
            // Minor self-righting in air
            if (this.angle > 0) this.vAngle -= 0.8 * dt;
            else if (this.angle < 0) this.vAngle += 0.8 * dt;`
);

fs.writeFileSync('game.js', code);
console.log('Patched physics');
