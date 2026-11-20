/* ============================================================
KANATO DE JOTUN · main.js — Bootstrap v5
Máquina de estados (título → creación → intro → juego → pausa →
KO → error), bucle único, capa de compatibilidad, autoguardado,
auto-pausa por foco, overlay de pánico con exportación y panel
de rendimiento F3. Cierra la arquitectura de 14 módulos.

CAMBIOS v5:
· Intro narrativa breve antes de entrar al mundo.
· Arranque con un solo aviso, sin ráfaga de toasts.
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
  /* El token de generación debe sobrevivir al reset interno. */
  const origReset = W.reset;
  W.reset = function () { const t = W._genToken; origReset.call(W); W._genToken = t; };
  /* Edificios sin funciones no deben romper la interacción. */
  const origBI = S.buildingInteract;
  if (typeof origBI === 'function') {
    S.buildingInteract = function (b) {
      if (!b) return;
      try { return origBI.call(S, b); }
      catch (e) { CR.reportError(e, 'buildingInteract'); }
    };
  }
  /* Al despertar de un KO, limpia cualquier canal de entrada pegado. */
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
INTRO NARRATIVA v5
========================================================== */
const INTRO_CARDS = [
  { t: 'El naufragio', b: 'La tormenta partió tu barco como si fuera leña. Despertaste en una playa de arena gris, con el collar de esclavo ya puesto y las manos vacías.' },
  { t: 'Vhalor', b: 'Los cazadores de Bareth te arrastraron hasta la ciudad amurallada. Dos puertas. Un mercado. Una deuda de dos mil monedas de oro que no pediste.' },
  { t: 'La ley', b: '«Paga y serás libre», dijo Bareth. «Roba, y la guardia hará el resto». En Vhalor nadie regala nada… pero todo se puede ganar.' },
  { t: 'Tu historia', b: 'Pica piedra. Tala madera. Domestica bestias. Gánate la confianza de quienes mandan. Y un día, quizá, el valle sea tuyo.' }
];
let introIdx = 0, introPending = null;

function showIntroCard() {
  const box = el('intro-card');
  const ti = el('intro-title');
  const tx = el('intro-text');
  const ct = el('intro-count');
  if (!box) { finishIntro(); return; }
  const card = INTRO_CARDS[introIdx];
  if (!card) { finishIntro(); return; }
  if (ti) ti.textContent = card.t;
  if (tx) tx.textContent = card.b;
  if (ct) ct.textContent = (introIdx + 1) + ' / ' + INTRO_CARDS.length;
  const btn = el('intro-next');
  if (btn) btn.innerHTML = (introIdx >= INTRO_CARDS.length - 1
    ? (A.imgHtml ? '' : '') + '<span>Comenzar</span>'
    : '<span>Continuar</span>');
  box.classList.remove('hidden');
}
function advanceIntro() {
  A.play('click');
  introIdx++;
  if (introIdx >= INTRO_CARDS.length) finishIntro();
  else showIntroCard();
}
function resetIntro() {
  introIdx = 0; introPending = null;
  const box = el('intro-card');
  if (box) box.classList.remove('hidden');
}
function finishIntro() {
  introIdx = 0;
  if (!introPending) return;
  const fn = introPending; introPending = null;
  try { fn(); } catch (e) { CR.reportError(e, 'intro'); enterPlaying(); }
}
function maybeIntro(thenFn) {
  /* La intro solo se usa en partida nueva. Sin tarjetas, entra directo. */
  if (!el('intro-card') || !INTRO_CARDS.length) { thenFn(); return; }
  introPending = thenFn;
  introIdx = 0;
  Game.state = 'intro';
  CR.Loop.simEnabled = false;
  CR.Input.enabled = false;
  CR.Input.clearAll();
  UI.showScreen('screen-intro');
  showIntroCard();
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
function toTitle() {
  resetIntro();
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
    const p = E.createPlayer(name, gender);
    /* Carga inicial: herramientas en la barra rápida y un petate. */
    p.quick[2] = 'axe_stone';
    p.quick[3] = 'pick_stone';
    E.Inv.add(p, 'bed_roll', 1);
    E.spawnNPCs();
    placeSlaveCamp();
    E.spawnBosses();
    E.spawnWanderers();
    E.syncGuardians();
    W.Hash.rebuild(E.list);
    R.invalidateAll();
    UI.setLoad(1, 'Listo.');
    /* v5: intro narrativa antes de entrar; un solo aviso al pisar el mundo. */
    maybeIntro(function () {
      enterPlaying();
      UI.banner('ESCLAVO DE VHALOR', 'Deuda: 2.000 oro. Pica, tala y vende para romper tu cadena.');
      S.save(true);
    });
  }).catch(function (e) { CR.reportError(e, 'startNew'); });
}
function loadGame() {
  /* Continuar: la intro se omite siempre. */
  resetIntro();
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
    enterPlaying();
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
        'listeners ' + CR.Bindings.count() + '\n' +
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
  /* Intro v5 */
  B.add(el('intro-next'), 'click', advanceIntro, false, 'main');
  B.add(el('intro-skip'), 'click', function () { A.play('click'); finishIntro(); }, false, 'main');
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
    if (Game.state === 'intro') { advanceIntro(); return; }
    if (UI._edit) { UI.exitCtlEdit(); syncSim(); return; }
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
    console.info('[CR] KANATO DE JOTUN v' + CR.version + ' listo · mundo ' + C.WORLD + '² · intro narrativa · 14 módulos · 60 Hz.');
  } catch (e) {
    CR.reportError(e, 'boot');
  }
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
else boot();
})();