/* ============================================================
KANATO DE JOTUN · main.js — Bootstrap v4
Máquina de estados (título → creación → INTRO → juego → pausa →
KO → error), bucle único, capa de compatibilidad, autoguardado,
auto-pausa por foco, overlay de pánico con exportación y panel F3.

CAMBIOS v4:
· INTRO (mejora 5): tras generar el mundo y crear al jugador se
  muestra screen-intro con la historia; un clic (o Enter) entra.
· Kit inicial (mejora 6): ya no se regala petate ni se tocan las
  ranuras rápidas; entities v4 entrega SOLO pico y hacha de piedra.
============================================================ */
(function () {
'use strict';
const CR = window.CR;
if (!CR || !CR.UI) { console.error('[CR] main.js requiere todos los módulos anteriores'); return; }
const U = CR.util, C = CR.CONFIG, W = CR.World, E = CR.Ent, S = CR.Sys, R = CR.Render, A = CR.Audio, UI = CR.UI, Bus = CR.Bus;
const el = function (id) { return document.getElementById(id); };
const Game = CR.Game = { state: 'boot', debug: false, _dbgT: 0, _started: false };

/* ==========================================================
CAPA DE COMPATIBILIDAD · correcciones defensivas idempotentes
========================================================== */
function compat() {
  if (W.__crCompat) return;
  W.__crCompat = true;
  /* 1 · El token de generación sobrevive al reset interno. */
  const origReset = W.reset;
  W.reset = function () { const t = W._genToken; origReset.call(W); W._genToken = t; };
  /* 2 · Edificios sin funciones no rompen la interacción. */
  const origBI = S.buildingInteract;
  if (typeof origBI === 'function') {
    S.buildingInteract = function (b) {
      if (!b) return;
      try { return origBI.call(S, b); }
      catch (e) { CR.reportError(e, 'buildingInteract'); }
    };
  }
  /* 3 · Al despertar de un KO, limpia canales de entrada pegados. */
  Bus.on('ko:hide', function () { CR.Input.clearAll(); }, 'main-compat');
}

/* Campamento inicial del esclavo: fogata junto a la puerta sur. */
function placeSlaveCamp() {
  const gx = W.gates && W.gates.length ? W.gates[0].x : W.playerStart.x;
  const gy = W.city ? W.city.y + W.city.h + 3 : W.playerStart.y + 6;
  let spot = null;
  for (let r = 0; r < 7 && !spot; r++) {
    for (let a = 0; a < 16 && !spot; a++) {
      const ang = a / 16 * U.TAU;
      const tx = Math.round(gx - 3 + Math.cos(ang) * r), ty = Math.round(gy + Math.sin(ang) * r);
      if (!W.inBounds(tx, ty)) continue;
      const idx = W.idx(tx, ty), f = W.flags[idx];
      if (f & (W.F.SOLID | W.F.WATER | W.F.ROAD | W.F.BUILDING | W.F.NODE | W.F.WALL | W.F.FLOOR | W.F.FARM | W.F.PARCEL)) continue;
      if (W.soil.has(idx) || W.isCity(tx, ty) || W.parcelAt(tx, ty) || W.farmAt(tx, ty)) continue;
      spot = { x: tx, y: ty };
    }
  }
  if (!spot) return;
  const saved = W.canPlace;
  W.canPlace = function () { return { ok: true }; };
  try { W.addBuilding('campfire', spot.x, spot.y, 'player', {}); }
  catch (e) { CR.reportError(e, 'camp'); }
  finally { W.canPlace = saved; }
}

/* ==========================================================
ESTADOS
========================================================== */
function syncSimOnly() {
  const p = E.player;
  const busy = !!(S.dialog || S.panel || UI.local || UI._edit || UI._portrait);
  CR.Loop.simEnabled = (Game.state === 'playing' && !!p && !p.ko && !busy);
}
function syncSim() { syncSimOnly(); UI.syncInput(); }

function enterPlaying() {
  Game.state = 'playing';
  UI.hideScreens();
  el('hud').hidden = false;
  UI.refreshHUD(); UI.refreshQuickbar();
  UI.syncInput();
  CR.Loop.resetClock();
  A.resume();
  syncSim();
}
/* --- v4: INTRO (mejora 5) --- */
function showIntro() {
  Game.state = 'intro';
  CR.Loop.simEnabled = false;
  CR.Input.enabled = false;
  CR.Input.clearAll();
  el('hud').hidden = true;
  UI.showScreen('screen-intro');
  A.resume();
}
function enterFromIntro() {
  if (Game.state !== 'intro') return;
  UI.hideScreens();
  enterPlaying();
  UI.banner('ESCLAVO DE VHALOR', 'Deuda: 2.000 oro. Pica, tala, vende… y rompe tu cadena.');
  UI.toast('En la plaza hay HORNO y MESA PÚBLICOS: fabrica sin construir nada (lentos, sin calidad).', 'gold');
  UI.toast('Si una herramienta se rompe NO la tires: repárala barata desde el inventario (I).', '');
  UI.toast('Cada nivel da 1 punto de habilidad (H) y 1 punto de receta (J): elige saberes.', '');
}
function toTitle() {
  Game.state = 'title';
  CR.Loop.simEnabled = false;
  CR.Input.enabled = false;
  CR.Input.clearAll();
  el('hud').hidden = true;
  el('dialog').hidden = true;
  el('modal').hidden = true;
  S.dialog = null; S.panel = null; UI.local = null;
  if (UI._edit) UI.exitCtlEdit();
  E.reset();
  UI.showScreen('screen-title');
  const bc = el('btn-continue');
  if (bc) bc.disabled = !S.hasSave();
  A.resume();
}
function pause(on) {
  if (on && Game.state === 'playing') {
    Game.state = 'paused';
    CR.Loop.simEnabled = false;
    CR.Input.enabled = false;
    CR.Input.clearAll();
    A.suspend();
    UI.showScreen('screen-pause');
  } else if (!on && Game.state === 'paused') {
    UI.hideScreens();
    Game.state = 'playing';
    A.resume();
    CR.Loop.resetClock();
    syncSim();
  }
}

/* ==========================================================
NUEVA PARTIDA / CARGA
========================================================== */
function startNew(name, gender, seedStr) {
  const seed = seedStr ? U.hashStr(seedStr) : ((Math.random() * 0xffffffff) >>> 0);
  CR.initStreams(seed);
  E.reset();
  UI.showScreen('screen-loading');
  UI.setLoad(0.04, 'Encendiendo la fragua del mundo…');
  W.generate(seed, function (p, label) { UI.setLoad(0.04 + p * 0.9, label); }).then(function (ok) {
    if (!ok) { UI.showError('No se pudo generar el mundo. Recarga la página.'); return; }
    UI.setLoad(0.96, 'Poblando Vhalor…');
    S.newGame(name, gender, seed);
    /* entities v4 ya entrega SOLO pico y hacha de piedra (mejora 6). */
    const p = E.createPlayer(name, gender);
    E.spawnNPCs();
    placeSlaveCamp();
    E.spawnBosses();
    E.spawnWanderers();
    E.syncGuardians();
    W.Hash.rebuild(E.list);
    R.invalidateAll();
    UI.setLoad(1, 'Listo.');
    showIntro();               /* v4: la historia antes de entrar */
    S.save(true);
  }).catch(function (e) { CR.reportError(e, 'startNew'); });
}
function loadGame() {
  UI.showScreen('screen-loading');
  UI.setLoad(0.05, 'Reconstruyendo el mundo desde la semilla…');
  let raw = null;
  try { raw = JSON.parse(window.localStorage.getItem(C.SAVE_KEY) || window.localStorage.getItem(C.SAVE_BACKUP)); } catch (e) { raw = null; }
  if (raw && raw.seed !== undefined) CR.initStreams(raw.seed >>> 0);
  S.load().then(function (ok) {
    if (!ok) {
      UI.showScreen('screen-title');
      UI.toast('No se pudo cargar la partida.', 'bad');
      return;
    }
    R.invalidateAll();
    enterPlaying();            /* sin intro al cargar: ya conoces tu historia */
    UI.banner('PARTIDA RECUPERADA', E.player.name + ' · Día ' + CR.Time.day);
  }).catch(function (e) { CR.reportError(e, 'loadGame'); });
}

/* ==========================================================
BUCLE
========================================================== */
function update(dt) {
  if (Game.state !== 'playing') return;
  S.update(dt);
  E.update(dt);
}
function render(alpha, dtMs) {
  R.draw(alpha, dtMs);
  A.update(dtMs / 1000);
  UI.tick(Math.min(dtMs / 1000, 0.1));
  if (Game.debug) {
    Game._dbgT -= dtMs;
    if (Game._dbgT <= 0) {
      Game._dbgT = 250;
      const st = CR.Loop.stats, rs = R.stats(), p = E.player;
      const dbg = el('debug');
      if (dbg) dbg.textContent =
        'FPS ' + st.fps + '  sim ' + st.simMs + 'ms  draw ' + st.renderMs + 'ms\n' +
        'entidades ' + E.list.length + '/' + E.CAP + '  nodos ' + W.nodes.size + '\n' +
        'chunks ' + rs.chunks + '  part ' + rs.parts + '  zoom ' + rs.zoom.toFixed(2) + '  q ' + rs.quality.toFixed(2) + '\n' +
        'listeners ' + CR.Bindings.count() + '  voces audio ok\n' +
        (p ? 'pos ' + p.t.x.toFixed(1) + ',' + p.t.y.toFixed(1) + '  ' + W.biomeName(p.t.x | 0, p.t.y | 0) + '\n' : '') +
        'día ' + CR.Time.day + ' ' + CR.Time.hour + ':' + String(CR.Time.minute).padStart(2, '0') + '  calor ' + Math.round(E.heat) + '\n' +
        'semilla ' + W.seed;
    }
  }
}

/* ==========================================================
CABLEADO GLOBAL
========================================================== */
function bind() {
  const B = CR.Bindings;
  /* Título */
  B.add(el('btn-new'), 'click', function () { A.play('click'); UI.showScreen('screen-create'); }, false, 'main');
  B.add(el('btn-continue'), 'click', function () { A.play('click'); loadGame(); }, false, 'main');
  B.add(el('btn-title-help'), 'click', function () { UI.local = 'help'; UI.renderLocal(); }, false, 'main');
  /* Creación */
  let gender = 'm';
  B.add(el('gender-male'), 'click', function () {
    gender = 'm'; el('gender-male').classList.add('sel'); el('gender-female').classList.remove('sel'); A.play('click');
  }, false, 'main');
  B.add(el('gender-female'), 'click', function () {
    gender = 'f'; el('gender-female').classList.add('sel'); el('gender-male').classList.remove('sel'); A.play('click');
  }, false, 'main');
  B.add(el('btn-create-back'), 'click', function () { UI.showScreen('screen-title'); }, false, 'main');
  B.add(el('btn-create-start'), 'click', function () {
    const name = (el('create-name').value || '').trim().slice(0, 16);
    if (name.length < 2) { el('create-error').textContent = 'Escribe un nombre de al menos 2 letras.'; A.play('error'); return; }
    el('create-error').textContent = '';
    startNew(name, gender, (el('create-seed').value || '').trim());
  }, false, 'main');
  B.add(el('create-name'), 'keydown', function (e) { if (e.key === 'Enter') el('btn-create-start').click(); }, false, 'main');
  /* INTRO (mejora 5): clic o Enter para entrar al mundo */
  B.add(el('btn-intro-enter'), 'click', function () { A.play('quest'); enterFromIntro(); }, false, 'main');
  B.add(el('screen-intro'), 'click', function (e) {
    if (e.target.closest('.btn')) return;
    A.play('quest'); enterFromIntro();
  }, false, 'main');
  B.add(window, 'keydown', function (e) {
    if (Game.state === 'intro' && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); enterFromIntro(); }
  }, false, 'main');
  /* Pausa */
  B.add(el('btn-resume'), 'click', function () { pause(false); }, false, 'main');
  B.add(el('btn-save'), 'click', function () { S.save(false); }, false, 'main');
  B.add(el('btn-pause-settings'), 'click', function () {
    UI.hideScreens(); Game.state = 'playing'; UI.local = 'settings'; UI.renderLocal(); syncSim();
  }, false, 'main');
  B.add(el('btn-pause-help'), 'click', function () {
    UI.hideScreens(); Game.state = 'playing'; UI.local = 'help'; UI.renderLocal(); syncSim();
  }, false, 'main');
  B.add(el('btn-quit'), 'click', function () { S.save(true); toTitle(); }, false, 'main');
  /* KO */
  B.add(el('btn-ko-continue'), 'click', function () {
    S.respawn(); Game.state = 'playing'; UI.hideScreens(); syncSim();
  }, false, 'main');
  /* Error */
  B.add(el('btn-error-export'), 'click', function () { S.exportSave(); }, false, 'main');
  B.add(el('btn-error-reload'), 'click', function () { window.location.reload(); }, false, 'main');
  /* Bus de UI */
  Bus.on('ui:pause', function () { if (Game.state === 'playing') pause(true); else if (Game.state === 'paused') pause(false); }, 'main');
  Bus.on('ui:escape', function () {
    if (UI._edit) { UI.exitCtlEdit(); syncSim(); return; }
    if (Game.state === 'intro') { enterFromIntro(); return; }
    if (S.dialog) { S.closeDialog(); syncSim(); return; }
    if (S.panel) { S.closePanel(); syncSim(); return; }
    if (UI.local) { UI.closeModal(); syncSim(); return; }
    if (Game.state === 'playing') pause(true);
    else if (Game.state === 'paused') pause(false);
  }, 'main');
  Bus.on('ui:quit', function () { S.save(true); toTitle(); }, 'main');
  Bus.on('ui:debug', function () {
    Game.debug = !Game.debug;
    el('debug').hidden = !Game.debug;
    CR.Settings.set('fps', Game.debug);
  }, 'main');
  Bus.on('ui:gate', syncSimOnly, 'main');
  Bus.on('dialog:open', syncSim, 'main');
  Bus.on('dialog:close', syncSim, 'main');
  Bus.on('panel:open', syncSim, 'main');
  Bus.on('panel:close', syncSim, 'main');
  Bus.on('ko:show', function (d) {
    Game.state = 'ko';
    CR.Loop.simEnabled = false;
    CR.Input.enabled = false;
    el('ko-text').textContent = d.text;
    el('hud').hidden = true;
    UI.showScreen('screen-ko');
  }, 'main');
  Bus.on('ko:hide', function () { el('hud').hidden = false; }, 'main');
  Bus.on('fatal', function (d) {
    if (Game.state === 'error') return;
    Game.state = 'error';
    CR.Loop.simEnabled = false;
    CR.Input.enabled = false;
    UI.showError('[' + d.context + ']\n' + d.message);
  }, 'main');
  /* Foco y ciclo de vida */
  B.add(document, 'visibilitychange', function () {
    if (document.hidden) { if (Game.state === 'playing') pause(true); A.suspend(); }
    else { CR.Loop.resetClock(); if (Game.state !== 'paused') A.resume(); }
  }, false, 'main');
  B.add(window, 'blur', function () { if (Game.state === 'playing') pause(true); }, false, 'main');
  B.add(window, 'focus', function () { CR.Loop.resetClock(); }, false, 'main');
  B.add(window, 'beforeunload', function () { if (E.player && W.ready) S.save(true); }, false, 'main');
  B.add(window, 'error', function (e) { CR.reportError(e.error || new Error(e.message), 'window'); }, false, 'main');
  B.add(window, 'unhandledrejection', function (e) { CR.reportError(e.reason || new Error('Promesa rechazada'), 'promise'); }, false, 'main');
}

/* ==========================================================
BOOT
========================================================== */
function boot() {
  if (Game._started) return;
  Game._started = true;
  try {
    CR.Settings.load();
    compat();
    A.init();
    S.init();
    UI.init();
    const canvas = el('game');
    CR.Input.init(canvas);
    R.init(canvas, el('minimap'));
    bind();
    CR.Loop.start(update, render);
    Game.debug = !!CR.Settings.values.fps;
    el('debug').hidden = !Game.debug;
    UI.setLoad(1, 'Vhalor te espera.');
    setTimeout(function () {
      toTitle();
      const bc = el('btn-continue');
      if (bc) bc.disabled = !S.hasSave();
    }, 420);
    console.info('[CR] KANATO DE JOTUN v' + CR.version + ' listo · mundo ' + C.WORLD + '² · intro + tiers + saberes + talleres públicos · 60 Hz fijos.');
  } catch (e) {
    CR.reportError(e, 'boot');
  }
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
else boot();
})();