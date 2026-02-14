import { describe, expect, test } from "bun:test";

import { stepPhysicsCore } from "./physicsCore";
import type { Ball, Brick, GameConfig, Paddle } from "./types";

const baseConfig: GameConfig = {
  width: 240,
  height: 180,
  difficulty: "standard",
  fixedDeltaSec: 1 / 120,
  initialLives: 3,
  initialBallSpeed: 320,
  maxBallSpeed: 620,
  assistDurationSec: 3,
  assistPaddleScale: 1.1,
  assistMaxSpeedScale: 0.92,
};

function basePaddle(): Paddle {
  return { x: 80, y: 160, width: 80, height: 14 };
}

describe("physicsCore", () => {
  test("supports pierce and bomb at the same time", () => {
    const ball: Ball = {
      pos: { x: 42, y: 92 },
      vel: { x: 0, y: -170 },
      radius: 7,
      speed: 320,
    };
    const bricks: Brick[] = [
      { id: 1, x: 30, y: 70, width: 24, height: 10, alive: true, row: 2, col: 1 },
      { id: 2, x: 30, y: 56, width: 24, height: 10, alive: true, row: 1, col: 1 },
      { id: 3, x: 54, y: 56, width: 24, height: 10, alive: true, row: 1, col: 2 },
      { id: 4, x: 30, y: 42, width: 24, height: 10, alive: true, row: 0, col: 1 },
    ];

    const result = stepPhysicsCore({
      ball,
      paddle: basePaddle(),
      bricks,
      config: baseConfig,
      deltaSec: 0.18,
      stepConfig: {
        pierceDepth: 4,
        bombRadiusTiles: 1,
        explodeOnHit: true,
        maxMove: 12,
        maxSubSteps: 24,
      },
    });

    expect(result.collision.brick).toBeGreaterThanOrEqual(2);
    expect(result.events.filter((event) => event.kind === "brick").length).toBe(result.collision.brick);
  });

  test("non-recursive bomb does not erase every brick in one tick", () => {
    const ball: Ball = {
      pos: { x: 70, y: 72 },
      vel: { x: 0, y: -90 },
      radius: 8,
      speed: 320,
    };
    const bricks: Brick[] = [
      { id: 1, x: 60, y: 64, width: 20, height: 10, alive: true, row: 1, col: 1 },
      { id: 2, x: 84, y: 64, width: 20, height: 10, alive: true, row: 1, col: 2 },
      { id: 3, x: 108, y: 64, width: 20, height: 10, alive: true, row: 1, col: 3 },
      { id: 4, x: 132, y: 64, width: 20, height: 10, alive: true, row: 1, col: 4 },
    ];

    const result = stepPhysicsCore({
      ball,
      paddle: basePaddle(),
      bricks,
      config: baseConfig,
      deltaSec: baseConfig.fixedDeltaSec,
      stepConfig: {
        bombRadiusTiles: 1,
        explodeOnHit: true,
      },
    });

    expect(result.collision.brick).toBeGreaterThanOrEqual(1);
    expect(result.collision.brick).toBeLessThan(bricks.length);
  });

  test("durable brick breaks on second direct hit", () => {
    const ball: Ball = {
      pos: { x: 72, y: 72 },
      vel: { x: 0, y: 120 },
      radius: 8,
      speed: 320,
    };
    const bricks: Brick[] = [
      { id: 1, x: 60, y: 64, width: 20, height: 10, alive: true, kind: "durable", hp: 2 },
    ];

    const first = stepPhysicsCore({
      ball,
      paddle: basePaddle(),
      bricks,
      config: baseConfig,
      deltaSec: baseConfig.fixedDeltaSec,
    });
    expect(bricks[0]?.alive).toBe(true);
    expect(bricks[0]?.hp).toBe(1);
    expect(first.collision.brick).toBe(0);

    ball.pos = { x: 72, y: 72 };
    ball.vel = { x: 0, y: 120 };
    const second = stepPhysicsCore({
      ball,
      paddle: basePaddle(),
      bricks,
      config: baseConfig,
      deltaSec: baseConfig.fixedDeltaSec,
    });
    expect(bricks[0]?.alive).toBe(false);
    expect(second.collision.brick).toBe(1);
  });

  test("armored brick resists explosion kill", () => {
    const ball: Ball = {
      pos: { x: 72, y: 72 },
      vel: { x: 0, y: -90 },
      radius: 8,
      speed: 320,
    };
    const bricks: Brick[] = [
      { id: 1, x: 60, y: 64, width: 20, height: 10, alive: true, row: 1, col: 1, kind: "normal", hp: 1 },
      { id: 2, x: 84, y: 64, width: 20, height: 10, alive: true, row: 1, col: 2, kind: "armored", hp: 2 },
    ];

    const result = stepPhysicsCore({
      ball,
      paddle: basePaddle(),
      bricks,
      config: baseConfig,
      deltaSec: baseConfig.fixedDeltaSec,
      stepConfig: {
        bombRadiusTiles: 1,
        explodeOnHit: true,
      },
    });

    expect(result.collision.brick).toBe(1);
    expect(bricks[1]?.alive).toBe(true);
    expect(bricks[1]?.hp).toBe(1);
  });
});
