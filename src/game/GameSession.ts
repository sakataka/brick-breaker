import type { ShopViewState } from "../app/store";
import { appStore } from "../app/store";
import type { GameHost } from "../phaser/GameHost";
import type { HudViewModel, OverlayViewModel } from "./renderTypes";
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
        syncShop: (view: unknown) => appStore.getState().setShop(view as ShopViewState),
      },
      getStartSettings: () => appStore.getState().startSettings,
      getRogueSelection: () => appStore.getState().rogueSelection,
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
