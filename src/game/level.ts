import {
  type BrickLayout,
  BRICK_LAYOUT as DEFAULT_BRICK_LAYOUT,
  getBrickPaletteColor,
  getBrickPaletteForStage,
} from "./config";
import type { Brick, BrickKind, StageDefinition } from "./types";

export function buildBricks(layout: BrickLayout = DEFAULT_BRICK_LAYOUT): Brick[] {
  const fullLayout = Array.from({ length: layout.rows }, () => Array.from({ length: layout.cols }, () => 1));
  return buildBricksFromStage(
    {
      id: 1,
      speedScale: 1,
      layout: fullLayout,
    },
    layout,
  );
}

export function buildBricksFromStage(
  stage: StageDefinition,
  layout: BrickLayout = DEFAULT_BRICK_LAYOUT,
): Brick[] {
  const { cols, rows, marginX, marginY, gapX, gapY, boardWidth, brickHeight } = layout;
  const eliteMap = new Map(
    (stage.elite ?? []).map((entry) => [`${entry.row}:${entry.col}`, entry.kind] as const),
  );
  const palette = getBrickPaletteForStage(stage.id - 1);
  const brickWidth = (boardWidth - gapX * (cols - 1)) / cols;
  const bricks: Brick[] = [];
  let id = 0;

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const cell = stage.layout[row]?.[col] ?? 0;
      if (cell !== 1) {
        continue;
      }
      const eliteKind = eliteMap.get(`${row}:${col}`);
      const kind = eliteKind ?? "normal";
      bricks.push({
        id: id++,
        x: marginX + col * (brickWidth + gapX),
        y: marginY + row * (brickHeight + gapY),
        width: brickWidth,
        height: brickHeight,
        alive: true,
        kind,
        hp: getInitialHpByKind(kind),
        regenCharges: kind === "regen" ? 1 : 0,
        row,
        col,
        color: getBrickPaletteColor(row, palette),
      });
    }
  }

  return bricks;
}

function getInitialHpByKind(kind: BrickKind): number {
  if (kind === "normal") {
    return 1;
  }
  return 2;
}
