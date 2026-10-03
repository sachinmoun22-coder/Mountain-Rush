const fs = require('fs');
let code = fs.readFileSync('game.js', 'utf8');

code = code.replace(`        this.state = 'PLAY';
        this.audio.startEngine();
        this.audio.startMusic();`, `        this.state = 'PAUSE';
        let pauseUI = document.getElementById('ui-pause');
        if (pauseUI) pauseUI.classList.remove('hidden');`);

fs.writeFileSync('game.js', code);
console.log('Patched game.js 3');
