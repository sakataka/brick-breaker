import Phaser from "phaser";
import type { RenderViewState } from "../game/renderTypes";
import { BootScene, RuntimeScene, type RuntimeSceneHandlers } from "./scenes";

export interface PhaserHostOptions {
  canvas: HTMLCanvasElement;
  width: number;
  height: number;
}

export class GameHost {
  private readonly runtimeScene = new RuntimeScene();
  private readonly game: Phaser.Game;

  constructor(options: PhaserHostOptions) {
    this.game = new Phaser.Game({
      type: Phaser.CANVAS,
      canvas: options.canvas,
      width: options.width,
      height: options.height,
      backgroundColor: "#000000",
      render: {
        pixelArt: false,
        antialias: true,
        clearBeforeRender: false,
      },
      scene: [new BootScene(), this.runtimeScene],
      physics: {
        default: "arcade",
      },
      scale: {
        mode: Phaser.Scale.NONE,
      },
    });
    options.canvas.addEventListener("contextmenu", preventContextMenu);
  }

  setHandlers(handlers: RuntimeSceneHandlers): void {
    this.runtimeScene.setHandlers(handlers);
  }

  render(view: RenderViewState): void {
    this.runtimeScene.renderFrame(view);
  }

  destroy(): void {
    this.game.canvas.removeEventListener("contextmenu", preventContextMenu);
    this.game.destroy(true);
  }
}

function preventContextMenu(event: MouseEvent): void {
  event.preventDefault();
}
