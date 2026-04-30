import Phaser from "phaser";
import {
  GAME_HEIGHT,
  GAME_WIDTH,
  LOADING_RUNNER_KEY,
  LOADING_RUNNER_PATH,
  SAVE_SLOT_COUNT,
  TITLE_SCREEN_KEY,
  TITLE_SCREEN_PATH,
} from "../config/constants.js";
import { queueImage } from "../data/assets.js";
import { getSaveSlotLabel, readSaveSlot } from "../utils/saveSlots.js";
import { createBannerButton, createBannerPanel, fitImageToBounds } from "../ui/banner.js";
export class LoadGameScene extends Phaser.Scene {
  constructor() {
    super("LoadGameScene");
  }

  init(data = {}) {
    this.fromGameOver = data.fromGameOver === true;
    this.defeatedUnitName = data.defeatedUnitName || "";
  }

  preload() {
    queueImage(this, TITLE_SCREEN_KEY, TITLE_SCREEN_PATH);
    queueImage(this, LOADING_RUNNER_KEY, LOADING_RUNNER_PATH);
  }

  create() {
    this.cameras.main.setBackgroundColor("#06030b");

    if (this.textures.exists(TITLE_SCREEN_KEY)) {
      const bg = this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, TITLE_SCREEN_KEY);
      fitImageToBounds(this, bg, TITLE_SCREEN_KEY, GAME_WIDTH, GAME_HEIGHT, true);
      bg.setAlpha(0.36);
    }

    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x06030b, 0.68);

    const panelHeight = this.fromGameOver ? 388 : 342;
    const panel = createBannerPanel(this, GAME_WIDTH / 2, GAME_HEIGHT / 2, 640, panelHeight, { innerInset: 16 });

    const heading = this.add.text(0, -panelHeight / 2 + 42, this.fromGameOver ? "Game Over" : "Load Game", {
      fontSize: this.fromGameOver ? "34px" : "32px",
      fontStyle: "bold",
      color: this.fromGameOver ? "#fca5a5" : "#f7ecd3",
      stroke: "#0b0811",
      strokeThickness: 5,
    }).setOrigin(0.5);

    const subText = this.fromGameOver
      ? `${this.defeatedUnitName || "An ally"} has fallen. Choose a save slot to load.`
      : "Choose one of your three save slots.";

    const subtitle = this.add.text(0, -panelHeight / 2 + 82, subText, {
      fontSize: "15px",
      color: "#d8c4f0",
      align: "center",
      wordWrap: { width: 560 },
    }).setOrigin(0.5);

    this.statusText = this.add.text(0, panelHeight / 2 - 54, "", {
      fontSize: "14px",
      color: "#f4d7d7",
      align: "center",
      wordWrap: { width: 540 },
    }).setOrigin(0.5);

    panel.container.add([heading, subtitle, this.statusText]);

    for (let slotNumber = 1; slotNumber <= SAVE_SLOT_COUNT; slotNumber += 1) {
      const saveData = readSaveSlot(slotNumber);
      const button = createBannerButton(this, 0, -panelHeight / 2 + 128 + (slotNumber - 1) * 54, 540, 42, getSaveSlotLabel(slotNumber), () => {
        const selectedSave = readSaveSlot(slotNumber);
        if (!selectedSave) {
          this.statusText.setText(`Slot ${slotNumber} is empty.`);
          return;
        }
        this.scene.start("LoadingScene", { loadFromSave: true, saveData: selectedSave, slotNumber });
      }, "13px");

      button.container.setAlpha(saveData ? 1 : 0.55);
      panel.container.add(button.container);
    }

    const backButton = createBannerButton(this, 0, panelHeight / 2 - 18, 180, 34, "Back", () => this.scene.start("MainMenuScene"), "16px");
    panel.container.add(backButton.container);
  }
}
