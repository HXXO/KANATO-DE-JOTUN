/* ============================================================
KANATO DE JOTUN · data.js — Núcleo de contenido v5 (parte 1 de 4)
CAMBIOS v5:
· TOOL_TIERS: cada material define velocidad de golpe, durabilidad,
  poder y coste de reparación. Piedra = lento y frágil; adamantita =
  rápido y eterno. La progresión se SIENTE al usar la herramienta.
· COBRE ACCESIBLE: cobre en pradera, bosque, montaña, altiplano,
  cenizal y costa. Se pica con pico de piedra (poder 1) pero tarda.
· Nodos: golpes por veta recalibrados para que el salto de tier
  se note (piedra 5 golpes en cobre, hierro 1-2).
· TAME_METHODS + constantes de tameo para la guía completa.
============================================================ */
(function () {
'use strict';
const CR = window.CR;
if (!CR) { console.error('[CR] data.js requiere core.js'); return; }
const U = CR.util;

/* ==========================================================
1 · BALANCE MAESTRO
========================================================== */
const BAL = CR.BAL = {
  /* --- Supervivencia --- */
  HP: 110, ST: 110, FOOD: 100,
  FOOD_TICK: 7, STARVE_DPS: 1.8,
  ST_REGEN_IDLE: 7.5, ST_REGEN_MOVE: 4.2, ST_FOOD_MIN: 18,
  REGEN_FOOD_MIN: 55, REGEN_BASE: 0.35,

  /* --- Movimiento --- */
  SPEED: 4.5, SPRINT: 6.9, WALK_MIN: 0.28,
  ACCEL: 20, DECEL: 26, TURN_RATE: 15, PIVOT_RATE: 11,
  ST_SPRINT: 3.4,

  /* --- Costes de acción --- */
  ST_ATTACK: 6, ST_HEAVY: 13, ST_CHOP: 5, ST_MINE: 5,
  ST_ROLL: 13, ST_BLOCK_HIT: 4, ST_BLOCK_HOLD: 1.6,
  ST_DRAW: 3, ST_SHOT: 5, ST_BASH: 9, ST_FLIGHT: 5,

  /* --- Recolección (v5: la velocidad la pone la herramienta) --- */
  GATHER_CD: 0.34,          /* base: se divide por tool.speed */
  GATHER_CD_MIN: 0.16,
  HAND_CD: 0.42,            /* recoger a mano */

  /* --- Combate cuerpo a cuerpo --- */
  ATTACK_CD: 0.34, REACH: 1.45, SPEAR_REACH: 2.05,
  COMBO_MULT: [1, 1.14, 1.34, 1.62], COMBO_WINDOW: 0.85,
  ATK_WINDUP: 0.07, ATK_ACTIVE: 0.10, ATK_RECOVER: 0.17,
  CANCEL_WINDOW: 0.13,
  HEAVY_CHARGE: 0.42, HEAVY_MULT: 2.1,
  CRIT: 0.10, CRIT_MULT: 1.75, DEF_K: 46,
  KNOCKBACK: 2.4, HITSTOP: 0.045,

  /* --- Esquiva --- */
  ROLL_TIME: 0.34, ROLL_IFRAMES: 0.28, ROLL_SPEED: 8.4, ROLL_CD: 0.85,

  /* --- Bloqueo y parry --- */
  BLOCK_REDUCE: 0.62, BLOCK_ARC: 1.75, PARRY_WINDOW: 0.22,
  PARRY_MULT: 0.10, PARRY_STAGGER: 1.15, PARRY_ST_REFUND: 8,
  BASH_STAGGER: 0.7, BASH_CD: 1.1, GUARD_BREAK_ST: 0.18,

  /* --- Distancia --- */
  DRAW_MIN: 0.22, DRAW_FULL: 0.85, DRAW_HOLD_MAX: 2.6,
  DRAW_DMG_MIN: 0.45, DRAW_DMG_MAX: 1.35,
  ARROW_SPEED: 17, ARROW_GRAV: 0, ARROW_LIFE: 2.2,
  AIM_CONE: 0.55, AIM_CONE_NEAR: 1.25, AIM_NEAR_DIST: 1.9,
  AIM_STICKY: 0.62, AIM_SWITCH_MARGIN: 0.34, AIM_LOCK_TIME: 1.4,
  AIM_MAX_RANGE: 11,

  /* --- Estados --- */
  BLEED_DPS: 2.4, BLEED_TIME: 7, POISON_TIME: 7, BURN_TIME: 4.5,
  STAGGER_TIME: 0.55, SLOW_TIME: 2.2,

  /* --- IA --- */
  AI_THINK: 0.12, AI_REST_MIN: 1.1, AI_REST_MAX: 2.6,
  AI_BURST_MIN: 1, AI_BURST_MAX: 3, AI_TELEGRAPH: 0.42,
  AI_LEASH: 15, AI_LEASH_MYTH: 24, AI_CHASE_GIVEUP: 2.4,
  AI_HUNT_RADIUS: 13, AI_FLEE_RADIUS: 9,

  /* --- Spawn --- */
  SPAWN_TICK: 4, SPAWN_TRIES: 10,
  SPAWN_RING: [20, 44], SPAWN_DESPAWN: 78, SPAWN_ACTIVE: 56,
  SPAWN_MIN_DIST: 18, SPAWN_PRED_PREY: 18,
  SPAWN_PACK_HERB: [1, 3], SPAWN_PACK_PRED: [1, 2], SPAWN_PACK_MYTH: [1, 1],
  SPAWN_CITY_BUFFER: 52,
  CAP: 230, WILD_CAP: 42, HERB_CAP: 16, SPECIES_CAP: 5,

  /* --- Progresión --- */
  LEVEL_XP: [0, 90, 210, 370, 570, 820, 1120, 1480, 1900, 2400,
             2980, 3650, 4420, 5300, 6300, 7420, 8680, 10080, 11640, 13360,
             15250, 17320, 19580, 22040, 24700, 27580, 30680, 34000, 37560, 41360,
             45400, 49700, 54260, 59080, 64180, 69560, 75220, 81180, 87440, 94000],
  POINTS_PER_LEVEL: 1, POINTS_MILESTONE: 5, POINTS_MILESTONE_BONUS: 1,
  LEVEL_HP: 3, LEVEL_ST: 1, LEVEL_DEF_EVERY: 5,
  TIER_BOUNDS: [10, 30, 40],
  SABER_POINTS_PER_LEVEL: 1,
  XP_CHOP: 9, XP_MINE: 11, XP_FISH: 14, XP_HARVEST: 9, XP_TILL: 4,
  XP_COOK: 10, XP_CRAFT: 12, XP_SMELT: 14, XP_TAME: 40, XP_HELP: 18,
  XP_LEVEL_BONUS: 0.035,

  /* --- Oficios --- */
  TRADE_TABLE: [0, 100, 250, 450, 700, 1000, 1400, 1900, 2500, 3200, 4100],
  TRADE_BONUS: 0.05,

  /* --- TAMEO v5 --- */
  TAME_SEDATE_HP: 0.60,      /* hay que dejarlo por debajo del 60 % */
  TAME_SEDATE_TIME: 42,      /* duerme 42 s: da tiempo a alimentar */
  TAME_WAKE_KEEP: 0.5,       /* al despertar conserva la mitad del progreso */
  TAME_CALM_TIME: 2.4,
  TAME_EASE_RANGE: 11,       /* a esta distancia el animal empieza a fijarse en ti */
  TAME_MIN_SPOOK: 0.9,       /* con plena confianza solo huye si lo pisas */
  TAME_BOND_DECAY: 0.035,
  TAME_TRUST_PER_FEED: 1,
  TAME_FAIL_SCARE: 0.5,
  TAME_FEED_CD: 0.35,        /* evita doble gasto por repetición de input */
  TAME_MAX_COMPANIONS: 2,    /* base; Afinidad 10 lo sube a 4 */
  TAME_MAX_WITH_SKILL: 4,

  /* --- Economía y tierras --- */
  DEBT: 2000, KO_DEBT: 50, KO_MAT_LOSS: 0.22, KO_GOLD_LOSS: 0.10,
  BANK_RATE: 0.005, BANK_CAP: 14,
  PARCEL_BASE: 2.0, PARCEL_COUNT: 44, PARCEL_ESCALATE: 0.07,
  LAND_DEED_COST: 120,
  SLAVE_COST: 400, SLAVE_FOOD: 1, SLAVE_WORK_RATE: 0.8,
  TITLES: [
    { n: 18, name: 'Gran Señor de Vhalor', slaves: 5, guardDiscount: true },
    { n: 12, name: 'Noble Mayor', slaves: 4, guardDiscount: true },
    { n: 8, name: 'Noble Menor', slaves: 3, guardDiscount: true },
    { n: 5, name: 'Señor de Tierras', slaves: 2, guardDiscount: false },
    { n: 3, name: 'Terrateniente', slaves: 1, guardDiscount: false },
    { n: 1, name: 'Colono', slaves: 0, guardDiscount: false }
  ],
  SHOP_MARKUP: 2.4, TRUST_DISCOUNT: 0.16, TRUST_SELL_BONUS: 0.16,
  DEBT_ITEM_RATE: 0.8, QUALITY_MULT: [1, 1.5, 2.2, 3.0],
  REPAIR_COST_PER_DUR: 0.35, UPGRADE_FACTOR: 0.7,
  BROKEN_REPAIR_FACTOR: 0.5,
  GIFT_DIV: 10, GIFT_MAX: 15, SMALLTALK_DAILY: 3,
  WITNESS_RADIUS: 9, THEFT_FINE: 50, HEAT_DECAY: 2,
  BLESS_COST: 25, BLESS_XP: 0.12, CHARITY_COST: 10,

  /* --- Talleres públicos --- */
  PUBLIC_CRAFT_CD: 6, PUBLIC_FUEL_PLUS: 1,

  /* --- Ayuda en granjas --- */
  HELP_TASKS: {
    water:   { n: [6, 10], pay: 7,  trust: 5, xp: 14, label: 'Regar' },
    harvest: { n: [4, 7],  pay: 15, trust: 7, xp: 20, label: 'Cosechar' },
    plant:   { n: [5, 9],  pay: 9,  trust: 5, xp: 15, label: 'Sembrar' },
    feed:    { n: [2, 4],  pay: 12, trust: 6, xp: 16, label: 'Alimentar ganado' }
  },
  HELP_DEADLINE: 2,

  /* --- Dormir --- */
  SLEEP_OUTDOOR_AMBUSH: 0.34, SLEEP_OUTDOOR_HEAL: 0.72,
  SLEEP_MARKET_COST: 18, SLEEP_MARKET_HEAL: 0.82, SLEEP_MARKET_HP_CUT: 0.10,
  SLEEP_BED_HEAL: 1.0,

  /* --- Familia --- */
  CHILD_DAYS: [3, 5, 5], PREGNANCY_DAYS: 5,
  MARRY_TRUST: 80, RINGS_NEEDED: 2, WEDDING_COST: 50,

  /* --- Crafteo --- */
  CRAFT_RADIUS: 3.6, HAND_RECIPE_LIMIT: true,
  FUEL_PER_UNIT: { wood: 1, coal: 4, charcoal: 6 },
  SMELT_FUEL: 2, COOK_FUEL: 1, FORGE_FUEL: 3,

  /* --- Mundo --- */
  WATER_GROWTH: 1.35, DAY_START: 6, BOSS_RESPAWN: 5,
  FISH_WAIT: [2, 5], FISH_WINDOW: 0.95, FISH_BAIT_BONUS: 0.5,
  INV_SLOTS: 24,
  /* Cobre garantizado cerca delspawn: anillo de vetas semilladas */
  STARTER_COPPER: { count: 7, rMin: 13, rMax: 26 },

  TRUST_BANDS: [
    { min: 80, name: 'Devoción', cls: 'good' },
    { min: 40, name: 'Amistad', cls: 'good' },
    { min: -20, name: 'Neutral', cls: '' },
    { min: -60, name: 'Desconfianza', cls: 'bad' },
    { min: -100, name: 'Odio', cls: 'bad' }
  ]
};

/* ==========================================================
2 · TIERS DE HERRAMIENTA (v5)
   speed = multiplicador de cadencia de golpe (más = más rápido)
   dur   = usos antes de romperse (no se destruye: queda rota)
   pow   = poder de minado/tala; cada golpe hace pow-def.pow+1
========================================================== */
const TOOL_TIERS = [
  { id: 'stone',      name: 'Piedra',      mat: 'stone',          n: 3, pow: 1, speed: 0.62, dur: 80,  dmg: 6,  val: 12,  lv: 1,
    repair: { stone: 2, wood: 1 },        note: 'Lenta y se rompe pronto. Sirve para empezar.' },
  { id: 'copper',     name: 'Cobre',       mat: 'copper_bar',     n: 3, pow: 2, speed: 0.86, dur: 150, dmg: 10, val: 70,  lv: 5,
    repair: { copper_bar: 1, wood: 1 },   note: 'Primer salto real: casi el doble de rápido.' },
  { id: 'iron',       name: 'Hierro',      mat: 'iron_bar',       n: 3, pow: 3, speed: 1.06, dur: 260, dmg: 16, val: 170, lv: 7,
    repair: { iron_bar: 1, wood: 1 },     note: 'Estándar de trabajo. Vetas duras de un golpe.' },
  { id: 'steel',      name: 'Acero',       mat: 'steel_bar',      n: 3, pow: 4, speed: 1.26, dur: 360, dmg: 22, val: 340, lv: 9,
    repair: { steel_bar: 1, wood: 1 },    note: 'Rápido y muy duradero.' },
  { id: 'obsidian',   name: 'Obsidiana',   mat: 'obsidian_bar',   n: 2, pow: 5, speed: 1.38, dur: 320, dmg: 28, val: 480, lv: 13,
    repair: { obsidian_bar: 1, wood: 1 }, note: 'Filo vítreo: rapidísimo, algo menos durable.' },
  { id: 'mithril',    name: 'Mithril',     mat: 'mithril_bar',    n: 3, pow: 5, speed: 1.52, dur: 480, dmg: 30, val: 560, lv: 11,
    repair: { mithril_bar: 1, wood: 1 },  note: 'Ligero: casi no cansa y dura muchísimo.' },
  { id: 'adamantite', name: 'Adamantita',  mat: 'adamantite_bar', n: 3, pow: 6, speed: 1.72, dur: 640, dmg: 42, val: 950, lv: 16,
    repair: { adamantite_bar: 1, wood: 1 }, note: 'Lo mejor: un golpe por veta y dura una eternidad.' }
];
const TOOL_BY_ID = {};
TOOL_TIERS.forEach(function (t) { TOOL_BY_ID[t.id] = t; });

/* ==========================================================
3 · HABILIDADES
========================================================== */
const SKILLS = [
  { id: 'might', name: 'Fuerza', glyph: 'sword', max: 10,
    per: { melee: 0.06 }, unit: '% daño cuerpo a cuerpo',
    desc: 'Cada punto aumenta un 6 % el daño de espadas, lanzas y mazas.',
    unlocks: { 2: 'Ataque pesado cargado', 4: 'Combo de 4 golpes', 7: 'Golpe que rompe guardia', 10: 'Ejecución a enemigos bajo 20 % de vida' } },
  { id: 'vigor', name: 'Vigor', glyph: 'heart', max: 10,
    per: { hp: 9 }, unit: 'vida máxima',
    desc: 'Cada punto otorga 9 de vida máxima.',
    unlocks: { 3: 'Segundo aliento al caer una vez por día', 6: 'Resistencia a sangrado', 10: 'Piel de piedra: +8 defensa' } },
  { id: 'endurance', name: 'Aguante', glyph: 'stamina', max: 10,
    per: { st: 8, stRegen: 0.4 }, unit: 'stamina y regeneración',
    desc: 'Cada punto da 8 de stamina máxima y +0,4 de regeneración por segundo.',
    unlocks: { 2: 'Esquiva doble', 5: 'Bloqueo sin coste al hacer parry', 8: 'Correr sin gasto durante 3 s' } },
  { id: 'swiftness', name: 'Agilidad', glyph: 'sprint', max: 10,
    per: { speed: 0.045, rollCd: -0.045 }, unit: '% velocidad y menor enfriamiento',
    desc: 'Cada punto aumenta 4,5 % la velocidad y recorta la esquiva.',
    unlocks: { 3: 'Girar en el sitio sin perder impulso', 6: 'Esquiva con contraataque', 10: 'Sprint sin coste de stamina' } },
  { id: 'marks', name: 'Puntería', glyph: 'bow', max: 10,
    per: { ranged: 0.07, draw: -0.05 }, unit: '% daño a distancia y tensado',
    desc: 'Cada punto da 7 % de daño con arco y tensa un 5 % más rápido.',
    unlocks: { 2: 'Flechas elementales', 4: 'Disparo perforante (2 objetivos)', 7: 'Tiro en cámara lenta al tensar', 10: 'Flecha que revienta en área' } },
  { id: 'guard', name: 'Guardia', glyph: 'shield', max: 10,
    per: { block: 0.05, parry: 0.022, def: 2 }, unit: '% bloqueo, ventana de parry y defensa',
    desc: 'Cada punto mejora el bloqueo un 5 %, amplía el parry y suma 2 de defensa.',
    unlocks: { 2: 'Parry con contraataque', 5: 'Embate de escudo que aturde', 8: 'Bloqueo perfecto devuelve proyectiles', 10: 'Guardia inquebrantable' } },
  { id: 'beast', name: 'Afinidad', glyph: 'tame', max: 10,
    per: { tame: 0.11, petDmg: 0.07 }, unit: '% tameo y daño de compañeros',
    desc: 'Cada punto acelera el tameo un 11 % y fortalece a tus bestias un 7 %.',
    unlocks: { 1: 'Tameo por comida mejorado', 3: 'Monturas terrestres', 5: 'Dardos y sedación', 7: 'Monturas voladoras', 9: 'Compañero mítico', 10: 'Cuatro compañeros activos' } },
  { id: 'artisan', name: 'Oficio', glyph: 'craft', max: 10,
    per: { craftQ: 0.055, fuel: -0.045, yield: 0.045 }, unit: '% calidad, ahorro de combustible y rendimiento',
    desc: 'Cada punto mejora la calidad fabricada, gasta menos leña y rinde más material.',
    unlocks: { 1: 'Banco de trabajo', 2: 'Forja propia', 3: 'Cocina avanzada', 4: 'Herramientas de acero', 5: 'Alambique', 6: 'Obsidiana y mithril', 8: 'Forja maestra', 10: 'Recetas legendarias' } }
];
const SKILL_BY_ID = {};
SKILLS.forEach(function (s) { SKILL_BY_ID[s.id] = s; });

function levelFromXP(xp) {
  let lv = 1;
  for (let i = 1; i < BAL.LEVEL_XP.length; i++) if (xp >= BAL.LEVEL_XP[i]) lv = i + 1;
  return Math.min(BAL.LEVEL_XP.length, lv);
}
function pointsForLevel(lv) {
  let p = (lv - 1) * BAL.POINTS_PER_LEVEL;
  p += Math.floor((lv - 1) / BAL.POINTS_MILESTONE) * BAL.POINTS_MILESTONE_BONUS;
  return p;
}
function meetsReq(req, level, alloc) {
  if (!req) return true;
  if (req.lv && level < req.lv) return false;
  if (req.skill) for (const k in req.skill) if ((alloc[k] || 0) < req.skill[k]) return false;
  return true;
}
function reqText(req) {
  if (!req) return '';
  const parts = [];
  if (req.lv) parts.push('Nivel ' + req.lv);
  if (req.skill) for (const k in req.skill) parts.push((SKILL_BY_ID[k] ? SKILL_BY_ID[k].name : k) + ' ' + req.skill[k]);
  return parts.join(' · ');
}
function tierOfLevel(lv) {
  const b = BAL.TIER_BOUNDS;
  if (lv <= b[0]) return 1;
  if (lv <= b[1]) return 2;
  return 3;
}
function tierRange(t) {
  const b = BAL.TIER_BOUNDS;
  if (t === 1) return '1–' + b[0];
  if (t === 2) return (b[0] + 1) + '–' + b[1];
  return (b[1] + 1) + '–' + b[2];
}

/* ==========================================================
4 · ESTACIONES (6) Y SABERES
========================================================== */
const STATIONS = ['hand', 'campfire', 'workbench', 'kitchen', 'forge', 'alchemy'];
const STATION_INFO = {
  hand:      { name: 'A mano',           glyph: 'interact', fuel: 0, building: null,        req: null,
               desc: 'Sin mesa ni nivel: pico, hacha y azada de piedra, caña y arco de madera, flechas caseras, cuerda, antorchas, vendas y petate.' },
  campfire:  { name: 'Fogata',           glyph: 'fire',     fuel: 1, building: 'campfire',  req: null,
               desc: 'Asa carne y pescado, hierve agua y hace carbón vegetal. Consume leña.' },
  workbench: { name: 'Banco de trabajo', glyph: 'build',    fuel: 0, building: 'workbench', req: { lv: 2, skill: { artisan: 1 } },
               desc: 'Herramientas, cuero, tela, arcos, flechas, mochilas, camas y muebles.' },
  kitchen:   { name: 'Cocina',           glyph: 'food',     fuel: 1, building: 'kitchen',   req: { lv: 3, skill: { artisan: 1 } },
               desc: 'Guisos, panes, tartas, harina y aceite. Consume leña.' },
  forge:     { name: 'Forja',            glyph: 'craft',    fuel: 2, building: 'forge',     req: { lv: 5, skill: { artisan: 2 } },
               desc: 'Funde mineral y forja armas, armaduras y escudos.' },
  alchemy:   { name: 'Alambique',        glyph: 'potion',   fuel: 1, building: 'alchemy',   req: { lv: 10, skill: { artisan: 5 } },
               desc: 'Pociones, elixires, antídotos, dardos y ungüentos.' }
};
const MERCHANT_STATIONS = {
  dorn:    { stations: ['forge'], fee: 0.35 },
  voss:    { stations: ['workbench'], fee: 0.25 },
  maera:   { stations: ['alchemy'], fee: 0.30 },
  finn:    { stations: ['campfire', 'kitchen'], fee: 0.20 },
  supremo: { stations: ['workbench'], fee: 0.20 },
  hunter:  { stations: ['workbench'], fee: 0.28 }
};
const SABERS = [
  { id: 'smith',   name: 'Fundición y forja', glyph: 'fire',      tier: 1, desc: 'Lingotes, armas, herramientas y armaduras de metal.' },
  { id: 'craft',   name: 'Oficio de banco',   glyph: 'build',     tier: 1, desc: 'Mochilas, camas, cuero, tela, arcos, flechas y muebles.' },
  { id: 'cook',    name: 'Cocina de campaña', glyph: 'food',      tier: 1, desc: 'Platos que curan y dan vigor; harina, aceite y conservas.' },
  { id: 'field',   name: 'Campo y granja',    glyph: 'role_farm', tier: 1, desc: 'Azadas y regaderas mejores, fertilizantes y piensos.' },
  { id: 'alchemy', name: 'Alquimia',          glyph: 'potion',    tier: 2, desc: 'Pociones, vendas avanzadas, dardos y elixires.' },
  { id: 'master',  name: 'Maestría mayor',    glyph: 'crown',     tier: 3, desc: 'Mithril, adamantita, legendarios y platos de maestro.' }
];
const SABER_BY_ID = {};
SABERS.forEach(function (s) { SABER_BY_ID[s.id] = s; });

/* ==========================================================
5 · MÉTODOS DE TAMEO (guía)
========================================================== */
const TAME_METHODS = {
  feed:   { name: 'Por comida', glyph: 'feed',
            desc: 'Acércate con el alimento en la mochila y pulsa Interactuar repetidas veces. Cada comida suma confianza hasta completar la barra.' },
  sedate: { name: 'Por sedación', glyph: 'potion',
            desc: 'Baja su vida por debajo del 60 %, lanza un dardo narcótico o una flecha somnífera y aliméntalo mientras duerme (42 s). Si despierta sin domar conserva la mitad del progreso.' },
  bond:   { name: 'Por vínculo', glyph: 'heart',
            desc: 'Quédate quieto y cerca sin atacar hasta llenar la barra de calma; después ofrécele su alimento. Correr o golpear rompe la calma.' }
};

/* ==========================================================
6 · BIOMAS (12) · cobre repartido y accesible
========================================================== */
function biome(id, key, name, base, alt, decor, water, nodes, spawns, fish, density) {
  return { id: id, key: key, name: name, base: base, alt: alt, decor: decor, water: water,
           nodes: nodes, spawns: spawns, fish: fish, density: density };
}
const BIOMES = [
  biome(0, 'meadow', 'Pradera', '#6fae4e', '#7dbb58', '#8fcf6a', '#2e6f9e',
    [['grass', 30], ['bush', 12], ['tree', 6], ['herb_plant', 8], ['clay_patch', 3], ['rock', 5], ['copper_node', 3]],
    [['horse', 3], ['deer', 4], ['rabbit', 5], ['boar', 2], ['bison', 1], ['wolf', 1]],
    [['fish_trout', 60], ['fish_sardine', 40]], 0.070),
  biome(1, 'forest', 'Bosque', '#4c8a3f', '#57964a', '#68a858', '#2e6f9e',
    [['tree', 34], ['apple_tree', 8], ['bush', 10], ['herb_plant', 8], ['honey_node', 2], ['grass', 12], ['rock', 4], ['copper_node', 3]],
    [['deer', 3], ['boar', 3], ['rabbit', 3], ['fox', 2], ['wolf', 3], ['lynx', 2], ['bear', 1]],
    [['fish_trout', 80], ['fish_sardine', 20]], 0.150),
  biome(2, 'swamp', 'Pantano', '#5a7a4a', '#4f6f42', '#6b8a55', '#3a5f52',
    [['tree', 12], ['herb_plant', 14], ['grass', 16], ['clay_patch', 8], ['rock', 6]],
    [['frog', 4], ['crocodile', 3], ['skeleton', 2], ['basilisk', 1]],
    [['fish_catfish', 85], ['fish_void', 15]], 0.085),
  biome(3, 'desert', 'Desierto', '#d8b56a', '#e0c078', '#e8cc8a', '#2e8fae',
    [['rock', 16], ['coal_node', 6], ['sand_patch', 12], ['grass', 4], ['gold_node', 1], ['sulfur_node', 3], ['copper_node', 4]],
    [['camel', 3], ['scorpion', 4], ['skeleton', 2], ['sand_stalker', 1]],
    [['fish_dune', 90], ['fish_sardine', 10]], 0.050),
  biome(4, 'tundra', 'Tundra Nevada', '#dfe8ee', '#cfdde6', '#f2f7fa', '#5a8fae',
    [['tree', 14], ['rock', 12], ['iron_node', 5], ['ice_node', 8], ['grass', 4], ['copper_node', 4]],
    [['reindeer', 4], ['fox', 2], ['wolf', 3], ['lynx', 2], ['polar_bear', 1]],
    [['fish_ice', 85], ['fish_trout', 15]], 0.080),
  biome(5, 'mountain', 'Montaña', '#8d8a80', '#9a978c', '#aaa79c', '#3a6f8e',
    [['rock', 24], ['copper_node', 12], ['iron_node', 10], ['coal_node', 8], ['mithril_node', 4], ['gold_node', 2], ['flint_node', 6]],
    [['goat', 4], ['llama', 3], ['wolf', 2], ['skeleton', 2], ['griffin', 1], ['condor', 1]],
    [['fish_trout', 90], ['fish_ice', 10]], 0.140),
  biome(6, 'beach', 'Costa', '#e6d29a', '#efdca6', '#f5e6b8', '#2e7fae',
    [['rock', 8], ['grass', 8], ['bush', 4], ['sand_patch', 14], ['copper_node', 3]],
    [['crab', 6], ['seal', 3], ['turtle', 3]],
    [['fish_sardine', 85], ['fish_dune', 15]], 0.045),
  biome(7, 'corrupt', 'Tierras Corruptas', '#6a4a7a', '#7a5588', '#8a6598', '#4a3a6e',
    [['crystal_node', 8], ['adamantite_node', 4], ['rock', 10], ['dead_tree', 6]],
    [['skeleton', 4], ['warg', 3], ['shadow_hound', 3], ['nightmare', 1], ['cerberus', 1]],
    [['fish_void', 70], ['fish_catfish', 30]], 0.100),
  biome(8, 'volcanic', 'Cenizal', '#5a4038', '#6a4a40', '#7a5548', '#8a3a20',
    [['rock', 18], ['copper_node', 10], ['sulfur_node', 12], ['coal_node', 12], ['iron_node', 8], ['obsidian_node', 5]],
    [['ember_sprite', 3], ['salamander', 2], ['wyvern', 1], ['skeleton', 1]],
    [['fish_dune', 60], ['fish_void', 40]], 0.110),
  biome(9, 'jungle', 'Jungla', '#3a7a3a', '#448844', '#54a054', '#2a6a5a',
    [['tree', 40], ['bush', 16], ['herb_plant', 14], ['grass', 14], ['honey_node', 4], ['rock', 4], ['copper_node', 3]],
    [['frog', 3], ['boar', 3], ['crocodile', 2], ['lynx', 2], ['manticore', 1]],
    [['fish_catfish', 70], ['fish_trout', 30]], 0.185),
  biome(10, 'highland', 'Altiplano', '#a8a878', '#b4b484', '#c4c494', '#4a7f9e',
    [['rock', 18], ['grass', 18], ['copper_node', 9], ['flint_node', 8], ['iron_node', 5], ['tree', 6]],
    [['goat', 4], ['reindeer', 3], ['condor', 2], ['pegasus', 1], ['wolf', 2]],
    [['fish_trout', 80], ['fish_ice', 20]], 0.075),
  biome(11, 'deepwood', 'Bosque Umbrío', '#2e5a3a', '#356442', '#417a4e', '#254f4a',
    [['tree', 44], ['dead_tree', 8], ['herb_plant', 10], ['bush', 12], ['crystal_node', 2], ['rock', 4]],
    [['deer', 2], ['boar', 2], ['bear', 2], ['wolf', 3], ['unicorn', 1], ['kirin', 1], ['willowisp', 2]],
    [['fish_trout', 60], ['fish_void', 40]], 0.200)
];

/* ==========================================================
7 · SANTUARIOS (10)
========================================================== */
const ZONES = [
  { id: 'aerie', name: 'Nido del Grifo', biome: 5, r: 22, unique: true,
    species: ['griffin'], guard: ['condor'], boss: null, leash: 26, tint: '#d8bc6a', glyph: 'fly',
    lore: 'Un risco de viento cortado donde los grifos crían. Nadie sube dos veces sin permiso.' },
  { id: 'fen', name: 'Ciénaga de la Hidra', biome: 2, r: 24, unique: true,
    species: [], guard: ['crocodile', 'frog'], boss: 'hydra', leash: 22, tint: '#8ae04a', glyph: 'poison',
    lore: 'El agua hierve verde. Tres cabezas cuentan los pasos de quien se acerca.' },
  { id: 'caldera', name: 'Caldera del Fénix', biome: 8, r: 22, unique: true,
    species: ['ember_sprite'], guard: ['salamander'], boss: 'phoenix', leash: 24, tint: '#ff8a30', glyph: 'fire',
    lore: 'Ceniza que nunca se enfría. Aquí el fuego recuerda haber sido ave.' },
  { id: 'hold', name: 'Fortaleza del Rey Troll', biome: 5, r: 20, unique: true,
    species: [], guard: ['troll_kin'], boss: 'troll_king', leash: 20, tint: '#8aa876', glyph: 'crown',
    lore: 'Piedras apiladas por manos que no conocen la plomada. Un rey corona su propia ruina.' },
  { id: 'glade', name: 'Claro del Unicornio', biome: 11, r: 20, unique: true,
    species: ['unicorn', 'kirin'], guard: ['willowisp'], boss: null, leash: 24, tint: '#bfe4f5', glyph: 'star',
    lore: 'La luz cae recta aunque el bosque esté cerrado. Solo se acercan los que no mienten.' },
  { id: 'crag', name: 'Risco del Wyvern', biome: 10, r: 22, unique: true,
    species: ['wyvern', 'manticore'], guard: ['condor'], boss: null, leash: 26, tint: '#c88a68', glyph: 'fly',
    lore: 'Huesos de cabra y de pastor. El viento trae un chillido que no es de pájaro.' },
  { id: 'barrow', name: 'Túmulo del Sabueso', biome: 7, r: 22, unique: true,
    species: ['shadow_hound', 'cerberus'], guard: ['skeleton', 'warg'], boss: 'fenrir', leash: 24, tint: '#9a6ae0', glyph: 'boss',
    lore: 'Un túmulo abierto por dentro. Algo con tres gargantas respira bajo la tierra.' },
  { id: 'frost', name: 'Trono de Escarcha', biome: 4, r: 22, unique: true,
    species: [], guard: ['polar_bear', 'wolf'], boss: 'jotun_frost', leash: 22, tint: '#bfe4f5', glyph: 'snow',
    lore: 'Un gigante sentado desde antes de la muralla. El hielo le ha crecido por la barba.' },
  { id: 'wyrm', name: 'Falla del Dragón', biome: 8, r: 24, unique: true,
    species: ['salamander'], guard: ['ember_sprite'], boss: 'dragon_ember', leash: 26, tint: '#ff7a30', glyph: 'fire',
    lore: 'La roca está vitrificada. Algo enorme duerme con un ojo abierto.' },
  { id: 'mirror', name: 'Lago Espejo', biome: 10, r: 18, unique: true,
    species: ['pegasus'], guard: [], boss: null, leash: 22, tint: '#8fd0f0', glyph: 'water',
    lore: 'El agua devuelve un cielo que no es el de arriba. Caballos alados beben sin mojarse.' }
];
const ZONE_BY_ID = {};
ZONES.forEach(function (z) { ZONE_BY_ID[z.id] = z; });

/* ==========================================================
8 · NODOS · golpes recalibrados por tier
   Con pico de piedra (pow 1) cada golpe hace 1: el cobre tarda
   5 golpes (~2,8 s). Con hierro (pow 3) hace 3: 2 golpes.
========================================================== */
const NODES = {
  tree:        { name: 'Árbol', tool: 'axe', pow: 1, hits: 4, stam: BAL.ST_CHOP, respawn: 3, xp: BAL.XP_CHOP, tint: '#3e6b2f',
                 drops: [['wood', 2, 3, 1], ['fiber', 1, 1, 0.35]] },
  apple_tree:  { name: 'Manzano', tool: 'axe', pow: 1, hits: 4, stam: BAL.ST_CHOP, respawn: 3, xp: BAL.XP_CHOP, tint: '#4a7a35',
                 drops: [['wood', 1, 2, 1], ['apple', 1, 3, 0.85]] },
  dead_tree:   { name: 'Árbol muerto', tool: 'axe', pow: 1, hits: 3, stam: BAL.ST_CHOP, respawn: 4, xp: BAL.XP_CHOP, tint: '#5a4a3a',
                 drops: [['wood', 1, 2, 1], ['coal', 1, 1, 0.4], ['bone', 1, 1, 0.2]] },
  rock:        { name: 'Roca', tool: 'pick', pow: 1, hits: 3, stam: BAL.ST_MINE, respawn: 4, xp: BAL.XP_MINE, tint: '#8a8a82',
                 drops: [['stone', 2, 3, 1], ['flint', 1, 1, 0.25]] },
  coal_node:   { name: 'Veta de carbón', tool: 'pick', pow: 1, hits: 4, stam: BAL.ST_MINE, respawn: 5, xp: BAL.XP_MINE, tint: '#3a3a3a',
                 drops: [['coal', 1, 3, 1], ['stone', 1, 1, 0.5]] },
  copper_node: { name: 'Veta de cobre', tool: 'pick', pow: 1, hits: 5, stam: BAL.ST_MINE, respawn: 4, xp: BAL.XP_MINE + 2, tint: '#c77b3a',
                 drops: [['copper_ore', 1, 3, 1], ['stone', 1, 1, 0.4]] },
  iron_node:   { name: 'Veta de hierro', tool: 'pick', pow: 2, hits: 5, stam: BAL.ST_MINE, respawn: 5, xp: BAL.XP_MINE, tint: '#a8b0b8',
                 drops: [['iron_ore', 1, 2, 1]] },
  mithril_node:{ name: 'Veta de mithril', tool: 'pick', pow: 3, hits: 6, stam: BAL.ST_MINE, respawn: 6, xp: BAL.XP_MINE, tint: '#5ac8e0',
                 drops: [['mithril_ore', 1, 2, 1]] },
  adamantite_node: { name: 'Veta de adamantita', tool: 'pick', pow: 5, hits: 7, stam: BAL.ST_MINE, respawn: 7, xp: BAL.XP_MINE, tint: '#9a5ae0',
                 drops: [['adamantite_ore', 1, 1, 1]] },
  gold_node:   { name: 'Veta de oro', tool: 'pick', pow: 3, hits: 6, stam: BAL.ST_MINE, respawn: 7, xp: BAL.XP_MINE, tint: '#e0c040',
                 drops: [['gold_nugget', 1, 1, 1]] },
  crystal_node:{ name: 'Cristal corrupto', tool: 'pick', pow: 4, hits: 6, stam: BAL.ST_MINE, respawn: 6, xp: BAL.XP_MINE, tint: '#b06ae0',
                 drops: [['crystal', 1, 2, 1]] },
  sulfur_node: { name: 'Azufre', tool: 'pick', pow: 2, hits: 4, stam: BAL.ST_MINE, respawn: 5, xp: BAL.XP_MINE, tint: '#d8c040',
                 drops: [['sulfur', 1, 2, 1]] },
  obsidian_node: { name: 'Obsidiana', tool: 'pick', pow: 4, hits: 7, stam: BAL.ST_MINE, respawn: 7, xp: BAL.XP_MINE, tint: '#2a2030',
                 drops: [['obsidian', 1, 1, 1], ['stone', 1, 2, 0.6]] },
  flint_node:  { name: 'Sílex', tool: 'pick', pow: 1, hits: 3, stam: BAL.ST_MINE, respawn: 4, xp: BAL.XP_MINE, tint: '#6a6a62',
                 drops: [['flint', 1, 2, 1]] },
  ice_node:    { name: 'Hielo puro', tool: 'pick', pow: 2, hits: 4, stam: BAL.ST_MINE, respawn: 4, xp: BAL.XP_MINE, tint: '#bfe4f5',
                 drops: [['ice_shard', 1, 2, 1]] },
  clay_patch:  { name: 'Arcilla', tool: 'hand', pow: 0, hits: 2, stam: 3, respawn: 4, xp: 5, tint: '#a8785a',
                 drops: [['clay', 1, 3, 1]] },
  sand_patch:  { name: 'Arena fina', tool: 'hand', pow: 0, hits: 1, stam: 2, respawn: 3, xp: 3, tint: '#e8d8a8',
                 drops: [['sand', 1, 3, 1]] },
  bush:        { name: 'Arbusto', tool: 'hand', pow: 0, hits: 1, stam: 2, respawn: 2, xp: 3, tint: '#5a8a3a',
                 drops: [['fiber', 1, 2, 1], ['berry', 1, 2, 0.75]] },
  grass:       { name: 'Hierba alta', tool: 'hand', pow: 0, hits: 1, stam: 1, respawn: 1, xp: 2, tint: '#7aae4e',
                 drops: [['fiber', 1, 1, 1], ['hay', 1, 1, 0.6], ['seed_wheat', 1, 1, 0.10]] },
  herb_plant:  { name: 'Hierba medicinal', tool: 'hand', pow: 0, hits: 1, stam: 1, respawn: 3, xp: 4, tint: '#4aae7a',
                 drops: [['herb', 1, 2, 1], ['seed_herb', 1, 1, 0.12]] },
  honey_node:  { name: 'Colmena silvestre', tool: 'hand', pow: 0, hits: 2, stam: 3, respawn: 5, xp: 6, tint: '#e0a030',
                 drops: [['honey', 1, 2, 1], ['beeswax', 1, 1, 0.5]] }
};

/* ==========================================================
9 · CULTIVOS (24)
========================================================== */
const CROPS = {};
const CROP_ROWS = [
  ['wheat', 'Trigo', 6, 2, 'grain'], ['carrot', 'Zanahoria', 8, 2, 'root'],
  ['potato', 'Patata', 9, 3, 'root'], ['tomato', 'Tomate', 11, 3, 'fruit'],
  ['pumpkin', 'Calabaza', 16, 4, 'fruit'], ['onion', 'Cebolla', 7, 2, 'bulb'],
  ['lettuce', 'Lechuga', 6, 2, 'leaf'], ['garlic', 'Ajo', 8, 2, 'bulb'],
  ['corn', 'Maíz', 10, 3, 'grain'], ['cabbage', 'Col', 9, 3, 'leaf'],
  ['pepper', 'Ají', 12, 3, 'fruit'], ['sweetpotato', 'Camote', 11, 3, 'root'],
  ['rice', 'Arroz', 8, 3, 'grain'], ['quinoa', 'Quinua', 10, 3, 'grain'],
  ['maca', 'Maca', 14, 4, 'root'], ['sunflower', 'Girasol', 12, 3, 'seedpod'],
  ['strawberry', 'Fresa', 13, 3, 'fruit'], ['grape', 'Uva', 15, 4, 'vine'],
  ['melon', 'Melón', 18, 4, 'fruit'], ['cotton', 'Algodón', 14, 4, 'fiber'],
  ['flax', 'Lino', 12, 3, 'fiber'], ['herb', 'Hierba medicinal', 15, 3, 'leaf'],
  ['bean', 'Judía', 9, 2, 'vine'], ['beet', 'Remolacha', 11, 3, 'root']
];
CROP_ROWS.forEach(function (c) {
  CROPS[c[0]] = { id: c[0], name: c[1], seed: 'seed_' + c[0], product: 'crop_' + c[0],
                  days: c[3], value: c[2], form: c[4] };
});

/* ==========================================================
10 · NUTRICIÓN, MUNICIONES Y ESCUDOS
========================================================== */
const FOOD_SIZE = { tiny: 4, small: 9, medium: 16, large: 26, feast: 38 };
const FOOD_PREP = { raw: 0.62, simple: 1.0, cooked: 1.22, refined: 1.45, master: 1.7 };
const FOOD_RARITY = { common: 1.0, uncommon: 1.15, rare: 1.35, exotic: 1.6 };
function nutrition(size, prep, rarity, extra) {
  const base = (FOOD_SIZE[size] || 9) * (FOOD_PREP[prep] || 1) * (FOOD_RARITY[rarity] || 1);
  const e = extra || {};
  return {
    food: Math.round(base * (e.foodMul === undefined ? 1 : e.foodMul)),
    hp: Math.round((e.hp === undefined ? base * 0.20 : e.hp)),
    st: Math.round((e.st === undefined ? base * 0.34 : e.st)),
    buff: e.buff || null, buffT: e.buffT || 0,
    cure: e.cure || null, size: size, prep: prep, rarity: rarity
  };
}
const AMMO_KINDS = {
  basic:   { name: 'Básica',    glyph: 'arrow',  dmg: 1.00, effect: null,     desc: 'Flecha corriente de sílex y pluma.' },
  iron:    { name: 'Pesada',    glyph: 'arrow',  dmg: 1.25, effect: null,     desc: 'Punta de hierro: más daño y perforación.' },
  fire:    { name: 'Ígnea',     glyph: 'fire',   dmg: 1.05, effect: 'burn',   desc: 'Arde al impactar y prende al objetivo.' },
  ice:     { name: 'Gélida',    glyph: 'snow',   dmg: 1.00, effect: 'slow',   desc: 'Ralentiza y apaga fuegos.' },
  poison:  { name: 'Veneno',    glyph: 'poison', dmg: 0.90, effect: 'poison', desc: 'Deja un veneno persistente.' },
  barbed:  { name: 'Dentada',   glyph: 'cross',  dmg: 1.10, effect: 'bleed',  desc: 'Provoca sangrado prolongado.' },
  tame:    { name: 'Somnífera', glyph: 'tame',   dmg: 0.25, effect: 'sedate', desc: 'No mata: adormece para poder tamear.' },
  bolt:    { name: 'Virote',    glyph: 'arrow',  dmg: 1.45, effect: null,     desc: 'Para ballesta. Lento de recargar, brutal.' },
  mythril: { name: 'Mithril',   glyph: 'star',   dmg: 1.70, effect: 'pierce', desc: 'Atraviesa dos enemigos y no se desvía.' }
};
const SHIELD_KINDS = {
  buckler: { name: 'Broquel',        reduce: 0.48, parry: 0.30, arc: 1.5, weight: 0.6,  bash: 0.6, desc: 'Ligero: parry generoso, bloqueo modesto.' },
  round:   { name: 'Escudo redondo', reduce: 0.62, parry: 0.22, arc: 1.8, weight: 1.0,  bash: 1.0, desc: 'Equilibrio entre bloqueo y movilidad.' },
  kite:    { name: 'Escudo cometa',  reduce: 0.72, parry: 0.18, arc: 2.1, weight: 1.35, bash: 1.2, desc: 'Cubre el flanco y las piernas.' },
  tower:   { name: 'Pavés',          reduce: 0.86, parry: 0.12, arc: 2.5, weight: 1.9,  bash: 1.5, desc: 'Muro portátil: lento pero casi impenetrable.' },
  spiked:  { name: 'Escudo de púas', reduce: 0.66, parry: 0.16, arc: 1.8, weight: 1.25, bash: 1.9, desc: 'El embate hiere y hace sangrar.' },
  warding: { name: 'Égida rúnica',   reduce: 0.78, parry: 0.26, arc: 2.2, weight: 1.1,  bash: 1.1, desc: 'Absorbe fuego, veneno y corrupción.' }
};
const ROLES = [
  { id: 'farm', name: 'Sembrar y cosechar', glyph: 'role_farm' },
  { id: 'water', name: 'Regar cultivos', glyph: 'role_water' },
  { id: 'tend', name: 'Cuidar animales', glyph: 'role_tend' },
  { id: 'guard', name: 'Proteger la casa', glyph: 'role_guard' },
  { id: 'follow', name: 'Seguirte y combatir', glyph: 'role_follow' },
  { id: 'haul', name: 'Recoger recursos', glyph: 'role_haul' },
  { id: 'idle', name: 'Descansar', glyph: 'role_idle' }
];

/* ==========================================================
11 · REGISTRO ABIERTO
========================================================== */
const ITEMS = {}, SPECIES = {}, BUILDINGS = {}, NPCS = {}, RECIPES = [], QUESTS = [];
const HELP = [], TIPS = [], NAMES = { male: [], female: [] };
const errors = [];

const DEF = CR.DEF = {
  item: function (id, d) {
    d.id = id;
    if (d.stack === undefined) d.stack = 99;
    if (d.value === undefined) d.value = 1;
    if (!d.desc) d.desc = '';
    if (!d.cat) d.cat = 'misc';
    ITEMS[id] = d;
    return d;
  },
  recipe: function (outId, n, ing, station, opts) {
    const o = opts || {};
    const req = o.req || (STATION_INFO[station] ? STATION_INFO[station].req : null) || null;
    const r = {
      id: o.id || ('r_' + outId + (n > 1 ? '_x' + n : '')),
      out: { id: outId, n: n || 1 },
      in: ing || [],
      station: station || 'hand',
      fuel: o.fuel === undefined ? (STATION_INFO[station] ? STATION_INFO[station].fuel : 0) : o.fuel,
      req: req,
      skill: o.skill || null,
      xp: o.xp === undefined ? BAL.XP_CRAFT : o.xp,
      hand: !!o.hand,
      saber: o.saber || null,
      tier: tierOfLevel(req && req.lv ? req.lv : 1)
    };
    RECIPES.push(r);
    return r;
  },
  species: function (id, d) { d.id = id; SPECIES[id] = d; return d; },
  building: function (id, d) { d.id = id; BUILDINGS[id] = d; return d; },
  npc: function (id, d) { d.id = id; NPCS[id] = d; return d; },
  quest: function (d) { QUESTS.push(d); return d; },
  help: function (title, text, glyph) { HELP.push({ title: title, text: text, glyph: glyph || 'book' }); },
  tip: function (t) { TIPS.push(t); },
  nutrition: nutrition, meetsReq: meetsReq, reqText: reqText,
  tierOfLevel: tierOfLevel, tierRange: tierRange,
  errors: errors,

  validate: function () {
    function has(id, where) { if (!ITEMS[id]) errors.push('Ítem inexistente: ' + id + (where ? ' (en ' + where + ')' : '')); }
    RECIPES.forEach(function (r) {
      has(r.out.id, r.id);
      if (STATIONS.indexOf(r.station) < 0) errors.push('Estación inválida: ' + r.station + ' en ' + r.id);
      r.in.forEach(function (i) {
        if (i.id) has(i.id, r.id);
        else if (['fish', 'meat', 'grain', 'vegetable', 'fruit', 'fuel', 'herbany'].indexOf(i.tag) < 0)
          errors.push('Tag inválido: ' + i.tag + ' en ' + r.id);
      });
      if (r.req && r.req.skill) for (const k in r.req.skill) if (!SKILL_BY_ID[k]) errors.push('Skill inválida en ' + r.id);
      if (r.saber && !SABER_BY_ID[r.saber]) errors.push('Saber inexistente en ' + r.id + ': ' + r.saber);
    });
    Object.keys(NODES).forEach(function (k) { NODES[k].drops.forEach(function (d) { has(d[0], 'nodo ' + k); }); });
    Object.keys(CROPS).forEach(function (k) { has(CROPS[k].seed, 'cultivo ' + k); has(CROPS[k].product, 'cultivo ' + k); });
    Object.keys(SPECIES).forEach(function (k) {
      const s = SPECIES[k];
      (s.drops || []).forEach(function (d) { has(d[0], 'especie ' + k); });
      if (s.tame) {
        (s.tame.foods || []).forEach(function (f) { has(f, 'tameo ' + k); });
        if (!s.tame.foods || !s.tame.foods.length) errors.push('Tameo sin alimentos: ' + k);
        if (!TAME_METHODS[s.tame.method]) errors.push('Método de tameo inválido: ' + k);
      }
      if (s.mount) has(s.mount.saddle, 'montura ' + k);
      if (s.livestock) has(s.livestock.product, 'ganado ' + k);
      if (s.boss) has(s.boss.unique, 'jefe ' + k);
      if (!s.diet) errors.push('Especie sin dieta: ' + k);
      if (!s.faction) errors.push('Especie sin facción: ' + k);
    });
    Object.keys(BUILDINGS).forEach(function (k) {
      Object.keys(BUILDINGS[k].cost || {}).forEach(function (i) { has(i, 'edificio ' + k); });
      (BUILDINGS[k].functions || []).forEach(function (f) {
        if (STATIONS.indexOf(f) >= 0) return;
        if (['sleep', 'chest', 'livestock', 'mounts', 'gate', 'guard_post', 'guardian', 'water_source', 'light', 'scare'].indexOf(f) < 0)
          errors.push('Función desconocida en ' + k + ': ' + f);
      });
    });
    Object.keys(STATION_INFO).forEach(function (s) {
      const info = STATION_INFO[s];
      if (info.building && !BUILDINGS[info.building]) errors.push('Estación sin edificio: ' + s);
    });
    Object.keys(MERCHANT_STATIONS).forEach(function (n) {
      MERCHANT_STATIONS[n].stations.forEach(function (s) {
        if (STATIONS.indexOf(s) < 0) errors.push('Taller inválido en ' + n + ': ' + s);
      });
    });
    Object.keys(NPCS).forEach(function (k) {
      const n = NPCS[k];
      if (!n.dlg || !n.dlg.nodes.root) errors.push('NPC sin diálogo raíz: ' + k);
      if (n.shop) (n.shop.sells || []).forEach(function (i) { has(i, 'tienda ' + k); });
      (n.loves || []).forEach(function (i) { has(i, 'gustos ' + k); });
    });
    QUESTS.forEach(function (q) {
      if (q.kind === 'gather' && !ITEMS[q.item]) errors.push('Contrato sin objeto: ' + q.id);
      if (q.kind === 'hunt' && q.target && !SPECIES[q.target]) errors.push('Contrato sin especie: ' + q.id);
    });
    BIOMES.forEach(function (b) {
      b.nodes.forEach(function (n) { if (!NODES[n[0]]) errors.push('Nodo inválido en ' + b.key + ': ' + n[0]); });
      b.spawns.forEach(function (s) { if (!SPECIES[s[0]]) errors.push('Spawn inválido en ' + b.key + ': ' + s[0]); });
      b.fish.forEach(function (f) { has(f[0], 'pesca ' + b.key); });
    });
    ZONES.forEach(function (z) {
      (z.species || []).forEach(function (s) { if (!SPECIES[s]) errors.push('Zona ' + z.id + ' → especie ' + s); });
      (z.guard || []).forEach(function (s) { if (!SPECIES[s]) errors.push('Zona ' + z.id + ' → guardián ' + s); });
      if (z.boss && !SPECIES[z.boss]) errors.push('Zona ' + z.id + ' → jefe ' + z.boss);
    });
    return errors.length === 0;
  },
  seal: function () {
    Object.keys(ITEMS).forEach(function (k) { Object.freeze(ITEMS[k]); });
    Object.keys(SPECIES).forEach(function (k) { Object.freeze(SPECIES[k]); });
    Object.freeze(ITEMS); Object.freeze(SPECIES); Object.freeze(BUILDINGS);
    Object.freeze(NPCS); Object.freeze(RECIPES); Object.freeze(CROPS);
    Object.freeze(NODES); Object.freeze(QUESTS); Object.freeze(BIOMES);
    Object.freeze(ZONES); Object.freeze(SKILLS); Object.freeze(SABERS);
    Object.freeze(TOOL_TIERS); Object.freeze(TAME_METHODS);
  }
};

/* ==========================================================
12 · CONTRATO PÚBLICO
========================================================== */
CR.DATA = {
  BAL: BAL,
  TOOL_TIERS: TOOL_TIERS, TOOL_BY_ID: TOOL_BY_ID,
  TAME_METHODS: TAME_METHODS,
  SKILLS: SKILLS, SKILL_BY_ID: SKILL_BY_ID,
  levelFromXP: levelFromXP, pointsForLevel: pointsForLevel,
  meetsReq: meetsReq, reqText: reqText,
  tierOfLevel: tierOfLevel, tierRange: tierRange,
  SABERS: SABERS, SABER_BY_ID: SABER_BY_ID,
  STATIONS: STATIONS, STATION_INFO: STATION_INFO, MERCHANT_STATIONS: MERCHANT_STATIONS,
  BIOMES: BIOMES, ZONES: ZONES, ZONE_BY_ID: ZONE_BY_ID,
  NODES: NODES, CROPS: CROPS,
  FOOD_SIZE: FOOD_SIZE, FOOD_PREP: FOOD_PREP, FOOD_RARITY: FOOD_RARITY, nutrition: nutrition,
  AMMO_KINDS: AMMO_KINDS, SHIELD_KINDS: SHIELD_KINDS,
  ROLES: ROLES,
  ITEMS: ITEMS, SPECIES: SPECIES, BUILDINGS: BUILDINGS, NPCS: NPCS,
  RECIPES: RECIPES, QUESTS: QUESTS, HELP: HELP, TIPS: TIPS, NAMES: NAMES,
  errors: errors
};

console.info('[CR] data.js v5 · ' + TOOL_TIERS.length + ' tiers de herramienta · cobre en ' +
  BIOMES.filter(function (b) { return b.nodes.some(function (n) { return n[0] === 'copper_node'; }); }).length +
  ' biomas · ' + BIOMES.length + ' biomas · ' + ZONES.length + ' santuarios · ' + STATIONS.length + ' estaciones');
})();