import { getItemColor, getItemShortLabel } from "../../itemRegistry";
import type { FallingItem } from "../../types";
import type { RenderTheme } from "../theme";
import { withAlpha } from "./utils";

export function drawFallingItems(
  ctx: CanvasRenderingContext2D,
  items: FallingItem[],
  reducedMotion: boolean,
  theme: RenderTheme,
  highContrast = false,
): void {
  for (const item of items) {
    const half = item.size / 2;
    ctx.save();
    if (!reducedMotion) {
      ctx.shadowBlur = 10;
      ctx.shadowColor = withAlpha(getItemColor(item.type), 0.7);
    }
    ctx.fillStyle = getItemColor(item.type);
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(item.pos.x - half, item.pos.y - half, item.size, item.size, 5);
    } else {
      ctx.rect(item.pos.x - half, item.pos.y - half, item.size, item.size);
    }
    ctx.fill();
    ctx.restore();

    ctx.strokeStyle = highContrast ? "rgba(255, 255, 255, 0.95)" : "rgba(255, 255, 255, 0.56)";
    ctx.lineWidth = highContrast ? 2 : 1;
    ctx.stroke();

    ctx.fillStyle = theme.itemText;
    ctx.font = "700 9px Avenir Next";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(getItemShortLabel(item.type), item.pos.x, item.pos.y + 0.5);
  }
  ctx.lineWidth = 1;
}
