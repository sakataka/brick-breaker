import { BRICK_LAYOUT } from './config';
import type { Brick } from './types';

export function buildBricks(): Brick[] {
  const { cols, rows, marginX, marginY, gapX, gapY, boardWidth, brickHeight } = BRICK_LAYOUT;
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
        color: getBrickColor(row),
      });
    }
  }

  return bricks;
}

export function getBrickColor(index: number): string {
  const palette = [
    'rgba(255, 122, 122, 0.45)',
    'rgba(255, 196, 118, 0.45)',
    'rgba(122, 232, 176, 0.45)',
    'rgba(125, 165, 255, 0.45)',
    'rgba(182, 125, 255, 0.45)',
    'rgba(255, 144, 210, 0.45)',
  ];

  return palette[index % palette.length];
}
