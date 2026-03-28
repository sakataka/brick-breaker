import { getItemColor } from "../../../../game-v2/public/items";
import type { RenderViewState } from "../../../../game-v2/public/renderTypes";
import { parseColor, snapPixel } from "../../color";
import type { WorldGraphics } from "./types";

export function drawFallingItems(
  graphics: WorldGraphics,
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
