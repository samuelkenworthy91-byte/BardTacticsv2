import { CHAPTER_ONE_MAP, CHAPTER_ONE_UNITS } from "./chapter1.js";
import { CHAPTER_TWO_MAP, CHAPTER_TWO_UNITS } from "./chapter2.js";
import { CHAPTER_THREE_MAP, CHAPTER_THREE_UNITS } from "./chapter3.js";
import { CHAPTER_THREE_GAIDEN_MAP, CHAPTER_THREE_GAIDEN_OBJECTIVE, CHAPTER_THREE_GAIDEN_UNITS } from "./chapter3Gaiden.js";
import { CHAPTER_FOUR_MAP, CHAPTER_FOUR_UNITS } from "./chapter4.js";

export const LEVELS = {
  chapter1: {
    biome: "city",
    map: CHAPTER_ONE_MAP,
    units: CHAPTER_ONE_UNITS,
    battleMusic: { key: "chapter1BattleMusic", path: "/audio/chapter1_battle.mp3", volume: 0.45 },
    objective: "Escape through the glowing gate tile.",
  },
  chapter2: {
    biome: "farm",
    map: CHAPTER_TWO_MAP,
    units: CHAPTER_TWO_UNITS,
    objective: "Capture all four forts. Fence tiles are impassable.",
  },
  chapter3: {
    biome: "town",
    map: CHAPTER_THREE_MAP,
    units: CHAPTER_THREE_UNITS,
    objective: "Survive 10 turns and protect the 5 townsfolk. Recruit Ambrose and defeat every enemy to end it early.",
  },
  chapter3Gaiden: {
    biome: "factory",
    map: CHAPTER_THREE_GAIDEN_MAP,
    units: CHAPTER_THREE_GAIDEN_UNITS,
    objective: CHAPTER_THREE_GAIDEN_OBJECTIVE,
  },
  chapter4: {
    biome: "destroyedFarm",
    map: CHAPTER_FOUR_MAP,
    units: CHAPTER_FOUR_UNITS,
    objective: "Push through the burning farm and confront the Guildlite commanders.",
  },
};
