import Phaser from "phaser";
import {
  BROTHERS_BLIGH_CUTIN_FADE_DURATION,
  BROTHERS_BLIGH_CUTIN_HOLD_DURATION,
  BROTHERS_BLIGH_CUTIN_KEY,
  BROTHERS_BLIGH_HIT_APPEAR_DURATION,
  BROTHERS_BLIGH_HIT_EFFECT_KEY,
  BROTHERS_BLIGH_HIT_FADE_DURATION,
  BROTHERS_BLIGH_HIT_HOLD_DURATION,
  BROTHERS_BLIGH_SKILL,
  CARDINAL_DIRECTIONS,
  CLOCKWISE_DIRECTIONS,
  ENEMY_ACTION_PAUSE,
  ENEMY_MOVE_DURATION,
  GAME_HEIGHT,
  GAME_WIDTH,
  ICE_OF_AGES_HIT_EFFECT_KEY,
  LEVEL_UP_PANEL_DEPTH,
  LEVEL_UP_STATS,
  OPPORTUNITY_ATTACK_HIT_RATE,
  OPPORTUNITY_ATTACK_PAUSE,
  PLAYER_ACTION_PAUSE,
  PLAYER_MOVE_DURATION,
  SAVE_KEY,
  SAVE_SLOT_COUNT,
  SKILL_BANNER_DURATION,
  SKILL_IMPACT_DELAY,
  SKILL_TILE_EFFECT_APPEAR_DURATION,
  SKILL_TILE_EFFECT_END_SCALE,
  SKILL_TILE_EFFECT_FADE_DURATION,
  SKILL_TILE_EFFECT_HOLD_DURATION,
  SKILL_TILE_EFFECT_STAGGER,
  STANDARD_BATTLE_END_HOLD_DURATION,
  STANDARD_BATTLE_HIT_STEP_DURATION,
  STANDARD_BATTLE_INTRO_DURATION,
  STANDARD_BATTLE_OUTRO_DURATION,
  STANDARD_BATTLE_PANEL_DEPTH,
  TARGET_HIGHLIGHT,
  TILE_SIZE,
  UNIT_SPRITE_TARGET_SIZE,
} from "../../config/constants.js";
import {
  BIOMES,
  createDeathSpriteCandidateEntries,
  createDirectionalSpriteCandidateEntries,
  INDIVIDUAL_UNIT_SPRITE_SETS,
  queueChapterAssets,
  UNIT_SPRITE_RENDER,
  uniqueSpriteEntries,
} from "../../data/assets.js";
import { canAttack, getDefaultWeapon, getWeaponForTarget, getWeaponRangeLabel } from "../../utils/combat.js";
import { distance, tileColor, tileKey, tileLabel } from "../../utils/grid.js";
import { getSaveSlotKey, getSaveSlotLabel } from "../../utils/saveSlots.js";
import { createBannerButton, createBannerPanel, fitImageToBounds } from "../../ui/banner.js";
import {
  ALLIED_DEATH_LINES,
  CHAPTER_ONE_ESCAPE_TILE,
  CHAPTER_ONE_GAME_OVER_UNIT_IDS,
  CHAPTER_ONE_OPENING,
  CHAPTER_ONE_UNITS as UNITS,
  POST_BATTLE_SCENE,
} from "../../chapters/chapter1.js";
import {
  CHAPTER_TWO_ALLY_OPTIONS,
  CHAPTER_TWO_ALLY_SELECTION_LINES,
  CHAPTER_TWO_OPENING,
  CHAPTER_TWO_TITLE,
} from "../../chapters/chapter2.js";
import {
  buildChapterTwoSaveData,
  CHAPTER_TWO_NUMBER,
  getLevelForChapter,
  getSaveDataChapterNumber,
  isChapterOne,
  isChapterTwoOrLater,
} from "../../chapters/progression.js";
export const flowMethods = {
  getCurrentLevel() {
    return getLevelForChapter(this.currentChapterNumber);
  },

  getSavedGameData() {
    if (this.loadedSaveData) return this.loadedSaveData;
    try {
      const raw = window.localStorage.getItem(SAVE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (error) {
      return null;
    }
  },

  shouldRestoreResourcesForChapterStart(saveData = null) {
    const chapterNumber = getSaveDataChapterNumber(saveData, this.currentChapterNumber);
    return isChapterTwoOrLater(chapterNumber);
  },

  applyLoadedSaveData(saveData) {
    if (!saveData) return;

    this.defeatedAllies = Array.isArray(saveData.defeatedAllies) ? [...saveData.defeatedAllies] : [];

    if (!Array.isArray(saveData.units)) return;

    const savedById = new Map(saveData.units.map((unitState) => [unitState.id, unitState]));
    const preserveMapPositions = isChapterOne(this.currentChapterNumber);
    const restoreResources = this.shouldRestoreResourcesForChapterStart(saveData);

    this.units = this.units
      .map((unit) => {
        const saved = savedById.get(unit.id);
        if (!saved) return unit;
        if (saved.alive === false) return null;

        const merged = {
          ...unit,
          ...saved,
          x: preserveMapPositions ? (saved.x ?? unit.x) : unit.x,
          y: preserveMapPositions ? (saved.y ?? unit.y) : unit.y,
          facing: preserveMapPositions ? (saved.facing || unit.facing || "down") : (unit.facing || saved.facing || "down"),
          skills: (unit.skills || []).map((skill) => ({ ...skill })),
          weapons: (unit.weapons || []).map((weapon) => ({ ...weapon })),
          items: Array.isArray(saved.items) ? saved.items.map((item) => ({ ...item })) : (unit.items || []).map((item) => ({ ...item })),
          acted: false,
          spriteState: "idle",
        };
        if (restoreResources && merged.team === "player") {
          merged.hp = merged.maxHp || merged.hp || 1;
          merged.sigilPoints = merged.maxSigilPoints ?? merged.sigilPoints ?? 3;
        }
        return merged;
      })
      .filter(Boolean);
  },

  serializeUnitForSave(unit, options = {}) {
    const restoreForChapterStart = options.restoreForChapterStart === true;
    const maxHp = unit.maxHp || 1;
    const maxSigilPoints = unit.maxSigilPoints ?? 3;

    return {
      id: unit.id,
      name: unit.name,
      title: unit.title,
      team: unit.team,
      className: unit.className,
      level: unit.level || 1,
      xp: unit.xp || 0,
      hp: restoreForChapterStart ? maxHp : Math.max(0, unit.hp || 0),
      maxHp,
      str: unit.str || 0,
      mag: unit.mag || 0,
      def: unit.def || 0,
      res: unit.res || 0,
      spd: unit.spd || 0,
      luck: unit.luck || 0,
      move: unit.move || 0,
      x: unit.x,
      y: unit.y,
      facing: unit.facing || "down",
      sigilPoints: restoreForChapterStart ? maxSigilPoints : (unit.sigilPoints ?? 0),
      maxSigilPoints,
      items: (unit.items || []).map((item) => ({ ...item })),
      alive: restoreForChapterStart ? true : unit.hp > 0,
    };
  },

  buildChapterSaveData(slotNumber = null) {
    return buildChapterTwoSaveData({
      slotNumber,
      defeatedAllies: this.defeatedAllies || [],
      units: this.units
        .filter((unit) => unit.team === "player")
        .map((unit) => this.serializeUnitForSave(unit, { restoreForChapterStart: true })),
    });
  },

  startLoadedBattle() {
    this.openingContainer.setVisible(false);

    const saveData = this.loadedSaveData || this.getSavedGameData();
    const savedChapter = getSaveDataChapterNumber(saveData);

    if (isChapterTwoOrLater(savedChapter)) {
      this.pendingChapterTwoTransitionData = saveData || this.pendingChapterTwoTransitionData;
      if (this.skipChapterTwoTitleCard) {
        this.startChapterTwoOpening();
      } else {
        this.setObjectiveDisplayVisible(false);
        this.showChapterTwoTitleCard("Loaded save. Chapter 2 is ready to begin.");
      }
      return;
    }

    this.startPlayerPhase();
    this.selectedUnitId = "edwin";
    this.updateSelectedPanel();
    if (saveData) this.helpText.setText("Loaded game. Player Phase. Click Edwin or Leon.");
  }
};
