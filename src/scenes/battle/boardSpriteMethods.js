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
export const boardSpriteMethods = {
  getCurrentBiome() {
    return BIOMES[this.currentBiomeKey] || null;
  },

  isInBounds(x, y) {
    return x >= 0 && y >= 0 && x < this.mapCols && y < this.mapRows;
  },

  getTerrainAt(x, y) {
    if (!this.isInBounds(x, y)) return null;
    return this.map[y][x];
  },

  getTerrainTextureKey(x, y) {
    const terrain = this.getTerrainAt(x, y);
    const biome = this.getCurrentBiome();
    if (!biome) return null;
    const entry = biome.terrainTextures[terrain] || biome.terrainTextures.default;
    return entry ? entry.key : null;
  },

  getEscapeTile() {
    return isChapterOne(this.currentChapterNumber) ? CHAPTER_ONE_ESCAPE_TILE : null;
  },

  isEscapeTile(x, y) {
    const escapeTile = this.getEscapeTile();
    return !!escapeTile && x === escapeTile.x && y === escapeTile.y;
  },

  createEscapeCursor() {
    if (!this.escapeLayer) return;
    this.escapeLayer.removeAll(true);

    const escapeTile = this.getEscapeTile();
    if (!escapeTile || !this.isInBounds(escapeTile.x, escapeTile.y)) return;

    const centerX = this.boardX + escapeTile.x * TILE_SIZE + TILE_SIZE / 2;
    const centerY = this.boardY + escapeTile.y * TILE_SIZE + TILE_SIZE / 2;

    const glow = this.add.rectangle(centerX, centerY, TILE_SIZE - 4, TILE_SIZE - 4, 0x38bdf8, 0.18).setOrigin(0.5);
    glow.setStrokeStyle(4, 0x7dd3fc, 0.98);

    const inner = this.add.rectangle(centerX, centerY, TILE_SIZE - 18, TILE_SIZE - 18, 0x38bdf8, 0.08).setOrigin(0.5);
    inner.setStrokeStyle(2, 0xdbeafe, 0.9);

    const label = this.add.text(centerX, centerY + TILE_SIZE * 0.35, "ESCAPE", {
      fontSize: "9px",
      fontStyle: "bold",
      color: "#dbeafe",
      stroke: "#020617",
      strokeThickness: 3,
    }).setOrigin(0.5);

    this.escapeLayer.add([glow, inner, label]);

    this.tweens.add({
      targets: [glow, inner],
      alpha: { from: 0.28, to: 0.72 },
      duration: 760,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });
  },

  getAdjacentEnemies(unit) {
    if (!unit) return [];
    return this.units.filter((other) => (
      other &&
      other.team !== unit.team &&
      other.hp > 0 &&
      distance(unit, other) === 1
    ));
  },

  getAdjacentOpponents(unit) {
    return this.getAdjacentEnemies(unit);
  },

  getOpportunityThreatBeforeMove(unit, targetX, targetY) {
    if (!unit) return null;

    const turnStartThreatIds = new Set(unit.opportunityThreatIdsAtTurnStart || []);
    if (turnStartThreatIds.size === 0) return null;

    const oldPosition = { x: unit.x, y: unit.y };

    return this.units.find((opponent) => {
      if (!opponent || opponent.team === unit.team || opponent.hp <= 0) return false;
      if (!turnStartThreatIds.has(opponent.id)) return false;
      if (Math.abs(opponent.x - oldPosition.x) + Math.abs(opponent.y - oldPosition.y) !== 1) return false;
      const newDistance = Math.abs(opponent.x - targetX) + Math.abs(opponent.y - targetY);
      if (newDistance <= 1) return false;
      return !!getWeaponForTarget(opponent, unit);
    }) || null;
  },

  resolveOpportunityAttack(attacker, defender, onComplete) {
    if (!attacker || !defender || defender.hp <= 0) {
      if (typeof onComplete === "function") onComplete();
      return;
    }

    const weapon = getWeaponForTarget(attacker, defender) || getDefaultWeapon(attacker);
    if (!weapon) {
      if (typeof onComplete === "function") onComplete();
      return;
    }

    this.helpText.setText(`${attacker.name} makes an opportunity attack!`);
    this.faceUnitToward(attacker, defender);
    this.faceUnitToward(defender, attacker);
    this.playUnitState(attacker, this.getAttackAnimationState(attacker, weapon), OPPORTUNITY_ATTACK_PAUSE);

    const hit = Phaser.Math.Between(1, 100) <= OPPORTUNITY_ATTACK_HIT_RATE;
    const damage = hit ? this.calculateDamage(attacker, defender, weapon) : 0;
    const defenderWasAlive = defender.hp > 0;

    this.time.delayedCall(220, () => {
      this.showFloatingText(
        this.boardX + defender.x * TILE_SIZE + TILE_SIZE / 2,
        this.boardY + defender.y * TILE_SIZE + 8,
        hit ? `OPPORTUNITY -${damage}` : "OPPORTUNITY MISS",
        hit ? "#fca5a5" : "#fef3c7"
      );

      if (hit) {
        defender.hp = Math.max(0, defender.hp - damage);
        this.playUnitHurt(defender, 360);
        this.refreshUnitSprite(defender);
        this.updateSelectedPanel();
      }
    });

    this.time.delayedCall(OPPORTUNITY_ATTACK_PAUSE, () => {
      const didKill = defenderWasAlive && defender.hp <= 0;

      if (didKill && attacker.team === "player" && defender.team === "enemy") {
        const xpGain = this.calculateXpGain(attacker, defender, true);
        if (xpGain > 0) this.awardXp(attacker, xpGain);
      }

      const continueAfterLevelUp = () => {
        if (defender.hp <= 0) {
          this.handleOpportunityDefeat(defender, onComplete);
          return;
        }

        if (typeof onComplete === "function") onComplete();
      };

      if (this.hasPendingLevelUps()) {
        this.runAfterLevelUps(continueAfterLevelUp);
        return;
      }

      continueAfterLevelUp();
    });
  },

  handleOpportunityDefeat(unit, onComplete = null) {
    if (!unit) {
      if (typeof onComplete === "function") onComplete();
      return;
    }

    unit.hp = 0;

    if (unit.team === "player") {
      this.handleAllyUnitDeath(unit, onComplete);
      return;
    }

    if (unit.id === "falan") {
      this.handleFalanDefeat(unit, onComplete);
      return;
    }

    this.playUnitDeath(unit, () => {
      this.removeUnitSpriteAndData(unit.id);
      if (typeof onComplete === "function") onComplete();
    });
  },

  handleFalanDefeat(falan, onComplete = null) {
    if (!falan) {
      if (typeof onComplete === "function") onComplete();
      return;
    }

    if (falan.deathHandled) {
      if (typeof onComplete === "function") onComplete();
      return;
    }

    falan.deathHandled = true;
    falan.hp = 0;
    this.refreshUnitSprite(falan);

    this.showAllyDeathCutscene(falan, () => {
      this.playUnitDeath(falan, () => {
        this.removeUnitSpriteAndData(falan.id);
        if (typeof onComplete === "function") onComplete();
      });
    });
  },

  escapeUnit(unitId) {
    const unit = this.units.find((candidate) => candidate.id === unitId);
    if (!unit || unit.team !== "player" || unit.acted || unit.hp <= 0) return;

    if (!this.isEscapeTile(unit.x, unit.y)) {
      this.helpText.setText("Only a unit standing on the glowing gate tile can escape.");
      return;
    }

    this.closeActionMenu();
    this.closeSelectionMenu(false);
    delete unit.pendingMoveOrigin;
    unit.acted = true;
    this.refreshUnitSprite(unit);
    this.clearSelection(`${unit.name} escaped through the gate!`);
    this.busy = true;
    this.showFloatingText(
      this.boardX + unit.x * TILE_SIZE + TILE_SIZE / 2,
      this.boardY + unit.y * TILE_SIZE + 8,
      "ESCAPE",
      "#7dd3fc"
    );

    this.time.delayedCall(650, () => this.startPostBattleScene());
  },

  drawBoard() {
    this.tileLayer.removeAll(true);
    for (let row = 0; row < this.mapRows; row += 1) {
      for (let col = 0; col < this.mapCols; col += 1) {
        const type = this.getTerrainAt(col, row);
        const textureKey = this.getTerrainTextureKey(col, row);
        const x = this.boardX + col * TILE_SIZE;
        const y = this.boardY + row * TILE_SIZE;
        if (textureKey && this.textures.exists(textureKey)) {
          const tileImage = this.add.image(x + TILE_SIZE / 2, y + TILE_SIZE / 2, textureKey);
          tileImage.setDisplaySize(TILE_SIZE, TILE_SIZE);
          this.tileLayer.add(tileImage);
        } else {
          const tile = this.add.rectangle(x + TILE_SIZE / 2, y + TILE_SIZE / 2, TILE_SIZE - 2, TILE_SIZE - 2, tileColor(type));
          tile.setStrokeStyle(1, 0x111827);
          this.tileLayer.add(tile);
          const label = this.add.text(x + 6, y + 4, tileLabel(type), { fontSize: "12px", color: "#e5e7eb" });
          this.tileLayer.add(label);
        }
        const border = this.add.rectangle(x + TILE_SIZE / 2, y + TILE_SIZE / 2, TILE_SIZE, TILE_SIZE, 0x000000, 0);
        border.setStrokeStyle(1, 0x0f172a, 0.45);
        this.tileLayer.add(border);
      }
    }
  },

  drawUnits() {
    this.unitLayer.removeAll(true);
    this.unitSprites = {};

    for (const unit of this.units) {
      const sprite = this.createUnitSprite(unit);
      this.unitSprites[unit.id] = sprite;
      this.unitLayer.add(sprite.container);
      this.refreshUnitSprite(unit);
      this.setUnitSpriteFrame(unit, "idle", unit.facing || "down");
    }
  },

  createUnitSprite(unit) {
    const marker = this.add.circle(0, 0, 18, unit.color, 0.22);
    marker.setStrokeStyle(2, 0xffffff);
    const label = this.add.text(0, -10, unit.team === "player" ? unit.name[0] : unit.boss ? "B" : "T", {
      fontSize: "16px",
      fontStyle: "bold",
      color: "#f7ecd3",
    }).setOrigin(0.5);
    const render = this.getUnitSpriteRenderConfig(unit);
    const shadow = this.add.ellipse(render.shadowX || 0, render.shadowY ?? 2, render.shadowWidth || TILE_SIZE * 0.42, render.shadowHeight || TILE_SIZE * 0.12, 0x000000, 0.34).setVisible(false);
    const image = this.add.image(0, 0, "__MISSING").setVisible(false);
    const hpText = this.add.text(0, render.hpY ?? TILE_SIZE * 0.22, "", {
      fontSize: "10px",
      color: "#e5e7eb",
      stroke: "#000000",
      strokeThickness: 3,
    }).setOrigin(0.5, 0);
    const container = this.add.container(0, 0, [marker, label, shadow, image, hpText]);
    return { container, marker, label, shadow, hpText, image };
  },

  refreshUnitSprite(unit) {
    const sprite = this.unitSprites[unit.id];
    if (!sprite) return;
    sprite.container.x = this.boardX + unit.x * TILE_SIZE + TILE_SIZE / 2;
    sprite.container.y = this.boardY + unit.y * TILE_SIZE + TILE_SIZE / 2;
    sprite.hpText.setText(`HP ${unit.hp}`);
    sprite.container.alpha = unit.team === "player" && unit.acted ? 0.55 : 1;
  },

  getUnitSpriteRenderConfig(unit) {
    return { ...(UNIT_SPRITE_RENDER.default || {}), ...(unit ? UNIT_SPRITE_RENDER[unit.spriteSet] || UNIT_SPRITE_RENDER[unit.id] || {} : {}) };
  },

  getIndividualSpriteSet(unit) {
    if (!unit) return null;
    return INDIVIDUAL_UNIT_SPRITE_SETS[unit.spriteSet] || INDIVIDUAL_UNIT_SPRITE_SETS[unit.id] || null;
  },

  getIndividualSpriteEntry(unit, state = "idle", direction = "down", frameIndex = 0) {
    const spriteSet = this.getIndividualSpriteSet(unit);
    if (!spriteSet) return null;
    const resolvedState = spriteSet[state] ? state : "idle";
    if (resolvedState === "death") {
      const deathFrames = spriteSet.death || [];
      return deathFrames[Phaser.Math.Clamp(frameIndex, 0, Math.max(0, deathFrames.length - 1))] || null;
    }
    const directionEntries = spriteSet[resolvedState] || spriteSet.idle;
    const resolvedDirection = CARDINAL_DIRECTIONS.includes(direction) ? direction : "down";
    return directionEntries?.[resolvedDirection] || directionEntries?.down || null;
  },

  getIndividualSpriteEntryCandidates(unit, state = "idle", direction = "down", frameIndex = 0) {
    if (!unit) return [];

    const spriteSetKey = unit.spriteSet || unit.id;
    const resolvedDirection = CARDINAL_DIRECTIONS.includes(direction) ? direction : "down";
    const entries = [];
    const primary = this.getIndividualSpriteEntry(unit, state, resolvedDirection, frameIndex);
    if (primary) entries.push(primary);

    if (state === "death") {
      entries.push(...createDeathSpriteCandidateEntries(spriteSetKey, frameIndex));
    } else {
      entries.push(...createDirectionalSpriteCandidateEntries(spriteSetKey, state, resolvedDirection));
    }

    return uniqueSpriteEntries(entries);
  },

  applyIndividualUnitSprite(unit, textureKey, state = "idle") {
    const sprite = this.unitSprites[unit.id];
    if (!sprite || !textureKey || !this.textures.exists(textureKey)) {
      this.showUnitFallbackSprite(unit);
      return false;
    }
    const texture = this.textures.get(textureKey);
    const source = texture.getSourceImage();
    if (!source?.width || !source?.height) {
      this.showUnitFallbackSprite(unit);
      return false;
    }
    const render = this.getUnitSpriteRenderConfig(unit);
    const desiredHeight = render.height || UNIT_SPRITE_TARGET_SIZE;
    const desiredMaxWidth = render.maxWidth || TILE_SIZE * 0.9;
    let scale = desiredHeight / Math.max(1, source.height);
    if (source.width * scale > desiredMaxWidth) scale = desiredMaxWidth / Math.max(1, source.width);
    const isDeathFrame = state === "death";
    sprite.image.setTexture(textureKey);
    sprite.image.setScale(scale);
    sprite.image.setOrigin(render.originX ?? 0.5, isDeathFrame ? 0.5 : render.originY ?? 1);
    sprite.image.setPosition(render.offsetX || 0, isDeathFrame ? render.deathOffsetY ?? 0 : render.offsetY ?? 0);
    sprite.image.setVisible(true);
    sprite.image.clearTint();
    sprite.shadow.setPosition(render.shadowX || 0, render.shadowY ?? 2);
    sprite.shadow.setSize(render.shadowWidth || TILE_SIZE * 0.42, render.shadowHeight || TILE_SIZE * 0.12);
    sprite.shadow.setVisible(!isDeathFrame);
    sprite.marker.setVisible(false);
    sprite.label.setVisible(false);
    sprite.hpText.setPosition(0, render.hpY ?? TILE_SIZE * 0.22);
    return true;
  },

  showUnitFallbackSprite(unit) {
    const sprite = this.unitSprites[unit.id];
    if (!sprite) return;
    sprite.image.setVisible(false);
    sprite.shadow.setVisible(false);
    sprite.marker.setVisible(true);
    sprite.marker.setFillStyle(unit.color, 1);
    sprite.marker.setAlpha(1);
    sprite.label.setVisible(true);
    sprite.hpText.setPosition(0, 16);
  },

  setUnitSpriteFrame(unit, state = "idle", direction = null) {
    if (!unit) return false;
    const resolvedDirection = direction || unit.facing || "down";
    unit.spriteState = state;

    const candidateGroups = [this.getIndividualSpriteEntryCandidates(unit, state, resolvedDirection, 0)];
    if (state !== "idle") {
      candidateGroups.push(this.getIndividualSpriteEntryCandidates(unit, "idle", resolvedDirection, 0));
      candidateGroups.push(this.getIndividualSpriteEntryCandidates(unit, "idle", "down", 0));
    }

    for (const candidates of candidateGroups) {
      for (const entry of candidates) {
        if (entry?.key && this.textures.exists(entry.key)) {
          return this.applyIndividualUnitSprite(unit, entry.key, state);
        }
      }
    }

    this.showUnitFallbackSprite(unit);
    return false;
  },

  setUnitDeathFrame(unit, frameIndex = 0) {
    if (!unit) return false;
    unit.spriteState = "death";

    for (const entry of this.getIndividualSpriteEntryCandidates(unit, "death", unit.facing || "down", frameIndex)) {
      if (entry?.key && this.textures.exists(entry.key)) {
        return this.applyIndividualUnitSprite(unit, entry.key, "death");
      }
    }

    this.showUnitFallbackSprite(unit);
    return false;
  },

  getAttackAnimationState(unit, weapon = null) {
    if (!unit) return "attack";
    if (weapon?.damageType === "magical") {
      const spriteSet = this.getIndividualSpriteSet(unit);
      const spriteSetKey = unit.spriteSet || unit.id;
      const direction = CARDINAL_DIRECTIONS.includes(unit.facing) ? unit.facing : "down";
      const magicEntries = uniqueSpriteEntries([
        spriteSet?.magic?.[direction],
        spriteSet?.magic?.down,
        ...createDirectionalSpriteCandidateEntries(spriteSetKey, "magic", direction),
      ].filter(Boolean));
      if (magicEntries.some((entry) => entry?.key && this.textures.exists(entry.key))) return "magic";
    }
    return "attack";
  },

  getDirectionFromDelta(dx, dy, fallback = "down") {
    if (Math.abs(dx) > Math.abs(dy)) return dx > 0 ? "right" : "left";
    if (Math.abs(dy) > 0) return dy > 0 ? "down" : "up";
    return fallback;
  },

  getDirectionToward(fromUnit, toUnit) {
    if (!fromUnit || !toUnit) return "down";
    return this.getDirectionFromDelta(toUnit.x - fromUnit.x, toUnit.y - fromUnit.y, fromUnit.facing || "down");
  },

  faceUnitToward(unit, target) {
    if (!unit || !target) return;
    unit.facing = this.getDirectionToward(unit, target);
    this.setUnitSpriteFrame(unit, unit.spriteState || "idle", unit.facing);
  },

  playUnitState(unit, state, duration = 320) {
    if (!unit) return;
    this.setUnitSpriteFrame(unit, state, unit.facing || "down");
    if (state !== "idle" && state !== "death") {
      this.time.delayedCall(duration, () => {
        if (unit.hp > 0) this.setUnitSpriteFrame(unit, "idle", unit.facing || "down");
      });
    }
  },

  playUnitSpinAnimation(unit, duration = 900) {
    if (!unit) return;

    const originalFacing = CARDINAL_DIRECTIONS.includes(unit.facing) ? unit.facing : "down";
    const startIndex = CLOCKWISE_DIRECTIONS.indexOf(originalFacing);
    const spinOrder = startIndex >= 0
      ? [...CLOCKWISE_DIRECTIONS.slice(startIndex), ...CLOCKWISE_DIRECTIONS.slice(0, startIndex)]
      : [originalFacing, ...CLOCKWISE_DIRECTIONS.filter((direction) => direction !== originalFacing)];
    const frameDuration = Math.max(110, Math.floor(duration / Math.max(1, spinOrder.length)));

    spinOrder.forEach((direction, index) => {
      this.time.delayedCall(index * frameDuration, () => {
        if (!unit || unit.hp <= 0) return;
        unit.facing = direction;
        const usedSpinFrame = this.setUnitSpriteFrame(unit, "spin", direction);
        if (!usedSpinFrame) this.setUnitSpriteFrame(unit, "attack", direction);
      });
    });

    this.time.delayedCall(frameDuration * spinOrder.length + 40, () => {
      if (!unit || unit.hp <= 0) return;
      unit.facing = originalFacing;
      this.setUnitSpriteFrame(unit, "idle", originalFacing);
    });
  },

  playSkillTileEffects(unit, skill) {
    if (!unit || !skill) return;

    let effectKey = null;
    if (skill.id === "iceOfAges") effectKey = ICE_OF_AGES_HIT_EFFECT_KEY;
    if (skill.id === "brothersBligh") effectKey = BROTHERS_BLIGH_HIT_EFFECT_KEY;
    if (!effectKey) return;

    this.getSkillHitTilesAt(unit, skill, unit.x, unit.y).forEach((tile, index) => {
      this.time.delayedCall(index * SKILL_TILE_EFFECT_STAGGER, () => this.playTileEffect(tile.x, tile.y, effectKey));
    });
  },

  playBrothersBlighCutin(onComplete = null) {
    const container = this.add.container(0, 0).setDepth(22000).setAlpha(0);
    const dim = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.72);
    dim.setInteractive();

    const panel = createBannerPanel(this, GAME_WIDTH / 2, GAME_HEIGHT / 2, 680, 300, { innerInset: 18 });

    let cutinVisual;
    if (this.textures.exists(BROTHERS_BLIGH_CUTIN_KEY)) {
      cutinVisual = this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 12, BROTHERS_BLIGH_CUTIN_KEY).setOrigin(0.5);
      fitImageToBounds(this, cutinVisual, BROTHERS_BLIGH_CUTIN_KEY, 620, 230, false);
    } else {
      cutinVisual = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 20, "Edwin + Leon", {
        fontSize: "38px",
        fontStyle: "bold",
        color: "#f7ecd3",
        stroke: "#0b0811",
        strokeThickness: 6,
      }).setOrigin(0.5);
    }

    const comboText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 116, "COMBINING ABILITIES", {
      fontSize: "28px",
      fontStyle: "bold",
      color: "#7dd3fc",
      stroke: "#0b0811",
      strokeThickness: 6,
    }).setOrigin(0.5);

    container.add([dim, panel.container, cutinVisual, comboText]);
    this.uiLayer.add(container);

    this.tweens.add({
      targets: container,
      alpha: 1,
      duration: 160,
      ease: "Quad.Out",
      onComplete: () => {
        this.tweens.add({
          targets: comboText,
          alpha: 0.35,
          duration: 120,
          yoyo: true,
          repeat: 3,
        });
        this.time.delayedCall(BROTHERS_BLIGH_CUTIN_HOLD_DURATION, () => {
          this.tweens.add({
            targets: container,
            alpha: 0,
            duration: BROTHERS_BLIGH_CUTIN_FADE_DURATION,
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

  playTileEffect(tileX, tileY, textureKey) {
    const x = this.boardX + tileX * TILE_SIZE + TILE_SIZE / 2;
    const y = this.boardY + tileY * TILE_SIZE + TILE_SIZE / 2;

    let effect;
    if (textureKey && this.textures.exists(textureKey)) {
      effect = this.add.image(x, y, textureKey).setOrigin(0.5);
      const source = this.textures.get(textureKey)?.getSourceImage();
      const maxSize = TILE_SIZE * 0.82;
      if (source?.width && source?.height) {
        const scale = Math.min(maxSize / source.width, maxSize / source.height);
        effect.setScale(scale);
      }
    } else {
      effect = this.add.circle(x, y, TILE_SIZE * 0.26, 0x93c5fd, 0.62);
      effect.setStrokeStyle(2, 0xdbeafe, 0.9);
    }

    effect.setDepth(9997);
    this.overlayLayer.add(effect);

    const isBrothersBligh = textureKey === BROTHERS_BLIGH_HIT_EFFECT_KEY;
    const appearDuration = isBrothersBligh ? BROTHERS_BLIGH_HIT_APPEAR_DURATION : SKILL_TILE_EFFECT_APPEAR_DURATION;
    const holdDuration = isBrothersBligh ? BROTHERS_BLIGH_HIT_HOLD_DURATION : SKILL_TILE_EFFECT_HOLD_DURATION;
    const fadeDuration = isBrothersBligh ? BROTHERS_BLIGH_HIT_FADE_DURATION : SKILL_TILE_EFFECT_FADE_DURATION;
    const startScale = isBrothersBligh ? 0.56 : 0.82;
    const holdScale = isBrothersBligh ? 1.06 : 1;
    const endScale = isBrothersBligh ? 1.1 : SKILL_TILE_EFFECT_END_SCALE;
    const baseScaleX = effect.scaleX || 1;
    const baseScaleY = effect.scaleY || 1;
    effect.setAlpha(0);
    effect.setScale(baseScaleX * startScale, baseScaleY * startScale);

    this.tweens.add({
      targets: effect,
      alpha: 1,
      scaleX: baseScaleX * holdScale,
      scaleY: baseScaleY * holdScale,
      duration: appearDuration,
      ease: isBrothersBligh ? "Expo.Out" : "Back.Out",
      onComplete: () => {
        this.time.delayedCall(holdDuration, () => {
          if (!effect?.active) return;

          this.tweens.add({
            targets: effect,
            alpha: 0,
            scaleX: baseScaleX * endScale,
            scaleY: baseScaleY * endScale,
            duration: fadeDuration,
            ease: "Quad.Out",
            onComplete: () => effect.destroy(),
          });
        });
      },
    });
  },

  playUnitHurt(unit, duration = 360) {
    if (!unit) return;
    const sprite = this.unitSprites[unit.id];
    this.playUnitState(unit, "hurt", duration);
    if (sprite?.image?.visible) {
      sprite.image.setTintFill(0xff6666);
      this.time.delayedCall(Math.floor(duration * 0.65), () => {
        if (sprite.image) sprite.image.clearTint();
      });
    } else if (sprite?.marker) {
      sprite.marker.setFillStyle(0xff4444, 1);
      this.time.delayedCall(Math.floor(duration * 0.65), () => {
        if (sprite.marker) sprite.marker.setFillStyle(unit.color, 1);
      });
    }
  },

  playUnitDeath(unit, onComplete = null) {
    if (!unit) {
      if (onComplete) onComplete();
      return;
    }
    const sprite = this.unitSprites[unit.id];
    if (!sprite) {
      if (onComplete) onComplete();
      return;
    }
    const spriteSet = this.getIndividualSpriteSet(unit);
    const deathFrames = spriteSet?.death || [];
    const hasDeathSprite = deathFrames.some((entry) => entry?.key && this.textures.exists(entry.key));
    if (!hasDeathSprite) {
      this.tweens.add({ targets: sprite.container, alpha: 0, duration: 700, ease: "Quad.Out", onComplete });
      return;
    }
    sprite.container.setScale(1);
    sprite.container.alpha = 1;
    deathFrames.forEach((_, index) => {
      this.time.delayedCall(index * 180, () => this.setUnitDeathFrame(unit, index));
    });
    this.time.delayedCall(deathFrames.length * 180 + 80, () => {
      this.tweens.add({ targets: sprite.container, alpha: 0, duration: 650, ease: "Quad.Out", onComplete });
    });
  },

  removeUnitSpriteAndData(unitId) {
    const sprite = this.unitSprites[unitId];
    if (sprite) {
      sprite.container.destroy();
      delete this.unitSprites[unitId];
    }
    this.units = this.units.filter((unit) => unit.id !== unitId);
  },

  closeSelectionMenu(redraw = true) {
    if (this.selectionMenuContainer) {
      this.selectionMenuContainer.destroy();
    }

    this.selectionMenuContainer = null;
    this.selectionMenuOpen = false;
    this.selectionMenuType = null;
    this.selectionMenuSummaryText = null;

    if (redraw) {
      this.redrawSelection();
    }
  },

  closeActionMenu() {
    if (this.actionMenuContainer) this.actionMenuContainer.destroy();
    this.actionMenuContainer = null;
    this.actionMenuOpen = false;
    this.actionMenuUnitId = null;
    this.closeSelectionMenu(false);
  },

  showActionMenu(unit, message = null) {
    if (!unit || unit.team !== "player" || unit.acted || unit.hp <= 0) return;
    this.closeActionMenu();
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
    const actions = [
      { label: "Attack", handler: () => this.chooseActionAttack(unit.id) },
      { label: "Skill", handler: () => this.chooseActionSkill(unit.id) },
      { label: "Item", handler: () => this.chooseActionItem(unit.id) },
      { label: "Wait", handler: () => this.waitUnit(unit.id) },
    ];

    if (this.isEscapeTile(unit.x, unit.y)) {
      actions.unshift({ label: "Escape", handler: () => this.escapeUnit(unit.id) });
    }
    if (isChapterTwoOrLater(this.currentChapterNumber) && this.getTerrainAt(unit.x, unit.y) === "fort") {
      actions.unshift({ label: "Capture", handler: () => this.captureFort(unit.id) });
    }

    const menuWidth = 152;
    const menuHeight = 52 + actions.length * 40 + 36;
    const x = Phaser.Math.Clamp(centerX + TILE_SIZE * 0.95, menuWidth / 2 + 8, GAME_WIDTH - menuWidth / 2 - 8);
    const y = Phaser.Math.Clamp(centerY - 8, menuHeight / 2 + 8, GAME_HEIGHT - menuHeight / 2 - 8);
    const container = this.add.container(x, y).setDepth(9998);
    const panel = createBannerPanel(this, 0, 0, menuWidth, menuHeight, { innerInset: 12 });
    const title = this.add.text(0, -menuHeight / 2 + 26, unit.name, {
      fontSize: "16px",
      fontStyle: "bold",
      color: "#f7ecd3",
      stroke: "#0b0811",
      strokeThickness: 3,
    }).setOrigin(0.5);

    container.add([panel.container, title]);

    actions.forEach((action, index) => {
      const button = createBannerButton(this, 0, -menuHeight / 2 + 66 + index * 40, menuWidth - 20, 32, action.label, () => action.handler(), "16px");
      container.add(button.container);
    });

    this.actionMenuContainer = container;
    this.actionMenuOpen = true;
    this.actionMenuUnitId = unit.id;
    this.uiLayer.add(container);

    const escapeHint = this.isEscapeTile(unit.x, unit.y) ? " Escape is available." : "";
    const cancelHint = unit.pendingMoveOrigin ? " Space cancels the move." : " Space goes back.";
    this.helpText.setText(message || `${unit.name} is ready. Choose an action.${escapeHint}${cancelHint}`);
  }
};
