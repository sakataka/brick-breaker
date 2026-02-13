export type Scene = 'start' | 'playing' | 'paused' | 'gameover' | 'clear' | 'error';
export type Difficulty = 'casual' | 'standard' | 'hard';

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

export interface AssistState {
  untilSec: number;
  paddleScale: number;
  maxSpeedScale: number;
}

export interface Particle {
  pos: Vector2;
  vel: Vector2;
  lifeMs: number;
  maxLifeMs: number;
  size: number;
  color: string;
}

export interface VfxState {
  particles: Particle[];
  flashMs: number;
  shakeMs: number;
  shakePx: number;
  trail: Vector2[];
  densityScale: number;
  reducedMotion: boolean;
}

export type CollisionEventKind = 'wall' | 'paddle' | 'brick' | 'miss';

export interface CollisionEvent {
  kind: CollisionEventKind;
  x: number;
  y: number;
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
  assist: AssistState;
  vfx: VfxState;
  errorMessage: string | null;
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
