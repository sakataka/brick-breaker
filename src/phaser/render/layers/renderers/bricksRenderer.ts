import { getBrickSkin, type BrickSkinSpec } from "../../../../art/visualAssets";
import type { RenderViewState } from "../../../../game-v2/public/renderTypes";
import { parseColor, snapPixel } from "../../color";
import { snapByStep } from "../../dpiProfile";
import type { DrawWorldOptions, WorldGraphics } from "./types";

type BrickSurfacePattern = BrickSkinSpec["pattern"];
type BrickPatternRenderer = (
  graphics: WorldGraphics,
  brick: RenderViewState["bricks"][number],
  brickX: number,
  brickY: number,
  snapStep: number,
  accent: ReturnType<typeof parseColor>,
) => void;

export const BRICK_SURFACE_PATTERN_ORDER: readonly BrickSurfacePattern[] = [
  "panel",
  "plate",
  "circuit",
  "rivets",
  "core",
  "barrier",
  "turret",
  "hazard",
  "armor",
  "split",
  "summon",
  "thorns",
] as const;

const BRICK_PATTERN_RENDERERS: Record<BrickSurfacePattern, BrickPatternRenderer> = {
  panel: drawPanelPattern,
  plate: drawPlatePattern,
  circuit: drawCircuitPattern,
  rivets: drawRivetsPattern,
  core: drawCorePattern,
  barrier: drawBarrierPattern,
  turret: drawTurretPattern,
  hazard: drawHazardPattern,
  armor: drawArmorPattern,
  split: drawSplitPattern,
  summon: drawSummonPattern,
  thorns: drawThornsPattern,
};

export function drawBricks(
  graphics: WorldGraphics,
  view: RenderViewState,
  options: Pick<
    DrawWorldOptions,
    | "offsetX"
    | "offsetY"
    | "lineWidth"
    | "snapStep"
    | "brickFillAlphaMin"
    | "brickStrokeAlpha"
    | "brickCornerRadius"
    | "fallbackBrickPalette"
    | "assetProfile"
  >,
): void {
  const {
    offsetX,
    offsetY,
    lineWidth,
    snapStep,
    brickFillAlphaMin,
    brickStrokeAlpha,
    brickCornerRadius,
    fallbackBrickPalette,
    assetProfile,
  } = options;
  for (const brick of view.bricks) {
    if (!brick.alive && brick.kind !== "gate") {
      continue;
    }
    if (!brick.alive && brick.kind === "gate") {
      drawGateGhost(graphics, brick, offsetX, offsetY, lineWidth, snapStep);
      continue;
    }
    const fallbackColor =
      fallbackBrickPalette[(brick.row ?? 0) % fallbackBrickPalette.length] ?? "#ffffff";
    const skin = getBrickSkin(brick.kind, assetProfile, brick.color ?? fallbackColor);
    const body = parseColor(skin.baseColor, { value: 0xa0c8ff, alpha: 0.72 });
    const inset = parseColor(skin.insetColor, { value: 0xb7d8ff, alpha: 0.68 });
    const edge = parseColor(skin.edgeColor, { value: 0xffffff, alpha: 0.82 });
    const glow = parseColor(skin.glowColor, { value: 0xffffff, alpha: 0.34 });
    const brickX = snapByStep(brick.x + offsetX, snapStep);
    const brickY = snapByStep(brick.y + offsetY, snapStep);
    const materialBoost =
      view.arena.blockMaterial === "core"
        ? 0.14
        : view.arena.blockMaterial === "armor"
          ? 0.08
          : view.arena.blockMaterial === "alloy"
            ? 0.04
            : 0;
    graphics.fillStyle(body.value, Math.max(body.alpha + materialBoost, brickFillAlphaMin));
    graphics.fillRoundedRect(brickX, brickY, brick.width, brick.height, brickCornerRadius);
    graphics.fillStyle(inset.value, Math.max(0.2, inset.alpha * 0.66));
    graphics.fillRoundedRect(
      brickX + 2,
      brickY + 2,
      Math.max(0, brick.width - 4),
      Math.max(0, brick.height - 4),
      Math.max(2, brickCornerRadius - 2),
    );
    graphics.lineStyle(lineWidth, edge.value, brickStrokeAlpha);
    graphics.strokeRoundedRect(
      brickX + lineWidth / 2,
      brickY + lineWidth / 2,
      Math.max(0, brick.width - lineWidth),
      Math.max(0, brick.height - lineWidth),
      Math.max(0, brickCornerRadius - lineWidth / 2),
    );
    graphics.lineStyle(1, glow.value, Math.max(0.18, glow.alpha * 0.58));
    graphics.beginPath();
    graphics.moveTo(brickX + 4, brickY + 4);
    graphics.lineTo(brickX + brick.width - 4, brickY + 4);
    graphics.strokePath();
    drawBrickSurfacePattern(graphics, brick, brickX, brickY, snapStep, skin);

    if (brick.kind && brick.kind !== "normal") {
      const markerColor = parseColor(skin.markerColor || getBrickMarkerColor(brick.kind), {
        value: 0xffffff,
        alpha: 0.95,
      });
      graphics.fillStyle(markerColor.value, markerColor.alpha);
      graphics.fillCircle(
        snapPixel(brick.x + brick.width - 7 + offsetX),
        snapPixel(brick.y + 7 + offsetY),
        2.5,
      );
      if (brick.kind === "gate") {
        drawGateStripe(graphics, brick, offsetX, offsetY, snapStep);
      }
    }

    if (typeof brick.hp === "number" && typeof brick.maxHp === "number" && brick.maxHp > 1) {
      const hpRatio = Math.max(0, Math.min(1, brick.hp / brick.maxHp));
      const hpBg = parseColor("rgba(255,255,255,0.2)", { value: 0xffffff, alpha: 0.2 });
      const hpFg = parseColor("rgba(255,235,160,0.9)", { value: 0xffeba0, alpha: 0.9 });
      graphics.fillStyle(hpBg.value, hpBg.alpha);
      graphics.fillRect(
        snapPixel(brick.x + 4 + offsetX),
        snapPixel(brick.y + brick.height - 4 + offsetY),
        brick.width - 8,
        2,
      );
      graphics.fillStyle(hpFg.value, hpFg.alpha);
      graphics.fillRect(
        snapPixel(brick.x + 4 + offsetX),
        snapPixel(brick.y + brick.height - 4 + offsetY),
        (brick.width - 8) * hpRatio,
        2,
      );
    }
  }
}

function drawGateGhost(
  graphics: WorldGraphics,
  brick: RenderViewState["bricks"][number],
  offsetX: number,
  offsetY: number,
  lineWidth: number,
  snapStep: number,
): void {
  const stroke = parseColor("rgba(255, 226, 126, 0.38)", { value: 0xffe27e, alpha: 0.38 });
  const fill = parseColor("rgba(255, 226, 126, 0.08)", { value: 0xffe27e, alpha: 0.08 });
  const x = snapByStep(brick.x + offsetX, snapStep);
  const y = snapByStep(brick.y + offsetY, snapStep);
  graphics.fillStyle(fill.value, fill.alpha);
  graphics.fillRoundedRect(x, y, brick.width, brick.height, 6);
  graphics.lineStyle(lineWidth, stroke.value, stroke.alpha);
  graphics.strokeRoundedRect(x, y, brick.width, brick.height, 6);
}

function drawGateStripe(
  graphics: WorldGraphics,
  brick: RenderViewState["bricks"][number],
  offsetX: number,
  offsetY: number,
  snapStep: number,
): void {
  const stripe = parseColor("rgba(255, 228, 120, 0.28)", { value: 0xffe478, alpha: 0.28 });
  graphics.lineStyle(1, stripe.value, stripe.alpha);
  for (let stripeIndex = -1; stripeIndex < 5; stripeIndex += 1) {
    const startX = brick.x + stripeIndex * 12 + offsetX;
    graphics.beginPath();
    graphics.moveTo(
      snapByStep(startX, snapStep),
      snapByStep(brick.y + brick.height + offsetY, snapStep),
    );
    graphics.lineTo(snapByStep(startX + 18, snapStep), snapByStep(brick.y + offsetY, snapStep));
    graphics.strokePath();
  }
}

function drawBrickSurfacePattern(
  graphics: WorldGraphics,
  brick: RenderViewState["bricks"][number],
  brickX: number,
  brickY: number,
  snapStep: number,
  skin: ReturnType<typeof getBrickSkin>,
): void {
  const accent = parseColor(skin.glowColor, { value: 0xffffff, alpha: 0.3 });
  const thin = Math.max(1, brick.width >= 32 ? 1.4 : 1);
  graphics.lineStyle(thin, accent.value, Math.max(0.14, accent.alpha * 0.72));
  BRICK_PATTERN_RENDERERS[skin.pattern](graphics, brick, brickX, brickY, snapStep, accent);
}

function drawPanelPattern(
  graphics: WorldGraphics,
  brick: RenderViewState["bricks"][number],
  brickX: number,
  brickY: number,
): void {
  graphics.strokeRect(
    brickX + 4,
    brickY + 4,
    Math.max(0, brick.width - 8),
    Math.max(0, brick.height - 8),
  );
  graphics.beginPath();
  graphics.moveTo(brickX + brick.width * 0.5, brickY + 4);
  graphics.lineTo(brickX + brick.width * 0.5, brickY + brick.height - 4);
  graphics.strokePath();
}

function drawPlatePattern(
  graphics: WorldGraphics,
  brick: RenderViewState["bricks"][number],
  brickX: number,
  brickY: number,
  _snapStep: number,
  accent: ReturnType<typeof parseColor>,
): void {
  graphics.beginPath();
  graphics.moveTo(brickX + 4, brickY + brick.height * 0.5);
  graphics.lineTo(brickX + brick.width - 4, brickY + brick.height * 0.5);
  graphics.strokePath();
  graphics.fillStyle(accent.value, 0.22);
  graphics.fillCircle(brickX + 6, brickY + 6, 1.8);
  graphics.fillCircle(brickX + brick.width - 6, brickY + brick.height - 6, 1.8);
}

function drawCircuitPattern(
  graphics: WorldGraphics,
  brick: RenderViewState["bricks"][number],
  brickX: number,
  brickY: number,
  _snapStep: number,
  accent: ReturnType<typeof parseColor>,
): void {
  graphics.beginPath();
  graphics.moveTo(brickX + 4, brickY + brick.height * 0.35);
  graphics.lineTo(brickX + brick.width * 0.42, brickY + brick.height * 0.35);
  graphics.lineTo(brickX + brick.width * 0.42, brickY + brick.height * 0.68);
  graphics.lineTo(brickX + brick.width - 4, brickY + brick.height * 0.68);
  graphics.strokePath();
  graphics.fillStyle(accent.value, 0.28);
  graphics.fillCircle(brickX + brick.width * 0.42, brickY + brick.height * 0.35, 2);
  graphics.fillCircle(brickX + brick.width * 0.42, brickY + brick.height * 0.68, 2);
}

function drawRivetsPattern(
  graphics: WorldGraphics,
  brick: RenderViewState["bricks"][number],
  brickX: number,
  brickY: number,
  _snapStep: number,
  accent: ReturnType<typeof parseColor>,
): void {
  graphics.fillStyle(accent.value, 0.24);
  graphics.fillCircle(brickX + 6, brickY + 6, 2.2);
  graphics.fillCircle(brickX + brick.width - 6, brickY + 6, 2.2);
  graphics.fillCircle(brickX + 6, brickY + brick.height - 6, 2.2);
  graphics.fillCircle(brickX + brick.width - 6, brickY + brick.height - 6, 2.2);
  graphics.beginPath();
  graphics.moveTo(brickX + 4, brickY + brick.height * 0.5);
  graphics.lineTo(brickX + brick.width - 4, brickY + brick.height * 0.5);
  graphics.strokePath();
}

function drawCorePattern(
  graphics: WorldGraphics,
  brick: RenderViewState["bricks"][number],
  brickX: number,
  brickY: number,
  _snapStep: number,
  accent: ReturnType<typeof parseColor>,
): void {
  graphics.strokeRoundedRect(
    brickX + 6,
    brickY + 4,
    Math.max(0, brick.width - 12),
    Math.max(0, brick.height - 8),
    4,
  );
  graphics.fillStyle(accent.value, 0.24);
  graphics.fillCircle(
    brickX + brick.width * 0.5,
    brickY + brick.height * 0.5,
    Math.min(brick.width, brick.height) * 0.18,
  );
}

function drawBarrierPattern(
  graphics: WorldGraphics,
  brick: RenderViewState["bricks"][number],
  brickX: number,
  brickY: number,
  snapStep: number,
): void {
  for (let stripe = -1; stripe < 5; stripe += 1) {
    const startX = brickX + stripe * 10;
    graphics.beginPath();
    graphics.moveTo(snapByStep(startX, snapStep), snapByStep(brickY + brick.height, snapStep));
    graphics.lineTo(snapByStep(startX + 16, snapStep), snapByStep(brickY, snapStep));
    graphics.strokePath();
  }
}

function drawTurretPattern(
  graphics: WorldGraphics,
  brick: RenderViewState["bricks"][number],
  brickX: number,
  brickY: number,
  _snapStep: number,
  accent: ReturnType<typeof parseColor>,
): void {
  graphics.fillStyle(accent.value, 0.24);
  graphics.fillRect(brickX + brick.width * 0.42, brickY + 2, 5, brick.height - 8);
  graphics.fillRect(
    brickX + brick.width * 0.32,
    brickY + brick.height * 0.42,
    brick.width * 0.36,
    4,
  );
}

function drawHazardPattern(
  graphics: WorldGraphics,
  brick: RenderViewState["bricks"][number],
  brickX: number,
  brickY: number,
): void {
  for (let stripe = -1; stripe < 4; stripe += 1) {
    const startX = brickX + stripe * 12;
    graphics.beginPath();
    graphics.moveTo(startX, brickY + brick.height);
    graphics.lineTo(startX + 14, brickY);
    graphics.strokePath();
  }
}

function drawArmorPattern(
  graphics: WorldGraphics,
  brick: RenderViewState["bricks"][number],
  brickX: number,
  brickY: number,
): void {
  graphics.beginPath();
  graphics.moveTo(brickX + 4, brickY + brick.height * 0.65);
  graphics.lineTo(brickX + brick.width * 0.5, brickY + 4);
  graphics.lineTo(brickX + brick.width - 4, brickY + brick.height * 0.65);
  graphics.strokePath();
}

function drawSplitPattern(
  graphics: WorldGraphics,
  brick: RenderViewState["bricks"][number],
  brickX: number,
  brickY: number,
): void {
  graphics.beginPath();
  graphics.moveTo(brickX + brick.width * 0.5, brickY + 4);
  graphics.lineTo(brickX + brick.width * 0.5, brickY + brick.height - 4);
  graphics.strokePath();
  graphics.beginPath();
  graphics.moveTo(brickX + brick.width * 0.5 - 6, brickY + brick.height * 0.5);
  graphics.lineTo(brickX + brick.width * 0.5 + 6, brickY + brick.height * 0.5);
  graphics.strokePath();
}

function drawSummonPattern(
  graphics: WorldGraphics,
  brick: RenderViewState["bricks"][number],
  brickX: number,
  brickY: number,
): void {
  graphics.beginPath();
  graphics.moveTo(brickX + brick.width * 0.5, brickY + 4);
  graphics.lineTo(brickX + brick.width - 6, brickY + brick.height * 0.5);
  graphics.lineTo(brickX + brick.width * 0.5, brickY + brick.height - 4);
  graphics.lineTo(brickX + 6, brickY + brick.height * 0.5);
  graphics.closePath();
  graphics.strokePath();
}

function drawThornsPattern(
  graphics: WorldGraphics,
  brick: RenderViewState["bricks"][number],
  brickX: number,
  brickY: number,
): void {
  graphics.beginPath();
  graphics.moveTo(brickX + 4, brickY + brick.height - 4);
  graphics.lineTo(brickX + brick.width * 0.28, brickY + 6);
  graphics.lineTo(brickX + brick.width * 0.5, brickY + brick.height - 4);
  graphics.lineTo(brickX + brick.width * 0.72, brickY + 6);
  graphics.lineTo(brickX + brick.width - 4, brickY + brick.height - 4);
  graphics.strokePath();
}

function getBrickMarkerColor(kind: NonNullable<RenderViewState["bricks"][number]["kind"]>): string {
  switch (kind) {
    case "steel":
      return "#d7ebff";
    case "generator":
      return "#9dffca";
    case "gate":
      return "#ffd88c";
    case "turret":
      return "#ffb27a";
    case "durable":
      return "#ffd06e";
    case "armored":
      return "#b9daff";
    case "regen":
      return "#8affae";
    case "hazard":
      return "#ff8f8f";
    case "boss":
      return "#ff73d0";
    case "split":
      return "#fff1a0";
    case "summon":
      return "#ffb17b";
    case "thorns":
      return "#ff8fce";
    default:
      return "#ffffff";
  }
}
