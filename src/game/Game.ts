import type {
  Ball,
  CollisionEvent,
  CollisionEventKind,
  GameConfig,
  GameState,
  Particle,
  Scene,
  VfxState,
} from './types';
import { GAME_CONFIG, GAME_BALANCE } from './config';
import { buildBricks } from './level';
import { Renderer } from './renderer';
import { type PhysicsResult, stepPhysics } from './physics';
import { getOverlayElements, setSceneUI } from '../ui/overlay';
import { SfxManager } from '../audio/sfx';
import { InputController } from './input';

const MIN_CANVAS_CSS_WIDTH = 320;
const MIN_CANVAS_CSS_HEIGHT = 180;
const MAX_PARTICLES = 220;
const MAX_TRAIL_POINTS = 8;

interface HudElements {
  score: HTMLSpanElement;
  lives: HTMLSpanElement;
  time: HTMLSpanElement;
}

interface GameDeps {
  ctx: CanvasRenderingContext2D;
  config?: Partial<GameConfig>;
}

export interface CanvasFit {
  cssWidth: number;
  cssHeight: number;
}

export function computeCanvasFit(
  wrapperWidth: number,
  wrapperHeight: number,
  ratio: number,
  minWidth = MIN_CANVAS_CSS_WIDTH,
  minHeight = MIN_CANVAS_CSS_HEIGHT,
): CanvasFit {
  const width = Math.max(minWidth, wrapperWidth);
  const height = Math.max(minHeight, wrapperHeight);

  const fitHeight = width / ratio;
  if (fitHeight <= height) {
    return {
      cssWidth: width,
      cssHeight: fitHeight,
    };
  }

  return {
    cssWidth: height * ratio,
    cssHeight: height,
  };
}

export function shouldAutoPauseOnVisibility(scene: Scene, visibilityState: DocumentVisibilityState): boolean {
  return scene === 'playing' && visibilityState === 'hidden';
}

export function nextDensityScale(current: number, deltaSec: number, scene: Scene): number {
  if (scene !== 'playing') {
    return current;
  }

  if (deltaSec > 1 / 30) {
    return Math.max(0.45, current - 0.14);
  }

  return Math.min(1, current + 0.04);
}

export function computeParticleSpawnCount(baseCount: number, densityScale: number, reducedMotion: boolean): number {
  const reduction = reducedMotion ? 0.5 : 1;
  return Math.max(1, Math.round(baseCount * densityScale * reduction));
}

export class Game {
  private readonly config: GameConfig;
  private readonly renderer: Renderer;
  private readonly sfx = new SfxManager();
  private readonly input: InputController;
  private readonly prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  private readonly stageWrap: HTMLElement | null;

  private state: GameState;
  private lastFrameTime = 0;
  private accumulator = 0;
  private isRunning = false;
  private resizeObserver: ResizeObserver | null = null;
  private lifecycleBound = false;

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly hud: HudElements,
    private readonly overlay: ReturnType<typeof getOverlayElements>,
    deps?: GameDeps,
  ) {
    const context = deps?.ctx ?? this.canvas.getContext('2d');
    if (!context) {
      throw new Error('Canvasが利用できませんでした');
    }

    this.config = {
      ...GAME_CONFIG,
      ...deps?.config,
    };
    this.stageWrap = this.canvas.parentElement;

    this.input = new InputController(this.canvas, {
      moveByMouseX: (clientX) => this.movePaddleByMouse(clientX),
      pauseToggle: () => this.togglePause(),
      startOrRestart: () => this.startOrResume(),
      resize: () => this.adjustCanvasScale(),
    });

    this.renderer = new Renderer(context, this.config);
    this.state = this.createInitialState();

    this.runSafely(() => {
      this.adjustCanvasScale();
      this.bindOverlay();
      this.bindLifecycleEvents();
      setSceneUI(this.overlay, this.state.scene, this.state.score, this.state.lives);
    }, '初期化中に問題が発生しました。');
  }

  start(): void {
    if (this.isRunning || this.state.scene === 'error') {
      return;
    }

    this.runSafely(() => {
      this.isRunning = true;
      this.input.attach();
      this.render();
      this.updateHud();
      requestAnimationFrame(this.loop);
    }, 'ゲーム開始時に問題が発生しました。');
  }

  private bindOverlay(): void {
    this.overlay.button.addEventListener('click', () => {
      if (this.state.scene === 'error') {
        window.location.reload();
        return;
      }

      void this.sfx.resumeIfNeeded().catch(() => {
        // Audio is optional; continue gameplay even if audio context cannot be created/resumed.
      });

      this.runSafely(() => {
        this.startOrResume();
      }, '開始処理に失敗しました。');
    });
  }

  private bindLifecycleEvents(): void {
    if (this.lifecycleBound) {
      return;
    }
    this.lifecycleBound = true;

    document.addEventListener('visibilitychange', this.handleVisibilityChange);
    if (typeof ResizeObserver !== 'undefined' && this.stageWrap) {
      this.resizeObserver = new ResizeObserver(() => {
        this.adjustCanvasScale();
      });
      this.resizeObserver.observe(this.stageWrap);
    }
  }

  private handleVisibilityChange = (): void => {
    if (shouldAutoPauseOnVisibility(this.state.scene, document.visibilityState)) {
      this.pauseGame();
    }
  };

  private createInitialState(): GameState {
    const paddle = {
      x: this.config.width / 2 - GAME_BALANCE.paddleWidth / 2,
      y: this.config.height - GAME_BALANCE.paddleBottomOffset,
      width: GAME_BALANCE.paddleWidth,
      height: GAME_BALANCE.paddleHeight,
    };

    const ball: Ball = {
      pos: {
        x: this.config.width / 2,
        y: paddle.y - (GAME_BALANCE.paddleHeight + GAME_BALANCE.ballRadius + 2),
      },
      vel: { x: 0, y: 0 },
      radius: GAME_BALANCE.ballRadius,
      speed: this.config.initialBallSpeed,
    };

    return {
      scene: 'start',
      score: 0,
      lives: this.config.initialLives,
      elapsedSec: 0,
      ball,
      paddle,
      bricks: buildBricks(),
      assist: {
        untilSec: 0,
        paddleScale: this.config.assistPaddleScale,
        maxSpeedScale: this.config.assistMaxSpeedScale,
      },
      vfx: this.createVfxState(),
      errorMessage: null,
    };
  }

  private createVfxState(): VfxState {
    return {
      particles: [],
      flashMs: 0,
      shakeMs: 0,
      shakePx: 0,
      trail: [],
      densityScale: 1,
      reducedMotion: this.prefersReducedMotion,
    };
  }

  private startOrResume(): void {
    if (this.state.scene === 'playing' || this.state.scene === 'error') {
      return;
    }

    if (this.state.scene === 'paused') {
      this.resumeGame();
      return;
    }

    if (this.state.scene === 'start' || this.state.scene === 'gameover' || this.state.scene === 'clear') {
      this.resetRound();
      this.startRound();
    }
  }

  private togglePause(): void {
    if (this.state.scene === 'playing') {
      this.pauseGame();
      return;
    }

    if (this.state.scene === 'paused') {
      this.resumeGame();
    }
  }

  private startRound(): void {
    this.lastFrameTime = 0;
    this.accumulator = 0;
    this.setScene('playing');
  }

  private pauseGame(): void {
    this.setScene('paused');
  }

  private resumeGame(): void {
    this.lastFrameTime = 0;
    this.accumulator = 0;
    this.setScene('playing');
  }

  private resetRound(): void {
    this.state = this.createInitialState();
    this.state.ball = this.createServeBall();
  }

  private setScene(next: Scene): void {
    this.state.scene = next;
    const clearTime = next === 'clear' ? this.formatTime(this.state.elapsedSec) : undefined;
    setSceneUI(this.overlay, next, this.state.score, this.state.lives, clearTime, this.state.errorMessage ?? undefined);
  }

  private loop = (timeMs: number): void => {
    if (!this.isRunning) {
      return;
    }

    try {
      const timeSec = timeMs / 1000;
      if (this.lastFrameTime === 0) {
        this.lastFrameTime = timeSec;
      }

      const delta = Math.min(0.25, timeSec - this.lastFrameTime);
      this.lastFrameTime = timeSec;
      this.updateVfxDensity(delta);

      if (this.state.scene === 'playing') {
        this.accumulator += delta;
        const fixed = this.config.fixedDeltaSec;
        while (this.accumulator >= fixed) {
          this.accumulator -= fixed;
          this.state.elapsedSec += fixed;
          this.updateAssistState();

          const result = stepPhysics(
            this.state.ball,
            this.state.paddle,
            this.state.bricks,
            this.config,
            fixed,
            {
              maxBallSpeed: this.getCurrentMaxBallSpeed(),
            },
          );

          this.handlePhysicsResult(result);
          this.updateVfxState(fixed);

          if (this.state.scene !== 'playing') {
            break;
          }
        }
      } else {
        this.updateVfxState(delta);
      }

      this.recordTrailPoint();
      this.render();
      this.updateHud();
    } catch (error) {
      this.setRuntimeError(this.toRuntimeMessage(error, '実行中にエラーが発生しました。'));
    }

    if (this.isRunning) {
      requestAnimationFrame(this.loop);
    }
  };

  private handlePhysicsResult(result: PhysicsResult): void {
    this.playCollisionSound(result.events);
    this.applyEventsToVfx(result.events);

    if (result.collision.brick > 0) {
      this.state.score += result.scoreGain;
    }

    if (result.livesLost > 0) {
      this.handleLifeLoss(result.livesLost);
      return;
    }

    if (result.cleared) {
      this.handleClear();
    }
  }

  private playCollisionSound(events: CollisionEvent[]): void {
    const kinds = new Set<CollisionEventKind>();
    for (const event of events) {
      if (kinds.has(event.kind)) {
        continue;
      }
      kinds.add(event.kind);

      if (event.kind === 'wall') {
        void this.sfx.play('wall');
      } else if (event.kind === 'paddle') {
        void this.sfx.play('paddle');
      } else if (event.kind === 'brick') {
        void this.sfx.play('brick');
      } else if (event.kind === 'miss') {
        void this.sfx.play('miss');
      }
    }
  }

  private handleLifeLoss(livesLost: number): void {
    this.state.lives -= livesLost;
    if (this.state.lives <= 0) {
      this.setScene('gameover');
      return;
    }

    this.activateAssist();
    this.updateAssistState();
    this.state.ball = this.createServeBall();
  }

  private activateAssist(): void {
    this.state.assist.untilSec = this.state.elapsedSec + this.config.assistDurationSec;
  }

  private updateAssistState(): void {
    const active = this.state.elapsedSec < this.state.assist.untilSec;
    const targetWidth = GAME_BALANCE.paddleWidth * (active ? this.state.assist.paddleScale : 1);
    if (Math.abs(targetWidth - this.state.paddle.width) < 0.001) {
      return;
    }

    const centerX = this.state.paddle.x + this.state.paddle.width / 2;
    this.state.paddle.width = targetWidth;
    this.state.paddle.x = clamp(
      centerX - this.state.paddle.width / 2,
      0,
      this.config.width - this.state.paddle.width,
    );
  }

  private getCurrentMaxBallSpeed(): number {
    const active = this.state.elapsedSec < this.state.assist.untilSec;
    if (!active) {
      return this.config.maxBallSpeed;
    }
    return this.config.maxBallSpeed * this.state.assist.maxSpeedScale;
  }

  private handleClear(): void {
    this.state.score += this.state.lives * GAME_BALANCE.clearBonusPerLife;
    void this.sfx.play('clear');
    this.setScene('clear');
  }

  private movePaddleByMouse(clientX: number): void {
    const rect = this.canvas.getBoundingClientRect();
    if (rect.width <= 0) {
      return;
    }

    const scaleX = this.config.width / rect.width;
    const worldX = (clientX - rect.left) * scaleX;
    const half = this.state.paddle.width / 2;
    this.state.paddle.x = Math.max(0, Math.min(this.config.width - this.state.paddle.width, worldX - half));
  }

  private createServeBall(): Ball {
    const speed = this.config.initialBallSpeed;
    const spread = (Math.random() - 0.5) * speed * GAME_BALANCE.serveSpreadRatio;
    const vx = Math.max(-speed * 0.45, Math.min(speed * 0.45, spread));
    const vy = -Math.sqrt(speed * speed - vx * vx);

    return {
      pos: {
        x: this.state.paddle.x + this.state.paddle.width / 2,
        y: this.state.paddle.y - GAME_BALANCE.serveYOffset,
      },
      vel: {
        x: vx,
        y: vy,
      },
      radius: this.state.ball.radius,
      speed,
    };
  }

  private adjustCanvasScale(): void {
    const wrapper = this.stageWrap;
    if (!wrapper) {
      return;
    }

    const ratio = this.config.width / this.config.height;
    const fit = computeCanvasFit(wrapper.clientWidth, wrapper.clientHeight, ratio);
    this.canvas.width = this.config.width;
    this.canvas.height = this.config.height;
    this.canvas.style.width = `${fit.cssWidth}px`;
    this.canvas.style.height = `${fit.cssHeight}px`;
  }

  private updateVfxDensity(deltaSec: number): void {
    this.state.vfx.densityScale = nextDensityScale(this.state.vfx.densityScale, deltaSec, this.state.scene);
  }

  private applyEventsToVfx(events: CollisionEvent[]): void {
    for (const event of events) {
      if (event.kind === 'brick') {
        this.spawnParticles(event, 14, 260, event.color ?? 'rgba(255, 196, 118, 0.95)');
        this.bumpShake(4, 90);
        continue;
      }

      if (event.kind === 'paddle' || event.kind === 'wall') {
        this.spawnParticles(event, 4, 140, 'rgba(180, 230, 255, 0.95)');
        this.bumpShake(4, 70);
        continue;
      }

      if (event.kind === 'miss') {
        this.spawnParticles(event, 18, 220, 'rgba(255, 108, 108, 0.95)');
        this.state.vfx.flashMs = Math.max(this.state.vfx.flashMs, this.state.vfx.reducedMotion ? 90 : 180);
        this.bumpShake(8, this.state.vfx.reducedMotion ? 0 : 140);
      }
    }
  }

  private bumpShake(shakePx: number, durationMs: number): void {
    if (this.state.vfx.reducedMotion || durationMs <= 0) {
      return;
    }
    this.state.vfx.shakeMs = Math.max(this.state.vfx.shakeMs, durationMs);
    this.state.vfx.shakePx = Math.max(this.state.vfx.shakePx, shakePx);
  }

  private spawnParticles(event: CollisionEvent, baseCount: number, lifeMs: number, color: string): void {
    const count = computeParticleSpawnCount(baseCount, this.state.vfx.densityScale, this.state.vfx.reducedMotion);
    for (let i = 0; i < count; i += 1) {
      if (this.state.vfx.particles.length >= MAX_PARTICLES) {
        this.state.vfx.particles.shift();
      }

      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.55;
      const speed = 100 + Math.random() * 160;
      const particle: Particle = {
        pos: { x: event.x, y: event.y },
        vel: { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed },
        lifeMs,
        maxLifeMs: lifeMs,
        size: 1.8 + Math.random() * 3.2,
        color,
      };
      this.state.vfx.particles.push(particle);
    }
  }

  private updateVfxState(deltaSec: number): void {
    const deltaMs = deltaSec * 1000;
    this.state.vfx.flashMs = Math.max(0, this.state.vfx.flashMs - deltaMs);
    this.state.vfx.shakeMs = Math.max(0, this.state.vfx.shakeMs - deltaMs);
    if (this.state.vfx.shakeMs <= 0) {
      this.state.vfx.shakePx = 0;
    }

    this.state.vfx.particles = this.state.vfx.particles.filter((particle) => {
      particle.lifeMs -= deltaMs;
      if (particle.lifeMs <= 0) {
        return false;
      }

      particle.pos.x += particle.vel.x * deltaSec;
      particle.pos.y += particle.vel.y * deltaSec;
      particle.vel.x *= 0.94;
      particle.vel.y *= 0.94;
      return true;
    });
  }

  private recordTrailPoint(): void {
    if (this.state.scene !== 'playing') {
      if (this.state.scene !== 'paused') {
        this.state.vfx.trail = [];
      }
      return;
    }

    this.state.vfx.trail.push({
      x: this.state.ball.pos.x,
      y: this.state.ball.pos.y,
    });

    while (this.state.vfx.trail.length > MAX_TRAIL_POINTS) {
      this.state.vfx.trail.shift();
    }
  }

  private render(): void {
    this.renderer.render(this.state);
  }

  private updateHud(): void {
    this.hud.score.textContent = `SCORE: ${this.state.score}`;
    this.hud.lives.textContent = `LIVES: ${this.state.lives}`;
    this.hud.time.textContent = `TIME: ${this.formatTime(this.state.elapsedSec)}`;
  }

  private formatTime(totalSec: number): string {
    const min = Math.floor(totalSec / 60);
    const sec = Math.floor(totalSec % 60);
    return `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  }

  private runSafely(action: () => void, fallbackMessage: string): void {
    try {
      action();
    } catch (error) {
      this.setRuntimeError(this.toRuntimeMessage(error, fallbackMessage));
    }
  }

  private setRuntimeError(message: string): void {
    this.isRunning = false;
    this.state.errorMessage = message;
    this.state.scene = 'error';
    this.input.detach();
    try {
      setSceneUI(this.overlay, 'error', this.state.score, this.state.lives, undefined, message);
      this.render();
      this.updateHud();
    } catch {
      // Last-resort fallback: if rendering itself fails, keep state.error only.
    }
  }

  private toRuntimeMessage(error: unknown, fallback: string): string {
    if (error instanceof Error && error.message) {
      return `${fallback} (${error.message})`;
    }
    return fallback;
  }
}

function clamp(value: number, min: number, max: number): number {
  if (value < min) {
    return min;
  }
  if (value > max) {
    return max;
  }
  return value;
}
