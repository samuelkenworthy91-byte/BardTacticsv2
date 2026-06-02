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
  CHAPTER_THREE_SURVIVAL_TURNS,
} from "../../chapters/chapter3.js";
import {
  CHAPTER_THREE_GAIDEN_BOSS_ID,
  CHAPTER_THREE_GAIDEN_CHESTS,
  CHAPTER_THREE_GAIDEN_ITEMS,
} from "../../chapters/chapter3Gaiden.js";
import {
  buildChapterTwoSaveData,
  CHAPTER_TWO_NUMBER,
  getLevelForChapter,
  getSaveDataChapterNumber,
  isChapterOne,
  isChapterFour,
  isChapterThree,
  isChapterThreeGaiden,
  isChapterTwoOrLater,
  isChapterTwo,
} from "../../chapters/progression.js";
export const enemyAiMethods = {
  checkEndOfPlayerPhase() {
    if (this.hasPendingLevelUps()) {
      this.runAfterLevelUps(() => this.checkEndOfPlayerPhase());
      return;
    }

    if (this.checkChapterFourVictory?.()) return;
    if (this.checkChapterThreeGaidenVictory?.()) return;
    if (this.checkChapterThreeRoutVictory?.()) return;
    const remaining = this.units.filter((unit) => this.isControllablePlayerUnit?.(unit) && !unit.acted);
    if (remaining.length === 0) {
      this.busy = true;
      this.startEnemyPhase();
    }
  },

  removeMiloDecoy(decoy) {
    if (!decoy?.isMiloDecoy) return;
    decoy.hp = 0;
    this.playUnitDeath(decoy, () => this.removeUnitSpriteAndData(decoy.id));
  },

  finishMiloEnemyPhaseEffects() {
    this.units
      .filter((unit) => unit.id === "milo" && unit.hp > 0 && unit.slowRebukeGuard === true)
      .forEach((unit) => {
        const stored = Math.max(0, unit.slowRebukeDamageTaken || 0);
        unit.slowRebukeGuard = false;
        unit.slowRebukeDamageTaken = 0;
        unit.slowRebukeReadyDamage = stored;
        if (stored > 0) {
          this.showFloatingText(this.boardX + unit.x * TILE_SIZE + TILE_SIZE / 2, this.boardY + unit.y * TILE_SIZE + 8, `Rebuke +${stored}`, "#fde68a");
        }
      });

    this.units
      .filter((unit) => unit.isMiloDecoy === true && unit.hp > 0)
      .forEach((decoy) => {
        decoy.decoyTurnsRemaining = (decoy.decoyTurnsRemaining ?? 2) - 1;
        if (decoy.decoyTurnsRemaining <= 0) this.removeMiloDecoy(decoy);
      });
  },

  startEnemyPhase() {
    if (this.hasPendingLevelUps()) {
      this.runAfterLevelUps(() => this.startEnemyPhase());
      return;
    }

    this.closeActionMenu();
    this.phase = "enemy";
    this.phaseText.setText("Enemy Phase");
    this.phaseText.setColor("#fca5a5");
    this.helpText.setText("Enemies are moving...");
    this.clearSelection("Enemies are moving...");
    this.busy = true;
    const beginEnemyActions = () => {
      if (this.shouldSpawnChapterThreeReinforcements?.()) this.spawnChapterThreeReinforcements();
      this.enemyIndex = 0;
      this.enemyPhaseNoMove = isChapterThree(this.currentChapterNumber) && !this.chapterThreeFirstEnemyPhaseDone && (this.chapterThreeTurns || 0) === 1;
      this.enemyTurnOrder = this.units.filter((u) => (u.team === "enemy" || this.isChapterThreeGaidenNeutralMarnie?.(u)) && u.hp > 0);
      this.enemyTurnOrder.forEach((enemy) => {
        if (enemy.immobilizedTurns > 0) {
          enemy.immobilizedTurns -= 1;
          if (enemy.immobilizedTurns <= 0) enemy.trapped = false;
        }
        enemy.counterStance = false;
        enemy.counterUsed = false;
        this.applyTurnStartTerrainEffects(enemy);
        enemy.opportunityThreatIdsAtTurnStart = this.getAdjacentOpponents(enemy).map((opponent) => opponent.id);
      });
      this.time.delayedCall(ENEMY_ACTION_PAUSE, () => this.runNextEnemy());
    };

    if (isChapterThree(this.currentChapterNumber)) {
      this.runCivilianMovement(beginEnemyActions);
      return;
    }

    if (isChapterThreeGaiden(this.currentChapterNumber)) {
      this.resolveFactoryConveyors?.(beginEnemyActions);
      return;
    }

    beginEnemyActions();
  },

  runNextEnemy() {
    if (this.hasPendingLevelUps()) {
      this.runAfterLevelUps(() => this.runNextEnemy());
      return;
    }

    if (this.checkChapterFourVictory?.()) return;
    if (this.checkChapterThreeGaidenVictory?.()) return;

    if (this.enemyIndex >= this.enemyTurnOrder.length) {
      if (this.checkChapterFourVictory?.()) return;
      if (this.checkChapterThreeGaidenVictory?.()) return;
      if (this.checkChapterThreeRoutVictory?.()) return;
      if (isChapterThree(this.currentChapterNumber) && (this.chapterThreeTurns || 0) >= CHAPTER_THREE_SURVIVAL_TURNS) {
        this.finishMiloEnemyPhaseEffects();
        this.helpText.setText("Tipen Whippet survived the attack.");
        this.time.delayedCall(650, () => this.startChapterThreeVictoryFlow ? this.startChapterThreeVictoryFlow() : this.startPostBattleScene());
        return;
      }
      this.finishMiloEnemyPhaseEffects();
      if (this.enemyPhaseNoMove) this.chapterThreeFirstEnemyPhaseDone = true;
      this.enemyPhaseNoMove = false;
      this.startPlayerPhase();
      return;
    }
    const enemyRef = this.enemyTurnOrder[this.enemyIndex];
    const enemy = this.units.find((u) => u.id === enemyRef.id);
    const shouldSkipDelayedEnemy = !!enemy &&
      isChapterThree(this.currentChapterNumber) &&
      enemy.skipEnemyPhaseTurn != null &&
      enemy.skipEnemyPhaseTurn >= (this.chapterThreeTurns || 0);
    if (enemy?.unconsciousTurns > 0) {
      enemy.unconsciousTurns = Math.max(0, enemy.unconsciousTurns - 1);
      this.refreshUnitSprite(enemy);
      this.helpText.setText(`${enemy.name} is unconscious.`);
      this.enemyIndex += 1;
      this.time.delayedCall(ENEMY_ACTION_PAUSE, () => this.runNextEnemy());
      return;
    }
    if (!enemy || enemy.hp <= 0 || (enemy.team !== "enemy" && !this.isChapterThreeGaidenNeutralMarnie?.(enemy)) || shouldSkipDelayedEnemy) {
      this.enemyIndex += 1;
      this.runNextEnemy();
      return;
    }
    if (this.tryHandleChapterThreeGaidenThiefEscape?.(enemy)) return;
    if (this.tryHandleChapterThreeGaidenThiefChestSteal?.(enemy)) return;
    this.selectedUnitId = enemy.id;
    this.updateSelectedPanel();
    this.helpText.setText(`${enemy.name} is acting...`);
    const plan = this.chooseEnemyPlan(enemy, { allowMove: !this.enemyPhaseNoMove });
    if (!plan) {
      this.setCounterStance(enemy, true);
      this.helpText.setText(`${enemy.name} waits and prepares to counter.`);
      this.enemyIndex += 1;
      this.time.delayedCall(ENEMY_ACTION_PAUSE, () => this.runNextEnemy());
      return;
    }
    const afterMove = () => {
      const actingEnemy = this.units.find((unit) => unit.id === enemy.id);
      if (!actingEnemy || actingEnemy.hp <= 0) {
        this.enemyIndex += 1;
        this.time.delayedCall(ENEMY_ACTION_PAUSE, () => this.runNextEnemy());
        return;
      }
      if (this.tryHandleChapterThreeGaidenThiefEscape?.(actingEnemy)) return;

      if (plan.action) this.time.delayedCall(ENEMY_ACTION_PAUSE, () => this.executeEnemyAction(actingEnemy, plan.action));
      else {
        this.setCounterStance(actingEnemy, true);
        this.helpText.setText(`${actingEnemy.name} waits and prepares to counter.`);
        this.enemyIndex += 1;
        this.time.delayedCall(ENEMY_ACTION_PAUSE, () => this.runNextEnemy());
      }
    };
    if (!plan.move || (plan.move.x === enemy.x && plan.move.y === enemy.y)) {
      afterMove();
      return;
    }
    this.moveEnemyTo(enemy, plan.move, afterMove);
  },

  executeEnemyAction(enemy, action) {
    if (!enemy || enemy.hp <= 0 || !action) {
      this.enemyIndex += 1;
      this.time.delayedCall(ENEMY_ACTION_PAUSE, () => this.runNextEnemy());
      return;
    }
    if (action.type === "skill") {
      this.useSkill(enemy.id, action.skill.id, { endTurn: false, targetId: action.target?.id, onComplete: () => {
        this.enemyIndex += 1;
        this.time.delayedCall(ENEMY_ACTION_PAUSE, () => this.runNextEnemy());
      } });
      return;
    }
    if (action.type === "attack" && action.target) {
      this.enemyAttack(enemy, action.target);
      return;
    }
    this.enemyIndex += 1;
    this.time.delayedCall(ENEMY_ACTION_PAUSE, () => this.runNextEnemy());
  },

  moveEnemyTo(enemy, moveTarget, onComplete) {
    const sprite = this.unitSprites[enemy.id];
    if (!enemy || !sprite || !moveTarget) {
      if (typeof onComplete === "function") onComplete();
      return;
    }

    const oldX = enemy.x;
    const oldY = enemy.y;
    const opportunityAttacker = this.getOpportunityThreatBeforeMove(enemy, moveTarget.x, moveTarget.y);

    const completeEnemyMove = () => {
      if (!enemy || enemy.hp <= 0 || !this.unitSprites[enemy.id]) {
        if (typeof onComplete === "function") onComplete();
        return;
      }

      enemy.facing = this.getDirectionFromDelta(moveTarget.x - oldX, moveTarget.y - oldY, enemy.facing || "down");
      this.playUnitState(enemy, "move", ENEMY_MOVE_DURATION + 150);
      enemy.x = moveTarget.x;
      enemy.y = moveTarget.y;
      this.helpText.setText(`${enemy.name} moves.`);
      this.tweens.add({
        targets: sprite.container,
        x: this.boardX + enemy.x * TILE_SIZE + TILE_SIZE / 2,
        y: this.boardY + enemy.y * TILE_SIZE + TILE_SIZE / 2,
        duration: ENEMY_MOVE_DURATION,
        ease: "Sine.easeInOut",
        onComplete: () => {
          this.refreshUnitSprite(enemy);
          this.setUnitSpriteFrame(enemy, "idle", enemy.facing || "down");
          this.applyFactorySpillSlide?.(enemy, Math.sign(moveTarget.x - oldX), Math.sign(moveTarget.y - oldY), () => {
            this.triggerThornAt?.(enemy);
            if (enemy.hp <= 0) {
              if (typeof onComplete === "function") onComplete();
              return;
            }
            if (typeof onComplete === "function") onComplete();
          });
        },
      });
    };

    if (opportunityAttacker) {
      this.resolveOpportunityAttack(opportunityAttacker, enemy, completeEnemyMove);
      return;
    }

    completeEnemyMove();
  },

  applyTurnStartTerrainEffects(unit) {
    if (!unit || unit.hp <= 0) return;
    const terrain = this.getTerrainAt(unit.x, unit.y);
    unit.turnMoveBonus = terrain === "road" || terrain === "farmRoad" ? 2 : 0;
    unit.rangeBonus = terrain === "catwalk" ? 1 : 0;

    if (terrain === "burningGrass") {
      const oldHp = unit.hp;
      unit.hp = Math.max(0, unit.hp - 2);
      this.refreshUnitSprite(unit);
      this.showFloatingText(
        this.boardX + unit.x * TILE_SIZE + TILE_SIZE / 2,
        this.boardY + unit.y * TILE_SIZE + 8,
        `-${oldHp - unit.hp}`,
        "#f97316"
      );
      if (unit.hp <= 0) {
        this.playUnitDeath?.(unit, () => this.removeUnitSpriteAndData?.(unit.id));
      }
      return;
    }

    const healAmount = terrain === "chinese" || terrain === "church" ? 3 : 0;
    if (healAmount <= 0) return;

    const maxHp = unit.maxHp || unit.hp || 1;
    const oldHp = unit.hp;
    unit.hp = Math.min(maxHp, unit.hp + healAmount);
    if (unit.hp <= oldHp) return;

    this.refreshUnitSprite(unit);
    this.showFloatingText(
      this.boardX + unit.x * TILE_SIZE + TILE_SIZE / 2,
      this.boardY + unit.y * TILE_SIZE + 8,
      `+${unit.hp - oldHp}`,
      "#86efac"
    );
  },

  getLivingOpponents(unit) {
    if (unit?.team === "civilian") return this.units.filter((other) => other.team === "enemy" && other.hp > 0);
    if (this.isChapterThreeGaidenNeutralMarnie?.(unit)) return this.units.filter((other) => (other.team === "player" || other.team === "enemy") && other.hp > 0);
    if (unit?.team === "enemy") return this.units.filter((other) => (other.team === "player" || other.team === "civilian") && other.hp > 0);
    return this.units.filter((other) => other.team !== unit.team && other.hp > 0);
  },

  getNearestOpponent(unit) {
    const opponents = this.getLivingOpponents(unit);
    if (!opponents.length) return null;
    return opponents.reduce((best, opponent) => distance(unit, opponent) < distance(unit, best) ? opponent : best, opponents[0]);
  },

  getWeaponForPosition(attacker, defender, x, y) {
    if (!attacker || !defender || !attacker.weapons) return null;
    const dist = Math.abs(x - defender.x) + Math.abs(y - defender.y);
    return attacker.weapons.find((weapon) => {
      const minRange = weapon.minRange ?? weapon.range;
      const baseMaxRange = weapon.maxRange ?? weapon.range;
      const maxRange = baseMaxRange + ((baseMaxRange > 1 || weapon.range > 1) ? (attacker.rangeBonus || 0) : 0);
      return dist >= minRange && dist <= maxRange;
    }) || null;
  },

  calculateAttackScoreAt(attacker, defender, weapon) {
    if (!attacker || !defender || !weapon) return null;
    const damagePerHit = this.calculateDamage(attacker, defender, weapon);
    const attackCount = this.calculateAttackCount(attacker, defender, weapon);
    const critChance = this.calculateCriticalChance(attacker, defender);
    const expectedDamagePerHit = damagePerHit * (1 + critChance / 100 * 2);
    const totalDamage = damagePerHit * attackCount;
    const expectedDamage = expectedDamagePerHit * attackCount * ((weapon.hitRate ?? 100) / 100);
    const canKill = totalDamage >= defender.hp || expectedDamage >= defender.hp;
    return { canKill, totalDamage, expectedDamage, score: (canKill ? 100000 : 0) + expectedDamage * 100 + totalDamage };
  },

  getIncomingThreatScoreAt(unit, x, y) {
    if (!unit) return { expectedDamage: 0, lethal: false, adjacentThreats: 0 };

    let expectedDamage = 0;
    let adjacentThreats = 0;

    this.getLivingOpponents(unit).forEach((opponent) => {
      const distToTile = Math.abs(opponent.x - x) + Math.abs(opponent.y - y);
      if (distToTile === 1) adjacentThreats += 1;

      const weapon = this.getWeaponForPosition(opponent, { ...unit, x, y }, opponent.x, opponent.y);
      if (!weapon) return;

      const attackScore = this.calculateAttackScoreAt(opponent, { ...unit, x, y }, weapon);
      if (!attackScore) return;
      expectedDamage += attackScore.expectedDamage || 0;
    });

    return {
      expectedDamage,
      lethal: expectedDamage >= (unit.hp || 0),
      adjacentThreats,
    };
  },

  getOpportunityRiskForMove(unit, x, y) {
    if (!unit) return 0;
    const threat = this.getOpportunityThreatBeforeMove(unit, x, y);
    if (!threat) return 0;

    const weapon = getWeaponForTarget(threat, unit) || getDefaultWeapon(threat);
    if (!weapon) return 0;

    return this.calculateDamage(threat, unit, weapon) * (OPPORTUNITY_ATTACK_HIT_RATE / 100);
  },

  evaluateEnemyActionAt(enemy, x, y) {
    const opponents = this.getLivingOpponents(enemy);
    const actions = [];
    const positionedEnemy = {
      ...enemy,
      x,
      y,
      rangeBonus: this.getTerrainAt(x, y) === "catwalk" ? 1 : (enemy.rangeBonus || 0),
    };
    if (enemy.adjacentOnlyEnemy !== true) {
      (enemy.skills || []).forEach((skill) => {
        if (!this.canUseSkill(enemy, skill)) return;
        const allTargets = this.getSkillTargetsAt(positionedEnemy, skill, x, y);
        const opponentTargets = allTargets.filter((target) => target.team !== enemy.team);
        if (opponentTargets.length === 0) return;
        if (skill.id === "allTheTrappings") {
          opponentTargets.forEach((target) => {
            const damage = this.calculateSkillDamage(enemy, target, skill);
            const trapBonus = target.immobilizedTurns > 0 || target.trapped === true ? 0 : 250;
            actions.push({
              type: "skill",
              skill,
              target,
              targets: [target],
              canKill: damage >= target.hp,
              totalDamage: damage,
              expectedDamage: damage,
              score: (damage >= target.hp ? 120000 : 0) + damage * 115 + trapBonus + (target.isMiloDecoy ? 250000 : 0),
            });
          });
          return;
        }
        let totalDamage = 0;
        let canKill = false;
        opponentTargets.forEach((target) => {
          const damage = this.calculateSkillDamage(enemy, target, skill);
          totalDamage += damage;
          if (damage >= target.hp) canKill = true;
        });
        const decoyPriority = opponentTargets.some((target) => target.isMiloDecoy) ? 250000 : 0;
        actions.push({ type: "skill", skill, targets: opponentTargets, canKill, totalDamage, expectedDamage: totalDamage, score: (canKill ? 120000 : 0) + totalDamage * 115 + opponentTargets.length * 10 + decoyPriority });
      });
    }
    opponents.forEach((target) => {
      if (enemy.adjacentOnlyEnemy === true && Math.abs(x - target.x) + Math.abs(y - target.y) !== 1) return;
      const weapon = this.getWeaponForPosition(positionedEnemy, target, x, y);
      if (!weapon) return;
      const attackScore = this.calculateAttackScoreAt(positionedEnemy, target, weapon);
      if (!attackScore || attackScore.totalDamage <= 0) return;
      const gaidenPriority = this.getChapterThreeGaidenEnemyTargetBonus(enemy, target);
      actions.push({ type: "attack", target, weapon, ...attackScore, score: attackScore.score + (target.isMiloDecoy ? 250000 : 0) + gaidenPriority });
    });
    if (actions.length === 0) return null;
    actions.sort((a, b) => {
      if (a.canKill !== b.canKill) return a.canKill ? -1 : 1;
      if (b.score !== a.score) return b.score - a.score;
      const aDistance = a.target ? distance(enemy, a.target) : 0;
      const bDistance = b.target ? distance(enemy, b.target) : 0;
      return aDistance - bDistance;
    });
    return actions[0];
  },

  chooseEnemyPlan(enemy, options = {}) {
    enemy.opportunityThreatIdsAtTurnStart = this.getAdjacentOpponents(enemy).map((opponent) => opponent.id);

    const allowMove = options.allowMove !== false && !enemy.stationary && enemy.adjacentOnlyEnemy !== true;
    if (this.isChapterThreeGaidenNeutralMarnie?.(enemy)) {
      return this.chooseChapterThreeGaidenMarniePlan(enemy, allowMove);
    }
    if (this.isChapterThreeGaidenEscapingThief?.(enemy)) {
      const move = allowMove ? this.chooseChapterThreeGaidenThiefEscapeMove(enemy) : { x: enemy.x, y: enemy.y };
      return move ? { move, action: null, score: 1000000 } : null;
    }
    const moveOptions = allowMove ? [{ x: enemy.x, y: enemy.y }, ...this.reachableTiles(enemy)] : [{ x: enemy.x, y: enemy.y }];
    const priorityTarget = this.getChapterThreeGaidenEnemyPriorityTarget(enemy);
    const nearest = priorityTarget || this.getNearestOpponent(enemy);
    let bestPlan = null;

    moveOptions.forEach((option) => {
      const action = this.evaluateEnemyActionAt(enemy, option.x, option.y);
      const moveDistance = Math.abs(option.x - enemy.x) + Math.abs(option.y - enemy.y);
      const approachScore = nearest ? -1 * (Math.abs(option.x - nearest.x) + Math.abs(option.y - nearest.y)) : 0;
      const actionPriorityPenalty = priorityTarget && action?.target && !this.isChapterThreeGaidenHaroldPriorityTarget(action.target) ? 115000 : 0;
      const actionScore = action ? action.score - actionPriorityPenalty : -100000;
      const threat = this.getIncomingThreatScoreAt(enemy, option.x, option.y);
      const opportunityRisk = this.getOpportunityRiskForMove(enemy, option.x, option.y);
      const dangerPenalty = threat.expectedDamage * 85 + opportunityRisk * 120 + threat.adjacentThreats * 12 + (threat.lethal ? 65000 : 0);
      const gaidenMoveBonus = this.getChapterThreeGaidenEnemyMoveBonus(enemy, option, priorityTarget);
      const score = actionScore + approachScore + gaidenMoveBonus - moveDistance * 3 - dangerPenalty;

      if (!bestPlan || score > bestPlan.score) {
        bestPlan = { move: option, action, score, threat, opportunityRisk };
      }
    });

    if (bestPlan?.action) return bestPlan;
    if (!allowMove) return bestPlan;
    if (!nearest) return null;

    const move = this.chooseEnemyMoveToward(enemy, nearest);
    if (!move) return null;

    const enRouteAction = this.evaluateEnemyActionAt(enemy, move.x, move.y);
    return { move, action: enRouteAction, score: bestPlan?.score || 0 };
  },

  isChapterThreeGaidenChestItem(item) {
    if (!item) return false;
    if (item.fromBonusChest === true) return true;
    return CHAPTER_THREE_GAIDEN_ITEMS.some((chestItem) => chestItem.id === item.id);
  },

  isChapterThreeGaidenStolenChestItem(item) {
    if (!item) return false;
    if (!this.isChapterThreeGaidenChestItem(item)) return false;
    return item.stolenChestItem === true || item.stolenItem === true || item.stolen === true;
  },

  getChapterThreeGaidenLostChestCount() {
    return this.lostChapterThreeGaidenChestItems?.size || 0;
  },

  getChapterThreeGaidenLostChestSummary() {
    return `${this.getChapterThreeGaidenLostChestCount()}/${CHAPTER_THREE_GAIDEN_CHESTS.length} chest items lost`;
  },

  isChapterThreeGaidenThief(unit) {
    return isChapterThreeGaiden(this.currentChapterNumber) && (unit?.team === "enemy" || unit?.team === "neutral") && unit?.className === "Thief" && unit.hp > 0;
  },

  isChapterThreeGaidenNeutralMarnie(unit) {
    return isChapterThreeGaiden(this.currentChapterNumber) && unit?.id === "marnie" && unit.team === "neutral" && unit.hp > 0;
  },

  isChapterThreeGaidenEscapingThief(unit) {
    return this.isChapterThreeGaidenThief(unit) &&
      (unit.hasStolenChestItem === true || (unit.items || []).some((item) => this.isChapterThreeGaidenStolenChestItem(item)));
  },

  getChapterThreeGaidenGateTiles() {
    if (!isChapterThreeGaiden(this.currentChapterNumber)) return [];
    const gates = [];
    for (let y = 0; y < this.mapRows; y += 1) {
      for (let x = 0; x < this.mapCols; x += 1) {
        if (this.getTerrainAt(x, y) === "bayDoor") gates.push({ x, y });
      }
    }
    return gates;
  },

  getNearestChapterThreeGaidenGate(unit) {
    const gates = this.getChapterThreeGaidenGateTiles();
    if (!unit || !gates.length) return null;
    return gates.reduce((best, gate) => distance(unit, gate) < distance(unit, best) ? gate : best, gates[0]);
  },

  chooseChapterThreeGaidenThiefEscapeMove(enemy) {
    const gate = this.getNearestChapterThreeGaidenGate(enemy);
    if (!gate) return { x: enemy.x, y: enemy.y };
    const options = [{ x: enemy.x, y: enemy.y }, ...this.reachableTiles(enemy)];
    return options.reduce((best, option) => {
      const bestDistance = Math.abs(best.x - gate.x) + Math.abs(best.y - gate.y);
      const optionDistance = Math.abs(option.x - gate.x) + Math.abs(option.y - gate.y);
      if (optionDistance !== bestDistance) return optionDistance < bestDistance ? option : best;
      const bestMoveDistance = Math.abs(best.x - enemy.x) + Math.abs(best.y - enemy.y);
      const optionMoveDistance = Math.abs(option.x - enemy.x) + Math.abs(option.y - enemy.y);
      return optionMoveDistance > bestMoveDistance ? option : best;
    }, options[0]);
  },

  getNearestUnopenedChapterThreeGaidenChest(unit) {
    const chests = CHAPTER_THREE_GAIDEN_CHESTS.filter((chest) => !this.openedFactoryContainers?.has(tileKey(chest.x, chest.y)));
    if (!unit || !chests.length) return null;
    return chests.reduce((best, chest) => distance(unit, chest) < distance(unit, best) ? chest : best, chests[0]);
  },

  getChapterThreeGaidenMarnieGoal(unit) {
    if (this.isChapterThreeGaidenEscapingThief(unit)) return this.getNearestChapterThreeGaidenGate(unit);
    return this.getNearestUnopenedChapterThreeGaidenChest(unit);
  },

  getChapterThreeGaidenMarnieBlockingTarget(unit, goal) {
    if (!unit || !goal) return null;
    const currentDistance = distance(unit, goal);
    return this.units.find((other) => (
      other &&
      other.hp > 0 &&
      (other.team === "player" || other.team === "enemy") &&
      distance(unit, other) === 1 &&
      distance(other, goal) < currentDistance &&
      getWeaponForTarget(unit, other)
    )) || null;
  },

  chooseChapterThreeGaidenMarniePlan(unit, allowMove) {
    const goal = this.getChapterThreeGaidenMarnieGoal(unit);
    const blockingTarget = this.getChapterThreeGaidenMarnieBlockingTarget(unit, goal);
    if (blockingTarget) {
      return { move: { x: unit.x, y: unit.y }, action: { type: "attack", target: blockingTarget }, score: 1000000 };
    }
    if (!allowMove || !goal) return { move: { x: unit.x, y: unit.y }, action: null, score: 0 };
    const move = this.isChapterThreeGaidenEscapingThief(unit)
      ? this.chooseChapterThreeGaidenThiefEscapeMove(unit)
      : this.chooseEnemyMoveToward(unit, goal);
    return { move: move || { x: unit.x, y: unit.y }, action: null, score: 0 };
  },

  tryHandleChapterThreeGaidenThiefChestSteal(enemy) {
    if (!this.isChapterThreeGaidenThief(enemy) || this.isChapterThreeGaidenEscapingThief(enemy)) return false;
    const target = this.getOpenableFactoryContainers?.(enemy)?.[0];
    if (!target) return false;
    this.selectedUnitId = enemy.id;
    this.updateSelectedPanel();
    this.helpText.setText(`${enemy.name} is stealing from a chest...`);
    this.openFactoryContainer(enemy.id, target);
    if (this.tryHandleChapterThreeGaidenThiefEscape(enemy)) return true;
    this.enemyIndex += 1;
    this.time.delayedCall(ENEMY_ACTION_PAUSE + 500, () => this.runNextEnemy());
    return true;
  },

  tryHandleChapterThreeGaidenThiefEscape(enemy) {
    if (!this.isChapterThreeGaidenEscapingThief(enemy)) return false;
    if (this.getTerrainAt(enemy.x, enemy.y) !== "bayDoor") return false;
    const escapedItems = (enemy.items || []).filter((item) => this.isChapterThreeGaidenStolenChestItem(item));
    if (!escapedItems.length) return false;
    this.lostChapterThreeGaidenChestItems = this.lostChapterThreeGaidenChestItems || new Set();
    escapedItems.forEach((item) => this.lostChapterThreeGaidenChestItems.add(item.id));
    enemy.escapedWithItems = true;
    const itemNames = escapedItems.map((item) => item.name).join(", ");
    const message = `${enemy.name} escaped with ${itemNames}! ${this.getChapterThreeGaidenLostChestSummary()}.`;
    this.helpText.setText(message);
    this.showCenteredPopup?.(message);
    this.showFloatingText(this.boardX + enemy.x * TILE_SIZE + TILE_SIZE / 2, this.boardY + enemy.y * TILE_SIZE + 8, "ESCAPED", "#fca5a5");
    this.removeChapterThreeGaidenEscapedThief(enemy, () => {
      this.enemyIndex += 1;
      this.time.delayedCall(ENEMY_ACTION_PAUSE, () => this.runNextEnemy());
    });
    return true;
  },

  removeChapterThreeGaidenEscapedThief(enemy, onComplete = null) {
    const sprite = this.unitSprites[enemy.id];
    const finish = () => {
      if (sprite) {
        sprite.container.destroy();
        delete this.unitSprites[enemy.id];
      }
      this.units = this.units.filter((unit) => unit.id !== enemy.id);
      if (typeof onComplete === "function") onComplete();
    };
    if (!sprite) {
      finish();
      return;
    }
    this.tweens.add({
      targets: sprite.container,
      alpha: 0,
      duration: 520,
      ease: "Quad.Out",
      onComplete: finish,
    });
  },

  isAdjacentToUnopenedChapterThreeGaidenChest(unit) {
    if (!unit || !isChapterThreeGaiden(this.currentChapterNumber)) return false;
    return CHAPTER_THREE_GAIDEN_CHESTS.some((chest) => (
      !this.openedFactoryContainers?.has(tileKey(chest.x, chest.y)) &&
      Math.abs(unit.x - chest.x) + Math.abs(unit.y - chest.y) === 1
    ));
  },

  isChapterThreeGaidenHaroldPriorityTarget(unit) {
    if (!unit || unit.team !== "player" || unit.hp <= 0) return false;
    return this.isAdjacentToUnopenedChapterThreeGaidenChest(unit) ||
      (unit.items || []).some((item) => this.isChapterThreeGaidenChestItem(item));
  },

  getChapterThreeGaidenEnemyPriorityTarget(enemy) {
    if (!isChapterThreeGaiden(this.currentChapterNumber) || enemy?.id !== CHAPTER_THREE_GAIDEN_BOSS_ID) return null;
    const targets = this.getLivingOpponents(enemy).filter((unit) => this.isChapterThreeGaidenHaroldPriorityTarget(unit));
    if (!targets.length) return null;
    return targets.reduce((best, target) => distance(enemy, target) < distance(enemy, best) ? target : best, targets[0]);
  },

  getChapterThreeGaidenEnemyTargetBonus(enemy, target) {
    if (!isChapterThreeGaiden(this.currentChapterNumber) || enemy?.id !== CHAPTER_THREE_GAIDEN_BOSS_ID) return 0;
    return this.isChapterThreeGaidenHaroldPriorityTarget(target) ? 90000 : 0;
  },

  getChapterThreeGaidenEnemyMoveBonus(enemy, option, priorityTarget) {
    if (!isChapterThreeGaiden(this.currentChapterNumber) || !enemy || !option) return 0;
    let bonus = 0;
    if (enemy.id === CHAPTER_THREE_GAIDEN_BOSS_ID && priorityTarget) {
      bonus += Math.max(0, 16 - (Math.abs(option.x - priorityTarget.x) + Math.abs(option.y - priorityTarget.y))) * 900;
    }
    if (enemy.className === "Mage" && this.getTerrainAt(option.x, option.y) === "catwalk") {
      bonus += 450;
    }
    return bonus;
  },

  chooseEnemyMoveToward(enemy, target) {
    const options = this.reachableTiles(enemy);
    if (!options.length) return null;

    const currentThreat = this.getIncomingThreatScoreAt(enemy, enemy.x, enemy.y);
    let best = { x: enemy.x, y: enemy.y };
    let bestScore = -999999;

    for (const option of options) {
      const distanceToTarget = target ? Math.abs(option.x - target.x) + Math.abs(option.y - target.y) : 0;
      const threat = this.getIncomingThreatScoreAt(enemy, option.x, option.y);
      const opportunityRisk = this.getOpportunityRiskForMove(enemy, option.x, option.y);
      const dangerPenalty = threat.expectedDamage * 85 + opportunityRisk * 120 + threat.adjacentThreats * 10 + (threat.lethal ? 65000 : 0);
      const safetyBonus = currentThreat.lethal && !threat.lethal ? 12000 : 0;
      const score = -distanceToTarget * 8 - dangerPenalty + safetyBonus;

      if (score > bestScore) {
        best = option;
        bestScore = score;
      }
    }

    return best;
  },

  isAmbroseStillEnemy() {
    return this.units.some((unit) => unit.id === "ambrose" && unit.team === "enemy" && unit.hp > 0);
  },

  shouldSpawnChapterThreeReinforcements() {
    return isChapterThree(this.currentChapterNumber) && (this.chapterThreeTurns || 0) > 5 && this.isAmbroseStillEnemy();
  },

  createChapterThreeReinforcement(id, placement, gender = "male") {
    const isMale = gender === "male";
    return {
      id,
      name: "Mercenary",
      title: isMale ? "Guildlite Hammer" : "Guildlite Spear",
      team: "enemy",
      className: "Mercenary",
      level: 5,
      xp: 0,
      portraitKey: isMale ? "mercenaryPortrait" : "mercenaryFemalePortrait",
      spriteSet: isMale ? "mercenary_male" : "mercenary_female",
      facing: "down",
      move: 4,
      hp: isMale ? 14 : 12,
      maxHp: isMale ? 14 : 12,
      str: isMale ? 5 : 4,
      mag: 0,
      def: isMale ? 2 : 1,
      res: 1,
      spd: isMale ? 3 : 5,
      luck: 3,
      weapons: [isMale
        ? { name: "Mercenary Hammer", baseDamage: 5, range: 1, damageType: "physical", stat: "str", hitRate: 95, defPierce: 5 }
        : { name: "Mercenary Spear", baseDamage: 3, range: 1, damageType: "physical", stat: "str", hitRate: 95, lineThroughTarget: 2 }],
      skills: [],
      acted: true,
      skipEnemyPhaseTurn: this.chapterThreeTurns || 0,
      color: isMale ? 0xf97316 : 0xf87171,
      ...placement,
    };
  },

  spawnChapterThreeReinforcements() {
    const spawnTiles = [
      { x: 0, y: 1 }, { x: 2, y: 0 }, { x: 7, y: 1 },
      { x: 5, y: 0 }, { x: 6, y: 0 }, { x: 1, y: 1 },
      { x: 4, y: 0 },
    ];
    let spawned = 0;
    spawnTiles.forEach((tile) => {
      if (spawned >= 3 || !this.isInBounds(tile.x, tile.y) || this.getUnitAt(tile.x, tile.y)) return;
      const id = `chapter3_reinforcement_${this.chapterThreeTurns || 0}_${spawned + 1}_${Date.now()}`;
      const unit = this.createChapterThreeReinforcement(id, tile, spawned % 2 === 0 ? "male" : "female");
      this.units.push(unit);
      const sprite = this.createUnitSprite(unit);
      this.unitSprites[unit.id] = sprite;
      this.unitLayer.add(sprite.container);
      this.refreshUnitSprite(unit);
      this.setUnitSpriteFrame(unit, "idle", unit.facing || "down");
      spawned += 1;
    });
    if (spawned > 0) this.helpText.setText(`${spawned} mercenaries emerged from the trees.`);
  },

  getCivilianMoveTiles(unit, range = 3) {
    const queue = [{ x: unit.x, y: unit.y, steps: 0 }];
    const visited = new Set([tileKey(unit.x, unit.y)]);
    const reachable = [{ x: unit.x, y: unit.y }];
    while (queue.length > 0) {
      const current = queue.shift();
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = current.x + dx;
        const ny = current.y + dy;
        const key = tileKey(nx, ny);
        const nextSteps = current.steps + this.getTerrainMovementCost(nx, ny);
        if (visited.has(key) || nextSteps > range || !this.isWalkable(nx, ny)) continue;
        const occupant = this.getUnitAt(nx, ny);
        if (occupant && occupant.id !== unit.id) continue;
        visited.add(key);
        queue.push({ x: nx, y: ny, steps: nextSteps });
        reachable.push({ x: nx, y: ny });
      }
    }
    return reachable;
  },

  getCivilianSafetyScoreAt(civilian, x, y) {
    const terrain = this.getTerrainAt(x, y);
    const terrainBonus = terrain === "church" ? 30 : terrain === "forest" ? 24 : terrain === "cover" || terrain === "fort" ? 18 : terrain === "grass" ? 6 : 0;
    let score = terrainBonus;
    this.units.filter((unit) => unit.team === "enemy" && unit.hp > 0).forEach((enemy) => {
      const dist = Math.abs(enemy.x - x) + Math.abs(enemy.y - y);
      const weapon = this.getWeaponForPosition(enemy, { ...civilian, x, y }, enemy.x, enemy.y);
      if (weapon) score -= 1000;
      score += Math.min(8, dist) * 12;
      if (dist <= (enemy.move || 0) + 1) score -= 80 - dist * 8;
    });
    return score;
  },

  chooseCivilianMove(civilian) {
    const tiles = this.getCivilianMoveTiles(civilian, Math.max(3, civilian.move || 0));
    return tiles.reduce((best, tile) => {
      const score = this.getCivilianSafetyScoreAt(civilian, tile.x, tile.y);
      if (!best || score > best.score) return { ...tile, score };
      return best;
    }, null);
  },

  runCivilianMovement(onComplete = null) {
    const civilians = this.units.filter((unit) => unit.team === "civilian" && unit.hp > 0);
    let index = 0;
    const moveNext = () => {
      if (index >= civilians.length) {
        if (typeof onComplete === "function") onComplete();
        return;
      }
      const civilian = civilians[index];
      index += 1;
      const target = this.chooseCivilianMove(civilian);
      if (!target || (target.x === civilian.x && target.y === civilian.y)) {
        moveNext();
        return;
      }
      const sprite = this.unitSprites[civilian.id];
      const oldX = civilian.x;
      const oldY = civilian.y;
      civilian.facing = this.getDirectionFromDelta(target.x - oldX, target.y - oldY, civilian.facing || "down");
      civilian.x = target.x;
      civilian.y = target.y;
      this.playUnitState(civilian, "move", 360);
      if (!sprite) {
        moveNext();
        return;
      }
      this.tweens.add({
        targets: sprite.container,
        x: this.boardX + target.x * TILE_SIZE + TILE_SIZE / 2,
        y: this.boardY + target.y * TILE_SIZE + TILE_SIZE / 2,
        duration: 360,
        ease: "Sine.easeInOut",
        onComplete: () => {
          this.setUnitSpriteFrame(civilian, "idle", civilian.facing || "down");
          moveNext();
        },
      });
    };
    moveNext();
  },

  checkChapterThreeRoutVictory() {
    if (!isChapterThree(this.currentChapterNumber) || this.postBattleStarted) return false;
    const ambrose = this.units.find((unit) => unit.id === "ambrose" && unit.hp > 0);
    if (!ambrose || ambrose.team !== "player") return false;
    const enemiesRemaining = this.units.some((unit) => unit.team === "enemy" && unit.hp > 0);
    if (enemiesRemaining) return false;
    this.helpText.setText("Ambrose is with the Bards and the mercenaries are beaten.");
    this.phaseText.setText("Victory");
    this.phaseText.setColor("#86efac");
    this.busy = true;
    this.time.delayedCall(650, () => this.startChapterThreeVictoryFlow ? this.startChapterThreeVictoryFlow() : this.startPostBattleScene());
    return true;
  },

  checkChapterThreeGaidenVictory() {
    if (!isChapterThreeGaiden(this.currentChapterNumber) || this.postBattleStarted) return false;
    if (!this.areAllChapterThreeGaidenSuppliesResolved()) return false;
    const allChestItemsLost = this.areAllChapterThreeGaidenChestItemsLost();
    this.helpText.setText(allChestItemsLost ? "All six chest items were lost through the gates." : "All supplies are secured.");
    this.phaseText.setText("Victory");
    this.phaseText.setColor("#86efac");
    this.busy = true;
    this.time.delayedCall(650, () => this.startPostBattleScene());
    return true;
  },

  checkChapterFourVictory() {
    if (!isChapterFour(this.currentChapterNumber) || this.postBattleStarted) return false;
    const commandersRemaining = this.units.some((unit) => (
      (unit.id === "bertram" || unit.id === "elspeth") &&
      unit.team === "enemy" &&
      unit.hp > 0
    ));
    if (commandersRemaining) return false;
    this.helpText.setText("The Guildlite commanders are beaten back from Byron Farm.");
    this.phaseText.setText("Victory");
    this.phaseText.setColor("#86efac");
    this.busy = true;
    this.time.delayedCall(650, () => this.startPostBattleScene());
    return true;
  },

  getChapterThreeGaidenChestItemState(itemId) {
    if (!isChapterThreeGaiden(this.currentChapterNumber) || !itemId) return null;
    if (this.lostChapterThreeGaidenChestItems?.has(itemId)) return "lost/escaped";

    const holder = this.units.find((unit) => (
      unit &&
      unit.hp > 0 &&
      (unit.items || []).some((item) => item.id === itemId && this.isChapterThreeGaidenChestItem(item))
    ));
    if (holder?.team === "player") return "held by player/allied unit";
    if ((holder?.team === "enemy" || holder?.team === "neutral") && holder.className === "Thief") return "held by enemy thief";

    const chest = CHAPTER_THREE_GAIDEN_CHESTS.find((entry) => entry.itemId === itemId);
    if (chest && !this.openedFactoryContainers?.has(tileKey(chest.x, chest.y))) return "in chest";
    return "lost/escaped";
  },

  getChapterThreeGaidenChestItemStates() {
    return CHAPTER_THREE_GAIDEN_CHESTS.map((chest) => ({
      itemId: chest.itemId,
      state: this.getChapterThreeGaidenChestItemState(chest.itemId),
    }));
  },

  areAllChapterThreeGaidenSuppliesResolved() {
    if (!isChapterThreeGaiden(this.currentChapterNumber)) return false;
    return this.getChapterThreeGaidenChestItemStates().every((entry) => (
      entry.state === "held by player/allied unit" || entry.state === "lost/escaped"
    ));
  },

  areAllChapterThreeGaidenChestItemsLost() {
    if (!isChapterThreeGaiden(this.currentChapterNumber)) return false;
    return CHAPTER_THREE_GAIDEN_CHESTS.every((chest) => this.lostChapterThreeGaidenChestItems?.has(chest.itemId));
  },

  enemyAttack(attacker, defender) {
    const weapon = getWeaponForTarget(attacker, defender);
    if (!weapon) {
      this.enemyIndex += 1;
      this.time.delayedCall(250, () => this.runNextEnemy());
      return;
    }

    this.selectedUnitId = attacker.id;
    this.updateSelectedPanel();
    this.helpText.setText(`${attacker.name} attacks ${defender.name}.`);
    this.faceUnitToward(attacker, defender);
    this.faceUnitToward(defender, attacker);

    const defenderStartHp = defender.hp;
    const sequence = this.resolveAttackSequence(attacker, defender, weapon);
    this.applyFactoryAttackReactions?.(weapon, (sequence.targets || [defender]).map((target) => ({ x: target.x, y: target.y })));
    const shouldTriggerAshIntervention = this.shouldTriggerAshCivilianIntervention(attacker, sequence);

    const finishEnemyAttack = () => {
      const completeEnemyAttack = () => {
        this.enemyIndex += 1;
        this.time.delayedCall(550, () => this.runNextEnemy());
      };

      this.awardSurvivalXpForTargets(sequence.targets, attacker);

      if (defender.hp <= 0) {
        defender.hp = 0;

        if (defender.isMiloDecoy === true) {
          this.removeMiloDecoy(defender);
          this.helpText.setText(`${defender.name} vanished.`);
        } else if (defender.team === "player") {
          this.refreshUnitSprite(defender);
          this.setUnitSpriteFrame(attacker, "idle", attacker.facing || "down");
          this.updateSelectedPanel();
          this.handleAllyUnitDeath(defender, completeEnemyAttack);
          return;
        }

        if (defender.team === "civilian") {
          this.defeatedCivilians = [...new Set([...(this.defeatedCivilians || []), defender.id])];
          this.playUnitDeath(defender, () => this.removeUnitSpriteAndData(defender.id));
          this.helpText.setText(`${defender.name} was cut down.`);
        } else {
          this.playUnitDeath(defender, () => this.removeUnitSpriteAndData(defender.id));
        }

      } else {
        this.refreshUnitSprite(defender);
        this.setUnitSpriteFrame(defender, "idle", defender.facing || "down");
      }

      const defeatedSplashPlayerUnits = [];
      (sequence.targets || [])
        .filter((target) => target && target.id !== defender.id)
        .forEach((target) => {
          if (target.hp <= 0) {
            target.hp = 0;
            if (target.isMiloDecoy === true) {
              this.removeMiloDecoy(target);
              return;
            }
            if (target.team === "player") {
              this.refreshUnitSprite(target);
              defeatedSplashPlayerUnits.push(target);
              return;
            }
            if (target.team === "civilian") this.defeatedCivilians = [...new Set([...(this.defeatedCivilians || []), target.id])];
            this.playUnitDeath(target, () => this.removeUnitSpriteAndData(target.id));
          } else {
            this.refreshUnitSprite(target);
            this.setUnitSpriteFrame(target, "idle", target.facing || "down");
          }
        });

      this.setUnitSpriteFrame(attacker, "idle", attacker.facing || "down");
      this.updateSelectedPanel();
      const finishWithCounter = () => {
        if (defeatedSplashPlayerUnits.length > 0) {
          const gameOverUnit = defeatedSplashPlayerUnits.find((target) => this.isGameOverUnitDeath(target)) || defeatedSplashPlayerUnits[0];
          this.handleAllyUnitDeath(gameOverUnit, () => this.resolveCounterAttack(defender, attacker, completeEnemyAttack));
          return;
        }
        this.resolveCounterAttack(defender, attacker, completeEnemyAttack);
      };

      if (shouldTriggerAshIntervention) {
        this.triggerAshCivilianIntervention(finishWithCounter);
        return;
      }

      finishWithCounter();
    };

    this.playStandardBattleScene(attacker, defender, weapon, sequence, defenderStartHp, finishEnemyAttack);
  },

  shouldTriggerAshCivilianIntervention(attacker, sequence) {
    if (this.chapterThreeAshInterventionTriggered === true) return false;
    if (!isChapterThree(this.currentChapterNumber)) return false;
    if (!attacker || attacker.team !== "enemy" || attacker.id === "ash") return false;
    if (!String(attacker.id || "").startsWith("chapter3_mercenary")) return false;
    const ash = this.units.find((unit) => unit.id === "ash" && unit.team === "enemy" && unit.hp > 0);
    if (!ash) return false;
    return [...(sequence?.results || []), ...(sequence?.splashResults || [])].some((result) => (
      result?.hit === true &&
      (result.damage || 0) > 0 &&
      result.target?.team === "civilian"
    ));
  },

  triggerAshCivilianIntervention(onComplete = null) {
    const ash = this.units.find((unit) => unit.id === "ash" && unit.hp > 0);
    if (!ash || ash.team !== "enemy") {
      if (typeof onComplete === "function") onComplete();
      return;
    }

    this.chapterThreeAshInterventionTriggered = true;
    this.showChapterTwoSetupDialogue({
      speaker: "Ash",
      portrait: ash.portraitKey,
      text: "No. I cannot stand by and watch this. Draw blades on soldiers if you must, but leave the innocent out of it.",
      onContinue: () => {
        ash.team = "player";
        ash.acted = true;
        ash.stationary = false;
        ash.adjacentOnlyEnemy = false;
        ash.sigilPoints = ash.sigilPoints ?? ash.maxSigilPoints ?? 3;
        ash.spriteState = "idle";
        this.refreshUnitSprite(ash);
        this.setUnitSpriteFrame(ash, "idle", ash.facing || "down");
        this.updateSelectedPanel();
        this.showCenteredPopup("Ash joined the Bards!", () => {
          if (typeof onComplete === "function") onComplete();
        });
      },
    });
  },

  startPlayerPhase() {
    this.closeBattleContextMenu?.();
    this.pendingItemUse = null;
    this.pendingParleyUse = null;
    this.targetTileColor = null;
    this.targetTileStroke = null;
    this.phase = "player";
    this.phaseText.setText("Player Phase");
    this.phaseText.setColor("#c4b5fd");
    this.setObjectiveDisplayVisible(true);
    if (isChapterThree(this.currentChapterNumber) || isChapterThreeGaiden(this.currentChapterNumber)) {
      this.chapterThreeTurns = (this.chapterThreeTurns || 0) + 1;
    }
    this.tickThornTurns?.();
    for (const unit of this.units) {
      if (this.isControllablePlayerUnit?.(unit)) {
        unit.acted = false;
        if (unit.immobilizedTurns > 0) {
          unit.immobilizedTurns -= 1;
          if (unit.immobilizedTurns <= 0) unit.trapped = false;
        }
        if (unit.unconsciousTurns > 0) {
          unit.acted = true;
          unit.unconsciousTurns = Math.max(0, unit.unconsciousTurns - 1);
        }
        unit.counterStance = false;
        unit.counterUsed = false;
        delete unit.pendingMoveOrigin;
        this.applyTurnStartTerrainEffects(unit);
        unit.opportunityThreatIdsAtTurnStart = this.getAdjacentEnemies(unit).map((enemy) => enemy.id);
        this.refreshUnitSprite(unit);
        this.setUnitSpriteFrame(unit, "idle", unit.facing || "down");
      }
    }
    this.helpText.setText(isChapterThree(this.currentChapterNumber)
      ? `Player Phase ${this.chapterThreeTurns}/${CHAPTER_THREE_SURVIVAL_TURNS}. Survive and protect the 5 townsfolk.`
      : isChapterThreeGaiden(this.currentChapterNumber)
        ? `Player Phase ${this.chapterThreeTurns}. Take the supplies you can before it is too late. ${this.getChapterThreeGaidenLostChestSummary?.() || "0/6 chest items lost"}.`
        : isChapterFour(this.currentChapterNumber)
          ? "Player Phase. Push through the fire and defeat Bertram and Elspeth."
        : isChapterTwo(this.currentChapterNumber)
          ? "Player Phase. Capture all four forts. Fences block movement."
          : "Player Phase. Reach the glowing gate tile and choose Escape.");
    if (isChapterThree(this.currentChapterNumber) && (this.chapterThreeTurns || 0) > 5 && this.isAmbroseStillEnemy()) {
      this.showChapterTwoSetupDialogue({
        speaker: "Townsperson",
        portrait: "maraPortrait",
        text: "look out they're hiding in the tree",
      });
    }
    if (isChapterThreeGaiden(this.currentChapterNumber) && (this.chapterThreeTurns || 0) === 2 && !this.chapterThreeGaidenRoundTwoReinforcementsSpawned) {
      this.spawnChapterThreeGaidenRoundTwoReinforcements?.(() => {
        this.resolveFactoryConveyors?.(() => {
          this.busy = false;
        });
      });
      return;
    }
    if (isChapterThreeGaiden(this.currentChapterNumber)) {
      this.resolveFactoryConveyors?.(() => {
        this.busy = false;
      });
      return;
    }
    this.busy = false;
    if (isChapterTwo(this.currentChapterNumber)) {
      this.chapterTwoTurns = (this.chapterTwoTurns || 0) + 1;
      if (!this.chapterTwoSetupDone) this.beginChapterTwoSetupIfNeeded();
      if (this.chapterTwoSetupDone && this.chapterTwoTurns % 2 === 0) {
        const captured = this.capturedForts || new Set();
        const forts = Phaser.Utils.Array.Shuffle(
          this.getChapterTwoFortTiles().filter((tile) => !captured.has(tileKey(tile.x, tile.y)))
        ).slice(0, 2);
        let spawnedClones = 0;
        forts.forEach((fort) => {
          const spawnCandidates = [
            { x: fort.x, y: fort.y },
            { x: fort.x, y: fort.y + 1 },
            { x: fort.x - 1, y: fort.y },
            { x: fort.x + 1, y: fort.y },
            { x: fort.x, y: fort.y - 1 },
          ].filter((tile) => this.isInBounds(tile.x, tile.y) && this.isWalkable(tile.x, tile.y) && !this.getUnitAt(tile.x, tile.y));
          if (spawnCandidates.length > 0) {
            const spawnTile = spawnCandidates[0];
            this.spawnShadeAt(spawnTile.x, spawnTile.y, 3, null, 2);
            spawnedClones += 1;
          }
        });
        if (spawnedClones > 0) {
          this.helpText.setText(`${spawnedClones === 1 ? "A Shade clone appears" : "Shade clones appear"} near uncaptured forts!`);
        }
      }
    }
  }
};
