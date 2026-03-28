import type { RenderViewState } from "../../../../game-v2/public/renderTypes";
import { parseColor } from "../../color";
import type { WorldGraphics } from "./types";

export function drawFluxField(
  graphics: WorldGraphics,
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

export function drawDangerLanes(
  graphics: WorldGraphics,
  view: RenderViewState,
  width: number,
  height: number,
  offsetX: number,
  offsetY: number,
): void {
  for (const lane of view.dangerLanes ?? []) {
    drawLane(graphics, lane, width, height, offsetX, offsetY, 0.65);
  }
}

function drawLane(
  graphics: WorldGraphics,
  lane: "left" | "center" | "right",
  width: number,
  height: number,
  offsetX: number,
  offsetY: number,
  progress: number,
): void {
  const laneWidth = width / 3;
  const laneIndex = lane === "left" ? 0 : lane === "center" ? 1 : 2;
  const fill = parseColor("rgba(255, 190, 120, 0.14)", { value: 0xffbe78, alpha: 0.14 });
  const stroke = parseColor("rgba(255, 214, 148, 0.55)", { value: 0xffd694, alpha: 0.55 });
  const x = laneIndex * laneWidth + offsetX;
  const y = height - 98 + offsetY;
  graphics.fillStyle(fill.value, fill.alpha + progress * 0.06);
  graphics.fillRect(x, y, laneWidth, 92);
  graphics.lineStyle(1.6, stroke.value, stroke.alpha);
  graphics.strokeRect(x + 1, y + 1, laneWidth - 2, 90);
}
