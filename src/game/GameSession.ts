import { appStore } from "../app/store";
import type { GameHost } from "../phaser/GameHost";
import type { HudViewModel, OverlayViewModel } from "./renderTypes";
import type { ShopUiView } from "./shopUi";
import { SessionController } from "./session/SessionController";
import type { GameConfig, RandomSource, Scene } from "./types";

export interface GameSessionDeps {
  config?: Partial<GameConfig>;
  random?: RandomSource;
  documentRef?: Document;
  windowRef?: Window;
  host?: GameHost;
}

export class GameSession {
  private readonly controller: SessionController;

  constructor(canvas: HTMLCanvasElement, deps: GameSessionDeps = {}) {
    this.controller = new SessionController(canvas, {
      ...deps,
      uiPort: {
        syncOverlay: (view: OverlayViewModel) => appStore.getState().setOverlayModel(view),
        syncHud: (view: HudViewModel) => appStore.getState().setHud(view),
        syncShop: (view: ShopUiView) => appStore.getState().setShop(view),
      },
      getStartSettings: () => appStore.getState().startSettings,
      setUiHandlers: (handlers) => appStore.getState().setHandlers(handlers),
      setMetaProgress: (metaProgress) => appStore.getState().setMetaProgress(metaProgress),
    });
  }

  start(): void {
    this.controller.start();
  }

  destroy(): void {
    this.controller.destroy();
  }

  debugForceScene(scene: Scene): void {
    this.controller.debugForceScene(scene);
  }

  debugSetGameOverScore(score: number, lives?: number): void {
    this.controller.debugSetGameOverScore(score, lives);
  }
}
