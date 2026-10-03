const fs = require('fs');
let code = fs.readFileSync('game.js', 'utf8');

// Fix the syntax error
code = code.replace(`if (this.save.music) this.audio.startMusic(); this.audio.startEngine();
                    else this.audio.stopMusic();`, `if (this.save.music) { this.audio.startMusic(); this.audio.startEngine(); }
                    else { this.audio.stopMusic(); }`);

// Wait, let's just restore line 1140 to exactly what it was without startEngine
code = code.replace(`if (this.save.music) this.audio.startMusic(); this.audio.startEngine();
                    else this.audio.stopMusic();`, `if (this.save.music) this.audio.startMusic();
                    else this.audio.stopMusic();`);

fs.writeFileSync('game.js', code);
