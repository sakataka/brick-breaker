import type { GameConfig } from "../../types";
import type { RenderTheme } from "../theme";

export function drawBackdrop(ctx: CanvasRenderingContext2D, config: GameConfig, theme: RenderTheme): void {
  const grad = ctx.createLinearGradient(0, 0, config.width, config.height);
  grad.addColorStop(0, theme.backdropStart);
  grad.addColorStop(1, theme.backdropEnd);

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, config.width, config.height);
  ctx.strokeStyle = theme.backdropStroke;
  ctx.lineWidth = 2;
  ctx.strokeRect(4, 4, config.width - 8, config.height - 8);
}

export function drawProgressBar(
  ctx: CanvasRenderingContext2D,
  config: GameConfig,
  ratio: number,
  theme: RenderTheme,
): void {
  const clamped = Math.max(0, Math.min(1, ratio));
  const barX = 14;
  const barY = 66;
  const barW = config.width - 28;
  const barH = 3;

  ctx.fillStyle = "rgba(255, 255, 255, 0.18)";
  ctx.fillRect(barX, barY, barW, barH);
  ctx.fillStyle = theme.progressBar;
  ctx.fillRect(barX, barY, barW * clamped, barH);
}

export function drawWarpZoneHints(
  ctx: CanvasRenderingContext2D,
  zones: Array<{
    inXMin: number;
    inXMax: number;
    inYMin: number;
    inYMax: number;
    outX: number;
    outY: number;
  }>,
): void {
  for (const zone of zones) {
    const x = zone.inXMin;
    const y = zone.inYMin;
    const w = zone.inXMax - zone.inXMin;
    const h = zone.inYMax - zone.inYMin;
    ctx.strokeStyle = "rgba(111, 245, 255, 0.68)";
    ctx.setLineDash([5, 4]);
    ctx.strokeRect(x, y, w, h);
    ctx.setLineDash([]);
    ctx.fillStyle = "rgba(111, 245, 255, 0.12)";
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = "rgba(111, 245, 255, 0.78)";
    ctx.font = "700 10px Avenir Next";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("WARP", x + w / 2, y + h / 2);
  }
}

export function drawModifierLabel(
  ctx: CanvasRenderingContext2D,
  label: string | undefined,
  config: GameConfig,
): void {
  if (!label) {
    return;
  }
  ctx.fillStyle = "rgba(255, 255, 255, 0.74)";
  ctx.font = "700 12px Avenir Next";
  ctx.textAlign = "right";
  ctx.textBaseline = "top";
  ctx.fillText(`修飾: ${label}`, config.width - 16, 74);
}
