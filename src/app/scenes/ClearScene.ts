import Phaser from "phaser";

export class ClearScene extends Phaser.Scene {
  static readonly KEY = "ClearScene";

  constructor() {
    super(ClearScene.KEY);
  }
}
