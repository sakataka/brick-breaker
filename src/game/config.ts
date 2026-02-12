import type { GameConfig } from './types';

export const GAME_CONFIG: GameConfig = {
  width: 960,
  height: 540,
  fixedDeltaSec: 1 / 120,
  initialLives: 3,
  initialBallSpeed: 320,
  maxBallSpeed: 620,
};

export const BRICK_LAYOUT = {
  cols: 10,
  rows: 6,
  marginX: 50,
  marginY: 80,
  gapX: 8,
  gapY: 10,
  boardWidth: 840,
  brickHeight: 24,
} as const;

export const CLEAR_BONUS_PER_LIFE = 500;
