import type { Ball, Brick, Paddle, Scene, Vector2 } from "./domainTypes";

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
  shakeOffset: Vector2;
  trail: Vector2[];
  densityScale: number;
  reducedMotion: boolean;
}

export type CollisionEventKind = "wall" | "paddle" | "brick" | "miss";

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
