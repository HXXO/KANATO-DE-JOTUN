/* ============================================================
KANATO DE JOTUN · art-creatures.js — Bestiario completo (v3)
35 especies con silueta EXAGERADA y legible a 24 px.
Regla de diseño: cada animal tiene UN rasgo dominante que se
dibuja grande (colmillos, joroba, astas, crin, caparazón,
pinzas, aguijón, alas, fuego, humo, corona, tres cabezas),
paleta separada del resto y contorno grueso.
Espacio local: origen en el suelo, +x hacia donde mira.
o = { t, ph, atk, baby, tamed, fly, lvl, sd, e, tint,
      front, back, sq, hs, lunge }   (o.e puede ser null)
============================================================ */
(function () {
'use strict';
const CR = window.CR;
if (!CR || !CR.Art) { console.error('[CR] art-creatures.js requiere art.js'); return; }
const A = CR.Art, H = A.util, D = CR.DATA, U = CR.util;
const ell = H.ell, path = H.path, blob = H.blob, leg = H.leg, stroke = H.stroke,
curve = H.curve, fur = H.fur, eye = H.eye, horn = H.horn, spots = H.spots,
glow = H.glow, shade = H.shade, rgba = H.rgba, mix = H.mix;
const sin = Math.sin, cos = Math.cos, PI = Math.PI, TAU = U.TAU;
const R = A.creatures;
const OW = 1.2;                       /* contorno maestro: se lee a escala pequeña */

/* ==========================================================
0 · PIEZAS COMPARTIDAS
========================================================== */
/** Barda por nivel + silla de montar, visibles sobre el lomo. */
function tack(g, o, x, y, w) {
if (!o.e || !o.e.tg) return;
const tg = o.e.tg;
if (tg.petArmor > 0) {
const col = tg.petArmor >= 14 ? '#6ac8e0' : tg.petArmor >= 8 ? '#b0b8c0' : '#8a6a44';
path(g, [[x - w, y - 3.5], [x + w * 0.85, y - 4.5], [x + w * 0.75, y + 2.5], [x - w * 0.9, y + 2.5]], rgba(col, 0.95), shade(col, -0.4), OW);
stroke(g, [[x - w * 0.5, y - 3.8], [x - w * 0.45, y + 2.5]], shade(col, -0.3), 0.8);
stroke(g, [[x + w * 0.25, y - 4.2], [x + w * 0.3, y + 2.5]], shade(col, -0.3), 0.8);
ell(g, x - w * 0.8, y - 2.8, 1.2, 1.2, shade(col, 0.35));
}
if (tg.saddle) {
path(g, [[x - w * 0.55, y - 6], [x + w * 0.55, y - 6.4], [x + w * 0.45, y - 1.5], [x - w * 0.45, y - 1.5]], '#7a4a2a', '#3a2010', OW);
ell(g, x, y - 6.6, w * 0.36, 1.5, '#9a6a44');
curve(g, x - w * 0.5, y - 6, x - w * 0.62, y - 9.5, x - w * 0.3, y - 7, '#5a3418', 1.6);
stroke(g, [[x - w * 0.45, y - 1.5], [x - w * 0.5, y + 3.5]], '#3a2010', 1.2);
ell(g, x + w * 0.55, y - 5, 1.3, 1.3, '#e8c040');
}
}
/** Lengua de fuego animada (pesadilla, fénix). */
function flame(g, x, y, h, w, col, t, seed) {
const f = 0.78 + 0.22 * sin(t * 9 + seed);
path(g, [[x - w, y], [x - w * 0.4, y - h * 0.5 * f], [x, y - h * f], [x + w * 0.4, y - h * 0.45 * f], [x + w, y]], col);
path(g, [[x - w * 0.42, y], [x, y - h * 0.58 * f], [x + w * 0.42, y]], shade(col, 0.38));
}
/** Estela de humo (sabueso sombrío). */
function smoke(g, x, y, n, col, t, seed) {
for (let i = 0; i < n; i++) {
const a = t * 1.7 + i * 1.15 + seed;
g.globalAlpha = 0.32 - i * 0.045;
ell(g, x - i * 2.6 + sin(a) * 2.2, y + cos(a * 0.7) * 3 - i * 0.7, 3.6 - i * 0.42, 2.6 - i * 0.3, col);
}
g.globalAlpha = 1;
}
/** Oreja puntiaguda con interior. */
function ear(g, x, y, h, w, tilt, col, inner) {
g.save(); g.translate(x, y); g.rotate(tilt);
path(g, [[-w, 0], [0, -h], [w, 0]], col, shade(col, -0.4), 0.9);
if (inner) path(g, [[-w * 0.45, -0.6], [0, -h * 0.7], [w * 0.45, -0.6]], inner);
g.restore();
}
/** Asta ramificada (ciervo). */
function antler(g, x, y, dir, len, col) {
stroke(g, [[x, y], [x + dir * len * 0.28, y - len * 0.62], [x + dir * len * 0.72, y - len]], col, 2.0);
stroke(g, [[x + dir * len * 0.24, y - len * 0.52], [x + dir * len * 0.8, y - len * 0.6]], col, 1.5);
stroke(g, [[x + dir * len * 0.34, y - len * 0.74], [x + dir * len * 0.1, y - len * 1.15]], col, 1.5);
stroke(g, [[x + dir * len * 0.6, y - len * 0.9], [x + dir * len * 1.05, y - len * 1.05]], col, 1.3);
}
/** Asta palmada (reno). */
function palm(g, x, y, dir, len, col) {
stroke(g, [[x, y], [x + dir * len * 0.3, y - len * 0.6], [x + dir * len * 0.6, y - len * 0.9]], col, 2.2);
path(g, [[x + dir * len * 0.24, y - len * 0.5], [x + dir * len * 1.0, y - len * 0.72],
[x + dir * len * 1.05, y - len * 1.12], [x + dir * len * 0.5, y - len * 0.95]], col, shade(col, -0.35), 0.8);
stroke(g, [[x + dir * len * 0.4, y - len * 0.78], [x + dir * len * 0.18, y - len * 1.2]], col, 1.6);
}
/** Cuerpo de lana: contorno festoneado (oveja, alpaca). */
function wool(g, x, y, rx, ry, col, hi, n) {
for (let i = 0; i < n; i++) {
const a = i / n * TAU;
ell(g, x + cos(a) * rx * 0.78, y + sin(a) * ry * 0.78, rx * 0.36, ry * 0.42, i % 2 ? col : hi, shade(col, -0.22), 0.7);
}
ell(g, x, y, rx * 0.8, ry * 0.78, hi, shade(col, -0.18), 0.7);
}

/* ==========================================================
1 · JABALÍ — joroba de hombro + cresta de cerdas + colmillos
========================================================== */
R.boar = function (g, o) {
const C = { b: '#7a5230', d: '#3a2412', l: '#a87a48', br: '#1c1208', tusk: '#fff4dc', hoof: '#1a1008' };
const bob = sin(o.ph) * 1.0, sw = sin(o.ph) * 3.4, lg = o.lunge, y = -14 + bob;
leg(g, -7, -8, 8, 3.2, sw, C.d, C.hoof); leg(g, 6, -8, 8, 3.2, -sw, C.d, C.hoof);
leg(g, -3, -8, 8, 3.0, -sw * 0.8, C.b, C.hoof); leg(g, 10, -8, 8, 3.0, sw * 0.8, C.b, C.hoof);
path(g, [[-11, y + 5], [-10, y - 1], [-2, y - 4], [3, y - 9], [8, y - 4], [11, y + 2], [10, y + 6], [-10, y + 6]], C.b, C.d, OW);
g.save(); g.beginPath();
g.moveTo(-11, y + 5); g.lineTo(3, y - 9); g.lineTo(11, y + 2); g.lineTo(10, y + 6); g.closePath(); g.clip();
ell(g, 1, y - 3, 8, 3.6, C.l); g.restore();
fur(g, -7, y - 2, 8, y - 5, 10, 6.0, C.br, 3);            /* cresta enorme */
curve(g, -11, y + 2, -14, y - 1 + sw * 0.4, -13, y + 4, C.d, 1.6);
const hx = 12 + lg, hy = y + 3, hs = o.hs;
path(g, [[hx - 4, hy - 4 * hs], [hx + 5 * hs, hy - 2], [hx + 8 * hs, hy + 2], [hx + 2, hy + 4], [hx - 4, hy + 3]], C.b, C.d, OW);
ell(g, hx + 8 * hs, hy + 1.6, 2.4, 1.9, C.d);
ell(g, hx + 8.4 * hs, hy + 1.2, 0.6, 0.7, '#120a04');
horn(g, hx + 6 * hs, hy + 2.6, 6.4 * hs, -1.0, 2.2, C.tusk, 1.6);   /* colmillos grandes */
horn(g, hx + 4.2 * hs, hy + 3.0, 4.6 * hs, -1.2, 1.7, shade(C.tusk, -0.12), 1.2);
ear(g, hx - 2, hy - 4 * hs, 4.4, 2.0, -0.3, C.d);
eye(g, hx + 2.4 * hs, hy - 1.8, 1.0, '#2a1608');
if (o.baby) { g.save(); g.globalAlpha = 0.4; for (let i = 0; i < 4; i++) ell(g, -7 + i * 4, y + 1, 1.2, 2.6, '#e8d0a8'); g.restore(); }
tack(g, o, 0, y - 4, 8);
};

/* ==========================================================
2 · LOBO — orejas erectas + cola de penacho alta + panza clara
========================================================== */
R.wolf = function (g, o) {
const C = { b: '#8a8a96', d: '#4e4e5a', l: '#b4b4c0', belly: '#efe9dd', nose: '#16161c', eye: '#f5c53a' };
const bob = sin(o.ph) * 0.9, sw = sin(o.ph) * 4.2, lg = o.lunge, y = -13 + bob;
leg(g, -7, -8, 8, 2.6, sw, C.d); leg(g, 6, -8, 8, 2.6, -sw, C.d);
leg(g, -4, -8, 8, 2.4, -sw * 0.85, C.b); leg(g, 9, -8, 8, 2.4, sw * 0.85, C.b);
blob(g, 0, y, 11, 5.4, C.b, C.l);
ell(g, 1, y + 3.2, 8, 2.4, C.belly);
fur(g, 2, y - 4, 11, y - 2, 6, 3.6, C.d, 7);
curve(g, -10, y - 1, -16, y - 7 + sw * 0.5, -20, y - 1 + sw * 0.3, C.d, 5.4);   /* penacho alto */
curve(g, -10, y - 1, -16, y - 7 + sw * 0.5, -19, y - 1.5 + sw * 0.3, C.l, 2.8);
const hx = 11 + lg, hy = y - 4, hs = o.hs;
path(g, [[hx - 4, hy + 3], [hx - 2, hy - 3 * hs], [hx + 3, hy - 2.4 * hs], [hx + 4, hy + 2]], C.b, C.d, OW);
path(g, [[hx + 2, hy - 0.5], [hx + 10 * hs, hy + 0.8], [hx + 10 * hs, hy + 2.6], [hx + 2, hy + 3]], C.l, C.d, 0.9);
ell(g, hx + 10 * hs, hy + 1.6, 1.3, 1.1, C.nose);
ear(g, hx - 2.4, hy - 2.6 * hs, 6.4 * hs, 2.2, -0.16, C.b, '#3a3a46');
ear(g, hx + 1.8, hy - 2.8 * hs, 6.6 * hs, 2.2, 0.12, C.b, '#3a3a46');
eye(g, hx + 3.4 * hs, hy - 0.9, 1.1, C.eye);
if (o.atk >= 0) { path(g, [[hx + 5, hy + 2.6], [hx + 6.4, hy + 5], [hx + 7.6, hy + 2.6]], '#fff'); path(g, [[hx + 8, hy + 2.6], [hx + 9, hy + 4.6], [hx + 9.8, hy + 2.6]], '#fff'); }
tack(g, o, 0, y - 4, 8);
};

/* ==========================================================
3 · HUARGO — lobo abisal con PÚAS ÓSEAS y ojos de brasa
========================================================== */
R.warg = function (g, o) {
const C = { b: '#3a3248', d: '#1e1828', l: '#5a4e6e', belly: '#6e5e7c', spike: '#e0d8c4', nose: '#0e0c14', eye: '#ff4a3a' };
const bob = sin(o.ph) * 1.1, sw = sin(o.ph) * 4.6, lg = o.lunge, y = -15 + bob;
leg(g, -8, -9, 9, 3.2, sw, C.d); leg(g, 7, -9, 9, 3.2, -sw, C.d);
leg(g, -4, -9, 9, 3.0, -sw * 0.85, C.b); leg(g, 10, -9, 9, 3.0, sw * 0.85, C.b);
blob(g, 0, y, 13, 6.6, C.b, C.l);
ell(g, 1, y + 3.8, 9, 2.8, C.belly);
for (let i = 0; i < 6; i++) {                                  /* púas del espinazo */
const px = -9 + i * 4;
path(g, [[px, y - 5], [px + 1.6, y - 12 - (i % 2) * 2.5], [px + 3.2, y - 5]], C.spike, shade(C.spike, -0.4), 0.8);
}
fur(g, 4, y - 5, 12, y - 3, 7, 4.4, C.d, 9);
curve(g, -12, y, -19, y - 6 + sw * 0.5, -23, y + 1 + sw * 0.3, C.d, 5.6);
curve(g, -12, y, -19, y - 6 + sw * 0.5, -22, y + 0.5 + sw * 0.3, C.b, 3.0);
const hx = 13 + lg, hy = y - 4, hs = o.hs;
path(g, [[hx - 5, hy + 3.4], [hx - 2.6, hy - 3.4 * hs], [hx + 3.6, hy - 2.8 * hs], [hx + 4.6, hy + 2.4]], C.b, C.d, OW);
path(g, [[hx + 2.4, hy - 0.6], [hx + 12 * hs, hy + 1], [hx + 12 * hs, hy + 3], [hx + 2.4, hy + 3.4]], C.l, C.d, 0.9);
ell(g, hx + 12 * hs, hy + 2, 1.5, 1.3, C.nose);
stroke(g, [[hx + 0.4, hy - 2.8], [hx + 2.8, hy + 0.8]], '#9a4a4a', 1.0);   /* cicatriz */
ear(g, hx - 3, hy - 3 * hs, 7.4 * hs, 2.4, -0.18, C.b, '#141020');
ear(g, hx + 2, hy - 3.2 * hs, 7.6 * hs, 2.4, 0.14, C.b, '#141020');
eye(g, hx + 4 * hs, hy - 1.1, 1.4, C.eye, rgba(C.eye, 0.55));
path(g, [[hx + 5.6, hy + 3.4], [hx + 6.6, hy + 6.4], [hx + 7.8, hy + 3.4]], '#f6eedc');
path(g, [[hx + 9.2, hy + 3.4], [hx + 10, hy + 5.8], [hx + 10.8, hy + 3.4]], '#f6eedc');
tack(g, o, 0, y - 5, 9);
};

/* ==========================================================
4 · SABUESO SOMBRÍO — cuerpo de humo, patas que se disuelven
========================================================== */
R.shadow_hound = function (g, o) {
const C = { b: '#2a2038', d: '#171226', l: '#4c3c68', wisp: '#8a66f0', eye: '#c8a8ff', fang: '#d8ccff' };
const bob = sin(o.ph) * 1.0, sw = sin(o.ph) * 4.4, lg = o.lunge, y = -13 + bob;
smoke(g, -10, y + 1, 7, C.wisp, o.t, 0);
g.save(); g.globalAlpha = 0.8;
leg(g, -7, -8, 8, 2.8, sw, C.d); leg(g, 6, -8, 8, 2.8, -sw, C.d);
leg(g, -4, -8, 8, 2.6, -sw * 0.85, C.b); leg(g, 9, -8, 8, 2.6, sw * 0.85, C.b);
g.restore();
glow(g, 0, y, 17, C.wisp, 0.2);
g.save(); g.globalAlpha = 0.93; blob(g, 0, y, 11, 5.8, C.b, C.l); g.restore();
fur(g, 3, y - 4, 11, y - 2, 6, 4.0, C.d, 8);
curve(g, -10, y, -16, y - 6 + sw * 0.5, -20, y + 1 + sw * 0.3, rgba(C.wisp, 0.6), 4.0);
const hx = 11 + lg, hy = y - 3.6, hs = o.hs;
path(g, [[hx - 4, hy + 3], [hx - 2, hy - 3 * hs], [hx + 3, hy - 2.4 * hs], [hx + 4, hy + 2]], C.b, C.d, OW);
path(g, [[hx + 2, hy - 0.5], [hx + 10 * hs, hy + 0.7], [hx + 10 * hs, hy + 2.5], [hx + 2, hy + 3]], C.l, C.d, 0.9);
ear(g, hx - 2.4, hy - 2.6 * hs, 6.6 * hs, 2.2, -0.16, C.b);
ear(g, hx + 1.8, hy - 2.8 * hs, 6.8 * hs, 2.2, 0.12, C.b);
eye(g, hx + 3.6 * hs, hy - 0.9, 1.4, C.eye, rgba(C.eye, 0.65));
eye(g, hx + 1.2 * hs, hy - 1.3, 1.0, C.eye, rgba(C.eye, 0.5));
if (o.atk >= 0) { path(g, [[hx + 5, hy + 2.5], [hx + 6.2, hy + 5], [hx + 7.4, hy + 2.5]], C.fang); }
for (let i = 0; i < 3; i++) {
const a = o.t * 2 + i * 2.1;
g.globalAlpha = 0.5 + 0.3 * sin(a);
ell(g, -4 + i * 6 + sin(a) * 1.6, y - 9 - i * 2 + cos(a) * 1.6, 0.9, 0.9, C.eye);
}
g.globalAlpha = 1;
tack(g, o, 0, y - 4, 8);
};

/* ==========================================================
5 · LINCE — PENCILLOS en orejas + cola mocha + patas grandes
========================================================== */
R.lynx = function (g, o) {
const C = { b: '#d0a464', d: '#8e6c3c', l: '#eec890', belly: '#f8efe0', tuft: '#2a1c0e' };
const bob = sin(o.ph) * 1.1, sw = sin(o.ph) * 3.4, y = -13 + bob;
leg(g, -5, -8, 8, 2.8, sw, C.d); leg(g, 5, -8, 8, 2.8, -sw, C.d);
leg(g, -2, -8, 8, 2.6, -sw * 0.8, C.b); leg(g, 8, -8, 8, 2.6, sw * 0.8, C.b);
ell(g, -5 + sw, 0, 2.8, 1.5, C.d); ell(g, 8 + sw * 0.8, 0, 2.8, 1.5, C.d);
blob(g, 0, y, 9, 5.2, C.b, C.l);
spots(g, 0, y, 9, 5.2, 10, rgba(C.d, 0.6), 4, 1.3);
ell(g, 0, y + 3, 6.5, 2.1, C.belly);
ell(g, -9, y - 1, 2.2, 2.0, C.b, C.d, 0.9);                    /* cola mocha */
const hx = 9 + o.lunge, hy = y - 3.6, hs = o.hs;
blob(g, hx, hy, 4.6 * hs, 4.2 * hs, C.b, C.l);
path(g, [[hx - 4, hy + 0.6], [hx - 7.4, hy + 4.6], [hx - 1, hy + 3.4]], C.belly, C.d, 0.8);  /* patilla */
path(g, [[hx + 1, hy + 1.6], [hx + 5.4 * hs, hy + 2.4], [hx + 1, hy + 3.6]], C.belly, C.d, 0.7);
ell(g, hx + 4.8 * hs, hy + 1.4, 1.1, 0.9, '#4a3020');
ear(g, hx - 3, hy - 3 * hs, 5.4 * hs, 2.2, -0.14, C.b);
ear(g, hx + 1.6, hy - 3.2 * hs, 5.6 * hs, 2.2, 0.14, C.b);
stroke(g, [[hx - 3.7, hy - 8 * hs], [hx - 4.6, hy - 12 * hs]], C.tuft, 1.6);   /* pencils */
stroke(g, [[hx + 2.3, hy - 8.4 * hs], [hx + 3.2, hy - 12.4 * hs]], C.tuft, 1.6);
eye(g, hx + 2.6 * hs, hy - 0.6, 1.2, '#7ac04a');
tack(g, o, 0, y - 4, 7);
};

/* ==========================================================
6 · ZORRO — COLA GIGANTE de punta blanca + medias negras
========================================================== */
R.fox = function (g, o) {
const C = { b: '#e07a30', d: '#9c4a18', l: '#ffa858', belly: '#fff4e6', sock: '#2e1c10', tip: '#fffaf2', nose: '#1e1008' };
const bob = sin(o.ph) * 1.0, sw = sin(o.ph) * 3.8, y = -12 + bob, tw = sin(o.ph * 0.6) * 3.4;
leg(g, -5, -8, 8, 2.3, sw, C.sock); leg(g, 5, -8, 8, 2.3, -sw, C.sock);
leg(g, -2, -8, 8, 2.1, -sw * 0.85, C.sock); leg(g, 8, -8, 8, 2.1, sw * 0.85, C.sock);
blob(g, 0, y, 8.4, 4.4, C.b, C.l);
ell(g, 1, y + 2.8, 6, 1.9, C.belly);
curve(g, -8, y, -16, y - 8 + tw, -22, y + 1 + tw, C.b, 8.0);     /* cola enorme */
curve(g, -8, y, -16, y - 8 + tw, -21, y + 0.5 + tw, C.l, 4.2);
ell(g, -22, y + 1 + tw, 3.4, 3.2, C.tip, shade(C.tip, -0.2), 0.8);
const hx = 8 + o.lunge, hy = y - 3.2, hs = o.hs;
path(g, [[hx - 3, hy - 2.6 * hs], [hx + 2, hy - 2 * hs], [hx + 8.6 * hs, hy + 1.6], [hx + 2, hy + 3], [hx - 3, hy + 2]], C.b, C.d, OW);
path(g, [[hx + 2.6, hy + 0.6], [hx + 8.4 * hs, hy + 1.6], [hx + 2.6, hy + 2.8]], C.belly);
ell(g, hx + 8.4 * hs, hy + 1.5, 1.0, 0.9, C.nose);
ear(g, hx - 3, hy - 2 * hs, 7.4 * hs, 2.6, -0.2, C.b, C.sock);
ear(g, hx + 1.6, hy - 2.4 * hs, 7.6 * hs, 2.6, 0.16, C.b, C.sock);
eye(g, hx + 2.2 * hs, hy - 0.6, 1.05, '#3a2010');
tack(g, o, 0, y - 3.4, 6.5);
};

/* ==========================================================
7 · CIERVO — ASTAS RAMIFICADAS altas + grupa blanca
========================================================== */
R.deer = function (g, o) {
const C = { b: '#b07c48', d: '#7a5430', l: '#d4a06c', belly: '#f8ecd8', ant: '#a08860', hoof: '#2a1c12' };
const bob = sin(o.ph) * 0.9, sw = sin(o.ph) * 4.4, y = -16 + bob;
leg(g, -7, -11, 11, 2.1, sw, C.d, C.hoof); leg(g, 6, -11, 11, 2.1, -sw, C.d, C.hoof);
leg(g, -4, -11, 11, 2.0, -sw * 0.85, C.b, C.hoof); leg(g, 9, -11, 11, 2.0, sw * 0.85, C.b, C.hoof);
blob(g, 0, y, 10, 5.0, C.b, C.l);
spots(g, -1, y - 1, 9, 4, 8, rgba('#fff4e0', 0.55), 9, 1.0);
ell(g, 0, y + 3, 7, 2.1, C.belly);
ell(g, -9.6, y - 1.6, 2.8, 3.0, C.belly, C.d, 0.8);
path(g, [[6, y - 2], [10 + o.lunge, y - 11], [13 + o.lunge, y - 11], [11, y + 1]], C.b, C.d, 0.9);
const hx = 12 + o.lunge, hy = y - 12, hs = o.hs;
path(g, [[hx - 2.6, hy - 1], [hx + 2, hy - 3 * hs], [hx + 7 * hs, hy + 1.4], [hx + 6 * hs, hy + 3.4], [hx - 1, hy + 2.6]], C.b, C.d, OW);
ell(g, hx + 6.6 * hs, hy + 2.4, 1.1, 0.9, '#2a1810');
ear(g, hx - 2.6, hy - 1.4, 4.4, 2.4, -0.7, C.l);
ear(g, hx + 1.6, hy - 2.6, 4.2, 2.2, 0.5, C.l);
eye(g, hx + 2.2 * hs, hy - 0.4, 1.1, '#2a1a10');
if (!o.baby) { antler(g, hx - 0.8, hy - 3, -1, 12, C.ant); antler(g, hx + 2.2, hy - 3.2, 1, 12, C.ant); }
tack(g, o, 0, y - 4, 8);
};

/* ==========================================================
8 · RENO — ASTAS PALMADAS + melena blanca de cuello
========================================================== */
R.reindeer = function (g, o) {
const C = { b: '#9a8a74', d: '#665844', l: '#bcaC94', belly: '#f0eade', ant: '#d8c8a8', mane: '#fffaf0', hoof: '#33291e' };
const bob = sin(o.ph) * 0.9, sw = sin(o.ph) * 4.2, y = -16 + bob;
leg(g, -7, -11, 11, 2.8, sw, C.d, C.hoof); leg(g, 6, -11, 11, 2.8, -sw, C.d, C.hoof);
leg(g, -4, -11, 11, 2.6, -sw * 0.85, C.b, C.hoof); leg(g, 9, -11, 11, 2.6, sw * 0.85, C.b, C.hoof);
ell(g, -4 - sw * 0.85, 0, 2.6, 1.4, C.hoof); ell(g, 9 + sw * 0.85, 0, 2.6, 1.4, C.hoof);
blob(g, 0, y, 10.5, 6.0, C.b, C.l);
ell(g, 0, y + 3.4, 7.5, 2.3, C.belly);
ell(g, -10, y - 1, 2.4, 2.6, C.belly, C.d, 0.7);
path(g, [[6, y - 2], [10 + o.lunge, y - 10], [13 + o.lunge, y - 10], [11, y + 1]], C.b, C.d, 0.9);
fur(g, 4, y - 1, 12 + o.lunge, y - 9, 7, 4.4, C.mane, 8);       /* melena blanca */
const hx = 12 + o.lunge, hy = y - 11, hs = o.hs;
path(g, [[hx - 2.8, hy - 1], [hx + 2, hy - 3 * hs], [hx + 7.4 * hs, hy + 1.6], [hx + 6.4 * hs, hy + 3.6], [hx - 1, hy + 2.8]], C.b, C.d, OW);
ell(g, hx + 7 * hs, hy + 2.6, 1.5, 1.2, '#4a3c2e');
ear(g, hx - 2.8, hy - 1.4, 4.0, 2.2, -0.7, C.l);
eye(g, hx + 2.2 * hs, hy - 0.4, 1.05, '#2a1e14');
if (!o.baby) { palm(g, hx - 1.4, hy - 3, -1, 12, C.ant); palm(g, hx + 2.4, hy - 3.2, 1, 12, C.ant); }
tack(g, o, 0, y - 5, 8);
};

/* ==========================================================
9 · CONEJO — OREJAS MÁS ALTAS QUE EL CUERPO + salto
========================================================== */
R.rabbit = function (g, o) {
const C = { b: '#d4c4a8', d: '#9a8a72', l: '#f0e6d2', belly: '#fffaf0', ear: '#f0b0a8', tail: '#fffdf8' };
const hop = Math.abs(sin(o.ph * 0.8)) * 5.0, y = -7 - hop;
leg(g, -3, y + 3, 4 + hop * 0.3, 2.4, -hop * 0.3, C.d);
leg(g, 4, y + 3, 4 + hop * 0.3, 2.2, hop * 0.3, C.b);
blob(g, -1, y, 6.2, 4.8, C.b, C.l);
ell(g, 0, y + 2.6, 4.6, 2.0, C.belly);
ell(g, -6.6, y - 0.6, 2.4, 2.4, C.tail, shade(C.tail, -0.15), 0.7);
const hx = 5, hy = y - 3.4, hs = o.hs, tw = sin(o.t * 3) * 0.2;
blob(g, hx, hy, 3.6 * hs, 3.2 * hs, C.b, C.l);
ell(g, hx + 3.2 * hs, hy + 1, 1.0, 0.8, '#c07878');
g.save(); g.translate(hx - 1.8, hy - 2.4 * hs); g.rotate(-0.34 + tw);
ell(g, 0, -7.4 * hs, 1.8, 7.6 * hs, C.b, C.d, 0.9); ell(g, 0, -7.4 * hs, 0.9, 6.0 * hs, C.ear); g.restore();
g.save(); g.translate(hx + 1.4, hy - 2.6 * hs); g.rotate(0.14 - tw);
ell(g, 0, -7.8 * hs, 1.8, 8.0 * hs, C.b, C.d, 0.9); ell(g, 0, -7.8 * hs, 0.9, 6.4 * hs, C.ear); g.restore();
eye(g, hx + 1.9 * hs, hy - 0.4, 1.1, '#2a1a14');
};

/* ==========================================================
10 · BISONTE — JOROBA COLOSAL + cabeza gacha barbuda
========================================================== */
R.bison = function (g, o) {
const C = { b: '#5c4030', d: '#322014', l: '#82603f', shag: '#241810', horn: '#e0d4bc', hoof: '#161008' };
const bob = sin(o.ph) * 0.8, sw = sin(o.ph) * 3.4, y = -16 + bob;
leg(g, -8, -10, 10, 3.2, sw, C.b, C.hoof); leg(g, 7, -10, 10, 3.2, -sw, C.b, C.hoof);
leg(g, -5, -13, 13, 3.8, -sw * 0.8, C.shag, C.hoof); leg(g, 9, -13, 13, 3.8, sw * 0.8, C.shag, C.hoof);
path(g, [[-12, y + 6], [-11, y + 1], [-4, y - 12], [4, y - 11], [10, y - 2], [12, y + 5], [11, y + 7], [-11, y + 7]], C.b, C.d, OW);
g.save(); g.beginPath();
g.moveTo(-12, y + 6); g.lineTo(-4, y - 12); g.lineTo(4, y - 11); g.lineTo(10, y - 2); g.closePath(); g.clip();
ell(g, -2, y - 6, 8, 5, C.l); g.restore();
fur(g, -9, y - 6, 7, y - 8, 11, 5.6, C.shag, 5);
const hx = 11 + o.lunge, hy = y + 2, hs = o.hs;
blob(g, hx, hy, 5.8 * hs, 5.4 * hs, C.shag, shade(C.shag, 0.26));
fur(g, hx - 4, hy - 4.4 * hs, hx + 4, hy - 4.4 * hs, 6, 3.6, C.d, 2);
ell(g, hx + 4.6 * hs, hy + 2.8, 2.6, 2.0, '#3a2c22');
path(g, [[hx + 1, hy + 4.4], [hx + 2.6, hy + 9.6], [hx + 4.8, hy + 4.4]], C.shag);   /* barba */
horn(g, hx - 1.8, hy - 3.6 * hs, 6.2, -1.5, 2.4, C.horn, 2.8);
horn(g, hx + 3.4, hy - 3.8 * hs, 5.8, -1.2, 2.4, C.horn, 2.2);
eye(g, hx + 2.6 * hs, hy - 0.8, 1.0, '#160e06');
tack(g, o, -2, y - 8, 9);
};

/* ==========================================================
11 · OSO PARDO — masa redonda + orejas redondas + garras
========================================================== */
R.bear = function (g, o) {
const C = { b: '#6e4c32', d: '#3e2a1a', l: '#946c48', muzzle: '#d8b890', claw: '#f0e4d0', nose: '#160e06' };
const bob = sin(o.ph) * 1.0, sw = sin(o.ph) * 3.2, y = -15 + bob;
leg(g, -7, -9, 9, 4.4, sw, C.d); leg(g, 6, -9, 9, 4.4, -sw, C.d);
leg(g, -3, -9, 9, 4.2, -sw * 0.8, C.b); leg(g, 9, -9, 9, 4.2, sw * 0.8, C.b);
for (let i = 0; i < 2; i++) { const x = i ? 9 + sw * 0.8 : -3 - sw * 0.8; for (let k = -1; k <= 1; k++) stroke(g, [[x + k * 1.2, -0.6], [x + k * 1.2 + 0.7, 1.0]], C.claw, 0.8); }
blob(g, -1, y, 12.5, 8.0, C.b, C.l);
ell(g, -4, y - 5.4, 6.4, 3.6, shade(C.b, 0.14));
const hx = 11 + o.lunge, hy = y - 1.6, hs = o.hs;
blob(g, hx, hy, 5.8 * hs, 5.2 * hs, C.b, C.l);
ell(g, hx - 3.6 * hs, hy - 4.8 * hs, 2.4, 2.4, C.d, shade(C.d, -0.3), 0.7);   /* orejas redondas */
ell(g, hx + 2.8 * hs, hy - 5.2 * hs, 2.4, 2.4, C.d, shade(C.d, -0.3), 0.7);
ell(g, hx - 3.6 * hs, hy - 4.8 * hs, 1.2, 1.2, shade(C.b, 0.24));
ell(g, hx + 2.8 * hs, hy - 5.2 * hs, 1.2, 1.2, shade(C.b, 0.24));
ell(g, hx + 5.2 * hs, hy + 2, 3.4 * hs, 2.6 * hs, C.muzzle, C.d, 0.9);
ell(g, hx + 7.6 * hs, hy + 1.2, 1.4, 1.1, C.nose);
eye(g, hx + 2.6 * hs, hy - 1.2, 1.0, '#1c1008');
if (o.atk >= 0) path(g, [[hx + 5, hy + 3.6], [hx + 6.4, hy + 6], [hx + 7.8, hy + 3.6]], '#fff');
tack(g, o, -1, y - 6, 9);
};

/* ==========================================================
12 · OSO POLAR — CUELLO LARGO estirado + blanco hielo
========================================================== */
R.polar_bear = function (g, o) {
const C = { b: '#f0f6fa', d: '#a8bccb', l: '#ffffff', sh: '#cfe0ec', nose: '#14141a', eye: '#1c2028' };
const bob = sin(o.ph) * 1.0, sw = sin(o.ph) * 3.2, y = -16 + bob;
leg(g, -8, -10, 10, 4.4, sw, C.d); leg(g, 6, -10, 10, 4.4, -sw, C.d);
leg(g, -4, -10, 10, 4.2, -sw * 0.8, C.b); leg(g, 9, -10, 10, 4.2, sw * 0.8, C.b);
blob(g, -1, y, 13, 7.8, C.b, C.l);
ell(g, -2, y + 4.4, 10, 2.8, C.sh);
path(g, [[6, y - 3], [13 + o.lunge, y - 10], [17 + o.lunge, y - 9], [12, y + 1]], C.b, C.d, OW);  /* cuello largo */
const hx = 17 + o.lunge, hy = y - 9, hs = o.hs;
blob(g, hx, hy, 4.8 * hs, 4.2 * hs, C.b, C.l);
ell(g, hx - 2.8 * hs, hy - 3.6 * hs, 1.7, 1.7, C.d);
ell(g, hx + 2.2 * hs, hy - 4.0 * hs, 1.7, 1.7, C.d);
path(g, [[hx + 2.2, hy + 0.4], [hx + 9 * hs, hy + 1.6], [hx + 8.6 * hs, hy + 3.4], [hx + 2.2, hy + 3.4]], C.b, C.d, 0.9);
ell(g, hx + 8.8 * hs, hy + 2.2, 1.5, 1.2, C.nose);
eye(g, hx + 2.6 * hs, hy - 1.0, 1.0, C.eye);
if (o.atk >= 0) for (let i = 0; i < 3; i++) path(g, [[hx + 4 + i * 1.7, hy + 3.4], [hx + 4.8 + i * 1.7, hy + 5.6], [hx + 5.6 + i * 1.7, hy + 3.4]], '#fff');
tack(g, o, -1, y - 6, 10);
};

/* ==========================================================
13 · CABALLO — cuello arqueado + CRIN Y COLA largas + lucero
========================================================== */
R.horse = function (g, o) {
const C = { b: '#8e6444', d: '#5a3c24', l: '#b08458', mane: '#2e1c0e', hoof: '#1e140c', blaze: '#fff2e0' };
const bob = sin(o.ph) * 0.8, sw = sin(o.ph) * 4.8, lg = o.lunge, y = -17 + bob;
leg(g, -8, -11, 11, 2.7, sw, C.d, C.hoof); leg(g, 7, -11, 11, 2.7, -sw, C.d, C.hoof);
leg(g, -5, -11, 11, 2.5, -sw * 0.85, C.b, C.hoof); leg(g, 10, -11, 11, 2.5, sw * 0.85, C.b, C.hoof);
blob(g, 0, y, 12, 6.4, C.b, C.l);
curve(g, -11, y - 1, -18, y + 2 + sw * 0.5, -17, y + 12 + sw * 0.4, C.mane, 4.4);   /* cola larga */
curve(g, -11, y - 1, -17, y + 2 + sw * 0.5, -16, y + 11 + sw * 0.4, shade(C.mane, 0.22), 2.0);
path(g, [[7, y - 3], [11 + lg, y - 13], [15 + lg, y - 13], [13, y + 1]], C.b, C.d, OW);
fur(g, 7.5, y - 3.5, 13 + lg, y - 13.5, 8, 4.2, C.mane, 11);                        /* crin */
const hx = 14 + lg, hy = y - 14, hs = o.hs;
path(g, [[hx - 3, hy - 1], [hx + 2, hy - 3.4 * hs], [hx + 7.4 * hs, hy + 1.6], [hx + 6.4 * hs, hy + 4], [hx - 1, hy + 3]], C.b, C.d, OW);
path(g, [[hx + 2.4, hy - 2], [hx + 6.8 * hs, hy + 1.8], [hx + 5.6 * hs, hy + 3], [hx + 2, hy + 0.4]], C.blaze);
ell(g, hx + 7 * hs, hy + 2.8, 1.3, 1.1, '#33200f');
ear(g, hx - 2.4, hy - 1.6, 4.4, 1.7, -0.16, C.b);
ear(g, hx + 0.9, hy - 2.6, 4.6, 1.7, 0.14, C.b);
eye(g, hx + 1.8 * hs, hy - 0.4, 1.1, '#1e140c');
tack(g, o, 0, y - 5, 9);
};

/* ==========================================================
14 · PESADILLA — corcel negro EN LLAMAS + cuernos
========================================================== */
R.nightmare = function (g, o) {
const C = { b: '#241a32', d: '#100a1a', l: '#402e56', fire: '#ff7a30', fire2: '#c05af0', hoof: '#08060e', eye: '#e878ff', horn: '#5a4468' };
const bob = sin(o.ph) * 0.9, sw = sin(o.ph) * 5.0, lg = o.lunge, y = -17 + bob;
leg(g, -8, -11, 11, 2.9, sw, C.d, C.hoof); leg(g, 7, -11, 11, 2.9, -sw, C.d, C.hoof);
leg(g, -5, -11, 11, 2.7, -sw * 0.85, C.b, C.hoof); leg(g, 10, -11, 11, 2.7, sw * 0.85, C.b, C.hoof);
const xs = [-8 + sw, 7 - sw, -5 - sw * 0.85, 10 + sw * 0.85];
for (let i = 0; i < 4; i++) flame(g, xs[i], 0.6, 5.4, 2.0, i % 2 ? C.fire : C.fire2, o.t, i * 2.3);
glow(g, 0, y, 20, C.fire2, 0.18);
blob(g, 0, y, 12, 6.4, C.b, C.l);
for (let i = 0; i < 5; i++) flame(g, -12 - i * 2.4, y + 1 + i * 2.2 + sw * 0.3, 8 - i, 2.8 - i * 0.4, i % 2 ? C.fire : C.fire2, o.t, i * 1.7 + 4);
path(g, [[7, y - 3], [11 + lg, y - 13], [15 + lg, y - 13], [13, y + 1]], C.b, C.d, OW);
for (let i = 0; i < 7; i++) {
const t2 = i / 6;
flame(g, U.lerp(7.5, 13 + lg, t2), U.lerp(y - 3.5, y - 13.5, t2), 8.0, 2.4, i % 2 ? C.fire : C.fire2, o.t, i * 1.3);
}
const hx = 14 + lg, hy = y - 14, hs = o.hs;
path(g, [[hx - 3, hy - 1], [hx + 2, hy - 3.4 * hs], [hx + 7.4 * hs, hy + 1.6], [hx + 6.4 * hs, hy + 4], [hx - 1, hy + 3]], C.b, C.d, OW);
ell(g, hx + 7 * hs, hy + 2.8, 1.3, 1.1, '#08060e');
horn(g, hx - 1.8, hy - 2.6 * hs, 5.4, -1.9, 1.9, C.horn, -1.0);
horn(g, hx + 1.6, hy - 3 * hs, 5.0, -1.3, 1.8, C.horn, 0.8);
eye(g, hx + 1.8 * hs, hy - 0.4, 1.4, C.eye, rgba(C.eye, 0.65));
flame(g, hx + 0.4, hy - 4 * hs, 6.4, 2.0, C.fire2, o.t, 9);
tack(g, o, 0, y - 5, 9);
};

/* ==========================================================
15 · CAMELLO — DOS JOROBAS + cuello en S
========================================================== */
R.camel = function (g, o) {
const C = { b: '#d4ac6c', d: '#96773f', l: '#f0d09c', belly: '#f4e4c4', hoof: '#5a4428', hair: '#8a6a3a' };
const bob = sin(o.ph) * 1.1, sw = sin(o.ph) * 4.2, y = -18 + bob;
leg(g, -8, -12, 12, 2.7, sw, C.d, C.hoof); leg(g, 7, -12, 12, 2.7, -sw, C.d, C.hoof);
leg(g, -5, -12, 12, 2.5, -sw * 0.8, C.b, C.hoof); leg(g, 10, -12, 12, 2.5, sw * 0.8, C.b, C.hoof);
blob(g, 0, y + 1, 11, 5.0, C.b, C.l);
path(g, [[-9, y - 1], [-5.5, y - 11], [-1.5, y - 1], [3, y - 12], [7, y - 1]], C.b, C.d, OW);   /* dos jorobas */
ell(g, -5.5, y - 6.5, 2.8, 3.0, C.l); ell(g, 3, y - 7, 2.8, 3.4, C.l);
ell(g, 0, y + 4, 8, 2, C.belly);
curve(g, -11, y + 1, -14, y + 5 + sw * 0.3, -13, y + 10, C.hair, 2.0);
curve(g, 8, y - 1, 14 + o.lunge, y - 5, 14 + o.lunge, y - 15, C.b, 5.4);
curve(g, 8, y - 1, 14 + o.lunge, y - 5, 14 + o.lunge, y - 15, C.l, 2.4);
const hx = 14 + o.lunge, hy = y - 16, hs = o.hs;
path(g, [[hx - 2.6, hy - 1.6], [hx + 2, hy - 2.6 * hs], [hx + 7 * hs, hy + 0.6], [hx + 6 * hs, hy + 2.6], [hx - 1, hy + 2.4]], C.b, C.d, OW);
ell(g, hx + 6.6 * hs, hy + 1.4, 1.2, 1.0, C.d);
ear(g, hx - 2.4, hy - 1.4, 3.2, 1.6, -0.4, C.d);
eye(g, hx + 1.6 * hs, hy - 0.6, 1.0, '#2e2010');
tack(g, o, -1, y - 8, 8);
};

/* ==========================================================
16 · LLAMA — cuello ERGUIDO + orejas de plátano
========================================================== */
R.llama = function (g, o) {
const C = { b: '#dccca8', d: '#a08a68', l: '#f8eed8', wool: '#eee0c4', face: '#7a6a52', hoof: '#443626' };
const bob = sin(o.ph) * 0.8, sw = sin(o.ph) * 3.6, y = -16 + bob;
leg(g, -6, -11, 11, 2.3, sw, C.d, C.hoof); leg(g, 5, -11, 11, 2.3, -sw, C.d, C.hoof);
leg(g, -3, -11, 11, 2.1, -sw * 0.85, C.face, C.hoof); leg(g, 8, -11, 11, 2.1, sw * 0.85, C.face, C.hoof);
wool(g, 0, y, 9.6, 6.2, C.wool, C.l, 8);
curve(g, 7, y - 2, 11 + o.lunge, y - 11, 11 + o.lunge, y - 20, C.b, 4.8);
curve(g, 7, y - 2, 11 + o.lunge, y - 11, 11 + o.lunge, y - 20, C.wool, 2.4);
const hx = 11 + o.lunge, hy = y - 22, hs = o.hs;
blob(g, hx, hy, 3.4 * hs, 3.2 * hs, C.wool, C.l);
path(g, [[hx + 1, hy - 0.4], [hx + 6 * hs, hy + 1], [hx + 5.4 * hs, hy + 3], [hx + 1, hy + 2.6]], C.face, C.d, 0.9);
ell(g, hx + 5.6 * hs, hy + 2, 0.9, 0.7, '#33261a');
curve(g, hx - 2.6, hy - 2.6 * hs, hx - 5.4, hy - 7.4 * hs, hx - 2.4, hy - 9.4 * hs, C.face, 2.0);  /* plátano */
curve(g, hx + 1.4, hy - 2.8 * hs, hx + 4.2, hy - 7.6 * hs, hx + 1.6, hy - 9.8 * hs, C.face, 2.0);
eye(g, hx + 1.6 * hs, hy - 0.8, 1.1, '#2a1e14');
ell(g, -9, y - 2, 2.2, 2.6, C.wool, C.d, 0.6);
tack(g, o, 0, y - 5, 7.5);
};

/* ==========================================================
17 · ALPACA — columna de lana densísima + cara diminuta
========================================================== */
R.alpaca = function (g, o) {
const C = { w: '#f4ecdc', wd: '#c0b098', wl: '#fffdf6', face: '#7a6450', fl: '#9c8468', hoof: '#443626' };
const bob = sin(o.ph) * 0.9, sw = sin(o.ph) * 3.2, y = -15 + bob;
leg(g, -5, -10, 10, 2.5, sw, C.face, C.hoof); leg(g, 4, -10, 10, 2.5, -sw, C.face, C.hoof);
leg(g, -2, -10, 10, 2.3, -sw * 0.85, C.fl, C.hoof); leg(g, 7, -10, 10, 2.3, sw * 0.85, C.fl, C.hoof);
wool(g, 0, y, 10, 6.8, C.w, C.wl, 10);
curve(g, 6, y - 2, 9 + o.lunge, y - 10, 9.5 + o.lunge, y - 18, C.w, 5.6);
for (let i = 0; i < 6; i++) ell(g, 6.6 + i * 0.6 + o.lunge * (i / 6), y - 3 - i * 2.8, 2.9, 2.4, i % 2 ? C.w : C.wl, C.wd, 0.5);
const hx = 9.5 + o.lunge, hy = y - 20, hs = o.hs;
ell(g, hx, hy - 1.4, 4.0, 3.6, C.wl, C.wd, 0.8);                 /* copete */
path(g, [[hx - 1, hy - 0.4], [hx + 4.2 * hs, hy + 0.4], [hx + 4.4 * hs, hy + 2.6], [hx + 0.4, hy + 3], [hx - 1, hy + 2]], C.face, shade(C.face, -0.3), 0.9);
ell(g, hx + 4.2 * hs, hy + 1.8, 0.9, 0.7, '#33261a');
ear(g, hx - 2.4, hy - 3.4, 4.4, 1.5, -0.12, C.face);
ear(g, hx + 1.6, hy - 3.6, 4.6, 1.5, 0.12, C.face);
eye(g, hx + 1.4 * hs, hy - 0.2, 1.2, '#241a12');
ell(g, -9, y - 1, 2.6, 2.8, C.wl, C.wd, 0.6);
};

/* ==========================================================
18 · CABRA MONTÉS — cuernos hacia ATRÁS + barba + cola alzada
========================================================== */
R.goat = function (g, o) {
const C = { b: '#a89880', d: '#6e5e48', l: '#ccbcA0', belly: '#e8dcc8', horn: '#5e4e38', beard: '#f4ece0', hoof: '#2e2418' };
const bob = sin(o.ph) * 1.0, sw = sin(o.ph) * 3.8, y = -13 + bob;
leg(g, -5, -9, 9, 2.3, sw, C.d, C.hoof); leg(g, 5, -9, 9, 2.3, -sw, C.d, C.hoof);
leg(g, -2, -9, 9, 2.1, -sw * 0.85, C.b, C.hoof); leg(g, 8, -9, 9, 2.1, sw * 0.85, C.b, C.hoof);
blob(g, 0, y, 9, 5.0, C.b, C.l);
ell(g, 0, y + 3, 6.4, 2, C.belly);
stroke(g, [[-8.6, y - 1], [-10.6, y - 6.4]], C.d, 2.0);           /* cola alzada */
path(g, [[6, y - 2], [9 + o.lunge, y - 7], [12 + o.lunge, y - 6.4], [10, y + 1]], C.b, C.d, 0.9);
const hx = 12 + o.lunge, hy = y - 7, hs = o.hs;
path(g, [[hx - 2.6, hy - 1.6], [hx + 2, hy - 2.4 * hs], [hx + 6.8 * hs, hy + 1], [hx + 5.8 * hs, hy + 3], [hx - 1, hy + 2.6]], C.b, C.d, OW);
ell(g, hx + 6.4 * hs, hy + 2, 1.0, 0.8, '#33261a');
path(g, [[hx + 3, hy + 3], [hx + 3.6, hy + 8.6], [hx + 5.6, hy + 3]], C.beard, shade(C.beard, -0.3), 0.8);
horn(g, hx - 1.4, hy - 2.4 * hs, 11, -2.35, 2.2, C.horn, -2.0);   /* cuernos atrás */
horn(g, hx + 1.6, hy - 2.6 * hs, 10, -2.5, 2.0, shade(C.horn, 0.14), -1.8);
for (let i = 1; i <= 3; i++) ell(g, hx - 1.4 - i * 2.1, hy - 2.4 * hs - i * 1.6, 1.0, 0.6, shade(C.horn, -0.28));
ear(g, hx - 3, hy - 0.6, 3.0, 2.2, -1.1, C.l);
eye(g, hx + 2.2 * hs, hy - 0.4, 1.0, '#2a1e14');
};

/* ==========================================================
19 · CABRA LECHERA — blanca + UBRE llena + cencerro
========================================================== */
R.nanny = function (g, o) {
const C = { b: '#f6f0e4', d: '#bcb0a0', l: '#fffdf8', horn: '#9a8a70', udder: '#f8c4c0', hoof: '#443628', bell: '#e8b840' };
const bob = sin(o.ph) * 0.9, sw = sin(o.ph) * 3.4, y = -13 + bob;
leg(g, -5, -9, 9, 2.3, sw, C.d, C.hoof); leg(g, 5, -9, 9, 2.3, -sw, C.d, C.hoof);
leg(g, -2, -9, 9, 2.1, -sw * 0.85, C.b, C.hoof); leg(g, 8, -9, 9, 2.1, sw * 0.85, C.b, C.hoof);
blob(g, 0, y, 9.4, 5.2, C.b, C.l);
ell(g, -2, y + 5.0, 3.8, 2.8, C.udder, shade(C.udder, -0.3), 0.9);   /* ubre */
ell(g, -3.4, y + 7.2, 0.8, 1.1, shade(C.udder, -0.22)); ell(g, -1.2, y + 7.2, 0.8, 1.1, shade(C.udder, -0.22));
stroke(g, [[-9, y - 1], [-10.8, y - 6]], C.d, 1.8);
path(g, [[6, y - 2], [9 + o.lunge, y - 7], [12 + o.lunge, y - 6.4], [10, y + 1]], C.b, C.d, 0.9);
const hx = 12 + o.lunge, hy = y - 7, hs = o.hs;
path(g, [[hx - 2.6, hy - 1.6], [hx + 2, hy - 2.2 * hs], [hx + 6.6 * hs, hy + 1], [hx + 5.6 * hs, hy + 3], [hx - 1, hy + 2.4]], C.b, C.d, OW);
ell(g, hx + 6.2 * hs, hy + 2, 1.0, 0.8, '#8a7060');
path(g, [[hx + 3, hy + 3], [hx + 3.4, hy + 7.4], [hx + 5.2, hy + 3]], C.l, C.d, 0.7);
horn(g, hx - 1.2, hy - 2.2 * hs, 6.4, -2.3, 1.8, C.horn, -1.2);
horn(g, hx + 1.6, hy - 2.4 * hs, 6.0, -2.5, 1.7, shade(C.horn, 0.12), -1.0);
ear(g, hx - 3.2, hy + 0.4, 3.0, 2.2, -1.1, C.d);
eye(g, hx + 2.2 * hs, hy - 0.4, 1.0, '#2a2018');
stroke(g, [[hx - 3.4, hy + 3.4], [hx - 4.8, hy + 6.2]], '#7a5a3a', 1.1);
ell(g, hx - 5, hy + 7.2, 1.6, 1.9, C.bell, '#8a6a20', 0.8);
};

/* ==========================================================
20 · VACA — MANCHAS NEGRAS grandes + ubre + cencerro
========================================================== */
R.cow = function (g, o) {
const C = { b: '#f6f2e8', d: '#b8b0a0', patch: '#2e2822', l: '#ffffff', udder: '#f0b0b0', horn: '#e4d8bc', hoof: '#2e2822', bell: '#e0b040' };
const bob = sin(o.ph * 0.8) * 0.8, sw = sin(o.ph * 0.8) * 3.2, y = -16 + bob;
leg(g, -7, -10, 10, 3.4, sw, C.d, C.hoof); leg(g, 6, -10, 10, 3.4, -sw, C.d, C.hoof);
leg(g, -4, -10, 10, 3.2, -sw * 0.8, C.b, C.hoof); leg(g, 9, -10, 10, 3.2, sw * 0.8, C.b, C.hoof);
blob(g, 0, y, 12, 6.8, C.b, C.l);
spots(g, 0, y, 12, 6.8, 5, C.patch, 12, 3.6);                      /* manchas grandes */
ell(g, -3, y + 5.8, 3.8, 2.6, C.udder, shade(C.udder, -0.3), 0.9);
ell(g, -4.4, y + 7.8, 0.8, 1.1, shade(C.udder, -0.22)); ell(g, -2.2, y + 7.8, 0.8, 1.1, shade(C.udder, -0.22));
curve(g, -12, y - 1, -15, y + 4 + sw * 0.4, -14, y + 10, C.d, 1.8);
ell(g, -14, y + 10.6, 1.6, 2.0, C.patch);
const hx = 12 + o.lunge, hy = y - 3, hs = o.hs;
blob(g, hx, hy, 5.4 * hs, 4.8 * hs, C.b, C.l);
ell(g, hx - 1.4, hy - 2.6, 2.8, 2.4, C.patch);
ell(g, hx + 4.6 * hs, hy + 2.4, 3.2 * hs, 2.4 * hs, '#f0ccc4', C.d, 0.9);
ell(g, hx + 5.6 * hs, hy + 2.2, 0.7, 0.8, '#8a6a62'); ell(g, hx + 3.8 * hs, hy + 2.8, 0.7, 0.8, '#8a6a62');
horn(g, hx - 2.8, hy - 3.8 * hs, 5.2, -2.2, 2.0, C.horn, 1.4);
horn(g, hx + 2.6, hy - 4.0 * hs, 5.0, -0.9, 2.0, C.horn, -1.2);
ear(g, hx - 4.6, hy - 0.6, 2.8, 2.4, -1.3, C.b);
ear(g, hx + 5.2, hy - 1.2, 2.8, 2.4, 1.3, C.b);
eye(g, hx + 1.6 * hs, hy - 1.4, 1.1, '#241c14');
stroke(g, [[hx - 4, hy + 3], [hx - 5.6, hy + 6.2]], '#7a5a3a', 1.2);
ell(g, hx - 5.8, hy + 7.4, 1.8, 2.1, C.bell, '#8a6a20', 0.8);
};

/* ==========================================================
21 · OVEJA — nube de lana + CARA Y PATAS NEGRAS
========================================================== */
R.sheep = function (g, o) {
const C = { w: '#f8f4ea', wd: '#cec6b6', wl: '#ffffff', face: '#332c26', fl: '#4e463e', hoof: '#1e1a16' };
const bob = sin(o.ph * 0.9) * 0.8, sw = sin(o.ph * 0.9) * 2.8, y = -13 + bob;
leg(g, -5, -8, 8, 2.5, sw, C.face, C.hoof); leg(g, 4, -8, 8, 2.5, -sw, C.face, C.hoof);
leg(g, -2, -8, 8, 2.3, -sw * 0.8, C.fl, C.hoof); leg(g, 7, -8, 8, 2.3, sw * 0.8, C.fl, C.hoof);
wool(g, 0, y, 10.4, 6.6, C.w, C.wl, 9);
const hx = 9 + o.lunge, hy = y - 2, hs = o.hs;
ell(g, hx - 1.4, hy - 3.6, 3.6, 3.2, C.wl, C.wd, 0.8);
path(g, [[hx - 1, hy - 2], [hx + 5 * hs, hy - 1], [hx + 5.8 * hs, hy + 2.6], [hx + 1, hy + 3.6], [hx - 1, hy + 2]], C.face, '#181410', OW);
ell(g, hx + 5.2 * hs, hy + 2.2, 1.0, 0.8, '#12100c');
ear(g, hx - 1.8, hy + 0.4, 2.6, 2.2, -1.2, C.fl);
ear(g, hx + 3.6, hy - 2.4, 2.4, 2.0, 1.2, C.fl);
eye(g, hx + 2.4 * hs, hy - 0.2, 1.0, '#f8f0e0');
ell(g, hx + 2.4 * hs, hy - 0.2, 0.5, 0.55, '#12100c');
};

/* ==========================================================
22 · CERDO — HOCICO de disco + orejas caídas + cola rizada
========================================================== */
R.pig = function (g, o) {
const C = { b: '#f0b4ac', d: '#b87c74', l: '#ffd4cc', snout: '#e89890', hoof: '#6e5048', eye: '#33201c' };
const bob = sin(o.ph) * 0.9, sw = sin(o.ph) * 3.0, y = -12 + bob;
leg(g, -6, -7, 7, 3.2, sw, C.d, C.hoof); leg(g, 5, -7, 7, 3.2, -sw, C.d, C.hoof);
leg(g, -3, -7, 7, 3.0, -sw * 0.8, C.b, C.hoof); leg(g, 8, -7, 7, 3.0, sw * 0.8, C.b, C.hoof);
blob(g, 0, y, 10.5, 6.4, C.b, C.l);
ell(g, 0, y + 3.6, 7.5, 2.5, shade(C.b, -0.08));
g.strokeStyle = C.d; g.lineWidth = 1.8; g.lineCap = 'round';        /* cola rizada */
g.beginPath(); g.moveTo(-10, y - 1);
for (let i = 0; i < 14; i++) { const a = i / 14 * PI * 3.4; g.lineTo(-11.6 - i * 0.22 + cos(a) * 2.0, y - 2.4 + sin(a) * 2.0); }
g.stroke();
const hx = 10 + o.lunge, hy = y - 1, hs = o.hs;
blob(g, hx, hy, 5.2 * hs, 4.6 * hs, C.b, C.l);
path(g, [[hx - 3.4, hy - 3 * hs], [hx - 5.6, hy - 6.6 * hs], [hx - 0.4, hy - 4 * hs]], C.d, shade(C.d, -0.25), 0.8);
path(g, [[hx + 1.4, hy - 3.4 * hs], [hx + 3.8, hy - 6.8 * hs], [hx + 4.4, hy - 3.4 * hs]], C.d, shade(C.d, -0.25), 0.8);
ell(g, hx + 5.6 * hs, hy + 1.4, 3.0 * hs, 2.5 * hs, C.snout, C.d, OW);   /* disco */
ell(g, hx + 6 * hs, hy + 0.7, 0.7, 0.9, '#8a5a52'); ell(g, hx + 6 * hs, hy + 2.3, 0.7, 0.9, '#8a5a52');
eye(g, hx + 2.2 * hs, hy - 1.2, 1.0, C.eye);
};

/* ==========================================================
23 · GALLINA — CRESTA roja + barbillas + cola en abanico
========================================================== */
R.chicken = function (g, o) {
const C = { b: '#f8f0e0', d: '#bcb098', l: '#fffdf6', comb: '#e04038', beak: '#f0a828', leg: '#e88820', eye: '#241810' };
const bob = sin(o.ph * 1.6) * 0.9, sw = sin(o.ph * 1.6) * 2.4, peck = o.atk >= 0 ? sin(o.atk * PI) * 3.4 : 0;
stroke(g, [[-2, -4], [-2 + sw, 0]], C.leg, 1.7); stroke(g, [[2, -4], [2 - sw, 0]], C.leg, 1.7);
stroke(g, [[-2 + sw, 0], [-4.4 + sw, 0]], C.leg, 1.2); stroke(g, [[2 - sw, 0], [4.4 - sw, 0]], C.leg, 1.2);
const y = -8 + bob;
blob(g, 0, y, 7.0, 5.6, C.b, C.l);
path(g, [[-5, y - 1], [-12, y - 8], [-11, y - 1], [-14, y + 2], [-5, y + 2]], C.d, shade(C.d, -0.25), 0.9);
ell(g, -1, y + 0.6, 4.4, 3.4, shade(C.b, -0.06));
const hx = 5 + peck * 0.5, hy = y - 5 + peck, hs = o.hs;
blob(g, hx, hy, 3.2 * hs, 3.0 * hs, C.b, C.l);
path(g, [[hx - 2, hy - 2.4 * hs], [hx - 1, hy - 6.4 * hs], [hx + 0.2, hy - 3 * hs], [hx + 1.4, hy - 6.8 * hs], [hx + 2.8, hy - 2.6 * hs]], C.comb, shade(C.comb, -0.3), 0.8);
path(g, [[hx + 2.6 * hs, hy + 0.4], [hx + 7 * hs, hy + 1.4], [hx + 2.6 * hs, hy + 2.2]], C.beak, shade(C.beak, -0.35), 0.8);
ell(g, hx + 2.4 * hs, hy + 3.2, 1.3, 1.8, C.comb);
eye(g, hx + 1.4 * hs, hy - 0.4, 1.0, C.eye);
};

/* ==========================================================
24 · PATO — PICO PLANO ancho + cabeza verde + balanceo
========================================================== */
R.duck = function (g, o) {
const C = { b: '#f0e8d4', d: '#bcb098', l: '#fffdf6', head: '#2e8a4e', hl: '#4ab06a', bill: '#f0b828', leg: '#e88820', eye: '#141008' };
const wad = sin(o.ph * 1.4), bob = Math.abs(wad) * 0.9, sw = wad * 2.6;
stroke(g, [[-1.6, -4], [-1.6 + sw, 0]], C.leg, 1.7); stroke(g, [[2, -4], [2 - sw, 0]], C.leg, 1.7);
path(g, [[-3.8 + sw, 0], [0.6 + sw, 0], [-1.6 + sw, 1.4]], C.leg);
path(g, [[-0.2 - sw, 0], [4.2 - sw, 0], [2 - sw, 1.4]], C.leg);
const y = -8 - bob;
g.save(); g.rotate(wad * 0.06);
blob(g, 0, y, 7.6, 5.2, C.b, C.l);
path(g, [[-6, y - 1], [-12, y - 5], [-10, y + 1], [-6, y + 2]], C.d, shade(C.d, -0.25), 0.8);
const hx = 5, hy = y - 5.6, hs = o.hs;
curve(g, 3.4, y - 2, 5, y - 4, hx, hy + 1.4, C.head, 3.6);
blob(g, hx, hy, 3.2 * hs, 3.0 * hs, C.head, C.hl);
ell(g, hx, hy + 2.8, 2.8, 1.0, '#fffdf6');
path(g, [[hx + 2.2 * hs, hy - 0.6], [hx + 8.4 * hs, hy + 0.2], [hx + 8.2 * hs, hy + 2.4], [hx + 2.2 * hs, hy + 2.4]], C.bill, shade(C.bill, -0.35), OW);
ell(g, hx + 7.6 * hs, hy + 0.8, 0.5, 0.4, shade(C.bill, -0.45));
eye(g, hx + 1.4 * hs, hy - 0.8, 1.0, C.eye);
g.restore();
};

/* ==========================================================
25 · CÓNDOR — CABEZA CALVA ROJA + gola blanca + alas negras
========================================================== */
R.condor = function (g, o) {
const C = { b: '#22222a', d: '#0e0e14', l: '#3c3c48', ruff: '#f8f4e8', head: '#d0503a', hl: '#f07050', beak: '#f0e4c8', eye: '#f5c53a', patch: '#f8f4e8' };
const bob = sin(o.ph) * 0.7, sw = sin(o.ph) * 2.6, y = -14 + bob;
const flap = o.fly ? sin(o.t * 9) : sin(o.t * 1.6) * 0.1;
if (!o.fly) { stroke(g, [[-2, -4], [-2 + sw, 0]], '#5a5048', 2.2); stroke(g, [[3, -4], [3 - sw, 0]], '#5a5048', 2.2); }
for (let s2 = -1; s2 <= 1; s2 += 2) {
g.save(); g.translate(s2 * 2, y - 3);
g.rotate(s2 * ((o.fly ? 0.1 : 0.5) + flap * (o.fly ? 0.5 : 0.6)));
const span = o.fly ? 28 : 17;
path(g, [[0, 0], [s2 * span * 0.5, -9], [s2 * span, -4], [s2 * span * 0.86, 2], [s2 * span * 0.4, 4], [0, 3]], s2 < 0 ? C.d : C.b, C.d, OW);
for (let i = 0; i < 5; i++) {
const fx2 = s2 * (span * 0.45 + i * span * 0.11);
path(g, [[fx2, -3 + i * 0.4], [fx2 + s2 * 3.8, 1 + i * 0.6], [fx2 - s2 * 1.4, 2 + i * 0.4]], shade(C.b, -0.1));
}
if (o.fly) ell(g, s2 * span * 0.4, -1, 4.8, 2.4, rgba(C.patch, 0.9));
g.restore();
}
blob(g, 0, y, 9.4, 6.4, C.b, C.l);
path(g, [[-8, y], [-15, y + 3], [-12, y + 7], [-7, y + 4]], C.d, C.d, 0.8);
const hx = 8 + o.lunge, hy = y - 7, hs = o.hs;
ell(g, hx - 1.4, hy + 3.6, 4.6, 3.0, C.ruff, shade(C.ruff, -0.28), 0.9);   /* gola */
for (let i = 0; i < 7; i++) { const a = i / 7 * PI; ell(g, hx - 1.4 + cos(a) * 4.0, hy + 3.6 + sin(a) * 1.8, 1.5, 1.3, '#fffdf6'); }
curve(g, 5, y - 3, 7 + o.lunge, y - 5, hx, hy + 1.6, C.head, 3.4);
blob(g, hx, hy, 3.6 * hs, 3.4 * hs, C.head, C.hl);                          /* cabeza calva */
path(g, [[hx + 2.6 * hs, hy - 0.6], [hx + 8 * hs, hy + 0.8], [hx + 6.8 * hs, hy + 3.8], [hx + 2.6 * hs, hy + 2.2]], C.beak, shade(C.beak, -0.38), OW);
eye(g, hx + 1.2 * hs, hy - 1.0, 1.2, C.eye);
tack(g, o, 0, y - 5, 7);
};

/* ==========================================================
26 · GRIFO — cabeza y alas de ÁGUILA + grupa de LEÓN
========================================================== */
R.griffin = function (g, o) {
const C = { b: '#d0ac54', d: '#8e7030', l: '#f0d080', head: '#fff6e4', hd: '#c8bca0', beak: '#f0a828', wing: '#a8863c', wl: '#e0c470', tip: '#4e3a18', talon: '#2e2210', eye: '#3a2810' };
const bob = sin(o.ph) * 0.8, sw = sin(o.ph) * 4.0, lg = o.lunge, y = -16 + bob;
const flap = o.fly ? sin(o.t * 11) : sin(o.t * 2) * 0.12;
leg(g, -8, -10, 10, 3.2, o.fly ? 2 : sw, C.d, C.b);
leg(g, -5, -10, 10, 3.0, o.fly ? 2 : -sw * 0.85, C.b, C.b);
blob(g, -3, y, 10, 6.2, C.b, C.l);
curve(g, -12, y - 1, -18, y + 2 + sw * 0.4, -17, y + 9, C.d, 2.4);
ell(g, -17, y + 10, 2.4, 2.8, C.tip);
blob(g, 6, y - 1, 7.4, 6.0, C.head, '#fffdf6');
fur(g, 2, y + 3, 10, y + 3, 6, 2.6, C.hd, 4);
g.save(); g.translate(-2, y - 5); g.rotate((o.fly ? -0.5 : 0.18) + flap * (o.fly ? 0.55 : 1));
path(g, [[0, 0], [-17, -12 - flap * 4], [-26, -6], [-15, 2], [-4, 3]], C.wing, C.tip, OW);
for (let i = 0; i < 4; i++) stroke(g, [[-4 - i * 4.2, 1 - i * 1.8], [-15 - i * 2.8, -5 - i * 1.8]], shade(C.wing, -0.22), 0.9);
g.restore();
if (o.fly) {
stroke(g, [[5, y + 4], [7, y + 9]], C.beak, 2.2); stroke(g, [[9, y + 4], [11, y + 9]], C.beak, 2.2);
for (let k = -1; k <= 1; k++) { stroke(g, [[7 + k, y + 9], [7 + k * 1.8, y + 11.4]], C.talon, 1.0); stroke(g, [[11 + k, y + 9], [11 + k * 1.8, y + 11.4]], C.talon, 1.0); }
} else {
leg(g, 5, y + 3, 7, 2.6, -sw * 0.6, C.beak, C.talon);
leg(g, 9, y + 3, 7, 2.6, sw * 0.6, C.beak, C.talon);
}
const hx = 12 + lg, hy = y - 9, hs = o.hs;
curve(g, 8, y - 3, 10 + lg, y - 6, hx, hy + 2, C.head, 4.6);
blob(g, hx, hy, 4.8 * hs, 4.4 * hs, C.head, '#fffdf6');
fur(g, hx - 4, hy - 3 * hs, hx + 1, hy - 3.8 * hs, 4, 3.0, C.hd, 6);
path(g, [[hx + 3 * hs, hy - 1], [hx + 9.4 * hs, hy + 0.6], [hx + 8 * hs, hy + 3.8], [hx + 3 * hs, hy + 2.4]], C.beak, shade(C.beak, -0.38), OW);
path(g, [[hx + 8 * hs, hy + 3.8], [hx + 6.8 * hs, hy + 5.2], [hx + 5.6 * hs, hy + 2.8]], shade(C.beak, -0.28));
eye(g, hx + 1.8 * hs, hy - 1.2, 1.3, C.eye);
g.save(); g.translate(2, y - 5); g.rotate((o.fly ? -0.35 : 0.1) - flap * (o.fly ? 0.6 : 1));
path(g, [[0, 0], [-13, -15 + flap * 5], [-24, -10 + flap * 3], [-13, 1], [-3, 3]], C.wl, C.tip, OW);
for (let i = 0; i < 4; i++) stroke(g, [[-3 - i * 3.6, 1 - i * 2.2], [-12 - i * 2.6, -7 - i * 2 + flap * 3]], shade(C.wl, -0.24), 0.9);
path(g, [[-24, -10 + flap * 3], [-28, -8 + flap * 3], [-22, -6 + flap * 2]], C.tip);
g.restore();
tack(g, o, -1, y - 5, 8);
};

/* ==========================================================
27 · FÉNIX — ave de FUEGO perpetuo, núcleo incandescente
========================================================== */
R.phoenix = function (g, o) {
const C = { b: '#f07830', d: '#a8401a', l: '#ffa850', core: '#fff0b0', wing: '#ff8c38', tip: '#d0301a', crest: '#ffc840', eye: '#fffdf0', tail: '#ff9a40' };
const y = -14 - sin(o.t * 2.6) * 2.6, flap = sin(o.t * 8.5);
glow(g, 0, y, 26, C.b, 0.34);
for (let i = -1; i <= 1; i++) {
const ph2 = o.t * 3 + i * 1.4, tx = -12 - i * 2, ty = y + 2 + i * 2;
curve(g, -8, y + 1, tx - 6, ty + 4 + sin(ph2) * 2, tx - 13, ty + 9 + sin(ph2) * 3, rgba(C.tail, 0.85), 3.6 - Math.abs(i) * 0.6);
flame(g, tx - 13, ty + 10 + sin(ph2) * 3, 7, 2.4, i === 0 ? C.crest : C.tail, o.t, i * 2 + 3);
}
for (let s2 = -1; s2 <= 1; s2 += 2) {
g.save(); g.translate(s2 * 1.5, y - 3); g.rotate(s2 * (0.15 + flap * 0.5));
path(g, [[0, 0], [s2 * 13, -11], [s2 * 24, -6], [s2 * 20, 1], [s2 * 9, 3], [0, 3]], s2 < 0 ? C.d : C.wing, C.tip, OW);
for (let i = 0; i < 4; i++) {
const fx2 = s2 * (9 + i * 3.6);
path(g, [[fx2, -4 + i * 0.6], [fx2 + s2 * 4.4, 0.6 + i * 0.6], [fx2 - s2 * 1.2, 1.8 + i * 0.4]], i % 2 ? C.l : C.tip);
flame(g, fx2 + s2 * 2, -1 + i * 0.5, 4.6, 1.5, C.crest, o.t, i + s2 * 3);
}
g.restore();
}
blob(g, 0, y, 8.4, 6.0, C.b, C.l);
ell(g, 0, y + 1, 4.8, 3.6, C.core);
glow(g, 0, y + 1, 9, C.core, 0.55);
const hx = 7 + o.lunge, hy = y - 6, hs = o.hs;
curve(g, 4, y - 3, 6, y - 4.6, hx, hy + 1.6, C.b, 3.6);
blob(g, hx, hy, 3.8 * hs, 3.6 * hs, C.l, C.core);
path(g, [[hx + 2.8 * hs, hy - 0.4], [hx + 8 * hs, hy + 0.8], [hx + 6.8 * hs, hy + 2.8], [hx + 2.8 * hs, hy + 2]], '#f0a828', '#a86818', 0.9);
eye(g, hx + 1.4 * hs, hy - 1.0, 1.2, C.eye, rgba(C.core, 0.75));
flame(g, hx - 1.8, hy - 2.6 * hs, 7.4, 2.0, C.crest, o.t, 1);
flame(g, hx + 0.6, hy - 3 * hs, 9.0, 2.2, C.tail, o.t, 4);
flame(g, hx + 2.6, hy - 2.4 * hs, 6.6, 1.8, C.crest, o.t, 7);
for (let i = 0; i < 4; i++) {
const a = (o.t * 1.2 + i * 0.9) % 1;
g.globalAlpha = 0.75 * (1 - a);
ell(g, -6 + i * 4 + sin(o.t * 2 + i) * 2, y + 6 + a * 13, 1.1, 1.5, i % 2 ? C.core : C.tail);
}
g.globalAlpha = 1;
};

/* ==========================================================
28 · COCODRILO — HOCICO larguísimo + escudos dorsales
========================================================== */
R.crocodile = function (g, o) {
const C = { b: '#4e7040', d: '#28401f', l: '#729a56', belly: '#d4dba8', tooth: '#fffdf0', eye: '#f0c840' };
const und = sin(o.ph * 0.8) * 2.4, sw = sin(o.ph) * 2.4, y = -8;
leg(g, -6, -5, 5, 2.8, sw, C.d); leg(g, 6, -5, 5, 2.8, -sw, C.d);
leg(g, -3, -5, 5, 2.6, -sw, C.b); leg(g, 9, -5, 5, 2.6, sw, C.b);
path(g, [[-12, y + 3], [-11, y - 2], [0, y - 3.6], [10, y - 2], [13, y + 1], [12, y + 4], [-11, y + 4]], C.b, C.d, OW);
ell(g, 0, y + 2.6, 11, 1.7, C.belly);
for (let i = 0; i < 9; i++) { const x = -10 + i * 2.6; path(g, [[x, y - 2.8], [x + 1.2, y - 6.6 - (i % 2) * 1.4], [x + 2.4, y - 2.8]], C.d); }
curve(g, -12, y + 1, -20, y + 1 + und, -27, y + 3 + und * 1.4, C.b, 5.6);
curve(g, -12, y + 1, -20, y + 1 + und, -26, y + 3 + und * 1.4, C.l, 2.2);
const hx = 13 + o.lunge, hy = y - 0.4;
path(g, [[hx - 2, hy - 2.8], [hx + 14, hy - 1.6], [hx + 14, hy + 1.6], [hx - 2, hy + 2.8]], C.b, C.d, OW);
path(g, [[hx + 1, hy + 1.2], [hx + 13.6, hy + 0.8], [hx + 13.6, hy + 2], [hx + 1, hy + 2.4]], C.belly);
for (let i = 0; i < 8; i++) { const x = hx + 1.6 + i * 1.6; path(g, [[x, hy + 1.2], [x + 0.6, hy + 3.4], [x + 1.2, hy + 1.2]], C.tooth); }
ell(g, hx + 13.4, hy - 0.8, 0.6, 0.5, '#1a2412');
ell(g, hx + 0.6, hy - 3.6, 2.2, 1.9, C.l, C.d, 0.8);
eye(g, hx + 0.8, hy - 3.8, 1.1, C.eye);
};

/* ==========================================================
29 · RANA GIGANTE — OJOS SALTONES enormes + ancas + salto
========================================================== */
R.frog = function (g, o) {
const C = { b: '#5cb04a', d: '#2e7a28', l: '#8ad86a', belly: '#e4f0b0', eye: '#ffd83a' };
const hop = Math.abs(sin(o.ph * 0.7)) * 5.6, y = -7 - hop;
path(g, [[-7, y + 2], [-12, y + 5 + hop * 0.2], [-6, y + 6.4], [-3, y + 3]], C.d, C.d, 0.9);
path(g, [[5, y + 2], [10, y + 5 + hop * 0.2], [4, y + 6.4], [2, y + 3]], C.b, C.d, 0.9);
blob(g, 0, y, 8.6, 5.6, C.b, C.l);
ell(g, 0, y + 2.8, 6, 2.4, C.belly);
spots(g, -1, y - 1, 7, 4, 6, rgba(C.d, 0.5), 3, 1.3);
ell(g, 3.6, y - 5.2, 3.4, 3.4, C.b, C.d, OW);
ell(g, -1.6, y - 5.4, 3.4, 3.4, C.b, C.d, OW);
eye(g, 3.8, y - 5.4, 2.2, C.eye); eye(g, -1.4, y - 5.6, 2.2, C.eye);
ell(g, 3.8, y - 5.4, 0.8, 1.7, '#141008'); ell(g, -1.4, y - 5.6, 0.8, 1.7, '#141008');
curve(g, -3.4, y + 0.6, 2, y + 3.0, 7, y + 0.4, C.d, 1.2);
};

/* ==========================================================
30 · FOCA — torpedo SIN PATAS + aletas + bigotes
========================================================== */
R.seal = function (g, o) {
const C = { b: '#8e939c', d: '#565b64', l: '#b8bec6', belly: '#dfe4ea', nose: '#1e2026' };
const und = sin(o.ph * 0.7) * 2.6, bob = sin(o.ph * 0.7) * 0.8, y = -7 + bob;
path(g, [[-13, y + 4], [-18, y + 1 + und], [-21, y + 5 + und], [-14, y + 6]], C.d, C.d, 0.9);
path(g, [[-13, y + 4], [-18, y + 7 + und], [-21, y + 3 + und], [-14, y + 2]], C.b, C.d, 0.9);
blob(g, -1, y, 12, 5.6, C.b, C.l);
ell(g, 0, y + 3, 9, 2.4, C.belly);
spots(g, -2, y - 1, 10, 4, 10, rgba(C.d, 0.5), 6, 1.1);
path(g, [[1, y + 3], [-2, y + 9 + und * 0.4], [4, y + 6]], C.d, C.d, 0.9);
const hx = 10, hy = y - 2.6, hs = o.hs;
blob(g, hx, hy, 4.8 * hs, 4.4 * hs, C.b, C.l);
ell(g, hx + 3.8 * hs, hy + 1.6, 2.6 * hs, 2.0 * hs, C.belly, C.d, 0.8);
ell(g, hx + 5.4 * hs, hy + 0.8, 1.1, 0.9, C.nose);
for (let i = -1; i <= 1; i++) stroke(g, [[hx + 4.8 * hs, hy + 1.6 + i * 0.8], [hx + 9 * hs, hy + 1.2 + i * 1.9]], rgba('#ffffff', 0.65), 0.5);
eye(g, hx + 1.4 * hs, hy - 1.2, 1.5, '#16181e');
};

/* ==========================================================
31 · TORTUGA — CAPARAZÓN abovedado hexagonal
========================================================== */
R.turtle = function (g, o) {
const C = { sh: '#4e9250', sd: '#2a5c2c', sl: '#78be64', skin: '#82b060', belly: '#e0d8a8', eye: '#1c1408' };
const step = sin(o.ph * 0.6) * 1.6, bob = sin(o.ph * 0.6) * 0.4, y = -8 + bob;
leg(g, -6, -4, 4, 3.2, step, C.skin); leg(g, 5, -4, 4, 3.2, -step, C.skin);
leg(g, -3, -4, 4, 3.0, -step, shade(C.skin, -0.14)); leg(g, 8, -4, 4, 3.0, step, shade(C.skin, -0.14));
ell(g, 0, y + 2.4, 11, 3.4, C.belly, C.sd, 0.9);
g.save();
g.beginPath(); g.ellipse(0, y, 11.5, 8.0, 0, PI, 0); g.closePath();
g.fillStyle = C.sh; g.fill(); g.strokeStyle = C.sd; g.lineWidth = OW; g.stroke();
g.clip();
ell(g, -2, y - 3.4, 8, 4.4, C.sl);
for (let r = 0; r < 3; r++) for (let c = 0; c < 5; c++) {
const px = -8 + c * 4 + (r % 2 ? 2 : 0), py = y - 6 + r * 3.4;
const pts = [];
for (let k = 0; k < 6; k++) { const a = k / 6 * TAU; pts.push([px + cos(a) * 2.0, py + sin(a) * 1.6]); }
path(g, pts, r === 0 ? shade(C.sl, 0.12) : C.sh, C.sd, 0.6);
}
g.restore();
const hx = 11.5 + step * 0.4, hy = y + 1;
ell(g, hx, hy, 3.6 * o.hs, 3.0 * o.hs, C.skin, C.sd, OW);
ell(g, hx + 2.8 * o.hs, hy + 0.6, 1.2, 0.9, shade(C.skin, -0.18));
eye(g, hx + 1.2 * o.hs, hy - 1.0, 0.95, C.eye);
stroke(g, [[-11.5, y + 2], [-14.5, y + 3 - step * 0.3]], C.skin, 1.8);
};

/* ==========================================================
32 · CANGREJO — PINZAS asimétricas + cuerpo ancho + pedúnculos
========================================================== */
R.crab = function (g, o) {
const C = { b: '#e0603c', d: '#9c3a1e', l: '#ff8a5c', belly: '#ffc8a8', eye: '#160604' };
const sw = sin(o.ph * 1.4) * 2.2, cl = sin(o.t * 2.2) * 0.6 + (o.atk >= 0 ? 1.4 : 0);
for (let s2 = -1; s2 <= 1; s2 += 2) for (let k = 0; k < 3; k++) {
const s3 = (k % 2 ? sw : -sw);
stroke(g, [[s2 * 4, -6], [s2 * (8 + k * 1.8), -3.4 + s3 * 0.3], [s2 * (10.5 + k * 2), 0]], C.d, 1.5);
}
blob(g, 0, -8, 10.5, 6.4, C.b, C.l);
ell(g, 0, -5.4, 7, 2.5, C.belly);
for (let i = -1; i <= 1; i += 2) {
const ax = i * 12, ay = -10 + (i > 0 ? cl : -cl) * 1.5, big = i > 0 ? 1.25 : 0.9;
stroke(g, [[i * 7, -8], [ax * 0.8, ay + 1]], C.d, 2.6);
ell(g, ax, ay, 4.4 * big, 3.2 * big, C.b, C.d, OW);
ell(g, ax - 1, ay - 1, 2.6 * big, 1.6 * big, C.l);
path(g, [[ax + i * 2, ay - 2.6], [ax + i * 8 * big, ay - 4 - cl], [ax + i * 2.4, ay - 0.4]], C.l, C.d, 0.8);
path(g, [[ax + i * 2, ay + 1.6], [ax + i * 7 * big, ay + 2.8 + cl * 0.6], [ax + i * 2.4, ay + 0.4]], C.b, C.d, 0.8);
}
for (let i = -1; i <= 1; i += 2) { stroke(g, [[i * 2.8, -12], [i * 3.4, -15.6]], C.d, 1.2); eye(g, i * 3.4, -16.2, 1.4, C.eye); }
curve(g, -3.4, -6.4, 0, -4.8, 3.4, -6.4, C.d, 1.0);
};

/* ==========================================================
33 · ESCORPIÓN — AGUIJÓN arqueado sobre el cuerpo + pinzas
========================================================== */
R.scorpion = function (g, o) {
const C = { b: '#96502c', d: '#5a2c14', l: '#c07040', sting: '#ffd040', eye: '#2a1408' };
const sw = sin(o.ph) * 1.8, wig = sin(o.t * 2.4) * 0.24;
for (let i = 0; i < 4; i++) {
const x = -4 + i * 2.6, s2 = (i % 2 ? sw : -sw);
stroke(g, [[x, -5], [x - 2 + s2, -2.4], [x - 3.6 + s2, 0]], C.d, 1.2);
stroke(g, [[x, -5], [x + 2 - s2, -2.4], [x + 3.6 - s2, 0]], C.b, 1.2);
}
blob(g, -1, -6, 7, 3.6, C.b, C.l);
for (let i = 0; i < 4; i++) stroke(g, [[-6 + i * 3, -8.6], [-6 + i * 3, -3.4]], C.d, 0.8);
const cx = 7;
ell(g, cx + 2.8, -8.6 + sw * 0.3, 3.6, 2.4, C.b, C.d, OW);
ell(g, cx + 2.8, -3.4 - sw * 0.3, 3.6, 2.4, C.b, C.d, OW);
path(g, [[cx + 4.8, -9 + sw * 0.3], [cx + 9.4, -10 + sw * 0.3], [cx + 5.4, -7.2 + sw * 0.3]], C.l, C.d, 0.8);
path(g, [[cx + 4.8, -3 - sw * 0.3], [cx + 9.4, -2 - sw * 0.3], [cx + 5.4, -4.8 - sw * 0.3]], C.l, C.d, 0.8);
g.save(); g.translate(-7, -7); g.rotate(wig);
stroke(g, [[0, 0], [-3.4, -4.4], [-2.4, -10], [2.4, -13.6]], C.b, 3.0);
ell(g, 3, -14, 2.2, 1.9, C.l, C.d, 0.8);
path(g, [[4, -15], [8.6, -17.4], [4.6, -12.8]], C.sting, C.d, 0.8);
glow(g, 6, -15.5, 5, C.sting, 0.3);
g.restore();
eye(g, 3.4, -7.4, 0.8, C.eye); eye(g, 3.4, -5.2, 0.8, C.eye);
};

/* ==========================================================
34 · REY TROLL — CORONA + garrote + barriga + colmillos
========================================================== */
R.troll_king = function (g, o) {
const C = { b: '#6e9058', d: '#405c34', l: '#96b47e', belly: '#a8c088', wart: '#38502c', tusk: '#fff4dc', crown: '#f0c840', club: '#7a5230', eye: '#ffd040', nail: '#e0d8c0' };
const bob = sin(o.ph) * 0.9, sw = sin(o.ph) * 2.6, y = -14 + bob;
leg(g, -6, -6, 6, 5.0, sw, C.d, C.b); leg(g, 5, -6, 6, 5.0, -sw, C.d, C.b);
ell(g, -6 + sw, 0, 3.6, 1.7, C.d); ell(g, 5 - sw, 0, 3.6, 1.7, C.d);
blob(g, -1, y, 12.5, 9.6, C.b, C.l);
ell(g, 0, y + 4, 9, 5.2, C.belly);
spots(g, -3, y - 3, 9, 6, 7, rgba(C.wart, 0.7), 5, 1.2);
stroke(g, [[-8, y - 4], [-13, y + 2 + sw * 0.4], [-12, y + 8]], C.d, 4.8);
ell(g, -12, y + 9, 2.8, 2.4, C.d);
const hx = 7 + o.lunge, hy = y - 8, hs = o.hs;
blob(g, hx, hy, 5.6 * hs, 5.0 * hs, C.b, C.l);
ell(g, hx - 4.6 * hs, hy - 1.4, 2.0, 2.6, C.b, C.d, 0.8);
ell(g, hx + 4.8 * hs, hy - 1.8, 2.0, 2.6, C.b, C.d, 0.8);
path(g, [[hx - 2, hy + 2.4], [hx + 6.4 * hs, hy + 2.8], [hx + 5.8 * hs, hy + 5.2], [hx - 1.4, hy + 4.8]], shade(C.b, -0.2), C.d, 0.9);
path(g, [[hx + 0.6, hy + 4.8], [hx + 1.4, hy + 1.2], [hx + 2.6, hy + 4.8]], C.tusk, shade(C.tusk, -0.32), 0.8);
path(g, [[hx + 3.8, hy + 4.8], [hx + 4.6, hy + 1.4], [hx + 5.4, hy + 4.8]], C.tusk, shade(C.tusk, -0.32), 0.8);
eye(g, hx + 1.4 * hs, hy - 1.6, 1.1, C.eye);
eye(g, hx + 4.0 * hs, hy - 1.8, 1.0, C.eye);
spots(g, hx, hy - 1, 4.8, 3.8, 4, rgba(C.wart, 0.7), 9, 0.9);
const cy = hy - 4.8 * hs;
path(g, [[hx - 4.8, cy], [hx - 3.4, cy - 5], [hx - 1.7, cy - 1.2], [hx, cy - 6.4], [hx + 1.7, cy - 1.2], [hx + 3.4, cy - 5], [hx + 4.8, cy]], C.crown, '#a07820', OW);
ell(g, hx, cy - 1.6, 1.2, 1.2, '#e04b3a');
const raise = o.atk >= 0 ? sin(o.atk * PI) : 0;
g.save(); g.translate(9, y - 3); g.rotate(-0.5 - raise * 1.1);
stroke(g, [[0, 0], [6, 5]], C.b, 5.0);
ell(g, 6.6, 5.6, 3.0, 2.6, C.b, C.d, 0.8);
stroke(g, [[6, 5], [13, -4]], C.club, 3.4);
blob(g, 14.6, -6, 4.6, 5.8, shade(C.club, 0.14), shade(C.club, 0.34));
for (let i = 0; i < 4; i++) {
const a = i / 4 * TAU + 0.5;
path(g, [[14.6 + cos(a) * 3.8, -6 + sin(a) * 4.6], [14.6 + cos(a) * 6.8, -6 + sin(a) * 7.6], [14.6 + cos(a + 0.5) * 3.8, -6 + sin(a + 0.5) * 4.6]], C.nail, shade(C.nail, -0.32), 0.6);
}
g.restore();
path(g, [[-7, y + 6], [6, y + 6], [4, y + 11], [-5, y + 11]], '#7a5a3a', '#4a3620', 0.9);
stroke(g, [[-6, y + 6], [5, y + 6]], '#d9a441', 1.2);
};

/* ==========================================================
35 · HIDRA — TRES CABEZAS serpentinas con golas y veneno
========================================================== */
R.hydra = function (g, o) {
const C = { b: '#4e8046', d: '#2c5228', l: '#78ac60', belly: '#d0d89c', frill: '#9a5aa8', eye: '#ffd83a', venom: '#96f04a', fang: '#fffdf0' };
const und = sin(o.ph * 0.7) * 1.9, sw = sin(o.ph) * 2.0, lg = o.lunge, y = -9;
leg(g, -8, -5, 5, 3.4, sw, C.d); leg(g, 7, -5, 5, 3.4, -sw, C.d);
leg(g, -4, -5, 5, 3.2, -sw, C.b); leg(g, 10, -5, 5, 3.2, sw, C.b);
path(g, [[-14, y + 3], [-13, y - 3], [-4, y - 6], [6, y - 5], [13, y - 1], [14, y + 3], [12, y + 5], [-12, y + 5]], C.b, C.d, OW);
ell(g, 0, y + 3, 12, 2.3, C.belly);
for (let i = 0; i < 8; i++) { const px = -11 + i * 3; path(g, [[px, y - 4], [px + 1.4, y - 8 - (i % 2)], [px + 2.8, y - 4]], C.d); }
curve(g, -14, y + 1, -21, y + 1 + und, -28, y + 3 + und * 1.3, C.b, 5.0);
curve(g, -14, y + 1, -21, y + 1 + und, -27, y + 3 + und * 1.3, C.l, 2.2);
for (let i = -1; i <= 1; i++) {
const ph2 = o.t * 1.8 + i * 2.1, sway = sin(ph2) * 2.6;
const bx = i * 5, by = y - 4;
const hx = i * 11 + sway + lg * (i === 0 ? 1.5 : 0.9), hy = y - 24 - (i === 0 ? 5 : 0) + cos(ph2 * 0.8) * 1.8;
curve(g, bx, by, bx + i * 3 + sway * 0.5, (by + hy) / 2, hx, hy + 3, i === 0 ? C.b : shade(C.b, -0.1), 5.0 - Math.abs(i) * 0.6);
curve(g, bx + 1, by, bx + i * 3 + sway * 0.5 + 1, (by + hy) / 2, hx + 1, hy + 3, C.l, 1.7);
const hs = o.hs * (i === 0 ? 1.15 : 0.95);
path(g, [[hx - 4 * hs, hy + 1], [hx - 7.4 * hs, hy - 4.6 * hs], [hx - 2 * hs, hy - 2.4 * hs]], C.frill, shade(C.frill, -0.34), 0.8);
path(g, [[hx - 3 * hs, hy - 2 * hs], [hx - 5.2 * hs, hy - 7.4 * hs], [hx - 0.6 * hs, hy - 3 * hs]], C.frill, shade(C.frill, -0.34), 0.8);
path(g, [[hx - 3 * hs, hy - 2.4 * hs], [hx + 2 * hs, hy - 3 * hs], [hx + 9 * hs, hy + 0.4], [hx + 8 * hs, hy + 2.6], [hx - 2 * hs, hy + 2.6]], C.b, C.d, OW);
path(g, [[hx + 2, hy + 1.4], [hx + 8.6 * hs, hy + 1.2], [hx + 8 * hs, hy + 2.6], [hx + 2, hy + 2.6]], C.belly);
eye(g, hx + 1.6 * hs, hy - 1.2, 1.2, C.eye);
path(g, [[hx + 4.6, hy + 2.4], [hx + 5.2, hy + 5.2], [hx + 6, hy + 2.4]], C.fang);
path(g, [[hx + 6.8, hy + 2.4], [hx + 7.4, hy + 4.8], [hx + 8, hy + 2.4]], C.fang);
const drip = (o.t * 1.4 + i * 0.7) % 1;
g.globalAlpha = 0.85 * (1 - drip);
ell(g, hx + 5.4, hy + 5.6 + drip * 8, 0.9, 1.4, C.venom);
g.globalAlpha = 1;
if (o.atk >= 0 && i === 0) path(g, [[hx + 2, hy + 2.6], [hx + 9, hy + 2.6], [hx + 8, hy + 6], [hx + 3, hy + 6]], '#1a2410');
}
glow(g, 0, y - 15, 18, C.venom, 0.12);
};

/* ==========================================================
36 · GARANTÍA DE COBERTURA
Cualquier especie sin dibujante propio (o futura) recibe una
silueta ÚNICA derivada de su semilla: nunca un animal genérico.
========================================================== */
const HUMAN = { bandit: 1, skeleton: 1, guard: 1 };
let auto = 0;
Object.keys(D.SPECIES).forEach(function (id) {
if (R[id] || HUMAN[id]) return;
const sd = D.SPECIES[id], r = CR.RNG(U.hashStr('silueta:' + id));
const P = {
bl: 8 + r.next() * 8, bh: 4.5 + r.next() * 4.5, lg: 3 + r.next() * 9,
nk: r.next() * 11, hd: 3 + r.next() * 3.2, ear: r.int(0, 3),
tail: r.int(0, 3), crown: r.int(0, 3), pat: r.int(0, 3), col: sd.tint || '#8a8a92'
};
R[id] = function (g, o) {
const bob = sin(o.ph) * 0.9, sw = sin(o.ph) * 3.6;
const c = P.col, d = shade(c, -0.36), l = shade(c, 0.22), y = -P.lg - P.bh + bob;
leg(g, -P.bl * 0.6, y + P.bh - 1, P.lg, 2.6, sw, d);
leg(g, P.bl * 0.5, y + P.bh - 1, P.lg, 2.6, -sw, d);
leg(g, -P.bl * 0.25, y + P.bh - 1, P.lg, 2.4, -sw * 0.8, c);
leg(g, P.bl * 0.78, y + P.bh - 1, P.lg, 2.4, sw * 0.8, c);
blob(g, 0, y, P.bl, P.bh, c, l);
if (P.pat === 1) spots(g, 0, y, P.bl - 1, P.bh - 1, 7, rgba('#241c14', 0.5), 3, 1.6);
if (P.pat === 2) for (let i = -1; i <= 1; i++) stroke(g, [[i * 3.4, y - P.bh + 1], [i * 3.4 - 1, y + P.bh - 1]], d, 1.3);
if (P.pat === 3) ell(g, 0, y + P.bh * 0.5, P.bl * 0.72, P.bh * 0.42, shade(c, 0.34));
const hx = P.bl + P.nk * 0.6 + o.lunge, hy = y - P.nk;
if (P.nk > 3) curve(g, P.bl * 0.6, y - 1, P.bl + P.nk * 0.3, y - P.nk * 0.6, hx, hy + 2, c, P.hd * 0.95);
blob(g, hx, hy, P.hd * o.hs, P.hd * 0.9 * o.hs, c, l);
ell(g, hx + P.hd * 0.92, hy + 0.8, P.hd * 0.46, P.hd * 0.36, d);
if (P.ear === 1) ear(g, hx - 2, hy - P.hd, P.hd * 1.5, 2.0, -0.2, c, d);
if (P.ear === 2) ell(g, hx - 2.2, hy - P.hd * 1.2, 2.0, 2.8, l, d, 0.8);
if (P.ear === 3) ear(g, hx - 2.4, hy - P.hd * 0.4, 2.6, 2.2, -1.2, d);
if (P.crown === 1) { horn(g, hx - 1, hy - P.hd, 7, -2.1, 1.9, '#e0d4bc', -1.4); horn(g, hx + 2, hy - P.hd, 7, -1, 1.9, '#e0d4bc', 1.4); }
if (P.crown === 2) { antler(g, hx - 1, hy - P.hd, -1, 9, '#c8b898'); antler(g, hx + 2, hy - P.hd, 1, 9, '#c8b898'); }
if (P.crown === 3) for (let k = 0; k < 5; k++) path(g, [[-P.bl * 0.6 + k * 3, y - P.bh], [-P.bl * 0.6 + k * 3 + 1.3, y - P.bh - 4], [-P.bl * 0.6 + k * 3 + 2.6, y - P.bh]], d);
if (P.tail === 1) curve(g, -P.bl, y, -P.bl - 6, y - 5 + sw * 0.4, -P.bl - 9, y + 2, d, 3.8);
if (P.tail === 2) ell(g, -P.bl - 1.6, y - 1, 2.6, 2.4, l, d, 0.8);
if (P.tail === 3) curve(g, -P.bl, y, -P.bl - 5, y + 3 + sw * 0.3, -P.bl - 8, y + 7, c, 2.0);
eye(g, hx + P.hd * 0.36, hy - 0.6, 1.15, '#1a1008');
tack(g, o, 0, y - P.bh + 1, P.bl * 0.7);
};
auto++;
});

console.info('[CR] art-creatures.js v3 listo · ' + Object.keys(R).length + ' siluetas únicas' + (auto ? ' (' + auto + ' generadas por semilla)' : '') + ' · rasgo dominante por especie');
})();