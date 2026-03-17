import { AudioDirector } from "../../audio/audioDirector";
import { SfxManager } from "../../audio/sfx";
import { CoreEngine } from "../../core/engine";
import type { AudioPort, RenderPort, UiPort } from "../../core/ports";
import { GameHost } from "../../phaser/GameHost";
import { readAccessibility } from "../a11y";
import { GAME_CONFIG } from "../config";
import { assertValidGameContent } from "../content/validation";
import { LifecycleController } from "../lifecycle";
import { clamp } from "../math";
import { readMetaProgress, type MetaProgress } from "../metaProgress";
import { defaultRandomSource } from "../random";
import type { HudViewModel, OverlayViewModel, RenderViewState } from "../renderTypes";
import { syncRecordStateFromMeta } from "../scoreSystem";
import { type SceneEvent, SceneMachine } from "../sceneMachine";
import { applySceneTransition, type SceneTransitionResult } from "../sceneSync";
import type { StartSettingsSelection } from "../startSettingsSchema";
import { createInitialGameState } from "../stateFactory";
import type { ShopUiView } from "../shopUi";
import type {
  GameAudioSettings,
  GameConfig,
  GameState,
  RandomSource,
  RuntimeErrorKey,
  Scene,
} from "../types";
import { initializeRuntimeSession } from "./runtimeBootstrap";
import { runRuntimeFrame } from "./runtimeLoop";
import {
  forceSceneForTest,
  loadScenarioForTest,
  setGameOverScoreForTest,
  unlockThreatTier2ForTest,
} from "./runtimeTestSupport";
import { SessionPorts } from "./SessionPorts";
import {
  handleBallLossSession,
  handleStageClearSession,
  resolveSessionStartSettings,
  runSafely as runSessionSafely,
  startOrResumeSession,
} from "./sessionFlow";
import { applySessionViewport } from "./sessionViewport";
import { purchaseShopOption } from "./shopActions";

export interface RuntimeControllerDeps {
  config?: Partial<GameConfig>;
  random?: RandomSource;
  documentRef?: Document;
  windowRef?: Window;
  host?: GameHost;
  renderPort?: RenderPort<RenderViewState>;
  uiPort: UiPort<OverlayViewModel, HudViewModel, ShopUiView>;
  getStartSettings: () => StartSettingsSelection;
  setUiHandlers: (handlers: {
    primaryAction: () => void;
    shopOption: (index: 0 | 1) => void;
  }) => void;
  setMetaProgress: (metaProgress: MetaProgress) => void;
}

export class RuntimeController {
  private readonly baseRandom: RandomSource;
  private readonly baseConfig: GameConfig;
  private config: GameConfig;
  private readonly renderPort: RenderPort<RenderViewState>;
  private readonly uiPort: UiPort<OverlayViewModel, HudViewModel, ShopUiView>;
  private readonly audioPort: AudioPort;
  private readonly ports: SessionPorts;
  private readonly sfx = new SfxManager();
  private readonly audioDirector = new AudioDirector(this.sfx);
  private readonly host: GameHost;
  private random: RandomSource;
  private readonly sceneMachine = new SceneMachine();
  private readonly documentRef: Document;
  private readonly windowRef: Window;
  private readonly lifecycle: LifecycleController;
  private readonly reducedMotionQuery: MediaQueryList;
  private readonly highContrastQuery: MediaQueryList;
  private state: GameState;
  private readonly engine: CoreEngine;
  private lastDevicePixelRatio = 1;
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
    this.baseConfig = { ...GAME_CONFIG, ...deps.config };
    this.config = { ...this.baseConfig };
    this.baseRandom = deps.random ?? defaultRandomSource;
    this.random = this.baseRandom;
    this.documentRef = deps.documentRef ?? document;
    this.windowRef = deps.windowRef ?? window;
    this.reducedMotionQuery = this.windowRef.matchMedia("(prefers-reduced-motion: reduce)");
    this.highContrastQuery = this.windowRef.matchMedia("(prefers-contrast: more)");
    this.host =
      deps.host ??
      new GameHost({
        canvas: this.canvas,
        width: this.baseConfig.width,
        height: this.baseConfig.height,
        zoom: Math.max(1, Math.min(2, this.windowRef.devicePixelRatio || 1)),
      });
    this.renderPort = deps.renderPort ?? {
      render: (view) => this.host.render(view),
    };
    this.uiPort = deps.uiPort;
    this.audioPort = this.audioDirector;
    this.ports = new SessionPorts({
      renderPort: this.renderPort,
      uiPort: this.uiPort,
      audioPort: this.audioPort,
      setMetaProgress: deps.setMetaProgress,
    });

    const a11y = readAccessibility(this.windowRef);
    this.state = createInitialGameState(
      this.config,
      a11y.reducedMotion,
      this.sceneMachine.value,
      a11y.highContrast,
    );
    syncRecordStateFromMeta(this.state, readMetaProgress(this.windowRef.localStorage));
    this.engine = new CoreEngine(
      this.state,
      () => this.config,
      () => this.random,
    );
    this.lifecycle = new LifecycleController(
      this.documentRef,
      this.canvas.parentElement,
      () => this.state.scene === "playing" && this.togglePause(),
      () => this.adjustCanvasScale(),
    );

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
    this.unbindA11yListeners();
    this.ports.destroy();
    this.host.destroy();
    this.sceneMachine.stop();
  }

  forceSceneForTest(scene: Scene): void {
    forceSceneForTest(scene, this.createTestContext());
  }

  setGameOverScoreForTest(score: number, lives = this.state.run.lives): void {
    setGameOverScoreForTest(score, lives, this.createTestContext());
  }

  unlockThreatTier2ForTest(): void {
    unlockThreatTier2ForTest(this.createTestContext());
  }

  loadScenarioForTest(scenario: import("../testBridge").GameTestScenario): void {
    loadScenarioForTest(scenario, this.createTestContext());
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
      bindA11yListeners: () => this.bindA11yListeners(),
      adjustCanvasScale: () => this.adjustCanvasScale(),
      publishState: () => this.publishState(),
      backToStart: () => this.backToStart(),
      startOrResume: () => this.startOrResume(),
      purchaseShopOption: (index) => this.purchaseShopOption(index),
      runSafely: (action, key) => this.runSafely(action, key),
      togglePause: () => this.togglePause(),
      castMagic: () => this.castMagic(),
      onFrame: (timeMs) => this.loop(timeMs),
      onMove: (clientX) => this.movePaddleByMouse(clientX),
    });
  }

  private startOrResume(): void {
    if (this.state.scene === "start") {
      this.applyStartSettings();
    }
    startOrResumeSession({
      state: this.state,
      config: this.config,
      random: this.random,
      audioPort: this.audioPort,
      engine: this.engine,
      pendingStartStageIndex: this.pendingStartStageIndex,
      transition: (event) => this.transition(event),
      syncAudioForTransition: (result) => this.syncAudioForTransition(result),
      syncViewPorts: () => this.publishState(),
      setMetaProgress: (metaProgress) => this.ports.setMetaProgress(metaProgress),
    });
  }

  private togglePause(): void {
    void this.audioPort.unlock().catch(() => {});
    const result = this.transition({ type: "TOGGLE_PAUSE" });
    if (result.previous === "paused" && result.next === "playing") {
      this.engine.resetClock();
    }
    this.syncAudioForTransition(result);
    this.publishState();
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
      syncViewportForDpi: () => this.syncViewportForDpi(),
      publishState: () => this.publishState(),
      handleStageClear: () => this.handleStageClear(),
      handleBallLoss: () => this.handleBallLoss(),
      setRuntimeError: (key, detail) => this.setRuntimeError(key, detail),
    });
  };

  private handleStageClear(): void {
    handleStageClearSession({
      state: this.state,
      config: this.config,
      random: this.random,
      audioPort: this.audioPort,
      engine: this.engine,
      windowRef: this.windowRef,
      transition: (event) => this.transition(event),
      syncAudioForTransition: (result) => this.syncAudioForTransition(result),
      syncViewPorts: () => this.publishState(),
      setMetaProgress: (metaProgress) => this.ports.setMetaProgress(metaProgress),
    });
  }

  private handleBallLoss(): void {
    handleBallLossSession({
      state: this.state,
      config: this.config,
      random: this.random,
      audioPort: this.audioPort,
      engine: this.engine,
      windowRef: this.windowRef,
      transition: (event) => this.transition(event),
      syncAudioForTransition: (result) => this.syncAudioForTransition(result),
      syncViewPorts: () => this.publishState(),
      setMetaProgress: (metaProgress) => this.ports.setMetaProgress(metaProgress),
    });
  }

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

  private adjustCanvasScale(): void {
    const wrapper = this.canvas.parentElement;
    if (!wrapper) {
      return;
    }
    const currentDpr = applySessionViewport(
      this.canvas,
      wrapper,
      this.config.width,
      this.config.height,
      this.windowRef.devicePixelRatio || 1,
    );
    this.lastDevicePixelRatio = currentDpr;
    this.publishState();
  }

  private syncViewportForDpi(): void {
    const currentDpr = Math.max(1, Math.min(4, this.windowRef.devicePixelRatio || 1));
    if (Math.abs(currentDpr - this.lastDevicePixelRatio) < 0.01) {
      return;
    }
    this.adjustCanvasScale();
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

  private bindA11yListeners(): void {
    addMediaListener(this.reducedMotionQuery, this.handleAccessibilityChange);
    addMediaListener(this.highContrastQuery, this.handleAccessibilityChange);
  }

  private unbindA11yListeners(): void {
    removeMediaListener(this.reducedMotionQuery, this.handleAccessibilityChange);
    removeMediaListener(this.highContrastQuery, this.handleAccessibilityChange);
  }

  private handleAccessibilityChange = (): void => {
    this.applyAccessibilitySnapshot();
    this.publishState();
  };

  private applyAccessibilitySnapshot(): void {
    this.state.ui.a11y.reducedMotion = this.state.run.options.reducedMotionEnabled;
    this.state.ui.a11y.highContrast = this.state.run.options.highContrastEnabled;
    this.state.ui.vfx.reducedMotion = this.state.run.options.reducedMotionEnabled;
  }

  private backToStart(): void {
    const result = this.transition({ type: "BACK_TO_START" });
    this.syncAudioForTransition(result);
    this.publishState();
  }

  private publishState(): void {
    this.ports.publish(this.state);
  }
  private createTestContext() {
    return {
      state: this.state,
      sceneMachine: this.sceneMachine,
      windowRef: this.windowRef,
      ports: this.ports,
      engine: this.engine,
      config: this.config,
      random: this.random,
      publishState: () => this.publishState(),
    };
  }
}

function addMediaListener(query: MediaQueryList, handler: () => void): void {
  if (typeof query.addEventListener === "function") {
    query.addEventListener("change", handler);
    return;
  }
  query.addListener(handler);
}

function removeMediaListener(query: MediaQueryList, handler: () => void): void {
  if (typeof query.removeEventListener === "function") {
    query.removeEventListener("change", handler);
    return;
  }
  query.removeListener(handler);
}
