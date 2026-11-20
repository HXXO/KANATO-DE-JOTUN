/* ============================================================
KANATO DE JOTUN · art-items.js — Iconografía procedural v5
ARCHIVO EN 4 PARTES CONCATENABLES: 9A · 9B · 9C · 9D
9A abre el IIFE; 9D lo cierra. No insertes nada entre ellas.

CAMBIOS v5:
· ICONO ÚNICO POR OBJETO. Se acabó compartir el glifo de la
  categoría: cada material, lingote, herramienta, arma, escudo,
  armadura, comida, cura, cama, accesorio y legendario tiene
  dibujo propio.
· Los TIERS se distinguen por forma, no solo color: piedra
  lascada, cobre fundido, hierro remachado, acero pulido,
  obsidiana vítrea, mithril alado y adamantita con púas.
Espacio local: centrado en (0,0), caja 32×32 (útil [-14,14]).
Sin emojis, sin fuentes, sin imágenes externas.
============================================================ */
(function () {
'use strict';
const CR = window.CR;
if (!CR || !CR.Art) { console.error('[CR] art-items.js requiere art.js'); return; }
const A = CR.Art, H = A.util, D = CR.DATA;
const ell = H.ell, path = H.path, blob = H.blob, stroke = H.stroke, curve = H.curve,
fur = H.fur, eye = H.eye, horn = H.horn, spots = H.spots, rr = H.rr,
lgrad = H.lgrad, glow = H.glow, shade = H.shade, rgba = H.rgba, mix = H.mix;
const TAU = H.TAU, sin = Math.sin, cos = Math.cos, PI = Math.PI;

/* ---------------- Paletas de material ---------------- */
const M = {
  stone:      { b: '#9a968c', d: '#6a665e', l: '#c4c0b6' },
  copper:     { b: '#c77b3a', d: '#8a4f1e', l: '#e8a468' },
  iron:       { b: '#a8b0b8', d: '#767e86', l: '#d4dae0' },
  steel:      { b: '#7a828c', d: '#525a64', l: '#aab2bc' },
  obsidian:   { b: '#3a2e46', d: '#1c1428', l: '#6a5a80', g: '#9a7ad0' },
  mithril:    { b: '#6ac8e0', d: '#3a8aa4', l: '#b4ecf8', g: '#8fd8f0' },
  adamantite: { b: '#9a6ae0', d: '#6a3aaa', l: '#c8a8f8', g: '#b08aff' },
  cloth:      { b: '#c8b898', d: '#9a8a6a', l: '#e6dcc4' },
  leather:    { b: '#8a6a44', d: '#5e4628', l: '#b08a5c' },
  wood:       { b: '#a07840', d: '#6a4a20', l: '#c8a068' },
  gold:       { b: '#e8c040', d: '#a07820', l: '#f8e08a' }
};
function mat(k) { return M[k] || M.iron; }
function shadow(g, y, rx) {
  g.save(); g.globalAlpha = 0.22;
  ell(g, 0, y === undefined ? 12 : y, rx || 9, 2.6, '#000');
  g.restore();
}
function gem(g, x, y, r, col) {
  path(g, [[x, y - r], [x + r * 0.72, y], [x, y + r], [x - r * 0.72, y]], col, shade(col, -0.4), 0.7);
  path(g, [[x, y - r], [x + r * 0.34, y - r * 0.2], [x, y + r * 0.3], [x - r * 0.34, y - r * 0.2]], shade(col, 0.35));
}
function spark(g, x, y, r, col) {
  path(g, [[x, y - r], [x + r * 0.26, y - r * 0.26], [x + r, y], [x + r * 0.26, y + r * 0.26],
    [x, y + r], [x - r * 0.26, y + r * 0.26], [x - r, y], [x - r * 0.26, y - r * 0.26]], col);
}
function star5(g, x, y, r, col, st) {
  const pts = [];
  for (let i = 0; i < 10; i++) {
    const a = -PI / 2 + i * PI / 5, r2 = i % 2 ? r * 0.44 : r;
    pts.push([x + cos(a) * r2, y + sin(a) * r2]);
  }
  path(g, pts, col, st || shade(col, -0.35), 0.7);
}

/* ==========================================================
1 · ROCAS, TIERRAS Y COMBUSTIBLES
========================================================== */
A.item('stone', function (g) {
  shadow(g);
  path(g, [[-11, 8], [-12, 1], [-5, -4], [3, -3], [8, 3], [6, 8]], M.stone.b, M.stone.d, 1);
  path(g, [[-5, -4], [3, -3], [0, 2], [-6, 2]], M.stone.l);
  path(g, [[3, -3], [8, 3], [6, 8], [1, 4]], shade(M.stone.b, -0.18));
  path(g, [[2, -6], [7, -9], [12, -5], [10, 0], [5, -1]], shade(M.stone.b, 0.08), M.stone.d, 0.9);
  path(g, [[7, -9], [12, -5], [9, -4]], M.stone.l);
});
A.item('wood', function (g) {
  shadow(g);
  rr(g, -12, -1, 22, 9, 2.4, M.wood.b, M.wood.d, 1);
  ell(g, -12, 3.5, 2.6, 4.5, M.wood.l, M.wood.d, 0.8);
  ell(g, -12, 3.5, 1.5, 2.6, shade(M.wood.b, -0.12));
  ell(g, -12, 3.5, 0.6, 1.1, M.wood.d);
  stroke(g, [[-6, 0.5], [8, 0.5]], shade(M.wood.b, -0.16), 0.8);
  stroke(g, [[-4, 5], [9, 5]], shade(M.wood.b, -0.2), 0.7);
  rr(g, -8, -10, 20, 8, 2.2, shade(M.wood.b, 0.1), M.wood.d, 1);
  ell(g, -8, -6, 2.4, 4, M.wood.l, M.wood.d, 0.8);
  ell(g, -8, -6, 1.2, 2.2, shade(M.wood.b, -0.12));
});
A.item('coal', function (g) {
  shadow(g);
  path(g, [[-10, 8], [-11, 0], [-4, -5], [4, -3], [9, 3], [6, 8]], '#2a2a30', '#14141a', 1);
  path(g, [[-4, -5], [4, -3], [0, 1], [-6, 1]], '#44444e');
  path(g, [[2, -7], [8, -10], [12, -4], [8, 0], [3, -2]], '#33333c', '#14141a', 0.9);
  path(g, [[8, -10], [12, -4], [9, -4]], '#50505c');
  spark(g, -2, 3, 1.6, '#e07030'); spark(g, 6, 5, 1.2, '#f0a050');
});
A.item('charcoal', function (g) {
  shadow(g);
  g.save(); g.rotate(-0.2);
  rr(g, -11, -2, 15, 7, 2, '#3a3028', '#1a1410', 1);
  ell(g, -11, 1.5, 2.2, 3.5, '#4a4038', '#1a1410', 0.8);
  stroke(g, [[-8, 0], [2, 0]], '#5a4e42', 0.7);
  g.restore();
  g.save(); g.rotate(0.25);
  rr(g, -3, -9, 14, 6.4, 2, '#332a22', '#161010', 1);
  ell(g, -3, -5.8, 2, 3.2, '#463a30', '#161010', 0.8);
  stroke(g, [[0, -7], [9, -7]], '#584a3c', 0.7);
  g.restore();
  glow(g, 2, 4, 9, '#ff7a30', 0.16);
  spark(g, 7, 6, 1.6, '#ff9a40'); spark(g, -6, 7, 1.2, '#e07030');
});
A.item('flint', function (g) {
  shadow(g);
  path(g, [[-10, 7], [-6, -6], [1, -9], [6, -1], [3, 8]], '#6a6a62', '#3e3e38', 1);
  path(g, [[-6, -6], [1, -9], [-1, -1], [-6, 1]], '#8e8e84');
  path(g, [[1, -9], [6, -1], [3, 8], [1, 0]], '#55554e');
  path(g, [[4, -8], [10, -5], [9, 2], [5, -1]], '#7a7a70', '#3e3e38', 0.9);
  path(g, [[4, -8], [10, -5], [7, -4]], '#9a9a90');
  spark(g, -3, -3, 2.2, '#fff0c0'); spark(g, 7, 1, 1.4, '#ffe08a');
});
A.item('clay', function (g) {
  shadow(g);
  blob(g, 0, 3, 10, 6.4, '#a8785a', '#c89878');
  ell(g, -3, 0, 5.4, 3.4, '#b8886a');
  g.save(); g.globalAlpha = 0.4; ell(g, -4, -1, 3, 1.8, '#e0c0a8'); g.restore();
  for (let i = -1; i <= 1; i++) curve(g, -8, 3 + i * 2.6, 0, 1 + i * 2.6, 8, 3 + i * 2.6, '#8a5e42', 0.7);
  ell(g, 6, -3, 3.4, 2.6, '#b08060', '#8a5e42', 0.7);
});
A.item('sand', function (g) {
  shadow(g);
  path(g, [[-11, 9], [-8, 0], [-2, -4], [4, -3], [10, 2], [11, 9]], '#e8d8a8', '#c0a870', 1);
  path(g, [[-8, 0], [-2, -4], [4, -3], [0, 1]], '#f4e8c0');
  for (let i = 0; i < 12; i++) {
    const a = i * 2.4, r = 2 + (i % 5) * 1.6;
    ell(g, cos(a) * r, 4 + sin(a) * 2.4, 0.7, 0.6, i % 2 ? '#fff4d8' : '#d0b880');
  }
  curve(g, -9, 5, 0, 2, 9, 5, '#d0b880', 0.7);
});
A.item('sulfur', function (g) {
  shadow(g);
  glow(g, 0, 1, 12, '#e8d040', 0.2);
  path(g, [[-10, 8], [-9, -1], [-3, -6], [4, -5], [10, 1], [8, 8]], '#d8c040', '#a08818', 1);
  path(g, [[-3, -6], [4, -5], [1, 0], [-5, 0]], '#f0e070');
  gem(g, -4, 1, 3, '#f8e860'); gem(g, 4, -2, 2.6, '#f0d840'); gem(g, 3, 5, 2.2, '#e8d040');
  for (let i = 0; i < 5; i++) ell(g, -7 + i * 3.4, 7 - (i % 2), 0.9, 0.8, '#fff8a0');
});
A.item('obsidian', function (g) {
  shadow(g);
  glow(g, 0, 0, 13, '#9a7ad0', 0.18);
  path(g, [[-9, 9], [-11, -2], [-3, -10], [5, -6], [10, 3], [6, 9]], '#2a2030', '#120c1a', 1.1);
  path(g, [[-3, -10], [5, -6], [1, -1], [-5, -2]], '#4a3c58');
  path(g, [[5, -6], [10, 3], [6, 9], [2, 1]], '#1c1424');
  path(g, [[-2, -8], [3, -5], [0, -3]], '#8a7aa0');
  stroke(g, [[-6, 2], [0, 6]], '#6a5a80', 0.8);
  spark(g, 4, -7, 2, '#c8a8f8');
});
A.item('ice_shard', function (g) {
  shadow(g);
  glow(g, 0, 0, 13, '#bfe4f5', 0.3);
  path(g, [[-2, 10], [-6, -1], [-2, -11], [3, -3], [2, 10]], '#bfe4f5', '#7ab0d0', 1);
  path(g, [[-2, -11], [3, -3], [0, -1], [-3, -4]], '#ffffff');
  path(g, [[-8, 8], [-10, 2], [-7, -4], [-5, 3], [-5, 8]], '#a8d8ec', '#7ab0d0', 0.9);
  path(g, [[6, 9], [5, 2], [9, -3], [11, 4], [9, 9]], '#d0ecf8', '#7ab0d0', 0.9);
  spark(g, 1, -8, 2, '#ffffff'); spark(g, -7, -2, 1.4, '#f0faff');
});

/* ==========================================================
2 · MENAS Y LINGOTES
========================================================== */
function oreIcon(key, col, hi) {
  A.item(key, function (g) {
    shadow(g);
    path(g, [[-11, 8], [-12, 0], [-5, -5], [4, -4], [10, 2], [7, 8]], M.stone.b, M.stone.d, 1);
    path(g, [[-5, -5], [4, -4], [0, 1], [-7, 1]], M.stone.l);
    path(g, [[4, -4], [10, 2], [7, 8], [1, 3]], shade(M.stone.b, -0.2));
    glow(g, 0, -1, 11, col, 0.22);
    gem(g, -4, -2, 3.4, col); gem(g, 3, -5, 2.8, hi || shade(col, 0.2));
    gem(g, 5, 2, 2.4, col); gem(g, -2, 4, 2, hi || shade(col, 0.25));
  });
}
oreIcon('copper_ore', '#c77b3a', '#e8a468');
oreIcon('iron_ore', '#a8b0b8', '#d4dae0');
oreIcon('mithril_ore', '#6ac8e0', '#b4ecf8');
oreIcon('adamantite_ore', '#9a6ae0', '#c8a8f8');
A.item('gold_nugget', function (g) {
  shadow(g);
  glow(g, 0, 0, 12, M.gold.b, 0.2);
  path(g, [[-9, 6], [-10, -1], [-4, -7], [4, -8], [10, -2], [8, 6], [0, 9]], M.gold.b, M.gold.d, 1);
  path(g, [[-4, -7], [4, -8], [2, -2], [-5, -1]], M.gold.l);
  path(g, [[4, -8], [10, -2], [8, 6], [3, 1]], shade(M.gold.b, -0.16));
  spark(g, 5, -6, 3, '#fff8d8'); spark(g, -6, 3, 1.8, '#fff0b0');
});
function barIcon(key, k, mark) {
  A.item(key, function (g) {
    const m = mat(k);
    shadow(g);
    if (m.g) glow(g, 0, 2, 13, m.g, 0.2);
    path(g, [[-11, 9], [-8, 3], [8, 3], [11, 9]], m.d, shade(m.d, -0.3), 0.9);
    path(g, [[-8, 3], [-6, -1], [6, -1], [8, 3]], m.b, m.d, 0.9);
    path(g, [[-6, -1], [6, -1], [5, 1], [-5, 1]], m.l);
    path(g, [[-9, 1], [-6, -5], [6, -5], [9, 1]], m.b, m.d, 0.9);
    path(g, [[-6, -5], [6, -5], [5, -3], [-5, -3]], m.l);
    if (mark) mark(g, m);
    if (m.g) { g.save(); g.globalAlpha = 0.5; stroke(g, [[-5, -3], [5, -3]], m.g, 1); g.restore(); }
  });
}
barIcon('copper_bar', 'copper', function (g, m) {
  for (let i = -1; i <= 1; i++) ell(g, i * 4, -4, 1.1, 0.7, shade(m.b, 0.3));
});
barIcon('iron_bar', 'iron', function (g, m) {
  for (let i = -1; i <= 1; i += 2) ell(g, i * 5, 6, 1, 1, m.l, m.d, 0.4);
  stroke(g, [[-3, -4], [3, -4]], shade(m.d, 0.1), 0.7);
});
barIcon('steel_bar', 'steel', function (g, m) {
  stroke(g, [[-6, -4], [6, -4]], '#e8eef4', 1);
  stroke(g, [[-5, 5], [5, 5]], shade(m.l, 0.2), 0.8);
  spark(g, 6, -5, 1.6, '#f0f6ff');
});
barIcon('gold_bar', 'gold', function (g, m) {
  star5(g, 0, -3, 3, '#fff8d8', m.d);
  spark(g, -7, 5, 1.6, '#fff0b0');
});
barIcon('mithril_bar', 'mithril', function (g, m) {
  path(g, [[-9, 1], [-13, -3], [-8, -2]], m.l, m.d, 0.6);
  path(g, [[9, 1], [13, -3], [8, -2]], m.l, m.d, 0.6);
  spark(g, 0, -4, 2.4, '#e8fbff');
});
barIcon('adamantite_bar', 'adamantite', function (g, m) {
  for (let i = -1; i <= 1; i++) path(g, [[i * 4 - 1.4, -5], [i * 4, -10], [i * 4 + 1.4, -5]], m.l, m.d, 0.6);
  spark(g, 0, -8, 2, '#e0d0ff');
});
A.item('obsidian_bar', function (g) {
  shadow(g);
  glow(g, 0, 1, 12, '#9a7ad0', 0.2);
  path(g, [[-10, 8], [-7, -2], [7, -2], [10, 8]], '#1c1424', '#0e0a14', 1);
  path(g, [[-7, -2], [-5, -7], [5, -7], [7, -2]], '#2a2030', '#0e0a14', 0.9);
  path(g, [[-5, -7], [5, -7], [4, -5], [-4, -5]], '#5a4a70');
  stroke(g, [[-6, 2], [6, 2]], '#7a6a90', 0.8);
  spark(g, 4, -6, 1.8, '#c8a8f8');
});
A.item('brick', function (g) {
  shadow(g);
  for (let r = 0; r < 3; r++) {
    const off = r % 2 ? 3 : 0;
    for (let c = 0; c < 2; c++) {
      const x = -10 + c * 10 + off, y = -6 + r * 6;
      rr(g, x, y, 9, 5, 0.8, r % 2 ? '#b06848' : '#c07858', '#7a4028', 0.8);
      rr(g, x, y, 9, 1.6, 0.5, '#d08868');
    }
  }
});

/* ==========================================================
3 · FIBRAS, TEJIDOS Y CUEROS
========================================================== */
A.item('fiber', function (g) {
  shadow(g);
  for (let i = -2; i <= 2; i++) curve(g, i * 2.4, 9, i * 3.4, 0, i * 2.0, -9, i % 2 ? '#7aae4e' : '#5a9a3a', 1.6);
  rr(g, -6, -1, 12, 3.4, 1.2, '#c8a868', '#8a6a3a', 0.8);
  stroke(g, [[-5, 0.6], [5, 0.6]], '#a08848', 0.6);
});
A.item('hay', function (g) {
  shadow(g);
  for (let i = -3; i <= 3; i++) stroke(g, [[i * 2.2, 9], [i * 2.8 + (i % 2 ? 1 : -1), -8]], i % 2 ? '#e0c060' : '#c8a840', 1.5);
  path(g, [[-9, 8], [9, 8], [8, 10], [-8, 10]], '#b89838', '#8a7028', 0.7);
  rr(g, -8, -2, 16, 3.2, 1.2, '#8a6a3a', '#5a4420', 0.8);
  rr(g, -8, 3, 16, 3.2, 1.2, '#8a6a3a', '#5a4420', 0.8);
});
A.item('straw', function (g) {
  shadow(g);
  for (let i = -4; i <= 4; i++) {
    const x = i * 2.2;
    stroke(g, [[x, 9], [x + (i % 2 ? 1.6 : -1.6), -9]], i % 2 ? '#f0d878' : '#dcc058', 1.3);
    ell(g, x + (i % 2 ? 1.6 : -1.6), -9, 0.8, 1.4, '#e8cc60');
  }
  rr(g, -9, 0, 18, 3, 1.2, '#a08848', '#6a5428', 0.8);
  stroke(g, [[-8, 1.5], [8, 1.5]], '#c8a860', 0.6);
});
A.item('wool', function (g) {
  shadow(g);
  for (let i = 0; i < 8; i++) {
    const a = i / 8 * TAU;
    ell(g, cos(a) * 6.4, sin(a) * 5, 4, 3.6, i % 2 ? '#f6f2e8' : '#fffaf0', '#d8d0c0', 0.5);
  }
  ell(g, 0, 0, 6.4, 5.4, '#fffaf0', '#d8d0c0', 0.5);
  curve(g, 5, -4, 11, -8, 9, -12, '#efe9dc', 1.4);
  curve(g, -6, 4, -12, 6, -10, 11, '#efe9dc', 1.4);
});
A.item('silk', function (g) {
  shadow(g);
  glow(g, 0, 0, 12, '#e8e0ff', 0.18);
  g.save(); g.rotate(-0.3);
  rr(g, -8, -6, 16, 12, 2, '#efe8ff', '#b8a8d8', 1);
  for (let i = 0; i < 6; i++) stroke(g, [[-7, -5 + i * 2], [7, -4.4 + i * 2]], i % 2 ? '#ffffff' : '#d8ccf0', 0.7);
  ell(g, -8, 0, 2, 6, '#f8f4ff', '#b8a8d8', 0.7);
  g.restore();
  curve(g, 6, -8, 12, -4, 8, 2, '#d8ccf0', 1);
  spark(g, 5, -6, 1.8, '#ffffff');
});
A.item('thread', function (g) {
  shadow(g);
  rr(g, -5, -9, 10, 18, 1.6, '#c8a868', '#8a6a3a', 1);
  ell(g, 0, -9, 5.4, 2, '#e0c890', '#8a6a3a', 0.7);
  ell(g, 0, 9, 5.4, 2, '#b89858', '#8a6a3a', 0.7);
  for (let i = 0; i < 7; i++) stroke(g, [[-4.6, -7 + i * 2.4], [4.6, -6.4 + i * 2.4]], i % 2 ? '#f0e0b8' : '#dcc898', 0.8);
  curve(g, 4, -6, 11, -2, 7, 5, '#e8d8a8', 1);
});
A.item('cloth', function (g) {
  shadow(g);
  rr(g, -11, -6, 22, 14, 2.4, M.cloth.b, M.cloth.d, 1);
  path(g, [[-11, -6], [11, -6], [11, -2], [-11, -2]], M.cloth.l, M.cloth.d, 0.6);
  for (let i = 0; i < 5; i++) stroke(g, [[-9 + i * 4.4, -2], [-9 + i * 4.4, 8]], shade(M.cloth.b, -0.12), 0.6);
  curve(g, -11, 8, 0, 11, 11, 8, M.cloth.d, 1);
  ell(g, 8, -4, 1.6, 1.6, '#d9a441', '#8a6a20', 0.5);
});
A.item('linen', function (g) {
  shadow(g);
  rr(g, -10, -7, 20, 15, 2, '#f0ead8', '#c0b8a0', 1);
  path(g, [[-10, -7], [10, -7], [10, -3], [-10, -3]], '#fffaf0', '#c0b8a0', 0.6);
  for (let i = 0; i < 7; i++) stroke(g, [[-8.4 + i * 2.8, -3], [-8.4 + i * 2.8, 8]], '#dcd4c0', 0.5);
  for (let i = 0; i < 4; i++) stroke(g, [[-9, -1 + i * 2.6], [9, -1 + i * 2.6]], '#e4dcc8', 0.5);
  path(g, [[6, 4], [11, 6], [6, 8]], '#fffaf0', '#c0b8a0', 0.6);
});
A.item('rope', function (g) {
  shadow(g);
  g.strokeStyle = '#c8a868'; g.lineWidth = 3.4; g.lineCap = 'round';
  g.beginPath(); g.ellipse(0, 1, 8.4, 7, 0, 0, TAU); g.stroke();
  g.strokeStyle = '#a08848'; g.lineWidth = 1;
  for (let i = 0; i < 16; i++) {
    const a = i / 16 * TAU;
    stroke(g, [[cos(a) * 7, 1 + sin(a) * 5.6], [cos(a) * 9.8, 1 + sin(a) * 8.4]], '#8a6a3a', 0.8);
  }
  curve(g, 6, -5, 12, -9, 9, -12, '#c8a868', 3);
});
A.item('hide', function (g) {
  shadow(g);
  path(g, [[-11, -6], [-6, -10], [2, -9], [9, -6], [11, 2], [6, 9], [-4, 10], [-10, 4]], '#b08a5c', '#7a5a34', 1);
  fur(g, -10, -6, 8, -6, 7, 3, '#c8a068', 3);
  spots(g, 0, 0, 9, 7, 6, 'rgba(90,60,30,0.45)', 5, 1.6);
  path(g, [[-11, -6], [-13, -9], [-9, -8]], '#9a7448');
  path(g, [[9, -6], [12, -9], [11, -4]], '#9a7448');
});
A.item('leather', function (g) {
  shadow(g);
  path(g, [[-10, -8], [8, -9], [11, -2], [9, 8], [-7, 9], [-11, 1]], M.leather.b, M.leather.d, 1);
  path(g, [[-8, -6], [6, -7], [8, -2], [6, 5], [-5, 6], [-8, 0]], shade(M.leather.b, 0.12));
  g.save(); g.setLineDash([2, 2]);
  stroke(g, [[-9, -7], [7, -8], [10, -2], [8, 7], [-6, 8], [-10, 1], [-9, -7]], '#e0d0a8', 0.7);
  g.restore();
});
A.item('hard_leather', function (g) {
  shadow(g);
  path(g, [[-10, -8], [8, -9], [11, -2], [9, 8], [-7, 9], [-11, 1]], '#6a4a2a', '#3e2a16', 1.1);
  for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) {
    const x = -7 + c * 5.4, y = -6 + r * 5;
    path(g, [[x, y], [x + 4.4, y + 0.4], [x + 4, y + 4], [x - 0.4, y + 3.6]], r % 2 ? '#7a5a34' : '#8a6a44', '#3e2a16', 0.6);
    ell(g, x + 2, y + 2, 0.7, 0.7, '#c8a060');
  }
  g.save(); g.globalAlpha = 0.3; ell(g, -4, -4, 4, 2.4, '#e0c090'); g.restore();
});
A.item('bone', function (g) {
  shadow(g);
  g.save(); g.rotate(-0.5);
  rr(g, -8, -2.2, 16, 4.4, 2.2, '#efe9d8', '#b8b0a0', 0.9);
  ell(g, -8, -2.6, 2.8, 2.8, '#efe9d8', '#b8b0a0', 0.9);
  ell(g, -8, 2.6, 2.8, 2.8, '#efe9d8', '#b8b0a0', 0.9);
  ell(g, 8, -2.6, 2.8, 2.8, '#efe9d8', '#b8b0a0', 0.9);
  ell(g, 8, 2.6, 2.8, 2.8, '#efe9d8', '#b8b0a0', 0.9);
  stroke(g, [[-5, -0.6], [5, -0.6]], '#fffaf0', 1);
  g.restore();
});
A.item('feather', function (g) {
  shadow(g);
  g.save(); g.rotate(0.4);
  curve(g, 0, 11, 1, 0, 0, -11, '#d8d0c0', 1.2);
  for (let i = 0; i < 9; i++) {
    const t = i / 8, y = 9 - t * 19, w = 5.4 * sin(t * PI) + 1;
    stroke(g, [[0, y], [-w, y - 2.4]], i % 2 ? '#f4f0e4' : '#dcd4c4', 1.1);
    stroke(g, [[0, y], [w * 0.8, y - 2.4]], i % 2 ? '#dcd4c4' : '#f4f0e4', 1.1);
  }
  g.restore();
});
A.item('crab_shell', function (g) {
  shadow(g);
  blob(g, 0, 1, 11, 7.4, '#d0603c', '#ec8a5c');
  ell(g, 0, 4, 7, 2.6, '#f0c0a0');
  for (let i = -1; i <= 1; i++) curve(g, -8, i * 3 - 1, 0, i * 3 + 1.4, 8, i * 3 - 1, '#9c3f22', 0.7);
  for (let i = -1; i <= 1; i += 2) {
    ell(g, i * 11, -3, 3.4, 2.4, '#c05030', '#8a3018', 0.7);
    path(g, [[i * 12, -5], [i * 15, -6], [i * 12, -3]], '#e07a50', '#8a3018', 0.5);
  }
  eye(g, -2.6, -5.4, 1.1, '#1a0806'); eye(g, 2.6, -5.4, 1.1, '#1a0806');
});
A.item('chitin', function (g) {
  shadow(g);
  for (let i = 0; i < 4; i++) {
    const y = -8 + i * 5, w = 10 - i * 1.2;
    path(g, [[-w, y], [w, y], [w - 1.4, y + 4.4], [-w + 1.4, y + 4.4]], i % 2 ? '#8a5a34' : '#a06a3c', '#4e2c14', 0.9);
    path(g, [[-w + 1, y + 0.4], [w - 1, y + 0.4], [w - 2, y + 1.6], [-w + 2, y + 1.6]], '#c08850');
  }
  path(g, [[-3, -11], [3, -11], [2, -8], [-2, -8]], '#6a4020', '#3e2010', 0.7);
  spark(g, 6, -6, 1.4, '#e0b070');
});

/* ==========================================================
4 · HIERBAS, MIEL Y DERIVADOS
========================================================== */
function herbIcon(key, leaf, leaf2, flower, glowCol) {
  A.item(key, function (g) {
    shadow(g);
    if (glowCol) glow(g, 0, -2, 12, glowCol, 0.22);
    stroke(g, [[0, 11], [0, -8]], shade(leaf, -0.2), 1.6);
    for (let i = 0; i < 3; i++) {
      const y = 6 - i * 6, s = i % 2 ? 1 : -1;
      path(g, [[0, y], [s * 7, y - 3], [s * 8, y + 1], [0, y + 2]], i % 2 ? leaf : leaf2, shade(leaf, -0.35), 0.6);
      stroke(g, [[0, y + 1], [s * 6, y - 1]], shade(leaf, 0.25), 0.5);
    }
    ell(g, 0, -9, 2.4, 2.4, flower, shade(flower, -0.35), 0.6);
    ell(g, 0, -9, 1, 1, shade(flower, -0.5));
  });
}
herbIcon('herb', '#5aae5a', '#4a9a4a', '#f2e07a', null);
herbIcon('herb_blue', '#5a9ac8', '#4a86b0', '#bfe4f5', '#8fd0f0');
herbIcon('herb_fire', '#c86a3a', '#a8502a', '#ff9a40', '#ff7a30');
A.item('honey', function (g) {
  shadow(g);
  rr(g, -8, -4, 16, 14, 2.6, '#e8a830', '#a06818', 1);
  rr(g, -8, -4, 16, 5, 2, '#f8c860', '#a06818', 0.6);
  rr(g, -9, -8, 18, 4.4, 1.6, '#8a6a3a', '#5a4420', 0.8);
  g.save(); g.globalAlpha = 0.5; ell(g, -3, 3, 3, 4, '#fff0c0'); g.restore();
  stroke(g, [[3, -10], [3, -14]], '#c8a068', 1.4);
  ell(g, 3, -14, 2.4, 1.6, '#e8c078', '#a07828', 0.6);
  ell(g, 6, 8, 1.4, 2, '#f0b840');
});
A.item('beeswax', function (g) {
  shadow(g);
  path(g, [[-10, 7], [-8, -4], [8, -4], [10, 7]], '#e8c860', '#a88820', 1);
  path(g, [[-8, -4], [8, -4], [7, -1], [-7, -1]], '#f8e090');
  for (let r = 0; r < 2; r++) for (let c = 0; c < 3; c++) {
    const px = -6 + c * 5 + (r % 2 ? 2.5 : 0), py = 1 + r * 4;
    const pts = [];
    for (let k = 0; k < 6; k++) { const a = k / 6 * TAU; pts.push([px + cos(a) * 2.4, py + sin(a) * 2]); }
    path(g, pts, '#f0d070', '#b89830', 0.5);
  }
  ell(g, 5, -6, 2, 1.6, '#f8e8a0', '#b89830', 0.5);
});
A.item('manure', function (g) {
  shadow(g);
  blob(g, 0, 5, 10, 5, '#6a4a2a', '#8a6a44');
  blob(g, -1, 0, 7.4, 4.4, '#7a5a34', '#9a7a4e');
  blob(g, 1, -4, 4.6, 3.2, '#8a6a3e', '#a88a58');
  stroke(g, [[-8, 2], [-11, -2]], '#c8a860', 1);
  stroke(g, [[6, -2], [10, -6]], '#c8a860', 1);
  stroke(g, [[2, -7], [4, -11]], '#d8b870', 1);
});
A.item('flour', function (g) {
  shadow(g);
  path(g, [[-9, 9], [-7, -4], [7, -4], [9, 9]], '#c8b898', '#8a7a58', 1);
  ell(g, 0, -4, 7, 3, '#fffaf0', '#e0d8c0', 0.7);
  for (let i = 0; i < 6; i++) ell(g, -6 + i * 2.4, -6 - (i % 2), 1.2, 1, '#ffffff');
  rr(g, -7, -7, 14, 3, 1, '#a89878', '#7a6a4a', 0.7);
  stroke(g, [[-5, 3], [5, 3]], '#b8a888', 0.7);
});
A.item('oil', function (g) {
  shadow(g);
  path(g, [[-4, -10], [4, -10], [5, 9], [-5, 9]], '#dce8f0', '#9ab0c0', 1);
  path(g, [[-3.4, -3], [3.4, -3], [4.2, 8], [-4.2, 8]], '#e8c860');
  rr(g, -4.6, -13, 9.2, 3.4, 1.2, '#8a6a44', '#5a4420', 0.8);
  ell(g, 0, -6, 3, 1.4, '#f8e8a8');
  g.save(); g.globalAlpha = 0.5; ell(g, -2.4, 3, 1.4, 3, '#ffffff'); g.restore();
});
A.item('salt', function (g) {
  shadow(g);
  path(g, [[-8, 9], [-6, -2], [6, -2], [8, 9]], '#dce8f0', '#9ab0c0', 1);
  blob(g, 0, -5, 6.4, 3, '#ffffff', '#f0f8ff');
  for (let i = 0; i < 7; i++) {
    const x = -6 + i * 2, y = -8 - (i % 3);
    path(g, [[x, y - 1.4], [x + 1.2, y], [x, y + 1.4], [x - 1.2, y]], '#ffffff', '#b8c8d8', 0.4);
  }
  rr(g, -6, -1, 12, 2.6, 0.8, '#b8c8d8', '#8a9aa8', 0.6);
});
A.item('crystal', function (g) {
  shadow(g);
  glow(g, 0, 0, 14, '#b06ae0', 0.3);
  path(g, [[-2, 10], [-6, -2], [-2, -11], [3, -3], [2, 10]], '#9a5ae0', '#5a2a9a', 1);
  path(g, [[-2, -11], [3, -3], [0, -1], [-3, -4]], '#c8a8f8');
  path(g, [[-8, 8], [-11, 1], [-8, -5], [-5, 2], [-5, 8]], '#8a4ad0', '#5a2a9a', 0.9);
  path(g, [[6, 9], [4, 2], [8, -4], [11, 3], [9, 9]], '#a86ae8', '#5a2a9a', 0.9);
  path(g, [[8, -4], [11, 3], [8, 3]], '#d0b0ff');
  spark(g, 1, -8, 2, '#f0e0ff');
});

/* ==========================================================
5 · BOTÍN MÍTICO Y DE JEFES
========================================================== */
A.item('venom_sac', function (g) {
  shadow(g);
  glow(g, 0, 1, 11, '#8ae04a', 0.22);
  blob(g, 0, 2, 8.4, 8, '#6aa03a', '#a8d860');
  g.save(); g.globalAlpha = 0.5; ell(g, -2, 0, 4, 4.4, '#c8f088'); g.restore();
  curve(g, -2, -6, 0, -10, 3, -12, '#4a7a2a', 2.4);
  ell(g, 3, -12, 1.8, 1.4, '#8ae04a', '#4a7a2a', 0.6);
  ell(g, 4, -8, 1.2, 1.8, '#8ae04a');
  spots(g, 0, 3, 6, 5, 4, 'rgba(60,110,30,0.5)', 2, 1.2);
});
A.item('warg_fang', function (g) {
  shadow(g);
  g.save(); g.rotate(0.2);
  path(g, [[-4, -10], [4, -10], [3, 2], [0, 12], [-3, 2]], '#f2ead8', '#b8ac96', 1);
  path(g, [[-4, -10], [0, -10], [-1, 2], [-2, 6]], '#fffaf0');
  path(g, [[-5, -10], [5, -10], [4, -6], [-4, -6]], '#8a6a6a', '#5a3a3a', 0.8);
  stroke(g, [[1, -4], [0.5, 6]], '#d8ccb4', 0.7);
  g.restore();
});
A.item('ember_core', function (g) {
  shadow(g);
  glow(g, 0, 0, 15, '#ff7a30', 0.4);
  blob(g, 0, 0, 8.6, 8.6, '#c83818', '#ff9a40');
  ell(g, 0, 0, 5, 5, '#ffd070');
  ell(g, 0, 0, 2.6, 2.6, '#fff4d0');
  for (let i = 0; i < 6; i++) {
    const a = i / 6 * TAU;
    stroke(g, [[cos(a) * 5, sin(a) * 5], [cos(a) * 8.4, sin(a) * 8.4]], '#ff8a30', 1.2);
  }
  spark(g, -7, -8, 2, '#ffc060'); spark(g, 8, -6, 1.6, '#ffe0a0');
});
A.item('troll_hide', function (g) {
  shadow(g);
  path(g, [[-11, -6], [-5, -10], [3, -9], [10, -5], [11, 3], [5, 10], [-5, 10], [-10, 3]], '#6a8a5a', '#48603c', 1);
  path(g, [[-8, -5], [4, -7], [8, -1], [5, 6], [-4, 7], [-8, 1]], '#8aa876');
  spots(g, 0, 0, 9, 7, 8, 'rgba(50,70,40,0.6)', 7, 1.5);
  fur(g, -9, -6, 8, -6, 6, 2.6, '#5a7a4a', 4);
  path(g, [[-2, 4], [0, 8], [2, 4]], '#f0e8d0', '#b8ac96', 0.5);
});
A.item('hydra_scale', function (g) {
  shadow(g);
  glow(g, 0, 0, 12, '#8ae04a', 0.2);
  for (let i = 0; i < 3; i++) {
    const y = -8 + i * 6, w = 9 - i;
    path(g, [[-w, y], [0, y - 3], [w, y], [0, y + 6]], i % 2 ? '#4e8046' : '#5e9052', '#2c5228', 0.9);
    path(g, [[-w + 2, y], [0, y - 2], [w - 2, y], [0, y + 2]], '#78ac60');
  }
  ell(g, 0, 8, 2, 1.4, '#96f04a');
});
A.item('frost_core', function (g) {
  shadow(g);
  glow(g, 0, 0, 15, '#bfe4f5', 0.4);
  path(g, [[0, -10], [7, -3], [7, 4], [0, 10], [-7, 4], [-7, -3]], '#8fd0f0', '#3a8aa4', 1);
  path(g, [[0, -10], [7, -3], [0, 0], [-7, -3]], '#d8f0ff');
  ell(g, 0, 0, 3.4, 3.4, '#ffffff');
  for (let i = 0; i < 6; i++) {
    const a = i / 6 * TAU;
    stroke(g, [[cos(a) * 4, sin(a) * 4], [cos(a) * 9, sin(a) * 9]], '#e8f8ff', 1.2);
    stroke(g, [[cos(a) * 7, sin(a) * 7], [cos(a + 0.5) * 9, sin(a + 0.5) * 9]], '#bfe4f5', 0.8);
  }
});
A.item('dragon_scale', function (g) {
  shadow(g);
  glow(g, 0, 0, 13, '#ff7a30', 0.22);
  path(g, [[0, -11], [10, -4], [8, 7], [0, 11], [-8, 7], [-10, -4]], '#c8402a', '#7a1e12', 1.2);
  path(g, [[0, -11], [10, -4], [0, 0], [-10, -4]], '#f07048');
  path(g, [[0, 0], [8, 7], [0, 11], [-8, 7]], '#a03020');
  stroke(g, [[0, -8], [0, 8]], '#ffb040', 1.2);
  for (let i = -1; i <= 1; i += 2) stroke(g, [[i * 4, -4], [i * 5, 5]], '#ff9a40', 0.8);
  spark(g, 0, -6, 2, '#ffe08a');
});
A.item('unicorn_hair', function (g) {
  shadow(g);
  glow(g, 0, 0, 14, '#e8e0ff', 0.34);
  for (let i = -2; i <= 2; i++) curve(g, i * 2.6, 10, i * 4 + sin(i) * 3, 0, i * 2, -11, i % 2 ? '#ffffff' : '#d8ccf8', 1.6);
  for (let i = 0; i < 5; i++) spark(g, -8 + i * 4, -6 + (i % 2) * 8, 1.6, '#fff8ff');
  rr(g, -6, 2, 12, 3, 1.2, '#e8c040', '#a07820', 0.7);
});
A.item('kirin_horn', function (g) {
  shadow(g);
  glow(g, 0, -2, 13, '#8ad8c8', 0.3);
  g.save(); g.rotate(0.15);
  path(g, [[-3, 10], [3, 10], [2, -4], [0, -12], [-2, -4]], '#8ad8c8', '#3e8a80', 1);
  path(g, [[-3, 10], [0, 10], [-0.6, -4], [-1.4, -8]], '#c0f4e8');
  stroke(g, [[0, -4], [-6, -9]], '#bfe4f5', 1.6);
  stroke(g, [[0, -6], [6, -11]], '#bfe4f5', 1.6);
  stroke(g, [[-6, -9], [-8, -13]], '#bfe4f5', 1.1);
  stroke(g, [[6, -11], [8, -14]], '#bfe4f5', 1.1);
  g.restore();
  spark(g, 4, -8, 2, '#e8fff8');
});
A.item('manticore_spine', function (g) {
  shadow(g);
  for (let i = -1; i <= 1; i++) {
    g.save(); g.translate(i * 5, i === 0 ? -1 : 3); g.rotate(i * 0.34);
    path(g, [[-1.8, 8], [1.8, 8], [1.2, -4], [0, -12], [-1.2, -4]], '#c88a68', '#7a4028', 0.9);
    path(g, [[-1.8, 8], [0, 8], [-0.4, -4], [-0.8, -8]], '#e8b090');
    for (let k = 0; k < 3; k++) path(g, [[1.2, 2 - k * 3], [3.4, 1 - k * 3], [1.2, -0.4 - k * 3]], '#8a5030');
    g.restore();
  }
});
A.item('wyvern_membrane', function (g) {
  shadow(g);
  path(g, [[-11, 8], [-8, -8], [2, -10], [11, -2], [8, 8]], '#8a4a2c', '#4e2416', 1);
  path(g, [[-8, -8], [2, -10], [0, -2], [-6, -1]], '#b8663a');
  for (let i = 0; i < 4; i++) stroke(g, [[-7 + i * 4, -8 + i], [-5 + i * 4, 8]], '#5e2e1a', 0.9);
  path(g, [[8, 8], [11, -2], [12, 6]], '#6a3a22');
  ell(g, -4, 3, 2, 1.4, 'rgba(200,140,100,0.4)');
});
A.item('basilisk_eye', function (g) {
  shadow(g);
  glow(g, 0, 0, 14, '#96f04a', 0.34);
  ell(g, 0, 0, 9.4, 9.4, '#e8f0c0', '#5a8a4a', 1.2);
  ell(g, 0, 0, 6.4, 6.4, '#c8e04a', '#5a8a4a', 0.8);
  ell(g, 0, 0, 2.4, 6, '#1a1408');
  g.save(); g.globalAlpha = 0.5; ell(g, -3, -3, 2.4, 2, '#ffffff'); g.restore();
  for (let i = 0; i < 8; i++) {
    const a = i / 8 * TAU;
    stroke(g, [[cos(a) * 6.6, sin(a) * 6.6], [cos(a) * 9, sin(a) * 9]], '#7aa03a', 0.7);
  }
});
A.item('cerberus_fang', function (g) {
  shadow(g);
  glow(g, 0, 2, 12, '#ff5030', 0.2);
  for (let i = -1; i <= 1; i++) {
    g.save(); g.translate(i * 5.4, i === 0 ? -2 : 2); g.rotate(i * 0.26);
    path(g, [[-2.4, -8], [2.4, -8], [1.6, 2], [0, 10], [-1.6, 2]], '#f2ead8', '#b8ac96', 0.9);
    path(g, [[-2.4, -8], [0, -8], [-0.6, 2], [-1, 5]], '#fffaf0');
    ell(g, 0.4, 6, 0.9, 1.4, i === 0 ? '#ff6a30' : (i < 0 ? '#8ae04a' : '#ffd040'));
    g.restore();
  }
  path(g, [[-9, -9], [9, -9], [8, -6], [-8, -6]], '#3a2030', '#1c0e18', 0.8);
});
A.item('golem_core', function (g) {
  shadow(g);
  glow(g, 0, 0, 14, '#8fd0f0', 0.34);
  path(g, [[-8, -8], [8, -8], [9, 8], [-9, 8]], '#8a8a82', '#4a4a46', 1.2);
  path(g, [[-8, -8], [8, -8], [7, -5], [-7, -5]], '#b0b0a6');
  path(g, [[0, -5], [4.4, 0], [0, 5], [-4.4, 0]], '#8fd0f0', '#3a8aa4', 0.9);
  path(g, [[0, -5], [2, -1], [0, 1], [-2, -1]], '#e8f8ff');
  stroke(g, [[-6, 3], [-3, 6]], '#4a4a46', 0.8);
  stroke(g, [[6, -3], [3, -6]], '#4a4a46', 0.8);
});
A.item('wisp_essence', function (g) {
  shadow(g);
  glow(g, 0, 0, 15, '#bfe4f5', 0.42);
  path(g, [[-3, -9], [3, -9], [3, -4], [7, 3], [6, 9], [-7, 9], [-8, 3], [-3, -4]], '#dce8f0', '#9ab0c0', 1);
  path(g, [[-5.4, 2], [5.4, 2], [4.6, 8], [-5.6, 8]], '#bfe4f5');
  ell(g, 0, 4, 3, 3, '#ffffff');
  rr(g, -3.6, -12, 7.2, 3.4, 1.2, '#8a6a44', '#5a4420', 0.8);
  for (let i = 0; i < 4; i++) {
    const a = i / 4 * TAU;
    ell(g, cos(a) * 4, 4 + sin(a) * 3, 0.9, 0.9, '#ffffff');
  }
});
A.item('pegasus_feather', function (g) {
  shadow(g);
  glow(g, 0, 0, 14, '#cfe8ff', 0.3);
  g.save(); g.rotate(0.3);
  curve(g, 0, 12, 1, 0, 0, -12, '#cfe0f4', 1.4);
  for (let i = 0; i < 10; i++) {
    const t = i / 9, y = 10 - t * 21, w = 6.4 * sin(t * PI) + 1;
    stroke(g, [[0, y], [-w, y - 2.6]], i % 2 ? '#ffffff' : '#dceaf8', 1.2);
    stroke(g, [[0, y], [w * 0.8, y - 2.6]], i % 2 ? '#dceaf8' : '#ffffff', 1.2);
  }
  ell(g, 0, -12, 2.2, 2.8, '#ffffff');
  g.restore();
  spark(g, -8, -7, 2, '#ffffff'); spark(g, 8, 6, 1.6, '#e8f4ff');
});
A.item('jotun_ice', function (g) {
  shadow(g);
  glow(g, 0, 0, 15, '#bfe4f5', 0.36);
  path(g, [[-9, 9], [-11, -3], [-4, -11], [5, -9], [11, -1], [8, 9]], '#a8d8ec', '#5a90b0', 1.2);
  path(g, [[-4, -11], [5, -9], [1, -2], [-6, -3]], '#e8f8ff');
  path(g, [[1, -2], [11, -1], [8, 9], [2, 3]], '#8fc8e4');
  for (let i = 0; i < 3; i++) stroke(g, [[-6 + i * 5, -6], [-4 + i * 5, 7]], '#ffffff', 0.9);
  spark(g, 3, -8, 2.4, '#ffffff');
});
A.item('fenrir_pelt', function (g) {
  shadow(g);
  glow(g, 0, 0, 13, '#9a6ae0', 0.24);
  path(g, [[-11, -6], [-5, -10], [3, -9], [10, -5], [11, 3], [5, 10], [-5, 10], [-10, 3]], '#241a30', '#100a1a', 1.1);
  fur(g, -10, -6, 9, -6, 9, 3.4, '#402e56', 5);
  spots(g, 0, 1, 9, 7, 6, 'rgba(154,106,224,0.35)', 7, 1.6);
  for (let i = 0; i < 3; i++) path(g, [[-4 + i * 4, 4], [-2 + i * 4, 9], [0 + i * 4, 4]], '#5a4270');
  spark(g, -6, -4, 1.6, '#c8a8ff');
});
A.item('troll_heart', function (g) {
  shadow(g);
  glow(g, 0, 1, 14, '#8aa876', 0.3);
  g.save(); g.translate(0, 1); g.scale(1.5, 1.5);
  g.beginPath(); g.moveTo(0, 5);
  g.bezierCurveTo(-7, -1, -5, -8, 0, -4);
  g.bezierCurveTo(5, -8, 7, -1, 0, 5);
  g.fillStyle = '#8a3a3a'; g.fill(); g.strokeStyle = '#5a2020'; g.lineWidth = 0.8; g.stroke();
  g.restore();
  curve(g, -4, -4, -2, 2, -1, 6, '#6a8a5a', 1.4);
  curve(g, 4, -4, 2, 2, 1, 6, '#6a8a5a', 1.4);
  stroke(g, [[0, -7], [0, -11]], '#6a2a2a', 2);
  g.save(); g.globalAlpha = 0.45; ell(g, -3, -3, 2.4, 2, '#d08080'); g.restore();
  spots(g, 0, 1, 7, 6, 4, 'rgba(90,120,70,0.5)', 3, 1.1);
});
A.item('hydra_fang', function (g) {
  shadow(g);
  glow(g, 0, 0, 13, '#8ae04a', 0.26);
  for (let i = -1; i <= 1; i++) {
    g.save(); g.translate(i * 5, i === 0 ? -1 : 2); g.rotate(i * 0.3);
    path(g, [[-2.4, -8], [2.4, -8], [1.4, 2], [0, 10], [-1.4, 2]], '#f2ead8', '#b8ac96', 0.8);
    path(g, [[-2.4, -8], [0, -8], [-0.6, 2], [-1, 5]], '#fffaf0');
    ell(g, 0.4, 6, 0.9, 1.4, '#8ae04a');
    g.restore();
  }
  path(g, [[-8, -8], [8, -8], [7, -5], [-7, -5]], '#4a7a4a', '#2e5230', 0.8);
});
A.item('phoenix_feather', function (g) {
  shadow(g);
  glow(g, 0, 0, 15, '#ff8a30', 0.35);
  g.save(); g.rotate(0.36);
  curve(g, 0, 12, 1, 0, 0, -12, '#e07030', 1.4);
  for (let i = 0; i < 10; i++) {
    const t = i / 9, y = 10 - t * 21, w = 6 * sin(t * PI) + 1;
    stroke(g, [[0, y], [-w, y - 2.6]], i % 2 ? '#f8a050' : '#e07030', 1.2);
    stroke(g, [[0, y], [w * 0.8, y - 2.6]], i % 2 ? '#ffc040' : '#f8a050', 1.2);
  }
  ell(g, 0, -12, 2.4, 3, '#ffe08a');
  g.restore();
  spark(g, -8, -8, 2, '#ffd070'); spark(g, 8, 6, 1.6, '#ffb050');
});
A.item('dragon_heart', function (g) {
  shadow(g);
  glow(g, 0, 0, 16, '#ff5020', 0.45);
  g.save(); g.translate(0, 1); g.scale(1.6, 1.6);
  g.beginPath(); g.moveTo(0, 5);
  g.bezierCurveTo(-7, -1, -5, -8, 0, -4);
  g.bezierCurveTo(5, -8, 7, -1, 0, 5);
  g.fillStyle = '#c8301a'; g.fill(); g.strokeStyle = '#7a1608'; g.lineWidth = 0.8; g.stroke();
  g.restore();
  for (let i = 0; i < 5; i++) {
    const a = -PI / 2 + (i - 2) * 0.5;
    stroke(g, [[cos(a) * 3, sin(a) * 3], [cos(a) * 8, sin(a) * 8]], '#ffb040', 1.2);
  }
  ell(g, 0, 0, 3, 3, '#ffe08a');
  spark(g, -6, -6, 2, '#ffd070');
});
A.item('jotun_crown', function (g) {
  shadow(g);
  glow(g, 0, -2, 15, '#bfe4f5', 0.36);
  path(g, [[-11, 7], [-9, -4], [-5, 1], [0, -10], [5, 1], [9, -4], [11, 7]], '#a8d8ec', '#5a90b0', 1.2);
  path(g, [[-11, 7], [-9, -4], [-5, 1], [-6, 7]], '#e8f8ff');
  rr(g, -11, 7, 22, 3.4, 1, '#cfe6f4', '#5a90b0', 0.9);
  gem(g, 0, 3, 2.4, '#8fd0f0'); gem(g, -6, 4, 1.6, '#ffffff'); gem(g, 6, 4, 1.6, '#ffffff');
  spark(g, 0, -8, 2.2, '#ffffff');
});
A.item('fenrir_chain', function (g) {
  shadow(g);
  glow(g, 0, 0, 13, '#9a6ae0', 0.26);
  for (let i = 0; i < 5; i++) {
    const a = -0.6 + i * 0.3;
    g.save(); g.translate(-9 + i * 4.6, -6 + i * 3.4); g.rotate(a);
    ell(g, 0, 0, 4, 2.8, null, '#b0b4bc', 2.2);
    ell(g, 0, 0, 4, 2.8, null, '#e0e4ec', 0.8);
    g.restore();
  }
  stroke(g, [[6, 6], [11, 10]], '#b0b4bc', 2.2);
  stroke(g, [[8, 4], [12, 6]], '#8a8e96', 1.6);
  spark(g, 9, 8, 2.4, '#c8a8ff');
  for (let i = 0; i < 3; i++) ell(g, -6 + i * 5, -2 + i * 3, 0.9, 0.9, '#c8a8ff');
});
A.item('basilisk_crown', function (g) {
  shadow(g);
  glow(g, 0, 0, 14, '#96f04a', 0.3);
  path(g, [[-11, 6], [-9, -5], [-5, 0], [0, -9], [5, 0], [9, -5], [11, 6]], '#5a8a4a', '#2e5228', 1.2);
  rr(g, -11, 6, 22, 3.4, 1, '#78ac60', '#2e5228', 0.9);
  ell(g, 0, 2, 3.4, 3.4, '#f8e040', '#5a8a4a', 0.8);
  ell(g, 0, 2, 1.2, 3, '#1a1408');
  for (let i = -1; i <= 1; i += 2) ell(g, i * 6, 3, 1.6, 1.6, '#c8e04a', '#2e5228', 0.6);
  spark(g, 0, -7, 2, '#e8ff90');
});
/* ==========================================================
5 · HERRAMIENTAS POR TIER
Cada material tiene remate propio: piedra lascada, cobre fundido,
hierro remachado, acero pulido, obsidiana vítrea, mithril alado
y adamantita con púas.
========================================================== */
function tierMark(g, k, x, y) {
  if (k === 'stone') {
    path(g, [[x - 2.6, y + 1.4], [x, y - 2.8], [x + 2.6, y + 1.4]], M.stone.l, M.stone.d, 0.6);
    ell(g, x - 1.8, y + 2.4, 0.9, 0.7, shade(M.stone.b, -0.18));
    ell(g, x + 1.9, y + 2.6, 0.8, 0.6, shade(M.stone.b, -0.18));
  } else if (k === 'copper') {
    ell(g, x - 2.2, y, 1.0, 1.0, shade(M.copper.b, 0.22), M.copper.d, 0.4);
    ell(g, x + 2.2, y, 1.0, 1.0, shade(M.copper.b, 0.22), M.copper.d, 0.4);
  } else if (k === 'iron') {
    stroke(g, [[x - 2.5, y - 2.5], [x + 2.5, y + 2.5]], shade(M.iron.b, -0.24), 1.0);
    stroke(g, [[x + 2.5, y - 2.5], [x - 2.5, y + 2.5]], shade(M.iron.b, -0.24), 1.0);
    ell(g, x, y, 1.0, 1.0, M.iron.l);
  } else if (k === 'steel') {
    stroke(g, [[x - 3.2, y], [x + 3.2, y]], '#eef2f6', 1.1);
    spark(g, x + 3.8, y - 3.2, 1.7, '#f0f6ff');
  } else if (k === 'obsidian') {
    stroke(g, [[x - 2.2, y - 3.0], [x + 1.0, y + 1.0]], shade(M.obsidian.l, 0.32), 0.8);
    spark(g, x + 3.0, y - 3.0, 1.7, M.obsidian.g);
  } else if (k === 'mithril') {
    path(g, [[x - 4, y], [x - 8, y - 3], [x - 5, y + 1]], M.mithril.l, M.mithril.d, 0.5);
    path(g, [[x + 4, y], [x + 8, y - 3], [x + 5, y + 1]], M.mithril.l, M.mithril.d, 0.5);
    glow(g, x, y, 8, M.mithril.g, 0.3);
  } else if (k === 'adamantite') {
    for (let i = -1; i <= 1; i++) path(g, [[x + i * 3 - 1.2, y + 1], [x + i * 3, y - 4], [x + i * 3 + 1.2, y + 1]], M.adamantite.l, M.adamantite.d, 0.5);
    glow(g, x, y, 8, M.adamantite.g, 0.3);
  }
}
function toolHandle(g, x0, y0, x1, y1) {
  stroke(g, [[x0, y0], [x1, y1]], M.wood.b, 2.8);
  stroke(g, [[x0, y0], [x1, y1]], M.wood.l, 0.9);
  ell(g, x0, y0, 1.6, 1.6, M.wood.d);
  stroke(g, [[x0 + 0.6, y0 - 1.2], [x0 + 1.8, y0 - 2.4]], '#d9a441', 1.1);
}
function pickIcon(k) {
  return function (g) {
    const m = mat(k); shadow(g);
    if (m.g) glow(g, 2, -7, 11, m.g, 0.22);
    toolHandle(g, -6, 11, 3, -6);
    curve(g, -7, -6, 3, -13, 11, -4, m.b, 3.4);
    curve(g, -7, -6, 3, -12, 11, -4, m.l, 1.1);
    path(g, [[-8, -5], [-10, -7], [-7, -8]], m.d);
    path(g, [[10, -3], [13, -5], [11, -7]], m.d);
    rr(g, -0.6, -8.8, 4.6, 3.4, 1, shade(m.b, -0.14), m.d, 0.7);
    tierMark(g, k, 1, -7.4);
  };
}
function axeIcon(k) {
  return function (g) {
    const m = mat(k); shadow(g);
    if (m.g) glow(g, 5, -6, 11, m.g, 0.22);
    toolHandle(g, -6, 11, 3, -6);
    path(g, [[2, -11], [11, -10], [13, -2], [3, -4]], m.b, m.d, 1.1);
    path(g, [[2, -11], [6, -10.4], [6, -5], [3, -4]], m.l);
    path(g, [[11, -10], [13, -2], [11.4, -2.6], [9.4, -9.6]], shade(m.b, -0.2));
    rr(g, -0.6, -8.4, 4.2, 3.6, 1, shade(m.b, -0.16), m.d, 0.7);
    tierMark(g, k, 7, -7);
  };
}
function hoeIcon(k) {
  return function (g) {
    const m = mat(k); shadow(g);
    if (m.g) glow(g, 4, -6, 10, m.g, 0.2);
    toolHandle(g, -6, 11, 3, -6);
    path(g, [[2, -9], [12, -7], [11, -1], [2, -4]], m.b, m.d, 1);
    path(g, [[2, -9], [12, -7], [11.4, -5.4], [2, -7.4]], m.l);
    rr(g, -0.4, -8.2, 4.0, 3.2, 1, shade(m.b, -0.16), m.d, 0.7);
    tierMark(g, k, 6, -5);
  };
}
['stone', 'copper', 'iron', 'steel', 'obsidian', 'mithril', 'adamantite'].forEach(function (k) {
  A.item('pick_' + k, pickIcon(k));
  A.item('axe_' + k, axeIcon(k));
});
['stone', 'copper', 'iron', 'steel'].forEach(function (k) { A.item('hoe_' + k, hoeIcon(k)); });
function rodIcon(k) {
  return function (g) {
    const m = mat(k); shadow(g);
    if (m.g) glow(g, 0, -4, 12, m.g, 0.2);
    stroke(g, [[-9, 11], [8, -11]], m.b, 2);
    stroke(g, [[-9, 11], [8, -11]], m.l, 0.7);
    for (let i = 0; i < 3; i++) ell(g, -4 + i * 5, 5 - i * 6, 1.2, 1.2, m.d);
    g.strokeStyle = 'rgba(240,248,255,0.7)'; g.lineWidth = 0.7;
    g.beginPath(); g.moveTo(8, -11); g.quadraticCurveTo(12, -2, 6, 6); g.stroke();
    curve(g, 6, 6, 3, 9, 6, 10, '#c8ccd0', 1);
    ell(g, -6, 6, 2.6, 2.6, m.d, shade(m.d, -0.3), 0.6);
    ell(g, -6, 6, 1.2, 1.2, m.l);
  };
}
A.item('rod_wood', rodIcon('wood'));
A.item('rod_iron', rodIcon('iron'));
A.item('rod_mithril', rodIcon('mithril'));
A.item('watering_can', function (g) {
  shadow(g);
  rr(g, -8, -3, 13, 12, 2.4, '#7aa8c8', '#3a6888', 1);
  rr(g, -8, -3, 13, 4, 1.6, '#9ac8e0', '#3a6888', 0.6);
  curve(g, -6, -3, -2, -10, 3, -4, '#3a6888', 1.6);
  stroke(g, [[5, 0], [11, -6]], '#7aa8c8', 2.6);
  path(g, [[9, -8], [13, -6], [11, -4], [8, -6]], '#9ac8e0', '#3a6888', 0.7);
  for (let i = 0; i < 3; i++) ell(g, 12 + i * 1.2, -2 + i * 3, 0.9, 1.4, '#8fd0f0');
  g.save(); g.globalAlpha = 0.45; ell(g, -4, 3, 2.6, 3.4, '#d8f0ff'); g.restore();
});
A.item('waterskin', function (g) {
  shadow(g);
  blob(g, 0, 2, 8, 9, '#a87848', '#c89868');
  path(g, [[-3, -7], [3, -7], [2, -11], [-2, -11]], '#6a4a2a', '#3a2a16', 0.8);
  rr(g, -2.4, -13, 4.8, 2.6, 0.9, '#8a6a44', '#5a4420', 0.7);
  stroke(g, [[-5, 0], [5, 2]], '#7a5a34', 0.9);
  g.save(); g.globalAlpha = 0.4; ell(g, -3, 0, 2.4, 4, '#e8c8a0'); g.restore();
});
A.item('sickle', function (g) {
  shadow(g);
  toolHandle(g, -5, 11, 1, -2);
  curve(g, 1, -2, 10, -8, 10, 4, '#b0b8c0', 3.2);
  curve(g, 1, -2, 9, -7, 9, 3, '#dce4ea', 1.2);
  ell(g, 0, -2, 1.6, 1.6, '#5a4420');
});
A.item('hammer_build', function (g) {
  shadow(g);
  toolHandle(g, -5, 11, 2, -4);
  rr(g, -2, -10, 11, 6, 1.4, '#8a8a92', '#5a5a62', 1);
  rr(g, -2, -10, 11, 2.2, 0.9, '#aab2ba');
  ell(g, 9, -7, 1.4, 1.4, '#5a5a62');
});
A.item('repair_kit', function (g) {
  shadow(g);
  rr(g, -11, -6, 22, 14, 2, '#8a6a44', '#5a4420', 1);
  rr(g, -11, -6, 22, 4, 1.4, '#a8855a', '#5a4420', 0.6);
  ell(g, 0, -2, 1.6, 1.2, '#d9a441');
  stroke(g, [[-6, 3], [2, 3]], '#c8a060', 1.2);
  g.save(); g.translate(4, 2); g.rotate(0.5);
  rr(g, -1.4, -5, 2.8, 10, 0.8, '#a8b0b8', '#6a727a', 0.6);
  rr(g, -4, -5, 8, 3, 0.8, '#8a8a92', '#5a5a62', 0.6);
  g.restore();
});
A.item('whetstone', function (g) {
  shadow(g);
  path(g, [[-10, 4], [-8, -4], [8, -6], [10, 2], [8, 6], [-8, 7]], '#8a8a82', '#5a5a54', 1);
  path(g, [[-8, -4], [8, -6], [7, -2], [-7, -1]], '#a8a8a0');
  stroke(g, [[-6, 0], [6, -2]], '#c8c8c0', 0.9);
  spark(g, 7, -7, 2, '#fff0b0');
});
A.item('torch', function (g) {
  shadow(g);
  stroke(g, [[0, 12], [0, -3]], M.wood.b, 3);
  stroke(g, [[0, 12], [0, -3]], M.wood.l, 1);
  rr(g, -3, -6, 6, 4, 1, '#c8a868', '#8a6a3a', 0.7);
  glow(g, 0, -10, 9, '#ff8a30', 0.4);
  ell(g, 0, -9, 4, 6, '#ff7a30');
  ell(g, 0, -10, 2.2, 3.6, '#ffc040');
  ell(g, 0, -11, 1, 1.8, '#fff4d0');
});
A.item('lantern', function (g) {
  shadow(g);
  glow(g, 0, 0, 12, '#ffd070', 0.3);
  rr(g, -6, -6, 12, 14, 2, '#3a3a42', '#1e1e26', 1);
  rr(g, -4.4, -4, 8.8, 10, 1.4, '#ffd070', '#c89820', 0.6);
  ell(g, 0, 1, 2, 3.4, '#fff0c0');
  stroke(g, [[0, -6], [0, -10]], '#3a3a42', 1.6);
  curve(g, -3, -10, 0, -13, 3, -10, '#3a3a42', 1.4);
  rr(g, -7, 8, 14, 2.4, 0.8, '#3a3a42', '#1e1e26', 0.6);
});
A.item('needle', function (g) {
  shadow(g);
  g.save(); g.rotate(0.6);
  stroke(g, [[0, 10], [0, -10]], '#d4dae0', 1.6);
  ell(g, 0, -10, 1.8, 2.2, null, '#a8b0b8', 1.2);
  ell(g, 0, 10, 0.7, 1, '#a8b0b8');
  g.restore();
  curve(g, 2, -8, 8, -2, 4, 6, '#c8a868', 1);
});

/* ==========================================================
6 · ARMAS CUERPO A CUERPO
========================================================== */
function swordIcon(k) {
  return function (g) {
    const m = mat(k); shadow(g);
    if (m.g) glow(g, 0, -4, 13, m.g, 0.26);
    g.save(); g.rotate(0.32);
    path(g, [[-1.8, -3], [1.8, -3], [1.2, -12], [0, -14], [-1.2, -12]], m.b, m.d, 0.9);
    stroke(g, [[0, -4], [0, -12]], m.l, 0.9);
    rr(g, -5.4, -3.4, 10.8, 2.4, 1, m.d, shade(m.d, -0.35), 0.7);
    ell(g, -5.4, -2.2, 1.2, 1.2, m.l); ell(g, 5.4, -2.2, 1.2, 1.2, m.l);
    rr(g, -1.5, -1, 3, 8, 1.2, '#6a4a2a', '#3a2a16', 0.7);
    for (let i = 0; i < 3; i++) stroke(g, [[-1.4, 1 + i * 2], [1.4, 1.6 + i * 2]], '#8a6a44', 0.6);
    ell(g, 0, 8.4, 2, 2, m.d, shade(m.d, -0.3), 0.6);
    ell(g, 0, 8.4, 0.9, 0.9, m.g || M.gold.b);
    if (m.g) { g.save(); g.globalAlpha = 0.45; stroke(g, [[0, -4], [0, -13]], m.g, 1.8); g.restore(); }
    g.restore();
    tierMark(g, k, 7, 6);
  };
}
['stone', 'copper', 'iron', 'steel', 'obsidian', 'mithril', 'adamantite'].forEach(function (k) {
  A.item('sword_' + k, swordIcon(k));
});
function spearIcon(k, venom) {
  return function (g) {
    const m = venom ? { b: '#8ae04a', d: '#3a7a2a', l: '#c8f088', g: '#8ae04a' } : mat(k);
    shadow(g);
    if (m.g) glow(g, 3, -9, 12, m.g, 0.28);
    g.save(); g.rotate(0.36);
    stroke(g, [[0, 12], [0, -7]], M.wood.b, 2.2);
    stroke(g, [[0, 12], [0, -7]], M.wood.l, 0.7);
    for (let i = 0; i < 3; i++) stroke(g, [[-1.6, -5 + i * 1.6], [1.6, -4.4 + i * 1.6]], '#6a4a2a', 0.8);
    path(g, [[-2.6, -7], [2.6, -7], [1.6, -12], [0, -15], [-1.6, -12]], m.b, m.d, 0.9);
    path(g, [[0, -7], [2.6, -7], [1.6, -12], [0, -15]], m.l);
    if (venom) {
      path(g, [[-2.6, -9], [-5, -11], [-2.2, -11.6]], m.d);
      path(g, [[2.6, -9], [5, -11], [2.2, -11.6]], m.d);
      ell(g, 0.6, -14, 1, 1.6, '#c8f088');
      ell(g, 1.4, -10, 0.8, 1.2, '#a8e060');
    }
    g.restore();
    if (!venom) tierMark(g, k, -6, 8);
  };
}
['copper', 'iron', 'steel', 'obsidian', 'mithril'].forEach(function (k) {
  A.item('spear_' + k, spearIcon(k));
});
A.item('venom_spear', spearIcon(null, true));
function maceIcon(k) {
  return function (g) {
    const m = mat(k); shadow(g);
    if (m.g) glow(g, 3, -7, 11, m.g, 0.22);
    toolHandle(g, -5, 11, 2, -3);
    blob(g, 4, -7, 6, 6, m.b, m.l);
    for (let i = 0; i < 6; i++) {
      const a = i / 6 * TAU;
      path(g, [[4 + cos(a) * 5, -7 + sin(a) * 5], [4 + cos(a) * 8, -7 + sin(a) * 8], [4 + cos(a + 0.4) * 5, -7 + sin(a + 0.4) * 5]], m.d);
    }
    tierMark(g, k, 4, -7);
  };
}
A.item('mace_iron', maceIcon('iron'));
A.item('mace_steel', maceIcon('steel'));
A.item('warhammer_steel', function (g) {
  const m = M.steel; shadow(g);
  toolHandle(g, -5, 11, 3, -4);
  rr(g, -1, -11, 12, 7, 1.4, m.b, m.d, 1.1);
  rr(g, -1, -11, 12, 2.4, 0.9, m.l);
  path(g, [[11, -9], [14, -7.4], [11, -6]], m.d);
  path(g, [[-1, -9], [-4, -7.4], [-1, -6]], m.d);
  spark(g, 5, -12, 2, '#f0f6ff');
});
A.item('dagger_iron', function (g) {
  const m = M.iron; shadow(g);
  g.save(); g.rotate(0.4);
  path(g, [[-1.4, -2], [1.4, -2], [0.9, -10], [0, -13], [-0.9, -10]], m.b, m.d, 0.8);
  stroke(g, [[0, -3], [0, -11]], m.l, 0.8);
  rr(g, -3.6, -2.4, 7.2, 1.8, 0.7, m.d, shade(m.d, -0.3), 0.6);
  rr(g, -1.1, -0.6, 2.2, 5.4, 0.9, '#4a3620', '#2e2012', 0.6);
  ell(g, 0, 5.6, 1.4, 1.4, m.d);
  g.restore();
});

/* ==========================================================
7 · ARCOS Y BALLESTAS
========================================================== */
A.item('bow_wood', function (g) {
  shadow(g);
  curve(g, -7, -11, 9, 0, -7, 11, M.wood.b, 2.6);
  curve(g, -7, -11, 8, 0, -7, 11, M.wood.l, 0.9);
  stroke(g, [[-7, -11], [-3, 0], [-7, 11]], '#e8dcb0', 0.8);
  ell(g, -7, -11, 1.2, 1.2, M.wood.d); ell(g, -7, 11, 1.2, 1.2, M.wood.d);
});
A.item('bow_hunter', function (g) {
  shadow(g);
  curve(g, -8, -12, 10, 0, -8, 12, '#8a6a44', 2.8);
  curve(g, -8, -12, 9, 0, -8, 12, '#b08a5c', 1);
  curve(g, -5, -12, -1, -10, 1, -13, '#8a6a44', 2);
  curve(g, -5, 12, -1, 10, 1, 13, '#8a6a44', 2);
  stroke(g, [[-8, -12], [-3, 0], [-8, 12]], '#e8dcb0', 0.8);
  rr(g, -2, -2, 4, 4, 1, '#6a4a2a', '#3a2a16', 0.6);
});
A.item('bow_composite', function (g) {
  shadow(g);
  curve(g, -8, -12, 11, 0, -8, 12, '#5a4a3a', 3);
  curve(g, -8, -12, 10, 0, -8, 12, '#8a7a5a', 1);
  path(g, [[-8, -12], [-3, -8], [-6, -4]], '#a8855a', '#5a4a3a', 0.7);
  path(g, [[-8, 12], [-3, 8], [-6, 4]], '#a8855a', '#5a4a3a', 0.7);
  stroke(g, [[-8, -12], [-3, 0], [-8, 12]], '#e8dcb0', 0.8);
  rr(g, -2, -2.4, 4.4, 4.8, 1, M.iron.b, M.iron.d, 0.7);
});
A.item('bow_mithril', function (g) {
  shadow(g);
  glow(g, 0, 0, 13, M.mithril.g, 0.28);
  curve(g, -8, -12, 10, 0, -8, 12, M.mithril.b, 2.8);
  curve(g, -8, -12, 9, 0, -8, 12, M.mithril.l, 1);
  path(g, [[-6, -10], [-12, -14], [-9, -7]], M.mithril.l, M.mithril.d, 0.6);
  path(g, [[-6, 10], [-12, 14], [-9, 7]], M.mithril.l, M.mithril.d, 0.6);
  stroke(g, [[-8, -12], [-3, 0], [-8, 12]], '#f0fcff', 0.9);
  spark(g, 2, -6, 2, '#e8fbff');
});
function crossbowIcon(k) {
  return function (g) {
    const m = mat(k); shadow(g);
    if (m.g) glow(g, 0, -2, 13, m.g, 0.24);
    rr(g, -4, -2, 16, 4.4, 1.6, M.wood.b, M.wood.d, 1);
    rr(g, -4, -2, 16, 1.8, 1, M.wood.l);
    path(g, [[-6, -8], [2, 0], [-6, 8]], m.b, m.d, 2.4);
    path(g, [[-6, -8], [1, 0], [-6, 8]], m.l, null, 0.9);
    stroke(g, [[-6, -8], [6, 0], [-6, 8]], '#e8dcb0', 0.8);
    stroke(g, [[8, 0], [13, 0]], m.b, 2.2);
    path(g, [[13, 0], [10, -1.6], [10, 1.6]], m.l, m.d, 0.6);
    stroke(g, [[2, 2.4], [0, 7]], M.wood.d, 2);
    ell(g, 4, -3.4, 1.2, 1.2, m.d);
  };
}
A.item('crossbow_iron', crossbowIcon('iron'));
A.item('crossbow_steel', crossbowIcon('steel'));

/* ==========================================================
8 · MUNICIONES
========================================================== */
function arrowBase(g, shaft) {
  stroke(g, [[-8, 8], [6, -6]], shaft || M.wood.b, 1.8);
  path(g, [[-8, 8], [-11, 6], [-7, 6.4]], '#f0e8d8');
  path(g, [[-8, 8], [-6, 11], [-5.6, 7]], '#d8d0c0');
}
function arrowHead(g, col, dark) {
  path(g, [[6, -6], [11, -11], [8.4, -4.4]], col, dark, 0.7);
}
A.item('arrow_basic', function (g) { shadow(g); arrowBase(g); arrowHead(g, '#c8ccd0', '#7a7e82'); });
A.item('arrow_iron', function (g) { shadow(g); arrowBase(g); arrowHead(g, M.iron.b, M.iron.d); stroke(g, [[2, -2], [7, -7]], M.iron.l, 1); });
A.item('arrow_fire', function (g) {
  shadow(g); arrowBase(g); arrowHead(g, '#e07030', '#a04818');
  glow(g, 8, -8, 7, '#ff8a30', 0.4);
  ell(g, 8, -8, 2.6, 3.4, '#ff7a30'); ell(g, 8, -8.6, 1.4, 2.0, '#ffc040');
});
A.item('arrow_ice', function (g) {
  shadow(g); arrowBase(g);
  path(g, [[6, -6], [11, -11], [8.4, -4.4]], '#bfe4f5', '#7ab0d0', 0.7);
  spark(g, 9, -9, 3, '#e8f8ff'); spark(g, 6, -6, 1.6, '#ffffff');
});
A.item('arrow_poison', function (g) {
  shadow(g); arrowBase(g); arrowHead(g, '#7ac04a', '#4a8a2a');
  ell(g, 8, -6, 1.4, 1.8, '#8ae04a');
  glow(g, 8, -8, 6, '#8ae04a', 0.3);
});
A.item('arrow_barbed', function (g) {
  shadow(g); arrowBase(g); arrowHead(g, '#c8b898', '#8a7a5a');
  path(g, [[7, -8], [4, -9], [6, -6]], '#a89878');
  path(g, [[9, -10], [12, -9], [9.4, -7]], '#a89878');
});
A.item('arrow_tame', function (g) {
  shadow(g); arrowBase(g);
  path(g, [[6, -6], [11, -11], [8.4, -4.4]], '#c8a8f8', '#8a6ad0', 0.7);
  g.save(); g.translate(8, -8); g.scale(0.5, 0.5);
  g.beginPath(); g.moveTo(0, 5); g.bezierCurveTo(-7, -1, -5, -8, 0, -4); g.bezierCurveTo(5, -8, 7, -1, 0, 5);
  g.fillStyle = '#ff8ab0'; g.fill(); g.restore();
});
A.item('arrow_bolt', function (g) {
  shadow(g);
  stroke(g, [[-6, 6], [6, -6]], '#5a4a3a', 2.6);
  path(g, [[6, -6], [12, -12], [9, -4]], M.steel.b, M.steel.d, 0.8);
  path(g, [[-6, 6], [-9, 4], [-5, 4.4]], '#8a7a5a');
  stroke(g, [[1, -1], [5, -5]], M.steel.l, 1);
});
A.item('arrow_mythril', function (g) {
  shadow(g); glow(g, 2, -2, 12, M.mithril.g, 0.3);
  stroke(g, [[-8, 8], [6, -6]], M.mithril.b, 1.8);
  path(g, [[6, -6], [12, -12], [9, -4]], M.mithril.l, M.mithril.d, 0.7);
  path(g, [[-8, 8], [-11, 6], [-7, 6.4]], '#e8fbff');
  spark(g, 10, -10, 2.4, '#e8fbff');
});
A.item('quiver', function (g) {
  shadow(g);
  path(g, [[-5, -9], [5, -9], [4, 10], [-4, 10]], M.leather.b, M.leather.d, 1);
  path(g, [[-5, -9], [5, -9], [4.4, -5], [-4.4, -5]], shade(M.leather.b, 0.14));
  for (let i = -1; i <= 1; i++) {
    stroke(g, [[i * 2.6, -9], [i * 3, -14]], M.wood.b, 1.4);
    path(g, [[i * 3 - 1, -14], [i * 3, -16], [i * 3 + 1, -14]], '#f0e8d8');
  }
  rr(g, -4.4, 0, 8.8, 2.4, 0.8, M.gold.b, M.gold.d, 0.6);
  curve(g, -5, -6, -9, 0, -5, 6, M.leather.d, 1.4);
});
A.item('dart_narcotic', function (g) {
  shadow(g);
  g.save(); g.rotate(0.6);
  rr(g, -2.6, -8, 5.2, 12, 1, '#dce8f0', '#9ab0c0', 0.8);
  rr(g, -2, -4, 4, 7, 0.6, '#8ae04a');
  stroke(g, [[0, -8], [0, -14]], '#c8ccd0', 1.2);
  path(g, [[-1, -13], [1, -13], [0, -16]], '#e8e8f0');
  rr(g, -4, 3, 8, 2.4, 0.8, '#9ab0c0', '#6a8090', 0.6);
  path(g, [[-2.6, 5], [-6, 10], [-1, 8]], '#e8dcb0', '#b8ac80', 0.5);
  path(g, [[2.6, 5], [6, 10], [1, 8]], '#e8dcb0', '#b8ac80', 0.5);
  g.restore();
});
A.item('dart_poison', function (g) {
  shadow(g);
  g.save(); g.rotate(0.6);
  rr(g, -2.6, -8, 5.2, 12, 1, '#dce8f0', '#9ab0c0', 0.8);
  rr(g, -2, -4, 4, 7, 0.6, '#c05af0');
  stroke(g, [[0, -8], [0, -14]], '#c8ccd0', 1.2);
  path(g, [[-1, -13], [1, -13], [0, -16]], '#e8e8f0');
  rr(g, -4, 3, 8, 2.4, 0.8, '#9ab0c0', '#6a8090', 0.6);
  g.restore();
  glow(g, 4, -4, 7, '#8ae04a', 0.3);
});

/* ==========================================================
9 · ESCUDOS
========================================================== */
A.item('shield_buckler', function (g) {
  shadow(g);
  ell(g, 0, 0, 10, 10, M.leather.b, M.leather.d, 1.4);
  ell(g, 0, 0, 6.4, 6.4, shade(M.leather.b, 0.12));
  ell(g, 0, 0, 2.6, 2.6, M.iron.b, M.iron.d, 0.8);
  for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; ell(g, cos(a) * 8, sin(a) * 8, 0.8, 0.8, M.iron.d); }
});
A.item('shield_round_wood', function (g) {
  shadow(g);
  ell(g, 0, 0, 11, 11, M.wood.b, M.wood.d, 1.4);
  for (let i = -1; i <= 1; i++) stroke(g, [[i * 4, -10], [i * 4, 10]], shade(M.wood.b, -0.16), 1);
  ell(g, 0, 0, 3, 3, M.iron.b, M.iron.d, 0.9);
  ell(g, 0, 0, 10.4, 10.4, null, M.iron.d, 1.2);
});
A.item('shield_round', function (g) {
  shadow(g);
  ell(g, 0, 0, 11, 11, M.iron.b, M.iron.d, 1.4);
  ell(g, 0, 0, 7.4, 7.4, shade(M.iron.b, 0.12));
  ell(g, 0, 0, 3, 3, M.gold.b, M.gold.d, 0.9);
  for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; ell(g, cos(a) * 9, sin(a) * 9, 0.9, 0.9, M.iron.d); }
});
A.item('shield_kite', function (g) {
  shadow(g);
  path(g, [[0, -12], [9, -7], [8, 4], [0, 12], [-8, 4], [-9, -7]], M.steel.b, M.steel.d, 1.4);
  path(g, [[0, -12], [9, -7], [8, 4], [0, 8]], shade(M.steel.b, 0.14));
  stroke(g, [[0, -9], [0, 9]], M.steel.d, 1.2);
  stroke(g, [[-6, -2], [6, -2]], M.steel.d, 1.2);
  ell(g, 0, -2, 2.2, 2.2, M.gold.b, M.gold.d, 0.7);
});
A.item('shield_tower', function (g) {
  shadow(g);
  rr(g, -9, -12, 18, 24, 3, M.steel.b, M.steel.d, 1.5);
  rr(g, -9, -12, 18, 8, 3, shade(M.steel.b, 0.14));
  for (let i = 0; i < 3; i++) stroke(g, [[-7, -6 + i * 6], [7, -6 + i * 6]], M.steel.d, 1);
  stroke(g, [[0, -12], [0, 12]], M.steel.d, 1.2);
  ell(g, 0, -2, 2.6, 2.6, M.gold.b, M.gold.d, 0.8);
});
A.item('shield_spiked', function (g) {
  shadow(g);
  ell(g, 0, 0, 10, 10, M.steel.b, M.steel.d, 1.4);
  ell(g, 0, 0, 6, 6, shade(M.steel.b, 0.1));
  for (let i = 0; i < 8; i++) {
    const a = i / 8 * TAU;
    path(g, [[cos(a) * 9, sin(a) * 9], [cos(a) * 14, sin(a) * 14], [cos(a + 0.3) * 9, sin(a + 0.3) * 9]], M.iron.l, M.iron.d, 0.6);
  }
  ell(g, 0, 0, 2.4, 2.4, M.iron.d);
});
A.item('shield_warding', function (g) {
  shadow(g);
  glow(g, 0, 0, 14, M.mithril.g, 0.3);
  path(g, [[0, -12], [10, -6], [8, 8], [0, 12], [-8, 8], [-10, -6]], M.mithril.b, M.mithril.d, 1.4);
  path(g, [[0, -12], [10, -6], [8, 8], [0, 4]], shade(M.mithril.b, 0.16));
  star5(g, 0, 0, 5, '#e8fbff', M.mithril.d);
  for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; spark(g, cos(a) * 8, sin(a) * 7, 1.4, M.mithril.g); }
});
/* ==========================================================
10 · ARMADURAS · 7 conjuntos (casco/coraza/grebas) por material
Cada tier tiene forma propia, no solo color.
========================================================== */
const ARM_MATS = ['cloth', 'leather', 'hard_leather', 'iron', 'steel', 'mithril', 'adamantite'];
function armMat(k) {
  if (k === 'cloth') return M.cloth;
  if (k === 'leather' || k === 'hard_leather') return k === 'hard_leather'
    ? { b: '#6a4a2a', d: '#3e2a16', l: '#8a6a44' } : M.leather;
  return mat(k);
}
function armorHead(k) {
  return function (g) {
    const m = armMat(k); shadow(g);
    if (m.g) glow(g, 0, -2, 12, m.g, 0.2);
    if (k === 'cloth') {
      path(g, [[-9, 8], [-9, -3], [0, -10], [9, -3], [9, 8], [5, 3], [0, 1], [-5, 3]], m.b, m.d, 1);
      path(g, [[-9, -3], [0, -10], [9, -3], [4, -4], [0, -6], [-4, -4]], m.l, m.d, 0.6);
      g.save(); g.globalAlpha = 0.3; ell(g, 0, 1, 5, 4, '#000'); g.restore();
    } else if (k === 'leather' || k === 'hard_leather') {
      path(g, [[-8, 4], [-8, -3], [0, -9], [8, -3], [8, 4], [4, 2], [-4, 2]], m.b, m.d, 1);
      path(g, [[-8, -3], [0, -9], [8, -3], [3, -4], [-3, -4]], m.l, m.d, 0.6);
      rr(g, -9, 2, 18, 2.6, 1, m.d, shade(m.d, -0.3), 0.6);
      if (k === 'hard_leather') for (let i = -1; i <= 1; i++) ell(g, i * 5, -6, 1, 1, '#c8a060');
    } else if (k === 'iron' || k === 'mithril') {
      path(g, [[-8, 5], [-8, -3], [0, -10], [8, -3], [8, 5], [4, 3], [-4, 3]], m.b, m.d, 1);
      path(g, [[-6, -4], [0, -9], [6, -4], [0, -6]], m.l);
      rr(g, -1.4, -3, 2.8, 8, 1, m.b, m.d, 0.7);
      stroke(g, [[-7, -2], [7, -2]], m.l, 0.8);
      if (m.g) { stroke(g, [[-7, 1], [-4, 1]], m.g, 1); stroke(g, [[4, 1], [7, 1]], m.g, 1); }
    } else if (k === 'steel') {
      path(g, [[-8, 7], [-8, -3], [0, -10], [8, -3], [8, 7], [4, 8], [-4, 8]], m.b, m.d, 1);
      rr(g, -6, -1, 12, 2.6, 1, '#14141a');
      for (let i = 0; i < 3; i++) stroke(g, [[-4 + i * 4, 3], [-4 + i * 4, 6]], m.d, 0.8);
      stroke(g, [[-6, -4], [6, -4]], m.l, 0.9);
    } else { /* adamantite */
      path(g, [[-8, 7], [-8, -3], [0, -10], [8, -3], [8, 7], [4, 8], [-4, 8]], m.b, m.d, 1);
      rr(g, -6, -1, 12, 2.4, 1, '#1a1024');
      horn(g, -7, -4, 7, -2.3, 2.2, m.l, -1.4);
      horn(g, 7, -4, 7, -0.8, 2.2, m.l, 1.4);
      if (m.g) { g.save(); g.globalAlpha = 0.5; stroke(g, [[-6, 4], [6, 4]], m.g, 1.2); g.restore(); }
    }
  };
}
function armorChest(k) {
  return function (g) {
    const m = armMat(k); shadow(g);
    if (m.g) glow(g, 0, 0, 13, m.g, 0.2);
    path(g, [[-9, -8], [-4, -10], [4, -10], [9, -8], [8, 8], [-8, 8]], m.b, m.d, 1);
    if (k === 'cloth') {
      stroke(g, [[0, -9], [0, 8]], m.d, 0.8);
      path(g, [[-9, -8], [0, -5], [9, -8], [4, -10], [-4, -10]], m.l, m.d, 0.6);
    } else if (k === 'leather' || k === 'hard_leather') {
      for (let i = 0; i < 3; i++) { rr(g, -1.4, -6 + i * 4.4, 2.8, 2, 0.6, m.d); ell(g, 0, -5 + i * 4.4, 0.7, 0.7, '#d9a441'); }
      stroke(g, [[-7, -7], [-6, 7]], m.d, 0.9); stroke(g, [[7, -7], [6, 7]], m.d, 0.9);
      if (k === 'hard_leather') {
        ell(g, -5.6, -6.4, 2.6, 2, m.l, m.d, 0.6); ell(g, 5.6, -6.4, 2.6, 2, m.l, m.d, 0.6);
      }
    } else {
      path(g, [[-7, -7], [7, -7], [6, -1], [-6, -1]], m.l, m.d, 0.7);
      stroke(g, [[0, -1], [0, 8]], m.d, 0.9);
      ell(g, -7.4, -7.4, 3, 2.4, m.b, m.d, 0.7); ell(g, 7.4, -7.4, 3, 2.4, m.b, m.d, 0.7);
      for (let i = -1; i <= 1; i += 2) ell(g, i * 5, -4, 0.8, 0.8, m.d);
      if (k === 'mithril') for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++)
        ell(g, -5 + c * 3.4, 1 + r * 2.6, 1.8, 1.3, shade(m.b, r % 2 ? 0.1 : -0.06), m.d, 0.4);
      if (k === 'adamantite') {
        path(g, [[-9, -8], [-12, -12], [-7, -9]], m.l, m.d, 0.6);
        path(g, [[9, -8], [12, -12], [7, -9]], m.l, m.d, 0.6);
      }
      if (m.g) { g.save(); g.globalAlpha = 0.45; stroke(g, [[-6, 3], [6, 3]], m.g, 1.2); g.restore(); }
    }
  };
}
function armorLegs(k) {
  return function (g) {
    const m = armMat(k); shadow(g);
    if (m.g) glow(g, 0, 0, 12, m.g, 0.18);
    rr(g, -8, -9, 16, 4, 1.4, m.d, shade(m.d, -0.3), 0.7);
    path(g, [[-7.6, -5], [-1.4, -5], [-2, 10], [-7, 10]], m.b, m.d, 0.9);
    path(g, [[1.4, -5], [7.6, -5], [7, 10], [2, 10]], m.b, m.d, 0.9);
    stroke(g, [[-5.6, -4], [-5, 9]], m.l, 0.8); stroke(g, [[5.6, -4], [5, 9]], m.l, 0.8);
    if (k === 'cloth') {
      for (let i = 0; i < 3; i++) {
        stroke(g, [[-7, 0 + i * 3], [-2.4, 0.6 + i * 3]], m.d, 0.5);
        stroke(g, [[2.4, 0.6 + i * 3], [7, 0 + i * 3]], m.d, 0.5);
      }
    } else if (k === 'leather' || k === 'hard_leather') {
      rr(g, -8, 1, 6.4, 2, 0.8, m.d); rr(g, 1.6, 1, 6.4, 2, 0.8, m.d);
    } else {
      ell(g, -4.6, 1.4, 3, 2.2, m.l, m.d, 0.6); ell(g, 4.6, 1.4, 3, 2.2, m.l, m.d, 0.6);
      rr(g, -7.4, 7.6, 5.6, 2.6, 0.8, m.d); rr(g, 1.8, 7.6, 5.6, 2.6, 0.8, m.d);
      if (k === 'adamantite') {
        path(g, [[-7.6, 0], [-10, -2], [-7.4, -2.6]], m.l, m.d, 0.5);
        path(g, [[7.6, 0], [10, -2], [7.4, -2.6]], m.l, m.d, 0.5);
      }
      if (m.g) { g.save(); g.globalAlpha = 0.45; stroke(g, [[-6, 5], [-3, 5]], m.g, 1); stroke(g, [[3, 5], [6, 5]], m.g, 1); g.restore(); }
    }
    ell(g, 0, -7, 1.4, 1.2, M.gold.b, M.gold.d, 0.5);
  };
}
ARM_MATS.forEach(function (k) {
  A.item(k + '_head', armorHead(k));
  A.item(k + '_chest', armorChest(k));
  A.item(k + '_legs', armorLegs(k));
});

/* ==========================================================
11 · BARDAS (armadura de montura)
========================================================== */
['leather', 'iron', 'steel', 'mithril'].forEach(function (k) {
  A.item('petarmor_' + k, function (g) {
    const m = k === 'leather' ? M.leather : mat(k); shadow(g);
    if (m.g) glow(g, 0, 0, 12, m.g, 0.2);
    path(g, [[-4, -11], [4, -11], [6, -2], [4, 8], [-4, 8], [-6, -2]], m.b, m.d, 1);
    path(g, [[-3, -10], [3, -10], [4, -3], [-4, -3]], m.l, m.d, 0.6);
    ell(g, -2.6, 1, 1.4, 1.6, '#1a1a20'); ell(g, 2.6, 1, 1.4, 1.6, '#1a1a20');
    path(g, [[-4, 5], [4, 5], [3, 8], [-3, 8]], m.d);
    horn(g, -4, -10, 5, -2.2, 1.6, m.l, -1); horn(g, 4, -10, 5, -0.9, 1.6, m.l, 1);
    rr(g, -8, -4, 3, 8, 1, m.d, shade(m.d, -0.3), 0.6);
    rr(g, 5, -4, 3, 8, 1, m.d, shade(m.d, -0.3), 0.6);
  });
});

/* ==========================================================
12 · MOCHILAS (4 tamaños)
========================================================== */
[['small', 0.78, 0], ['medium', 0.92, 1], ['large', 1.06, 2], ['explorer', 1.14, 3]].forEach(function (b) {
  A.item('bag_' + b[0], function (g) {
    shadow(g);
    g.save(); g.scale(b[1], b[1]);
    const col = b[2] >= 2 ? '#6a4a2a' : '#8a6a44';
    blob(g, 0, 1, 9.4, 10, col, shade(col, 0.2));
    rr(g, -8, -8, 16, 6, 2.4, shade(col, -0.16), shade(col, -0.4), 0.8);
    rr(g, -5, -1, 10, 6, 1.6, shade(col, 0.14), shade(col, -0.3), 0.7);
    ell(g, 0, 2, 1.4, 1.4, M.gold.b, M.gold.d, 0.5);
    curve(g, -7, -7, -10, 2, -7, 8, shade(col, -0.3), 1.6);
    curve(g, 7, -7, 10, 2, 7, 8, shade(col, -0.3), 1.6);
    stroke(g, [[-6, -5], [6, -5]], M.gold.b, 0.8);
    if (b[2] >= 1) { rr(g, -9, 0, 3.4, 5, 1, shade(col, -0.1), shade(col, -0.35), 0.6); rr(g, 5.6, 0, 3.4, 5, 1, shade(col, -0.1), shade(col, -0.35), 0.6); }
    if (b[2] >= 2) { g.save(); g.globalAlpha = 0.5; stroke(g, [[-7, 7], [7, 7]], M.mithril.g, 1.2); g.restore(); ell(g, 0, -6, 1.2, 1.2, M.mithril.b); }
    if (b[2] === 3) {
      glow(g, 0, -8, 10, '#8fd8f0', 0.25);
      path(g, [[-8, -8], [-12, -12], [-7, -9]], M.mithril.l, M.mithril.d, 0.6);
      path(g, [[8, -8], [12, -12], [7, -9]], M.mithril.l, M.mithril.d, 0.6);
      for (let i = -1; i <= 1; i += 2) path(g, [[i * 9, 0], [i * 11, -4], [i * 12, 0]], '#cfe0f4', M.mithril.d, 0.5);
    }
    g.restore();
  });
});

/* ==========================================================
13 · SILLAS DE MONTAR · retrato de la bestia en medallón
========================================================== */
function creatureMini(g, species, x, y, k) {
  const fn = A.creatures[species];
  if (!fn) return;
  g.save(); g.translate(x, y); g.scale(k, k);
  try {
    fn(g, { t: 0.4, ph: 0.7, atk: -1, baby: false, tamed: false, fly: false, lvl: 1,
      sd: D.SPECIES[species], e: null, tint: '#fff', front: false, back: false, sq: 1, hs: 1, lunge: 0 });
  } catch (err) {}
  g.restore();
}
const SADDLE_COL = {
  horse: '#8a6242', camel: '#c8a468', reindeer: '#9a8a76', llama: '#d8c8a8',
  bison: '#5a4030', bear: '#6a4a32', polar_bear: '#dce6ec', warg: '#4a3a5a',
  griffin: '#c8a850', condor: '#2a2a30', nightmare: '#2a1a3a',
  unicorn: '#d8c8f0', kirin: '#9ad8c8', pegasus: '#cfe8ff', wyvern: '#a8603c'
};
Object.keys(SADDLE_COL).forEach(function (sp) {
  A.item('saddle_' + sp, function (g) {
    shadow(g);
    const col = SADDLE_COL[sp];
    g.save(); g.translate(-2, -1);
    path(g, [[-9, 2], [-7, -4], [7, -4], [9, 2], [6, 5], [-6, 5]], '#7a4a2a', '#4a2a12', 1);
    path(g, [[-7, -4], [7, -4], [6, -1], [-6, -1]], '#9a6a44', '#4a2a12', 0.6);
    curve(g, -8, -4, -6, -9, -3, -5, '#6a3a1a', 2.2);
    curve(g, 8, -4, 6, -9, 3, -5, '#6a3a1a', 2.2);
    stroke(g, [[-6, 5], [-7, 10]], '#4a2a12', 1.4);
    stroke(g, [[6, 5], [7, 10]], '#4a2a12', 1.4);
    rr(g, -9, 9, 4.4, 2.4, 1, '#a8a8b0', '#6a6a72', 0.6);
    rr(g, 4.6, 9, 4.4, 2.4, 1, '#a8a8b0', '#6a6a72', 0.6);
    ell(g, 0, -2.6, 1.2, 1.2, M.gold.b);
    g.restore();
    ell(g, 8, 7, 6, 6, '#3a2a1a', '#d9a441', 1);
    g.save(); g.beginPath(); g.arc(8, 7, 5.2, 0, TAU); g.clip();
    ell(g, 8, 7, 5.2, 5.2, mix(col, '#ffffff', 0.55));
    creatureMini(g, sp, 8, 10.4, 0.2);
    g.restore();
  });
});

/* ==========================================================
14 · PESCADOS (8)
========================================================== */
function fishIcon(col, belly, opt) {
  return function (g) {
    shadow(g);
    const o = opt || {};
    if (o.glow) glow(g, 0, 0, 13, o.glow, 0.28);
    g.save(); g.rotate(-0.12);
    path(g, [[-9, 0], [-4, -5.4], [4, -5], [9, -1], [9, 1], [4, 5], [-4, 5.4]], col, shade(col, -0.4), 1);
    path(g, [[9, 0], [13, -5], [12, 0], [13, 5]], shade(col, -0.12), shade(col, -0.4), 0.8);
    path(g, [[-6, 1.6], [4, 2.4], [7, 1], [4, 4.4], [-4, 4.6]], belly);
    path(g, [[-1, -5], [2, -9], [5, -4.6]], shade(col, -0.18), shade(col, -0.4), 0.6);
    path(g, [[0, 4], [2, 8], [5, 4]], shade(col, -0.18), shade(col, -0.4), 0.6);
    if (o.spots) spots(g, 0, -1, 7, 3.6, 7, o.spots, 3, 1.1);
    if (o.stripes) for (let i = -1; i <= 1; i++) stroke(g, [[i * 4, -4], [i * 4 - 1, 4]], o.stripes, 1.2);
    if (o.whiskers) { curve(g, -8, 1, -12, 3, -13, 6, shade(col, -0.3), 0.9); curve(g, -8, -1, -12, -3, -13, -5, shade(col, -0.3), 0.9); }
    if (o.frost) for (let i = 0; i < 3; i++) spark(g, -4 + i * 5, -6 - i, 1.8, '#e8f8ff');
    eye(g, -6, -1.4, 1.4, o.eye || '#1a1408', o.glow ? rgba(o.glow, 0.6) : null);
    g.restore();
  };
}
A.item('fish_sardine', fishIcon('#a8b8c8', '#e8f0f8', {}));
A.item('fish_trout', fishIcon('#8a9a6a', '#f0d8c0', { spots: 'rgba(190,80,80,0.6)' }));
A.item('fish_catfish', fishIcon('#5a5a4a', '#c8c0a0', { whiskers: true }));
A.item('fish_ice', fishIcon('#b8d8e8', '#f0faff', { frost: true, glow: '#bfe4f5' }));
A.item('fish_dune', fishIcon('#d8b060', '#f8e8c0', { stripes: 'rgba(140,100,40,0.55)' }));
A.item('fish_void', fishIcon('#5a3a7a', '#a87ad0', { glow: '#b06ae0', eye: '#e0c040' }));
A.item('fish_ember', fishIcon('#c85030', '#f8a060', { glow: '#ff7a30', eye: '#ffd070' }));
A.item('fish_mirror', fishIcon('#d8dce4', '#ffffff', { glow: '#cfe8ff', stripes: 'rgba(180,190,210,0.6)' }));

/* ==========================================================
15 · CULTIVOS (24) Y SEMILLAS
========================================================== */
const CROP_COL = {
  wheat: '#d8c060', carrot: '#e07830', potato: '#c8a060', tomato: '#d84040', pumpkin: '#e08828',
  onion: '#d8b8c8', lettuce: '#8ad060', garlic: '#e8e0d0', corn: '#e8c840', cabbage: '#8ac870',
  pepper: '#d83030', sweetpotato: '#c06080', rice: '#e0d890', quinoa: '#c88a68', maca: '#b89060',
  sunflower: '#f0c020', strawberry: '#e04060', grape: '#7a48a8', melon: '#a8d070', cotton: '#f4f4f0',
  flax: '#8ab8d8', herb: '#4aae7a', bean: '#7ab84a', beet: '#a8306a'
};
const CROP_FORM = {
  wheat: 'grain', carrot: 'root', potato: 'root', tomato: 'fruit', pumpkin: 'fruit',
  onion: 'bulb', lettuce: 'leaf', garlic: 'bulb', corn: 'grain', cabbage: 'leaf',
  pepper: 'fruit', sweetpotato: 'root', rice: 'grain', quinoa: 'grain', maca: 'root',
  sunflower: 'seedpod', strawberry: 'fruit', grape: 'vine', melon: 'fruit', cotton: 'fiber',
  flax: 'fiber', herb: 'leaf', bean: 'vine', beet: 'root'
};
function cropHead(g, id, col, form) {
  if (form === 'grain') {
    for (let i = -1; i <= 1; i++) {
      stroke(g, [[i * 4, 6], [i * 4.4, -6]], shade(col, -0.2), 1.4);
      for (let k = 0; k < 4; k++) ell(g, i * 4.4, -7 - k * 2.4, 2, 1.4, shade(col, k % 2 ? 0.1 : -0.08));
    }
  } else if (form === 'root') {
    blob(g, 0, 3, 6.4, 8, col, shade(col, 0.16));
    curve(g, 0, 10, 1, 13, -1, 15, shade(col, -0.3), 1.4);
    for (let k = -1; k <= 1; k++) stroke(g, [[0, -5], [k * 6, -12]], '#5a9a3a', 1.6);
  } else if (form === 'bulb') {
    blob(g, 0, 3, 7, 7.4, col, shade(col, 0.18));
    stroke(g, [[-2.4, 8], [-2, -3]], shade(col, -0.18), 0.8);
    stroke(g, [[2.4, 8], [2, -3]], shade(col, -0.18), 0.8);
    for (let k = -1; k <= 1; k++) stroke(g, [[0, -4], [k * 4.4, -11]], '#7a9a4a', 1.3);
  } else if (form === 'leaf') {
    for (let i = 0; i < 7; i++) { const a = i / 7 * TAU; ell(g, cos(a) * 5.4, sin(a) * 4.4, 5, 4.4, i % 2 ? col : shade(col, 0.14)); }
    ell(g, 0, 0, 5.4, 4.6, shade(col, 0.26));
    curve(g, -3, 3, 0, -1, 3, 3, shade(col, -0.2), 0.8);
  } else if (form === 'seedpod') {
    for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; ell(g, cos(a) * 5, sin(a) * 5, 2.6, 2, col, shade(col, -0.2), 0.4); }
    ell(g, 0, 0, 3.4, 3.4, '#6a4a20');
    stroke(g, [[0, -8], [0, -13]], '#5a9a3a', 1.4);
  } else if (form === 'vine') {
    curve(g, -6, -8, 0, 0, 6, -6, '#4a8a30', 1.6);
    for (let i = 0; i < 4; i++) {
      const t2 = i / 3, x = U.lerp(-6, 6, t2), y = -8 + sin(t2 * PI) * 8;
      ell(g, x, y + 2, 3, 3.6, col, shade(col, -0.3), 0.6);
    }
  } else if (form === 'fiber') {
    for (let i = 0; i < 5; i++) { const a = i / 5 * TAU; ell(g, cos(a) * 4.4, sin(a) * 4 - 1, 4.4, 4, col, shade(col, -0.15), 0.5); }
    ell(g, 0, -1, 4.4, 4, shade(col, 0.2), shade(col, -0.1), 0.5);
  } else { /* fruit */
    blob(g, 0, 2, 8, 7.6, col, shade(col, 0.2));
    stroke(g, [[0, -5], [0, -9]], '#4a8a30', 1.6);
    path(g, [[0, -8], [5, -10], [3, -6]], '#5aa04a', '#3a7a2a', 0.5);
  }
}
Object.keys(CROP_COL).forEach(function (id) {
  const col = CROP_COL[id], form = CROP_FORM[id];
  A.item('crop_' + id, function (g) { shadow(g); cropHead(g, id, col, form); });
  A.item('seed_' + id, function (g) {
    shadow(g);
    path(g, [[-9, -10], [9, -10], [9, 9], [-9, 9]], '#e8dcc0', '#a89870', 1);
    path(g, [[-9, -10], [0, -5], [9, -10]], '#d8c8a8', '#a89870', 0.7);
    g.save(); g.beginPath(); g.rect(-7.4, -4, 14.8, 11); g.clip();
    ell(g, 0, 2, 8, 6, '#f8f2e0');
    g.save(); g.translate(0, 2); g.scale(0.5, 0.5); cropHead(g, id, col, form); g.restore();
    g.restore();
    rr(g, -9, 6.4, 18, 2.6, 0.8, '#c8b898', '#a89870', 0.5);
    for (let i = 0; i < 3; i++) ell(g, -6 + i * 6, 11, 1.6, 1.2, '#8a6a3a', '#5a4420', 0.4);
  });
});
/* ==========================================================
16 · COMIDAS Y BEBIDAS
========================================================== */
function shadowS(g) { g.save(); g.globalAlpha = 0.18; ell(g, 0, 10, 8, 2.2, '#000'); g.restore(); }
function fruitIcon(g, c, leaf) {
  shadowS(g);
  blob(g, 0, 1, 8, 7.6, c, shade(c, 0.22));
  stroke(g, [[0, -6], [1, -9]], '#6a4a2a', 1.4);
  path(g, [[1, -8], [6, -10], [5, -6]], leaf, '#3a7a2a', 0.5);
  g.save(); g.globalAlpha = 0.5; ell(g, -3, -2, 2, 2.6, '#ffffff'); g.restore();
}
function bowlIcon(g, base, bits) {
  shadowS(g);
  path(g, [[-9, 0], [9, 0], [6, 7], [-6, 7]], '#8a6a4a', '#5a4420', 0.9);
  ell(g, 0, 0, 9, 3.4, base, shade(base, -0.25), 0.7);
  if (bits) for (let i = 0; i < bits.length; i++) ell(g, bits[i][0], bits[i][1], bits[i][2], bits[i][2] * 0.7, bits[i][3]);
  g.save(); g.globalAlpha = 0.35;
  curve(g, -2, -4, 0, -8, -2, -11, '#e8e0d0', 1.2);
  curve(g, 3, -4, 5, -8, 3, -11, '#e8e0d0', 1.2);
  g.restore();
}
function loafIcon(g, c, cut) {
  shadowS(g);
  blob(g, 0, 2, 10, 6.4, c, shade(c, 0.2));
  for (let i = -1; i <= 1; i++) curve(g, i * 4 - 1.4, -3, i * 4, 0, i * 4 + 1.4, -3, shade(c, -0.3), 0.9);
  if (cut) path(g, [[6, 0], [10, 2], [9, 6], [6, 6]], shade(c, 0.3), shade(c, -0.2), 0.5);
}
function meatIcon(g, raw) {
  shadowS(g);
  const c = raw ? '#d06a6a' : '#8a5a2a';
  blob(g, 0, 1, 8.4, 6, c, shade(c, 0.16));
  ell(g, -5, -3, 3, 2.4, '#efe9d8', '#b8ac96', 0.6);
  if (!raw) for (let i = -1; i <= 1; i++) stroke(g, [[i * 4, -2], [i * 4, 5]], shade(c, -0.35), 1);
  g.save(); g.globalAlpha = 0.4; ell(g, -2, -1, 3, 2, shade(c, 0.3)); g.restore();
}
function bottleIcon(g, fill, tall) {
  shadowS(g);
  if (tall) {
    path(g, [[-3, -8], [3, -8], [4, 8], [-4, 8]], '#dce8f0', '#9ab0c0', 0.8);
    path(g, [[-3.4, 0], [3.4, 0], [4, 7], [-4, 7]], fill);
    rr(g, -3, -11, 6, 3, 1, '#8a6a44', '#5a4420', 0.7);
  } else {
    path(g, [[-2.4, -9], [2.4, -9], [2.4, -4], [6.4, 2], [5.6, 8], [-5.6, 8], [-6.4, 2], [-2.4, -4]], '#dce8f0', '#9ab0c0', 0.8);
    path(g, [[-5, 1], [5, 1], [4.4, 7], [-4.4, 7]], fill);
    rr(g, -3, -12, 6, 3, 1, '#8a6a44', '#5a4420', 0.7);
  }
  g.save(); g.globalAlpha = 0.5; ell(g, -2, 2, 1.2, 3, '#ffffff'); g.restore();
}
A.item('berry', function (g) {
  shadowS(g);
  stroke(g, [[0, -4], [2, -9]], '#4a8a3a', 1.1);
  path(g, [[2, -9], [7, -10], [6, -6]], '#5aae4a', '#2e7a3a', 0.5);
  const B = [[-3, 2, 3.6], [3, 1, 3.4], [0, 5, 3.2]];
  for (let i = 0; i < 3; i++) { blob(g, B[i][0], B[i][1], B[i][2], B[i][2], '#4a5aa8', '#7a8ad8'); ell(g, B[i][0] - 1, B[i][1] - 1, 1, 0.8, 'rgba(220,230,255,0.7)'); }
});
A.item('apple', function (g) { fruitIcon(g, '#d0342c', '#4a9a3a'); });
A.item('mushroom', function (g) {
  shadowS(g);
  rr(g, -2.6, 0, 5.2, 9, 2, '#efe6d0', '#b8ac96', 0.7);
  path(g, [[-9, 0], [-7, -7], [0, -9], [7, -7], [9, 0]], '#c8402c', '#8a2418', 0.9);
  ell(g, -4, -4, 1.4, 1.1, '#f8e8d8'); ell(g, 2, -6, 1.2, 1, '#f8e8d8'); ell(g, 4, -2, 1, 0.8, '#f8e8d8');
});
A.item('egg', function (g) {
  shadowS(g);
  blob(g, 0, 1, 6.4, 8, '#f8f0e0', '#fffaf4');
  spots(g, 0, 1, 5.6, 7, 6, 'rgba(190,170,140,0.5)', 4, 0.9);
  g.save(); g.globalAlpha = 0.6; ell(g, -2, -3, 1.8, 2.6, '#ffffff'); g.restore();
});
A.item('milk', function (g) { bottleIcon(g, '#fffaf4', true); });
A.item('raw_meat', function (g) { meatIcon(g, true); });
A.item('raw_poultry', function (g) { meatIcon(g, true); });
A.item('raw_game', function (g) { meatIcon(g, true); });
A.item('cooked_meat', function (g) { meatIcon(g, false); });
A.item('cooked_poultry', function (g) { meatIcon(g, false); });
A.item('cooked_game', function (g) { meatIcon(g, false); });
A.item('cooked_fish', function (g) {
  shadowS(g);
  ell(g, 0, 4, 11, 3.4, '#c8c0b0', '#8a8478', 0.7);
  blob(g, 0, 0, 9, 4.4, '#c88a4a', '#a86a28');
  path(g, [[9, 0], [13, -3], [13, 3]], '#b07a3a', '#8a5a20', 0.7);
  for (let i = -1; i <= 1; i++) stroke(g, [[i * 4, -3], [i * 4 - 1, 3]], '#7a4a18', 0.8);
  ell(g, 5, -5, 2.6, 1.8, '#e8d84a', '#a89820', 0.5);
});
A.item('boiled_egg', function (g) {
  shadowS(g);
  blob(g, 0, 1, 7, 8.4, '#f4f0e4', '#fffdf6');
  ell(g, 0, 1.6, 4, 4, '#f0b830', '#ffd870');
  g.save(); g.globalAlpha = 0.6; ell(g, -2.2, -2.8, 1.8, 2.4, '#ffffff'); g.restore();
});
A.item('porridge', function (g) { bowlIcon(g, '#d8c8a0', [[-3, -1, 2, '#c0a878'], [3, 0, 2, '#e0d0a8']]); });
A.item('herb_tea', function (g) { bottleIcon(g, '#8ab870', true); });
A.item('fried_egg', function (g) {
  shadowS(g);
  path(g, [[-9, 1], [-7, -4], [-2, -6], [4, -5], [9, -1], [8, 4], [3, 7], [-4, 6], [-8, 4]], '#fffaf0', '#d8d0c0', 0.9);
  blob(g, 0, 0, 4.4, 3.8, '#f0b830', '#ffd870');
  g.save(); g.globalAlpha = 0.6; ell(g, -1.4, -1.2, 1.4, 1.1, '#ffffff'); g.restore();
});
A.item('flatbread', function (g) { loafIcon(g, '#d8b060', false); });
A.item('dried_meat', function (g) {
  shadowS(g);
  path(g, [[-8, -4], [8, -4], [7, 5], [-7, 5]], '#9a5a34', '#6a3a1c', 0.9);
  for (let i = -1; i <= 1; i++) stroke(g, [[-6, i * 3], [6, i * 3]], '#7a4426', 0.9);
  curve(g, -3, -4, -1, -7, 1, -4, '#6a3a1c', 1); curve(g, 3, -4, 5, -7, 6, -4, '#6a3a1c', 1);
});
A.item('bread', function (g) { loafIcon(g, '#d8a048', true); });
A.item('corn_bread', function (g) { loafIcon(g, '#e0b858', true); });
A.item('cheese', function (g) {
  shadowS(g);
  path(g, [[-10, 6], [-8, -2], [9, -6], [10, 2]], '#f0c840', '#b89018', 0.9);
  path(g, [[-8, -2], [9, -6], [10, -3], [-7, 1]], '#f8e07a', '#b89018', 0.6);
  ell(g, -3, 1, 2, 1.6, '#d8a828'); ell(g, 4, -1, 1.5, 1.2, '#d8a828'); ell(g, 6, 3, 1.1, 0.9, '#d8a828');
});
A.item('butter', function (g) {
  shadowS(g);
  rr(g, -8, -2, 16, 8, 1.4, '#f8e8a0', '#c8b060', 0.9);
  path(g, [[-8, -2], [8, -2], [6, -5], [-6, -5]], '#fff4c8', '#c8b060', 0.7);
  stroke(g, [[-3, -2], [-3, 6]], '#e0cc80', 0.7);
});
A.item('salad', function (g) { bowlIcon(g, '#7ab040', [[-4, -1, 2.2, '#a8d860'], [3, 0, 2, '#d84040'], [0, -2, 1.6, '#f0e8c0']]); });
A.item('rice_bowl', function (g) { bowlIcon(g, '#f0ead8', [[-3, -1, 1.8, '#e0d8c0'], [3, 0, 1.8, '#fffaf0'], [0, -2, 1.4, '#7ab040']]); });
A.item('vegetable_soup', function (g) { bowlIcon(g, '#c8a060', [[-3, -1, 2, '#d84040'], [3, 0, 1.8, '#7ab040'], [0, -2, 1.6, '#e8c060']]); });
A.item('pumpkin_soup', function (g) { bowlIcon(g, '#e08828', [[-2, -1, 2.2, '#f0a048']]); });
A.item('bean_stew', function (g) { bowlIcon(g, '#9a6a44', [[-3, -1, 2, '#c08860'], [3, 0, 2, '#8a5a3a']]); });
A.item('stew', function (g) { bowlIcon(g, '#a87a3a', [[-4, -1, 2.2, '#c85a3a'], [3, 0, 1.8, '#e8c060'], [0, -2, 1.6, '#6aae4a']]); });
A.item('grilled_fish', function (g) {
  shadowS(g);
  blob(g, 0, 0, 9, 4.4, '#c88a4a', '#8a5a20');
  path(g, [[9, 0], [13, -3], [13, 3]], '#b07a3a', '#8a5a20', 0.7);
  for (let i = -1; i <= 1; i++) stroke(g, [[i * 4, -3], [i * 4 - 1, 3]], '#7a4a18', 0.9);
  stroke(g, [[-6, 5], [6, 5]], '#6a4a2a', 1.2);
});
A.item('smoked_fish', function (g) {
  shadowS(g);
  stroke(g, [[0, -10], [0, -5]], '#8a6a3a', 1.4);
  blob(g, 0, 0, 8, 4.6, '#a8744a', '#6a4428');
  path(g, [[8, 0], [12, -3], [12, 3]], '#96653c', '#6a4428', 0.7);
  for (let i = -1; i <= 1; i++) stroke(g, [[i * 4, -3], [i * 4 - 1, 3]], '#7a5030', 0.8);
});
A.item('sausage', function (g) {
  shadowS(g);
  g.save(); g.rotate(-0.2);
  blob(g, 0, 0, 10, 4, '#b05a3a', '#d07a5a');
  stroke(g, [[-4, -3], [-4, 3]], '#8a3a20', 0.8); stroke(g, [[2, -3], [2, 3]], '#8a3a20', 0.8);
  ell(g, -10, 0, 1.4, 1.8, '#8a3a20'); ell(g, 10, 0, 1.4, 1.8, '#8a3a20');
  g.restore();
});
function pieIcon(g, top) {
  shadowS(g);
  path(g, [[-10, 0], [10, 0], [7, 7], [-7, 7]], '#c89a5a', '#8a6a2a', 0.9);
  ell(g, 0, 0, 10, 4, top, shade(top, -0.3), 0.7);
  for (let i = -2; i <= 2; i++) stroke(g, [[i * 3.6, -2.6], [i * 3.6 + 1.8, 1.8]], shade(top, -0.25), 1.2);
  g.save(); g.globalAlpha = 0.4; curve(g, 0, -4, 2, -8, 0, -11, '#e8e0d0', 1.2); g.restore();
}
A.item('pie', function (g) { pieIcon(g, '#e0b060'); });
A.item('fruit_pie', function (g) { pieIcon(g, '#d85a6a'); });
A.item('jam', function (g) {
  shadowS(g);
  path(g, [[-6, -3], [6, -3], [7, 8], [-7, 8]], '#dce8f0', '#9ab0c0', 0.8);
  path(g, [[-5.6, 1], [5.6, 1], [6.2, 7], [-6.2, 7]], '#c83a4a');
  rr(g, [-6.4, -6, 12.8, 3, 1], '#d8483a', '#a02818', 0.7);
  path(g, [[-4, -6], [4, -6], [3, -9], [-3, -9]], '#e8dcc0', '#a89870', 0.6);
});
A.item('honey_cake', function (g) { pieIcon(g, '#e8c060'); });
A.item('maca_porridge', function (g) { bowlIcon(g, '#c8a878', [[-2, -1, 2, '#b08a58']]); });
A.item('truffle_risotto', function (g) { bowlIcon(g, '#f0ead8', [[-3, -1, 1.8, '#3a2a20'], [3, 0, 1.8, '#fffaf0'], [0, -2, 1.6, '#e8c060']]); });
A.item('feast', function (g) {
  shadowS(g);
  ell(g, 0, 4, 12, 4.4, '#c8b898', '#8a7a5a', 0.9);
  path(g, [[-5, 1], [-1, -3], [3, -2], [5, 1]], '#8a5a2a', '#5a3a18', 0.7);
  ell(g, -4, -1, 2.2, 1.8, '#d84040'); ell(g, 4, -1, 2.2, 1.8, '#7ab040'); ell(g, 0, -4, 2, 2, '#e8c060');
  g.save(); g.globalAlpha = 0.4; curve(g, 0, -6, 2, -10, 0, -13, '#e8e0d0', 1.2); g.restore();
});
A.item('traveler_ration', function (g) {
  shadowS(g);
  rr(g, -9, -4, 18, 10, 1.8, '#a8855a', '#6a5438', 0.9);
  rr(g, -9, -4, 18, 3.6, 1.4, '#c09a6a', '#6a5438', 0.6);
  stroke(g, [[-9, 1], [9, 1]], '#8a6a44', 0.9);
  ell(g, -3, 3, 2, 1.6, '#d84040'); ell(g, 3, 3, 2, 1.6, '#e8c060');
});
A.item('truffle', function (g) {
  shadowS(g);
  blob(g, 0, 1, 8, 6.6, '#3a2a20', '#5a4430');
  spots(g, 0, 1, 7, 5.6, 9, 'rgba(20,14,10,0.7)', 5, 1.3);
  spots(g, 0, 1, 7, 5.6, 5, 'rgba(120,100,70,0.4)', 9, 0.8);
  ell(g, -2.6, -2, 1.6, 1.2, 'rgba(150,130,90,0.35)');
});
A.item('mead', function (g) { bottleIcon(g, '#e0a838', false); });
A.item('ale', function (g) { bottleIcon(g, '#c88a3a', false); });
A.item('cider', function (g) { bottleIcon(g, '#d8a040', false); });
A.item('wine', function (g) { bottleIcon(g, '#8a2a4a', true); });
A.item('maca_tonic', function (g) { bottleIcon(g, '#b08a5a', true); });

/* ==========================================================
17 · CURAS Y POCIONES
========================================================== */
function potionIcon(g, col, glowCol, tall) {
  shadowS(g);
  if (glowCol) glow(g, 0, 2, 11, glowCol, 0.24);
  if (tall) {
    path(g, [[-3, -7], [3, -7], [4, 8], [-4, 8]], '#dce8f0', '#9ab0c0', 0.8);
    path(g, [[-3.2, 0], [3.2, 0], [3.8, 7], [-3.8, 7]], col);
    rr(g, -3.6, -10, 7.2, 3, 1, '#8a6a44', '#5a4420', 0.7);
  } else {
    path(g, [[-2.4, -8], [2.4, -8], [2.4, -3.4], [6.4, 2.4], [5.6, 8], [-5.6, 8], [-6.4, 2.4], [-2.4, -3.4]], '#dce8f0', '#9ab0c0', 0.8);
    path(g, [[-5, 1], [5, 1], [4.4, 7], [-4.4, 7]], col);
    ell(g, 0, 1, 5, 1.8, shade(col, 0.2));
    rr(g, -3, -11, 6, 3, 1, '#8a6a44', '#5a4420', 0.7);
  }
  g.save(); g.globalAlpha = 0.5; ell(g, -2, 2, 1.2, 3, '#ffffff'); g.restore();
  ell(g, 2, 4, 0.8, 0.8, shade(col, 0.4)); ell(g, -1, 5, 0.6, 0.6, shade(col, 0.4));
}
function bandageIcon(g, col, cross) {
  shadowS(g);
  g.save(); g.rotate(-0.3);
  rr(g, -8, -3.4, 16, 7, 1.8, col, shade(col, -0.3), 0.9);
  for (let i = -2; i <= 2; i++) stroke(g, [[i * 3, -3.4], [i * 3, 3.4]], shade(col, -0.16), 0.6);
  g.restore();
  if (cross) { stroke(g, [[-2.4, -7], [2.4, -7]], '#e04b3a', 1.8); stroke(g, [[0, -9.4], [0, -4.6]], '#e04b3a', 1.8); }
}
A.item('bandage_simple', function (g) { bandageIcon(g, '#e8dcc0', false); });
A.item('bandage_clean', function (g) { bandageIcon(g, '#f4f0e4', true); });
A.item('bandage_herb', function (g) { bandageIcon(g, '#c8e0b8', true); });
A.item('splint', function (g) {
  shadowS(g);
  g.save(); g.rotate(0.2);
  rr(g, -2.6, -10, 5.2, 20, 1.4, '#a8855a', '#6a5438', 0.9);
  stroke(g, [[-2.6, -3.6], [2.6, -3.6]], '#6a5438', 1.1); stroke(g, [[-2.6, 3.6], [2.6, 3.6]], '#6a5438', 1.1);
  g.restore();
  rr(g, [-7, -1.8, 14, 3.6, 1.2], '#e8dcc0', '#a89870', 0.7);
});
A.item('salve_burn', function (g) {
  shadowS(g);
  rr(g, -6, -2, 12, 10, 1.8, '#8a9aa8', '#5a6a78', 0.9);
  ell(g, 0, -2, 6, 2.2, '#a8b8c4', '#5a6a78', 0.6);
  ell(g, 0, 2, 3, 2.4, '#e07030');
  glow(g, 0, 2, 5, '#ff8a30', 0.3);
});
A.item('antidote', function (g) { potionIcon(g, '#8ae04a', '#8ae04a', false); });
A.item('potion_heal_s', function (g) { potionIcon(g, '#d0342c', '#ff6a5a', false); });
A.item('potion_heal_m', function (g) { potionIcon(g, '#c02a3a', '#ff5a4a', false); });
A.item('potion_heal_l', function (g) { potionIcon(g, '#a01a3a', '#ff4a5a', true); });
A.item('potion_stamina_s', function (g) { potionIcon(g, '#3fbf6f', '#8fe08f', true); });
A.item('potion_stamina_l', function (g) { potionIcon(g, '#2ea85c', '#7ad88a', true); });
A.item('elixir_regen', function (g) { potionIcon(g, '#e07030', '#ffb060', true); });
A.item('potion_fire_res', function (g) { potionIcon(g, '#ff7a30', '#ff9a40', false); });
A.item('potion_ice_res', function (g) { potionIcon(g, '#8fd0f0', '#bfe4f5', false); });
A.item('holy_water', function (g) {
  shadowS(g);
  glow(g, 0, 1, 12, '#8fd0f0', 0.3);
  path(g, [[0, -10], [5.4, -2], [6.4, 4], [0, 9], [-6.4, 4], [-5.4, -2]], '#cfe8f8', '#7ab0d0', 0.9);
  path(g, [[0, -5.4], [3.6, -1], [4.2, 3.4], [0, 6.8], [-4.2, 3.4], [-3.6, -1]], '#8fd0f0');
  rr(g, -2.4, -12, 4.8, 2.8, 0.9, '#e8c040', '#a07820', 0.6);
  ell(g, 0, 1, 2.4, 2.4, '#fff8d8');
  for (let i = 0; i < 8; i++) { const a = i / 8 * U.TAU; stroke(g, [[cos(a) * 3, 1 + sin(a) * 3], [cos(a) * 4.2, 1 + sin(a) * 4.2]], '#fff0b0', 0.6); }
});

/* ==========================================================
18 · CAMAS
========================================================== */
function bedIcon(g, mattress, frame, pillow, canopy) {
  shadowS(g);
  rr(g, -11, 2, 22, 7, 1.4, frame, shade(frame, -0.35), 0.9);
  rr(g, -10, -1, 20, 5, 1.2, mattress, shade(mattress, -0.25), 0.7);
  rr(g, -10, -1, 7.4, 5, 1.2, pillow, shade(pillow, -0.2), 0.5);
  stroke(g, [[-10, 2], [10, 2]], shade(mattress, -0.3), 0.6);
  rr(g, -11, 8, 2.8, 4, 0.7, shade(frame, -0.2)); rr(g, 8.2, 8, 2.8, 4, 0.7, shade(frame, -0.2));
  if (canopy) {
    stroke(g, [[-11, -1], [-11, -10]], shade(frame, -0.2), 1.4);
    stroke(g, [[11, -1], [11, -10]], shade(frame, -0.2), 1.4);
    path(g, [[-11, -10], [0, -13], [11, -10]], canopy, shade(canopy, -0.3), 0.9);
  }
}
A.item('bed_roll', function (g) {
  shadowS(g);
  g.save(); g.rotate(-0.15);
  rr(g, -9, -3, 18, 8, 2.6, '#8a7a5a', '#5a4a30', 0.9);
  ell(g, -9, 1, 2.8, 4, '#a89878', '#5a4a30', 0.7);
  stroke(g, [[-5, -3], [-5, 5]], '#6a5a3a', 0.8); stroke(g, [[2, -3], [2, 5]], '#6a5a3a', 0.8);
  g.restore();
});
A.item('bed_straw', function (g) { bedIcon(g, '#e0c878', '#a8855a', '#f0e4c0', null); });
A.item('bed_wood', function (g) { bedIcon(g, '#c8a878', '#7a5a34', '#e8dcc0', null); });
A.item('bed_feather', function (g) { bedIcon(g, '#e8e4f0', '#8a6a44', '#ffffff', null); });
A.item('bed_noble', function (g) { bedIcon(g, '#c8a8d8', '#6a4a2a', '#f0e8f8', '#8a4a6a'); });

/* ==========================================================
19 · FERTILIZANTES, PIENSOS Y SEÑUELOS
========================================================== */
function fertIcon(g, col, glowCol, sparkles) {
  shadowS(g);
  if (glowCol) glow(g, 0, 1, 11, glowCol, 0.24);
  path(g, [[-9, 8], [-7, -2], [7, -2], [9, 8]], '#8a6a3a', '#5a4420', 0.9);
  blob(g, 0, -3, 6.6, 3.2, col, shade(col, 0.16));
  if (sparkles) for (let i = 0; i < sparkles; i++) spark(g, -5 + i * 4, -6 - (i % 2), 1.6, '#fff0b0');
  rr(g, -7.4, -5, 14.8, 2.4, 0.8, '#a8855a', '#6a5438', 0.6);
}
A.item('fert_manure', function (g) { fertIcon(g, '#6a4a2a', null, 0); });
A.item('fert_compost', function (g) { fertIcon(g, '#4a3a20', null, 0); });
A.item('fert_bonemeal', function (g) { fertIcon(g, '#d8d0c0', null, 0); });
A.item('fert_golden', function (g) { fertIcon(g, '#c8a840', '#f0d070', 3); });
function feedIcon(g, col, glowCol, stars) {
  shadowS(g);
  if (glowCol) glow(g, 0, 0, 11, glowCol, 0.24);
  path(g, [[-9, -1], [9, -1], [6.4, 7], [-6.4, 7]], '#b0a088', '#7a6a50', 0.9);
  ell(g, 0, -1, 9, 3, '#c8b898', '#7a6a50', 0.6);
  for (let i = 0; i < 8; i++) ell(g, -5.4 + (i % 4) * 3.6, -2 + ((i / 4) | 0) * 1.8, 1.4, 1.1, i % 2 ? col : shade(col, 0.16), shade(col, -0.35), 0.4);
  if (stars) for (let i = 0; i < stars; i++) spark(g, -4 + i * 4, -7, 1.8, '#fff0b0');
}
A.item('feed_basic', function (g) { feedIcon(g, '#c8a860', null, 0); });
A.item('feed_good', function (g) { feedIcon(g, '#8ac860', null, 1); });
A.item('feed_herb', function (g) { feedIcon(g, '#5aae7a', null, 1); });
A.item('feed_golden', function (g) { feedIcon(g, '#f0c840', '#f8e08a', 2); });
A.item('feed_tame', function (g) {
  shadowS(g);
  path(g, [[-8, 8], [-6.4, -3], [6.4, -3], [8, 8]], '#b8a078', '#8a6a44', 0.9);
  path(g, [[-6.4, -3], [6.4, -3], [4.6, -6.4], [-4.6, -6.4]], '#a89060', '#8a6a44', 0.6);
  rr(g, -5, -8.4, 10, 2.4, 0.9, '#8a6a3a', '#5a4420', 0.6);
  g.save(); g.translate(0, 2.6); g.scale(0.62, 0.62);
  g.beginPath(); g.moveTo(0, 4); g.bezierCurveTo(-6, -1, -4, -7, 0, -3); g.bezierCurveTo(4, -7, 6, -1, 0, 4);
  g.fillStyle = '#7ac04a'; g.fill(); g.restore();
  for (let i = 0; i < 5; i++) ell(g, -4.4 + i * 2.2, -1, 1, 0.8, '#d8c090');
});
A.item('meat_lure', function (g) {
  shadowS(g);
  path(g, [[-7, -2], [-2.6, -6], [4.4, -5], [8, 0], [5.4, 5], [-1.8, 6], [-6.4, 2]], '#c05a4a', '#7a3a2c', 0.9);
  path(g, [[-4.4, -1], [-0.8, -3.4], [3.4, -2.6], [5.4, 1], [2.6, 3.4], [-0.8, 3.4], [-3.4, 1]], '#d87a6a');
  ell(g, 6.4, -3.4, 1.8, 1.8, '#efe9d8', '#b8ac96', 0.5);
  curve(g, -7, -2, -10, 0, -8.4, 3, '#7a3a2c', 1.2);
  spark(g, 2, -2, 1.8, '#ffd070');
});
A.item('bait', function (g) {
  shadowS(g);
  curve(g, -5, 7, -1.8, 0, 3.4, 3.4, '#d88a9a', 3);
  curve(g, 3.4, 3.4, 7, 7, 5.4, -1.8, '#e8a0b0', 2.6);
  for (let i = 0; i < 4; i++) stroke(g, [[-4.4 + i * 2.2, 5 - i * 0.5], [-3.6 + i * 2.2, 7 - i * 0.5]], '#b06a7a', 0.6);
  ell(g, 5.4, -2.6, 1.2, 1.2, '#c06a7a');
});

/* ==========================================================
20 · MISCELÁNEOS
========================================================== */
A.item('fishing_net', function (g) {
  shadowS(g);
  stroke(g, [[-8, -8], [8, 8]], '#a8855a', 1.8);
  ell(g, 2.6, 2.6, 7, 7, null, '#c8b898', 1.1);
  g.save(); g.beginPath(); g.arc(2.6, 2.6, 7, 0, U.TAU); g.clip();
  for (let i = -2; i <= 2; i++) { stroke(g, [[2.6 + i * 2.8, -4.4], [2.6 + i * 2.8, 9.6]], '#c8b898', 0.5); stroke(g, [[-4.4, 2.6 + i * 2.8], [9.6, 2.6 + i * 2.8]], '#c8b898', 0.5); }
  g.restore();
});
A.item('lockpick', function (g) {
  shadowS(g);
  g.save(); g.rotate(0.4);
  stroke(g, [[-7, 3.4], [5.4, -7]], '#a8b0b8', 1.8);
  stroke(g, [[5.4, -7], [8, -5.4]], '#a8b0b8', 1.8);
  g.restore();
  g.save(); g.rotate(-0.2);
  stroke(g, [[-6, -1.8], [6, 1.8]], '#8a929a', 1.4);
  stroke(g, [[6, 1.8], [7, 4.4]], '#8a929a', 1.4);
  g.restore();
});
A.item('land_deed', function (g) {
  shadowS(g);
  rr(g, -8, -10, 16, 20, 1.2, '#efe6d0', '#b8ac96', 0.9);
  for (let i = 0; i < 5; i++) stroke(g, [[-5.4, -6 + i * 2.6], [5.4, -6 + i * 2.6]], '#a89870', 0.6);
  ell(g, 3.4, 6, 2.6, 2.6, '#c0392b', '#8a2418', 0.6);
  curve(g, -5.4, 7, -1.8, 5.4, 0, 7, '#8a6a44', 0.9);
});
A.item('chest_kit', function (g) {
  shadowS(g);
  rr(g, -9, -3, 18, 11, 1.4, '#a8855a', '#6a5438', 0.9);
  path(g, [[-9, -3], [-7.4, -8], [7.4, -8], [9, -3]], '#c09a6a', '#6a5438', 0.7);
  rr(g, -9, -4, 18, 2.4, 0.7, '#d9a441', '#a07820', 0.5);
  rr(g, -2.2, -3, 4.4, 4.4, 0.9, '#e8c040', '#a07820', 0.6);
});
A.item('chest_large', function (g) {
  shadowS(g);
  rr(g, -11, -4, 22, 13, 1.8, '#7a5a3a', '#4a3620', 1);
  path(g, [[-11, -4], [-8.4, -10], [8.4, -10], [11, -4]], '#9a7a4a', '#4a3620', 0.8);
  rr(g, -11, -5, 22, 2.8, 0.9, '#d9a441', '#a07820', 0.6);
  for (let i = -1; i <= 1; i++) rr(g, i * 6 - 1.1, -4, 2.2, 13, 0.5, '#5a4420');
  rr(g, -2.8, -3, 5.6, 6.4, 1.1, '#e8c040', '#a07820', 0.7);
});

/* ==========================================================
21 · ACCESORIOS
========================================================== */
A.item('ring_gold', function (g) {
  shadowS(g); glow(g, 0, 2, 10, '#f0d070', 0.2);
  ell(g, 0, 3, 6.6, 6.6, null, '#a07820', 3); ell(g, 0, 3, 6.6, 6.6, null, '#e8c040', 2);
  gem(g, 0, -4.4, 3.6, '#e04b3a');
  path(g, [[-3, -2.6], [3, -2.6], [2.2, -0.8], [-2.2, -0.8]], '#e8c040', '#a07820', 0.5);
});
A.item('ring_silver', function (g) {
  shadowS(g); glow(g, 0, 2, 10, '#bfe4f5', 0.24);
  ell(g, 0, 3, 6.6, 6.6, null, '#6a8a9a', 3); ell(g, 0, 3, 6.6, 6.6, null, '#b4d4e0', 2);
  gem(g, 0, -4.4, 3.6, '#6ac8e0');
  spark(g, 2.8, -6.4, 1.8, '#e8fbff');
});
A.item('belt_leather', function (g) {
  shadowS(g);
  rr(g, -11, -2, 22, 6, 1.8, '#8a6a44', '#5a4420', 0.9);
  rr(g, -11, -2, 22, 2.2, 1, '#a8855a');
  for (let i = 0; i < 5; i++) ell(g, -8 + i * 4, 2.4, 0.7, 0.7, '#3a2a16');
  rr(g, -3, -3, 6, 8, 1, '#d9a441', '#a07820', 0.8);
  stroke(g, [[0, -2], [0, 3]], '#a07820', 1);
});
A.item('belt_troll', function (g) {
  shadowS(g);
  rr(g, -11, -2.6, 22, 7, 1.8, '#6a4a2a', '#3a2a16', 0.9);
  rr(g, -11, -2.6, 22, 2.4, 1, '#8a6a44');
  rr(g, -4, -4.4, 8, 10, 1.8, '#c8bca8', '#8a8070', 0.9);
  path(g, [[-1.8, -1.8], [0, 3.4], [1.8, -1.8]], '#f0e8d0', '#b8ac96', 0.5);
  ell(g, 0, -2.8, 1.2, 1, '#8aa876', '#48603c', 0.4);
});
A.item('gloves_grip', function (g) {
  shadowS(g);
  path(g, [[-7, 7], [-7, -2], [-3.4, -5.4], [1.8, -5.4], [3.4, -2], [3.4, 7]], '#6a4a2a', '#3a2a16', 0.9);
  for (let i = 0; i < 3; i++) rr(g, -6 + i * 3.2, -5.4, 2.4, 4.4, 0.9, '#8a6a44', '#3a2a16', 0.5);
  rr(g, -7, 3.4, 10.4, 3.6, 0.9, '#a8855a', '#3a2a16', 0.6);
  ell(g, 1.8, 0, 1.2, 1.2, '#d9a441');
});
A.item('charm_luck', function (g) {
  shadowS(g); glow(g, 0, 1, 11, '#5aa05a', 0.24);
  ell(g, 0, 1, 8.6, 8.6, '#3a7a3a', '#245a24', 0.9);
  ell(g, 0, 1, 6.8, 6.8, '#4a9a4a', '#2e7a2e', 0.5);
  for (let i = 0; i < 4; i++) {
    const a = i / 4 * U.TAU + PI / 4;
    const x = cos(a) * 3, y = 1 + sin(a) * 3;
    path(g, [[x, y], [x + cos(a - 0.9) * 4, y + sin(a - 0.9) * 4], [x + cos(a) * 4.6, y + sin(a) * 4.6], [x + cos(a + 0.9) * 4, y + sin(a + 0.9) * 4]], '#8ae08a', '#2e7a2e', 0.4);
  }
  rr(g, -1.8, -10, 3.6, 3, 0.9, '#d9a441', '#a07820', 0.5);
});
A.item('charm_beast', function (g) {
  shadowS(g); glow(g, 0, 1, 11, '#c8a8f8', 0.24);
  ell(g, 0, 1, 8.4, 8.4, '#6a4a8a', '#4a2a6a', 0.9);
  ell(g, 0, 1, 6.2, 6.2, '#8a6aa8', '#4a2a6a', 0.5);
  ell(g, -1.8, -0.4, 1.2, 1.8, '#e8d8ff'); ell(g, 1.8, -0.4, 1.2, 1.8, '#e8d8ff');
  path(g, [[-3, 3.4], [0, 5.4], [3, 3.4]], '#e8d8ff', null, 1.1);
  rr(g, -1.8, -10, 3.6, 3, 0.9, '#d9a441', '#a07820', 0.5);
});
A.item('amulet_frost', function (g) {
  shadowS(g); glow(g, 0, 3, 11, '#bfe4f5', 0.3);
  curve(g, -7, -9, 0, -2, 7, -9, '#b4d4e0', 1.2);
  for (let i = 0; i < 6; i++) { const t = i / 5; ell(g, -7 + t * 14, -9 + sin(t * PI) * 6, 0.9, 0.9, '#dce8f8'); }
  path(g, [[0, -2], [4, 2.6], [0, 7.4], [-4, 2.6]], '#8fd0f0', '#3a8aa4', 0.9);
  path(g, [[0, -2], [1.8, 2.6], [0, 5.4], [-1.8, 2.6]], '#e8f8ff');
});
A.item('amulet_regen', function (g) {
  shadowS(g); glow(g, 0, 3, 11, '#ff9a40', 0.34);
  curve(g, -7, -9, 0, -2, 7, -9, '#d9a441', 1.2);
  ell(g, 0, 3.4, 5, 5.6, '#e8c040', '#a07820', 0.9);
  ell(g, 0, 3.4, 3.2, 3.8, '#e07030', '#a04818', 0.5);
  ell(g, 0, 3.4, 1.4, 1.8, '#ffe08a');
});
A.item('boots_swift', function (g) {
  shadowS(g);
  path(g, [[-7, -7], [-1.8, -7], [-1.8, 2], [5.4, 3.4], [5.4, 7], [-7, 7]], '#8a6a44', '#5a4420', 0.9);
  path(g, [[-7, 3.4], [5.4, 5.4], [5.4, 7], [-7, 7]], '#5a4420');
  stroke(g, [[-5.4, -5], [-3.6, -5]], '#a8855a', 0.9);
  path(g, [[5.4, -3.4], [10, -5], [7, 0]], '#cfe8ff', '#8fb0d0', 0.6);
  path(g, [[5.4, 1], [11, -0.6], [8, 4]], '#cfe8ff', '#8fb0d0', 0.6);
});
A.item('cloak_shadow', function (g) {
  shadowS(g);
  path(g, [[-7, -9], [7, -9], [9, 8], [3.4, 6], [0, 9], [-3.4, 6], [-9, 8]], '#2a2038', '#14101e', 0.9);
  path(g, [[-7, -9], [7, -9], [6, -5], [-6, -5]], '#402e56');
  ell(g, 0, -7.4, 2.8, 1.8, '#14101e');
  g.save(); g.globalAlpha = 0.4; ell(g, -2.6, 0, 2.8, 5.4, '#5a4a78'); g.restore();
});

/* ==========================================================
22 · LEGENDARIOS
========================================================== */
A.item('dragonblade', function (g) {
  shadowS(g); glow(g, 0, -2, 14, '#ff7a30', 0.3);
  g.save(); g.rotate(0.32);
  path(g, [[-2, -3], [2, -3], [1.4, -13], [0, -16], [-1.4, -13]], '#c8402a', '#7a1e12', 0.8);
  stroke(g, [[0, -4], [0, -14]], '#ffb040', 0.9);
  rr(g, -6, -3.4, 12, 2.4, 0.9, '#7a1e12', '#3a0e08', 0.6);
  rr(g, -1.4, -1, 2.8, 8, 1, '#3a2010', '#1a1008', 0.6);
  ell(g, 0, 8, 2, 2, '#e8c040', '#a07820', 0.5);
  g.restore();
  flame(g, 7, -9, 5, 2, '#ff8a30', 0.4, 2);
});
A.item('fenrir_bow', function (g) {
  shadowS(g); glow(g, 0, 0, 13, '#9a6ae0', 0.28);
  curve(g, -7, -11, 10, 0, -7, 11, '#241a30', 2.6);
  curve(g, -7, -11, 9, 0, -7, 11, '#5a4a78', 0.9);
  stroke(g, [[-7, -11], [-2.6, 0], [-7, 11]], '#c8a8ff', 0.8);
  for (let i = -1; i <= 1; i++) path(g, [[-7, i * 5 - 1.8], [-10.6, i * 5], [-7, i * 5 + 1.8]], '#402e56', '#14101e', 0.4);
  spark(g, 3.4, -3.4, 2, '#c8a8ff');
});
A.item('jotun_shield', function (g) {
  shadowS(g); glow(g, 0, 0, 13, '#bfe4f5', 0.3);
  rr(g, -8, -11, 16, 22, 2.6, '#a8d8ec', '#5a90b0', 1.3);
  rr(g, -8, -11, 16, 7, 2.6, '#d8f0ff');
  path(g, [[0, -7], [4.4, -2], [0, 7], [-4.4, -2]], '#8fd0f0', '#3a8aa4', 0.9);
  for (let i = -1; i <= 1; i++) path(g, [[i * 5.4 - 1, 9], [i * 5.4, 11.6], [i * 5.4 + 1, 9]], '#ffffff');
  spark(g, 0, -2, 2.8, '#ffffff');
});
A.item('basilisk_gaze', function (g) {
  shadowS(g); glow(g, 0, 1, 13, '#96f04a', 0.34);
  ell(g, 0, 1, 9, 9, '#5a8a4a', '#2e5228', 1.1);
  ell(g, 0, 1, 6.4, 6.4, '#c8e04a', '#5a8a4a', 0.7);
  ell(g, 0, 1, 2.2, 6, '#1a1408');
  g.save(); g.globalAlpha = 0.5; ell(g, -2.6, -1.8, 2.2, 1.8, '#ffffff'); g.restore();
  for (let i = 0; i < 8; i++) { const a = i / 8 * U.TAU; stroke(g, [[cos(a) * 6.4, 1 + sin(a) * 6.4], [cos(a) * 8.8, 1 + sin(a) * 8.8]], '#7aa03a', 0.6); }
});

/* ==========================================================
23 · TOKENS DE ANIMAL (retrato en medallón)
========================================================== */
['chicken', 'duck', 'rabbit', 'sheep', 'pig', 'nanny', 'goat', 'cow', 'alpaca', 'horse'].forEach(function (sp) {
  A.item('animal_' + sp, function (g) {
    shadowS(g);
    ell(g, 0, 1, 11, 11, '#8a6a3a', '#5a4420', 1.1);
    ell(g, 0, 1, 9.6, 9.6, '#c8a868', '#8a6a3a', 0.7);
    g.save(); g.beginPath(); g.arc(0, 1, 8.6, 0, U.TAU); g.clip();
    ell(g, 0, 1, 8.6, 8.6, '#efe6d0');
    g.save(); g.globalAlpha = 0.35; ell(g, 0, 8, 8, 3, '#c8b898'); g.restore();
    if (typeof creatureMini === 'function') creatureMini(g, sp, -1, 5.6, 0.34);
    g.restore();
    for (let i = 0; i < 12; i++) { const a = i / 12 * U.TAU; ell(g, cos(a) * 10.2, 1 + sin(a) * 10.2, 0.6, 0.6, '#e8c88a'); }
    g.save(); g.globalAlpha = 0.4; curve(g, -6, -6, 0, -10, 6, -6, '#fff8e0', 1.2); g.restore();
  });
});
/* ==========================================================
14 · GLIFOS DE INTERFAZ
========================================================== */
const G = A.glyph;
function gold(g, x, y, r) { ell(g, x, y, r, r, '#e8c040', '#a07820', 1); ell(g, x, y, r * 0.66, r * 0.66, null, '#f8e08a', 0.8); }
G('coin', function (g) {
gold(g, 0, 0, 10);
ell(g, 0, 0, 3.4, 3.4, '#f8e08a');
for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; stroke(g, [[cos(a) * 4.4, sin(a) * 4.4], [cos(a) * 6.4, sin(a) * 6.4]], '#c89820', 1); }
});
G('debt', function (g) {
for (let i = -1; i <= 1; i++) {
g.save(); g.translate(i * 7, i * 3); g.rotate(0.5);
ell(g, 0, 0, 4.4, 3.2, null, '#8a8a92', 2.4);
ell(g, 0, 0, 4.4, 3.2, null, '#c8ccd0', 1);
g.restore();
}
});
G('chain_broken', function (g) {
g.save(); g.translate(-6, -3); g.rotate(0.5); ell(g, 0, 0, 4.4, 3.2, null, '#c8ccd0', 2.2); g.restore();
g.save(); g.translate(6, 4); g.rotate(0.5); ell(g, 0, 0, 4.4, 3.2, null, '#c8ccd0', 2.2); g.restore();
spark(g, 0, 0, 5, '#f3cf7a');
stroke(g, [[-2, -6], [1, -2]], '#f3cf7a', 1.4); stroke(g, [[2, 2], [5, 6]], '#f3cf7a', 1.4);
});
G('heart', function (g) {
g.save(); g.scale(1.7, 1.7);
g.beginPath(); g.moveTo(0, 5); g.bezierCurveTo(-7, -1, -5, -8, 0, -4); g.bezierCurveTo(5, -8, 7, -1, 0, 5);
g.fillStyle = '#e04b3a'; g.fill(); g.strokeStyle = '#8a2418'; g.lineWidth = 0.7; g.stroke();
g.restore();
g.save(); g.globalAlpha = 0.5; ell(g, -3.4, -3.4, 2, 1.6, '#ffb0a8'); g.restore();
});
G('stamina', function (g) {
path(g, [[2, -12], [-6, 1], [-1, 1], [-3, 12], [7, -2], [1, -2]], '#f0c040', '#a07820', 1);
path(g, [[1, -10], [-3, -1], [0, -1]], '#fff0b0');
});
G('food', function (g) {
path(g, [[-8, -2], [-3, -8], [5, -7], [9, 0], [6, 7], [-3, 8], [-8, 3]], '#b07a3a', '#7a4a18', 1);
rr(g, 3, -11, 4, 8, 1.6, '#efe9d8', '#b8ac96', 0.8);
stroke(g, [[-5, 0], [4, -1]], '#8a5a20', 1);
});
G('sun', function (g) {
ell(g, 0, 0, 6, 6, '#f8d040', '#c89820', 1);
for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; stroke(g, [[cos(a) * 8, sin(a) * 8], [cos(a) * 12, sin(a) * 12]], '#f0c040', 1.8); }
});
G('moon', function (g) {
g.save(); g.beginPath(); g.arc(0, 0, 9, 0, TAU); g.fillStyle = '#dce8f8'; g.fill();
g.globalCompositeOperation = 'destination-out'; g.beginPath(); g.arc(5, -3, 8, 0, TAU); g.fill(); g.restore();
ell(g, -4, 4, 1.2, 1.2, '#b8c8e0'); ell(g, -6, -2, 0.9, 0.9, '#b8c8e0');
});
G('dusk', function (g) {
ell(g, 0, 3, 7, 7, '#f0a040', '#c06818', 1);
for (let i = 0; i < 5; i++) { const a = PI + i / 4 * PI; stroke(g, [[cos(a) * 9, 3 + sin(a) * 9], [cos(a) * 12, 3 + sin(a) * 12]], '#f0c060', 1.4); }
stroke(g, [[-12, 6], [12, 6]], '#8a6a4a', 2);
});
G('rain', function (g) {
ell(g, -4, -3, 6, 4.4, '#b8c8d8'); ell(g, 3, -4, 7, 5, '#d0dce8'); ell(g, 0, -1, 8, 4, '#c8d4e0');
for (let i = -1; i <= 1; i++) stroke(g, [[i * 5, 3], [i * 5 - 2, 10]], '#5aa7e0', 1.8);
});
G('wind', function (g) {
curve(g, -11, -4, 0, -8, 8, -4, '#bfe4f5', 2); curve(g, 8, -4, 11, -1, 7, 0, '#bfe4f5', 2);
curve(g, -11, 2, 0, -2, 6, 2, '#9ad0e8', 2);
curve(g, -9, 8, -2, 4, 4, 8, '#7ab8d8', 2);
});
G('snow', function (g) {
for (let i = 0; i < 6; i++) {
const a = i / 6 * TAU;
stroke(g, [[0, 0], [cos(a) * 11, sin(a) * 11]], '#dce8f8', 1.6);
stroke(g, [[cos(a) * 7, sin(a) * 7], [cos(a + 0.5) * 10, sin(a + 0.5) * 10]], '#dce8f8', 1.2);
stroke(g, [[cos(a) * 7, sin(a) * 7], [cos(a - 0.5) * 10, sin(a - 0.5) * 10]], '#dce8f8', 1.2);
}
});
G('attack', function (g) {
for (let s = -1; s <= 1; s += 2) {
g.save(); g.rotate(s * 0.7);
path(g, [[-1.4, 8], [1.4, 8], [1, -8], [0, -11], [-1, -8]], s < 0 ? '#c8ccd0' : '#e8ecf0', '#7a7e82', 0.8);
rr(g, -4, 6, 8, 2, 0.8, '#8a6a44', '#5a4420', 0.6);
rr(g, -1.2, 8, 2.4, 4, 0.8, '#6a4a2a');
g.restore();
}
});
G('interact', function (g) {
path(g, [[-6, 10], [-7, -2], [-4, -3], [-3, 2], [-3, -8], [0, -9], [1, 2], [1, -8], [4, -8], [4, 2], [4, -5], [7, -5], [7, 6], [4, 10]], '#e8c8a8', '#b08a68', 1);
stroke(g, [[-3, 2], [-3, 5]], '#c8a888', 0.6);
});
G('roll', function (g) {
g.strokeStyle = '#d9a441'; g.lineWidth = 2.4; g.lineCap = 'round';
g.beginPath(); g.arc(0, 0, 8, 0.6, TAU - 0.4); g.stroke();
path(g, [[6, -8], [11, -5], [5, -2]], '#d9a441');
});
G('mount', function (g) {
g.strokeStyle = '#c8a068'; g.lineWidth = 3.4; g.lineCap = 'round';
g.beginPath(); g.arc(0, -1, 8, PI * 0.15, PI * 0.85, true); g.stroke();
stroke(g, [[-7.4, 3], [-8, 9]], '#c8a068', 3.4); stroke(g, [[7.4, 3], [8, 9]], '#c8a068', 3.4);
for (let i = 0; i < 5; i++) { const a = PI + 0.4 + i / 4 * (PI - 0.8); ell(g, cos(a) * 8, -1 + sin(a) * 8, 1, 1, '#8a6a3a'); }
});
G('sprint', function (g) {
path(g, [[-2, -10], [4, -10], [5, 0], [9, 4], [9, 8], [-2, 8]], '#e8d8b8', '#a89878', 1);
rr(g, -2, 6, 11, 3, 1, '#6a4a2a', '#3a2a16', 0.7);
for (let i = 0; i < 3; i++) stroke(g, [[-12, -6 + i * 6], [-5, -6 + i * 6]], '#bfe4f5', 1.6);
});
G('pause', function (g) { rr(g, -7, -9, 5, 18, 1.6, '#e8dcc0', '#a89870', 0.8); rr(g, 2, -9, 5, 18, 1.6, '#e8dcc0', '#a89870', 0.8); });
G('play', function (g) { path(g, [[-6, -10], [10, 0], [-6, 10]], '#e8dcc0', '#a89870', 1); });
G('close', function (g) { stroke(g, [[-8, -8], [8, 8]], '#e8dcc0', 3); stroke(g, [[8, -8], [-8, 8]], '#e8dcc0', 3); });
G('check', function (g) { stroke(g, [[-9, 1], [-3, 8], [9, -8]], '#3fbf6f', 3.2); });
G('cross', function (g) { stroke(g, [[-7, -7], [7, 7]], '#e04b3a', 3); stroke(g, [[7, -7], [-7, 7]], '#e04b3a', 3); });
G('star', function (g) { star5(g, 0, 0, 11, '#f3cf7a', '#a07820'); });
G('star_empty', function (g) { const p = []; for (let i = 0; i < 10; i++) { const a = -PI / 2 + i * PI / 5, r = i % 2 ? 4.8 : 11; p.push([cos(a) * r, sin(a) * r]); } path(g, p, null, '#8a7a5a', 1.2); });
G('bag', function (g) {
blob(g, 0, 2, 9.4, 10, '#8a6a44', '#b08a5c');
rr(g, -8, -7, 16, 6, 2.4, '#6a4a2a', '#4a3620', 0.8);
rr(g, -5, 0, 10, 6, 1.6, '#a8855a', '#5e4628', 0.7);
ell(g, 0, 3, 1.4, 1.4, '#d9a441');
curve(g, -7, -6, -10, 2, -7, 8, '#5e4628', 1.6); curve(g, 7, -6, 10, 2, 7, 8, '#5e4628', 1.6);
});
G('craft', function (g) {
g.save(); g.rotate(-0.5);
stroke(g, [[0, 11], [0, -4]], '#a07840', 2.6);
rr(g, -6, -10, 12, 6, 1.4, '#a8b0b8', '#6a727a', 1);
rr(g, -6, -10, 12, 2.2, 1, '#d4dae0');
g.restore();
spark(g, 8, -8, 3, '#f3cf7a');
});
G('build', function (g) {
rr(g, -11, 2, 10, 6, 1, '#b08a5c', '#7a5a34', 0.8);
rr(g, -1, 2, 10, 6, 1, '#c89a6a', '#7a5a34', 0.8);
rr(g, -6, -4, 10, 6, 1, '#b08a5c', '#7a5a34', 0.8);
g.save(); g.rotate(0.6);
path(g, [[-3, -4], [3, -4], [0, 6]], '#c8ccd0', '#7a7e82', 0.8);
stroke(g, [[0, -4], [0, -11]], '#8a6a44', 2.2);
g.restore();
});
G('map', function (g) {
path(g, [[-11, -8], [-4, -10], [4, -8], [11, -10], [11, 8], [4, 10], [-4, 8], [-11, 10]], '#e8dcc0', '#a89870', 1);
stroke(g, [[-4, -10], [-4, 8]], '#c8b898', 0.8); stroke(g, [[4, -8], [4, 10]], '#c8b898', 0.8);
curve(g, -8, 2, -2, -4, 6, 2, '#a07840', 1.2);
ell(g, 6, 2, 2.4, 2.4, '#e04b3a', '#8a2418', 0.7);
});
G('social', function (g) {
ell(g, -5, -3, 4.4, 4.4, '#e8c8a8', '#b08a68', 0.8);
path(g, [[-11, 10], [-10, 3], [-1, 3], [0, 10]], '#5a7a9a', '#3a5a7a', 0.8);
ell(g, 5, -4, 4.4, 4.4, '#f0d8c0', '#c0a088', 0.8);
path(g, [[0, 10], [1, 2], [10, 2], [11, 10]], '#9a5a7a', '#7a3a5a', 0.8);
});
G('settings', function (g) {
for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; g.save(); g.rotate(a); rr(g, -2.4, -12, 4.8, 5, 1, '#c8b898', '#8a7a5a', 0.6); g.restore(); }
ell(g, 0, 0, 8, 8, '#e8dcc0', '#8a7a5a', 1);
ell(g, 0, 0, 3.4, 3.4, '#3a2e1a', '#8a7a5a', 0.8);
});
G('help', function (g) {
ell(g, 0, 0, 11, 11, '#2e5a7a', '#1e3a5a', 1);
g.strokeStyle = '#dce8f8'; g.lineWidth = 2.4; g.lineCap = 'round';
g.beginPath(); g.arc(0, -3, 3.6, PI * 0.9, PI * 2.3); g.stroke();
stroke(g, [[1.6, -0.6], [0, 3]], '#dce8f8', 2.4);
ell(g, 0, 7, 1.4, 1.4, '#dce8f8');
});
G('save', function (g) {
rr(g, -10, -6, 20, 14, 2, '#a07840', '#6a4a20', 1);
path(g, [[-10, -6], [-8, -10], [8, -10], [10, -6]], '#c89a60', '#6a4a20', 0.8);
rr(g, -10, -2, 20, 2.6, 0.8, '#d9a441', '#a07820', 0.6);
rr(g, -2.4, -1, 4.8, 5, 1, '#e8c040', '#a07820', 0.7);
ell(g, 0, 2, 1, 1, '#6a4a20');
});
G('export', function (g) {
path(g, [[-10, 2], [-10, 9], [10, 9], [10, 2]], null, '#c8b898', 2.2);
stroke(g, [[0, 5], [0, -10]], '#3fbf6f', 2.6);
path(g, [[-5, -5], [0, -11], [5, -5]], '#3fbf6f');
});
G('trash', function (g) {
path(g, [[-8, -5], [8, -5], [6, 10], [-6, 10]], '#8a8a92', '#5a5a62', 1);
rr(g, -9.4, -8, 18.8, 3, 1.2, '#a8a8b0', '#5a5a62', 0.8);
rr(g, -3, -11, 6, 3, 1, '#a8a8b0', '#5a5a62', 0.7);
for (let i = -1; i <= 1; i++) stroke(g, [[i * 3.4, -2], [i * 3, 7]], '#5a5a62', 1);
});
G('quit', function (g) {
rr(g, -10, -10, 11, 20, 1.6, '#8a6a44', '#5a4420', 1);
ell(g, -1.4, 0, 1.2, 1.2, '#d9a441');
stroke(g, [[0, 0], [10, 0]], '#e04b3a', 2.4);
path(g, [[5, -5], [11, 0], [5, 5]], '#e04b3a');
});
G('sound_on', function (g) {
path(g, [[-9, -4], [-4, -4], [2, -9], [2, 9], [-4, 4], [-9, 4]], '#e8dcc0', '#a89870', 1);
for (let i = 0; i < 3; i++) { g.strokeStyle = '#f3cf7a'; g.lineWidth = 1.6; g.beginPath(); g.arc(3, 0, 4 + i * 3.4, -0.9, 0.9); g.stroke(); }
});
G('sound_off', function (g) {
path(g, [[-9, -4], [-4, -4], [2, -9], [2, 9], [-4, 4], [-9, 4]], '#a89870', '#6a5a3a', 1);
stroke(g, [[5, -5], [11, 5]], '#e04b3a', 2.4); stroke(g, [[11, -5], [5, 5]], '#e04b3a', 2.4);
});
G('music', function (g) {
ell(g, -4, 7, 4, 3.2, '#e8dcc0', '#a89870', 0.8);
ell(g, 7, 4, 4, 3.2, '#e8dcc0', '#a89870', 0.8);
stroke(g, [[0, 6], [0, -9]], '#e8dcc0', 1.8); stroke(g, [[11, 3], [11, -12]], '#e8dcc0', 1.8);
path(g, [[0, -9], [11, -12], [11, -8], [0, -5]], '#f3cf7a', '#a89870', 0.6);
});
G('male', function (g) {
ell(g, -2, 3, 6.4, 6.4, null, '#5aa7e0', 2.4);
stroke(g, [[3, -2], [9, -8]], '#5aa7e0', 2.4);
path(g, [[3, -9], [10, -9], [10, -2]], null, '#5aa7e0', 2.4);
});
G('female', function (g) {
ell(g, 0, -3, 6.4, 6.4, null, '#e08ab0', 2.4);
stroke(g, [[0, 3], [0, 11]], '#e08ab0', 2.4);
stroke(g, [[-4, 7], [4, 7]], '#e08ab0', 2.4);
});
G('seed', function (g) {
path(g, [[-9, 6], [9, 6], [7, 10], [-7, 10]], '#6a4a2a', '#3a2a16', 0.8);
stroke(g, [[0, 6], [0, -4]], '#4a9a3a', 1.8);
path(g, [[0, -2], [-7, -5], [-6, 1], [0, 1]], '#5aae4a', '#2e7a2a', 0.6);
path(g, [[0, -4], [7, -8], [6, -2], [0, -2]], '#6abe5a', '#2e7a2a', 0.6);
});
G('water', function (g) {
path(g, [[0, -11], [6, -1], [7, 4], [0, 10], [-7, 4], [-6, -1]], '#5aa7e0', '#2e6f9e', 1);
g.save(); g.globalAlpha = 0.5; ell(g, -2, 3, 2, 3, '#bfe4f5'); g.restore();
});
G('fert', function (g) { spark(g, 0, 0, 10, '#f3cf7a'); spark(g, -7, -7, 3.4, '#fff0b0'); spark(g, 7, 6, 3, '#fff0b0'); });
G('feed', function (g) {
path(g, [[-10, -1], [10, -1], [7, 8], [-7, 8]], '#b0a088', '#7a6a50', 1);
ell(g, 0, -1, 10, 3.4, '#c8b898', '#7a6a50', 0.7);
for (let i = 0; i < 5; i++) ell(g, -6 + i * 3, -2, 1.6, 1.3, '#c8a860', '#8a6a3a', 0.4);
});
G('fish', function (g) {
path(g, [[-9, 0], [-4, -5], [4, -4], [8, 0], [4, 4], [-4, 5]], '#8a9a6a', '#5a6a3a', 1);
path(g, [[8, 0], [12, -5], [11, 0], [12, 5]], '#7a8a5a', '#5a6a3a', 0.8);
eye(g, -6, -1, 1.2, '#1a1408');
});
G('tame', function (g) {
ell(g, 0, 4, 6, 5, '#c8a888', '#8a6a4a', 0.8);
for (let i = -1; i <= 1; i++) ell(g, i * 4.4, -3, 2.2, 2.6, '#c8a888', '#8a6a4a', 0.7);
g.save(); g.translate(7, -7); g.scale(0.7, 0.7);
g.beginPath(); g.moveTo(0, 5); g.bezierCurveTo(-7, -1, -5, -8, 0, -4); g.bezierCurveTo(5, -8, 7, -1, 0, 5);
g.fillStyle = '#ff8ab0'; g.fill(); g.restore();
});
G('boss', function (g) {
blob(g, 0, -1, 9, 9, '#e8e8dc', '#f8f8f0');
path(g, [[-5, 6], [5, 6], [4, 11], [-4, 11]], '#d8d8c8', '#b8b8a8', 0.8);
for (let i = -1; i <= 1; i++) stroke(g, [[i * 3, 6], [i * 3, 11]], '#b8b8a8', 0.7);
ell(g, -3.6, -1, 2.6, 3, '#1a1a20'); ell(g, 3.6, -1, 2.6, 3, '#1a1a20');
glow(g, -3.6, -1, 4, '#e04b3a', 0.5); glow(g, 3.6, -1, 4, '#e04b3a', 0.5);
path(g, [[0, 2], [1.6, 5], [-1.6, 5]], '#b8b8a8');
});
G('warning', function (g) {
path(g, [[0, -11], [12, 10], [-12, 10]], '#f0c040', '#a07820', 1.2);
rr(g, -1.6, -4, 3.2, 8, 1.2, '#3a2e1a');
ell(g, 0, 7, 1.6, 1.6, '#3a2e1a');
});
G('info', function (g) {
ell(g, 0, 0, 11, 11, '#2e5a7a', '#1e3a5a', 1);
ell(g, 0, -6, 1.6, 1.6, '#dce8f8');
rr(g, -1.6, -2, 3.2, 9, 1.2, '#dce8f8');
});
G('lock', function (g) {
g.strokeStyle = '#a8a8b0'; g.lineWidth = 2.4; g.beginPath(); g.arc(0, -3, 5, PI, 0); g.stroke();
rr(g, -8, -3, 16, 12, 2, '#c8b898', '#8a7a5a', 1);
ell(g, 0, 2, 2, 2, '#5a4a2a'); rr(g, -1, 2, 2, 4, 0.6, '#5a4a2a');
});
G('key', function (g) {
ell(g, -5, -4, 5, 5, null, '#e8c040', 2.6);
stroke(g, [[-2, 0], [8, 10]], '#e8c040', 2.6);
stroke(g, [[5, 7], [8, 4]], '#e8c040', 2.2);
stroke(g, [[8, 10], [11, 7]], '#e8c040', 2.2);
});
G('plus', function (g) { stroke(g, [[0, -9], [0, 9]], '#3fbf6f', 3); stroke(g, [[-9, 0], [9, 0]], '#3fbf6f', 3); });
G('minus', function (g) { stroke(g, [[-9, 0], [9, 0]], '#e04b3a', 3); });
G('arrow_left', function (g) { stroke(g, [[6, -8], [-4, 0], [6, 8]], '#e8dcc0', 2.6); });
G('arrow_right', function (g) { stroke(g, [[-6, -8], [4, 0], [-6, 8]], '#e8dcc0', 2.6); });
G('arrow_up', function (g) { stroke(g, [[-8, 5], [0, -5], [8, 5]], '#e8dcc0', 2.6); });
G('arrow_down', function (g) { stroke(g, [[-8, -5], [0, 5], [8, -5]], '#e8dcc0', 2.6); });
G('upgrade', function (g) {
ell(g, 0, 0, 11, 11, '#3fbf6f22', '#3fbf6f', 1.4);
stroke(g, [[-6, 3], [0, -4], [6, 3]], '#3fbf6f', 2.6);
stroke(g, [[-6, 8], [0, 1], [6, 8]], '#8fe08f', 2);
});
G('chest', function (g) {
rr(g, -10, -3, 20, 12, 1.6, '#a07840', '#6a4a20', 1);
path(g, [[-10, -3], [-9, -9], [9, -9], [10, -3]], '#c89a60', '#6a4a20', 0.9);
rr(g, -10, -4, 20, 2.6, 0.8, '#d9a441', '#a07820', 0.6);
rr(g, -2.4, -3, 4.8, 6, 1, '#e8c040', '#a07820', 0.7);
ell(g, 0, 0, 1, 1, '#6a4a20');
});
G('bed', function (g) {
rr(g, -11, -2, 22, 8, 1.6, '#8a6a44', '#5a4420', 1);
rr(g, -11, -6, 8, 5, 1.6, '#e8dcc0', '#a89870', 0.8);
rr(g, -3, -4, 14, 4, 1.4, '#9a5a7a', '#7a3a5a', 0.7);
stroke(g, [[-11, 6], [-11, 10]], '#5a4420', 2); stroke(g, [[11, 6], [11, 10]], '#5a4420', 2);
});
G('gift', function (g) {
rr(g, -9, -3, 18, 12, 1.4, '#9a5a7a', '#7a3a5a', 1);
rr(g, -10, -6, 20, 4, 1.2, '#b06a8a', '#7a3a5a', 0.8);
rr(g, -2, -6, 4, 15, 0.8, '#f3cf7a', '#a07820', 0.6);
curve(g, -2, -6, -8, -12, -2, -8, '#f3cf7a', 1.8);
curve(g, 2, -6, 8, -12, 2, -8, '#f3cf7a', 1.8);
});
G('quest', function (g) {
rr(g, -8, -10, 16, 20, 1.4, '#e8dcc0', '#a89870', 1);
ell(g, 0, -10, 8, 2.4, '#d8c8a8', '#a89870', 0.7);
ell(g, 0, 10, 8, 2.4, '#d8c8a8', '#a89870', 0.7);
for (let i = 0; i < 4; i++) stroke(g, [[-5, -5 + i * 3.4], [5, -5 + i * 3.4]], '#a89870', 0.8);
ell(g, 4, 6, 2.6, 2.6, '#c0392b', '#8a2418', 0.6);
});
G('bank', function (g) {
path(g, [[-12, -4], [0, -11], [12, -4]], '#d8cfae', '#8a8468', 1);
for (let i = -1; i <= 1; i++) rr(g, i * 6 - 1.8, -4, 3.6, 12, 0.8, '#e8e0c8', '#8a8468', 0.7);
rr(g, -12, 8, 24, 3.4, 1, '#c8c0a0', '#8a8468', 0.8);
gold(g, 0, -6, 2.4);
});
G('shop', function (g) {
path(g, [[-11, -3], [11, -3], [9, 9], [-9, 9]], '#b08a5c', '#7a5a34', 1);
for (let i = 0; i < 5; i++) path(g, [[-11 + i * 4.4, -3], [-11 + (i + 1) * 4.4, -3], [-11 + (i + 1) * 4.4, -8], [-11 + i * 4.4, -8]], i % 2 ? '#d8483a' : '#f0e0c0', '#8a6a3a', 0.5);
ell(g, -4, 3, 2, 1.8, '#e07030'); ell(g, 1, 3, 2, 1.8, '#d84040'); ell(g, 5, 3, 2, 1.8, '#70b040');
});
G('stall', function (g) {
path(g, [[-10, -1], [10, -1], [8, 9], [-8, 9]], '#b08a4a', '#7a5a2a', 1);
for (let i = -1; i <= 1; i++) stroke(g, [[i * 4.4, -1], [i * 3.6, 9]], '#8a6a3a', 0.7);
curve(g, -8, -1, 0, -11, 8, -1, '#8a6a3a', 1.6);
ell(g, -3, -2, 2.2, 2, '#d84040'); ell(g, 3, -2.4, 2.2, 2, '#e8a830'); ell(g, 0, -3.4, 2, 1.8, '#70b040');
});
G('parcel', function (g) {
path(g, [[0, -8], [12, 0], [0, 8], [-12, 0]], '#8a6a44', '#5a4420', 1.2);
path(g, [[0, -5], [8, 0], [0, 5], [-8, 0]], '#6fae4e', '#4a8a30', 0.7);
stroke(g, [[8, -2], [8, -12]], '#a07840', 1.6);
path(g, [[8, -12], [14, -10], [8, -7]], '#d9a441', '#a07820', 0.6);
});
G('slave', function (g) {
ell(g, 0, -2, 7, 7, null, '#8a8a92', 3);
ell(g, 0, -2, 7, 7, null, '#c8ccd0', 1.2);
for (let i = 0; i < 3; i++) ell(g, 0, 6 + i * 3.4, 2, 1.6, null, '#a8a8b0', 1.4);
});
G('family', function (g) {
ell(g, -6, -4, 3.6, 3.6, '#e8c8a8', '#b08a68', 0.7);
path(g, [[-11, 9], [-10, 1], [-2, 1], [-1, 9]], '#5a7a9a', '#3a5a7a', 0.7);
ell(g, 6, -4, 3.6, 3.6, '#f0d8c0', '#c0a088', 0.7);
path(g, [[1, 9], [2, 1], [10, 1], [11, 9]], '#9a5a7a', '#7a3a5a', 0.7);
ell(g, 0, 3, 2.6, 2.6, '#f0d0b0', '#c0a088', 0.7);
path(g, [[-3.4, 11], [-3, 6], [3, 6], [3.4, 11]], '#c8a868', '#8a6a3a', 0.7);
});
G('rings', function (g) {
ell(g, -4, 1, 6.4, 6.4, null, '#e8c040', 2.4);
ell(g, 4, 1, 6.4, 6.4, null, '#f0d070', 2.4);
gem(g, -4, -6, 2.4, '#e04b3a'); gem(g, 4, -6, 2.4, '#5aa7e0');
});
G('child', function (g) {
ell(g, 0, -5, 4.4, 4.4, '#f0d0b0', '#c0a088', 0.8);
path(g, [[-5, 10], [-4, 0], [4, 0], [5, 10]], '#c8a868', '#8a6a3a', 0.8);
ell(g, -1.6, -5.4, 0.8, 0.8, '#3a2a1a'); ell(g, 1.6, -5.4, 0.8, 0.8, '#3a2a1a');
});
G('baby', function (g) {
blob(g, 0, 3, 9, 6.4, '#dce8f8', '#f0f8ff');
ell(g, -4, -3, 4.4, 4.4, '#f0d0b0', '#c0a088', 0.8);
ell(g, -5.4, -3.4, 0.8, 0.8, '#3a2a1a'); ell(g, -2.6, -3.4, 0.8, 0.8, '#3a2a1a');
curve(g, -5, -1, -4, 0, -3, -1, '#c08878', 0.7);
stroke(g, [[-2, 2], [6, 4]], '#b8c8e0', 1);
});
G('crown', function (g) {
path(g, [[-11, 6], [-9, -7], [-5, 0], [0, -9], [5, 0], [9, -7], [11, 6]], '#e8c040', '#a07820', 1.2);
rr(g, -11, 6, 22, 3.4, 1, '#f0d070', '#a07820', 0.8);
ell(g, 0, 2, 1.8, 1.8, '#e04b3a'); ell(g, -6, 3, 1.2, 1.2, '#5aa7e0'); ell(g, 6, 3, 1.2, 1.2, '#3fbf6f');
});
G('compass', function (g) {
ell(g, 0, 0, 11, 11, '#2e2a1a', '#a89870', 1.2);
path(g, [[0, -8], [2.4, 0], [0, 8], [-2.4, 0]], '#e8dcc0');
path(g, [[0, -8], [2.4, 0], [0, 0]], '#e04b3a');
ell(g, 0, 0, 1.6, 1.6, '#d9a441');
});
G('target', function (g) {
ell(g, 0, 0, 9, 9, null, '#e04b3a', 1.6);
ell(g, 0, 0, 4, 4, null, '#e04b3a', 1.4);
stroke(g, [[0, -13], [0, -6]], '#e04b3a', 1.6); stroke(g, [[0, 6], [0, 13]], '#e04b3a', 1.6);
stroke(g, [[-13, 0], [-6, 0]], '#e04b3a', 1.6); stroke(g, [[6, 0], [13, 0]], '#e04b3a', 1.6);
});
G('fire', function (g) {
path(g, [[0, -12], [5, -4], [8, 2], [5, 9], [-5, 9], [-8, 2], [-5, -4]], '#e07030', '#a04818', 1);
path(g, [[0, -6], [3.4, 0], [2, 7], [-2, 7], [-3.4, 0]], '#ffc040');
ell(g, 0, 4, 1.8, 3, '#fff4d0');
});
G('poison', function (g) {
path(g, [[0, -10], [6, -1], [7, 4], [0, 10], [-7, 4], [-6, -1]], '#7ac04a', '#4a8a2a', 1);
ell(g, -2, 2, 1.6, 1.6, '#c8f088'); ell(g, 2.4, 4, 1.2, 1.2, '#c8f088'); ell(g, 1, -2, 1, 1, '#c8f088');
});
G('fly', function (g) {
path(g, [[-10, 6], [-4, -6], [4, -9], [11, -6], [4, -2], [8, 2], [0, 2], [2, 6]], '#dce8f8', '#9ab0c0', 1);
for (let i = 0; i < 4; i++) stroke(g, [[-6 + i * 4, 3 - i], [-2 + i * 4, -5 - i * 0.6]], '#b8c8e0', 0.8);
});
G('horse', function (g) {
path(g, [[-8, 10], [-6, -2], [-2, -8], [4, -10], [8, -6], [10, 2], [6, 4], [4, 10]], '#8a6242', '#5e4028', 1);
path(g, [[-2, -8], [-4, -12], [0, -9]], '#8a6242', '#5e4028', 0.6);
fur(g, -4, -8, 4, -10, 5, 3, '#3a2616', 2);
eye(g, 3, -5, 1.1, '#241812');
ell(g, 8, 0, 1.2, 1, '#3a2418');
});
G('xp', function (g) { spark(g, 0, 0, 11, '#8fe08f'); spark(g, 0, 0, 5, '#dff8df'); });
G('dur', function (g) {
path(g, [[-10, 4], [-6, -2], [6, -2], [10, 4], [8, 8], [-8, 8]], '#8a8a92', '#5a5a62', 1);
path(g, [[-6, -2], [6, -2], [5, 1], [-5, 1]], '#b0b0b8');
rr(g, -4, -7, 8, 5, 1, '#a8a8b0', '#5a5a62', 0.8);
});
G('clock', function (g) {
ell(g, 0, 0, 11, 11, '#e8dcc0', '#a89870', 1.2);
ell(g, 0, 0, 8.4, 8.4, null, '#c8b898', 0.7);
stroke(g, [[0, 0], [0, -6]], '#5a4a2a', 1.8); stroke(g, [[0, 0], [5, 2]], '#5a4a2a', 1.6);
ell(g, 0, 0, 1.4, 1.4, '#a07820');
});
G('flag', function (g) {
stroke(g, [[-6, 11], [-6, -11]], '#8a6a44', 2);
path(g, [[-6, -11], [9, -7], [-6, -2]], '#c0392b', '#8a2418', 0.8);
});
G('book', function (g) {
path(g, [[-11, -8], [-1, -6], [-1, 9], [-11, 7]], '#e8dcc0', '#a89870', 1);
path(g, [[11, -8], [1, -6], [1, 9], [11, 7]], '#f4ecd8', '#a89870', 1);
stroke(g, [[0, -6], [0, 9]], '#8a6a44', 1.6);
for (let i = 0; i < 3; i++) { stroke(g, [[-8, -3 + i * 3.4], [-3, -2.4 + i * 3.4]], '#c8b898', 0.7); stroke(g, [[3, -2.4 + i * 3.4], [8, -3 + i * 3.4]], '#c8b898', 0.7); }
});
G('quill', function (g) {
g.save(); g.rotate(0.5);
curve(g, 0, 11, 1, 0, 0, -10, '#e8dcc0', 1.2);
for (let i = 0; i < 7; i++) { const t = i / 6, y = 8 - t * 17, w = 4.4 * sin(t * PI) + 0.8; stroke(g, [[0, y], [-w, y - 2]], i % 2 ? '#f4ecd8' : '#d8ccb4', 1); stroke(g, [[0, y], [w * 0.7, y - 2]], i % 2 ? '#d8ccb4' : '#f4ecd8', 1); }
g.restore();
});
G('shield', function (g) {
path(g, [[-9, -9], [9, -9], [9, 2], [0, 11], [-9, 2]], '#4a6a8a', '#2e4a6a', 1.2);
path(g, [[-6.4, -6.4], [6.4, -6.4], [6.4, 1], [0, 7.6], [-6.4, 1]], '#5a7a9a', '#2e4a6a', 0.7);
ell(g, 0, -1, 3, 3, '#e8c040', '#a07820', 0.7);
for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; stroke(g, [[cos(a) * 3.6, -1 + sin(a) * 3.6], [cos(a) * 5, -1 + sin(a) * 5]], '#e8c040', 0.7); }
});
G('sword', function (g) {
g.save(); g.rotate(0.35);
path(g, [[-1.8, -3], [1.8, -3], [1.2, -11], [0, -13], [-1.2, -11]], '#d4dae0', '#7a7e82', 0.9);
rr(g, -5, -3.4, 10, 2.4, 1, '#8a6a44', '#5a4420', 0.7);
rr(g, -1.4, -1, 2.8, 8, 1.2, '#6a4a2a', '#3a2a16', 0.7);
ell(g, 0, 8, 2, 2, '#a07820');
g.restore();
});
G('armor', function (g) {
path(g, [[-9, -8], [-4, -10], [4, -10], [9, -8], [8, 8], [-8, 8]], '#a8b0b8', '#767e86', 1);
path(g, [[-7, -7], [7, -7], [6, -1], [-6, -1]], '#d4dae0', '#767e86', 0.7);
stroke(g, [[0, -1], [0, 8]], '#767e86', 0.9);
ell(g, -7.4, -7.4, 3, 2.4, '#a8b0b8', '#767e86', 0.7); ell(g, 7.4, -7.4, 3, 2.4, '#a8b0b8', '#767e86', 0.7);
});
G('potion', function (g) {
path(g, [[-3, -9], [3, -9], [3, -4], [8, 3], [7, 8], [-7, 8], [-8, 3], [-3, -4]], '#dce8f0', '#9ab0c0', 1);
path(g, [[-6.4, 2], [6.4, 2], [5.6, 7], [-5.6, 7]], '#d0342c');
rr(g, -3.6, -12, 7.2, 3.4, 1.2, '#8a6a44', '#5a4420', 0.8);
});
G('material', function (g) {
path(g, [[0, -10], [10, -4], [10, 6], [0, 12], [-10, 6], [-10, -4]], '#9a968c', '#6a665e', 1);
path(g, [[0, -10], [10, -4], [0, 2], [-10, -4]], '#c4c0b6', '#6a665e', 0.7);
path(g, [[0, 2], [10, -4], [10, 6], [0, 12]], '#8a867c', '#6a665e', 0.7);
});
G('role_farm', function (g) {
stroke(g, [[0, 12], [0, -6]], '#c8a840', 1.6);
for (let i = 0; i < 4; i++) { const y = -6 + i * 3.4; for (let s = -1; s <= 1; s += 2) path(g, [[0, y], [s * 4.4, y - 2.4], [s * 3.4, y + 1.4]], '#e8c860', '#a88820', 0.5); }
});
G('role_tend', function (g) {
path(g, [[-8, -3], [8, -3], [6, 8], [-6, 8]], '#8a9aa8', '#5a6a78', 1);
curve(g, -8, -3, 0, -11, 8, -3, '#5a6a78', 1.4);
ell(g, 0, -2.6, 6.4, 2, '#8fd0f0');
});
G('role_guard', function (g) { A.glyphs.shield(g); });
G('role_follow', function (g) { A.glyphs.sword(g); });
G('role_idle', function (g) {
g.save(); g.translate(2, 2); g.scale(0.8, 0.8); A.glyphs.moon(g); g.restore();
stroke(g, [[-10, -8], [-4, -8], [-10, -2], [-4, -2]], '#bfe4f5', 1.4);
stroke(g, [[-2, -12], [2, -12], [-2, -8], [2, -8]], '#dce8f8', 1.2);
});
G('grid', function (g) {
for (let i = -1; i <= 1; i++) { stroke(g, [[i * 7, -10], [i * 7, 10]], '#8a7a5a', 1.2); stroke(g, [[-10, i * 7], [10, i * 7]], '#8a7a5a', 1.2); }
});
G('_default', function (g) { path(g, [[0, -8], [7, 0], [0, 8], [-7, 0]], '#8a6d3b', '#d9a441', 1.2); ell(g, 0, 0, 2.2, 2.2, '#f3cf7a'); });

/* ==========================================================
15 · EDIFICIOS
========================================================== */
function house(wall, roof, detail) {
return function (g) {
shadow(g, 12, 11);
path(g, [[-11, 10], [-11, -2], [11, -2], [11, 10]], wall, shade(wall, -0.4), 1);
path(g, [[-13, -2], [0, -12], [13, -2]], roof, shade(roof, -0.4), 1);
path(g, [[-13, -2], [0, -12], [0, -2]], shade(roof, 0.16));
rr(g, -3, 2, 6, 8, 1, '#5a3a20', '#3a2410', 0.7);
ell(g, 1.6, 6, 0.8, 0.8, '#e0c060');
rr(g, -9, 1, 4, 4, 0.8, '#8fc8e0', shade(wall, -0.4), 0.6);
rr(g, 5, 1, 4, 4, 0.8, '#8fc8e0', shade(wall, -0.4), 0.6);
if (detail) detail(g);
};
}
A.building('house_straw', house('#c8b070', '#b89a40', function (g) { for (let i = -2; i <= 2; i++) stroke(g, [[i * 4, -3], [i * 4 + 1.4, -10]], '#d8c070', 0.8); }));
A.building('house_wood', house('#b89060', '#8a5a30', function (g) { for (let i = 0; i < 3; i++) stroke(g, [[-10, 1 + i * 3], [10, 1 + i * 3]], '#9a7448', 0.6); }));
A.building('house_stone', house('#b0aca0', '#6a6a70', function (g) {
for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) rr(g, -10 + c * 5 + (r % 2 ? 2 : 0), -1 + r * 3.6, 4.4, 3, 0.6, null, '#8a867c', 0.5);
rr(g, 6, -12, 3.4, 7, 0.8, '#8a8478', '#5a544a', 0.6);
}));
A.building('house_mansion', house('#d8d0c0', '#7a4a6a', function (g) {
rr(g, -13, -6, 5, 16, 1, '#c8c0b0', '#8a8478', 0.7);
rr(g, 8, -6, 5, 16, 1, '#c8c0b0', '#8a8478', 0.7);
path(g, [[-13, -6], [-10.5, -11], [-8, -6]], '#7a4a6a', '#4a2a4a', 0.6);
path(g, [[8, -6], [10.5, -11], [13, -6]], '#7a4a6a', '#4a2a4a', 0.6);
ell(g, 0, -7, 2, 2, '#e8c040');
}));
A.building('house_small', house('#c8b898', '#8a6a4a'));
A.building('farm_house', house('#c0a880', '#7a6a3a', function (g) { stroke(g, [[-11, 10], [11, 10]], '#5a8a3a', 1.4); }));
A.building('owner_house', house('#c8b48a', '#8a4a3a', function (g) { ell(g, 0, -7, 2.2, 2.2, '#e8c040', '#a07820', 0.6); }));
A.building('church', house('#d3c8b0', '#7a5f8a', function (g) {
rr(g, -1.6, -20, 3.2, 10, 0.6, '#e8dcb0', '#a89870', 0.6);
ell(g, 0, -14, 3.4, 3.4, '#e07a3a', '#a04818', 0.7);
ell(g, 0, -14, 1.6, 1.6, '#f2c060');
rr(g, -9, 1, 4, 4, 1.6, '#e8a040', '#a06818', 0.6);
rr(g, 5, 1, 4, 4, 1.6, '#e8a040', '#a06818', 0.6);
}));
A.building('barracks', house('#9aa0a8', '#6b4a3a', function (g) {
rr(g, 7, -8, 5, 12, 0.8, '#8a3a2a', '#5a2018', 0.7);
rr(g, 8.4, -5, 2.2, 5, 0.6, '#d8a040');
for (let i = -1; i <= 1; i++) stroke(g, [[-11, -2 + i * 0.1], [11, -2 + i * 0.1]], '#7a8088', 0.6);
}));
A.building('bank', house('#d8cfae', '#4a6a5a', function (g) {
for (let i = -1; i <= 1; i++) rr(g, i * 6 - 1.6, -2, 3.2, 12, 0.6, '#e8e0c8', '#8a8468', 0.6);
path(g, [[-12, -2], [0, -10], [12, -2]], '#c8c0a0', '#8a8468', 0.7);
gold(g, 0, -5, 2.2);
}));
A.building('smithy', house('#a89880', '#5a4a3a', function (g) {
rr(g, 6, -14, 4, 9, 0.8, '#6a5a50', '#4a3a32', 0.7);
ell(g, -6, 6, 3.4, 2.6, '#ff7a30'); ell(g, -6, 6, 1.6, 1.2, '#ffd070');
g.save(); g.globalAlpha = 0.4; ell(g, 8, -17, 2.4, 2, '#c8c0b0'); g.restore();
}));
A.building('steward', house('#c0b090', '#6a5a3a', function (g) {
rr(g, -7, 3, 6, 6, 0.8, '#e8dcc0', '#8a7a5a', 0.6);
for (let i = 0; i < 3; i++) stroke(g, [[-6, 4.4 + i * 1.6], [-2, 4.4 + i * 1.6]], '#a89870', 0.5);
}));
A.building('stall', function (g) {
shadow(g, 12, 11);
path(g, [[-11, 2], [11, 2], [9, 10], [-9, 10]], '#b89a6a', '#7a5a34', 1);
stroke(g, [[-10, 2], [-10, -8]], '#8a6a3a', 1.6); stroke(g, [[10, 2], [10, -8]], '#8a6a3a', 1.6);
for (let i = 0; i < 6; i++) path(g, [[-12 + i * 4, -8], [-12 + (i + 1) * 4, -8], [-12 + (i + 1) * 4, -3], [-12 + i * 4, -3]], i % 2 ? '#d8483a' : '#f0e0c0', '#8a6a3a', 0.5);
ell(g, -5, 5, 2.4, 2, '#e07030'); ell(g, 0, 5, 2.4, 2, '#d84040'); ell(g, 5, 5, 2.4, 2, '#70b040');
});
A.building('fountain', function (g) {
shadow(g, 12, 11);
path(g, [[0, -2], [12, 4], [0, 10], [-12, 4]], '#b0b8c0', '#7a828a', 1);
path(g, [[0, 0], [9, 4], [0, 8], [-9, 4]], '#3f8fc0', '#2e6f9e', 0.7);
rr(g, -1.8, -12, 3.6, 12, 0.8, '#c8d0d8', '#8a929a', 0.7);
ell(g, 0, -13, 4.4, 2.4, '#d8e0e8', '#8a929a', 0.6);
for (let i = -1; i <= 1; i++) curve(g, 0, -13, i * 5, -8, i * 6, 2, '#bfe4f5', 1.1);
});
A.building('pen', function (g) { A.buildings.corral(g); });
A.building('corral', function (g) {
shadow(g, 12, 11);
for (let i = -2; i <= 2; i++) { rr(g, i * 5 - 1.4, -6, 2.8, 16, 0.8, '#a08850', '#6a5430', 0.7); }
rr(g, -12, -3, 24, 2.4, 0.8, '#b09860', '#6a5430', 0.7);
rr(g, -12, 4, 24, 2.4, 0.8, '#b09860', '#6a5430', 0.7);
});
A.building('stable', function (g) {
shadow(g, 12, 11);
path(g, [[-11, 10], [-11, -2], [11, -2], [11, 10]], '#a88860', '#6a5430', 1);
path(g, [[-13, -2], [0, -11], [13, -2]], '#7a5a3a', '#4a3a20', 1);
rr(g, -5, 0, 10, 10, 1, '#5a3a20', '#3a2410', 0.7);
stroke(g, [[-5, 0], [5, 10]], '#8a6a44', 0.8); stroke(g, [[5, 0], [-5, 10]], '#8a6a44', 0.8);
g.save(); g.translate(0, -6); g.scale(0.5, 0.5); A.glyphs.mount(g); g.restore();
});
A.building('fence', function (g) {
rr(g, -8, -8, 3, 18, 0.8, '#9a8050', '#6a5430', 0.8);
rr(g, 5, -8, 3, 18, 0.8, '#9a8050', '#6a5430', 0.8);
rr(g, -11, -4, 22, 2.6, 0.8, '#b09860', '#6a5430', 0.7);
rr(g, -11, 3, 22, 2.6, 0.8, '#b09860', '#6a5430', 0.7);
});
A.building('chest', function (g) { g.save(); g.scale(1.15, 1.15); A.glyphs.chest(g); g.restore(); });
A.building('campfire', function (g) {
shadow(g, 10, 10);
for (let i = 0; i < 7; i++) { const a = i / 7 * TAU; ell(g, cos(a) * 9, 6 + sin(a) * 4, 2.6, 2, '#8a8478', '#5a544a', 0.5); }
stroke(g, [[-6, 8], [6, 4]], '#5a3a20', 2.6); stroke(g, [[-6, 4], [6, 8]], '#5a3a20', 2.6);
path(g, [[0, -10], [5, -2], [4, 5], [-4, 5], [-5, -2]], '#e07030', '#a04818', 0.8);
path(g, [[0, -5], [2.6, 0], [1.4, 4], [-1.4, 4], [-2.6, 0]], '#ffc040');
});
A.building('workbench', function (g) {
shadow(g, 12, 11);
rr(g, -12, -3, 24, 5, 1, '#b09060', '#7a5a34', 1);
rr(g, -10, 2, 3, 9, 0.8, '#8a7040', '#5a4420', 0.7);
rr(g, 7, 2, 3, 9, 0.8, '#8a7040', '#5a4420', 0.7);
g.save(); g.translate(-5, -6); g.rotate(-0.4); g.scale(0.5, 0.5); A.glyphs.craft(g); g.restore();
rr(g, 3, -8, 7, 5, 0.8, '#a8a8b0', '#6a6a72', 0.7);
});
A.building('forge', function (g) {
shadow(g, 12, 11);
path(g, [[-11, 10], [-11, -2], [11, -2], [11, 10]], '#908880', '#5a544a', 1);
path(g, [[-13, -2], [0, -11], [13, -2]], '#c05030', '#8a3018', 1);
rr(g, 5, -16, 4.4, 10, 0.8, '#6a5a50', '#4a3a32', 0.7);
ell(g, -3, 5, 5, 4, '#ff7a30'); ell(g, -3, 5, 2.6, 2, '#ffd070');
g.save(); g.globalAlpha = 0.35; ell(g, 7, -19, 3, 2.4, '#c8c0b0'); g.restore();
});
A.buildings._default = house('#b0a080', '#8a6a4a');

/* ==========================================================
16 · NODOS DE RECURSO
========================================================== */
function nodeTree(tint, apples) {
return function (g) {
shadow(g, 12, 9);
rr(g, -2.4, -2, 4.8, 13, 1, '#6b4a2a', '#4a3218', 0.8);
ell(g, 0, -6, 9.4, 7.4, tint, shade(tint, -0.35), 0.8);
ell(g, -5, -9, 6, 5, shade(tint, 0.14));
ell(g, 5, -8, 5.4, 4.6, shade(tint, -0.08));
ell(g, -2, -12, 5, 4, shade(tint, 0.26));
if (apples) for (let i = 0; i < 5; i++) { const a = i / 5 * TAU; ell(g, cos(a) * 6, -7 + sin(a) * 4.4, 1.8, 1.8, '#d8402c', '#8a2418', 0.4); }
};
}
A.node('tree', nodeTree('#3e6b2f', false));
A.node('apple_tree', nodeTree('#4a7a35', true));
function nodeRock(tint, ore) {
return function (g) {
shadow(g, 12, 10);
path(g, [[-11, 10], [-12, 0], [-5, -7], [4, -8], [11, -1], [8, 10]], '#8e8a80', '#5f5c55', 1.1);
path(g, [[-5, -7], [4, -8], [0, -1], [-7, -1]], '#a5a196');
path(g, [[4, -8], [11, -1], [8, 10], [1, 2]], '#75726a');
if (ore) { glow(g, 0, -1, 11, tint, 0.24); gem(g, -4, -2, 3, tint); gem(g, 3, -5, 2.6, tint); gem(g, 5, 3, 2.2, tint); }
};
}
A.node('rock', nodeRock('#8a8a82', false));
A.node('coal_node', nodeRock('#3a3a3a', true));
A.node('copper_node', nodeRock('#c77b3a', true));
A.node('iron_node', nodeRock('#a8b0b8', true));
A.node('mithril_node', nodeRock('#5ac8e0', true));
A.node('adamantite_node', nodeRock('#9a5ae0', true));
A.node('gold_node', nodeRock('#e0c040', true));
A.node('crystal_node', function (g) {
shadow(g, 12, 10);
path(g, [[-11, 10], [-12, 2], [-6, -3], [6, -3], [11, 2], [9, 10]], '#6a5a7a', '#3a2a4a', 1);
glow(g, 0, -2, 13, '#b06ae0', 0.3);
path(g, [[-2, 4], [-5, -6], [-1, -13], [3, -5], [2, 4]], '#9a5ae0', '#5a2a9a', 0.9);
path(g, [[-1, -13], [3, -5], [0, -3], [-3, -6]], '#c8a8f8');
path(g, [[5, 4], [4, -2], [8, -7], [10, 0], [8, 4]], '#a86ae8', '#5a2a9a', 0.8);
});
A.node('bush', function (g) {
shadow(g, 12, 9);
ell(g, -5, 3, 6.4, 5.4, '#4a7a2a', '#3a5a1a', 0.7);
ell(g, 5, 4, 6, 5, '#5a8a3a', '#3a5a1a', 0.7);
ell(g, 0, -2, 7.4, 6, '#6a9a4a', '#3a5a1a', 0.7);
for (let i = 0; i < 5; i++) ell(g, -6 + i * 3, -1 + (i % 2) * 4, 1.8, 1.8, '#5a3a8a', '#3a1a6a', 0.4);
});
A.node('grass', function (g) {
for (let i = -3; i <= 3; i++) curve(g, i * 3, 11, i * 3.6, 2, i * 3 + (i % 2 ? 3 : -3), -7 - Math.abs(i), i % 2 ? '#7aae4e' : '#5a9a3a', 1.8);
});
A.node('herb_plant', function (g) {
shadow(g, 12, 7);
for (let i = -2; i <= 2; i++) {
stroke(g, [[i * 3, 11], [i * 4, -4 - Math.abs(i)]], '#3a8a4a', 1.4);
ell(g, i * 4, -5 - Math.abs(i), 2.4, 2.4, i % 2 ? '#f2e07a' : '#e8f0a0', '#c8a830', 0.5);
}
});
A.node('honey_node', function (g) {
shadow(g, 12, 8);
stroke(g, [[-11, -9], [9, -7]], '#6b4a2a', 2.4);
for (let i = 0; i < 4; i++) ell(g, 0, -3 + i * 4, 8 - i * 1.4, 3.4, i % 2 ? '#e0a030' : '#c88a18', '#8a5a10', 0.6);
ell(g, 0, 9, 2.4, 1.8, '#5a3a10');
for (let i = 0; i < 3; i++) ell(g, -7 + i * 7, -6 + i * 3, 1.2, 1.2, '#f8e07a');
});
A.nodes._default = nodeRock('#8a8a82', false);



/* ==========================================================
14b · GLIFOS NUEVOS DE INTERFAZ (v5)
Los que usan el HUD, los paneles y el editor de controles.
========================================================== */
function arc(g, r, a0, a1, col, w) {
  g.save(); g.strokeStyle = col; g.lineWidth = w; g.lineCap = 'round';
  g.beginPath(); g.arc(0, 0, r, a0, a1); g.stroke(); g.restore();
}
G('moon', function (g) {
  g.save(); g.fillStyle = '#e8dcc0'; g.strokeStyle = '#a89868'; g.lineWidth = 0.9;
  g.beginPath(); g.arc(0, 0, 9, Math.PI * 0.32, Math.PI * 1.68, false);
  g.arc(4.2, 0, 7.2, Math.PI * 1.56, Math.PI * 0.44, true);
  g.closePath(); g.fill(); g.stroke(); g.restore();
  ell(g, 7, -6, 1, 1, '#f8e08a'); ell(g, 9, 1, 0.7, 0.7, '#f8e08a');
});
G('ammo', function (g) {
  stroke(g, [[-9, 9], [7, -7]], '#c8b890', 1.8);
  path(g, [[9, -9], [2.5, -7.6], [7.6, -2.5]], '#d4dae0', '#7a7e82', 0.8);
  stroke(g, [[-9, 9], [-9, 4]], '#e04b3a', 1.6); stroke(g, [[-9, 9], [-4, 9]], '#e04b3a', 1.6);
  stroke(g, [[-6.5, 6.5], [-6.5, 2.5]], '#e8dcc0', 1.2); stroke(g, [[-6.5, 6.5], [-2.5, 6.5]], '#e8dcc0', 1.2);
});
G('block', function (g) { A.glyphs.shield(g); });
G('cycle', function (g) {
  arc(g, 8, 0.3, Math.PI - 0.5, '#d9a441', 2);
  arc(g, 8, Math.PI + 0.3, Math.PI * 2 - 0.5, '#d9a441', 2);
  path(g, [[-9.5, 1], [-5.5, 1], [-7.7, 5]], '#f3cf7a');
  path(g, [[9.5, -1], [5.5, -1], [7.7, -5]], '#f3cf7a');
});
G('level', function (g) {
  path(g, [[-8, 1], [0, -7], [8, 1], [5, 1], [0, -3.6], [-5, 1]], '#f3cf7a', '#a07820', 0.8);
  path(g, [[-8, 8], [0, 0], [8, 8], [5, 8], [0, 3.4], [-5, 8]], '#d9a441', '#a07820', 0.8);
});
G('edit', function (g) {
  g.save(); g.rotate(-0.75);
  rr(g, -2.6, -9, 5.2, 12, 1, '#d9a441', '#8a6d3b', 0.8);
  path(g, [[-2.6, 3], [2.6, 3], [0, 8.5]], '#e8dcc0', '#8a6d3b', 0.8);
  rr(g, -2.6, -11.4, 5.2, 2.6, 1, '#c77b3a', '#8a4f1e', 0.8);
  g.restore();
});
G('eye', function (g) {
  path(g, [[-11, 0], [-5, -5], [5, -5], [11, 0], [5, 5], [-5, 5]], '#e8dcc0', '#8a6d3b', 0.9);
  ell(g, 0, 0, 3.6, 3.6, '#3a7d9a', '#1c3a4a', 0.8); ell(g, 0, 0, 1.5, 1.5, '#0e0b06');
});
G('move', function (g) {
  stroke(g, [[-9, 0], [9, 0]], '#d9a441', 1.8); stroke(g, [[0, -9], [0, 9]], '#d9a441', 1.8);
  path(g, [[0, -11], [-3, -7], [3, -7]], '#f3cf7a'); path(g, [[0, 11], [-3, 7], [3, 7]], '#f3cf7a');
  path(g, [[-11, 0], [-7, -3], [-7, 3]], '#f3cf7a'); path(g, [[11, 0], [7, -3], [7, 3]], '#f3cf7a');
});
G('opacity', function (g) {
  ell(g, 0, 0, 9, 9, '#1c150b', '#d9a441', 1.2);
  g.save(); g.fillStyle = '#e8dcc0'; g.beginPath(); g.arc(0, 0, 9, -Math.PI / 2, Math.PI / 2, false); g.closePath(); g.fill(); g.restore();
  ell(g, 0, 0, 9, 9, null, '#d9a441', 1.2);
});
G('points', function (g) {
  ell(g, 0, 0, 10, 10, '#d9a441', '#8a6d3b', 1.2);
  stroke(g, [[-5, 0], [5, 0]], '#1c150b', 2.4); stroke(g, [[0, -5], [0, 5]], '#1c150b', 2.4);
});
G('public', function (g) {
  path(g, [[-11, -2], [0, -10], [11, -2]], '#c05030', '#7a2c18', 0.9);
  rr(g, -9, -2, 18, 3, 1, '#c8b898', '#8a7a58', 0.7);
  for (let i = -1; i <= 1; i++) rr(g, i * 6 - 1.4, 1, 2.8, 8, 0.8, '#e6dcc4', '#8a7a58', 0.6);
  rr(g, -11, 9, 22, 2.4, 1, '#9a8a6a', '#6a5a3a', 0.6);
});
G('repair', function (g) {
  g.save(); g.rotate(0.7);
  rr(g, -1.6, -3, 3.2, 14, 1.2, '#8a6a44', '#5a4420', 0.8);
  rr(g, -5.4, -11, 10.8, 8, 3, '#a8b0b8', '#6a727a', 0.9);
  rr(g, -1.6, -11, 3.2, 5, 0.5, '#1c150b');
  g.restore();
});
G('reset', function (g) {
  arc(g, 8, -Math.PI * 0.35, Math.PI * 1.45, '#d9a441', 2.2);
  path(g, [[8.5, -8], [9.5, -2], [3.5, -4]], '#f3cf7a');
});
G('saber', function (g) { A.glyphs.book(g); });
G('scale', function (g) {
  stroke(g, [[-8, 8], [8, -8]], '#d9a441', 1.8);
  path(g, [[10, -10], [3, -8.4], [8.4, -3]], '#f3cf7a');
  path(g, [[-10, 10], [-3, 8.4], [-8.4, 3]], '#f3cf7a');
});
G('swap', function (g) {
  stroke(g, [[-9, -4], [7, -4]], '#d9a441', 1.8); path(g, [[11, -4], [6, -8], [6, 0]], '#f3cf7a');
  stroke(g, [[9, 4], [-7, 4]], '#d9a441', 1.8); path(g, [[-11, 4], [-6, 0], [-6, 8]], '#f3cf7a');
});
G('tier', function (g) {
  rr(g, -10, 3, 5, 7, 1, '#9a6ae0', '#6a3aaa', 0.8);
  rr(g, -2.5, -2, 5, 12, 1, '#6ac8e0', '#3a8aa4', 0.8);
  rr(g, 5, -8, 5, 18, 1, '#f3cf7a', '#a07820', 0.8);
});


G('role_water', function (g) {
  path(g, [[0, -10], [7, 2], [5, 8], [-5, 8], [-7, 2]], '#5aa8d8', '#2e6a9a', 1);
  ell(g, -2, 1, 1.6, 2.6, '#bfe4f5');
});
G('role_haul', function (g) {
  rr(g, -9, -2, 18, 10, 1.5, '#a07840', '#6a4a20', 0.9);
  stroke(g, [[-9, 2], [9, 2]], '#6a4a20', 0.9); stroke(g, [[0, -2], [0, 8]], '#6a4a20', 0.9);
  path(g, [[-6, -2], [-3, -8], [3, -8], [6, -2]], '#c8a068', '#6a4a20', 0.8);
});
/* Alias de edificios sin dibujo propio: usan el más parecido */
[['kitchen', 'campfire'], ['alchemy', 'workbench'], ['smelter', 'forge'], ['public_forge', 'forge'], ['public_bench', 'workbench'],
 ['shelter', 'house_straw'], ['house_brick', 'house_stone'], ['house_manor', 'house_mansion'], ['house_keep', 'house_mansion'],
 ['house_villa', 'house_mansion'], ['house_palace', 'house_mansion'], ['house_citadel', 'house_mansion'], ['house_estate', 'house_mansion'],
 ['coop', 'corral'], ['barn', 'stable'], ['chest_large', 'chest']].forEach(function (p) {
  if (!A.buildings[p[0]] && A.buildings[p[1]]) A.buildings[p[0]] = A.buildings[p[1]];
});

console.info('[CR] art-items.js v5 listo');
})();
