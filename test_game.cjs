// Mock DOM
const { JSDOM } = require("jsdom");
const dom = new JSDOM(`<!DOCTYPE html><html><body>
<canvas id="gameCanvas"></canvas>
<div id="ui-main"></div><div id="main-coins"></div>
<button id="btn-settings-open"></button><div id="ui-settings" class="hidden"></div>
<button id="btn-settings-back"></button><button id="btn-settings-close"></button><button id="btn-pause-settings"></button>
<input type="range" id="slider-sfx-vol" value="80"><span id="val-sfx-vol">80%</span>
<input type="range" id="slider-music-vol" value="70"><span id="val-music-vol">70%</span>
<button id="btn-ctrl-normal"></button><button id="btn-ctrl-swapped"></button>
<button id="btn-size-normal"></button><button id="btn-size-large"></button>
<button id="btn-reset-data"></button>
<button id="btn-play"></button><button id="btn-garage"></button><button id="btn-levels"></button>
<input type="checkbox" id="chk-sound"><input type="checkbox" id="chk-music">
<div id="ui-garage"></div><canvas id="garageCanvas" width="300" height="200"></canvas><h3 id="garage-vname"></h3><div id="garage-coins"></div>
<button id="btn-buy-veh"></button><div class="upgrades"></div><button id="btn-prev-veh"></button><button id="btn-select-veh"></button><button id="btn-next-veh"></button>
<button id="btn-garage-back"></button><button id="upg-engine"></button><button id="upg-susp"></button><button id="upg-tires"></button><button id="upg-fuel"></button>
<button id="btn-levels-back"></button><div id="ui-levels"></div><div id="levels-list"></div><div id="ui-hud"></div>
<div id="hud-coins"></div><div id="hud-dist"></div><div id="hud-env"></div><div id="hud-stunt"></div><div id="hud-fuel"></div>
<button id="btn-pause"></button><button id="btn-touch-left"></button><button id="btn-touch-right"></button><div id="ui-pause"></div>
<button id="btn-resume"></button><button id="btn-restart"></button><button id="btn-quit"></button><div id="ui-game-over"></div>
<span id="go-reason"></span><span id="go-dist"></span><span id="go-best"></span><span id="go-coins"></span>
<button id="btn-go-retry"></button><button id="btn-go-garage"></button><button id="btn-go-menu"></button>
<div id="ui-level-complete"></div><span id="lc-dist"></span><span id="lc-coins"></span><span id="lc-stunts"></span><span id="lc-total"></span>
<button id="btn-lc-next"></button><button id="btn-lc-garage"></button><button id="btn-lc-menu"></button>
<button id="btn-garage-menu"></button><button id="btn-levels-menu"></button>
</body></html>`);
global.window = dom.window;
global.document = dom.window.document;
global.localStorage = { getItem:()=>null, setItem:()=>{} };
global.performance = require('perf_hooks').performance;
global.requestAnimationFrame = (cb) => setTimeout(()=>cb(performance.now()), 16);
global.AudioContext = class { state='running'; resume(){} createOscillator(){return {connect:()=>{}, start:()=>{}, stop:()=>{}, frequency:{value:0, setTargetAtTime:()=>{}}, type:''}} createGain(){return {connect:()=>{}, gain:{value:0, setValueAtTime:()=>{}, exponentialRampToValueAtTime:()=>{}, setTargetAtTime:()=>{}}}} createBuffer(){return {getChannelData:()=>[]}} createBufferSource(){return {connect:()=>{}, start:()=>{}}} };
window.webkitAudioContext = global.AudioContext;
window.innerWidth = 800; window.innerHeight = 600;

const mockCtx = new Proxy({}, {
    get: (t, p) => {
        if (p === 'createLinearGradient' || p === 'createRadialGradient') {
            return () => ({ addColorStop: () => {} });
        }
        if (typeof p === 'string' && (p.startsWith('is') || p === 'measureText')) {
            return () => ({ width: 10 });
        }
        return () => {};
    }
});
dom.window.HTMLCanvasElement.prototype.getContext = () => mockCtx;

// Load game.js
const fs = require('fs');
const code = fs.readFileSync('game.js', 'utf8');
(0, eval)(code + "; global.Game = Game;");

// Run a bit
setTimeout(() => {
    try {
        const game = new Game();
        
        // Test Settings Opening
        const btnOpen = document.getElementById('btn-settings-open');
        btnOpen.click();
        console.log("Settings opened. ui-settings hidden:", document.getElementById('ui-settings').classList.contains('hidden'));
        
        // Test SFX volume change
        const sfxSlider = document.getElementById('slider-sfx-vol');
        sfxSlider.value = "45";
        sfxSlider.oninput({ target: sfxSlider });
        console.log("SFX volume set to:", game.save.sfxVolume, "Display:", document.getElementById('val-sfx-vol').innerText);
        if (game.save.sfxVolume !== 0.45) throw new Error("SFX volume not updated!");

        // Test Music volume change
        const musSlider = document.getElementById('slider-music-vol');
        musSlider.value = "90";
        musSlider.oninput({ target: musSlider });
        console.log("Music volume set to:", game.save.musicVolume, "Display:", document.getElementById('val-music-vol').innerText);
        if (game.save.musicVolume !== 0.9) throw new Error("Music volume not updated!");

        // Test Pedal Layout Swap (Button Change)
        const btnSwap = document.getElementById('btn-ctrl-swapped');
        btnSwap.click();
        console.log("Controls layout after swap:", game.save.controlsLayout);
        if (game.save.controlsLayout !== 'swapped') throw new Error("Controls layout not swapped!");

        // Test Pedal Size Change
        const btnLarge = document.getElementById('btn-size-large');
        btnLarge.click();
        console.log("Pedal size after change:", game.save.pedalSize);
        if (game.save.pedalSize !== 'large') throw new Error("Pedal size not set to large!");

        // Test Settings Back
        const btnBack = document.getElementById('btn-settings-back');
        btnBack.click();
        console.log("Settings closed with DONE. ui-settings hidden:", document.getElementById('ui-settings').classList.contains('hidden'));

        // Test Settings Reopen and Close with X button
        btnOpen.click();
        console.log("Settings reopened. ui-settings hidden:", document.getElementById('ui-settings').classList.contains('hidden'));
        const btnCloseX = document.getElementById('btn-settings-close');
        btnCloseX.click();
        console.log("Settings closed with X. ui-settings hidden:", document.getElementById('ui-settings').classList.contains('hidden'));

        // Test gameplay loop
        game.startLevel(1);
        game.loop(performance.now() + 16);
        console.log("GAMEPLAY LOOP SUCCESS");
        console.log("Cam:", game.camX, game.camY, "Veh:", game.veh.x, game.veh.y);
        process.exit(0);
    } catch (e) {
        console.error("ERROR:", e);
        process.exit(1);
    }
}, 100);
