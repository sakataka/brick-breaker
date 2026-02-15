import type Phaser from "phaser";
import { getItemColor } from "../../../game/itemRegistry";
import type { RenderTheme } from "../../../game/renderer/theme";
import type { RenderViewState } from "../../../game/renderTypes";
import { parseColor, snapPixel } from "../color";

interface DrawWorldOptions {
  offsetX: number;
  offsetY: number;
  lineWidth: number;
  heavyLineWidth: number;
  theme: RenderTheme;
  width: number;
  height: number;
  fallbackBrickPalette: readonly string[];
}

export function drawWorldLayer(
  graphics: Phaser.GameObjects.Graphics,
  view: RenderViewState,
  options: DrawWorldOptions,
): Set<number> {
  const { offsetX, offsetY, lineWidth, heavyLineWidth, theme, fallbackBrickPalette, width, height } = options;
  drawBricks(graphics, view, offsetX, offsetY, lineWidth, fallbackBrickPalette, theme.brickStroke);
  drawPaddle(graphics, view, offsetX, offsetY, lineWidth, heavyLineWidth);
  drawFluxField(graphics, view, offsetX, offsetY);
  drawShield(graphics, view.shieldCharges, width, height, offsetX, offsetY);
  drawTrail(graphics, view, offsetX, offsetY, theme.trail);
  drawBalls(graphics, view, offsetX, offsetY, lineWidth, theme.ballCore, theme.ballStroke);
  drawLaserProjectiles(graphics, view, offsetX, offsetY);
  drawEnemies(graphics, view, offsetX, offsetY);
  return drawFallingItems(graphics, view, offsetX, offsetY, lineWidth);
}

function drawBricks(
  graphics: Phaser.GameObjects.Graphics,
  view: RenderViewState,
  offsetX: number,
  offsetY: number,
  lineWidth: number,
  fallbackBrickPalette: readonly string[],
  brickStrokeColor: string,
): void {
  const stroke = parseColor(brickStrokeColor, { value: 0xffffff, alpha: 0.75 });
  for (const brick of view.bricks) {
    if (!brick.alive) {
      continue;
    }
    const fallbackColor = fallbackBrickPalette[(brick.row ?? 0) % fallbackBrickPalette.length] ?? "#ffffff";
    const body = parseColor(brick.color ?? fallbackColor, { value: 0xa0c8ff, alpha: 0.55 });
    const brickX = snapPixel(brick.x + offsetX);
    const brickY = snapPixel(brick.y + offsetY);
    graphics.fillStyle(body.value, body.alpha);
    graphics.fillRoundedRect(brickX, brickY, brick.width, brick.height, 5);
    graphics.lineStyle(lineWidth, stroke.value, stroke.alpha);
    graphics.strokeRoundedRect(brickX, brickY, brick.width, brick.height, 5);

    if (brick.kind && brick.kind !== "normal") {
      const markerColor = parseColor(getBrickMarkerColor(brick.kind), { value: 0xffffff, alpha: 0.95 });
      graphics.fillStyle(markerColor.value, markerColor.alpha);
      graphics.fillCircle(
        snapPixel(brick.x + brick.width - 7 + offsetX),
        snapPixel(brick.y + 7 + offsetY),
        2.5,
      );
    }

    if (typeof brick.hp === "number" && typeof brick.maxHp === "number" && brick.maxHp > 1) {
      const hpRatio = Math.max(0, Math.min(1, brick.hp / brick.maxHp));
      const hpBg = parseColor("rgba(255,255,255,0.2)", { value: 0xffffff, alpha: 0.2 });
      const hpFg = parseColor("rgba(255,235,160,0.9)", { value: 0xffeba0, alpha: 0.9 });
      graphics.fillStyle(hpBg.value, hpBg.alpha);
      graphics.fillRect(
        snapPixel(brick.x + 4 + offsetX),
        snapPixel(brick.y + brick.height - 4 + offsetY),
        brick.width - 8,
        2,
      );
      graphics.fillStyle(hpFg.value, hpFg.alpha);
      graphics.fillRect(
        snapPixel(brick.x + 4 + offsetX),
        snapPixel(brick.y + brick.height - 4 + offsetY),
        (brick.width - 8) * hpRatio,
        2,
      );
    }
  }
}

function drawPaddle(
  graphics: Phaser.GameObjects.Graphics,
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

  if (!view.paddle.glowActive) {
    return;
  }
  const glow = parseColor("rgba(120,220,255,0.28)", { value: 0x78dcff, alpha: 0.28 });
  graphics.fillStyle(glow.value, glow.alpha);
  graphics.fillRoundedRect(paddleX - 4, paddleY - 3, view.paddle.width + 8, view.paddle.height + 6, 8);
}

function drawFluxField(
  graphics: Phaser.GameObjects.Graphics,
  view: RenderViewState,
  offsetX: number,
  offsetY: number,
): void {
  if (!view.fluxFieldActive) {
    return;
  }
  const centerX = view.paddle.x + view.paddle.width / 2 + offsetX;
  const centerY = view.paddle.y + offsetY;
  const fill = parseColor("rgba(120, 170, 255, 0.08)", { value: 0x78aaff, alpha: 0.08 });
  const stroke = parseColor("rgba(160, 200, 255, 0.22)", { value: 0xa0c8ff, alpha: 0.22 });
  graphics.fillStyle(fill.value, fill.alpha);
  graphics.fillCircle(centerX, centerY, 180);
  graphics.lineStyle(1, stroke.value, stroke.alpha);
  graphics.strokeCircle(centerX, centerY, 180);
}

function drawShield(
  graphics: Phaser.GameObjects.Graphics,
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

function drawTrail(
  graphics: Phaser.GameObjects.Graphics,
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

function drawBalls(
  graphics: Phaser.GameObjects.Graphics,
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
    graphics.fillStyle(ballFill.value, ballFill.alpha);
    const ballX = snapPixel(ball.pos.x + offsetX);
    const ballY = snapPixel(ball.pos.y + offsetY);
    graphics.fillCircle(ballX, ballY, ball.radius);
    graphics.lineStyle(lineWidth, ballStroke.value, ballStroke.alpha);
    graphics.strokeCircle(ballX, ballY, ball.radius);
  }
}

function drawLaserProjectiles(
  graphics: Phaser.GameObjects.Graphics,
  view: RenderViewState,
  offsetX: number,
  offsetY: number,
): void {
  if (view.laserProjectiles.length <= 0) {
    return;
  }
  const core = parseColor("rgba(255, 110, 110, 0.92)", { value: 0xff6e6e, alpha: 0.92 });
  const glow = parseColor("rgba(255, 222, 222, 0.66)", { value: 0xffdede, alpha: 0.66 });
  graphics.lineStyle(2.1, core.value, core.alpha);
  for (const shot of view.laserProjectiles) {
    const x = snapPixel(shot.x + offsetX);
    const y = snapPixel(shot.y + offsetY);
    graphics.beginPath();
    graphics.moveTo(x, y);
    graphics.lineTo(x, y - 12);
    graphics.strokePath();
    graphics.fillStyle(glow.value, glow.alpha);
    graphics.fillCircle(x, y - 12, 1.5);
  }
}

function drawEnemies(
  graphics: Phaser.GameObjects.Graphics,
  view: RenderViewState,
  offsetX: number,
  offsetY: number,
): void {
  const enemyFill = parseColor("rgba(255,120,120,0.78)", { value: 0xff7878, alpha: 0.78 });
  const enemyStroke = parseColor("rgba(255,255,255,0.8)", { value: 0xffffff, alpha: 0.8 });
  for (const enemy of view.enemies) {
    if (!enemy.alive) {
      continue;
    }
    graphics.fillStyle(enemyFill.value, enemyFill.alpha);
    graphics.fillCircle(enemy.x + offsetX, enemy.y + offsetY, enemy.radius);
    graphics.lineStyle(1, enemyStroke.value, enemyStroke.alpha);
    graphics.strokeCircle(enemy.x + offsetX, enemy.y + offsetY, enemy.radius);
  }
}

function drawFallingItems(
  graphics: Phaser.GameObjects.Graphics,
  view: RenderViewState,
  offsetX: number,
  offsetY: number,
  lineWidth: number,
): Set<number> {
  const visibleIds = new Set<number>();
  for (const item of view.fallingItems) {
    const itemColor = parseColor(getItemColor(item.type), { value: 0xdfe9ff, alpha: 0.95 });
    const itemStroke = parseColor("rgba(245, 252, 255, 0.88)", { value: 0xf5fcff, alpha: 0.88 });
    const x = snapPixel(item.pos.x - item.size / 2 + offsetX);
    const y = snapPixel(item.pos.y - item.size / 2 + offsetY);
    graphics.fillStyle(itemColor.value, itemColor.alpha);
    graphics.fillRoundedRect(x, y, item.size, item.size, 4);
    graphics.lineStyle(Math.max(1, lineWidth), itemStroke.value, itemStroke.alpha);
    graphics.strokeRoundedRect(x, y, item.size, item.size, 4);
    visibleIds.add(item.id);
  }
  return visibleIds;
}

function getBrickMarkerColor(kind: NonNullable<RenderViewState["bricks"][number]["kind"]>): string {
  switch (kind) {
    case "durable":
      return "#ffd06e";
    case "armored":
      return "#b9daff";
    case "regen":
      return "#8affae";
    case "hazard":
      return "#ff8f8f";
    case "boss":
      return "#ff73d0";
    default:
      return "#ffffff";
  }
}
