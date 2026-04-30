import Phaser from "phaser";
import {
  GAME_HEIGHT,
  GAME_WIDTH,
  LOADING_RUNNER_KEY,
  LOADING_RUNNER_PATH,
  TITLE_SCREEN_KEY,
  TITLE_SCREEN_PATH,
} from "../config/constants.js";
import { queueImage } from "../data/assets.js";
import { createBannerPanel, fitImageToBounds } from "../ui/banner.js";
export class TitleScene extends Phaser.Scene {
  constructor() {
    super("TitleScene");
  }

  preload() {
    queueImage(this, TITLE_SCREEN_KEY, TITLE_SCREEN_PATH);
    queueImage(this, LOADING_RUNNER_KEY, LOADING_RUNNER_PATH);
  }

  create() {
    this.cameras.main.setBackgroundColor("#06030b");
    if (this.textures.exists(TITLE_SCREEN_KEY)) {
      const splash = this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, TITLE_SCREEN_KEY);
      fitImageToBounds(this, splash, TITLE_SCREEN_KEY, GAME_WIDTH, GAME_HEIGHT, true);
    } else {
      this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x09050f, 1);
      this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 10, "The Bards: Tactics", {
        fontSize: "46px",
        fontStyle: "bold",
        color: "#f7ecd3",
        stroke: "#0b0811",
        strokeThickness: 6,
      }).setOrigin(0.5);
    }
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.12);
    const promptPanel = createBannerPanel(this, GAME_WIDTH / 2, GAME_HEIGHT - 42, 300, 48, { innerInset: 12 });
    const promptText = this.add.text(0, 0, "Click to Start", {
      fontSize: "24px",
      fontStyle: "bold",
      color: "#f7ecd3",
      stroke: "#0b0811",
      strokeThickness: 4,
    }).setOrigin(0.5);
    promptPanel.container.add(promptText);
    this.tweens.add({ targets: promptPanel.container, alpha: 0.45, duration: 800, yoyo: true, repeat: -1 });
    this.input.once("pointerdown", () => this.scene.start("MainMenuScene"));
  }
}
