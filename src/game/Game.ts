import { appStore } from "../app/store";
import { AudioDirector } from "../audio/audioDirector";
import { SfxManager } from "../audio/sfx";
import { readAccessibility } from "./a11y";
import { syncAudioScene } from "./audioSync";
import { buildStartConfig, GAME_CONFIG, SHOP_CONFIG } from "./config";
import { getDailyChallenge } from "./dailyChallenge";
import { computeFrameDelta, handleBallLoss, handleStageClear, runPlayingLoop } from "./gameRuntime";
import { renderGameFrame, syncSceneOverlayUI } from "./gameUi";
import { InputController } from "./input";
import { ITEM_REGISTRY } from "./itemRegistry";
import { applyItemPickup, ensureMultiballCount } from "./itemSystem";
import { LifecycleController } from "./lifecycle";
import { clamp } from "./math";
import { createSeededRandomSource, defaultRandomSource } from "./random";
import { Renderer } from "./renderer";
import { advanceStage, applyRogueUpgradeSelection, prepareStageStory, resetRoundState } from "./roundSystem";
import { type SceneEvent, SceneMachine } from "./sceneMachine";
import { applySceneTransition, type SceneTransitionResult } from "./sceneSync";
import { createInitialGameState } from "./stateFactory";
import type { GameAudioSettings, GameConfig, GameState, RandomSource, Scene } from "./types";
import { nextDensityScale, spawnItemPickupFeedback, updateVfxState } from "./vfxSystem";
import { applyCanvasViewport } from "./viewport";

export interface GameDeps {
  ctx?: CanvasRenderingContext2D;
  config?: Partial<GameConfig>;
  random?: RandomSource;
  documentRef?: Document;
  windowRef?: Window;
}

export class Game {
  private readonly baseRandom: RandomSource;
  private readonly baseConfig: GameConfig;
  private config: GameConfig;
  private readonly renderer: Renderer;
  private readonly sfx = new SfxManager();
  private readonly audioDirector = new AudioDirector(this.sfx);
  private readonly input: InputController;
  private random: RandomSource;
  private readonly sceneMachine = new SceneMachine();
  private readonly documentRef: Document;
  private readonly windowRef: Window;
  private readonly lifecycle: LifecycleController;
  private readonly reducedMotionQuery: MediaQueryList;
  private readonly highContrastQuery: MediaQueryList;
  private state: GameState;
  private audioSettings: GameAudioSettings = {
    bgmEnabled: true,
    sfxEnabled: true,
  };
  private lastFrameTime = 0;
  private accumulator = 0;
  private isRunning = false;
  private destroyed = false;

  constructor(
    private readonly canvas: HTMLCanvasElement,
    deps: GameDeps = {},
  ) {
    const context = deps.ctx ?? this.canvas.getContext("2d");
    if (!context) throw new Error("Canvasが利用できませんでした");
    this.baseConfig = { ...GAME_CONFIG, ...deps.config };
    this.config = { ...this.baseConfig };
    this.baseRandom = deps.random ?? defaultRandomSource;
    this.random = this.baseRandom;
    this.documentRef = deps.documentRef ?? document;
    this.windowRef = deps.windowRef ?? window;
    this.reducedMotionQuery = this.windowRef.matchMedia("(prefers-reduced-motion: reduce)");
    this.highContrastQuery = this.windowRef.matchMedia("(prefers-contrast: more)");
    const a11y = readAccessibility(this.windowRef);
    this.renderer = new Renderer(context, this.config);
    this.state = createInitialGameState(
      this.config,
      a11y.reducedMotion,
      this.sceneMachine.value,
      a11y.highContrast,
    );
    this.input = new InputController({
      moveByMouseX: (clientX) => this.movePaddleByMouse(clientX),
      pauseToggle: () => this.togglePause(),
      startOrRestart: () => this.startOrResume(),
      castMagic: () => this.castMagic(),
      resize: () => this.adjustCanvasScale(),
    });
    this.lifecycle = new LifecycleController(
      this.documentRef,
      this.canvas.parentElement,
      () => this.state.scene === "playing" && this.togglePause(),
      () => this.adjustCanvasScale(),
    );
    this.runSafely(() => {
      this.adjustCanvasScale();
      this.bindUiHandlers();
      this.bindA11yListeners();
      this.lifecycle.bind();
      this.audioDirector.setSettings(this.audioSettings);
      this.audioDirector.notifyStageChanged(this.state.campaign.stageIndex);
      this.audioDirector.syncScene(this.state.scene, this.state.scene);
      renderGameFrame(this.renderer, this.state);
      syncSceneOverlayUI(this.state);
      this.updateShopPanel();
    }, "初期化中に問題が発生しました。");
  }

  start(): void {
    if (this.destroyed || this.isRunning || this.state.scene === "error") return;
    this.runSafely(() => {
      this.isRunning = true;
      this.input.attach();
      renderGameFrame(this.renderer, this.state);
      this.windowRef.requestAnimationFrame(this.loop);
    }, "ゲーム開始時に問題が発生しました。");
  }

  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    this.isRunning = false;
    this.input.detach();
    this.lifecycle.unbind();
    this.unbindA11yListeners();
    this.audioDirector.destroy();
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
          syncSceneOverlayUI(this.state);
          this.updateShopPanel();
          return;
        }
        void this.audioDirector.unlock().catch(() => {});
        this.runSafely(() => this.startOrResume(), "開始処理に失敗しました。");
      },
      shopOption: (index) => {
        this.runSafely(() => this.purchaseShopOption(index), "ショップ購入に失敗しました。");
      },
    });
  }

  private startOrResume(): void {
    void this.audioDirector.unlock().catch(() => {});
    if (this.state.scene === "clear") {
      const result = this.transition({ type: "BACK_TO_START" });
      this.syncAudioForTransition(result);
      syncSceneOverlayUI(this.state);
      this.updateShopPanel();
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
        syncSceneOverlayUI(this.state);
        this.updateShopPanel();
        return;
      }
    }

    const result = this.transition({ type: "START_OR_RESUME" });
    if (result.next !== "playing") {
      this.syncAudioForTransition(result);
      return;
    }

    if (result.previous === "start") {
      resetRoundState(this.state, this.config, this.state.vfx.reducedMotion, this.random);
    } else if (result.previous === "story") {
      this.state.story.activeStageNumber = null;
    }
    this.lastFrameTime = 0;
    this.accumulator = 0;
    this.syncAudioForTransition(result);
    syncSceneOverlayUI(this.state);
    this.updateShopPanel();
  }

  private togglePause(): void {
    void this.audioDirector.unlock().catch(() => {});
    const result = this.transition({ type: "TOGGLE_PAUSE" });
    if (result.previous === "paused" && result.next === "playing") {
      this.lastFrameTime = 0;
      this.accumulator = 0;
    }
    this.syncAudioForTransition(result);
    this.updateShopPanel();
  }

  private transition(event: SceneEvent): SceneTransitionResult {
    return applySceneTransition(this.state, this.sceneMachine, event);
  }

  private loop = (timeMs: number): void => {
    if (!this.isRunning || this.destroyed) return;
    try {
      const timeSec = timeMs / 1000;
      const frame = computeFrameDelta(this.lastFrameTime, timeSec);
      const delta = frame.delta;
      this.lastFrameTime = frame.nextFrameTime;
      this.state.vfx.densityScale = nextDensityScale(this.state.vfx.densityScale, delta, this.state.scene);
      if (this.state.scene === "playing") {
        this.accumulator = runPlayingLoop(
          this.state,
          {
            config: this.config,
            random: this.random,
            sfx: this.sfx,
            playPickupSfx: (itemType) => this.audioDirector.playItemPickup(itemType),
            playComboFillSfx: () => this.audioDirector.playComboFill(),
            playMagicCastSfx: () => this.audioDirector.playMagicCast(),
          },
          this.accumulator,
          delta,
          () => this.handleStageClear(),
          () => this.handleBallLoss(),
        );
      } else {
        updateVfxState(this.state.vfx, delta, this.random);
      }
      renderGameFrame(this.renderer, this.state);
      syncSceneOverlayUI(this.state);
      this.updateShopPanel();
    } catch (error) {
      this.setRuntimeError(
        error instanceof Error && error.message
          ? `実行中にエラーが発生しました。 (${error.message})`
          : "実行中にエラーが発生しました。",
      );
    }
    if (this.isRunning) this.windowRef.requestAnimationFrame(this.loop);
  };

  private handleStageClear(): void {
    let transitionResult: SceneTransitionResult | null = null;
    handleStageClear(this.state, this.config, (event) => {
      transitionResult = this.transition({ type: event });
    });
    if (transitionResult) {
      this.syncAudioForTransition(transitionResult);
    }
  }

  private handleBallLoss(): void {
    handleBallLoss(this.state, this.config, this.random, () => {
      const result = this.transition({ type: "GAME_OVER" });
      this.syncAudioForTransition(result);
    });
  }

  private movePaddleByMouse(clientX: number): void {
    const rect = this.canvas.getBoundingClientRect();
    if (rect.width <= 0) return;
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
    if (this.state.scene !== "playing") {
      return;
    }
    if (this.state.shop.usedThisStage) {
      return;
    }
    const offer = this.state.shop.lastOffer;
    if (!offer) {
      return;
    }
    if (this.state.score < SHOP_CONFIG.purchaseCost) {
      return;
    }
    const picked = offer[index];
    this.state.score -= SHOP_CONFIG.purchaseCost;
    this.state.shop.usedThisStage = true;
    this.state.shop.lastChosen = picked;
    applyItemPickup(this.state.items, picked, this.state.balls);
    if (picked === "multiball") {
      this.state.balls = ensureMultiballCount(
        this.state.items,
        this.state.balls,
        this.random,
        this.config.multiballMaxBalls,
      );
    }
    const anchor = this.state.balls[0];
    if (anchor) {
      spawnItemPickupFeedback(this.state.vfx, picked, anchor.pos.x, anchor.pos.y);
    }
    this.audioDirector.playItemPickup(picked);
    renderGameFrame(this.renderer, this.state);
    this.updateShopPanel();
  }

  private updateShopPanel(): void {
    if (this.state.scene !== "playing") {
      appStore.getState().setShop({
        visible: false,
        status: "ショップ",
        optionALabel: "選択肢A",
        optionBLabel: "選択肢B",
        optionADisabled: true,
        optionBDisabled: true,
      });
      return;
    }
    const offer = this.state.shop.lastOffer;
    if (!offer) {
      appStore.getState().setShop({
        visible: false,
        status: "ショップ",
        optionALabel: "選択肢A",
        optionBLabel: "選択肢B",
        optionADisabled: true,
        optionBDisabled: true,
      });
      return;
    }
    const canBuy = !this.state.shop.usedThisStage && this.state.score >= SHOP_CONFIG.purchaseCost;
    const title = this.state.shop.usedThisStage
      ? "ショップ: このステージは購入済み"
      : `ショップ: 1回限定 (${SHOP_CONFIG.purchaseCost}点)`;
    appStore.getState().setShop({
      visible: true,
      status: title,
      optionALabel: getShopButtonLabel(offer[0]),
      optionBLabel: getShopButtonLabel(offer[1]),
      optionADisabled: !canBuy,
      optionBDisabled: !canBuy,
    });
  }

  private adjustCanvasScale(): void {
    const wrapper = this.canvas.parentElement;
    if (!wrapper) return;
    const viewport = applyCanvasViewport(
      this.canvas,
      wrapper,
      this.config.width,
      this.config.height,
      this.windowRef.devicePixelRatio || 1,
    );
    this.renderer.setRenderScale(viewport.renderScale);
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
    this.input.detach();
    const result = this.transition({ type: "RUNTIME_ERROR" });
    this.syncAudioForTransition(result);
    try {
      renderGameFrame(this.renderer, this.state);
      syncSceneOverlayUI(this.state);
      this.updateShopPanel();
    } catch {}
  }

  private applyStartSettings(): void {
    const selected = appStore.getState().startSettings;
    this.config = buildStartConfig(this.baseConfig, selected);
    if (selected.dailyMode) {
      this.random = createSeededRandomSource(getDailyChallenge().seed);
    } else if (selected.challengeMode) {
      this.random = createSeededRandomSource(CHALLENGE_MODE_SEED);
    } else {
      this.random = this.baseRandom;
    }
    this.audioSettings = {
      bgmEnabled: selected.bgmEnabled,
      sfxEnabled: selected.sfxEnabled,
    };
    this.audioDirector.setSettings(this.audioSettings);
    this.state.options.riskMode = selected.riskMode;
    this.state.campaign.routePreference = selected.routePreference;
  }

  private syncAudioForTransition(result: SceneTransitionResult): void {
    syncAudioScene(this.audioDirector, result.previous, result.next, this.state.campaign.stageIndex);
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
    renderGameFrame(this.renderer, this.state);
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
    syncAudioScene(this.audioDirector, previous, this.state.scene, this.state.campaign.stageIndex);
    renderGameFrame(this.renderer, this.state);
    syncSceneOverlayUI(this.state);
    this.updateShopPanel();
  }
}

const CHALLENGE_MODE_SEED = 0x2f6e2b1d;

function getShopButtonLabel(type: keyof typeof ITEM_REGISTRY): string {
  return `${ITEM_REGISTRY[type].label}`;
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
