/* ============================================================
KANATO DE JOTUN · data-species.js — Bestiario v3 (parte 3 de 4)
Cada especie declara:
 · diet + faction  → el director separa carnívoros de herbívoros
                     y la IA sabe a quién cazar y de quién huir.
 · pack            → tamaño de manada al aparecer.
 · zone + leash    → santuario exclusivo y radio de territorio.
 · pattern         → ráfaga de golpes con telegrafía y DESCANSO.
                     Solo unas pocas criaturas son incansables.
 · tame / mount    → método, comidas y requisito de Afinidad.
 · guard           → a quién protege (ciudad, santuario o jugador).
 · boss.phases     → los jefes cambian de patrón al perder vida.
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
  herbivore: { name: 'Herbívoro', glyph: 'role_farm', flees: ['carnivore', 'omnivore'] },
  carnivore: { name: 'Carnívoro', glyph: 'sword', hunts: ['herbivore', 'insectivore'] },
  omnivore:  { name: 'Omnívoro',  glyph: 'food', hunts: ['herbivore', 'insectivore'], flees: [] },
  insectivore: { name: 'Insectívoro', glyph: 'poison', flees: ['carnivore', 'omnivore'] },
  scavenger: { name: 'Carroñero', glyph: 'material', flees: ['carnivore'] },
  arcane:    { name: 'Arcano',    glyph: 'star', hunts: [], flees: [] },
  none:      { name: 'Sin dieta', glyph: 'role_idle', hunts: [], flees: [] }
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
/** Constructor de golpe: telegrafía → activo → recuperación. */
function mv(id, kind, wind, active, recover, mul, range, extra) {
  const m = { id: id, kind: kind, wind: wind, active: active, recover: recover, mul: mul, range: range };
  if (extra) for (const k in extra) m[k] = extra[k];
  return m;
}
/** Constructor de patrón: cuántos golpes por ráfaga y cuánto descansa. */
function pat(rest, burst, moves, relentless) {
  return { rest: rest, burst: burst, moves: moves, relentless: !!relentless };
}
D.makeMove = mv; D.makePattern = pat;

/* ==========================================================
1 · PRESAS Y HERBÍVOROS
   Huyen de los depredadores; se agrupan en manadas.
========================================================== */
sp('deer', {
  name: 'Ciervo', kind: 'beast', diet: 'herbivore', faction: 'prey',
  biomes: [0, 1, 11], pack: [3, 5], leash: 14,
  hp: 48, dmg: 5, def: 2, speed: 5.2, aggro: 7, reach: 0.9, xp: 14,
  behavior: 'skittish', scale: 1.1, tint: '#b07c48',
  fears: ['wolf', 'lynx', 'bear', 'warg', 'manticore'],
  pattern: pat([2.4, 3.4], [1, 1], [mv('kick', 'melee', 0.34, 0.12, 0.6, 1.0, 1.0)]),
  drops: [['hide', 1, 2, 1], ['raw_game', 1, 2, 1], ['bone', 1, 1, 0.4]],
  tame: { method: 'feed', foods: ['apple', 'crop_carrot', 'hay', 'feed_good'], feeds: 3, perLevel: 1, fromBaby: false, req: { skill: { beast: 1 } } },
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
  tame: { method: 'feed', foods: ['apple', 'hay', 'crop_carrot', 'crop_maca'], feeds: 4, perLevel: 1, fromBaby: false, req: { skill: { beast: 2 } } },
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
  tame: { method: 'feed', foods: ['crop_carrot', 'crop_lettuce', 'berry'], feeds: 2, perLevel: 1, fromBaby: false, req: { skill: { beast: 1 } } }
});
sp('horse', {
  name: 'Caballo salvaje', kind: 'beast', diet: 'herbivore', faction: 'prey',
  biomes: [0], pack: [3, 5], leash: 18,
  hp: 66, dmg: 5, def: 2, speed: 5.0, aggro: 5, reach: 0.9, xp: 12,
  behavior: 'skittish', scale: 1.2, tint: '#8e6444',
  fears: ['wolf', 'bear', 'warg'],
  pattern: pat([2.6, 3.6], [1, 2], [mv('kick', 'melee', 0.36, 0.12, 0.55, 1.0, 1.05)]),
  drops: [['hide', 1, 2, 1], ['raw_meat', 1, 2, 1]],
  tame: { method: 'feed', foods: ['apple', 'crop_carrot', 'hay', 'feed_good'], feeds: 4, perLevel: 1, fromBaby: false, req: { skill: { beast: 1 } } },
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
  tame: { method: 'feed', foods: ['hay', 'crop_wheat', 'crop_sunflower', 'feed_good'], feeds: 4, perLevel: 1, fromBaby: false, req: { skill: { beast: 1 } } },
  mount: { speed: 7.1, fly: false, saddle: 'saddle_camel', combat: false, stam: 150, req: { lv: 3, skill: { beast: 1 } } }
});
sp('llama', {
  name: 'Llama', kind: 'beast', diet: 'herbivore', faction: 'neutral',
  biomes: [5], pack: [3, 5], leash: 14,
  hp: 74, dmg: 5, def: 3, speed: 4.1, aggro: 3, reach: 1.0, xp: 18,
  behavior: 'passive', scale: 1.2, tint: '#dccca8',
  pattern: pat([2.6, 3.4], [1, 2], [mv('spit', 'spit', 0.42, 0.1, 0.6, 0.5, 4.0, { proj: 'spit' })]),
  drops: [['wool', 1, 2, 1], ['raw_meat', 1, 2, 1], ['hide', 1, 1, 0.7]],
  tame: { method: 'feed', foods: ['hay', 'crop_quinoa', 'crop_corn'], feeds: 3, perLevel: 1, fromBaby: false, req: { skill: { beast: 1 } } },
  mount: { speed: 6.2, fly: false, saddle: 'saddle_llama', combat: false, stam: 110, req: { lv: 3, skill: { beast: 1 } } }
});
sp('goat', {
  name: 'Cabra montés', kind: 'beast', diet: 'herbivore', faction: 'neutral',
  biomes: [5, 10], pack: [3, 5], leash: 12,
  hp: 54, dmg: 8, def: 3, speed: 4.5, aggro: 4, reach: 1.0, xp: 16,
  behavior: 'territorial', scale: 0.9, tint: '#a89880',
  pattern: pat([2.0, 2.8], [1, 2], [mv('ram', 'dash', 0.42, 0.16, 0.6, 1.2, 2.2, { dash: 5 })]),
  drops: [['hide', 1, 1, 1], ['raw_meat', 1, 2, 1], ['bone', 1, 1, 0.4]],
  tame: { method: 'feed', foods: ['hay', 'crop_wheat', 'crop_maca'], feeds: 3, perLevel: 1, fromBaby: true, req: { skill: { beast: 1 } } },
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
  tame: { method: 'sedate', foods: ['hay', 'crop_corn', 'crop_wheat', 'feed_golden'], feeds: 4, perLevel: 2, fromBaby: false, req: { skill: { beast: 3 } } },
  mount: { speed: 6.4, fly: false, saddle: 'saddle_bison', combat: true, stam: 160, req: { lv: 5, skill: { beast: 3 } } }
});
sp('turtle', {
  name: 'Tortuga', kind: 'beast', diet: 'herbivore', faction: 'prey',
  biomes: [6], pack: [1, 3], leash: 6,
  hp: 95, dmg: 0, def: 14, speed: 1.4, aggro: 0, reach: 0.5, xp: 9,
  behavior: 'passive', scale: 0.8, tint: '#4e9250',
  pattern: pat([3.4, 4.4], [1, 1], [mv('snap', 'melee', 0.5, 0.1, 0.8, 0.5, 0.7)]),
  drops: [['crab_shell', 1, 2, 1], ['raw_meat', 1, 1, 0.8]],
  tame: { method: 'feed', foods: ['crop_lettuce', 'berry', 'crop_cabbage'], feeds: 2, perLevel: 1, fromBaby: false, req: { skill: { beast: 1 } } }
});
sp('seal', {
  name: 'Foca', kind: 'beast', diet: 'carnivore', faction: 'prey',
  biomes: [6], pack: [2, 4], leash: 9,
  hp: 64, dmg: 6, def: 3, speed: 2.9, aggro: 0, reach: 0.9, xp: 12,
  behavior: 'passive', scale: 1.0, tint: '#8e939c',
  prey: [], fears: ['polar_bear', 'crocodile'],
  pattern: pat([2.8, 3.8], [1, 1], [mv('bite', 'melee', 0.34, 0.1, 0.6, 0.8, 1.0)]),
  drops: [['hide', 1, 2, 1], ['raw_meat', 1, 2, 1], ['oil', 1, 1, 0.3]],
  tame: { method: 'feed', foods: ['fish_sardine', 'fish_trout', 'grilled_fish'], feeds: 3, perLevel: 1, fromBaby: true, req: { skill: { beast: 1 } } },
  baby: { name: 'Cría de foca', days: 3, scale: 0.5, chance: 0.3 }
});
sp('frog', {
  name: 'Rana gigante', kind: 'beast', diet: 'insectivore', faction: 'neutral',
  biomes: [2, 9], pack: [3, 5], leash: 8,
  hp: 24, dmg: 5, def: 1, speed: 3.9, aggro: 3, reach: 0.8, xp: 7,
  behavior: 'territorial', scale: 0.8, tint: '#5cb04a',
  fears: ['crocodile', 'basilisk', 'lynx'],
  pattern: pat([1.8, 2.6], [1, 2], [mv('tongue', 'melee', 0.24, 0.1, 0.42, 0.9, 1.8)]),
  drops: [['raw_meat', 1, 1, 0.8], ['venom_sac', 1, 1, 0.12]]
});

/* ==========================================================
2 · DEPREDADORES
   Cazan herbívoros e insectívoros. Ráfaga corta + descanso.
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
  tame: { method: 'sedate', foods: ['raw_meat', 'cooked_meat', 'raw_game', 'dried_meat'], feeds: 4, perLevel: 2, fromBaby: true, req: { skill: { beast: 3 } } },
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
  tame: { method: 'feed', foods: ['fish_sardine', 'fish_trout', 'cooked_fish', 'raw_poultry'], feeds: 3, perLevel: 1, fromBaby: true, req: { skill: { beast: 2 } } },
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
  tame: { method: 'feed', foods: ['raw_meat', 'egg', 'berry', 'raw_poultry'], feeds: 3, perLevel: 1, fromBaby: true, req: { skill: { beast: 1 } } },
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
  tame: { method: 'feed', foods: ['berry', 'apple', 'crop_carrot', 'crop_beet'], feeds: 3, perLevel: 1, fromBaby: true, req: { skill: { beast: 2 } } },
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
  tame: { method: 'sedate', foods: ['berry', 'honey', 'fish_trout', 'hearty_stew'], feeds: 4, perLevel: 2, fromBaby: false, req: { skill: { beast: 4 } } },
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
  tame: { method: 'sedate', foods: ['fish_ice', 'fish_trout', 'raw_game', 'smoked_fish'], feeds: 5, perLevel: 2, fromBaby: false, req: { skill: { beast: 5 } } },
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
  drops: [['hide', 2, 3, 1], ['raw_meat', 1, 2, 1], ['bone', 1, 1, 0.5], ['chitin', 1, 1, 0.2]]
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
  drops: [['chitin', 1, 1, 0.8], ['venom_sac', 1, 1, 0.35], ['raw_meat', 1, 1, 0.3]]
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
  drops: [['chitin', 1, 2, 0.8], ['sand', 2, 3, 1], ['venom_sac', 1, 1, 0.25], ['flint', 1, 2, 0.6]]
});
sp('crab', {
  name: 'Cangrejo', kind: 'beast', diet: 'scavenger', faction: 'neutral',
  biomes: [6], pack: [3, 5], leash: 7,
  hp: 28, dmg: 6, def: 8, speed: 2.1, aggro: 3, reach: 0.85, xp: 9,
  behavior: 'territorial', scale: 0.7, tint: '#e0603c',
  pattern: pat([1.8, 2.6], [1, 2], [mv('pincer', 'melee', 0.3, 0.1, 0.45, 1.0, 0.9)]),
  drops: [['crab_shell', 1, 1, 1], ['raw_meat', 1, 1, 0.7], ['salt', 1, 1, 0.2]]
});

/* ==========================================================
3 · GANADO DOMÉSTICO
   Sin agresión; produce si se alimenta. Vive en el corral.
========================================================== */
const LIVESTOCK = [
  ['chicken', 'Gallina', 16, 0.6, '#f8f0e0', 'egg', 1, [1, 2], 'feather',
    [['raw_poultry', 1, 1, 1], ['feather', 1, 2, 0.8]]],
  ['duck', 'Pato', 15, 0.6, '#f0e8d4', 'egg', 1, [1, 2], 'feather',
    [['raw_poultry', 1, 1, 1], ['feather', 1, 2, 0.9]]],
  ['sheep', 'Oveja', 44, 1.0, '#f8f4ea', 'wool', 2, [1, 2], 'manure',
    [['wool', 1, 1, 1], ['raw_meat', 1, 2, 1], ['hide', 1, 1, 0.7]]],
  ['alpaca', 'Alpaca', 58, 1.1, '#f4ecdc', 'wool', 2, [2, 3], 'manure',
    [['wool', 1, 2, 1], ['raw_meat', 1, 2, 1], ['hide', 1, 1, 0.7]]],
  ['cow', 'Vaca', 56, 1.3, '#f6f2e8', 'milk', 1, [1, 2], 'manure',
    [['raw_meat', 2, 3, 1], ['hide', 1, 2, 1], ['milk', 1, 1, 0.5]]],
  ['nanny', 'Cabra lechera', 44, 0.9, '#f6f0e4', 'milk', 1, [1, 1], 'manure',
    [['raw_meat', 1, 2, 1], ['hide', 1, 1, 0.7], ['milk', 1, 1, 0.5]]],
  ['pig', 'Cerdo', 48, 1.0, '#f0b4ac', 'truffle', 2, [1, 1], 'manure',
    [['raw_meat', 2, 3, 1], ['hide', 1, 1, 0.6], ['bone', 1, 1, 0.4]]]
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
    tame: null
  });
});

/* ==========================================================
4 · NO-MUERTOS Y BANDIDOS
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
  gold: [4, 14]
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
  gold: [15, 45]
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
  drops: []
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
  gold: [10, 30]
});

/* ==========================================================
5 · MÍTICOS SALVAJES Y MONTURAS
   Cada uno nace SOLO en su santuario (zone) y no lo abandona.
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
  tame: { method: 'sedate', foods: ['raw_game', 'cooked_game', 'hearty_stew', 'sausage'], feeds: 5, perLevel: 2, fromBaby: true, req: { skill: { beast: 5 } } },
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
  tame: { method: 'sedate', foods: ['raw_game', 'cooked_game', 'dried_meat'], feeds: 4, perLevel: 2, fromBaby: false, req: { skill: { beast: 5 } } }
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
  tame: { method: 'sedate', foods: ['apple', 'crop_carrot', 'maca_porridge', 'feed_golden'], feeds: 6, perLevel: 2, fromBaby: false, req: { skill: { beast: 8 } } },
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
  tame: { method: 'sedate', foods: ['raw_game', 'fish_trout', 'grilled_fish', 'roast'], feeds: 6, perLevel: 2, fromBaby: true, req: { skill: { beast: 7 } } },
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
  tame: { method: 'sedate', foods: ['raw_game', 'fish_trout', 'cooked_game'], feeds: 5, perLevel: 2, fromBaby: false, req: { skill: { beast: 7 } } },
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
  tame: { method: 'bond', foods: ['apple', 'crop_strawberry', 'honey_cake', 'herb_blue'], feeds: 6, perLevel: 1, fromBaby: false, calm: 3.2, req: { skill: { beast: 9 } } },
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
  tame: { method: 'bond', foods: ['crop_maca', 'maca_tonic', 'herb_blue', 'honey_cake'], feeds: 6, perLevel: 1, fromBaby: false, calm: 3.4, req: { skill: { beast: 9 } } },
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
  tame: { method: 'bond', foods: ['apple', 'crop_carrot', 'honey_cake', 'feed_golden'], feeds: 5, perLevel: 1, fromBaby: false, calm: 2.8, req: { skill: { beast: 9 } } },
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
  tame: { method: 'sedate', foods: ['raw_game', 'roast', 'hearty_stew', 'sausage'], feeds: 7, perLevel: 2, fromBaby: true, req: { skill: { beast: 8 } } },
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
  drops: [['manticore_spine', 1, 3, 1], ['hide', 2, 3, 1], ['raw_game', 2, 3, 1], ['venom_sac', 1, 1, 0.4]]
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
  tame: { method: 'sedate', foods: ['raw_game', 'fish_void', 'antidote', 'roast'], feeds: 7, perLevel: 2, fromBaby: false, req: { skill: { beast: 9 } } }
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
  tame: { method: 'sedate', foods: ['cooked_game', 'roast', 'herb_fire', 'potion_fire_res'], feeds: 5, perLevel: 2, fromBaby: false, req: { skill: { beast: 6 } } }
});
sp('ember_sprite', {
  name: 'Espíritu de ascua', kind: 'mythic', diet: 'arcane', faction: 'mythic',
  biomes: [8], zone: 'caldera', pack: [2, 3], leash: 18,
  hp: 62, dmg: 14, def: 4, speed: 4.4, aggro: 8, reach: 1.1, xp: 38,
  behavior: 'hostile', scale: 0.8, tint: '#ff8a30', flyer: true, fireproof: true,
  /* Uno de los pocos INCANSABLES: acosa sin descanso, pero golpea flojo. */
  pattern: pat([0.5, 0.9], [2, 4], [
    mv('spark', 'spit', 0.24, 0.08, 0.24, 0.7, 5.5, { proj: 'fire' }),
    mv('flare', 'melee', 0.2, 0.08, 0.26, 0.8, 1.1, { burn: 4 })
  ], true),
  drops: [['ember_core', 1, 1, 0.7], ['sulfur', 1, 1, 0.5], ['coal', 1, 2, 0.6]]
});
sp('willowisp', {
  name: 'Fuego fatuo', kind: 'mythic', diet: 'arcane', faction: 'mythic',
  biomes: [11], zone: 'glade', pack: [2, 4], leash: 20, nocturnal: true,
  hp: 48, dmg: 9, def: 3, speed: 4.8, aggro: 7, reach: 1.2, xp: 30,
  behavior: 'hostile', scale: 0.7, tint: '#bfe4f5', flyer: true,
  guard: { of: 'zone', radius: 20, hostileToPlayer: true },
  /* También incansable: confunde y desorienta sin parar. */
  pattern: pat([0.6, 1.0], [2, 3], [
    mv('wisp', 'spit', 0.26, 0.08, 0.26, 0.6, 6.0, { proj: 'wisp', slow: 0.3, slowT: 1.6 }),
    mv('drain', 'melee', 0.3, 0.1, 0.3, 0.7, 1.2, { drainSt: 12 })
  ], true),
  drops: [['wisp_essence', 1, 1, 0.8], ['crystal', 1, 1, 0.25]]
});

/* ==========================================================
6 · GUARDIANES
   Protegen la ciudad, su santuario o TUS construcciones.
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
  tame: { method: 'sedate', foods: ['roast', 'hearty_stew', 'sausage', 'dragon_scale'], feeds: 8, perLevel: 2, fromBaby: false, req: { skill: { beast: 10 } } }
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
  gold: [20, 50]
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
  build: { key: 'golem_pylon', req: { lv: 14, skill: { artisan: 6 } } }
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
  drops: [['golem_core', 1, 1, 0.4], ['stone', 3, 6, 1], ['obsidian', 1, 1, 0.2]]
});

/* ==========================================================
7 · JEFES ÚNICOS · fases por vida restante
   Cada fase cambia de patrón. Nunca golpean sin pausa:
   entre ráfagas hay un descanso largo y telegrafiado.
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
  gold: [80, 150]
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
  gold: [100, 180]
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
  gold: [120, 200]
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
        mv('howl', 'aoe', 0.6, 0.14, 0.85, 0.6, 4.6, { stagger: 0.7, summonFear: true }),
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
  gold: [150, 260]
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
  gold: [160, 280]
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
  gold: [250, 420]
});

/* ==========================================================
8 · ÍNDICES DE ECOLOGÍA (los usa el director de spawn y la IA)
========================================================== */
const PREDATORS = [], PREY = [], MYTHIC = [], GUARDIANS = [], BOSSES = [], LIVEST = [];
Object.keys(D.SPECIES).forEach(function (id) {
  const s = D.SPECIES[id];
  if (s.kind === 'boss') BOSSES.push(id);
  else if (s.kind === 'livestock') LIVEST.push(id);
  else if (s.faction === 'guardian') GUARDIANS.push(id);
  else if (s.kind === 'mythic') MYTHIC.push(id);
  if (s.diet === 'carnivore' || s.diet === 'omnivore') PREDATORS.push(id);
  if (s.diet === 'herbivore' || s.diet === 'insectivore') PREY.push(id);
});
D.ECO = {
  predators: PREDATORS, prey: PREY, mythic: MYTHIC,
  guardians: GUARDIANS, bosses: BOSSES, livestock: LIVEST,
  /** ¿Puede `a` cazar a `b`? Solo entre salvajes, nunca ganado del jugador. */
  hunts: function (a, b) {
    if (!a || !b || a === b) return false;
    const A2 = D.SPECIES[a], B2 = D.SPECIES[b];
    if (!A2 || !B2) return false;
    if (A2.prey && A2.prey.indexOf(b) >= 0) return true;
    const diet = D.DIETS[A2.diet];
    return !!(diet && diet.hunts && diet.hunts.indexOf(B2.diet) >= 0);
  },
  /** ¿Debe `a` huir de `b`? */
  fears: function (a, b) {
    if (!a || !b) return false;
    const A2 = D.SPECIES[a], B2 = D.SPECIES[b];
    if (!A2 || !B2) return false;
    if (A2.fears && A2.fears.indexOf(b) >= 0) return true;
    const diet = D.DIETS[A2.diet];
    return !!(diet && diet.flees && diet.flees.indexOf(B2.diet) >= 0 && B2.scale >= A2.scale * 0.85);
  },
  /** Fase activa de un jefe según su vida restante. */
  bossPhase: function (s, hpFrac) {
    if (!s.boss || !s.boss.phases) return null;
    const ph = s.boss.phases;
    for (let i = 0; i < ph.length; i++) if (hpFrac > ph[i].above) return ph[i];
    return ph[ph.length - 1];
  }
};

console.info('[CR] data-species.js listo · ' + Object.keys(D.SPECIES).length + ' especies · ' +
  PREDATORS.length + ' depredadores · ' + PREY.length + ' presas · ' + MYTHIC.length + ' míticas · ' +
  GUARDIANS.length + ' guardianes · ' + BOSSES.length + ' jefes con fases · ' + LIVEST.length + ' de ganado');
})();