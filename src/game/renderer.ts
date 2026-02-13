import type { Ball, Brick, GameConfig, GameState, Particle, Vector2 } from "./types";

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
  trail: string;
  flash: string;
}

export const DEFAULT_RENDER_THEME: RenderTheme = {
  backdropStart: "rgba(255, 255, 255, 0.25)",
  backdropEnd: "rgba(255, 255, 255, 0.04)",
  backdropStroke: "rgba(255, 255, 255, 0.2)",
  overlayTint: "rgba(255, 255, 255, 0.04)",
  brickGlow: "rgba(255, 255, 255, 0.08)",
  brickStroke: "rgba(255, 255, 255, 0.45)",
  paddleStart: "rgba(255, 255, 255, 0.94)",
  paddleEnd: "rgba(160, 200, 255, 0.86)",
  paddleStroke: "rgba(255, 255, 255, 0.7)",
  paddleText: "rgba(255, 255, 255, 1)",
  ballCore: "rgba(77, 165, 255, 0.9)",
  ballStroke: "rgba(255, 255, 255, 0.8)",
  trail: "rgba(153, 220, 255, 0.22)",
  flash: "rgba(255, 100, 100, 1)",
};

export class Renderer {
  constructor(
    private readonly ctx: CanvasRenderingContext2D,
    private readonly config: GameConfig,
    private readonly theme: RenderTheme = DEFAULT_RENDER_THEME,
  ) {}

  setRenderScale(next: number): void {
    const scale = Math.max(1, next);
    this.ctx.setTransform(scale, 0, 0, scale, 0, 0);
    this.ctx.imageSmoothingEnabled = true;
    this.ctx.imageSmoothingQuality = "high";
  }

  render(state: GameState): void {
    this.ctx.clearRect(0, 0, this.config.width, this.config.height);
    this.ctx.save();
    this.applyShake(state);

    this.drawBackdrop();
    this.drawBricks(state.bricks);
    this.drawPaddle(state.paddle);
    this.drawTrail(state.vfx.trail, state.ball.radius);
    this.drawBall(state.ball);
    this.drawParticles(state.vfx.particles);
    this.drawFlash(state.vfx.flashMs);

    if (state.scene !== "playing") {
      this.ctx.fillStyle = this.theme.overlayTint;
      this.ctx.fillRect(0, 0, this.config.width, this.config.height);
    }

    this.ctx.restore();
  }

  private applyShake(state: GameState): void {
    if (state.vfx.reducedMotion || state.vfx.shakeMs <= 0 || state.vfx.shakePx <= 0) {
      return;
    }
    this.ctx.translate(state.vfx.shakeOffset.x, state.vfx.shakeOffset.y);
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
    for (const brick of bricks) {
      if (!brick.alive) {
        continue;
      }

      const glass = this.ctx.createLinearGradient(brick.x, brick.y, brick.x, brick.y + brick.height);
      glass.addColorStop(0, brick.color ?? "rgba(255, 180, 120, 0.35)");
      glass.addColorStop(1, this.theme.brickGlow);

      this.ctx.fillStyle = glass;
      this.ctx.fillRect(brick.x, brick.y, brick.width, brick.height);
      this.ctx.strokeStyle = this.theme.brickStroke;
      this.ctx.lineWidth = 1;
      this.ctx.strokeRect(brick.x, brick.y, brick.width, brick.height);
    }
  }

  private drawPaddle(paddle: GameState["paddle"]): void {
    const grad = this.ctx.createLinearGradient(paddle.x, paddle.y, paddle.x, paddle.y + paddle.height);
    grad.addColorStop(0, this.theme.paddleStart);
    grad.addColorStop(1, this.theme.paddleEnd);

    this.ctx.fillStyle = grad;
    this.ctx.beginPath();
    if (this.ctx.roundRect) {
      this.ctx.roundRect(paddle.x, paddle.y, paddle.width, paddle.height, 9);
    } else {
      this.drawRoundedRectFallback(paddle.x, paddle.y, paddle.width, paddle.height, 9);
    }
    this.ctx.closePath();
    this.ctx.fill();
    this.ctx.strokeStyle = this.theme.paddleStroke;
    this.ctx.stroke();
  }

  private drawRoundedRectFallback(x: number, y: number, width: number, height: number, radius: number): void {
    const r = Math.min(radius, width / 2, height / 2);
    this.ctx.moveTo(x + r, y);
    this.ctx.lineTo(x + width - r, y);
    this.ctx.quadraticCurveTo(x + width, y, x + width, y + r);
    this.ctx.lineTo(x + width, y + height - r);
    this.ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
    this.ctx.lineTo(x + r, y + height);
    this.ctx.quadraticCurveTo(x, y + height, x, y + height - r);
    this.ctx.lineTo(x, y + r);
    this.ctx.quadraticCurveTo(x, y, x + r, y);
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

  private drawTrail(trail: Vector2[], ballRadius: number): void {
    const count = trail.length;
    if (count <= 1) {
      return;
    }

    for (let i = 0; i < count; i += 1) {
      const point = trail[i];
      const alpha = ((i + 1) / count) * 0.5;
      this.ctx.fillStyle = withAlpha(this.theme.trail, Math.min(0.45, alpha));
      this.ctx.beginPath();
      this.ctx.arc(point.x, point.y, Math.max(2, ((ballRadius * (i + 1)) / count) * 0.7), 0, Math.PI * 2);
      this.ctx.fill();
    }
  }

  private drawParticles(particles: Particle[]): void {
    for (const particle of particles) {
      const alpha = Math.max(0, particle.lifeMs / particle.maxLifeMs);
      this.ctx.fillStyle = withAlpha(particle.color, alpha);
      this.ctx.beginPath();
      this.ctx.arc(particle.pos.x, particle.pos.y, particle.size * alpha, 0, Math.PI * 2);
      this.ctx.fill();
    }
  }

  private drawFlash(flashMs: number): void {
    if (flashMs <= 0) {
      return;
    }

    const alpha = Math.min(0.28, (flashMs / 180) * 0.28);
    this.ctx.fillStyle = withAlpha(this.theme.flash, alpha);
    this.ctx.fillRect(0, 0, this.config.width, this.config.height);
  }
}

function withAlpha(baseColor: string, alpha: number): string {
  const normalized = Math.max(0, Math.min(1, alpha));
  if (baseColor.startsWith("rgba(")) {
    return baseColor.replace(
      /rgba\(([^,]+),\s*([^,]+),\s*([^,]+),\s*([^)]+)\)/,
      `rgba($1, $2, $3, ${normalized})`,
    );
  }
  if (baseColor.startsWith("rgb(")) {
    return baseColor.replace(/rgb\(([^,]+),\s*([^,]+),\s*([^)]+)\)/, `rgba($1, $2, $3, ${normalized})`);
  }
  return baseColor;
}
