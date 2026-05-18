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
  CHAPTER_TWO_ALLY_UNITS,
  CHAPTER_TWO_ALLY_OPTIONS,
  CHAPTER_TWO_ALLY_SELECTION_LINES,
  CHAPTER_TWO_OPENING,
  CHAPTER_TWO_TITLE,
} from "../../chapters/chapter2.js";
import {
  CHAPTER_THREE_BATTLE_START_DIALOGUE,
  CHAPTER_THREE_COTTAGE_VISITS,
  createMiloUnit,
} from "../../chapters/chapter3.js";
import {
  CHAPTER_THREE_GAIDEN_BATTLE_START_DIALOGUE,
  CHAPTER_THREE_GAIDEN_ENEMY_SPAWNS,
  CHAPTER_THREE_GAIDEN_MARNIE_ENTRANCE_DIALOGUE,
  CHAPTER_THREE_GAIDEN_PLAYER_SPAWNS,
  CHAPTER_THREE_GAIDEN_ROUND_TWO_REINFORCEMENT_SPAWNS,
  createChapterThreeGaidenHarold,
  createChapterThreeGaidenMage,
  createChapterThreeGaidenMarnie,
  createChapterThreeGaidenSwordThug,
  createChapterThreeGaidenThief,
} from "../../chapters/chapter3Gaiden/index.js";
import {
  buildChapterTwoSaveData,
  CHAPTER_TWO_NUMBER,
  getLevelForChapter,
  getSaveDataChapterNumber,
  isChapterOne,
  isChapterThreeGaiden,
  isChapterTwoOrLater,
  isChapterTwo,
} from "../../chapters/progression.js";
export const chapterSetupMethods = {
  getChapterThreeDeploySlots() {
    if (isChapterThreeGaiden(this.currentChapterNumber)) {
      return [
        ...CHAPTER_THREE_GAIDEN_PLAYER_SPAWNS,
        { x: 1, y: 6, facing: "up" },
        { x: 2, y: 6, facing: "up" },
        { x: 3, y: 6, facing: "up" },
        { x: 4, y: 6, facing: "up" },
        { x: 5, y: 6, facing: "up" },
      ];
    }
    return [
      { x: 0, y: 7 },
      { x: 1, y: 7 },
      { x: 2, y: 7 },
      { x: 0, y: 6 },
      { x: 1, y: 6 },
    ];
  },

  cloneDeployableUnit(unit) {
    return {
      ...unit,
      team: "player",
      hp: unit.hp ?? unit.maxHp ?? 1,
      maxHp: unit.maxHp ?? unit.hp ?? 1,
      sigilPoints: unit.sigilPoints ?? unit.maxSigilPoints ?? 3,
      maxSigilPoints: unit.maxSigilPoints ?? unit.sigilPoints ?? 3,
      acted: false,
      spriteState: "idle",
      move: unit.id === "ambrose" ? 5 : (unit.move ?? 0),
      weapons: (unit.weapons || []).map((weapon) => ({ ...weapon })),
      skills: (unit.skills || []).map((skill) => ({ ...skill })),
      items: (unit.items || []).map((item) => ({ ...item })),
    };
  },

  getChapterThreeDeploymentRoster() {
    const defeated = new Set(this.defeatedAllies || []);
    const byId = new Map();
    const isGaiden = isChapterThreeGaiden(this.currentChapterNumber);

    this.units
      .filter((unit) => unit.team === "player" && unit.hp > 0 && !defeated.has(unit.id))
      .forEach((unit) => byId.set(unit.id, this.cloneDeployableUnit(unit)));

    if (isGaiden) {
      const edwin = this.units.find((unit) => unit.id === "edwin") || UNITS.find((unit) => unit.id === "edwin");
      if (edwin && !byId.has("edwin")) byId.set("edwin", this.cloneDeployableUnit({ ...edwin, team: "player" }));
    } else {
      const leon = this.units.find((unit) => unit.id === "leon") || UNITS.find((unit) => unit.id === "leon");
      if (leon && !defeated.has("leon")) byId.set("leon", this.cloneDeployableUnit({ ...leon, team: "player" }));

      CHAPTER_TWO_ALLY_UNITS.forEach((ally) => {
        if (defeated.has(ally.id)) return;
        if (!byId.has(ally.id)) byId.set(ally.id, this.cloneDeployableUnit({ ...ally, team: "player" }));
      });
    }

    this.units
      .filter((unit) => unit.team === "player" && unit.hp > 0 && (unit.spriteSet === "shade" || unit.id === "shade" || unit.id === "shade_leader"))
      .forEach((unit) => byId.set(unit.id, this.cloneDeployableUnit(unit)));

    const order = isGaiden
      ? ["edwin", "leon", "izzy", "heath", "grimmy", "kane", "shade", "shade_leader", "ambrose", "ash", "milo"]
      : ["leon", "izzy", "heath", "grimmy", "kane"];
    return [...byId.values()].sort((a, b) => {
      const aIndex = order.indexOf(a.id);
      const bIndex = order.indexOf(b.id);
      if (aIndex !== -1 || bIndex !== -1) return (aIndex === -1 ? 99 : aIndex) - (bIndex === -1 ? 99 : bIndex);
      return (a.name || "").localeCompare(b.name || "");
    });
  },

  beginChapterThreeDeployment(onComplete = null) {
    if (this.chapterThreeDeploymentDone) {
      if (typeof onComplete === "function") onComplete();
      return;
    }
    this.chapterThreeDeploymentDone = true;
    this.chapterThreeDeploymentRoster = this.getChapterThreeDeploymentRoster();
    this.chapterThreeSelectedDeployIds = new Set();
    this.pendingChapterThreeDeploymentComplete = onComplete;
    this.busy = true;
    this.showChapterThreeDeploymentScreen();
  },

  getDeploymentLimitForCurrentChapter() {
    return isChapterThreeGaiden(this.currentChapterNumber) ? 8 : 5;
  },

  getDeploymentChapterLabel() {
    return isChapterThreeGaiden(this.currentChapterNumber) ? "Chapter 3: Gaiden" : "Tipen Whippet";
  },

  canConfirmDeployment(selectedCount, deployLimit) {
    if (isChapterThreeGaiden(this.currentChapterNumber)) return selectedCount >= 1 && selectedCount <= deployLimit;
    return selectedCount === deployLimit && deployLimit > 0;
  },

  getDeploymentInventorySummary(unit) {
    const inventory = [
      ...(unit.weapons || []).map((weapon) => weapon.name),
      ...(unit.items || []).map((item) => item.name),
    ].filter(Boolean);
    if (inventory.length === 0) return "Inventory: none";
    const shown = inventory.slice(0, 3).join(", ");
    return inventory.length > 3 ? `Inventory: ${shown}, +${inventory.length - 3}` : `Inventory: ${shown}`;
  },

  getDeploymentStatSummary(unit) {
    return `HP ${unit.hp || unit.maxHp || 0}/${unit.maxHp || unit.hp || 0}  STR ${unit.str || 0}  MAG ${unit.mag || 0}  DEF ${unit.def || 0}  RES ${unit.res || 0}  SPD ${unit.spd || 0}  LCK ${unit.luck || 0}  MOV ${unit.move || 0}`;
  },

  showChapterThreeDeploymentScreen() {
    if (this.chapterThreeDeploymentContainer) this.chapterThreeDeploymentContainer.destroy(true);

    const roster = this.chapterThreeDeploymentRoster || [];
    const maxDeploy = this.getDeploymentLimitForCurrentChapter();
    const deployLimit = Math.min(maxDeploy, roster.length);
    const selected = this.chapterThreeSelectedDeployIds || new Set();
    const canConfirm = this.canConfirmDeployment(selected.size, deployLimit);
    const container = this.add.container(0, 0).setDepth(23000);
    const dim = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.72).setInteractive();
    const panel = createBannerPanel(this, GAME_WIDTH / 2, GAME_HEIGHT / 2, 840, 500, { innerInset: 16 });
    const titleText = isChapterThreeGaiden(this.currentChapterNumber)
      ? `Deploy Up To ${deployLimit} Units`
      : `Deploy ${deployLimit} Unit${deployLimit === 1 ? "" : "s"}`;
    const title = this.add.text(GAME_WIDTH / 2, 42, titleText, {
      fontSize: "30px",
      fontStyle: "bold",
      color: "#f7ecd3",
      stroke: "#0b0811",
      strokeThickness: 4,
    }).setOrigin(0.5);
    const subtitle = this.add.text(GAME_WIDTH / 2, 80, `${selected.size} / ${deployLimit} selected`, {
      fontSize: "17px",
      color: canConfirm ? "#86efac" : "#d8c4f0",
    }).setOrigin(0.5);

    container.add([dim, panel.container, title, subtitle]);

    roster.forEach((unit, index) => {
      const isSelected = selected.has(unit.id);
      const col = index % 3;
      const row = Math.floor(index / 3);
      const x = GAME_WIDTH / 2 - 260 + col * 260;
      const y = 142 + row * 82;
      const bg = this.add.rectangle(x, y, 238, 70, isSelected ? 0x315f3c : 0x1e1030, isSelected ? 0.98 : 0.68);
      bg.setStrokeStyle(2, isSelected ? 0x86efac : 0x70558c);
      bg.setInteractive({ useHandCursor: true });
      bg.on("pointerdown", () => this.toggleChapterThreeDeploymentUnit(unit.id));
      const name = this.add.text(x - 104, y - 28, `${unit.name || unit.id}  Lv ${unit.level || 1}`, {
        fontSize: "15px",
        fontStyle: "bold",
        color: isSelected ? "#f7ecd3" : "#8c7a9f",
      });
      const details = this.add.text(x - 104, y - 6, this.getDeploymentStatSummary(unit), {
        fontSize: "9px",
        color: isSelected ? "#d8c4f0" : "#6b5c78",
        wordWrap: { width: 210 },
      });
      const inventory = this.add.text(x - 104, y + 16, this.getDeploymentInventorySummary(unit), {
        fontSize: "9px",
        color: isSelected ? "#eadff7" : "#6b5c78",
        wordWrap: { width: 210 },
      });
      const state = this.add.text(x + 106, y - 28, isSelected ? "Selected" : "", {
        fontSize: "11px",
        fontStyle: "bold",
        color: "#86efac",
      }).setOrigin(1, 0);
      container.add([bg, name, details, inventory, state]);
    });

    if (canConfirm) {
      const prompt = this.add.text(GAME_WIDTH / 2, 436, "Deploy selected units?", {
        fontSize: "16px",
        color: "#eadff7",
      }).setOrigin(0.5);
      const yes = createBannerButton(this, GAME_WIDTH / 2 - 82, 486, 130, 36, "Yes", () => this.confirmChapterThreeDeployment(), "15px");
      const no = createBannerButton(this, GAME_WIDTH / 2 + 82, 486, 130, 36, "No", () => {
        this.chapterThreeSelectedDeployIds = new Set();
        this.showChapterThreeDeploymentScreen();
      }, "15px");
      container.add([prompt, yes.container, no.container]);
    } else if (isChapterThreeGaiden(this.currentChapterNumber)) {
      const prompt = this.add.text(GAME_WIDTH / 2, 466, "Select at least 1 unit to start.", {
        fontSize: "15px",
        color: "#f4d7d7",
      }).setOrigin(0.5);
      container.add(prompt);
    }

    this.chapterThreeDeploymentContainer = container;
    this.uiLayer.add(container);
    this.helpText.setText(`Choose units to deploy for ${this.getDeploymentChapterLabel()}.`);
  },

  toggleChapterThreeDeploymentUnit(unitId) {
    const selected = this.chapterThreeSelectedDeployIds || new Set();
    const deployLimit = Math.min(this.getDeploymentLimitForCurrentChapter(), (this.chapterThreeDeploymentRoster || []).length);
    if (selected.has(unitId)) selected.delete(unitId);
    else if (selected.size < deployLimit) selected.add(unitId);
    this.chapterThreeSelectedDeployIds = selected;
    this.showChapterThreeDeploymentScreen();
  },

  confirmChapterThreeDeployment() {
    const selectedIds = [...(this.chapterThreeSelectedDeployIds || new Set())];
    const deployLimit = Math.min(this.getDeploymentLimitForCurrentChapter(), (this.chapterThreeDeploymentRoster || []).length);
    if (!this.canConfirmDeployment(selectedIds.length, deployLimit)) return;
    const slots = this.getChapterThreeDeploySlots();
    const roster = this.chapterThreeDeploymentRoster || [];
    const selectedUnits = selectedIds
      .map((id, index) => {
        const source = roster.find((unit) => unit.id === id);
        if (!source) return null;
        return {
          ...this.cloneDeployableUnit(source),
          x: slots[index].x,
          y: slots[index].y,
          facing: slots[index].facing || "up",
        };
      })
      .filter(Boolean);

    const selectedSet = new Set(selectedIds);
    this.chapterThreeReserveUnits = roster
      .filter((unit) => !selectedSet.has(unit.id))
      .map((unit) => this.cloneDeployableUnit(unit));
    this.units = this.units.filter((unit) => unit.team !== "player");
    this.units.unshift(...selectedUnits);
    this.selectedUnitId = null;
    this.moveTiles = [];
    this.targetTiles = [];
    this.drawUnits();

    if (this.chapterThreeDeploymentContainer) {
      this.chapterThreeDeploymentContainer.destroy(true);
      this.chapterThreeDeploymentContainer = null;
    }

    const onComplete = this.pendingChapterThreeDeploymentComplete;
    this.pendingChapterThreeDeploymentComplete = null;
    this.busy = false;
    if (typeof onComplete === "function") onComplete();
  },

  setOpeningDialogueText(text) {
    const lineText = text || "";
    const longLine = lineText.length > 150;
    this.dialogueText.setFontSize(longLine ? "16px" : "18px");
    this.dialogueText.setLineSpacing(longLine ? 4 : 6);
    this.dialogueText.setWordWrapWidth(790, true);
    this.dialogueText.setText(lineText);
  },

  getChapterTwoFortTiles() {
    const forts = [];
    for (let y = 0; y < this.mapRows; y += 1) {
      for (let x = 0; x < this.mapCols; x += 1) {
        if (this.map[y]?.[x] === "fort") forts.push({ x, y });
      }
    }
    return forts;
  },

  getUpperRightChapterTwoFortTile(forts = null) {
    const fortTiles = forts || this.getChapterTwoFortTiles();
    return fortTiles.reduce((best, tile) => {
      if (!best) return tile;
      if (tile.y < best.y) return tile;
      if (tile.y === best.y && tile.x > best.x) return tile;
      return best;
    }, null);
  },

  showChapterTwoSetupDialogue({ speaker, portrait, text, onContinue }) {
    if (this.chapterSetupDialogueContainer) this.chapterSetupDialogueContainer.destroy(true);

    const container = this.add.container(0, 0).setDepth(10000);
    const blocker = this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.18)
      .setOrigin(0)
      .setInteractive();
    const panel = createBannerPanel(this, GAME_WIDTH / 2, GAME_HEIGHT - 96, 820, 156, { innerInset: 14 });
    const portraitFrame = this.add.rectangle(120, GAME_HEIGHT - 100, 100, 112, 0x24123a, 1);
    portraitFrame.setStrokeStyle(2, 0xe4d0a8);

    const portraitImage = this.add.image(120, GAME_HEIGHT - 100, portrait || "edwinPortrait").setDisplaySize(82, 98);
    portraitImage.setVisible(!!portrait && this.textures.exists(portrait));
    const portraitFallback = this.add.text(120, GAME_HEIGHT - 100, speaker || "", {
      fontSize: "14px",
      color: "#f7ecd3",
      align: "center",
      wordWrap: { width: 82 },
    }).setOrigin(0.5).setVisible(!portraitImage.visible);

    const speakerText = this.add.text(184, GAME_HEIGHT - 154, speaker || "", {
      fontSize: "20px",
      fontStyle: "bold",
      color: "#f7ecd3",
      stroke: "#0b0811",
      strokeThickness: 3,
    });
    const bodyText = this.add.text(184, GAME_HEIGHT - 124, text || "", {
      fontSize: text?.length > 135 ? "15px" : "17px",
      color: "#eadff7",
      lineSpacing: 4,
      wordWrap: { width: 600 },
    });
    const continueButton = createBannerButton(this, GAME_WIDTH - 168, GAME_HEIGHT - 58, 132, 32, "Continue", () => {
      this.closeChapterTwoSetupDialogue();
      if (typeof onContinue === "function") onContinue();
    }, "14px");

    blocker.on("pointerdown", () => {
      this.closeChapterTwoSetupDialogue();
      if (typeof onContinue === "function") onContinue();
    });

    container.add([
      blocker,
      panel.container,
      portraitFrame,
      portraitImage,
      portraitFallback,
      speakerText,
      bodyText,
      continueButton.container,
    ]);
    this.chapterSetupDialogueContainer = container;
    this.uiLayer.add(container);
  },

  closeChapterTwoSetupDialogue() {
    if (!this.chapterSetupDialogueContainer) return;
    this.chapterSetupDialogueContainer.destroy(true);
    this.chapterSetupDialogueContainer = null;
  },

  beginChapterThreeBattleStartDialogue(onComplete = null) {
    if (this.chapterThreeBattleStartDialogueShown) {
      if (typeof onComplete === "function") onComplete();
      return;
    }
    this.chapterThreeBattleStartDialogueShown = true;
    this.busy = true;
    let index = 0;
    const showNext = () => {
      const line = CHAPTER_THREE_BATTLE_START_DIALOGUE[index];
      if (!line) {
        this.busy = false;
        if (typeof onComplete === "function") onComplete();
        return;
      }
      index += 1;
      this.showChapterTwoSetupDialogue({
        speaker: line.speaker,
        portrait: line.portrait,
        text: line.text,
        onContinue: showNext,
      });
    };
    showNext();
  },

  spawnChapterThreeGaidenUnit(unit) {
    if (!unit || !this.isInBounds(unit.x, unit.y) || this.getUnitAt(unit.x, unit.y)) return false;
    this.units.push(unit);
    const sprite = this.createUnitSprite(unit);
    this.unitSprites[unit.id] = sprite;
    this.unitLayer.add(sprite.container);
    this.refreshUnitSprite(unit);
    this.setUnitSpriteFrame(unit, "idle", unit.facing || "down");
    return true;
  },

  getChapterThreeGaidenSafeSpawnTile(preferred) {
    if (!preferred || !this.isInBounds(preferred.x, preferred.y)) return null;
    const isSafe = (x, y) => {
      if (!this.isInBounds(x, y) || this.getUnitAt(x, y) || !this.isWalkable(x, y)) return false;
      const terrain = this.getTerrainAt(x, y);
      return terrain !== "container" && terrain !== "crates" && terrain !== "machinery";
    };
    if (isSafe(preferred.x, preferred.y)) return { ...preferred };

    for (let radius = 1; radius <= 3; radius += 1) {
      for (let dy = -radius; dy <= radius; dy += 1) {
        for (let dx = -radius; dx <= radius; dx += 1) {
          if (Math.abs(dx) + Math.abs(dy) !== radius) continue;
          const x = preferred.x + dx;
          const y = preferred.y + dy;
          if (isSafe(x, y)) return { ...preferred, x, y };
        }
      }
    }
    return null;
  },

  spawnChapterThreeGaidenStartEnemies(includeHarold = false) {
    CHAPTER_THREE_GAIDEN_ENEMY_SPAWNS.forEach((spawn, index) => {
      if (spawn.kind === "harold" && !includeHarold) return;
      let unit = null;
      if (spawn.kind === "harold") {
        unit = createChapterThreeGaidenHarold(spawn);
      } else if (spawn.kind === "mage") {
        unit = createChapterThreeGaidenMage(`chapter3_gaiden_mage_${index}`, spawn);
      } else {
        unit = createChapterThreeGaidenSwordThug(`chapter3_gaiden_sword_thug_${index}`, spawn);
      }
      this.spawnChapterThreeGaidenUnit(unit);
    });
  },

  spawnChapterThreeGaidenRoundTwoReinforcements(onComplete = null) {
    if (!isChapterThreeGaiden(this.currentChapterNumber) || this.chapterThreeGaidenRoundTwoReinforcementsSpawned) {
      if (typeof onComplete === "function") onComplete();
      return;
    }

    this.chapterThreeGaidenRoundTwoReinforcementsSpawned = true;
    this.busy = true;

    CHAPTER_THREE_GAIDEN_ROUND_TWO_REINFORCEMENT_SPAWNS.forEach((spawn, index) => {
      const tile = this.getChapterThreeGaidenSafeSpawnTile(spawn);
      if (!tile) return;
      const placement = { ...spawn, ...tile };
      const unit = spawn.kind === "marnie"
        ? createChapterThreeGaidenMarnie(placement)
        : createChapterThreeGaidenThief(`chapter3_gaiden_thief_${index}`, placement);
      this.spawnChapterThreeGaidenUnit(unit);
    });

    this.showChapterTwoSetupDialogue({
      ...CHAPTER_THREE_GAIDEN_MARNIE_ENTRANCE_DIALOGUE,
      onContinue: () => {
        this.helpText.setText("Marnie and the thieves enter the warehouse.");
        if (typeof onComplete === "function") onComplete();
      },
    });
  },

  beginChapterThreeGaidenBattleStartEvent(onComplete = null) {
    if (!isChapterThreeGaiden(this.currentChapterNumber) || this.chapterThreeGaidenBattleStartEventShown) {
      if (typeof onComplete === "function") onComplete();
      return;
    }

    this.chapterThreeGaidenBattleStartEventShown = true;
    this.busy = true;
    this.spawnChapterThreeGaidenStartEnemies(true);

    const line = CHAPTER_THREE_GAIDEN_BATTLE_START_DIALOGUE[0];
    this.showChapterTwoSetupDialogue({
      speaker: line.speaker,
      portrait: line.portrait,
      text: line.text,
      onContinue: () => {
        this.spawnChapterThreeGaidenStartEnemies(false);
        this.helpText.setText("Harold's gang is grabbing what they can.");
        this.busy = false;
        if (typeof onComplete === "function") onComplete();
      },
    });
  },

  canVisitChapterThreeCottage(unit) {
    if (!unit || unit.team !== "player" || unit.acted || unit.hp <= 0) return false;
    if (this.currentChapterNumber !== 3 || this.getTerrainAt(unit.x, unit.y) !== "cottage") return false;
    const visitKey = tileKey(unit.x, unit.y);
    return !!CHAPTER_THREE_COTTAGE_VISITS[visitKey] && !this.visitedChapterThreeCottages?.has(visitKey);
  },

  getFreeAdjacentTiles(x, y, includeDiagonals = true) {
    const offsets = includeDiagonals
      ? [[0, 1], [1, 0], [-1, 0], [0, -1], [1, 1], [-1, 1], [1, -1], [-1, -1]]
      : [[0, 1], [1, 0], [-1, 0], [0, -1]];
    return offsets
      .map(([dx, dy]) => ({ x: x + dx, y: y + dy }))
      .filter((tile) => this.isInBounds(tile.x, tile.y) && this.isWalkable(tile.x, tile.y) && !this.getUnitAt(tile.x, tile.y));
  },

  spawnMiloFromCottage(rescuer) {
    if (!rescuer || this.units.some((unit) => unit.id === "milo" && unit.hp > 0)) return true;
    const spawnTile = this.getFreeAdjacentTiles(rescuer.x, rescuer.y, true)[0];
    if (!spawnTile) return false;
    const milo = createMiloUnit({
      ...spawnTile,
      facing: this.getDirectionToward({ ...spawnTile }, rescuer) || "down",
    });
    this.units.push(milo);
    const sprite = this.createUnitSprite(milo);
    this.unitSprites[milo.id] = sprite;
    this.unitLayer.add(sprite.container);
    this.refreshUnitSprite(milo);
    this.setUnitSpriteFrame(milo, "idle", milo.facing || "down");
    this.showFloatingText(this.boardX + milo.x * TILE_SIZE + TILE_SIZE / 2, this.boardY + milo.y * TILE_SIZE + 8, "Milo joined!", "#7dd3fc");
    return true;
  },

  visitChapterThreeCottage(unitId) {
    const unit = this.units.find((candidate) => candidate.id === unitId);
    if (!this.canVisitChapterThreeCottage(unit)) return;
    const visitKey = tileKey(unit.x, unit.y);
    const visit = CHAPTER_THREE_COTTAGE_VISITS[visitKey];
    this.closeActionMenu();
    this.closeSelectionMenu(false);
    if (visit.recruitMilo && this.units.some((candidate) => candidate.id === "milo" && candidate.hp > 0)) {
      this.helpText.setText("The cottage is empty now.");
      return;
    }
    if (visit.recruitMilo && this.getFreeAdjacentTiles(unit.x, unit.y, true).length === 0) {
      this.helpText.setText("Milo has no room to get out. Free an adjacent tile first.");
      return;
    }
    this.visitedChapterThreeCottages = this.visitedChapterThreeCottages || new Set();
    this.visitedChapterThreeCottages.add(visitKey);
    unit.acted = true;
    this.busy = true;
    this.refreshUnitSprite(unit);
    this.showChapterTwoSetupDialogue({
      speaker: visit.speaker,
      portrait: visit.portrait,
      text: visit.text,
      onContinue: () => {
        let message = `${unit.name} visited the cottage.`;
        if (visit.recruitMilo) {
          const spawned = this.spawnMiloFromCottage(unit);
          message = spawned ? "Milo joined The Bards!" : "Milo has no room to get out.";
        } else if (visit.item) {
          unit.items = [...(unit.items || []), { ...visit.item }];
          message = `${unit.name} received ${visit.item.name}.`;
          this.showFloatingText(this.boardX + unit.x * TILE_SIZE + TILE_SIZE / 2, this.boardY + unit.y * TILE_SIZE + 8, "Item received", "#fde68a");
        }
        this.busy = false;
        this.clearSelection(message);
        this.checkEndOfPlayerPhase();
      },
    });
  },

  beginChapterTwoSetupIfNeeded() {
    if (!isChapterTwo(this.currentChapterNumber) || this.chapterTwoSetupDone) return;
    const leon = this.units.find((u) => u.id === "leon" && u.team === "player");
    if (!leon) return;
    this.chapterTwoSetupDone = true;
    this.busy = true;
    this.helpText.setText("Choose one gang member to support Leon.");
    this.showChapterTwoSetupDialogue({
      speaker: "Edwin",
      portrait: "edwinPortrait",
      text: "Today you'll be up against our resident spec ops, Shade. One guy, so much easier than the underpass. In fact I'll even let you have one of the gang to help out",
      onContinue: () => {
        this.showChoiceMenu(leon, {
          type: "allyPick",
          title: "Pick 1 Ally",
          entries: CHAPTER_TWO_ALLY_OPTIONS
            .map((id) => CHAPTER_TWO_ALLY_UNITS.find((u) => u.id === id))
            .filter(Boolean),
          getLabel: (unit) => unit.name,
          getSummary: (unit) => {
            const weapon = unit.weapons?.[0];
            const minRange = weapon?.minRange ?? weapon?.range ?? "-";
            const maxRange = weapon?.maxRange ?? weapon?.range ?? "-";
            const range = minRange === maxRange ? minRange : `${minRange}-${maxRange}`;
            return `${unit.title} | ${weapon?.name || "Unarmed"} | Rng ${range}`;
          },
          onChoose: (unit) => this.completeChapterTwoSetup(unit),
        });
      },
    });
  },

  completeChapterTwoSetup(chosenAlly) {
    if (!chosenAlly) return;
    const allyId = chosenAlly.id;
    const allyLine = CHAPTER_TWO_ALLY_SELECTION_LINES[allyId] || "Let's do this.";
    const alreadyOnMap = this.units.some((u) => u.id === allyId && u.team === "player");
    if (!alreadyOnMap) {
      const spawn = {
        ...chosenAlly,
        team: "player",
        x: 3,
        y: 6,
        facing: chosenAlly.facing || "up",
        acted: false,
        hp: chosenAlly.maxHp || chosenAlly.hp,
        sigilPoints: chosenAlly.maxSigilPoints ?? chosenAlly.sigilPoints ?? 3,
        weapons: (chosenAlly.weapons || []).map((weapon) => ({ ...weapon })),
        skills: (chosenAlly.skills || []).map((skill) => ({ ...skill })),
        items: (chosenAlly.items || []).map((item) => ({ ...item })),
        spriteState: "idle",
      };
      this.units.push(spawn);
      this.drawUnits();
    }
    this.closeSelectionMenu(false);
    this.showChapterTwoSetupDialogue({
      speaker: chosenAlly.name,
      portrait: chosenAlly.portraitKey,
      text: allyLine,
      onContinue: () => {
        this.spawnShadeWaveIntro();
      },
    });
  },

  spawnShadeWaveIntro() {
    const forts = this.getChapterTwoFortTiles();
    if (forts.length === 0) return;
    const leaderTile = this.getUpperRightChapterTwoFortTile(forts);
    if (!leaderTile) return;

    const leader = this.spawnShadeAt(leaderTile.x, leaderTile.y, 6, "shade_leader");
    this.helpText.setText("Shade appears on the upper-right fort.");
    this.showChapterTwoSetupDialogue({
      speaker: "Shade",
      portrait: "shadePortrait",
      text: "Trying to outnumber me? Hardly seems fair.",
      onContinue: () => {
        this.playShadeDirectionFlourish([leader], () => {
          const clones = forts
            .filter((tile) => tile.x !== leaderTile.x || tile.y !== leaderTile.y)
            .map((tile, index) => this.spawnShadeAt(tile.x, tile.y, 3, `shade_clone_fort_${index + 1}`, 2))
            .filter(Boolean);
          this.helpText.setText("Shade clones appear on the forts.");
          this.playShadeDirectionFlourish(clones, () => {
            this.helpText.setText("Player Phase. Capture all four forts. Fences block movement.");
            this.busy = false;
          });
        });
      },
    });
  },

  playShadeDirectionFlourish(units, onComplete = null) {
    const shadeUnits = (Array.isArray(units) ? units : [units]).filter(Boolean);
    const directions = ["down", "left", "right", "up", "down", "left", "right", "up"];
    const frameDuration = 70;

    if (shadeUnits.length === 0) {
      if (typeof onComplete === "function") onComplete();
      return;
    }

    directions.forEach((direction, index) => {
      this.time.delayedCall(index * frameDuration, () => {
        shadeUnits.forEach((unit) => {
          if (!unit || unit.hp <= 0) return;
          unit.facing = direction;
          this.setUnitSpriteFrame(unit, "idle", direction);
        });
      });
    });

    this.time.delayedCall(directions.length * frameDuration + 40, () => {
      shadeUnits.forEach((unit) => {
        if (!unit || unit.hp <= 0) return;
        unit.facing = "up";
        this.setUnitSpriteFrame(unit, "idle", "up");
      });
      if (typeof onComplete === "function") onComplete();
    });
  },

  spawnShadeAt(x, y, level = 2, shadeId = null, statLevel = level) {
    if (!this.isInBounds(x, y) || this.getUnitAt(x, y)) return null;
    const thug = UNITS.find((u) => u.id === "thug1");
    if (!thug) return null;
    const id = shadeId || `shade_${Date.now()}_${Math.floor(Math.random() * 9999)}`;
    const scale = Math.max(0.75, statLevel / 4);
    const unit = {
      ...thug,
      id,
      name: "Shade",
      title: "Recon Man",
      className: "Assassin",
      team: "enemy",
      portraitKey: "shadePortrait",
      spriteSet: "shade",
      facing: "down",
      level,
      maxHp: Math.max(6, Math.round((thug.maxHp || 8) * scale)),
      hp: Math.max(6, Math.round((thug.maxHp || 8) * scale)),
      str: Math.max(2, Math.round((thug.str || 3) * scale)),
      def: Math.max(1, Math.round((thug.def || 1) * scale)),
      res: Math.max(0, Math.round((thug.res || 0) * scale)),
      spd: Math.max(3, Math.round((thug.spd || 4) * scale)),
      weapons: [{ name: "Kunai", baseDamage: 3, range: 1, damageType: "physical", stat: "str", hitRate: 100 }],
      x, y, acted: false,
      boss: id === "shade_leader",
    };
    this.units.push(unit);
    this.drawUnits();
    return unit;
  },

  captureFort(unitId) {
    const unit = this.units.find((u) => u.id === unitId);
    if (!unit || unit.team !== "player") return;
    if (this.getTerrainAt(unit.x, unit.y) !== "fort") {
      this.showActionMenu(unit, "Capture can only be used on a fort tile.");
      return;
    }
    const fortKey = tileKey(unit.x, unit.y);
    this.capturedForts = this.capturedForts || new Set();
    this.capturedForts.add(fortKey);
    unit.acted = true;
    this.refreshUnitSprite(unit);
    this.closeActionMenu();
    const capturedCount = this.capturedForts.size;
    this.helpText.setText(`${unit.name} captured a fort (${capturedCount}/4).`);
    if (capturedCount >= 4) {
      this.helpText.setText("All forts captured! Training objective complete.");
      this.phaseText.setText("Victory");
      this.phaseText.setColor("#86efac");
      this.busy = true;
      this.time.delayedCall(650, () => this.startPostBattleScene());
      return;
    }
    this.checkEndOfPlayerPhase();
  }
};
