import type Phaser from "phaser";
import type { RenderTheme } from "../../../game/renderer/theme";
import type { RenderViewState } from "../../../game/renderTypes";
import { parseColor } from "../color";

export function drawOverlayLayer(
  graphics: Phaser.GameObjects.Graphics,
  view: RenderViewState,
  width: number,
  height: number,
  theme: RenderTheme,
): void {
  if (view.flashMs > 0) {
    const flash = parseColor(theme.flash, { value: 0xff6464, alpha: 1 });
    const intensity = Math.min(1, view.flashMs / 180);
    graphics.fillStyle(flash.value, flash.alpha * intensity * 0.45);
    graphics.fillRect(0, 0, width, height);
  }

  if (!view.showSceneOverlayTint) {
    return;
  }
  const tint = parseColor(theme.overlayTint, { value: 0x000000, alpha: 0.2 });
  graphics.fillStyle(tint.value, tint.alpha);
  graphics.fillRect(0, 0, width, height);
}
