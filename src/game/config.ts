import type { GameConfig } from './types';

export interface BrickTheme {
  palette: readonly string[];
}

export interface BrickLayout {
  cols: number;
  rows: number;
  marginX: number;
  marginY: number;
  gapX: number;
  gapY: number;
  boardWidth: number;
  brickHeight: number;
}

export interface GameplayBalance {
  paddleWidth: number;
  paddleHeight: number;
  paddleBottomOffset: number;
  ballRadius: number;
  serveYOffset: number;
  serveSpreadRatio: number;
  brickHitSpeedGain: number;
  paddleMaxBounceAngle: number;
  scorePerBrick: number;
  clearBonusPerLife: number;
}

export const GAME_CONFIG: GameConfig = {
  width: 960,
  height: 540,
  fixedDeltaSec: 1 / 120,
  initialLives: 3,
  initialBallSpeed: 300,
  maxBallSpeed: 600,
};

export const BRICK_PALETTE: BrickTheme['palette'] = [
  'rgba(255, 122, 122, 0.45)',
  'rgba(255, 196, 118, 0.45)',
  'rgba(122, 232, 176, 0.45)',
  'rgba(125, 165, 255, 0.45)',
  'rgba(182, 125, 255, 0.45)',
  'rgba(255, 144, 210, 0.45)',
] as const;

export const GAME_BALANCE: GameplayBalance = {
  paddleWidth: 130,
  paddleHeight: 16,
  paddleBottomOffset: 44,
  ballRadius: 8,
  serveYOffset: 18,
  serveSpreadRatio: 0.45,
  brickHitSpeedGain: 2,
  paddleMaxBounceAngle: Math.PI / 3,
  scorePerBrick: 100,
  clearBonusPerLife: 500,
} as const;

export const BRICK_LAYOUT: BrickLayout = {
  cols: 10,
  rows: 6,
  marginX: 50,
  marginY: 80,
  gapX: 8,
  gapY: 10,
  boardWidth: 840,
  brickHeight: 24,
};

export function getBrickPaletteColor(row: number, palette: BrickTheme['palette'] = BRICK_PALETTE): string {
  return palette[row % palette.length];
}
