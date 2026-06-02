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
    if (terrain === "catwalk") return 2;
    if (terrain === "church" && weapon?.damageType === "magical") return 5;
    if (terrain === "farmhouseBurned") return 5;
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
    const terrainDefense = this.getTerrainDefenseBonus(defender, weapon);
    if (weapon.damageType === "magical") return (defender.res || 0) + terrainDefense;
    const baseDefense = Math.max(0, (defender.def || 0) - (weapon.defPierce || 0));
    return baseDefense + terrainDefense;
  },

  calculateBaseDamage(attacker, defender, weapon) {
    if (!attacker || !defender || !weapon) return 0;
    const attackStatName = weapon.stat || "str";
    const attackStat = attacker[attackStatName] || 0;
    const baseDamage = weapon.baseDamage ?? weapon.damage ?? 0;
    const itemPierce = (attacker.items || []).reduce((total, item) => {
      const pierce = Number(item?.passiveDefensePierce);
      return total + (Number.isFinite(pierce) && pierce > 0 ? pierce : 0);
    }, 0);
    const effectiveWeapon = itemPierce > 0 ? { ...weapon, defPierce: (weapon.defPierce || 0) + itemPierce } : weapon;
    const defense = this.getDefenseForAttack(defender, effectiveWeapon);
    const phoenixBonus = (attacker.skills || []).some((skill) => skill.id === "phoenixReckoning")
      ? Math.max(0, (attacker.maxHp || attacker.hp || 0) - (attacker.hp || 0))
      : 0;
    return Math.max(0, baseDamage + attackStat + phoenixBonus + (attacker.nextAttackBonus || 0) - defense);
  },

  calculateDamage(attacker, defender, weapon) {
    return this.calculateBaseDamage(attacker, defender, weapon);
  },

  getXpRateForUnit(unit) {
    if (!unit) return 1;
    if (unit.id === "milo" && unit.latent === true && (unit.level || 1) < 10) return 2;
    return unit.xpRate || 1;
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

  getTerrainDodgeChance(attacker, defender, weapon) {
    if (!attacker || !defender || !weapon) return 0;
    const terrain = this.getTerrainAt(defender.x, defender.y);
    if (terrain === "catwalk") return 10;
    if (terrain === "smokeTile") return 15;
    if (terrain !== "forest") return 0;
    const attackRange = Math.abs(attacker.x - defender.x) + Math.abs(attacker.y - defender.y);
    return attackRange <= 1 ? 10 : 25;
  },

  rollTerrainDodge(attacker, defender, weapon) {
    const dodgeChance = this.getTerrainDodgeChance(attacker, defender, weapon);
    return dodgeChance > 0 && Phaser.Math.Between(1, 100) <= dodgeChance;
  },

  getLineAttackTargets(attacker, defender, weapon) {
    if (!attacker || !defender || !weapon) return [];
    const targets = [defender];
    const lineLength = weapon.lineThroughTarget || 1;
    if (lineLength <= 1) return targets;

    const dx = Math.sign(defender.x - attacker.x);
    const dy = Math.sign(defender.y - attacker.y);
    if (Math.abs(dx) + Math.abs(dy) !== 1) return targets;

    for (let step = 2; step <= lineLength; step += 1) {
      const tileX = attacker.x + dx * step;
      const tileY = attacker.y + dy * step;
      if (!this.isInBounds(tileX, tileY)) break;
      const extraTarget = this.getUnitAt(tileX, tileY);
      if (extraTarget && extraTarget.hp > 0 && extraTarget.team !== attacker.team) targets.push(extraTarget);
    }

    return targets;
  },

  resolveAttackSequence(attacker, defender, weapon) {
    const attackCount = this.calculateAttackCount(attacker, defender, weapon);
    const results = [];
    const splashResults = [];
    let totalDamage = 0;
    let didKill = false;
    let slowRebukeBonus = Math.max(0, attacker?.slowRebukeReadyDamage || 0);
    let slowRebukeConsumed = false;
    const targets = this.getLineAttackTargets(attacker, defender, weapon);
    for (let i = 0; i < attackCount; i += 1) {
      if (targets.every((target) => target.hp <= 0)) break;
      const hit = this.rollHit(weapon);
      if (!hit) {
        results.push({ hit: false, critical: false, damage: 0, baseDamage: 0 });
        continue;
      }
      if (defender.hp > 0 && this.rollTerrainDodge(attacker, defender, weapon)) {
        results.push({ hit: false, critical: false, damage: 0, baseDamage: 0, terrainDodge: true });
        continue;
      }
      let primaryResult = { hit: true, critical: false, damage: 0, baseDamage: 0 };
      targets.forEach((target, targetIndex) => {
        if (!target || target.hp <= 0) return;
        if (targetIndex > 0 && this.rollTerrainDodge(attacker, target, weapon)) {
          splashResults.push({ target, hit: false, critical: false, damage: 0, baseDamage: 0, terrainDodge: true, attackIndex: i });
          return;
        }
        const baseDamage = this.calculateDamage(attacker, target, weapon) + (slowRebukeBonus > 0 && !slowRebukeConsumed ? slowRebukeBonus : 0);
        if (slowRebukeBonus > 0 && !slowRebukeConsumed) slowRebukeConsumed = true;
        const critical = this.rollCritical(attacker, target);
        const damage = critical ? baseDamage * 3 : baseDamage;
        target.hp = Math.max(0, target.hp - damage);
        if (damage > 0 && target.unconsciousTurns > 0) {
          target.unconsciousTurns = 0;
        }
        if (target.id === "milo" && target.slowRebukeGuard === true && this.phase === "enemy" && damage > 0) {
          target.slowRebukeDamageTaken = (target.slowRebukeDamageTaken || 0) + damage;
        }
        totalDamage += damage;
        const result = { target, hit: true, critical, damage, baseDamage, attackIndex: i };
        if (targetIndex === 0) primaryResult = result;
        else splashResults.push(result);
      });
      results.push(primaryResult);
      if (defender.hp <= 0) didKill = true;
    }
    if (slowRebukeConsumed) {
      attacker.slowRebukeReadyDamage = 0;
    }
    return { attackCount, results, splashResults, targets, totalDamage, didKill };
  },

  showCombatResultText(unit, result, index = 0) {
    const text = result.terrainDodge ? "DODGE" : !result.hit ? "MISS" : result.critical ? `CRIT -${result.damage}` : `-${result.damage}`;
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
      xp += levelGap * 8;
    } else if (levelGap < 0) {
      xp = Math.round(xp * Math.pow(0.72, Math.abs(levelGap)));
    }

    if (didKill && defender.boss) xp += 18;
    xp = Math.round(xp * this.getXpRateForUnit(attacker));
    return Math.max(1, xp);
  },

  awardParleyXp(unit, target, didRecruit = false) {
    const xp = this.calculateXpGain(unit, target, didRecruit);
    if (xp > 0) this.awardXp(unit, xp);
    return xp;
  },

  calculateSurvivalXpGain(defender, attacker) {
    if (!defender || defender.team !== "player" || defender.hp <= 0) return 0;
    if (!attacker || attacker.team !== "enemy") return 0;

    const levelGap = (attacker.level || 1) - (defender.level || 1);
    let xp = 2;
    if (levelGap > 0) xp = 10;
    else if (levelGap === 0) xp = 5;
    return Math.max(1, Math.round(xp * this.getXpRateForUnit(defender)));
  },

  awardSurvivalXp(defender, attacker, wasAlive = true) {
    if (!wasAlive || !defender || defender.hp <= 0) return 0;
    const xp = this.calculateSurvivalXpGain(defender, attacker);
    if (xp > 0) this.awardXp(defender, xp);
    return xp;
  },

  awardSurvivalXpForTargets(targets, attacker) {
    const awarded = new Set();
    (targets || []).forEach((target) => {
      if (!target || awarded.has(target.id)) return;
      awarded.add(target.id);
      this.awardSurvivalXp(target, attacker, true);
    });
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
      if (unit.id === "milo" && unit.latent === true && unit.level >= 10) {
        unit.xp = 0;
        break;
      }
    }
    this.showCombatXpPopup(unit, amount, oldLevel, oldXp);
    this.updateSelectedPanel();
    if (levelsGained > 0) {
      this.time.delayedCall(900, () => this.processLevelUpQueue());
    }
  },

  levelUpUnit(unit) {
    const oldLevel = unit.level || 1;
    unit.level += 1;
    if (unit.id === "milo" && unit.recruitedThisChapter === true && unit.level > (unit.recruitmentStartLevel || oldLevel)) {
      unit.gainedLevelAfterRecruitment = true;
    }
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
