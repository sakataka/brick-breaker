import type { RenderViewState } from "../../../../game-v2/public/renderTypes";
import { parseColor } from "../../color";
import type { WorldGraphics } from "./types";

export function drawEncounterCueOverlay(
  graphics: WorldGraphics,
  view: RenderViewState,
  offsetX: number,
  offsetY: number,
  width: number,
  height: number,
): void {
  if (view.activeCues.length <= 0) {
    return;
  }
  const strongest = view.activeCues.reduce(
    (max, cue) => (cue.progress > max.progress ? cue : max),
    view.activeCues[0],
  );
  const tint = parseColor(
    strongest.severity === "critical"
      ? "rgba(255, 98, 128, 0.12)"
      : strongest.severity === "high"
        ? "rgba(255, 188, 112, 0.09)"
        : "rgba(120, 220, 255, 0.06)",
    { value: 0xff6280, alpha: 0.12 },
  );
  graphics.fillStyle(tint.value, tint.alpha);
  graphics.fillRect(offsetX, offsetY, width, 18);
  graphics.fillRect(offsetX, height - 18 + offsetY, width, 18);
}
