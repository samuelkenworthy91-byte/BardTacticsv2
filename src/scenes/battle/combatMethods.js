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
export const combatMethods = {
  getTerrainDefenseBonus(unit, weapon = null) {
    if (!unit) return 0;
    const terrain = this.getTerrainAt(unit.x, unit.y);
    if (terrain === "cover") return 5;
    if (terrain === "fort") return 5;
    if (terrain === "gate") return 5;
    return 0;
  },

  getWeaponSpeedBonus(unit, weapon) {
    if (!unit || !weapon) return 0;
    return weapon.speedBonus || 0;
  },

  getEffectiveSpeed(unit, weapon = null) {
    return (unit?.spd || 0) + this.getWeaponSpeedBonus(unit, weapon);
  },

  getDefenseForAttack(defender, weapon) {
    if (!defender || !weapon) return 0;
    if (weapon.damageType === "magical") return (defender.res || 0) + ((this.getTerrainAt(defender.x, defender.y) === "fort") ? 5 : 0);
    return (defender.def || 0) + this.getTerrainDefenseBonus(defender, weapon);
  },

  calculateBaseDamage(attacker, defender, weapon) {
    if (!attacker || !defender || !weapon) return 0;
    const attackStatName = weapon.stat || "str";
    const attackStat = attacker[attackStatName] || 0;
    const baseDamage = weapon.baseDamage ?? weapon.damage ?? 0;
    const defense = this.getDefenseForAttack(defender, weapon);
    return Math.max(0, baseDamage + attackStat - defense);
  },

  calculateDamage(attacker, defender, weapon) {
    return this.calculateBaseDamage(attacker, defender, weapon);
  },

  calculateCriticalChance(attacker, defender) {
    if (!attacker || !defender) return 0;
    return Phaser.Math.Clamp((attacker.luck || 0) - (defender.luck || 0), 0, 100);
  },

  rollCritical(attacker, defender) {
    const critChance = this.calculateCriticalChance(attacker, defender);
    return Phaser.Math.Between(1, 100) <= critChance;
  },

  calculateAttackCount(attacker, defender, weapon) {
    if (!attacker || !defender) return 1;
    const attackerSpeed = this.getEffectiveSpeed(attacker, weapon);
    const defenderWeapon = getWeaponForTarget(defender, attacker) || getDefaultWeapon(defender);
    const defenderSpeed = this.getEffectiveSpeed(defender, defenderWeapon);
    const speedGap = attackerSpeed - defenderSpeed;
    return Math.max(1, 1 + Math.floor(speedGap / 5));
  },

  rollHit(weapon) {
    return Phaser.Math.Between(1, 100) <= (weapon?.hitRate ?? 100);
  },

  resolveAttackSequence(attacker, defender, weapon) {
    const attackCount = this.calculateAttackCount(attacker, defender, weapon);
    const results = [];
    let totalDamage = 0;
    let didKill = false;
    for (let i = 0; i < attackCount; i += 1) {
      if (defender.hp <= 0) break;
      const hit = this.rollHit(weapon);
      if (!hit) {
        results.push({ hit: false, critical: false, damage: 0, baseDamage: 0 });
        continue;
      }
      const baseDamage = this.calculateDamage(attacker, defender, weapon);
      const critical = this.rollCritical(attacker, defender);
      const damage = critical ? baseDamage * 3 : baseDamage;
      defender.hp = Math.max(0, defender.hp - damage);
      totalDamage += damage;
      results.push({ hit: true, critical, damage, baseDamage });
      if (defender.hp <= 0) {
        didKill = true;
        break;
      }
    }
    return { attackCount, results, totalDamage, didKill };
  },

  showCombatResultText(unit, result, index = 0) {
    const text = !result.hit ? "MISS" : result.critical ? `CRIT -${result.damage}` : `-${result.damage}`;
    const color = !result.hit ? "#fef3c7" : result.critical ? "#fde68a" : "#fca5a5";
    this.time.delayedCall(index * 140, () => {
      this.showFloatingText(this.boardX + unit.x * TILE_SIZE + TILE_SIZE / 2, this.boardY + unit.y * TILE_SIZE + 8, text, color);
    });
  },

  calculateXpGain(attacker, defender, didKill) {
    if (!attacker || attacker.team !== "player") return 0;
    if (!defender || defender.team !== "enemy") return 0;

    const attackerLevel = attacker.level || 1;
    const defenderLevel = defender.level || 1;
    const levelGap = defenderLevel - attackerLevel;

    let xp = didKill ? 24 : 8;
    if (levelGap > 0) {
      xp += levelGap * 4;
    } else if (levelGap < 0) {
      xp = Math.round(xp * Math.pow(0.72, Math.abs(levelGap)));
    }

    if (didKill && defender.boss) xp += 18;
    xp = Math.round(xp * (attacker.xpRate || 1));
    return Math.max(1, xp);
  },

  awardXp(unit, amount) {
    if (!unit || unit.team !== "player" || amount <= 0) return;
    unit.level = unit.level || 1;
    unit.xp = unit.xp || 0;
    const oldLevel = unit.level;
    const oldXp = unit.xp;
    let levelsGained = 0;
    unit.xp += amount;
    while (unit.xp >= 100) {
      unit.xp -= 100;
      this.levelUpUnit(unit);
      levelsGained += 1;
    }
    this.showCombatXpPopup(unit, amount, oldLevel, oldXp);
    this.updateSelectedPanel();
    if (levelsGained > 0) {
      this.time.delayedCall(900, () => this.processLevelUpQueue());
    }
  },

  levelUpUnit(unit) {
    unit.level += 1;
    const points = this.rollLevelUpPoints(unit);
    this.queueLevelUpAllocation(unit, points);
  },

  showFloatingText(x, y, text, color = "#ffffff") {
    const floating = this.add.text(x, y, text, {
      fontSize: "18px",
      fontStyle: "bold",
      color,
      stroke: "#000000",
      strokeThickness: 4,
    }).setOrigin(0.5);
    floating.setDepth(9999);
    this.tweens.add({ targets: floating, y: y - 28, alpha: 0, duration: 900, ease: "Cubic.easeOut", onComplete: () => floating.destroy() });
    return floating;
  },

  fitImageInBox(image, textureKey, maxWidth, maxHeight) {
    if (!image) return;
    if (textureKey && this.textures.exists(textureKey)) image.setTexture(textureKey);
    const source = image.texture?.getSourceImage?.();
    if (!source?.width || !source?.height) {
      image.setDisplaySize(maxWidth, maxHeight);
      return;
    }
    const scale = Math.min(maxWidth / source.width, maxHeight / source.height);
    image.setDisplaySize(source.width * scale, source.height * scale);
  }
};
