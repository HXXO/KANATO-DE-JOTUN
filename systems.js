/* ============================================================
KANATO DE JOTUN · systems.js v5 — Sistemas (PARTE 1/3)
Concatenar: Parte 1 + Parte 2 + Parte 3 en un solo systems.js.
============================================================ */
(function () {
'use strict';
const CR = window.CR;
if (!CR || !CR.DATA || !CR.World || !CR.Ent) { console.error('[CR] systems.js requiere core, data, world y entities'); return; }
const U = CR.util, C = CR.CONFIG, D = CR.DATA, B = D.BAL, W = CR.World, E = CR.Ent, A = CR.Audio, Bus = CR.Bus;

const Time = CR.Time = { day: 1, month: 1, hour: 6, minute: 0, min: 360, weather: 'clear', rain: 0, wind: 0.3, night: 0 };

const S = CR.Sys = {
  trust: {}, rel: {}, flags: {}, daily: {},
  quests: { active: null, progress: 0, done: [] },
  family: { spouse: null, children: [], pregnantDay: 0 },
  help: null,
  slaveStock: 0, workerMorale: {},
  dialog: null, panel: null, fishing: null,
  uiMode: 'none', _autosave: 0, _lastBackup: 0, _started: false,
  publicCd: {}
};

/* ---------- Avisos no invasivos ---------- */
const _seen = Object.create(null);
let _lastToast = -1e9, _lastTick = -1e9;
const TOAST_GAP = 420, TICK_GAP = 140, DEDUPE_MS = 2600;

function fresh(msg, win) {
  const now = U.now(), prev = _seen[msg];
  if (prev !== undefined && now - prev < win) return false;
  _seen[msg] = now;
  let n = 0; for (const k in _seen) n++;
  if (n > 220) { for (const k in _seen) if (now - _seen[k] > DEDUPE_MS * 2) delete _seen[k]; }
  return true;
}
function tick(msg, cls) {
  if (!msg) return;
  const now = U.now();
  if (now - _lastTick < TICK_GAP) return;
  if (!fresh(msg, 1200)) return;
  _lastTick = now;
  Bus.emit('ticker', { msg: msg, cls: cls || '' });
}
function toast(msg, cls) {
  if (!msg) return;
  const now = U.now();
  if (!fresh(msg, DEDUPE_MS)) return;
  if (now - _lastToast < TOAST_GAP) { Bus.emit('ticker', { msg: msg, cls: cls || '' }); _lastTick = now; return; }
  _lastToast = now;
  Bus.emit('toast', { msg: msg, cls: cls || '' });
}
S.toast = toast; S.tick = tick;
function fx(k, x, y, ex) { Bus.emit('fx', { kind: k, x: x, y: y, extra: ex || null }); }
function floater(x, y, t, c) { Bus.emit('floater', { x: x, y: y, text: t, color: c || '#fff' }); }
function shakeSafe(a) { Bus.emit('shake', { amt: a }); }
function player() { return E.player; }
function P() { const p = E.player; if (p) ensureProg(p); return p; }
function ensureProg(p) {
  if (!p.lvl) p.lvl = { xp: 0, level: 1, points: 0, alloc: {} };
  if (!p.lvl.known) p.lvl.known = {};
  if (!p.lvl.sabers) p.lvl.sabers = {};
  if (p.lvl.rp === undefined) p.lvl.rp = 0;
}
function rng() { return CR.streams ? CR.streams.ai : CR.RNG(7); }
function lootRng() { return CR.streams ? CR.streams.loot : CR.RNG(3); }
function stationName(s) { return D.STATION_INFO[s] ? D.STATION_INFO[s].name : s; }
S.stationName = stationName;
function maxDurOf(def) {
  if (E.maxDurOf) return E.maxDurOf(def);
  if (!def) return 0;
  return def.tool ? def.tool.dur : (def.weapon ? def.weapon.dur : (def.shield ? def.shield.dur : 0));
}

/* ==========================================================
1 · CONFIANZA
========================================================== */
function trustOf(id) { return S.trust[id] === undefined ? 0 : S.trust[id]; }
function bandOf(v) {
  for (let i = 0; i < B.TRUST_BANDS.length; i++) if (v >= B.TRUST_BANDS[i].min) return B.TRUST_BANDS[i];
  return B.TRUST_BANDS[B.TRUST_BANDS.length - 1];
}
S.trustOf = trustOf; S.bandOf = bandOf;
function addTrust(id, delta, reason) {
  if (!D.NPCS[id]) return;
  const before = trustOf(id), oldBand = bandOf(before).name;
  const v = U.clamp(before + delta, -100, 100);
  S.trust[id] = v;
  const newBand = bandOf(v).name;
  Bus.emit('trust', { npcId: id, value: v, delta: delta });
  if (newBand !== oldBand) toast(D.NPCS[id].name + ' ahora siente ' + newBand.toLowerCase() + ' por ti.', delta > 0 ? 'good' : 'bad');
  if (reason && Math.abs(delta) >= 5) {
    const p = player();
    if (p) floater(p.t.x, p.t.y - 1, (delta > 0 ? '+' : '') + delta + ' confianza', delta > 0 ? '#8fe08f' : '#ff8a7a');
  }
  applyConsequences(id);
}
S.addTrust = addTrust;
function applyConsequences(id) {
  const v = trustOf(id);
  if (v <= -60) {
    if (id === 'roderic') {
      E.heat = Math.max(E.heat, 55);
      for (let i = 0; i < E.list.length; i++) if (E.list[i].type === 'guard') E.list[i].tg.angry = true;
    }
    if (id === 'silas') S.flags.bankFrozen = true;
    if (id === 'bareth' && player() && !player().free) { player().debt += 25; toast('Bareth añade 25 de recargo a tu deuda.', 'bad'); }
  } else if (id === 'silas') S.flags.bankFrozen = false;
}
function dailyKey(id, act) { return Time.day + ':' + id + ':' + act; }
function dailyUsed(id, act) { return !!S.daily[dailyKey(id, act)]; }
function markDaily(id, act) { S.daily[dailyKey(id, act)] = true; }
function condOk(when, npcId) {
  if (!when) return true;
  const p = player();
  if (!p) return false;
  if (when.free && !p.free) return false;
  if (when.slave && p.free) return false;
  const t = trustOf(npcId);
  if (when.trustMin !== undefined && t < when.trustMin) return false;
  if (when.trustMax !== undefined && t > when.trustMax) return false;
  const rel = S.rel[npcId] || 'none';
  if (when.rel && rel !== when.rel) return false;
  if (when.relIn && when.relIn.indexOf(rel) < 0) return false;
  if (when.relNot && rel === when.relNot) return false;
  if (when.married && S.family.spouse !== npcId) return false;
  if (when.hasItem && E.Inv.count(p, when.hasItem.id) < when.hasItem.n) return false;
  if (when.goldMin !== undefined && p.gold < when.goldMin) return false;
  if (when.flag && !S.flags[when.flag]) return false;
  if (when.levelMin !== undefined && p.lvl.level < when.levelMin) return false;
  return true;
}

/* ==========================================================
2 · INVENTARIO Y COSTES
========================================================== */
function emptyCount(p) { let n = 0; for (let i = 0; i < p.inv.length; i++) if (!p.inv[i]) n++; return n; }
function canFit(id, n) {
  const p = player(), def = D.ITEMS[id];
  if (!def || !p) return false;
  const max = def.stack;
  let room = emptyCount(p) * max;
  if (max > 1) for (let i = 0; i < p.inv.length; i++) {
    const s = p.inv[i];
    if (s && s.id === id && s.n < max && s.dur === undefined) room += max - s.n;
  }
  return room >= n;
}
function hasCost(cost) { const p = player(); for (const id in cost) if (E.Inv.count(p, id) < cost[id]) return false; return true; }
function payCost(cost) { if (!hasCost(cost)) return false; const p = player(); for (const id in cost) E.Inv.remove(p, id, cost[id]); return true; }
function refundCost(cost) { const p = player(); for (const id in cost) E.Inv.add(p, id, cost[id], 0); }
function costText(cost) {
  const parts = [];
  for (const id in cost) parts.push(cost[id] + ' ' + (D.ITEMS[id] ? D.ITEMS[id].name : id));
  return parts.join(' · ');
}
S.costText = costText;
function gateInput() {
  if (CR.UI && typeof CR.UI.syncInput === 'function') { CR.UI.syncInput(); return; }
  CR.Input.enabled = !!(player() && !player().ko && S.uiMode === 'none');
}
function openPanel(type, data) {
  S.panel = { type: type, data: data || {} };
  S.uiMode = 'panel';
  gateInput();
  Bus.emit('panel:open', { type: type, data: S.panel.data });
  A.play('open');
}
function closePanel() {
  S.panel = null;
  S.uiMode = S.dialog ? 'dialog' : 'none';
  gateInput();
  Bus.emit('panel:close', {});
  A.play('close');
}
S.openPanel = openPanel; S.closePanel = closePanel;

/* ==========================================================
3 · INIT Y EVENTOS
========================================================== */
S.init = function () {
  if (S._started) return;
  S._started = true;
  Bus.on('interact:npc', function (d) { S.startDialog(d.npcId); }, 'sys');
  Bus.on('interact:building', function (d) { S.buildingInteract(d.building); }, 'sys');
  Bus.on('interact:soil', function (d) { openPanel('farm', { x: d.x, y: d.y }); }, 'sys');
  Bus.on('interact:fish', function (d) { S.startFishing(d.spot); }, 'sys');
  Bus.on('interact:parcel', function (d) { openPanel('parcel', { id: d.parcel.id }); }, 'sys');
  Bus.on('kill', function (d) { S.onKill(d); }, 'sys');
  Bus.on('npc:attacked', function (d) { S.onNpcAttacked(d.npcId); }, 'sys');
  Bus.on('work', function (d) { S.onWork(d); }, 'sys');
  Bus.on('ko', function () { S.onKO(); }, 'sys');
  Bus.on('sleep:request', function (d) { S.sleep(d && d.mode ? d.mode : 'auto'); }, 'sys');
  Bus.on('net:request', function () { S.useNet(); }, 'sys');
  Bus.on('input:press', function (a) { if (S.fishing && (a === 'attack' || a === 'interact')) S.fishingPress(); }, 'sys');
  Bus.on('livestock:feed', function (d) { S.helpProgress('feed', d.x, d.y, 1); }, 'sys');
  Bus.on('gather', function (d) {
    if (!d || !d.amount) return;
    tick(d.def.name + ' · +' + d.amount, 'good');
  }, 'sys');
};
S.newGame = function (name, gender, seed) {
  S.trust = {}; S.rel = {}; S.flags = {}; S.daily = {};
  S.quests = { active: null, progress: 0, done: [] };
  S.family = { spouse: null, children: [], pregnantDay: 0 };
  S.help = null;
  S.slaveStock = 0; S.workerMorale = {};
  S.dialog = null; S.panel = null; S.fishing = null; S.uiMode = 'none';
  S.publicCd = {};
  S._autosave = 0;
  const ids = Object.keys(D.NPCS);
  for (let i = 0; i < ids.length; i++) { S.trust[ids[i]] = 0; S.rel[ids[i]] = 'none'; }
  S.trust.bareth = -10;
  Time.day = 1; Time.month = 1; Time.min = B.DAY_START * 60;
  Time.hour = B.DAY_START; Time.minute = 0;
  Time.weather = 'clear'; Time.rain = 0; Time.wind = 0.3; Time.night = 0;
  E.day = 1;
  S.slaveStock = W.title().slaves;
  gateInput();
  toast('Solo tienes pico y hacha. En la plaza hay horno y mesa públicos, y Nadia vende arcos.', 'gold');
};

/* ==========================================================
4 · TIEMPO Y CICLO DIARIO
========================================================== */
S.update = function (dt) {
  const p = player();
  if (!p) return;
  ensureProg(p);
  const minsPerSec = 1440 / (C.DAY_REAL_MS / 1000);
  Time.min += dt * minsPerSec;
  while (Time.min >= 1440) { Time.min -= 1440; S.onDay(); }
  Time.hour = Math.floor(Time.min / 60);
  Time.minute = Math.floor(Time.min % 60);
  Time.month = Math.floor((Time.day - 1) / C.DAYS_PER_MONTH) + 1;
  const h = Time.hour + Time.minute / 60;
  Time.night = h < 5.5 ? 1 : h < 7 ? (7 - h) / 1.5 : h < 19 ? 0 : h < 21 ? (h - 19) / 2 : 1;
  Time.night = U.clamp(Time.night, 0, 1);
  if (S.fishing) S.updateFishing(dt);
  for (const k in S.publicCd) if (S.publicCd[k] > 0) S.publicCd[k] = Math.max(0, S.publicCd[k] - dt);
  if (S.help && Time.day > S.help.deadline) {
    toast('La tarea de ' + D.NPCS[S.help.npcId].name + ' ha caducado.', 'bad');
    addTrust(S.help.npcId, -4);
    S.help = null;
  }
  S._autosave += dt;
  if (S._autosave > 60) { S._autosave = 0; S.save(true); }
  const indoors = !!W.insideBuilding(Math.floor(p.t.x), Math.floor(p.t.y));
  A.setEnvironment({ night: Time.night, rain: Time.rain, wind: Time.wind, indoors: indoors });
};
S.onDay = function () {
  Time.day++;
  const newMonth = Math.floor((Time.day - 1) / C.DAYS_PER_MONTH) + 1;
  const monthChanged = newMonth !== Time.month;
  Time.month = newMonth;
  const p = player();
  const r = CR.streams ? CR.streams.world : CR.RNG(Time.day);
  if (r.chance(0.28)) { Time.weather = 'rain'; Time.rain = r.range(0.4, 1); Time.wind = r.range(0.4, 0.9); }
  else if (r.chance(0.2)) { Time.weather = 'wind'; Time.rain = 0; Time.wind = r.range(0.6, 1); }
  else { Time.weather = 'clear'; Time.rain = 0; Time.wind = r.range(0.15, 0.45); }
  if (!p) return;
  if (p.bank > 0 && !S.flags.bankFrozen) {
    const interest = Math.min(B.BANK_CAP, Math.floor(p.bank * B.BANK_RATE));
    if (interest > 0) { p.bank += interest; tick('Interés del banco: +' + interest + ' oro', 'gold'); }
  }
  W.soil.forEach(function (s) {
    if (!s.crop) return;
    const cd = D.CROPS[s.crop];
    if (!cd) return;
    const watered = s.watered || Time.rain > 0.3;
    let rate = 1 / cd.days;
    if (watered) rate *= B.WATER_GROWTH;
    if (s.fert && D.ITEMS[s.fert] && D.ITEMS[s.fert].fert) rate *= D.ITEMS[s.fert].fert.growth;
    s.growth = Math.min(1, s.growth + rate);
    s.watered = false;
  });
  const foods = ['bread', 'flatbread', 'cooked_meat', 'cooked_fish', 'stew', 'porridge', 'dried_meat', 'berry', 'apple', 'crop_wheat'];
  let hungry = 0;
  for (let i = 0; i < E.list.length; i++) {
    const e = E.list[i];
    if (e.type !== 'worker' || e.tg.dead) continue;
    if (e.tg.child && (e.tg.stage === 'baby' || e.tg.stage === 'child')) continue;
    let fed = false;
    for (let k = 0; k < foods.length; k++) if (E.Inv.remove(p, foods[k], B.SLAVE_FOOD)) { fed = true; break; }
    let m = S.workerMorale[e.id] === undefined ? 70 : S.workerMorale[e.id];
    m = U.clamp(m + (fed ? 10 : -25), 0, 100);
    S.workerMorale[e.id] = m;
    if (m <= 0 && !e.tg.child) { e.tg.dead = true; toast(e.name + ' ha huido por hambre.', 'bad'); }
    else if (m < 30) hungry++;
  }
  if (hungry) tick(hungry + ' trabajador(es) descontentos por falta de comida', 'bad');
  S.growChildren();
  if (S.family.spouse && !S.family.pregnantDay) {
    const house = W.bestHouse();
    const cap = house ? (D.BUILDINGS[house.key].childCap || 0) : 0;
    if (cap > S.family.children.length && r.chance(0.35)) {
      S.family.pregnantDay = Time.day + B.PREGNANCY_DAYS;
      toast('¡Tu familia va a crecer! (' + B.PREGNANCY_DAYS + ' días)', 'gold');
    }
  }
  if (S.family.pregnantDay && Time.day >= S.family.pregnantDay) S.birthChild();
  if (monthChanged) { S.slaveStock = W.title().slaves; tick('Nuevo mes: ' + S.slaveStock + ' trabajadores disponibles', 'gold'); }
  S.daily = {};
  E.onDay(Time.day);
  S.save(true);
  Bus.emit('day', { day: Time.day, month: Time.month });
  tick('Día ' + Time.day + ' · Mes ' + Time.month, 'gold');
};

/* ==========================================================
5 · DORMIR
========================================================== */
S.sleepOptions = function () {
  const p = player();
  if (!p) return [];
  const out = [];
  const roll = E.Inv.count(p, 'bed_roll') > 0;
  out.push({
    mode: 'roll', name: 'Petate enrollado', ok: roll,
    heal: B.SLEEP_OUTDOOR_HEAL, cost: 0, risk: B.SLEEP_OUTDOOR_AMBUSH,
    desc: roll ? 'Duermes donde estés. Recuperas el 72 % y hay un 34 % de emboscada.'
      : 'Se hace A MANO con paja, fibra y cuerda. No necesitas mesa.'
  });
  const inn = nearInn();
  out.push({
    mode: 'inn', name: 'Posada del Camino', ok: !!inn && p.gold >= B.SLEEP_MARKET_COST,
    heal: B.SLEEP_MARKET_HEAL, cost: B.SLEEP_MARKET_COST, risk: 0,
    desc: inn ? 'Cama bajo techo por ' + B.SLEEP_MARKET_COST + ' oro. Segura, pero despiertas con un 10 % menos de vida.'
      : 'Acércate a la Posada del Camino o habla con Gunda.'
  });
  const bed = W.bestBed();
  const bd = bed ? D.ITEMS[bed.building.key] : null;
  out.push({
    mode: 'bed', name: bed ? (D.BUILDINGS[bed.building.key] || {}).name || 'Tu cama' : 'Cama propia',
    ok: !!bed, heal: bed ? bed.heal : 0, cost: 0, risk: 0,
    bonusSt: bd && bd.bed ? (bd.bed.bonusSt || 0) : 0,
    bonusHp: bd && bd.bed ? (bd.bed.bonusHp || 0) : 0,
    desc: bed ? 'Descanso completo sin riesgo.' + (bd && bd.bed && bd.bed.bonusSt ? ' Despiertas con vigor extra.' : '')
      : 'Coloca una cama en tu parcela.'
  });
  return out;
};
function nearInn() {
  const p = player();
  if (!p) return null;
  for (let i = 0; i < W.buildings.length; i++) {
    const b = W.buildings[i];
    if (b.key !== 'inn') continue;
    if (U.dist2(p.t.x, p.t.y, b.x + b.w / 2, b.y + b.h / 2) < 40) return b;
  }
  for (let i = 0; i < E.list.length; i++) {
    const e = E.list[i];
    if (e.type === 'npc' && e.npcId === 'gunda' && !e.tg.dead && U.dist2(p.t.x, p.t.y, e.t.x, e.t.y) < 20) return e;
  }
  return null;
}
S.sleep = function (mode) {
  const p = player();
  if (!p) return;
  if (!mode || mode === 'auto') {
    const opts = S.sleepOptions();
    mode = opts[2].ok ? 'bed' : (opts[1].ok ? 'inn' : (opts[0].ok ? 'roll' : null));
    if (!mode) { openPanel('bed', {}); toast('No tienes dónde dormir. Fabrica un petate a mano o coloca una cama.', 'bad'); return; }
  }
  const opts = S.sleepOptions();
  let o = null;
  for (let i = 0; i < opts.length; i++) if (opts[i].mode === mode) o = opts[i];
  if (!o || !o.ok) { toast(o ? o.desc : 'No puedes dormir así.', 'bad'); A.play('error'); openPanel('bed', {}); return; }
  if (o.cost > 0) { p.gold -= o.cost; addTrust('gunda', 1); }
  if (S.panel) closePanel();
  if (S.dialog) S.closeDialog();
  A.play('sleep');
  Time.min = B.DAY_START * 60;
  S.onDay();
  p.st.hp = Math.round(p.st.maxHp * o.heal);
  p.st.st = p.st.maxSt;
  p.st.food = Math.max(45, p.st.food);
  p.cb.poison = 0; p.cb.poisonT = 0;
  p.cb.burn = 0; p.cb.burnT = 0;
  p.cb.bleed = 0; p.cb.bleedT = 0;
  p.cb.slow = 0; p.cb.slowT = 0;
  p.cb.stagger = 0; p.cb.guard = 0;
  if (o.bonusSt) p.st.st = Math.min(p.st.maxSt + o.bonusSt, p.st.maxSt + o.bonusSt);
  if (o.bonusHp) p.st.hp = Math.min(p.st.maxHp, p.st.hp + o.bonusHp);
  if (mode === 'inn') {
    p.st.hp = Math.max(1, Math.round(p.st.hp * (1 - B.SLEEP_MARKET_HP_CUT)));
    tick('Has dormido en la posada. Despiertas algo mermado.', 'good');
  } else if (mode === 'bed') {
    tick('Has dormido en tu cama hasta el alba.', 'good');
  } else {
    if (rng().chance(o.risk)) {
      const spot = E.freeSpotNear(p.t.x, p.t.y, 4);
      const n = 1 + (rng().chance(0.4) ? 1 : 0);
      for (let i = 0; i < n; i++) {
        const b = E.spawnCreature('bandit', spot.x + i * 0.7, spot.y + i * 0.4, {});
        if (b) { b.tg.hostile = true; b.ai.target = p; b.ai.state = 'chase'; }
      }
      p.st.hp = Math.max(1, p.st.hp - Math.round(p.st.maxHp * 0.12));
      shakeSafe(8); A.play('hurt');
      Bus.emit('banner', { title: '¡EMBOSCADA!', sub: 'Alguien te ha visto dormir al raso.' });
    } else {
      tick('Has dormido al raso. Nadie te ha molestado… esta vez.', 'good');
    }
  }
  E.recalc(p);
  S.save(true);
  Bus.emit('slept', { mode: mode, day: Time.day });
};

/* ==========================================================
6 · DIÁLOGOS
========================================================== */
S.startDialog = function (npcId) {
  const nd = D.NPCS[npcId];
  if (!nd) return;
  if (trustOf(npcId) <= -80) { toast(nd.name + ' se niega a hablar contigo.', 'bad'); A.play('error'); return; }
  S.dialog = { npcId: npcId, nodeId: nd.dlg.start, transient: null };
  S.uiMode = 'dialog';
  gateInput();
  Bus.emit('dialog:open', S.dialogView());
};
S.closeDialog = function () {
  S.dialog = null;
  S.uiMode = S.panel ? 'panel' : 'none';
  gateInput();
  Bus.emit('dialog:close', {});
  A.play('close');
};
S.dialogView = function () {
  if (!S.dialog) return null;
  const nd = D.NPCS[S.dialog.npcId];
  const node = S.dialog.transient || nd.dlg.nodes[S.dialog.nodeId] || nd.dlg.nodes.root;
  let text = '';
  if (node.text) for (let i = 0; i < node.text.length; i++) {
    if (condOk(node.text[i].when, S.dialog.npcId)) { text = node.text[i].t; break; }
  }
  const choices = [];
  const raw = node.choices || [];
  for (let i = 0; i < raw.length; i++) {
    if (condOk(raw[i].when, S.dialog.npcId)) choices.push({ t: raw[i].t, i: choices.length, _raw: raw[i] });
  }
  const t = trustOf(S.dialog.npcId);
  return {
    npcId: S.dialog.npcId, name: nd.name, role: nd.role,
    trust: t, band: bandOf(t), text: text, choices: choices,
    rel: S.rel[S.dialog.npcId] || 'none'
  };
};
S.choose = function (idx) {
  if (!S.dialog) return;
  const view = S.dialogView();
  if (!view || !view.choices[idx]) return;
  const ch = view.choices[idx]._raw;
  const id = S.dialog.npcId;
  if (ch.dt) {
    const key = ch.act || ch.go || ch.t;
    if (ch.daily) { if (!dailyUsed(id, key)) { addTrust(id, ch.dt); markDaily(id, key); } }
    else addTrust(id, ch.dt);
  }
  A.play('click');
  if (ch.act) { S.doAct(ch.act, id); return; }
  if (ch.go) { S.dialog.nodeId = ch.go; S.dialog.transient = null; Bus.emit('dialog:update', S.dialogView()); return; }
  S.closeDialog();
};
S.say = function (npcId, text) {
  S.dialog = {
    npcId: npcId, nodeId: 'root',
    transient: { text: [{ t: text }], choices: [{ t: 'Volver', go: 'root' }, { t: 'Marcharse', act: 'end' }] }
  };
  S.uiMode = 'dialog';
  gateInput();
  if (CR.UI && CR.UI.renderDialog) CR.UI.renderDialog();
  Bus.emit('dialog:update', S.dialogView());
};
S.doAct = function (act, npcId) {
  switch (act) {
    case 'end': S.closeDialog(); break;
    case 'smalltalk': {
      const nd = D.NPCS[npcId];
      if (dailyUsed(npcId, 'smalltalk')) S.say(npcId, nd.name + ' ya te ha contado suficiente por hoy.');
      else { markDaily(npcId, 'smalltalk'); S.say(npcId, '«' + rng().pick(nd.smalltalk) + '»'); }
      break;
    }
    case 'gift': S.closeDialog(); openPanel('gift', { npcId: npcId }); break;
    case 'shop': S.closeDialog(); openPanel('shop', { npcId: npcId }); break;
    case 'debt': S.closeDialog(); openPanel('debt', {}); break;
    case 'bank': S.closeDialog(); openPanel('bank', {}); break;
    case 'bless': S.closeDialog(); S.bless(); break;
    case 'charity': S.closeDialog(); S.charity(); break;
    case 'wedding': S.closeDialog(); S.wedding(); break;
    case 'propose': S.closeDialog(); S.propose(npcId); break;
    case 'quest': S.closeDialog(); openPanel('quest', {}); break;
    case 'land': case 'parcel': S.closeDialog(); openPanel('parcelList', {}); break;
    case 'slaves': S.closeDialog(); openPanel('slaves', {}); break;
    case 'repair': S.closeDialog(); S.repair(npcId); break;
    case 'help_task': case 'help_farm': S.closeDialog(); openPanel('helpTask', { npcId: npcId }); break;
    case 'stations': S.closeDialog(); openPanel('stations', { npcId: npcId }); break;
    case 'bed_market': S.closeDialog(); S.sleep('inn'); break;
    case 'family': S.closeDialog(); openPanel('family', {}); break;
    default: S.closeDialog(); break;
  }
};

/* ==========================================================
7 · TIENDAS
========================================================== */
function shopOpen(npcId) { return trustOf(npcId) > -60; }
function buyPrice(id, npcId) {
  const def = D.ITEMS[id];
  let price = Math.ceil(def.value * B.SHOP_MARKUP);
  const t = trustOf(npcId);
  if (t >= 40) price = Math.ceil(price * (1 - B.TRUST_DISCOUNT * (t / 100)));
  if (t <= -20) price = Math.ceil(price * 1.2);
  return Math.max(1, price);
}
function sellPrice(id, q, npcId) {
  const def = D.ITEMS[id], nd = D.NPCS[npcId];
  let mult = 1;
  if (nd && nd.shop && nd.shop.buyMult) {
    if (nd.shop.buyMult[def.cat]) mult = nd.shop.buyMult[def.cat];
    if (def.tags) for (let i = 0; i < def.tags.length; i++) if (nd.shop.buyMult[def.tags[i]]) mult = Math.max(mult, nd.shop.buyMult[def.tags[i]]);
  }
  let price = def.value * (B.QUALITY_MULT[q | 0] || 1) * mult;
  const t = trustOf(npcId);
  if (t >= 40) price *= (1 + B.TRUST_SELL_BONUS * (t / 100));
  return Math.max(1, Math.round(price));
}
function wantsItem(nd, def) {
  if (!nd.shop || !nd.shop.buys) return false;
  if (nd.shop.buys.indexOf(def.cat) >= 0) return true;
  if (def.tags) for (let i = 0; i < def.tags.length; i++) if (nd.shop.buys.indexOf(def.tags[i]) >= 0) return true;
  return false;
}
function stallBuyPrice(id) { return Math.max(1, Math.ceil(D.ITEMS[id].value * D.STALL.buyMarkup)); }
function stallSellPrice(id, q) { return Math.max(1, Math.round(D.ITEMS[id].value * (B.QUALITY_MULT[q | 0] || 1) * D.STALL.sellMult)); }
function stallView() {
  const ST = D.STALL, p = player();
  const items = ST.sells.map(function (id) {
    const def = D.ITEMS[id];
    if (!def) return null;
    const price = stallBuyPrice(id);
    return { id: id, name: def.name, price: price, canBuy: p.gold >= price && canFit(id, 1), desc: def.desc };
  }).filter(Boolean);
  const sell = [];
  for (let i = 0; i < p.inv.length; i++) {
    const s = p.inv[i];
    if (!s || ST.buys.indexOf(s.id) < 0) continue;
    sell.push({ slot: i, id: s.id, name: D.ITEMS[s.id].name, n: s.n, q: s.q | 0, price: stallSellPrice(s.id, s.q | 0) });
  }
  return { stall: true, npcId: null, name: ST.name, note: ST.note, gold: p.gold, open: true, items: items, sell: sell, buys: [] };
}
S.shopView = function () {
  if (!S.panel || S.panel.type !== 'shop') return null;
  if (S.panel.data.stall) return stallView();
  const npcId = S.panel.data.npcId, nd = D.NPCS[npcId], p = player();
  if (!nd) return stallView();
  const sells = (nd.shop && nd.shop.sells) || [];
  const items = sells.map(function (id) {
    const def = D.ITEMS[id];
    if (!def) return null;
    const price = buyPrice(id, npcId);
    return { id: id, name: def.name, price: price, canBuy: p.gold >= price && canFit(id, 1), desc: def.desc };
  }).filter(Boolean);
  const sell = [];
  for (let i = 0; i < p.inv.length; i++) {
    const s = p.inv[i];
    if (!s) continue;
    const def = D.ITEMS[s.id];
    if (!def || !wantsItem(nd, def)) continue;
    sell.push({ slot: i, id: s.id, name: def.name, n: s.n, q: s.q | 0, price: sellPrice(s.id, s.q | 0, npcId) });
  }
  return {
    npcId: npcId, name: nd.name, role: nd.role, gold: p.gold, open: shopOpen(npcId),
    items: items, sell: sell, buys: (nd.shop && nd.shop.buys) || [],
    trust: trustOf(npcId), band: bandOf(trustOf(npcId))
  };
};
S.buy = function (id, n) {
  if (!S.panel || S.panel.type !== 'shop') return;
  const stall = !!S.panel.data.stall;
  const npcId = stall ? null : S.panel.data.npcId, p = player();
  if (stall) { if (D.STALL.sells.indexOf(id) < 0) return; }
  else if (!shopOpen(npcId)) { toast('No comercia contigo.', 'bad'); return; }
  n = n || 1;
  const price = (stall ? stallBuyPrice(id) : buyPrice(id, npcId)) * n;
  if (p.gold < price) { toast('Oro insuficiente.', 'bad'); A.play('error'); return; }
  if (!canFit(id, n)) { toast('Inventario lleno.', 'bad'); A.play('error'); return; }
  p.gold -= price;
  E.Inv.add(p, id, n, 0);
  E.autoAmmo(p);
  A.play('buy');
  tick('Comprado: ' + D.ITEMS[id].name + ' ×' + n + ' · −' + price + ' oro', 'good');
  Bus.emit('panel:update', {});
};
S.sellSlot = function (slot, n) {
  if (!S.panel || S.panel.type !== 'shop') return;
  const stall = !!S.panel.data.stall;
  const npcId = stall ? null : S.panel.data.npcId, p = player();
  if (!stall && !shopOpen(npcId)) { toast('No comercia contigo.', 'bad'); return; }
  const s = p.inv[slot];
  if (!s) return;
  const def = D.ITEMS[s.id];
  if (stall) { if (D.STALL.buys.indexOf(s.id) < 0) { toast('La bandeja solo compra materiales básicos.', 'bad'); return; } }
  else if (!wantsItem(D.NPCS[npcId], def)) { toast('No le interesa eso.', 'bad'); return; }
  n = Math.min(n || 1, s.n);
  const price = (stall ? stallSellPrice(s.id, s.q | 0) : sellPrice(s.id, s.q | 0, npcId)) * n;
  E.Inv.removeAt(p, slot, n);
  p.gold += price;
  A.play('sell');
  floater(p.t.x, p.t.y - 0.8, '+' + price + ' oro', '#f3cf7a');
  tick('Vendido: ' + def.name + ' ×' + n + ' · +' + price + ' oro', 'gold');
  Bus.emit('panel:update', {});
};
S.repair = function (npcId) {
  const p = player();
  const who = npcId && D.NPCS[npcId] ? npcId : 'dorn';
  let cost = 0;
  const slots = ['weapon', 'tool', 'shield'];
  for (let i = 0; i < slots.length; i++) {
    const s = p.equip[slots[i]];
    if (!s || s.dur === undefined) continue;
    const def = D.ITEMS[s.id];
    if (!def) continue;
    cost += Math.max(0, maxDurOf(def) - s.dur) * B.REPAIR_COST_PER_DUR;
  }
  cost = Math.ceil(cost * (trustOf(who) >= 60 ? 0.5 : 1));
  if (cost <= 0) { tick('Tu equipo está como nuevo.', 'good'); return; }
  if (p.gold < cost) { toast('La reparación cuesta ' + cost + ' oro.', 'bad'); A.play('error'); return; }
  p.gold -= cost;
  for (let i = 0; i < slots.length; i++) {
    const s = p.equip[slots[i]];
    if (!s || s.dur === undefined) continue;
    s.dur = maxDurOf(D.ITEMS[s.id]);
  }
  E.recalc(p);
  A.play('craft');
  toast('Equipo reparado por ' + cost + ' oro.', 'good');
  Bus.emit('panel:update', {});
};
S.repairInv = function (slot) {
  const p = player();
  if (!E.repairInvSlot) { toast('Reparación no disponible.', 'bad'); return { ok: false }; }
  const r = E.repairInvSlot(p, slot);
  if (r.ok) tick(r.msg, 'good'); else toast(r.msg, 'bad');
  Bus.emit('panel:update', {});
  return r;
};
S.repairEquip = function (key) {
  const p = player();
  if (!E.repairEquip) { toast('Reparación no disponible.', 'bad'); return { ok: false }; }
  const r = E.repairEquip(p, key);
  if (r.ok) tick(r.msg, 'good'); else toast(r.msg, 'bad');
  Bus.emit('panel:update', {});
  return r;
};

/* ==========================================================
8 · BANCO Y DEUDA
========================================================== */
S.bankView = function () {
  const p = player();
  return { gold: p.gold, bank: p.bank, frozen: !!S.flags.bankFrozen, rate: B.BANK_RATE, cap: B.BANK_CAP };
};
S.deposit = function (n) {
  const p = player();
  if (S.flags.bankFrozen) { toast('Tu cuenta está congelada.', 'bad'); return; }
  n = Math.min(n | 0, p.gold);
  if (n <= 0) return;
  p.gold -= n; p.bank += n;
  A.play('coin'); tick('Depositado ' + n + ' oro', 'good');
  Bus.emit('panel:update', {});
};
S.withdraw = function (n) {
  const p = player();
  if (S.flags.bankFrozen) { toast('Tu cuenta está congelada.', 'bad'); return; }
  n = Math.min(n | 0, p.bank);
  if (n <= 0) return;
  p.bank -= n; p.gold += n;
  A.play('coin'); tick('Retirado ' + n + ' oro', 'good');
  Bus.emit('panel:update', {});
};
function debtCredit(id, q) {
  const def = D.ITEMS[id];
  let v = def.value * (B.QUALITY_MULT[q | 0] || 1) * B.DEBT_ITEM_RATE;
  const t = trustOf('bareth');
  if (t >= 40) v *= 1 + B.TRUST_SELL_BONUS * (t / 100);
  return Math.max(1, Math.round(v));
}
S.debtView = function () {
  const p = player();
  const items = [];
  for (let i = 0; i < p.inv.length; i++) {
    const s = p.inv[i];
    if (!s || !D.ITEMS[s.id]) continue;
    items.push({ slot: i, id: s.id, name: D.ITEMS[s.id].name, n: s.n, q: s.q | 0, credit: debtCredit(s.id, s.q | 0) });
  }
  return { debt: p.debt, gold: p.gold, free: p.free, items: items };
};
S.payDebtItem = function (slot, n) {
  const p = player();
  if (p.free) { tick('Ya eres libre.', 'good'); return; }
  const s = p.inv[slot];
  if (!s || !D.ITEMS[s.id]) return;
  const unit = debtCredit(s.id, s.q | 0);
  const need = Math.ceil(p.debt / unit);
  const cnt = Math.min(Math.max(1, n | 0), s.n, need);
  if (cnt <= 0) return;
  const credit = Math.min(unit * cnt, p.debt);
  const name = D.ITEMS[s.id].name;
  E.Inv.removeAt(p, slot, cnt);
  p.debt -= credit;
  A.play('coin');
  addTrust('bareth', Math.min(5, Math.ceil(credit / 200)));
  tick(name + ' ×' + cnt + ' · deuda −' + credit + ' · quedan ' + p.debt, 'gold');
  if (p.debt <= 0) S.freedom();
  Bus.emit('panel:update', {});
};
S.payDebt = function (n) {
  const p = player();
  if (p.free) { tick('Ya eres libre.', 'good'); return; }
  n = Math.min(n | 0, p.gold, p.debt);
  if (n <= 0) { toast('No tienes oro para pagar.', 'bad'); return; }
  p.gold -= n; p.debt -= n;
  A.play('coin');
  addTrust('bareth', Math.min(5, Math.ceil(n / 200)));
  tick('Has pagado ' + n + ' · quedan ' + p.debt + ' de deuda', 'gold');
  if (p.debt <= 0) S.freedom();
  Bus.emit('panel:update', {});
};
S.freedom = function () {
  const p = player();
  p.free = true; p.debt = 0;
  addTrust('bareth', 20);
  A.play('freedom');
  Bus.emit('banner', { title: '¡CADENA ROTA!', sub: 'Ahora eres libre en Vhalor.' });
  fx('legend', p.t.x, p.t.y);
  toast('Bareth rompe tu collar. Ya puedes comprar tierras y abrir cuenta.', 'gold');
  S.flags.free = true;
  S.save(true);
};

/* ==========================================================
9 · NIVEL, HABILIDADES Y SABERES
========================================================== */
S.skillsView = function () {
  const p = P();
  const lv = p.lvl.level;
  const cur = B.LEVEL_XP[lv - 1] || 0;
  const nxt = B.LEVEL_XP[Math.min(B.LEVEL_XP.length - 1, lv)] || cur + 1;
  const pct = lv >= B.LEVEL_XP.length ? 100 : U.clamp((p.lvl.xp - cur) / Math.max(1, nxt - cur), 0, 1) * 100;
  const branches = D.SKILLS.map(function (sk) {
    const n = p.lvl.alloc[sk.id] || 0;
    let nextUnlock = null;
    for (let k = n + 1; k <= sk.max; k++) if (sk.unlocks[k]) { nextUnlock = { at: k, text: sk.unlocks[k] }; break; }
    const gained = [];
    for (const key in sk.per) gained.push({ key: key, total: +(sk.per[key] * n).toFixed(3), per: sk.per[key] });
    return { id: sk.id, name: sk.name, glyph: sk.glyph, desc: sk.desc, unit: sk.unit,
      value: n, max: sk.max, gained: gained, next: nextUnlock,
      canUp: p.lvl.points > 0 && n < sk.max };
  });
  const trades = E.TRADES.map(function (t) {
    const tlv = E.levelOf(p, t);
    const tbl = B.TRADE_TABLE;
    const c0 = tbl[tlv] || 0, c1 = tbl[Math.min(tbl.length - 1, tlv + 1)] || c0 + 1;
    return { id: t, name: E.skillName(t), level: tlv,
      pct: tlv >= tbl.length - 1 ? 100 : U.clamp((p.xp[t].xp - c0) / Math.max(1, c1 - c0), 0, 1) * 100 };
  });
  return {
    level: lv, points: p.lvl.points, xp: Math.round(p.lvl.xp),
    nextXp: nxt, pct: pct, branches: branches, trades: trades,
    maxLevel: B.LEVEL_XP.length, respecCost: 25 * lv,
    rp: p.lvl.rp || 0, tier: E.playerTier ? E.playerTier(p) : 1
  };
};
S.alloc = function (skillId) {
  const r = E.allocPoint(player(), skillId);
  if (r.ok) tick(r.msg, 'good'); else toast(r.msg, 'bad');
  Bus.emit('panel:update', {});
  return r;
};
S.respec = function () {
  const p = player();
  const cost = 25 * p.lvl.level;
  if (p.gold < cost) { toast('Reiniciar el reparto cuesta ' + cost + ' oro.', 'bad'); A.play('error'); return; }
  p.gold -= cost;
  const r = E.respec(p);
  toast(r.msg + ' (−' + cost + ' oro)', 'good');
  Bus.emit('panel:update', {});
};
function saberKnown(p, id) { p.lvl.sabers = p.lvl.sabers || {}; return !!p.lvl.sabers[id]; }
function recipeOk(p, r) {
  const base = E.recipeUnlocked ? E.recipeUnlocked(p, r) : { ok: true, why: '' };
  if (!base.ok) return base;
  if (r.saber && r.station !== 'hand' && !saberKnown(p, r.saber))
    return { ok: false, why: 'saber', saber: r.saber, tier: base.tier };
  return { ok: true, why: '' };
}
S.recipeOk = recipeOk;
S.sabersView = function () {
  const p = P();
  const tier = E.playerTier ? E.playerTier(p) : 1;
  const list = (D.SABERS || []).map(function (sb) {
    let total = 0, inTier = 0;
    const samples = [];
    for (let i = 0; i < D.RECIPES.length; i++) {
      const r = D.RECIPES[i];
      if (r.saber !== sb.id) continue;
      total++;
      const rt = E.recipeTier ? E.recipeTier(r) : 1;
      if (rt <= tier) { inTier++; if (samples.length < 5 && D.ITEMS[r.out.id]) samples.push(D.ITEMS[r.out.id].name); }
    }
    return {
      id: sb.id, name: sb.name, glyph: sb.glyph, desc: sb.desc, tier: sb.tier,
      learned: saberKnown(p, sb.id), tierOk: tier >= sb.tier,
      recipes: total, inTier: inTier, samples: samples
    };
  });
  return {
    list: list, points: p.lvl.rp || 0, tier: tier, level: p.lvl.level,
    bounds: B.TIER_BOUNDS || [10, 30, 40],
    learnedCount: Object.keys(p.lvl.sabers || {}).length
  };
};
S.learnSaber = function (id) {
  const p = P();
  const sb = D.SABER_BY_ID ? D.SABER_BY_ID[id] : null;
  if (!sb) return { ok: false, msg: 'Saber desconocido.' };
  if (saberKnown(p, id)) return { ok: false, msg: 'Ya conoces ' + sb.name + '.' };
  const tier = E.playerTier ? E.playerTier(p) : 1;
  const bounds = B.TIER_BOUNDS || [10, 30, 40];
  if (tier < sb.tier)
    return { ok: false, msg: sb.name + ' es de Tier ' + sb.tier + ' (nivel ' + (sb.tier === 2 ? bounds[0] + 1 : bounds[1] + 1) + '+).' };
  if ((p.lvl.rp || 0) <= 0) return { ok: false, msg: 'Sin puntos de receta: sube de nivel.' };
  p.lvl.rp--;
  p.lvl.sabers[id] = 1;
  A.play('levelup');
  fx('legend', p.t.x, p.t.y);
  toast('Has aprendido ' + sb.name + '. Sus recetas de tu Tier ya están disponibles.', 'gold');
  Bus.emit('saber', { id: id, name: sb.name });
  Bus.emit('panel:update', {});
  return { ok: true, msg: sb.name + ' aprendido.' };
};
S.tameGuideView = function () {
  return {
    rows: D.TAME_GUIDE || [],
    tiers: D.TAME_GUIDE_SUMMARY || [],
    methods: D.TAME_METHODS || {},
    sedateHp: Math.round((B.TAME_SEDATE_HP || 0.6) * 100),
    sedateTime: B.TAME_SEDATE_TIME || 42,
    maxComp: B.TAME_MAX_COMPANIONS || 2,
    maxCompSkill: B.TAME_MAX_WITH_SKILL || 4
  };
};

/* ==========================================================
10 · CRAFTEO
========================================================== */
function fuelCost(r, p) {
  if (!r.fuel) return 0;
  const red = 1 + E.skillVal(p, 'fuel');
  return Math.max(0, Math.ceil(r.fuel * U.clamp(red, 0.4, 1)));
}
function craftQuality(p, out) {
  if (!out || out.stack <= 1) return 0;
  const cats = ['food', 'crop', 'feed', 'fert', 'potion', 'heal', 'ammo', 'product'];
  if (cats.indexOf(out.cat) < 0) return 0;
  const q = E.skillVal(p, 'craftQ') + E.levelOf(p, 'crafting') * 0.02;
  const roll = lootRng().next();
  if (roll < q * 0.25) return 2;
  if (roll < q) return 1;
  return 0;
}
function publicInfoNear(p, station) {
  if (typeof W.publicInfo !== 'function') return null;
  return W.publicInfo(station, p.t.x, p.t.y, B.CRAFT_RADIUS);
}
function tagName(t) {
  return { fish: 'Pescado', meat: 'Carne', grain: 'Grano', vegetable: 'Hortaliza', fruit: 'Fruta', fuel: 'Combustible', herbany: 'Hierba' }[t] || t;
}
S.craftView = function () {
  const p = P();
  const stations = W.stationsNear(p.t.x, p.t.y, B.CRAFT_RADIUS);
  const fuelHave = E.Inv.fuel(p);
  const src = {};
  for (let i = 0; i < D.STATIONS.length; i++) {
    const s = D.STATIONS[i];
    src[s] = W.stationSource ? W.stationSource(s, p.t.x, p.t.y, B.CRAFT_RADIUS) : (stations[s] ? 'own' : null);
  }
  const tier = E.playerTier ? E.playerTier(p) : 1;
  const list = [];
  for (let k = 0; k < D.RECIPES.length; k++) {
    const r = D.RECIPES[k];
    const out = D.ITEMS[r.out.id];
    if (!out) continue;
    const stationOk = !!stations[r.station];
    const source = src[r.station] || null;
    const isPublic = source === 'public';
    const pub = isPublic ? publicInfoNear(p, r.station) : null;
    const cdLeft = isPublic ? (S.publicCd[r.station] || 0) : 0;
    const cdOk = !isPublic || cdLeft <= 0;
    const reqOk = D.meetsReq(r.req, p.lvl.level, p.lvl.alloc);
    const unlock = recipeOk(p, r);
    const fuelPlus = isPublic && pub ? (pub.fuelPlus || 0) : 0;
    const need = fuelCost(r, p) + fuelPlus;
    const fuelOk = fuelHave >= need;
    let have = true;
    const ing = r.in.map(function (i) {
      const n = i.n;
      const has = i.id ? E.Inv.count(p, i.id) : E.Inv.countTag(p, i.tag);
      if (has < n) have = false;
      return { id: i.id || null, tag: i.tag || null, name: i.id ? (D.ITEMS[i.id] ? D.ITEMS[i.id].name : i.id) : tagName(i.tag), need: n, has: has };
    });
    const fee = (stationOk && source === 'merchant') ? W.stationFee(r.station, p.t.x, p.t.y, B.CRAFT_RADIUS) : 0;
    const feeGold = fee > 0 ? Math.ceil(out.value * r.out.n * fee) : 0;
    const goldOk = p.gold >= feeGold;
    const rt = E.recipeTier ? E.recipeTier(r) : 1;
    list.push({
      id: r.id, outId: r.out.id, name: out.name, n: r.out.n, cat: out.cat,
      station: r.station, stationName: stationName(r.station), stationOk: stationOk,
      source: source, public: isPublic, pubName: pub ? pub.name : null,
      cdLeft: Math.ceil(cdLeft), cdOk: cdOk,
      reqOk: reqOk, reqText: D.reqText(r.req),
      tier: rt, tierOk: rt <= tier,
      saber: r.saber || null,
      saberName: r.saber && D.SABER_BY_ID && D.SABER_BY_ID[r.saber] ? D.SABER_BY_ID[r.saber].name : null,
      saberOk: !r.saber || r.station === 'hand' || saberKnown(p, r.saber),
      unlockWhy: unlock.ok ? '' : unlock.why,
      fuel: need, fuelOk: fuelOk, fee: feeGold, goldOk: goldOk,
      ing: ing, desc: out.desc, sellers: D.sellersOf ? D.sellersOf(r.out.id) : [],
      can: have && stationOk && reqOk && fuelOk && goldOk && cdOk && unlock.ok && canFit(r.out.id, r.out.n)
    });
  }
  return {
    stations: stations, src: src, list: list, fuel: fuelHave,
    level: p.lvl.level, points: p.lvl.points, rp: p.lvl.rp || 0, tier: tier,
    publics: (W.publicList ? W.publicList() : []), cd: S.publicCd
  };
};
S.craft = function (recipeId) {
  const p = P();
  let r = null;
  for (let i = 0; i < D.RECIPES.length; i++) if (D.RECIPES[i].id === recipeId) { r = D.RECIPES[i]; break; }
  if (!r) return;
  const out = D.ITEMS[r.out.id];
  const stations = W.stationsNear(p.t.x, p.t.y, B.CRAFT_RADIUS);
  if (!stations[r.station]) { toast('Necesitas: ' + stationName(r.station) + '.', 'bad'); A.play('error'); return; }
  const source = W.stationSource ? W.stationSource(r.station, p.t.x, p.t.y, B.CRAFT_RADIUS) : 'own';
  const isPublic = source === 'public';
  const pub = isPublic ? publicInfoNear(p, r.station) : null;
  if (isPublic && (S.publicCd[r.station] || 0) > 0) {
    toast('El ' + (pub ? pub.name : 'taller público') + ' aún se enfría: ' + Math.ceil(S.publicCd[r.station]) + ' s.', 'bad');
    A.play('error'); return;
  }
  if (!D.meetsReq(r.req, p.lvl.level, p.lvl.alloc)) { toast('Requiere ' + D.reqText(r.req) + '.', 'bad'); A.play('error'); return; }
  const unlock = recipeOk(p, r);
  if (!unlock.ok) {
    if (unlock.why === 'tier') toast('Receta de Tier ' + unlock.tier + ': sube de nivel para fabricarla.', 'bad');
    else if (unlock.why === 'saber') toast('Aprende el saber «' + (D.SABER_BY_ID[r.saber] ? D.SABER_BY_ID[r.saber].name : r.saber) + '» en el Recetario (J).', 'bad');
    else toast('Receta no aprendida todavía.', 'bad');
    A.play('error'); return;
  }
  const fuelPlus = isPublic && pub ? (pub.fuelPlus || 0) : 0;
  const need = fuelCost(r, p) + fuelPlus;
  if (need > 0 && E.Inv.fuel(p) < need) {
    toast('Falta combustible: ' + need + ' unidades (madera 1, carbón 4, carbón vegetal 6).', 'bad');
    A.play('error'); return;
  }
  for (let i = 0; i < r.in.length; i++) {
    const ing = r.in[i];
    const has = ing.id ? E.Inv.count(p, ing.id) : E.Inv.countTag(p, ing.tag);
    if (has < ing.n) { toast('Faltan materiales.', 'bad'); A.play('error'); return; }
  }
  const fee = source === 'merchant' ? W.stationFee(r.station, p.t.x, p.t.y, B.CRAFT_RADIUS) : 0;
  const feeGold = fee > 0 ? Math.ceil(out.value * r.out.n * fee) : 0;
  if (feeGold > p.gold) { toast('El taller del mercader cobra ' + feeGold + ' oro.', 'bad'); A.play('error'); return; }
  if (!canFit(r.out.id, r.out.n)) { toast('Inventario lleno.', 'bad'); A.play('error'); return; }
  for (let i = 0; i < r.in.length; i++) {
    const ing = r.in[i];
    if (ing.id) E.Inv.remove(p, ing.id, ing.n); else E.Inv.removeTag(p, ing.tag, ing.n);
  }
  if (need > 0) E.Inv.burnFuel(p, need);
  if (feeGold > 0) p.gold -= feeGold;
  if (isPublic && pub) S.publicCd[r.station] = pub.cd || B.PUBLIC_CRAFT_CD || 6;
  let n = r.out.n;
  if (out.stack > 1 && !isPublic) {
    const bonus = E.skillVal(p, 'yield') + E.levelOf(p, 'crafting') * B.TRADE_BONUS;
    if (lootRng().chance(U.clamp(bonus, 0, 0.8))) n += 1;
  }
  const q = isPublic ? 0 : craftQuality(p, out);
  E.Inv.add(p, r.out.id, n, q);
  E.autoAmmo(p);
  A.play(r.station === 'forge' ? 'pick' : 'craft');
  fx('spark', p.t.x, p.t.y);
  const trade = r.skill || (out.cat === 'food' ? 'cooking' : (out.weapon || out.shield || out.ammo ? 'combat' : 'crafting'));
  E.addXP(p, trade, r.xp || B.XP_CRAFT);
  tick('Fabricado: ' + out.name + ' ×' + n + (q ? ' · calidad ' + (q + 1) : (isPublic ? ' · público' : '')) + (feeGold ? ' · taller ' + feeGold + ' oro' : ''), 'good');
  Bus.emit('crafted', { id: r.out.id, n: n, station: r.station, public: isPublic });
  Bus.emit('panel:update', {});
};
S.stationsView = function (npcId) {
  const p = P();
  const key = D.MERCHANT_STATIONS[npcId] ? npcId : (D.NPCS[npcId] && D.NPCS[npcId].hunter ? 'hunter' : null);
  const ms = key ? D.MERCHANT_STATIONS[key] : null;
  const list = [];
  if (ms) for (let i = 0; i < ms.stations.length; i++) {
    const s = ms.stations[i], info = D.STATION_INFO[s];
    list.push({ id: s, name: info.name, glyph: info.glyph, desc: info.desc, fuel: info.fuel,
      reqText: D.reqText(info.req), reqOk: D.meetsReq(info.req, p.lvl.level, p.lvl.alloc) });
  }
  return { npcId: npcId, name: D.NPCS[npcId] ? D.NPCS[npcId].name : 'Mercader', fee: ms ? ms.fee : 0,
    list: list, gold: p.gold, publics: (W.publicList ? W.publicList() : []), cd: S.publicCd };
};
/* ==========================================================
11 · AGRICULTURA
========================================================== */
function wearToolSafe(p, n) {
  if (E.wearTool) { E.wearTool(p, n); return; }
  const s = p.equip.tool;
  if (!s || s.dur === undefined) return;
  s.dur = Math.max(0, s.dur - (n || 1));
  if (s.dur === 0) {
    const def = D.ITEMS[s.id];
    toast((def ? def.name : 'Herramienta') + ' se ha roto. Repárala desde el inventario.', 'bad');
    A.play('error');
    E.recalc(p);
  }
}
function brokenOf(s) {
  if (E.isBroken) return E.isBroken(s);
  return !!(s && s.dur !== undefined && s.dur <= 0);
}
function repairInfoSafe(p, ref) {
  if (E.repairInfo) return E.repairInfo(p, ref);
  const s = typeof ref === 'number' ? p.inv[ref] : p.equip[ref];
  if (!s || s.dur === undefined) return null;
  const def = D.ITEMS[s.id];
  if (!def) return null;
  const max = maxDurOf(def);
  const cost = def.repair || { wood: 1, fiber: 1 };
  const missing = [];
  for (const k in cost) if (E.Inv.count(p, k) < cost[k]) missing.push(k);
  return { id: s.id, name: def.name, broken: s.dur <= 0, dur: s.dur, max: max,
    cost: cost, can: missing.length === 0, missing: missing };
}

S.farmView = function (x, y) {
  const p = player();
  const soil = W.soilAt(x, y);
  const canTill = W.canTill(x, y);
  const parcel = W.parcelAt(x, y);
  const farm = W.farmAt(x, y);
  const owned = (parcel && parcel.owner === 'player') || (farm && farm.owner === 'player');
  const actions = [];
  if (canTill && owned) actions.push({ act: 'till', label: 'Arar tierra' });
  if (soil && !soil.crop && owned) {
    const seeds = [], ferts = [];
    for (let i = 0; i < p.inv.length; i++) {
      const s = p.inv[i];
      if (!s) continue;
      const def = D.ITEMS[s.id];
      if (!def) continue;
      if (def.seed) seeds.push({ id: s.id, name: def.name, crop: def.seed.crop, n: s.n });
      if (def.fert) ferts.push({ id: s.id, name: def.name, n: s.n });
    }
    actions.push({ act: 'plant', label: 'Sembrar', seeds: seeds });
    actions.push({ act: 'fert', label: 'Fertilizar', ferts: ferts });
  }
  if (soil && soil.crop && soil.growth < 1) actions.push({ act: 'water', label: 'Regar' });
  if (soil && soil.crop && soil.growth >= 1) actions.push({ act: 'harvest', label: 'Cosechar' + (farm && farm.owner !== 'player' ? ' (ajeno)' : '') });
  return {
    x: x, y: y, soil: soil, canTill: canTill, owned: owned,
    owner: farm ? farm.owner : (parcel ? parcel.owner : null),
    actions: actions, help: S.help
  };
};
S.farmAct = function (x, y, act, param) {
  const p = player();
  const idx = W.idx(x, y);
  const soil = W.soilAt(x, y);
  const farm = W.farmAt(x, y);
  const parcel = W.parcelAt(x, y);
  const owned = (parcel && parcel.owner === 'player');
  if (act === 'till') {
    if (!owned) { toast('Solo puedes arar en tus parcelas.', 'bad'); return; }
    const ti = E.toolInfo(p);
    if (!ti || ti.kind !== 'hoe') { toast('Equipa una azada (o repárala si está rota).', 'bad'); A.play('error'); return; }
    if (!W.canTill(x, y)) { toast('No se puede arar aquí.', 'bad'); return; }
    if (p.st.st < 4) { toast('Sin stamina.', 'bad'); return; }
    p.st.st -= 4;
    W.setSoil(idx, { crop: null, growth: 0, watered: false, fert: null, q: 0, owner: 'player', day: Time.day });
    E.addXP(p, 'farming', B.XP_TILL);
    wearToolSafe(p, 1);
    A.play('build'); fx('dust', x + 0.5, y + 0.5);
    tick('Tierra arada', 'good');
  } else if (act === 'plant') {
    if (!soil || soil.crop) return;
    if (!owned) { toast('Solo en tus parcelas.', 'bad'); return; }
    const def = D.ITEMS[param];
    if (!def || !def.seed || !E.Inv.remove(p, param, 1)) { toast('No tienes esa semilla.', 'bad'); return; }
    soil.crop = def.seed.crop; soil.growth = 0; soil.day = Time.day;
    A.play('harvest'); fx('leaf', x + 0.5, y + 0.5);
    E.addXP(p, 'farming', 3);
    S.helpProgress('plant', x, y, 1);
    tick('Sembrado: ' + D.CROPS[soil.crop].name, 'good');
  } else if (act === 'fert') {
    if (!soil || soil.crop) return;
    if (!E.Inv.remove(p, param, 1)) { toast('No tienes ese fertilizante.', 'bad'); return; }
    soil.fert = param;
    A.play('harvest'); fx('spark', x + 0.5, y + 0.5);
    tick('Fertilizante aplicado', 'good');
  } else if (act === 'water') {
    if (!soil || !soil.crop) return;
    const ti = E.toolInfo(p);
    const well = nearWell(x, y);
    if (!ti || ti.kind !== 'water') { toast('Equipa una regadera o un odre (o repáralo si está roto).', 'bad'); A.play('error'); return; }
    if (p.st.st < 2) { toast('Sin stamina.', 'bad'); return; }
    p.st.st -= 2;
    soil.watered = true;
    wearToolSafe(p, 1);
    A.play('splash'); fx('water', x + 0.5, y + 0.5);
    E.addXP(p, 'farming', 2);
    S.helpProgress('water', x, y, 1);
    tick('Cultivo regado' + (well ? ' · pozo cercano' : ''), 'good');
  } else if (act === 'harvest') {
    if (!soil || !soil.crop || soil.growth < 1) return;
    const cd = D.CROPS[soil.crop];
    const weights = (soil.fert && D.ITEMS[soil.fert] && D.ITEMS[soil.fert].fert) ? D.ITEMS[soil.fert].fert.q : [88, 10, 2, 0];
    let roll = lootRng().next() * 100, q = 0;
    for (let k = 0; k < weights.length; k++) { roll -= weights[k]; if (roll <= 0) { q = k; break; } }
    const yieldB = E.skillVal(p, 'yield') + E.levelOf(p, 'farming') * B.TRADE_BONUS;
    let n = 1 + (lootRng().chance(0.25 + yieldB) ? 1 : 0);
    const ti = E.toolInfo(p);
    const sickle = ti && ti.kind === 'sickle';
    if (sickle) n += 1;
    const foreign = farm && farm.owner !== 'player';
    if (foreign) {
      S.theft(farm.owner, cd.product, n, q);
    } else {
      if (!canFit(cd.product, n)) { toast('Inventario lleno.', 'bad'); return; }
      E.Inv.add(p, cd.product, n, q);
      E.addXP(p, 'farming', B.XP_HARVEST);
      A.play('harvest');
      floater(x + 0.5, y + 0.2, '+' + n + ' ' + cd.name + ' · calidad ' + (q + 1), '#efe3c8');
      tick('Cosechado: ' + cd.name + ' ×' + n + ' · calidad ' + (q + 1), 'good');
      if (lootRng().chance(0.5 + yieldB)) E.Inv.add(p, cd.seed, 1, 0);
    }
    if (sickle) {
      for (let oy = -1; oy <= 1; oy++) for (let ox = -1; ox <= 1; ox++) {
        if (!ox && !oy) continue;
        const s2 = W.soilAt(x + ox, y + oy);
        if (!s2 || !s2.crop || s2.growth < 1) continue;
        const f2 = W.farmAt(x + ox, y + oy);
        if (f2 && f2.owner !== 'player') continue;
        const c2 = D.CROPS[s2.crop];
        if (!canFit(c2.product, 1)) continue;
        E.Inv.add(p, c2.product, 1, 0);
        s2.crop = null; s2.growth = 0; s2.fert = null; s2.watered = false;
        S.helpProgress('harvest', x + ox, y + oy, 1);
      }
      wearToolSafe(p, 1);
    }
    S.helpProgress('harvest', x, y, 1);
    soil.crop = null; soil.growth = 0; soil.fert = null; soil.watered = false;
  }
  Bus.emit('panel:update', {});
};
function nearWell(x, y) {
  const list = W.playerBuildings();
  for (let i = 0; i < list.length; i++) {
    const b = list[i];
    if (b.key !== 'well') continue;
    if (U.dist2(x, y, b.x + b.w / 2, b.y + b.h / 2) < 36) return b;
  }
  return null;
}

/* ==========================================================
12 · TAREAS DE AYUDA EN GRANJAS VECINAS
========================================================== */
S.helpTaskView = function (npcId) {
  const farm = W.farms.find(function (f) { return f.owner === npcId; });
  const active = S.help && S.help.npcId === npcId ? S.help : null;
  const counts = { water: 0, harvest: 0, plant: 0, feed: 0 };
  if (farm) {
    W.soil.forEach(function (s, idx) {
      const x = idx % C.WORLD, y = (idx / C.WORLD) | 0;
      if (x < farm.x || y < farm.y || x >= farm.x + farm.w || y >= farm.y + farm.h) return;
      if (s.crop && s.growth >= 1) counts.harvest++;
      else if (s.crop && !s.watered) counts.water++;
      else if (!s.crop) counts.plant++;
    });
    for (let i = 0; i < E.list.length; i++) {
      const e = E.list[i];
      if (e.tg.dead || !e.tg.livestock) continue;
      if (e.t.x >= farm.x && e.t.y >= farm.y && e.t.x < farm.x + farm.w && e.t.y < farm.y + farm.h) counts.feed++;
    }
  }
  const kinds = Object.keys(B.HELP_TASKS).map(function (k) {
    const t = B.HELP_TASKS[k];
    return { kind: k, label: t.label, range: t.n, pay: t.pay, trust: t.trust, available: counts[k] };
  });
  return {
    npcId: npcId, name: D.NPCS[npcId] ? D.NPCS[npcId].name : npcId,
    farm: farm, counts: counts, kinds: kinds, active: active,
    used: dailyUsed(npcId, 'help'), day: Time.day, deadline: B.HELP_DEADLINE,
    other: S.help && S.help.npcId !== npcId ? S.help : null
  };
};
S.acceptHelpTask = function (npcId, kind) {
  if (S.help) { toast('Ya tienes una tarea en curso con ' + D.NPCS[S.help.npcId].name + '.', 'bad'); return; }
  if (dailyUsed(npcId, 'help')) { toast('Ya ayudaste a ' + D.NPCS[npcId].name + ' hoy. Vuelve mañana.', ''); return; }
  const farm = W.farms.find(function (f) { return f.owner === npcId; });
  if (!farm) { toast('No tiene parcela que atender.', 'bad'); return; }
  const keys = Object.keys(B.HELP_TASKS);
  let k = kind && B.HELP_TASKS[kind] ? kind : null;
  if (!k) {
    const v = S.helpTaskView(npcId);
    let best = null, bn = -1;
    for (let i = 0; i < v.kinds.length; i++) if (v.kinds[i].available > bn) { bn = v.kinds[i].available; best = v.kinds[i].kind; }
    k = bn > 0 ? best : rng().pick(keys);
  }
  const t = B.HELP_TASKS[k];
  const need = rng().int(t.n[0], t.n[1]);
  S.help = {
    npcId: npcId, kind: k, label: t.label, need: need, done: 0,
    day: Time.day, deadline: Time.day + B.HELP_DEADLINE,
    pay: t.pay * need, trust: t.trust, xp: t.xp
  };
  A.play('quest');
  toast('Tarea: ' + t.label.toLowerCase() + ' ' + need + ' veces en la granja de ' + D.NPCS[npcId].name + ' (antes del día ' + S.help.deadline + ').', 'good');
  Bus.emit('help:accepted', S.help);
  Bus.emit('panel:update', {});
};
S.helpProgress = function (kind, x, y, n) {
  if (!S.help || S.help.kind !== kind) return;
  const farm = W.farms.find(function (f) { return f.owner === S.help.npcId; });
  if (!farm) return;
  if (x < farm.x || y < farm.y || x >= farm.x + farm.w || y >= farm.y + farm.h) return;
  S.help.done = Math.min(S.help.need, S.help.done + (n || 1));
  if (S.help.done >= S.help.need) {
    toast('Tarea completada. Vuelve con ' + D.NPCS[S.help.npcId].name + ' para cobrar.', 'gold');
    A.play('quest');
  }
  Bus.emit('help:progress', S.help);
  Bus.emit('panel:update', {});
};
S.turnInHelpTask = function () {
  if (!S.help) return;
  const p = player();
  if (S.help.done < S.help.need) { toast('Aún faltan ' + (S.help.need - S.help.done) + ' acciones.', 'bad'); return; }
  const h = S.help;
  const bonus = trustOf(h.npcId) >= 60 ? 1.25 : 1;
  const pay = Math.round(h.pay * bonus);
  p.gold += pay;
  addTrust(h.npcId, h.trust);
  E.addXP(p, 'farming', h.xp);
  markDaily(h.npcId, 'help');
  A.play('sell');
  fx('spark', p.t.x, p.t.y);
  toast('Ayuda pagada: +' + pay + ' oro y +' + h.trust + ' confianza.', 'gold');
  S.help = null;
  Bus.emit('help:done', { npcId: h.npcId, pay: pay });
  Bus.emit('panel:update', {});
};
S.cancelHelpTask = function () {
  if (!S.help) return;
  addTrust(S.help.npcId, -3);
  toast('Has abandonado la tarea.', 'bad');
  S.help = null;
  Bus.emit('panel:update', {});
};

/* ==========================================================
13 · CONSTRUCCIÓN Y PARCELAS
========================================================== */
S.buildView = function () {
  const p = player();
  const list = Object.keys(D.BUILDINGS).map(function (k) {
    const bd = D.BUILDINGS[k];
    const reqOk = D.meetsReq(bd.req, p.lvl.level, p.lvl.alloc);
    return { key: k, name: bd.name, desc: bd.desc, cost: bd.cost, size: bd.size,
      afford: hasCost(bd.cost), reqOk: reqOk, reqText: D.reqText(bd.req),
      station: bd.station || null, kind: bd.kind, tier: bd.tier || 0 };
  });
  const owned = W.playerBuildings();
  return {
    list: list,
    owned: owned.map(function (b) {
      const bd = D.BUILDINGS[b.key];
      let nextKey = null;
      for (const k in D.BUILDINGS) if (D.BUILDINGS[k].upgradeFrom === b.key) { nextKey = k; break; }
      return { uid: b.uid, key: b.key, name: bd ? bd.name : b.key, x: b.x, y: b.y, upgradable: !!nextKey };
    }),
    parcels: W.ownedParcels().length, level: p.lvl.level
  };
};
function findBuildSpot(key) {
  const parcels = W.ownedParcels();
  for (let i = 0; i < parcels.length; i++) {
    const pa = parcels[i];
    for (let y = pa.y; y < pa.y + pa.h; y++) for (let x = pa.x; x < pa.x + pa.w; x++) {
      if (W.canPlace(key, x, y, 'player').ok) return { x: x, y: y };
    }
  }
  return null;
}
S.build = function (key) {
  const p = player();
  const bd = D.BUILDINGS[key];
  if (!bd) return;
  if (!W.ownedParcels().length) { toast('Compra una parcela al Mercader Supremo primero.', 'bad'); return; }
  if (!D.meetsReq(bd.req, p.lvl.level, p.lvl.alloc)) { toast('Requiere ' + D.reqText(bd.req) + '.', 'bad'); A.play('error'); return; }
  if (!hasCost(bd.cost)) { toast('Materiales insuficientes: ' + costText(bd.cost), 'bad'); A.play('error'); return; }
  const spot = findBuildSpot(key);
  if (!spot) { toast('No hay espacio libre en tus parcelas.', 'bad'); return; }
  const ti = E.toolInfo(p);
  const disc = ti && ti.kind === 'hammer' ? 0.85 : 1;
  if (disc < 1 && p.st.st < 4) { toast('Sin stamina para construir.', 'bad'); return; }
  if (disc < 1) p.st.st -= 4;
  payCost(bd.cost);
  const res = W.addBuilding(key, spot.x, spot.y, 'player', {});
  if (!res.ok) { refundCost(bd.cost); toast(res.reason, 'bad'); return; }
  A.play('build'); fx('dust', spot.x + 0.5, spot.y + 0.5);
  E.addXP(p, 'crafting', 14);
  E.syncGuardians();
  toast(bd.name + ' construida en (' + spot.x + ',' + spot.y + ').', 'good');
  Bus.emit('built', { key: key, building: res.building });
  Bus.emit('panel:update', {});
};
S.upgrade = function (uid) {
  const p = player();
  const b = W.byUid(uid);
  if (!b) return;
  let nextKey = null;
  for (const k in D.BUILDINGS) if (D.BUILDINGS[k].upgradeFrom === b.key) { nextKey = k; break; }
  if (!nextKey) { toast('No hay mejora disponible.', 'bad'); return; }
  const next = D.BUILDINGS[nextKey];
  if (!D.meetsReq(next.req, p.lvl.level, p.lvl.alloc)) { toast('Requiere ' + D.reqText(next.req) + '.', 'bad'); return; }
  const cost = {};
  for (const id in next.cost) cost[id] = Math.ceil(next.cost[id] * B.UPGRADE_FACTOR);
  if (!hasCost(cost)) { toast('La mejora cuesta: ' + costText(cost), 'bad'); return; }
  const data = b.data, x = b.x, y = b.y, oldKey = b.key;
  W.removeBuilding(uid);
  const chk = W.canPlace(nextKey, x, y, 'player');
  if (!chk.ok) { W.addBuilding(oldKey, x, y, 'player', data); toast('No hay espacio para ampliar: ' + chk.reason, 'bad'); return; }
  payCost(cost);
  const res = W.addBuilding(nextKey, x, y, 'player', data);
  if (!res.ok) { refundCost(cost); W.addBuilding(oldKey, x, y, 'player', data); toast(res.reason, 'bad'); return; }
  A.play('build');
  E.addXP(p, 'crafting', 22);
  toast('¡Hogar mejorado a ' + next.name + '!', 'gold');
  Bus.emit('banner', { title: next.name, sub: 'Tu hogar crece.' });
  Bus.emit('panel:update', {});
};
S.buildingInteract = function (b) {
  if (!b) return;
  if (b.city && b.data && b.data.public) { openPanel('craft', {}); return; }
  if (b.key === 'land_office') { S.startDialog('supremo'); return; }
  if (b.key === 'inn') { openPanel('bed', {}); return; }
  if (b.city && b.data && b.data.vendor) {
    const nd = D.NPCS[b.data.vendor];
    if (nd && nd.shop) { openPanel('shop', { npcId: b.data.vendor }); return; }
  }
  if (b.key === 'stall') { openPanel('shop', { stall: true }); return; }
  if (b.owner !== 'player') {
    if (b.key === 'pen') tick('Aquí te encerraron al llegar a Vhalor.', '');
    else tick(b.info ? b.info.name : 'Edificio', '');
    return;
  }
  const bd = D.BUILDINGS[b.key];
  if (!bd) return;
  const fn = bd.functions || [];
  if (fn.indexOf('sleep') >= 0 && bd.house) { openPanel('house', { uid: b.uid }); return; }
  if (fn.indexOf('sleep') >= 0) { S.sleep('bed'); return; }
  if (fn.indexOf('chest') >= 0 && !bd.house) { openPanel('chest', { uid: b.uid }); return; }
  if (fn.indexOf('livestock') >= 0 || fn.indexOf('mounts') >= 0) { openPanel('animals', { uid: b.uid }); return; }
  let hasStation = false;
  for (let i = 0; i < fn.length; i++) if (D.STATIONS.indexOf(fn[i]) >= 0) { hasStation = true; break; }
  if (hasStation) { openPanel('craft', {}); return; }
  tick(bd.name + ': ' + bd.desc, '');
};
S.parcelView = function () {
  const p = player();
  const list = W.parcels.map(function (pa) {
    return { id: pa.id, x: pa.x, y: pa.y, w: pa.w, h: pa.h, cls: pa.cls, owner: pa.owner,
      price: pa.owner ? 0 : W.parcelPrice(pa), mine: pa.owner === 'player',
      tiles: pa.w * pa.h };
  });
  return {
    gold: p.gold, price: W.nextParcelPrice(), title: W.title(), list: list, free: p.free,
    deeds: E.Inv.count(p, 'land_deed'), deedCost: B.LAND_DEED_COST,
    owned: W.ownedParcels().length, total: W.parcels.length,
    nextTitle: nextTitleInfo()
  };
};
function nextTitleInfo() {
  const n = W.ownedParcels().length;
  const t = B.TITLES.slice().sort(function (a, b) { return a.n - b.n; });
  for (let i = 0; i < t.length; i++) if (t[i].n > n) return { name: t[i].name, need: t[i].n - n, at: t[i].n };
  return null;
}
S.buyParcel = function (id) {
  const p = player();
  if (!p.free) { toast('Los esclavos no pueden firmar escrituras.', 'bad'); return; }
  const pa = W.parcels.find(function (x) { return x.id === id; });
  if (!pa || pa.owner) { toast('Parcela no disponible.', 'bad'); return; }
  if (E.Inv.count(p, 'land_deed') < 1) { toast('Necesitas una escritura de tierras (la emite el Supremo).', 'bad'); A.play('error'); return; }
  const price = W.parcelPrice(pa);
  if (p.gold < price) { toast('Cuesta ' + price + ' oro.', 'bad'); A.play('error'); return; }
  E.Inv.remove(p, 'land_deed', 1);
  p.gold -= price;
  W.buyParcel(id);
  A.play('buy');
  addTrust('supremo', 3);
  E.addXP(p, 'crafting', 20);
  const t = W.title();
  toast('¡Parcela comprada! Título: ' + t.name, 'gold');
  Bus.emit('banner', { title: t.name, sub: 'Posees ' + W.ownedParcels().length + ' de ' + W.parcels.length + ' parcelas.' });
  S.slaveStock = Math.max(S.slaveStock, t.slaves);
  Bus.emit('panel:update', {});
};

/* ==========================================================
14 · TRABAJADORES
========================================================== */
S.slaveView = function () {
  const p = player();
  const t = W.title();
  const workers = [];
  for (let i = 0; i < E.list.length; i++) {
    const e = E.list[i];
    if (e.type === 'worker' && !e.tg.child && !e.tg.dead) {
      workers.push({ uid: e.id, name: e.name, role: e.tg.role,
        morale: S.workerMorale[e.id] === undefined ? 70 : S.workerMorale[e.id] });
    }
  }
  return { gold: p.gold, stock: S.slaveStock, title: t, cost: B.SLAVE_COST,
    workers: workers, roles: D.ROLES, free: p.free, max: t.slaves };
};
S.buySlave = function () {
  const p = player();
  if (!p.free) { toast('Aún eres esclavo.', 'bad'); return; }
  if (S.slaveStock <= 0) { toast('No quedan trabajadores este mes.', 'bad'); return; }
  const t = W.title();
  let count = 0;
  for (let i = 0; i < E.list.length; i++) if (E.list[i].type === 'worker' && !E.list[i].tg.child && !E.list[i].tg.dead) count++;
  if (count >= t.slaves) { toast('Tu título (' + t.name + ') solo permite ' + t.slaves + ' trabajadores. Compra más tierras.', 'bad'); return; }
  if (p.gold < B.SLAVE_COST) { toast('Cuesta ' + B.SLAVE_COST + ' oro.', 'bad'); return; }
  const house = W.bestHouse();
  if (!house) { toast('Necesitas una casa donde alojarlos.', 'bad'); return; }
  p.gold -= B.SLAVE_COST;
  S.slaveStock--;
  const gender = rng().chance(0.5) ? 'm' : 'f';
  const name = rng().pick(D.NAMES[gender === 'f' ? 'female' : 'male']);
  const door = W.doorOf(house);
  const e = E.spawnWorker({ name: name, gender: gender, x: door.x + 0.5, y: door.y + 0.5, role: 'idle' });
  if (e) { S.workerMorale[e.id] = 70; toast(name + ' se une a tu household.', 'good'); A.play('buy'); }
  Bus.emit('panel:update', {});
};
S.setRole = function (uid, role) {
  const e = E.byId.get(uid);
  if (!e || e.type !== 'worker') return;
  if (e.tg.child && (e.tg.stage === 'baby' || e.tg.stage === 'child')) { toast('Aún es demasiado pequeño.', 'bad'); return; }
  e.tg.role = role;
  e.ai.state = role === 'idle' ? 'wander' : (role === 'follow' || role === 'guard' ? 'guard' : 'work');
  e.ai.path = null;
  const rd = D.ROLES.find(function (r) { return r.id === role; });
  tick(e.name + ' → ' + (rd ? rd.name : role), 'good');
  Bus.emit('panel:update', {});
};
S.dismiss = function (uid) {
  const e = E.byId.get(uid);
  if (!e || e.type !== 'worker' || e.tg.child) return;
  e.tg.dead = true;
  tick(e.name + ' ha sido liberado de tu servicio.', '');
  Bus.emit('panel:update', {});
};
S.onWork = function (d) {
  const p = player();
  const w = d.worker;
  if (!w || w.tg.dead) return;
  const morale = S.workerMorale[w.id] === undefined ? 70 : S.workerMorale[w.id];
  if (morale < 20 && rng().chance(0.3)) return;
  const rate = B.SLAVE_WORK_RATE;
  if (d.action === 'harvest') {
    const soil = W.soilAt(d.x, d.y);
    if (!soil || !soil.crop || soil.growth < 1 || (soil.owner && soil.owner !== 'player')) return;
    if (!rng().chance(rate)) return;
    const cd = D.CROPS[soil.crop];
    const weights = (soil.fert && D.ITEMS[soil.fert] && D.ITEMS[soil.fert].fert) ? D.ITEMS[soil.fert].fert.q : [88, 10, 2, 0];
    let roll = lootRng().next() * 100, q = 0;
    for (let k = 0; k < weights.length; k++) { roll -= weights[k]; if (roll <= 0) { q = k; break; } }
    if (canFit(cd.product, 1)) {
      E.Inv.add(p, cd.product, 1, q);
      soil.crop = null; soil.growth = 0; soil.fert = null; soil.watered = false;
      A.playAt('harvest', d.x, d.y, p.t.x, p.t.y);
    }
  } else if (d.action === 'water') {
    const soil = W.soilAt(d.x, d.y);
    if (!soil || !soil.crop || soil.watered) return;
    soil.watered = true;
    A.playAt('splash', d.x, d.y, p.t.x, p.t.y);
    fx('water', d.x + 0.5, d.y + 0.5);
  } else if (d.action === 'plant') {
    const soil = W.soilAt(d.x, d.y);
    if (!soil || soil.crop) return;
    for (let i = 0; i < p.inv.length; i++) {
      const s = p.inv[i];
      if (s && D.ITEMS[s.id] && D.ITEMS[s.id].seed) {
        E.Inv.removeAt(p, i, 1);
        soil.crop = D.ITEMS[s.id].seed.crop; soil.growth = 0; soil.day = Time.day;
        break;
      }
    }
  } else if (d.action === 'collect') {
    const a = d.animal;
    if (a && a.tg.ready && canFit(a.tg.ready.id, a.tg.ready.n)) {
      E.Inv.add(p, a.tg.ready.id, a.tg.ready.n, a.tg.ready.q);
      if (a.tg.ready2) E.Inv.add(p, a.tg.ready2.id, a.tg.ready2.n, 0);
      a.tg.ready = null; a.tg.ready2 = null;
      A.playAt('harvest', a.t.x, a.t.y, p.t.x, p.t.y);
    }
  } else if (d.action === 'feed') {
    const a = d.animal;
    if (!a) return;
    const foods = ['feed_herb', 'feed_golden', 'feed_good', 'feed_basic', 'hay'];
    for (let i = 0; i < foods.length; i++) {
      if (E.Inv.remove(p, foods[i], 1)) {
        a.tg.fed = Math.min(3, a.tg.fed + 1);
        const fd = D.ITEMS[foods[i]];
        a.tg.feedQ = fd.feed ? fd.feed.q : [90, 10, 0, 0];
        if (fd.feed && fd.feed.heal) a.st.hp = Math.min(a.st.maxHp, a.st.hp + fd.feed.heal);
        break;
      }
    }
  }
};

/* ==========================================================
15 · FAMILIA
========================================================== */
S.familyView = function () {
  const p = player();
  const house = W.bestHouse();
  const cap = house ? (D.BUILDINGS[house.key].childCap || 0) : 0;
  const children = S.family.children.map(function (c) {
    const e = E.byId.get(c.uid);
    return { uid: c.uid, name: c.name, gender: c.gender,
      stage: e ? e.tg.stage : c.stage, role: e ? e.tg.role : 'idle',
      alive: !!e && !e.tg.dead };
  });
  const spouse = S.family.spouse ? { id: S.family.spouse, name: D.NPCS[S.family.spouse].name, trust: trustOf(S.family.spouse) } : null;
  const candidates = Object.keys(D.NPCS).filter(function (id) {
    const nd = D.NPCS[id];
    return nd.romance && nd.gender !== p.gender;
  }).map(function (id) {
    return { id: id, name: D.NPCS[id].name, trust: trustOf(id), rel: S.rel[id] || 'none' };
  });
  return { spouse: spouse, children: children, cap: cap, pregnantDay: S.family.pregnantDay,
    day: Time.day, candidates: candidates, roles: D.ROLES,
    house: house ? D.BUILDINGS[house.key].name : null,
    rings: E.Inv.count(p, 'ring_gold') };
};
S.propose = function (npcId) {
  const p = player();
  const nd = D.NPCS[npcId];
  if (!nd || !nd.romance || nd.gender === p.gender) { toast('No es un candidato válido.', 'bad'); return; }
  if (!p.free) { toast('Debes ser libre para casarte.', 'bad'); return; }
  if ((S.rel[npcId] || 'none') !== 'dating') { toast('Necesitas una relación previa.', 'bad'); return; }
  if (trustOf(npcId) < B.MARRY_TRUST) { toast('Necesita confianza ≥ ' + B.MARRY_TRUST + '.', 'bad'); return; }
  if (E.Inv.count(p, 'ring_gold') < B.RINGS_NEEDED) { toast('Necesitas ' + B.RINGS_NEEDED + ' anillos de oro.', 'bad'); return; }
  const house = W.bestHouse();
  if (!house || (D.BUILDINGS[house.key].beds || 0) < 2) { toast('Necesitas una casa con al menos 2 camas.', 'bad'); return; }
  E.Inv.remove(p, 'ring_gold', B.RINGS_NEEDED);
  S.rel[npcId] = 'engaged';
  addTrust(npcId, 10);
  A.play('quest');
  toast('¡' + nd.name + ' ha aceptado! Habla con Maera para la boda.', 'gold');
  Bus.emit('banner', { title: 'Prometidos', sub: nd.name + ' y tú.' });
  Bus.emit('panel:update', {});
};
S.wedding = function () {
  const p = player();
  let engaged = null;
  for (const id in S.rel) if (S.rel[id] === 'engaged') { engaged = id; break; }
  if (!engaged) { toast('No estás prometido con nadie.', 'bad'); return; }
  if (trustOf('maera') <= -60) { toast('Maera se niega a casaros.', 'bad'); return; }
  if (p.gold < B.WEDDING_COST) { toast('La ceremonia cuesta ' + B.WEDDING_COST + ' oro.', 'bad'); return; }
  p.gold -= B.WEDDING_COST;
  S.rel[engaged] = 'married';
  S.family.spouse = engaged;
  addTrust(engaged, 15); addTrust('maera', 8);
  const house = W.bestHouse();
  if (house) {
    const door = W.doorOf(house);
    for (let i = 0; i < E.list.length; i++) {
      const e = E.list[i];
      if (e.type === 'npc' && e.npcId === engaged) {
        e.ai.home.x = door.x + 0.5; e.ai.home.y = door.y + 0.5;
        e.t.x = door.x + 0.5; e.t.y = door.y + 0.5;
        e.t.px = e.t.x; e.t.py = e.t.y;
      }
    }
  }
  A.play('freedom'); A.play('bell');
  Bus.emit('banner', { title: '¡Boda!', sub: 'Tú y ' + D.NPCS[engaged].name + ', unidos ante el Alba.' });
  fx('legend', p.t.x, p.t.y);
  toast('¡Que el Alba bendiga vuestra unión!', 'gold');
  S.save(true);
  Bus.emit('panel:update', {});
};
S.birthChild = function () {
  S.family.pregnantDay = 0;
  const house = W.bestHouse();
  if (!house) return;
  const cap = D.BUILDINGS[house.key].childCap || 0;
  if (S.family.children.length >= cap) return;
  const gender = rng().chance(0.5) ? 'm' : 'f';
  const name = rng().pick(D.NAMES[gender === 'f' ? 'female' : 'male']);
  const door = W.doorOf(house);
  const e = E.spawnWorker({ name: name, gender: gender, x: door.x + 0.5, y: door.y + 1.2,
    role: 'idle', child: true, stage: 'baby', growDay: Time.day + B.CHILD_DAYS[0] });
  if (!e) return;
  S.family.children.push({ uid: e.id, name: name, gender: gender, stage: 'baby', born: Time.day });
  A.play('baby');
  Bus.emit('banner', { title: '¡Ha nacido ' + name + '!', sub: 'Tu familia crece en Vhalor.' });
  toast('¡Ha nacido ' + name + '!', 'gold');
};
S.growChildren = function () {
  for (let i = 0; i < S.family.children.length; i++) {
    const c = S.family.children[i];
    const e = E.byId.get(c.uid);
    if (!e || e.tg.dead) continue;
    const age = Time.day - c.born;
    let stage = 'baby', scale = 0.4;
    if (age >= B.CHILD_DAYS[0] + B.CHILD_DAYS[1] + B.CHILD_DAYS[2]) { stage = 'adult'; scale = 1; }
    else if (age >= B.CHILD_DAYS[0] + B.CHILD_DAYS[1]) { stage = 'teen'; scale = 0.82; }
    else if (age >= B.CHILD_DAYS[0]) { stage = 'child'; scale = 0.6; }
    if (stage !== e.tg.stage) {
      e.tg.stage = stage; e.tg.scale = scale; c.stage = stage;
      e.st.maxHp = stage === 'adult' ? 95 : stage === 'teen' ? 75 : 60;
      e.st.hp = e.st.maxHp;
      e.cb.dmg = stage === 'adult' ? 12 : stage === 'teen' ? 8 : 4;
      if (stage === 'teen') tick(c.name + ' ya puede ayudar con roles.', 'good');
      tick(c.name + ' ha crecido: ' + stageName(stage) + '.', 'gold');
    }
  }
};
function stageName(s) { return { baby: 'bebé', child: 'niño', teen: 'joven', adult: 'adulto' }[s] || s; }

/* ==========================================================
16 · CONTRATOS
========================================================== */
S.questView = function () {
  const p = player();
  const list = [];
  for (let i = 0; i < D.QUESTS.length; i++) {
    const q = D.QUESTS[i];
    if (!condOk(q.when, 'roderic')) continue;
    const done = S.quests.done.indexOf(q.id) >= 0;
    const active = S.quests.active === q.id;
    let target = '', progress = 0;
    if (q.kind === 'gather') {
      target = D.ITEMS[q.item] ? D.ITEMS[q.item].name : q.item;
      progress = Math.min(q.count, E.Inv.count(p, q.item));
    } else {
      target = D.SPECIES[q.target] ? D.SPECIES[q.target].name : q.target;
      progress = active ? S.quests.progress : (done ? q.count : 0);
    }
    list.push({ id: q.id, kind: q.kind, name: q.name, target: target,
      species: q.target || null, item: q.item || null,
      count: q.count, reward: q.reward, done: done, active: active, progress: progress });
  }
  let active = null;
  if (S.quests.active) {
    const q = D.QUESTS.find(function (x) { return x.id === S.quests.active; });
    if (q) {
      const isGather = q.kind === 'gather';
      const prog = isGather ? Math.min(q.count, E.Inv.count(p, q.item)) : S.quests.progress;
      active = { id: q.id, kind: q.kind, name: q.name, count: q.count, progress: prog,
        reward: q.reward, item: q.item || null,
        target: isGather ? (D.ITEMS[q.item] ? D.ITEMS[q.item].name : q.item)
          : (D.SPECIES[q.target] ? D.SPECIES[q.target].name : q.target) };
    }
  }
  return { list: list, active: active, gold: p.gold };
};
S.acceptQuest = function (id) {
  const q = D.QUESTS.find(function (x) { return x.id === id; });
  if (!q) return;
  if (S.quests.done.indexOf(id) >= 0) { toast('Ya completado.', 'bad'); return; }
  if (S.quests.active) { toast('Termina o abandona el contrato actual.', 'bad'); return; }
  if (!condOk(q.when, 'roderic')) { toast('No cumples los requisitos.', 'bad'); return; }
  S.quests.active = id; S.quests.progress = 0;
  A.play('quest');
  toast('Contrato aceptado: ' + q.name, 'good');
  Bus.emit('panel:update', {});
};
S.abandonQuest = function () {
  if (!S.quests.active) return;
  S.quests.active = null; S.quests.progress = 0;
  addTrust('roderic', -3);
  toast('Contrato abandonado.', 'bad');
  Bus.emit('panel:update', {});
};
S.onKill = function (d) {
  if (!S.quests.active || !d.byPlayer) return;
  const q = D.QUESTS.find(function (x) { return x.id === S.quests.active; });
  if (!q || q.kind !== 'hunt' || d.species !== q.target) return;
  S.quests.progress++;
  if (S.quests.progress >= q.count) { toast('Contrato completado. Vuelve con Roderic.', 'gold'); A.play('quest'); }
  else tick('Contrato: ' + S.quests.progress + '/' + q.count, '');
  Bus.emit('quest:progress', { id: q.id, progress: S.quests.progress });
};
S.turnInQuest = function () {
  if (!S.quests.active) return;
  const q = D.QUESTS.find(function (x) { return x.id === S.quests.active; });
  if (!q) return;
  const p = player();
  if (q.kind === 'gather') {
    if (E.Inv.count(p, q.item) < q.count) { toast('Necesitas ' + q.count + ' ' + D.ITEMS[q.item].name + '.', 'bad'); return; }
    E.Inv.remove(p, q.item, q.count);
  } else if (S.quests.progress < q.count) { toast('Aún no has terminado el contrato.', 'bad'); return; }
  p.gold += q.reward;
  S.quests.done.push(q.id);
  S.quests.active = null; S.quests.progress = 0;
  addTrust('roderic', q.trust);
  E.addXP(p, 'combat', Math.round(q.reward * 0.12));
  A.play('sell');
  toast('Recompensa: ' + q.reward + ' oro.', 'gold');
  Bus.emit('panel:update', {});
};

/* ==========================================================
17 · PESCA SILENCIOSA
========================================================== */
S.startFishing = function (spot) {
  const p = player();
  if (S.fishing) return;
  const ti = E.toolInfo(p);
  if (!ti || ti.kind !== 'rod') { toast('Equipa una caña de pescar (o repárala si está rota).', 'bad'); A.play('error'); return; }
  if (p.st.st < 3) { toast('Sin stamina.', 'bad'); return; }
  p.st.st -= 3;
  const bait = E.Inv.remove(p, 'bait', 1);
  const wait = B.FISH_WAIT[0] + rng().next() * (B.FISH_WAIT[1] - B.FISH_WAIT[0]);
  const win = (B.FISH_WINDOW || 0.95) + ti.pow * 0.15 + (bait ? B.FISH_BAIT_BONUS : 0) + E.levelOf(p, 'fishing') * 0.03;
  S.fishing = { phase: 'wait', t: wait, window: win, spot: spot, bait: bait, rod: ti };
  gateInput();
  A.play('splash');
  Bus.emit('fishing:state', { phase: 'wait', t: wait, window: win, bait: bait, spot: spot });
};
S.updateFishing = function (dt) {
  const f = S.fishing;
  if (!f) return;
  const m = CR.Input.getMove();
  if (m.mag > 0.4) { S.cancelFishing('move'); return; }
  f.t -= dt;
  if (f.phase === 'wait' && f.t <= 0) {
    f.phase = 'bite'; f.t = f.window;
    A.play('splash', { rate: 1.3 });
    Bus.emit('fishing:state', { phase: 'bite', t: f.window, window: f.window, spot: f.spot });
  } else if (f.phase === 'bite' && f.t <= 0) S.cancelFishing('escaped');
};
function rollFish(spot) {
  const biome = W.biomeAt(spot.x, spot.y);
  const table = D.BIOMES[biome].fish;
  let total = 0;
  for (let i = 0; i < table.length; i++) total += table[i][1];
  let roll = lootRng().next() * total, fish = table[0][0];
  for (let i = 0; i < table.length; i++) { roll -= table[i][1]; if (roll <= 0) { fish = table[i][0]; break; } }
  return fish;
}
S.fishingPress = function () {
  const f = S.fishing;
  if (!f || f.phase !== 'bite') return;
  const p = player();
  const fish = rollFish(f.spot);
  if (!canFit(fish, 1)) { S.cancelFishing('full'); return; }
  E.Inv.add(p, fish, 1, 0);
  E.addXP(p, 'fishing', B.XP_FISH);
  wearToolSafe(p, 1);
  A.play('fish');
  fx('water', f.spot.x + 0.5, f.spot.y + 0.5);
  floater(p.t.x, p.t.y - 0.8, '+1 ' + D.ITEMS[fish].name, '#8fd0f0');
  S.fishing = null;
  gateInput();
  Bus.emit('fishing:state', { phase: 'done', fish: fish });
};
S.cancelFishing = function (reason) {
  if (!S.fishing) return;
  S.fishing = null;
  gateInput();
  Bus.emit('fishing:state', { phase: 'idle', reason: reason || '' });
};
S.useNet = function () {
  const p = player();
  if (E.Inv.count(p, 'fishing_net') < 1) { toast('No llevas red de pesca.', 'bad'); return; }
  const spot = W.fishingSpot(p.t.x, p.t.y, 3.2);
  if (!spot) { toast('Acércate a la orilla del agua.', 'bad'); A.play('error'); return; }
  if (p.st.st < 8) { toast('Sin stamina para lanzar la red.', 'bad'); return; }
  p.st.st -= 8;
  E.Inv.remove(p, 'fishing_net', 1);
  const n = 2 + (rng().chance(0.4) ? 1 : 0);
  let got = 0;
  for (let i = 0; i < n; i++) {
    const fish = rollFish(spot);
    if (!canFit(fish, 1)) break;
    E.Inv.add(p, fish, 1, 0); got++;
  }
  E.addXP(p, 'fishing', B.XP_FISH * got);
  A.play('fish');
  fx('water', spot.x + 0.5, spot.y + 0.5);
  tick(got ? 'La red trae ' + got + ' capturas' : 'La red vuelve vacía: inventario lleno', got ? 'good' : 'bad');
};

/* ==========================================================
18 · ROBO, AGRESIÓN, BENDICIÓN Y CARIDAD
========================================================== */
S.theft = function (ownerId, itemId, n, q) {
  const p = player();
  if (!canFit(itemId, n)) { toast('Inventario lleno.', 'bad'); return; }
  E.Inv.add(p, itemId, n, q);
  let witnessed = false;
  for (let i = 0; i < E.list.length; i++) {
    const e = E.list[i];
    if (e.tg.dead || e === p) continue;
    if (e.type !== 'npc' && e.type !== 'guard') continue;
    if (U.dist2(p.t.x, p.t.y, e.t.x, e.t.y) > B.WITNESS_RADIUS * B.WITNESS_RADIUS) continue;
    if (!W.lineOfSight(p.t.x, p.t.y, e.t.x, e.t.y)) continue;
    witnessed = true; break;
  }
  if (witnessed) {
    addTrust(ownerId, -30, 'robo');
    E.heat = Math.min(100, E.heat + 25);
    toast('¡Te han visto robar! ' + (D.NPCS[ownerId] ? D.NPCS[ownerId].name : ownerId) + ' te odia un poco más.', 'bad');
    A.play('error');
    if (E.heat >= 40) for (let i = 0; i < E.list.length; i++) if (E.list[i].type === 'guard') E.list[i].tg.angry = true;
  } else {
    addTrust(ownerId, -8);
    E.heat = Math.min(100, E.heat + 5);
    tick('Has robado sin testigos… por ahora.', 'bad');
  }
  A.play('harvest');
};
S.onNpcAttacked = function (npcId) {
  addTrust(npcId, -40, 'agresión');
  E.heat = Math.min(100, E.heat + 30);
  for (let i = 0; i < E.list.length; i++) {
    const e = E.list[i];
    if (e.type === 'npc' && e.npcId === npcId) e.tg.angry = true;
    if (e.type === 'guard') e.tg.angry = true;
  }
  toast('¡Has agredido a ' + D.NPCS[npcId].name + '! La guardia te busca.', 'bad');
};
S.bless = function () {
  const p = player();
  let cost = B.BLESS_COST;
  if (trustOf('maera') >= 60) cost = Math.ceil(cost * 0.7);
  if (trustOf('maera') <= -60) { toast('Maera se niega.', 'bad'); return; }
  if (p.gold < cost) { toast('La bendición cuesta ' + cost + ' oro.', 'bad'); return; }
  p.gold -= cost;
  p.buffs.bless = C.DAY_REAL_MS / 1000;
  addTrust('maera', 2);
  A.play('bell'); fx('spark', p.t.x, p.t.y);
  toast('Bendición del Alba: +12 % de experiencia durante un día.', 'gold');
};
S.charity = function () {
  const p = player();
  if (p.gold < B.CHARITY_COST) { toast('Necesitas ' + B.CHARITY_COST + ' oro.', 'bad'); return; }
  p.gold -= B.CHARITY_COST;
  addTrust('maera', 5);
  S.flags.charitable = true;
  A.play('coin');
  tick('Tu caridad conforta a los pobres de Vhalor.', 'good');
};

/* ==========================================================
19 · REGALOS Y VISTA SOCIAL
========================================================== */
S.giftView = function (npcId) {
  const p = player();
  const nd = D.NPCS[npcId];
  const items = [];
  for (let i = 0; i < p.inv.length; i++) {
    const s = p.inv[i];
    if (!s) continue;
    const def = D.ITEMS[s.id];
    if (!def) continue;
    const loved = (nd.loves || []).indexOf(s.id) >= 0;
    let gain = U.clamp(Math.round(def.value / B.GIFT_DIV), 1, B.GIFT_MAX);
    if (loved) gain = Math.round(gain * 1.5);
    items.push({ slot: i, id: s.id, name: def.name, n: s.n, gain: gain, loved: loved });
  }
  return { npcId: npcId, name: nd.name, items: items, used: dailyUsed(npcId, 'gift') };
};
S.giveGift = function (npcId, slot) {
  const p = player();
  if (dailyUsed(npcId, 'gift')) { toast('Ya le regalaste algo hoy.', ''); return; }
  const s = p.inv[slot];
  if (!s) return;
  const nd = D.NPCS[npcId], def = D.ITEMS[s.id];
  const loved = (nd.loves || []).indexOf(s.id) >= 0;
  let gain = U.clamp(Math.round(def.value / B.GIFT_DIV), 1, B.GIFT_MAX);
  if (loved) gain = Math.round(gain * 1.5);
  E.Inv.removeAt(p, slot, 1);
  markDaily(npcId, 'gift');
  addTrust(npcId, gain);
  A.play('tame');
  tick(nd.name + (loved ? ' ¡le encanta!' : ' agradece el regalo.') + ' +' + gain, 'good');
  Bus.emit('panel:update', {});
};
S.socialView = function () {
  const p = player();
  const list = Object.keys(D.NPCS).map(function (id) {
    const nd = D.NPCS[id];
    const t = trustOf(id);
    return { id: id, name: nd.name, role: nd.role, trust: t, band: bandOf(t),
      rel: S.rel[id] || 'none', romance: nd.romance && nd.gender !== p.gender,
      wanderer: !!nd.wanderer, hunter: !!nd.hunter, farmer: !!nd.farmer, stall: !!nd.stall,
      consequences: nd.consequences };
  });
  return { list: list, family: S.familyView(), help: S.help };
};

/* ==========================================================
20 · KO Y REAPARICIÓN
========================================================== */
S.onKO = function () {
  const p = player();
  S.uiMode = 'ko';
  gateInput();
  if (S.fishing) S.cancelFishing('ko');

  let text;
  if (!p.free) {
    p.debt += B.KO_DEBT;
    let lost = 0;
    const lostItems = [];
    for (let i = 0; i < p.inv.length; i++) {
      const s = p.inv[i];
      if (s && D.ITEMS[s.id] && D.ITEMS[s.id].cat === 'material') {
        const take = Math.ceil(s.n * B.KO_MAT_LOSS);
        s.n -= take; lost += take;
        lostItems.push({ id: s.id, n: take, q: s.q | 0 });
        if (s.n <= 0) p.inv[i] = null;
      }
    }
    if (lostItems.length && E.dropLoot) {
      E.dropLoot(p.t.x, p.t.y, lostItems, { life: 300, delay: 3 });
    }
    text = 'Los cazadores de Bareth te arrastran de vuelta. Tu deuda aumenta en ' + B.KO_DEBT +
      ' oro' + (lost > 0 ? ' y ' + lost + ' materiales quedan en el suelo donde caíste (duran 5 min).' : '.');
  } else {
    const lose = Math.floor(p.gold * B.KO_GOLD_LOSS);
    p.gold -= lose;
    text = 'Un desconocido te lleva a rastras a un lugar seguro. Pierdes ' + lose +
      ' oro portable (el banco está a salvo).';
  }
  Bus.emit('ko:show', { text: text });
};
S.respawn = function () {
  const p = player();
  let spot;
  if (!p.free) spot = W.playerStart;
  else {
    const house = W.bestHouse();
    spot = house ? W.doorOf(house) : { x: W.npcSpawns.maera.x, y: W.npcSpawns.maera.y };
  }
  E.respawnPlayer(spot.x, spot.y);
  S.uiMode = 'none';
  gateInput();
  Bus.emit('ko:hide', {});
  S.save(true);
};

/* ==========================================================
21 · VISTAS DE PANELES (con roturas y reparación visibles)
========================================================== */
S.houseView = function (uid) {
  const b = W.byUid(uid);
  if (!b) return null;
  const bd = D.BUILDINGS[b.key];
  if (!bd) return null;
  let nextKey = null;
  for (const k in D.BUILDINGS) if (D.BUILDINGS[k].upgradeFrom === b.key) { nextKey = k; break; }
  const next = nextKey ? D.BUILDINGS[nextKey] : null;
  const upCost = {};
  if (next) for (const id in next.cost) upCost[id] = Math.ceil(next.cost[id] * B.UPGRADE_FACTOR);
  return { uid: uid, key: b.key, name: bd.name, beds: bd.beds || 0, chest: bd.chest || 0,
    functions: bd.functions || [], desc: bd.desc, tier: bd.tier || 0,
    next: next ? { key: nextKey, name: next.name, cost: upCost, reqText: D.reqText(next.req),
      reqOk: D.meetsReq(next.req, player().lvl.level, player().lvl.alloc),
      afford: hasCost(upCost) } : null };
};
S.chestView = function (uid) {
  const b = W.byUid(uid);
  if (!b) return null;
  if (!b.data.items) b.data.items = [];
  const cap = (D.BUILDINGS[b.key] && D.BUILDINGS[b.key].chest) || 20;
  while (b.data.items.length < cap) b.data.items.push(null);
  if (b.data.items.length > cap) b.data.items.length = cap;
  return { uid: uid, name: b.info ? b.info.name : 'Cofre', items: b.data.items, cap: cap, inv: player().inv };
};
S.chestTransfer = function (uid, fromInv, slot, n) {
  const b = W.byUid(uid);
  if (!b) return;
  if (!b.data.items) b.data.items = [];
  const cap = (D.BUILDINGS[b.key] && D.BUILDINGS[b.key].chest) || 20;
  while (b.data.items.length < cap) b.data.items.push(null);
  const p = player();
  if (fromInv) {
    const s = p.inv[slot];
    if (!s) return;
    n = Math.min(n || s.n, s.n);
    let left = n;
    const def = D.ITEMS[s.id];
    if (def.stack > 1) for (let i = 0; i < cap && left > 0; i++) {
      const t = b.data.items[i];
      if (t && t.id === s.id && (t.q | 0) === (s.q | 0) && t.n < def.stack && t.dur === undefined) {
        const take = Math.min(def.stack - t.n, left); t.n += take; left -= take;
      }
    }
    while (left > 0) {
      let ei = -1;
      for (let i = 0; i < cap; i++) if (!b.data.items[i]) { ei = i; break; }
      if (ei < 0) break;
      const take = Math.min(def.stack, left);
      const it = { id: s.id, n: take, q: s.q | 0 };
      if (s.dur !== undefined) it.dur = s.dur;
      b.data.items[ei] = it; left -= take;
    }
    E.Inv.removeAt(p, slot, n - left);
  } else {
    const s = b.data.items[slot];
    if (!s) return;
    n = Math.min(n || s.n, s.n);
    const left = E.Inv.add(p, s.id, n, s.q | 0, s.dur);
    const moved = n - left;
    s.n -= moved;
    if (s.n <= 0) b.data.items[slot] = null;
    E.autoAmmo(p);
  }
  A.play('click');
  Bus.emit('panel:update', {});
};
S.animalsView = function (uid) {
  const b = W.byUid(uid);
  if (!b) return null;
  const bd = D.BUILDINGS[b.key];
  const list = [];
  for (let i = 0; i < E.list.length; i++) {
    const e = E.list[i];
    if (e.tg.dead || e.tg.owner !== 'player') continue;
    if (e.t.x >= b.x - 0.5 && e.t.x <= b.x + b.w + 0.5 && e.t.y >= b.y - 0.5 && e.t.y <= b.y + b.h + 0.5) {
      list.push({ uid: e.id, name: e.name, species: e.species, fed: e.tg.fed,
        ready: e.tg.ready, mountable: e.tg.mountable, baby: e.tg.baby,
        armor: e.tg.petArmor, hp: Math.round(e.st.hp), maxHp: e.st.maxHp });
    }
  }
  return { uid: uid, name: b.info ? b.info.name : 'Alojamiento', animals: list,
    cap: (bd && bd.cap) || 0, accepts: (bd && bd.accepts) || null };
};
S.inventoryView = function () {
  const p = P();
  const items = p.inv.map(function (s, i) {
    if (!s) return null;
    const def = D.ITEMS[s.id];
    if (!def) return null;
    const maxDur = maxDurOf(def);
    const broken = brokenOf(s);
    return { slot: i, id: s.id, name: def.name, n: s.n, q: s.q | 0, dur: s.dur,
      maxDur: maxDur, broken: broken,
      repair: (s.dur !== undefined && s.dur < maxDur) ? repairInfoSafe(p, i) : null,
      cat: def.cat, desc: def.desc };
  });
  const equip = {};
  for (let i = 0; i < E.EQUIP_SLOTS.length; i++) {
    const k = E.EQUIP_SLOTS[i], s = p.equip[k];
    if (!s || !D.ITEMS[s.id]) { equip[k] = null; continue; }
    const def = D.ITEMS[s.id], md = maxDurOf(def);
    equip[k] = { id: s.id, name: def.name, dur: s.dur, maxDur: md,
      broken: brokenOf(s),
      repair: (s.dur !== undefined && s.dur < md) ? repairInfoSafe(p, k) : null };
  }
  return {
    items: items, equip: equip, gold: p.gold, slots: p.inv.length, quick: p.quick,
    level: p.lvl.level, points: p.lvl.points, rp: p.lvl.rp || 0,
    tier: E.playerTier ? E.playerTier(p) : 1,
    sabers: Object.keys(p.lvl.sabers || {}),
    ammo: E.ammoInfo(p), ammoList: E.ammoList(p),
    fuel: E.Inv.fuel(p),
    stats: { dmg: p.cb.dmg, def: p.cb.def, crit: Math.round((p.critChance || 0) * 100),
      speed: Math.round((p.speedMul || 1) * 100), block: Math.round((p.blockReduce || 0) * 100),
      tame: Math.round((p.tameMul || 1) * 100) },
    skills: E.TRADES.map(function (s) {
      const lv = E.levelOf(p, s), tbl = B.TRADE_TABLE;
      const c0 = tbl[lv] || 0, c1 = tbl[Math.min(tbl.length - 1, lv + 1)] || c0 + 1;
      return { id: s, name: E.skillName(s), level: lv, xp: Math.round(p.xp[s].xp),
        pct: lv >= tbl.length - 1 ? 100 : U.clamp((p.xp[s].xp - c0) / Math.max(1, c1 - c0), 0, 1) * 100 };
    })
  };
};
S.dropSlot = function (slot, n) {
  const p = player();
  if (!p || p.ko) return false;
  const s = p.inv[slot];
  if (!s) return false;
  const def = D.ITEMS[s.id];
  if (!def) return false;
  const cnt = Math.max(1, Math.min(n || 1, s.n));
  const item = { id: s.id, n: cnt, q: s.q | 0 };
  if (s.dur !== undefined) item.dur = s.dur;
  const a = p.t.ang;
  const l = E.dropLoot(p.t.x, p.t.y, [item], { life: 180, manual: true, delay: 0,
    toward: { x: p.t.x + Math.cos(a), y: p.t.y + Math.sin(a) } });
  if (!l) return false;
  E.Inv.removeAt(p, slot, cnt);
  A.play('open');
  tick('Tiraste ' + def.name + ' ×' + cnt + ' · dura 3 min', '');
  return true;
};
S.assignQuick = function (slot, id) {
  const p = player();
  if (slot < 0 || slot > 4) return;
  p.quick[slot] = id;
  Bus.emit('quick:update', {});
  Bus.emit('panel:update', {});
};
/** Copia equipada (en cualquier ranura de equipo) de un objeto, o null. */
function equippedCopy(p, id) {
  for (const k in p.equip) {
    const s = p.equip[k];
    if (s && s.id === id) return { key: k, s: s };
  }
  return null;
}
S.equippedCopy = equippedCopy;
/** Estado de un objeto de la barra rápida: 'equipped' | 'ok' | 'broken' | 'missing'. */
S.quickState = function (p, id) {
  const eq = equippedCopy(p, id);
  if (eq && !brokenOf(eq.s)) return 'equipped';
  if (E.Inv.findUsable ? E.Inv.findUsable(p, id) >= 0 : E.Inv.find(p, id) >= 0) return 'ok';
  if (eq || E.Inv.find(p, id) >= 0) return 'broken';
  return 'missing';
};
function brokenMsg(p, id, def) {
  const eq = equippedCopy(p, id);
  const ref = eq ? eq.key : E.Inv.find(p, id);
  const info = ref !== -1 && ref !== undefined ? repairInfoSafe(p, ref) : null;
  let m = def.name + ' está ROTA: repárala en el inventario';
  if (info && info.cost) {
    const parts = [];
    for (const k in info.cost) parts.push(info.cost[k] + ' ' + (D.ITEMS[k] ? D.ITEMS[k].name.toLowerCase() : k));
    m += ' (' + parts.join(' + ') + ')';
  }
  return m + '.';
}
S.useQuick = function (slot) {
  const p = player();
  if (!p) return;
  const id = p.quick[slot];
  if (!id) return;
  const def = D.ITEMS[id];
  if (!def) return;
  if (def.tool || def.weapon || def.shield || def.armor || def.acc || def.bag) {
    const st = S.quickState(p, id);
    if (st === 'equipped') { tick(def.name + ' ya está equipada', ''); }
    else if (st === 'ok') {
      let i = -1;
      if (E.Inv.findUsable) i = E.Inv.findUsable(p, id);
      else {
        for (let k = 0; k < p.inv.length; k++) {
          const sl = p.inv[k];
          if (sl && sl.id === id && !brokenOf(sl)) { i = k; break; }
        }
      }
      const r = i >= 0 ? E.equipFromSlot(p, i) : { ok: false, msg: 'No se pudo equipar.' };
      if (r.ok) tick(r.msg, 'good'); else toast(r.msg, 'bad');
    }
    else if (st === 'broken') toast(brokenMsg(p, id, def), 'bad');
    else toast('Ya no tienes ' + def.name.toLowerCase() + '.', 'bad');
  } else {
    const r = E.useItem(p, id);
    if (r.ok) tick(r.msg, 'good'); else toast(r.msg, 'bad');
  }
  Bus.emit('quick:update', {});
};
/* ==========================================================
22 · GUARDADO v3 (compatible con saberes)
========================================================== */
function checksum(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return (h >>> 0).toString(16);
}
S.serialize = function () {
  return {
    trust: S.trust, rel: S.rel, flags: S.flags,
    quests: S.quests, family: S.family, help: S.help,
    slaveStock: S.slaveStock, workerMorale: S.workerMorale,
    time: { day: Time.day, month: Time.month, min: Time.min, weather: Time.weather, rain: Time.rain, wind: Time.wind }
  };
};
S.deserialize = function (d) {
  if (!d) return;
  S.trust = d.trust || {}; S.rel = d.rel || {}; S.flags = d.flags || {};
  S.quests = d.quests || { active: null, progress: 0, done: [] };
  S.family = d.family || { spouse: null, children: [], pregnantDay: 0 };
  S.help = d.help || null;
  S.slaveStock = d.slaveStock || 0;
  S.workerMorale = d.workerMorale || {};
  S.daily = {};
  S.publicCd = {};
  const ids = Object.keys(D.NPCS);
  for (let i = 0; i < ids.length; i++) {
    if (S.trust[ids[i]] === undefined) S.trust[ids[i]] = 0;
    if (!S.rel[ids[i]]) S.rel[ids[i]] = 'none';
  }
  if (d.time) {
    Time.day = d.time.day || 1; Time.month = d.time.month || 1; Time.min = d.time.min || 360;
    Time.weather = d.time.weather || 'clear'; Time.rain = d.time.rain || 0; Time.wind = d.time.wind || 0.3;
    Time.hour = Math.floor(Time.min / 60); Time.minute = Math.floor(Time.min % 60);
    const h = Time.hour + Time.minute / 60;
    Time.night = U.clamp(h < 5.5 ? 1 : h < 7 ? (7 - h) / 1.5 : h < 19 ? 0 : h < 21 ? (h - 19) / 2 : 1, 0, 1);
  }
  S.dialog = null; S.panel = null; S.fishing = null; S.uiMode = 'none';
  gateInput();
};
S.save = function (silent) {
  if (!CR.caps.storage || !player() || !W.ready) return false;
  try {
    const payload = { v: CR.SAVE_SCHEMA, seed: W.seed, world: W.serialize(), ent: E.serialize(), sys: S.serialize() };
    const json = JSON.stringify(payload);
    const final = json.slice(0, -1) + ',"sum":"' + checksum(json) + '"}';
    const nowMs = Date.now();
    if (!silent || !S._lastBackup || nowMs - S._lastBackup > 300000) {
      const prev = window.localStorage.getItem(C.SAVE_KEY);
      if (prev) window.localStorage.setItem(C.SAVE_BACKUP, prev);
      S._lastBackup = nowMs;
    }
    window.localStorage.setItem(C.SAVE_KEY, final);
    if (!silent) { toast('Partida guardada.', 'good'); A.play('quest'); }
    Bus.emit('saved', {});
    return true;
  } catch (e) {
    console.warn('[CR] guardado falló', e);
    if (!silent) toast('No se pudo guardar (almacenamiento lleno).', 'bad');
    return false;
  }
};
function readSlot(key) {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    const obj = JSON.parse(raw);
    if (!obj || obj.v !== CR.SAVE_SCHEMA || !obj.ent || !obj.world) return null;
    return obj;
  } catch (e) { return null; }
}
S.hasSave = function () { return !!(readSlot(C.SAVE_KEY) || readSlot(C.SAVE_BACKUP)); };
S.load = function () {
  const data = readSlot(C.SAVE_KEY) || readSlot(C.SAVE_BACKUP);
  if (!data) { toast('No hay partida guardada.', 'bad'); return Promise.resolve(false); }
  return W.generate(data.seed, function () {}).then(function (ok) {
    if (!ok) return false;
    const wok = W.deserialize(data.world);
    const eok = E.deserialize(data.ent);
    S.deserialize(data.sys);
    if (!wok || !eok) { toast('Guardado corrupto.', 'bad'); return false; }
    if (E.player) ensureProg(E.player);
    E.syncGuardians();
    toast('Partida cargada: ' + E.player.name + ', día ' + Time.day, 'good');
    Bus.emit('loaded', {});
    return true;
  });
};
S.exportSave = function () {
  try {
    const raw = window.localStorage.getItem(C.SAVE_KEY) || window.localStorage.getItem(C.SAVE_BACKUP);
    if (!raw) { toast('No hay guardado que exportar.', 'bad'); return; }
    const blob = new Blob([raw], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'kanato-jotun-save-v5.json';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    toast('Guardado exportado.', 'good');
  } catch (e) { toast('No se pudo exportar.', 'bad'); }
};
S.deleteSave = function () {
  try {
    window.localStorage.removeItem(C.SAVE_KEY);
    window.localStorage.removeItem(C.SAVE_BACKUP);
    toast('Guardado eliminado.', '');
  } catch (e) { /* almacenamiento no disponible */ }
};

console.info('[CR] systems.js v5 listo · avisos no invasivos · puestos con dueño · ' +
  'tiers y saberes · talleres públicos · reparación de roturas · pesca silenciosa · ' +
  'tareas de granja · dormir · tierras · contratos · guardado v3');
})();