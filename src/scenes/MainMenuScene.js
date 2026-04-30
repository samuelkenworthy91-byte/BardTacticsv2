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
import { createBannerButton, createBannerPanel, fitImageToBounds } from "../ui/banner.js";
export class MainMenuScene extends Phaser.Scene {
  constructor() {
    super("MainMenuScene");
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
      bg.setAlpha(0.45);
    }
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x06030b, 0.58);
    const panel = createBannerPanel(this, GAME_WIDTH / 2, GAME_HEIGHT / 2, 390, 250, { innerInset: 16 });
    const heading = this.add.text(0, -82, "Main Menu", {
      fontSize: "34px",
      fontStyle: "bold",
      color: "#f7ecd3",
      stroke: "#0b0811",
      strokeThickness: 4,
    }).setOrigin(0.5);
    const subtitle = this.add.text(0, -48, "Choose your path.", { fontSize: "16px", color: "#d8c4f0" }).setOrigin(0.5);
    const newGameButton = createBannerButton(this, 0, 12, 220, 48, "New Game", () => this.scene.start("LoadingScene", { loadFromSave: false }), "24px");
    const loadGameButton = createBannerButton(this, 0, 72, 220, 48, "Load Game", () => {
      this.scene.start("LoadGameScene");
    }, "24px");
    this.statusText = this.add.text(0, 118, "", { fontSize: "14px", color: "#f4d7d7", align: "center", wordWrap: { width: 280 } }).setOrigin(0.5, 0);
    panel.container.add([heading, subtitle, newGameButton.container, loadGameButton.container, this.statusText]);
  }
}
