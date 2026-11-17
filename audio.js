/* ============================================================
KANATO DE JOTUN · audio.js — Motor de sonido procedural v3
Web Audio 100% procedural: SFX por capas, ambiente día/noche,
lluvia, viento y música generativa. Unlock en el primer gesto,
techo de voces, rate-limit por SFX y limpieza total de nodos.
Añade los sonidos del combate v3: bloqueo, parry, embate,
tensado de arco, disparo y carga pesada.
============================================================ */
(function () {
'use strict';
var CR = window.CR;
if (!CR) { console.error('[CR] audio.js requiere core.js'); return; }
var U = CR.util;
var A = CR.Audio = {
  available: false, ctx: null,
  _master: null, _sfx: null, _amb: null, _musBus: null,
  _noiseBuf: null, _windGain: null, _rainGain: null,
  _voices: 0, _last: Object.create(null),
  _env: { night: 0, rain: 0, wind: 0.3, indoors: false },
  _ap: { wind: -1, rain: -1 },
  _birdT: 2, _cricketT: 1, _musicT: 1.5,
  _rng: CR.RNG(0xC0FFEE), _disposed: false
};
var MAX_VOICES = 32;
/* Capas: k='o' oscilador | k='n' ruido filtrado.
   w=forma · f/f1=freq inicio/fin · ft/f f/f1=filtro · q=resonancia ·
   d=duración · v=volumen · t=retardo · a=ataque */
var S = {
  click:   [{ k: 'o', w: 'square', f: 880, d: 0.05, v: 0.15 }],
  open:    [{ k: 'o', w: 'triangle', f: 520, f1: 760, d: 0.1, v: 0.18 }],
  close:   [{ k: 'o', w: 'triangle', f: 700, f1: 420, d: 0.1, v: 0.16 }],
  error:   [{ k: 'o', w: 'sawtooth', f: 130, d: 0.14, v: 0.2 }, { k: 'o', w: 'sawtooth', f: 110, d: 0.16, v: 0.2, t: 0.12 }],
  swing:   [{ k: 'n', ft: 'bandpass', ff: 600, ff1: 1900, q: 1.2, d: 0.12, v: 0.22 }],
  chop:    [{ k: 'n', ft: 'lowpass', ff: 420, d: 0.08, v: 0.4 }, { k: 'o', w: 'triangle', f: 180, f1: 85, d: 0.1, v: 0.3 }],
  pick:    [{ k: 'n', ft: 'highpass', ff: 2400, d: 0.035, v: 0.3 }, { k: 'o', w: 'square', f: 1250, f1: 900, d: 0.05, v: 0.12 }, { k: 'o', w: 'sine', f: 2400, d: 0.07, v: 0.08, t: 0.01 }],
  hit:     [{ k: 'o', w: 'triangle', f: 165, f1: 55, d: 0.12, v: 0.45 }, { k: 'n', ft: 'lowpass', ff: 800, d: 0.06, v: 0.3 }],
  crit:    [{ k: 'o', w: 'triangle', f: 165, f1: 55, d: 0.14, v: 0.5 }, { k: 'n', ft: 'lowpass', ff: 900, d: 0.08, v: 0.35 }, { k: 'o', w: 'sine', f: 1500, f1: 2200, d: 0.1, v: 0.14, t: 0.02 }],
  hurt:    [{ k: 'o', w: 'sawtooth', f: 300, f1: 115, d: 0.18, v: 0.3 }],
  die:     [{ k: 'o', w: 'sawtooth', f: 220, f1: 38, d: 0.55, v: 0.32 }, { k: 'n', ft: 'lowpass', ff: 500, ff1: 120, d: 0.4, v: 0.2, t: 0.05 }],
  coin:    [{ k: 'o', w: 'sine', f: 1320, d: 0.07, v: 0.18 }, { k: 'o', w: 'sine', f: 1760, d: 0.14, v: 0.18, t: 0.07 }],
  buy:     [{ k: 'o', w: 'sine', f: 990, d: 0.07, v: 0.16 }, { k: 'o', w: 'sine', f: 740, d: 0.12, v: 0.16, t: 0.07 }, { k: 'o', w: 'square', f: 880, d: 0.03, v: 0.08, t: 0.16 }],
  sell:    [{ k: 'o', w: 'sine', f: 740, d: 0.06, v: 0.16 }, { k: 'o', w: 'sine', f: 990, d: 0.06, v: 0.16, t: 0.06 }, { k: 'o', w: 'sine', f: 1320, d: 0.14, v: 0.18, t: 0.12 }],
  craft:   [{ k: 'o', w: 'square', f: 900, d: 0.04, v: 0.14 }, { k: 'o', w: 'square', f: 1200, d: 0.04, v: 0.14, t: 0.1 }, { k: 'o', w: 'square', f: 1500, d: 0.09, v: 0.16, t: 0.2 }],
  eat:     [{ k: 'n', ft: 'lowpass', ff: 620, d: 0.06, v: 0.28 }, { k: 'n', ft: 'lowpass', ff: 520, d: 0.06, v: 0.24, t: 0.11 }],
  drink:   [{ k: 'o', w: 'sine', f: 300, f1: 520, d: 0.08, v: 0.14 }, { k: 'o', w: 'sine', f: 340, f1: 580, d: 0.08, v: 0.14, t: 0.1 }, { k: 'o', w: 'sine', f: 380, f1: 640, d: 0.1, v: 0.14, t: 0.2 }],
  harvest: [{ k: 'o', w: 'triangle', f: 500, f1: 820, d: 0.09, v: 0.2 }, { k: 'n', ft: 'highpass', ff: 1800, d: 0.05, v: 0.1, t: 0.02 }],
  splash:  [{ k: 'n', ft: 'lowpass', ff: 950, ff1: 280, d: 0.28, v: 0.3 }],
  fish:    [{ k: 'n', ft: 'lowpass', ff: 950, ff1: 300, d: 0.22, v: 0.26 }, { k: 'o', w: 'sine', f: 880, d: 0.07, v: 0.16, t: 0.18 }, { k: 'o', w: 'sine', f: 1175, d: 0.14, v: 0.16, t: 0.26 }],
  levelup: [{ k: 'o', w: 'triangle', f: 523, d: 0.12, v: 0.2 }, { k: 'o', w: 'triangle', f: 659, d: 0.12, v: 0.2, t: 0.1 }, { k: 'o', w: 'triangle', f: 784, d: 0.12, v: 0.2, t: 0.2 }, { k: 'o', w: 'triangle', f: 1047, d: 0.26, v: 0.22, t: 0.3 }],
  freedom: [{ k: 'o', w: 'triangle', f: 392, d: 0.16, v: 0.2 }, { k: 'o', w: 'triangle', f: 523, d: 0.16, v: 0.2, t: 0.14 }, { k: 'o', w: 'triangle', f: 659, d: 0.16, v: 0.2, t: 0.28 }, { k: 'o', w: 'triangle', f: 784, d: 0.16, v: 0.2, t: 0.42 }, { k: 'o', w: 'triangle', f: 1047, d: 0.5, v: 0.24, t: 0.56 }, { k: 'o', w: 'sine', f: 660, d: 1.1, v: 0.12, t: 0.56 }],
  bell:    [{ k: 'o', w: 'sine', f: 660, d: 1.2, v: 0.2 }, { k: 'o', w: 'sine', f: 1320, d: 0.9, v: 0.08 }, { k: 'o', w: 'sine', f: 1980, d: 0.5, v: 0.04 }],
  tame:    [{ k: 'o', w: 'sine', f: 800, f1: 1200, d: 0.09, v: 0.16 }, { k: 'o', w: 'sine', f: 900, f1: 1350, d: 0.09, v: 0.16, t: 0.11 }, { k: 'o', w: 'sine', f: 1000, f1: 1500, d: 0.14, v: 0.18, t: 0.22 }],
  mount:   [{ k: 'n', ft: 'bandpass', ff: 420, q: 1.5, d: 0.14, v: 0.22 }, { k: 'o', w: 'triangle', f: 300, f1: 380, d: 0.12, v: 0.14, t: 0.05 }],
  flap:    [{ k: 'n', ft: 'bandpass', ff: 320, ff1: 180, q: 1.1, d: 0.18, v: 0.26 }],
  roar:    [{ k: 'o', w: 'sawtooth', f: 95, f1: 42, d: 0.8, v: 0.4 }, { k: 'n', ft: 'lowpass', ff: 320, ff1: 120, d: 0.65, v: 0.3, t: 0.05 }],
  fire:    [{ k: 'n', ft: 'bandpass', ff: 1000, ff1: 400, q: 0.9, d: 0.32, v: 0.3 }, { k: 'o', w: 'sawtooth', f: 210, f1: 75, d: 0.28, v: 0.16 }],
  poison:  [{ k: 'o', w: 'sine', f: 420, f1: 190, d: 0.3, v: 0.16 }, { k: 'o', w: 'sine', f: 380, f1: 210, d: 0.25, v: 0.12, t: 0.12 }],
  step:    [{ k: 'n', ft: 'lowpass', ff: 480, d: 0.03, v: 0.1 }],
  sleep:   [{ k: 'o', w: 'triangle', f: 220, f1: 165, d: 0.7, v: 0.14 }, { k: 'o', w: 'triangle', f: 330, f1: 247, d: 0.7, v: 0.08, t: 0.1 }],
  build:   [{ k: 'o', w: 'square', f: 700, d: 0.05, v: 0.16 }, { k: 'n', ft: 'lowpass', ff: 420, d: 0.08, v: 0.3, t: 0.12 }, { k: 'o', w: 'square', f: 900, d: 0.05, v: 0.16, t: 0.24 }],
  door:    [{ k: 'o', w: 'square', f: 880, d: 0.04, v: 0.1 }, { k: 'o', w: 'sawtooth', f: 185, f1: 150, d: 0.22, v: 0.08, t: 0.05 }],
  quest:   [{ k: 'o', w: 'triangle', f: 660, d: 0.1, v: 0.18 }, { k: 'o', w: 'triangle', f: 880, d: 0.18, v: 0.18, t: 0.1 }],
  baby:    [{ k: 'o', w: 'sine', f: 900, f1: 1400, d: 0.1, v: 0.12 }, { k: 'o', w: 'sine', f: 1000, f1: 1500, d: 0.12, v: 0.12, t: 0.13 }],
  bossdown:[{ k: 'o', w: 'sawtooth', f: 80, f1: 30, d: 0.9, v: 0.35 }, { k: 'o', w: 'triangle', f: 523, d: 0.14, v: 0.2, t: 0.7 }, { k: 'o', w: 'triangle', f: 784, d: 0.14, v: 0.2, t: 0.84 }, { k: 'o', w: 'triangle', f: 1047, d: 0.4, v: 0.24, t: 0.98 }],
  /* --- Nuevos del combate v3 --- */
  block:   [{ k: 'n', ft: 'bandpass', ff: 320, q: 2, d: 0.09, v: 0.35 }, { k: 'o', w: 'square', f: 190, f1: 120, d: 0.08, v: 0.2 }],
  parry:   [{ k: 'o', w: 'square', f: 1560, f1: 2340, d: 0.11, v: 0.22 }, { k: 'n', ft: 'highpass', ff: 3200, d: 0.06, v: 0.16 }, { k: 'o', w: 'sine', f: 3120, d: 0.14, v: 0.08, t: 0.03 }],
  bash:    [{ k: 'n', ft: 'lowpass', ff: 260, d: 0.12, v: 0.4 }, { k: 'o', w: 'triangle', f: 140, f1: 60, d: 0.14, v: 0.3, t: 0.02 }],
  draw:    [{ k: 'n', ft: 'bandpass', ff: 900, ff1: 400, q: 1.4, d: 0.34, v: 0.16 }, { k: 'o', w: 'sawtooth', f: 70, f1: 130, d: 0.3, v: 0.08, t: 0.04 }],
  shot:    [{ k: 'n', ft: 'highpass', ff: 2600, d: 0.05, v: 0.28 }, { k: 'o', w: 'square', f: 1180, f1: 320, d: 0.09, v: 0.12 }],
  charge:  [{ k: 'o', w: 'sine', f: 90, f1: 220, d: 0.4, v: 0.12 }, { k: 'n', ft: 'lowpass', ff: 180, ff1: 420, d: 0.36, v: 0.14, t: 0.04 }]
};
var GAP = { step: 130, chop: 90, pick: 90, swing: 80, hit: 50, flap: 200, coin: 60, eat: 150, splash: 120, shot: 60, block: 70, parry: 90 };
var DEFAULT_GAP = 30;

A.init = function () {
  if (!CR.caps.audio) { A.available = false; return; }
  A.available = true;
  var unlock = function () { A._ensure(); };
  CR.Bindings.add(window, 'pointerdown', unlock, { passive: true }, 'audio');
  CR.Bindings.add(window, 'keydown', unlock, false, 'audio');
  CR.Bus.on('settings', function (k) {
    if (k === 'volume' || k === 'music' || k === 'ambience') A._applySettings();
  }, 'audio');
};
A._ensure = function () {
  if (!A.available || A._disposed) return;
  try {
    if (!A.ctx) {
      var Ctor = window.AudioContext || window.webkitAudioContext;
      A.ctx = new Ctor();
      A._build();
    }
    if (A.ctx.state === 'suspended') A.ctx.resume().catch(function () {});
  } catch (e) {
    A.available = false;
    console.warn('[CR] Audio desactivado.', e);
  }
};
A._build = function () {
  var ctx = A.ctx;
  var comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -18; comp.knee.value = 20; comp.ratio.value = 8;
  comp.attack.value = 0.004; comp.release.value = 0.2;
  comp.connect(ctx.destination);
  A._master = ctx.createGain(); A._master.connect(comp);
  A._sfx = ctx.createGain(); A._sfx.connect(A._master);
  A._amb = ctx.createGain(); A._amb.connect(A._master);
  A._musBus = ctx.createGain(); A._musBus.connect(A._master);
  /* Eco suave para la música */
  var delay = ctx.createDelay(1.0); delay.delayTime.value = 0.38;
  var fb = ctx.createGain(); fb.gain.value = 0.32;
  var wet = ctx.createGain(); wet.gain.value = 0.22;
  A._musBus.connect(delay); delay.connect(fb); fb.connect(delay);
  delay.connect(wet); wet.connect(A._master);
  /* Búfer de ruido compartido */
  var len = Math.floor(ctx.sampleRate * 2);
  A._noiseBuf = ctx.createBuffer(1, len, ctx.sampleRate);
  var data = A._noiseBuf.getChannelData(0);
  var nr = CR.RNG(0xBEEF);
  for (var i = 0; i < len; i++) data[i] = nr.next() * 2 - 1;
  /* Viento continuo */
  var windSrc = ctx.createBufferSource(); windSrc.buffer = A._noiseBuf; windSrc.loop = true;
  var windFl = ctx.createBiquadFilter(); windFl.type = 'lowpass'; windFl.frequency.value = 300; windFl.Q.value = 0.6;
  A._windGain = ctx.createGain(); A._windGain.gain.value = 0;
  var lfo = ctx.createOscillator(); lfo.frequency.value = 0.07;
  var lfoG = ctx.createGain(); lfoG.gain.value = 130;
  lfo.connect(lfoG); lfoG.connect(windFl.frequency);
  windSrc.connect(windFl); windFl.connect(A._windGain); A._windGain.connect(A._amb);
  windSrc.start(); lfo.start();
  /* Lluvia continua */
  var rainSrc = ctx.createBufferSource(); rainSrc.buffer = A._noiseBuf; rainSrc.loop = true;
  var rainFl = ctx.createBiquadFilter(); rainFl.type = 'highpass'; rainFl.frequency.value = 1400; rainFl.Q.value = 0.4;
  A._rainGain = ctx.createGain(); A._rainGain.gain.value = 0;
  rainSrc.connect(rainFl); rainFl.connect(A._rainGain); A._rainGain.connect(A._amb);
  rainSrc.start();
  A._applySettings();
  A._ap.wind = -1; A._ap.rain = -1;
};
A._applySettings = function () {
  if (!A.ctx) return;
  try {
    var v = CR.Settings.values, t = A.ctx.currentTime;
    A._master.gain.setTargetAtTime(v.volume, t, 0.05);
    A._musBus.gain.setTargetAtTime(v.music ? 0.5 : 0, t, 0.2);
    A._amb.gain.setTargetAtTime(v.ambience ? 1 : 0, t, 0.2);
  } catch (e) {}
};
function buildLayer(ctx, dest, spec, when, volScale, rate) {
  var t = when + (spec.t || 0);
  var d = Math.max(0.02, spec.d || 0.1);
  var a = Math.min(spec.a || 0.004, d * 0.5);
  var v = Math.max(0.0002, (spec.v || 0.2) * volScale);
  var g = ctx.createGain();
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(v, t + a);
  g.gain.exponentialRampToValueAtTime(0.0001, t + d);
  g.connect(dest);
  var src = null, fl = null;
  if (spec.k === 'n') {
    src = ctx.createBufferSource(); src.buffer = A._noiseBuf; src.loop = true;
    fl = ctx.createBiquadFilter();
    fl.type = spec.ft || 'lowpass';
    fl.frequency.setValueAtTime(Math.max(20, (spec.ff || 800) * rate), t);
    if (spec.ff1) fl.frequency.exponentialRampToValueAtTime(Math.max(20, spec.ff1 * rate), t + d);
    fl.Q.value = spec.q || 0.8;
    src.connect(fl); fl.connect(g);
  } else {
    src = ctx.createOscillator();
    src.type = spec.w || 'sine';
    src.frequency.setValueAtTime(Math.max(20, (spec.f || 440) * rate), t);
    if (spec.f1) src.frequency.exponentialRampToValueAtTime(Math.max(20, spec.f1 * rate), t + d);
    src.connect(g);
  }
  src.start(t);
  src.stop(t + d + 0.06);
  A._voices++;
  src.onended = function () {
    A._voices = Math.max(0, A._voices - 1);
    try { src.disconnect(); g.disconnect(); if (fl) fl.disconnect(); } catch (e) {}
  };
  return src;
}
A.play = function (name, opts) {
  if (!A.available || !A.ctx || A.ctx.state !== 'running' || A._disposed) return;
  try {
    var def = S[name] || S.click;
    var now = U.now();
    var gap = GAP[name] || DEFAULT_GAP;
    if (now - (A._last[name] || -1e12) < gap) return;
    if (A._voices + def.length > MAX_VOICES) return;
    A._last[name] = now;
    var o = opts || {};
    var volScale = U.clamp(o.vol === undefined ? 1 : o.vol, 0, 2);
    var rate = U.clamp(o.rate === undefined ? 1 : o.rate, 0.25, 4);
    var t = A.ctx.currentTime + 0.005;
    var dest = A._sfx, panner = null;
    if (o.pan && typeof A.ctx.createStereoPanner === 'function') {
      panner = A.ctx.createStereoPanner();
      panner.pan.value = U.clamp(o.pan, -1, 1);
      panner.connect(A._sfx);
      dest = panner;
    }
    var lastSrc = null;
    for (var i = 0; i < def.length; i++) lastSrc = buildLayer(A.ctx, dest, def[i], t, volScale, rate);
    if (panner && lastSrc) {
      var prev = lastSrc.onended;
      lastSrc.onended = function () { if (prev) prev(); try { panner.disconnect(); } catch (e) {} };
    }
  } catch (e) {}
};
A.playAt = function (name, x, y, lx, ly) {
  var dx = x - lx, dy = y - ly;
  var d = U.len(dx, dy);
  if (d > 22) return;
  A.play(name, { vol: Math.pow(1 - d / 22, 1.5), pan: U.clamp(dx / 14, -1, 1) * 0.8 });
};
A.setEnvironment = function (env) {
  if (!env) return;
  A._env.night = U.clamp(Number(env.night) || 0, 0, 1);
  A._env.rain = U.clamp(Number(env.rain) || 0, 0, 1);
  A._env.wind = U.clamp(env.wind === undefined ? 0.3 : Number(env.wind) || 0, 0, 1);
  A._env.indoors = !!env.indoors;
};
var SCALE_DAY = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25];
var SCALE_NIGHT = [220.0, 261.63, 293.66, 329.63, 392.0, 440.0];
A.update = function (dt) {
  if (!A.available || !A.ctx || A.ctx.state !== 'running' || A._disposed) return;
  try {
    dt = U.clamp(dt, 0, 0.1);
    var env = A._env, ap = A._ap, t = A.ctx.currentTime;
    var inF = env.indoors ? 0.25 : 1;
    var windT = env.wind * 0.13 * inF;
    var rainT = env.rain * 0.2 * (env.indoors ? 0.15 : 1);
    if (Math.abs(windT - ap.wind) > 0.01) { A._windGain.gain.setTargetAtTime(windT, t, 0.8); ap.wind = windT; }
    if (Math.abs(rainT - ap.rain) > 0.01) { A._rainGain.gain.setTargetAtTime(rainT, t, 0.8); ap.rain = rainT; }
    var r = A._rng;
    var ambVol = CR.Settings.values.ambience ? inF : 0;
    if (env.night < 0.4 && env.rain < 0.5 && ambVol > 0) {
      A._birdT -= dt;
      if (A._birdT <= 0 && A._voices < MAX_VOICES - 6) {
        A._birdT = r.range(2.2, 6.5);
        var n = r.int(2, 4), base = r.range(1900, 3100);
        for (var i = 0; i < n; i++) buildLayer(A.ctx, A._amb, { k: 'o', w: 'sine', f: base * r.range(0.95, 1.1), f1: base * r.range(1.1, 1.35), d: 0.07, v: 0.045, t: i * 0.1 }, t, ambVol, 1);
      }
    }
    if (env.night > 0.55 && env.rain < 0.5 && ambVol > 0) {
      A._cricketT -= dt;
      if (A._cricketT <= 0 && A._voices < MAX_VOICES - 6) {
        A._cricketT = r.range(0.5, 1.6);
        for (var j = 0; j < 3; j++) buildLayer(A.ctx, A._amb, { k: 'o', w: 'sine', f: 4300, d: 0.035, v: 0.028, t: j * 0.075 }, t, ambVol, 1);
      }
    }
    if (CR.Settings.values.music) {
      A._musicT -= dt;
      if (A._musicT <= 0 && A._voices < MAX_VOICES - 8) {
        A._musicT = r.range(2.2, 4.6);
        var scale = env.night > 0.5 ? SCALE_NIGHT : SCALE_DAY;
        var idx = r.int(0, scale.length - 1);
        var dur = r.range(1.6, 2.8);
        buildLayer(A.ctx, A._musBus, { k: 'o', w: 'triangle', f: scale[idx], d: dur, v: 0.075, a: 0.12 }, t, 1, 1);
        if (r.chance(0.35)) {
          var i2 = Math.min(scale.length - 1, idx + 2);
          buildLayer(A.ctx, A._musBus, { k: 'o', w: 'triangle', f: scale[i2], d: dur * 0.9, v: 0.05, a: 0.15, t: 0.18 }, t, 1, 1);
        }
        if (r.chance(0.2)) buildLayer(A.ctx, A._musBus, { k: 'o', w: 'sine', f: scale[idx] / 2, d: dur * 1.2, v: 0.05, a: 0.2 }, t, 1, 1);
      }
    }
  } catch (e) {}
};
A.suspend = function () { if (A.ctx && A.ctx.state === 'running') { try { A.ctx.suspend().catch(function () {}); } catch (e) {} } };
A.resume = function () {
  if (A.ctx && A.ctx.state === 'suspended') { try { A.ctx.resume().catch(function () {}); } catch (e) {} }
  A._ap.wind = -1; A._ap.rain = -1;
};
A.dispose = function () {
  A._disposed = true;
  CR.Bindings.removeOwner('audio');
  if (A.ctx) { try { A.ctx.close().catch(function () {}); } catch (e) {} }
  A.ctx = null; A._master = null; A._sfx = null; A._amb = null; A._musBus = null;
  A._windGain = null; A._rainGain = null; A._noiseBuf = null; A._voices = 0;
};
console.info('[CR] audio.js v3 · ' + Object.keys(S).length + ' SFX procedurales');
})();