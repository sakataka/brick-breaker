import type Phaser from "phaser";
import type { RenderViewState } from "../../../game/renderTypes";
import { type ParsedColor, parseColor } from "../color";
import { snapByStep } from "../dpiProfile";

interface BackdropTheme {
  base: string;
  top: string;
  frame: string;
}

const BACKDROP_BY_BAND: Record<RenderViewState["themeBandId"], BackdropTheme> = {
  early: {
    base: "#0a1a35",
    top: "#133468",
    frame: "#2d9fff",
  },
  mid: {
    base: "#1a1734",
    top: "#3a2a58",
    frame: "#ffab5e",
  },
  late: {
    base: "#1c1230",
    top: "#47205f",
    frame: "#ff80ba",
  },
};

export function drawBackdropLayer(
  graphics: Phaser.GameObjects.Graphics,
  view: RenderViewState,
  width: number,
  height: number,
  _progressColor: string,
  lineWidth: number,
  snapStep: number,
): void {
  const backdropTheme = resolveBackdropTheme(view.themeBandId, view.highContrast);
  const background = parseColor(backdropTheme.base, { value: 0x0b1020, alpha: 1 });
  graphics.fillStyle(background.value, 1);
  graphics.fillRect(0, 0, width, height);

  const header = parseColor(backdropTheme.top, { value: 0x161d30, alpha: 1 });
  drawTopVignette(graphics, header, width);

  const frame = parseColor(backdropTheme.frame, { value: 0x29d3ff, alpha: 1 });
  graphics.lineStyle(lineWidth, frame.value, 0.24);
  graphics.strokeRect(
    snapByStep(0.5, snapStep),
    snapByStep(0.5, snapStep),
    snapByStep(width - 1, snapStep),
    snapByStep(height - 1, snapStep),
  );
  graphics.lineStyle(Math.max(1, lineWidth + 0.4), frame.value, 0.6);
  graphics.beginPath();
  graphics.moveTo(snapByStep(1, snapStep), snapByStep(1, snapStep));
  graphics.lineTo(snapByStep(width - 1, snapStep), snapByStep(1, snapStep));
  graphics.strokePath();

  drawWarpZones(graphics, view.warpZones, lineWidth, snapStep);
}

function drawTopVignette(graphics: Phaser.GameObjects.Graphics, header: ParsedColor, width: number): void {
  const height = 72;
  const steps = 8;
  const stripeHeight = height / steps;
  for (let index = 0; index < steps; index += 1) {
    const ratio = 1 - index / steps;
    const alpha = 0.42 * ratio * ratio;
    if (alpha <= 0) {
      continue;
    }
    graphics.fillStyle(header.value, header.alpha * alpha);
    graphics.fillRect(0, index * stripeHeight, width, stripeHeight + 1);
  }
}

function drawWarpZones(
  graphics: Phaser.GameObjects.Graphics,
  warpZones: RenderViewState["warpZones"],
  lineWidth: number,
  snapStep: number,
): void {
  if (!warpZones || warpZones.length === 0) {
    return;
  }
  const fill = parseColor("rgba(120,214,255,0.14)", { value: 0x78d6ff, alpha: 0.14 });
  const stroke = parseColor("rgba(130,220,255,0.68)", { value: 0x82dcff, alpha: 0.68 });
  const guide = parseColor("rgba(125,220,255,0.42)", { value: 0x7ddcff, alpha: 0.42 });
  const exitFill = parseColor("rgba(255,206,102,0.85)", { value: 0xffce66, alpha: 0.85 });
  const exitRing = parseColor("rgba(255,238,176,0.9)", { value: 0xffeeb0, alpha: 0.9 });
  graphics.fillStyle(fill.value, fill.alpha);
  graphics.lineStyle(lineWidth, stroke.value, stroke.alpha);
  for (const zone of warpZones) {
    const width = Math.max(1, zone.inXMax - zone.inXMin);
    const height = Math.max(1, zone.inYMax - zone.inYMin);
    const entryX = snapByStep(zone.inXMin, snapStep);
    const entryY = snapByStep(zone.inYMin, snapStep);
    const entryCenterX = zone.inXMin + width / 2;
    const entryCenterY = zone.inYMin + height / 2;
    graphics.fillRect(entryX, entryY, width, height);
    graphics.strokeRect(entryX, entryY, width, height);
    drawGuideSegments(graphics, entryCenterX, entryCenterY, zone.outX, zone.outY, guide, lineWidth, snapStep);
    graphics.fillStyle(exitFill.value, exitFill.alpha);
    graphics.fillCircle(snapByStep(zone.outX, snapStep), snapByStep(zone.outY, snapStep), 3.6);
    graphics.lineStyle(lineWidth, exitRing.value, exitRing.alpha);
    graphics.strokeCircle(snapByStep(zone.outX, snapStep), snapByStep(zone.outY, snapStep), 7.2);
  }
}

function resolveBackdropTheme(
  themeBandId: RenderViewState["themeBandId"],
  highContrast: boolean,
): BackdropTheme {
  if (highContrast) {
    return {
      base: "#000000",
      top: "#111111",
      frame: "#f5e76a",
    };
  }
  return BACKDROP_BY_BAND[themeBandId] ?? BACKDROP_BY_BAND.early;
}

function drawGuideSegments(
  graphics: Phaser.GameObjects.Graphics,
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  color: ParsedColor,
  lineWidth: number,
  snapStep: number,
): void {
  const dx = toX - fromX;
  const dy = toY - fromY;
  const distance = Math.hypot(dx, dy);
  if (distance < 1) {
    return;
  }
  const unitX = dx / distance;
  const unitY = dy / distance;
  const dashLength = 8;
  const gapLength = 5;
  let cursor = 0;
  graphics.lineStyle(lineWidth, color.value, color.alpha);
  while (cursor < distance) {
    const start = cursor;
    const end = Math.min(distance, cursor + dashLength);
    graphics.beginPath();
    graphics.moveTo(snapByStep(fromX + unitX * start, snapStep), snapByStep(fromY + unitY * start, snapStep));
    graphics.lineTo(snapByStep(fromX + unitX * end, snapStep), snapByStep(fromY + unitY * end, snapStep));
    graphics.strokePath();
    cursor += dashLength + gapLength;
  }
}
