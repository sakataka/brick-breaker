import type { GameHost } from "../../phaser/GameHost";
import type { GameConfig, RandomSource, Scene } from "../public/types";
import type { BrickBreakerTestBridge } from "../public/testBridge";
import { createAppUiBridge } from "../adapters/storeBridge";
import {
  createRuntimeController,
  type RuntimeControllerFactory,
  type RuntimeControllerPort,
} from "./RuntimeController";

export interface GameSessionDeps {
  config?: Partial<GameConfig>;
  random?: RandomSource;
  documentRef?: Document;
  windowRef?: Window;
  host?: GameHost;
  controllerFactory?: RuntimeControllerFactory;
}

export class GameSession {
  private readonly controller: RuntimeControllerPort;

  constructor(canvas: HTMLCanvasElement, deps: GameSessionDeps = {}) {
    const { controllerFactory = createRuntimeController, ...runtimeDeps } = deps;
    this.controller = controllerFactory(canvas, {
      ...runtimeDeps,
      ...createAppUiBridge(),
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
    };
  }

  debugForceScene(scene: Scene): void {
    this.controller.forceSceneForTest(scene);
  }

  debugSetGameOverScore(score: number, lives?: number): void {
    this.controller.setGameOverScoreForTest(score, lives);
  }
}
