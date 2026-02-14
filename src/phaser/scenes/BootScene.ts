import Phaser from "phaser";
import { RuntimeScene } from "./RuntimeScene";

export class BootScene extends Phaser.Scene {
  static readonly KEY = "BootScene";

  constructor() {
    super(BootScene.KEY);
  }

  create(): void {
    this.scene.start(RuntimeScene.KEY);
  }
}
