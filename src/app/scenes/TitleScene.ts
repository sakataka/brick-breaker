import Phaser from "phaser";

export class TitleScene extends Phaser.Scene {
  static readonly KEY = "TitleScene";

  constructor() {
    super(TitleScene.KEY);
  }
}
