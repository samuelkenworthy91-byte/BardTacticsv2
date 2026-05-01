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
export const enemyAiMethods = {
  checkEndOfPlayerPhase() {
    if (this.hasPendingLevelUps()) {
      this.runAfterLevelUps(() => this.checkEndOfPlayerPhase());
      return;
    }

    const remaining = this.units.filter((u) => u.team === "player" && !u.acted && u.hp > 0);
    if (remaining.length === 0) this.startEnemyPhase();
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
    this.enemyIndex = 0;
    this.enemyTurnOrder = this.units.filter((u) => u.team === "enemy" && u.hp > 0);
    this.enemyTurnOrder.forEach((enemy) => {
      enemy.opportunityThreatIdsAtTurnStart = this.getAdjacentOpponents(enemy).map((opponent) => opponent.id);
    });
    this.time.delayedCall(ENEMY_ACTION_PAUSE, () => this.runNextEnemy());
  },

  runNextEnemy() {
    if (this.hasPendingLevelUps()) {
      this.runAfterLevelUps(() => this.runNextEnemy());
      return;
    }

    if (this.enemyIndex >= this.enemyTurnOrder.length) {
      this.startPlayerPhase();
      return;
    }
    const enemyRef = this.enemyTurnOrder[this.enemyIndex];
    const enemy = this.units.find((u) => u.id === enemyRef.id);
    if (!enemy || enemy.hp <= 0) {
      this.enemyIndex += 1;
      this.runNextEnemy();
      return;
    }
    this.selectedUnitId = enemy.id;
    this.updateSelectedPanel();
    this.helpText.setText(`${enemy.name} is acting...`);
    const plan = this.chooseEnemyPlan(enemy);
    if (!plan) {
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

      if (plan.action) this.time.delayedCall(ENEMY_ACTION_PAUSE, () => this.executeEnemyAction(actingEnemy, plan.action));
      else {
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
      this.useSkill(enemy.id, action.skill.id, { endTurn: false, onComplete: () => {
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
          if (typeof onComplete === "function") onComplete();
        },
      });
    };

    if (opportunityAttacker) {
      this.resolveOpportunityAttack(opportunityAttacker, enemy, completeEnemyMove);
      return;
    }

    completeEnemyMove();
  },

  getLivingOpponents(unit) {
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
      const maxRange = weapon.maxRange ?? weapon.range;
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
    (enemy.skills || []).forEach((skill) => {
      if (!this.canUseSkill(enemy, skill)) return;
      const allTargets = this.getSkillTargetsAt(enemy, skill, x, y);
      const opponentTargets = allTargets.filter((target) => target.team !== enemy.team);
      if (opponentTargets.length === 0) return;
      let totalDamage = 0;
      let canKill = false;
      opponentTargets.forEach((target) => {
        const damage = this.calculateSkillDamage(enemy, target, skill);
        totalDamage += damage;
        if (damage >= target.hp) canKill = true;
      });
      actions.push({ type: "skill", skill, targets: opponentTargets, canKill, totalDamage, expectedDamage: totalDamage, score: (canKill ? 120000 : 0) + totalDamage * 115 + opponentTargets.length * 10 });
    });
    opponents.forEach((target) => {
      const weapon = this.getWeaponForPosition(enemy, target, x, y);
      if (!weapon) return;
      const attackScore = this.calculateAttackScoreAt(enemy, target, weapon);
      if (!attackScore || attackScore.totalDamage <= 0) return;
      actions.push({ type: "attack", target, weapon, ...attackScore });
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

  chooseEnemyPlan(enemy) {
    enemy.opportunityThreatIdsAtTurnStart = this.getAdjacentOpponents(enemy).map((opponent) => opponent.id);

    const options = [{ x: enemy.x, y: enemy.y }, ...this.reachableTiles(enemy)];
    const nearest = this.getNearestOpponent(enemy);
    let bestPlan = null;

    options.forEach((option) => {
      const action = this.evaluateEnemyActionAt(enemy, option.x, option.y);
      const moveDistance = Math.abs(option.x - enemy.x) + Math.abs(option.y - enemy.y);
      const approachScore = nearest ? -1 * (Math.abs(option.x - nearest.x) + Math.abs(option.y - nearest.y)) : 0;
      const actionScore = action ? action.score : -100000;
      const threat = this.getIncomingThreatScoreAt(enemy, option.x, option.y);
      const opportunityRisk = this.getOpportunityRiskForMove(enemy, option.x, option.y);
      const dangerPenalty = threat.expectedDamage * 85 + opportunityRisk * 120 + threat.adjacentThreats * 12 + (threat.lethal ? 65000 : 0);
      const score = actionScore + approachScore - moveDistance * 3 - dangerPenalty;

      if (!bestPlan || score > bestPlan.score) {
        bestPlan = { move: option, action, score, threat, opportunityRisk };
      }
    });

    if (bestPlan?.action) return bestPlan;
    if (!nearest) return null;

    const move = this.chooseEnemyMoveToward(enemy, nearest);
    if (!move) return null;

    const enRouteAction = this.evaluateEnemyActionAt(enemy, move.x, move.y);
    return { move, action: enRouteAction, score: bestPlan?.score || 0 };
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

    const finishEnemyAttack = () => {
      if (defender.hp <= 0) {
        defender.hp = 0;

        if (defender.team === "player") {
          this.refreshUnitSprite(defender);
          this.setUnitSpriteFrame(attacker, "idle", attacker.facing || "down");
          this.updateSelectedPanel();
          this.handleAllyUnitDeath(defender, () => {
            this.enemyIndex += 1;
            this.time.delayedCall(550, () => this.runNextEnemy());
          });
          return;
        }

        this.playUnitDeath(defender, () => this.removeUnitSpriteAndData(defender.id));
      } else {
        this.refreshUnitSprite(defender);
        this.setUnitSpriteFrame(defender, "idle", defender.facing || "down");
      }

      this.setUnitSpriteFrame(attacker, "idle", attacker.facing || "down");
      this.updateSelectedPanel();
      this.enemyIndex += 1;
      this.time.delayedCall(550, () => this.runNextEnemy());
    };

    this.playStandardBattleScene(attacker, defender, weapon, sequence, defenderStartHp, finishEnemyAttack);
  },

  startPlayerPhase() {
    this.pendingItemUse = null;
    this.pendingParleyUse = null;
    this.targetTileColor = null;
    this.targetTileStroke = null;
    this.phase = "player";
    this.phaseText.setText("Player Phase");
    this.phaseText.setColor("#c4b5fd");
    this.setObjectiveDisplayVisible(true);
    for (const unit of this.units) {
      if (unit.team === "player") {
        unit.acted = false;
        delete unit.pendingMoveOrigin;
        unit.opportunityThreatIdsAtTurnStart = this.getAdjacentEnemies(unit).map((enemy) => enemy.id);
        this.refreshUnitSprite(unit);
        this.setUnitSpriteFrame(unit, "idle", unit.facing || "down");
      }
    }
    this.helpText.setText(isChapterTwoOrLater(this.currentChapterNumber)
      ? "Player Phase. Capture all four forts. Fences block movement."
      : "Player Phase. Reach the glowing gate tile and choose Escape.");
    this.busy = false;
    if (isChapterTwoOrLater(this.currentChapterNumber)) {
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
            this.spawnShadeAt(spawnTile.x, spawnTile.y, 2);
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
