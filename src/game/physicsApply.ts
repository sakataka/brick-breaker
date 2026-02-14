import { stepPhysicsCore } from "./physicsCore";
import type { PhysicsConfig, PhysicsFrameResult } from "./physicsTypes";
import type { Ball, CollisionEvent, GameConfig, GameState, Paddle } from "./types";

export interface MultiBallPhysicsResult {
  survivors: Ball[];
  lostBalls: number;
  scoreGain: number;
  hasClear: boolean;
  events: CollisionEvent[];
  frames: PhysicsFrameResult[];
}

export function runPhysicsForBalls(
  balls: Ball[],
  paddle: Paddle,
  bricks: GameState["bricks"],
  config: GameConfig,
  deltaSec: number,
  stepConfig: PhysicsConfig,
): MultiBallPhysicsResult {
  const events: CollisionEvent[] = [];
  const survivors: Ball[] = [];
  const frames: PhysicsFrameResult[] = [];
  let scoreGain = 0;
  let hasClear = false;
  let lostBalls = 0;

  for (const ball of balls) {
    const frame = stepPhysicsCore({
      ball,
      paddle,
      bricks,
      config,
      deltaSec,
      stepConfig,
    });
    frames.push(frame);
    events.push(...frame.events);
    if (frame.collision.brick > 0) {
      scoreGain += frame.scoreGain;
    }
    if (frame.cleared) {
      hasClear = true;
    }
    if (frame.livesLost <= 0) {
      survivors.push(ball);
    } else {
      lostBalls += frame.livesLost;
    }
  }

  return {
    survivors,
    lostBalls,
    scoreGain,
    hasClear,
    events,
    frames,
  };
}
