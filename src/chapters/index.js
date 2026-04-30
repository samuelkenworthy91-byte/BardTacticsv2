import { CHAPTER_ONE_MAP, CHAPTER_ONE_UNITS } from "./chapter1.js";
import { CHAPTER_TWO_MAP, CHAPTER_TWO_UNITS } from "./chapter2.js";

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
};
