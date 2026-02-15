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
  multiballMaxBalls: 4,
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

  test("regen brick heals once before breaking", () => {
    const ball: Ball = {
      pos: { x: 72, y: 72 },
      vel: { x: 0, y: 120 },
      radius: 8,
      speed: 320,
    };
    const bricks: Brick[] = [
      { id: 1, x: 60, y: 64, width: 20, height: 10, alive: true, kind: "regen", hp: 2, regenCharges: 1 },
    ];

    const first = stepPhysicsCore({
      ball,
      paddle: basePaddle(),
      bricks,
      config: baseConfig,
      deltaSec: baseConfig.fixedDeltaSec,
    });
    expect(first.collision.brick).toBe(0);
    expect(bricks[0]?.alive).toBe(true);
    expect(bricks[0]?.hp).toBe(2);
    expect(bricks[0]?.regenCharges).toBe(0);

    ball.pos = { x: 72, y: 72 };
    ball.vel = { x: 0, y: 120 };
    const second = stepPhysicsCore({
      ball,
      paddle: basePaddle(),
      bricks,
      config: baseConfig,
      deltaSec: baseConfig.fixedDeltaSec,
    });
    expect(second.collision.brick).toBe(0);
    expect(bricks[0]?.alive).toBe(true);
    expect(bricks[0]?.hp).toBe(1);

    ball.pos = { x: 72, y: 72 };
    ball.vel = { x: 0, y: 120 };
    const third = stepPhysicsCore({
      ball,
      paddle: basePaddle(),
      bricks,
      config: baseConfig,
      deltaSec: baseConfig.fixedDeltaSec,
    });
    expect(third.collision.brick).toBe(1);
    expect(bricks[0]?.alive).toBe(false);
  });

  test("hazard brick emits hazard kind event on destroy", () => {
    const ball: Ball = {
      pos: { x: 72, y: 72 },
      vel: { x: 0, y: 120 },
      radius: 8,
      speed: 320,
    };
    const bricks: Brick[] = [
      { id: 1, x: 60, y: 64, width: 20, height: 10, alive: true, kind: "hazard", hp: 1 },
    ];

    const result = stepPhysicsCore({
      ball,
      paddle: basePaddle(),
      bricks,
      config: baseConfig,
      deltaSec: baseConfig.fixedDeltaSec,
    });

    expect(result.collision.brick).toBe(1);
    expect(result.events.some((event) => event.kind === "brick" && event.brickKind === "hazard")).toBe(true);
  });

  test("boss brick survives multiple hits and tracks hp", () => {
    const ball: Ball = {
      pos: { x: 72, y: 72 },
      vel: { x: 0, y: 120 },
      radius: 8,
      speed: 320,
    };
    const bricks: Brick[] = [
      { id: 1, x: 60, y: 64, width: 20, height: 10, alive: true, kind: "boss", hp: 12, maxHp: 12 },
    ];

    const first = stepPhysicsCore({
      ball,
      paddle: basePaddle(),
      bricks,
      config: baseConfig,
      deltaSec: baseConfig.fixedDeltaSec,
    });

    expect(first.collision.brick).toBe(0);
    expect(bricks[0]?.alive).toBe(true);
    expect(bricks[0]?.hp).toBe(11);
  });

  test("pierce does not apply multiple hits to boss in a single frame", () => {
    const ball: Ball = {
      pos: { x: 120, y: 88 },
      vel: { x: 0, y: -220 },
      radius: 8,
      speed: 320,
    };
    const bricks: Brick[] = [
      {
        id: 1,
        x: 48,
        y: 50,
        width: 144,
        height: 26,
        alive: true,
        kind: "boss",
        hp: 12,
        maxHp: 12,
      },
    ];

    const result = stepPhysicsCore({
      ball,
      paddle: basePaddle(),
      bricks,
      config: baseConfig,
      deltaSec: 0.2,
      stepConfig: {
        pierceDepth: 8,
        maxMove: 12,
        maxSubSteps: 24,
      },
    });

    expect(bricks[0]?.hp).toBe(11);
    expect(result.collision.brick).toBe(0);
  });

  test("contact latch skips damage while still touching same multi-HP target", () => {
    const ball: Ball = {
      pos: { x: 120, y: 70 },
      vel: { x: 0, y: 0 },
      radius: 8,
      speed: 320,
      lastDamageBrickId: 1,
    };
    const bricks: Brick[] = [
      {
        id: 1,
        x: 48,
        y: 50,
        width: 144,
        height: 26,
        alive: true,
        kind: "boss",
        hp: 12,
        maxHp: 12,
      },
    ];
    const stepInput = {
      paddle: basePaddle(),
      bricks,
      config: baseConfig,
      deltaSec: 0.2,
      stepConfig: {
        pierceDepth: 8,
        maxMove: 12,
        maxSubSteps: 24,
      },
    } as const;

    stepPhysicsCore({
      ...stepInput,
      ball,
    });
    expect(bricks[0]?.hp).toBe(12);
  });

  test("contact latch is cleared after detach and allows next hit", () => {
    const ball: Ball = {
      pos: { x: 24, y: 20 },
      vel: { x: 0, y: 0 },
      radius: 8,
      speed: 320,
      lastDamageBrickId: 1,
    };
    const bricks: Brick[] = [
      {
        id: 1,
        x: 48,
        y: 50,
        width: 144,
        height: 26,
        alive: true,
        kind: "boss",
        hp: 12,
        maxHp: 12,
      },
    ];
    const stepInput = {
      paddle: basePaddle(),
      bricks,
      config: baseConfig,
      deltaSec: 0.2,
      stepConfig: {
        pierceDepth: 8,
        maxMove: 12,
        maxSubSteps: 24,
      },
    } as const;

    stepPhysicsCore({
      ...stepInput,
      ball,
    });
    expect(ball.lastDamageBrickId).toBeUndefined();

    ball.pos = { x: 120, y: 88 };
    ball.vel = { x: 0, y: -220 };
    stepPhysicsCore({
      ...stepInput,
      ball,
    });
    expect(bricks[0]?.hp).toBe(11);
  });

  test("sticky capture holds the ball and auto-releases upward", () => {
    const ball: Ball = {
      pos: { x: 120, y: 154 },
      vel: { x: 0, y: 180 },
      radius: 6,
      speed: 320,
    };
    const paddle = basePaddle();

    stepPhysicsCore({
      ball,
      paddle,
      bricks: [],
      config: baseConfig,
      deltaSec: 1 / 60,
      stepConfig: {
        stickyEnabled: true,
        stickyHoldSec: 0.55,
        stickyRecaptureCooldownSec: 1.2,
      },
    });

    expect((ball.stickTimerSec ?? 0) > 0).toBe(true);
    expect(ball.vel.x).toBe(0);
    expect(ball.vel.y).toBe(0);
    expect(ball.pos.y).toBeCloseTo(paddle.y - ball.radius, 4);

    stepPhysicsCore({
      ball,
      paddle,
      bricks: [],
      config: baseConfig,
      deltaSec: 0.6,
      stepConfig: {
        stickyEnabled: true,
        stickyHoldSec: 0.55,
        stickyRecaptureCooldownSec: 1.2,
      },
    });

    expect((ball.stickTimerSec ?? 0) <= 0).toBe(true);
    expect(ball.vel.y).toBeLessThan(0);
    expect((ball.stickCooldownSec ?? 0) > 0).toBe(true);
  });

  test("homing assist bends ball velocity toward nearest brick", () => {
    const ball: Ball = {
      pos: { x: 40, y: 130 },
      vel: { x: 0, y: -160 },
      radius: 6,
      speed: 260,
    };
    const bricks: Brick[] = [
      { id: 1, x: 140, y: 40, width: 30, height: 10, alive: true, hp: 1 },
      { id: 2, x: 20, y: 40, width: 30, height: 10, alive: true, hp: 1 },
    ];

    stepPhysicsCore({
      ball,
      paddle: basePaddle(),
      bricks,
      config: baseConfig,
      deltaSec: 1 / 60,
      stepConfig: {
        homingStrength: 0.24,
      },
    });

    expect(Math.abs(ball.vel.x)).toBeGreaterThan(0);
  });

  test("flux field pulls descending balls inward and pushes ascending balls outward", () => {
    const paddle = basePaddle();
    const descending: Ball = {
      pos: { x: 170, y: 130 },
      vel: { x: 0, y: 120 },
      radius: 6,
      speed: 320,
    };
    const ascending: Ball = {
      pos: { x: 170, y: 130 },
      vel: { x: 0, y: -120 },
      radius: 6,
      speed: 320,
    };

    stepPhysicsCore({
      ball: descending,
      paddle,
      bricks: [],
      config: baseConfig,
      deltaSec: 1 / 60,
      stepConfig: {
        fluxField: true,
      },
    });
    stepPhysicsCore({
      ball: ascending,
      paddle,
      bricks: [],
      config: baseConfig,
      deltaSec: 1 / 60,
      stepConfig: {
        fluxField: true,
      },
    });

    expect(descending.vel.x).toBeLessThan(0);
    expect(ascending.vel.x).toBeGreaterThan(0);
  });

  test("warp zone teleports ball position", () => {
    const ball: Ball = {
      pos: { x: 40, y: 40 },
      vel: { x: 10, y: 10 },
      radius: 6,
      speed: 120,
    };

    stepPhysicsCore({
      ball,
      paddle: basePaddle(),
      bricks: [],
      config: baseConfig,
      deltaSec: 1 / 60,
      stepConfig: {
        warpZones: [
          {
            inXMin: 30,
            inXMax: 60,
            inYMin: 30,
            inYMax: 60,
            outX: 180,
            outY: 120,
          },
        ],
      },
    });

    expect(ball.pos.x).toBeGreaterThanOrEqual(180);
    expect(ball.pos.y).toBeGreaterThan(120);
    expect((ball.warpCooldownSec ?? 0) > 0).toBe(true);
  });
});
