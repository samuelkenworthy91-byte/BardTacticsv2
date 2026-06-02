import { STEAL_SKILL } from "../config/constants.js";
import { CHAPTER_ONE_UNITS } from "./chapter1.js";
import { CHAPTER_TWO_ALLY_UNITS } from "./chapter2.js";

export const CHAPTER_THREE_GAIDEN_ID = "chapter3Gaiden";
export const CHAPTER_THREE_GAIDEN_DISPLAY_NAME = "Chapter 3: Gaiden";
export const CHAPTER_THREE_GAIDEN_OBJECTIVE = "Take the supplies you can before it is too late.";
export const CHAPTER_THREE_GAIDEN_TITLE = { chapter: "Chapter 3", subtitle: "Gaiden" };
export const CHAPTER_THREE_GAIDEN_BOSS_ID = "harold";

export const CHAPTER_THREE_GAIDEN_MAP = [
  ["floor", "floor", "floor", "floor", "bayDoor", "floor", "floor", "floor", "floor", "floor"],
  ["container", "spill", "catwalk", "spill", "catwalk", "floor", "spill", "catwalk", "machinery", "container"],
  ["floor", "crates", "conveyorLeft", "conveyorLeft", "conveyorLeft", "conveyorLeft", "crates", "conveyorLeft", "floor", "floor"],
  ["container", "floor", "floor", "floor", "floor", "floor", "floor", "floor", "floor", "container"],
  ["floor", "conveyorRight", "conveyorRight", "conveyorRight", "conveyorRight", "conveyorRight", "conveyorRight", "conveyorRight", "conveyorRight", "floor"],
  ["container", "spill", "crates", "floor", "floor", "floor", "floor", "crates", "spill", "container"],
  ["floor", "floor", "floor", "floor", "floor", "floor", "floor", "floor", "crates", "floor"],
  ["floor", "floor", "floor", "floor", "floor", "bayDoor", "floor", "floor", "floor", "floor"],
];

export const CHAPTER_THREE_GAIDEN_ITEMS = [
  {
    id: "greggsSausageRoll",
    name: "Greggs Sausage Roll",
    type: "consumable",
    category: "food",
    heal: 8,
    uses: 1,
    targetType: "selfOrAdjacentAlly",
    description: "A warm, flaky snack. Restores 8 HP to the user or an adjacent ally.",
  },
  {
    id: "mysteriousEgg",
    name: "Mysterious Egg",
    type: "special",
    eggTracker: true,
    description: "A strange egg marked with a clock-like symbol. It may hatch after several chapters.",
  },
  {
    id: "tomeOfTerra",
    name: "Tome of Terra",
    type: "special",
    ownerHint: "leon",
    uses: 1,
    targetType: "self",
    leonOnlySkill: true,
    learnSkill: "fieldOfThorns",
    description: "Only Leon can use this tome to learn Field of Thorns.",
  },
  {
    id: "fightMilk",
    name: "Fight Milk",
    type: "consumable",
    uses: 1,
    targetType: "self",
    strengthBoost: 2,
    description: "A questionable drink. Raises Strength by 2 when consumed.",
  },
  {
    id: "skateboard",
    name: "Skateboard",
    type: "passive",
    passiveMoveBonus: 2,
    description: "Increases Movement by 2 while carried.",
  },
  {
    id: "tranqBomb",
    name: "Tranq Bomb",
    type: "throwable",
    uses: 1,
    targetType: "enemyInStrengthRange",
    tranqTurns: 3,
    description: "Throw up to STR range to knock an enemy unconscious for 3 turns or until damaged.",
  },
];

export const CHAPTER_THREE_GAIDEN_CHESTS = [
  { x: 0, y: 1, itemId: "greggsSausageRoll" },
  { x: 9, y: 1, itemId: "mysteriousEgg" },
  { x: 0, y: 3, itemId: "tomeOfTerra" },
  { x: 9, y: 3, itemId: "fightMilk" },
  { x: 0, y: 5, itemId: "skateboard" },
  { x: 9, y: 5, itemId: "tranqBomb" },
];

export const DIRK_ITEM = {
  id: "dirk",
  name: "Dirk",
  type: "passive",
  passiveDefensePierce: 2,
  description: "Attacks by the holder ignore 2 Defense while carried.",
};

export const CHAPTER_THREE_GAIDEN_OPENING = [
  {
    type: "title",
    chapter: CHAPTER_THREE_GAIDEN_TITLE.chapter,
    subtitle: CHAPTER_THREE_GAIDEN_TITLE.subtitle,
    tag: "",
  },
  {
    type: "scene",
    sceneName: "Unmarked Road",
    background: "chapter3TipenWhippetMainRoadScene",
    lines: [
      {
        speaker: "Leon",
        portrait: "leonPortrait",
        text: "Really?  How rich is this Caleb guy? He's built a freakin' military grade supply bunker on the outskirts of a sleepy village and NO ONE knew? Bagsy not going down the ladder first.",
      },
    ],
  },
];

export const CHAPTER_THREE_GAIDEN_BATTLE_START_DIALOGUE = [
  {
    speaker: "Harold",
    portrait: "haroldPortrait",
    text: "Damned cowards, guess I'm in charge now all the important people have run away from these...kids. BOYS GRAB WHAT YOU CAN AND WE'LL REGROUP ELSEWHERE!",
  },
];

export const CHAPTER_THREE_GAIDEN_MARNIE_ENTRANCE_DIALOGUE = {
  speaker: "Marnie",
  portrait: "marniePortrait",
  text: "Glad I was watching this place. Time to make a pretty penny.",
};

export const CHAPTER_THREE_GAIDEN_POST_BATTLE_SCENE = [
  {
    type: "mapDialogue",
    speaker: "Heath",
    portrait: "heathPortrait",
    text: "We best get back to the farm.",
  },
  { type: "savePrompt", title: "Chapter 3: Gaiden Complete", text: "Save game?" },
];

function cloneUnit(unit, placement) {
  if (!unit) return null;
  return {
    ...unit,
    ...placement,
    team: "player",
    acted: false,
    spriteState: "idle",
    hp: unit.maxHp || unit.hp || 1,
    sigilPoints: unit.maxSigilPoints ?? unit.sigilPoints ?? 3,
    weapons: (unit.weapons || []).map((weapon) => ({ ...weapon })),
    skills: (unit.skills || []).map((skill) => ({ ...skill })),
    items: (unit.items || []).map((item) => ({ ...item })),
  };
}

const leon = CHAPTER_ONE_UNITS.find((unit) => unit.id === "leon");
const izzy = CHAPTER_TWO_ALLY_UNITS.find((unit) => unit.id === "izzy");
const kane = CHAPTER_TWO_ALLY_UNITS.find((unit) => unit.id === "kane");

const SWORD_THUG_VARIANTS = [
  { level: 6, hp: 21, maxHp: 21, str: 8, def: 4, res: 2, spd: 6, luck: 3, weaponName: "Factory Sword", baseDamage: 4, hitRate: 100 },
  { level: 7, hp: 23, maxHp: 23, str: 9, def: 5, res: 2, spd: 5, luck: 2, weaponName: "Heavy Cutter", baseDamage: 5, hitRate: 95 },
  { level: 8, hp: 20, maxHp: 20, str: 8, def: 3, res: 3, spd: 8, luck: 4, weaponName: "Quick Blade", baseDamage: 4, hitRate: 105 },
];

const MAGE_VARIANTS = [
  { level: 6, hp: 16, maxHp: 16, str: 1, mag: 8, def: 2, res: 6, spd: 5, luck: 3, weaponName: "Factory Spark", baseDamage: 4, hitRate: 95 },
  { level: 7, hp: 17, maxHp: 17, str: 1, mag: 9, def: 3, res: 5, spd: 4, luck: 4, weaponName: "Forked Bolt", baseDamage: 5, hitRate: 90 },
  { level: 8, hp: 15, maxHp: 15, str: 0, mag: 10, def: 2, res: 7, spd: 6, luck: 2, weaponName: "Long Arc", baseDamage: 4, hitRate: 95 },
];

const THIEF_VARIANTS = [
  { level: 6, hp: 17, maxHp: 17, str: 5, mag: 0, def: 2, res: 2, spd: 9, luck: 8 },
  { level: 7, hp: 18, maxHp: 18, str: 6, mag: 1, def: 3, res: 2, spd: 10, luck: 9 },
  { level: 8, hp: 16, maxHp: 16, str: 5, mag: 0, def: 2, res: 3, spd: 11, luck: 10 },
];

function getVariant(variants, id, placement) {
  const explicit = Number.isInteger(placement.variant) ? placement.variant : null;
  const fromId = Number.parseInt(String(id).match(/_(\d+)$/)?.[1] || "0", 10);
  const index = explicit ?? fromId;
  return variants[Math.abs(index) % variants.length];
}

export const CHAPTER_THREE_GAIDEN_PLAYER_SPAWNS = [
  { x: 2, y: 7, facing: "up" },
  { x: 3, y: 7, facing: "up" },
  { x: 4, y: 7, facing: "up" },
];

export const CHAPTER_THREE_GAIDEN_ENEMY_SPAWNS = [
  { x: 4, y: 1, facing: "down", kind: "harold" },
  { x: 1, y: 0, facing: "down", kind: "sword" },
  { x: 3, y: 0, facing: "down", kind: "sword" },
  { x: 6, y: 0, facing: "down", kind: "sword" },
  { x: 6, y: 1, facing: "down", kind: "mage" },
  { x: 2, y: 1, facing: "down", kind: "mage" },
  { x: 7, y: 1, facing: "down", kind: "mage" },
];

export const CHAPTER_THREE_GAIDEN_ROUND_TWO_REINFORCEMENT_SPAWNS = [
  { x: 0, y: 4, facing: "right", kind: "thief", variant: 0, hasDirk: true },
  { x: 9, y: 4, facing: "left", kind: "thief", variant: 1 },
  { x: 0, y: 7, facing: "right", kind: "thief", variant: 2 },
  { x: 9, y: 7, facing: "left", kind: "marnie" },
];

export function createChapterThreeGaidenHarold(placement = {}) {
  return {
    id: CHAPTER_THREE_GAIDEN_BOSS_ID,
    name: "Harold",
    title: "Acting Boss",
    team: "enemy",
    className: "Boss",
    level: 8,
    xp: 0,
    portraitKey: "haroldPortrait",
    spriteSet: "harold",
    facing: "down",
    x: 4,
    y: 1,
    move: 4,
    hp: 38,
    maxHp: 38,
    str: 12,
    mag: 1,
    def: 9,
    res: 2,
    spd: 5,
    luck: 2,
    weapons: [{ name: "Warehouse Cleaver", baseDamage: 6, range: 1, damageType: "physical", stat: "str", hitRate: 95 }],
    skills: [{
      id: "allTheTrappings",
      name: "All the Trappings",
      cost: 1,
      type: "rangedSingle",
      targetTeam: "enemy",
      range: 3,
      squareRange: true,
      damageFormula: "luck",
      animationState: "attack",
    }],
    acted: false,
    color: 0xf97316,
    boss: true,
    ...placement,
  };
}

export function createChapterThreeGaidenSwordThug(id, placement = {}) {
  const variant = getVariant(SWORD_THUG_VARIANTS, id, placement);
  return {
    id,
    name: "Thug",
    title: "Sword Thug",
    team: "enemy",
    className: "Thug",
    level: variant.level,
    xp: 0,
    portraitKey: "thugPortrait",
    spriteSet: "sword_thug",
    facing: "down",
    move: 4,
    hp: variant.hp,
    maxHp: variant.maxHp,
    str: variant.str,
    mag: 0,
    def: variant.def,
    res: variant.res,
    spd: variant.spd,
    luck: variant.luck,
    weapons: [{ name: variant.weaponName, baseDamage: variant.baseDamage, range: 1, damageType: "physical", stat: "str", hitRate: variant.hitRate }],
    skills: [],
    acted: false,
    color: 0xfb7185,
    ...placement,
  };
}

export function createChapterThreeGaidenMage(id, placement = {}) {
  const variant = getVariant(MAGE_VARIANTS, id, placement);
  return {
    id,
    name: "Mage",
    title: "Factory Mage",
    team: "enemy",
    className: "Mage",
    level: variant.level,
    xp: 0,
    portraitKey: "magePortrait",
    spriteSet: "mage",
    facing: "down",
    move: 4,
    hp: variant.hp,
    maxHp: variant.maxHp,
    str: variant.str,
    mag: variant.mag,
    def: variant.def,
    res: variant.res,
    spd: variant.spd,
    luck: variant.luck,
    weapons: [{ name: variant.weaponName, baseDamage: variant.baseDamage, range: 1, minRange: 1, maxRange: 3, damageType: "magical", stat: "mag", hitRate: variant.hitRate }],
    skills: [],
    acted: false,
    color: 0xa78bfa,
    ...placement,
  };
}

export function createChapterThreeGaidenThief(id, placement = {}) {
  const variant = getVariant(THIEF_VARIANTS, id, placement);
  return {
    id,
    name: "Thief",
    title: "Warehouse Thief",
    team: "enemy",
    className: "Thief",
    level: variant.level,
    xp: 0,
    portraitKey: "thiefPortrait",
    spriteSet: "thief",
    facing: "left",
    move: 5,
    hp: variant.hp,
    maxHp: variant.maxHp,
    str: variant.str,
    mag: variant.mag,
    def: variant.def,
    res: variant.res,
    spd: variant.spd,
    luck: variant.luck,
    weapons: [{ name: "Knife", baseDamage: 2, range: 1, damageType: "physical", stat: "str", hitRate: 100 }],
    skills: [],
    items: placement.hasDirk ? [{ ...DIRK_ITEM }] : [],
    acted: false,
    color: 0x38bdf8,
    ...placement,
  };
}

export function createChapterThreeGaidenMarnie(placement = {}) {
  return {
    id: "marnie",
    name: "Marnie",
    title: "Opportunist",
    team: "neutral",
    className: "Thief",
    level: 8,
    xp: 0,
    portraitKey: "marniePortrait",
    spriteSet: "marnie",
    facing: "left",
    move: 5,
    hp: 21,
    maxHp: 21,
    str: 6,
    mag: 1,
    def: 3,
    res: 3,
    spd: 12,
    luck: 11,
    weapons: [{ name: "Hidden Knife", baseDamage: 4, range: 1, damageType: "physical", stat: "str", hitRate: 105 }],
    skills: [{ ...STEAL_SKILL }],
    items: [],
    acted: false,
    color: 0xf472b6,
    neutral: true,
    recruitableByTalk: true,
    ...placement,
  };
}

export const CHAPTER_THREE_GAIDEN_UNITS = [
  cloneUnit(leon, CHAPTER_THREE_GAIDEN_PLAYER_SPAWNS[0]),
  cloneUnit(izzy, CHAPTER_THREE_GAIDEN_PLAYER_SPAWNS[1]),
  cloneUnit(kane, CHAPTER_THREE_GAIDEN_PLAYER_SPAWNS[2]),
].filter(Boolean);
