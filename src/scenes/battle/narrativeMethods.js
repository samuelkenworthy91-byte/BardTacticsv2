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
  CHAPTER_TWO_POST_BATTLE_SCENE,
  CHAPTER_TWO_TITLE,
} from "../../chapters/chapter2.js";
import {
  CHAPTER_THREE_OPENING,
  CHAPTER_THREE_POST_BATTLE_SCENE,
  CHAPTER_THREE_TITLE,
} from "../../chapters/chapter3.js";
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
export const narrativeMethods = {
  createPostBattleUI() {
    this.postBattleContainer = this.add.container(0, 0).setVisible(false).setDepth(9997);
    this.postBattleDim = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.18);
    this.postBattleFullSceneImage = this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, "byronFarmScene").setDisplaySize(GAME_WIDTH, GAME_HEIGHT).setVisible(false);
    this.postBattleMainPanel = this.add.rectangle(480, 250, 860, 430, 0x020617, 0.78);
    this.postBattleMainPanel.setStrokeStyle(2, 0x475569);
    this.postBattleSceneFrame = this.add.rectangle(315, 175, 560, 315, 0x111827, 1);
    this.postBattleSceneFrame.setStrokeStyle(2, 0x64748b);
    this.postBattleSceneImage = this.add.image(315, 175, "vanInteriorScene");
    this.fitImageInBox(this.postBattleSceneImage, "vanInteriorScene", 548, 308);
    this.postBattleSceneName = this.add.text(54, 30, "", { fontSize: "16px", color: "#e8c98b", fontStyle: "bold" });
    this.postBattlePortraitPanel = this.add.rectangle(720, 175, 180, 200, 0x111827, 1);
    this.postBattlePortraitPanel.setStrokeStyle(2, 0x64748b);
    this.postBattlePortraitFrame = this.add.rectangle(720, 160, 120, 140, 0x1f2937);
    this.postBattlePortraitFrame.setStrokeStyle(2, 0x64748b);
    this.postBattlePortrait = this.add.image(720, 160, "leonPortrait").setDisplaySize(110, 132);
    this.postBattleOverlapPortrait = this.add.image(682, 164, "heathPortrait").setDisplaySize(90, 108).setAlpha(0.9).setVisible(false);
    this.postBattlePortraitPlaceholder = this.add.text(720, 160, "NO ART", { fontSize: "20px", color: "#94a3b8", align: "center" }).setOrigin(0.5);
    this.postBattleTextBox = this.add.rectangle(480, 395, 800, 120, 0x1a0d2a, 0.98);
    this.postBattleTextBox.setStrokeStyle(2, 0xb6925f);
    this.postBattleSpeaker = this.add.text(90, 343, "", { fontSize: "24px", fontStyle: "bold", color: "#f7ecd3" });
    this.postBattleText = this.add.text(90, 378, "", { fontSize: "20px", color: "#eadff7", wordWrap: { width: 660 }, lineSpacing: 8 });
    this.postBattleNextButton = this.add.rectangle(820, 460, 110, 34, 0x2563eb);
    this.postBattleNextButton.setStrokeStyle(2, 0x93c5fd);
    this.postBattleNextButton.setInteractive({ useHandCursor: true });
    this.postBattleNextButton.on("pointerdown", () => this.advancePostBattle());
    this.postBattleNextLabel = this.add.text(785, 449, "Next", { fontSize: "16px", fontStyle: "bold", color: "#f7ecd3" });
    this.savePromptContainer = this.add.container(GAME_WIDTH / 2, GAME_HEIGHT / 2).setVisible(false);
    const saveBg = this.add.rectangle(0, 0, 430, 230, 0x020617, 0.96);
    saveBg.setStrokeStyle(2, 0xfcd34d);
    this.savePromptTitle = this.add.text(0, -72, "Chapter 1 Complete", { fontSize: "30px", fontStyle: "bold", color: "#e8c98b" }).setOrigin(0.5);
    this.savePromptText = this.add.text(0, -28, "Save game?", { fontSize: "20px", color: "#f8fafc" }).setOrigin(0.5);
    const saveButton = this.add.rectangle(-92, 48, 130, 40, 0x2563eb);
    saveButton.setStrokeStyle(2, 0x93c5fd);
    saveButton.setInteractive({ useHandCursor: true });
    saveButton.on("pointerdown", () => this.showSaveSlotSelection());
    const saveButtonText = this.add.text(-92, 48, "Save", { fontSize: "18px", fontStyle: "bold", color: "#f7ecd3" }).setOrigin(0.5);
    const continueButton = this.add.rectangle(92, 48, 130, 40, 0x334155);
    continueButton.setStrokeStyle(2, 0x94a3b8);
    continueButton.setInteractive({ useHandCursor: true });
    continueButton.on("pointerdown", () => this.finishCurrentChapter());
    const continueButtonText = this.add.text(92, 48, "Continue", { fontSize: "18px", fontStyle: "bold", color: "#f7ecd3" }).setOrigin(0.5);
    this.savePromptStatus = this.add.text(0, 92, "", { fontSize: "14px", color: "#86efac" }).setOrigin(0.5);
    this.savePromptContainer.add([saveBg, this.savePromptTitle, this.savePromptText, saveButton, saveButtonText, continueButton, continueButtonText, this.savePromptStatus]);
    this.postBattleContainer.add([
      this.postBattleDim,
      this.postBattleFullSceneImage,
      this.postBattleMainPanel,
      this.postBattleSceneFrame,
      this.postBattleSceneImage,
      this.postBattleSceneName,
      this.postBattlePortraitPanel,
      this.postBattlePortraitFrame,
      this.postBattleOverlapPortrait,
      this.postBattlePortrait,
      this.postBattlePortraitPlaceholder,
      this.postBattleTextBox,
      this.postBattleSpeaker,
      this.postBattleText,
      this.postBattleNextButton,
      this.postBattleNextLabel,
      this.savePromptContainer,
    ]);
    this.uiLayer.add(this.postBattleContainer);
  },

  setPostBattlePortrait(portraitKey, overlapPortraitKey = null) {
    this.postBattleOverlapPortrait.setVisible(false);
    if (!portraitKey) {
      this.postBattlePortraitPanel.setVisible(false);
      this.postBattlePortraitFrame.setVisible(false);
      this.postBattlePortrait.setVisible(false);
      this.postBattlePortraitPlaceholder.setVisible(false);
      return;
    }
    this.postBattlePortraitPanel.setVisible(true);
    this.postBattlePortraitFrame.setVisible(true);
    if (this.textures.exists(portraitKey)) {
      this.postBattlePortrait.setTexture(portraitKey).setDisplaySize(110, 132).setVisible(true);
      this.postBattlePortraitPlaceholder.setVisible(false);
    } else {
      this.postBattlePortrait.setVisible(false);
      this.postBattlePortraitPlaceholder.setVisible(true);
    }
    if (overlapPortraitKey && this.textures.exists(overlapPortraitKey)) {
      this.postBattleOverlapPortrait.setTexture(overlapPortraitKey).setDisplaySize(90, 108).setVisible(true);
      this.postBattleOverlapPortrait.setDepth(this.postBattlePortrait.depth + 1);
    }
  },

  startPostBattleScene() {
    if (this.postBattleStarted) return;
    this.closeActionMenu();
    this.stopBattleMusic();
    this.postBattleStarted = true;
    this.phase = "postbattle";
    this.busy = true;
    this.previewOpen = false;
    this.previewData = null;
    if (this.previewContainer) this.previewContainer.setVisible(false);
    this.selectedUnitId = null;
    this.moveTiles = [];
    this.targetTiles = [];
    this.overlayLayer.removeAll(true);
    this.updateSelectedPanel();
    this.phaseText.setText("Chapter Complete");
    this.phaseText.setColor("#86efac");
    this.helpText.setText("The battle is over.");
    this.postBattleStep = 0;
    this.postBattleActionSteps = new Set();
    this.postBattleContainer.setVisible(true).setAlpha(0);
    this.tweens.add({ targets: this.postBattleContainer, alpha: 1, duration: 250, onComplete: () => this.updatePostBattleUI() });
  },

  getPostBattleScene() {
    if (isChapterThree(this.currentChapterNumber)) return CHAPTER_THREE_POST_BATTLE_SCENE;
    if (isChapterTwo(this.currentChapterNumber)) return CHAPTER_TWO_POST_BATTLE_SCENE;
    return POST_BATTLE_SCENE;
  },

  playPostBattleUnitDeath(unitId, autoAdvanceDelay = 1400) {
    if (this.postBattleActionSteps.has(this.postBattleStep)) return;
    this.postBattleActionSteps.add(this.postBattleStep);
    const unit = this.units.find((candidate) => candidate.id === unitId);
    const sprite = this.unitSprites[unitId];
    if (unit && sprite) {
      unit.hp = 0;
      this.refreshUnitSprite(unit);
      this.playUnitDeath(unit, () => this.removeUnitSpriteAndData(unitId));
    } else if (sprite) {
      this.tweens.add({ targets: sprite.container, alpha: 0, duration: 650, ease: "Quad.Out", onComplete: () => this.removeUnitSpriteAndData(unitId) });
    } else {
      this.units = this.units.filter((candidate) => candidate.id !== unitId);
    }
    this.time.delayedCall(autoAdvanceDelay, () => {
      if (this.phase !== "postbattle") return;
      this.postBattleStep += 1;
      this.updatePostBattleUI();
    });
  },

  updatePostBattleUI() {
    const scene = this.getPostBattleScene();
    const line = scene[this.postBattleStep];
    if (!line) {
      this.showSavePrompt();
      return;
    }
    this.savePromptContainer.setVisible(false);
    this.postBattleNextButton.setVisible(line.type !== "savePrompt");
    this.postBattleNextLabel.setVisible(line.type !== "savePrompt");
    this.postBattleFullSceneImage.setVisible(false);
    this.postBattleMainPanel.setVisible(true);
    this.postBattleSceneFrame.setVisible(false);
    this.postBattleSceneImage.setVisible(false);
    this.postBattleSceneName.setVisible(false);
    this.postBattlePortraitPanel.setVisible(true);
    this.postBattlePortraitFrame.setVisible(true);
    this.postBattlePortrait.setVisible(true);
    this.postBattlePortraitPlaceholder.setVisible(false);
    this.postBattleTextBox.setVisible(true);
    this.postBattleSpeaker.setVisible(true);
    this.postBattleText.setVisible(true);
    this.postBattleDim.setAlpha(0.18);
    if (line.type === "savePrompt") {
      this.showSavePrompt(line);
      return;
    }
    if (line.type === "fullScreenScene") {
      this.postBattleDim.setAlpha(1);
      if (line.scene && this.textures.exists(line.scene)) this.fitImageInBox(this.postBattleFullSceneImage, line.scene, GAME_WIDTH, GAME_HEIGHT);
      this.postBattleFullSceneImage.setVisible(true);
      this.postBattleMainPanel.setVisible(false);
      this.postBattleSceneFrame.setVisible(false);
      this.postBattleSceneImage.setVisible(false);
      this.postBattleSceneName.setVisible(false);
      this.postBattlePortraitPanel.setVisible(false);
      this.postBattlePortraitFrame.setVisible(false);
      this.postBattlePortrait.setVisible(false);
      this.postBattleOverlapPortrait.setVisible(false);
      this.postBattlePortraitPlaceholder.setVisible(false);
      this.postBattleSpeaker.setText(line.sceneName || "");
      this.postBattleText.setText(line.text || "");
      return;
    }
    if (line.type === "unitDeath") {
      this.postBattleDim.setAlpha(0.08);
      this.postBattleMainPanel.setVisible(false);
      this.postBattleSceneFrame.setVisible(false);
      this.postBattleSceneImage.setVisible(false);
      this.postBattleSceneName.setVisible(false);
      this.postBattlePortraitPanel.setVisible(false);
      this.postBattlePortraitFrame.setVisible(false);
      this.postBattlePortrait.setVisible(false);
      this.postBattleOverlapPortrait.setVisible(false);
      this.postBattlePortraitPlaceholder.setVisible(false);
      this.postBattleTextBox.setVisible(false);
      this.postBattleSpeaker.setVisible(false);
      this.postBattleText.setVisible(false);
      this.postBattleNextButton.setVisible(false);
      this.postBattleNextLabel.setVisible(false);
      this.playPostBattleUnitDeath(line.unitId, line.autoAdvanceDelay || 1400);
      return;
    }
    if (line.type === "sceneDialogue" || line.type === "sceneNarration" || line.type === "overlapDialogue") {
      this.postBattleDim.setAlpha(0.82);
      this.postBattleSceneFrame.setVisible(true);
      this.postBattleSceneImage.setVisible(true);
      this.postBattleSceneName.setVisible(true);
      this.postBattleSceneName.setText(line.sceneName || "");
      if (line.scene && this.textures.exists(line.scene)) this.fitImageInBox(this.postBattleSceneImage, line.scene, 548, 308);
    }
    if (line.type === "mapDialogue" || line.type === "mapAction") {
      this.postBattleDim.setAlpha(0.18);
      this.postBattleSceneFrame.setVisible(false);
      this.postBattleSceneImage.setVisible(false);
      this.postBattleSceneName.setVisible(false);
    }
    this.postBattleSpeaker.setText(line.speaker || "");
    this.postBattleText.setText(line.text || "");
    this.setPostBattlePortrait(line.portrait, line.overlapPortrait);
  },

  advancePostBattle() {
    if (this.phase !== "postbattle") return;
    const scene = this.getPostBattleScene();
    this.postBattleStep += 1;
    if (this.postBattleStep >= scene.length) {
      this.showSavePrompt();
      return;
    }
    this.updatePostBattleUI();
  },

  showSavePrompt(line = null) {
    this.postBattleDim.setAlpha(1);
    this.postBattleFullSceneImage.setVisible(false);
    if (this.textures.exists("byronFarmScene")) this.fitImageInBox(this.postBattleFullSceneImage, "byronFarmScene", GAME_WIDTH, GAME_HEIGHT);
    this.postBattleFullSceneImage.setVisible(true);
    this.postBattleMainPanel.setVisible(false);
    this.postBattleSceneFrame.setVisible(false);
    this.postBattleSceneImage.setVisible(false);
    this.postBattleSceneName.setVisible(false);
    this.postBattlePortraitPanel.setVisible(false);
    this.postBattlePortraitFrame.setVisible(false);
    this.postBattlePortrait.setVisible(false);
    this.postBattleOverlapPortrait.setVisible(false);
    this.postBattlePortraitPlaceholder.setVisible(false);
    this.postBattleTextBox.setVisible(false);
    this.postBattleSpeaker.setVisible(false);
    this.postBattleText.setVisible(false);
    this.postBattleNextButton.setVisible(false);
    this.postBattleNextLabel.setVisible(false);
    this.savePromptTitle.setText(line?.title || "Chapter 1 Complete");
    this.savePromptText.setText(line?.text || "Save game?");
    this.savePromptStatus.setText("");
    this.savePromptContainer.setVisible(true);
  },

  saveChapterOne() {
    this.showSaveSlotSelection();
  },

  showSaveSlotSelection() {
    if (this.saveSlotContainer) this.saveSlotContainer.destroy();

    this.savePromptContainer.setVisible(false);
    this.saveSlotContainer = this.add.container(GAME_WIDTH / 2, GAME_HEIGHT / 2);

    const panel = createBannerPanel(this, 0, 0, 560, 330, { innerInset: 16 });
    const title = this.add.text(0, -132, "Choose Save Slot", {
      fontSize: "28px",
      fontStyle: "bold",
      color: "#e8c98b",
      stroke: "#0b0811",
      strokeThickness: 4,
    }).setOrigin(0.5);

    const subtitle = this.add.text(0, -96, "Saving stores your units, stats, items, XP, and chapter progress.", {
      fontSize: "13px",
      color: "#d8c4f0",
      align: "center",
      wordWrap: { width: 500 },
    }).setOrigin(0.5);

    this.saveSlotStatusText = this.add.text(0, 116, "", {
      fontSize: "13px",
      color: "#86efac",
      align: "center",
      wordWrap: { width: 500 },
    }).setOrigin(0.5);

    this.saveSlotContainer.add([panel.container, title, subtitle, this.saveSlotStatusText]);

    for (let slotNumber = 1; slotNumber <= SAVE_SLOT_COUNT; slotNumber += 1) {
      const button = createBannerButton(this, 0, -48 + (slotNumber - 1) * 52, 500, 38, getSaveSlotLabel(slotNumber), () => {
        this.saveChapterOneToSlot(slotNumber);
      }, "13px");
      this.saveSlotContainer.add(button.container);
    }

    const backButton = createBannerButton(this, -118, 156, 160, 34, "Back", () => {
      if (this.saveSlotContainer) this.saveSlotContainer.destroy();
      this.saveSlotContainer = null;
      this.savePromptContainer.setVisible(true);
    }, "15px");

    const continueButton = createBannerButton(this, 118, 156, 160, 34, "Continue", () => this.finishCurrentChapter(), "15px");

    this.saveSlotContainer.add([backButton.container, continueButton.container]);
    this.postBattleContainer.add(this.saveSlotContainer);
  },

  saveChapterOneToSlot(slotNumber) {
    const saveData = this.buildChapterSaveData(slotNumber);

    try {
      window.localStorage.setItem(getSaveSlotKey(slotNumber), JSON.stringify(saveData));
      this.pendingChapterTwoTransitionData = saveData;
      const statusText = isChapterTwo(this.currentChapterNumber)
        ? `Saved to Slot ${slotNumber}. Moving to Chapter 3...`
        : isChapterThree(this.currentChapterNumber)
          ? `Saved to Slot ${slotNumber}.`
          : `Saved to Slot ${slotNumber}. Moving to Chapter 2...`;
      if (this.saveSlotStatusText) this.saveSlotStatusText.setText(statusText);
      this.time.delayedCall(550, () => this.finishCurrentChapter());
    } catch (error) {
      if (this.saveSlotStatusText) this.saveSlotStatusText.setText("Save failed in this browser preview.");
    }
  },

  finishChapterOne() {
    if (this.saveSlotContainer) {
      this.saveSlotContainer.destroy();
      this.saveSlotContainer = null;
    }

    this.pendingChapterTwoTransitionData = this.pendingChapterTwoTransitionData || this.buildChapterSaveData(this.loadedSlotNumber || null);
    this.currentChapterNumber = CHAPTER_TWO_NUMBER;
    this.phaseText.setText("Chapter 2");
    this.phaseText.setColor("#fcd34d");
    this.helpText.setText("Chapter 2: Owed an Explanation.");
    this.busy = true;
    this.showChapterTwoTitleCard();
  },

  finishChapterTwo() {
    if (this.saveSlotContainer) {
      this.saveSlotContainer.destroy();
      this.saveSlotContainer = null;
    }

    this.pendingChapterThreeTransitionData = this.pendingChapterThreeTransitionData || this.buildChapterSaveData(this.loadedSlotNumber || null);
    this.currentChapterNumber = CHAPTER_THREE_NUMBER;
    this.phaseText.setText("Chapter 3");
    this.phaseText.setColor("#fcd34d");
    this.helpText.setText("Chapter 3: Tipen Whippet.");
    this.busy = true;
    this.showChapterThreeTitleCard();
  },

  finishCurrentChapter() {
    if (isChapterThree(this.currentChapterNumber)) {
      if (this.saveSlotContainer) {
        this.saveSlotContainer.destroy();
        this.saveSlotContainer = null;
      }
      this.scene.start("MainMenuScene");
      return;
    }
    if (isChapterTwo(this.currentChapterNumber)) {
      this.finishChapterTwo();
      return;
    }
    this.finishChapterOne();
  },

  createAllyDeathCutsceneUI() {
    this.allyDeathContainer = this.add.container(0, 0).setVisible(false).setDepth(22000).setAlpha(0);
    const dim = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.62);
    dim.setInteractive();

    const panel = createBannerPanel(this, GAME_WIDTH / 2, GAME_HEIGHT / 2, 780, 250, { innerInset: 16 });
    this.allyDeathPortraitFrame = this.add.rectangle(196, 270, 128, 150, 0x1f2937, 1);
    this.allyDeathPortraitFrame.setStrokeStyle(2, 0xe4d0a8, 0.9);
    this.allyDeathPortrait = this.add.image(196, 270, "leonPortrait").setDisplaySize(118, 140);
    this.allyDeathSpeakerText = this.add.text(286, 208, "", {
      fontSize: "26px",
      fontStyle: "bold",
      color: "#f7ecd3",
      stroke: "#0b0811",
      strokeThickness: 4,
    });
    this.allyDeathLineText = this.add.text(286, 252, "", {
      fontSize: "22px",
      color: "#eadff7",
      wordWrap: { width: 520 },
      lineSpacing: 8,
    });

    const continueButton = createBannerButton(this, GAME_WIDTH / 2 + 250, GAME_HEIGHT / 2 + 84, 150, 36, "Continue", () => this.continueAllyDeathCutscene(), "16px");

    this.allyDeathContainer.add([
      dim,
      panel.container,
      this.allyDeathPortraitFrame,
      this.allyDeathPortrait,
      this.allyDeathSpeakerText,
      this.allyDeathLineText,
      continueButton.container,
    ]);

    this.uiLayer.add(this.allyDeathContainer);
  },

  showAllyDeathCutscene(unit, onContinue = null) {
    if (!unit || !this.allyDeathContainer) {
      if (typeof onContinue === "function") onContinue();
      return;
    }

    this.pendingAllyDeathContinue = onContinue;
    this.allyDeathSpeakerText.setText(unit.name || "Ally");
    this.allyDeathLineText.setText(unit.deathLine || ALLIED_DEATH_LINES[unit.id] || "I have to fall back...");

    if (unit.portraitKey && this.textures.exists(unit.portraitKey)) {
      this.allyDeathPortrait.setTexture(unit.portraitKey).setDisplaySize(118, 140).setVisible(true);
    } else {
      this.allyDeathPortrait.setVisible(false);
    }

    this.allyDeathContainer.setVisible(true).setAlpha(0);
    this.tweens.add({ targets: this.allyDeathContainer, alpha: 1, duration: 220, ease: "Quad.Out" });
  },

  continueAllyDeathCutscene() {
    const onContinue = this.pendingAllyDeathContinue;
    this.pendingAllyDeathContinue = null;

    this.tweens.add({
      targets: this.allyDeathContainer,
      alpha: 0,
      duration: 180,
      ease: "Quad.Out",
      onComplete: () => {
        this.allyDeathContainer.setVisible(false);
        if (typeof onContinue === "function") onContinue();
      },
    });
  },

  isChapterOneGameOverDeath(unit) {
    return isChapterOne(this.currentChapterNumber) && !!unit && CHAPTER_ONE_GAME_OVER_UNIT_IDS.includes(unit.id);
  },

  handleAllyUnitDeath(unit, onComplete = null) {
    if (!unit) {
      if (typeof onComplete === "function") onComplete();
      return;
    }

    const isGameOverDeath = this.isChapterOneGameOverDeath(unit);
    this.defeatedAllies = [...new Set([...(this.defeatedAllies || []), unit.id])];

    this.showAllyDeathCutscene(unit, () => {
      this.playUnitDeath(unit, () => {
        this.removeUnitSpriteAndData(unit.id);

        if (isGameOverDeath) {
          this.triggerGameOverLoadScreen(unit);
          return;
        }

        if (typeof onComplete === "function") onComplete();
      });
    });
  },

  triggerGameOverLoadScreen(unit) {
    this.stopBattleMusic();
    this.phase = "defeat";
    this.phaseText.setText("Game Over");
    this.phaseText.setColor("#f87171");
    this.helpText.setText(`${unit?.name || "An ally"} has fallen. Loading save slots...`);
    this.busy = true;
    this.updateSelectedPanel();

    this.time.delayedCall(850, () => {
      this.scene.start("LoadGameScene", { fromGameOver: true, defeatedUnitName: unit?.name || "An ally" });
    });
  },

  createChapterTransitionUI() {
    this.chapterTransitionContainer = this.add.container(0, 0).setVisible(false).setDepth(23000).setAlpha(0);

    const dim = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.9);
    dim.setInteractive();
    const panel = createBannerPanel(this, GAME_WIDTH / 2, GAME_HEIGHT / 2, 600, 280, { innerInset: 18 });

    this.chapterTransitionChapterText = this.add.text(GAME_WIDTH / 2, 214, CHAPTER_TWO_TITLE.chapter, {
      fontSize: "44px",
      fontStyle: "bold",
      color: "#f7ecd3",
      stroke: "#0b0811",
      strokeThickness: 6,
    }).setOrigin(0.5);

    this.chapterTransitionSubtitleText = this.add.text(GAME_WIDTH / 2, 272, CHAPTER_TWO_TITLE.subtitle, {
      fontSize: "30px",
      color: "#e8c98b",
      stroke: "#0b0811",
      strokeThickness: 4,
    }).setOrigin(0.5);

    this.chapterTransitionHintText = this.add.text(GAME_WIDTH / 2, 326, "Continue into the Chapter 2 opening.", {
      fontSize: "14px",
      color: "#d8c4f0",
      align: "center",
      wordWrap: { width: 500 },
    }).setOrigin(0.5);

    const continueButton = createBannerButton(this, GAME_WIDTH / 2, 390, 190, 40, "Continue", () => this.continueFromChapterTransition(), "18px");

    this.chapterTransitionContainer.add([
      dim,
      panel.container,
      this.chapterTransitionChapterText,
      this.chapterTransitionSubtitleText,
      this.chapterTransitionHintText,
      continueButton.container,
    ]);

    this.uiLayer.add(this.chapterTransitionContainer);
  },

  showChapterTwoTitleCard(message) {
    var displayMessage = message;

    if (!displayMessage) {
      displayMessage = "";
    }

    if (this.postBattleContainer) {
      this.postBattleContainer.setVisible(false);
    }

    if (this.openingContainer) {
      this.openingContainer.setVisible(false);
    }

    if (this.previewContainer) {
      this.previewContainer.setVisible(false);
    }

    this.phase = "chapter2";
    this.busy = true;
    this.pendingChapterTransitionTarget = CHAPTER_TWO_NUMBER;

    this.setObjectiveDisplayVisible(false);

    this.phaseText.setText("Chapter 2");
    this.phaseText.setColor("#fcd34d");

    if (displayMessage) {
      this.helpText.setText(displayMessage);
    } else {
      this.helpText.setText("Chapter 2: Owed an Explanation.");
    }

    if (this.chapterTransitionHintText) {
      if (displayMessage) {
        this.chapterTransitionHintText.setText(displayMessage);
      } else {
        this.chapterTransitionHintText.setText("Continue into the Chapter 2 opening.");
      }
    }

    if (this.chapterTransitionChapterText) this.chapterTransitionChapterText.setText(CHAPTER_TWO_TITLE.chapter);
    if (this.chapterTransitionSubtitleText) this.chapterTransitionSubtitleText.setText(CHAPTER_TWO_TITLE.subtitle);

    this.chapterTransitionContainer.setVisible(true);
    this.chapterTransitionContainer.setAlpha(0);

    this.tweens.add({
      targets: this.chapterTransitionContainer,
      alpha: 1,
      duration: 420,
      ease: "Quad.easeOut"
    });
  },

  showChapterThreeTitleCard(message) {
    var displayMessage = message || "";

    if (this.postBattleContainer) {
      this.postBattleContainer.setVisible(false);
    }

    if (this.openingContainer) {
      this.openingContainer.setVisible(false);
    }

    if (this.previewContainer) {
      this.previewContainer.setVisible(false);
    }

    this.phase = "chapter3";
    this.busy = true;
    this.pendingChapterTransitionTarget = CHAPTER_THREE_NUMBER;

    this.setObjectiveDisplayVisible(false);

    this.phaseText.setText(CHAPTER_THREE_TITLE.chapter);
    this.phaseText.setColor("#fcd34d");

    if (displayMessage) {
      this.helpText.setText(displayMessage);
    } else {
      this.helpText.setText(`${CHAPTER_THREE_TITLE.chapter}: ${CHAPTER_THREE_TITLE.subtitle}.`);
    }

    if (this.chapterTransitionChapterText) this.chapterTransitionChapterText.setText(CHAPTER_THREE_TITLE.chapter);
    if (this.chapterTransitionSubtitleText) this.chapterTransitionSubtitleText.setText(CHAPTER_THREE_TITLE.subtitle);
    if (this.chapterTransitionHintText) {
      this.chapterTransitionHintText.setText(displayMessage || "Continue into the Chapter 3 opening.");
    }

    this.chapterTransitionContainer.setVisible(true);
    this.chapterTransitionContainer.setAlpha(0);

    this.tweens.add({
      targets: this.chapterTransitionContainer,
      alpha: 1,
      duration: 420,
      ease: "Quad.easeOut"
    });
  },

  continueFromChapterTransition() {
    const transitionTarget = this.pendingChapterTransitionTarget || CHAPTER_TWO_NUMBER;
    const isChapterThreeTransition = transitionTarget === CHAPTER_THREE_NUMBER;
    var saveData = isChapterThreeTransition ? this.pendingChapterThreeTransitionData : this.pendingChapterTwoTransitionData;

    if (!saveData) {
      saveData = this.buildChapterSaveData(this.loadedSlotNumber || null);
    }

    var slotNumber = null;

    if (saveData) {
      if (saveData.slotNumber) {
        slotNumber = saveData.slotNumber;
      }
    }

    if (!slotNumber) {
      if (this.loadedSlotNumber) {
        slotNumber = this.loadedSlotNumber;
      }
    }

    this.stopBattleMusic();

    this.scene.start("LoadingScene", {
      loadFromSave: true,
      saveData: saveData,
      slotNumber: slotNumber,
      playChapterTwoOpening: !isChapterThreeTransition,
      playChapterThreeOpening: isChapterThreeTransition,
      skipChapter2TitleCard: !isChapterThreeTransition,
      skipChapter3TitleCard: isChapterThreeTransition
    });
  },

  createOpeningUI() {
    this.openingContainer = this.add.container(0, 0);

    this.openingFade = this.add.rectangle(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2,
      GAME_WIDTH,
      GAME_HEIGHT,
      0x000000,
      0.88
    );

    this.openingFullSceneImage = this.add.image(
      GAME_WIDTH / 2,
      166,
      "prologueScene"
    );

    this.openingFullSceneImage.setVisible(false);

    fitImageToBounds(
      this,
      this.openingFullSceneImage,
      "prologueScene",
      GAME_WIDTH - 36,
      296,
      false
    );

    this.titleCard = this.add.container(0, 0);

    var titleBg = this.add.rectangle(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2,
      520,
      220,
      0x14091f,
      0.97
    );

    titleBg.setStrokeStyle(3, 0xb6925f);

    this.titleChapter = this.add.text(
      GAME_WIDTH / 2,
      215,
      "",
      {
        fontSize: "42px",
        fontStyle: "bold",
        color: "#f7ecd3"
      }
    );

    this.titleChapter.setOrigin(0.5);

    this.titleSubtitle = this.add.text(
      GAME_WIDTH / 2,
      270,
      "",
      {
        fontSize: "28px",
        color: "#e8c98b"
      }
    );

    this.titleSubtitle.setOrigin(0.5);

    this.titleTag = this.add.text(
      GAME_WIDTH / 2,
      315,
      "",
      {
        fontSize: "18px",
        color: "#d8c4f0"
      }
    );

    this.titleTag.setOrigin(0.5);

    var titleContinueButton = this.add.rectangle(
      GAME_WIDTH / 2,
      370,
      190,
      42,
      0x1a0d2a
    );

    titleContinueButton.setStrokeStyle(2, 0xb6925f);
    titleContinueButton.setInteractive({ useHandCursor: true });

    titleContinueButton.on(
      "pointerdown",
      function () {
        this.advanceOpening();
      },
      this
    );

    var titleContinueText = this.add.text(
      GAME_WIDTH / 2,
      370,
      "Continue",
      {
        fontSize: "18px",
        fontStyle: "bold",
        color: "#f7ecd3"
      }
    );

    titleContinueText.setOrigin(0.5);

    this.titleCard.add([
      titleBg,
      this.titleChapter,
      this.titleSubtitle,
      this.titleTag,
      titleContinueButton,
      titleContinueText
    ]);
    this.dialogueCard = this.add.container(0, 0);
    this.openingDialogueMainPanel = this.add.rectangle(480, 250, 860, 430, 0x12081d, 0.95);
    this.openingDialogueMainPanel.setStrokeStyle(3, 0xb6925f);
    this.openingSceneFrame = this.add.rectangle(315, 175, 560, 315, 0x1e1030, 1);
    this.openingSceneFrame.setStrokeStyle(2, 0xe4d0a8);
    this.dialogueSceneImage = this.add.image(315, 175, "prologueScene");
    this.fitImageInBox(this.dialogueSceneImage, "prologueScene", 548, 308);
    this.dialogueSceneName = this.add.text(54, 30, "", { fontSize: "16px", color: "#e8c98b", fontStyle: "bold" });
    this.dialoguePortraitPanel = this.add.rectangle(720, 175, 180, 200, 0x1e1030, 1);
    this.dialoguePortraitPanel.setStrokeStyle(2, 0xe4d0a8);
    this.dialoguePortraitFrame = this.add.rectangle(720, 160, 120, 140, 0x24123a);
    this.dialoguePortraitFrame.setStrokeStyle(2, 0xe4d0a8);
    this.dialoguePortrait = this.add.image(720, 160, "edwinPortrait").setDisplaySize(110, 132);
    this.dialoguePortraitPlaceholder = this.add.text(720, 160, "NO ART", { fontSize: "20px", color: "#94a3b8", align: "center" }).setOrigin(0.5);

    this.impactContainer = this.add.container(0, 0).setVisible(false);
    const impactShadow = this.add.rectangle(480, 175, 560, 190, 0x020617, 0.82);
    impactShadow.setStrokeStyle(2, 0x64748b);
    this.impactAttackerSlot = this.add.container(320, 175);
    this.impactAttackerFrame = this.add.rectangle(0, 0, 130, 150, 0x1f2937, 1);
    this.impactAttackerFrame.setStrokeStyle(2, 0x64748b);
    this.impactAttackerImage = this.add.image(0, -6, "edwinPortrait").setDisplaySize(112, 132);
    this.impactAttackerPlaceholder = this.add.text(0, -6, "NO ART", { fontSize: "20px", color: "#94a3b8", align: "center" }).setOrigin(0.5);
    this.impactAttackerName = this.add.text(0, 86, "", { fontSize: "16px", fontStyle: "bold", color: "#f7ecd3" }).setOrigin(0.5);
    this.impactAttackerSlot.add([this.impactAttackerFrame, this.impactAttackerImage, this.impactAttackerPlaceholder, this.impactAttackerName]);
    this.impactDefenderSlot = this.add.container(640, 175);
    this.impactDefenderFrame = this.add.rectangle(0, 0, 130, 150, 0x1f2937, 1);
    this.impactDefenderFrame.setStrokeStyle(2, 0x64748b);
    this.impactDefenderImage = this.add.image(0, -6, "edwinPortrait").setDisplaySize(112, 132);
    this.impactDefenderPlaceholder = this.add.text(0, -6, "NO ART", { fontSize: "20px", color: "#94a3b8", align: "center" }).setOrigin(0.5);
    this.impactDefenderName = this.add.text(0, 86, "", { fontSize: "16px", fontStyle: "bold", color: "#f7ecd3" }).setOrigin(0.5);
    this.impactDefenderSlot.add([this.impactDefenderFrame, this.impactDefenderImage, this.impactDefenderPlaceholder, this.impactDefenderName]);
    this.impactText = this.add.text(480, 175, "SMASH!", { fontSize: "28px", fontStyle: "bold", color: "#f8fafc", stroke: "#0f172a", strokeThickness: 6 }).setOrigin(0.5);
    this.impactContainer.add([impactShadow, this.impactAttackerSlot, this.impactDefenderSlot, this.impactText]);

    this.openingTextBox = this.add.rectangle(480, 395, 840, 150, 0x1a0d2a, 0.98);
    this.openingTextBox.setStrokeStyle(2, 0xb6925f);
    this.dialogueSpeaker = this.add.text(78, 334, "", { fontSize: "24px", fontStyle: "bold", color: "#f7ecd3" });
    this.dialogueText = this.add.text(78, 368, "", { fontSize: "18px", color: "#eadff7", wordWrap: { width: 790 }, lineSpacing: 6 });
    this.openingBackButton = this.add.rectangle(700, 468, 118, 36, 0x1a0d2a);
    this.openingBackButton.setStrokeStyle(2, 0xb6925f);
    this.openingBackButton.setInteractive({ useHandCursor: true });
    this.openingBackButton.on("pointerdown", () => this.goOpeningBack());
    const backText = this.add.text(668, 457, "Back", { fontSize: "16px", fontStyle: "bold", color: "#f7ecd3" });
    this.openingNextButton = this.add.rectangle(820, 468, 118, 36, 0x1a0d2a);
    this.openingNextButton.setStrokeStyle(2, 0xb6925f);
    this.openingNextButton.setInteractive({ useHandCursor: true });
    this.openingNextButton.on("pointerdown", () => this.advanceOpening());
    this.openingNextLabel = this.add.text(785, 457, "Next", { fontSize: "16px", fontStyle: "bold", color: "#f7ecd3" });
    this.openingSkipButton = this.add.rectangle(810, 50, 118, 32, 0x1a0d2a);
    this.openingSkipButton.setStrokeStyle(2, 0xb6925f);
    this.openingSkipButton.setInteractive({ useHandCursor: true });
    this.openingSkipButton.on("pointerdown", () => this.skipOpening());
    const skipText = this.add.text(777, 40, "Skip", { fontSize: "14px", fontStyle: "bold", color: "#f7ecd3" });
    this.dialogueCard.add([
      this.openingDialogueMainPanel,
      this.openingSceneFrame,
      this.dialogueSceneImage,
      this.dialogueSceneName,
      this.dialoguePortraitPanel,
      this.dialoguePortraitFrame,
      this.dialoguePortrait,
      this.dialoguePortraitPlaceholder,
      this.impactContainer,
      this.openingTextBox,
      this.dialogueSpeaker,
      this.dialogueText,
      this.openingBackButton,
      backText,
      this.openingNextButton,
      this.openingNextLabel,
      this.openingSkipButton,
      skipText,
    ]);
    this.openingContainer.add([this.openingFade, this.openingFullSceneImage, this.titleCard, this.dialogueCard]);
    this.uiLayer.add(this.openingContainer);
  },

  setImpactPortrait(image, placeholder, nameText, name, portraitKey) {
    nameText.setText(name || "");
    if (portraitKey && this.textures.exists(portraitKey)) {
      image.setTexture(portraitKey).setVisible(true);
      placeholder.setVisible(false);
    } else {
      image.setVisible(false);
      placeholder.setVisible(true);
    }
  },

  playImpactBeat(line) {
    if (line.defender === "Kayley") this.startBattleMusic();
    if (line.soundKey && this.cache.audio.exists(line.soundKey)) {
      this.sound.play(line.soundKey, { volume: 0.72 });
    }
    this.setImpactPortrait(this.impactAttackerImage, this.impactAttackerPlaceholder, this.impactAttackerName, line.attacker, line.attackerPortrait);
    this.setImpactPortrait(this.impactDefenderImage, this.impactDefenderPlaceholder, this.impactDefenderName, line.defender, line.defenderPortrait);
    this.tweens.killTweensOf(this.impactAttackerSlot);
    this.tweens.killTweensOf(this.impactDefenderSlot);
    this.tweens.killTweensOf(this.impactText);
    this.impactAttackerSlot.x = 320;
    this.impactDefenderSlot.x = 640;
    this.impactText.setAlpha(0).setScale(0.7);
    this.impactDefenderFrame.setFillStyle(0x1f2937);
    this.impactAttackerFrame.setFillStyle(0x1f2937);
    if (this.impactDefenderImage.visible) this.impactDefenderImage.clearTint();
    if (this.impactAttackerImage.visible) this.impactAttackerImage.clearTint();
    this.tweens.add({
      targets: this.impactAttackerSlot,
      x: 390,
      duration: 120,
      ease: "Cubic.Out",
      onComplete: () => {
        this.impactText.setText(line.impactText || (line.attacker === "Edwin" ? "SLASH!" : "SMASH!")).setAlpha(1);
        this.tweens.add({ targets: this.impactText, scale: 1.15, alpha: 0, duration: 220, ease: "Quad.Out" });
        this.impactDefenderFrame.setFillStyle(0x7f1d1d);
        if (this.impactDefenderImage.visible) this.impactDefenderImage.setTintFill(0xff6666);
        this.tweens.add({
          targets: this.impactDefenderSlot,
          x: 675,
          duration: 40,
          yoyo: true,
          repeat: 3,
          onComplete: () => {
            this.impactDefenderSlot.x = 640;
            this.impactDefenderFrame.setFillStyle(0x1f2937);
            if (this.impactDefenderImage.visible) this.impactDefenderImage.clearTint();
          },
        });
        this.time.delayedCall(120, () => this.tweens.add({ targets: this.impactAttackerSlot, x: 320, duration: 120, ease: "Cubic.Out" }));
      },
    });
  },

  updateOpeningUI() {
    const openingSequence = this.activeOpeningSequence || CHAPTER_ONE_OPENING;
    const step = openingSequence[this.openingStep];
    if (!step) return;

    if (step.type === "title") {
      this.titleCard.setVisible(true);
      this.dialogueCard.setVisible(false);
      this.openingFullSceneImage.setVisible(false);
      this.titleChapter.setText(step.chapter);
      this.titleSubtitle.setText(step.subtitle);
      const tagText = step.tag || "";
      this.titleTag.setText(tagText);
      this.titleTag.setVisible(tagText.length > 0);
      this.helpText.setText("Chapter opening.");
      return;
    }

    this.titleCard.setVisible(false);
    this.dialogueCard.setVisible(true);
    const line = step.lines[this.openingLine];
    const isImpact = line.type === "impact";
    const isFullScreen = line.type === "fullScreenScene";
    this.dialogueSceneName.setText(step.sceneName || "");

    const sceneTextureKey = step.background || "prologueScene";
    if (this.textures.exists(sceneTextureKey)) this.fitImageInBox(this.dialogueSceneImage, sceneTextureKey, 548, 308);

    this.openingFullSceneImage.setVisible(isFullScreen);
    if (isFullScreen) {
      const fullSceneKey = line.scene || step.background || "prologueScene";
      if (this.textures.exists(fullSceneKey)) {
        this.openingFullSceneImage.setTexture(fullSceneKey);
        this.openingFullSceneImage.setPosition(GAME_WIDTH / 2, 166);
        fitImageToBounds(this, this.openingFullSceneImage, fullSceneKey, GAME_WIDTH - 36, 296, false);
      }
    }

    this.openingDialogueMainPanel.setVisible(!isFullScreen);
    this.openingSceneFrame.setVisible(!isFullScreen);
    this.dialogueSceneImage.setVisible(!isFullScreen);
    this.dialogueSceneName.setVisible(!isFullScreen);
    this.dialogueSceneImage.setAlpha(isImpact ? 0.3 : 1);
    this.impactContainer.setVisible(isImpact);
    this.dialoguePortraitPanel.setVisible(!isImpact && !isFullScreen);
    this.dialoguePortraitFrame.setVisible(!isImpact && !isFullScreen);
    this.openingTextBox.setVisible(true);
    this.dialogueSpeaker.setVisible(true);
    this.dialogueText.setVisible(true);

    if (isImpact) {
      this.dialogueSpeaker.setText("");
      this.setOpeningDialogueText(line.text || "");
      this.dialoguePortrait.setVisible(false);
      this.dialoguePortraitPlaceholder.setVisible(false);
      this.playImpactBeat(line);
    } else {
      this.dialogueSpeaker.setText(line.speaker || "");
      this.setOpeningDialogueText(line.text || "");
      if (!isFullScreen && line.portrait && this.textures.exists(line.portrait)) {
        this.dialoguePortraitPanel.setVisible(true);
        this.dialoguePortraitFrame.setVisible(true);
        this.dialoguePortrait.setTexture(line.portrait).setDisplaySize(110, 132).setVisible(true);
        this.dialoguePortraitPlaceholder.setVisible(false);
      } else {
        this.dialoguePortrait.setVisible(false);
        this.dialoguePortraitPlaceholder.setVisible(false);
      }
    }

    this.openingBackButton.setAlpha(this.openingStep === 0 && this.openingLine === 0 ? 0.4 : 1);
    const lastStep = this.openingStep === openingSequence.length - 1;
    const lastLine = this.openingLine === step.lines.length - 1;
    this.openingNextLabel.setText(lastStep && lastLine ? "Start" : "Next");
  },

  goOpeningBack() {
    const openingSequence = this.activeOpeningSequence || CHAPTER_ONE_OPENING;
    if (this.openingStep === 0 && this.openingLine === 0) return;
    if (openingSequence[this.openingStep].type === "scene" && this.openingLine > 0) {
      this.openingLine -= 1;
    } else {
      this.openingStep -= 1;
      const prev = openingSequence[this.openingStep];
      this.openingLine = prev.type === "scene" ? prev.lines.length - 1 : 0;
    }
    this.updateOpeningUI();
  },

  advanceOpening() {
    const openingSequence = this.activeOpeningSequence || CHAPTER_ONE_OPENING;
    const step = openingSequence[this.openingStep];
    if (step.type === "title") {
      this.openingStep += 1;
      this.openingLine = 0;
      this.updateOpeningUI();
      return;
    }
    if (this.openingLine < step.lines.length - 1) {
      this.openingLine += 1;
      this.updateOpeningUI();
      return;
    }
    if (this.openingStep < openingSequence.length - 1) {
      this.openingStep += 1;
      this.openingLine = 0;
      this.updateOpeningUI();
      return;
    }
    this.finishOpening();
  },

  skipOpening() {
    this.finishOpening();
  },

  startChapterTwoOpening() {
    this.chapterTransitionContainer.setVisible(false).setAlpha(0);
    this.phase = "intro";
    this.busy = false;
    this.setObjectiveDisplayVisible(false);
    this.activeOpeningSequence = CHAPTER_TWO_OPENING;
    this.openingStep = 0;
    this.openingLine = 0;
    this.openingContainer.setVisible(true);
    this.helpText.setText("Watch the Chapter 2 opening.");
    this.updateOpeningUI();
  },

  startChapterThreeOpening() {
    this.chapterTransitionContainer.setVisible(false).setAlpha(0);
    this.phase = "intro";
    this.busy = false;
    this.setObjectiveDisplayVisible(false);
    this.activeOpeningSequence = CHAPTER_THREE_OPENING;
    this.openingStep = 0;
    this.openingLine = 0;
    this.openingContainer.setVisible(true);
    this.helpText.setText("Watch the Chapter 3 opening.");
    this.updateOpeningUI();
  },

  finishOpening() {
    this.openingContainer.setVisible(false);
    this.openingFullSceneImage.setVisible(false);
    this.startPlayerPhase();
    this.selectedUnitId = this.units.find((unit) => unit.team === "player")?.id || null;
    this.updateSelectedPanel();
  },

  startBattleMusic() {
    const musicConfig = this.levelData?.battleMusic;
    if (!musicConfig?.key || this.battleMusicStarted) return;
    if (!this.cache.audio.exists(musicConfig.key)) {
      console.warn(`Battle music not found: ${musicConfig.path}`);
      return;
    }
    const playMusic = () => {
      if (this.battleMusic && this.battleMusic.isPlaying) return;
      this.battleMusic = this.sound.add(musicConfig.key, { loop: true, volume: musicConfig.volume ?? 0.45 });
      this.battleMusic.play();
      this.battleMusicStarted = true;
    };
    if (this.sound.locked) this.sound.once(Phaser.Sound.Events.UNLOCKED, playMusic);
    else playMusic();
  },

  stopBattleMusic() {
    if (!this.battleMusic) {
      this.battleMusicStarted = false;
      return;
    }
    this.battleMusic.stop();
    this.battleMusic.destroy();
    this.battleMusic = null;
    this.battleMusicStarted = false;
  }
};
