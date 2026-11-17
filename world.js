/* ============================================================
KANATO DE JOTUN · world.js — Mundo v3 (512×512)
· Generación determinista en Worker (Blob, compatible file://)
  con fallback diferido y timeout.
· 12 biomas garantizados + 10 santuarios con territorio exclusivo.
· Vhalor: 2 puertas exactas, Lonja, posada, botica, albergue.
· 44 parcelas en 6 clases, con color de tierra natural.
· 8 granjas NPC, campamentos de bandidos, rutas de errantes.
· Hash espacial sin allocations, A* acotado, LOS por Bresenham.
· Serialización: semilla + solo diferencias.
============================================================ */
(function () {
'use strict';
const CR = window.CR;
if (!CR || !CR.DATA) { console.error('[CR] world.js requiere core.js y data.js'); return; }
const U = CR.util, C = CR.CONFIG, D = CR.DATA;

/* ---------- Bits de flags (Uint16) ---------- */
const F = {
  WATER: 1, SOLID: 2, WALL: 4, BUILDING: 8, NODE: 16, ROAD: 32,
  FLOOR: 64, TILLED: 128, FARM: 256, DOOR: 512, NOBUILD: 1024,
  PARCEL: 2048, ZONE: 4096, CAMP: 8192
};

/* ==========================================================
1 · LAYOUT — geometría verificada de Vhalor y su comarca
========================================================== */
function buildLayout() {
  const x0 = 228, y0 = 232, cw = 56, ch = 48;
  const city = { x: x0, y: y0, w: cw, h: ch };
  const S = [];
  function st(key, x, y, w, h, tag) { S.push({ key: key, x: x, y: y, w: w, h: h, tag: tag || null }); }

  /* Barrio norte */
  st('church',       x0 + 3,  y0 + 3,  9, 8, 'maera');
  st('house_small',  x0 + 16, y0 + 3,  5, 5);
  st('house_small',  x0 + 23, y0 + 3,  5, 5);
  st('barracks',     x0 + 31, y0 + 3, 11, 9, 'roderic');
  st('hunter_lodge', x0 + 44, y0 + 3,  9, 7);
  st('fountain',     x0 + 20, y0 + 10, 3, 3);
  /* Barrio oeste */
  st('smithy',       x0 + 3,  y0 + 15, 8, 8, 'dorn');
  st('alchemy_hut',  x0 + 3,  y0 + 26, 7, 6);
  st('owner_house',  x0 + 3,  y0 + 36, 10, 8, 'bareth');
  /* Barrio este */
  st('steward',      x0 + 44, y0 + 14, 9, 7, 'voss');
  st('land_office',  x0 + 44, y0 + 24, 9, 8, 'supremo');
  st('bank',         x0 + 31, y0 + 34, 9, 8, 'silas');
  /* Mercado central */
  st('stall',        x0 + 16, y0 + 17, 3, 2, 'lia');
  st('stall',        x0 + 28, y0 + 17, 3, 2, 'finn');
  st('stall',        x0 + 16, y0 + 21, 3, 2);
  st('stall',        x0 + 28, y0 + 21, 3, 2);
  st('stall',        x0 + 16, y0 + 25, 3, 2);
  st('stall',        x0 + 28, y0 + 25, 3, 2);
  st('pen',          x0 + 20, y0 + 20, 4, 3);
  st('caravan_post', x0 + 28, y0 + 29, 4, 3);
  st('inn',          x0 + 15, y0 + 34, 9, 7, 'gunda');
  st('gargoyle_perch_city', x0 + 13, y0 + 16, 1, 2);
  st('gargoyle_perch_city', x0 + 41, y0 + 16, 1, 2);

  /* Exactamente 2 puertas: SUR (2 de ancho) y ESTE (2 de alto) */
  const gates = [
    { x: x0 + 24, y: y0 + ch - 1, w: 2, h: 1, dir: 's', name: 'Puerta Sur' },
    { x: x0 + cw - 1, y: y0 + 13, w: 1, h: 2, dir: 'e', name: 'Puerta Este' }
  ];

  const roads = [];
  function rd(x, y, w, h) { roads.push([x, y, w, h]); }
  /* Avenidas interiores */
  rd(x0 + 24, y0 + 10, 2, ch - 10);
  rd(x0 + 11, y0 + 13, cw - 11, 2);
  /* Troncales exteriores */
  rd(x0 + 24, y0 + ch, 2, 120);            /* sur */
  rd(x0 + cw, y0 + 13, 120, 2);            /* este */
  rd(190, 216, 128, 2);                    /* norte exterior */
  rd(192, 216, 2, 100);                    /* oeste exterior */
  rd(316, 216, 2, 32);                     /* enlace norte→este */

  /* --- 44 parcelas en 10 filas con camino de acceso propio --- */
  const PC = {};
  D.PARCEL_CLASSES.forEach(function (c) { PC[c.cls] = c; });
  const parcels = [];
  function row(startX, y, classes, roadX, roadEnd) {
    let x = startX;
    for (let i = 0; i < classes.length; i++) {
      const c = PC[classes[i]];
      parcels.push({ id: parcels.length, x: x, y: y, w: c.w, h: c.h, cls: c.cls, owner: null });
      x += c.w + 3;
    }
    rd(roadX, y - 3, Math.max(x, roadEnd) - roadX, 2);
    return x;
  }
  /* Distrito suroeste */
  row(160, 292, ['XS', 'XS', 'S', 'S', 'M', 'M'], 158, 254);
  row(160, 308, ['S', 'S', 'M', 'M', 'L'], 158, 254);
  row(150, 326, ['M', 'M', 'L', 'L', 'XL'], 148, 254);
  row(148, 346, ['L', 'XL', 'XL', 'XXL'], 146, 254);
  /* Distrito sureste */
  row(262, 292, ['XS', 'XS', 'XS', 'S', 'S', 'M'], 250, 330);
  row(262, 308, ['XS', 'S', 'S', 'M', 'M'], 250, 326);
  row(262, 326, ['M', 'L', 'L', 'XL'], 250, 340);
  row(262, 346, ['L', 'XL', 'XXL'], 250, 334);
  /* Distrito este */
  rd(298, 167, 2, 80);
  row(300, 170, ['XS', 'XS', 'S', 'S'], 296, 344);
  row(300, 186, ['M', 'M'], 296, 332);

  /* --- 8 granjas NPC con espuela de camino --- */
  const farms = [
    { owner: 'marta',  x: 240, y: 196, w: 12, h: 12 },
    { owner: 'odo',    x: 262, y: 196, w: 12, h: 12 },
    { owner: 'helga',  x: 198, y: 192, w: 12, h: 12 },
    { owner: 'tomas',  x: 178, y: 232, w: 12, h: 12 },
    { owner: 'mira',   x: 300, y: 200, w: 12, h: 12 },
    { owner: 'gunnar', x: 218, y: 172, w: 12, h: 12 },
    { owner: 'yara',   x: 352, y: 250, w: 12, h: 12 },
    { owner: 'bram',   x: 178, y: 258, w: 12, h: 12 }
  ];
  rd(246, 208, 2, 8);   /* marta */
  rd(268, 208, 2, 8);   /* odo */
  rd(204, 204, 2, 12);  /* helga */
  rd(190, 238, 4, 2);   /* tomas */
  rd(306, 212, 2, 4);   /* mira */
  rd(224, 184, 2, 32);  /* gunnar */
  rd(358, 247, 2, 3);   /* yara */
  rd(190, 264, 4, 2);   /* bram */
  for (let i = 0; i < farms.length; i++) {
    const f = farms[i];
    f.house = { x: f.x + 1, y: f.y + 1 };
    f.npc = { x: f.x + 6, y: f.y + 6 };
  }

  /* --- Puestos de NPC --- */
  const npcSpawns = {
    maera:   { x: x0 + 7,  y: y0 + 11 },
    roderic: { x: x0 + 36, y: y0 + 12 },
    dorn:    { x: x0 + 7,  y: y0 + 23 },
    voss:    { x: x0 + 48, y: y0 + 21 },
    supremo: { x: x0 + 48, y: y0 + 32 },
    silas:   { x: x0 + 35, y: y0 + 42 },
    bareth:  { x: x0 + 8,  y: y0 + 44 },
    gunda:   { x: x0 + 19, y: y0 + 41 },
    lia:     { x: x0 + 17, y: y0 + 19 },
    finn:    { x: x0 + 29, y: y0 + 19 }
  };
  for (let i = 0; i < farms.length; i++) npcSpawns[farms[i].owner] = { x: farms[i].npc.x, y: farms[i].npc.y };

  const guardSpawns = [
    { x: x0 + 23, y: y0 + ch - 2 }, { x: x0 + 26, y: y0 + ch - 2 },
    { x: x0 + cw - 2, y: y0 + 12 }, { x: x0 + cw - 2, y: y0 + 15 },
    { x: x0 + 22, y: y0 + 13 }, { x: x0 + 30, y: y0 + 14 },
    { x: x0 + 14, y: y0 + 30 }, { x: x0 + 40, y: y0 + 30 }
  ];

  /* --- Rutas de mercaderes errantes (waypoints sobre caminos) --- */
  const routes = [
    [{ x: 253, y: 282 }, { x: 253, y: 290 }, { x: 200, y: 290 }, { x: 160, y: 290 },
     { x: 160, y: 306 }, { x: 220, y: 306 }, { x: 253, y: 306 }, { x: 253, y: 324 },
     { x: 180, y: 324 }, { x: 253, y: 324 }, { x: 253, y: 290 }],
    [{ x: 286, y: 246 }, { x: 330, y: 246 }, { x: 380, y: 246 }, { x: 358, y: 250 },
     { x: 330, y: 246 }, { x: 299, y: 246 }, { x: 299, y: 184 }, { x: 320, y: 184 },
     { x: 299, y: 168 }, { x: 299, y: 246 }],
    [{ x: 250, y: 217 }, { x: 300, y: 217 }, { x: 306, y: 214 }, { x: 316, y: 217 },
     { x: 250, y: 217 }, { x: 224, y: 217 }, { x: 224, y: 186 }, { x: 204, y: 217 },
     { x: 193, y: 217 }, { x: 193, y: 264 }, { x: 182, y: 264 }, { x: 193, y: 240 },
     { x: 193, y: 217 }]
  ];

  /* --- Puestos de cazador errante --- */
  const hunterPosts = [
    { x: 196, y: 250, r: 22 }, { x: 320, y: 200, r: 22 },
    { x: 240, y: 180, r: 20 }, { x: 360, y: 280, r: 24 }
  ];

  return {
    city: city, structs: S, gates: gates, roads: roads, parcels: parcels, farms: farms,
    npcSpawns: npcSpawns, guardSpawns: guardSpawns, routes: routes, hunterPosts: hunterPosts,
    playerStart: { x: x0 + 21, y: y0 + 24 }
  };
}

/* ==========================================================
2 · WORLD_GEN — autocontenida (se serializa al Worker)
========================================================== */
function WORLD_GEN(seed, CFG, BIOMES, NODE_KEYS, NODE_SOLID, DENSITY, LAYOUT, ZONES) {
  var S = CFG.S, N = S * S, F = CFG.F;
  var biome = new Uint8Array(N), elev = new Uint8Array(N);
  var flags = new Uint16Array(N), region = new Uint8Array(N);
  var flat = new Uint8Array(N);

  function mkNoise(sd) {
    var perm = new Array(256), i, j, t;
    for (i = 0; i < 256; i++) perm[i] = i;
    var s = sd >>> 0;
    function rnd() { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; }
    for (i = 255; i > 0; i--) { j = Math.floor(rnd() * (i + 1)); t = perm[i]; perm[i] = perm[j]; perm[j] = t; }
    var p = new Uint8Array(512);
    for (i = 0; i < 512; i++) p[i] = perm[i & 255];
    function fade(v) { return v * v * v * (v * (v * 6 - 15) + 10); }
    function lerp(a, b, v) { return a + (b - a) * v; }
    function grad(h, x, y) {
      switch (h & 7) {
        case 0: return x + y; case 1: return -x + y; case 2: return x - y; case 3: return -x - y;
        case 4: return x; case 5: return -x; case 6: return y; default: return -y;
      }
    }
    return function (x, y) {
      var fx = Math.floor(x), fy = Math.floor(y);
      var X = fx & 255, Y = fy & 255, xf = x - fx, yf = y - fy;
      var u = fade(xf), v = fade(yf);
      var aa = p[p[X] + Y], ab = p[p[X] + Y + 1], ba = p[p[X + 1] + Y], bb = p[p[X + 1] + Y + 1];
      var x1 = lerp(grad(aa, xf, yf), grad(ba, xf - 1, yf), u);
      var x2 = lerp(grad(ab, xf, yf - 1), grad(bb, xf - 1, yf - 1), u);
      return lerp(x1, x2, v);
    };
  }
  function fbm(n, x, y, oct, freq) {
    var amp = 1, sum = 0, norm = 0, f = freq;
    for (var o = 0; o < oct; o++) { sum += n(x * f, y * f) * amp; norm += amp; amp *= 0.5; f *= 2; }
    return (sum / norm) * 0.5 + 0.5;
  }
  var nE = mkNoise(seed), nM = mkNoise((seed ^ 0x9e3779b9) >>> 0);
  var nT = mkNoise((seed ^ 0x85ebca6b) >>> 0), nV = mkNoise((seed ^ 0xc2b2ae35) >>> 0);
  var rs = seed >>> 0;
  function rnd() { rs = (Math.imul(rs, 1664525) + 1013904223) >>> 0; return rs / 4294967296; }

  var cx = LAYOUT.city.x + (LAYOUT.city.w >> 1), cy = LAYOUT.city.y + (LAYOUT.city.h >> 1);

  /* Mancha corrupta lejana, garantizada */
  var ang = rnd() * Math.PI * 2;
  var ccx = Math.round(cx + Math.cos(ang) * 178), ccy = Math.round(cy + Math.sin(ang) * 178);
  ccx = Math.max(60, Math.min(S - 61, ccx)); ccy = Math.max(60, Math.min(S - 61, ccy));

  /* --- Terreno base --- */
  var x, y, i;
  for (y = 0; y < S; y++) {
    for (x = 0; x < S; x++) {
      i = y * S + x;
      var e = fbm(nE, x, y, 4, 0.010);
      var m = fbm(nM, x, y, 3, 0.014);
      var t = fbm(nT, x, y, 3, 0.008) * 0.70 + (1 - y / S) * 0.30;
      var v = fbm(nV, x, y, 2, 0.012);
      var edge = Math.min(x, y, S - 1 - x, S - 1 - y);
      if (edge < 6) e = Math.min(e, 0.20);
      else if (edge < 12) e = Math.min(e, 0.32);
      elev[i] = Math.max(0, Math.min(255, Math.round(e * 255)));

      var b;
      if (e < CFG.WATER_E) b = -1;
      else if (e < CFG.BEACH_E || edge < 12) b = 6;
      else if (v > CFG.VOLC_V && e > 0.50) b = 8;
      else if (e > CFG.MOUNT_E) b = (t < 0.42 ? 4 : 5);
      else if (e > CFG.HIGH_E) b = 10;
      else if (t < 0.30) b = 4;
      else if (t > 0.70 && m < 0.40) b = 3;
      else if (t > 0.64 && m > 0.60) b = 9;
      else if (m > 0.70 && e < 0.56) b = 11;
      else if (m > 0.66 && e < 0.46) b = 2;
      else if (m > 0.50) b = 1;
      else b = 0;

      var dx = x - ccx, dy = y - ccy;
      var rr = 40 + fbm(nM, x + 700, y + 700, 2, 0.03) * 16;
      if (b >= 0 && dx * dx + dy * dy < rr * rr) b = 7;

      if (b < 0) { biome[i] = 6; flags[i] = F.WATER | F.SOLID | F.NOBUILD; }
      else { biome[i] = b; flags[i] = 0; }
    }
  }

  /* --- Garantía de los 12 biomas --- */
  var counts = [];
  for (i = 0; i < BIOMES.length; i++) counts.push(0);
  for (i = 0; i < N; i++) if (!(flags[i] & F.WATER)) counts[biome[i]]++;
  for (var b2 = 0; b2 < BIOMES.length; b2++) {
    if (counts[b2] > 700 || b2 === 6) continue;
    for (var attempt = 0; attempt < 300; attempt++) {
      var px = 30 + Math.floor(rnd() * (S - 60)), py = 30 + Math.floor(rnd() * (S - 60));
      var ddx = px - cx, ddy = py - cy;
      if (ddx * ddx + ddy * ddy < 6400) continue;
      var ok = true;
      for (var oy = -16; oy <= 16 && ok; oy += 4) for (var ox = -16; ox <= 16; ox += 4) {
        if (ox * ox + oy * oy > 256) continue;
        var ii = (py + oy) * S + (px + ox);
        if (ii < 0 || ii >= N || (flags[ii] & F.WATER)) { ok = false; break; }
      }
      if (!ok) continue;
      for (var oy2 = -16; oy2 <= 16; oy2++) for (var ox2 = -16; ox2 <= 16; ox2++) {
        if (ox2 * ox2 + oy2 * oy2 > 256) continue;
        var xx = px + ox2, yy = py + oy2;
        if (xx < 1 || yy < 1 || xx >= S - 1 || yy >= S - 1) continue;
        var k2 = yy * S + xx;
        biome[k2] = b2; elev[k2] = (b2 === 5 || b2 === 10) ? 205 : (b2 === 8 ? 165 : 120);
        flags[k2] = 0;
      }
      break;
    }
  }

  /* --- Máscara de zonas planas (ciudad, parcelas, granjas, caminos) --- */
  function markRect(rx, ry, rw, rh, pad) {
    for (var yy = ry - pad; yy < ry + rh + pad; yy++) {
      if (yy < 0 || yy >= S) continue;
      for (var xx = rx - pad; xx < rx + rw + pad; xx++) {
        if (xx < 0 || xx >= S) continue;
        flat[yy * S + xx] = 1;
      }
    }
  }
  var ci = LAYOUT.city;
  markRect(ci.x, ci.y, ci.w, ci.h, 4);
  for (i = 0; i < LAYOUT.parcels.length; i++) { var P = LAYOUT.parcels[i]; markRect(P.x, P.y, P.w, P.h, 1); }
  for (i = 0; i < LAYOUT.farms.length; i++) { var Fa = LAYOUT.farms[i]; markRect(Fa.x, Fa.y, Fa.w, Fa.h, 1); }
  for (i = 0; i < LAYOUT.roads.length; i++) { var R = LAYOUT.roads[i]; markRect(R[0], R[1], R[2], R[3], 1); }
  for (i = 0; i < N; i++) {
    if (!flat[i]) continue;
    flags[i] = 0; biome[i] = 0;
    if (elev[i] < 96) elev[i] = 112;
  }

  /* --- Caminos --- */
  for (i = 0; i < LAYOUT.roads.length; i++) {
    var rd = LAYOUT.roads[i];
    for (var ry2 = rd[1]; ry2 < rd[1] + rd[3]; ry2++) {
      if (ry2 < 0 || ry2 >= S) continue;
      for (var rx2 = rd[0]; rx2 < rd[0] + rd[2]; rx2++) {
        if (rx2 < 0 || rx2 >= S) continue;
        flags[ry2 * S + rx2] = F.ROAD | F.NOBUILD;
      }
    }
  }

  /* --- Parcelas: tierra de color natural, sin teñir --- */
  for (i = 0; i < LAYOUT.parcels.length; i++) {
    var pp = LAYOUT.parcels[i];
    for (var py2 = pp.y; py2 < pp.y + pp.h; py2++) for (var px2 = pp.x; px2 < pp.x + pp.w; px2++) {
      var pi = py2 * S + px2;
      if (flags[pi] & F.ROAD) continue;
      flags[pi] = F.PARCEL;
    }
  }
  /* --- Granjas NPC: sí son tierra de labor --- */
  for (i = 0; i < LAYOUT.farms.length; i++) {
    var ff = LAYOUT.farms[i];
    for (var fy2 = ff.y; fy2 < ff.y + ff.h; fy2++) for (var fx2 = ff.x; fx2 < ff.x + ff.w; fx2++) {
      var fi = fy2 * S + fx2;
      if (flags[fi] & F.ROAD) continue;
      flags[fi] = F.FARM | F.NOBUILD;
    }
  }

  /* --- Muralla y puertas --- */
  for (var wx = ci.x; wx < ci.x + ci.w; wx++) {
    flags[ci.y * S + wx] = F.WALL | F.SOLID | F.NOBUILD;
    flags[(ci.y + ci.h - 1) * S + wx] = F.WALL | F.SOLID | F.NOBUILD;
  }
  for (var wy = ci.y; wy < ci.y + ci.h; wy++) {
    flags[wy * S + ci.x] = F.WALL | F.SOLID | F.NOBUILD;
    flags[wy * S + ci.x + ci.w - 1] = F.WALL | F.SOLID | F.NOBUILD;
  }
  for (var iy = ci.y + 1; iy < ci.y + ci.h - 1; iy++) for (var ix = ci.x + 1; ix < ci.x + ci.w - 1; ix++) {
    var idx2 = iy * S + ix;
    if (!(flags[idx2] & F.ROAD)) flags[idx2] = F.FLOOR | F.NOBUILD;
  }
  for (i = 0; i < LAYOUT.gates.length; i++) {
    var G = LAYOUT.gates[i];
    for (var gy = G.y; gy < G.y + G.h; gy++) for (var gx = G.x; gx < G.x + G.w; gx++) {
      flags[gy * S + gx] = F.ROAD | F.DOOR;
    }
  }

  /* --- Estampado de estructuras --- */
  function stamp(sx, sy, sw, sh, solid) {
    for (var yy = sy; yy < sy + sh; yy++) {
      if (yy < 0 || yy >= S) continue;
      for (var xx = sx; xx < sx + sw; xx++) {
        if (xx < 0 || xx >= S) continue;
        var k = yy * S + xx;
        flags[k] = F.BUILDING | F.NOBUILD | (solid ? F.SOLID : F.FLOOR);
      }
    }
  }
  for (i = 0; i < LAYOUT.structs.length; i++) {
    var s2 = LAYOUT.structs[i];
    stamp(s2.x, s2.y, s2.w, s2.h, true);
  }
  for (i = 0; i < LAYOUT.farms.length; i++) {
    var fh = LAYOUT.farms[i].house;
    stamp(fh.x, fh.y, 3, 3, true);
  }

  /* --- Santuarios: territorio exclusivo por bioma --- */
  function findBiomeSpot(bid, minCity, minSep, placed, tries) {
    var best = null;
    for (var a = 0; a < tries; a++) {
      var sx = 24 + Math.floor(rnd() * (S - 48)), sy = 24 + Math.floor(rnd() * (S - 48));
      var si = sy * S + sx;
      if (flat[si] || (flags[si] & (F.WATER | F.SOLID))) continue;
      if (biome[si] !== bid) continue;
      var ddx3 = sx - cx, ddy3 = sy - cy;
      if (ddx3 * ddx3 + ddy3 * ddy3 < minCity * minCity) continue;
      var sepOk = true;
      for (var q = 0; q < placed.length; q++) {
        var pdx = sx - placed[q].x, pdy = sy - placed[q].y;
        var need = minSep + placed[q].r;
        if (pdx * pdx + pdy * pdy < need * need) { sepOk = false; break; }
      }
      if (!sepOk) continue;
      best = { x: sx, y: sy }; break;
    }
    if (best) return best;
    /* Segundo intento: cualquier tile del bioma pedido */
    for (var k3 = 0; k3 < N; k3 += 7) {
      if (biome[k3] !== bid || flat[k3] || (flags[k3] & F.WATER)) continue;
      var bx = k3 % S, by = (k3 / S) | 0;
      var bdx = bx - cx, bdy = by - cy;
      if (bdx * bdx + bdy * bdy < 4900) continue;
      return { x: bx, y: by };
    }
    return { x: 40, y: 40 };
  }
  var zones = [];
  for (i = 0; i < ZONES.length; i++) {
    var Z = ZONES[i];
    var pos = findBiomeSpot(Z.biome, 96, 44, zones, 1400);
    var zr = Z.r;
    /* El santuario impone su bioma en todo su radio */
    for (var zy = pos.y - zr; zy <= pos.y + zr; zy++) {
      if (zy < 2 || zy >= S - 2) continue;
      for (var zx = pos.x - zr; zx <= pos.x + zr; zx++) {
        if (zx < 2 || zx >= S - 2) continue;
        var zdx = zx - pos.x, zdy = zy - pos.y;
        if (zdx * zdx + zdy * zdy > zr * zr) continue;
        var zi = zy * S + zx;
        if (flat[zi]) continue;
        biome[zi] = Z.biome;
        region[zi] = i + 1;
        flags[zi] = (flags[zi] & ~(F.WATER)) | F.ZONE;
        if (Z.biome === 5 || Z.biome === 10) elev[zi] = 200;
        else if (Z.biome === 8) elev[zi] = 160;
        else elev[zi] = 124;
      }
    }
    zones.push({ id: Z.id, x: pos.x, y: pos.y, r: zr, biome: Z.biome, boss: Z.boss || null, leash: Z.leash });
  }

  /* --- Campamentos de bandidos --- */
  var camps = [];
  for (i = 0; i < 7; i++) {
    var cp = null;
    for (var ca = 0; ca < 500 && !cp; ca++) {
      var cpx = 30 + Math.floor(rnd() * (S - 60)), cpy = 30 + Math.floor(rnd() * (S - 60));
      var cpi = cpy * S + cpx;
      if (flat[cpi] || (flags[cpi] & (F.WATER | F.SOLID | F.ZONE))) continue;
      var cdx = cpx - cx, cdy = cpy - cy;
      var cd2 = cdx * cdx + cdy * cdy;
      if (cd2 < 8100 || cd2 > 40000) continue;
      var far = true;
      for (var cq = 0; cq < camps.length; cq++) {
        var qdx = cpx - camps[cq].x, qdy = cpy - camps[cq].y;
        if (qdx * qdx + qdy * qdy < 2500) { far = false; break; }
      }
      if (far) cp = { x: cpx, y: cpy };
    }
    if (cp) camps.push({ x: cp.x, y: cp.y, r: 7, count: 3 + Math.floor(rnd() * 2) });
  }

  /* --- Aclarar arenas de jefe, campamentos y nidos --- */
  function clearArea(ax, ay, r, keepBiome) {
    for (var yy = ay - r; yy <= ay + r; yy++) {
      if (yy < 1 || yy >= S - 1) continue;
      for (var xx = ax - r; xx <= ax + r; xx++) {
        if (xx < 1 || xx >= S - 1) continue;
        var k4 = yy * S + xx;
        if (flat[k4]) continue;
        var adx = xx - ax, ady = yy - ay;
        if (adx * adx + ady * ady > r * r) continue;
        flags[k4] &= ~(F.SOLID | F.NODE | F.WATER);
        if (!keepBiome && elev[k4] < 100) elev[k4] = 112;
      }
    }
  }
  var lairs = [], nests = [];
  for (i = 0; i < zones.length; i++) {
    var z = zones[i];
    clearArea(z.x, z.y, 7, true);
    if (z.boss) lairs.push({ species: z.boss, pos: { x: z.x, y: z.y }, zone: z.id });
    if (z.id === 'aerie') {
      for (var nq = 0; nq < 3; nq++) {
        var na = (nq / 3) * Math.PI * 2, nd = z.r * 0.55;
        var nx2 = Math.round(z.x + Math.cos(na) * nd), ny2 = Math.round(z.y + Math.sin(na) * nd);
        clearArea(nx2, ny2, 3, true);
        nests.push({ x: nx2, y: ny2, zone: z.id });
      }
    }
  }
  for (i = 0; i < camps.length; i++) {
    clearArea(camps[i].x, camps[i].y, 5, false);
    var cci = camps[i].y * S + camps[i].x;
    flags[cci] |= F.CAMP;
  }

  /* --- Nodos de recurso --- */
  var nodeIdx = [], nodeKind = [];
  var weights = [], totals = [];
  for (var b3 = 0; b3 < BIOMES.length; b3++) {
    var arr = BIOMES[b3].nodes, tot = 0, ws = [];
    for (var q2 = 0; q2 < arr.length; q2++) {
      var ki = NODE_KEYS.indexOf(arr[q2][0]);
      if (ki < 0) continue;
      ws.push([ki, arr[q2][1]]); tot += arr[q2][1];
    }
    weights.push(ws); totals.push(tot);
  }
  var ps = LAYOUT.playerStart;
  var go1 = (seed % 997) * 0.013, go2 = (seed % 463) * 0.021, go3 = (seed % 719) * 0.017;
  var treeK = NODE_KEYS.indexOf('tree'), appleK = NODE_KEYS.indexOf('apple_tree'), deadK = NODE_KEYS.indexOf('dead_tree');
  var keepOut = [].concat(LAYOUT.parcels || [], LAYOUT.farms || []);
  function inKeepOut(px3, py3) {
    var c = LAYOUT.city;
    if (px3 >= c.x - 8 && px3 < c.x + c.w + 8 && py3 >= c.y - 8 && py3 < c.y + c.h + 8) return true;
    for (var q3 = 0; q3 < keepOut.length; q3++) {
      var r3 = keepOut[q3];
      if (px3 >= r3.x - 2 && px3 < r3.x + r3.w + 2 && py3 >= r3.y - 2 && py3 < r3.y + r3.h + 2) return true;
    }
    return false;
  }
  var CAPN = CFG.NODE_CAP;
  for (y = 0; y < S; y++) {
    for (x = 0; x < S; x++) {
      i = y * S + x;
      if (flat[i] || (flags[i] & (F.WATER | F.SOLID | F.ROAD | F.BUILDING))) continue;
      var pdx2 = x - ps.x, pdy2 = y - ps.y;
      if (pdx2 * pdx2 + pdy2 * pdy2 < 36) continue;
      var bb = biome[i], dens = DENSITY[bb];
      var gv = Math.sin(x * 0.055 + go1) * Math.cos(y * 0.048 + go2) + 0.6 * Math.sin((x * 0.6 + y) * 0.030 + go3);
      var foresty = (bb === 1 || bb === 9 || bb === 11);
      if (foresty && treeK >= 0 && gv > 0.35 && !inKeepOut(x, y)) {
        if (rnd() < 0.46) {
          var gk = treeK;
          if (bb === 11 && deadK >= 0 && rnd() < 0.18) gk = deadK;
          else if (appleK >= 0 && rnd() < 0.07) gk = appleK;
          nodeIdx.push(i); nodeKind.push(gk);
          flags[i] |= F.SOLID | F.NODE;
          if (nodeIdx.length >= CAPN) { y = S; break; }
        }
        continue;
      }
      if (rnd() >= dens) continue;
      if (inKeepOut(x, y)) continue;
      var ws2 = weights[bb], tot2 = totals[bb];
      if (!ws2.length || tot2 <= 0) continue;
      var roll = rnd() * tot2, pickK = ws2[0][0];
      for (var w2 = 0; w2 < ws2.length; w2++) { roll -= ws2[w2][1]; if (roll <= 0) { pickK = ws2[w2][0]; break; } }
      nodeIdx.push(i); nodeKind.push(pickK);
      if (NODE_SOLID[pickK]) flags[i] |= F.SOLID | F.NODE; else flags[i] |= F.NODE;
      if (nodeIdx.length >= CAPN) { y = S; break; }
    }
  }

  /* Filtrar nodos que quedaron en zonas despejadas */
  var fIdx = [], fKind = [];
  for (i = 0; i < nodeIdx.length; i++) {
    if (flags[nodeIdx[i]] & F.NODE) { fIdx.push(nodeIdx[i]); fKind.push(nodeKind[i]); }
  }

  counts = [];
  for (i = 0; i < BIOMES.length; i++) counts.push(0);
  for (i = 0; i < N; i++) if (!(flags[i] & F.WATER)) counts[biome[i]]++;

  return {
    biome: biome, elev: elev, flags: flags, region: region,
    nodeIdx: new Int32Array(fIdx), nodeKind: new Uint8Array(fKind),
    meta: { zones: zones, lairs: lairs, nests: nests, camps: camps, counts: counts, corrupt: { x: ccx, y: ccy } }
  };
}

/* ==========================================================
3 · ESTADO DEL MUNDO
========================================================== */
const NODE_KEYS = Object.keys(D.NODES);
const NODE_INDEX = Object.create(null);
NODE_KEYS.forEach(function (k, i) { NODE_INDEX[k] = i; });
const NODE_SOLID = NODE_KEYS.map(function (k) {
  const t = D.NODES[k].tool;
  return (t === 'pick' || t === 'axe') ? 1 : 0;
});
const DENSITY = D.BIOMES.map(function (b) { return b.density; });
const GEN_CFG = {
  S: C.WORLD, F: F, WATER_E: 0.30, BEACH_E: 0.345, MOUNT_E: 0.72,
  HIGH_E: 0.62, VOLC_V: 0.74, NODE_CAP: 36000
};
const ZONE_DEFS = D.ZONES.map(function (z) {
  return { id: z.id, biome: z.biome, r: z.r, boss: z.boss || null, leash: z.leash };
});

const W = CR.World = {
  F: F, size: C.WORLD, ready: false, seed: 0,
  biome: null, elev: null, flags: null, region: null,
  nodes: new Map(), soil: new Map(), buildings: [], builtAt: new Map(),
  dirty: new Set(), deadNodes: [],
  layout: null, city: null, gates: [], parcels: [], farms: [],
  zones: [], lairs: [], nests: [], camps: [], routes: [], hunterPosts: [],
  npcSpawns: {}, guardSpawns: [], playerStart: { x: 0, y: 0 },
  corrupt: { x: 0, y: 0 }, counts: [],
  _worker: null, _url: null, _uid: 0, _genToken: 0
};

W.structInfo = function (key) {
  const cs = D.CITY_STRUCTS[key];
  if (cs) return cs;
  const b = D.BUILDINGS[key];
  if (!b) return null;
  return { name: b.name, wall: b.wall || '#b0a080', roof: b.roof || '#8a7050', kind: b.kind || 'house', solid: b.blocks !== false, enter: !!b.house };
};
function structSize(key) {
  const bd = D.BUILDINGS[key];
  if (bd && bd.size) return { w: bd.size[0], h: bd.size[1] };
  const L = W.layout;
  if (L) for (let i = 0; i < L.structs.length; i++) if (L.structs[i].key === key) return { w: L.structs[i].w, h: L.structs[i].h };
  if (key === 'farm_house') return { w: 3, h: 3 };
  if (key === 'pen') return { w: 4, h: 3 };
  return { w: 3, h: 3 };
}

/* ==========================================================
4 · GENERACIÓN
========================================================== */
W.generate = function (seed, onProgress) {
  const token = ++W._genToken;
  const prog = typeof onProgress === 'function' ? onProgress : function () {};
  const keepToken = W._genToken;
  W.reset();
  W._genToken = keepToken;
  W.seed = seed >>> 0;
  W.layout = buildLayout();
  prog(0.06, 'Trazando las murallas de Vhalor…');
  return new Promise(function (resolve) {
    let settled = false, timer = 0;
    function cleanup() {
      if (timer) { clearTimeout(timer); timer = 0; }
      if (W._worker) { try { W._worker.terminate(); } catch (e) {} W._worker = null; }
      if (W._url) { try { URL.revokeObjectURL(W._url); } catch (e) {} W._url = null; }
    }
    function finish(result) {
      if (settled || token !== W._genToken) return;
      settled = true; cleanup();
      try { install(result); prog(1, 'El mundo despierta.'); resolve(true); }
      catch (e) { CR.reportError(e, 'world.install'); resolve(false); }
    }
    function fallback(reason) {
      if (settled || token !== W._genToken) return;
      cleanup();
      prog(0.34, 'Esculpiendo el terreno…');
      setTimeout(function () {
        if (settled || token !== W._genToken) return;
        try {
          const r = WORLD_GEN(W.seed, GEN_CFG, D.BIOMES, NODE_KEYS, NODE_SOLID, DENSITY, W.layout, ZONE_DEFS);
          finish(r);
        } catch (e) {
          settled = true;
          CR.reportError(e, 'world.gen.fallback (' + reason + ')');
          resolve(false);
        }
      }, 24);
    }
    if (!CR.caps.worker) { fallback('sin Worker'); return; }
    try {
      const src = 'var WORLD_GEN=' + WORLD_GEN.toString() + ';\n' +
        'self.onmessage=function(ev){try{var d=ev.data;' +
        'var r=WORLD_GEN(d.seed,d.cfg,d.biomes,d.nodeKeys,d.nodeSolid,d.density,d.layout,d.zones);' +
        'self.postMessage({ok:true,biome:r.biome,elev:r.elev,flags:r.flags,region:r.region,' +
        'nodeIdx:r.nodeIdx,nodeKind:r.nodeKind,meta:r.meta},' +
        '[r.biome.buffer,r.elev.buffer,r.flags.buffer,r.region.buffer,r.nodeIdx.buffer,r.nodeKind.buffer]);}' +
        'catch(e){self.postMessage({ok:false,error:String((e&&e.message)||e)});}};';
      const blob = new Blob([src], { type: 'application/javascript' });
      W._url = URL.createObjectURL(blob);
      W._worker = new Worker(W._url);
      prog(0.16, 'Levantando montañas y santuarios…');
      W._worker.onmessage = function (ev) {
        const d = ev.data;
        if (!d || d.ok !== true) { fallback(d && d.error ? d.error : 'respuesta inválida'); return; }
        const n = C.WORLD * C.WORLD;
        if (!d.biome || d.biome.length !== n || !d.flags || d.flags.length !== n ||
            !d.elev || d.elev.length !== n || !d.region || d.region.length !== n) {
          fallback('buffers inválidos'); return;
        }
        prog(0.70, 'Sembrando bosques y vetas…');
        finish(d);
      };
      W._worker.onerror = function (e) { if (e && e.preventDefault) e.preventDefault(); fallback('worker error'); };
      timer = setTimeout(function () { fallback('timeout'); }, 20000);
      W._worker.postMessage({
        seed: W.seed, cfg: GEN_CFG, biomes: D.BIOMES, nodeKeys: NODE_KEYS,
        nodeSolid: NODE_SOLID, density: DENSITY, layout: W.layout, zones: ZONE_DEFS
      });
    } catch (e) { fallback('excepción al crear Worker'); }
  });
};

function install(r) {
  W.biome = r.biome; W.elev = r.elev; W.flags = r.flags; W.region = r.region;
  W.nodes.clear(); W.soil.clear(); W.buildings.length = 0; W.builtAt.clear();
  W.dirty.clear(); W.deadNodes.length = 0; W._uid = 0;
  const L = W.layout;
  W.city = L.city; W.gates = L.gates.slice();
  W.parcels = L.parcels.map(function (p) { return { id: p.id, x: p.x, y: p.y, w: p.w, h: p.h, cls: p.cls, owner: null }; });
  W.farms = L.farms.map(function (f) { return { owner: f.owner, x: f.x, y: f.y, w: f.w, h: f.h }; });
  W.npcSpawns = L.npcSpawns; W.guardSpawns = L.guardSpawns; W.playerStart = L.playerStart;
  W.routes = L.routes; W.hunterPosts = L.hunterPosts;
  W.zones = r.meta.zones; W.lairs = r.meta.lairs; W.nests = r.meta.nests; W.camps = r.meta.camps;
  W.counts = r.meta.counts; W.corrupt = r.meta.corrupt;

  /* Nodos */
  for (let i = 0; i < r.nodeIdx.length; i++) {
    const idx = r.nodeIdx[i], key = NODE_KEYS[r.nodeKind[i]];
    const def = D.NODES[key];
    if (!def) continue;
    W.nodes.set(idx, { idx: idx, x: idx % C.WORLD, y: (idx / C.WORLD) | 0, key: key, hp: def.hits, dead: false, respawnDay: 0 });
  }
  /* Estructuras de la ciudad */
  for (let i = 0; i < L.structs.length; i++) {
    const s = L.structs[i];
    addBuildingRaw(s.key, s.x, s.y, 'city', true, { vendor: s.tag || null });
  }
  /* Granjas NPC + cultivos preplantados */
  const frng = CR.RNG((W.seed ^ 0x51ed2701) >>> 0);
  const cropIds = Object.keys(D.CROPS);
  for (let i = 0; i < L.farms.length; i++) {
    const f = L.farms[i];
    addBuildingRaw('farm_house', f.house.x, f.house.y, f.owner, true, {});
    const n = 30 + frng.int(0, 12);
    for (let k = 0; k < n; k++) {
      const cx2 = f.x + frng.int(0, f.w - 1), cy2 = f.y + frng.int(0, f.h - 1);
      const idx = cy2 * C.WORLD + cx2;
      if (W.flags[idx] & (F.SOLID | F.ROAD | F.BUILDING)) continue;
      if (W.soil.has(idx)) continue;
      setSoil(idx, { crop: frng.pick(cropIds), growth: Math.min(1, frng.range(0.2, 1.05)), watered: false, fert: null, q: 0, owner: f.owner, day: 0 });
    }
  }
  /* Campamentos de bandidos: fogata y empalizada */
  for (let i = 0; i < W.camps.length; i++) {
    const c = W.camps[i];
    addBuildingRaw('campfire', c.x, c.y, 'bandit', false, {});
    if (W.inBounds(c.x - 3, c.y - 2)) addBuildingRaw('pen', c.x - 3, c.y - 2, 'bandit', false, {});
  }
  W.dirty.clear();
  W.ready = true;
}

W.reset = function () {
  W._genToken++;
  if (W._worker) { try { W._worker.terminate(); } catch (e) {} W._worker = null; }
  if (W._url) { try { URL.revokeObjectURL(W._url); } catch (e) {} W._url = null; }
  W.ready = false;
  W.biome = W.elev = W.flags = W.region = null;
  W.nodes.clear(); W.soil.clear(); W.dirty.clear();
  W.buildings.length = 0; W.builtAt.clear(); W.deadNodes.length = 0;
  W.parcels.length = 0; W.farms.length = 0;
  W.zones.length = 0; W.lairs.length = 0; W.nests.length = 0; W.camps.length = 0;
  W.routes.length = 0; W.hunterPosts.length = 0;
  W.Hash.clear();
  W._uid = 0;
};

/* ==========================================================
5 · API DE TILES
========================================================== */
W.inBounds = function (x, y) { return x >= 0 && y >= 0 && x < C.WORLD && y < C.WORLD; };
W.idx = function (x, y) { return (y | 0) * C.WORLD + (x | 0); };
W.at = function (x, y) { return W.inBounds(x, y) ? W.idx(x, y) : -1; };
W.flagsAt = function (x, y) {
  if (!W.ready || !W.inBounds(x, y)) return F.SOLID | F.WATER;
  return W.flags[W.idx(x, y)];
};
W.biomeAt = function (x, y) { return (W.ready && W.inBounds(x, y)) ? W.biome[W.idx(x, y)] : 0; };
W.biomeName = function (x, y) { const b = D.BIOMES[W.biomeAt(x, y)]; return b ? b.name : '—'; };
W.elevAt = function (x, y) { return (W.ready && W.inBounds(x, y)) ? W.elev[W.idx(x, y)] : 0; };
W.isSolid = function (x, y) { return (W.flagsAt(x, y) & F.SOLID) !== 0; };
W.isWater = function (x, y) { return (W.flagsAt(x, y) & F.WATER) !== 0; };
W.isRoad = function (x, y) { return (W.flagsAt(x, y) & F.ROAD) !== 0; };
W.isWall = function (x, y) { return (W.flagsAt(x, y) & F.WALL) !== 0; };
W.isFarm = function (x, y) { return (W.flagsAt(x, y) & F.FARM) !== 0; };
W.isParcel = function (x, y) { return (W.flagsAt(x, y) & F.PARCEL) !== 0; };
W.cityDist = function (x, y) {
  const c = W.city;
  if (!c) return 1e9;
  const dx = Math.max(c.x - x, 0, x - (c.x + c.w));
  const dy = Math.max(c.y - y, 0, y - (c.y + c.h));
  return Math.sqrt(dx * dx + dy * dy);
};
W.isCity = function (x, y) {
  const c = W.city;
  return !!c && x >= c.x && y >= c.y && x < c.x + c.w && y < c.y + c.h;
};
W.setFlags = function (idx, bits, on) {
  if (!W.ready || idx < 0 || idx >= W.flags.length) return;
  const before = W.flags[idx];
  const after = on ? (before | bits) : (before & ~bits);
  if (before === after) return;
  W.flags[idx] = after;
  W.dirty.add(idx);
};

/* --- Santuarios --- */
W.zoneAt = function (x, y) {
  if (!W.ready || !W.inBounds(x, y)) return null;
  const r = W.region[W.idx(x, y)];
  return r ? W.zones[r - 1] || null : null;
};
W.zoneInfo = function (id) { return D.ZONE_BY_ID[id] || null; };
W.zoneDefAt = function (x, y) { const z = W.zoneAt(x, y); return z ? D.ZONE_BY_ID[z.id] : null; };
W.inZone = function (x, y, id) { const z = W.zoneAt(x, y); return !!z && z.id === id; };

/* --- Edificios enterables --- */
W.ENTERABLE = {
  church: 1, house_small: 1, barracks: 1, smithy: 1, steward: 1, owner_house: 1,
  bank: 1, land_office: 1, alchemy_hut: 1, hunter_lodge: 1, inn: 1
};
W.insideBuilding = function (x, y) {
  for (let i = 0; i < W.buildings.length; i++) {
    const b = W.buildings[i];
    const enterable = b.city ? W.ENTERABLE[b.key] : (D.BUILDINGS[b.key] && D.BUILDINGS[b.key].house);
    if (enterable && x >= b.x && x < b.x + b.w && y >= b.y && y < b.y + b.h) return b;
  }
  return null;
};
W.refreshSolid = function (idx) {
  if (!W.ready || idx < 0 || idx >= W.flags.length) return;
  const f = W.flags[idx];
  let solid = (f & (F.WATER | F.WALL)) !== 0;
  if (!solid && (f & F.BUILDING)) {
    const b = W.builtAt.get(idx);
    if (b) {
      const info = W.structInfo(b.key);
      solid = !info || info.solid !== false;
      const enterable = b.city ? W.ENTERABLE[b.key] : (D.BUILDINGS[b.key] && D.BUILDINGS[b.key].house);
      if (solid && enterable) {
        const lx = (idx % C.WORLD) - b.x, ly = ((idx / C.WORLD) | 0) - b.y;
        const door = ly === b.h - 1 && lx === (b.w >> 1);
        const inner = lx > 0 && lx < b.w - 1 && ly > 0 && ly < b.h - 1;
        if (door || inner) solid = false;
      }
    } else solid = true;
  }
  if (!solid && (f & F.NODE)) {
    const n = W.nodes.get(idx);
    if (n && !n.dead) solid = NODE_SOLID[NODE_INDEX[n.key]] === 1;
  }
  W.setFlags(idx, F.SOLID, solid);
};
W.walkable = function (x, y, flying) {
  if (!W.inBounds(x, y)) return false;
  const f = W.flags[W.idx(x, y)];
  if (flying) return (f & (F.WALL | F.BUILDING)) === 0;
  return (f & F.SOLID) === 0;
};

/* ==========================================================
6 · NODOS DE RECURSO
========================================================== */
W.nodeAt = function (x, y) {
  const i = W.at(x, y);
  if (i < 0) return null;
  const n = W.nodes.get(i);
  return (n && !n.dead) ? n : null;
};
W.nodeDef = function (key) { return D.NODES[key] || null; };
W.damageNode = function (x, y, toolKind, power, day) {
  const n = W.nodeAt(x, y);
  if (!n) return { ok: false, reason: 'none' };
  const def = D.NODES[n.key];
  if (!def) return { ok: false, reason: 'nodef' };
  if (def.tool !== 'hand' && def.tool !== toolKind) return { ok: false, reason: 'tool', need: def.tool };
  if (power < def.pow) return { ok: false, reason: 'power', need: def.pow };
  n.hp -= Math.max(1, power - def.pow + 1);
  if (n.hp > 0) return { ok: true, broke: false, node: n, def: def };
  n.dead = true; n.hp = 0;
  n.respawnDay = (day || 0) + def.respawn;
  W.deadNodes.push(n);
  W.setFlags(n.idx, F.NODE, false);
  W.refreshSolid(n.idx);
  return { ok: true, broke: true, node: n, def: def };
};
W.dayTick = function (day) {
  for (let i = W.deadNodes.length - 1; i >= 0; i--) {
    const n = W.deadNodes[i];
    if (n.respawnDay > day) continue;
    const def = D.NODES[n.key];
    n.dead = false; n.hp = def ? def.hits : 1; n.respawnDay = 0;
    W.setFlags(n.idx, F.NODE, true);
    W.refreshSolid(n.idx);
    W.deadNodes.splice(i, 1);
  }
};

/* ==========================================================
7 · SUELO AGRÍCOLA
========================================================== */
function setSoil(idx, obj) { W.soil.set(idx, obj); W.setFlags(idx, F.TILLED, true); }
W.setSoil = setSoil;
W.soilAt = function (x, y) { const i = W.at(x, y); return i < 0 ? null : (W.soil.get(i) || null); };
W.clearSoil = function (idx) {
  if (!W.soil.has(idx)) return;
  W.soil.delete(idx);
  W.setFlags(idx, F.TILLED, false);
};
W.canTill = function (x, y) {
  const i = W.at(x, y);
  if (i < 0 || !W.ready) return false;
  const f = W.flags[i];
  if (f & (F.SOLID | F.WATER | F.ROAD | F.BUILDING | F.NODE | F.WALL | F.TILLED)) return false;
  return (f & (F.FARM | F.PARCEL)) !== 0;
};

/* ==========================================================
8 · EDIFICIOS
========================================================== */
function addBuildingRaw(key, x, y, owner, isCity, data) {
  const info = W.structInfo(key);
  const sz = structSize(key);
  const b = { uid: ++W._uid, key: key, x: x, y: y, w: sz.w, h: sz.h, owner: owner, city: !!isCity, data: data || {}, info: info };
  W.buildings.push(b);
  for (let yy = y; yy < y + sz.h; yy++) for (let xx = x; xx < x + sz.w; xx++) {
    const i = W.at(xx, yy);
    if (i < 0) continue;
    W.builtAt.set(i, b);
    W.setFlags(i, F.BUILDING, true);
    W.refreshSolid(i);
  }
  return b;
}
W.buildingAt = function (x, y) { const i = W.at(x, y); return i < 0 ? null : (W.builtAt.get(i) || null); };
W.doorOf = function (b) { return { x: b.x + ((b.w / 2) | 0), y: b.y + b.h }; };
W.byUid = function (uid) {
  for (let i = 0; i < W.buildings.length; i++) if (W.buildings[i].uid === uid) return W.buildings[i];
  return null;
};
W.canPlace = function (key, x, y, owner) {
  const bd = D.BUILDINGS[key];
  if (!bd) return { ok: false, reason: 'Edificio desconocido.' };
  if (!W.ready) return { ok: false, reason: 'Mundo no listo.' };
  const w = bd.size[0], h = bd.size[1];
  if (!W.inBounds(x, y) || !W.inBounds(x + w - 1, y + h - 1)) return { ok: false, reason: 'Fuera del mundo.' };
  let inside = false;
  for (let i = 0; i < W.parcels.length; i++) {
    const p = W.parcels[i];
    if (p.owner === owner && x >= p.x && y >= p.y && x + w <= p.x + p.w && y + h <= p.y + p.h) { inside = true; break; }
  }
  if (!inside) return { ok: false, reason: 'Debe caber entero en una parcela tuya.' };
  for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) {
    const idx = W.idx(xx, yy), f = W.flags[idx];
    if (f & (F.SOLID | F.WATER | F.ROAD | F.BUILDING | F.NODE | F.WALL)) return { ok: false, reason: 'Terreno ocupado en (' + xx + ',' + yy + ').' };
    if (W.soil.has(idx)) return { ok: false, reason: 'Hay cultivo arado ahí.' };
  }
  return { ok: true };
};
W.addBuilding = function (key, x, y, owner, data) {
  const chk = W.canPlace(key, x, y, owner);
  if (!chk.ok) return chk;
  return { ok: true, building: addBuildingRaw(key, x, y, owner || 'player', false, data || {}) };
};
W.removeBuilding = function (uid) {
  const b = W.byUid(uid);
  if (!b || b.city) return false;
  for (let yy = b.y; yy < b.y + b.h; yy++) for (let xx = b.x; xx < b.x + b.w; xx++) {
    const i = W.at(xx, yy);
    if (i < 0) continue;
    W.builtAt.delete(i);
    W.setFlags(i, F.BUILDING, false);
    W.refreshSolid(i);
  }
  const k = W.buildings.indexOf(b);
  if (k >= 0) W.buildings.splice(k, 1);
  return true;
};
W.playerBuildings = function () {
  const out = [];
  for (let i = 0; i < W.buildings.length; i++) if (W.buildings[i].owner === 'player') out.push(W.buildings[i]);
  return out;
};
W.bestHouse = function () {
  let best = null, bestTier = -1;
  const list = W.playerBuildings();
  for (let i = 0; i < list.length; i++) {
    const bd = D.BUILDINGS[list[i].key];
    if (!bd || !bd.house) continue;
    if (bd.tier > bestTier) { bestTier = bd.tier; best = list[i]; }
  }
  return best;
};
/** Mejor cama disponible: la casa de mayor tier o una cama colocada. */
W.bestBed = function () {
  let best = null, bestTier = -1;
  const list = W.playerBuildings();
  for (let i = 0; i < list.length; i++) {
    const bd = D.BUILDINGS[list[i].key];
    if (!bd || !bd.beds) continue;
    const tier = bd.bedTier !== undefined ? bd.bedTier : (bd.tier || 0);
    if (tier > bestTier) { bestTier = tier; best = { building: list[i], tier: tier, heal: bd.heal === undefined ? 1 : bd.heal }; }
  }
  return best;
};
/** Estaciones de crafteo cerca de un punto, incluidas las que prestan los mercaderes. */
W.stationsNear = function (x, y, r) {
  const set = { hand: true };
  const r2 = r * r;
  for (let i = 0; i < W.buildings.length; i++) {
    const b = W.buildings[i];
    const cx2 = b.x + b.w / 2, cy2 = b.y + b.h / 2;
    if (U.dist2(x, y, cx2, cy2) > r2) continue;
    if (b.owner === 'player') {
      const bd = D.BUILDINGS[b.key];
      if (!bd || !bd.functions) continue;
      for (let k = 0; k < bd.functions.length; k++) {
        if (D.STATIONS.indexOf(bd.functions[k]) >= 0) set[bd.functions[k]] = true;
      }
    } else if (b.city && b.data && b.data.vendor) {
      const ms = D.MERCHANT_STATIONS[b.data.vendor];
      if (ms) for (let k = 0; k < ms.stations.length; k++) set[ms.stations[k]] = true;
    }
  }
  return set;
};
/** Recargo del mercader dueño del taller más cercano (0 si es tuyo). */
W.stationFee = function (station, x, y, r) {
  const r2 = r * r;
  let own = false, fee = 1;
  for (let i = 0; i < W.buildings.length; i++) {
    const b = W.buildings[i];
    if (U.dist2(x, y, b.x + b.w / 2, b.y + b.h / 2) > r2) continue;
    if (b.owner === 'player') {
      const bd = D.BUILDINGS[b.key];
      if (bd && bd.functions && bd.functions.indexOf(station) >= 0) own = true;
    } else if (b.city && b.data && b.data.vendor) {
      const ms = D.MERCHANT_STATIONS[b.data.vendor];
      if (ms && ms.stations.indexOf(station) >= 0) fee = Math.min(fee, ms.fee);
    }
  }
  return own ? 0 : fee;
};

/* ==========================================================
9 · PARCELAS Y TÍTULOS
========================================================== */
W.parcelAt = function (x, y) {
  for (let i = 0; i < W.parcels.length; i++) {
    const p = W.parcels[i];
    if (x >= p.x && y >= p.y && x < p.x + p.w && y < p.y + p.h) return p;
  }
  return null;
};
W.ownedParcels = function () {
  const out = [];
  for (let i = 0; i < W.parcels.length; i++) if (W.parcels[i].owner === 'player') out.push(W.parcels[i]);
  return out;
};
W.parcelPrice = function (pa) {
  let mult = 1;
  for (let i = 0; i < D.PARCEL_CLASSES.length; i++) if (D.PARCEL_CLASSES[i].cls === pa.cls) { mult = D.PARCEL_CLASSES[i].mult; break; }
  const base = Math.round(pa.w * pa.h * D.BAL.PARCEL_BASE * mult / 10) * 10;
  return Math.round(base * (1 + D.BAL.PARCEL_ESCALATE * W.ownedParcels().length));
};
W.nextParcelPrice = function () {
  let best = 0;
  for (let i = 0; i < W.parcels.length; i++) {
    if (W.parcels[i].owner) continue;
    const p = W.parcelPrice(W.parcels[i]);
    if (!best || p < best) best = p;
  }
  return best;
};
W.buyParcel = function (id) {
  for (let i = 0; i < W.parcels.length; i++) {
    if (W.parcels[i].id === id && !W.parcels[i].owner) { W.parcels[i].owner = 'player'; return true; }
  }
  return false;
};
W.title = function () {
  const n = W.ownedParcels().length, t = D.BAL.TITLES;
  for (let i = 0; i < t.length; i++) if (n >= t[i].n) return t[i];
  return { n: 0, name: 'Sin tierras', slaves: 0, guardDiscount: false };
};
W.farmAt = function (x, y) {
  for (let i = 0; i < W.farms.length; i++) {
    const f = W.farms[i];
    if (x >= f.x && y >= f.y && x < f.x + f.w && y < f.y + f.h) return f;
  }
  return null;
};
W.campAt = function (x, y) {
  for (let i = 0; i < W.camps.length; i++) {
    const c = W.camps[i];
    if (U.dist2(x, y, c.x, c.y) <= c.r * c.r) return c;
  }
  return null;
};

/* ==========================================================
10 · HASH ESPACIAL (sin allocations en régimen)
========================================================== */
W.Hash = {
  cell: C.HASH_CELL, dim: Math.ceil(C.WORLD / C.HASH_CELL),
  map: new Map(), used: [],
  clear() { this.map.clear(); this.used.length = 0; },
  rebuild(list) {
    for (let i = 0; i < this.used.length; i++) {
      const a = this.map.get(this.used[i]);
      if (a) a.length = 0;
    }
    this.used.length = 0;
    const cs = this.cell, dim = this.dim;
    for (let i = 0; i < list.length; i++) {
      const e = list[i];
      if (!e || !e.t || (e.tg && e.tg.dead)) continue;
      const cx2 = U.clamp((e.t.x / cs) | 0, 0, dim - 1);
      const cy2 = U.clamp((e.t.y / cs) | 0, 0, dim - 1);
      const key = cy2 * dim + cx2;
      let a = this.map.get(key);
      if (!a) { a = []; this.map.set(key, a); }
      if (a.length === 0) this.used.push(key);
      a.push(e);
    }
  },
  query(x, y, r, out) {
    out.length = 0;
    const cs = this.cell, dim = this.dim, r2 = r * r;
    const x0 = U.clamp(((x - r) / cs) | 0, 0, dim - 1), x1 = U.clamp(((x + r) / cs) | 0, 0, dim - 1);
    const y0 = U.clamp(((y - r) / cs) | 0, 0, dim - 1), y1 = U.clamp(((y + r) / cs) | 0, 0, dim - 1);
    for (let cy2 = y0; cy2 <= y1; cy2++) for (let cx2 = x0; cx2 <= x1; cx2++) {
      const a = this.map.get(cy2 * dim + cx2);
      if (!a) continue;
      for (let i = 0; i < a.length; i++) {
        const e = a[i];
        if (!e.t || (e.tg && e.tg.dead)) continue;
        if (U.dist2(x, y, e.t.x, e.t.y) <= r2) out.push(e);
      }
    }
    return out;
  }
};

/* ==========================================================
11 · A* ACOTADO + LÍNEA DE VISIÓN
========================================================== */
const _g = new Map(), _came = new Map(), _closed = new Set();
const _heap = [], _heapF = [];
function heapPush(node, f) {
  _heap.push(node); _heapF.push(f);
  let i = _heap.length - 1;
  while (i > 0) {
    const p = (i - 1) >> 1;
    if (_heapF[p] <= _heapF[i]) break;
    let t = _heap[p]; _heap[p] = _heap[i]; _heap[i] = t;
    t = _heapF[p]; _heapF[p] = _heapF[i]; _heapF[i] = t;
    i = p;
  }
}
function heapPop() {
  const top = _heap[0];
  const lastN = _heap.pop(), lastF = _heapF.pop();
  if (_heap.length) {
    _heap[0] = lastN; _heapF[0] = lastF;
    let i = 0;
    for (;;) {
      const l = i * 2 + 1, r = l + 1;
      let m = i;
      if (l < _heap.length && _heapF[l] < _heapF[m]) m = l;
      if (r < _heap.length && _heapF[r] < _heapF[m]) m = r;
      if (m === i) break;
      let t = _heap[m]; _heap[m] = _heap[i]; _heap[i] = t;
      t = _heapF[m]; _heapF[m] = _heapF[i]; _heapF[i] = t;
      i = m;
    }
  }
  return top;
}
const NB = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];
W.findPath = function (sx, sy, tx, ty, maxNodes, flying) {
  sx = Math.round(sx); sy = Math.round(sy); tx = Math.round(tx); ty = Math.round(ty);
  if (!W.inBounds(sx, sy) || !W.inBounds(tx, ty)) return null;
  if (!W.walkable(tx, ty, flying)) {
    let found = false;
    for (let i = 0; i < NB.length && !found; i++) {
      const nx = tx + NB[i][0], ny = ty + NB[i][1];
      if (W.walkable(nx, ny, flying)) { tx = nx; ty = ny; found = true; }
    }
    if (!found) return null;
  }
  if (sx === tx && sy === ty) return [];
  const limit = maxNodes || 520;
  _g.clear(); _came.clear(); _closed.clear(); _heap.length = 0; _heapF.length = 0;
  const S = C.WORLD;
  const start = sy * S + sx, goal = ty * S + tx;
  _g.set(start, 0);
  heapPush(start, Math.abs(tx - sx) + Math.abs(ty - sy));
  let expanded = 0;
  while (_heap.length && expanded < limit) {
    const cur = heapPop();
    if (cur === goal) {
      const path = [];
      let n = goal;
      while (n !== start) {
        path.push({ x: n % S, y: (n / S) | 0 });
        const prev = _came.get(n);
        if (prev === undefined) break;
        n = prev;
      }
      path.reverse();
      return path;
    }
    if (_closed.has(cur)) continue;
    _closed.add(cur); expanded++;
    const cx2 = cur % S, cy2 = (cur / S) | 0;
    const cg = _g.get(cur) || 0;
    for (let i = 0; i < 8; i++) {
      const nx = cx2 + NB[i][0], ny = cy2 + NB[i][1];
      if (!W.walkable(nx, ny, flying)) continue;
      if (i >= 4 && (!W.walkable(cx2 + NB[i][0], cy2, flying) || !W.walkable(cx2, cy2 + NB[i][1], flying))) continue;
      const ni = ny * S + nx;
      if (_closed.has(ni)) continue;
      const ng = cg + (i >= 4 ? 1.414 : 1);
      const old = _g.get(ni);
      if (old !== undefined && old <= ng) continue;
      _g.set(ni, ng); _came.set(ni, cur);
      heapPush(ni, ng + Math.abs(tx - nx) + Math.abs(ty - ny));
    }
  }
  return null;
};
W.lineOfSight = function (x0, y0, x1, y1) {
  let ax = Math.round(x0), ay = Math.round(y0);
  const bx = Math.round(x1), by = Math.round(y1);
  const dx = Math.abs(bx - ax), dy = Math.abs(by - ay);
  const sx = ax < bx ? 1 : -1, sy = ay < by ? 1 : -1;
  let err = dx - dy, guard = 0;
  const ox = ax, oy = ay;
  while (guard++ < 1024) {
    if (ax === bx && ay === by) return true;
    const f = W.flagsAt(ax, ay);
    if ((f & (F.WALL | F.BUILDING)) && !(ax === ox && ay === oy)) return false;
    const e2 = err * 2;
    if (e2 > -dy) { err -= dy; ax += sx; }
    if (e2 < dx) { err += dx; ay += sy; }
  }
  return false;
};

/* ==========================================================
12 · SPAWNS CON SEPARACIÓN ECOLÓGICA
========================================================== */
W.randomTileNear = function (x, y, rMin, rMax, rng) {
  for (let i = 0; i < 30; i++) {
    const a = rng.next() * U.TAU;
    const d = rMin + rng.next() * (rMax - rMin);
    const tx = Math.round(x + Math.cos(a) * d), ty = Math.round(y + Math.sin(a) * d);
    if (!W.inBounds(tx, ty)) continue;
    const idx = W.idx(tx, ty), f = W.flags[idx];
    if (f & (F.SOLID | F.WATER | F.BUILDING | F.WALL | F.ROAD)) continue;
    if (W.isCity(tx, ty)) continue;
    return { x: tx, y: ty, biome: W.biome[idx], zone: W.region[idx] ? W.zones[W.region[idx] - 1] : null };
  }
  return null;
};
/** ¿Respeta la distancia mínima entre grupos y la separación depredador/presa? */
W.spawnClear = function (sd, x, y, list) {
  const B2 = D.BAL;
  const minD2 = B2.SPAWN_MIN_DIST * B2.SPAWN_MIN_DIST;
  const ppD2 = B2.SPAWN_PRED_PREY * B2.SPAWN_PRED_PREY;
  const pred = (sd.diet === 'carnivore' || sd.diet === 'omnivore');
  for (let i = 0; i < list.length; i++) {
    const e = list[i];
    if (!e.t || e.tg.dead || e.type === 'npc' || e.type === 'guard' || e.type === 'worker' || e.type === 'player') continue;
    if (!e.species || e.tg.tamed) continue;
    const d2 = U.dist2(x, y, e.t.x, e.t.y);
    if (d2 > ppD2) continue;
    const od = D.SPECIES[e.species];
    if (!od) continue;
    if (e.species === sd.id) { if (d2 < 4) return false; continue; }
    if (d2 < minD2) return false;
    const oPred = (od.diet === 'carnivore' || od.diet === 'omnivore');
    if (pred !== oPred && d2 < ppD2) return false;
  }
  return true;
};
/** Tile válido para una especie: bioma, santuario exclusivo y separación. */
W.speciesSpawnTile = function (species, px, py, rng, list) {
  const sd = D.SPECIES[species];
  if (!sd) return null;
  const rMin = D.BAL.SPAWN_RING[0], rMax = D.BAL.SPAWN_RING[1];
  for (let i = 0; i < 40; i++) {
    let t;
    if (sd.zone) {
      let z = null;
      for (let k = 0; k < W.zones.length; k++) if (W.zones[k].id === sd.zone) { z = W.zones[k]; break; }
      if (!z) return null;
      const a = rng.next() * U.TAU, d = rng.next() * (z.r - 3);
      const tx = Math.round(z.x + Math.cos(a) * d), ty = Math.round(z.y + Math.sin(a) * d);
      if (!W.inBounds(tx, ty)) continue;
      const idx = W.idx(tx, ty);
      if (W.flags[idx] & (F.SOLID | F.WATER | F.BUILDING | F.ROAD)) continue;
      t = { x: tx, y: ty, biome: W.biome[idx], zone: z };
      if (U.dist2(px, py, tx, ty) > D.BAL.SPAWN_DESPAWN * D.BAL.SPAWN_DESPAWN) continue;
    } else {
      t = W.randomTileNear(px, py, rMin, rMax, rng);
      if (!t) continue;
      if (t.zone) continue;                       /* los santuarios son exclusivos */
      if (sd.biomes && sd.biomes.length && sd.biomes.indexOf(t.biome) < 0) continue;
    }
    if (W.cityDist(t.x, t.y) < D.BAL.SPAWN_CITY_BUFFER) continue;
    if (W.parcelAt(t.x, t.y) || W.farmAt(t.x, t.y)) continue;
    if (list && !W.spawnClear(sd, t.x + 0.5, t.y + 0.5, list)) continue;
    return t;
  }
  return null;
};
W.fishingSpot = function (x, y, r) {
  const x0 = Math.max(0, (x - r) | 0), x1 = Math.min(C.WORLD - 1, (x + r) | 0);
  const y0 = Math.max(0, (y - r) | 0), y1 = Math.min(C.WORLD - 1, (y + r) | 0);
  let best = null, bestD = 1e9;
  for (let yy = y0; yy <= y1; yy++) for (let xx = x0; xx <= x1; xx++) {
    if (!(W.flags[yy * C.WORLD + xx] & F.WATER)) continue;
    if (!W.walkable(xx + 1, yy, false) && !W.walkable(xx - 1, yy, false) &&
        !W.walkable(xx, yy + 1, false) && !W.walkable(xx, yy - 1, false)) continue;
    const d = U.dist2(x, y, xx + 0.5, yy + 0.5);
    if (d < bestD) { bestD = d; best = { x: xx, y: yy }; }
  }
  return best;
};

/* ==========================================================
13 · SERIALIZACIÓN (semilla + diferencias)
========================================================== */
W.serialize = function () {
  const dirty = [];
  W.dirty.forEach(function (idx) { dirty.push([idx, W.flags[idx]]); });
  const nodes = [];
  W.nodes.forEach(function (n) {
    const def = D.NODES[n.key];
    if (n.dead || n.hp !== (def ? def.hits : 3)) nodes.push([n.idx, n.hp, n.dead ? 1 : 0, n.respawnDay]);
  });
  const soil = [];
  W.soil.forEach(function (s, idx) { soil.push([idx, s]); });
  const builds = [];
  const skipOwner = { city: 1, bandit: 1 };
  for (let i = 0; i < D.FARM_OWNERS.length; i++) skipOwner[D.FARM_OWNERS[i]] = 1;
  for (let i = 0; i < W.buildings.length; i++) {
    const b = W.buildings[i];
    if (b.city || skipOwner[b.owner]) continue;
    builds.push({ uid: b.uid, key: b.key, x: b.x, y: b.y, owner: b.owner, data: b.data });
  }
  const parcels = [];
  for (let i = 0; i < W.parcels.length; i++) if (W.parcels[i].owner) parcels.push([W.parcels[i].id, W.parcels[i].owner]);
  return { seed: W.seed, dirty: dirty, nodes: nodes, soil: soil, builds: builds, parcels: parcels, uid: W._uid };
};
W.deserialize = function (data) {
  if (!W.ready || !data) return false;
  try {
    if (Array.isArray(data.dirty)) {
      for (let i = 0; i < data.dirty.length; i++) {
        const d = data.dirty[i];
        if (d && d[0] >= 0 && d[0] < W.flags.length) { W.flags[d[0]] = d[1]; W.dirty.add(d[0]); }
      }
    }
    if (Array.isArray(data.nodes)) {
      for (let i = 0; i < data.nodes.length; i++) {
        const d = data.nodes[i], n = W.nodes.get(d[0]);
        if (!n) continue;
        n.hp = d[1]; n.dead = !!d[2]; n.respawnDay = d[3] || 0;
        if (n.dead && W.deadNodes.indexOf(n) < 0) W.deadNodes.push(n);
      }
    }
    if (Array.isArray(data.soil)) {
      W.soil.clear();
      for (let i = 0; i < data.soil.length; i++) {
        const d = data.soil[i];
        if (d && d[1]) W.soil.set(d[0], d[1]);
      }
    }
    if (Array.isArray(data.parcels)) {
      for (let i = 0; i < data.parcels.length; i++) {
        const d = data.parcels[i];
        for (let k = 0; k < W.parcels.length; k++) if (W.parcels[k].id === d[0]) W.parcels[k].owner = d[1];
      }
    }
    if (Array.isArray(data.builds)) {
      for (let i = 0; i < data.builds.length; i++) {
        const b = data.builds[i];
        if (!D.BUILDINGS[b.key]) continue;
        const inst = addBuildingRaw(b.key, b.x, b.y, b.owner, false, b.data || {});
        if (b.uid) inst.uid = b.uid;
      }
    }
    W._uid = Math.max(W._uid, data.uid || 0);
    W.dirty.forEach(function (idx) { W.refreshSolid(idx); });
    return true;
  } catch (e) {
    CR.reportError(e, 'world.deserialize');
    return false;
  }
};

console.info('[CR] world.js v3 listo · ' + C.WORLD + '² · ' + D.BIOMES.length + ' biomas · ' +
  D.ZONES.length + ' santuarios · 44 parcelas · 8 granjas · 2 puertas · nodos: ' + NODE_KEYS.length);
})();