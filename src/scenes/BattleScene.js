import Phaser from "phaser";
import { GAME_HEIGHT, GAME_WIDTH, TILE_SIZE } from "../config/constants.js";
import { queueChapterAssets } from "../data/assets.js";
import { CHAPTER_ONE_OPENING } from "../chapters/chapter1.js";
import { getSaveDataChapterNumber, isChapterTwoOrLater } from "../chapters/progression.js";
import { flowMethods } from "./battle/flowMethods.js";
import { uiMethods } from "./battle/uiMethods.js";
import { combatMethods } from "./battle/combatMethods.js";
import { narrativeMethods } from "./battle/narrativeMethods.js";
import { boardSpriteMethods } from "./battle/boardSpriteMethods.js";
import { chapterSetupMethods } from "./battle/chapterSetupMethods.js";
import { playerActionMethods } from "./battle/playerActionMethods.js";
import { enemyAiMethods } from "./battle/enemyAiMethods.js";
export class BattleScene extends Phaser.Scene {
  constructor() {
    super("BattleScene");
  }

  init(data = {}) {
    this.loadFromSave = data.loadFromSave === true;
    this.loadedSaveData = data.saveData || null;
    this.loadedSlotNumber = data.slotNumber || null;
    this.playChapterTwoOpening = data.playChapterTwoOpening === true;
    this.skipChapterTwoTitleCard = data.skipChapter2TitleCard === true;
    this.pendingChapterTwoTransitionData = data.pendingChapterTwoTransitionData || null;
    this.currentChapterNumber = getSaveDataChapterNumber(this.loadedSaveData);
  }

  preload() {
    queueChapterAssets(this, this.getCurrentLevel());
  }

  create() {
    this.levelData = this.getCurrentLevel();
    this.currentBiomeKey = this.levelData.biome;
    this.map = this.levelData.map;
    this.mapRows = this.map.length;
    this.mapCols = this.map[0]?.length || 0;
    this.units = this.levelData.units.map((unit) => ({
      ...unit,
      luck: unit.luck ?? 0,
      facing: unit.facing || "down",
      spriteState: unit.spriteState || "idle",
      sigilPoints: unit.sigilPoints ?? 3,
      maxSigilPoints: unit.maxSigilPoints ?? 3,
      skills: (unit.skills || []).map((skill) => ({ ...skill })),
      weapons: (unit.weapons || []).map((weapon) => ({ ...weapon })),
      items: (unit.items || []).map((item) => ({ ...item })),
    }));

    this.defeatedAllies = [];
    this.capturedForts = new Set();
    this.chapterTwoTurns = 0;
    this.chapterTwoSetupDone = false;
    this.applyLoadedSaveData(this.loadedSaveData);

    this.selectedUnitId = null;
    this.moveTiles = [];
    this.targetTiles = [];
    this.unitSprites = {};
    this.phase = "intro";
    this.busy = false;
    this.previewOpen = false;
    this.previewData = null;
    this.actionMenuOpen = false;
    this.actionMenuUnitId = null;
    this.actionMenuContainer = null;
    this.selectionMenuOpen = false;
    this.selectionMenuType = null;
    this.selectionMenuContainer = null;
    this.selectionMenuSummaryText = null;
    this.pendingItemUse = null;
    this.targetTileColor = null;
    this.targetTileStroke = null;
    this.skillBannerContainer = null;
    this.skillBannerText = null;
    this.standardBattleSceneOpen = false;
    this.standardBattleContainer = null;
    this.allyDeathContainer = null;
    this.pendingAllyDeathContinue = null;
    this.chapterTransitionContainer = null;
    this.battleMusic = null;
    this.battleMusicStarted = false;
    this.postBattleStep = 0;
    this.postBattleActionSteps = new Set();
    this.postBattleStarted = false;
    this.levelUpQueue = [];
    this.pendingLevelUpCallbacks = [];
    this.levelUpAllocationOpen = false;
    this.currentLevelUpData = null;
    this.openingStep = 0;
    this.openingLine = 0;
    this.activeOpeningSequence = CHAPTER_ONE_OPENING;

    this.cameras.main.setBackgroundColor("#0f172a");
    this.boardWidth = this.mapCols * TILE_SIZE;
    this.boardHeight = this.mapRows * TILE_SIZE;
    this.boardX = 200;
    this.boardY = 14;
    this.tileLayer = this.add.layer();
    this.escapeLayer = this.add.layer();
    this.overlayLayer = this.add.layer();
    this.unitLayer = this.add.layer();
    this.uiLayer = this.add.layer();

    this.createTopUI();
    this.drawBoard();
    this.createEscapeCursor();
    this.drawUnits();
    this.createSidePanel();
    this.createPreviewUI();
    this.createStandardBattleSceneUI();
    this.createCombatXpPopup();
    this.createSkillBanner();
    this.createLevelUpAllocationUI();
    this.createOpeningUI();
    this.createPostBattleUI();
    this.createAllyDeathCutsceneUI();
    this.createChapterTransitionUI();
    this.setupInput();
    this.updateSelectedPanel();
    this.setObjectiveDisplayVisible(false);

    if (isChapterTwoOrLater(this.currentChapterNumber) && this.playChapterTwoOpening) {
      this.startChapterTwoOpening();
    } else if (this.loadFromSave) {
      this.startLoadedBattle();
    } else {
      this.activeOpeningSequence = CHAPTER_ONE_OPENING;
      this.updateOpeningUI();
    }
  }
}

Object.assign(
  BattleScene.prototype,
  flowMethods,
  uiMethods,
  combatMethods,
  narrativeMethods,
  boardSpriteMethods,
  chapterSetupMethods,
  playerActionMethods,
  enemyAiMethods
);
