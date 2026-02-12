import type { Ball, GameConfig, GameState, Scene } from './types';
import { buildBricks, getBrickColor } from './level';
import { type PhysicsResult, stepPhysics } from './physics';
import { getOverlayElements, setSceneUI } from '../ui/overlay';
import { SfxManager } from '../audio/sfx';

interface HudElements {
  score: HTMLSpanElement;
  lives: HTMLSpanElement;
  time: HTMLSpanElement;
}

export class Game {
  private readonly config: GameConfig = {
    width: 960,
    height: 540,
    fixedDeltaSec: 1 / 120,
    initialLives: 3,
    initialBallSpeed: 320,
    maxBallSpeed: 620,
  };

  private readonly ctx: CanvasRenderingContext2D;
  private readonly sfx = new SfxManager();
  private state: GameState;
  private lastFrameTime = 0;
  private accumulator = 0;

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly hud: HudElements,
    private readonly overlay: ReturnType<typeof getOverlayElements>,
  ) {
    const context = this.canvas.getContext('2d');
    if (!context) {
      throw new Error('Canvasが利用できませんでした');
    }

    this.ctx = context;
    this.state = this.createInitialState();
    this.adjustCanvasScale();
    setSceneUI(this.overlay, this.state.scene, this.state.score, this.state.lives);
  }

  start(): void {
    this.bindInputs();
    this.render();
    this.updateHud();
    requestAnimationFrame(this.loop);
  }

  private createInitialState(): GameState {
    const paddle = {
      x: this.config.width / 2 - 60,
      y: this.config.height - 44,
      width: 120,
      height: 16,
    };

    const ball: Ball = {
      pos: {
        x: this.config.width / 2,
        y: paddle.y - 24,
      },
      vel: { x: 0, y: 0 },
      radius: 8,
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

  private bindInputs(): void {
    this.canvas.addEventListener('mousemove', (event) => {
      this.movePaddleByMouse(event);
    });

    this.overlay.button.addEventListener('click', () => {
      void this.sfx.resumeIfNeeded();
      if (this.state.scene === 'paused') {
        this.setScene('playing');
        return;
      }
      this.startNewPlay();
    });

    window.addEventListener('keydown', (event) => {
      const key = event.key.toLowerCase();

      if (key === 'p') {
        if (this.state.scene === 'playing') {
          this.setScene('paused');
          return;
        }
        if (this.state.scene === 'paused') {
          this.setScene('playing');
        }
      }

      if (key === ' ' || key === 'enter') {
        if (this.state.scene === 'paused') {
          this.setScene('playing');
          return;
        }
        if (this.state.scene === 'playing') {
          return;
        }
        this.startNewPlay();
      }
    });

    window.addEventListener('resize', () => {
      this.adjustCanvasScale();
    });
  }

  private startNewPlay(): void {
    if (this.state.scene !== 'start' && this.state.scene !== 'gameover' && this.state.scene !== 'clear') {
      return;
    }

    this.state.score = 0;
    this.state.lives = this.config.initialLives;
    this.state.elapsedSec = 0;
    this.state.bricks = buildBricks();
    this.state.ball = this.createServeBall();
    this.setScene('playing');
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
    requestAnimationFrame(this.loop);
  };

  private handlePhysicsResult(result: PhysicsResult): void {
    if (result.collision.wall) {
      void this.sfx.play('wall');
    }
    if (result.collision.paddle) {
      void this.sfx.play('paddle');
    }
    if (result.collision.brick > 0) {
      this.state.score += result.scoreGain;
      void this.sfx.play('brick');
    }

    if (result.livesLost > 0) {
      this.state.lives -= result.livesLost;
      void this.sfx.play('miss');
      if (this.state.lives <= 0) {
        this.setScene('gameover');
        return;
      }
      this.state.ball = this.createServeBall();
      return;
    }

    if (result.cleared) {
      this.state.score += this.state.lives * 500;
      void this.sfx.play('clear');
      this.setScene('clear');
    }
  }

  private movePaddleByMouse(event: MouseEvent): void {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.config.width / rect.width;
    const worldX = (event.clientX - rect.left) * scaleX;
    const half = this.state.paddle.width / 2;
    this.state.paddle.x = Math.max(0, Math.min(this.config.width - this.state.paddle.width, worldX - half));
  }

  private createServeBall(): Ball {
    const speed = this.config.initialBallSpeed;
    const horizontal = (Math.random() - 0.5) * speed * 0.6;
    const vx = Math.max(-speed * 0.45, Math.min(speed * 0.45, horizontal));
    const vy = -Math.sqrt(speed * speed - vx * vx);

    return {
      pos: {
        x: this.state.paddle.x + this.state.paddle.width / 2,
        y: this.state.paddle.y - 18,
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
    this.ctx.clearRect(0, 0, this.config.width, this.config.height);
    this.drawBackdrop();
    this.drawBricks();
    this.drawPaddle();
    this.drawBall();

    if (this.state.scene !== 'playing') {
      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
      this.ctx.fillRect(0, 0, this.config.width, this.config.height);
    }
  }

  private drawBackdrop(): void {
    const grad = this.ctx.createLinearGradient(0, 0, this.config.width, this.config.height);
    grad.addColorStop(0, 'rgba(255, 255, 255, 0.25)');
    grad.addColorStop(1, 'rgba(255, 255, 255, 0.04)');

    this.ctx.fillStyle = grad;
    this.ctx.fillRect(0, 0, this.config.width, this.config.height);
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(4, 4, this.config.width - 8, this.config.height - 8);
  }

  private drawBricks(): void {
    this.state.bricks.forEach((brick, index) => {
      if (!brick.alive) {
        return;
      }

      const color = brick.color || getBrickColor(brick.row ?? Math.floor(index / 10));
      const glass = this.ctx.createLinearGradient(brick.x, brick.y, brick.x, brick.y + brick.height);
      glass.addColorStop(0, color);
      glass.addColorStop(1, 'rgba(255, 255, 255, 0.08)');

      this.ctx.fillStyle = glass;
      this.ctx.fillRect(brick.x, brick.y, brick.width, brick.height);
      this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
      this.ctx.lineWidth = 1;
      this.ctx.strokeRect(brick.x, brick.y, brick.width, brick.height);
    });
  }

  private drawPaddle(): void {
    const grad = this.ctx.createLinearGradient(this.state.paddle.x, this.state.paddle.y, this.state.paddle.x, this.state.paddle.y + this.state.paddle.height);
    grad.addColorStop(0, 'rgba(255, 255, 255, 0.94)');
    grad.addColorStop(1, 'rgba(160, 200, 255, 0.86)');

    this.ctx.fillStyle = grad;
    this.ctx.beginPath();
    this.ctx.roundRect(this.state.paddle.x, this.state.paddle.y, this.state.paddle.width, this.state.paddle.height, 9);
    this.ctx.fill();
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
    this.ctx.stroke();
  }

  private drawBall(): void {
    const radial = this.ctx.createRadialGradient(
      this.state.ball.pos.x - 2,
      this.state.ball.pos.y - 2,
      0,
      this.state.ball.pos.x,
      this.state.ball.pos.y,
      this.state.ball.radius,
    );
    radial.addColorStop(0, 'rgba(255, 255, 255, 1)');
    radial.addColorStop(1, 'rgba(77, 165, 255, 0.9)');

    this.ctx.fillStyle = radial;
    this.ctx.beginPath();
    this.ctx.arc(this.state.ball.pos.x, this.state.ball.pos.y, this.state.ball.radius, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    this.ctx.stroke();
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
