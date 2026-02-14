import { stepPhysicsCore } from "./physicsCore";
import type { PhysicsConfig, PhysicsFrameResult } from "./physicsTypes";
import type { Ball, Brick, GameConfig, Paddle } from "./types";

export type PhysicsResult = PhysicsFrameResult;
export type { PhysicsConfig };

export function stepPhysics(
  ball: Ball,
  paddle: Paddle,
  bricks: Brick[],
  config: GameConfig,
  deltaSec: number,
  stepConfig?: PhysicsConfig,
): PhysicsResult {
  return stepPhysicsCore({
    ball,
    paddle,
    bricks,
    config,
    deltaSec,
    stepConfig,
  });
}
