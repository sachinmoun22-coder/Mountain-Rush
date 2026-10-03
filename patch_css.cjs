const fs = require('fs');
let code = fs.readFileSync('style.css', 'utf8');

const oldCss = `.car-marker {
    position: absolute;
    top: -14px;
    left: 0%;
    font-size: 20px;
    transform: translateX(-50%);
    filter: drop-shadow(0 2px 2px rgba(0,0,0,0.8));
    transition: left 0.1s linear;
}`;

const newCss = `.car-marker {
    position: absolute;
    top: -14px;
    left: 0%;
    font-size: 20px;
    /* Emoji car natively points left. We flip it on the X-axis so it drives right towards the flag. */
    transform: translateX(-50%) scaleX(-1);
    filter: drop-shadow(0 2px 2px rgba(0,0,0,0.8));
    transition: left 0.1s linear;
}`;

code = code.replace(oldCss, newCss);
fs.writeFileSync('style.css', code);
console.log('Patched style.css');
