import { THEME_BANDS, type ThemeBandId } from "./config";
import { getItemColor, getItemShortLabel } from "./itemRegistry";
import type { RenderViewState } from "./renderTypes";
import type { Ball, Brick, FallingItem, FloatingText, GameConfig, ImpactRing, Particle } from "./types";

export interface RenderTheme {
  backdropStart: string;
  backdropEnd: string;
  backdropStroke: string;
  overlayTint: string;
  progressBar: string;
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
  progressBar: "rgba(41, 211, 255, 0.9)",
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
    private readonly baseTheme: RenderTheme = DEFAULT_RENDER_THEME,
  ) {}

  setRenderScale(next: number): void {
    const scale = Math.max(1, next);
    this.ctx.setTransform(scale, 0, 0, scale, 0, 0);
    this.ctx.imageSmoothingEnabled = true;
    this.ctx.imageSmoothingQuality = "high";
  }

  render(view: RenderViewState): void {
    const theme = this.resolveTheme(view.themeBandId);
    this.ctx.clearRect(0, 0, this.config.width, this.config.height);
    this.ctx.save();
    this.applyShake(view);

    this.drawBackdrop(theme);
    this.drawProgressBar(view.progressRatio, theme);
    this.drawBricks(view.bricks, theme);
    this.drawPaddle(view.paddle, view.elapsedSec, theme);
    this.drawShield(view.shieldCharges, view.elapsedSec, theme);
    this.drawTrail(view.trail, view.balls[0], view.slowBallActive, theme);
    this.drawBallIndicators(view.balls, view.paddle.y);
    this.drawBalls(view.balls, view.slowBallActive, view.multiballActive, view.reducedMotion, theme);
    this.drawFallingItems(view.fallingItems, view.reducedMotion, theme);
    this.drawImpactRings(view.impactRings);
    this.drawFloatingTexts(view.floatingTexts);
    this.drawParticles(view.particles);
    this.drawFlash(view.flashMs, theme);

    if (view.showSceneOverlayTint) {
      this.ctx.fillStyle = theme.overlayTint;
      this.ctx.fillRect(0, 0, this.config.width, this.config.height);
    }

    this.ctx.restore();
  }

  private applyShake(view: RenderViewState): void {
    if (!view.shake.active) {
      return;
    }
    this.ctx.translate(view.shake.offset.x, view.shake.offset.y);
  }

  private resolveTheme(themeBandId: ThemeBandId): RenderTheme {
    const band = THEME_BANDS.find((candidate) => candidate.id === themeBandId) ?? THEME_BANDS[0];
    return {
      ...this.baseTheme,
      backdropStart: band.backdropStart,
      backdropEnd: band.backdropEnd,
      backdropStroke: band.backdropStroke,
      progressBar: band.progressBar,
    };
  }

  private drawBackdrop(theme: RenderTheme): void {
    const grad = this.ctx.createLinearGradient(0, 0, this.config.width, this.config.height);
    grad.addColorStop(0, theme.backdropStart);
    grad.addColorStop(1, theme.backdropEnd);

    this.ctx.fillStyle = grad;
    this.ctx.fillRect(0, 0, this.config.width, this.config.height);
    this.ctx.strokeStyle = theme.backdropStroke;
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(4, 4, this.config.width - 8, this.config.height - 8);
  }

  private drawProgressBar(ratio: number, theme: RenderTheme): void {
    const clamped = Math.max(0, Math.min(1, ratio));
    const barX = 14;
    const barY = 66;
    const barW = this.config.width - 28;
    const barH = 3;

    this.ctx.fillStyle = "rgba(255, 255, 255, 0.18)";
    this.ctx.fillRect(barX, barY, barW, barH);
    this.ctx.fillStyle = theme.progressBar;
    this.ctx.fillRect(barX, barY, barW * clamped, barH);
  }

  private drawBricks(bricks: Brick[], theme: RenderTheme): void {
    for (const brick of bricks) {
      if (!brick.alive) {
        continue;
      }

      const glass = this.ctx.createLinearGradient(brick.x, brick.y, brick.x, brick.y + brick.height);
      glass.addColorStop(0, brick.color ?? "rgba(255, 180, 120, 0.35)");
      glass.addColorStop(1, theme.brickGlow);

      this.ctx.fillStyle = glass;
      this.ctx.fillRect(brick.x, brick.y, brick.width, brick.height);
      this.ctx.strokeStyle = theme.brickStroke;
      this.ctx.lineWidth = 1;
      this.ctx.strokeRect(brick.x, brick.y, brick.width, brick.height);
      this.drawEliteMarks(brick);
    }
  }

  private drawEliteMarks(brick: Brick): void {
    if (brick.kind === "durable") {
      this.ctx.strokeStyle = "rgba(255, 233, 142, 0.92)";
      this.ctx.lineWidth = 1.8;
      this.ctx.strokeRect(brick.x + 1.5, brick.y + 1.5, brick.width - 3, brick.height - 3);
    } else if (brick.kind === "armored") {
      this.ctx.strokeStyle = "rgba(196, 248, 255, 0.94)";
      this.ctx.lineWidth = 2;
      this.ctx.strokeRect(brick.x + 1.5, brick.y + 1.5, brick.width - 3, brick.height - 3);
      this.ctx.beginPath();
      this.ctx.moveTo(brick.x + 4, brick.y + 4);
      this.ctx.lineTo(brick.x + brick.width - 4, brick.y + brick.height - 4);
      this.ctx.moveTo(brick.x + brick.width - 4, brick.y + 4);
      this.ctx.lineTo(brick.x + 4, brick.y + brick.height - 4);
      this.ctx.stroke();
    }

    const hp = brick.hp ?? 1;
    if (hp > 1) {
      this.ctx.fillStyle = "rgba(255, 255, 255, 0.92)";
      this.ctx.font = "700 10px Avenir Next";
      this.ctx.textAlign = "center";
      this.ctx.textBaseline = "middle";
      this.ctx.fillText(String(hp), brick.x + brick.width / 2, brick.y + brick.height / 2);
    }
    this.ctx.lineWidth = 1;
  }

  private drawPaddle(paddle: RenderViewState["paddle"], elapsedSec: number, theme: RenderTheme): void {
    const pulse = 0.6 + ((Math.sin(elapsedSec * 10) + 1) / 2) * 0.4;
    const topColor = paddle.glowActive ? withAlpha("rgba(92, 242, 255, 1)", pulse) : theme.paddleStart;
    const bottomColor = paddle.glowActive ? withAlpha("rgba(74, 201, 255, 1)", 0.82) : theme.paddleEnd;

    const grad = this.ctx.createLinearGradient(paddle.x, paddle.y, paddle.x, paddle.y + paddle.height);
    grad.addColorStop(0, topColor);
    grad.addColorStop(1, bottomColor);

    this.ctx.save();
    this.ctx.shadowBlur = 12;
    this.ctx.shadowColor = paddle.glowActive ? "rgba(98, 240, 255, 0.68)" : "rgba(122, 176, 255, 0.38)";
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

    this.ctx.strokeStyle = theme.paddleStroke;
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

  private drawBalls(
    balls: Ball[],
    slowActive: boolean,
    multiballActive: boolean,
    reducedMotion: boolean,
    theme: RenderTheme,
  ): void {
    for (const ball of balls) {
      this.drawBall(ball, slowActive, multiballActive, reducedMotion, theme);
    }
  }

  private drawBall(
    ball: Ball,
    slowActive: boolean,
    multiballActive: boolean,
    reducedMotion: boolean,
    theme: RenderTheme,
  ): void {
    const radial = this.ctx.createRadialGradient(
      ball.pos.x - 2,
      ball.pos.y - 2,
      0,
      ball.pos.x,
      ball.pos.y,
      ball.radius,
    );
    radial.addColorStop(0, theme.paddleText);
    radial.addColorStop(1, slowActive ? "rgba(255, 165, 87, 0.92)" : theme.ballCore);

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

    this.ctx.strokeStyle = theme.ballStroke;
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

  private drawTrail(
    trail: RenderViewState["trail"],
    lead: Ball | undefined,
    slowActive: boolean,
    theme: RenderTheme,
  ): void {
    const count = trail.length;
    if (count <= 1) {
      return;
    }

    const ballRadius = lead?.radius ?? 8;
    const speed = lead ? Math.hypot(lead.vel.x, lead.vel.y) : 0;
    const speedRatio = Math.max(0, Math.min(1, speed / Math.max(1, this.config.maxBallSpeed)));
    const maxPoints = Math.max(4, Math.min(count, 6 + Math.round(speedRatio * 4)));
    const start = Math.max(0, count - maxPoints);
    const trailColor = slowActive ? "rgba(255, 182, 114, 0.3)" : theme.trail;

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

  private drawBallIndicators(balls: Ball[], paddleY: number): void {
    const baseY = paddleY - 16;
    for (const ball of balls) {
      if (ball.pos.y > paddleY - 200) {
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

  private drawFlash(flashMs: number, theme: RenderTheme): void {
    if (flashMs <= 0) {
      return;
    }

    const alpha = Math.min(0.28, (flashMs / 180) * 0.28);
    this.ctx.fillStyle = withAlpha(theme.flash, alpha);
    this.ctx.fillRect(0, 0, this.config.width, this.config.height);
  }

  private drawFallingItems(items: FallingItem[], reducedMotion: boolean, theme: RenderTheme): void {
    for (const item of items) {
      const half = item.size / 2;
      this.ctx.save();
      if (!reducedMotion) {
        this.ctx.shadowBlur = 10;
        this.ctx.shadowColor = withAlpha(getItemColor(item.type), 0.7);
      }
      this.ctx.fillStyle = getItemColor(item.type);
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

      this.ctx.fillStyle = theme.itemText;
      this.ctx.font = "600 9px Avenir Next";
      this.ctx.textAlign = "center";
      this.ctx.textBaseline = "middle";
      this.ctx.fillText(getItemShortLabel(item.type), item.pos.x, item.pos.y + 0.5);
    }
  }

  private drawShield(shieldCharges: number, elapsedSec: number, theme: RenderTheme): void {
    if (shieldCharges <= 0) {
      return;
    }

    const baseY = this.config.height - 8;
    const pulse = 0.45 + ((Math.sin(elapsedSec * 8) + 1) / 2) * 0.35;
    this.ctx.strokeStyle = withAlpha(theme.shield, pulse);
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
