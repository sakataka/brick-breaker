import Phaser from "phaser";

export class GameOverScene extends Phaser.Scene {
  static readonly KEY = "GameOverScene";

  constructor() {
    super(GameOverScene.KEY);
  }
}
