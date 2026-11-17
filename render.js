/* ============================================================
KANATO DE JOTUN · render.js — Renderer isométrico v3 (512²)
ARCHIVO EN 4 PARTES CONCATENABLES: 9A · 9B · 9C · 9D
9A abre el IIFE; 9D lo cierra. No insertes nada entre ellas.

· Terreno horneado por chunks con LRU y precarga de un chunk por
  fotograma; calidad y resolución interna adaptativas.
· Parcelas comprables con color de tierra NATURAL; solo el suelo
  arado y las granjas NPC se ven como labor.
· Atlas procedural: 21 nodos, 24 cultivos por forma, casas,
  estaciones (horno, yunque, telar, potro, molino, alambique),
  camas, defensas, guardianes y edificios de ciudad nuevos.
· Entidades delegadas en CR.Art (criaturas y personas con equipo).
============================================================ */
(function () {
'use strict';
const CR = window.CR;
if (!CR || !CR.DATA || !CR.World || !CR.Ent) { console.error('[CR] render.js requiere core, data, world y entities'); return; }
const U = CR.util, C = CR.CONFIG, D = CR.DATA, W = CR.World, E = CR.Ent, Bus = CR.Bus;
const Art = CR.Art || null;
const TW = C.TILE_W, TH = C.TILE_H, HW = TW / 2, HH = TH / 2;
const sin = Math.sin, cos = Math.cos, PI = Math.PI;

/* ==========================================================
1 · COLOR
========================================================== */
const _rgbCache = Object.create(null);
function rgb(hex) {
  let v = _rgbCache[hex];
  if (v) return v;
  /* Acepta también 'rgb(r,g,b)' (lo devuelven mix/shade): antes se leía como 0 → negro */
  if (typeof hex === 'string' && hex.charCodeAt(0) === 114) {
    const m = hex.match(/[\d.]+/g);
    if (m && m.length >= 3) return { r: Math.round(+m[0]), g: Math.round(+m[1]), b: Math.round(+m[2]) };
  }
  let h = String(hex || '#888888').replace('#', '');
  if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
  const n = parseInt(h, 16) || 0;
  v = { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
  _rgbCache[hex] = v;
  return v;
}
function shade(hex, amt) {
  const c = rgb(hex);
  const f = function (x) { return U.clamp(Math.round(amt >= 0 ? x + (255 - x) * amt : x * (1 + amt)), 0, 255); };
  return 'rgb(' + f(c.r) + ',' + f(c.g) + ',' + f(c.b) + ')';
}
function rgba(hex, a) { const c = rgb(hex); return 'rgba(' + c.r + ',' + c.g + ',' + c.b + ',' + a + ')'; }
function mix(h1, h2, t) {
  const a = rgb(h1), b = rgb(h2);
  return 'rgb(' + Math.round(U.lerp(a.r, b.r, t)) + ',' + Math.round(U.lerp(a.g, b.g, t)) + ',' + Math.round(U.lerp(a.b, b.b, t)) + ')';
}
function hash2(x, y) {
  let h = (x * 374761393 + y * 668265263) | 0;
  h = (h ^ (h >> 13)) * 1274126177;
  return ((h ^ (h >> 16)) >>> 0) / 4294967296;
}
function clean(s) { return Art && Art.strip ? Art.strip(s) : String(s == null ? '' : s); }

/* ==========================================================
2 · ESTADO
========================================================== */
const R = CR.Render = {
  canvas: null, ctx: null, mini: null, mctx: null,
  vw: 0, vh: 0, dpr: 1, zoom: 1, quality: 1,
  time: 0, shake: 0, shakeX: 0, shakeY: 0,
  interact: null, _hintT: 0, _miniT: 0, _fpsAcc: 0, _fpsN: 0,
  ready: false, _lost: false, _mapDirty: true, _rs: 1, _rsUp: 0
};
const Cam = CR.Camera = { x: 256, y: 256, tx: 256, ty: 256, sx: 0, sy: 0 };
const chunkCache = new Map();
const chunkLRU = [];
let CHUNK_MAX = 22, CHUNK_BASE = 22;
const visBuf = [];
const CH = C.CHUNK, COX = CH * HW, CPAD = 18;
const CW = CH * TW, CHT = CH * TH + CPAD;
const CKEY = 64;                                  /* 512/16 = 32 ≤ 64 */
const atlas = { nodes: {}, buildings: {}, crops: {}, wall: null, gate: {} };
let lightCv = null, lightCtx = null, mapCv = null, mapCtx = null;

/* ==========================================================
3 · SPRITES PROCEDURALES
========================================================== */
function sprite(w, h, fn) {
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h));
  const g = c.getContext('2d');
  g.imageSmoothingEnabled = true;
  g.lineJoin = 'round'; g.lineCap = 'round';
  fn(g, c.width, c.height);
  return c;
}
function ellipse(g, x, y, rx, ry, fill) {
  g.beginPath(); g.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), 0, 0, U.TAU);
  g.fillStyle = fill; g.fill();
}
function poly(g, pts, fill, stroke, lw) {
  if (!pts.length) return;
  g.beginPath(); g.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]);
  g.closePath();
  if (fill) { g.fillStyle = fill; g.fill(); }
  if (stroke) { g.strokeStyle = stroke; g.lineWidth = lw || 1; g.stroke(); }
}
function contactShadow(g, x, y, rx, ry) { ellipse(g, x, y, rx, ry, 'rgba(0,0,0,0.26)'); }
function line(g, x0, y0, x1, y1, col, w) {
  g.strokeStyle = col; g.lineWidth = w; g.lineCap = 'round';
  g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke();
}

/* ---------- Nodos de recurso (21 claves) ---------- */
function makeNode(key, variant) {
  const def = D.NODES[key];
  const tint = (def && def.tint) || '#8a8a82';
  const rnd = CR.RNG(U.hashStr(key + variant));

  if (key === 'tree' || key === 'apple_tree') {
    return sprite(76, 104, function (g, w, h) {
      const cx = w / 2, base = h - 8;
      contactShadow(g, cx, base, 20, 8);
      const th = 30 + rnd.next() * 8;
      poly(g, [[cx - 5, base], [cx + 5, base], [cx + 3.5, base - th], [cx - 3.5, base - th]], '#6b4a2a');
      poly(g, [[cx - 5, base], [cx - 1, base], [cx - 1.5, base - th], [cx - 3.5, base - th]], '#54381f');
      const fy = base - th;
      const layers = [[0, 26, 20], [-13, 18, 15], [12, 17, 14], [0, 12, 12]];
      for (let i = 0; i < layers.length; i++) {
        const L = layers[i];
        const col = i === 0 ? tint : i === 3 ? shade(tint, 0.22) : shade(tint, i === 1 ? -0.14 : 0.08);
        ellipse(g, cx + L[0], fy - L[2] * 0.5 - i * 5, L[1], L[2], col);
      }
      ellipse(g, cx - 8, fy - 26, 9, 7, shade(tint, 0.3));
      if (key === 'apple_tree') {
        for (let i = 0; i < 6; i++) {
          const a = rnd.next() * U.TAU, r = 8 + rnd.next() * 16;
          ellipse(g, cx + cos(a) * r, fy - 16 + sin(a) * r * 0.6, 3.2, 3.2, '#d8402c');
          ellipse(g, cx + cos(a) * r - 1, fy - 17 + sin(a) * r * 0.6, 1.1, 1.1, '#f08070');
        }
      }
    });
  }

  if (key === 'dead_tree') {
    return sprite(70, 96, function (g, w, h) {
      const cx = w / 2, base = h - 8;
      contactShadow(g, cx, base, 15, 6);
      const th = 40 + rnd.next() * 10;
      poly(g, [[cx - 5, base], [cx + 5, base], [cx + 2.5, base - th], [cx - 2.5, base - th]], tint, shade(tint, -0.35), 1.2);
      for (let i = 0; i < 5; i++) {
        const y = base - th * (0.45 + i * 0.12), dir = i % 2 ? 1 : -1;
        const len = 12 + rnd.next() * 10;
        line(g, cx, y, cx + dir * len, y - len * 0.7, shade(tint, -0.1), 2.6);
        line(g, cx + dir * len, y - len * 0.7, cx + dir * (len + 6), y - len * 1.1, shade(tint, -0.2), 1.6);
      }
      ellipse(g, cx, base - th, 3.4, 2.4, shade(tint, -0.3));
    });
  }

  if (key === 'crystal_node') {
    return sprite(64, 68, function (g, w, h) {
      const cx = w / 2, base = h - 8;
      contactShadow(g, cx, base, 17, 7);
      poly(g, [[cx - 18, base], [cx - 20, base - 8], [cx - 8, base - 14], [cx + 8, base - 13], [cx + 19, base - 6], [cx + 16, base]], '#6a5a7a', '#3a2a4a', 1.3);
      g.save(); g.globalAlpha = 0.3; ellipse(g, cx, base - 18, 18, 13, tint); g.restore();
      const spikes = [[-6, 26, 5], [4, 32, 6], [12, 20, 4], [-13, 18, 4]];
      for (let i = 0; i < spikes.length; i++) {
        const s = spikes[i];
        poly(g, [[cx + s[0] - s[2], base - 8], [cx + s[0], base - 8 - s[1]], [cx + s[0] + s[2], base - 8]], tint, shade(tint, -0.4), 1);
        poly(g, [[cx + s[0] - s[2] * 0.4, base - 9], [cx + s[0], base - 8 - s[1]], [cx + s[0] + s[2] * 0.2, base - 10]], shade(tint, 0.35));
      }
    });
  }

  if (key === 'ice_node') {
    return sprite(62, 62, function (g, w, h) {
      const cx = w / 2, base = h - 8;
      contactShadow(g, cx, base, 16, 6);
      poly(g, [[cx - 17, base], [cx - 18, base - 7], [cx - 6, base - 13], [cx + 8, base - 12], [cx + 18, base - 5], [cx + 15, base]], '#c8dce8', '#8aa8bc', 1.2);
      g.save(); g.globalAlpha = 0.32; ellipse(g, cx, base - 16, 17, 12, tint); g.restore();
      for (let i = 0; i < 4; i++) {
        const px = cx - 11 + i * 7, hh = 16 + rnd.next() * 14;
        poly(g, [[px - 4, base - 6], [px, base - 6 - hh], [px + 4, base - 6]], tint, shade(tint, -0.3), 0.9);
        poly(g, [[px - 1.6, base - 7], [px, base - 6 - hh], [px + 0.6, base - 8]], '#ffffff');
      }
    });
  }

  if (key === 'clay_patch' || key === 'sand_patch') {
    const clay = key === 'clay_patch';
    return sprite(56, 40, function (g, w, h) {
      const cx = w / 2, base = h - 8;
      contactShadow(g, cx, base, 16, 5);
      ellipse(g, cx, base - 3, 18, 7, tint);
      ellipse(g, cx - 3, base - 6, 12, 5, shade(tint, 0.16));
      ellipse(g, cx + 6, base - 4, 8, 3.4, shade(tint, -0.12));
      if (clay) {
        g.save(); g.globalAlpha = 0.35; ellipse(g, cx - 4, base - 7, 6, 2.2, '#e8d0c0'); g.restore();
        for (let i = 0; i < 3; i++) ellipse(g, cx - 8 + i * 8, base - 2, 3, 1.6, shade(tint, -0.22));
      } else {
        g.strokeStyle = shade(tint, -0.16); g.lineWidth = 1;
        for (let i = 0; i < 3; i++) {
          g.beginPath();
          g.moveTo(cx - 14, base - 6 + i * 3);
          g.quadraticCurveTo(cx, base - 9 + i * 3, cx + 14, base - 5 + i * 3);
          g.stroke();
        }
      }
    });
  }

  if (key === 'rock' || key.indexOf('_node') > 0) {
    const ore = key !== 'rock';
    return sprite(64, 62, function (g, w, h) {
      const cx = w / 2, base = h - 8;
      contactShadow(g, cx, base, 18, 7);
      poly(g, [[cx - 19, base], [cx - 22, base - 12], [cx - 10, base - 24], [cx + 6, base - 27], [cx + 20, base - 16], [cx + 18, base - 3]], '#8e8a80', '#5f5c55', 1.5);
      poly(g, [[cx - 10, base - 24], [cx + 6, base - 27], [cx + 2, base - 14], [cx - 8, base - 13]], '#a5a196');
      poly(g, [[cx + 6, base - 27], [cx + 20, base - 16], [cx + 18, base - 3], [cx + 4, base - 8]], '#75726a');
      if (ore) {
        for (let i = 0; i < 5; i++) {
          const a = -0.4 - rnd.next() * 2.2, r = 6 + rnd.next() * 11;
          const px = cx + cos(a) * r, py = base - 13 + sin(a) * r * 0.7;
          const s = 3 + rnd.next() * 3.5;
          poly(g, [[px, py - s], [px + s * 0.7, py], [px, py + s], [px - s * 0.7, py]], tint, shade(tint, 0.45), 1);
          poly(g, [[px, py - s], [px + s * 0.3, py - s * 0.2], [px, py + s * 0.3]], shade(tint, 0.35));
        }
        g.save(); g.globalAlpha = 0.26; ellipse(g, cx, base - 15, 15, 10, tint); g.restore();
      }
    });
  }

  if (key === 'bush') {
    return sprite(52, 46, function (g, w, h) {
      const cx = w / 2, base = h - 8;
      contactShadow(g, cx, base, 14, 5);
      ellipse(g, cx - 7, base - 9, 11, 9, shade(tint, -0.12));
      ellipse(g, cx + 7, base - 8, 10, 8, tint);
      ellipse(g, cx, base - 15, 12, 10, shade(tint, 0.14));
      for (let i = 0; i < 5; i++) {
        const bx = cx - 9 + rnd.next() * 18, by = base - 16 + rnd.next() * 10;
        ellipse(g, bx, by, 2.4, 2.4, '#5a3a8a');
        ellipse(g, bx - 0.7, by - 0.7, 0.9, 0.9, '#8a6ac0');
      }
    });
  }

  if (key === 'grass') {
    return sprite(44, 34, function (g, w, h) {
      const cx = w / 2, base = h - 8;
      for (let i = 0; i < 7; i++) {
        const px = cx - 12 + i * 4, hh = 9 + rnd.next() * 9;
        g.strokeStyle = shade(tint, i % 2 ? 0.14 : -0.1); g.lineWidth = 2; g.lineCap = 'round';
        g.beginPath(); g.moveTo(px, base);
        g.quadraticCurveTo(px + (rnd.next() - 0.5) * 6, base - hh * 0.6, px + (rnd.next() - 0.5) * 9, base - hh);
        g.stroke();
      }
    });
  }

  if (key === 'herb_plant') {
    return sprite(44, 40, function (g, w, h) {
      const cx = w / 2, base = h - 8;
      contactShadow(g, cx, base, 9, 4);
      for (let i = 0; i < 5; i++) {
        const px = cx - 8 + i * 4;
        line(g, px, base, px + (i - 2) * 2, base - 14 - rnd.next() * 5, shade(tint, -0.1), 1.8);
        ellipse(g, px + (i - 2) * 2, base - 15 - rnd.next() * 4, 2.6, 2.6, i % 2 ? '#f2e07a' : '#e8f0a0');
      }
    });
  }

  /* honey_node */
  return sprite(58, 66, function (g, w, h) {
    const cx = w / 2, base = h - 8;
    contactShadow(g, cx, base, 13, 5);
    line(g, cx - 14, base - 44, cx + 12, base - 40, '#6b4a2a', 4);
    for (let i = 0; i < 4; i++) ellipse(g, cx, base - 30 + i * 6, 13 - i * 1.6, 5.5, shade(tint, i % 2 ? 0.1 : -0.1));
    ellipse(g, cx, base - 12, 4, 3, '#5a3a10');
    for (let i = 0; i < 3; i++) ellipse(g, cx - 16 + rnd.next() * 32, base - 34 + rnd.next() * 20, 1.8, 1.8, '#f8e07a');
  });
}

/* ---------- Cultivos: 3 etapas y forma propia por tipo ---------- */
const CROP_COL = {
  wheat: '#d8c060', carrot: '#e07830', potato: '#c8a060', tomato: '#d84040', pumpkin: '#e08828',
  onion: '#d8b8c8', lettuce: '#8ad060', garlic: '#e8e0d0', corn: '#e8c840', cabbage: '#8ac870',
  pepper: '#d83030', sweetpotato: '#c06080', rice: '#e0d890', quinoa: '#c88a68', maca: '#b89060',
  sunflower: '#f0c020', strawberry: '#e04060', grape: '#7a48a8', melon: '#a8d070', cotton: '#f4f4f0',
  flax: '#8ab8d8', herb: '#4aae7a', bean: '#7ab84a', beet: '#a8306a'
};
function makeCrop(cropId, stage) {
  const cd = D.CROPS[cropId];
  const form = (cd && cd.form) || 'fruit';
  const col = CROP_COL[cropId] || '#7ab040';
  return sprite(48, 54, function (g, w, h) {
    const cx = w / 2, base = h - 8;
    if (stage === 0) {
      for (let i = 0; i < 3; i++) line(g, cx - 6 + i * 6, base, cx - 6 + i * 6 + (i - 1) * 2, base - 7, '#6aae4a', 2);
      return;
    }
    if (stage === 1) {
      for (let i = 0; i < 4; i++) {
        const px = cx - 9 + i * 6;
        g.strokeStyle = '#5a9a3a'; g.lineWidth = 2.2; g.lineCap = 'round';
        g.beginPath(); g.moveTo(px, base);
        g.quadraticCurveTo(px + (i - 1.5) * 2, base - 12, px + (i - 1.5) * 4, base - 18); g.stroke();
        ellipse(g, px + (i - 1.5) * 4, base - 18, 4, 2.6, '#6fae4a');
      }
      return;
    }
    for (let i = 0; i < 4; i++) {
      const px = cx - 10 + i * 6.5, fx2 = px + (i - 1.5) * 3;
      g.strokeStyle = '#5a8a30'; g.lineWidth = 2.4; g.lineCap = 'round';
      g.beginPath(); g.moveTo(px, base);
      g.quadraticCurveTo(px + (i - 1.5) * 2, base - 16, fx2, base - 24); g.stroke();
      if (form === 'grain') {
        ellipse(g, fx2, base - 27, 3, 6.5, col);
        g.strokeStyle = shade(col, -0.24); g.lineWidth = 0.9;
        for (let k = 0; k < 4; k++) { g.beginPath(); g.moveTo(fx2 - 2.6, base - 31 + k * 3); g.lineTo(fx2 + 2.6, base - 30 + k * 3); g.stroke(); }
      } else if (form === 'root') {
        ellipse(g, fx2, base - 4, 5, 6, col);
        poly(g, [[fx2 - 2, base - 1], [fx2, base + 5], [fx2 + 2, base - 1]], shade(col, -0.18));
        for (let k = -1; k <= 1; k++) line(g, fx2, base - 9, fx2 + k * 5, base - 17, '#5a9a3a', 1.8);
      } else if (form === 'bulb') {
        ellipse(g, fx2, base - 5, 5.4, 5, col);
        g.strokeStyle = shade(col, -0.22); g.lineWidth = 0.8;
        for (let k = -1; k <= 1; k++) { g.beginPath(); g.moveTo(fx2 + k * 2, base - 10); g.quadraticCurveTo(fx2 + k * 3.4, base - 5, fx2 + k * 2, base); g.stroke(); }
        line(g, fx2, base - 10, fx2, base - 18, '#7a9a4a', 1.6);
      } else if (form === 'leaf') {
        for (let k = 0; k < 5; k++) {
          const a = k / 5 * U.TAU;
          ellipse(g, fx2 + cos(a) * 4, base - 8 + sin(a) * 3, 4.4, 3.4, k % 2 ? col : shade(col, 0.14));
        }
        ellipse(g, fx2, base - 8, 3.4, 2.8, shade(col, 0.26));
      } else if (form === 'seedpod') {
        for (let k = 0; k < 8; k++) {
          const a = k / 8 * U.TAU;
          ellipse(g, fx2 + cos(a) * 5, base - 26 + sin(a) * 5, 2.6, 2, col);
        }
        ellipse(g, fx2, base - 26, 3.4, 3.4, '#6a4a20');
      } else if (form === 'vine') {
        for (let k = 0; k < 4; k++) ellipse(g, fx2 + (k % 2 ? 1.8 : -1.8), base - 24 + k * 2.6, 2.6, 2.6, col);
        line(g, fx2, base - 26, fx2 + 4, base - 32, '#5a9a3a', 1.4);
      } else if (form === 'fiber') {
        for (let k = 0; k < 4; k++) {
          const a = k / 4 * U.TAU;
          ellipse(g, fx2 + cos(a) * 3, base - 25 + sin(a) * 3, 3.2, 3, col);
        }
        ellipse(g, fx2, base - 25, 2.6, 2.4, shade(col, 0.2));
      } else {
        ellipse(g, fx2, base - 24, 4.4, 4.8, col);
        if (cropId === 'pumpkin' || cropId === 'melon') {
          ellipse(g, fx2, base - 6, 7.4, 5.8, col);
          g.strokeStyle = shade(col, -0.3); g.lineWidth = 1;
          g.beginPath(); g.moveTo(fx2, base - 12); g.lineTo(fx2, base - 1); g.stroke();
        }
      }
      ellipse(g, fx2 - 1.2, base - (form === 'root' || form === 'bulb' ? 6 : 26), 1.4, 1.6, shade(col, 0.35));
    }
  });
}

/* ---------- Edificios: caja isométrica + detalles por tipo y clave ---------- */
function makeBuilding(key, w, h, info) {
  const kind = info.kind || 'house';
  const wallCol = info.wall || '#b0a080', roofCol = info.roof || '#8a6a4a';
  const BW = (w + h) * HW, BH = (w + h) * HH;
  let WH = 30, RH = 22;
  if (kind === 'wall') { WH = 32; RH = 8; }
  if (kind === 'fence' || kind === 'pen') { WH = 16; RH = 0; }
  if (kind === 'stall') { WH = 16; RH = 16; }
  if (kind === 'fountain') { WH = 12; RH = 6; }
  if (kind === 'chest') { WH = 14; RH = 6; }
  if (kind === 'fire') { WH = 6; RH = 0; }
  if (kind === 'bench') { WH = 14; RH = 4; }
  if (kind === 'bed') { WH = 10; RH = 0; }
  if (kind === 'gate') { WH = 40; RH = 10; }
  if (kind === 'church') { WH = 42; RH = 34; }
  if (kind === 'barracks' || kind === 'bank') { WH = 36; RH = 26; }
  if (kind === 'forge') { WH = 26; RH = 16; }
  const OX = h * HW + 6, OY = WH + RH + 8;
  const cv = sprite(BW + 12, BH + OY + 10, function (g) {
    const T = [OX, OY], Rp = [OX + w * HW, OY + w * HH], B = [OX + (w - h) * HW, OY + BH], L = [OX - h * HW, OY + h * HH];
    const up = function (p) { return [p[0], p[1] - WH]; };
    const Tu = up(T), Ru = up(Rp), Bu = up(B), Lu = up(L);
    g.save();
    ellipse(g, B[0], B[1] - 4, BW * 0.42, BH * 0.3, 'rgba(0,0,0,0.24)');

    /* Vallas y corrales */
    if (kind === 'fence' || kind === 'pen') {
      const posts = [];
      for (let i = 0; i <= w; i++) posts.push([OX + i * HW, OY + i * HH]);
      for (let i = 0; i <= h; i++) posts.push([OX - i * HW, OY + i * HH]);
      for (let i = 0; i <= w; i++) posts.push([OX - h * HW + i * HW, OY + h * HH + i * HH]);
      for (let i = 0; i <= h; i++) posts.push([OX + w * HW - i * HW, OY + w * HH + i * HH]);
      g.strokeStyle = shade(wallCol, -0.25); g.lineWidth = 3;
      g.beginPath();
      g.moveTo(T[0], T[1] - 12); g.lineTo(Rp[0], Rp[1] - 12); g.lineTo(B[0], B[1] - 12); g.lineTo(L[0], L[1] - 12);
      g.closePath(); g.stroke();
      g.beginPath();
      g.moveTo(T[0], T[1] - 6); g.lineTo(Rp[0], Rp[1] - 6); g.lineTo(B[0], B[1] - 6); g.lineTo(L[0], L[1] - 6);
      g.closePath(); g.stroke();
      for (let i = 0; i < posts.length; i++) {
        const p = posts[i];
        g.fillStyle = wallCol; g.fillRect(p[0] - 2.5, p[1] - 18, 5, 18);
        g.fillStyle = shade(wallCol, -0.3); g.fillRect(p[0] - 2.5, p[1] - 18, 2, 18);
        g.fillStyle = shade(wallCol, 0.2); g.fillRect(p[0] - 2.5, p[1] - 18, 5, 2);
      }
      g.restore(); return;
    }

    /* Fuego: fogata, antorcha y farol */
    if (kind === 'fire') {
      const fy = OY + BH * 0.5;
      if (key === 'torch_post' || key === 'lantern_post') {
        line(g, OX, fy + 4, OX, fy - 30, '#6a4a2a', 4);
        if (key === 'lantern_post') {
          poly(g, [[OX - 6, fy - 34], [OX + 6, fy - 34], [OX + 5, fy - 22], [OX - 5, fy - 22]], '#c8a060', '#8a6a28', 1.2);
          ellipse(g, OX, fy - 28, 3.4, 4.4, '#ffd070');
        } else {
          ellipse(g, OX, fy - 33, 4.4, 6, '#ff8a30');
          ellipse(g, OX, fy - 34, 2.2, 3.4, '#ffe08a');
        }
      } else {
        ellipse(g, OX, fy, 16, 8, '#4a4038');
        for (let i = 0; i < 7; i++) {
          const a = i / 7 * U.TAU;
          ellipse(g, OX + cos(a) * 15, fy + sin(a) * 7, 4, 3, '#8a8478');
          ellipse(g, OX + cos(a) * 15 - 1, fy + sin(a) * 7 - 1, 2, 1.4, '#a8a298');
        }
        line(g, OX - 9, fy + 3, OX + 9, fy - 3, '#5a3a20', 4);
        line(g, OX - 8, fy - 3, OX + 8, fy + 3, '#5a3a20', 4);
      }
      g.restore(); return;
    }

    /* Camas colocables */
    if (kind === 'bed') {
      poly(g, [T, Rp, B, L], shade(wallCol, -0.2), shade(wallCol, -0.4), 1.2);
      poly(g, [Tu, Ru, Bu, Lu], wallCol, shade(wallCol, -0.35), 1.2);
      const mx = (Tu[0] + Bu[0]) / 2, my = (Tu[1] + Bu[1]) / 2;
      poly(g, [[Tu[0] + 6, Tu[1] + 3], [Ru[0] - 6, Ru[1] + 3], [Bu[0] - 6, Bu[1] - 3], [Lu[0] + 6, Lu[1] - 3]], roofCol, shade(roofCol, -0.3), 1);
      ellipse(g, (Tu[0] + mx) / 2, (Tu[1] + my) / 2, 8, 4.4, '#f4ecd8');
      g.restore(); return;
    }

    /* Fuente y pozo */
    if (kind === 'fountain') {
      poly(g, [T, Rp, B, L], '#9aa2aa', '#6a727a', 1.5);
      poly(g, [Tu, Ru, Bu, Lu], '#b8c0c8', '#7a828a', 1.5);
      poly(g, [
        [OX, OY - WH + 4],
        [OX + w * HW * 0.7, OY + w * HH * 0.7 - WH + 4],
        [OX + (w - h) * HW * 0.7, OY + BH * 0.7 - WH + 4],
        [OX - h * HW * 0.7, OY + h * HH * 0.7 - WH + 4]
      ], key === 'well' ? '#3a5f52' : '#3f8fc0');
      if (key === 'well') {
        line(g, OX - 10, OY - WH - 4, OX - 10, OY - WH - 26, '#6a4a2a', 3);
        line(g, OX + 10, OY - WH - 4, OX + 10, OY - WH - 26, '#6a4a2a', 3);
        poly(g, [[OX - 14, OY - WH - 26], [OX, OY - WH - 34], [OX + 14, OY - WH - 26]], '#8a5a3a', '#5a3a20', 1);
        line(g, OX, OY - WH - 26, OX, OY - WH - 12, '#8a7050', 1.2);
        poly(g, [[OX - 4, OY - WH - 12], [OX + 4, OY - WH - 12], [OX + 3, OY - WH - 5], [OX - 3, OY - WH - 5]], '#8a6a44', '#5a4420', 1);
      } else {
        g.fillStyle = '#c8d0d8'; g.fillRect(OX - 3, OY - WH - 16, 6, 18);
        ellipse(g, OX, OY - WH - 18, 7, 4, '#d8e0e8');
      }
      g.restore(); return;
    }

    /* Muros */
    poly(g, [L, B, Bu, Lu], shade(wallCol, -0.28), shade(wallCol, -0.45), 1);
    poly(g, [B, Rp, Ru, Bu], shade(wallCol, -0.06), shade(wallCol, -0.3), 1);

    /* Tejado */
    if (RH > 0) {
      const apex = [OX + (w - h) * HW * 0.5, OY - WH - RH + BH * 0.25];
      if (kind === 'wall' || kind === 'gate') {
        poly(g, [Tu, Ru, Bu, Lu], shade(wallCol, 0.12), shade(wallCol, -0.3), 1);
        const n = Math.max(2, Math.round((w + h) * 1.5));
        for (let i = 0; i < n; i++) {
          const t = i / n;
          const px = U.lerp(Tu[0], Ru[0], t), py = U.lerp(Tu[1], Ru[1], t);
          g.fillStyle = shade(wallCol, 0.2); g.fillRect(px - 3, py - 7, 6, 7);
          const qx = U.lerp(Lu[0], Bu[0], t), qy = U.lerp(Lu[1], Bu[1], t);
          g.fillStyle = shade(wallCol, 0.05); g.fillRect(qx - 3, qy - 7, 6, 7);
        }
      } else {
        poly(g, [Lu, Bu, apex], shade(roofCol, -0.22), shade(roofCol, -0.4), 1);
        poly(g, [Bu, Ru, apex], shade(roofCol, 0.06), shade(roofCol, -0.3), 1);
        poly(g, [Tu, Ru, apex], shade(roofCol, 0.2), shade(roofCol, -0.2), 1);
        poly(g, [Tu, Lu, apex], shade(roofCol, -0.05), shade(roofCol, -0.3), 1);
        line(g, apex[0], apex[1], Bu[0], Bu[1], shade(roofCol, -0.4), 1.5);
      }
    } else {
      poly(g, [Tu, Ru, Bu, Lu], shade(wallCol, 0.1), shade(wallCol, -0.3), 1);
    }

    const faceX = (B[0] + Rp[0]) / 2, faceY = (B[1] + Rp[1]) / 2 - WH * 0.5;
    const apexY = OY - WH - RH + BH * 0.25;

    /* Puerta y ventanas */
    if (kind === 'house' || kind === 'smithy' || kind === 'steward' || kind === 'barracks' ||
        kind === 'bank' || kind === 'church' || kind === 'forge') {
      const dw = Math.min(14, w * 5), dh = WH * 0.62;
      g.fillStyle = '#4a3220'; g.fillRect(faceX - dw / 2, faceY + WH * 0.5 - dh, dw, dh);
      g.fillStyle = '#6b4a2e'; g.fillRect(faceX - dw / 2 + 1.5, faceY + WH * 0.5 - dh + 1.5, dw - 3, dh - 3);
      ellipse(g, faceX + dw / 2 - 3, faceY + WH * 0.5 - dh * 0.5, 1.4, 1.4, '#e0c060');
      const wl = [L[0] + (B[0] - L[0]) * 0.35, L[1] + (B[1] - L[1]) * 0.35 - WH * 0.62];
      const wr = [L[0] + (B[0] - L[0]) * 0.68, L[1] + (B[1] - L[1]) * 0.68 - WH * 0.62];
      g.fillStyle = (kind === 'church' || key === 'alchemy_hut' || key === 'alchemy') ? '#e8a040' : '#8fc8e0';
      g.fillRect(wl[0] - 4, wl[1], 8, 8); g.fillRect(wr[0] - 4, wr[1], 8, 8);
      g.strokeStyle = shade(wallCol, -0.4); g.lineWidth = 1;
      g.strokeRect(wl[0] - 4, wl[1], 8, 8); g.strokeRect(wr[0] - 4, wr[1], 8, 8);
      g.beginPath();
      g.moveTo(wl[0], wl[1]); g.lineTo(wl[0], wl[1] + 8); g.moveTo(wl[0] - 4, wl[1] + 4); g.lineTo(wl[0] + 4, wl[1] + 4);
      g.moveTo(wr[0], wr[1]); g.lineTo(wr[0], wr[1] + 8); g.moveTo(wr[0] - 4, wr[1] + 4); g.lineTo(wr[0] + 4, wr[1] + 4);
      g.stroke();
    }

    if (kind === 'church') {
      g.fillStyle = '#e8dcb0'; g.fillRect(OX - 2, apexY - 22, 4, 22);
      ellipse(g, OX, apexY - 24, 5, 5, '#e07a3a');
      ellipse(g, OX, apexY - 24, 2.6, 2.6, '#f2c060');
      for (let i = 0; i < 8; i++) {
        const a = i / 8 * U.TAU;
        line(g, OX + cos(a) * 6, apexY - 24 + sin(a) * 6, OX + cos(a) * 8.6, apexY - 24 + sin(a) * 8.6, '#e8c040', 1.4);
      }
    }

    if (kind === 'barracks') {
      const bx = faceX + 12, by = (B[1] + Rp[1]) / 2 - WH;
      g.fillStyle = '#8a3a2a'; g.fillRect(bx, by, 10, 20);
      g.fillStyle = '#d8a040'; g.fillRect(bx + 3, by + 6, 4, 8);
      if (key === 'tower_watch') {
        line(g, OX, apexY, OX, apexY - 16, '#6a4a2a', 2.4);
        poly(g, [[OX, apexY - 16], [OX + 12, apexY - 12], [OX, apexY - 8]], '#c0392b', '#8a2418', 1);
      }
    }

    if (kind === 'bank') {
      for (let i = 0; i < 3; i++) {
        const px = L[0] + (B[0] - L[0]) * (0.25 + i * 0.25), py = L[1] + (B[1] - L[1]) * (0.25 + i * 0.25);
        g.fillStyle = shade(wallCol, 0.25); g.fillRect(px - 3, py - WH, 6, WH);
        g.fillStyle = shade(wallCol, -0.15); g.fillRect(px - 3, py - WH, 2, WH);
      }
      if (key === 'land_office') {
        ellipse(g, OX, apexY - 8, 6, 6, '#e8c040');
        ellipse(g, OX, apexY - 8, 3.4, 3.4, '#f8e08a');
        g.strokeStyle = '#a07820'; g.lineWidth = 1;
        g.beginPath(); g.arc(OX, apexY - 8, 6, 0, U.TAU); g.stroke();
      }
    }

    if (kind === 'smithy' || kind === 'forge') {
      const chx = OX + w * HW * 0.45, chy = OY - WH - RH * 0.5;
      g.fillStyle = '#6a5a50'; g.fillRect(chx - 5, chy - 14, 10, 20);
      g.fillStyle = '#4a3a32'; g.fillRect(chx - 6, chy - 16, 12, 4);
      const gx = faceX - 12, gy = faceY + WH * 0.05;
      ellipse(g, gx, gy, 6, 5, '#ff7a30'); ellipse(g, gx, gy, 3, 2.5, '#ffd070');
      if (key === 'anvil') {
        poly(g, [[faceX + 8, gy - 2], [faceX + 20, gy - 2], [faceX + 18, gy + 3], [faceX + 10, gy + 3]], '#8a8a92', '#5a5a62', 1);
        g.fillStyle = '#6a6a72'; g.fillRect(faceX + 12, gy + 3, 4, 5);
      }
      if (key === 'smelter') {
        poly(g, [[OX - 9, OY - WH + 2], [OX + 9, OY - WH + 2], [OX + 7, OY - WH - 12], [OX - 7, OY - WH - 12]], '#7a6a60', '#4a3a32', 1.2);
        ellipse(g, OX, OY - WH - 2, 5, 3.4, '#ff8a30');
      }
    }

    if (kind === 'stall') {
      const aw = [[Tu[0], Tu[1] - 6], [Ru[0], Ru[1] - 6], [Bu[0], Bu[1] - 6], [Lu[0], Lu[1] - 6]];
      for (let i = 0; i < 6; i++) {
        const t0 = i / 6, t1 = (i + 1) / 6;
        poly(g, [
          [U.lerp(aw[3][0], aw[2][0], t0), U.lerp(aw[3][1], aw[2][1], t0)],
          [U.lerp(aw[3][0], aw[2][0], t1), U.lerp(aw[3][1], aw[2][1], t1)],
          [U.lerp(aw[0][0], aw[1][0], t1), U.lerp(aw[0][1], aw[1][1], t1)],
          [U.lerp(aw[0][0], aw[1][0], t0), U.lerp(aw[0][1], aw[1][1], t0)]
        ], i % 2 ? '#d8483a' : '#f0e0c0');
      }
      const goods = ['#e07030', '#d84040', '#e8c040', '#70b040'];
      for (let i = 0; i < 4; i++) {
        ellipse(g, OX - 10 + i * 7, OY + BH * 0.55 - WH, 3, 2.5, goods[i]);
        ellipse(g, OX - 11 + i * 7, OY + BH * 0.55 - WH - 1, 1.2, 1, shade(goods[i], 0.3));
      }
      if (key === 'caravan_post') {
        ellipse(g, OX - 14, OY + BH * 0.7, 5, 5, '#6a4a2a');
        ellipse(g, OX + 14, OY + BH * 0.7, 5, 5, '#6a4a2a');
        poly(g, [[OX - 14, OY + BH * 0.7 - 6], [OX + 14, OY + BH * 0.7 - 6], [OX + 12, OY + BH * 0.7 - 14], [OX - 12, OY + BH * 0.7 - 14]], '#a08850', '#6a5430', 1);
      }
    }

    if (kind === 'chest') {
      g.fillStyle = '#c8a040'; g.fillRect(OX - 8, OY - WH + 2, 16, 3);
      g.fillStyle = '#e8c040'; g.fillRect(OX - 2.5, OY - WH + 1, 5, 7);
      ellipse(g, OX, OY - WH * 0.5, 2, 2, '#e8d080');
    }

    /* Bancos especializados: pilón, gárgola, espantapájaros, telar,
       potro, mesa de flechas, molino y banco genérico */
    if (kind === 'bench') {
      if (key === 'golem_pylon') {
        poly(g, [[OX - 7, OY - WH + 2], [OX + 7, OY - WH + 2], [OX + 5, OY - WH - 30], [OX - 5, OY - WH - 30]], wallCol, shade(wallCol, -0.4), 1.2);
        ellipse(g, OX, OY - WH - 32, 5, 5, '#8fd0f0');
        ellipse(g, OX, OY - WH - 32, 2.4, 2.4, '#e8f8ff');
      } else if (key === 'gargoyle_perch' || key === 'gargoyle_perch_city') {
        poly(g, [[OX - 8, OY - WH + 2], [OX + 8, OY - WH + 2], [OX + 6, OY - WH - 16], [OX - 6, OY - WH - 16]], wallCol, shade(wallCol, -0.4), 1.2);
        ellipse(g, OX, OY - WH - 22, 5.4, 5, '#7a7a80');
        poly(g, [[OX - 5, OY - WH - 24], [OX - 12, OY - WH - 30], [OX - 4, OY - WH - 20]], '#6a6a72');
        poly(g, [[OX + 5, OY - WH - 24], [OX + 12, OY - WH - 30], [OX + 4, OY - WH - 20]], '#6a6a72');
        ellipse(g, OX - 1.6, OY - WH - 23, 1, 1, '#e04b3a');
        ellipse(g, OX + 1.6, OY - WH - 23, 1, 1, '#e04b3a');
      } else if (key === 'scarecrow') {
        line(g, OX, OY - WH + 4, OX, OY - WH - 26, '#8a6a3a', 3);
        line(g, OX - 11, OY - WH - 18, OX + 11, OY - WH - 18, '#8a6a3a', 2.4);
        ellipse(g, OX, OY - WH - 30, 5, 5.4, '#d8b860');
        poly(g, [[OX - 7, OY - WH - 33], [OX + 7, OY - WH - 33], [OX + 5, OY - WH - 37], [OX - 5, OY - WH - 37]], '#a08840');
        ellipse(g, OX - 1.6, OY - WH - 30, 0.9, 0.9, '#3a2a1a');
        ellipse(g, OX + 1.6, OY - WH - 30, 0.9, 0.9, '#3a2a1a');
      } else if (key === 'loom') {
        poly(g, [[OX - 10, OY - WH + 2], [OX + 10, OY - WH + 2], [OX + 8, OY - WH - 20], [OX - 8, OY - WH - 20]], '#b09060', '#7a5a34', 1.2);
        for (let i = 0; i < 6; i++) line(g, OX - 7 + i * 2.8, OY - WH - 18, OX - 7 + i * 2.8, OY - WH, '#f0e8d8', 0.9);
        line(g, OX - 8, OY - WH - 8, OX + 8, OY - WH - 8, '#c8a868', 1.6);
      } else if (key === 'tannery') {
        poly(g, [[OX - 9, OY - WH + 2], [OX + 9, OY - WH + 2], [OX + 7, OY - WH - 18], [OX - 7, OY - WH - 18]], '#a88860', '#6a5a3a', 1.2);
        poly(g, [[OX - 5, OY - WH - 16], [OX + 5, OY - WH - 14], [OX + 4, OY - WH - 2], [OX - 4, OY - WH - 4]], '#b08a5c', '#7a5a34', 1);
      } else if (key === 'fletching') {
        g.fillStyle = '#b89060'; g.fillRect(OX - 12, OY - WH - 2, 24, 4);
        for (let i = 0; i < 4; i++) {
          line(g, OX - 8 + i * 5, OY - WH - 2, OX - 5 + i * 5, OY - WH - 16, '#a07840', 1.4);
          poly(g, [[OX - 6 + i * 5, OY - WH - 15], [OX - 3 + i * 5, OY - WH - 18], [OX - 4 + i * 5, OY - WH - 13]], '#e8dcb0');
        }
      } else if (key === 'mill') {
        poly(g, [[OX - 9, OY - WH + 2], [OX + 9, OY - WH + 2], [OX + 7, OY - WH - 18], [OX - 7, OY - WH - 18]], '#c8b898', '#7a6a4a', 1.2);
        ellipse(g, OX, OY - WH - 20, 9, 4.4, '#a8a8a0');
        ellipse(g, OX, OY - WH - 21, 5, 2.4, '#c8c8c0');
        line(g, OX + 8, OY - WH - 20, OX + 16, OY - WH - 26, '#8a6a3a', 2);
      } else {
        line(g, OX - 8, OY - WH - 2, OX - 2, OY - WH - 8, '#8a8a92', 2);
        g.fillStyle = '#a8b0b8'; g.fillRect(OX - 11, OY - WH - 5, 6, 3);
        ellipse(g, OX + 6, OY - WH - 3, 4, 2.5, '#a07840');
      }
    }

    if (key === 'alchemy' || key === 'alchemy_hut') {
      for (let i = 0; i < 3; i++) {
        const bx = OX - 8 + i * 8, by = OY - WH - 2;
        poly(g, [[bx - 2.4, by], [bx + 2.4, by], [bx + 1.6, by - 8], [bx - 1.6, by - 8]], '#dce8f0', '#9ab0c0', 0.9);
        ellipse(g, bx, by - 2, 2, 2.4, ['#8ae04a', '#d0342c', '#8fd0f0'][i]);
      }
    }

    if (key === 'inn') {
      line(g, faceX + 16, faceY - 6, faceX + 16, faceY - 20, '#6a4a2a', 2);
      poly(g, [[faceX + 16, faceY - 20], [faceX + 30, faceY - 17], [faceX + 16, faceY - 12]], '#c8a060', '#8a6a28', 1);
    }

    if (key === 'hunter_lodge') {
      line(g, faceX - 14, faceY - 10, faceX - 20, faceY - 22, '#d8ccb0', 2);
      line(g, faceX - 20, faceY - 22, faceX - 26, faceY - 26, '#d8ccb0', 1.6);
      line(g, faceX - 14, faceY - 10, faceX - 8, faceY - 22, '#d8ccb0', 2);
      line(g, faceX - 8, faceY - 22, faceX - 2, faceY - 26, '#d8ccb0', 1.6);
    }

    if (kind === 'gate') {
      g.clearRect(OX - HW * 0.55, OY - WH * 0.8, HW * 1.1, WH * 0.8 + BH * 0.5);
      g.fillStyle = shade(wallCol, -0.35);
      g.fillRect(OX - HW * 0.62, OY - WH, 6, WH);
      g.fillRect(OX + HW * 0.62 - 6, OY - WH, 6, WH);
      g.fillStyle = shade(wallCol, -0.1);
      g.fillRect(OX - HW * 0.62, OY - WH, 6, 4);
      g.fillRect(OX + HW * 0.62 - 6, OY - WH, 6, 4);
    }
    g.restore();
  });
  cv._ox = OX; cv._oy = OY;
  return cv;
}

function buildAtlas() {
  const keys = Object.keys(D.NODES);
  for (let i = 0; i < keys.length; i++) atlas.nodes[keys[i]] = [makeNode(keys[i], 0), makeNode(keys[i], 1), makeNode(keys[i], 2)];
  const ck = Object.keys(D.CROPS);
  for (let i = 0; i < ck.length; i++) atlas.crops[ck[i]] = [makeCrop(ck[i], 0), makeCrop(ck[i], 1), makeCrop(ck[i], 2)];
  atlas.wall = makeBuilding('wall_stone', 1, 1, { kind: 'wall', wall: '#a89880', roof: '#8a7a60' });
  atlas.gate.s = makeBuilding('gate', 2, 1, { kind: 'gate', wall: '#b0a088', roof: '#8a7a60' });
  atlas.gate.e = makeBuilding('gate', 1, 2, { kind: 'gate', wall: '#b0a088', roof: '#8a7a60' });
}
function buildingSprite(key, w, h, info) {
  const ck = key + ':' + w + 'x' + h;
  let s = atlas.buildings[ck];
  if (!s) { s = makeBuilding(key, w, h, info || { kind: 'house' }); atlas.buildings[ck] = s; }
  return s;
}

/* ==========================================================
4 · BAKE DE TERRENO POR CHUNKS
========================================================== */
function diamond(g, x, y, fill) {
  g.beginPath(); g.moveTo(x, y); g.lineTo(x + HW, y + HH); g.lineTo(x, y + TH); g.lineTo(x - HW, y + HH); g.closePath();
  g.fillStyle = fill; g.fill();
}
function bakeChunk(cx, cy) {
  const cv = document.createElement('canvas');
  cv.width = CW; cv.height = CHT;
  const g = cv.getContext('2d');
  const x0 = cx * CH, y0 = cy * CH;
  const zoneTint = Object.create(null);
  for (let ly = 0; ly < CH; ly++) {
    for (let lx = 0; lx < CH; lx++) {
      const tx = x0 + lx, ty = y0 + ly;
      if (!W.inBounds(tx, ty)) continue;
      const idx = ty * C.WORLD + tx;
      const f = W.flags[idx], b = W.biome[idx], el = W.elev[idx];
      const bio = D.BIOMES[b] || D.BIOMES[0];
      const sx = (lx - ly) * HW + COX, sy = (lx + ly) * HH;
      const hv = hash2(tx, ty);
      let col;
      if (f & W.F.WATER) col = mix(bio.water, '#0d2a3a', U.clamp((90 - el) / 90, 0, 1) * 0.55);
      else if (f & W.F.ROAD) col = mix('#9a7f52', '#b09468', hv);
      else if (f & W.F.FLOOR) col = mix('#b8ae96', '#c8bea6', hv);
      else if (f & W.F.TILLED) col = mix('#6b4f30', '#7a5c3a', hv);
      else if (f & W.F.FARM) col = mix('#8a6a44', '#9a7a52', hv);
      else {
        col = hv > 0.5 ? bio.base : bio.alt;
        /* Parcelas comprables: tierra de color NATURAL, apenas más cálida */
        if (f & W.F.PARCEL) col = mix(col, '#9a7f52', 0.16);
        col = shade(col, U.clamp((el - 110) / 145, -0.4, 0.4) * 0.28);
        if (f & W.F.ZONE) {
          const z = W.zoneAt(tx, ty);
          if (z) {
            let tc = zoneTint[z.id];
            if (tc === undefined) {
              const zd = D.ZONE_BY_ID[z.id];
              tc = zd ? zd.tint : '#d9a441';
              zoneTint[z.id] = tc;
            }
            col = mix(col, tc, 0.12);
          }
        }
      }
      diamond(g, sx, sy, col);
      if (!(f & W.F.WATER)) {
        if ((f & W.F.FLOOR) && ((tx + ty) & 1)) {
          g.strokeStyle = 'rgba(0,0,0,0.07)'; g.lineWidth = 1;
          g.beginPath(); g.moveTo(sx - HW * 0.5, sy + HH * 0.5); g.lineTo(sx + HW * 0.5, sy + HH * 1.5); g.stroke();
        } else if (f & W.F.ROAD) {
          g.fillStyle = 'rgba(0,0,0,0.10)';
          for (let k = 0; k < 3; k++) {
            const r2 = hash2(tx * 7 + k, ty * 13);
            g.fillRect(sx - 12 + r2 * 24, sy + 8 + hash2(ty + k, tx) * 16, 2, 1.5);
          }
        } else if (!(f & (W.F.FARM | W.F.TILLED)) && hv > 0.72) {
          g.fillStyle = rgba(bio.decor, 0.5);
          g.fillRect(sx - 6 + hv * 12, sy + 12 + hv * 8, 3, 2);
        }
        if (f & W.F.CAMP) {
          g.fillStyle = 'rgba(40,26,18,0.22)';
          g.fillRect(sx - 10, sy + 10, 20, 8);
        }
      }
      const below = W.inBounds(tx, ty + 1) ? W.flags[(ty + 1) * C.WORLD + tx] : 0;
      const right = W.inBounds(tx + 1, ty) ? W.flags[ty * C.WORLD + tx + 1] : 0;
      if ((f & W.F.WATER) === 0 && (below & W.F.WATER)) {
        g.strokeStyle = 'rgba(255,255,255,0.22)'; g.lineWidth = 2;
        g.beginPath(); g.moveTo(sx - HW, sy + HH); g.lineTo(sx, sy + TH); g.stroke();
      }
      if ((f & W.F.WATER) === 0 && (right & W.F.WATER)) {
        g.strokeStyle = 'rgba(255,255,255,0.16)'; g.lineWidth = 2;
        g.beginPath(); g.moveTo(sx, sy + TH); g.lineTo(sx + HW, sy + HH); g.stroke();
      }
    }
  }
  return cv;
}
function getChunk(cx, cy) {
  const key = cy * CKEY + cx;
  let cv = chunkCache.get(key);
  if (cv) {
    const i = chunkLRU.indexOf(key);
    if (i >= 0) chunkLRU.splice(i, 1);
    chunkLRU.push(key);
    return cv;
  }
  cv = bakeChunk(cx, cy);
  chunkCache.set(key, cv);
  chunkLRU.push(key);
  while (chunkLRU.length > CHUNK_MAX) {
    const old = chunkLRU.shift();
    const oc = chunkCache.get(old);
    if (oc) { oc.width = oc.height = 1; chunkCache.delete(old); }
  }
  return cv;
}
R.invalidateAll = function () {
  chunkCache.forEach(function (cv) { cv.width = cv.height = 1; });
  chunkCache.clear(); chunkLRU.length = 0;
  atlas.buildings = {};
  R._mapDirty = true;
};
/* ==========================================================
5 · CÁMARA Y TRANSFORMACIONES
========================================================== */
function camSX() { return (Cam.x - Cam.y) * HW; }
function camSY() { return (Cam.x + Cam.y) * HH; }
function w2sx(x, y) { return ((x - y) * HW - camSX()) * R.zoom + R.vw / 2 + R.shakeX; }
function w2sy(x, y) { return ((x + y) * HH - camSY()) * R.zoom + R.vh / 2 + R.shakeY; }
Cam.screenToWorld = function (sx, sy) {
  const px = (sx - R.vw / 2 - R.shakeX) / R.zoom + camSX();
  const py = (sy - R.vh / 2 - R.shakeY) / R.zoom + camSY();
  return { x: (px / HW + py / HH) / 2, y: (py / HH - px / HW) / 2 };
};
Cam.worldToScreen = function (x, y) { return { x: w2sx(x, y), y: w2sy(x, y) }; };
Cam.setZoom = function (z) { R.zoom = U.clamp(z, 0.6, 1.8); };
function updateCamera(dt) {
  const p = E.player;
  if (p) {
    Cam.tx = p.t.x; Cam.ty = p.t.y;
    /* Anticipación: la cámara se adelanta hacia donde miras */
    if (p.mount && p.mount.tg.flying) { Cam.tx += cos(p.t.ang) * 1.3; Cam.ty += sin(p.t.ang) * 1.3; }
    if (p.isBow && p.act && p.act.kind === 'draw') { Cam.tx += cos(p.t.ang) * 0.9; Cam.ty += sin(p.t.ang) * 0.9; }
  } else if (W.ready && W.city) {
    const a = R.time * 0.04;
    Cam.tx = W.city.x + W.city.w / 2 + cos(a) * 20;
    Cam.ty = W.city.y + W.city.h / 2 + sin(a) * 20;
  }
  const k = 1 - Math.pow(0.0016, dt);
  Cam.x += (Cam.tx - Cam.x) * k;
  Cam.y += (Cam.ty - Cam.y) * k;
  if (CR.Settings.values.shake && R.shake > 0.05) {
    R.shake *= Math.pow(0.0009, dt);
    const a = R.time * 47;
    R.shakeX = cos(a) * R.shake;
    R.shakeY = sin(a * 1.37) * R.shake * 0.7;
  } else { R.shake = 0; R.shakeX = 0; R.shakeY = 0; }
}

/* ==========================================================
6 · PARTÍCULAS Y FLOATERS (pooled, cero GC en régimen)
========================================================== */
const partPool = new CR.Pool(
  function () { return { x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, life: 0, max: 1, size: 3, col: '#fff', kind: 'dot', rot: 0, vr: 0, grav: 0, screen: false }; },
  function (p) { p.life = 0; p.screen = false; p.grav = 0; p.z = 0; p.vz = 0; },
  160, 560
);
const parts = [];
const floatPool = new CR.Pool(
  function () { return { x: 0, y: 0, t: 0, max: 1, text: '', col: '#fff' }; },
  function (f) { f.t = 0; },
  28, 80
);
const floats = [];
function spawnPart(x, y, kind, col, opts) {
  if (parts.length > 460 * R.quality) return;
  const p = partPool.acquire();
  if (!p) return;
  const o = opts || {};
  const r = CR.streams ? CR.streams.fx : null;
  const rn = function () { return r ? r.next() : Math.random(); };
  p.x = x; p.y = y; p.z = o.z || 0;
  p.vx = o.vx !== undefined ? o.vx : (rn() - 0.5) * 2.2;
  p.vy = o.vy !== undefined ? o.vy : (rn() - 0.5) * 2.2;
  p.vz = o.vz !== undefined ? o.vz : 1.4 + rn() * 2.4;
  p.grav = o.grav !== undefined ? o.grav : 7;
  p.max = p.life = o.life || (0.45 + rn() * 0.5);
  p.size = o.size || (2 + rn() * 2.6);
  p.col = col; p.kind = kind;
  p.rot = rn() * U.TAU; p.vr = (rn() - 0.5) * 9;
  p.screen = !!o.screen;
  parts.push(p);
}
function burst(x, y, kind, col, n, opts) {
  n = Math.round(n * R.quality);
  for (let i = 0; i < n; i++) spawnPart(x, y, kind, col, opts);
}
R.burst = burst;

const FX = {
  wood: function (d) { burst(d.x, d.y, 'chip', (d.extra && d.extra.tint) || '#8a5a30', 7, { z: 0.5, size: 3 }); },
  stone: function (d) { burst(d.x, d.y, 'chip', (d.extra && d.extra.tint) || '#9a968c', 7, { z: 0.4, size: 3 }); },
  leaf: function (d) { burst(d.x, d.y, 'leaf', '#6fae4a', 6, { z: 0.7, grav: 2.4, life: 1.1 }); },
  break: function (d) { burst(d.x, d.y, 'chip', (d.extra && d.extra.tint) || '#9a968c', 14, { z: 0.6, size: 3.6, vz: 3.4 }); },
  dust: function (d) { burst(d.x, d.y, 'smoke', '#c8b898', 4, { z: 0.1, grav: 1.2, life: 0.5, size: 4 }); },
  hit: function (d) {
    const crit = !!(d.extra && d.extra.crit);
    burst(d.x, d.y, 'spark', crit ? '#ffd76a' : '#ff9a6a', crit ? 12 : 7, { z: 0.7, size: 2.6, vz: 3 });
  },
  death: function (d) { burst(d.x, d.y, 'smoke', (d.extra && d.extra.tint) || '#888888', 16, { z: 0.5, grav: 1.6, life: 0.9, size: 5 }); },
  slash: function (d) {
    const p = partPool.acquire(); if (!p) return;
    const heavy = !!(d.extra && d.extra.heavy);
    p.x = d.x; p.y = d.y; p.z = 0.6; p.vx = p.vy = p.vz = 0; p.grav = 0;
    p.max = p.life = heavy ? 0.28 : 0.2;
    p.size = heavy ? 1.5 : 1;
    p.col = heavy ? '#ffd76a' : '#ffffff';
    p.kind = 'slash'; p.rot = (d.extra && d.extra.ang) || 0; p.screen = false;
    parts.push(p);
  },
  shock: function (d) {
    const p = partPool.acquire(); if (!p) return;
    p.x = d.x; p.y = d.y; p.z = 0; p.vx = p.vy = p.vz = 0; p.grav = 0;
    p.max = p.life = 0.5; p.size = (d.extra && d.extra.r) || 3;
    p.col = (d.extra && d.extra.fire) ? '#ff8a30' : '#e0d0a0'; p.kind = 'ring';
    parts.push(p);
  },
  telegraph: function (d) {
    const p = partPool.acquire(); if (!p) return;
    p.x = d.x; p.y = d.y; p.z = 0; p.vx = p.vy = p.vz = 0; p.grav = 0;
    p.max = p.life = (d.extra && d.extra.t) || 0.7;
    p.size = (d.extra && d.extra.r) || 3;
    p.col = '#ff5a3a'; p.kind = 'tele';
    parts.push(p);
  },
  spark: function (d) { burst(d.x, d.y, 'spark', '#f3cf7a', 12, { z: 0.6, vz: 3.4, life: 0.8 }); },
  legend: function (d) { burst(d.x, d.y, 'star', '#ffd76a', 26, { z: 0.8, vz: 4.2, life: 1.4, grav: 2 }); },
  levelup: function (d) { burst(d.x, d.y, 'star', '#8fe08f', 20, { z: 0.4, vz: 4.6, life: 1.2, grav: 1.4 }); },
  heal: function (d) { burst(d.x, d.y, 'star', '#8fe08f', 8, { z: 0.5, vz: 2.6, life: 0.8, grav: 0.6 }); },
  heart: function (d) { burst(d.x, d.y, 'heart', '#ff8ab0', 5, { z: 0.8, vz: 1.8, life: 1.1, grav: 0.4, vx: 0, vy: 0 }); },
  fire: function (d) { burst(d.x, d.y, 'flame', '#ff8a30', 3, { z: 0.3, vz: 1.8, life: 0.45, grav: -1.2, size: 4 }); },
  poison: function (d) { burst(d.x, d.y, 'smoke', '#7ac04a', 3, { z: 0.2, vz: 1.2, life: 0.7, grav: -0.6, size: 4 }); },
  water: function (d) { burst(d.x, d.y, 'drop', '#8fd0f0', 9, { z: 0.2, vz: 3, life: 0.6, size: 2.4 }); },
  feather: function (d) { burst(d.x, d.y, 'leaf', '#e8dcb0', 2, { z: 1.4, vz: 0.4, grav: 1.1, life: 1.6, size: 3 }); }
};
function onFx(d) {
  if (!d) return;
  const f = FX[d.kind];
  if (f) { try { f(d); } catch (e) { /* efecto desconocido: se ignora */ } }
}
function updateParts(dt) {
  for (let i = parts.length - 1; i >= 0; i--) {
    const p = parts[i];
    p.life -= dt;
    if (p.life <= 0) { parts.splice(i, 1); partPool.release(p); continue; }
    if (p.kind !== 'slash' && p.kind !== 'ring' && p.kind !== 'tele') {
      p.x += p.vx * dt; p.y += p.vy * dt;
      p.z += p.vz * dt; p.vz -= p.grav * dt;
      if (p.z < 0) { p.z = 0; p.vz *= -0.32; p.vx *= 0.6; p.vy *= 0.6; }
      p.rot += p.vr * dt;
    }
  }
  for (let i = floats.length - 1; i >= 0; i--) {
    const f = floats[i];
    f.t += dt;
    if (f.t >= f.max) { floats.splice(i, 1); floatPool.release(f); }
  }
}
function drawParts(g) {
  for (let i = 0; i < parts.length; i++) {
    const p = parts[i];
    const a = U.clamp(p.life / p.max, 0, 1);
    const sx = w2sx(p.x, p.y), sy = w2sy(p.x, p.y) - p.z * 18 * R.zoom;
    if (sx < -60 || sy < -80 || sx > R.vw + 60 || sy > R.vh + 80) continue;
    const s = p.size * R.zoom;
    g.globalAlpha = a;
    if (p.kind === 'chip') {
      g.save(); g.translate(sx, sy); g.rotate(p.rot);
      g.fillStyle = p.col; g.fillRect(-s / 2, -s / 2, s, s * 0.75);
      g.restore();
    } else if (p.kind === 'leaf') {
      g.save(); g.translate(sx, sy); g.rotate(p.rot);
      ellipse(g, 0, 0, s, s * 0.5, p.col); g.restore();
    } else if (p.kind === 'smoke') {
      g.globalAlpha = a * 0.45;
      ellipse(g, sx, sy, s * (2 - a), s * (1.6 - a * 0.6), p.col);
    } else if (p.kind === 'spark' || p.kind === 'drop') {
      ellipse(g, sx, sy, s * 0.6, s * 0.6, p.col);
      g.globalAlpha = a * 0.35; ellipse(g, sx, sy, s * 1.6, s * 1.6, p.col);
    } else if (p.kind === 'star') {
      g.save(); g.translate(sx, sy); g.rotate(p.rot);
      g.fillStyle = p.col; g.beginPath();
      for (let k = 0; k < 8; k++) {
        const rr = k % 2 ? s * 0.4 : s * 1.3, ang = k / 8 * U.TAU;
        g.lineTo(cos(ang) * rr, sin(ang) * rr);
      }
      g.closePath(); g.fill(); g.restore();
    } else if (p.kind === 'heart') {
      g.save(); g.translate(sx, sy); g.scale(s * 0.22, s * 0.22);
      g.fillStyle = p.col; g.beginPath();
      g.moveTo(0, 3); g.bezierCurveTo(-5, -2, -3, -7, 0, -4); g.bezierCurveTo(3, -7, 5, -2, 0, 3);
      g.fill(); g.restore();
    } else if (p.kind === 'flame') {
      g.globalAlpha = a * 0.85; ellipse(g, sx, sy, s * 0.7 * a, s * 1.3 * a, p.col);
      g.globalAlpha = a * 0.5; ellipse(g, sx, sy - s * 0.3, s * 0.35 * a, s * 0.7 * a, '#ffe08a');
    } else if (p.kind === 'slash') {
      const t = 1 - a;
      g.save(); g.translate(sx, sy);
      g.strokeStyle = p.col === '#ffffff' ? 'rgba(255,255,255,' + (a * 0.85) + ')' : rgba(p.col, a * 0.9);
      g.lineWidth = (p.size > 1 ? 7 : 4) * R.zoom * a; g.lineCap = 'round';
      const rr = (26 + t * 22) * R.zoom * p.size;
      g.beginPath(); g.arc(0, 0, rr, p.rot - 0.9 + t * 1.4, p.rot + 0.5 + t * 1.4); g.stroke();
      g.restore();
    } else if (p.kind === 'ring' || p.kind === 'tele') {
      const t = 1 - a;
      const rr = p.size * HW * R.zoom * (p.kind === 'tele' ? 1 : t);
      g.strokeStyle = p.kind === 'tele'
        ? 'rgba(255,90,58,' + (0.35 + 0.4 * sin(R.time * 22)) + ')'
        : rgba(p.col, a * 0.8);
      g.lineWidth = (p.kind === 'tele' ? 3 : 5 * a) * R.zoom;
      g.beginPath(); g.ellipse(sx, sy, rr, rr * 0.5, 0, 0, U.TAU); g.stroke();
      if (p.kind === 'tele') {
        g.fillStyle = 'rgba(255,90,58,0.10)'; g.fill();
        /* Anillo interior que se cierra: cuenta atrás del golpe */
        g.strokeStyle = 'rgba(255,160,130,' + (0.55 * a) + ')'; g.lineWidth = 2 * R.zoom;
        g.beginPath(); g.ellipse(sx, sy, rr * (1 - a), rr * 0.5 * (1 - a), 0, 0, U.TAU); g.stroke();
      }
    }
    g.globalAlpha = 1;
  }
}
function drawFloats(g) {
  g.textAlign = 'center'; g.textBaseline = 'middle';
  for (let i = 0; i < floats.length; i++) {
    const f = floats[i];
    const t = f.t / f.max;
    const a = t < 0.15 ? t / 0.15 : (1 - U.easeOutCubic((t - 0.15) / 0.85));
    const sx = w2sx(f.x, f.y), sy = w2sy(f.x, f.y) - (18 + t * 40) * R.zoom;
    const size = Math.max(11, 14 * R.zoom);
    g.font = '700 ' + size + 'px system-ui, sans-serif';
    g.globalAlpha = U.clamp(a, 0, 1);
    g.lineWidth = 3.5; g.strokeStyle = 'rgba(0,0,0,0.75)';
    g.strokeText(f.text, sx, sy);
    g.fillStyle = f.col; g.fillText(f.text, sx, sy);
    g.globalAlpha = 1;
  }
}

/* ==========================================================
7 · ENTIDADES · arte propio + overlays de combate
========================================================== */
function ellipseShadow(g, sx, sy, r, alpha) { ellipse(g, sx, sy, r, r * 0.45, 'rgba(0,0,0,' + (alpha || 0.28) + ')'); }

/* Fallbacks compactos: solo si CR.Art no pudiera dibujar algo. */
function fallbackPerson(g, e, sx, sy, s, walk, tint) {
  const bob = sin(walk * 2) * 1.4 * s, sw = sin(walk * 2) * 3.4 * s;
  const by = sy - 16 * s + bob, col = tint || '#b0c8e0';
  ellipseShadow(g, sx, sy, 8 * s);
  g.fillStyle = shade(col, -0.35);
  g.fillRect(sx - 4.4 * s, sy - 9 * s + sw * 0.3, 3.2 * s, 9 * s);
  g.fillRect(sx + 1.2 * s, sy - 9 * s - sw * 0.3, 3.2 * s, 9 * s);
  poly(g, [[sx - 6 * s, by + 8 * s], [sx + 6 * s, by + 8 * s], [sx + 5 * s, by - 4 * s], [sx - 5 * s, by - 4 * s]], col, shade(col, -0.4), 1);
  ellipse(g, sx, by - 9 * s, 5.2 * s, 5.4 * s, '#d8b088');
  const face = cos(e.t.ang) >= 0 ? 1 : -1;
  ellipse(g, sx + face * 2 * s, by - 9.4 * s, 1 * s, 1 * s, '#2a1a10');
}
function fallbackBeast(g, e, sx, sy, s, walk, tint) {
  const bob = sin(walk * 2) * 1.1 * s, sw = sin(walk * 2) * 3.2 * s;
  const by = sy - 11 * s + bob, face = cos(e.t.ang) >= 0 ? 1 : -1, col = tint || '#8a8a92';
  ellipseShadow(g, sx, sy, 11 * s);
  g.fillStyle = shade(col, -0.35);
  g.fillRect(sx - 7 * s, sy - 7 * s + sw * 0.4, 2.6 * s, 7 * s);
  g.fillRect(sx + 4 * s, sy - 7 * s - sw * 0.4, 2.6 * s, 7 * s);
  ellipse(g, sx, by, 11 * s, 7 * s, col);
  ellipse(g, sx - 2 * s, by - 2 * s, 8 * s, 4.4 * s, shade(col, 0.16));
  ellipse(g, sx + face * 10 * s, by - 4 * s, 5.4 * s, 4.6 * s, shade(col, 0.06));
  ellipse(g, sx + face * 12 * s, by - 4.6 * s, 1.1 * s, 1.1 * s, '#1a1008');
}

/** Insignia de "producto listo" dibujada (sin emoji). */
function readyBadge(g, x, y, z) {
  const s = 7 * z, pulse = 0.75 + 0.25 * sin(R.time * 5);
  g.save();
  g.globalAlpha = 0.35 * pulse; ellipse(g, x, y, s * 1.7, s * 1.7, '#f3cf7a');
  g.globalAlpha = 1;
  poly(g, [[x, y - s], [x + s * 0.86, y], [x, y + s], [x - s * 0.86, y]], '#f3cf7a', '#8a6a20', 1.2);
  g.fillStyle = '#3a2a10';
  g.fillRect(x - 0.9 * z, y - 3.6 * z, 1.8 * z, 4.4 * z);
  ellipse(g, x, y + 2.4 * z, 1 * z, 1 * z, '#3a2a10');
  g.restore();
}

/** Telegrafía, estados, guardia/parry, tensado, carga y vendas. */
function drawCombatOverlay(g, e, sx, sy, s) {
  const z = R.zoom;
  const headY = sy - 34 * s;
  /* Cuenta atrás del golpe enemigo */
  if (e.an.tele > 0 && e.ai && e.ai.mv) {
    const total = e.ai.mv.wind || 0.4;
    const k = U.clamp(1 - e.an.tele / total, 0, 1);
    const rr = 13 * s;
    g.strokeStyle = 'rgba(255,90,58,0.85)'; g.lineWidth = 3 * z;
    g.beginPath(); g.arc(sx, headY - 10 * z, rr, -PI / 2, -PI / 2 + k * U.TAU); g.stroke();
    g.strokeStyle = 'rgba(255,200,180,0.35)'; g.lineWidth = 1.4 * z;
    g.beginPath(); g.arc(sx, headY - 10 * z, rr, 0, U.TAU); g.stroke();
  }
  /* Estados alterados: puntos de color, sin emojis */
  const st = [];
  if (e.cb.bleedT > 0) st.push('#e04b3a');
  if (e.cb.poisonT > 0) st.push('#7ac04a');
  if (e.cb.burnT > 0) st.push('#ff8a30');
  if (e.cb.slowT > 0) st.push('#8fd0f0');
  if (e.cb.stagger > 0) st.push('#f3cf7a');
  if (st.length) {
    const bx = sx - (st.length - 1) * 3.4 * z;
    for (let i = 0; i < st.length; i++) {
      ellipse(g, bx + i * 6.8 * z, headY - 22 * z, 2.4 * z, 2.4 * z, st[i]);
      g.strokeStyle = 'rgba(0,0,0,0.5)'; g.lineWidth = 0.8;
      g.beginPath(); g.arc(bx + i * 6.8 * z, headY - 22 * z, 2.4 * z, 0, U.TAU); g.stroke();
    }
  }
  /* Sedado: tres Z dibujadas */
  if (e.tg.sedated > 0) {
    g.strokeStyle = '#bfe4f5'; g.lineWidth = 1.8 * z; g.lineCap = 'round';
    for (let i = 0; i < 3; i++) {
      const zx = sx + 10 * z + i * 6 * z, zy = headY - 14 * z - i * 6 * z, ss = (3 + i) * z;
      g.beginPath();
      g.moveTo(zx, zy); g.lineTo(zx + ss, zy); g.lineTo(zx, zy + ss); g.lineTo(zx + ss, zy + ss);
      g.stroke();
    }
  }
  if (e.type !== 'player') return;
  /* Guardia: arco frontal; los primeros instantes son parry */
  if (e.blk && e.blk.on && e.shield) {
    const arc = e.shield.arc || 1.8;
    const a0 = e.t.ang - arc * 0.5, a1 = e.t.ang + arc * 0.5;
    const rr = 20 * s;
    const parrying = e.blk.t <= (e.parryWindow || 0.2);
    g.strokeStyle = parrying ? 'rgba(243,207,122,0.95)' : 'rgba(140,200,240,0.7)';
    g.lineWidth = (parrying ? 5 : 3.4) * z;
    g.beginPath(); g.ellipse(sx, sy - 8 * s, rr, rr * 0.55, 0, a0, a1); g.stroke();
    g.strokeStyle = parrying ? 'rgba(255,240,190,0.5)' : 'rgba(190,228,245,0.28)';
    g.lineWidth = 1.4 * z;
    g.beginPath(); g.ellipse(sx, sy - 8 * s, rr * 1.14, rr * 0.62, 0, a0, a1); g.stroke();
  }
  if (e.parryFlash > 0) {
    const k = U.clamp(e.parryFlash / 0.35, 0, 1);
    g.strokeStyle = 'rgba(255,240,190,' + (0.9 * k) + ')'; g.lineWidth = 4 * z * k;
    g.beginPath(); g.ellipse(sx, sy - 8 * s, (24 + (1 - k) * 20) * s, (12 + (1 - k) * 10) * s, 0, 0, U.TAU); g.stroke();
  }
  /* Ventana de contraataque tras esquiva (Agilidad 6) */
  if (e.counterWindow > 0) {
    g.strokeStyle = 'rgba(143,224,143,' + (0.5 * U.clamp(e.counterWindow / 0.5, 0, 1)) + ')';
    g.lineWidth = 2 * z;
    g.beginPath(); g.ellipse(sx, sy, 16 * s, 8 * s, 0, 0, U.TAU); g.stroke();
  }
  /* Medidor de tensado / carga */
  let meter = 0, mcol = null, label = null;
  if (e.act && e.act.kind === 'draw') {
    meter = U.clamp(e.an.draw, 0, 1);
    mcol = meter > 0.96 ? '#f3cf7a' : '#8fd0f0';
    label = meter > 0.96 ? 'PLENO' : null;
  } else if (e.act && e.act.kind === 'charge') {
    meter = U.clamp(e.an.draw, 0, 1);
    mcol = meter >= 1 ? '#ffd76a' : '#e0a040';
    label = meter >= 1 ? 'PESADO' : null;
  }
  if (meter > 0) {
    const bw = 40 * z, bh = 5 * z, bx = sx - bw / 2, by = headY - 30 * z;
    g.fillStyle = 'rgba(0,0,0,0.6)'; g.fillRect(bx - 1, by - 1, bw + 2, bh + 2);
    g.fillStyle = mcol; g.fillRect(bx, by, bw * meter, bh);
    g.strokeStyle = 'rgba(255,255,255,0.35)'; g.lineWidth = 1;
    g.beginPath(); g.moveTo(bx + bw * 0.96, by - 2); g.lineTo(bx + bw * 0.96, by + bh + 2); g.stroke();
    if (label) {
      g.font = '800 ' + Math.max(8, 9 * z) + 'px system-ui, sans-serif';
      g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillStyle = mcol; g.fillText(label, sx, by - 8 * z);
    }
  }
  /* Aplicación de venda / ungüento */
  if (e.cast) {
    const k = U.clamp(e.cast.t / Math.max(0.1, e.cast.dur), 0, 1);
    const bw = 40 * z, bh = 5 * z, bx = sx - bw / 2, by = headY - 30 * z;
    g.fillStyle = 'rgba(0,0,0,0.6)'; g.fillRect(bx - 1, by - 1, bw + 2, bh + 2);
    g.fillStyle = '#8fe08f'; g.fillRect(bx, by, bw * k, bh);
    const def = D.ITEMS[e.cast.id];
    g.font = '700 ' + Math.max(8, 9 * z) + 'px system-ui, sans-serif';
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillStyle = '#bfe9cd';
    g.fillText(def ? def.name : 'Aplicando…', sx, by - 8 * z);
  }
}

/** Barra de tameo o de vínculo cuando estás cerca. */
function drawTameBar(g, e, sx, sy, s) {
  const p = E.player;
  if (!p || e.tg.tamed || !e.species) return;
  const sd = D.SPECIES[e.species];
  if (!sd || !sd.tame) return;
  if (U.dist2(p.t.x, p.t.y, e.t.x, e.t.y) > 16) return;
  let info = null;
  try { info = E.tameInfo(p, e); } catch (err) { return; }
  if (!info) return;
  const z = R.zoom, by = sy - 46 * s;
  const prog = e.tg.tameProgress || 0, need = info.need || 1;
  const bw = 44 * z, bh = 5 * z, bx = sx - bw / 2;
  if (sd.tame.method === 'bond') {
    const calm = U.clamp((e.ai.calm || 0) / (sd.tame.calm || 2.4), 0, 1);
    g.fillStyle = 'rgba(0,0,0,0.55)'; g.fillRect(bx - 1, by - 1, bw + 2, bh + 2);
    g.fillStyle = calm >= 1 ? '#bfe4f5' : '#7a9ac0'; g.fillRect(bx, by, bw * calm, bh);
  } else if (prog > 0 || e.tg.sedated > 0) {
    g.fillStyle = 'rgba(0,0,0,0.55)'; g.fillRect(bx - 1, by - 1, bw + 2, bh + 2);
    g.fillStyle = '#ff8ab0'; g.fillRect(bx, by, bw * U.clamp(prog / need, 0, 1), bh);
  } else return;
  g.font = '700 ' + Math.max(8, 9 * z) + 'px system-ui, sans-serif';
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillStyle = info.can ? '#f0d8e4' : '#b3a482';
  g.fillText(sd.tame.method === 'bond' ? 'vínculo' : (prog + '/' + need), sx, by - 7 * z);
}

/** Botín en el suelo: icono procedural o bolsa si son varios tipos. */
function drawLoot(g, l) {
  const z = R.zoom;
  const sx = w2sx(l.x, l.y), sy = w2sy(l.x, l.y);
  if (sx < -60 || sy < -80 || sx > R.vw + 60 || sy > R.vh + 80) return;
  if (!l.items || !l.items.length || l.life <= 0) return;
  if (l.life < 10 && sin(R.time * 14) < 0) return;
  const k = U.clamp(l.age / 0.45, 0, 1);
  const pop = k < 1 ? sin(k * PI) * 18 * z : 0;
  const bob = k >= 1 ? sin(R.time * 3 + l.uid) * 2 * z : 0;
  const gl = 0.5 + 0.5 * sin(R.time * 3 + l.uid);
  ellipseShadow(g, sx, sy, 9 * z, 0.3);
  g.globalAlpha = 0.22 + gl * 0.16;
  ellipse(g, sx, sy, 13 * z, 6.5 * z, l.bag ? '#f3cf7a' : '#cfe8ff');
  g.globalAlpha = 1;
  const cy = sy - 9 * z - pop - bob;
  let total = 0;
  for (let i = 0; i < l.items.length; i++) total += l.items[i].n;
  if (l.bag) {
    ellipse(g, sx, cy + 1 * z, 9.5 * z, 8 * z, '#8a6a44');
    ellipse(g, sx - 2.5 * z, cy - 1 * z, 4.5 * z, 4 * z, '#a8855a');
    poly(g, [[sx - 3.5 * z, cy - 6 * z], [sx + 3.5 * z, cy - 6 * z], [sx + 5 * z, cy - 10 * z], [sx - 5 * z, cy - 10 * z]], '#7a5a38', '#4a3620', 1);
    ellipse(g, sx - 4 * z, cy - 10.5 * z, 3 * z, 2.2 * z, '#8a6a44');
    ellipse(g, sx + 4 * z, cy - 10.5 * z, 3 * z, 2.2 * z, '#8a6a44');
    g.fillStyle = '#d9a441'; g.fillRect(sx - 4 * z, cy - 6.6 * z, 8 * z, 1.8 * z);
    ellipse(g, sx, cy - 3 * z, 1.6 * z, 1.6 * z, '#f3cf7a');
  } else if (Art && Art.icon) {
    const ic = Art.icon(l.items[0].id, 48), d = 26 * z;
    g.drawImage(ic, sx - d / 2, cy - d / 2, d, d);
  } else {
    ellipse(g, sx, cy, 7 * z, 7 * z, '#c8b898');
  }
  if (total > 1) {
    g.font = '700 ' + Math.max(9, 10 * z) + 'px system-ui, sans-serif';
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.lineWidth = 3; g.strokeStyle = 'rgba(0,0,0,0.8)';
    g.strokeText('×' + total, sx + 10 * z, cy + 8 * z);
    g.fillStyle = '#f3cf7a'; g.fillText('×' + total, sx + 10 * z, cy + 8 * z);
  }
}

function isFocus(e) {
  const a = E.aim, hm = E.hitMark;
  return (a.kind === 'entity' && a.ref === e) || a.lock === e ||
         (hm.ref === e && hm.id === e.id && hm.focusT > 0);
}
const _twCache = new Map();
function textW(g, font, text) {
  const k = font + '|' + text;
  let w = _twCache.get(k);
  if (w === undefined) {
    if (_twCache.size > 600) _twCache.clear();
    w = g.measureText(text).width;
    _twCache.set(k, w);
  }
  return w;
}

function drawEntity(g, e, alpha) {
  const ix = U.lerp(e.t.px, e.t.x, alpha), iy = U.lerp(e.t.py, e.t.y, alpha);
  const sx = w2sx(ix, iy), sy = w2sy(ix, iy);
  if (sx < -170 || sy < -210 || sx > R.vw + 170 || sy > R.vh + 190) return;
  const s = (e.tg.scale || 1) * R.zoom * (e.an.spawn > 0 ? U.easeOutCubic(1 - e.an.spawn / 0.35) : 1);
  if (s <= 0.02) return;
  const walk = e.an.walk, tint = e.tg.tint;
  const isPerson = e.type === 'player' || e.type === 'npc' || e.type === 'guard' || e.type === 'worker' ||
                   e.species === 'bandit' || e.species === 'skeleton';
  g.save();
  if (e.an.hurt > 0) g.globalAlpha = 0.55 + 0.45 * Math.abs(sin(e.an.hurt * 40));
  if (e.cb.iframe > 0 && e.type === 'player' && e.rollT <= 0) g.globalAlpha *= 0.65;
  if (e.type === 'player' && e.rollT > 0) {
    const rt = B_ROLLTIME();
    g.translate(sx, sy - 10 * s);
    g.rotate((1 - e.rollT / rt) * U.TAU * (cos(e.rollAng) >= 0 ? 1 : -1));
    g.translate(-sx, -(sy - 10 * s));
  }
  if (e.tg.boss) {
    const pulse = 0.5 + 0.5 * sin(R.time * 2.2);
    ellipse(g, sx, sy, 26 * s * (1 + pulse * 0.06), 13 * s, 'rgba(200,50,30,' + (0.12 + pulse * 0.08) + ')');
  }
  if (e.tg.elite && !e.tg.boss) {
    g.save(); g.globalAlpha = 0.16 + 0.06 * sin(R.time * 3 + e.id);
    ellipse(g, sx, sy, 17 * s, 8 * s, '#f3cf7a'); g.restore();
  }
  let done = false;
  if (Art) {
    done = isPerson ? Art.drawPerson(g, e, sx, sy, s, walk, R.time)
                    : Art.drawBody(g, e, sx, sy, s, walk, tint, R.time);
  }
  if (!done) {
    if (isPerson) fallbackPerson(g, e, sx, sy, s, walk, tint);
    else fallbackBeast(g, e, sx, sy, s, walk, tint);
  }
  if (e.type !== 'player' && e.an.hurt > 0.08) {
    ellipse(g, sx, sy - 15 * s, 11 * s, 17 * s, 'rgba(255,255,255,' + (0.5 * U.clamp(e.an.hurt / 0.28, 0, 1)) + ')');
  }
  g.restore();

  /* Jinete: se dibuja encima de su montura, alineado con la silla y el vuelo */
  const pl = E.player;
  if (pl && pl.mount === e && !pl.ko) {
    const flyLift = e.tg.flying ? (18 + sin(R.time * 3 + (e.id || 0)) * 3) * s : 0;
    const ry = sy - flyLift - 10 * s, rs = s * 0.92;
    g.save();
    if (pl.an.hurt > 0) g.globalAlpha = 0.6 + 0.4 * Math.abs(sin(pl.an.hurt * 40));
    let ok = false;
    if (Art) ok = Art.drawPerson(g, pl, sx, ry, rs, e.an.walk, R.time);
    if (!ok) fallbackPerson(g, pl, sx, ry, rs, e.an.walk, pl.tg.tint);
    g.restore();
    drawCombatOverlay(g, pl, sx, ry, rs);
  }

  drawCombatOverlay(g, e, sx, sy, s);
  drawTameBar(g, e, sx, sy, s);

  /* Etiquetas y barras */
  const p = E.player;
  const near = p ? U.dist2(p.t.x, p.t.y, e.t.x, e.t.y) < 110 : false;
  const foc = e.type !== 'player' && isFocus(e);
  if (e.type !== 'player' && (e.tg.boss || foc || (near && (e.type === 'npc' || e.tg.tamed || e.tg.guardian || e.st.hp < e.st.maxHp)))) {
    const label = clean(e.name);
    const by = sy - (e.tg.boss ? 54 : 36) * s;
    const lf = '600 ' + Math.max(9, 11 * R.zoom) + 'px system-ui, sans-serif';
    g.font = lf; g.textAlign = 'center'; g.textBaseline = 'middle';
    const tw = textW(g, lf, label);
    g.fillStyle = 'rgba(0,0,0,0.55)';
    g.fillRect(sx - tw / 2 - 4, by - 8, tw + 8, 14);
    g.fillStyle = e.tg.boss ? '#f2b6a8' : e.tg.guardian ? '#bfe4f5' : e.tg.tamed ? '#bfe9cd' : '#efe3c8';
    g.fillText(label, sx, by - 1);
    if (e.st.hp < e.st.maxHp || e.tg.boss || foc) {
      const bw = Math.max(foc ? 46 : 26, tw), bh = foc ? 6 : 4, pad = foc ? 1 : 0;
      const fr = U.clamp(e.st.hp / e.st.maxHp, 0, 1);
      g.fillStyle = 'rgba(0,0,0,0.65)';
      g.fillRect(sx - bw / 2 - pad, by + 7 - pad, bw + pad * 2, bh + pad * 2);
      if (foc && E.hitMark.ref === e && E.hitMark.lag > fr) {
        g.fillStyle = 'rgba(255,255,255,0.85)';
        g.fillRect(sx - bw / 2, by + 7, bw * U.clamp(E.hitMark.lag, 0, 1), bh);
      }
      g.fillStyle = e.tg.boss ? '#e04b3a' : (foc ? '#e8503c' : '#3fbf6f');
      g.fillRect(sx - bw / 2, by + 7, bw * fr, bh);
      /* Fases del jefe: un punto por fase, encendidas las ya alcanzadas */
      if (e.tg.boss) {
        const sd = D.SPECIES[e.species];
        if (sd && sd.boss && sd.boss.phases && D.ECO && D.ECO.bossPhase) {
          const ph = sd.boss.phases, n = ph.length;
          const cur = ph.indexOf(D.ECO.bossPhase(sd, fr));
          for (let i = 0; i < n; i++) {
            const px = sx - (n - 1) * 3.4 + i * 6.8;
            ellipse(g, px, by + 7 + bh + 5, 2.2, 2.2, i <= cur ? '#f3cf7a' : 'rgba(120,100,70,0.6)');
          }
        }
      }
      if (foc && !e.tg.boss) {
        g.font = '700 ' + Math.max(8, 9 * R.zoom) + 'px system-ui, sans-serif';
        g.fillStyle = '#efe3c8';
        g.fillText(Math.max(0, Math.ceil(e.st.hp)) + '/' + e.st.maxHp, sx, by + 7 + bh + 7);
      }
    }
    if (e.tg.ready) readyBadge(g, sx + tw / 2 + 11 * R.zoom, by - 1, R.zoom);
  }
}
function B_ROLLTIME() { return (D.BAL && D.BAL.ROLL_TIME) || 0.34; }
/* ==========================================================
8 · APUNTADO · retículo pegajoso, candidatos y trayectoria
========================================================== */
function B_AIMRANGE() { return (D.BAL && D.BAL.AIM_MAX_RANGE) || 11; }
function drawAim(g, alpha) {
  const a = E.aim, hm = E.hitMark, nh = E.nodeHit, z = R.zoom, t = R.time;
  const p = E.player;

  /* Marca de impacto: onda en el suelo + aspa sobre el cuerpo */
  if (hm.ref && hm.t > 0 && !hm.ref.tg.dead) {
    const e = hm.ref, k = 1 - hm.t / 0.4;
    const ix = U.lerp(e.t.px, e.t.x, alpha), iy = U.lerp(e.t.py, e.t.y, alpha);
    const sx = w2sx(ix, iy), sy = w2sy(ix, iy), es = e.tg.scale || 1, s = es * z;
    const col = hm.crit ? '255,215,106' : '255,255,255';
    g.lineCap = 'round';
    g.strokeStyle = 'rgba(' + col + ',' + (0.9 * (1 - k)) + ')';
    g.lineWidth = (hm.crit ? 4 : 3) * z * (1 - k * 0.6);
    const rr = (0.5 + k * 0.9) * HW * z * es;
    g.beginPath(); g.ellipse(sx, sy, rr, rr * 0.5, 0, 0, U.TAU); g.stroke();
    g.lineWidth = 2.8 * z;
    const cy = sy - 16 * s, o1 = (5 + k * 6) * s, o2 = (11 + k * 8) * s;
    for (let q = 0; q < 4; q++) {
      const qx = (q & 1) ? -1 : 1, qy = (q & 2) ? -1 : 1;
      g.beginPath(); g.moveTo(sx + qx * o1, cy + qy * o1); g.lineTo(sx + qx * o2, cy + qy * o2); g.stroke();
    }
  }

  /* Onda dorada al golpear un nodo */
  if (nh.node && nh.t > 0 && !nh.node.dead) {
    const k = 1 - nh.t / 0.28;
    const sx = w2sx(nh.node.x + 0.5, nh.node.y + 0.5), sy = w2sy(nh.node.x + 0.5, nh.node.y + 0.5);
    g.strokeStyle = 'rgba(243,207,122,' + (0.85 * (1 - k)) + ')';
    g.lineWidth = 3 * z * (1 - k * 0.5);
    const rr = (0.5 + k * 0.7) * HW * z;
    g.beginPath(); g.ellipse(sx, sy, rr, rr * 0.5, 0, 0, U.TAU); g.stroke();
  }

  /* Barra de golpes del nodo, con aviso de herramienta */
  const node = a.kind === 'node' ? a.ref : (nh.node && nh.focusT > 0 ? nh.node : null);
  if (node && !node.dead) {
    const nd = D.NODES[node.key];
    if (nd) {
      const sx = w2sx(node.x + 0.5, node.y + 0.5), sy = w2sy(node.x + 0.5, node.y + 0.5) - 36 * z;
      const bw = 46 * z, bh = 6 * z, hits = nd.hits;
      const showBar = node.hp < hits || nh.node === node;
      g.textAlign = 'center'; g.textBaseline = 'middle';
      let msg = nd.name, bad = false;
      if (a.kind === 'node' && a.ref === node && !a.valid) {
        bad = true;
        const ti = E.toolInfo(p);
        msg = (ti && ti.kind === nd.tool) ? 'Herramienta débil'
          : (nd.tool === 'axe' ? 'Requiere hacha' : nd.tool === 'pick' ? 'Requiere pico' : 'A mano');
      }
      const mf = '700 ' + Math.max(9, 11 * z) + 'px system-ui, sans-serif';
      g.font = mf;
      const tw = textW(g, mf, msg);
      g.fillStyle = 'rgba(0,0,0,0.6)';
      g.fillRect(sx - tw / 2 - 4, sy - bh - 15 * z, tw + 8, 13 * z);
      g.fillStyle = bad ? '#ff8a7a' : '#efe3c8';
      g.fillText(msg, sx, sy - bh - 8.5 * z);
      if (showBar && !bad) {
        g.fillStyle = 'rgba(0,0,0,0.7)'; g.fillRect(sx - bw / 2 - 1, sy - 1, bw + 2, bh + 2);
        const fr = U.clamp(node.hp / hits, 0, 1);
        g.fillStyle = nh.node === node && nh.t > 0 ? '#fff3c4' : '#d9a441';
        g.fillRect(sx - bw / 2, sy, bw * fr, bh);
        if (hits > 1 && hits <= 12) {
          g.fillStyle = 'rgba(0,0,0,0.55)';
          for (let i = 1; i < hits; i++) g.fillRect(sx - bw / 2 + bw * i / hits - 0.5, sy, 1, bh);
        }
      }
    }
  }

  /* Candidatos alternativos: puntos tenues (Tab cicla entre ellos) */
  if (a.cands && a.cands.length > 1 && p) {
    for (let i = 0; i < a.cands.length; i++) {
      const c = a.cands[i];
      if (!c || c.tg.dead || c === a.lock) continue;
      const cx2 = w2sx(c.t.x, c.t.y), cy2 = w2sy(c.t.x, c.t.y);
      if (cx2 < -20 || cy2 < -20 || cx2 > R.vw + 20 || cy2 > R.vh + 20) continue;
      g.fillStyle = 'rgba(243,207,122,0.32)';
      g.beginPath(); g.arc(cx2, cy2 - 4 * z, 2.6 * z, 0, U.TAU); g.fill();
    }
  }

  /* Trayectoria de tiro con arco o ballesta */
  if (p && p.isBow && a.mode === 'bow' && !p.ko) {
    const px = w2sx(p.t.x, p.t.y), py = w2sy(p.t.x, p.t.y) - 14 * z;
    const reach = B_AIMRANGE();
    const tx = p.t.x + cos(p.t.ang) * reach, ty = p.t.y + sin(p.t.ang) * reach;
    const ex = w2sx(tx, ty), ey = w2sy(tx, ty) - 14 * z;
    g.save();
    const tensing = a.draw > 0 || (CR.Input.bowAim && CR.Input.bowAim.active);
    if (tensing) {
      /* Tensando: línea sólida con marcas de distancia para apuntar con precisión */
      g.strokeStyle = a.draw > 0.96 ? 'rgba(243,207,122,0.95)' : 'rgba(190,228,245,0.8)';
      g.lineWidth = 2.4 * z;
      g.beginPath(); g.moveTo(px, py); g.lineTo(ex, ey); g.stroke();
      for (let m = 4; m < reach; m += 4) {
        const mx = w2sx(p.t.x + cos(p.t.ang) * m, p.t.y + sin(p.t.ang) * m), my = w2sy(p.t.x + cos(p.t.ang) * m, p.t.y + sin(p.t.ang) * m) - 14 * z;
        g.beginPath(); g.arc(mx, my, 2.4 * z, 0, U.TAU); g.fillStyle = 'rgba(255,255,255,0.85)'; g.fill();
      }
    } else {
      g.setLineDash([5 * z, 6 * z]); g.lineDashOffset = -t * 22;
      g.strokeStyle = 'rgba(190,228,245,0.32)';
      g.lineWidth = 1.6 * z;
      g.beginPath(); g.moveTo(px, py); g.lineTo(ex, ey); g.stroke();
    }
    g.restore();
    g.strokeStyle = 'rgba(243,207,122,0.4)'; g.lineWidth = 1.4 * z;
    g.beginPath(); g.ellipse(ex, ey + 14 * z, 8 * z, 4 * z, 0, 0, U.TAU); g.stroke();
  }

  if (!a.kind) return;
  let x = a.x, y = a.y;
  if (a.kind === 'entity' && a.ref) {
    x = U.lerp(a.ref.t.px, a.ref.t.x, alpha);
    y = U.lerp(a.ref.t.py, a.ref.t.y, alpha);
  }
  const sx = w2sx(x, y), sy = w2sy(x, y);
  const good = a.valid && a.inRange;
  const col = !a.valid ? '255,90,58'
    : (a.inRange ? (a.kind === 'node' ? '243,207,122' : '255,106,90') : '190,190,190');
  const pulse = good ? 0.7 + 0.3 * sin(t * 9) : 0.45;
  const rx = a.r * HW * z * 1.15, ry = rx * 0.5;
  g.fillStyle = 'rgba(' + col + ',' + (0.11 * pulse) + ')';
  g.beginPath(); g.ellipse(sx, sy, rx, ry, 0, 0, U.TAU); g.fill();
  g.strokeStyle = 'rgba(' + col + ',' + pulse + ')';
  g.lineWidth = 2.4 * z; g.lineCap = 'round';
  for (let k = 0; k < 4; k++) {
    const a0 = t * 1.8 + k * PI / 2;
    g.beginPath(); g.ellipse(sx, sy, rx, ry, 0, a0, a0 + 0.9); g.stroke();
  }
  /* Objetivo fijado: anillo interior sólido, chevrón y aviso de ciclo */
  if (a.kind === 'entity' && a.lock === a.ref) {
    g.strokeStyle = 'rgba(' + col + ',0.85)'; g.lineWidth = 1.6 * z;
    g.beginPath(); g.ellipse(sx, sy, rx * 0.62, ry * 0.62, 0, 0, U.TAU); g.stroke();
    const s = (a.ref.tg.scale || 1) * z;
    const by = sy - 34 * s - 14 * z - Math.abs(sin(t * 5)) * 4 * z;
    g.fillStyle = 'rgba(' + col + ',0.95)';
    g.strokeStyle = 'rgba(0,0,0,0.6)'; g.lineWidth = 1.5;
    g.beginPath(); g.moveTo(sx - 6 * z, by - 8 * z); g.lineTo(sx + 6 * z, by - 8 * z); g.lineTo(sx, by); g.closePath();
    g.stroke(); g.fill();
    if (a.cands && a.cands.length > 1) {
      g.font = '700 ' + Math.max(7, 8 * z) + 'px system-ui, sans-serif';
      g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillStyle = 'rgba(243,207,122,0.75)';
      g.fillText('TAB', sx, by - 14 * z);
    }
  }
}

/* ==========================================================
9 · LISTA DE DIBUJO ORDENADA POR PROFUNDIDAD
========================================================== */
const drawList = [];
const sortBuf = [];
let drawN = 0;
function push(depth, kind, a, b, c, d) {
  let o = drawList[drawN];
  if (!o) { o = { depth: 0, kind: '', a: null, b: 0, c: 0, d: null }; drawList[drawN] = o; }
  o.depth = depth; o.kind = kind; o.a = a; o.b = b; o.c = c; o.d = d;
  drawN++;
}
function cmpDepth(a, b) { return a.depth - b.depth; }
function collect(x0, y0, x1, y1) {
  drawN = 0;
  /* Muralla y puertas de Vhalor */
  const c = W.city;
  if (c) {
    for (let x = c.x; x < c.x + c.w; x++) {
      for (let k = 0; k < 2; k++) {
        const y = k === 0 ? c.y : c.y + c.h - 1;
        if (x < x0 || x > x1 || y < y0 || y > y1) continue;
        if (W.flags[y * C.WORLD + x] & W.F.DOOR) continue;
        push(x + y, 'wall', atlas.wall, x, y, null);
      }
    }
    for (let y = c.y; y < c.y + c.h; y++) {
      for (let k = 0; k < 2; k++) {
        const x = k === 0 ? c.x : c.x + c.w - 1;
        if (x < x0 || x > x1 || y < y0 || y > y1) continue;
        if (W.flags[y * C.WORLD + x] & W.F.DOOR) continue;
        push(x + y, 'wall', atlas.wall, x, y, null);
      }
    }
    for (let i = 0; i < W.gates.length; i++) {
      const gt = W.gates[i];
      if (gt.x < x0 - 3 || gt.x > x1 + 3 || gt.y < y0 - 3 || gt.y > y1 + 3) continue;
      push(gt.x + gt.y + 0.4, 'gate', gt.dir === 's' ? atlas.gate.s : atlas.gate.e, gt.x, gt.y, gt);
    }
  }
  /* Nodos: se recorre lo barato (área visible o mapa de nodos) */
  const area = (x1 - x0 + 1) * (y1 - y0 + 1);
  if (W.nodes.size > area) {
    for (let y = y0; y <= y1; y++) {
      const row = y * C.WORLD;
      for (let x = x0; x <= x1; x++) {
        const n = W.nodes.get(row + x);
        if (!n || n.dead) continue;
        const arr = atlas.nodes[n.key];
        if (!arr) continue;
        push(x + y, 'node', arr[(hash2(x, y) * 3) | 0], x, y, n);
      }
    }
  } else {
    W.nodes.forEach(function (n) {
      if (n.dead || n.x < x0 || n.x > x1 || n.y < y0 || n.y > y1) return;
      const arr = atlas.nodes[n.key];
      if (!arr) return;
      push(n.x + n.y, 'node', arr[(hash2(n.x, n.y) * 3) | 0], n.x, n.y, n);
    });
  }
  /* Suelo arado y cultivos */
  if (W.soil.size > 0) {
    if (W.soil.size * 2 > area) {
      for (let y = y0; y <= y1; y++) {
        const row = y * C.WORLD;
        for (let x = x0; x <= x1; x++) {
          const s = W.soil.get(row + x);
          if (s) push(x + y - 0.01, 'soil', s, x, y, row + x);
        }
      }
    } else {
      W.soil.forEach(function (s, idx) {
        const x = idx % C.WORLD, y = (idx / C.WORLD) | 0;
        if (x < x0 || x > x1 || y < y0 || y > y1) return;
        push(x + y - 0.01, 'soil', s, x, y, idx);
      });
    }
  }
  /* Edificios (sprite cacheado por clave y tamaño) */
  for (let i = 0; i < W.buildings.length; i++) {
    const b = W.buildings[i];
    if (b.x + b.w < x0 || b.x > x1 || b.y + b.h < y0 || b.y > y1) continue;
    let spr = b._spr;
    if (!spr || b._sprK !== b.key || b._sprW !== b.w || b._sprH !== b.h) {
      const info = b.info || W.structInfo(b.key) || { kind: 'house' };
      spr = b._spr = buildingSprite(b.key, b.w, b.h, info);
      b._sprK = b.key; b._sprW = b.w; b._sprH = b.h;
    }
    push(b.x + b.y + (b.w + b.h) * 0.5 - 0.5, 'building', spr, b.x, b.y, b);
  }
  /* Entidades: el jinete se pinta dentro de su montura */
  const pl = E.player;
  for (let i = 0; i < E.list.length; i++) {
    const e = E.list[i];
    if (e.tg.dead) continue;
    if (e === pl && pl.mount) continue;
    if (e.t.x < x0 - 2 || e.t.x > x1 + 2 || e.t.y < y0 - 2 || e.t.y > y1 + 2) continue;
    push(e.t.x + e.t.y + 0.02, 'entity', e, 0, 0, null);
  }
  /* Botín */
  for (let i = 0; i < E.loot.length; i++) {
    const l = E.loot[i];
    if (l.x < x0 - 1 || l.x > x1 + 1 || l.y < y0 - 1 || l.y > y1 + 1) continue;
    push(l.x + l.y + 0.01, 'loot', l, 0, 0, null);
  }
  /* Proyectiles */
  for (let i = 0; i < E.projectiles.length; i++) {
    const pr = E.projectiles[i];
    push(pr.x + pr.y + 0.05, 'proj', pr, 0, 0, null);
  }
  sortBuf.length = drawN;
  for (let i = 0; i < drawN; i++) sortBuf[i] = drawList[i];
  sortBuf.sort(cmpDepth);
  return sortBuf;
}

function drawSoilTile(g, s, x, y) {
  const sx = w2sx(x + 0.5, y + 0.5), sy = w2sy(x + 0.5, y + 0.5);
  const z = R.zoom;
  g.save();
  g.beginPath();
  g.moveTo(sx, sy - HH * z); g.lineTo(sx + HW * z, sy);
  g.lineTo(sx, sy + HH * z); g.lineTo(sx - HW * z, sy); g.closePath();
  g.fillStyle = s.watered ? '#4a3520' : '#6b4f30'; g.fill();
  g.strokeStyle = 'rgba(0,0,0,0.22)'; g.lineWidth = 1; g.stroke();
  g.strokeStyle = 'rgba(0,0,0,0.16)'; g.lineWidth = 1.4 * z;
  for (let i = -1; i <= 1; i++) {
    g.beginPath();
    g.moveTo(sx - HW * 0.55 * z + i * 6 * z, sy + i * 3 * z);
    g.lineTo(sx + HW * 0.55 * z + i * 6 * z, sy + i * 3 * z);
    g.stroke();
  }
  g.restore();
  if (s.crop) {
    const arr = atlas.crops[s.crop];
    if (arr) {
      const stage = s.growth >= 1 ? 2 : s.growth > 0.45 ? 1 : 0;
      const spr = arr[stage];
      const sway = sin(R.time * 1.6 + x * 0.7 + y) * 1.2 * z;
      g.drawImage(spr, sx - spr.width / 2 * z + sway, sy - (spr.height - 8) * z, spr.width * z, spr.height * z);
      if (s.growth >= 1) {
        g.globalAlpha = 0.5 + 0.3 * sin(R.time * 3 + x);
        ellipse(g, sx, sy - 28 * z, 3 * z, 3 * z, '#f3cf7a');
        g.globalAlpha = 1;
      }
    }
  }
  if (s.fert) {
    g.globalAlpha = 0.35;
    ellipse(g, sx, sy, 10 * z, 5 * z, '#7ac04a');
    g.globalAlpha = 1;
  }
}

const PROJ_COL = {
  fire: '#ff7a30', ice: '#bfe4f5', venom: '#8ae04a', wisp: '#bfe4f5',
  rock: '#8e8a80', spine: '#c88a68', knife: '#c8ccd0', arrow: '#e8dcb0', dart: '#8ae04a'
};
const EFFECT_COL = {
  burn: '#ff8a30', slow: '#bfe4f5', poison: '#8ae04a',
  bleed: '#e04b3a', sedate: '#c8a8ff', pierce: '#f3cf7a'
};
function drawProjectile(g, pr, alpha) {
  const ix = U.lerp(pr.px, pr.x, alpha), iy = U.lerp(pr.py, pr.y, alpha);
  const z = R.zoom;
  const sx = w2sx(ix, iy), sy = w2sy(ix, iy) - 13 * z;
  if (sx < -40 || sy < -40 || sx > R.vw + 40 || sy > R.vh + 40) return;
  const ang = Math.atan2(pr.vy, pr.vx);
  const iso = Math.atan2(sin(ang) * HH, cos(ang) * HW);
  const col = PROJ_COL[pr.type] || '#c8b898';
  ellipse(g, sx, sy + 13 * z, 4 * z, 2 * z, 'rgba(0,0,0,0.22)');

  if (pr.type === 'arrow' || pr.type === 'dart' || pr.type === 'spine' || pr.type === 'knife') {
    g.save(); g.translate(sx, sy); g.rotate(iso);
    /* Estela teñida por el efecto de la munición */
    const ec = EFFECT_COL[pr.effect] || '#ffffff';
    g.strokeStyle = rgba(ec, 0.28);
    g.lineWidth = 2 * z; g.lineCap = 'round';
    g.beginPath(); g.moveTo(-16 * z, 0); g.lineTo(-3 * z, 0); g.stroke();
    if (pr.type === 'arrow') {
      line(g, -8 * z, 0, 6 * z, 0, '#a07840', 1.6 * z);
      poly(g, [[6 * z, 0], [11 * z, -1.8 * z], [11 * z, 1.8 * z]], pr.effect ? col : '#d8dce0', '#7a7e82', 0.8);
      poly(g, [[-8 * z, 0], [-12 * z, -2.4 * z], [-6 * z, -0.6 * z]], '#f0e8d8');
      poly(g, [[-8 * z, 0], [-12 * z, 2.4 * z], [-6 * z, 0.6 * z]], '#d8d0c0');
    } else if (pr.type === 'dart') {
      line(g, -5 * z, 0, 4 * z, 0, '#c8ccd0', 1.6 * z);
      poly(g, [[4 * z, 0], [8 * z, -1.2 * z], [8 * z, 1.2 * z]], '#8ae04a');
      poly(g, [[-5 * z, 0], [-9 * z, -2.2 * z], [-4 * z, -0.5 * z]], '#e8dcb0');
    } else {
      poly(g, [[-6 * z, 0], [7 * z, -1.6 * z], [7 * z, 1.6 * z]], col, shade(col, -0.35), 0.8);
    }
    if (pr.effect && EFFECT_COL[pr.effect]) {
      g.globalAlpha = 0.65;
      ellipse(g, 8 * z, 0, 3.2 * z, 3.2 * z, EFFECT_COL[pr.effect]);
      g.globalAlpha = 1;
    }
    g.restore();
    return;
  }
  if (pr.type === 'fire') {
    g.globalAlpha = 0.9;
    ellipse(g, sx, sy, 7 * z, 7 * z, '#ff7a30');
    ellipse(g, sx, sy, 3.6 * z, 3.6 * z, '#ffe08a');
    g.globalAlpha = 1;
  } else if (pr.type === 'ice') {
    g.save(); g.translate(sx, sy); g.rotate(R.time * 6);
    poly(g, [[0, -6 * z], [4 * z, 0], [0, 6 * z], [-4 * z, 0]], '#bfe4f5', '#7ab0d0', 1);
    poly(g, [[0, -6 * z], [1.6 * z, -1 * z], [0, 1 * z]], '#ffffff');
    g.restore();
  } else if (pr.type === 'wisp') {
    g.globalAlpha = 0.75;
    ellipse(g, sx, sy, 6 * z, 6 * z, '#bfe4f5');
    ellipse(g, sx, sy, 2.6 * z, 2.6 * z, '#ffffff');
    g.globalAlpha = 1;
  } else if (pr.type === 'venom') {
    ellipse(g, sx, sy, 5 * z, 5 * z, '#8ae04a');
    ellipse(g, sx - 1.2 * z, sy - 1.2 * z, 2 * z, 2 * z, '#c8f088');
  } else {
    ellipse(g, sx, sy, 5 * z, 4.4 * z, col);
    ellipse(g, sx - 1.4 * z, sy - 1.4 * z, 2 * z, 1.6 * z, shade(col, 0.25));
  }
}

function drawDrawables(g, list, alpha) {
  const z = R.zoom;
  for (let i = 0; i < list.length; i++) {
    const o = list[i];
    if (o.kind === 'entity') { drawEntity(g, o.a, alpha); continue; }
    if (o.kind === 'soil') { drawSoilTile(g, o.a, o.b, o.c); continue; }
    if (o.kind === 'loot') { drawLoot(g, o.a); continue; }
    if (o.kind === 'proj') { drawProjectile(g, o.a, alpha); continue; }
    const spr = o.a;
    if (!spr) continue;
    const sx = w2sx(o.b, o.c), sy = w2sy(o.b, o.c);
    const ox = spr._ox !== undefined ? spr._ox : spr.width / 2;
    const oy = spr._oy !== undefined ? spr._oy : spr.height - 8;
    const dx = sx - ox * z, dy = sy - oy * z;
    const dw = spr.width * z, dh = spr.height * z;
    if (dx > R.vw + 40 || dy > R.vh + 40 || dx + dw < -40 || dy + dh < -40) continue;

    /* Nodo golpeado: squash + destello; dañado: temblor leve */
    if (o.kind === 'node' && o.d) {
      const def = D.NODES[o.d.key];
      const maxHp = def ? def.hits : 3;
      const nh = E.nodeHit;
      if (nh.node === o.d && nh.t > 0) {
        const k = nh.t / 0.28;
        const sq = 1 - 0.08 * k, sh = sin(R.time * 70) * 2.4 * k * z, ww = dw * (1 + 0.04 * k);
        g.drawImage(spr, dx + sh - (ww - dw) / 2, dy + dh * (1 - sq), ww, dh * sq);
        g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.4 * k;
        g.drawImage(spr, dx + sh - (ww - dw) / 2, dy + dh * (1 - sq), ww, dh * sq); g.restore();
        continue;
      }
      if (o.d.hp < maxHp) {
        g.drawImage(spr, dx + sin(R.time * 40) * 0.8, dy, dw, dh);
        continue;
      }
    }
    g.drawImage(spr, dx, dy, dw, dh);

    /* Vida propia de los edificios: fuego, agua, forja y guardianes */
    if (o.kind === 'building' && o.d) {
      const b = o.d;
      const cx = w2sx(b.x + b.w / 2, b.y + b.h / 2), cy = w2sy(b.x + b.w / 2, b.y + b.h / 2);
      const bk = b.info ? b.info.kind : '';
      if (b.key === 'campfire' || b.key === 'torch_post' || bk === 'fire') {
        const fl = 0.7 + 0.3 * sin(R.time * 9 + b.uid);
        const fy = b.key === 'torch_post' ? cy - 30 * z : cy - 10 * z;
        g.globalAlpha = 0.9;
        ellipse(g, cx, fy, 5 * z * fl, 9 * z * fl, '#ff8a30');
        ellipse(g, cx, fy - 2 * z, 2.6 * z * fl, 5 * z * fl, '#ffe08a');
        g.globalAlpha = 1;
        if (CR.streams && CR.streams.fx.chance(0.05)) {
          spawnPart(b.x + b.w / 2, b.y + b.h / 2, 'flame', '#ff9a40',
            { z: b.key === 'torch_post' ? 1.7 : 0.4, vz: 1.4, grav: -1, life: 0.5, size: 3 });
        }
      }
      if (b.key === 'fountain' || bk === 'fountain') {
        g.globalAlpha = 0.5;
        const rr = (6 + sin(R.time * 2.4) * 2) * z;
        g.strokeStyle = '#bfe4f5'; g.lineWidth = 1.4;
        g.beginPath(); g.ellipse(cx, cy - 24 * z, rr, rr * 0.5, 0, 0, U.TAU); g.stroke();
        g.globalAlpha = 1;
        if (b.key !== 'well' && CR.streams && CR.streams.fx.chance(0.05)) {
          spawnPart(b.x + b.w / 2, b.y + b.h / 2, 'drop', '#bfe4f5', { z: 1.2, vz: 1.2, grav: 5, life: 0.6, size: 1.8 });
        }
      }
      if (b.key === 'smelter' || b.key === 'forge' || bk === 'forge' || bk === 'smithy') {
        const fl = 0.75 + 0.25 * sin(R.time * 11 + b.uid);
        g.globalAlpha = 0.85;
        ellipse(g, cx - 10 * z, cy - 12 * z, 5 * z * fl, 4 * z * fl, '#ff7a30');
        ellipse(g, cx - 10 * z, cy - 12 * z, 2.4 * z * fl, 2 * z * fl, '#ffd070');
        g.globalAlpha = 1;
        if (CR.streams && CR.streams.fx.chance(0.04)) {
          spawnPart(b.x + b.w * 0.7, b.y + b.h * 0.3, 'smoke', '#a8988a',
            { z: 2.2, vz: 1.1, grav: -0.4, life: 1.2, size: 4 });
        }
      }
      if (b.key === 'golem_pylon' || b.key === 'gargoyle_perch') {
        g.globalAlpha = 0.4 + 0.2 * sin(R.time * 2 + b.uid);
        ellipse(g, cx, cy - 34 * z, 6 * z, 6 * z, b.key === 'golem_pylon' ? '#8fd0f0' : '#e04b3a');
        g.globalAlpha = 1;
      }
      if ((b.key === 'alchemy' || b.key === 'alchemy_hut') && CR.streams && CR.streams.fx.chance(0.03)) {
        spawnPart(b.x + b.w / 2, b.y + b.h / 2, 'smoke', '#8ae04a', { z: 1.4, vz: 0.8, grav: -0.3, life: 1, size: 3 });
      }
    }
  }
}

/* ==========================================================
10 · AGUA, HAZARDS, SANTUARIOS, CAMPAMENTOS Y CLIMA
========================================================== */
const _wb = [[], [], [], []];
function drawWater(g, x0, y0, x1, y1) {
  let n = 0;
  const cap = Math.round(340 * R.quality), z = R.zoom;
  for (let b = 0; b < 4; b++) _wb[b].length = 0;
  outer:
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      if (!(W.flags[y * C.WORLD + x] & W.F.WATER)) continue;
      if (++n > cap) break outer;
      const sx = w2sx(x + 0.5, y + 0.5), sy = w2sy(x + 0.5, y + 0.5);
      if (sx < -40 || sx > R.vw + 40 || sy < -30 || sy > R.vh + 30) continue;
      const sn = sin(R.time * 1.4 + (x + y) * 0.55);
      const bi = Math.min(3, Math.floor((sn + 1) * 2));
      const off = sn * 5 * z;
      _wb[bi].push(sx - 14 * z + off, sy - 2 * z, sx + 6 * z + off, sy + 3 * z);
    }
  }
  g.lineWidth = 1.6 * z;
  for (let b = 0; b < 4; b++) {
    const a = _wb[b];
    if (!a.length) continue;
    g.strokeStyle = 'rgba(200,235,255,' + (0.10 + 0.10 * ((b + 0.5) / 2 - 1)).toFixed(3) + ')';
    g.beginPath();
    for (let i = 0; i < a.length; i += 4) { g.moveTo(a[i], a[i + 1]); g.lineTo(a[i + 2], a[i + 3]); }
    g.stroke();
  }
}
function drawHazards(g) {
  for (let i = 0; i < E.hazards.length; i++) {
    const h = E.hazards[i];
    const sx = w2sx(h.x, h.y), sy = w2sy(h.x, h.y);
    const a = U.clamp(h.life / 8, 0, 1) * (0.3 + 0.12 * sin(R.time * 4 + i));
    g.fillStyle = h.type === 'poison' ? 'rgba(110,190,60,' + a + ')' : 'rgba(230,110,40,' + a + ')';
    g.beginPath(); g.ellipse(sx, sy, h.r * HW * R.zoom, h.r * HH * R.zoom, 0, 0, U.TAU); g.fill();
    g.strokeStyle = h.type === 'poison' ? 'rgba(150,230,90,0.5)' : 'rgba(255,160,70,0.5)';
    g.lineWidth = 2; g.stroke();
    if (CR.streams && CR.streams.fx.chance(0.08)) {
      spawnPart(h.x + (Math.random() - 0.5) * h.r, h.y + (Math.random() - 0.5) * h.r,
        h.type === 'poison' ? 'smoke' : 'flame', h.type === 'poison' ? '#8ac04a' : '#ff8a30',
        { z: 0.1, vz: 0.8, grav: -0.5, life: 0.7, size: 3 });
    }
  }
}
/** Santuarios: frontera y nombre cuando el ajuste está activo. */
function drawZones(g) {
  if (!CR.Settings.values.showZones) return;
  const p = E.player;
  for (let i = 0; i < W.zones.length; i++) {
    const z = W.zones[i];
    if (p && U.dist2(p.t.x, p.t.y, z.x, z.y) > (z.r + 44) * (z.r + 44)) continue;
    const zd = D.ZONE_BY_ID[z.id];
    const col = zd ? zd.tint : '#d9a441';
    const cx = w2sx(z.x, z.y), cy = w2sy(z.x, z.y);
    const rx = z.r * HW * R.zoom, ry = z.r * HH * R.zoom;
    if (cx + rx < -60 || cx - rx > R.vw + 60 || cy + ry < -60 || cy - ry > R.vh + 60) continue;
    g.save();
    g.setLineDash([10 * R.zoom, 8 * R.zoom]); g.lineDashOffset = -R.time * 10;
    g.strokeStyle = rgba(col, 0.5); g.lineWidth = 2.2 * R.zoom;
    g.beginPath(); g.ellipse(cx, cy, rx, ry, 0, 0, U.TAU); g.stroke();
    g.restore();
    g.fillStyle = rgba(col, 0.05);
    g.beginPath(); g.ellipse(cx, cy, rx, ry, 0, 0, U.TAU); g.fill();
    if (zd) {
      const lf = '700 ' + Math.max(10, 13 * R.zoom) + 'px Georgia, serif';
      g.font = lf; g.textAlign = 'center'; g.textBaseline = 'middle';
      const tw = textW(g, lf, zd.name);
      g.fillStyle = 'rgba(0,0,0,0.5)';
      g.fillRect(cx - tw / 2 - 6, cy - ry - 20 * R.zoom, tw + 12, 18 * R.zoom);
      g.fillStyle = col;
      g.fillText(zd.name, cx, cy - ry - 11 * R.zoom);
    }
  }
}
function drawCamps(g) {
  const p = E.player;
  if (!p) return;
  for (let i = 0; i < W.camps.length; i++) {
    const c = W.camps[i];
    if (U.dist2(p.t.x, p.t.y, c.x, c.y) > 900) continue;
    const cx = w2sx(c.x, c.y), cy = w2sy(c.x, c.y);
    g.save();
    g.setLineDash([6, 7]); g.lineDashOffset = R.time * 6;
    g.strokeStyle = 'rgba(224,75,58,0.28)'; g.lineWidth = 1.6 * R.zoom;
    g.beginPath(); g.ellipse(cx, cy, c.r * HW * R.zoom, c.r * HH * R.zoom, 0, 0, U.TAU); g.stroke();
    g.restore();
  }
}
const rainDrops = [];
function drawRain(g, dt) {
  const T = CR.Time;
  if (!T || T.rain <= 0.02) { rainDrops.length = 0; return; }
  const want = Math.round(150 * T.rain * R.quality);
  while (rainDrops.length < want) rainDrops.push({ x: Math.random() * R.vw, y: Math.random() * R.vh, s: 0.6 + Math.random() * 0.8 });
  while (rainDrops.length > want) rainDrops.pop();
  g.strokeStyle = 'rgba(170,205,235,0.42)'; g.lineWidth = 1.2;
  g.beginPath();
  for (let i = 0; i < rainDrops.length; i++) {
    const d = rainDrops[i];
    d.y += (760 + d.s * 420) * dt; d.x += 150 * dt;
    if (d.y > R.vh) { d.y = -12; d.x = Math.random() * R.vw; }
    if (d.x > R.vw) d.x = 0;
    g.moveTo(d.x, d.y); g.lineTo(d.x - 4 * d.s, d.y - 13 * d.s);
  }
  g.stroke();
}
function drawAmbientMotes() {
  const T = CR.Time;
  if (!T) return;
  if (T.night > 0.5 && CR.streams && CR.streams.fx.chance(0.25)) {
    const p = E.player;
    if (p) {
      spawnPart(p.t.x + (Math.random() - 0.5) * 18, p.t.y + (Math.random() - 0.5) * 18, 'spark', '#c8e07a',
        { z: 0.6 + Math.random(), vz: 0.15, grav: -0.05, life: 2.4, size: 1.6,
          vx: (Math.random() - 0.5) * 0.3, vy: (Math.random() - 0.5) * 0.3 });
    }
  }
}

/* ==========================================================
11 · ILUMINACIÓN · noche, antorchas y criaturas míticas
========================================================== */
const lights = [];
const SPECIES_LIGHT = {
  phoenix: [190, '#ff7030', 1], dragon_ember: [220, '#ff5020', 1],
  nightmare: [110, '#c05ae0', 0.7], shadow_hound: [80, '#7a5ae0', 0.5],
  warg: [62, '#ff4a3a', 0.32], hydra: [95, '#8ae04a', 0.4],
  ember_sprite: [90, '#ff9a40', 0.7], salamander: [100, '#ff6030', 0.6],
  willowisp: [110, '#bfe4f5', 0.75], unicorn: [120, '#e8e0ff', 0.6],
  kirin: [120, '#8ad8c8', 0.6], pegasus: [100, '#cfe8ff', 0.5],
  cerberus: [110, '#ff5030', 0.5], jotun_frost: [150, '#bfe4f5', 0.6],
  gargoyle: [70, '#e04b3a', 0.35], golem: [70, '#8fd0f0', 0.35],
  griffin: [70, '#f0d080', 0.3], basilisk: [80, '#96f04a', 0.35],
  troll_king: [70, '#ffd040', 0.3], fenrir: [130, '#9a6ae0', 0.55]
};
function collectLights(x0, y0, x1, y1) {
  lights.length = 0;
  const T = CR.Time;
  const n = T ? T.night : 0;
  const p = E.player;
  /* Antorcha o farol equipado: luz propia incluso de día */
  let carried = false;
  if (p) {
    const tl = p.equip ? p.equip.tool : null;
    const td = tl ? D.ITEMS[tl.id] : null;
    if (td && td.light) {
      carried = true;
      lights.push({ x: p.t.x, y: p.t.y, r: td.light, c: td.id === 'lantern' ? '#ffe0a0' : '#ffb060', i: 1 });
    } else if (n > 0.04) {
      lights.push({ x: p.t.x, y: p.t.y, r: 110, c: '#ffd9a0', i: 0.8 });
    }
  }
  if (n < 0.04 && !carried && !W.zones.length) return;
  for (let i = 0; i < W.buildings.length; i++) {
    const b = W.buildings[i];
    if (b.x + b.w < x0 || b.x > x1 || b.y + b.h < y0 || b.y > y1) continue;
    const bd = D.BUILDINGS[b.key];
    if (bd && bd.light) {
      lights.push({ x: b.x + b.w / 2, y: b.y + b.h / 2, r: bd.light,
        c: b.key === 'lantern_post' ? '#ffe0a0' : '#ffb060', i: 1 });
      continue;
    }
    const k = b.info ? b.info.kind : '';
    if (b.key === 'campfire' || k === 'fire') lights.push({ x: b.x + b.w / 2, y: b.y + b.h / 2, r: 150, c: '#ff9a40', i: 1 });
    else if (k === 'smithy' || k === 'forge') lights.push({ x: b.x + b.w / 2, y: b.y + b.h / 2, r: 130, c: '#ff7a30', i: 0.9 });
    else if (k === 'church') lights.push({ x: b.x + b.w / 2, y: b.y + b.h / 2, r: 140, c: '#ffd070', i: 0.7 });
    else if (k === 'house' || k === 'bank' || k === 'steward' || k === 'barracks') lights.push({ x: b.x + b.w / 2, y: b.y + b.h / 2, r: 100, c: '#ffcf90', i: 0.6 });
    else if (k === 'stall') lights.push({ x: b.x + b.w / 2, y: b.y + b.h / 2, r: 80, c: '#ffc070', i: 0.5 });
    else if (k === 'fountain') lights.push({ x: b.x + b.w / 2, y: b.y + b.h / 2, r: 70, c: '#bfe4f5', i: 0.35 });
    else if (b.key === 'golem_pylon') lights.push({ x: b.x + b.w / 2, y: b.y + b.h / 2, r: 90, c: '#8fd0f0', i: 0.5 });
    else if (b.key === 'gargoyle_perch') lights.push({ x: b.x + b.w / 2, y: b.y + b.h / 2, r: 70, c: '#e04b3a', i: 0.4 });
  }
  for (let i = 0; i < E.list.length; i++) {
    const e = E.list[i];
    if (e.tg.dead) continue;
    const L = SPECIES_LIGHT[e.species];
    if (L) lights.push({ x: e.t.x, y: e.t.y, r: L[0], c: L[1], i: L[2] });
  }
  for (let i = 0; i < E.projectiles.length; i++) {
    const pr = E.projectiles[i];
    if (pr.type === 'fire') lights.push({ x: pr.x, y: pr.y, r: 80, c: '#ff8a30', i: 0.9 });
    else if (pr.type === 'ice') lights.push({ x: pr.x, y: pr.y, r: 60, c: '#bfe4f5', i: 0.6 });
    else if (pr.type === 'wisp') lights.push({ x: pr.x, y: pr.y, r: 70, c: '#bfe4f5', i: 0.7 });
    else if (pr.type === 'venom') lights.push({ x: pr.x, y: pr.y, r: 55, c: '#8ae04a', i: 0.5 });
  }
  for (let i = 0; i < E.hazards.length; i++) {
    const h = E.hazards[i];
    lights.push({ x: h.x, y: h.y, r: 70, c: h.type === 'poison' ? '#8ae04a' : '#ff8a30', i: 0.6 });
  }
}
const _lsCache = Object.create(null);
function lightSprite(key, stops) {
  let c = _lsCache[key];
  if (!c) {
    c = document.createElement('canvas'); c.width = c.height = 128;
    const x = c.getContext('2d');
    const gr = x.createRadialGradient(64, 64, 0, 64, 64, 64);
    for (let i = 0; i < stops.length; i++) gr.addColorStop(stops[i][0], stops[i][1]);
    x.fillStyle = gr; x.fillRect(0, 0, 128, 128);
    _lsCache[key] = c;
  }
  return c;
}
function lightHole(i) {
  const k = Math.round(i * 20) / 20;
  return lightSprite('h' + k, [[0, 'rgba(0,0,0,' + k + ')'], [0.55, 'rgba(0,0,0,' + (k * 0.5) + ')'], [1, 'rgba(0,0,0,0)']]);
}
function lightHalo(c) { return lightSprite('o' + c, [[0, rgba(c, 0.16)], [1, rgba(c, 0)]]); }
function drawLighting(g) {
  const T = CR.Time;
  const n = T ? T.night : 0;
  if (!lightCv || !lights.length) return;
  const lw = lightCv.width, lh = lightCv.height;
  const lg = lightCtx;
  if (n >= 0.03) {
    const dusk = U.clamp((n - 0.1) / 0.45, 0, 1);
    const col = mix('#4a2410', '#0a1038', dusk);
    lg.setTransform(1, 0, 0, 1, 0, 0);
    lg.globalCompositeOperation = 'source-over';
    lg.clearRect(0, 0, lw, lh);
    lg.fillStyle = rgba(col, n * 0.66);
    lg.fillRect(0, 0, lw, lh);
    lg.globalCompositeOperation = 'destination-out';
    const sc = lw / R.vw;
    for (let i = 0; i < lights.length; i++) {
      const L = lights[i];
      const sx = w2sx(L.x, L.y) * sc, sy = w2sy(L.x, L.y) * sc;
      const rr = L.r * R.zoom * sc * (0.94 + 0.06 * sin(R.time * 6 + i));
      if (sx < -rr || sy < -rr || sx > lw + rr || sy > lh + rr) continue;
      lg.drawImage(lightHole(L.i), sx - rr, sy - rr, rr * 2, rr * 2);
    }
    lg.globalCompositeOperation = 'source-over';
    g.drawImage(lightCv, 0, 0, R.vw, R.vh);
  }
  /* Halo cálido aditivo: se ve incluso de día con antorcha o criatura mítica */
  g.globalCompositeOperation = 'lighter';
  const haloA = Math.max(0.25, n);
  for (let i = 0; i < lights.length; i++) {
    const L = lights[i];
    const sx = w2sx(L.x, L.y), sy = w2sy(L.x, L.y);
    const rr = L.r * R.zoom * 0.55;
    if (sx < -rr || sy < -rr || sx > R.vw + rr || sy > R.vh + rr) continue;
    g.globalAlpha = haloA * L.i;
    g.drawImage(lightHalo(L.c), sx - rr, sy - rr, rr * 2, rr * 2);
  }
  g.globalAlpha = 1;
  g.globalCompositeOperation = 'source-over';
}
/* ==========================================================
12 · MINIMAPA (512² con santuarios y parcelas)
========================================================== */
function buildMap() {
  if (!W.ready) return;
  if (!mapCv) {
    mapCv = document.createElement('canvas');
    mapCv.width = C.WORLD; mapCv.height = C.WORLD;
    mapCtx = mapCv.getContext('2d');
  }
  const img = mapCtx.createImageData(C.WORLD, C.WORLD);
  const d = img.data;
  const cWall = rgb('#6a5a44'), cRoad = rgb('#9a7f52'), cFloor = rgb('#b8ae96');
  const cFarm = rgb('#8a6a44'), cTilled = rgb('#6b4f30'), cParcel = rgb('#9a8a5e');
  const cWater = [], cBase = [];
  for (let b = 0; b < D.BIOMES.length; b++) {
    cWater[b] = rgb(D.BIOMES[b].water);
    cBase[b] = rgb(D.BIOMES[b].base);
  }
  const zc = [];
  for (let i = 0; i < W.zones.length; i++) {
    const zd = D.ZONE_BY_ID[W.zones[i].id];
    zc.push(zd ? rgb(zd.tint) : cBase[0]);
  }
  const N = C.WORLD * C.WORLD;
  for (let i = 0; i < N; i++) {
    const f = W.flags[i], b = W.biome[i];
    let c;
    if (f & W.F.WATER) c = cWater[b];
    else if (f & W.F.WALL) c = cWall;
    else if (f & W.F.ROAD) c = cRoad;
    else if (f & W.F.FLOOR) c = cFloor;
    else if (f & W.F.TILLED) c = cTilled;
    else if (f & W.F.FARM) c = cFarm;
    else if (f & W.F.PARCEL) c = cParcel;
    else c = cBase[b];
    const reg = W.region ? W.region[i] : 0;
    if (reg && !(f & (W.F.WATER | W.F.WALL | W.F.ROAD | W.F.FLOOR))) {
      const t = zc[reg - 1] || c;
      c = { r: (c.r * 0.78 + t.r * 0.22) | 0, g: (c.g * 0.78 + t.g * 0.22) | 0, b: (c.b * 0.78 + t.b * 0.22) | 0 };
    }
    const o = i * 4;
    d[o] = c.r; d[o + 1] = c.g; d[o + 2] = c.b; d[o + 3] = 255;
  }
  mapCtx.putImageData(img, 0, 0);
  R._mapDirty = false;
}
R.getMapCanvas = function () { if (R._mapDirty) buildMap(); return mapCv; };

function drawMinimap() {
  if (!R.mini || !W.ready) return;
  if (R._mapDirty) buildMap();
  if (!mapCv) return;
  const g = R.mctx, w = R.mini.width, h = R.mini.height;
  const p = E.player;
  const span = 96;
  const cx = p ? p.t.x : (W.city ? W.city.x + W.city.w / 2 : C.WORLD / 2);
  const cy = p ? p.t.y : (W.city ? W.city.y + W.city.h / 2 : C.WORLD / 2);
  const sx = U.clamp(cx - span / 2, 0, C.WORLD - span);
  const sy = U.clamp(cy - span / 2, 0, C.WORLD - span);
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.clearRect(0, 0, w, h);
  g.imageSmoothingEnabled = false;
  g.drawImage(mapCv, sx, sy, span, span, 0, 0, w, h);
  const k = w / span;
  const mx = function (x) { return (x - sx) * k; }, my = function (y) { return (y - sy) * k; };

  /* Santuarios */
  if (CR.Settings.values.showZones) {
    for (let i = 0; i < W.zones.length; i++) {
      const z = W.zones[i], zd = D.ZONE_BY_ID[z.id];
      const zx = mx(z.x), zy = my(z.y), zr = z.r * k;
      if (zx + zr < 0 || zx - zr > w || zy + zr < 0 || zy - zr > h) continue;
      g.strokeStyle = zd ? rgba(zd.tint, 0.8) : 'rgba(217,164,65,0.8)';
      g.lineWidth = 1.4;
      g.beginPath(); g.arc(zx, zy, zr, 0, U.TAU); g.stroke();
    }
  }
  /* Parcelas propias */
  const owned = W.ownedParcels();
  g.strokeStyle = 'rgba(217,164,65,0.9)'; g.lineWidth = 1.5;
  for (let i = 0; i < owned.length; i++) {
    const pa = owned[i];
    g.strokeRect(mx(pa.x), my(pa.y), pa.w * k, pa.h * k);
  }
  /* Granjas NPC */
  g.strokeStyle = 'rgba(122,174,78,0.55)'; g.lineWidth = 1;
  for (let i = 0; i < W.farms.length; i++) {
    const fa = W.farms[i];
    g.strokeRect(mx(fa.x), my(fa.y), fa.w * k, fa.h * k);
  }
  /* Ciudad */
  if (W.city) {
    g.strokeStyle = 'rgba(240,225,190,0.75)'; g.lineWidth = 1.5;
    g.strokeRect(mx(W.city.x), my(W.city.y), W.city.w * k, W.city.h * k);
  }
  /* Entidades */
  for (let i = 0; i < E.list.length; i++) {
    const e = E.list[i];
    if (e.tg.dead) continue;
    let col = null, r = 2;
    if (e.type === 'npc') { col = e.tg.wanderer ? '#e8a840' : '#f3cf7a'; r = 2.4; }
    else if (e.tg.boss) { col = '#e04b3a'; r = 3.4; }
    else if (e.tg.guardian) { col = '#8fd0f0'; r = 2.2; }
    else if (e.tg.tame