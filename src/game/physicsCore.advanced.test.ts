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

describe("physicsCore advanced", () => {
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
