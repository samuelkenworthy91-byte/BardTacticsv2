import Phaser from "phaser";
 
const GAME_WIDTH = 960;
const GAME_HEIGHT = 540;
 
const TILE_SIZE = 72;
const MAP_COLS = 8;
const MAP_ROWS = 8;
 
const UNIT_SPRITE_TARGET_SIZE = TILE_SIZE * 0.9;
const UNIT_SPRITE_BACKGROUND_CLEANUP = true;
const ENEMY_MOVE_DURATION = 1400;
const ENEMY_ACTION_PAUSE = 750;
 
const CARDINAL_DIRECTIONS = ["down", "up", "left", "right"];

function createDirectionalStateEntries(unitKey, state) {
  return {
    down: { key: `${unitKey}_${state}_down`, path: `/sprites/${unitKey}/${state}_down.png` },
    up: { key: `${unitKey}_${state}_up`, path: `/sprites/${unitKey}/${state}_up.png` },
    left: { key: `${unitKey}_${state}_left`, path: `/sprites/${unitKey}/${state}_left.png` },
    right: { key: `${unitKey}_${state}_right`, path: `/sprites/${unitKey}/${state}_right.png` },
  };
}

function createDeathEntries(unitKey) {
  return [1, 2, 3, 4].map((index) => ({
    key: `${unitKey}_death_${index}`,
    path: `/sprites/${unitKey}/death_${index}.png`,
  }));
}

const INDIVIDUAL_UNIT_SPRITE_SETS = {
  edwin: {
    idle: createDirectionalStateEntries("edwin", "idle"),
    move: createDirectionalStateEntries("edwin", "move"),
    attack: createDirectionalStateEntries("edwin", "attack"),
    magic: createDirectionalStateEntries("edwin", "magic"),
    hurt: createDirectionalStateEntries("edwin", "hurt"),
    death: createDeathEntries("edwin"),
  },
};
 
const UNIT_SPRITE_RENDER = {
  default: {
    height: TILE_SIZE * 0.82,
    maxWidth: TILE_SIZE * 0.96,
    offsetX: 0,
    offsetY: 0,
    deathOffsetY: 0,
    shadowWidth: TILE_SIZE * 0.42,
    shadowHeight: TILE_SIZE * 0.12,
    shadowX: 0,
    shadowY: 2,
    hpY: TILE_SIZE * 0.22,
  },
  edwin: {
    height: TILE_SIZE * 1.14,
    maxWidth: TILE_SIZE * 0.86,
    offsetX: 0,
    offsetY: 0,
    originX: 0.5,
    originY: 1,
    shadowWidth: TILE_SIZE * 0.28,
    shadowHeight: TILE_SIZE * 0.08,
    shadowY: TILE_SIZE * 0.18,
    hpY: TILE_SIZE * 0.58,
  },
  leon: {
    height: TILE_SIZE * 0.8,
    maxWidth: TILE_SIZE * 0.92,
    offsetX: 0,
    offsetY: 0,
    shadowWidth: TILE_SIZE * 0.4,
  },
  falan: {
    height: TILE_SIZE * 0.86,
    maxWidth: TILE_SIZE * 1.02,
    offsetX: 0,
    offsetY: 0,
    shadowWidth: TILE_SIZE * 0.44,
  },
  sword_thug: {
    height: TILE_SIZE * 0.82,
    maxWidth: TILE_SIZE * 0.94,
    offsetX: 0,
    offsetY: 0,
    shadowWidth: TILE_SIZE * 0.42,
  },
  axe_thug: {
    height: TILE_SIZE * 0.82,
    maxWidth: TILE_SIZE * 0.94,
    offsetX: 0,
    offsetY: 0,
    shadowWidth: TILE_SIZE * 0.42,
  },
  chakram_thug: {
    height: TILE_SIZE * 0.82,
    maxWidth: TILE_SIZE * 0.94,
    offsetX: 0,
    offsetY: 0,
    shadowWidth: TILE_SIZE * 0.42,
  },
  thug_sword: {
    height: TILE_SIZE * 0.82,
    maxWidth: TILE_SIZE * 0.94,
    offsetX: 0,
    offsetY: 0,
    shadowWidth: TILE_SIZE * 0.42,
  },
  thug_axe: {
    height: TILE_SIZE * 0.82,
    maxWidth: TILE_SIZE * 0.94,
    offsetX: 0,
    offsetY: 0,
    shadowWidth: TILE_SIZE * 0.42,
  },
  thug_chakram: {
    height: TILE_SIZE * 0.82,
    maxWidth: TILE_SIZE * 0.94,
    offsetX: 0,
    offsetY: 0,
    shadowWidth: TILE_SIZE * 0.42,
  },
}; 
const MAP = [
  ["street", "cover", "street", "street", "street", "street", "gate", "street"],
  ["street", "street", "cover", "street", "street", "cover", "street", "street"],
  ["street", "wall", "wall", "street", "street", "street", "street", "street"],
  ["street", "street", "street", "cover", "street", "street", "street", "street"],
  ["street", "street", "cover", "street", "street", "wall", "wall", "street"],
  ["street", "street", "street", "street", "cover", "street", "street", "street"],
  ["street", "cover", "street", "street", "street", "street", "street", "street"],
  ["street", "street", "street", "street", "street", "street", "street", "street"],
];
 
 
const BIOMES = {
  city: {
    terrainTextures: {
      street: { key: "cityStreetTile", path: "/tiles/city/street.png" },
      cover: { key: "cityCoverTile", path: "/tiles/city/cover.png" },
      wall: { key: "cityWallTile", path: "/tiles/city/wall.png" },
      gate: { key: "cityGateTile", path: "/tiles/city/gate.png" },
      default: { key: "cityStreetTile", path: "/tiles/city/street.png" },
    },
  },
};
 
const UNIT_SPRITE_SETS = {
  edwin: {
    idle: { key: "edwinIdleSprite", path: "/sprites/edwin/edwin_idle.png" },
    move: { key: "edwinMoveSprite", path: "/sprites/edwin/edwin_move.png" },
    attack: { key: "edwinAttackSprite", path: "/sprites/edwin/edwin_attack.png" },
    hurt: { key: "edwinHurtSprite", path: "/sprites/edwin/edwin_hurt.png" },
    death: { key: "edwinDeathSprite", path: "/sprites/edwin/edwin_death.png" },
  },
  leon: {
    idle: { key: "leonIdleSprite", path: "/sprites/leon/leon_idle.png" },
    move: { key: "leonMoveSprite", path: "/sprites/leon/leon_move.png" },
    attack: { key: "leonAttackSprite", path: "/sprites/leon/leon_attack.png" },
    hurt: { key: "leonHurtSprite", path: "/sprites/leon/leon_hurt.png" },
    death: { key: "leonDeathSprite", path: "/sprites/leon/leon_death.png" },
  },
  falan: {
    idle: { key: "falanIdleSprite", path: "/sprites/falan/falan_idle.png" },
    move: { key: "falanMoveSprite", path: "/sprites/falan/falan_move.png" },
    attack: { key: "falanAttackSprite", path: "/sprites/falan/falan_attack.png" },
    hurt: { key: "falanHurtSprite", path: "/sprites/falan/falan_hurt.png" },
    death: { key: "falanDeathSprite", path: "/sprites/falan/falan_death.png" },
  },
  sword_thug: {
    idle: { key: "swordThugIdleSprite", path: "/sprites/sword_thug/sword_thug_idle.png" },
    move: { key: "swordThugMoveSprite", path: "/sprites/sword_thug/sword_thug_move.png" },
    attack: { key: "swordThugAttackSprite", path: "/sprites/sword_thug/sword_thug_attack.png" },
    hurt: { key: "swordThugHurtSprite", path: "/sprites/sword_thug/sword_thug_hurt.png" },
    death: { key: "swordThugDeathSprite", path: "/sprites/sword_thug/sword_thug_death.png" },
  },
  axe_thug: {
    idle: { key: "axeThugIdleSprite", path: "/sprites/axe_thug/axe_thug_idle.png" },
    move: { key: "axeThugMoveSprite", path: "/sprites/axe_thug/axe_thug_move.png" },
    attack: { key: "axeThugAttackSprite", path: "/sprites/axe_thug/axe_thug_attack.png" },
    hurt: { key: "axeThugHurtSprite", path: "/sprites/axe_thug/axe_thug_hurt.png" },
    death: { key: "axeThugDeathSprite", path: "/sprites/axe_thug/axe_thug_death.png" },
  },
  chakram_thug: {
    idle: { key: "chakramThugIdleSprite", path: "/sprites/chakram_thug/chakram_thug_idle.png" },
    move: { key: "chakramThugMoveSprite", path: "/sprites/chakram_thug/chakram_thug_move.png" },
    attack: { key: "chakramThugAttackSprite", path: "/sprites/chakram_thug/chakram_thug_attack.png" },
    hurt: { key: "chakramThugHurtSprite", path: "/sprites/chakram_thug/chakram_thug_hurt.png" },
    death: { key: "chakramThugDeathSprite", path: "/sprites/chakram_thug/chakram_thug_death.png" },
  },
  thug_sword: {
    idle: { key: "thugSwordIdleSprite", path: "/sprites/thug_sword/thug_sword_idle.png" },
    move: { key: "thugSwordMoveSprite", path: "/sprites/thug_sword/thug_sword_move.png" },
    attack: { key: "thugSwordAttackSprite", path: "/sprites/thug_sword/thug_sword_attack.png" },
    hurt: { key: "thugSwordHurtSprite", path: "/sprites/thug_sword/thug_sword_hurt.png" },
    death: { key: "thugSwordDeathSprite", path: "/sprites/thug_sword/thug_sword_death.png" },
  },
  thug_axe: {
    idle: { key: "thugAxeIdleSprite", path: "/sprites/thug_axe/thug_axe_idle.png" },
    move: { key: "thugAxeMoveSprite", path: "/sprites/thug_axe/thug_axe_move.png" },
    attack: { key: "thugAxeAttackSprite", path: "/sprites/thug_axe/thug_axe_attack.png" },
    hurt: { key: "thugAxeHurtSprite", path: "/sprites/thug_axe/thug_axe_hurt.png" },
    death: { key: "thugAxeDeathSprite", path: "/sprites/thug_axe/thug_axe_death.png" },
  },
  thug_chakram: {
    idle: { key: "thugChakramIdleSprite", path: "/sprites/thug_chakram/thug_chakram_idle.png" },
    move: { key: "thugChakramMoveSprite", path: "/sprites/thug_chakram/thug_chakram_move.png" },
    attack: { key: "thugChakramAttackSprite", path: "/sprites/thug_chakram/thug_chakram_attack.png" },
    hurt: { key: "thugChakramHurtSprite", path: "/sprites/thug_chakram/thug_chakram_hurt.png" },
    death: { key: "thugChakramDeathSprite", path: "/sprites/thug_chakram/thug_chakram_death.png" },
  },
};
 
const DIRECTION_FRAMES = {
  down: { col: 0, row: 0 },
  up: { col: 1, row: 0 },
  left: { col: 0, row: 1 },
  right: { col: 1, row: 1 },
};
 
const DEATH_FRAMES = [
  { col: 0, row: 0 },
  { col: 1, row: 0 },
  { col: 0, row: 1 },
  { col: 1, row: 1 },
];
 
const CHAPTER_OPENING = [
  {
    type: "title",
    chapter: "Prologue",
    subtitle: "Underpass",
    tag: "Four Years Gone",
  },
  {
    type: "scene",
    sceneName: "Leon's House",
    background: "leonsHouseScene",
    lines: [
      { speaker: "Leon", portrait: "leonPortrait", text: "They left already...?" },
      { speaker: "Letter", portrait: null, text: "Leon, happy birthday. There's been a sighting of Edwin near Poole." },
      { speaker: "Letter", portrait: null, text: "We'll be back probably this weekend. Love, Mum and Dad." },
      { speaker: "Leon", portrait: "leonPortrait", text: "...Still looking for him." },
      { speaker: "Leon", portrait: "leonPortrait", text: "Four years, and they still won't stop. Not even today." },
    ],
  },
  {
    type: "scene",
    sceneName: "Walk to School",
    background: "walkToSchoolScene",
    lines: [
      { speaker: "Kayley", portrait: "kayleyPortrait", text: "There he is. Birthday boy finally decided to show up." },
      { speaker: "Rich", portrait: "richPortrait", text: "You're late enough that we were about to eat your presents ourselves." },
      { speaker: "Leon", portrait: "leonPortrait", text: "You didn't get me presents." },
      { speaker: "Kayley", portrait: "kayleyPortrait", text: "Exactly. We saved money." },
      { speaker: "Rich", portrait: "richPortrait", text: "Come on. If we cut through the underpass, we'll still make it." },
    ],
  },
  {
    type: "scene",
    sceneName: "Underpass",
    background: "underpassScene",
    lines: [
      { speaker: "Rich", portrait: "richPortrait", text: "...Leon." },
      { speaker: "Kayley", portrait: "kayleyPortrait", text: "Those aren't students." },
      { speaker: "Falan", portrait: "falanPortrait", text: "There you are." },
      { speaker: "Leon", portrait: "leonPortrait", text: "Who are you people?" },
      { speaker: "Falan", portrait: "falanPortrait", text: "Doesn't matter. You're coming with us." },
      { speaker: "Kayley", portrait: "kayleyPortrait", text: "No chance. Back off." },
      { speaker: "Rich", portrait: "richPortrait", text: "Leon, get behind us." },
      {
        type: "impact",
        attacker: "Thug",
        attackerPortrait: "thugPortrait",
        defender: "Rich",
        defenderPortrait: "richPortrait",
        text: "A thug lunges. Rich falls first.",
      },
      {
        type: "impact",
        attacker: "Thug",
        attackerPortrait: "thugPortrait",
        defender: "Kayley",
        defenderPortrait: "kayleyPortrait",
        text: "Kayley tries to pull Leon away, but another attacker cuts her down.",
      },
      { speaker: "Leon", portrait: "leonPortrait", text: "Kayley! Rich! No—!" },
      {
        type: "impact",
        attacker: "Edwin",
        attackerPortrait: "edwinPortrait",
        defender: "Thug",
        defenderPortrait: "thugPortrait",
        text: "A blue-white flash cuts across the underpass. Edwin strikes one attacker down.",
      },
      { speaker: "Edwin", portrait: "edwinPortrait", text: "Talk later. If you want answers, survive." },
      { speaker: "Leon", portrait: "leonPortrait", text: "...Edwin?" },
      { speaker: "Falan", portrait: "falanPortrait", text: "So the ghost brother finally crawls home." },
      { speaker: "Edwin", portrait: "edwinPortrait", text: "Stay behind me, Leon." },
    ],
  },
];
 
const POST_BATTLE_SCENE = [
  {
    type: "mapDialogue",
    speaker: "Falan",
    portrait: "falanPortrait",
    text: "I... didn't believe... Caleb... you're good, Bligh... but the others will end you.",
  },
  {
    type: "unitDeath",
    unitId: "falan",
    autoAdvanceDelay: 1400,
  },
  {
    type: "mapDialogue",
    speaker: "Leon",
    portrait: "leonPortrait",
    text: "I...",
  },
  {
    type: "mapAction",
    speaker: "Narration",
    portrait: "edwinPortrait",
    text: "Leon passes out. Edwin rushes in and catches him before he hits the ground.",
  },
  {
    type: "mapDialogue",
    speaker: "Edwin",
    portrait: "edwinPortrait",
    text: "Woah there. I got you. Sleep for now.",
  },
  {
    type: "sceneDialogue",
    sceneName: "Panel Van",
    scene: "vanInteriorScene",
    speaker: "Heath",
    portrait: "heathPortrait",
    text: "Hey there sleeping beauty!",
  },
  {
    type: "sceneDialogue",
    sceneName: "Panel Van",
    scene: "vanInteriorScene",
    speaker: "Leon",
    portrait: "leonPortrait",
    text: "Where... Where's Edwin?",
  },
  {
    type: "sceneDialogue",
    sceneName: "Panel Van",
    scene: "vanInteriorScene",
    speaker: "Heath",
    portrait: "heathPortrait",
    text: "The boss man is driving this heap. Name's Heath by the way, and this bundle of cuteness wrapped up is Izzy.",
  },
  {
    type: "sceneDialogue",
    sceneName: "Panel Van",
    scene: "vanInteriorScene",
    speaker: "Izzy",
    portrait: "izzyPortrait",
    text: "*Grunt*",
  },
  {
    type: "sceneDialogue",
    sceneName: "Panel Van",
    scene: "vanInteriorScene",
    speaker: "Leon",
    portrait: "leonPortrait",
    text: "Kayley? Rich?",
  },
  {
    type: "sceneDialogue",
    sceneName: "Panel Van",
    scene: "vanInteriorScene",
    speaker: "Izzy",
    portrait: "izzyPortrait",
    text: "The two you were with? Dead, I'm afraid... Any consolation, it was quick.",
  },
  {
    type: "sceneDialogue",
    sceneName: "Panel Van",
    scene: "vanInteriorScene",
    speaker: "Leon",
    portrait: "leonPortrait",
    text: "...",
  },
  {
    type: "sceneDialogue",
    sceneName: "Panel Van",
    scene: "vanInteriorScene",
    speaker: "Heath",
    portrait: "heathPortrait",
    text: "It's OK.",
  },
  {
    type: "sceneNarration",
    sceneName: "Panel Van",
    scene: "vanInteriorScene",
    speaker: "Narration",
    portrait: null,
    text: "Heath pulls Leon into a hug as Leon sobs against him.",
  },
  {
    type: "overlapDialogue",
    sceneName: "Panel Van",
    scene: "vanInteriorScene",
    speaker: "Heath",
    portrait: "heathPortrait",
    overlapPortrait: "leonPortrait",
    text: "Let it all out. We'll be home soon.",
  },
  {
    type: "fullScreenScene",
    sceneName: "Byron Farm",
    scene: "byronFarmScene",
    text: "Byron Farm",
  },
  {
    type: "savePrompt",
    title: "Chapter 1 Complete",
    text: "Save game?",
  },
];
 
const UNITS = [
  {
    id: "edwin",
    name: "Edwin",
    title: "Iceblade",
    level: 5,
    xp: 0,
    xpRate: 0.65,
    growths: {
      hp: 50,
      str: 35,
      mag: 60,
      def: 75,
      res: 30,
      spd: 65,
    },
    team: "player",
    className: "Spellsword",
    portraitKey: "edwinPortrait",
    spriteSet: "edwin",
    facing: "down",
    x: 2,
    y: 6,
    move: 5,
    hp: 24,
    maxHp: 24,
    str: 8,
    mag: 10,
    def: 6,
    res: 7,
    spd: 8,
    weapons: [
      {
        name: "Iceblade",
        baseDamage: 4,
        range: 1,
        damageType: "physical",
        stat: "str",
        hitRate: 100,
      },
      {
        name: "Ice Sigil",
        baseDamage: 5,
        range: 2,
        damageType: "magical",
        stat: "mag",
        hitRate: 100,
      },
    ],
    acted: false,
    color: 0x60a5fa,
  },
  {
    id: "leon",
    name: "Leon",
    title: "Brawler",
    level: 1,
    xp: 0,
    xpRate: 1.5,
    growths: {
      hp: 70,
      str: 60,
      mag: 5,
      def: 25,
      res: 55,
      spd: 55,
    },
    team: "player",
    className: "Street Brawler",
    portraitKey: "leonPortrait",
    spriteSet: "leon",
    facing: "down",
    x: 4,
    y: 6,
    move: 5,
    hp: 16,
    maxHp: 16,
    str: 3,
    mag: 0,
    def: 2,
    res: 1,
    spd: 7,
    weapons: [
      {
        name: "Fists",
        baseDamage: 1,
        range: 1,
        damageType: "physical",
        stat: "str",
        hitRate: 100,
      },
    ],
    acted: false,
    color: 0x38bdf8,
  },
  {
    id: "falan",
    name: "Falan",
    title: "Gang Leader",
    team: "enemy",
    className: "Leader",
    portraitKey: "falanPortrait",
    spriteSet: "falan",
    facing: "down",
    x: 4,
    y: 1,
    move: 4,
    hp: 14,
    maxHp: 14,
    str: 5,
    mag: 0,
    def: 3,
    res: 1,
    spd: 5,
    weapons: [
      {
        name: "Katars",
        baseDamage: 3,
        range: 1,
        damageType: "physical",
        stat: "str",
        hitRate: 100,
        speedBonus: 2,
      },
    ],
    acted: false,
    color: 0xf87171,
    boss: true,
  },
  {
    id: "thug1",
    name: "Thug",
    title: "White Hood",
    team: "enemy",
    className: "Thug",
    portraitKey: "thugPortrait",
    spriteSet: "sword_thug",
    facing: "down",
    x: 2,
    y: 1,
    move: 4,
    hp: 8,
    maxHp: 8,
    str: 3,
    mag: 0,
    def: 1,
    res: 0,
    spd: 4,
    weapons: [
      {
        name: "Sword",
        baseDamage: 3,
        range: 1,
        damageType: "physical",
        stat: "str",
        hitRate: 100,
      },
    ],
    acted: false,
    color: 0xfb7185,
  },
  {
    id: "thug2",
    name: "Thug",
    title: "White Hood",
    team: "enemy",
    className: "Thug",
    portraitKey: "thugPortrait",
    spriteSet: "axe_thug",
    facing: "down",
    x: 3,
    y: 0,
    move: 4,
    hp: 8,
    maxHp: 8,
    str: 3,
    mag: 0,
    def: 1,
    res: 0,
    spd: 4,
    weapons: [
      {
        name: "Axe",
        baseDamage: 5,
        range: 1,
        damageType: "physical",
        stat: "str",
        hitRate: 75,
      },
    ],
    acted: false,
    color: 0xfb7185,
  },
  {
    id: "thug3",
    name: "Thug",
    title: "White Hood",
    team: "enemy",
    className: "Thug",
    portraitKey: "thugPortrait",
    spriteSet: "chakram_thug",
    facing: "down",
    x: 5,
    y: 0,
    move: 4,
    hp: 8,
    maxHp: 8,
    str: 3,
    mag: 0,
    def: 1,
    res: 0,
    spd: 4,
    weapons: [
      {
        name: "Chakram",
        baseDamage: 2,
        minRange: 1,
        maxRange: 2,
        damageType: "physical",
        stat: "str",
        hitRate: 100,
      },
    ],
    acted: false,
    color: 0xfb7185,
  },
  {
    id: "thug4",
    name: "Thug",
    title: "White Hood",
    team: "enemy",
    className: "Thug",
    portraitKey: "thugPortrait",
    spriteSet: "sword_thug",
    facing: "down",
    x: 6,
    y: 1,
    move: 4,
    hp: 8,
    maxHp: 8,
    str: 3,
    mag: 0,
    def: 1,
    res: 0,
    spd: 4,
    weapons: [
      {
        name: "Sword",
        baseDamage: 3,
        range: 1,
        damageType: "physical",
        stat: "str",
        hitRate: 100,
      },
    ],
    acted: false,
    color: 0xfb7185,
  },
];
 
const LEVELS = {
  chapter1: {
    biome: "city",
    map: MAP,
    units: UNITS,
    battleMusic: {
      key: "chapter1BattleMusic",
      path: "/audio/chapter1_battle.mp3",
      volume: 0.45,
    },
  },
};
 
function tileColor(type) {
  if (type === "street") return 0x374151;
  if (type === "cover") return 0x475569;
  if (type === "gate") return 0x7c5c3b;
  if (type === "wall") return 0x6b7280;
  return 0x1f2937;
}
 
function tileLabel(type) {
  if (type === "street") return "S";
  if (type === "cover") return "C";
  if (type === "gate") return "G";
  if (type === "wall") return "W";
  return "?";
}
 
function tileKey(x, y) {
  return `${x},${y}`;
}
 
function distance(a, b) {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}
 
function getWeaponForTarget(attacker, defender) {
  if (!attacker || !defender || !attacker.weapons) return null;
 
  const dist = distance(attacker, defender);
 
  return (
    attacker.weapons.find((weapon) => {
      const minRange = weapon.minRange ?? weapon.range;
      const maxRange = weapon.maxRange ?? weapon.range;
 
      return dist >= minRange && dist <= maxRange;
    }) || null
  );
}
 
function getDefaultWeapon(unit) {
  return unit.weapons[0];
}
 
function getWeaponRangeLabel(weapon) {
  if (!weapon) return "-";
 
  const minRange = weapon.minRange ?? weapon.range;
  const maxRange = weapon.maxRange ?? weapon.range;
 
  return minRange === maxRange ? `${minRange}` : `${minRange}-${maxRange}`;
}
 
function canAttack(attacker, defender) {
  return !!getWeaponForTarget(attacker, defender);
}
 
class BattleScene extends Phaser.Scene {
  constructor() {
    super("BattleScene");
  }
 
  getCurrentLevel() {
    return LEVELS.chapter1;
  }
 
  preloadBiomeTiles(biomeKey) {
    const biome = BIOMES[biomeKey];
    if (!biome) return;
 
    const loadedKeys = new Set();
 
    Object.values(biome.terrainTextures).forEach((entry) => {
      if (!entry || loadedKeys.has(entry.key)) return;
 
      this.load.image(entry.key, entry.path);
      loadedKeys.add(entry.key);
    });
  }
 
  preloadLevelAudio(levelData) {
    if (!levelData?.battleMusic?.key || !levelData?.battleMusic?.path) return;
 
    this.load.audio(levelData.battleMusic.key, [levelData.battleMusic.path]);
  }
 
 
 
  getUnitSpriteCandidatePaths(spriteSetKey, state, entry) {
    if (!entry) return [];
 
    const aliases = new Set([spriteSetKey]);
 
    if (spriteSetKey.endsWith("_thug")) {
      const weaponName = spriteSetKey.replace("_thug", "");
      aliases.add(`${weaponName}_thug`);
      aliases.add(`thug_${weaponName}`);
      aliases.add("thug");
    }
 
    if (spriteSetKey.startsWith("thug_")) {
      const weaponName = spriteSetKey.replace("thug_", "");
      aliases.add(`thug_${weaponName}`);
      aliases.add(`${weaponName}_thug`);
      aliases.add("thug");
    }
 
    aliases.add(spriteSetKey.replace(/_/g, ""));
 
    const paths = [entry.path];
 
    aliases.forEach((alias) => {
      paths.push(`/sprites/${spriteSetKey}/${alias}_${state}.png`);
      paths.push(`/sprites/${spriteSetKey}/${state}.png`);
      paths.push(`/sprites/${alias}/${alias}_${state}.png`);
      paths.push(`/sprites/${alias}/${state}.png`);
      paths.push(`/sprites/${alias}_${state}.png`);
    });
 
    return [...new Set(paths.filter(Boolean))];
  }
 
  preloadUnitSpriteAtlases() {
    const loadedKeys = new Set();
 
    Object.entries(UNIT_SPRITE_SETS).forEach(([spriteSetKey, spriteSet]) => {
      Object.entries(spriteSet).forEach(([state, entry]) => {
        if (!entry || !entry.key) return;
 
        const paths = this.getUnitSpriteCandidatePaths(spriteSetKey, state, entry);
        entry.candidateKeys = [];
 
        paths.forEach((path, index) => {
          const key = index === 0 ? entry.key : `${entry.key}Alt${index}`;
          entry.candidateKeys.push(key);
 
          if (loadedKeys.has(key)) return;
 
          this.load.image(key, path);
          loadedKeys.add(key);
        });
      });
    });
  }

  preloadIndividualDirectionalSprites() {
    const loadedKeys = new Set();

    Object.values(INDIVIDUAL_UNIT_SPRITE_SETS).forEach((spriteSet) => {
      Object.values(spriteSet).forEach((entry) => {
        if (Array.isArray(entry)) {
          entry.forEach((frameEntry) => {
            if (!frameEntry?.key || !frameEntry?.path || loadedKeys.has(frameEntry.key)) return;
            this.load.image(frameEntry.key, frameEntry.path);
            loadedKeys.add(frameEntry.key);
          });
          return;
        }

        Object.values(entry || {}).forEach((directionEntry) => {
          if (!directionEntry?.key || !directionEntry?.path || loadedKeys.has(directionEntry.key)) return;
          this.load.image(directionEntry.key, directionEntry.path);
          loadedKeys.add(directionEntry.key);
        });
      });
    });
  }

  getIndividualSpriteSet(unit) {
    if (!unit) return null;
    return INDIVIDUAL_UNIT_SPRITE_SETS[unit.spriteSet] || INDIVIDUAL_UNIT_SPRITE_SETS[unit.id] || null;
  }

  getIndividualSpriteEntry(unit, state = "idle", direction = "down", frameIndex = 0) {
    const spriteSet = this.getIndividualSpriteSet(unit);
    if (!spriteSet) return null;

    const resolvedState = spriteSet[state] ? state : "idle";

    if (resolvedState === "death") {
      const deathFrames = spriteSet.death || [];
      return deathFrames[Phaser.Math.Clamp(frameIndex, 0, Math.max(0, deathFrames.length - 1))] || null;
    }

    const directionEntries = spriteSet[resolvedState] || spriteSet.idle;
    const resolvedDirection = CARDINAL_DIRECTIONS.includes(direction) ? direction : "down";
    return directionEntries?.[resolvedDirection] || directionEntries?.down || null;
  }

  applyIndividualUnitSprite(unit, textureKey, state = "idle") {
    const sprite = this.unitSprites[unit.id];
    const image = this.ensureUnitSpriteImage(unit, textureKey);

    if (!sprite || !image || !textureKey || !this.textures.exists(textureKey)) {
      this.showUnitFallbackSprite(unit);
      return false;
    }

    const texture = this.textures.get(textureKey);
    const source = texture.getSourceImage();
    if (!source?.width || !source?.height) {
      this.showUnitFallbackSprite(unit);
      return false;
    }

    const render = this.getUnitSpriteRenderConfig(unit);
    const desiredHeight = render.height || UNIT_SPRITE_TARGET_SIZE;
    const desiredMaxWidth = render.maxWidth || TILE_SIZE * 0.9;

    let scale = desiredHeight / Math.max(1, source.height);
    if (source.width * scale > desiredMaxWidth) {
      scale = desiredMaxWidth / Math.max(1, source.width);
    }

    image.setTexture(textureKey);
    if (typeof image.setCrop === "function") {
      image.setCrop();
      image.isCropped = false;
    }
    image.setScale(scale);

    const isDeathFrame = state === "death";
    image.setOrigin(render.originX ?? 0.5, isDeathFrame ? 0.5 : (render.originY ?? 1));
    image.setPosition(render.offsetX || 0, isDeathFrame ? (render.deathOffsetY ?? 0) : (render.offsetY ?? 0));
    image.setVisible(true);
    image.clearTint();

    if (sprite.shadow) {
      sprite.shadow.setPosition(render.shadowX || 0, render.shadowY ?? 2);
      sprite.shadow.setSize(render.shadowWidth || TILE_SIZE * 0.42, render.shadowHeight || TILE_SIZE * 0.12);
      sprite.shadow.setVisible(!isDeathFrame);
    }

    sprite.marker.setVisible(false);
    sprite.label.setVisible(false);
    sprite.hpText.setPosition(0, render.hpY ?? TILE_SIZE * 0.22);

    return true;
  }

  getAttackAnimationState(unit, weapon = null) {
    if (!unit) return "attack";

    if (weapon?.damageType === "magical") {
      const magicEntry = this.getIndividualSpriteEntry(unit, "magic", unit.facing || "down", 0);
      if (magicEntry?.key) return "magic";

      const spriteSet = this.getUnitSpriteSet(unit);
      if (spriteSet?.magic) return "magic";
    }

    return "attack";
  }
 
  createTransparentUnitTextures() {
    if (!UNIT_SPRITE_BACKGROUND_CLEANUP) return;
 
    Object.values(UNIT_SPRITE_SETS).forEach((spriteSet) => {
      Object.values(spriteSet).forEach((entry) => {
        const keys = entry?.candidateKeys || (entry?.key ? [entry.key] : []);
 
        keys.forEach((key) => {
          if (this.textures.exists(key)) {
            this.createTransparentCopyForUnitTexture(key);
          }
        });
      });
    });
  }
 
  createTransparentCopyForUnitTexture(sourceKey) {
    const cleanKey = `${sourceKey}Clean`;
    if (this.textures.exists(cleanKey)) return cleanKey;
    if (!this.textures.exists(sourceKey)) return sourceKey;
 
    const texture = this.textures.get(sourceKey);
    const source = texture.getSourceImage();
 
    if (!source?.width || !source?.height) return sourceKey;
 
    const canvasTexture = this.textures.createCanvas(cleanKey, source.width, source.height);
    const canvas = canvasTexture.getCanvas();
    const ctx = canvasTexture.getContext();
 
    ctx.clearRect(0, 0, source.width, source.height);
    ctx.drawImage(source, 0, 0);
 
    const imageData = ctx.getImageData(0, 0, source.width, source.height);
    const data = imageData.data;
    const width = source.width;
    const height = source.height;
    const visited = new Uint8Array(width * height);
    const queue = [];
 
    const isLightNeutralBackground = (index) => {
      const r = data[index];
      const g = data[index + 1];
      const b = data[index + 2];
      const a = data[index + 3];
 
      if (a < 8) return false;
 
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
 
      // Removes white or pale grey checker/image backgrounds connected to the sheet edge.
      // It avoids coloured highlights such as Edwin's blue ice effects.
      return r >= 175 && g >= 175 && b >= 175 && max - min <= 55;
    };
 
    const tryAdd = (x, y) => {
      if (x < 0 || y < 0 || x >= width || y >= height) return;
 
      const pixelIndex = y * width + x;
      if (visited[pixelIndex]) return;
 
      const dataIndex = pixelIndex * 4;
      if (!isLightNeutralBackground(dataIndex)) return;
 
      visited[pixelIndex] = 1;
      queue.push([x, y]);
    };
 
    for (let x = 0; x < width; x += 1) {
      tryAdd(x, 0);
      tryAdd(x, height - 1);
    }
 
    for (let y = 0; y < height; y += 1) {
      tryAdd(0, y);
      tryAdd(width - 1, y);
    }
 
    let queueIndex = 0;
    while (queueIndex < queue.length) {
      const [x, y] = queue[queueIndex];
      queueIndex += 1;
 
      tryAdd(x + 1, y);
      tryAdd(x - 1, y);
      tryAdd(x, y + 1);
      tryAdd(x, y - 1);
    }
 
    for (let pixelIndex = 0; pixelIndex < visited.length; pixelIndex += 1) {
      if (visited[pixelIndex]) {
        data[pixelIndex * 4 + 3] = 0;
      }
    }
 
    ctx.putImageData(imageData, 0, 0);
    canvasTexture.refresh();
 
    return cleanKey;
  }
 
  preload() {
    const levelData = this.getCurrentLevel();
 
    this.load.image("edwinPortrait", "/portraits/edwin.jpg");
    this.load.image("leonPortrait", "/portraits/leon.jpg");
    this.load.image("kayleyPortrait", "/portraits/kayley.jpg");
    this.load.image("richPortrait", "/portraits/rich.jpg");
    this.load.image("falanPortrait", "/portraits/falan.jpg");
    this.load.image("thugPortrait", "/portraits/thug.jpg");
    this.load.image("heathPortrait", "/portraits/heath.jpg");
    this.load.image("izzyPortrait", "/portraits/izzy.jpg");
    this.load.image("prologueScene", "/scenes/prologue.jpg");
    this.load.image("leonsHouseScene", "/scenes/leons_house.jpg");
    this.load.image("walkToSchoolScene", "/scenes/walk_to_school.jpg");
    this.load.image("underpassScene", "/scenes/underpass.jpg");
    this.load.image("vanInteriorScene", "/scenes/van_interior.jpg");
    this.load.image("byronFarmScene", "/scenes/byron_farm.jpg");
 
    this.preloadBiomeTiles(levelData.biome);
    this.preloadUnitSpriteAtlases();
    this.preloadIndividualDirectionalSprites();
    this.preloadLevelAudio(levelData);
  }
 
  create() {
    this.levelData = this.getCurrentLevel();
    this.currentBiomeKey = this.levelData.biome;
    this.map = this.levelData.map;
    this.mapRows = this.map.length;
    this.mapCols = this.map[0]?.length || 0;
 
    this.units = this.levelData.units.map((unit) => ({
      ...unit,
      facing: unit.facing || "down",
      spriteState: unit.spriteState || "idle",
      weapons: unit.weapons.map((weapon) => ({ ...weapon })),
    }));
 
    this.selectedUnitId = null;
    this.moveTiles = [];
    this.targetTiles = [];
    this.unitSprites = {};
    this.phase = "intro";
    this.busy = false;
    this.previewOpen = false;
    this.previewData = null;
    this.battleMusic = null;
    this.battleMusicStarted = false;
    this.postBattleStep = 0;
    this.postBattleActionSteps = new Set();
    this.postBattleStarted = false;
    this.unitSpriteBoundsCache = new Map();
 
    this.openingStep = 0;
    this.openingLine = 0;
    this.openingMode = CHAPTER_OPENING[0].type;
 
    this.cameras.main.setBackgroundColor("#0f172a");
 
    this.boardWidth = this.mapCols * TILE_SIZE;
    this.boardHeight = this.mapRows * TILE_SIZE;
    this.boardX = 184;
    this.boardY = 18;
 
    this.tileLayer = this.add.layer();
    this.overlayLayer = this.add.layer();
    this.unitLayer = this.add.layer();
    this.uiLayer = this.add.layer();
 
    this.createTransparentUnitTextures();
    this.createTopUI();
    this.drawBoard();
    this.drawUnits();
    this.createSidePanel();
    this.createPreviewUI();
    this.createCombatXpPopup();
    this.createOpeningUI();
    this.createPostBattleUI();
    this.setupInput();
    this.updateSelectedPanel();
    this.updateOpeningUI();
  }
 
  createTopUI() {
    this.add.text(24, 20, "Chapter 1", {
      fontSize: "26px",
      fontStyle: "bold",
      color: "#ffffff",
    });
 
    this.phaseText = this.add.text(24, 56, "Opening", {
      fontSize: "18px",
      fontStyle: "bold",
      color: "#fcd34d",
    });
 
    this.helpText = this.add.text(24, 88, "Watch the chapter opening.", {
      fontSize: "14px",
      color: "#cbd5e1",
      wordWrap: { width: 190 },
    });
 
    this.add.text(24, 470, "Objective", {
      fontSize: "18px",
      fontStyle: "bold",
      color: "#f8fafc",
    });
 
    this.objectiveText = this.add.text(24, 498, "Defeat Falan, the gang leader.", {
      fontSize: "14px",
      color: "#fcd34d",
      wordWrap: { width: 190 },
    });
  }
 
  createSidePanel() {
    const x = 704;
    const y = 72;
 
    const bg = this.add.rectangle(x + 120, y + 200, 248, 400, 0x111827, 0.92);
    bg.setStrokeStyle(2, 0x334155);
 
    const title = this.add.text(x + 16, y + 14, "Selected Unit", {
      fontSize: "20px",
      fontStyle: "bold",
      color: "#ffffff",
    });
 
    this.portraitFrame = this.add.rectangle(x + 64, y + 88, 96, 120, 0x1f2937);
    this.portraitFrame.setStrokeStyle(2, 0x475569);
 
    this.portraitImage = this.add.image(x + 64, y + 88, "edwinPortrait");
    this.portraitImage.setDisplaySize(96, 120);
    this.portraitImage.setVisible(false);
 
    this.portraitPlaceholder = this.add.text(x + 64, y + 88, "NO\nART", {
      fontSize: "20px",
      color: "#94a3b8",
      align: "center",
    }).setOrigin(0.5);
 
    this.unitNameText = this.add.text(x + 16, y + 156, "None", {
      fontSize: "22px",
      fontStyle: "bold",
      color: "#ffffff",
    });
 
    this.unitClassText = this.add.text(x + 16, y + 190, "", {
      fontSize: "14px",
      color: "#94a3b8",
    });
 
    this.levelXpText = this.add.text(x + 16, y + 218, "", {
      fontSize: "14px",
      color: "#cbd5e1",
    });
 
    this.xpBarBg = this.add.rectangle(x + 16, y + 244, 210, 12, 0x1f2937);
    this.xpBarBg.setOrigin(0, 0.5);
    this.xpBarBg.setStrokeStyle(1, 0x475569);
 
    this.xpBarFill = this.add.rectangle(x + 16, y + 244, 210, 12, 0x38bdf8);
    this.xpBarFill.setOrigin(0, 0.5);
    this.xpBarFill.displayWidth = 0;
 
    this.unitStatsText = this.add.text(x + 16, y + 264, "", {
      fontSize: "13px",
      color: "#e2e8f0",
      lineSpacing: 4,
    });
 
    this.weaponText = this.add.text(x + 16, y + 388, "", {
      fontSize: "13px",
      color: "#93c5fd",
      wordWrap: { width: 210 },
    });
 
    this.sidePanelParts = [
      bg,
      title,
      this.portraitFrame,
      this.portraitImage,
      this.portraitPlaceholder,
      this.unitNameText,
      this.unitClassText,
      this.levelXpText,
      this.xpBarBg,
      this.xpBarFill,
      this.unitStatsText,
      this.weaponText,
    ];
 
    this.uiLayer.add(this.sidePanelParts);
  }
 
  createPreviewUI() {
    this.previewContainer = this.add.container(GAME_WIDTH / 2, 430);
    this.previewContainer.setVisible(false);
 
    const panel = this.add.rectangle(0, 0, 620, 150, 0x0f172a, 0.97);
    panel.setStrokeStyle(2, 0x475569);
 
    const title = this.add.text(-292, -58, "Combat Preview", {
      fontSize: "22px",
      fontStyle: "bold",
      color: "#ffffff",
    });
 
    this.previewLeftName = this.add.text(-292, -18, "", {
      fontSize: "18px",
      fontStyle: "bold",
      color: "#93c5fd",
    });
 
    this.previewLeftStats = this.add.text(-292, 10, "", {
      fontSize: "14px",
      color: "#e2e8f0",
      lineSpacing: 6,
    });
 
    this.previewRightName = this.add.text(30, -18, "", {
      fontSize: "18px",
      fontStyle: "bold",
      color: "#fca5a5",
    });
 
    this.previewRightStats = this.add.text(30, 10, "", {
      fontSize: "14px",
      color: "#e2e8f0",
      lineSpacing: 6,
    });
 
    const confirmButton = this.add.rectangle(-90, 50, 140, 34, 0x2563eb);
    confirmButton.setStrokeStyle(2, 0x93c5fd);
    confirmButton.setInteractive({ useHandCursor: true });
    confirmButton.on("pointerdown", () => {
      if (this.previewOpen) this.confirmPreviewAttack();
    });
 
    const confirmText = this.add.text(-132, 39, "Confirm", {
      fontSize: "16px",
      fontStyle: "bold",
      color: "#ffffff",
    });
 
    const cancelButton = this.add.rectangle(90, 50, 140, 34, 0x334155);
    cancelButton.setStrokeStyle(2, 0x94a3b8);
    cancelButton.setInteractive({ useHandCursor: true });
    cancelButton.on("pointerdown", () => {
      if (this.previewOpen) this.closePreview();
    });
 
    const cancelText = this.add.text(52, 39, "Cancel", {
      fontSize: "16px",
      fontStyle: "bold",
      color: "#ffffff",
    });
 
    this.previewContainer.add([
      panel,
      title,
      this.previewLeftName,
      this.previewLeftStats,
      this.previewRightName,
      this.previewRightStats,
      confirmButton,
      confirmText,
      cancelButton,
      cancelText,
    ]);
 
    this.uiLayer.add(this.previewContainer);
  }
 
  createCombatXpPopup() {
    this.combatXpContainer = this.add.container(GAME_WIDTH / 2, GAME_HEIGHT - 68);
    this.combatXpContainer.setVisible(false);
    this.combatXpContainer.setDepth(9998);
    this.combatXpContainer.setAlpha(0);
 
    const bg = this.add.rectangle(0, 0, 320, 88, 0x020617, 0.96);
    bg.setStrokeStyle(2, 0x475569);
 
    this.combatXpNameText = this.add.text(-140, -28, "", {
      fontSize: "18px",
      fontStyle: "bold",
      color: "#ffffff",
    });
 
    this.combatXpGainText = this.add.text(140, -28, "", {
      fontSize: "16px",
      fontStyle: "bold",
      color: "#7dd3fc",
    }).setOrigin(1, 0);
 
    this.combatXpValueText = this.add.text(-140, -2, "", {
      fontSize: "14px",
      color: "#cbd5e1",
    });
 
    this.combatXpBarBg = this.add.rectangle(-140, 26, 280, 14, 0x1f2937);
    this.combatXpBarBg.setOrigin(0, 0.5);
    this.combatXpBarBg.setStrokeStyle(1, 0x475569);
 
    this.combatXpBarFill = this.add.rectangle(-140, 26, 280, 14, 0x38bdf8);
    this.combatXpBarFill.setOrigin(0, 0.5);
    this.combatXpBarFill.displayWidth = 0;
 
    this.combatXpContainer.add([
      bg,
      this.combatXpNameText,
      this.combatXpGainText,
      this.combatXpValueText,
      this.combatXpBarBg,
      this.combatXpBarFill,
    ]);
 
    this.uiLayer.add(this.combatXpContainer);
  }
 
  showCombatXpPopup(unit, amount, startLevel, startXp) {
    if (!this.combatXpContainer || !unit || amount <= 0) return;
 
    this.tweens.killTweensOf(this.combatXpContainer);
    this.tweens.killTweensOf(this.combatXpBarFill);
 
    const popup = this.combatXpContainer;
    popup.setVisible(true);
    popup.setAlpha(1);
 
    this.combatXpNameText.setText(unit.name);
    this.combatXpGainText.setText(`+${amount} XP`);
 
    let displayLevel = startLevel;
    let currentXp = startXp;
    let remainingXp = amount;
 
    const setDisplay = (level, xpValue) => {
      this.combatXpValueText.setText(`Lv ${level} XP ${xpValue}/100`);
      this.combatXpBarFill.displayWidth = 280 * Phaser.Math.Clamp(xpValue / 100, 0, 1);
    };
 
    setDisplay(displayLevel, currentXp);
 
    const animateChunk = () => {
      if (remainingXp <= 0) {
        this.time.delayedCall(700, () => {
          this.tweens.add({
            targets: popup,
            alpha: 0,
            duration: 220,
            onComplete: () => popup.setVisible(false),
          });
        });
        return;
      }
 
      const neededToLevel = 100 - currentXp;
      const chunk = Math.min(remainingXp, neededToLevel);
 
      this.tweens.addCounter({
        from: currentXp,
        to: currentXp + chunk,
        duration: 450,
        onUpdate: (tween) => {
          const value = Math.floor(tween.getValue());
          setDisplay(displayLevel, value);
        },
        onComplete: () => {
          currentXp += chunk;
          remainingXp -= chunk;
 
          if (currentXp >= 100 && remainingXp > 0) {
            displayLevel += 1;
            currentXp = 0;
            setDisplay(displayLevel, currentXp);
 
            this.time.delayedCall(250, () => {
              animateChunk();
            });
          } else {
            animateChunk();
          }
        },
      });
    };
 
    animateChunk();
  }
 
  getTerrainDefenseBonus(unit) {
    if (!unit) return 0;
 
    const terrain = this.getTerrainAt(unit.x, unit.y);
 
    if (terrain === "cover") return 2;
    if (terrain === "gate") return 5;
 
    return 0;
  }
 
  getWeaponSpeedBonus(unit, weapon) {
    if (!unit || !weapon) return 0;
    return weapon.speedBonus || 0;
  }
 
  getEffectiveSpeed(unit, weapon = null) {
    return (unit?.spd || 0) + this.getWeaponSpeedBonus(unit, weapon);
  }
 
  getDefenseForAttack(defender, weapon) {
    if (!defender || !weapon) return 0;
 
    if (weapon.damageType === "magical") {
      return defender.res || 0;
    }
 
    return (defender.def || 0) + this.getTerrainDefenseBonus(defender);
  }
 
  calculateDamage(attacker, defender, weapon) {
    if (!attacker || !defender || !weapon) return 0;
 
    const attackStatName = weapon.stat || "str";
    const attackStat = attacker[attackStatName] || 0;
    const baseDamage = weapon.baseDamage ?? weapon.damage ?? 0;
    const defense = this.getDefenseForAttack(defender, weapon);
 
    return Math.max(0, baseDamage + attackStat - defense);
  }
 
  calculateAttackCount(attacker, defender, weapon) {
    if (!attacker || !defender) return 1;
 
    const attackerSpeed = this.getEffectiveSpeed(attacker, weapon);
    const defenderWeapon = getWeaponForTarget(defender, attacker) || getDefaultWeapon(defender);
    const defenderSpeed = this.getEffectiveSpeed(defender, defenderWeapon);
    const speedGap = attackerSpeed - defenderSpeed;
 
    return Math.max(1, 1 + Math.floor(speedGap / 5));
  }
 
  rollHit(weapon) {
    const hitRate = weapon?.hitRate ?? 100;
    const roll = Phaser.Math.Between(1, 100);
 
    return roll <= hitRate;
  }
 
  resolveAttackSequence(attacker, defender, weapon) {
    const attackCount = this.calculateAttackCount(attacker, defender, weapon);
    const results = [];
    let totalDamage = 0;
    let didKill = false;
 
    for (let i = 0; i < attackCount; i++) {
      if (defender.hp <= 0) break;
 
      const hit = this.rollHit(weapon);
 
      if (!hit) {
        results.push({ hit: false, damage: 0 });
        continue;
      }
 
      const damage = this.calculateDamage(attacker, defender, weapon);
      defender.hp = Math.max(0, defender.hp - damage);
      totalDamage += damage;
      results.push({ hit: true, damage });
 
      if (defender.hp <= 0) {
        didKill = true;
        break;
      }
    }
 
    return { attackCount, results, totalDamage, didKill };
  }
 
  showCombatResultText(unit, result, index = 0) {
    const text = result.hit ? `-${result.damage}` : "MISS";
    const color = result.hit ? "#fca5a5" : "#fef3c7";
 
    this.time.delayedCall(index * 140, () => {
      this.showFloatingText(
        this.boardX + unit.x * TILE_SIZE + TILE_SIZE / 2,
        this.boardY + unit.y * TILE_SIZE + 8,
        text,
        color
      );
    });
  }
 
  calculateXpGain(attacker, defender, didKill) {
    if (!attacker || attacker.team !== "player") return 0;
    if (!defender || defender.team !== "enemy") return 0;
 
    const attackerLevel = attacker.level || 1;
    const defenderLevel = defender.level || 1;
 
    let xp = 10;
    xp += Math.max(0, defenderLevel - attackerLevel) * 4;
    xp += Math.max(0, attackerLevel - defenderLevel) * -2;
 
    if (didKill) xp += 25;
    if (didKill && defender.boss) xp += 35;
 
    xp = Math.round(xp * (attacker.xpRate || 1));
 
    return Math.max(1, xp);
  }
 
  awardXp(unit, amount) {
    if (!unit || unit.team !== "player" || amount <= 0) return;
 
    unit.level = unit.level || 1;
    unit.xp = unit.xp || 0;
 
    const oldLevel = unit.level;
    const oldXp = unit.xp;
 
    unit.xp += amount;
 
    while (unit.xp >= 100) {
      unit.xp -= 100;
      this.levelUpUnit(unit);
    }
 
    this.showCombatXpPopup(unit, amount, oldLevel, oldXp);
    this.updateSelectedPanel();
  }
 
  levelUpUnit(unit) {
    unit.level += 1;
 
    const gains = {};
 
    Object.entries(unit.growths || {}).forEach(([stat, chance]) => {
      const roll = Phaser.Math.Between(1, 100);
 
      if (roll <= chance) {
        gains[stat] = 1;
 
        if (stat === "hp") {
          unit.maxHp += 1;
          unit.hp += 1;
        } else {
          unit[stat] += 1;
        }
      } else {
        gains[stat] = 0;
      }
    });
 
    this.showLevelUpPopup(unit, gains);
  }
 
  showLevelUpPopup(unit, gains) {
    const gainLines = Object.entries(gains)
      .filter(([, value]) => value > 0)
      .map(([stat]) => `${stat.toUpperCase()} +1`);
 
    const text = gainLines.length > 0 ? gainLines.join("\n") : "No stat gains...";
 
    const popup = this.add.container(GAME_WIDTH / 2, GAME_HEIGHT / 2);
 
    const bg = this.add.rectangle(0, 0, 300, 220, 0x020617, 0.96);
    bg.setStrokeStyle(2, 0xfcd34d);
 
    const title = this.add.text(0, -82, "LEVEL UP!", {
      fontSize: "26px",
      fontStyle: "bold",
      color: "#fcd34d",
    }).setOrigin(0.5);
 
    const name = this.add.text(0, -46, `${unit.name} reached Lv ${unit.level}`, {
      fontSize: "18px",
      fontStyle: "bold",
      color: "#ffffff",
    }).setOrigin(0.5);
 
    const stats = this.add.text(0, -10, text, {
      fontSize: "16px",
      color: "#e2e8f0",
      align: "center",
      lineSpacing: 6,
    }).setOrigin(0.5, 0);
 
    const continueText = this.add.text(0, 82, "Click to continue", {
      fontSize: "14px",
      color: "#94a3b8",
    }).setOrigin(0.5);
 
    popup.add([bg, title, name, stats, continueText]);
    popup.setDepth(9999);
    popup.setAlpha(0);
 
    this.tweens.add({
      targets: popup,
      alpha: 1,
      duration: 180,
    });
 
    bg.setInteractive({ useHandCursor: true });
    bg.on("pointerdown", () => {
      popup.destroy();
    });
 
    this.uiLayer.add(popup);
  }
 
  showFloatingText(x, y, text, color = "#ffffff") {
    const floating = this.add.text(x, y, text, {
      fontSize: "18px",
      fontStyle: "bold",
      color,
      stroke: "#000000",
      strokeThickness: 4,
    }).setOrigin(0.5);
 
    floating.setDepth(9999);
 
    this.tweens.add({
      targets: floating,
      y: y - 28,
      alpha: 0,
      duration: 900,
      ease: "Cubic.easeOut",
      onComplete: () => floating.destroy(),
    });
 
    return floating;
  }
 
  fitImageInBox(image, textureKey, maxWidth, maxHeight) {
    if (!image) return;
 
    if (textureKey && this.textures.exists(textureKey)) {
      image.setTexture(textureKey);
    }
 
    const source = image.texture?.getSourceImage?.();
 
    if (!source?.width || !source?.height) {
      image.setDisplaySize(maxWidth, maxHeight);
      return;
    }
 
    const scale = Math.min(maxWidth / source.width, maxHeight / source.height);
    image.setDisplaySize(source.width * scale, source.height * scale);
  }
 
  createPostBattleUI() {
    this.postBattleContainer = this.add.container(0, 0);
    this.postBattleContainer.setVisible(false);
    this.postBattleContainer.setDepth(9997);
 
    this.postBattleDim = this.add.rectangle(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2,
      GAME_WIDTH,
      GAME_HEIGHT,
      0x000000,
      0.18
    );
 
    this.postBattleFullSceneImage = this.add.image(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2,
      "byronFarmScene"
    );
    this.postBattleFullSceneImage.setDisplaySize(GAME_WIDTH, GAME_HEIGHT);
    this.postBattleFullSceneImage.setVisible(false);
 
    this.postBattleMainPanel = this.add.rectangle(480, 250, 860, 430, 0x020617, 0.78);
    this.postBattleMainPanel.setStrokeStyle(2, 0x475569);
 
    this.postBattleSceneFrame = this.add.rectangle(315, 175, 560, 315, 0x111827, 1);
    this.postBattleSceneFrame.setStrokeStyle(2, 0x64748b);
 
    this.postBattleSceneImage = this.add.image(315, 175, "vanInteriorScene");
    this.fitImageInBox(this.postBattleSceneImage, "vanInteriorScene", 548, 308);
 
    this.postBattleSceneName = this.add.text(54, 30, "", {
      fontSize: "16px",
      color: "#fcd34d",
      fontStyle: "bold",
    });
 
    this.postBattlePortraitPanel = this.add.rectangle(720, 175, 180, 200, 0x111827, 1);
    this.postBattlePortraitPanel.setStrokeStyle(2, 0x64748b);
 
    this.postBattlePortraitFrame = this.add.rectangle(720, 160, 120, 140, 0x1f2937);
    this.postBattlePortraitFrame.setStrokeStyle(2, 0x64748b);
 
    this.postBattlePortrait = this.add.image(720, 160, "leonPortrait");
    this.postBattlePortrait.setDisplaySize(110, 132);
 
    this.postBattleOverlapPortrait = this.add.image(682, 164, "heathPortrait");
    this.postBattleOverlapPortrait.setDisplaySize(90, 108);
    this.postBattleOverlapPortrait.setAlpha(0.9);
    this.postBattleOverlapPortrait.setVisible(false);
 
    this.postBattlePortraitPlaceholder = this.add.text(720, 160, "NO\nART", {
      fontSize: "20px",
      color: "#94a3b8",
      align: "center",
    }).setOrigin(0.5);
 
    const textBox = this.add.rectangle(480, 395, 800, 120, 0xf8f5ee, 0.98);
    textBox.setStrokeStyle(2, 0xb8aa8a);
    this.postBattleTextBox = textBox;
 
    this.postBattleSpeaker = this.add.text(90, 343, "", {
      fontSize: "24px",
      fontStyle: "bold",
      color: "#1e293b",
    });
 
    this.postBattleText = this.add.text(90, 378, "", {
      fontSize: "20px",
      color: "#334155",
      wordWrap: { width: 660 },
      lineSpacing: 8,
    });
 
    this.postBattleNextButton = this.add.rectangle(820, 460, 110, 34, 0x2563eb);
    this.postBattleNextButton.setStrokeStyle(2, 0x93c5fd);
    this.postBattleNextButton.setInteractive({ useHandCursor: true });
    this.postBattleNextButton.on("pointerdown", () => this.advancePostBattle());
 
    this.postBattleNextLabel = this.add.text(785, 449, "Next", {
      fontSize: "16px",
      fontStyle: "bold",
      color: "#ffffff",
    });
 
    this.savePromptContainer = this.add.container(GAME_WIDTH / 2, GAME_HEIGHT / 2);
    this.savePromptContainer.setVisible(false);
 
    const saveBg = this.add.rectangle(0, 0, 430, 230, 0x020617, 0.96);
    saveBg.setStrokeStyle(2, 0xfcd34d);
 
    this.savePromptTitle = this.add.text(0, -72, "Chapter 1 Complete", {
      fontSize: "30px",
      fontStyle: "bold",
      color: "#fcd34d",
    }).setOrigin(0.5);
 
    this.savePromptText = this.add.text(0, -28, "Save game?", {
      fontSize: "20px",
      color: "#f8fafc",
    }).setOrigin(0.5);
 
    const saveButton = this.add.rectangle(-92, 48, 130, 40, 0x2563eb);
    saveButton.setStrokeStyle(2, 0x93c5fd);
    saveButton.setInteractive({ useHandCursor: true });
    saveButton.on("pointerdown", () => this.saveChapterOne());
 
    const saveButtonText = this.add.text(-92, 48, "Save", {
      fontSize: "18px",
      fontStyle: "bold",
      color: "#ffffff",
    }).setOrigin(0.5);
 
    const continueButton = this.add.rectangle(92, 48, 130, 40, 0x334155);
    continueButton.setStrokeStyle(2, 0x94a3b8);
    continueButton.setInteractive({ useHandCursor: true });
    continueButton.on("pointerdown", () => this.finishChapterOne());
 
    const continueButtonText = this.add.text(92, 48, "Continue", {
      fontSize: "18px",
      fontStyle: "bold",
      color: "#ffffff",
    }).setOrigin(0.5);
 
    this.savePromptStatus = this.add.text(0, 92, "", {
      fontSize: "14px",
      color: "#86efac",
    }).setOrigin(0.5);
 
    this.savePromptContainer.add([
      saveBg,
      this.savePromptTitle,
      this.savePromptText,
      saveButton,
      saveButtonText,
      continueButton,
      continueButtonText,
      this.savePromptStatus,
    ]);
 
    this.postBattleContainer.add([
      this.postBattleDim,
      this.postBattleFullSceneImage,
      this.postBattleMainPanel,
      this.postBattleSceneFrame,
      this.postBattleSceneImage,
      this.postBattleSceneName,
      this.postBattlePortraitPanel,
      this.postBattlePortraitFrame,
      this.postBattleOverlapPortrait,
      this.postBattlePortrait,
      this.postBattlePortraitPlaceholder,
      this.postBattleTextBox,
      this.postBattleSpeaker,
      this.postBattleText,
      this.postBattleNextButton,
      this.postBattleNextLabel,
      this.savePromptContainer,
    ]);
 
    this.uiLayer.add(this.postBattleContainer);
  }
 
  setPostBattlePortrait(portraitKey, overlapPortraitKey = null) {
    this.postBattleOverlapPortrait.setVisible(false);
 
    if (!portraitKey) {
      this.postBattlePortraitPanel.setVisible(false);
      this.postBattlePortraitFrame.setVisible(false);
      this.postBattlePortrait.setVisible(false);
      this.postBattlePortraitPlaceholder.setVisible(false);
      return;
    }
 
    this.postBattlePortraitPanel.setVisible(true);
    this.postBattlePortraitFrame.setVisible(true);
 
    if (this.textures.exists(portraitKey)) {
      this.postBattlePortrait.setTexture(portraitKey);
      this.postBattlePortrait.setDisplaySize(110, 132);
      this.postBattlePortrait.setVisible(true);
      this.postBattlePortraitPlaceholder.setVisible(false);
    } else {
      this.postBattlePortrait.setVisible(false);
      this.postBattlePortraitPlaceholder.setVisible(true);
    }
 
    if (overlapPortraitKey && this.textures.exists(overlapPortraitKey)) {
      this.postBattleOverlapPortrait.setTexture(overlapPortraitKey);
      this.postBattleOverlapPortrait.setDisplaySize(90, 108);
      this.postBattleOverlapPortrait.setVisible(true);
      this.postBattleOverlapPortrait.setDepth(this.postBattlePortrait.depth + 1);
    }
  }
 
  startPostBattleScene() {
    if (this.postBattleStarted) return;
 
    this.stopBattleMusic();
    this.postBattleStarted = true;
    this.phase = "postbattle";
    this.busy = true;
    this.previewOpen = false;
    this.previewData = null;
 
    if (this.previewContainer) {
      this.previewContainer.setVisible(false);
    }
 
    this.selectedUnitId = null;
    this.moveTiles = [];
    this.targetTiles = [];
    this.overlayLayer.removeAll(true);
    this.updateSelectedPanel();
    this.phaseText.setText("Chapter Complete");
    this.phaseText.setColor("#86efac");
    this.helpText.setText("The battle is over.");
 
    this.postBattleStep = 0;
    this.postBattleActionSteps = new Set();
    this.postBattleContainer.setVisible(true);
    this.postBattleContainer.setAlpha(0);
 
    this.tweens.add({
      targets: this.postBattleContainer,
      alpha: 1,
      duration: 250,
      onComplete: () => this.updatePostBattleUI(),
    });
  }
 
  setFalanFinalDeathPose() {
    const falan = this.units.find((unit) => unit.id === "falan");
    const sprite = this.unitSprites.falan;
 
    if (!falan || !sprite) return;
 
    falan.hp = 0;
    this.refreshUnitSprite(falan);
    sprite.hpText.setText("HP 0");
 
    const usedDeathFrame = this.setUnitDeathFrame(falan, 1);
 
    if (!usedDeathFrame) {
      sprite.marker.setFillStyle(0x7f1d1d, 1);
      if (sprite.label) sprite.label.setText("KO");
      sprite.container.setScale(1, 0.72);
    }
  }
 
  fadeUnitOut(unitId) {
    const unit = this.units.find((candidate) => candidate.id === unitId);
    const sprite = this.unitSprites[unitId];
 
    if (!sprite) {
      this.units = this.units.filter((candidate) => candidate.id !== unitId);
      return;
    }
 
    if (unit) {
      this.playUnitDeath(unit, () => this.removeUnitSpriteAndData(unitId));
      return;
    }
 
    this.tweens.add({
      targets: sprite.container,
      alpha: 0,
      duration: 900,
      ease: "Quad.Out",
      onComplete: () => this.removeUnitSpriteAndData(unitId),
    });
  }
 
  playPostBattleUnitDeath(unitId, autoAdvanceDelay = 1400) {
    if (this.postBattleActionSteps.has(this.postBattleStep)) return;
 
    this.postBattleActionSteps.add(this.postBattleStep);
 
    const unit = this.units.find((candidate) => candidate.id === unitId);
    const sprite = this.unitSprites[unitId];
 
    if (unit && sprite) {
      unit.hp = 0;
      this.refreshUnitSprite(unit);
      this.playUnitDeath(unit, () => this.removeUnitSpriteAndData(unitId));
    } else if (sprite) {
      this.tweens.add({
        targets: sprite.container,
        alpha: 0,
        duration: 650,
        ease: "Quad.Out",
        onComplete: () => this.removeUnitSpriteAndData(unitId),
      });
    } else {
      this.units = this.units.filter((candidate) => candidate.id !== unitId);
    }
 
    this.time.delayedCall(autoAdvanceDelay, () => {
      if (this.phase !== "postbattle") return;
      this.postBattleStep += 1;
      this.updatePostBattleUI();
    });
  }
 
  updatePostBattleUI() {
    const line = POST_BATTLE_SCENE[this.postBattleStep];
    if (!line) {
      this.showSavePrompt();
      return;
    }
 
    this.savePromptContainer.setVisible(false);
    this.postBattleNextButton.setVisible(line.type !== "savePrompt");
    this.postBattleNextLabel.setVisible(line.type !== "savePrompt");
    this.postBattleFullSceneImage.setVisible(false);
    this.postBattleMainPanel.setVisible(true);
    this.postBattleSceneFrame.setVisible(false);
    this.postBattleSceneImage.setVisible(false);
    this.postBattleSceneName.setVisible(false);
    this.postBattlePortraitPanel.setVisible(true);
    this.postBattlePortraitFrame.setVisible(true);
    this.postBattlePortrait.setVisible(true);
    this.postBattlePortraitPlaceholder.setVisible(false);
    this.postBattleTextBox.setVisible(true);
    this.postBattleSpeaker.setVisible(true);
    this.postBattleText.setVisible(true);
    this.postBattleDim.setAlpha(0.18);
 
    if (line.type === "savePrompt") {
      this.showSavePrompt(line);
      return;
    }
 
    if (line.type === "fullScreenScene") {
      this.postBattleDim.setAlpha(1);
      if (line.scene && this.textures.exists(line.scene)) {
        this.fitImageInBox(this.postBattleFullSceneImage, line.scene, GAME_WIDTH, GAME_HEIGHT);
      }
      this.postBattleFullSceneImage.setVisible(true);
      this.postBattleMainPanel.setVisible(false);
      this.postBattleSceneFrame.setVisible(false);
      this.postBattleSceneImage.setVisible(false);
      this.postBattleSceneName.setVisible(false);
      this.postBattlePortraitPanel.setVisible(false);
      this.postBattlePortraitFrame.setVisible(false);
      this.postBattlePortrait.setVisible(false);
      this.postBattleOverlapPortrait.setVisible(false);
      this.postBattlePortraitPlaceholder.setVisible(false);
      this.postBattleSpeaker.setText(line.sceneName || "");
      this.postBattleText.setText(line.text || "");
      return;
    }
 
    if (line.type === "unitDeath") {
      this.postBattleDim.setAlpha(0.08);
      this.postBattleMainPanel.setVisible(false);
      this.postBattleSceneFrame.setVisible(false);
      this.postBattleSceneImage.setVisible(false);
      this.postBattleSceneName.setVisible(false);
      this.postBattlePortraitPanel.setVisible(false);
      this.postBattlePortraitFrame.setVisible(false);
      this.postBattlePortrait.setVisible(false);
      this.postBattleOverlapPortrait.setVisible(false);
      this.postBattlePortraitPlaceholder.setVisible(false);
      this.postBattleTextBox.setVisible(false);
      this.postBattleSpeaker.setVisible(false);
      this.postBattleText.setVisible(false);
      this.postBattleNextButton.setVisible(false);
      this.postBattleNextLabel.setVisible(false);
      this.playPostBattleUnitDeath(line.unitId, line.autoAdvanceDelay || 1400);
      return;
    }
 
    if (
      line.type === "sceneDialogue" ||
      line.type === "sceneNarration" ||
      line.type === "overlapDialogue"
    ) {
      this.postBattleDim.setAlpha(0.82);
      this.postBattleSceneFrame.setVisible(true);
      this.postBattleSceneImage.setVisible(true);
      this.postBattleSceneName.setVisible(true);
      this.postBattleSceneName.setText(line.sceneName || "");
 
      if (line.scene && this.textures.exists(line.scene)) {
        this.fitImageInBox(this.postBattleSceneImage, line.scene, 548, 308);
      }
    }
 
    if (line.type === "mapDialogue" || line.type === "mapAction" || line.type === "fadeUnit") {
      this.postBattleDim.setAlpha(0.18);
      this.postBattleSceneFrame.setVisible(false);
      this.postBattleSceneImage.setVisible(false);
      this.postBattleSceneName.setVisible(false);
    }
 
    this.postBattleSpeaker.setText(line.speaker || "");
    this.postBattleText.setText(line.text || "");
    this.setPostBattlePortrait(line.portrait, line.overlapPortrait);
 
    if (line.type === "fadeUnit" && !this.postBattleActionSteps.has(this.postBattleStep)) {
      this.postBattleActionSteps.add(this.postBattleStep);
      this.fadeUnitOut(line.unitId);
    }
  }
 
  advancePostBattle() {
    if (this.phase !== "postbattle") return;
 
    this.postBattleStep += 1;
 
    if (this.postBattleStep >= POST_BATTLE_SCENE.length) {
      this.showSavePrompt();
      return;
    }
 
    this.updatePostBattleUI();
  }
 
  showSavePrompt(line = null) {
    this.postBattleDim.setAlpha(1);
    this.postBattleFullSceneImage.setVisible(false);
    if (this.textures.exists("byronFarmScene")) {
      this.fitImageInBox(this.postBattleFullSceneImage, "byronFarmScene", GAME_WIDTH, GAME_HEIGHT);
    }
    this.postBattleFullSceneImage.setVisible(true);
 
    this.postBattleMainPanel.setVisible(false);
    this.postBattleSceneFrame.setVisible(false);
    this.postBattleSceneImage.setVisible(false);
    this.postBattleSceneName.setVisible(false);
    this.postBattlePortraitPanel.setVisible(false);
    this.postBattlePortraitFrame.setVisible(false);
    this.postBattlePortrait.setVisible(false);
    this.postBattleOverlapPortrait.setVisible(false);
    this.postBattlePortraitPlaceholder.setVisible(false);
    this.postBattleTextBox.setVisible(false);
    this.postBattleSpeaker.setVisible(false);
    this.postBattleText.setVisible(false);
    this.postBattleNextButton.setVisible(false);
    this.postBattleNextLabel.setVisible(false);
 
    this.savePromptTitle.setText(line?.title || "Chapter 1 Complete");
    this.savePromptText.setText(line?.text || "Save game?");
    this.savePromptStatus.setText("");
    this.savePromptContainer.setVisible(true);
  }
 
  saveChapterOne() {
    const saveData = {
      chapter: 1,
      chapterName: "Prologue - Underpass",
      completed: true,
      completedAt: new Date().toISOString(),
    };
 
    try {
      window.localStorage.setItem("bardsTacticsSave", JSON.stringify(saveData));
      this.savePromptStatus.setText("Game saved.");
    } catch (error) {
      this.savePromptStatus.setText("Save failed in this browser preview.");
    }
  }
 
  finishChapterOne() {
    this.phaseText.setText("Chapter 1 Complete");
    this.phaseText.setColor("#fcd34d");
    this.helpText.setText("Chapter 1 complete. Save data is stored locally in this browser preview.");
    this.busy = false;
  }
 
  createOpeningUI() {
    this.openingContainer = this.add.container(0, 0);
 
    this.openingFade = this.add.rectangle(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2,
      GAME_WIDTH,
      GAME_HEIGHT,
      0x000000,
      0.88
    );
 
    this.titleCard = this.add.container(0, 0);
 
    const titleBg = this.add.rectangle(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2,
      520,
      220,
      0x0f172a,
      0.94
    );
    titleBg.setStrokeStyle(2, 0x475569);
 
    this.titleChapter = this.add.text(GAME_WIDTH / 2, 215, "", {
      fontSize: "42px",
      fontStyle: "bold",
      color: "#ffffff",
    }).setOrigin(0.5);
 
    this.titleSubtitle = this.add.text(GAME_WIDTH / 2, 270, "", {
      fontSize: "28px",
      color: "#fcd34d",
    }).setOrigin(0.5);
 
    this.titleTag = this.add.text(GAME_WIDTH / 2, 315, "", {
      fontSize: "18px",
      color: "#cbd5e1",
    }).setOrigin(0.5);
 
    const titleContinueButton = this.add.rectangle(GAME_WIDTH / 2, 370, 170, 38, 0x2563eb);
    titleContinueButton.setStrokeStyle(2, 0x93c5fd);
    titleContinueButton.setInteractive({ useHandCursor: true });
    titleContinueButton.on("pointerdown", () => this.advanceOpening());
 
    const titleContinueText = this.add.text(GAME_WIDTH / 2, 370, "Continue", {
      fontSize: "18px",
      fontStyle: "bold",
      color: "#ffffff",
    }).setOrigin(0.5);
 
    this.titleCard.add([
      titleBg,
      this.titleChapter,
      this.titleSubtitle,
      this.titleTag,
      titleContinueButton,
      titleContinueText,
    ]);
 
    this.dialogueCard = this.add.container(0, 0);
 
    const mainPanel = this.add.rectangle(480, 250, 860, 430, 0x020617, 0.92);
    mainPanel.setStrokeStyle(2, 0x475569);
 
    const sceneFrame = this.add.rectangle(315, 175, 560, 315, 0x111827, 1);
    sceneFrame.setStrokeStyle(2, 0x64748b);
 
    this.dialogueSceneImage = this.add.image(315, 175, "prologueScene");
    this.fitImageInBox(this.dialogueSceneImage, "prologueScene", 548, 308);
 
    this.dialogueSceneName = this.add.text(54, 30, "", {
      fontSize: "16px",
      color: "#fcd34d",
      fontStyle: "bold",
    });
 
    this.dialoguePortraitPanel = this.add.rectangle(720, 175, 180, 200, 0x111827, 1);
    this.dialoguePortraitPanel.setStrokeStyle(2, 0x64748b);
 
    this.dialoguePortraitFrame = this.add.rectangle(720, 160, 120, 140, 0x1f2937);
    this.dialoguePortraitFrame.setStrokeStyle(2, 0x64748b);
 
    this.dialoguePortrait = this.add.image(720, 160, "edwinPortrait");
    this.dialoguePortrait.setDisplaySize(110, 132);
 
    this.dialoguePortraitPlaceholder = this.add.text(720, 160, "NO\nART", {
      fontSize: "20px",
      color: "#94a3b8",
      align: "center",
    }).setOrigin(0.5);
 
    this.impactContainer = this.add.container(0, 0);
    this.impactContainer.setVisible(false);
 
    const impactShadow = this.add.rectangle(480, 175, 560, 190, 0x020617, 0.82);
    impactShadow.setStrokeStyle(2, 0x64748b);
 
    this.impactAttackerSlot = this.add.container(320, 175);
    this.impactAttackerFrame = this.add.rectangle(0, 0, 130, 150, 0x1f2937, 1);
    this.impactAttackerFrame.setStrokeStyle(2, 0x64748b);
    this.impactAttackerImage = this.add.image(0, -6, "edwinPortrait");
    this.impactAttackerImage.setDisplaySize(112, 132);
    this.impactAttackerPlaceholder = this.add.text(0, -6, "NO\nART", {
      fontSize: "20px",
      color: "#94a3b8",
      align: "center",
    }).setOrigin(0.5);
    this.impactAttackerName = this.add.text(0, 86, "", {
      fontSize: "16px",
      fontStyle: "bold",
      color: "#ffffff",
    }).setOrigin(0.5);
    this.impactAttackerSlot.add([
      this.impactAttackerFrame,
      this.impactAttackerImage,
      this.impactAttackerPlaceholder,
      this.impactAttackerName,
    ]);
 
    this.impactDefenderSlot = this.add.container(640, 175);
    this.impactDefenderFrame = this.add.rectangle(0, 0, 130, 150, 0x1f2937, 1);
    this.impactDefenderFrame.setStrokeStyle(2, 0x64748b);
    this.impactDefenderImage = this.add.image(0, -6, "edwinPortrait");
    this.impactDefenderImage.setDisplaySize(112, 132);
    this.impactDefenderPlaceholder = this.add.text(0, -6, "NO\nART", {
      fontSize: "20px",
      color: "#94a3b8",
      align: "center",
    }).setOrigin(0.5);
    this.impactDefenderName = this.add.text(0, 86, "", {
      fontSize: "16px",
      fontStyle: "bold",
      color: "#ffffff",
    }).setOrigin(0.5);
    this.impactDefenderSlot.add([
      this.impactDefenderFrame,
      this.impactDefenderImage,
      this.impactDefenderPlaceholder,
      this.impactDefenderName,
    ]);
 
    this.impactText = this.add.text(480, 175, "SMASH!", {
      fontSize: "28px",
      fontStyle: "bold",
      color: "#f8fafc",
      stroke: "#0f172a",
      strokeThickness: 6,
    }).setOrigin(0.5);
 
    this.impactContainer.add([
      impactShadow,
      this.impactAttackerSlot,
      this.impactDefenderSlot,
      this.impactText,
    ]);
 
    const textBox = this.add.rectangle(480, 395, 800, 120, 0xf8f5ee, 0.98);
    textBox.setStrokeStyle(2, 0xb8aa8a);
 
    this.dialogueSpeaker = this.add.text(90, 343, "", {
      fontSize: "24px",
      fontStyle: "bold",
      color: "#1e293b",
    });
 
    this.dialogueText = this.add.text(90, 378, "", {
      fontSize: "20px",
      color: "#334155",
      wordWrap: { width: 660 },
      lineSpacing: 8,
    });
 
    this.openingBackButton = this.add.rectangle(700, 460, 110, 34, 0x334155);
    this.openingBackButton.setStrokeStyle(2, 0x94a3b8);
    this.openingBackButton.setInteractive({ useHandCursor: true });
    this.openingBackButton.on("pointerdown", () => this.goOpeningBack());
 
    const backText = this.add.text(668, 449, "Back", {
      fontSize: "16px",
      fontStyle: "bold",
      color: "#ffffff",
    });
 
    this.openingNextButton = this.add.rectangle(820, 460, 110, 34, 0x2563eb);
    this.openingNextButton.setStrokeStyle(2, 0x93c5fd);
    this.openingNextButton.setInteractive({ useHandCursor: true });
    this.openingNextButton.on("pointerdown", () => this.advanceOpening());
 
    this.openingNextLabel = this.add.text(785, 449, "Next", {
      fontSize: "16px",
      fontStyle: "bold",
      color: "#ffffff",
    });
 
    this.openingSkipButton = this.add.rectangle(810, 50, 110, 30, 0x3f3f46);
    this.openingSkipButton.setStrokeStyle(2, 0xa1a1aa);
    this.openingSkipButton.setInteractive({ useHandCursor: true });
    this.openingSkipButton.on("pointerdown", () => this.skipOpening());
 
    const skipText = this.add.text(777, 40, "Skip", {
      fontSize: "14px",
      fontStyle: "bold",
      color: "#ffffff",
    });
 
    this.dialogueCard.add([
      mainPanel,
      sceneFrame,
      this.dialogueSceneImage,
      this.dialogueSceneName,
      this.dialoguePortraitPanel,
      this.dialoguePortraitFrame,
      this.dialoguePortrait,
      this.dialoguePortraitPlaceholder,
      this.impactContainer,
      textBox,
      this.dialogueSpeaker,
      this.dialogueText,
      this.openingBackButton,
      backText,
      this.openingNextButton,
      this.openingNextLabel,
      this.openingSkipButton,
      skipText,
    ]);
 
    this.openingContainer.add([
      this.openingFade,
      this.titleCard,
      this.dialogueCard,
    ]);
 
    this.uiLayer.add(this.openingContainer);
  }
 
  setImpactPortrait(image, placeholder, nameText, name, portraitKey) {
    nameText.setText(name || "");
 
    if (portraitKey && this.textures.exists(portraitKey)) {
      image.setTexture(portraitKey);
      image.setVisible(true);
      placeholder.setVisible(false);
    } else {
      image.setVisible(false);
      placeholder.setVisible(true);
    }
  }
 
  playImpactBeat(line) {
    if (line.defender === "Kayley") {
      this.startBattleMusic();
    }
 
    this.setImpactPortrait(
      this.impactAttackerImage,
      this.impactAttackerPlaceholder,
      this.impactAttackerName,
      line.attacker,
      line.attackerPortrait
    );
 
    this.setImpactPortrait(
      this.impactDefenderImage,
      this.impactDefenderPlaceholder,
      this.impactDefenderName,
      line.defender,
      line.defenderPortrait
    );
 
    this.tweens.killTweensOf(this.impactAttackerSlot);
    this.tweens.killTweensOf(this.impactDefenderSlot);
    this.tweens.killTweensOf(this.impactText);
 
    this.impactAttackerSlot.x = 320;
    this.impactDefenderSlot.x = 640;
    this.impactText.setAlpha(0);
    this.impactText.setScale(0.7);
    this.impactDefenderFrame.setFillStyle(0x1f2937);
    this.impactAttackerFrame.setFillStyle(0x1f2937);
 
    if (this.impactDefenderImage.visible) {
      this.impactDefenderImage.clearTint();
    }
 
    if (this.impactAttackerImage.visible) {
      this.impactAttackerImage.clearTint();
    }
 
    this.tweens.add({
      targets: this.impactAttackerSlot,
      x: 390,
      duration: 120,
      ease: "Cubic.Out",
      onComplete: () => {
        this.impactText.setText(line.attacker === "Edwin" ? "SLASH!" : "SMASH!");
        this.impactText.setAlpha(1);
 
        this.tweens.add({
          targets: this.impactText,
          scale: 1.15,
          alpha: 0,
          duration: 220,
          ease: "Quad.Out",
        });
 
        this.impactDefenderFrame.setFillStyle(0x7f1d1d);
 
        if (this.impactDefenderImage.visible) {
          this.impactDefenderImage.setTintFill(0xff6666);
        }
 
        this.tweens.add({
          targets: this.impactDefenderSlot,
          x: 675,
          duration: 40,
          yoyo: true,
          repeat: 3,
          onComplete: () => {
            this.impactDefenderSlot.x = 640;
            this.impactDefenderFrame.setFillStyle(0x1f2937);
 
            if (this.impactDefenderImage.visible) {
              this.impactDefenderImage.clearTint();
            }
          },
        });
 
        this.time.delayedCall(120, () => {
          this.tweens.add({
            targets: this.impactAttackerSlot,
            x: 320,
            duration: 120,
            ease: "Cubic.Out",
          });
        });
      },
    });
  }
 
  updateOpeningUI() {
    const step = CHAPTER_OPENING[this.openingStep];
 
    if (step.type === "title") {
      this.titleCard.setVisible(true);
      this.dialogueCard.setVisible(false);
      this.titleChapter.setText(step.chapter);
      this.titleSubtitle.setText(step.subtitle);
      this.titleTag.setText(step.tag);
      this.helpText.setText("Chapter opening.");
      return;
    }
 
    this.titleCard.setVisible(false);
    this.dialogueCard.setVisible(true);
 
    const line = step.lines[this.openingLine];
    const isImpact = line.type === "impact";
 
    this.dialogueSceneName.setText(step.sceneName);
    const sceneTextureKey = step.background || "prologueScene";
    if (this.textures.exists(sceneTextureKey)) {
      this.fitImageInBox(this.dialogueSceneImage, sceneTextureKey, 548, 308);
    }
    this.dialogueSceneImage.setAlpha(isImpact ? 0.3 : 1);
    this.impactContainer.setVisible(isImpact);
    this.dialoguePortraitPanel.setVisible(!isImpact);
    this.dialoguePortraitFrame.setVisible(!isImpact);
 
    if (isImpact) {
      this.dialogueSpeaker.setText("");
      this.dialogueText.setText(line.text);
      this.dialoguePortrait.setVisible(false);
      this.dialoguePortraitPlaceholder.setVisible(false);
      this.playImpactBeat(line);
    } else {
      this.dialogueSpeaker.setText(line.speaker);
      this.dialogueText.setText(line.text);
 
      if (line.portrait && this.textures.exists(line.portrait)) {
        this.dialoguePortraitPanel.setVisible(true);
        this.dialoguePortraitFrame.setVisible(true);
        this.dialoguePortrait.setTexture(line.portrait);
        this.dialoguePortrait.setDisplaySize(110, 132);
        this.dialoguePortrait.setVisible(true);
        this.dialoguePortraitPlaceholder.setVisible(false);
      } else {
        this.dialoguePortraitPanel.setVisible(false);
        this.dialoguePortraitFrame.setVisible(false);
        this.dialoguePortrait.setVisible(false);
        this.dialoguePortraitPlaceholder.setVisible(false);
      }
    }
 
    this.openingBackButton.setAlpha(this.openingStep === 0 && this.openingLine === 0 ? 0.4 : 1);
 
    const lastStep = this.openingStep === CHAPTER_OPENING.length - 1;
    const lastLine = this.openingLine === step.lines.length - 1;
    this.openingNextLabel.setText(lastStep && lastLine ? "Start" : "Next");
  }
 
  goOpeningBack() {
    if (this.openingStep === 0) return;
 
    if (CHAPTER_OPENING[this.openingStep].type === "scene" && this.openingLine > 0) {
      this.openingLine -= 1;
    } else {
      this.openingStep -= 1;
      const prev = CHAPTER_OPENING[this.openingStep];
      this.openingLine = prev.type === "scene" ? prev.lines.length - 1 : 0;
    }
 
    this.updateOpeningUI();
  }
 
  advanceOpening() {
    const step = CHAPTER_OPENING[this.openingStep];
 
    if (step.type === "title") {
      this.openingStep += 1;
      this.openingLine = 0;
      this.updateOpeningUI();
      return;
    }
 
    if (this.openingLine < step.lines.length - 1) {
      this.openingLine += 1;
      this.updateOpeningUI();
      return;
    }
 
    if (this.openingStep < CHAPTER_OPENING.length - 1) {
      this.openingStep += 1;
      this.openingLine = 0;
      this.updateOpeningUI();
      return;
    }
 
    this.finishOpening();
  }
 
  skipOpening() {
    this.finishOpening();
  }
 
  finishOpening() {
    this.openingContainer.setVisible(false);
    this.phase = "player";
    this.phaseText.setText("Player Phase");
    this.phaseText.setColor("#93c5fd");
    this.helpText.setText("Player Phase. Click Edwin or Leon.");
  }
 
  startBattleMusic() {
    const musicConfig = this.levelData?.battleMusic;
    if (!musicConfig?.key) return;
    if (this.battleMusicStarted) return;
 
    if (!this.cache.audio.exists(musicConfig.key)) {
      console.warn(`Battle music not found: ${musicConfig.path}`);
      return;
    }
 
    const playMusic = () => {
      if (this.battleMusic && this.battleMusic.isPlaying) return;
 
      this.battleMusic = this.sound.add(musicConfig.key, {
        loop: true,
        volume: musicConfig.volume ?? 0.45,
      });
 
      this.battleMusic.play();
      this.battleMusicStarted = true;
    };
 
    if (this.sound.locked) {
      this.sound.once(Phaser.Sound.Events.UNLOCKED, playMusic);
    } else {
      playMusic();
    }
  }
 
  stopBattleMusic() {
    if (!this.battleMusic) {
      this.battleMusicStarted = false;
      return;
    }
 
    this.battleMusic.stop();
    this.battleMusic.destroy();
    this.battleMusic = null;
    this.battleMusicStarted = false;
  }
 
  getCurrentBiome() {
    return BIOMES[this.currentBiomeKey] || null;
  }
 
  isInBounds(x, y) {
    return x >= 0 && y >= 0 && x < this.mapCols && y < this.mapRows;
  }
 
  getTerrainAt(x, y) {
    if (!this.isInBounds(x, y)) return null;
    return this.map[y][x];
  }
 
  getTerrainTextureKey(x, y) {
    const terrain = this.getTerrainAt(x, y);
    const biome = this.getCurrentBiome();
 
    if (!biome) return null;
 
    const entry = biome.terrainTextures[terrain] || biome.terrainTextures.default;
    return entry ? entry.key : null;
  }
 
  drawBoard() {
    this.tileLayer.removeAll(true);
 
    for (let row = 0; row < this.mapRows; row++) {
      for (let col = 0; col < this.mapCols; col++) {
        const type = this.getTerrainAt(col, row);
        const textureKey = this.getTerrainTextureKey(col, row);
        const x = this.boardX + col * TILE_SIZE;
        const y = this.boardY + row * TILE_SIZE;
 
        if (textureKey && this.textures.exists(textureKey)) {
          const tileImage = this.add.image(
            x + TILE_SIZE / 2,
            y + TILE_SIZE / 2,
            textureKey
          );
          tileImage.setDisplaySize(TILE_SIZE, TILE_SIZE);
          this.tileLayer.add(tileImage);
        } else {
          const tile = this.add.rectangle(
            x + TILE_SIZE / 2,
            y + TILE_SIZE / 2,
            TILE_SIZE - 2,
            TILE_SIZE - 2,
            tileColor(type)
          );
          tile.setStrokeStyle(1, 0x111827);
          this.tileLayer.add(tile);
 
          const label = this.add.text(x + 6, y + 4, tileLabel(type), {
            fontSize: "12px",
            color: "#e5e7eb",
          });
          this.tileLayer.add(label);
        }
 
        const border = this.add.rectangle(
          x + TILE_SIZE / 2,
          y + TILE_SIZE / 2,
          TILE_SIZE,
          TILE_SIZE,
          0x000000,
          0
        );
        border.setStrokeStyle(1, 0x0f172a, 0.45);
        this.tileLayer.add(border);
      }
    }
  }
 
  drawUnits() {
    for (const unit of this.units) {
      const sprite = this.createUnitSprite(unit);
      this.unitSprites[unit.id] = sprite;
      this.unitLayer.add(sprite.container);
      this.refreshUnitSprite(unit);
      this.setUnitSpriteFrame(unit, "idle", unit.facing || "down");
    }
  }
 
  createUnitSprite(unit) {
    const marker = this.add.circle(0, 0, 18, unit.color, 0.22);
    marker.setStrokeStyle(2, 0xffffff);
 
    const label = this.add.text(
      0,
      -10,
      unit.team === "player" ? unit.name[0] : unit.boss ? "B" : "T",
      {
        fontSize: "16px",
        fontStyle: "bold",
        color: "#ffffff",
      }
    ).setOrigin(0.5);
 
    const render = this.getUnitSpriteRenderConfig(unit);
    const shadow = this.add.ellipse(
      render.shadowX || 0,
      render.shadowY ?? 2,
      render.shadowWidth || TILE_SIZE * 0.42,
      render.shadowHeight || TILE_SIZE * 0.12,
      0x000000,
      0.34
    );
    shadow.setVisible(false);
 
    const hpText = this.add.text(0, render.hpY ?? TILE_SIZE * 0.22, "", {
      fontSize: "10px",
      color: "#e5e7eb",
      stroke: "#000000",
      strokeThickness: 3,
    }).setOrigin(0.5, 0);
 
    const container = this.add.container(0, 0, [marker, label, shadow, hpText]);
 
    return { container, marker, label, shadow, hpText, image: null };
  }
 
  refreshUnitSprite(unit) {
    const sprite = this.unitSprites[unit.id];
    if (!sprite) return;
 
    sprite.container.x = this.boardX + unit.x * TILE_SIZE + TILE_SIZE / 2;
    sprite.container.y = this.boardY + unit.y * TILE_SIZE + TILE_SIZE / 2;
    sprite.hpText.setText(`HP ${unit.hp}`);
    sprite.container.alpha = unit.team === "player" && unit.acted ? 0.55 : 1;
  }
 
  getUnitSpriteRenderConfig(unit) {
    const base = UNIT_SPRITE_RENDER.default || {};
    const specific = unit ? UNIT_SPRITE_RENDER[unit.spriteSet] || UNIT_SPRITE_RENDER[unit.id] || {} : {};
 
    return {
      ...base,
      ...specific,
    };
  }
 
  getUnitSpriteSet(unit) {
    if (!unit) return null;
    return UNIT_SPRITE_SETS[unit.spriteSet] || UNIT_SPRITE_SETS[unit.id] || null;
  }
 
  getUnitSpriteTextureKey(unit, state = "idle") {
    const spriteSet = this.getUnitSpriteSet(unit);
    if (!spriteSet) return null;
 
    const entry = spriteSet[state] || spriteSet.idle;
    const candidateKeys = entry?.candidateKeys || (entry?.key ? [entry.key] : []);
 
    for (const key of candidateKeys) {
      const cleanKey = `${key}Clean`;
 
      if (UNIT_SPRITE_BACKGROUND_CLEANUP && this.textures.exists(cleanKey)) return cleanKey;
      if (this.textures.exists(key)) return key;
    }
 
    return null;
  }
 
  getDirectionFrame(direction) {
    return DIRECTION_FRAMES[direction] || DIRECTION_FRAMES.down;
  }
 
  getDeathFrame(index) {
    return DEATH_FRAMES[Phaser.Math.Clamp(index, 0, DEATH_FRAMES.length - 1)] || DEATH_FRAMES[0];
  }
 
  ensureUnitSpriteImage(unit, textureKey) {
    const sprite = this.unitSprites[unit.id];
    if (!sprite || !textureKey || !this.textures.exists(textureKey)) return null;
 
    if (!sprite.image) {
      sprite.image = this.add.image(0, 0, textureKey);
      sprite.image.setOrigin(0.5, 0.5);
      const insertIndex = sprite.container.getIndex(sprite.hpText);
      sprite.container.addAt(sprite.image, insertIndex >= 0 ? insertIndex : sprite.container.list.length);
    }
 
    return sprite.image;
  }
 
  isSpriteBackgroundPixel(r, g, b, a) {
    if (a < 24) return true;
 
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
 
    return r >= 175 && g >= 175 && b >= 175 && max - min <= 55;
  }
 
  isLikelyWeaponOrMagicPixel(r, g, b, a) {
    if (a < 24) return false;
 
    const blueIce = b > r + 35 && b > g + 20;
    const brightMetal = r > 185 && g > 185 && b > 185;
 
    return blueIce || brightMetal;
  }
 
  getSpriteFootAnchorFromPixels(data, cellWidth, cellHeight, bounds) {
    const bottomBandHeight = Math.max(8, Math.floor(bounds.height * 0.26));
    const startY = Math.max(bounds.y, bounds.y + bounds.height - bottomBandHeight);
    const endY = Math.min(cellHeight - 1, bounds.y + bounds.height - 1);
    const startX = Math.max(0, bounds.x);
    const endX = Math.min(cellWidth - 1, bounds.x + bounds.width - 1);
 
    let totalX = 0;
    let totalY = 0;
    let totalWeight = 0;
 
    for (let y = startY; y <= endY; y += 1) {
      for (let x = startX; x <= endX; x += 1) {
        const index = (y * cellWidth + x) * 4;
        const r = data[index];
        const g = data[index + 1];
        const b = data[index + 2];
        const a = data[index + 3];
 
        if (this.isSpriteBackgroundPixel(r, g, b, a)) continue;
        if (this.isLikelyWeaponOrMagicPixel(r, g, b, a)) continue;
 
        const darkness = 255 - Math.max(r, g, b);
        const lowerWeight = 1 + ((y - startY) / Math.max(1, endY - startY)) * 3;
        const darkWeight = 1 + Math.max(0, darkness) / 96;
        const weight = lowerWeight * darkWeight;
 
        totalX += x * weight;
        totalY += y * weight;
        totalWeight += weight;
      }
    }
 
    if (totalWeight > 0) {
      return {
        x: totalX / totalWeight,
        y: totalY / totalWeight,
      };
    }
 
    return {
      x: bounds.x + bounds.width / 2,
      y: bounds.y + bounds.height - 1,
    };
  }
 
  getUnitSpriteContentBounds(textureKey, cropX, cropY, cellWidth, cellHeight) {
    const cacheKey = `${textureKey}:${cropX}:${cropY}:${cellWidth}:${cellHeight}`;
 
    if (this.unitSpriteBoundsCache?.has(cacheKey)) {
      return this.unitSpriteBoundsCache.get(cacheKey);
    }
 
    const fullBounds = {
      x: 0,
      y: 0,
      width: cellWidth,
      height: cellHeight,
      footX: cellWidth / 2,
      footY: cellHeight * 0.82,
    };
 
    if (!this.textures.exists(textureKey)) return fullBounds;
 
    const texture = this.textures.get(textureKey);
    const source = texture.getSourceImage();
 
    if (!source?.width || !source?.height) return fullBounds;
 
    const canvas = document.createElement("canvas");
    canvas.width = cellWidth;
    canvas.height = cellHeight;
 
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return fullBounds;
 
    ctx.clearRect(0, 0, cellWidth, cellHeight);
    ctx.drawImage(source, cropX, cropY, cellWidth, cellHeight, 0, 0, cellWidth, cellHeight);
 
    const imageData = ctx.getImageData(0, 0, cellWidth, cellHeight);
    const data = imageData.data;
 
    let minX = cellWidth;
    let minY = cellHeight;
    let maxX = -1;
    let maxY = -1;
 
    for (let y = 0; y < cellHeight; y += 1) {
      for (let x = 0; x < cellWidth; x += 1) {
        const index = (y * cellWidth + x) * 4;
        const r = data[index];
        const g = data[index + 1];
        const b = data[index + 2];
        const a = data[index + 3];
 
        if (this.isSpriteBackgroundPixel(r, g, b, a)) continue;
 
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }
 
    if (maxX < minX || maxY < minY) {
      this.unitSpriteBoundsCache?.set(cacheKey, fullBounds);
      return fullBounds;
    }
 
    const padding = 2;
    const bounds = {
      x: Math.max(0, minX - padding),
      y: Math.max(0, minY - padding),
      width: Math.min(cellWidth - Math.max(0, minX - padding), maxX - minX + 1 + padding * 2),
      height: Math.min(cellHeight - Math.max(0, minY - padding), maxY - minY + 1 + padding * 2),
    };
 
    const footAnchor = this.getSpriteFootAnchorFromPixels(data, cellWidth, cellHeight, bounds);
    bounds.footX = footAnchor.x;
    bounds.footY = footAnchor.y;
 
    this.unitSpriteBoundsCache?.set(cacheKey, bounds);
    return bounds;
  }
 
  applyUnitSpriteCrop(unit, textureKey, frame) {
    const sprite = this.unitSprites[unit.id];
    const image = this.ensureUnitSpriteImage(unit, textureKey);
 
    if (!sprite || !image || !this.textures.exists(textureKey)) {
      this.showUnitFallbackSprite(unit);
      return false;
    }
 
    const texture = this.textures.get(textureKey);
    const source = texture.getSourceImage();
    const cellWidth = Math.floor(source.width / 2);
    const cellHeight = Math.floor(source.height / 2);
    const cropX = frame.col * cellWidth;
    const cropY = frame.row * cellHeight;
    const bounds = this.getUnitSpriteContentBounds(textureKey, cropX, cropY, cellWidth, cellHeight);
    const render = this.getUnitSpriteRenderConfig(unit);
    const desiredHeight = render.height || UNIT_SPRITE_TARGET_SIZE;
    const desiredMaxWidth = render.maxWidth || TILE_SIZE * 1.08;
 
    let scale = render.scale || desiredHeight / Math.max(1, bounds.height);
    const scaledWidth = bounds.width * scale;
 
    if (scaledWidth > desiredMaxWidth) {
      scale = desiredMaxWidth / Math.max(1, bounds.width);
    }
 
    const isDeathFrame = unit.spriteState === "death";
    const anchorX = Phaser.Math.Clamp((bounds.footX - bounds.x) / Math.max(1, bounds.width), 0.06, 0.94);
    const anchorY = Phaser.Math.Clamp((bounds.footY - bounds.y) / Math.max(1, bounds.height), 0.12, 0.98);
 
    image.setTexture(textureKey);
    image.setCrop(cropX + bounds.x, cropY + bounds.y, bounds.width, bounds.height);
    image.setScale(scale);
 
    if (isDeathFrame) {
      image.setOrigin(0.5, 0.5);
      image.setPosition(render.offsetX || 0, render.deathOffsetY ?? 0);
    } else {
      image.setOrigin(anchorX, anchorY);
      image.setPosition(render.offsetX || 0, render.offsetY ?? 0);
    }
 
    image.setVisible(true);
    image.clearTint();
 
    if (sprite.shadow) {
      sprite.shadow.setPosition(render.shadowX || 0, render.shadowY ?? 2);
      sprite.shadow.setSize(render.shadowWidth || TILE_SIZE * 0.42, render.shadowHeight || TILE_SIZE * 0.12);
      sprite.shadow.setVisible(!isDeathFrame);
    }
 
    sprite.marker.setVisible(false);
    sprite.label.setVisible(false);
    sprite.hpText.setPosition(0, render.hpY ?? TILE_SIZE * 0.22);
 
    return true;
  }
 
  showUnitFallbackSprite(unit) {
    const sprite = this.unitSprites[unit.id];
    if (!sprite) return;
 
    if (sprite.image) sprite.image.setVisible(false);
    if (sprite.shadow) sprite.shadow.setVisible(false);
    sprite.marker.setVisible(true);
    sprite.marker.setFillStyle(unit.color, 1);
    sprite.marker.setAlpha(1);
    sprite.label.setVisible(true);
    sprite.hpText.setPosition(0, 16);
  }
 
  setUnitSpriteFrame(unit, state = "idle", direction = null) {
    if (!unit) return false;

    const resolvedDirection = direction || unit.facing || "down";
    const individualEntry = this.getIndividualSpriteEntry(unit, state, resolvedDirection, 0);

    unit.spriteState = state;

    if (individualEntry?.key && this.textures.exists(individualEntry.key)) {
      return this.applyIndividualUnitSprite(unit, individualEntry.key, state);
    }

    const textureKey = this.getUnitSpriteTextureKey(unit, state);
    const frame = this.getDirectionFrame(resolvedDirection);

    return this.applyUnitSpriteCrop(unit, textureKey, frame);
  }

  setUnitDeathFrame(unit, frameIndex = 0) {
    if (!unit) return false;

    unit.spriteState = "death";

    const individualEntry = this.getIndividualSpriteEntry(unit, "death", unit.facing || "down", frameIndex);
    if (individualEntry?.key && this.textures.exists(individualEntry.key)) {
      return this.applyIndividualUnitSprite(unit, individualEntry.key, "death");
    }

    const textureKey = this.getUnitSpriteTextureKey(unit, "death");
    const frame = this.getDeathFrame(frameIndex);

    return this.applyUnitSpriteCrop(unit, textureKey, frame);
  }
 
  getDirectionFromDelta(dx, dy, fallback = "down") {
    if (Math.abs(dx) > Math.abs(dy)) {
      return dx > 0 ? "right" : "left";
    }
 
    if (Math.abs(dy) > 0) {
      return dy > 0 ? "down" : "up";
    }
 
    return fallback;
  }
 
  getDirectionToward(fromUnit, toUnit) {
    if (!fromUnit || !toUnit) return "down";
    return this.getDirectionFromDelta(toUnit.x - fromUnit.x, toUnit.y - fromUnit.y, fromUnit.facing || "down");
  }
 
  faceUnitToward(unit, target) {
    if (!unit || !target) return;
    unit.facing = this.getDirectionToward(unit, target);
    this.setUnitSpriteFrame(unit, unit.spriteState || "idle", unit.facing);
  }
 
  playUnitState(unit, state, duration = 320) {
    if (!unit) return;
 
    this.setUnitSpriteFrame(unit, state, unit.facing || "down");
 
    if (state !== "idle" && state !== "death") {
      this.time.delayedCall(duration, () => {
        if (unit.hp > 0) {
          this.setUnitSpriteFrame(unit, "idle", unit.facing || "down");
        }
      });
    }
  }
 
  playUnitHurt(unit, duration = 360) {
    if (!unit) return;
 
    const sprite = this.unitSprites[unit.id];
    this.playUnitState(unit, "hurt", duration);
 
    if (sprite?.image?.visible) {
      sprite.image.setTintFill(0xff6666);
      this.time.delayedCall(Math.floor(duration * 0.65), () => {
        if (sprite.image) sprite.image.clearTint();
      });
    } else if (sprite?.marker) {
      sprite.marker.setFillStyle(0xff4444, 1);
      this.time.delayedCall(Math.floor(duration * 0.65), () => {
        if (sprite.marker) sprite.marker.setFillStyle(unit.color, 1);
      });
    }
  }
 
  playUnitDeath(unit, onComplete = null) {
    if (!unit) {
      if (onComplete) onComplete();
      return;
    }
 
    const sprite = this.unitSprites[unit.id];
    if (!sprite) {
      if (onComplete) onComplete();
      return;
    }
 
    const hasDeathSprite = !!this.getUnitSpriteTextureKey(unit, "death") &&
      this.textures.exists(this.getUnitSpriteTextureKey(unit, "death"));
 
    if (!hasDeathSprite) {
      this.tweens.add({
        targets: sprite.container,
        alpha: 0,
        duration: 700,
        ease: "Quad.Out",
        onComplete,
      });
      return;
    }
 
    sprite.container.setScale(1);
    sprite.container.alpha = 1;
 
    DEATH_FRAMES.forEach((_, index) => {
      this.time.delayedCall(index * 180, () => {
        this.setUnitDeathFrame(unit, index);
      });
    });
 
    this.time.delayedCall(DEATH_FRAMES.length * 180 + 80, () => {
      this.tweens.add({
        targets: sprite.container,
        alpha: 0,
        duration: 650,
        ease: "Quad.Out",
        onComplete,
      });
    });
  }
 
  removeUnitSpriteAndData(unitId) {
    const sprite = this.unitSprites[unitId];
 
    if (sprite) {
      sprite.container.destroy();
      delete this.unitSprites[unitId];
    }
 
    this.units = this.units.filter((unit) => unit.id !== unitId);
  }
 
  setupInput() {
    this.input.on("pointerdown", (pointer) => {
      if (this.phase !== "player" || this.busy || this.previewOpen) return;
 
      const tile = this.pointerToTile(pointer.x, pointer.y);
      if (!tile) return;
 
      const clickedUnit = this.getUnitAt(tile.x, tile.y);
      const selectedUnit = this.getSelectedUnit();
 
      if (clickedUnit && clickedUnit.team === "player" && !clickedUnit.acted) {
        this.selectedUnitId = clickedUnit.id;
        this.moveTiles = this.reachableTiles(clickedUnit);
        this.targetTiles = this.attackableEnemies(clickedUnit);
        this.redrawSelection();
        this.updateSelectedPanel();
        this.helpText.setText(`Selected ${clickedUnit.name}. Move or attack.`);
        return;
      }
 
      if (
        selectedUnit &&
        clickedUnit &&
        clickedUnit.team === "enemy" &&
        this.isTargetTile(clickedUnit.x, clickedUnit.y)
      ) {
        this.openPreview(selectedUnit, clickedUnit);
        return;
      }
 
      if (clickedUnit && clickedUnit.team === "enemy") {
        this.selectedUnitId = clickedUnit.id;
        this.moveTiles = [];
        this.targetTiles = [];
        this.redrawSelection();
        this.updateSelectedPanel();
        this.helpText.setText(`${clickedUnit.name}: ${clickedUnit.title}`);
        return;
      }
 
      if (
        !clickedUnit &&
        selectedUnit &&
        selectedUnit.team === "player" &&
        this.isMoveTile(tile.x, tile.y)
      ) {
        this.moveUnit(selectedUnit.id, tile.x, tile.y);
        return;
      }
 
      this.clearSelection();
    });
  }
 
  pointerToTile(pointerX, pointerY) {
    const localX = pointerX - this.boardX;
    const localY = pointerY - this.boardY;
 
    if (
      localX < 0 ||
      localY < 0 ||
      localX >= this.boardWidth ||
      localY >= this.boardHeight
    ) {
      return null;
    }
 
    return {
      x: Math.floor(localX / TILE_SIZE),
      y: Math.floor(localY / TILE_SIZE),
    };
  }
 
  getSelectedUnit() {
    return this.units.find((unit) => unit.id === this.selectedUnitId) || null;
  }
 
  getUnitAt(x, y) {
    return this.units.find((unit) => unit.x === x && unit.y === y && unit.hp > 0) || null;
  }
 
  isWalkable(x, y) {
    if (!this.isInBounds(x, y)) return false;
    return this.getTerrainAt(x, y) !== "wall";
  }
 
  reachableTiles(unit) {
    const queue = [{ x: unit.x, y: unit.y, steps: 0 }];
    const visited = new Set([tileKey(unit.x, unit.y)]);
    const reachable = [];
 
    while (queue.length > 0) {
      const current = queue.shift();
 
      for (const [dx, dy] of [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ]) {
        const nx = current.x + dx;
        const ny = current.y + dy;
        const key = tileKey(nx, ny);
        const nextSteps = current.steps + 1;
 
        if (visited.has(key)) continue;
        if (!this.isWalkable(nx, ny)) continue;
        if (nextSteps > unit.move) continue;
 
        const occupant = this.getUnitAt(nx, ny);
        if (occupant && occupant.id !== unit.id) continue;
 
        visited.add(key);
        queue.push({ x: nx, y: ny, steps: nextSteps });
        reachable.push({ x: nx, y: ny });
      }
    }
 
    return reachable;
  }
 
  attackableEnemies(unit) {
    return this.units.filter(
      (other) => other.team !== unit.team && other.hp > 0 && canAttack(unit, other)
    );
  }
 
  attackablePlayers(unit) {
    return this.units.filter(
      (other) => other.team !== unit.team && other.hp > 0 && canAttack(unit, other)
    );
  }
 
  isMoveTile(x, y) {
    return (this.moveTiles || []).some((tile) => {
      if (typeof tile === "string") {
        return tile === tileKey(x, y);
      }
 
      return tile.x === x && tile.y === y;
    });
  }
 
  isTargetTile(x, y) {
    return this.targetTiles.some((unit) => unit.x === x && unit.y === y);
  }
 
  openPreview(attacker, defender) {
    const attackerWeapon = getWeaponForTarget(attacker, defender);
    const defenderWeapon = getWeaponForTarget(defender, attacker) || getDefaultWeapon(defender);
 
    if (!attackerWeapon) return;
 
    const attackerDamage = this.calculateDamage(attacker, defender, attackerWeapon);
    const attackerHits = this.calculateAttackCount(attacker, defender, attackerWeapon);
    const attackerSpeed = this.getEffectiveSpeed(attacker, attackerWeapon);
    const attackerHitRate = attackerWeapon.hitRate ?? 100;
 
    const defenderDamage = defenderWeapon
      ? this.calculateDamage(defender, attacker, defenderWeapon)
      : 0;
    const defenderHits = defenderWeapon
      ? this.calculateAttackCount(defender, attacker, defenderWeapon)
      : 0;
    const defenderSpeed = defenderWeapon
      ? this.getEffectiveSpeed(defender, defenderWeapon)
      : defender.spd;
    const defenderHitRate = defenderWeapon?.hitRate ?? 100;
 
    this.previewData = {
      attackerId: attacker.id,
      defenderId: defender.id,
    };
 
    this.previewLeftName.setText(`${attacker.name} - ${attackerWeapon.name}`);
    this.previewLeftStats.setText(
      `HP ${attacker.hp}/${attacker.maxHp}\nDMG ${attackerDamage} x${attackerHits}\nHIT ${attackerHitRate}%\nSPD ${attackerSpeed}\nRNG ${getWeaponRangeLabel(attackerWeapon)}`
    );
 
    this.previewRightName.setText(`${defender.name} - ${defenderWeapon.name}`);
    this.previewRightStats.setText(
      `HP ${defender.hp}/${defender.maxHp}\nDMG ${defenderDamage} x${defenderHits}\nHIT ${defenderHitRate}%\nSPD ${defenderSpeed}\nRNG ${getWeaponRangeLabel(defenderWeapon)}`
    );
 
    this.previewOpen = true;
    this.previewContainer.setVisible(true);
    this.helpText.setText("Confirm or cancel the attack.");
  }
 
  closePreview() {
    this.previewOpen = false;
    this.previewData = null;
    this.previewContainer.setVisible(false);
    this.helpText.setText("Attack cancelled.");
  }
 
  confirmPreviewAttack() {
    if (!this.previewData) return;
 
    const { attackerId, defenderId } = this.previewData;
    this.previewOpen = false;
    this.previewData = null;
    this.previewContainer.setVisible(false);
    this.attackEnemy(attackerId, defenderId);
  }
 
  moveUnit(unitId, x, y) {
    const unit = this.units.find((u) => u.id === unitId);
    const sprite = this.unitSprites[unitId];
 
    if (!unit || !sprite) return;
 
    this.busy = true;
 
    const oldX = unit.x;
    const oldY = unit.y;
    unit.facing = this.getDirectionFromDelta(x - oldX, y - oldY, unit.facing || "down");
    this.playUnitState(unit, "move", 260);
 
    unit.x = x;
    unit.y = y;
 
    const targetX = this.boardX + x * TILE_SIZE + TILE_SIZE / 2;
    const targetY = this.boardY + y * TILE_SIZE + TILE_SIZE / 2;
 
    this.tweens.add({
      targets: sprite.container,
      x: targetX,
      y: targetY,
      duration: 180,
      onComplete: () => {
        this.setUnitSpriteFrame(unit, "idle", unit.facing || "down");
        this.moveTiles = [];
        this.targetTiles = this.attackableEnemies(unit);
        this.redrawSelection();
        this.updateSelectedPanel();
 
        if (this.targetTiles.length > 0) {
          this.helpText.setText(`${unit.name} moved. Click a red enemy to attack.`);
          this.busy = false;
        } else {
          unit.acted = true;
          this.refreshUnitSprite(unit);
          this.clearSelection(`${unit.name} moved and waits.`);
          this.busy = false;
          this.checkEndOfPlayerPhase();
        }
      },
    });
  }
 
  attackEnemy(attackerId, defenderId) {
    const attacker = this.units.find((u) => u.id === attackerId);
    const defender = this.units.find((u) => u.id === defenderId);
 
    if (!attacker || !defender) return;
 
    const weapon = getWeaponForTarget(attacker, defender);
    if (!weapon) return;
 
    this.busy = true;
    this.faceUnitToward(attacker, defender);
    this.faceUnitToward(defender, attacker);
    this.playUnitState(attacker, this.getAttackAnimationState(attacker, weapon), 420);
 
    const defenderWasAlive = defender.hp > 0;
    const sequence = this.resolveAttackSequence(attacker, defender, weapon);
 
    sequence.results.forEach((result, index) => {
      this.showCombatResultText(defender, result, index);
 
      if (result.hit) {
        this.time.delayedCall(index * 140, () => this.playUnitHurt(defender));
      }
    });
 
    const didKill = defenderWasAlive && defender.hp <= 0;
    const defeatedFalan = didKill && defender.id === "falan";
    const xpGain = this.calculateXpGain(attacker, defender, didKill);
 
    if (xpGain > 0) {
      this.awardXp(attacker, xpGain);
    }
 
    attacker.acted = true;
    this.refreshUnitSprite(attacker);
 
    if (defender.hp <= 0) {
      if (defeatedFalan) {
        defender.hp = 0;
        this.refreshUnitSprite(defender);
        this.playUnitHurt(defender);
        this.clearSelection(`${attacker.name} defeated ${defender.name}!`);
      } else {
        defender.hp = 0;
        this.playUnitDeath(defender, () => this.removeUnitSpriteAndData(defender.id));
        this.clearSelection(`${attacker.name} defeated ${defender.name}!`);
      }
    } else {
      this.refreshUnitSprite(defender);
      this.clearSelection(`${attacker.name} attacked ${defender.name} with ${weapon.name}.`);
    }
 
    this.updateSelectedPanel();
 
    if (defeatedFalan) {
      this.time.delayedCall(650 + sequence.results.length * 140, () => {
        this.busy = false;
        this.startPostBattleScene();
      });
      return;
    }
 
    this.time.delayedCall(650 + sequence.results.length * 140, () => {
      this.busy = false;
      this.checkEndOfPlayerPhase();
    });
  }
 
  clearSelection(message = "Click Edwin or Leon to select a unit.") {
    this.selectedUnitId = null;
    this.moveTiles = [];
    this.targetTiles = [];
    this.redrawSelection();
    this.updateSelectedPanel();
    this.helpText.setText(message);
  }
 
  redrawSelection() {
    this.overlayLayer.removeAll(true);
 
    for (const unit of this.units) {
      const sprite = this.unitSprites[unit.id];
      if (sprite) sprite.marker.setStrokeStyle(2, 0xffffff);
    }
 
    if (!this.selectedUnitId) return;
 
    const selectedUnit = this.getSelectedUnit();
    if (!selectedUnit) return;
 
    const selectedSprite = this.unitSprites[selectedUnit.id];
    if (selectedSprite) selectedSprite.marker.setStrokeStyle(4, 0xfde68a);
 
    for (const tile of this.moveTiles) {
      const x = this.boardX + tile.x * TILE_SIZE;
      const y = this.boardY + tile.y * TILE_SIZE;
 
      const overlay = this.add.rectangle(
        x + TILE_SIZE / 2,
        y + TILE_SIZE / 2,
        TILE_SIZE - 10,
        TILE_SIZE - 10,
        0x38bdf8,
        0.35
      );
      overlay.setStrokeStyle(2, 0x7dd3fc, 0.95);
      this.overlayLayer.add(overlay);
    }
 
    for (const unit of this.targetTiles) {
      const x = this.boardX + unit.x * TILE_SIZE;
      const y = this.boardY + unit.y * TILE_SIZE;
 
      const overlay = this.add.rectangle(
        x + TILE_SIZE / 2,
        y + TILE_SIZE / 2,
        TILE_SIZE - 10,
        TILE_SIZE - 10,
        0xef4444,
        0.35
      );
      overlay.setStrokeStyle(2, 0xfda4af, 0.95);
      this.overlayLayer.add(overlay);
    }
  }
 
  updateSelectedPanel() {
    const unit = this.units.find((u) => u.id === this.selectedUnitId);
 
    if (!unit) {
      this.portraitImage.setVisible(false);
      this.portraitPlaceholder.setVisible(true);
      this.unitNameText.setText("None");
      this.unitClassText.setText("");
      this.levelXpText.setText("");
      this.xpBarFill.displayWidth = 0;
      this.unitStatsText.setText("");
      this.weaponText.setText("Select Edwin or Leon.");
      return;
    }
 
    if (unit.portraitKey && this.textures.exists(unit.portraitKey)) {
      this.portraitImage.setTexture(unit.portraitKey);
      this.portraitImage.setDisplaySize(96, 120);
      this.portraitImage.setVisible(true);
      this.portraitPlaceholder.setVisible(false);
    } else {
      this.portraitImage.setVisible(false);
      this.portraitPlaceholder.setVisible(true);
    }
 
    const level = unit.level || 1;
    const xp = unit.xp || 0;
    const weapon = getDefaultWeapon(unit);
    const terrain = this.getTerrainAt(unit.x, unit.y);
    const terrainBonus = this.getTerrainDefenseBonus(unit);
    const weaponSpeedBonus = this.getWeaponSpeedBonus(unit, weapon);
 
    const terrainLabel = terrain
      ? terrain.charAt(0).toUpperCase() + terrain.slice(1)
      : "Terrain";
    const defLine = terrainBonus > 0
      ? `DEF ${unit.def} +${terrainBonus} ${terrainLabel}`
      : `DEF ${unit.def}`;
    const spdLine = weaponSpeedBonus > 0
      ? `SPD ${unit.spd} +${weaponSpeedBonus} ${weapon.name}`
      : `SPD ${unit.spd}`;
 
    this.unitNameText.setText(unit.name);
    this.unitClassText.setText(
      `${unit.team === "enemy" ? "Enemy" : "Player"} • ${unit.title} • ${unit.className}`
    );
    this.levelXpText.setText(`Lv ${level} XP ${xp}/100`);
    this.xpBarFill.displayWidth = 210 * Phaser.Math.Clamp(xp / 100, 0, 1);
 
    this.unitStatsText.setText(
      `HP ${unit.hp}/${unit.maxHp}\nSTR ${unit.str}\nMAG ${unit.mag}\n${defLine}\nRES ${unit.res}\n${spdLine}\nMOV ${unit.move}`
    );
 
    this.weaponText.setText(
      weapon
        ? `Weapon: ${weapon.name} | Base ${weapon.baseDamage ?? weapon.damage ?? 0} | ${weapon.damageType || "physical"} | Hit ${weapon.hitRate ?? 100}% | Range ${getWeaponRangeLabel(weapon)}`
        : "Weapon: None"
    );
  }
 
  checkEndOfPlayerPhase() {
    const remaining = this.units.filter((u) => u.team === "player" && !u.acted);
    if (remaining.length === 0) this.startEnemyPhase();
  }
 
  startEnemyPhase() {
    this.phase = "enemy";
    this.phaseText.setText("Enemy Phase");
    this.phaseText.setColor("#fca5a5");
    this.helpText.setText("Enemies are moving...");
    this.clearSelection("Enemies are moving...");
    this.busy = true;
    this.enemyIndex = 0;
    this.enemyTurnOrder = this.units.filter((u) => u.team === "enemy");
    this.time.delayedCall(ENEMY_ACTION_PAUSE, () => this.runNextEnemy());
  }
 
  runNextEnemy() {
    if (this.enemyIndex >= this.enemyTurnOrder.length) {
      this.startPlayerPhase();
      return;
    }
 
    const enemyRef = this.enemyTurnOrder[this.enemyIndex];
    const enemy = this.units.find((u) => u.id === enemyRef.id);
 
    if (!enemy) {
      this.enemyIndex += 1;
      this.runNextEnemy();
      return;
    }
 
    this.selectedUnitId = enemy.id;
    this.updateSelectedPanel();
    this.helpText.setText(`${enemy.name} is acting...`);
 
    const targetsNow = this.attackablePlayers(enemy);
    if (targetsNow.length > 0) {
      this.time.delayedCall(ENEMY_ACTION_PAUSE, () => this.enemyAttack(enemy, targetsNow[0]));
      return;
    }
 
    const nearest = this.getNearestPlayer(enemy);
    if (!nearest) {
      this.enemyIndex += 1;
      this.runNextEnemy();
      return;
    }
 
    const moveTarget = this.chooseEnemyMove(enemy, nearest);
    if (!moveTarget || (moveTarget.x === enemy.x && moveTarget.y === enemy.y)) {
      this.enemyIndex += 1;
      this.runNextEnemy();
      return;
    }
 
    const sprite = this.unitSprites[enemy.id];
    const oldX = enemy.x;
    const oldY = enemy.y;
    enemy.facing = this.getDirectionFromDelta(moveTarget.x - oldX, moveTarget.y - oldY, enemy.facing || "down");
    this.playUnitState(enemy, "move", ENEMY_MOVE_DURATION + 150);
    enemy.x = moveTarget.x;
    enemy.y = moveTarget.y;
    this.helpText.setText(`${enemy.name} moves.`);
 
    this.tweens.add({
      targets: sprite.container,
      x: this.boardX + enemy.x * TILE_SIZE + TILE_SIZE / 2,
      y: this.boardY + enemy.y * TILE_SIZE + TILE_SIZE / 2,
      duration: ENEMY_MOVE_DURATION,
      ease: "Sine.easeInOut",
      onComplete: () => {
        this.refreshUnitSprite(enemy);
        this.setUnitSpriteFrame(enemy, "idle", enemy.facing || "down");
        const targetsAfterMove = this.attackablePlayers(enemy);
 
        if (targetsAfterMove.length > 0) {
          this.time.delayedCall(ENEMY_ACTION_PAUSE, () => this.enemyAttack(enemy, targetsAfterMove[0]));
        } else {
          this.enemyIndex += 1;
          this.time.delayedCall(ENEMY_ACTION_PAUSE, () => this.runNextEnemy());
        }
      },
    });
  }
 
  getNearestPlayer(enemy) {
    const players = this.units.filter((u) => u.team === "player");
    if (!players.length) return null;
 
    let nearest = players[0];
    let best = distance(enemy, players[0]);
 
    for (const player of players) {
      const d = distance(enemy, player);
      if (d < best) {
        best = d;
        nearest = player;
      }
    }
 
    return nearest;
  }
 
  chooseEnemyMove(enemy, target) {
    const options = this.reachableTiles(enemy);
    if (!options.length) return null;
 
    let best = { x: enemy.x, y: enemy.y };
    let bestScore = distance(enemy, target);
 
    for (const option of options) {
      const score = Math.abs(option.x - target.x) + Math.abs(option.y - target.y);
      if (score < bestScore) {
        best = option;
        bestScore = score;
      }
    }
 
    return best;
  }
 
  enemyAttack(attacker, defender) {
    const weapon = getWeaponForTarget(attacker, defender) || getDefaultWeapon(attacker);
    if (!weapon) {
      this.enemyIndex += 1;
      this.time.delayedCall(250, () => this.runNextEnemy());
      return;
    }
 
    this.selectedUnitId = attacker.id;
    this.updateSelectedPanel();
    this.helpText.setText(`${attacker.name} attacks ${defender.name}.`);
    this.faceUnitToward(attacker, defender);
    this.faceUnitToward(defender, attacker);
    this.playUnitState(attacker, this.getAttackAnimationState(attacker, weapon), 620);
 
    const sequence = this.resolveAttackSequence(attacker, defender, weapon);
 
    sequence.results.forEach((result, index) => {
      this.time.delayedCall(index * 220, () => {
        this.showCombatResultText(defender, result, 0);
      });
 
      if (result.hit) {
        this.time.delayedCall(index * 220, () => this.playUnitHurt(defender, 420));
      }
    });
 
    if (defender.hp <= 0) {
      const defeatedEdwin = defender.id === "edwin";
      defender.hp = 0;
      this.playUnitDeath(defender, () => this.removeUnitSpriteAndData(defender.id));
 
      if (defeatedEdwin) {
        this.stopBattleMusic();
 
        this.phaseText.setText("Defeat");
        this.phaseText.setColor("#f87171");
        this.helpText.setText("Defeat! Edwin has fallen.");
        this.busy = false;
        this.updateSelectedPanel();
        return;
      }
    } else {
      this.refreshUnitSprite(defender);
    }
 
    this.updateSelectedPanel();
    this.enemyIndex += 1;
    this.time.delayedCall(900 + sequence.results.length * 220, () => this.runNextEnemy());
  }
 
  startPlayerPhase() {
    this.phase = "player";
    this.phaseText.setText("Player Phase");
    this.phaseText.setColor("#93c5fd");
 
    for (const unit of this.units) {
      if (unit.team === "player") {
        unit.acted = false;
        this.refreshUnitSprite(unit);
        this.setUnitSpriteFrame(unit, "idle", unit.facing || "down");
      }
    }
 
    this.helpText.setText("Player Phase. Click Edwin or Leon.");
    this.busy = false;
  }
}
 
const config = {
  type: Phaser.AUTO,
  parent: "app",
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: "#0f172a",
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [BattleScene],
};
 
new Phaser.Game(config);
