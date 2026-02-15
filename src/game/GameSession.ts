import { appStore, type ShopViewState } from "../app/store";
import { AudioDirector } from "../audio/audioDirector";
import { SfxManager } from "../audio/sfx";
import { CoreEngine } from "../core/engine";
import type { AudioPort, RenderPort, UiPort } from "../core/ports";
import { GameHost } from "../phaser/GameHost";
import { readAccessibility } from "./a11y";
import { syncAudioScene } from "./audioSync";
import { buildStartConfig, GAME_CONFIG } from "./config";
import { normalizeGhostSamples } from "./ghostSystem";
import { LifecycleController } from "./lifecycle";
import { clamp } from "./math";
import { defaultRandomSource } from "./random";
import type { HudViewModel, OverlayViewModel, RenderViewState } from "./renderTypes";
import { advanceStage, applyRogueUpgradeSelection, prepareStageStory, resetRoundState } from "./roundSystem";
import { type SceneEvent, SceneMachine } from "./sceneMachine";
import { applySceneTransition, type SceneTransitionResult } from "./sceneSync";
import { purchaseShopOption } from "./session/shopActions";
import {
  applyDebugPresetOnRoundStart,
  applyStartSettingsToState,
  computeAppliedStartSettings,
} from "./session/startSettings";
import { syncViewPorts } from "./session/viewSync";
import { createInitialGameState } from "./stateFactory";
import type { GameAudioSettings, GameConfig, GameState, RandomSource, Scene } from "./types";
import { applyCanvasViewport } from "./viewport";

export interface GameSessionDeps {
  config?: Partial<GameConfig>;
  random?: RandomSource;
  documentRef?: Document;
  windowRef?: Window;
  host?: GameHost;
}

export class GameSession {
  private static readonly GHOST_STORAGE_KEY = "brick_breaker:last_ghost";
  private readonly baseRandom: RandomSource;
  private readonly baseConfig: GameConfig;
  private config: GameConfig;
  private readonly renderPort: RenderPort<RenderViewState>;
  private readonly uiPort: UiPort<OverlayViewModel, HudViewModel, ShopViewState>;
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
  private audioSettings: GameAudioSettings = {
    bgmEnabled: true,
    sfxEnabled: true,
  };
  private pendingStartStageIndex = 0;
  private isRunning = false;
  private destroyed = false;

  constructor(
    private readonly canvas: HTMLCanvasElement,
    deps: GameSessionDeps = {},
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
    this.renderPort = {
      render: (view) => this.host.render(view),
    };
    this.uiPort = {
      syncOverlay: (view) => appStore.getState().setOverlayModel(view),
      syncHud: (view) => appStore.getState().setHud(view),
      syncShop: (view) => appStore.getState().setShop(view),
    };
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

    this.runSafely(() => {
      this.bindUiHandlers();
      this.bindHostHandlers();
      this.bindA11yListeners();
      this.lifecycle.bind();
      this.adjustCanvasScale();
      this.windowRef.requestAnimationFrame(() => {
        if (!this.destroyed) {
          this.adjustCanvasScale();
        }
      });
      this.audioPort.setSettings(this.audioSettings);
      this.audioPort.notifyStageChanged(this.state.campaign.stageIndex);
      this.audioPort.syncScene(this.state.scene, this.state.scene);
      this.syncViewPorts();
    }, "初期化中に問題が発生しました。");
  }

  start(): void {
    if (this.destroyed || this.isRunning || this.state.scene === "error") {
      return;
    }
    this.runSafely(() => {
      this.isRunning = true;
      this.syncViewPorts();
    }, "ゲーム開始時に問題が発生しました。");
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

  private bindUiHandlers(): void {
    appStore.getState().setHandlers({
      primaryAction: () => {
        if (this.state.scene === "error") {
          this.windowRef.location.reload();
          return;
        }
        if (this.state.scene === "clear") {
          const result = this.transition({ type: "BACK_TO_START" });
          this.syncAudioForTransition(result);
          this.syncViewPorts();
          return;
        }
        void this.audioPort.unlock().catch(() => {});
        this.runSafely(() => this.startOrResume(), "開始処理に失敗しました。");
      },
      shopOption: (index) => {
        this.runSafely(() => this.purchaseShopOption(index), "ショップ購入に失敗しました。");
      },
    });
  }

  private bindHostHandlers(): void {
    this.host.setHandlers({
      onFrame: (timeMs) => this.loop(timeMs),
      onMove: (clientX) => this.movePaddleByMouse(clientX),
      onPauseToggle: () => this.togglePause(),
      onStartOrRestart: () => this.startOrResume(),
      onCastMagic: () => this.castMagic(),
      onFocusToggle: () => this.requestFocus(),
    });
  }

  private startOrResume(): void {
    void this.audioPort.unlock().catch(() => {});
    if (this.state.scene === "clear") {
      const result = this.transition({ type: "BACK_TO_START" });
      this.syncAudioForTransition(result);
      this.syncViewPorts();
      return;
    }
    if (this.state.scene === "start") {
      this.applyStartSettings();
    }
    if (this.state.scene === "stageclear") {
      if (this.state.rogue.pendingOffer) {
        applyRogueUpgradeSelection(this.state, appStore.getState().rogueSelection);
      }
      advanceStage(this.state, this.config, this.random);
      if (prepareStageStory(this.state)) {
        const storyResult = this.transition({ type: "SHOW_STORY" });
        this.syncAudioForTransition(storyResult);
        this.syncViewPorts();
        return;
      }
    }

    const result = this.transition({ type: "START_OR_RESUME" });
    if (result.next !== "playing") {
      this.syncAudioForTransition(result);
      this.syncViewPorts();
      return;
    }

    if (result.previous === "start") {
      resetRoundState(this.state, this.config, this.state.vfx.reducedMotion, this.random, {
        startStageIndex: this.pendingStartStageIndex,
      });
      applyDebugPresetOnRoundStart(this.state, this.random, this.config.multiballMaxBalls);
      this.prepareGhostPlayback();
    } else if (result.previous === "story") {
      this.state.story.activeStageNumber = null;
    }
    this.engine.resetClock();
    this.syncAudioForTransition(result);
    this.syncViewPorts();
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
      this.syncViewPorts();
    } catch (error) {
      this.setRuntimeError(
        error instanceof Error && error.message
          ? `実行中にエラーが発生しました。 (${error.message})`
          : "実行中にエラーが発生しました。",
      );
    }
  };

  private handleStageClear(): void {
    let transitionResult: SceneTransitionResult | null = null;
    let reachedClear = false;
    this.engine.applyStageClear((event) => {
      reachedClear = event === "GAME_CLEAR";
      transitionResult = this.transition({ type: event });
    });
    if (reachedClear) {
      this.saveGhostRecording();
    }
    if (transitionResult) {
      this.syncAudioForTransition(transitionResult);
    }
    this.syncViewPorts();
  }

  private handleBallLoss(): void {
    this.engine.applyBallLoss(() => {
      const result = this.transition({ type: "GAME_OVER" });
      this.syncAudioForTransition(result);
    });
    if (this.state.scene === "gameover") {
      this.saveGhostRecording();
    }
    this.syncViewPorts();
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

  private requestFocus(): void {
    if (this.state.scene !== "playing") {
      return;
    }
    this.state.combat.focusRequest = true;
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
    applyCanvasViewport(
      this.canvas,
      wrapper,
      this.config.width,
      this.config.height,
      this.windowRef.devicePixelRatio || 1,
      { resizeBuffer: false },
    );
    this.syncViewPorts();
  }

  private runSafely(action: () => void, fallbackMessage: string): void {
    try {
      action();
    } catch (error) {
      this.setRuntimeError(
        error instanceof Error && error.message ? `${fallbackMessage} (${error.message})` : fallbackMessage,
      );
    }
  }

  private setRuntimeError(message: string): void {
    this.isRunning = false;
    this.state.errorMessage = message;
    const result = this.transition({ type: "RUNTIME_ERROR" });
    this.syncAudioForTransition(result);
    try {
      this.syncViewPorts();
    } catch {}
  }

  private applyStartSettings(): void {
    const selected = appStore.getState().startSettings;
    const applied = computeAppliedStartSettings(this.baseConfig, this.baseRandom, selected, buildStartConfig);
    this.config = applied.config;
    this.random = applied.random;
    this.audioSettings = applied.audioSettings;
    this.pendingStartStageIndex = applied.pendingStartStageIndex;
    this.audioPort.setSettings(this.audioSettings);
    applyStartSettingsToState(this.state, selected);
  }

  private syncAudioForTransition(result: SceneTransitionResult): void {
    syncAudioScene(this.audioPort, result.previous, result.next, this.state.campaign.stageIndex);
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

  debugForceScene(scene: Scene): void {
    const previous = this.state.scene;
    this.state.scene = scene;
    syncAudioScene(this.audioPort, previous, this.state.scene, this.state.campaign.stageIndex);
    this.syncViewPorts();
  }

  private syncViewPorts(): void {
    syncViewPorts(this.state, this.renderPort, this.uiPort);
  }

  private prepareGhostPlayback(): void {
    this.state.ghost.playbackEnabled = this.state.options.ghostReplayEnabled;
    this.state.ghost.recording = [];
    this.state.ghost.recordAccumulatorSec = 0;
    if (!this.state.options.ghostReplayEnabled) {
      this.state.ghost.playback = [];
      return;
    }
    try {
      const raw = this.windowRef.localStorage.getItem(GameSession.GHOST_STORAGE_KEY);
      if (!raw) {
        this.state.ghost.playback = [];
        return;
      }
      const parsed = JSON.parse(raw);
      this.state.ghost.playback = normalizeGhostSamples(parsed);
    } catch {
      this.state.ghost.playback = [];
    }
  }

  private saveGhostRecording(): void {
    if (!this.state.options.ghostReplayEnabled || this.state.ghost.recording.length <= 0) {
      return;
    }
    try {
      const trimmed = this.state.ghost.recording.slice(-3000);
      this.windowRef.localStorage.setItem(GameSession.GHOST_STORAGE_KEY, JSON.stringify(trimmed));
    } catch {}
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
