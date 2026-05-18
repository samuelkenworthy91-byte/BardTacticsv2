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
import { CHAPTER_THREE_GAIDEN_PLAYER_SPAWNS } from "../../chapters/chapter3Gaiden/index.js";
import {
  buildChapterThreeSaveData,
  buildChapterThreeGaidenSaveData,
  buildChapterTwoSaveData,
  CHAPTER_THREE_NUMBER,
  CHAPTER_TWO_NUMBER,
  getLevelForChapter,
  getSaveDataChapterNumber,
  isChapterOne,
  isChapterThree,
  isChapterThreeGaiden,
  isChapterThreeOrLater,
  isChapterTwoOrLater,
  isChapterTwo,
  MYSTERIOUS_EGG_HATCH_MESSAGE,
  normalizeMysteriousEggTracking,
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
    if (saveData?.inBattleSave === true) return false;
    const chapterNumber = getSaveDataChapterNumber(saveData, this.currentChapterNumber);
    return isChapterTwoOrLater(chapterNumber);
  },

  cloneSceneData(data = null) {
    if (!data) return null;
    return JSON.parse(JSON.stringify(data));
  },

  getMysteriousEggCarrierId(units = []) {
    const carrier = (units || []).find((unit) => (
      unit?.team === "player" &&
      unit?.alive !== false &&
      Array.isArray(unit.items) &&
      unit.items.some((item) => item?.id === "mysteriousEgg")
    ));
    return carrier?.id || null;
  },

  isMysteriousEggHatchWindowReached(saveData = null) {
    const completedCount = Array.isArray(saveData?.completedChapters) ? saveData.completedChapters.length : 0;
    const chapterNumber = getSaveDataChapterNumber(saveData, this.currentChapterNumber);
    return completedCount >= 6 || (Number.isFinite(chapterNumber) && chapterNumber >= 7);
  },

  buildMysteriousEggTrackingForUnits(units = [], options = {}) {
    const incrementForChapterCompletion = options.incrementForChapterCompletion === true;
    const nextSaveData = options.nextSaveData || null;
    const previous = normalizeMysteriousEggTracking(this.mysteriousEggTracking || this.loadedSaveData?.mysteriousEggTracking);
    const carrierId = this.getMysteriousEggCarrierId(units);
    if (!carrierId) {
      return normalizeMysteriousEggTracking();
    }

    const sameCarrier = carrierId === previous.carrierId;
    const chaptersWithCarrier = incrementForChapterCompletion
      ? (sameCarrier ? previous.chaptersWithCarrier + 1 : 1)
      : (sameCarrier ? previous.chaptersWithCarrier : 0);
    const hatchReady = (sameCarrier && previous.hatchReady === true) || (
      chaptersWithCarrier >= 4 &&
      this.isMysteriousEggHatchWindowReached(nextSaveData)
    );

    return {
      carrierId,
      chaptersWithCarrier,
      hatchReady,
    };
  },

  getRestartableSaveData(data = null) {
    const saveData = this.cloneSceneData(data);
    if (!saveData?.inBattleSave) return saveData;
    delete saveData.inBattleSave;
    delete saveData.openedFactoryContainers;
    delete saveData.destroyedFactoryTerrain;
    delete saveData.ignitedFactorySpills;
    delete saveData.factoryTerrainHp;
    delete saveData.chapterThreeBonusThorns;
    delete saveData.visitedChapterThreeCottages;
    delete saveData.defeatedCivilians;
    saveData.lostChapterThreeGaidenChestItems = [];
    saveData.marnieTalked = false;
    saveData.marnieTemporarilyRecruited = false;
    saveData.units = Array.isArray(saveData.units)
      ? saveData.units
        .filter((unit) => unit?.team === "player")
        .map((unit) => ({
          ...unit,
          acted: false,
          alive: true,
          hp: unit.maxHp || unit.hp || 1,
          sigilPoints: unit.maxSigilPoints ?? unit.sigilPoints ?? 3,
        }))
      : [];
    return saveData;
  },

  getChapterRestartSceneData() {
    if (isChapterThree(this.currentChapterNumber) || isChapterThreeGaiden(this.currentChapterNumber)) {
      const saveData = this.getRestartableSaveData(this.pendingChapterThreeTransitionData || this.loadedSaveData);
      if (saveData) {
        return {
          loadFromSave: true,
          saveData,
          slotNumber: saveData.slotNumber || this.loadedSlotNumber || null,
          playChapterThreeOpening: isChapterThree(this.currentChapterNumber),
          playChapterThreeGaidenOpening: isChapterThreeGaiden(this.currentChapterNumber),
          skipChapter3TitleCard: isChapterThree(this.currentChapterNumber),
          skipChapter3GaidenTitleCard: isChapterThreeGaiden(this.currentChapterNumber),
        };
      }
    }

    if (isChapterTwo(this.currentChapterNumber)) {
      const saveData = this.getRestartableSaveData(this.pendingChapterTwoTransitionData || this.loadedSaveData);
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
    this.marnieTalked = saveData.marnieTalked === true;
    this.marnieTemporarilyRecruited = saveData.marnieTemporarilyRecruited === true;
    this.marniePermanentlyRecruited = saveData.marniePermanentlyRecruited === true;
    this.lostChapterThreeGaidenChestItems = new Set(Array.isArray(saveData.lostChapterThreeGaidenChestItems) ? saveData.lostChapterThreeGaidenChestItems : []);
    this.openedFactoryContainers = new Set(Array.isArray(saveData.openedFactoryContainers) ? saveData.openedFactoryContainers : [...(this.openedFactoryContainers || new Set())]);
    this.destroyedFactoryTerrain = new Set(Array.isArray(saveData.destroyedFactoryTerrain) ? saveData.destroyedFactoryTerrain : [...(this.destroyedFactoryTerrain || new Set())]);
    this.ignitedFactorySpills = new Set(Array.isArray(saveData.ignitedFactorySpills) ? saveData.ignitedFactorySpills : [...(this.ignitedFactorySpills || new Set())]);
    this.factoryTerrainHp = saveData.factoryTerrainHp && typeof saveData.factoryTerrainHp === "object" ? { ...saveData.factoryTerrainHp } : (this.factoryTerrainHp || {});
    this.chapterThreeBonusThorns = Array.isArray(saveData.chapterThreeBonusThorns) ? saveData.chapterThreeBonusThorns.map((thorn) => ({ ...thorn })) : (this.chapterThreeBonusThorns || []);
    this.visitedChapterThreeCottages = new Set(Array.isArray(saveData.visitedChapterThreeCottages) ? saveData.visitedChapterThreeCottages : [...(this.visitedChapterThreeCottages || new Set())]);
    this.defeatedCivilians = Array.isArray(saveData.defeatedCivilians) ? [...saveData.defeatedCivilians] : (this.defeatedCivilians || []);
    this.chapterTwoTurns = Number.isFinite(saveData.chapterTwoTurns) ? saveData.chapterTwoTurns : (this.chapterTwoTurns || 0);
    this.chapterThreeTurns = Number.isFinite(saveData.chapterThreeTurns) ? saveData.chapterThreeTurns : (this.chapterThreeTurns || 0);
    this.chapterTwoSetupDone = saveData.chapterTwoSetupDone === true || this.chapterTwoSetupDone === true;
    this.chapterThreeFirstEnemyPhaseDone = saveData.chapterThreeFirstEnemyPhaseDone === true || this.chapterThreeFirstEnemyPhaseDone === true;
    this.chapterThreeBattleStartDialogueShown = saveData.chapterThreeBattleStartDialogueShown === true || this.chapterThreeBattleStartDialogueShown === true;
    this.chapterThreeGaidenBattleStartEventShown = saveData.chapterThreeGaidenBattleStartEventShown === true || this.chapterThreeGaidenBattleStartEventShown === true;
    this.chapterThreeGaidenRoundTwoReinforcementsSpawned = saveData.chapterThreeGaidenRoundTwoReinforcementsSpawned === true || this.chapterThreeGaidenRoundTwoReinforcementsSpawned === true;
    this.chapterThreeAshInterventionTriggered = saveData.chapterThreeAshInterventionTriggered === true || this.chapterThreeAshInterventionTriggered === true;
    this.mysteriousEggTracking = normalizeMysteriousEggTracking(saveData.mysteriousEggTracking);

    if (!Array.isArray(saveData.units)) return;

    const savedById = new Map(saveData.units.map((unitState) => [unitState.id, unitState]));
    const preserveMapPositions = saveData.inBattleSave === true || isChapterOne(this.currentChapterNumber);
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
          acted: saveData.inBattleSave === true ? saved.acted === true : false,
          spriteState: "idle",
        };
        if (restoreResources && merged.team === "player") {
          merged.hp = merged.maxHp || merged.hp || 1;
          merged.sigilPoints = merged.maxSigilPoints ?? merged.sigilPoints ?? 3;
        }
        return merged;
      })
      .filter(Boolean);

    if (isChapterThreeOrLater(this.currentChapterNumber)) {
      const existingIds = new Set(this.units.map((unit) => unit.id));
      const occupiedTiles = new Set(this.units.map((unit) => `${unit.x},${unit.y}`));
      const gaidenSpawnTiles = isChapterThreeGaiden(this.currentChapterNumber)
        ? [
          ...CHAPTER_THREE_GAIDEN_PLAYER_SPAWNS,
          { x: 1, y: 6, facing: "up" },
          { x: 2, y: 6, facing: "up" },
          { x: 3, y: 6, facing: "up" },
          { x: 4, y: 6, facing: "up" },
          { x: 5, y: 6, facing: "up" },
        ]
        : [];
      saveData.units
        .filter((unitState) => unitState.team === "player" && unitState.alive !== false && !existingIds.has(unitState.id))
        .forEach((unitState) => {
          const gaidenPlacement = gaidenSpawnTiles.find((tile) => !occupiedTiles.has(`${tile.x},${tile.y}`));
          this.units.push({
            ...unitState,
            team: "player",
            portraitKey: unitState.portraitKey || (String(unitState.id).startsWith("shade") ? "shadePortrait" : unitState.portraitKey),
            spriteSet: unitState.spriteSet || (String(unitState.id).startsWith("shade") ? "shade" : unitState.id),
            x: gaidenPlacement?.x ?? unitState.x,
            y: gaidenPlacement?.y ?? unitState.y,
            hp: restoreResources ? (unitState.maxHp || unitState.hp || 1) : Math.max(1, unitState.hp || 1),
            sigilPoints: restoreResources ? (unitState.maxSigilPoints ?? unitState.sigilPoints ?? 3) : (unitState.sigilPoints ?? 0),
            facing: gaidenPlacement?.facing || unitState.facing || "up",
            acted: saveData.inBattleSave === true ? unitState.acted === true : false,
            spriteState: "idle",
            skills: (unitState.skills || []).map((skill) => ({ ...skill })),
            weapons: (unitState.weapons || []).map((weapon) => ({ ...weapon })),
            items: (unitState.items || []).map((item) => ({ ...item })),
          });
          existingIds.add(unitState.id);
          if (gaidenPlacement) occupiedTiles.add(`${gaidenPlacement.x},${gaidenPlacement.y}`);
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
    const buildNextChapterSaveData = isChapterThree(this.currentChapterNumber) && this.shouldRouteToChapterThreeGaiden?.()
      ? buildChapterThreeGaidenSaveData
      : isChapterTwo(this.currentChapterNumber)
        ? buildChapterThreeSaveData
        : isChapterThree(this.currentChapterNumber) || isChapterThreeGaiden(this.currentChapterNumber)
          ? buildChapterThreeSaveData
          : buildChapterTwoSaveData;

    const reserveUnits = Array.isArray(this.chapterThreeReserveUnits) ? this.chapterThreeReserveUnits : [];
    const includeMarnie = this.marniePermanentlyRecruited === true;
    const playerUnits = this.units.filter((unit) => (
      unit.team === "player" &&
      unit.isMiloDecoy !== true &&
      (unit.id !== "marnie" || includeMarnie) &&
      (unit.id !== "milo" || unit.permanentRecruit === true)
    ));
    const seenPlayerIds = new Set(playerUnits.map((unit) => unit.id));
    const unitsToSave = [
      ...playerUnits,
      ...reserveUnits.filter((unit) => (
        unit?.team === "player" &&
        !seenPlayerIds.has(unit.id) &&
        (unit.id !== "marnie" || includeMarnie)
      )),
    ];

    const serializedUnits = unitsToSave
      .map((unit) => this.serializeUnitForSave(unit, { restoreForChapterStart: true }));
    const baseSaveData = buildNextChapterSaveData({
      slotNumber,
      defeatedAllies: this.defeatedAllies || [],
      marnieTalked: this.marnieTalked === true,
      marnieTemporarilyRecruited: this.marnieTemporarilyRecruited === true,
      marniePermanentlyRecruited: this.marniePermanentlyRecruited === true,
      lostChapterThreeGaidenChestItems: [...(this.lostChapterThreeGaidenChestItems || new Set())],
      mysteriousEggTracking: this.mysteriousEggTracking,
      units: serializedUnits,
    });
    const previousEggTracking = normalizeMysteriousEggTracking(this.mysteriousEggTracking);
    const mysteriousEggTracking = this.buildMysteriousEggTrackingForUnits(serializedUnits, {
      incrementForChapterCompletion: true,
      nextSaveData: baseSaveData,
    });
    const hatchJustReadied = previousEggTracking.hatchReady !== true && mysteriousEggTracking.hatchReady === true;
    if (hatchJustReadied && this.mysteriousEggHatchMessageShown !== true) {
      this.mysteriousEggHatchMessageShown = true;
      this.helpText?.setText(MYSTERIOUS_EGG_HATCH_MESSAGE);
      this.showCenteredPopup?.(MYSTERIOUS_EGG_HATCH_MESSAGE);
    }

    return {
      ...baseSaveData,
      mysteriousEggTracking,
    };
  },

  buildCurrentTurnSaveData(slotNumber = null) {
    const chapterNumber = getSaveDataChapterNumber({ currentChapter: this.currentChapterNumber }, this.currentChapterNumber);
    const chapterTitle = this.levelData?.title || this.levelData?.name || "Battle";
    const serializedUnits = this.units
      .filter((unit) => unit && unit.isMiloDecoy !== true)
      .map((unit) => ({
        ...this.serializeUnitForSave(unit, { restoreForChapterStart: false }),
        acted: unit.acted === true,
        counterStance: unit.counterStance === true,
        counterUsed: unit.counterUsed === true,
        unconsciousTurns: unit.unconsciousTurns || 0,
        immobilizedTurns: unit.immobilizedTurns || 0,
        trapped: unit.trapped === true,
      }));
    this.mysteriousEggTracking = this.buildMysteriousEggTrackingForUnits(serializedUnits);
    return {
      version: 6,
      inBattleSave: true,
      slotNumber,
      currentChapter: chapterNumber,
      chapter: chapterNumber,
      chapterTitle,
      completedChapters: Array.isArray(this.loadedSaveData?.completedChapters) ? [...this.loadedSaveData.completedChapters] : [],
      savedAt: new Date().toISOString(),
      defeatedAllies: [...new Set(this.defeatedAllies || [])],
      defeatedCivilians: [...(this.defeatedCivilians || [])],
      marnieTalked: this.marnieTalked === true,
      marnieTemporarilyRecruited: this.marnieTemporarilyRecruited === true,
      marniePermanentlyRecruited: this.marniePermanentlyRecruited === true,
      lostChapterThreeGaidenChestItems: [...(this.lostChapterThreeGaidenChestItems || new Set())],
      openedFactoryContainers: [...(this.openedFactoryContainers || new Set())],
      destroyedFactoryTerrain: [...(this.destroyedFactoryTerrain || new Set())],
      ignitedFactorySpills: [...(this.ignitedFactorySpills || new Set())],
      factoryTerrainHp: { ...(this.factoryTerrainHp || {}) },
      chapterThreeBonusThorns: (this.chapterThreeBonusThorns || []).map((thorn) => ({ ...thorn })),
      visitedChapterThreeCottages: [...(this.visitedChapterThreeCottages || new Set())],
      chapterTwoTurns: this.chapterTwoTurns || 0,
      chapterThreeTurns: this.chapterThreeTurns || 0,
      chapterTwoSetupDone: this.chapterTwoSetupDone === true,
      chapterThreeFirstEnemyPhaseDone: this.chapterThreeFirstEnemyPhaseDone === true,
      chapterThreeBattleStartDialogueShown: this.chapterThreeBattleStartDialogueShown === true,
      chapterThreeGaidenBattleStartEventShown: this.chapterThreeGaidenBattleStartEventShown === true,
      chapterThreeGaidenRoundTwoReinforcementsSpawned: this.chapterThreeGaidenRoundTwoReinforcementsSpawned === true,
      chapterThreeAshInterventionTriggered: this.chapterThreeAshInterventionTriggered === true,
      mysteriousEggTracking: this.mysteriousEggTracking,
      units: serializedUnits,
    };
  },

  startLoadedBattle() {
    this.openingContainer.setVisible(false);

    const saveData = this.loadedSaveData || this.getSavedGameData();
    const savedChapter = getSaveDataChapterNumber(saveData);

    if (saveData?.inBattleSave === true) {
      this.phase = "player";
      this.setObjectiveDisplayVisible(true);
      this.busy = false;
      this.selectedUnitId = this.units.find((unit) => unit.team === "player" && unit.hp > 0)?.id || null;
      this.redrawSelection();
      this.updateSelectedPanel();
      this.helpText.setText("Loaded current turn.");
      return;
    }

    if (isChapterThreeGaiden(savedChapter)) {
      this.pendingChapterThreeTransitionData = saveData || this.pendingChapterThreeTransitionData;
      this.startChapterThreeGaidenOpening();
      return;
    }

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
