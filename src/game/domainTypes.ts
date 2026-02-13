export type Scene = "start" | "playing" | "paused" | "gameover" | "stageclear" | "clear" | "error";
export type Difficulty = "casual" | "standard" | "hard";
export type ItemType = "paddle_plus" | "slow_ball" | "multiball" | "shield";

export interface Vector2 {
  x: number;
  y: number;
}

export interface RandomSource {
  next(): number;
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

export interface GameConfig {
  width: number;
  height: number;
  difficulty: Difficulty;
  fixedDeltaSec: number;
  initialLives: number;
  initialBallSpeed: number;
  maxBallSpeed: number;
  assistDurationSec: number;
  assistPaddleScale: number;
  assistMaxSpeedScale: number;
}

export interface StageDefinition {
  id: number;
  speedScale: number;
  layout: number[][];
}
