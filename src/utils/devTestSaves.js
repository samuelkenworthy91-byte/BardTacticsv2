import { CHAPTER_ONE_UNITS } from "../chapters/chapter1.js";
import { CHAPTER_TWO_ALLY_UNITS } from "../chapters/chapter2.js";
import {
  CHAPTER_THREE_COTTAGE_VISITS,
  CHAPTER_THREE_REWARDS,
  CHAPTER_THREE_TOME_SKILLS,
  CHAPTER_THREE_UNITS,
  createMiloUnit,
} from "../chapters/chapter3.js";
import { createChapterThreeGaidenMarnie } from "../chapters/chapter3Gaiden.js";
import { buildChapterFourSaveData, buildChapterThreeGaidenSaveData } from "../chapters/progression.js";

const LEVEL_SIX_STATS = {
  edwin: { maxHp: 27, str: 10, mag: 13, def: 7, res: 9, spd: 12, luck: 6 },
  leon: { maxHp: 27, str: 10, mag: 1, def: 9, res: 3, spd: 9, luck: 7 },
  izzy: { maxHp: 21, str: 8, mag: 4, def: 5, res: 4, spd: 14, luck: 7 },
  heath: { maxHp: 25, str: 6, mag: 8, def: 7, res: 8, spd: 5, luck: 6 },
  grimmy: { maxHp: 19, str: 3, mag: 14, def: 3, res: 8, spd: 7, luck: 6 },
  kane: { maxHp: 29, str: 14, mag: 2, def: 10, res: 3, spd: 7, luck: 5 },
  shade: { maxHp: 17, str: 8, mag: 1, def: 5, res: 3, spd: 13, luck: 8 },
  ambrose: { maxHp: 32, str: 11, mag: 1, def: 11, res: 7, spd: 4, luck: 6, move: 5 },
  ash: { maxHp: 34, str: 2, mag: 13, def: 3, res: 11, spd: 4, luck: 7 },
  milo: { maxHp: 20, str: 4, mag: 4, def: 4, res: 4, spd: 8, luck: 11 },
};

const LEVEL_EIGHT_STATS = {
  edwin: { maxHp: 29, str: 11, mag: 15, def: 8, res: 10, spd: 13, luck: 7 },
  leon: { maxHp: 31, str: 12, mag: 2, def: 10, res: 4, spd: 11, luck: 8 },
  izzy: { maxHp: 23, str: 9, mag: 5, def: 6, res: 5, spd: 16, luck: 8 },
  heath: { maxHp: 28, str: 7, mag: 10, def: 8, res: 10, spd: 6, luck: 7 },
  grimmy: { maxHp: 21, str: 4, mag: 16, def: 4, res: 10, spd: 8, luck: 7 },
  kane: { maxHp: 32, str: 16, mag: 3, def: 11, res: 4, spd: 8, luck: 6 },
  shade: { maxHp: 19, str: 9, mag: 1, def: 6, res: 4, spd: 15, luck: 9 },
  ambrose: { maxHp: 35, str: 12, mag: 1, def: 13, res: 8, spd: 5, luck: 7, move: 5 },
  ash: { maxHp: 37, str: 3, mag: 15, def: 4, res: 13, spd: 5, luck: 8 },
  milo: { maxHp: 23, str: 5, mag: 5, def: 5, res: 5, spd: 10, luck: 13 },
  marnie: { maxHp: 23, str: 7, mag: 1, def: 4, res: 4, spd: 13, luck: 12 },
};

const GAIDEN_TEST_SPAWNS = [
  { x: 2, y: 7, facing: "up" },
  { x: 3, y: 7, facing: "up" },
  { x: 4, y: 7, facing: "up" },
  { x: 1, y: 6, facing: "up" },
  { x: 2, y: 6, facing: "up" },
  { x: 3, y: 6, facing: "up" },
  { x: 4, y: 6, facing: "up" },
  { x: 5, y: 6, facing: "up" },
  { x: 1, y: 7, facing: "up" },
  { x: 5, y: 7, facing: "up" },
];

function cloneList(list = []) {
  return list.map((entry) => ({ ...entry }));
}

function findUnit(unitId) {
  return (
    CHAPTER_ONE_UNITS.find((unit) => unit.id === unitId) ||
    CHAPTER_TWO_ALLY_UNITS.find((unit) => unit.id === unitId) ||
    CHAPTER_THREE_UNITS.find((unit) => unit.id === unitId)
  );
}

function createShadeUnit() {
  return {
    id: "shade",
    name: "Shade",
    title: "Recon Man",
    className: "Assassin",
    team: "player",
    portraitKey: "shadePortrait",
    spriteSet: "shade",
    level: 6,
    xp: 0,
    xpRate: 1,
    move: 5,
    sigilPoints: 3,
    maxSigilPoints: 3,
    weapons: [{ name: "Kunai", baseDamage: 3, range: 1, damageType: "physical", stat: "str", hitRate: 100 }],
    skills: [CHAPTER_THREE_TOME_SKILLS.shade],
    color: 0x64748b,
  };
}

function normalizePlayerUnit(unit, index, statKey = unit?.id, statsTable = LEVEL_SIX_STATS, level = 6) {
  const stats = statsTable[statKey] || statsTable[unit?.id] || {};
  const spawn = GAIDEN_TEST_SPAWNS[index] || { x: 2 + (index % 4), y: 7 - Math.floor(index / 4), facing: "up" };
  const maxHp = stats.maxHp || unit.maxHp || unit.hp || 1;
  const skills = cloneList(unit.skills);

  if (unit.id === "milo") {
    const miloSkill = CHAPTER_THREE_TOME_SKILLS.fallback;
    skills.push({ ...miloSkill, id: "battleFocusMilo", name: miloSkill.name });
  }

  return {
    ...unit,
    ...spawn,
    ...stats,
    team: "player",
    level,
    xp: 0,
    hp: maxHp,
    maxHp,
    sigilPoints: unit.maxSigilPoints ?? unit.sigilPoints ?? 3,
    maxSigilPoints: unit.maxSigilPoints ?? unit.sigilPoints ?? 3,
    acted: false,
    alive: true,
    boss: false,
    stationary: false,
    adjacentOnlyEnemy: false,
    recruitmentLocked: false,
    permanentRecruit: unit.id === "milo" ? true : unit.permanentRecruit === true,
    recruitedThisChapter: false,
    spriteState: "idle",
    facing: spawn.facing,
    weapons: cloneList(unit.weapons),
    skills,
    items: cloneList(unit.items),
  };
}

function previousChapterItems() {
  const cottageItems = Object.values(CHAPTER_THREE_COTTAGE_VISITS)
    .filter((visit) => visit.item)
    .map((visit) => ({ ...visit.item }));
  const threeCivilianRewards = CHAPTER_THREE_REWARDS
    .filter((reward) => reward.threshold <= 3)
    .map((reward) => reward.item || reward.weapon)
    .filter(Boolean)
    .map((reward) => ({ ...reward }));

  return [...cottageItems, ...threeCivilianRewards];
}

function givePriorItems(units) {
  const byId = new Map(units.map((unit) => [unit.id, unit]));
  const itemPlan = [
    ["heath", previousChapterItems()[0]],
    ["milo", previousChapterItems()[1]],
    ["leon", previousChapterItems()[2]],
    ["kane", previousChapterItems()[3]],
    ["edwin", previousChapterItems()[4]],
  ];

  itemPlan.forEach(([unitId, item]) => {
    const unit = byId.get(unitId);
    if (!unit || !item) return;
    const targetList = item.baseDamage ? "weapons" : "items";
    unit[targetList] = [...(unit[targetList] || []), { ...item }];
  });

  return units;
}

export function buildChapterThreeGaidenTestSaveData() {
  const milo = {
    ...createMiloUnit(),
    permanentRecruit: true,
    recruitedThisChapter: false,
  };
  const rosterSources = [
    findUnit("edwin"),
    findUnit("leon"),
    findUnit("izzy"),
    findUnit("heath"),
    findUnit("grimmy"),
    findUnit("kane"),
    createShadeUnit(),
    findUnit("ambrose"),
    findUnit("ash"),
    milo,
  ].filter(Boolean);

  const units = givePriorItems(rosterSources.map((unit, index) => normalizePlayerUnit(unit, index)));

  return {
    ...buildChapterThreeGaidenSaveData({ slotNumber: null, defeatedAllies: [], units }),
    devTestRoute: true,
    routeFlags: {
      ambroseRecruited: true,
      ashRecruited: true,
      chapterThreeCiviliansSurvived: 3,
    },
  };
}

export function buildChapterFourTestSaveData() {
  const milo = {
    ...createMiloUnit(),
    permanentRecruit: true,
    recruitedThisChapter: false,
  };
  const marnie = {
    ...createChapterThreeGaidenMarnie(),
    team: "player",
    neutral: false,
    temporaryRecruit: false,
    permanentRecruit: true,
    recruitedThisChapter: false,
  };
  const rosterSources = [
    findUnit("edwin"),
    findUnit("leon"),
    findUnit("izzy"),
    findUnit("heath"),
    findUnit("grimmy"),
    findUnit("kane"),
    createShadeUnit(),
    findUnit("ambrose"),
    findUnit("ash"),
    milo,
    marnie,
  ].filter(Boolean);

  const units = givePriorItems(rosterSources.map((unit, index) => normalizePlayerUnit(unit, index, unit.id, LEVEL_EIGHT_STATS, index % 3 === 0 ? 8 : 7)));

  return {
    ...buildChapterFourSaveData({
      slotNumber: null,
      defeatedAllies: [],
      units,
      marniePermanentlyRecruited: true,
      completedChapterThreeGaiden: true,
    }),
    devTestRoute: true,
    routeFlags: {
      ambroseRecruited: true,
      ashRecruited: true,
      marnieRecruited: true,
      chapterThreeGaidenComplete: true,
    },
  };
}
