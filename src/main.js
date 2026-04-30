import Phaser from "phaser";
import { GAME_HEIGHT, GAME_WIDTH } from "./config/constants.js";
import { LoadingScene } from "./scenes/LoadingScene.js";
import { TitleScene } from "./scenes/TitleScene.js";
import { MainMenuScene } from "./scenes/MainMenuScene.js";
import { LoadGameScene } from "./scenes/LoadGameScene.js";
import { BattleScene } from "./scenes/BattleScene.js";

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
  scene: [TitleScene, MainMenuScene, LoadGameScene, LoadingScene, BattleScene],
};

new Phaser.Game(config);
