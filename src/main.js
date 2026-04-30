import Phaser from "phaser";
import { GAME_HEIGHT, GAME_WIDTH } from "./config/constants.js";
import { LoadingScene } from "./scenes/LoadingScene.js";
import { TitleScene } from "./scenes/TitleScene.js";
import { MainMenuScene } from "./scenes/MainMenuScene.js";
import { LoadGameScene } from "./scenes/LoadGameScene.js";
import { BattleScene } from "./scenes/BattleScene.js";
import { isChapterTwoOrLater } from "./chapters/progression.js";
import { tileKey } from "./utils/grid.js";

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
    if (isChapterTwoOrLater(this.currentChapterNumber)) {
      this.chapterTwoTurns = (this.chapterTwoTurns || 0) + 1;
      if (!this.chapterTwoSetupDone) this.beginChapterTwoSetupIfNeeded();
      if (this.chapterTwoSetupDone && this.chapterTwoTurns % 2 === 0) {
        const captured = this.capturedForts || new Set();
        const forts = this.getChapterTwoFortTiles().filter((tile) => !captured.has(tileKey(tile.x, tile.y)));
        if (forts.length > 0) {
          const fort = Phaser.Utils.Array.GetRandom(forts);
          const spawnCandidates = [
            { x: fort.x, y: fort.y + 1 },
            { x: fort.x - 1, y: fort.y },
            { x: fort.x + 1, y: fort.y },
          ].filter((tile) => this.isInBounds(tile.x, tile.y) && this.isWalkable(tile.x, tile.y) && !this.getUnitAt(tile.x, tile.y));
          if (spawnCandidates.length > 0) {
            const spawnTile = Phaser.Utils.Array.GetRandom(spawnCandidates);
            this.spawnShadeAt(spawnTile.x, spawnTile.y, 2);
            this.helpText.setText("A Shade clone appears near an uncaptured fort!");
          }
        }
      }
    }
