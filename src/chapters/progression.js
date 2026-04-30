import { CHAPTER_TWO_TITLE } from "./chapter2.js";
import { LEVELS } from "./index.js";

export const CHAPTER_ONE_NUMBER = 1;
export const CHAPTER_TWO_NUMBER = 2;

export function getSaveDataChapterNumber(saveData, fallback = CHAPTER_ONE_NUMBER) {
  return saveData?.currentChapter || saveData?.chapter || fallback;
}

export function getSceneDataChapterNumber(sceneData = {}) {
  return getSaveDataChapterNumber(
    sceneData?.saveData,
    sceneData?.playChapterTwoOpening ? CHAPTER_TWO_NUMBER : CHAPTER_ONE_NUMBER
  );
}

export function isChapterOne(chapterNumber) {
  return (chapterNumber || CHAPTER_ONE_NUMBER) === CHAPTER_ONE_NUMBER;
}

export function isChapterTwoOrLater(chapterNumber) {
  return (chapterNumber || CHAPTER_ONE_NUMBER) >= CHAPTER_TWO_NUMBER;
}

export function getLevelForChapter(chapterNumber) {
  return isChapterTwoOrLater(chapterNumber) ? LEVELS.chapter2 : LEVELS.chapter1;
}

export function getChapterTwoTitleLabel() {
  return `${CHAPTER_TWO_TITLE.chapter}: ${CHAPTER_TWO_TITLE.subtitle}`;
}

export function buildChapterTwoSaveData({
  slotNumber = null,
  defeatedAllies = [],
  units = [],
} = {}) {
  return {
    version: 2,
    slotNumber,
    currentChapter: CHAPTER_TWO_NUMBER,
    chapter: CHAPTER_TWO_NUMBER,
    chapterTitle: getChapterTwoTitleLabel(),
    completedChapters: [CHAPTER_ONE_NUMBER],
    savedAt: new Date().toISOString(),
    defeatedAllies: [...new Set(defeatedAllies || [])],
    units,
  };
}
