import { SfxManager } from "../audio/sfx";
import { type getOverlayElements, setSceneUI } from "../ui/overlay";
import { applyAssistToPaddle, getCurrentMaxBallSpeed } from "./assistSystem";
import { playCollisionSounds } from "./collisionEffects";
import { GAME_BALANCE, GAME_CONFIG } from "./config";
import { type HudElements, formatTime, updateHud } from "./hud";
import { InputController } from "./input";
import {
  applyItemPickup,
  consumeShield,
  ensureMultiballCount,
  getPaddleScale,
  getSlowBallMaxSpeedScale,
  spawnDropsFromBrickEvents,
  trimBallsWhenMultiballEnds,
  updateFallingItems,
  updateItemTimers,
} from "./itemSystem";
import { LifecycleController } from "./lifecycle";
import { clamp } from "./math";
import { stepPhysics } from "./physics";
import { defaultRandomSource } from "./random";
import { Renderer } from "./renderer";
import {
  advanceStage,
  applyLifeLoss,
  getStageInitialBallSpeed,
  getStageMaxBallSpeed,
  resetRoundState,
  retryCurrentStage,
} from "./roundSystem";
import { type SceneEvent, SceneMachine } from "./sceneMachine";
import { createInitialGameState } from "./stateFactory";
import type { Ball, CollisionEvent, GameConfig, GameState, RandomSource, Scene } from "./types";
import {
  applyCollisionEvents,
  nextDensityScale,
  recordTrailPoint,
  spawnItemPickupFeedback,
  triggerHitFreeze,
  updateVfxState,
} from "./vfxSystem";
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

    if (previous === "start" || previous === "clear") {
      resetRoundState(this.state, this.config, this.state.vfx.reducedMotion, this.random);
    } else if (previous === "stageclear") {
      advanceStage(this.state, this.config, this.random);
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
    const stageLabel = `STAGE ${this.state.campaign.stageIndex + 1} / ${this.state.campaign.totalStages}`;
    setSceneUI(
      this.overlay,
      this.state.scene,
      this.state.score,
      this.state.lives,
      clearTime,
      this.state.errorMessage ?? undefined,
      stageLabel,
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
          if (this.state.vfx.hitFreezeMs > 0) {
            updateVfxState(this.state.vfx, this.config.fixedDeltaSec, this.random);
            continue;
          }
          this.stepPlayingTick();
          updateVfxState(this.state.vfx, this.config.fixedDeltaSec, this.random);
          if (this.state.scene !== "playing") {
            break;
          }
        }
      } else {
        updateVfxState(this.state.vfx, delta, this.random);
      }

      recordTrailPoint(this.state.vfx, this.state.scene, this.state.balls[0]?.pos);
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

  private stepPlayingTick(): void {
    this.state.elapsedSec += this.config.fixedDeltaSec;
    updateItemTimers(this.state.items, this.state.elapsedSec);

    const stageInitialSpeed = getStageInitialBallSpeed(this.config, this.state.campaign.stageIndex);
    const stageMaxSpeed = getStageMaxBallSpeed(this.config, this.state.campaign.stageIndex);
    const maxWithAssist = getCurrentMaxBallSpeed(stageMaxSpeed, this.state.assist, this.state.elapsedSec);
    const effectiveMaxSpeed =
      maxWithAssist * getSlowBallMaxSpeedScale(this.state.items, this.state.elapsedSec);

    const basePaddleWidth =
      GAME_BALANCE.paddleWidth * getPaddleScale(this.state.items, this.state.elapsedSec);
    applyAssistToPaddle(
      this.state.paddle,
      basePaddleWidth,
      this.config.width,
      this.state.assist,
      this.state.elapsedSec,
    );

    const events: CollisionEvent[] = [];
    const survivors: Ball[] = [];
    let scoreGain = 0;
    let hasClear = false;

    for (const ball of this.state.balls) {
      const result = stepPhysics(
        ball,
        this.state.paddle,
        this.state.bricks,
        this.config,
        this.config.fixedDeltaSec,
        {
          maxBallSpeed: effectiveMaxSpeed,
          initialBallSpeed: stageInitialSpeed,
          onMiss: (target) => this.tryShieldRescue(target, effectiveMaxSpeed),
        },
      );

      events.push(...result.events);
      if (result.collision.brick > 0) {
        scoreGain += result.scoreGain;
      }
      if (result.cleared) {
        hasClear = true;
      }
      if (result.livesLost <= 0) {
        survivors.push(ball);
      }
    }

    this.state.score += scoreGain;
    playCollisionSounds(this.sfx, events);
    applyCollisionEvents(this.state.vfx, events, this.random);
    spawnDropsFromBrickEvents(this.state.items, events, this.random);

    const picks = updateFallingItems(
      this.state.items,
      this.state.paddle,
      this.config.height,
      this.config.fixedDeltaSec,
    );
    for (const pick of picks) {
      applyItemPickup(this.state.items, pick.type, this.state.elapsedSec, survivors);
      spawnItemPickupFeedback(this.state.vfx, pick.type, pick.pos.x, pick.pos.y);
    }
    if (picks.length > 0) {
      void this.sfx.play("paddle");
    }

    updateItemTimers(this.state.items, this.state.elapsedSec);
    this.state.balls = trimBallsWhenMultiballEnds(this.state.items, this.state.elapsedSec, survivors);
    this.state.balls = ensureMultiballCount(
      this.state.items,
      this.state.elapsedSec,
      this.state.balls,
      this.random,
    );

    if (hasClear) {
      this.handleStageClear();
      return;
    }

    if (this.state.balls.length <= 0) {
      this.handleBallLoss();
    }
  }

  private handleStageClear(): void {
    triggerHitFreeze(this.state.vfx, 72);
    this.state.score += this.state.lives * GAME_BALANCE.clearBonusPerLife;
    if (this.state.campaign.stageIndex >= this.state.campaign.totalStages - 1) {
      void this.sfx.play("clear");
      this.sendScene({ type: "GAME_CLEAR" });
      return;
    }
    void this.sfx.play("clear");
    this.sendScene({ type: "STAGE_CLEAR" });
  }

  private handleBallLoss(): void {
    if (!applyLifeLoss(this.state, 1, this.config, this.random)) {
      retryCurrentStage(this.state, this.config, this.random);
      this.sendScene({ type: "GAME_OVER" });
    }
  }

  private tryShieldRescue(ball: Ball, fallbackSpeed: number): boolean {
    if (!consumeShield(this.state.items, this.state.elapsedSec)) {
      return false;
    }

    ball.pos.y = this.config.height - ball.radius - 10;
    ball.vel.y = -Math.max(120, Math.abs(ball.vel.y));
    if (Math.abs(ball.vel.x) < 40) {
      const spread = Math.max(40, fallbackSpeed * 0.28);
      ball.vel.x = (this.random.next() * 2 - 1) * spread;
    }
    return true;
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
