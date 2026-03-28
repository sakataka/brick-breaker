import type { RenderViewState } from "../../../../game-v2/public/renderTypes";
import { parseColor, snapPixel } from "../../color";
import type { WorldGraphics } from "./types";

export function drawLaserProjectiles(
  graphics: WorldGraphics,
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

export function drawBossProjectiles(
  graphics: WorldGraphics,
  view: RenderViewState,
  offsetX: number,
  offsetY: number,
): void {
  if (view.bossProjectiles.length <= 0) {
    return;
  }
  for (const shot of view.bossProjectiles) {
    const x = shot.x + offsetX;
    const y = shot.y + offsetY;
    if (shot.style === "plasma_bolt") {
      const core = parseColor("rgba(255, 150, 88, 0.94)", { value: 0xff9658, alpha: 0.94 });
      const glow = parseColor("rgba(255, 226, 166, 0.8)", { value: 0xffe2a6, alpha: 0.8 });
      graphics.fillStyle(core.value, core.alpha);
      graphics.fillRoundedRect(x - 4, y - shot.radius - 2, 8, shot.radius * 2 + 4, 3);
      graphics.lineStyle(1.2, glow.value, glow.alpha);
      graphics.strokeRoundedRect(x - 4, y - shot.radius - 2, 8, shot.radius * 2 + 4, 3);
      graphics.fillStyle(glow.value, 0.32);
      graphics.fillCircle(x, y + shot.radius + 4, 3);
      continue;
    }
    if (shot.style === "void_core") {
      const fill = parseColor("rgba(210, 88, 255, 0.84)", { value: 0xd258ff, alpha: 0.84 });
      const stroke = parseColor("rgba(255, 168, 218, 0.9)", { value: 0xffa8da, alpha: 0.9 });
      graphics.fillStyle(fill.value, fill.alpha);
      graphics.fillCircle(x, y, shot.radius - 1);
      graphics.lineStyle(1.2, stroke.value, stroke.alpha);
      graphics.strokeCircle(x, y, shot.radius + 3);
      graphics.strokeCircle(x, y, shot.radius + 6);
      graphics.fillStyle(stroke.value, 0.26);
      graphics.fillCircle(x, y, shot.radius + 2);
      continue;
    }
    const fill = parseColor("rgba(255, 118, 118, 0.88)", { value: 0xff7676, alpha: 0.88 });
    const stroke = parseColor("rgba(255, 240, 220, 0.82)", { value: 0xfff0dc, alpha: 0.82 });
    graphics.fillStyle(fill.value, fill.alpha);
    graphics.fillCircle(x, y, shot.radius);
    graphics.lineStyle(1.2, stroke.value, stroke.alpha);
    graphics.strokeCircle(x, y, shot.radius);
    for (let index = 0; index < 4; index += 1) {
      const angle = (Math.PI / 2) * index;
      graphics.beginPath();
      graphics.moveTo(
        x + Math.cos(angle) * (shot.radius + 1),
        y + Math.sin(angle) * (shot.radius + 1),
      );
      graphics.lineTo(
        x + Math.cos(angle) * (shot.radius + 5),
        y + Math.sin(angle) * (shot.radius + 5),
      );
      graphics.strokePath();
    }
  }
}
