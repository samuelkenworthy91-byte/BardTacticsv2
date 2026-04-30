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
export const chapterSetupMethods = {
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

  beginChapterTwoSetupIfNeeded() {
    if (!isChapterTwoOrLater(this.currentChapterNumber) || this.chapterTwoSetupDone) return;
    const leon = this.units.find((u) => u.id === "leon" && u.team === "player");
    if (!leon) return;
    this.chapterTwoSetupDone = true;
    this.busy = true;
    this.helpText.setText("Edwin: Right you're up against our resident recon man Shade. Just capture all four forts. Easy right, Shade's only one guy, I'll even let you take another member of the gang with you!");
    this.showChoiceMenu(leon, {
      type: "allyPick",
      title: "Pick 1 Ally",
      entries: CHAPTER_TWO_ALLY_OPTIONS
        .map((id) => this.units.find((u) => u.id === id) || UNITS.find((u) => u.id === id))
        .filter(Boolean),
      getLabel: (unit) => unit.name,
      getSummary: (unit) => `${unit.name} • ${unit.className}\nHP ${unit.maxHp} STR ${unit.str} MAG ${unit.mag} DEF ${unit.def} RES ${unit.res} SPD ${unit.spd}`,
      onChoose: (unit) => this.completeChapterTwoSetup(unit),
    });
  },

  completeChapterTwoSetup(chosenAlly) {
    if (!chosenAlly) return;
    const allyId = chosenAlly.id;
    const allyLine = CHAPTER_TWO_ALLY_SELECTION_LINES[allyId] || "Let's do this.";
    const alreadyOnMap = this.units.some((u) => u.id === allyId && u.team === "player");
    if (!alreadyOnMap) {
      const spawn = { ...chosenAlly, team: "player", x: 3, y: 6, acted: false, hp: chosenAlly.maxHp || chosenAlly.hp };
      this.units.push(spawn);
      this.drawUnits();
    }
    this.closeSelectionMenu(false);
    this.helpText.setText(`${chosenAlly.name}: ${allyLine}`);
    this.time.delayedCall(900, () => {
      this.spawnShadeWaveIntro();
      this.busy = false;
    });
  },

  spawnShadeWaveIntro() {
    const forts = this.getChapterTwoFortTiles();
    if (forts.length === 0) return;
    const leaderTile = forts[0];
    this.spawnShadeAt(leaderTile.x, leaderTile.y, 4, "shade_leader");
    this.helpText.setText("Shade: well I can't be outnumbered now can I?");
    this.time.delayedCall(800, () => {
      forts.forEach((tile, index) => this.spawnShadeAt(tile.x, tile.y, 2, `shade_clone_fort_${index + 1}`));
      this.spawnShadeAt(2, 4, 2, "shade_clone_low_1");
      this.spawnShadeAt(5, 5, 2, "shade_clone_low_2");
      this.helpText.setText("Shade: better");
    });
  },

  spawnShadeAt(x, y, level = 2, shadeId = null) {
    if (!this.isInBounds(x, y) || this.getUnitAt(x, y)) return;
    const thug = UNITS.find((u) => u.id === "thug1");
    if (!thug) return;
    const id = shadeId || `shade_${Date.now()}_${Math.floor(Math.random() * 9999)}`;
    const scale = level >= 4 ? 1 : 0.75;
    const unit = {
      ...thug,
      id,
      name: "Shade",
      title: level >= 4 ? "Recon Man" : "Shade Clone",
      className: "Assassin",
      team: "enemy",
      level,
      maxHp: Math.max(6, Math.round((thug.maxHp || 8) * scale)),
      hp: Math.max(6, Math.round((thug.maxHp || 8) * scale)),
      str: Math.max(2, Math.round((thug.str || 3) * scale)),
      def: Math.max(1, Math.round((thug.def || 1) * scale)),
      res: Math.max(0, Math.round((thug.res || 0) * scale)),
      spd: Math.max(3, Math.round((thug.spd || 4) * scale)),
      x, y, acted: false,
    };
    this.units.push(unit);
    this.drawUnits();
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
      return;
    }
    this.checkEndOfPlayerPhase();
  }
};
