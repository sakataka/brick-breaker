import type { Brick } from './types';
import { BRICK_LAYOUT as DEFAULT_BRICK_LAYOUT, type BrickLayout, getBrickPaletteColor } from './config';

export function buildBricks(layout: BrickLayout = DEFAULT_BRICK_LAYOUT): Brick[] {
  const { cols, rows, marginX, marginY, gapX, gapY, boardWidth, brickHeight } = layout;
  const brickWidth = (boardWidth - gapX * (cols - 1)) / cols;
  const bricks: Brick[] = [];
  let id = 0;

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
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
