/* ============================================================
KANATO DE JOTUN · ui.js — Capa DOM v4 (horizontal, sin emojis)
ARCHIVO EN 2 PARTES CONCATENABLES: 7A · 7B
7A abre el IIFE; 7B lo cierra. No insertes nada entre ellas.

CAMBIOS v4:
· Panel RECETARIO (tecla J / botón del menú): los 6 saberes con
  su tier, estado y coste en puntos de receta (S.learnSaber).
· Crafteo: badges de TIER (1/2/3), SABER requerido, taller
  PÚBLICO con enfriamiento visible y recargo de mercader.
· Inventario y equipo: los objetos ROTOS se marcan en rojo y
  ofrecen REPARAR con el coste exacto en materiales (S.repairInv
  / S.repairEquip). Nada se destruye al romperse.
· Habilidades: muestra puntos de receta (rp) y tier actual.
· screen-intro registrada para la historia inicial (main.js v4).
Mantiene todo lo v3: HUD recolocable, editor de controles,
24 paneles, diálogo con retratos, orientación horizontal.
============================================================ */
(function () {
'use strict';
const CR = window.CR;
if (!CR || !CR.Sys || !CR.Render) { console.error('[CR] ui.js requiere el resto de módulos'); return; }
const U = CR.util, C = CR.CONFIG, D = CR.DATA, B = D.BAL, W = CR.World, E = CR.Ent,
S = CR.Sys, R = CR.Render, A = CR.Audio, Bus = CR.Bus, Art = CR.Art;

const UI = CR.UI = {
  local: null, invSel: -1, chestSel: -1,
  _toasts: [], _banner: 0, _hudT: 0, _type: null, _lastVol: 0.8,
  _shopTab: 'buy', _craftTab: 'all', _qs: null, _tipTimer: 0,
  _portrait: false, _orT: 0, _edit: false, _editor: null, ready: false
};
const el = function (id) { return document.getElementById(id); };
UI.el = el;

/* ==========================================================
0 · TEXTO, ICONOS Y NORMALIZACIÓN DE IDS
========================================================== */
const ESCMAP = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return ESCMAP[c]; }); }
function clean(s) { return Art && Art.strip ? Art.strip(s) : String(s == null ? '' : s); }
function ictxt(s) { return esc(clean(s)); }
const CATG = {
  material: 'material', tool: 'craft', weapon: 'sword', armor: 'armor', food: 'food',
  crop: 'role_farm', seed: 'seed', fish: 'fish', potion: 'potion', heal: 'potion',
  fert: 'fert', feed: 'feed', bag: 'bag', saddle: 'mount', petarmor: 'armor',
  acc: 'rings', legendary: 'crown', unique: 'boss', animal: 'tame',
  product: 'material', ammo: 'arrow', shield: 'shield', bed: 'bed', misc: 'chest'
};
const _norm = Object.create(null);
function normId(id) {
  if (!id) return '';
  let v = _norm[id];
  if (v !== undefined) return v;
  let s = String(id).replace(/\s+/g, '_');
  const m = s.match(/^(cloth|leather|hard_leather|iron|steel|mithril|adamantite)(head|chest|legs)$/);
  if (m) s = m[1] + '_' + m[2];
  _norm[id] = s;
  return s;
}
function itemDef(id) { return D.ITEMS[id] || D.ITEMS[normId(id)] || null; }
function itemKey(id) {
  if (!id) return 'ui:material';
  if (Art.icons[id]) return id;
  const n = normId(id);
  if (Art.icons[n]) return n;
  const def = itemDef(id);
  return 'ui:' + (CATG[def && def.cat] || 'material');
}
function iimg(id, size, cls) { return Art.html(itemKey(id), size || 24, cls); }
function spimg(sp, size, cls) { return Art.html('sp:' + sp, size || 24, cls); }
function npcimg(id, size, cls) { return Art.html('npc:' + id, size || 24, cls); }
function bldimg(k, size, cls) { return Art.html('bld:' + k, size || 24, cls); }
function uiimg(k, size, cls) { return Art.html('ui:' + k, size || 15, cls); }
const BY_NAME = Object.create(null);
Object.keys(D.ITEMS).forEach(function (k) { BY_NAME[D.ITEMS[k].name] = k; });
const TAG_GLYPH = { Pescado: 'fish', Carne: 'food', Grano: 'role_farm', Hortaliza: 'role_farm', Fruta: 'food', Combustible: 'fire', Hierba: 'seed' };
function ingKey(ing) {
  if (ing.id) return itemKey(ing.id);
  const k = BY_NAME[ing.name];
  if (k) return itemKey(k);
  return 'ui:' + (TAG_GLYPH[ing.name] || 'material');
}
function stars(q) {
  const n = U.clamp((q | 0) + 1, 1, 3);
  let h = '<span class="stars">';
  for (let i = 0; i < 3; i++) h += Art.html(i < n ? 'ui:star' : 'ui:star_empty', 10);
  return h + '</span>';
}
function price(n) { return '<span class="price">' + uiimg('coin', 12) + U.fmt(n) + '</span>'; }
/* --- Badges v4 --- */
function tbadge(t, ok) { return '<span class="tbadge t' + t + (ok ? '' : ' off') + '">T' + t + '</span>'; }
function btag(txt) { return '<span class="btag">' + esc(txt) + '</span>'; }

/* ==========================================================
1 · GLIFOS DE INTERFAZ (propios de ui.js)
========================================================== */
function registerGlyphs() {
  const H = Art.util;
  const ell = H.ell, path = H.path, stroke = H.stroke, curve = H.curve;
  const G = Art.glyph;
  if (!Art.glyphs.bow) G('bow', function (g) {
    curve(g, -6, -11, 9, 0, -6, 11, '#a07840', 2.4);
    stroke(g, [[-6, -11], [-2, 0], [-6, 11]], '#e8dcb0', 1);
    stroke(g, [[-2, 0], [11, 0]], '#c8a868', 1.6);
    path(g, [[11, 0], [7, -2.4], [7, 2.4]], '#d8dce0', '#7a7e82', 0.7);
  });
  if (!Art.glyphs.arrow) G('arrow', function (g) {
    stroke(g, [[-10, 6], [7, -6]], '#a07840', 1.8);
    path(g, [[7, -6], [11, -10], [5, -8]], '#d8dce0', '#7a7e82', 0.7);
    path(g, [[-10, 6], [-12, 1], [-7, 3]], '#f0e8d8');
    path(g, [[-10, 6], [-5, 8], [-7, 3]], '#d8d0c0');
  });
  if (!Art.glyphs.block) G('block', function (g) {
    path(g, [[0, -11], [9, -7], [9, 3], [0, 11], [-9, 3], [-9, -7]], '#4a6a8a', '#2e4a6a', 1.2);
    path(g, [[0, -8], [6, -5], [6, 2], [0, 8], [-6, 2], [-6, -5]], '#5a7a9a', '#2e4a6a', 0.7);
    stroke(g, [[-4, 0], [-1, 4], [5, -4]], '#bfe4f5', 2);
  });
  if (!Art.glyphs.cycle) G('cycle', function (g) {
    g.strokeStyle = '#f3cf7a'; g.lineWidth = 2.2; g.lineCap = 'round';
    g.beginPath(); g.arc(0, 0, 8, 0.5, Math.PI * 1.55); g.stroke();
    path(g, [[5, -8], [11, -5], [5, -1]], '#f3cf7a');
    ell(g, 0, 0, 2.4, 2.4, '#f3cf7a');
  });
  if (!Art.glyphs.ammo) G('ammo', function (g) {
    for (let i = -1; i <= 1; i++) {
      g.save(); g.translate(i * 5, 0); g.rotate(0.2);
      stroke(g, [[0, 9], [0, -6]], '#a07840', 1.5);
      path(g, [[0, -6], [2, -10], [-2, -10]], '#d8dce0');
      path(g, [[0, 9], [-2.4, 5], [0, 6]], '#f0e8d8');
      g.restore();
    }
  });
  if (!Art.glyphs.edit) G('edit', function (g) {
    path(g, [[-9, 6], [-6, 9], [7, -4], [4, -7]], '#c8b898', '#8a7a5a', 1);
    path(g, [[4, -7], [7, -10], [10, -7], [7, -4]], '#d9a441', '#a07820', 0.8);
    stroke(g, [[-9, 6], [-11, 11], [-6, 9]], '#8a7a5a', 1.2);
  });
  if (!Art.glyphs.move) G('move', function (g) {
    stroke(g, [[0, -11], [0, 11]], '#bfe4f5', 2);
    stroke(g, [[-11, 0], [11, 0]], '#bfe4f5', 2);
    path(g, [[0, -11], [-3, -7], [3, -7]], '#bfe4f5');
    path(g, [[0, 11], [-3, 7], [3, 7]], '#bfe4f5');
    path(g, [[-11, 0], [-7, -3], [-7, 3]], '#bfe4f5');
    path(g, [[11, 0], [7, -3], [7, 3]], '#bfe4f5');
  });
  if (!Art.glyphs.scale) G('scale', function (g) {
    path(g, [[-10, -10], [-2, -10], [-10, -2]], '#c8b898', '#8a7a5a', 1);
    path(g, [[10, 10], [2, 10], [10, 2]], '#f3cf7a', '#a07820', 1);
    stroke(g, [[-7, -7], [7, 7]], '#d9a441', 1.6);
  });
  if (!Art.glyphs.opacity) G('opacity', function (g) {
    ell(g, 0, 0, 9, 9, '#5aa7e0', '#2e6f9e', 1.2);
    g.save(); g.beginPath(); g.arc(0, 0, 9, 0, Math.PI * 2); g.clip();
    g.fillStyle = '#0d0a06'; g.fillRect(0, -10, 10, 20); g.restore();
    ell(g, 0, 0, 9, 9, null, '#2e6f9e', 1.2);
  });
  if (!Art.glyphs.swap) G('swap', function (g) {
    stroke(g, [[-9, -4], [7, -4]], '#bfe4f5', 2);
    path(g, [[7, -4], [3, -8], [3, 0]], '#bfe4f5');
    stroke(g, [[9, 5], [-7, 5]], '#f3cf7a', 2);
    path(g, [[-7, 5], [-3, 1], [-3, 9]], '#f3cf7a');
  });
  if (!Art.glyphs.reset) G('reset', function (g) {
    g.strokeStyle = '#e0a040'; g.lineWidth = 2.4; g.lineCap = 'round';
    g.beginPath(); g.arc(0, 1, 8, Math.PI * 0.85, Math.PI * 2.35); g.stroke();
    path(g, [[-8, -6], [-2, -7], [-6, -1]], '#e0a040');
  });
  if (!Art.glyphs.eye) G('eye', function (g) {
    path(g, [[-11, 0], [-4, -6], [4, -6], [11, 0], [4, 6], [-4, 6]], '#e8dcc0', '#a89870', 1);
    ell(g, 0, 0, 4, 4, '#5aa7e0', '#2e6f9e', 0.8);
    ell(g, 0, 0, 1.8, 1.8, '#0d0a06');
  });
  if (!Art.glyphs.role_water) G('role_water', function (g) { Art.glyphs.water(g); });
  if (!Art.glyphs.role_haul) G('role_haul', function (g) { Art.glyphs.bag(g); });
  if (!Art.glyphs.level) G('level', function (g) {
    path(g, [[0, -11], [3, -3], [11, -3], [5, 3], [7, 11], [0, 6], [-7, 11], [-5, 3], [-11, -3], [-3, -3]], '#f3cf7a', '#a07820', 1);
    ell(g, 0, 0, 2.6, 2.6, '#fff4d0');
  });
  if (!Art.glyphs.points) G('points', function (g) {
    ell(g, 0, 0, 9, 9, 'rgba(63,191,111,0.14)', '#3fbf6f', 1.4);
    stroke(g, [[0, -5], [0, 5]], '#8fe08f', 2.4);
    stroke(g, [[-5, 0], [5, 0]], '#8fe08f', 2.4);
  });
  /* --- NUEVOS v4 --- */
  if (!Art.glyphs.repair) G('repair', function (g) {
    g.save(); g.rotate(-0.5);
    stroke(g, [[0, 10], [0, -2]], '#8a6a44', 2.4);
    path(g, [[-4, -2], [4, -2], [3, -7], [-3, -7]], '#a8b0b8', '#6a727a', 0.8);
    g.restore();
    g.save(); g.rotate(0.6);
    stroke(g, [[0, 10], [0, 0]], '#6a6a72', 2.2);
    path(g, [[-3, 0], [3, 0], [2, -5], [0, -3], [-2, -5]], '#6a6a72', '#4a4a52', 0.7);
    g.restore();
    path(g, [[6, -8], [7.4, -5], [10, -4], [7.4, -3], [6, 0], [4.6, -3], [2, -4], [4.6, -5]], '#f3cf7a');
  });
  if (!Art.glyphs.public) G('public', function (g) {
    path(g, [[-11, -4], [0, -11], [11, -4]], '#d8cfae', '#8a8468', 1);
    for (let i = -1; i <= 1; i++) rr2(g, i * 6 - 1.6, -4, 3.2, 11, 0.7, '#e8e0c8', '#8a8468', 0.6);
    rr2(g, -11, 7, 22, 3, 0.8, '#c8c0a0', '#8a8468', 0.7);
    ell(g, 0, -7, 1.6, 1.6, '#e8c040');
  });
  if (!Art.glyphs.saber) G('saber', function (g) {
    path(g, [[-11, -8], [-1, -6], [-1, 9], [-11, 7]], '#e8dcc0', '#a89870', 1);
    path(g, [[11, -8], [1, -6], [1, 9], [11, 7]], '#f4ecd8', '#a89870', 1);
    stroke(g, [[0, -6], [0, 9]], '#8a6a44', 1.6);
    path(g, [[4, -10], [6, -6], [4, -4], [2, -6]], '#f3cf7a', '#a07820', 0.6);
    for (let i = 0; i < 3; i++) stroke(g, [[-8, -3 + i * 3], [-3, -2.4 + i * 3]], '#c8b898', 0.7);
  });
  if (!Art.glyphs.tier) G('tier', function (g) {
    path(g, [[-8, 8], [8, 8], [5, 3], [-5, 3]], '#8a6d3b');
    path(g, [[-6, 1], [6, 1], [4, -4], [-4, -4]], '#b08a4a');
    path(g, [[-4, -6], [4, -6], [2, -11], [-2, -11]], '#d9a441');
  });
  function rr2(g, x, y, w, h, r, f, s, lw) { H.rr(g, x, y, w, h, r, f, s, lw); }
}

/* ==========================================================
2 · CSS DE COMPONENTES, BADGES v4 Y EDITOR
========================================================== */
function injectCSS() {
  const old = document.getElementById('cr-ui-css');
  if (old) old.remove();
  const s = document.createElement('style');
  s.id = 'cr-ui-css';
  s.textContent = [
'.ic{display:inline-block;vertical-align:-3px;pointer-events:none;flex:none}',
'.ic+span,.ic+b{margin-left:5px}',
'#modal-body,.screen-card,#error-text{scrollbar-width:thin;scrollbar-color:#8a6d3b #0d0a06}',
'#modal-body::-webkit-scrollbar,.screen-card::-webkit-scrollbar,#error-text::-webkit-scrollbar,.grid-inv::-webkit-scrollbar{width:9px;height:9px}',
'#modal-body::-webkit-scrollbar-track,.screen-card::-webkit-scrollbar-track,#error-text::-webkit-scrollbar-track{background:#0d0a06;border-radius:6px}',
'#modal-body::-webkit-scrollbar-thumb,.screen-card::-webkit-scrollbar-thumb,#error-text::-webkit-scrollbar-thumb{background:linear-gradient(180deg,#8a6d3b,#5a4520);border-radius:6px;border:2px solid #0d0a06}',
'#modal-body::-webkit-scrollbar-thumb:hover,.screen-card::-webkit-scrollbar-thumb:hover{background:linear-gradient(180deg,#d9a441,#8a6d3b)}',
'.row{display:flex;align-items:center;gap:9px;padding:7px 9px;margin-bottom:5px;background:linear-gradient(90deg,#1a140933,#0d0a0666);border:1px solid #8a6d3b44;border-radius:10px}',
'.row:hover{border-color:#8a6d3b99;background:linear-gradient(90deg,#241a0d55,#0d0a0688)}',
'.row.locked{opacity:.62}',
'.ric{width:32px;height:32px;display:flex;align-items:center;justify-content:center;background:#00000055;border:1px solid #8a6d3b55;border-radius:8px;flex:none}',
'.rmain{flex:1;min-width:0}',
'.rname{color:#efe3c8;font-size:13px;font-weight:600;display:flex;align-items:center;gap:5px;flex-wrap:wrap}',
'.rsub{color:#b3a482;font-size:11px;margin-top:2px;line-height:1.45}',
'.ractions{display:flex;gap:5px;flex-wrap:wrap;justify-content:flex-end;align-items:center;flex:none}',
'.stars{display:inline-flex;gap:1px;align-items:center;margin-left:4px}',
'.price{display:inline-flex;align-items:center;gap:3px;color:#f3cf7a;font-weight:700;font-size:12px;white-space:nowrap}',
'.kv{display:grid;grid-template-columns:repeat(auto-fit,minmax(112px,1fr));gap:7px;margin-bottom:10px}',
'.kv>div{background:#00000040;border:1px solid #8a6d3b55;border-radius:9px;padding:7px 9px}',
'.kv b{display:flex;align-items:center;gap:4px;color:#f3cf7a;font-size:14px;font-family:Georgia,serif;line-height:1.25}',
'.kv span{font-size:10px;color:#b3a482;display:block;margin-top:2px}',
'.chip{display:inline-flex;align-items:center;gap:4px;padding:3px 8px;border-radius:12px;border:1px solid #8a6d3b;font-size:10.5px;margin:0 4px 4px 0;background:#00000040;color:#b3a482}',
'.chip.on{background:#3fbf6f22;border-color:#3fbf6f;color:#bfe9cd}',
'.chip.off{opacity:.5}',
'.chip.warn{background:#c0392b22;border-color:#a3542e;color:#f2c1ba}',
/* --- v4: badges de tier --- */
'.tbadge{display:inline-flex;align-items:center;justify-content:center;padding:1px 7px;border-radius:9px;border:1px solid;font:800 10px/1.5 system-ui,sans-serif;letter-spacing:.04em;margin-right:4px}',
'.tbadge.t1{background:#3fbf6f22;border-color:#3fbf6f;color:#bfe9cd}',
'.tbadge.t2{background:#5aa7e022;border-color:#5aa7e0;color:#bfe4f5}',
'.tbadge.t3{background:#9a5ae022;border-color:#9a5ae0;color:#d8c8f8}',
'.tbadge.off{opacity:.45;filter:grayscale(.7)}',
/* --- v4: objeto roto --- */
'.btag{display:inline-flex;align-items:center;padding:1px 7px;border-radius:9px;border:1px solid #a3542e;background:#c0392b33;color:#f2c1ba;font:800 9.5px/1.5 system-ui,sans-serif;letter-spacing:.08em;text-transform:uppercase;margin-left:4px}',
'.islot.broken{border-color:#a3542e;background:#c0392b26}',
'.islot.broken::after{content:"";position:absolute;inset:0;pointer-events:none;background:linear-gradient(45deg,transparent 44%,rgba(224,75,58,.85) 47%,rgba(224,75,58,.85) 53%,transparent 56%)}',
'.eq.broken{border-color:#a3542e;background:#c0392b26}',
'.eq.broken .en{color:#f2c1ba}',
/* --- v4: taller público --- */
'.pubchip{animation:pubPulse 1.8s ease-in-out infinite}',
'@keyframes pubPulse{0%,100%{box-shadow:0 0 0 0 rgba(217,164,65,0)}50%{box-shadow:0 0 0 4px rgba(217,164,65,.18)}}',
/* --- v4: tarjetas de saber --- */
'.sabers{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:9px}',
'.saber{background:linear-gradient(180deg,#1a140966,#0d0a0688);border:1px solid #8a6d3b55;border-radius:11px;padding:10px 11px}',
'.saber.learned{border-color:#3fbf6f88;box-shadow:0 0 0 1px #3fbf6f22 inset}',
'.saber.locked{opacity:.66}',
'.sbhead{display:flex;align-items:center;gap:7px;margin-bottom:5px}',
'.sbname{flex:1;font-family:Georgia,serif;color:#f3cf7a;font-size:14px}',
'.sbsamples{font-size:10.5px;color:#8a7a5a;margin-top:4px;line-height:1.5}',
'.tabs{display:flex;gap:4px;flex-wrap:wrap;margin:7px 0 9px}',
'.tab{padding:5px 11px;border-radius:8px;border:1px solid #8a6d3b66;background:#00000040;color:#b3a482;font-size:11.5px;cursor:pointer}',
'.tab.on{background:linear-gradient(180deg,#8a6d3b,#5a4520);color:#f3cf7a;border-color:#d9a441}',
'.tab:hover{border-color:#d9a441}',
'.skill{margin-bottom:6px}',
'.skill .sl{display:flex;justify-content:space-between;font-size:11.5px;margin-bottom:3px;color:#b3a482}',
'.skill .st{height:6px;background:#000a;border-radius:4px;overflow:hidden;border:1px solid #0008}',
'.skill .sf{height:100%;background:linear-gradient(90deg,#8a6420,#f3cf7a)}',
'.mapwrap{display:flex;justify-content:center;background:#0a0d08;border:1px solid #8a6d3b;border-radius:10px;padding:7px;margin-bottom:9px}',
'.mapwrap canvas{width:100%;max-width:min(460px,58vh);height:auto;image-rendering:pixelated;border-radius:6px}',
'.legend{display:flex;flex-wrap:wrap;gap:9px;font-size:11px;color:#b3a482}',
'.legend i{display:inline-block;width:9px;height:9px;border-radius:3px;margin-right:4px;vertical-align:-1px}',
'.invwrap{display:grid;grid-template-columns:1fr;gap:11px}',
'.detail{background:#00000040;border:1px solid #8a6d3b55;border-radius:10px;padding:11px;min-height:130px}',
'.detail h4{display:flex;align-items:center;gap:6px;font-family:Georgia,serif;color:#f3cf7a;font-size:15px;margin:0 0 5px}',
'.eqgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(70px,1fr));gap:5px;margin-bottom:9px}',
'.eq{background:#00000040;border:1px solid #8a6d3b55;border-radius:8px;padding:5px 3px;text-align:center;cursor:pointer}',
'.eq:hover{border-color:#d9a441}',
'.eq .ei{display:flex;align-items:center;justify-content:center;height:26px}',
'.eq .en{color:#b3a482;font-size:9px;display:block;margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
'.grid-inv{display:grid;grid-template-columns:repeat(auto-fill,minmax(44px,1fr));gap:5px}',
'.islot{position:relative;aspect-ratio:1;display:flex;align-items:center;justify-content:center;background:#00000055;border:1px solid #8a6d3b44;border-radius:8px;cursor:pointer;padding:0}',
'.islot:hover{border-color:#d9a441;background:#241a0d88}',
'.islot.sel{border-color:#f3cf7a;box-shadow:0 0 0 2px #d9a44155 inset}',
'.islot .n{position:absolute;right:2px;bottom:1px;font-size:9px;font-weight:700;color:#f3cf7a;text-shadow:0 1px 2px #000}',
'.islot .dur{position:absolute;left:3px;right:3px;bottom:2px;height:3px;background:#000a;border-radius:2px;overflow:hidden}',
'.islot .dur i{display:block;height:100%;background:linear-gradient(90deg,#8a6420,#3fbf6f)}',
'.islot .dur i.low{background:linear-gradient(90deg,#8a2418,#e04b3a)}',
'.tw{min-height:42px}',
'.warn,.ok{display:flex;align-items:flex-start;gap:7px;padding:7px 10px;border-radius:8px;font-size:12px;margin-bottom:9px;line-height:1.45}',
'.warn{border:1px solid #a3542e;background:#c0392b22;color:#f2c1ba}',
'.ok{border:1px solid #3fbf6f;background:#3fbf6f18;color:#bfe9cd}',
'.qbar{display:flex;gap:5px;flex-wrap:wrap;margin-top:7px;align-items:center}',
'.seedrow{display:flex;flex-wrap:wrap;gap:5px;margin-top:5px}',
'.prog{height:7px;background:#000a;border:1px solid #0008;border-radius:5px;overflow:hidden;margin-top:5px}',
'.prog i{display:block;height:100%;background:linear-gradient(90deg,#8a6420,#f3cf7a)}',
'#modal-title{display:flex;align-items:center;gap:8px}',
'#hud-gold,#hud-debt,#mount-name,#boss-name,#clock-icon,#clock-weather,#hud-level,#ammo-badge{display:inline-flex;align-items:center;gap:4px}',
'#hud-level{cursor:pointer}#hud-level.haspoints{color:#a8e8a0;animation:ptsPulse 1.8s ease-in-out infinite}',
'@keyframes ptsPulse{0%,100%{filter:none}50%{filter:drop-shadow(0 0 6px rgba(143,224,143,.8))}}',
'#ammo-badge{cursor:pointer}#ammo-badge.empty{color:#f2c1ba;border-color:#a3542e}',
'#hint{display:flex;align-items:center;gap:6px}',
'.toast{display:flex;align-items:flex-start;gap:7px}',
'.dlg-choice{display:flex;align-items:center;gap:6px;text-align:left}',
'#dlg-portrait{display:flex;align-items:center;justify-content:center}',
'.qicon{display:flex;align-items:center;justify-content:center;width:100%;height:100%}',
'.sec{display:flex;align-items:center;gap:6px;margin:12px 0 5px;color:#f3cf7a;font-family:Georgia,serif;font-size:13.5px}',
'.muted{color:#b3a482;font-size:11.5px;line-height:1.55}',
'.setcol .field{margin-bottom:8px}',
'.setcol .check{padding:4px 2px;font-size:12px}',
'.orient-ok{color:#a8e8a0}.orient-bad{color:#f2c1ba}',
'.branches{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:8px}',
'.branch{background:linear-gradient(180deg,#1a140966,#0d0a0688);border:1px solid #8a6d3b55;border-radius:11px;padding:9px 10px}',
'.branch.max{border-color:#d9a44199;box-shadow:0 0 0 1px #d9a44133 inset}',
'.bhead{display:flex;align-items:center;gap:7px;margin-bottom:5px}',
'.bname{flex:1;font-family:Georgia,serif;color:#f3cf7a;font-size:14px}',
'.bpips{display:flex;gap:2px;margin:5px 0}',
'.bpips i{width:100%;height:5px;border-radius:2px;background:#0009;border:1px solid #0007}',
'.bpips i.on{background:linear-gradient(90deg,#8a6420,#f3cf7a);border-color:#a0782066}',
'.bunlock{font-size:10.5px;color:#8fe08f;margin-top:4px;display:flex;align-items:flex-start;gap:4px}',
'.bnext{font-size:10.5px;color:#8a7a5a;margin-top:3px}',
'#ctl-editor{position:fixed;left:50%;top:8px;transform:translateX(-50%);z-index:120;display:flex;align-items:center;gap:10px;',
'padding:8px 12px;border-radius:14px;border:1px solid #d9a441;background:linear-gradient(180deg,rgba(36,26,13,.97),rgba(9,10,7,.98));',
'box-shadow:0 20px 50px -20px #000,0 0 0 1px rgba(0,0,0,.6);max-width:min(96vw,880px);flex-wrap:wrap;justify-content:center}',
'#ctl-editor .ce-f{display:flex;align-items:center;gap:6px;font:600 10.5px/1 system-ui,sans-serif;letter-spacing:.12em;text-transform:uppercase;color:#b3a482}',
'#ctl-editor input[type=range]{width:96px}',
'#ctl-editor .ce-v{font:700 11px/1 ui-monospace,monospace;color:#f3cf7a;min-width:34px;text-align:right}',
'body.ctl-edit #hud{pointer-events:auto}',
'body.ctl-edit .hud-tl,body.ctl-edit .hud-tc,body.ctl-edit .hud-tr,body.ctl-edit .hud-bl,body.ctl-edit .hud-br,body.ctl-edit .hud-bc{',
'outline:2px dashed rgba(217,164,65,.75);outline-offset:6px;border-radius:14px;cursor:grab;touch-action:none}',
'body.ctl-edit .dragging{outline-color:#f3cf7a;cursor:grabbing}',
'body.ctl-edit #hud button,body.ctl-edit #hud .qslot{pointer-events:none}',
'.ctl-tag{position:absolute;left:50%;top:-22px;transform:translateX(-50%);font:700 9px/1 system-ui;letter-spacing:.14em;',
'text-transform:uppercase;color:#0d0a06;background:#d9a441;padding:3px 7px;border-radius:6px;white-space:nowrap;display:none;z-index:2}',
'body.ctl-edit .ctl-tag{display:block}',
'body.ctl-nolabels .abtn .al,body.ctl-nolabels .abtn .ak,body.ctl-nolabels .qk{display:none}',
'@media (orientation:landscape) and (min-width:520px){.invwrap{grid-template-columns:1.25fr 1fr}}',
'@media (max-height:430px){',
'.row{padding:6px 8px;gap:8px}.ric{width:29px;height:29px}.rname{font-size:12.5px}.rsub{font-size:10.5px}',
'.kv{gap:6px;margin-bottom:8px}.kv>div{padding:5px 8px}.kv b{font-size:13px}',
'.chip{padding:2px 7px;font-size:10px}.tab{padding:4px 9px;font-size:11px}',
'.sec{margin:9px 0 4px;font-size:12.5px}.detail{padding:9px;min-height:110px}',
'.grid-inv{grid-template-columns:repeat(auto-fill,minmax(38px,1fr));gap:4px}',
'.eqgrid{grid-template-columns:repeat(auto-fill,minmax(62px,1fr));gap:4px}',
'.eq .ei{height:22px}.eq .en{font-size:8.5px}',
'.mapwrap canvas{max-width:min(400px,52vh)}',
'.branches,.sabers{grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:6px}',
'.branch,.saber{padding:7px 8px}.bname,.sbname{font-size:13px}',
'#ctl-editor{padding:6px 10px;gap:8px}#ctl-editor input[type=range]{width:76px}',
'}',
'@media (max-height:360px){.kv{grid-template-columns:repeat(auto-fit,minmax(96px,1fr))}.warn,.ok{padding:5px 8px;font-size:11px;margin-bottom:7px}.muted{font-size:11px}}'
  ].join('');
  document.head.appendChild(s);
}

/* ==========================================================
3 · ORIENTACIÓN · el juego es HORIZONTAL
========================================================== */
function isCoarse() { return (window.matchMedia && window.matchMedia('(pointer:coarse)').matches) || ('ontouchstart' in window); }
function isPortrait() { return window.innerHeight > window.innerWidth * 1.02; }
UI.checkOrient = function (force) {
  const need = isCoarse() && isPortrait();
  if (!force && need === UI._portrait) { applyCtl(); return; }
  UI._portrait = need;
  const s = el('screen-rotate');
  if (s) s.hidden = !need;
  document.body.classList.toggle('needs-rotate', need);
  if (need) {
    if (UI._edit) UI.exitCtlEdit();
    CR.Input.enabled = false; CR.Input.clearAll();
    const k = el('joy-knob'); if (k) k.style.transform = 'translate(0,0)';
    const z = el('joy-zone'); if (z) z.classList.remove('active');
    if (CR.Game && CR.Game.state === 'playing') Bus.emit('ui:pause');
  } else { UI.syncInput(); applyCtl(); }
  if (UI.local === 'settings') UI.renderLocal();
};
UI.enterFullscreen = function () {
  const d = document.documentElement;
  const rq = d.requestFullscreen || d.webkitRequestFullscreen || d.msRequestFullscreen;
  const lock = function () {
    try {
      if (window.screen && screen.orientation && typeof screen.orientation.lock === 'function') {
        const p = screen.orientation.lock('landscape');
        if (p && p.catch) p.catch(function () {});
      }
    } catch (e) {}
    setTimeout(function () { UI.checkOrient(true); R.resize(); }, 280);
  };
  if (rq) { try { const p = rq.call(d); if (p && p.then) p.then(lock).catch(lock); else lock(); } catch (e) { lock(); } }
  else lock();
  A.play('click');
};
function initOrientation() {
  const btn = el('btn-rotate-full');
  if (btn) CR.Bindings.add(btn, 'click', function () { UI.enterFullscreen(); }, false, 'ui');
  const ping = function () { clearTimeout(UI._orT); UI._orT = setTimeout(function () { UI.checkOrient(false); }, 130); };
  CR.Bindings.add(window, 'resize', ping, false, 'ui');
  CR.Bindings.add(window, 'orientationchange', function () {
    clearTimeout(UI._orT); UI._orT = setTimeout(function () { UI.checkOrient(true); }, 240);
  }, false, 'ui');
  if (window.screen && screen.orientation && screen.orientation.addEventListener) CR.Bindings.add(screen.orientation, 'change', ping, false, 'ui');
  UI.checkOrient(true);
}

/* ==========================================================
4 · PANTALLAS, CARGA Y ERROR (v4: incluye screen-intro)
========================================================== */
const SCREENS = ['screen-loading', 'screen-title', 'screen-create', 'screen-intro', 'screen-pause', 'screen-ko', 'screen-error'];
UI.showScreen = function (id) {
  for (let i = 0; i < SCREENS.length; i++) { const s = el(SCREENS[i]); if (s) s.classList.toggle('active', SCREENS[i] === id); }
};
UI.hideScreens = function () {
  for (let i = 0; i < SCREENS.length; i++) { const s = el(SCREENS[i]); if (s) s.classList.remove('active'); }
};
UI.setLoad = function (p, label) {
  const f = el('load-bar-fill'), st = el('load-status');
  if (f) f.style.width = Math.round(U.clamp(p, 0, 1) * 100) + '%';
  if (st && label) st.textContent = clean(label);
};
UI.showError = function (msg) {
  const t = el('error-text');
  if (t) t.textContent = String(msg || 'Error desconocido');
  UI.showScreen('screen-error');
};

/* ==========================================================
5 · TOASTS Y BANNER
========================================================== */
const TOAST_IC = { good: 'check', bad: 'warning', gold: 'coin' };
UI.toast = function (msg, cls) {
  const box = el('toasts');
  if (!box) return;
  const txt = clean(msg);
  if (!txt) return;
  while (UI._toasts.length >= 4) { const o = UI._toasts.shift(); if (o.node.parentNode) o.node.parentNode.removeChild(o.node); }
  const d = document.createElement('div');
  d.className = 'toast ' + (cls || '');
  d.innerHTML = (TOAST_IC[cls] ? uiimg(TOAST_IC[cls], 14) : '') + '<span>' + esc(txt) + '</span>';
  box.appendChild(d);
  UI._toasts.push({ node: d, t: 0, life: 3.2 });
};
UI.banner = function (title, sub) {
  const b = el('banner');
  if (!b) return;
  const t = el('banner-title'), s2 = el('banner-sub');
  if (t) t.textContent = clean(title);
  if (s2) s2.textContent = clean(sub || '');
  b.classList.add('show');
  UI._banner = 2.8;
};

/* ==========================================================
6 · HUD (v4: el nivel muestra también puntos de receta)
========================================================== */
function setText(node, v) { if (node && node._cv !== v) { node._cv = v; node.textContent = v; } }
function setWidth(node, v) { if (node && node._cw !== v) { node._cw = v; node.style.width = v; } }
function setBar(fill, txt, v, max) {
  setWidth(el(fill), U.clamp(v / Math.max(1, max), 0, 1) * 100 + '%');
  if (txt) setText(el(txt), Math.max(0, Math.round(v)) + '/' + Math.round(max));
}
function iconSlot(id, key, size) {
  const n = el(id);
  if (!n) return null;
  if (n._ik !== key) { n._ik = key; n.innerHTML = Art.html(key, size) + '<span class="v"></span>'; }
  return n.querySelector('.v');
}
function setIconVal(id, key, size, text) { const v = iconSlot(id, key, size); if (v) setText(v, text); }
function setOnlyIcon(id, key, size) {
  const n = el(id);
  if (!n) return;
  if (n._ik !== key) { n._ik = key; n.innerHTML = key ? Art.html(key, size) : ''; }
}
UI.refreshHUD = function () {
  const p = E.player;
  if (!p) return;
  setBar('bar-hp-fill', 'val-hp', p.st.hp, p.st.maxHp);
  setBar('bar-st-fill', 'val-st', p.st.st, p.st.maxSt);
  setBar('bar-food-fill', 'val-food', p.st.food, p.st.maxFood);
  setText(el('hud-name'), p.name);
  const collar = el('hud-collar');
  if (collar) { collar.hidden = p.free; if (!collar._ik) { collar._ik = 1; collar.innerHTML = Art.html('ui:slave', 12); } }
  setText(el('hud-title'), p.free ? W.title().name : 'Esclavo de Bareth');
  setIconVal('hud-gold', 'ui:coin', 13, U.fmt(p.gold));
  const dw = el('debt-wrap');
  if (dw) dw.hidden = p.free;
  setIconVal('hud-debt', 'ui:debt', 12, U.fmt(p.debt));
  /* Nivel + puntos de habilidad + puntos de receta (v4) */
  const lv = el('hud-level');
  if (lv) {
    const pts = p.lvl.points, rp = p.lvl.rp || 0;
    let txt = 'Nv ' + p.lvl.level;
    if (pts > 0) txt += ' · ' + pts;
    if (rp > 0) txt += ' · ' + rp + ' rec';
    setIconVal('hud-level', (pts > 0 || rp > 0) ? 'ui:points' : 'ui:level', 13, txt);
    lv.classList.toggle('haspoints', pts > 0 || rp > 0);
  }
  const T = CR.Time;
  setText(el('clock-time'), String(T.hour).padStart(2, '0') + ':' + String(T.minute).padStart(2, '0'));
  setText(el('clock-day'), 'Día ' + T.day + ' · ' + W.biomeName(Math.floor(p.t.x), Math.floor(p.t.y)));
  setOnlyIcon('clock-icon', T.night > 0.5 ? 'ui:moon' : T.night > 0.15 ? 'ui:dusk' : 'ui:sun', 15);
  setOnlyIcon('clock-weather', T.weather === 'rain' ? 'ui:rain' : T.weather === 'wind' ? 'ui:wind' : null, 13);
  const v = el('fx-vignette');
  if (v) v.classList.toggle('lowhp', p.st.hp / p.st.maxHp < 0.28);
  const mw = el('mount-wrap');
  if (mw) {
    if (p.mount) {
      mw.hidden = false;
      setIconVal('mount-name', p.mount.tg.flying ? 'ui:fly' : 'ui:horse', 13, p.mount.name);
      setWidth(el('bar-mount-fill'), U.clamp(p.mount.st.st / p.mount.st.maxSt, 0, 1) * 100 + '%');
    } else mw.hidden = true;
  }
  const ab = el('ammo-badge');
  if (ab) {
    const am = E.ammoInfo(p);
    if (p.isBow && am) {
      ab.hidden = false;
      setIconVal('ammo-badge', itemKey(am.id), 15, String(am.n));
      ab.classList.toggle('empty', am.n <= 0);
    } else if (p.isBow) {
      ab.hidden = false;
      setIconVal('ammo-badge', 'ui:ammo', 15, '0');
      ab.classList.add('empty');
    } else ab.hidden = true;
  }
  let boss = null, bd = 26 * 26;
  for (let i = 0; i < E.list.length; i++) {
    const e = E.list[i];
    if (e.tg.dead || !e.tg.boss) continue;
    const d = U.dist2(p.t.x, p.t.y, e.t.x, e.t.y);
    if (d < bd) { bd = d; boss = e; }
  }
  const bb = el('boss-bar');
  if (bb) {
    if (boss) {
      bb.hidden = false;
      setIconVal('boss-name', 'sp:' + boss.species, 16, boss.name);
      setWidth(el('boss-fill'), U.clamp(boss.st.hp / boss.st.maxHp, 0, 1) * 100 + '%');
    } else bb.hidden = true;
  }
  const sp = el('btn-sprint');
  if (sp) sp.classList.toggle('on', CR.Input.isHeld('sprint'));
  const bl = el('btn-block');
  if (bl) {
    bl.classList.toggle('on', !!(p.blk && p.blk.on));
    bl.classList.toggle('parry', !!(p.blk && p.blk.on && p.blk.t <= (p.parryWindow || 0.2)));
    bl.classList.toggle('noshield', !p.shield);
  }
  const dis = !CR.Input.enabled;
  ['btn-attack', 'btn-interact', 'btn-roll', 'btn-mount', 'btn-block', 'btn-ammo', 'btn-cycle'].forEach(function (id) {
    const n = el(id); if (n) n.classList.toggle('dim', dis);
  });
};
UI.refreshQuickbar = function () {
  const p = E.player;
  if (!p) return;
  let qs = UI._qs;
  if (!qs || !qs.length || !qs[0].node.isConnected) {
    qs = UI._qs = [];
    const slots = document.querySelectorAll('#quickbar .qslot');
    for (let i = 0; i < slots.length; i++) qs.push({ node: slots[i], ic: slots[i].querySelector('.qicon'), ct: slots[i].querySelector('.qcount') });
  }
  for (let i = 0; i < qs.length; i++) {
    const q = qs[i], id = p.quick[i];
    const def = id ? itemDef(id) : null;
    if (!def) {
      if (q.ic && q.ic._ik !== '') { q.ic._ik = ''; q.ic.innerHTML = ''; }
      setText(q.ct, '');
      q.node.classList.add('empty');
      continue;
    }
    const key = itemKey(id);
    if (q.ic && q.ic._ik !== key) { q.ic._ik = key; q.ic.innerHTML = Art.html(key, 24); }
    const n = E.Inv.count(p, id);
    setText(q.ct, def.stack > 1 ? String(n || '') : '');
    q.node.classList.toggle('empty', n === 0 && def.stack > 1);
    if (q.node._t !== def.name) { q.node._t = def.name; q.node.title = def.name; }
  }
};
UI.setHint = function (h) {
  const n = el('hint'), lb = el('interact-label');
  if (!h) { if (n) n.hidden = true; if (lb) lb.textContent = 'Usar'; return; }
  const label = clean(h.label);
  if (n) {
    n.hidden = false;
    if (n._h !== label) { n._h = label; n.innerHTML = uiimg('interact', 14) + '<span>' + esc(label) + '</span>'; }
  }
  if (lb) lb.textContent = label.length > 10 ? label.slice(0, 9) + '…' : label;
};

/* ==========================================================
7 · LAYOUT DE CONTROLES + EDITOR EN VIVO
========================================================== */
const CTL_GROUPS = [
  ['hud-tl', 'plate', 'Estado'], ['hud-tc', 'menu', 'Herramientas'], ['hud-tr', 'map', 'Mapa y reloj'],
  ['hud-bl', 'joy', 'Movimiento'], ['hud-br', 'acts', 'Acciones'], ['hud-bc', 'quick', 'Barra rápida']
];
/* Escala base según la pantalla real: en un celular horizontal (~360 px de alto)
   los controles se reducen; en tablets/PC crecen un poco. El ajuste del usuario se multiplica encima. */
function viewScale() {
  const vw = window.innerWidth || 800, vh = window.innerHeight || 400;
  return Math.max(0.6, Math.min(1.3, Math.min(vh / 430, vw / 860)));
}
function applyCtl() {
  const c = CR.Settings.values.ctl;
  for (let i = 0; i < CTL_GROUPS.length; i++) {
    const id = CTL_GROUPS[i][0], key = CTL_GROUPS[i][1];
    const n = el(id);
    if (!n) continue;
    let x = c[key].x, y = c[key].y;
    if (c.swap && (key === 'joy' || key === 'acts')) x = 100 - x;
    n.style.left = x + '%';
    n.style.top = y + '%';
    n.style.transform = 'translate(-50%,-50%)';
    n.style.opacity = String(c.opacity);
  }
  document.documentElement.style.setProperty('--ctl-scale', (c.scale * viewScale()).toFixed(3));
  document.body.classList.toggle('ctl-nolabels', !c.labels);
  requestAnimationFrame(clampGroups);
}
UI.applyCtl = applyCtl;
function clampGroups() {
  const vw = window.innerWidth, vh = window.innerHeight;
  for (let i = 0; i < CTL_GROUPS.length; i++) {
    const n = el(CTL_GROUPS[i][0]);
    if (!n || n.offsetParent === null) continue;
    const r = n.getBoundingClientRect();
    let dx = 0, dy = 0;
    if (r.left < 6) dx = 6 - r.left;
    else if (r.right > vw - 6) dx = (vw - 6) - r.right;
    if (r.top < 6) dy = 6 - r.top;
    else if (r.bottom > vh - 6) dy = (vh - 6) - r.bottom;
    if (dx || dy) n.style.transform = 'translate(calc(-50% + ' + dx.toFixed(1) + 'px), calc(-50% + ' + dy.toFixed(1) + 'px))';
  }
}
function ensureTags() {
  for (let i = 0; i < CTL_GROUPS.length; i++) {
    const n = el(CTL_GROUPS[i][0]);
    if (!n || n.querySelector('.ctl-tag')) continue;
    const t = document.createElement('span');
    t.className = 'ctl-tag';
    t.textContent = CTL_GROUPS[i][2];
    n.appendChild(t);
  }
}
function buildEditor() {
  if (UI._editor) return UI._editor;
  const d = document.createElement('div');
  d.id = 'ctl-editor';
  d.hidden = true;
  const c = CR.Settings.values.ctl;
  d.innerHTML =
    '<span class="ce-f">' + uiimg('move', 14) + 'Arrastra los grupos</span>' +
    '<span class="ce-f">' + uiimg('scale', 13) + 'Tamaño<input type="range" id="ce-scale" min="80" max="200" value="' + Math.round(c.scale * 100) + '"><span class="ce-v" id="ce-scale-v">' + Math.round(c.scale * 100) + '%</span></span>' +
    '<span class="ce-f">' + uiimg('opacity', 13) + 'Opacidad<input type="range" id="ce-op" min="35" max="100" value="' + Math.round(c.opacity * 100) + '"><span class="ce-v" id="ce-op-v">' + Math.round(c.opacity * 100) + '%</span></span>' +
    '<button class="btn small" id="ce-swap">' + uiimg('swap', 13) + '<span>Mano</span></button>' +
    '<button class="btn small" id="ce-labels">' + uiimg('book', 13) + '<span>Etiquetas</span></button>' +
    '<button class="btn small" id="ce-reset">' + uiimg('reset', 13) + '<span>Restablecer</span></button>' +
    '<button class="btn small primary" id="ce-done">' + uiimg('check', 13) + '<span>Listo</span></button>';
  document.body.appendChild(d);
  UI._editor = d;
  CR.Bindings.add(d.querySelector('#ce-scale'), 'input', function (e) {
    const v = U.clamp(parseInt(e.target.value, 10) / 100, 0.8, 2);
    CR.Settings.setCtl({ scale: v });
    d.querySelector('#ce-scale-v').textContent = Math.round(v * 100) + '%';
  }, false, 'ui');
  CR.Bindings.add(d.querySelector('#ce-op'), 'input', function (e) {
    const v = U.clamp(parseInt(e.target.value, 10) / 100, 0.35, 1);
    CR.Settings.setCtl({ opacity: v });
    d.querySelector('#ce-op-v').textContent = Math.round(v * 100) + '%';
  }, false, 'ui');
  CR.Bindings.add(d.querySelector('#ce-swap'), 'click', function () {
    CR.Settings.setCtl({ swap: !CR.Settings.values.ctl.swap }); A.play('click');
    UI.toast(CR.Settings.values.ctl.swap ? 'Controles para mano izquierda.' : 'Controles para mano derecha.', 'good');
  }, false, 'ui');
  CR.Bindings.add(d.querySelector('#ce-labels'), 'click', function () {
    CR.Settings.setCtl({ labels: !CR.Settings.values.ctl.labels }); A.play('click');
  }, false, 'ui');
  CR.Bindings.add(d.querySelector('#ce-reset'), 'click', function () {
    CR.Settings.resetCtl(); syncEditor(); A.play('close'); UI.toast('Controles restablecidos.', 'good');
  }, false, 'ui');
  CR.Bindings.add(d.querySelector('#ce-done'), 'click', function () { UI.exitCtlEdit(); }, false, 'ui');
  return d;
}
function syncEditor() {
  const d = UI._editor;
  if (!d) return;
  const c = CR.Settings.values.ctl;
  d.querySelector('#ce-scale').value = Math.round(c.scale * 100);
  d.querySelector('#ce-scale-v').textContent = Math.round(c.scale * 100) + '%';
  d.querySelector('#ce-op').value = Math.round(c.opacity * 100);
  d.querySelector('#ce-op-v').textContent = Math.round(c.opacity * 100) + '%';
  d.querySelector('#ce-swap').classList.toggle('primary', c.swap);
  d.querySelector('#ce-labels').classList.toggle('primary', c.labels);
}
UI.enterCtlEdit = function () {
  if (!E.player || UI._portrait) { UI.toast('Entra en la partida para editar los controles.', 'bad'); return; }
  if (S.panel) S.closePanel();
  if (UI.local) { UI.local = null; const m = el('modal'); if (m) m.hidden = true; }
  if (S.dialog) S.closeDialog();
  UI._edit = true;
  ensureTags();
  const d = buildEditor();
  d.hidden = false;
  syncEditor();
  document.body.classList.add('ctl-edit');
  CR.Input.enabled = false; CR.Input.clearAll();
  const k = el('joy-knob'); if (k) k.style.transform = 'translate(0,0)';
  Bus.emit('ui:gate');
  A.play('open');
  applyCtl();
  UI.toast('Arrastra cada grupo a donde te resulte cómodo. Los cambios se guardan al soltar.', '');
};
UI.exitCtlEdit = function () {
  if (!UI._edit) return;
  UI._edit = false;
  document.body.classList.remove('ctl-edit');
  if (UI._editor) UI._editor.hidden = true;
  CR.Settings.setCtl({});
  A.play('close');
  UI.syncInput();
  applyCtl();
};
function initCtlDrag() {
  for (let i = 0; i < CTL_GROUPS.length; i++) {
    (function (id, key) {
      const n = el(id);
      if (!n) return;
      let pid = null, sx = 0, sy = 0, ox = 0, oy = 0;
      CR.Bindings.add(n, 'pointerdown', function (e) {
        if (!UI._edit) return;
        e.preventDefault(); e.stopPropagation();
        pid = e.pointerId;
        try { n.setPointerCapture(pid); } catch (err) {}
        const c = CR.Settings.values.ctl;
        sx = e.clientX; sy = e.clientY;
        ox = c[key].x; oy = c[key].y;
        if (c.swap && (key === 'joy' || key === 'acts')) ox = 100 - ox;
        n.classList.add('dragging');
      }, false, 'ui');
      CR.Bindings.add(n, 'pointermove', function (e) {
        if (pid !== e.pointerId) return;
        e.preventDefault();
        let nx = U.clamp(ox + (e.clientX - sx) / window.innerWidth * 100, 3, 97);
        const ny = U.clamp(oy + (e.clientY - sy) / window.innerHeight * 100, 3, 97);
        const c = CR.Settings.values.ctl;
        if (c.swap && (key === 'joy' || key === 'acts')) nx = 100 - nx;
        c[key].x = nx; c[key].y = ny;
        applyCtl();
      }, false, 'ui');
      const up = function (e) {
        if (pid !== e.pointerId) return;
        pid = null;
        n.classList.remove('dragging');
        CR.Settings.setCtl({});
      };
      CR.Bindings.add(n, 'pointerup', up, false, 'ui');
      CR.Bindings.add(n, 'pointercancel', up, false, 'ui');
    })(CTL_GROUPS[i][0], CTL_GROUPS[i][1]);
  }
}

/* ==========================================================
8 · JOYSTICK ANALÓGICO
========================================================== */
function initJoystick() {
  const zone = el('joy-zone'), base = el('joy-base'), knob = el('joy-knob');
  if (!zone || !base || !knob) return;
  let jid = null, cx = 0, cy = 0, rad = 1;
  function place(e) {
    const dx = e.clientX - cx, dy = e.clientY - cy;
    const l = U.len(dx, dy) || 1;
    const cl = Math.min(l, rad);
    const nx = dx / l, ny = dy / l;
    knob.style.transform = 'translate(' + (nx * cl) + 'px,' + (ny * cl) + 'px)';
    CR.Input.setJoy(nx * cl / rad, ny * cl / rad);
  }
  CR.Bindings.add(zone, 'pointerdown', function (e) {
    if (UI._edit || jid !== null || !CR.Input.enabled || UI._portrait) return;
    jid = e.pointerId;
    try { zone.setPointerCapture(e.pointerId); } catch (err) {}
    const r = base.getBoundingClientRect();
    cx = r.left + r.width / 2; cy = r.top + r.height / 2; rad = Math.max(18, r.width / 2 - 10);
    zone.classList.add('active');
    place(e);
    e.preventDefault();
  }, false, 'ui');
  CR.Bindings.add(zone, 'pointermove', function (e) { if (e.pointerId === jid) { place(e); e.preventDefault(); } }, false, 'ui');
  const end = function (e) {
    if (e.pointerId !== jid) return;
    jid = null;
    knob.style.transform = 'translate(0,0)';
    zone.classList.remove('active');
    CR.Input.clearJoy();
  };
  CR.Bindings.add(zone, 'pointerup', end, false, 'ui');
  CR.Bindings.add(zone, 'pointercancel', end, false, 'ui');
  CR.Bindings.add(window, 'blur', function () {
    jid = null; knob.style.transform = 'translate(0,0)'; zone.classList.remove('active');
  }, false, 'ui');
}

/* ==========================================================
9 · BOTONES, MENÚ Y SILENCIO (v4: botón Recetario)
========================================================== */
function bindAction(id, action, hold) {
  const n = el(id);
  if (!n) return;
  CR.Bindings.add(n, 'pointerdown', function (e) {
    e.preventDefault();
    if (UI._edit || !CR.Input.enabled || UI._portrait) return;
    n.classList.add('pressed');
    CR.Input.press(action);
    if (hold) CR.Input.setHeld(action, true);
    try { n.setPointerCapture(e.pointerId); } catch (err) {}
  }, false, 'ui');
  const up = function () { n.classList.remove('pressed'); if (hold) CR.Input.setHeld(action, false); };
  CR.Bindings.add(n, 'pointerup', up, false, 'ui');
  CR.Bindings.add(n, 'pointercancel', up, false, 'ui');
  CR.Bindings.add(n, 'pointerleave', up, false, 'ui');
}
function hydrateIcons(root) {
  const list = (root || document).querySelectorAll('[data-ic]');
  for (let i = 0; i < list.length; i++) {
    const n = list[i], k = n.getAttribute('data-ic');
    if (!k || n._ic === k) continue;
    n._ic = k;
    n.innerHTML = Art.html(k, parseInt(n.getAttribute('data-ic-size') || '18', 10));
  }
}
UI.hydrateIcons = hydrateIcons;
function initButtons() {
  bindAction('btn-attack', 'attack', true);
  /* Arco: mantén para tensar, arrastra para apuntar, suelta para disparar */
  (function () {
    const n = el('btn-attack');
    if (!n) return;
    let pid = null, cx = 0, cy = 0;
    CR.Bindings.add(n, 'pointerdown', function (e) {
      pid = e.pointerId;
      const r = n.getBoundingClientRect();
      cx = r.left + r.width / 2; cy = r.top + r.height / 2;
      CR.Input.clearBowAim();
    }, false, 'ui');
    CR.Bindings.add(n, 'pointermove', function (e) {
      if (e.pointerId !== pid || UI._edit || !E.player || !E.player.isBow) return;
      const dx = e.clientX - cx, dy = e.clientY - cy;
      const l = Math.sqrt(dx * dx + dy * dy);
      if (l < 12) return;
      const c = R.screenToWorld ? R.screenToWorld : (CR.Camera && CR.Camera.screenToWorld);
      if (!c) return;
      const w0 = c(0, 0), w1 = c(dx, dy);
      CR.Input.setBowAim(Math.atan2(w1.y - w0.y, w1.x - w0.x), Math.min(1, l / 90));
      e.preventDefault();
    }, false, 'ui');
    const end = function (e) { if (e.pointerId === pid) pid = null; };
    CR.Bindings.add(n, 'pointerup', end, false, 'ui');
    CR.Bindings.add(n, 'pointercancel', end, false, 'ui');
  })();
  bindAction('btn-block', 'block', true);
  bindAction('btn-interact', 'interact', false);
  bindAction('btn-roll', 'roll', false);
  bindAction('btn-mount', 'mount', false);
  bindAction('btn-cycle', 'cycle', false);
  bindAction('btn-ammo', 'ammo', false);
  const sp = el('btn-sprint');
  if (sp) CR.Bindings.add(sp, 'click', function () {
    if (UI._edit || !CR.Input.enabled || UI._portrait) return;
    CR.Input.setHeld('sprint', !CR.Input.isHeld('sprint'));
    sp.classList.toggle('on', CR.Input.isHeld('sprint'));
    A.play('click');
  }, false, 'ui');
  const ab = el('ammo-badge');
  if (ab) CR.Bindings.add(ab, 'click', function () { if (E.player && !UI._edit) E.cycleAmmo(E.player); }, false, 'ui');
  const lv = el('hud-level');
  if (lv) CR.Bindings.add(lv, 'click', function () { UI.openSkills(); }, false, 'ui');
  const qb = document.querySelectorAll('#quickbar .qslot');
  for (let i = 0; i < qb.length; i++) {
    (function (idx, node) {
      CR.Bindings.add(node, 'click', function () {
        if (!E.player || UI._portrait || UI._edit) return;
        S.useQuick(idx);
        node.classList.remove('flash');
        void node.offsetWidth;
        node.classList.add('flash');
        UI.refreshQuickbar();
      }, false, 'ui');
    })(i, qb[i]);
  }
  const menu = { 'btn-inv': 'inventory', 'btn-craft': 'craft', 'btn-map': 'map', 'btn-social': 'social', 'btn-settings': 'settings' };
  Object.keys(menu).forEach(function (id) {
    const n = el(id);
    if (n) CR.Bindings.add(n, 'click', function () { UI.toggleLocal(menu[id]); }, false, 'ui');
  });
  const pb = el('btn-pause');
  if (pb) CR.Bindings.add(pb, 'click', function () { Bus.emit('ui:pause'); }, false, 'ui');
  const sk = el('btn-skills');
  if (sk) CR.Bindings.add(sk, 'click', function () { UI.openSkills(); }, false, 'ui');

  /* Silencio global */
  const hudMenu = el('hud-menu');
  let mute = null;
  if (hudMenu) {
    mute = document.createElement('button');
    mute.className = 'mbtn'; mute.id = 'btn-mute';
    mute.title = 'Silenciar todo'; mute.setAttribute('aria-label', 'Silenciar todo');
    hudMenu.insertBefore(mute, hudMenu.firstChild);
  }
  let tm = null;
  const card = el('screen-title') ? el('screen-title').querySelector('.screen-card') : null;
  if (card) {
    tm = document.createElement('button');
    tm.className = 'titlemute'; tm.id = 'title-mute';
    tm.title = 'Silenciar todo'; tm.setAttribute('aria-label', 'Silenciar todo');
    card.appendChild(tm);
  }
  const syncMute = function () {
    const on = CR.Settings.values.volume > 0.001;
    const k = on ? 'ui:sound_on' : 'ui:sound_off';
    if (mute) mute.innerHTML = Art.html(k, 17);
    if (tm) tm.innerHTML = Art.html(k, 18);
  };
  const toggleMute = function () {
    const v = CR.Settings.values.volume;
    if (v > 0.001) { UI._lastVol = v; CR.Settings.set('volume', 0); }
    else CR.Settings.set('volume', UI._lastVol || 0.8);
    syncMute();
    if (CR.Settings.values.volume > 0) A.play('click');
  };
  if (mute) CR.Bindings.add(mute, 'click', toggleMute, false, 'ui');
  if (tm) CR.Bindings.add(tm, 'click', toggleMute, false, 'ui');
  Bus.on('settings', function (k) { if (k === 'volume') syncMute(); }, 'ui');
  syncMute();

  /* Construcción, Recetario (v4) y editor de controles */
  if (hudMenu) {
    const bb = document.createElement('button');
    bb.className = 'mbtn'; bb.id = 'btn-build';
    bb.title = 'Construir (B)'; bb.setAttribute('aria-label', 'Construir');
    bb.innerHTML = Art.html('ui:build', 17);
    hudMenu.insertBefore(bb, el('btn-settings') || null);
    CR.Bindings.add(bb, 'click', function () { UI.openBuild(); }, false, 'ui');
    const rb = document.createElement('button');
    rb.className = 'mbtn'; rb.id = 'btn-recipes';
    rb.title = 'Recetario y saberes (J)'; rb.setAttribute('aria-label', 'Recetario');
    rb.innerHTML = Art.html('ui:saber', 17);
    hudMenu.insertBefore(rb, el('btn-settings') || null);
    CR.Bindings.add(rb, 'click', function () { UI.openRecipes(); }, false, 'ui');
    const eb = document.createElement('button');
    eb.className = 'mbtn'; eb.id = 'btn-ctl';
    eb.title = 'Editar controles (O)'; eb.setAttribute('aria-label', 'Editar controles');
    eb.innerHTML = Art.html('ui:edit', 17);
    hudMenu.insertBefore(eb, el('btn-settings') || null);
    CR.Bindings.add(eb, 'click', function () { UI.enterCtlEdit(); }, false, 'ui');
  }
}

/* ==========================================================
10 · TECLADO (v4: J = Recetario)
========================================================== */
function initKeys() {
  Bus.on('input:key', function (code, down, repeat) {
    if (!down || repeat) return;
    if (code === 'Escape') { if (UI._edit) { UI.exitCtlEdit(); return; } Bus.emit('ui:escape'); return; }
    if (code === 'F3') { Bus.emit('ui:debug'); return; }
    if (!E.player || UI._portrait || UI._edit) return;
    if (code.indexOf('Digit') === 0) {
      const n = parseInt(code.slice(5), 10);
      if (n >= 1 && n <= 5) { S.useQuick(n - 1); UI.refreshQuickbar(); }
      return;
    }
    if (S.dialog) return;
    if (code === 'KeyI') UI.toggleLocal('inventory');
    else if (code === 'KeyC') UI.toggleLocal('craft');
    else if (code === 'KeyJ') UI.openRecipes();
    else if (code === 'KeyM') UI.toggleLocal('map');
    else if (code === 'KeyR') UI.toggleLocal('social');
    else if (code === 'KeyH') UI.openSkills();
    else if (code === 'KeyB') UI.openBuild();
    else if (code === 'KeyO') UI.enterCtlEdit();
  }, 'ui');
}

/* ==========================================================
11 · DIÁLOGO
========================================================== */
UI.renderDialog = function () {
  const v = S.dialogView();
  const box = el('dialog');
  if (!box) return;
  if (!v) { box.hidden = true; return; }
  box.hidden = false;
  const por = el('dlg-portrait');
  if (por) por.innerHTML = npcimg(v.npcId, 46);
  setText(el('dlg-name'), v.name + ' · ' + clean(v.role));
  const tf = el('dlg-trust-fill');
  if (tf) tf.style.width = ((v.trust + 100) / 2) + '%';
  setText(el('dlg-trust-label'), v.band.name + ' (' + v.trust + ')');
  const t = el('dlg-text');
  if (t) {
    t.classList.add('tw');
    UI._type = { full: clean(v.text), i: 0, node: t, speed: 0.012 };
    t.textContent = '';
  }
  const ch = el('dlg-choices');
  if (ch) {
    let html = '';
    for (let i = 0; i < v.choices.length; i++) html += '<button class="dlg-choice" data-i="' + i + '">' + esc(clean(v.choices[i].t)) + '</button>';
    ch.innerHTML = html;
  }
};
function initDialog() {
  const ch = el('dlg-choices');
  if (ch) CR.Bindings.add(ch, 'click', function (e) {
    const b = e.target.closest('.dlg-choice');
    if (!b) return;
    if (UI._type && UI._type.i < UI._type.full.length) {
      UI._type.node.textContent = UI._type.full;
      UI._type.i = UI._type.full.length;
      return;
    }
    S.choose(parseInt(b.getAttribute('data-i'), 10));
  }, false, 'ui');
  const dt = el('dlg-text');
  if (dt) CR.Bindings.add(dt, 'click', function () {
    if (UI._type) { UI._type.node.textContent = UI._type.full; UI._type.i = UI._type.full.length; }
  }, false, 'ui');
  Bus.on('dialog:open', UI.renderDialog, 'ui');
  Bus.on('dialog:update', UI.renderDialog, 'ui');
  Bus.on('dialog:close', function () { const d = el('dialog'); if (d) d.hidden = true; UI._type = null; }, 'ui');
}

/* ==========================================================
12 · MODAL · infraestructura y helpers de markup
========================================================== */
function row(ic, name, sub, acts, cls) {
  return '<div class="row ' + (cls || '') + '"><div class="ric">' + ic + '</div><div class="rmain"><div class="rname">' + name +
    '</div><div class="rsub">' + (sub || '') + '</div></div><div class="ractions">' + (acts || '') + '</div></div>';
}
function btn(act, label, cls, attrs) {
  return '<button class="btn small ' + (cls || '') + '" data-act="' + act + '" ' + (attrs || '') + '>' + label + '</button>';
}
function btnI(act, key, label, cls, attrs) {
  return btn(act, uiimg(key, 13) + '<span>' + esc(label) + '</span>', cls, attrs);
}
function kv(list) {
  let h = '<div class="kv">';
  for (let i = 0; i < list.length; i++) h += '<div><b>' + list[i][1] + '</b><span>' + list[i][0] + '</span></div>';
  return h + '</div>';
}
function sec(key, title) { return '<div class="sec">' + uiimg(key, 15) + '<span>' + esc(title) + '</span></div>'; }
function warn(txt) { return '<div class="warn">' + uiimg('warning', 15) + '<span>' + txt + '</span></div>'; }
function okbox(txt) { return '<div class="ok">' + uiimg('check', 15) + '<span>' + txt + '</span></div>'; }
function chip(txt, on) { return '<span class="chip ' + (on ? 'on' : 'off') + '">' + txt + '</span>'; }
function openModal(title, html, iconHtml) {
  const mt = el('modal-title');
  if (mt) mt.innerHTML = (iconHtml || '') + '<span>' + esc(clean(title)) + '</span>';
  const body = el('modal-body');
  if (!body) return;
  const sc = body.scrollTop;
  body.innerHTML = html;
  body.scrollTop = sc;
  const m = el('modal');
  if (m) m.hidden = false;
  UI.syncInput();
}
UI.closeModal = function () {
  if (S.panel) { S.closePanel(); return; }
  if (UI.local) {
    UI.local = null;
    const m = el('modal'); if (m) m.hidden = true;
    UI.syncInput(); A.play('close');
    return;
  }
  const m2 = el('modal'); if (m2) m2.hidden = true;
  UI.syncInput();
};
UI.toggleLocal = function (kind) {
  if (!E.player || S.dialog || UI._portrait || UI._edit) return;
  if (S.panel) S.closePanel();
  if (UI.local === kind) { UI.closeModal(); return; }
  UI.local = kind;
  UI.invSel = -1;
  UI.renderLocal();
  A.play('open');
};
UI.syncInput = function () {
  const p = E.player;
  CR.Input.enabled = !!(p && !p.ko && !UI._portrait && !UI._edit && !S.dialog && !S.panel && !UI.local && CR.Game && CR.Game.state === 'playing');
  if (!CR.Input.enabled) {
    CR.Input.clearAll();
    const k = el('joy-knob'); if (k) k.style.transform = 'translate(0,0)';
    const z = el('joy-zone'); if (z) z.classList.remove('active');
  }
  Bus.emit('ui:gate');
};
function refresh() { if (S.panel) UI.renderPanel(); else if (UI.local) UI.renderLocal(); }
const ROLE_IC = { farm: 'role_farm', water: 'role_water', tend: 'role_tend', guard: 'role_guard', follow: 'role_follow', haul: 'role_haul', idle: 'role_idle' };
function roleSelect(roles, uid, cur, disabled) {
  let s = '<select data-act="role" data-uid="' + uid + '"' + (disabled ? ' disabled' : '') + '>';
  for (let k = 0; k < roles.length; k++) s += '<option value="' + roles[k].id + '"' + (roles[k].id === cur ? ' selected' : '') + '>' + esc(clean(roles[k].name)) + '</option>';
  return s + '</select>';
}
function costHTML(cost) {
  const parts = [];
  for (const id in cost) {
    const def = itemDef(id);
    parts.push('<span class="chip">' + iimg(id, 12) + '<span>' + cost[id] + ' ' + esc(def ? def.name : id) + '</span></span>');
  }
  return parts.join('');
}
function stageName(s) { return { baby: 'bebé', child: 'niño', teen: 'joven', adult: 'adulto' }[s] || s; }
function relName(r) { return { none: 'sin relación', dating: 'noviazgo', engaged: 'prometidos', married: 'casados' }[r] || r; }
/* Coste de reparación legible (v4) */
function repairCostHTML(rep) {
  if (!rep) return '';
  const parts = [];
  for (const k in rep.cost) parts.push(rep.cost[k] + '× ' + esc((itemDef(k) || {}).name || k));
  return parts.join(' + ');
}

/* ==========================================================
13 · CRAFTEO v4 · estación + combustible + tier + saber + público
========================================================== */
function craftHTML() {
  const v = S.craftView();
  let h = kv([
    ['Nivel', uiimg('level', 13) + v.level + ' · Tier ' + v.tier],
    ['Combustible', uiimg('fire', 13) + v.fuel],
    ['Puntos de receta', uiimg('saber', 13) + v.rp],
    ['Puntos de rama', uiimg('points', 13) + v.points]
  ]);
  /* Estaciones disponibles y su origen */
  h += '<div>';
  for (let i = 0; i < D.STATIONS.length; i++) {
    const s = D.STATIONS[i], info = D.STATION_INFO[s];
    const src = v.src ? v.src[s] : null;
    const lab = src === 'public' ? 'público' : src === 'merchant' ? 'mercader' : src === 'own' ? 'tuya' : '';
    h += chip(uiimg(v.stations[s] ? (src === 'public' ? 'public' : 'check') : 'cross', 11) +
      '<span>' + esc(info.name) + (lab ? ' · ' + lab : '') + '</span>', !!v.stations[s]);
  }
  h += '</div>';
  /* Talleres públicos con su enfriamiento */
  if (v.publics && v.publics.length) {
    h += '<div class="muted" style="margin:2px 0 6px">' + uiimg('public', 12) + ' En la plaza: ';
    for (let i = 0; i < v.publics.length; i++) {
      const pb = v.publics[i];
      const cd = v.cd && v.cd[pb.station] ? Math.ceil(v.cd[pb.station]) : 0;
      h += '<span class="chip pubchip' + (cd > 0 ? ' warn' : ' on') + '">' + uiimg(pb.glyph || 'public', 11) +
        '<span>' + esc(pb.name) + (cd > 0 ? ' · ' + cd + ' s' : ' · listo') + '</span></span>';
    }
    h += ' Sin calidad y con leña extra.</div>';
  }
  h += '<p class="muted">A mano sale el equipo básico de supervivencia. Las recetas se agrupan en <b>saberes</b> que aprendes en el Recetario (J) y se limitan por <b>Tier</b>: T1 nivel 1-10, T2 11-30, T3 31-40.</p>';
  if (!UI._craftTab) UI._craftTab = 'all';
  const cats = [['all', 'Todo'], ['tool', 'Herramientas'], ['weapon', 'Armas'], ['ammo', 'Flechas'], ['shield', 'Escudos'], ['armor', 'Armaduras'], ['food', 'Comida'], ['heal', 'Curas'], ['misc', 'Otros']];
  h += '<div class="tabs">';
  for (let i = 0; i < cats.length; i++) h += '<button class="tab ' + (UI._craftTab === cats[i][0] ? 'on' : '') + '" data-act="tab" data-tab="' + cats[i][0] + '">' + cats[i][1] + '</button>';
  h += '</div>';
  const MISC = ['material', 'bag', 'saddle', 'petarmor', 'fert', 'feed', 'seed', 'acc', 'legendary', 'animal', 'product', 'unique', 'bed', 'misc'];
  let shown = 0;
  for (let i = 0; i < v.list.length; i++) {
    const r = v.list[i];
    const grp = UI._craftTab === 'all'
      || (UI._craftTab === 'misc' ? MISC.indexOf(r.cat) >= 0
        : UI._craftTab === 'heal' ? (r.cat === 'heal' || r.cat === 'potion')
          : r.cat === UI._craftTab);
    if (!grp) continue;
    shown++;
    /* Cabecera de la fila: nombre + tier + saber + roto/no */
    let name = tbadge(r.tier, r.tierOk) + ictxt(r.name) + (r.n > 1 ? ' ×' + r.n : '');
    if (r.saber) name += ' <span class="chip' + (r.saberOk ? ' on' : ' off') + '">' + uiimg('saber', 10) + '<span>' + esc(r.saberName || r.saber) + '</span></span>';
    let ing = '';
    for (let k = 0; k < r.ing.length; k++) {
      const x = r.ing[k];
      ing += chip(Art.html(ingKey(x), 12) + '<span>' + x.has + '/' + x.need + '</span>', x.has >= x.need);
    }
    ing += chip(uiimg('craft', 11) + '<span>' + esc(r.stationName) + '</span>', r.stationOk);
    if (r.public) ing += '<span class="chip pubchip' + (r.cdOk ? ' on' : ' warn') + '">' + uiimg('public', 11) +
      '<span>' + esc(r.pubName || 'público') + (r.cdOk ? '' : ' · ' + r.cdLeft + ' s') + '</span></span>';
    if (r.fuel > 0) ing += chip(uiimg('fire', 11) + '<span>' + r.fuel + '</span>', r.fuelOk);
    if (r.fee > 0) ing += '<span class="chip warn">' + uiimg('coin', 11) + '<span>taller ' + r.fee + '</span></span>';
    if (!r.reqOk) ing += '<span class="chip warn">' + uiimg('lock', 11) + '<span>' + esc(r.reqText) + '</span></span>';
    if (!r.tierOk) ing += '<span class="chip warn">' + uiimg('tier', 11) + '<span>requiere Tier ' + r.tier + '</span></span>';
    if (!r.saberOk) ing += '<span class="chip warn">' + uiimg('saber', 11) + '<span>aprende ' + esc(r.saberName || r.saber) + ' (J)</span></span>';
    h += row(iimg(r.outId, 24), name, ing,
      btn('craft', 'Fabricar', 'primary', 'data-id="' + r.id + '"' + (r.can ? '' : ' disabled')),
      (r.reqOk && r.tierOk && r.saberOk) ? '' : 'locked');
  }
  if (!shown) h += '<p class="muted">Nada en esta categoría.</p>';
  h += '<div class="qbar">' + btnI('openrecipes', 'saber', 'Abrir Recetario (J)', '') + '</div>';
  return h;
}

/* ==========================================================
13b · RECETARIO v4 · saberes aprendibles con puntos de receta
========================================================== */
function recipesHTML() {
  const v = S.sabersView();
  let h = kv([
    ['Nivel', uiimg('level', 13) + v.level + ' · Tier ' + v.tier],
    ['Puntos de receta', uiimg('saber', 13) + v.points],
    ['Saberes aprendidos', uiimg('check', 13) + v.learnedCount + '/' + v.list.length]
  ]);
  h += '<p class="muted">Cada nivel te da <b>1 punto de receta</b>. Úsalo para aprender un <b>saber</b>: una familia entera de recetas de tu tier. Lo que se hace <b>a mano</b> y la cocina de fogata básica no necesitan saber alguno. Tier 1 = nivel 1-10 · Tier 2 = 11-30 · Tier 3 = 31-40.</p>';
  if (v.points > 0) h += okbox(uiimg('saber', 13) + ' Tienes <b>' + v.points + '</b> punto(s) de receta sin gastar.');
  h += '<div class="sabers">';
  for (let i = 0; i < v.list.length; i++) {
    const sb = v.list[i];
    /* Muestras de recetas del saber para que se vea qué desbloquea */
    const samples = [];
    for (let k = 0; k < D.RECIPES.length && samples.length < 4; k++) {
      const r = D.RECIPES[k];
      if (r.saber === sb.id && D.ITEMS[r.out.id]) samples.push(D.ITEMS[r.out.id].name);
    }
    h += '<div class="saber' + (sb.learned ? ' learned' : (sb.tierOk ? '' : ' locked')) + '">';
    h += '<div class="sbhead">' + uiimg(sb.glyph, 18) + '<span class="sbname">' + esc(sb.name) + '</span>' +
      tbadge(sb.tier, sb.tierOk) +
      (sb.learned ? chip('Aprendido', true) : btnI('learn', 'saber', 'Aprender (1 pto)', 'primary', 'data-id="' + sb.id + '"' + (sb.tierOk && v.points > 0 ? '' : ' disabled'))) +
      '</div>';
    h += '<p class="muted">' + esc(sb.desc) + '</p>';
    h += '<div class="muted">' + sb.inTier + ' recetas en tu tier · ' + sb.recipes + ' en total</div>';
    if (samples.length) h += '<div class="sbsamples">Ej.: ' + samples.map(ictxt).join(' · ') + '</div>';
    if (!sb.tierOk) h += '<div class="bnext">' + uiimg('lock', 11) + ' Saber de Tier ' + sb.tier + ': se desbloquea al subir de nivel.</div>';
    h += '</div>';
  }
  h += '</div>';
  h += sec('craft', 'Ir a fabricar');
  h += '<div class="qbar">' + btnI('opencraft', 'craft', 'Abrir crafteo (C)', 'primary') + '</div>';
  return h;
}
/* ==========================================================
14 · PANELES DE SISTEMA
========================================================== */
UI.renderPanel = function () {
  if (!S.panel) return;
  const t = S.panel.type, d = S.panel.data || {};
  let title = '', h = '', ic = '';

  if (t === 'shop') {
    const v = S.shopView();
    if (!v) return;
    title = v.name;
    ic = v.stall ? uiimg('stall', 20) : npcimg(v.npcId, 20);
    if (!v.open) h += warn('No comercia contigo. Recupera su confianza.');
    h += kv([['Tu oro', uiimg('coin', 13) + U.fmt(v.gold)],
      v.stall ? ['Horario', 'Siempre abierto'] : ['Confianza', S.bandOf(S.trustOf(v.npcId)).name],
      v.stall ? ['Tipo', 'Básicos'] : ['Compra', (v.buys || []).length + ' categorías']]);
    if (v.stall && v.note) h += '<p class="muted">' + ictxt(v.note) + '</p>';
    h += '<div class="tabs"><button class="tab ' + (UI._shopTab !== 'sell' ? 'on' : '') + '" data-act="tab" data-tab="buy">Comprar</button>' +
      '<button class="tab ' + (UI._shopTab === 'sell' ? 'on' : '') + '" data-act="tab" data-tab="sell">Vender</button></div>';
    if (UI._shopTab !== 'sell') {
      if (!v.items.length) h += '<p class="muted">No vende nada.</p>';
      for (let i = 0; i < v.items.length; i++) {
        const it = v.items[i];
        h += row(iimg(it.id, 24), ictxt(it.name), ictxt(it.desc || ''),
          price(it.price) + btn('buy', 'Comprar', 'primary', 'data-id="' + it.id + '"' + (it.canBuy ? '' : ' disabled')) +
          btn('buy5', '×5', '', 'data-id="' + it.id + '"'));
      }
    } else {
      if (!v.sell.length) h += '<p class="muted">' + (v.stall ? 'La bandeja solo compra materiales básicos.' : 'No le interesa nada de lo que llevas.') + '</p>';
      for (let i = 0; i < v.sell.length; i++) {
        const it = v.sell[i];
        h += row(iimg(it.id, 24), ictxt(it.name) + ' ×' + it.n + (it.q ? stars(it.q) : ''), 'Unitario ' + it.price + ' oro',
          btn('sell', 'Vender 1', '', 'data-slot="' + it.slot + '"') +
          btn('sellall', 'Todo (' + (it.price * it.n) + ')', 'primary', 'data-slot="' + it.slot + '"'));
      }
    }

  } else if (t === 'debt') {
    const v = S.debtView();
    title = 'Deuda de libertad'; ic = uiimg('debt', 20);
    if (v.free) h += okbox('Eres libre. Tu cadena se rompió.') + '<p class="muted">Ya puedes comprar tierras, abrir cuenta y formar una familia.</p>';
    else {
      h += kv([['Deuda', uiimg('debt', 13) + U.fmt(v.debt)], ['Oro', uiimg('coin', 13) + U.fmt(v.gold)],
        ['Pagado', Math.round((1 - v.debt / B.DEBT) * 100) + '%']]);
      h += '<div class="prog"><i style="width:' + U.clamp(1 - v.debt / B.DEBT, 0, 1) * 100 + '%"></i></div>';
      h += '<div class="field" style="margin-top:9px"><label>' + uiimg('coin', 12) + 'Cantidad</label><input type="number" id="ui-amt" min="1" max="' + Math.min(v.gold, v.debt) + '" value="' + Math.min(v.gold, v.debt, 100) + '"></div>';
      h += '<div class="qbar">' + btn('pay', 'Pagar', 'primary') + btn('pay100', 'Pagar 100', '') + btn('payall', 'Pagar todo', '') + '</div>';
      h += sec('bag', 'Pagar con objetos (' + Math.round(B.DEBT_ITEM_RATE * 100) + '% del valor)');
      if (!v.items.length) h += '<p class="muted">No llevas nada que entregar.</p>';
      for (let i = 0; i < v.items.length; i++) {
        const it = v.items[i];
        h += row(iimg(it.id, 24), ictxt(it.name) + ' ×' + it.n + (it.q ? stars(it.q) : ''), 'Descuenta ' + it.credit + ' por unidad',
          btn('debtitem', 'Dar 1', '', 'data-slot="' + it.slot + '"') +
          (it.n > 1 ? btn('debtitemall', 'Todo (' + (it.credit * it.n) + ')', 'primary', 'data-slot="' + it.slot + '"') : ''));
      }
    }

  } else if (t === 'bank') {
    const v = S.bankView();
    title = 'Banco del Alba'; ic = uiimg('bank', 20);
    if (v.frozen) h += warn('Silas ha congelado tu cuenta.');
    h += kv([['Oro portable', uiimg('coin', 13) + U.fmt(v.gold)], ['En el banco', uiimg('chest', 13) + U.fmt(v.bank)],
      ['Interés', '0,5% diario (máx ' + v.cap + ')']]);
    h += '<div class="field"><label>' + uiimg('coin', 12) + 'Cantidad</label><input type="number" id="ui-amt" min="1" value="100"></div>';
    h += '<div class="qbar">' + btn('dep', 'Depositar', 'primary') + btn('wd', 'Retirar', '') + btn('depall', 'Todo dentro', '') + btn('wdall', 'Todo fuera', '') + '</div>';
    h += '<p class="muted" style="margin-top:8px">El oro del banco nunca se pierde al caer.</p>';

  } else if (t === 'gift') {
    const v = S.giftView(d.npcId);
    title = 'Regalo para ' + v.name; ic = uiimg('gift', 20);
    if (v.used) h += warn('Ya le regalaste algo hoy.');
    if (!v.items.length) h += '<p class="muted">No llevas nada que regalar.</p>';
    for (let i = 0; i < v.items.length; i++) {
      const it = v.items[i];
      h += row(iimg(it.id, 24), ictxt(it.name) + ' ×' + it.n,
        (it.loved ? uiimg('heart', 11) + ' Le encanta · ' : '') + '+' + it.gain + ' confianza',
        btn('gift', 'Regalar', 'primary', 'data-slot="' + it.slot + '"' + (v.used ? ' disabled' : '')));
    }

  } else if (t === 'quest') {
    const v = S.questView();
    title = 'Contratos del cuartel'; ic = uiimg('quest', 20);
    if (v.active) {
      const a = v.active, pct = U.clamp(a.progress / a.count, 0, 1) * 100;
      h += okbox('<b>' + ictxt(a.name) + '</b> — ' + ictxt(a.target) + ': ' + a.progress + '/' + a.count + ' · ' + a.reward + ' oro' +
        (a.kind === 'gather' ? '<br>Se entregan los objetos de tu mochila.' : ''));
      h += '<div class="prog"><i style="width:' + pct + '%"></i></div>';
      h += '<div class="qbar">' + btn('turnin', 'Entregar', 'primary', a.progress >= a.count ? '' : ' disabled') +
        btnI('abandonquest', 'cross', 'Abandonar', 'danger') + '</div>';
    }
    for (let i = 0; i < v.list.length; i++) {
      const q = v.list[i];
      const icon = q.species ? spimg(q.species, 24) : (q.item ? iimg(q.item, 24) : uiimg('quest', 22));
      const kind = q.kind === 'gather' ? 'Recolección' : 'Caza';
      h += row(icon, ictxt(q.name) + ' ' + chip(kind, q.kind === 'gather'),
        ictxt(q.target) + ' ×' + q.count + ' · ' + q.reward + ' oro' + (q.active ? ' · ' + q.progress + '/' + q.count : ''),
        q.done ? chip('Hecho', true) : (q.active ? chip('En curso', true) : btn('quest', 'Aceptar', 'primary', 'data-id="' + q.id + '"')));
    }

  } else if (t === 'parcelList' || t === 'parcel') {
    const v = S.parcelView();
    title = 'Lonja de Tierras'; ic = uiimg('parcel', 20);
    if (!v.free) h += warn('Los esclavos no pueden firmar escrituras. Paga tu deuda primero.');
    h += kv([['Tu oro', uiimg('coin', 13) + U.fmt(v.gold)],
      ['Escrituras', uiimg('quest', 13) + v.deeds],
      ['Parcelas', v.owned + '/' + v.total],
      ['Título', ictxt(v.title.name)]]);
    h += '<p class="muted">Cada compra necesita una escritura (' + v.deedCost + ' oro). El precio sube un ' + Math.round(B.PARCEL_ESCALATE * 100) + '% por parcela que ya posees.</p>';
    if (v.nextTitle) h += okbox(uiimg('crown', 13) + ' Con ' + v.nextTitle.need + ' parcela(s) más serás <b>' + ictxt(v.nextTitle.name) + '</b>.');
    if (!v.deeds) h += '<div class="qbar">' + btnI('buydeed', 'quest', 'Comprar escritura (' + v.deedCost + ')', '') + '</div>';
    const list = t === 'parcel' ? v.list.filter(function (x) { return x.id === d.id; }) : v.list;
    for (let i = 0; i < list.length; i++) {
      const pa = list[i];
      const st = pa.mine ? 'Tuya' : pa.owner ? 'Ajena' : 'En venta';
      h += row(uiimg('parcel', 22), 'Parcela #' + (pa.id + 1) + ' ' + chip(pa.cls, pa.mine) + ' ' + chip(st, pa.mine),
        '(' + pa.x + ',' + pa.y + ') · ' + pa.w + '×' + pa.h + ' · ' + pa.tiles + ' tiles',
        pa.owner ? '' : price(pa.price) + btn('parcel', 'Comprar', 'primary', 'data-id="' + pa.id + '"' + (v.free && v.deeds > 0 && v.gold >= pa.price ? '' : ' disabled')));
    }

  } else if (t === 'slaves') {
    const v = S.slaveView();
    title = 'Intendencia · Trabajadores'; ic = uiimg('slave', 20);
    h += kv([['Este mes', String(v.stock)], ['Precio', uiimg('coin', 13) + U.fmt(v.cost)],
      ['Tu título', ictxt(v.title.name)], ['Máximo', v.workers.length + '/' + v.max]]);
    h += '<div class="qbar">' + btn('buyslave', 'Contratar', 'primary', (v.free && v.stock > 0 && v.gold >= v.cost && v.workers.length < v.max) ? '' : ' disabled') + '</div>';
    h += sec('family', 'Tu household');
    if (!v.workers.length) h += '<p class="muted">Aún no tienes trabajadores.</p>';
    for (let i = 0; i < v.workers.length; i++) {
      const wk = v.workers[i];
      h += row(npcimg('worker', 24), ictxt(wk.name),
        uiimg(ROLE_IC[wk.role] || 'role_idle', 11) + ' Moral ' + wk.morale + '% · 1 alimento/día',
        roleSelect(v.roles, wk.uid, wk.role, false) + btn('dismiss', 'Liberar', 'danger', 'data-uid="' + wk.uid + '"'));
    }

  } else if (t === 'family') {
    const v = S.familyView();
    title = 'Familia'; ic = uiimg('family', 20);
    h += kv([['Hogar', v.house ? ictxt(v.house) : 'Sin casa'], ['Hijos', v.children.length + '/' + v.cap],
      ['Anillos', uiimg('rings', 13) + v.rings], ['Día', String(v.day)]]);
    if (v.pregnantDay) h += okbox(uiimg('baby', 13) + ' Un hijo nacerá el día ' + v.pregnantDay + ' (hoy ' + v.day + ').');
    if (v.spouse) h += row(npcimg(v.spouse.id, 24), ictxt(v.spouse.name), 'Cónyuge · confianza ' + v.spouse.trust, btn('wedding', 'Renovar votos', '', ''));
    else h += '<p class="muted">Sube confianza a ' + B.MARRY_TRUST + ', coquetea, ten citas y propón matrimonio con ' + B.RINGS_NEEDED + ' anillos de oro. Necesitas casa con 2 camas.</p>';
    h += sec('child', 'Hijos');
    if (!v.children.length) h += '<p class="muted">Sin descendencia todavía.</p>';
    for (let i = 0; i < v.children.length; i++) {
      const c = v.children[i];
      const small = c.stage === 'baby' || c.stage === 'child';
      h += row(uiimg(c.stage === 'baby' ? 'baby' : 'child', 22), ictxt(c.name),
        'Etapa: ' + stageName(c.stage) + (c.alive ? '' : ' · ausente'), roleSelect(v.roles, c.uid, c.role, small));
    }
    h += sec('rings', 'Candidatos');
    if (!v.candidates.length) h += '<p class="muted">No hay candidatos compatibles.</p>';
    for (let i = 0; i < v.candidates.length; i++) {
      const c = v.candidates[i];
      h += row(npcimg(c.id, 24), ictxt(c.name), 'Confianza ' + c.trust + ' · ' + relName(c.rel),
        c.rel === 'dating' ? btnI('propose', 'rings', 'Proponer', 'primary', 'data-id="' + c.id + '"') : '');
    }

  } else if (t === 'farm') {
    const v = S.farmView(d.x, d.y);
    title = 'Tierra (' + v.x + ',' + v.y + ')'; ic = uiimg('seed', 20);
    if (v.owner && v.owner !== 'player') h += warn('Tierra de ' + ictxt((D.NPCS[v.owner] || {}).name || v.owner) + '. Cosechar aquí es robar.');
    if (v.help && v.help.npcId === v.owner) h += okbox(uiimg('quest', 13) + ' Tarea activa: ' + ictxt(v.help.label) + ' ' + v.help.done + '/' + v.help.need + ' en esta granja.');
    if (v.soil && v.soil.crop) {
      const cd = D.CROPS[v.soil.crop];
      h += kv([['Cultivo', Art.html('crop:' + v.soil.crop, 16) + ictxt(cd.name)],
        ['Crecimiento', Math.round(v.soil.growth * 100) + '%'], ['Regado', v.soil.watered ? 'Sí' : 'No']]);
      h += '<div class="prog"><i style="width:' + U.clamp(v.soil.growth, 0, 1) * 100 + '%"></i></div>';
      if (v.soil.fert) h += '<p class="muted" style="margin-top:6px">Fertilizante: ' + ictxt((itemDef(v.soil.fert) || {}).name || v.soil.fert) + '</p>';
    } else if (v.soil) h += '<p class="muted">Tierra arada, lista para sembrar.</p>';
    else h += '<p class="muted">Tierra sin arar.</p>';
    if (!v.actions.length) h += '<p class="muted">No hay nada que hacer aquí ahora.</p>';
    for (let i = 0; i < v.actions.length; i++) {
      const a = v.actions[i];
      if (a.act === 'plant') {
        h += sec('seed', 'Sembrar') + '<div class="seedrow">';
        if (!a.seeds.length) h += '<span class="muted">No llevas semillas.</span>';
        for (let k = 0; k < a.seeds.length; k++) {
          const sd = a.seeds[k];
          h += btn('farm', iimg(sd.id, 14) + '<span>' + ictxt(sd.name) + ' ×' + sd.n + '</span>', '',
            'data-do="plant" data-param="' + sd.id + '" data-x="' + v.x + '" data-y="' + v.y + '"');
        }
        h += '</div>';
      } else if (a.act === 'fert') {
        h += sec('fert', 'Fertilizar') + '<div class="seedrow">';
        if (!a.ferts.length) h += '<span class="muted">No llevas fertilizante.</span>';
        for (let k = 0; k < a.ferts.length; k++) {
          const fd = a.ferts[k];
          h += btn('farm', iimg(fd.id, 14) + '<span>' + ictxt(fd.name) + '</span>', '',
            'data-do="fert" data-param="' + fd.id + '" data-x="' + v.x + '" data-y="' + v.y + '"');
        }
        h += '</div>';
      } else {
        const key = a.act === 'till' ? 'craft' : a.act === 'water' ? 'water' : 'role_farm';
        h += '<div class="qbar">' + btnI('farm', key, clean(a.label), 'primary',
          'data-do="' + a.act + '" data-x="' + v.x + '" data-y="' + v.y + '"') + '</div>';
      }
    }

  } else if (t === 'house') {
    const v = S.houseView(d.uid);
    if (!v) return;
    title = v.name; ic = bldimg(v.key, 20);
    h += '<p class="muted">' + ictxt(v.desc) + '</p>';
    h += kv([['Camas', uiimg('bed', 13) + v.beds], ['Cofre', uiimg('chest', 13) + v.chest], ['Nivel', String(v.tier)]]);
    h += '<div>';
    for (let i = 0; i < v.functions.length; i++) {
      const f = v.functions[i];
      h += chip(esc(D.STATION_INFO[f] ? D.STATION_INFO[f].name : f), true);
    }
    h += '</div><div class="qbar" style="margin-top:10px">' +
      btnI('sleep', 'bed', 'Dormir', 'primary', 'data-mode="bed"') +
      btnI('chestopen', 'chest', 'Cofre', '', 'data-uid="' + d.uid + '"');
    if (v.next) h += btnI('upgrade', 'upgrade', 'Mejorar a ' + clean(v.next.name), '', 'data-uid="' + d.uid + '"' + (v.next.afford && v.next.reqOk ? '' : ' disabled'));
    h += '</div>';
    if (v.next) {
      h += sec('upgrade', 'Siguiente mejora: ' + clean(v.next.name));
      h += '<div>' + costHTML(v.next.cost) + '</div>';
      if (!v.next.reqOk) h += '<p class="muted">Requiere ' + esc(v.next.reqText) + '.</p>';
    }

  } else if (t === 'chest') {
    const v = S.chestView(d.uid);
    if (!v) return;
    title = v.name; ic = uiimg('chest', 20);
    h += '<p class="muted">Toca un objeto para moverlo entre cofre y mochila.</p><div class="invwrap"><div>' +
      sec('chest', 'Cofre · ' + v.items.filter(Boolean).length + '/' + v.cap) + '<div class="grid-inv">';
    for (let i = 0; i < v.items.length; i++) {
      const s = v.items[i];
      h += '<button class="islot" data-act="chest" data-dir="take" data-slot="' + i + '" title="' + (s ? esc((itemDef(s.id) || {}).name || '') : 'Vacío') + '">' +
        (s ? iimg(s.id, 22) + '<span class="n">' + s.n + '</span>' : '') + '</button>';
    }
    h += '</div></div><div>' + sec('bag', 'Mochila') + '<div class="grid-inv">';
    for (let i = 0; i < v.inv.length; i++) {
      const s = v.inv[i];
      h += '<button class="islot" data-act="chest" data-dir="put" data-slot="' + i + '" title="' + (s ? esc((itemDef(s.id) || {}).name || '') : 'Vacío') + '">' +
        (s ? iimg(s.id, 22) + '<span class="n">' + s.n + '</span>' : '') + '</button>';
    }
    h += '</div></div></div>';

  } else if (t === 'animals') {
    const v = S.animalsView(d.uid);
    if (!v) return;
    title = v.name; ic = bldimg('corral', 20);
    h += kv([['Ocupación', v.animals.length + '/' + v.cap]]);
    if (!v.animals.length) h += '<p class="muted">Vacío. Compra animales en la Intendencia y usa el token desde la mochila.</p>';
    for (let i = 0; i < v.animals.length; i++) {
      const a = v.animals[i];
      h += row(spimg(a.species, 26), ictxt(a.name),
        (a.baby ? 'Cría · ' : '') + 'Alimentado ' + a.fed + '× · barda ' + a.armor + ' · ' + a.hp + '/' + a.maxHp + ' vida' + (a.mountable ? ' · montable' : ''),
        a.ready ? chip(uiimg(itemKey(a.ready.id), 11) + '<span>×' + a.ready.n + '</span>', true) : chip('Sin producto', false));
    }

  } else if (t === 'craft') {
    title = 'Crafteo'; ic = uiimg('craft', 20);
    h += craftHTML();

  } else if (t === 'build') {
    const v = S.buildView();
    title = 'Construcción'; ic = uiimg('build', 20);
    h += kv([['Parcelas', String(v.parcels)], ['Construcciones', String(v.owned.length)], ['Nivel', uiimg('level', 13) + v.level]]);
    h += '<p class="muted">Se construye en el primer hueco libre de tus parcelas. Solo hay cinco estaciones: fogata, banco, cocina, forja y alambique. Los guardianes protegen lo que levantas.</p>';
    for (let i = 0; i < v.list.length; i++) {
      const b = v.list[i];
      let sub = ictxt(b.desc) + '<br>' + costHTML(b.cost);
      if (!b.reqOk) sub += '<br><span class="chip warn">' + uiimg('lock', 11) + '<span>' + esc(b.reqText) + '</span></span>';
      h += row(bldimg(b.key, 24), ictxt(b.name) + (b.station ? ' ' + chip(D.STATION_INFO[b.station].name, true) : ''),
        sub, btn('build', 'Construir', 'primary', 'data-id="' + b.key + '"' + (b.afford && b.reqOk && v.parcels > 0 ? '' : ' disabled')),
        b.reqOk ? '' : 'locked');
    }
    h += sec('build', 'Tus construcciones');
    if (!v.owned.length) h += '<p class="muted">Ninguna todavía.</p>';
    for (let i = 0; i < v.owned.length; i++) {
      const o = v.owned[i];
      h += row(bldimg(o.key, 24), ictxt(o.name), '(' + o.x + ',' + o.y + ')',
        o.upgradable ? btnI('upgrade', 'upgrade', 'Mejorar', '', 'data-uid="' + o.uid + '"') : '');
    }

  } else if (t === 'stations') {
    const v = S.stationsView(d.npcId);
    title = 'Talleres de ' + v.name; ic = uiimg('craft', 20);
    h += kv([['Recargo', Math.round(v.fee * 100) + '%'], ['Tu oro', uiimg('coin', 13) + U.fmt(v.gold)]]);
    h += '<p class="muted">Usa estos talleres sin construirlos: el mercader cobra un recargo sobre el valor de lo fabricado. Acércate a él para que aparezcan disponibles.</p>';
    if (v.publics && v.publics.length) {
      h += sec('public', 'Talleres públicos de la plaza (gratis, lentos)');
      for (let i = 0; i < v.publics.length; i++) {
        const pb = v.publics[i];
        h += row(uiimg(pb.glyph || 'public', 24), ictxt(pb.name), ictxt(pb.desc || ''),
          chip('siempre abierto', true));
      }
    }
    if (!v.list.length) h += '<p class="muted">Este mercader no presta talleres.</p>';
    for (let i = 0; i < v.list.length; i++) {
      const s = v.list[i];
      h += row(uiimg(s.glyph, 24), ictxt(s.name), ictxt(s.desc) +
        (s.fuel ? '<br>' + chip(uiimg('fire', 11) + '<span>' + s.fuel + ' combustible</span>', true) : '') +
        (s.reqOk ? '' : '<br><span class="chip warn">' + uiimg('lock', 11) + '<span>' + esc(s.reqText) + '</span></span>'),
        chip(s.reqOk ? 'Disponible' : 'Bloqueado', s.reqOk), s.reqOk ? '' : 'locked');
    }
    h += '<div class="qbar">' + btnI('opencraft', 'craft', 'Abrir crafteo', 'primary') + '</div>';

  } else if (t === 'helpTask') {
    const v = S.helpTaskView(d.npcId);
    title = 'Ayuda en la granja de ' + v.name; ic = uiimg('quest', 20);
    if (v.other) h += warn('Ya tienes una tarea con ' + ictxt((D.NPCS[v.other.npcId] || {}).name || v.other.npcId) + '. Termínala o abandónala.');
    if (v.active) {
      const pct = U.clamp(v.active.done / v.active.need, 0, 1) * 100;
      const left = v.active.deadline - v.day;
      h += okbox('<b>' + ictxt(v.active.label) + '</b> ' + v.active.done + '/' + v.active.need +
        ' · paga ' + v.active.pay + ' oro · plazo: ' + (left > 0 ? left + ' día(s)' : 'hoy'));
      h += '<div class="prog"><i style="width:' + pct + '%"></i></div>';
      h += '<p class="muted" style="margin-top:7px">Trabaja solo en la parcela de ' + ictxt(v.name) + '. El marcador dorado del mundo señala su granja.</p>';
      h += '<div class="qbar">' + btn('turnintask', 'Cobrar', 'primary', v.active.done >= v.active.need ? '' : ' disabled') +
        btnI('canceltask', 'cross', 'Abandonar', 'danger') + '</div>';
    } else {
      if (v.used) h += warn('Ya ayudaste a ' + ictxt(v.name) + ' hoy. Vuelve mañana.');
      h += '<p class="muted">Elige una tarea. Tienes ' + v.deadline + ' días para completarla; se cobra al volver con ' + ictxt(v.name) + '.</p>';
      for (let i = 0; i < v.kinds.length; i++) {
        const k = v.kinds[i];
        const key = k.kind === 'water' ? 'water' : k.kind === 'harvest' ? 'role_farm' : k.kind === 'plant' ? 'seed' : 'feed';
        h += row(uiimg(key, 24), ictxt(k.label) + ' ' + k.range[0] + '–' + k.range[1],
          'Ahora hay ' + k.available + ' pendiente(s) · ' + k.pay + ' oro por unidad · +' + k.trust + ' confianza',
          btn('accepttask', 'Aceptar', 'primary', 'data-kind="' + k.kind + '"' + (v.used || v.other ? ' disabled' : '')));
      }
    }

  } else if (t === 'bed') {
    title = 'Descansar'; ic = uiimg('bed', 20);
    const opts = S.sleepOptions();
    h += '<p class="muted">Dormir salta a las 06:00 del día siguiente, cura estados y guarda la partida. Cada opción tiene su precio y su riesgo.</p>';
    for (let i = 0; i < opts.length; i++) {
      const o = opts[i];
      const tags = [];
      tags.push(chip(uiimg('heart', 11) + '<span>' + Math.round(o.heal * 100) + '%</span>', o.ok));
      if (o.cost) tags.push(chip(uiimg('coin', 11) + '<span>' + o.cost + '</span>', true));
      if (o.risk) tags.push('<span class="chip warn">' + uiimg('warning', 11) + '<span>emboscada ' + Math.round(o.risk * 100) + '%</span></span>');
      if (o.bonusSt) tags.push(chip(uiimg('stamina', 11) + '<span>+' + o.bonusSt + '</span>', true));
      if (o.bonusHp) tags.push(chip(uiimg('heart', 11) + '<span>+' + o.bonusHp + '</span>', true));
      h += row(uiimg('bed', 24), ictxt(o.name), ictxt(o.desc) + '<br>' + tags.join(''),
        btnI('sleep', 'bed', 'Dormir', 'primary', 'data-mode="' + o.mode + '"' + (o.ok ? '' : ' disabled')),
        o.ok ? '' : 'locked');
    }

  } else {
    title = 'Panel';
    h += '<p class="muted">Sin contenido.</p>';
  }
  openModal(title, h, ic);
};

/* ==========================================================
15 · PANELES LOCALES (v4: roturas + reparación + recetario)
========================================================== */
const EQ_NAMES = {
  weapon: 'Arma', tool: 'Herramienta', shield: 'Escudo', head: 'Cabeza', chest: 'Pecho', legs: 'Piernas',
  ring: 'Anillo', belt: 'Cinturón', amulet: 'Amuleto', charm: 'Talismán',
  bag1: 'Mochila 1', bag2: 'Mochila 2', bag3: 'Mochila 3', quiver: 'Carcaj'
};
const EQ_IC = {
  weapon: 'sword', tool: 'craft', shield: 'shield', head: 'armor', chest: 'armor', legs: 'armor',
  ring: 'rings', belt: 'rings', amulet: 'rings', charm: 'rings',
  bag1: 'bag', bag2: 'bag', bag3: 'bag', quiver: 'ammo'
};
UI.renderLocal = function () {
  const k = UI.local, p = E.player;
  if (!k || !p) return;
  let title = '', h = '', ic = '';

  if (k === 'inventory') {
    const v = S.inventoryView();
    title = 'Inventario'; ic = uiimg('bag', 20);
    h += kv([['Oro', uiimg('coin', 13) + U.fmt(v.gold)],
      ['Ranuras', v.items.filter(Boolean).length + '/' + v.slots],
      ['Daño', uiimg('sword', 13) + v.stats.dmg],
      ['Defensa', uiimg('shield', 13) + v.stats.def],
      ['Bloqueo', uiimg('block', 13) + v.stats.block + '%'],
      ['Crítico', uiimg('target', 13) + v.stats.crit + '%'],
      ['Velocidad', uiimg('sprint', 13) + v.stats.speed + '%'],
      ['Combustible', uiimg('fire', 13) + v.fuel]]);
    if (v.ammo) {
      h += okbox(uiimg(itemKey(v.ammo.id), 13) + ' Munición activa: <b>' + ictxt(v.ammo.def.name) + '</b> ×' + v.ammo.n +
        ' · ' + ictxt(v.ammo.def.desc || ''));
    } else if (p.isBow) {
      h += warn('Sin munición. Fabrica flechas en el banco de trabajo o cambia con X.');
    }
    h += '<div class="invwrap"><div>' + sec('armor', 'Equipado') + '<div class="eqgrid">';
    for (let i = 0; i < E.EQUIP_SLOTS.length; i++) {
      const s = E.EQUIP_SLOTS[i], it = v.equip[s];
      const brk = it && it.broken ? ' broken' : '';
      h += '<button class="eq' + brk + '" data-act="unequip" data-slot="' + s + '" title="' + esc(it ? it.name + (it.broken ? ' (ROTA)' : '') : EQ_NAMES[s]) + '">' +
        '<span class="ei">' + (it ? iimg(it.id, 22) : uiimg(EQ_IC[s] || 'material', 18)) + '</span>' +
        '<span class="en">' + esc(it ? clean(it.name) : EQ_NAMES[s]) + '</span></button>';
    }
    h += '</div>';
    /* Equipo roto: reparación directa con coste visible (mejora 6) */
    let anyBroken = false;
    for (let i = 0; i < E.EQUIP_SLOTS.length; i++) {
      const s = E.EQUIP_SLOTS[i], it = v.equip[s];
      if (it && it.broken) {
        if (!anyBroken) { h += sec('repair', 'Equipo roto (repáralo barato)'); anyBroken = true; }
        h += row(iimg(it.id, 24), ictxt(it.name) + btag('Rota'),
          'Reparar con: ' + repairCostHTML(it.repair),
          btnI('repaireq', 'repair', 'Reparar', 'primary', 'data-slot="' + s + '"' + (it.repair && it.repair.can ? '' : ' disabled')));
      }
    }
    h += sec('bag', 'Mochila') + '<div class="grid-inv">';
    for (let i = 0; i < v.items.length; i++) {
      const it = v.items[i];
      const sel = UI.invSel === i ? ' sel' : '';
      if (!it) { h += '<button class="islot' + sel + '" data-act="sel" data-slot="' + i + '"></button>'; continue; }
      const brk = it.broken ? ' broken' : '';
      let dur = '';
      if (it.maxDur && it.dur !== undefined) {
        const low = it.dur / it.maxDur < 0.25 ? ' low' : '';
        dur = '<span class="dur"><i class="' + low.trim() + '" style="width:' + U.clamp(it.dur / it.maxDur, 0, 1) * 100 + '%"></i></span>';
      }
      h += '<button class="islot' + sel + brk + '" data-act="sel" data-slot="' + i + '" title="' + esc(clean(it.name)) + (it.broken ? ' (ROTA)' : '') + '">' +
        iimg(it.id, 22) + '<span class="n">' + (it.n > 1 ? it.n : '') + '</span>' + dur + '</button>';
    }
    h += '</div></div><div class="detail">';
    const sel = UI.invSel >= 0 ? v.items[UI.invSel] : null;
    if (sel) {
      const def = itemDef(sel.id) || { name: sel.id, cat: 'misc', value: 0 };
      h += '<h4>' + iimg(sel.id, 20) + esc(clean(def.name)) + (sel.q ? stars(sel.q) : '') + (sel.broken ? btag('Rota') : '') + '</h4>';
      if (sel.broken) h += warn('Está rota y no funciona. Repárala con pocos materiales: no hace falta fabricar otra.');
      h += '<p class="muted">' + ictxt(def.desc || 'Sin descripción.') + '</p>';
      h += '<p class="muted">' + esc(def.cat) + ' · ' + def.value + ' oro' +
        (sel.dur !== undefined ? ' · durabilidad ' + sel.dur + '/' + sel.maxDur : '') + '</p>';
      if (sel.repair && sel.repair.cost) {
        h += '<div>' + chip(uiimg('repair', 11) + '<span>Reparar: ' + repairCostHTML(sel.repair) + '</span>', sel.repair.can) + '</div>';
      }
      if (def.food) h += '<div>' + chip(uiimg('food', 11) + '<span>' + (def.food.food || 0) + '</span>', true) +
        chip(uiimg('heart', 11) + '<span>' + (def.food.hp || 0) + '</span>', true) +
        chip(uiimg('stamina', 11) + '<span>' + (def.food.st || 0) + '</span>', true) + '</div>';
      if (def.heal) h += '<div>' + chip(uiimg('potion', 11) + '<span>curación</span>', true) +
        (def.heal.stopBleed ? chip(uiimg('check', 11) + '<span>corta sangrado</span>', true) : '') + '</div>';
      h += '<div class="qbar">';
      if (sel.repair) h += btnI('repair', 'repair', 'Reparar', 'primary', 'data-slot="' + UI.invSel + '"' + (sel.repair.can ? '' : ' disabled'));
      if (!sel.broken && (def.tool || def.weapon || def.shield || def.armor || def.acc || def.bag)) h += btnI('equip', 'check', 'Equipar', sel.repair ? '' : 'primary', 'data-slot="' + UI.invSel + '"');
      if (def.food || def.heal || def.saddle || def.pet || def.animal || def.bed || def.place || def.cat === 'misc') h += btnI('use', 'play', 'Usar', 'primary', 'data-id="' + sel.id + '"');
      h += btnI('drop', 'arrow_down', 'Tirar 1', '', 'data-slot="' + UI.invSel + '"');
      if (sel.n > 1) h += btn('dropall', 'Tirar todo', 'danger', 'data-slot="' + UI.invSel + '"');
      h += '</div><p class="muted" style="margin-top:7px">Barra rápida:</p><div class="qbar">';
      for (let i = 0; i < 5; i++) h += btn('quick', String(i + 1), '', 'data-slot="' + i + '" data-id="' + sel.id + '"');
      h += '</div>';
    } else {
      h += '<p class="muted">Selecciona un objeto para equiparlo, usarlo, repararlo o asignarlo a la barra rápida.</p>';
      h += '<p class="muted" style="margin-top:6px">Lo que equipes se ve en tu personaje: armas, herramientas, escudo, armaduras y mochilas. Una herramienta rota se marca en rojo y se repara desde aquí.</p>';
    }
    h += sec('xp', 'Oficios');
    for (let i = 0; i < v.skills.length; i++) {
      const sk = v.skills[i];
      h += '<div class="skill"><div class="sl"><span>' + esc(sk.name) + '</span><span>Nv ' + sk.level + '</span></div>' +
        '<div class="st"><div class="sf" style="width:' + sk.pct + '%"></div></div></div>';
    }
    h += '<div class="qbar">' + btnI('openskills', 'level', 'Habilidades (H)', 'primary') +
      btnI('openrecipes', 'saber', 'Recetario (J)', '') + '</div>';
    h += '</div></div>';

  } else if (k === 'craft') {
    title = 'Crafteo'; ic = uiimg('craft', 20);
    h += craftHTML();

  } else if (k === 'recipes') {
    title = 'Recetario y saberes'; ic = uiimg('saber', 20);
    h += recipesHTML();

  } else if (k === 'skills') {
    const v = S.skillsView();
    title = 'Habilidades'; ic = uiimg('level', 20);
    h += kv([['Nivel', uiimg('level', 13) + v.level + '/' + v.maxLevel],
      ['Puntos libres', uiimg('points', 13) + v.points],
      ['Puntos de receta', uiimg('saber', 13) + v.rp],
      ['Tier actual', uiimg('tier', 13) + v.tier],
      ['Experiencia', U.fmt(v.xp) + ' / ' + U.fmt(v.nextXp)]]);
    h += '<div class="prog"><i style="width:' + v.pct + '%"></i></div>';
    h += '<p class="muted" style="margin-top:7px">Todo suma experiencia: talar, picar, pescar, cultivar, cocinar, fabricar, tamear, ayudar y combatir. Cada nivel mejora tus estadísticas base, da un punto de habilidad (cada cinco, uno extra) y un punto de receta para aprender saberes.</p>';
    if (v.points > 0) h += okbox(uiimg('points', 13) + ' Tienes <b>' + v.points + '</b> punto(s) para repartir.');
    if (v.rp > 0) h += okbox(uiimg('saber', 13) + ' Tienes <b>' + v.rp + '</b> punto(s) de receta: úsalos en el Recetario (J).');
    h += '<div class="branches">';
    for (let i = 0; i < v.branches.length; i++) {
      const b = v.branches[i];
      h += '<div class="branch' + (b.value >= b.max ? ' max' : '') + '">';
      h += '<div class="bhead">' + uiimg(b.glyph, 18) + '<span class="bname">' + esc(b.name) + '</span>' +
        '<span class="chip' + (b.value ? ' on' : ' off') + '">' + b.value + '/' + b.max + '</span>' +
        btnI('alloc', 'plus', '', 'primary', 'data-id="' + b.id + '"' + (b.canUp ? '' : ' disabled')) + '</div>';
      h += '<div class="bpips">';
      for (let k2 = 0; k2 < b.max; k2++) h += '<i class="' + (k2 < b.value ? 'on' : '') + '"></i>';
      h += '</div>';
      h += '<p class="muted">' + esc(b.desc) + '</p>';
      if (b.value > 0 && b.gained.length) {
        let g2 = '';
        for (let k2 = 0; k2 < b.gained.length; k2++) {
          const gg = b.gained[k2];
          const val = Math.abs(gg.total) < 1 ? Math.round(gg.total * 100) + '%' : gg.total.toFixed(1);
          g2 += chip((gg.total >= 0 ? '+' : '') + val, true);
        }
        h += '<div>' + g2 + '</div>';
      }
      if (b.next) h += '<div class="bnext">' + uiimg('lock', 11) + ' Nivel ' + b.next.at + ': ' + esc(b.next.text) + '</div>';
      else if (b.value >= b.max) h += '<div class="bunlock">' + uiimg('check', 11) + ' Rama completada.</div>';
      h += '</div>';
    }
    h += '</div>';
    h += sec('xp', 'Oficios');
    for (let i = 0; i < v.trades.length; i++) {
      const tr = v.trades[i];
      h += '<div class="skill"><div class="sl"><span>' + esc(tr.name) + '</span><span>Nv ' + tr.level + '</span></div>' +
        '<div class="st"><div class="sf" style="width:' + tr.pct + '%"></div></div></div>';
    }
    h += '<div class="qbar">' + btnI('openrecipes', 'saber', 'Recetario (J)', 'primary') +
      btnI('respec', 'reset', 'Reiniciar reparto (' + v.respecCost + ' oro)', 'danger') + '</div>';

  } else if (k === 'map') {
    title = 'Mapa de Vhalor'; ic = uiimg('map', 20);
    h += '<div class="mapwrap"><canvas id="ui-map" width="480" height="480"></canvas></div>';
    h += '<div class="legend">' +
      '<span><i style="background:#d9a441"></i>Tus parcelas</span>' +
      '<span><i style="background:#7aae4e"></i>Granjas NPC</span>' +
      '<span><i style="background:#efe3c8"></i>Ciudad</span>' +
      '<span><i style="background:#e04b3a"></i>Jefe</span>' +
      '<span><i style="background:#8fd0f0"></i>Guardianes</span>' +
      '<span><i style="background:#3fbf6f"></i>Tameados</span>' +
      '<span><i style="background:#e8a840"></i>Errantes</span>' +
      '<span><i style="background:#fff"></i>Tú</span></div>';
    h += '<p class="muted" style="margin-top:8px">Mundo de ' + C.WORLD + '×' + C.WORLD + ' · ' + D.BIOMES.length + ' biomas · ' + D.ZONES.length + ' santuarios. La muralla solo tiene dos puertas: Sur y Este.</p>';
    h += '<label class="check"><input type="checkbox" data-set="showZones"' + (CR.Settings.values.showZones ? ' checked' : '') + '> Resaltar santuarios en el mapa y el mundo</label>';
    h += sec('compass', 'Santuarios');
    for (let i = 0; i < D.ZONES.length; i++) {
      const z = D.ZONES[i];
      const zw = W.zones[i];
      h += row(uiimg(z.glyph, 22), ictxt(z.name), ictxt(z.lore) + (zw ? '<br>(' + zw.x + ',' + zw.y + ') · radio ' + zw.r : ''),
        chip(z.boss ? 'Jefe' : 'Fauna', !!z.boss));
    }
    h += '<div class="qbar">' + btnI('openbuild', 'build', 'Construir en mis parcelas', 'primary') + '</div>';

  } else if (k === 'social') {
    const v = S.socialView();
    title = 'Relaciones'; ic = uiimg('social', 20);
    if (v.help) h += okbox(uiimg('quest', 13) + ' Tarea en curso: ' + ictxt(v.help.label) + ' ' + v.help.done + '/' + v.help.need +
      ' para ' + ictxt((D.NPCS[v.help.npcId] || {}).name || ''));
    for (let i = 0; i < v.list.length; i++) {
      const n = v.list[i];
      const col = n.trust >= 40 ? '#3fbf6f' : n.trust <= -20 ? '#e04b3a' : '#d9a441';
      const tags = [];
      if (n.farmer) tags.push(chip('Granjero', true));
      if (n.hunter) tags.push(chip('Cazador', true));
      if (n.wanderer) tags.push(chip('Errante', true));
      h += row(npcimg(n.id, 26), ictxt(n.name) + (n.romance ? uiimg('heart', 12) : '') + ' ' + tags.join(''),
        ictxt(n.role) + ' · <span style="color:' + col + '">' + esc(n.band.name) + ' (' + n.trust + ')</span>' +
        (n.rel !== 'none' ? ' · ' + relName(n.rel) : '') + '<br><span class="muted">Odio: ' + ictxt(n.consequences.hate) + '</span>', '');
    }
    h += sec('family', 'Familia');
    h += v.family.spouse
      ? '<p class="muted">Cónyuge: ' + ictxt(v.family.spouse.name) + ' · Hijos: ' + v.family.children.length + '</p>'
      : '<p class="muted">Sin familia aún.</p>';
    h += '<div class="qbar">' + btnI('openfamily', 'family', 'Panel de familia', 'primary') + '</div>';

  } else if (k === 'settings') {
    title = 'Ajustes'; ic = uiimg('settings', 20);
    const sv = CR.Settings.values;
    h += '<div class="settings-grid">';
    h += '<div class="setcol"><h4>' + uiimg('sound_on', 12) + 'Sonido</h4>';
    h += '<div class="field"><label>' + uiimg('sound_on', 12) + 'Volumen — ' + Math.round(sv.volume * 100) + '%</label>' +
      '<input type="range" id="ui-vol" min="0" max="100" value="' + Math.round(sv.volume * 100) + '"></div>';
    h += '<label class="check"><input type="checkbox" data-set="music"' + (sv.music ? ' checked' : '') + '> Música generativa</label>';
    h += '<label class="check"><input type="checkbox" data-set="ambience"' + (sv.ambience ? ' checked' : '') + '> Ambiente y fauna</label>';
    h += '</div>';
    h += '<div class="setcol"><h4>' + uiimg('target', 12) + 'Combate</h4>';
    h += '<div class="field"><label>' + uiimg('eye', 12) + 'Asistencia de apuntado — ' + Math.round(sv.aimAssist * 100) + '%</label>' +
      '<input type="range" id="ui-aim" min="0" max="200" value="' + Math.round(sv.aimAssist * 100) + '"></div>';
    h += '<label class="check"><input type="checkbox" data-set="autoBlock"' + (sv.autoBlock ? ' checked' : '') + '> Soltar guardia al quedar aturdido</label>';
    h += '<label class="check"><input type="checkbox" data-set="shake"' + (sv.shake ? ' checked' : '') + '> Sacudida de cámara</label>';
    h += '</div>';
    h += '<div class="setcol"><h4>' + uiimg('edit', 12) + 'Controles</h4>';
    h += '<div class="qbar">' + btnI('editctl', 'move', 'Editar posición y tamaño', 'primary') +
      btnI('resetctl', 'reset', 'Restablecer', '') + '</div>';
    h += '<p class="muted">Arrastra cada grupo del HUD a donde te resulte cómodo. Tamaño ' + Math.round(sv.ctl.scale * 100) +
      '% · opacidad ' + Math.round(sv.ctl.opacity * 100) + '% · ' + (sv.ctl.swap ? 'mano izquierda' : 'mano derecha') + '.</p>';
    h += '</div>';
    h += '<div class="setcol"><h4>' + uiimg('compass', 12) + 'Pantalla</h4>';
    h += '<label class="check"><input type="checkbox" data-set="showZones"' + (sv.showZones ? ' checked' : '') + '> Resaltar santuarios</label>';
    h += '<label class="check"><input type="checkbox" data-set="fps"' + (sv.fps ? ' checked' : '') + '> Rendimiento (F3)</label>';
    h += '<div class="qbar">' + btnI('fullscreen', 'upgrade', 'Pantalla completa', '') + '</div>';
    h += '<p class="muted">Orientación: ' + (UI._portrait
      ? '<span class="orient-bad">vertical — gira el dispositivo</span>'
      : '<span class="orient-ok">horizontal — correcta</span>') + '</p>';
    h += '</div></div>';
    h += '<div class="setcol" style="margin-top:10px"><h4>' + uiimg('save', 12) + 'Partida</h4>';
    h += '<div class="qbar">' + btnI('save', 'save', 'Guardar', 'primary') + btnI('export', 'export', 'Exportar', '') +
      btnI('delete', 'trash', 'Borrar', 'danger') + btnI('quit', 'quit', 'Salir', 'danger') + btnI('help', 'help', 'Cómo jugar', '') + '</div>';
    h += '<p class="muted" style="margin-top:6px">Semilla ' + W.seed + ' · autoguardado cada 60 s y al dormir.</p></div>';

  } else if (k === 'help') {
    title = 'Cómo jugar'; ic = uiimg('help', 20);
    h += '<div class="settings-grid">';
    for (let i = 0; i < D.HELP.length; i++) {
      h += '<div class="setcol"><h4>' + uiimg(D.HELP[i].glyph || 'book', 12) + ictxt(D.HELP[i].title) + '</h4>' +
        '<p class="muted">' + ictxt(D.HELP[i].text) + '</p></div>';
    }
    h += '</div>';
    h += sec('compass', 'Controles');
    h += '<div class="qbar">' + chip(uiimg('attack', 12) + '<span>Espacio · atacar / tensar</span>', true) +
      chip(uiimg('block', 12) + '<span>L / clic der. · bloquear</span>', true) +
      chip(uiimg('interact', 12) + '<span>E · usar</span>', true) +
      chip(uiimg('roll', 12) + '<span>Q · esquivar</span>', true) +
      chip(uiimg('mount', 12) + '<span>F · montar</span>', true) +
      chip(uiimg('cycle', 12) + '<span>Tab · objetivo</span>', true) +
      chip(uiimg('ammo', 12) + '<span>X · munición</span>', true) +
      chip(uiimg('sprint', 12) + '<span>Shift · correr</span>', true) +
      chip(uiimg('bag', 12) + '<span>I</span>', true) +
      chip(uiimg('craft', 12) + '<span>C</span>', true) +
      chip(uiimg('saber', 12) + '<span>J · recetario</span>', true) +
      chip(uiimg('build', 12) + '<span>B</span>', true) +
      chip(uiimg('level', 12) + '<span>H</span>', true) +
      chip(uiimg('map', 12) + '<span>M</span>', true) +
      chip(uiimg('social', 12) + '<span>R</span>', true) +
      chip(uiimg('edit', 12) + '<span>O · controles</span>', true) + '</div>';
  }
  openModal(title, h, ic);
  if (k === 'map') drawBigMap();
};
function drawBigMap() {
  const cv = el('ui-map');
  if (!cv) return;
  const src = R.getMapCanvas();
  if (!src) return;
  const g = cv.getContext('2d');
  g.imageSmoothingEnabled = false;
  g.clearRect(0, 0, cv.width, cv.height);
  g.drawImage(src, 0, 0, cv.width, cv.height);
  const k = cv.width / C.WORLD;
  if (CR.Settings.values.showZones) {
    for (let i = 0; i < W.zones.length; i++) {
      const z = W.zones[i], zd = D.ZONE_BY_ID[z.id];
      g.strokeStyle = zd ? zd.tint : '#d9a441';
      g.lineWidth = 1.6;
      g.beginPath(); g.arc(z.x * k, z.y * k, z.r * k, 0, U.TAU); g.stroke();
      g.fillStyle = 'rgba(0,0,0,0.10)'; g.fill();
    }
  }
  const owned = W.ownedParcels();
  g.strokeStyle = '#d9a441'; g.lineWidth = 2;
  for (let i = 0; i < owned.length; i++) g.strokeRect(owned[i].x * k, owned[i].y * k, owned[i].w * k, owned[i].h * k);
  g.strokeStyle = 'rgba(122,174,78,0.8)'; g.lineWidth = 1.2;
  for (let i = 0; i < W.farms.length; i++) g.strokeRect(W.farms[i].x * k, W.farms[i].y * k, W.farms[i].w * k, W.farms[i].h * k);
  g.strokeStyle = '#efe3c8'; g.lineWidth = 2;
  if (W.city) g.strokeRect(W.city.x * k, W.city.y * k, W.city.w * k, W.city.h * k);
  for (let i = 0; i < E.list.length; i++) {
    const e = E.list[i];
    if (e.tg.dead) continue;
    let col = null, r = 2.5;
    if (e.type === 'npc') { col = e.tg.wanderer ? '#e8a840' : '#f3cf7a'; }
    else if (e.tg.boss) { col = '#e04b3a'; r = 4; }
    else if (e.tg.guardian) { col = '#8fd0f0'; r = 3; }
    else if (e.tg.tamed && e.tg.owner === 'player') col = '#3fbf6f';
    else if (e.type === 'guard') col = '#5aa7e0';
    else if (e.species === 'bandit') col = '#c0392b';
    if (!col) continue;
    g.fillStyle = col; g.beginPath(); g.arc(e.t.x * k, e.t.y * k, r, 0, U.TAU); g.fill();
  }
  const hp = S.help;
  if (hp) {
    for (let i = 0; i < W.farms.length; i++) {
      if (W.farms[i].owner !== hp.npcId) continue;
      const fa = W.farms[i];
      g.strokeStyle = hp.done >= hp.need ? '#3fbf6f' : '#f3cf7a';
      g.lineWidth = 2.4;
      g.beginPath(); g.arc((fa.x + fa.w / 2) * k, (fa.y + fa.h / 2) * k, 6, 0, U.TAU); g.stroke();
      break;
    }
  }
  const p = E.player;
  if (p) {
    g.fillStyle = '#fff'; g.beginPath(); g.arc(p.t.x * k, p.t.y * k, 4, 0, U.TAU); g.fill();
    g.strokeStyle = '#d9a441'; g.lineWidth = 2; g.stroke();
  }
}

/* ==========================================================
16 · HANDLERS DELEGADOS (v4: learn / repair / repaireq / openrecipes)
========================================================== */
function amt() { const n = el('ui-amt'); return n ? Math.max(0, parseInt(n.value, 10) || 0) : 0; }
function panelToLocal(kind) {
  S.panel = null; S.uiMode = 'none';
  UI.local = kind; UI.invSel = -1;
  UI.renderLocal();
}
function initModalHandlers() {
  const mc = el('modal-close');
  if (mc) CR.Bindings.add(mc, 'click', function () { UI.closeModal(); }, false, 'ui');
  const mo = el('modal');
  if (mo) CR.Bindings.add(mo, 'pointerdown', function (e) { if (e.target === mo) UI.closeModal(); }, false, 'ui');
  const body = el('modal-body');
  if (!body) return;
  CR.Bindings.add(body, 'click', function (ev) {
    const b = ev.target.closest('[data-act]');
    if (!b || b.disabled) return;
    const act = b.getAttribute('data-act');
    const id = b.getAttribute('data-id');
    const slotStr = b.getAttribute('data-slot');
    const slot = parseInt(slotStr, 10);
    const uid = parseInt(b.getAttribute('data-uid'), 10);
    const p = E.player;
    if (!p) return;
    switch (act) {
      case 'tab':
        if (S.panel && S.panel.type === 'shop') UI._shopTab = b.getAttribute('data-tab');
        else UI._craftTab = b.getAttribute('data-tab');
        refresh(); break;
      case 'buy': S.buy(id, 1); break;
      case 'buy5': S.buy(id, 5); break;
      case 'sell': S.sellSlot(slot, 1); break;
      case 'sellall': { const s = p.inv[slot]; if (s) S.sellSlot(slot, s.n); break; }
      case 'craft': S.craft(id); break;
      case 'pay': S.payDebt(amt()); break;
      case 'debtitem': S.payDebtItem(slot, 1); break;
      case 'debtitemall': { const s = p.inv[slot]; if (s) S.payDebtItem(slot, s.n); break; }
      case 'pay100': S.payDebt(100); break;
      case 'payall': S.payDebt(Math.min(p.gold, p.debt)); break;
      case 'dep': S.deposit(amt()); break;
      case 'wd': S.withdraw(amt()); break;
      case 'depall': S.deposit(p.gold); break;
      case 'wdall': S.withdraw(p.bank); break;
      case 'gift': S.giveGift(S.panel.data.npcId, slot); break;
      case 'quest': S.acceptQuest(id); break;
      case 'abandonquest': S.abandonQuest(); break;
      case 'turnin': S.turnInQuest(); break;
      case 'parcel': S.buyParcel(parseInt(id, 10)); break;
      case 'buydeed': {
        if (!p.free) { UI.toast('Primero rompe tu cadena.', 'bad'); break; }
        if (p.gold < B.LAND_DEED_COST) { UI.toast('La escritura cuesta ' + B.LAND_DEED_COST + ' oro.', 'bad'); A.play('error'); break; }
        p.gold -= B.LAND_DEED_COST;
        E.Inv.add(p, 'land_deed', 1);
        A.play('buy');
        UI.toast('Escritura comprada. Ahora puedes comprar una parcela.', 'good');
        refresh(); break;
      }
      case 'buyslave': S.buySlave(); break;
      case 'dismiss': S.dismiss(uid); break;
      case 'propose': S.propose(id); break;
      case 'wedding': S.wedding(); break;
      case 'openfamily': UI.local = null; S.openPanel('family', {}); break;
      case 'openbuild': UI.openBuild(); break;
      case 'opencraft': panelToLocal('craft'); break;
      case 'openskills': panelToLocal('skills'); break;
      case 'openrecipes': panelToLocal('recipes'); break;
      case 'learn': {
        const r = S.learnSaber(id);
        if (!r.ok) A.play('error');
        refresh(); break;
      }
      case 'alloc': S.alloc(id); break;
      case 'respec': S.respec(); break;
      case 'repair': S.repairInv(slot); break;
      case 'repaireq': S.repairEquip(slotStr); break;
      case 'accepttask': S.acceptHelpTask(S.panel.data.npcId, b.getAttribute('data-kind')); break;
      case 'turnintask': S.turnInHelpTask(); break;
      case 'canceltask': S.cancelHelpTask(); break;
      case 'farm':
        S.farmAct(parseInt(b.getAttribute('data-x'), 10), parseInt(b.getAttribute('data-y'), 10),
          b.getAttribute('data-do'), b.getAttribute('data-param'));
        break;
      case 'sleep': S.sleep(b.getAttribute('data-mode') || 'auto'); break;
      case 'upgrade': S.upgrade(uid); break;
      case 'chestopen': S.closePanel(); S.openPanel('chest', { uid: uid }); break;
      case 'chest': S.chestTransfer(S.panel.data.uid, b.getAttribute('data-dir') === 'put', slot, 0); break;
      case 'sel': UI.invSel = slot; refresh(); break;
      case 'equip': {
        const r = E.equipFromSlot(p, slot);
        UI.toast(r.msg, r.ok ? 'good' : 'bad');
        UI.invSel = -1; refresh(); break;
      }
      case 'unequip': E.unequip(p, slotStr); refresh(); break;
      case 'drop': case 'dropall': {
        const cur = p.inv[slot];
        if (cur) S.dropSlot(slot, act === 'dropall' ? cur.n : 1);
        if (!p.inv[slot]) UI.invSel = -1;
        refresh(); break;
      }
      case 'use': { const r = E.useItem(p, id); UI.toast(r.msg, r.ok ? 'good' : 'bad'); refresh(); break; }
      case 'quick':
        S.assignQuick(slot, id); UI.refreshQuickbar();
        UI.toast('Asignado a la ranura ' + (slot + 1), 'good'); break;
      case 'build': S.build(id); break;
      case 'editctl': UI.enterCtlEdit(); break;
      case 'resetctl': CR.Settings.resetCtl(); UI.toast('Controles restablecidos.', 'good'); refresh(); break;
      case 'fullscreen': UI.enterFullscreen(); break;
      case 'save': S.save(false); break;
      case 'export': S.exportSave(); break;
      case 'delete': S.deleteSave(); break;
      case 'quit': Bus.emit('ui:quit'); break;
      case 'help': panelToLocal('help'); break;
      default: break;
    }
    UI.refreshQuickbar();
  }, false, 'ui');
  CR.Bindings.add(body, 'change', function (ev) {
    const t = ev.target;
    if (!t || !t.getAttribute) return;
    if (t.getAttribute('data-act') === 'role') { S.setRole(parseInt(t.getAttribute('data-uid'), 10), t.value); return; }
    if (t.getAttribute('data-set')) { CR.Settings.set(t.getAttribute('data-set'), !!t.checked); return; }
  }, false, 'ui');
  CR.Bindings.add(body, 'input', function (ev) {
    if (ev.target.id === 'ui-vol') {
      CR.Settings.set('volume', U.clamp(parseInt(ev.target.value, 10) / 100, 0, 1));
      const lb = ev.target.parentNode.querySelector('label');
      if (lb) lb.innerHTML = uiimg('sound_on', 12) + 'Volumen — ' + ev.target.value + '%';
    } else if (ev.target.id === 'ui-aim') {
      CR.Settings.set('aimAssist', U.clamp(parseInt(ev.target.value, 10) / 100, 0, 2));
      const lb = ev.target.parentNode.querySelector('label');
      if (lb) lb.innerHTML = uiimg('eye', 12) + 'Asistencia de apuntado — ' + ev.target.value + '%';
    }
  }, false, 'ui');
  Bus.on('panel:open', function () { UI.local = null; UI._shopTab = 'buy'; UI.renderPanel(); }, 'ui');
  Bus.on('panel:update', function () { refresh(); }, 'ui');
  Bus.on('panel:close', function () { if (!UI.local) { const m = el('modal'); if (m) m.hidden = true; } UI.syncInput(); }, 'ui');
  Bus.on('quick:update', function () { UI.refreshQuickbar(); }, 'ui');
  Bus.on('loot', function () { UI.refreshQuickbar(); }, 'ui');
  Bus.on('alloc', function () { if (UI.local === 'skills') UI.renderLocal(); }, 'ui');
  Bus.on('globallevel', function () { if (UI.local === 'skills' || UI.local === 'recipes') UI.renderLocal(); }, 'ui');
  Bus.on('saber', function () { if (UI.local === 'recipes' || UI.local === 'craft') UI.renderLocal(); }, 'ui');
  Bus.on('repaired', function () { UI.refreshQuickbar(); }, 'ui');
  Bus.on('broke', function () { UI.refreshQuickbar(); UI.refreshHUD(); }, 'ui');
  Bus.on('help:progress', function () { if (S.panel && S.panel.type === 'helpTask') UI.renderPanel(); }, 'ui');
  Bus.on('help:accepted', function () { if (S.panel && S.panel.type === 'helpTask') UI.renderPanel(); }, 'ui');
  Bus.on('help:done', function () { if (S.panel && S.panel.type === 'helpTask') UI.renderPanel(); }, 'ui');
}

/* ==========================================================
17 · APERTURAS RÁPIDAS
========================================================== */
UI.openBuild = function () {
  if (!E.player || S.dialog || UI._portrait || UI._edit) return;
  UI.local = null;
  S.openPanel('build', {});
};
UI.openSkills = function () {
  if (!E.player || S.dialog || UI._portrait || UI._edit) return;
  UI.toggleLocal('skills');
};
UI.openRecipes = function () {
  if (!E.player || S.dialog || UI._portrait || UI._edit) return;
  UI.toggleLocal('recipes');
};

/* ==========================================================
18 · TICK
========================================================== */
UI.tick = function (dt) {
  for (let i = UI._toasts.length - 1; i >= 0; i--) {
    const t = UI._toasts[i];
    t.t += dt;
    if (t.t > t.life - 0.35) t.node.classList.add('out');
    if (t.t >= t.life) {
      if (t.node.parentNode) t.node.parentNode.removeChild(t.node);
      UI._toasts.splice(i, 1);
    }
  }
  if (UI._banner > 0) {
    UI._banner -= dt;
    if (UI._banner <= 0) { const b = el('banner'); if (b) b.classList.remove('show'); }
  }
  if (UI._type) {
    const ty = UI._type;
    ty.i += dt / ty.speed;
    const n = Math.min(ty.full.length, Math.floor(ty.i));
    ty.node.textContent = ty.full.slice(0, n);
    if (n >= ty.full.length) UI._type = null;
  }
  const p = E.player;
  if (p) {
    const cd = el('cd-attack');
    if (cd) {
      const cdv = String(Math.round(U.clamp(p.cb.cd / B.ATTACK_CD, 0, 1) * 100));
      if (cd._cd !== cdv) { cd._cd = cdv; cd.style.setProperty('--cd', cdv); }
    }
  }
  UI._hudT -= dt;
  if (UI._hudT <= 0) {
    UI._hudT = 0.1;
    const hud = el('hud');
    if (p && hud && !hud.hidden) { UI.refreshHUD(); UI.refreshQuickbar(); }
  }
};

/* ==========================================================
19 · INIT / DISPOSE
========================================================== */
UI.init = function () {
  registerGlyphs();
  injectCSS();
  hydrateIcons(document);
  initJoystick();
  initButtons();
  initKeys();
  initDialog();
  initModalHandlers();
  initCtlDrag();
  initOrientation();
  applyCtl();
  Bus.on('toast', function (d) { if (d) UI.toast(d.msg, d.cls); }, 'ui');
  Bus.on('banner', function (d) { if (d) UI.banner(d.title, d.sub); }, 'ui');
  Bus.on('hint', function (h) { UI.setHint(h); }, 'ui');
  Bus.on('loaded', function () { UI.refreshQuickbar(); UI.refreshHUD(); applyCtl(); }, 'ui');
  Bus.on('settings', function (k) {
    if (k === 'ctl') { applyCtl(); if (UI._edit) syncEditor(); }
    if (k === 'showZones' && UI.local === 'map') drawBigMap();
  }, 'ui');
  Bus.on('ammo', function () { UI.refreshHUD(); }, 'ui');
  Bus.on('equip', function () { UI.refreshHUD(); }, 'ui');

  const tips = D.TIPS, tipNode = el('load-tip');
  if (tipNode && tips.length) {
    let ti = 0;
    const paint = function () { tipNode.innerHTML = uiimg('info', 13) + '<span>' + esc(clean(tips[ti])) + '</span>'; };
    paint();
    UI._tipTimer = setInterval(function () { ti = (ti + 1) % tips.length; paint(); }, 3800);
  }
  const tv = el('title-version');
  if (tv) tv.textContent = 'v' + CR.version + ' · ' + C.WORLD + '×' + C.WORLD + ' · ' + D.BIOMES.length + ' biomas · horizontal';
  UI.ready = true;
  console.info('[CR] ui.js v4 listo · HUD horizontal · editor de controles · recetario y saberes · ' +
    'reparación de roturas · talleres públicos · ' + D.HELP.length + ' secciones de ayuda · sin emojis');
};
UI.dispose = function () {
  if (UI._tipTimer) clearInterval(UI._tipTimer);
  UI._tipTimer = 0;
  if (UI._orT) clearTimeout(UI._orT);
  UI._orT = 0;
  if (UI._editor && UI._editor.parentNode) UI._editor.parentNode.removeChild(UI._editor);
  UI._editor = null;
  CR.Bindings.removeOwner('ui');
  UI._qs = null;
  UI.ready = false;
};
})();