import { SAVE_SLOT_KEY_PREFIX } from "../config/constants.js";
import { getSaveDataChapterNumber } from "../chapters/progression.js";

export function getSaveSlotKey(slotNumber) {
  return `${SAVE_SLOT_KEY_PREFIX}${slotNumber}`;
}

export function readSaveSlot(slotNumber) {
  try {
    const raw = window.localStorage.getItem(getSaveSlotKey(slotNumber));
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    return null;
  }
}

export function getSaveSlotLabel(slotNumber) {
  const saveData = readSaveSlot(slotNumber);
  if (!saveData) return `Slot ${slotNumber}: Empty`;

  const chapter = getSaveDataChapterNumber(saveData);
  const chapterName = saveData.chapterTitle || saveData.chapterName || `Chapter ${chapter}`;
  const savedAt = saveData.savedAt || saveData.completedAt;
  let dateLabel = "saved game";

  if (savedAt) {
    try {
      dateLabel = new Date(savedAt).toLocaleString();
    } catch (error) {
      dateLabel = "saved game";
    }
  }

  return `Slot ${slotNumber}: ${chapterName} - ${dateLabel}`;
}
