const fs = require('fs');
let code = fs.readFileSync('game.js', 'utf8');

// Update VEHICLES array
const oldVehicles = `const VEHICLES = [
    { id: 'hillclimber', name: 'Hill Climber Jeep', cost: 0, engine: 1200, susp: 220, tires: 1.0, fuel: 100, mass: 1.2, draw: 'drawHillClimber', wR: 22 },
    { id: 'monstertruck', name: 'Monster Truck', cost: 600, engine: 1600, susp: 300, tires: 1.4, fuel: 120, mass: 1.7, draw: 'drawMonsterTruck', wR: 30 },
    { id: 'motocross', name: 'Motocross Bike', cost: 1400, engine: 1300, susp: 190, tires: 1.2, fuel: 85, mass: 0.85, draw: 'drawMotocross', wR: 20 }
];`;

const newVehicles = `const VEHICLES = [
    { id: 'hillclimber', name: 'Hill Climber Jeep', cost: 0, engine: 1200, susp: 220, tires: 1.0, fuel: 100, mass: 1.2, draw: 'drawHillClimber', wR: 22, wFx: 38, wBx: -38, wFy: 14, wBy: 14 },
    { id: 'monstertruck', name: 'Monster Truck', cost: 600, engine: 1600, susp: 300, tires: 1.4, fuel: 120, mass: 1.7, draw: 'drawMonsterTruck', wR: 30, wFx: 45, wBx: -45, wFy: 18, wBy: 18 },
    { id: 'motocross', name: 'Motocross Bike', cost: 1400, engine: 1300, susp: 190, tires: 1.2, fuel: 85, mass: 0.85, draw: 'drawMotocross', wR: 20, wFx: 35, wBx: -32, wFy: 14, wBy: 14 },
    { id: 'tractor', name: 'Tractor', cost: 2500, engine: 2000, susp: 200, tires: 1.6, fuel: 110, mass: 1.8, draw: 'drawTractor', wR: 22, wRF: 18, wRB: 36, wFx: 40, wBx: -30, wFy: 10, wBy: -5 },
    { id: 'bus', name: 'Tourist Bus', cost: 4000, engine: 2400, susp: 250, tires: 1.1, fuel: 150, mass: 2.5, draw: 'drawBus', wR: 24, wFx: 65, wBx: -65, wFy: 25, wBy: 25 }
];`;

if (code.includes('cost: 0, engine: 1200')) {
    code = code.replace(oldVehicles, newVehicles);
}

// Update Vehicle constructor for wheel positioning
const oldConstructor = `        // Wheel base positions relative to car center
        this.wF = {x: 38, y: 14, a: 0, va: 0, r: wheelR, touching: false};
        this.wB = {x: -38, y: 14, a: 0, va: 0, r: wheelR, touching: false};`;

const newConstructor = `        // Wheel base positions relative to car center
        this.wF = {x: def.wFx || 38, y: def.wFy || 14, a: 0, va: 0, r: def.wRF || wheelR, touching: false};
        this.wB = {x: def.wBx || -38, y: def.wBy || 14, a: 0, va: 0, r: def.wRB || wheelR, touching: false};`;
        
code = code.replace(oldConstructor, newConstructor);

// Fix Physics to allow wheelies
// 1. Damping
code = code.replace(
    'this.dampK = Math.sqrt(this.suspK * this.def.mass) * 3.5; // Increased damping for better stability',
    'this.dampK = Math.sqrt(this.suspK * this.def.mass) * 1.8; // Balanced damping'
);

// 2. Reaction torques
code = code.replace(
    'this.vAngle -= 4.0 * dt;',
    'this.vAngle -= 5.5 * dt; // Allow more wheelie lift'
);
code = code.replace(
    'this.vAngle += 4.0 * dt;',
    'this.vAngle += 5.5 * dt; // Allow more braking dive'
);

// 3. Traction torque
code = code.replace(
    'this.vAngle -= (driveSpeed * 0.015) * dt;',
    'this.vAngle -= (driveSpeed * 0.025) * dt;'
);

// 4. Angular stabilization
code = code.replace(
    'this.vAngle *= (1 - 2.0 * dt); // Better stabilization',
    'this.vAngle *= (1 - 0.7 * dt); // Allow more rotation'
);
code = code.replace(
    'this.vAngle *= (1 - 1.8 * dt); // Increased angular drag for stability',
    'this.vAngle *= (1 - 0.6 * dt); // Less drag in air'
);

fs.writeFileSync('game.js', code);
console.log('Patched vehicles and physics');
