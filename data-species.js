/* ============================================================
KANATO DE JOTUN · data-species.js — Bestiario v5 (parte 3 de 4)
CAMBIOS v5 (tameo):
· TODA criatura domable lleva su comida real + un SEÑUELO
  UNIVERSAL (feed_tame o meat_lure) al final de la lista: ya
  nunca te quedas sin la comida exacta en la mochila.
· Se elimina el bloqueo "solo crías": los adultos también se
  doman, con `babyBonus` (las crías piden la mitad de comidas).
· Requisitos suavizados: animales pequeños y domésticos se
  doman desde el minuto 1 (req null). Depredadores y míticos
  siguen pidiendo Afinidad.
· `tier` + `note` por especie: alimentan la GUÍA DE DOMA que
  aparece en Ajustes → Cómo jugar (D.TAME_GUIDE).
· Se añade tameo a especies que no lo tenían (rana, cocodrilo,
  escorpión, acechador, cangrejo, mantícora, ascua, fatuo, troll).
Ecología y combate intactos: dieta, facción, manada, santuario,
ráfagas con telegrafía y descanso, jefes por fases.
============================================================ */
(function () {
'use strict';
const CR = window.CR;
if (!CR || !CR.DEF) { console.error('[CR] data-species.js requiere data.js'); return; }
const DEF = CR.DEF, D = CR.DATA, B = D.BAL;
const sp = DEF.species;

/* ==========================================================
0 · VOCABULARIO DE ECOLOGÍA Y COMBATE
========================================================== */
D.DIETS = {
  herbivore:   { name: 'Herbívoro',   glyph: 'role_farm', flees: ['carnivore', 'omnivore'], lure: 'feed_tame' },
  carnivore:   { name: 'Carnívoro',   glyph: 'sword',     hunts: ['herbivore', 'insectivore'], lure: 'meat_lure' },
  omnivore:    { name: 'Omnívoro',    glyph: 'food',      hunts: ['herbivore', 'insectivore'], lure: 'meat_lure' },
  insectivore: { name: 'Insectívoro', glyph: 'poison',    flees: ['carnivore', 'omnivore'], lure: 'feed_tame' },
  scavenger:   { name: 'Carroñero',   glyph: 'material',  flees: ['carnivore'], lure: 'meat_lure' },
  arcane:      { name: 'Arcano',      glyph: 'star',      hunts: [], flees: [], lure: 'both' },
  none:        { name: 'Sin dieta',   glyph: 'role_idle', hunts: [], flees: [], lure: null }
};
D.FACTIONS = {
  prey:      { name: 'Presa',      hostileToPlayer: false, glyph: 'tame' },
  predator:  { name: 'Depredador', hostileToPlayer: true,  glyph: 'sword' },
  neutral:   { name: 'Neutral',    hostileToPlayer: false, glyph: 'info' },
  livestock: { name: 'Ganado',     hostileToPlayer: false, glyph: 'role_tend' },
  undead:    { name: 'No-muerto',  hostileToPlayer: true,  glyph: 'boss' },
  bandit:    { name: 'Bandidaje',  hostileToPlayer: true,  glyph: 'cross' },
  guard:     { name: 'Guardia',    hostileToPlayer: false, glyph: 'shield' },
  mythic:    { name: 'Mítico',     hostileToPlayer: true,  glyph: 'star' },
  guardian:  { name: 'Guardián',   hostileToPlayer: false, glyph: 'shield' }
};
/* Niveles de la guía de doma */
D.TAME_TIERS = [
  { id: 'domestic', name: 'Domésticos y pequeños', glyph: 'role_tend', order: 1,
    desc: 'Sin requisito de Afinidad. Acércate con comida y pulsa Interactuar dos o tres veces. Empieza por aquí.' },
  { id: 'docile', name: 'Salvajes dóciles', glyph: 'tame', order: 2,
    desc: 'Huyen si corres detrás. Camina despacio, acércate por el lado y ofrece comida. Afinidad 1 ayuda.' },
  { id: 'wild', name: 'Depredadores', glyph: 'sword', order: 3,
    desc: 'Hay que debilitarlos bajo el 60 % de vida y sedarlos con dardo narcótico o flecha somnífera. Luego alimentarlos mientras duermen.' },
  { id: 'mythic', name: 'Míticos', glyph: 'star', order: 4,
    desc: 'Solo nacen en su santuario. Sedación larga y comida de calidad. Afinidad alta obligatoria.' },
  { id: 'bond', name: 'Vínculo', glyph: 'heart', order: 5,
    desc: 'No se sedados: quédate quieto y cerca sin atacar hasta llenar la barra de calma, y entonces ofréceles su comida.' }
];
const TIER_BY = {};
D.TAME_TIERS.forEach(function (t) { TIER_BY[t.id] = t; });

/* Constructor de golpe: telegrafía → activo → recuperación */
function mv(id, kind, wind, active, recover, mul, range, extra) {
  const m = { id: id, kind: kind, wind: wind, active: active, recover: recover, mul: mul, range: range };
  if (extra) for (const k in extra) m[k] = extra[k];
  return m;
}
/* Constructor de patrón: golpes por ráfaga y descanso */
function pat(rest, burst, moves, relentless) {
  return { rest: rest, burst: burst, moves: moves, relentless: !!relentless };
}
/* Constructor de tameo v5 */
function tm(method, tier, feeds, foods, req, note, extra) {
  const t = {
    method: method, tier: tier, feeds: feeds, perLevel: 1, babyBonus: 0.5,
    foods: foods.slice(), req: req || null, note: note || ''
  };
  if (extra) for (const k in extra) t[k] = extra[k];
  return t;
}
D.makeMove = mv; D.makePattern = pat; D.makeTame = tm;

/* ==========================================================
1 · PRESAS Y HERBÍVOROS
========================================================== */
sp('deer', {
  name: 'Ciervo', kind: 'beast', diet: 'herbivore', faction: 'prey',
  biomes: [0, 1, 11], pack: [3, 5], leash: 14,
  hp: 48, dmg: 5, def: 2, speed: 5.2, aggro: 7, reach: 0.9, xp: 14,
  behavior: 'skittish', scale: 1.1, tint: '#b07c48',
  fears: ['wolf', 'lynx', 'bear', 'warg', 'manticore'],
  pattern: pat([2.4, 3.4], [1, 1], [mv('kick', 'melee', 0.34, 0.12, 0.6, 1.0, 1.0)]),
  drops: [['hide', 1, 2, 1], ['raw_game', 1, 2, 1], ['bone', 1, 1, 0.4]],
  tame: tm('feed', 'docile', 3, ['apple', 'crop_carrot', 'hay', 'feed_good'], null,
    'Come fruta y heno. Si corres detrás huye: acércate andando y ofrece la manzana desde el lado.'),
  baby: { name: 'Cervatillo', days: 4, scale: 0.5, chance: 0.28 }
});
sp('reindeer', {
  name: 'Reno', kind: 'beast', diet: 'herbivore', faction: 'prey',
  biomes: [4, 10], pack: [3, 5], leash: 16,
  hp: 84, dmg: 7, def: 4, speed: 4.7, aggro: 6, reach: 1.0, xp: 20,
  behavior: 'skittish', scale: 1.2, tint: '#9a8a74',
  fears: ['wolf', 'polar_bear', 'warg'],
  pattern: pat([2.4, 3.2], [1, 2], [mv('antler', 'melee', 0.4, 0.14, 0.6, 1.1, 1.1)]),
  drops: [['hide', 1, 2, 1], ['raw_game', 1, 2, 1], ['bone', 1, 2, 0.5]],
  tame: tm('feed', 'docile', 4, ['apple', 'hay', 'crop_carrot', 'crop_maca'], { skill: { beast: 1 } },
    'La maca del altiplano es su debilidad. Monta solo con Afinidad 2 y su silla.'),
  mount: { speed: 7.4, fly: false, saddle: 'saddle_reindeer', combat: false, stam: 110, req: { lv: 4, skill: { beast: 2 } } },
  baby: { name: 'Renito', days: 4, scale: 0.5, chance: 0.24 }
});
sp('rabbit', {
  name: 'Conejo', kind: 'beast', diet: 'herbivore', faction: 'prey',
  biomes: [0, 1], pack: [3, 6], leash: 8,
  hp: 12, dmg: 0, def: 0, speed: 5.8, aggro: 6, reach: 0.5, xp: 4,
  behavior: 'skittish', scale: 0.5, tint: '#d4c4a8',
  fears: ['fox', 'lynx', 'wolf', 'bear', 'condor'],
  pattern: pat([3, 4], [1, 1], [mv('nip', 'melee', 0.2, 0.08, 0.4, 0.4, 0.6)]),
  drops: [['raw_meat', 1, 1, 1], ['hide', 1, 1, 0.5]],
  tame: tm('feed', 'domestic', 2, ['crop_carrot', 'crop_lettuce', 'berry'], null,
    'El primer tameo del juego: dos bayas o una zanahoria. Sin requisito alguno.')
});
sp('horse', {
  name: 'Caballo salvaje', kind: 'beast', diet: 'herbivore', faction: 'prey',
  biomes: [0], pack: [3, 5], leash: 18,
  hp: 66, dmg: 5, def: 2, speed: 5.0, aggro: 5, reach: 0.9, xp: 12,
  behavior: 'skittish', scale: 1.2, tint: '#8e6444',
  fears: ['wolf', 'bear', 'warg'],
  pattern: pat([2.6, 3.6], [1, 2], [mv('kick', 'melee', 0.36, 0.12, 0.55, 1.0, 1.05)]),
  drops: [['hide', 1, 2, 1], ['raw_meat', 1, 2, 1]],
  tame: tm('feed', 'docile', 4, ['apple', 'crop_carrot', 'hay', 'feed_good'], null,
    'Manzana o zanahoria. Con silla de caballo (banco, Afinidad 1) es tu primera montura rápida.'),
  mount: { speed: 6.9, fly: false, saddle: 'saddle_horse', combat: false, stam: 120, req: { lv: 3, skill: { beast: 1 } } },
  baby: { name: 'Potro', days: 5, scale: 0.5, chance: 0.22 }
});
sp('camel', {
  name: 'Camello', kind: 'beast', diet: 'herbivore', faction: 'neutral',
  biomes: [3], pack: [2, 4], leash: 16,
  hp: 105, dmg: 8, def: 4, speed: 3.7, aggro: 3, reach: 1.0, xp: 22,
  behavior: 'passive', scale: 1.5, tint: '#d4ac6c',
  pattern: pat([2.8, 3.8], [1, 1], [mv('spit', 'spit', 0.5, 0.1, 0.7, 0.6, 4.5, { proj: 'spit' })]),
  drops: [['hide', 2, 2, 1], ['raw_meat', 2, 2, 1], ['wool', 1, 1, 0.4]],
  tame: tm('feed', 'docile', 4, ['hay', 'crop_wheat', 'crop_sunflower', 'feed_good'], null,
    'No huye: escupe si te pegas mucho. Aliméntalo desde un paso atrás. Mucha stamina de montura.'),
  mount: { speed: 7.1, fly: false, saddle: 'saddle_camel', combat: false, stam: 150, req: { lv: 3, skill: { beast: 1 } } }
});
sp('llama', {
  name: 'Llama', kind: 'beast', diet: 'herbivore', faction: 'neutral',
  biomes: [5], pack: [3, 5], leash: 14,
  hp: 74, dmg: 5, def: 3, speed: 4.1, aggro: 3, reach: 1.0, xp: 18,
  behavior: 'passive', scale: 1.2, tint: '#dccca8',
  pattern: pat([2.6, 3.4], [1, 2], [mv('spit', 'spit', 0.42, 0.1, 0.6, 0.5, 4.0, { proj: 'spit' })]),
  drops: [['wool', 1, 2, 1], ['raw_meat', 1, 2, 1], ['hide', 1, 1, 0.7]],
  tame: tm('feed', 'docile', 3, ['hay', 'crop_quinoa', 'crop_corn'], null,
    'Quinua o maíz. Escupe poco daño; puedes domarla aunque te escupa.'),
  mount: { speed: 6.2, fly: false, saddle: 'saddle_llama', combat: false, stam: 110, req: { lv: 3, skill: { beast: 1 } } }
});
sp('goat', {
  name: 'Cabra montés', kind: 'beast', diet: 'herbivore', faction: 'neutral',
  biomes: [5, 10], pack: [3, 5], leash: 12,
  hp: 54, dmg: 8, def: 3, speed: 4.5, aggro: 4, reach: 1.0, xp: 16,
  behavior: 'territorial', scale: 0.9, tint: '#a89880',
  pattern: pat([2.0, 2.8], [1, 2], [mv('ram', 'dash', 0.42, 0.16, 0.6, 1.2, 2.2, { dash: 5 })]),
  drops: [['hide', 1, 1, 1], ['raw_meat', 1, 2, 1], ['bone', 1, 1, 0.4]],
  tame: tm('feed', 'docile', 3, ['hay', 'crop_wheat', 'crop_maca'], null,
    'Embiste si te plantas delante. Aliméntala de lado o tras una embestida fallida.'),
  baby: { name: 'Cabrito', days: 3, scale: 0.5, chance: 0.3 }
});
sp('bison', {
  name: 'Bisonte', kind: 'beast', diet: 'herbivore', faction: 'neutral',
  biomes: [0], pack: [3, 5], leash: 16,
  hp: 140, dmg: 15, def: 8, speed: 3.7, aggro: 5, reach: 1.3, xp: 44,
  behavior: 'territorial', scale: 1.5, tint: '#5c4030',
  fears: ['bear', 'warg'],
  pattern: pat([2.6, 3.6], [1, 2], [
    mv('gore', 'melee', 0.44, 0.14, 0.62, 1.1, 1.4),
    mv('charge', 'dash', 0.72, 0.24, 0.95, 1.7, 4.0, { dash: 8, knock: 5 })
  ]),
  drops: [['hide', 2, 3, 1], ['raw_game', 2, 3, 1], ['bone', 1, 2, 0.6]],
  tame: tm('sedate', 'wild', 4, ['hay', 'crop_corn', 'crop_wheat', 'feed_golden'], { skill: { beast: 3 } },
    'Herbívoro pero enorme: hay que sedarlo. Montura de combate con mucha vida.'),
  mount: { speed: 6.4, fly: false, saddle: 'saddle_bison', combat: true, stam: 160, req: { lv: 5, skill: { beast: 3 } } }
});
sp('turtle', {
  name: 'Tortuga', kind: 'beast', diet: 'herbivore', faction: 'prey',
  biomes: [6], pack: [1, 3], leash: 6,
  hp: 95, dmg: 0, def: 14, speed: 1.4, aggro: 0, reach: 0.5, xp: 9,
  behavior: 'passive', scale: 0.8, tint: '#4e9250',
  pattern: pat([3.4, 4.4], [1, 1], [mv('snap', 'melee', 0.5, 0.1, 0.8, 0.5, 0.7)]),
  drops: [['crab_shell', 1, 2, 1], ['raw_meat', 1, 1, 0.8]],
  tame: tm('feed', 'domestic', 2, ['crop_lettuce', 'berry', 'crop_cabbage'], null,
    'No huye ni ataca casi. Dos lechugas y es tuya. Ideal para practicar.')
});
sp('seal', {
  name: 'Foca', kind: 'beast', diet: 'carnivore', faction: 'prey',
  biomes: [6], pack: [2, 4], leash: 9,
  hp: 64, dmg: 6, def: 3, speed: 2.9, aggro: 0, reach: 0.9, xp: 12,
  behavior: 'passive', scale: 1.0, tint: '#8e939c',
  prey: [], fears: ['polar_bear', 'crocodile'],
  pattern: pat([2.8, 3.8], [1, 1], [mv('bite', 'melee', 0.34, 0.1, 0.6, 0.8, 1.0)]),
  drops: [['hide', 1, 2, 1], ['raw_meat', 1, 2, 1], ['oil', 1, 1, 0.3]],
  tame: tm('feed', 'domestic', 3, ['fish_sardine', 'fish_trout', 'grilled_fish'], null,
    'Come pescado. En la costa es el tameo más fácil que existe: no huye.'),
  baby: { name: 'Cría de foca', days: 3, scale: 0.5, chance: 0.3 }
});
sp('frog', {
  name: 'Rana gigante', kind: 'beast', diet: 'insectivore', faction: 'neutral',
  biomes: [2, 9], pack: [3, 5], leash: 8,
  hp: 24, dmg: 5, def: 1, speed: 3.9, aggro: 3, reach: 0.8, xp: 7,
  behavior: 'territorial', scale: 0.8, tint: '#5cb04a',
  fears: ['crocodile', 'basilisk', 'lynx'],
  pattern: pat([1.8, 2.6], [1, 2], [mv('tongue', 'melee', 0.24, 0.1, 0.42, 0.9, 1.8)]),
  drops: [['raw_meat', 1, 1, 0.8], ['venom_sac', 1, 1, 0.12]],
  tame: tm('feed', 'domestic', 2, ['berry', 'mushroom', 'crop_bean'], null,
    'Come bayas y setas. Su lengua alcanza 1,8 tiles: aliméntala desde lejos y acércate después.')
});

/* ==========================================================
2 · DEPREDADORES
========================================================== */
sp('wolf', {
  name: 'Lobo', kind: 'beast', diet: 'carnivore', faction: 'predator',
  biomes: [1, 4, 5, 10, 11], pack: [2, 4], leash: 18,
  hp: 58, dmg: 12, def: 3, speed: 4.6, aggro: 7, reach: 1.05, xp: 22,
  behavior: 'hostile', scale: 1.0, tint: '#8a8a96',
  prey: ['deer', 'rabbit', 'reindeer', 'boar', 'goat', 'sheep', 'horse'],
  pattern: pat([1.6, 2.4], [2, 3], [
    mv('bite', 'melee', 0.26, 0.1, 0.3, 1.0, 1.1),
    mv('lunge', 'dash', 0.44, 0.16, 0.62, 1.35, 2.6, { dash: 7 })
  ]),
  drops: [['hide', 1, 2, 1], ['raw_meat', 1, 1, 0.8], ['bone', 1, 1, 0.5], ['warg_fang', 1, 1, 0.03]],
  tame: tm('sedate', 'wild', 4, ['raw_meat', 'cooked_meat', 'raw_game', 'dried_meat'], { skill: { beast: 2 } },
    'Primer depredador domable. Baja su vida bajo el 60 %, sédalo y dale carne. Caza ciervos por su cuenta.'),
  baby: { name: 'Lobato', days: 4, scale: 0.5, chance: 0.25 }
});
sp('lynx', {
  name: 'Lince', kind: 'beast', diet: 'carnivore', faction: 'predator',
  biomes: [1, 4, 9], pack: [1, 2], leash: 14,
  hp: 48, dmg: 11, def: 2, speed: 5.2, aggro: 6, reach: 0.95, xp: 20,
  behavior: 'ambush', scale: 0.9, tint: '#d0a464',
  prey: ['rabbit', 'chicken', 'duck', 'frog', 'fox'],
  pattern: pat([1.9, 2.8], [2, 3], [
    mv('claw', 'melee', 0.2, 0.09, 0.26, 1.0, 1.0),
    mv('pounce', 'dash', 0.38, 0.14, 0.55, 1.5, 2.8, { dash: 9, crit: 0.25 })
  ]),
  drops: [['hide', 1, 2, 1], ['raw_meat', 1, 1, 0.6], ['bone', 1, 1, 0.3]],
  tame: tm('feed', 'docile', 3, ['fish_sardine', 'fish_trout', 'cooked_fish', 'raw_poultry'], { skill: { beast: 1 } },
    'A diferencia del lobo, el lince acepta comida sin sedar. Pescado o carne de ave. Salta mucho: espera su descanso.'),
  baby: { name: 'Gatito montés', days: 3, scale: 0.45, chance: 0.3 }
});
sp('fox', {
  name: 'Zorro', kind: 'beast', diet: 'carnivore', faction: 'predator',
  biomes: [1, 4], pack: [1, 2], leash: 12,
  hp: 30, dmg: 7, def: 1, speed: 5.4, aggro: 4, reach: 0.85, xp: 12,
  behavior: 'skittish', scale: 0.7, tint: '#e07a30',
  prey: ['rabbit', 'chicken', 'duck', 'frog'], fears: ['wolf', 'bear', 'lynx'],
  pattern: pat([2.0, 3.0], [1, 2], [mv('nip', 'melee', 0.2, 0.08, 0.34, 1.0, 0.9)]),
  drops: [['hide', 1, 1, 0.9], ['raw_meat', 1, 1, 0.6]],
  tame: tm('feed', 'domestic', 3, ['raw_meat', 'egg', 'berry', 'raw_poultry'], null,
    'Come casi de todo, incluso bayas. Huye de ti: deja la comida cerca andando, no corriendo.'),
  baby: { name: 'Cachorro de zorro', days: 3, scale: 0.5, chance: 0.3 }
});
sp('boar', {
  name: 'Jabalí', kind: 'beast', diet: 'omnivore', faction: 'predator',
  biomes: [0, 1, 3, 9, 11], pack: [2, 4], leash: 14,
  hp: 52, dmg: 10, def: 4, speed: 3.5, aggro: 5, reach: 1.05, xp: 18,
  behavior: 'territorial', scale: 1.0, tint: '#7a5230',
  prey: ['rabbit', 'frog'], fears: ['bear', 'wolf', 'warg'],
  pattern: pat([2.4, 3.4], [1, 1], [
    mv('gore', 'melee', 0.34, 0.12, 0.5, 1.0, 1.1),
    mv('charge', 'dash', 0.66, 0.22, 0.9, 1.6, 3.6, { dash: 8, knock: 4 })
  ]),
  drops: [['raw_game', 1, 2, 1], ['hide', 1, 1, 0.8], ['bone', 1, 1, 0.4]],
  tame: tm('feed', 'docile', 3, ['berry', 'apple', 'crop_carrot', 'crop_beet'], { skill: { beast: 1 } },
    'Omnívoro: acepta vegetal. Esquiva su embestida y aliméntalo en el descanso de 2,4–3,4 s.'),
  baby: { name: 'Jabatillo', days: 3, scale: 0.55, chance: 0.25 }
});
sp('bear', {
  name: 'Oso pardo', kind: 'beast', diet: 'omnivore', faction: 'predator',
  biomes: [1, 11], pack: [1, 1], leash: 16,
  hp: 132, dmg: 19, def: 7, speed: 3.9, aggro: 6, reach: 1.25, xp: 48,
  behavior: 'territorial', scale: 1.4, tint: '#6e4c32',
  prey: ['deer', 'boar', 'rabbit', 'goat', 'horse'],
  pattern: pat([2.2, 3.0], [1, 2], [
    mv('swipe', 'melee', 0.42, 0.14, 0.62, 1.15, 1.3),
    mv('maul', 'melee', 0.68, 0.18, 0.95, 1.9, 1.3, { knock: 5, guardBreak: 0.6 })
  ]),
  drops: [['hide', 2, 3, 1], ['raw_game', 2, 3, 1], ['bone', 1, 1, 0.5], ['honey', 1, 1, 0.2]],
  tame: tm('sedate', 'wild', 4, ['berry', 'honey', 'fish_trout', 'hearty_stew'], { skill: { beast: 4 } },
    'La miel lo calma más rápido. Su mordisco rompe guardia: bloquéalo de lado o esquiva.'),
  mount: { speed: 6.1, fly: false, saddle: 'saddle_bear', combat: true, stam: 150, req: { lv: 6, skill: { beast: 4 } } }
});
sp('polar_bear', {
  name: 'Oso polar', kind: 'beast', diet: 'carnivore', faction: 'predator',
  biomes: [4], pack: [1, 1], leash: 18,
  hp: 185, dmg: 24, def: 10, speed: 3.7, aggro: 7, reach: 1.45, xp: 74,
  behavior: 'hostile', scale: 1.7, tint: '#f0f6fa',
  prey: ['seal', 'reindeer', 'fox'],
  pattern: pat([2.4, 3.2], [1, 2], [
    mv('swipe', 'melee', 0.44, 0.14, 0.66, 1.2, 1.5),
    mv('crush', 'melee', 0.8, 0.2, 1.05, 2.1, 1.5, { knock: 6, guardBreak: 0.8 })
  ]),
  drops: [['hide', 2, 4, 1], ['raw_game', 2, 3, 1], ['frost_core', 1, 1, 0.1]],
  tame: tm('sedate', 'wild', 5, ['fish_ice', 'fish_trout', 'raw_game', 'smoked_fish'], { skill: { beast: 5 } },
    'Pez ártico o caza. Inmune al hielo: las flechas gélidas no lo ralentizan.'),
  mount: { speed: 6.5, fly: false, saddle: 'saddle_polar_bear', combat: true, stam: 170, req: { lv: 8, skill: { beast: 5 } } }
});
sp('crocodile', {
  name: 'Cocodrilo', kind: 'beast', diet: 'carnivore', faction: 'predator',
  biomes: [2, 6, 9], pack: [1, 2], leash: 10,
  hp: 105, dmg: 18, def: 9, speed: 3.4, aggro: 5, reach: 1.5, xp: 40,
  behavior: 'ambush', scale: 1.5, tint: '#4e7040',
  prey: ['frog', 'deer', 'boar', 'seal', 'rabbit'],
  pattern: pat([3.0, 4.2], [1, 2], [
    mv('snap', 'melee', 0.3, 0.1, 0.5, 1.0, 1.6),
    mv('deathroll', 'melee', 0.72, 0.3, 1.2, 2.2, 1.6, { bleed: 4, knock: 3 })
  ]),
  drops: [['hide', 2, 3, 1], ['raw_meat', 1, 2, 1], ['bone', 1, 1, 0.5], ['chitin', 1, 1, 0.2]],
  tame: tm('sedate', 'wild', 4, ['raw_meat', 'raw_game', 'fish_catfish', 'cooked_meat'], { skill: { beast: 3 } },
    'Alcance 1,5 tiles: te muerde antes de que lo toques. Sédalo desde el agua con arco.')
});
sp('scorpion', {
  name: 'Escorpión', kind: 'beast', diet: 'carnivore', faction: 'predator',
  biomes: [3], pack: [2, 3], leash: 10,
  hp: 34, dmg: 11, def: 6, speed: 3.5, aggro: 5, reach: 0.9, xp: 16,
  behavior: 'territorial', scale: 0.6, tint: '#96502c',
  prey: ['frog', 'rabbit'],
  pattern: pat([1.5, 2.2], [2, 3], [
    mv('pincer', 'melee', 0.22, 0.08, 0.28, 0.8, 0.95),
    mv('sting', 'melee', 0.36, 0.1, 0.5, 1.1, 1.0, { poison: 4 })
  ]),
  drops: [['chitin', 1, 1, 0.8], ['venom_sac', 1, 1, 0.35], ['raw_meat', 1, 1, 0.3]],
  tame: tm('sedate', 'wild', 3, ['raw_meat', 'egg', 'raw_poultry'], { skill: { beast: 2 } },
    'Pequeño pero venenoso. Lleva antídoto. Se doma con carne y solo tres comidas.')
});
sp('sand_stalker', {
  name: 'Acechador de arena', kind: 'beast', diet: 'carnivore', faction: 'predator',
  biomes: [3], pack: [1, 2], leash: 14, nocturnal: true,
  hp: 78, dmg: 16, def: 5, speed: 5.0, aggro: 8, reach: 1.15, xp: 34,
  behavior: 'ambush', scale: 1.15, tint: '#c8a86a',
  prey: ['camel', 'goat', 'rabbit', 'scorpion'],
  pattern: pat([2.2, 3.2], [2, 3], [
    mv('slash', 'melee', 0.24, 0.1, 0.3, 1.0, 1.2),
    mv('burrow', 'dash', 0.6, 0.2, 0.8, 1.6, 3.4, { dash: 10, crit: 0.3 })
  ]),
  drops: [['chitin', 1, 2, 0.8], ['sand', 2, 3, 1], ['venom_sac', 1, 1, 0.25], ['flint', 1, 2, 0.6]],
  tame: tm('sedate', 'wild', 4, ['raw_meat', 'raw_game', 'dried_meat'], { skill: { beast: 4 } },
    'Solo de noche. Se entierra y sale bajo tus pies: escucha el aviso y esquiva antes de sedarlo.')
});
sp('crab', {
  name: 'Cangrejo', kind: 'beast', diet: 'scavenger', faction: 'neutral',
  biomes: [6], pack: [3, 5], leash: 7,
  hp: 28, dmg: 6, def: 8, speed: 2.1, aggro: 3, reach: 0.85, xp: 9,
  behavior: 'territorial', scale: 0.7, tint: '#e0603c',
  pattern: pat([1.8, 2.6], [1, 2], [mv('pincer', 'melee', 0.3, 0.1, 0.45, 1.0, 0.9)]),
  drops: [['crab_shell', 1, 1, 1], ['raw_meat', 1, 1, 0.7], ['salt', 1, 1, 0.2]],
  tame: tm('feed', 'domestic', 2, ['fish_sardine', 'raw_meat', 'berry'], null,
    'Carroñero: come pescado o carne. Lento y fácil, perfecto para el segundo tameo.')
});

/* ==========================================================
3 · GANADO DOMÉSTICO
========================================================== */
const LIVESTOCK = [
  ['chicken', 'Gallina', 16, 0.6, '#f8f0e0', 'egg', 1, [1, 2], 'feather',
    [['raw_poultry', 1, 1, 1], ['feather', 1, 2, 0.8]], ['crop_wheat', 'crop_corn', 'berry'],
    'Grano o bayas. Pon huevos cada día si la alimentas.'],
  ['duck', 'Pato', 15, 0.6, '#f0e8d4', 'egg', 1, [1, 2], 'feather',
    [['raw_poultry', 1, 1, 1], ['feather', 1, 2, 0.9]], ['crop_rice', 'crop_wheat', 'fish_sardine'],
    'Arroz o sardina. También pone huevos a diario.'],
  ['sheep', 'Oveja', 44, 1.0, '#f8f4ea', 'wool', 2, [1, 2], 'manure',
    [['wool', 1, 1, 1], ['raw_meat', 1, 2, 1], ['hide', 1, 1, 0.7]], ['hay', 'crop_wheat', 'crop_cabbage'],
    'Heno. Da lana cada dos días y estiércol para el compost.'],
  ['alpaca', 'Alpaca', 58, 1.1, '#f4ecdc', 'wool', 2, [2, 3], 'manure',
    [['wool', 1, 2, 1], ['raw_meat', 1, 2, 1], ['hide', 1, 1, 0.7]], ['hay', 'crop_quinoa', 'crop_maca'],
    'Quinua o maca. Rinde más lana que la oveja.'],
  ['cow', 'Vaca', 56, 1.3, '#f6f2e8', 'milk', 1, [1, 2], 'manure',
    [['raw_meat', 2, 3, 1], ['hide', 1, 2, 1], ['milk', 1, 1, 0.5]], ['hay', 'crop_wheat', 'crop_beet'],
    'Heno y remolacha. Leche diaria: base del queso y la mantequilla.'],
  ['nanny', 'Cabra lechera', 44, 0.9, '#f6f0e4', 'milk', 1, [1, 1], 'manure',
    [['raw_meat', 1, 2, 1], ['hide', 1, 1, 0.7], ['milk', 1, 1, 0.5]], ['hay', 'crop_wheat', 'crop_maca'],
    'Come de todo. Leche diaria con menos pienso que la vaca.'],
  ['pig', 'Cerdo', 48, 1.0, '#f0b4ac', 'truffle', 2, [1, 1], 'manure',
    [['raw_meat', 2, 3, 1], ['hide', 1, 1, 0.6], ['bone', 1, 1, 0.4]], ['crop_potato', 'crop_beet', 'raw_meat', 'berry'],
    'Omnívoro: patata, remolacha o carne. Busca trufas, el producto más caro de la granja.']
];
LIVESTOCK.forEach(function (a) {
  sp(a[0], {
    name: a[1], kind: 'livestock', diet: a[0] === 'pig' ? 'omnivore' : 'herbivore', faction: 'livestock',
    biomes: [], pack: [1, 1], leash: 4,
    hp: a[2], dmg: 0, def: 1, speed: 1.4, aggro: 0, reach: 0, xp: 4,
    behavior: 'passive', scale: a[3], tint: a[4],
    fears: ['wolf', 'bear', 'lynx', 'fox', 'warg', 'crocodile', 'manticore'],
    pattern: pat([4, 5], [1, 1], [mv('nudge', 'melee', 0.5, 0.1, 0.8, 0.2, 0.6)]),
    drops: a[9],
    livestock: { product: a[5], every: a[6], qty: a[7], second: a[8] },
    tame: tm('feed', 'domestic', 2, a[10], null, a[11], { domestic: true })
  });
});

/* ==========================================================
4 · NO-MUERTOS Y BANDIDOS (no domables)
========================================================== */
sp('skeleton', {
  name: 'Esqueleto', kind: 'undead', diet: 'none', faction: 'undead',
  biomes: [2, 3, 5, 7, 8], pack: [2, 4], leash: 14, nocturnal: true,
  hp: 64, dmg: 13, def: 5, speed: 3.1, aggro: 7, reach: 1.15, xp: 26,
  behavior: 'hostile', scale: 1.0, tint: '#e8e8dc',
  pattern: pat([1.7, 2.5], [1, 2], [
    mv('slash', 'melee', 0.32, 0.1, 0.42, 1.0, 1.2),
    mv('rattle', 'buff', 0.5, 0.1, 0.8, 0, 0, { selfDef: 4, selfT: 6 })
  ]),
  drops: [['bone', 1, 2, 1], ['crystal', 1, 1, 0.15], ['iron_ore', 1, 1, 0.1]],
  gold: [4, 14], tame: null
});
sp('bandit', {
  name: 'Bandido', kind: 'humanoid', diet: 'omnivore', faction: 'bandit',
  biomes: [0, 1, 3, 7, 10], pack: [2, 3], leash: 20,
  hp: 78, dmg: 14, def: 6, speed: 3.9, aggro: 8, reach: 1.2, xp: 32,
  behavior: 'hostile', scale: 1.0, tint: '#5a4a3a',
  pattern: pat([1.5, 2.3], [2, 3], [
    mv('stab', 'melee', 0.22, 0.09, 0.28, 1.0, 1.2),
    mv('slash', 'melee', 0.3, 0.11, 0.38, 1.15, 1.25),
    mv('throw', 'spit', 0.5, 0.1, 0.7, 0.8, 6.0, { proj: 'knife' })
  ]),
  drops: [['cloth', 1, 2, 0.7], ['iron_ore', 1, 1, 0.2], ['potion_heal_s', 1, 1, 0.12], ['rope', 1, 1, 0.3], ['lockpick', 1, 1, 0.06]],
  gold: [15, 45], tame: null
});
sp('guard', {
  name: 'Guardia de Vhalor', kind: 'humanoid', diet: 'omnivore', faction: 'guard',
  biomes: [], pack: [1, 1], leash: 16,
  hp: 165, dmg: 19, def: 14, speed: 3.7, aggro: 0, reach: 1.25, xp: 0,
  behavior: 'guard', scale: 1.0, tint: '#4a6a8a',
  guard: { of: 'city', radius: 16, hostileToPlayer: false },
  pattern: pat([1.4, 2.0], [2, 3], [
    mv('spear', 'melee', 0.26, 0.1, 0.32, 1.0, 1.6),
    mv('bash', 'melee', 0.4, 0.12, 0.55, 0.8, 1.2, { stagger: 0.7 })
  ]),
  drops: [], tame: null
});
sp('hunter', {
  name: 'Cazador errante', kind: 'humanoid', diet: 'omnivore', faction: 'neutral',
  biomes: [0, 1, 4, 10, 11], pack: [1, 1], leash: 30, wanderer: true,
  hp: 110, dmg: 16, def: 8, speed: 4.0, aggro: 0, reach: 1.2, xp: 24,
  behavior: 'patrol', scale: 1.0, tint: '#6a6a4a',
  prey: ['deer', 'rabbit', 'boar', 'fox', 'reindeer'],
  pattern: pat([1.8, 2.6], [1, 2], [
    mv('arrow', 'spit', 0.55, 0.1, 0.7, 1.2, 9.0, { proj: 'arrow' }),
    mv('knife', 'melee', 0.24, 0.09, 0.34, 0.9, 1.1)
  ]),
  drops: [['hide', 1, 2, 0.8], ['arrow_basic', 3, 6, 0.7], ['dried_meat', 1, 2, 0.5], ['bow_wood', 1, 1, 0.08]],
  gold: [10, 30], tame: null
});

/* ==========================================================
5 · MÍTICOS SALVAJES Y MONTURAS
========================================================== */
sp('warg', {
  name: 'Huargo', kind: 'mythic', diet: 'carnivore', faction: 'predator',
  biomes: [4, 7], zone: 'barrow', pack: [1, 2], leash: 22, nocturnal: true, elite: true,
  hp: 155, dmg: 22, def: 9, speed: 5.4, aggro: 9, reach: 1.25, xp: 66,
  behavior: 'hostile', scale: 1.4, tint: '#3a3248',
  prey: ['deer', 'reindeer', 'boar', 'horse', 'goat', 'skeleton'],
  pattern: pat([1.7, 2.4], [2, 3], [
    mv('rend', 'melee', 0.24, 0.1, 0.3, 1.05, 1.3, { bleed: 3 }),
    mv('lunge', 'dash', 0.42, 0.16, 0.6, 1.45, 3.0, { dash: 9 }),
    mv('howl', 'buff', 0.6, 0.1, 0.9, 0, 6.0, { allyDmg: 0.25, allyT: 10 })
  ]),
  drops: [['warg_fang', 1, 2, 1], ['hide', 2, 3, 1], ['bone', 1, 2, 0.8]],
  tame: tm('sedate', 'mythic', 5, ['raw_game', 'cooked_game', 'hearty_stew', 'sausage'], { skill: { beast: 5 } },
    'Su aullido sube el daño de la manada: aíslalo antes de sedarlo. Montura de combate rapidísima.'),
  mount: { speed: 7.8, fly: false, saddle: 'saddle_warg', combat: true, stam: 150, req: { lv: 7, skill: { beast: 5 } } },
  baby: { name: 'Cachorro de huargo', days: 6, scale: 0.5, chance: 0.2 }
});
sp('shadow_hound', {
  name: 'Sabueso sombrío', kind: 'mythic', diet: 'arcane', faction: 'mythic',
  biomes: [7], zone: 'barrow', pack: [1, 2], leash: 22, nocturnal: true,
  hp: 98, dmg: 17, def: 6, speed: 5.6, aggro: 8, reach: 1.15, xp: 48,
  behavior: 'hostile', scale: 1.1, tint: '#2a2038',
  pattern: pat([1.9, 2.7], [2, 3], [
    mv('bite', 'melee', 0.24, 0.1, 0.3, 1.0, 1.2),
    mv('phase', 'dash', 0.4, 0.14, 0.6, 1.3, 3.2, { dash: 11, pierce: true })
  ]),
  drops: [['bone', 1, 2, 1], ['hide', 1, 2, 0.8], ['wisp_essence', 1, 1, 0.25], ['crystal', 1, 1, 0.2]],
  tame: tm('sedate', 'mythic', 4, ['raw_game', 'cooked_game', 'dried_meat'], { skill: { beast: 5 } },
    'Atraviesa paredes con su salto de fase. La carne curada funciona mejor que la cruda.')
});
sp('nightmare', {
  name: 'Pesadilla', kind: 'mythic', diet: 'arcane', faction: 'mythic',
  biomes: [7], zone: 'barrow', pack: [1, 1], leash: 24, nocturnal: true, elite: true,
  hp: 185, dmg: 24, def: 10, speed: 5.8, aggro: 9, reach: 1.35, xp: 90,
  behavior: 'hostile', scale: 1.4, tint: '#241a32',
  pattern: pat([2.0, 2.8], [1, 2], [
    mv('hoof', 'melee', 0.34, 0.12, 0.5, 1.15, 1.4, { burn: 5 }),
    mv('gallop', 'dash', 0.6, 0.24, 0.85, 1.7, 4.2, { dash: 12, burn: 6, knock: 5 })
  ]),
  drops: [['hide', 2, 3, 1], ['bone', 1, 2, 1], ['crystal', 1, 1, 0.3], ['ember_core', 1, 1, 0.3]],
  tame: tm('sedate', 'mythic', 6, ['apple', 'crop_carrot', 'maca_porridge', 'feed_golden'], { skill: { beast: 8 } },
    'Corcel en llamas: come fruta pese a ser arcano. Bálsamo ígneo antes de acercarte.'),
  mount: { speed: 8.8, fly: false, saddle: 'saddle_nightmare', combat: true, stam: 165, req: { lv: 12, skill: { beast: 8 } } }
});
sp('griffin', {
  name: 'Grifo', kind: 'mythic', diet: 'carnivore', faction: 'mythic',
  biomes: [5], zone: 'aerie', pack: [1, 1], leash: 26, elite: true,
  hp: 195, dmg: 26, def: 11, speed: 4.7, aggro: 8, reach: 1.35, xp: 86,
  behavior: 'territorial', scale: 1.5, tint: '#d0ac54', flyer: true,
  prey: ['goat', 'llama', 'deer', 'rabbit', 'condor'],
  pattern: pat([2.2, 3.0], [1, 2], [
    mv('talon', 'melee', 0.3, 0.12, 0.44, 1.1, 1.4),
    mv('dive', 'fly_dive', 0.75, 0.24, 1.0, 1.9, 5.0, { dash: 14, knock: 5 }),
    mv('screech', 'aoe', 0.55, 0.12, 0.8, 0.5, 3.4, { stagger: 0.5 })
  ]),
  drops: [['feather', 3, 5, 1], ['gold_nugget', 1, 1, 0.25], ['raw_game', 1, 2, 0.8], ['bone', 1, 2, 0.5]],
  tame: tm('sedate', 'mythic', 6, ['raw_game', 'fish_trout', 'grilled_fish', 'roast'], { skill: { beast: 7 } },
    'Primera montura voladora. Sédalo cuando aterrice tras el picado; en el aire es intocable.'),
  mount: { speed: 8.4, fly: true, saddle: 'saddle_griffin', combat: true, stam: 140, req: { lv: 10, skill: { beast: 7 } } },
  baby: { name: 'Polluelo de grifo', days: 8, scale: 0.45, chance: 0.3 }
});
sp('condor', {
  name: 'Cóndor', kind: 'mythic', diet: 'carnivore', faction: 'mythic',
  biomes: [5, 10], zone: 'aerie', pack: [1, 2], leash: 26,
  hp: 140, dmg: 19, def: 7, speed: 5.1, aggro: 8, reach: 1.25, xp: 64,
  behavior: 'territorial', scale: 1.5, tint: '#22222a', flyer: true,
  prey: ['rabbit', 'goat', 'frog', 'chicken'],
  pattern: pat([2.3, 3.2], [1, 2], [
    mv('peck', 'melee', 0.28, 0.1, 0.4, 1.0, 1.3),
    mv('swoop', 'fly_dive', 0.66, 0.2, 0.9, 1.6, 4.6, { dash: 13 })
  ]),
  drops: [['feather', 3, 5, 1], ['raw_meat', 1, 2, 0.8], ['bone', 1, 1, 0.4]],
  tame: tm('sedate', 'mythic', 5, ['raw_game', 'fish_trout', 'cooked_game'], { skill: { beast: 7 } },
    'Más fácil que el grifo y vuela más rápido, pero no combate. Buena montura de viaje.'),
  mount: { speed: 9.2, fly: true, saddle: 'saddle_condor', combat: false, stam: 130, req: { lv: 10, skill: { beast: 7 } } }
});
sp('unicorn', {
  name: 'Unicornio', kind: 'mythic', diet: 'herbivore', faction: 'neutral',
  biomes: [11], zone: 'glade', pack: [1, 1], leash: 24, elite: true,
  hp: 165, dmg: 20, def: 12, speed: 5.6, aggro: 4, reach: 1.3, xp: 80,
  behavior: 'skittish', scale: 1.35, tint: '#f4f0ff',
  fears: ['warg', 'cerberus', 'manticore'],
  pattern: pat([2.4, 3.4], [1, 2], [
    mv('horn', 'melee', 0.36, 0.12, 0.55, 1.3, 1.4, { pierce: true }),
    mv('radiance', 'aoe', 0.7, 0.14, 1.0, 0.6, 3.6, { healAlly: 24, cleanse: true })
  ]),
  drops: [['unicorn_hair', 1, 2, 1], ['hide', 1, 2, 0.8], ['crystal', 1, 1, 0.3]],
  tame: tm('bond', 'bond', 6, ['apple', 'crop_strawberry', 'honey_cake', 'herb_blue'], { skill: { beast: 9 } },
    'NO se seda. Quédate quieto a menos de 3 tiles, sin atacar ni correr, 3,2 s. Luego fresa o pastel de miel.',
    { calm: 3.2 }),
  mount: { speed: 8.6, fly: false, saddle: 'saddle_unicorn', combat: true, stam: 160, req: { lv: 12, skill: { beast: 9 } } },
  baby: { name: 'Potro de unicornio', days: 9, scale: 0.45, chance: 0.18 }
});
sp('kirin', {
  name: 'Kirin', kind: 'mythic', diet: 'arcane', faction: 'neutral',
  biomes: [11], zone: 'glade', pack: [1, 1], leash: 24, elite: true,
  hp: 178, dmg: 23, def: 13, speed: 5.2, aggro: 5, reach: 1.35, xp: 88,
  behavior: 'territorial', scale: 1.35, tint: '#8ad8c8',
  pattern: pat([2.4, 3.2], [1, 2], [
    mv('antler', 'melee', 0.38, 0.12, 0.56, 1.25, 1.45),
    mv('storm', 'aoe', 0.8, 0.16, 1.05, 1.5, 4.0, { shock: true, stagger: 0.6 })
  ]),
  drops: [['kirin_horn', 1, 1, 1], ['crystal', 1, 2, 0.6], ['silk', 1, 1, 0.4]],
  tame: tm('bond', 'bond', 6, ['crop_maca', 'maca_tonic', 'herb_blue', 'honey_cake'], { skill: { beast: 9 } },
    'Vínculo de 3,4 s. Su tormenta aturde en 4 tiles: espera el descanso y no te muevas.',
    { calm: 3.4 }),
  mount: { speed: 8.2, fly: false, saddle: 'saddle_kirin', combat: true, stam: 170, req: { lv: 13, skill: { beast: 9 } } }
});
sp('pegasus', {
  name: 'Pegaso', kind: 'mythic', diet: 'herbivore', faction: 'neutral',
  biomes: [10], zone: 'mirror', pack: [1, 2], leash: 22, elite: true,
  hp: 150, dmg: 15, def: 9, speed: 5.8, aggro: 3, reach: 1.2, xp: 76,
  behavior: 'skittish', scale: 1.4, tint: '#eaf4ff', flyer: true,
  fears: ['wyvern', 'manticore', 'warg'],
  pattern: pat([2.6, 3.6], [1, 1], [mv('hoof', 'melee', 0.34, 0.12, 0.55, 1.0, 1.3)]),
  drops: [['pegasus_feather', 1, 3, 1], ['hide', 1, 2, 0.7], ['silk', 1, 1, 0.3]],
  tame: tm('bond', 'bond', 5, ['apple', 'crop_carrot', 'honey_cake', 'feed_golden'], { skill: { beast: 9 } },
    'El vínculo más corto (2,8 s) y casi no ataca. La montura voladora más rápida del juego.',
    { calm: 2.8 }),
  mount: { speed: 10.0, fly: true, saddle: 'saddle_pegasus', combat: false, stam: 150, req: { lv: 14, skill: { beast: 9 } } },
  baby: { name: 'Potro alado', days: 9, scale: 0.45, chance: 0.2 }
});
sp('wyvern', {
  name: 'Wyvern', kind: 'mythic', diet: 'carnivore', faction: 'mythic',
  biomes: [8, 10], zone: 'crag', pack: [1, 1], leash: 26, elite: true,
  hp: 210, dmg: 27, def: 12, speed: 5.0, aggro: 9, reach: 1.45, xp: 96,
  behavior: 'hostile', scale: 1.6, tint: '#a8603c', flyer: true,
  prey: ['goat', 'reindeer', 'deer', 'condor', 'pegasus'],
  pattern: pat([2.0, 2.8], [1, 2], [
    mv('tail', 'melee', 0.36, 0.14, 0.5, 1.15, 1.6, { poison: 6 }),
    mv('dive', 'fly_dive', 0.7, 0.22, 0.95, 1.8, 5.2, { dash: 14, poison: 7, knock: 5 })
  ]),
  drops: [['wyvern_membrane', 1, 2, 1], ['venom_sac', 1, 2, 0.8], ['bone', 2, 3, 1], ['hide', 2, 3, 0.9]],
  tame: tm('sedate', 'mythic', 7, ['raw_game', 'roast', 'hearty_stew', 'sausage'], { skill: { beast: 8 } },
    'Veneno fuerte en cola y picado. Antídoto obligatorio. Montura voladora de combate.'),
  mount: { speed: 9.4, fly: true, saddle: 'saddle_wyvern', combat: true, stam: 145, req: { lv: 15, skill: { beast: 8 } } },
  baby: { name: 'Cría de wyvern', days: 10, scale: 0.45, chance: 0.16 }
});
sp('manticore', {
  name: 'Mantícora', kind: 'mythic', diet: 'carnivore', faction: 'mythic',
  biomes: [9, 10], zone: 'crag', pack: [1, 1], leash: 24, elite: true,
  hp: 190, dmg: 25, def: 11, speed: 4.8, aggro: 9, reach: 1.35, xp: 92,
  behavior: 'hostile', scale: 1.5, tint: '#b8603c',
  prey: ['deer', 'boar', 'goat', 'horse', 'unicorn'],
  pattern: pat([2.1, 2.9], [2, 3], [
    mv('claw', 'melee', 0.26, 0.1, 0.34, 1.05, 1.4, { bleed: 4 }),
    mv('spines', 'spit', 0.55, 0.12, 0.75, 1.2, 8.0, { proj: 'spine', count: 3, spread: 0.24 }),
    mv('roar', 'aoe', 0.6, 0.12, 0.9, 0.4, 3.6, { stagger: 0.6 })
  ]),
  drops: [['manticore_spine', 1, 3, 1], ['hide', 2, 3, 1], ['raw_game', 2, 3, 1], ['venom_sac', 1, 1, 0.4]],
  tame: tm('sedate', 'mythic', 6, ['raw_game', 'roast', 'sausage', 'hearty_stew'], { skill: { beast: 8 } },
    'Dispara tres púas a 8 tiles: cierra distancia en su descanso. Compañero de combate brutal.')
});
sp('basilisk', {
  name: 'Basilisco', kind: 'mythic', diet: 'carnivore', faction: 'mythic',
  biomes: [2], zone: 'fen', pack: [1, 1], leash: 20, elite: true,
  hp: 175, dmg: 22, def: 13, speed: 3.6, aggro: 8, reach: 1.5, xp: 88,
  behavior: 'ambush', scale: 1.5, tint: '#5a8a4a',
  prey: ['frog', 'crocodile', 'deer', 'boar'],
  pattern: pat([2.6, 3.4], [1, 2], [
    mv('gaze', 'gaze', 0.85, 0.2, 1.0, 0.3, 5.0, { slow: 0.55, slowT: 3.2 }),
    mv('fang', 'melee', 0.3, 0.12, 0.5, 1.3, 1.6, { poison: 8 })
  ]),
  drops: [['basilisk_eye', 1, 1, 0.7], ['venom_sac', 2, 3, 1], ['hydra_scale', 1, 1, 0.2], ['chitin', 1, 2, 0.6]],
  tame: tm('sedate', 'mythic', 7, ['raw_game', 'fish_void', 'antidote', 'roast'], { skill: { beast: 9 } },
    'Su mirada te ralentiza un 55 %: lleva férula o bálsamo. Curiosamente acepta antídoto como ofrenda.')
});
sp('salamander', {
  name: 'Salamandra de brasa', kind: 'mythic', diet: 'carnivore', faction: 'mythic',
  biomes: [8], zone: 'wyrm', pack: [1, 2], leash: 20,
  hp: 130, dmg: 20, def: 10, speed: 3.8, aggro: 7, reach: 1.3, xp: 62,
  behavior: 'territorial', scale: 1.25, tint: '#d0503a', fireproof: true,
  pattern: pat([2.2, 3.0], [1, 2], [
    mv('bite', 'melee', 0.3, 0.12, 0.44, 1.1, 1.35, { burn: 6 }),
    mv('ember', 'spit', 0.5, 0.12, 0.7, 1.1, 6.5, { proj: 'fire' })
  ]),
  drops: [['ember_core', 1, 2, 1], ['obsidian', 1, 1, 0.5], ['sulfur', 1, 2, 0.7], ['hide', 1, 2, 0.6]],
  tame: tm('sedate', 'mythic', 5, ['cooked_game', 'roast', 'herb_fire', 'potion_fire_res'], { skill: { beast: 6 } },
    'Inmune al fuego. Come hierba de brasa. Bálsamo ígneo antes de entrar en su territorio.')
});
sp('ember_sprite', {
  name: 'Espíritu de ascua', kind: 'mythic', diet: 'arcane', faction: 'mythic',
  biomes: [8], zone: 'caldera', pack: [2, 3], leash: 18,
  hp: 62, dmg: 14, def: 4, speed: 4.4, aggro: 8, reach: 1.1, xp: 38,
  behavior: 'hostile', scale: 0.8, tint: '#ff8a30', flyer: true, fireproof: true,
  pattern: pat([0.5, 0.9], [2, 4], [
    mv('spark', 'spit', 0.24, 0.08, 0.24, 0.7, 5.5, { proj: 'fire' }),
    mv('flare', 'melee', 0.2, 0.08, 0.26, 0.8, 1.1, { burn: 4 })
  ], true),
  drops: [['ember_core', 1, 1, 0.7], ['sulfur', 1, 1, 0.5], ['coal', 1, 2, 0.6]],
  tame: tm('sedate', 'mythic', 3, ['herb_fire', 'sulfur', 'coal', 'ember_core'], { skill: { beast: 6 } },
    'Incansable: acosa sin pausa pero pega flojo. Come carbón y azufre. Compañero que ilumina de noche.')
});
sp('willowisp', {
  name: 'Fuego fatuo', kind: 'mythic', diet: 'arcane', faction: 'mythic',
  biomes: [11], zone: 'glade', pack: [2, 4], leash: 20, nocturnal: true,
  hp: 48, dmg: 9, def: 3, speed: 4.8, aggro: 7, reach: 1.2, xp: 30,
  behavior: 'hostile', scale: 0.7, tint: '#bfe4f5', flyer: true,
  guard: { of: 'zone', radius: 20, hostileToPlayer: true },
  pattern: pat([0.6, 1.0], [2, 3], [
    mv('wisp', 'spit', 0.26, 0.08, 0.26, 0.6, 6.0, { proj: 'wisp', slow: 0.3, slowT: 1.6 }),
    mv('drain', 'melee', 0.3, 0.1, 0.3, 0.7, 1.2, { drainSt: 12 })
  ], true),
  drops: [['wisp_essence', 1, 1, 0.8], ['crystal', 1, 1, 0.25]],
  tame: tm('sedate', 'mythic', 3, ['crystal', 'wisp_essence', 'herb_blue', 'honey'], { skill: { beast: 6 } },
    'Guardián del Claro: te expulsa aunque no lo ataques. Drena stamina. Cristal o esencia para domarlo.')
});

/* ==========================================================
6 · GUARDIANES
========================================================== */
sp('cerberus', {
  name: 'Cerbero', kind: 'mythic', diet: 'carnivore', faction: 'guardian',
  biomes: [7], zone: 'barrow', pack: [1, 1], leash: 22, elite: true,
  hp: 230, dmg: 26, def: 14, speed: 4.6, aggro: 9, reach: 1.45, xp: 105,
  behavior: 'guard', scale: 1.6, tint: '#3a2030',
  guard: { of: 'zone', radius: 22, hostileToPlayer: true },
  pattern: pat([2.2, 3.0], [3, 3], [
    mv('biteL', 'melee', 0.24, 0.09, 0.24, 0.9, 1.5),
    mv('biteC', 'melee', 0.24, 0.09, 0.24, 1.0, 1.5, { burn: 5 }),
    mv('biteR', 'melee', 0.28, 0.1, 0.5, 1.1, 1.5, { poison: 5 })
  ]),
  drops: [['cerberus_fang', 1, 3, 1], ['hide', 2, 3, 1], ['bone', 2, 3, 1], ['ember_core', 1, 1, 0.3]],
  tame: tm('sedate', 'mythic', 8, ['roast', 'hearty_stew', 'sausage', 'dragon_scale'], { skill: { beast: 10 } },
    'Tres bocas: fuego, veneno y mordisco en la misma ráfaga. El mejor compañero defensivo del juego.')
});
sp('troll_kin', {
  name: 'Troll de la fortaleza', kind: 'mythic', diet: 'omnivore', faction: 'guardian',
  biomes: [5], zone: 'hold', pack: [1, 2], leash: 20,
  hp: 200, dmg: 24, def: 12, speed: 2.7, aggro: 8, reach: 1.6, xp: 78,
  behavior: 'guard', scale: 1.8, tint: '#6e9058',
  guard: { of: 'zone', radius: 20, hostileToPlayer: true },
  pattern: pat([2.8, 3.8], [1, 2], [
    mv('club', 'melee', 0.62, 0.18, 0.9, 1.4, 1.7, { knock: 5 }),
    mv('stomp', 'aoe', 0.8, 0.16, 1.1, 1.1, 3.0, { stagger: 0.7 })
  ]),
  drops: [['troll_hide', 1, 2, 1], ['stone', 4, 8, 1], ['bone', 1, 2, 0.6]],
  gold: [20, 50],
  tame: tm('sedate', 'mythic', 6, ['raw_game', 'hearty_stew', 'roast', 'stone'], { skill: { beast: 7 } },
    'Lento pero demoledor. Come carne… y piedra. Compañero tanque con muchísima vida.')
});
sp('golem', {
  name: 'Gólem de piedra', kind: 'construct', diet: 'none', faction: 'guardian',
  biomes: [], pack: [1, 1], leash: 14, construct: true,
  hp: 260, dmg: 22, def: 20, speed: 2.2, aggro: 0, reach: 1.6, xp: 70,
  behavior: 'guard', scale: 1.7, tint: '#8a8a82',
  guard: { of: 'player', radius: 14, hostileToPlayer: false },
  pattern: pat([3.0, 4.0], [1, 1], [
    mv('slam', 'aoe', 0.95, 0.2, 1.3, 1.6, 3.0, { knock: 7, stagger: 0.9 })
  ]),
  drops: [['golem_core', 1, 1, 1], ['stone', 6, 10, 1], ['iron_ore', 2, 3, 0.6]],
  build: { key: 'golem_pylon', req: { lv: 14, skill: { artisan: 6 } } }, tame: null
});
sp('gargoyle', {
  name: 'Gárgola de Vhalor', kind: 'construct', diet: 'none', faction: 'guardian',
  biomes: [], pack: [1, 1], leash: 20, nocturnal: true, construct: true,
  hp: 180, dmg: 20, def: 16, speed: 4.2, aggro: 0, reach: 1.35, xp: 60,
  behavior: 'guard', scale: 1.3, tint: '#7a7a80', flyer: true,
  guard: { of: 'city', radius: 20, hostileToPlayer: false },
  pattern: pat([2.4, 3.2], [1, 2], [
    mv('claw', 'melee', 0.3, 0.12, 0.44, 1.1, 1.4),
    mv('swoop', 'fly_dive', 0.62, 0.2, 0.85, 1.5, 4.4, { dash: 12 })
  ]),
  drops: [['golem_core', 1, 1, 0.4], ['stone', 3, 6, 1], ['obsidian', 1, 1, 0.2]],
  tame: null
});

/* ==========================================================
7 · JEFES ÚNICOS · fases por vida restante (no domables)
========================================================== */
sp('troll_king', {
  name: 'Rey Troll', kind: 'boss', diet: 'omnivore', faction: 'mythic',
  biomes: [5], zone: 'hold', pack: [1, 1], leash: 20, boss: {
    respawn: B.BOSS_RESPAWN, unique: 'troll_heart', title: 'El que corona su propia ruina',
    phases: [
      { above: 0.6, rest: [2.6, 3.4], burst: [1, 2], moves: [
        mv('club', 'melee', 0.62, 0.18, 0.9, 1.3, 1.9, { knock: 5 }),
        mv('boulder', 'spit', 0.8, 0.14, 1.0, 1.1, 9.0, { proj: 'rock' })
      ] },
      { above: 0.28, rest: [2.0, 2.8], burst: [2, 2], moves: [
        mv('club', 'melee', 0.5, 0.16, 0.72, 1.35, 1.9, { knock: 6 }),
        mv('slam', 'aoe', 0.9, 0.2, 1.15, 1.7, 3.4, { knock: 8, stagger: 0.9 }),
        mv('boulder', 'spit', 0.7, 0.14, 0.9, 1.15, 9.0, { proj: 'rock', count: 2, spread: 0.2 })
      ] },
      { above: 0, rest: [1.6, 2.2], burst: [2, 3], moves: [
        mv('rage', 'melee', 0.42, 0.16, 0.6, 1.5, 2.0, { knock: 6, guardBreak: 1 }),
        mv('quake', 'aoe', 0.85, 0.22, 1.1, 1.9, 4.4, { knock: 9, stagger: 1.1 }),
        mv('summon', 'summon', 1.1, 0.2, 1.4, 0, 0, { species: 'troll_kin', count: 1 })
      ] }
    ]
  },
  hp: 720, dmg: 28, def: 16, speed: 2.5, aggro: 10, reach: 1.9, xp: 270,
  behavior: 'hostile', scale: 2.4, tint: '#6e9058',
  pattern: pat([2.6, 3.4], [1, 2], [mv('club', 'melee', 0.62, 0.18, 0.9, 1.3, 1.9)]),
  drops: [['troll_hide', 2, 3, 1], ['stone', 6, 10, 1], ['gold_nugget', 1, 2, 0.5], ['troll_heart', 1, 1, 1]],
  gold: [80, 150], tame: null
});
sp('hydra', {
  name: 'Hidra del Pantano', kind: 'boss', diet: 'carnivore', faction: 'mythic',
  biomes: [2], zone: 'fen', pack: [1, 1], leash: 22, boss: {
    respawn: B.BOSS_RESPAWN, unique: 'hydra_fang', title: 'Tres cabezas cuentan tus pasos',
    phases: [
      { above: 0.65, rest: [2.4, 3.2], burst: [2, 3], moves: [
        mv('bite', 'melee', 0.34, 0.12, 0.44, 1.0, 2.1, { poison: 5 }),
        mv('spit', 'spit', 0.6, 0.12, 0.8, 1.0, 8.0, { proj: 'venom' })
      ] },
      { above: 0.3, rest: [2.0, 2.6], burst: [3, 3], moves: [
        mv('triple', 'melee', 0.3, 0.1, 0.36, 0.95, 2.2, { poison: 6, hits: 3 }),
        mv('pool', 'pool', 0.85, 0.16, 1.05, 0, 3.6, { hazard: 'poison', count: 3, r: 1.6, life: 9 }),
        mv('spit', 'spit', 0.55, 0.12, 0.7, 1.05, 8.0, { proj: 'venom', count: 2, spread: 0.22 })
      ] },
      { above: 0, rest: [1.7, 2.3], burst: [3, 4], moves: [
        mv('frenzy', 'melee', 0.26, 0.1, 0.3, 1.0, 2.3, { poison: 8, hits: 3 }),
        mv('deluge', 'pool', 0.8, 0.18, 1.0, 0, 4.2, { hazard: 'poison', count: 5, r: 1.8, life: 10 }),
        mv('regen', 'heal', 1.2, 0.2, 1.5, 0, 0, { healPct: 0.05 })
      ] }
    ]
  },
  hp: 980, dmg: 24, def: 15, speed: 2.1, aggro: 10, reach: 2.1, xp: 340,
  behavior: 'hostile', scale: 2.6, tint: '#4e8046',
  pattern: pat([2.4, 3.2], [2, 3], [mv('bite', 'melee', 0.34, 0.12, 0.44, 1.0, 2.1, { poison: 5 })]),
  drops: [['venom_sac', 2, 3, 1], ['hydra_scale', 2, 3, 1], ['bone', 3, 5, 1], ['hydra_fang', 1, 1, 1]],
  gold: [100, 180], tame: null
});
sp('phoenix', {
  name: 'Fénix Cenizo', kind: 'boss', diet: 'arcane', faction: 'mythic',
  biomes: [8], zone: 'caldera', pack: [1, 1], leash: 24, fireproof: true, boss: {
    respawn: B.BOSS_RESPAWN, unique: 'phoenix_feather', title: 'El fuego recuerda haber sido ave',
    phases: [
      { above: 0.6, rest: [2.2, 3.0], burst: [1, 2], moves: [
        mv('talon', 'melee', 0.3, 0.12, 0.44, 1.1, 1.6, { burn: 6 }),
        mv('ember', 'spit', 0.5, 0.12, 0.7, 1.0, 8.5, { proj: 'fire', count: 2, spread: 0.18 })
      ] },
      { above: 0.3, rest: [1.9, 2.6], burst: [2, 2], moves: [
        mv('nova', 'aoe', 0.8, 0.18, 1.05, 1.5, 5.0, { burn: 8, ring: 12 }),
        mv('dive', 'fly_dive', 0.66, 0.22, 0.9, 1.8, 5.4, { dash: 15, burn: 9, knock: 5 }),
        mv('ember', 'spit', 0.45, 0.12, 0.62, 1.05, 8.5, { proj: 'fire', count: 3, spread: 0.22 })
      ] },
      { above: 0, rest: [1.6, 2.2], burst: [2, 3], moves: [
        mv('inferno', 'aoe', 0.75, 0.2, 1.0, 1.8, 5.6, { burn: 11, ring: 16 }),
        mv('dive', 'fly_dive', 0.55, 0.2, 0.78, 1.9, 5.6, { dash: 17, burn: 10 }),
        mv('rebirth', 'heal', 1.4, 0.2, 1.6, 0, 0, { healPct: 0.08, once: true })
      ] }
    ]
  },
  hp: 820, dmg: 22, def: 13, speed: 4.2, aggro: 11, reach: 1.6, xp: 320,
  behavior: 'hostile', scale: 2.0, tint: '#f07830', flyer: true,
  pattern: pat([2.2, 3.0], [1, 2], [mv('talon', 'melee', 0.3, 0.12, 0.44, 1.1, 1.6, { burn: 6 })]),
  drops: [['ember_core', 2, 3, 1], ['feather', 3, 5, 1], ['obsidian', 1, 2, 0.5], ['phoenix_feather', 1, 1, 1]],
  gold: [120, 200], tame: null
});
sp('fenrir', {
  name: 'Fenrir, el Encadenado', kind: 'boss', diet: 'carnivore', faction: 'mythic',
  biomes: [7], zone: 'barrow', pack: [1, 1], leash: 24, nocturnal: true, boss: {
    respawn: B.BOSS_RESPAWN, unique: 'fenrir_chain', title: 'Algo con tres gargantas respira bajo la tierra',
    phases: [
      { above: 0.65, rest: [1.9, 2.6], burst: [2, 3], moves: [
        mv('rend', 'melee', 0.24, 0.1, 0.3, 1.1, 1.6, { bleed: 6 }),
        mv('lunge', 'dash', 0.44, 0.16, 0.6, 1.5, 3.4, { dash: 11 })
      ] },
      { above: 0.32, rest: [1.6, 2.2], burst: [3, 3], moves: [
        mv('rend', 'melee', 0.2, 0.09, 0.26, 1.15, 1.7, { bleed: 8 }),
        mv('howl', 'aoe', 0.6, 0.14, 0.85, 0.6, 4.6, { stagger: 0.7 }),
        mv('shadow', 'dash', 0.4, 0.16, 0.55, 1.6, 4.0, { dash: 14, pierce: true })
      ] },
      { above: 0, rest: [1.3, 1.9], burst: [3, 4], moves: [
        mv('devour', 'melee', 0.22, 0.1, 0.28, 1.35, 1.8, { bleed: 10, lifesteal: 0.25 }),
        mv('chain', 'aoe', 0.7, 0.18, 0.95, 1.7, 4.8, { slow: 0.5, slowT: 3 }),
        mv('summon', 'summon', 0.9, 0.2, 1.2, 0, 0, { species: 'shadow_hound', count: 2 })
      ] }
    ]
  },
  hp: 1050, dmg: 30, def: 17, speed: 5.4, aggro: 11, reach: 1.7, xp: 400,
  behavior: 'hostile', scale: 2.3, tint: '#241a30',
  pattern: pat([1.9, 2.6], [2, 3], [mv('rend', 'melee', 0.24, 0.1, 0.3, 1.1, 1.6, { bleed: 6 })]),
  drops: [['fenrir_pelt', 1, 2, 1], ['warg_fang', 2, 3, 1], ['crystal', 2, 3, 1], ['fenrir_chain', 1, 1, 1]],
  gold: [150, 260], tame: null
});
sp('jotun_frost', {
  name: 'Jotun de Escarcha', kind: 'boss', diet: 'omnivore', faction: 'mythic',
  biomes: [4], zone: 'frost', pack: [1, 1], leash: 22, iceproof: true, boss: {
    respawn: B.BOSS_RESPAWN, unique: 'jotun_crown', title: 'El hielo le ha crecido por la barba',
    phases: [
      { above: 0.6, rest: [2.8, 3.6], burst: [1, 2], moves: [
        mv('fist', 'melee', 0.7, 0.2, 1.0, 1.4, 2.1, { knock: 6, slow: 0.3, slowT: 2 }),
        mv('hail', 'spit', 0.8, 0.14, 1.0, 1.1, 9.0, { proj: 'ice', count: 2, spread: 0.2 })
      ] },
      { above: 0.3, rest: [2.2, 3.0], burst: [2, 2], moves: [
        mv('fist', 'melee', 0.6, 0.18, 0.85, 1.45, 2.2, { knock: 7, slow: 0.4, slowT: 2.4 }),
        mv('blizzard', 'aoe', 1.0, 0.22, 1.25, 1.6, 5.2, { slow: 0.55, slowT: 3.4, ring: 10 }),
        mv('hail', 'spit', 0.7, 0.14, 0.9, 1.15, 9.0, { proj: 'ice', count: 3, spread: 0.24 })
      ] },
      { above: 0, rest: [1.8, 2.4], burst: [2, 3], moves: [
        mv('glacier', 'aoe', 0.95, 0.24, 1.2, 2.0, 5.6, { slow: 0.65, slowT: 4, knock: 9 }),
        mv('fist', 'melee', 0.5, 0.16, 0.7, 1.55, 2.3, { guardBreak: 1, knock: 8 }),
        mv('wall', 'summon', 1.1, 0.2, 1.4, 0, 0, { species: 'polar_bear', count: 1 })
      ] }
    ]
  },
  hp: 1150, dmg: 30, def: 20, speed: 2.2, aggro: 10, reach: 2.2, xp: 420,
  behavior: 'hostile', scale: 2.7, tint: '#cfe6f4',
  pattern: pat([2.8, 3.6], [1, 2], [mv('fist', 'melee', 0.7, 0.2, 1.0, 1.4, 2.1, { knock: 6 })]),
  drops: [['jotun_ice', 1, 2, 1], ['frost_core', 2, 3, 1], ['ice_shard', 4, 8, 1], ['jotun_crown', 1, 1, 1]],
  gold: [160, 280], tame: null
});
sp('dragon_ember', {
  name: 'Dragón de la Falla', kind: 'boss', diet: 'carnivore', faction: 'mythic',
  biomes: [8], zone: 'wyrm', pack: [1, 1], leash: 26, fireproof: true, boss: {
    respawn: B.BOSS_RESPAWN + 2, unique: 'dragon_heart', title: 'Duerme con un ojo abierto',
    phases: [
      { above: 0.7, rest: [2.6, 3.4], burst: [1, 2], moves: [
        mv('claw', 'melee', 0.42, 0.14, 0.6, 1.3, 2.0, { knock: 5 }),
        mv('breath', 'gaze', 0.9, 0.35, 1.1, 1.2, 6.0, { burn: 9, cone: 0.7 })
      ] },
      { above: 0.4, rest: [2.2, 2.9], burst: [2, 2], moves: [
        mv('claw', 'melee', 0.36, 0.12, 0.5, 1.35, 2.1, { knock: 6 }),
        mv('breath', 'gaze', 0.8, 0.35, 1.0, 1.35, 6.5, { burn: 11, cone: 0.8 }),
        mv('wing', 'aoe', 0.7, 0.18, 0.95, 1.4, 4.6, { knock: 9, stagger: 0.8 })
      ] },
      { above: 0.15, rest: [1.9, 2.5], burst: [2, 3], moves: [
        mv('tail', 'melee', 0.34, 0.14, 0.48, 1.5, 2.4, { knock: 8 }),
        mv('meteor', 'pool', 0.95, 0.2, 1.15, 1.6, 5.0, { hazard: 'fire', count: 4, r: 1.7, life: 8 }),
        mv('breath', 'gaze', 0.7, 0.35, 0.9, 1.5, 7.0, { burn: 13, cone: 0.9 })
      ] },
      { above: 0, rest: [1.5, 2.0], burst: [3, 3], moves: [
        mv('cataclysm', 'aoe', 0.9, 0.24, 1.1, 2.1, 6.2, { burn: 15, ring: 18, knock: 10 }),
        mv('devour', 'melee', 0.3, 0.12, 0.4, 1.7, 2.4, { guardBreak: 1, lifesteal: 0.2 }),
        mv('meteor', 'pool', 0.85, 0.2, 1.0, 1.7, 5.4, { hazard: 'fire', count: 6, r: 1.9, life: 9 })
      ] }
    ]
  },
  hp: 1600, dmg: 36, def: 24, speed: 3.2, aggro: 12, reach: 2.4, xp: 620,
  behavior: 'hostile', scale: 3.0, tint: '#c8402a', flyer: true,
  pattern: pat([2.6, 3.4], [1, 2], [mv('claw', 'melee', 0.42, 0.14, 0.6, 1.3, 2.0)]),
  drops: [['dragon_scale', 2, 3, 1], ['obsidian', 3, 5, 1], ['ember_core', 3, 4, 1], ['dragon_heart', 1, 1, 1]],
  gold: [250, 420], tame: null
});

/* ==========================================================
8 · SEÑUELO UNIVERSAL + NORMALIZACIÓN DE TODOS LOS TAMEOS
Garantiza que ninguna especie domable se quede sin comida
disponible: el señuelo se hace a mano y vale para su dieta.
========================================================== */
let lureAdded = 0, tameCount = 0;
Object.keys(D.SPECIES).forEach(function (id) {
  const s = D.SPECIES[id];
  s.id = id;
  if (!s.tame) return;
  tameCount++;
  const t = s.tame;
  const diet = D.DIETS[s.diet] || D.DIETS.none;
  /* Señuelo según dieta */
  if (diet.lure === 'both') {
    if (t.foods.indexOf('feed_tame') < 0) { t.foods.push('feed_tame'); lureAdded++; }
    if (t.foods.indexOf('meat_lure') < 0) { t.foods.push('meat_lure'); lureAdded++; }
  } else if (diet.lure && t.foods.indexOf(diet.lure) < 0) {
    t.foods.push(diet.lure); lureAdded++;
  }
  /* Defaults v5 */
  if (t.perLevel === undefined) t.perLevel = 1;
  if (t.babyBonus === undefined) t.babyBonus = 0.5;
  if (t.fromBaby === undefined) t.fromBaby = false;
  if (!t.tier) t.tier = 'docile';
  if (!TIER_BY[t.tier]) t.tier = 'docile';
  if (!t.method) t.method = 'feed';
  /* Los domésticos nunca piden Afinidad */
  if (t.tier === 'domestic') t.req = null;
  /* Dieta legible para la guía */
  s.dietName = diet.name;
  s.dietGlyph = diet.glyph;
});

/* ==========================================================
9 · ÍNDICES DE ECOLOGÍA
========================================================== */
const PREDATORS = [], PREY = [], MYTHIC = [], GUARDIANS = [], BOSSES = [], LIVEST = [], TAMEABLE = [];
Object.keys(D.SPECIES).forEach(function (id) {
  const s = D.SPECIES[id];
  if (s.kind === 'boss') BOSSES.push(id);
  else if (s.kind === 'livestock') LIVEST.push(id);
  else if (s.faction === 'guardian') GUARDIANS.push(id);
  else if (s.kind === 'mythic') MYTHIC.push(id);
  if (s.diet === 'carnivore' || s.diet === 'omnivore') PREDATORS.push(id);
  if (s.diet === 'herbivore' || s.diet === 'insectivore') PREY.push(id);
  if (s.tame) TAMEABLE.push(id);
});
D.ECO = {
  predators: PREDATORS, prey: PREY, mythic: MYTHIC,
  guardians: GUARDIANS, bosses: BOSSES, livestock: LIVEST, tameable: TAMEABLE,
  hunts: function (a, b) {
    if (!a || !b || a === b) return false;
    const A2 = D.SPECIES[a], B2 = D.SPECIES[b];
    if (!A2 || !B2) return false;
    if (A2.prey && A2.prey.indexOf(b) >= 0) return true;
    const diet = D.DIETS[A2.diet];
    return !!(diet && diet.hunts && diet.hunts.indexOf(B2.diet) >= 0);
  },
  fears: function (a, b) {
    if (!a || !b) return false;
    const A2 = D.SPECIES[a], B2 = D.SPECIES[b];
    if (!A2 || !B2) return false;
    if (A2.fears && A2.fears.indexOf(b) >= 0) return true;
    const diet = D.DIETS[A2.diet];
    return !!(diet && diet.flees && diet.flees.indexOf(B2.diet) >= 0 && B2.scale >= A2.scale * 0.85);
  },
  bossPhase: function (s, hpFrac) {
    if (!s.boss || !s.boss.phases) return null;
    const ph = s.boss.phases;
    for (let i = 0; i < ph.length; i++) if (hpFrac > ph[i].above) return ph[i];
    return ph[ph.length - 1];
  }
};

/* ==========================================================
10 · GUÍA DE DOMA (la consume ui.js en Ajustes → Cómo jugar)
Una fila por animal: qué come, cuántas veces, cómo y dónde.
========================================================== */
function foodNames(list) {
  const out = [];
  for (let i = 0; i < list.length; i++) {
    const it = D.ITEMS[list[i]];
    out.push(it ? it.name : list[i]);
  }
  return out;
}
function whereText(s) {
  if (s.kind === 'boss') return 'Jefe único de su santuario';
  if (s.zone) {
    const z = D.ZONE_BY_ID[s.zone];
    return z ? z.name : 'Santuario';
  }
  if (!s.biomes || !s.biomes.length) return 'Solo en tu granja (compra el animal en la Intendencia)';
  const out = [];
  for (let i = 0; i < s.biomes.length && i < 4; i++) {
    const b = D.BIOMES[s.biomes[i]];
    if (b) out.push(b.name);
  }
  return out.join(', ') + (s.nocturnal ? ' · de noche' : '');
}
D.TAME_GUIDE = Object.keys(D.SPECIES).map(function (id) {
  const s = D.SPECIES[id];
  const t = s.tame;
  const tier = t ? TIER_BY[t.tier] : null;
  return {
    id: id, name: s.name, scale: s.scale || 1,
    diet: s.dietName || (D.DIETS[s.diet] || D.DIETS.none).name,
    dietGlyph: s.dietGlyph || 'info',
    tameable: !!t,
    tier: t ? t.tier : 'none',
    tierName: tier ? tier.name : 'No domable',
    tierOrder: tier ? tier.order : 9,
    method: t ? t.method : null,
    methodName: t && D.TAME_METHODS[t.method] ? D.TAME_METHODS[t.method].name : '—',
    foods: t ? t.foods : [],
    foodNames: t ? foodNames(t.foods) : [],
    feeds: t ? t.feeds : 0,
    babyFeeds: t ? Math.max(1, Math.ceil(t.feeds * (t.babyBonus || 0.5))) : 0,
    calm: t && t.calm ? t.calm : 0,
    req: t ? t.req : null,
    reqText: t && t.req ? D.reqText(t.req) : 'Sin requisito',
    note: t ? t.note : (s.kind === 'boss' ? 'Los jefes no se doman: se cazan por su botín único.'
      : (s.kind === 'construct' ? 'Los constructos se invocan con un pilón o una repisa, no se doman.'
        : 'No acepta comida: es hostile por naturaleza.')),
    where: whereText(s),
    mount: !!s.mount,
    mountReq: s.mount && s.mount.req ? D.reqText(s.mount.req) : '',
    fly: !!(s.mount && s.mount.fly),
    livestock: !!s.livestock,
    product: s.livestock && D.ITEMS[s.livestock.product] ? D.ITEMS[s.livestock.product].name : ''
  };
}).sort(function (a, b) {
  if (a.tierOrder !== b.tierOrder) return a.tierOrder - b.tierOrder;
  return a.name.localeCompare(b.name, 'es');
});
/* Resumen por nivel para la cabecera de la guía */
D.TAME_GUIDE_SUMMARY = D.TAME_TIERS.map(function (t) {
  let n = 0;
  for (let i = 0; i < D.TAME_GUIDE.length; i++) if (D.TAME_GUIDE[i].tier === t.id) n++;
  return { id: t.id, name: t.name, glyph: t.glyph, desc: t.desc, count: n };
});

console.info('[CR] data-species.js v5 · ' + Object.keys(D.SPECIES).length + ' especies · ' +
  tameCount + ' domables (' + lureAdded + ' señuelos universales añadidos) · ' +
  PREDATORS.length + ' depredadores · ' + PREY.length + ' presas · ' + MYTHIC.length + ' míticas · ' +
  GUARDIANS.length + ' guardianes · ' + BOSSES.length + ' jefes con fases · ' + LIVEST.length + ' de ganado');
console.info('[CR] guía de doma · ' + D.TAME_GUIDE.length + ' filas · ' +
  D.TAME_GUIDE_SUMMARY.map(function (t) { return t.name + ': ' + t.count; }).join(' · '));
})();