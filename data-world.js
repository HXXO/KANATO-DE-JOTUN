/* ============================================================
KANATO DE JOTUN · data-world.js — Contenido v5 (parte 4 de 4)
CAMBIOS v5:
· TIENDAS COMPLETAS: dos comerciantes nuevos y residentes en la
  plaza —Nadia la arquera y Halvar el armero— para que arcos,
  ballestas, las 9 flechas, escudos y armaduras se vendan SIEMPRE
  sin depender de mercaderes errantes.
· PUESTOS CON VENDEDOR REAL: cada puesto de la plaza tiene dueño
  (Lía, Finn, Nadia, Halvar) y abre SU tienda, no la bandeja.
  La bandeja básica queda en dos puestos y ahora incluye arco
  corto y flechas para poder empezar sin nada.
· Todo el equipo del juego está a la venta en algún sitio:
  D.SHOP_INDEX dice exactamente quién vende cada objeto.
· GUÍA DE DOMA COMPLETA en la ayuda (Ajustes → Cómo jugar):
  una sección por nivel con cada animal, sus comidas, cuántas
  veces y qué requisito pide, generada desde D.TAME_GUIDE.
· Solo 5 estaciones construibles + talleres públicos del concejo.
============================================================ */
(function () {
'use strict';
const CR = window.CR;
if (!CR || !CR.DEF) { console.error('[CR] data-world.js requiere data.js'); return; }
const DEF = CR.DEF, D = CR.DATA, B = D.BAL;
const bld = DEF.building, npc = DEF.npc, quest = DEF.quest;

/* ==========================================================
1 · ESTRUCTURAS DE LA CIUDAD
========================================================== */
D.CITY_STRUCTS = {
  church:       { name: 'Iglesia del Alba',      wall: '#d3c8b0', roof: '#7a5f8a', kind: 'church',   solid: true, enter: true },
  barracks:     { name: 'Cuartel de Vhalor',     wall: '#9aa0a8', roof: '#6b4a3a', kind: 'barracks', solid: true, enter: true },
  owner_house:  { name: 'Casa del Dueño',        wall: '#c8b48a', roof: '#8a4a3a', kind: 'house',    solid: true, enter: true },
  bank:         { name: 'Banco del Alba',        wall: '#d8cfae', roof: '#4a6a5a', kind: 'bank',     solid: true, enter: true },
  smithy:       { name: 'Herrería de Dorn',      wall: '#a89880', roof: '#5a4a3a', kind: 'smithy',   solid: true, enter: true },
  steward:      { name: 'Intendencia',           wall: '#c0b090', roof: '#6a5a3a', kind: 'steward',  solid: true, enter: true },
  land_office:  { name: 'Lonja de Tierras',      wall: '#c8c0a0', roof: '#3f6a5a', kind: 'bank',     solid: true, enter: true },
  alchemy_hut:  { name: 'Botica del Alba',       wall: '#b8a8b0', roof: '#5a4a6a', kind: 'house',    solid: true, enter: true },
  hunter_lodge: { name: 'Albergue del Cazador',  wall: '#a89070', roof: '#5a6a3a', kind: 'house',    solid: true, enter: true },
  caravan_post: { name: 'Puesto de Caravanas',   wall: '#b89a6a', roof: '#8a5a3a', kind: 'stall',    solid: true, enter: false },
  inn:          { name: 'Posada del Camino',     wall: '#c8b088', roof: '#7a5a3a', kind: 'house',    solid: true, enter: true },
  stall:        { name: 'Puesto del mercado',    wall: '#b89a6a', roof: '#c05a3a', kind: 'stall',    solid: true, enter: false },
  bowyer_stall: { name: 'Puesto de arquería',    wall: '#b09a6a', roof: '#4a7a4a', kind: 'stall',    solid: true, enter: false },
  armorer_stall:{ name: 'Puesto del armero',     wall: '#a8a098', roof: '#4a5a7a', kind: 'stall',    solid: true, enter: false },
  fountain:     { name: 'Fuente de la plaza',    wall: '#b0b8c0', roof: '#5a9ac0', kind: 'fountain', solid: true, enter: false },
  house_small:  { name: 'Casa de Vhalor',        wall: '#c8b898', roof: '#8a6a4a', kind: 'house',    solid: true, enter: true },
  farm_house:   { name: 'Casa de granja',        wall: '#c0a880', roof: '#7a6a3a', kind: 'house',    solid: true, enter: true },
  pen:          { name: 'Corral de esclavos',    wall: '#8a7050', roof: '#6a5030', kind: 'pen',      solid: false, enter: false },
  gargoyle_perch_city: { name: 'Repisa de gárgola', wall: '#8a8a90', roof: '#6a6a72', kind: 'bench', solid: true, enter: false },
  public_forge: { name: 'Horno público',         wall: '#908880', roof: '#c05030', kind: 'forge',    solid: true, enter: false },
  public_bench: { name: 'Mesa pública',          wall: '#b09060', roof: '#8a7040', kind: 'bench',    solid: true, enter: false }
};

/* Talleres públicos del concejo: gratis desde el minuto 1, lentos. */
D.PUBLIC_STATIONS = {
  public_forge: {
    station: 'forge', name: 'Horno público', glyph: 'fire',
    cd: 8, fuelPlus: 1, noQuality: true,
    desc: 'Funde metal y forja lo básico para cualquiera. El fuego es compartido: tarda unos 8 s en recobrarse entre usos y gasta una unidad extra de leña. Nunca salen piezas de calidad.'
  },
  public_bench: {
    station: 'workbench', name: 'Mesa pública', glyph: 'build',
    cd: 3, fuelPlus: 0, noQuality: true,
    desc: 'Banco del concejo en la plaza. Cuero, tela, arcos, flechas y mochilas. Hay cola: unos 3 s entre usos y sin calidad.'
  }
};

/* Puestos con dueño: world.js los estampa y coloca a su tendero. */
D.CITY_POSTS = {
  bowyer:  { key: 'bowyer_stall',  dx: 16, dy: 21, w: 3, h: 2, sx: 17, sy: 23 },
  armorer: { key: 'armorer_stall', dx: 28, dy: 21, w: 3, h: 2, sx: 29, sy: 23 }
};

/* ==========================================================
2 · CASAS · 12 niveles sobre las 6 estaciones reales
========================================================== */
const HOUSES = [
  ['shelter', 'Refugio de ramas', 0, [2, 2], 0, 6, 0, [], { wood: 8, fiber: 6 }, null,
   'Un techo de ramas. No es una casa, pero es un sitio donde no te llueve.', '#8a7a52', '#6a5a34'],
  ['house_straw', 'Casa de paja', 1, [3, 3], 1, 20, 0, ['sleep', 'chest'], { wood: 20, straw: 12, fiber: 10 }, { lv: 2, skill: { artisan: 1 } },
   'Cama y cofre. El primer hogar de verdad.', '#c8b070', '#b89a40'],
  ['house_wood', 'Casa de madera', 2, [3, 3], 2, 30, 1, ['sleep', 'chest', 'campfire'], { wood: 40, stone: 20, rope: 2 }, { lv: 4, skill: { artisan: 2 } },
   'Fogata dentro y dos camas. Aquí ya puedes casarte.', '#b89060', '#8a5a30'],
  ['house_stone', 'Casa de piedra', 3, [4, 3], 2, 40, 1, ['sleep', 'chest', 'campfire', 'workbench'], { stone: 60, brick: 10, wood: 30 }, { lv: 7, skill: { artisan: 3 } },
   'Banco propio: cuero, tela, arcos y muebles sin salir de casa.', '#b0aca0', '#6a6a70'],
  ['house_brick', 'Casa de ladrillo', 4, [4, 4], 3, 50, 2, ['sleep', 'chest', 'campfire', 'workbench', 'kitchen'], { brick: 40, stone: 40, iron_bar: 6 }, { lv: 9, skill: { artisan: 4 } },
   'Cocina de verdad y tres camas. La casa de un hombre establecido.', '#c08868', '#8a4a3a'],
  ['house_manor', 'Casona solariega', 5, [5, 4], 3, 60, 2, ['sleep', 'chest', 'campfire', 'workbench', 'kitchen', 'forge'], { brick: 60, stone: 60, steel_bar: 8, linen: 6 }, { lv: 11, skill: { artisan: 5 } },
   'Forja propia: fundes y forjas sin depender del horno público ni de Dorn.', '#c8b898', '#7a5a4a'],
  ['house_mansion', 'Mansión', 6, [5, 5], 4, 80, 3, ['sleep', 'chest', 'campfire', 'workbench', 'kitchen', 'forge'], { stone: 100, brick: 60, steel_bar: 12, gold_bar: 2 }, { lv: 13, skill: { artisan: 6 } },
   'Cuatro camas y hasta tres hijos. Ya eres alguien en Vhalor.', '#d8d0c0', '#7a4a6a'],
  ['house_keep', 'Torreón', 7, [5, 5], 4, 90, 3, ['sleep', 'chest', 'campfire', 'workbench', 'kitchen', 'forge', 'alchemy'], { stone: 140, brick: 80, iron_bar: 20, steel_bar: 10 }, { lv: 15, skill: { artisan: 7 } },
   'Alambique bajo tu propio techo. Pociones sin recargo.', '#a8a8a0', '#5a5a62'],
  ['house_villa', 'Villa del valle', 8, [6, 5], 5, 100, 4, ['sleep', 'chest', 'campfire', 'workbench', 'kitchen', 'forge', 'alchemy'], { stone: 160, brick: 100, steel_bar: 20, mithril_bar: 6 }, { lv: 17, skill: { artisan: 8 } },
   'Las cinco estaciones y cinco camas. Autosuficiencia completa.', '#e0d8c8', '#6a7a5a'],
  ['house_palace', 'Palacete', 9, [6, 6], 6, 120, 4, ['sleep', 'chest', 'campfire', 'workbench', 'kitchen', 'forge', 'alchemy'], { stone: 200, brick: 140, mithril_bar: 14, gold_bar: 6, silk: 8 }, { lv: 19, skill: { artisan: 9 } },
   'Seis camas. Tu casa es una institución.', '#e8e0d0', '#7a5a8a'],
  ['house_citadel', 'Ciudadela privada', 10, [7, 6], 6, 150, 5, ['sleep', 'chest', 'campfire', 'workbench', 'kitchen', 'forge', 'alchemy'], { stone: 260, brick: 180, adamantite_bar: 8, mithril_bar: 20, golem_core: 2 }, { lv: 22, skill: { artisan: 10 } },
   'Muros de verdad. Un gólem vigila la puerta.', '#c8c8d0', '#4a5a7a'],
  ['house_estate', 'Hacienda de Vhalor', 11, [8, 7], 8, 200, 6, ['sleep', 'chest', 'campfire', 'workbench', 'kitchen', 'forge', 'alchemy'], { stone: 340, brick: 240, adamantite_bar: 16, gold_bar: 12, dragon_scale: 2, silk: 16 }, { lv: 26, skill: { artisan: 10 } },
   'Ocho camas y seis hijos. El sueño de un esclavo.', '#f0e8d8', '#8a6a3a']
];
HOUSES.forEach(function (h, i) {
  bld(h[0], {
    name: h[1], tier: h[2], size: h[3], beds: h[4], chest: h[5], childCap: h[6],
    functions: h[7], cost: h[8], req: h[9], desc: h[10], wall: h[11], roof: h[12], kind: 'house',
    upgradeFrom: i > 0 ? HOUSES[i - 1][0] : null, house: true
  });
});

/* ==========================================================
3 · ESTACIONES · SOLO 5, se desbloquean como una receta más
========================================================== */
const STATION_BLD = [
  ['campfire', 'Fogata', [1, 1], ['campfire'], { wood: 5, stone: 3 }, null,
   'Asa carne y pescado, hierve agua y hace carbón vegetal. Consume leña.', '#8a7a6a', '#e07030', 'fire'],
  ['workbench', 'Banco de trabajo', [2, 1], ['workbench'], { wood: 15, stone: 5, flint: 2 }, { lv: 2, skill: { artisan: 1 } },
   'Herramientas, cuero, tela, arcos, flechas, mochilas, camas y muebles. Antes eran cuatro mesas: ahora una.', '#b09060', '#8a7040', 'bench'],
  ['kitchen', 'Cocina', [2, 2], ['kitchen'], { brick: 12, stone: 20, iron_bar: 3, wood: 10 }, { lv: 3, skill: { artisan: 1 } },
   'Guisos, panes, tartas, harina y aceite. Consume leña.', '#c0a880', '#8a5a3a', 'house'],
  ['forge', 'Forja', [2, 2], ['forge'], { stone: 30, brick: 16, iron_bar: 6, coal: 8 }, { lv: 5, skill: { artisan: 2 } },
   'Funde mineral y forja armas, armaduras y escudos. Antes eran horno, forja y yunque: ahora uno solo.', '#908880', '#c05030', 'forge'],
  ['alchemy', 'Alambique', [2, 2], ['alchemy'], { brick: 20, sand: 16, copper_bar: 6, crystal: 2 }, { lv: 10, skill: { artisan: 5 } },
   'Pociones, elixires, antídotos, dardos y ungüentos.', '#a8a0b8', '#5a4a7a', 'house']
];
STATION_BLD.forEach(function (s) {
  bld(s[0], {
    name: s[1], tier: 0, size: s[2], functions: s[3], cost: s[4], req: s[5],
    desc: s[6], wall: s[7], roof: s[8], kind: s[9], station: s[3][0],
    fuelStore: D.STATION_INFO[s[3][0]] ? D.STATION_INFO[s[3][0]].fuel : 0
  });
});

/* ==========================================================
4 · GANADO, ALMACÉN, CAMAS Y DEFENSAS
========================================================== */
bld('coop', { name: 'Gallinero', tier: 0, size: [3, 2], cap: 4, functions: ['livestock'], accepts: ['chicken', 'duck', 'rabbit'],
  cost: { wood: 18, straw: 8, fiber: 8 }, req: { lv: 3 }, desc: 'Aloja 4 animales pequeños: gallinas, patos y conejos.',
  wall: '#c8b070', roof: '#a08840', kind: 'pen' });
bld('corral', { name: 'Corral', tier: 0, size: [4, 3], cap: 4, functions: ['livestock'], accepts: ['sheep', 'pig', 'nanny', 'goat', 'cow', 'alpaca'],
  cost: { wood: 25, fiber: 15, rope: 2 }, req: { lv: 4 }, desc: 'Aloja 4 animales de producto.',
  wall: '#a08850', roof: '#8a7040', kind: 'pen' });
bld('barn', { name: 'Granero', tier: 0, size: [5, 4], cap: 8, functions: ['livestock', 'chest'], chest: 40,
  accepts: ['sheep', 'pig', 'nanny', 'goat', 'cow', 'alpaca', 'chicken', 'duck'],
  cost: { wood: 60, stone: 30, brick: 12, rope: 4 }, req: { lv: 8, skill: { artisan: 3 } }, desc: 'Ocho animales y 40 espacios de almacén.',
  wall: '#b89060', roof: '#8a4a3a', kind: 'house' });
bld('stable', { name: 'Establo', tier: 0, size: [4, 3], cap: 3, functions: ['mounts'],
  cost: { wood: 35, stone: 15, hay: 10 }, req: { lv: 5 }, desc: 'Aloja 3 monturas. Recupera su aliento más rápido.',
  wall: '#a88860', roof: '#7a5a3a', kind: 'pen' });
bld('chest', { name: 'Cofre', tier: 0, size: [1, 1], chest: 20, functions: ['chest'],
  cost: { wood: 10, iron_bar: 1 }, req: null, desc: '20 espacios de almacén.', wall: '#a07840', roof: '#6a4a20', kind: 'chest' });
bld('chest_large', { name: 'Arcón herrado', tier: 0, size: [2, 1], chest: 48, functions: ['chest'],
  cost: { wood: 20, iron_bar: 4, hard_leather: 2 }, req: { lv: 6, skill: { artisan: 2 } }, desc: '48 espacios de almacén.',
  wall: '#8a6a3a', roof: '#5a4a2a', kind: 'chest' });

[['bed_straw', 'Cama de paja', 1, 0.85, { wood: 4, straw: 6, cloth: 2 }, { lv: 3, skill: { artisan: 1 } }, '#c8b070', '#a08840'],
 ['bed_wood', 'Cama de madera', 2, 1.0, { wood: 8, cloth: 4, rope: 2 }, { lv: 6, skill: { artisan: 2 } }, '#a88860', '#7a5a3a'],
 ['bed_feather', 'Cama de plumas', 3, 1.0, { wood: 8, feather: 12, linen: 4 }, { lv: 10, skill: { artisan: 4 } }, '#d8d0c0', '#8a7a9a'],
 ['bed_noble', 'Lecho noble', 4, 1.0, { wood: 10, silk: 6, pegasus_feather: 4, gold_bar: 2 }, { lv: 31, skill: { artisan: 8 } }, '#e8d8b0', '#7a4a6a']]
.forEach(function (b) {
  bld(b[0], { name: b[1], tier: 0, size: [2, 1], beds: 1, bedTier: b[2], heal: b[3], functions: ['sleep'],
    cost: b[4], req: b[5], desc: 'Duerme sin riesgo de emboscada. ' + (b[2] >= 3 ? 'Despiertas con vigor extra.' : ''),
    wall: b[6], roof: b[7], kind: 'bed' });
});

bld('fence', { name: 'Valla', tier: 0, size: [1, 1], blocks: true, functions: [], cost: { wood: 2 }, req: null,
  desc: 'Bloquea el paso de animales y bandidos.', wall: '#9a8050', roof: '#7a6030', kind: 'fence' });
bld('gate_wood', { name: 'Puerta de madera', tier: 0, size: [1, 1], functions: ['gate'], cost: { wood: 6, iron_bar: 1 }, req: { lv: 4 },
  desc: 'Tú y los tuyos pasáis; el resto no.', wall: '#a08850', roof: '#6a5430', kind: 'gate' });
bld('palisade', { name: 'Empalizada', tier: 0, size: [1, 1], blocks: true, functions: [], cost: { wood: 8, rope: 1 }, req: { lv: 5 },
  desc: 'Muro de estacas. Más alto y más duro que una valla.', wall: '#8a7040', roof: '#5a4420', kind: 'wall' });
bld('wall_stone', { name: 'Muro de piedra', tier: 0, size: [1, 1], blocks: true, functions: [], cost: { stone: 12, brick: 4 }, req: { lv: 8, skill: { artisan: 3 } },
  desc: 'Nada salvaje atraviesa esto.', wall: '#a8a8a0', roof: '#6a6a70', kind: 'wall' });
bld('tower_watch', { name: 'Torre de vigilancia', tier: 0, size: [2, 2], functions: ['guard_post'], cost: { stone: 40, wood: 24, iron_bar: 6 }, req: { lv: 10, skill: { artisan: 4 } },
  desc: 'Un guardia contratado vigila tu parcela de noche.', wall: '#b0aca0', roof: '#6b4a3a', kind: 'barracks' });
bld('golem_pylon', { name: 'Pilón de gólem', tier: 0, size: [2, 2], functions: ['guardian'], guardian: 'golem',
  cost: { stone: 60, brick: 20, golem_core: 1, crystal: 3 }, req: { lv: 14, skill: { artisan: 6 } },
  desc: 'Invoca un gólem de piedra que protege tus construcciones.', wall: '#9a9a92', roof: '#5a6a7a', kind: 'bench' });
bld('gargoyle_perch', { name: 'Repisa de gárgola', tier: 0, size: [1, 2], functions: ['guardian'], guardian: 'gargoyle',
  cost: { stone: 30, obsidian: 2, golem_core: 1 }, req: { lv: 12, skill: { artisan: 5 } },
  desc: 'Una gárgola de piedra monta guardia al caer la noche.', wall: '#8a8a90', roof: '#6a6a72', kind: 'bench' });
bld('well', { name: 'Pozo', tier: 0, size: [2, 2], functions: ['water_source'], cost: { stone: 30, brick: 8, rope: 2 }, req: { lv: 5 },
  desc: 'Rellena la regadera y el odre sin ir al río.', wall: '#b0b0a8', roof: '#6a6a62', kind: 'fountain' });
bld('torch_post', { name: 'Poste de antorcha', tier: 0, size: [1, 1], functions: ['light'], light: 130, cost: { wood: 4, coal: 2, fiber: 2 }, req: null,
  desc: 'Ilumina tu parcela toda la noche.', wall: '#8a7040', roof: '#e07030', kind: 'fire' });
bld('lantern_post', { name: 'Farol de aceite', tier: 0, size: [1, 1], functions: ['light'], light: 190, cost: { copper_bar: 3, sand: 3, oil: 2 }, req: { lv: 7, skill: { artisan: 3 } },
  desc: 'Luz estable que la lluvia no apaga.', wall: '#c8a060', roof: '#f0c060', kind: 'fire' });
bld('scarecrow', { name: 'Espantapájaros', tier: 0, size: [1, 1], functions: ['scare'], cost: { wood: 4, straw: 6, cloth: 2 }, req: { lv: 4 },
  desc: 'Los herbívoros salvajes no se acercan a tus cultivos.', wall: '#c8b070', roof: '#8a6a3a', kind: 'bench' });

/* ==========================================================
5 · BANDEJA DEL PUESTO · lo mínimo para arrancar sin nada
========================================================== */
D.STALL = {
  name: 'Bandeja del concejo',
  note: 'Lo básico, siempre abierto y sin confianza. Ahora incluye arco corto y flechas: puedes empezar a cazar desde el primer día. Para equipo especializado, habla con Nadia (arquería) o Halvar (armero) en los puestos de al lado.',
  sells: ['wood', 'stone', 'fiber', 'hay', 'straw', 'berry', 'apple', 'flatbread', 'bait', 'feed_basic',
          'torch', 'bandage_simple', 'bow_wood', 'arrow_basic', 'feed_tame', 'rope'],
  buys: ['wood', 'stone', 'coal', 'fiber', 'hay', 'straw', 'herb', 'hide', 'bone', 'feather', 'manure',
         'flint', 'clay', 'sand', 'copper_ore', 'crab_shell', 'raw_meat', 'raw_poultry', 'fish_sardine', 'fish_trout'],
  buyMarkup: 1.8, sellMult: 0.6
};

/* ==========================================================
6 · NPC · generadores de diálogo
========================================================== */
const SVC = {
  shop:       { t: 'Ver tu mercancía', when: { trustMin: -59 } },
  debt:       { t: 'Pagar mi deuda', when: { slave: true, trustMin: -59 } },
  bank:       { t: 'Gestionar mi cuenta', when: { free: true, trustMin: -59 } },
  bless:      { t: 'Recibir bendición (25 oro)', when: { trustMin: -59 } },
  charity:    { t: 'Donar a los pobres (10 oro)', when: { trustMin: -59 } },
  wedding:    { t: 'Celebrar mi boda', when: { rel: 'engaged', trustMin: -59 } },
  quest:      { t: 'Contratos de caza y recolección', when: { trustMin: -59 } },
  land:       { t: 'Comprar tierras', when: { free: true, trustMin: -59 } },
  slaves:     { t: 'Contratar trabajadores', when: { free: true, trustMin: -59 } },
  repair:     { t: 'Reparar mi equipo', when: { trustMin: -59 } },
  help_task:  { t: 'Ayudar en la granja', when: { trustMin: -59 } },
  stations:   { t: 'Usar tus talleres', when: { trustMin: -59 } },
  bed_market: { t: 'Alquilar una cama (18 oro)', when: { trustMin: -59 } },
  family:     { t: 'Ver a mi familia', when: { rel: 'married' } }
};
function stdChoices() {
  return [
    { t: 'Charlar un rato', act: 'smalltalk', dt: B.SMALLTALK_DAILY, daily: true },
    { t: 'Ofrecer un regalo', act: 'gift' },
    { t: 'Insultarle', go: 'insult', dt: -15 },
    { t: 'Marcharse', act: 'end' }
  ];
}
function svcChoices(services) {
  const out = [];
  (services || []).forEach(function (s) { const c = SVC[s]; if (c) out.push({ t: c.t, act: s, when: c.when }); });
  return out;
}
function insultNode(name) {
  return {
    text: [{ t: name + ' entrecierra los ojos. «Mide tus palabras, extranjero. En Vhalor la lengua suelta se paga cara.»' }],
    choices: [{ t: 'Disculparse', go: 'root', dt: 5, daily: true }, { t: 'Marcharse', act: 'end' }]
  };
}
function romanceNodes(flirt, date) {
  return {
    flirt: { text: [{ t: flirt }], choices: [{ t: 'Sonreír y seguir la charla', go: 'root', dt: 4, daily: true }, { t: 'Marcharse', act: 'end' }] },
    date: { text: [{ t: date }], choices: [{ t: 'Acercarte con cariño', go: 'root', dt: 6, daily: true }, { t: 'Darle un regalo', act: 'gift' }, { t: 'Marcharse', act: 'end' }] }
  };
}
function romanceChoices() {
  return [
    { t: 'Coquetear', go: 'flirt', when: { free: true, trustMin: 40, relIn: ['none', 'dating'] } },
    { t: 'Proponer una cita', go: 'date', when: { free: true, trustMin: 60, relIn: ['none', 'dating'] } },
    { t: 'Pedir matrimonio', act: 'propose', when: { free: true, rel: 'dating', trustMin: B.MARRY_TRUST, hasItem: { id: 'ring_gold', n: B.RINGS_NEEDED } } },
    { t: 'Nos vemos en la iglesia…', act: 'end', when: { rel: 'engaged' } },
    { t: 'Ver a nuestra familia', act: 'family', when: { rel: 'married' } }
  ];
}
function mkNpc(id, c) {
  const nodes = {
    root: {
      text: [{ when: { trustMax: -60 }, t: c.hate }].concat(c.lines),
      choices: svcChoices(c.services).concat(c.extraChoices || []).concat(c.romance ? romanceChoices() : []).concat(stdChoices())
    },
    insult: insultNode(c.name)
  };
  if (c.romance) { const rn = romanceNodes(c.flirt, c.date); nodes.flirt = rn.flirt; nodes.date = rn.date; }
  if (c.nodes) for (const k in c.nodes) nodes[k] = c.nodes[k];
  npc(id, {
    name: c.name, role: c.role, gender: c.gender, romance: !!c.romance,
    loves: c.loves, smalltalk: c.talk, shop: c.shop || null, services: c.services || [],
    consequences: c.cons, post: c.post !== false, wanderer: !!c.wanderer, hunter: !!c.hunter,
    farmer: !!c.farmer, hours: c.hours || [7, 19], stall: !!c.stall,
    dlg: { start: 'root', nodes: nodes }
  });
}

/* --- Bareth · mercader de esclavos --- */
mkNpc('bareth', {
  name: 'Bareth', role: 'Mercader de esclavos', gender: 'm',
  loves: ['gold_nugget', 'mead', 'gold_bar'],
  talk: ['El trabajo duro forja el carácter… y mi bolsa.',
    'Los cazadores te trajeron medio muerto. Yo te di un techo, un pico y un hacha.',
    'Paga tu deuda y serás libre. Palabra de mercader.',
    'También acepto objetos: al ochenta por ciento de su valor.',
    'Si se te rompe el pico, no lo tires. Repáralo con dos piedras y un tronco.'],
  shop: { sells: ['flatbread', 'berry', 'apple', 'pick_stone', 'axe_stone', 'hoe_stone', 'cloth_chest', 'torch',
    'bandage_simple', 'bed_roll', 'rope', 'fiber', 'hay', 'feed_tame'],
    buys: ['material', 'crop', 'food', 'unique', 'fish', 'product'] },
  services: ['debt', 'shop'],
  cons: { hate: 'Añade recargos a tu deuda y avisa a los guardias.', love: 'Descuentos y perdona intereses.' },
  hate: 'Bareth escupe al suelo. «Ni se te ocurra acercarte, escoria.»',
  lines: [
    { when: { slave: true }, t: '«Mi propiedad favorita. Llevas collar, pico y hacha; nada más. El reino no te espera: te devora. Tráeme oro y quizá algún día te quite el collar.»' },
    { t: '«Hombre libre… quién lo diría. Pagaste hasta el último cobre. Respeto eso. ¿Negociamos?»' }
  ],
  extraChoices: [{ t: '¿Cuánto debo aún?', go: 'debtinfo', when: { slave: true } },
    { t: '¿Cómo empiezo sin nada?', go: 'startinfo', when: { slave: true } }],
  nodes: {
    debtinfo: { text: [{ t: '«Dos mil de oro al contado. Cada pago lo anoto en mi libro. Los intereses… dependen de cómo me caigas.»' }], choices: [{ t: 'Volver', go: 'root' }] },
    startinfo: { text: [{ t: '«Tala y pica. El cobre sale con el pico de piedra, aunque tardes: cinco golpes por veta. Vende madera, piedra y cobre aquí o en la bandeja. En la plaza hay horno y mesa públicos, y Nadia vende arcos si prefieres cazar.»' }], choices: [{ t: 'Volver', go: 'root' }] }
  }
});

/* --- Voss · intendente: ganado, piensos y TODAS las sillas --- */
mkNpc('voss', {
  name: 'Voss', role: 'Intendente de Vhalor', gender: 'm',
  loves: ['steel_bar', 'cheese', 'linen'],
  talk: ['Las tierras del sur y del este están en venta. Cuarenta y cuatro parcelas.',
    'Cada mes llegan trabajadores nuevos. Los títulos tienen privilegios.',
    'Un hombre con tierras es un hombre con futuro.',
    'Tengo todas las sillas de montar: caballo, reno, oso, grifo, pegaso… lo que puedas domar.',
    'El pienso de doma sirve para cualquier herbívoro. Para carnívoros, señuelo de carne.'],
  shop: { sells: ['animal_chicken', 'animal_duck', 'animal_rabbit', 'animal_sheep', 'animal_pig', 'animal_nanny',
    'animal_goat', 'animal_cow', 'animal_alpaca', 'animal_horse',
    'feed_basic', 'feed_good', 'feed_herb', 'feed_golden', 'feed_tame', 'meat_lure', 'hay', 'straw',
    'saddle_horse', 'saddle_camel', 'saddle_llama', 'saddle_reindeer', 'saddle_bison', 'saddle_bear',
    'saddle_polar_bear', 'saddle_warg', 'saddle_griffin', 'saddle_condor', 'saddle_nightmare',
    'saddle_unicorn', 'saddle_kirin', 'saddle_pegasus', 'saddle_wyvern'],
    buys: ['material', 'animal', 'feed', 'product', 'saddle', 'petarmor'] },
  services: ['slaves', 'shop', 'stations'],
  cons: { hate: 'Te niega trabajadores, ganado y sillas.', love: 'Descuento en contratos y taller gratis.' },
  hate: 'Voss cierra su libro de golpe. «Contigo no hago negocios.»',
  lines: [
    { when: { slave: true }, t: '«Los esclavos no contratan a nadie. Pero el ganado y las sillas te las vendo igual: el oro no lleva collar.»' },
    { t: '«Ah, el propietario. Ganado, pienso, señuelos y todas las sillas. Las tierras las lleva el Supremo.»' }
  ]
});

/* --- Dorn · herrero: herramientas de todos los tiers + combustible --- */
mkNpc('dorn', {
  name: 'Dorn', role: 'Herrero de Vhalor', gender: 'm',
  loves: ['coal', 'iron_bar', 'mithril_ore', 'charcoal'],
  talk: ['El acero no miente: hierro y carbón, fuego y paciencia.',
    'La forja lo hace todo: funde, forja y remacha. Antes eran tres mesas.',
    'Un pico de piedra tarda cinco golpes en el cobre. Uno de hierro, dos. Esa es la diferencia.',
    'Si no tienes forja, usa la mía: treinta y cinco por ciento. O el horno público, que es gratis pero lento.',
    'Trae una herramienta rota y la dejo nueva por menos de lo que cuesta hacerla.'],
  shop: { sells: ['coal', 'charcoal', 'copper_bar', 'iron_bar', 'brick',
    'pick_stone', 'axe_stone', 'hoe_stone', 'pick_copper', 'axe_copper', 'hoe_copper',
    'pick_iron', 'axe_iron', 'hoe_iron', 'pick_steel', 'axe_steel', 'hoe_steel',
    'pick_obsidian', 'axe_obsidian', 'pick_mithril', 'axe_mithril', 'pick_adamantite', 'axe_adamantite',
    'sickle', 'hammer_build', 'repair_kit', 'whetstone', 'lantern',
    'sword_stone', 'sword_copper', 'sword_iron', 'sword_steel', 'dagger_iron',
    'spear_copper', 'spear_iron', 'spear_steel', 'mace_iron', 'mace_steel',
    'iron_head', 'iron_chest', 'iron_legs', 'steel_head', 'steel_chest', 'steel_legs'],
    buys: ['material', 'tool', 'weapon', 'armor', 'shield'] },
  services: ['shop', 'repair', 'stations'],
  cons: { hate: 'No repara, no vende y no presta la forja.', love: 'Reparaciones a mitad de precio.' },
  hate: 'Dorn golpea el yunque sin mirarte. «Fuera de mi forja.»',
  lines: [{ t: '«El yunque no pregunta si llevas collar. Trae hierro y carbón y saldrás mejor armado que un guardia. Y si prefieres que lo haga yo, también.»' }]
});

/* --- Lía · mercadera general (romance) --- */
mkNpc('lia', {
  name: 'Lía', role: 'Mercadera del mercado', gender: 'f', romance: true,
  loves: ['pie', 'fruit_pie', 'ring_gold', 'crop_pumpkin'],
  talk: ['Vendo de todo: semillas, pan, mochilas… y consejos gratis.',
    'Las veinticuatro semillas caben en esta bandeja. Elige según la estación.',
    'El pienso de doma lo hago yo: heno, bayas y hierbas. Sirve para cualquier herbívoro.',
    'Si buscas arcos, Nadia. Si buscas escudos, Halvar. Están a dos pasos.',
    'Mi puesto es el mejor surtido de Vhalor, modestia aparte.'],
  shop: { sells: ['seed_wheat', 'seed_carrot', 'seed_potato', 'seed_tomato', 'seed_pumpkin', 'seed_onion', 'seed_lettuce',
    'seed_garlic', 'seed_corn', 'seed_cabbage', 'seed_pepper', 'seed_sweetpotato', 'seed_rice', 'seed_quinoa', 'seed_maca',
    'seed_sunflower', 'seed_strawberry', 'seed_grape', 'seed_melon', 'seed_cotton', 'seed_flax', 'seed_herb', 'seed_bean', 'seed_beet',
    'berry', 'apple', 'bread', 'cheese', 'butter', 'milk', 'egg', 'honey', 'salt', 'oil', 'flour',
    'feed_basic', 'feed_good', 'feed_tame', 'meat_lure', 'fert_manure', 'fert_compost', 'fert_bonemeal',
    'cloth', 'fiber', 'thread', 'rope', 'linen', 'bag_small', 'bag_medium', 'bait', 'waterskin', 'watering_can',
    'bandage_simple', 'bandage_clean', 'torch', 'bed_roll', 'bed_straw', 'chest_kit',
    'cloth_head', 'cloth_chest', 'cloth_legs', 'leather_head', 'leather_chest', 'leather_legs'],
    buys: ['crop', 'food', 'product', 'material', 'seed', 'fert', 'feed', 'bag', 'heal', 'fish'],
    buyMult: { crop: 1.15, product: 1.15, food: 1.1 } },
  services: ['shop'],
  cons: { hate: 'Sube sus precios un 20 %.', love: 'Descuentos y regalos ocasionales.' },
  hate: 'Lía te ignora ostensiblemente. «No vendo a quien no me respeta.»',
  lines: [
    { when: { rel: 'married' }, t: '«¡Mi amor! ¿Ya trabajaste duro hoy? Ven, siéntate un momento conmigo.»' },
    { when: { rel: 'engaged' }, t: 'Lía muestra su anillo con una sonrisa radiante. «La iglesia nos espera… no tardes.»' },
    { when: { rel: 'dating' }, t: 'Lía se sonroja al verte. «Justo pensaba en ti. ¿Paseamos luego?»' },
    { t: '«Bienvenido al puesto de Lía. Semillas, pan, mochilas… ¿o solo vienes a mirarme?»' }
  ],
  flirt: 'Lía ríe entre dientes. «Qué atrevido… me gusta. Pero gánate mi corazón, no solo mi puesto.»',
  date: 'Paseáis junto a la fuente al atardecer. Lía apoya su cabeza en tu hombro un instante.'
});

/* --- Silas · banquero (romance) --- */
mkNpc('silas', {
  name: 'Silas', role: 'Banquero del Alba', gender: 'm', romance: true,
  loves: ['gold_nugget', 'gold_bar', 'wine', 'truffle_risotto'],
  talk: ['El oro bajo mi bóveda duerme tranquilo… y crece un poco cada día.',
    'Un medio por ciento diario, hasta catorce monedas. Modesto, pero seguro.',
    'Los libres pueden abrir cuenta. Los esclavos… aún no.',
    'Las escrituras las emite el Supremo, pero el oro lo guardo yo.'],
  shop: null, services: ['bank'],
  cons: { hate: 'Congela tu cuenta.', love: 'Bonificación de interés.' },
  hate: 'Silas cruza los brazos. «Tu cuenta está congelada por orden mía.»',
  lines: [
    { when: { rel: 'married' }, t: '«Esposa mía… el banco es tuyo tanto como mi corazón.»' },
    { when: { rel: 'engaged' }, t: 'Silas pule su anillo nerviosamente. «Maera nos casará cuando quieras.»' },
    { when: { rel: 'dating' }, t: '«Los números se me olvidan cuando estás cerca… y eso es mucho decir.»' },
    { when: { slave: true }, t: '«Los esclavos no abren cuentas, lo siento. Gana tu libertad primero.»' },
    { t: '«Banco del Alba, a su servicio. Depósitos seguros, interés diario.»' }
  ],
  flirt: 'Silas ajusta sus cifras, pero sus ojos se desvían hacia ti. «El interés… compuesto, sí. Eso.»',
  date: 'Camináis entre los cofres de la bóveda. Silas te cuenta historias de grandes fortunas, y de soledades.'
});

/* --- Maera · sacerdotisa (romance) --- */
mkNpc('maera', {
  name: 'Maera', role: 'Sacerdotisa del Alba', gender: 'f', romance: true,
  loves: ['holy_water', 'herb_blue', 'honey_cake', 'bandage_herb'],
  talk: ['El Alba bendice a quien trabaja honradamente.',
    'La caridad abre puertas que el oro no puede.',
    'Hierba azul para el veneno, ungüento para el fuego. No los confundas.',
    'Incluso un esclavo tiene alma libre. Nunca lo olvides.',
    'Fuiste encontrado divagando por las tierras de Jotun. Que el Alba guíe tu esfuerzo.'],
  shop: { sells: ['holy_water', 'ring_gold', 'bandage_simple', 'bandage_clean', 'bandage_herb', 'antidote', 'salve_burn',
    'splint', 'potion_heal_s', 'potion_heal_m', 'potion_heal_l', 'potion_stamina_s', 'potion_stamina_l',
    'elixir_regen', 'potion_fire_res', 'potion_ice_res', 'herb', 'herb_blue', 'herb_fire', 'charm_luck', 'charm_beast'],
    buys: ['material', 'potion', 'heal', 'herbany', 'acc'] },
  services: ['shop', 'bless', 'charity', 'wedding', 'stations'],
  cons: { hate: 'Niega bendiciones, bodas y alambique.', love: 'Bendiciones más baratas.' },
  hate: 'Maera baja la mirada. «Que el Alba te perdone… yo aún no puedo.»',
  lines: [
    { when: { rel: 'married' }, t: '«Amado mío. Nuestra unión fue bendecida aquí. ¿Oramos juntos?»' },
    { when: { rel: 'engaged' }, t: 'Maera sonríe. «Prepararé la ceremonia. Trae a tu prometido cuando estéis listos.»' },
    { when: { rel: 'dating' }, t: '«El Alba une lo que los hombres separan… ven, caminemos por el claustro.»' },
    { t: '«La paz del Alba sea contigo, viajero. ¿Buscas bendición, curación… o consuelo?»' }
  ],
  flirt: 'Maera ríe suavemente, sorprendida de sí misma. «Un corazón libre no debería latir así por nadie… y sin embargo.»',
  date: 'En el claustro, bajo la luz del Alba, Maera toma tu mano. «Esto está mal visto… pero se siente bien.»'
});

/* --- Roderic · capitán (romance) --- */
mkNpc('roderic', {
  name: 'Roderic', role: 'Capitán de la guardia', gender: 'm', romance: true,
  loves: ['sword_steel', 'roast', 'shield_kite', 'hearty_stew'],
  talk: ['Las murallas tienen dos puertas y cien ojos. No robes aquí.',
    'Hay contratos para quien sepa manejar el acero… y para quien sepa llenar un granero.',
    'Un escudo bien puesto vale más que una espada afilada. Aprende el parry.',
    'Nadia y Halvar montaron puesto en la plaza por orden mía. Ya no hay excusa para ir desarmado.',
    'Las bestias atacan en ráfagas y descansan. Ese descanso es tu ventana.'],
  shop: { sells: ['shield_round_wood', 'shield_round', 'shield_kite', 'iron_chest', 'steel_head',
    'arrow_basic', 'arrow_iron', 'bow_wood', 'quiver', 'potion_heal_s', 'bandage_clean', 'sword_iron'],
    buys: ['weapon', 'armor', 'shield', 'ammo'] },
  services: ['quest', 'shop'],
  cons: { hate: 'Los guardias te registran y multan.', love: 'La guardia hace la vista gorda ante faltas menores.' },
  hate: 'Roderic empuña la espada. «Una palabra más y te encierro.»',
  lines: [
    { when: { rel: 'married' }, t: '«Esposa… el cuartel es un desastre sin ti. Ven a cenar conmigo esta noche.»' },
    { when: { rel: 'engaged' }, t: 'Roderic endereza su capa, inusualmente nervioso. «Maera sabe lo nuestro. Cuando quieras.»' },
    { when: { rel: 'dating' }, t: '«Un capitán no debería sonreír tanto al ver a alguien. Y aquí estoy.»' },
    { t: '«Ciudadano. El cuartel paga por bestias abatidas y por grano entregado. ¿Buscas contrato?»' }
  ],
  flirt: 'Roderic carraspea, y una sonrisa se le escapa bajo el yelmo. «Valor es lo que me gusta. Y tú lo tienes.»',
  date: 'Entrenáis juntos al anochecer. Entre estocadas, Roderic baja la guardia… y la voz.'
});

/* --- Finn · pescadero (romance) --- */
mkNpc('finn', {
  name: 'Finn', role: 'Pescadero', gender: 'm', romance: true,
  loves: ['fish_void', 'fish_mirror', 'mead', 'grilled_fish'],
  talk: ['El secreto es la paciencia… y un buen cebo.',
    'Cada bioma esconde un pez distinto. El del vacío y el espejo valen oro.',
    'Una caña de mithril pesca casi sola.',
    'La foca y el lince se doman con pescado. Barato y abundante.'],
  shop: { sells: ['rod_wood', 'rod_iron', 'rod_mithril', 'bait', 'fishing_net', 'cooked_fish', 'grilled_fish',
    'smoked_fish', 'flatbread', 'salt', 'fish_sardine', 'fish_trout'],
    buys: ['fish', 'food'], buyMult: { fish: 1.25 } },
  services: ['shop', 'stations'],
  cons: { hate: 'No compra tu pescado.', love: 'Paga un extra por capturas raras.' },
  hate: 'Finn da la espalda. «Mi puesto no es para ti.»',
  lines: [
    { when: { rel: 'married' }, t: '«¡Amor mío! Hoy pesqué algo grande… para nuestra cena.»' },
    { when: { rel: 'engaged' }, t: 'Finn juguetea con un anzuelo. «Una boda… y luego una luna de miel pescando, ¿eh?»' },
    { when: { rel: 'dating' }, t: '«El mar es hermoso, pero contigo al lado… se queda corto.»' },
    { t: '«¡Finn el pescadero! Cañas, cebo, y pago bien el pescado fresco.»' }
  ],
  flirt: 'Finn guiña un ojo. «Dicen que quien pesca junto a alguien toda la vida… es porque quiere. Yo quiero.»',
  date: 'Al amanecer, en la costa, Finn te enseña a lanzar. Sus manos sobre las tuyas un momento de más.'
});

/* --- NUEVO · Nadia · arquera residente: TODO lo de tiro y doma --- */
mkNpc('bowyer', {
  name: 'Nadia', role: 'Maestra arquera de Vhalor', gender: 'f', romance: true, stall: true,
  loves: ['arrow_mythril', 'pegasus_feather', 'honey_cake', 'warg_fang'],
  talk: ['Antes solo había arcos en los caminos. Ahora tengo puesto fijo en la plaza: seis arcos y las nueve flechas.',
    'La flecha somnífera no mata: adormece. Es la herramienta del domador.',
    'El dardo narcótico hace lo mismo sin gastar arco. Lleva siempre un puñado.',
    'Un tiro flojo hace el 45 % de daño. Uno pleno, el 135 %. Mantén y suelta cuando la barra llegue al final.',
    'Los guantes de agarre tensan un 15 % más rápido. Se nota más de lo que parece.'],
  shop: { sells: ['bow_wood', 'bow_hunter', 'bow_composite', 'crossbow_iron', 'bow_mithril', 'crossbow_steel',
    'arrow_basic', 'arrow_iron', 'arrow_fire', 'arrow_ice', 'arrow_poison', 'arrow_barbed', 'arrow_tame',
    'arrow_bolt', 'arrow_mythril', 'quiver', 'dart_narcotic', 'dart_poison',
    'gloves_grip', 'boots_swift', 'feed_tame', 'meat_lure', 'hide', 'leather', 'hard_leather', 'feather'],
    buys: ['weapon', 'ammo', 'hide', 'leather', 'bone', 'feather', 'unique', 'feed', 'acc'],
    buyMult: { hide: 1.3, leather: 1.2, ammo: 1.15 } },
  services: ['shop', 'stations'],
  cons: { hate: 'No te vende arcos ni flechas.', love: 'Flechas raras a mitad de precio.' },
  hate: 'Nadia tensa el arco sin apuntarte del todo. «Sigue caminando.»',
  lines: [
    { when: { rel: 'dating' }, t: 'Nadia baja el arco al verte. «Vaya. Mi mejor presa resultó ser voluntaria.»' },
    { t: '«Nadia, maestra arquera. Arcos, ballestas, las nueve flechas y todo lo que un domador necesita. ¿Qué te falta?»' }
  ],
  flirt: 'Nadia ladea la cabeza. «Coquetear con quien tiene el arco tensado. Valiente. Me gusta.»',
  date: 'Tiráis juntos hasta el anochecer. Nadia corrige tu postura, y luego se olvida de corregirla.'
});

/* --- NUEVO · Halvar · armero residente: escudos y armaduras --- */
mkNpc('armorer', {
  name: 'Halvar', role: 'Armero de la plaza', gender: 'm', stall: true,
  loves: ['shield_warding', 'adamantite_bar', 'roast', 'golem_core'],
  talk: ['Seis escudos y siete conjuntos completos. Nadie sale de mi puesto desnudo.',
    'El broquel bloquea poco pero perdona el parry. El pavés bloquea casi todo pero pesa como un pecado.',
    'La égida rúnica absorbe fuego y veneno. Contra la hidra, es la diferencia.',
    'Las bardas protegen a tu montura. Un grifo sin barda cae en dos picados.',
    'Si algo se rompe, tráelo: lo reparo por menos de lo que cuesta rehacerlo.'],
  shop: { sells: ['shield_buckler', 'shield_round_wood', 'shield_round', 'shield_kite', 'shield_spiked',
    'shield_tower', 'shield_warding',
    'cloth_head', 'cloth_chest', 'cloth_legs', 'leather_head', 'leather_chest', 'leather_legs',
    'hard_leather_head', 'hard_leather_chest', 'hard_leather_legs',
    'iron_head', 'iron_chest', 'iron_legs', 'steel_head', 'steel_chest', 'steel_legs',
    'mithril_head', 'mithril_chest', 'mithril_legs', 'adamantite_head', 'adamantite_chest', 'adamantite_legs',
    'petarmor_leather', 'petarmor_iron', 'petarmor_steel', 'petarmor_mithril',
    'sword_stone', 'sword_copper', 'sword_iron', 'sword_steel', 'sword_obsidian', 'sword_mithril', 'sword_adamantite',
    'spear_copper', 'spear_iron', 'spear_steel', 'spear_obsidian', 'spear_mithril',
    'mace_iron', 'mace_steel', 'warhammer_steel', 'dagger_iron', 'belt_leather', 'repair_kit'],
    buys: ['weapon', 'armor', 'shield', 'petarmor', 'material', 'acc'] },
  services: ['shop', 'repair'],
  cons: { hate: 'No te vende ni repara nada.', love: 'Reparaciones y bardas a mitad de precio.' },
  hate: 'Halvar cruza los brazos sobre el mostrador. «Mi acero no es para ti.»',
  lines: [{ t: '«Halvar, armero. Escudos, armaduras, bardas y filos. Si vas a salir por esa puerta, sal cubierto.»' }]
});

/* --- Granjeros: 8 con parcela propia y tareas de ayuda --- */
const FARMERS = [
  ['marta', 'Marta', 'Granjera del este', 'f', true, ['crop_pumpkin', 'pie', 'fert_compost'],
   ['Mi parcela da calabazas enormes. El compost es el secreto.', 'Si me riegas diez plantas, te lo pago bien.', 'Odo y yo competimos por la mejor hortaliza cada mes.'],
   'Marta aprieta el azadón. «Ladrón. No te acerques a mis tierras.»',
   '«¡Hola! ¿Vienes a ayudar, a comprar… o a curiosear mis calabazas?»',
   'Marta se ríe, con las mejillas coloradas. «Cuidado, que me sonrojas más que el sol del mediodía.»',
   'Entre los surcos, Marta te muestra su calabaza gigante. Luego te mira a ti, y olvida la calabaza.'],
  ['odo', 'Odo', 'Granjero del este', 'm', false, ['hearty_stew', 'feed_golden', 'fert_bonemeal'],
   ['Marta dice que sus calabazas son mejores. Mentira.', 'Un buen estiércol vale más que un buen consejo.', 'Si veo a alguien robando en mi parcela… lo sabrá el capitán.'],
   'Odo escupe. «Ladrón de hortalizas. Largo de aquí.»',
   '«¿Eh? Ah, tú. Si vienes a ayudar, bien. Si vienes a robar… ya sabes lo que pasa.»'],
  ['helga', 'Helga', 'Granjera del norte', 'f', false, ['crop_beet', 'cheese', 'butter'],
   ['La remolacha del norte es más dulce. Es el frío.', 'Necesito manos para cosechar antes de la lluvia.', 'Mis vacas dan mejor leche que las de nadie.'],
   'Helga cierra el portón. «Fuera de mi campo.»',
   '«Bienvenido a la granja del norte. Hay trabajo si tienes espalda.»'],
  ['tomas', 'Tomás', 'Granjero del molino', 'm', false, ['flour', 'bread', 'corn_bread'],
   ['Muelo el grano en la cocina del pueblo. Ya no hace falta molino aparte.', 'Trae trigo y te lo cambio por harina.', 'Sin harina no hay pan. Sin pan no hay ejército.'],
   'Tomás apaga el fuego. «No muelo para ladrones.»',
   '«¿Traes grano? Entonces habla. Si no, aparta que tengo trabajo.»'],
  ['mira', 'Mira', 'Granjera del arrozal', 'f', true, ['rice_bowl', 'fish_trout', 'herb_tea'],
   ['El arroz quiere agua y paciencia. Como todo lo bueno.', 'El arrozal se inunda solo si llueve. Si no, hay que regarlo a mano.', 'Cocino el mejor cuenco de arroz del valle.'],
   'Mira levanta el rastrillo. «Largo de mi arrozal.»',
   '«El agua está alta hoy. Buen día para plantar… o para ayudar.»',
   'Mira se aparta el pelo mojado y sonríe. «No debería alegrarme tanto verte.»',
   'Cenáis arroz junto al arrozal, con los pies en el agua. Mira no habla, y no hace falta.'],
  ['gunnar', 'Gunnar', 'Granjero de la tundra', 'm', false, ['crop_maca', 'maca_porridge', 'saddle_reindeer'],
   ['Aquí arriba solo crece la maca. Y crece bien.', 'Los renos se comen la cosecha si no la vigilas.', 'El frío conserva la carne mejor que la sal.'],
   'Gunnar silba a sus renos. «Se sueltan si vuelves.»',
   '«Poco grano, mucha raíz. Así se come en la tundra. ¿Ayudas?»'],
  ['yara', 'Yara', 'Granjera del oasis', 'f', true, ['crop_melon', 'crop_grape', 'cider'],
   ['El melón del oasis no tiene rival. Es el agua del desierto.', 'Riego dos veces al día. Sin eso, aquí no crece nada.', 'Mis uvas hacen el vino que bebe Silas.'],
   'Yara tapa el pozo. «Ni una gota para ti.»',
   '«El oasis da para todos… si todos ayudan. ¿Traes brazos?»',
   'Yara te ofrece un gajo de melón. «Cuidado. Es una excusa para que te quedes.»',
   'Bajo la palmera, Yara comparte el melón y el silencio. El desierto puede ser amable.'],
  ['bram', 'Bram', 'Granjero del linar', 'm', false, ['crop_flax', 'linen', 'cloth'],
   ['El lino da tela y aceite. Nada se pierde.', 'Sin tela no hay vendas. Sin vendas no hay heridas cerradas.', 'Mi lino viste a media ciudad.'],
   'Bram escupe. «Mis linos no son tu almacén.»',
   '«Lino, aceite y tela. Eso sale de aquí. ¿Vienes a echar una mano?»']
];
FARMERS.forEach(function (f) {
  const isRom = f[4];
  mkNpc(f[0], {
    name: f[1], role: f[2], gender: f[3], romance: isRom, farmer: true, post: false, hours: [6, 20],
    loves: f[5], talk: f[6],
    shop: { sells: ['seed_wheat', 'seed_potato', 'seed_carrot', 'seed_beet', 'crop_potato', 'crop_carrot',
      'fert_manure', 'fert_compost', 'manure', 'hay', 'straw', 'feed_basic', 'feed_tame'],
      buys: ['crop', 'seed', 'fert', 'feed', 'product'], buyMult: { crop: 1.15 } },
    services: ['help_task', 'shop'],
    cons: { hate: 'Te denuncia si te ve cerca de su parcela.', love: 'Regala semillas raras y paga mejor la ayuda.' },
    hate: f[7], lines: [{ t: f[8] }],
    flirt: isRom ? f[9] : null, date: isRom ? f[10] : null
  });
});

/* --- Mercader Supremo · tierras y lujo --- */
mkNpc('supremo', {
  name: 'Mercader Supremo', role: 'Señor de la Lonja de Tierras', gender: 'm',
  loves: ['gold_bar', 'dragon_scale', 'land_deed', 'wine'],
  talk: ['Cuarenta y cuatro parcelas, desde seis por seis hasta veinte por dieciséis.',
    'Cada parcela que compras encarece la siguiente un siete por ciento.',
    'Sin escritura no hay venta. La emito yo, y cuesta ciento veinte de oro.',
    'Los títulos llegan con la tierra: Colono, Terrateniente, Señor, Noble… y Gran Señor.',
    'Compro legendarios y botín de jefe. Nadie más paga tanto por ellos.'],
  shop: { sells: ['land_deed', 'gold_bar', 'ring_gold', 'ring_silver', 'bag_large', 'bag_explorer',
    'bed_wood', 'bed_feather', 'chest_kit', 'chest_large', 'belt_troll', 'amulet_frost', 'amulet_regen',
    'cloak_shadow', 'lockpick', 'wine'],
    buys: ['material', 'unique', 'legendary', 'acc', 'bag', 'bed'], buyMult: { unique: 1.3, legendary: 1.2 } },
  services: ['land', 'shop', 'stations'],
  cons: { hate: 'No te vende tierras ni escrituras.', love: 'Escrituras más baratas y primera opción en parcelas grandes.' },
  hate: 'El Supremo no levanta la vista. «La Lonja no atiende a quien no respeta sus normas.»',
  lines: [
    { when: { slave: true }, t: '«Un esclavo no firma escrituras. Paga a Bareth, vuelve con el cuello desnudo y hablaremos de tierras.»' },
    { t: '«Bienvenido a la Lonja. Aquí la tierra se mide, se tasa y se firma. Trae una escritura y el oro.»' }
  ],
  extraChoices: [{ t: '¿Cómo funcionan los títulos?', go: 'titles' }],
  nodes: { titles: { text: [{ t: '«Una parcela te hace Colono. Con tres, Terrateniente. Cinco, Señor de Tierras. Ocho, Noble Menor. Doce, Noble Mayor. Y con dieciocho… Gran Señor de Vhalor, con derecho a cinco trabajadores.»' }], choices: [{ t: 'Volver', go: 'root' }] } }
});

/* --- Posadera --- */
mkNpc('gunda', {
  name: 'Gunda', role: 'Posadera del Camino', gender: 'f',
  loves: ['stew', 'ale', 'cheese'],
  talk: ['Dieciocho de oro por una cama bajo techo. Sin bandidos, sin lluvia.',
    'No es tu casa: duermes peor y despiertas con menos vida. Pero despiertas.',
    'El petate se hace a mano, con paja, fibra y cuerda. No necesitas mesa.',
    'A los esclavos les alquilo igual. El oro no lleva collar.'],
  shop: { sells: ['bread', 'cheese', 'ale', 'mead', 'cider', 'stew', 'porridge', 'boiled_egg', 'herb_tea',
    'cooked_meat', 'cooked_fish', 'bed_roll', 'traveler_ration'],
    buys: ['food', 'crop', 'fish'], buyMult: { food: 1.1 } },
  services: ['bed_market', 'shop'],
  cons: { hate: 'No te alquila la cama.', love: 'Cama más barata y desayuno incluido.' },
  hate: 'Gunda cruza los brazos en la puerta. «Aquí no duermes.»',
  lines: [{ t: '«Posada del Camino. Cama limpia, cena caliente y nadie te roba mientras duermes. ¿Te quedas?»' }]
});

/* --- Cazadores errantes --- */
mkNpc('rurik', {
  name: 'Rurik', role: 'Cazador errante', gender: 'm', wanderer: true, hunter: true, post: false,
  loves: ['arrow_barbed', 'dried_meat', 'warg_fang'],
  talk: ['Los lobos cazan en manada. Los ciervos huyen. Así funciona el mundo.',
    'Si te acercas a un jabalí por detrás, te cobrará el atrevimiento.',
    'Vendo pieles y flechas. Compro colmillos.',
    'Para arcos y ballestas, Nadia en la plaza. Yo solo llevo lo del camino.'],
  shop: { sells: ['bow_wood', 'bow_hunter', 'arrow_basic', 'arrow_iron', 'arrow_barbed', 'arrow_tame', 'quiver',
    'dried_meat', 'traveler_ration', 'hide', 'leather', 'dart_narcotic', 'gloves_grip', 'meat_lure'],
    buys: ['hide', 'leather', 'bone', 'feather', 'material', 'unique', 'ammo'], buyMult: { hide: 1.3, leather: 1.2 } },
  services: ['shop', 'stations'],
  cons: { hate: 'No comercia y te dispara si te acercas.', love: 'Flechas raras a mitad de precio.' },
  hate: 'Rurik tensa el arco sin apuntarte del todo. «Sigue caminando.»',
  lines: [{ t: '«Cazador. Vivo de lo que cae y vendo lo que sobra. ¿Traes pieles o vienes a comprar?»' }]
});
mkNpc('skadi', {
  name: 'Skadi', role: 'Cazadora de la tundra', gender: 'f', romance: true, wanderer: true, hunter: true, post: false,
  loves: ['fish_ice', 'arrow_ice', 'saddle_polar_bear', 'frost_core'],
  talk: ['El oso polar te oye antes de verte. Ve por detrás.',
    'Las flechas gélidas ralentizan. Contra un wyvern, eso es la vida.',
    'Domar un huargo necesita dardos y carne. Y paciencia.',
    'En el Trono de Escarcha duerme un jotun. No lo despiertes sin escudo.'],
  shop: { sells: ['bow_composite', 'arrow_ice', 'arrow_poison', 'arrow_tame', 'rod_iron', 'fishing_net',
    'hard_leather', 'petarmor_iron', 'boots_swift', 'potion_ice_res', 'bandage_clean', 'meat_lure'],
    buys: ['hide', 'leather', 'fish', 'bone', 'unique', 'ammo'], buyMult: { fish: 1.2, unique: 1.2 } },
  services: ['shop', 'stations'],
  cons: { hate: 'Te marca como presa.', love: 'Comparte rutas de caza y descuentos.' },
  hate: 'Skadi no baja el arco. «Un paso más y cazamos otra cosa.»',
  lines: [
    { when: { rel: 'dating' }, t: 'Skadi baja el arco al verte. «Vaya. Mi mejor presa resultó ser voluntaria.»' },
    { t: '«Cazadora de la tundra. Pieles, hielo y flechas. ¿Qué necesitas?»' }
  ],
  flirt: 'Skadi ladea la cabeza. «Coquetear con quien tiene el arco tensado. Valiente. Me gusta.»',
  date: 'Rastreáis juntos hasta el anochecer. Skadi comparte su manta y su silencio, que es más.'
});

/* --- Mercaderes errantes --- */
mkNpc('peddler', {
  name: 'Buhonero', role: 'Mercader errante', gender: 'm', wanderer: true, post: false,
  loves: ['gold_nugget', 'jam', 'thread'],
  talk: ['Voy de camino en camino. Lo que no lleva nadie, lo llevo yo.',
    'Compro barato donde sobra y vendo donde falta.',
    'Si me ves de noche, es que voy tarde. No me robes.'],
  shop: { sells: ['thread', 'cloth', 'rope', 'salt', 'oil', 'needle', 'bait', 'torch', 'bandage_simple',
    'bag_small', 'feed_good', 'feed_tame', 'fert_compost', 'waterskin', 'flint', 'clay', 'sand'],
    buys: ['material', 'crop', 'food', 'product', 'seed'], buyMult: { material: 1.1 } },
  services: ['shop'],
  cons: { hate: 'Sube precios y avisa a la guardia.', love: 'Objetos raros ocasionales.' },
  hate: 'El buhonero cierra el carro. «Hoy no vendo.»',
  lines: [{ t: '«¡Buhonero! De todo un poco y nada mucho. Mira, mira, que sigo camino.»' }]
});
mkNpc('smuggler', {
  name: 'Contrabandista', role: 'Mercader de lo prohibido', gender: 'm', wanderer: true, post: false,
  loves: ['crystal', 'lockpick', 'venom_sac'],
  talk: ['No preguntes de dónde viene. Pregunta cuánto cuesta.',
    'Cristal corrupto, veneno y ganzúas. Todo legal si nadie mira.',
    'La guardia no me quiere. Yo no quiero a la guardia.'],
  shop: { sells: ['lockpick', 'crystal', 'venom_sac', 'dart_poison', 'arrow_poison', 'cloak_shadow',
    'obsidian', 'sulfur', 'meat_lure', 'ice_shard'],
    buys: ['crystal', 'venom_sac', 'obsidian', 'unique', 'material'], buyMult: { crystal: 1.35, unique: 1.25 } },
  services: ['shop'],
  cons: { hate: 'Te delata a la guardia por rencor.', love: 'Descuentos en lo prohibido.' },
  hate: 'El contrabandista escupe. «No trato con soplones.»',
  lines: [{ t: '«Shhh. Aquí no hay nada ilegal, solo mercancía sin papeles. ¿Compras o paseas?»' }]
});
mkNpc('herbalist', {
  name: 'Herbolario', role: 'Sanador errante', gender: 'f', wanderer: true, post: false,
  loves: ['herb_blue', 'herb_fire', 'honey'],
  talk: ['Hierba azul para el veneno, hierba de brasa para el fuego. No las confundas.',
    'Una venda limpia vale más que dos pociones baratas.',
    'El sangrado se corta con venda. El fuego con ungüento. Aprende o sufre.'],
  shop: { sells: ['herb', 'herb_blue', 'herb_fire', 'bandage_simple', 'bandage_clean', 'bandage_herb',
    'antidote', 'salve_burn', 'splint', 'potion_heal_s', 'potion_stamina_s', 'potion_fire_res',
    'honey', 'herb_tea', 'dart_narcotic', 'charm_beast', 'feed_tame'],
    buys: ['herbany', 'honey', 'heal', 'potion', 'crop'], buyMult: { herbany: 1.4 } },
  services: ['shop', 'stations'],
  cons: { hate: 'No te cura ni vende.', love: 'Vendas y ungüentos a mitad de precio.' },
  hate: 'El herbolario cierra su morral. «Mis hierbas no son para ti.»',
  lines: [{ t: '«Hierbas, vendas y remedios. Camino donde hay heridas. ¿Traes hierbas o traes heridas?»' }]
});

/* ==========================================================
7 · CONTRATOS
========================================================== */
function hunt(id, name, target, count, reward, trust, when) {
  quest({ id: id, kind: 'hunt', name: name, target: target, count: count, reward: reward, trust: trust, when: when || {} });
}
function gather(id, name, item, count, reward, trust, when) {
  quest({ id: id, kind: 'gather', name: name, item: item, count: count, reward: reward, trust: trust, when: when || {} });
}
hunt('q_boar', 'Plaga de jabalíes', 'boar', 3, 110, 5);
hunt('q_wolf', 'Lobos en el camino', 'wolf', 4, 150, 5);
hunt('q_rabbit', 'Conejos en el sembrado', 'rabbit', 6, 70, 3);
hunt('q_skeleton', 'Huesos inquietos', 'skeleton', 5, 220, 6);
hunt('q_bandit', 'Bandidos del sur', 'bandit', 4, 260, 8);
hunt('q_scorpion', 'Nido de escorpiones', 'scorpion', 5, 200, 6);
hunt('q_croc', 'Cocodrilos del pantano', 'crocodile', 3, 300, 7);
hunt('q_lynx', 'Linces en el gallinero', 'lynx', 3, 190, 5);
hunt('q_warg', 'La sombra del huargo', 'warg', 2, 420, 10, { free: true });
hunt('q_shadow', 'Sabuesos del túmulo', 'shadow_hound', 3, 480, 10, { free: true, trustMin: 10 });
hunt('q_trollkin', 'Trolls de la fortaleza', 'troll_kin', 2, 620, 12, { free: true, trustMin: 20 });
hunt('q_manticore', 'La mantícora del risco', 'manticore', 1, 700, 12, { free: true, trustMin: 20 });
hunt('q_basilisk', 'Ojos en la ciénaga', 'basilisk', 1, 760, 12, { free: true, trustMin: 20 });
hunt('q_cerberus', 'Las tres gargantas', 'cerberus', 1, 880, 14, { free: true, trustMin: 25 });
hunt('q_troll', 'El Rey Troll', 'troll_king', 1, 900, 15, { free: true, trustMin: 20 });
hunt('q_hydra', 'La Hidra del Pantano', 'hydra', 1, 1200, 15, { free: true, trustMin: 20 });
hunt('q_phoenix', 'El Fénix Cenizo', 'phoenix', 1, 1400, 15, { free: true, trustMin: 20 });
hunt('q_fenrir', 'Fenrir el Encadenado', 'fenrir', 1, 1800, 18, { free: true, trustMin: 30 });
hunt('q_jotun', 'El Trono de Escarcha', 'jotun_frost', 1, 1900, 18, { free: true, trustMin: 30 });
hunt('q_dragon', 'La Falla del Dragón', 'dragon_ember', 1, 2600, 22, { free: true, trustMin: 40 });
gather('q_wood', 'Madera para la muralla', 'wood', 40, 130, 4);
gather('q_stone', 'Piedra para el cuartel', 'stone', 40, 140, 4);
gather('q_copper', 'Cobre para las puntas', 'copper_ore', 16, 200, 5);
gather('q_coal', 'Carbón para la forja', 'coal', 20, 180, 5);
gather('q_iron', 'Hierro para las lanzas', 'iron_bar', 8, 320, 7, { free: true });
gather('q_steel', 'Acero para la guardia', 'steel_bar', 6, 520, 9, { free: true, trustMin: 15 });
gather('q_fish', 'Pescado para el cuartel', 'fish_trout', 10, 190, 5);
gather('q_grain', 'Grano para el invierno', 'crop_wheat', 16, 210, 6);
gather('q_bandage', 'Vendas para los heridos', 'bandage_clean', 8, 340, 8, { free: true });
gather('q_arrows', 'Flechas para la torre', 'arrow_iron', 30, 380, 8, { free: true, trustMin: 10 });

/* ==========================================================
8 · NOMBRES Y CONSEJOS (pocos y útiles, sin saturar)
========================================================== */
D.NAMES.male = ['Aldric', 'Bran', 'Cedric', 'Darian', 'Edric', 'Faelan', 'Gareth', 'Hadrian', 'Ivor', 'Jorah',
  'Kael', 'Leoric', 'Merek', 'Noran', 'Osric', 'Percival', 'Quillan', 'Rowan', 'Stefan', 'Tristan',
  'Ulric', 'Viggo', 'Wulfric', 'Yorick', 'Aksel', 'Bjorn', 'Corvin', 'Dag', 'Emrys', 'Halvar'];
D.NAMES.female = ['Aria', 'Brenna', 'Celia', 'Daria', 'Elara', 'Fiora', 'Gwen', 'Helena', 'Isolde', 'Jessa',
  'Kira', 'Liora', 'Maren', 'Neria', 'Orla', 'Petra', 'Quenna', 'Rosalind', 'Sable', 'Talia',
  'Una', 'Vesna', 'Wren', 'Ysolde', 'Astrid', 'Brynhild', 'Dagny', 'Eir', 'Freydis', 'Sigrid'];

[
  'El cobre se pica con el pico de piedra: cinco golpes. Es lento, pero es la puerta a todas las mejoras.',
  'Nadia vende arcos y las nueve flechas en la plaza. Halvar, escudos y armaduras. Ya no hay que buscar errantes.',
  'El pienso de doma vale para cualquier herbívoro; el señuelo de carne, para cualquier carnívoro.',
  'Una herramienta rota no desaparece: selecciónala en el inventario y repárala con muy poco.',
  'La guía de doma completa está en Ajustes → Cómo jugar: cada animal con sus comidas.',
  'El horno y la mesa públicos de la plaza son gratis, pero tardan entre usos y no dan calidad.',
  'Cada nivel da un punto de habilidad (H) y uno de receta (J) para aprender un saber.',
  'Las bestias atacan en ráfagas y luego descansan. Ese descanso es tu ventana.',
  'Mantén el ataque para tensar el arco; suelta cuando la barra llegue al final.',
  'Los primeros 0,22 s de bloqueo son parry: 10 % de daño y el atacante queda aturdido.',
  'Las tareas de ayuda en granjas vecinas pagan oro y confianza. Dos días de plazo.',
  'El Mercader Supremo vende las 44 parcelas. Necesitas una escritura de 120 oro por compra.'
].forEach(DEF.tip);

/* ==========================================================
9 · AYUDA · sistemas + GUÍA DE DOMA COMPLETA
========================================================== */
const H = DEF.help;
H('Tu historia', 'Fuiste encontrado divagando por las tierras de Jotun, fuiste capturado por los cazadores y te trajeron aquí. Empiezas como esclavo y tu destino depende de tu esfuerzo. Bareth te dio un collar, un pico y un hacha de piedra; nada más. Debes 2.000 de oro. Paga y serás libre para comprar tierras, abrir cuenta, contratar trabajadores y formar una familia.', 'debt');
H('Primeros pasos', 'Tala árboles y pica rocas con las herramientas de piedra. Vende madera, piedra y sílex en la bandeja del concejo o a Bareth. Con lo primero que ganes compra un arco corto y flechas en la misma bandeja: cazar rinde más que picar. El cobre aparece en pradera, bosque, montaña y altiplano; se pica con el pico de piedra aunque tardes cinco golpes.', 'compass');
H('Herramientas por material', 'Cada tier golpea más rápido y dura más. Piedra: 0,62× de velocidad y 80 usos (2,2 s por árbol). Cobre: 0,86× y 150 usos. Hierro: 1,06× y 260. Acero: 1,26× y 360. Obsidiana: 1,38× y 320. Mithril: 1,52× y 480. Adamantita: 1,72× y 640 usos, un golpe por veta. El poder también importa: cada golpe hace poder − dificultad + 1, así que un pico de hierro rompe el cobre de dos golpes y el de adamantita de uno.', 'craft');
H('Herramientas rotas y reparación', 'Cuando la durabilidad llega a cero el objeto NO desaparece: queda marcado como roto y deja de funcionar. Selecciónalo en el inventario y pulsa Reparar: cuesta una fracción de su receta (el pico de piedra, 2 piedras y 1 madera). Dorn y Halvar también reparan el equipo equipado por oro, y el kit de reparación restaura un 40 % en el campo.', 'repair');
H('Dónde comprar cada cosa', 'Bandeja del concejo: madera, piedra, fibra, heno, comida sencilla, antorchas, vendas, arco corto, flechas y pienso de doma. Bareth: herramientas de piedra y ropa. Lía: las 24 semillas, comida, mochilas, tela, fertilizantes y señuelos. Nadia (arquería): los 6 arcos y ballestas, las 9 flechas, carcaj, dardos, guantes y botas. Halvar (armero): los 7 escudos, los 7 conjuntos de armadura, bardas, espadas, lanzas, mazas y martillos. Dorn: herramientas de todos los tiers, carbón, lingotes y herrería. Voss: ganado, piensos y las 15 sillas de montar. Finn: cañas, cebo, redes y pescado. Maera y el herbolario: curas y pociones. Supremo: escrituras, tierras, cofres, camas y accesorios mayores. Rurik, Skadi, el buhonero y el contrabandista completan lo raro por los caminos.', 'shop');
H('Talleres públicos', 'En la plaza hay horno público y mesa pública del concejo: gratis y disponibles desde el minuto uno, sin parcela ni nivel. La contrapartida: el horno espera unos 8 s entre usos y gasta una unidad extra de combustible; la mesa, unos 3 s. Ninguno produce piezas de calidad. Cuando construyas los tuyos no habrá espera ni recargo.', 'fire');
H('Cinco mesas, no doce', 'Solo existen cinco estaciones construibles: fogata, banco de trabajo, cocina, forja y alambique. El antiguo horno, yunque, telar, potro, molino y mesa de flechas se han fusionado en ellas. Cada una se desbloquea como una receta más: nivel más puntos de Oficio.', 'build');
H('Nivel, tiers y saberes', 'Todo suma experiencia. Cada nivel sube tu vida, stamina y defensa base, y da un punto de habilidad (H) y un punto de receta (J). Las recetas se reparten en tres tiers: 1–10, 11–30 y 31–40. Con los puntos de receta aprendes saberes enteros: Fundición y forja, Oficio de banco, Cocina de campaña, Campo y granja, Alquimia (tier 2) y Maestría mayor (tier 3). Lo que se hace a mano y la cocina de fogata básica no piden saber.', 'level');
H('Combustible', 'Cocinar, fundir, forjar y destilar consumen combustible de la mochila: madera 1, carbón 4, carbón vegetal 6. Oficio reduce el gasto. En los talleres públicos se suma una unidad extra. Sin combustible la receta aparece bloqueada aunque tengas los materiales.', 'fire');

/* --- GUÍA DE DOMA: método + una sección por nivel con cada animal --- */
H('Doma · cómo funciona', 'Acércate a una criatura domable y pulsa Interactuar. El juego te dirá exactamente qué necesita: comida, sedación o vínculo, y cuántas tomas faltan. Cada comida suma confianza hasta completar la barra; el número sube con el nivel del animal y baja con tu Afinidad. Las crías piden la mitad. Si te falta su comida favorita, usa el señuelo universal: pienso de doma para herbívoros y omnívoros, señuelo de carne para carnívoros y carroñeros. Ambos se fabrican a mano y los venden Lía, Voss y Nadia.', 'tame');
H('Doma · por comida', 'El método más simple: lleva el alimento en la mochila, acércate y pulsa Interactuar repetidas veces. Sirve para domésticos, presas y algunos salvajes dóciles. Los que huyen (ciervo, conejo, caballo, zorro) exigen acercarse andando, no corriendo: el joystick a media inclinación basta.', 'feed');
H('Doma · por sedación', 'Para depredadores y míticos. Baja su vida por debajo del 60 %, lanza un dardo narcótico o una flecha somnífera y aliméntalo mientras duerme 42 segundos. Si despierta sin domar conserva la mitad del progreso, así que no empieces de cero. Los dardos los venden Nadia y el herbolario; las flechas somníferas, Nadia y Rurik.', 'potion');
H('Doma · por vínculo', 'Unicornio, kirin y pegaso no aceptan sedación. Quédate quieto a menos de tres tiles, sin atacar ni correr, hasta llenar la barra de calma (2,8–3,4 s). Entonces ofréceles su comida. Atacar o esprintar rompe la calma y hay que empezar de nuevo.', 'heart');
H('Doma · compañeros y monturas', 'Puedes llevar dos compañeros activos, y cuatro con Afinidad 10. Una montura necesita ser adulta, estar domada y llevar su silla: las 15 sillas las vende Voss. Afinidad 3 abre las terrestres, 5 las grandes, 7 las voladoras y 9 las míticas. Las bardas de Halvar les dan defensa; sin barda, un grifo cae en dos picados.', 'mount');
if (D.TAME_GUIDE && D.TAME_TIERS) {
  D.TAME_TIERS.forEach(function (tt) {
    const rows = D.TAME_GUIDE.filter(function (g) { return g.tier === tt.id; });
    if (!rows.length) return;
    const txt = tt.desc + ' —— ' + rows.map(function (r) {
      const foods = r.foodNames.slice(0, 4).join(', ');
      const req = r.reqText && r.reqText !== 'Sin requisito' ? ' · ' + r.reqText : '';
      const extra = r.mount ? ' · montable' + (r.fly ? ' (vuela)' : '') : (r.livestock ? ' · ganado: ' + r.product : '');
      return r.name + ' [' + r.diet + ']: ' + foods + ' — ' + r.feeds + '×' + req + extra;
    }).join(' · ');
    H('Doma · ' + tt.name, txt, tt.glyph);
  });
  const noTame = D.TAME_GUIDE.filter(function (g) { return !g.tameable; }).map(function (g) { return g.name; });
  if (noTame.length) H('Doma · lo que no se doma', 'No aceptan doma: ' + noTame.join(', ') + '. Los jefes se cazan por su botín único, los constructos se invocan con pilón o repisa, y los no-muertos y bandidos son hostiles por naturaleza.', 'warning');
  const where = D.TAME_GUIDE.filter(function (g) { return g.tameable && g.where; }).map(function (g) { return g.name + ' → ' + g.where; });
  H('Doma · dónde encontrar cada animal', where.join(' · '), 'compass');
}

H('Supervivencia', 'Salud, stamina y saciedad. La saciedad baja un punto cada 7 segundos; a cero pierdes vida. Con menos de 18 la stamina no regenera y te mueves más despacio. Con más de 55 regeneras vida poco a poco. Caer no mata: despiertas con penalización de oro o materiales.', 'heart');
H('Combate cuerpo a cuerpo', 'Tres fases: preparación, golpe y recuperación. Cuatro golpes encadenados con multiplicadores 1 / 1,14 / 1,34 / 1,62 si atacas dentro de 0,85 s. Desde la ventana de cancelación (0,13 s) puedes bloquear o esquivar. Mantener el ataque con Fuerza 2 carga un golpe pesado de 2,1×. Mazas y martillos rompen guardias.', 'sword');
H('Escudo, bloqueo y parry', 'Mantener el botón reduce el daño según el escudo: broquel 48 %, redondo 62 %, cometa 72 %, pavés 86 %, égida 78 % con absorción elemental. Los primeros 0,22 s son parry: solo recibes el 10 %, recuperas 8 de stamina y el atacante queda aturdido 1,15 s. Con Guardia 5 el embate aturde; con Guardia 8 devuelves proyectiles.', 'shield');
H('Arcos y flechas', 'Mantén para tensar: 0,22 s da un tiro flojo (45 %) y 0,85 s uno pleno (135 %). Arrastra el dedo sobre el botón para apuntar con precisión. Nueve municiones: básica, pesada, ígnea, gélida, veneno, dentada, somnífera, virote y mithril. X cicla la munición; Tab cambia de objetivo.', 'bow');
H('Ecología salvaje', 'Cada especie tiene dieta y facción. Los carnívoros cazan herbívoros; las presas huyen de sus depredadores. El director separa los grupos y mantiene distancia entre depredadores y presas. Las manadas de herbívoros van juntas; los depredadores, en parejas.', 'tame');
H('Santuarios y jefes', 'Diez zonas únicas reparten la fauna mítica. Cada criatura mítica nace solo en su santuario y no lo abandona. Los seis jefes cambian de patrón por fases: el Rey Troll invoca trolls, la Hidra se regenera, el Fénix renace una vez, Fenrir llama sabuesos, el Jotun congela el suelo y el Dragón abre cuatro fases con meteoros. Sus botines alimentan las recetas de Tier 3.', 'boss');
H('Granja', 'Compra una parcela, ara con azada, siembra, riega y fertiliza. Hay 24 cultivos con ciclos de 2 a 4 días. Regar multiplica el crecimiento; el fertilizante dorado produce cosechas de tres estrellas. La hoz cosecha en área y el espantapájaros mantiene fuera a los herbívoros.', 'role_farm');
H('Ayudar en granjas vecinas', 'Ocho granjeros tienen parcela propia: Marta, Odo, Helga, Tomás, Mira, Gunnar, Yara y Bram. Pide trabajo y te asignarán una tarea concreta con dos días de plazo. Al completarla vuelves y cobras oro, confianza y experiencia. Una tarea por granjero y día.', 'quest');
H('Ganado', 'Compra animales en la Intendencia y colócalos desde la mochila: gallinero para gallinas, patos y conejos; corral y granero para ovejas, cabras, cerdos, vacas y alpacas; establo para monturas. Aliméntalos para que produzcan huevo, leche, lana, trufa y estiércol. La calidad del pienso decide la del producto.', 'role_tend');
H('Dormir y camas', 'El petate se hace a mano con paja, fibra y cuerda: duermes donde estés, con 34 % de emboscada y 72 % de recuperación. La posada de Gunda cuesta 18 oro, es segura y te deja algo mermado. En tu casa, una cama colocada restaura todo sin riesgo; las de plumas y el lecho noble despiertan con vigor extra.', 'bed');
H('Curas y estados', 'El sangrado se corta con cualquier venda. El veneno, con antídoto, agua bendita o infusión. El fuego, con ungüento. La ralentización, con férula o bálsamo de escarcha. Aplicar una venda lleva entre 0,9 y 1,6 s: no lo hagas delante de un jefe.', 'potion');
H('Tierras y títulos', '44 parcelas de seis tamaños. Las vende el Mercader Supremo: necesitas una escritura (120 oro) y el precio, que sube un 7 % por parcela poseída. Los títulos llegan con la cantidad: Colono, Terrateniente, Señor de Tierras, Noble Menor, Noble Mayor y Gran Señor de Vhalor.', 'parcel');
H('Economía y banco', 'Cada comerciante compra mejor lo suyo: Finn el pescado un 25 % más, los granjeros la cosecha un 15 %, Nadia y Rurik las pieles un 30 %. El banco de Silas da 0,5 % diario hasta 14 monedas y el oro depositado nunca se pierde al caer.', 'bank');
H('Familia', 'Sube la confianza de un NPC del género opuesto a 80, coquetea, ten citas y propón matrimonio con dos anillos de oro. Necesitas casa con dos camas. Maera celebra la boda por 50 oro. Los hijos nacen a los cinco días, crecen en tres etapas y de adolescentes pueden trabajar.', 'family');
H('Robo y consecuencias', 'Cosechar en parcela ajena es robar. Con testigos a menos de 9 tiles pierdes 30 de confianza y sube tu busca; sin testigos, solo 8. Con 40 de busca la guardia te persigue.', 'warning');
H('Controles y pantalla', 'Joystick o WASD para moverte (analógico: andar despacio o correr). Espacio ataca y tensa. E interactúa. Q esquiva. F monta o despega. L bloquea. Tab cambia objetivo. X munición. Shift corre. 1–5 barra rápida. I inventario, C crafteo, J recetario, B construir, M mapa, R relaciones, H habilidades, O editar controles, Esc pausa. El juego es horizontal; en Ajustes puedes mover, redimensionar y cambiar la opacidad de cada grupo de controles.', 'settings');

/* ==========================================================
10 · TABLAS AUXILIARES
========================================================== */
D.FARM_OWNERS = FARMERS.map(function (f) { return f[0]; });
D.WANDERERS = ['peddler', 'smuggler', 'herbalist'];
D.HUNTERS = ['rurik', 'skadi'];
D.PARCEL_CLASSES = [
  { cls: 'XS', w: 6, h: 6, mult: 1.0 },
  { cls: 'S', w: 8, h: 8, mult: 1.15 },
  { cls: 'M', w: 12, h: 10, mult: 1.3 },
  { cls: 'L', w: 16, h: 12, mult: 1.5 },
  { cls: 'XL', w: 20, h: 16, mult: 1.75 },
  { cls: 'XXL', w: 24, h: 18, mult: 2.0 }
];
D.BED_TIERS = { roll: 0, straw: 1, wood: 2, feather: 3, noble: 4 };
D.SERVICE_ACTS = Object.keys(SVC);
const MERCHANT_GROUPS = { hunter: 1 };

/* Índice de tiendas: quién vende cada objeto (lo usa la UI). */
D.SHOP_INDEX = Object.create(null);
Object.keys(D.NPCS).forEach(function (id) {
  const n = D.NPCS[id];
  if (!n.shop || !n.shop.sells) return;
  n.shop.sells.forEach(function (it) {
    if (!D.SHOP_INDEX[it]) D.SHOP_INDEX[it] = [];
    if (D.SHOP_INDEX[it].indexOf(id) < 0) D.SHOP_INDEX[it].push(id);
  });
});
D.STALL.sells.forEach(function (it) {
  if (!D.SHOP_INDEX[it]) D.SHOP_INDEX[it] = [];
  if (D.SHOP_INDEX[it].indexOf('stall') < 0) D.SHOP_INDEX[it].unshift('stall');
});
D.sellersOf = function (itemId) {
  const list = D.SHOP_INDEX[itemId] || [];
  return list.map(function (id) { return id === 'stall' ? 'Bandeja del concejo' : (D.NPCS[id] ? D.NPCS[id].name : id); });
};

/* ==========================================================
11 · VALIDACIÓN FORENSE Y SELLADO
========================================================== */
const FUNC_OK = ['sleep', 'chest', 'livestock', 'mounts', 'gate', 'guard_post', 'guardian', 'water_source', 'light', 'scare'];
Object.keys(D.CITY_STRUCTS).forEach(function (k) {
  const c = D.CITY_STRUCTS[k];
  if (!c.name || !c.kind) D.errors.push('Estructura de ciudad incompleta: ' + k);
});
Object.keys(D.PUBLIC_STATIONS).forEach(function (k) {
  const p = D.PUBLIC_STATIONS[k];
  if (!D.CITY_STRUCTS[k]) D.errors.push('Taller público sin estructura: ' + k);
  if (D.STATIONS.indexOf(p.station) < 0) D.errors.push('Taller público con estación inválida: ' + k);
});
Object.keys(D.CITY_POSTS).forEach(function (k) {
  const p = D.CITY_POSTS[k];
  if (!D.NPCS[k]) D.errors.push('Puesto sin tendero: ' + k);
  if (!D.CITY_STRUCTS[p.key]) D.errors.push('Puesto sin estructura: ' + k);
});
Object.keys(D.BUILDINGS).forEach(function (k) {
  const b = D.BUILDINGS[k];
  if (!b.size || b.size.length !== 2) D.errors.push('Edificio sin tamaño: ' + k);
  (b.functions || []).forEach(function (f) {
    if (D.STATIONS.indexOf(f) >= 0) return;
    if (FUNC_OK.indexOf(f) < 0) D.errors.push('Función desconocida en ' + k + ': ' + f);
  });
  if (b.upgradeFrom && !D.BUILDINGS[b.upgradeFrom]) D.errors.push('Mejora sin origen: ' + k);
  if (b.guardian && !D.SPECIES[b.guardian]) D.errors.push('Guardián inexistente en ' + k);
  (b.accepts || []).forEach(function (s) { if (!D.SPECIES[s]) D.errors.push('Ganado inválido en ' + k + ': ' + s); });
});
Object.keys(D.STATION_INFO).forEach(function (s) {
  const info = D.STATION_INFO[s];
  if (!info.building) return;
  if (!D.BUILDINGS[info.building]) { D.errors.push('Estación sin edificio: ' + s); return; }
  if ((D.BUILDINGS[info.building].functions || []).indexOf(s) < 0) D.errors.push('Edificio no ofrece su estación: ' + s);
});
Object.keys(D.MERCHANT_STATIONS).forEach(function (n) {
  if (!D.NPCS[n] && !MERCHANT_GROUPS[n]) D.errors.push('Mercader con taller inexistente: ' + n);
  D.MERCHANT_STATIONS[n].stations.forEach(function (s) {
    if (D.STATIONS.indexOf(s) < 0) D.errors.push('Taller inválido en ' + n + ': ' + s);
  });
});
Object.keys(D.NPCS).forEach(function (k) {
  const n = D.NPCS[k];
  if (!n.dlg || !n.dlg.nodes.root) D.errors.push('NPC sin diálogo raíz: ' + k);
  (n.services || []).forEach(function (s) { if (!SVC[s]) D.errors.push('Servicio desconocido en ' + k + ': ' + s); });
  Object.keys(n.dlg.nodes).forEach(function (nk) {
    (n.dlg.nodes[nk].choices || []).forEach(function (c) {
      if (c.go && !n.dlg.nodes[c.go]) D.errors.push('Destino de diálogo roto: ' + k + '.' + nk + ' → ' + c.go);
      if (c.act && c.act !== 'end' && c.act !== 'smalltalk' && c.act !== 'gift' && c.act !== 'propose' && !SVC[c.act])
        D.errors.push('Acción de diálogo desconocida: ' + k + ' → ' + c.act);
    });
  });
});
D.STALL.sells.forEach(function (i) { if (!D.ITEMS[i]) D.errors.push('Bandeja vende objeto inexistente: ' + i); });
D.STALL.buys.forEach(function (i) { if (!D.ITEMS[i]) D.errors.push('Bandeja compra objeto inexistente: ' + i); });
D.FARM_OWNERS.forEach(function (f) { if (!D.NPCS[f]) D.errors.push('Granjero sin NPC: ' + f); });

/* Cobertura de mercado: todo objeto equipable debe poder comprarse. */
const MUST_SELL = [];
Object.keys(D.ITEMS).forEach(function (id) {
  const it = D.ITEMS[id];
  if (it.cat === 'tool' || it.cat === 'weapon' || it.cat === 'shield' || it.cat === 'armor' ||
      it.cat === 'ammo' || it.cat === 'saddle' || it.cat === 'petarmor' || it.cat === 'bag') MUST_SELL.push(id);
});
const unsold = MUST_SELL.filter(function (id) { return !D.SHOP_INDEX[id]; });
if (unsold.length) D.errors.push('Objetos equipables sin vendedor: ' + unsold.join(', '));

const ok = DEF.validate();
if (!ok) console.error('[CR] data · ' + D.errors.length + ' referencias rotas:\n' + D.errors.slice(0, 40).join('\n'));
else DEF.seal();

console.info('[CR] data-world.js v5 · ' + Object.keys(D.BUILDINGS).length + ' edificios (' + HOUSES.length +
  ' casas, ' + STATION_BLD.length + ' estaciones) · ' + Object.keys(D.CITY_STRUCTS).length + ' estructuras · ' +
  Object.keys(D.PUBLIC_STATIONS).length + ' talleres públicos · ' + Object.keys(D.NPCS).length + ' NPC · ' +
  D.QUESTS.length + ' contratos · ' + D.HELP.length + ' secciones de ayuda · validación: ' + (ok ? 'OK' : 'FALLO'));
console.info('[CR] mercado · ' + Object.keys(D.SHOP_INDEX).length + ' objetos a la venta · ' +
  MUST_SELL.length + ' equipables comprobados · sin vendedor: ' + unsold.length);
console.info('[CR] guía de doma · ' + (D.TAME_GUIDE ? D.TAME_GUIDE.length : 0) + ' especies documentadas en la ayuda');
})();