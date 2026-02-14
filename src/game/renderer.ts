import type {
  Ball,
  Brick,
  FallingItem,
  FloatingText,
  GameConfig,
  GameState,
  ImpactRing,
  Particle,
  Vector2,
} from "./types";

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
  itemText: string;
  shield: string;
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
  itemText: "rgba(235, 244, 255, 1)",
  shield: "rgba(116, 255, 229, 0.66)",
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
    this.drawProgressBar(state);
    this.drawBricks(state.bricks);
    this.drawPaddle(state);
    this.drawShield(state);
    this.drawTrail(state);
    this.drawBallIndicators(state);
    this.drawBalls(state);
    this.drawFallingItems(state.items.falling, state.vfx.reducedMotion);
    this.drawImpactRings(state.vfx.impactRings);
    this.drawFloatingTexts(state.vfx.floatingTexts);
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

  private drawProgressBar(state: GameState): void {
    const total = state.bricks.length;
    if (total <= 0) {
      return;
    }

    const alive = state.bricks.reduce((count, brick) => count + (brick.alive ? 1 : 0), 0);
    const ratio = Math.max(0, Math.min(1, (total - alive) / total));
    const barX = 14;
    const barY = 66;
    const barW = this.config.width - 28;
    const barH = 3;

    this.ctx.fillStyle = "rgba(255, 255, 255, 0.18)";
    this.ctx.fillRect(barX, barY, barW, barH);
    this.ctx.fillStyle = "rgba(41, 211, 255, 0.9)";
    this.ctx.fillRect(barX, barY, barW * ratio, barH);
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

  private drawPaddle(state: GameState): void {
    const paddle = state.paddle;
    const paddlePlusActive = state.items.active.paddlePlus.untilSec > state.elapsedSec;
    const pulse = 0.6 + ((Math.sin(state.elapsedSec * 10) + 1) / 2) * 0.4;
    const topColor = paddlePlusActive ? withAlpha("rgba(92, 242, 255, 1)", pulse) : this.theme.paddleStart;
    const bottomColor = paddlePlusActive ? withAlpha("rgba(74, 201, 255, 1)", 0.82) : this.theme.paddleEnd;

    const grad = this.ctx.createLinearGradient(paddle.x, paddle.y, paddle.x, paddle.y + paddle.height);
    grad.addColorStop(0, topColor);
    grad.addColorStop(1, bottomColor);

    this.ctx.save();
    if (!state.vfx.reducedMotion) {
      this.ctx.shadowBlur = 12;
      this.ctx.shadowColor = paddlePlusActive ? "rgba(98, 240, 255, 0.68)" : "rgba(122, 176, 255, 0.38)";
    }
    this.ctx.fillStyle = grad;
    this.ctx.beginPath();
    if (this.ctx.roundRect) {
      this.ctx.roundRect(paddle.x, paddle.y, paddle.width, paddle.height, 9);
    } else {
      this.drawRoundedRectFallback(paddle.x, paddle.y, paddle.width, paddle.height, 9);
    }
    this.ctx.closePath();
    this.ctx.fill();
    this.ctx.restore();

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

  private drawBalls(state: GameState): void {
    const slowActive = state.items.active.slowBall.untilSec > state.elapsedSec;
    const multiballActive = state.items.active.multiball.untilSec > state.elapsedSec;
    for (const ball of state.balls) {
      this.drawBall(ball, slowActive, multiballActive, state.vfx.reducedMotion);
    }
  }

  private drawBall(ball: Ball, slowActive: boolean, multiballActive: boolean, reducedMotion: boolean): void {
    const radial = this.ctx.createRadialGradient(
      ball.pos.x - 2,
      ball.pos.y - 2,
      0,
      ball.pos.x,
      ball.pos.y,
      ball.radius,
    );
    radial.addColorStop(0, this.theme.paddleText);
    radial.addColorStop(1, slowActive ? "rgba(255, 165, 87, 0.92)" : this.theme.ballCore);

    this.ctx.save();
    if (!reducedMotion) {
      this.ctx.shadowBlur = 12;
      this.ctx.shadowColor = slowActive ? "rgba(255, 170, 102, 0.56)" : "rgba(77, 165, 255, 0.52)";
    }
    this.ctx.fillStyle = radial;
    this.ctx.beginPath();
    this.ctx.arc(ball.pos.x, ball.pos.y, ball.radius, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.restore();

    this.ctx.strokeStyle = this.theme.ballStroke;
    this.ctx.stroke();

    if (multiballActive) {
      this.ctx.strokeStyle = "rgba(210, 170, 255, 0.7)";
      this.ctx.lineWidth = 1.5;
      this.ctx.beginPath();
      this.ctx.arc(ball.pos.x, ball.pos.y, ball.radius + 3.2, 0, Math.PI * 2);
      this.ctx.stroke();
      this.ctx.lineWidth = 1;
    }
  }

  private drawTrail(state: GameState): void {
    const trail = state.vfx.trail;
    const count = trail.length;
    if (count <= 1) {
      return;
    }

    const lead = state.balls[0];
    const ballRadius = lead?.radius ?? 8;
    const speed = lead ? Math.hypot(lead.vel.x, lead.vel.y) : 0;
    const speedRatio = Math.max(0, Math.min(1, speed / Math.max(1, this.config.maxBallSpeed)));
    const maxPoints = Math.max(4, Math.min(count, 6 + Math.round(speedRatio * 4)));
    const start = Math.max(0, count - maxPoints);
    const slowActive = state.items.active.slowBall.untilSec > state.elapsedSec;
    const trailColor = slowActive ? "rgba(255, 182, 114, 0.3)" : this.theme.trail;

    for (let i = start; i < count; i += 1) {
      const point = trail[i];
      const localIndex = i - start;
      const alpha = ((localIndex + 1) / maxPoints) * (0.38 + speedRatio * 0.22);
      this.ctx.fillStyle = withAlpha(trailColor, Math.min(0.56, alpha));
      this.ctx.beginPath();
      this.ctx.arc(
        point.x,
        point.y,
        Math.max(2, ((ballRadius * (localIndex + 1)) / maxPoints) * 0.8),
        0,
        Math.PI * 2,
      );
      this.ctx.fill();
    }
  }

  private drawBallIndicators(state: GameState): void {
    const baseY = state.paddle.y - 16;
    for (const ball of state.balls) {
      if (ball.pos.y > state.paddle.y - 200) {
        continue;
      }

      const x = Math.max(10, Math.min(this.config.width - 10, ball.pos.x));
      this.ctx.fillStyle = "rgba(255, 245, 185, 0.85)";
      this.ctx.beginPath();
      this.ctx.moveTo(x, baseY);
      this.ctx.lineTo(x - 6, baseY - 8);
      this.ctx.lineTo(x + 6, baseY - 8);
      this.ctx.closePath();
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

  private drawFallingItems(items: FallingItem[], reducedMotion: boolean): void {
    for (const item of items) {
      const half = item.size / 2;
      this.ctx.save();
      if (!reducedMotion) {
        this.ctx.shadowBlur = 10;
        this.ctx.shadowColor = withAlpha(this.itemColor(item.type), 0.7);
      }
      this.ctx.fillStyle = this.itemColor(item.type);
      this.ctx.beginPath();
      if (this.ctx.roundRect) {
        this.ctx.roundRect(item.pos.x - half, item.pos.y - half, item.size, item.size, 5);
      } else {
        this.ctx.rect(item.pos.x - half, item.pos.y - half, item.size, item.size);
      }
      this.ctx.fill();
      this.ctx.restore();

      this.ctx.strokeStyle = "rgba(255, 255, 255, 0.56)";
      this.ctx.lineWidth = 1;
      this.ctx.stroke();

      this.ctx.fillStyle = this.theme.itemText;
      this.ctx.font = "600 9px Avenir Next";
      this.ctx.textAlign = "center";
      this.ctx.textBaseline = "middle";
      this.ctx.fillText(this.itemShort(item.type), item.pos.x, item.pos.y + 0.5);
    }
  }

  private drawShield(state: GameState): void {
    if (
      state.items.active.shield.remainingHits <= 0 ||
      state.items.active.shield.untilSec <= state.elapsedSec
    ) {
      return;
    }

    const baseY = this.config.height - 8;
    const pulse = 0.45 + ((Math.sin(state.elapsedSec * 8) + 1) / 2) * 0.35;
    this.ctx.strokeStyle = withAlpha(this.theme.shield, pulse);
    this.ctx.lineWidth = 4;
    this.ctx.beginPath();
    this.ctx.moveTo(14, baseY);
    this.ctx.lineTo(this.config.width - 14, baseY);
    this.ctx.stroke();
  }

  private drawImpactRings(rings: ImpactRing[]): void {
    for (const ring of rings) {
      const ratio = Math.max(0, ring.lifeMs / ring.maxLifeMs);
      const radius = ring.radiusEnd - (ring.radiusEnd - ring.radiusStart) * ratio;
      this.ctx.strokeStyle = withAlpha(ring.color, Math.min(1, ratio * 0.9));
      this.ctx.lineWidth = 1 + ratio * 2.4;
      this.ctx.beginPath();
      this.ctx.arc(ring.pos.x, ring.pos.y, radius, 0, Math.PI * 2);
      this.ctx.stroke();
    }
    this.ctx.lineWidth = 1;
  }

  private drawFloatingTexts(labels: FloatingText[]): void {
    this.ctx.textAlign = "center";
    this.ctx.textBaseline = "middle";
    this.ctx.font = "700 13px Avenir Next";

    for (const label of labels) {
      const ratio = Math.max(0, label.lifeMs / label.maxLifeMs);
      this.ctx.fillStyle = withAlpha(label.color, Math.min(1, ratio));
      this.ctx.fillText(label.text, label.pos.x, label.pos.y);
    }
  }

  private itemShort(type: FallingItem["type"]): string {
    if (type === "paddle_plus") {
      return "P+";
    }
    if (type === "slow_ball") {
      return "SL";
    }
    if (type === "multiball") {
      return "MB";
    }
    return "SH";
  }

  private itemColor(type: FallingItem["type"]): string {
    if (type === "paddle_plus") {
      return "rgba(104, 216, 255, 0.8)";
    }
    if (type === "slow_ball") {
      return "rgba(255, 191, 112, 0.85)";
    }
    if (type === "multiball") {
      return "rgba(197, 143, 255, 0.82)";
    }
    return "rgba(112, 255, 210, 0.78)";
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
