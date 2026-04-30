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

    const skills = (unit.skills || []).map((skill) => ({ ...skill }));

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
      getLabel: (skill) => `${skill.name} (${skill.cost || 0} SP)`,
      layout: "leftPanel",
      getSummary: (skill) => this.getSkillSummary(unit, skill),
      getTargets: (skill) => this.getSkillTargetsAt(unit, skill, unit.x, unit.y),
      getPreviewTiles: (skill) => this.getSkillHitTilesAt(unit, skill, unit.x, unit.y),
      canChoose: (skill) => this.canUseSkill(unit, skill),
      disabledText: (skill) => `${skill.name} needs ${skill.cost} Sigil Points.`,
      onChoose: (skill) => {
        if (!this.canUseSkill(unit, skill)) {
          this.helpText.setText(`${skill.name} needs ${skill.cost} Sigil Points.`);
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
    this.selectedUnitId = unit.id;
    this.moveTiles = [];
    this.targetTiles = [];
    this.targetTileColor = null;
    this.targetTileStroke = null;
    this.redrawSelection();
    this.updateSelectedPanel();

    const centerX = this.boardX + unit.x * TILE_SIZE + TILE_SIZE / 2;
    const centerY = this.boardY + unit.y * TILE_SIZE + TILE_SIZE / 2;
    const rowHeight = config.layout === "leftPanel" ? 38 : 42;
    const menuWidth = config.layout === "leftPanel" ? 184 : 310;
    const menuHeight = config.layout === "leftPanel"
      ? Phaser.Math.Clamp(142 + entries.length * rowHeight, 214, 330)
      : Phaser.Math.Clamp(132 + entries.length * rowHeight, 210, 430);
    const maxRightBeforeSidePanel = 708;
    const x = config.layout === "leftPanel"
      ? 92
      : Phaser.Math.Clamp(centerX + TILE_SIZE * 1.1, menuWidth / 2 + 8, maxRightBeforeSidePanel - menuWidth / 2);
    const y = config.layout === "leftPanel"
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
    let allyPreviewPortrait = null;
    let allyPreviewStats = null;
    if (config.type === "allyPick") {
      const previewFrame = this.add.rectangle(menuWidth / 2 + 118, -8, 210, 252, 0x1e1030, 1);
      previewFrame.setStrokeStyle(2, 0xe4d0a8);
      allyPreviewPortrait = this.add.image(menuWidth / 2 + 118, -56, "leonPortrait").setDisplaySize(108, 132);
      allyPreviewStats = this.add.text(menuWidth / 2 + 118, 38, "", {
        fontSize: "13px",
        color: "#eadff7",
        align: "center",
        lineSpacing: 4,
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
        if (config.type === "allyPick" && allyPreviewPortrait && allyPreviewStats) {
          const portraitKey = entry.portraitKey && this.textures.exists(entry.portraitKey) ? entry.portraitKey : "leonPortrait";
          allyPreviewPortrait.setTexture(portraitKey).setVisible(true);
          allyPreviewStats.setText(`Lv 2 ${entry.className}\nHP ${entry.maxHp}  STR ${entry.str}  MAG ${entry.mag}\nDEF ${entry.def}  RES ${entry.res}  SPD ${entry.spd}`);
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
      if (config.type === "allyPick" && allyPreviewPortrait && allyPreviewStats) {
        const portraitKey = firstEntry.portraitKey && this.textures.exists(firstEntry.portraitKey) ? firstEntry.portraitKey : "leonPortrait";
        allyPreviewPortrait.setTexture(portraitKey).setVisible(true);
        allyPreviewStats.setText(`Lv 2 ${firstEntry.className}\nHP ${firstEntry.maxHp}  STR ${firstEntry.str}  MAG ${firstEntry.mag}\nDEF ${firstEntry.def}  RES ${firstEntry.res}  SPD ${firstEntry.spd}`);
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

  getSkillSummary(unit, skill) {
    if (!unit || !skill) return "";
    const targets = this.getSkillTargetsAt(unit, skill, unit.x, unit.y);
    const hitTiles = this.getSkillHitTilesAt(unit, skill, unit.x, unit.y);
    let effect = "Uses a special technique.";

    if (skill.id === "brothersBligh") {
      const partner = this.getBrotherSkillPartner(unit);
      const power = this.getCombinedBrotherPower();
      effect = `Combines Edwin and Leon's STR + MAG for ${power} damage in a 3x2 blast ahead of ${unit.name}. Costs 3 SP from both brothers${partner ? "" : " (partner missing)"}.`;
    } else if (skill.damageFormula === "mag") {
      effect = `Deals ${unit.mag || 0} damage to every unit in the surrounding squares.`;
    } else if (skill.damageFormula === "strPlusSpd") {
      effect = `Deals ${(unit.str || 0) + (unit.spd || 0)} damage to every unit in the surrounding squares.`;
    }

    return `${skill.name}: costs ${skill.cost || 0} Sigil Point${(skill.cost || 0) === 1 ? "" : "s"}. ${effect} Hit zone: ${hitTiles.length} tile${hitTiles.length === 1 ? "" : "s"}. Units currently hit: ${targets.length}.`;
  },

  getSkillById(unit, skillId) {
    return this.getAvailableSkills(unit).find((skill) => skill.id === skillId) || null;
  },

  canUseSkill(unit, skill) {
    if (!unit || !skill) return false;

    if (skill.id === "brothersBligh") {
      const partner = this.getBrotherSkillPartner(unit);
      return this.areBrothersAdjacent() &&
        !!partner &&
        (unit.sigilPoints ?? 0) >= (skill.cost ?? 0) &&
        (partner.sigilPoints ?? 0) >= (skill.partnerCost ?? skill.cost ?? 0);
    }

    return (unit.sigilPoints ?? 0) >= (skill.cost ?? 0);
  },

  getSkillHitTilesAt(unit, skill, x = unit.x, y = unit.y) {
    if (!unit || !skill) return [];

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

    return this.units.filter((other) => {
      if (!other || other.id === unit.id || other.hp <= 0) return false;
      if (!hitTileKeys.has(tileKey(other.x, other.y))) return false;
      if (skill.targetTeam === "enemy" && other.team === unit.team) return false;
      if (skill.targetTeam === "ally" && other.team !== unit.team) return false;
      return true;
    });
  },

  calculateSkillDamage(unit, target, skill) {
    if (!unit || !skill) return 0;
    if (skill.damageFormula === "mag") return Math.max(0, unit.mag || 0);
    if (skill.damageFormula === "strPlusSpd") return Math.max(0, (unit.str || 0) + (unit.spd || 0));
    if (skill.damageFormula === "brothersCombinedStrMag") return Math.max(0, this.getCombinedBrotherPower());
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
        target.hp = Math.max(0, target.hp - entry.damage);
        this.showCombatResultText(target, { hit: true, critical: false, damage: entry.damage }, index);
        this.time.delayedCall(index * 120, () => this.playUnitHurt(target, 360));
        const didKill = entry.wasAlive && target.hp <= 0;
        if (didKill) {
          if (target.id === "falan") defeatedFalan = true;
          if (target.team === "player") defeatedPlayerUnits.push(target);
          if (unit.team === "player" && target.team === "enemy") totalXp += this.calculateXpGain(unit, target, true);
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
          } else if (target.team === "player") {
            target.hp = 0;
            this.refreshUnitSprite(target);
          } else {
            this.playUnitDeath(target, () => this.removeUnitSpriteAndData(target.id));
          }
        } else {
          this.refreshUnitSprite(target);
          this.setUnitSpriteFrame(target, "idle", target.facing || "down");
        }
      });
      if (options.endTurn !== false) {
        unit.acted = true;
        this.refreshUnitSprite(unit);
      }
      this.updateSelectedPanel();
      const finishDelay = 760 + targetResults.length * 120;
      this.time.delayedCall(finishDelay, () => {
        if (defeatedPlayerUnits.length > 0) {
          const gameOverUnit = defeatedPlayerUnits.find((target) => this.isChapterOneGameOverDeath(target)) || defeatedPlayerUnits[0];
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
    return item.description || `${item.name}: item effect will be added later.`;
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
    item.uses = (item.uses ?? 1) - 1;
    if (item.uses <= 0) {
      unit.items = (unit.items || []).filter((candidate) => candidate.id !== item.id);
    }
    delete unit.pendingMoveOrigin;
    this.pendingItemUse = null;
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
    this.clearSelection(`${target.name} ate ${item.name}.`);
    this.checkEndOfPlayerPhase();
    return true;
  },

  waitUnit(unitId) {
    const unit = this.units.find((u) => u.id === unitId);
    if (!unit || unit.team !== "player" || unit.acted) return;
    this.closeActionMenu();
    delete unit.pendingMoveOrigin;
    unit.acted = true;
    this.refreshUnitSprite(unit);
    this.clearSelection(`${unit.name} waits.`);
    this.checkEndOfPlayerPhase();
  },

  setupInput() {
    this.input.keyboard?.on("keydown-SPACE", (event) => {
      if (event?.preventDefault) event.preventDefault();
      this.handleSpaceCancel();
    });

    this.input.on("pointerdown", (pointer) => {
      if (this.phase !== "player" || this.busy || this.previewOpen || this.actionMenuOpen || this.selectionMenuOpen || this.levelUpAllocationOpen) return;
      const tile = this.pointerToTile(pointer.x, pointer.y);
      if (!tile) return;
      const clickedUnit = this.getUnitAt(tile.x, tile.y);
      const selectedUnit = this.getSelectedUnit();

      if (this.pendingItemUse) {
        if (clickedUnit && this.isTargetTile(clickedUnit.x, clickedUnit.y)) {
          this.useItem(this.pendingItemUse.unitId, this.pendingItemUse.itemId, clickedUnit.id);
          return;
        }
        this.helpText.setText("Choose one of the highlighted item targets, or press Space to cancel.");
        return;
      }

      if (clickedUnit && selectedUnit && clickedUnit.id === selectedUnit.id && selectedUnit.team === "player" && !selectedUnit.acted) {
        this.showActionMenu(selectedUnit, `${selectedUnit.name} holds position. Choose an action.`);
        return;
      }
      if (clickedUnit && clickedUnit.team === "player" && !clickedUnit.acted) {
        this.closeActionMenu();
        this.pendingItemUse = null;
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

    if (this.previewOpen) {
      this.closePreview();
      return;
    }

    const selectedUnit = this.getSelectedUnit();

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
    while (queue.length > 0) {
      const current = queue.shift();
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = current.x + dx;
        const ny = current.y + dy;
        const key = tileKey(nx, ny);
        const nextSteps = current.steps + 1;
        if (visited.has(key)) continue;
        if (!this.isWalkable(nx, ny)) continue;
        if (nextSteps > unit.move) continue;
        const occupant = this.getUnitAt(nx, ny);
        if (occupant && occupant.id !== unit.id) continue;
        visited.add(key);
        queue.push({ x: nx, y: ny, steps: nextSteps });
        reachable.push({ x: nx, y: ny });
      }
    }
    return reachable;
  },

  attackableEnemies(unit) {
    return this.units.filter((other) => other.team !== unit.team && other.hp > 0 && canAttack(unit, other));
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

      this.setUnitSpriteFrame(attacker, "idle", attacker.facing || "down");
      this.updateSelectedPanel();

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

      this.time.delayedCall(350, () => {
        this.busy = false;
        this.checkEndOfPlayerPhase();
      });
    };

    this.playStandardBattleScene(attacker, defender, weapon, sequence, defenderStartHp, finishStandardAttack);
  },

  clearSelection(message = "Click Edwin or Leon to select a unit.") {
    this.closeActionMenu();
    this.pendingItemUse = null;
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
