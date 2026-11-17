/* ============================================================
KANATO DE JOTUN · art-people.js — Personas con identidad propia
Jugador (equipo visible), 10 NPC únicos, guardias, trabajadores
por rol/edad, bandido y esqueleto. Sin emojis.
Espacio local: origen en el suelo, +x hacia donde mira.
o = { t, ph, atk, face, sq, e, gender, free, equip, ride, bust,
      stage, child, role, angry, front, back, tint }
============================================================ */
(function () {
'use strict';
const CR = window.CR;
if (!CR || !CR.Art) { console.error('[CR] art-people.js requiere art.js'); return; }
const A = CR.Art, H = A.util, D = CR.DATA;
const ell = H.ell, path = H.path, blob = H.blob, leg = H.leg, stroke = H.stroke,
curve = H.curve, fur = H.fur, eye = H.eye, horn = H.horn, spots = H.spots,
rr = H.rr, lgrad = H.lgrad, glow = H.glow, shade = H.shade, rgba = H.rgba, mix = H.mix;
const sin = Math.sin, cos = Math.cos, PI = Math.PI;
const P = A.people;

/* ---------------- Paletas de material (compartidas con art-items) ---------------- */
const MAT = {
cloth:      { base: '#c8b898', dark: '#9a8a6a', lite: '#e6dcc4', glow: null },
leather:    { base: '#8a6a44', dark: '#5e4628', lite: '#b08a5c', glow: null },
iron:       { base: '#a8b0b8', dark: '#767e86', lite: '#d4dae0', glow: null },
steel:      { base: '#7a828c', dark: '#525a64', lite: '#aab2bc', glow: null },
mithril:    { base: '#6ac8e0', dark: '#3a8aa4', lite: '#b4ecf8', glow: '#8fd8f0' },
adamantite: { base: '#9a6ae0', dark: '#6a3aaa', lite: '#c8a8f8', glow: '#b08aff' }
};
function tierOf(id) { return id ? String(id).split('_')[0] : null; }
function matOf(id) { return MAT[tierOf(id)] || MAT.cloth; }

/* ---------------- Piezas compartidas ---------------- */
function legPair(g, o, col, boot, w) {
if (o.ride) {
path(g, [[-2, -12], [3, -12], [7, -7], [3, -6]], col, shade(col, -0.3), 0.6);
path(g, [[-2, -12], [-6, -7], [-2, -6], [1, -11]], shade(col, -0.12), shade(col, -0.35), 0.6);
ell(g, 7, -5.2, 2.2, 1.5, boot); ell(g, -6, -5.2, 2.2, 1.5, boot);
return;
}
const sw = sin(o.ph) * 3.0;
leg(g, -2.6, -11, 11, w || 3.0, sw, col, boot);
leg(g, 2.6, -11, 11, w || 3.0, -sw, shade(col, -0.1), boot);
}
function torsoBase(g, o, C) {
const top = -22, hip = -11, w = C.w || 6, col = C.top;
if (C.outfit === 'dress') {
path(g, [[-w, top + 2], [w, top + 2], [w + 1, hip - 2], [-w - 1, hip - 2]], col, shade(col, -0.35), 0.8);
path(g, [[-w - 1, hip - 3], [w + 1, hip - 3], [w + 4, hip + 4], [-w - 4, hip + 4]], C.skirt || shade(col, 0.14), shade(col, -0.3), 0.7);
stroke(g, [[-w - 2, hip + 1], [w + 2, hip + 1]], C.trim || shade(col, -0.2), 0.7);
} else if (C.outfit === 'robe') {
path(g, [[-w, top + 1], [w, top + 1], [w + 2, hip + 4], [-w - 2, hip + 4]], col, shade(col, -0.35), 0.8);
stroke(g, [[0, top + 2], [0, hip + 3]], C.trim || shade(col, -0.25), 1);
path(g, [[-w, top + 1], [0, top + 4], [w, top + 1]], C.trim || shade(col, -0.2));
} else if (C.outfit === 'coat') {
path(g, [[-w, top + 2], [w, top + 2], [w + 1, hip + 2], [-w - 1, hip + 2]], col, shade(col, -0.35), 0.8);
path(g, [[-1, top + 2], [1, top + 2], [1.6, hip + 2], [-1.6, hip + 2]], C.shirt || '#e8e0cc', shade(col, -0.3), 0.5);
for (let i = 0; i < 3; i++) ell(g, 2.4, top + 5 + i * 4, 0.7, 0.7, C.buckle || '#d9a441');
} else {
path(g, [[-w, top + 2], [w, top + 2], [w - 0.5, hip], [-w + 0.5, hip]], col, shade(col, -0.35), 0.8);
}
if (C.belt !== false) {
const bc = C.beltCol || '#4a3620';
rr(g, -w + 0.5, hip - 2.4, (w - 0.5) * 2, 2.4, 0.8, bc, shade(bc, -0.3), 0.5);
ell(g, 0, hip - 1.2, 1.1, 0.9, C.buckle || '#d9a441');
}
}
function backArm(g, o, C) {
const sw = o.ride ? 0 : sin(o.ph) * 2.2, sy = -20, w = C.w || 6;
const col = C.sleeve || C.top;
stroke(g, [[-w + 1, sy], [-w - 1 + sw * 0.4, sy + 6], [-w - 0.5 + sw * 0.6, sy + 9]], shade(col, -0.15), 2.6);
ell(g, -w - 0.5 + sw * 0.6, sy + 9.6, 1.5, 1.5, shade(C.skin, -0.1));
if (C.backHand) C.backHand(g, o, -w - 0.5 + sw * 0.6, sy + 9.6);
}
function frontArm(g, o, C) {
const swing = o.atk >= 0 ? sin(o.atk * PI) : 0;
const sy = -20, w = C.w || 6;
const hx = w + 1 + swing * 3, hy = sy + 8 - swing * 6;
const col = C.sleeve || C.top;
stroke(g, [[w - 1, sy], [w + 1, sy + 4], [hx, hy]], col, 2.6);
ell(g, hx, hy, 1.6, 1.6, C.skin);
if (C.hand) C.hand(g, o, hx, hy, swing);
}
function headBase(g, o, C) {
const hy = -26.5, r = 5.2;
rr(g, -1.6, -23.8, 3.2, 3.4, 1, C.skin, shade(C.skin, -0.25), 0.5);
blob(g, 0.6, hy, r, r * 1.05, C.skin, shade(C.skin, 0.14));
ell(g, -3.6, hy + 0.4, 1.2, 1.6, shade(C.skin, -0.06));
eye(g, 2.2, hy - 0.6, 0.85, C.eyeCol || '#2a1a10');
eye(g, 4.2, hy - 0.4, 0.75, C.eyeCol || '#2a1a10');
ell(g, 5.2, hy + 0.8, 1.0, 0.8, shade(C.skin, -0.12));
curve(g, 2.6, hy + 2.4, 3.6, hy + 2.9, 4.6, hy + 2.3, shade(C.skin, -0.4), 0.6);
if (C.beard) BEARDS[C.beard](g, hy, C);
if (C.hair && HAIRS[C.hair]) HAIRS[C.hair](g, o, hy, C);
if (C.hat && HATS[C.hat]) HATS[C.hat](g, o, hy, C);
if (C.face) C.face(g, o, hy, C);
}
function bust(g, o, C) {
g.save();
g.translate(0, 2); g.scale(1.35, 1.35); g.translate(0, 12);
const w = (C.w || 6) + 2;
path(g, [[-w, -15], [w, -15], [w - 1, -8], [-w + 1, -8]], C.top, shade(C.top, -0.35), 0.8);
if (C.trim) stroke(g, [[-w + 1, -12], [w - 1, -12]], C.trim, 0.8);
headBase(g, o, C);
if (C.bustProp) C.bustProp(g, o, C);
g.restore();
}
function person(g, o, C) {
if (o.bust) { bust(g, o, C); return; }
const bob = o.ride ? 0 : sin(o.ph) * 0.7;
g.save(); g.translate(0, bob);
if (C.back) C.back(g, o, C);
legPair(g, o, C.bottom || '#6a5a44', C.boots || '#3a2a1a', C.legW);
torsoBase(g, o, C);
backArm(g, o, C);
headBase(g, o, C);
frontArm(g, o, C);
if (C.front) C.front(g, o, C);
g.restore();
}

/* ---------------- Pelos / barbas / sombreros ---------------- */
const HAIRS = {
short: function (g, o, hy, C) {
const c = C.hairCol;
path(g, [[-4.6, hy - 1], [-4.2, hy - 5], [0, hy - 6.4], [4.4, hy - 4.6], [5, hy - 1.6], [3, hy - 3.4], [-1, hy - 4], [-3.4, hy - 2.4]], c, shade(c, -0.3), 0.6);
ell(g, -4.2, hy + 1.4, 1.2, 2.2, c);
},
messy: function (g, o, hy, C) {
const c = C.hairCol;
path(g, [[-4.8, hy - 0.6], [-5.4, hy - 4], [-3, hy - 6.6], [-1, hy - 5.4], [1, hy - 7], [3, hy - 5.6], [5, hy - 6.2], [5.2, hy - 2], [3, hy - 3.6], [-1, hy - 4.2], [-3.6, hy - 2.2]], c, shade(c, -0.3), 0.6);
ell(g, -4.4, hy + 1.6, 1.3, 2.4, c);
},
long: function (g, o, hy, C) {
const c = C.hairCol;
path(g, [[-5, hy - 1], [-4.6, hy - 5.4], [0, hy - 6.6], [4.6, hy - 4.8], [5.2, hy - 1.4], [3, hy - 3.4], [-1, hy - 4], [-3.6, hy - 2.2]], c, shade(c, -0.3), 0.6);
path(g, [[-4.8, hy - 1], [-6, hy + 6], [-4.4, hy + 9], [-3, hy + 4]], c, shade(c, -0.25), 0.5);
path(g, [[4.8, hy - 1], [5.6, hy + 5], [4.4, hy + 7], [3.6, hy + 2]], shade(c, -0.08), shade(c, -0.3), 0.5);
},
braid: function (g, o, hy, C) {
const c = C.hairCol;
path(g, [[-4.8, hy - 1], [-4.4, hy - 5.4], [0, hy - 6.6], [4.6, hy - 4.8], [5, hy - 1.6], [3, hy - 3.4], [-1, hy - 4], [-3.6, hy - 2.2]], c, shade(c, -0.3), 0.6);
for (let i = 0; i < 5; i++) ell(g, -5 - i * 0.5, hy + 2 + i * 2.6, 1.8 - i * 0.2, 1.6, i % 2 ? c : shade(c, 0.12), shade(c, -0.25), 0.4);
ell(g, -7.2, hy + 14, 1.0, 1.4, C.tie || '#d9a441');
},
bun: function (g, o, hy, C) {
const c = C.hairCol;
path(g, [[-4.6, hy - 1], [-4.2, hy - 5], [0, hy - 6.2], [4.4, hy - 4.6], [5, hy - 1.6], [3, hy - 3.2], [-1, hy - 3.8], [-3.4, hy - 2.2]], c, shade(c, -0.3), 0.6);
ell(g, -5.2, hy - 3.4, 2.6, 2.6, c, shade(c, -0.3), 0.6);
ell(g, -5.6, hy - 4, 1.2, 1.2, shade(c, 0.15));
},
slick: function (g, o, hy, C) {
const c = C.hairCol;
path(g, [[-4.6, hy - 1.4], [-4, hy - 5.2], [0.4, hy - 6.2], [4.6, hy - 4.4], [5, hy - 1.8], [2.6, hy - 3.6], [-1.4, hy - 4.2], [-3.6, hy - 2.6]], c, shade(c, -0.3), 0.6);
stroke(g, [[-2, hy - 5], [3, hy - 4.2]], shade(c, 0.3), 0.7);
},
gray: function (g, o, hy, C) { HAIRS.short(g, o, hy, C); }
};
const BEARDS = {
full: function (g, hy, C) {
const c = C.beardCol || C.hairCol;
path(g, [[-3.4, hy + 1], [-2, hy + 5.6], [1, hy + 7], [4.4, hy + 5.4], [5.4, hy + 2], [4.6, hy + 3.4], [1, hy + 4.4], [-2, hy + 3.4]], c, shade(c, -0.3), 0.5);
path(g, [[2.4, hy + 1.6], [4.6, hy + 1.8], [4.4, hy + 2.8], [2.6, hy + 2.6]], c);
},
goatee: function (g, hy, C) {
const c = C.beardCol || C.hairCol;
path(g, [[2.6, hy + 2.6], [4.6, hy + 2.8], [4, hy + 6], [2.8, hy + 5.4]], c, shade(c, -0.3), 0.5);
},
gray: function (g, hy, C) {
const c = C.beardCol || '#c8c0b0';
path(g, [[-3.4, hy + 1], [-2.4, hy + 6.4], [1, hy + 8], [4.6, hy + 6], [5.4, hy + 2], [4.6, hy + 3.6], [1, hy + 4.8], [-2, hy + 3.6]], c, shade(c, -0.3), 0.5);
},
stubble: function (g, hy, C) {
g.save(); g.globalAlpha = 0.4;
spots(g, 1.4, hy + 3, 4, 2.6, 8, C.beardCol || C.hairCol, 3, 0.5);
g.restore();
}
};
const HATS = {
straw: function (g, o, hy, C) {
const c = C.hatCol || '#d8b860';
ell(g, 0.4, hy - 4.6, 8.4, 2.6, c, shade(c, -0.35), 0.7);
path(g, [[-4, hy - 4.8], [-3, hy - 8.4], [3, hy - 8.4], [4.4, hy - 4.8]], shade(c, 0.1), shade(c, -0.3), 0.6);
stroke(g, [[-3.6, hy - 5.4], [4, hy - 5.4]], C.hatBand || '#8a5a3a', 1);
},
hood: function (g, o, hy, C) {
const c = C.hatCol || C.top;
path(g, [[-5.6, hy + 2], [-5.4, hy - 5], [0, hy - 7.4], [5.4, hy - 4.6], [5.8, hy + 1], [4.4, hy - 1], [0, hy - 3.4], [-4, hy - 1]], c, shade(c, -0.35), 0.7);
g.save(); g.globalAlpha = 0.3; ell(g, 1.6, hy - 0.4, 4, 3, '#000'); g.restore();
},
cap: function (g, o, hy, C) {
const c = C.hatCol || '#8a6a44';
path(g, [[-4.8, hy - 1.6], [-4.2, hy - 5.6], [0.4, hy - 6.6], [4.8, hy - 4.6], [5.2, hy - 1.8], [2.6, hy - 3.4], [-1.4, hy - 4], [-3.6, hy - 2.6]], c, shade(c, -0.3), 0.6);
ell(g, 5, hy - 2.2, 2.4, 0.9, shade(c, -0.15));
},
helm: function (g, o, hy, C) {
const m = C.hatMat || MAT.iron;
path(g, [[-5, hy - 0.6], [-4.6, hy - 5.4], [0.4, hy - 6.8], [5, hy - 4.6], [5.4, hy - 0.6], [3, hy - 2.6], [-1.4, hy - 3.2], [-3.6, hy - 1.6]], m.base, m.dark, 0.7);
rr(g, 4.4, hy - 2.4, 1.4, 4.4, 0.5, m.base, m.dark, 0.5);
stroke(g, [[-3, hy - 5], [3, hy - 4.4]], m.lite, 0.7);
},
fullhelm: function (g, o, hy, C) {
const m = C.hatMat || MAT.steel;
path(g, [[-5.2, hy + 2.4], [-5, hy - 5.4], [0.4, hy - 7], [5.4, hy - 4.6], [5.6, hy + 2.4], [3, hy + 3.4], [-2, hy + 3.4]], m.base, m.dark, 0.7);
rr(g, 1.4, hy - 1.4, 4.4, 1.4, 0.5, '#1a1a20');
stroke(g, [[-3, hy - 5.2], [3, hy - 4.6]], m.lite, 0.7);
if (m.glow) { g.save(); g.globalAlpha = 0.5; stroke(g, [[-4, hy - 2], [4, hy - 1.4]], m.glow, 0.8); g.restore(); }
},
plume: function (g, o, hy, C) {
HATS.helm(g, o, hy, C);
const c = C.plume || '#c0392b';
for (let i = 0; i < 4; i++) ell(g, -1 - i * 1.4, hy - 7 - i * 1.6, 1.6, 2.4, i % 2 ? c : shade(c, 0.15));
},
circlet: function (g, o, hy, C) {
const c = C.hatCol || '#e8c040';
stroke(g, [[-4.4, hy - 3.4], [4.6, hy - 2.8]], c, 1.4);
ell(g, 1, hy - 3.4, 1.2, 1.2, C.gem || '#e04b3a', shade(c, -0.3), 0.5);
glow(g, 1, hy - 3.4, 4, C.gem || '#e04b3a', 0.3);
},
headscarf: function (g, o, hy, C) {
const c = C.hatCol || '#3a8a8a';
path(g, [[-5, hy - 1], [-4.6, hy - 5.6], [0.4, hy - 6.8], [5, hy - 4.4], [5.4, hy - 1.2], [3, hy - 3], [-1.4, hy - 3.6], [-3.8, hy - 2]], c, shade(c, -0.3), 0.6);
path(g, [[-4.8, hy - 1], [-6.4, hy + 3], [-5, hy + 5], [-3.8, hy + 1]], shade(c, -0.1), shade(c, -0.3), 0.5);
stroke(g, [[-3, hy - 5], [3.4, hy - 4.2]], shade(c, 0.25), 0.7);
}
};

/* ---------------- Props (mano delantera) ---------------- */
function propSword(g, o, hx, hy, sw, m, len) {
g.save(); g.translate(hx, hy); g.rotate(-0.6 + sw * 1.8);
stroke(g, [[0, 2], [0, -2]], '#6a4a2a', 2.2);
rr(g, -3, -3, 6, 1.6, 0.6, m.dark, shade(m.dark, -0.3), 0.5);
const L = len || 14;
path(g, [[-1.2, -3], [1.2, -3], [0.8, -L], [0, -L - 2], [-0.8, -L]], m.base, m.dark, 0.7);
stroke(g, [[0, -4], [0, -L + 1]], m.lite, 0.7);
ell(g, 0, 2.6, 1.2, 1.2, m.dark);
if (m.glow) { g.save(); g.globalAlpha = 0.4; stroke(g, [[0, -4], [0, -L]], m.glow, 1.4); g.restore(); }
g.restore();
}
function propSpear(g, o, hx, hy, sw, m, venom) {
g.save(); g.translate(hx, hy); g.rotate(-0.5 + sw * 1.5);
stroke(g, [[0, 5], [0, -18]], '#8a6a44', 2);
path(g, [[-1.6, -18], [1.6, -18], [0, -25]], m.base, m.dark, 0.7);
stroke(g, [[0, -18], [0, -23]], m.lite, 0.6);
if (venom) { const dr = (o.t * 1.4) % 1; g.globalAlpha = 0.8 * (1 - dr); ell(g, 0, -24 + dr * 6, 0.8, 1.2, '#8ae04a'); g.globalAlpha = 1; }
g.restore();
}
function propDagger(g, o, hx, hy, sw) {
g.save(); g.translate(hx, hy); g.rotate(-0.5 + sw * 1.8);
stroke(g, [[0, 1.6], [0, -1]], '#4a3620', 1.8);
path(g, [[-1, -1], [1, -1], [0, -8]], '#b0b4b8', '#7a7e82', 0.6);
g.restore();
}
function propHammer(g, o, hx, hy, sw) {
g.save(); g.translate(hx, hy); g.rotate(-0.7 + sw * 1.6);
stroke(g, [[0, 2], [0, -10]], '#8a6a44', 2.2);
rr(g, -3.4, -13, 6.8, 4, 1, '#8a8a92', '#5a5a62', 0.7);
rr(g, -3.4, -13, 6.8, 1.4, 0.6, '#aab0b8');
g.restore();
}
function propPick(g, o, hx, hy, sw, m) {
g.save(); g.translate(hx, hy); g.rotate(-0.7 + sw * 1.7);
stroke(g, [[0, 2], [0, -11]], '#8a6a44', 2.2);
curve(g, -5, -12, 0, -15, 5, -11, m.base, 2.4);
curve(g, -5, -12, 0, -14, 5, -11, m.lite, 0.8);
g.restore();
}
function propAxe(g, o, hx, hy, sw, m) {
g.save(); g.translate(hx, hy); g.rotate(-0.7 + sw * 1.7);
stroke(g, [[0, 2], [0, -11]], '#8a6a44', 2.2);
path(g, [[0, -13], [5, -12], [4.4, -6], [0, -8]], m.base, m.dark, 0.7);
path(g, [[0, -13], [2, -12.6], [1.6, -8], [0, -8]], m.lite);
g.restore();
}
function propHoe(g, o, hx, hy, sw, m) {
g.save(); g.translate(hx, hy); g.rotate(-0.6 + sw * 1.6);
stroke(g, [[0, 2], [0, -11]], '#8a6a44', 2.2);
rr(g, -1, -13, 6, 2.4, 0.6, m.base, m.dark, 0.6);
g.restore();
}
function propRod(g, o, hx, hy, sw, m) {
g.save(); g.translate(hx, hy); g.rotate(-0.9 + sw * 0.8);
stroke(g, [[0, 2], [0, -16]], m ? m.base : '#a07840', 1.6);
g.strokeStyle = 'rgba(255,255,255,0.5)'; g.lineWidth = 0.6;
g.beginPath(); g.moveTo(0, -16); g.lineTo(2, -2); g.stroke();
ell(g, 0, -1, 1.2, 1.2, '#6a4a2a');
g.restore();
}
function propCan(g, o, hx, hy, sw) {
g.save(); g.translate(hx, hy); g.rotate(sw * 0.5);
rr(g, -1, -6, 7, 6, 1.4, '#7aa8c8', '#4a7898', 0.7);
stroke(g, [[6, -4], [10, -7]], '#7aa8c8', 1.6);
curve(g, 0, -6, 3, -9, 6, -6, '#4a7898', 1.2);
if (sw > 0.3) for (let i = 0; i < 3; i++) ell(g, 10 + i, -6 + i * 2, 0.6, 0.9, '#8fd0f0');
g.restore();
}
function propLedger(g, o, hx, hy) {
g.save(); g.translate(hx, hy); g.rotate(0.2);
rr(g, -2, -6, 7, 8, 0.8, '#7a4a2a', '#4a2a12', 0.7);
rr(g, -1, -5, 5, 6, 0.4, '#efe6d0');
stroke(g, [[0, -3], [3, -3]], '#8a7a5a', 0.5); stroke(g, [[0, -1], [3, -1]], '#8a7a5a', 0.5);
g.restore();
}
function propQuill(g, o, hx, hy) {
g.save(); g.translate(hx, hy); g.rotate(-0.4);
stroke(g, [[0, 0], [0, -7]], '#e8e0cc', 1);
path(g, [[0, -7], [-2, -11], [0, -9], [2, -11]], '#f4f0e0', '#b8b0a0', 0.5);
g.restore();
}
function propStaff(g, o, hx, hy) {
g.save(); g.translate(hx, hy);
stroke(g, [[0, 3], [0, -18]], '#c8b070', 2);
ell(g, 0, -20, 3.4, 3.4, '#e8c040', '#a07820', 0.7);
ell(g, 0, -20, 1.8, 1.8, '#fff0c0');
glow(g, 0, -20, 7, '#ffd070', 0.4);
for (let i = 0; i < 8; i++) { const a = i / 8 * PI * 2 + o.t; stroke(g, [[cos(a) * 4, -20 + sin(a) * 4], [cos(a) * 5.6, -20 + sin(a) * 5.6]], '#e8c040', 0.7); }
g.restore();
}
function propBasket(g, o, hx, hy) {
g.save(); g.translate(hx, hy);
path(g, [[-4, -2], [4, -2], [3, 4], [-3, 4]], '#b08a4a', '#7a5a2a', 0.7);
for (let i = -1; i <= 1; i++) stroke(g, [[i * 2.4, -2], [i * 2, 4]], '#8a6a3a', 0.5);
curve(g, -3, -2, 0, -6, 3, -2, '#8a6a3a', 1);
ell(g, -1.4, -2.6, 1.6, 1.4, '#d84040'); ell(g, 1.6, -2.8, 1.6, 1.4, '#e8a830'); ell(g, 0, -3.4, 1.4, 1.2, '#70b040');
g.restore();
}
function propBucket(g, o, hx, hy) {
g.save(); g.translate(hx, hy);
path(g, [[-3, -3], [3, -3], [2.4, 3], [-2.4, 3]], '#8a9aa8', '#5a6a78', 0.7);
curve(g, -3, -3, 0, -6, 3, -3, '#5a6a78', 0.9);
ell(g, 0, -2.6, 2.4, 0.8, '#8fd0f0');
g.restore();
}
function propPitchfork(g, o, hx, hy, sw) {
g.save(); g.translate(hx, hy); g.rotate(-0.5 + sw * 1.4);
stroke(g, [[0, 3], [0, -14]], '#8a6a44', 2);
for (let i = -1; i <= 1; i++) stroke(g, [[i * 2, -14], [i * 2.4, -20]], '#a8a8b0', 1.4);
stroke(g, [[-2, -14], [2, -14]], '#a8a8b0', 1.4);
g.restore();
}
function propPurse(g, o, hx, hy) {
g.save(); g.translate(hx, hy);
blob(g, 0, 0, 3, 3.4, '#7a5a3a', '#9a7a5a');
stroke(g, [[-2, -2.4], [2, -2.4]], '#d9a441', 0.8);
ell(g, 0, -3, 1, 1, '#e8c040');
g.restore();
}
function propShield(g, o, hx, hy, m) {
g.save(); g.translate(hx, hy);
path(g, [[-4, -6], [4, -6], [4, 2], [0, 6], [-4, 2]], m ? m.base : '#4a6a8a', m ? m.dark : '#2e4a6a', 0.8);
ell(g, 0, -1, 2.2, 2.2, '#e8c040', '#a07820', 0.6);
for (let i = 0; i < 8; i++) { const a = i / 8 * PI * 2; stroke(g, [[cos(a) * 2.6, -1 + sin(a) * 2.6], [cos(a) * 3.6, -1 + sin(a) * 3.6]], '#e8c040', 0.6); }
g.restore();
}
function propScroll(g, o, hx, hy) {
g.save(); g.translate(hx, hy); g.rotate(0.3);
rr(g, -2, -5, 5, 7, 0.6, '#efe6d0', '#b8b0a0', 0.6);
ell(g, 0.5, -5, 2.5, 1, '#d8d0c0'); ell(g, 0.5, 2, 2.5, 1, '#d8d0c0');
stroke(g, [[-1, -2], [2, -2]], '#8a7a5a', 0.5);
g.restore();
}
function propTongs(g, o, hx, hy) {
g.save(); g.translate(hx, hy); g.rotate(-0.3);
stroke(g, [[0, 0], [-1, -8]], '#6a6a72', 1.4); stroke(g, [[0, 0], [1.4, -8]], '#6a6a72', 1.4);
g.restore();
}

/* ---------------- Jugador: equipo visible ---------------- */
function drawBags(g, o, eq) {
const bags = [];
for (let i = 1; i <= 3; i++) if (eq['bag' + i]) bags.push(eq['bag' + i].id);
if (!bags.length) return;
for (let i = 0; i < bags.length; i++) {
const sz = bags[i] === 'bag_large' ? 5 : bags[i] === 'bag_medium' ? 4 : 3;
const bx = -6 - i * 1.6, by = -18 + i * 2.4;
blob(g, bx, by, sz, sz * 1.1, '#8a6a44', '#b08a5c');
rr(g, bx - sz * 0.6, by - sz * 0.9, sz * 1.2, sz * 0.5, 0.6, '#6a4a2a');
stroke(g, [[bx - sz * 0.5, by - sz], [bx + sz * 0.5, by - sz]], '#4a3620', 0.7);
ell(g, bx, by, 1, 1, '#d9a441');
}
}
function playerLegs(g, o, m, fem) {
const col = m ? m.base : (fem ? '#9a8a6a' : '#8a7a5a');
const boot = m && m !== MAT.cloth && m !== MAT.leather ? m.dark : '#3a2a1a';
legPair(g, o, col, boot, fem ? 2.6 : 3.0);
if (m && (m === MAT.iron || m === MAT.steel || m === MAT.mithril || m === MAT.adamantite)) {
const sw = o.ride ? 0 : sin(o.ph) * 3.0;
ell(g, -2.6 + sw, -6, 2, 1.6, m.lite, m.dark, 0.5);
ell(g, 2.6 - sw, -6, 2, 1.6, m.lite, m.dark, 0.5);
}
}
function playerChest(g, o, m, fem) {
const top = -22, hip = -11, w = fem ? 5 : 6;
const col = m ? m.base : '#b8a888';
path(g, [[-w, top + 2], [w, top + 2], [w - 0.5, hip], [-w + 0.5, hip]], col, m ? m.dark : shade(col, -0.35), 0.8);
if (!m || m === MAT.cloth) {
stroke(g, [[0, top + 3], [0, hip - 1]], shade(col, -0.2), 0.7);
path(g, [[-w, top + 2], [0, top + 5], [w, top + 2]], shade(col, -0.15));
} else if (m === MAT.leather) {
for (let i = 0; i < 3; i++) { rr(g, -1, top + 4 + i * 3, 2, 1.4, 0.4, '#5e4628'); ell(g, 0, top + 4.7 + i * 3, 0.5, 0.5, '#d9a441'); }
stroke(g, [[-w + 1, top + 3], [-w + 2, hip - 1]], '#5e4628', 0.8);
} else {
path(g, [[-w + 1, top + 3], [w - 1, top + 3], [w - 2, top + 8], [-w + 2, top + 8]], m.lite, m.dark, 0.6);
for (let i = -1; i <= 1; i += 2) ell(g, i * (w - 2), top + 5, 0.7, 0.7, m.dark);
stroke(g, [[0, top + 8], [0, hip - 1]], m.dark, 0.8);
ell(g, -w + 0.5, top + 3, 2.4, 1.8, m.base, m.dark, 0.6);
ell(g, w - 0.5, top + 3, 2.4, 1.8, m.base, m.dark, 0.6);
if (m === MAT.adamantite) { path(g, [[-w, top + 2], [-w - 2, top - 1], [-w + 1, top + 3]], m.lite, m.dark, 0.5); path(g, [[w, top + 2], [w + 2, top - 1], [w - 1, top + 3]], m.lite, m.dark, 0.5); }
if (m.glow) { g.save(); g.globalAlpha = 0.4; stroke(g, [[-w + 2, top + 6], [w - 2, top + 6]], m.glow, 1); g.restore(); }
}
const bc = '#4a3620';
rr(g, -w + 0.5, hip - 2.4, (w - 0.5) * 2, 2.4, 0.8, bc, shade(bc, -0.3), 0.5);
ell(g, 0, hip - 1.2, 1.1, 0.9, '#d9a441');
}
function playerHead(g, o, m, fem, skin, hairC) {
const hy = -26.5;
rr(g, -1.6, -23.8, 3.2, 3.4, 1, skin, shade(skin, -0.25), 0.5);
blob(g, 0.6, hy, 5.2, 5.4, skin, shade(skin, 0.14));
ell(g, -3.6, hy + 0.4, 1.2, 1.6, shade(skin, -0.06));
eye(g, 2.2, hy - 0.6, 0.85, '#2a1a10'); eye(g, 4.2, hy - 0.4, 0.75, '#2a1a10');
ell(g, 5.2, hy + 0.8, 1.0, 0.8, shade(skin, -0.12));
curve(g, 2.6, hy + 2.4, 3.6, hy + 2.9, 4.6, hy + 2.3, shade(skin, -0.4), 0.6);
const C = { skin: skin, hairCol: hairC };
if (!m) { (fem ? HAIRS.braid : HAIRS.messy)(g, o, hy, C); return; }
if (m === MAT.cloth) { HATS.hood(g, o, hy, { hatCol: '#c8b898', top: '#c8b898' }); (fem ? HAIRS.braid : HAIRS.short)(g, o, hy, C); }
else if (m === MAT.leather) { HATS.cap(g, o, hy, { hatCol: '#8a6a44' }); }
else if (m === MAT.iron) { HATS.helm(g, o, hy, { hatMat: m }); }
else if (m === MAT.steel) { HATS.fullhelm(g, o, hy, { hatMat: m }); }
else if (m === MAT.mithril) { HATS.helm(g, o, hy, { hatMat: m }); HATS.circlet(g, o, hy, { hatCol: m.lite, gem: m.glow }); }
else { HATS.fullhelm(g, o, hy, { hatMat: m }); horn(g, -4, hy - 4, 5, -2.4, 1.4, m.lite, -1); horn(g, 4, hy - 4, 5, -0.7, 1.4, m.lite, 1); }
}
function collar(g, o) {
stroke(g, [[-3, -22.6], [3, -22.2]], '#8a8a92', 1.8);
ell(g, 0, -21.4, 1.6, 1.6, '#6a6a72', '#4a4a52', 0.5);
stroke(g, [[0, -20], [-2, -17]], '#8a8a92', 1);
}
function accessories(g, o, eq) {
if (eq.belt) {
const troll = eq.belt.id === 'belt_troll';
rr(g, -6, -13.4, 12, 2.6, 0.8, troll ? '#6a4a2a' : '#4a3620', '#3a2a1a', 0.5);
ell(g, 0, -12.1, 1.4, 1.1, troll ? '#e8dcc8' : '#d9a441');
if (troll) path(g, [[-1, -12.4], [0, -10.6], [1, -12.4]], '#f0e8d0');
}
if (eq.amulet) {
stroke(g, [[-2.4, -22.4], [0, -19.4], [2.4, -22.4]], '#d9a441', 0.8);
ell(g, 0, -18.8, 1.6, 1.8, '#e07030', '#a04818', 0.5);
glow(g, 0, -18.8, 4, '#ff9a40', 0.4);
}
if (eq.charm) { blob(g, 5, -12, 1.8, 2, '#3a7a3a', '#5aa05a'); stroke(g, [[5, -13.6], [5, -14.6]], '#d9a441', 0.6); }
if (eq.ring) ell(g, 7, -13, 0.8, 0.8, '#e8c040', '#a07820', 0.4);
}
function toolOnBack(g, o, eq) {
const t = eq.tool; if (!t) return;
const def = D.ITEMS[t.id]; if (!def || !def.tool) return;
const m = matOf(t.id);
g.save(); g.translate(-5, -18); g.rotate(0.6);
if (def.tool.kind === 'pick') { stroke(g, [[0, 6], [0, -8]], '#8a6a44', 2); curve(g, -4, -9, 0, -12, 4, -8, m.base, 2); }
else if (def.tool.kind === 'axe') { stroke(g, [[0, 6], [0, -8]], '#8a6a44', 2); path(g, [[0, -10], [4, -9], [3.4, -4], [0, -6]], m.base, m.dark, 0.6); }
else if (def.tool.kind === 'hoe') { stroke(g, [[0, 6], [0, -8]], '#8a6a44', 2); rr(g, -1, -10, 5, 2, 0.5, m.base, m.dark, 0.5); }
else if (def.tool.kind === 'rod') { stroke(g, [[0, 6], [0, -12]], m.base, 1.4); }
else if (def.tool.kind === 'water') { rr(g, -2, -6, 6, 5, 1, '#7aa8c8', '#4a7898', 0.6); }
g.restore();
}
P.player = function (g, o) {
const eq = o.equip || {};
const fem = o.gender === 'f';
const skin = fem ? '#e8c8a8' : '#d8b088';
const hairC = fem ? '#8a4a2a' : '#4a3520';
const hm = eq.head ? matOf(eq.head.id) : null;
const cm = eq.chest ? matOf(eq.chest.id) : null;
const lm = eq.legs ? matOf(eq.legs.id) : null;
if (o.bust) {
const C = { skin: skin, hairCol: hairC, top: cm ? cm.base : '#b8a888', w: fem ? 5 : 6, hat: null };
g.save(); g.translate(0, 2); g.scale(1.35, 1.35); g.translate(0, 12);
path(g, [[-8, -15], [8, -15], [7, -8], [-7, -8]], C.top, shade(C.top, -0.35), 0.8);
playerHead(g, o, hm, fem, skin, hairC);
if (!o.free) collar(g, o);
g.restore(); return;
}
const bob = o.ride ? 0 : sin(o.ph) * 0.7;
g.save(); g.translate(0, bob);
drawBags(g, o, eq);
toolOnBack(g, o, eq);
playerLegs(g, o, lm, fem);
playerChest(g, o, cm, fem);
/* brazo trasero */
const sw = o.ride ? 0 : sin(o.ph) * 2.2;
const sleeve = cm ? cm.base : '#b8a888';
stroke(g, [[-5, -20], [-7 + sw * 0.4, -14], [-6.5 + sw * 0.6, -11]], shade(sleeve, -0.15), 2.6);
ell(g, -6.5 + sw * 0.6, -10.4, 1.5, 1.5, shade(skin, -0.1));
playerHead(g, o, hm, fem, skin, hairC);
if (!o.free) collar(g, o);
accessories(g, o, eq);
/* brazo delantero + arma/herramienta en mano */
const swing = o.atk >= 0 ? sin(o.atk * PI) : 0;
const hx = 7 + swing * 3, hy = -12 - swing * 6;
stroke(g, [[5, -20], [7, -16], [hx, hy]], sleeve, 2.6);
ell(g, hx, hy, 1.6, 1.6, skin);
const wp = eq.weapon, tl = eq.tool;
if (wp) {
const wd = D.ITEMS[wp.id];
if (wd && wd.weapon) {
if (wd.weapon.kind === 'spear') propSpear(g, o, hx, hy, swing, matOf(wp.id), wp.id === 'venom_spear');
else propSword(g, o, hx, hy, swing, matOf(wp.id), 14);
}
} else if (tl) {
const td = D.ITEMS[tl.id];
if (td && td.tool) {
const k = td.tool.kind, m = matOf(tl.id);
if (k === 'pick') propPick(g, o, hx, hy, swing, m);
else if (k === 'axe') propAxe(g, o, hx, hy, swing, m);
else if (k === 'hoe') propHoe(g, o, hx, hy, swing, m);
else if (k === 'rod') propRod(g, o, hx, hy, swing, m);
else if (k === 'water') propCan(g, o, hx, hy, swing);
}
}
if (o.ride) { stroke(g, [[hx, hy], [12, -14]], '#6a4a2a', 1); }
g.restore();
};

/* ---------------- NPCs únicos ---------------- */
function mk(id, C) { P[id] = function (g, o) { person(g, o, C); }; }

/* Bareth: mercader de esclavos · gordo, barba negra, robe burdeos, cadenas, libro */
mk('bareth', {
skin: '#c89868', hairCol: '#2a2018', beard: 'full', beardCol: '#2a2018', hair: 'short',
top: '#7a2a3a', trim: '#e8c040', outfit: 'robe', w: 8, bottom: '#5a2030', boots: '#3a2018',
beltCol: '#e8c040', buckle: '#f0d070', legW: 3.6,
hand: function (g, o, hx, hy) { propLedger(g, o, hx, hy); },
backHand: function (g, o, hx, hy) { propPurse(g, o, hx, hy); },
face: function (g, o, hy) {
stroke(g, [[-2, -20], [2, -17], [5, -19]], '#e8c040', 1);
ell(g, 2, -17.4, 1, 1, '#f0d070');
ell(g, 6.4, hy + 1.4, 0.7, 0.7, '#e8c040');
},
bustProp: function (g, o) { stroke(g, [[-4, -12], [0, -9], [4, -12]], '#e8c040', 1); }
});
/* Voss: intendente · delgado, canoso engominado, monóculo, pergamino, pluma */
mk('voss', {
skin: '#e0c0a0', hairCol: '#b8b0a0', hair: 'slick', beard: 'goatee', beardCol: '#b8b0a0',
top: '#6a6a3a', trim: '#d8d0b0', outfit: 'coat', shirt: '#e8e0cc', w: 5, bottom: '#4a4a2a', boots: '#2a2a1a',
hand: function (g, o, hx, hy) { propScroll(g, o, hx, hy); },
backHand: function (g, o, hx, hy) { propQuill(g, o, hx, hy); },
face: function (g, o, hy) {
ell(g, 4.2, hy - 0.4, 1.8, 1.8, 'rgba(200,220,240,0.35)', '#d9a441', 0.6);
stroke(g, [[5.6, hy + 0.6], [6.4, hy + 3]], '#d9a441', 0.5);
},
bustProp: function (g, o) { ell(g, 5.6, -16, 1.8, 1.8, 'rgba(200,220,240,0.35)', '#d9a441', 0.6); }
});
/* Dorn: herrero · musculoso, calvo, barba negra, delantal, martillo, tenazas */
mk('dorn', {
skin: '#c89060', hairCol: '#2a2018', beard: 'full', beardCol: '#2a2018', hair: null,
top: '#8a6a44', outfit: 'apron', w: 7, bottom: '#5a4a3a', boots: '#3a2a1a', sleeve: '#c89060',
hand: function (g, o, hx, hy, sw) { propHammer(g, o, hx, hy, sw); },
backHand: function (g, o, hx, hy) { propTongs(g, o, hx, hy); },
front: function (g, o) {
path(g, [[-5, -20], [5, -20], [4, -10], [-4, -10]], '#6a4a2a', '#4a3620', 0.7);
stroke(g, [[-3, -20], [-3, -22]], '#4a3620', 0.8); stroke(g, [[3, -20], [3, -22]], '#4a3620', 0.8);
spots(g, 0, -15, 4, 4, 5, 'rgba(40,30,20,0.4)', 7, 0.8);
},
face: function (g, o, hy) { spots(g, 1, hy + 1, 4, 3, 4, 'rgba(40,30,20,0.35)', 5, 0.7); }
});
/* Lía: mercadera · pelirroja, pañuelo teal, vestido coral, cesta, pecas */
mk('lia', {
skin: '#e0b890', hairCol: '#c05a2a', hair: 'long', hat: 'headscarf', hatCol: '#3a8a8a',
top: '#d06a4a', skirt: '#e8d0a8', trim: '#f0e0c0', outfit: 'dress', w: 5, bottom: '#d06a4a', boots: '#7a4a2a',
hand: function (g, o, hx, hy) { propBasket(g, o, hx, hy); },
backHand: function (g, o, hx, hy) { propPurse(g, o, hx, hy); },
face: function (g, o, hy) { spots(g, 2.4, hy + 1.4, 3, 1.6, 5, 'rgba(160,90,50,0.5)', 3, 0.4); }
});
/* Silas: banquero · pálido, gafas redondas, abrigo verde, bolsa de oro */
mk('silas', {
skin: '#e8d0b8', hairCol: '#2a2a30', hair: 'slick', beard: 'goatee', beardCol: '#2a2a30',
top: '#2e5a4a', trim: '#e8c040', outfit: 'coat', shirt: '#f0ead8', w: 5, bottom: '#1e3a30', boots: '#1a1a20',
hand: function (g, o, hx, hy) { propPurse(g, o, hx, hy); },
backHand: function (g, o, hx, hy) { propLedger(g, o, hx, hy); },
face: function (g, o, hy) {
ell(g, 2.2, hy - 0.6, 1.6, 1.6, 'rgba(200,220,240,0.3)', '#8a8a92', 0.5);
ell(g, 4.4, hy - 0.4, 1.6, 1.6, 'rgba(200,220,240,0.3)', '#8a8a92', 0.5);
stroke(g, [[3.4, hy - 0.5], [3.6, hy - 0.5]], '#8a8a92', 0.5);
},
bustProp: function (g, o) { ell(g, 0, -10, 1.4, 1.4, '#e8c040', '#a07820', 0.5); }
});
/* Maera: sacerdotisa · rubia trenzada, robe blanco/oro, halo, bastón solar */
mk('maera', {
skin: '#f0d8c0', hairCol: '#e8c878', hair: 'braid', hat: 'circlet', hatCol: '#e8c040', gem: '#ffd070',
top: '#f0ead8', trim: '#e8c040', outfit: 'robe', w: 5, bottom: '#e0d8c0', boots: '#c8b890',
hand: function (g, o, hx, hy) { propStaff(g, o, hx, hy); },
face: function (g, o, hy) { g.save(); g.globalAlpha = 0.3; glow(g, 0.6, hy - 6, 8, '#ffd070', 0.3); g.restore(); }
});
/* Roderic: capitán · cicatriz, armadura acero, capa roja, yelmo con penacho, espada */
mk('roderic', {
skin: '#d8b088', hairCol: '#4a3520', hair: 'short', beard: 'stubble', hat: 'plume', hatMat: MAT.steel, plume: '#c0392b',
top: '#7a828c', outfit: 'armor', w: 6, bottom: '#525a64', boots: '#3a3a42', sleeve: '#7a828c',
hand: function (g, o, hx, hy, sw) { propSword(g, o, hx, hy, sw, MAT.steel, 15); },
back: function (g, o) { path(g, [[-6, -21], [-9, -12], [-7, -8], [-4, -14]], '#a03028', '#701e18', 0.7); },
backHand: function (g, o, hx, hy) { propShield(g, o, hx, hy, MAT.steel); },
face: function (g, o, hy) { stroke(g, [[1.4, hy - 2.4], [3.4, hy + 0.6]], '#a06050', 0.7); },
front: function (g, o) { path(g, [[-5, -21], [5, -21], [4, -16], [-4, -16]], '#aab2bc', '#525a64', 0.6); }
});
/* Finn: pescadero · joven, pecas, pelo arena, chaleco azul, caña, cubo */
mk('finn', {
skin: '#e0b890', hairCol: '#c8a868', hair: 'messy', hat: 'cap', hatCol: '#3a6a8a',
top: '#3a6a8a', outfit: 'vest', w: 5, bottom: '#8a7a5a', boots: '#5a4a3a', sleeve: '#e8d8b8',
hand: function (g, o, hx, hy, sw) { propRod(g, o, hx, hy, sw, null); },
backHand: function (g, o, hx, hy) { propBucket(g, o, hx, hy); },
face: function (g, o, hy) { spots(g, 2.4, hy + 1.2, 3, 1.6, 6, 'rgba(160,90,50,0.5)', 8, 0.4); },
front: function (g, o) { path(g, [[-4, -21], [4, -21], [3, -13], [-3, -13]], '#2e5a7a', '#1e3a5a', 0.6); }
});
/* Marta: granjera · morena, moño bajo sombrero de paja, overol verde, azada */
mk('marta', {
skin: '#d8a878', hairCol: '#6a4a2a', hair: 'bun', hat: 'straw', hatCol: '#d8b860', hatBand: '#3a7a3a',
top: '#e8d8b8', outfit: 'overalls', w: 5, bottom: '#3a7a3a', boots: '#5a4a3a', sleeve: '#e8d8b8',
hand: function (g, o, hx, hy, sw) { propHoe(g, o, hx, hy, sw, MAT.iron); },
backHand: function (g, o, hx, hy) { propBasket(g, o, hx, hy); },
face: function (g, o, hy) { spots(g, 2.4, hy + 1.4, 3, 1.6, 5, 'rgba(150,80,40,0.5)', 4, 0.4); },
front: function (g, o) { path(g, [[-4, -19], [4, -19], [3, -11], [-3, -11]], '#3a7a3a', '#2a5a2a', 0.6); stroke(g, [[-2, -19], [-2, -21]], '#2a5a2a', 0.7); stroke(g, [[2, -19], [2, -21]], '#2a5a2a', 0.7); }
});
/* Odo: granjero viejo · encorvado, barba gris, sombrero paja, horca */
mk('odo', {
skin: '#d0a878', hairCol: '#c8c0b0', hair: 'gray', beard: 'gray', hat: 'straw', hatCol: '#c8a850', hatBand: '#6a4a2a',
top: '#8a6a4a', outfit: 'overalls', w: 5, bottom: '#6a5a3a', boots: '#4a3a2a', sleeve: '#8a6a4a',
hand: function (g, o, hx, hy, sw) { propPitchfork(g, o, hx, hy, sw); },
face: function (g, o, hy) { stroke(g, [[1.4, hy - 2.6], [4.4, hy - 2.2]], shade('#d0a878', -0.3), 0.6); },
front: function (g, o) { path(g, [[-4, -19], [4, -19], [3, -11], [-3, -11]], '#6a5a3a', '#4a3a2a', 0.6); }
});

/* ---------------- Guardia de Vhalor ---------------- */
P.guard = function (g, o) {
const C = {
skin: '#d8b088', hairCol: '#4a3520', hat: 'helm', hatMat: MAT.iron,
top: '#4a6a8a', outfit: 'tabard', w: 6, bottom: '#767e86', boots: '#3a3a42', sleeve: '#a8b0b8',
hand: function (g2, o2, hx, hy, sw) { propSpear(g2, o2, hx, hy, sw, MAT.iron, false); },
backHand: function (g2, o2, hx, hy) { propShield(g2, o2, hx, hy, null); },
front: function (g2, o2) {
path(g2, [[-4, -21], [4, -21], [3, -12], [-3, -12]], '#3a5a7a', '#2a4a6a', 0.6);
ell(g2, 0, -16, 1.8, 1.8, '#e8c040', '#a07820', 0.5);
},
bustProp: function (g2, o2) { ell(g2, 0, -10, 1.6, 1.6, '#e8c040', '#a07820', 0.5); }
};
if (o.angry) { C.plume = '#e04b3a'; C.hat = 'plume'; }
person(g, o, C);
};

/* ---------------- Trabajadores por rol / edad ---------------- */
P.worker = function (g, o) {
const fem = o.gender === 'f';
const skin = fem ? '#e0b890' : '#d8b088';
const hairC = fem ? '#6a4a2a' : '#4a3520';
if (o.stage === 'baby') {
g.save(); g.translate(0, -4); g.scale(0.8, 0.8);
blob(g, 0, -4, 5, 4, fem ? '#e0b8c8' : '#b8c8e0', shade(fem ? '#e0b8c8' : '#b8c8e0', 0.2));
blob(g, 4, -7, 3.4, 3.2, skin, shade(skin, 0.15));
eye(g, 5.4, -7.4, 0.7, '#2a1a10');
ell(g, -4, -1, 1.6, 1.2, skin); ell(g, 2, -1, 1.6, 1.2, skin);
g.restore(); return;
}
const role = o.role || 'idle';
const C = {
skin: skin, hairCol: hairC, hair: fem ? 'bun' : 'short',
top: fem ? '#c8a8b8' : '#a8b8c8', w: o.child ? 4 : 5, bottom: '#8a7a5a', boots: '#4a3a2a',
hand: null, backHand: null
};
if (role === 'farm') C.hand = function (g2, o2, hx, hy, sw) { propHoe(g2, o2, hx, hy, sw, MAT.iron); };
else if (role === 'tend') C.hand = function (g2, o2, hx, hy) { propBucket(g2, o2, hx, hy); };
else if (role === 'guard') { C.hand = function (g2, o2, hx, hy, sw) { propSpear(g2, o2, hx, hy, sw, MAT.iron, false); }; C.backHand = function (g2, o2, hx, hy) { propShield(g2, o2, hx, hy, null); }; }
else if (role === 'follow') C.hand = function (g2, o2, hx, hy, sw) { propSword(g2, o2, hx, hy, sw, MAT.iron, 12); };
if (o.child) { C.w = 4; C.hair = fem ? 'braid' : 'messy'; }
person(g, o, C);
};

/* ---------------- Bandido ---------------- */
P.bandit = function (g, o) {
person(g, o, {
skin: '#c8a070', hairCol: '#2a2018', hat: 'hood', hatCol: '#4a3a2a', top: '#5a4a3a',
outfit: 'vest', w: 5, bottom: '#3a2a1a', boots: '#2a1a10', sleeve: '#5a4a3a',
hand: function (g2, o2, hx, hy, sw) { propDagger(g2, o2, hx, hy, sw); },
face: function (g2, o2, hy) {
path(g2, [[-2, hy + 1], [5.4, hy + 1.4], [5, hy + 3.6], [-1.6, hy + 3.2]], '#3a2a1a', '#2a1a10', 0.5);
eye(g2, 2.2, hy - 0.6, 0.85, '#e0c040');
stroke(g2, [[1.2, hy - 2.4], [3.4, hy - 1.8]], '#2a1a10', 0.7);
},
front: function (g2, o2) { stroke(g2, [[-4, -19], [4, -14]], '#3a2a1a', 1); }
});
};

/* ---------------- Esqueleto ---------------- */
P.skeleton = function (g, o) {
if (o.bust) {
g.save(); g.translate(0, 2); g.scale(1.35, 1.35); g.translate(0, 12);
skull(g, o, -16); g.restore(); return;
}
const bob = sin(o.ph) * 0.7, sw = sin(o.ph) * 3.0;
g.save(); g.translate(0, bob);
const bone = '#e8e8dc', bd = '#b8b8a8';
leg(g, -2.4, -11, 11, 2.2, sw, bone, bd); leg(g, 2.4, -11, 11, 2.2, -sw, bone, bd);
stroke(g, [[0, -22], [0, -11]], bone, 2);
for (let i = 0; i < 4; i++) { const y = -20 + i * 2.6; curve(g, -4, y, 0, y + 1.4, 4, y, bone, 1.2); }
path(g, [[-4, -22], [4, -22], [3, -20], [-3, -20]], bone, bd, 0.6);
stroke(g, [[-4, -20], [-6 + sw * 0.4, -14], [-5.5 + sw * 0.6, -11]], bone, 1.8);
const swing = o.atk >= 0 ? sin(o.atk * PI) : 0;
const hx = 6 + swing * 3, hy = -12 - swing * 6;
stroke(g, [[4, -20], [6, -16], [hx, hy]], bone, 1.8);
g.save(); g.translate(hx, hy); g.rotate(-0.6 + swing * 1.8);
stroke(g, [[0, 1.6], [0, -1]], '#6a4a2a', 1.6);
path(g, [[-1, -1], [1, -1], [0.6, -10], [0, -12], [-0.6, -10]], '#9a9a8a', '#6a6a5a', 0.6);
g.restore();
skull(g, o, -26.5);
path(g, [[-3, -14], [3, -14], [2, -9], [-2, -9]], 'rgba(90,80,70,0.6)', '#4a3a2a', 0.5);
g.restore();
};
function skull(g, o, hy) {
blob(g, 0.6, hy, 5.0, 5.2, '#e8e8dc', '#f8f8f0');
path(g, [[1, hy + 3], [4.6, hy + 3.2], [4.2, hy + 5.4], [1.4, hy + 5.2]], '#d8d8c8', '#b8b8a8', 0.5);
for (let i = 0; i < 3; i++) stroke(g, [[1.8 + i * 1.1, hy + 3.2], [1.8 + i * 1.1, hy + 5.2]], '#b8b8a8', 0.4);
ell(g, 2.2, hy - 0.6, 1.5, 1.7, '#1a1a20'); ell(g, 4.4, hy - 0.4, 1.4, 1.6, '#1a1a20');
glow(g, 2.2, hy - 0.6, 3, '#8ae04a', 0.4); glow(g, 4.4, hy - 0.4, 3, '#8ae04a', 0.4);
ell(g, 2.2, hy - 0.6, 0.6, 0.7, '#8ae04a'); ell(g, 4.4, hy - 0.4, 0.5, 0.6, '#8ae04a');
path(g, [[3.4, hy + 1], [4, hy + 2], [3, hy + 2]], '#b8b8a8');
}

console.info('[CR] art-people.js listo · jugador con equipo + ' + Object.keys(P).length + ' personas únicas');
})();