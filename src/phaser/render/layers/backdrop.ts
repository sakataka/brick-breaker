import type Phaser from "phaser";
import type { RenderViewState } from "../../../game/renderTypes";
import { type ParsedColor, parseColor, snapPixel } from "../color";

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

export function drawProgressBar(
  graphics: Phaser.GameObjects.Graphics,
  progressRatio: number,
  width: number,
  color: string,
): void {
  const ratio = Math.max(0, Math.min(1, progressRatio));
  const base = parseColor("rgba(255,255,255,0.16)", { value: 0xffffff, alpha: 0.16 });
  const accent = parseColor(color, { value: 0x29d3ff, alpha: 0.9 });
  graphics.fillStyle(base.value, base.alpha);
  graphics.fillRect(20, 16, width - 40, 6);
  graphics.fillStyle(accent.value, accent.alpha);
  graphics.fillRect(20, 16, (width - 40) * ratio, 6);
}

export function drawBackdropLayer(
  graphics: Phaser.GameObjects.Graphics,
  view: RenderViewState,
  width: number,
  height: number,
  progressColor: string,
  lineWidth: number,
): void {
  const backdropTheme = resolveBackdropTheme(view.themeBandId, view.highContrast);
  const background = parseColor(backdropTheme.base, { value: 0x0b1020, alpha: 1 });
  graphics.fillStyle(background.value, 1);
  graphics.fillRect(0, 0, width, height);

  const header = parseColor(backdropTheme.top, { value: 0x161d30, alpha: 1 });
  graphics.fillStyle(header.value, 0.72);
  graphics.fillRect(0, 0, width, 72);

  const frame = parseColor(backdropTheme.frame, { value: 0x29d3ff, alpha: 1 });
  graphics.lineStyle(lineWidth, frame.value, 0.24);
  graphics.strokeRect(0.5, 0.5, width - 1, height - 1);

  drawProgressBar(graphics, view.progressRatio, width, progressColor);
  drawWarpZones(graphics, view.warpZones, lineWidth);
}

export function drawWarpZones(
  graphics: Phaser.GameObjects.Graphics,
  warpZones: RenderViewState["warpZones"],
  lineWidth: number,
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
    const entryX = snapPixel(zone.inXMin);
    const entryY = snapPixel(zone.inYMin);
    const entryCenterX = zone.inXMin + width / 2;
    const entryCenterY = zone.inYMin + height / 2;
    graphics.fillRect(entryX, entryY, width, height);
    graphics.strokeRect(entryX, entryY, width, height);
    drawGuideSegments(graphics, entryCenterX, entryCenterY, zone.outX, zone.outY, guide, lineWidth);
    graphics.fillStyle(exitFill.value, exitFill.alpha);
    graphics.fillCircle(snapPixel(zone.outX), snapPixel(zone.outY), 3.6);
    graphics.lineStyle(lineWidth, exitRing.value, exitRing.alpha);
    graphics.strokeCircle(snapPixel(zone.outX), snapPixel(zone.outY), 7.2);
  }
}

export function resolveBackdropTheme(
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
    graphics.moveTo(snapPixel(fromX + unitX * start), snapPixel(fromY + unitY * start));
    graphics.lineTo(snapPixel(fromX + unitX * end), snapPixel(fromY + unitY * end));
    graphics.strokePath();
    cursor += dashLength + gapLength;
  }
}
