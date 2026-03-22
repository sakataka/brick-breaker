import type { CoreEngine } from "../../core/engine";
import type { AudioPort } from "../../core/ports";
import type { SfxManager } from "../../audio/sfx";
import type { GameHost } from "../../phaser/GameHost";
import { assertValidGameContent } from "../content/validation";
import type { LifecycleController } from "../lifecycle";
import { clamp } from "../math";
import { type SceneEvent, SceneMachine } from "../sceneMachine";
import { applySceneTransition, type SceneTransitionResult } from "../sceneSync";
import type {
  GameAudioSettings,
  GameConfig,
  GameState,
  RandomSource,
  RuntimeErrorKey,
  Scene,
} from "../types";
import { SessionActionDispatcher } from "./sessionActionDispatcher";
import { initializeRuntimeSession } from "./runtimeBootstrap";
import { runRuntimeFrame } from "./runtimeLoop";
import { createRuntimeComposition, type RuntimeControllerDeps } from "./runtimeComposition";
import { SessionPorts } from "./SessionPorts";
import { resolveSessionStartSettings, runSafely as runSessionSafely } from "./sessionFlow";
import { SessionTestBridge } from "./sessionTestBridge";
import { SessionViewportController } from "./sessionViewportController";
import { purchaseShopOption } from "./shopActions";

export type { RuntimeControllerDeps } from "./runtimeComposition";

export class RuntimeController {
  private readonly baseRandom: RandomSource;
  private readonly baseConfig: GameConfig;
  private config: GameConfig;
  private readonly audioPort: AudioPort;
  private readonly ports: SessionPorts;
  private readonly sfx: SfxManager;
  private readonly host: GameHost;
  private random: RandomSource;
  private readonly sceneMachine: SceneMachine;
  private readonly windowRef: Window;
  private readonly lifecycle: LifecycleController;
  private readonly actionDispatcher: SessionActionDispatcher;
  private readonly viewportController: SessionViewportController;
  private readonly testBridge: SessionTestBridge;
  private state: GameState;
  private readonly engine: CoreEngine;
  private audioSettings: GameAudioSettings = {
    bgmEnabled: true,
    sfxEnabled: true,
  };
  private pendingStartStageIndex = 0;
  private isRunning = false;
  private destroyed = false;

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly deps: RuntimeControllerDeps,
  ) {
    assertValidGameContent();

    const composition = createRuntimeComposition(this.canvas, this.deps, {
      transition: (event) => this.transition(event),
      syncAudioForTransition: (result) => this.syncAudioForTransition(result),
      publishState: () => this.publishState(),
    });
    this.baseRandom = composition.baseRandom;
    this.baseConfig = composition.baseConfig;
    this.config = composition.refs.config;
    this.random = composition.refs.random;
    this.audioSettings = composition.refs.audioSettings;
    this.pendingStartStageIndex = composition.refs.pendingStartStageIndex;
    this.windowRef = composition.windowRef;
    this.host = composition.host;
    this.audioPort = composition.audioPort;
    this.ports = composition.ports;
    this.sfx = composition.sfx;
    this.sceneMachine = composition.sceneMachine;
    this.lifecycle = composition.lifecycle;
    this.actionDispatcher = composition.actionDispatcher;
    this.viewportController = composition.viewportController;
    this.state = composition.state;
    this.engine = composition.engine;
    this.testBridge = new SessionTestBridge({
      state: this.state,
      sceneMachine: this.sceneMachine,
      windowRef: this.windowRef,
      ports: this.ports,
      engine: this.engine,
      getConfig: () => this.config,
      getRandom: () => this.random,
      publishState: () => this.publishState(),
    });

    this.runSafely(() => this.initializeSession(), "initialization");
  }

  start(): void {
    if (this.destroyed || this.isRunning || this.state.scene === "error") {
      return;
    }
    this.runSafely(() => {
      this.isRunning = true;
      this.publishState();
    }, "gameStart");
  }

  destroy(): void {
    if (this.destroyed) {
      return;
    }
    this.destroyed = true;
    this.isRunning = false;
    this.lifecycle.unbind();
    this.viewportController.unbindA11yListeners();
    this.ports.destroy();
    this.host.destroy();
    this.sceneMachine.stop();
  }

  forceSceneForTest(scene: Scene): void {
    this.testBridge.forceScene(scene);
  }

  setGameOverScoreForTest(score: number, lives = this.state.run.lives): void {
    this.testBridge.setGameOverScore(score, lives);
  }

  unlockThreatTier2ForTest(): void {
    this.testBridge.unlockThreatTier2();
  }

  loadScenarioForTest(scenario: import("../testBridge").GameTestScenario): void {
    this.testBridge.loadScenario(scenario);
  }

  private initializeSession(): void {
    initializeRuntimeSession({
      deps: this.deps,
      host: this.host,
      lifecycle: this.lifecycle,
      windowRef: this.windowRef,
      destroyed: this.destroyed,
      ports: this.ports,
      state: this.state,
      audioSettings: this.audioSettings,
      bindA11yListeners: () => this.viewportController.bindA11yListeners(),
      adjustCanvasScale: () => this.viewportController.adjustCanvasScale(),
      publishState: () => this.publishState(),
      backToStart: () => this.actionDispatcher.backToStart(),
      startOrResume: () => this.startOrResume(),
      purchaseShopOption: (index) => this.purchaseShopOption(index),
      runSafely: (action, key) => this.runSafely(action, key),
      togglePause: () => this.actionDispatcher.togglePause(),
      castMagic: () => this.castMagic(),
      onFrame: (timeMs) => this.loop(timeMs),
      onMove: (clientX) => this.movePaddleByMouse(clientX),
    });
  }

  private startOrResume(): void {
    if (this.state.scene === "start") {
      this.applyStartSettings();
    }
    this.actionDispatcher.startOrResume(this.config, this.random, this.pendingStartStageIndex);
  }

  private transition(event: SceneEvent): SceneTransitionResult {
    return applySceneTransition(this.state, this.sceneMachine, event);
  }

  private loop = (timeMs: number): void => {
    runRuntimeFrame(timeMs, {
      state: this.state,
      config: this.config,
      random: this.random,
      sfx: this.sfx,
      audioPort: this.audioPort,
      engine: this.engine,
      isRunning: this.isRunning,
      destroyed: this.destroyed,
      syncViewportForDpi: () => this.viewportController.syncViewportForDpi(),
      publishState: () => this.publishState(),
      handleStageClear: () => this.actionDispatcher.handleStageClear(),
      handleBallLoss: () => this.actionDispatcher.handleBallLoss(),
      setRuntimeError: (key, detail) => this.setRuntimeError(key, detail),
    });
  };

  private movePaddleByMouse(clientX: number): void {
    const rect = this.canvas.getBoundingClientRect();
    if (rect.width <= 0) {
      return;
    }
    const worldX = (clientX - rect.left) * (this.config.width / rect.width);
    this.state.combat.paddle.x = clamp(
      worldX - this.state.combat.paddle.width / 2,
      0,
      this.config.width - this.state.combat.paddle.width,
    );
  }

  private castMagic(): void {
    if (this.state.scene !== "playing") {
      return;
    }
    this.state.combat.magic.requestCast = true;
  }

  private purchaseShopOption(index: 0 | 1): void {
    const picked = purchaseShopOption(this.state, index, this.config, this.random);
    if (!picked) {
      return;
    }
    this.audioPort.playItemPickup(picked);
    this.publishState();
  }

  private runSafely(action: () => void, fallbackMessage: RuntimeErrorKey): void {
    runSessionSafely(action, (key, detail) => this.setRuntimeError(key, detail), fallbackMessage);
  }

  private setRuntimeError(key: RuntimeErrorKey, detail?: string): void {
    this.isRunning = false;
    this.state.ui.error = {
      key,
      detail,
    };
    const result = this.transition({ type: "RUNTIME_ERROR" });
    this.syncAudioForTransition(result);
    try {
      this.publishState();
    } catch {}
  }

  private applyStartSettings(): void {
    const applied = resolveSessionStartSettings(
      this.state,
      this.baseConfig,
      this.baseRandom,
      this.deps.getStartSettings(),
    );
    this.config = applied.config;
    this.random = applied.random;
    this.audioSettings = applied.audioSettings;
    this.pendingStartStageIndex = applied.pendingStartStageIndex;
    this.ports.setAudioSettings(this.audioSettings);
  }

  private syncAudioForTransition(result: SceneTransitionResult): void {
    this.ports.syncAudioScene(result.previous, result.next, this.state);
  }

  private publishState(): void {
    this.ports.publish(this.state);
  }
}
