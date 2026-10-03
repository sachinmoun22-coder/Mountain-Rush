/**
 * MOUNTAIN RUSH - Original 2D Physics Hill Climbing Game
 */

const CONSTANTS = { GRAVITY: 1800, PHYSICS_STEP: 1/120, STORAGE_KEY: 'mountain_rush_save_v1' };
const lerp = (a, b, t) => a + (b - a) * t;
const darkenHex = (hex, factor) => {
    if (!hex || !hex.startsWith('#')) return hex;
    let r = parseInt(hex.slice(1,3), 16);
    let g = parseInt(hex.slice(3,5), 16);
    let b = parseInt(hex.slice(5,7), 16);
    r = Math.floor(r * factor);
    g = Math.floor(g * factor);
    b = Math.floor(b * factor);
    return '#' + [r,g,b].map(x => x.toString(16).padStart(2,'0')).join('');
};

const ENVIRONMENTS = [
    { 
        id: 'green', 
        name: 'Country Hills', 
        weatherIcon: '🌤️',
        weatherDesc: 'Sunny Breeze',
        sky1: '#38bdf8', sky2: '#bae6fd', 
        hills: '#16a34a', hills2: '#15803d', 
        ground: '#22c55e', subsoil: '#5d4037',
        nightSky1: '#09152e', nightSky2: '#1e293b',
        nightHills: '#14532d', nightHills2: '#052e16',
        nightGround: '#4ade80', nightSubsoil: '#3e2723'
    },
    { 
        id: 'rocky', 
        name: 'Rocky Mountain', 
        weatherIcon: '⛅',
        weatherDesc: 'Mountain Mist',
        sky1: '#64748b', sky2: '#cbd5e1', 
        hills: '#475569', hills2: '#334155', 
        ground: '#94a3b8', subsoil: '#3e2723',
        nightSky1: '#0f172a', nightSky2: '#1e293b',
        nightHills: '#334155', nightHills2: '#1e293b',
        nightGround: '#cbd5e1', nightSubsoil: '#1c1917'
    },
    { 
        id: 'desert', 
        name: 'Desert Dunes', 
        weatherIcon: '☀️',
        weatherDesc: 'Bright Sun & Sand Breeze',
        sky1: '#38bdf8', sky2: '#fed7aa', 
        hills: '#fbbf24', hills2: '#f97316', 
        ground: '#fef08a', subsoil: '#d97706',
        nightSky1: '#09152e', nightSky2: '#1e293b',
        nightHills: '#334155', nightHills2: '#1e293b',
        nightGround: '#fde047', nightSubsoil: '#78350f'
    },
    { 
        id: 'snow', 
        name: 'Arctic Peak', 
        weatherIcon: '❄️',
        weatherDesc: 'Snow Flurry',
        sky1: '#7dd3fc', sky2: '#e0f2fe', 
        hills: '#93c5fd', hills2: '#60a5fa', 
        ground: '#f8fafc', subsoil: '#64748b',
        nightSky1: '#0f172a', nightSky2: '#1e293b',
        nightHills: '#3b82f6', nightHills2: '#1e3a8a',
        nightGround: '#e2e8f0', nightSubsoil: '#334155'
    },
    { 
        id: 'volcano', 
        name: 'Volcano Ridge', 
        weatherIcon: '🔥',
        weatherDesc: 'Heat Embers',
        sky1: '#dc2626', sky2: '#fecaca', 
        hills: '#451a03', hills2: '#1c1917', 
        ground: '#ea580c', subsoil: '#7c2d12',
        nightSky1: '#180505', nightSky2: '#450a0a',
        nightHills: '#260808', nightHills2: '#150303',
        nightGround: '#f97316', nightSubsoil: '#431407'
    }
];

const LEVELS = [];
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
}

const VEHICLES = [
    { id: 'hillclimber', name: 'Hill Climber Jeep', cost: 0, engine: 1200, susp: 220, tires: 1.0, fuel: 100, mass: 1.2, draw: 'drawHillClimber', wR: 22, wFx: 38, wBx: -38, wFy: 14, wBy: 14, soundProfile: 'BASSY' },
    { id: 'monstertruck', name: 'Monster Truck', cost: 600, engine: 1600, susp: 300, tires: 1.4, fuel: 120, mass: 1.7, draw: 'drawMonsterTruck', wR: 30, wFx: 45, wBx: -45, wFy: 18, wBy: 18, soundProfile: 'DIESEL' },
    { id: 'motocross', name: 'Motocross Bike', cost: 1400, engine: 1300, susp: 190, tires: 1.2, fuel: 85, mass: 0.85, draw: 'drawMotocross', wR: 20, wFx: 35, wBx: -32, wFy: 14, wBy: 14, soundProfile: 'SPORT' },
    { id: 'tractor', name: 'Tractor', cost: 2500, engine: 2000, susp: 200, tires: 1.6, fuel: 110, mass: 1.8, draw: 'drawTractor', wR: 22, wRF: 18, wRB: 36, wFx: 40, wBx: -30, wFy: 10, wBy: -5, soundProfile: 'DIESEL' },
    { id: 'bus', name: 'Tourist Bus', cost: 4000, engine: 2400, susp: 250, tires: 1.1, fuel: 150, mass: 2.5, draw: 'drawBus', wR: 24, wFx: 65, wBx: -65, wFy: 25, wBy: 25, soundProfile: 'BASSY' }
];

const ENGINE_PROFILES = { 
    BASSY: { baseFreq: 40, range: 120, type: 'square' }, 
    SPORT: { baseFreq: 80, range: 250, type: 'sawtooth' }, 
    DIESEL: { baseFreq: 30, range: 100, type: 'square' } 
};

class SaveManager {
    static load() {
        try {
            let d = localStorage.getItem(CONSTANTS.STORAGE_KEY);
            if (!d) {
                d = localStorage.getItem('mountain_rush_save') || localStorage.getItem('hcr_save');
            }
            if (d) {
                let parsed = JSON.parse(d);
                if (parsed.coins === undefined || typeof parsed.coins !== 'number' || isNaN(parsed.coins)) {
                    parsed.coins = 0;
                } else {
                    parsed.coins = Math.max(0, Number(parsed.coins));
                }
                if (parsed.runState && parsed.runState.sessionCoins) {
                    parsed.coins += Number(parsed.runState.sessionCoins) || 0;
                    parsed.runState.sessionCoins = 0;
                }
                if (!parsed.vehicles || !parsed.vehicles['hillclimber']) {
                    parsed.selectedVehicle = 'hillclimber';
                    parsed.vehicles = parsed.vehicles || {};
                    parsed.vehicles['hillclimber'] = { unlocked: true, engine: 1, susp: 1, tires: 1, fuel: 1 };
                }
                if (parsed.sfxVolume === undefined) parsed.sfxVolume = 0.8;
                if (parsed.musicVolume === undefined) parsed.musicVolume = 0.7;
                if (!parsed.controlsLayout) parsed.controlsLayout = 'default';
                if (!parsed.pedalSize) parsed.pedalSize = 'normal';
                if (parsed.sound === undefined) parsed.sound = true;
                if (parsed.music === undefined) parsed.music = true;
                if (!parsed.playerName) parsed.playerName = 'Racer';
                if (!parsed.playerAvatar) parsed.playerAvatar = '🥷';
                if (!parsed.levels) {
                    parsed.levels = { 1: { unlocked: true, best: 0 } };
                }
                if (!parsed.selectedLevel) {
                    parsed.selectedLevel = 1;
                }

                // Check all completed levels and ensure next stages are unlocked
                LEVELS.forEach(lvl => {
                    let sl = parsed.levels[lvl.id];
                    if (sl && (sl.completed || sl.best >= lvl.dist)) {
                        let nextId = lvl.id + 1;
                        if (nextId <= LEVELS.length) {
                            if (!parsed.levels[nextId]) {
                                parsed.levels[nextId] = { unlocked: true, best: 0 };
                            } else {
                                parsed.levels[nextId].unlocked = true;
                            }
                        }
                    }
                });

                // If currently selected level was completed, advance to next stage automatically
                let curLvl = LEVELS.find(l => l.id === parsed.selectedLevel);
                if (curLvl && parsed.levels[curLvl.id]) {
                    let sl = parsed.levels[curLvl.id];
                    if (sl.completed || sl.best >= curLvl.dist) {
                        let nextId = curLvl.id + 1;
                        if (nextId <= LEVELS.length) {
                            parsed.selectedLevel = nextId;
                        }
                    }
                }

                return parsed;
            }
        } catch(e) {}
        return {
            coins: 0,
            selectedVehicle: 'hillclimber',
            selectedLevel: 1,
            vehicles: {
                'hillclimber': { unlocked: true, engine: 1, susp: 1, tires: 1, fuel: 1 }
            },
            levels: { 1: { unlocked: true, best: 0 } },
            sound: true,
            music: true,
            sfxVolume: 0.8,
            musicVolume: 0.7,
            controlsLayout: 'default',
            pedalSize: 'normal',
            playerName: 'Racer',
            playerAvatar: '🥷',
            missions: {
                m1: { progress: 0, lastDate: new Date().toDateString() },
                m2: { progress: 0, lastDate: new Date().toDateString() }
            }
        };
    }
    static save(data) { localStorage.setItem(CONSTANTS.STORAGE_KEY, JSON.stringify(data)); }
    static getUpgCost(base, level) { return Math.floor(base * level * 1.35); }
}

class AudioManager {
    constructor(saveData) { 
        this.ctx = new (window.AudioContext || window.webkitAudioContext)(); 
        this.save = saveData; 
        this.engOsc = null; 
        this.engGain = null; 
        this.musicInt = null;
        
        this.customAudioUrl = '/music.mp3';
        this.bgAudio = new Audio();
        this.bgAudio.src = this.customAudioUrl;
        this.bgAudio.loop = true;
        
        // Setup Web Audio API routing for the audio element
        this.bgMediaSource = this.ctx.createMediaElementSource(this.bgAudio);
        this.bgGainNode = this.ctx.createGain();
        this.bgMediaSource.connect(this.bgGainNode);
        this.bgGainNode.connect(this.ctx.destination);
    }
    
    setCustomMusic(dataUrl) {
        this.customAudioUrl = dataUrl;
        try { localStorage.setItem('custom_music_url', dataUrl); } catch(e){}
        this.bgAudio.src = dataUrl;
    }
    init() { if (this.ctx.state === 'suspended') this.ctx.resume(); }
    playTone(f, t, d, v=0.1) {
        if (!this.save.sound) return;
        let sfxVol = (this.save.sfxVolume !== undefined ? this.save.sfxVolume : 0.8);
        if (sfxVol <= 0) return;
        let o = this.ctx.createOscillator(), g = this.ctx.createGain();
        o.type = t; o.frequency.value = f; 
        g.gain.setValueAtTime(v * sfxVol, this.ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + d);
        o.connect(g); g.connect(this.ctx.destination); o.start(); o.stop(this.ctx.currentTime + d);
    }
    playCoin() { this.playTone(800, 'sine', 0.1, 0.15); setTimeout(()=>this.playTone(1200, 'sine', 0.2, 0.15), 100); }
    playFuel() { this.playTone(400, 'square', 0.3, 0.1); setTimeout(()=>this.playTone(600, 'square', 0.4, 0.1), 150); }
    playBoost() { this.playTone(150, 'sawtooth', 0.6, 0.2); }
    playUpgrade() { this.playTone(800, 'sine', 0.1, 0.15); setTimeout(()=>this.playTone(1200, 'sine', 0.15, 0.15), 100); setTimeout(()=>this.playTone(1600, 'sine', 0.2, 0.15), 200); }
    playCrash() {
        if (!this.save.sound) return;
        let sfxVol = (this.save.sfxVolume !== undefined ? this.save.sfxVolume : 0.8);
        if (sfxVol <= 0) return;
        let b = this.ctx.createBuffer(1, this.ctx.sampleRate*0.5, this.ctx.sampleRate), d = b.getChannelData(0);
        for(let i=0; i<d.length; i++) d[i] = Math.random()*2-1;
        let n = this.ctx.createBufferSource(); n.buffer = b;
        let g = this.ctx.createGain(); 
        g.gain.setValueAtTime(0.3 * sfxVol, this.ctx.currentTime); 
        g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime+0.5);
        n.connect(g); g.connect(this.ctx.destination); n.start();
    }
    playClick() { this.playTone(600, 'triangle', 0.1, 0.1); }
    startEngine() {
        if (this.engOsc) return;
        this.engOsc = this.ctx.createOscillator(); this.engOsc.type = 'sawtooth';
        this.engGain = this.ctx.createGain(); this.engGain.gain.value = 0;
        this.engOsc.connect(this.engGain); this.engGain.connect(this.ctx.destination); this.engOsc.start();
    }
    updateEngine(ratio, gas, profileName) {
        let profile = ENGINE_PROFILES[profileName] || ENGINE_PROFILES.BASSY;
        if (!this.save.sound || !this.engOsc) { if (this.engGain) this.engGain.gain.value = 0; return; }
        let sfxVol = (this.save.sfxVolume !== undefined ? this.save.sfxVolume : 0.8);
        if (sfxVol <= 0) { if (this.engGain) this.engGain.gain.value = 0; return; }
        
        if (this.engOsc.type !== profile.type) {
            this.engOsc.type = profile.type;
        }
        
        this.engOsc.frequency.setTargetAtTime(profile.baseFreq + ratio * profile.range, this.ctx.currentTime, 0.1);
        this.engGain.gain.setTargetAtTime((gas ? 0.08 + ratio * 0.06 : 0.03) * sfxVol, this.ctx.currentTime, 0.1);
    }
    stopEngine() { if (this.engGain) this.engGain.gain.value = 0; }
    startMusic() {
        if (!this.save.music) return;
        let mVol = (this.save.musicVolume !== undefined ? this.save.musicVolume : 0.7);
        if (mVol <= 0) return;
        
        if (this.customAudioUrl) {
            this.bgGainNode.gain.value = mVol;
            // Safari/Chrome autoplay policy requires resume() on context before play()
            if (this.ctx.state === 'suspended') this.ctx.resume();
            this.bgAudio.play().catch(e => console.log('Audio play failed', e));
        } else {
            if (this.musicInt) return;
            const scale = [196, 220, 261, 293, 330];
            this.musicInt = setInterval(() => { 
                if (!this.save.music || this.customAudioUrl) { this.stopMusic(); return; }
                let curVol = (this.save.musicVolume !== undefined ? this.save.musicVolume : 0.7);
                if (curVol <= 0) return;
                this.playMusicTone(scale[Math.floor(Math.random()*scale.length)]*(Math.random()>0.7?0.5:1), 'triangle', 0.3, 0.03 * curVol); 
            }, 350);
        }
    }
    playMusicTone(f, t, d, v=0.03) {
        if (!this.save.music) return;
        let o = this.ctx.createOscillator(), g = this.ctx.createGain();
        o.type = t; o.frequency.value = f; 
        g.gain.setValueAtTime(v, this.ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + d);
        o.connect(g); g.connect(this.ctx.destination); o.start(); o.stop(this.ctx.currentTime + d);
    }
    stopMusic() { 
        if (this.musicInt) { clearInterval(this.musicInt); this.musicInt = null; }
        this.bgAudio.pause();
    }
    updateMusicVolume() {
        if (this.bgAudio) {
            let mVol = (this.save.musicVolume !== undefined ? this.save.musicVolume : 0.7);
            if (this.bgGainNode) this.bgGainNode.gain.value = mVol;
            else this.bgAudio.volume = mVol;
        }
    }
}

class VehicleDraw {
    static drawBillDriver(ctx, x, y, isBiking = false) {
        ctx.save();
        ctx.translate(x, y);
        
        // Body with red plaid shirt
        ctx.fillStyle = '#c62828';
        ctx.beginPath();
        ctx.roundRect(-9, -14, 18, 18, 4);
        ctx.fill();
        ctx.strokeStyle = '#212121';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        
        // Shirt collar
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.moveTo(-4, -14); ctx.lineTo(0, -9); ctx.lineTo(4, -14);
        ctx.fill();
        
        // Head / Face
        ctx.fillStyle = '#ffd54f';
        ctx.beginPath();
        ctx.arc(0, -22, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#212121';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        
        // Eyes & Big Smile
        ctx.fillStyle = '#212121';
        ctx.beginPath();
        ctx.arc(3, -24, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#212121';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(2, -21, 5, 0, Math.PI * 0.85);
        ctx.stroke();
        
        // Iconic Blue Hill Climb Racing Cap (turned forward/back)
        ctx.fillStyle = '#1565c0';
        ctx.beginPath();
        ctx.arc(0, -24, 10.5, Math.PI, Math.PI * 2);
        ctx.fill();
        // Cap visor / brim
        ctx.fillStyle = '#0d47a1';
        ctx.beginPath();
        ctx.roundRect(-4, -26, 18, 4, 2);
        ctx.fill();
        
        // Arms holding steering wheel or handlebars
        ctx.strokeStyle = '#c62828';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(4, -8);
        ctx.lineTo(15, -10);
        ctx.stroke();
        
        // Hands
        ctx.fillStyle = '#ffd54f';
        ctx.beginPath();
        ctx.arc(15, -10, 3, 0, Math.PI * 2);
        ctx.fill();
        
        // Steering Wheel
        if (!isBiking) {
            ctx.save();
            ctx.translate(16, -10);
            ctx.rotate(0.3);
            ctx.strokeStyle = '#212121';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.ellipse(0, 0, 4, 10, 0, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }
        
        ctx.restore();
    }
    
    // Iconic Hill Climb Racing Red Jeep
    static drawHillClimber(ctx) {
        // Red main body
        ctx.fillStyle = '#d32f2f';
        ctx.strokeStyle = '#1b1b1b';
        ctx.lineWidth = 2.5;
        
        // Jeep lower and upper body profile
        ctx.beginPath();
        ctx.moveTo(-45, 10);
        ctx.lineTo(44, 10);
        ctx.lineTo(44, -5);
        ctx.lineTo(18, -8);
        ctx.lineTo(6, -20);
        ctx.lineTo(-38, -20);
        ctx.lineTo(-45, -5);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        // Darker red side stripe
        ctx.fillStyle = '#b71c1c';
        ctx.beginPath();
        ctx.rect(-43, 0, 85, 6);
        ctx.fill();
        
        // Windshield and Roll Cage
        ctx.strokeStyle = '#263238';
        ctx.lineWidth = 4;
        // Roll bar
        ctx.beginPath();
        ctx.moveTo(-32, -20);
        ctx.lineTo(-24, -48);
        ctx.lineTo(2, -48);
        ctx.lineTo(10, -20);
        ctx.stroke();
        
        // Windshield Glass (angled)
        ctx.fillStyle = 'rgba(129, 212, 250, 0.65)';
        ctx.beginPath();
        ctx.moveTo(10, -20);
        ctx.lineTo(2, -47);
        ctx.lineTo(5, -47);
        ctx.lineTo(18, -20);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#37474f';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Front Grille & Headlight
        ctx.fillStyle = '#ffeb3b';
        ctx.beginPath();
        ctx.arc(42, -2, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#212121';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        
        // Driver Bill
        VehicleDraw.drawBillDriver(ctx, -10, -12);
        
        // Spare tire mounted at the rear
        ctx.save();
        ctx.translate(-46, -10);
        ctx.fillStyle = '#212121';
        ctx.beginPath();
        ctx.roundRect(-6, -15, 10, 30, 4);
        ctx.fill();
        ctx.strokeStyle = '#424242';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();
        
        // Suspension springs
        ctx.strokeStyle = '#ff9800';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(-38, 10); ctx.lineTo(-38, 16);
        ctx.moveTo(38, 10); ctx.lineTo(38, 16);
        ctx.stroke();
    }
    
    // Monster Truck with massive suspension and flame decals
    static drawMonsterTruck(ctx) {
        ctx.save();
        ctx.fillStyle = '#1e88e5';
        ctx.strokeStyle = '#111';
        ctx.lineWidth = 3;
        
        // Heavy truck cabin
        ctx.beginPath();
        ctx.moveTo(-48, 8);
        ctx.lineTo(46, 8);
        ctx.lineTo(46, -10);
        ctx.lineTo(24, -14);
        ctx.lineTo(12, -34);
        ctx.lineTo(-26, -34);
        ctx.lineTo(-48, -12);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        // Yellow flame decal
        ctx.fillStyle = '#ffb300';
        ctx.beginPath();
        ctx.moveTo(10, 2);
        ctx.lineTo(38, -4);
        ctx.lineTo(20, -10);
        ctx.lineTo(42, -8);
        ctx.lineTo(0, -6);
        ctx.closePath();
        ctx.fill();
        
        // Big windows
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.beginPath();
        ctx.moveTo(-20, -30);
        ctx.lineTo(8, -30);
        ctx.lineTo(20, -14);
        ctx.lineTo(-20, -14);
        ctx.closePath();
        ctx.fill();
        
        // Driver inside
        VehicleDraw.drawBillDriver(ctx, -5, -8);
        
        // Heavy duty exhaust stacks
        ctx.fillStyle = '#cfd8dc';
        ctx.fillRect(-38, -42, 6, 26);
        ctx.fillStyle = '#37474f';
        ctx.fillRect(-40, -44, 10, 4);
        
        // Heavy chassis lift bars & suspension struts
        ctx.strokeStyle = '#ff3d00';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(-38, 8); ctx.lineTo(-36, 22);
        ctx.moveTo(38, 8); ctx.lineTo(36, 22);
        ctx.stroke();
        
        ctx.restore();
    }
    
    // Agile Motocross Bike
    static drawMotocross(ctx) {
        ctx.save();
        ctx.strokeStyle = '#212121';
        ctx.lineWidth = 4;
        
        // Frame pipes
        ctx.beginPath();
        ctx.moveTo(-38, 16);
        ctx.lineTo(0, 4);
        ctx.lineTo(38, 16);
        ctx.lineTo(15, -18);
        ctx.lineTo(-10, -14);
        ctx.closePath();
        ctx.stroke();
        
        // Engine block
        ctx.fillStyle = '#78909c';
        ctx.beginPath();
        ctx.roundRect(-8, -2, 16, 14, 3);
        ctx.fill();
        
        // Colored Gas Tank & Fairing (Lime Green)
        ctx.fillStyle = '#7cb342';
        ctx.beginPath();
        ctx.moveTo(-15, -15);
        ctx.lineTo(18, -20);
        ctx.lineTo(22, -12);
        ctx.lineTo(-12, -8);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#33691e';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Handlebars
        ctx.strokeStyle = '#212121';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(14, -20);
        ctx.lineTo(18, -32);
        ctx.lineTo(26, -34);
        ctx.stroke();
        
        // Rider Bill leaning on bike
        VehicleDraw.drawBillDriver(ctx, -4, -18, true);
        
        ctx.restore();
    }
    

    static drawTractor(ctx) {
        ctx.save();
        
        // Exhaust pipe
        ctx.fillStyle = '#424242';
        ctx.fillRect(15, -60, 6, 40);
        ctx.fillStyle = '#212121';
        ctx.fillRect(13, -65, 10, 5); // Exhaust tip
        
        // Smoke effect from exhaust based on time (simple placeholder shape)
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.beginPath();
        ctx.arc(18, -75 + Math.sin(Date.now() / 200) * 5, 8, 0, Math.PI * 2);
        ctx.fill();

        // Main body (Classic Red Tractor)
        ctx.fillStyle = '#d32f2f'; // Red
        
        // Engine block (front)
        ctx.beginPath();
        ctx.roundRect(10, -25, 45, 30, 4);
        ctx.fill();
        ctx.stroke();

        // Grill
        ctx.fillStyle = '#eeeeee';
        ctx.fillRect(45, -20, 10, 20);
        ctx.fillStyle = '#212121';
        ctx.fillRect(48, -18, 4, 16);

        // Driver cabin base
        ctx.fillStyle = '#d32f2f';
        ctx.beginPath();
        ctx.roundRect(-40, -35, 40, 40, 5);
        ctx.fill();
        ctx.stroke();

        // Mudguards
        ctx.strokeStyle = '#d32f2f';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.arc(-30, -5, 40, Math.PI, Math.PI * 2);
        ctx.stroke();

        // Steering wheel
        ctx.strokeStyle = '#212121';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(-10, -35);
        ctx.lineTo(-5, -45);
        ctx.stroke();
        ctx.fillStyle = '#212121';
        ctx.beginPath();
        ctx.ellipse(-2, -47, 4, 8, Math.PI/4, 0, Math.PI*2);
        ctx.fill();

        // Driver Bill
        VehicleDraw.drawBillDriver(ctx, -20, -35, false);
        
        // Roof
        ctx.fillStyle = '#ffb04c'; // Yellow-ish roof
        ctx.fillRect(-45, -75, 45, 5);
        ctx.fillStyle = '#212121';
        ctx.fillRect(-40, -70, 4, 35); // Pillar

        ctx.restore();
    }

    static drawBus(ctx) {
        ctx.save();
        
        // Main body
        ctx.fillStyle = '#fbc02d'; // Classic School Bus Yellow
        ctx.strokeStyle = '#212121';
        ctx.lineWidth = 3;
        
        // Body shape
        ctx.beginPath();
        ctx.roundRect(-80, -55, 160, 75, 10);
        ctx.fill();
        ctx.stroke();

        // Windows
        ctx.fillStyle = '#81d4fa'; // Light blue glass
        for(let i = -70; i <= 40; i+= 30) {
            ctx.beginPath();
            ctx.roundRect(i, -45, 20, 25, 3);
            ctx.fill();
            ctx.stroke();
        }

        // Driver window (front)
        ctx.beginPath();
        ctx.roundRect(70, -45, 10, 25, 3);
        ctx.fill();
        ctx.stroke();

        // Black stripe
        ctx.fillStyle = '#212121';
        ctx.fillRect(-80, -10, 160, 5);

        // Lights
        ctx.fillStyle = '#d32f2f'; // Tail light
        ctx.fillRect(-80, 5, 5, 10);
        ctx.fillStyle = '#fff176'; // Headlight
        ctx.fillRect(75, 5, 5, 10);
        
        // Driver Bill
        VehicleDraw.drawBillDriver(ctx, 60, -20, false);

        ctx.restore();
    }

    // Hill Climb Racing Big Knobby Off-Road Wheel
    static drawWheel(ctx, radius) {
        ctx.save();
        
        // Outer deep-tread tire
        ctx.fillStyle = '#1c1c1c';
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#0a0a0a';
        ctx.lineWidth = 2.5;
        ctx.stroke();
        
        // Aggressive deep treads around circumference
        const numTreads = 10;
        ctx.fillStyle = '#0f0f0f';
        for (let i = 0; i < numTreads; i++) {
            let a = (i / numTreads) * Math.PI * 2;
            let tx = Math.cos(a) * (radius - 2);
            let ty = Math.sin(a) * (radius - 2);
            ctx.save();
            ctx.translate(tx, ty);
            ctx.rotate(a);
            ctx.fillRect(-2.5, -4, 5, 8);
            ctx.restore();
        }
        
        // Wheel Rim (Steel / Chrome)
        ctx.fillStyle = '#eceff1';
        ctx.beginPath();
        ctx.arc(0, 0, radius * 0.58, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#90a4ae';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Rim spokes
        ctx.strokeStyle = '#607d8b';
        ctx.lineWidth = 3;
        for (let i = 0; i < 5; i++) {
            let a = (i / 5) * Math.PI * 2;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(Math.cos(a) * radius * 0.55, Math.sin(a) * radius * 0.55);
            ctx.stroke();
        }
        
        // Center lug nut cap
        ctx.fillStyle = '#ff9800';
        ctx.beginPath();
        ctx.arc(0, 0, radius * 0.22, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#37474f';
        ctx.beginPath();
        ctx.arc(0, 0, radius * 0.1, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }
}

class Terrain {
    constructor(diff, seed) {
        this.pts = [];
        this.diff = diff;
        this.seed = seed !== undefined ? seed : (Math.random() * 1000);
        this.genX = 0;
        this.lastY = 320;
        this.segW = 35;
        this.genNext(120);
    }
    
    genNext(count) {
        for(let i = 0; i < count; i++) {
            this.genX += this.segW;
            let h = 0;
            
            if (this.genX > 450) {
                // Smooth transition multiplier to prevent a sudden wall right at the start (450 to 1500)
                let startMultiplier = Math.min(1.0, (this.genX - 450) / 1000);
                
                // Reduced difficulty: smoother and lower hills
                let base = Math.sin(this.genX * 0.0012 + this.seed) * 130 * this.diff; 
                let rolling = Math.sin(this.genX * 0.003 + this.seed * 2.1) * 75 * this.diff;
                let sharp = Math.pow(Math.sin(this.genX * 0.002 + this.seed * 0.7), 4) * 50 * this.diff;
                let micro = Math.cos(this.genX * 0.015 + this.seed * 1.3) * 25 * Math.min(1.0, this.diff);
                
                h = (base + rolling - sharp + micro) * startMultiplier;
            }
            
            this.lastY = 340 - h;
            this.pts.push({ x: this.genX, y: this.lastY });
        }
    }
    
    getHeight(x) {
        if (!this.pts.length) return 340;
        if (x <= this.pts[0].x) return this.pts[0].y;
        
        for (let i = 0; i < this.pts.length - 1; i++) {
            if (x >= this.pts[i].x && x <= this.pts[i+1].x) {
                let t = (x - this.pts[i].x) / (this.pts[i+1].x - this.pts[i].x);
                // Smooth cosine interpolation for buttery hill slope transitions
                let ft = (1 - Math.cos(t * Math.PI)) * 0.5;
                return this.pts[i].y + (this.pts[i+1].y - this.pts[i].y) * ft;
            }
        }
        if (x > this.pts[this.pts.length - 10].x) {
            this.genNext(30);
        }
        return this.pts[this.pts.length - 1].y;
    }
    
    getAngle(x) {
        let h1 = this.getHeight(x - 8), h2 = this.getHeight(x + 8);
        return Math.atan2(h2 - h1, 16);
    }
}

class Vehicle {
    constructor(def, upg, terrain) {
        this.def = def; this.upg = upg;
        this.x = 200;
        let groundY = terrain ? terrain.getHeight(200) : 340;
        let wheelR = def.wR || 22;
        this.y = groundY - wheelR - 18; // spawn safely resting on ground
        this.vx = 0; this.vy = 0; this.angle = 0; this.vAngle = 0;
        
        // Wheel base positions relative to car center
        this.wF = {x: def.wFx || 38, y: def.wFy || 14, a: 0, va: 0, r: def.wRF || wheelR, touching: false};
        this.wB = {x: def.wBx || -38, y: def.wBy || 14, a: 0, va: 0, r: def.wRB || wheelR, touching: false};
        
        let engM = 1 + (upg.engine - 1) * 0.15;
        let suspM = 1 + (upg.susp - 1) * 0.15;
        let tireM = 1 + (upg.tires - 1) * 0.15;
        let fuelM = 1 + (upg.fuel - 1) * 0.20;
        
        this.power = def.engine * engM;
        // Hill Climb Racing suspension & damping: springy and allows wheelies
        this.suspK = def.susp * suspM * 4.5;
        this.dampK = Math.sqrt(this.suspK * this.def.mass) * 1.8; // Balanced damping
        this.grip = def.tires * tireM;
        this.maxFuel = def.fuel * fuelM;
        this.fuel = this.maxFuel;
        this.boostT = 0;
        // Nitro
        this.nitro = 0; // Nitro duration
        this.nitroCooldown = 0; // Cooldown timer
        this.engineRPM = 800;
        this.soundProfile = def.soundProfile;
    }
    
    update(dt, input, terrain, audio) {
        if (this.crashed) return;
        
        audio.updateEngine(this.engineRPM / 7200, input.gas, this.soundProfile);
        
        // Nitro
        if (this.nitro > 0) this.nitro -= dt;
        if (this.nitroCooldown > 0) this.nitroCooldown -= dt;
        
        let pwr = this.power * (this.nitro > 0 ? 3.0 : 1.0) * 0.5; // Power increased with Nitro
        if (this.boostT > 0) this.boostT -= dt;
        
        // Gas (accelerate forward, rear + front 4WD climbing drive)
        let isDriving = false;
        
        // Consistently consume fuel while the engine is active
        if (this.fuel > 0) {
            this.fuel -= 5.0 * dt;
            if (this.fuel < 0) this.fuel = 0;
        }

        if (this.fuel > 0) {
            if (input.gas) {
                isDriving = true;
                this.wB.va += pwr * 1.05 * dt;
                this.wF.va += pwr * 0.95 * dt;
                this.engineRPM = lerp(this.engineRPM, 7200, dt * 6);
                
                // Reaction torque: accelerating forward aggressively lifts the front
                this.vAngle -= 5.5 * dt; // Allow wheelie lift 
            } else {
                // When gas is released, immediately reduce engine power/force to prevent runaway
                this.wB.va *= 0.95;
                this.wF.va *= 0.95;
                
                if (input.brake) {
                    // Reverse / Brake
                    this.wB.va -= pwr * 0.85 * dt;
                    this.wF.va -= pwr * 0.85 * dt;
                    this.engineRPM = lerp(this.engineRPM, 4500, dt * 4);
                    
                    // Reaction torque: braking pushes the nose down aggressively
                    this.vAngle += 5.5 * dt; // Allow braking dive
                } else {
                    // Idle engine
                    this.engineRPM = lerp(this.engineRPM, 850 + Math.min(1, Math.abs(this.vx) / 400) * 3500, dt * 5);
                }
            }
        } else if (input.brake) {
            // Reverse / Brake
            this.wB.va -= pwr * 0.85 * dt;
            this.wF.va -= pwr * 0.85 * dt;
            this.engineRPM = lerp(this.engineRPM, 4500, dt * 4);
            
            // Reaction torque: braking pushes the nose down aggressively
            this.vAngle += 5.5 * dt; // Allow braking dive
        } else {
            // Idle engine
            this.engineRPM = lerp(this.engineRPM, 850 + Math.min(1, Math.abs(this.vx) / 400) * 3500, dt * 5);
        }
        
        // Wheel spin damping (frame-rate independent)
        let spinDrag = 1 - 4.0 * dt;
        this.wB.va *= spinDrag;
        this.wF.va *= spinDrag;
        this.wB.a += this.wB.va * dt;
        this.wF.a += this.wF.va * dt;
        
        let cos = Math.cos(this.angle), sin = Math.sin(this.angle);
        let wxF = this.x + this.wF.x * cos - this.wF.y * sin;
        let wyF = this.y + this.wF.x * sin + this.wF.y * cos;
        let wxB = this.x + this.wB.x * cos - this.wB.y * sin;
        let wyB = this.y + this.wB.x * sin + this.wB.y * cos;
        
        let thF = terrain.getHeight(wxF), thB = terrain.getHeight(wxB);
        let touchF = (wyF + this.wF.r) >= thF;
        let touchB = (wyB + this.wB.r) >= thB;
        this.wF.touching = touchF;
        this.wB.touching = touchB;
        
        // Constant Gravity
        this.vy += CONSTANTS.GRAVITY * this.def.mass * dt;
        
        // Front Wheel Ground Contact & Suspension
        if (touchF) {
            let penF = (wyF + this.wF.r) - thF;
            let wheelVy = this.vy + this.vAngle * 38 * cos;
            let springF = penF * this.suspK;
            let dampF = wheelVy * this.dampK;
            let totalF = Math.min(4200, Math.max(0, springF + dampF));
            
            this.vy -= totalF * dt;
            this.vAngle -= (totalF * 0.005) * dt;
            if (penF > 0) this.y -= Math.min(penF, 5) * 0.08;
            
            let ta = terrain.getAngle(wxF);
            let driveSpeed = this.wF.va * this.grip;
            this.vx += Math.cos(ta) * driveSpeed * dt * 4;
            this.vy += Math.sin(ta) * driveSpeed * dt * 4;
        }
        
        // Back Wheel Ground Contact & Suspension (Primary Drive & Hill Climb Push)
        if (touchB) {
            let penB = (wyB + this.wB.r) - thB;
            let wheelVy = this.vy - this.vAngle * 38 * cos;
            let springF = penB * this.suspK;
            let dampF = wheelVy * this.dampK;
            let totalF = Math.min(4200, Math.max(0, springF + dampF));
            
            this.vy -= totalF * dt;
            this.vAngle += (totalF * 0.005) * dt;
            if (penB > 0) this.y -= Math.min(penB, 5) * 0.08;
            
            let ta = terrain.getAngle(wxB);
            let driveSpeed = this.wB.va * this.grip;
            this.vx += Math.cos(ta) * driveSpeed * dt * 4;
            this.vy += Math.sin(ta) * driveSpeed * dt * 4;
            
            // Forward traction torque: driving the rear wheel pushes the nose up
            this.vAngle -= (driveSpeed * 0.035) * dt;
        }
        
        // In-Air Physics & Hill Climb Racing Rotational Balance
        if (!touchF && !touchB) {
            this.airTime += dt;
            // Minor self-righting in air
            if (this.angle > 0) this.vAngle -= 0.8 * dt;
            else if (this.angle < 0) this.vAngle += 0.8 * dt;
            
            let da = this.angle - this.lastA;
            if (da > Math.PI) da -= Math.PI * 2;
            if (da < -Math.PI) da += Math.PI * 2;
            this.rotAccum += da;
            if (Math.abs(this.rotAccum) >= Math.PI * 2) {
                this.flips++;
                this.rotAccum = 0;
            }
        } else {
            this.airTime = 0;
            this.flips = 0;
            this.rotAccum = 0;
            // Minimal angular stabilization so it can wheelie easily
            this.vAngle *= (1 - 0.7 * dt);
        }
        this.lastA = this.angle;
        
        // Aerodynamic drag & ground roll friction
        this.vx *= (1 - 0.75 * dt);
        this.vy *= (1 - 0.15 * dt);
        this.vAngle *= (1 - 0.6 * dt);
        
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.angle += this.vAngle * dt;
        
        // Underbelly clearance against sharp ridges
        let midGround = terrain.getHeight(this.x);
        if (this.y + 14 > midGround) {
            let pen = (this.y + 14) - midGround;
            this.y -= pen * 0.2;
            if (this.vy > 0) this.vy *= 0.4;
        }
        
        // Bill Driver head collision check (Driver sits 32px above car center)
        let headWorldX = this.x + 32 * sin;
        let headWorldY = this.y - 32 * cos;
        let groundAtHead = terrain.getHeight(headWorldX);
        
        // If driver head strikes the hill surface
        if (cos < 0.25 && headWorldY >= groundAtHead - 3) {
            this.crashed = true;
            this.crashReason = "Driver Hit Ground";
        }
        
        // Upside down rollover collision
        let isUpsideDown = (cos < -0.35); // inverted more than 110 degrees
        if (isUpsideDown && (this.y >= terrain.getHeight(this.x) - 16 || touchF || touchB)) {
            this.upsideDownTime += dt;
            if (this.upsideDownTime > 0.3) {
                this.crashed = true;
                this.crashReason = "Flipped Over";
            }
        } else {
            this.upsideDownTime = Math.max(0, this.upsideDownTime - dt * 2);
        }
        
        // Track boundaries
        if (this.x < 0) { this.x = 0; this.vx = 0; }
        if (this.y > terrain.getHeight(this.x) + 120) {
            this.crashed = true;
            this.crashReason = "Fell Off Track";
        }
        
        // Sound pitch synchronization
        let speedKmH = Math.abs(this.vx) * 0.18;
        let soundRatio = Math.min(1, speedKmH / 100);
        audio.updateEngine(soundRatio, input.gas);
    }
}

class Items {
    constructor() { this.items = []; }
    spawn(x, y, type) { this.items.push({x, y, type, collected: false, a: 0}); }
    update(dt, vx, vy, audio) {
        let res = { coins: 0, fuel: 0, boost: false };
        for (let i = this.items.length - 1; i >= 0; i--) {
            let it = this.items[i];
            it.a += dt * 3;
            if (Math.hypot(it.x - vx, it.y - vy) < 40) {
                it.collected = true;
                if (it.type === 'coin') { res.coins++; audio.playCoin(); }
                if (it.type === 'fuel') { res.fuel += 25; audio.playFuel(); }
                if (it.type === 'boost') { res.boost = true; audio.playBoost(); }
                this.items.splice(i, 1);
            } else if (it.x < vx - 1000) {
                this.items.splice(i, 1);
            }
        }
        return res;
    }
    draw(ctx) {
        this.items.forEach(it => {
            ctx.save(); ctx.translate(it.x, it.y + Math.sin(it.a)*5);
            if (it.type === 'coin') {
                ctx.fillStyle = '#FFD700'; ctx.beginPath(); ctx.arc(0,0,12,0,Math.PI*2); ctx.fill();
                ctx.strokeStyle = '#DAA520'; ctx.lineWidth = 2; ctx.stroke();
                ctx.fillStyle = '#FFF'; ctx.font = '14px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline='middle'; ctx.fillText('$', 0, 1);
            } else if (it.type === 'fuel') {
                ctx.fillStyle = '#F44336'; ctx.fillRect(-10, -15, 20, 30);
                ctx.fillStyle = '#FFF'; ctx.fillRect(-10, -5, 20, 10);
            } else if (it.type === 'boost') {
                ctx.fillStyle = '#00BCD4'; ctx.beginPath(); ctx.moveTo(0, -15); ctx.lineTo(15, 0); ctx.lineTo(0, 15); ctx.lineTo(-15, 0); ctx.fill();
            }
            ctx.restore();
        });
    }
}

class Particles {
    constructor() { this.p = []; }
    spawn(x, y, c, n) { for(let i=0; i<n; i++) this.p.push({x, y, vx: (Math.random()-0.5)*100, vy: (Math.random()-0.5)*100, l: Math.random()*0.5+0.2, ml: 1, c}); }
    update(dt) {
        for(let i=this.p.length-1; i>=0; i--) {
            let p = this.p[i]; p.x += p.vx*dt; p.y += p.vy*dt; p.l -= dt;
            if(p.l <= 0) this.p.splice(i, 1);
        }
    }
    draw(ctx) {
        this.p.forEach(p => { ctx.globalAlpha = p.l/p.ml; ctx.fillStyle = p.c; ctx.beginPath(); ctx.arc(p.x, p.y, 4, 0, Math.PI*2); ctx.fill(); });
        ctx.globalAlpha = 1;
    }
}

class WeatherSystem {
    constructor() {
        this.clouds = [];
        this.particles = [];
        this.time = 0;
        this.init();
    }
    
    init() {
        this.clouds = [];
        // Procedural sky clouds
        for (let i = 0; i < 8; i++) {
            this.clouds.push({
                x: i * 270 + Math.random() * 100,
                y: 35 + (i % 3) * 40 + Math.random() * 20,
                speed: 12 + Math.random() * 15,
                scale: 0.75 + Math.random() * 0.55,
                puffs: [
                    { ox: 0, oy: 0, r: 26 + Math.random() * 8 },
                    { ox: -26, oy: 6, r: 19 + Math.random() * 6 },
                    { ox: 26, oy: 6, r: 20 + Math.random() * 6 },
                    { ox: -44, oy: 12, r: 15 + Math.random() * 5 },
                    { ox: 44, oy: 12, r: 16 + Math.random() * 5 }
                ]
            });
        }
        
        this.particles = [];
        // 70 ambient weather particles
        for (let i = 0; i < 70; i++) {
            this.particles.push({
                x: Math.random() * 2400,
                y: Math.random() * 1200,
                vx: 50 + Math.random() * 100,
                vy: (Math.random() - 0.5) * 20,
                size: Math.random() * 3.5 + 1.2,
                alpha: Math.random() * 0.6 + 0.3,
                seed: Math.random() * 100,
                spin: Math.random() * Math.PI * 2,
                vSpin: (Math.random() - 0.5) * 4
            });
        }
    }
    
    update(dt, envType, vehVx = 0) {
        this.time += dt;
        
        // Day/Night cycle: 120 seconds cycle (60s day, 60s night)
        this.isNight = Math.sin(this.time * (Math.PI / 60)) > 0;
        
        // Update clouds
        for (let c of this.clouds) {
            c.x += c.speed * dt;
            if (c.x > 2600) c.x = -350;
        }
        
        // Wind speed by environment
        let envWindX = 80;
        let envWindY = 5;
        if (envType === 'desert') {
            // Warm desert breeze
            envWindX = 160 + Math.sin(this.time * 0.8) * 40;
            envWindY = 8 + Math.sin(this.time * 1.5) * 15;
        } else if (envType === 'snow') {
            envWindX = 35 + Math.sin(this.time) * 20;
            envWindY = 90; // falling snow
        } else if (envType === 'volcano') {
            envWindX = 50;
            envWindY = -75; // rising embers
        } else if (envType === 'green') {
            envWindX = 75;
            envWindY = 15;
        }
        
        for (let p of this.particles) {
            p.x += (p.vx + envWindX + vehVx * 0.1) * dt;
            p.y += (p.vy + envWindY) * dt;
            p.spin += p.vSpin * dt;
        }
    }
    
    drawSky(ctx, cw, ch, camX, envType, isNight) {
        let isDesert = (envType === 'desert');
        
        // 1. Draw Celestial Body (Sun in Day, Moon in Night)
        let sunX = cw * 0.76 - (camX * 0.015) % cw;
        if (sunX < -150) sunX += cw + 300;
        let sunY = ch * 0.22;
        
        if (!isNight) {
            // DAY MODE SUN
            ctx.save();
            
            // Outer radiant corona bloom
            let coronaR = isDesert ? 180 : 130;
            let corona = ctx.createRadialGradient(sunX, sunY, 15, sunX, sunY, coronaR);
            if (isDesert) {
                // Glorious warm desert sun
                corona.addColorStop(0, 'rgba(254, 240, 138, 0.65)');
                corona.addColorStop(0.35, 'rgba(253, 224, 71, 0.35)');
                corona.addColorStop(0.7, 'rgba(251, 191, 36, 0.12)');
                corona.addColorStop(1, 'rgba(245, 158, 11, 0)');
            } else {
                corona.addColorStop(0, 'rgba(255, 255, 255, 0.6)');
                corona.addColorStop(0.4, 'rgba(254, 240, 138, 0.3)');
                corona.addColorStop(1, 'rgba(253, 224, 71, 0)');
            }
            ctx.fillStyle = corona;
            ctx.beginPath();
            ctx.arc(sunX, sunY, coronaR, 0, Math.PI * 2);
            ctx.fill();
            
            // Rotating Sun Rays (especially prominent in Desert Dunes)
            let rayCount = isDesert ? 14 : 10;
            ctx.save();
            ctx.translate(sunX, sunY);
            ctx.rotate(this.time * 0.06);
            let rayPulse = 0.25 + 0.12 * Math.sin(this.time * 2.2);
            ctx.fillStyle = isDesert ? `rgba(254, 240, 138, ${rayPulse})` : `rgba(255, 255, 255, ${rayPulse * 0.7})`;
            for (let r = 0; r < rayCount; r++) {
                ctx.beginPath();
                ctx.moveTo(0, 0);
                let a1 = (r * Math.PI * 2 / rayCount) - 0.07;
                let a2 = (r * Math.PI * 2 / rayCount) + 0.07;
                let len = (r % 2 === 0) ? (isDesert ? 110 : 85) : (isDesert ? 85 : 65);
                ctx.lineTo(Math.cos(a1) * len, Math.sin(a1) * len);
                ctx.lineTo(Math.cos(a2) * len, Math.sin(a2) * len);
                ctx.closePath();
                ctx.fill();
            }
            ctx.restore();
            
            // Solid Sun Core
            let coreR = isDesert ? 36 : 30;
            let sunCore = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, coreR);
            sunCore.addColorStop(0, '#ffffff');
            sunCore.addColorStop(0.65, '#fef08a');
            sunCore.addColorStop(1, isDesert ? '#f59e0b' : '#facc15');
            ctx.fillStyle = sunCore;
            ctx.beginPath();
            ctx.arc(sunX, sunY, coreR, 0, Math.PI * 2);
            ctx.fill();
            
            // Subtle desert lens flare rings
            if (isDesert) {
                let flareDist = 45;
                ctx.fillStyle = 'rgba(254, 240, 138, 0.22)';
                ctx.beginPath();
                ctx.arc(sunX - flareDist, sunY + flareDist * 0.75, 12, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = 'rgba(251, 191, 36, 0.15)';
                ctx.beginPath();
                ctx.arc(sunX - flareDist * 2.2, sunY + flareDist * 1.6, 22, 0, Math.PI * 2);
                ctx.fill();
            }
            
            ctx.restore();
        } else {
            // NIGHT MODE MOON
            ctx.save();
            let moonR = 28;
            let moonGlow = ctx.createRadialGradient(sunX, sunY, 10, sunX, sunY, 110);
            moonGlow.addColorStop(0, 'rgba(224, 242, 254, 0.45)');
            moonGlow.addColorStop(0.5, 'rgba(186, 230, 253, 0.18)');
            moonGlow.addColorStop(1, 'rgba(147, 197, 253, 0)');
            ctx.fillStyle = moonGlow;
            ctx.beginPath();
            ctx.arc(sunX, sunY, 110, 0, Math.PI * 2);
            ctx.fill();
            
            // Moon Disc
            ctx.fillStyle = '#f8fafc';
            ctx.beginPath();
            ctx.arc(sunX, sunY, moonR, 0, Math.PI * 2);
            ctx.fill();
            
            // Moon Craters
            ctx.fillStyle = 'rgba(203, 213, 225, 0.55)';
            ctx.beginPath(); ctx.arc(sunX - 7, sunY - 6, 6, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(sunX + 7, sunY + 8, 8, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(sunX + 11, sunY - 7, 4.5, 0, Math.PI * 2); ctx.fill();
            ctx.restore();
        }
        
        // 2. Draw Clouds
        ctx.save();
        for (let c of this.clouds) {
            // Parallax cloud offset
            let sx = ((c.x - camX * 0.08) % (cw + 500) + (cw + 500)) % (cw + 500) - 250;
            let sy = c.y;
            
            ctx.save();
            ctx.translate(sx, sy);
            ctx.scale(c.scale, c.scale);
            
            // Cloud styling
            if (isNight) {
                ctx.fillStyle = 'rgba(148, 163, 184, 0.35)';
            } else if (isDesert) {
                // Soft warm ivory desert clouds catching sunshine
                ctx.fillStyle = 'rgba(255, 253, 245, 0.88)';
            } else {
                ctx.fillStyle = 'rgba(255, 255, 255, 0.82)';
            }
            
            ctx.beginPath();
            for (let p of c.puffs) {
                ctx.arc(p.ox, p.oy, p.r, 0, Math.PI * 2);
            }
            ctx.fill();
            
            // Subtle cloud bottom shade
            if (!isNight) {
                ctx.fillStyle = isDesert ? 'rgba(254, 215, 170, 0.35)' : 'rgba(224, 242, 254, 0.35)';
                ctx.beginPath();
                for (let p of c.puffs) {
                    ctx.arc(p.ox, p.oy + 4, p.r * 0.85, 0, Math.PI * 2);
                }
                ctx.fill();
            }
            
            ctx.restore();
        }
        ctx.restore();
    }
    
    drawForeground(ctx, cw, ch, camX, envType, isNight) {
        ctx.save();
        
        if (envType === 'desert') {
            // Desert Dunes: Golden sand dust motes & breeze streaks blowing across screen
            for (let p of this.particles) {
                let sx = ((p.x - camX * 0.35) % (cw + 300) + (cw + 300)) % (cw + 300) - 150;
                let sy = (p.y % ch + ch) % ch;
                
                let alpha = p.alpha * (0.6 + 0.4 * Math.sin(this.time * 3 + p.seed));
                ctx.fillStyle = isNight ? `rgba(253, 224, 71, ${alpha * 0.5})` : `rgba(251, 191, 36, ${alpha})`;
                
                // Fine sand mote / dust sparkle
                ctx.beginPath();
                ctx.arc(sx, sy, p.size, 0, Math.PI * 2);
                ctx.fill();
            }
            
            // Occasional warm wind gust streaks
            ctx.strokeStyle = isNight ? 'rgba(253, 224, 71, 0.15)' : 'rgba(254, 240, 138, 0.3)';
            ctx.lineWidth = 1.8;
            for (let i = 0; i < 5; i++) {
                let gx = ((this.time * 280 + i * 420 - camX * 0.45) % (cw + 400) + (cw + 400)) % (cw + 400) - 200;
                let gy = ch * 0.35 + (i * 95) % (ch * 0.5);
                ctx.beginPath();
                ctx.moveTo(gx, gy);
                ctx.lineTo(gx + 65 + i * 15, gy + Math.sin(this.time * 2 + i) * 6);
                ctx.stroke();
            }
        } else if (envType === 'snow') {
            // Arctic Peak: Falling white snowflakes
            ctx.fillStyle = '#ffffff';
            for (let p of this.particles) {
                let sx = ((p.x - camX * 0.3) % (cw + 200) + (cw + 200)) % (cw + 200) - 100;
                let sy = (p.y % ch + ch) % ch;
                ctx.globalAlpha = p.alpha;
                ctx.beginPath();
                ctx.arc(sx, sy, p.size + 1, 0, Math.PI * 2);
                ctx.fill();
            }
        } else if (envType === 'volcano') {
            // Volcano Ridge: Glowing orange heat embers and sparks
            for (let p of this.particles) {
                let sx = ((p.x - camX * 0.3) % (cw + 200) + (cw + 200)) % (cw + 200) - 100;
                let sy = (p.y % ch + ch) % ch;
                let isFlame = (p.seed > 50);
                ctx.fillStyle = isFlame ? '#ff5722' : '#ffeb3b';
                ctx.globalAlpha = p.alpha * (0.6 + 0.4 * Math.sin(this.time * 6 + p.seed));
                ctx.beginPath();
                ctx.arc(sx, sy, p.size + 0.5, 0, Math.PI * 2);
                ctx.fill();
            }
        } else if (envType === 'green') {
            // Country Hills: Floating dandelion / leaf pollen
            for (let p of this.particles) {
                let sx = ((p.x - camX * 0.25) % (cw + 200) + (cw + 200)) % (cw + 200) - 100;
                let sy = (p.y % ch + ch) % ch;
                ctx.fillStyle = (p.seed > 60) ? 'rgba(74, 222, 128, 0.65)' : 'rgba(255, 255, 255, 0.7)';
                ctx.globalAlpha = p.alpha * 0.7;
                ctx.beginPath();
                ctx.arc(sx, sy, p.size, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        
        ctx.restore();
    }
}

class BotVehicle extends Vehicle {
    constructor(def, upg, terrain, x, playerVehicle, index) {
        super(def, upg, terrain);
        this.x = x;
        this.playerVehicle = playerVehicle;
        this.stuckTime = 0;
        this.index = index;

        // Equalize performance specs so all cars have the exact same speed, power & grip
        if (playerVehicle) {
            this.power = playerVehicle.power;
            this.grip = playerVehicle.grip;
            this.def.mass = playerVehicle.def.mass;
            this.suspK = playerVehicle.suspK;
            this.dampK = playerVehicle.dampK;
            this.wF.r = playerVehicle.wF.r;
            this.wB.r = playerVehicle.wB.r;
        }
    }
    
    update(dt, unusedInput, terrain, audio) {
        // Natural balance control to keep car upright
        if (Math.abs(this.angle) > 0.75) {
            this.vAngle -= this.angle * 8 * dt;
        }
        
        // Balanced throttle & brake control based on terrain pitch
        let isPitchSafe = this.angle < 0.45 && this.angle > -0.65;
        let isWheelsTouching = (this.wF.touching || this.wB.touching);
        
        let gas = isPitchSafe && isWheelsTouching;
        let brake = false;
        
        // If tilting backward steeply, release gas and brake slightly to bring nose down
        if (this.angle > 0.5) {
            gas = false;
            brake = true;
        }

        // Equalized top speed: prevent bots from unnaturally rocketing away
        let targetMax = this.playerVehicle ? Math.max(180, Math.abs(this.playerVehicle.vx)) : 260;
        if (this.vx > targetMax * 1.05) {
            gas = false;
            this.vx *= (1 - 1.2 * dt);
        }
        
        // Gentle stuck recovery if blocked by an obstacle
        if (isWheelsTouching && Math.abs(this.vx) < 5) {
            this.stuckTime += dt;
            if (this.stuckTime > 1.2) {
                this.vx = 45;
                this.stuckTime = 0;
            }
        } else {
            this.stuckTime = 0;
        }
        
        this.input = { gas: gas, brake: brake };
        super.update(dt, this.input, terrain, audio);
        
        if (this.playerVehicle) {
            this.engineRPM = this.playerVehicle.engineRPM;
        }
    }
}

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.save = SaveManager.load();
        this.missionDefs = {
            m1: { desc: 'Drive 1000m in one run', target: 1000, reward: 500 },
            m2: { desc: 'Collect 50 coins', target: 50, reward: 200 }
        };
        this.activeMission = null;
        this.audio = new AudioManager(this.save);
        this.weather = new WeatherSystem();
        
        // Setup orientation listeners
        this.resize();
        window.addEventListener('resize', () => this.resize());
        window.addEventListener('orientationchange', () => {
            setTimeout(() => this.resize(), 150);
        });
        if (window.screen && window.screen.orientation) {
            window.screen.orientation.addEventListener('change', () => {
                setTimeout(() => this.resize(), 150);
            });
        }
        
        // Auto-lock landscape on first user interaction (required by browsers)
        const firstInteract = () => {
            this.requestLandscape(true);
            window.removeEventListener('pointerdown', firstInteract);
            window.removeEventListener('keydown', firstInteract);
        };
        window.addEventListener('pointerdown', firstInteract);
        window.addEventListener('keydown', firstInteract);

        this.input = { gas: false, brake: false };
        this.curLevel = LEVELS[0];
        this.gameOverTimeout = null;
        this.setupInput(); this.setupUI();
        this.applyControlsLayout();
        
        if (this.save.runState && !this.save.runState.veh.crashed) {
            this.resumeLevel();
        } else {
            this.updateMainMenu();
            this.state = 'MENU';
            if (this.save.runState) {
                delete this.save.runState;
                SaveManager.save(this.save);
            }
        }
        this.camX = 0; this.camY = 0;
        this.lastTime = performance.now();
        this.accum = 0;
        requestAnimationFrame((t) => this.loop(t));
    }
    
    hide(id) {
        let el = document.getElementById(id);
        if (el) el.classList.add('hidden');
    }
    
    show(id) {
        let el = document.getElementById(id);
        if (el) el.classList.remove('hidden');
    }
    
    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.checkOrientation();
    }

    async requestLandscape(auto = false) {
        if (auto) {
            const isTouchOrMobile = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || (window.innerWidth <= 850);
            if (!isTouchOrMobile) {
                // Don't auto-fullscreen on computers / desktops
                return;
            }
        }
        try {
            const doc = document.documentElement;
            if (!document.fullscreenElement && !document.webkitFullscreenElement) {
                if (doc.requestFullscreen) {
                    await doc.requestFullscreen().catch(() => {});
                } else if (doc.webkitRequestFullscreen) {
                    await doc.webkitRequestFullscreen().catch(() => {});
                }
            }
            if (window.screen && window.screen.orientation && window.screen.orientation.lock) {
                await window.screen.orientation.lock('landscape').catch(() => {});
            }
        } catch (e) {}
        this.resize();
    }

    async toggleLandscapeFullscreen() {
        try {
            if (document.fullscreenElement || document.webkitFullscreenElement) {
                if (document.exitFullscreen) await document.exitFullscreen().catch(() => {});
                else if (document.webkitExitFullscreen) await document.webkitExitFullscreen().catch(() => {});
            } else {
                await this.requestLandscape();
            }
        } catch (e) {}
        this.resize();
    }

    checkOrientation() {
        const overlay = document.getElementById('orientation-overlay');
        if (!overlay) return;
        
        const isPortrait = window.innerHeight > window.innerWidth;
        const isTouchOrMobile = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || (window.innerWidth <= 850);
        
        if (isPortrait && isTouchOrMobile) {
            overlay.classList.remove('hidden');
        } else {
            overlay.classList.add('hidden');
        }
    }
    
    setupInput() {
        window.addEventListener('keydown', e => {
            if(e.code==='ArrowRight' || e.code==='KeyD') this.input.gas = true;
            if(e.code==='ArrowLeft' || e.code==='KeyA') this.input.brake = true;
            if(e.code==='KeyP' && this.state==='PLAY') this.pause();
            if(e.code==='KeyR' && (this.state==='PLAY' || this.state==='PAUSE' || this.state==='GAMEOVER')) {
                this.startLevel(this.curLevel?.id || 1);
            }
        });
        window.addEventListener('keyup', e => {
            if(e.code==='ArrowRight' || e.code==='KeyD') this.input.gas = false;
            if(e.code==='ArrowLeft' || e.code==='KeyA') this.input.brake = false;
        });
        window.addEventListener('blur', () => {
            this.input.gas = false;
            this.input.brake = false;
        });
        
        const bindPedal = (id, isLeft) => {
            const btn = document.getElementById(id);
            if (!btn) return;
            const press = (e) => {
                if (e && e.cancelable) e.preventDefault();
                let isSwapped = (this.save.controlsLayout === 'swapped');
                let isGas = isSwapped ? isLeft : !isLeft;
                if (isGas) this.input.gas = true; else this.input.brake = true;
            };
            const release = (e) => {
                if (e && e.cancelable) e.preventDefault();
                let isSwapped = (this.save.controlsLayout === 'swapped');
                let isGas = isSwapped ? isLeft : !isLeft;
                if (isGas) this.input.gas = false; else this.input.brake = false;
            };
            btn.addEventListener('pointerdown', press);
            btn.addEventListener('pointerup', release);
            btn.addEventListener('pointercancel', release);
            btn.addEventListener('pointerleave', release);
            btn.addEventListener('touchstart', press, { passive: false });
            btn.addEventListener('touchend', release, { passive: false });
            btn.addEventListener('touchcancel', release, { passive: false });
            btn.addEventListener('mousedown', press);
            btn.addEventListener('mouseup', release);
            btn.addEventListener('mouseleave', release);
        };
        bindPedal('btn-touch-left', true);
        bindPedal('btn-touch-right', false);
    }

    applyControlsLayout() {
        let isSwapped = (this.save.controlsLayout === 'swapped');
        let btnL = document.getElementById('btn-touch-left');
        let btnR = document.getElementById('btn-touch-right');
        let hudBottom = document.querySelector('.hud-bottom');
        
        if (hudBottom) {
            if (this.save.pedalSize === 'large') {
                hudBottom.classList.add('pedals-large');
            } else {
                hudBottom.classList.remove('pedals-large');
            }
        }
        
        if (btnL && btnR) {
            if (isSwapped) {
                // Left is GAS, Right is BRAKE
                btnL.className = 'pedal-btn gas-pedal';
                btnL.innerHTML = `
                    <span class="pedal-icon">⚡</span>
                    <div class="pedal-ridges">
                        <span></span><span></span><span></span><span></span>
                    </div>
                    <span>GAS</span>
                `;
                btnR.className = 'pedal-btn brake-pedal';
                btnR.innerHTML = `
                    <span class="pedal-icon">🛑</span>
                    <div class="pedal-ridges">
                        <span></span><span></span><span></span><span></span>
                    </div>
                    <span>BRAKE</span>
                `;
            } else {
                // Left is BRAKE, Right is GAS
                btnL.className = 'pedal-btn brake-pedal';
                btnL.innerHTML = `
                    <span class="pedal-icon">🛑</span>
                    <div class="pedal-ridges">
                        <span></span><span></span><span></span><span></span>
                    </div>
                    <span>BRAKE</span>
                `;
                btnR.className = 'pedal-btn gas-pedal';
                btnR.innerHTML = `
                    <span class="pedal-icon">⚡</span>
                    <div class="pedal-ridges">
                        <span></span><span></span><span></span><span></span>
                    </div>
                    <span>GAS</span>
                `;
            }
        }
    }

    updateSettingsUI() {
        const id = x => document.getElementById(x);
        if (id('chk-sound')) id('chk-sound').checked = !!this.save.sound;
        if (id('chk-music')) id('chk-music').checked = !!this.save.music;
        
        let sfxVal = Math.round((this.save.sfxVolume !== undefined ? this.save.sfxVolume : 0.8) * 100);
        let musicVal = Math.round((this.save.musicVolume !== undefined ? this.save.musicVolume : 0.7) * 100);
        
        if (id('slider-sfx-vol')) id('slider-sfx-vol').value = sfxVal;
        if (id('val-sfx-vol')) id('val-sfx-vol').innerText = `${sfxVal}%`;
        
        if (id('slider-music-vol')) id('slider-music-vol').value = musicVal;
        if (id('val-music-vol')) id('val-music-vol').innerText = `${musicVal}%`;
        
        let isSwapped = (this.save.controlsLayout === 'swapped');
        if (id('btn-ctrl-normal')) id('btn-ctrl-normal').classList.toggle('active', !isSwapped);
        if (id('btn-ctrl-swapped')) id('btn-ctrl-swapped').classList.toggle('active', isSwapped);
        
        let isLarge = (this.save.pedalSize === 'large');
        if (id('btn-size-normal')) id('btn-size-normal').classList.toggle('active', !isLarge);
        if (id('btn-size-large')) id('btn-size-large').classList.toggle('active', isLarge);
    }
    
    setupUI() {
        const id = x => document.getElementById(x);
        const hide = x => this.hide(x);
        const show = x => this.show(x);

        const bindButton = (elId, fn) => {
            const btn = id(elId);
            if (!btn) return;
            let lastTrigger = 0;
            const handler = (e) => {
                if (e) {
                    e.stopPropagation();
                }
                const now = Date.now();
                if (now - lastTrigger < 200) return;
                lastTrigger = now;
                fn(e);
            };
            btn.onclick = handler;
            btn.addEventListener('pointerup', handler);
            btn.addEventListener('touchend', handler);
        };

        // Corner Settings button on Home page (Only Logo)
        const openSettings = () => {
            this.audio.init();
            this.audio.playClick();
            this.previousScreen = 'ui-main';
            hide('ui-main');
            show('ui-settings');
            this.updateSettingsUI();
        };
        // Avatars list
        const AVATARS = ['🥷', '🧑‍🚀', '🧙‍♂️', '🦸‍♂️', '🧛', '🧟', '🤠', '😎', '👽', '🤖'];
        
        // Render avatars function
        const renderAvatars = () => {
            const container = document.getElementById('avatar-selector');
            if (!container) return;
            container.innerHTML = '';
            AVATARS.forEach(av => {
                const btn = document.createElement('button');
                btn.className = 'avatar-btn';
                btn.innerText = av;
                btn.style.cssText = `font-size: 24px; padding: 10px; border-radius: 50%; background: ${this.save.playerAvatar === av ? '#3B82F6' : '#222'}; border: 2px solid ${this.save.playerAvatar === av ? '#fff' : '#444'}; cursor: pointer; transition: all 0.2s; width: 50px; height: 50px; display: flex; align-items: center; justify-content: center;`;
                
                btn.onclick = () => {
                    this.audio.playClick();
                    this.save.playerAvatar = av;
                    SaveManager.save(this.save);
                    renderAvatars(); // Re-render to update selection style
                };
                container.appendChild(btn);
            });
        };

        // Profile button
        bindButton('btn-profile', () => {
            this.audio.playClick();
            this.previousScreen = 'ui-main';
            hide('ui-main');
            
            // Set input value
            const nameInput = document.getElementById('profile-name-input');
            if (nameInput) nameInput.value = this.save.playerName || 'Racer';
            
            renderAvatars();
            
            // Update profile stats
            const totalCoins = this.save.coins || 0;
            let bestDist = 0;
            if (this.save.levels) {
                for (let lvl in this.save.levels) {
                    if (this.save.levels[lvl].best > bestDist) {
                        bestDist = this.save.levels[lvl].best;
                    }
                }
            }
            
            const coinsEl = document.getElementById('profile-total-coins');
            if (coinsEl) coinsEl.innerText = totalCoins;
            
            const distEl = document.getElementById('profile-best-dist');
            if (distEl) distEl.innerText = Math.floor(bestDist) + ' m';
            
            show('ui-profile');
        });
        
        // Profile Close buttons
        const closeProfile = () => {
            this.audio.playClick();
            
            const nameInput = document.getElementById('profile-name-input');
            if (nameInput && nameInput.value.trim()) {
                this.save.playerName = nameInput.value.trim();
                SaveManager.save(this.save);
            }
            
            this.updateMainMenu(); // Update the main menu button with new name/avatar
            
            hide('ui-profile');
            show(this.previousScreen || 'ui-main');
        };
        bindButton('btn-profile-close', closeProfile);
        bindButton('btn-profile-back', closeProfile);
        
        bindButton('btn-settings-open', openSettings);

        // Settings button in Pause Menu
        bindButton('btn-pause-settings', () => {
            this.audio.playClick();
            this.previousScreen = 'ui-pause';
            hide('ui-pause');
            show('ui-settings');
            this.updateSettingsUI();
        });

        // Settings Close / Back buttons
        const closeSettings = () => {
            this.audio.playClick();
            hide('ui-settings');
            show(this.previousScreen || 'ui-main');
            if (this.previousScreen === 'ui-main') this.updateMainMenu();
        };
        bindButton('btn-settings-back', closeSettings);
        bindButton('btn-settings-close', closeSettings);

        // Sound & SFX volume
        if (id('chk-sound')) {
            id('chk-sound').checked = this.save.sound;
            id('chk-sound').onchange = e => {
                this.save.sound = e.target.checked;
                SaveManager.save(this.save);
                if (this.save.sound) this.audio.playClick();
            };
        }
        if (id('slider-sfx-vol')) {
            id('slider-sfx-vol').oninput = e => {
                let v = parseInt(e.target.value, 10);
                this.save.sfxVolume = v / 100;
                if (id('val-sfx-vol')) id('val-sfx-vol').innerText = `${v}%`;
                SaveManager.save(this.save);
            };
            id('slider-sfx-vol').onchange = () => {
                this.audio.playClick();
            };
        }

        // Music & Music volume
        if (id('chk-music')) {
            id('chk-music').checked = this.save.music;
            id('chk-music').onchange = e => {
                this.save.music = e.target.checked;
                SaveManager.save(this.save);
                if (this.state === 'PLAY') {
                    if (this.save.music) { this.audio.startMusic(); this.audio.startEngine(); }
                    else { this.audio.stopMusic(); }
                } else {
                    this.audio.stopMusic();
                }
            };
        }
        if (id('slider-music-vol')) {
            id('slider-music-vol').oninput = e => {
                let v = parseInt(e.target.value, 10);
                this.save.musicVolume = v / 100;
                if (id('val-music-vol')) id('val-music-vol').innerText = `${v}%`;
                SaveManager.save(this.save);
                this.audio.updateMusicVolume();
            };
        }
        


        // Controls Layout (Button Change)
        if (id('btn-ctrl-normal')) {
            id('btn-ctrl-normal').onclick = () => {
                this.audio.playClick();
                this.save.controlsLayout = 'default';
                SaveManager.save(this.save);
                this.applyControlsLayout();
                this.updateSettingsUI();
            };
        }
        if (id('btn-ctrl-swapped')) {
            id('btn-ctrl-swapped').onclick = () => {
                this.audio.playClick();
                this.save.controlsLayout = 'swapped';
                SaveManager.save(this.save);
                this.applyControlsLayout();
                this.updateSettingsUI();
            };
        }

        // Pedal Button Size
        if (id('btn-size-normal')) {
            id('btn-size-normal').onclick = () => {
                this.audio.playClick();
                this.save.pedalSize = 'normal';
                SaveManager.save(this.save);
                this.applyControlsLayout();
                this.updateSettingsUI();
            };
        }
        if (id('btn-size-large')) {
            id('btn-size-large').onclick = () => {
                this.audio.playClick();
                this.save.pedalSize = 'large';
                SaveManager.save(this.save);
                this.applyControlsLayout();
                this.updateSettingsUI();
            };
        }

        // Reset Game Data
        if (id('btn-reset-data')) {
            id('btn-reset-data').onclick = () => {
                let confirmed = window.confirm("Are you sure you want to reset all game data (coins, vehicle upgrades, best records)?");
                if (confirmed) {
                    this.save.coins = 0;
                    this.save.selectedVehicle = 'hillclimber';
                    this.save.selectedLevel = 1;
                    this.save.vehicles = {
                        'hillclimber': { unlocked: true, engine: 1, susp: 1, tires: 1, fuel: 1 }
                    };
                    this.save.levels = { 1: { unlocked: true, best: 0 } };
                    SaveManager.save(this.save);
                    this.vehIdx = 0;
                    this.updateGarage();
                    this.updateMainMenu();
                    this.updateLevelsUI();
                    this.audio.playCrash();
                }
            };
        }
        
        id('btn-play').onclick = () => { 
            this.audio.init(); 
            this.audio.playClick(); 
            this.requestLandscape(true); 
            hide('ui-main'); 
            this.raceMode = false;
            this.bots = [];
            this.startLevel(this.save.selectedLevel || 1); 
        };
        id('btn-missions').onclick = () => {
            this.audio.playClick();
            hide('ui-main');
            show('ui-missions');
            this.updateMissionsUI();
        };
        id('btn-race').onclick = () => {
            this.audio.init();
            this.audio.playClick();
            this.requestLandscape(true);
            hide('ui-main');
            this.raceMode = true; // Ensure race mode is enabled
            this.startLevel(this.save.selectedLevel || 1);
        };
        id('btn-missions-back').onclick = () => {
            this.audio.playClick();
            hide('ui-missions');
            show('ui-main');
        };
        id('btn-missions-close').onclick = () => {
            this.audio.playClick();
            hide('ui-missions');
            show('ui-main');
        };
        id('btn-garage').onclick = () => { this.audio.init(); this.audio.playClick(); hide('ui-main'); show('ui-garage'); this.updateGarage(); };
        id('btn-levels').onclick = () => { this.audio.init(); this.audio.playClick(); hide('ui-main'); show('ui-levels'); this.updateLevelsUI(); };
        
        if (id('btn-toggle-time')) {
            id('btn-toggle-time').onclick = () => {
                this.audio.playClick();
                this.save.nightMode = !this.save.nightMode;
                SaveManager.save(this.save);
                this.updateLevelsUI();
            };
        }

        id('btn-garage-back').onclick = () => { this.audio.playClick(); hide('ui-garage'); show('ui-main'); this.updateMainMenu(); };
        id('btn-levels-back').onclick = () => { this.audio.playClick(); hide('ui-levels'); show('ui-main'); this.updateMainMenu(); };
        
        id('btn-pause').onclick = () => this.pause();
        if (id('btn-hud-restart')) {
            id('btn-hud-restart').onclick = () => { this.audio.playClick(); delete this.save.runState; this.startLevel(this.curLevel?.id || 1); };
        }
        id('btn-resume').onclick = () => { this.audio.init(); this.audio.playClick(); hide('ui-pause'); this.state = 'PLAY'; this.audio.startMusic(); this.audio.startEngine(); this.lastTime = performance.now(); };
        id('btn-restart').onclick = () => { this.audio.playClick(); delete this.save.runState; hide('ui-pause'); this.startLevel(this.curLevel?.id || 1); };
        bindButton('btn-quit', () => { 
            this.audio.init(); 
            this.audio.playClick(); 
            delete this.save.runState; 
            SaveManager.save(this.save);
            hide('ui-pause'); 
            hide('ui-hud'); 
            show('ui-main'); 
            this.state = 'MENU'; 
            this.audio.stopEngine(); 
            this.updateMainMenu(); 
        });
        
        id('btn-go-retry').onclick = () => { this.audio.playClick(); hide('ui-game-over'); this.startLevel(this.curLevel?.id || 1); };
        bindButton('btn-go-menu', () => { 
            this.audio.playClick(); 
            delete this.save.runState; 
            SaveManager.save(this.save);
            hide('ui-game-over'); 
            hide('ui-hud'); 
            show('ui-main'); 
            this.state = 'MENU'; 
            this.audio.stopEngine(); 
            this.updateMainMenu(); 
        });
        id('btn-go-garage').onclick = () => { 
            this.audio.playClick(); 
            delete this.save.runState; 
            SaveManager.save(this.save);
            hide('ui-game-over'); 
            hide('ui-hud'); 
            show('ui-garage'); 
            this.state = 'MENU'; 
            this.updateGarage(); 
            this.updateMainMenu(); 
        };
        id('btn-nitro').onclick = () => {
            if (this.veh && this.veh.nitroCooldown <= 0) {
                this.audio.playBoost();
                this.veh.nitro = 2.0; // 2 seconds burst
                this.veh.nitroCooldown = 10.0; // 10 seconds cooldown
            }
        };
        
        id('btn-lc-next').onclick = () => { 
            this.audio.playClick(); 
            delete this.save.runState;
            hide('ui-level-complete'); 
            let nextId = Math.min(LEVELS.length, (this.curLevel?.id || 1) + 1);
            this.save.selectedLevel = nextId;
            SaveManager.save(this.save);
            this.startLevel(nextId); 
        };
        id('btn-lc-garage').onclick = () => { 
            this.audio.playClick(); 
            delete this.save.runState; 
            SaveManager.save(this.save);
            hide('ui-level-complete'); 
            hide('ui-hud'); 
            show('ui-garage'); 
            this.state = 'MENU'; 
            this.updateGarage(); 
            this.updateMainMenu(); 
        };
        bindButton('btn-lc-menu', () => { 
            this.audio.playClick(); 
            delete this.save.runState; 
            SaveManager.save(this.save);
            hide('ui-level-complete'); 
            hide('ui-hud'); 
            show('ui-main'); 
            this.state = 'MENU'; 
            this.audio.stopEngine(); 
            this.updateMainMenu(); 
        });
        
        this.vehIdx = VEHICLES.findIndex(v => v.id === this.save.selectedVehicle);
        if (this.vehIdx === -1) this.vehIdx = 0;
        id('btn-prev-veh').onclick = () => { this.audio.playClick(); this.vehIdx = (this.vehIdx - 1 + VEHICLES.length) % VEHICLES.length; this.updateGarage(); };
        id('btn-next-veh').onclick = () => { this.audio.playClick(); this.vehIdx = (this.vehIdx + 1) % VEHICLES.length; this.updateGarage(); };
        
        id('btn-select-veh').onclick = () => {
            this.audio.playClick(); let v = VEHICLES[this.vehIdx];
            if (this.save.vehicles[v.id]?.unlocked) { this.save.selectedVehicle = v.id; SaveManager.save(this.save); this.updateGarage(); this.updateMainMenu(); }
        };
        id('btn-buy-veh').onclick = () => {
            let v = VEHICLES[this.vehIdx];
            if (this.save.coins >= v.cost && !this.save.vehicles[v.id]) {
                this.audio.playUpgrade(); this.save.coins -= v.cost; this.save.vehicles[v.id] = { unlocked: true, engine: 1, susp: 1, tires: 1, fuel: 1 };
                this.save.selectedVehicle = v.id; SaveManager.save(this.save); this.updateGarage(); this.updateMainMenu();
            }
        };
        
        const upg = (type) => {
            let v = VEHICLES[this.vehIdx]; let sv = this.save.vehicles[v.id]; if(!sv) return;
            let c = SaveManager.getUpgCost(100, sv[type]);
            if (this.save.coins >= c && sv[type] < 10) {
                this.audio.playUpgrade(); this.save.coins -= c; sv[type]++; SaveManager.save(this.save); this.updateGarage();
            }
        };
        id('upg-engine').onclick = () => upg('engine'); id('upg-susp').onclick = () => upg('susp');
        id('upg-tires').onclick = () => upg('tires'); id('upg-fuel').onclick = () => upg('fuel');
    }
    
    updateMainMenu() {
        let v = VEHICLES.find(v => v.id === this.save.selectedVehicle) || VEHICLES[0];
        let l = LEVELS.find(l => l.id === this.save.selectedLevel) || LEVELS[0];
        let elV = document.getElementById('main-sel-vehicle');
        if (elV) elV.innerText = v.name;
        let elL = document.getElementById('main-sel-stage');
        if (elL) elL.innerText = `Stage ${l.id} (${l.dist}m)`;
        let elCoins = document.getElementById('main-coins');
        if (elCoins) elCoins.innerText = `💰 ${this.save.coins}`;
        
        let elPlay = document.getElementById('btn-play');
        if (elPlay) {
            elPlay.innerText = '🚀 START';
        }
        
        let elProfile = document.getElementById('btn-profile');
        if (elProfile) {
            elProfile.innerText = `${this.save.playerAvatar || '🥷'} ${this.save.playerName || 'Racer'}`;
        }
    }
    
    updateMissionsUI() {
        let missionsList = document.getElementById('missions-list');
        missionsList.innerHTML = '';
        
        let missionDefs = this.missionDefs;
        
        Object.keys(missionDefs).forEach(id => {
            let mDef = missionDefs[id];
            if (!this.save.missions) this.save.missions = {};
            if (!this.save.missions[id]) this.save.missions[id] = { progress: 0, lastDate: new Date().toDateString() };
            
            let progress = Math.min(this.save.missions[id].progress, mDef.target);
            let percent = (progress / mDef.target) * 100;
            
            let item = document.createElement('div');
            item.className = 'setting-card';
            item.innerHTML = `
                <div class="setting-item" style="flex-direction: column; gap: 5px;">
                    <div style="display:flex; justify-content:space-between; align-items:center; width:100%;">
                        <span class="setting-name">${mDef.desc}</span>
                        <div style="display: flex; gap: 8px;">
                            <button class="back-btn" onclick="window.__gameInstance.startMission('${id}')">PLAY</button>
                            <button class="back-btn ${progress >= mDef.target ? '' : 'hidden'}" onclick="window.__gameInstance.claimMission('${id}')">CLAIM ${mDef.reward} 💰</button>
                        </div>
                    </div>
                    <div class="fuel-bar-bg" style="width: 100%; height: 10px; background: #333; border-radius: 5px; overflow: hidden;">
                        <div style="width: ${percent}%; height: 100%; background: #4CAF50; transition: width 0.3s;"></div>
                    </div>
                    <span class="setting-desc">${progress}/${mDef.target}</span>
                </div>
            `;
            missionsList.appendChild(item);
        });
    }
    
    updateMission(id, val) {
        if (!this.save.missions[id] || !this.activeMission) return;
        if (id !== this.activeMission) return;
        this.save.missions[id].progress = Math.max(this.save.missions[id].progress, val);
        SaveManager.save(this.save);
    }
    
    startMission(id) {
        this.audio.init();
        this.audio.playClick();
        this.requestLandscape(true);
        this.hide('ui-missions');
        this.raceMode = false;
        this.bots = [];
        this.activeMission = id;
        // Harder level for missions
        let missionLevel = Math.min(LEVELS.length, (this.save.selectedLevel || 1) + 10); 
        this.startLevel(missionLevel, true);
        
        // Force state to PLAY and start engine sound
        this.state = 'PLAY';
        this.audio.startEngine();
        this.audio.startMusic();
    }
    
    claimMission(id) {
        let mDef = this.missionDefs[id];
        if (!mDef || this.save.missions[id].progress < mDef.target) return;
        this.save.missions[id].progress = 0; // Reset
        this.save.coins += mDef.reward;
        SaveManager.save(this.save);
        this.updateMissionsUI();
        this.updateMainMenu();
    }
    
    updateGarage() {
        let v = VEHICLES[this.vehIdx], sv = this.save.vehicles[v.id];
        document.getElementById('garage-vname').innerText = v.name;
        document.getElementById('garage-coins').innerText = `💰 ${this.save.coins}`;
        let gCtx = document.getElementById('garageCanvas').getContext('2d');
        gCtx.clearRect(0,0,300,200); gCtx.save(); gCtx.translate(150, 100); VehicleDraw[v.draw](gCtx);
        gCtx.save(); gCtx.translate(v.wFx || 38, v.wFy || 14); VehicleDraw.drawWheel(gCtx, v.wRF || v.wR); gCtx.restore();
        gCtx.save(); gCtx.translate(v.wBx || -38, v.wBy || 14); VehicleDraw.drawWheel(gCtx, v.wRB || v.wR); gCtx.restore(); gCtx.restore();
        
        let buy = document.getElementById('btn-buy-veh'), sel = document.getElementById('btn-select-veh'), upgs = document.querySelector('.upgrades');
        if (sv?.unlocked) {
            buy.classList.add('hidden'); sel.classList.remove('hidden'); upgs.style.opacity = '1'; upgs.style.pointerEvents = 'auto';
            sel.innerText = this.save.selectedVehicle === v.id ? 'SELECTED' : 'SELECT';
            sel.disabled = this.save.selectedVehicle === v.id;
            const setU = (id, n, p) => { 
                let btn = document.getElementById(id); 
                btn.innerHTML = `${n} (Lvl ${p})<br><span class="cost">${p<10?SaveManager.getUpgCost(100,p):'MAX'}</span>`;
                btn.disabled = p>=10 || this.save.coins < SaveManager.getUpgCost(100,p);
            };
            setU('upg-engine', 'Engine', sv.engine); setU('upg-susp', 'Suspension', sv.susp);
            setU('upg-tires', 'Tires', sv.tires); setU('upg-fuel', 'Fuel Tank', sv.fuel);
        } else {
            buy.classList.remove('hidden'); sel.classList.add('hidden'); upgs.style.opacity = '0.3'; upgs.style.pointerEvents = 'none';
            buy.innerText = `BUY: ${v.cost}`; buy.disabled = this.save.coins < v.cost;
        }
    }
    
    updateLevelsUI() {
        let toggleTimeBtn = document.getElementById('btn-toggle-time');
        if (toggleTimeBtn) {
            let icon = document.getElementById('time-icon');
            let label = document.getElementById('time-label');
            if (this.save.nightMode) {
                toggleTimeBtn.style.background = '#1e1b4b';
                toggleTimeBtn.style.borderColor = '#6366f1';
                if (icon) icon.innerText = '🌙';
                if (label) label.innerText = 'NIGHT MODE';
            } else {
                toggleTimeBtn.style.background = '#1e293b';
                toggleTimeBtn.style.borderColor = '#3b82f6';
                if (icon) icon.innerText = '☀️';
                if (label) label.innerText = 'DAY MODE';
            }
        }
        
        let list = document.getElementById('levels-list'); 
        if (!list) return;
        list.innerHTML = '';
        LEVELS.forEach(l => {
            let sl = this.save.levels[l.id];
            let isSelected = (this.save.selectedLevel === l.id);
            let isCompleted = sl && (sl.completed || sl.best >= l.dist);
            let d = document.createElement('div'); 
            d.className = `level-card ${sl ? '' : 'locked'}`;
            if (isSelected) {
                d.style.borderColor = '#4CAF50';
                d.style.boxShadow = '0 0 14px rgba(76, 175, 80, 0.6)';
            }
            let badge = isCompleted 
                ? '<span style="color:#4CAF50; font-weight:bold; font-size:12px;">✓ COMPLETED</span>' 
                : (sl ? '<span style="color:#FFB74D; font-size:12px;">UNLOCKED</span>' : '<span style="color:#9e9e9e; font-size:12px;">🔒 LOCKED</span>');
            let envObj = ENVIRONMENTS.find(e => e.id === l.env) || ENVIRONMENTS[0];
            let weatherText = this.save.nightMode ? `🌙 Starry Night` : `${envObj.weatherIcon || '☀️'} ${envObj.weatherDesc || 'Clear'}`;
            d.innerHTML = `<h3>Stage ${l.id}: ${l.name}</h3><p style="font-size:12px; color:#fde047; margin-bottom:3px;">Weather: <b>${weatherText}</b></p><p>Distance Goal: <b>${l.dist}m</b></p><p>Best: ${sl ? Math.floor(sl.best) : 0}m</p><div style="margin-top:4px;">${badge}</div>`;
            if (sl) {
                d.onclick = () => {
                    this.audio.playClick();
                    this.save.selectedLevel = l.id;
                    SaveManager.save(this.save);
                    this.updateLevelsUI(); // Refresh border
                    this.updateMainMenu();
                };
            }
            list.appendChild(d);
        });
    }
    
    resumeLevel() {
        let rs = this.save.runState;
        if (!rs) return;
        
        if (this.gameOverTimeout) {
            clearTimeout(this.gameOverTimeout);
            this.gameOverTimeout = null;
        }
        
        this.curLevel = LEVELS.find(l => l.id === rs.levelId) || LEVELS[0];
        this.env = ENVIRONMENTS.find(e => e.id === this.curLevel.env) || ENVIRONMENTS[0];
        this.terrain = new Terrain(this.curLevel.diff, rs.terrainSeed);
        
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
        this.applyControlsLayout();
        
        ['ui-main', 'ui-garage', 'ui-levels', 'ui-pause', 'ui-game-over', 'ui-level-complete'].forEach(id => {
            let el = document.getElementById(id);
            if (el) el.classList.add('hidden');
        });
        
        let hud = document.getElementById('ui-hud');
        if (hud) hud.classList.remove('hidden');
        let hudEnv = document.getElementById('hud-env');
        if (hudEnv) {
            let wIcon = this.save.nightMode ? '🌙' : (this.env?.weatherIcon || '☀️');
            let wDesc = this.save.nightMode ? 'Night' : (this.env?.weatherDesc || 'Clear');
            hudEnv.innerText = `${this.curLevel.name} (${wIcon} ${wDesc})`;
        }
        
        this.state = 'PAUSE';
        let pauseUI = document.getElementById('ui-pause');
        if (pauseUI) pauseUI.classList.remove('hidden');
    }
    
    startLevel(lid, isMission = false) {
        if (this.gameOverTimeout) {
            clearTimeout(this.gameOverTimeout);
            this.gameOverTimeout = null;
        }
        let level = LEVELS.find(l => l.id === lid) || LEVELS[0];
        
        // Save current playing level
        this.save.selectedLevel = level.id;
        SaveManager.save(this.save);
        this.updateMainMenu();
        this.curLevel = level;
        this.env = ENVIRONMENTS.find(e => e.id === level.env) || ENVIRONMENTS[0];
        
        // Apply difficulty
        let diff = level.diff;
        
        this.terrain = new Terrain(diff);
        let vDef = VEHICLES.find(v => v.id === this.save.selectedVehicle) || VEHICLES[0];
        let vSave = this.save.vehicles[vDef.id] || { unlocked: true, engine: 1, susp: 1, tires: 1, fuel: 1 };
        this.veh = new Vehicle(vDef, vSave, this.terrain);
        this.items = new Items();
        this.particles = new Particles();

        // If race mode is active, re-initialize 2 bots
        if (this.raceMode) {
            this.bots = [];
            for(let i=0; i<2; i++) {
                let vDef = VEHICLES[i % VEHICLES.length];
                this.bots.push(new BotVehicle(vDef, {engine:1, susp:1, tires:1, fuel:1}, this.terrain, 200, this.veh, i));
            }
        }
        
        let totalWorldDist = level.dist * 10;
        
        // Spawn Coins in arcs
        for (let x = 800; x < totalWorldDist; x += Math.random() * 400 + 400) {
            let coinsInGroup = Math.floor(Math.random() * 5) + 4; // 4 to 8 coins
            for (let i = 0; i < coinsInGroup; i++) {
                let cx = x + i * 45;
                // Follow the terrain precisely, slightly above the ground
                let cy = this.terrain.getHeight(cx) - 25;
                this.items.spawn(cx, cy, 'coin');
            }
        }
        
        // Spawn Fuel consistently every 5000 units (~500m in-game)
        for (let x = 5000; x < totalWorldDist; x += 5000) {
            // Hover exactly 25px above the terrain crust
            let fy = this.terrain.getHeight(x) - 25;
            this.items.spawn(x, fy, 'fuel');
        }
        
        this.camX = 0;
        this.camY = this.veh.y;
        this.sessionCoins = 0;
        this.sessionStunts = 0;
        this.input = { gas: false, brake: false };
        this.applyControlsLayout();
        let hudCoins = document.getElementById('hud-coins');
        if (hudCoins) hudCoins.innerText = this.save.coins;
        
        ['ui-main', 'ui-garage', 'ui-levels', 'ui-pause', 'ui-game-over', 'ui-level-complete'].forEach(id => {
            let el = document.getElementById(id);
            if (el) el.classList.add('hidden');
        });
        let hud = document.getElementById('ui-hud');
        if (hud) hud.classList.remove('hidden');
        let hudEnv = document.getElementById('hud-env');
        if (hudEnv) {
            let wIcon = this.save.nightMode ? '🌙' : (this.env?.weatherIcon || '☀️');
            let wDesc = this.save.nightMode ? 'Night' : (this.env?.weatherDesc || 'Clear');
            hudEnv.innerText = `${level.name} (${wIcon} ${wDesc})`;
        }
        
        this.state = 'PLAY';
        this.audio.startEngine();
        this.audio.startMusic();
        this.lastTime = performance.now();
        this.accum = 0;
    }
    
    startRace(lid) {
        this.raceMode = true;
        this.startLevel(lid);
        this.bots = [];
        for(let i=0; i<2; i++) {
            let vDef = VEHICLES[i % VEHICLES.length];
            this.bots.push(new BotVehicle(vDef, {engine:1, susp:1, tires:1, fuel:1}, this.terrain, 200, this.veh, i));
        }

        // Add 3-2-1 Countdown
        this.state = 'COUNTDOWN';
        let count = 3;
        let hud = document.getElementById('hud-stunt');
        if (hud) {
            hud.style.opacity = 1;
            hud.innerText = count;
            let interval = setInterval(() => {
                if (count > 1) {
                    count--;
                    hud.innerText = count;
                } else if (count === 1) {
                    count--;
                    hud.innerText = 'GO!';
                    this.state = 'PLAY';
                    setTimeout(() => { hud.style.opacity = 0; }, 500);
                    clearInterval(interval);
                }
            }, 1000);
        }
    }
    
    pause() {
        this.state = 'PAUSE'; this.audio.playClick(); this.audio.stopEngine(); this.audio.stopMusic();
        document.getElementById('ui-pause').classList.remove('hidden');
    }
    
    gameOver() {
        this.state = 'GAMEOVER'; this.audio.stopEngine(); this.audio.stopMusic(); this.audio.playCrash();
        delete this.save.runState;
        let sl = this.save.levels[this.curLevel.id] || { unlocked: true, best: 0 };
        this.save.levels[this.curLevel.id] = sl;
        let d = Math.floor(this.veh.x / 10);
        if (d > sl.best) sl.best = d;
        // Coins were already saved to this.save.coins in real time upon collection
        this.updateMission('m1', d);
        this.updateMission('m2', this.sessionCoins);
        SaveManager.save(this.save);
        this.updateMainMenu();
        this.updateLevelsUI();
        
        document.getElementById('go-dist').innerText = `${d} m`;
        document.getElementById('go-best').innerText = `${Math.floor(sl.best)} m`;
        document.getElementById('go-coins').innerText = this.sessionCoins;
        
        let goReason = document.getElementById('go-reason');
        if (goReason) goReason.innerText = this.veh.fuel <= 0 ? "Out of Fuel" : (this.veh.crashReason || "Crashed");
        
        document.getElementById('ui-hud').classList.add('hidden');
        this.gameOverTimeout = setTimeout(() => {
            if (this.state === 'GAMEOVER') {
                document.getElementById('ui-game-over').classList.remove('hidden');
            }
        }, 1000);
    }
    
    levelComplete() {
        delete this.save.runState;
        this.activeMission = null;
        this.state = 'GAMEOVER'; this.audio.stopEngine(); this.audio.stopMusic(); this.audio.playUpgrade();
        let d = Math.floor(this.veh.x / 10);
        let bonus = this.sessionStunts * 10;
        // Coins were already saved to this.save.coins in real-time; add completion stunt bonus
        this.save.coins = (Number(this.save.coins) || 0) + bonus;
        this.updateMission('m1', d);
        this.updateMission('m2', this.sessionCoins);
        
        if (!this.save.levels[this.curLevel.id]) {
            this.save.levels[this.curLevel.id] = { unlocked: true, best: 0 };
        }
        this.save.levels[this.curLevel.id].best = Math.max(this.save.levels[this.curLevel.id].best, d);
        this.save.levels[this.curLevel.id].completed = true;
        
        let nextId = this.curLevel.id + 1;
        let nextLevelObj = LEVELS.find(l => l.id === nextId);
        if (nextLevelObj) {
            if (!this.save.levels[nextId]) {
                this.save.levels[nextId] = { unlocked: true, best: 0 };
            } else {
                this.save.levels[nextId].unlocked = true;
            }
            // Always auto-advance selectedLevel to the next stage!
            this.save.selectedLevel = nextId;
        }
        SaveManager.save(this.save);
        this.updateMainMenu();
        this.updateLevelsUI();
        
        document.getElementById('lc-dist').innerText = `${d} m`;
        document.getElementById('lc-coins').innerText = this.sessionCoins;
        document.getElementById('lc-stunts').innerText = `+${bonus}`;
        document.getElementById('lc-total').innerText = this.sessionCoins + bonus;
        
        let nextNameEl = document.getElementById('lc-next-name');
        if (nextNameEl && nextLevelObj) {
            nextNameEl.innerText = `Stage ${nextLevelObj.id} (${nextLevelObj.dist}m)`;
        }
        
        document.getElementById('btn-lc-next').style.display = nextLevelObj ? 'block' : 'none';
        
        document.getElementById('ui-hud').classList.add('hidden');
        document.getElementById('ui-level-complete').classList.remove('hidden');
    }
    
    showStunt(txt) {
        let el = document.getElementById('hud-stunt');
        el.innerText = txt; el.style.opacity = 1; el.style.transform = 'scale(1.5)';
        setTimeout(() => { el.style.transform = 'scale(1)'; }, 100);
        setTimeout(() => { el.style.opacity = 0; }, 2000);
    }
    
    update(dt) {
        if (this.state !== 'PLAY') return;
        
        this.veh.update(dt, this.input, this.terrain, this.audio);
        
        // Track missions in real-time
        if (this.veh && !this.veh.crashed) {
            this.updateMission('m1', Math.floor(this.veh.x / 10));
        }
        
        if (this.raceMode && this.bots) {
            for(let bot of this.bots) bot.update(dt, {gas: true, brake: false}, this.terrain, this.audio);
            
            // Check race win condition
            if (this.state === 'PLAY') {
                if (this.veh.x >= this.curLevel.dist * 10) {
                    this.levelComplete();
                } else {
                    for (let bot of this.bots) {
                        if (bot.x >= this.curLevel.dist * 10) {
                            this.gameOver();
                            let goReason = document.getElementById('go-reason');
                            if (goReason) goReason.innerText = "Bot won the race! Keep control and try again.";
                            break;
                        }
                    }
                }
            }
        }
        if (this.veh.flips > 0) {
            let flipCoins = this.veh.flips * 50;
            this.sessionStunts += this.veh.flips;
            this.sessionCoins += flipCoins;
            this.save.coins = (Number(this.save.coins) || 0) + flipCoins;
            SaveManager.save(this.save);
            let elCoins = document.getElementById('main-coins');
            if (elCoins) elCoins.innerText = `💰 ${this.save.coins}`;
            let gCoins = document.getElementById('garage-coins');
            if (gCoins) gCoins.innerText = `💰 ${this.save.coins}`;
            let hudCoins = document.getElementById('hud-coins');
            if (hudCoins) hudCoins.innerText = this.save.coins;
            this.showStunt(`FLIP x${this.veh.flips} (+${flipCoins})`); 
            this.audio.playCoin();
            this.veh.flips = 0;
        }
        
        let itRes = this.items.update(dt, this.veh.x, this.veh.y, this.audio);
        if (itRes.coins > 0) {
            this.sessionCoins += itRes.coins;
            this.updateMission('m2', this.sessionCoins);
            this.save.coins = (Number(this.save.coins) || 0) + itRes.coins;
            SaveManager.save(this.save);
            let elCoins = document.getElementById('main-coins');
            if (elCoins) elCoins.innerText = `💰 ${this.save.coins}`;
            let gCoins = document.getElementById('garage-coins');
            if (gCoins) gCoins.innerText = `💰 ${this.save.coins}`;
            let hudCoins = document.getElementById('hud-coins');
            if (hudCoins) hudCoins.innerText = this.save.coins;
        }
        if (itRes.fuel > 0) {
            this.veh.fuel = this.veh.maxFuel; // Refill to max
        }
        if (itRes.boost) this.veh.boostT = 3;
        
        this.particles.update(dt);
        if (this.weather) {
            this.weather.update(dt, this.curLevel ? this.curLevel.env : 'desert', this.veh ? this.veh.vx : 0);
        }
        
        // Auto-save run state every 2 seconds
        const now = performance.now();
        if (!this.lastSaveRunStateTime || now - this.lastSaveRunStateTime > 2000) {
            this.lastSaveRunStateTime = now;
            this.save.runState = {
                levelId: this.curLevel.id,
                terrainSeed: this.terrain.seed,
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
        }
        if (this.input.gas && !this.veh.crashed && this.veh.fuel > 0 && Math.random() < 0.4) {
            // Exhaust smoke puffs behind vehicle
            let cos = Math.cos(this.veh.angle), sin = Math.sin(this.veh.angle);
            let exhaustX = this.veh.x - 44 * cos - 5 * sin;
            let exhaustY = this.veh.y - 44 * sin + 5 * cos;
            this.particles.spawn(exhaustX, exhaustY, '#616161', 2);
        }
        
        this.camX = lerp(this.camX, this.veh.x - this.canvas.width * 0.32, dt * 5.5);
        this.camY = lerp(this.camY, this.veh.y, dt * 3.5);
        
        let dist = Math.floor(this.veh.x / 10);
        let speedKmH = Math.max(0, Math.floor(Math.abs(this.veh.vx) * 0.05));
        let rpmVal = Math.floor(this.veh.engineRPM / 100);
        
        // Update level progress bar
        let totalDistMeters = this.curLevel.dist;
        let progressPercent = Math.min(100, Math.max(0, (dist / totalDistMeters) * 100));
        let progBar = document.getElementById('hud-level-progress');
        if (progBar) progBar.style.width = `${progressPercent}%`;
        let carMarker = document.getElementById('hud-level-car-marker');
        if (carMarker) carMarker.style.left = `${progressPercent}%`;
        
        // Bot Markers
        let botMarkers = document.getElementsByClassName('bot-marker');
        for(let bm of botMarkers) bm.remove();
        if (this.raceMode && this.bots) {
            for(let i=0; i<this.bots.length; i++) {
                let bot = this.bots[i];
                let bDist = Math.floor(bot.x / 10);
                let bProg = Math.min(100, Math.max(0, (bDist / totalDistMeters) * 100));
                let bm = document.createElement('div');
                bm.className = 'bot-marker';
                bm.style.position = 'absolute';
                bm.style.left = `${bProg}%`;
                bm.style.top = '0';
                bm.style.width = '10px';
                bm.style.height = '10px';
                bm.style.borderRadius = '50%';
                bm.style.backgroundColor = i === 0 ? '#ef4444' : '#10b981';
                bm.style.transform = 'translateX(-50%) translateY(-25%)';
                document.getElementsByClassName('level-progress-bar')[0].appendChild(bm);
            }
        }
        
        // Nitro Timer HUD
        let nitroTimerEl = document.getElementById('nitro-timer');
        if (nitroTimerEl) {
            nitroTimerEl.innerText = this.veh.nitroCooldown > 0 ? Math.ceil(this.veh.nitroCooldown) : '';
        }
        
        document.getElementById('hud-dist').innerText = `${dist} m`;
        document.getElementById('hud-coins').innerText = this.save.coins;
        document.getElementById('hud-fuel').style.width = `${Math.max(0, (this.veh.fuel/this.veh.maxFuel)*100)}%`;
        document.getElementById('hud-fuel').style.background = this.veh.fuel < this.veh.maxFuel*0.2 ? '#F44336' : (this.veh.fuel < this.veh.maxFuel*0.5 ? '#FFEB3B' : '#4CAF50');
        
        // Update Hill Climb Racing Gauges
        let rpmEl = document.getElementById('hud-rpm');
        if (rpmEl) rpmEl.innerText = rpmVal;
        let speedEl = document.getElementById('hud-speed');
        if (speedEl) speedEl.innerText = speedKmH;
        
        // Active visual feedback on pedals for keyboard & touch
        let brakeBtn = document.getElementById('btn-touch-left');
        let gasBtn = document.getElementById('btn-touch-right');
        let isSwapped = (this.save.controlsLayout === 'swapped');
        
        if (brakeBtn) {
            let activeBrake = isSwapped ? this.input.gas : this.input.brake;
            if (activeBrake) brakeBtn.classList.add('active');
            else brakeBtn.classList.remove('active');
        }
        if (gasBtn) {
            let activeGas = isSwapped ? this.input.brake : this.input.gas;
            if (activeGas) gasBtn.classList.add('active');
            else gasBtn.classList.remove('active');
        }
        
        if ((this.veh.crashed || this.veh.fuel <= 0) && this.state === 'PLAY') this.gameOver();
        if (dist >= this.curLevel.dist && this.state === 'PLAY') this.levelComplete();
    }
    
    draw() {
        let cw = this.canvas.width, ch = this.canvas.height;
        this.ctx.clearRect(0,0,cw,ch);
        
        if (this.state === 'MENU') {
            let grd = this.ctx.createLinearGradient(0,0,0,ch); grd.addColorStop(0, '#1a2a6c'); grd.addColorStop(1, '#b21f1f');
            this.ctx.fillStyle = grd; this.ctx.fillRect(0,0,cw,ch); return;
        }

        let eSky1 = this.env.sky1;
        let eSky2 = this.env.sky2;
        let eHills2 = this.env.hills2 || '#1b5e20';
        let eHills = this.env.hills;
        let eSubsoil = this.env.subsoil || '#5d4037';
        let eGround = this.env.ground;

        if (this.save.nightMode) {
            eSky1 = this.env.nightSky1 || darkenHex(eSky1, 0.15);
            eSky2 = this.env.nightSky2 || darkenHex(eSky2, 0.2);
            eHills2 = this.env.nightHills2 || darkenHex(eHills2, 0.2);
            eHills = this.env.nightHills || darkenHex(eHills, 0.25);
            eSubsoil = this.env.nightSubsoil || darkenHex(eSubsoil, 0.35);
            eGround = this.env.nightGround || darkenHex(eGround, 0.45);
        }
        
        // 1. Sky Gradient
        let skyGrd = this.ctx.createLinearGradient(0, 0, 0, ch);
        skyGrd.addColorStop(0, eSky1);
        skyGrd.addColorStop(1, eSky2);
        this.ctx.fillStyle = skyGrd;
        this.ctx.fillRect(0, 0, cw, ch);

        if (this.save.nightMode) {
            this.ctx.fillStyle = '#ffffff';
            this.ctx.save();
            this.ctx.translate(-this.camX * 0.03, 0); // Slow star parallax
            let starStart = Math.floor(this.camX * 0.03 / 800) * 800; 
            for (let chunk = -1; chunk <= 2; chunk++) {
                let chunkX = starStart + chunk * 800;
                for (let i = 0; i < 60; i++) {
                    let sx = chunkX + Math.abs(Math.sin(i * 342.1)) * 800;
                    let sy = Math.abs(Math.cos(i * 721.4)) * ch * 0.6; // Top 60%
                    let r = Math.abs(Math.sin(i * 111.1)) * 1.5;
                    this.ctx.globalAlpha = 0.2 + 0.8 * Math.abs(Math.sin(performance.now() * 0.002 + i));
                    this.ctx.beginPath();
                    this.ctx.arc(sx, sy, r, 0, Math.PI * 2);
                    this.ctx.fill();
                }
            }
            this.ctx.restore();
            this.ctx.globalAlpha = 1.0;
        }
        
        // Celestial bodies (Sun/Moon) and procedural clouds
        if (this.weather) {
            this.weather.drawSky(this.ctx, cw, ch, this.camX, this.curLevel ? this.curLevel.env : 'desert', this.weather.isNight);
        }
        
        // 2. Far Mountain Range (Slow parallax)
        this.ctx.save();
        this.ctx.translate(-this.camX * 0.12, 0);
        this.ctx.fillStyle = eHills2;
        this.ctx.beginPath();
        let farStart = Math.floor((this.camX * 0.12 - 200) / 120) * 120;
        let farEnd = farStart + cw + 400;
        this.ctx.moveTo(farStart, ch);
        for(let x = farStart; x <= farEnd; x += 60) {
            let my = ch * 0.52 + Math.sin(x * 0.003) * 80 + Math.cos(x * 0.007) * 40;
            this.ctx.lineTo(x, my);
        }
        this.ctx.lineTo(farEnd, ch);
        this.ctx.fill();
        this.ctx.restore();
        
        // 3. Mid Hills (Medium parallax)
        this.ctx.save();
        this.ctx.translate(-this.camX * 0.28, 0);
        this.ctx.fillStyle = eHills;
        this.ctx.beginPath(); 
        let hillStart = Math.floor((this.camX * 0.28 - 200) / 80) * 80;
        let hillEnd = hillStart + cw + 400;
        this.ctx.moveTo(hillStart, ch);
        for(let x = hillStart; x <= hillEnd; x += 50) {
            let my = ch * 0.62 + Math.sin(x * 0.006) * 60 + Math.sin(x * 0.014) * 25;
            this.ctx.lineTo(x, my);
        }
        this.ctx.lineTo(hillEnd, ch);
        this.ctx.fill();
        this.ctx.restore();
        
        // 4. Fore Ground Mountain Track (Full physics terrain)
        this.ctx.save();
        this.ctx.translate(-this.camX, -this.camY + ch * 0.62);
        
        let startX = Math.floor(Math.max(0, this.camX - 250) / this.terrain.segW) * this.terrain.segW;
        let endX = this.camX + cw + 250;
        
        // Ground Subsoil Fill (Brown Dirt/Stone Layer)
        this.ctx.fillStyle = eSubsoil;
        this.ctx.beginPath();
        this.ctx.moveTo(startX, 2500);
        for(let x = startX; x <= endX; x += this.terrain.segW) {
            this.ctx.lineTo(x, this.terrain.getHeight(x));
        }
        this.ctx.lineTo(endX, 2500);
        this.ctx.fill();
        
        // Top Grass / Crust Ribbon (Green/Snow surface layer with depth)
        this.ctx.fillStyle = eGround;
        this.ctx.strokeStyle = '#1b1b1b';
        this.ctx.lineWidth = 3.5;
        this.ctx.beginPath();
        for(let x = startX; x <= endX; x += this.terrain.segW) {
            let hy = this.terrain.getHeight(x);
            if (x === startX) this.ctx.moveTo(x, hy);
            else this.ctx.lineTo(x, hy);
        }
        // Trace back 16px down for solid crust
        for(let x = endX; x >= startX; x -= this.terrain.segW) {
            this.ctx.lineTo(x, this.terrain.getHeight(x) + 16);
        }
        this.ctx.closePath();
        this.ctx.fill();
        
        // Top Outline border along track crest
        this.ctx.beginPath();
        for(let x = startX; x <= endX; x += this.terrain.segW) {
            let hy = this.terrain.getHeight(x);
            if (x === startX) this.ctx.moveTo(x, hy);
            else this.ctx.lineTo(x, hy);
        }
        this.ctx.stroke();
        
        // Items and Particle effects
        this.items.draw(this.ctx);
        this.particles.draw(this.ctx);
        
        // Checkered Finish Line Arch & Flag
        let finishX = this.curLevel.dist * 10;
        if (finishX >= startX - 100 && finishX <= endX + 100) {
            let finishY = this.terrain.getHeight(finishX);
            this.ctx.save();
            this.ctx.translate(finishX, finishY);
            
            // Pole
            this.ctx.fillStyle = '#f5f5f5';
            this.ctx.fillRect(-4, -90, 8, 90);
            this.ctx.strokeStyle = '#212121';
            this.ctx.lineWidth = 1.5;
            this.ctx.strokeRect(-4, -90, 8, 90);
            
            // Gold topper
            this.ctx.fillStyle = '#ffd700';
            this.ctx.beginPath();
            this.ctx.arc(0, -94, 7, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.stroke();
            
            // Checkered flag waving
            let fw = 44, fh = 30;
            for(let r = 0; r < 4; r++) {
                for(let c = 0; c < 4; c++) {
                    this.ctx.fillStyle = (r + c) % 2 === 0 ? '#111' : '#fff';
                    this.ctx.fillRect(c * (fw / 4), -90 + r * (fh / 4), fw / 4, fh / 4);
                }
            }
            this.ctx.strokeRect(0, -90, fw, fh);
            
            // Banner text
            this.ctx.fillStyle = '#2e7d32';
            this.ctx.beginPath();
            if (this.ctx.roundRect) {
                this.ctx.roundRect(-45, -118, 90, 22, 5);
            } else {
                this.ctx.rect(-45, -118, 90, 22);
            }
            this.ctx.fill();
            this.ctx.strokeStyle = '#ffffff';
            this.ctx.lineWidth = 1.5;
            this.ctx.stroke();
            
            this.ctx.fillStyle = '#ffffff';
            this.ctx.font = 'bold 11px sans-serif';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(`🏁 ${this.curLevel.dist}m FINISH`, 0, -103);
            
            this.ctx.restore();
        }
        
        // 5. Vehicle Rendering
        this.ctx.save();
        this.ctx.translate(this.veh.x, this.veh.y);
        this.ctx.rotate(this.veh.angle);
        
        // Draw Vehicle Body & Driver
        VehicleDraw[this.veh.def.draw](this.ctx);
        
        // Draw player wheels
        this.ctx.save();
        this.ctx.translate(this.veh.wF.x, this.veh.wF.y);
        this.ctx.rotate(this.veh.wF.a);
        VehicleDraw.drawWheel(this.ctx, this.veh.def.wRF || this.veh.def.wR);
        this.ctx.restore();

        this.ctx.save();
        this.ctx.translate(this.veh.wB.x, this.veh.wB.y);
        this.ctx.rotate(this.veh.wB.a);
        VehicleDraw.drawWheel(this.ctx, this.veh.def.wRB || this.veh.def.wR);
        this.ctx.restore();
        
        // Flame effect if nitro active
        if (this.veh.nitro > 0) {
            this.ctx.fillStyle = '#FF9800';
            this.ctx.beginPath();
            this.ctx.moveTo(-30, 5);
            this.ctx.lineTo(-70 - Math.random() * 30, 0);
            this.ctx.lineTo(-30, -5);
            this.ctx.fill();
        }
        
        // Draw Bot Vehicles
        if (this.raceMode && this.bots) {
            this.ctx.restore(); // Restore to world
            for (let bot of this.bots) {
                // Transparency logic: other cars become partially visible when they cross the player
                let dist = Math.hypot(bot.x - this.veh.x, bot.y - this.veh.y);
                let alpha = (dist < 150) ? (0.5 + (dist / 150) * 0.5) : 1.0;
                this.ctx.globalAlpha = alpha;
                
                this.ctx.save();
                this.ctx.translate(bot.x, bot.y);
                this.ctx.rotate(bot.angle);
                VehicleDraw[bot.def.draw](this.ctx);
                
                // Draw bot wheels
                let wheelRotationSpeed = bot.vx * 0.05; // Calculate rotation based on velocity
                let newWFa = (bot.wFa || 0) + wheelRotationSpeed;
                let newWBa = (bot.wBa || 0) + wheelRotationSpeed;
                
                this.ctx.save();
                this.ctx.translate(bot.wFx || bot.def.wFx || 38, bot.wFy || bot.def.wFy || 14);
                this.ctx.rotate(newWFa);
                VehicleDraw.drawWheel(this.ctx, bot.def.wRF || bot.def.wR);
                this.ctx.restore();
                
                this.ctx.save();
                this.ctx.translate(bot.wBx || bot.def.wBx || -38, bot.wBy || bot.def.wBy || 14);
                this.ctx.rotate(newWBa);
                VehicleDraw.drawWheel(this.ctx, bot.def.wRB || bot.def.wR);
                this.ctx.restore();
                
                // Update bot wheel angles for next frame
                bot.wFa = newWFa;
                bot.wBa = newWBa;
                
                this.ctx.restore();
                this.ctx.globalAlpha = 1.0; // Reset
            }
            this.ctx.save(); // Re-save for headlights
            this.ctx.translate(this.veh.x, this.veh.y);
            this.ctx.rotate(this.veh.angle);
        }
        
        // Headlights in night mode
        if (this.save.nightMode) {
            this.ctx.save();
            let headLightX = this.veh.def.wFx || 35;
            let headLightY = -15; // approximate front
            this.ctx.translate(headLightX, headLightY);
            this.ctx.beginPath();
            this.ctx.moveTo(0, 0);
            this.ctx.lineTo(800, -250);
            this.ctx.lineTo(800, 350);
            this.ctx.closePath();
            
            let lightGrd = this.ctx.createLinearGradient(0, 0, 700, 0);
            lightGrd.addColorStop(0, 'rgba(255, 255, 180, 0.45)');
            lightGrd.addColorStop(1, 'rgba(255, 255, 180, 0)');
            this.ctx.fillStyle = lightGrd;
            
            this.ctx.globalCompositeOperation = 'screen';
            this.ctx.fill();
            this.ctx.restore();
            
            // Tail light glow
            this.ctx.save();
            let tailLightX = this.veh.def.wBx || -35;
            this.ctx.translate(tailLightX - 10, -15);
            this.ctx.beginPath();
            this.ctx.arc(0, 0, 15, 0, Math.PI*2);
            let tailGrd = this.ctx.createRadialGradient(0, 0, 0, 0, 0, 15);
            tailGrd.addColorStop(0, 'rgba(255, 0, 0, 0.7)');
            tailGrd.addColorStop(1, 'rgba(255, 0, 0, 0)');
            this.ctx.fillStyle = tailGrd;
            this.ctx.globalCompositeOperation = 'screen';
            this.ctx.fill();
            this.ctx.restore();
        }
        
        // Front Wheel
        this.ctx.save();
        this.ctx.translate(this.veh.wF.x, this.veh.wF.y);
        this.ctx.rotate(this.veh.wF.a);
        VehicleDraw.drawWheel(this.ctx, this.veh.def.wR);
        this.ctx.restore();
        
        // Rear Wheel
        this.ctx.save();
        this.ctx.translate(this.veh.wB.x, this.veh.wB.y);
        this.ctx.rotate(this.veh.wB.a);
        VehicleDraw.drawWheel(this.ctx, this.veh.def.wR);
        this.ctx.restore();
        
        this.ctx.restore(); // Vehicle
        this.ctx.restore(); // World
        
        // Atmospheric foreground weather effects (e.g. desert golden sand breeze, snow flurries, embers)
        if (this.weather) {
            this.weather.drawForeground(this.ctx, cw, ch, this.camX, this.curLevel ? this.curLevel.env : 'desert', this.save.nightMode);
        }
    }
    
    loop(time) {
        let dt = (time - this.lastTime) / 1000; this.lastTime = time;
        if (dt > 0.1) dt = 0.1;
        this.accum += dt;
        while(this.accum >= CONSTANTS.PHYSICS_STEP) { this.update(CONSTANTS.PHYSICS_STEP); this.accum -= CONSTANTS.PHYSICS_STEP; }
        this.draw();
        requestAnimationFrame((t) => this.loop(t));
    }
}

function bootGame() {
    if (!window.__gameInstance) {
        window.__gameInstance = new Game();
    }
}

if (document.readyState === 'complete' || document.readyState === 'interactive') {
    bootGame();
} else {
    document.addEventListener('DOMContentLoaded', bootGame);
    window.addEventListener('load', bootGame);
}
