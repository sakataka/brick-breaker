import type { RenderViewState } from "../../../../game/renderTypes";
import { parseColor } from "../../color";
import type { WorldGraphics } from "./types";

export function drawArenaFrame(
  graphics: WorldGraphics,
  view: RenderViewState,
  offsetX: number,
  offsetY: number,
  width: number,
  height: number,
): void {
  const frame = parseColor(view.visual.tokens.frame, { value: 0x29d3ff, alpha: 0.22 });
  const accent = parseColor(view.visual.tokens.accent, { value: 0x40f4ff, alpha: 0.18 });
  const inset = view.arena.frame === "citadel" ? 12 : 18;
  graphics.lineStyle(view.arena.frame === "citadel" ? 2.2 : 1.6, frame.value, frame.alpha);
  graphics.strokeRoundedRect(
    offsetX + inset,
    offsetY + inset,
    width - inset * 2,
    height - inset * 2,
    14,
  );
  graphics.lineStyle(1, accent.value, accent.alpha);
  graphics.strokeRoundedRect(
    offsetX + inset + 10,
    offsetY + inset + 8,
    width - (inset + 10) * 2,
    height - (inset + 8) * 2,
    10,
  );
}
