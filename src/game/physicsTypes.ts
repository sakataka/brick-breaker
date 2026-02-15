import type { GameplayBalance } from "./config";
import type { WarpZone } from "./config/stages";
import type { Ball, Brick, CollisionEvent, GameConfig, Paddle } from "./types";

export interface PhysicsConfig {
  maxMove?: number;
  maxSubSteps?: number;
  maxBallSpeed?: number;
  initialBallSpeed?: number;
  pierceDepth?: number;
  bombRadiusTiles?: number;
  explodeOnHit?: boolean;
  stickyEnabled?: boolean;
  stickyHoldSec?: number;
  stickyRecaptureCooldownSec?: number;
  homingStrength?: number;
  fluxField?: boolean;
  warpZones?: WarpZone[];
  onMiss?: (ball: Ball) => boolean;
  balance?: GameplayBalance;
}

export interface PhysicsInput {
  ball: Ball;
  paddle: Paddle;
  bricks: Brick[];
  config: GameConfig;
  deltaSec: number;
  stepConfig?: PhysicsConfig;
}

export interface PhysicsFrameResult {
  livesLost: number;
  cleared: boolean;
  scoreGain: number;
  events: CollisionEvent[];
  collision: {
    wall: boolean;
    paddle: boolean;
    brick: number;
  };
}
