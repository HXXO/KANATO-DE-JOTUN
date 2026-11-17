/* ============================================================
KANATO DE JOTUN · art.js — Núcleo de arte procedural (v2)
· Helpers de forma/color con caché.
· Art.drawBody  → criaturas (registro en art-creatures.js).
· Art.drawPerson→ jugador/NPC/guardia/trabajador/bandido/esqueleto
                  (registro en art-people.js, equipo visible).
· Art.icon/url/html → iconos procedurales SIN emojis:
    'sword_iron'   ítem (art-items.js)
    'sp:wolf'      criatura en miniatura
    'npc:dorn'     busto de persona
    'bld:forge'    edificio
    'node:tree'    nodo de recurso
    'ui:coin'      glifo de interfaz
    'crop:wheat'   atajo a crop_wheat
· Art.strip → elimina cualquier emoji de textos heredados.
Depende solo de core.js + data.js. Se carga antes de render/ui.
============================================================ */
(function () {
'use strict';
const CR = window.CR;
if (!CR || !CR.DATA) { console.error('[CR] art.js requiere core.js y data.js'); return; }
const U = CR.util, D = CR.DATA, TAU = U.TAU;

const Art = CR.Art = {
  creatures: Object.create(null),
  people: Object.create(null),
  icons: Object.create(null),
  glyphs: Object.create(null),
  buildings: Object.create(null),
  nodes: Object.create(null),
  _icon: new Map(), _url: new Map(),
  version: 2, ready: true
};

/* ---------------- Color ---------------- */
const _rgb = Object.create(null);
function rgb(hex) {
  let v = _rgb[hex];
  if (v) return v;
  let h = String(hex || '#888888').replace('#', '');
  if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
  const n = parseInt(h, 16) || 0;
  v = { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
  _rgb[hex] = v; return v;
}
function shade(hex, a) {
  const c = rgb(hex);
  const f = function (x) { return U.clamp(Math.round(a >= 0 ? x + (255 - x) * a : x * (1 + a)), 0, 255); };
  return 'rgb(' + f(c.r) + ',' + f(c.g) + ',' + f(c.b) + ')';
}
function rgba(hex, a) { const c = rgb(hex); return 'rgba(' + c.r + ',' + c.g + ',' + c.b + ',' + a + ')'; }
function mix(h1, h2, t) {
  const a = rgb(h1), b = rgb(h2);
  return 'rgb(' + Math.round(U.lerp(a.r, b.r, t)) + ',' + Math.round(U.lerp(a.g, b.g, t)) + ',' + Math.round(U.lerp(a.b, b.b, t)) + ')';
}

/* ---------------- Formas (espacio local: origen = suelo, +x = frente) ---------------- */
function ell(g, x, y, rx, ry, fill, stroke, lw) {
  g.beginPath(); g.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), 0, 0, TAU);
  if (fill) { g.fillStyle = fill; g.fill(); }
  if (stroke) { g.strokeStyle = stroke; g.lineWidth = lw || 0.8; g.stroke(); }
}
function path(g, pts, fill, stroke, lw) {
  if (!pts.length) return;
  g.beginPath(); g.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]);
  g.closePath();
  if (fill) { g.fillStyle = fill; g.fill(); }
  if (stroke) { g.strokeStyle = stroke; g.lineWidth = lw || 0.8; g.lineJoin = 'round'; g.stroke(); }
}
function blob(g, x, y, rx, ry, col, hi, stroke) {
  ell(g, x, y, rx, ry, col, stroke || shade(col, -0.42), 0.9);
  if (hi !== null) {
    g.save(); g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, TAU); g.clip();
    ell(g, x - rx * 0.24, y - ry * 0.40, rx * 0.74, ry * 0.52, hi || shade(col, 0.20));
    ell(g, x + rx * 0.30, y + ry * 0.52, rx * 0.70, ry * 0.42, shade(col, -0.20));
    g.restore();
  }
}
function leg(g, x, y, len, w, sw, col, foot) {
  const x2 = x + sw;
  path(g, [[x - w / 2, y], [x + w / 2, y], [x2 + w * 0.40, y + len], [x2 - w * 0.40, y + len]], col, shade(col, -0.35), 0.6);
  if (foot) ell(g, x2, y + len, w * 0.62, w * 0.42, foot);
}
function stroke(g, pts, col, w) {
  g.strokeStyle = col; g.lineWidth = w; g.lineCap = 'round'; g.lineJoin = 'round';
  g.beginPath(); g.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]);
  g.stroke();
}
function curve(g, x0, y0, cx, cy, x1, y1, col, w) {
  g.strokeStyle = col; g.lineWidth = w; g.lineCap = 'round';
  g.beginPath(); g.moveTo(x0, y0); g.quadraticCurveTo(cx, cy, x1, y1); g.stroke();
}
function fur(g, x0, y0, x1, y1, n, h, col, seed) {
  const pts = [[x0, y0]];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const x = U.lerp(x0, x1, t), y = U.lerp(y0, y1, t);
    const j = ((Math.sin((i + (seed || 0)) * 12.9898) * 43758.5453) % 1 + 1) % 1;
    pts.push([x, y - h * (0.55 + j * 0.6)]);
    pts.push([x + (x1 - x0) / n * 0.5, y]);
  }
  pts.push([x1, y1]);
  path(g, pts, col);
}
function eye(g, x, y, r, col, glow) {
  if (glow) { g.save(); g.globalAlpha = 0.5; ell(g, x, y, r * 2.4, r * 2.4, glow); g.restore(); }
  ell(g, x, y, r, r, col);
  ell(g, x - r * 0.3, y - r * 0.3, r * 0.34, r * 0.34, 'rgba(255,255,255,0.85)');
}
function horn(g, x, y, len, ang, w, col, bend) {
  const mx = x + Math.cos(ang) * len * 0.55 + (bend || 0);
  const my = y + Math.sin(ang) * len * 0.55;
  const ex = x + Math.cos(ang) * len + (bend || 0) * 1.6;
  const ey = y + Math.sin(ang) * len;
  g.strokeStyle = col; g.lineCap = 'round';
  g.lineWidth = w; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(mx, my, ex, ey); g.stroke();
  g.lineWidth = w * 0.4; g.strokeStyle = shade(col, 0.3);
  g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(mx, my, ex, ey); g.stroke();
}
function spots(g, x, y, rx, ry, n, col, seed, r) {
  g.save(); g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, TAU); g.clip();
  for (let i = 0; i < n; i++) {
    const a = ((Math.sin((i + seed) * 78.233) * 43758.5453) % 1 + 1) % 1;
    const b = ((Math.sin((i + seed) * 12.9898) * 24634.6345) % 1 + 1) % 1;
    ell(g, x - rx + a * rx * 2, y - ry + b * ry * 2, r * (0.6 + a * 0.7), r * (0.5 + b * 0.6), col);
  }
  g.restore();
}
function rr(g, x, y, w, h, r, fill, strokeC, lw) {
  r = Math.min(r, w / 2, h / 2);
  g.beginPath();
  g.moveTo(x + r, y); g.lineTo(x + w - r, y); g.arcTo(x + w, y, x + w, y + r, r);
  g.lineTo(x + w, y + h - r); g.arcTo(x + w, y + h, x + w - r, y + h, r);
  g.lineTo(x + r, y + h); g.arcTo(x, y + h, x, y + h - r, r);
  g.lineTo(x, y + r); g.arcTo(x, y, x + r, y, r); g.closePath();
  if (fill) { g.fillStyle = fill; g.fill(); }
  if (strokeC) { g.strokeStyle = strokeC; g.lineWidth = lw || 0.8; g.stroke(); }
}
function lgrad(g, x0, y0, x1, y1, stops) {
  const gr = g.createLinearGradient(x0, y0, x1, y1);
  for (let i = 0; i < stops.length; i++) gr.addColorStop(stops[i][0], stops[i][1]);
  return gr;
}
function glow(g, x, y, r, col, a) {
  g.save(); g.globalAlpha = a === undefined ? 0.35 : a;
  const gr = g.createRadialGradient(x, y, 0, x, y, r);
  gr.addColorStop(0, rgba(col, 0.9)); gr.addColorStop(1, rgba(col, 0));
  g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); g.restore();
}

Art.util = {
  rgb: rgb, shade: shade, rgba: rgba, mix: mix,
  ell: ell, path: path, blob: blob, leg: leg, stroke: stroke, curve: curve,
  fur: fur, eye: eye, horn: horn, spots: spots, rr: rr, lgrad: lgrad, glow: glow, TAU: TAU
};

/* ---------------- Eliminador de emojis (textos heredados de data/systems) ---------------- */
let _emojiRE = null;
try {
  _emojiRE = new RegExp('[\\u{1F000}-\\u{1FAFF}\\u{2600}-\\u{27BF}\\u{2B00}-\\u{2BFF}\\u{2190}-\\u{21FF}\\u{2300}-\\u{23FF}\\u{FE0F}\\u{200D}\\u{20E3}\\u{1F1E6}-\\u{1F1FF}]', 'gu');
} catch (e) { _emojiRE = /[\u2600-\u27BF]/g; }
Art.strip = function (s) {
  return String(s == null ? '' : s).replace(_emojiRE, '').replace(/\s{2,}/g, ' ').trim();
};

/* ---------------- Cuerpos de criatura ---------------- */
Art.drawBody = function (g, e, sx, sy, s, walk, tint, time) {
  if (!e || !e.species) return false;
  const fn = Art.creatures[e.species];
  if (!fn) return false;
  const sd = D.SPECIES[e.species];
  const ang = (e.t && typeof e.t.ang === 'number') ? e.t.ang : 0;
  const fx = Math.cos(ang), fy = Math.sin(ang);
  const face = fx >= 0 ? 1 : -1;
  const sq = 0.58 + 0.42 * Math.min(1, Math.abs(fx) * 1.35);
  const fly = !!(e.tg && e.tg.flying);
  const t = time || 0;
  const lift = fly ? (18 + Math.sin(t * 3 + (e.id || 0)) * 3) * s : 0;
  const atk = e.an && e.an.atk > 0 ? U.clamp(1 - e.an.atk / 0.28, 0, 1) : -1;
  const baby = !!(e.tg && e.tg.baby);
  const tamed = !!(e.tg && e.tg.tamed);
  const sr = (sd && sd.scale ? sd.scale : 1) * s;
  g.save();
  g.globalAlpha = fly ? 0.18 : 0.30;
  ell(g, sx, sy, 11 * sr * (0.7 + sq * 0.4) * (fly ? 0.7 : 1), 4.6 * sr * (fly ? 0.7 : 1), '#000');
  if (tamed) { g.globalAlpha = 0.22; ell(g, sx, sy, 13 * sr, 5.4 * sr, '#d9a441'); }
  g.restore();
  const o = {
    t: t, ph: walk * 2, atk: atk, baby: baby, tamed: tamed, fly: fly,
    lvl: (e.tg && e.tg.level) || 1, sd: sd, e: e, tint: tint,
    front: fy > 0.45, back: fy < -0.45, sq: sq,
    hs: baby ? 1.20 : 1,
    lunge: atk >= 0 ? Math.sin(atk * Math.PI) * 2.2 : 0
  };
  g.save();
  g.translate(sx, sy - lift);
  g.scale(face * sq * s, s);
  g.lineJoin = 'round'; g.lineCap = 'round';
  try { fn(g, o); } catch (err) { g.restore(); return false; }
  g.restore();
  return true;
};

/* ---------------- Personas (jugador, NPC, guardias, trabajadores…) ---------------- */
Art.drawPerson = function (g, e, sx, sy, s, walk, time) {
  if (!e) return false;
  let fn = null;
  if (e.type === 'player') fn = Art.people.player;
  else if (e.type === 'npc') fn = Art.people[e.npcId];
  else if (e.type === 'guard') fn = Art.people.guard;
  else if (e.type === 'worker') fn = Art.people.worker;
  else if (e.species === 'bandit') fn = Art.people.bandit;
  else if (e.species === 'skeleton') fn = Art.people.skeleton;
  if (!fn) return false;
  const ang = (e.t && typeof e.t.ang === 'number') ? e.t.ang : 0;
  const fx = Math.cos(ang), fy = Math.sin(ang);
  const face = fx >= 0 ? 1 : -1;
  const sq = 0.62 + 0.38 * Math.min(1, Math.abs(fx) * 1.3);
  const t = time || 0;
  const atk = e.an && e.an.atk > 0 ? U.clamp(1 - e.an.atk / 0.26, 0, 1) : -1;
  const ride = !!(e.type === 'player' && e.mount);
  g.save(); g.globalAlpha = 0.30;
  ell(g, sx, sy, 8.5 * s, 3.8 * s, '#000');
  g.restore();
  const o = {
    t: t, ph: walk * 2, atk: atk, face: face, sq: sq, e: e,
    gender: e.gender === 'f' ? 'f' : 'm',
    free: e.free !== false,
    equip: e.equip || null,
    ride: ride, bust: false,
    stage: (e.tg && e.tg.stage) || 'adult',
    child: !!(e.tg && e.tg.child),
    role: (e.tg && e.tg.role) || 'idle',
    angry: !!(e.tg && e.tg.angry),
    front: fy > 0.45, back: fy < -0.45,
    tint: (e.tg && e.tg.tint) || '#b0c8e0'
  };
  g.save();
  g.translate(sx, sy);
  g.scale(face * sq * s, s);
  g.lineJoin = 'round'; g.lineCap = 'round';
  try { fn(g, o); } catch (err) { g.restore(); return false; }
  g.restore();
  return true;
};

/* ---------------- Iconos procedurales ---------------- */
function makeCanvas(size) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d');
  g.lineJoin = 'round'; g.lineCap = 'round';
  return { c: c, g: g };
}
function speciesIcon(g, id, size) {
  const fn = Art.creatures[id], sd = D.SPECIES[id];
  if (!fn || !sd) return false;
  const k = size / 58;
  g.save(); g.translate(size / 2, size * 0.84); g.scale(k, k);
  const o = { t: 0.4, ph: 0.7, atk: -1, baby: false, tamed: false, fly: false, lvl: 1, sd: sd, e: null, tint: sd.tint, front: false, back: false, sq: 1, hs: 1, lunge: 0 };
  try { fn(g, o); } catch (e) { g.restore(); return false; }
  g.restore(); return true;
}
function npcIcon(g, id, size) {
  const fn = Art.people[id === 'player' ? 'player' : id];
  if (!fn) return false;
  const nd = D.NPCS[id];
  const k = size / 30;
  g.save(); g.translate(size / 2, size * 0.94); g.scale(k, k);
  const o = {
    t: 0.4, ph: 0.6, atk: -1, face: 1, sq: 1, e: null, bust: true,
    gender: nd ? nd.gender : 'm', free: true, equip: null, ride: false,
    stage: 'adult', child: false, role: 'idle', angry: false,
    front: false, back: false, tint: nd && nd.gender === 'f' ? '#e0b0c0' : '#b0c8e0'
  };
  try { fn(g, o); } catch (e) { g.restore(); return false; }
  g.restore(); return true;
}
function resolve(key) {
  if (Art.icons[key]) return { fn: Art.icons[key], kind: 'item' };
  const ci = key.indexOf(':');
  if (ci > 0) {
    const pre = key.slice(0, ci), id = key.slice(ci + 1);
    if (pre === 'sp') return { fn: function (g, s) { return speciesIcon(g, id, s); }, kind: 'sp' };
    if (pre === 'npc') return { fn: function (g, s) { return npcIcon(g, id, s); }, kind: 'npc' };
    if (pre === 'bld') return { fn: Art.buildings[id] || Art.buildings._default, kind: 'bld' };
    if (pre === 'node') return { fn: Art.nodes[id] || Art.nodes._default, kind: 'node' };
    if (pre === 'ui') return { fn: Art.glyphs[id] || Art.glyphs._default, kind: 'ui' };
    if (pre === 'crop') return resolve('crop_' + id);
    if (pre === 'seed') return resolve('seed_' + id);
  }
  return null;
}
Art.icon = function (key, size) {
  size = size || 32;
  const ck = key + '@' + size;
  let c = Art._icon.get(ck);
  if (c) return c;
  const mc = makeCanvas(size);
  const g = mc.g; c = mc.c;
  const r = resolve(key);
  let ok = false;
  if (r && r.fn) {
    g.save();
    if (r.kind === 'item' || r.kind === 'bld' || r.kind === 'node' || r.kind === 'ui') {
      g.translate(size / 2, size / 2); g.scale(size / 32, size / 32);
    }
    try { ok = r.fn(g, size) !== false; } catch (e) { ok = false; }
    g.restore();
  }
  if (!ok) {
    /* Respaldo neutro: rombo dorado, nunca un emoji */
    g.save(); g.translate(size / 2, size / 2); g.scale(size / 32, size / 32);
    path(g, [[0, -9], [8, 0], [0, 9], [-8, 0]], '#8a6d3b', '#d9a441', 1.2);
    ell(g, 0, 0, 2.4, 2.4, '#f3cf7a');
    g.restore();
  }
  Art._icon.set(ck, c);
  return c;
};
Art.url = function (key, size) {
  size = size || 32;
  const ck = key + '@' + size;
  let u = Art._url.get(ck);
  if (!u) { u = Art.icon(key, size).toDataURL(); Art._url.set(ck, u); }
  return u;
};
Art.html = function (key, size, cls) {
  const px = size || 32;
  return '<img class="ic' + (cls ? ' ' + cls : '') + '" src="' + Art.url(key, px * 2) + '" width="' + px + '" height="' + px + '" alt="" draggable="false">';
};
Art.imgEl = function (key, size, cls) {
  const im = document.createElement('img');
  im.className = 'ic' + (cls ? ' ' + cls : '');
  im.width = im.height = size || 32;
  im.src = Art.url(key, (size || 32) * 2);
  im.alt = ''; im.draggable = false;
  return im;
};
/* Registros cómodos */
Art.item = function (id, fn) { Art.icons[id] = fn; };
Art.glyph = function (id, fn) { Art.glyphs[id] = fn; };
Art.building = function (id, fn) { Art.buildings[id] = fn; };
Art.node = function (id, fn) { Art.nodes[id] = fn; };
Art.clearCache = function () { Art._icon.clear(); Art._url.clear(); };

console.info('[CR] art.js v2 listo · cuerpos + personas + iconos procedurales sin emojis');
})();