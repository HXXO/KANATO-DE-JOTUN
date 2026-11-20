/* ============================================================
KANATO DE JOTUN · entities.js v4 — PARTE 1/3
(CONCATENAR: Parte 1 + Parte 2 + Parte 3 en un solo archivo)
Cambios v4:
· Kit inicial: SOLO pico y hacha de piedra (mejora 6).
· Las herramientas NO se destruyen: al llegar a 0 quedan
  ROTAS (dur 0) y se reparan barato desde el inventario (mejora 6).
· Nivel global: además de puntos de rama, sube estadísticas base
  y da PUNTOS DE RECETA para aprender recetas de tu Tier (mejora 4).
· Recetas por Tier (1-10 / 11-30 / 31+): gateado por nivel.
Mantiene todo lo v3: canales de combate, apuntado pegajoso, IA
ecológica, bosses por fases, tameo, monturas, trabajadores.
============================================================ */
(function () {
'use strict';
const CR = window.CR;
if (!CR || !CR.DATA || !CR.World) { console.error('[CR] entities.js requiere core, data y world'); return; }
const U = CR.util, C = CR.CONFIG, D = CR.DATA, B = D.BAL, W = CR.World, Bus = CR.Bus;
/* Audio perezoso: funciona aunque audio.js cargue después de este archivo */
const A = new Proxy({}, { get: function (_, k) {
  const a = CR.Audio;
  if (!a) return function () {};
  const v = a[k];
  return typeof v === 'function' ? v.bind(a) : v;
} });
const sin = Math.sin, cos = Math.cos, PI = Math.PI;

/* ==========================================================
1 · POOL DE ENTIDADES
========================================================== */
const _free = [];
function blankCB() {
  return { dmg: 0, def: 0, reach: 1, cd: 0, combo: 0, comboT: 0, iframe: 0,
    poison: 0, poisonT: 0, burn: 0, burnT: 0, bleed: 0, bleedT: 0,
    slow: 0, slowT: 0, stagger: 0, guard: 0 };
}
function blankAI() {
  return { state: 'idle', t: 0, phase: 0, target: null, prey: null, threat: null,
    home: { x: 0, y: 0 }, path: null, pi: 0, wanderT: 0, wx: 0, wy: 0, hasW: false,
    leash: 12, zone: null, rest: 0, burst: 0, mv: null, mvT: 0, mvPhase: '',
    giveup: 0, routeI: 0, route: null, atPost: true, perch: true, workT: 0,
    summonCd: 0, healOnce: false, bond: 0, calm: 0, ease: 0, scaredT: 0, curious: false,
    tl: null, tn: null };
}
function blankTG() {
  return { dead: false, persist: false, baby: false, tamed: false, owner: null,
    mountable: false, mounted: false, flying: false, saddle: null, petArmor: 0,
    growDay: 0, tameProgress: 0, sedated: 0, level: 1, hostile: false, boss: false,
    livestock: false, ready: null, ready2: null, prodT: 0, fed: 0, feedQ: null,
    role: 'idle', child: false, stage: 'adult', angry: false, respawnDay: 0,
    scale: 1, tint: '#fff', zone: null, faction: 'neutral', diet: 'none',
    guardian: null, wanderer: false, hunter: false, lastProduct: 0, deposit: null,
    elite: false, flyer: false, fireproof: false, iceproof: false,
    order: 'follow', ox: 0, oy: 0, otk: 'player', otid: 0, taskT: 0, alertT: 0 };
}
function blank() {
  return {
    id: 0, type: '', species: null, npcId: null, name: '', gender: 'm',
    t: { x: 0, y: 0, px: 0, py: 0, ang: 0, dir: 0 },
    v: { x: 0, y: 0 }, vx: 0, vy: 0,
    st: { hp: 1, maxHp: 1, st: 100, maxSt: 100, food: 100, maxFood: 100 },
    cb: blankCB(), ai: blankAI(), tg: blankTG(),
    an: { walk: 0, hurt: 0, atk: 0, bob: 0, spawn: 0, block: 0, draw: 0, tele: 0 }
  };
}
function reset(e) {
  e.id = 0; e.type = ''; e.species = null; e.npcId = null; e.name = ''; e.gender = 'm';
  e.t.x = e.t.y = e.t.px = e.t.py = 0; e.t.ang = 0; e.t.dir = 0;
  e.v.x = e.v.y = 0; e.vx = 0; e.vy = 0;
  e.st.hp = e.st.maxHp = 1; e.st.st = e.st.maxSt = 100; e.st.food = e.st.maxFood = 100;
  const cb = e.cb; for (const k in cb) cb[k] = 0; cb.reach = 1;
  const ai = e.ai;
  ai.state = 'idle'; ai.t = 0; ai.phase = (Math.random() * 8) | 0; ai.target = null;
  ai.prey = null; ai.threat = null; ai.home.x = ai.home.y = 0; ai.path = null; ai.pi = 0;
  ai.wanderT = 0; ai.wx = ai.wy = 0; ai.hasW = false; ai.leash = 12; ai.zone = null;
  ai.rest = 0; ai.burst = 0; ai.mv = null; ai.mvT = 0; ai.mvPhase = ''; ai.giveup = 0;
  ai.routeI = 0; ai.route = null; ai.atPost = true; ai.perch = true; ai.workT = 0;
  ai.summonCd = 0; ai.healOnce = false; ai.bond = 0; ai.calm = 0; ai.ease = 0; ai.scaredT = 0; ai.curious = false; ai.tl = null; ai.tn = null;
  const tg = e.tg;
  tg.dead = false; tg.persist = false; tg.baby = false; tg.tamed = false; tg.owner = null;
  tg.mountable = false; tg.mounted = false; tg.flying = false; tg.saddle = null; tg.petArmor = 0;
  tg.growDay = 0; tg.tameProgress = 0; tg.sedated = 0; tg.level = 1; tg.hostile = false;
  tg.boss = false; tg.livestock = false; tg.ready = null; tg.ready2 = null; tg.prodT = 0;
  tg.fed = 0; tg.feedQ = null; tg.role = 'idle'; tg.child = false; tg.stage = 'adult';
  tg.angry = false; tg.respawnDay = 0; tg.scale = 1; tg.tint = '#fff'; tg.zone = null;
  tg.faction = 'neutral'; tg.diet = 'none'; tg.guardian = null; tg.wanderer = false;
  tg.hunter = false; tg.lastProduct = 0; tg.deposit = null; tg.elite = false;
  tg.flyer = false; tg.fireproof = false; tg.iceproof = false;
  tg.order = 'follow'; tg.ox = 0; tg.oy = 0; tg.otk = 'player'; tg.otid = 0; tg.taskT = 0; tg.alertT = 0;
  e.an.walk = 0; e.an.hurt = 0; e.an.atk = 0; e.an.bob = 0; e.an.spawn = 0.35;
  e.an.block = 0; e.an.draw = 0; e.an.tele = 0;
  return e;
}
function alloc() { const e = _free.pop(); return e ? reset(e) : reset(blank()); }
function release(e) { if (_free.length < 260) _free.push(e); }

/* ==========================================================
2 · ESTADO DEL GESTOR
========================================================== */
const E = CR.Ent = {
  list: [], byId: new Map(), player: null,
  hazards: [], projectiles: [], loot: [], day: 1, heat: 0, hitstop: 0,
  bossState: {}, CAP: B.CAP || 230, WILD_CAP: B.WILD_CAP || 88,
  _spawnT: 0, _campT: 0, _uid: 0, _frame: 0,
  _q1: [], _q2: [], _q3: [], _q4: []
};
const projPool = new CR.Pool(
  function () { return { x: 0, y: 0, px: 0, py: 0, vx: 0, vy: 0, life: 0, dmg: 0, r: 0.3,
    type: 'rock', hostile: true, owner: null, effect: null, pierce: 0,
    ammo: null, crit: false, hitIds: [] }; },
  function (p) { p.life = 0; p.owner = null; p.dmg = 0; p.vx = p.vy = 0; p.effect = null;
    p.pierce = 0; p.ammo = null; p.crit = false; p.hitIds.length = 0; },
  32, 128
);
E.aim = { kind: null, ref: null, x: 0, y: 0, r: 0.5, inRange: false, valid: true,
  lock: null, lockT: 0, node: null, mode: 'melee', draw: 0, cands: [], cycleI: 0 };
E.hitMark = { ref: null, id: 0, t: 0, focusT: 0, crit: false, dmg: 0, lag: 1 };
E.nodeHit = { node: null, t: 0, focusT: 0 };
const _qAim = [], _cands = [];
let _missCd = 0;
const LOOT_LIFE = 150, BAG_LIFE = 210, LOOT_CAP = 110;
function toast(m, c) { Bus.emit('toast', { msg: m, cls: c || '' }); }
function fx(k, x, y, ex) { Bus.emit('fx', { kind: k, x: x, y: y, extra: ex || null }); }
function floater(x, y, t, c) { Bus.emit('floater', { x: x, y: y, text: t, color: c || '#fff' }); }
function shake(a) { Bus.emit('shake', { amt: a }); }
function sfxAt(n, x, y) { const p = E.player; if (p) A.playAt(n, x, y, p.t.x, p.t.y); else A.play(n); }
function rngAI() { return CR.streams ? CR.streams.ai : CR.RNG(7); }
function rngLoot() { return CR.streams ? CR.streams.loot : CR.RNG(3); }
function rngFx() { return CR.streams ? CR.streams.fx : CR.RNG(11); }

/* ==========================================================
3 · INVENTARIO, EQUIPO Y ROTURAS (mejora 6)
========================================================== */
const EQUIP_SLOTS = ['weapon', 'tool', 'shield', 'head', 'chest', 'legs',
  'ring', 'belt', 'amulet', 'charm', 'bag1', 'bag2', 'bag3', 'quiver'];
E.EQUIP_SLOTS = EQUIP_SLOTS;
function hasTag(def, tag) {
  if (!def) return false;
  if (def.tags && def.tags.indexOf(tag) >= 0) return true;
  if (tag === 'fish') return def.cat === 'fish';
  if (tag === 'fuel') return !!def.fuel;
  if (tag === 'herbany') return def.id === 'herb' || def.id === 'crop_herb';
  return def.cat === tag;
}
/** v4: un objeto con durabilidad 0 está ROTO: permanece en el equipo/mochila. */
function isBroken(s) { return !!(s && s.dur !== undefined && s.dur <= 0); }
E.isBroken = isBroken;

/* Punto caminable libre cerca de (x, y); se usa al invocar, desmontar y reaparecer */
E.freeSpotNear = function (x, y, r) {
  r = Math.max(1, r || 1);
  if (W.walkable(Math.floor(x), Math.floor(y), false)) return { x: x, y: y };
  for (let rad = 0.7; rad <= r + 4; rad += 0.7) {
    const steps = Math.max(8, Math.round(rad * 8));
    for (let k = 0; k < steps; k++) {
      const a = (k / steps) * Math.PI * 2;
      const nx = x + Math.cos(a) * rad, ny = y + Math.sin(a) * rad;
      if (W.walkable(Math.floor(nx), Math.floor(ny), false)) return { x: nx, y: ny };
    }
  }
  return { x: x, y: y };
};

/* Busca un alojamiento propio (gallinero, corral, granero) con hueco para la especie */
E.findPenSpace = function (p, species) {
  const bl = W.buildings;
  for (let i = 0; i < bl.length; i++) {
    const b = bl[i];
    if (b.owner !== 'player') continue;
    const bd = D.BUILDINGS[b.key];
    if (!bd || !bd.functions || bd.functions.indexOf('livestock') < 0) continue;
    if (bd.accepts && bd.accepts.indexOf(species) < 0) continue;
    let n = 0;
    for (let k = 0; k < E.list.length; k++) {
      const a = E.list[k];
      if (a.tg.dead || a.tg.owner !== 'player') continue;
      if (a.t.x >= b.x - 0.5 && a.t.x <= b.x + b.w + 0.5 && a.t.y >= b.y - 0.5 && a.t.y <= b.y + b.h + 0.5) n++;
    }
    if (n >= (bd.cap || 0)) continue;
    const spot = E.freeSpotNear(b.x + b.w / 2, b.y + b.h / 2, Math.max(b.w, b.h));
    return { x: spot.x, y: spot.y, uid: b.uid };
  }
  return null;
};
function maxDurOf(def) {
  if (!def) return 0;
  if (def.tool) return def.tool.dur;
  if (def.weapon) return def.weapon.dur;
  if (def.shield) return def.shield.dur;
  return 0;
}
E.maxDurOf = maxDurOf;

const Inv = E.Inv = {
  slots(p) {
    let n = B.INV_SLOTS || 24;
    for (let i = 1; i <= 3; i++) {
      const b = p.equip['bag' + i];
      if (b && D.ITEMS[b.id] && D.ITEMS[b.id].bag) n += (D.ITEMS[b.id].bag.slots || 0);
    }
    return n;
  },
  resize(p) {
    const n = Inv.slots(p);
    while (p.inv.length < n) p.inv.push(null);
    if (p.inv.length > n) {
      for (let i = n; i < p.inv.length; i++) {
        const s = p.inv[i];
        if (s) { p.inv[i] = null; Inv.add(p, s.id, s.n, s.q, s.dur); }
      }
      p.inv.length = n;
    }
  },
  count(p, id) { let n = 0; for (let i = 0; i < p.inv.length; i++) { const s = p.inv[i]; if (s && s.id === id) n += s.n; } return n; },
  countTag(p, tag) { let n = 0; for (let i = 0; i < p.inv.length; i++) { const s = p.inv[i]; if (s && hasTag(D.ITEMS[s.id], tag)) n += s.n; } return n; },
  find(p, id) { for (let i = 0; i < p.inv.length; i++) { const s = p.inv[i]; if (s && s.id === id) return i; } return -1; },
  findUsable(p, id) { for (let i = 0; i < p.inv.length; i++) { const s = p.inv[i]; if (s && s.id === id && !isBroken(s)) return i; } return -1; },
  firstEmpty(p) { for (let i = 0; i < p.inv.length; i++) if (!p.inv[i]) return i; return -1; },
  add(p, id, n, q, dur) {
    const def = D.ITEMS[id];
    if (!def || n <= 0) return n | 0;
    q = q | 0;
    let left = n | 0;
    const max = def.stack === undefined ? 99 : def.stack;
    if (max > 1) {
      for (let i = 0; i < p.inv.length && left > 0; i++) {
        const s = p.inv[i];
        if (s && s.id === id && (s.q | 0) === q && s.n < max && s.dur === undefined) {
          const take = Math.min(max - s.n, left); s.n += take; left -= take;
        }
      }
    }
    while (left > 0) {
      const i = Inv.firstEmpty(p);
      if (i < 0) break;
      const take = Math.min(max, left);
      const slot = { id: id, n: take, q: q };
      if (dur !== undefined && dur !== null) slot.dur = dur;
      else { const md = maxDurOf(def); if (md) slot.dur = md; }
      p.inv[i] = slot; left -= take;
    }
    if (left < n) Bus.emit('loot', { id: id, n: n - left, q: q });
    return left;
  },
  remove(p, id, n) {
    if (Inv.count(p, id) < n) return false;
    let left = n;
    for (let i = p.inv.length - 1; i >= 0 && left > 0; i--) {
      const s = p.inv[i];
      if (!s || s.id !== id) continue;
      const take = Math.min(s.n, left); s.n -= take; left -= take;
      if (s.n <= 0) p.inv[i] = null;
    }
    return true;
  },
  removeTag(p, tag, n) {
    if (Inv.countTag(p, tag) < n) return false;
    let left = n;
    for (let i = p.inv.length - 1; i >= 0 && left > 0; i--) {
      const s = p.inv[i];
      if (!s || !hasTag(D.ITEMS[s.id], tag)) continue;
      const take = Math.min(s.n, left); s.n -= take; left -= take;
      if (s.n <= 0) p.inv[i] = null;
    }
    return true;
  },
  removeAt(p, i, n) {
    const s = p.inv[i]; if (!s) return false;
    const take = Math.min(s.n, n === undefined ? s.n : n);
    s.n -= take; if (s.n <= 0) p.inv[i] = null;
    return true;
  },
  fuel(p) {
    let n = 0;
    for (let i = 0; i < p.inv.length; i++) {
      const s = p.inv[i]; if (!s) continue;
      const def = D.ITEMS[s.id];
      if (def && def.fuel) n += s.n * def.fuel;
    }
    return n;
  },
  burnFuel(p, units) {
    if (Inv.fuel(p) < units) return false;
    let left = units;
    const order = ['wood', 'coal', 'charcoal'];
    for (let k = 0; k < order.length && left > 0; k++) {
      const id = order[k], def = D.ITEMS[id];
      if (!def || !def.fuel) continue;
      const have = Inv.count(p, id);
      if (!have) continue;
      const need = Math.ceil(left / def.fuel);
      const use = Math.min(have, need);
      Inv.remove(p, id, use);
      left -= use * def.fuel;
    }
    return left <= 0;
  }
};

/* ---------- Desgaste v4: rompe sin borrar ---------- */
function wearSlot(p, s, equipKey, n) {
  if (!s || s.dur === undefined || s.dur <= 0) return;
  s.dur = Math.max(0, s.dur - (n || 1));
  if (s.dur === 0) {
    const def = D.ITEMS[s.id];
    toast((def ? def.name : 'Objeto') + ' se ha ROTO. Sigue en tu equipo: repárala desde el inventario.', 'bad');
    A.play('error');
    Bus.emit('broke', { id: s.id, slot: equipKey });
    E.recalc(p);
  }
}
E.wearSlot = wearSlot;
E.wearTool = function (p, n) { wearSlot(p, p.equip.tool, 'tool', n); };
E.wearWeapon = function (p, n) { wearSlot(p, p.equip.weapon, 'weapon', n); };
E.wearShield = function (p, n) { wearSlot(p, p.equip.shield, 'shield', n); };

/* ---------- Reparación barata (mejora 6) ---------- */
const REPAIR_DEFAULT = {
  stone: { stone: 2, wood: 1 }, copper: { copper_bar: 1, wood: 1 },
  iron: { iron_bar: 1, wood: 1 }, steel: { steel_bar: 1, wood: 1 },
  obsidian: { obsidian_bar: 1, wood: 1 }, mithril: { mithril_bar: 1, wood: 1 },
  adamantite: { adamantite_bar: 1, wood: 1 }
};
function repairCostFor(id) {
  const def = D.ITEMS[id];
  if (!def) return null;
  if (def.repair) return def.repair;
  const pre = String(id).split('_')[0];
  if (REPAIR_DEFAULT[pre]) return REPAIR_DEFAULT[pre];
  if (def.shield) return { wood: 2, hide: 1 };
  if (def.weapon || def.tool) return { wood: 2, fiber: 2 };
  return { wood: 1, fiber: 1 };
}
E.repairCostFor = repairCostFor;
function repairCan(p, id) {
  const cost = repairCostFor(id);
  const miss = [];
  for (const k in cost) if (Inv.count(p, k) < cost[k]) miss.push(k);
  return { cost: cost, can: miss.length === 0, missing: miss };
}
function doRepair(p, id, setter) {
  const chk = repairCan(p, id);
  if (!chk.can) {
    const names = chk.missing.map(function (m) { return D.ITEMS[m] ? D.ITEMS[m].name : m; }).join(', ');
    toast('Falta para reparar: ' + names, 'bad');
    A.play('error');
    return { ok: false, msg: 'Faltan materiales: ' + names };
  }
  for (const k in chk.cost) Inv.remove(p, k, chk.cost[k]);
  const def = D.ITEMS[id];
  setter(maxDurOf(def));
  E.recalc(p);
  A.play('craft');
  fx('spark', p.t.x, p.t.y);
  toast(def.name + ' reparada al 100 %.', 'good');
  Bus.emit('repaired', { id: id });
  return { ok: true, msg: def.name + ' reparada.' };
}
/** Repara una ranura de la mochila (idx). */
E.repairInvSlot = function (p, idx) {
  const s = p.inv[idx];
  if (!s || s.dur === undefined) return { ok: false, msg: 'Nada que reparar.' };
  if (s.dur >= maxDurOf(D.ITEMS[s.id])) return { ok: false, msg: 'Ya está en perfecto estado.' };
  return doRepair(p, s.id, function (max) { s.dur = max; });
};
/** Repara un slot equipado ('weapon'|'tool'|'shield'|...). */
E.repairEquip = function (p, key) {
  const s = p.equip[key];
  if (!s || s.dur === undefined) return { ok: false, msg: 'Nada que reparar.' };
  if (s.dur >= maxDurOf(D.ITEMS[s.id])) return { ok: false, msg: 'Ya está en perfecto estado.' };
  return doRepair(p, s.id, function (max) { s.dur = max; });
};
/** Información de reparación para la UI: {broken, cost, can, missing, dur, max}. */
E.repairInfo = function (p, ref) {
  let s = null;
  if (typeof ref === 'number') s = p.inv[ref];
  else s = p.equip[ref];
  if (!s || s.dur === undefined) return null;
  const def = D.ITEMS[s.id];
  const max = maxDurOf(def);
  const chk = repairCan(p, s.id);
  return { id: s.id, name: def.name, broken: s.dur <= 0, dur: s.dur, max: max,
    cost: chk.cost, can: chk.can, missing: chk.missing };
};

/* ==========================================================
4 · NIVEL, OFICIOS, TIERS Y RECETAS (mejora 4)
========================================================== */
const TRADES = ['mining', 'woodcut', 'fishing', 'farming', 'combat', 'cooking', 'crafting'];
E.TRADES = TRADES; E.SKILLS = TRADES;
const TRADE_NAME = { mining: 'Minería', woodcut: 'Tala', fishing: 'Pesca', farming: 'Agricultura',
  combat: 'Combate', cooking: 'Cocina', crafting: 'Oficio' };
E.skillName = function (s) { return TRADE_NAME[s] || s; };
E.levelOf = function (p, trade) {
  const s = p.xp[trade]; if (!s) return 0;
  const tbl = B.TRADE_TABLE || B.XP_TABLE || [0];
  let lv = 0;
  for (let i = 0; i < tbl.length; i++) if (s.xp >= tbl[i]) lv = i;
  return Math.min(tbl.length - 1, lv);
};
E.globalLevel = function (p) { return p.lvl ? p.lvl.level : 1; };
E.skillVal = function (p, key) {
  if (!p.lvl || !D.SKILLS) return 0;
  let v = 0;
  for (let i = 0; i < D.SKILLS.length; i++) {
    const sk = D.SKILLS[i], n = p.lvl.alloc[sk.id] || 0;
    if (n && sk.per && sk.per[key] !== undefined) v += sk.per[key] * n;
  }
  return v;
};
E.unlocked = function (p, skillId, n) { return (p.lvl && (p.lvl.alloc[skillId] || 0)) >= n; };

/* --- Tiers de recetas por nivel (mejora 4) --- */
function tierBounds() { return B.TIER_BOUNDS || [10, 30, 40]; }
E.tierOfLevel = function (lv) {
  const b = tierBounds();
  if (lv <= b[0]) return 1;
  if (lv <= b[1]) return 2;
  return 3;
};
E.playerTier = function (p) { return E.tierOfLevel(p.lvl ? p.lvl.level : 1); };
function recipeTier(r) {
  if (r.tier) return r.tier;
  const lv = (r.req && r.req.lv) || 1;
  return E.tierOfLevel(lv);
}
E.recipeTier = recipeTier;
/** ¿Está una receta disponible para el jugador? (Tier + aprendizaje elegido) */
E.recipeUnlocked = function (p, r) {
  if (!r) return { ok: false, why: 'recipe' };
  const tier = recipeTier(r);
  if (tier > E.playerTier(p)) return { ok: false, why: 'tier', tier: tier };
  if (r.station === 'hand' || r.learn === false) return { ok: true, why: '' };
  if (r.learn === true || r.learn === 1) {
    return (p.lvl.known && p.lvl.known[r.id]) ? { ok: true, why: '' } : { ok: false, why: 'learn', tier: tier };
  }
  return { ok: true, why: '' };
};
/** Aprende una receta marcable con 1 punto de receta. */
E.learnRecipe = function (p, recipeId) {
  let r = null;
  for (let i = 0; i < D.RECIPES.length; i++) if (D.RECIPES[i].id === recipeId) { r = D.RECIPES[i]; break; }
  if (!r) return { ok: false, msg: 'Receta desconocida.' };
  if (p.lvl.known && p.lvl.known[r.id]) return { ok: false, msg: 'Ya la conoces.' };
  const tier = recipeTier(r);
  if (tier > E.playerTier(p)) return { ok: false, msg: 'Requiere Tier ' + tier + ' (nivel ' + (tier === 2 ? (tierBounds()[0] + 1) : (tierBounds()[1] + 1)) + '+).' };
  if (!(r.learn === true || r.learn === 1)) return { ok: false, msg: 'Esta receta se desbloquea sola con tu Tier.' };
  if ((p.lvl.rp || 0) <= 0) return { ok: false, msg: 'Sin puntos de receta: sube de nivel.' };
  p.lvl.rp--;
  if (!p.lvl.known) p.lvl.known = {};
  p.lvl.known[r.id] = 1;
  const out = D.ITEMS[r.out.id];
  A.play('levelup');
  toast('Receta aprendida: ' + (out ? out.name : r.id), 'gold');
  Bus.emit('recipe:learned', { id: r.id });
  return { ok: true, msg: 'Receta aprendida.' };
};

E.addXP = function (p, trade, amount) {
  if (!p || amount <= 0) return;
  let amt = amount;
  if (p.buffs && p.buffs.bless > 0) amt *= (1 + (B.BLESS_XP || 0.1));
  if (p.xp[trade]) {
    const before = E.levelOf(p, trade);
    p.xp[trade].xp += amt;
    const after = E.levelOf(p, trade);
    if (after > before) {
      A.play('levelup');
      toast('¡' + E.skillName(trade) + ' nivel ' + after + '!', 'gold');
      fx('levelup', p.t.x, p.t.y);
      Bus.emit('levelup', { skill: trade, level: after });
    }
  }
  if (!p.lvl) return;
  const lv0 = p.lvl.level;
  p.lvl.xp += amt;
  p.lvl.level = D.levelFromXP ? D.levelFromXP(p.lvl.xp) : p.lvl.level;
  if (p.lvl.level > lv0) {
    const gained = p.lvl.level - lv0;
    const pts = (D.pointsForLevel ? D.pointsForLevel(p.lvl.level) : p.lvl.level) -
                (D.pointsForLevel ? D.pointsForLevel(lv0) : lv0);
    p.lvl.points += pts;
    /* v4: cada nivel da 1 punto de receta para elegir qué aprender */
    p.lvl.rp = (p.lvl.rp || 0) + gained;
    A.play('freedom');
    fx('legend', p.t.x, p.t.y);
    Bus.emit('banner', { title: 'NIVEL ' + p.lvl.level,
      sub: '+' + pts + ' habilidad · +' + gained + ' punto(s) de receta · Tier ' + E.playerTier(p) });
    toast('Nivel ' + p.lvl.level + ': +' + pts + ' puntos de rama, +' + gained + ' de receta. Tus estadísticas base suben.', 'gold');
    Bus.emit('globallevel', { level: p.lvl.level, points: p.lvl.points, rp: p.lvl.rp });
  }
  E.recalc(p);
  Bus.emit('xp', { skill: trade, amount: amt, level: p.lvl.level });
};
E.allocPoint = function (p, skillId) {
  const sk = D.SKILL_BY_ID ? D.SKILL_BY_ID[skillId] : null;
  if (!sk) return { ok: false, msg: 'Rama desconocida.' };
  if (p.lvl.points <= 0) return { ok: false, msg: 'No tienes puntos libres.' };
  const cur = p.lvl.alloc[skillId] || 0;
  if (cur >= sk.max) return { ok: false, msg: sk.name + ' ya está al máximo.' };
  p.lvl.alloc[skillId] = cur + 1;
  p.lvl.points--;
  E.recalc(p);
  A.play('levelup');
  const un = sk.unlocks ? sk.unlocks[cur + 1] : null;
  toast(sk.name + ' ' + (cur + 1) + (un ? ' · ' + un : ''), 'gold');
  Bus.emit('alloc', { skill: skillId, value: cur + 1 });
  return { ok: true, msg: sk.name + ' mejorada.' };
};
E.respec = function (p) {
  let spent = 0;
  for (let i = 0; i < D.SKILLS.length; i++) { spent += p.lvl.alloc[D.SKILLS[i].id] || 0; p.lvl.alloc[D.SKILLS[i].id] = 0; }
  p.lvl.points += spent;
  E.recalc(p);
  A.play('close');
  return { ok: true, msg: 'Reparto reiniciado: ' + spent + ' puntos libres.' };
};

/* ==========================================================
5 · RECÁLCULO DE ESTADÍSTICAS (nivel + equipo, roto no cuenta)
========================================================== */
E.recalc = function (p) {
  if (!p || !p.equip) return;
  let def = 0, hpB = 0, stB = 0, regen = 0, luck = 0, crit = 0, spd = 0, rollCd = 0, drawB = 0, meleeB = 0;
  let tameB = 0, petB = 0, stealth = 0, iceRes = 0, slowAura = 0;
  for (let i = 0; i < EQUIP_SLOTS.length; i++) {
    const s = p.equip[EQUIP_SLOTS[i]];
    if (!s || isBroken(s)) continue;              /* v4: lo roto no aporta */
    const d2 = D.ITEMS[s.id];
    if (!d2) continue;
    if (d2.armor) def += d2.armor.def;
    if (d2.shield) def += d2.shield.def;
    const a = d2.acc;
    if (a) {
      if (a.hp) hpB += a.hp; if (a.st) stB += a.st; if (a.def) def += a.def;
      if (a.regen) regen += a.regen; if (a.luck) luck += a.luck; if (a.crit) crit += a.crit;
      if (a.speed) spd += a.speed; if (a.rollCd) rollCd += a.rollCd;
      if (a.draw) drawB += a.draw; if (a.melee) meleeB += a.melee;
      if (a.tame) tameB += a.tame; if (a.petDmg) petB += a.petDmg;
      if (a.stealth) stealth += a.stealth; if (a.iceRes) iceRes += a.iceRes;
      if (a.slowAura) slowAura += a.slowAura;
    }
  }
  const sv = function (k) { return E.skillVal(p, k); };
  /* v4: estadísticas base que crecen con el nivel (mejora 4) */
  const lv = p.lvl ? p.lvl.level : 1;
  const hpPer = B.HP_PER_LEVEL === undefined ? 3 : B.HP_PER_LEVEL;
  const stPer = B.ST_PER_LEVEL === undefined ? 2 : B.ST_PER_LEVEL;
  def += sv('def') + Math.floor((lv - 1) * (B.DEF_PER_LEVEL === undefined ? 0.5 : B.DEF_PER_LEVEL));
  p.cb.def = Math.round(def);
  p.regen = regen + (B.REGEN_BASE || 0.35);
  p.luck = luck; p.stealth = U.clamp(stealth, 0, 0.7);
  p.iceRes = U.clamp(iceRes, 0, 0.8); p.slowAura = slowAura;
  p.critChance = U.clamp((B.CRIT || 0.1) + crit + luck * 0.5, 0, 0.6);
  p.speedMul = 1 + sv('speed') + spd;
  p.meleeMul = 1 + sv('melee') + meleeB + E.levelOf(p, 'combat') * (B.XP_LEVEL_BONUS || B.LEVEL_BONUS || 0.035);
  p.rangedMul = 1 + sv('ranged');
  p.drawMul = U.clamp(1 + sv('draw') + drawB, 0.35, 1.4);
  p.tameMul = 1 + sv('tame') + tameB;
  p.petDmgMul = 1 + sv('petDmg') + petB;
  p.rollCdBase = Math.max(0.3, (B.ROLL_CD || 0.85) * (1 + sv('rollCd')) + rollCd);
  p.stRegen = (B.ST_REGEN_IDLE || 7.5) + sv('stRegen');

  const shSlot = p.equip.shield;
  const sh = (shSlot && !isBroken(shSlot)) ? D.ITEMS[shSlot.id] : null;
  p.shield = (sh && sh.shield) ? sh.shield : null;
  p.blockReduce = p.shield ? U.clamp(p.shield.reduce + sv('block'), 0, 0.95) : 0;
  p.parryWindow = p.shield ? (p.shield.parry + sv('parry')) : 0;

  const newHp = Math.round((B.HP || 100) + (lv - 1) * hpPer + sv('hp') + hpB);
  if (newHp !== p.st.maxHp) {
    const r = p.st.hp / Math.max(1, p.st.maxHp);
    p.st.maxHp = newHp; p.st.hp = U.clamp(Math.round(newHp * r), 1, newHp);
  }
  const newSt = Math.round((B.ST || 100) + (lv - 1) * stPer + sv('st') + stB);
  if (newSt !== p.st.maxSt) {
    const r = p.st.st / Math.max(1, p.st.maxSt);
    p.st.maxSt = newSt; p.st.st = U.clamp(Math.round(newSt * r), 0, newSt);
  }
  const wSlot = p.equip.weapon;
  const w = (wSlot && !isBroken(wSlot)) ? D.ITEMS[wSlot.id] : null;
  p.weapon = (w && w.weapon) ? w.weapon : null;
  p.isBow = !!(p.weapon && (p.weapon.kind === 'bow' || p.weapon.kind === 'crossbow'));
  p.cb.dmg = Math.round(((p.weapon ? p.weapon.dmg : 4) + Math.floor((lv - 1) * 0.5)) * p.meleeMul);
  p.cb.reach = p.weapon ? p.weapon.reach : 1.0;
  Inv.resize(p);
};
E.equipFromSlot = function (p, i) {
  const s = p.inv[i];
  if (!s) return { ok: false, msg: 'Ranura vacía.' };
  const def = D.ITEMS[s.id];
  if (!def) return { ok: false, msg: 'Objeto desconocido.' };
  if (isBroken(s)) return { ok: false, msg: def.name + ' está ROTA. Repárala primero.' };
  let slot = null;
  if (def.weapon) slot = 'weapon';
  else if (def.shield) slot = 'shield';
  else if (def.tool) slot = 'tool';
  else if (def.armor) slot = def.armor.slot;
  else if (def.acc) slot = def.acc.slot;
  else if (def.bag) {
    if (def.bag.ammo) slot = 'quiver';
    else { for (let k = 1; k <= 3; k++) if (!p.equip['bag' + k]) { slot = 'bag' + k; break; } }
    if (!slot) return { ok: false, msg: 'No tienes hueco de mochila libre.' };
  }
  if (!slot) return { ok: false, msg: 'Eso no se equipa.' };
  const prev = p.equip[slot];
  p.equip[slot] = { id: s.id, dur: s.dur };
  p.inv[i] = null;
  if (prev) Inv.add(p, prev.id, 1, 0, prev.dur);
  E.recalc(p);
  if (slot === 'weapon') E.autoAmmo(p);
  A.play('open');
  Bus.emit('equip', { slot: slot, id: s.id });
  return { ok: true, msg: def.name + ' equipado.' };
};
E.unequip = function (p, slot) {
  const s = p.equip[slot];
  if (!s) return false;
  if (Inv.firstEmpty(p) < 0) { toast('Inventario lleno.', 'bad'); return false; }
  p.equip[slot] = null;
  Inv.add(p, s.id, 1, 0, s.dur);
  E.recalc(p); A.play('close');
  Bus.emit('equip', { slot: slot, id: null });
  return true;
};

/* ==========================================================
6 · MUNICIONES
========================================================== */
E.ammoList = function (p) {
  const fits = p.weapon && p.weapon.ammo ? p.weapon.ammo : 'arrow';
  const out = [];
  for (let i = 0; i < p.inv.length; i++) {
    const s = p.inv[i]; if (!s) continue;
    const def = D.ITEMS[s.id];
    if (!def || !def.ammo || def.ammo.fits !== fits) continue;
    let found = false;
    for (let k = 0; k < out.length; k++) if (out[k].id === s.id) { out[k].n += s.n; found = true; break; }
    if (!found) out.push({ id: s.id, n: s.n, name: def.name, kind: def.ammo.kind, dmg: def.ammo.dmg, effect: def.ammo.effect });
  }
  return out;
};
E.autoAmmo = function (p) {
  const list = E.ammoList(p);
  if (!list.length) { p.ammoId = null; return; }
  for (let i = 0; i < list.length; i++) if (list[i].id === p.ammoId) return;
  p.ammoId = list[0].id;
};
E.cycleAmmo = function (p) {
  const list = E.ammoList(p);
  if (!list.length) { toast('No llevas munición compatible.', 'bad'); A.play('error'); return; }
  let i = 0;
  for (let k = 0; k < list.length; k++) if (list[k].id === p.ammoId) { i = k; break; }
  p.ammoId = list[(i + 1) % list.length].id;
  const def = D.ITEMS[p.ammoId];
  A.play('click');
  toast('Munición: ' + def.name + ' (' + Inv.count(p, p.ammoId) + ')', 'good');
  Bus.emit('ammo', { id: p.ammoId });
};
E.ammoInfo = function (p) {
  if (!p.ammoId) return null;
  const def = D.ITEMS[p.ammoId];
  if (!def || !def.ammo) return null;
  return { id: p.ammoId, def: def, n: Inv.count(p, p.ammoId), kind: def.ammo.kind, dmg: def.ammo.dmg, effect: def.ammo.effect };
};
/* ==========================================================
8 · CREACIÓN DE ENTIDADES
   v4: el jugador empieza SOLO con pico y hacha de piedra.
========================================================== */
function register(e) { e.id = ++E._uid; E.list.push(e); E.byId.set(e.id, e); return e; }

E.createPlayer = function (name, gender) {
  const p = alloc();
  p.type = 'player';
  p.name = String(name || 'Siervo').slice(0, 16);
  p.gender = gender === 'f' ? 'f' : 'm';
  p.t.x = W.playerStart.x + 0.5; p.t.y = W.playerStart.y + 0.5;
  p.t.px = p.t.x; p.t.py = p.t.y; p.t.ang = PI / 2;
  p.st.maxHp = B.HP; p.st.hp = B.HP;
  p.st.maxSt = B.ST; p.st.st = B.ST;
  p.st.maxFood = B.FOOD; p.st.food = B.FOOD;
  p.tg.persist = true; p.tg.scale = 1;
  p.tg.tint = p.gender === 'f' ? '#d8a0b8' : '#a8c0d8';
  p.tg.faction = 'player'; p.tg.diet = 'omnivore';
  p.ai.home.x = p.t.x; p.ai.home.y = p.t.y;
  p.inv = []; p.equip = {};
  for (let i = 0; i < EQUIP_SLOTS.length; i++) p.equip[EQUIP_SLOTS[i]] = null;
  p.quick = [null, null, null, null, null];
  p.xp = {};
  for (let i = 0; i < TRADES.length; i++) p.xp[TRADES[i]] = { xp: 0 };
  /* v4: el estado de progresión incluye saberes (known) y puntos de receta (rp) */
  p.lvl = { xp: 0, level: 1, points: 0, alloc: {}, known: {}, rp: 0 };
  for (let i = 0; i < D.SKILLS.length; i++) p.lvl.alloc[D.SKILLS[i].id] = 0;
  p.gold = 0; p.debt = B.DEBT; p.free = false; p.bank = 0;
  p.buffs = { bless: 0 };
  p.ammoId = null;
  p.ko = false; p.mount = null;
  p.act = null; p.blk = { on: false, t: 0, bashCd: 0 }; p.cast = null;
  p.rollT = 0; p.rollCd = 0; p.rollAng = 0;
  p.foodAcc = 0; p.stepAcc = 0; p.gatherCd = 0;
  p.regenBonus = 0;
  for (let i = 0; i < B.INV_SLOTS; i++) p.inv.push(null);
  /* Ropas de esclavo: vestidas, no entregadas en mochila */
  p.equip.head = { id: 'cloth_head' };
  p.equip.chest = { id: 'cloth_chest' };
  p.equip.legs = { id: 'cloth_legs' };
  /* --- MEJORA 6: pico y hacha de piedra, NADA MÁS --- */
  Inv.add(p, 'pick_stone', 1);
  Inv.add(p, 'axe_stone', 1);
  const ti = Inv.find(p, 'pick_stone');
  if (ti >= 0) { const s = p.inv[ti]; p.equip.tool = { id: s.id, dur: s.dur }; p.inv[ti] = null; }
  p.quick[2] = 'axe_stone'; p.quick[3] = 'pick_stone';
  E.recalc(p);
  E.autoAmmo(p);
  E.player = p;
  register(p);
  return p;
};

E.spawnCreature = function (species, x, y, opts) {
  const sd = D.SPECIES[species];
  if (!sd) return null;
  if (E.list.length >= E.CAP) return null;
  const o = opts || {};
  const e = alloc();
  e.type = sd.kind === 'livestock' ? 'livestock' : 'creature';
  e.species = species; e.name = sd.name;
  e.t.x = x; e.t.y = y; e.t.px = x; e.t.py = y;
  e.t.ang = rngAI().next() * U.TAU;
  e.st.maxHp = sd.hp; e.st.hp = sd.hp;
  e.st.maxSt = (sd.mount ? sd.mount.stam : 100); e.st.st = e.st.maxSt;
  e.cb.dmg = sd.dmg; e.cb.reach = sd.reach; e.cb.def = sd.def || 0;
  e.ai.home.x = x; e.ai.home.y = y;
  e.ai.leash = sd.leash || (sd.kind === 'mythic' ? B.AI_LEASH_MYTH : B.AI_LEASH);
  e.tg.scale = sd.scale; e.tg.tint = sd.tint;
  e.tg.boss = sd.kind === 'boss';
  e.tg.elite = !!sd.elite;
  e.tg.flyer = !!sd.flyer;
  e.tg.fireproof = !!sd.fireproof; e.tg.iceproof = !!sd.iceproof;
  e.tg.diet = sd.diet; e.tg.faction = sd.faction;
  e.tg.hostile = (sd.behavior === 'hostile' || sd.behavior === 'ambush');
  e.tg.persist = !!o.persist || e.tg.boss;
  e.tg.livestock = !!sd.livestock;
  e.tg.owner = o.owner || null;
  e.tg.tamed = !!o.tamed;
  if (sd.zone) {
    for (let i = 0; i < W.zones.length; i++) if (W.zones[i].id === sd.zone) { e.ai.zone = W.zones[i]; e.tg.zone = sd.zone; break; }
    if (e.ai.zone) { e.ai.home.x = e.ai.zone.x; e.ai.home.y = e.ai.zone.y; e.ai.leash = sd.leash || e.ai.zone.leash; }
  }
  if (o.home) { e.ai.home.x = o.home.x; e.ai.home.y = o.home.y; }
  if (sd.guard) { e.tg.guardian = sd.guard.of; e.ai.leash = sd.guard.radius; }
  const rng = rngAI();
  if (sd.baby && !o.tamed && !o.noBaby && rng.chance(sd.baby.chance)) makeBaby(e, sd);
  if (o.baby) makeBaby(e, sd);
  /* Nivel por lejanía de Vhalor (1-6): más vida, daño y comidas de tameo */
  if (!o.tamed && !sd.livestock && sd.kind !== 'boss' && sd.kind !== 'humanoid' && W.city) {
    const cc = W.city, dd = U.len(x - (cc.x + cc.w / 2), y - (cc.y + cc.h / 2));
    const lv = U.clamp(1 + Math.floor(dd / 70) + (rng.chance(0.3) ? 1 : 0), 1, 6);
    e.tg.level = lv;
    if (lv > 1) {
      const m = 1 + 0.13 * (lv - 1);
      e.st.maxHp = Math.round(e.st.maxHp * m); e.st.hp = e.st.maxHp;
      e.cb.dmg = Math.round(e.cb.dmg * m);
      e.name = e.name + ' Nv.' + lv;
    }
  }
  if (o.mountable) { e.tg.mountable = true; e.tg.saddle = species; }
  if (e.tg.tamed) { e.tg.hostile = false; e.ai.state = 'follow'; e.tg.persist = true; e.tg.faction = 'player'; }
  if (e.tg.livestock) { e.ai.state = 'wander'; e.ai.leash = 4; }
  e.ai.rest = rng.range(0.3, 1.4);
  return register(e);
};
function makeBaby(e, sd) {
  if (!sd.baby) return;
  e.tg.baby = true;
  e.tg.scale = sd.scale * sd.baby.scale;
  e.name = sd.baby.name;
  e.st.maxHp = Math.max(6, Math.round(sd.hp * 0.3)); e.st.hp = e.st.maxHp;
  e.cb.dmg = 0; e.tg.hostile = false;
  e.tg.growDay = E.day + sd.baby.days;
}
E.spawnNPCs = function () {
  const ids = Object.keys(D.NPCS);
  for (let i = 0; i < ids.length; i++) {
    const id = ids[i], nd = D.NPCS[id];
    if (nd.wanderer) continue;
    const pos = W.npcSpawns[id];
    if (!pos) continue;
    spawnNpc(id, pos.x + 0.5, pos.y + 0.5);
  }
  for (let i = 0; i < W.guardSpawns.length; i++) {
    const g = W.guardSpawns[i];
    const e = alloc();
    e.type = 'guard'; e.species = 'guard'; e.name = 'Guardia';
    e.t.x = g.x + 0.5; e.t.y = g.y + 0.5; e.t.px = e.t.x; e.t.py = e.t.y;
    const sd = D.SPECIES.guard;
    e.st.maxHp = sd.hp; e.st.hp = sd.hp;
    e.cb.dmg = sd.dmg; e.cb.reach = sd.reach; e.cb.def = sd.def;
    e.ai.home.x = e.t.x; e.ai.home.y = e.t.y; e.ai.leash = sd.guard.radius;
    e.tg.persist = true; e.tg.tint = sd.tint; e.tg.faction = 'guard'; e.tg.diet = 'omnivore';
    e.tg.guardian = 'city';
    e.ai.state = 'guard';
    register(e);
  }
  E.spawnWanderers();
};
function spawnNpc(id, x, y) {
  const nd = D.NPCS[id];
  const e = alloc();
  e.type = 'npc'; e.npcId = id; e.name = nd.name; e.gender = nd.gender;
  e.t.x = x; e.t.y = y; e.t.px = x; e.t.py = y;
  e.st.maxHp = 130; e.st.hp = 130;
  e.cb.dmg = 8; e.cb.reach = 1.15; e.cb.def = 5;
  e.ai.home.x = x; e.ai.home.y = y;
  e.ai.leash = nd.farmer ? 10 : (nd.wanderer ? 40 : 4);
  e.tg.persist = true; e.tg.scale = 1;
  e.tg.tint = nd.gender === 'f' ? '#e0b0c0' : '#b0c8e0';
  e.tg.faction = 'neutral'; e.tg.diet = 'omnivore';
  e.tg.wanderer = !!nd.wanderer; e.tg.hunter = !!nd.hunter;
  e.ai.state = 'wander';
  return register(e);
}
E.spawnWanderers = function () {
  const rng = rngAI();
  const w = D.WANDERERS || [];
  for (let i = 0; i < w.length; i++) {
    const id = w[i];
    if (!D.NPCS[id]) continue;
    let alive = false;
    for (let k = 0; k < E.list.length; k++) if (E.list[k].npcId === id && !E.list[k].tg.dead) { alive = true; break; }
    if (alive) continue;
    if (!W.routes.length) continue;
    const route = W.routes[i % W.routes.length];
    const st = route[0];
    const e = spawnNpc(id, st.x + 0.5, st.y + 0.5);
    e.ai.route = route; e.ai.routeI = 0;
  }
  const h = D.HUNTERS || [];
  for (let i = 0; i < h.length; i++) {
    const id = h[i];
    if (!D.NPCS[id]) continue;
    let alive = false;
    for (let k = 0; k < E.list.length; k++) if (E.list[k].npcId === id && !E.list[k].tg.dead) { alive = true; break; }
    if (alive) continue;
    if (!W.hunterPosts.length) continue;
    const post = W.hunterPosts[i % W.hunterPosts.length];
    const e = spawnNpc(id, post.x + 0.5, post.y + 0.5);
    e.ai.leash = post.r;
    e.ai.home.x = post.x + 0.5; e.ai.home.y = post.y + 0.5;
    if (rng.chance(0.5)) e.ai.routeI = 0;
  }
};
E.spawnWorker = function (opts) {
  const o = opts || {};
  const e = alloc();
  e.type = 'worker';
  e.name = o.name || 'Trabajador';
  e.gender = o.gender || 'm';
  e.t.x = o.x; e.t.y = o.y; e.t.px = o.x; e.t.py = o.y;
  e.st.maxHp = o.child ? 60 : 95; e.st.hp = e.st.maxHp;
  e.cb.dmg = o.child ? 6 : 12; e.cb.reach = 1.15; e.cb.def = 3;
  e.ai.home.x = o.x; e.ai.home.y = o.y; e.ai.leash = 24;
  e.tg.persist = true; e.tg.owner = 'player'; e.tg.tamed = true;
  e.tg.faction = 'player'; e.tg.diet = 'omnivore';
  e.tg.role = o.role || 'idle';
  e.tg.child = !!o.child;
  e.tg.stage = o.stage || 'adult';
  e.tg.growDay = o.growDay || 0;
  e.tg.tint = e.gender === 'f' ? '#e0b8c8' : '#b8c8e0';
  e.tg.scale = e.tg.stage === 'baby' ? 0.4 : e.tg.stage === 'child' ? 0.6 : e.tg.stage === 'teen' ? 0.82 : 1;
  e.ai.state = 'work';
  return register(e);
};
E.spawnBosses = function () {
  for (let i = 0; i < W.lairs.length; i++) {
    const L = W.lairs[i];
    const st = E.bossState[L.species];
    if (st && st.respawnDay > E.day) continue;
    let alive = false;
    for (let k = 0; k < E.list.length; k++) if (E.list[k].species === L.species && !E.list[k].tg.dead) { alive = true; break; }
    if (alive) continue;
    const b = E.spawnCreature(L.species, L.pos.x + 0.5, L.pos.y + 0.5, { persist: true, noBaby: true });
    if (b) { b.ai.home.x = L.pos.x + 0.5; b.ai.home.y = L.pos.y + 0.5; b.ai.leash = (D.SPECIES[L.species].leash || 22); }
  }
};
/** Un guardián por cada construcción defensiva del jugador. */
E.syncGuardians = function () {
  const list = W.playerBuildings();
  for (let i = 0; i < list.length; i++) {
    const b = list[i], bd = D.BUILDINGS[b.key];
    if (!bd || !bd.guardian) continue;
    let found = null;
    for (let k = 0; k < E.list.length; k++) {
      const e = E.list[k];
      if (!e.tg.dead && e.tg.deposit === b.uid) { found = e; break; }
    }
    if (found) continue;
    const sp = bd.guardian;
    if (!D.SPECIES[sp]) continue;
    const g = E.spawnCreature(sp, b.x + b.w / 2, b.y + b.h + 0.6, { persist: true, tamed: true, owner: 'player', noBaby: true });
    if (g) {
      g.tg.deposit = b.uid;
      g.tg.guardian = bd.guardian === 'gargoyle' ? 'city' : 'player';
      g.ai.home.x = b.x + b.w / 2; g.ai.home.y = b.y + b.h / 2;
      g.ai.leash = D.SPECIES[sp].guard ? D.SPECIES[sp].guard.radius : 14;
      g.ai.state = 'guard';
      g.name = D.SPECIES[sp].name + ' guardián';
    }
  }
};
E.companionCount = function (p) {
  let n = 0;
  for (let i = 0; i < E.list.length; i++) {
    const e = E.list[i];
    if (e.tg.dead || !e.tg.tamed || e.tg.owner !== 'player' || e.tg.livestock || e.tg.guardian) continue;
    n++;
  }
  return n;
};

/* ==========================================================
9 · MOVIMIENTO Y COLISIÓN
========================================================== */
const RADIUS = 0.3;
function fits(x, y, flying) {
  const r = RADIUS;
  return W.walkable(Math.floor(x - r), Math.floor(y - r), flying) &&
    W.walkable(Math.floor(x + r), Math.floor(y - r), flying) &&
    W.walkable(Math.floor(x - r), Math.floor(y + r), flying) &&
    W.walkable(Math.floor(x + r), Math.floor(y + r), flying);
}
function move(e, dx, dy, flying) {
  const t = e.t;
  if (dx !== 0) {
    const nx = t.x + dx;
    if (fits(nx, t.y, flying)) t.x = nx;
    else {
      const slide = dy > 0 ? 0.14 : -0.14;
      if (fits(nx, t.y + slide, flying)) { t.x = nx; t.y += slide * 0.6; }
      else if (fits(nx, t.y - slide, flying)) { t.x = nx; t.y -= slide * 0.6; }
    }
  }
  if (dy !== 0) {
    const ny = t.y + dy;
    if (fits(t.x, ny, flying)) t.y = ny;
    else {
      const slide = dx > 0 ? 0.14 : -0.14;
      if (fits(t.x + slide, ny, flying)) { t.y = ny; t.x += slide * 0.6; }
      else if (fits(t.x - slide, ny, flying)) { t.y = ny; t.x -= slide * 0.6; }
    }
  }
  t.x = U.clamp(t.x, 0.4, C.WORLD - 0.4);
  t.y = U.clamp(t.y, 0.4, C.WORLD - 0.4);
}
function stepToward(e, tx, ty, speed, dt, flying) {
  const dx = tx - e.t.x, dy = ty - e.t.y;
  const d = U.len(dx, dy);
  if (d < 0.06) return true;
  const s = Math.min(speed * dt, d);
  e.t.ang = U.angDamp(e.t.ang, Math.atan2(dy, dx), 12, dt);
  move(e, (dx / d) * s, (dy / d) * s, flying);
  e.an.walk += s * 2.4;
  return d < 0.35;
}
function followPath(e, speed, dt, flying) {
  const p = e.ai.path;
  if (!p || e.ai.pi >= p.length) { e.ai.path = null; return true; }
  const n = p[e.ai.pi];
  if (stepToward(e, n.x + 0.5, n.y + 0.5, speed, dt, flying)) e.ai.pi++;
  if (e.ai.pi >= p.length) { e.ai.path = null; return true; }
  return false;
}
function requestPath(e, tx, ty, flying) {
  e.ai.path = W.findPath(e.t.x, e.t.y, tx, ty, 460, flying);
  e.ai.pi = 0;
  return !!e.ai.path;
}

/* ==========================================================
10 · DAÑO, ESTADOS Y MUERTE
========================================================== */
function applyStatus(t, o) {
  if (o.poison && !t.tg.fireproof) { t.cb.poison = Math.max(t.cb.poison, o.poison); t.cb.poisonT = Math.max(t.cb.poisonT, B.POISON_TIME); }
  if (o.burn && !t.tg.fireproof) { t.cb.burn = Math.max(t.cb.burn, o.burn); t.cb.burnT = Math.max(t.cb.burnT, B.BURN_TIME); }
  if (o.bleed) { t.cb.bleed = Math.max(t.cb.bleed, o.bleed); t.cb.bleedT = Math.max(t.cb.bleedT, B.BLEED_TIME); }
  if (o.slow && !t.tg.iceproof) { t.cb.slow = Math.max(t.cb.slow, o.slow); t.cb.slowT = Math.max(t.cb.slowT, o.slowT || B.SLOW_TIME); }
  if (o.stagger) {
    t.cb.stagger = Math.max(t.cb.stagger, o.stagger);
    if (t.ai) { t.ai.mv = null; t.ai.mvPhase = ''; t.ai.burst = 0; t.ai.rest = Math.max(t.ai.rest, o.stagger); }
  }
}
/** Bloqueo y parry del jugador. Devuelve el multiplicador de daño final. */
function guardMitigate(t, src, o) {
  if (t.type !== 'player' || !t.blk || !t.blk.on || !t.shield || o.dot) return 1;
  const dx = src && src.t ? src.t.x - t.t.x : cos(t.t.ang);
  const dy = src && src.t ? src.t.y - t.t.y : sin(t.t.ang);
  const ang = Math.atan2(dy, dx);
  const off = Math.abs(U.angDelta(t.t.ang, ang));
  if (off > t.shield.arc * 0.5) return 1;
  /* Parry: ventana inicial */
  if (t.blk.t <= t.parryWindow) {
    t.st.st = U.clamp(t.st.st + B.PARRY_ST_REFUND, 0, t.st.maxSt);
    if (src && src.ai) {
      src.ai.rest = Math.max(src.ai.rest, B.PARRY_STAGGER);
      src.ai.mv = null; src.ai.mvPhase = '';
      src.cb.stagger = B.PARRY_STAGGER;
    }
    t.parryFlash = 0.35;
    A.play('crit', { rate: 1.5 });
    fx('spark', t.t.x + cos(ang) * 0.6, t.t.y + sin(ang) * 0.6);
    floater(t.t.x, t.t.y - 1.1, '¡PARRY!', '#f3cf7a');
    shake(3);
    Bus.emit('parry', { target: t, src: src });
    return B.PARRY_MULT;
  }
  /* Bloqueo normal: cuesta stamina; sin stamina, guardia rota */
  const cost = B.ST_BLOCK_HIT * (t.shield.weight || 1);
  if (t.st.st < cost) {
    t.cb.guard = B.GUARD_BREAK_ST * 3;
    t.blk.on = false;
    floater(t.t.x, t.t.y - 1.1, '¡GUARDIA ROTA!', '#ff8a7a');
    A.play('error'); shake(5);
    return 1;
  }
  t.st.st -= cost;
  const red = t.blockReduce * (o.guardBreak ? (1 - o.guardBreak) : 1);
  /* v4: el escudo se desgasta y, al romperse, QUEDA equipado (dur 0) */
  if (t.equip.shield) {
    E.wearShield(t, 1);
    if (isBroken(t.equip.shield)) { t.blk.on = false; t.parryFlash = 0; }
  }
  A.play('hit', { rate: 0.7, vol: 0.7 });
  fx('spark', t.t.x + cos(ang) * 0.5, t.t.y + sin(ang) * 0.5);
  if (t.shield && t.shield.ward) return Math.max(0.04, 1 - red) * 0.6;
  return Math.max(0.05, 1 - red);
}
E.damage = function (target, amount, src, opts) {
  if (!target || target.tg.dead) return 0;
  if (target.type === 'player' && target.ko) return 0;
  const o = opts || {};
  if (target.cb.iframe > 0 && !o.dot) return 0;
  if (o.burn && target.tg.fireproof) return 0;
  if (o.slow && target.tg.iceproof) o.slow = 0;
  const mul = guardMitigate(target, src, o);
  const def = target.cb.def + (target.tg.petArmor || 0);
  let dmg = amount * mul * (1 - def / (def + B.DEF_K));
  if (target.type === 'player') {
    if (o.burn && target.buffs.fireRes > 0) dmg *= 0.4;
    if (o.slow && target.iceRes > 0) dmg *= (1 - target.iceRes * 0.5);
  }
  let crit = false;
  if (!o.dot && src && src.type === 'player' && mul >= 1) {
    if (rngLoot().chance((src.critChance || B.CRIT) + (o.critBonus || 0))) { dmg *= B.CRIT_MULT; crit = true; }
  }
  if (o.crit) { dmg *= B.CRIT_MULT; crit = true; }
  dmg = Math.max(1, Math.round(dmg));
  const hp0 = target.st.hp;
  target.st.hp -= dmg;
  target.an.hurt = 0.28;
  if (!o.dot) {
    target.cb.iframe = target.type === 'player' ? 0.3 : 0.1;
    if (src && src.t && o.knock !== false) {
      const dx = target.t.x - src.t.x, dy = target.t.y - src.t.y;
      const d = U.len(dx, dy) || 1;
      const k = (o.knock || B.KNOCKBACK) * (target.tg.boss ? 0.22 : 1) * (mul < 1 ? 0.3 : 1);
      target.v.x += (dx / d) * k; target.v.y += (dy / d) * k;
    }
  }
  applyStatus(target, o);
  if (o.drainSt && target.type === 'player') target.st.st = Math.max(0, target.st.st - o.drainSt);
  if (o.lifesteal && src && !src.tg.dead) src.st.hp = Math.min(src.st.maxHp, src.st.hp + dmg * o.lifesteal);
  floater(target.t.x, target.t.y - 0.7, (crit ? '¡' : '') + dmg + (crit ? '!' : ''),
    crit ? '#ffd76a' : (mul < 1 ? '#bfe4f5' : (target.type === 'player' ? '#ff8a7a' : '#fff')));
  fx('hit', target.t.x, target.t.y, { crit: crit });
  sfxAt(target.type === 'player' ? 'hurt' : (crit ? 'crit' : 'hit'), target.t.x, target.t.y);
  if (target.type === 'player') { shake(crit ? 7 : 4); Bus.emit('player:hurt', { dmg: dmg }); }
  else if (src && src.type === 'player') {
    E.hitstop = B.HITSTOP; shake(crit ? 4 : 2);
    const hm = E.hitMark, f0 = Math.max(0, hp0) / Math.max(1, target.st.maxHp);
    hm.lag = (hm.ref === target && hm.id === target.id) ? Math.max(hm.lag, f0) : f0;
    hm.ref = target; hm.id = target.id; hm.t = 0.4; hm.focusT = 3; hm.crit = crit; hm.dmg = dmg;
    E.aim.lock = target; E.aim.lockT = B.AIM_LOCK_TIME;
  }
  if (target.type === 'npc' && src && src.type === 'player') Bus.emit('npc:attacked', { npcId: target.npcId });
  if (target.type === 'guard' && src && src.type === 'player') { E.heat = Math.min(100, E.heat + 35); target.tg.angry = true; }
  if (target.type !== 'player' && !target.tg.tamed && src && !o.dot) {
    if (target.tg.faction === 'prey' || target.tg.faction === 'neutral') { target.ai.threat = src; target.ai.state = 'flee'; target.ai.ease = 0; target.ai.scaredT = 6; }
    else { target.tg.hostile = true; target.ai.target = src; target.ai.state = 'chase'; }
  }
  if (target.st.hp <= 0) kill(target, src);
  Bus.emit('hit', { target: target, dmg: dmg, crit: crit, blocked: mul < 1 });
  return dmg;
};
function tickDots(e, dt) {
  if (e.cb.poisonT > 0) {
    e.cb.poisonT -= dt; e.st.hp -= e.cb.poison * dt;
    if (rngFx().chance(dt * 4)) fx('poison', e.t.x, e.t.y);
    if (e.cb.poisonT <= 0) e.cb.poison = 0;
    if (e.st.hp <= 0) { kill(e, null); return; }
  }
  if (e.cb.burnT > 0) {
    e.cb.burnT -= dt; e.st.hp -= e.cb.burn * dt;
    if (rngFx().chance(dt * 6)) fx('fire', e.t.x, e.t.y);
    if (e.cb.burnT <= 0) e.cb.burn = 0;
    if (e.st.hp <= 0) { kill(e, null); return; }
  }
  if (e.cb.bleedT > 0) {
    e.cb.bleedT -= dt; e.st.hp -= (e.cb.bleed || B.BLEED_DPS) * dt;
    if (rngFx().chance(dt * 3)) fx('hit', e.t.x, e.t.y, { crit: false });
    if (e.cb.bleedT <= 0) e.cb.bleed = 0;
    if (e.st.hp <= 0) { kill(e, null); return; }
  }
  if (e.cb.slowT > 0) { e.cb.slowT -= dt; if (e.cb.slowT <= 0) e.cb.slow = 0; }
  if (e.cb.stagger > 0) e.cb.stagger = Math.max(0, e.cb.stagger - dt);
  if (e.cb.guard > 0) e.cb.guard = Math.max(0, e.cb.guard - dt);
}
/** Al caer el jugador, todo el mundo lo olvida (animales, bandidos, guardias). */
function forgetPlayer() {
  const p = E.player;
  E.heat = 0;
  for (let i = 0; i < E.projectiles.length; i++) if (E.projectiles[i].hostile) E.projectiles[i].life = 0;
  for (let i = 0; i < E.list.length; i++) {
    const e = E.list[i];
    if (e === p || e.tg.dead || e.type === 'worker') continue;
    const hadP = e.ai.target === p || e.ai.threat === p;
    if (hadP) { e.ai.target = null; e.ai.threat = null; e.ai.path = null; e.ai.mv = null; e.ai.mvPhase = ''; }
    e.tg.angry = false;
    if (e.type === 'creature' && !e.tg.tamed) {
      const sd = e.species ? D.SPECIES[e.species] : null;
      e.tg.hostile = !!sd && (sd.behavior === 'hostile' || sd.behavior === 'ambush') && !e.tg.baby;
    }
    if (hadP || e.ai.state === 'flee' || e.ai.state === 'chase')
      e.ai.state = (e.type === 'guard' || e.tg.guardian) ? 'guard' : (e.type === 'npc' ? 'wander' : 'return');
  }
}
E.forgetPlayer = forgetPlayer;
function kill(e, src) {
  if (e.tg.dead) return;
  if (e.type === 'player') {
    e.st.hp = 0; e.ko = true;
    e.act = null; e.blk.on = false; e.cast = null;
    forgetPlayer();
    A.play('die'); shake(12);
    Bus.emit('ko', { player: e });
    return;
  }
  e.tg.dead = true; e.st.hp = 0;
  fx('death', e.t.x, e.t.y, { tint: e.tg.tint, scale: e.tg.scale });
  sfxAt(e.tg.boss ? 'bossdown' : 'die', e.t.x, e.t.y);
  if (e.tg.boss) { shake(14); Bus.emit('banner', { title: '¡' + e.name + ' HA CAÍDO!', sub: 'El santuario guarda silencio.' }); }
  const p = E.player, sd = e.species ? D.SPECIES[e.species] : null;
  const rng = rngLoot();
  if (sd && p && !e.tg.baby) {
    const luck = p.luck || 0, drops = [];
    if (sd.drops) {
      for (let i = 0; i < sd.drops.length; i++) {
        const dr = sd.drops[i];
        if (!rng.chance(Math.min(1, dr[3] + luck))) continue;
        const n = rng.int(dr[1], dr[2]);
        if (n > 0) drops.push({ id: dr[0], n: n, q: 0 });
      }
    }
    if (sd.gold) {
      const g = rng.int(sd.gold[0], sd.gold[1]);
      p.gold += g; floater(e.t.x, e.t.y - 1.1, '+' + g + ' oro', '#f3cf7a');
      A.playAt('coin', e.t.x, e.t.y, p.t.x, p.t.y);
    }
    if (sd.boss) {
      if (D.ITEMS[sd.boss.unique]) { drops.push({ id: sd.boss.unique, n: 1, q: 0 }); toast('¡Botín único: ' + D.ITEMS[sd.boss.unique].name + '!', 'gold'); }
      fx('legend', e.t.x, e.t.y);
      E.bossState[e.species] = { respawnDay: E.day + (sd.boss.respawn || B.BOSS_RESPAWN) };
    }
    if (e.tg.livestock && e.tg.owner === 'player') toast(e.name + ' ha muerto.', 'bad');
    E.dropLoot(e.t.x, e.t.y, drops, { life: e.tg.boss ? 330 : undefined });
    const byPlayer = src && (src.type === 'player' || src.tg.owner === 'player');
    if (byPlayer) E.addXP(p, 'combat', sd.xp || 5);
    Bus.emit('kill', { entity: e, species: e.species, boss: e.tg.boss, byPlayer: !!byPlayer, x: e.t.x, y: e.t.y });
  }
  if (e.type === 'guard') { E.heat = 100; toast('¡Has matado a un guardia! Vhalor te busca.', 'bad'); }
  if (E.player && E.player.mount === e) E.dismount();
}
E.kill = kill;

/* ==========================================================
11 · BOTÍN EN EL SUELO
========================================================== */
E.dropLoot = function (x, y, items, opts) {
  const o = opts || {}, list = [];
  for (let i = 0; i < items.length; i++) {
    const it = items[i];
    if (!it || !(it.n > 0) || !D.ITEMS[it.id]) continue;
    const q = it.q | 0;
    let merged = false;
    if (it.dur === undefined) {
      for (let k = 0; k < list.length; k++) {
        if (list[k].id === it.id && list[k].q === q && list[k].dur === undefined) { list[k].n += it.n | 0; merged = true; break; }
      }
    }
    if (!merged) { const c = { id: it.id, n: it.n | 0, q: q }; if (it.dur !== undefined) c.dur = it.dur; list.push(c); }
  }
  if (!list.length) return null;
  let bx = x, by = y;
  if (o.toward) {
    const dx = o.toward.x - x, dy = o.toward.y - y, d = U.len(dx, dy) || 1;
    bx = x + (dx / d) * Math.min(0.9, d); by = y + (dy / d) * Math.min(0.9, d);
  }
  const rn = rngFx();
  let px = bx, py = by;
  for (let t = 0; t < 8; t++) {
    const a = rn.next() * U.TAU, d = 0.15 + rn.next() * 0.5;
    const tx = bx + cos(a) * d, ty = by + sin(a) * d;
    if (fits(tx, ty, false)) { px = tx; py = ty; break; }
  }
  if (!fits(px, py, false)) { px = x; py = y; }
  const bag = list.length > 1;
  const life = o.life || (bag ? BAG_LIFE : LOOT_LIFE);
  const l = { uid: U.uid(), x: px, y: py, items: list, bag: bag, life: life, max: life, age: 0,
    pickT: o.delay === undefined ? 0.5 : o.delay, retry: 0, warned: false, manual: !!o.manual };
  if (E.loot.length >= LOOT_CAP) E.loot.shift();
  E.loot.push(l);
  return l;
};
E.lootName = function (l) {
  if (l.bag) return 'bolsa de botín';
  const it = l.items[0];
  if (!it) return 'objeto';
  const def = D.ITEMS[it.id];
  return (def ? def.name : 'objeto') + (it.n > 1 ? ' ×' + it.n : '');
};
E.pickupLoot = function (l, manual) {
  const p = E.player;
  if (!p || p.ko || !l || l.life <= 0) return false;
  let any = false, full = false, row = 0;
  for (let i = l.items.length - 1; i >= 0; i--) {
    const it = l.items[i], def = D.ITEMS[it.id];
    if (!def) { l.items.splice(i, 1); continue; }
    const left = Inv.add(p, it.id, it.n, it.q, it.dur);
    const got = it.n - left;
    if (got > 0) { any = true; floater(l.x, l.y - 0.5 - row * 0.35, '+' + got + ' ' + def.name, '#efe3c8'); row++; }
    if (left > 0) { it.n = left; full = true; } else l.items.splice(i, 1);
  }
  if (any) { sfxAt('harvest', l.x, l.y); E.autoAmmo(p); }
  if (!l.items.length) {
    l.life = 0;
    const ix = E.loot.indexOf(l);
    if (ix >= 0) E.loot.splice(ix, 1);
    return true;
  }
  if (full) { l.retry = 1.5; if (manual || !l.warned) toast('Inventario lleno: el resto queda en el suelo.', 'bad'); l.warned = true; }
  return any;
};
function updateLoot(dt) {
  const p = E.player;
  for (let i = E.loot.length - 1; i >= 0; i--) {
    const l = E.loot[i];
    l.age += dt; l.life -= dt; l.pickT -= dt; l.retry = Math.max(0, l.retry - dt);
    if (l.life <= 0) { E.loot.splice(i, 1); continue; }
    if (!p || p.ko || l.manual || l.pickT > 0 || l.retry > 0) continue;
    const d2 = U.dist2(l.x, l.y, p.t.x, p.t.y);
    if (d2 < 0.75 * 0.75) { E.pickupLoot(l, false); continue; }
    if (d2 < 2.4 * 2.4) {
      const d = Math.sqrt(d2), step = Math.min(d, 7 * dt);
      l.x += (p.t.x - l.x) / d * step; l.y += (p.t.y - l.y) / d * step;
    }
  }
}

/* ==========================================================
12 · APUNTADO PEGAJOSO (cono, histéresis, Tab)
========================================================== */
function aimAngle(p) {
  const I = CR.Input;
  if (p.isBow && I.bowAim.active) return I.bowAim.ang;
  if (I.aimFresh() && CR.Camera && CR.Camera.screenToWorld) {
    const w = CR.Camera.screenToWorld(I.pointer.x, I.pointer.y);
    if (w) {
      const dx = w.x - p.t.x, dy = w.y - p.t.y;
      if (U.len(dx, dy) > 0.2) return Math.atan2(dy, dx);
    }
  }
  const f = I.getFace();
  if (f !== null) return f;
  return p.t.ang;
}
function toolInfo(p) {
  const s = p.equip.tool;
  if (!s) return null;
  if (isBroken(s)) return null;                 /* v4: rota = no funciona */
  const def = D.ITEMS[s.id];
  if (!def || !def.tool) return null;
  return { id: s.id, def: def, kind: def.tool.kind, pow: def.tool.pow, slot: s };
}
E.toolInfo = toolInfo;
/** Nodo pegajoso: prioriza el que ya estabas golpeando. */
function nodeTarget(p, ang) {
  const ax = cos(ang), ay = sin(ang);
  const locked = E.aim.node;
  if (locked && !locked.dead) {
    const dx = (locked.x + 0.5) - p.t.x, dy = (locked.y + 0.5) - p.t.y;
    const d = U.len(dx, dy);
    if (d <= 2.0) {
      const dot = d < 0.55 ? 1 : (dx / d) * ax + (dy / d) * ay;
      if (dot > -0.1) return locked;
    }
  }
  let best = null, bestScore = -1e9;
  for (let oy = -1; oy <= 1; oy++) for (let ox = -1; ox <= 1; ox++) {
    const tx = Math.floor(p.t.x + ax * 0.9) + ox, ty = Math.floor(p.t.y + ay * 0.9) + oy;
    const n = W.nodeAt(tx, ty);
    if (!n) continue;
    const dx = (tx + 0.5) - p.t.x, dy = (ty + 0.5) - p.t.y;
    const d = U.len(dx, dy);
    if (d > 1.85) continue;
    const dot = d < 0.55 ? 1 : (dx / d) * ax + (dy / d) * ay;
    if (dot < 0.1) continue;
    const sc = dot * 2 - d;
    if (sc > bestScore) { bestScore = sc; best = n; }
  }
  return best;
}
function coneFor(d) {
  if (d < 0.85) return -0.25;                    /* pegado: acepta cualquier dirección */
  if (d < B.AIM_NEAR_DIST) return cos(B.AIM_CONE_NEAR);
  return cos(B.AIM_CONE);
}
function targetable(p, t) {
  if (!t || t === p || t.tg.dead) return false;
  if (t.tg.tamed || t.type === 'worker') return false;
  return true;
}
function updateAim(p, dt) {
  const a = E.aim, hm = E.hitMark, nh = E.nodeHit;
  hm.t = Math.max(0, hm.t - dt); hm.focusT = Math.max(0, hm.focusT - dt);
  nh.t = Math.max(0, nh.t - dt); nh.focusT = Math.max(0, nh.focusT - dt);
  a.lockT = Math.max(0, a.lockT - dt);
  _missCd = Math.max(0, _missCd - dt);
  if (hm.ref) {
    if (hm.ref.id !== hm.id || hm.ref.tg.dead) hm.ref = null;
    else hm.lag = Math.max(hm.ref.st.hp / Math.max(1, hm.ref.st.maxHp), hm.lag - dt * 0.55);
  }
  if (nh.node && nh.node.dead) nh.node = null;
  a.kind = null; a.ref = null;
  a.cands.length = 0;
  if (p.ko) { a.lock = null; a.node = null; return; }
  const ang = aimAngle(p);
  const ax = cos(ang), ay = sin(ang);
  const assist = CR.Settings.values.aimAssist;
  const bow = p.isBow;
  a.mode = bow ? 'bow' : 'melee';
  a.draw = (p.act && p.act.kind === 'draw') ? U.clamp(p.act.draw / (B.DRAW_FULL * p.drawMul), 0, 1) : 0;
  const reach = bow ? B.AIM_MAX_RANGE : (p.cb.reach + (p.mount ? 0.4 : 0));
  const searchR = reach + (bow ? 1.5 : 1.6);
  W.Hash.query(p.t.x, p.t.y, searchR, _qAim);
  _cands.length = 0;
  for (let i = 0; i < _qAim.length; i++) {
    const t = _qAim[i];
    if (!targetable(p, t)) continue;
    const dx = t.t.x - p.t.x, dy = t.t.y - p.t.y;
    const d = U.len(dx, dy);
    if (d > searchR) continue;
    const dot = d < 0.001 ? 1 : (dx / d) * ax + (dy / d) * ay;
    const cone = coneFor(d) - (assist - 1) * 0.22;
    if (dot < cone) continue;
    const inR = d <= reach + (t.tg.scale || 1) * 0.32;
    const score = dot * 3.2 - d * 0.24 + (inR ? 1.1 : 0) - (t.type === 'npc' && !t.tg.angry ? 2.4 : 0);
    _cands.push({ e: t, d: d, dot: dot, inR: inR, score: score });
  }
  _cands.sort(function (u, v) { return v.score - u.score; });
  for (let i = 0; i < _cands.length && i < 6; i++) a.cands.push(_cands[i].e);
  /* Ciclo manual con Tab */
  if (CR.Input.consume('cycle') && _cands.length) {
    let idx = 0;
    for (let i = 0; i < _cands.length; i++) if (_cands[i].e === a.lock) { idx = i; break; }
    const nx = _cands[(idx + 1) % _cands.length];
    a.lock = nx.e; a.lockT = B.AIM_LOCK_TIME * 2;
    A.play('click');
    floater(nx.e.t.x, nx.e.t.y - 1.2, 'objetivo', '#f3cf7a');
  }
  /* Histéresis: conserva el fijado salvo que otro sea claramente mejor */
  let chosen = null;
  if (a.lock && !a.lock.tg.dead) {
    for (let i = 0; i < _cands.length; i++) {
      if (_cands[i].e === a.lock) {
        const l = _cands[i];
        if (l.d <= searchR * 1.25 && l.dot > coneFor(l.d) - 0.45) chosen = l;
        break;
      }
    }
    if (chosen && _cands.length && _cands[0].e !== a.lock &&
      _cands[0].score - chosen.score > B.AIM_SWITCH_MARGIN * (2 - assist * 0.5) && a.lockT <= 0) {
      chosen = _cands[0];
    }
  }
  if (!chosen && _cands.length) chosen = _cands[0];
  if (chosen) { a.lock = chosen.e; if (a.lockT <= 0) a.lockT = B.AIM_LOCK_TIME; }
  else if (a.lock && (a.lock.tg.dead || a.lockT <= 0)) a.lock = null;
  const n = nodeTarget(p, ang);
  const ti = toolInfo(p);
  let nodeOk = false;
  if (n) {
    const nd = D.NODES[n.key];
    nodeOk = !!nd && (nd.tool === 'hand' || (ti && nd.tool === ti.kind && ti.pow >= nd.pow));
  }
  /* Entidad en alcance gana al nodo; si no, el nodo gana */
  if (chosen && chosen.inR) {
    a.kind = 'entity'; a.ref = chosen.e; a.x = chosen.e.t.x; a.y = chosen.e.t.y;
    a.r = 0.5 * (chosen.e.tg.scale || 1) + 0.12; a.valid = true; a.inRange = true;
    a.node = nodeOk ? n : a.node;
    return;
  }
  if (n && nodeOk && !bow) {
    a.kind = 'node'; a.ref = n; a.node = n;
    a.x = n.x + 0.5; a.y = n.y + 0.5; a.r = 0.62;
    a.valid = true; a.inRange = true;
    a.mode = 'tool';
    return;
  }
  if (chosen) {
    a.kind = 'entity'; a.ref = chosen.e; a.x = chosen.e.t.x; a.y = chosen.e.t.y;
    a.r = 0.5 * (chosen.e.tg.scale || 1) + 0.12;
    a.valid = true; a.inRange = chosen.inR;
    return;
  }
  if (n) {
    a.kind = 'node'; a.ref = n; a.node = n;
    a.x = n.x + 0.5; a.y = n.y + 0.5; a.r = 0.62;
    a.valid = nodeOk; a.inRange = true; a.mode = 'tool';
  }
}

/* ==========================================================
13 · RECOLECCIÓN (desgaste v4: rompe sin borrar)
========================================================== */
function gather(p, n) {
  const def = D.NODES[n.key];
  const ti = toolInfo(p);
  const kind = def.tool === 'hand' ? 'hand' : (ti ? ti.kind : 'none');
  const pow = def.tool === 'hand' ? 99 : (ti ? ti.pow : 0);
  if (def.tool !== 'hand' && (!ti || ti.kind !== def.tool)) {
    toast('Necesitas ' + (def.tool === 'axe' ? 'un hacha' : 'un pico') + ' equipado.', 'bad');
    A.play('error'); return false;
  }
  const stam = def.stam;
  if (p.st.st < stam) { toast('Sin stamina. Come o descansa.', 'bad'); A.play('error'); return false; }
  const res = W.damageNode(n.x, n.y, kind, pow, E.day);
  if (!res.ok) {
    if (res.reason === 'power') toast('Tu herramienta es demasiado débil (poder ' + res.need + ').', 'bad');
    A.play('error'); return false;
  }
  p.st.st = Math.max(0, p.st.st - stam);
  E.nodeHit.node = n; E.nodeHit.t = 0.28; E.nodeHit.focusT = 2.5;
  E.aim.node = n;
  if (!res.broke) floater(n.x + 0.5, n.y + 0.1, Math.max(0, n.hp) + '/' + def.hits, '#f3cf7a');
  if (def.tool !== 'hand') E.wearTool(p, 1);
  sfxAt(def.tool === 'axe' ? 'chop' : def.tool === 'pick' ? 'pick' : 'harvest', n.x + 0.5, n.y + 0.5);
  fx(def.tool === 'axe' ? 'wood' : def.tool === 'pick' ? 'stone' : 'leaf', n.x + 0.5, n.y + 0.5, { tint: def.tint });
  shake(1.5);
  if (res.broke) {
    const rng = rngLoot();
    const trade = def.tool === 'axe' ? 'woodcut' : def.tool === 'pick' ? 'mining' : 'farming';
    const lvl = E.levelOf(p, trade);
    const yieldB = 1 + E.skillVal(p, 'yield') + lvl * B.TRADE_BONUS;
    const drops = [];
    let got = 0;
    for (let i = 0; i < def.drops.length; i++) {
      const dr = def.drops[i];
      if (!rng.chance(Math.min(1, dr[3] + (p.luck || 0)))) continue;
      let n2 = Math.round(rng.int(dr[1], dr[2]) * yieldB);
      if (n2 > 0) { drops.push({ id: dr[0], n: n2, q: 0 }); got += n2; }
    }
    E.dropLoot(n.x + 0.5, n.y + 0.5, drops, { delay: 0.3, toward: p.t });
    E.addXP(p, trade, def.xp);
    Bus.emit('gather', { node: n, def: def, amount: got, x: n.x, y: n.y });
    fx('break', n.x + 0.5, n.y + 0.5, { tint: def.tint });
    E.aim.node = null;
  }
  return true;
}
/* ==========================================================
14 · CANALES DE ACCIÓN DEL JUGADOR
   ataque / carga pesada / tensado / embate / esquiva.
   Todos cancelables desde la ventana de cancelación.
========================================================== */
function canCancel(p) {
  if (!p.act) return true;
  if (p.act.kind === 'draw' || p.act.kind === 'charge') return true;
  if (p.act.phase === 'recover') return true;
  return p.act.elapsed >= B.CANCEL_WINDOW;
}
function startMelee(p, heavy) {
  const w = p.weapon;
  const spd = (w && w.speed) ? w.speed : 1;
  const cost = heavy ? B.ST_HEAVY : B.ST_ATTACK;
  if (p.st.st < cost) { toast('Sin stamina para atacar.', 'bad'); A.play('error'); return false; }
  p.st.st -= cost;
  if (p.cb.comboT > 0 && !heavy) p.cb.combo = (p.cb.combo + 1) % B.COMBO_MULT.length;
  else p.cb.combo = 0;
  p.cb.comboT = B.COMBO_WINDOW;
  p.act = {
    kind: 'melee', elapsed: 0, phase: 'wind', heavy: !!heavy, hit: false,
    wind: B.ATK_WINDUP / spd * (heavy ? 2.4 : 1),
    active: B.ATK_ACTIVE * (heavy ? 1.5 : 1),
    recover: B.ATK_RECOVER / spd * (heavy ? 1.7 : 1),
    ang: p.t.ang
  };
  p.cb.cd = B.ATTACK_CD / spd;
  p.an.atk = 0.26;
  A.play('swing', { rate: heavy ? 0.7 : 1 });
  return true;
}
function startDraw(p) {
  if (!p.ammoId || Inv.count(p, p.ammoId) < 1) {
    E.autoAmmo(p);
    if (!p.ammoId) { toast('No llevas munición compatible.', 'bad'); A.play('error'); return false; }
  }
  if (p.st.st < B.ST_DRAW) { toast('Sin stamina para tensar.', 'bad'); A.play('error'); return false; }
  p.st.st -= B.ST_DRAW;
  p.act = { kind: 'draw', elapsed: 0, draw: 0, phase: 'draw' };
  p.an.draw = 0;
  A.play('draw', { vol: 0.5 });
  return true;
}
function releaseArrow(p) {
  const a = p.act;
  if (!a || a.kind !== 'draw') return;
  const full = B.DRAW_FULL * p.drawMul;
  const k = U.clamp(a.draw / full, 0, 1);
  p.act = null; p.an.draw = 0;
  if (a.draw < B.DRAW_MIN * p.drawMul) { A.play('click'); return; }
  const am = E.ammoInfo(p);
  if (!am || am.n < 1) { toast('Sin munición.', 'bad'); A.play('error'); return; }
  if (p.st.st < B.ST_SHOT) { toast('Sin stamina.', 'bad'); return; }
  p.st.st -= B.ST_SHOT;
  Inv.remove(p, am.id, 1);
  const mul = U.lerp(B.DRAW_DMG_MIN, B.DRAW_DMG_MAX, k) * am.dmg * p.rangedMul;
  const dmg = (p.weapon ? p.weapon.dmg : 8) * mul;
  const ang = aimAngle(p);
  p.t.ang = ang;
  const cross = !!(p.weapon && p.weapon.kind === 'crossbow');
  const spd = B.ARROW_SPEED * (cross ? 1.25 : 1) * (0.7 + k * 0.3);
  const pierce = (am.kind === 'mythril' ? 2 : 0) +
    (p.weapon && p.weapon.pierce ? p.weapon.pierce : 0) +
    (E.unlocked(p, 'marks', 4) ? 1 : 0);
  spawnProjectile(p, p.t.x + cos(ang) * 0.5, p.t.y + sin(ang) * 0.5, spd, dmg, cross ? 'bolt' : 'arrow', {
    hostile: false, effect: am.effect, pierce: pierce, ammo: am.kind,
    crit: k > 0.96 && rngLoot().chance(p.critChance + 0.15), r: 0.28, life: B.ARROW_LIFE, ang: ang
  });
  E.wearWeapon(p, 1);
  p.cb.cd = cross ? 0.85 : 0.3;
  p.an.atk = 0.2;
  A.play('shot');
  fx('slash', p.t.x + cos(ang) * 0.6, p.t.y + sin(ang) * 0.6, { ang: ang, combo: 0 });
  E.autoAmmo(p);
  Bus.emit('shot', { ammo: am.kind, power: k });
}
function resolveMelee(p) {
  const a = p.act;
  if (!a || a.hit) return;
  a.hit = true;
  const ang = a.ang;
  const reach = p.cb.reach + (p.mount ? 0.4 : 0) + (a.heavy ? 0.35 : 0);
  const mult = (a.heavy ? B.HEAVY_MULT : B.COMBO_MULT[p.cb.combo]) * (p.buffs.sharp > 0 ? 1.15 : 1);
  const w = p.weapon;
  const ex = {};
  if (w) {
    if (w.poison) ex.poison = w.poison;
    if (w.burn) ex.burn = w.burn;
    if (w.guardBreak) ex.guardBreak = w.guardBreak;
    if (w.knock) ex.knock = w.knock;
    if (w.crit) ex.critBonus = w.crit;
  }
  if (a.heavy) { ex.knock = (ex.knock || B.KNOCKBACK) * 1.7; ex.guardBreak = Math.max(ex.guardBreak || 0, 0.7); }
  if (E.unlocked(p, 'might', 7)) ex.guardBreak = Math.max(ex.guardBreak || 0, 0.5);
  fx('slash', p.t.x + cos(ang) * 0.75, p.t.y + sin(ang) * 0.75, { ang: ang, combo: p.cb.combo, heavy: a.heavy });
  W.Hash.query(p.t.x, p.t.y, reach + 0.9, E._q1);
  let hitAny = false, hits = 0;
  const maxHits = a.heavy ? 4 : (p.cb.combo === 3 ? 3 : 2);
  /* Objetivo fijado primero: el golpe va a quien apuntas */
  const ordered = [];
  if (E.aim.lock && !E.aim.lock.tg.dead) ordered.push(E.aim.lock);
  for (let i = 0; i < E._q1.length; i++) if (ordered.indexOf(E._q1[i]) < 0) ordered.push(E._q1[i]);
  for (let i = 0; i < ordered.length && hits < maxHits; i++) {
    const t = ordered[i];
    if (!targetable(p, t)) continue;
    const dx = t.t.x - p.t.x, dy = t.t.y - p.t.y;
    const d = U.len(dx, dy);
    if (d > reach + (t.tg.scale || 1) * 0.34) continue;
    const dot = d < 0.7 ? 1 : (dx / d) * cos(ang) + (dy / d) * sin(ang);
    if (dot < (d < B.AIM_NEAR_DIST ? -0.1 : 0.28)) continue;
    let dmg = p.cb.dmg * mult;
    if (t.st.hp / t.st.maxHp < 0.2 && E.unlocked(p, 'might', 10)) dmg = 1.6;
    E.damage(t, dmg, p, ex);
    hitAny = true; hits++;
  }
  if (hitAny) { E.wearWeapon(p, 1); if (a.heavy || p.cb.combo === 3) shake(4); }
  else if (E.aim.kind === 'entity' && !E.aim.inRange && _missCd <= 0) {
    _missCd = 0.8; floater(E.aim.x, E.aim.y - 0.9, 'Muy lejos', '#b3a482');
  }
  if (p.mount) mountAttack(p.mount);
}
function mountAttack(m) {
  const sd = D.SPECIES[m.species];
  if (!sd || !sd.mount || !sd.mount.combat || m.cb.cd > 0) return;
  const p = E.player;
  W.Hash.query(m.t.x, m.t.y, sd.reach + 1.0, E._q2);
  for (let i = 0; i < E._q2.length; i++) {
    const t = E._q2[i];
    if (t === m || t.tg.dead || t.tg.tamed || t.type === 'player' || t.type === 'worker' || t.type === 'npc') continue;
    if (U.dist2(m.t.x, m.t.y, t.t.x, t.t.y) > (sd.reach + 0.7) * (sd.reach + 0.7)) continue;
    E.damage(t, sd.dmg * 0.75 * (p.petDmgMul || 1), m, {});
    m.cb.cd = 1.1; m.an.atk = 0.25;
    break;
  }
}
E.playerAttack = function () {
  const p = E.player;
  if (!p || p.ko || p.cast) return;
  if (p.blk && p.blk.on) { E.bash(p); return; }
  if (p.cb.cd > 0 || !canCancel(p)) return;
  const ang = aimAngle(p);
  p.t.ang = ang;
  /* Herramienta sobre nodo: prioridad de recolección */
  if (!p.isBow) {
    const n = E.aim.kind === 'node' ? E.aim.ref : nodeTarget(p, ang);
    const ti = toolInfo(p);
    if (n && E.aim.valid && (!ti || D.NODES[n.key].tool === 'hand' || D.NODES[n.key].tool === ti.kind)) {
      if (p.gatherCd > 0) return;
      if (gather(p, n)) { p.gatherCd = 0.3; p.cb.cd = 0.3; p.an.atk = 0.22; }
      return;
    }
  }
  if (p.isBow) { if (!p.act || p.act.kind !== 'draw') startDraw(p); return; }
  startMelee(p, false);
};
E.bash = function (p) {
  if (!p || !p.shield) { toast('Necesitas un escudo equipado.', 'bad'); return; }
  if (!p.blk || p.blk.bashCd > 0 || p.st.st < B.ST_BASH) return;
  p.st.st -= B.ST_BASH;
  p.blk.bashCd = B.BASH_CD;
  p.act = { kind: 'bash', elapsed: 0, phase: 'active', hit: false, wind: 0, active: 0.12, recover: 0.24, ang: p.t.ang };
  p.an.atk = 0.24;
  A.play('bash');
  const strong = E.unlocked(p, 'guard', 5);
  const reach = 1.5;
  W.Hash.query(p.t.x, p.t.y, reach + 0.8, E._q1);
  for (let i = 0; i < E._q1.length; i++) {
    const t = E._q1[i];
    if (!targetable(p, t)) continue;
    const dx = t.t.x - p.t.x, dy = t.t.y - p.t.y, d = U.len(dx, dy);
    if (d > reach + (t.tg.scale || 1) * 0.3) continue;
    const dot = d < 0.7 ? 1 : (dx / d) * cos(p.t.ang) + (dy / d) * sin(p.t.ang);
    if (dot < 0.2) continue;
    const ex = { knock: 3.4 * p.shield.bash, stagger: strong ? B.BASH_STAGGER * 1.6 : B.BASH_STAGGER };
    if (p.shield.kind === 'spiked') ex.bleed = 4;
    E.damage(t, p.cb.dmg * 0.55 * p.shield.bash, p, ex);
    fx('shock', t.t.x, t.t.y, { r: 1.2 });
    break;
  }
  shake(3);
};
E.doRoll = function () {
  const p = E.player;
  if (!p || p.ko) return;
  if (p.mount) {
    const sd = D.SPECIES[p.mount.species];
    if (sd && sd.mount && sd.mount.fly && p.mount.tg.mountable) {
      if (!p.mount.tg.flying && p.mount.st.st < 14) { toast('Tu montura necesita aliento para despegar.', 'bad'); return; }
      if (!p.mount.tg.flying && W.isCity(Math.floor(p.t.x), Math.floor(p.t.y))) { toast('No puedes despegar dentro de las murallas.', 'bad'); return; }
      p.mount.tg.flying = !p.mount.tg.flying;
      A.play(p.mount.tg.flying ? 'flap' : 'mount');
      toast(p.mount.tg.flying ? '¡Alzáis el vuelo!' : 'Aterrizando.', 'good');
      fx('spark', p.t.x, p.t.y);
      return;
    }
    toast('Esta montura no vuela.', 'bad');
    return;
  }
  if (p.rollCd > 0 || p.st.st < B.ST_ROLL) return;
  if (p.act && p.act.phase === 'wind' && p.act.heavy) return;
  p.act = null; p.an.draw = 0;
  p.st.st -= B.ST_ROLL;
  p.rollT = B.ROLL_TIME; p.rollCd = p.rollCdBase;
  p.cb.iframe = B.ROLL_IFRAMES;
  const f = CR.Input.getFace();
  p.rollAng = f !== null ? f : p.t.ang;
  if (p.blk) p.blk.on = false;
  A.play('swing', { rate: 1.4 });
  fx('dust', p.t.x, p.t.y);
  if (E.unlocked(p, 'swiftness', 6)) p.counterWindow = 0.5;
};
E.throwDart = function (p, id) {
  if (!Inv.remove(p, id, 1)) { toast('No lo tienes.', 'bad'); return; }
  const ang = aimAngle(p);
  p.t.ang = ang;
  spawnProjectile(p, p.t.x + cos(ang) * 0.5, p.t.y + sin(ang) * 0.5, 14, id === 'dart_poison' ? 6 : 1, 'dart', {
    hostile: false, effect: id === 'dart_poison' ? 'poison' : 'sedate', pierce: 0, r: 0.24, life: 1.6, ang: ang
  });
  A.play('swing', { rate: 1.8 });
  p.an.atk = 0.2;
};
E.mount = function (m) {
  const p = E.player;
  if (!p || !m || p.mount) return false;
  if (!m.tg.tamed || !m.tg.mountable || m.tg.baby) { toast('Necesita ser adulto, tameado y con silla.', 'bad'); return false; }
  p.mount = m; m.tg.mounted = true;
  m.ai.state = 'ridden'; m.ai.path = null; m.ai.mv = null;
  p.act = null; if (p.blk) p.blk.on = false;
  A.play('mount');
  Bus.emit('mounted', { entity: m, flying: m.tg.flying });
  return true;
};
E.dismount = function () {
  const p = E.player;
  if (!p || !p.mount) return false;
  const m = p.mount;
  const spot = E.freeSpotNear(m.t.x, m.t.y, 1.4);
  p.t.x = spot.x; p.t.y = spot.y; p.t.px = p.t.x; p.t.py = p.t.y;
  m.tg.mounted = false; m.tg.flying = false;
  m.ai.state = 'follow'; m.ai.home.x = p.t.x; m.ai.home.y = p.t.y;
  p.mount = null;
  A.play('mount', { rate: 0.85 });
  Bus.emit('dismounted', { entity: m });
  return true;
};
E.toggleMount = function () {
  const p = E.player;
  if (!p) return;
  if (p.mount) { E.dismount(); return; }
  let best = null, bd = 3.4 * 3.4;
  for (let i = 0; i < E.list.length; i++) {
    const e = E.list[i];
    if (e.tg.dead || !e.tg.mountable || !e.tg.tamed || e.tg.baby) continue;
    const d = U.dist2(p.t.x, p.t.y, e.t.x, e.t.y);
    if (d < bd) { bd = d; best = e; }
  }
  if (best) E.mount(best);
  else toast('No hay montura con silla cerca.', 'bad');
};

/* ==========================================================
15 · BUCLE DEL JUGADOR
========================================================== */
function updatePlayer(dt) {
  const p = E.player;
  if (!p) return;
  const I = CR.Input;
  p.cb.cd = Math.max(0, p.cb.cd - dt);
  p.cb.comboT = Math.max(0, p.cb.comboT - dt);
  p.gatherCd = Math.max(0, p.gatherCd - dt);
  p.rollCd = Math.max(0, p.rollCd - dt);
  p.cb.iframe = Math.max(0, p.cb.iframe - dt);
  p.an.atk = Math.max(0, p.an.atk - dt);
  p.an.hurt = Math.max(0, p.an.hurt - dt);
  if (p.blk) p.blk.bashCd = Math.max(0, p.blk.bashCd - dt);
  if (p.parryFlash > 0) p.parryFlash -= dt;
  if (p.counterWindow > 0) p.counterWindow -= dt;
  for (const k in p.buffs) if (p.buffs[k] > 0) p.buffs[k] = Math.max(0, p.buffs[k] - dt);
  if (p.ko) { I.clearAll(); E.aim.kind = null; E.aim.ref = null; p.act = null; if (p.blk) p.blk.on = false; return; }
  /* Saciedad, hambre y regeneración */
  p.foodAcc += dt;
  while (p.foodAcc >= B.FOOD_TICK) { p.foodAcc -= B.FOOD_TICK; p.st.food = Math.max(0, p.st.food - 1); }
  if (p.st.food <= 0) {
    p.st.hp -= B.STARVE_DPS * dt;
    if (p.st.hp <= 0) { kill(p, null); return; }
  }
  let regen = p.regen + (p.buffs.regen > 0 ? (p.regenBonus || 0) : 0);
  if (p.st.food < B.REGEN_FOOD_MIN) regen *= 0.25;
  if (p.buffs.vigor > 0) regen += 1.2;
  if (regen > 0 && p.st.hp < p.st.maxHp) p.st.hp = Math.min(p.st.maxHp, p.st.hp + regen * dt);
  tickDots(p, dt);
  if (p.tg.dead || p.ko) return;
  /* Canal de aplicación (vendas, ungüentos) */
  if (p.cast) {
    p.cast.t += dt;
    const m0 = I.getMove();
    if (m0.mag > 0.4) { p.cast = null; toast('Aplicación interrumpida al moverte.', 'bad'); }
    else if (p.cast.t >= p.cast.dur) {
      const def = D.ITEMS[p.cast.id];
      if (def && def.heal && Inv.remove(p, p.cast.id, 1)) {
        applyHeal(p, def.heal);
        A.play('harvest'); fx('heal', p.t.x, p.t.y);
        toast(def.name + ' aplicado.', 'good');
      }
      p.cast = null;
    }
  }
  /* Bloqueo: canal independiente con parry inicial */
  const wantBlock = I.isHeld('block') && !!p.shield && !p.mount && !p.cast && p.cb.guard <= 0;
  if (wantBlock) {
    if (!p.blk.on) {
      if (canCancel(p)) {
        if (p.act && p.act.kind === 'draw') { p.act = null; p.an.draw = 0; }
        else if (!(p.act && p.act.kind === 'melee' && p.act.phase === 'wind')) {
          p.act = null; p.blk.on = true; p.blk.t = 0;
          A.play('block', { vol: 0.5 });
        }
      }
    }
  } else if (p.blk.on) p.blk.on = false;
  if (p.blk.on) {
    p.blk.t += dt;
    p.an.block = Math.min(1, p.an.block + dt * 8);
    p.st.st = Math.max(0, p.st.st - B.ST_BLOCK_HOLD * (p.shield ? p.shield.weight : 1) * dt);
    if (p.st.st <= 0) { p.blk.on = false; p.cb.guard = B.GUARD_BREAK_ST * 2; }
    if (CR.Settings.values.autoBlock && p.cb.stagger > 0) p.blk.on = false;
  } else p.an.block = Math.max(0, p.an.block - dt * 8);
  /* Entradas de acción */
  if (I.consume('roll')) E.doRoll();
  if (I.consume('mount')) E.toggleMount();
  if (I.consume('ammo')) E.cycleAmmo(p);
  if (I.consume('interact')) E.doInteract();
  const atkPress = I.consume('attack');
  const atkHeld = I.isHeld('attack');
  if (atkPress) E.playerAttack();
  else if (atkHeld && !p.blk.on && !p.cast) {
    if (p.isBow) { if (!p.act || p.act.kind !== 'draw') { if (p.cb.cd <= 0) startDraw(p); } }
    else if (E.unlocked(p, 'might', 2)) {
      const m1 = I.getMove();
      if (m1.mag < 0.12 && (!p.act || p.act.kind === 'charge')) {
        if (!p.act) p.act = { kind: 'charge', elapsed: 0, draw: 0, phase: 'charge' };
      } else if (p.cb.cd <= 0 && canCancel(p)) E.playerAttack();
    } else if (p.cb.cd <= 0 && canCancel(p)) E.playerAttack();
  }
  /* Soltar el botón dispara o suelta la carga */
  if (!atkHeld) {
    if (p.act && p.act.kind === 'draw') releaseArrow(p);
    else if (p.act && p.act.kind === 'charge') {
      const heavy = p.act.draw >= B.HEAVY_CHARGE;
      p.act = null; p.an.draw = 0;
      if (p.cb.cd <= 0) startMelee(p, heavy);
    }
    I.clearBowAim();
  }
  /* Progreso del canal activo */
  if (p.act) {
    const a = p.act;
    a.elapsed += dt;
    if (a.kind === 'draw') {
      a.draw += dt;
      p.an.draw = U.clamp(a.draw / (B.DRAW_FULL * p.drawMul), 0, 1);
      if (a.draw >= B.DRAW_HOLD_MAX * p.drawMul) releaseArrow(p);
    } else if (a.kind === 'charge') {
      a.draw += dt;
      p.an.draw = U.clamp(a.draw / B.HEAVY_CHARGE, 0, 1);
      if (a.draw >= B.HEAVY_CHARGE * 1.8) { p.act = null; startMelee(p, true); }
    } else if (a.kind === 'bash') {
      if (a.phase === 'active' && a.elapsed >= a.active) { a.phase = 'recover'; a.elapsed = 0; }
      else if (a.phase === 'recover' && a.elapsed >= a.recover) p.act = null;
    } else {
      if (a.phase === 'wind' && a.elapsed >= a.wind) { a.phase = 'active'; a.elapsed = 0; if (a.kind === 'melee') resolveMelee(p); }
      else if (a.phase === 'active' && a.elapsed >= a.active) { a.phase = 'recover'; a.elapsed = 0; }
      else if (a.phase === 'recover' && a.elapsed >= a.recover) p.act = null;
    }
  }
  /* Movimiento analógico con pivote */
  const m = I.getMove();
  const face = I.getFace();
  const pivoting = m.mag > 0.02 && m.mag < C.PIVOT_MAG;
  const moveMag = pivoting ? 0 : m.mag;
  const moving = moveMag > 0.01;
  if (p.isBow && I.bowAim.active) p.t.ang = I.bowAim.ang;
  else if (I.aimFresh()) p.t.ang = U.angDamp(p.t.ang, aimAngle(p), B.TURN_RATE * 1.4, dt);
  else if (face !== null) p.t.ang = U.angDamp(p.t.ang, face, pivoting ? B.PIVOT_RATE : B.TURN_RATE, dt);
  const sprint = I.isHeld('sprint') && moving && p.st.st > 1 && !p.mount && !(p.blk.on) &&
    (!E.unlocked(p, 'swiftness', 10));
  let base = sprint ? B.SPRINT : B.SPEED;
  base *= p.speedMul;
  if (p.st.food < B.ST_FOOD_MIN) base *= 0.75;
  if (p.cb.slow > 0) base *= (1 - p.cb.slow);
  if (p.blk.on) base *= 0.5;
  if (p.act && (p.act.kind === 'draw' || p.act.kind === 'charge')) base *= 0.45;
  if (p.cast) base *= 0.3;
  if (p.cb.stagger > 0) base *= 0.25;
  if (p.mount) {
    const mo = p.mount, sd = D.SPECIES[mo.species];
    const ms = ((sd && sd.mount) ? sd.mount.speed : 5) * (sprint ? 1.15 : 1) * (p.cb.slow > 0 ? (1 - p.cb.slow) : 1);
    mo.t.px = mo.t.x; mo.t.py = mo.t.y;
    if (moving) {
      mo.t.ang = U.angDamp(mo.t.ang, Math.atan2(m.y, m.x), B.TURN_RATE, dt);
      const fly = mo.tg.flying;
      const sp = ms * moveMag;
      mo.vx = U.damp(mo.vx || 0, (m.x / (m.mag || 1)) * sp, B.ACCEL, dt);
      mo.vy = U.damp(mo.vy || 0, (m.y / (m.mag || 1)) * sp, B.ACCEL, dt);
      move(mo, mo.vx * dt, mo.vy * dt, fly);
      mo.an.walk += U.len(mo.vx, mo.vy) * dt * 2;
      if (fly) {
        mo.st.st = Math.max(0, mo.st.st - B.ST_FLIGHT * dt);
        if (rngFx().chance(dt * 3)) fx('feather', mo.t.x, mo.t.y);
        if (W.isCity(Math.floor(mo.t.x), Math.floor(mo.t.y))) { mo.tg.flying = false; toast('No puedes volar dentro de las murallas.', 'bad'); }
        if (mo.st.st <= 0) { mo.tg.flying = false; toast('Tu montura debe aterrizar.', 'bad'); }
      } else if (sd && sd.mount && sd.mount.fly) mo.st.st = Math.min(mo.st.maxSt, mo.st.st + 9 * dt);
    } else {
      mo.vx = U.damp(mo.vx || 0, 0, B.DECEL, dt);
      mo.vy = U.damp(mo.vy || 0, 0, B.DECEL, dt);
      if (U.len(mo.vx, mo.vy) > 0.05) move(mo, mo.vx * dt, mo.vy * dt, mo.tg.flying);
      if (!mo.tg.flying && sd && sd.mount && sd.mount.fly) mo.st.st = Math.min(mo.st.maxSt, mo.st.st + 9 * dt);
      if (pivoting) mo.t.ang = U.angDamp(mo.t.ang, face, B.PIVOT_RATE, dt);
    }
    p.t.x = mo.t.x; p.t.y = mo.t.y - 0.35;
    p.t.ang = mo.t.ang; p.an.walk = mo.an.walk;
    mo.cb.cd = Math.max(0, mo.cb.cd - dt);
    if (sd && sd.mount && sd.mount.fly && mo.tg.flying && rngFx().chance(dt * 1.6)) A.playAt('flap', mo.t.x, mo.t.y, p.t.x, p.t.y);
  } else if (p.rollT > 0) {
    p.rollT -= dt;
    const sp = B.ROLL_SPEED * (0.6 + 0.4 * (p.rollT / B.ROLL_TIME));
    move(p, cos(p.rollAng) * sp * dt, sin(p.rollAng) * sp * dt, false);
    p.an.walk += dt * 12;
    if (rngFx().chance(dt * 20)) fx('dust', p.t.x, p.t.y);
    p.vx = cos(p.rollAng) * sp * 0.4; p.vy = sin(p.rollAng) * sp * 0.4;
  } else {
    const tvx = moving ? (m.x / (m.mag || 1)) * base * moveMag : 0;
    const tvy = moving ? (m.y / (m.mag || 1)) * base * moveMag : 0;
    p.vx = U.damp(p.vx || 0, tvx, moving ? B.ACCEL : B.DECEL, dt);
    p.vy = U.damp(p.vy || 0, tvy, moving ? B.ACCEL : B.DECEL, dt);
    const sp2 = U.len(p.vx, p.vy);
    if (sp2 < 0.04) { p.vx = 0; p.vy = 0; }
    else {
      move(p, p.vx * dt, p.vy * dt, false);
      p.an.walk += sp2 * dt * 2.2;
      p.stepAcc += sp2 * dt;
      if (p.stepAcc > 1.6) { p.stepAcc = 0; A.play('step', { vol: 0.55, rate: 0.9 + rngFx().next() * 0.3 }); }
    }
    if (sprint) p.st.st = Math.max(0, p.st.st - B.ST_SPRINT * dt);
  }
  if (!sprint && !p.blk.on) {
    const rate = p.st.food < B.ST_FOOD_MIN ? 0 : (moving ? B.ST_REGEN_MOVE : p.stRegen);
    const bonus = p.buffs.endurance > 0 ? 1.6 : 1;
    p.st.st = Math.min(p.st.maxSt, p.st.st + rate * bonus * dt);
  }
  if (Math.abs(p.v.x) > 0.01 || Math.abs(p.v.y) > 0.01) {
    move(p, p.v.x * dt, p.v.y * dt, false);
    const decay = Math.pow(0.001, dt);
    p.v.x *= decay; p.v.y *= decay;
  }
  /* Aura de ralentización (Mirada del Basilisco) */
  if (p.slowAura > 0) {
    W.Hash.query(p.t.x, p.t.y, 2.2, E._q4);
    for (let i = 0; i < E._q4.length; i++) {
      const t = E._q4[i];
      if (t === p || t.tg.dead || t.tg.tamed || t.tg.iceproof) continue;
      if (t.type !== 'creature') continue;
      t.cb.slow = Math.max(t.cb.slow, p.slowAura); t.cb.slowT = Math.max(t.cb.slowT, 0.4);
    }
  }
  p.t.dir = U.dir8(cos(p.t.ang), sin(p.t.ang));
  updateAim(p, dt);
}

/* ==========================================================
16 · USO DE OBJETOS (comida, curas, camas, colocables)
========================================================== */
function applyHeal(p, h) {
  if (h.instant) {
    if (h.instant.hp) p.st.hp = U.clamp(p.st.hp + h.instant.hp, 0, p.st.maxHp);
    if (h.instant.st) p.st.st = U.clamp(p.st.st + h.instant.st, 0, p.st.maxSt);
    if (h.instant.food) p.st.food = U.clamp(p.st.food + h.instant.food, 0, p.st.maxFood);
  }
  if (h.hp) p.st.hp = U.clamp(p.st.hp + h.hp, 0, p.st.maxHp);
  if (h.st) p.st.st = U.clamp(p.st.st + h.st, 0, p.st.maxSt);
  if (h.stopBleed) { p.cb.bleed = 0; p.cb.bleedT = 0; }
  if (h.cure) cure(p, h.cure);
  if (h.regen) { p.buffs.regen = h.regenT || 20; p.regenBonus = h.regen; }
  if (h.buff) p.buffs[h.buff] = Math.max(p.buffs[h.buff] || 0, h.buffT || 180);
  floater(p.t.x, p.t.y - 0.7, '+' + ((h.instant && h.instant.hp) || h.hp || 0), '#8fe08f');
}
function cure(p, what) {
  if (what === 'poison') { p.cb.poison = 0; p.cb.poisonT = 0; }
  else if (what === 'burn') { p.cb.burn = 0; p.cb.burnT = 0; }
  else if (what === 'bleed') { p.cb.bleed = 0; p.cb.bleedT = 0; }
  else if (what === 'slow') { p.cb.slow = 0; p.cb.slowT = 0; }
}
E.useItem = function (p, id) {
  const def = D.ITEMS[id];
  if (!def) return { ok: false, msg: 'Objeto desconocido.' };
  if (def.heal) {
    if (p.cast) return { ok: false, msg: 'Ya estás aplicando algo.' };
    const h = def.heal;
    if (h.instant) {
      if (!Inv.remove(p, id, 1)) return { ok: false, msg: 'No lo tienes.' };
      applyHeal(p, h);
      A.play('drink'); fx('heal', p.t.x, p.t.y);
      return { ok: true, msg: def.name + ' usado.' };
    }
    if (Inv.count(p, id) < 1) return { ok: false, msg: 'No lo tienes.' };
    p.cast = { id: id, t: 0, dur: h.cast || 1.2 };
    A.play('open');
    return { ok: true, msg: 'Aplicando ' + def.name + '…' };
  }
  if (def.food) {
    if (!Inv.remove(p, id, 1)) return { ok: false, msg: 'No lo tienes.' };
    const f = def.food;
    p.st.food = U.clamp(p.st.food + (f.food || 0), 0, p.st.maxFood);
    if (f.hp) p.st.hp = U.clamp(p.st.hp + f.hp, 0, p.st.maxHp);
    if (f.st) p.st.st = U.clamp(p.st.st + f.st, 0, p.st.maxSt);
    if (f.cure) cure(p, f.cure);
    if (f.buff) p.buffs[f.buff] = Math.max(p.buffs[f.buff] || 0, f.buffT || 180);
    A.play((f.food || 0) > 0 ? 'eat' : 'drink');
    fx('heal', p.t.x, p.t.y);
    floater(p.t.x, p.t.y - 0.6, '+' + (f.food || f.hp || f.st || 0), '#8fe08f');
    return { ok: true, msg: def.name + ' consumido.' };
  }
  if (def.bed) {
    if (def.bed.portable) { Bus.emit('sleep:request', { mode: 'roll' }); return { ok: true, msg: 'Extendiendo el petate…' }; }
    const x = Math.floor(p.t.x), y = Math.floor(p.t.y);
    const chk = W.canPlace(id, x, y, 'player');
    if (!chk.ok) return { ok: false, msg: chk.reason };
    if (!Inv.remove(p, id, 1)) return { ok: false, msg: 'No lo tienes.' };
    const r = W.addBuilding(id, x, y, 'player', {});
    if (!r.ok) { Inv.add(p, id, 1); return { ok: false, msg: r.reason }; }
    A.play('build'); fx('dust', x + 0.5, y + 0.5);
    E.syncGuardians();
    return { ok: true, msg: def.name + ' colocada.' };
  }
  /* Colocables v4: cofres desmontados y otros muebles con def.place */
  if (def.place) {
    const key = def.place;
    if (!D.BUILDINGS[key]) return { ok: false, msg: 'No se puede colocar.' };
    const x = Math.floor(p.t.x), y = Math.floor(p.t.y);
    let spot = null;
    for (let r = 0; r < 3 && !spot; r++) {
      for (let a = 0; a < 8 && !spot; a++) {
        const ang = a / 8 * U.TAU;
        const tx = Math.round(x + cos(ang) * r), ty = Math.round(y + sin(ang) * r);
        if (W.canPlace(key, tx, ty, 'player').ok) spot = { x: tx, y: ty };
      }
    }
    if (!spot) return { ok: false, msg: 'No hay hueco libre en tu parcela.' };
    if (!Inv.remove(p, id, 1)) return { ok: false, msg: 'No lo tienes.' };
    const r2 = W.addBuilding(key, spot.x, spot.y, 'player', {});
    if (!r2.ok) { Inv.add(p, id, 1); return { ok: false, msg: r2.reason }; }
    A.play('build'); fx('dust', spot.x + 0.5, spot.y + 0.5);
    Bus.emit('built', { key: key, building: r2.building });
    return { ok: true, msg: def.name + ' colocado.' };
  }
  if (def.saddle) {
    const near = E.nearestTamedMountable(p, def.saddle.for);
    if (!near) return { ok: false, msg: 'Acércate a un ' + (D.SPECIES[def.saddle.for] ? D.SPECIES[def.saddle.for].name.toLowerCase() : 'animal') + ' adulto tameado.' };
    const sd = D.SPECIES[def.saddle.for];
    if (sd && sd.mount && sd.mount.req && !D.meetsReq(sd.mount.req, p.lvl.level, p.lvl.alloc))
      return { ok: false, msg: 'Requiere ' + D.reqText(sd.mount.req) + '.' };
    if (!Inv.remove(p, id, 1)) return { ok: false, msg: 'No lo tienes.' };
    near.tg.mountable = true; near.tg.saddle = def.saddle.for;
    near.st.maxSt = (sd && sd.mount) ? sd.mount.stam : 120; near.st.st = near.st.maxSt;
    A.play('mount'); fx('spark', near.t.x, near.t.y);
    return { ok: true, msg: '¡' + near.name + ' ya puede montarse!' };
  }
  if (def.pet) {
    const near = E.nearestCompanion(p);
    if (!near) return { ok: false, msg: 'Acércate a tu compañero o montura.' };
    if (!Inv.remove(p, id, 1)) return { ok: false, msg: 'No lo tienes.' };
    near.tg.petArmor = def.pet.def;
    A.play('craft');
    return { ok: true, msg: near.name + ' protegido con barda (+' + def.pet.def + ' def).' };
  }
  if (def.animal) {
    const sp = def.animal.species, sd = D.SPECIES[sp];
    if (!sd) return { ok: false, msg: 'Especie desconocida.' };
    if (sd.livestock) {
      const pen = E.findPenSpace(p, sp);
      if (!pen) return { ok: false, msg: 'Necesitas un alojamiento con espacio (gallinero, corral o granero).' };
      if (!Inv.remove(p, id, 1)) return { ok: false, msg: 'No lo tienes.' };
      E.spawnCreature(sp, pen.x, pen.y, { persist: true, tamed: true, owner: 'player', livestock: true, home: pen });
      A.play('buy');
      return { ok: true, msg: sd.name + ' alojado.' };
    }
    if (!Inv.remove(p, id, 1)) return { ok: false, msg: 'No lo tienes.' };
    const spot = E.freeSpotNear(p.t.x, p.t.y, 2);
    E.spawnCreature(sp, spot.x, spot.y, { persist: true, tamed: true, owner: 'player' });
    A.play('buy');
    return { ok: true, msg: sd.name + ' invocado. Necesita silla para montarlo.' };
  }
  if (id === 'repair_kit') {
    let did = false;
    ['weapon', 'tool', 'shield'].forEach(function (k) {
      const s = p.equip[k]; if (!s || s.dur === undefined) return;
      const dd = D.ITEMS[s.id]; if (!dd) return;
      const max = maxDurOf(dd);
      if (s.dur < max) { s.dur = Math.min(max, s.dur + Math.round(max * 0.4)); did = true; }
    });
    if (!did) return { ok: false, msg: 'Tu equipo está como nuevo.' };
    Inv.remove(p, id, 1); A.play('craft');
    E.recalc(p);
    return { ok: true, msg: 'Equipo reparado un 40 %.' };
  }
  if (id === 'whetstone') {
    if (!Inv.remove(p, id, 1)) return { ok: false, msg: 'No lo tienes.' };
    p.buffs.sharp = 600;
    A.play('craft');
    return { ok: true, msg: 'Filo afilado: +15 % de daño un rato.' };
  }
  if (id === 'fishing_net') { Bus.emit('net:request', {}); return { ok: true, msg: 'Lanzando la red…' }; }
  if (id === 'dart_narcotic' || id === 'dart_poison') { E.throwDart(p, id); return { ok: true, msg: 'Dardo lanzado.' }; }
  if (def.ammo || def.bag || def.tool || def.weapon || def.shield || def.armor || def.acc) {
    const i = Inv.findUsable(p, id);
    if (i >= 0) return E.equipFromSlot(p, i);
    const j = Inv.find(p, id);
    if (j >= 0 && isBroken(p.inv[j])) return { ok: false, msg: def.name + ' está ROTA. Repárala desde el inventario.' };
    return { ok: false, msg: 'No lo tienes.' };
  }
  if (def.seed || def.fert || def.feed) return { ok: false, msg: 'Úsalo sobre el terreno o el animal con Interactuar.', hint: true };
  return { ok: false, msg: 'No se puede usar así.' };
};

/* ==========================================================
17 · INTERACCIÓN CONTEXTUAL
========================================================== */
E.findInteract = function () {
  const p = E.player;
  if (!p || p.ko) return null;
  const ax = cos(p.t.ang), ay = sin(p.t.ang);
  const fx2 = p.t.x + ax * 0.9, fy2 = p.t.y + ay * 0.9;
  let best = null, bestScore = -1e9;
  W.Hash.query(p.t.x, p.t.y, 2.6, E._q3);
  for (let i = 0; i < E._q3.length; i++) {
    const e = E._q3[i];
    if (e === p || e.tg.dead) continue;
    const dx = e.t.x - p.t.x, dy = e.t.y - p.t.y;
    const d = U.len(dx, dy);
    if (d > 2.3) continue;
    const dot = d < 0.7 ? 1 : (dx / d) * ax + (dy / d) * ay;
    const score = dot * 2 - d;
    if (score < bestScore) continue;
    if (e.type === 'npc') { bestScore = score; best = { kind: 'npc', target: e, label: 'Hablar con ' + e.name }; }
    else if (e.tg.livestock && e.tg.owner === 'player') {
      bestScore = score;
      best = { kind: 'livestock', target: e, label: (e.tg.ready ? 'Recoger de ' : 'Alimentar a ') + e.name };
    }
    else if (e.tg.tamed && e.tg.mountable && !e.tg.mounted) { bestScore = score; best = { kind: 'mount', target: e, label: 'Montar ' + e.name }; }
    else if (e.tg.tamed) { bestScore = score; best = { kind: 'pet', target: e, label: 'Acariciar a ' + e.name }; }
    else if (e.species && D.SPECIES[e.species] && D.SPECIES[e.species].tame) {
      const info = E.tameInfo(p, e);
      if (info && info.can) { bestScore = score; best = { kind: 'tame', target: e, label: info.label }; }
    }
  }
  if (best) return best;
  let bl = null, bld = 2.3 * 2.3;
  for (let i = 0; i < E.loot.length; i++) {
    const l = E.loot[i], d2 = U.dist2(p.t.x, p.t.y, l.x, l.y);
    if (d2 < bld) { bld = d2; bl = l; }
  }
  if (bl) return { kind: 'loot', target: bl, label: 'Recoger ' + E.lootName(bl) };
  const tx = Math.floor(fx2), ty = Math.floor(fy2);
  const b = W.buildingAt(tx, ty);
  if (b) return { kind: 'building', target: b, label: (b.key === 'stall' ? 'Comerciar en el puesto' : (b.info ? b.info.name : 'Edificio')) };
  const n = W.nodeAt(tx, ty);
  if (n) {
    const def = D.NODES[n.key];
    if (def.tool === 'hand') return { kind: 'node', target: n, label: 'Recoger ' + def.name.toLowerCase() };
    return { kind: 'node-tool', target: n, label: def.name + ' (usa Atacar)' };
  }
  const soil = W.soilAt(tx, ty);
  if (soil) return { kind: 'soil', target: { x: tx, y: ty, soil: soil }, label: soil.crop ? (soil.growth >= 1 ? 'Cosechar' : 'Regar') : 'Sembrar' };
  if (W.canTill(tx, ty)) return { kind: 'till', target: { x: tx, y: ty }, label: 'Arar tierra' };
  const spot = W.fishingSpot(p.t.x, p.t.y, 2.4);
  if (spot) return { kind: 'fish', target: spot, label: 'Pescar' };
  const parcel = W.parcelAt(tx, ty);
  if (parcel && !parcel.owner) return { kind: 'parcel', target: parcel, label: 'Parcela en venta' };
  return null;
};
E.doInteract = function () {
  const p = E.player;
  if (!p || p.ko) return;
  const it = E.findInteract();
  if (!it) { toast('No hay nada con lo que interactuar aquí.', ''); return; }
  switch (it.kind) {
    case 'npc': Bus.emit('interact:npc', { npcId: it.target.npcId, entity: it.target }); A.play('open'); break;
    case 'building': Bus.emit('interact:building', { building: it.target }); A.play('door'); break;
    case 'soil': Bus.emit('interact:soil', { x: it.target.x, y: it.target.y, soil: it.target.soil }); break;
    case 'till': Bus.emit('interact:soil', { x: it.target.x, y: it.target.y, soil: null }); break;
    case 'fish': Bus.emit('interact:fish', { spot: it.target }); break;
    case 'parcel': Bus.emit('interact:parcel', { parcel: it.target }); break;
    case 'node': gather(p, it.target); break;
    case 'node-tool': toast('Equipa la herramienta adecuada y usa Atacar.', ''); break;
    case 'mount': E.mount(it.target); break;
    case 'pet':
      it.target.an.bob = 0.5;
      A.playAt('tame', it.target.t.x, it.target.t.y, p.t.x, p.t.y);
      fx('heart', it.target.t.x, it.target.t.y);
      it.target.ai.bond = Math.min(1, (it.target.ai.bond || 0) + 0.05);
      toast(it.target.name + ' está contento.', 'good');
      break;
    case 'livestock': interactLivestock(it.target); break;
    case 'tame': E.tryTame(it.target); break;
    case 'loot': E.pickupLoot(it.target, true); break;
  }
};
function interactLivestock(e) {
  const p = E.player;
  if (e.tg.ready || e.tg.ready2) {
    if (e.tg.ready) {
      const left = Inv.add(p, e.tg.ready.id, e.tg.ready.n, e.tg.ready.q);
      if (left > 0) { toast('Inventario lleno.', 'bad'); return; }
      floater(e.t.x, e.t.y - 0.7, '+' + e.tg.ready.n + ' ' + D.ITEMS[e.tg.ready.id].name, '#efe3c8');
      e.tg.ready = null;
    }
    if (e.tg.ready2) { Inv.add(p, e.tg.ready2.id, e.tg.ready2.n, 0); e.tg.ready2 = null; }
    A.playAt('harvest', e.t.x, e.t.y, p.t.x, p.t.y);
    E.addXP(p, 'farming', 6);
    Bus.emit('livestock:collect', { entity: e, x: e.t.x, y: e.t.y });
    return;
  }
  const foods = ['feed_herb', 'feed_golden', 'feed_good', 'feed_basic', 'hay'];
  let used = null;
  for (let i = 0; i < foods.length; i++) if (Inv.count(p, foods[i]) > 0) { used = foods[i]; break; }
  if (!used) { toast('Necesitas pienso o heno para alimentarlo.', 'bad'); A.play('error'); return; }
  Inv.remove(p, used, 1);
  e.tg.fed = Math.min(3, e.tg.fed + 1);
  const fd = D.ITEMS[used];
  e.tg.feedQ = fd.feed ? fd.feed.q : [90, 10, 0, 0];
  if (fd.feed && fd.feed.heal) e.st.hp = Math.min(e.st.maxHp, e.st.hp + fd.feed.heal);
  e.an.bob = 0.5;
  A.playAt('eat', e.t.x, e.t.y, p.t.x, p.t.y);
  fx('heart', e.t.x, e.t.y);
  Bus.emit('livestock:feed', { entity: e, x: e.t.x, y: e.t.y });
  toast(e.name + ' alimentado (' + fd.name + ').', 'good');
}

/* ==========================================================
18 · TAMEO (comida / sedación / vínculo)
========================================================== */
E.tameInfo = function (p, e) {
  const sd = D.SPECIES[e.species];
  if (!sd || !sd.tame) return { can: false, label: '', reason: 'No se puede tamear.' };
  if (e.tg.tamed) return { can: false, label: '', reason: 'Ya es tuyo.' };
  const t = sd.tame;
  if (t.req && !D.meetsReq(t.req, p.lvl.level, p.lvl.alloc))
    return { can: false, label: '', reason: 'Requiere ' + D.reqText(t.req) + '.' };
  if (t.fromBaby && !e.tg.baby && t.method === 'feed')
    return { can: false, label: '', reason: 'Solo crías.' };
  const lvl = e.tg.level || 1;
  const need = Math.max(1, Math.round((t.feeds + (lvl - 1) * (t.perLevel || 1)) / (p.tameMul || 1)));
  const prog = e.tg.tameProgress || 0;
  if (t.method === 'sedate') {
    if (e.tg.sedated > 0) return { can: true, label: 'Alimentar (' + prog + '/' + need + ')', need: need, method: 'sedate' };
    if (e.st.hp > e.st.maxHp * B.TAME_SEDATE_HP)
      return { can: false, label: '', reason: 'Debilita por debajo del ' + Math.round(B.TAME_SEDATE_HP * 100) + ' %.' };
    if (Inv.count(p, 'dart_narcotic') < 1 && Inv.count(p, 'arrow_tame') < 1)
      return { can: false, label: '', reason: 'Necesitas dardo narcótico o flecha somnífera.' };
    return { can: true, label: 'Sedar y tamear', need: need, method: 'sedate' };
  }
  if (t.method === 'bond') {
    const calm = e.ai.calm || 0;
    if (calm < (t.calm || B.TAME_CALM_TIME))
      return { can: true, label: 'Acercarse despacio (' + Math.round(calm) + '/' + Math.round(t.calm || B.TAME_CALM_TIME) + ' s)', need: need, method: 'bond' };
    return { can: true, label: 'Ofrecer vínculo (' + prog + '/' + need + ')', need: need, method: 'bond' };
  }
  return { can: true, label: 'Alimentar (' + prog + '/' + need + ')', need: need, method: 'feed' };
};
E.tryTame = function (e) {
  const p = E.player;
  const sd = D.SPECIES[e.species];
  const info = E.tameInfo(p, e);
  if (!sd || !sd.tame) { toast('Esta criatura no se puede tamear.', 'bad'); return { ok: false }; }
  if (e.tg.tamed) { toast('Ya es tu compañero.', ''); return { ok: false }; }
  if (!info.can) { toast(info.reason, 'bad'); A.play('error'); return { ok: false }; }
  const maxComp = E.unlocked(p, 'beast', 10) ? 2 : 1;
  const t = sd.tame;
  if (t.method === 'sedate' && e.tg.sedated <= 0) {
    if (!Inv.remove(p, 'dart_narcotic', 1)) { toast('Necesitas un dardo narcótico.', 'bad'); return { ok: false }; }
    e.tg.sedated = B.TAME_SEDATE_TIME;
    e.tg.hostile = false; e.ai.state = 'idle'; e.ai.target = null; e.ai.mv = null;
    fx('spark', e.t.x, e.t.y);
    A.play('poison');
    toast(e.name + ' se duerme ' + B.TAME_SEDATE_TIME + ' s. Aliméntalo ' + info.need + ' veces.', 'good');
    return { ok: true, tamed: false };
  }
  if (t.method === 'bond' && (e.ai.calm || 0) < (t.calm || B.TAME_CALM_TIME)) {
    e.ai.bond = Math.min(1, (e.ai.bond || 0) + 0.08);
    fx('heart', e.t.x, e.t.y);
    A.playAt('tame', e.t.x, e.t.y, p.t.x, p.t.y);
    toast('Te acercas sin amenazar. No te muevas bruscamente.', '');
    return { ok: true, tamed: false };
  }
  let food = null;
  for (let i = 0; i < t.foods.length; i++) if (Inv.count(p, t.foods[i]) > 0) { food = t.foods[i]; break; }
  if (!food) {
    const names = t.foods.map(function (f) { return D.ITEMS[f] ? D.ITEMS[f].name : f; }).join(', ');
    toast('Necesitas: ' + names, 'bad'); A.play('error');
    return { ok: false };
  }
  if (E.companionCount(p) >= maxComp + 2) { toast('Ya tienes demasiados compañeros activos.', 'bad'); return { ok: false }; }
  Inv.remove(p, food, 1);
  e.tg.tameProgress = (e.tg.tameProgress || 0) + 1;
  e.an.bob = 0.5;
  e.ai.state = 'idle'; e.ai.target = null; e.tg.hostile = false;
  e.ai.ease = 1; e.ai.scaredT = 0;
  A.playAt('eat', e.t.x, e.t.y, p.t.x, p.t.y);
  fx('heart', e.t.x, e.t.y);
  if (e.tg.tameProgress >= info.need) {
    e.tg.sedated = 0; e.tg.tamed = true; e.tg.owner = 'player'; e.tg.persist = true;
    e.tg.hostile = false; e.tg.faction = 'player'; e.ai.state = 'follow';
    e.name = sd.name + ' (tuyo)';
    A.play('tame');
    Bus.emit('banner', { title: '¡' + sd.name.toUpperCase() + ' DOMADO!', sub: 'Ahora lucha a tu lado.' });
    fx('spark', e.t.x, e.t.y);
    E.addXP(p, 'combat', B.XP_TAME);
    Bus.emit('tamed', { entity: e, species: e.species });
    return { ok: true, tamed: true };
  }
  toast(e.name + ' confía un poco más (' + e.tg.tameProgress + '/' + info.need + ').', 'good');
  return { ok: true, tamed: false };
};
E.nearestTamedMountable = function (p, species) {
  let best = null, bd = 3.6 * 3.6;
  for (let i = 0; i < E.list.length; i++) {
    const e = E.list[i];
    if (e.tg.dead || !e.tg.tamed || e.tg.baby || e.species !== species) continue;
    const d = U.dist2(p.t.x, p.t.y, e.t.x, e.t.y);
    if (d < bd) { bd = d; best = e; }
  }
  return best;
};
E.nearestCompanion = function (p) {
  let best = null, bd = 3.6 * 3.6;
  for (let i = 0; i < E.list.length; i++) {
    const e = E.list[i];
    if (e.tg.dead || !e.tg.tamed || e.tg.owner !== 'player' || e.tg.livestock) continue;
    const d = U.dist2(p.t.x, p.t.y, e.t.x, e.t.y);
    if (d < bd) { bd = d; best = e; }
  }
  return best;
};

/* ==========================================================
19 · PROYECTILES Y HAZARDS
========================================================== */
function spawnProjectile(owner, tx, ty, speed, dmg, type, opts) {
  const pr = projPool.acquire();
  if (!pr) return null;
  const o = opts || {};
  const ang = o.ang !== undefined ? o.ang : Math.atan2(ty - owner.t.y, tx - owner.t.x);
  pr.x = owner.t.x + cos(ang) * 0.4; pr.y = owner.t.y + sin(ang) * 0.4;
  pr.px = pr.x; pr.py = pr.y;
  pr.vx = cos(ang) * speed; pr.vy = sin(ang) * speed;
  pr.life = o.life || 3; pr.dmg = dmg; pr.type = type; pr.owner = owner;
  pr.hostile = o.hostile !== false;
  pr.effect = o.effect || null; pr.pierce = o.pierce || 0; pr.ammo = o.ammo || null;
  pr.crit = !!o.crit; pr.r = o.r || 0.34;
  pr.hitIds.length = 0;
  E.projectiles.push(pr);
  return pr;
}
E.spawnProjectile = spawnProjectile;
function projectileTargets(pr, t) {
  if (!t || t.tg.dead || t === pr.owner) return false;
  if (pr.hitIds.indexOf(t.id) >= 0) return false;
  if (pr.hostile) {
    if (t.type === 'player') return !t.ko;
    if (t.type === 'worker') return true;
    if (t.tg.tamed && t.tg.owner === 'player') return true;
    if (t.type === 'guard') return true;
    return false;
  }
  if (t.type === 'player' || t.type === 'worker') return false;
  if (t.tg.tamed && t.tg.owner === 'player') return false;
  return true;
}
function updateProjectiles(dt) {
  const p = E.player;
  for (let i = E.projectiles.length - 1; i >= 0; i--) {
    const pr = E.projectiles[i];
    pr.px = pr.x; pr.py = pr.y;
    pr.x += pr.vx * dt; pr.y += pr.vy * dt;
    pr.life -= dt;
    let dead = false;
    const solid = W.isSolid(Math.floor(pr.x), Math.floor(pr.y));
    if (solid && pr.type !== 'fire' && pr.type !== 'wisp') dead = true;
    /* Guardia 8: bloqueando, devuelves el proyectil */
    if (!dead && pr.hostile && p && !p.ko && p.blk && p.blk.on && E.unlocked(p, 'guard', 8)) {
      if (U.dist2(pr.x, pr.y, p.t.x, p.t.y) < 0.9) {
        pr.hostile = false; pr.owner = p;
        pr.vx = -pr.vx * 1.2; pr.vy = -pr.vy * 1.2;
        pr.dmg = p.cb.dmg * 0.6;
        pr.hitIds.length = 0;
        p.parryFlash = 0.3;
        A.play('parry');
        continue;
      }
    }
    if (!dead) {
      W.Hash.query(pr.x, pr.y, pr.r + 0.7, E._q1);
      for (let k = 0; k < E._q1.length; k++) {
        const t = E._q1[k];
        if (!projectileTargets(pr, t)) continue;
        if (U.dist2(pr.x, pr.y, t.t.x, t.t.y) > (pr.r + 0.36 * (t.tg.scale || 1)) * (pr.r + 0.36 * (t.tg.scale || 1))) continue;
        const ex = { crit: pr.crit };
        if (pr.effect === 'burn') ex.burn = 6;
        else if (pr.effect === 'poison') ex.poison = 6;
        else if (pr.effect === 'bleed') ex.bleed = 5;
        else if (pr.effect === 'slow') { ex.slow = 0.45; ex.slowT = 3; }
        if (pr.effect === 'sedate') {
          const sd = D.SPECIES[t.species];
          if (sd && sd.tame && t.st.hp <= t.st.maxHp * B.TAME_SEDATE_HP && !t.tg.tamed) {
            t.tg.sedated = B.TAME_SEDATE_TIME; t.tg.hostile = false;
            t.ai.state = 'idle'; t.ai.target = null; t.ai.mv = null;
            fx('spark', t.t.x, t.t.y);
            toast(t.name + ' se adormece. Aliméntalo para tamearlo.', 'good');
            A.playAt('poison', t.t.x, t.t.y, pr.x, pr.y);
          } else if (sd && sd.tame && !t.tg.tamed) {
            toast('Debilita a ' + t.name + ' antes de sedarlo.', 'bad');
          }
          E.damage(t, Math.max(1, pr.dmg), pr.owner, { knock: 0.4 });
        } else {
          E.damage(t, pr.dmg, pr.owner, ex);
        }
        pr.hitIds.push(t.id);
        if (pr.pierce > 0) { pr.pierce--; pr.dmg *= 0.75; }
        else dead = true;
        break;
      }
    }
    if (pr.type === 'fire' && rngFx().chance(dt * 22)) fx('fire', pr.x, pr.y);
    if (pr.type === 'wisp' && rngFx().chance(dt * 14)) fx('spark', pr.x, pr.y);
    if (dead || pr.life <= 0 || !W.inBounds(Math.floor(pr.x), Math.floor(pr.y))) {
      if (pr.type === 'fire') fx('fire', pr.x, pr.y);
      else if (pr.type === 'venom') fx('poison', pr.x, pr.y);
      else if (pr.type !== 'arrow' && pr.type !== 'bolt' && pr.type !== 'dart') fx('stone', pr.x, pr.y);
      E.projectiles.splice(i, 1);
      projPool.release(pr);
    }
  }
}
function updateHazards(dt) {
  for (let i = E.hazards.length - 1; i >= 0; i--) {
    const h = E.hazards[i];
    h.life -= dt; h.t += dt;
    if (h.life <= 0) { E.hazards.splice(i, 1); continue; }
    if (h.t < 0.4) continue;
    h.t = 0;
    W.Hash.query(h.x, h.y, h.r, E._q1);
    for (let k = 0; k < E._q1.length; k++) {
      const t = E._q1[k];
      if (t.tg.dead) continue;
      if (h.hostile) { if (t.type !== 'player' && t.type !== 'worker' && !(t.tg.tamed && t.tg.owner === 'player')) continue; }
      else if (t.type === 'player' || t.type === 'worker' || (t.tg.tamed && t.tg.owner === 'player')) continue;
      if (U.dist2(h.x, h.y, t.t.x, t.t.y) > h.r * h.r) continue;
      E.damage(t, h.dps * 0.4, h.owner || null, { dot: true, poison: h.type === 'poison' ? 3 : 0, burn: h.type === 'fire' ? 4 : 0 });
    }
  }
}

/* ==========================================================
20 · IA ECOLÓGICA
   Dieta y facción deciden a quién se ataca y de quién se huye.
   Golpes en RÁFAGAS con telegrafía y DESCANSO. Jefes por fases.
========================================================== */
function dropCombat(e) {
  e.ai.mv = null; e.ai.mvPhase = ''; e.ai.mvT = 0;
  e.ai.burst = 0; e.an.tele = 0;
}
function hostileTo(e, t) {
  if (!t || t.tg.dead || t === e) return false;
  if (t.type === 'player' && t.ko) return false;
  if (e.tg.tamed || e.type === 'worker') {
    if (t.type === 'creature' && !t.tg.tamed &&
      (t.tg.hostile || t.tg.faction === 'predator' || t.tg.faction === 'undead' ||
       t.tg.faction === 'bandit' || t.tg.faction === 'mythic')) return true;
    if (t.type === 'guard' && t.tg.angry) return true;
    if (t.species === 'bandit') return true;
    return false;
  }
  if (e.type === 'guard' || e.tg.guardian === 'city') {
    if (t.type === 'player') return E.heat >= 40 || e.tg.angry;
    if (t.species === 'bandit') return true;
    if (t.type === 'creature' && !t.tg.tamed && !t.tg.livestock && !t.tg.mounted)
      return W.isCity(Math.floor(t.t.x), Math.floor(t.t.y)) && (t.tg.hostile || t.tg.faction === 'predator');
    return false;
  }
  if (e.tg.guardian === 'player') {
    if (t.species === 'bandit') return true;
    return t.type === 'creature' && !t.tg.tamed &&
      (t.tg.hostile || t.tg.faction === 'predator' || t.tg.faction === 'undead' || t.tg.faction === 'mythic');
  }
  if (e.tg.guardian === 'zone') {
    if (t.type === 'player' || t.type === 'worker') return true;
    if (t.tg.tamed && t.tg.owner === 'player') return true;
    if (t.species === 'bandit') return true;
    return false;
  }
  if (e.species === 'bandit')
    return t.type === 'player' || t.type === 'worker' || t.type === 'guard' ||
      (t.tg.tamed && t.type === 'creature');
  if (e.tg.hostile || e.tg.faction === 'undead' || e.tg.faction === 'mythic')
    return t.type === 'player' || t.type === 'worker' ||
      (t.tg.tamed && t.type === 'creature') ||
      (t.type === 'guard' && W.isCity(Math.floor(e.t.x), Math.floor(e.t.y)));
  return false;
}
function findEnemy(e, radius) {
  W.Hash.query(e.t.x, e.t.y, radius, E._q2);
  let best = null, bd = radius * radius;
  for (let i = 0; i < E._q2.length; i++) {
    const t = E._q2[i];
    if (!hostileTo(e, t)) continue;
    if (!W.lineOfSight(e.t.x, e.t.y, t.t.x, t.t.y)) continue;
    const d = U.dist2(e.t.x, e.t.y, t.t.x, t.t.y);
    if (d < bd) { bd = d; best = t; }
  }
  return best;
}
function findPrey(e, radius) {
  W.Hash.query(e.t.x, e.t.y, radius, E._q2);
  let best = null, bd = radius * radius;
  for (let i = 0; i < E._q2.length; i++) {
    const t = E._q2[i];
    if (t === e || t.tg.dead) continue;
    if (t.type !== 'creature' && t.type !== 'livestock') continue;
    if (t.tg.tamed || t.tg.owner === 'player' || t.tg.mounted) continue;
    if (t.tg.boss || t.tg.guardian) continue;
    if (!D.ECO.hunts(e.species, t.species)) continue;
    const d = U.dist2(e.t.x, e.t.y, t.t.x, t.t.y);
    if (d < bd) { bd = d; best = t; }
  }
  return best;
}
/* ---------- Confianza de presas domables por comida ----------
   Al principio SIEMPRE huyen. Solo confían si llevas en la mochila algo
   de su comida: entonces ganan confianza si estás quieto (rápido) o te
   acercas muy despacio (lento); caminando normal casi no suben. Con plena
   confianza se quedan mirándote y, si sigues quieto, se acercan solos.
   Sin su comida, o si corres, rodas o atacas, huyen como siempre. */
function feedTameable(sd, e) { return !!(sd && sd.tame && sd.tame.method === 'feed' && !e.tg.tamed); }
function playerHasFoodFor(p, sd) {
  const f = sd.tame.foods;
  for (let i = 0; i < f.length; i++) if (Inv.count(p, f[i]) > 0) return true;
  return false;
}
function updateEase(e, sd, p, dt) {
  const ai = e.ai;
  if (ai.scaredT > 0) ai.scaredT = Math.max(0, ai.scaredT - dt);
  if (p.ko) { ai.ease = Math.max(0, (ai.ease || 0) - dt * 0.3); ai.curious = false; return; }
  const d2 = U.dist2(e.t.x, e.t.y, p.t.x, p.t.y);
  const range = (B.TAME_EASE_RANGE || 11);
  if (d2 > range * range) { ai.ease = Math.max(0, (ai.ease || 0) - dt * 0.15); ai.curious = false; return; }
  /* Sin su comida no hay confianza posible */
  if (!playerHasFoodFor(p, sd)) { ai.ease = Math.max(0, (ai.ease || 0) - dt * 0.5); ai.curious = false; return; }
  const mo = p.mount;
  const sp = mo ? U.len(mo.vx || 0, mo.vy || 0) : U.len(p.vx || 0, p.vy || 0);
  const walk = B.SPEED * (p.speedMul || 1);
  const hostileAct = p.act && (p.act.kind === 'melee' || p.act.kind === 'bash' || p.act.kind === 'draw' || p.act.kind === 'charge');
  const loud = p.rollT > 0 || hostileAct || sp > walk * 1.08;
  if (loud) {
    if (d2 < (sd.aggro || 5) * (sd.aggro || 5) * 1.6) { ai.ease = 0; ai.scaredT = Math.max(ai.scaredT, 1.4); ai.curious = false; }
    return;
  }
  const still = sp < 0.4;
  const gain = still ? 0.5 : (sp < walk * 0.62 ? 0.3 : 0.05);
  const before = ai.ease || 0;
  ai.ease = Math.min(1, before + gain * dt);
  ai.curious = ai.ease >= 0.75 && still && !mo;
  if (before < 0.7 && ai.ease >= 0.7 && d2 < 64) fx('heart', e.t.x, e.t.y);
}
/** ¿Debe huir de ti? El radio de susto se encoge con la confianza. */
function playerSpooks(e, sd, p, d2, baseR) {
  if (!p || p.ko) return false;
  if (!feedTameable(sd, e) || e.ai.scaredT > 0) return d2 < baseR * baseR;
  const r = Math.max(B.TAME_MIN_SPOOK || 0.9, baseR * (1 - 0.88 * (e.ai.ease || 0)));
  return d2 < r * r;
}
/** Si ya confía, se queda quieto mirándote (y se acerca si llevas su comida). */
function calmHold(e, sd, p, d2) {
  if (!feedTameable(sd, e) || !p || p.ko) return false;
  const ai = e.ai;
  if ((ai.ease || 0) < 0.4 || d2 > 81) { ai.curious = false; return false; }
  ai.state = 'idle'; ai.target = null; ai.threat = null;
  return true;
}
function findThreat(e, radius) {
  W.Hash.query(e.t.x, e.t.y, radius, E._q2);
  let best = null, bd = radius * radius;
  for (let i = 0; i < E._q2.length; i++) {
    const t = E._q2[i];
    if (t === e || t.tg.dead || t.type !== 'creature') continue;
    if (t.tg.tamed || t.tg.baby) continue;
    if (!D.ECO.fears(e.species, t.species)) continue;
    const d = U.dist2(e.t.x, e.t.y, t.t.x, t.t.y);
    if (d < bd) { bd = d; best = t; }
  }
  return best;
}
function activePattern(e) {
  const sd = D.SPECIES[e.species];
  if (!sd) return null;
  if (sd.boss && sd.boss.phases) {
    const ph = D.ECO.bossPhase(sd, e.st.hp / Math.max(1, e.st.maxHp));
    if (ph) return ph;
  }
  return sd.pattern || null;
}
/* ==========================================================
20b · ÓRDENES A COMPAÑEROS
   Seguir · Quedarse · Ir a un punto · Atacar un objetivo · Tareas de
   apoyo para herbívoros que no atacan (recoger botín, forrajear,
   vigía y abonar) · Liberar.
========================================================== */
const PET_TASKS = ['haul', 'forage', 'watch', 'manure'];
E.PET_TASKS = PET_TASKS;
E.PET_ORDER_NAMES = { follow: 'Te sigue', stay: 'Quieto', goto: 'Yendo al punto', attack: 'Atacando',
  haul: 'Recogiendo botín', forage: 'Forrajeando', watch: 'De vigía', manure: 'Abonando' };
E.isCompanion = function (e) {
  return !!e && !e.tg.dead && e.type === 'creature' && e.tg.tamed && e.tg.owner === 'player' && !e.tg.livestock && !e.tg.guardian;
};
E.isSupport = function (e) {
  const sd = e && e.species ? D.SPECIES[e.species] : null;
  if (!sd) return false;
  return sd.dmg <= 0 || sd.diet === 'herbivore' || sd.diet === 'insectivore';
};
E.canAttackOrder = function (e) {
  const sd = e && e.species ? D.SPECIES[e.species] : null;
  return !!sd && sd.dmg > 0;
};
E.companionList = function () {
  const out = [];
  for (let i = 0; i < E.list.length; i++) if (E.isCompanion(E.list[i])) out.push(E.list[i]);
  return out;
};
function leashOf(sd) { return (sd && sd.leash) || (sd && sd.kind === 'mythic' ? B.AI_LEASH_MYTH : B.AI_LEASH); }
E.setOrder = function (e, order, tgt) {
  const p = E.player;
  if (!p || !E.isCompanion(e)) return { ok: false, msg: '' };
  const sd = D.SPECIES[e.species], tg = e.tg;
  if (tg.mounted) return { ok: false, msg: e.name + ' está montado.' };
  if (order === 'attack' && !E.canAttackOrder(e)) return { ok: false, msg: e.name + ' no ataca.' };
  if (PET_TASKS.indexOf(order) >= 0 && !E.isSupport(e)) return { ok: false, msg: e.name + ' no hace tareas de apoyo.' };
  tg.order = order; tg.otk = 'player'; tg.otid = 0; tg.taskT = 0; tg.alertT = 0;
  e.ai.path = null; e.ai.target = null; e.ai.prey = null; e.ai.tl = null; e.ai.tn = null;
  dropCombat(e);
  e.ai.leash = leashOf(sd);
  e.an.bob = 0.4;
  A.playAt('tame', e.t.x, e.t.y, p.t.x, p.t.y);
  if (order === 'follow') {
    e.ai.state = 'follow';
    return { ok: true, msg: e.name + ' te sigue.' };
  }
  if (order === 'stay') {
    tg.ox = e.t.x; tg.oy = e.t.y;
    e.ai.home.x = tg.ox; e.ai.home.y = tg.oy; e.ai.leash = 7; e.ai.state = 'hold';
    return { ok: true, msg: e.name + ' se queda quieto.' };
  }
  if (order === 'goto') {
    const pt = tgt || { x: p.t.x, y: p.t.y };
    tg.ox = pt.x; tg.oy = pt.y; tg.otk = 'point'; e.ai.state = 'petgo';
    return { ok: true, msg: e.name + ' va al punto marcado.' };
  }
  if (order === 'attack') {
    const t = tgt && tgt.ent;
    if (!t || t.tg.dead) { tg.order = 'follow'; return { ok: false, msg: 'No hay objetivo.' }; }
    tg.otid = t.id; e.ai.home.x = p.t.x; e.ai.home.y = p.t.y; e.ai.leash = 40;
    e.ai.target = t; e.ai.prey = t; e.ai.state = 'chase';
    return { ok: true, msg: e.name + ' ataca a ' + t.name + '.' };
  }
  /* tareas de apoyo */
  if (tgt && tgt.x !== undefined) { tg.otk = 'point'; tg.ox = tgt.x; tg.oy = tgt.y; }
  else if (order === 'watch') { tg.otk = 'point'; tg.ox = e.t.x; tg.oy = e.t.y; }
  tg.taskT = order === 'manure' ? 40 : 0;
  e.ai.state = 'petwork';
  const where = tg.otk === 'point' ? ' en ese punto' : ' a tu alrededor';
  const msgs = { haul: 'recoge el botín' + where, forage: 'forrajea' + where, watch: 'hace de vigía' + where, manure: 'abona' + where };
  return { ok: true, msg: e.name + ' ' + msgs[order] + '.' };
};
E.orderAll = function (order) {
  const list = E.companionList();
  let n = 0;
  for (let i = 0; i < list.length; i++) if (E.setOrder(list[i], order, null).ok) n++;
  toast(n ? (order === 'stay' ? 'Compañeros quietos (' + n + ').' : 'Compañeros te siguen (' + n + ').') : 'No hay compañeros.', n ? 'good' : '');
  return n;
};
E.releasePet = function (e) {
  const p = E.player;
  if (!p || !E.isCompanion(e)) return false;
  const sd = D.SPECIES[e.species], tg = e.tg;
  if (p.mount === e) E.dismount();
  if (tg.mountable && sd && sd.mount && sd.mount.saddle && D.ITEMS[sd.mount.saddle]) Inv.add(p, sd.mount.saddle, 1);
  tg.tamed = false; tg.owner = null; tg.persist = false; tg.hostile = false;
  tg.faction = sd ? sd.faction : 'prey';
  tg.mountable = false; tg.mounted = false; tg.saddle = null; tg.petArmor = 0;
  tg.tameProgress = 0; tg.order = 'follow'; tg.otid = 0;
  e.ai.state = 'wander'; e.ai.target = null; e.ai.prey = null; e.ai.path = null; e.ai.tl = null; e.ai.tn = null;
  e.ai.home.x = e.t.x; e.ai.home.y = e.t.y; e.ai.leash = leashOf(sd);
  dropCombat(e);
  fx('heart', e.t.x, e.t.y);
  A.playAt('tame', e.t.x, e.t.y, p.t.x, p.t.y);
  toast(e.name + ' vuelve a la naturaleza.', '');
  return true;
};
E.petTarget = function (p) {
  const ax = cos(p.t.ang), ay = sin(p.t.ang);
  const lock = E.aim && E.aim.lock;
  if (lock && !lock.tg.dead && lock.type === 'creature' && !lock.tg.tamed) return { kind: 'enemy', ent: lock, x: lock.t.x, y: lock.t.y };
  W.Hash.query(p.t.x, p.t.y, 14, E._q3);
  let best = null, bs = -1e9;
  for (let i = 0; i < E._q3.length; i++) {
    const t = E._q3[i];
    if (t.tg.dead || t.type !== 'creature' || t.tg.tamed || t.tg.mounted) continue;
    const dx = t.t.x - p.t.x, dy = t.t.y - p.t.y, d = U.len(dx, dy);
    if (d > 14 || d < 0.2) continue;
    const dot = (dx / d) * ax + (dy / d) * ay;
    if (dot < 0.55) continue;
    const sc = dot * 3 - d * 0.1;
    if (sc > bs) { bs = sc; best = t; }
  }
  if (best) return { kind: 'enemy', ent: best, x: best.t.x, y: best.t.y };
  for (let k = 1; k <= 9; k++) {
    const n = W.nodeAt(Math.floor(p.t.x + ax * k), Math.floor(p.t.y + ay * k));
    const nd = n ? D.NODES[n.key] : null;
    if (nd && nd.tool === 'hand') return { kind: 'node', node: n, x: n.x + 0.5, y: n.y + 0.5 };
  }
  for (let k = 7; k >= 2; k--) {
    const x = p.t.x + ax * k, y = p.t.y + ay * k;
    if (W.walkable(Math.floor(x), Math.floor(y), false)) return { kind: 'point', x: x, y: y };
  }
  return { kind: 'point', x: p.t.x, y: p.t.y };
};
E.orderToTarget = function (e) {
  const p = E.player;
  if (!p || !E.isCompanion(e)) return { ok: false, msg: '' };
  const t = E.petTarget(p);
  if (t.kind === 'enemy') {
    if (E.canAttackOrder(e)) return E.setOrder(e, 'attack', { ent: t.ent });
    return { ok: false, msg: e.name + ' no ataca. Apunta a un recurso o a un punto del suelo.' };
  }
  if (t.kind === 'node' && E.isSupport(e)) return E.setOrder(e, 'forage', { x: t.x, y: t.y });
  return E.setOrder(e, 'goto', { x: t.x, y: t.y });
};
function petAnchor(e, p) { return e.tg.otk === 'point' ? { x: e.tg.ox, y: e.tg.oy } : { x: p.t.x, y: p.t.y }; }
function petGo(e, tx, ty, speed, dt) {
  const d2 = U.dist2(e.t.x, e.t.y, tx, ty);
  if (d2 > 36 && !e.ai.path && rngAI().chance(0.05)) requestPath(e, tx, ty, e.tg.flying);
  if (e.ai.path) followPath(e, speed, dt, e.tg.flying);
  else stepToward(e, tx, ty, speed, dt, e.tg.flying);
}
function petIdle(e, an, speed, dt) {
  if (U.dist2(e.t.x, e.t.y, an.x, an.y) > 16) petGo(e, an.x, an.y, speed * 1.1, dt);
  else e.an.walk += dt * 0.3;
}
function petFindLoot(e, ax, ay, R) {
  let best = null, bd = 1e9;
  for (let i = 0; i < E.loot.length; i++) {
    const l = E.loot[i];
    if (l.life <= 0 || l.warned) continue;
    if (U.dist2(ax, ay, l.x, l.y) > R * R) continue;
    const d = U.dist2(e.t.x, e.t.y, l.x, l.y);
    if (d < bd) { bd = d; best = l; }
  }
  return best;
}
function petHaulStep(e, ax, ay, R, speed, dt) {
  let tl = e.ai.tl;
  if (tl && (tl.life <= 0 || tl.warned)) tl = e.ai.tl = null;
  if (!tl && e.tg.taskT <= 0) { e.tg.taskT = 0.6; tl = e.ai.tl = petFindLoot(e, ax, ay, R); }
  if (!tl) return false;
  if (U.dist2(e.t.x, e.t.y, tl.x, tl.y) < 1.5) {
    E.pickupLoot(tl, false); e.an.bob = 0.4; e.ai.tl = null; e.tg.taskT = 0.25;
  } else petGo(e, tl.x, tl.y, speed * 1.25, dt);
  return true;
}
const COMPASS = ['este', 'sureste', 'sur', 'suroeste', 'oeste', 'noroeste', 'norte', 'noreste'];
function updatePetWork(e, dt, speed, p) {
  if (!p) return;
  const tg = e.tg, ord = tg.order, an = petAnchor(e, p);
  tg.taskT -= dt;
  if (ord === 'haul') {
    if (!petHaulStep(e, an.x, an.y, 16, speed, dt)) petIdle(e, an, speed, dt);
    return;
  }
  if (ord === 'forage') {
    let tn = e.ai.tn;
    if (tn && tn.dead) tn = e.ai.tn = null;
    if (!tn && tg.taskT <= 0) {
      tg.taskT = 1.2;
      let best = null, bd = 1e9;
      W.nodes.forEach(function (n) {
        if (n.dead) return;
        const dx = n.x + 0.5 - an.x, dy = n.y + 0.5 - an.y;
        if (dx * dx + dy * dy > 225) return;
        const nd = D.NODES[n.key];
        if (!nd || nd.tool !== 'hand') return;
        const d = U.dist2(e.t.x, e.t.y, n.x + 0.5, n.y + 0.5);
        if (d < bd) { bd = d; best = n; }
      });
      tn = e.ai.tn = best;
    }
    if (!tn) {
      if (!petHaulStep(e, e.t.x, e.t.y, 8, speed, dt)) petIdle(e, an, speed, dt);
      return;
    }
    if (U.dist2(e.t.x, e.t.y, tn.x + 0.5, tn.y + 0.5) > 2.6) { petGo(e, tn.x + 0.5, tn.y + 0.5, speed * 1.2, dt); return; }
    if (tg.taskT > 0) { e.an.walk += dt * 0.4; return; }
    tg.taskT = 0.8;
    e.an.atk = 0.3; e.an.bob = 0.4;
    const res = W.damageNode(tn.x, tn.y, 'hand', 99, E.day);
    if (!res.ok) { e.ai.tn = null; return; }
    sfxAt('harvest', tn.x + 0.5, tn.y + 0.5);
    if (res.broke) {
      const def = res.def, rng = rngLoot();
      const yieldB = 1 + E.skillVal(p, 'yield') + E.levelOf(p, 'farming') * B.TRADE_BONUS;
      const drops = [];
      for (let i = 0; i < def.drops.length; i++) {
        const dr = def.drops[i];
        if (!rng.chance(Math.min(1, dr[3] + (p.luck || 0)))) continue;
        const n2 = Math.round(rng.int(dr[1], dr[2]) * yieldB);
        if (n2 > 0) drops.push({ id: dr[0], n: n2, q: 0 });
      }
      E.dropLoot(tn.x + 0.5, tn.y + 0.5, drops, { delay: 0.2, toward: e.t });
      E.addXP(p, 'farming', Math.max(1, Math.ceil(def.xp / 2)));
      fx('break', tn.x + 0.5, tn.y + 0.5, { tint: def.tint });
      e.ai.tn = null; tg.taskT = 0.3;
    }
    return;
  }
  if (ord === 'manure') {
    if (tg.taskT <= 0) {
      const rg = rngAI();
      tg.taskT = (tg.baby ? 110 : 70) + rg.next() * 30;
      E.dropLoot(e.t.x, e.t.y, [{ id: 'manure', n: 1 + (rg.chance(0.25) ? 1 : 0), q: 0 }], { delay: 0.4, life: 420 });
      e.an.bob = 0.5; fx('dust', e.t.x, e.t.y);
      floater(e.t.x, e.t.y - 0.7, 'Estiércol', '#c8a878');
    }
    if (U.dist2(e.t.x, e.t.y, an.x, an.y) > 36) { petGo(e, an.x, an.y, speed, dt); return; }
    e.ai.wanderT -= dt;
    if (e.ai.wanderT <= 0) {
      const rg2 = rngAI();
      e.ai.wanderT = 2 + rg2.next() * 3;
      const a = rg2.next() * U.TAU, d = 1 + rg2.next() * 3;
      const wx = an.x + cos(a) * d, wy = an.y + sin(a) * d;
      if (W.walkable(Math.floor(wx), Math.floor(wy), e.tg.flying)) { e.ai.wx = wx; e.ai.wy = wy; e.ai.hasW = true; }
    }
    if (e.ai.hasW) stepToward(e, e.ai.wx, e.ai.wy, speed * 0.4, dt, e.tg.flying);
    return;
  }
  if (ord === 'watch') {
    if (U.dist2(e.t.x, e.t.y, an.x, an.y) > 1.6) petGo(e, an.x, an.y, speed, dt);
    else e.an.walk += dt * 0.2;
    tg.alertT = Math.max(0, (tg.alertT || 0) - dt);
    if (tg.taskT > 0) return;
    tg.taskT = 1;
    W.Hash.query(e.t.x, e.t.y, 26, E._q2);
    let foe = null, bd = 26 * 26;
    for (let i = 0; i < E._q2.length; i++) {
      const t = E._q2[i];
      if (t.tg.dead || t.type !== 'creature' || t.tg.tamed || t.tg.baby || t.tg.livestock) continue;
      if (!(t.tg.hostile || t.tg.faction === 'predator' || t.tg.faction === 'undead' ||
        t.tg.faction === 'bandit' || t.tg.faction === 'mythic' || t.species === 'bandit')) continue;
      const d = U.dist2(e.t.x, e.t.y, t.t.x, t.t.y);
      if (d < bd) { bd = d; foe = t; }
    }
    if (foe && tg.alertT <= 0) {
      tg.alertT = 9;
      const ang = Math.atan2(foe.t.y - e.t.y, foe.t.x - e.t.x);
      const dir = COMPASS[((Math.round(ang / (PI / 4)) % 8) + 8) % 8];
      toast('¡Alerta! ' + e.name + ' ve ' + foe.name + ' al ' + dir + ' (' + Math.round(Math.sqrt(bd)) + ' m).', 'bad');
      A.play('error'); e.an.bob = 0.6;
    }
    return;
  }
  petIdle(e, an, speed, dt);
}
function petCommand(e, sd, p) {
  const tg = e.tg, ord = tg.order || 'follow';
  if (ord === 'follow' || !p) return false;
  const canFight = !!sd && sd.dmg > 0;
  if (!canFight) {
    const th = findThreat(e, B.AI_FLEE_RADIUS);
    if (th) { e.ai.state = 'flee'; e.ai.threat = th; e.ai.target = null; return true; }
  }
  if (ord === 'stay') {
    e.ai.home.x = tg.ox; e.ai.home.y = tg.oy; e.ai.leash = 7;
    const foe = canFight ? findEnemy(e, 5) : null;
    if (foe) { e.ai.state = 'chase'; e.ai.target = foe; return true; }
    if (e.ai.state === 'chase') dropCombat(e);
    e.ai.state = 'hold'; e.ai.target = null;
    return true;
  }
  if (ord === 'goto') {
    if (U.dist2(e.t.x, e.t.y, tg.ox, tg.oy) < 1.7) {
      tg.order = 'stay'; e.ai.home.x = tg.ox; e.ai.home.y = tg.oy; e.ai.leash = 7;
      e.ai.state = 'hold'; e.ai.path = null;
      floater(e.t.x, e.t.y - 0.7, 'Aquí', '#efe3c8');
      return true;
    }
    if (U.dist2(p.t.x, p.t.y, tg.ox, tg.oy) > 6400) { E.setOrder(e, 'follow', null); return false; }
    e.ai.state = 'petgo';
    return true;
  }
  if (ord === 'attack') {
    const t = E.byId.get(tg.otid);
    if (!t || t.tg.dead || t.tg.tamed || !canFight || U.dist2(p.t.x, p.t.y, e.t.x, e.t.y) > 3600) {
      if (t && t.tg.dead) toast(e.name + ' terminó su objetivo.', 'good');
      tg.order = 'follow'; tg.otid = 0; e.ai.leash = leashOf(sd); e.ai.prey = null;
      return false;
    }
    e.ai.home.x = p.t.x; e.ai.home.y = p.t.y; e.ai.leash = 40;
    e.ai.state = 'chase'; e.ai.target = t; e.ai.prey = t;
    return true;
  }
  if (PET_TASKS.indexOf(ord) >= 0) {
    if (tg.otk === 'point' && ord !== 'watch' && U.dist2(p.t.x, p.t.y, tg.ox, tg.oy) > 6400) {
      E.setOrder(e, 'follow', null);
      toast(e.name + ' te alcanza: estabas muy lejos.', '');
      return false;
    }
    if (e.ai.mv) dropCombat(e);
    e.ai.state = 'petwork'; e.ai.target = null;
    return true;
  }
  tg.order = 'follow';
  return false;
}
function think(e) {
  const p = E.player;
  const sd = e.species ? D.SPECIES[e.species] : null;
  if (e.type === 'worker') { thinkWorker(e); return; }
  if (e.type === 'npc') { thinkNpc(e); return; }
  if (e.type === 'guard') {
    const foe = findEnemy(e, 11);
    if (!foe) dropCombat(e);
    e.ai.state = foe ? 'chase' : 'guard';
    e.ai.target = foe;
    return;
  }
  if (e.tg.mounted) { e.ai.state = 'ridden'; dropCombat(e); return; }
  if (e.tg.guardian === 'player' || e.tg.guardian === 'city') {
    if (sd && sd.nocturnal && CR.Time && CR.Time.night < 0.4) {
      e.ai.state = 'perch'; e.ai.perch = true; e.ai.target = null; dropCombat(e); return;
    }
    e.ai.perch = false;
    const foe = findEnemy(e, e.ai.leash);
    if (!foe) dropCombat(e);
    e.ai.state = foe ? 'chase' : 'guard';
    e.ai.target = foe;
    return;
  }
  if (e.tg.tamed) {
    if (e.tg.livestock) {
      const th = findThreat(e, B.AI_FLEE_RADIUS);
      e.ai.state = th ? 'flee' : 'wander';
      e.ai.threat = th;
      return;
    }
    if (petCommand(e, sd, p)) return;
    const foe = (sd && sd.dmg > 0) ? findEnemy(e, 9) : null;
    if (foe) { e.ai.state = 'chase'; e.ai.target = foe; }
    else {
      e.ai.state = 'follow'; e.ai.target = null; dropCombat(e);
      if (p) { e.ai.home.x = p.t.x; e.ai.home.y = p.t.y; }
    }
    return;
  }
  if (e.tg.livestock) {
    const th = findThreat(e, B.AI_FLEE_RADIUS);
    e.ai.state = th ? 'flee' : 'wander';
    e.ai.threat = th;
    return;
  }
  if (e.tg.baby) {
    const th = findThreat(e, B.AI_FLEE_RADIUS);
    const dp = p ? U.dist2(e.t.x, e.t.y, p.t.x, p.t.y) : 1e9;
    e.ai.threat = th || (playerSpooks(e, sd, p, dp, 4) ? p : null);
    if (e.ai.threat) e.ai.state = 'flee';
    else if (!calmHold(e, sd, p, dp)) e.ai.state = 'wander';
    return;
  }
  if (e.tg.guardian === 'zone') {
    const foe = findEnemy(e, e.ai.leash);
    if (!foe) dropCombat(e);
    e.ai.state = foe ? 'chase' : 'guard';
    e.ai.target = foe;
    return;
  }
  const beh = sd ? sd.behavior : 'passive';
  /* 1 · Huir de depredadores */
  if (sd && (sd.diet === 'herbivore' || sd.diet === 'insectivore' || sd.faction === 'prey')) {
    const th = findThreat(e, B.AI_FLEE_RADIUS);
    if (th) { e.ai.state = 'flee'; e.ai.threat = th; e.ai.target = null; dropCombat(e); return; }
  }
  /* 2 · Detectar al jugador (sigilo y noche modifican el alcance) */
  const stealth = p ? (p.stealth || 0) : 0;
  let aggro = (sd ? sd.aggro : 4) * (1 - stealth);
  if (sd && sd.nocturnal && CR.Time && CR.Time.night > 0.5) aggro *= 1.25;
  const distP = p && !p.ko ? U.dist2(e.t.x, e.t.y, p.t.x, p.t.y) : 1e9;
  const wasChasing = e.ai.state === 'chase' && e.ai.target === p;
  const seeR = wasChasing ? aggro * 1.6 : aggro;
  const aggressive = (beh === 'hostile' || beh === 'ambush' || beh === 'territorial' || e.tg.hostile);
  const awake = !sd || !sd.nocturnal || (CR.Time && CR.Time.night > 0.35) || e.tg.hostile;
  if (aggressive && awake && distP < seeR * seeR) {
    if (W.lineOfSight(e.t.x, e.t.y, p.t.x, p.t.y)) {
      e.ai.state = 'chase'; e.ai.target = p; e.ai.prey = null;
      e.ai.giveup = B.AI_CHASE_GIVEUP;
      return;
    }
  }
  /* 3 · Cazar presas */
  if (sd && (sd.diet === 'carnivore' || sd.diet === 'omnivore')) {
    if (!e.ai.prey || e.ai.prey.tg.dead || e.ai.prey.tg.tamed) e.ai.prey = null;
    if (!e.ai.prey && e.ai.rest <= 0.4) e.ai.prey = findPrey(e, B.AI_HUNT_RADIUS);
    if (e.ai.prey) { e.ai.state = 'hunt'; e.ai.target = e.ai.prey; return; }
  }
  if (beh === 'skittish' && playerSpooks(e, sd, p, distP, aggro)) {
    e.ai.state = 'flee'; e.ai.threat = p; e.ai.target = null; dropCombat(e); return;
  }
  if (beh === 'skittish' && calmHold(e, sd, p, distP)) return;
  /* 4 · Territorio */
  const homeD2 = U.dist2(e.t.x, e.t.y, e.ai.home.x, e.ai.home.y);
  if (homeD2 > e.ai.leash * e.ai.leash) {
    e.ai.state = 'return'; e.ai.target = null; e.ai.prey = null; dropCombat(e); return;
  }
  if (e.ai.state !== 'wander') dropCombat(e);
  e.ai.state = 'wander'; e.ai.target = null;
}
function thinkNpc(e) {
  const nd = D.NPCS[e.npcId];
  if (e.tg.angry) { e.ai.state = 'flee'; e.ai.threat = E.player; dropCombat(e); return; }
  if (e.tg.hunter) {
    if (!e.ai.prey || e.ai.prey.tg.dead) e.ai.prey = findPrey(e, 16);
    if (e.ai.prey) { e.ai.state = 'hunt'; e.ai.target = e.ai.prey; return; }
  }
  if (e.tg.wanderer && e.ai.route && e.ai.route.length) { e.ai.state = 'route'; return; }
  if (nd && nd.post) { e.ai.state = 'wander'; e.ai.leash = 1.2; return; }
  e.ai.state = 'wander';
}
function thinkWorker(e) {
  const role = e.tg.role;
  if (e.tg.child && (e.tg.stage === 'baby' || e.tg.stage === 'child')) { e.ai.state = 'wander'; e.ai.leash = 7; return; }
  if (role === 'follow') {
    const foe = findEnemy(e, 10);
    if (!foe) dropCombat(e);
    e.ai.state = foe ? 'chase' : 'follow'; e.ai.target = foe; return;
  }
  if (role === 'guard') {
    const foe = findEnemy(e, 10);
    if (!foe) dropCombat(e);
    e.ai.state = foe ? 'chase' : 'guard'; e.ai.target = foe; return;
  }
  if (role === 'farm' || role === 'water' || role === 'tend' || role === 'haul') { e.ai.state = 'work'; return; }
  e.ai.state = 'wander';
}
/* ---------- Golpes: telegrafía → activo → recuperación → descanso ---------- */
function startMove(e, mv, target) {
  e.ai.mv = mv; e.ai.mvT = 0; e.ai.mvPhase = 'wind';
  e.an.tele = mv.wind;
  if (target) e.t.ang = Math.atan2(target.t.y - e.t.y, target.t.x - e.t.x);
  if (mv.wind >= 0.3) {
    const r = (mv.kind === 'aoe' || mv.kind === 'pool' || mv.kind === 'gaze') ? (mv.range || 3) : 1.1;
    fx('telegraph', e.t.x, e.t.y, { r: r, t: mv.wind });
    if (e.tg.boss) sfxAt('roar', e.t.x, e.t.y);
  }
}
function execMove(e, mv, target) {
  const dmg = e.cb.dmg * (mv.mul || 1);
  const kind = mv.kind;
  e.an.atk = 0.26;
  e.an.tele = 0;
  if (kind === 'melee' || kind === 'dash' || kind === 'fly_dive') {
    if (kind !== 'melee' && target) {
      const dx = target.t.x - e.t.x, dy = target.t.y - e.t.y, d = U.len(dx, dy) || 1;
      const push = mv.dash || 8;
      e.v.x += (dx / d) * push; e.v.y += (dy / d) * push;
      if (kind === 'fly_dive') {
        e.tg.flying = true;
        setTimeoutSafe(e, 0.6, function () { if (!e.tg.dead && !e.tg.mounted) e.tg.flying = false; });
      }
      fx('dust', e.t.x, e.t.y);
    }
    const reach = (mv.range || e.cb.reach) + 0.45;
    const hits = mv.hits || 1;
    W.Hash.query(e.t.x, e.t.y, reach + 1.0, E._q1);
    let n = 0;
    for (let i = 0; i < E._q1.length && n < hits; i++) {
      const t = E._q1[i];
      if (!hostileTo(e, t) && e.ai.prey !== t) continue;
      const rr = reach + (t.tg.scale || 1) * 0.3;
      if (U.dist2(e.t.x, e.t.y, t.t.x, t.t.y) > rr * rr) continue;
      E.damage(t, dmg, e, mv);
      n++;
    }
    sfxAt(n ? (e.tg.boss ? 'hit' : 'swing') : 'swing', e.t.x, e.t.y);
    if (n && mv.knock) shake(e.tg.boss ? 6 : 3);
  } else if (kind === 'aoe') {
    const r = mv.range || 3;
    shake(e.tg.boss ? 8 : 4);
    fx('shock', e.t.x, e.t.y, { r: r, fire: !!mv.burn });
    sfxAt(mv.burn ? 'fire' : 'hit', e.t.x, e.t.y);
    W.Hash.query(e.t.x, e.t.y, r, E._q1);
    for (let i = 0; i < E._q1.length; i++) {
      const t = E._q1[i];
      if (!hostileTo(e, t)) continue;
      if (U.dist2(e.t.x, e.t.y, t.t.x, t.t.y) > r * r) continue;
      E.damage(t, dmg, e, mv);
    }
    if (mv.healAlly) {
      W.Hash.query(e.t.x, e.t.y, r, E._q2);
      for (let i = 0; i < E._q2.length; i++) {
        const t = E._q2[i];
        if (t === e || t.tg.dead || t.species !== e.species) continue;
        t.st.hp = Math.min(t.st.maxHp, t.st.hp + mv.healAlly);
        if (mv.cleanse) { t.cb.poison = 0; t.cb.poisonT = 0; t.cb.bleed = 0; t.cb.bleedT = 0; }
        fx('heal', t.t.x, t.t.y);
      }
    }
    if (mv.ring) {
      for (let i = 0; i < mv.ring; i++) {
        const a = (i / mv.ring) * U.TAU;
        spawnProjectile(e, e.t.x + cos(a) * 9, e.t.y + sin(a) * 9, 6, dmg * 0.55,
          mv.burn ? 'fire' : 'rock', { hostile: true, effect: mv.burn ? 'burn' : null, ang: a, r: 0.36, life: 2 });
      }
    }
  } else if (kind === 'spit') {
    if (!target) return;
    const cnt = mv.count || 1, spread = mv.spread || 0;
    const base = Math.atan2(target.t.y - e.t.y, target.t.x - e.t.x);
    const eff = mv.poison ? 'poison' : (mv.burn ? 'burn' : (mv.slow ? 'slow' : null));
    for (let i = 0; i < cnt; i++) {
      const a = base + (cnt > 1 ? (i - (cnt - 1) / 2) * spread : 0);
      spawnProjectile(e, e.t.x + cos(a) * 9, e.t.y + sin(a) * 9, 9, dmg, mv.proj || 'rock',
        { hostile: true, effect: eff, ang: a, r: 0.34, life: 2.4 });
    }
    sfxAt('swing', e.t.x, e.t.y);
  } else if (kind === 'pool') {
    if (!target) return;
    const cnt = mv.count || 3, rg = rngAI();
    for (let i = 0; i < cnt; i++) {
      const a = rg.next() * U.TAU, d = rg.range(0.4, mv.range || 3);
      E.hazards.push({
        x: target.t.x + cos(a) * d, y: target.t.y + sin(a) * d, r: mv.r || 1.6,
        type: mv.hazard || 'poison', life: mv.life || 8, dps: Math.max(2, dmg * 0.35),
        t: 0, hostile: true, owner: e
      });
    }
    sfxAt(mv.hazard === 'fire' ? 'fire' : 'poison', e.t.x, e.t.y);
  } else if (kind === 'gaze') {
    if (!target) return;
    const r = mv.range || 5, cone = mv.cone || 0.7;
    const base = Math.atan2(target.t.y - e.t.y, target.t.x - e.t.x);
    fx('shock', e.t.x + cos(base) * 2, e.t.y + sin(base) * 2, { r: r * 0.6, fire: !!mv.burn });
    W.Hash.query(e.t.x, e.t.y, r, E._q1);
    for (let i = 0; i < E._q1.length; i++) {
      const t = E._q1[i];
      if (!hostileTo(e, t)) continue;
      const dx = t.t.x - e.t.x, dy = t.t.y - e.t.y, d = U.len(dx, dy);
      if (d > r) continue;
      if (Math.abs(U.angDelta(base, Math.atan2(dy, dx))) > cone) continue;
      E.damage(t, dmg, e, mv);
    }
    sfxAt(mv.burn ? 'fire' : 'poison', e.t.x, e.t.y);
  } else if (kind === 'summon') {
    if (e.ai.summonCd > 0) return;
    e.ai.summonCd = 12;
    const cnt = mv.count || 1;
    for (let i = 0; i < cnt; i++) {
      if (E.list.length >= E.CAP - 4) break;
      const sp = E.freeSpotNear(e.t.x, e.t.y, 3);
      const m = E.spawnCreature(mv.species, sp.x, sp.y, { persist: false, noBaby: true });
      if (m) {
        m.ai.home.x = e.ai.home.x; m.ai.home.y = e.ai.home.y;
        m.ai.leash = e.ai.leash; m.tg.hostile = true;
        m.tg.zone = e.tg.zone; m.ai.zone = e.ai.zone;
      }
    }
    fx('legend', e.t.x, e.t.y);
    sfxAt('roar', e.t.x, e.t.y);
  } else if (kind === 'heal') {
    if (mv.once && e.ai.healOnce) return;
    if (mv.once) e.ai.healOnce = true;
    e.st.hp = Math.min(e.st.maxHp, e.st.hp + e.st.maxHp * (mv.healPct || 0.05));
    fx('heal', e.t.x, e.t.y); fx('legend', e.t.x, e.t.y);
    floater(e.t.x, e.t.y - 1.2, '¡Renace!', '#ffd76a');
    sfxAt('bell', e.t.x, e.t.y);
  } else if (kind === 'buff') {
    if (mv.selfDef) {
      e.cb.def += mv.selfDef;
      setTimeoutSafe(e, mv.selfT || 6, function () { if (!e.tg.dead) e.cb.def = Math.max(0, e.cb.def - mv.selfDef); });
    }
    if (mv.allyDmg) {
      W.Hash.query(e.t.x, e.t.y, mv.range || 6, E._q2);
      for (let i = 0; i < E._q2.length; i++) {
        const t = E._q2[i];
        if (t.tg.dead || t.species !== e.species) continue;
        const bonus = Math.round(t.cb.dmg * mv.allyDmg);
        if (bonus <= 0) continue;
        t.cb.dmg += bonus;
        setTimeoutSafe(t, mv.allyT || 10, function () { if (!t.tg.dead) t.cb.dmg = Math.max(1, t.cb.dmg - bonus); });
        fx('spark', t.t.x, t.t.y);
      }
    }
    fx('spark', e.t.x, e.t.y);
    sfxAt('roar', e.t.x, e.t.y);
  }
}
function updateCombat(e, dt, target) {
  const pat = activePattern(e);
  if (!pat || !pat.moves || !pat.moves.length) return false;
  if (e.cb.stagger > 0) return true;
  if (e.ai.mv) {
    const mv = e.ai.mv;
    e.ai.mvT += dt;
    e.an.tele = Math.max(0, e.an.tele - dt);
    if (e.ai.mvPhase === 'wind') {
      if (target) e.t.ang = U.angDamp(e.t.ang, Math.atan2(target.t.y - e.t.y, target.t.x - e.t.x), 8, dt);
      if (e.ai.mvT >= mv.wind) { e.ai.mvPhase = 'active'; e.ai.mvT = 0; execMove(e, mv, target); }
      return true;
    }
    if (e.ai.mvPhase === 'active') {
      if (e.ai.mvT >= mv.active) { e.ai.mvPhase = 'recover'; e.ai.mvT = 0; }
      return true;
    }
    if (e.ai.mvT >= mv.recover) {
      e.ai.mv = null; e.ai.mvPhase = '';
      e.ai.burst++;
      const rg = rngAI();
      const bmax = pat.burst ? rg.int(pat.burst[0], pat.burst[1]) : 1;
      if (pat.relentless) e.ai.rest = 0.12;
      else if (e.ai.burst >= bmax) {
        e.ai.burst = 0;
        e.ai.rest = pat.rest ? rg.range(pat.rest[0], pat.rest[1]) : rg.range(B.AI_REST_MIN, B.AI_REST_MAX);
      } else e.ai.rest = 0.08;
    }
    return true;
  }
  if (e.ai.rest > 0) { e.ai.rest -= dt; return true; }
  if (!target) return false;
  const d2 = U.dist2(e.t.x, e.t.y, target.t.x, target.t.y);
  let pick = null;
  for (let i = 0; i < pat.moves.length; i++) {
    const mv = pat.moves[i];
    if (mv.kind === 'summon' || mv.kind === 'heal' || mv.kind === 'buff') continue;
    const r = (mv.range || e.cb.reach) + 0.5;
    if (d2 <= r * r) { pick = mv; break; }
  }
  if (!pick) {
    for (let i = 0; i < pat.moves.length; i++) {
      const mv = pat.moves[i];
      if (mv.kind !== 'spit' && mv.kind !== 'gaze' && mv.kind !== 'pool' &&
        mv.kind !== 'dash' && mv.kind !== 'fly_dive') continue;
      const r = mv.range || 4;
      if (d2 <= r * r) { pick = mv; break; }
    }
  }
  if (!pick) {
    for (let i = 0; i < pat.moves.length; i++) {
      const mv = pat.moves[i];
      if (mv.kind === 'summon' && e.ai.summonCd <= 0 && d2 < 144) { pick = mv; break; }
      if (mv.kind === 'heal' && !(mv.once && e.ai.healOnce) && e.st.hp < e.st.maxHp * 0.5) { pick = mv; break; }
      if (mv.kind === 'buff' && d2 < 100 && rngAI().chance(0.25)) { pick = mv; break; }
    }
  }
  if (!pick) return false;
  startMove(e, pick, target);
  return true;
}
const _timers = [];
function setTimeoutSafe(e, delay, fn) { _timers.push({ t: delay, fn: fn, e: e }); }
function tickTimers(dt) {
  for (let i = _timers.length - 1; i >= 0; i--) {
    const t = _timers[i];
    t.t -= dt;
    if (t.t > 0) continue;
    _timers.splice(i, 1);
    if (!t.e || !t.e.tg.dead) {
      try { t.fn(); } catch (err) { CR.reportError(err, 'entity.timer'); }
    }
  }
}
function updateCreature(e, dt) {
  const sd = e.species ? D.SPECIES[e.species] : null;
  const p = E.player;
  e.cb.cd = Math.max(0, e.cb.cd - dt);
  e.cb.iframe = Math.max(0, e.cb.iframe - dt);
  e.an.atk = Math.max(0, e.an.atk - dt);
  e.an.hurt = Math.max(0, e.an.hurt - dt);
  e.an.bob = Math.max(0, e.an.bob - dt);
  e.an.tele = Math.max(0, e.an.tele - dt);
  e.ai.summonCd = Math.max(0, e.ai.summonCd - dt);
  tickDots(e, dt);
  if (e.tg.dead) return;
  let speed = (sd ? sd.speed : 3) * (e.tg.baby ? 0.85 : 1) * (e.tg.tamed ? 1.08 : 1);
  if (e.cb.slow > 0) speed *= (1 - e.cb.slow);
  if (e.cb.stagger > 0) speed *= 0.2;
  /* Sedado: inmóvil e inofensivo */
  if (e.tg.sedated > 0) {
    e.tg.sedated -= dt;
    e.ai.state = 'idle'; e.ai.target = null; dropCombat(e);
    if (e.tg.sedated <= 0 && !e.tg.tamed) {
      e.tg.tameProgress = 0;
      if (sd) e.tg.hostile = (sd.behavior === 'hostile' || sd.behavior === 'ambush');
      toast(e.name + ' despierta… y no está contento.', 'bad');
    }
    return;
  }
  /* Confianza de presas domables por comida */
  if (feedTameable(sd, e) && p && (sd.behavior === 'skittish' || e.tg.baby)) updateEase(e, sd, p, dt);
  /* Vínculo: se gana quieto y cerca */
  if (sd && sd.tame && sd.tame.method === 'bond' && !e.tg.tamed && p) {
    const d2 = U.dist2(e.t.x, e.t.y, p.t.x, p.t.y);
    const still = U.len(p.vx || 0, p.vy || 0) < 1.2;
    if (d2 < 9 && still && !p.act) e.ai.calm = Math.min(6, (e.ai.calm || 0) + dt);
    else e.ai.calm = Math.max(0, (e.ai.calm || 0) - dt * 1.5);
  }
  if (Math.abs(e.v.x) > 0.02 || Math.abs(e.v.y) > 0.02) {
    move(e, e.v.x * dt, e.v.y * dt, e.tg.flying);
    const decay = Math.pow(0.0006, dt);
    e.v.x *= decay; e.v.y *= decay;
  }
  e.ai.t += dt;
  const thinkEvery = B.AI_THINK + (e.ai.phase % 6) * 0.012;
  if (e.ai.t >= thinkEvery) { e.ai.t = 0; think(e); }
  const st = e.ai.state;
  if (st === 'ridden') return;
  if (st === 'perch') {
    if (U.dist2(e.t.x, e.t.y, e.ai.home.x, e.ai.home.y) > 1.5)
      stepToward(e, e.ai.home.x, e.ai.home.y, speed * 0.5, dt, false);
    return;
  }
  if (st === 'route') {
    const route = e.ai.route;
    if (!route || !route.length) { e.ai.state = 'wander'; return; }
    const wp = route[e.ai.routeI % route.length];
    if (stepToward(e, wp.x + 0.5, wp.y + 0.5, speed * 0.62, dt, false))
      e.ai.routeI = (e.ai.routeI + 1) % route.length;
    return;
  }
  if ((st === 'chase' || st === 'hunt') && e.ai.target && !e.ai.target.tg.dead && !e.ai.target.ko) {
    const t = e.ai.target;
    const busy = updateCombat(e, dt, t);
    const d2 = U.dist2(e.t.x, e.t.y, t.t.x, t.t.y);
    const reach = (sd ? sd.reach : 1) + 0.4;
    if (e.ai.mv && e.ai.mvPhase === 'wind') { e.an.walk += dt; return; }
    if (d2 > reach * reach || !busy) {
      const d = Math.sqrt(d2);
      if (d > 5.5 && !e.ai.path && rngAI().chance(0.03)) requestPath(e, t.t.x, t.t.y, e.tg.flying);
      if (e.ai.path) followPath(e, speed, dt, e.tg.flying);
      else stepToward(e, t.t.x, t.t.y, speed, dt, e.tg.flying);
    } else e.an.walk += dt * 1.5;
    const homeD2 = U.dist2(e.t.x, e.t.y, e.ai.home.x, e.ai.home.y);
    if (homeD2 > e.ai.leash * e.ai.leash * 1.3) {
      e.ai.state = 'return'; e.ai.target = null; e.ai.prey = null; dropCombat(e);
    } else if (t === p) {
      const ag = (sd ? sd.aggro : 5);
      if (d2 > ag * ag * 4) {
        e.ai.giveup -= dt;
        if (e.ai.giveup <= 0) { e.ai.state = 'return'; e.ai.target = null; dropCombat(e); }
      } else e.ai.giveup = B.AI_CHASE_GIVEUP;
    } else if (d2 > B.AI_HUNT_RADIUS * B.AI_HUNT_RADIUS * 1.6) {
      e.ai.prey = null; e.ai.target = null; e.ai.state = 'return'; dropCombat(e);
    }
    return;
  }
  if (st === 'hold') {
    if (U.dist2(e.t.x, e.t.y, e.tg.ox, e.tg.oy) > 1.4) petGo(e, e.tg.ox, e.tg.oy, speed, dt);
    else if (p) { e.t.ang = U.angDamp(e.t.ang, Math.atan2(p.t.y - e.t.y, p.t.x - e.t.x), 4, dt); e.an.walk += dt * 0.2; }
    return;
  }
  if (st === 'petgo') { petGo(e, e.tg.ox, e.tg.oy, speed * 1.2, dt); return; }
  if (st === 'petwork') { updatePetWork(e, dt, speed, p); return; }
  if (st === 'follow') {
    const tx = p ? p.t.x : e.ai.home.x, ty = p ? p.t.y : e.ai.home.y;
    const d2 = U.dist2(e.t.x, e.t.y, tx, ty);
    if (d2 > 5) {
      if (d2 > 80 && !e.ai.path) requestPath(e, tx, ty, e.tg.flying);
      if (e.ai.path) followPath(e, speed * 1.2, dt, e.tg.flying);
      else stepToward(e, tx, ty, speed * 1.2, dt, e.tg.flying);
    } else if (d2 < 1.6) e.an.walk += dt * 0.5;
    return;
  }
  if (st === 'flee') {
    const src = e.ai.threat || p || e;
    const dx = e.t.x - src.t.x, dy = e.t.y - src.t.y, d = U.len(dx, dy) || 1;
    const calmFlee = src === p && feedTameable(sd, e);
    stepToward(e, e.t.x + (dx / d) * 5, e.t.y + (dy / d) * 5, speed * (calmFlee ? 1.1 : 1.3), dt, e.tg.flying);
    return;
  }
  if (st === 'return') {
    if (stepToward(e, e.ai.home.x, e.ai.home.y, speed, dt, e.tg.flying)) e.ai.state = 'wander';
    return;
  }
  if (st === 'guard') {
    if (U.dist2(e.t.x, e.t.y, e.ai.home.x, e.ai.home.y) > 2)
      stepToward(e, e.ai.home.x, e.ai.home.y, speed * 0.75, dt, false);
    return;
  }
  if (st === 'work') { updateWork(e, dt, speed); return; }
  if (st === 'idle') {
    if (e.ai.curious && p && !p.ko) {
      const ddx = p.t.x - e.t.x, ddy = p.t.y - e.t.y, dd2 = ddx * ddx + ddy * ddy;
      if (dd2 > 2.2 * 2.2) stepToward(e, p.t.x, p.t.y, speed * 0.4, dt, false);
      else e.t.ang = U.angDamp(e.t.ang, Math.atan2(ddy, ddx), 6, dt);
    } else e.an.walk += dt * 0.3;
    return;
  }
  /* Deambular con rutinas de NPC */
  e.ai.wanderT -= dt;
  if (e.ai.wanderT <= 0) {
    const rg = rngAI();
    e.ai.wanderT = 1.6 + rg.next() * 3.2;
    if (e.type === 'npc') {
      const nd = D.NPCS[e.npcId];
      const hr = CR.Time ? CR.Time.hour : 12;
      if (nd && nd.post) {
        e.ai.atPost = true;
        const a0 = rg.next() * U.TAU, d0 = rg.next() * 0.6;
        e.ai.wx = e.ai.home.x + cos(a0) * d0; e.ai.wy = e.ai.home.y + sin(a0) * d0;
        e.ai.wanderT = 1.2 + rg.next() * 2;
      } else {
        const shopHours = hr >= 7 && hr < 19, rest = hr >= 22 || hr < 6;
        e.ai.atPost = shopHours || rest;
        let ok = false;
        for (let tries = 0; tries < 8 && !ok; tries++) {
          const r = (nd && nd.farmer) ? 9 : 12;
          const a1 = rg.next() * U.TAU, d1 = rg.next() * r;
          const tx = e.ai.home.x + cos(a1) * d1, ty = e.ai.home.y + sin(a1) * d1;
          if (W.walkable(Math.floor(tx), Math.floor(ty), false)) { e.ai.wx = tx; e.ai.wy = ty; ok = true; }
        }
        if (!ok) { e.ai.wx = e.ai.home.x; e.ai.wy = e.ai.home.y; }
        e.ai.wanderT += 2 + rg.next() * 4;
      }
    } else {
      const r = e.tg.livestock ? 2.2 : Math.min(6, e.ai.leash * 0.5);
      const a = rg.next() * U.TAU, d = rg.next() * r;
      const tx = e.ai.home.x + cos(a) * d, ty = e.ai.home.y + sin(a) * d;
      if (W.walkable(Math.floor(tx), Math.floor(ty), e.tg.flying)) { e.ai.wx = tx; e.ai.wy = ty; }
      else { e.ai.wx = e.ai.home.x; e.ai.wy = e.ai.home.y; }
    }
    e.ai.hasW = true;
  }
  if (e.ai.hasW) stepToward(e, e.ai.wx, e.ai.wy, speed * (e.type === 'npc' ? 0.5 : 0.42), dt, e.tg.flying);
}
function updateWork(e, dt, speed) {
  e.tg.workT -= dt;
  if (e.ai.path) { followPath(e, speed, dt, false); return; }
  if (e.tg.workT > 0) { e.an.walk += dt * 0.5; return; }
  e.tg.workT = 1.2;
  const role = e.tg.role;
  if (role === 'farm' || role === 'water') {
    let target = null, bd = 1e9;
    W.soil.forEach(function (s, idx) {
      if (s.owner && s.owner !== 'player') return;
      const x = idx % C.WORLD, y = (idx / C.WORLD) | 0;
      let want;
      if (role === 'water') want = !!s.crop && s.growth < 1 && !s.watered;
      else want = (s.crop && s.growth >= 1) || !s.crop;
      if (!want) return;
      const d = U.dist2(e.t.x, e.t.y, x + 0.5, y + 0.5);
      if (d < bd && d < 1200) { bd = d; target = { x: x, y: y, water: role === 'water', ready: !!(s.crop && s.growth >= 1) }; }
    });
    if (target) {
      if (bd < 1.8) {
        Bus.emit('work', { action: target.water ? 'water' : (target.ready ? 'harvest' : 'plant'), worker: e, x: target.x, y: target.y });
        e.an.atk = 0.3; e.tg.workT = 1.5;
      } else if (!e.ai.path) requestPath(e, target.x, target.y, false);
    } else {
      const home = W.bestHouse();
      if (home) stepToward(e, home.x + home.w / 2, home.y + home.h + 0.6, speed * 0.6, dt, false);
    }
    return;
  }
  if (role === 'tend') {
    let target = null, bd = 1e9;
    for (let i = 0; i < E.list.length; i++) {
      const a = E.list[i];
      if (a.tg.dead || !a.tg.livestock || a.tg.owner !== 'player') continue;
      const d = U.dist2(e.t.x, e.t.y, a.t.x, a.t.y);
      if (d < bd) { bd = d; target = a; }
    }
    if (target) {
      if (bd < 2.4) {
        Bus.emit('work', { action: target.tg.ready ? 'collect' : 'feed', worker: e, animal: target });
        e.an.atk = 0.3; e.tg.workT = 2;
      } else if (!e.ai.path) requestPath(e, target.t.x, target.t.y, false);
    }
    return;
  }
  if (role === 'haul') {
    let target = null, bd = 1e9;
    for (let i = 0; i < E.loot.length; i++) {
      const l = E.loot[i];
      const d = U.dist2(e.t.x, e.t.y, l.x, l.y);
      if (d < bd && d < 900) { bd = d; target = l; }
    }
    if (target) {
      if (bd < 1.4) { E.pickupLoot(target, false); e.tg.workT = 1; }
      else if (!e.ai.path) requestPath(e, target.x, target.y, false);
    }
    return;
  }
  e.ai.state = 'wander';
}

/* ==========================================================
21 · DIRECTOR DE SPAWN (ecología separada y territorial)
========================================================== */
function packSize(sd) {
  if (sd.kind === 'boss' || sd.kind === 'mythic' || sd.elite) return 1;
  const rg = rngAI();
  if (sd.diet === 'carnivore' || sd.diet === 'omnivore')
    return rg.int(B.SPAWN_PACK_PRED[0], B.SPAWN_PACK_PRED[1]);
  if (sd.pack) {
    const lo = Math.min(sd.pack[0], B.SPAWN_PACK_HERB[0]);
    const hi = Math.max(lo, Math.min(sd.pack[1], B.SPAWN_PACK_HERB[1]));
    return rg.int(lo, hi);
  }
  return 1;
}
function director(dt) {
  const p = E.player;
  if (!p) return;
  E._spawnT -= dt;
  if (E._spawnT > 0) return;
  E._spawnT = B.SPAWN_TICK;
  let wild = 0, herb = 0;
  const perSp = Object.create(null);
  for (let i = 0; i < E.list.length; i++) {
    const e = E.list[i];
    if (e.tg.dead || e.tg.persist || e.type === 'npc' || e.type === 'guard') continue;
    const d2 = U.dist2(p.t.x, p.t.y, e.t.x, e.t.y);
    if (d2 > B.SPAWN_DESPAWN * B.SPAWN_DESPAWN) { e.tg.dead = true; continue; }
    if (d2 < B.SPAWN_ACTIVE * B.SPAWN_ACTIVE) {
      wild++;
      perSp[e.species] = (perSp[e.species] || 0) + 1;
      if (e.tg.diet === 'herbivore' || e.tg.diet === 'insectivore' || e.tg.faction === 'prey') herb++;
    }
  }
  const rng = CR.streams ? CR.streams.spawn : rngAI();
  const night = CR.Time ? CR.Time.night > 0.5 : false;
  if (wild < E.WILD_CAP && E.list.length < E.CAP - 12) {
    for (let k = 0; k < B.SPAWN_TRIES; k++) {
      const t = W.randomTileNear(p.t.x, p.t.y, B.SPAWN_RING[0], B.SPAWN_RING[1], rng);
      if (!t) continue;
      if (t.zone) continue;
      if (W.cityDist(t.x, t.y) < B.SPAWN_CITY_BUFFER) continue;
      const bd = D.BIOMES[t.biome];
      if (!bd || !bd.spawns.length) continue;
      let total = 0;
      const pool = [];
      for (let i = 0; i < bd.spawns.length; i++) {
        const id = bd.spawns[i][0], sd = D.SPECIES[id];
        if (!sd || sd.zone || sd.guard) continue;
        if (sd.kind === 'boss' || sd.kind === 'livestock') continue;
        if (sd.biomes && sd.biomes.length && sd.biomes.indexOf(t.biome) < 0) continue;
        if (sd.nocturnal && !night && rng.chance(0.8)) continue;
        if ((perSp[id] || 0) >= B.SPECIES_CAP) continue;
        if (herb >= B.HERB_CAP && (sd.diet === 'herbivore' || sd.diet === 'insectivore' || sd.faction === 'prey')) continue;
        pool.push([id, bd.spawns[i][1]]);
        total += bd.spawns[i][1];
      }
      if (!pool.length) continue;
      let roll = rng.next() * total, pick = pool[0][0];
      for (let i = 0; i < pool.length; i++) { roll -= pool[i][1]; if (roll <= 0) { pick = pool[i][0]; break; } }
      const sd2 = D.SPECIES[pick];
      const tile = W.speciesSpawnTile(pick, p.t.x, p.t.y, rng, E.list);
      if (!tile) continue;
      const n = packSize(sd2);
      let made = 0;
      for (let i = 0; i < n; i++) {
        if (E.list.length >= E.CAP - 8) break;
        let sx = tile.x + 0.5, sy = tile.y + 0.5;
        if (i > 0) {
          const a = rng.next() * U.TAU, d = 2.4 + rng.next() * 4.5;
          const nx = sx + cos(a) * d, ny = sy + sin(a) * d;
          if (W.walkable(Math.floor(nx), Math.floor(ny), false)) { sx = nx; sy = ny; }
        }
        const e = E.spawnCreature(pick, sx, sy, {});
        if (e) { made++; e.ai.home.x = tile.x + 0.5; e.ai.home.y = tile.y + 0.5; }
      }
      if (made) break;
    }
  }
  /* Santuarios cercanos: solo su fauna exclusiva */
  for (let i = 0; i < W.zones.length; i++) {
    const z = W.zones[i];
    if (U.dist2(p.t.x, p.t.y, z.x, z.y) > 70 * 70) continue;
    const zd = D.ZONE_BY_ID[z.id];
    if (!zd) continue;
    const list = (zd.species || []).concat(zd.guard || []);
    for (let k = 0; k < list.length; k++) {
      const id = list[k], sd = D.SPECIES[id];
      if (!sd) continue;
      let count = 0;
      for (let q = 0; q < E.list.length; q++)
        if (E.list[q].species === id && !E.list[q].tg.dead && E.list[q].tg.zone === z.id) count++;
      const want = sd.guard ? 2 : (sd.pack ? sd.pack[1] : 1);
      if (count >= want) continue;
      if (E.list.length >= E.CAP - 6) break;
      const tile = W.speciesSpawnTile(id, p.t.x, p.t.y, rng, E.list);
      if (tile) E.spawnCreature(id, tile.x + 0.5, tile.y + 0.5, {});
    }
  }
  /* Campamentos de bandidos */
  E._campT -= B.SPAWN_TICK;
  if (E._campT <= 0) {
    E._campT = 6;
    for (let i = 0; i < W.camps.length; i++) {
      const c = W.camps[i];
      const d2 = U.dist2(p.t.x, p.t.y, c.x, c.y);
      if (d2 > 60 * 60 || d2 < 14 * 14) continue;
      let count = 0;
      for (let k = 0; k < E.list.length; k++) {
        const e = E.list[k];
        if (!e.tg.dead && e.species === 'bandit' && U.dist2(e.t.x, e.t.y, c.x, c.y) < 100) count++;
      }
      if (count >= c.count || E.list.length >= E.CAP - 4) continue;
      const sp = E.freeSpotNear(c.x, c.y, c.r * 0.7);
      const b = E.spawnCreature('bandit', sp.x, sp.y, {});
      if (b) { b.ai.home.x = c.x; b.ai.home.y = c.y; b.ai.leash = c.r + 6; }
    }
  }
}

/* ==========================================================
22 · BUCLE PRINCIPAL DE ENTIDADES
========================================================== */
E.update = function (dt) {
  tickTimers(dt);
  if (E.hitstop > 0) { E.hitstop -= dt; return; }
  const p = E.player;
  for (let i = 0; i < E.list.length; i++) {
    const e = E.list[i];
    e.t.px = e.t.x; e.t.py = e.t.y;
    e.an.spawn = Math.max(0, e.an.spawn - dt);
  }
  updatePlayer(dt);
  for (let i = 0; i < E.list.length; i++) {
    const e = E.list[i];
    if (e === p || e.tg.dead) continue;
    const far = p ? U.dist2(p.t.x, p.t.y, e.t.x, e.t.y) : 0;
    if (far > 74 * 74 && !e.tg.boss && !e.tg.persist) {
      if ((e.id & 3) !== (E._frame & 3)) continue;
      updateCreature(e, dt * 4);
    } else if (far > 52 * 52 && !e.tg.boss) {
      if ((e.id & 1) !== (E._frame & 1)) continue;
      updateCreature(e, dt * 2);
    } else updateCreature(e, dt);
  }
  updateProjectiles(dt);
  updateHazards(dt);
  updateLoot(dt);
  W.Hash.rebuild(E.list);
  director(dt);
  E._frame = (E._frame + 1) | 0;
  for (let i = E.list.length - 1; i >= 0; i--) {
    const e = E.list[i];
    if (!e.tg.dead || e.type === 'player') continue;
    E.byId.delete(e.id);
    E.list.splice(i, 1);
    release(e);
  }
  if (E.heat > 0) E.heat = Math.max(0, E.heat - B.HEAT_DECAY * dt * 0.1);
};

/* ==========================================================
23 · CICLO DIARIO Y REAPARICIÓN
========================================================== */
E.onDay = function (day) {
  E.day = day;
  W.dayTick(day);
  const rng = rngLoot();
  for (let i = 0; i < E.list.length; i++) {
    const e = E.list[i];
    if (e.tg.dead) continue;
    if (e.tg.baby && !e.tg.child && day >= e.tg.growDay) {
      const sd = D.SPECIES[e.species];
      e.tg.baby = false;
      e.tg.scale = sd ? sd.scale : 1;
      e.name = (sd ? sd.name : e.name) + (e.tg.tamed ? ' (tuyo)' : '');
      e.st.maxHp = sd ? sd.hp : e.st.maxHp; e.st.hp = e.st.maxHp;
      e.cb.dmg = sd ? sd.dmg : e.cb.dmg;
      if (sd && !e.tg.tamed) e.tg.hostile = (sd.behavior === 'hostile' || sd.behavior === 'ambush');
      if (e.tg.tamed) { toast('¡' + e.name + ' ha crecido!', 'good'); fx('spark', e.t.x, e.t.y); }
      Bus.emit('grew', { entity: e });
    }
    if (e.tg.livestock && e.tg.owner === 'player') {
      if (e.tg.fed > 0) {
        e.tg.fed--; e.tg.prodT++;
        const sd = D.SPECIES[e.species];
        if (sd && sd.livestock && e.tg.prodT >= sd.livestock.every && !e.tg.ready) {
          e.tg.prodT = 0;
          const weights = e.tg.feedQ || [90, 10, 0, 0];
          let roll = rng.next() * 100, q = 0;
          for (let k = 0; k < weights.length; k++) { roll -= weights[k]; if (roll <= 0) { q = k; break; } }
          e.tg.ready = { id: sd.livestock.product, n: rng.int(sd.livestock.qty[0], sd.livestock.qty[1]), q: q };
          if (sd.livestock.second) e.tg.ready2 = { id: sd.livestock.second, n: 1 };
        }
      } else e.tg.prodT = 0;
    }
    if (e.tg.tamed && !e.tg.livestock) e.st.hp = e.st.maxHp;
    if (e.tg.tamed) { e.cb.poison = 0; e.cb.poisonT = 0; e.cb.burn = 0; e.cb.burnT = 0; e.cb.bleed = 0; e.cb.bleedT = 0; }
  }
  E.spawnBosses();
  E.spawnWanderers();
  E.syncGuardians();
  Bus.emit('entities:day', { day: day });
};
E.respawnPlayer = function (x, y) {
  const p = E.player;
  if (!p) return;
  p.t.x = x + 0.5; p.t.y = y + 0.5; p.t.px = p.t.x; p.t.py = p.t.y;
  p.st.hp = Math.round(p.st.maxHp * 0.6);
  p.st.st = p.st.maxSt * 0.6;
  p.st.food = Math.max(25, p.st.food);
  p.cb.poison = 0; p.cb.poisonT = 0;
  p.cb.burn = 0; p.cb.burnT = 0;
  p.cb.bleed = 0; p.cb.bleedT = 0;
  p.cb.slow = 0; p.cb.slowT = 0;
  p.cb.stagger = 0; p.cb.guard = 0;
  p.ko = false;
  p.v.x = p.v.y = 0; p.vx = p.vy = 0;
  p.act = null; if (p.blk) p.blk.on = false; p.cast = null;
  p.rollT = 0; p.rollCd = 0;
  if (p.mount) E.dismount();
  forgetPlayer();
  CR.Input.clearAll();
  fx('spark', p.t.x, p.t.y);
};

/* ==========================================================
24 · SERIALIZACIÓN v4 (incluye saberes y puntos de receta)
========================================================== */
E.serialize = function () {
  const p = E.player;
  if (!p) return null;
  const persist = [];
  for (let i = 0; i < E.list.length; i++) {
    const e = E.list[i];
    if (e === p || e.tg.dead || !e.tg.persist) continue;
    if (e.type === 'npc' || e.type === 'guard') continue;
    if (e.tg.boss) continue;
    persist.push({
      type: e.type, species: e.species, name: e.name, gender: e.gender,
      x: e.t.x, y: e.t.y, hp: e.st.hp, maxHp: e.st.maxHp,
      hx: e.ai.home.x, hy: e.ai.home.y,
      tg: JSON.parse(JSON.stringify(e.tg))
    });
  }
  return {
    player: {
      name: p.name, gender: p.gender, x: p.t.x, y: p.t.y, ang: p.t.ang,
      hp: p.st.hp, maxHp: p.st.maxHp, st: p.st.st, maxSt: p.st.maxSt, food: p.st.food,
      inv: p.inv, equip: p.equip, quick: p.quick, xp: p.xp, lvl: p.lvl, ammoId: p.ammoId,
      gold: p.gold, debt: p.debt, free: p.free, bank: p.bank,
      buffs: p.buffs, foodAcc: p.foodAcc
    },
    persist: persist, bossState: E.bossState, heat: E.heat, day: E.day, uid: E._uid
  };
};
E.deserialize = function (data) {
  if (!data || !data.player) return false;
  try {
    E.reset(false);
    const pd = data.player;
    const p = E.createPlayer(pd.name, pd.gender);
    p.t.x = pd.x; p.t.y = pd.y; p.t.px = pd.x; p.t.py = pd.y; p.t.ang = pd.ang || 0;
    p.inv = Array.isArray(pd.inv) ? pd.inv : p.inv;
    p.equip = pd.equip || p.equip;
    for (let i = 0; i < EQUIP_SLOTS.length; i++)
      if (p.equip[EQUIP_SLOTS[i]] === undefined) p.equip[EQUIP_SLOTS[i]] = null;
    p.quick = pd.quick || p.quick;
    if (pd.xp) for (let i = 0; i < TRADES.length; i++) if (pd.xp[TRADES[i]]) p.xp[TRADES[i]] = pd.xp[TRADES[i]];
    if (pd.lvl) {
      p.lvl.xp = pd.lvl.xp || 0;
      p.lvl.level = pd.lvl.level || D.levelFromXP(p.lvl.xp);
      p.lvl.points = pd.lvl.points || 0;
      p.lvl.known = pd.lvl.known || {};
      p.lvl.rp = pd.lvl.rp || 0;
      for (let i = 0; i < D.SKILLS.length; i++) {
        const id = D.SKILLS[i].id;
        p.lvl.alloc[id] = (pd.lvl.alloc && pd.lvl.alloc[id]) || 0;
      }
    }
    p.ammoId = pd.ammoId || null;
    p.gold = pd.gold || 0;
    p.debt = pd.debt === undefined ? B.DEBT : pd.debt;
    p.free = !!pd.free; p.bank = pd.bank || 0;
    p.buffs = pd.buffs || { bless: 0 };
    p.foodAcc = pd.foodAcc || 0;
    E.recalc(p);
    p.st.maxHp = pd.maxHp || p.st.maxHp;
    p.st.hp = U.clamp(pd.hp === undefined ? p.st.hp : pd.hp, 1, p.st.maxHp);
    p.st.maxSt = pd.maxSt || p.st.maxSt;
    p.st.st = U.clamp(pd.st === undefined ? p.st.st : pd.st, 0, p.st.maxSt);
    p.st.food = U.clamp(pd.food === undefined ? p.st.food : pd.food, 0, p.st.maxFood);
    E.autoAmmo(p);
    E.spawnNPCs();
    E.day = data.day || 1;
    E.heat = data.heat || 0;
    E.bossState = data.bossState || {};
    if (Array.isArray(data.persist)) {
      for (let i = 0; i < data.persist.length; i++) {
        const s = data.persist[i];
        let e = null;
        if (s.type === 'worker') {
          e = E.spawnWorker({ name: s.name, gender: s.gender, x: s.x, y: s.y,
            role: s.tg.role, child: s.tg.child, stage: s.tg.stage, growDay: s.tg.growDay });
        } else if (s.species) {
          e = E.spawnCreature(s.species, s.x, s.y, { persist: true, tamed: s.tg.tamed, owner: s.tg.owner, livestock: s.tg.livestock, noBaby: true });
        }
        if (!e) continue;
        e.name = s.name;
        e.st.hp = s.hp; e.st.maxHp = s.maxHp;
        e.ai.home.x = s.hx; e.ai.home.y = s.hy;
        for (const k in s.tg) e.tg[k] = s.tg[k];
        e.tg.dead = false;
        e.tg.otid = 0; if (e.tg.order === 'attack') e.tg.order = 'follow';
        if (e.tg.zone) {
          for (let z = 0; z < W.zones.length; z++)
            if (W.zones[z].id === e.tg.zone) { e.ai.zone = W.zones[z]; break; }
        }
        if (e.tg.guardian) e.ai.state = 'guard';
        else if (e.tg.livestock) e.ai.state = 'wander';
        else if (e.tg.tamed) e.ai.state = 'follow';
      }
    }
    E.spawnBosses();
    E.syncGuardians();
    W.Hash.rebuild(E.list);
    E._uid = Math.max(E._uid, data.uid || 0);
    return true;
  } catch (err) { CR.reportError(err, 'entities.deserialize'); return false; }
};
E.reset = function (keepPlayer) {
  for (let i = 0; i < E.list.length; i++) release(E.list[i]);
  E.list.length = 0;
  E.byId.clear();
  for (let i = 0; i < E.projectiles.length; i++) projPool.release(E.projectiles[i]);
  E.projectiles.length = 0;
  E.loot.length = 0;
  E.hazards.length = 0;
  _timers.length = 0;
  E.bossState = {};
  E.heat = 0; E.hitstop = 0;
  E._spawnT = 0; E._campT = 0; E._uid = 0; E.day = 1; E._frame = 0;
  E.aim.kind = null; E.aim.ref = null; E.aim.lock = null; E.aim.lockT = 0;
  E.aim.node = null; E.aim.cands.length = 0; E.aim.draw = 0; E.aim.mode = 'melee';
  E.hitMark.ref = null; E.hitMark.t = 0; E.hitMark.focusT = 0; E.hitMark.lag = 1;
  E.nodeHit.node = null; E.nodeHit.t = 0; E.nodeHit.focusT = 0;
  if (!keepPlayer) E.player = null;
  W.Hash.clear();
};

console.info('[CR] entities.js v4 listo · kit inicial reducido · herramientas rotas reparables · ' +
  'niveles con stats y saberes · canales de combate · apuntado pegajoso · ' +
  Object.keys(D.SPECIES).length + ' especies con ecología · jefes por fases');
})();