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
  PARLEY_SKILL,
  PLAYER_ACTION_PAUSE,
  PLAYER_MOVE_DURATION,
  RECRUITMENT_CONFIG,
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
import { CHAPTER_THREE_TOME_SKILLS } from "../../chapters/chapter3.js";
import {
  buildChapterTwoSaveData,
  CHAPTER_TWO_NUMBER,
  getLevelForChapter,
  getSaveDataChapterNumber,
  isChapterOne,
  isChapterTwoOrLater,
} from "../../chapters/progression.js";
export const playerActionMethods = {
  chooseActionAttack(unitId) {
    const unit = this.units.find((u) => u.id === unitId);
    if (!unit || unit.team !== "player" || unit.acted) return;
    const targets = this.attackableEnemies(unit);
    if (targets.length === 0) {
      this.helpText.setText("No enemies in range. Choose another action.");
      return;
    }
    this.closeActionMenu();
    this.pendingItemUse = null;
    this.pendingParleyUse = null;
    this.selectedUnitId = unit.id;
    this.moveTiles = [];
    this.targetTiles = targets;
    this.targetTileColor = TARGET_HIGHLIGHT.attack.fill;
    this.targetTileStroke = TARGET_HIGHLIGHT.attack.stroke;
    this.redrawSelection();
    this.updateSelectedPanel();
    this.helpText.setText(`Choose an enemy for ${unit.name} to attack. Press Space to cancel.`);
  },

  getBrotherUnits() {
    return {
      edwin: this.units.find((unit) => unit.id === "edwin" && unit.hp > 0) || null,
      leon: this.units.find((unit) => unit.id === "leon" && unit.hp > 0) || null,
    };
  },

  isBrotherUnit(unit) {
    return !!unit && (unit.id === "edwin" || unit.id === "leon");
  },

  areBrothersAdjacent() {
    const brothers = this.getBrotherUnits();
    return !!brothers.edwin && !!brothers.leon && distance(brothers.edwin, brothers.leon) === 1;
  },

  getAvailableSkills(unit) {
    if (!unit) return [];

    const skills = unit.team === "player"
      ? [{ ...PARLEY_SKILL }, ...(unit.skills || []).map((skill) => ({ ...skill }))]
      : (unit.skills || []).map((skill) => ({ ...skill }));

    if (this.isBrotherUnit(unit) && this.areBrothersAdjacent()) {
      skills.push({ ...BROTHERS_BLIGH_SKILL });
    }

    return skills;
  },

  getBrotherSkillPartner(unit) {
    if (!this.isBrotherUnit(unit)) return null;
    const brothers = this.getBrotherUnits();
    return unit.id === "edwin" ? brothers.leon : brothers.edwin;
  },

  getCombinedBrotherPower() {
    const brothers = this.getBrotherUnits();
    if (!brothers.edwin || !brothers.leon) return 0;
    return (brothers.edwin.str || 0) + (brothers.edwin.mag || 0) + (brothers.leon.str || 0) + (brothers.leon.mag || 0);
  },

  spendSkillCost(unit, skill) {
    if (!unit || !skill) return;

    if (skill.id === "parley") {
      unit.sigilPoints = 0;
      return;
    }

    if (skill.id === "brothersBligh") {
      const partner = this.getBrotherSkillPartner(unit);
      unit.sigilPoints = Math.max(0, (unit.sigilPoints ?? 0) - (skill.cost ?? 0));
      if (partner) {
        partner.sigilPoints = Math.max(0, (partner.sigilPoints ?? 0) - (skill.partnerCost ?? skill.cost ?? 0));
        this.refreshUnitSprite(partner);
      }
      return;
    }

    unit.sigilPoints = Math.max(0, (unit.sigilPoints ?? 0) - (skill.cost ?? 0));
  },

  getMiloRescueAllies(unit) {
    if (!unit || unit.id !== "milo") return [];
    return this.units.filter((other) => (
      other &&
      other.id !== unit.id &&
      other.team === unit.team &&
      other.hp > 0 &&
      other.isMiloDecoy !== true &&
      distance(unit, other) === 1
    ));
  },

  getMiloRescueDestinationTiles(unit) {
    if (!unit) return [];
    const range = Math.max(1, Math.floor((unit.spd || 0) / 2));
    const tiles = [];
    for (let y = 0; y < this.mapRows; y += 1) {
      for (let x = 0; x < this.mapCols; x += 1) {
        if (Math.abs(unit.x - x) + Math.abs(unit.y - y) > range) continue;
        if (!this.isWalkable(x, y) || this.getUnitAt(x, y)) continue;
        tiles.push({ x, y });
      }
    }
    return tiles;
  },

  beginMiloRescueAllySelection(unit, skill) {
    const allies = this.getMiloRescueAllies(unit);
    if (allies.length === 0) {
      this.helpText.setText("No adjacent ally for Rescue Sprint.");
      return;
    }
    this.closeSelectionMenu(false);
    this.selectedUnitId = unit.id;
    this.pendingMiloRescue = { stage: "ally", unitId: unit.id, skillId: skill.id };
    this.pendingItemUse = null;
    this.pendingParleyUse = null;
    this.moveTiles = [];
    this.targetTiles = allies;
    this.targetTileColor = TARGET_HIGHLIGHT.skill.fill;
    this.targetTileStroke = TARGET_HIGHLIGHT.skill.stroke;
    this.redrawSelection();
    this.updateSelectedPanel();
    this.helpText.setText("Choose an adjacent ally for Rescue Sprint. Press Space to cancel.");
  },

  chooseMiloRescueAlly(allyId) {
    const pending = this.pendingMiloRescue;
    const unit = this.units.find((candidate) => candidate.id === pending?.unitId);
    const ally = this.units.find((candidate) => candidate.id === allyId);
    if (!unit || !ally || !this.getMiloRescueAllies(unit).some((candidate) => candidate.id === ally.id)) return;
    const destinations = this.getMiloRescueDestinationTiles(unit);
    if (destinations.length === 0) {
      this.helpText.setText("No free tile is in range for Rescue Sprint.");
      return;
    }
    this.pendingMiloRescue = { ...pending, stage: "destination", allyId: ally.id };
    this.targetTiles = destinations;
    this.redrawSelection();
    this.helpText.setText(`Choose where ${ally.name} should land. Press Space to cancel.`);
  },

  useMiloRescueSprint(x, y) {
    const pending = this.pendingMiloRescue;
    const unit = this.units.find((candidate) => candidate.id === pending?.unitId);
    const ally = this.units.find((candidate) => candidate.id === pending?.allyId);
    const skill = this.getSkillById(unit, pending?.skillId);
    if (!unit || !ally || !skill || !this.canUseSkill(unit, skill)) return false;
    if (!this.getMiloRescueDestinationTiles(unit).some((tile) => tile.x === x && tile.y === y)) {
      this.helpText.setText("Choose a highlighted free tile for Rescue Sprint.");
      return false;
    }
    const sprite = this.unitSprites[ally.id];
    this.closeSelectionMenu(false);
    this.pendingMiloRescue = null;
    this.spendSkillCost(unit, skill);
    unit.acted = true;
    this.busy = true;
    this.moveTiles = [];
    this.targetTiles = [];
    this.redrawSelection();
    this.showSkillBanner(skill.name);
    this.playUnitState(unit, skill.animationState || "move", 620);
    ally.x = x;
    ally.y = y;
    ally.facing = unit.facing || ally.facing || "down";
    this.refreshUnitSprite(unit);
    const finish = () => {
      this.refreshUnitSprite(ally);
      this.setUnitSpriteFrame(ally, "idle", ally.facing || "down");
      this.updateSelectedPanel();
      this.busy = false;
      this.clearSelection(`${unit.name} used ${skill.name}.`);
      this.checkEndOfPlayerPhase();
    };
    if (sprite) {
      this.tweens.add({
        targets: sprite.container,
        x: this.boardX + x * TILE_SIZE + TILE_SIZE / 2,
        y: this.boardY + y * TILE_SIZE + TILE_SIZE / 2,
        duration: 280,
        ease: "Cubic.Out",
        onComplete: finish,
      });
    } else {
      finish();
    }
    return true;
  },

  spawnMiloDecoy(unit) {
    const tile = this.getFreeAdjacentTiles(unit.x, unit.y, true)[0];
    if (!tile) return null;
    const decoy = {
      ...unit,
      id: `milo_decoy_${Date.now()}`,
      name: "Milo?",
      title: "Decoy",
      className: "Decoy",
      x: tile.x,
      y: tile.y,
      hp: Math.max(1, unit.hp || 1),
      maxHp: Math.max(1, unit.maxHp || unit.hp || 1),
      move: 0,
      weapons: [],
      skills: [],
      items: [],
      acted: true,
      isMiloDecoy: true,
      decoyTurnsRemaining: 2,
      permanentRecruit: false,
      color: 0x67e8f9,
    };
    this.units.push(decoy);
    const sprite = this.createUnitSprite(decoy);
    this.unitSprites[decoy.id] = sprite;
    this.unitLayer.add(sprite.container);
    this.refreshUnitSprite(decoy);
    this.setUnitSpriteFrame(decoy, "idle", decoy.facing || "down");
    return decoy;
  },

  chooseActionSkill(unitId) {
    const unit = this.units.find((u) => u.id === unitId);
    if (!unit || unit.team !== "player" || unit.acted) return;
    const skills = this.getAvailableSkills(unit);
    if (skills.length === 0) {
      this.helpText.setText(`${unit.name} has no skills yet. Choose another action.`);
      return;
    }
    this.showSkillMenu(unit);
  },

  showSkillMenu(unit) {
    this.showChoiceMenu(unit, {
      type: "skill",
      title: "Skills",
      entries: this.getAvailableSkills(unit),
      emptyText: `${unit.name} has no skills yet.`,
      getLabel: (skill) => skill.type === "passive" ? `${skill.name} (Passive)` : `${skill.name} (${skill.cost || 0} SP)`,
      layout: "leftPanel",
      getSummary: (skill) => this.getSkillSummary(unit, skill),
      getTargets: (skill) => skill.id === "parley"
        ? this.getParleyTargets(unit)
        : skill.id === "rescueSprint"
          ? this.getMiloRescueAllies(unit)
          : this.getSkillTargetsAt(unit, skill, unit.x, unit.y),
      getPreviewTiles: (skill) => skill.id === "parley"
        ? this.getParleyTargets(unit)
        : skill.id === "rescueSprint"
          ? this.getMiloRescueAllies(unit)
          : this.getSkillHitTilesAt(unit, skill, unit.x, unit.y),
      canChoose: (skill) => this.canUseSkill(unit, skill),
      disabledText: (skill) => skill.type === "passive" ? `${skill.name} is always active.` : `${skill.name} needs ${skill.cost} Sigil Points.`,
      onChoose: (skill) => {
        if (!this.canUseSkill(unit, skill)) {
          this.helpText.setText(skill.type === "passive" ? `${skill.name} is always active.` : `${skill.name} needs ${skill.cost} Sigil Points.`);
          return;
        }
        if (skill.id === "parley") {
          this.beginParleyTargetSelection(unit, skill);
          return;
        }
        if (skill.id === "rescueSprint") {
          this.beginMiloRescueAllySelection(unit, skill);
          return;
        }
        const hitTiles = this.getSkillHitTilesAt(unit, skill, unit.x, unit.y);
        if (hitTiles.length === 0) {
          this.helpText.setText(`No valid tiles are in range for ${skill.name}. Choose another action.`);
          return;
        }
        this.closeSelectionMenu(false);
        this.useSkill(unit.id, skill.id, { endTurn: true });
      },
    });
  },

  showChoiceMenu(unit, config) {
    if (!unit || !config) return;
    const entries = config.entries || [];
    if (entries.length === 0) {
      this.helpText.setText(config.emptyText || "Nothing available.");
      return;
    }

    this.closeActionMenu();
    this.closeSelectionMenu(false);
    this.pendingItemUse = null;
    this.pendingMiloRescue = null;
    this.selectedUnitId = unit.id;
    this.moveTiles = [];
    this.targetTiles = [];
    this.targetTileColor = null;
    this.targetTileStroke = null;
    this.redrawSelection();
    this.updateSelectedPanel();

    const centerX = this.boardX + unit.x * TILE_SIZE + TILE_SIZE / 2;
    const centerY = this.boardY + unit.y * TILE_SIZE + TILE_SIZE / 2;
    const isAllyPick = config.type === "allyPick";
    const rowHeight = config.layout === "leftPanel" ? 38 : 42;
    const menuWidth = isAllyPick ? 250 : (config.layout === "leftPanel" ? 184 : 310);
    const menuHeight = config.layout === "leftPanel"
      ? Phaser.Math.Clamp(142 + entries.length * rowHeight, 214, 330)
      : Phaser.Math.Clamp(132 + entries.length * rowHeight, 210, 430);
    const maxRightBeforeSidePanel = 708;
    const x = isAllyPick
      ? GAME_WIDTH / 2 + 142
      : config.layout === "leftPanel"
      ? 92
      : Phaser.Math.Clamp(centerX + TILE_SIZE * 1.1, menuWidth / 2 + 8, maxRightBeforeSidePanel - menuWidth / 2);
    const y = isAllyPick
      ? GAME_HEIGHT / 2
      : config.layout === "leftPanel"
      ? Phaser.Math.Clamp(190 + menuHeight / 2, menuHeight / 2 + 8, GAME_HEIGHT - menuHeight / 2 - 8)
      : Phaser.Math.Clamp(centerY, menuHeight / 2 + 8, GAME_HEIGHT - menuHeight / 2 - 8);
    const container = this.add.container(x, y).setDepth(9999);
    const panel = createBannerPanel(this, 0, 0, menuWidth, menuHeight, { innerInset: 12 });
    const title = this.add.text(0, -menuHeight / 2 + 26, config.title || "Menu", {
      fontSize: "18px",
      fontStyle: "bold",
      color: "#f7ecd3",
      stroke: "#0b0811",
      strokeThickness: 3,
    }).setOrigin(0.5);

    this.selectionMenuSummaryText = this.add.text(-menuWidth / 2 + 18, menuHeight / 2 - 64, "Hover an option to preview it.", {
      fontSize: config.layout === "leftPanel" ? "10px" : "11px",
      color: "#d8c4f0",
      wordWrap: { width: menuWidth - 36 },
      lineSpacing: 2,
    });

    const backText = this.add.text(0, menuHeight / 2 - 18, "Space: back", {
      fontSize: "11px",
      color: "#cbd5e1",
    }).setOrigin(0.5);

    container.add([panel.container, title, this.selectionMenuSummaryText, backText]);
    const getAllyPreviewText = (entry) => {
      const weapon = entry.weapons?.[0];
      const minRange = weapon?.minRange ?? weapon?.range ?? "-";
      const maxRange = weapon?.maxRange ?? weapon?.range ?? "-";
      const range = minRange === maxRange ? minRange : `${minRange}-${maxRange}`;
      return [
        `Lv ${entry.level ?? 1} ${entry.className}`,
        weapon ? `${weapon.name}  Rng ${range}` : "Unarmed",
        `HP ${entry.maxHp}  SP ${entry.maxSigilPoints ?? entry.sigilPoints ?? 0}`,
        `STR ${entry.str}  MAG ${entry.mag}`,
        `DEF ${entry.def}  RES ${entry.res}`,
        `SPD ${entry.spd}`,
      ].join("\n");
    };
    let allyPreviewPortrait = null;
    let allyPreviewStats = null;
    if (isAllyPick) {
      const previewX = -menuWidth / 2 - 126;
      const previewFrame = this.add.rectangle(previewX, -4, 230, 292, 0x1e1030, 1);
      previewFrame.setStrokeStyle(2, 0xe4d0a8);
      allyPreviewPortrait = this.add.image(previewX, -78, "leonPortrait").setDisplaySize(106, 126);
      allyPreviewStats = this.add.text(previewX, 0, "", {
        fontSize: "12px",
        color: "#eadff7",
        align: "center",
        lineSpacing: 3,
      }).setOrigin(0.5, 0);
      container.add([previewFrame, allyPreviewPortrait, allyPreviewStats]);
    }

    entries.forEach((entry, index) => {
      const rowY = -menuHeight / 2 + 66 + index * rowHeight;
      const label = config.getLabel ? config.getLabel(entry) : entry.name;
      const canChoose = config.canChoose ? config.canChoose(entry) : true;
      const button = createBannerButton(this, 0, rowY, menuWidth - 26, config.layout === "leftPanel" ? 30 : 32, label, () => {
        if (!canChoose) {
          this.helpText.setText(config.disabledText ? config.disabledText(entry) : "That option cannot be used now.");
          return;
        }
        if (typeof config.onChoose === "function") config.onChoose(entry);
      }, config.layout === "leftPanel" ? "12px" : "14px");

      button.container.setAlpha(canChoose ? 1 : 0.45);
      button.hit.on("pointerover", () => {
        const previewTiles = config.getPreviewTiles ? config.getPreviewTiles(entry) : (config.getTargets ? config.getTargets(entry) : []);
        const highlight = TARGET_HIGHLIGHT[config.type] || TARGET_HIGHLIGHT.skill;
        this.showTargetHighlightsForUnits(previewTiles, highlight.fill, highlight.stroke);
        if (this.selectionMenuSummaryText) {
          this.selectionMenuSummaryText.setText(config.getSummary ? config.getSummary(entry) : "");
        }
        if (isAllyPick && allyPreviewPortrait && allyPreviewStats) {
          const portraitKey = entry.portraitKey && this.textures.exists(entry.portraitKey) ? entry.portraitKey : "leonPortrait";
          allyPreviewPortrait.setTexture(portraitKey).setVisible(true);
          allyPreviewStats.setText(getAllyPreviewText(entry));
        }
      });
      button.hit.on("pointerout", () => {
        if (this.selectionMenuSummaryText) {
          this.selectionMenuSummaryText.setText(config.getSummary ? config.getSummary(entry) : "");
        }
      });
      container.add(button.container);
    });

    this.selectionMenuContainer = container;
    this.selectionMenuOpen = true;
    this.selectionMenuType = config.type || "menu";
    this.uiLayer.add(container);

    const firstEntry = entries[0];
    if (firstEntry) {
      const previewTiles = config.getPreviewTiles ? config.getPreviewTiles(firstEntry) : (config.getTargets ? config.getTargets(firstEntry) : []);
      const highlight = TARGET_HIGHLIGHT[config.type] || TARGET_HIGHLIGHT.skill;
      this.showTargetHighlightsForUnits(previewTiles, highlight.fill, highlight.stroke);
      if (this.selectionMenuSummaryText) {
        this.selectionMenuSummaryText.setText(config.getSummary ? config.getSummary(firstEntry) : "");
      }
      if (isAllyPick && allyPreviewPortrait && allyPreviewStats) {
        const portraitKey = firstEntry.portraitKey && this.textures.exists(firstEntry.portraitKey) ? firstEntry.portraitKey : "leonPortrait";
        allyPreviewPortrait.setTexture(portraitKey).setVisible(true);
        allyPreviewStats.setText(getAllyPreviewText(firstEntry));
      }
    }

    this.helpText.setText(`${config.title || "Menu"}: choose an option, or press Space to go back.`);
  },

  showTargetHighlightsForUnits(targets, fillColor = 0xa78bfa, strokeColor = 0xddd6fe) {
    this.overlayLayer.removeAll(true);

    for (const unit of this.units) {
      const sprite = this.unitSprites[unit.id];
      if (sprite) sprite.marker.setStrokeStyle(2, 0xffffff);
    }

    const selectedUnit = this.getSelectedUnit();
    const selectedSprite = selectedUnit ? this.unitSprites[selectedUnit.id] : null;
    if (selectedSprite) selectedSprite.marker.setStrokeStyle(4, 0xfde68a);

    (targets || []).forEach((target) => {
      if (!target) return;
      const x = this.boardX + target.x * TILE_SIZE;
      const y = this.boardY + target.y * TILE_SIZE;
      const overlay = this.add.rectangle(x + TILE_SIZE / 2, y + TILE_SIZE / 2, TILE_SIZE - 10, TILE_SIZE - 10, fillColor, 0.42);
      overlay.setStrokeStyle(2, strokeColor, 0.95);
      this.overlayLayer.add(overlay);
    });
  },

  getRecruitmentConfig(target) {
    if (!target) return null;
    return RECRUITMENT_CONFIG[target.id] || RECRUITMENT_CONFIG[target.recruitmentId] || null;
  },

  isRecruitableTarget(target) {
    const config = this.getRecruitmentConfig(target);
    return !!target && target.team === "enemy" && target.hp > 0 && target.recruitmentLocked !== true && config?.recruitable === true;
  },

  getParleyTargets(unit) {
    if (!unit) return [];
    return this.units.filter((target) => (
      this.isRecruitableTarget(target) &&
      distance(unit, target) === 1
    ));
  },

  getParleyRelationship(unit, target) {
    const config = this.getRecruitmentConfig(target);
    if (!unit || !target || !config) return { type: "neutral", boost: 0 };
    const configuredBoost = config.parleyBoosts?.[unit.id] || 0;
    if (Array.isArray(config.terribleHistory) && config.terribleHistory.includes(unit.id)) {
      return { type: "terrible", boost: 0 };
    }
    if (config.terribleHistory === "all") return { type: "terrible", boost: 0 };
    if (Array.isArray(config.positiveClose) && config.positiveClose.includes(unit.id)) {
      return { type: "positiveClose", boost: 25 + configuredBoost };
    }
    if (config.positiveClose === "all") return { type: "positiveClose", boost: 25 + configuredBoost };
    if (Array.isArray(config.negativeClose) && config.negativeClose.includes(unit.id)) {
      return { type: "negativeClose", boost: -25 + configuredBoost };
    }
    if (config.negativeClose === "all") return { type: "negativeClose", boost: -25 + configuredBoost };
    if (Array.isArray(config.positive) && config.positive.includes(unit.id)) {
      return { type: "positive", boost: 12 + configuredBoost };
    }
    if (config.positive === "all") return { type: "positive", boost: 12 + configuredBoost };
    if (Array.isArray(config.negative) && config.negative.includes(unit.id)) {
      return { type: "negative", boost: -12 + configuredBoost };
    }
    if (config.negative === "all") return { type: "negative", boost: -12 + configuredBoost };
    return { type: "neutral", boost: configuredBoost };
  },

  getParleyChance(unit, target) {
    if (!unit || !target) return 0;
    const maxHp = Math.max(1, target.maxHp || target.hp || 1);
    const currentHp = Phaser.Math.Clamp(target.hp || 0, 1, maxHp);
    const missingRatio = maxHp <= 1 ? 1 : (maxHp - currentHp) / (maxHp - 1);
    const baseChance = 0.5 + missingRatio * 49.5;
    const relationship = this.getParleyRelationship(unit, target);
    return Phaser.Math.Clamp(baseChance + relationship.boost, 0, 75);
  },

  beginParleyTargetSelection(unit, skill = PARLEY_SKILL) {
    if (!unit || !skill) return;
    const targets = this.getParleyTargets(unit);
    if (targets.length === 0) {
      this.helpText.setText("No recruitable enemy is adjacent for Parley.");
      return;
    }
    this.closeSelectionMenu(false);
    this.selectedUnitId = unit.id;
    this.pendingParleyUse = { unitId: unit.id, skillId: skill.id };
    this.moveTiles = [];
    this.targetTiles = targets;
    this.targetTileColor = TARGET_HIGHLIGHT.skill.fill;
    this.targetTileStroke = TARGET_HIGHLIGHT.skill.stroke;
    this.redrawSelection();
    this.updateSelectedPanel();
    this.helpText.setText(`Choose who ${unit.name} parleys with. Press Space to cancel.`);
  },

  showCenteredPopup(message, onComplete = null) {
    const container = this.add.container(GAME_WIDTH / 2, GAME_HEIGHT / 2).setDepth(12000).setAlpha(0);
    const panel = createBannerPanel(this, 0, 0, 520, 116, { innerInset: 16 });
    const text = this.add.text(0, 0, message || "", {
      fontSize: "24px",
      fontStyle: "bold",
      color: "#f7ecd3",
      stroke: "#0b0811",
      strokeThickness: 4,
      align: "center",
      wordWrap: { width: 460 },
    }).setOrigin(0.5);
    container.add([panel.container, text]);
    this.uiLayer.add(container);
    this.tweens.add({
      targets: container,
      alpha: 1,
      duration: 180,
      ease: "Quad.Out",
      onComplete: () => {
        this.time.delayedCall(1400, () => {
          this.tweens.add({
            targets: container,
            alpha: 0,
            duration: 220,
            ease: "Quad.Out",
            onComplete: () => {
              container.destroy();
              if (typeof onComplete === "function") onComplete();
            },
          });
        });
      },
    });
  },

  finishParleyAttempt(unit, message = null) {
    if (unit) {
      unit.acted = true;
      this.refreshUnitSprite(unit);
    }
    this.pendingParleyUse = null;
    this.targetTiles = [];
    this.targetTileColor = null;
    this.targetTileStroke = null;
    this.busy = false;
    this.redrawSelection();
    this.updateSelectedPanel();
    this.clearSelection(message || `${unit?.name || "Unit"} used Parley.`);
    this.checkEndOfPlayerPhase();
  },

  useParley(unitId, targetId) {
    const unit = this.units.find((candidate) => candidate.id === unitId);
    const target = this.units.find((candidate) => candidate.id === targetId);
    const skill = this.getSkillById(unit, "parley");
    if (!unit || !target || !skill || unit.acted || unit.hp <= 0 || !this.canUseSkill(unit, skill)) return false;
    if (!this.getParleyTargets(unit).some((candidate) => candidate.id === target.id)) {
      this.helpText.setText(`${target.name} cannot be targeted by Parley.`);
      return false;
    }

    const config = this.getRecruitmentConfig(target);
    const relationship = this.getParleyRelationship(unit, target);
    this.closeActionMenu();
    this.closeSelectionMenu(false);
    this.pendingParleyUse = null;
    delete unit.pendingMoveOrigin;
    this.busy = true;
    this.selectedUnitId = unit.id;
    this.moveTiles = [];
    this.targetTiles = [];
    this.targetTileColor = null;
    this.targetTileStroke = null;
    this.redrawSelection();
    this.spendSkillCost(unit, skill);
    this.refreshUnitSprite(unit);
    this.updateSelectedPanel();
    this.showSkillBanner(skill.name);
    this.helpText.setText(`${unit.name} uses Parley on ${target.name}.`);

    if (relationship.type === "terrible") {
      this.awardParleyXp(unit, target, false);
      const lockoutLine = config?.lockoutLine || "Not after everything you have done.";
      this.showChapterTwoSetupDialogue({
        speaker: target.name,
        portrait: target.portraitKey,
        text: lockoutLine,
        onContinue: () => {
          this.showCenteredPopup(`${target.name} will never join the likes of you`, () => {
            this.finishParleyAttempt(unit, `${target.name} refused to join.`);
          });
        },
      });
      return true;
    }

    const chance = this.getParleyChance(unit, target);
    const succeeded = Phaser.Math.FloatBetween(0, 100) < chance;
    if (!succeeded) {
      this.awardParleyXp(unit, target, false);
      if (Array.isArray(config?.lockoutFailureUnits) && config.lockoutFailureUnits.includes(unit.id)) {
        target.recruitmentLocked = true;
        this.time.delayedCall(420, () => {
          this.showSkillBanner("FAILED");
          this.showChapterTwoSetupDialogue({
            speaker: target.name,
            portrait: target.portraitKey,
            text: config.lockoutLine || "I will not join you.",
            onContinue: () => this.finishParleyAttempt(unit, `${target.name} refused to join.`),
          });
        });
        return true;
      }
      this.time.delayedCall(420, () => {
        this.showSkillBanner("FAILED");
        this.finishParleyAttempt(unit, `${unit.name}'s Parley failed.`);
      });
      return true;
    }

    const successLine = config?.successLines?.[unit.id] || config?.successLine || "Fine. I'm with you.";
    const completeRecruitment = () => {
      this.awardParleyXp(unit, target, true);
      const shouldRecruitHeal = target.boss === true;
      target.team = "player";
      target.acted = true;
      target.sigilPoints = target.sigilPoints ?? target.maxSigilPoints ?? 3;
      if (shouldRecruitHeal) {
        const maxHp = Math.max(1, target.maxHp || target.hp || 1);
        const healed = Math.min(Math.ceil(maxHp * 0.5), Math.max(0, maxHp - (target.hp || 0)));
        target.hp = Math.min(maxHp, (target.hp || 0) + healed);
        if (healed > 0) {
          this.showFloatingText(this.boardX + target.x * TILE_SIZE + TILE_SIZE / 2, this.boardY + target.y * TILE_SIZE + 8, `+${healed} HP`, "#86efac");
        }
      }
      target.spriteState = "idle";
      this.refreshUnitSprite(target);
      this.setUnitSpriteFrame(target, "idle", target.facing || "down");
      this.showCenteredPopup(`${target.name} joined The Bards!`, () => {
        this.finishParleyAttempt(unit, `${target.name} joined The Bards!`);
      });
    };
    const showTargetSuccessLine = () => {
      this.showChapterTwoSetupDialogue({
        speaker: target.name,
        portrait: target.portraitKey,
        text: successLine,
        onContinue: completeRecruitment,
      });
    };
    const successOpener = config?.successOpeners?.[unit.id];
    if (successOpener) {
      this.showChapterTwoSetupDialogue({
        speaker: successOpener.speaker || unit.name,
        portrait: successOpener.portrait || unit.portraitKey,
        text: successOpener.text,
        onContinue: showTargetSuccessLine,
      });
      return true;
    }
    showTargetSuccessLine();
    return true;
  },

  getSkillSummary(unit, skill) {
    if (!unit || !skill) return "";
    const targets = this.getSkillTargetsAt(unit, skill, unit.x, unit.y);
    const hitTiles = this.getSkillHitTilesAt(unit, skill, unit.x, unit.y);
    let effect = "Uses a special technique.";

    if (skill.id === "parley") {
      const parleyTargets = this.getParleyTargets(unit);
      const targetText = parleyTargets.length === 1
        ? `Chance on ${parleyTargets[0].name}: ${this.getParleyChance(unit, parleyTargets[0]).toFixed(1)}%.`
        : `${parleyTargets.length} adjacent recruitable targets.`;
      return `${skill.name}: requires 3 Sigil Points and spends all current SP. Attempts to recruit an adjacent boss. ${targetText}`;
    }

    if (skill.id === "phoenixReckoning") {
      const missingHp = Math.max(0, (unit.maxHp || unit.hp || 0) - (unit.hp || 0));
      return `${skill.name}: costs 1 Sigil Point. Hits 3 tiles straight ahead for MAG + missing HP damage. Current bonus: +${missingHp}.`;
    }

    if (skill.id === "brothersBligh") {
      const partner = this.getBrotherSkillPartner(unit);
      const power = this.getCombinedBrotherPower();
      effect = `Combines Edwin and Leon's STR + MAG for ${power} damage in a 3x2 blast ahead of ${unit.name}. Costs 3 SP from both brothers${partner ? "" : " (partner missing)"}.`;
    } else if (skill.id === "rescueSprint") {
      effect = `Warps an adjacent ally to a free tile up to ${Math.floor((unit.spd || 0) / 2)} tiles away.`;
    } else if (skill.id === "decoyBoy") {
      effect = "Creates a decoy copy on an adjacent free tile for 2 enemy phases.";
    } else if (skill.id === "slowRebuke") {
      effect = "Stores damage Milo takes during the next enemy phase and adds it to his first attack next turn.";
    } else if (skill.damageFormula === "resHeal") {
      effect = `Restores ${unit.res || 0} HP to allies in the surrounding squares.`;
    } else if (skill.damageFormula === "ashMissingHpMag") {
      const missingHp = Math.max(0, (unit.maxHp || unit.hp || 0) - (unit.hp || 0));
      effect = `Deals ${(unit.mag || 0) + missingHp} damage in a 3-tile line straight ahead.`;
    } else if (skill.type === "selfBuff") {
      effect = "Focuses the user for a personal follow-up effect.";
    } else if (skill.damageFormula === "mag") {
      effect = `Deals ${unit.mag || 0} damage to every unit in the surrounding squares.`;
    } else if (skill.damageFormula === "strPlusSpd") {
      effect = `Deals ${(unit.str || 0) + (unit.spd || 0)} damage to every unit in the surrounding squares.`;
    } else if (skill.damageFormula === "strPlusMag") {
      effect = `Deals ${(unit.str || 0) + (unit.mag || 0)} damage to every unit in the surrounding squares.`;
    }

    return `${skill.name}: costs ${skill.cost || 0} Sigil Point${(skill.cost || 0) === 1 ? "" : "s"}. ${effect} Hit zone: ${hitTiles.length} tile${hitTiles.length === 1 ? "" : "s"}. Units currently hit: ${targets.length}.`;
  },

  getSkillById(unit, skillId) {
    return this.getAvailableSkills(unit).find((skill) => skill.id === skillId) || null;
  },

  canUseSkill(unit, skill) {
    if (!unit || !skill) return false;

    if (skill.id === "parley") {
      return unit.team === "player" && (unit.sigilPoints ?? 0) >= (skill.cost ?? 0);
    }

    if (skill.id === "brothersBligh") {
      const partner = this.getBrotherSkillPartner(unit);
      return this.areBrothersAdjacent() &&
        !!partner &&
        (unit.sigilPoints ?? 0) >= (skill.cost ?? 0) &&
        (partner.sigilPoints ?? 0) >= (skill.partnerCost ?? skill.cost ?? 0);
    }

    if (skill.type === "passive") return false;

    if (skill.id === "rescueSprint") {
      return unit.id === "milo" && (unit.sigilPoints ?? 0) >= (skill.cost ?? 0) && this.getMiloRescueAllies(unit).length > 0;
    }

    if (skill.id === "decoyBoy") {
      return unit.id === "milo" && (unit.sigilPoints ?? 0) >= (skill.cost ?? 0) && this.getFreeAdjacentTiles(unit.x, unit.y, true).length > 0;
    }

    return (unit.sigilPoints ?? 0) >= (skill.cost ?? 0);
  },

  getSkillHitTilesAt(unit, skill, x = unit.x, y = unit.y) {
    if (!unit || !skill) return [];

    if (skill.type === "selfBuff" || skill.type === "miloDecoy" || skill.type === "slowRebuke") return [{ x, y }];
    if (skill.type === "rescueSprint") return this.getMiloRescueAllies(unit);

    if (skill.type === "meleeSingle" || skill.type === "rangedSingle") {
      const range = skill.range || 1;
      const tiles = [];
      for (let tileY = 0; tileY < this.mapRows; tileY += 1) {
        for (let tileX = 0; tileX < this.mapCols; tileX += 1) {
          const dist = Math.abs(tileX - x) + Math.abs(tileY - y);
          if (dist > 0 && dist <= range) tiles.push({ x: tileX, y: tileY });
        }
      }
      return tiles;
    }

    if (skill.type === "adjacentSquare") {
      const tiles = [];
      for (let dy = -1; dy <= 1; dy += 1) {
        for (let dx = -1; dx <= 1; dx += 1) {
          if (dx === 0 && dy === 0) continue;
          const tileX = x + dx;
          const tileY = y + dy;
          if (this.isInBounds(tileX, tileY)) tiles.push({ x: tileX, y: tileY });
        }
      }
      return tiles;
    }

    if (skill.type === "cardinalLine") {
      const tiles = [];
      const facing = CARDINAL_DIRECTIONS.includes(unit.facing) ? unit.facing : "down";
      const range = skill.range || 3;

      for (let step = 1; step <= range; step += 1) {
        let tileX = x;
        let tileY = y;
        if (facing === "down") tileY = y + step;
        else if (facing === "up") tileY = y - step;
        else if (facing === "right") tileX = x + step;
        else if (facing === "left") tileX = x - step;
        if (this.isInBounds(tileX, tileY)) tiles.push({ x: tileX, y: tileY });
      }

      return tiles;
    }

    if (skill.type === "forwardRectangle") {
      const tiles = [];
      const facing = CARDINAL_DIRECTIONS.includes(unit.facing) ? unit.facing : "down";
      const depth = skill.depth || 2;
      const halfWidth = Math.floor((skill.width || 3) / 2);

      for (let forward = 1; forward <= depth; forward += 1) {
        for (let side = -halfWidth; side <= halfWidth; side += 1) {
          let tileX = x;
          let tileY = y;

          if (facing === "down") {
            tileX = x + side;
            tileY = y + forward;
          } else if (facing === "up") {
            tileX = x + side;
            tileY = y - forward;
          } else if (facing === "right") {
            tileX = x + forward;
            tileY = y + side;
          } else if (facing === "left") {
            tileX = x - forward;
            tileY = y + side;
          }

          if (this.isInBounds(tileX, tileY)) tiles.push({ x: tileX, y: tileY });
        }
      }

      return tiles;
    }

    return [];
  },

  getSkillTargetsAt(unit, skill, x = unit.x, y = unit.y) {
    if (!unit || !skill) return [];

    const hitTileKeys = new Set(this.getSkillHitTilesAt(unit, skill, x, y).map((tile) => tileKey(tile.x, tile.y)));
    if (hitTileKeys.size === 0) return [];

    if (skill.type === "selfBuff" || skill.type === "miloDecoy" || skill.type === "slowRebuke") return [unit];
    if (skill.type === "rescueSprint") return this.getMiloRescueAllies(unit);

    return this.units.filter((other) => {
      if (!other || other.id === unit.id || other.hp <= 0) return false;
      if (!hitTileKeys.has(tileKey(other.x, other.y))) return false;
      if (skill.targetTeam === "enemy" && unit.team === "player" && other.team !== "enemy") return false;
      if (skill.targetTeam === "enemy" && unit.team !== "player" && other.team === unit.team) return false;
      if (skill.targetTeam === "ally" && other.team !== unit.team) return false;
      return true;
    });
  },

  calculateSkillDamage(unit, target, skill) {
    if (!unit || !skill) return 0;
    if (skill.damageFormula === "mag") return Math.max(0, unit.mag || 0);
    if (skill.damageFormula === "strPlusSpd") return Math.max(0, (unit.str || 0) + (unit.spd || 0));
    if (skill.damageFormula === "strPlusMag") return Math.max(0, (unit.str || 0) + (unit.mag || 0));
    if (skill.damageFormula === "brothersCombinedStrMag") return Math.max(0, this.getCombinedBrotherPower());
    if (skill.damageFormula === "ashMissingHpMag") return Math.max(0, (unit.mag || 0) + Math.max(0, (unit.maxHp || unit.hp || 0) - (unit.hp || 0)));
    if (skill.damageFormula === "resHeal") return -Math.max(0, unit.res || 0);
    if (skill.damageFormula === "none") return 0;
    return Math.max(0, skill.baseDamage || 0);
  },

  useSkill(unitId, skillId, options = {}) {
    const unit = this.units.find((u) => u.id === unitId);
    const skill = this.getSkillById(unit, skillId);
    if (!unit || !skill || unit.hp <= 0 || !this.canUseSkill(unit, skill)) return false;
    const hitTiles = this.getSkillHitTilesAt(unit, skill, unit.x, unit.y);
    const targets = this.getSkillTargetsAt(unit, skill, unit.x, unit.y);
    if (hitTiles.length === 0) return false;
    this.closeActionMenu();
    this.closeSelectionMenu(false);
    this.pendingItemUse = null;
    this.pendingParleyUse = null;
    this.pendingMiloRescue = null;
    delete unit.pendingMoveOrigin;
    this.busy = true;
    this.selectedUnitId = unit.id;
    this.moveTiles = [];
    this.targetTiles = [];
    this.targetTileColor = null;
    this.targetTileStroke = null;
    this.redrawSelection();
    this.updateSelectedPanel();
    this.spendSkillCost(unit, skill);
    this.refreshUnitSprite(unit);
    this.updateSelectedPanel();
    this.showSkillBanner(skill.name);
    this.helpText.setText(`${unit.name} uses ${skill.name}!`);

    if (skill.id === "decoyBoy") {
      const decoy = this.spawnMiloDecoy(unit);
      if (!decoy) {
        this.busy = false;
        this.helpText.setText("No adjacent free tile for Decoy Boy.");
        return false;
      }
      if (options.endTurn !== false) unit.acted = true;
      this.refreshUnitSprite(unit);
      this.time.delayedCall(520, () => {
        this.busy = false;
        this.clearSelection(`${unit.name} created a decoy.`);
        this.checkEndOfPlayerPhase();
      });
      return true;
    }

    if (skill.id === "slowRebuke") {
      unit.slowRebukeGuard = true;
      unit.slowRebukeDamageTaken = 0;
      unit.slowRebukeReadyDamage = 0;
      if (options.endTurn !== false) unit.acted = true;
      this.refreshUnitSprite(unit);
      this.time.delayedCall(520, () => {
        this.busy = false;
        this.clearSelection(`${unit.name} braces for Slow Rebuke.`);
        this.checkEndOfPlayerPhase();
      });
      return true;
    }

    const beginSkillImpact = () => {
      if (skill.animationState === "spin") {
        this.playUnitSpinAnimation(unit, SKILL_IMPACT_DELAY + 450);
      } else {
        this.playUnitState(unit, skill.animationState || "attack", SKILL_IMPACT_DELAY + 450);
      }

      const targetResults = targets.map((target) => ({ target, wasAlive: target.hp > 0, damage: this.calculateSkillDamage(unit, target, skill) }));
      this.time.delayedCall(SKILL_IMPACT_DELAY, () => {
        this.playSkillTileEffects(unit, skill);
      let totalXp = 0;
      let defeatedFalan = false;
      const defeatedPlayerUnits = [];
      targetResults.forEach((entry, index) => {
        const target = entry.target;
        if (!target || target.hp <= 0) return;
        if (entry.damage < 0) {
          const healed = Math.min(-entry.damage, Math.max(0, (target.maxHp || target.hp || 1) - target.hp));
          target.hp = Math.min(target.maxHp || target.hp, target.hp + healed);
          this.showFloatingText(this.boardX + target.x * TILE_SIZE + TILE_SIZE / 2, this.boardY + target.y * TILE_SIZE + 8, `+${healed} HP`, "#86efac");
        } else {
          target.hp = Math.max(0, target.hp - entry.damage);
          if (target.id === "milo" && target.slowRebukeGuard === true && this.phase === "enemy" && entry.damage > 0) {
            target.slowRebukeDamageTaken = (target.slowRebukeDamageTaken || 0) + entry.damage;
          }
          this.showCombatResultText(target, { hit: true, critical: false, damage: entry.damage }, index);
          this.time.delayedCall(index * 120, () => this.playUnitHurt(target, 360));
        }
        const didKill = entry.wasAlive && target.hp <= 0;
        if (didKill) {
          if (target.id === "falan") defeatedFalan = true;
          if (target.team === "player" && target.isMiloDecoy !== true) defeatedPlayerUnits.push(target);
          if (unit.team === "player" && target.team === "enemy") totalXp += this.calculateXpGain(unit, target, true);
        } else if (entry.damage >= 0) {
          this.awardSurvivalXp(target, unit, entry.wasAlive);
        }
      });
      if (totalXp > 0) this.awardXp(unit, totalXp);
      targetResults.forEach((entry) => {
        const target = entry.target;
        if (!target) return;
        if (target.hp <= 0) {
          if (target.id === "falan") {
            target.hp = 0;
            this.refreshUnitSprite(target);
          } else if (target.isMiloDecoy === true) {
            this.removeMiloDecoy(target);
          } else if (target.team === "player") {
            target.hp = 0;
            this.refreshUnitSprite(target);
          } else if (target.team === "civilian") {
            target.hp = 0;
            this.defeatedCivilians = [...new Set([...(this.defeatedCivilians || []), target.id])];
            this.playUnitDeath(target, () => this.removeUnitSpriteAndData(target.id));
          } else {
            this.playUnitDeath(target, () => this.removeUnitSpriteAndData(target.id));
          }
        } else {
          this.refreshUnitSprite(target);
          this.setUnitSpriteFrame(target, "idle", target.facing || "down");
        }
      });
      if (options.endTurn !== false) {
        unit.acted = skill.id === "shadowstep" ? false : true;
        if (skill.id === "battleFocus") unit.nextAttackBonus = 3;
        this.refreshUnitSprite(unit);
      }
      this.updateSelectedPanel();
      const finishDelay = 760 + targetResults.length * 120;
      this.time.delayedCall(finishDelay, () => {
        if (defeatedPlayerUnits.length > 0) {
          const gameOverUnit = defeatedPlayerUnits.find((target) => this.isGameOverUnitDeath(target)) || defeatedPlayerUnits[0];
          this.handleAllyUnitDeath(gameOverUnit, () => {
            this.busy = false;
            if (typeof options.onComplete === "function") {
              options.onComplete();
              return;
            }
            this.clearSelection(`${unit.name} used ${skill.name}.`);
            this.checkEndOfPlayerPhase();
          });
          return;
        }
        if (defeatedFalan) {
          const falan = this.units.find((candidate) => candidate.id === "falan");
          this.handleFalanDefeat(falan, () => {
            this.busy = false;
            if (typeof options.onComplete === "function") {
              options.onComplete();
              return;
            }
            this.clearSelection(`${unit.name} defeated Falan. Find the glowing gate and escape.`);
            this.checkEndOfPlayerPhase();
          });
          return;
        }
        this.busy = false;
        if (typeof options.onComplete === "function") {
          options.onComplete();
          return;
        }
        this.clearSelection(`${unit.name} used ${skill.name}.`);
        this.checkEndOfPlayerPhase();
      });
      });
    };

    if (skill.id === "brothersBligh") {
      this.playBrothersBlighCutin(beginSkillImpact);
    } else {
      beginSkillImpact();
    }

    return true;
  },

  chooseActionItem(unitId) {
    const unit = this.units.find((u) => u.id === unitId);
    if (!unit || unit.team !== "player" || unit.acted) return;
    const items = unit.items || [];
    if (items.length === 0) {
      this.helpText.setText(`${unit.name} has no items yet. Choose another action.`);
      return;
    }
    this.showItemMenu(unit);
  },

  getTradePartners(unit) {
    if (!unit || unit.team !== "player" || unit.acted || unit.hp <= 0) return [];
    return this.units.filter((other) => (
      other &&
      other.id !== unit.id &&
      other.team === "player" &&
      other.hp > 0 &&
      other.isMiloDecoy !== true &&
      distance(unit, other) === 1
    ));
  },

  chooseActionTrade(unitId) {
    const unit = this.units.find((u) => u.id === unitId);
    if (!unit || unit.team !== "player" || unit.acted) return;
    const partners = this.getTradePartners(unit);
    if (partners.length === 0) {
      this.helpText.setText("No adjacent ally to trade with.");
      return;
    }
    if (partners.length === 1) {
      this.openTradeWindow(unit.id, partners[0].id);
      return;
    }
    this.showChoiceMenu(unit, {
      type: "item",
      title: "Trade With",
      entries: partners,
      getLabel: (partner) => partner.name,
      getSummary: (partner) => `${partner.name}'s items: ${(partner.items || []).map((item) => item.name).join(", ") || "None"}`,
      getTargets: (partner) => [partner],
      onChoose: (partner) => this.openTradeWindow(unit.id, partner.id),
    });
  },

  closeTradeWindow() {
    if (this.tradeContainer) this.tradeContainer.destroy(true);
    this.tradeContainer = null;
    this.tradeOpen = false;
    this.tradeData = null;
  },

  openTradeWindow(unitId, partnerId) {
    const unit = this.units.find((candidate) => candidate.id === unitId);
    const partner = this.units.find((candidate) => candidate.id === partnerId);
    if (!unit || !partner || !this.getTradePartners(unit).some((candidate) => candidate.id === partner.id)) return;
    this.closeActionMenu();
    this.closeSelectionMenu(false);
    this.pendingItemUse = null;
    this.pendingParleyUse = null;
    this.pendingMiloRescue = null;
    this.tradeData = { unitId: unit.id, partnerId: partner.id, selected: null };
    this.tradeOpen = true;
    this.renderTradeWindow();
  },

  getTradeSlotCount(unit, partner) {
    return Math.max(4, (unit?.items || []).length + 1, (partner?.items || []).length + 1);
  },

  renderTradeWindow() {
    if (this.tradeContainer) this.tradeContainer.destroy(true);
    const unit = this.units.find((candidate) => candidate.id === this.tradeData?.unitId);
    const partner = this.units.find((candidate) => candidate.id === this.tradeData?.partnerId);
    if (!unit || !partner) {
      this.closeTradeWindow();
      return;
    }

    const container = this.add.container(0, 0).setDepth(16000);
    const dim = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.48).setInteractive();
    const panel = createBannerPanel(this, GAME_WIDTH / 2, GAME_HEIGHT / 2, 700, 400, { innerInset: 16 });
    const title = this.add.text(GAME_WIDTH / 2, 100, "Trade", {
      fontSize: "28px",
      fontStyle: "bold",
      color: "#f7ecd3",
      stroke: "#0b0811",
      strokeThickness: 4,
    }).setOrigin(0.5);
    const hint = this.add.text(GAME_WIDTH / 2, 132, "Choose an item, then choose a slot in the other inventory.", {
      fontSize: "13px",
      color: "#d8c4f0",
    }).setOrigin(0.5);
    container.add([dim, panel.container, title, hint]);

    const slotCount = this.getTradeSlotCount(unit, partner);
    const drawInventory = (owner, side, x) => {
      const name = this.add.text(x, 166, owner.name, {
        fontSize: "20px",
        fontStyle: "bold",
        color: side === "unit" ? "#93c5fd" : "#86efac",
        stroke: "#0b0811",
        strokeThickness: 3,
      }).setOrigin(0.5);
      container.add(name);

      for (let index = 0; index < slotCount; index += 1) {
        const item = owner.items?.[index] || null;
        const y = 204 + index * 42;
        const selected = this.tradeData?.selected?.side === side && this.tradeData.selected.index === index;
        const bg = this.add.rectangle(x, y, 276, 34, selected ? 0x315f3c : 0x1e1030, selected ? 1 : 0.92);
        bg.setStrokeStyle(2, selected ? 0x86efac : 0x70558c);
        bg.setInteractive({ useHandCursor: true });
        bg.on("pointerdown", () => this.chooseTradeSlot(side, index));
        const label = item ? `${item.name}${item.uses ? ` x${item.uses}` : ""}` : "Empty";
        const text = this.add.text(x - 126, y - 9, label, {
          fontSize: "13px",
          color: item ? "#f7ecd3" : "#8c7a9f",
        });
        container.add([bg, text]);
      }
    };

    drawInventory(unit, "unit", GAME_WIDTH / 2 - 176);
    drawInventory(partner, "partner", GAME_WIDTH / 2 + 176);

    const done = createBannerButton(this, GAME_WIDTH / 2, 486, 190, 38, "Done", () => this.finishTrade(), "16px");
    container.add(done.container);
    this.tradeContainer = container;
    this.uiLayer.add(container);
    this.helpText.setText(`${unit.name} is trading with ${partner.name}.`);
  },

  chooseTradeSlot(side, index) {
    const unit = this.units.find((candidate) => candidate.id === this.tradeData?.unitId);
    const partner = this.units.find((candidate) => candidate.id === this.tradeData?.partnerId);
    if (!unit || !partner) return;
    const inventories = { unit: unit.items || [], partner: partner.items || [] };
    unit.items = inventories.unit;
    partner.items = inventories.partner;
    const item = inventories[side]?.[index] || null;
    const selected = this.tradeData?.selected;

    if (!selected) {
      if (!item) return;
      this.tradeData.selected = { side, index };
      this.renderTradeWindow();
      return;
    }

    if (selected.side === side && selected.index === index) {
      this.tradeData.selected = null;
      this.renderTradeWindow();
      return;
    }

    const fromInventory = inventories[selected.side];
    const toInventory = inventories[side];
    const movingItem = fromInventory[selected.index] || null;
    if (!movingItem) {
      this.tradeData.selected = null;
      this.renderTradeWindow();
      return;
    }

    const targetItem = toInventory[index] || null;
    if (targetItem) fromInventory[selected.index] = targetItem;
    else fromInventory.splice(selected.index, 1);
    toInventory[index] = movingItem;
    unit.items = inventories.unit.filter(Boolean);
    partner.items = inventories.partner.filter(Boolean);
    this.tradeData.selected = null;
    this.refreshUnitSprite(unit);
    this.refreshUnitSprite(partner);
    this.updateSelectedPanel();
    this.renderTradeWindow();
  },

  finishTrade() {
    const unit = this.units.find((candidate) => candidate.id === this.tradeData?.unitId);
    const partner = this.units.find((candidate) => candidate.id === this.tradeData?.partnerId);
    this.closeTradeWindow();
    if (unit) {
      delete unit.pendingMoveOrigin;
      unit.acted = true;
      this.refreshUnitSprite(unit);
    }
    if (partner) this.refreshUnitSprite(partner);
    this.clearSelection(unit && partner ? `${unit.name} traded with ${partner.name}.` : "Trade finished.");
    this.checkEndOfPlayerPhase();
  },

  showItemMenu(unit) {
    this.showChoiceMenu(unit, {
      type: "item",
      title: "Items",
      entries: unit.items || [],
      emptyText: `${unit.name} has no items yet.`,
      getLabel: (item) => `${item.name}${item.uses ? ` x${item.uses}` : ""}`,
      getSummary: (item) => this.getItemSummary(unit, item),
      getTargets: (item) => this.getItemTargetsAt(unit, item, unit.x, unit.y),
      canChoose: (item) => (item.uses ?? 1) > 0,
      disabledText: (item) => `${item.name} has no uses left.`,
      onChoose: (item) => this.beginItemTargetSelection(unit, item),
    });
  },

  getItemTargetsAt(unit, item, x = unit.x, y = unit.y) {
    if (!unit || !item) return [];
    if (item.targetType === "self") return [unit];
    if (item.targetType === "selfOrAdjacentAlly") {
      return this.units.filter((other) => {
        if (!other || other.team !== unit.team || other.hp <= 0) return false;
        const dx = Math.abs(other.x - x);
        const dy = Math.abs(other.y - y);
        return other.id === unit.id || (dx <= 1 && dy <= 1);
      });
    }
    return [unit];
  },

  getItemSummary(unit, item) {
    if (!unit || !item) return "";
    const targets = this.getItemTargetsAt(unit, item, unit.x, unit.y);
    if (item.heal) {
      return `${item.name}: restores ${item.heal} HP to the consumer. Can target ${unit.name} or an adjacent ally. Targets now: ${targets.length}.`;
    }
    if (item.learnSkill) return `${item.name}: teaches ${this.getSkillTomeSkillForUnit(unit).name} to ${unit.name}.`;
    if (item.permanentStatBoost) return `${item.name}: permanently adds +${item.permanentStatBoost} to HP, STR, MAG, DEF, RES, SPD, and LUCK.`;
    if (item.permanentLuckBoost) return `${item.name}: permanently adds +${item.permanentLuckBoost} Luck.`;
    return item.description || `${item.name}: item effect will be added later.`;
  },

  getSkillTomeSkillForUnit(unit) {
    const skill = CHAPTER_THREE_TOME_SKILLS[unit?.id] || CHAPTER_THREE_TOME_SKILLS.fallback;
    return { ...skill };
  },

  beginItemTargetSelection(unit, item) {
    if (!unit || !item) return;
    if ((item.uses ?? 1) <= 0) {
      this.helpText.setText(`${item.name} has no uses left.`);
      return;
    }
    const targets = this.getItemTargetsAt(unit, item, unit.x, unit.y);
    if (targets.length === 0) {
      this.helpText.setText(`No valid target for ${item.name}.`);
      return;
    }
    this.closeSelectionMenu(false);
    this.selectedUnitId = unit.id;
    this.pendingItemUse = { unitId: unit.id, itemId: item.id };
    this.pendingParleyUse = null;
    this.moveTiles = [];
    this.targetTiles = targets;
    this.targetTileColor = TARGET_HIGHLIGHT.item.fill;
    this.targetTileStroke = TARGET_HIGHLIGHT.item.stroke;
    this.redrawSelection();
    this.updateSelectedPanel();
    this.helpText.setText(`Choose who eats ${item.name}. Press Space to cancel.`);
  },

  useItem(unitId, itemId, targetId) {
    const unit = this.units.find((u) => u.id === unitId);
    const target = this.units.find((u) => u.id === targetId);
    const item = (unit?.items || []).find((candidate) => candidate.id === itemId);
    if (!unit || !target || !item || unit.acted || unit.hp <= 0) return false;
    const targets = this.getItemTargetsAt(unit, item, unit.x, unit.y);
    if (!targets.some((candidate) => candidate.id === target.id)) {
      this.helpText.setText(`${target.name} is not in range for ${item.name}.`);
      return false;
    }
    if (item.heal) {
      const missingHp = Math.max(0, (target.maxHp || 0) - (target.hp || 0));
      if (missingHp <= 0) {
        this.helpText.setText(`${target.name} is already at full HP.`);
        return false;
      }
      const healed = Math.min(item.heal, missingHp);
      target.hp = Math.min(target.maxHp, target.hp + healed);
      this.showFloatingText(this.boardX + target.x * TILE_SIZE + TILE_SIZE / 2, this.boardY + target.y * TILE_SIZE + 8, `+${healed} HP`, "#86efac");
    }
    if (item.learnSkill) {
      const learnedSkill = this.getSkillTomeSkillForUnit(target);
      target.skills = target.skills || [];
      if (target.skills.some((skill) => skill.id === learnedSkill.id)) {
        this.helpText.setText(`${target.name} already knows ${learnedSkill.name}.`);
        return false;
      }
      target.skills.push(learnedSkill);
      this.showFloatingText(this.boardX + target.x * TILE_SIZE + TILE_SIZE / 2, this.boardY + target.y * TILE_SIZE + 8, learnedSkill.name, "#ddd6fe");
    }
    if (item.permanentStatBoost) {
      const boost = item.permanentStatBoost;
      target.maxHp = (target.maxHp || target.hp || 1) + boost;
      target.hp = Math.min(target.maxHp, (target.hp || 0) + boost);
      ["str", "mag", "def", "res", "spd", "luck"].forEach((stat) => {
        target[stat] = (target[stat] || 0) + boost;
      });
      this.showFloatingText(this.boardX + target.x * TILE_SIZE + TILE_SIZE / 2, this.boardY + target.y * TILE_SIZE + 8, `All stats +${boost}`, "#fde68a");
    }
    if (item.permanentLuckBoost) {
      const boost = item.permanentLuckBoost;
      target.luck = (target.luck || 0) + boost;
      this.showFloatingText(this.boardX + target.x * TILE_SIZE + TILE_SIZE / 2, this.boardY + target.y * TILE_SIZE + 8, `Luck +${boost}`, "#fde68a");
    }
    item.uses = (item.uses ?? 1) - 1;
    if (item.uses <= 0) {
      unit.items = (unit.items || []).filter((candidate) => candidate.id !== item.id);
    }
    delete unit.pendingMoveOrigin;
    this.pendingItemUse = null;
    this.pendingParleyUse = null;
    this.closeActionMenu();
    this.closeSelectionMenu(false);
    this.targetTiles = [];
    this.targetTileColor = null;
    this.targetTileStroke = null;
    this.redrawSelection();
    unit.acted = true;
    this.refreshUnitSprite(unit);
    this.refreshUnitSprite(target);
    this.updateSelectedPanel();
    this.clearSelection(`${target.name} used ${item.name}.`);
    this.checkEndOfPlayerPhase();
    return true;
  },

  waitUnit(unitId) {
    const unit = this.units.find((u) => u.id === unitId);
    if (!unit || unit.team !== "player" || unit.acted) return;
    this.closeActionMenu();
    delete unit.pendingMoveOrigin;
    unit.counterStance = false;
    unit.counterUsed = false;
    unit.acted = true;
    this.refreshUnitSprite(unit);
    this.clearSelection(`${unit.name} waits.`);
    this.checkEndOfPlayerPhase();
  },

  waitAndCounterUnit(unitId) {
    const unit = this.units.find((u) => u.id === unitId);
    if (!unit || unit.team !== "player" || unit.acted || unit.hp <= 0) return;
    this.closeActionMenu();
    delete unit.pendingMoveOrigin;
    unit.acted = true;
    this.setCounterStance(unit, true);
    this.clearSelection(`${unit.name} waits and prepares to counter.`);
    this.checkEndOfPlayerPhase();
  },

  canUseGlobalTurnAction() {
    return this.phase === "player" &&
      !this.busy &&
      !this.previewOpen &&
      !this.actionMenuOpen &&
      !this.selectionMenuOpen &&
      !this.levelUpAllocationOpen &&
      !this.tradeOpen;
  },

  getUnactedPlayerUnits() {
    return this.units.filter((unit) => (
      unit?.team === "player" &&
      unit.isMiloDecoy !== true &&
      !unit.acted &&
      unit.hp > 0
    ));
  },

  clearGlobalTurnActionState() {
    this.closeActionMenu();
    this.closeSelectionMenu(false);
    this.pendingItemUse = null;
    this.pendingParleyUse = null;
    this.pendingMiloRescue = null;
    this.selectedUnitId = null;
    this.moveTiles = [];
    this.targetTiles = [];
    this.targetTileColor = null;
    this.targetTileStroke = null;
    this.redrawSelection();
  },

  endPlayerTurnByWaitingAll() {
    if (!this.canUseGlobalTurnAction()) return;

    const units = this.getUnactedPlayerUnits();
    if (units.length === 0) {
      this.checkEndOfPlayerPhase();
      return;
    }

    this.clearGlobalTurnActionState();
    units.forEach((unit) => {
      delete unit.pendingMoveOrigin;
      unit.counterStance = false;
      unit.counterUsed = false;
      unit.acted = true;
      this.refreshUnitSprite(unit);
    });

    this.updateSelectedPanel();
    this.helpText.setText("All remaining allies wait.");
    this.checkEndOfPlayerPhase();
  },

  endPlayerTurnWithAmbush() {
    if (!this.canUseGlobalTurnAction()) return;

    const units = this.getUnactedPlayerUnits();
    if (units.length === 0) {
      this.checkEndOfPlayerPhase();
      return;
    }

    this.clearGlobalTurnActionState();
    units.forEach((unit) => {
      delete unit.pendingMoveOrigin;
      unit.acted = true;
      this.setCounterStance(unit, true);
      this.refreshUnitSprite(unit);
    });

    this.updateSelectedPanel();
    this.helpText.setText("All remaining allies prepare to counter.");
    this.checkEndOfPlayerPhase();
  },

  setupInput() {
    this.input.keyboard?.on("keydown-SPACE", (event) => {
      if (event?.preventDefault) event.preventDefault();
      this.handleSpaceCancel();
    });

    this.input.on("pointerdown", (pointer) => {
      if (this.phase !== "player" || this.busy || this.previewOpen || this.actionMenuOpen || this.selectionMenuOpen || this.levelUpAllocationOpen || this.tradeOpen) return;
      const tile = this.pointerToTile(pointer.x, pointer.y);
      if (!tile) return;
      const clickedUnit = this.getUnitAt(tile.x, tile.y);
      const selectedUnit = this.getSelectedUnit();

      if (this.pendingMiloRescue) {
        if (this.pendingMiloRescue.stage === "ally") {
          if (clickedUnit && this.isTargetTile(clickedUnit.x, clickedUnit.y)) {
            this.chooseMiloRescueAlly(clickedUnit.id);
            return;
          }
          this.helpText.setText("Choose one of the highlighted allies, or press Space to cancel.");
          return;
        }
        if (this.pendingMiloRescue.stage === "destination") {
          if (!clickedUnit && this.isTargetTile(tile.x, tile.y)) {
            this.useMiloRescueSprint(tile.x, tile.y);
            return;
          }
          this.helpText.setText("Choose one of the highlighted free tiles, or press Space to cancel.");
          return;
        }
      }

      if (this.pendingParleyUse) {
        if (clickedUnit && this.isTargetTile(clickedUnit.x, clickedUnit.y)) {
          this.useParley(this.pendingParleyUse.unitId, clickedUnit.id);
          return;
        }
        this.helpText.setText("Choose one of the highlighted Parley targets, or press Space to cancel.");
        return;
      }

      if (this.pendingItemUse) {
        if (clickedUnit && this.isTargetTile(clickedUnit.x, clickedUnit.y)) {
          this.useItem(this.pendingItemUse.unitId, this.pendingItemUse.itemId, clickedUnit.id);
          return;
        }
        this.helpText.setText("Choose one of the highlighted item targets, or press Space to cancel.");
        return;
      }

      if (clickedUnit && selectedUnit && clickedUnit.id === selectedUnit.id && selectedUnit.team === "player" && clickedUnit.isMiloDecoy !== true && !selectedUnit.acted) {
        this.showActionMenu(selectedUnit, `${selectedUnit.name} holds position. Choose an action.`);
        return;
      }
      if (clickedUnit && clickedUnit.team === "player" && clickedUnit.isMiloDecoy !== true && !clickedUnit.acted) {
        this.closeActionMenu();
        this.pendingItemUse = null;
        this.pendingParleyUse = null;
        this.pendingMiloRescue = null;
        this.selectedUnitId = clickedUnit.id;
        this.moveTiles = this.reachableTiles(clickedUnit);
        this.targetTiles = [];
        this.targetTileColor = null;
        this.targetTileStroke = null;
        this.redrawSelection();
        this.updateSelectedPanel();
        this.helpText.setText(`Selected ${clickedUnit.name}. Choose a tile to move to, click them again to act here, or press Space to cancel.`);
        return;
      }
      if (selectedUnit && clickedUnit && clickedUnit.team === "enemy" && this.isTargetTile(clickedUnit.x, clickedUnit.y)) {
        this.openPreview(selectedUnit, clickedUnit);
        return;
      }
      if (clickedUnit && clickedUnit.team === "enemy") {
        this.selectedUnitId = clickedUnit.id;
        this.moveTiles = [];
        this.targetTiles = [];
        this.targetTileColor = null;
        this.targetTileStroke = null;
        this.redrawSelection();
        this.updateSelectedPanel();
        this.helpText.setText(`${clickedUnit.name}: ${clickedUnit.title}`);
        return;
      }
      if (!clickedUnit && selectedUnit && selectedUnit.team === "player" && this.isMoveTile(tile.x, tile.y)) {
        this.moveUnit(selectedUnit.id, tile.x, tile.y);
        return;
      }
      if (selectedUnit && selectedUnit.team === "player" && this.targetTiles.length > 0) {
        this.targetTiles = [];
        this.targetTileColor = null;
        this.targetTileStroke = null;
        this.redrawSelection();
        this.showActionMenu(selectedUnit, "Cancelled. Choose another action.");
        return;
      }
      this.clearSelection();
    });
  },

  handleSpaceCancel() {
    if (this.levelUpAllocationOpen || this.busy) return;

    if (this.tradeOpen) return;

    if (this.previewOpen) {
      this.closePreview();
      return;
    }

    const selectedUnit = this.getSelectedUnit();

    if (this.pendingMiloRescue) {
      const unit = this.units.find((candidate) => candidate.id === this.pendingMiloRescue.unitId) || selectedUnit;
      this.pendingMiloRescue = null;
      this.targetTiles = [];
      this.targetTileColor = null;
      this.targetTileStroke = null;
      this.redrawSelection();
      if (unit && unit.team === "player" && !unit.acted) {
        this.showActionMenu(unit, "Rescue Sprint cancelled. Choose another action.");
      }
      return;
    }

    if (this.pendingParleyUse) {
      const unit = this.units.find((candidate) => candidate.id === this.pendingParleyUse.unitId) || selectedUnit;
      this.pendingParleyUse = null;
      this.targetTiles = [];
      this.targetTileColor = null;
      this.targetTileStroke = null;
      this.redrawSelection();
      if (unit && unit.team === "player" && !unit.acted) {
        this.showActionMenu(unit, "Parley cancelled. Choose another action.");
      }
      return;
    }

    if (this.pendingItemUse) {
      const unit = this.units.find((candidate) => candidate.id === this.pendingItemUse.unitId) || selectedUnit;
      this.pendingItemUse = null;
      this.targetTiles = [];
      this.targetTileColor = null;
      this.targetTileStroke = null;
      this.redrawSelection();
      if (unit && unit.team === "player" && !unit.acted) {
        this.showActionMenu(unit, "Item cancelled. Choose another action.");
      }
      return;
    }

    if (this.selectionMenuOpen) {
      const unit = selectedUnit;
      this.closeSelectionMenu(false);
      this.targetTiles = [];
      this.targetTileColor = null;
      this.targetTileStroke = null;
      this.redrawSelection();
      if (unit && unit.team === "player" && !unit.acted) {
        this.showActionMenu(unit, "Cancelled. Choose another action.");
      }
      return;
    }

    if (this.actionMenuOpen) {
      const unit = this.units.find((candidate) => candidate.id === this.actionMenuUnitId) || selectedUnit;
      if (unit?.pendingMoveOrigin) {
        this.undoPendingMove(unit);
        return;
      }
      this.closeActionMenu();
      if (unit && unit.team === "player" && !unit.acted) {
        this.selectedUnitId = unit.id;
        this.moveTiles = this.reachableTiles(unit);
        this.targetTiles = [];
        this.targetTileColor = null;
        this.targetTileStroke = null;
        this.redrawSelection();
        this.updateSelectedPanel();
        this.helpText.setText(`${unit.name} returned to movement selection.`);
      }
      return;
    }

    if (selectedUnit && selectedUnit.team === "player" && this.targetTiles.length > 0) {
      this.targetTiles = [];
      this.targetTileColor = null;
      this.targetTileStroke = null;
      this.redrawSelection();
      this.showActionMenu(selectedUnit, "Cancelled. Choose another action.");
      return;
    }

    if (selectedUnit && selectedUnit.team === "player" && this.moveTiles.length > 0) {
      this.clearSelection("Selection cancelled.");
    }
  },

  undoPendingMove(unit) {
    if (!unit?.pendingMoveOrigin) return;
    const sprite = this.unitSprites[unit.id];
    const origin = unit.pendingMoveOrigin;
    this.closeActionMenu();
    this.closeSelectionMenu(false);
    this.pendingItemUse = null;
    this.pendingParleyUse = null;
    this.moveTiles = [];
    this.targetTiles = [];
    this.targetTileColor = null;
    this.targetTileStroke = null;
    this.busy = true;

    unit.x = origin.x;
    unit.y = origin.y;
    unit.facing = origin.facing || unit.facing || "down";
    delete unit.pendingMoveOrigin;
    this.playUnitState(unit, "move", 420);

    const finishUndo = () => {
      this.setUnitSpriteFrame(unit, "idle", unit.facing || "down");
      this.selectedUnitId = unit.id;
      this.moveTiles = this.reachableTiles(unit);
      this.targetTiles = [];
      this.redrawSelection();
      this.updateSelectedPanel();
      this.busy = false;
      this.helpText.setText(`${unit.name}'s move was cancelled. Choose a new tile or click them to act here.`);
    };

    if (!sprite) {
      finishUndo();
      return;
    }

    this.tweens.add({
      targets: sprite.container,
      x: this.boardX + unit.x * TILE_SIZE + TILE_SIZE / 2,
      y: this.boardY + unit.y * TILE_SIZE + TILE_SIZE / 2,
      duration: 420,
      ease: "Sine.easeInOut",
      onComplete: finishUndo,
    });
  },

  pointerToTile(pointerX, pointerY) {
    const localX = pointerX - this.boardX;
    const localY = pointerY - this.boardY;
    if (localX < 0 || localY < 0 || localX >= this.boardWidth || localY >= this.boardHeight) return null;
    return { x: Math.floor(localX / TILE_SIZE), y: Math.floor(localY / TILE_SIZE) };
  },

  getSelectedUnit() {
    return this.units.find((unit) => unit.id === this.selectedUnitId) || null;
  },

  getUnitAt(x, y) {
    return this.units.find((unit) => unit.x === x && unit.y === y && unit.hp > 0) || null;
  },

  isWalkable(x, y) {
    if (!this.isInBounds(x, y)) return false;
    const terrain = this.getTerrainAt(x, y);
    return terrain !== "wall" && terrain !== "fence";
  },

  reachableTiles(unit) {
    const queue = [{ x: unit.x, y: unit.y, steps: 0 }];
    const visited = new Set([tileKey(unit.x, unit.y)]);
    const reachable = [];
    const movementRange = (unit.move || 0) + (unit.turnMoveBonus || 0);
    while (queue.length > 0) {
      const current = queue.shift();
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = current.x + dx;
        const ny = current.y + dy;
        const key = tileKey(nx, ny);
        const nextSteps = current.steps + 1;
        if (visited.has(key)) continue;
        if (!this.isWalkable(nx, ny)) continue;
        if (nextSteps > movementRange) continue;
        const occupant = this.getUnitAt(nx, ny);
        if (occupant && occupant.id !== unit.id && occupant.team !== unit.team) continue;
        visited.add(key);
        queue.push({ x: nx, y: ny, steps: nextSteps });
        if (!occupant || occupant.id === unit.id) reachable.push({ x: nx, y: ny });
      }
    }
    return reachable;
  },

  attackableEnemies(unit) {
    return this.units.filter((other) => other.team === "enemy" && other.hp > 0 && canAttack(unit, other));
  },

  isMoveTile(x, y) {
    return (this.moveTiles || []).some((tile) => typeof tile === "string" ? tile === tileKey(x, y) : tile.x === x && tile.y === y);
  },

  isTargetTile(x, y) {
    return this.targetTiles.some((unit) => unit.x === x && unit.y === y);
  },

  openPreview(attacker, defender) {
    this.closeActionMenu();
    const attackerWeapon = getWeaponForTarget(attacker, defender);
    const defenderWeapon = getWeaponForTarget(defender, attacker) || getDefaultWeapon(defender);
    if (!attackerWeapon) return;
    const attackerDamage = this.calculateDamage(attacker, defender, attackerWeapon);
    const attackerHits = this.calculateAttackCount(attacker, defender, attackerWeapon);
    const attackerSpeed = this.getEffectiveSpeed(attacker, attackerWeapon);
    const attackerHitRate = attackerWeapon.hitRate ?? 100;
    const attackerCrit = this.calculateCriticalChance(attacker, defender);
    const defenderDamage = defenderWeapon ? this.calculateDamage(defender, attacker, defenderWeapon) : 0;
    const defenderHits = defenderWeapon ? this.calculateAttackCount(defender, attacker, defenderWeapon) : 0;
    const defenderSpeed = defenderWeapon ? this.getEffectiveSpeed(defender, defenderWeapon) : defender.spd;
    const defenderHitRate = defenderWeapon?.hitRate ?? 100;
    const defenderCrit = defenderWeapon ? this.calculateCriticalChance(defender, attacker) : 0;
    this.previewData = { attackerId: attacker.id, defenderId: defender.id };
    this.previewLeftName.setText(`${attacker.name} - ${attackerWeapon.name}`);
    this.previewLeftStats.setText(`HP ${attacker.hp}/${attacker.maxHp}\nDMG ${attackerDamage} x${attackerHits}\nCRIT ${attackerCrit}%\nHIT ${attackerHitRate}%\nSPD ${attackerSpeed}\nRNG ${getWeaponRangeLabel(attackerWeapon)}`);
    this.previewRightName.setText(`${defender.name} - ${defenderWeapon?.name || "None"}`);
    this.previewRightStats.setText(`HP ${defender.hp}/${defender.maxHp}\nDMG ${defenderDamage} x${defenderHits}\nCRIT ${defenderCrit}%\nHIT ${defenderHitRate}%\nSPD ${defenderSpeed}\nRNG ${getWeaponRangeLabel(defenderWeapon)}`);
    this.previewOpen = true;
    this.previewContainer.setVisible(true);
    this.helpText.setText("Confirm or cancel the attack. Critical hits deal triple damage.");
  },

  closePreview() {
    this.previewOpen = false;
    this.previewData = null;
    this.previewContainer.setVisible(false);
    const unit = this.getSelectedUnit();
    if (unit && unit.team === "player" && !unit.acted) {
      this.targetTiles = [];
      this.targetTileColor = null;
      this.targetTileStroke = null;
      this.redrawSelection();
      this.showActionMenu(unit, "Attack cancelled. Choose another action.");
      return;
    }
    this.helpText.setText("Attack cancelled.");
  },

  confirmPreviewAttack() {
    if (!this.previewData) return;
    this.closeActionMenu();
    const { attackerId, defenderId } = this.previewData;
    this.previewOpen = false;
    this.previewData = null;
    this.previewContainer.setVisible(false);
    this.attackEnemy(attackerId, defenderId);
  },

  moveUnit(unitId, x, y) {
    const unit = this.units.find((u) => u.id === unitId);
    const sprite = this.unitSprites[unitId];
    if (!unit || !sprite || unit.team !== "player" || unit.acted) return;

    this.closeActionMenu();
    this.busy = true;

    const oldX = unit.x;
    const oldY = unit.y;
    const oldFacing = unit.facing || "down";
    const opportunityEnemy = this.getOpportunityThreatBeforeMove(unit, x, y);

    const completeMove = () => {
      if (unit.hp <= 0) return;

      unit.pendingMoveOrigin = { x: oldX, y: oldY, facing: oldFacing };
      unit.facing = this.getDirectionFromDelta(x - oldX, y - oldY, oldFacing);
      this.playUnitState(unit, "move", PLAYER_MOVE_DURATION + PLAYER_ACTION_PAUSE);
      unit.x = x;
      unit.y = y;

      const targetX = this.boardX + x * TILE_SIZE + TILE_SIZE / 2;
      const targetY = this.boardY + y * TILE_SIZE + TILE_SIZE / 2;

      this.tweens.add({
        targets: sprite.container,
        x: targetX,
        y: targetY,
        duration: PLAYER_MOVE_DURATION,
        ease: "Sine.easeInOut",
        onComplete: () => {
          this.setUnitSpriteFrame(unit, "idle", unit.facing || "down");
          this.moveTiles = [];
          this.targetTiles = [];
          this.redrawSelection();
          this.updateSelectedPanel();
          this.time.delayedCall(PLAYER_ACTION_PAUSE, () => {
            this.busy = false;
            this.showActionMenu(unit);
          });
        },
      });
    };

    if (opportunityEnemy) {
      this.resolveOpportunityAttack(opportunityEnemy, unit, completeMove);
      return;
    }

    completeMove();
  },

  attackEnemy(attackerId, defenderId) {
    const attacker = this.units.find((u) => u.id === attackerId);
    const defender = this.units.find((u) => u.id === defenderId);
    if (!attacker || !defender) return;

    const weapon = getWeaponForTarget(attacker, defender);
    if (!weapon) return;

    this.closeActionMenu();
    this.pendingItemUse = null;
    delete attacker.pendingMoveOrigin;
    this.busy = true;
    this.faceUnitToward(attacker, defender);
    this.faceUnitToward(defender, attacker);

    const defenderStartHp = defender.hp;
    const defenderWasAlive = defender.hp > 0;
    const sequence = this.resolveAttackSequence(attacker, defender, weapon);
    attacker.nextAttackBonus = 0;
    const didKill = defenderWasAlive && defender.hp <= 0;
    const defeatedFalan = didKill && defender.id === "falan";
    const xpGain = this.calculateXpGain(attacker, defender, didKill);

    const finishStandardAttack = () => {
      if (xpGain > 0) this.awardXp(attacker, xpGain);

      attacker.acted = true;
      this.refreshUnitSprite(attacker);

      if (defender.hp <= 0) {
        defender.hp = 0;
        if (defeatedFalan) {
          this.refreshUnitSprite(defender);
        } else {
          this.playUnitDeath(defender, () => this.removeUnitSpriteAndData(defender.id));
          this.clearSelection(`${attacker.name} defeated ${defender.name}!`);
        }
      } else {
        this.refreshUnitSprite(defender);
        this.setUnitSpriteFrame(defender, "idle", defender.facing || "down");
        this.clearSelection(`${attacker.name} attacked ${defender.name} with ${weapon.name}.`);
      }

      (sequence.targets || [])
        .filter((target) => target && target.id !== defender.id)
        .forEach((target) => {
          if (target.hp <= 0) {
            target.hp = 0;
            if (target.team === "civilian") this.defeatedCivilians = [...new Set([...(this.defeatedCivilians || []), target.id])];
            this.playUnitDeath(target, () => this.removeUnitSpriteAndData(target.id));
          } else {
            this.refreshUnitSprite(target);
            this.setUnitSpriteFrame(target, "idle", target.facing || "down");
          }
        });

      this.setUnitSpriteFrame(attacker, "idle", attacker.facing || "down");
      this.updateSelectedPanel();

      const completePlayerAttack = () => {
        this.time.delayedCall(350, () => {
          this.busy = false;
          this.checkEndOfPlayerPhase();
        });
      };

      if (defeatedFalan) {
        this.time.delayedCall(350, () => {
          this.handleFalanDefeat(defender, () => {
            this.busy = false;
            this.clearSelection(`${attacker.name} defeated Falan. Find the glowing gate and escape.`);
            this.checkEndOfPlayerPhase();
          });
        });
        return;
      }

      this.resolveCounterAttack(defender, attacker, completePlayerAttack);
    };

    this.playStandardBattleScene(attacker, defender, weapon, sequence, defenderStartHp, finishStandardAttack);
  },

  clearSelection(message = "Click Edwin or Leon to select a unit.") {
    this.closeActionMenu();
    this.pendingItemUse = null;
    this.pendingParleyUse = null;
    this.pendingMiloRescue = null;
    this.selectedUnitId = null;
    this.moveTiles = [];
    this.targetTiles = [];
    this.targetTileColor = null;
    this.targetTileStroke = null;
    this.redrawSelection();
    this.updateSelectedPanel();
    this.helpText.setText(message);
  },

  redrawSelection() {
    this.overlayLayer.removeAll(true);
    for (const unit of this.units) {
      const sprite = this.unitSprites[unit.id];
      if (sprite) sprite.marker.setStrokeStyle(2, 0xffffff);
    }
    if (!this.selectedUnitId) return;
    const selectedUnit = this.getSelectedUnit();
    if (!selectedUnit) return;
    const selectedSprite = this.unitSprites[selectedUnit.id];
    if (selectedSprite) selectedSprite.marker.setStrokeStyle(4, 0xfde68a);
    for (const tile of this.moveTiles) {
      const x = this.boardX + tile.x * TILE_SIZE;
      const y = this.boardY + tile.y * TILE_SIZE;
      const overlay = this.add.rectangle(x + TILE_SIZE / 2, y + TILE_SIZE / 2, TILE_SIZE - 10, TILE_SIZE - 10, 0x38bdf8, 0.35);
      overlay.setStrokeStyle(2, 0x7dd3fc, 0.95);
      this.overlayLayer.add(overlay);
    }
    const targetFill = this.targetTileColor || TARGET_HIGHLIGHT.attack.fill;
    const targetStroke = this.targetTileStroke || TARGET_HIGHLIGHT.attack.stroke;
    for (const unit of this.targetTiles) {
      const x = this.boardX + unit.x * TILE_SIZE;
      const y = this.boardY + unit.y * TILE_SIZE;
      const overlay = this.add.rectangle(x + TILE_SIZE / 2, y + TILE_SIZE / 2, TILE_SIZE - 10, TILE_SIZE - 10, targetFill, 0.35);
      overlay.setStrokeStyle(2, targetStroke, 0.95);
      this.overlayLayer.add(overlay);
    }
  },

  updateSelectedPanel() {
    const unit = this.units.find((u) => u.id === this.selectedUnitId);
    if (!unit) {
      this.portraitImage.setVisible(false);
      this.portraitPlaceholder.setText("No unit").setVisible(true);
      this.unitNameText.setText("No unit");
      this.unitClassText.setText("");
      this.hpBarText.setText("");
      this.hpBarFill.displayWidth = 0;
      this.levelXpText.setText("");
      this.xpBarFill.displayWidth = 0;
      this.sigilText.setText("Sigil");
      this.sigilOrbs.forEach((orb) => orb.setFillStyle(0x2e1065, 0.35));
      this.unitStatsText.setText("");
      this.weaponText.setText("");
      return;
    }
    if (unit.portraitKey && this.textures.exists(unit.portraitKey)) {
      this.portraitImage.setTexture(unit.portraitKey).setDisplaySize(96, 120).setVisible(true);
      this.portraitPlaceholder.setVisible(false);
    } else {
      this.portraitImage.setVisible(false);
      this.portraitPlaceholder.setText("NO ART");
      this.portraitPlaceholder.setVisible(true);
    }
    const level = unit.level || 1;
    const xp = unit.xp || 0;
    const weapon = getDefaultWeapon(unit);
    const terrain = this.getTerrainAt(unit.x, unit.y);
    const terrainBonus = this.getTerrainDefenseBonus(unit);
    const weaponSpeedBonus = this.getWeaponSpeedBonus(unit, weapon);
    const terrainLabel = terrain ? terrain.charAt(0).toUpperCase() + terrain.slice(1) : "Terrain";
    const defLine = terrainBonus > 0 ? `DEF ${unit.def} +${terrainBonus} ${terrainLabel}` : `DEF ${unit.def}`;
    const spdLine = weaponSpeedBonus > 0 ? `SPD ${unit.spd} +${weaponSpeedBonus} ${weapon.name}` : `SPD ${unit.spd}`;
    this.unitNameText.setText(unit.name);
    this.unitClassText.setText(`${unit.team === "enemy" ? "Enemy" : "Player"} • ${unit.title} • ${unit.className}`);
    const currentHp = Math.max(0, unit.hp || 0);
    const maxHp = Math.max(1, unit.maxHp || 1);
    this.hpBarText.setText(`HP ${currentHp}/${maxHp}`);
    this.hpBarFill.displayWidth = (this.sidePanelBarWidth || 200) * Phaser.Math.Clamp(currentHp / maxHp, 0, 1);
    this.levelXpText.setText(`Lv ${level} XP ${xp}/100`);
    this.xpBarFill.displayWidth = (this.sidePanelBarWidth || 200) * Phaser.Math.Clamp(xp / 100, 0, 1);
    const sigilPoints = Phaser.Math.Clamp(unit.sigilPoints ?? 0, 0, unit.maxSigilPoints ?? 3);
    const maxSigilPoints = unit.maxSigilPoints ?? 3;
    this.sigilText.setText(`Sigil ${sigilPoints}/${maxSigilPoints}`);
    this.sigilOrbs.forEach((orb, index) => {
      const active = index < sigilPoints;
      orb.setFillStyle(active ? 0x8b5cf6 : 0x2e1065, active ? 1 : 0.35);
      orb.setStrokeStyle(2, active ? 0xddd6fe : 0x6d28d9);
    });
    this.unitStatsText.setText(`STR ${unit.str}   MAG ${unit.mag}\n${defLine}\nRES ${unit.res}\n${spdLine}\nLUCK ${unit.luck || 0}   MOV ${unit.move}`);
    const itemSummary = (unit.items || []).length > 0
      ? `
Items: ${(unit.items || []).map((item) => `${item.name}${item.uses ? ` x${item.uses}` : ""}`).join(", ")}`
      : "";

    this.weaponText.setText(
      weapon
        ? `Weapon: ${weapon.name}
Base ${weapon.baseDamage ?? weapon.damage ?? 0} | ${weapon.damageType || "physical"} | Hit ${weapon.hitRate ?? 100}%
Range ${getWeaponRangeLabel(weapon)} | Crit: Luck diff x3${itemSummary}`
        : `Weapon: None${itemSummary}`
    );
  }
};
