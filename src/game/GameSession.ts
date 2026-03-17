import { appStore } from "../app/store";
import type { MetaProgress } from "./metaProgress";
import type { GameHost } from "../phaser/GameHost";
import type { HudViewModel, OverlayViewModel } from "./renderTypes";
import type { ShopUiView } from "./shopUi";
import { RuntimeController } from "./session/RuntimeController";
import type { BrickBreakerTestBridge, GameTestScenario } from "./testBridge";
import type { GameConfig, RandomSource, Scene } from "./types";

export interface GameSessionDeps {
  config?: Partial<GameConfig>;
  random?: RandomSource;
  documentRef?: Document;
  windowRef?: Window;
  host?: GameHost;
}

export class GameSession {
  private readonly controller: RuntimeController;

  constructor(canvas: HTMLCanvasElement, deps: GameSessionDeps = {}) {
    this.controller = new RuntimeController(canvas, {
      ...deps,
      uiPort: {
        syncOverlay: (view: OverlayViewModel) => appStore.getState().setOverlayModel(view),
        syncHud: (view: HudViewModel) => appStore.getState().setHud(view),
        syncShop: (view: ShopUiView) => appStore.getState().setShop(view),
      },
      getStartSettings: () => appStore.getState().startSettings,
      setUiHandlers: (handlers: {
        primaryAction: () => void;
        shopOption: (index: 0 | 1) => void;
      }) => appStore.getState().setHandlers(handlers),
      setMetaProgress: (metaProgress: MetaProgress) =>
        appStore.getState().setMetaProgress(metaProgress),
    });
  }

  start(): void {
    this.controller.start();
  }

  destroy(): void {
    this.controller.destroy();
  }

  createTestBridge(): BrickBreakerTestBridge {
    return {
      forceScene: (scene) => this.controller.forceSceneForTest(scene),
      setGameOverScore: (score, lives) => this.controller.setGameOverScoreForTest(score, lives),
      unlockThreatTier2: () => this.controller.unlockThreatTier2ForTest(),
      loadScenario: (scenario) => this.controller.loadScenarioForTest(scenario),
    };
  }

  debugForceScene(scene: Scene): void {
    this.controller.forceSceneForTest(scene);
  }

  debugSetGameOverScore(score: number, lives?: number): void {
    this.controller.setGameOverScoreForTest(score, lives);
  }

  debugLoadScenario(scenario: GameTestScenario): void {
    this.controller.loadScenarioForTest(scenario);
  }
}
