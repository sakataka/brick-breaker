import { SfxManager } from "../audio/sfx";
import { type OverlayElements, readStartSettings } from "../ui/overlay";
import { buildStartConfig, GAME_CONFIG } from "./config";
import { computeFrameDelta, handleBallLoss, handleStageClear, runPlayingLoop } from "./gameRuntime";
import { renderGameFrame, syncSceneOverlayUI } from "./gameUi";
import type { HudElements } from "./hud";
import { InputController } from "./input";
import { LifecycleController } from "./lifecycle";
import { clamp } from "./math";
import { defaultRandomSource } from "./random";
import { Renderer } from "./renderer";
import { advanceStage, resetRoundState } from "./roundSystem";
import { type SceneEvent, SceneMachine } from "./sceneMachine";
import { createInitialGameState } from "./stateFactory";
import type { GameConfig, GameState, RandomSource, Scene } from "./types";
import { nextDensityScale, updateVfxState } from "./vfxSystem";
import { applyCanvasViewport } from "./viewport";

export interface GameDeps {
  ctx?: CanvasRenderingContext2D;
  config?: Partial<GameConfig>;
  random?: RandomSource;
  documentRef?: Document;
  windowRef?: Window;
}

export class Game {
  private readonly baseConfig: GameConfig;
  private config: GameConfig;
  private readonly renderer: Renderer;
  private readonly sfx = new SfxManager();
  private readonly input: InputController;
  private readonly random: RandomSource;
  private readonly sceneMachine = new SceneMachine();
  private readonly documentRef: Document;
  private readonly windowRef: Window;
  private readonly lifecycle: LifecycleController;
  private state: GameState;
  private lastFrameTime = 0;
  private accumulator = 0;
  private isRunning = false;
  private destroyed = false;

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly hud: HudElements,
    private readonly overlay: OverlayElements,
    deps: GameDeps = {},
  ) {
    const context = deps.ctx ?? this.canvas.getContext("2d");
    if (!context) throw new Error("Canvasが利用できませんでした");
    this.baseConfig = { ...GAME_CONFIG, ...deps.config };
    this.config = { ...this.baseConfig };
    this.random = deps.random ?? defaultRandomSource;
    this.documentRef = deps.documentRef ?? document;
    this.windowRef = deps.windowRef ?? window;
    const reducedMotion = this.windowRef.matchMedia("(prefers-reduced-motion: reduce)").matches;
    this.renderer = new Renderer(context, this.config);
    this.state = createInitialGameState(this.config, reducedMotion, this.sceneMachine.value);
    this.input = new InputController({
      moveByMouseX: (clientX) => this.movePaddleByMouse(clientX),
      pauseToggle: () => this.togglePause(),
      startOrRestart: () => this.startOrResume(),
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
      this.bindOverlay();
      this.lifecycle.bind();
      renderGameFrame(this.renderer, this.hud, this.state);
      syncSceneOverlayUI(this.overlay, this.state);
    }, "初期化中に問題が発生しました。");
  }

  start(): void {
    if (this.destroyed || this.isRunning || this.state.scene === "error") return;
    this.runSafely(() => {
      this.isRunning = true;
      this.input.attach();
      renderGameFrame(this.renderer, this.hud, this.state);
      this.windowRef.requestAnimationFrame(this.loop);
    }, "ゲーム開始時に問題が発生しました。");
  }

  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    this.isRunning = false;
    this.input.detach();
    this.lifecycle.unbind();
    this.sceneMachine.stop();
  }

  private bindOverlay(): void {
    this.overlay.button.addEventListener("click", () => {
      if (this.state.scene === "error") return this.windowRef.location.reload();
      if (this.state.scene === "clear") {
        this.transition({ type: "BACK_TO_START" });
        syncSceneOverlayUI(this.overlay, this.state);
        return;
      }
      void this.sfx.resumeIfNeeded().catch(() => {});
      this.runSafely(() => this.startOrResume(), "開始処理に失敗しました。");
    });
  }

  private startOrResume(): void {
    const previous = this.state.scene;
    if (previous === "clear") {
      this.transition({ type: "BACK_TO_START" });
      syncSceneOverlayUI(this.overlay, this.state);
      return;
    }
    if (previous === "start") {
      this.applyStartSettings();
    }
    if (this.transition({ type: "START_OR_RESUME" }) !== "playing") return;
    if (previous === "start") {
      resetRoundState(this.state, this.config, this.state.vfx.reducedMotion, this.random);
    } else if (previous === "stageclear") {
      advanceStage(this.state, this.config, this.random);
    }
    this.lastFrameTime = 0;
    this.accumulator = 0;
    syncSceneOverlayUI(this.overlay, this.state);
  }

  private togglePause(): void {
    const previous = this.state.scene;
    const next = this.transition({ type: "TOGGLE_PAUSE" });
    if (previous === "paused" && next === "playing") {
      this.lastFrameTime = 0;
      this.accumulator = 0;
    }
  }

  private transition(event: SceneEvent): Scene {
    const next = this.sceneMachine.send(event);
    if (next !== this.state.scene) this.state.scene = next;
    return next;
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
          { config: this.config, random: this.random, sfx: this.sfx },
          this.accumulator,
          delta,
          () => this.handleStageClear(),
          () => this.handleBallLoss(),
        );
      } else {
        updateVfxState(this.state.vfx, delta, this.random);
      }
      renderGameFrame(this.renderer, this.hud, this.state);
      syncSceneOverlayUI(this.overlay, this.state);
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
    handleStageClear(this.state, this.config, this.sfx, (event) => this.transition({ type: event }));
  }

  private handleBallLoss(): void {
    handleBallLoss(this.state, this.config, this.random, () => this.transition({ type: "GAME_OVER" }));
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
    this.transition({ type: "RUNTIME_ERROR" });
    try {
      renderGameFrame(this.renderer, this.hud, this.state);
      syncSceneOverlayUI(this.overlay, this.state);
    } catch {}
  }

  private applyStartSettings(): void {
    const selected = readStartSettings(this.overlay);
    this.config = buildStartConfig(this.baseConfig, selected);
  }
}
