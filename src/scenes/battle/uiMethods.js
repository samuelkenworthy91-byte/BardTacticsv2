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
export const uiMethods = {
  createTopUI() {
    const panel = createBannerPanel(this, 88, 64, 170, 112, { innerInset: 14 });
    this.topInfoPanel = panel.container;
    this.objectiveHeader = this.add.text(-68, -42, "Objective", {
      fontSize: "13px",
      fontStyle: "bold",
      color: "#e8c98b",
      stroke: "#0b0811",
      strokeThickness: 2,
    });
    this.objectiveText = this.add.text(-68, -20, this.levelData?.objective || "Escape through the glowing gate tile.", {
      fontSize: "11px",
      color: "#f7ecd3",
      wordWrap: { width: 136 },
      lineSpacing: 2,
    });
    this.phaseText = this.add.text(-68, 14, "Opening", {
      fontSize: "16px",
      fontStyle: "bold",
      color: "#f7ecd3",
      stroke: "#0b0811",
      strokeThickness: 3,
    });
    this.helpText = this.add.text(-68, 40, "Watch the chapter opening.", {
      fontSize: "11px",
      color: "#d8c4f0",
      wordWrap: { width: 136 },
      lineSpacing: 2,
    });
    this.phaseText.setVisible(false);
    this.helpText.setVisible(false);
    panel.container.add([this.objectiveHeader, this.objectiveText, this.phaseText, this.helpText]);
    this.uiLayer.add(panel.container);
  },

  setObjectiveDisplayVisible(visible) {
    const shouldShow = !!visible;
    if (this.objectiveHeader) this.objectiveHeader.setVisible(shouldShow);
    if (this.objectiveText) this.objectiveText.setVisible(shouldShow);
  },

  createSidePanel() {
    const x = 722;
    const y = 28;
    const panelWidth = 232;
    const panelHeight = 500;
    const innerX = x + 14;
    const barWidth = 200;
    this.sidePanelBarWidth = barWidth;
    const bg = this.add.rectangle(x + panelWidth / 2, y + panelHeight / 2, panelWidth, panelHeight, 0x111827, 0.92);
    bg.setStrokeStyle(2, 0x334155);
    this.portraitFrame = this.add.rectangle(innerX + 44, y + 70, 88, 104, 0x1f2937);
    this.portraitFrame.setStrokeStyle(2, 0x475569);
    this.portraitImage = this.add.image(innerX + 44, y + 70, "edwinPortrait").setVisible(false);
    this.portraitImage.setDisplaySize(88, 104);
    this.portraitPlaceholder = this.add.text(innerX + 44, y + 70, "", { fontSize: "13px", color: "#94a3b8", align: "center", wordWrap: { width: 74 } }).setOrigin(0.5);
    this.unitNameText = this.add.text(innerX + 100, y + 22, "No unit", { fontSize: "20px", fontStyle: "bold", color: "#f7ecd3", wordWrap: { width: 102 } });
    this.unitClassText = this.add.text(innerX + 100, y + 52, "", { fontSize: "11px", color: "#94a3b8", wordWrap: { width: 102 }, lineSpacing: 1 });
    this.hpBarText = this.add.text(innerX, y + 132, "", { fontSize: "12px", color: "#fecaca" });
    this.hpBarBg = this.add.rectangle(innerX, y + 150, barWidth, 9, 0x1f2937).setOrigin(0, 0.5);
    this.hpBarBg.setStrokeStyle(1, 0x475569);
    this.hpBarFill = this.add.rectangle(innerX, y + 150, barWidth, 9, 0xef4444).setOrigin(0, 0.5);
    this.hpBarFill.displayWidth = 0;
    this.levelXpText = this.add.text(innerX, y + 162, "", { fontSize: "12px", color: "#d8c4f0" });
    this.xpBarBg = this.add.rectangle(innerX, y + 180, barWidth, 9, 0x1f2937).setOrigin(0, 0.5);
    this.xpBarBg.setStrokeStyle(1, 0x475569);
    this.xpBarFill = this.add.rectangle(innerX, y + 180, barWidth, 9, 0x8b5cf6).setOrigin(0, 0.5);
    this.xpBarFill.displayWidth = 0;
    this.sigilText = this.add.text(innerX, y + 194, "Sigil", { fontSize: "11px", color: "#ddd6fe" });
    this.sigilOrbs = [0, 1, 2].map((index) => {
      const orb = this.add.circle(innerX + 54 + index * 20, y + 200, 6, 0x2e1065, 1);
      orb.setStrokeStyle(2, 0xc4b5fd);
      return orb;
    });
    this.unitStatsText = this.add.text(innerX, y + 218, "", { fontSize: "11px", color: "#e2e8f0", lineSpacing: 2, wordWrap: { width: 202 } });
    this.weaponText = this.add.text(innerX, y + 358, "", { fontSize: "10px", color: "#c4b5fd", wordWrap: { width: 202 }, lineSpacing: 2 });
    this.sidePanelParts = [
      bg,
      this.portraitFrame,
      this.portraitImage,
      this.portraitPlaceholder,
      this.unitNameText,
      this.unitClassText,
      this.hpBarText,
      this.hpBarBg,
      this.hpBarFill,
      this.levelXpText,
      this.xpBarBg,
      this.xpBarFill,
      this.sigilText,
      ...this.sigilOrbs,
      this.unitStatsText,
      this.weaponText,
    ];
    this.uiLayer.add(this.sidePanelParts);
  },

  createPreviewUI() {
    this.previewContainer = this.add.container(GAME_WIDTH / 2, 430).setVisible(false);
    const panel = this.add.rectangle(0, 0, 620, 150, 0x0f172a, 0.97);
    panel.setStrokeStyle(2, 0x475569);
    const title = this.add.text(-292, -58, "Combat Preview", { fontSize: "22px", fontStyle: "bold", color: "#f7ecd3" });
    this.previewLeftName = this.add.text(-292, -18, "", { fontSize: "18px", fontStyle: "bold", color: "#93c5fd" });
    this.previewLeftStats = this.add.text(-292, 10, "", { fontSize: "13px", color: "#e2e8f0", lineSpacing: 3 });
    this.previewRightName = this.add.text(30, -18, "", { fontSize: "18px", fontStyle: "bold", color: "#fca5a5" });
    this.previewRightStats = this.add.text(30, 10, "", { fontSize: "13px", color: "#e2e8f0", lineSpacing: 3 });
    const confirmButton = this.add.rectangle(-90, 50, 140, 34, 0x2563eb);
    confirmButton.setStrokeStyle(2, 0x93c5fd);
    confirmButton.setInteractive({ useHandCursor: true });
    confirmButton.on("pointerdown", () => {
      if (this.previewOpen) this.confirmPreviewAttack();
    });
    const confirmText = this.add.text(-132, 39, "Confirm", { fontSize: "16px", fontStyle: "bold", color: "#f7ecd3" });
    const cancelButton = this.add.rectangle(90, 50, 140, 34, 0x334155);
    cancelButton.setStrokeStyle(2, 0x94a3b8);
    cancelButton.setInteractive({ useHandCursor: true });
    cancelButton.on("pointerdown", () => {
      if (this.previewOpen) this.closePreview();
    });
    const cancelText = this.add.text(52, 39, "Cancel", { fontSize: "16px", fontStyle: "bold", color: "#f7ecd3" });
    this.previewContainer.add([panel, title, this.previewLeftName, this.previewLeftStats, this.previewRightName, this.previewRightStats, confirmButton, confirmText, cancelButton, cancelText]);
    this.uiLayer.add(this.previewContainer);
  },

  createStandardBattleSceneUI() {
    this.standardBattleContainer = this.add.container(0, 0).setVisible(false).setDepth(STANDARD_BATTLE_PANEL_DEPTH).setAlpha(0);

    const dim = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.74);
    dim.setInteractive();

    const panel = createBannerPanel(this, GAME_WIDTH / 2, GAME_HEIGHT / 2, 790, 404, { innerInset: 18 });

    const arena = this.add.rectangle(GAME_WIDTH / 2, 226, 700, 210, 0x0b1020, 0.96).setOrigin(0.5);
    arena.setStrokeStyle(2, 0xe4d0a8, 0.7);

    const arenaGlow = this.add.rectangle(GAME_WIDTH / 2, 226, 682, 190, 0x1f1431, 0.72).setOrigin(0.5);
    arenaGlow.setStrokeStyle(1, 0x5b3f87, 0.58);

    const floorLine = this.add.rectangle(GAME_WIDTH / 2, 322, 650, 4, 0xb6925f, 0.55).setOrigin(0.5);
    const title = this.add.text(GAME_WIDTH / 2, 84, "Standard Attack", {
      fontSize: "20px",
      fontStyle: "bold",
      color: "#f7ecd3",
      stroke: "#0b0811",
      strokeThickness: 4,
    }).setOrigin(0.5);

    this.standardBattleWeaponText = this.add.text(GAME_WIDTH / 2, 110, "", {
      fontSize: "13px",
      color: "#d8c4f0",
      align: "center",
    }).setOrigin(0.5);

    this.standardBattleAttackerName = this.add.text(176, 132, "", {
      fontSize: "18px",
      fontStyle: "bold",
      color: "#93c5fd",
      stroke: "#0b0811",
      strokeThickness: 3,
    }).setOrigin(0, 0.5);

    this.standardBattleDefenderName = this.add.text(784, 132, "", {
      fontSize: "18px",
      fontStyle: "bold",
      color: "#fca5a5",
      stroke: "#0b0811",
      strokeThickness: 3,
    }).setOrigin(1, 0.5);

    this.standardBattleAttackerShadow = this.add.ellipse(292, 326, 142, 20, 0x000000, 0.42);
    this.standardBattleDefenderShadow = this.add.ellipse(668, 326, 142, 20, 0x000000, 0.42);

    this.standardBattleAttackerSprite = this.add.image(292, 322, "edwin_idle_right").setOrigin(0.5, 1);
    this.standardBattleDefenderSprite = this.add.image(668, 322, "falan_idle_left").setOrigin(0.5, 1);

    this.standardBattleImpactFlash = this.add.rectangle(GAME_WIDTH / 2, 226, 700, 210, 0xffffff, 0).setOrigin(0.5);
    this.standardBattleMessageText = this.add.text(GAME_WIDTH / 2, 182, "", {
      fontSize: "34px",
      fontStyle: "bold",
      color: "#f7ecd3",
      stroke: "#0b0811",
      strokeThickness: 7,
    }).setOrigin(0.5).setAlpha(0);

    this.standardBattleAttackerHp = this.createBattleHpBar(228, 410, "#93c5fd");
    this.standardBattleDefenderHp = this.createBattleHpBar(732, 410, "#fca5a5");

    this.standardBattleContainer.add([
      dim,
      panel.container,
      arena,
      arenaGlow,
      floorLine,
      title,
      this.standardBattleWeaponText,
      this.standardBattleAttackerName,
      this.standardBattleDefenderName,
      this.standardBattleAttackerShadow,
      this.standardBattleDefenderShadow,
      this.standardBattleAttackerSprite,
      this.standardBattleDefenderSprite,
      this.standardBattleImpactFlash,
      this.standardBattleMessageText,
      this.standardBattleAttackerHp.container,
      this.standardBattleDefenderHp.container,
    ]);

    this.uiLayer.add(this.standardBattleContainer);
  },

  createBattleHpBar(x, y, nameColor = "#f7ecd3") {
    const container = this.add.container(x, y);
    const bg = this.add.rectangle(0, 0, 284, 76, 0x090512, 0.94).setOrigin(0.5);
    bg.setStrokeStyle(2, 0xb6925f, 0.9);

    const nameText = this.add.text(-124, -26, "", {
      fontSize: "17px",
      fontStyle: "bold",
      color: nameColor,
      stroke: "#0b0811",
      strokeThickness: 3,
    }).setOrigin(0, 0.5);

    const hpText = this.add.text(124, -26, "", {
      fontSize: "14px",
      fontStyle: "bold",
      color: "#f7ecd3",
      stroke: "#0b0811",
      strokeThickness: 3,
    }).setOrigin(1, 0.5);

    const barBg = this.add.rectangle(-124, 16, 248, 16, 0x1f2937, 1).setOrigin(0, 0.5);
    barBg.setStrokeStyle(1, 0xe4d0a8, 0.65);

    const barFill = this.add.rectangle(-124, 16, 248, 16, 0xef4444, 1).setOrigin(0, 0.5);
    barFill.displayWidth = 248;

    container.add([bg, nameText, hpText, barBg, barFill]);
    return { container, bg, nameText, hpText, barBg, barFill, width: 248 };
  },

  setBattleHpBar(bar, unit, hpValue = null) {
    if (!bar || !unit) return;
    bar.unit = unit;
    bar.nameText.setText(unit.name || "Unit");
    this.setBattleHpBarValue(bar, hpValue ?? unit.hp ?? 0);
  },

  setBattleHpBarValue(bar, hpValue) {
    if (!bar || !bar.unit) return;
    const maxHp = Math.max(1, bar.unit.maxHp || 1);
    const shownHp = Phaser.Math.Clamp(Math.round(hpValue), 0, maxHp);
    bar.hpText.setText(`HP ${shownHp}/${maxHp}`);
    bar.barFill.displayWidth = bar.width * Phaser.Math.Clamp(shownHp / maxHp, 0, 1);
  },

  animateBattleHpBar(bar, fromHp, toHp, duration = 320) {
    if (!bar) return;
    this.tweens.addCounter({
      from: fromHp,
      to: toHp,
      duration,
      ease: "Quad.Out",
      onUpdate: (tween) => this.setBattleHpBarValue(bar, tween.getValue()),
      onComplete: () => this.setBattleHpBarValue(bar, toHp),
    });
  },

  getBattleSpriteTextureKey(unit, state = "idle", direction = "down") {
    if (!unit) return null;

    const candidateGroups = [
      this.getIndividualSpriteEntryCandidates(unit, state, direction, 0),
      this.getIndividualSpriteEntryCandidates(unit, "idle", direction, 0),
      this.getIndividualSpriteEntryCandidates(unit, "idle", "down", 0),
    ];

    for (const candidates of candidateGroups) {
      for (const entry of candidates) {
        if (entry?.key && this.textures.exists(entry.key)) return entry.key;
      }
    }

    if (unit.portraitKey && this.textures.exists(unit.portraitKey)) return unit.portraitKey;
    return null;
  },

  setBattleSceneSprite(image, unit, state = "idle", direction = "down", maxHeight = 178, maxWidth = 240) {
    if (!image || !unit) return false;

    const textureKey = this.getBattleSpriteTextureKey(unit, state, direction);
    if (!textureKey) {
      image.setVisible(false);
      return false;
    }

    image.setTexture(textureKey);
    image.clearTint();
    image.setAlpha(1);
    image.setVisible(true);
    image.setOrigin(0.5, 1);

    const source = this.textures.get(textureKey)?.getSourceImage();
    if (source?.width && source?.height) {
      const scale = Math.min(maxWidth / source.width, maxHeight / source.height);
      image.setScale(scale);
    } else {
      image.setDisplaySize(120, 160);
    }

    return true;
  },

  showBattleMessage(text, color = "#f7ecd3") {
    if (!this.standardBattleMessageText) return;
    this.tweens.killTweensOf(this.standardBattleMessageText);
    this.standardBattleMessageText.setText(text).setColor(color).setAlpha(1).setScale(0.82);
    this.tweens.add({
      targets: this.standardBattleMessageText,
      scale: 1.12,
      alpha: 0,
      duration: 520,
      ease: "Quad.Out",
    });
  },

  playStandardBattleScene(attacker, defender, weapon, sequence, defenderStartHp, onComplete = null) {
    if (!this.standardBattleContainer || !attacker || !defender || !weapon || !sequence) {
      if (typeof onComplete === "function") onComplete();
      return;
    }

    this.standardBattleSceneOpen = true;
    this.standardBattleContainer.setVisible(true).setAlpha(0);
    this.standardBattleAttackerSprite.x = 292;
    this.standardBattleDefenderSprite.x = 668;
    this.standardBattleImpactFlash.setAlpha(0);
    this.standardBattleMessageText.setAlpha(0);

    this.standardBattleAttackerName.setText(attacker.name || "Attacker");
    this.standardBattleDefenderName.setText(defender.name || "Defender");
    this.standardBattleWeaponText.setText(`${attacker.name} uses ${weapon.name} (${weapon.damageType || "physical"}, range ${getWeaponRangeLabel(weapon)})`);

    this.setBattleHpBar(this.standardBattleAttackerHp, attacker, attacker.hp);
    this.setBattleHpBar(this.standardBattleDefenderHp, defender, defenderStartHp);
    this.setBattleSceneSprite(this.standardBattleAttackerSprite, attacker, "idle", "right");
    this.setBattleSceneSprite(this.standardBattleDefenderSprite, defender, "idle", "left");

    this.tweens.add({ targets: this.standardBattleContainer, alpha: 1, duration: STANDARD_BATTLE_INTRO_DURATION });

    const results = sequence.results && sequence.results.length > 0
      ? sequence.results
      : [{ hit: false, critical: false, damage: 0, baseDamage: 0 }];

    let defenderDisplayHp = defenderStartHp;
    const attackState = this.getAttackAnimationState(attacker, weapon);

    results.forEach((result, index) => {
      this.time.delayedCall(STANDARD_BATTLE_INTRO_DURATION + 150 + index * STANDARD_BATTLE_HIT_STEP_DURATION, () => {
        this.standardBattleAttackerSprite.x = 292;
        this.standardBattleDefenderSprite.x = 668;
        this.setBattleSceneSprite(this.standardBattleAttackerSprite, attacker, attackState, "right");
        this.setBattleSceneSprite(this.standardBattleDefenderSprite, defender, "idle", "left");

        this.tweens.add({
          targets: this.standardBattleAttackerSprite,
          x: 348,
          duration: 135,
          ease: "Cubic.Out",
          yoyo: true,
          onComplete: () => this.setBattleSceneSprite(this.standardBattleAttackerSprite, attacker, "idle", "right"),
        });

        if (!result.hit) {
          this.showBattleMessage("MISS", "#fef3c7");
          return;
        }

        const nextHp = Math.max(0, defenderDisplayHp - result.damage);
        const message = result.critical ? `CRITICAL! -${result.damage}` : `-${result.damage}`;
        this.showBattleMessage(message, result.critical ? "#fde68a" : "#fca5a5");

        this.time.delayedCall(120, () => {
          this.setBattleSceneSprite(this.standardBattleDefenderSprite, defender, "hurt", "left");
          this.standardBattleDefenderSprite.setTintFill(result.critical ? 0xfff1a8 : 0xff6666);
          this.standardBattleImpactFlash.setAlpha(result.critical ? 0.32 : 0.2);
          this.tweens.add({ targets: this.standardBattleImpactFlash, alpha: 0, duration: 180, ease: "Quad.Out" });
          this.tweens.add({ targets: this.standardBattleDefenderSprite, x: 694, duration: 45, yoyo: true, repeat: result.critical ? 5 : 3 });
          this.animateBattleHpBar(this.standardBattleDefenderHp, defenderDisplayHp, nextHp, 330);
          defenderDisplayHp = nextHp;
        });

        this.time.delayedCall(520, () => {
          this.standardBattleDefenderSprite.clearTint();
          if (defenderDisplayHp > 0) {
            this.setBattleSceneSprite(this.standardBattleDefenderSprite, defender, "idle", "left");
          }
        });
      });
    });

    const totalDuration = STANDARD_BATTLE_INTRO_DURATION + 350 + results.length * STANDARD_BATTLE_HIT_STEP_DURATION + STANDARD_BATTLE_END_HOLD_DURATION;
    this.time.delayedCall(totalDuration, () => {
      this.tweens.add({
        targets: this.standardBattleContainer,
        alpha: 0,
        duration: STANDARD_BATTLE_OUTRO_DURATION,
        ease: "Quad.Out",
        onComplete: () => {
          this.standardBattleContainer.setVisible(false);
          this.standardBattleSceneOpen = false;
          if (typeof onComplete === "function") onComplete();
        },
      });
    });
  },

  createCombatXpPopup() {
    this.combatXpContainer = this.add.container(GAME_WIDTH / 2, GAME_HEIGHT - 68).setVisible(false).setDepth(9998).setAlpha(0);
    const bg = this.add.rectangle(0, 0, 320, 88, 0x020617, 0.96);
    bg.setStrokeStyle(2, 0x475569);
    this.combatXpNameText = this.add.text(-140, -28, "", { fontSize: "18px", fontStyle: "bold", color: "#f7ecd3" });
    this.combatXpGainText = this.add.text(140, -28, "", { fontSize: "16px", fontStyle: "bold", color: "#7dd3fc" }).setOrigin(1, 0);
    this.combatXpValueText = this.add.text(-140, -2, "", { fontSize: "14px", color: "#d8c4f0" });
    this.combatXpBarBg = this.add.rectangle(-140, 26, 280, 14, 0x1f2937).setOrigin(0, 0.5);
    this.combatXpBarBg.setStrokeStyle(1, 0x475569);
    this.combatXpBarFill = this.add.rectangle(-140, 26, 280, 14, 0x38bdf8).setOrigin(0, 0.5);
    this.combatXpBarFill.displayWidth = 0;
    this.combatXpContainer.add([bg, this.combatXpNameText, this.combatXpGainText, this.combatXpValueText, this.combatXpBarBg, this.combatXpBarFill]);
    this.uiLayer.add(this.combatXpContainer);
  },

  createSkillBanner() {
    this.skillBannerContainer = this.add.container(GAME_WIDTH / 2, 46).setDepth(10000).setVisible(false).setAlpha(0);
    const panel = createBannerPanel(this, 0, 0, 490, 60, { innerInset: 14 });
    this.skillBannerText = this.add.text(0, 0, "", {
      fontSize: "24px",
      fontStyle: "bold",
      color: "#f7ecd3",
      stroke: "#0b0811",
      strokeThickness: 4,
    }).setOrigin(0.5);
    panel.container.add(this.skillBannerText);
    this.skillBannerContainer.add(panel.container);
    this.uiLayer.add(this.skillBannerContainer);
  },

  createLevelUpAllocationUI() {
    this.levelUpContainer = this.add.container(GAME_WIDTH / 2, GAME_HEIGHT / 2).setVisible(false).setDepth(LEVEL_UP_PANEL_DEPTH);

    const dim = this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.62).setInteractive();
    const panel = createBannerPanel(this, 0, 0, 620, 430, { innerInset: 18 });

    // Add the dim layer and panel first so the stat rows and plus buttons are drawn above them.
    this.levelUpContainer.add([dim, panel.container]);

    this.levelUpTitle = this.add.text(0, -182, "LEVEL UP!", {
      fontSize: "32px",
      fontStyle: "bold",
      color: "#e8c98b",
      stroke: "#0b0811",
      strokeThickness: 5,
    }).setOrigin(0.5);
    this.levelUpSubtitle = this.add.text(0, -146, "", { fontSize: "17px", color: "#f7ecd3" }).setOrigin(0.5);
    this.levelUpRollText = this.add.text(0, -116, "", { fontSize: "14px", color: "#d8c4f0", align: "center", wordWrap: { width: 530 } }).setOrigin(0.5);
    this.levelUpPointsText = this.add.text(0, -88, "", {
      fontSize: "20px",
      fontStyle: "bold",
      color: "#7dd3fc",
      stroke: "#0b0811",
      strokeThickness: 3,
    }).setOrigin(0.5);

    this.levelUpContainer.add([
      this.levelUpTitle,
      this.levelUpSubtitle,
      this.levelUpRollText,
      this.levelUpPointsText,
    ]);

    this.levelUpStatRows = [];
    LEVEL_UP_STATS.forEach((stat, index) => {
      const rowY = -52 + index * 36;
      const label = this.add.text(-250, rowY, stat.label, { fontSize: "15px", fontStyle: "bold", color: "#f7ecd3" }).setOrigin(0, 0.5);
      const value = this.add.text(-184, rowY, "", { fontSize: "15px", color: "#e2e8f0" }).setOrigin(0, 0.5);
      const desc = this.add.text(-92, rowY, stat.description, { fontSize: "11px", color: "#bdaee0" }).setOrigin(0, 0.5);
      const plusButton = createBannerButton(this, 226, rowY, 42, 28, "+", () => this.allocatePendingLevelPoint(stat.key), "18px");

      this.levelUpContainer.add([label, value, desc, plusButton.container]);
      this.levelUpStatRows.push({ stat, label, value, desc, plusButton });
    });

    this.levelUpConfirmButton = createBannerButton(this, 0, 174, 220, 42, "Confirm", () => this.confirmLevelUpAllocation(), "20px");
    this.levelUpHint = this.add.text(0, 208, "Spend all points to continue.", { fontSize: "12px", color: "#cbd5e1" }).setOrigin(0.5);

    this.levelUpContainer.add([this.levelUpConfirmButton.container, this.levelUpHint]);
    this.uiLayer.add(this.levelUpContainer);
  },

  getLevelUpStatValue(unit, statKey) {
    if (!unit) return 0;
    if (statKey === "hp") return unit.maxHp || 0;
    return unit[statKey] || 0;
  },

  refreshLevelUpAllocationUI() {
    const data = this.currentLevelUpData;
    const unit = data ? this.units.find((candidate) => candidate.id === data.unitId) : null;
    if (!data || !unit) return;
    this.levelUpSubtitle.setText(`${unit.name} reached Lv ${data.level}.`);

    const bonusCount = Math.max(0, (data.pointsTotal || 1) - 1);
    const rollSummary = (data.luckRolls || [])
      .map((roll, index) => `Roll ${index + 1}: ${roll} ${roll <= data.luckAtRoll ? "success" : "stop"}`)
      .join(" | ");

    this.levelUpRollText.setText(
      bonusCount > 0
        ? `Base 1 point. Luck ${data.luckAtRoll} earned ${bonusCount} bonus point${bonusCount === 1 ? "" : "s"}. ${rollSummary}`
        : `Base 1 point. Luck ${data.luckAtRoll} earned no bonus points. ${rollSummary}`
    );
    this.levelUpPointsText.setText(`Points left: ${data.pointsRemaining}`);
    this.levelUpStatRows.forEach((row) => {
      const current = this.getLevelUpStatValue(unit, row.stat.key);
      const added = data.allocations[row.stat.key] || 0;
      row.value.setText(added > 0 ? `${current} (+${added})` : `${current}`);
      row.plusButton.container.setAlpha(data.pointsRemaining > 0 ? 1 : 0.42);
    });
    this.levelUpConfirmButton.container.setAlpha(data.pointsRemaining === 0 ? 1 : 0.48);
    this.levelUpHint.setText(data.pointsRemaining === 0 ? "Ready. Confirm to finish the level up." : "Use the plus buttons to spend every point.");
  },

  allocatePendingLevelPoint(statKey) {
    const data = this.currentLevelUpData;
    if (!data || data.pointsRemaining <= 0) return;
    const unit = this.units.find((candidate) => candidate.id === data.unitId);
    if (!unit) return;
    if (statKey === "hp") {
      unit.maxHp += 1;
      unit.hp += 1;
    } else {
      unit[statKey] = (unit[statKey] || 0) + 1;
    }
    data.allocations[statKey] = (data.allocations[statKey] || 0) + 1;
    data.pointsRemaining -= 1;
    this.updateSelectedPanel();
    this.refreshLevelUpAllocationUI();
  },

  confirmLevelUpAllocation() {
    const data = this.currentLevelUpData;
    if (!data || data.pointsRemaining > 0) return;
    const unit = this.units.find((candidate) => candidate.id === data.unitId);
    this.levelUpContainer.setVisible(false);
    this.levelUpAllocationOpen = false;
    this.currentLevelUpData = null;
    if (unit) {
      this.showFloatingText(this.boardX + unit.x * TILE_SIZE + TILE_SIZE / 2, this.boardY + unit.y * TILE_SIZE + 6, "LEVEL UP!", "#fcd34d");
      this.refreshUnitSprite(unit);
      this.updateSelectedPanel();
    }
    this.processLevelUpQueue();

    if (!this.levelUpAllocationOpen && this.levelUpQueue.length === 0) {
      this.flushLevelUpCallbacks();
    }
  },

  rollLevelUpPoints(unit) {
    const luck = Phaser.Math.Clamp(Math.max(0, unit?.luck || 0), 0, 100);
    const luckRolls = [];
    let points = 1;
    let keepRolling = true;

    while (keepRolling) {
      const roll = Phaser.Math.Between(1, 100);
      luckRolls.push(roll);

      if (roll <= luck) {
        points += 1;
      } else {
        keepRolling = false;
      }

      // Safety guard: a Luck score of 100 would otherwise never stop.
      if (luckRolls.length >= 25) {
        keepRolling = false;
      }
    }

    return { points, luckRolls };
  },

  queueLevelUpAllocation(unit, rollInfo) {
    if (!unit || unit.team !== "player") return;

    const points = typeof rollInfo === "number" ? rollInfo : rollInfo?.points || 1;
    const luckRolls = Array.isArray(rollInfo?.luckRolls) ? rollInfo.luckRolls : [];

    this.levelUpQueue.push({
      unitId: unit.id,
      level: unit.level,
      pointsTotal: points,
      pointsRemaining: points,
      luckAtRoll: Phaser.Math.Clamp(Math.max(0, unit.luck || 0), 0, 100),
      luckRolls,
      allocations: {},
    });
  },

  hasPendingLevelUps() {
    return this.levelUpAllocationOpen || this.levelUpQueue.length > 0;
  },

  runAfterLevelUps(callback) {
    if (!this.hasPendingLevelUps()) {
      if (typeof callback === "function") callback();
      return false;
    }

    this.pendingLevelUpCallbacks = this.pendingLevelUpCallbacks || [];

    if (typeof callback === "function") {
      this.pendingLevelUpCallbacks.push(callback);
    }

    this.processLevelUpQueue();
    return true;
  },

  flushLevelUpCallbacks() {
    if (this.hasPendingLevelUps()) return;

    const callbacks = this.pendingLevelUpCallbacks || [];
    this.pendingLevelUpCallbacks = [];

    callbacks.forEach((callback) => {
      if (typeof callback === "function") callback();
    });
  },

  processLevelUpQueue() {
    if (this.levelUpAllocationOpen) return;

    if (this.levelUpQueue.length === 0) {
      this.flushLevelUpCallbacks();
      return;
    }

    const next = this.levelUpQueue.shift();
    const unit = this.units.find((candidate) => candidate.id === next.unitId);
    if (!unit) {
      this.processLevelUpQueue();
      return;
    }
    this.currentLevelUpData = next;
    this.levelUpAllocationOpen = true;
    this.levelUpContainer.setVisible(true);
    this.levelUpContainer.setAlpha(0);
    this.refreshLevelUpAllocationUI();
    this.tweens.add({ targets: this.levelUpContainer, alpha: 1, duration: 180 });
  },

  showSkillBanner(skillName) {
    if (!this.skillBannerContainer || !this.skillBannerText) return;
    this.tweens.killTweensOf(this.skillBannerContainer);
    this.skillBannerText.setText(skillName);
    this.skillBannerContainer.setVisible(true).setAlpha(0);
    this.skillBannerContainer.y = 28;
    this.tweens.add({
      targets: this.skillBannerContainer,
      alpha: 1,
      y: 46,
      duration: 180,
      ease: "Back.Out",
      onComplete: () => {
        this.time.delayedCall(SKILL_BANNER_DURATION, () => {
          if (!this.skillBannerContainer?.visible) return;
          this.tweens.add({
            targets: this.skillBannerContainer,
            alpha: 0,
            y: 28,
            duration: 180,
            ease: "Quad.Out",
            onComplete: () => this.skillBannerContainer.setVisible(false),
          });
        });
      },
    });
  },

  showCombatXpPopup(unit, amount, startLevel, startXp) {
    if (!this.combatXpContainer || !unit || amount <= 0) return;
    this.tweens.killTweensOf(this.combatXpContainer);
    this.tweens.killTweensOf(this.combatXpBarFill);
    const popup = this.combatXpContainer;
    popup.setVisible(true).setAlpha(1);
    this.combatXpNameText.setText(unit.name);
    this.combatXpGainText.setText(`+${amount} XP`);
    let displayLevel = startLevel;
    let currentXp = startXp;
    let remainingXp = amount;
    const setDisplay = (level, xpValue) => {
      this.combatXpValueText.setText(`Lv ${level} XP ${xpValue}/100`);
      this.combatXpBarFill.displayWidth = 280 * Phaser.Math.Clamp(xpValue / 100, 0, 1);
    };
    setDisplay(displayLevel, currentXp);
    const animateChunk = () => {
      if (remainingXp <= 0) {
        this.time.delayedCall(700, () => {
          this.tweens.add({ targets: popup, alpha: 0, duration: 220, onComplete: () => popup.setVisible(false) });
        });
        return;
      }
      const neededToLevel = 100 - currentXp;
      const chunk = Math.min(remainingXp, neededToLevel);
      this.tweens.addCounter({
        from: currentXp,
        to: currentXp + chunk,
        duration: 450,
        onUpdate: (tween) => setDisplay(displayLevel, Math.floor(tween.getValue())),
        onComplete: () => {
          currentXp += chunk;
          remainingXp -= chunk;
          if (currentXp >= 100) {
            displayLevel += 1;
            currentXp = 0;
            setDisplay(displayLevel, currentXp);
            this.time.delayedCall(250, animateChunk);
          } else {
            animateChunk();
          }
        },
      });
    };
    animateChunk();
  }
};
