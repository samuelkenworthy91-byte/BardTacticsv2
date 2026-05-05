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
  buildChapterThreeSaveData,
  buildChapterTwoSaveData,
  CHAPTER_THREE_NUMBER,
  CHAPTER_TWO_NUMBER,
  getLevelForChapter,
  getSaveDataChapterNumber,
  isChapterOne,
  isChapterThree,
  isChapterTwoOrLater,
  isChapterTwo,
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

  cloneSceneData(data = null) {
    if (!data) return null;
    return JSON.parse(JSON.stringify(data));
  },

  getChapterRestartSceneData() {
    if (isChapterThree(this.currentChapterNumber)) {
      const saveData = this.cloneSceneData(this.pendingChapterThreeTransitionData || this.loadedSaveData);
      if (saveData) {
        return {
          loadFromSave: true,
          saveData,
          slotNumber: saveData.slotNumber || this.loadedSlotNumber || null,
          playChapterThreeOpening: true,
          skipChapter3TitleCard: true,
        };
      }
    }

    if (isChapterTwo(this.currentChapterNumber)) {
      const saveData = this.cloneSceneData(this.pendingChapterTwoTransitionData || this.loadedSaveData);
      if (saveData) {
        return {
          loadFromSave: true,
          saveData,
          slotNumber: saveData.slotNumber || this.loadedSlotNumber || null,
          playChapterTwoOpening: true,
          skipChapter2TitleCard: true,
        };
      }
    }

    return { loadFromSave: false };
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
          skills: Array.isArray(saved.skills) ? saved.skills.map((skill) => ({ ...skill })) : (unit.skills || []).map((skill) => ({ ...skill })),
          weapons: Array.isArray(saved.weapons) ? saved.weapons.map((weapon) => ({ ...weapon })) : (unit.weapons || []).map((weapon) => ({ ...weapon })),
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

    if (isChapterThree(this.currentChapterNumber)) {
      const existingIds = new Set(this.units.map((unit) => unit.id));
      saveData.units
        .filter((unitState) => unitState.team === "player" && unitState.alive !== false && !existingIds.has(unitState.id))
        .forEach((unitState) => {
          this.units.push({
            ...unitState,
            team: "player",
            portraitKey: unitState.portraitKey || (String(unitState.id).startsWith("shade") ? "shadePortrait" : unitState.portraitKey),
            spriteSet: unitState.spriteSet || (String(unitState.id).startsWith("shade") ? "shade" : unitState.id),
            hp: restoreResources ? (unitState.maxHp || unitState.hp || 1) : Math.max(1, unitState.hp || 1),
            sigilPoints: restoreResources ? (unitState.maxSigilPoints ?? unitState.sigilPoints ?? 3) : (unitState.sigilPoints ?? 0),
            facing: unitState.facing || "up",
            acted: false,
            spriteState: "idle",
            skills: (unitState.skills || []).map((skill) => ({ ...skill })),
            weapons: (unitState.weapons || []).map((weapon) => ({ ...weapon })),
            items: (unitState.items || []).map((item) => ({ ...item })),
          });
          existingIds.add(unitState.id);
        });
    }
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
      portraitKey: unit.portraitKey,
      spriteSet: unit.spriteSet,
      recruitmentId: unit.recruitmentId,
      color: unit.color,
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
      latent: unit.latent === true,
      miloSigil: unit.miloSigil || null,
      recruitedThisChapter: unit.recruitedThisChapter === true,
      recruitmentStartLevel: unit.recruitmentStartLevel,
      permanentRecruit: unit.permanentRecruit === true,
      skills: (unit.skills || []).map((skill) => ({ ...skill })),
      weapons: (unit.weapons || []).map((weapon) => ({ ...weapon })),
      items: (unit.items || []).map((item) => ({ ...item })),
      alive: restoreForChapterStart ? true : unit.hp > 0,
    };
  },

  buildChapterSaveData(slotNumber = null) {
    const buildNextChapterSaveData = isChapterTwo(this.currentChapterNumber) || isChapterThree(this.currentChapterNumber)
      ? buildChapterThreeSaveData
      : buildChapterTwoSaveData;

    const reserveUnits = Array.isArray(this.chapterThreeReserveUnits) ? this.chapterThreeReserveUnits : [];
    const playerUnits = this.units.filter((unit) => (
      unit.team === "player" &&
      unit.isMiloDecoy !== true &&
      (unit.id !== "milo" || unit.permanentRecruit === true)
    ));
    const seenPlayerIds = new Set(playerUnits.map((unit) => unit.id));
    const unitsToSave = [
      ...playerUnits,
      ...reserveUnits.filter((unit) => unit?.team === "player" && !seenPlayerIds.has(unit.id)),
    ];

    return buildNextChapterSaveData({
      slotNumber,
      defeatedAllies: this.defeatedAllies || [],
      units: unitsToSave
        .map((unit) => this.serializeUnitForSave(unit, { restoreForChapterStart: true })),
    });
  },

  startLoadedBattle() {
    this.openingContainer.setVisible(false);

    const saveData = this.loadedSaveData || this.getSavedGameData();
    const savedChapter = getSaveDataChapterNumber(saveData);

    if (isChapterThree(savedChapter)) {
      this.pendingChapterThreeTransitionData = saveData || this.pendingChapterThreeTransitionData;
      if (this.skipChapterThreeTitleCard) {
        this.startChapterThreeOpening();
      } else {
        this.setObjectiveDisplayVisible(false);
        this.showChapterThreeTitleCard("Loaded save. Chapter 3 is ready to begin.");
      }
      return;
    }

    if (isChapterTwo(savedChapter)) {
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
