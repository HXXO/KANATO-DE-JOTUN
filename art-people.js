/* ============================================================
KANATO DE JOTUN · art-people.js — Personas con identidad v5
ARCHIVO EN 2 PARTES CONCATENABLES: 10A · 10B
10A abre el IIFE; 10B lo cierra. No insertes nada entre ellas.

CAMBIOS v5:
· RETRATO FRONTAL: el busto de diálogo ya no se deforma. La cara
  se dibuja de frente, simétrica y proporcionada al marco del
  icono (cabeza centrada, hombros debajo, sin el doble transform
  que aplastaba la cabeza contra el borde).
· Ojos con esclerótica + iris + brillo, cejas, nariz y boca
  legibles incluso a 46 px.
· Pelo, barba y sombrero tienen versión de retrato encajada en la
  cabeza, además de la versión de cuerpo completo.
· Se registran TODOS los NPC (granjeros, cazadores, errantes,
  Gunda y el Supremo) para que nadie salga como un muñón genérico.
· Jugador con equipo visible, guardia, trabajador, bandido y
  esqueleto intactos.
Espacio local: origen en el suelo, +x hacia donde mira.
o = { t, ph, atk, face, sq, e, gender, free, equip, ride, bust,
stage, child, role, angry, front, back, tint }
============================================================ */
(function () {
'use strict';
const CR = window.CR;
if (!CR || !CR.Art) { console.error('[CR] art-people.js requiere art.js'); return; }
const A = CR.Art, H = A.util, D = CR.DATA, U = CR.util;
const ell = H.ell, path = H.path, blob = H.blob, leg = H.leg, stroke = H.stroke,
curve = H.curve, fur = H.fur, eye = H.eye, horn = H.horn, spots = H.spots,
rr = H.rr, lgrad = H.lgrad, glow = H.glow, shade = H.shade, rgba = H.rgba, mix = H.mix;
const sin = Math.sin, cos = Math.cos, PI = Math.PI, TAU = U.TAU;
const P = A.people;

/* ---------------- Paletas de material ---------------- */
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

/* ==========================================================
1 · RETRATO FRONTAL (busto de diálogo)
Coordenadas de icono: origen abajo-centro, marco de 30 unidades.
Cabeza centrada en (0,-16), hombros de -7 a 0. Nada se sale.
========================================================== */
function eyeFront(g, x, y, iris, look) {
  ell(g, x, y, 1.9, 1.5, '#f6f2ea');
  const lx = look ? look.x : 0, ly = look ? look.y : 0;
  ell(g, x + lx * 0.5, y + ly * 0.4, 1.15, 1.15, iris);
  ell(g, x + lx * 0.5, y + ly * 0.4, 0.5, 0.5, '#141410');
  ell(g, x + lx * 0.5 - 0.34, y + ly * 0.4 - 0.5, 0.3, 0.3, '#ffffff');
}
function browFront(g, x, y, col, angry) {
  g.save();
  if (angry) { g.translate(x, y); g.rotate(x < 0 ? 0.3 : -0.3); g.translate(-x, -y); }
  stroke(g, [[x - 1.9, y], [x + 1.9, y - 0.4]], col, 1.1);
  g.restore();
}
/* Pelo de retrato, encajado en la cabeza frontal */
function bustHair(g, style, col, R, hy) {
  const top = hy - R;
  if (style === 'bald') return;
  if (style === 'slick') {
    path(g, [[-R, hy - 1], [-R, top + 1.4], [0, top - 0.6], [R, top + 1.4], [R, hy - 1],
      [R * 0.5, hy - R * 0.55], [-R * 0.3, hy - R * 0.6]], col, shade(col, -0.3), 0.6);
    stroke(g, [[-R * 0.4, top + 1], [R * 0.2, top + 0.2]], shade(col, 0.3), 0.7);
    return;
  }
  if (style === 'bun') {
    ell(g, 0, top - 2.2, 2.8, 2.6, col, shade(col, -0.3), 0.6);
    ell(g, 0.6, top - 2.8, 1.2, 1.1, shade(col, 0.15));
  }
  if (style === 'braid') {
    for (let i = 0; i < 4; i++) ell(g, R * 0.9, hy + i * 2.8, 1.7 - i * 0.16, 1.5, i % 2 ? col : shade(col, 0.12), shade(col, -0.25), 0.4);
    ell(g, R * 0.9, hy + 11.4, 1.0, 1.4, '#d9a441');
  }
  /* casco base de pelo */
  path(g, [[-R, hy + 0.6], [-R * 1.05, top + 2], [0, top - 1.4], [R * 1.05, top + 2], [R, hy + 0.6],
    [R * 0.6, hy - R * 0.42], [0, hy - R * 0.55], [-R * 0.6, hy - R * 0.42]],
    col, shade(col, -0.3), 0.6);
  if (style === 'messy') {
    for (let i = -2; i <= 2; i++) path(g, [[i * 2.2 - 1, top + 1], [i * 2.2, top - 2.4], [i * 2.2 + 1, top + 1]], col);
  }
  if (style === 'long') {
    path(g, [[-R, hy], [-R - 2, hy + 7], [-R + 1, hy + 8], [-R + 1.6, hy + 1]], col, shade(col, -0.3), 0.5);
    path(g, [[R, hy], [R + 2, hy + 7], [R - 1, hy + 8], [R - 1.6, hy + 1]], shade(col, -0.08), shade(col, -0.3), 0.5);
  }
}
/* Barba de retrato */
function bustBeard(g, style, col, R, hy) {
  if (!style) return;
  if (style === 'stubble') {
    g.save(); g.globalAlpha = 0.4;
    spots(g, 0, hy + R * 0.55, R * 0.7, R * 0.42, 10, col, 3, 0.5);
    g.restore();
    return;
  }
  if (style === 'goatee') {
    path(g, [[-1.8, hy + R * 0.5], [1.8, hy + R * 0.5], [1.2, hy + R + 2.4], [-1.2, hy + R + 2.4]], col, shade(col, -0.3), 0.5);
    return;
  }
  /* full / gray */
  path(g, [[-R * 0.86, hy + R * 0.1], [-R * 0.7, hy + R + 2.2], [0, hy + R + 3.4],
    [R * 0.7, hy + R + 2.2], [R * 0.86, hy + R * 0.1],
    [R * 0.5, hy + R * 0.55], [0, hy + R * 0.7], [-R * 0.5, hy + R * 0.55]],
    col, shade(col, -0.3), 0.5);
  path(g, [[-2.2, hy + R * 0.28], [2.2, hy + R * 0.28], [1.6, hy + R * 0.55], [-1.6, hy + R * 0.55]], shade(col, -0.16));
}
/* Sombrero de retrato */
function bustHat(g, o, style, C, R, hy) {
  if (!style) return;
  const top = hy - R;
  const hc = C.hatCol || '#8a6a44';
  if (style === 'straw') {
    ell(g, 0, top + 2.4, R + 4.4, 2.4, hc, shade(hc, -0.35), 0.7);
    path(g, [[-R * 0.62, top + 2], [-R * 0.5, top - 2.4], [R * 0.5, top - 2.4], [R * 0.62, top + 2]], shade(hc, 0.1), shade(hc, -0.3), 0.6);
    stroke(g, [[-R * 0.6, top + 0.6], [R * 0.6, top + 0.6]], C.hatBand || '#8a5a3a', 1.1);
  } else if (style === 'cap') {
    path(g, [[-R, top + 2], [-R * 0.8, top - 2], [R * 0.8, top - 2], [R, top + 2]], hc, shade(hc, -0.3), 0.6);
    ell(g, R * 0.7, top + 1.6, 3, 1.1, shade(hc, -0.15));
  } else if (style === 'hood') {
    path(g, [[-R - 1.4, hy + 3], [-R - 1, top - 1], [0, top - 3], [R + 1, top - 1], [R + 1.4, hy + 3],
      [R * 0.7, hy + 1], [R * 0.6, top + 1], [0, top - 0.6], [-R * 0.6, top + 1], [-R * 0.7, hy + 1]],
      hc, shade(hc, -0.35), 0.7);
  } else if (style === 'headscarf') {
    path(g, [[-R, top + 2.4], [-R * 0.8, top - 1.6], [R * 0.8, top - 1.6], [R, top + 2.4]], hc, shade(hc, -0.3), 0.6);
    path(g, [[-R, top + 2.4], [-R - 2.4, hy + 3], [-R + 0.6, hy + 3.4]], shade(hc, -0.1), shade(hc, -0.3), 0.5);
    stroke(g, [[-R * 0.6, top], [R * 0.6, top - 0.6]], shade(hc, 0.25), 0.7);
  } else if (style === 'circlet') {
    stroke(g, [[-R * 0.9, hy - R * 0.5], [R * 0.9, hy - R * 0.5]], C.hatCol || '#e8c040', 1.4);
    gemBust(g, 0, hy - R * 0.55, 1.6, C.gem || '#e04b3a');
    glow(g, 0, hy - R * 0.55, 4, C.gem || '#e04b3a', 0.3);
  } else if (style === 'helm' || style === 'plume' || style === 'fullhelm') {
    const m = C.hatMat || MAT.iron;
    if (style === 'fullhelm') {
      path(g, [[-R, hy + 3], [-R, top - 1], [0, top - 3], [R, top - 1], [R, hy + 3],
        [R * 0.5, hy + 3.6], [-R * 0.5, hy + 3.6]], m.base, m.dark, 0.8);
      rr(g, -R * 0.55, hy - 2, R * 1.1, 2, 0.5, '#14141a');
      stroke(g, [[-R * 0.7, top + 1], [R * 0.7, top + 1.6]], m.lite, 0.8);
    } else {
      path(g, [[-R, top + 2], [-R * 0.8, top - 2], [R * 0.8, top - 2], [R, top + 2]], m.base, m.dark, 0.8);
      rr(g, R * 0.5, top - 1, 2, 5, 0.5, m.base, m.dark, 0.6);
      stroke(g, [[-R * 0.6, top - 0.6], [R * 0.6, top - 1.2]], m.lite, 0.8);
      if (m.glow) { g.save(); g.globalAlpha = 0.5; stroke(g, [[-R * 0.6, top + 1], [R * 0.6, top + 1]], m.glow, 0.9); g.restore(); }
    }
    if (style === 'plume') {
      const pc = C.plume || '#c0392b';
      for (let i = 0; i < 4; i++) ell(g, -1.4 - i * 1.5, top - 3 - i * 1.8, 1.6, 2.4, i % 2 ? pc : shade(pc, 0.15));
    }
  }
}
function gemBust(g, x, y, r, col) {
  path(g, [[x, y - r], [x + r * 0.72, y], [x, y + r], [x - r * 0.72, y]], col, shade(col, -0.4), 0.6);
  path(g, [[x, y - r], [x + r * 0.3, y - r * 0.2], [x, y + r * 0.3], [x - r * 0.3, y - r * 0.2]], shade(col, 0.35));
}
/* Collar de esclavo para el retrato del jugador */
function collarBust(g, hy, R) {
  stroke(g, [[-R * 0.6, hy + R + 3.4], [R * 0.6, hy + R + 3.8]], '#8a8a92', 2);
  ell(g, 0, hy + R + 3.8, 1.7, 1.7, '#6a6a72', '#4a4a52', 0.6);
  stroke(g, [[0, hy + R + 5.2], [-2, hy + R + 7.6]], '#8a8a92', 1.1);
}

/**
 * BUSTO v5: retrato limpio y proporcionado.
 * Se dibuja directamente en el espacio del icono (30 unidades),
 * sin el doble transform que deformaba la cabeza en v3.
 */
function bust(g, o, C) {
  const R = 6.6, hy = -16;
  const iris = C.eyeCol || '#5a3a20';
  const look = o.angry ? { x: 0.6, y: -0.3 } : null;
  /* Hombros / torso */
  const w = (C.w || 6) + 6;
  path(g, [[-w, 0], [-w + 1.4, -7.4], [w - 1.4, -7.4], [w, 0]], C.top, shade(C.top, -0.35), 0.8);
  if (C.outfit === 'robe' || C.outfit === 'dress') {
    path(g, [[-w + 2, -7.4], [0, -4.6], [w - 2, -7.4]], C.trim || shade(C.top, -0.2));
    stroke(g, [[0, -4.6], [0, 0]], C.trim || shade(C.top, -0.25), 1.1);
  } else if (C.outfit === 'coat' || C.outfit === 'vest' || C.outfit === 'apron' || C.outfit === 'overalls') {
    stroke(g, [[-3, -7], [-3, 0]], shade(C.top, -0.28), 1);
    stroke(g, [[3, -7], [3, 0]], shade(C.top, -0.28), 1);
    if (C.shirt) path(g, [[-3, -7], [3, -7], [2.2, -3], [-2.2, -3]], C.shirt);
  } else if (C.outfit === 'armor' || C.outfit === 'tabard') {
    path(g, [[-w + 2, -7], [w - 2, -7], [w - 3, -4], [-w + 3, -4]], shade(C.top, 0.14), shade(C.top, -0.3), 0.7);
  }
  if (C.trim && C.outfit !== 'robe' && C.outfit !== 'dress') stroke(g, [[-w + 2, -7.2], [w - 2, -7.2]], C.trim, 0.8);
  /* Cuello */
  rr(g, -2.4, hy + R - 1, 4.8, 5, 1.6, C.skin, shade(C.skin, -0.25), 0.5);
  /* Cabeza frontal */
  ell(g, -R, hy, 1.5, 2.1, shade(C.skin, -0.06));
  ell(g, R, hy, 1.5, 2.1, shade(C.skin, -0.06));
  ell(g, 0, hy, R * 0.92, R, C.skin, shade(C.skin, -0.25), 0.7);
  /* Sombreado suave de mejilla y frente */
  g.save(); g.globalAlpha = 0.16; ell(g, R * 0.34, hy + R * 0.3, R * 0.6, R * 0.5, shade(C.skin, -0.4)); g.restore();
  g.save(); g.globalAlpha = 0.2; ell(g, -R * 0.3, hy - R * 0.44, R * 0.5, R * 0.28, '#ffffff'); g.restore();
  /* Ojos simétricos */
  eyeFront(g, -2.6, hy - 1, iris, look);
  eyeFront(g, 2.6, hy - 1, iris, look);
  browFront(g, -2.6, hy - 3.4, shade(C.hairCol || '#4a3520', -0.2), o.angry);
  browFront(g, 2.6, hy - 3.4, shade(C.hairCol || '#4a3520', -0.2), o.angry);
  /* Nariz y boca */
  path(g, [[-0.5, hy - 0.6], [0.6, hy + 1.6], [-0.9, hy + 1.9]], shade(C.skin, -0.2));
  if (o.angry) curve(g, -2, hy + 4.2, 0, hy + 3.4, 2, hy + 4.2, shade(C.skin, -0.5), 0.9);
  else curve(g, -2.1, hy + 3.8, 0, hy + 4.8, 2.1, hy + 3.8, shade(C.skin, -0.5), 0.9);
  /* Pelo / barba / sombrero encajados */
  if (C.beard) bustBeard(g, C.beard, C.beardCol || C.hairCol || '#4a3520', R, hy);
  if (C.hair) bustHair(g, C.hair, C.hairCol || '#4a3520', R, hy);
  if (C.hat) bustHat(g, o, C.hat, C, R, hy);
  /* Detalle propio de cada NPC */
  if (C.face) C.face(g, o, hy, C);
  if (!o.free && o.isPlayer) collarBust(g, hy, R);
  if (C.bustProp) C.bustProp(g, o, C);
}

/* ==========================================================
2 · PIEZAS DE CUERPO COMPLETO (mundo)
========================================================== */
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
  } else if (C.outfit === 'vest' || C.outfit === 'apron') {
    path(g, [[-w, top + 2], [w, top + 2], [w - 0.5, hip], [-w + 0.5, hip]], shade(col, -0.1), shade(col, -0.35), 0.8);
    path(g, [[-w + 1.4, top + 2], [w - 1.4, top + 2], [w - 2, hip], [-w + 2, hip]], col, shade(col, -0.35), 0.6);
  } else if (C.outfit === 'overalls') {
    path(g, [[-w, top + 2], [w, top + 2], [w - 0.5, hip], [-w + 0.5, hip]], C.shirt || '#e8d8b8', shade(col, -0.35), 0.8);
    path(g, [[-w + 1.4, top + 4], [w - 1.4, top + 4], [w - 1.8, hip], [-w + 1.8, hip]], col, shade(col, -0.35), 0.7);
    stroke(g, [[-w + 2, top + 4], [-w + 3, top + 1]], shade(col, -0.2), 1.2);
    stroke(g, [[w - 2, top + 4], [w - 3, top + 1]], shade(col, -0.2), 1.2);
  } else if (C.outfit === 'tabard' || C.outfit === 'armor') {
    path(g, [[-w, top + 2], [w, top + 2], [w - 0.5, hip], [-w + 0.5, hip]], col, shade(col, -0.35), 0.8);
    path(g, [[-w + 1, top + 2], [w - 1, top + 2], [w - 2, top + 6], [-w + 2, top + 6]], shade(col, 0.16), shade(col, -0.3), 0.6);
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
/* Cabeza 3/4 para el cuerpo completo (mundo) */
function headBase(g, o, C) {
  const hy = -26.5, r = 5.2;
  rr(g, -1.6, -23.8, 3.2, 3.4, 1, C.skin, shade(C.skin, -0.25), 0.5);
  blob(g, 0.6, hy, r, r * 1.05, C.skin, shade(C.skin, 0.14));
  ell(g, -3.6, hy + 0.4, 1.2, 1.6, shade(C.skin, -0.06));
  eye(g, 2.2, hy - 0.6, 0.85, C.eyeCol || '#2a1a10');
  eye(g, 4.2, hy - 0.4, 0.75, C.eyeCol || '#2a1a10');
  ell(g, 5.2, hy + 0.8, 1.0, 0.8, shade(C.skin, -0.12));
  curve(g, 2.6, hy + 2.4, 3.6, hy + 2.9, 4.6, hy + 2.3, shade(C.skin, -0.4), 0.6);
  if (C.beard) BEARDS[C.beard] && BEARDS[C.beard](g, hy, C);
  if (C.hair && HAIRS[C.hair]) HAIRS[C.hair](g, o, hy, C);
  if (C.hat && HATS[C.hat]) HATS[C.hat](g, o, hy, C);
  if (C.face) C.face(g, o, hy, C);
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

/* ==========================================================
3 · PELOS / BARBAS / SOMBREROS (cuerpo completo)
========================================================== */
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
    gemBust(g, 1, hy - 3.4, 1.4, C.gem || '#e04b3a');
    glow(g, 1, hy - 3.4, 4, C.gem || '#e04b3a', 0.3);
  },
  headscarf: function (g, o, hy, C) {
    const c = C.hatCol || '#3a8a8a';
    path(g, [[-5, hy - 1], [-4.6, hy - 5.6], [0.4, hy - 6.8], [5, hy - 4.4], [5.4, hy - 1.2], [3, hy - 3], [-1.4, hy - 3.6], [-3.8, hy - 2]], c, shade(c, -0.3), 0.6);
    path(g, [[-4.8, hy - 1], [-6.4, hy + 3], [-5, hy + 5], [-3.8, hy + 1]], shade(c, -0.1), shade(c, -0.3), 0.5);
    stroke(g, [[-3, hy - 5], [3.4, hy - 4.2]], shade(c, 0.25), 0.7);
  }
};
/* ==========================================================
4 · PROPS DE MANO
========================================================== */
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
function propBow(g, o, hx, hy, sw) {
  g.save(); g.translate(hx, hy); g.rotate(-0.5 + sw * 1.2);
  curve(g, -1, -12, 7, 0, -1, 12, '#8a6a44', 2);
  stroke(g, [[-1, -12], [-1, 12]], '#e8dcb0', 0.8);
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
function propRod(g, o, hx, hy, sw) {
  g.save(); g.translate(hx, hy); g.rotate(-0.9 + sw * 0.8);
  stroke(g, [[0, 2], [0, -16]], '#a07840', 1.6);
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
function propMug(g, o, hx, hy) {
  g.save(); g.translate(hx, hy);
  rr(g, -2.6, -4, 5.2, 6, 1, '#a8855a', '#6a5438', 0.7);
  curve(g, 2.6, -3, 5, -1, 2.6, 1, '#8a6a44', 1.2);
  ell(g, 0, -4, 2.4, 1, '#f0e8d0', '#a8855a', 0.5);
  g.restore();
}
function propShieldHand(g, o, hx, hy, m) {
  g.save(); g.translate(hx, hy);
  path(g, [[-4, -6], [4, -6], [4, 2], [0, 6], [-4, 2]], m ? m.base : '#4a6a8a', m ? m.dark : '#2e4a6a', 0.8);
  ell(g, 0, -1, 2.2, 2.2, '#e8c040', '#a07820', 0.6);
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

/* ==========================================================
5 · JUGADOR · equipo visible (busto limpio + cuerpo completo)
========================================================== */
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
    if (m === MAT.adamantite) {
      path(g, [[-w, top + 2], [-w - 2, top - 1], [-w + 1, top + 3]], m.lite, m.dark, 0.5);
      path(g, [[w, top + 2], [w + 2, top - 1], [w - 1, top + 3]], m.lite, m.dark, 0.5);
    }
    if (m.glow) { g.save(); g.globalAlpha = 0.4; stroke(g, [[-w + 2, top + 6], [w - 2, top + 6]], m.glow, 1); g.restore(); }
  }
  rr(g, -w + 0.5, hip - 2.4, (w - 0.5) * 2, 2.4, 0.8, '#4a3620', shade('#4a3620', -0.3), 0.5);
  ell(g, 0, hip - 1.2, 1.1, 0.9, '#d9a441');
}
function playerHatFor(m) {
  if (!m) return { hat: null };
  if (m === MAT.cloth) return { hat: 'hood', hatCol: '#c8b898', top: '#c8b898' };
  if (m === MAT.leather) return { hat: 'cap', hatCol: '#8a6a44' };
  if (m === MAT.iron) return { hat: 'helm', hatMat: m };
  if (m === MAT.steel) return { hat: 'fullhelm', hatMat: m };
  if (m === MAT.mithril) return { hat: 'circlet', hatCol: m.lite, gem: m.glow };
  return { hat: 'fullhelm', hatMat: m };
}
function playerHeadFull(g, o, m, fem, skin, hairC) {
  const hy = -26.5;
  rr(g, -1.6, -23.8, 3.2, 3.4, 1, skin, shade(skin, -0.25), 0.5);
  blob(g, 0.6, hy, 5.2, 5.4, skin, shade(skin, 0.14));
  ell(g, -3.6, hy + 0.4, 1.2, 1.6, shade(skin, -0.06));
  eye(g, 2.2, hy - 0.6, 0.85, '#2a1a10'); eye(g, 4.2, hy - 0.4, 0.75, '#2a1a10');
  ell(g, 5.2, hy + 0.8, 1.0, 0.8, shade(skin, -0.12));
  curve(g, 2.6, hy + 2.4, 3.6, hy + 2.9, 4.6, hy + 2.3, shade(skin, -0.4), 0.6);
  const C = { skin: skin, hairCol: hairC };
  if (!m) { (fem ? HAIRS.braid : HAIRS.messy)(g, o, hy, C); return; }
  const hh = playerHatFor(m);
  if (m === MAT.cloth) { HATS.hood(g, o, hy, hh); (fem ? HAIRS.braid : HAIRS.short)(g, o, hy, C); }
  else if (m === MAT.leather) HATS.cap(g, o, hy, hh);
  else if (m === MAT.iron) HATS.helm(g, o, hy, hh);
  else if (m === MAT.steel) HATS.fullhelm(g, o, hy, hh);
  else if (m === MAT.mithril) { HATS.helm(g, o, hy, { hatMat: m }); HATS.circlet(g, o, hy, hh); }
  else { HATS.fullhelm(g, o, hy, hh); horn(g, -4, hy - 4, 5, -2.4, 1.4, m.lite, -1); horn(g, 4, hy - 4, 5, -0.7, 1.4, m.lite, 1); }
}
function collar(g) {
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
  /* --- BUSTO (retrato limpio v5) --- */
  if (o.bust) {
    const hh = cm ? playerHatFor(cm) : (hm ? playerHatFor(hm) : { hat: null });
    const C = {
      skin: skin, hairCol: hairC, beardCol: hairC,
      hair: hh.hat ? (hh.hat === 'circlet' ? (fem ? 'braid' : 'short') : null) : (fem ? 'braid' : 'messy'),
      hat: hh.hat || null, hatCol: hh.hatCol, hatMat: hh.hatMat, gem: hh.gem,
      top: cm ? cm.base : '#b8a888', outfit: cm && cm !== MAT.cloth && cm !== MAT.leather ? 'armor' : 'none',
      w: fem ? 5 : 6, eyeCol: '#2a1a10'
    };
    o.isPlayer = true;
    bust(g, o, C);
    return;
  }
  /* --- CUERPO COMPLETO --- */
  const bob = o.ride ? 0 : sin(o.ph) * 0.7;
  g.save(); g.translate(0, bob);
  drawBags(g, o, eq);
  toolOnBack(g, o, eq);
  playerLegs(g, o, lm, fem);
  playerChest(g, o, cm, fem);
  const sw = o.ride ? 0 : sin(o.ph) * 2.2;
  const sleeve = cm ? cm.base : '#b8a888';
  stroke(g, [[-5, -20], [-7 + sw * 0.4, -14], [-6.5 + sw * 0.6, -11]], shade(sleeve, -0.15), 2.6);
  ell(g, -6.5 + sw * 0.6, -10.4, 1.5, 1.5, shade(skin, -0.1));
  playerHeadFull(g, o, hm || cm, fem, skin, hairC);
  if (!o.free) collar(g);
  accessories(g, o, eq);
  const swing = o.atk >= 0 ? sin(o.atk * PI) : 0;
  const hx = 7 + swing * 3, hy = -12 - swing * 6;
  stroke(g, [[5, -20], [7, -16], [hx, hy]], sleeve, 2.6);
  ell(g, hx, hy, 1.6, 1.6, skin);
  const wp = eq.weapon, tl = eq.tool;
  if (wp) {
    const wd = D.ITEMS[wp.id];
    if (wd && wd.weapon) {
      if (wd.weapon.kind === 'spear') propSpear(g, o, hx, hy, swing, matOf(wp.id), wp.id === 'venom_spear');
      else if (wd.weapon.kind === 'bow' || wd.weapon.kind === 'crossbow') propBow(g, o, hx, hy, swing);
      else propSword(g, o, hx, hy, swing, matOf(wp.id), 14);
    }
  } else if (tl) {
    const td = D.ITEMS[tl.id];
    if (td && td.tool) {
      const k = td.tool.kind, m = matOf(tl.id);
      if (k === 'pick') propPick(g, o, hx, hy, swing, m);
      else if (k === 'axe') propAxe(g, o, hx, hy, swing, m);
      else if (k === 'hoe') propHoe(g, o, hx, hy, swing, m);
      else if (k === 'rod') propRod(g, o, hx, hy, swing);
      else if (k === 'water') propCan(g, o, hx, hy, swing);
    }
  }
  if (o.ride) stroke(g, [[hx, hy], [12, -14]], '#6a4a2a', 1);
  g.restore();
};

/* ==========================================================
6 · NPC ÚNICOS (retrato limpio + cuerpo con identidad)
========================================================== */
function mk(id, C) { P[id] = function (g, o) { person(g, o, C); }; }
mk('bareth', {
  skin: '#c89868', hairCol: '#2a2018', beard: 'full', beardCol: '#2a2018', hair: 'short',
  top: '#7a2a3a', trim: '#e8c040', outfit: 'robe', w: 8, bottom: '#5a2030', boots: '#3a2018', legW: 3.6,
  hand: propLedger, backHand: propPurse, eyeCol: '#3a2010',
  bustProp: function (g) { curve(g, -7, -5, 0, -2, 7, -5, '#e8c040', 1.4); ell(g, 0, -2.6, 1.4, 1.4, '#f0d070', '#a07820', 0.5); }
});
mk('voss', {
  skin: '#e0c0a0', hairCol: '#b8b0a0', hair: 'slick', beard: 'goatee', beardCol: '#b8b0a0',
  top: '#6a6a3a', trim: '#d8d0b0', outfit: 'coat', shirt: '#e8e0cc', w: 5, bottom: '#4a4a2a', boots: '#2a2a1a',
  hand: propScroll, backHand: propQuill, eyeCol: '#4a5a3a',
  face: function (g, o, hy) { ell(g, 4.2, hy - 0.4, 1.8, 1.8, 'rgba(200,220,240,0.35)', '#d9a441', 0.6); stroke(g, [[5.6, hy + 0.6], [6.4, hy + 3]], '#d9a441', 0.5); },
  bustProp: function (g) { ell(g, 2.6, -17, 2.2, 2.2, 'rgba(200,220,240,0.35)', '#d9a441', 0.7); stroke(g, [[4.4, -16], [5.4, -13]], '#d9a441', 0.6); }
});
mk('dorn', {
  skin: '#c89060', hairCol: '#2a2018', beard: 'full', beardCol: '#2a2018', hair: null,
  top: '#8a6a44', outfit: 'apron', w: 7, bottom: '#5a4a3a', boots: '#3a2a1a', sleeve: '#c89060',
  hand: propHammer, backHand: propTongs, eyeCol: '#2a1a10',
  face: function (g, o, hy) { spots(g, 1, hy + 1, 4, 3, 4, 'rgba(40,30,20,0.35)', 5, 0.7); },
  bustProp: function (g) { spots(g, 0, -14, 5, 4, 5, 'rgba(40,30,20,0.3)', 5, 0.8); }
});
mk('lia', {
  skin: '#e0b890', hairCol: '#c05a2a', hair: 'long', hat: 'headscarf', hatCol: '#3a8a8a',
  top: '#d06a4a', skirt: '#e8d0a8', trim: '#f0e0c0', outfit: 'dress', w: 5, bottom: '#d06a4a', boots: '#7a4a2a',
  hand: propBasket, backHand: propPurse, eyeCol: '#3a6a5a',
  face: function (g, o, hy) { spots(g, 2.4, hy + 1.4, 3, 1.6, 5, 'rgba(160,90,50,0.5)', 3, 0.4); },
  bustProp: function (g) { spots(g, -2, -13, 3, 1.6, 4, 'rgba(160,90,50,0.45)', 3, 0.5); spots(g, 3, -13, 3, 1.6, 4, 'rgba(160,90,50,0.45)', 7, 0.5); }
});
mk('silas', {
  skin: '#e8d0b8', hairCol: '#2a2a30', hair: 'slick', beard: 'goatee', beardCol: '#2a2a30',
  top: '#2e5a4a', trim: '#e8c040', outfit: 'coat', shirt: '#f0ead8', w: 5, bottom: '#1e3a30', boots: '#1a1a20',
  hand: propPurse, backHand: propLedger, eyeCol: '#2a3a4a',
  face: function (g, o, hy) { ell(g, 2.2, hy - 0.6, 1.6, 1.6, 'rgba(200,220,240,0.3)', '#8a8a92', 0.5); ell(g, 4.4, hy - 0.4, 1.6, 1.6, 'rgba(200,220,240,0.3)', '#8a8a92', 0.5); },
  bustProp: function (g) { ell(g, -2.6, -17, 2.2, 2.2, 'rgba(200,220,240,0.3)', '#8a8a92', 0.6); ell(g, 2.6, -17, 2.2, 2.2, 'rgba(200,220,240,0.3)', '#8a8a92', 0.6); stroke(g, [[-0.4, -17], [0.4, -17]], '#8a8a92', 0.6); }
});
mk('maera', {
  skin: '#f0d8c0', hairCol: '#e8c878', hair: 'braid', hat: 'circlet', hatCol: '#e8c040', gem: '#ffd070',
  top: '#f0ead8', trim: '#e8c040', outfit: 'robe', w: 5, bottom: '#e0d8c0', boots: '#c8b890',
  hand: propStaff, eyeCol: '#5a7a9a',
  bustProp: function (g) { g.save(); g.globalAlpha = 0.5; ell(g, 0, -26, 8, 2.4, null, '#ffd070', 1.6); glow(g, 0, -26, 9, '#ffd070', 0.35); g.restore(); }
});
mk('roderic', {
  skin: '#d8b088', hairCol: '#4a3520', hair: 'short', beard: 'stubble', hat: 'plume', hatMat: MAT.steel, plume: '#c0392b',
  top: '#7a828c', outfit: 'armor', w: 6, bottom: '#525a64', boots: '#3a3a42', sleeve: '#7a828c',
  hand: function (g, o, hx, hy, sw) { propSword(g, o, hx, hy, sw, MAT.steel, 15); },
  back: function (g) { path(g, [[-6, -21], [-9, -12], [-7, -8], [-4, -14]], '#a03028', '#701e18', 0.7); },
  backHand: function (g, o, hx, hy) { propShieldHand(g, o, hx, hy, MAT.steel); },
  eyeCol: '#3a4a5a',
  face: function (g, o, hy) { stroke(g, [[1.4, hy - 2.4], [3.4, hy + 0.6]], '#a06050', 0.7); },
  bustProp: function (g) { stroke(g, [[-3.4, -19], [-1.4, -14]], '#a06050', 0.8); }
});
mk('finn', {
  skin: '#e0b890', hairCol: '#c8a868', hair: 'messy', hat: 'cap', hatCol: '#3a6a8a',
  top: '#3a6a8a', outfit: 'vest', w: 5, bottom: '#8a7a5a', boots: '#5a4a3a', sleeve: '#e8d8b8',
  hand: propRod, backHand: propBucket, eyeCol: '#3a6a8a',
  face: function (g, o, hy) { spots(g, 2.4, hy + 1.2, 3, 1.6, 6, 'rgba(160,90,50,0.5)', 8, 0.4); },
  bustProp: function (g) { spots(g, 0, -13, 4, 1.6, 6, 'rgba(160,90,50,0.4)', 8, 0.5); }
});
mk('gunda', {
  skin: '#e0b890', hairCol: '#8a6a4a', hair: 'bun',
  top: '#a85a3a', skirt: '#c8a868', trim: '#e8d8b8', outfit: 'dress', w: 6, bottom: '#a85a3a', boots: '#5a3a20',
  hand: propMug, eyeCol: '#5a3a20',
  bustProp: function (g) { stroke(g, [[-5, -6], [5, -6]], '#e8d8b8', 1); }
});
mk('supremo', {
  skin: '#d8b088', hairCol: '#8a8a8a', hair: 'slick', beard: 'goatee', beardCol: '#9a9a9a',
  hat: 'circlet', hatCol: '#e8c040', gem: '#e04b3a',
  top: '#5a3a6a', trim: '#e8c040', outfit: 'coat', shirt: '#f0ead8', w: 6, bottom: '#3a2a4a', boots: '#2a1a3a',
  hand: propLedger, eyeCol: '#4a3a5a',
  bustProp: function (g) { curve(g, -7, -5, 0, -2, 7, -5, '#e8c040', 1.2); }
});
/* --- Granjeros (8) --- */
mk('marta', { skin: '#d8a878', hairCol: '#6a4a2a', hair: 'bun', hat: 'straw', hatCol: '#d8b860', hatBand: '#3a7a3a', top: '#e8d8b8', outfit: 'overalls', shirt: '#e8d8b8', w: 5, bottom: '#3a7a3a', boots: '#5a4a3a', hand: propHoe, backHand: propBasket, eyeCol: '#4a3a20', face: function (g, o, hy) { spots(g, 2.4, hy + 1.4, 3, 1.6, 5, 'rgba(150,80,40,0.5)', 4, 0.4); } });
mk('odo', { skin: '#d0a878', hairCol: '#c8c0b0', hair: 'gray', beard: 'gray', beardCol: '#c8c0b0', hat: 'straw', hatCol: '#c8a850', hatBand: '#6a4a2a', top: '#8a6a4a', outfit: 'overalls', shirt: '#8a6a4a', w: 5, bottom: '#6a5a3a', boots: '#4a3a2a', hand: propPitchfork, eyeCol: '#4a3a20' });
mk('helga', { skin: '#e0c0a0', hairCol: '#d8c090', hair: 'braid', top: '#7a9ab8', outfit: 'overalls', shirt: '#e8dcc0', w: 5, bottom: '#5a7a9a', boots: '#4a3a2a', hand: propBucket, eyeCol: '#4a6a8a' });
mk('tomas', { skin: '#d8b088', hairCol: '#7a5a3a', hair: 'short', beard: 'stubble', top: '#b8a888', outfit: 'coat', shirt: '#e8dcc0', w: 5, bottom: '#8a7a5a', boots: '#5a4a3a', hand: propBasket, eyeCol: '#4a3a20' });
mk('mira', { skin: '#e0b890', hairCol: '#3a2a1a', hair: 'long', hat: 'headscarf', hatCol: '#4a8a8a', top: '#6a9a8a', outfit: 'overalls', shirt: '#c8dcc8', w: 5, bottom: '#4a7a6a', boots: '#3a5a4a', hand: propCan, eyeCol: '#3a5a4a' });
mk('gunnar', { skin: '#d0a070', hairCol: '#8a6a4a', hair: 'short', beard: 'full', beardCol: '#8a6a4a', hat: 'cap', hatCol: '#6a5a4a', top: '#8a7a5a', outfit: 'overalls', shirt: '#a89878', w: 6, bottom: '#6a5a3a', boots: '#4a3a2a', hand: propPitchfork, eyeCol: '#3a4a5a' });
mk('yara', { skin: '#d8a878', hairCol: '#2a1a10', hair: 'braid', hat: 'straw', hatCol: '#e0c878', hatBand: '#c05a3a', top: '#d0885a', skirt: '#e8c898', outfit: 'dress', w: 5, bottom: '#d0885a', boots: '#8a5a3a', hand: propBasket, eyeCol: '#5a3a20' });
mk('bram', { skin: '#d8b088', hairCol: '#a8855a', hair: 'short', beard: 'goatee', beardCol: '#a8855a', top: '#9aa878', outfit: 'vest', shirt: '#e0d8b8', w: 5, bottom: '#7a8a5a', boots: '#5a4a3a', hand: propHoe, eyeCol: '#5a6a3a' });
/* --- Cazadores errantes --- */
mk('rurik', { skin: '#c8a070', hairCol: '#4a3520', hair: 'short', beard: 'stubble', hat: 'hood', hatCol: '#5a4a3a', top: '#6a5a44', outfit: 'vest', shirt: '#8a7a5a', w: 5, bottom: '#4a3a2a', boots: '#3a2a1a', hand: propBow, backHand: propDagger, eyeCol: '#4a3a20' });
mk('skadi', { skin: '#e0c8b0', hairCol: '#c8c8d0', hair: 'braid', hat: 'hood', hatCol: '#4a5a6a', top: '#5a6a7a', outfit: 'vest', shirt: '#a8b8c8', w: 5, bottom: '#4a5a6a', boots: '#3a4a5a', hand: propBow, eyeCol: '#5a7a9a' });
/* --- Mercaderes errantes --- */
mk('peddler', { skin: '#d8b088', hairCol: '#6a5a4a', hair: 'messy', hat: 'cap', hatCol: '#8a6a44', top: '#a8855a', outfit: 'coat', shirt: '#e0d0b0', w: 5, bottom: '#7a6a4a', boots: '#5a4a3a', hand: propBasket, eyeCol: '#4a3a20' });
mk('smuggler', { skin: '#c0a070', hairCol: '#2a2018', hat: 'hood', hatCol: '#2a2420', top: '#3a3430', outfit: 'vest', shirt: '#4a4440', w: 5, bottom: '#2a2420', boots: '#1a1410', hand: propDagger, eyeCol: '#c0a040' });
mk('herbalist', { skin: '#e0c0a0', hairCol: '#8a7a5a', hair: 'bun', hat: 'headscarf', hatCol: '#6a9a5a', top: '#7a9a6a', outfit: 'robe', w: 5, bottom: '#6a8a5a', boots: '#4a6a3a', hand: propBasket, eyeCol: '#4a6a3a' });

/* ==========================================================
7 · GENÉRICOS: guardia, trabajador, bandido, esqueleto
========================================================== */
P.guard = function (g, o) {
  const C = {
    skin: '#d8b088', hairCol: '#4a3520', hat: 'helm', hatMat: MAT.iron,
    top: '#4a6a8a', outfit: 'tabard', w: 6, bottom: '#767e86', boots: '#3a3a42', sleeve: '#a8b0b8',
    hand: function (g2, o2, hx, hy, sw) { propSpear(g2, o2, hx, hy, sw, MAT.iron, false); },
    backHand: function (g2, o2, hx, hy) { propShieldHand(g2, o2, hx, hy, null); },
    eyeCol: '#2a3a4a'
  };
  if (o.angry) { C.plume = '#e04b3a'; C.hat = 'plume'; }
  person(g, o, C);
};
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
  const C = { skin: skin, hairCol: hairC, hair: fem ? 'bun' : 'short', top: fem ? '#c8a8b8' : '#a8b8c8', w: o.child ? 4 : 5, bottom: '#8a7a5a', boots: '#4a3a2a', hand: null, backHand: null, eyeCol: '#3a2a1a' };
  if (role === 'farm') C.hand = function (g2, o2, hx, hy, sw) { propHoe(g2, o2, hx, hy, sw, MAT.iron); };
  else if (role === 'water') C.hand = function (g2, o2, hx, hy, sw) { propCan(g2, o2, hx, hy, sw); };
  else if (role === 'tend') C.hand = function (g2, o2, hx, hy) { propBucket(g2, o2, hx, hy); };
  else if (role === 'haul') C.hand = function (g2, o2, hx, hy) { propBasket(g2, o2, hx, hy); };
  else if (role === 'guard') { C.hand = function (g2, o2, hx, hy, sw) { propSpear(g2, o2, hx, hy, sw, MAT.iron, false); }; C.backHand = function (g2, o2, hx, hy) { propShieldHand(g2, o2, hx, hy, null); }; }
  else if (role === 'follow') C.hand = function (g2, o2, hx, hy, sw) { propSword(g2, o2, hx, hy, sw, MAT.iron, 12); };
  if (o.child) { C.w = 4; C.hair = fem ? 'braid' : 'messy'; }
  person(g, o, C);
};
P.bandit = function (g, o) {
  person(g, o, {
    skin: '#c8a070', hairCol: '#2a2018', hat: 'hood', hatCol: '#4a3a2a', top: '#5a4a3a',
    outfit: 'vest', w: 5, bottom: '#3a2a1a', boots: '#2a1a10', sleeve: '#5a4a3a',
    hand: propDagger, eyeCol: '#e0c040',
    face: function (g2, o2, hy) {
      path(g2, [[-2, hy + 1], [5.4, hy + 1.4], [5, hy + 3.6], [-1.6, hy + 3.2]], '#3a2a1a', '#2a1a10', 0.5);
      eye(g2, 2.2, hy - 0.6, 0.85, '#e0c040');
      stroke(g2, [[1.2, hy - 2.4], [3.4, hy - 1.8]], '#2a1a10', 0.7);
    }
  });
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
P.skeleton = function (g, o) {
  if (o.bust) {
    const C = { skin: '#e8e8dc', top: '#6a6a5a', w: 6, eyeCol: '#8ae04a',
      bustProp: function (g2) { g2.save(); g2.translate(0, 6); skull(g2, o, -22); g2.restore(); } };
    bust(g, o, C); return;
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

/* Respaldo: cualquier npc sin retrato propio usa un aldeano neutro. */
P._default = function (g, o) {
  person(g, o, {
    skin: o.gender === 'f' ? '#e0b890' : '#d8b088', hairCol: '#6a4a2a',
    hair: o.gender === 'f' ? 'bun' : 'short', top: '#a89878', outfit: 'vest',
    w: 5, bottom: '#7a6a5a', boots: '#4a3a2a', eyeCol: '#3a2a1a'
  });
};

console.info('[CR] art-people.js v5 listo · retrato frontal sin deformar · ' + Object.keys(P).length + ' personas únicas');
})();