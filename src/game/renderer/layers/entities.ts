import type { RenderViewState } from "../../renderTypes";
import type { Ball, GameConfig } from "../../types";
import type { RenderTheme } from "../theme";
import { drawRoundedRectPath, withAlpha } from "./utils";

export function drawPaddle(
  ctx: CanvasRenderingContext2D,
  paddle: RenderViewState["paddle"],
  elapsedSec: number,
  theme: RenderTheme,
): void {
  const pulse = 0.6 + ((Math.sin(elapsedSec * 10) + 1) / 2) * 0.4;
  const topColor = paddle.glowActive ? withAlpha("rgba(92, 242, 255, 1)", pulse) : theme.paddleStart;
  const bottomColor = paddle.glowActive ? withAlpha("rgba(74, 201, 255, 1)", 0.82) : theme.paddleEnd;

  const grad = ctx.createLinearGradient(paddle.x, paddle.y, paddle.x, paddle.y + paddle.height);
  grad.addColorStop(0, topColor);
  grad.addColorStop(1, bottomColor);

  ctx.save();
  ctx.shadowBlur = 12;
  ctx.shadowColor = paddle.glowActive ? "rgba(98, 240, 255, 0.68)" : "rgba(122, 176, 255, 0.38)";
  ctx.fillStyle = grad;
  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(paddle.x, paddle.y, paddle.width, paddle.height, 9);
  } else {
    drawRoundedRectPath(ctx, paddle.x, paddle.y, paddle.width, paddle.height, 9);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  ctx.strokeStyle = theme.paddleStroke;
  ctx.stroke();
}

export function drawBalls(
  ctx: CanvasRenderingContext2D,
  balls: Ball[],
  slowActive: boolean,
  multiballActive: boolean,
  reducedMotion: boolean,
  theme: RenderTheme,
): void {
  for (const ball of balls) {
    drawBall(ctx, ball, slowActive, multiballActive, reducedMotion, theme);
  }
}

export function drawTrail(
  ctx: CanvasRenderingContext2D,
  config: GameConfig,
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
  const speedRatio = Math.max(0, Math.min(1, speed / Math.max(1, config.maxBallSpeed)));
  const maxPoints = Math.max(4, Math.min(count, 6 + Math.round(speedRatio * 4)));
  const start = Math.max(0, count - maxPoints);
  const trailColor = slowActive ? "rgba(255, 182, 114, 0.3)" : theme.trail;

  for (let i = start; i < count; i += 1) {
    const point = trail[i];
    const localIndex = i - start;
    const alpha = ((localIndex + 1) / maxPoints) * (0.38 + speedRatio * 0.22);
    ctx.fillStyle = withAlpha(trailColor, Math.min(0.56, alpha));
    ctx.beginPath();
    ctx.arc(
      point.x,
      point.y,
      Math.max(2, ((ballRadius * (localIndex + 1)) / maxPoints) * 0.8),
      0,
      Math.PI * 2,
    );
    ctx.fill();
  }
}

export function drawBallIndicators(
  ctx: CanvasRenderingContext2D,
  config: GameConfig,
  balls: Ball[],
  paddleY: number,
): void {
  const baseY = paddleY - 16;
  for (const ball of balls) {
    if (ball.pos.y > paddleY - 200) {
      continue;
    }

    const x = Math.max(10, Math.min(config.width - 10, ball.pos.x));
    ctx.fillStyle = "rgba(255, 245, 185, 0.85)";
    ctx.beginPath();
    ctx.moveTo(x, baseY);
    ctx.lineTo(x - 6, baseY - 8);
    ctx.lineTo(x + 6, baseY - 8);
    ctx.closePath();
    ctx.fill();
  }
}

export function drawShield(
  ctx: CanvasRenderingContext2D,
  config: GameConfig,
  shieldCharges: number,
  elapsedSec: number,
  theme: RenderTheme,
): void {
  if (shieldCharges <= 0) {
    return;
  }

  const baseY = config.height - 8;
  const pulse = 0.45 + ((Math.sin(elapsedSec * 8) + 1) / 2) * 0.35;
  ctx.strokeStyle = withAlpha(theme.shield, pulse);
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(14, baseY);
  ctx.lineTo(config.width - 14, baseY);
  ctx.stroke();
  ctx.lineWidth = 1;
}

export function drawEnemies(
  ctx: CanvasRenderingContext2D,
  enemies: RenderViewState["enemies"],
  reducedMotion: boolean,
): void {
  for (const enemy of enemies) {
    if (!enemy.alive) {
      continue;
    }
    ctx.save();
    if (!reducedMotion) {
      ctx.shadowBlur = 10;
      ctx.shadowColor = "rgba(255, 132, 96, 0.6)";
    }
    const grad = ctx.createRadialGradient(enemy.x - 2, enemy.y - 2, 1, enemy.x, enemy.y, enemy.radius);
    grad.addColorStop(0, "rgba(255, 236, 198, 0.95)");
    grad.addColorStop(1, "rgba(255, 132, 96, 0.92)");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(enemy.x, enemy.y, enemy.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.strokeStyle = "rgba(255, 228, 185, 0.9)";
    ctx.beginPath();
    ctx.arc(enemy.x, enemy.y, enemy.radius + 2, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function drawBall(
  ctx: CanvasRenderingContext2D,
  ball: Ball,
  slowActive: boolean,
  multiballActive: boolean,
  reducedMotion: boolean,
  theme: RenderTheme,
): void {
  const radial = ctx.createRadialGradient(
    ball.pos.x - 2,
    ball.pos.y - 2,
    0,
    ball.pos.x,
    ball.pos.y,
    ball.radius,
  );
  radial.addColorStop(0, theme.paddleText);
  radial.addColorStop(1, slowActive ? "rgba(255, 165, 87, 0.92)" : theme.ballCore);

  ctx.save();
  if (!reducedMotion) {
    ctx.shadowBlur = 12;
    ctx.shadowColor = slowActive ? "rgba(255, 170, 102, 0.56)" : "rgba(77, 165, 255, 0.52)";
  }
  ctx.fillStyle = radial;
  ctx.beginPath();
  ctx.arc(ball.pos.x, ball.pos.y, ball.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.strokeStyle = theme.ballStroke;
  ctx.stroke();

  if (multiballActive) {
    ctx.strokeStyle = "rgba(210, 170, 255, 0.7)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(ball.pos.x, ball.pos.y, ball.radius + 3.2, 0, Math.PI * 2);
    ctx.stroke();
    ctx.lineWidth = 1;
  }
}
