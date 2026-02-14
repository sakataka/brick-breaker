import Phaser from "phaser";
import type { RenderViewState } from "../../game/renderTypes";
import { PhaserRenderPort } from "../render/PhaserRenderPort";

export interface RuntimeSceneHandlers {
  onFrame: (timeMs: number) => void;
  onMove: (clientX: number) => void;
  onPauseToggle: () => void;
  onStartOrRestart: () => void;
  onCastMagic: () => void;
}

export class RuntimeScene extends Phaser.Scene {
  static readonly KEY = "RuntimeScene";

  private handlers: RuntimeSceneHandlers | null = null;
  private renderPort: PhaserRenderPort | null = null;
  private pendingView: RenderViewState | null = null;

  constructor() {
    super(RuntimeScene.KEY);
  }

  setHandlers(handlers: RuntimeSceneHandlers): void {
    this.handlers = handlers;
  }

  create(): void {
    this.renderPort = new PhaserRenderPort(this, {
      width: this.scale.gameSize.width,
      height: this.scale.gameSize.height,
    });
    if (this.pendingView) {
      this.renderPort.render(this.pendingView);
      this.pendingView = null;
    }
    this.input.on("pointermove", (pointer: Phaser.Input.Pointer) => {
      this.handlers?.onMove(extractPointerClientX(pointer));
    });
    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      if (pointer.rightButtonDown()) {
        this.handlers?.onCastMagic();
        return;
      }
      this.handlers?.onStartOrRestart();
    });
    this.input.keyboard?.on("keydown-P", () => {
      this.handlers?.onPauseToggle();
    });
    this.input.keyboard?.on("keydown-ENTER", () => {
      this.handlers?.onStartOrRestart();
    });
    this.input.keyboard?.on("keydown-SPACE", () => {
      this.handlers?.onStartOrRestart();
    });
  }

  update(time: number): void {
    this.handlers?.onFrame(time);
  }

  renderFrame(view: RenderViewState): void {
    if (!this.renderPort) {
      this.pendingView = view;
      return;
    }
    this.renderPort.render(view);
  }

  shutdown(): void {
    this.renderPort?.destroy();
    this.renderPort = null;
    this.pendingView = null;
  }
}

function extractPointerClientX(pointer: Phaser.Input.Pointer): number {
  const event = pointer.event;
  if (event && "clientX" in event && typeof event.clientX === "number") {
    return event.clientX;
  }
  return pointer.x;
}
