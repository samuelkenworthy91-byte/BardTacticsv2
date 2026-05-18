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
import {
  CHAPTER_THREE_TOME_SKILLS,
} from "../../chapters/chapter3.js";
import {
  CHAPTER_THREE_GAIDEN_CHESTS,
  CHAPTER_THREE_GAIDEN_ITEMS,
} from "../../chapters/chapter3Gaiden/index.js";
import {
  buildChapterTwoSaveData,
  CHAPTER_TWO_NUMBER,
  getLevelForChapter,
  getSaveDataChapterNumber,
  isChapterOne,
  isChapterThreeGaiden,
  isChapterTwoOrLater,
} from "../../chapters/progression.js";
export const playerActionMethods = {
  isUnitUnconscious(unit) {
    return (unit?.unconsciousTurns || 0) > 0;
  },

  chooseActionAttack(unitId) {
    const unit = this.units.find((u) => u.id === unitId);
    if (!unit || unit.team !== "player" || unit.acted || this.isUnitUnconscious(unit)) return;
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
    if (!unit || unit.team !== "player" || unit.acted || this.isUnitUnconscious(unit)) return;
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
        if (skill.id === "phoenixReckoning" && unit.team === "player") {
          this.beginPhoenixReckoningDirectionSelection(unit, skill);
          return;
        }
        if (skill.id === "fieldOfThorns" && unit.id === "leon") {
          this.beginFieldOfThornsSelection(unit, skill);
          return;
        }
        if (skill.id === "allTheTrappings" && unit.team === "player") {
          this.beginSingleTargetSkillSelection(unit, skill);
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
    this.pendingPhoenixReckoningUse = null;
    this.pendingFieldOfThornsUse = null;
    this.pendingSingleTargetSkillUse = null;
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
    } else if (skill.id === "fieldOfThorns") {
      effect = `Select up to ${skill.maxTiles || 5} walkable tiles within ${skill.range || 4} range. Thorns deal Leon's DEF and expire after 3 turns or 3 triggers.`;
    } else if (skill.id === "allTheTrappings") {
      effect = `Targets one unit within ${skill.range || 3} tiles. Deals ${unit.luck || 0} damage and prevents movement next turn.`;
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

  getPhoenixReckoningDirectionTiles(unit, skill) {
    if (!unit || !skill) return [];
    const range = skill.range || 3;
    return CARDINAL_DIRECTIONS.flatMap((direction) => {
      const tiles = [];
      for (let step = 1; step <= range; step += 1) {
        const tile = { x: unit.x, y: unit.y, phoenixDirection: direction };
        if (direction === "down") tile.y += step;
        if (direction === "up") tile.y -= step;
        if (direction === "right") tile.x += step;
        if (direction === "left") tile.x -= step;
        if (this.isInBounds(tile.x, tile.y)) tiles.push(tile);
      }
      return tiles;
    });
  },

  getPhoenixDirectionFromTile(unit, x, y) {
    if (!unit) return null;
    if (x === unit.x && y > unit.y) return "down";
    if (x === unit.x && y < unit.y) return "up";
    if (y === unit.y && x > unit.x) return "right";
    if (y === unit.y && x < unit.x) return "left";
    return null;
  },

  beginPhoenixReckoningDirectionSelection(unit, skill) {
    const tiles = this.getPhoenixReckoningDirectionTiles(unit, skill);
    if (!tiles.length) {
      this.helpText.setText(`No valid direction for ${skill.name}.`);
      return;
    }
    this.closeSelectionMenu(false);
    this.pendingPhoenixReckoningUse = { unitId: unit.id, skillId: skill.id };
    this.selectedUnitId = unit.id;
    this.moveTiles = [];
    this.targetTiles = tiles;
    this.targetTileColor = TARGET_HIGHLIGHT.skill.fill;
    this.targetTileStroke = TARGET_HIGHLIGHT.skill.stroke;
    this.redrawSelection();
    this.updateSelectedPanel();
    this.helpText.setText("Choose a cardinal direction for Phoenix Reckoning. Press Space to cancel.");
  },

  usePhoenixReckoningInDirection(x, y) {
    const pending = this.pendingPhoenixReckoningUse;
    const unit = this.units.find((candidate) => candidate.id === pending?.unitId);
    const skill = this.getSkillById(unit, pending?.skillId);
    const direction = this.getPhoenixDirectionFromTile(unit, x, y);
    if (!unit || !skill || !direction || !this.canUseSkill(unit, skill)) return false;
    unit.facing = direction;
    this.pendingPhoenixReckoningUse = null;
    return this.useSkill(unit.id, skill.id, { endTurn: true });
  },

  beginFieldOfThornsSelection(unit, skill) {
    const tiles = this.getSkillHitTilesAt(unit, skill, unit.x, unit.y);
    if (!tiles.length) {
      this.helpText.setText(`No valid tiles for ${skill.name}.`);
      return;
    }
    this.closeSelectionMenu(false);
    this.pendingFieldOfThornsUse = {
      unitId: unit.id,
      skillId: skill.id,
      selectedTiles: [],
    };
    this.selectedUnitId = unit.id;
    this.moveTiles = [];
    this.targetTiles = tiles;
    this.targetTileColor = TARGET_HIGHLIGHT.skill.fill;
    this.targetTileStroke = TARGET_HIGHLIGHT.skill.stroke;
    this.redrawSelection();
    this.updateSelectedPanel();
    this.helpText.setText(`Choose up to ${skill.maxTiles || 5} thorn tiles. Press Enter to confirm or Space to cancel.`);
  },

  beginSingleTargetSkillSelection(unit, skill) {
    const targets = this.getSkillTargetsAt(unit, skill, unit.x, unit.y);
    if (!targets.length) {
      this.helpText.setText(`No valid target for ${skill.name}.`);
      return;
    }
    this.closeSelectionMenu(false);
    this.selectedUnitId = unit.id;
    this.pendingSingleTargetSkillUse = { unitId: unit.id, skillId: skill.id };
    this.moveTiles = [];
    this.targetTiles = targets;
    this.targetTileColor = TARGET_HIGHLIGHT.skill.fill;
    this.targetTileStroke = TARGET_HIGHLIGHT.skill.stroke;
    this.redrawSelection();
    this.updateSelectedPanel();
    this.helpText.setText(`Choose one target for ${skill.name}. Press Space to cancel.`);
  },

  useSingleTargetSkillOn(targetId) {
    const pending = this.pendingSingleTargetSkillUse;
    const unit = this.units.find((candidate) => candidate.id === pending?.unitId);
    const target = this.units.find((candidate) => candidate.id === targetId);
    const skill = this.getSkillById(unit, pending?.skillId);
    if (!unit || !target || !skill || !this.canUseSkill(unit, skill)) return false;
    if (!this.getSkillTargetsAt(unit, skill, unit.x, unit.y).some((candidate) => candidate.id === target.id)) {
      this.helpText.setText(`${target.name} is not in range for ${skill.name}.`);
      return false;
    }
    this.pendingSingleTargetSkillUse = null;
    return this.useSkill(unit.id, skill.id, { endTurn: true, targetId: target.id });
  },

  toggleFieldOfThornsTile(x, y) {
    const pending = this.pendingFieldOfThornsUse;
    const unit = this.units.find((candidate) => candidate.id === pending?.unitId);
    const skill = this.getSkillById(unit, pending?.skillId);
    if (!pending || !unit || !skill) return false;
    if (!this.isTargetTile(x, y)) {
      this.helpText.setText("Choose a highlighted tile for Field of Thorns.");
      return false;
    }
    const key = tileKey(x, y);
    const selected = pending.selectedTiles || [];
    const existingIndex = selected.findIndex((tile) => tileKey(tile.x, tile.y) === key);
    if (existingIndex >= 0) {
      selected.splice(existingIndex, 1);
    } else {
      const maxTiles = skill.maxTiles || 5;
      if (selected.length >= maxTiles) {
        this.helpText.setText(`Field of Thorns can select up to ${maxTiles} tiles.`);
        return false;
      }
      selected.push({ x, y });
    }
    pending.selectedTiles = selected;
    this.redrawSelection();
    this.helpText.setText(`${selected.length}/${skill.maxTiles || 5} thorn tiles selected. Press Enter to confirm or Space to cancel.`);
    return true;
  },

  confirmFieldOfThornsSelection() {
    const pending = this.pendingFieldOfThornsUse;
    const unit = this.units.find((candidate) => candidate.id === pending?.unitId);
    const skill = this.getSkillById(unit, pending?.skillId);
    const selectedTiles = pending?.selectedTiles || [];
    if (!pending || !unit || !skill || !this.canUseSkill(unit, skill)) return false;
    if (!selectedTiles.length) {
      this.helpText.setText("Select at least one tile for Field of Thorns.");
      return false;
    }
    this.closeActionMenu();
    this.closeSelectionMenu(false);
    this.pendingFieldOfThornsUse = null;
    this.pendingItemUse = null;
    this.pendingParleyUse = null;
    this.pendingMiloRescue = null;
    this.pendingPhoenixReckoningUse = null;
    this.pendingFieldOfThornsUse = null;
    this.pendingSingleTargetSkillUse = null;
    delete unit.pendingMoveOrigin;
    this.busy = true;
    this.selectedUnitId = unit.id;
    this.moveTiles = [];
    this.targetTiles = [];
    this.targetTileColor = null;
    this.targetTileStroke = null;
    this.redrawSelection();
    this.spendSkillCost(unit, skill);
    this.placeThornTiles(unit, selectedTiles);
    unit.acted = true;
    this.refreshUnitSprite(unit);
    this.updateSelectedPanel();
    this.showSkillBanner(skill.name);
    this.time.delayedCall(520, () => {
      this.busy = false;
      this.clearSelection(`${unit.name} placed Field of Thorns.`);
      this.checkEndOfPlayerPhase();
    });
    return true;
  },

  canUseSkill(unit, skill) {
    if (!unit || !skill) return false;
    if (this.isUnitUnconscious(unit)) return false;

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

    if (skill.id === "fieldOfThorns") {
      return unit.id === "leon" && (unit.sigilPoints ?? 0) >= (skill.cost ?? 0);
    }

    if (skill.id === "allTheTrappings") {
      return unit.id === "harold" && (unit.sigilPoints ?? 0) >= (skill.cost ?? 0);
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
          const dist = skill.squareRange
            ? Math.max(Math.abs(tileX - x), Math.abs(tileY - y))
            : Math.abs(tileX - x) + Math.abs(tileY - y);
          if (dist > 0 && dist <= range) tiles.push({ x: tileX, y: tileY });
        }
      }
      return tiles;
    }

    if (skill.type === "fieldOfThorns") {
      const tiles = [];
      const range = skill.range || 4;
      for (let tileY = 0; tileY < this.mapRows; tileY += 1) {
        for (let tileX = 0; tileX < this.mapCols; tileX += 1) {
          const dist = Math.abs(tileX - x) + Math.abs(tileY - y);
          if (dist > 0 && dist <= range && this.isWalkable(tileX, tileY)) tiles.push({ x: tileX, y: tileY });
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
    if (skill.type === "fieldOfThorns") return [];

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
    if (skill.damageFormula === "luck") return Math.max(0, unit.luck || 0);
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
    const targets = options.targetId
      ? this.getSkillTargetsAt(unit, skill, unit.x, unit.y).filter((target) => target.id === options.targetId)
      : this.getSkillTargetsAt(unit, skill, unit.x, unit.y);
    if (hitTiles.length === 0) return false;
    if (skill.id === "allTheTrappings" && targets.length === 0) return false;
    if (skill.id === "allTheTrappings" && unit.team === "player" && !options.targetId) {
      this.beginSingleTargetSkillSelection(unit, skill);
      return true;
    }
    if (skill.id === "fieldOfThorns" && !Array.isArray(options.thornTiles)) {
      this.beginFieldOfThornsSelection(unit, skill);
      return true;
    }
    this.closeActionMenu();
    this.closeSelectionMenu(false);
    this.pendingItemUse = null;
    this.pendingParleyUse = null;
    this.pendingMiloRescue = null;
    this.pendingPhoenixReckoningUse = null;
    this.pendingFieldOfThornsUse = null;
    this.pendingSingleTargetSkillUse = null;
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

    if (skill.id === "fieldOfThorns") {
      this.placeThornTiles(unit, options.thornTiles);
      if (options.endTurn !== false) unit.acted = true;
      this.refreshUnitSprite(unit);
      this.time.delayedCall(520, () => {
        this.busy = false;
        this.clearSelection(`${unit.name} placed Field of Thorns.`);
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
          if (entry.damage > 0 && target.unconsciousTurns > 0) target.unconsciousTurns = 0;
          if (target.id === "milo" && target.slowRebukeGuard === true && this.phase === "enemy" && entry.damage > 0) {
            target.slowRebukeDamageTaken = (target.slowRebukeDamageTaken || 0) + entry.damage;
          }
          this.showCombatResultText(target, { hit: true, critical: false, damage: entry.damage }, index);
          if (skill.id === "allTheTrappings" && entry.damage >= 0) {
            target.immobilizedTurns = Math.max(target.immobilizedTurns || 0, 2);
            target.trapped = true;
            this.showFloatingText(this.boardX + target.x * TILE_SIZE + TILE_SIZE / 2, this.boardY + target.y * TILE_SIZE + 30, "TRAPPED", "#fbbf24");
            this.showCenteredPopup?.(`${target.name} is caught in Harold's trappings!`);
          }
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
      this.applyFactoryAttackReactions?.(skill, targetResults.map((entry) => entry.target).filter(Boolean).map((target) => ({ x: target.x, y: target.y })));
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
            this.playUnitDeath(target, () => this.removeUnitSpriteAndData(target.id, unit.team === "player" ? unit.id : null));
          } else {
            this.playUnitDeath(target, () => this.removeUnitSpriteAndData(target.id, unit.team === "player" ? unit.id : null));
          }
        } else {
          this.refreshUnitSprite(target);
          this.setUnitSpriteFrame(target, "idle", target.facing || "down");
        }
      });
      if (options.endTurn !== false) {
        unit.acted = skill.id === "shadowstep" ? false : true;
        if (skill.id === "battleFocus") unit.nextAttackBonus = 3;
        if (skill.id === "brothersBligh") {
          const partner = this.getBrotherSkillPartner(unit);
          if (partner) {
            delete partner.pendingMoveOrigin;
            partner.acted = true;
            this.refreshUnitSprite(partner);
          }
        }
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
    if (!unit || unit.team !== "player" || unit.acted || this.isUnitUnconscious(unit)) return;
    const items = unit.items || [];
    if (items.length === 0) {
      this.helpText.setText(`${unit.name} has no items yet. Choose another action.`);
      return;
    }
    this.showItemMenu(unit);
  },

  getTradePartners(unit) {
    if (!unit || unit.team !== "player" || unit.acted || unit.hp <= 0 || this.isUnitUnconscious(unit)) return [];
    return this.units.filter((other) => (
      other &&
      other.id !== unit.id &&
      other.team === "player" &&
      other.hp > 0 &&
      other.isMiloDecoy !== true &&
      !this.isUnitUnconscious(other) &&
      distance(unit, other) === 1
    ));
  },

  chooseActionTrade(unitId) {
    const unit = this.units.find((u) => u.id === unitId);
    if (!unit || unit.team !== "player" || unit.acted || this.isUnitUnconscious(unit)) return;
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
      canChoose: (item) => !item.passive && !item.passiveMoveBonus && !item.passiveDefensePierce && !item.eggTracker && (item.uses ?? 1) > 0,
      disabledText: (item) => item.passive || item.passiveMoveBonus || item.passiveDefensePierce || item.eggTracker ? `${item.name} is passive.` : `${item.name} has no uses left.`,
      onChoose: (item) => this.beginItemTargetSelection(unit, item),
    });
  },

  getItemTargetsAt(unit, item, x = unit.x, y = unit.y) {
    if (!unit || !item) return [];
    if (item.targetType === "self") return [unit];
    if (item.targetType === "enemyInStrengthRange") {
      const range = Math.max(1, unit.str || 1);
      return this.units.filter((other) => other.team === "enemy" && other.hp > 0 && Math.abs(other.x - x) + Math.abs(other.y - y) <= range);
    }
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
    if (item.leonOnlySkill) return `${item.name}: Leon can learn Field of Thorns. Other units cannot understand it.`;
    if (item.strengthBoost) return `${item.name}: consumable. Raises Strength by ${item.strengthBoost}.`;
    if (item.passiveMoveBonus) return `${item.name}: passive +${item.passiveMoveBonus} movement while carried.`;
    if (item.passiveDefensePierce) return `${item.name}: holder's attacks ignore ${item.passiveDefensePierce} Defense.`;
    if (item.tranqTurns) return `${item.name}: throw up to STR range to make an enemy unconscious for ${item.tranqTurns} turns.`;
    if (item.learnSkill) return `${item.name}: teaches ${this.getSkillTomeSkillForUnit(unit, item).name} to ${unit.name}.`;
    if (item.permanentStatBoost) return `${item.name}: permanently adds +${item.permanentStatBoost} to HP, STR, MAG, DEF, RES, SPD, and LUCK.`;
    if (item.permanentLuckBoost) return `${item.name}: permanently adds +${item.permanentLuckBoost} Luck.`;
    return item.description || `${item.name}: item effect will be added later.`;
  },

  getSkillTomeSkillForUnit(unit, item = null) {
    if (item?.learnSkill === "fieldOfThorns") {
      return { id: "fieldOfThorns", name: "Field of Thorns", cost: 2, type: "fieldOfThorns", damageFormula: "none", animationState: "magic", range: 4, maxTiles: 5 };
    }
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
    const verb = item.heal ? "who eats" : "a target for";
    this.helpText.setText(`Choose ${verb} ${item.name}. Press Space to cancel.`);
  },

  useItem(unitId, itemId, targetId) {
    const unit = this.units.find((u) => u.id === unitId);
    const target = this.units.find((u) => u.id === targetId);
    const item = (unit?.items || []).find((candidate) => candidate.id === itemId);
    if (!unit || !target || !item || unit.acted || unit.hp <= 0 || this.isUnitUnconscious(unit)) return false;
    const targets = this.getItemTargetsAt(unit, item, unit.x, unit.y);
    if (!targets.some((candidate) => candidate.id === target.id)) {
      this.helpText.setText(`${target.name} is not in range for ${item.name}.`);
      return false;
    }
    if (item.leonOnlySkill && unit.id !== "leon") {
      this.helpText.setText(`${unit.name} cannot understand ${item.name}.`);
      this.showCenteredPopup?.(`${unit.name} cannot understand ${item.name}.`);
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
      const learnedSkill = this.getSkillTomeSkillForUnit(target, item);
      target.skills = target.skills || [];
      if (target.skills.some((skill) => skill.id === learnedSkill.id)) {
        this.helpText.setText(`${target.name} already knows ${learnedSkill.name}.`);
        return false;
      }
      target.skills.push(learnedSkill);
      this.showFloatingText(this.boardX + target.x * TILE_SIZE + TILE_SIZE / 2, this.boardY + target.y * TILE_SIZE + 8, learnedSkill.name, "#ddd6fe");
      this.showCenteredPopup?.(`${target.name} learned ${learnedSkill.name}!`);
    }
    if (item.strengthBoost) {
      target.str = (target.str || 0) + item.strengthBoost;
      this.showFloatingText(this.boardX + target.x * TILE_SIZE + TILE_SIZE / 2, this.boardY + target.y * TILE_SIZE + 8, `STR +${item.strengthBoost}`, "#fde68a");
      this.showCenteredPopup?.(`${target.name}'s Strength rose by ${item.strengthBoost}!`);
    }
    if (item.tranqTurns) {
      target.unconsciousTurns = Math.max(target.unconsciousTurns || 0, item.tranqTurns);
      target.acted = true;
      this.showFloatingText(this.boardX + target.x * TILE_SIZE + TILE_SIZE / 2, this.boardY + target.y * TILE_SIZE + 8, "UNCONSCIOUS", "#bfdbfe");
      this.showCenteredPopup?.(`${target.name} is unconscious for ${item.tranqTurns} turns!`);
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
    const resultMessage = item.tranqTurns
      ? `${unit.name} threw ${item.name} at ${target.name}.`
      : `${target.name} used ${item.name}.`;
    this.clearSelection(resultMessage);
    this.checkEndOfPlayerPhase();
    return true;
  },

  waitUnit(unitId) {
    const unit = this.units.find((u) => u.id === unitId);
    if (!unit || unit.team !== "player" || unit.acted || this.isUnitUnconscious(unit)) return;
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
    if (!unit || unit.team !== "player" || unit.acted || unit.hp <= 0 || this.isUnitUnconscious(unit)) return;
    this.closeActionMenu();
    delete unit.pendingMoveOrigin;
    unit.acted = true;
    this.setCounterStance(unit, true);
    this.clearSelection(`${unit.name} waits and prepares to counter.`);
    this.checkEndOfPlayerPhase();
  },

  getAdjacentFactoryTiles(unit, predicate) {
    if (!unit || !this.isFactoryBonusLevel()) return [];
    return [[1, 0], [-1, 0], [0, 1], [0, -1]]
      .map(([dx, dy]) => ({ x: unit.x + dx, y: unit.y + dy }))
      .filter((tile) => this.isInBounds(tile.x, tile.y) && predicate(this.getTerrainAt(tile.x, tile.y), tile));
  },

  isAdjacentToFactoryMachinery(x, y) {
    if (!this.isFactoryBonusLevel()) return false;
    return [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => this.getTerrainAt(x + dx, y + dy) === "machinery");
  },

  getOpenableFactoryContainers(unit) {
    if (!unit || !isChapterThreeGaiden(this.currentChapterNumber)) return [];
    return [[1, 0], [-1, 0], [0, 1], [0, -1]]
      .map(([dx, dy]) => ({ x: unit.x + dx, y: unit.y + dy }))
      .filter((tile) => (
        this.isInBounds(tile.x, tile.y) &&
        this.getTerrainAt(tile.x, tile.y) === "container" &&
        !this.openedFactoryContainers?.has(tileKey(tile.x, tile.y))
      ));
  },

  canOpenFactoryChest(unit) {
    if (!unit) return false;
    if (this.isUnitUnconscious(unit)) return false;
    if (isChapterThreeGaiden(this.currentChapterNumber) && (unit.team === "enemy" || unit.team === "neutral") && unit.className === "Thief") return true;
    return (unit.skills || []).some((skill) => skill.id === "steal");
  },

  getInventoryMoveBonus(unit) {
    return (unit?.items || []).reduce((total, item) => {
      const bonus = Number(item?.passiveMoveBonus);
      return total + (Number.isFinite(bonus) && bonus > 0 ? bonus : 0);
    }, 0);
  },

  canUseStealAction(unit) {
    if (!unit || unit.team !== "player" || unit.acted || unit.hp <= 0 || this.isUnitUnconscious(unit)) return false;
    if (!this.canOpenFactoryChest(unit)) return false;
    return false;
  },

  getFactoryChestItemAt(x, y) {
    if (!isChapterThreeGaiden(this.currentChapterNumber)) return null;
    const chest = CHAPTER_THREE_GAIDEN_CHESTS.find((entry) => entry.x === x && entry.y === y);
    if (!chest) return null;
    const item = CHAPTER_THREE_GAIDEN_ITEMS.find((entry) => entry.id === chest.itemId);
    return item ? { ...item } : null;
  },

  getStealableAdjacentUnits(unit) {
    if (!unit) return [];
    return this.units.filter((other) => (
      other &&
      other.id !== unit.id &&
      other.hp > 0 &&
      other.team !== unit.team &&
      distance(unit, other) === 1 &&
      (other.items || []).length > 0
    ));
  },

  getFirstStolenOrInventoryItem(unit) {
    if (!unit) return null;
    return (unit.items || [])[0] || null;
  },

  markItemStolen(item) {
    if (!item) return item;
    return {
      ...item,
      stolen: true,
      stolenItem: true,
      stolenChestItem: this.isChapterThreeGaidenChestItem?.(item) === true,
      stolenAtChapter: "chapter3Bonus",
    };
  },

  awardStealXp(unit) {
    if (!unit || unit.team !== "player") return;
    const dummy = { level: (unit.level || 1) + 2, team: "enemy", boss: false };
    const xp = this.calculateXpGain(unit, dummy, true);
    if (xp > 0) this.awardXp(unit, xp);
  },

  chooseActionSteal(unitId) {
    const unit = this.units.find((candidate) => candidate.id === unitId);
    if (!this.canUseStealAction(unit)) {
      this.helpText.setText("No adjacent chest or inventory can be stolen from.");
      return;
    }
    const chests = this.getOpenableFactoryContainers(unit).map((tile) => ({
      ...tile,
      id: `chest_${tile.x}_${tile.y}`,
      name: "Chest",
      title: tileLabel(this.getTerrainAt(tile.x, tile.y)),
      isChestTarget: true,
    }));
    const units = this.getStealableAdjacentUnits(unit);
    this.showChoiceMenu(unit, {
      type: "item",
      title: "Steal",
      entries: [...chests, ...units],
      getLabel: (target) => target.isChestTarget ? `Chest ${target.x},${target.y}` : target.name,
      getSummary: (target) => target.isChestTarget
        ? `Open this chest.`
        : `Steal ${(target.items || [])[0]?.name || "an item"} from ${target.name}.`,
      getTargets: (target) => [target],
      onChoose: (target) => target.isChestTarget
        ? this.openFactoryContainer(unit.id, target)
        : this.stealFromUnit(unit.id, target.id),
    });
  },

  getBreakableFactoryTerrain(unit) {
    return [];
  },

  openFactoryContainer(unitId, forcedTarget = null) {
    const unit = this.units.find((candidate) => candidate.id === unitId);
    if (!unit || unit.acted || unit.hp <= 0 || this.isUnitUnconscious(unit)) return;
    if (!this.canOpenFactoryChest(unit)) {
      if (unit.team === "player") this.showActionMenu(unit, "Only units with Steal can open chests.");
      return;
    }
    const target = forcedTarget || this.getOpenableFactoryContainers(unit)[0];
    if (!target) {
      this.showActionMenu(unit, "No locked container is in reach.");
      return;
    }

    const item = this.getFactoryChestItemAt(target.x, target.y);
    if (!item || this.openedFactoryContainers?.has(tileKey(target.x, target.y))) {
      this.showActionMenu(unit, "No locked container is in reach.");
      return;
    }

    this.closeActionMenu();
    this.closeSelectionMenu(false);
    this.openedFactoryContainers.add(tileKey(target.x, target.y));
    this.destroyedFactoryTerrain.add(tileKey(target.x, target.y));
    const gainedItem = unit.team === "enemy" || unit.team === "neutral" ? { ...this.markItemStolen(item), fromBonusChest: true } : item;
    unit.items = [...(unit.items || []), gainedItem];
    if (unit.team === "enemy" || unit.team === "neutral") unit.hasStolenChestItem = true;
    else this.awardStealXp(unit);
    unit.acted = true;
    delete unit.pendingMoveOrigin;
    this.drawBoard();
    this.createEscapeCursor();
    this.refreshUnitSprite(unit);
    this.updateSelectedPanel();
    const messageIsEnemySteal = unit.team === "enemy" || unit.team === "neutral";
    this.showFloatingText(this.boardX + target.x * TILE_SIZE + TILE_SIZE / 2, this.boardY + target.y * TILE_SIZE + 8, messageIsEnemySteal ? "STOLEN" : "CHEST OPENED", "#fde68a");
    const message = messageIsEnemySteal
      ? `${unit.name} stole ${item.name}!`
      : `${unit.name} opened a chest and found ${item.name}.`;
    this.clearSelection(message);
    if (messageIsEnemySteal) this.showCenteredPopup?.(message);
    if (this.checkChapterThreeBonusVictory?.()) return;
    if (messageIsEnemySteal) return;
    this.checkEndOfPlayerPhase();
  },

  stealFromUnit(unitId, targetId) {
    const unit = this.units.find((candidate) => candidate.id === unitId);
    const target = this.units.find((candidate) => candidate.id === targetId);
    if (!unit || !target || unit.acted || unit.hp <= 0 || distance(unit, target) !== 1 || !(target.items || []).length) return false;
    const item = target.items.shift();
    const stolenItem = this.markItemStolen(item);
    unit.items = [...(unit.items || []), stolenItem];
    if (unit.team === "player") this.awardStealXp(unit);
    unit.acted = true;
    delete unit.pendingMoveOrigin;
    this.closeActionMenu();
    this.closeSelectionMenu(false);
    this.showFloatingText(this.boardX + target.x * TILE_SIZE + TILE_SIZE / 2, this.boardY + target.y * TILE_SIZE + 8, "STOLEN", "#fde68a");
    this.refreshUnitSprite(unit);
    this.refreshUnitSprite(target);
    this.updateSelectedPanel();
    this.clearSelection(`${unit.name} stole ${item.name} from ${target.name}.`);
    if (unit.team === "enemy") return true;
    this.checkEndOfPlayerPhase();
    return true;
  },

  recoverStolenItemsFromUnit(unit, receiver = null) {
    if (!isChapterThreeGaiden(this.currentChapterNumber)) return;
    if (unit?.escapedWithItems) return;
    const stolenItems = (unit?.items || []).filter((item) => this.isChapterThreeGaidenStolenChestItem?.(item));
    if (!stolenItems.length) return;
    const preferredRecipient = receiver || this.units.find((candidate) => candidate.id === unit.defeatedByUnitId);
    const recipient = preferredRecipient?.team === "player" && preferredRecipient.hp > 0 && preferredRecipient.isMiloDecoy !== true
      ? preferredRecipient
      : this.units.find((candidate) => candidate.team === "player" && candidate.hp > 0 && candidate.isMiloDecoy !== true);
    if (!recipient) return;
    recipient.items = [...(recipient.items || []), ...stolenItems.map((item) => ({
      ...item,
      stolen: false,
      stolenItem: false,
      stolenChestItem: false,
      recovered: true,
    }))];
    unit.items = (unit.items || []).filter((item) => !this.isChapterThreeGaidenStolenChestItem?.(item));
    unit.hasStolenChestItem = (unit.items || []).some((item) => this.isChapterThreeGaidenStolenChestItem?.(item));
    const itemNames = stolenItems.map((item) => item.name).join(", ");
    this.showFloatingText(this.boardX + recipient.x * TILE_SIZE + TILE_SIZE / 2, this.boardY + recipient.y * TILE_SIZE + 8, "ITEM RECOVERED", "#fde68a");
    const message = `${recipient.name} recovered ${itemNames}.`;
    this.helpText.setText(message);
    this.showCenteredPopup?.(message);
  },

  getAdjacentMarnieTalkTargets(unit) {
    if (!unit || unit.team !== "player" || unit.hp <= 0 || this.isUnitUnconscious(unit) || !isChapterThreeGaiden(this.currentChapterNumber)) return [];
    return this.units.filter((other) => (
      other &&
      other.id === "marnie" &&
      other.team === "neutral" &&
      other.hp > 0 &&
      distance(unit, other) === 1
    ));
  },

  talkToMarnie(unitId) {
    const unit = this.units.find((candidate) => candidate.id === unitId);
    const marnie = this.getAdjacentMarnieTalkTargets(unit)[0];
    if (!unit || !marnie) return;
    this.closeActionMenu();
    this.chapterThreeBonusMarnieTalked = true;
    this.marnieTalked = true;
    this.busy = true;
    this.showChapterTwoSetupDialogue({
      speaker: "Marnie",
      portrait: "marniePortrait",
      text: "Hey you....you aren't one of them jackboots, help me get passed them and I'll give you half my earnings here.",
      onContinue: () => {
        marnie.team = "player";
        marnie.neutral = false;
        marnie.recruitableByTalk = false;
        marnie.temporaryRecruit = true;
        marnie.recruitedThisChapter = true;
        marnie.permanentRecruit = false;
        this.marnieTemporarilyRecruited = true;
        if (!(marnie.skills || []).some((skill) => skill.id === "steal")) {
          marnie.skills = [...(marnie.skills || []), { id: "steal", name: "Steal", cost: 0, type: "passive" }];
        }
        marnie.acted = false;
        marnie.sigilPoints = marnie.sigilPoints ?? marnie.maxSigilPoints ?? 3;
        this.refreshUnitSprite(marnie);
        this.setUnitSpriteFrame(marnie, "idle", marnie.facing || "down");
        this.showCenteredPopup("Marnie joined The Bards!", () => {
          unit.acted = true;
          delete unit.pendingMoveOrigin;
          this.refreshUnitSprite(unit);
          this.busy = false;
          this.clearSelection("Marnie joined The Bards!");
          this.checkEndOfPlayerPhase();
        });
      },
    });
  },

  getFactoryTerrainHp(x, y) {
    const key = tileKey(x, y);
    if (this.factoryTerrainHp?.[key] != null) return this.factoryTerrainHp[key];
    const terrain = this.getTerrainAt(x, y);
    return terrain === "machinery" ? 8 : terrain === "crates" ? 5 : 0;
  },

  damageFactoryTerrain(x, y, amount = 4, source = {}) {
    if (!this.isFactoryBonusLevel() || !this.isInBounds(x, y)) return false;
    const terrain = this.getTerrainAt(x, y);
    if (!this.isFactoryDestructibleTerrain(terrain)) return false;
    const key = tileKey(x, y);
    const hp = Math.max(0, this.getFactoryTerrainHp(x, y) - Math.max(1, amount));
    this.factoryTerrainHp[key] = hp;
    this.showFloatingText(this.boardX + x * TILE_SIZE + TILE_SIZE / 2, this.boardY + y * TILE_SIZE + 8, hp <= 0 ? "BROKEN" : `OBJ -${amount}`, "#fbbf24");
    if (hp > 0) return true;

    this.destroyedFactoryTerrain.add(key);
    if (terrain === "machinery" && this.isFactoryIgnitionSource(source)) {
      this.explodeFactoryMachinery(x, y);
    }
    this.drawBoard();
    this.createEscapeCursor();
    return true;
  },

  breakFactoryTerrain(unitId) {
    const unit = this.units.find((candidate) => candidate.id === unitId);
    if (!unit || unit.team !== "player" || unit.acted || unit.hp <= 0 || this.isUnitUnconscious(unit)) return;
    const target = this.getBreakableFactoryTerrain(unit)[0];
    if (!target) {
      this.showActionMenu(unit, "No breakable factory object is in reach.");
      return;
    }

    this.closeActionMenu();
    this.damageFactoryTerrain(target.x, target.y, 4, { damageType: "physical", name: "Break" });
    unit.acted = true;
    delete unit.pendingMoveOrigin;
    this.refreshUnitSprite(unit);
    this.clearSelection(`${unit.name} attacked the obstruction.`);
    this.checkEndOfPlayerPhase();
  },

  isFactoryIgnitionSource(source = {}) {
    return false;
  },

  igniteFactorySpill(x, y) {
    return false;
  },

  explodeFactoryMachinery(x, y) {
    this.showFloatingText(this.boardX + x * TILE_SIZE + TILE_SIZE / 2, this.boardY + y * TILE_SIZE + 8, "BOOM", "#fb7185");
    this.units
      .filter((unit) => unit.hp > 0 && Math.abs(unit.x - x) + Math.abs(unit.y - y) <= 1)
      .forEach((unit) => this.damageFactoryHazardUnit(unit, 5, "BLAST"));
  },

  damageFactoryHazardUnit(unit, amount, label) {
    if (!unit || unit.hp <= 0) return;
    unit.hp = Math.max(0, unit.hp - amount);
    this.showFloatingText(this.boardX + unit.x * TILE_SIZE + TILE_SIZE / 2, this.boardY + unit.y * TILE_SIZE + 8, `${label} -${amount}`, "#fb7185");
    if (unit.hp <= 0) this.playUnitDeath(unit, () => this.removeUnitSpriteAndData(unit.id));
    else this.refreshUnitSprite(unit);
  },

  applyFactoryAttackReactions(source, affectedTiles = []) {
    if (!this.isFactoryBonusLevel() || !this.isFactoryIgnitionSource(source)) return;
    const seen = new Set();
    affectedTiles.forEach((tile) => {
      if (!tile || !this.isInBounds(tile.x, tile.y)) return;
      [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dy]) => {
        const x = tile.x + dx;
        const y = tile.y + dy;
        const key = tileKey(x, y);
        if (!this.isInBounds(x, y) || seen.has(key)) return;
        seen.add(key);
        const terrain = this.getTerrainAt(x, y);
        if (terrain === "spill") this.igniteFactorySpill(x, y);
        if (terrain === "machinery") this.damageFactoryTerrain(x, y, 8, source);
      });
    });
  },

  placeThornTiles(unit, tiles = []) {
    this.chapterThreeBonusThorns = this.chapterThreeBonusThorns || [];
    tiles.slice(0, 5).forEach((tile) => {
      const key = tileKey(tile.x, tile.y);
      this.chapterThreeBonusThorns = this.chapterThreeBonusThorns.filter((thorn) => thorn.key !== key);
      this.chapterThreeBonusThorns.push({
        key,
        x: tile.x,
        y: tile.y,
        ownerId: unit.id,
        damage: Math.max(0, unit.def || 0),
        turnsRemaining: 3,
        triggersRemaining: 3,
      });
    });
    this.renderThornMarkers();
    this.showCenteredPopup("Field of Thorns spread across the floor.");
  },

  renderThornMarkers() {
    if (!this.thornLayer) return;
    this.thornLayer.removeAll(true);
    (this.chapterThreeBonusThorns || []).forEach((thorn) => {
      const marker = this.add.rectangle(
        this.boardX + thorn.x * TILE_SIZE + TILE_SIZE / 2,
        this.boardY + thorn.y * TILE_SIZE + TILE_SIZE / 2,
        TILE_SIZE - 16,
        TILE_SIZE - 16,
        0x166534,
        0.38
      );
      marker.setStrokeStyle(2, 0x86efac);
      this.thornLayer.add(marker);
    });
  },

  triggerThornAt(unit) {
    if (!unit || unit.hp <= 0) return;
    const key = tileKey(unit.x, unit.y);
    const thorn = (this.chapterThreeBonusThorns || []).find((entry) => entry.key === key);
    if (!thorn) return;
    unit.hp = Math.max(0, unit.hp - thorn.damage);
    thorn.triggersRemaining -= 1;
    this.showFloatingText(this.boardX + unit.x * TILE_SIZE + TILE_SIZE / 2, this.boardY + unit.y * TILE_SIZE + 8, `THORNS -${thorn.damage}`, "#86efac");
    if (this.helpText) this.helpText.setText(`${unit.name} triggered Field of Thorns!`);
    if (unit.hp <= 0) this.playUnitDeath(unit, () => this.removeUnitSpriteAndData(unit.id));
    else this.refreshUnitSprite(unit);
    if (thorn.triggersRemaining <= 0) {
      this.chapterThreeBonusThorns = (this.chapterThreeBonusThorns || []).filter((entry) => entry.key !== key);
      this.showFloatingText(this.boardX + unit.x * TILE_SIZE + TILE_SIZE / 2, this.boardY + unit.y * TILE_SIZE + 30, "THORNS FADE", "#bbf7d0");
    }
    this.renderThornMarkers();
  },

  tickThornTurns() {
    this.chapterThreeBonusThorns = (this.chapterThreeBonusThorns || [])
      .map((thorn) => ({ ...thorn, turnsRemaining: (thorn.turnsRemaining || 0) - 1 }))
      .filter((thorn) => {
        if (thorn.turnsRemaining > 0) return true;
        this.showFloatingText(this.boardX + thorn.x * TILE_SIZE + TILE_SIZE / 2, this.boardY + thorn.y * TILE_SIZE + 8, "THORNS EXPIRE", "#bbf7d0");
        return false;
      });
    this.renderThornMarkers();
  },

  canUseGlobalTurnAction() {
    return this.phase === "player" &&
      !this.busy &&
      !this.previewOpen &&
      !this.selectionMenuOpen &&
      !this.pendingFieldOfThornsUse &&
      !this.pendingSingleTargetSkillUse &&
      !this.levelUpAllocationOpen &&
      !this.tradeOpen;
  },

  getUnactedPlayerUnits() {
    return this.units.filter((unit) => this.isControllablePlayerUnit(unit) && !unit.acted && !this.isUnitUnconscious(unit));
  },

  isControllablePlayerUnit(unit) {
    return !!unit &&
      unit.team === "player" &&
      unit.isMiloDecoy !== true &&
      unit.hp > 0 &&
      this.isInBounds(unit.x, unit.y) &&
      unit.hidden !== true &&
      unit.inactive !== true;
  },

  clearGlobalTurnActionState() {
    this.closeBattleContextMenu?.();
    this.closeActionMenu();
    this.closeSelectionMenu(false);
    this.pendingItemUse = null;
    this.pendingParleyUse = null;
    this.pendingMiloRescue = null;
    this.pendingPhoenixReckoningUse = null;
    this.pendingFieldOfThornsUse = null;
    this.pendingSingleTargetSkillUse = null;
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
    this.input.mouse?.disableContextMenu?.();
    this.input.keyboard?.on("keydown-SPACE", (event) => {
      if (event?.preventDefault) event.preventDefault();
      this.handleSpaceCancel();
    });
    this.input.keyboard?.on("keydown-ENTER", (event) => {
      if (event?.preventDefault) event.preventDefault();
      if (this.pendingFieldOfThornsUse) this.confirmFieldOfThornsSelection();
    });

    this.input.on("pointerdown", (pointer) => {
      const isRightClick = pointer.rightButtonDown?.() || pointer.button === 2;
      if (isRightClick) {
        if (pointer.event?.preventDefault) pointer.event.preventDefault();
        this.openBattleContextMenu?.(pointer.x, pointer.y);
        return;
      }
      if (this.battleContextMenuOpen) {
        this.closeBattleContextMenu?.();
        return;
      }
      if (this.phase !== "player" || this.busy || this.previewOpen || this.actionMenuOpen || this.selectionMenuOpen || this.levelUpAllocationOpen || this.tradeOpen || this.battleSaveSlotContainer) return;
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

      if (this.pendingPhoenixReckoningUse) {
        if (this.isTargetTile(tile.x, tile.y)) {
          this.usePhoenixReckoningInDirection(tile.x, tile.y);
          return;
        }
        this.helpText.setText("Choose a highlighted line for Phoenix Reckoning, or press Space to cancel.");
        return;
      }

      if (this.pendingFieldOfThornsUse) {
        if (this.isTargetTile(tile.x, tile.y)) {
          this.toggleFieldOfThornsTile(tile.x, tile.y);
          return;
        }
        this.helpText.setText("Choose highlighted thorn tiles. Press Enter to confirm or Space to cancel.");
        return;
      }

      if (this.pendingSingleTargetSkillUse) {
        if (clickedUnit && this.isTargetTile(clickedUnit.x, clickedUnit.y)) {
          this.useSingleTargetSkillOn(clickedUnit.id);
          return;
        }
        this.helpText.setText("Choose a highlighted skill target, or press Space to cancel.");
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
      if (clickedUnit && clickedUnit.team === "player" && clickedUnit.isMiloDecoy !== true) {
        this.closeActionMenu();
        this.pendingItemUse = null;
        this.pendingParleyUse = null;
        this.pendingMiloRescue = null;
        this.pendingPhoenixReckoningUse = null;
        this.pendingFieldOfThornsUse = null;
        this.pendingSingleTargetSkillUse = null;
        this.selectedUnitId = clickedUnit.id;
        this.moveTiles = clickedUnit.acted ? [] : this.reachableTiles(clickedUnit);
        this.targetTiles = [];
        this.targetTileColor = null;
        this.targetTileStroke = null;
        this.redrawSelection();
        this.updateSelectedPanel();
        this.helpText.setText(clickedUnit.acted
          ? `${clickedUnit.name} has already acted. Review their unit card and inventory.`
          : `Selected ${clickedUnit.name}. Choose a tile to move to, click them again to act here, or press Space to cancel.`);
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

    if (this.battleContextMenuOpen) {
      this.closeBattleContextMenu?.();
      return;
    }

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

    if (this.pendingPhoenixReckoningUse) {
      const unit = this.units.find((candidate) => candidate.id === this.pendingPhoenixReckoningUse.unitId) || selectedUnit;
      this.pendingPhoenixReckoningUse = null;
      this.targetTiles = [];
      this.targetTileColor = null;
      this.targetTileStroke = null;
      this.redrawSelection();
      if (unit && unit.team === "player" && !unit.acted) {
        this.showActionMenu(unit, "Phoenix Reckoning cancelled. Choose another action.");
      }
      return;
    }

    if (this.pendingFieldOfThornsUse) {
      const unit = this.units.find((candidate) => candidate.id === this.pendingFieldOfThornsUse.unitId) || selectedUnit;
      this.pendingFieldOfThornsUse = null;
      this.targetTiles = [];
      this.targetTileColor = null;
      this.targetTileStroke = null;
      this.redrawSelection();
      if (unit && unit.team === "player" && !unit.acted) {
        this.showActionMenu(unit, "Field of Thorns cancelled. Choose another action.");
      }
      return;
    }

    if (this.pendingSingleTargetSkillUse) {
      const unit = this.units.find((candidate) => candidate.id === this.pendingSingleTargetSkillUse.unitId) || selectedUnit;
      this.pendingSingleTargetSkillUse = null;
      this.targetTiles = [];
      this.targetTileColor = null;
      this.targetTileStroke = null;
      this.redrawSelection();
      if (unit && unit.team === "player" && !unit.acted) {
        this.showActionMenu(unit, "Skill cancelled. Choose another action.");
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

  isFactoryBonusLevel() {
    return isChapterThreeGaiden(this.currentChapterNumber);
  },

  isFactoryBlockedTerrain(terrain) {
    return terrain === "machinery" || terrain === "crates";
  },

  isFactoryDestructibleTerrain(terrain) {
    return false;
  },

  isConveyorTerrain(terrain) {
    return terrain === "conveyorUp" || terrain === "conveyorRight" || terrain === "conveyorDown" || terrain === "conveyorLeft";
  },

  getConveyorDelta(terrain) {
    if (terrain === "conveyorUp") return { dx: 0, dy: -1 };
    if (terrain === "conveyorRight") return { dx: 1, dy: 0 };
    if (terrain === "conveyorDown") return { dx: 0, dy: 1 };
    if (terrain === "conveyorLeft") return { dx: -1, dy: 0 };
    return { dx: 0, dy: 0 };
  },

  getTerrainMovementCost(x, y) {
    const terrain = this.getTerrainAt(x, y);
    if (terrain === "spill") return 2;
    return 1;
  },

  isWalkable(x, y) {
    if (!this.isInBounds(x, y)) return false;
    const terrain = this.getTerrainAt(x, y);
    return terrain !== "wall" && terrain !== "fence" && !this.isFactoryBlockedTerrain(terrain);
  },

  reachableTiles(unit) {
    const queue = [{ x: unit.x, y: unit.y, steps: 0 }];
    const visited = new Set([tileKey(unit.x, unit.y)]);
    const reachable = [];
    const movementRange = unit.unconsciousTurns > 0 || unit.immobilizedTurns > 0
      ? 0
      : (unit.move || 0) + (unit.turnMoveBonus || 0) + this.getInventoryMoveBonus(unit);
    while (queue.length > 0) {
      const current = queue.shift();
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = current.x + dx;
        const ny = current.y + dy;
        const key = tileKey(nx, ny);
        const nextSteps = current.steps + this.getTerrainMovementCost(nx, ny);
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

  canFactoryShiftUnit(unit, dx, dy) {
    if (!unit || dx === 0 && dy === 0) return false;
    const nx = unit.x + dx;
    const ny = unit.y + dy;
    return this.isInBounds(nx, ny) && this.isWalkable(nx, ny) && !this.getUnitAt(nx, ny);
  },

  slideFactoryUnit(unit, dx, dy, label = "SLIDE", onComplete = null) {
    if (!this.canFactoryShiftUnit(unit, dx, dy)) {
      if (typeof onComplete === "function") onComplete();
      return;
    }

    const sprite = this.unitSprites[unit.id];
    unit.x += dx;
    unit.y += dy;
    unit.facing = this.getDirectionFromDelta(dx, dy, unit.facing || "down");
    this.playUnitState(unit, "move", PLAYER_MOVE_DURATION);
    this.showFloatingText(
      this.boardX + unit.x * TILE_SIZE + TILE_SIZE / 2,
      this.boardY + unit.y * TILE_SIZE + 8,
      label,
      "#fde68a"
    );

    const finish = () => {
      this.setUnitSpriteFrame(unit, "idle", unit.facing || "down");
      this.refreshUnitSprite(unit);
      if (typeof onComplete === "function") onComplete();
    };

    if (!sprite) {
      finish();
      return;
    }

    this.tweens.add({
      targets: sprite.container,
      x: this.boardX + unit.x * TILE_SIZE + TILE_SIZE / 2,
      y: this.boardY + unit.y * TILE_SIZE + TILE_SIZE / 2,
      duration: PLAYER_MOVE_DURATION,
      ease: "Sine.easeInOut",
      onComplete: finish,
    });
  },

  applyFactorySpillSlide(unit, dx, dy, onComplete = null) {
    if (!this.isFactoryBonusLevel() || this.getTerrainAt(unit.x, unit.y) !== "spill") {
      if (typeof onComplete === "function") onComplete();
      return;
    }
    this.slideFactoryUnit(unit, dx, dy, "SLIP", onComplete);
  },

  resolveFactoryConveyors(onComplete = null) {
    if (!this.isFactoryBonusLevel()) {
      if (typeof onComplete === "function") onComplete();
      return;
    }

    const movers = this.units
      .filter((unit) => unit.hp > 0 && this.isConveyorTerrain(this.getTerrainAt(unit.x, unit.y)))
      .map((unit) => ({ unitId: unit.id, terrain: this.getTerrainAt(unit.x, unit.y) }));

    const runNext = (index = 0) => {
      if (index >= movers.length) {
        if (typeof onComplete === "function") onComplete();
        return;
      }
      const entry = movers[index];
      const unit = this.units.find((candidate) => candidate.id === entry.unitId && candidate.hp > 0);
      if (!unit || !this.isConveyorTerrain(this.getTerrainAt(unit.x, unit.y))) {
        runNext(index + 1);
        return;
      }
      const { dx, dy } = this.getConveyorDelta(entry.terrain);
      this.slideFactoryUnit(unit, dx, dy, "BELT", () => runNext(index + 1));
    };

    runNext();
  },

  moveUnit(unitId, x, y) {
    const unit = this.units.find((u) => u.id === unitId);
    const sprite = this.unitSprites[unitId];
    if (!unit || !sprite || unit.team !== "player" || unit.acted || this.isUnitUnconscious(unit)) return;

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
            this.applyFactorySpillSlide(unit, Math.sign(x - oldX), Math.sign(y - oldY), () => {
              unit.rangeBonus = this.getTerrainAt(unit.x, unit.y) === "catwalk" ? 1 : 0;
              this.triggerThornAt(unit);
              if (unit.hp <= 0) {
                this.busy = false;
                this.checkEndOfPlayerPhase();
                return;
              }
              this.busy = false;
              this.showActionMenu(unit, `${unit.name} moved. Choose an action, Wait, or End Turn to finish the turn.`);
            });
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
    if (!attacker || !defender || this.isUnitUnconscious(attacker)) return;

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
    this.applyFactoryAttackReactions?.(weapon, (sequence.targets || [defender]).map((target) => ({ x: target.x, y: target.y })));
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
          this.playUnitDeath(defender, () => this.removeUnitSpriteAndData(defender.id, attacker.id));
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
            this.playUnitDeath(target, () => this.removeUnitSpriteAndData(target.id, attacker.id));
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
    if (this.pendingFieldOfThornsUse?.selectedTiles?.length) {
      this.pendingFieldOfThornsUse.selectedTiles.forEach((tile) => {
        const x = this.boardX + tile.x * TILE_SIZE;
        const y = this.boardY + tile.y * TILE_SIZE;
        const overlay = this.add.rectangle(x + TILE_SIZE / 2, y + TILE_SIZE / 2, TILE_SIZE - 18, TILE_SIZE - 18, 0x166534, 0.65);
        overlay.setStrokeStyle(3, 0xbbf7d0, 1);
        this.overlayLayer.add(overlay);
      });
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
    const moveBonus = this.getInventoryMoveBonus(unit);
    const moveLine = moveBonus > 0 ? `MOV ${unit.move} +${moveBonus}` : `MOV ${unit.move}`;
    const statuses = [];
    if (this.isUnitUnconscious(unit)) statuses.push(`UNCON ${unit.unconsciousTurns}`);
    if ((unit.immobilizedTurns || 0) > 0 || unit.trapped === true) statuses.push(`TRAPPED ${unit.immobilizedTurns || 1}`);
    const statusLine = statuses.length ? `\nSTATUS ${statuses.join("  ")}` : "";
    this.unitStatsText.setText(`STR ${unit.str}   MAG ${unit.mag}\n${defLine}\nRES ${unit.res}\n${spdLine}\nLUCK ${unit.luck || 0}   ${moveLine}${statusLine}`);
    const itemSummary = `
Items: ${(unit.items || []).map((item) => `${item.name}${item.uses ? ` x${item.uses}` : ""}`).join(", ") || "None"}`;

    this.weaponText.setText(
      weapon
        ? `Weapon: ${weapon.name}
Base ${weapon.baseDamage ?? weapon.damage ?? 0} | ${weapon.damageType || "physical"} | Hit ${weapon.hitRate ?? 100}%
Range ${getWeaponRangeLabel(weapon)} | Crit: Luck diff x3${itemSummary}`
        : `Weapon: None${itemSummary}`
    );
  }
};
