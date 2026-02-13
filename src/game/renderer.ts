import type { Ball, Brick, GameConfig, GameState } from './types';

export interface RenderTheme {
  backdropStart: string;
  backdropEnd: string;
  backdropStroke: string;
  overlayTint: string;
  brickGlow: string;
  brickStroke: string;
  paddleStart: string;
  paddleEnd: string;
  paddleStroke: string;
  paddleText: string;
  ballCore: string;
  ballStroke: string;
}

export const DEFAULT_RENDER_THEME: RenderTheme = {
  backdropStart: 'rgba(255, 255, 255, 0.25)',
  backdropEnd: 'rgba(255, 255, 255, 0.04)',
  backdropStroke: 'rgba(255, 255, 255, 0.2)',
  overlayTint: 'rgba(255, 255, 255, 0.04)',
  brickGlow: 'rgba(255, 255, 255, 0.08)',
  brickStroke: 'rgba(255, 255, 255, 0.45)',
  paddleStart: 'rgba(255, 255, 255, 0.94)',
  paddleEnd: 'rgba(160, 200, 255, 0.86)',
  paddleStroke: 'rgba(255, 255, 255, 0.7)',
  paddleText: 'rgba(255, 255, 255, 1)',
  ballCore: 'rgba(77, 165, 255, 0.9)',
  ballStroke: 'rgba(255, 255, 255, 0.8)',
};

export class Renderer {
  constructor(
    private readonly ctx: CanvasRenderingContext2D,
    private readonly config: GameConfig,
    private readonly theme: RenderTheme = DEFAULT_RENDER_THEME,
  ) {}

  render(state: GameState): void {
    this.ctx.clearRect(0, 0, this.config.width, this.config.height);
    this.drawBackdrop();
    this.drawBricks(state.bricks);
    this.drawPaddle(state.paddle);
    this.drawBall(state.ball);

    if (state.scene !== 'playing') {
      this.ctx.fillStyle = this.theme.overlayTint;
      this.ctx.fillRect(0, 0, this.config.width, this.config.height);
    }
  }

  private drawBackdrop(): void {
    const grad = this.ctx.createLinearGradient(0, 0, this.config.width, this.config.height);
    grad.addColorStop(0, this.theme.backdropStart);
    grad.addColorStop(1, this.theme.backdropEnd);

    this.ctx.fillStyle = grad;
    this.ctx.fillRect(0, 0, this.config.width, this.config.height);
    this.ctx.strokeStyle = this.theme.backdropStroke;
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(4, 4, this.config.width - 8, this.config.height - 8);
  }

  private drawBricks(bricks: Brick[]): void {
    bricks.forEach((brick) => {
      if (!brick.alive) {
        return;
      }

      const glass = this.ctx.createLinearGradient(brick.x, brick.y, brick.x, brick.y + brick.height);
      glass.addColorStop(0, brick.color ?? 'rgba(255, 180, 120, 0.35)');
      glass.addColorStop(1, this.theme.brickGlow);

      this.ctx.fillStyle = glass;
      this.ctx.fillRect(brick.x, brick.y, brick.width, brick.height);
      this.ctx.strokeStyle = this.theme.brickStroke;
      this.ctx.lineWidth = 1;
      this.ctx.strokeRect(brick.x, brick.y, brick.width, brick.height);
    });
  }

  private drawPaddle(paddle: GameState['paddle']): void {
    const grad = this.ctx.createLinearGradient(paddle.x, paddle.y, paddle.x, paddle.y + paddle.height);
    grad.addColorStop(0, this.theme.paddleStart);
    grad.addColorStop(1, this.theme.paddleEnd);

    this.ctx.fillStyle = grad;
    this.ctx.beginPath();
    this.ctx.roundRect(paddle.x, paddle.y, paddle.width, paddle.height, 9);
    this.ctx.fill();
    this.ctx.strokeStyle = this.theme.paddleStroke;
    this.ctx.stroke();
  }

  private drawBall(ball: Ball): void {
    const radial = this.ctx.createRadialGradient(
      ball.pos.x - 2,
      ball.pos.y - 2,
      0,
      ball.pos.x,
      ball.pos.y,
      ball.radius,
    );
    radial.addColorStop(0, this.theme.paddleText);
    radial.addColorStop(1, this.theme.ballCore);

    this.ctx.fillStyle = radial;
    this.ctx.beginPath();
    this.ctx.arc(ball.pos.x, ball.pos.y, ball.radius, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.strokeStyle = this.theme.ballStroke;
    this.ctx.stroke();
  }
}

 
