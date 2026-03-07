import { getInitialBrickHp } from "./brickRules";
import {
  type BrickLayout,
  BRICK_LAYOUT as DEFAULT_BRICK_LAYOUT,
  getBrickPaletteColor,
  getBrickPaletteForStage,
} from "./config";
import type { Brick, StageDefinition } from "./types";

export function buildBricksFromStage(
  stage: StageDefinition,
  layout: BrickLayout = DEFAULT_BRICK_LAYOUT,
): Brick[] {
  const { cols, rows, marginX, marginY, gapX, gapY, boardWidth, brickHeight } = layout;
  const eliteMap = new Map(
    (stage.elite ?? []).map((entry) => [`${entry.row}:${entry.col}`, entry.kind] as const),
  );
  const specialMap = new Map(
    (stage.specials ?? []).map((entry) => [`${entry.row}:${entry.col}`, entry.kind] as const),
  );
  const palette = getBrickPaletteForStage(stage.id - 1);
  const brickWidth = (boardWidth - gapX * (cols - 1)) / cols;
  const bricks: Brick[] = [];
  let id = 0;

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const cell = stage.layout[row]?.[col] ?? 0;
      const specialKind = specialMap.get(`${row}:${col}`);
      if (cell !== 1 && !specialKind) {
        continue;
      }
      const eliteKind = eliteMap.get(`${row}:${col}`);
      const kind = specialKind ?? eliteKind ?? "normal";
      const hp = getInitialBrickHp(kind);
      const hasFiniteHp = Number.isFinite(hp);
      bricks.push({
        id: id++,
        x: marginX + col * (brickWidth + gapX),
        y: marginY + row * (brickHeight + gapY),
        width: brickWidth,
        height: brickHeight,
        alive: true,
        kind,
        hp: hasFiniteHp ? hp : undefined,
        maxHp: hasFiniteHp ? hp : undefined,
        regenCharges: kind === "regen" ? 1 : 0,
        cooldownSec: kind === "generator" || kind === "gate" || kind === "turret" ? 0 : undefined,
        row,
        col,
        color: getBrickPaletteColor(row, palette),
      });
    }
  }

  return bricks;
}
