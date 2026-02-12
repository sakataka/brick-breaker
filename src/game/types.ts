export type Scene = 'start' | 'playing' | 'paused' | 'gameover' | 'clear';

export interface Vector2 {
  x: number;
  y: number;
}

export interface Ball {
  pos: Vector2;
  vel: Vector2;
  radius: number;
  speed: number;
}

export interface Paddle {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Brick {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  alive: boolean;
  row?: number;
  color?: string;
}

export interface GameState {
  scene: Scene;
  score: number;
  lives: number;
  elapsedSec: number;
  ball: Ball;
  paddle: Paddle;
  bricks: Brick[];
}

export interface GameConfig {
  width: number;
  height: number;
  fixedDeltaSec: number;
  initialLives: number;
  initialBallSpeed: number;
  maxBallSpeed: number;
}
