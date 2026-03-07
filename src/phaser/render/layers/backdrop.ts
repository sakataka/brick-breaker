import type Phaser from "phaser";
import type { RenderViewState } from "../../../game/renderTypes";
import { type ParsedColor, parseColor } from "../color";
import { snapByStep } from "../dpiProfile";

interface BackdropTheme {
  base: string;
  top: string;
  frame: string;
  pattern: string;
  danger: string;
}

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
  drawPattern(graphics, view, width, height, snapStep);

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
  if (view.warningLevel !== "calm") {
    const warning = parseColor(backdropTheme.danger, { value: 0xff6a6a, alpha: 0.18 });
    const alpha = view.warningLevel === "critical" ? 0.16 : 0.08;
    graphics.fillStyle(warning.value, alpha);
    graphics.fillRect(0, 0, width, 18);
    graphics.fillRect(0, height - 18, width, 18);
  }

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
      pattern: "rgba(255, 255, 255, 0.18)",
      danger: "rgba(255, 112, 112, 0.5)",
    };
  }
  switch (themeBandId) {
    case "chapter2":
      return {
        base: "#23101b",
        top: "#5c2d18",
        frame: "#ffb05b",
        pattern: "rgba(255, 214, 164, 0.14)",
        danger: "rgba(255, 106, 68, 0.5)",
      };
    case "chapter3":
      return {
        base: "#190f31",
        top: "#4a2065",
        frame: "#ff74d1",
        pattern: "rgba(255, 184, 247, 0.14)",
        danger: "rgba(255, 104, 124, 0.52)",
      };
    case "midboss":
      return {
        base: "#230d20",
        top: "#6e1f36",
        frame: "#ff9d70",
        pattern: "rgba(255, 188, 164, 0.18)",
        danger: "rgba(255, 85, 110, 0.58)",
      };
    case "finalboss":
      return {
        base: "#170724",
        top: "#5a1646",
        frame: "#ff74d1",
        pattern: "rgba(255, 179, 231, 0.18)",
        danger: "rgba(255, 77, 118, 0.62)",
      };
    case "ex":
      return {
        base: "#081f1d",
        top: "#16504b",
        frame: "#56f7ba",
        pattern: "rgba(180, 255, 219, 0.16)",
        danger: "rgba(255, 136, 88, 0.52)",
      };
    default:
      return {
        base: "#081b35",
        top: "#154269",
        frame: "#42f3ff",
        pattern: "rgba(179, 247, 255, 0.14)",
        danger: "rgba(255, 122, 100, 0.46)",
      };
  }
}

function drawPattern(
  graphics: Phaser.GameObjects.Graphics,
  view: RenderViewState,
  width: number,
  height: number,
  snapStep: number,
): void {
  const color = parseColor(view.visualTheme.pattern, { value: 0xffffff, alpha: 0.14 });
  graphics.lineStyle(1, color.value, color.alpha);
  if (view.themeBandId === "chapter1") {
    for (let y = 24; y < height; y += 28) {
      graphics.beginPath();
      graphics.moveTo(0, snapByStep(y, snapStep));
      graphics.lineTo(width, snapByStep(y - 10, snapStep));
      graphics.strokePath();
    }
    return;
  }
  if (view.themeBandId === "chapter2") {
    for (let x = 20; x < width; x += 64) {
      graphics.strokeRect(snapByStep(x, snapStep), 24, 24, height - 48);
    }
    return;
  }
  if (view.themeBandId === "chapter3") {
    for (let x = 0; x < width; x += 48) {
      graphics.beginPath();
      graphics.moveTo(snapByStep(x, snapStep), 20);
      graphics.lineTo(snapByStep(x, snapStep), height - 20);
      graphics.strokePath();
    }
    return;
  }
  for (let index = 0; index < 12; index += 1) {
    const x = ((index + 1) * width) / 13;
    const radius = view.warningLevel === "critical" ? 22 : 16;
    graphics.strokeCircle(snapByStep(x, snapStep), height * 0.28, radius);
  }
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
