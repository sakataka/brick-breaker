import type Phaser from "phaser";
import type { RenderViewState } from "../../../game-v2/public/renderTypes";
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
  const backdropTheme = resolveBackdropTheme(view);
  const background = parseColor(backdropTheme.base, { value: 0x0b1020, alpha: 1 });
  graphics.fillStyle(background.value, 1);
  graphics.fillRect(0, 0, width, height);

  const header = parseColor(backdropTheme.top, { value: 0x161d30, alpha: 1 });
  drawTopVignette(graphics, header, width);
  drawFarField(graphics, view, width, height, snapStep);
  drawMidStructures(graphics, view, width, height, snapStep);
  drawAmbientBursts(graphics, view, width, height, snapStep);
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
  if (view.visual.warningLevel !== "calm") {
    const warning = parseColor(backdropTheme.danger, { value: 0xff6a6a, alpha: 0.18 });
    const alpha = view.visual.warningLevel === "critical" ? 0.16 : 0.08;
    graphics.fillStyle(warning.value, alpha);
    graphics.fillRect(0, 0, width, 18);
    graphics.fillRect(0, height - 18, width, 18);
  }

  drawWarpZones(graphics, view.warpZones, lineWidth, snapStep);
}

function drawFarField(
  graphics: Phaser.GameObjects.Graphics,
  view: RenderViewState,
  width: number,
  height: number,
  snapStep: number,
): void {
  const accent = parseColor(view.visual.tokens.accent, { value: 0x40f4ff, alpha: 0.1 });
  const stars = view.arena.depth === "stellar" ? 18 : view.arena.depth === "orbital" ? 14 : 10;
  graphics.fillStyle(accent.value, accent.alpha * 0.68);
  for (let index = 0; index < stars; index += 1) {
    const x = (((index + 1) * 53) % width) + Math.sin(view.elapsedSec * 0.1 + index) * 8;
    const y = (((index + 3) * 37) % (height * 0.6)) + Math.cos(view.elapsedSec * 0.14 + index) * 4;
    graphics.fillCircle(
      snapByStep(x, snapStep),
      snapByStep(y, snapStep),
      index % 3 === 0 ? 1.8 : 1.1,
    );
  }
}

function drawMidStructures(
  graphics: Phaser.GameObjects.Graphics,
  view: RenderViewState,
  width: number,
  height: number,
  snapStep: number,
): void {
  const frame = parseColor(view.visual.tokens.frame, { value: 0x29d3ff, alpha: 0.18 });
  const structureAlpha = view.arena.depth === "fortress" ? 0.16 : 0.1;
  graphics.lineStyle(1.4, frame.value, structureAlpha);
  const baseY = height * 0.24;
  for (let index = 0; index < 4; index += 1) {
    const x = width * (0.12 + index * 0.22);
    const lift =
      Math.sin(view.elapsedSec * 0.35 + index) * (view.arena.depth === "stellar" ? 6 : 10);
    graphics.strokeRect(
      snapByStep(x, snapStep),
      snapByStep(baseY + lift, snapStep),
      44 + index * 10,
      height * (view.arena.depth === "fortress" ? 0.42 : 0.32),
    );
  }
}

function drawAmbientBursts(
  graphics: Phaser.GameObjects.Graphics,
  view: RenderViewState,
  width: number,
  height: number,
  snapStep: number,
): void {
  const accent = parseColor(view.visual.tokens.accent, { value: 0x40f4ff, alpha: 0.22 });
  const danger = parseColor(view.visual.tokens.danger, { value: 0xff6a6a, alpha: 0.18 });
  const pulse =
    0.5 +
    Math.sin(view.elapsedSec * (view.visual.encounterEmphasis === "chapter" ? 1.1 : 2.6)) * 0.5;
  graphics.fillStyle(accent.value, accent.alpha * (0.08 + pulse * 0.08));
  graphics.fillCircle(
    snapByStep(width * 0.18, snapStep),
    snapByStep(height * 0.24, snapStep),
    82 + pulse * 26,
  );
  graphics.fillStyle(
    danger.value,
    danger.alpha * (view.visual.warningLevel === "critical" ? 0.16 : 0.08),
  );
  graphics.fillCircle(
    snapByStep(width * 0.78, snapStep),
    snapByStep(height * 0.78, snapStep),
    64 + pulse * 18,
  );
}

function drawTopVignette(
  graphics: Phaser.GameObjects.Graphics,
  header: ParsedColor,
  width: number,
): void {
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
    drawGuideSegments(
      graphics,
      entryCenterX,
      entryCenterY,
      zone.outX,
      zone.outY,
      guide,
      lineWidth,
      snapStep,
    );
    graphics.fillStyle(exitFill.value, exitFill.alpha);
    graphics.fillCircle(snapByStep(zone.outX, snapStep), snapByStep(zone.outY, snapStep), 3.6);
    graphics.lineStyle(lineWidth, exitRing.value, exitRing.alpha);
    graphics.strokeCircle(snapByStep(zone.outX, snapStep), snapByStep(zone.outY, snapStep), 7.2);
  }
}

function resolveBackdropTheme(view: RenderViewState): BackdropTheme {
  const tokens = view.visual.tokens;
  return {
    base: tokens.backdrop,
    top: tokens.backdropTop,
    frame: tokens.frame,
    pattern: tokens.pattern,
    danger: tokens.danger,
  };
}

function drawPattern(
  graphics: Phaser.GameObjects.Graphics,
  view: RenderViewState,
  width: number,
  height: number,
  snapStep: number,
): void {
  const color = parseColor(view.visual.tokens.pattern, { value: 0xffffff, alpha: 0.14 });
  graphics.lineStyle(1, color.value, color.alpha);
  if (view.arena.frame === "citadel") {
    for (let ring = 0; ring < 3; ring += 1) {
      graphics.strokeCircle(width * 0.5, height * (0.18 + ring * 0.09), 92 + ring * 36);
    }
    return;
  }
  if (view.visual.themeId === "chapter1") {
    for (let y = 24; y < height; y += 28) {
      graphics.beginPath();
      graphics.moveTo(0, snapByStep(y + Math.sin(view.elapsedSec * 1.4 + y * 0.02) * 4, snapStep));
      graphics.lineTo(
        width,
        snapByStep(y - 10 + Math.sin(view.elapsedSec * 1.4 + y * 0.02) * 4, snapStep),
      );
      graphics.strokePath();
    }
    return;
  }
  if (view.visual.themeId === "chapter2") {
    for (let x = 20; x < width; x += 64) {
      const offset = Math.sin(view.elapsedSec * 1.8 + x * 0.04) * 6;
      graphics.strokeRect(snapByStep(x, snapStep), 24 + offset, 24, height - 48);
    }
    return;
  }
  if (view.visual.themeId === "chapter3") {
    for (let x = 0; x < width; x += 48) {
      graphics.beginPath();
      const drift = Math.sin(view.elapsedSec * 2.2 + x * 0.08) * 10;
      graphics.moveTo(snapByStep(x + drift, snapStep), 20);
      graphics.lineTo(snapByStep(x + drift, snapStep), height - 20);
      graphics.strokePath();
    }
    return;
  }
  for (let index = 0; index < 12; index += 1) {
    const x = ((index + 1) * width) / 13;
    const radius = view.visual.warningLevel === "critical" ? 22 : 16;
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
    graphics.moveTo(
      snapByStep(fromX + unitX * start, snapStep),
      snapByStep(fromY + unitY * start, snapStep),
    );
    graphics.lineTo(
      snapByStep(fromX + unitX * end, snapStep),
      snapByStep(fromY + unitY * end, snapStep),
    );
    graphics.strokePath();
    cursor += dashLength + gapLength;
  }
}
