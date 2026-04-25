import * as Phaser from "phaser";
import { getAllArtTextureEntries } from "../../art/visualAssets";
import { RuntimeScene } from "./RuntimeScene";

export class BootScene extends Phaser.Scene {
  static readonly KEY = "BootScene";

  constructor() {
    super(BootScene.KEY);
  }

  preload(): void {
    for (const texture of getAllArtTextureEntries()) {
      if (this.textures.exists(texture.key)) {
        continue;
      }
      this.load.image(texture.key, texture.dataUri);
    }
  }

  create(): void {
    this.scene.start(RuntimeScene.KEY);
  }
}
