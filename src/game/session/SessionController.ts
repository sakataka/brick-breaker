import { AudioDirector } from "../../audio/audioDirector";
import { SfxManager } from "../../audio/sfx";
import { CoreEngine } from "../../core/engine";
import type { AudioPort, RenderPort, UiPort } from "../../core/ports";
import { GameHost } from "../../phaser/GameHost";
import { readAccessibility } from "../a11y";
import { syncAudioScene } from "../audioSync";
import { GAME_CONFIG } from "../config";
import { LifecycleController } from "../lifecycle";
import { clamp } from "../math";
import type { MetaProgress } from "../metaProgress";
import { defaultRandomSource } from "../random";
import type { HudViewModel, OverlayViewModel, RenderViewState } from "../renderTypes";
import { type SceneEvent, SceneMachine } from "../sceneMachine";
import { applySceneTransition, type SceneTransitionResult } from "../sceneSync";
import { resolveStageMetadataFromState } from "../stageContext";
import type { StartSettingsSelection } from "../startSettingsSchema";
import { createInitialGameState } from "../stateFactory";
import type {
  GameAudioSettings,
  GameConfig,
  GameState,
  RandomSource,
  RogueUpgradeType,
  RuntimeErrorKey,
  Scene,
} from "../types";
import { createHostHandlers, createUiHandlers } from "./sessionBindings";
import {
  handleBallLossSession,
  handleStageClearSession,
  resolveSessionStartSettings,
  runSafely as runSessionSafely,
  startOrResumeSession,
} from "./sessionFlow";
import { applySessionViewport } from "./sessionViewport";
import { purchaseShopOption } from "./shopActions";
import { syncViewPorts } from "./viewSync";

export interface SessionControllerDeps {
  config?: Partial<GameConfig>;
  random?: RandomSource;
  documentRef?: Document;
  windowRef?: Window;
  host?: GameHost;
  renderPort?: RenderPort<RenderViewState>;
  uiPort: UiPort<OverlayViewModel, HudViewModel, unknown>;
  getStartSettings: () => StartSettingsSelection;
  getRogueSelection: () => RogueUpgradeType;
  setUiHandlers: (handlers: {
    primaryAction: () => void;
    shopOption: (index: 0 | 1) => void;
  }) => void;
  setMetaProgress: (metaProgress: MetaProgress) => void;
}

export class SessionController {
  static readonly GHOST_STORAGE_KEY = "brick_breaker:last_ghost";
  private readonly baseRandom: RandomSource;
  private readonly baseConfig: GameConfig;
  private config: GameConfig;
  private readonly renderPort: RenderPort<RenderViewState>;
  private readonly uiPort: UiPort<OverlayViewModel, HudViewModel, unknown>;
  private readonly audioPort: AudioPort;
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
    private readonly deps: SessionControllerDeps,
  ) {
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

    const a11y = readAccessibility(this.windowRef);
    this.state = createInitialGameState(
      this.config,
      a11y.reducedMotion,
      this.sceneMachine.value,
      a11y.highContrast,
    );
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
      this.syncViewPorts();
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
    this.audioPort.destroy();
    this.host.destroy();
    this.sceneMachine.stop();
  }

  debugForceScene(scene: Scene): void {
    const previous = this.state.scene;
    this.state.scene = scene;
    syncAudioScene(this.audioPort, previous, this.state.scene, this.state);
    this.syncViewPorts();
  }

  debugSetGameOverScore(score: number, lives = this.state.lives): void {
    const previous = this.state.scene;
    this.state.lastGameOverScore = Math.max(0, Math.round(score));
    this.state.score = 0;
    this.state.lives = Math.max(0, Math.round(lives));
    this.state.scene = "gameover";
    syncAudioScene(this.audioPort, previous, this.state.scene, this.state);
    this.syncViewPorts();
  }

  private initializeSession(): void {
    this.deps.setUiHandlers(
      createUiHandlers({
        onErrorReload: () => this.windowRef.location.reload(),
        onBackToStart: () => this.backToStart(),
        onStartOrResume: () => this.startOrResume(),
        onShopOption: (index) => this.purchaseShopOption(index),
        runSafely: (action, key) => this.runSafely(action, key),
        unlockAudio: () => {
          void this.audioPort.unlock().catch(() => {});
        },
        getScene: () => this.state.scene,
      }),
    );
    this.host.setHandlers(
      createHostHandlers({
        onFrame: (timeMs) => this.loop(timeMs),
        onMove: (clientX) => this.movePaddleByMouse(clientX),
        onPauseToggle: () => this.togglePause(),
        onStartOrRestart: () => this.startOrResume(),
        onCastMagic: () => this.castMagic(),
      }),
    );
    this.bindA11yListeners();
    this.lifecycle.bind();
    this.adjustCanvasScale();
    this.windowRef.requestAnimationFrame(() => {
      if (!this.destroyed) {
        this.adjustCanvasScale();
      }
    });
    this.audioPort.setSettings(this.audioSettings);
    this.audioPort.notifyStageChanged(resolveStageMetadataFromState(this.state).musicCue);
    this.audioPort.syncScene(this.state.scene, this.state.scene);
    this.syncViewPorts();
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
      windowRef: this.windowRef,
      pendingStartStageIndex: this.pendingStartStageIndex,
      ghostStorageKey: SessionController.GHOST_STORAGE_KEY,
      transition: (event) => this.transition(event),
      syncAudioForTransition: (result) => this.syncAudioForTransition(result),
      syncViewPorts: () => this.syncViewPorts(),
      getRogueSelection: () => this.deps.getRogueSelection(),
      setMetaProgress: (metaProgress) => this.deps.setMetaProgress(metaProgress),
    });
  }

  private togglePause(): void {
    void this.audioPort.unlock().catch(() => {});
    const result = this.transition({ type: "TOGGLE_PAUSE" });
    if (result.previous === "paused" && result.next === "playing") {
      this.engine.resetClock();
    }
    this.syncAudioForTransition(result);
    this.syncViewPorts();
  }

  private transition(event: SceneEvent): SceneTransitionResult {
    return applySceneTransition(this.state, this.sceneMachine, event);
  }

  private loop = (timeMs: number): void => {
    if (!this.isRunning || this.destroyed) {
      return;
    }
    try {
      this.syncViewportForDpi();
      const previousBossPhase = this.state.combat.bossPhase;
      const previousTelegraphKind = this.state.combat.bossAttackState.telegraph?.kind;
      const previousSweepActive = Boolean(this.state.combat.bossAttackState.sweep);
      this.engine.tick(
        timeMs,
        {
          config: this.config,
          random: this.random,
          sfx: this.sfx,
          playPickupSfx: (itemType) => this.audioPort.playItemPickup(itemType),
          playComboFillSfx: () => this.audioPort.playComboFill(),
          playMagicCastSfx: () => this.audioPort.playMagicCast(),
        },
        {
          onStageClear: () => this.handleStageClear(),
          onBallLoss: () => this.handleBallLoss(),
        },
      );
      this.syncEncounterAudio(previousBossPhase, previousTelegraphKind, previousSweepActive);
      this.syncViewPorts();
    } catch (error) {
      this.setRuntimeError(
        "runtime",
        error instanceof Error && error.message ? error.message : undefined,
      );
    }
  };

  private syncEncounterAudio(
    previousBossPhase: number,
    previousTelegraphKind:
      | NonNullable<GameState["combat"]["bossAttackState"]["telegraph"]>["kind"]
      | undefined,
    previousSweepActive: boolean,
  ): void {
    const nextTelegraph = this.state.combat.bossAttackState.telegraph;
    const nextSweepActive = Boolean(this.state.combat.bossAttackState.sweep);
    if (this.state.combat.bossPhase > previousBossPhase) {
      this.audioPort.playBossPhaseShift();
    }
    if (nextTelegraph && previousTelegraphKind !== nextTelegraph.kind) {
      this.audioPort.playBossCast();
      if (typeof nextTelegraph.lane === "number") {
        this.audioPort.playDangerLane();
      }
    }
    if (!previousSweepActive && nextSweepActive) {
      this.audioPort.playDangerLane();
    }
  }

  private handleStageClear(): void {
    handleStageClearSession({
      state: this.state,
      config: this.config,
      random: this.random,
      audioPort: this.audioPort,
      engine: this.engine,
      windowRef: this.windowRef,
      ghostStorageKey: SessionController.GHOST_STORAGE_KEY,
      transition: (event) => this.transition(event),
      syncAudioForTransition: (result) => this.syncAudioForTransition(result),
      syncViewPorts: () => this.syncViewPorts(),
      setMetaProgress: (metaProgress) => this.deps.setMetaProgress(metaProgress),
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
      ghostStorageKey: SessionController.GHOST_STORAGE_KEY,
      transition: (event) => this.transition(event),
      syncAudioForTransition: (result) => this.syncAudioForTransition(result),
      syncViewPorts: () => this.syncViewPorts(),
      setMetaProgress: (metaProgress) => this.deps.setMetaProgress(metaProgress),
    });
  }

  private movePaddleByMouse(clientX: number): void {
    const rect = this.canvas.getBoundingClientRect();
    if (rect.width <= 0) {
      return;
    }
    const worldX = (clientX - rect.left) * (this.config.width / rect.width);
    this.state.paddle.x = clamp(
      worldX - this.state.paddle.width / 2,
      0,
      this.config.width - this.state.paddle.width,
    );
  }

  private castMagic(): void {
    if (this.state.scene !== "playing") {
      return;
    }
    this.state.magic.requestCast = true;
  }

  private purchaseShopOption(index: 0 | 1): void {
    const picked = purchaseShopOption(this.state, index, this.config, this.random);
    if (!picked) {
      return;
    }
    this.audioPort.playItemPickup(picked);
    this.syncViewPorts();
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
    this.syncViewPorts();
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
    this.state.error = {
      key,
      detail,
    };
    const result = this.transition({ type: "RUNTIME_ERROR" });
    this.syncAudioForTransition(result);
    try {
      this.syncViewPorts();
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
    this.audioPort.setSettings(this.audioSettings);
  }

  private syncAudioForTransition(result: SceneTransitionResult): void {
    syncAudioScene(this.audioPort, result.previous, result.next, this.state);
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
    this.syncViewPorts();
  };

  private applyAccessibilitySnapshot(): void {
    const snapshot = readAccessibility(this.windowRef);
    this.state.a11y.reducedMotion = snapshot.reducedMotion;
    this.state.a11y.highContrast = snapshot.highContrast;
    this.state.vfx.reducedMotion = snapshot.reducedMotion;
  }

  private backToStart(): void {
    const result = this.transition({ type: "BACK_TO_START" });
    this.syncAudioForTransition(result);
    this.syncViewPorts();
  }

  private syncViewPorts(): void {
    syncViewPorts(this.state, this.renderPort, this.uiPort);
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
