import Phaser from "phaser";
import { GAME_HEIGHT, GAME_WIDTH, TILE_SIZE } from "../config/constants.js";
import { queueChapterAssets } from "../data/assets.js";
import { CHAPTER_ONE_OPENING } from "../chapters/chapter1.js";
import {
  getSceneDataChapterNumber,
  isChapterThreeGaiden,
  isChapterThreeOrLater,
  isChapterTwo,
} from "../chapters/progression.js";
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
    this.playChapterThreeOpening = data.playChapterThreeOpening === true;
    this.playChapterThreeGaidenOpening = data.playChapterThreeGaidenOpening === true;
    this.skipChapterTwoTitleCard = data.skipChapter2TitleCard === true;
    this.skipChapterThreeTitleCard = data.skipChapter3TitleCard === true;
    this.pendingChapterTwoTransitionData = data.pendingChapterTwoTransitionData || null;
    this.pendingChapterThreeTransitionData = data.pendingChapterThreeTransitionData || null;
    this.currentChapterNumber = getSceneDataChapterNumber(data);
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
    this.chapterThreeTurns = 0;
    this.visitedChapterThreeCottages = new Set();
    this.defeatedCivilians = [];
    this.chapterThreeFirstEnemyPhaseDone = false;
    this.chapterThreeBattleStartDialogueShown = false;
    this.chapterThreeGaidenBattleStartEventShown = false;
    this.chapterThreeGaidenRoundTwoReinforcementsSpawned = false;
    this.chapterThreeAshInterventionTriggered = false;
    this.chapterThreeDeploymentDone = false;
    this.chapterThreeDeploymentRoster = [];
    this.chapterThreeSelectedDeployIds = new Set();
    this.chapterThreeReserveUnits = [];
    this.pendingChapterThreeDeploymentComplete = null;
    this.chapterThreeRewardsHandled = false;
    this.pendingChapterThreeRewards = [];
    this.chapterThreeRewardIndex = 0;
    this.chapterThreeMiloResolutionHandled = false;
    this.chapterThreeGaidenMarnieResolutionHandled = false;
    this.marnieTalked = false;
    this.marnieTemporarilyRecruited = false;
    this.marniePermanentlyRecruited = false;
    this.pendingMiloRescue = null;
    this.miloSigilContainer = null;
    this.openedFactoryContainers = new Set();
    this.destroyedFactoryTerrain = new Set();
    this.ignitedFactorySpills = new Set();
    this.factoryTerrainHp = {};
    this.chapterThreeBonusThorns = [];
    this.lostChapterThreeGaidenChestItems = new Set();
    this.mysteriousEggTracking = { carrierId: null, chaptersWithCarrier: 0, hatchReady: false };
    this.mysteriousEggHatchMessageShown = false;
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
    this.battleContextMenuOpen = false;
    this.battleContextMenuContainer = null;
    this.battleSaveSlotContainer = null;
    this.pendingItemUse = null;
    this.pendingParleyUse = null;
    this.pendingPhoenixReckoningUse = null;
    this.pendingFieldOfThornsUse = null;
    this.pendingSingleTargetSkillUse = null;
    this.tradeContainer = null;
    this.tradeOpen = false;
    this.tradeData = null;
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
    this.boardX = Math.max(14, Math.floor((722 - this.boardWidth) / 2));
    this.boardY = 14;
    this.tileLayer = this.add.layer();
    this.escapeLayer = this.add.layer();
    this.thornLayer = this.add.layer();
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

    if (isChapterThreeGaiden(this.currentChapterNumber) && this.playChapterThreeGaidenOpening) {
      this.startChapterThreeGaidenOpening();
    } else if (isChapterThreeOrLater(this.currentChapterNumber) && this.playChapterThreeOpening) {
      this.startChapterThreeOpening();
    } else if (isChapterTwo(this.currentChapterNumber) && this.playChapterTwoOpening) {
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
