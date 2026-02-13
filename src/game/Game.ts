import type { Ball, GameConfig, GameState, Scene } from './types';
import { GAME_CONFIG, GAME_BALANCE } from './config';
import { buildBricks } from './level';
import { Renderer } from './renderer';
import { type PhysicsResult, stepPhysics } from './physics';
import { getOverlayElements, setSceneUI } from '../ui/overlay';
import { SfxManager } from '../audio/sfx';
import { InputController } from './input';

interface HudElements {
  score: HTMLSpanElement;
  lives: HTMLSpanElement;
  time: HTMLSpanElement;
}

interface GameDeps {
  ctx: CanvasRenderingContext2D;
  config?: Partial<GameConfig>;
}

export class Game {
  private readonly config: GameConfig;
  private readonly renderer: Renderer;
  private readonly sfx = new SfxManager();
  private readonly input = new InputController(this.canvas, {
    moveByMouseX: (clientX) => this.movePaddleByMouse(clientX),
    pauseToggle: () => this.togglePause(),
    startOrRestart: () => this.startOrResume(),
    resize: () => this.adjustCanvasScale(),
  });

  private state: GameState;
  private lastFrameTime = 0;
  private accumulator = 0;
  private isRunning = false;

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
    this.renderer = new Renderer(context, this.config);
    this.state = this.createInitialState();
    this.adjustCanvasScale();
    this.bindOverlay();
    setSceneUI(this.overlay, this.state.scene, this.state.score, this.state.lives);
  }

  start(): void {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;
    this.input.attach();
    this.render();
    this.updateHud();
    requestAnimationFrame(this.loop);
  }

  private bindOverlay(): void {
    this.overlay.button.addEventListener('click', async () => {
      await this.sfx.resumeIfNeeded();
      this.startOrResume();
    });
  }

  private createInitialState(): GameState {
    const paddle = {
      x: this.config.width / 2 - GAME_BALANCE.paddleWidth / 2,
      y: this.config.height - GAME_BALANCE.paddleBottomOffset,
      width: GAME_BALANCE.paddleWidth,
      height: GAME_BALANCE.paddleHeight,
    };
    const halfBallGap = (GAME_BALANCE.paddleHeight + GAME_BALANCE.ballRadius + 2);

    const ball: Ball = {
      pos: {
        x: this.config.width / 2,
        y: paddle.y - halfBallGap,
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
    };
  }

  private startOrResume(): void {
    if (this.state.scene === 'playing') {
      return;
    }

    if (this.state.scene === 'paused') {
      this.resumeGame();
      return;
    }

    if (this.state.scene === 'start' || this.state.scene === 'gameover' || this.state.scene === 'clear') {
      this.resetRound();
      this.startRound();
      return;
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
    this.state.score = 0;
    this.state.lives = this.config.initialLives;
    this.state.elapsedSec = 0;
    this.state.bricks = buildBricks();
    this.state.ball = this.createServeBall();
  }

  private setScene(next: Scene): void {
    this.state.scene = next;
    const clearTime = next === 'clear' ? this.formatTime(this.state.elapsedSec) : undefined;
    setSceneUI(this.overlay, next, this.state.score, this.state.lives, clearTime);
  }

  private loop = (timeMs: number): void => {
    const timeSec = timeMs / 1000;
    if (this.lastFrameTime === 0) {
      this.lastFrameTime = timeSec;
    }

    const delta = Math.min(0.25, timeSec - this.lastFrameTime);
    this.lastFrameTime = timeSec;

    if (this.state.scene === 'playing') {
      this.accumulator += delta;
      const fixed = this.config.fixedDeltaSec;
      while (this.accumulator >= fixed) {
        this.accumulator -= fixed;
        this.state.elapsedSec += fixed;

        const result = stepPhysics(
          this.state.ball,
          this.state.paddle,
          this.state.bricks,
          this.config,
          fixed,
        );

        this.handlePhysicsResult(result);

        if (this.state.scene !== 'playing') {
          break;
        }
      }
    }

    this.render();
    this.updateHud();

    if (this.isRunning) {
      requestAnimationFrame(this.loop);
    }
  };

  private handlePhysicsResult(result: PhysicsResult): void {
    this.playCollisionSound(result);

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

  private playCollisionSound(result: PhysicsResult): void {
    if (result.collision.wall) {
      void this.sfx.play('wall');
    }

    if (result.collision.paddle) {
      void this.sfx.play('paddle');
    }

    if (result.collision.brick > 0) {
      void this.sfx.play('brick');
    }
  }

  private handleLifeLoss(livesLost: number): void {
    this.state.lives -= livesLost;
    void this.sfx.play('miss');
    if (this.state.lives <= 0) {
      this.setScene('gameover');
      return;
    }
    this.state.ball = this.createServeBall();
  }

  private handleClear(): void {
    this.state.score += this.state.lives * GAME_BALANCE.clearBonusPerLife;
    void this.sfx.play('clear');
    this.setScene('clear');
  }

  private movePaddleByMouse(clientX: number): void {
    const rect = this.canvas.getBoundingClientRect();
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
    const wrapper = this.canvas.parentElement;
    if (!wrapper) {
      return;
    }

    const width = wrapper.clientWidth;
    const height = wrapper.clientHeight;
    const ratio = this.config.width / this.config.height;

    const fitHeight = width / ratio;
    if (fitHeight <= height) {
      this.canvas.width = this.config.width;
      this.canvas.height = this.config.height;
      this.canvas.style.width = `${width}px`;
      this.canvas.style.height = `${fitHeight}px`;
    } else {
      const fitWidth = height * ratio;
      this.canvas.width = this.config.width;
      this.canvas.height = this.config.height;
      this.canvas.style.width = `${fitWidth}px`;
      this.canvas.style.height = `${height}px`;
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
}
