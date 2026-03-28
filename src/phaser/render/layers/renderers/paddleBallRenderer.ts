import type { RenderViewState } from "../../../../game-v2/public/renderTypes";
import { parseColor, snapPixel } from "../../color";
import type { WorldGraphics } from "./types";

export function drawPaddle(
  graphics: WorldGraphics,
  view: RenderViewState,
  offsetX: number,
  offsetY: number,
  lineWidth: number,
  heavyLineWidth: number,
): void {
  const paddleFill = view.highContrast
    ? parseColor("#f5f8ff", { value: 0xf5f8ff, alpha: 1 })
    : parseColor("#44ccff", { value: 0x44ccff, alpha: 1 });
  const paddleStroke = view.highContrast
    ? parseColor("#ffffff", { value: 0xffffff, alpha: 1 })
    : parseColor("#d9f4ff", { value: 0xd9f4ff, alpha: 1 });
  const paddleX = snapPixel(view.paddle.x + offsetX);
  const paddleY = snapPixel(view.paddle.y + offsetY);
  graphics.fillStyle(paddleFill.value, 0.94);
  graphics.fillRoundedRect(paddleX, paddleY, view.paddle.width, view.paddle.height, 6);
  graphics.lineStyle(Math.max(lineWidth, heavyLineWidth), paddleStroke.value, 0.94);
  graphics.strokeRoundedRect(paddleX, paddleY, view.paddle.width, view.paddle.height, 6);

  if (view.paddleAuraColor) {
    const aura = parseColor(view.paddleAuraColor, { value: 0x78dcff, alpha: 0.22 });
    graphics.fillStyle(aura.value, aura.alpha * 0.28);
    graphics.fillRoundedRect(
      paddleX - 8,
      paddleY - 5,
      view.paddle.width + 16,
      view.paddle.height + 10,
      10,
    );
  }
  if (!view.paddle.glowActive) {
    return;
  }
  const glow = parseColor("rgba(120,220,255,0.28)", { value: 0x78dcff, alpha: 0.28 });
  graphics.fillStyle(glow.value, glow.alpha);
  graphics.fillRoundedRect(
    paddleX - 4,
    paddleY - 3,
    view.paddle.width + 8,
    view.paddle.height + 6,
    8,
  );
}

export function drawShield(
  graphics: WorldGraphics,
  charges: number,
  width: number,
  height: number,
  offsetX: number,
  offsetY: number,
): void {
  if (charges <= 0) {
    return;
  }
  const charge = parseColor("rgba(116,255,229,0.45)", { value: 0x74ffe5, alpha: 0.45 });
  graphics.fillStyle(charge.value, charge.alpha);
  graphics.fillRect(offsetX, height - 10 + offsetY, width, 10);
}

export function drawTrail(
  graphics: WorldGraphics,
  view: RenderViewState,
  offsetX: number,
  offsetY: number,
  trailColor: string,
): void {
  const trail = parseColor(trailColor, { value: 0x99dcff, alpha: 0.26 });
  graphics.fillStyle(trail.value, trail.alpha);
  for (const trace of view.trail) {
    graphics.fillCircle(trace.x + offsetX, trace.y + offsetY, 2.4);
  }
}

export function drawBalls(
  graphics: WorldGraphics,
  view: RenderViewState,
  offsetX: number,
  offsetY: number,
  lineWidth: number,
  ballCoreColor: string,
  ballStrokeColor: string,
): void {
  const ballFill = parseColor(ballCoreColor, { value: 0x4da5ff, alpha: 0.9 });
  const ballStroke = parseColor(ballStrokeColor, { value: 0xffffff, alpha: 0.9 });
  for (const ball of view.balls) {
    if (view.ballAuraColor) {
      const aura = parseColor(view.ballAuraColor, { value: 0x78dcff, alpha: 0.22 });
      graphics.fillStyle(aura.value, aura.alpha * 0.24);
      graphics.fillCircle(ball.pos.x + offsetX, ball.pos.y + offsetY, ball.radius + 4);
    }
    graphics.fillStyle(ballFill.value, ballFill.alpha);
    const ballX = snapPixel(ball.pos.x + offsetX);
    const ballY = snapPixel(ball.pos.y + offsetY);
    graphics.fillCircle(ballX, ballY, ball.radius);
    graphics.lineStyle(lineWidth, ballStroke.value, ballStroke.alpha);
    graphics.strokeCircle(ballX, ballY, ball.radius);
  }
}
