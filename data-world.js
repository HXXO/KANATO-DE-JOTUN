/* ============================================================
KANATO DE JOTUN · data-world.js — Contenido v3 (parte 4 de 4)
Registra edificios, estaciones, casas, camas, defensas, NPC con
diálogos, contratos, nombres, consejos y la ayuda completa.
Al final valida TODAS las referencias cruzadas y sella los datos.
============================================================ */
(function () {
'use strict';
const CR = window.CR;
if (!CR || !CR.DEF) { console.error('[CR] data-world.js requiere data.js'); return; }
const DEF = CR.DEF, D = CR.DATA, B = D.BAL;
const bld = DEF.building, npc = DEF.npc, quest = DEF.quest;

/* ==========================================================
1 · ESTRUCTURAS DE LA CIUDAD (no construibles por el jugador)
========================================================== */
D.CITY_STRUCTS = {
  church:       { name: 'Iglesia del Alba',      wall: '#d3c8b0', roof: '#7a5f8a', kind: 'church',    solid: true, enter: true },
  barracks:     { name: 'Cuartel de Vhalor',     wall: '#9aa0a8', roof: '#6b4a3a', kind: 'barracks',  solid: true, enter: true },
  owner_house:  { name: 'Casa del Dueño',        wall: '#c8b48a', roof: '#8a4a3a', kind: 'house',     solid: true, enter: true },
  bank:         { name: 'Banco del Alba',        wall: '#d8cfae', roof: '#4a6a5a', kind: 'bank',      solid: true, enter: true },
  smithy:       { name: 'Herrería de Dorn',      wall: '#a89880', roof: '#5a4a3a', kind: 'smithy',    solid: true, enter: true },
  steward:      { name: 'Intendencia',           wall: '#c0b090', roof: '#6a5a3a', kind: 'steward',   solid: true, enter: true },
  land_office:  { name: 'Lonja de Tierras',      wall: '#c8c0a0', roof: '#3f6a5a', kind: 'bank',      solid: true, enter: true },
  alchemy_hut:  { name: 'Botica del Alba',       wall: '#b8a8b0', roof: '#5a4a6a', kind: 'house',     solid: true, enter: true },
  hunter_lodge: { name: 'Albergue del Cazador',  wall: '#a89070', roof: '#5a6a3a', kind: 'house',     solid: true, enter: true },
  caravan_post: { name: 'Puesto de Caravanas',   wall: '#b89a6a', roof: '#8a5a3a', kind: 'stall',     solid: true, enter: false },
  inn:          { name: 'Posada del Camino',     wall: '#c8b088', roof: '#7a5a3a', kind: 'house',     solid: true, enter: true },
  stall:        { name: 'Puesto del mercado',    wall: '#b89a6a', roof: '#c05a3a', kind: 'stall',     solid: true, enter: false },
  fountain:     { name: 'Fuente de la plaza',    wall: '#b0b8c0', roof: '#5a9ac0', kind: 'fountain',  solid: true, enter: false },
  house_small:  { name: 'Casa de Vhalor',        wall: '#c8b898', roof: '#8a6a4a', kind: 'house',     solid: true, enter: true },
  farm_house:   { name: 'Casa de granja',        wall: '#c0a880', roof: '#7a6a3a', kind: 'house',     solid: true, enter: true },
  pen:          { name: 'Corral de esclavos',    wall: '#8a7050', roof: '#6a5030', kind: 'pen',       solid: false, enter: false },
  gargoyle_perch_city: { name: 'Repisa de gárgola', wall: '#8a8a90', roof: '#6a6a72', kind: 'bench',  solid: true, enter: false }
};

/* ==========================================================
2 · CASAS · 12 niveles con cadena de mejora
========================================================== */
const HOUSES = [
  ['shelter', 'Refugio de ramas', 0, [2, 2], 0, 6, 0, [], { wood: 8, fiber: 6 }, null,
    'Un techo de ramas. No es una casa, pero es un sitio donde no te llueve.', '#8a7a52', '#6a5a34'],
  ['house_straw', 'Casa de paja', 1, [3, 3], 1, 20, 0, ['sleep', 'chest'], { wood: 20, straw: 12, fiber: 10 }, { lv: 2, skill: { artisan: 1 } },
    'Cama y cofre. El primer hogar de verdad.', '#c8b070', '#b89a40'],
  ['house_wood', 'Casa de madera', 2, [3, 3], 2, 30, 1, ['sleep', 'chest', 'campfire'], { wood: 40, stone: 20, rope: 2 }, { lv: 4, skill: { artisan: 2 } },
    'Fogata dentro y dos camas. Aquí ya puedes casarte.', '#b89060', '#8a5a30'],
  ['house_stone', 'Casa de piedra', 3, [4, 3], 2, 40, 1, ['sleep', 'chest', 'kitchen', 'workbench'], { stone: 60, brick: 10, wood: 30 }, { lv: 7, skill: { artisan: 3 } },
    'Cocina y banco de trabajo propios. Paredes que aguantan un asedio.', '#b0aca0', '#6a6a70'],
  ['house_brick', 'Casa de ladrillo', 4, [4, 4], 3, 50, 2, ['sleep', 'chest', 'kitchen', 'workbench', 'loom'], { brick: 40, stone: 40, iron_bar: 6 }, { lv: 9, skill: { artisan: 4 } },
    'Telar y tres camas. La casa de un hombre establecido.', '#c08868', '#8a4a3a'],
  ['house_manor', 'Casona solariega', 5, [5, 4], 3, 60, 2, ['sleep', 'chest', 'kitchen', 'workbench', 'loom', 'tannery'], { brick: 60, stone: 60, steel_bar: 8, linen: 6 }, { lv: 11, skill: { artisan: 5 } },
    'Potro de curtir y espacio para una familia grande.', '#c8b898', '#7a5a4a'],
  ['house_mansion', 'Mansión', 6, [5, 5], 4, 80, 3, ['sleep', 'chest', 'kitchen', 'workbench', 'loom', 'tannery', 'mill'], { stone: 100, brick: 60, steel_bar: 12, gold_bar: 2 }, { lv: 13, skill: { artisan: 6 } },
    'Molino propio y hasta tres hijos. Ya eres alguien en Vhalor.', '#d8d0c0', '#7a4a6a'],
  ['house_keep', 'Torreón', 7, [5, 5], 4, 90, 3, ['sleep', 'chest', 'kitchen', 'workbench', 'forge', 'smelter'], { stone: 140, brick: 80, iron_bar: 20, steel_bar: 10 }, { lv: 15, skill: { artisan: 7 } },
    'Forja y horno de fundición bajo tu propio techo.', '#a8a8a0', '#5a5a62'],
  ['house_villa', 'Villa del valle', 8, [6, 5], 5, 100, 4, ['sleep', 'chest', 'kitchen', 'workbench', 'forge', 'smelter', 'anvil'], { stone: 160, brick: 100, steel_bar: 20, mithril_bar: 6 }, { lv: 17, skill: { artisan: 8 } },
    'Yunque propio. Ya no dependes de Dorn para nada.', '#e0d8c8', '#6a7a5a'],
  ['house_palace', 'Palacete', 9, [6, 6], 6, 120, 4, ['sleep', 'chest', 'kitchen', 'workbench', 'forge', 'smelter', 'anvil', 'fletching'], { stone: 200, brick: 140, mithril_bar: 14, gold_bar: 6, silk: 8 }, { lv: 19, skill: { artisan: 9 } },
    'Mesa de flechas y seis camas. Tu casa es una institución.', '#e8e0d0', '#7a5a8a'],
  ['house_citadel', 'Ciudadela privada', 10, [7, 6], 6, 150, 5, ['sleep', 'chest', 'kitchen', 'workbench', 'forge', 'smelter', 'anvil', 'fletching', 'alchemy'], { stone: 260, brick: 180, adamantite_bar: 8, mithril_bar: 20, golem_core: 2 }, { lv: 22, skill: { artisan: 10 } },
    'Alambique y muros de verdad. Un gólem vigila la puerta.', '#c8c8d0', '#4a5a7a'],
  ['house_estate', 'Hacienda de Vhalor', 11, [8, 7], 8, 200, 6, ['sleep', 'chest', 'kitchen', 'workbench', 'forge', 'smelter', 'anvil', 'fletching', 'alchemy', 'loom', 'tannery', 'mill'], { stone: 340, brick: 240, adamantite_bar: 16, gold_bar: 12, dragon_scale: 2, silk: 16 }, { lv: 26, skill: { artisan: 10 } },
    'Todas las estaciones, ocho camas y seis hijos. El sueño de un esclavo.', '#f0e8d8', '#8a6a3a']
];
HOUSES.forEach(function (h, i) {
  bld(h[0], {
    name: h[1], tier: h[2], size: h[3], beds: h[4], chest: h[5], childCap: h[6],
    functions: h[7], cost: h[8], req: h[9], desc: h[10], wall: h[11], roof: h[12], kind: 'house',
    upgradeFrom: i > 0 ? HOUSES[i - 1][0] : null, house: true
  });
});

/* ==========================================================
3 · ESTACIONES DE CRAFTEO (se colocan en tu parcela)
========================================================== */
const STATION_BLD = [
  ['campfire', 'Fogata', [1, 1], ['campfire'], { wood: 5, stone: 3 }, null,
    'Asa carne y pescado. Consume leña.', '#8a7a6a', '#e07030', 'fire'],
  ['kitchen', 'Cocina', [2, 2], ['kitchen'], { brick: 12, stone: 20, iron_bar: 3, wood: 10 }, { lv: 3, skill: { artisan: 1 } },
    'Guisos, panes y tartas que curan y dan vigor.', '#c0a880', '#8a5a3a', 'house'],
  ['workbench', 'Banco de trabajo', [2, 1], ['workbench'], { wood: 15, stone: 5, flint: 2 }, { lv: 2, skill: { artisan: 1 } },
    'Herramientas, mochilas, muebles y camas.', '#b09060', '#8a7040', 'bench'],
  ['mill', 'Molino de mano', [2, 2], ['mill'], { stone: 24, wood: 16, iron_bar: 2 }, { lv: 4, skill: { artisan: 2 } },
    'Muele grano en harina y prensa semillas en aceite.', '#c8b898', '#7a6a4a', 'bench'],
  ['tannery', 'Potro de curtir', [2, 2], ['tannery'], { wood: 20, rope: 3, salt: 4 }, { lv: 4, skill: { artisan: 2 } },
    'Convierte pieles en cuero y cuero endurecido.', '#a88860', '#6a5a3a', 'bench'],
  ['loom', 'Telar', [2, 2], ['loom'], { wood: 24, thread: 4, flint: 2 }, { lv: 4, skill: { artisan: 2 } },
    'Teje fibra, lana y lino en tela y vendas.', '#c8b0a0', '#7a5a6a', 'bench'],
  ['smelter', 'Horno de fundición', [2, 2], ['smelter'], { brick: 30, stone: 40, clay: 12, iron_bar: 4 }, { lv: 5, skill: { artisan: 2 } },
    'Mineral en lingotes. Devora combustible.', '#908880', '#c05030', 'forge'],
  ['forge', 'Forja', [2, 2], ['forge'], { stone: 30, brick: 16, iron_bar: 6, coal: 8 }, { lv: 7, skill: { artisan: 3 } },
    'Espadas, lanzas, mazas y herramientas de metal.', '#908880', '#c05030', 'forge'],
  ['fletching', 'Mesa de flechas', [2, 1], ['fletching'], { wood: 22, thread: 6, flint: 4, feather: 8 }, { lv: 8, skill: { marks: 2, artisan: 3 } },
    'Arcos, ballestas y las nueve clases de flecha.', '#b89060', '#6a7a4a', 'bench'],
  ['anvil', 'Yunque', [2, 2], ['anvil'], { iron_bar: 12, steel_bar: 4, stone: 30, brick: 12 }, { lv: 9, skill: { artisan: 4 } },
    'Armaduras completas, escudos y bardas.', '#8a8a92', '#5a5a62', 'forge'],
  ['alchemy', 'Alambique', [2, 2], ['alchemy'], { brick: 20, sand: 16, copper_bar: 6, crystal: 2 }, { lv: 10, skill: { artisan: 5 } },
    'Pociones, elixires, antídotos y dardos.', '#a8a0b8', '#5a4a7a', 'house']
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
bld('barn', { name: 'Granero', tier: 0, size: [5, 4], cap: 8, functions: ['livestock', 'chest'], chest: 40, accepts: ['sheep', 'pig', 'nanny', 'goat', 'cow', 'alpaca', 'chicken', 'duck'],
  cost: { wood: 60, stone: 30, brick: 12, rope: 4 }, req: { lv: 8, skill: { artisan: 3 } }, desc: 'Ocho animales y 40 espacios de almacén.',
  wall: '#b89060', roof: '#8a4a3a', kind: 'house' });
bld('stable', { name: 'Establo', tier: 0, size: [4, 3], cap: 3, functions: ['mounts'],
  cost: { wood: 35, stone: 15, hay: 10 }, req: { lv: 5 }, desc: 'Aloja 3 monturas. Recupera su aliento más rápido.',
  wall: '#a88860', roof: '#7a5a3a', kind: 'pen' });
bld('chest', { name: 'Cofre', tier: 0, size: [1, 1], chest: 20, functions: ['chest'],
  cost: { wood: 10, iron_bar: 1 }, req: null, desc: '20 espacios de almacén.', wall: '#a07840', roof: '#6a4a20', kind: 'chest' });
bld('chest_large', { name: 'Arcón herrado', tier: 0, size: [2, 1], chest: 48, functions: ['chest'],
  cost: { wood: 20, iron_bar: 4, hard_leather: 2 }, req: { lv: 6, skill: { artisan: 2 } }, desc: '48 espacios. Lo que un mercader llamaría respectable.',
  wall: '#8a6a3a', roof: '#5a4a2a', kind: 'chest' });
/* Camas colocables: se usan desde la mochila sobre tu parcela */
[['bed_straw', 'Cama de paja', 1, 0.85, { wood: 4, straw: 6, cloth: 2 }, { lv: 3, skill: { artisan: 1 } }, '#c8b070', '#a08840'],
 ['bed_wood', 'Cama de madera', 2, 1.0, { wood: 8, cloth: 4, rope: 2 }, { lv: 6, skill: { artisan: 2 } }, '#a88860', '#7a5a3a'],
 ['bed_feather', 'Cama de plumas', 3, 1.0, { wood: 8, feather: 12, linen: 4 }, { lv: 10, skill: { artisan: 4 } }, '#d8d0c0', '#8a7a9a'],
 ['bed_noble', 'Lecho noble', 4, 1.0, { wood: 10, silk: 6, pegasus_feather: 4, gold_bar: 2 }, { lv: 16, skill: { artisan: 7 } }, '#e8d8b0', '#7a4a6a']]
.forEach(function (b) {
  bld(b[0], { name: b[1], tier: 0, size: [2, 1], beds: 1, bedTier: b[2], heal: b[3], functions: ['sleep'],
    cost: b[4], req: b[5], desc: 'Duerme sin riesgo de emboscada. ' + (b[2] >= 3 ? 'Despiertas con vigor extra.' : ''),
    wall: b[6], roof: b[7], kind: 'bed' });
});
/* Defensas y guardianes */
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
5 · BANDEJA DEL PUESTO (siempre abierta, sin confianza)
========================================================== */
D.STALL = {
  name: 'Bandeja del puesto',
  note: 'Solo lo básico, siempre disponible. Para algo especializado, habla con el comerciante.',
  sells: ['wood', 'stone', 'fiber', 'hay', 'straw', 'berry', 'apple', 'flatbread', 'bait', 'feed_basic', 'torch', 'bandage_simple'],
  buys: ['wood', 'stone', 'coal', 'fiber', 'hay', 'straw', 'herb', 'hide', 'bone', 'feather', 'manure', 'flint', 'clay', 'sand', 'copper_ore', 'crab_shell'],
  buyMarkup: 1.8, sellMult: 0.6
};

/* ==========================================================
6 · NPC · generadores de diálogo
========================================================== */
const SVC = {
  shop: { t: 'Ver tu mercancía', when: { trustMin: -59 } },
  debt: { t: 'Pagar mi deuda', when: { slave: true, trustMin: -59 } },
  bank: { t: 'Gestionar mi cuenta', when: { free: true, trustMin: -59 } },
  bless: { t: 'Recibir bendición (25 oro)', when: { trustMin: -59 } },
  charity: { t: 'Donar a los pobres (10 oro)', when: { trustMin: -59 } },
  wedding: { t: 'Celebrar mi boda', when: { rel: 'engaged', trustMin: -59 } },
  quest: { t: 'Contratos de caza y recolección', when: { trustMin: -59 } },
  land: { t: 'Comprar tierras', when: { free: true, trustMin: -59 } },
  slaves: { t: 'Contratar trabajadores', when: { free: true, trustMin: -59 } },
  repair: { t: 'Reparar mi equipo', when: { trustMin: -59 } },
  help_task: { t: 'Ayudar en la granja', when: { trustMin: -59 } },
  stations: { t: 'Usar tus talleres', when: { trustMin: -59 } },
  bed_market: { t: 'Alquilar una cama (18 oro)', when: { trustMin: -59 } },
  family: { t: 'Ver a mi familia', when: { rel: 'married' } }
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
  (services || []).forEach(function (s) {
    const c = SVC[s];
    if (c) out.push({ t: c.t, act: s, when: c.when });
  });
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
/** Construye el árbol de diálogo completo a partir de la personalidad. */
function mkNpc(id, c) {
  const nodes = {
    root: {
      text: [{ when: { trustMax: -60 }, t: c.hate }].concat(c.lines),
      choices: svcChoices(c.services)
        .concat(c.extraChoices || [])
        .concat(c.romance ? romanceChoices() : [])
        .concat(stdChoices())
    },
    insult: insultNode(c.name)
  };
  if (c.romance) {
    const rn = romanceNodes(c.flirt, c.date);
    nodes.flirt = rn.flirt; nodes.date = rn.date;
  }
  if (c.nodes) for (const k in c.nodes) nodes[k] = c.nodes[k];
  npc(id, {
    name: c.name, role: c.role, gender: c.gender, romance: !!c.romance,
    loves: c.loves, smalltalk: c.talk, shop: c.shop || null, services: c.services || [],
    consequences: c.cons, post: c.post !== false, wanderer: !!c.wanderer, hunter: !!c.hunter,
    farmer: !!c.farmer, hours: c.hours || [7, 19],
    dlg: { start: 'root', nodes: nodes }
  });
}

/* --- Bareth · mercader de esclavos --- */
mkNpc('bareth', {
  name: 'Bareth', role: 'Mercader de esclavos', gender: 'm',
  loves: ['gold_nugget', 'mead', 'gold_bar'],
  talk: ['El trabajo duro forja el carácter… y mi bolsa.',
    'Los cazadores te trajeron medio muerto. Yo te di un techo.',
    'Paga tu deuda y serás libre. Palabra de mercader.',
    'También acepto objetos. Al ochenta por ciento de su valor, eso sí.'],
  shop: { sells: ['flatbread', 'berry', 'pick_stone', 'axe_stone', 'hoe_stone', 'cloth_chest', 'torch', 'bandage_simple', 'bed_roll'],
    buys: ['material', 'crop', 'food', 'unique'] },
  services: ['debt', 'shop'],
  cons: { hate: 'Añade recargos a tu deuda y avisa a los guardias.', love: 'Descuentos y perdona intereses.' },
  hate: 'Bareth escupe al suelo. «Ni se te ocurra acercarte, escoria.»',
  lines: [
    { when: { slave: true }, t: '«Mi propiedad favorita. Llevas collar, pico y hacha. El reino no te espera: te devora. Tráeme oro y quizá algún día te quite el collar.»' },
    { t: '«Hombre libre… quién lo diría. Pagaste hasta el último cobre. Respeto eso. ¿Negociamos?»' }
  ],
  extraChoices: [{ t: '¿Cuánto debo aún?', go: 'debtinfo', when: { slave: true } }],
  nodes: { debtinfo: { text: [{ t: '«Dos mil de oro al contado, ni una moneda menos. Cada pago lo anoto en mi libro. Los intereses… dependen de cómo me caigas.»' }], choices: [{ t: 'Volver', go: 'root' }] } }
});

/* --- Voss · intendente --- */
mkNpc('voss', {
  name: 'Voss', role: 'Intendente de Vhalor', gender: 'm',
  loves: ['steel_bar', 'cheese', 'linen'],
  talk: ['Las tierras del sur y del este están en venta. Cuarenta y cuatro parcelas, para ser exacto.',
    'Cada mes llegan trabajadores nuevos. Los títulos nobiliarios tienen… privilegios.',
    'Un hombre con tierras es un hombre con futuro.',
    'El Mercader Supremo lleva la Lonja ahora. Yo solo llevo el ganado y los contratos.'],
  shop: { sells: ['animal_chicken', 'animal_duck', 'animal_rabbit', 'animal_sheep', 'animal_pig', 'animal_nanny', 'animal_goat', 'animal_cow', 'animal_alpaca', 'animal_horse',
    'feed_basic', 'feed_good', 'feed_herb', 'hay', 'straw'], buys: ['material', 'animal', 'feed', 'product'] },
  services: ['slaves', 'shop', 'stations'],
  cons: { hate: 'Te niega trabajadores y ganado.', love: 'Descuento en contratos y taller gratis.' },
  hate: 'Voss cierra su libro de golpe. «Contigo no hago negocios.»',
  lines: [
    { when: { slave: true }, t: '«Los esclavos no contratan a nadie. Gana tu libertad y hablamos de trabajadores y ganado.»' },
    { t: '«Ah, el propietario. Tengo ganado, pienso y trabajadores para quien tenga título. Las tierras ya no las llevo yo: eso es cosa del Supremo.»' }
  ]
});

/* --- Dorn · herrero --- */
mkNpc('dorn', {
  name: 'Dorn', role: 'Herrero de Vhalor', gender: 'm',
  loves: ['coal', 'iron_bar', 'mithril_ore', 'charcoal'],
  talk: ['El acero no miente: hierro y carbón, fuego y paciencia.',
    'Fundir es cosa del horno, no de la forja. Trae carbón de sobra.',
    'Las tierras corruptas guardan adamantita. Pocos vuelven con ella.',
    'Si no tienes yunque, usa el mío. Cobro el treinta y cinco por ciento, y es un regalo.'],
  shop: { sells: ['coal', 'charcoal', 'pick_copper', 'axe_copper', 'pick_iron', 'axe_iron', 'hoe_iron', 'sword_copper', 'sword_iron', 'sword_steel',
    'spear_iron', 'spear_steel', 'mace_iron', 'mace_steel', 'dagger_iron', 'shield_round_wood', 'shield_round', 'shield_kite',
    'iron_head', 'iron_chest', 'iron_legs', 'steel_head', 'steel_chest', 'steel_legs', 'petarmor_leather', 'petarmor_iron', 'saddle_horse', 'repair_kit', 'whetstone'],
    buys: ['material', 'tool', 'weapon', 'armor', 'shield'] },
  services: ['shop', 'repair', 'stations'],
  cons: { hate: 'No repara, no vende y no presta el yunque.', love: 'Reparaciones a mitad de precio.' },
  hate: 'Dorn golpea el yunque sin mirarte. «Fuera de mi forja.»',
  lines: [{ t: '«El yunque no pregunta si llevas collar. Trae hierro, trae carbón, y saldrás de aquí mejor armado que un guardia. Y si prefieres que lo haga yo, también.»' }]
});

/* --- Lía · mercadera (romance) --- */
mkNpc('lia', {
  name: 'Lía', role: 'Mercadera del mercado', gender: 'f', romance: true,
  loves: ['pie', 'fruit_pie', 'ring_gold', 'crop_pumpkin'],
  talk: ['Vendo de todo: semillas, pan, mochilas… y consejos gratis.',
    'Mi puesto es el mejor surtido de Vhalor, modestia aparte.',
    'Dicen que el Fénix deja plumas que valen una fortuna.',
    'Las veinticuatro semillas que cultivo caben en esta bandeja. Elige bien según la estación.'],
  shop: { sells: ['seed_wheat', 'seed_carrot', 'seed_potato', 'seed_tomato', 'seed_pumpkin', 'seed_onion', 'seed_lettuce', 'seed_garlic',
    'seed_corn', 'seed_cabbage', 'seed_pepper', 'seed_sweetpotato', 'seed_rice', 'seed_quinoa', 'seed_maca', 'seed_sunflower',
    'seed_strawberry', 'seed_grape', 'seed_melon', 'seed_cotton', 'seed_flax', 'seed_herb', 'seed_bean', 'seed_beet',
    'berry', 'apple', 'bread', 'cheese', 'butter', 'feed_basic', 'feed_good', 'fert_manure', 'fert_compost', 'fert_bonemeal',
    'cloth', 'fiber', 'thread', 'bag_small', 'bag_medium', 'bait', 'waterskin', 'watering_can', 'honey', 'milk', 'egg',
    'bandage_simple', 'bandage_clean', 'salt', 'oil', 'flour'],
    buys: ['crop', 'food', 'product', 'material', 'seed', 'fert', 'feed', 'bag', 'heal'], buyMult: { crop: 1.15, product: 1.15, food: 1.1 } },
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
    'Las escrituras de tierras las emite el Supremo, pero el oro lo guardo yo.'],
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
    'En mi botica hay vendas limpias y antídotos. El veneno de hidra no perdona.',
    'Incluso un esclavo tiene alma libre. Nunca lo olvides.'],
  shop: { sells: ['holy_water', 'ring_gold', 'bandage_clean', 'bandage_herb', 'antidote', 'salve_burn', 'splint',
    'potion_heal_s', 'potion_heal_m', 'potion_stamina_s', 'herb_blue', 'herb_fire'], buys: ['material', 'potion', 'heal', 'herbany'] },
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
    'Los bandidos del sur aprietan. El reino paga por cabezas.',
    'Un escudo bien puesto vale más que una espada bien afilada. Aprende a hacer parry.'],
  shop: { sells: ['iron_chest', 'steel_head', 'shield_round', 'shield_kite', 'shield_tower', 'shield_spiked',
    'arrow_basic', 'arrow_iron', 'arrow_barbed', 'bow_wood', 'bow_hunter', 'quiver', 'potion_heal_s', 'bandage_clean'],
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
    'Si quieres pescado ahumado, uso mi cocina por un veinte por ciento.'],
  shop: { sells: ['rod_wood', 'rod_iron', 'rod_mithril', 'bait', 'fishing_net', 'cooked_fish', 'grilled_fish', 'smoked_fish', 'flatbread', 'salt'],
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

/* --- Granjeros: los 8 con parcela propia y tareas de ayuda --- */
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
    ['Muelo el grano de media Vhalor. Trae trigo y te lo cambio por harina.', 'El molino no para nunca. Yo tampoco, casi.', 'Sin harina no hay pan. Sin pan no hay ejército.'],
    'Tomás apaga el molino. «No muelo para ladrones.»',
    '«¿Traes grano? Entonces habla. Si no, aparta que tengo trabajo.»'],
  ['mira', 'Mira', 'Granjera del arrozal', 'f', true, ['rice_bowl', 'fish_trout', 'herb_tea'],
    ['El arroz quiere agua y paciencia. Como todo lo bueno.', 'El arrozal se inunda solo si llueve. Si no, hay que regarlo a mano.', 'Cocino el mejor cuenco de arroz del valle.'],
    'Mira levanta el rastrillo. «Largo de mi arrozal.»',
    '«El agua está alta hoy. Buen día para plantar… o para ayudar.»',
    'Mira se aparta el pelo mojado y sonríe. «No debería alegrarme tanto verte.»',
    'Cenáis arroz junto al arrozal, con los pies en el agua. Mira no habla, y no hace falta.'],
  ['gunnar', 'Gunnar', 'Granjero de la tundra', 'm', false, ['crop_maca', 'maca_porridge', 'reindeer'],
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
    ['El lino da tela y aceite. Nada se pierde.', 'Sin telar no hay vendas. Sin vendas no hay heridas cerradas.', 'Mi lino viste a media ciudad.'],
    'Bram escupe. «Mis linos no son tu almacén.»',
    '«Lino, aceite y tela. Eso sale de aquí. ¿Vienes a echar una mano?»']
];
FARMERS.forEach(function (f) {
  const isRom = f[4];
  mkNpc(f[0], {
    name: f[1], role: f[2], gender: f[3], romance: isRom, farmer: true, post: false, hours: [6, 20],
    loves: f[5], talk: f[6],
    shop: { sells: ['seed_wheat', 'seed_potato', 'seed_carrot', 'crop_potato', 'crop_carrot', 'fert_manure', 'manure', 'hay', 'straw'],
      buys: ['crop', 'seed', 'fert', 'feed', 'product'], buyMult: { crop: 1.15 } },
    services: ['help_task', 'shop'],
    cons: { hate: 'Te denuncia si te ve cerca de su parcela.', love: 'Regala semillas raras y paga mejor la ayuda.' },
    hate: f[7], lines: [{ t: f[8] }],
    flirt: isRom ? f[9] : null, date: isRom ? f[10] : null
  });
});

/* --- Mercader Supremo · tierras --- */
mkNpc('supremo', {
  name: 'Mercader Supremo', role: 'Señor de la Lonja de Tierras', gender: 'm',
  loves: ['gold_bar', 'dragon_scale', 'land_deed', 'wine'],
  talk: ['Cuarenta y cuatro parcelas, desde seis por seis hasta veinte por dieciséis. Elige tu ambición.',
    'Cada parcela que compras encarece la siguiente un siete por ciento. La tierra se aprecia.',
    'Sin escritura no hay venta. La emito yo, y cuesta ciento veinte de oro.',
    'Los títulos llegan con la tierra: Colono, Terrateniente, Señor, Noble… y Gran Señor de Vhalor.',
    'Un esclavo no puede firmar. Rompe tu collar y vuelve.'],
  shop: { sells: ['land_deed', 'lockpick', 'gold_bar', 'ring_gold', 'bag_large', 'bag_explorer', 'bed_wood', 'chest_large'],
    buys: ['material', 'unique', 'legendary', 'acc'], buyMult: { unique: 1.3, legendary: 1.2 } },
  services: ['land', 'shop', 'stations'],
  cons: { hate: 'No te vende tierras ni escrituras.', love: 'Escrituras más baratas y primera opción en parcelas grandes.' },
  hate: 'El Supremo no levanta la vista. «La Lonja no atiende a quien no respeta sus normas.»',
  lines: [
    { when: { slave: true }, t: '«Un esclavo no firma escrituras. Paga a Bareth, vuelve con el cuello desnudo y hablaremos de tierras.»' },
    { t: '«Bienvenido a la Lonja. Aquí la tierra se mide, se tasa y se firma. Trae una escritura y el oro, y el valle será tuyo.»' }
  ],
  extraChoices: [{ t: '¿Cómo funcionan los títulos?', go: 'titles' }],
  nodes: { titles: { text: [{ t: '«Una parcela te hace Colono. Con tres eres Terrateniente. Cinco, Señor de Tierras. Ocho, Noble Menor. Doce, Noble Mayor. Y con dieciocho… Gran Señor de Vhalor, con derecho a cinco trabajadores y descuento de la guardia.»' }], choices: [{ t: 'Volver', go: 'root' }] } }
});

/* --- Posadera · cama de alquiler --- */
mkNpc('gunda', {
  name: 'Gunda', role: 'Posadera del Camino', gender: 'f',
  loves: ['stew', 'ale', 'cheese'],
  talk: ['Dieciocho de oro por una cama bajo techo. Sin bandidos, sin lluvia.',
    'No es tu casa: duermes peor y despiertas con menos vida. Pero despiertas.',
    'Si quieres descansar de verdad, cómprate un petate o construye una cama.',
    'A los esclavos les alquilo igual. El oro no lleva collar.'],
  shop: { sells: ['bread', 'cheese', 'ale', 'mead', 'stew', 'porridge', 'boiled_egg', 'herb_tea', 'bed_roll'],
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
    'Vendo pieles y flechas. compro colmillos.',
    'Cuidado con el Risco: la mantícora dispara púas antes de saltar.'],
  shop: { sells: ['bow_wood', 'bow_hunter', 'arrow_basic', 'arrow_iron', 'arrow_barbed', 'arrow_tame', 'quiver',
    'dried_meat', 'traveler_ration', 'hide', 'leather', 'dart_narcotic', 'gloves_grip'],
    buys: ['hide', 'leather', 'bone', 'feather', 'material', 'unique', 'ammo'], buyMult: { hide: 1.3, leather: 1.2 } },
  services: ['shop', 'stations'],
  cons: { hate: 'No comercia y te dispara si te acercas.', love: 'Flechas raras a mitad de precio.' },
  hate: 'Rurik tensa el arco sin apuntarte del todo. «Sigue caminando.»',
  lines: [{ t: '«Cazador. Vivo de lo que cae y vendo lo que sobra. ¿Traes pieles o vienes a comprar?»' }]
});
mkNpc('skadi', {
  name: 'Skadi', role: 'Cazadora de la tundra', gender: 'f', romance: true, wanderer: true, hunter: true, post: false,
  loves: ['fish_ice', 'arrow_ice', 'polar_bear', 'frost_core'],
  talk: ['El oso polar te oye antes de verte. Ve por detrás.',
    'Las flechas gélidas ralentizan. Contra un wyvern, eso es la vida.',
    'Tamear un huargo necesita dardos y carne. Y paciencia.',
    'En el Trono de Escarcha duerme un jotun. No lo despiertes sin escudo.'],
  shop: { sells: ['bow_composite', 'arrow_ice', 'arrow_poison', 'arrow_tame', 'rod_iron', 'fishing_net',
    'hard_leather', 'petarmor_iron', 'boots_swift', 'potion_ice_res', 'bandage_clean'],
    buys: ['hide', 'leather', 'fish', 'bone', 'unique', 'ammo'], buyMult: { fish: 1.2, unique: 1.2 } },
  services: ['shop', 'stations'],
  cons: { hate: 'Te marca como presa.', love: 'Comparte rutas de caza y descuentos.' },
  hate: 'Skadi no baja el arco. «Un paso más y cazamos otra cosa.»',
  lines: [
    { when: { rel: 'dating' }, t: 'Skadi baja el arco al verte. «Vaya. Mi mejor presa resultó ser voluntary.»' },
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
  shop: { sells: ['thread', 'cloth', 'rope', 'salt', 'oil', 'needle', 'bait', 'torch', 'bandage_simple', 'bag_small', 'feed_good', 'fert_compost', 'waterskin'],
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
  shop: { sells: ['lockpick', 'crystal', 'venom_sac', 'dart_poison', 'arrow_poison', 'cloak_shadow', 'obsidian', 'sulfur'],
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
  shop: { sells: ['herb', 'herb_blue', 'herb_fire', 'bandage_simple', 'bandage_clean', 'bandage_herb', 'antidote', 'salve_burn',
    'splint', 'potion_heal_s', 'potion_stamina_s', 'potion_fire_res', 'honey', 'herb_tea'],
    buys: ['herbany', 'honey', 'heal', 'potion', 'crop'], buyMult: { herbany: 1.4 } },
  services: ['shop', 'stations'],
  cons: { hate: 'No te cura ni vende.', love: 'Vendas y ungüentos a mitad de precio.' },
  hate: 'El herbolario cierra su morral. «Mis hierbas no son para ti.»',
  lines: [{ t: '«Hierbas, vendas y remedios. Camino donde hay heridas. ¿Traes hierbas o traes heridas?»' }]
});

/* ==========================================================
7 · CONTRATOS (caza, recolección y ayuda)
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
gather('q_coal', 'Carbón para la forja', 'coal', 20, 180, 5);
gather('q_iron', 'Hierro para las lanzas', 'iron_bar', 8, 320, 7, { free: true });
gather('q_steel', 'Acero para la guardia', 'steel_bar', 6, 520, 9, { free: true, trustMin: 15 });
gather('q_fish', 'Pescado para el cuartel', 'fish_trout', 10, 190, 5);
gather('q_grain', 'Grano para el invierno', 'crop_wheat', 16, 210, 6);
gather('q_bandage', 'Vendas para los heridos', 'bandage_clean', 8, 340, 8, { free: true });
gather('q_arrows', 'Flechas para la torre', 'arrow_iron', 30, 380, 8, { free: true, trustMin: 10 });

/* ==========================================================
8 · NOMBRES, CONSEJOS Y AYUDA
========================================================== */
D.NAMES.male = ['Aldric', 'Bran', 'Cedric', 'Darian', 'Edric', 'Faelan', 'Gareth', 'Hadrian', 'Ivor', 'Jorah',
  'Kael', 'Leoric', 'Merek', 'Noran', 'Osric', 'Percival', 'Quillan', 'Rowan', 'Stefan', 'Tristan',
  'Ulric', 'Viggo', 'Wulfric', 'Yorick', 'Aksel', 'Bjorn', 'Corvin', 'Dag', 'Emrys', 'Halvar'];
D.NAMES.female = ['Aria', 'Brenna', 'Celia', 'Daria', 'Elara', 'Fiora', 'Gwen', 'Helena', 'Isolde', 'Jessa',
  'Kira', 'Liora', 'Maren', 'Neria', 'Orla', 'Petra', 'Quenna', 'Rosalind', 'Sable', 'Talia',
  'Una', 'Vesna', 'Wren', 'Ysolde', 'Astrid', 'Brynhild', 'Dagny', 'Eir', 'Freydis', 'Sigrid'];

[
  'Tala y pica: vende madera y piedra a Bareth o Lía para pagar tu deuda de 2.000 oro.',
  'El nivel global sube con todo lo que haces. Cada nivel da un punto de habilidad; cada cinco, uno extra.',
  'A mano solo atas cuerda, enciendes antorcha, vendas simples y sacas semillas. Lo demás pide estación.',
  'Fundir mineral requiere horno de fundición y mucho combustible: carbón rinde 4, carbón vegetal 6.',
  'Mantén el botón de ataque para tensar el arco. Soltar antes de tiempo dispara flojo.',
  'El escudo bloquea manteniendo el botón. Los primeros 0,22 s son parry: devuelves el golpe y aturdes.',
  'Puedes bloquear y esquivar en mitad de un ataque. El combate ya no se queda bloqueado.',
  'Tab cambia de objetivo. El apuntado se queda pegado al enemigo y no lo suelta al acercarte.',
  'Los carnívoros cazan herbívoros. Aprovéchalo: un lobo ocupado con un ciervo no te ve.',
  'Cada criatura mítica nace solo en su santuario. El grifo, en el Nido del Grifo, y no sale de allí.',
  'Las bestias atacan en ráfagas y luego descansan. Ese descanso es tu ventana.',
  'La comida da saciedad, salud y energía según tamaño, preparación y rareza. Un banquete cura 70.',
  'Cocinar consume leña. Sin combustible no hay guiso, por muchos ingredientes que tengas.',
  'Las tareas de ayuda en granjas vecinas piden regar o cosechar un número concreto. Pagan oro y confianza.',
  'El petate te deja dormir donde sea, pero hay un 34 % de emboscada. La posada cuesta 18 oro y es segura.',
  'El Mercader Supremo vende las 44 parcelas. Necesitas una escritura de 120 oro por cada compra.',
  'Las vendas cortan el sangrado. El ungüento apaga el fuego. El antídoto limpia el veneno.',
  'Afinidad 3 desbloquea monturas terrestres; 7, voladoras; 9, compañeros míticos.',
  'Los cazadores y mercaderes errantes se mueven por los caminos. Búscalos: llevan lo que nadie tiene.',
  'El gólem y la gárgola protegen tus construcciones. Cuestan núcleos, pero no duermen.',
  'Robar tiene testigos. Si te ven, la confianza cae y la guardia te busca.',
  'Edita los controles en Ajustes: posición, tamaño y opacidad. El juego se juega en horizontal.'
].forEach(DEF.tip);

/* --- Ayuda: cada sistema nuevo, explicado con números reales --- */
const H = DEF.help;
H('Controles', 'Joystick izquierdo o WASD para moverte; el stick es analógico, así que puedes andar despacio o correr según cuánto lo inclines. Espacio o el botón grande ataca y usa la herramienta. E interactúa. Q esquiva. F monta o despega. L o el botón derecho bloquea con el escudo. Tab cambia de objetivo. X cambia el tipo de flecha. Shift corre. Los números 1 a 5 usan la barra rápida. I inventario, C crafteo, B construir, M mapa, R relaciones, H habilidades, Esc pausa.', 'compass');
H('Jugar en horizontal', 'Vhalor se juega en horizontal. Si giras el teléfono a vertical, el juego se pausa y te pide volver a girar. En Ajustes puedes entrar en pantalla completa e intentar el bloqueo de orientación. También puedes mover y redimensionar cada grupo de controles (joystick, acciones, barra rápida, menú, placa y mapa) y cambiar su opacidad o intercambiarlos de lado para jugar con la mano izquierda.', 'settings');
H('La deuda y la libertad', 'Empiezas esclavo con 2.000 de oro de deuda y un collar. Vende recursos a Bareth, Lía o los puestos, o entrega objetos directamente por el 80 % de su valor. Al llegar a cero eres libre: puedes comprar tierras, abrir cuenta en el banco, contratar trabajadores y casarte.', 'debt');
H('Supervivencia', 'Tienes salud, stamina y saciedad. La saciedad baja un punto cada 7 segundos; a cero pierdes 1,8 de vida por segundo. Con menos de 18 de saciedad la stamina no regenera y te mueves más despacio. Con más de 55 regeneras vida poco a poco. Caer no mata: despiertas con penalización de oro o materiales.', 'heart');
H('Comer bien', 'Cada alimento aporta saciedad, salud y energía según su tamaño (de bocado a banquete), su preparación (crudo, simple, asado, refinado, maestro) y su rareza. Las bayas apenas sacian; un guiso del cazador cura 34 y da 30 de energía; el banquete de Vhalor cura 70, da 60 de energía y un beneficio de 7 minutos. La carne cruda resta vida: cocínala.', 'food');
H('Combate cuerpo a cuerpo', 'El ataque tiene tres fases: preparación, golpe y recuperación. Puedes encadenar cuatro golpes con multiplicadores 1, 1,14, 1,34 y 1,62 si atacas dentro de 0,85 s. Desde la ventana de cancelación (0,13 s) puedes bloquear o esquivar sin esperar a terminar. Mantener el ataque con Fuerza 2 carga un golpe pesado de 2,1×. Las mazas y martillos rompen guardias.', 'sword');
H('Escudo, bloqueo y parry', 'Equipar un escudo añade el botón de bloqueo. Mantenerlo reduce el daño según el escudo: broquel 48 %, redondo 62 %, cometa 72 %, pavés 86 %. Bloquear consume stamina por golpe. Los primeros 0,22 s son parry: solo recibes el 10 % del daño, recuperas 8 de stamina y el atacante queda aturdido 1,15 s, listo para tu contraataque. Con Guardia 5 el embate de escudo aturde; con Guardia 8 devuelves proyectiles.', 'shield');
H('Arcos, ballestas y flechas', 'Mantén el ataque para tensar: a los 0,22 s sueltas un tiro flojo (45 % de daño) y a los 0,85 s uno pleno (135 %). Las ballestas tardan más pero pegan mucho más fuerte y usan virotes. Hay nueve municiones: básica, pesada, ígnea (quema), gélida (ralentiza), veneno, dentada (sangra), somnífera (no mata: adormece para tamear), virote y mithril (atraviesa dos enemigos). X cicla la munición disponible.', 'bow');
H('Apuntado', 'El apuntado es pegajoso: fija un objetivo y lo mantiene mientras siga en el cono y el alcance, aunque te pegues a él. De cerca el cono se abre hasta 1,25 radianes, así que nunca pegas al aire por estar demasiado cerca. Si hay varios enemigos, solo cambia de objetivo cuando otro es claramente mejor (margen 0,34) o cuando pulsas Tab. En Ajustes puedes subir o bajar la asistencia de apuntado.', 'target');
H('Esquiva', 'Q rueda 0,34 s con 0,28 s de invulnerabilidad y 8,4 de velocidad. Cuesta 13 de stamina y se reutiliza cada 0,85 s. Con Agilidad 3 giras en el sitio sin perder impulso y con Agilidad 6 la esquiva habilita un contraataque.', 'roll');
H('Nivel y habilidades', 'Todo suma experiencia: talar, picar, pescar, cultivar, cocinar, fabricar, tamear, ayudar y matar. El nivel global llega hasta 40 y da un punto de habilidad por nivel, más uno extra cada cinco. Las ocho ramas son Fuerza, Vigor, Aguante, Agilidad, Puntería, Guardia, Afinidad y Oficio. Cada rama tiene diez puntos y desbloqueos concretos en niveles 2, 3, 4, 5, 6, 7, 8, 9 y 10. Abre el panel con H.', 'xp');
H('Estaciones de crafteo', 'A mano solo puedes atar cuerda, encender antorchas, hacer vendas simples, cebo, pienso básico, estiércol y sacar semillas. Todo lo demás exige una estación colocada en tu parcela o prestada por un mercader: fogata, cocina, molino, potro, telar, horno de fundición, forja, yunque, mesa de flechas, banco de trabajo y alambique. Cada estación se desbloquea con nivel y puntos de Oficio.', 'craft');
H('Combustible', 'Cocinar, fundir, forjar y destilar consumen combustible de tu mochila: la madera rinde 1, el carbón 4 y el carbón vegetal 6. Fundir pide 3 unidades base más el coste de la receta; un lingote de adamantita necesita mucho carbón. Oficio reduce el gasto un 4,5 % por punto. Sin combustible la receta aparece bloqueada aunque tengas los materiales.', 'fire');
H('Fundición y metales', 'El mineral no se convierte en lingote a mano: necesitas el horno de fundición (nivel 5, Oficio 2). Cobre, hierro, mithril y adamantita salen de sus vetas; el acero se hace con hierro y carbón; la obsidiana pulida, con obsidiana y carbón. Dorn presta su horno, forja y yunque por un 35 % de recargo si aún no tienes los tuyos.', 'material');
H('Granja', 'Compra una parcela al Mercader Supremo, ara con azada, siembra, riega y fertiliza. Hay 24 cultivos con ciclos de 2 a 4 días. Regar multiplica el crecimiento por 1,35; el fertilizante dorado por 1,7 y produce cosechas de tres estrellas que se venden hasta el triple. La hoz cosecha en área 2×2. El espantapájaros mantiene a los herbívoros salvajes fuera de tus sembrados.', 'role_farm');
H('Ayudar en granjas vecinas', 'Ocho granjeros tienen parcela propia: Marta, Odo, Helga, Tomás, Mira, Gunnar, Yara y Bram. Habla con ellos y pide trabajo: te asignarán una tarea concreta (regar de 6 a 10 plantas, cosechar de 4 a 7, sembrar de 5 a 9 o alimentar de 2 a 4 animales) con dos días de plazo. Al completarla vuelves y cobras oro, confianza y experiencia. Cada granjero da una tarea al día.', 'quest');
H('Ganado', 'Compra animales en la Intendencia y colócalos desde la mochila: gallinero para gallinas, patos y conejos; corral y granero para ovejas, cabras, cerdos, vacas y alpacas; establo para monturas. Aliméntalos con pienso para que produzcan: huevo, leche, lana, trufa y estiércol. La calidad del pienso decide la calidad del producto.', 'role_tend');
H('Tameo', 'Tres métodos. Por comida: acerca el alimento adecuado a una cría o a un animal dócil y repite hasta completar la barra. Por sedación: baja su vida del 55 %, dispara un dardo narcótico o una flecha somnífera y aliméntalo mientras duerme 34 s. Por vínculo: unicornio, kirin y pegaso exigen acercarte despacio, sin atacar, y ganar su calma. El número de comidas sube con el nivel del animal y baja con tu Afinidad.', 'tame');
H('Monturas', 'Una montura necesita ser adulta, estar tameada y llevar su silla. Afinidad 3 desbloquea las terrestres (caballo, camello, reno, llama), 5 las grandes (bisonte, oso, huargo), 7 las voladoras (grifo, cóndor) y 9 las míticas (unicornio, kirin, pegaso). F monta y desmonta; con una montura voladora, Q despega y aterriza. Volar consume aliento y está prohibido dentro de las murallas.', 'mount');
H('Ecología salvaje', 'Cada especie tiene dieta y facción. Los carnívoros y omnívoros cazan herbívoros e insectívoros; las presas huyen de sus depredadores. El director de aparición separa los grupos al menos 8 tiles y mantiene 18 tiles entre depredadores y presas, así que nunca verás un montón de animales mezclados. Las manadas de herbívoros van juntas; los depredadores, en parejas.', 'tame');
H('Santuarios míticos', 'Diez zonas únicas reparten la fauna mítica: Nido del Grifo, Ciénaga de la Hidra, Caldera del Fénix, Fortaleza del Rey Troll, Claro del Unicornio, Risco del Wyvern, Túmulo del Sabueso, Trono de Escarcha, Falla del Dragón y Lago Espejo. Cada criatura mítica nace solo en su santuario y no lo abandona: si huyes de su territorio, deja de perseguirte. Activa el resaltado de zonas en Ajustes para verlas en el mapa.', 'compass');
H('Jefes y patrones', 'Las bestias atacan en ráfagas de uno a tres golpes y después descansan entre 1,1 y 2,6 segundos: ese descanso es tu ventana. Solo los espíritus de ascua y los fuegos fatuos acosan sin pausa, y pegan flojo. Los seis jefes cambian de patrón por fases según su vida: el Rey Troll invoca trolls, la Hidra se regenera, el Fénix renace una vez, Fenrir llama sabuesos, el Jotun congela el suelo y el Dragón abre cuatro fases con meteoros.', 'boss');
H('Dormir y camas', 'Tres opciones. El petate enrollado (receta inicial de banco) te deja dormir donde estés, pero a la intemperie hay un 34 % de emboscada y solo recuperas el 72 %. La posada de Gunda cuesta 18 oro, es segura, restaura el 82 % y te deja un 10 % menos de vida máxima hasta el día siguiente. En tu propia casa, una cama colocada restaura todo sin riesgo; las de plumas y el lecho noble despiertan con stamina y vida extra.', 'bed');
H('Curas y estados', 'El sangrado hace 2,4 de daño por segundo durante 7 s y se corta con cualquier venda. El veneno dura 7 s y se limpia con antídoto, agua bendita o infusión. El fuego dura 4,5 s y se apaga con ungüento para quemaduras. La ralentización se quita con férula o bálsamo de escarcha. Las pociones van de 40 a 180 de vida; los elixires regeneran durante un minuto. Aplicar una venda lleva entre 0,9 y 1,6 s: no lo hagas delante de un jefe.', 'potion');
H('Tierras y Mercader Supremo', 'El mundo tiene 44 parcelas de seis tamaños, desde 6×6 hasta 20×16. Las vende el Mercader Supremo en la Lonja de Tierras: necesitas una escritura (120 oro, o fabricada con lino y oro) y el precio de la parcela, que sube un 7 % por cada una que ya posees. Los títulos llegan con la cantidad: Colono, Terrateniente, Señor de Tierras, Noble Menor, Noble Mayor y Gran Señor de Vhalor, que permite cinco trabajadores.', 'parcel');
H('NPC por el mundo', 'Además de los diez vecinos de Vhalor y los ocho granjeros, hay gente en los caminos. Rurik y Skadi son cazadores errantes: cazan animales de verdad y venden pieles y flechas. El buhonero, el contrabandista y el herbolario son mercaderes ambulantes con mercancía que no llega al mercado. Los bandidos montan campamentos y atacan a quien pasa. Todos se mueven: búscalos.', 'social');
H('Guardianes y defensa', 'El pilón de gólem (nivel 14, Oficio 6) invoca un gólem de piedra que protege tus construcciones y ataca a los hostiles. La repisa de gárgola (nivel 12) pone una gárgola que monta guardia de noche. La torre de vigilancia contrata un guardia. Vallas, empalizadas y muros de piedra bloquean el paso; la puerta de madera deja pasar a los tuyos. En el Claro y el Túmulo, los guardianes protegen su santuario y te atacarán a ti.', 'shield');
H('Economía y banco', 'Cada comerciante compra mejor lo suyo: Finn paga el pescado un 25 % más, los granjeros la cosecha un 15 %, Rurik las pieles un 30 %. El banco de Silas da un 0,5 % diario hasta 14 monedas y el oro depositado nunca se pierde al caer. La confianza alta da descuentos al comprar y bonus al vender; el odio congela cuentas y cierra puertas.', 'bank');
H('Familia', 'Sube la confianza de un NPC del género opuesto a 80, coquetea, ten citas y propón matrimonio con dos anillos de oro. Necesitas una casa con al menos dos camas. Maera celebra la boda por 50 oro. Los hijos nacen a los cinco días, crecen en tres etapas y de adolescentes pueden trabajar en la granja, cuidar el ganado o seguirte combatiendo.', 'family');
H('Robo y consecuencias', 'Cosechar en parcela ajena es robar. Si un NPC o guardia te ve a menos de 9 tiles y con línea de visión, pierdes 30 de confianza y sube tu busca. Sin testigos, solo 8. Con 40 de busca la guardia te persigue; con odio extremo, Silas congela tu cuenta, Bareth añade recargos y Roderic te multa.', 'warning');
H('Rendimiento', 'El mundo es de 512×512 tiles y se dibuja por chunks de 16×16 con caché LRU y precarga de un chunk por fotograma, así que explorar no da tirones. La calidad de partículas y la resolución interna se ajustan solas según los FPS. F3 muestra el panel de rendimiento. Todo el arte es procedural: no se descarga ninguna imagen.', 'settings');

/* ==========================================================
9 · TABLAS AUXILIARES PARA world.js / systems.js
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

/* ==========================================================
10 · VALIDACIÓN FORENSE Y SELLADO
========================================================== */
/* Comprobaciones adicionales propias de esta parte */
Object.keys(D.CITY_STRUCTS).forEach(function (k) {
  const c = D.CITY_STRUCTS[k];
  if (!c.name || !c.kind) D.errors.push('Estructura de ciudad incompleta: ' + k);
});
Object.keys(D.BUILDINGS).forEach(function (k) {
  const b = D.BUILDINGS[k];
  if (!b.size || b.size.length !== 2) D.errors.push('Edificio sin tamaño: ' + k);
  (b.functions || []).forEach(function (f) {
    if (D.STATIONS.indexOf(f) >= 0) return;
    if (['sleep', 'chest', 'livestock', 'mounts', 'gate', 'guard_post', 'guardian', 'water_source', 'light', 'scare'].indexOf(f) < 0)
      D.errors.push('Función desconocida en ' + k + ': ' + f);
  });
  if (b.upgradeFrom && !D.BUILDINGS[b.upgradeFrom]) D.errors.push('Mejora sin origen: ' + k);
  if (b.guardian && !D.SPECIES[b.guardian]) D.errors.push('Guardián inexistente en ' + k);
  (b.accepts || []).forEach(function (s) { if (!D.SPECIES[s]) D.errors.push('Ganado inválido en ' + k + ': ' + s); });
});
Object.keys(D.STATION_INFO).forEach(function (s) {
  const info = D.STATION_INFO[s];
  if (info.building && !D.BUILDINGS[info.building]) D.errors.push('Estación sin edificio: ' + s);
  if (info.building && D.BUILDINGS[info.building].functions.indexOf(s) < 0) D.errors.push('Edificio no ofrece su estación: ' + s);
});
Object.keys(D.MERCHANT_STATIONS).forEach(function (n) {
  if (!D.NPCS[n] && D.HUNTERS.indexOf(n) < 0) D.errors.push('Mercader con taller inexistente: ' + n);
  D.MERCHANT_STATIONS[n].stations.forEach(function (s) {
    if (D.STATIONS.indexOf(s) < 0) D.errors.push('Taller inválido en ' + n + ': ' + s);
  });
});
Object.keys(D.NPCS).forEach(function (k) {
  const n = D.NPCS[k];
  if (!n.dlg || !n.dlg.nodes.root) D.errors.push('NPC sin diálogo raíz: ' + k);
  (n.services || []).forEach(function (s) { if (!SVC[s]) D.errors.push('Servicio desconocido en ' + k + ': ' + s); });
  /* Todo destino de diálogo debe existir */
  Object.keys(n.dlg.nodes).forEach(function (nk) {
    (n.dlg.nodes[nk].choices || []).forEach(function (c) {
      if (c.go && !n.dlg.nodes[c.go]) D.errors.push('Destino de diálogo roto: ' + k + '.' + nk + ' → ' + c.go);
      if (c.act && c.act !== 'end' && c.act !== 'smalltalk' && c.act !== 'gift' && c.act !== 'propose' && !SVC[c.act])
        D.errors.push('Acción de diálogo desconocida: ' + k + ' → ' + c.act);
    });
  });
});
D.QUESTS.forEach(function (q) {
  if (q.kind === 'gather' && !D.ITEMS[q.item]) D.errors.push('Contrato de recolección sin objeto: ' + q.id);
});
D.STALL.sells.forEach(function (i) { if (!D.ITEMS[i]) D.errors.push('Bandeja vende objeto inexistente: ' + i); });
D.STALL.buys.forEach(function (i) { if (!D.ITEMS[i]) D.errors.push('Bandeja compra objeto inexistente: ' + i); });
D.FARM_OWNERS.forEach(function (f) { if (!D.NPCS[f]) D.errors.push('Granjero sin NPC: ' + f); });

const ok = DEF.validate();
if (!ok) {
  console.error('[CR] data · ' + D.errors.length + ' referencias rotas:\n' + D.errors.slice(0, 40).join('\n'));
} else {
  DEF.seal();
}

console.info('[CR] data-world.js listo · ' +
  Object.keys(D.BUILDINGS).length + ' edificios (' + HOUSES.length + ' casas) · ' +
  Object.keys(D.CITY_STRUCTS).length + ' estructuras de ciudad · ' +
  Object.keys(D.NPCS).length + ' NPC · ' + D.QUESTS.length + ' contratos · ' +
  D.HELP.length + ' secciones de ayuda · ' + D.TIPS.length + ' consejos · validación: ' + (ok ? 'OK' : 'FALLO'));
console.info('[CR] CONTENIDO TOTAL · ' + Object.keys(D.ITEMS).length + ' objetos · ' +
  D.RECIPES.length + ' recetas · ' + Object.keys(D.SPECIES).length + ' especies · ' +
  D.BIOMES.length + ' biomas · ' + D.ZONES.length + ' santuarios · ' + D.STATIONS.length + ' estaciones · ' +
  D.SKILLS.length + ' habilidades');
})();