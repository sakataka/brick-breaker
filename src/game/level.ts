import type { Brick } from './types';

export function buildBricks(): Brick[] {
  const cols = 10;
  const rows = 6;
  const marginX = 50;
  const marginY = 80;
  const gap = 8;
  const width = 840;
  const brickW = (width - gap * (cols - 1)) / cols;
  const brickH = 24;
  const startX = marginX;
  const startY = marginY;

  const bricks: Brick[] = [];
  let id = 0;
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      bricks.push({
        id: id++,
        x: startX + col * (brickW + gap),
        y: startY + row * (brickH + 10),
        width: brickW,
        height: brickH,
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
