import { CHAPTER_ONE_UNITS } from "../chapter1.js";
import { CHAPTER_TWO_ALLY_UNITS } from "../chapter2.js";
import { STEAL_SKILL } from "../../config/constants.js";
import { DIRK_ITEM } from "./items.js";

export const CHAPTER_THREE_GAIDEN_BOSS_ID = "harold";

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
