import { SfxManager } from "../audio/sfx";
import { type getOverlayElements, setSceneUI } from "../ui/overlay";
import { applyAssistToPaddle, getCurrentMaxBallSpeed } from "./assistSystem";
import { applyPhysicsResultScore, playCollisionSounds } from "./collisionEffects";
import { GAME_BALANCE, GAME_CONFIG } from "./config";
import { type HudElements, formatTime, updateHud } from "./hud";
import { InputController } from "./input";
import { LifecycleController } from "./lifecycle";
import { clamp } from "./math";
import { type PhysicsResult, stepPhysics } from "./physics";
import { defaultRandomSource } from "./random";
import { Renderer } from "./renderer";
import { applyLifeLoss, resetRoundState } from "./roundSystem";
import { type SceneEvent, SceneMachine } from "./sceneMachine";
import { createInitialGameState } from "./stateFactory";
import type { GameConfig, GameState, RandomSource, Scene } from "./types";
import { applyCollisionEvents, nextDensityScale, recordTrailPoint, updateVfxState } from "./vfxSystem";
import { applyCanvasViewport } from "./viewport";

export interface GameDeps {
  ctx?: CanvasRenderingContext2D;
  config?: Partial<GameConfig>;
  random?: RandomSource;
  documentRef?: Document;
  windowRef?: Window;
}

export class Game {
  private readonly config: GameConfig;
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
    private readonly overlay: ReturnType<typeof getOverlayElements>,
    deps: GameDeps = {},
  ) {
    const context = deps.ctx ?? this.canvas.getContext("2d");
    if (!context) {
      throw new Error("Canvasが利用できませんでした");
    }

    this.config = { ...GAME_CONFIG, ...deps.config };
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
      () => {
        if (this.state.scene === "playing") {
          this.togglePause();
        }
      },
      () => this.adjustCanvasScale(),
    );

    this.runSafely(() => {
      this.adjustCanvasScale();
      this.bindOverlay();
      this.lifecycle.bind();
      this.syncSceneUI();
      this.renderer.render(this.state);
      updateHud(this.hud, this.state);
    }, "初期化中に問題が発生しました。");
  }

  start(): void {
    if (this.destroyed || this.isRunning || this.state.scene === "error") {
      return;
    }

    this.runSafely(() => {
      this.isRunning = true;
      this.input.attach();
      this.renderer.render(this.state);
      updateHud(this.hud, this.state);
      this.windowRef.requestAnimationFrame(this.loop);
    }, "ゲーム開始時に問題が発生しました。");
  }

  destroy(): void {
    if (this.destroyed) {
      return;
    }
    this.destroyed = true;
    this.isRunning = false;
    this.input.detach();
    this.lifecycle.unbind();
    this.sceneMachine.stop();
  }

  private bindOverlay(): void {
    this.overlay.button.addEventListener("click", () => {
      if (this.state.scene === "error") {
        this.windowRef.location.reload();
        return;
      }
      void this.sfx.resumeIfNeeded().catch(() => {});
      this.runSafely(() => this.startOrResume(), "開始処理に失敗しました。");
    });
  }

  private startOrResume(): void {
    const previous = this.state.scene;
    const next = this.sendScene({ type: "START_OR_RESUME" });
    if (next !== "playing") {
      return;
    }

    if (previous === "start" || previous === "gameover" || previous === "clear") {
      resetRoundState(this.state, this.config, this.state.vfx.reducedMotion, this.random);
    }
    this.lastFrameTime = this.accumulator = 0;
  }

  private togglePause(): void {
    const previous = this.state.scene;
    const next = this.sendScene({ type: "TOGGLE_PAUSE" });
    if (previous === "paused" && next === "playing") {
      this.lastFrameTime = this.accumulator = 0;
    }
  }

  private sendScene(event: SceneEvent): Scene {
    const next = this.sceneMachine.send(event);
    if (next !== this.state.scene) {
      this.state.scene = next;
      this.syncSceneUI();
    }
    return next;
  }

  private syncSceneUI(): void {
    const clearTime = this.state.scene === "clear" ? formatTime(this.state.elapsedSec) : undefined;
    setSceneUI(
      this.overlay,
      this.state.scene,
      this.state.score,
      this.state.lives,
      clearTime,
      this.state.errorMessage ?? undefined,
    );
  }

  private loop = (timeMs: number): void => {
    if (!this.isRunning || this.destroyed) {
      return;
    }

    try {
      const timeSec = timeMs / 1000;
      if (this.lastFrameTime === 0) {
        this.lastFrameTime = timeSec;
      }
      const delta = Math.min(0.25, timeSec - this.lastFrameTime);
      this.lastFrameTime = timeSec;
      this.state.vfx.densityScale = nextDensityScale(this.state.vfx.densityScale, delta, this.state.scene);

      if (this.state.scene === "playing") {
        this.accumulator += delta;
        while (this.accumulator >= this.config.fixedDeltaSec) {
          this.accumulator -= this.config.fixedDeltaSec;
          this.state.elapsedSec += this.config.fixedDeltaSec;
          applyAssistToPaddle(
            this.state.paddle,
            GAME_BALANCE.paddleWidth,
            this.config.width,
            this.state.assist,
            this.state.elapsedSec,
          );

          const result = stepPhysics(
            this.state.ball,
            this.state.paddle,
            this.state.bricks,
            this.config,
            this.config.fixedDeltaSec,
            {
              maxBallSpeed: getCurrentMaxBallSpeed(
                this.config.maxBallSpeed,
                this.state.assist,
                this.state.elapsedSec,
              ),
            },
          );

          this.handlePhysicsResult(result);
          updateVfxState(this.state.vfx, this.config.fixedDeltaSec, this.random);
          if (this.state.scene !== "playing") {
            break;
          }
        }
      } else {
        updateVfxState(this.state.vfx, delta, this.random);
      }

      recordTrailPoint(this.state.vfx, this.state.scene, this.state.ball.pos);
      this.renderer.render(this.state);
      updateHud(this.hud, this.state);
    } catch (error) {
      const message =
        error instanceof Error && error.message
          ? `実行中にエラーが発生しました。 (${error.message})`
          : "実行中にエラーが発生しました。";
      this.setRuntimeError(message);
    }

    if (this.isRunning) {
      this.windowRef.requestAnimationFrame(this.loop);
    }
  };

  private handlePhysicsResult(result: PhysicsResult): void {
    playCollisionSounds(this.sfx, result.events);
    applyCollisionEvents(this.state.vfx, result.events, this.random);
    const outcome = applyPhysicsResultScore(this.state, result, GAME_BALANCE.clearBonusPerLife);
    if (outcome === "lifeLost") {
      if (!applyLifeLoss(this.state, result.livesLost, this.config, this.random)) {
        this.sendScene({ type: "GAME_OVER" });
      }
      return;
    }
    if (outcome === "cleared") {
      void this.sfx.play("clear");
      this.sendScene({ type: "GAME_CLEAR" });
    }
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

  private adjustCanvasScale(): void {
    const wrapper = this.canvas.parentElement;
    if (!wrapper) {
      return;
    }
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
      const message =
        error instanceof Error && error.message ? `${fallbackMessage} (${error.message})` : fallbackMessage;
      this.setRuntimeError(message);
    }
  }

  private setRuntimeError(message: string): void {
    this.isRunning = false;
    this.state.errorMessage = message;
    this.input.detach();
    this.sendScene({ type: "RUNTIME_ERROR" });
    try {
      this.renderer.render(this.state);
      updateHud(this.hud, this.state);
    } catch {}
  }
}
