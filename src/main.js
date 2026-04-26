import Phaser from "phaser";
 
const GAME_WIDTH = 960;
const GAME_HEIGHT = 540;
 
const TILE_SIZE = 48;
const MAP_COLS = 8;
const MAP_ROWS = 8;
 
const MAP = [
  ["street", "cover", "street", "street", "street", "street", "gate", "street"],
  ["street", "street", "cover", "street", "street", "cover", "street", "street"],
  ["street", "wall", "wall", "street", "street", "street", "street", "street"],
  ["street", "street", "street", "cover", "street", "street", "street", "street"],
  ["street", "street", "cover", "street", "street", "wall", "wall", "street"],
  ["street", "street", "street", "street", "cover", "street", "street", "street"],
  ["street", "cover", "street", "street", "street", "street", "street", "street"],
  ["street", "street", "street", "street", "street", "street", "street", "street"],
];
 
 
const BIOMES = {
  city: {
    terrainTextures: {
      street: { key: "cityStreetTile", path: "/tiles/city/street.png" },
      cover: { key: "cityCoverTile", path: "/tiles/city/cover.png" },
      wall: { key: "cityWallTile", path: "/tiles/city/wall.png" },
      gate: { key: "cityGateTile", path: "/tiles/city/gate.png" },
      default: { key: "cityStreetTile", path: "/tiles/city/street.png" },
    },
  },
};
 
const CHAPTER_OPENING = [
  {
    type: "title",
    chapter: "Prologue",
    subtitle: "Underpass",
    tag: "Four Years Gone",
  },
  {
    type: "scene",
    sceneName: "Leon's House",
    background: "/scenes/prologue.jpg",
    lines: [
      { speaker: "Leon", portrait: "leonPortrait", text: "They left already...?" },
      { speaker: "Letter", portrait: null, text: "Leon, happy birthday. There's been a sighting of Edwin near Poole." },
      { speaker: "Letter", portrait: null, text: "We'll be back probably this weekend. Love, Mum and Dad." },
      { speaker: "Leon", portrait: "leonPortrait", text: "...Still looking for him." },
      { speaker: "Leon", portrait: "leonPortrait", text: "Four years, and they still won't stop. Not even today." },
    ],
  },
  {
    type: "scene",
    sceneName: "Walk to School",
    background: "/scenes/prologue.jpg",
    lines: [
      { speaker: "Kayley", portrait: "kayleyPortrait", text: "There he is. Birthday boy finally decided to show up." },
      { speaker: "Rich", portrait: "richPortrait", text: "You're late enough that we were about to eat your presents ourselves." },
      { speaker: "Leon", portrait: "leonPortrait", text: "You didn't get me presents." },
      { speaker: "Kayley", portrait: "kayleyPortrait", text: "Exactly. We saved money." },
      { speaker: "Rich", portrait: "richPortrait", text: "Come on. If we cut through the underpass, we'll still make it." },
    ],
  },
  {
    type: "scene",
    sceneName: "Underpass",
    background: "/scenes/prologue.jpg",
    lines: [
      { speaker: "Rich", portrait: "richPortrait", text: "...Leon." },
      { speaker: "Kayley", portrait: "kayleyPortrait", text: "Those aren't students." },
      { speaker: "Falan", portrait: "falanPortrait", text: "There you are." },
      { speaker: "Leon", portrait: "leonPortrait", text: "Who are you people?" },
      { speaker: "Falan", portrait: "falanPortrait", text: "Doesn't matter. You're coming with us." },
      { speaker: "Kayley", portrait: "kayleyPortrait", text: "No chance. Back off." },
      { speaker: "Rich", portrait: "richPortrait", text: "Leon, get behind us." },
      {
        type: "impact",
        attacker: "Thug",
        attackerPortrait: "thugPortrait",
        defender: "Rich",
        defenderPortrait: "richPortrait",
        text: "A thug lunges. Rich falls first.",
      },
      {
        type: "impact",
        attacker: "Thug",
        attackerPortrait: "thugPortrait",
        defender: "Kayley",
        defenderPortrait: "kayleyPortrait",
        text: "Kayley tries to pull Leon away, but another attacker cuts her down.",
      },
      { speaker: "Leon", portrait: "leonPortrait", text: "Kayley! Rich! No—!" },
      {
        type: "impact",
        attacker: "Edwin",
        attackerPortrait: "edwinPortrait",
        defender: "Thug",
        defenderPortrait: "thugPortrait",
        text: "A blue-white flash cuts across the underpass. Edwin strikes one attacker down.",
      },
      { speaker: "Edwin", portrait: "edwinPortrait", text: "Talk later. If you want answers, survive." },
      { speaker: "Leon", portrait: "leonPortrait", text: "...Edwin?" },
      { speaker: "Falan", portrait: "falanPortrait", text: "So the ghost brother finally crawls home." },
      { speaker: "Edwin", portrait: "edwinPortrait", text: "Stay behind me, Leon." },
    ],
  },
];
 
const UNITS = [
  {
    id: "edwin",
    name: "Edwin",
    title: "Iceblade",
    level: 5,
    xp: 0,
    xpRate: 0.65,
    growths: {
      hp: 50,
      str: 35,
      mag: 60,
      def: 75,
      res: 30,
      spd: 65,
    },
    team: "player",
    className: "Spellsword",
    portraitKey: "edwinPortrait",
    x: 2,
    y: 6,
    move: 5,
    hp: 24,
    maxHp: 24,
    str: 8,
    mag: 10,
    def: 6,
    res: 7,
    spd: 8,
    weapons: [
      {
        name: "Iceblade",
        baseDamage: 4,
        range: 1,
        damageType: "physical",
        stat: "str",
        hitRate: 100,
      },
      {
        name: "Ice Sigil",
        baseDamage: 5,
        range: 2,
        damageType: "magical",
        stat: "mag",
        hitRate: 100,
      },
    ],
    acted: false,
    color: 0x60a5fa,
  },
  {
    id: "leon",
    name: "Leon",
    title: "Brawler",
    level: 1,
    xp: 0,
    xpRate: 1.5,
    growths: {
      hp: 70,
      str: 60,
      mag: 5,
      def: 25,
      res: 55,
      spd: 55,
    },
    team: "player",
    className: "Street Brawler",
    portraitKey: "leonPortrait",
    x: 4,
    y: 6,
    move: 5,
    hp: 16,
    maxHp: 16,
    str: 3,
    mag: 0,
    def: 2,
    res: 1,
    spd: 7,
    weapons: [
      {
        name: "Fists",
        baseDamage: 1,
        range: 1,
        damageType: "physical",
        stat: "str",
        hitRate: 100,
      },
    ],
    acted: false,
    color: 0x38bdf8,
  },
  {
    id: "falan",
    name: "Falan",
    title: "Gang Leader",
    team: "enemy",
    className: "Leader",
    portraitKey: "falanPortrait",
    x: 4,
    y: 1,
    move: 4,
    hp: 14,
    maxHp: 14,
    str: 5,
    mag: 0,
    def: 3,
    res: 1,
    spd: 5,
    weapons: [
      {
        name: "Katars",
        baseDamage: 3,
        range: 1,
        damageType: "physical",
        stat: "str",
        hitRate: 100,
        speedBonus: 2,
      },
    ],
    acted: false,
    color: 0xf87171,
    boss: true,
  },
  {
    id: "thug1",
    name: "Thug",
    title: "White Hood",
    team: "enemy",
    className: "Thug",
    portraitKey: "thugPortrait",
    x: 2,
    y: 1,
    move: 4,
    hp: 8,
    maxHp: 8,
    str: 3,
    mag: 0,
    def: 1,
    res: 0,
    spd: 4,
    weapons: [
      {
        name: "Sword",
        baseDamage: 3,
        range: 1,
        damageType: "physical",
        stat: "str",
        hitRate: 100,
      },
    ],
    acted: false,
    color: 0xfb7185,
  },
  {
    id: "thug2",
    name: "Thug",
    title: "White Hood",
    team: "enemy",
    className: "Thug",
    portraitKey: "thugPortrait",
    x: 3,
    y: 0,
    move: 4,
    hp: 8,
    maxHp: 8,
    str: 3,
    mag: 0,
    def: 1,
    res: 0,
    spd: 4,
    weapons: [
      {
        name: "Axe",
        baseDamage: 5,
        range: 1,
        damageType: "physical",
        stat: "str",
        hitRate: 75,
      },
    ],
    acted: false,
    color: 0xfb7185,
  },
  {
    id: "thug3",
    name: "Thug",
    title: "White Hood",
    team: "enemy",
    className: "Thug",
    portraitKey: "thugPortrait",
    x: 5,
    y: 0,
    move: 4,
    hp: 8,
    maxHp: 8,
    str: 3,
    mag: 0,
    def: 1,
    res: 0,
    spd: 4,
    weapons: [
      {
        name: "Chakram",
        baseDamage: 2,
        minRange: 1,
        maxRange: 2,
        damageType: "physical",
        stat: "str",
        hitRate: 100,
      },
    ],
    acted: false,
    color: 0xfb7185,
  },
  {
    id: "thug4",
    name: "Thug",
    title: "White Hood",
    team: "enemy",
    className: "Thug",
    portraitKey: "thugPortrait",
    x: 6,
    y: 1,
    move: 4,
    hp: 8,
    maxHp: 8,
    str: 3,
    mag: 0,
    def: 1,
    res: 0,
    spd: 4,
    weapons: [
      {
        name: "Sword",
        baseDamage: 3,
        range: 1,
        damageType: "physical",
        stat: "str",
        hitRate: 100,
      },
    ],
    acted: false,
    color: 0xfb7185,
  },
];
 
const LEVELS = {
  chapter1: {
    biome: "city",
    map: MAP,
    units: UNITS,
    battleMusic: {
      key: "chapter1BattleMusic",
      path: "/audio/chapter1_battle.mp3",
      volume: 0.45,
    },
  },
};
 
function tileColor(type) {
  if (type === "street") return 0x374151;
  if (type === "cover") return 0x475569;
  if (type === "gate") return 0x7c5c3b;
  if (type === "wall") return 0x6b7280;
  return 0x1f2937;
}
 
function tileLabel(type) {
  if (type === "street") return "S";
  if (type === "cover") return "C";
  if (type === "gate") return "G";
  if (type === "wall") return "W";
  return "?";
}
 
function tileKey(x, y) {
  return `${x},${y}`;
}
 
function distance(a, b) {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}
 
function getWeaponForTarget(attacker, defender) {
  if (!attacker || !defender || !attacker.weapons) return null;
 
  const dist = distance(attacker, defender);
 
  return (
    attacker.weapons.find((weapon) => {
      const minRange = weapon.minRange ?? weapon.range;
      const maxRange = weapon.maxRange ?? weapon.range;
 
      return dist >= minRange && dist <= maxRange;
    }) || null
  );
}
 
function getDefaultWeapon(unit) {
  return unit.weapons[0];
}
 
function getWeaponRangeLabel(weapon) {
  if (!weapon) return "-";
 
  const minRange = weapon.minRange ?? weapon.range;
  const maxRange = weapon.maxRange ?? weapon.range;
 
  return minRange === maxRange ? `${minRange}` : `${minRange}-${maxRange}`;
}
 
function canAttack(attacker, defender) {
  return !!getWeaponForTarget(attacker, defender);
}
 
class BattleScene extends Phaser.Scene {
  constructor() {
    super("BattleScene");
  }
 
  getCurrentLevel() {
    return LEVELS.chapter1;
  }
 
  preloadBiomeTiles(biomeKey) {
    const biome = BIOMES[biomeKey];
    if (!biome) return;
 
    const loadedKeys = new Set();
 
    Object.values(biome.terrainTextures).forEach((entry) => {
      if (!entry || loadedKeys.has(entry.key)) return;
 
      this.load.image(entry.key, entry.path);
      loadedKeys.add(entry.key);
    });
  }
 
  preloadLevelAudio(levelData) {
    if (!levelData?.battleMusic?.key || !levelData?.battleMusic?.path) return;
 
    this.load.audio(levelData.battleMusic.key, [levelData.battleMusic.path]);
  }
 
  preload() {
    const levelData = this.getCurrentLevel();
 
    this.load.image("edwinPortrait", "/portraits/edwin.jpg");
    this.load.image("leonPortrait", "/portraits/leon.jpg");
    this.load.image("kayleyPortrait", "/portraits/kayley.jpg");
    this.load.image("richPortrait", "/portraits/rich.jpg");
    this.load.image("falanPortrait", "/portraits/falan.jpg");
    this.load.image("thugPortrait", "/portraits/thug.jpg");
    this.load.image("prologueScene", "/scenes/prologue.jpg");
 
    this.preloadBiomeTiles(levelData.biome);
    this.preloadLevelAudio(levelData);
  }
 
  create() {
    this.levelData = this.getCurrentLevel();
    this.currentBiomeKey = this.levelData.biome;
    this.map = this.levelData.map;
    this.mapRows = this.map.length;
    this.mapCols = this.map[0]?.length || 0;
 
    this.units = this.levelData.units.map((unit) => ({
      ...unit,
      weapons: unit.weapons.map((weapon) => ({ ...weapon })),
    }));
 
    this.selectedUnitId = null;
    this.moveTiles = [];
    this.targetTiles = [];
    this.unitSprites = {};
    this.phase = "intro";
    this.busy = false;
    this.previewOpen = false;
    this.previewData = null;
    this.battleMusic = null;
    this.battleMusicStarted = false;
 
    this.openingStep = 0;
    this.openingLine = 0;
    this.openingMode = CHAPTER_OPENING[0].type;
 
    this.cameras.main.setBackgroundColor("#0f172a");
 
    this.boardWidth = this.mapCols * TILE_SIZE;
    this.boardHeight = this.mapRows * TILE_SIZE;
    this.boardX = 240;
    this.boardY = 96;
 
    this.tileLayer = this.add.layer();
    this.overlayLayer = this.add.layer();
    this.unitLayer = this.add.layer();
    this.uiLayer = this.add.layer();
 
    this.createTopUI();
    this.drawBoard();
    this.drawUnits();
    this.createSidePanel();
    this.createPreviewUI();
    this.createCombatXpPopup();
    this.createOpeningUI();
    this.setupInput();
    this.updateSelectedPanel();
    this.updateOpeningUI();
  }
 
  createTopUI() {
    this.add.text(24, 20, "Chapter 1", {
      fontSize: "26px",
      fontStyle: "bold",
      color: "#ffffff",
    });
 
    this.phaseText = this.add.text(24, 56, "Opening", {
      fontSize: "18px",
      fontStyle: "bold",
      color: "#fcd34d",
    });
 
    this.helpText = this.add.text(24, 88, "Watch the chapter opening.", {
      fontSize: "14px",
      color: "#cbd5e1",
      wordWrap: { width: 190 },
    });
 
    this.add.text(24, 470, "Objective", {
      fontSize: "18px",
      fontStyle: "bold",
      color: "#f8fafc",
    });
 
    this.objectiveText = this.add.text(24, 498, "Defeat Falan, the gang leader.", {
      fontSize: "14px",
      color: "#fcd34d",
      wordWrap: { width: 190 },
    });
  }
 
  createSidePanel() {
    const x = 672;
    const y = 72;
 
    const bg = this.add.rectangle(x + 120, y + 200, 248, 400, 0x111827, 0.92);
    bg.setStrokeStyle(2, 0x334155);
 
    const title = this.add.text(x + 16, y + 14, "Selected Unit", {
      fontSize: "20px",
      fontStyle: "bold",
      color: "#ffffff",
    });
 
    this.portraitFrame = this.add.rectangle(x + 64, y + 88, 96, 120, 0x1f2937);
    this.portraitFrame.setStrokeStyle(2, 0x475569);
 
    this.portraitImage = this.add.image(x + 64, y + 88, "edwinPortrait");
    this.portraitImage.setDisplaySize(96, 120);
    this.portraitImage.setVisible(false);
 
    this.portraitPlaceholder = this.add.text(x + 64, y + 88, "NO\nART", {
      fontSize: "20px",
      color: "#94a3b8",
      align: "center",
    }).setOrigin(0.5);
 
    this.unitNameText = this.add.text(x + 16, y + 156, "None", {
      fontSize: "22px",
      fontStyle: "bold",
      color: "#ffffff",
    });
 
    this.unitClassText = this.add.text(x + 16, y + 190, "", {
      fontSize: "14px",
      color: "#94a3b8",
    });
 
    this.levelXpText = this.add.text(x + 16, y + 218, "", {
      fontSize: "14px",
      color: "#cbd5e1",
    });
 
    this.xpBarBg = this.add.rectangle(x + 16, y + 244, 210, 12, 0x1f2937);
    this.xpBarBg.setOrigin(0, 0.5);
    this.xpBarBg.setStrokeStyle(1, 0x475569);
 
    this.xpBarFill = this.add.rectangle(x + 16, y + 244, 210, 12, 0x38bdf8);
    this.xpBarFill.setOrigin(0, 0.5);
    this.xpBarFill.displayWidth = 0;
 
    this.unitStatsText = this.add.text(x + 16, y + 264, "", {
      fontSize: "13px",
      color: "#e2e8f0",
      lineSpacing: 4,
    });
 
    this.weaponText = this.add.text(x + 16, y + 388, "", {
      fontSize: "13px",
      color: "#93c5fd",
      wordWrap: { width: 210 },
    });
 
    this.sidePanelParts = [
      bg,
      title,
      this.portraitFrame,
      this.portraitImage,
      this.portraitPlaceholder,
      this.unitNameText,
      this.unitClassText,
      this.levelXpText,
      this.xpBarBg,
      this.xpBarFill,
      this.unitStatsText,
      this.weaponText,
    ];
 
    this.uiLayer.add(this.sidePanelParts);
  }
 
  createPreviewUI() {
    this.previewContainer = this.add.container(GAME_WIDTH / 2, 430);
    this.previewContainer.setVisible(false);
 
    const panel = this.add.rectangle(0, 0, 620, 150, 0x0f172a, 0.97);
    panel.setStrokeStyle(2, 0x475569);
 
    const title = this.add.text(-292, -58, "Combat Preview", {
      fontSize: "22px",
      fontStyle: "bold",
      color: "#ffffff",
    });
 
    this.previewLeftName = this.add.text(-292, -18, "", {
      fontSize: "18px",
      fontStyle: "bold",
      color: "#93c5fd",
    });
 
    this.previewLeftStats = this.add.text(-292, 10, "", {
      fontSize: "14px",
      color: "#e2e8f0",
      lineSpacing: 6,
    });
 
    this.previewRightName = this.add.text(30, -18, "", {
      fontSize: "18px",
      fontStyle: "bold",
      color: "#fca5a5",
    });
 
    this.previewRightStats = this.add.text(30, 10, "", {
      fontSize: "14px",
      color: "#e2e8f0",
      lineSpacing: 6,
    });
 
    const confirmButton = this.add.rectangle(-90, 50, 140, 34, 0x2563eb);
    confirmButton.setStrokeStyle(2, 0x93c5fd);
    confirmButton.setInteractive({ useHandCursor: true });
    confirmButton.on("pointerdown", () => {
      if (this.previewOpen) this.confirmPreviewAttack();
    });
 
    const confirmText = this.add.text(-132, 39, "Confirm", {
      fontSize: "16px",
      fontStyle: "bold",
      color: "#ffffff",
    });
 
    const cancelButton = this.add.rectangle(90, 50, 140, 34, 0x334155);
    cancelButton.setStrokeStyle(2, 0x94a3b8);
    cancelButton.setInteractive({ useHandCursor: true });
    cancelButton.on("pointerdown", () => {
      if (this.previewOpen) this.closePreview();
    });
 
    const cancelText = this.add.text(52, 39, "Cancel", {
      fontSize: "16px",
      fontStyle: "bold",
      color: "#ffffff",
    });
 
    this.previewContainer.add([
      panel,
      title,
      this.previewLeftName,
      this.previewLeftStats,
      this.previewRightName,
      this.previewRightStats,
      confirmButton,
      confirmText,
      cancelButton,
      cancelText,
    ]);
 
    this.uiLayer.add(this.previewContainer);
  }
 
  createCombatXpPopup() {
    this.combatXpContainer = this.add.container(GAME_WIDTH / 2, GAME_HEIGHT - 68);
    this.combatXpContainer.setVisible(false);
    this.combatXpContainer.setDepth(9998);
    this.combatXpContainer.setAlpha(0);
 
    const bg = this.add.rectangle(0, 0, 320, 88, 0x020617, 0.96);
    bg.setStrokeStyle(2, 0x475569);
 
    this.combatXpNameText = this.add.text(-140, -28, "", {
      fontSize: "18px",
      fontStyle: "bold",
      color: "#ffffff",
    });
 
    this.combatXpGainText = this.add.text(140, -28, "", {
      fontSize: "16px",
      fontStyle: "bold",
      color: "#7dd3fc",
    }).setOrigin(1, 0);
 
    this.combatXpValueText = this.add.text(-140, -2, "", {
      fontSize: "14px",
      color: "#cbd5e1",
    });
 
    this.combatXpBarBg = this.add.rectangle(-140, 26, 280, 14, 0x1f2937);
    this.combatXpBarBg.setOrigin(0, 0.5);
    this.combatXpBarBg.setStrokeStyle(1, 0x475569);
 
    this.combatXpBarFill = this.add.rectangle(-140, 26, 280, 14, 0x38bdf8);
    this.combatXpBarFill.setOrigin(0, 0.5);
    this.combatXpBarFill.displayWidth = 0;
 
    this.combatXpContainer.add([
      bg,
      this.combatXpNameText,
      this.combatXpGainText,
      this.combatXpValueText,
      this.combatXpBarBg,
      this.combatXpBarFill,
    ]);
 
    this.uiLayer.add(this.combatXpContainer);
  }
 
  showCombatXpPopup(unit, amount, startLevel, startXp) {
    if (!this.combatXpContainer || !unit || amount <= 0) return;
 
    this.tweens.killTweensOf(this.combatXpContainer);
    this.tweens.killTweensOf(this.combatXpBarFill);
 
    const popup = this.combatXpContainer;
    popup.setVisible(true);
    popup.setAlpha(1);
 
    this.combatXpNameText.setText(unit.name);
    this.combatXpGainText.setText(`+${amount} XP`);
 
    let displayLevel = startLevel;
    let currentXp = startXp;
    let remainingXp = amount;
 
    const setDisplay = (level, xpValue) => {
      this.combatXpValueText.setText(`Lv ${level} XP ${xpValue}/100`);
      this.combatXpBarFill.displayWidth = 280 * Phaser.Math.Clamp(xpValue / 100, 0, 1);
    };
 
    setDisplay(displayLevel, currentXp);
 
    const animateChunk = () => {
      if (remainingXp <= 0) {
        this.time.delayedCall(700, () => {
          this.tweens.add({
            targets: popup,
            alpha: 0,
            duration: 220,
            onComplete: () => popup.setVisible(false),
          });
        });
        return;
      }
 
      const neededToLevel = 100 - currentXp;
      const chunk = Math.min(remainingXp, neededToLevel);
 
      this.tweens.addCounter({
        from: currentXp,
        to: currentXp + chunk,
        duration: 450,
        onUpdate: (tween) => {
          const value = Math.floor(tween.getValue());
          setDisplay(displayLevel, value);
        },
        onComplete: () => {
          currentXp += chunk;
          remainingXp -= chunk;
 
          if (currentXp >= 100 && remainingXp > 0) {
            displayLevel += 1;
            currentXp = 0;
            setDisplay(displayLevel, currentXp);
 
            this.time.delayedCall(250, () => {
              animateChunk();
            });
          } else {
            animateChunk();
          }
        },
      });
    };
 
    animateChunk();
  }
 
  getTerrainDefenseBonus(unit) {
    if (!unit) return 0;
 
    const terrain = this.getTerrainAt(unit.x, unit.y);
 
    if (terrain === "cover") return 2;
    if (terrain === "gate") return 5;
 
    return 0;
  }
 
  getWeaponSpeedBonus(unit, weapon) {
    if (!unit || !weapon) return 0;
    return weapon.speedBonus || 0;
  }
 
  getEffectiveSpeed(unit, weapon = null) {
    return (unit?.spd || 0) + this.getWeaponSpeedBonus(unit, weapon);
  }
 
  getDefenseForAttack(defender, weapon) {
    if (!defender || !weapon) return 0;
 
    if (weapon.damageType === "magical") {
      return defender.res || 0;
    }
 
    return (defender.def || 0) + this.getTerrainDefenseBonus(defender);
  }
 
  calculateDamage(attacker, defender, weapon) {
    if (!attacker || !defender || !weapon) return 0;
 
    const attackStatName = weapon.stat || "str";
    const attackStat = attacker[attackStatName] || 0;
    const baseDamage = weapon.baseDamage ?? weapon.damage ?? 0;
    const defense = this.getDefenseForAttack(defender, weapon);
 
    return Math.max(0, baseDamage + attackStat - defense);
  }
 
  calculateAttackCount(attacker, defender, weapon) {
    if (!attacker || !defender) return 1;
 
    const attackerSpeed = this.getEffectiveSpeed(attacker, weapon);
    const defenderWeapon = getWeaponForTarget(defender, attacker) || getDefaultWeapon(defender);
    const defenderSpeed = this.getEffectiveSpeed(defender, defenderWeapon);
    const speedGap = attackerSpeed - defenderSpeed;
 
    return Math.max(1, 1 + Math.floor(speedGap / 5));
  }
 
  rollHit(weapon) {
    const hitRate = weapon?.hitRate ?? 100;
    const roll = Phaser.Math.Between(1, 100);
 
    return roll <= hitRate;
  }
 
  resolveAttackSequence(attacker, defender, weapon) {
    const attackCount = this.calculateAttackCount(attacker, defender, weapon);
    const results = [];
    let totalDamage = 0;
    let didKill = false;
 
    for (let i = 0; i < attackCount; i++) {
      if (defender.hp <= 0) break;
 
      const hit = this.rollHit(weapon);
 
      if (!hit) {
        results.push({ hit: false, damage: 0 });
        continue;
      }
 
      const damage = this.calculateDamage(attacker, defender, weapon);
      defender.hp = Math.max(0, defender.hp - damage);
      totalDamage += damage;
      results.push({ hit: true, damage });
 
      if (defender.hp <= 0) {
        didKill = true;
        break;
      }
    }
 
    return { attackCount, results, totalDamage, didKill };
  }
 
  showCombatResultText(unit, result, index = 0) {
    const text = result.hit ? `-${result.damage}` : "MISS";
    const color = result.hit ? "#fca5a5" : "#fef3c7";
 
    this.time.delayedCall(index * 140, () => {
      this.showFloatingText(
        this.boardX + unit.x * TILE_SIZE + TILE_SIZE / 2,
        this.boardY + unit.y * TILE_SIZE + 8,
        text,
        color
      );
    });
  }
 
  calculateXpGain(attacker, defender, didKill) {
    if (!attacker || attacker.team !== "player") return 0;
    if (!defender || defender.team !== "enemy") return 0;
 
    const attackerLevel = attacker.level || 1;
    const defenderLevel = defender.level || 1;
 
    let xp = 10;
    xp += Math.max(0, defenderLevel - attackerLevel) * 4;
    xp += Math.max(0, attackerLevel - defenderLevel) * -2;
 
    if (didKill) xp += 25;
    if (didKill && defender.boss) xp += 35;
 
    xp = Math.round(xp * (attacker.xpRate || 1));
 
    return Math.max(1, xp);
  }
 
  awardXp(unit, amount) {
    if (!unit || unit.team !== "player" || amount <= 0) return;
 
    unit.level = unit.level || 1;
    unit.xp = unit.xp || 0;
 
    const oldLevel = unit.level;
    const oldXp = unit.xp;
 
    unit.xp += amount;
 
    while (unit.xp >= 100) {
      unit.xp -= 100;
      this.levelUpUnit(unit);
    }
 
    this.showCombatXpPopup(unit, amount, oldLevel, oldXp);
    this.updateSelectedPanel();
  }
 
  levelUpUnit(unit) {
    unit.level += 1;
 
    const gains = {};
 
    Object.entries(unit.growths || {}).forEach(([stat, chance]) => {
      const roll = Phaser.Math.Between(1, 100);
 
      if (roll <= chance) {
        gains[stat] = 1;
 
        if (stat === "hp") {
          unit.maxHp += 1;
          unit.hp += 1;
        } else {
          unit[stat] += 1;
        }
      } else {
        gains[stat] = 0;
      }
    });
 
    this.showLevelUpPopup(unit, gains);
  }
 
  showLevelUpPopup(unit, gains) {
    const gainLines = Object.entries(gains)
      .filter(([, value]) => value > 0)
      .map(([stat]) => `${stat.toUpperCase()} +1`);
 
    const text = gainLines.length > 0 ? gainLines.join("\n") : "No stat gains...";
 
    const popup = this.add.container(GAME_WIDTH / 2, GAME_HEIGHT / 2);
 
    const bg = this.add.rectangle(0, 0, 300, 220, 0x020617, 0.96);
    bg.setStrokeStyle(2, 0xfcd34d);
 
    const title = this.add.text(0, -82, "LEVEL UP!", {
      fontSize: "26px",
      fontStyle: "bold",
      color: "#fcd34d",
    }).setOrigin(0.5);
 
    const name = this.add.text(0, -46, `${unit.name} reached Lv ${unit.level}`, {
      fontSize: "18px",
      fontStyle: "bold",
      color: "#ffffff",
    }).setOrigin(0.5);
 
    const stats = this.add.text(0, -10, text, {
      fontSize: "16px",
      color: "#e2e8f0",
      align: "center",
      lineSpacing: 6,
    }).setOrigin(0.5, 0);
 
    const continueText = this.add.text(0, 82, "Click to continue", {
      fontSize: "14px",
      color: "#94a3b8",
    }).setOrigin(0.5);
 
    popup.add([bg, title, name, stats, continueText]);
    popup.setDepth(9999);
    popup.setAlpha(0);
 
    this.tweens.add({
      targets: popup,
      alpha: 1,
      duration: 180,
    });
 
    bg.setInteractive({ useHandCursor: true });
    bg.on("pointerdown", () => {
      popup.destroy();
    });
 
    this.uiLayer.add(popup);
  }
 
  showFloatingText(x, y, text, color = "#ffffff") {
    const floating = this.add.text(x, y, text, {
      fontSize: "18px",
      fontStyle: "bold",
      color,
      stroke: "#000000",
      strokeThickness: 4,
    }).setOrigin(0.5);
 
    floating.setDepth(9999);
 
    this.tweens.add({
      targets: floating,
      y: y - 28,
      alpha: 0,
      duration: 900,
      ease: "Cubic.easeOut",
      onComplete: () => floating.destroy(),
    });
 
    return floating;
  }
 
  createOpeningUI() {
    this.openingContainer = this.add.container(0, 0);
 
    this.openingFade = this.add.rectangle(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2,
      GAME_WIDTH,
      GAME_HEIGHT,
      0x000000,
      0.88
    );
 
    this.titleCard = this.add.container(0, 0);
 
    const titleBg = this.add.rectangle(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2,
      520,
      220,
      0x0f172a,
      0.94
    );
    titleBg.setStrokeStyle(2, 0x475569);
 
    this.titleChapter = this.add.text(GAME_WIDTH / 2, 215, "", {
      fontSize: "42px",
      fontStyle: "bold",
      color: "#ffffff",
    }).setOrigin(0.5);
 
    this.titleSubtitle = this.add.text(GAME_WIDTH / 2, 270, "", {
      fontSize: "28px",
      color: "#fcd34d",
    }).setOrigin(0.5);
 
    this.titleTag = this.add.text(GAME_WIDTH / 2, 315, "", {
      fontSize: "18px",
      color: "#cbd5e1",
    }).setOrigin(0.5);
 
    const titleContinueButton = this.add.rectangle(GAME_WIDTH / 2, 370, 170, 38, 0x2563eb);
    titleContinueButton.setStrokeStyle(2, 0x93c5fd);
    titleContinueButton.setInteractive({ useHandCursor: true });
    titleContinueButton.on("pointerdown", () => this.advanceOpening());
 
    const titleContinueText = this.add.text(GAME_WIDTH / 2, 370, "Continue", {
      fontSize: "18px",
      fontStyle: "bold",
      color: "#ffffff",
    }).setOrigin(0.5);
 
    this.titleCard.add([
      titleBg,
      this.titleChapter,
      this.titleSubtitle,
      this.titleTag,
      titleContinueButton,
      titleContinueText,
    ]);
 
    this.dialogueCard = this.add.container(0, 0);
 
    const mainPanel = this.add.rectangle(480, 250, 860, 430, 0x020617, 0.92);
    mainPanel.setStrokeStyle(2, 0x475569);
 
    const sceneFrame = this.add.rectangle(240, 175, 320, 200, 0x111827, 1);
    sceneFrame.setStrokeStyle(2, 0x64748b);
 
    this.dialogueSceneImage = this.add.image(240, 175, "prologueScene");
    this.dialogueSceneImage.setDisplaySize(312, 192);
 
    this.dialogueSceneName = this.add.text(84, 62, "", {
      fontSize: "16px",
      color: "#fcd34d",
      fontStyle: "bold",
    });
 
    this.dialoguePortraitPanel = this.add.rectangle(720, 175, 180, 200, 0x111827, 1);
    this.dialoguePortraitPanel.setStrokeStyle(2, 0x64748b);
 
    this.dialoguePortraitFrame = this.add.rectangle(720, 160, 120, 140, 0x1f2937);
    this.dialoguePortraitFrame.setStrokeStyle(2, 0x64748b);
 
    this.dialoguePortrait = this.add.image(720, 160, "edwinPortrait");
    this.dialoguePortrait.setDisplaySize(110, 132);
 
    this.dialoguePortraitPlaceholder = this.add.text(720, 160, "NO\nART", {
      fontSize: "20px",
      color: "#94a3b8",
      align: "center",
    }).setOrigin(0.5);
 
    this.impactContainer = this.add.container(0, 0);
    this.impactContainer.setVisible(false);
 
    const impactShadow = this.add.rectangle(480, 175, 560, 190, 0x020617, 0.82);
    impactShadow.setStrokeStyle(2, 0x64748b);
 
    this.impactAttackerSlot = this.add.container(320, 175);
    this.impactAttackerFrame = this.add.rectangle(0, 0, 130, 150, 0x1f2937, 1);
    this.impactAttackerFrame.setStrokeStyle(2, 0x64748b);
    this.impactAttackerImage = this.add.image(0, -6, "edwinPortrait");
    this.impactAttackerImage.setDisplaySize(112, 132);
    this.impactAttackerPlaceholder = this.add.text(0, -6, "NO\nART", {
      fontSize: "20px",
      color: "#94a3b8",
      align: "center",
    }).setOrigin(0.5);
    this.impactAttackerName = this.add.text(0, 86, "", {
      fontSize: "16px",
      fontStyle: "bold",
      color: "#ffffff",
    }).setOrigin(0.5);
    this.impactAttackerSlot.add([
      this.impactAttackerFrame,
      this.impactAttackerImage,
      this.impactAttackerPlaceholder,
      this.impactAttackerName,
    ]);
 
    this.impactDefenderSlot = this.add.container(640, 175);
    this.impactDefenderFrame = this.add.rectangle(0, 0, 130, 150, 0x1f2937, 1);
    this.impactDefenderFrame.setStrokeStyle(2, 0x64748b);
    this.impactDefenderImage = this.add.image(0, -6, "edwinPortrait");
    this.impactDefenderImage.setDisplaySize(112, 132);
    this.impactDefenderPlaceholder = this.add.text(0, -6, "NO\nART", {
      fontSize: "20px",
      color: "#94a3b8",
      align: "center",
    }).setOrigin(0.5);
    this.impactDefenderName = this.add.text(0, 86, "", {
      fontSize: "16px",
      fontStyle: "bold",
      color: "#ffffff",
    }).setOrigin(0.5);
    this.impactDefenderSlot.add([
      this.impactDefenderFrame,
      this.impactDefenderImage,
      this.impactDefenderPlaceholder,
      this.impactDefenderName,
    ]);
 
    this.impactText = this.add.text(480, 175, "SMASH!", {
      fontSize: "28px",
      fontStyle: "bold",
      color: "#f8fafc",
      stroke: "#0f172a",
      strokeThickness: 6,
    }).setOrigin(0.5);
 
    this.impactContainer.add([
      impactShadow,
      this.impactAttackerSlot,
      this.impactDefenderSlot,
      this.impactText,
    ]);
 
    const textBox = this.add.rectangle(480, 395, 800, 120, 0xf8f5ee, 0.98);
    textBox.setStrokeStyle(2, 0xb8aa8a);
 
    this.dialogueSpeaker = this.add.text(90, 343, "", {
      fontSize: "24px",
      fontStyle: "bold",
      color: "#1e293b",
    });
 
    this.dialogueText = this.add.text(90, 378, "", {
      fontSize: "20px",
      color: "#334155",
      wordWrap: { width: 660 },
      lineSpacing: 8,
    });
 
    this.openingBackButton = this.add.rectangle(700, 460, 110, 34, 0x334155);
    this.openingBackButton.setStrokeStyle(2, 0x94a3b8);
    this.openingBackButton.setInteractive({ useHandCursor: true });
    this.openingBackButton.on("pointerdown", () => this.goOpeningBack());
 
    const backText = this.add.text(668, 449, "Back", {
      fontSize: "16px",
      fontStyle: "bold",
      color: "#ffffff",
    });
 
    this.openingNextButton = this.add.rectangle(820, 460, 110, 34, 0x2563eb);
    this.openingNextButton.setStrokeStyle(2, 0x93c5fd);
    this.openingNextButton.setInteractive({ useHandCursor: true });
    this.openingNextButton.on("pointerdown", () => this.advanceOpening());
 
    this.openingNextLabel = this.add.text(785, 449, "Next", {
      fontSize: "16px",
      fontStyle: "bold",
      color: "#ffffff",
    });
 
    this.openingSkipButton = this.add.rectangle(810, 50, 110, 30, 0x3f3f46);
    this.openingSkipButton.setStrokeStyle(2, 0xa1a1aa);
    this.openingSkipButton.setInteractive({ useHandCursor: true });
    this.openingSkipButton.on("pointerdown", () => this.skipOpening());
 
    const skipText = this.add.text(777, 40, "Skip", {
      fontSize: "14px",
      fontStyle: "bold",
      color: "#ffffff",
    });
 
    this.dialogueCard.add([
      mainPanel,
      sceneFrame,
      this.dialogueSceneImage,
      this.dialogueSceneName,
      this.dialoguePortraitPanel,
      this.dialoguePortraitFrame,
      this.dialoguePortrait,
      this.dialoguePortraitPlaceholder,
      this.impactContainer,
      textBox,
      this.dialogueSpeaker,
      this.dialogueText,
      this.openingBackButton,
      backText,
      this.openingNextButton,
      this.openingNextLabel,
      this.openingSkipButton,
      skipText,
    ]);
 
    this.openingContainer.add([
      this.openingFade,
      this.titleCard,
      this.dialogueCard,
    ]);
 
    this.uiLayer.add(this.openingContainer);
  }
 
  setImpactPortrait(image, placeholder, nameText, name, portraitKey) {
    nameText.setText(name || "");
 
    if (portraitKey && this.textures.exists(portraitKey)) {
      image.setTexture(portraitKey);
      image.setVisible(true);
      placeholder.setVisible(false);
    } else {
      image.setVisible(false);
      placeholder.setVisible(true);
    }
  }
 
  playImpactBeat(line) {
    if (line.defender === "Kayley") {
      this.startBattleMusic();
    }
 
    this.setImpactPortrait(
      this.impactAttackerImage,
      this.impactAttackerPlaceholder,
      this.impactAttackerName,
      line.attacker,
      line.attackerPortrait
    );
 
    this.setImpactPortrait(
      this.impactDefenderImage,
      this.impactDefenderPlaceholder,
      this.impactDefenderName,
      line.defender,
      line.defenderPortrait
    );
 
    this.tweens.killTweensOf(this.impactAttackerSlot);
    this.tweens.killTweensOf(this.impactDefenderSlot);
    this.tweens.killTweensOf(this.impactText);
 
    this.impactAttackerSlot.x = 320;
    this.impactDefenderSlot.x = 640;
    this.impactText.setAlpha(0);
    this.impactText.setScale(0.7);
    this.impactDefenderFrame.setFillStyle(0x1f2937);
    this.impactAttackerFrame.setFillStyle(0x1f2937);
 
    if (this.impactDefenderImage.visible) {
      this.impactDefenderImage.clearTint();
    }
 
    if (this.impactAttackerImage.visible) {
      this.impactAttackerImage.clearTint();
    }
 
    this.tweens.add({
      targets: this.impactAttackerSlot,
      x: 390,
      duration: 120,
      ease: "Cubic.Out",
      onComplete: () => {
        this.impactText.setText(line.attacker === "Edwin" ? "SLASH!" : "SMASH!");
        this.impactText.setAlpha(1);
 
        this.tweens.add({
          targets: this.impactText,
          scale: 1.15,
          alpha: 0,
          duration: 220,
          ease: "Quad.Out",
        });
 
        this.impactDefenderFrame.setFillStyle(0x7f1d1d);
 
        if (this.impactDefenderImage.visible) {
          this.impactDefenderImage.setTintFill(0xff6666);
        }
 
        this.tweens.add({
          targets: this.impactDefenderSlot,
          x: 675,
          duration: 40,
          yoyo: true,
          repeat: 3,
          onComplete: () => {
            this.impactDefenderSlot.x = 640;
            this.impactDefenderFrame.setFillStyle(0x1f2937);
 
            if (this.impactDefenderImage.visible) {
              this.impactDefenderImage.clearTint();
            }
          },
        });
 
        this.time.delayedCall(120, () => {
          this.tweens.add({
            targets: this.impactAttackerSlot,
            x: 320,
            duration: 120,
            ease: "Cubic.Out",
          });
        });
      },
    });
  }
 
  updateOpeningUI() {
    const step = CHAPTER_OPENING[this.openingStep];
 
    if (step.type === "title") {
      this.titleCard.setVisible(true);
      this.dialogueCard.setVisible(false);
      this.titleChapter.setText(step.chapter);
      this.titleSubtitle.setText(step.subtitle);
      this.titleTag.setText(step.tag);
      this.helpText.setText("Chapter opening.");
      return;
    }
 
    this.titleCard.setVisible(false);
    this.dialogueCard.setVisible(true);
 
    const line = step.lines[this.openingLine];
    const isImpact = line.type === "impact";
 
    this.dialogueSceneName.setText(step.sceneName);
    this.dialogueSceneImage.setTexture("prologueScene");
    this.dialogueSceneImage.setAlpha(isImpact ? 0.3 : 1);
    this.impactContainer.setVisible(isImpact);
    this.dialoguePortraitPanel.setVisible(!isImpact);
    this.dialoguePortraitFrame.setVisible(!isImpact);
 
    if (isImpact) {
      this.dialogueSpeaker.setText("");
      this.dialogueText.setText(line.text);
      this.dialoguePortrait.setVisible(false);
      this.dialoguePortraitPlaceholder.setVisible(false);
      this.playImpactBeat(line);
    } else {
      this.dialogueSpeaker.setText(line.speaker);
      this.dialogueText.setText(line.text);
 
      if (line.portrait && this.textures.exists(line.portrait)) {
        this.dialoguePortraitPanel.setVisible(true);
        this.dialoguePortraitFrame.setVisible(true);
        this.dialoguePortrait.setTexture(line.portrait);
        this.dialoguePortrait.setDisplaySize(110, 132);
        this.dialoguePortrait.setVisible(true);
        this.dialoguePortraitPlaceholder.setVisible(false);
      } else {
        this.dialoguePortraitPanel.setVisible(false);
        this.dialoguePortraitFrame.setVisible(false);
        this.dialoguePortrait.setVisible(false);
        this.dialoguePortraitPlaceholder.setVisible(false);
      }
    }
 
    this.openingBackButton.setAlpha(this.openingStep === 0 && this.openingLine === 0 ? 0.4 : 1);
 
    const lastStep = this.openingStep === CHAPTER_OPENING.length - 1;
    const lastLine = this.openingLine === step.lines.length - 1;
    this.openingNextLabel.setText(lastStep && lastLine ? "Start" : "Next");
  }
 
  goOpeningBack() {
    if (this.openingStep === 0) return;
 
    if (CHAPTER_OPENING[this.openingStep].type === "scene" && this.openingLine > 0) {
      this.openingLine -= 1;
    } else {
      this.openingStep -= 1;
      const prev = CHAPTER_OPENING[this.openingStep];
      this.openingLine = prev.type === "scene" ? prev.lines.length - 1 : 0;
    }
 
    this.updateOpeningUI();
  }
 
  advanceOpening() {
    const step = CHAPTER_OPENING[this.openingStep];
 
    if (step.type === "title") {
      this.openingStep += 1;
      this.openingLine = 0;
      this.updateOpeningUI();
      return;
    }
 
    if (this.openingLine < step.lines.length - 1) {
      this.openingLine += 1;
      this.updateOpeningUI();
      return;
    }
 
    if (this.openingStep < CHAPTER_OPENING.length - 1) {
      this.openingStep += 1;
      this.openingLine = 0;
      this.updateOpeningUI();
      return;
    }
 
    this.finishOpening();
  }
 
  skipOpening() {
    this.finishOpening();
  }
 
  finishOpening() {
    this.openingContainer.setVisible(false);
    this.phase = "player";
    this.phaseText.setText("Player Phase");
    this.phaseText.setColor("#93c5fd");
    this.helpText.setText("Player Phase. Click Edwin or Leon.");
  }
 
  startBattleMusic() {
    const musicConfig = this.levelData?.battleMusic;
    if (!musicConfig?.key) return;
    if (this.battleMusicStarted) return;
 
    if (!this.cache.audio.exists(musicConfig.key)) {
      console.warn(`Battle music not found: ${musicConfig.path}`);
      return;
    }
 
    const playMusic = () => {
      if (this.battleMusic && this.battleMusic.isPlaying) return;
 
      this.battleMusic = this.sound.add(musicConfig.key, {
        loop: true,
        volume: musicConfig.volume ?? 0.45,
      });
 
      this.battleMusic.play();
      this.battleMusicStarted = true;
    };
 
    if (this.sound.locked) {
      this.sound.once(Phaser.Sound.Events.UNLOCKED, playMusic);
    } else {
      playMusic();
    }
  }
 
  stopBattleMusic() {
    if (!this.battleMusic) {
      this.battleMusicStarted = false;
      return;
    }
 
    this.battleMusic.stop();
    this.battleMusic.destroy();
    this.battleMusic = null;
    this.battleMusicStarted = false;
  }
 
  getCurrentBiome() {
    return BIOMES[this.currentBiomeKey] || null;
  }
 
  isInBounds(x, y) {
    return x >= 0 && y >= 0 && x < this.mapCols && y < this.mapRows;
  }
 
  getTerrainAt(x, y) {
    if (!this.isInBounds(x, y)) return null;
    return this.map[y][x];
  }
 
  getTerrainTextureKey(x, y) {
    const terrain = this.getTerrainAt(x, y);
    const biome = this.getCurrentBiome();
 
    if (!biome) return null;
 
    const entry = biome.terrainTextures[terrain] || biome.terrainTextures.default;
    return entry ? entry.key : null;
  }
 
  drawBoard() {
    this.tileLayer.removeAll(true);
 
    for (let row = 0; row < this.mapRows; row++) {
      for (let col = 0; col < this.mapCols; col++) {
        const type = this.getTerrainAt(col, row);
        const textureKey = this.getTerrainTextureKey(col, row);
        const x = this.boardX + col * TILE_SIZE;
        const y = this.boardY + row * TILE_SIZE;
 
        if (textureKey && this.textures.exists(textureKey)) {
          const tileImage = this.add.image(
            x + TILE_SIZE / 2,
            y + TILE_SIZE / 2,
            textureKey
          );
          tileImage.setDisplaySize(TILE_SIZE, TILE_SIZE);
          this.tileLayer.add(tileImage);
        } else {
          const tile = this.add.rectangle(
            x + TILE_SIZE / 2,
            y + TILE_SIZE / 2,
            TILE_SIZE - 2,
            TILE_SIZE - 2,
            tileColor(type)
          );
          tile.setStrokeStyle(1, 0x111827);
          this.tileLayer.add(tile);
 
          const label = this.add.text(x + 6, y + 4, tileLabel(type), {
            fontSize: "12px",
            color: "#e5e7eb",
          });
          this.tileLayer.add(label);
        }
 
        const border = this.add.rectangle(
          x + TILE_SIZE / 2,
          y + TILE_SIZE / 2,
          TILE_SIZE,
          TILE_SIZE,
          0x000000,
          0
        );
        border.setStrokeStyle(1, 0x0f172a, 0.45);
        this.tileLayer.add(border);
      }
    }
  }
 
  drawUnits() {
    for (const unit of this.units) {
      const sprite = this.createUnitSprite(unit);
      this.unitSprites[unit.id] = sprite;
      this.unitLayer.add(sprite.container);
      this.refreshUnitSprite(unit);
    }
  }
 
  createUnitSprite(unit) {
    const marker = this.add.circle(0, 0, 14, unit.color);
    marker.setStrokeStyle(2, 0xffffff);
 
    const label = this.add.text(
      unit.team === "player" ? -9 : -8,
      -10,
      unit.team === "player" ? unit.name[0] : unit.boss ? "B" : "T",
      {
        fontSize: "16px",
        fontStyle: "bold",
        color: "#ffffff",
      }
    );
 
    const hpText = this.add.text(-14, 16, "", {
      fontSize: "10px",
      color: "#e5e7eb",
    });
 
    const container = this.add.container(0, 0, [marker, label, hpText]);
 
    return { container, marker, hpText };
  }
 
  refreshUnitSprite(unit) {
    const sprite = this.unitSprites[unit.id];
    if (!sprite) return;
 
    sprite.container.x = this.boardX + unit.x * TILE_SIZE + TILE_SIZE / 2;
    sprite.container.y = this.boardY + unit.y * TILE_SIZE + TILE_SIZE / 2;
    sprite.hpText.setText(`HP ${unit.hp}`);
    sprite.container.alpha = unit.team === "player" && unit.acted ? 0.55 : 1;
  }
 
  setupInput() {
    this.input.on("pointerdown", (pointer) => {
      if (this.phase !== "player" || this.busy || this.previewOpen) return;
 
      const tile = this.pointerToTile(pointer.x, pointer.y);
      if (!tile) return;
 
      const clickedUnit = this.getUnitAt(tile.x, tile.y);
      const selectedUnit = this.getSelectedUnit();
 
      if (clickedUnit && clickedUnit.team === "player" && !clickedUnit.acted) {
        this.selectedUnitId = clickedUnit.id;
        this.moveTiles = this.reachableTiles(clickedUnit);
        this.targetTiles = this.attackableEnemies(clickedUnit);
        this.redrawSelection();
        this.updateSelectedPanel();
        this.helpText.setText(`Selected ${clickedUnit.name}. Move or attack.`);
        return;
      }
 
      if (
        selectedUnit &&
        clickedUnit &&
        clickedUnit.team === "enemy" &&
        this.isTargetTile(clickedUnit.x, clickedUnit.y)
      ) {
        this.openPreview(selectedUnit, clickedUnit);
        return;
      }
 
      if (clickedUnit && clickedUnit.team === "enemy") {
        this.selectedUnitId = clickedUnit.id;
        this.moveTiles = [];
        this.targetTiles = [];
        this.redrawSelection();
        this.updateSelectedPanel();
        this.helpText.setText(`${clickedUnit.name}: ${clickedUnit.title}`);
        return;
      }
 
      if (
        !clickedUnit &&
        selectedUnit &&
        selectedUnit.team === "player" &&
        this.isMoveTile(tile.x, tile.y)
      ) {
        this.moveUnit(selectedUnit.id, tile.x, tile.y);
        return;
      }
 
      this.clearSelection();
    });
  }
 
  pointerToTile(pointerX, pointerY) {
    const localX = pointerX - this.boardX;
    const localY = pointerY - this.boardY;
 
    if (
      localX < 0 ||
      localY < 0 ||
      localX >= this.boardWidth ||
      localY >= this.boardHeight
    ) {
      return null;
    }
 
    return {
      x: Math.floor(localX / TILE_SIZE),
      y: Math.floor(localY / TILE_SIZE),
    };
  }
 
  getSelectedUnit() {
    return this.units.find((unit) => unit.id === this.selectedUnitId) || null;
  }
 
  getUnitAt(x, y) {
    return this.units.find((unit) => unit.x === x && unit.y === y && unit.hp > 0) || null;
  }
 
  isWalkable(x, y) {
    if (!this.isInBounds(x, y)) return false;
    return this.getTerrainAt(x, y) !== "wall";
  }
 
  reachableTiles(unit) {
    const queue = [{ x: unit.x, y: unit.y, steps: 0 }];
    const visited = new Set([tileKey(unit.x, unit.y)]);
    const reachable = [];
 
    while (queue.length > 0) {
      const current = queue.shift();
 
      for (const [dx, dy] of [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ]) {
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
  }
 
  attackableEnemies(unit) {
    return this.units.filter(
      (other) => other.team !== unit.team && other.hp > 0 && canAttack(unit, other)
    );
  }
 
  attackablePlayers(unit) {
    return this.units.filter(
      (other) => other.team !== unit.team && other.hp > 0 && canAttack(unit, other)
    );
  }
 
  isMoveTile(x, y) {
    return (this.moveTiles || []).some((tile) => {
      if (typeof tile === "string") {
        return tile === tileKey(x, y);
      }
 
      return tile.x === x && tile.y === y;
    });
  }
 
  isTargetTile(x, y) {
    return this.targetTiles.some((unit) => unit.x === x && unit.y === y);
  }
 
  openPreview(attacker, defender) {
    const attackerWeapon = getWeaponForTarget(attacker, defender);
    const defenderWeapon = getWeaponForTarget(defender, attacker) || getDefaultWeapon(defender);
 
    if (!attackerWeapon) return;
 
    const attackerDamage = this.calculateDamage(attacker, defender, attackerWeapon);
    const attackerHits = this.calculateAttackCount(attacker, defender, attackerWeapon);
    const attackerSpeed = this.getEffectiveSpeed(attacker, attackerWeapon);
    const attackerHitRate = attackerWeapon.hitRate ?? 100;
 
    const defenderDamage = defenderWeapon
      ? this.calculateDamage(defender, attacker, defenderWeapon)
      : 0;
    const defenderHits = defenderWeapon
      ? this.calculateAttackCount(defender, attacker, defenderWeapon)
      : 0;
    const defenderSpeed = defenderWeapon
      ? this.getEffectiveSpeed(defender, defenderWeapon)
      : defender.spd;
    const defenderHitRate = defenderWeapon?.hitRate ?? 100;
 
    this.previewData = {
      attackerId: attacker.id,
      defenderId: defender.id,
    };
 
    this.previewLeftName.setText(`${attacker.name} - ${attackerWeapon.name}`);
    this.previewLeftStats.setText(
      `HP ${attacker.hp}/${attacker.maxHp}\nDMG ${attackerDamage} x${attackerHits}\nHIT ${attackerHitRate}%\nSPD ${attackerSpeed}\nRNG ${getWeaponRangeLabel(attackerWeapon)}`
    );
 
    this.previewRightName.setText(`${defender.name} - ${defenderWeapon.name}`);
    this.previewRightStats.setText(
      `HP ${defender.hp}/${defender.maxHp}\nDMG ${defenderDamage} x${defenderHits}\nHIT ${defenderHitRate}%\nSPD ${defenderSpeed}\nRNG ${getWeaponRangeLabel(defenderWeapon)}`
    );
 
    this.previewOpen = true;
    this.previewContainer.setVisible(true);
    this.helpText.setText("Confirm or cancel the attack.");
  }
 
  closePreview() {
    this.previewOpen = false;
    this.previewData = null;
    this.previewContainer.setVisible(false);
    this.helpText.setText("Attack cancelled.");
  }
 
  confirmPreviewAttack() {
    if (!this.previewData) return;
 
    const { attackerId, defenderId } = this.previewData;
    this.previewOpen = false;
    this.previewData = null;
    this.previewContainer.setVisible(false);
    this.attackEnemy(attackerId, defenderId);
  }
 
  moveUnit(unitId, x, y) {
    const unit = this.units.find((u) => u.id === unitId);
    const sprite = this.unitSprites[unitId];
 
    if (!unit || !sprite) return;
 
    this.busy = true;
    unit.x = x;
    unit.y = y;
 
    const targetX = this.boardX + x * TILE_SIZE + TILE_SIZE / 2;
    const targetY = this.boardY + y * TILE_SIZE + TILE_SIZE / 2;
 
    this.tweens.add({
      targets: sprite.container,
      x: targetX,
      y: targetY,
      duration: 180,
      onComplete: () => {
        this.moveTiles = [];
        this.targetTiles = this.attackableEnemies(unit);
        this.redrawSelection();
        this.updateSelectedPanel();
 
        if (this.targetTiles.length > 0) {
          this.helpText.setText(`${unit.name} moved. Click a red enemy to attack.`);
          this.busy = false;
        } else {
          unit.acted = true;
          this.refreshUnitSprite(unit);
          this.clearSelection(`${unit.name} moved and waits.`);
          this.busy = false;
          this.checkEndOfPlayerPhase();
        }
      },
    });
  }
 
  attackEnemy(attackerId, defenderId) {
    const attacker = this.units.find((u) => u.id === attackerId);
    const defender = this.units.find((u) => u.id === defenderId);
 
    if (!attacker || !defender) return;
 
    const weapon = getWeaponForTarget(attacker, defender);
    if (!weapon) return;
 
    this.busy = true;
 
    const defenderWasAlive = defender.hp > 0;
    const sequence = this.resolveAttackSequence(attacker, defender, weapon);
 
    sequence.results.forEach((result, index) => {
      this.showCombatResultText(defender, result, index);
    });
 
    const didKill = defenderWasAlive && defender.hp <= 0;
    const xpGain = this.calculateXpGain(attacker, defender, didKill);
 
    if (xpGain > 0) {
      this.awardXp(attacker, xpGain);
    }
 
    attacker.acted = true;
    this.refreshUnitSprite(attacker);
 
    if (defender.hp <= 0) {
      const defenderSprite = this.unitSprites[defender.id];
 
      if (defenderSprite) {
        defenderSprite.container.destroy();
        delete this.unitSprites[defender.id];
      }
 
      this.units = this.units.filter((u) => u.id !== defender.id);
      this.clearSelection(`${attacker.name} defeated ${defender.name}!`);
    } else {
      this.refreshUnitSprite(defender);
      this.clearSelection(`${attacker.name} attacked ${defender.name} with ${weapon.name}.`);
    }
 
    this.updateSelectedPanel();
 
    if (!this.units.some((u) => u.id === "falan")) {
      this.stopBattleMusic();
 
      this.phaseText.setText("Victory");
      this.phaseText.setColor("#86efac");
      this.helpText.setText("Victory! Falan has been defeated.");
      this.busy = false;
      return;
    }
 
    this.time.delayedCall(250 + sequence.results.length * 140, () => {
      this.busy = false;
      this.checkEndOfPlayerPhase();
    });
  }
 
  clearSelection(message = "Click Edwin or Leon to select a unit.") {
    this.selectedUnitId = null;
    this.moveTiles = [];
    this.targetTiles = [];
    this.redrawSelection();
    this.updateSelectedPanel();
    this.helpText.setText(message);
  }
 
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
 
      const overlay = this.add.rectangle(
        x + TILE_SIZE / 2,
        y + TILE_SIZE / 2,
        TILE_SIZE - 10,
        TILE_SIZE - 10,
        0x38bdf8,
        0.35
      );
      overlay.setStrokeStyle(2, 0x7dd3fc, 0.95);
      this.overlayLayer.add(overlay);
    }
 
    for (const unit of this.targetTiles) {
      const x = this.boardX + unit.x * TILE_SIZE;
      const y = this.boardY + unit.y * TILE_SIZE;
 
      const overlay = this.add.rectangle(
        x + TILE_SIZE / 2,
        y + TILE_SIZE / 2,
        TILE_SIZE - 10,
        TILE_SIZE - 10,
        0xef4444,
        0.35
      );
      overlay.setStrokeStyle(2, 0xfda4af, 0.95);
      this.overlayLayer.add(overlay);
    }
  }
 
  updateSelectedPanel() {
    const unit = this.units.find((u) => u.id === this.selectedUnitId);
 
    if (!unit) {
      this.portraitImage.setVisible(false);
      this.portraitPlaceholder.setVisible(true);
      this.unitNameText.setText("None");
      this.unitClassText.setText("");
      this.levelXpText.setText("");
      this.xpBarFill.displayWidth = 0;
      this.unitStatsText.setText("");
      this.weaponText.setText("Select Edwin or Leon.");
      return;
    }
 
    if (unit.portraitKey && this.textures.exists(unit.portraitKey)) {
      this.portraitImage.setTexture(unit.portraitKey);
      this.portraitImage.setDisplaySize(96, 120);
      this.portraitImage.setVisible(true);
      this.portraitPlaceholder.setVisible(false);
    } else {
      this.portraitImage.setVisible(false);
      this.portraitPlaceholder.setVisible(true);
    }
 
    const level = unit.level || 1;
    const xp = unit.xp || 0;
    const weapon = getDefaultWeapon(unit);
    const terrain = this.getTerrainAt(unit.x, unit.y);
    const terrainBonus = this.getTerrainDefenseBonus(unit);
    const weaponSpeedBonus = this.getWeaponSpeedBonus(unit, weapon);
 
    const terrainLabel = terrain
      ? terrain.charAt(0).toUpperCase() + terrain.slice(1)
      : "Terrain";
    const defLine = terrainBonus > 0
      ? `DEF ${unit.def} +${terrainBonus} ${terrainLabel}`
      : `DEF ${unit.def}`;
    const spdLine = weaponSpeedBonus > 0
      ? `SPD ${unit.spd} +${weaponSpeedBonus} ${weapon.name}`
      : `SPD ${unit.spd}`;
 
    this.unitNameText.setText(unit.name);
    this.unitClassText.setText(
      `${unit.team === "enemy" ? "Enemy" : "Player"} • ${unit.title} • ${unit.className}`
    );
    this.levelXpText.setText(`Lv ${level} XP ${xp}/100`);
    this.xpBarFill.displayWidth = 210 * Phaser.Math.Clamp(xp / 100, 0, 1);
 
    this.unitStatsText.setText(
      `HP ${unit.hp}/${unit.maxHp}\nSTR ${unit.str}\nMAG ${unit.mag}\n${defLine}\nRES ${unit.res}\n${spdLine}\nMOV ${unit.move}`
    );
 
    this.weaponText.setText(
      weapon
        ? `Weapon: ${weapon.name} | Base ${weapon.baseDamage ?? weapon.damage ?? 0} | ${weapon.damageType || "physical"} | Hit ${weapon.hitRate ?? 100}% | Range ${getWeaponRangeLabel(weapon)}`
        : "Weapon: None"
    );
  }
 
  checkEndOfPlayerPhase() {
    const remaining = this.units.filter((u) => u.team === "player" && !u.acted);
    if (remaining.length === 0) this.startEnemyPhase();
  }
 
  startEnemyPhase() {
    this.phase = "enemy";
    this.phaseText.setText("Enemy Phase");
    this.phaseText.setColor("#fca5a5");
    this.helpText.setText("Enemies are moving...");
    this.clearSelection("Enemies are moving...");
    this.busy = true;
    this.enemyIndex = 0;
    this.enemyTurnOrder = this.units.filter((u) => u.team === "enemy");
    this.time.delayedCall(300, () => this.runNextEnemy());
  }
 
  runNextEnemy() {
    if (this.enemyIndex >= this.enemyTurnOrder.length) {
      this.startPlayerPhase();
      return;
    }
 
    const enemyRef = this.enemyTurnOrder[this.enemyIndex];
    const enemy = this.units.find((u) => u.id === enemyRef.id);
 
    if (!enemy) {
      this.enemyIndex += 1;
      this.runNextEnemy();
      return;
    }
 
    const targetsNow = this.attackablePlayers(enemy);
    if (targetsNow.length > 0) {
      this.enemyAttack(enemy, targetsNow[0]);
      return;
    }
 
    const nearest = this.getNearestPlayer(enemy);
    if (!nearest) {
      this.enemyIndex += 1;
      this.runNextEnemy();
      return;
    }
 
    const moveTarget = this.chooseEnemyMove(enemy, nearest);
    if (!moveTarget || (moveTarget.x === enemy.x && moveTarget.y === enemy.y)) {
      this.enemyIndex += 1;
      this.runNextEnemy();
      return;
    }
 
    const sprite = this.unitSprites[enemy.id];
    enemy.x = moveTarget.x;
    enemy.y = moveTarget.y;
 
    this.tweens.add({
      targets: sprite.container,
      x: this.boardX + enemy.x * TILE_SIZE + TILE_SIZE / 2,
      y: this.boardY + enemy.y * TILE_SIZE + TILE_SIZE / 2,
      duration: 180,
      onComplete: () => {
        const targetsAfterMove = this.attackablePlayers(enemy);
 
        if (targetsAfterMove.length > 0) {
          this.enemyAttack(enemy, targetsAfterMove[0]);
        } else {
          this.enemyIndex += 1;
          this.time.delayedCall(120, () => this.runNextEnemy());
        }
      },
    });
  }
 
  getNearestPlayer(enemy) {
    const players = this.units.filter((u) => u.team === "player");
    if (!players.length) return null;
 
    let nearest = players[0];
    let best = distance(enemy, players[0]);
 
    for (const player of players) {
      const d = distance(enemy, player);
      if (d < best) {
        best = d;
        nearest = player;
      }
    }
 
    return nearest;
  }
 
  chooseEnemyMove(enemy, target) {
    const options = this.reachableTiles(enemy);
    if (!options.length) return null;
 
    let best = { x: enemy.x, y: enemy.y };
    let bestScore = distance(enemy, target);
 
    for (const option of options) {
      const score = Math.abs(option.x - target.x) + Math.abs(option.y - target.y);
      if (score < bestScore) {
        best = option;
        bestScore = score;
      }
    }
 
    return best;
  }
 
  enemyAttack(attacker, defender) {
    const weapon = getWeaponForTarget(attacker, defender) || getDefaultWeapon(attacker);
    if (!weapon) {
      this.enemyIndex += 1;
      this.time.delayedCall(250, () => this.runNextEnemy());
      return;
    }
 
    const sequence = this.resolveAttackSequence(attacker, defender, weapon);
 
    sequence.results.forEach((result, index) => {
      this.showCombatResultText(defender, result, index);
    });
 
    if (defender.hp <= 0) {
      const defenderSprite = this.unitSprites[defender.id];
 
      if (defenderSprite) {
        defenderSprite.container.destroy();
        delete this.unitSprites[defender.id];
      }
 
      this.units = this.units.filter((u) => u.id !== defender.id);
 
      if (!this.units.some((u) => u.id === "edwin")) {
        this.stopBattleMusic();
 
        this.phaseText.setText("Defeat");
        this.phaseText.setColor("#f87171");
        this.helpText.setText("Defeat! Edwin has fallen.");
        this.busy = false;
        this.updateSelectedPanel();
        return;
      }
    } else {
      this.refreshUnitSprite(defender);
    }
 
    this.updateSelectedPanel();
    this.enemyIndex += 1;
    this.time.delayedCall(250 + sequence.results.length * 140, () => this.runNextEnemy());
  }
 
  startPlayerPhase() {
    this.phase = "player";
    this.phaseText.setText("Player Phase");
    this.phaseText.setColor("#93c5fd");
 
    for (const unit of this.units) {
      if (unit.team === "player") {
        unit.acted = false;
        this.refreshUnitSprite(unit);
      }
    }
 
    this.helpText.setText("Player Phase. Click Edwin or Leon.");
    this.busy = false;
  }
}
 
const config = {
  type: Phaser.AUTO,
  parent: "app",
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: "#0f172a",
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [BattleScene],
};
 
new Phaser.Game(config);
