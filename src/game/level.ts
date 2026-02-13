import { type BrickLayout, BRICK_LAYOUT as DEFAULT_BRICK_LAYOUT, getBrickPaletteColor } from "./config";
import type { Brick, StageDefinition } from "./types";

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
  const brickWidth = (boardWidth - gapX * (cols - 1)) / cols;
  const bricks: Brick[] = [];
  let id = 0;

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const cell = stage.layout[row]?.[col] ?? 0;
      if (cell !== 1) {
        continue;
      }
      bricks.push({
        id: id++,
        x: marginX + col * (brickWidth + gapX),
        y: marginY + row * (brickHeight + gapY),
        width: brickWidth,
        height: brickHeight,
        alive: true,
        row,
        color: getBrickPaletteColor(row),
      });
    }
  }

  return bricks;
}
