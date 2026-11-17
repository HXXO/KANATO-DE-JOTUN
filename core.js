/* ============================================================
KANATO DE JOTUN · core.js — Motor v3
Mundo 512×512, input analógico con canales independientes,
ajustes de controles editables, utilidades de movimiento suave,
EventBus, pools, bindings y bucle de timestep fijo optimizado.
Sin dependencias. Compatible con file://.
============================================================ */
(function () {
'use strict';
if (window.CR) { console.error('[CR] core.js duplicado'); return; }
var CR = {};
window.CR = CR;
CR.version = '3.0.0';
CR.SAVE_SCHEMA = 3;

CR.CONFIG = Object.freeze({
  WORLD: 512,
  CHUNK: 16,
  TILE_W: 64,
  TILE_H: 32,
  TICK: 1000 / 60,
  MAX_FRAME: 200,
  MAX_STEPS: 5,
  DAY_REAL_MS: 10 * 60000,
  DAYS_PER_MONTH: 10,
  HASH_CELL: 8,
  DPR_MAX: 2,
  INPUT_BUFFER_MS: 190,
  JOY_DEAD: 0.12,
  JOY_CURVE: 1.55,
  PIVOT_MAG: 0.34,
  SAVE_KEY: 'jotun-save-v3',
  SAVE_BACKUP: 'jotun-backup-v3',
  SETTINGS_KEY: 'jotun-settings-v3'
});

/* ---------------- util ---------------- */
var _uid = 0;
var PI = Math.PI, TAU = PI * 2;
var U = CR.util = {
  TAU: TAU,
  clamp: function (v, a, b) { return v < a ? a : (v > b ? b : v); },
  lerp: function (a, b, t) { return a + (b - a) * t; },
  /* Interpolación exponencial independiente del framerate */
  damp: function (cur, target, lambda, dt) { return target + (cur - target) * Math.exp(-lambda * dt); },
  /* Ángulo por el arco más corto */
  angDelta: function (a, b) { var d = (b - a) % TAU; if (d > PI) d -= TAU; if (d < -PI) d += TAU; return d; },
  angLerp: function (a, b, t) { return a + U.angDelta(a, b) * t; },
  angDamp: function (a, b, lambda, dt) { return a + U.angDelta(a, b) * (1 - Math.exp(-lambda * dt)); },
  dist2: function (ax, ay, bx, by) { var dx = bx - ax, dy = by - ay; return dx * dx + dy * dy; },
  len: function (x, y) { return Math.sqrt(x * x + y * y); },
  uid: function () { return ++_uid; },
  now: function () { return (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now(); },
  easeOutCubic: function (t) { t = U.clamp(t, 0, 1) - 1; return t * t * t + 1; },
  easeOutExpo: function (t) { t = U.clamp(t, 0, 1); return t >= 1 ? 1 : 1 - Math.pow(2, -10 * t); },
  easeInOutQuad: function (t) { t = U.clamp(t, 0, 1); return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; },
  /* Curva de respuesta del joystick: fina en el centro, plena en el borde */
  joyCurve: function (m) {
    var d = CR.CONFIG.JOY_DEAD;
    if (m <= d) return 0;
    var t = (Math.min(1, m) - d) / (1 - d);
    return Math.pow(t, CR.CONFIG.JOY_CURVE);
  },
  dir8: function (dx, dy) {
    if (dx === 0 && dy === 0) return 0;
    var a = Math.atan2(dy, dx);
    return ((Math.round(a / (PI / 4)) % 8) + 8) % 8;
  },
  hashStr: function (str) {
    str = String(str);
    var h = 1779033703 ^ str.length;
    for (var i = 0; i < str.length; i++) {
      h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
      h = (h << 13) | (h >>> 19);
    }
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return h >>> 0;
  },
  fmt: function (n) {
    n = Math.round(Number(n) || 0);
    try { return n.toLocaleString('es-ES'); } catch (e) { return String(n); }
  },
  isTyping: function (e) {
    var t = e.target;
    if (!t) return false;
    var tag = t.tagName;
    return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || t.isContentEditable === true;
  }
};

/* ---------------- capacidades ---------------- */
CR.caps = { storage: false, audio: false, worker: false, pointer: false, touch: false };
try {
  var k = 'cr_probe';
  window.localStorage.setItem(k, '1');
  window.localStorage.removeItem(k);
  CR.caps.storage = true;
} catch (e) { CR.caps.storage = false; }
CR.caps.audio = !!(window.AudioContext || window.webkitAudioContext);
CR.caps.worker = (typeof Worker === 'function' && typeof Blob === 'function' &&
  typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function');
CR.caps.pointer = (typeof window.PointerEvent !== 'undefined');
CR.caps.touch = (window.matchMedia && window.matchMedia('(pointer:coarse)').matches) || ('ontouchstart' in window);

/* ---------------- EventBus ---------------- */
var _handlers = new Map();
CR.Bus = {
  on: function (evt, fn, owner) {
    if (typeof fn !== 'function') return function () {};
    var arr = _handlers.get(evt);
    if (!arr) { arr = []; _handlers.set(evt, arr); }
    var h = { fn: fn, owner: owner || null, dead: false };
    arr.push(h);
    return function () { h.dead = true; };
  },
  once: function (evt, fn, owner) {
    var off = CR.Bus.on(evt, function (a, b, c) { off(); fn(a, b, c); }, owner);
    return off;
  },
  off: function (evt, fn) {
    var arr = _handlers.get(evt);
    if (!arr) return;
    for (var i = 0; i < arr.length; i++) if (arr[i].fn === fn) arr[i].dead = true;
  },
  offOwner: function (owner) {
    _handlers.forEach(function (arr) {
      for (var i = 0; i < arr.length; i++) if (arr[i].owner === owner) arr[i].dead = true;
    });
  },
  emit: function (evt, a, b, c) {
    var arr = _handlers.get(evt);
    if (!arr || arr.length === 0) return;
    var dirty = false;
    for (var i = 0; i < arr.length; i++) {
      var h = arr[i];
      if (h.dead) { dirty = true; continue; }
      try { h.fn(a, b, c); }
      catch (e) { CR.reportError(e, 'Bus:' + evt); }
    }
    if (dirty) {
      var live = [];
      for (var j = 0; j < arr.length; j++) if (!arr[j].dead) live.push(arr[j]);
      if (live.length) _handlers.set(evt, live); else _handlers.delete(evt);
    }
  }
};
CR.reportError = function (err, ctx) {
  var msg = (err && err.stack) ? String(err.stack) : String(err);
  console.error('[CR:' + (ctx || '?') + ']', err);
  CR.Bus.emit('fatal', { message: msg, context: ctx || 'desconocido' });
};
CR.assert = function (cond, msg) { if (!cond) CR.reportError(new Error('Aserción: ' + msg), 'assert'); };

/* ---------------- RNG determinista ---------------- */
CR.RNG = function (seed) {
  var a = seed >>> 0;
  var r = {
    seed: a,
    next: function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    },
    range: function (min, max) { return min + r.next() * (max - min); },
    int: function (min, max) { return Math.floor(r.next() * (max - min + 1)) + min; },
    pick: function (arr) { return arr[Math.floor(r.next() * arr.length)]; },
    chance: function (p) { return r.next() < p; },
    fork: function (tag) { return CR.RNG((a ^ U.hashStr(tag)) >>> 0); }
  };
  return r;
};
CR.seed = 0;
CR.streams = null;
CR.initStreams = function (seed) {
  CR.seed = seed >>> 0;
  var root = CR.RNG(CR.seed);
  CR.streams = {
    world: root.fork('world'), loot: root.fork('loot'),
    ai: root.fork('ai'), fx: root.fork('fx'), spawn: root.fork('spawn')
  };
};
CR.initStreams(1);

/* ---------------- Pool ---------------- */
function Pool(factory, reset, prealloc, max) {
  this._factory = factory; this._reset = reset || null;
  this._free = []; this._max = Math.max(1, max | 0);
  this.created = 0; this.active = 0;
  var n = Math.min(prealloc | 0, this._max);
  for (var i = 0; i < n; i++) { var o = this._factory(); o._pooled = true; this._free.push(o); this.created++; }
}
Pool.prototype.acquire = function () {
  var o = this._free.pop();
  if (!o) { if (this.created >= this._max) return null; o = this._factory(); this.created++; }
  o._pooled = false; this.active++;
  return o;
};
Pool.prototype.release = function (o) {
  if (!o || o._pooled === true) return;
  o._pooled = true;
  if (this._reset) this._reset(o);
  this._free.push(o);
  this.active = Math.max(0, this.active - 1);
};
CR.Pool = Pool;

/* ---------------- Bindings ---------------- */
var _records = [];
CR.Bindings = {
  add: function (target, type, fn, opts, owner) {
    if (!target || typeof target.addEventListener !== 'function' || typeof fn !== 'function') return fn;
    var o = (opts === undefined) ? false : opts;
    target.addEventListener(type, fn, o);
    _records.push({ target: target, type: type, fn: fn, opts: o, owner: owner || 'global' });
    return fn;
  },
  removeOwner: function (owner) {
    for (var i = _records.length - 1; i >= 0; i--) {
      var r = _records[i];
      if (r.owner === owner) {
        try { r.target.removeEventListener(r.type, r.fn, r.opts); } catch (e) {}
        _records.splice(i, 1);
      }
    }
    CR.Bus.offOwner(owner);
  },
  removeAll: function () {
    for (var i = _records.length - 1; i >= 0; i--) {
      var r = _records[i];
      try { r.target.removeEventListener(r.type, r.fn, r.opts); } catch (e) {}
    }
    _records.length = 0;
  },
  count: function () { return _records.length; }
};

/* ---------------- Loop ---------------- */
CR.Loop = {
  running: false, simEnabled: false,
  stats: { fps: 0, simMs: 0, renderMs: 0, steps: 0 },
  _update: null, _render: null, _raf: 0, _last: 0, _acc: 0,
  _frames: 0, _fpsT: 0, _simAcc: 0, _renAcc: 0,
  start: function (update, render) {
    if (this.running) return;
    if (typeof update !== 'function' || typeof render !== 'function') {
      CR.reportError(new Error('Loop.start requiere update y render'), 'loop'); return;
    }
    this._update = update; this._render = render;
    this.running = true; this._last = U.now(); this._acc = 0;
    var self = this, C = CR.CONFIG;
    function frame(t) {
      if (!self.running) return;
      self._raf = requestAnimationFrame(frame);
      var dt = t - self._last; self._last = t;
      if (!(dt >= 0)) dt = 0;
      if (dt > C.MAX_FRAME) dt = C.MAX_FRAME;
      var s0 = U.now(), steps = 0;
      if (self.simEnabled) {
        self._acc += dt;
        while (self._acc >= C.TICK && steps < C.MAX_STEPS) {
          try { self._update(C.TICK / 1000); }
          catch (e) { self.simEnabled = false; CR.reportError(e, 'update'); break; }
          self._acc -= C.TICK; steps++;
        }
        if (steps >= C.MAX_STEPS) self._acc = 0;
      } else self._acc = 0;
      var s1 = U.now();
      var alpha = self.simEnabled ? (self._acc / C.TICK) : 1;
      try { self._render(alpha, dt); }
      catch (e) { self.simEnabled = false; CR.reportError(e, 'render'); }
      var s2 = U.now();
      self._frames++; self._simAcc += (s1 - s0); self._renAcc += (s2 - s1); self._fpsT += dt;
      if (self._fpsT >= 500) {
        self.stats.fps = Math.round(self._frames * 1000 / self._fpsT);
        self.stats.simMs = +(self._simAcc / self._frames).toFixed(2);
        self.stats.renderMs = +(self._renAcc / self._frames).toFixed(2);
        self.stats.steps = steps;
        self._frames = 0; self._simAcc = 0; self._renAcc = 0; self._fpsT = 0;
      }
    }
    this._raf = requestAnimationFrame(frame);
  },
  stop: function () { this.running = false; cancelAnimationFrame(this._raf); },
  resetClock: function () { this._last = U.now(); this._acc = 0; }
};

/* ---------------- Input analógico con canales ---------------- */
var MOVE_KEYS = { KeyW: 1, KeyA: 1, KeyS: 1, KeyD: 1, ArrowUp: 1, ArrowLeft: 1, ArrowDown: 1, ArrowRight: 1 };
var PRESS_KEYS = {
  Space: 'attack', KeyJ: 'attack',
  KeyE: 'interact', KeyK: 'interact',
  KeyQ: 'roll',
  KeyF: 'mount',
  KeyL: 'block',
  Tab: 'cycle',
  KeyX: 'ammo'
};
var ACTS = ['attack', 'block', 'interact', 'roll', 'mount', 'cycle', 'ammo', 'sprint'];
var BUF_INIT = -1e12;

var I = CR.Input = {
  enabled: true,
  keys: Object.create(null),
  joy: { x: 0, y: 0, mag: 0, active: false },
  pointer: { x: 0, y: 0, has: false, mouse: false, lastMove: BUF_INIT },
  _held: Object.create(null),
  _buf: Object.create(null),
  _move: { x: 0, y: 0, mag: 0 },
  _canvas: null,
  _tapId: null, _tapX: 0, _tapY: 0, _tapT: 0,
  _blockPointer: null,
  /* Apuntado de arco/ballesta por arrastre del botón de ataque (ángulo en el MUNDO) */
  bowAim: { active: false, ang: 0, mag: 0 },

  init: function (canvas) {
    if (!canvas) { CR.reportError(new Error('Input.init sin canvas'), 'input'); return; }
    this._canvas = canvas;
    for (var i = 0; i < ACTS.length; i++) { this._held[ACTS[i]] = false; this._buf[ACTS[i]] = BUF_INIT; }
    var B = CR.Bindings;
    B.add(window, 'keydown', onKeyDown, false, 'input');
    B.add(window, 'keyup', onKeyUp, false, 'input');
    B.add(window, 'blur', function () { I.clearAll(); CR.Bus.emit('input:blur'); }, false, 'input');
    B.add(canvas, 'pointerdown', onCanvasDown, false, 'input');
    B.add(canvas, 'pointermove', onCanvasMove, { passive: true }, 'input');
    B.add(window, 'pointerup', onPointerUp, false, 'input');
    B.add(window, 'pointercancel', onPointerCancel, false, 'input');
    B.add(canvas, 'contextmenu', function (e) { e.preventDefault(); }, false, 'input');
  },
  /* Joystick analógico: se guarda el vector crudo y su magnitud */
  setJoy: function (x, y) {
    var l = U.len(x, y);
    if (l > 1) { x /= l; y /= l; l = 1; }
    this.joy.x = x; this.joy.y = y; this.joy.mag = l; this.joy.active = true;
  },
  clearJoy: function () { this.joy.x = 0; this.joy.y = 0; this.joy.mag = 0; this.joy.active = false; },
  setBowAim: function (ang, mag) { var b = this.bowAim; b.active = true; b.ang = ang; b.mag = mag; },
  clearBowAim: function () { var b = this.bowAim; b.active = false; b.mag = 0; },
  press: function (a) {
    if (!this.enabled || !(a in this._buf)) return;
    this._buf[a] = U.now();
    CR.Bus.emit('input:press', a);
  },
  setHeld: function (a, v) { if (a in this._held) this._held[a] = !!v && this.enabled; },
  isHeld: function (a) { return this._held[a] === true; },
  consume: function (a) {
    var t = this._buf[a];
    if (t !== undefined && t !== BUF_INIT && (U.now() - t) <= CR.CONFIG.INPUT_BUFFER_MS) {
      this._buf[a] = BUF_INIT; return true;
    }
    return false;
  },
  peek: function (a) {
    var t = this._buf[a];
    return t !== undefined && t !== BUF_INIT && (U.now() - t) <= CR.CONFIG.INPUT_BUFFER_MS;
  },
  /* Vector de movimiento con magnitud analógica (0..1) */
  getMove: function () {
    var m = this._move;
    m.x = 0; m.y = 0; m.mag = 0;
    if (!this.enabled) return m;
    var k = this.keys, x = 0, y = 0;
    if (k.KeyA || k.ArrowLeft) x -= 1;
    if (k.KeyD || k.ArrowRight) x += 1;
    if (k.KeyW || k.ArrowUp) y -= 1;
    if (k.KeyS || k.ArrowDown) y += 1;
    if (x !== 0 || y !== 0) {
      var kl = U.len(x, y);
      m.x = x / kl; m.y = y / kl; m.mag = 1;
      return m;
    }
    if (this.joy.active && this.joy.mag > CR.CONFIG.JOY_DEAD) {
      var jx = this.joy.x, jy = this.joy.y, l = this.joy.mag;
      var s = U.joyCurve(l);
      m.x = (jx / l) * s; m.y = (jy / l) * s; m.mag = s;
    }
    return m;
  },
  /* Dirección cruda del stick, aunque la magnitud sea mínima (giro en el sitio) */
  getFace: function () {
    if (this.joy.active && this.joy.mag > 0.06) return Math.atan2(this.joy.y, this.joy.x);
    var m = this.getMove();
    if (m.mag > 0) return Math.atan2(m.y, m.x);
    return null;
  },
  aimFresh: function () {
    return this.pointer.mouse && this.pointer.has && (U.now() - this.pointer.lastMove) < 2000;
  },
  clearAll: function () {
    this.keys = Object.create(null);
    for (var i = 0; i < ACTS.length; i++) { this._held[ACTS[i]] = false; this._buf[ACTS[i]] = BUF_INIT; }
    this.clearJoy(); this.clearBowAim();
    this._tapId = null; this._blockPointer = null;
  }
};
CR.Input.ACTS = ACTS;

function onKeyDown(e) {
  if (U.isTyping(e)) return;
  var c = e.code;
  CR.Bus.emit('input:key', c, true, e.repeat === true);
  if (!I.enabled) return;
  if (c === 'Tab') e.preventDefault();
  if (MOVE_KEYS[c]) {
    I.keys[c] = true;
    if (c.indexOf('Arrow') === 0) e.preventDefault();
    return;
  }
  if (c === 'ShiftLeft' || c === 'ShiftRight') { I.setHeld('sprint', true); return; }
  var a = PRESS_KEYS[c];
  if (a) {
    if (!e.repeat) I.press(a);
    I.setHeld(a, true);
    if (c === 'Space') e.preventDefault();
  }
}
function onKeyUp(e) {
  var c = e.code;
  CR.Bus.emit('input:key', c, false, false);
  if (MOVE_KEYS[c]) { I.keys[c] = false; return; }
  if (c === 'ShiftLeft' || c === 'ShiftRight') { I._held.sprint = false; return; }
  var a = PRESS_KEYS[c];
  if (a) I._held[a] = false;
}
function onCanvasDown(e) {
  if (!I.enabled) return;
  I.pointer.x = e.clientX; I.pointer.y = e.clientY; I.pointer.has = true;
  if (e.pointerType === 'mouse') {
    I.pointer.mouse = true; I.pointer.lastMove = U.now();
    if (e.button === 0) { I.setHeld('attack', true); I.press('attack'); }
    else if (e.button === 2) { I.setHeld('block', true); I.press('block'); I._blockPointer = e.pointerId; }
    else if (e.button === 1) { I.press('cycle'); e.preventDefault(); }
  } else if (I._tapId === null) {
    I._tapId = e.pointerId; I._tapX = e.clientX; I._tapY = e.clientY; I._tapT = U.now();
  }
}
function onCanvasMove(e) {
  if (e.pointerType === 'mouse') {
    I.pointer.x = e.clientX; I.pointer.y = e.clientY;
    I.pointer.has = true; I.pointer.mouse = true; I.pointer.lastMove = U.now();
  } else if (e.pointerId === I._tapId) {
    if (U.dist2(e.clientX, e.clientY, I._tapX, I._tapY) > 225) I._tapId = null;
  }
}
function onPointerUp(e) {
  if (e.pointerType === 'mouse') {
    if (e.button === 0) I.setHeld('attack', false);
    if (e.button === 2 || e.pointerId === I._blockPointer) { I.setHeld('block', false); I._blockPointer = null; }
  } else if (e.pointerId === I._tapId) {
    if ((U.now() - I._tapT) < 300 && I.enabled) {
      I.pointer.x = e.clientX; I.pointer.y = e.clientY;
      I.pointer.has = true; I.pointer.mouse = false;
      I.press('interact');
    }
    I._tapId = null;
  }
}
function onPointerCancel(e) {
  if (e.pointerId === I._tapId) I._tapId = null;
  if (e.pointerId === I._blockPointer) { I.setHeld('block', false); I._blockPointer = null; }
  if (e.pointerType === 'mouse') I.setHeld('attack', false);
}

/* ---------------- Ajustes + layout de controles ---------------- */
var CTL_DEFAULT = {
  scale: 1.18,
  opacity: 0.94,
  swap: false,
  /* Posiciones en % del viewport (anclas de centro del grupo) */
  joy: { x: 14, y: 74 },
  acts: { x: 86, y: 74 },
  quick: { x: 50, y: 90 },
  menu: { x: 50, y: 7 },
  plate: { x: 12, y: 9 },
  map: { x: 90, y: 12 },
  labels: true
};
var SET_DEFAULTS = {
  volume: 0.8, music: true, ambience: true, shake: true, fps: false,
  aimAssist: 1, autoBlock: false, showZones: false, ctl: CTL_DEFAULT
};
function cloneCtl(c) {
  return {
    scale: c.scale, opacity: c.opacity, swap: c.swap, labels: c.labels,
    joy: { x: c.joy.x, y: c.joy.y }, acts: { x: c.acts.x, y: c.acts.y },
    quick: { x: c.quick.x, y: c.quick.y }, menu: { x: c.menu.x, y: c.menu.y },
    plate: { x: c.plate.x, y: c.plate.y }, map: { x: c.map.x, y: c.map.y }
  };
}
CR.Settings = {
  values: {
    volume: 0.8, music: true, ambience: true, shake: true, fps: false,
    aimAssist: 1, autoBlock: false, showZones: false, ctl: cloneCtl(CTL_DEFAULT)
  },
  load: function () {
    if (!CR.caps.storage) return;
    try {
      var raw = window.localStorage.getItem(CR.CONFIG.SETTINGS_KEY);
      if (!raw) return;
      var obj = JSON.parse(raw);
      if (!obj || typeof obj !== 'object') return;
      for (var k in SET_DEFAULTS) {
        if (k === 'ctl') continue;
        if (typeof obj[k] === typeof SET_DEFAULTS[k]) this.values[k] = obj[k];
      }
      this.values.volume = U.clamp(Number(this.values.volume) || 0, 0, 1);
      this.values.aimAssist = U.clamp(Number(this.values.aimAssist) || 0, 0, 2);
      if (obj.ctl && typeof obj.ctl === 'object') {
        var c = this.values.ctl;
        if (typeof obj.ctl.scale === 'number') c.scale = U.clamp(obj.ctl.scale, 0.8, 2.0);
        if (typeof obj.ctl.opacity === 'number') c.opacity = U.clamp(obj.ctl.opacity, 0.35, 1);
        if (typeof obj.ctl.swap === 'boolean') c.swap = obj.ctl.swap;
        if (typeof obj.ctl.labels === 'boolean') c.labels = obj.ctl.labels;
        ['joy', 'acts', 'quick', 'menu', 'plate', 'map'].forEach(function (g) {
          if (obj.ctl[g] && typeof obj.ctl[g] === 'object') {
            if (typeof obj.ctl[g].x === 'number') c[g].x = U.clamp(obj.ctl[g].x, 3, 97);
            if (typeof obj.ctl[g].y === 'number') c[g].y = U.clamp(obj.ctl[g].y, 3, 97);
          }
        });
      }
    } catch (e) { console.warn('[CR] Ajustes corruptos; defaults.', e); }
  },
  set: function (k, v) {
    if (!(k in SET_DEFAULTS) || k === 'ctl') return;
    if (typeof v !== typeof SET_DEFAULTS[k]) return;
    if (k === 'volume') v = U.clamp(v, 0, 1);
    if (k === 'aimAssist') v = U.clamp(v, 0, 2);
    this.values[k] = v;
    this._persist();
    CR.Bus.emit('settings', k, v);
  },
  setCtl: function (patch) {
    var c = this.values.ctl;
    if (!patch) return;
    if (typeof patch.scale === 'number') c.scale = U.clamp(patch.scale, 0.8, 2.0);
    if (typeof patch.opacity === 'number') c.opacity = U.clamp(patch.opacity, 0.35, 1);
    if (typeof patch.swap === 'boolean') c.swap = patch.swap;
    if (typeof patch.labels === 'boolean') c.labels = patch.labels;
    ['joy', 'acts', 'quick', 'menu', 'plate', 'map'].forEach(function (g) {
      if (patch[g]) {
        if (typeof patch[g].x === 'number') c[g].x = U.clamp(patch[g].x, 3, 97);
        if (typeof patch[g].y === 'number') c[g].y = U.clamp(patch[g].y, 3, 97);
      }
    });
    this._persist();
    CR.Bus.emit('settings', 'ctl', c);
  },
  resetCtl: function () {
    this.values.ctl = cloneCtl(CTL_DEFAULT);
    this._persist();
    CR.Bus.emit('settings', 'ctl', this.values.ctl);
  },
  _persist: function () {
    if (!CR.caps.storage) return;
    try { window.localStorage.setItem(CR.CONFIG.SETTINGS_KEY, JSON.stringify(this.values)); }
    catch (e) {}
  }
};
CR.CTL_DEFAULT = CTL_DEFAULT;

console.info('[CR] core.js v' + CR.version + ' · mundo ' + CR.CONFIG.WORLD + '² · input analógico · caps:', CR.caps);
})();