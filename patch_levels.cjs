const fs = require('fs');
let code = fs.readFileSync('game.js', 'utf8');

const oldLevels = `const LEVELS = [
    { id: 1, env: 'green', name: 'Country Hills', diff: 0.7, dist: 1200 },
    { id: 2, env: 'rocky', name: 'Rocky Mountain', diff: 1.0, dist: 1800 },
    { id: 3, env: 'desert', name: 'Desert Dunes', diff: 1.2, dist: 2200 },
    { id: 4, env: 'snow', name: 'Arctic Peak', diff: 1.4, dist: 2600 },
    { id: 5, env: 'volcano', name: 'Volcano Ridge', diff: 1.7, dist: 3200 }
];`;

const newLevels = `const LEVELS = [];
const ENV_TYPES = ['green', 'rocky', 'desert', 'snow', 'volcano'];
const ENV_NAMES = ['Country Hills', 'Rocky Mountain', 'Desert Dunes', 'Arctic Peak', 'Volcano Ridge'];
for (let i = 1; i <= 50; i++) {
    let envIdx = (i - 1) % ENV_TYPES.length;
    let nameSuffix = i > 5 ? ' ' + Math.ceil(i/5) : '';
    LEVELS.push({
        id: i,
        env: ENV_TYPES[envIdx],
        name: ENV_NAMES[envIdx] + nameSuffix,
        diff: 0.7 + (i - 1) * 0.15,
        dist: 1200 + (i - 1) * 400
    });
}`;

if (code.includes(oldLevels)) {
    code = code.replace(oldLevels, newLevels);
    fs.writeFileSync('game.js', code);
    console.log('Patched LEVELS');
} else {
    console.log('Failed to find LEVELS');
}
