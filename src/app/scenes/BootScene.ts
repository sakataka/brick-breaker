import Phaser from "phaser";

export class BootScene extends Phaser.Scene {
  static readonly KEY = "BootScene";

  constructor() {
    super(BootScene.KEY);
  }

  create(): void {
    this.scene.start(TitleSceneKey);
  }
}

export const TitleSceneKey = "TitleScene";
