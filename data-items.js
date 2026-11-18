/* ============================================================
KANATO DE JOTUN · data-items.js — Contenido v4 (parte 2 de 4)
CAMBIOS v4:
· Solo 6 estaciones: hand · campfire · workbench · kitchen · forge · alchemy
  (fundición+herrería+yunque → FORJA · telar+potro+flechas → BANCO ·
   molino → COCINA)
· Cada receta lleva `saber` (familia aprendible) y `tier` (por nivel).
· Supervivencia GRATIS a mano: pico, hacha, azada, caña y arco de madera,
  flechas caseras, cuerda, antorcha, venda simple, petate, cebo, pienso.
· `repair` por objeto: arreglar una herramienta rota cuesta 1–2 materiales
  comunes, no la receta entera.
· Tier 3 (nivel 31+) = maestría de jefe y legendarios.
============================================================ */
(function () {
'use strict';
const CR = window.CR;
if (!CR || !CR.DEF) { console.error('[CR] data-items.js requiere data.js'); return; }
const DEF = CR.DEF, D = CR.DATA, B = D.BAL;
const I = DEF.item, R = DEF.recipe, N = DEF.nutrition;
const AMMO = D.AMMO_KINDS, SH = D.SHIELD_KINDS;

/* Atajos de saber */
const SM = 'smith', CR2 = 'craft', CK = 'cook', FD = 'field', AL = 'alchemy', MA = 'master';

/* ==========================================================
1 · MATERIAS PRIMAS
========================================================== */
const MATS = [
  ['stone', 'Piedra', 2, 'Roca común. Base de muros y cimientos.'],
  ['wood', 'Madera', 3, 'Troncos. También sirve de combustible.', ['fuel']],
  ['coal', 'Carbón mineral', 5, 'Combustible de alto rendimiento.', ['fuel']],
  ['charcoal', 'Carbón vegetal', 7, 'Leña cocida sin aire. Arde más limpio y más fuerte.', ['fuel']],
  ['flint', 'Sílex', 4, 'Piedra que salta chispas. Puntas y encendedores.'],
  ['clay', 'Arcilla', 3, 'Se cuece en ladrillo y crisoles.'],
  ['sand', 'Arena fina', 2, 'Vidrio, moldes y sal por evaporación.'],
  ['sulfur', 'Azufre', 9, 'Polvo amarillo. Flechas ígneas y alquimia.'],
  ['obsidian', 'Obsidiana', 26, 'Vidrio volcánico. Filos que no se mellan.'],
  ['ice_shard', 'Esquirla de hielo', 8, 'Hielo que no se derrite. Flechas gélidas.'],
  ['copper_ore', 'Mineral de cobre', 8, 'Se funde en la forja.'],
  ['iron_ore', 'Mineral de hierro', 18, 'Se funde en la forja.'],
  ['mithril_ore', 'Mineral de mithril', 45, 'Ligero y frío al tacto.'],
  ['adamantite_ore', 'Mineral de adamantita', 110, 'Solo la forja más caliente lo rinde.'],
  ['gold_nugget', 'Pepita de oro', 60, 'Moneda, joya y buen regalo.'],
  ['crystal', 'Cristal corrupto', 35, 'Zumba despacio. Encantamientos.'],
  ['fiber', 'Fibra vegetal', 2, 'Se hilacha en cuerda y tela.'],
  ['hay', 'Heno', 2, 'Alimento básico de ganado.'],
  ['straw', 'Paja', 2, 'Camas, techos y corrales.'],
  ['wool', 'Lana', 10, 'Producto de oveja y alpaca.'],
  ['silk', 'Seda', 34, 'Hilo de criaturas míticas.'],
  ['thread', 'Hilo', 5, 'Cose tela, vendas y cuerdas finas.'],
  ['cloth', 'Tela', 8, 'Tejido en el banco de trabajo.'],
  ['linen', 'Lino fino', 16, 'Tela apretada. Vendas limpias.'],
  ['rope', 'Cuerda', 6, 'Ata, asegura y construye.'],
  ['hide', 'Piel sin curtir', 6, 'Cúrtela en el banco.'],
  ['leather', 'Cuero', 12, 'Piel curtida. Armaduras y sillas.'],
  ['hard_leather', 'Cuero endurecido', 26, 'Cuero hervido en cera. Placas ligeras.'],
  ['bone', 'Hueso', 4, 'Puntas, agujas y mangos.'],
  ['feather', 'Pluma', 3, 'Asta de flecha y relleno de cama.'],
  ['crab_shell', 'Caparazón', 7, 'Placas naturales de cangrejo.'],
  ['chitin', 'Quitina', 11, 'Coraza de escorpión. Ligera y dura.'],
  ['herb', 'Hierba medicinal', 6, 'Vendas, tónicos y antídotos.', ['herbany']],
  ['herb_blue', 'Hierba azul', 14, 'Amarga. Baja la fiebre y el veneno.', ['herbany']],
  ['herb_fire', 'Hierba de brasa', 16, 'Quema al masticarla. Resistencia al fuego.', ['herbany']],
  ['honey', 'Miel', 14, 'Endulza, cura y fermenta.'],
  ['beeswax', 'Cera de abeja', 9, 'Velas, cueros y moldes.'],
  ['manure', 'Estiércol', 2, 'Fertilizante básico.'],
  ['flour', 'Harina', 7, 'Grano molido en la cocina.'],
  ['oil', 'Aceite', 11, 'Prensado de semillas. Cocina y ungüentos.'],
  ['salt', 'Sal', 6, 'Conserva carne y realza platos.'],
  ['brick', 'Ladrillo cocido', 6, 'Arcilla cocida. Hornos y chimeneas.']
];
MATS.forEach(function (m) {
  const d = { name: m[1], cat: 'material', value: m[2], desc: m[3] };
  if (m[4]) d.tags = m[4];
  if (m[0] === 'wood') d.fuel = 1;
  if (m[0] === 'coal') d.fuel = 4;
  if (m[0] === 'charcoal') d.fuel = 6;
  I(m[0], d);
});
D.ITEMS.honey.food = N('tiny', 'simple', 'uncommon', { st: 12, hp: 4 });

/* --- Botín de criaturas míticas y jefes --- */
const MYTH_MATS = [
  ['venom_sac', 'Saco de veneno', 25, 'Gotea. Flechas tóxicas y antídotos.'],
  ['warg_fang', 'Colmillo de huargo', 40, 'Aún huele a noche.'],
  ['ember_core', 'Núcleo de ascua', 30, 'Calor que no se apaga.'],
  ['troll_hide', 'Piel de troll', 28, 'Gruesa como un tablón.'],
  ['hydra_scale', 'Escama de hidra', 44, 'Verde y resistente al veneno.'],
  ['frost_core', 'Núcleo de escarcha', 52, 'El aire se enfría a su alrededor.'],
  ['dragon_scale', 'Escama de dragón', 160, 'Ningún filo la atraviesa.'],
  ['unicorn_hair', 'Crin de unicornio', 120, 'Brilla sin luz. Cuerdas de arco únicas.'],
  ['kirin_horn', 'Cuerno de kirin', 130, 'Talla el aire al moverse.'],
  ['manticore_spine', 'Púa de mantícora', 90, 'Dardo natural. Puntas dentadas.'],
  ['wyvern_membrane', 'Membrana de wyvern', 85, 'Ala curtida. Velas y arneses de vuelo.'],
  ['basilisk_eye', 'Ojo de basilisco', 110, 'No lo mires de frente.'],
  ['cerberus_fang', 'Colmillo de cerbero', 105, 'Tres bocas, un mismo filo.'],
  ['golem_core', 'Núcleo de gólem', 95, 'Piedra que obedece.'],
  ['wisp_essence', 'Esencia de fuego fatuo', 60, 'Luz fría en un frasco.'],
  ['pegasus_feather', 'Pluma de pegaso', 140, 'Pesa menos que el aire.'],
  ['jotun_ice', 'Hielo de jotun', 180, 'Hielo viejo como la muralla.'],
  ['fenrir_pelt', 'Pelaje de Fenrir', 200, 'Sombra tejida en pelo.'],
  ['troll_heart', 'Corazón de Troll', 600, 'Late con fuerza sobrenatural.'],
  ['hydra_fang', 'Colmillo de Hidra', 900, 'Gotea veneno eterno.'],
  ['phoenix_feather', 'Pluma de Fénix', 1100, 'Arde sin consumirse.'],
  ['dragon_heart', 'Corazón de Dragón', 1800, 'Un horno que late.'],
  ['jotun_crown', 'Corona de Escarcha', 1500, 'Frío que corona.'],
  ['fenrir_chain', 'Cadena de Fenrir', 1600, 'Forjada para atar a un dios.'],
  ['basilisk_crown', 'Diadema del Basilisco', 1400, 'Quien la lleva no parpadea.']
];
MYTH_MATS.forEach(function (m) {
  I(m[0], { name: m[1], cat: m[2] >= 600 ? 'unique' : 'material', value: m[2], desc: m[3], stack: m[2] >= 600 ? 5 : 99 });
});

/* ==========================================================
2 · FUNDICIÓN Y LADRILLOS → FORJA
========================================================== */
const SMELT = [
  ['copper_bar', 'Lingote de cobre', 20, 'copper_ore', 2, 1, { lv: 5, skill: { artisan: 2 } }],
  ['iron_bar', 'Lingote de hierro', 45, 'iron_ore', 2, 1, { lv: 6, skill: { artisan: 2 } }],
  ['steel_bar', 'Lingote de acero', 90, 'iron_bar', 1, 2, { lv: 8, skill: { artisan: 3 } }],
  ['gold_bar', 'Lingote de oro', 130, 'gold_nugget', 2, 1, { lv: 9, skill: { artisan: 3 } }],
  ['mithril_bar', 'Lingote de mithril', 110, 'mithril_ore', 2, 2, { lv: 11, skill: { artisan: 4 } }],
  ['adamantite_bar', 'Lingote de adamantita', 260, 'adamantite_ore', 2, 3, { lv: 15, skill: { artisan: 6 } }]
];
SMELT.forEach(function (s) {
  I(s[0], { name: s[1], cat: 'material', value: s[2], desc: 'Fundido en la forja. Saber: Fundición y forja.' });
  const ing = [{ id: s[3], n: s[4] }];
  if (s[0] === 'steel_bar') ing.push({ id: 'coal', n: 2 });
  R(s[0], 1, ing, 'forge', { fuel: B.SMELT_FUEL + s[5], req: s[6], skill: 'mining', xp: B.XP_SMELT, saber: SM });
});
I('obsidian_bar', { name: 'Obsidiana pulida', cat: 'material', value: 60, desc: 'Lámina vítrea para filos superiores.' });
R('obsidian_bar', 1, [{ id: 'obsidian', n: 2 }, { id: 'coal', n: 1 }], 'forge',
  { fuel: 4, req: { lv: 13, skill: { artisan: 5 } }, saber: SM });
/* Ladrillo y carbón: sin saber, para que la construcción nunca se atasque */
R('brick', 2, [{ id: 'clay', n: 3 }], 'forge', { fuel: 2, req: { lv: 4, skill: { artisan: 1 } }, xp: 8 });
R('charcoal', 2, [{ id: 'wood', n: 3 }], 'forge', { fuel: 1, req: { lv: 4, skill: { artisan: 1 } }, xp: 8 });
R('charcoal', 1, [{ id: 'wood', n: 2 }], 'campfire', { fuel: 2, req: null, xp: 5 });

/* ==========================================================
3 · TEXTILES Y CURTIDO → BANCO (saber Oficio de banco)
========================================================== */
R('rope', 1, [{ id: 'fiber', n: 3 }], 'hand', { req: null, xp: 4 });
R('straw', 2, [{ id: 'hay', n: 1 }], 'hand', { req: null, xp: 3 });
I('needle', { name: 'Aguja de hueso', cat: 'tool', value: 12, stack: 1,
  tool: { kind: 'needle', dmg: 1, pow: 1, dur: 120, stam: 1 }, desc: 'Cose vendas y ropa fina.' });
R('needle', 1, [{ id: 'bone', n: 1 }, { id: 'flint', n: 1 }], 'hand', { req: null, xp: 6 });

const TEX = [
  ['thread', 2, [{ id: 'fiber', n: 2 }], 4, 2, 6],
  ['thread', 2, [{ id: 'wool', n: 1 }], 4, 2, 6],
  ['thread', 2, [{ id: 'crop_cotton', n: 2 }], 4, 2, 6],
  ['cloth', 1, [{ id: 'thread', n: 3 }], 4, 2, 8],
  ['linen', 1, [{ id: 'crop_flax', n: 2 }, { id: 'thread', n: 1 }], 6, 3, 12],
  ['silk', 1, [{ id: 'wyvern_membrane', n: 1 }, { id: 'thread', n: 2 }], 14, 6, 26],
  ['leather', 1, [{ id: 'hide', n: 2 }, { id: 'salt', n: 1 }], 4, 2, 9],
  ['leather', 1, [{ id: 'hide', n: 3 }], 4, 2, 7],
  ['hard_leather', 1, [{ id: 'leather', n: 2 }, { id: 'beeswax', n: 1 }], 8, 3, 16]
];
TEX.forEach(function (t, i) {
  R(t[0], t[1], t[2], 'workbench', {
    id: 'r_tex_' + i, req: { lv: t[3], skill: { artisan: t[4] } }, xp: t[5], saber: CR2,
    fuel: t[0] === 'hard_leather' ? 1 : 0
  });
});

/* ==========================================================
4 · MOLINO Y SAL → COCINA (saber Cocina de campaña)
========================================================== */
R('flour', 2, [{ tag: 'grain', n: 2 }], 'kitchen', { req: { lv: 4, skill: { artisan: 1 } }, xp: 7, saber: CK });
R('oil', 1, [{ id: 'crop_sunflower', n: 2 }], 'kitchen', { id: 'r_oil_sun', req: { lv: 5, skill: { artisan: 1 } }, xp: 8, saber: CK });
R('oil', 1, [{ id: 'crop_flax', n: 2 }], 'kitchen', { id: 'r_oil_flax', req: { lv: 5, skill: { artisan: 1 } }, xp: 8, saber: CK });
R('salt', 2, [{ id: 'sand', n: 3 }], 'kitchen', { fuel: 2, req: { lv: 4, skill: { artisan: 1 } }, xp: 6, saber: CK });

/* ==========================================================
5 · HERRAMIENTAS
   Piedra → A MANO, gratis. Metal → FORJA (smith).
   Madera y útiles → BANCO. Campo → field.
========================================================== */
const TIERS = [
  { id: 'stone', adj: 'de piedra', mat: 'stone', n: 3, dmg: 6, dur: 60, pow: 1, val: 12, lv: 1 },
  { id: 'copper', adj: 'de cobre', mat: 'copper_bar', n: 3, dmg: 10, dur: 120, pow: 2, val: 70, lv: 5 },
  { id: 'iron', adj: 'de hierro', mat: 'iron_bar', n: 3, dmg: 16, dur: 220, pow: 3, val: 170, lv: 7 },
  { id: 'steel', adj: 'de acero', mat: 'steel_bar', n: 3, dmg: 22, dur: 300, pow: 4, val: 340, lv: 9 },
  { id: 'obsidian', adj: 'de obsidiana', mat: 'obsidian_bar', n: 2, dmg: 28, dur: 260, pow: 5, val: 480, lv: 13 },
  { id: 'mithril', adj: 'de mithril', mat: 'mithril_bar', n: 3, dmg: 30, dur: 400, pow: 5, val: 560, lv: 11 },
  { id: 'adamantite', adj: 'de adamantita', mat: 'adamantite_bar', n: 3, dmg: 42, dur: 550, pow: 6, val: 950, lv: 16 }
];
const TIER_BY = {};
TIERS.forEach(function (t) { TIER_BY[t.id] = t; });

/* Reparación barata: 1 material del tier + 1 común. Nunca la receta entera. */
function repairCost(t) {
  if (t.id === 'stone') return { stone: 1, wood: 1 };
  const c = {}; c[t.mat] = 1; c.wood = 1;
  return c;
}
TIERS.forEach(function (t) {
  const byHand = t.id === 'stone';
  const station = byHand ? 'hand' : 'forge';
  const req = byHand ? null : { lv: t.lv, skill: { artisan: Math.min(6, t.pow) } };
  [['pick', 'Pico'], ['axe', 'Hacha']].forEach(function (k) {
    I(k[0] + '_' + t.id, {
      name: k[1] + ' ' + t.adj, cat: 'tool', value: t.val, stack: 1,
      tool: { kind: k[0], dmg: Math.max(2, Math.round(t.dmg * 0.6)), pow: t.pow, dur: t.dur, stam: B.ST_MINE },
      repair: repairCost(t),
      desc: 'Poder ' + t.pow + ' · Durabilidad ' + t.dur + '. ' + (k[0] === 'pick' ? 'Roca y vetas.' : 'Árboles y madera.') +
        (byHand ? ' Se hace a mano, sin mesa.' : '')
    });
    R(k[0] + '_' + t.id, 1, [{ id: t.mat, n: t.n }, { id: 'wood', n: 2 }], station, {
      req: req, fuel: byHand ? 0 : 2, skill: k[0] === 'pick' ? 'mining' : 'woodcut', xp: 12,
      saber: byHand ? null : SM
    });
  });
});
/* Azadas */
['stone', 'copper', 'iron', 'steel'].forEach(function (id) {
  const t = TIER_BY[id], byHand = id === 'stone';
  I('hoe_' + id, {
    name: 'Azada ' + t.adj, cat: 'tool', value: Math.round(t.val * 0.7), stack: 1,
    tool: { kind: 'hoe', dmg: 2, pow: t.pow, dur: t.dur, stam: 4 },
    repair: repairCost(t), desc: 'Ara la tierra de tus parcelas.'
  });
  R('hoe_' + id, 1, [{ id: t.mat, n: 2 }, { id: 'wood', n: 2 }], byHand ? 'hand' : 'forge', {
    req: byHand ? null : { lv: Math.max(4, t.lv - 1), skill: { artisan: 1 } },
    fuel: byHand ? 0 : 1, skill: 'farming', xp: 10, saber: byHand ? null : FD
  });
});
/* Cañas */
[['wood', 'de madera', 1, 80, 15, 2], ['iron', 'de hierro', 2, 160, 120, 6], ['mithril', 'de mithril', 3, 300, 420, 12]]
.forEach(function (r) {
  I('rod_' + r[0], {
    name: 'Caña ' + r[1], cat: 'tool', value: r[4], stack: 1,
    tool: { kind: 'rod', dmg: 2, pow: r[2], dur: r[3], stam: 3 },
    repair: r[0] === 'wood' ? { wood: 1, fiber: 1 } : (r[0] === 'iron' ? { iron_bar: 1, wood: 1 } : { mithril_bar: 1, wood: 1 }),
    desc: 'Pesca. Mejora la ventana de captura.'
  });
});
R('rod_wood', 1, [{ id: 'wood', n: 3 }, { id: 'rope', n: 1 }], 'hand', { req: null, skill: 'fishing', xp: 8 });
R('rod_iron', 1, [{ id: 'iron_bar', n: 2 }, { id: 'thread', n: 2 }], 'workbench',
  { req: { lv: 6, skill: { artisan: 2 } }, skill: 'fishing', xp: 12, saber: CR2 });
R('rod_mithril', 1, [{ id: 'mithril_bar', n: 2 }, { id: 'thread', n: 3 }], 'workbench',
  { req: { lv: 12, skill: { artisan: 4 } }, skill: 'fishing', xp: 20, saber: CR2 });

I('watering_can', { name: 'Regadera', cat: 'tool', value: 25, stack: 1,
  tool: { kind: 'water', dmg: 1, pow: 1, dur: 150, stam: 2 }, repair: { copper_bar: 1, wood: 1 },
  desc: 'Riega cultivos (+35 % crecimiento).' });
R('watering_can', 1, [{ id: 'copper_bar', n: 2 }, { id: 'wood', n: 2 }], 'workbench',
  { req: { lv: 3, skill: { artisan: 1 } }, xp: 9, saber: FD });
I('waterskin', { name: 'Odre', cat: 'tool', value: 30, stack: 1,
  tool: { kind: 'water', dmg: 1, pow: 2, dur: 260, stam: 1 }, repair: { leather: 1, rope: 1 },
  desc: 'Riega muchas veces antes de rellenarse en agua.' });
R('waterskin', 1, [{ id: 'leather', n: 2 }, { id: 'rope', n: 1 }], 'workbench',
  { req: { lv: 4, skill: { artisan: 2 } }, xp: 9, saber: FD });
I('sickle', { name: 'Hoz', cat: 'tool', value: 60, stack: 1,
  tool: { kind: 'sickle', dmg: 5, pow: 2, dur: 180, stam: 2 }, repair: { iron_bar: 1, wood: 1 },
  desc: 'Cosecha 2×2 y rinde más semilla.' });
R('sickle', 1, [{ id: 'iron_bar', n: 2 }, { id: 'wood', n: 1 }], 'forge',
  { req: { lv: 7, skill: { artisan: 2 } }, fuel: 1, skill: 'farming', xp: 12, saber: FD });
I('hammer_build', { name: 'Martillo de obra', cat: 'tool', value: 80, stack: 1,
  tool: { kind: 'hammer', dmg: 7, pow: 2, dur: 200, stam: 3 }, repair: { iron_bar: 1, wood: 1 },
  desc: 'Construye y mejora sin gastar stamina extra.' });
R('hammer_build', 1, [{ id: 'iron_bar', n: 3 }, { id: 'wood', n: 2 }], 'forge',
  { req: { lv: 7, skill: { artisan: 2 } }, fuel: 1, xp: 12, saber: FD });
I('repair_kit', { name: 'Kit de reparación', cat: 'misc', value: 70,
  desc: 'Restaura 40 % de durabilidad del arma, herramienta y escudo equipados.' });
R('repair_kit', 1, [{ id: 'iron_bar', n: 1 }, { id: 'leather', n: 1 }, { id: 'oil', n: 1 }], 'workbench',
  { req: { lv: 6, skill: { artisan: 2 } }, xp: 12, saber: CR2 });
I('whetstone', { name: 'Piedra de afilar', cat: 'misc', value: 45, desc: '+15 % de daño durante un día.' });
R('whetstone', 1, [{ id: 'flint', n: 2 }, { id: 'stone', n: 2 }], 'hand', { req: null, xp: 8 });
I('torch', { name: 'Antorcha', cat: 'tool', value: 8, stack: 1,
  tool: { kind: 'torch', dmg: 3, pow: 1, dur: 240, stam: 1 }, light: 110, repair: { wood: 1, fiber: 1 },
  desc: 'Ilumina la noche. Se consume con el tiempo.' });
R('torch', 2, [{ id: 'wood', n: 1 }, { id: 'fiber', n: 1 }], 'hand', { req: null, xp: 3 });
I('lantern', { name: 'Farol de aceite', cat: 'tool', value: 140, stack: 1,
  tool: { kind: 'lantern', dmg: 1, pow: 1, dur: 900, stam: 1 }, light: 170, repair: { copper_bar: 1, oil: 1 },
  desc: 'Luz estable y duradera. No se apaga con la lluvia.' });
R('lantern', 1, [{ id: 'copper_bar', n: 2 }, { id: 'sand', n: 2 }, { id: 'oil', n: 1 }], 'workbench',
  { req: { lv: 7, skill: { artisan: 3 } }, xp: 16, saber: CR2 });

/* ==========================================================
6 · ARMAS CUERPO A CUERPO
========================================================== */
TIERS.forEach(function (t) {
  const byHand = t.id === 'stone';
  I('sword_' + t.id, {
    name: 'Espada ' + t.adj, cat: 'weapon', value: Math.round(t.val * 1.2), stack: 1,
    weapon: { kind: 'sword', dmg: t.dmg, dur: t.dur, reach: B.REACH, speed: 1.0 },
    repair: repairCost(t), desc: 'Daño ' + t.dmg + ' · Combo de 4 golpes.'
  });
  R('sword_' + t.id, 1, [{ id: t.mat, n: t.n }, { id: 'wood', n: 1 }, { id: byHand ? 'fiber' : 'leather', n: 1 }],
    byHand ? 'workbench' : 'forge', {
      req: byHand ? { lv: 2 } : { lv: t.lv, skill: { might: Math.min(6, t.pow), artisan: 2 } },
      fuel: byHand ? 0 : 2, skill: 'combat', xp: 14, saber: byHand ? null : SM
    });
});
[['copper', 9, 5], ['iron', 15, 7], ['steel', 21, 9], ['mithril', 29, 12], ['obsidian', 33, 14]]
.forEach(function (s) {
  const t = TIER_BY[s[0]];
  I('spear_' + s[0], {
    name: 'Lanza ' + t.adj, cat: 'weapon', value: Math.round(t.val * 1.1), stack: 1,
    weapon: { kind: 'spear', dmg: s[1], dur: t.dur, reach: B.SPEAR_REACH, speed: 0.85 },
    repair: repairCost(t), desc: 'Mayor alcance y empuje, más lenta. Daño ' + s[1] + '.'
  });
  R('spear_' + s[0], 1, [{ id: t.mat, n: 2 }, { id: 'wood', n: 3 }], 'forge',
    { req: { lv: s[2], skill: { might: 2, artisan: 2 } }, fuel: 2, skill: 'combat', xp: 14, saber: SM });
});
[['iron', 19, 7], ['steel', 26, 10]].forEach(function (m) {
  const t = TIER_BY[m[0]];
  I('mace_' + m[0], {
    name: 'Maza ' + t.adj, cat: 'weapon', value: Math.round(t.val * 1.15), stack: 1,
    weapon: { kind: 'mace', dmg: m[1], dur: t.dur, reach: B.REACH * 0.92, speed: 0.78, guardBreak: 0.5 },
    repair: repairCost(t), desc: 'Rompe guardias y aturde. Daño ' + m[1] + '.'
  });
  R('mace_' + m[0], 1, [{ id: t.mat, n: 3 }, { id: 'wood', n: 2 }], 'forge',
    { req: { lv: m[2], skill: { might: 3, artisan: 2 } }, fuel: 2, skill: 'combat', xp: 16, saber: SM });
});
I('warhammer_steel', { name: 'Martillo de guerra', cat: 'weapon', value: 520, stack: 1,
  weapon: { kind: 'hammer', dmg: 34, dur: 320, reach: B.REACH, speed: 0.62, guardBreak: 1, knock: 4 },
  repair: { steel_bar: 1, wood: 1 }, desc: 'Lentísimo. Cada golpe conectado derriba.' });
R('warhammer_steel', 1, [{ id: 'steel_bar', n: 4 }, { id: 'wood', n: 3 }, { id: 'leather', n: 2 }], 'forge',
  { req: { lv: 12, skill: { might: 5, artisan: 4 } }, fuel: 2, skill: 'combat', xp: 24, saber: SM });
I('dagger_iron', { name: 'Daga de hierro', cat: 'weapon', value: 130, stack: 1,
  weapon: { kind: 'dagger', dmg: 11, dur: 180, reach: B.REACH * 0.75, speed: 1.5, crit: 0.14 },
  repair: { iron_bar: 1, leather: 1 }, desc: 'Rapidísima y con crítico alto. Ideal tras un parry.' });
R('dagger_iron', 1, [{ id: 'iron_bar', n: 2 }, { id: 'leather', n: 1 }], 'forge',
  { req: { lv: 6, skill: { might: 1, artisan: 2 } }, fuel: 1, skill: 'combat', xp: 12, saber: SM });

/* ==========================================================
7 · ARCOS Y BALLESTAS → BANCO (saber Oficio de banco)
========================================================== */
const BOWS = [
  ['bow_wood', 'Arco corto', 8, 1.0, 90, 15, ['wood', 3, 'rope', 1], 1, 0, true],
  ['bow_hunter', 'Arco recurvo', 13, 0.9, 150, 120, ['wood', 3, 'hard_leather', 1, 'rope', 1], 5, 2, false],
  ['bow_composite', 'Arco compuesto', 19, 0.8, 220, 300, ['iron_bar', 2, 'hard_leather', 2, 'thread', 3], 8, 3, false],
  ['crossbow_iron', 'Ballesta de hierro', 26, 1.3, 200, 340, ['iron_bar', 4, 'wood', 3, 'rope', 2], 9, 3, false],
  ['bow_mithril', 'Arco de mithril', 27, 0.7, 340, 620, ['mithril_bar', 3, 'silk', 2, 'unicorn_hair', 1], 12, 5, false],
  ['crossbow_steel', 'Ballesta de acero', 36, 1.2, 300, 700, ['steel_bar', 4, 'hard_leather', 2, 'thread', 3], 13, 5, false]
];
BOWS.forEach(function (b) {
  const cross = b[0].indexOf('crossbow') === 0;
  I(b[0], {
    name: b[1], cat: 'weapon', value: b[6], stack: 1,
    weapon: { kind: cross ? 'crossbow' : 'bow', dmg: b[2], draw: b[3], dur: b[4], reach: B.AIM_MAX_RANGE,
              speed: cross ? 0.6 : 1.0, ammo: cross ? 'bolt' : 'arrow' },
    repair: b[9] ? { wood: 1, rope: 1 } : { wood: 1, thread: 1 },
    desc: (cross ? 'Recarga lenta, daño brutal. Usa virotes.' : 'Mantén para tensar y suelta para disparar.') + ' Daño base ' + b[2] + '.'
  });
  const ing = [];
  for (let i = 0; i < b[5].length; i += 2) ing.push({ id: b[5][i], n: b[5][i + 1] });
  R(b[0], 1, ing, b[9] ? 'hand' : 'workbench', {
    req: b[9] ? null : { lv: b[7], skill: { marks: b[8], artisan: Math.min(5, b[8] + 1) } },
    skill: 'combat', xp: 18, saber: b[9] ? null : CR2
  });
});

/* ==========================================================
8 · MUNICIONES (9 tipos) → BANCO
========================================================== */
const ARROW_DEF = [
  ['basic', 'arrow_basic', 'Flecha de sílex', 4, ['wood', 1, 'flint', 1, 'feather', 1], 10, 4, 2],
  ['iron', 'arrow_iron', 'Flecha pesada', 9, ['wood', 1, 'iron_bar', 1, 'feather', 1], 10, 6, 2],
  ['fire', 'arrow_fire', 'Flecha ígnea', 14, ['wood', 1, 'sulfur', 1, 'oil', 1, 'feather', 1], 8, 8, 3],
  ['ice', 'arrow_ice', 'Flecha gélida', 14, ['wood', 1, 'ice_shard', 1, 'feather', 1], 8, 8, 3],
  ['poison', 'arrow_poison', 'Flecha envenenada', 15, ['wood', 1, 'venom_sac', 1, 'feather', 1], 8, 9, 3],
  ['tame', 'arrow_tame', 'Flecha somnífera', 22, ['wood', 1, 'herb_blue', 2, 'feather', 1], 6, 10, 5],
  ['barbed', 'arrow_barbed', 'Flecha dentada', 16, ['wood', 1, 'bone', 2, 'manticore_spine', 1], 8, 11, 4],
  ['bolt', 'arrow_bolt', 'Virote de acero', 18, ['steel_bar', 1, 'wood', 1, 'feather', 1], 8, 10, 4],
  ['mythril', 'arrow_mythril', 'Flecha de mithril', 40, ['mithril_bar', 1, 'feather', 1, 'crystal', 1], 6, 14, 6]
];
ARROW_DEF.forEach(function (a) {
  const k = AMMO[a[0]];
  I(a[1], {
    name: a[2], cat: 'ammo', value: a[3], stack: 99,
    ammo: { kind: a[0], dmg: k.dmg, effect: k.effect, fits: a[0] === 'bolt' ? 'bolt' : 'arrow' },
    desc: k.desc + ' Multiplicador de daño ×' + k.dmg.toFixed(2) + '.'
  });
  const ing = [];
  for (let i = 0; i < a[4].length; i += 2) ing.push({ id: a[4][i], n: a[4][i + 1] });
  R(a[1], a[5], ing, 'workbench', { req: { lv: a[6], skill: { marks: a[7] } }, skill: 'combat', xp: 8, saber: CR2 });
});
/* Flecha casera: a mano, con fibra en lugar de pluma. Gratis siempre. */
R('arrow_basic', 3, [{ id: 'wood', n: 1 }, { id: 'flint', n: 1 }, { id: 'fiber', n: 1 }], 'hand',
  { id: 'r_arrow_basic_hand', req: null, skill: 'combat', xp: 4 });
I('quiver', { name: 'Carcaj', cat: 'bag', value: 160, stack: 1, bag: { slots: 0, ammo: 60 },
  desc: 'Guarda 60 flechas sin ocupar la mochila.' });
R('quiver', 1, [{ id: 'leather', n: 3 }, { id: 'thread', n: 2 }], 'workbench',
  { req: { lv: 6, skill: { marks: 2, artisan: 2 } }, xp: 12, saber: CR2 });

/* ==========================================================
9 · ESCUDOS
========================================================== */
const SHIELDS = [
  ['buckler', 'shield_buckler', 'Broquel de cuero', 'leather', 4, 90, 40, 2, 1, 'workbench', CR2],
  ['round', 'shield_round_wood', 'Escudo redondo de madera', 'wood', 5, 100, 45, 2, 1, 'workbench', null],
  ['round', 'shield_round', 'Escudo redondo de hierro', 'iron_bar', 9, 200, 190, 6, 2, 'forge', SM],
  ['kite', 'shield_kite', 'Escudo cometa de acero', 'steel_bar', 13, 280, 380, 9, 3, 'forge', SM],
  ['spiked', 'shield_spiked', 'Escudo de púas', 'steel_bar', 11, 240, 420, 10, 4, 'forge', SM],
  ['tower', 'shield_tower', 'Pavés de acero', 'steel_bar', 18, 360, 560, 12, 5, 'forge', SM],
  ['warding', 'shield_warding', 'Égida rúnica', 'mithril_bar', 15, 320, 760, 14, 6, 'forge', SM]
];
SHIELDS.forEach(function (s) {
  const k = SH[s[0]];
  I(s[1], {
    name: s[2], cat: 'shield', value: s[6], stack: 1,
    shield: { kind: s[0], def: s[4], dur: s[5], reduce: k.reduce, parry: k.parry, arc: k.arc,
              weight: k.weight, bash: k.bash, ward: s[0] === 'warding' },
    repair: s[3] === 'wood' ? { wood: 2, fiber: 1 } : (s[3] === 'leather' ? { leather: 1, wood: 1 } : { [s[3]]: 1, leather: 1 }),
    desc: k.desc + ' Bloqueo ' + Math.round(k.reduce * 100) + ' % · Parry ' + Math.round(k.parry * 100) + ' % · Defensa ' + s[4] + '.'
  });
  const ing = [{ id: s[3], n: s[0] === 'tower' ? 6 : 3 }, { id: 'leather', n: 2 }];
  if (s[0] === 'spiked') ing.push({ id: 'bone', n: 4 }, { id: 'manticore_spine', n: 1 });
  if (s[0] === 'warding') ing.push({ id: 'crystal', n: 2 }, { id: 'wisp_essence', n: 1 });
  R(s[1], 1, ing, s[9], {
    req: { lv: s[7], skill: { guard: s[8], artisan: Math.min(5, s[8] + 1) } },
    fuel: s[9] === 'forge' ? 1 : 0, skill: 'combat', xp: 16, saber: s[10]
  });
});

/* ==========================================================
10 · ARMADURAS
========================================================== */
const ARMOR_SETS = [
  { id: 'cloth', adj: 'de tela', mat: 'cloth', def: [1, 2, 1], n: [2, 3, 2], val: [10, 16, 10], st: 'workbench', lv: 2, sk: 1, saber: CR2,
    pieces: ['Capucha', 'Túnica', 'Calzas'], rep: 'cloth' },
  { id: 'leather', adj: 'de cuero', mat: 'leather', def: [3, 5, 3], n: [2, 3, 2], val: [40, 65, 40], st: 'workbench', lv: 4, sk: 2, saber: CR2,
    pieces: ['Gorro', 'Jubón', 'Pantalones'], rep: 'leather' },
  { id: 'hard_leather', adj: 'de cuero endurecido', mat: 'hard_leather', def: [5, 8, 5], n: [2, 3, 2], val: [95, 150, 95], st: 'workbench', lv: 8, sk: 3, saber: CR2,
    pieces: ['Casco', 'Peto', 'Grebas'], rep: 'hard_leather' },
  { id: 'iron', adj: 'de hierro', mat: 'iron_bar', def: [6, 10, 6], n: [3, 5, 3], val: [150, 240, 150], st: 'forge', lv: 8, sk: 3, saber: SM,
    pieces: ['Yelmo', 'Coraza', 'Grebas'], rep: 'iron_bar' },
  { id: 'steel', adj: 'de acero', mat: 'steel_bar', def: [9, 15, 9], n: [3, 5, 3], val: [290, 470, 290], st: 'forge', lv: 11, sk: 4, saber: SM,
    pieces: ['Yelmo', 'Coraza', 'Grebas'], rep: 'steel_bar' },
  { id: 'mithril', adj: 'de mithril', mat: 'mithril_bar', def: [13, 21, 13], n: [3, 5, 3], val: [360, 580, 360], st: 'forge', lv: 14, sk: 5, saber: SM,
    pieces: ['Yelmo', 'Coraza', 'Grebas'], rep: 'mithril_bar' },
  { id: 'adamantite', adj: 'de adamantita', mat: 'adamantite_bar', def: [18, 28, 18], n: [4, 6, 4], val: [1050, 1600, 1050], st: 'forge', lv: 18, sk: 7, saber: SM,
    pieces: ['Yelmo', 'Coraza', 'Grebas'], rep: 'adamantite_bar' }
];
const ARM_SLOTS = ['head', 'chest', 'legs'];
ARMOR_SETS.forEach(function (s) {
  ARM_SLOTS.forEach(function (slot, i) {
    const rep = {}; rep[s.rep] = 1; rep.thread = 1;
    I(s.id + '_' + slot, {
      name: s.pieces[i] + ' ' + s.adj, cat: 'armor', value: s.val[i], stack: 1,
      armor: { slot: slot, def: s.def[i], set: s.id }, repair: rep,
      desc: 'Defensa ' + s.def[i] + '. Conjunto ' + s.adj + '.'
    });
    R(s.id + '_' + slot, 1, [{ id: s.mat, n: s.n[i] }, { id: 'thread', n: 1 }], s.st, {
      req: { lv: s.lv, skill: { guard: Math.max(1, s.sk - 1), artisan: s.sk } },
      fuel: s.st === 'forge' ? 1 : 0, xp: 14, saber: s.saber
    });
  });
});
/* Bardas */
[['leather', 4, 60, 'leather', 4, 'workbench', 4, 2, CR2],
 ['iron', 8, 200, 'iron_bar', 4, 'forge', 8, 3, SM],
 ['steel', 12, 380, 'steel_bar', 4, 'forge', 11, 4, SM],
 ['mithril', 18, 620, 'mithril_bar', 4, 'forge', 14, 6, SM]]
.forEach(function (p) {
  I('petarmor_' + p[0], {
    name: 'Barda ' + (p[0] === 'leather' ? 'de cuero' : p[0] === 'iron' ? 'de hierro' : p[0] === 'steel' ? 'de acero' : 'de mithril'),
    cat: 'petarmor', value: p[2], stack: 1, pet: { def: p[1] },
    desc: 'Defensa ' + p[1] + ' para tu compañero o montura.'
  });
  R('petarmor_' + p[0], 1, [{ id: p[3], n: p[4] }, { id: 'leather', n: 2 }], p[5], {
    req: { lv: p[6], skill: { beast: Math.max(1, p[7] - 1), artisan: p[7] } },
    fuel: p[5] === 'forge' ? 1 : 0, xp: 14, saber: p[8]
  });
});

/* ==========================================================
11 · MOCHILAS → BANCO
========================================================== */
[['small', 6, 'pequeña', 90, ['cloth', 4, 'leather', 2], 3, 1],
 ['medium', 10, 'mediana', 220, ['leather', 6, 'iron_bar', 1], 6, 2],
 ['large', 16, 'grande', 520, ['hard_leather', 6, 'mithril_bar', 2], 11, 4],
 ['explorer', 24, 'de explorador', 980, ['silk', 3, 'hard_leather', 8, 'wyvern_membrane', 2], 15, 6]]
.forEach(function (b) {
  I('bag_' + b[0], { name: 'Mochila ' + b[2], cat: 'bag', value: b[3], stack: 1,
    bag: { slots: b[1] }, desc: '+' + b[1] + ' espacios de inventario.' });
  const ing = [];
  for (let i = 0; i < b[4].length; i += 2) ing.push({ id: b[4][i], n: b[4][i + 1] });
  R('bag_' + b[0], 1, ing, 'workbench', { req: { lv: b[5], skill: { artisan: b[6] } }, xp: 14, saber: CR2 });
});

/* ==========================================================
12 · SILLAS DE MONTAR → BANCO (Afinidad)
========================================================== */
const SADDLES = [
  ['horse', 'caballo', 120, ['leather', 4, 'iron_bar', 2], 3, 1],
  ['camel', 'camello', 240, ['leather', 4, 'cloth', 4], 3, 1],
  ['llama', 'llama', 180, ['leather', 3, 'cloth', 3], 3, 1],
  ['reindeer', 'reno', 300, ['leather', 4, 'iron_bar', 2], 4, 2],
  ['bison', 'bisonte', 260, ['hard_leather', 5, 'iron_bar', 2], 5, 3],
  ['bear', 'oso', 380, ['hard_leather', 6, 'steel_bar', 2], 6, 4],
  ['warg', 'huargo', 320, ['warg_fang', 2, 'hard_leather', 6, 'steel_bar', 2], 7, 5],
  ['polar_bear', 'oso polar', 520, ['hard_leather', 6, 'steel_bar', 3], 8, 5],
  ['griffin', 'grifo', 650, ['mithril_bar', 3, 'feather', 8, 'hard_leather', 6], 10, 7],
  ['condor', 'cóndor', 700, ['mithril_bar', 3, 'feather', 8, 'hard_leather', 6], 10, 7],
  ['nightmare', 'pesadilla', 900, ['mithril_bar', 3, 'hard_leather', 8, 'crystal', 2], 12, 8],
  ['unicorn', 'unicornio', 900, ['unicorn_hair', 2, 'silk', 3, 'mithril_bar', 2], 12, 9],
  ['kirin', 'kirin', 950, ['kirin_horn', 1, 'silk', 3, 'mithril_bar', 2], 13, 9],
  ['pegasus', 'pegaso', 1200, ['pegasus_feather', 3, 'silk', 4, 'mithril_bar', 3], 14, 9],
  ['wyvern', 'wyvern', 1300, ['wyvern_membrane', 3, 'hard_leather', 8, 'steel_bar', 4], 15, 8]
];
SADDLES.forEach(function (s) {
  I('saddle_' + s[0], { name: 'Silla de ' + s[1], cat: 'saddle', value: s[2], stack: 1,
    saddle: { for: s[0] }, desc: 'Úsala sobre un adulto tameado para poder montarlo.' });
  const ing = [];
  for (let i = 0; i < s[3].length; i += 2) ing.push({ id: s[3][i], n: s[3][i + 1] });
  R('saddle_' + s[0], 1, ing, 'workbench',
    { req: { lv: s[4], skill: { beast: s[5], artisan: Math.min(6, s[5]) } }, xp: 18, saber: CR2 });
});

/* ==========================================================
13 · PESCADOS
========================================================== */
[['fish_sardine', 'Sardina', 5, 'small'], ['fish_trout', 'Trucha', 9, 'medium'],
 ['fish_catfish', 'Bagre', 12, 'medium'], ['fish_ice', 'Trucha ártica', 14, 'medium'],
 ['fish_dune', 'Pez de las dunas', 16, 'medium'], ['fish_void', 'Pez del vacío', 30, 'large'],
 ['fish_ember', 'Pez de brasa', 34, 'medium'], ['fish_mirror', 'Pez espejo', 44, 'large']]
.forEach(function (f) {
  I(f[0], { name: f[1], cat: 'fish', value: f[2], tags: ['fish'],
    food: N(f[3], 'raw', f[2] > 25 ? 'rare' : 'common', { hp: -2, st: 2 }),
    desc: 'Crudo. Cocínalo en una fogata o ahúmalo en la cocina.' });
});

/* ==========================================================
14 · CULTIVOS Y SEMILLAS (24) — semillas siempre a mano
========================================================== */
const CROP_TAGS = {
  wheat: 'grain', rice: 'grain', quinoa: 'grain', corn: 'grain', sunflower: 'grain',
  carrot: 'vegetable', potato: 'vegetable', onion: 'vegetable', lettuce: 'vegetable',
  garlic: 'vegetable', cabbage: 'vegetable', sweetpotato: 'vegetable', beet: 'vegetable',
  pumpkin: 'vegetable', bean: 'vegetable', maca: 'vegetable',
  tomato: 'fruit', pepper: 'fruit', strawberry: 'fruit', grape: 'fruit', melon: 'fruit',
  cotton: null, flax: null, herb: 'herbany'
};
Object.keys(D.CROPS).forEach(function (id) {
  const cd = D.CROPS[id], tag = CROP_TAGS[id];
  const big = ['pumpkin', 'melon', 'sunflower'].indexOf(id) >= 0;
  const d = { name: cd.name, cat: 'crop', value: cd.value, desc: 'Cosecha. Calidad de una a tres estrellas.' };
  if (tag) { d.tags = [tag]; d.food = N(big ? 'medium' : 'small', 'raw', cd.value > 13 ? 'uncommon' : 'common', { st: 3 }); }
  if (id === 'cotton') d.desc = 'Fibra textil. Se hila en el banco.';
  if (id === 'flax') d.desc = 'Lino y aceite. Se prensa en la cocina.';
  I(cd.product, d);
  I(cd.seed, { name: 'Semillas de ' + cd.name.toLowerCase(), cat: 'seed', value: Math.ceil(cd.value / 2),
    seed: { crop: id }, desc: 'Siembra en tierra arada.' });
  R(cd.seed, 2, [{ id: cd.product, n: 1 }], 'hand', { req: null, xp: 3 });
});
R('herb', 1, [{ id: 'crop_herb', n: 2 }], 'hand', { req: null, xp: 3 });

/* ==========================================================
15 · ALIMENTOS
========================================================== */
function food(id, name, value, size, prep, rarity, extra, desc, station, ing, req, n, saber) {
  const nut = N(size, prep, rarity, extra);
  I(id, { name: name, cat: 'food', value: value, food: nut,
    desc: (desc || '') + ' Saciedad ' + nut.food + ' · Salud ' + nut.hp + ' · Energía ' + nut.st + '.' });
  if (station && ing) R(id, n || 1, ing, station, { req: req || null, skill: 'cooking', xp: B.XP_COOK, saber: saber || null });
  return nut;
}
/* Crudos */
food('berry', 'Bayas', 2, 'tiny', 'raw', 'common', { st: 2 }, 'Del arbusto.');
food('apple', 'Manzana', 4, 'small', 'raw', 'common', { st: 4 }, 'Del manzano.');
food('mushroom', 'Setas', 3, 'tiny', 'raw', 'common', { hp: -1 }, 'Mejor cocinadas.');
food('egg', 'Huevo', 5, 'tiny', 'raw', 'common', { hp: -1 }, 'Crudo sabe peor.');
food('milk', 'Leche', 8, 'small', 'simple', 'common', { st: 6, hp: 4 }, 'Fresca del establo.');
food('raw_meat', 'Carne cruda', 6, 'medium', 'raw', 'common', { hp: -3 }, 'Cocínala o sécala al sol.');
food('raw_poultry', 'Carne de ave cruda', 5, 'small', 'raw', 'common', { hp: -3 }, 'Gallina o pato.');
food('raw_game', 'Carne de caza cruda', 9, 'medium', 'raw', 'uncommon', { hp: -2 }, 'Ciervo, jabalí o bisonte.');
food('truffle', 'Trufa', 30, 'tiny', 'raw', 'exotic', { st: 10, hp: 6 }, 'Producto del cerdo. Muy cotizada.');

/* Fogata: lo esencial GRATIS (supervivencia), lo elaborado con saber Cocina */
food('cooked_meat', 'Carne asada', 16, 'medium', 'cooked', 'common', { hp: 12 }, 'Al fuego directo.',
  'campfire', [{ id: 'raw_meat', n: 1 }], null);
food('cooked_poultry', 'Ave asada', 14, 'small', 'cooked', 'common', { hp: 9 }, 'Crujiente por fuera.',
  'campfire', [{ id: 'raw_poultry', n: 1 }], null);
food('cooked_game', 'Caza asada', 24, 'large', 'cooked', 'uncommon', { hp: 16, st: 12 }, 'Contundente.',
  'campfire', [{ id: 'raw_game', n: 1 }], null);
food('cooked_fish', 'Pescado asado', 10, 'small', 'cooked', 'common', { st: 12 }, 'Con piel crujiente.',
  'campfire', [{ tag: 'fish', n: 1 }], null);
food('boiled_egg', 'Huevo cocido', 7, 'tiny', 'simple', 'common', { st: 7 }, 'Para el camino.',
  'campfire', [{ id: 'egg', n: 2 }], null);
food('porridge', 'Gachas', 12, 'medium', 'simple', 'common', { st: 10 }, 'Grano hervido. Sacia de verdad.',
  'campfire', [{ tag: 'grain', n: 2 }], null);
food('herb_tea', 'Infusión de hierbas', 12, 'small', 'simple', 'common', { foodMul: 0.3, st: 20, hp: 12, cure: 'poison' },
  'Calma el estómago y limpia la sangre.', 'campfire', [{ tag: 'herbany', n: 2 }], null);
food('fried_egg', 'Huevo frito', 9, 'small', 'cooked', 'common', { st: 9 }, 'Rápido y honesto.',
  'campfire', [{ id: 'egg', n: 1 }, { id: 'oil', n: 1 }], { lv: 3 }, 1, CK);
food('flatbread', 'Torta de ceniza', 8, 'small', 'simple', 'common', { st: 8 }, 'Harina y agua sobre la piedra.',
  'campfire', [{ id: 'flour', n: 1 }], { lv: 4 }, 1, CK);
food('dried_meat', 'Cecina', 18, 'small', 'simple', 'common', { st: 14, foodMul: 1.1 }, 'Dura semanas. Ideal para viajar.',
  'campfire', [{ id: 'raw_meat', n: 2 }, { id: 'salt', n: 1 }], { lv: 5 }, 3, CK);

/* Cocina */
food('bread', 'Pan', 14, 'medium', 'cooked', 'common', { st: 12 }, 'La base de toda mesa.',
  'kitchen', [{ id: 'flour', n: 2 }], { lv: 3, skill: { artisan: 1 } }, 2, CK);
food('corn_bread', 'Pan de maíz', 16, 'medium', 'cooked', 'common', { st: 14 }, 'Dulce y denso.',
  'kitchen', [{ id: 'flour', n: 1 }, { id: 'crop_corn', n: 2 }], { lv: 5, skill: { artisan: 1 } }, 2, CK);
food('cheese', 'Queso', 18, 'small', 'refined', 'common', { hp: 8, st: 10 }, 'Cuajado y prensado.',
  'kitchen', [{ id: 'milk', n: 2 }, { id: 'salt', n: 1 }], { lv: 5, skill: { artisan: 2 } }, 1, CK);
food('butter', 'Mantequilla', 12, 'tiny', 'refined', 'common', { st: 12 }, 'Batida hasta separar.',
  'kitchen', [{ id: 'milk', n: 2 }], { lv: 4, skill: { artisan: 1 } }, 1, CK);
food('salad', 'Ensalada fresca', 14, 'small', 'simple', 'common', { hp: 10, st: 8 }, 'Sin fuego. Solo cortar.',
  'kitchen', [{ id: 'crop_lettuce', n: 2 }, { id: 'crop_tomato', n: 1 }, { id: 'oil', n: 1 }], { lv: 4, skill: { artisan: 1 } }, 1, CK);
food('rice_bowl', 'Cuenco de arroz', 20, 'medium', 'cooked', 'common', { st: 16, hp: 6 }, 'Con verduras salteadas.',
  'kitchen', [{ id: 'crop_rice', n: 2 }, { tag: 'vegetable', n: 1 }, { id: 'oil', n: 1 }], { lv: 6, skill: { artisan: 2 } }, 1, CK);
food('vegetable_soup', 'Sopa de hortalizas', 22, 'medium', 'cooked', 'common', { hp: 14, st: 12 }, 'Reconforta con lluvia.',
  'kitchen', [{ tag: 'vegetable', n: 3 }, { id: 'salt', n: 1 }], { lv: 5, skill: { artisan: 1 } }, 1, CK);
food('bean_stew', 'Potaje de judías', 26, 'large', 'cooked', 'common', { hp: 16, st: 18 }, 'Espeso y barato.',
  'kitchen', [{ id: 'crop_bean', n: 3 }, { id: 'crop_onion', n: 1 }, { id: 'salt', n: 1 }], { lv: 6, skill: { artisan: 2 } }, 1, CK);
food('stew', 'Guiso del campesino', 26, 'large', 'cooked', 'common', { hp: 18, st: 16 }, 'Carne, patata y zanahoria.',
  'kitchen', [{ id: 'raw_meat', n: 1 }, { id: 'crop_potato', n: 1 }, { id: 'crop_carrot', n: 1 }], { lv: 5, skill: { artisan: 1 } }, 1, CK);
food('grilled_fish', 'Pescado a la brasa', 18, 'medium', 'cooked', 'uncommon', { st: 15, hp: 10 }, 'Con hierbas y aceite.',
  'kitchen', [{ tag: 'fish', n: 1 }, { id: 'oil', n: 1 }, { tag: 'herbany', n: 1 }], { lv: 5, skill: { artisan: 1 } }, 1, CK);
food('smoked_fish', 'Pescado ahumado', 22, 'medium', 'refined', 'uncommon', { st: 16, hp: 8 }, 'Ahumado lento sobre leña verde.',
  'kitchen', [{ tag: 'fish', n: 2 }, { id: 'salt', n: 1 }, { id: 'wood', n: 1 }], { lv: 6, skill: { artisan: 2 } }, 2, CK);
food('sausage', 'Salchicha curada', 28, 'small', 'refined', 'uncommon', { st: 20, foodMul: 1.15 }, 'Tripa, carne y sal.',
  'kitchen', [{ id: 'raw_meat', n: 2 }, { id: 'salt', n: 1 }, { id: 'crop_garlic', n: 1 }], { lv: 7, skill: { artisan: 3 } }, 3, CK);
food('pie', 'Tarta de manzana', 34, 'large', 'refined', 'uncommon', { hp: 22, st: 24 }, 'La favorita de Lía.',
  'kitchen', [{ id: 'apple', n: 2 }, { id: 'flour', n: 2 }, { id: 'butter', n: 1 }], { lv: 7, skill: { artisan: 3 } }, 1, CK);
food('jam', 'Mermelada', 20, 'tiny', 'refined', 'uncommon', { st: 18, hp: 6 }, 'Fruta y miel reducidas.',
  'kitchen', [{ tag: 'fruit', n: 3 }, { id: 'honey', n: 1 }], { lv: 6, skill: { artisan: 2 } }, 2, CK);
food('pumpkin_soup', 'Crema de calabaza', 30, 'large', 'refined', 'uncommon', { hp: 20, st: 16 }, 'Terciopelo naranja.',
  'kitchen', [{ id: 'crop_pumpkin', n: 2 }, { id: 'milk', n: 1 }, { id: 'butter', n: 1 }], { lv: 8, skill: { artisan: 3 } }, 1, CK);
food('traveler_ration', 'Ración de viaje', 30, 'small', 'refined', 'uncommon', { st: 24, foodMul: 1.2 }, 'Cecina, pan y queso prensados.',
  'kitchen', [{ id: 'dried_meat', n: 2 }, { id: 'bread', n: 1 }, { id: 'cheese', n: 1 }], { lv: 8, skill: { artisan: 3 } }, 3, CK);
food('hearty_stew', 'Guiso del cazador', 48, 'feast', 'refined', 'rare', { hp: 34, st: 30, buff: 'vigor', buffT: 240 },
  'Un día entero de camino en un cuenco.',
  'kitchen', [{ id: 'raw_game', n: 2 }, { tag: 'vegetable', n: 2 }, { id: 'crop_garlic', n: 1 }, { id: 'oil', n: 1 }],
  { lv: 10, skill: { artisan: 4 } }, 1, CK);
food('fruit_pie', 'Tarta de frutos rojos', 42, 'large', 'refined', 'rare', { hp: 26, st: 28, buff: 'luck', buffT: 240 },
  'Fresa, uva y miel bajo una rejilla.',
  'kitchen', [{ id: 'crop_strawberry', n: 2 }, { id: 'crop_grape', n: 1 }, { id: 'flour', n: 2 }, { id: 'honey', n: 1 }],
  { lv: 10, skill: { artisan: 4 } }, 1, CK);
food('roast', 'Asado de caza', 52, 'feast', 'refined', 'rare', { hp: 38, st: 26, buff: 'might', buffT: 240 },
  'La pieza entera, dorada y lenta.',
  'kitchen', [{ id: 'raw_game', n: 3 }, { id: 'salt', n: 1 }, { tag: 'herbany', n: 2 }, { id: 'oil', n: 1 }],
  { lv: 11, skill: { artisan: 4 } }, 1, CK);
food('maca_porridge', 'Gachas de maca', 38, 'medium', 'refined', 'rare', { st: 40, hp: 14, buff: 'endurance', buffT: 300 },
  'Los pastores del altiplano la llaman aliento.',
  'kitchen', [{ id: 'crop_maca', n: 2 }, { id: 'milk', n: 1 }, { id: 'honey', n: 1 }], { lv: 11, skill: { artisan: 4 } }, 1, CK);
food('honey_cake', 'Pastel de miel', 46, 'large', 'master', 'rare', { hp: 30, st: 34, buff: 'regen', buffT: 300 },
  'El postre de las bodas de Vhalor.',
  'kitchen', [{ id: 'flour', n: 3 }, { id: 'honey', n: 2 }, { id: 'egg', n: 2 }, { id: 'butter', n: 1 }],
  { lv: 12, skill: { artisan: 5 } }, 1, CK);
/* Bebidas */
food('ale', 'Cerveza de cebada', 16, 'small', 'refined', 'common', { foodMul: 0.4, st: 28, hp: 4 }, 'Espumosa y honesta.',
  'kitchen', [{ tag: 'grain', n: 3 }, { id: 'honey', n: 1 }], { lv: 6, skill: { artisan: 2 } }, 1, CK);
food('mead', 'Hidromiel', 20, 'small', 'refined', 'uncommon', { foodMul: 0.4, st: 34, hp: 6, buff: 'might', buffT: 180 },
  'Fermentada en barril. Coraje líquido.',
  'kitchen', [{ id: 'honey', n: 1 }, { tag: 'grain', n: 2 }], { lv: 7, skill: { artisan: 3 } }, 1, CK);
food('cider', 'Sidra de manzana', 22, 'small', 'refined', 'uncommon', { foodMul: 0.4, st: 30, hp: 8 }, 'Prensada y dejada trabajar.',
  'kitchen', [{ id: 'apple', n: 4 }, { id: 'honey', n: 1 }], { lv: 7, skill: { artisan: 3 } }, 1, CK);
food('wine', 'Vino de la casa', 40, 'small', 'master', 'rare', { foodMul: 0.4, st: 36, hp: 12, buff: 'luck', buffT: 240 },
  'Uva del sur. Se sirve en las bodas.',
  'kitchen', [{ id: 'crop_grape', n: 4 }, { id: 'honey', n: 1 }], { lv: 11, skill: { artisan: 4 } }, 1, CK);
/* TIER 3 · maestría culinaria */
food('truffle_risotto', 'Risotto de trufa', 90, 'feast', 'master', 'exotic', { hp: 44, st: 40, buff: 'focus', buffT: 300 },
  'El plato más caro que se cocina en Vhalor.',
  'kitchen', [{ id: 'truffle', n: 2 }, { id: 'crop_rice', n: 3 }, { id: 'cheese', n: 1 }, { id: 'butter', n: 1 }],
  { lv: 31, skill: { artisan: 8 } }, 1, MA);
food('feast', 'Banquete de Vhalor', 160, 'feast', 'master', 'exotic', { hp: 70, st: 60, foodMul: 1.3, buff: 'all', buffT: 420 },
  'Para compartir con toda tu household.',
  'kitchen', [{ id: 'roast', n: 1 }, { id: 'hearty_stew', n: 1 }, { id: 'honey_cake', n: 1 }, { id: 'cheese', n: 1 }],
  { lv: 33, skill: { artisan: 9 } }, 1, MA);

/* ==========================================================
16 · CURAS
========================================================== */
function heal(id, name, value, cat, effect, desc, station, ing, req, n, saber) {
  I(id, { name: name, cat: cat, value: value, heal: effect, food: effect.instant ? effect.instant : null, desc: desc });
  if (station) R(id, n || 1, ing, station, { req: req || null, skill: 'crafting', xp: 12, saber: saber || null });
}
heal('bandage_simple', 'Venda simple', 10, 'heal', { hp: 8, stopBleed: true, cast: 1.4 },
  'Detiene el sangrado y cierra 8 de vida. Se aplica en 1,4 s.',
  'hand', [{ id: 'fiber', n: 2 }], null, 2, null);
heal('bandage_clean', 'Venda limpia', 26, 'heal', { hp: 22, stopBleed: true, cast: 1.1 },
  'Lino hervido. Cierra 22 de vida sin infectar.',
  'workbench', [{ id: 'linen', n: 1 }, { id: 'salt', n: 1 }], { lv: 6, skill: { artisan: 2 } }, 2, CR2);
heal('splint', 'Férula', 30, 'heal', { cure: 'slow', st: 30, cast: 1.6 },
  'Entablilla una pierna: quita la ralentización y devuelve energía.',
  'workbench', [{ id: 'wood', n: 2 }, { id: 'cloth', n: 1 }], { lv: 5 }, 1, CR2);
/* Alambique de entrada (nivel 8–10): sin saber, para que la estación sirva al llegar */
heal('potion_heal_s', 'Poción menor de salud', 30, 'potion', { instant: { food: 0, hp: 40 } },
  'Restaura 40 de salud al instante.',
  'alchemy', [{ tag: 'herbany', n: 2 }, { id: 'berry', n: 2 }], { lv: 8, skill: { artisan: 3 } }, 1, null);
heal('potion_stamina_s', 'Poción de vigor', 28, 'potion', { instant: { food: 0, st: 50 } },
  'Restaura 50 de stamina.',
  'alchemy', [{ tag: 'herbany', n: 1 }, { id: 'honey', n: 1 }], { lv: 8, skill: { artisan: 3 } }, 1, null);
heal('salve_burn', 'Ungüento para quemaduras', 34, 'heal', { cure: 'burn', hp: 18, cast: 0.9 },
  'Apaga el fuego en la carne y alivia 18.',
  'alchemy', [{ id: 'oil', n: 1 }, { id: 'beeswax', n: 1 }, { id: 'herb_blue', n: 1 }], { lv: 9, skill: { artisan: 3 } }, 2, null);
heal('antidote', 'Antídoto', 32, 'heal', { cure: 'poison', hp: 12, cast: 0.8 },
  'Neutraliza el veneno de hidra, escorpión y basilisco.',
  'alchemy', [{ id: 'herb_blue', n: 2 }, { id: 'venom_sac', n: 1 }], { lv: 9, skill: { artisan: 3 } }, 2, null);
heal('bandage_herb', 'Venda con hierbas', 48, 'heal', { hp: 34, stopBleed: true, regen: 1.2, regenT: 20, cast: 1.0 },
  'Cierra 34 y regenera durante 20 s.',
  'alchemy', [{ id: 'linen', n: 1 }, { tag: 'herbany', n: 2 }, { id: 'honey', n: 1 }], { lv: 10, skill: { artisan: 4 } }, 2, null);
/* Alquimia avanzada (nivel 11+): saber Alquimia */
heal('potion_heal_m', 'Poción de salud', 70, 'potion', { instant: { food: 0, hp: 90 } }, 'Restaura 90 de salud.',
  'alchemy', [{ tag: 'herbany', n: 3 }, { id: 'honey', n: 1 }, { id: 'crystal', n: 1 }], { lv: 11, skill: { artisan: 4 } }, 1, AL);
heal('potion_fire_res', 'Bálsamo ígneo', 80, 'potion', { instant: { food: 0 }, buff: 'fireRes', buffT: 300, cure: 'burn' },
  'Reduce el daño de fuego un 60 % durante 5 min.',
  'alchemy', [{ id: 'herb_fire', n: 2 }, { id: 'ember_core', n: 1 }, { id: 'oil', n: 1 }], { lv: 12, skill: { artisan: 4 } }, 1, AL);
heal('potion_ice_res', 'Bálsamo de escarcha', 80, 'potion', { instant: { food: 0 }, buff: 'iceRes', buffT: 300, cure: 'slow' },
  'Reduce el daño de hielo y evita la ralentización.',
  'alchemy', [{ id: 'ice_shard', n: 3 }, { id: 'frost_core', n: 1 }, { id: 'oil', n: 1 }], { lv: 12, skill: { artisan: 4 } }, 1, AL);
heal('maca_tonic', 'Tónico de maca', 34, 'food', { instant: { food: 8, st: 46, hp: 10 }, buff: 'endurance', buffT: 240 },
  'Amargo. Despierta hasta a un jotun.',
  'alchemy', [{ id: 'crop_maca', n: 2 }, { id: 'honey', n: 1 }, { id: 'herb_fire', n: 1 }], { lv: 12, skill: { artisan: 5 } }, 1, AL);
heal('potion_stamina_l', 'Elixir de aguante', 90, 'potion', { instant: { food: 0, st: 130 }, buff: 'endurance', buffT: 240 },
  'Stamina plena y regeneración acelerada 4 min.',
  'alchemy', [{ id: 'crop_maca', n: 2 }, { id: 'honey', n: 2 }, { id: 'wisp_essence', n: 1 }], { lv: 13, skill: { artisan: 5 } }, 1, AL);
heal('potion_heal_l', 'Poción mayor de salud', 160, 'potion', { instant: { food: 0, hp: 180 }, regen: 2, regenT: 15 },
  'Restaura 180 y regenera 15 s.',
  'alchemy', [{ id: 'herb_blue', n: 3 }, { id: 'honey', n: 2 }, { id: 'unicorn_hair', n: 1 }], { lv: 15, skill: { artisan: 6 } }, 1, AL);
heal('elixir_regen', 'Elixir de regeneración', 190, 'potion', { instant: { food: 0, hp: 40 }, regen: 3.2, regenT: 60 },
  'Regenera 3,2 de vida por segundo durante un minuto.',
  'alchemy', [{ id: 'phoenix_feather', n: 1 }, { id: 'herb_blue', n: 3 }, { id: 'honey', n: 2 }], { lv: 17, skill: { artisan: 7 } }, 1, AL);
heal('holy_water', 'Agua bendita', 15, 'potion', { instant: { food: 0, hp: 20, cure: 'poison' } },
  'Bendecida por Maera. Cura el veneno.', null, null, null);

/* ==========================================================
17 · CAMAS · el petate se hace A MANO para poder dormir pronto
========================================================== */
I('bed_roll', { name: 'Petate enrollado', cat: 'bed', value: 30, stack: 1,
  bed: { tier: 0, heal: B.SLEEP_OUTDOOR_HEAL, ambush: B.SLEEP_OUTDOOR_AMBUSH, portable: true },
  desc: 'Duerme donde estés. A la intemperie hay riesgo de emboscada. Se hace a mano.' });
R('bed_roll', 1, [{ id: 'straw', n: 4 }, { id: 'fiber', n: 2 }, { id: 'rope', n: 1 }], 'hand', { req: null, xp: 10 });
I('bed_straw', { name: 'Cama de paja', cat: 'bed', value: 70, stack: 1,
  bed: { tier: 1, heal: 0.85, ambush: 0.06 }, desc: 'Para tu primera casa. Descanso decente.' });
R('bed_straw', 1, [{ id: 'wood', n: 4 }, { id: 'straw', n: 6 }, { id: 'cloth', n: 2 }], 'workbench',
  { req: { lv: 3, skill: { artisan: 1 } }, xp: 12, saber: CR2 });
I('bed_wood', { name: 'Cama de madera', cat: 'bed', value: 180, stack: 1,
  bed: { tier: 2, heal: 1.0, ambush: 0 }, desc: 'Dos plazas. Necesaria para casarte.' });
R('bed_wood', 1, [{ id: 'wood', n: 8 }, { id: 'cloth', n: 4 }, { id: 'rope', n: 2 }], 'workbench',
  { req: { lv: 6, skill: { artisan: 2 } }, xp: 16, saber: CR2 });
I('bed_feather', { name: 'Cama de plumas', cat: 'bed', value: 420, stack: 1,
  bed: { tier: 3, heal: 1.0, ambush: 0, bonusSt: 20 }, desc: 'Despiertas con energía extra.' });
R('bed_feather', 1, [{ id: 'wood', n: 8 }, { id: 'feather', n: 12 }, { id: 'linen', n: 4 }], 'workbench',
  { req: { lv: 10, skill: { artisan: 4 } }, xp: 22, saber: CR2 });
I('bed_noble', { name: 'Lecho noble', cat: 'bed', value: 1100, stack: 1,
  bed: { tier: 4, heal: 1.0, ambush: 0, bonusSt: 40, bonusHp: 30 },
  desc: 'Dosel de seda. Despiertas curado y con vigor de sobra.' });
R('bed_noble', 1, [{ id: 'wood', n: 10 }, { id: 'silk', n: 6 }, { id: 'pegasus_feather', n: 4 }, { id: 'gold_bar', n: 2 }],
  'workbench', { req: { lv: 31, skill: { artisan: 8 } }, xp: 34, saber: MA });

/* ==========================================================
18 · FERTILIZANTES, PIENSOS Y VARIOS
========================================================== */
I('fert_manure', { name: 'Estiércol', cat: 'fert', value: 3, fert: { growth: 1.2, q: [85, 15, 0, 0] }, desc: 'Fertilizante básico.' });
R('fert_manure', 1, [{ id: 'manure', n: 1 }], 'hand', { req: null, xp: 3 });
I('fert_compost', { name: 'Compost', cat: 'fert', value: 8, fert: { growth: 1.4, q: [50, 40, 10, 0] }, desc: 'Materia orgánica descompuesta.' });
R('fert_compost', 1, [{ id: 'manure', n: 2 }, { id: 'fiber', n: 2 }, { id: 'hay', n: 1 }], 'workbench',
  { req: { lv: 4 }, xp: 8, saber: FD });
I('fert_bonemeal', { name: 'Harina de hueso', cat: 'fert', value: 14, fert: { growth: 1.5, q: [35, 45, 20, 0] }, desc: 'Fósforo puro para raíces fuertes.' });
R('fert_bonemeal', 2, [{ id: 'bone', n: 3 }], 'kitchen', { req: { lv: 5, skill: { artisan: 2 } }, xp: 9, saber: FD });
I('fert_golden', { name: 'Fertilizante dorado', cat: 'fert', value: 40, fert: { growth: 1.7, q: [10, 40, 40, 10] },
  desc: 'Cristal molido y estiércol. Cosechas de tres estrellas.' });
R('fert_golden', 1, [{ id: 'manure', n: 2 }, { id: 'crystal', n: 1 }, { tag: 'herbany', n: 2 }], 'alchemy',
  { req: { lv: 11, skill: { artisan: 4 } }, fuel: 1, xp: 18, saber: AL });
I('feed_basic', { name: 'Pienso básico', cat: 'feed', value: 4, feed: { q: [80, 20, 0, 0] }, desc: 'Heno prensado.' });
R('feed_basic', 2, [{ id: 'hay', n: 2 }], 'hand', { req: null, xp: 3 });
I('feed_good', { name: 'Pienso bueno', cat: 'feed', value: 9, feed: { q: [40, 45, 15, 0] }, desc: 'Grano y hortaliza.' });
R('feed_good', 2, [{ id: 'hay', n: 2 }, { tag: 'grain', n: 2 }], 'kitchen', { req: { lv: 5 }, xp: 8, saber: FD });
I('feed_herb', { name: 'Pienso medicinal', cat: 'feed', value: 20, feed: { q: [30, 45, 25, 0], heal: 30 },
  desc: 'Cura a tu ganado y mejora su producto.' });
R('feed_herb', 2, [{ id: 'hay', n: 2 }, { tag: 'herbany', n: 2 }], 'kitchen',
  { req: { lv: 7, skill: { beast: 2 } }, xp: 12, saber: FD });
I('feed_golden', { name: 'Pienso dorado', cat: 'feed', value: 24, feed: { q: [10, 40, 40, 10] },
  desc: 'Calabaza, miel y maca. Productos de tres estrellas.' });
R('feed_golden', 2, [{ id: 'hay', n: 2 }, { id: 'crop_pumpkin', n: 1 }, { id: 'honey', n: 1 }], 'kitchen',
  { req: { lv: 9, skill: { artisan: 3 } }, fuel: 1, xp: 14, saber: FD });
I('bait', { name: 'Cebo', cat: 'misc', value: 2, desc: 'Amplía la ventana de pesca.' });
R('bait', 3, [{ id: 'fiber', n: 1 }, { id: 'berry', n: 1 }], 'hand', { req: null, xp: 3 });
I('fishing_net', { name: 'Red de pesca', cat: 'misc', value: 90, desc: 'Captura 2–3 peces de una vez.' });
R('fishing_net', 1, [{ id: 'thread', n: 6 }, { id: 'rope', n: 2 }], 'workbench',
  { req: { lv: 7, skill: { artisan: 2 } }, xp: 14, saber: CR2 });
I('dart_narcotic', { name: 'Dardo narcótico', cat: 'misc', value: 18,
  desc: 'Duerme a una criatura debilitada para poder alimentarla y tamearla.' });
R('dart_narcotic', 3, [{ tag: 'herbany', n: 3 }, { id: 'bone', n: 1 }, { id: 'thread', n: 1 }], 'alchemy',
  { req: { lv: 8, skill: { beast: 5, artisan: 3 } }, fuel: 1, xp: 14 });
I('dart_poison', { name: 'Dardo venenoso', cat: 'misc', value: 22, desc: 'Envenena a distancia sin gastar flechas.' });
R('dart_poison', 3, [{ id: 'venom_sac', n: 1 }, { id: 'bone', n: 2 }], 'alchemy',
  { req: { lv: 9, skill: { artisan: 3 } }, fuel: 1, xp: 14 });
I('lockpick', { name: 'Ganzúa', cat: 'misc', value: 40, desc: 'Abre cofres ajenos. Que no te vean.' });
R('lockpick', 1, [{ id: 'iron_bar', n: 1 }, { id: 'flint', n: 1 }], 'workbench', { req: { lv: 6 }, xp: 10, saber: CR2 });
I('land_deed', { name: 'Escritura de tierras', cat: 'misc', value: B.LAND_DEED_COST,
  desc: 'Documento del Mercader Supremo. Necesario para comprar una parcela.' });
R('land_deed', 1, [{ id: 'linen', n: 1 }, { id: 'gold_bar', n: 1 }], 'workbench',
  { req: { lv: 5, skill: { artisan: 2 } }, xp: 12, saber: CR2 });
/* Cofres colocables desde la mochila */
I('chest_kit', { name: 'Cofre desmontado', cat: 'misc', value: 60, stack: 1, place: 'chest',
  desc: 'Colócalo en tu parcela: 20 espacios de almacén.' });
R('chest_kit', 1, [{ id: 'wood', n: 10 }, { id: 'iron_bar', n: 1 }], 'workbench', { req: { lv: 3 }, xp: 10, saber: CR2 });
I('chest_large', { name: 'Arcón herrado', cat: 'misc', value: 260, stack: 1, place: 'chest_large',
  desc: 'Colócalo en tu parcela: 48 espacios de almacén.' });
R('chest_large', 1, [{ id: 'wood', n: 20 }, { id: 'iron_bar', n: 4 }, { id: 'hard_leather', n: 2 }], 'workbench',
  { req: { lv: 6, skill: { artisan: 2 } }, xp: 16, saber: CR2 });

/* ==========================================================
19 · ACCESORIOS · Tier 2 (saber) y Tier 3 (maestría)
========================================================== */
const ACCS = [
  ['ring_gold', 'Anillo de oro', 'ring', 150, {}, 'Necesario para pedir matrimonio (×2).', 'forge', ['gold_bar', 1, 'iron_bar', 1], 6, 2, SM],
  ['belt_leather', 'Cinturón de cuero', 'belt', 90, { st: 15 }, '+15 de stamina máxima.', 'workbench', ['hard_leather', 3, 'iron_bar', 1], 6, 2, CR2],
  ['gloves_grip', 'Guantes de agarre', 'charm', 520, { draw: -0.15, melee: 0.06 }, 'Tensa un 15 % más rápido y +6 % de daño.', 'workbench', ['hard_leather', 3, 'manticore_spine', 1, 'thread', 3], 10, 4, CR2],
  ['charm_luck', 'Talismán de Fortuna', 'charm', 700, { luck: 0.10 }, '+10 % de botín raro.', 'alchemy', ['crystal', 3, 'gold_bar', 1, 'wisp_essence', 2], 11, 4, AL],
  ['ring_silver', 'Anillo de mithril', 'ring', 420, { crit: 0.06 }, '+6 % de crítico.', 'forge', ['mithril_bar', 1, 'crystal', 1], 12, 4, SM],
  ['charm_beast', 'Talismán de Afinidad', 'charm', 820, { tame: 0.2, petDmg: 0.15 }, 'Tameo un 20 % más rápido y compañeros más fuertes.', 'alchemy', ['unicorn_hair', 1, 'kirin_horn', 1, 'herb_blue', 3], 13, 6, AL],
  ['belt_troll', 'Cinturón del Troll', 'belt', 1500, { hp: 40, def: 4 }, '+40 de salud y +4 de defensa.', 'forge', ['troll_heart', 1, 'hard_leather', 4, 'steel_bar', 2], 31, 8, MA],
  ['amulet_frost', 'Amuleto de Escarcha', 'amulet', 1800, { iceRes: 0.5, def: 6 }, 'Mitad de daño de hielo y +6 de defensa.', 'forge', ['jotun_ice', 1, 'frost_core', 2, 'mithril_bar', 2], 31, 8, MA],
  ['boots_swift', 'Botas del viento', 'charm', 900, { speed: 0.12, rollCd: -0.2 }, '+12 % velocidad y esquiva más corta.', 'workbench', ['pegasus_feather', 2, 'hard_leather', 4, 'silk', 2], 31, 8, MA],
  ['cloak_shadow', 'Capa de sombra', 'charm', 1400, { stealth: 0.35, speed: 0.05 }, 'Los enemigos te detectan un 35 % más tarde.', 'workbench', ['fenrir_pelt', 1, 'silk', 4, 'crystal', 2], 33, 9, MA],
  ['amulet_regen', 'Amuleto del Fénix', 'amulet', 2600, { regen: 0.34 }, 'Regenera 1 de vida cada 3 s.', 'forge', ['phoenix_feather', 1, 'ember_core', 3, 'gold_bar', 1], 32, 9, MA]
];
ACCS.forEach(function (a) {
  I(a[0], { name: a[1], cat: a[3] >= 1500 ? 'legendary' : 'acc', value: a[3], stack: a[0] === 'ring_gold' ? 5 : 1,
    acc: Object.assign({ slot: a[2] }, a[4]), desc: a[5] });
  const ing = [];
  for (let i = 0; i < a[7].length; i += 2) ing.push({ id: a[7][i], n: a[7][i + 1] });
  R(a[0], 1, ing, a[6], { req: { lv: a[8], skill: { artisan: a[9] } }, fuel: 1, xp: 24, saber: a[10] });
});

/* ==========================================================
20 · LEGENDARIOS DE JEFE · TIER 3 (nivel 31+)
========================================================== */
I('venom_spear', { name: 'Lanza Venenosa', cat: 'legendary', value: 2200, stack: 1,
  weapon: { kind: 'spear', dmg: 34, dur: 500, reach: B.SPEAR_REACH, speed: 0.9, poison: 4 },
  repair: { steel_bar: 1, venom_sac: 1 }, desc: 'Daño 34 y veneno persistente.' });
R('venom_spear', 1, [{ id: 'hydra_fang', n: 1 }, { id: 'venom_sac', n: 3 }, { id: 'steel_bar', n: 3 }, { id: 'wood', n: 4 }],
  'forge', { req: { lv: 31, skill: { might: 7, artisan: 7 } }, fuel: 3, xp: 40, saber: MA });
I('jotun_shield', { name: 'Muro de Escarcha', cat: 'legendary', value: 3600, stack: 1,
  shield: { kind: 'tower', def: 26, dur: 620, reduce: 0.92, parry: 0.2, arc: 2.6, weight: 1.7, bash: 1.8, ward: true },
  repair: { adamantite_bar: 1, jotun_ice: 1 }, desc: 'Bloquea el 92 % y devuelve el frío a quien golpea.' });
R('jotun_shield', 1, [{ id: 'jotun_crown', n: 1 }, { id: 'jotun_ice', n: 2 }, { id: 'adamantite_bar', n: 3 }, { id: 'golem_core', n: 1 }],
  'forge', { req: { lv: 32, skill: { guard: 9, artisan: 8 } }, fuel: 3, xp: 55, saber: MA });
I('fenrir_bow', { name: 'Arco de Fenrir', cat: 'legendary', value: 3800, stack: 1,
  weapon: { kind: 'bow', dmg: 44, draw: 0.55, dur: 620, reach: B.AIM_MAX_RANGE + 3, speed: 1.2, ammo: 'arrow', pierce: 2 },
  repair: { mithril_bar: 1, silk: 1 }, desc: 'Tensa casi al instante y atraviesa dos enemigos.' });
R('fenrir_bow', 1, [{ id: 'fenrir_chain', n: 1 }, { id: 'fenrir_pelt', n: 1 }, { id: 'unicorn_hair', n: 2 }, { id: 'mithril_bar', n: 3 }],
  'workbench', { req: { lv: 33, skill: { marks: 9, artisan: 8 } }, xp: 55, saber: MA });
I('basilisk_gaze', { name: 'Mirada del Basilisco', cat: 'legendary', value: 3200, stack: 1,
  acc: { slot: 'amulet', slowAura: 0.35, def: 8 }, desc: 'Ralentiza un 35 % a quien te ataque de cerca.' });
R('basilisk_gaze', 1, [{ id: 'basilisk_crown', n: 1 }, { id: 'basilisk_eye', n: 2 }, { id: 'crystal', n: 3 }, { id: 'gold_bar', n: 2 }],
  'alchemy', { req: { lv: 31, skill: { artisan: 8 } }, fuel: 2, xp: 50, saber: MA });
I('dragonblade', { name: 'Filo de Dragón', cat: 'legendary', value: 4200, stack: 1,
  weapon: { kind: 'sword', dmg: 58, dur: 700, reach: B.REACH * 1.1, speed: 1.05, burn: 6, guardBreak: 0.8 },
  repair: { adamantite_bar: 1, dragon_scale: 1 }, desc: 'Daño 58, arde al cortar y rompe guardias.' });
R('dragonblade', 1, [{ id: 'dragon_heart', n: 1 }, { id: 'dragon_scale', n: 3 }, { id: 'adamantite_bar', n: 4 }, { id: 'obsidian_bar', n: 2 }],
  'forge', { req: { lv: 34, skill: { might: 9, artisan: 9 } }, fuel: 4, xp: 60, saber: MA });

/* ==========================================================
21 · TOKENS DE GANADO
========================================================== */
[['chicken', 'Gallina', 80], ['duck', 'Pato', 70], ['rabbit', 'Conejo', 60], ['sheep', 'Oveja', 160],
 ['pig', 'Cerdo', 140], ['nanny', 'Cabra lechera', 200], ['goat', 'Cabra montés', 150],
 ['cow', 'Vaca', 220], ['alpaca', 'Alpaca', 280], ['horse', 'Caballo', 350]]
.forEach(function (a) {
  I('animal_' + a[0], { name: a[1], cat: 'animal', value: a[2], stack: 1, animal: { species: a[0] },
    desc: 'Colócalo en un alojamiento con espacio (el caballo, cerca de ti).' });
});

/* ==========================================================
22 · RESUMEN POR TIER Y SABER
========================================================== */
const byTier = [0, 0, 0, 0], bySaber = Object.create(null);
let free = 0;
D.RECIPES.forEach(function (r) {
  byTier[r.tier] = (byTier[r.tier] || 0) + 1;
  if (r.saber) bySaber[r.saber] = (bySaber[r.saber] || 0) + 1; else free++;
});
const stations = Object.create(null);
D.RECIPES.forEach(function (r) { stations[r.station] = (stations[r.station] || 0) + 1; });
console.info('[CR] data-items.js v4 listo · ' + Object.keys(D.ITEMS).length + ' objetos · ' + D.RECIPES.length + ' recetas');
console.info('[CR] recetas por estación · ' + D.STATIONS.map(function (s) { return s + ':' + (stations[s] || 0); }).join(' · '));
console.info('[CR] recetas por tier · T1:' + (byTier[1] || 0) + ' T2:' + (byTier[2] || 0) + ' T3:' + (byTier[3] || 0) +
  ' · gratis a mano/estación: ' + free);
console.info('[CR] recetas por saber · ' + D.SABERS.map(function (s) { return s.name + ':' + (bySaber[s.id] || 0); }).join(' · '));
})();