import { CHAPTER_TWO_TITLE } from "./chapter2.js";
import { CHAPTER_THREE_TITLE } from "./chapter3.js";
import { CHAPTER_THREE_GAIDEN_ID, CHAPTER_THREE_GAIDEN_TITLE } from "./chapter3Gaiden.js";
import { CHAPTER_FOUR_NUMBER, CHAPTER_FOUR_TITLE } from "./chapter4.js";
import { LEVELS } from "./index.js";

export const CHAPTER_ONE_NUMBER = 1;
export const CHAPTER_TWO_NUMBER = 2;
export const CHAPTER_THREE_NUMBER = 3;
export { CHAPTER_FOUR_NUMBER };
export const MYSTERIOUS_EGG_HATCH_MESSAGE = "The Mysterious Egg is starting to hatch...";
export { CHAPTER_THREE_GAIDEN_ID };

export function normalizeMysteriousEggTracking(tracking = null) {
  const carrierId = typeof tracking?.carrierId === "string" && tracking.carrierId.trim()
    ? tracking.carrierId
    : null;
  const chaptersWithCarrier = Number.isFinite(tracking?.chaptersWithCarrier)
    ? Math.max(0, Math.floor(tracking.chaptersWithCarrier))
    : 0;

  return {
    carrierId,
    chaptersWithCarrier,
    hatchReady: tracking?.hatchReady === true,
  };
}

export function getSaveDataChapterNumber(saveData, fallback = CHAPTER_ONE_NUMBER) {
  return saveData?.currentChapter || saveData?.chapter || fallback;
}

export function getSceneDataChapterNumber(sceneData = {}) {
  return getSaveDataChapterNumber(
    sceneData?.saveData,
    sceneData?.playChapterFourOpening
      ? CHAPTER_FOUR_NUMBER
      : sceneData?.playChapterThreeGaidenOpening
      ? CHAPTER_THREE_GAIDEN_ID
      : sceneData?.playChapterThreeOpening
      ? CHAPTER_THREE_NUMBER
      : sceneData?.playChapterTwoOpening
        ? CHAPTER_TWO_NUMBER
        : CHAPTER_ONE_NUMBER
  );
}

export function isChapterOne(chapterNumber) {
  return (chapterNumber || CHAPTER_ONE_NUMBER) === CHAPTER_ONE_NUMBER;
}

export function isChapterTwoOrLater(chapterNumber) {
  if (isChapterThreeGaiden(chapterNumber)) return true;
  return (chapterNumber || CHAPTER_ONE_NUMBER) >= CHAPTER_TWO_NUMBER;
}

export function isChapterTwo(chapterNumber) {
  return (chapterNumber || CHAPTER_ONE_NUMBER) === CHAPTER_TWO_NUMBER;
}

export function isChapterThree(chapterNumber) {
  return (chapterNumber || CHAPTER_ONE_NUMBER) === CHAPTER_THREE_NUMBER;
}

export function isChapterThreeGaiden(chapterNumber) {
  return (chapterNumber || CHAPTER_ONE_NUMBER) === CHAPTER_THREE_GAIDEN_ID;
}

export function isChapterFour(chapterNumber) {
  return (chapterNumber || CHAPTER_ONE_NUMBER) === CHAPTER_FOUR_NUMBER;
}

export function isChapterThreeOrLater(chapterNumber) {
  if (isChapterThreeGaiden(chapterNumber) || isChapterFour(chapterNumber)) return true;
  return (chapterNumber || CHAPTER_ONE_NUMBER) >= CHAPTER_THREE_NUMBER;
}

export function getLevelForChapter(chapterNumber) {
  if (isChapterFour(chapterNumber)) return LEVELS.chapter4;
  if (isChapterThreeGaiden(chapterNumber)) return LEVELS.chapter3Gaiden;
  if (isChapterThreeOrLater(chapterNumber)) return LEVELS.chapter3;
  if (isChapterTwo(chapterNumber)) return LEVELS.chapter2;
  return LEVELS.chapter1;
}

export function getChapterTwoTitleLabel() {
  return `${CHAPTER_TWO_TITLE.chapter}: ${CHAPTER_TWO_TITLE.subtitle}`;
}

export function getChapterThreeTitleLabel() {
  return `${CHAPTER_THREE_TITLE.chapter}: ${CHAPTER_THREE_TITLE.subtitle}`;
}

export function getChapterThreeGaidenTitleLabel() {
  return `${CHAPTER_THREE_GAIDEN_TITLE.chapter}: ${CHAPTER_THREE_GAIDEN_TITLE.subtitle}`;
}

export function getChapterFourTitleLabel() {
  return `${CHAPTER_FOUR_TITLE.chapter}: ${CHAPTER_FOUR_TITLE.subtitle}`;
}

export function buildChapterTwoSaveData({
  slotNumber = null,
  defeatedAllies = [],
  units = [],
  mysteriousEggTracking = null,
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
    mysteriousEggTracking: normalizeMysteriousEggTracking(mysteriousEggTracking),
    units,
  };
}

export function buildChapterThreeSaveData({
  slotNumber = null,
  defeatedAllies = [],
  units = [],
  marniePermanentlyRecruited = false,
  mysteriousEggTracking = null,
} = {}) {
  return {
    version: 5,
    slotNumber,
    currentChapter: CHAPTER_THREE_NUMBER,
    chapter: CHAPTER_THREE_NUMBER,
    chapterTitle: getChapterThreeTitleLabel(),
    completedChapters: [CHAPTER_ONE_NUMBER, CHAPTER_TWO_NUMBER],
    savedAt: new Date().toISOString(),
    defeatedAllies: [...new Set(defeatedAllies || [])],
    marniePermanentlyRecruited: marniePermanentlyRecruited === true,
    mysteriousEggTracking: normalizeMysteriousEggTracking(mysteriousEggTracking),
    units,
  };
}

export function buildChapterThreeGaidenSaveData({
  slotNumber = null,
  defeatedAllies = [],
  units = [],
  marnieTalked = false,
  marnieTemporarilyRecruited = false,
  marniePermanentlyRecruited = false,
  lostChapterThreeGaidenChestItems = [],
  mysteriousEggTracking = null,
} = {}) {
  return {
    version: 5,
    slotNumber,
    currentChapter: CHAPTER_THREE_GAIDEN_ID,
    chapter: CHAPTER_THREE_GAIDEN_ID,
    chapterTitle: getChapterThreeGaidenTitleLabel(),
    completedChapters: [CHAPTER_ONE_NUMBER, CHAPTER_TWO_NUMBER, CHAPTER_THREE_NUMBER],
    savedAt: new Date().toISOString(),
    defeatedAllies: [...new Set(defeatedAllies || [])],
    marnieTalked: marnieTalked === true,
    marnieTemporarilyRecruited: marnieTemporarilyRecruited === true,
    marniePermanentlyRecruited: marniePermanentlyRecruited === true,
    lostChapterThreeGaidenChestItems: [...new Set(lostChapterThreeGaidenChestItems || [])],
    mysteriousEggTracking: normalizeMysteriousEggTracking(mysteriousEggTracking),
    units,
  };
}

export function buildChapterFourSaveData({
  slotNumber = null,
  defeatedAllies = [],
  units = [],
  marniePermanentlyRecruited = false,
  completedChapterThreeGaiden = false,
  mysteriousEggTracking = null,
} = {}) {
  return {
    version: 6,
    slotNumber,
    currentChapter: CHAPTER_FOUR_NUMBER,
    chapter: CHAPTER_FOUR_NUMBER,
    chapterTitle: getChapterFourTitleLabel(),
    completedChapters: [
      CHAPTER_ONE_NUMBER,
      CHAPTER_TWO_NUMBER,
      CHAPTER_THREE_NUMBER,
      ...(completedChapterThreeGaiden === true ? [CHAPTER_THREE_GAIDEN_ID] : []),
    ],
    savedAt: new Date().toISOString(),
    defeatedAllies: [...new Set(defeatedAllies || [])],
    marniePermanentlyRecruited: marniePermanentlyRecruited === true,
    mysteriousEggTracking: normalizeMysteriousEggTracking(mysteriousEggTracking),
    units,
  };
}
