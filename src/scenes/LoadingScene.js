import Phaser from "phaser";
import {
  GAME_HEIGHT,
  GAME_WIDTH,
  LOADING_RUNNER_KEY,
  LOADING_RUNNER_PATH,
} from "../config/constants.js";
import { queueChapterAssets, queueImage } from "../data/assets.js";
import { createBannerPanel } from "../ui/banner.js";
import { getLevelForChapter, getSceneDataChapterNumber, isChapterTwoOrLater } from "../chapters/progression.js";
export class LoadingScene extends Phaser.Scene {
  constructor() {
    super("LoadingScene");
  }

  init(data = {}) {
    this.nextSceneData = data || {};
  }

  preload() {
    this.cameras.main.setBackgroundColor("#06030b");
    const centerX = GAME_WIDTH / 2;
    const centerY = GAME_HEIGHT / 2;
    const barX = 180;
    const barY = 318;
    const barWidth = 600;
    const barHeight = 8;
    this.add.rectangle(centerX, centerY, GAME_WIDTH, GAME_HEIGHT, 0x06030b, 1);
    const panel = createBannerPanel(this, centerX, centerY, 700, 250, { innerInset: 18 });
    const loadingText = this.add.text(0, -82, "Loading", {
      fontSize: "42px",
      fontStyle: "bold",
      color: "#f7ecd3",
      stroke: "#0b0811",
      strokeThickness: 5,
    }).setOrigin(0.5);
    const chapterNumber = getSceneDataChapterNumber(this.nextSceneData);
    const chapterLabel = isChapterTwoOrLater(chapterNumber) ? "Preparing Chapter 2: Owed an Explanation" : "Preparing Chapter 1: 4 Years Gone";
    const hintText = this.add.text(0, -42, chapterLabel, { fontSize: "16px", color: "#d8c4f0" }).setOrigin(0.5);
    panel.container.add([loadingText, hintText]);
    this.add.rectangle(barX + barWidth / 2, barY, barWidth, barHeight, 0x101828, 1).setStrokeStyle(2, 0xb6925f, 0.9);
    this.loadingTrail = this.add.rectangle(barX, barY, 1, barHeight, 0x38bdf8, 0.95).setOrigin(0, 0.5);
    this.loadingRunnerShadow = this.add.ellipse(barX, barY + 18, 52, 14, 0x000000, 0.38);
    if (this.textures.exists(LOADING_RUNNER_KEY)) {
      this.loadingRunner = this.add.image(barX, barY - 2, LOADING_RUNNER_KEY).setOrigin(0.5, 1);
      this.sizeLoadingRunnerSprite(this.loadingRunner);
    } else {
      this.loadingRunner = this.add.circle(barX, barY - 2, 14, 0x38bdf8, 1);
      this.loadingRunner.setStrokeStyle(2, 0xf7ecd3);
    }
    this.loadingPercentText = this.add.text(barX, barY - 116, "0%", {
      fontSize: "18px",
      fontStyle: "bold",
      color: "#f7ecd3",
      stroke: "#0b0811",
      strokeThickness: 4,
    }).setOrigin(0.5);
    this.loadingRunnerGlow = this.add.circle(barX, barY - 46, 28, 0x38bdf8, 0.12);
    this.updateLoadingDisplay(0, barX, barY, barWidth);
    this.load.on("filecomplete-image-" + LOADING_RUNNER_KEY, () => {
      if (this.loadingRunner?.destroy) this.loadingRunner.destroy();
      this.loadingRunner = this.add.image(barX, barY - 2, LOADING_RUNNER_KEY).setOrigin(0.5, 1);
      this.sizeLoadingRunnerSprite(this.loadingRunner);
      this.updateLoadingDisplay(this.currentLoadingProgress || 0, barX, barY, barWidth);
    });
    this.load.on("progress", (value) => this.updateLoadingDisplay(value, barX, barY, barWidth));
    this.load.once("complete", () => this.updateLoadingDisplay(1, barX, barY, barWidth));
    queueImage(this, LOADING_RUNNER_KEY, LOADING_RUNNER_PATH);
    const targetLevel = getLevelForChapter(chapterNumber);
    queueChapterAssets(this, targetLevel);
  }

  sizeLoadingRunnerSprite(sprite) {
    if (!sprite || !this.textures.exists(LOADING_RUNNER_KEY)) return;
    const source = this.textures.get(LOADING_RUNNER_KEY)?.getSourceImage();
    const sourceHeight = source?.height || 96;
    const maxHeight = 112;
    const scale = sourceHeight > maxHeight ? maxHeight / sourceHeight : 1;
    sprite.setScale(scale);
  }

  updateLoadingDisplay(value, barX, barY, barWidth) {
    const progress = Phaser.Math.Clamp(value || 0, 0, 1);
    this.currentLoadingProgress = progress;
    const runnerX = barX + barWidth * progress;
    const percent = Math.round(progress * 100);
    if (this.loadingTrail) this.loadingTrail.displayWidth = Math.max(1, barWidth * progress);
    if (this.loadingRunner) {
      this.loadingRunner.x = runnerX;
      this.loadingRunner.y = barY - 2;
    }
    if (this.loadingRunnerShadow) {
      this.loadingRunnerShadow.x = runnerX;
      this.loadingRunnerShadow.y = barY + 18;
    }
    if (this.loadingRunnerGlow) {
      this.loadingRunnerGlow.x = runnerX;
      this.loadingRunnerGlow.y = barY - 46;
    }
    if (this.loadingPercentText) {
      this.loadingPercentText.x = runnerX;
      this.loadingPercentText.y = barY - 116;
      this.loadingPercentText.setText(`${percent}%`);
    }
  }

  create() {
    this.time.delayedCall(350, () => this.scene.start("BattleScene", this.nextSceneData || {}));
  }
}
