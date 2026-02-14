import Phaser from "phaser";

export class PlayScene extends Phaser.Scene {
  static readonly KEY = "PlayScene";

  constructor() {
    super(PlayScene.KEY);
  }
}
