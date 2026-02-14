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
