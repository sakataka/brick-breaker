import type { Ball, Brick, GameConfig, GameState } from './types';
import { getBrickColor } from './level';

export class Renderer {
  constructor(
    private readonly ctx: CanvasRenderingContext2D,
    private readonly config: GameConfig,
  ) {}

  render(state: GameState): void {
    this.ctx.clearRect(0, 0, this.config.width, this.config.height);
    this.drawBackdrop();
    this.drawBricks(state.bricks);
    this.drawPaddle(state.paddle);
    this.drawBall(state.ball);

    if (state.scene !== 'playing') {
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

  private drawBricks(bricks: Brick[]): void {
    bricks.forEach((brick, index) => {
      if (!brick.alive) {
        return;
      }

      const baseColor = brick.color ?? getBrickColor(index);
      const glass = this.ctx.createLinearGradient(brick.x, brick.y, brick.x, brick.y + brick.height);
      glass.addColorStop(0, baseColor);
      glass.addColorStop(1, 'rgba(255, 255, 255, 0.08)');

      this.ctx.fillStyle = glass;
      this.ctx.fillRect(brick.x, brick.y, brick.width, brick.height);
      this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
      this.ctx.lineWidth = 1;
      this.ctx.strokeRect(brick.x, brick.y, brick.width, brick.height);
    });
  }

  private drawPaddle(paddle: GameState['paddle']): void {
    const grad = this.ctx.createLinearGradient(paddle.x, paddle.y, paddle.x, paddle.y + paddle.height);
    grad.addColorStop(0, 'rgba(255, 255, 255, 0.94)');
    grad.addColorStop(1, 'rgba(160, 200, 255, 0.86)');

    this.ctx.fillStyle = grad;
    this.ctx.beginPath();
    this.ctx.roundRect(paddle.x, paddle.y, paddle.width, paddle.height, 9);
    this.ctx.fill();
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
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
    radial.addColorStop(0, 'rgba(255, 255, 255, 1)');
    radial.addColorStop(1, 'rgba(77, 165, 255, 0.9)');

    this.ctx.fillStyle = radial;
    this.ctx.beginPath();
    this.ctx.arc(ball.pos.x, ball.pos.y, ball.radius, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    this.ctx.stroke();
  }
}
