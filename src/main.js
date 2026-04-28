import Phaser from "phaser";

const GAME_WIDTH = 960;
const GAME_HEIGHT = 540;

const TILE_SIZE = 64;
const MAP_COLS = 8;
const MAP_ROWS = 8;

const UNIT_SPRITE_TARGET_SIZE = TILE_SIZE * 0.9;
const ENEMY_MOVE_DURATION = 1400;
const ENEMY_ACTION_PAUSE = 750;
const PLAYER_MOVE_DURATION = 1350;
const PLAYER_ACTION_PAUSE = 450;
const SKILL_BANNER_DURATION = 1250;
const SKILL_IMPACT_DELAY = 520;
const LEVEL_UP_PANEL_DEPTH = 20000;

const SAVE_KEY = "bardsTacticsSave";
const TITLE_SCREEN_KEY = "bardsTitleScreen";
const TITLE_SCREEN_PATH = "/ui/title_screen.png";
const LOADING_RUNNER_KEY = "edwin_move_right";
const LOADING_RUNNER_PATH = "/sprites/edwin/move_right.png";

const CARDINAL_DIRECTIONS = ["down", "up", "left", "right"];
const LEVEL_UP_STATS = [
  { key: "hp", label: "HP", description: "+1 max HP and current HP" },
  { key: "str", label: "STR", description: "+1 physical damage" },
  { key: "mag", label: "MAG", description: "+1 magical damage" },
  { key: "def", label: "DEF", description: "+1 physical defence" },
  { key: "res", label: "RES", description: "+1 magical defence" },
  { key: "spd", label: "SPD", description: "+1 speed / extra attacks" },
  { key: "luck", label: "LUCK", description: "+1 crit chance and better level rolls" },
];

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
  leon: {
    idle: createDirectionalStateEntries("leon", "idle"),
    move: createDirectionalStateEntries("leon", "move"),
    attack: createDirectionalStateEntries("leon", "attack"),
    hurt: createDirectionalStateEntries("leon", "hurt"),
    death: createDeathEntries("leon"),
  },
  falan: {
    idle: createDirectionalStateEntries("falan", "idle"),
    move: createDirectionalStateEntries("falan", "move"),
    attack: createDirectionalStateEntries("falan", "attack"),
    hurt: createDirectionalStateEntries("falan", "hurt"),
    death: createDeathEntries("falan"),
  },
  sword_thug: {
    idle: createDirectionalStateEntries("sword_thug", "idle"),
    move: createDirectionalStateEntries("sword_thug", "move"),
    attack: createDirectionalStateEntries("sword_thug", "attack"),
    hurt: createDirectionalStateEntries("sword_thug", "hurt"),
    death: createDeathEntries("sword_thug"),
  },
  axe_thug: {
    idle: createDirectionalStateEntries("axe_thug", "idle"),
    move: createDirectionalStateEntries("axe_thug", "move"),
    attack: createDirectionalStateEntries("axe_thug", "attack"),
    hurt: createDirectionalStateEntries("axe_thug", "hurt"),
    death: createDeathEntries("axe_thug"),
  },
  chakram_thug: {
    idle: createDirectionalStateEntries("chakram_thug", "idle"),
    move: createDirectionalStateEntries("chakram_thug", "move"),
    attack: createDirectionalStateEntries("chakram_thug", "attack"),
    hurt: createDirectionalStateEntries("chakram_thug", "hurt"),
    death: createDeathEntries("chakram_thug"),
  },
};

const UNIT_SPRITE_RENDER = {
  default: {
    height: TILE_SIZE * 0.82,
    maxWidth: TILE_SIZE * 0.96,
    offsetX: 0,
    offsetY: 0,
    deathOffsetY: 0,
    originX: 0.5,
    originY: 1,
    shadowWidth: TILE_SIZE * 0.42,
    shadowHeight: TILE_SIZE * 0.12,
    shadowX: 0,
    shadowY: 2,
    hpY: TILE_SIZE * 0.22,
  },
  edwin: {
    height: TILE_SIZE * 0.96,
    maxWidth: TILE_SIZE * 1.05,
    originX: 0.5,
    originY: 0.63,
    shadowWidth: TILE_SIZE * 0.42,
    shadowHeight: TILE_SIZE * 0.12,
    shadowX: 0,
    shadowY: TILE_SIZE * 0.16,
    hpY: TILE_SIZE * 0.34,
  },
  leon: {
    height: TILE_SIZE * 0.8,
    maxWidth: TILE_SIZE * 0.92,
    shadowWidth: TILE_SIZE * 0.4,
  },
  falan: {
    height: TILE_SIZE * 0.86,
    maxWidth: TILE_SIZE * 1.02,
    shadowWidth: TILE_SIZE * 0.44,
  },
  sword_thug: {
    height: TILE_SIZE * 0.82,
    maxWidth: TILE_SIZE * 0.94,
    shadowWidth: TILE_SIZE * 0.42,
  },
  axe_thug: {
    height: TILE_SIZE * 0.82,
    maxWidth: TILE_SIZE * 0.94,
    shadowWidth: TILE_SIZE * 0.42,
  },
  chakram_thug: {
    height: TILE_SIZE * 0.82,
    maxWidth: TILE_SIZE * 0.94,
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

const CHAPTER_OPENING = [
  {
    type: "title",
    chapter: "Chapter 1",
    subtitle: "4 Years Gone",
    tag: "The Underpass",
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
      { speaker: "Leon", portrait: "leonPortrait", text: "Kayley! Rich! No-!" },
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
  { type: "unitDeath", unitId: "falan", autoAdvanceDelay: 1400 },
  { type: "mapDialogue", speaker: "Leon", portrait: "leonPortrait", text: "I..." },
  {
    type: "mapAction",
    speaker: "Narration",
    portrait: "edwinPortrait",
    text: "Leon passes out. Edwin rushes in and catches him before he hits the ground.",
  },
  { type: "mapDialogue", speaker: "Edwin", portrait: "edwinPortrait", text: "Woah there. I got you. Sleep for now." },
  { type: "sceneDialogue", sceneName: "Panel Van", scene: "vanInteriorScene", speaker: "Heath", portrait: "heathPortrait", text: "Hey there sleeping beauty!" },
  { type: "sceneDialogue", sceneName: "Panel Van", scene: "vanInteriorScene", speaker: "Leon", portrait: "leonPortrait", text: "Where... Where's Edwin?" },
  {
    type: "sceneDialogue",
    sceneName: "Panel Van",
    scene: "vanInteriorScene",
    speaker: "Heath",
    portrait: "heathPortrait",
    text: "The boss man is driving this heap. Name's Heath by the way, and this bundle of cuteness wrapped up is Izzy.",
  },
  { type: "sceneDialogue", sceneName: "Panel Van", scene: "vanInteriorScene", speaker: "Izzy", portrait: "izzyPortrait", text: "*Grunt*" },
  { type: "sceneDialogue", sceneName: "Panel Van", scene: "vanInteriorScene", speaker: "Leon", portrait: "leonPortrait", text: "Kayley? Rich?" },
  {
    type: "sceneDialogue",
    sceneName: "Panel Van",
    scene: "vanInteriorScene",
    speaker: "Izzy",
    portrait: "izzyPortrait",
    text: "The two you were with? Dead, I'm afraid... Any consolation, it was quick.",
  },
  { type: "sceneDialogue", sceneName: "Panel Van", scene: "vanInteriorScene", speaker: "Leon", portrait: "leonPortrait", text: "..." },
  { type: "sceneDialogue", sceneName: "Panel Van", scene: "vanInteriorScene", speaker: "Heath", portrait: "heathPortrait", text: "It's OK." },
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
  { type: "fullScreenScene", sceneName: "Byron Farm", scene: "byronFarmScene", text: "Byron Farm" },
  { type: "savePrompt", title: "Chapter 1 Complete", text: "Save game?" },
];

const UNITS = [
  {
    id: "edwin",
    name: "Edwin",
    title: "Iceblade",
    level: 5,
    xp: 0,
    xpRate: 0.65,
    sigilPoints: 3,
    maxSigilPoints: 3,
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
    luck: 4,
    weapons: [
      { name: "Iceblade", baseDamage: 4, range: 1, damageType: "physical", stat: "str", hitRate: 100 },
      { name: "Ice Sigil", baseDamage: 5, range: 2, damageType: "magical", stat: "mag", hitRate: 100 },
    ],
    skills: [{ id: "iceOfAges", name: "Ice of Ages", cost: 2, type: "adjacentSquare", damageFormula: "mag", animationState: "magic" }],
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
    sigilPoints: 3,
    maxSigilPoints: 3,
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
    luck: 5,
    weapons: [{ name: "Fists", baseDamage: 1, range: 1, damageType: "physical", stat: "str", hitRate: 100 }],
    acted: false,
    color: 0x38bdf8,
  },
  {
    id: "falan",
    name: "Falan",
    title: "Gang Leader",
    sigilPoints: 3,
    maxSigilPoints: 3,
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
    luck: 3,
    weapons: [{ name: "Katars", baseDamage: 3, range: 1, damageType: "physical", stat: "str", hitRate: 100, speedBonus: 2 }],
    skills: [{ id: "manicDervish", name: "Manic Dervish", cost: 3, type: "adjacentSquare", damageFormula: "strPlusSpd", animationState: "attack" }],
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
    sigilPoints: 3,
    maxSigilPoints: 3,
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
    luck: 1,
    weapons: [{ name: "Sword", baseDamage: 3, range: 1, damageType: "physical", stat: "str", hitRate: 100 }],
    acted: false,
    color: 0xfb7185,
  },
  {
    id: "thug2",
    name: "Thug",
    title: "White Hood",
    team: "enemy",
    className: "Thug",
    sigilPoints: 3,
    maxSigilPoints: 3,
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
    luck: 0,
    weapons: [{ name: "Axe", baseDamage: 5, range: 1, damageType: "physical", stat: "str", hitRate: 75 }],
    acted: false,
    color: 0xfb7185,
  },
  {
    id: "thug3",
    name: "Thug",
    title: "White Hood",
    team: "enemy",
    className: "Thug",
    sigilPoints: 3,
    maxSigilPoints: 3,
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
    luck: 2,
    weapons: [{ name: "Chakram", baseDamage: 2, minRange: 1, maxRange: 2, damageType: "physical", stat: "str", hitRate: 100 }],
    acted: false,
    color: 0xfb7185,
  },
  {
    id: "thug4",
    name: "Thug",
    title: "White Hood",
    team: "enemy",
    className: "Thug",
    sigilPoints: 3,
    maxSigilPoints: 3,
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
    luck: 1,
    weapons: [{ name: "Sword", baseDamage: 3, range: 1, damageType: "physical", stat: "str", hitRate: 100 }],
    acted: false,
    color: 0xfb7185,
  },
];

const LEVELS = {
  chapter1: {
    biome: "city",
    map: MAP,
    units: UNITS,
    battleMusic: { key: "chapter1BattleMusic", path: "/audio/chapter1_battle.mp3", volume: 0.45 },
    objective: "Defeat Falan, the gang leader.",
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
  return attacker.weapons.find((weapon) => {
    const minRange = weapon.minRange ?? weapon.range;
    const maxRange = weapon.maxRange ?? weapon.range;
    return dist >= minRange && dist <= maxRange;
  }) || null;
}

function getDefaultWeapon(unit) {
  return unit?.weapons?.[0] || null;
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

function fitImageToBounds(scene, image, textureKey, maxWidth, maxHeight, cover = false) {
  if (!scene?.textures?.exists(textureKey) || !image) return;
  const source = scene.textures.get(textureKey)?.getSourceImage();
  if (!source?.width || !source?.height) return;
  const scale = cover
    ? Math.max(maxWidth / source.width, maxHeight / source.height)
    : Math.min(maxWidth / source.width, maxHeight / source.height);
  image.setDisplaySize(source.width * scale, source.height * scale);
}

function createBannerPanel(scene, x, y, width, height, options = {}) {
  const container = scene.add.container(x, y);
  const shadowOffset = options.shadowOffset ?? 5;
  const shadow = scene.add.rectangle(shadowOffset, shadowOffset, width, height, 0x000000, options.shadowAlpha ?? 0.34).setOrigin(0.5);
  const outer = scene.add.rectangle(0, 0, width, height, options.outerColor ?? 0x14091f, options.outerAlpha ?? 0.97).setOrigin(0.5);
  outer.setStrokeStyle(options.outerStrokeWidth ?? 3, options.outerStrokeColor ?? 0xb6925f, 1);
  const inner = scene.add.rectangle(0, 0, width - (options.innerInset ?? 14), height - (options.innerInset ?? 14), options.innerColor ?? 0x29133f, options.innerAlpha ?? 0.98).setOrigin(0.5);
  inner.setStrokeStyle(options.innerStrokeWidth ?? 1, options.innerStrokeColor ?? 0xe4d0a8, options.innerStrokeAlpha ?? 0.82);
  container.add([shadow, outer, inner]);
  return { container, shadow, outer, inner };
}

function createBannerButton(scene, x, y, width, height, label, onClick, fontSize = "22px") {
  const container = scene.add.container(x, y);
  const shadow = scene.add.rectangle(4, 4, width, height, 0x000000, 0.34).setOrigin(0.5);
  const outer = scene.add.rectangle(0, 0, width, height, 0x1a0d2a, 0.98).setOrigin(0.5);
  outer.setStrokeStyle(2, 0xb6925f, 1);
  const inner = scene.add.rectangle(0, 0, width - 10, height - 10, 0x412164, 0.98).setOrigin(0.5);
  inner.setStrokeStyle(1, 0xe4d0a8, 0.78);
  const text = scene.add.text(0, 0, label, {
    fontSize,
    fontStyle: "bold",
    color: "#f7ecd3",
    stroke: "#0b0811",
    strokeThickness: 3,
  }).setOrigin(0.5);
  const hit = scene.add.rectangle(0, 0, width, height, 0xffffff, 0).setOrigin(0.5);
  hit.setInteractive({ useHandCursor: true });
  hit.on("pointerover", () => {
    inner.setFillStyle(0x573487, 0.99);
    outer.setStrokeStyle(2, 0xe0c186, 1);
    container.y = y - 1;
  });
  hit.on("pointerout", () => {
    inner.setFillStyle(0x412164, 0.98);
    outer.setStrokeStyle(2, 0xb6925f, 1);
    container.y = y;
  });
  hit.on("pointerdown", (pointer, localX, localY, event) => {
    if (event?.stopPropagation) event.stopPropagation();
    if (typeof onClick === "function") onClick();
  });
  container.add([shadow, outer, inner, text, hit]);
  return { container, shadow, outer, inner, text, hit };
}

function queueImage(scene, key, path) {
  if (!scene || !key || !path) return;
  if (scene.textures.exists(key)) return;
  scene.load.image(key, path);
}

function queueAudio(scene, key, path) {
  if (!scene || !key || !path) return;
  if (scene.cache?.audio?.exists(key)) return;
  scene.load.audio(key, [path]);
}

function queueBiomeTileAssets(scene, biomeKey) {
  const biome = BIOMES[biomeKey];
  if (!biome) return;
  const queuedKeys = new Set();
  Object.values(biome.terrainTextures).forEach((entry) => {
    if (!entry?.key || !entry?.path || queuedKeys.has(entry.key)) return;
    queueImage(scene, entry.key, entry.path);
    queuedKeys.add(entry.key);
  });
}

function queueIndividualDirectionalSpriteAssets(scene) {
  const queuedKeys = new Set();
  Object.values(INDIVIDUAL_UNIT_SPRITE_SETS).forEach((spriteSet) => {
    Object.values(spriteSet).forEach((entry) => {
      if (Array.isArray(entry)) {
        entry.forEach((frameEntry) => {
          if (!frameEntry?.key || !frameEntry?.path || queuedKeys.has(frameEntry.key)) return;
          queueImage(scene, frameEntry.key, frameEntry.path);
          queuedKeys.add(frameEntry.key);
        });
        return;
      }
      Object.values(entry || {}).forEach((directionEntry) => {
        if (!directionEntry?.key || !directionEntry?.path || queuedKeys.has(directionEntry.key)) return;
        queueImage(scene, directionEntry.key, directionEntry.path);
        queuedKeys.add(directionEntry.key);
      });
    });
  });
}

function queueChapterOneAssets(scene, levelData = LEVELS.chapter1) {
  queueImage(scene, "edwinPortrait", "/portraits/edwin.jpg");
  queueImage(scene, "leonPortrait", "/portraits/leon.jpg");
  queueImage(scene, "kayleyPortrait", "/portraits/kayley.jpg");
  queueImage(scene, "richPortrait", "/portraits/rich.jpg");
  queueImage(scene, "falanPortrait", "/portraits/falan.jpg");
  queueImage(scene, "thugPortrait", "/portraits/thug.jpg");
  queueImage(scene, "heathPortrait", "/portraits/heath.jpg");
  queueImage(scene, "izzyPortrait", "/portraits/izzy.jpg");
  queueImage(scene, "prologueScene", "/scenes/prologue.jpg");
  queueImage(scene, "leonsHouseScene", "/scenes/leons_house.jpg");
  queueImage(scene, "walkToSchoolScene", "/scenes/walk_to_school.jpg");
  queueImage(scene, "underpassScene", "/scenes/underpass.jpg");
  queueImage(scene, "vanInteriorScene", "/scenes/van_interior.jpg");
  queueImage(scene, "byronFarmScene", "/scenes/byron_farm.jpg");
  queueBiomeTileAssets(scene, levelData?.biome);
  queueIndividualDirectionalSpriteAssets(scene);
  if (levelData?.battleMusic?.key && levelData?.battleMusic?.path) {
    queueAudio(scene, levelData.battleMusic.key, levelData.battleMusic.path);
  }
}

class LoadingScene extends Phaser.Scene {
  constructor() {
    super("LoadingScene");
  }

  init(data = {}) {
    this.nextSceneData = data || {};
  }

  preload() {
    this.cameras.main.setBackgroundColor("#06030b");
    const centerX = GAME_WIDTH / 2;
    const centerY = GAME_HEIGHT / 2;
    const barX = 180;
    const barY = 318;
    const barWidth = 600;
    const barHeight = 8;
    this.add.rectangle(centerX, centerY, GAME_WIDTH, GAME_HEIGHT, 0x06030b, 1);
    const panel = createBannerPanel(this, centerX, centerY, 700, 250, { innerInset: 18 });
    const loadingText = this.add.text(0, -82, "Loading", {
      fontSize: "42px",
      fontStyle: "bold",
      color: "#f7ecd3",
      stroke: "#0b0811",
      strokeThickness: 5,
    }).setOrigin(0.5);
    const hintText = this.add.text(0, -42, "Preparing Chapter 1: 4 Years Gone", { fontSize: "16px", color: "#d8c4f0" }).setOrigin(0.5);
    panel.container.add([loadingText, hintText]);
    this.add.rectangle(barX + barWidth / 2, barY, barWidth, barHeight, 0x101828, 1).setStrokeStyle(2, 0xb6925f, 0.9);
    this.loadingTrail = this.add.rectangle(barX, barY, 1, barHeight, 0x38bdf8, 0.95).setOrigin(0, 0.5);
    this.loadingRunnerShadow = this.add.ellipse(barX, barY + 18, 52, 14, 0x000000, 0.38);
    if (this.textures.exists(LOADING_RUNNER_KEY)) {
      this.loadingRunner = this.add.image(barX, barY - 2, LOADING_RUNNER_KEY).setOrigin(0.5, 1);
      this.sizeLoadingRunnerSprite(this.loadingRunner);
    } else {
      this.loadingRunner = this.add.circle(barX, barY - 2, 14, 0x38bdf8, 1);
      this.loadingRunner.setStrokeStyle(2, 0xf7ecd3);
    }
    this.loadingPercentText = this.add.text(barX, barY - 116, "0%", {
      fontSize: "18px",
      fontStyle: "bold",
      color: "#f7ecd3",
      stroke: "#0b0811",
      strokeThickness: 4,
    }).setOrigin(0.5);
    this.loadingRunnerGlow = this.add.circle(barX, barY - 46, 28, 0x38bdf8, 0.12);
    this.updateLoadingDisplay(0, barX, barY, barWidth);
    this.load.on("filecomplete-image-" + LOADING_RUNNER_KEY, () => {
      if (this.loadingRunner?.destroy) this.loadingRunner.destroy();
      this.loadingRunner = this.add.image(barX, barY - 2, LOADING_RUNNER_KEY).setOrigin(0.5, 1);
      this.sizeLoadingRunnerSprite(this.loadingRunner);
      this.updateLoadingDisplay(this.currentLoadingProgress || 0, barX, barY, barWidth);
    });
    this.load.on("progress", (value) => this.updateLoadingDisplay(value, barX, barY, barWidth));
    this.load.once("complete", () => this.updateLoadingDisplay(1, barX, barY, barWidth));
    queueImage(this, LOADING_RUNNER_KEY, LOADING_RUNNER_PATH);
    queueChapterOneAssets(this, LEVELS.chapter1);
  }

  sizeLoadingRunnerSprite(sprite) {
    if (!sprite || !this.textures.exists(LOADING_RUNNER_KEY)) return;
    const source = this.textures.get(LOADING_RUNNER_KEY)?.getSourceImage();
    const sourceHeight = source?.height || 96;
    const maxHeight = 112;
    const scale = sourceHeight > maxHeight ? maxHeight / sourceHeight : 1;
    sprite.setScale(scale);
  }

  updateLoadingDisplay(value, barX, barY, barWidth) {
    const progress = Phaser.Math.Clamp(value || 0, 0, 1);
    this.currentLoadingProgress = progress;
    const runnerX = barX + barWidth * progress;
    const percent = Math.round(progress * 100);
    if (this.loadingTrail) this.loadingTrail.displayWidth = Math.max(1, barWidth * progress);
    if (this.loadingRunner) {
      this.loadingRunner.x = runnerX;
      this.loadingRunner.y = barY - 2;
    }
    if (this.loadingRunnerShadow) {
      this.loadingRunnerShadow.x = runnerX;
      this.loadingRunnerShadow.y = barY + 18;
    }
    if (this.loadingRunnerGlow) {
      this.loadingRunnerGlow.x = runnerX;
      this.loadingRunnerGlow.y = barY - 46;
    }
    if (this.loadingPercentText) {
      this.loadingPercentText.x = runnerX;
      this.loadingPercentText.y = barY - 116;
      this.loadingPercentText.setText(`${percent}%`);
    }
  }

  create() {
    this.time.delayedCall(350, () => this.scene.start("BattleScene", this.nextSceneData || {}));
  }
}

class TitleScene extends Phaser.Scene {
  constructor() {
    super("TitleScene");
  }

  preload() {
    queueImage(this, TITLE_SCREEN_KEY, TITLE_SCREEN_PATH);
    queueImage(this, LOADING_RUNNER_KEY, LOADING_RUNNER_PATH);
  }

  create() {
    this.cameras.main.setBackgroundColor("#06030b");
    if (this.textures.exists(TITLE_SCREEN_KEY)) {
      const splash = this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, TITLE_SCREEN_KEY);
      fitImageToBounds(this, splash, TITLE_SCREEN_KEY, GAME_WIDTH, GAME_HEIGHT, true);
    } else {
      this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x09050f, 1);
      this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 10, "The Bards: Tactics", {
        fontSize: "46px",
        fontStyle: "bold",
        color: "#f7ecd3",
        stroke: "#0b0811",
        strokeThickness: 6,
      }).setOrigin(0.5);
    }
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.12);
    const promptPanel = createBannerPanel(this, GAME_WIDTH / 2, GAME_HEIGHT - 42, 300, 48, { innerInset: 12 });
    const promptText = this.add.text(0, 0, "Click to Start", {
      fontSize: "24px",
      fontStyle: "bold",
      color: "#f7ecd3",
      stroke: "#0b0811",
      strokeThickness: 4,
    }).setOrigin(0.5);
    promptPanel.container.add(promptText);
    this.tweens.add({ targets: promptPanel.container, alpha: 0.45, duration: 800, yoyo: true, repeat: -1 });
    this.input.once("pointerdown", () => this.scene.start("MainMenuScene"));
  }
}

class MainMenuScene extends Phaser.Scene {
  constructor() {
    super("MainMenuScene");
  }

  preload() {
    queueImage(this, TITLE_SCREEN_KEY, TITLE_SCREEN_PATH);
    queueImage(this, LOADING_RUNNER_KEY, LOADING_RUNNER_PATH);
  }

  getSaveData() {
    try {
      const raw = window.localStorage.getItem(SAVE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (error) {
      return null;
    }
  }

  create() {
    this.cameras.main.setBackgroundColor("#06030b");
    if (this.textures.exists(TITLE_SCREEN_KEY)) {
      const bg = this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, TITLE_SCREEN_KEY);
      fitImageToBounds(this, bg, TITLE_SCREEN_KEY, GAME_WIDTH, GAME_HEIGHT, true);
      bg.setAlpha(0.45);
    }
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x06030b, 0.58);
    const panel = createBannerPanel(this, GAME_WIDTH / 2, GAME_HEIGHT / 2, 390, 250, { innerInset: 16 });
    const heading = this.add.text(0, -82, "Main Menu", {
      fontSize: "34px",
      fontStyle: "bold",
      color: "#f7ecd3",
      stroke: "#0b0811",
      strokeThickness: 4,
    }).setOrigin(0.5);
    const subtitle = this.add.text(0, -48, "Choose your path.", { fontSize: "16px", color: "#d8c4f0" }).setOrigin(0.5);
    const newGameButton = createBannerButton(this, 0, 12, 220, 48, "New Game", () => this.scene.start("LoadingScene", { loadFromSave: false }), "24px");
    const loadGameButton = createBannerButton(this, 0, 72, 220, 48, "Load Game", () => {
      const saveData = this.getSaveData();
      if (!saveData) {
        this.statusText.setText("No local save data found.");
        return;
      }
      this.scene.start("LoadingScene", { loadFromSave: true, saveData });
    }, "24px");
    this.statusText = this.add.text(0, 118, "", { fontSize: "14px", color: "#f4d7d7", align: "center", wordWrap: { width: 280 } }).setOrigin(0.5, 0);
    panel.container.add([heading, subtitle, newGameButton.container, loadGameButton.container, this.statusText]);
  }
}

class BattleScene extends Phaser.Scene {
  constructor() {
    super("BattleScene");
  }

  init(data = {}) {
    this.loadFromSave = data.loadFromSave === true;
    this.loadedSaveData = data.saveData || null;
  }

  preload() {
    queueChapterOneAssets(this, this.getCurrentLevel());
  }

  create() {
    this.levelData = this.getCurrentLevel();
    this.currentBiomeKey = this.levelData.biome;
    this.map = this.levelData.map;
    this.mapRows = this.map.length;
    this.mapCols = this.map[0]?.length || 0;
    this.units = this.levelData.units.map((unit) => ({
      ...unit,
      luck: unit.luck ?? 0,
      facing: unit.facing || "down",
      spriteState: unit.spriteState || "idle",
      sigilPoints: unit.sigilPoints ?? 3,
      maxSigilPoints: unit.maxSigilPoints ?? 3,
      skills: (unit.skills || []).map((skill) => ({ ...skill })),
      weapons: (unit.weapons || []).map((weapon) => ({ ...weapon })),
    }));

    this.selectedUnitId = null;
    this.moveTiles = [];
    this.targetTiles = [];
    this.unitSprites = {};
    this.phase = "intro";
    this.busy = false;
    this.previewOpen = false;
    this.previewData = null;
    this.actionMenuOpen = false;
    this.actionMenuUnitId = null;
    this.actionMenuContainer = null;
    this.skillBannerContainer = null;
    this.skillBannerText = null;
    this.battleMusic = null;
    this.battleMusicStarted = false;
    this.postBattleStep = 0;
    this.postBattleActionSteps = new Set();
    this.postBattleStarted = false;
    this.levelUpQueue = [];
    this.levelUpAllocationOpen = false;
    this.currentLevelUpData = null;
    this.openingStep = 0;
    this.openingLine = 0;

    this.cameras.main.setBackgroundColor("#0f172a");
    this.boardWidth = this.mapCols * TILE_SIZE;
    this.boardHeight = this.mapRows * TILE_SIZE;
    this.boardX = 200;
    this.boardY = 14;
    this.tileLayer = this.add.layer();
    this.overlayLayer = this.add.layer();
    this.unitLayer = this.add.layer();
    this.uiLayer = this.add.layer();

    this.createTopUI();
    this.drawBoard();
    this.drawUnits();
    this.createSidePanel();
    this.createPreviewUI();
    this.createCombatXpPopup();
    this.createSkillBanner();
    this.createLevelUpAllocationUI();
    this.createOpeningUI();
    this.createPostBattleUI();
    this.setupInput();
    this.updateSelectedPanel();
    this.setObjectiveDisplayVisible(false);

    if (this.loadFromSave) {
      this.startLoadedBattle();
    } else {
      this.updateOpeningUI();
    }
  }

  getCurrentLevel() {
    return LEVELS.chapter1;
  }

  getSavedGameData() {
    if (this.loadedSaveData) return this.loadedSaveData;
    try {
      const raw = window.localStorage.getItem(SAVE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (error) {
      return null;
    }
  }

  startLoadedBattle() {
    this.openingContainer.setVisible(false);
    this.startPlayerPhase();
    this.selectedUnitId = "edwin";
    this.updateSelectedPanel();
    if (this.getSavedGameData()) this.helpText.setText("Loaded game. Player Phase. Click Edwin or Leon.");
  }

  createTopUI() {
    const panel = createBannerPanel(this, 88, 92, 170, 170, { innerInset: 14 });
    this.topInfoPanel = panel.container;
    this.objectiveHeader = this.add.text(-68, -68, "Objective", {
      fontSize: "13px",
      fontStyle: "bold",
      color: "#e8c98b",
      stroke: "#0b0811",
      strokeThickness: 2,
    });
    this.objectiveText = this.add.text(-68, -48, this.levelData?.objective || "Defeat Falan, the gang leader.", {
      fontSize: "11px",
      color: "#f7ecd3",
      wordWrap: { width: 136 },
      lineSpacing: 2,
    });
    this.phaseText = this.add.text(-68, 14, "Opening", {
      fontSize: "16px",
      fontStyle: "bold",
      color: "#f7ecd3",
      stroke: "#0b0811",
      strokeThickness: 3,
    });
    this.helpText = this.add.text(-68, 40, "Watch the chapter opening.", {
      fontSize: "11px",
      color: "#d8c4f0",
      wordWrap: { width: 136 },
      lineSpacing: 2,
    });
    panel.container.add([this.objectiveHeader, this.objectiveText, this.phaseText, this.helpText]);
    this.uiLayer.add(panel.container);
  }

  setObjectiveDisplayVisible(visible) {
    const shouldShow = !!visible;
    if (this.objectiveHeader) this.objectiveHeader.setVisible(shouldShow);
    if (this.objectiveText) this.objectiveText.setVisible(shouldShow);
  }

  createSidePanel() {
    const x = 722;
    const y = 28;
    const panelWidth = 232;
    const panelHeight = 500;
    const innerX = x + 14;
    const barWidth = 200;
    this.sidePanelBarWidth = barWidth;
    const bg = this.add.rectangle(x + panelWidth / 2, y + panelHeight / 2, panelWidth, panelHeight, 0x111827, 0.92);
    bg.setStrokeStyle(2, 0x334155);
    const title = this.add.text(innerX, y + 12, "Selected Unit", { fontSize: "18px", fontStyle: "bold", color: "#f7ecd3" });
    this.portraitFrame = this.add.rectangle(innerX + 44, y + 76, 88, 104, 0x1f2937);
    this.portraitFrame.setStrokeStyle(2, 0x475569);
    this.portraitImage = this.add.image(innerX + 44, y + 76, "edwinPortrait").setVisible(false);
    this.portraitImage.setDisplaySize(88, 104);
    this.portraitPlaceholder = this.add.text(innerX + 44, y + 76, "NO\nART", { fontSize: "18px", color: "#94a3b8", align: "center" }).setOrigin(0.5);
    this.unitNameText = this.add.text(innerX, y + 136, "None", { fontSize: "21px", fontStyle: "bold", color: "#f7ecd3" });
    this.unitClassText = this.add.text(innerX, y + 166, "", { fontSize: "12px", color: "#94a3b8", wordWrap: { width: 202 } });
    this.hpBarText = this.add.text(innerX, y + 198, "", { fontSize: "12px", color: "#fecaca" });
    this.hpBarBg = this.add.rectangle(innerX, y + 218, barWidth, 9, 0x1f2937).setOrigin(0, 0.5);
    this.hpBarBg.setStrokeStyle(1, 0x475569);
    this.hpBarFill = this.add.rectangle(innerX, y + 218, barWidth, 9, 0xef4444).setOrigin(0, 0.5);
    this.hpBarFill.displayWidth = 0;
    this.levelXpText = this.add.text(innerX, y + 230, "", { fontSize: "12px", color: "#d8c4f0" });
    this.xpBarBg = this.add.rectangle(innerX, y + 250, barWidth, 9, 0x1f2937).setOrigin(0, 0.5);
    this.xpBarBg.setStrokeStyle(1, 0x475569);
    this.xpBarFill = this.add.rectangle(innerX, y + 250, barWidth, 9, 0x8b5cf6).setOrigin(0, 0.5);
    this.xpBarFill.displayWidth = 0;
    this.sigilText = this.add.text(innerX, y + 264, "Sigil", { fontSize: "11px", color: "#ddd6fe" });
    this.sigilOrbs = [0, 1, 2].map((index) => {
      const orb = this.add.circle(innerX + 54 + index * 20, y + 270, 6, 0x2e1065, 1);
      orb.setStrokeStyle(2, 0xc4b5fd);
      return orb;
    });
    this.unitStatsText = this.add.text(innerX, y + 284, "", { fontSize: "10px", color: "#e2e8f0", lineSpacing: 0 });
    this.weaponText = this.add.text(innerX, y + 408, "", { fontSize: "10px", color: "#c4b5fd", wordWrap: { width: 202 }, lineSpacing: 1 });
    this.sidePanelParts = [
      bg,
      title,
      this.portraitFrame,
      this.portraitImage,
      this.portraitPlaceholder,
      this.unitNameText,
      this.unitClassText,
      this.hpBarText,
      this.hpBarBg,
      this.hpBarFill,
      this.levelXpText,
      this.xpBarBg,
      this.xpBarFill,
      this.sigilText,
      ...this.sigilOrbs,
      this.unitStatsText,
      this.weaponText,
    ];
    this.uiLayer.add(this.sidePanelParts);
  }

  createPreviewUI() {
    this.previewContainer = this.add.container(GAME_WIDTH / 2, 430).setVisible(false);
    const panel = this.add.rectangle(0, 0, 620, 150, 0x0f172a, 0.97);
    panel.setStrokeStyle(2, 0x475569);
    const title = this.add.text(-292, -58, "Combat Preview", { fontSize: "22px", fontStyle: "bold", color: "#f7ecd3" });
    this.previewLeftName = this.add.text(-292, -18, "", { fontSize: "18px", fontStyle: "bold", color: "#93c5fd" });
    this.previewLeftStats = this.add.text(-292, 10, "", { fontSize: "13px", color: "#e2e8f0", lineSpacing: 3 });
    this.previewRightName = this.add.text(30, -18, "", { fontSize: "18px", fontStyle: "bold", color: "#fca5a5" });
    this.previewRightStats = this.add.text(30, 10, "", { fontSize: "13px", color: "#e2e8f0", lineSpacing: 3 });
    const confirmButton = this.add.rectangle(-90, 50, 140, 34, 0x2563eb);
    confirmButton.setStrokeStyle(2, 0x93c5fd);
    confirmButton.setInteractive({ useHandCursor: true });
    confirmButton.on("pointerdown", () => {
      if (this.previewOpen) this.confirmPreviewAttack();
    });
    const confirmText = this.add.text(-132, 39, "Confirm", { fontSize: "16px", fontStyle: "bold", color: "#f7ecd3" });
    const cancelButton = this.add.rectangle(90, 50, 140, 34, 0x334155);
    cancelButton.setStrokeStyle(2, 0x94a3b8);
    cancelButton.setInteractive({ useHandCursor: true });
    cancelButton.on("pointerdown", () => {
      if (this.previewOpen) this.closePreview();
    });
    const cancelText = this.add.text(52, 39, "Cancel", { fontSize: "16px", fontStyle: "bold", color: "#f7ecd3" });
    this.previewContainer.add([panel, title, this.previewLeftName, this.previewLeftStats, this.previewRightName, this.previewRightStats, confirmButton, confirmText, cancelButton, cancelText]);
    this.uiLayer.add(this.previewContainer);
  }

  createCombatXpPopup() {
    this.combatXpContainer = this.add.container(GAME_WIDTH / 2, GAME_HEIGHT - 68).setVisible(false).setDepth(9998).setAlpha(0);
    const bg = this.add.rectangle(0, 0, 320, 88, 0x020617, 0.96);
    bg.setStrokeStyle(2, 0x475569);
    this.combatXpNameText = this.add.text(-140, -28, "", { fontSize: "18px", fontStyle: "bold", color: "#f7ecd3" });
    this.combatXpGainText = this.add.text(140, -28, "", { fontSize: "16px", fontStyle: "bold", color: "#7dd3fc" }).setOrigin(1, 0);
    this.combatXpValueText = this.add.text(-140, -2, "", { fontSize: "14px", color: "#d8c4f0" });
    this.combatXpBarBg = this.add.rectangle(-140, 26, 280, 14, 0x1f2937).setOrigin(0, 0.5);
    this.combatXpBarBg.setStrokeStyle(1, 0x475569);
    this.combatXpBarFill = this.add.rectangle(-140, 26, 280, 14, 0x38bdf8).setOrigin(0, 0.5);
    this.combatXpBarFill.displayWidth = 0;
    this.combatXpContainer.add([bg, this.combatXpNameText, this.combatXpGainText, this.combatXpValueText, this.combatXpBarBg, this.combatXpBarFill]);
    this.uiLayer.add(this.combatXpContainer);
  }

  createSkillBanner() {
    this.skillBannerContainer = this.add.container(GAME_WIDTH / 2, 46).setDepth(10000).setVisible(false).setAlpha(0);
    const panel = createBannerPanel(this, 0, 0, 490, 60, { innerInset: 14 });
    this.skillBannerText = this.add.text(0, 0, "", {
      fontSize: "24px",
      fontStyle: "bold",
      color: "#f7ecd3",
      stroke: "#0b0811",
      strokeThickness: 4,
    }).setOrigin(0.5);
    panel.container.add(this.skillBannerText);
    this.skillBannerContainer.add(panel.container);
    this.uiLayer.add(this.skillBannerContainer);
  }

  createLevelUpAllocationUI() {
    this.levelUpContainer = this.add.container(GAME_WIDTH / 2, GAME_HEIGHT / 2).setVisible(false).setDepth(LEVEL_UP_PANEL_DEPTH);
    const dim = this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.62).setInteractive();
    const panel = createBannerPanel(this, 0, 0, 620, 430, { innerInset: 18 });
    this.levelUpTitle = this.add.text(0, -182, "LEVEL UP!", {
      fontSize: "32px",
      fontStyle: "bold",
      color: "#e8c98b",
      stroke: "#0b0811",
      strokeThickness: 5,
    }).setOrigin(0.5);
    this.levelUpSubtitle = this.add.text(0, -146, "", { fontSize: "17px", color: "#f7ecd3" }).setOrigin(0.5);
    this.levelUpRollText = this.add.text(0, -116, "", { fontSize: "14px", color: "#d8c4f0", align: "center", wordWrap: { width: 530 } }).setOrigin(0.5);
    this.levelUpPointsText = this.add.text(0, -88, "", {
      fontSize: "20px",
      fontStyle: "bold",
      color: "#7dd3fc",
      stroke: "#0b0811",
      strokeThickness: 3,
    }).setOrigin(0.5);
    this.levelUpStatRows = [];
    LEVEL_UP_STATS.forEach((stat, index) => {
      const rowY = -52 + index * 36;
      const label = this.add.text(-250, rowY, stat.label, { fontSize: "15px", fontStyle: "bold", color: "#f7ecd3" }).setOrigin(0, 0.5);
      const value = this.add.text(-184, rowY, "", { fontSize: "15px", color: "#e2e8f0" }).setOrigin(0, 0.5);
      const desc = this.add.text(-92, rowY, stat.description, { fontSize: "11px", color: "#bdaee0" }).setOrigin(0, 0.5);
      const plusButton = createBannerButton(this, 226, rowY, 42, 28, "+", () => this.allocatePendingLevelPoint(stat.key), "18px");
      this.levelUpContainer.add([label, value, desc, plusButton.container]);
      this.levelUpStatRows.push({ stat, label, value, desc, plusButton });
    });
    this.levelUpConfirmButton = createBannerButton(this, 0, 174, 220, 42, "Confirm", () => this.confirmLevelUpAllocation(), "20px");
    this.levelUpHint = this.add.text(0, 208, "Spend all points to continue.", { fontSize: "12px", color: "#cbd5e1" }).setOrigin(0.5);
    this.levelUpContainer.add([dim, panel.container, this.levelUpTitle, this.levelUpSubtitle, this.levelUpRollText, this.levelUpPointsText, this.levelUpConfirmButton.container, this.levelUpHint]);
    this.uiLayer.add(this.levelUpContainer);
  }

  getLevelUpStatValue(unit, statKey) {
    if (!unit) return 0;
    if (statKey === "hp") return unit.maxHp || 0;
    return unit[statKey] || 0;
  }

  refreshLevelUpAllocationUI() {
    const data = this.currentLevelUpData;
    const unit = data ? this.units.find((candidate) => candidate.id === data.unitId) : null;
    if (!data || !unit) return;
    this.levelUpSubtitle.setText(`${unit.name} reached Lv ${data.level}.`);
    this.levelUpRollText.setText(`Luck ${data.luckAtRoll} weighted the level-up die and rolled ${data.pointsTotal} point${data.pointsTotal === 1 ? "" : "s"}.`);
    this.levelUpPointsText.setText(`Points left: ${data.pointsRemaining}`);
    this.levelUpStatRows.forEach((row) => {
      const current = this.getLevelUpStatValue(unit, row.stat.key);
      const added = data.allocations[row.stat.key] || 0;
      row.value.setText(added > 0 ? `${current} (+${added})` : `${current}`);
      row.plusButton.container.setAlpha(data.pointsRemaining > 0 ? 1 : 0.42);
    });
    this.levelUpConfirmButton.container.setAlpha(data.pointsRemaining === 0 ? 1 : 0.48);
    this.levelUpHint.setText(data.pointsRemaining === 0 ? "Ready. Confirm to finish the level up." : "Use the plus buttons to spend every point.");
  }

  allocatePendingLevelPoint(statKey) {
    const data = this.currentLevelUpData;
    if (!data || data.pointsRemaining <= 0) return;
    const unit = this.units.find((candidate) => candidate.id === data.unitId);
    if (!unit) return;
    if (statKey === "hp") {
      unit.maxHp += 1;
      unit.hp += 1;
    } else {
      unit[statKey] = (unit[statKey] || 0) + 1;
    }
    data.allocations[statKey] = (data.allocations[statKey] || 0) + 1;
    data.pointsRemaining -= 1;
    this.updateSelectedPanel();
    this.refreshLevelUpAllocationUI();
  }

  confirmLevelUpAllocation() {
    const data = this.currentLevelUpData;
    if (!data || data.pointsRemaining > 0) return;
    const unit = this.units.find((candidate) => candidate.id === data.unitId);
    this.levelUpContainer.setVisible(false);
    this.levelUpAllocationOpen = false;
    this.currentLevelUpData = null;
    if (unit) {
      this.showFloatingText(this.boardX + unit.x * TILE_SIZE + TILE_SIZE / 2, this.boardY + unit.y * TILE_SIZE + 6, "LEVEL UP!", "#fcd34d");
      this.refreshUnitSprite(unit);
      this.updateSelectedPanel();
    }
    this.processLevelUpQueue();
  }

  rollLevelUpPoints(unit) {
    const luck = Math.max(0, unit?.luck || 0);
    const faces = [1, 2, 3, 4, 5, 6];
    const weights = faces.map((face) => Math.max(1, 10 + luck * (face - 3.5)));
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
    let roll = Phaser.Math.FloatBetween(0, totalWeight);
    let result = 1;
    for (let index = 0; index < faces.length; index += 1) {
      roll -= weights[index];
      if (roll <= 0) {
        result = faces[index];
        break;
      }
    }
    const extraPotential = Math.max(0, (luck - 12) / 8);
    const guaranteedExtras = Math.floor(extraPotential);
    const extraChance = (extraPotential - guaranteedExtras) * 100;
    const chanceExtra = Phaser.Math.Between(1, 100) <= extraChance ? 1 : 0;
    return result + guaranteedExtras + chanceExtra;
  }

  queueLevelUpAllocation(unit, points) {
    if (!unit || unit.team !== "player") return;
    this.levelUpQueue.push({
      unitId: unit.id,
      level: unit.level,
      pointsTotal: points,
      pointsRemaining: points,
      luckAtRoll: unit.luck || 0,
      allocations: {},
    });
  }

  processLevelUpQueue() {
    if (this.levelUpAllocationOpen || this.levelUpQueue.length === 0) return;
    const next = this.levelUpQueue.shift();
    const unit = this.units.find((candidate) => candidate.id === next.unitId);
    if (!unit) {
      this.processLevelUpQueue();
      return;
    }
    this.currentLevelUpData = next;
    this.levelUpAllocationOpen = true;
    this.levelUpContainer.setVisible(true);
    this.levelUpContainer.setAlpha(0);
    this.refreshLevelUpAllocationUI();
    this.tweens.add({ targets: this.levelUpContainer, alpha: 1, duration: 180 });
  }

  showSkillBanner(skillName) {
    if (!this.skillBannerContainer || !this.skillBannerText) return;
    this.tweens.killTweensOf(this.skillBannerContainer);
    this.skillBannerText.setText(skillName);
    this.skillBannerContainer.setVisible(true).setAlpha(0);
    this.skillBannerContainer.y = 28;
    this.tweens.add({
      targets: this.skillBannerContainer,
      alpha: 1,
      y: 46,
      duration: 180,
      ease: "Back.Out",
      onComplete: () => {
        this.time.delayedCall(SKILL_BANNER_DURATION, () => {
          if (!this.skillBannerContainer?.visible) return;
          this.tweens.add({
            targets: this.skillBannerContainer,
            alpha: 0,
            y: 28,
            duration: 180,
            ease: "Quad.Out",
            onComplete: () => this.skillBannerContainer.setVisible(false),
          });
        });
      },
    });
  }

  showCombatXpPopup(unit, amount, startLevel, startXp) {
    if (!this.combatXpContainer || !unit || amount <= 0) return;
    this.tweens.killTweensOf(this.combatXpContainer);
    this.tweens.killTweensOf(this.combatXpBarFill);
    const popup = this.combatXpContainer;
    popup.setVisible(true).setAlpha(1);
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
          this.tweens.add({ targets: popup, alpha: 0, duration: 220, onComplete: () => popup.setVisible(false) });
        });
        return;
      }
      const neededToLevel = 100 - currentXp;
      const chunk = Math.min(remainingXp, neededToLevel);
      this.tweens.addCounter({
        from: currentXp,
        to: currentXp + chunk,
        duration: 450,
        onUpdate: (tween) => setDisplay(displayLevel, Math.floor(tween.getValue())),
        onComplete: () => {
          currentXp += chunk;
          remainingXp -= chunk;
          if (currentXp >= 100) {
            displayLevel += 1;
            currentXp = 0;
            setDisplay(displayLevel, currentXp);
            this.time.delayedCall(250, animateChunk);
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
    if (weapon.damageType === "magical") return defender.res || 0;
    return (defender.def || 0) + this.getTerrainDefenseBonus(defender);
  }

  calculateBaseDamage(attacker, defender, weapon) {
    if (!attacker || !defender || !weapon) return 0;
    const attackStatName = weapon.stat || "str";
    const attackStat = attacker[attackStatName] || 0;
    const baseDamage = weapon.baseDamage ?? weapon.damage ?? 0;
    const defense = this.getDefenseForAttack(defender, weapon);
    return Math.max(0, baseDamage + attackStat - defense);
  }

  calculateDamage(attacker, defender, weapon) {
    return this.calculateBaseDamage(attacker, defender, weapon);
  }

  calculateCriticalChance(attacker, defender) {
    if (!attacker || !defender) return 0;
    return Phaser.Math.Clamp((attacker.luck || 0) - (defender.luck || 0), 0, 100);
  }

  rollCritical(attacker, defender) {
    const critChance = this.calculateCriticalChance(attacker, defender);
    return Phaser.Math.Between(1, 100) <= critChance;
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
    return Phaser.Math.Between(1, 100) <= (weapon?.hitRate ?? 100);
  }

  resolveAttackSequence(attacker, defender, weapon) {
    const attackCount = this.calculateAttackCount(attacker, defender, weapon);
    const results = [];
    let totalDamage = 0;
    let didKill = false;
    for (let i = 0; i < attackCount; i += 1) {
      if (defender.hp <= 0) break;
      const hit = this.rollHit(weapon);
      if (!hit) {
        results.push({ hit: false, critical: false, damage: 0, baseDamage: 0 });
        continue;
      }
      const baseDamage = this.calculateDamage(attacker, defender, weapon);
      const critical = this.rollCritical(attacker, defender);
      const damage = critical ? baseDamage * 3 : baseDamage;
      defender.hp = Math.max(0, defender.hp - damage);
      totalDamage += damage;
      results.push({ hit: true, critical, damage, baseDamage });
      if (defender.hp <= 0) {
        didKill = true;
        break;
      }
    }
    return { attackCount, results, totalDamage, didKill };
  }

  showCombatResultText(unit, result, index = 0) {
    const text = !result.hit ? "MISS" : result.critical ? `CRIT -${result.damage}` : `-${result.damage}`;
    const color = !result.hit ? "#fef3c7" : result.critical ? "#fde68a" : "#fca5a5";
    this.time.delayedCall(index * 140, () => {
      this.showFloatingText(this.boardX + unit.x * TILE_SIZE + TILE_SIZE / 2, this.boardY + unit.y * TILE_SIZE + 8, text, color);
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
    let levelsGained = 0;
    unit.xp += amount;
    while (unit.xp >= 100) {
      unit.xp -= 100;
      this.levelUpUnit(unit);
      levelsGained += 1;
    }
    this.showCombatXpPopup(unit, amount, oldLevel, oldXp);
    this.updateSelectedPanel();
    if (levelsGained > 0) {
      this.time.delayedCall(900, () => this.processLevelUpQueue());
    }
  }

  levelUpUnit(unit) {
    unit.level += 1;
    const points = this.rollLevelUpPoints(unit);
    this.queueLevelUpAllocation(unit, points);
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
    this.tweens.add({ targets: floating, y: y - 28, alpha: 0, duration: 900, ease: "Cubic.easeOut", onComplete: () => floating.destroy() });
    return floating;
  }

  fitImageInBox(image, textureKey, maxWidth, maxHeight) {
    if (!image) return;
    if (textureKey && this.textures.exists(textureKey)) image.setTexture(textureKey);
    const source = image.texture?.getSourceImage?.();
    if (!source?.width || !source?.height) {
      image.setDisplaySize(maxWidth, maxHeight);
      return;
    }
    const scale = Math.min(maxWidth / source.width, maxHeight / source.height);
    image.setDisplaySize(source.width * scale, source.height * scale);
  }

  createPostBattleUI() {
    this.postBattleContainer = this.add.container(0, 0).setVisible(false).setDepth(9997);
    this.postBattleDim = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.18);
    this.postBattleFullSceneImage = this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, "byronFarmScene").setDisplaySize(GAME_WIDTH, GAME_HEIGHT).setVisible(false);
    this.postBattleMainPanel = this.add.rectangle(480, 250, 860, 430, 0x020617, 0.78);
    this.postBattleMainPanel.setStrokeStyle(2, 0x475569);
    this.postBattleSceneFrame = this.add.rectangle(315, 175, 560, 315, 0x111827, 1);
    this.postBattleSceneFrame.setStrokeStyle(2, 0x64748b);
    this.postBattleSceneImage = this.add.image(315, 175, "vanInteriorScene");
    this.fitImageInBox(this.postBattleSceneImage, "vanInteriorScene", 548, 308);
    this.postBattleSceneName = this.add.text(54, 30, "", { fontSize: "16px", color: "#e8c98b", fontStyle: "bold" });
    this.postBattlePortraitPanel = this.add.rectangle(720, 175, 180, 200, 0x111827, 1);
    this.postBattlePortraitPanel.setStrokeStyle(2, 0x64748b);
    this.postBattlePortraitFrame = this.add.rectangle(720, 160, 120, 140, 0x1f2937);
    this.postBattlePortraitFrame.setStrokeStyle(2, 0x64748b);
    this.postBattlePortrait = this.add.image(720, 160, "leonPortrait").setDisplaySize(110, 132);
    this.postBattleOverlapPortrait = this.add.image(682, 164, "heathPortrait").setDisplaySize(90, 108).setAlpha(0.9).setVisible(false);
    this.postBattlePortraitPlaceholder = this.add.text(720, 160, "NO\nART", { fontSize: "20px", color: "#94a3b8", align: "center" }).setOrigin(0.5);
    this.postBattleTextBox = this.add.rectangle(480, 395, 800, 120, 0x1a0d2a, 0.98);
    this.postBattleTextBox.setStrokeStyle(2, 0xb6925f);
    this.postBattleSpeaker = this.add.text(90, 343, "", { fontSize: "24px", fontStyle: "bold", color: "#f7ecd3" });
    this.postBattleText = this.add.text(90, 378, "", { fontSize: "20px", color: "#eadff7", wordWrap: { width: 660 }, lineSpacing: 8 });
    this.postBattleNextButton = this.add.rectangle(820, 460, 110, 34, 0x2563eb);
    this.postBattleNextButton.setStrokeStyle(2, 0x93c5fd);
    this.postBattleNextButton.setInteractive({ useHandCursor: true });
    this.postBattleNextButton.on("pointerdown", () => this.advancePostBattle());
    this.postBattleNextLabel = this.add.text(785, 449, "Next", { fontSize: "16px", fontStyle: "bold", color: "#f7ecd3" });
    this.savePromptContainer = this.add.container(GAME_WIDTH / 2, GAME_HEIGHT / 2).setVisible(false);
    const saveBg = this.add.rectangle(0, 0, 430, 230, 0x020617, 0.96);
    saveBg.setStrokeStyle(2, 0xfcd34d);
    this.savePromptTitle = this.add.text(0, -72, "Chapter 1 Complete", { fontSize: "30px", fontStyle: "bold", color: "#e8c98b" }).setOrigin(0.5);
    this.savePromptText = this.add.text(0, -28, "Save game?", { fontSize: "20px", color: "#f8fafc" }).setOrigin(0.5);
    const saveButton = this.add.rectangle(-92, 48, 130, 40, 0x2563eb);
    saveButton.setStrokeStyle(2, 0x93c5fd);
    saveButton.setInteractive({ useHandCursor: true });
    saveButton.on("pointerdown", () => this.saveChapterOne());
    const saveButtonText = this.add.text(-92, 48, "Save", { fontSize: "18px", fontStyle: "bold", color: "#f7ecd3" }).setOrigin(0.5);
    const continueButton = this.add.rectangle(92, 48, 130, 40, 0x334155);
    continueButton.setStrokeStyle(2, 0x94a3b8);
    continueButton.setInteractive({ useHandCursor: true });
    continueButton.on("pointerdown", () => this.finishChapterOne());
    const continueButtonText = this.add.text(92, 48, "Continue", { fontSize: "18px", fontStyle: "bold", color: "#f7ecd3" }).setOrigin(0.5);
    this.savePromptStatus = this.add.text(0, 92, "", { fontSize: "14px", color: "#86efac" }).setOrigin(0.5);
    this.savePromptContainer.add([saveBg, this.savePromptTitle, this.savePromptText, saveButton, saveButtonText, continueButton, continueButtonText, this.savePromptStatus]);
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
      this.postBattlePortrait.setTexture(portraitKey).setDisplaySize(110, 132).setVisible(true);
      this.postBattlePortraitPlaceholder.setVisible(false);
    } else {
      this.postBattlePortrait.setVisible(false);
      this.postBattlePortraitPlaceholder.setVisible(true);
    }
    if (overlapPortraitKey && this.textures.exists(overlapPortraitKey)) {
      this.postBattleOverlapPortrait.setTexture(overlapPortraitKey).setDisplaySize(90, 108).setVisible(true);
      this.postBattleOverlapPortrait.setDepth(this.postBattlePortrait.depth + 1);
    }
  }

  startPostBattleScene() {
    if (this.postBattleStarted) return;
    this.closeActionMenu();
    this.stopBattleMusic();
    this.postBattleStarted = true;
    this.phase = "postbattle";
    this.busy = true;
    this.previewOpen = false;
    this.previewData = null;
    if (this.previewContainer) this.previewContainer.setVisible(false);
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
    this.postBattleContainer.setVisible(true).setAlpha(0);
    this.tweens.add({ targets: this.postBattleContainer, alpha: 1, duration: 250, onComplete: () => this.updatePostBattleUI() });
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
      this.tweens.add({ targets: sprite.container, alpha: 0, duration: 650, ease: "Quad.Out", onComplete: () => this.removeUnitSpriteAndData(unitId) });
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
      if (line.scene && this.textures.exists(line.scene)) this.fitImageInBox(this.postBattleFullSceneImage, line.scene, GAME_WIDTH, GAME_HEIGHT);
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
    if (line.type === "sceneDialogue" || line.type === "sceneNarration" || line.type === "overlapDialogue") {
      this.postBattleDim.setAlpha(0.82);
      this.postBattleSceneFrame.setVisible(true);
      this.postBattleSceneImage.setVisible(true);
      this.postBattleSceneName.setVisible(true);
      this.postBattleSceneName.setText(line.sceneName || "");
      if (line.scene && this.textures.exists(line.scene)) this.fitImageInBox(this.postBattleSceneImage, line.scene, 548, 308);
    }
    if (line.type === "mapDialogue" || line.type === "mapAction") {
      this.postBattleDim.setAlpha(0.18);
      this.postBattleSceneFrame.setVisible(false);
      this.postBattleSceneImage.setVisible(false);
      this.postBattleSceneName.setVisible(false);
    }
    this.postBattleSpeaker.setText(line.speaker || "");
    this.postBattleText.setText(line.text || "");
    this.setPostBattlePortrait(line.portrait, line.overlapPortrait);
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
    if (this.textures.exists("byronFarmScene")) this.fitImageInBox(this.postBattleFullSceneImage, "byronFarmScene", GAME_WIDTH, GAME_HEIGHT);
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
    const saveData = { chapter: 1, chapterName: "Prologue - Underpass", completed: true, completedAt: new Date().toISOString() };
    try {
      window.localStorage.setItem(SAVE_KEY, JSON.stringify(saveData));
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
    this.openingFade = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.88);
    this.titleCard = this.add.container(0, 0);
    const titleBg = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, 520, 220, 0x14091f, 0.97);
    titleBg.setStrokeStyle(3, 0xb6925f);
    this.titleChapter = this.add.text(GAME_WIDTH / 2, 215, "", { fontSize: "42px", fontStyle: "bold", color: "#f7ecd3" }).setOrigin(0.5);
    this.titleSubtitle = this.add.text(GAME_WIDTH / 2, 270, "", { fontSize: "28px", color: "#e8c98b" }).setOrigin(0.5);
    this.titleTag = this.add.text(GAME_WIDTH / 2, 315, "", { fontSize: "18px", color: "#d8c4f0" }).setOrigin(0.5);
    const titleContinueButton = this.add.rectangle(GAME_WIDTH / 2, 370, 190, 42, 0x1a0d2a);
    titleContinueButton.setStrokeStyle(2, 0xb6925f);
    titleContinueButton.setInteractive({ useHandCursor: true });
    titleContinueButton.on("pointerdown", () => this.advanceOpening());
    const titleContinueText = this.add.text(GAME_WIDTH / 2, 370, "Continue", { fontSize: "18px", fontStyle: "bold", color: "#f7ecd3" }).setOrigin(0.5);
    this.titleCard.add([titleBg, this.titleChapter, this.titleSubtitle, this.titleTag, titleContinueButton, titleContinueText]);

    this.dialogueCard = this.add.container(0, 0);
    const mainPanel = this.add.rectangle(480, 250, 860, 430, 0x12081d, 0.95);
    mainPanel.setStrokeStyle(3, 0xb6925f);
    const sceneFrame = this.add.rectangle(315, 175, 560, 315, 0x1e1030, 1);
    sceneFrame.setStrokeStyle(2, 0xe4d0a8);
    this.dialogueSceneImage = this.add.image(315, 175, "prologueScene");
    this.fitImageInBox(this.dialogueSceneImage, "prologueScene", 548, 308);
    this.dialogueSceneName = this.add.text(54, 30, "", { fontSize: "16px", color: "#e8c98b", fontStyle: "bold" });
    this.dialoguePortraitPanel = this.add.rectangle(720, 175, 180, 200, 0x1e1030, 1);
    this.dialoguePortraitPanel.setStrokeStyle(2, 0xe4d0a8);
    this.dialoguePortraitFrame = this.add.rectangle(720, 160, 120, 140, 0x24123a);
    this.dialoguePortraitFrame.setStrokeStyle(2, 0xe4d0a8);
    this.dialoguePortrait = this.add.image(720, 160, "edwinPortrait").setDisplaySize(110, 132);
    this.dialoguePortraitPlaceholder = this.add.text(720, 160, "NO\nART", { fontSize: "20px", color: "#94a3b8", align: "center" }).setOrigin(0.5);

    this.impactContainer = this.add.container(0, 0).setVisible(false);
    const impactShadow = this.add.rectangle(480, 175, 560, 190, 0x020617, 0.82);
    impactShadow.setStrokeStyle(2, 0x64748b);
    this.impactAttackerSlot = this.add.container(320, 175);
    this.impactAttackerFrame = this.add.rectangle(0, 0, 130, 150, 0x1f2937, 1);
    this.impactAttackerFrame.setStrokeStyle(2, 0x64748b);
    this.impactAttackerImage = this.add.image(0, -6, "edwinPortrait").setDisplaySize(112, 132);
    this.impactAttackerPlaceholder = this.add.text(0, -6, "NO\nART", { fontSize: "20px", color: "#94a3b8", align: "center" }).setOrigin(0.5);
    this.impactAttackerName = this.add.text(0, 86, "", { fontSize: "16px", fontStyle: "bold", color: "#f7ecd3" }).setOrigin(0.5);
    this.impactAttackerSlot.add([this.impactAttackerFrame, this.impactAttackerImage, this.impactAttackerPlaceholder, this.impactAttackerName]);
    this.impactDefenderSlot = this.add.container(640, 175);
    this.impactDefenderFrame = this.add.rectangle(0, 0, 130, 150, 0x1f2937, 1);
    this.impactDefenderFrame.setStrokeStyle(2, 0x64748b);
    this.impactDefenderImage = this.add.image(0, -6, "edwinPortrait").setDisplaySize(112, 132);
    this.impactDefenderPlaceholder = this.add.text(0, -6, "NO\nART", { fontSize: "20px", color: "#94a3b8", align: "center" }).setOrigin(0.5);
    this.impactDefenderName = this.add.text(0, 86, "", { fontSize: "16px", fontStyle: "bold", color: "#f7ecd3" }).setOrigin(0.5);
    this.impactDefenderSlot.add([this.impactDefenderFrame, this.impactDefenderImage, this.impactDefenderPlaceholder, this.impactDefenderName]);
    this.impactText = this.add.text(480, 175, "SMASH!", { fontSize: "28px", fontStyle: "bold", color: "#f8fafc", stroke: "#0f172a", strokeThickness: 6 }).setOrigin(0.5);
    this.impactContainer.add([impactShadow, this.impactAttackerSlot, this.impactDefenderSlot, this.impactText]);

    const textBox = this.add.rectangle(480, 395, 800, 120, 0x1a0d2a, 0.98);
    textBox.setStrokeStyle(2, 0xb6925f);
    this.dialogueSpeaker = this.add.text(90, 343, "", { fontSize: "24px", fontStyle: "bold", color: "#f7ecd3" });
    this.dialogueText = this.add.text(90, 378, "", { fontSize: "20px", color: "#eadff7", wordWrap: { width: 660 }, lineSpacing: 8 });
    this.openingBackButton = this.add.rectangle(700, 460, 118, 36, 0x1a0d2a);
    this.openingBackButton.setStrokeStyle(2, 0xb6925f);
    this.openingBackButton.setInteractive({ useHandCursor: true });
    this.openingBackButton.on("pointerdown", () => this.goOpeningBack());
    const backText = this.add.text(668, 449, "Back", { fontSize: "16px", fontStyle: "bold", color: "#f7ecd3" });
    this.openingNextButton = this.add.rectangle(820, 460, 118, 36, 0x1a0d2a);
    this.openingNextButton.setStrokeStyle(2, 0xb6925f);
    this.openingNextButton.setInteractive({ useHandCursor: true });
    this.openingNextButton.on("pointerdown", () => this.advanceOpening());
    this.openingNextLabel = this.add.text(785, 449, "Next", { fontSize: "16px", fontStyle: "bold", color: "#f7ecd3" });
    this.openingSkipButton = this.add.rectangle(810, 50, 118, 32, 0x1a0d2a);
    this.openingSkipButton.setStrokeStyle(2, 0xb6925f);
    this.openingSkipButton.setInteractive({ useHandCursor: true });
    this.openingSkipButton.on("pointerdown", () => this.skipOpening());
    const skipText = this.add.text(777, 40, "Skip", { fontSize: "14px", fontStyle: "bold", color: "#f7ecd3" });
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
    this.openingContainer.add([this.openingFade, this.titleCard, this.dialogueCard]);
    this.uiLayer.add(this.openingContainer);
  }

  setImpactPortrait(image, placeholder, nameText, name, portraitKey) {
    nameText.setText(name || "");
    if (portraitKey && this.textures.exists(portraitKey)) {
      image.setTexture(portraitKey).setVisible(true);
      placeholder.setVisible(false);
    } else {
      image.setVisible(false);
      placeholder.setVisible(true);
    }
  }

  playImpactBeat(line) {
    if (line.defender === "Kayley") this.startBattleMusic();
    this.setImpactPortrait(this.impactAttackerImage, this.impactAttackerPlaceholder, this.impactAttackerName, line.attacker, line.attackerPortrait);
    this.setImpactPortrait(this.impactDefenderImage, this.impactDefenderPlaceholder, this.impactDefenderName, line.defender, line.defenderPortrait);
    this.tweens.killTweensOf(this.impactAttackerSlot);
    this.tweens.killTweensOf(this.impactDefenderSlot);
    this.tweens.killTweensOf(this.impactText);
    this.impactAttackerSlot.x = 320;
    this.impactDefenderSlot.x = 640;
    this.impactText.setAlpha(0).setScale(0.7);
    this.impactDefenderFrame.setFillStyle(0x1f2937);
    this.impactAttackerFrame.setFillStyle(0x1f2937);
    if (this.impactDefenderImage.visible) this.impactDefenderImage.clearTint();
    if (this.impactAttackerImage.visible) this.impactAttackerImage.clearTint();
    this.tweens.add({
      targets: this.impactAttackerSlot,
      x: 390,
      duration: 120,
      ease: "Cubic.Out",
      onComplete: () => {
        this.impactText.setText(line.attacker === "Edwin" ? "SLASH!" : "SMASH!").setAlpha(1);
        this.tweens.add({ targets: this.impactText, scale: 1.15, alpha: 0, duration: 220, ease: "Quad.Out" });
        this.impactDefenderFrame.setFillStyle(0x7f1d1d);
        if (this.impactDefenderImage.visible) this.impactDefenderImage.setTintFill(0xff6666);
        this.tweens.add({
          targets: this.impactDefenderSlot,
          x: 675,
          duration: 40,
          yoyo: true,
          repeat: 3,
          onComplete: () => {
            this.impactDefenderSlot.x = 640;
            this.impactDefenderFrame.setFillStyle(0x1f2937);
            if (this.impactDefenderImage.visible) this.impactDefenderImage.clearTint();
          },
        });
        this.time.delayedCall(120, () => this.tweens.add({ targets: this.impactAttackerSlot, x: 320, duration: 120, ease: "Cubic.Out" }));
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
    if (this.textures.exists(sceneTextureKey)) this.fitImageInBox(this.dialogueSceneImage, sceneTextureKey, 548, 308);
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
        this.dialoguePortrait.setTexture(line.portrait).setDisplaySize(110, 132).setVisible(true);
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
    this.startPlayerPhase();
  }

  startBattleMusic() {
    const musicConfig = this.levelData?.battleMusic;
    if (!musicConfig?.key || this.battleMusicStarted) return;
    if (!this.cache.audio.exists(musicConfig.key)) {
      console.warn(`Battle music not found: ${musicConfig.path}`);
      return;
    }
    const playMusic = () => {
      if (this.battleMusic && this.battleMusic.isPlaying) return;
      this.battleMusic = this.sound.add(musicConfig.key, { loop: true, volume: musicConfig.volume ?? 0.45 });
      this.battleMusic.play();
      this.battleMusicStarted = true;
    };
    if (this.sound.locked) this.sound.once(Phaser.Sound.Events.UNLOCKED, playMusic);
    else playMusic();
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
    for (let row = 0; row < this.mapRows; row += 1) {
      for (let col = 0; col < this.mapCols; col += 1) {
        const type = this.getTerrainAt(col, row);
        const textureKey = this.getTerrainTextureKey(col, row);
        const x = this.boardX + col * TILE_SIZE;
        const y = this.boardY + row * TILE_SIZE;
        if (textureKey && this.textures.exists(textureKey)) {
          const tileImage = this.add.image(x + TILE_SIZE / 2, y + TILE_SIZE / 2, textureKey);
          tileImage.setDisplaySize(TILE_SIZE, TILE_SIZE);
          this.tileLayer.add(tileImage);
        } else {
          const tile = this.add.rectangle(x + TILE_SIZE / 2, y + TILE_SIZE / 2, TILE_SIZE - 2, TILE_SIZE - 2, tileColor(type));
          tile.setStrokeStyle(1, 0x111827);
          this.tileLayer.add(tile);
          const label = this.add.text(x + 6, y + 4, tileLabel(type), { fontSize: "12px", color: "#e5e7eb" });
          this.tileLayer.add(label);
        }
        const border = this.add.rectangle(x + TILE_SIZE / 2, y + TILE_SIZE / 2, TILE_SIZE, TILE_SIZE, 0x000000, 0);
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
    const label = this.add.text(0, -10, unit.team === "player" ? unit.name[0] : unit.boss ? "B" : "T", {
      fontSize: "16px",
      fontStyle: "bold",
      color: "#f7ecd3",
    }).setOrigin(0.5);
    const render = this.getUnitSpriteRenderConfig(unit);
    const shadow = this.add.ellipse(render.shadowX || 0, render.shadowY ?? 2, render.shadowWidth || TILE_SIZE * 0.42, render.shadowHeight || TILE_SIZE * 0.12, 0x000000, 0.34).setVisible(false);
    const image = this.add.image(0, 0, "__MISSING").setVisible(false);
    const hpText = this.add.text(0, render.hpY ?? TILE_SIZE * 0.22, "", {
      fontSize: "10px",
      color: "#e5e7eb",
      stroke: "#000000",
      strokeThickness: 3,
    }).setOrigin(0.5, 0);
    const container = this.add.container(0, 0, [marker, label, shadow, image, hpText]);
    return { container, marker, label, shadow, hpText, image };
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
    return { ...(UNIT_SPRITE_RENDER.default || {}), ...(unit ? UNIT_SPRITE_RENDER[unit.spriteSet] || UNIT_SPRITE_RENDER[unit.id] || {} : {}) };
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
    if (!sprite || !textureKey || !this.textures.exists(textureKey)) {
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
    if (source.width * scale > desiredMaxWidth) scale = desiredMaxWidth / Math.max(1, source.width);
    const isDeathFrame = state === "death";
    sprite.image.setTexture(textureKey);
    sprite.image.setScale(scale);
    sprite.image.setOrigin(render.originX ?? 0.5, isDeathFrame ? 0.5 : render.originY ?? 1);
    sprite.image.setPosition(render.offsetX || 0, isDeathFrame ? render.deathOffsetY ?? 0 : render.offsetY ?? 0);
    sprite.image.setVisible(true);
    sprite.image.clearTint();
    sprite.shadow.setPosition(render.shadowX || 0, render.shadowY ?? 2);
    sprite.shadow.setSize(render.shadowWidth || TILE_SIZE * 0.42, render.shadowHeight || TILE_SIZE * 0.12);
    sprite.shadow.setVisible(!isDeathFrame);
    sprite.marker.setVisible(false);
    sprite.label.setVisible(false);
    sprite.hpText.setPosition(0, render.hpY ?? TILE_SIZE * 0.22);
    return true;
  }

  showUnitFallbackSprite(unit) {
    const sprite = this.unitSprites[unit.id];
    if (!sprite) return;
    sprite.image.setVisible(false);
    sprite.shadow.setVisible(false);
    sprite.marker.setVisible(true);
    sprite.marker.setFillStyle(unit.color, 1);
    sprite.marker.setAlpha(1);
    sprite.label.setVisible(true);
    sprite.hpText.setPosition(0, 16);
  }

  setUnitSpriteFrame(unit, state = "idle", direction = null) {
    if (!unit) return false;
    const resolvedDirection = direction || unit.facing || "down";
    const entry = this.getIndividualSpriteEntry(unit, state, resolvedDirection, 0);
    unit.spriteState = state;
    if (entry?.key && this.textures.exists(entry.key)) return this.applyIndividualUnitSprite(unit, entry.key, state);
    this.showUnitFallbackSprite(unit);
    return false;
  }

  setUnitDeathFrame(unit, frameIndex = 0) {
    if (!unit) return false;
    unit.spriteState = "death";
    const entry = this.getIndividualSpriteEntry(unit, "death", unit.facing || "down", frameIndex);
    if (entry?.key && this.textures.exists(entry.key)) return this.applyIndividualUnitSprite(unit, entry.key, "death");
    this.showUnitFallbackSprite(unit);
    return false;
  }

  getAttackAnimationState(unit, weapon = null) {
    if (!unit) return "attack";
    if (weapon?.damageType === "magical") {
      const magicEntry = this.getIndividualSpriteEntry(unit, "magic", unit.facing || "down", 0);
      if (magicEntry?.key && this.textures.exists(magicEntry.key)) return "magic";
    }
    return "attack";
  }

  getDirectionFromDelta(dx, dy, fallback = "down") {
    if (Math.abs(dx) > Math.abs(dy)) return dx > 0 ? "right" : "left";
    if (Math.abs(dy) > 0) return dy > 0 ? "down" : "up";
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
        if (unit.hp > 0) this.setUnitSpriteFrame(unit, "idle", unit.facing || "down");
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
    const spriteSet = this.getIndividualSpriteSet(unit);
    const deathFrames = spriteSet?.death || [];
    const hasDeathSprite = deathFrames.some((entry) => entry?.key && this.textures.exists(entry.key));
    if (!hasDeathSprite) {
      this.tweens.add({ targets: sprite.container, alpha: 0, duration: 700, ease: "Quad.Out", onComplete });
      return;
    }
    sprite.container.setScale(1);
    sprite.container.alpha = 1;
    deathFrames.forEach((_, index) => {
      this.time.delayedCall(index * 180, () => this.setUnitDeathFrame(unit, index));
    });
    this.time.delayedCall(deathFrames.length * 180 + 80, () => {
      this.tweens.add({ targets: sprite.container, alpha: 0, duration: 650, ease: "Quad.Out", onComplete });
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

  closeActionMenu() {
    if (this.actionMenuContainer) this.actionMenuContainer.destroy();
    this.actionMenuContainer = null;
    this.actionMenuOpen = false;
    this.actionMenuUnitId = null;
  }

  showActionMenu(unit, message = null) {
    if (!unit || unit.team !== "player" || unit.acted || unit.hp <= 0) return;
    this.closeActionMenu();
    this.selectedUnitId = unit.id;
    this.moveTiles = [];
    this.targetTiles = [];
    this.redrawSelection();
    this.updateSelectedPanel();
    const centerX = this.boardX + unit.x * TILE_SIZE + TILE_SIZE / 2;
    const centerY = this.boardY + unit.y * TILE_SIZE + TILE_SIZE / 2;
    const menuWidth = 152;
    const menuHeight = 208;
    const x = Phaser.Math.Clamp(centerX + TILE_SIZE * 0.95, menuWidth / 2 + 8, GAME_WIDTH - menuWidth / 2 - 8);
    const y = Phaser.Math.Clamp(centerY - 8, menuHeight / 2 + 8, GAME_HEIGHT - menuHeight / 2 - 8);
    const container = this.add.container(x, y).setDepth(9998);
    const panel = createBannerPanel(this, 0, 0, menuWidth, menuHeight, { innerInset: 12 });
    const title = this.add.text(0, -78, unit.name, { fontSize: "16px", fontStyle: "bold", color: "#f7ecd3", stroke: "#0b0811", strokeThickness: 3 }).setOrigin(0.5);
    container.add([panel.container, title]);
    const actions = [
      { label: "Attack", handler: () => this.chooseActionAttack(unit.id) },
      { label: "Skill", handler: () => this.chooseActionSkill(unit.id) },
      { label: "Item", handler: () => this.chooseActionItem(unit.id) },
      { label: "Wait", handler: () => this.waitUnit(unit.id) },
    ];
    actions.forEach((action, index) => {
      const button = createBannerButton(this, 0, -38 + index * 40, menuWidth - 20, 32, action.label, () => action.handler(), "16px");
      container.add(button.container);
    });
    this.actionMenuContainer = container;
    this.actionMenuOpen = true;
    this.actionMenuUnitId = unit.id;
    this.uiLayer.add(container);
    this.helpText.setText(message || `${unit.name} is ready. Choose an action.`);
  }

  chooseActionAttack(unitId) {
    const unit = this.units.find((u) => u.id === unitId);
    if (!unit || unit.team !== "player" || unit.acted) return;
    const targets = this.attackableEnemies(unit);
    if (targets.length === 0) {
      this.helpText.setText("No enemies in range. Choose another action.");
      return;
    }
    this.closeActionMenu();
    this.selectedUnitId = unit.id;
    this.moveTiles = [];
    this.targetTiles = targets;
    this.redrawSelection();
    this.updateSelectedPanel();
    this.helpText.setText(`Choose an enemy for ${unit.name} to attack.`);
  }

  chooseActionSkill(unitId) {
    const unit = this.units.find((u) => u.id === unitId);
    if (!unit || unit.team !== "player" || unit.acted) return;
    const skill = (unit.skills || [])[0];
    if (!skill) {
      this.helpText.setText(`${unit.name} has no skills yet. Choose another action.`);
      return;
    }
    if (!this.canUseSkill(unit, skill)) {
      this.helpText.setText(`${skill.name} needs ${skill.cost} Sigil Points.`);
      return;
    }
    const targets = this.getSkillTargetsAt(unit, skill, unit.x, unit.y);
    if (targets.length === 0) {
      this.helpText.setText(`No units are in range for ${skill.name}. Choose another action.`);
      return;
    }
    this.useSkill(unit.id, skill.id, { endTurn: true });
  }

  getSkillById(unit, skillId) {
    return (unit?.skills || []).find((skill) => skill.id === skillId) || null;
  }

  canUseSkill(unit, skill) {
    if (!unit || !skill) return false;
    return (unit.sigilPoints ?? 0) >= (skill.cost ?? 0);
  }

  getSkillTargetsAt(unit, skill, x = unit.x, y = unit.y) {
    if (!unit || !skill) return [];
    if (skill.type === "adjacentSquare") {
      return this.units.filter((other) => {
        if (!other || other.id === unit.id || other.hp <= 0) return false;
        const dx = Math.abs(other.x - x);
        const dy = Math.abs(other.y - y);
        return dx <= 1 && dy <= 1;
      });
    }
    return [];
  }

  calculateSkillDamage(unit, target, skill) {
    if (!unit || !skill) return 0;
    if (skill.damageFormula === "mag") return Math.max(0, unit.mag || 0);
    if (skill.damageFormula === "strPlusSpd") return Math.max(0, (unit.str || 0) + (unit.spd || 0));
    return Math.max(0, skill.baseDamage || 0);
  }

  useSkill(unitId, skillId, options = {}) {
    const unit = this.units.find((u) => u.id === unitId);
    const skill = this.getSkillById(unit, skillId);
    if (!unit || !skill || unit.hp <= 0 || !this.canUseSkill(unit, skill)) return false;
    const targets = this.getSkillTargetsAt(unit, skill, unit.x, unit.y);
    if (targets.length === 0) return false;
    this.closeActionMenu();
    this.busy = true;
    this.selectedUnitId = unit.id;
    this.moveTiles = [];
    this.targetTiles = [];
    this.redrawSelection();
    this.updateSelectedPanel();
    unit.sigilPoints = Math.max(0, (unit.sigilPoints ?? 0) - (skill.cost ?? 0));
    this.refreshUnitSprite(unit);
    this.updateSelectedPanel();
    this.showSkillBanner(skill.name);
    this.helpText.setText(`${unit.name} uses ${skill.name}!`);
    this.playUnitState(unit, skill.animationState || "attack", SKILL_IMPACT_DELAY + 450);
    const targetResults = targets.map((target) => ({ target, wasAlive: target.hp > 0, damage: this.calculateSkillDamage(unit, target, skill) }));
    this.time.delayedCall(SKILL_IMPACT_DELAY, () => {
      let totalXp = 0;
      let defeatedFalan = false;
      let defeatedEdwin = false;
      targetResults.forEach((entry, index) => {
        const target = entry.target;
        if (!target || target.hp <= 0) return;
        target.hp = Math.max(0, target.hp - entry.damage);
        this.showCombatResultText(target, { hit: true, critical: false, damage: entry.damage }, index);
        this.time.delayedCall(index * 120, () => this.playUnitHurt(target, 360));
        const didKill = entry.wasAlive && target.hp <= 0;
        if (didKill) {
          if (target.id === "falan") defeatedFalan = true;
          if (target.id === "edwin") defeatedEdwin = true;
          if (unit.team === "player" && target.team === "enemy") totalXp += this.calculateXpGain(unit, target, true);
        }
      });
      if (totalXp > 0) this.awardXp(unit, totalXp);
      targetResults.forEach((entry) => {
        const target = entry.target;
        if (!target) return;
        if (target.hp <= 0) {
          if (target.id === "falan") {
            target.hp = 0;
            this.refreshUnitSprite(target);
          } else {
            this.playUnitDeath(target, () => this.removeUnitSpriteAndData(target.id));
          }
        } else {
          this.refreshUnitSprite(target);
          this.setUnitSpriteFrame(target, "idle", target.facing || "down");
        }
      });
      if (options.endTurn !== false) {
        unit.acted = true;
        this.refreshUnitSprite(unit);
      }
      this.updateSelectedPanel();
      const finishDelay = 760 + targetResults.length * 120;
      this.time.delayedCall(finishDelay, () => {
        if (defeatedEdwin) {
          this.stopBattleMusic();
          this.phaseText.setText("Defeat");
          this.phaseText.setColor("#f87171");
          this.helpText.setText("Defeat! Edwin has fallen.");
          this.busy = false;
          return;
        }
        if (defeatedFalan) {
          this.busy = false;
          this.startPostBattleScene();
          return;
        }
        this.busy = false;
        if (typeof options.onComplete === "function") {
          options.onComplete();
          return;
        }
        this.clearSelection(`${unit.name} used ${skill.name}.`);
        this.checkEndOfPlayerPhase();
      });
    });
    return true;
  }

  chooseActionItem(unitId) {
    const unit = this.units.find((u) => u.id === unitId);
    if (!unit || unit.team !== "player" || unit.acted) return;
    this.helpText.setText("Items will be added later. Choose another action.");
  }

  waitUnit(unitId) {
    const unit = this.units.find((u) => u.id === unitId);
    if (!unit || unit.team !== "player" || unit.acted) return;
    this.closeActionMenu();
    unit.acted = true;
    this.refreshUnitSprite(unit);
    this.clearSelection(`${unit.name} waits.`);
    this.checkEndOfPlayerPhase();
  }

  setupInput() {
    this.input.on("pointerdown", (pointer) => {
      if (this.phase !== "player" || this.busy || this.previewOpen || this.actionMenuOpen || this.levelUpAllocationOpen) return;
      const tile = this.pointerToTile(pointer.x, pointer.y);
      if (!tile) return;
      const clickedUnit = this.getUnitAt(tile.x, tile.y);
      const selectedUnit = this.getSelectedUnit();
      if (clickedUnit && selectedUnit && clickedUnit.id === selectedUnit.id && selectedUnit.team === "player" && !selectedUnit.acted) {
        this.showActionMenu(selectedUnit, `${selectedUnit.name} holds position. Choose an action.`);
        return;
      }
      if (clickedUnit && clickedUnit.team === "player" && !clickedUnit.acted) {
        this.closeActionMenu();
        this.selectedUnitId = clickedUnit.id;
        this.moveTiles = this.reachableTiles(clickedUnit);
        this.targetTiles = [];
        this.redrawSelection();
        this.updateSelectedPanel();
        this.helpText.setText(`Selected ${clickedUnit.name}. Choose a tile to move to, or click them again to act here.`);
        return;
      }
      if (selectedUnit && clickedUnit && clickedUnit.team === "enemy" && this.isTargetTile(clickedUnit.x, clickedUnit.y)) {
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
      if (!clickedUnit && selectedUnit && selectedUnit.team === "player" && this.isMoveTile(tile.x, tile.y)) {
        this.moveUnit(selectedUnit.id, tile.x, tile.y);
        return;
      }
      this.clearSelection();
    });
  }

  pointerToTile(pointerX, pointerY) {
    const localX = pointerX - this.boardX;
    const localY = pointerY - this.boardY;
    if (localX < 0 || localY < 0 || localX >= this.boardWidth || localY >= this.boardHeight) return null;
    return { x: Math.floor(localX / TILE_SIZE), y: Math.floor(localY / TILE_SIZE) };
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
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
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
    return this.units.filter((other) => other.team !== unit.team && other.hp > 0 && canAttack(unit, other));
  }

  isMoveTile(x, y) {
    return (this.moveTiles || []).some((tile) => typeof tile === "string" ? tile === tileKey(x, y) : tile.x === x && tile.y === y);
  }

  isTargetTile(x, y) {
    return this.targetTiles.some((unit) => unit.x === x && unit.y === y);
  }

  openPreview(attacker, defender) {
    this.closeActionMenu();
    const attackerWeapon = getWeaponForTarget(attacker, defender);
    const defenderWeapon = getWeaponForTarget(defender, attacker) || getDefaultWeapon(defender);
    if (!attackerWeapon) return;
    const attackerDamage = this.calculateDamage(attacker, defender, attackerWeapon);
    const attackerHits = this.calculateAttackCount(attacker, defender, attackerWeapon);
    const attackerSpeed = this.getEffectiveSpeed(attacker, attackerWeapon);
    const attackerHitRate = attackerWeapon.hitRate ?? 100;
    const attackerCrit = this.calculateCriticalChance(attacker, defender);
    const defenderDamage = defenderWeapon ? this.calculateDamage(defender, attacker, defenderWeapon) : 0;
    const defenderHits = defenderWeapon ? this.calculateAttackCount(defender, attacker, defenderWeapon) : 0;
    const defenderSpeed = defenderWeapon ? this.getEffectiveSpeed(defender, defenderWeapon) : defender.spd;
    const defenderHitRate = defenderWeapon?.hitRate ?? 100;
    const defenderCrit = defenderWeapon ? this.calculateCriticalChance(defender, attacker) : 0;
    this.previewData = { attackerId: attacker.id, defenderId: defender.id };
    this.previewLeftName.setText(`${attacker.name} - ${attackerWeapon.name}`);
    this.previewLeftStats.setText(`HP ${attacker.hp}/${attacker.maxHp}\nDMG ${attackerDamage} x${attackerHits}\nCRIT ${attackerCrit}%\nHIT ${attackerHitRate}%\nSPD ${attackerSpeed}\nRNG ${getWeaponRangeLabel(attackerWeapon)}`);
    this.previewRightName.setText(`${defender.name} - ${defenderWeapon?.name || "None"}`);
    this.previewRightStats.setText(`HP ${defender.hp}/${defender.maxHp}\nDMG ${defenderDamage} x${defenderHits}\nCRIT ${defenderCrit}%\nHIT ${defenderHitRate}%\nSPD ${defenderSpeed}\nRNG ${getWeaponRangeLabel(defenderWeapon)}`);
    this.previewOpen = true;
    this.previewContainer.setVisible(true);
    this.helpText.setText("Confirm or cancel the attack. Critical hits deal triple damage.");
  }

  closePreview() {
    this.previewOpen = false;
    this.previewData = null;
    this.previewContainer.setVisible(false);
    const unit = this.getSelectedUnit();
    if (unit && unit.team === "player" && !unit.acted) {
      this.targetTiles = [];
      this.redrawSelection();
      this.showActionMenu(unit, "Attack cancelled. Choose another action.");
      return;
    }
    this.helpText.setText("Attack cancelled.");
  }

  confirmPreviewAttack() {
    if (!this.previewData) return;
    this.closeActionMenu();
    const { attackerId, defenderId } = this.previewData;
    this.previewOpen = false;
    this.previewData = null;
    this.previewContainer.setVisible(false);
    this.attackEnemy(attackerId, defenderId);
  }

  moveUnit(unitId, x, y) {
    const unit = this.units.find((u) => u.id === unitId);
    const sprite = this.unitSprites[unitId];
    if (!unit || !sprite || unit.team !== "player" || unit.acted) return;
    this.closeActionMenu();
    this.busy = true;
    const oldX = unit.x;
    const oldY = unit.y;
    unit.facing = this.getDirectionFromDelta(x - oldX, y - oldY, unit.facing || "down");
    this.playUnitState(unit, "move", PLAYER_MOVE_DURATION + PLAYER_ACTION_PAUSE);
    unit.x = x;
    unit.y = y;
    const targetX = this.boardX + x * TILE_SIZE + TILE_SIZE / 2;
    const targetY = this.boardY + y * TILE_SIZE + TILE_SIZE / 2;
    this.tweens.add({
      targets: sprite.container,
      x: targetX,
      y: targetY,
      duration: PLAYER_MOVE_DURATION,
      ease: "Sine.easeInOut",
      onComplete: () => {
        this.setUnitSpriteFrame(unit, "idle", unit.facing || "down");
        this.moveTiles = [];
        this.targetTiles = [];
        this.redrawSelection();
        this.updateSelectedPanel();
        this.time.delayedCall(PLAYER_ACTION_PAUSE, () => {
          this.busy = false;
          this.showActionMenu(unit);
        });
      },
    });
  }

  attackEnemy(attackerId, defenderId) {
    const attacker = this.units.find((u) => u.id === attackerId);
    const defender = this.units.find((u) => u.id === defenderId);
    if (!attacker || !defender) return;
    const weapon = getWeaponForTarget(attacker, defender);
    if (!weapon) return;
    this.closeActionMenu();
    this.busy = true;
    this.faceUnitToward(attacker, defender);
    this.faceUnitToward(defender, attacker);
    this.playUnitState(attacker, this.getAttackAnimationState(attacker, weapon), 420);
    const defenderWasAlive = defender.hp > 0;
    const sequence = this.resolveAttackSequence(attacker, defender, weapon);
    sequence.results.forEach((result, index) => {
      this.showCombatResultText(defender, result, index);
      if (result.hit) this.time.delayedCall(index * 140, () => this.playUnitHurt(defender));
    });
    const didKill = defenderWasAlive && defender.hp <= 0;
    const defeatedFalan = didKill && defender.id === "falan";
    const xpGain = this.calculateXpGain(attacker, defender, didKill);
    if (xpGain > 0) this.awardXp(attacker, xpGain);
    attacker.acted = true;
    this.refreshUnitSprite(attacker);
    if (defender.hp <= 0) {
      defender.hp = 0;
      if (defeatedFalan) {
        this.refreshUnitSprite(defender);
        this.playUnitHurt(defender);
        this.clearSelection(`${attacker.name} defeated ${defender.name}!`);
      } else {
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
    this.closeActionMenu();
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
      const overlay = this.add.rectangle(x + TILE_SIZE / 2, y + TILE_SIZE / 2, TILE_SIZE - 10, TILE_SIZE - 10, 0x38bdf8, 0.35);
      overlay.setStrokeStyle(2, 0x7dd3fc, 0.95);
      this.overlayLayer.add(overlay);
    }
    for (const unit of this.targetTiles) {
      const x = this.boardX + unit.x * TILE_SIZE;
      const y = this.boardY + unit.y * TILE_SIZE;
      const overlay = this.add.rectangle(x + TILE_SIZE / 2, y + TILE_SIZE / 2, TILE_SIZE - 10, TILE_SIZE - 10, 0xef4444, 0.35);
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
      this.hpBarText.setText("");
      this.hpBarFill.displayWidth = 0;
      this.levelXpText.setText("");
      this.xpBarFill.displayWidth = 0;
      this.sigilText.setText("Sigil");
      this.sigilOrbs.forEach((orb) => orb.setFillStyle(0x2e1065, 0.35));
      this.unitStatsText.setText("");
      this.weaponText.setText("Select Edwin or Leon. Luck now affects crit chance and level-up point rolls.");
      return;
    }
    if (unit.portraitKey && this.textures.exists(unit.portraitKey)) {
      this.portraitImage.setTexture(unit.portraitKey).setDisplaySize(96, 120).setVisible(true);
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
    const terrainLabel = terrain ? terrain.charAt(0).toUpperCase() + terrain.slice(1) : "Terrain";
    const defLine = terrainBonus > 0 ? `DEF ${unit.def} +${terrainBonus} ${terrainLabel}` : `DEF ${unit.def}`;
    const spdLine = weaponSpeedBonus > 0 ? `SPD ${unit.spd} +${weaponSpeedBonus} ${weapon.name}` : `SPD ${unit.spd}`;
    this.unitNameText.setText(unit.name);
    this.unitClassText.setText(`${unit.team === "enemy" ? "Enemy" : "Player"} • ${unit.title} • ${unit.className}`);
    const currentHp = Math.max(0, unit.hp || 0);
    const maxHp = Math.max(1, unit.maxHp || 1);
    this.hpBarText.setText(`HP ${currentHp}/${maxHp}`);
    this.hpBarFill.displayWidth = (this.sidePanelBarWidth || 200) * Phaser.Math.Clamp(currentHp / maxHp, 0, 1);
    this.levelXpText.setText(`Lv ${level} XP ${xp}/100`);
    this.xpBarFill.displayWidth = (this.sidePanelBarWidth || 200) * Phaser.Math.Clamp(xp / 100, 0, 1);
    const sigilPoints = Phaser.Math.Clamp(unit.sigilPoints ?? 0, 0, unit.maxSigilPoints ?? 3);
    const maxSigilPoints = unit.maxSigilPoints ?? 3;
    this.sigilText.setText(`Sigil ${sigilPoints}/${maxSigilPoints}`);
    this.sigilOrbs.forEach((orb, index) => {
      const active = index < sigilPoints;
      orb.setFillStyle(active ? 0x8b5cf6 : 0x2e1065, active ? 1 : 0.35);
      orb.setStrokeStyle(2, active ? 0xddd6fe : 0x6d28d9);
    });
    this.unitStatsText.setText(`HP ${unit.hp}/${unit.maxHp}\nSTR ${unit.str}\nMAG ${unit.mag}\n${defLine}\nRES ${unit.res}\n${spdLine}\nLUCK ${unit.luck || 0}\nMOV ${unit.move}`);
    this.weaponText.setText(
      weapon
        ? `Weapon: ${weapon.name} | Base ${weapon.baseDamage ?? weapon.damage ?? 0} | ${weapon.damageType || "physical"} | Hit ${weapon.hitRate ?? 100}% | Range ${getWeaponRangeLabel(weapon)}\nCrit: Luck difference %. Critical hits deal x3 damage.`
        : "Weapon: None"
    );
  }

  checkEndOfPlayerPhase() {
    const remaining = this.units.filter((u) => u.team === "player" && !u.acted && u.hp > 0);
    if (remaining.length === 0) this.startEnemyPhase();
  }

  startEnemyPhase() {
    this.closeActionMenu();
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
    if (!enemy || enemy.hp <= 0) {
      this.enemyIndex += 1;
      this.runNextEnemy();
      return;
    }
    this.selectedUnitId = enemy.id;
    this.updateSelectedPanel();
    this.helpText.setText(`${enemy.name} is acting...`);
    const plan = this.chooseEnemyPlan(enemy);
    if (!plan) {
      this.enemyIndex += 1;
      this.time.delayedCall(ENEMY_ACTION_PAUSE, () => this.runNextEnemy());
      return;
    }
    const afterMove = () => {
      if (plan.action) this.time.delayedCall(ENEMY_ACTION_PAUSE, () => this.executeEnemyAction(enemy, plan.action));
      else {
        this.enemyIndex += 1;
        this.time.delayedCall(ENEMY_ACTION_PAUSE, () => this.runNextEnemy());
      }
    };
    if (!plan.move || (plan.move.x === enemy.x && plan.move.y === enemy.y)) {
      afterMove();
      return;
    }
    this.moveEnemyTo(enemy, plan.move, afterMove);
  }

  executeEnemyAction(enemy, action) {
    if (!enemy || enemy.hp <= 0 || !action) {
      this.enemyIndex += 1;
      this.time.delayedCall(ENEMY_ACTION_PAUSE, () => this.runNextEnemy());
      return;
    }
    if (action.type === "skill") {
      this.useSkill(enemy.id, action.skill.id, { endTurn: false, onComplete: () => {
        this.enemyIndex += 1;
        this.time.delayedCall(ENEMY_ACTION_PAUSE, () => this.runNextEnemy());
      } });
      return;
    }
    if (action.type === "attack" && action.target) {
      this.enemyAttack(enemy, action.target);
      return;
    }
    this.enemyIndex += 1;
    this.time.delayedCall(ENEMY_ACTION_PAUSE, () => this.runNextEnemy());
  }

  moveEnemyTo(enemy, moveTarget, onComplete) {
    const sprite = this.unitSprites[enemy.id];
    if (!enemy || !sprite || !moveTarget) {
      if (typeof onComplete === "function") onComplete();
      return;
    }
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
        if (typeof onComplete === "function") onComplete();
      },
    });
  }

  getLivingOpponents(unit) {
    return this.units.filter((other) => other.team !== unit.team && other.hp > 0);
  }

  getNearestOpponent(unit) {
    const opponents = this.getLivingOpponents(unit);
    if (!opponents.length) return null;
    return opponents.reduce((best, opponent) => distance(unit, opponent) < distance(unit, best) ? opponent : best, opponents[0]);
  }

  getWeaponForPosition(attacker, defender, x, y) {
    if (!attacker || !defender || !attacker.weapons) return null;
    const dist = Math.abs(x - defender.x) + Math.abs(y - defender.y);
    return attacker.weapons.find((weapon) => {
      const minRange = weapon.minRange ?? weapon.range;
      const maxRange = weapon.maxRange ?? weapon.range;
      return dist >= minRange && dist <= maxRange;
    }) || null;
  }

  calculateAttackScoreAt(attacker, defender, weapon) {
    if (!attacker || !defender || !weapon) return null;
    const damagePerHit = this.calculateDamage(attacker, defender, weapon);
    const attackCount = this.calculateAttackCount(attacker, defender, weapon);
    const critChance = this.calculateCriticalChance(attacker, defender);
    const expectedDamagePerHit = damagePerHit * (1 + critChance / 100 * 2);
    const totalDamage = damagePerHit * attackCount;
    const expectedDamage = expectedDamagePerHit * attackCount * ((weapon.hitRate ?? 100) / 100);
    const canKill = totalDamage >= defender.hp || expectedDamage >= defender.hp;
    return { canKill, totalDamage, expectedDamage, score: (canKill ? 100000 : 0) + expectedDamage * 100 + totalDamage };
  }

  evaluateEnemyActionAt(enemy, x, y) {
    const opponents = this.getLivingOpponents(enemy);
    const actions = [];
    (enemy.skills || []).forEach((skill) => {
      if (!this.canUseSkill(enemy, skill)) return;
      const allTargets = this.getSkillTargetsAt(enemy, skill, x, y);
      const opponentTargets = allTargets.filter((target) => target.team !== enemy.team);
      if (opponentTargets.length === 0) return;
      let totalDamage = 0;
      let canKill = false;
      opponentTargets.forEach((target) => {
        const damage = this.calculateSkillDamage(enemy, target, skill);
        totalDamage += damage;
        if (damage >= target.hp) canKill = true;
      });
      actions.push({ type: "skill", skill, targets: opponentTargets, canKill, totalDamage, expectedDamage: totalDamage, score: (canKill ? 120000 : 0) + totalDamage * 115 + opponentTargets.length * 10 });
    });
    opponents.forEach((target) => {
      const weapon = this.getWeaponForPosition(enemy, target, x, y);
      if (!weapon) return;
      const attackScore = this.calculateAttackScoreAt(enemy, target, weapon);
      if (!attackScore || attackScore.totalDamage <= 0) return;
      actions.push({ type: "attack", target, weapon, ...attackScore });
    });
    if (actions.length === 0) return null;
    actions.sort((a, b) => {
      if (a.canKill !== b.canKill) return a.canKill ? -1 : 1;
      if (b.score !== a.score) return b.score - a.score;
      const aDistance = a.target ? distance(enemy, a.target) : 0;
      const bDistance = b.target ? distance(enemy, b.target) : 0;
      return aDistance - bDistance;
    });
    return actions[0];
  }

  chooseEnemyPlan(enemy) {
    const options = [{ x: enemy.x, y: enemy.y }, ...this.reachableTiles(enemy)];
    const nearest = this.getNearestOpponent(enemy);
    let bestPlan = null;
    options.forEach((option) => {
      const action = this.evaluateEnemyActionAt(enemy, option.x, option.y);
      const moveDistance = Math.abs(option.x - enemy.x) + Math.abs(option.y - enemy.y);
      const approachScore = nearest ? -1 * (Math.abs(option.x - nearest.x) + Math.abs(option.y - nearest.y)) : 0;
      const actionScore = action ? action.score : -100000;
      const score = actionScore + approachScore - moveDistance * 3;
      if (!bestPlan || score > bestPlan.score) bestPlan = { move: option, action, score };
    });
    if (bestPlan?.action) return bestPlan;
    if (!nearest) return null;
    const move = this.chooseEnemyMoveToward(enemy, nearest);
    if (!move) return null;
    const enRouteAction = this.evaluateEnemyActionAt(enemy, move.x, move.y);
    return { move, action: enRouteAction, score: bestPlan?.score || 0 };
  }

  chooseEnemyMoveToward(enemy, target) {
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
    const weapon = getWeaponForTarget(attacker, defender);
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
      this.time.delayedCall(index * 220, () => this.showCombatResultText(defender, result, 0));
      if (result.hit) this.time.delayedCall(index * 220, () => this.playUnitHurt(defender, 420));
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
    this.phaseText.setColor("#c4b5fd");
    this.setObjectiveDisplayVisible(true);
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
  scene: [TitleScene, MainMenuScene, LoadingScene, BattleScene],
};

new Phaser.Game(config);


