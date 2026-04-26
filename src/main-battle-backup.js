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

const UNITS = [
  {
    id: "edwin",
    name: "Edwin",
    title: "Iceblade",
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
      { name: "Iceblade", damage: 6, range: 1 },
      { name: "Ice Sigil", damage: 7, range: 2 },
    ],
    acted: false,
    color: 0x60a5fa,
  },
  {
    id: "leon",
    name: "Leon",
    title: "Brawler",
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
    weapons: [{ name: "Fists", damage: 3, range: 1 }],
    acted: false,
    color: 0x38bdf8,
  },
  {
    id: "rook",
    name: "Rook",
    title: "Gang Leader",
    team: "enemy",
    className: "Leader",
    portraitKey: null,
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
    weapons: [{ name: "Pipe", damage: 5, range: 1 }],
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
    portraitKey: null,
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
    weapons: [{ name: "Chain", damage: 3, range: 1 }],
    acted: false,
    color: 0xfb7185,
  },
  {
    id: "thug2",
    name: "Thug",
    title: "White Hood",
    team: "enemy",
    className: "Thug",
    portraitKey: null,
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
    weapons: [{ name: "Bat", damage: 3, range: 1 }],
    acted: false,
    color: 0xfb7185,
  },
  {
    id: "thug3",
    name: "Thug",
    title: "White Hood",
    team: "enemy",
    className: "Thug",
    portraitKey: null,
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
    weapons: [{ name: "Pipe", damage: 3, range: 1 }],
    acted: false,
    color: 0xfb7185,
  },
  {
    id: "thug4",
    name: "Thug",
    title: "White Hood",
    team: "enemy",
    className: "Thug",
    portraitKey: null,
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
    weapons: [{ name: "Chain", damage: 3, range: 1 }],
    acted: false,
    color: 0xfb7185,
  },
];

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
  const dist = distance(attacker, defender);
  return attacker.weapons.find((weapon) => weapon.range === dist) || null;
}

function getDefaultWeapon(unit) {
  return unit.weapons[0];
}

function canAttack(attacker, defender) {
  return !!getWeaponForTarget(attacker, defender);
}

class BattleScene extends Phaser.Scene {
  constructor() {
    super("BattleScene");
  }

  preload() {
    this.load.image("edwinPortrait", "/portraits/edwin.jpg");
    this.load.image("leonPortrait", "/portraits/leon.jpg");
  }

  create() {
    this.units = UNITS.map((unit) => ({
      ...unit,
      weapons: unit.weapons.map((weapon) => ({ ...weapon })),
    }));

    this.selectedUnitId = null;
    this.moveTiles = [];
    this.targetTiles = [];
    this.unitSprites = {};
    this.phase = "player";
    this.busy = false;
    this.previewOpen = false;
    this.previewData = null;

    this.cameras.main.setBackgroundColor("#0f172a");

    this.boardWidth = MAP_COLS * TILE_SIZE;
    this.boardHeight = MAP_ROWS * TILE_SIZE;
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
    this.setupInput();
    this.updateSelectedPanel();
  }

  createTopUI() {
    this.add.text(24, 20, "Prologue - Alley Reunion", {
      fontSize: "26px",
      fontStyle: "bold",
      color: "#ffffff",
    });

    this.phaseText = this.add.text(24, 56, "Player Phase", {
      fontSize: "18px",
      fontStyle: "bold",
      color: "#93c5fd",
    });

    this.helpText = this.add.text(24, 88, "Click Edwin or Leon to select a unit.", {
      fontSize: "14px",
      color: "#cbd5e1",
      wordWrap: { width: 190 },
    });

    this.add.text(24, 470, "Objective", {
      fontSize: "18px",
      fontStyle: "bold",
      color: "#f8fafc",
    });

    this.add.text(24, 498, "Defeat Rook, the gang leader.", {
      fontSize: "14px",
      color: "#fcd34d",
      wordWrap: { width: 190 },
    });
  }

  createSidePanel() {
    const x = 672;
    const y = 96;

    const bg = this.add.rectangle(x + 120, y + 170, 248, 340, 0x111827, 0.92);
    bg.setStrokeStyle(2, 0x334155);

    const title = this.add.text(x + 16, y + 14, "Selected Unit", {
      fontSize: "20px",
      fontStyle: "bold",
      color: "#ffffff",
    });

    this.portraitFrame = this.add.rectangle(x + 64, y + 90, 96, 120, 0x1f2937);
    this.portraitFrame.setStrokeStyle(2, 0x475569);

    this.portraitImage = this.add.image(x + 64, y + 90, "edwinPortrait");
    this.portraitImage.setDisplaySize(96, 120);
    this.portraitImage.setVisible(false);

    this.portraitPlaceholder = this.add.text(x + 64, y + 90, "NO\nART", {
      fontSize: "20px",
      color: "#94a3b8",
      align: "center",
    }).setOrigin(0.5);

    this.unitNameText = this.add.text(x + 16, y + 164, "None", {
      fontSize: "22px",
      fontStyle: "bold",
      color: "#ffffff",
    });

    this.unitClassText = this.add.text(x + 16, y + 192, "", {
      fontSize: "14px",
      color: "#94a3b8",
    });

    this.unitStatsText = this.add.text(x + 16, y + 224, "", {
      fontSize: "14px",
      color: "#e2e8f0",
      lineSpacing: 6,
    });

    this.weaponText = this.add.text(x + 16, y + 308, "", {
      fontSize: "14px",
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
      if (this.previewOpen) {
        this.confirmPreviewAttack();
      }
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
      if (this.previewOpen) {
        this.closePreview();
      }
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

  drawBoard() {
    for (let row = 0; row < MAP_ROWS; row++) {
      for (let col = 0; col < MAP_COLS; col++) {
        const type = MAP[row][col];
        const x = this.boardX + col * TILE_SIZE;
        const y = this.boardY + row * TILE_SIZE;

        const tile = this.add.rectangle(
          x + TILE_SIZE / 2,
          y + TILE_SIZE / 2,
          TILE_SIZE - 2,
          TILE_SIZE - 2,
          tileColor(type)
        );
        tile.setStrokeStyle(1, 0x111827);

        const label = this.add.text(x + 6, y + 4, tileLabel(type), {
          fontSize: "12px",
          color: "#e5e7eb",
        });

        this.tileLayer.add(tile);
        this.tileLayer.add(label);
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

        if (clickedUnit.id === "edwin") {
          this.helpText.setText("Selected Edwin. Iceblade hits at 1 tile. Ice Sigil hits at 2 tiles.");
        } else {
          this.helpText.setText(`Selected ${clickedUnit.name}. Move or attack.`);
        }
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

      if (selectedUnit && this.isMoveTile(tile.x, tile.y)) {
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
    return this.units.find((unit) => unit.x === x && unit.y === y) || null;
  }

  isWalkable(x, y) {
    if (x < 0 || y < 0 || x >= MAP_COLS || y >= MAP_ROWS) return false;
    return MAP[y][x] !== "wall";
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
    return this.moveTiles.some((tile) => tile.x === x && tile.y === y);
  }

  isTargetTile(x, y) {
    return this.targetTiles.some((unit) => unit.x === x && unit.y === y);
  }

  openPreview(attacker, defender) {
    const attackerWeapon = getWeaponForTarget(attacker, defender);
    const defenderWeapon = getWeaponForTarget(defender, attacker) || getDefaultWeapon(defender);

    if (!attackerWeapon) return;

    this.previewData = {
      attackerId: attacker.id,
      defenderId: defender.id,
    };

    this.previewLeftName.setText(`${attacker.name} - ${attackerWeapon.name}`);
    this.previewLeftStats.setText(
      `HP ${attacker.hp}/${attacker.maxHp}\nDMG ${attackerWeapon.damage}\nRNG ${attackerWeapon.range}`
    );

    this.previewRightName.setText(`${defender.name} - ${defenderWeapon.name}`);
    this.previewRightStats.setText(
      `HP ${defender.hp}/${defender.maxHp}\nDMG ${defenderWeapon.damage}\nRNG ${defenderWeapon.range}`
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
    defender.hp -= weapon.damage;

    const damageText = this.add.text(
      this.boardX + defender.x * TILE_SIZE + 4,
      this.boardY + defender.y * TILE_SIZE + 8,
      `${weapon.name} -${weapon.damage}`,
      {
        fontSize: "14px",
        fontStyle: "bold",
        color: "#fca5a5",
      }
    );

    this.tweens.add({
      targets: damageText,
      y: damageText.y - 18,
      alpha: 0,
      duration: 600,
      onComplete: () => damageText.destroy(),
    });

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
      this.clearSelection(`${attacker.name} hit ${defender.name} with ${weapon.name}.`);
    }

    this.updateSelectedPanel();

    if (!this.units.some((u) => u.id === "rook")) {
      this.phaseText.setText("Victory");
      this.phaseText.setColor("#86efac");
      this.helpText.setText("Victory! Rook has been defeated.");
      this.busy = false;
      return;
    }

    this.time.delayedCall(250, () => {
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
    const selectedSprite = this.unitSprites[selectedUnit.id];
    selectedSprite.marker.setStrokeStyle(4, 0xfde68a);

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
    const unit = this.getSelectedUnit();

    if (!unit) {
      this.unitNameText.setText("None");
      this.unitClassText.setText("");
      this.unitStatsText.setText("Select Edwin or Leon.");
      this.weaponText.setText("");
      this.portraitImage.setVisible(false);
      this.portraitPlaceholder.setVisible(true);
      return;
    }

    this.unitNameText.setText(unit.name);
    this.unitClassText.setText(`${unit.title} • ${unit.className}`);

    this.unitStatsText.setText(
      `HP ${unit.hp}/${unit.maxHp}\nSTR ${unit.str}  MAG ${unit.mag}\nDEF ${unit.def}  RES ${unit.res}\nSPD ${unit.spd}  MOV ${unit.move}`
    );

    this.weaponText.setText(
      `Weapons: ${unit.weapons.map((w) => `${w.name} (${w.range})`).join(" | ")}`
    );

    if (unit.portraitKey && this.textures.exists(unit.portraitKey)) {
      this.portraitImage.setTexture(unit.portraitKey);
      this.portraitImage.setVisible(true);
      this.portraitPlaceholder.setVisible(false);
    } else {
      this.portraitImage.setVisible(false);
      this.portraitPlaceholder.setVisible(true);
    }
  }

  checkEndOfPlayerPhase() {
    const remaining = this.units.filter((u) => u.team === "player" && !u.acted);
    if (remaining.length === 0) {
      this.startEnemyPhase();
    }
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
    defender.hp -= weapon.damage;

    const damageText = this.add.text(
      this.boardX + defender.x * TILE_SIZE + 4,
      this.boardY + defender.y * TILE_SIZE + 8,
      `${weapon.name} -${weapon.damage}`,
      {
        fontSize: "14px",
        fontStyle: "bold",
        color: "#fca5a5",
      }
    );

    this.tweens.add({
      targets: damageText,
      y: damageText.y - 18,
      alpha: 0,
      duration: 600,
      onComplete: () => damageText.destroy(),
    });

    if (defender.hp <= 0) {
      const defenderSprite = this.unitSprites[defender.id];
      if (defenderSprite) {
        defenderSprite.container.destroy();
        delete this.unitSprites[defender.id];
      }

      this.units = this.units.filter((u) => u.id !== defender.id);

      if (!this.units.some((u) => u.id === "edwin")) {
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
    this.time.delayedCall(250, () => this.runNextEnemy());
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