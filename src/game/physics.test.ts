import { describe, expect, test } from "bun:test";

import { stepPhysics } from "./physics";
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

describe("stepPhysics", () => {
  test("left wall collision reflects ball and keeps life", () => {
    const ball: Ball = {
      pos: { x: 2, y: 90 },
      vel: { x: -120, y: -40 },
      radius: 4,
      speed: 320,
    };
    const paddle: Paddle = { x: 80, y: 160, width: 80, height: 14 };
    const bricks: Brick[] = [];

    const result = stepPhysics(ball, paddle, bricks, baseConfig, baseConfig.fixedDeltaSec);

    expect(result.livesLost).toBe(0);
    expect(ball.pos.x).toBeGreaterThanOrEqual(ball.radius);
    expect(ball.vel.x).toBeGreaterThan(0);
    expect(result.collision.wall).toBe(true);
    expect(result.events.some((event) => event.kind === "wall")).toBe(true);
  });

  test("paddle collision reflects upward and applies angle", () => {
    const ball: Ball = {
      pos: { x: 120, y: 150 },
      vel: { x: 20, y: 60 },
      radius: 8,
      speed: 320,
    };
    const paddle: Paddle = { x: 90, y: 140, width: 80, height: 14 };
    const bricks: Brick[] = [];

    const result = stepPhysics(ball, paddle, bricks, baseConfig, baseConfig.fixedDeltaSec);

    expect(result.livesLost).toBe(0);
    expect(result.collision.paddle).toBe(true);
    expect(ball.vel.y).toBeLessThan(0);
    expect(result.events.some((event) => event.kind === "paddle")).toBe(true);
  });

  test("brick collision removes one brick and increases score result", () => {
    const ball: Ball = {
      pos: { x: 40, y: 38 },
      vel: { x: 0, y: 60 },
      radius: 8,
      speed: 320,
    };
    const paddle: Paddle = { x: 80, y: 160, width: 80, height: 14 };
    const bricks: Brick[] = [
      {
        id: 1,
        x: 20,
        y: 30,
        width: 120,
        height: 16,
        alive: true,
      },
    ];

    const result = stepPhysics(ball, paddle, bricks, baseConfig, baseConfig.fixedDeltaSec);

    expect(result.collision.brick).toBe(1);
    expect(result.scoreGain).toBe(100);
    expect(result.collision.wall).toBe(false);
    expect(result.livesLost).toBe(0);
    expect(bricks[0].alive).toBe(false);
    expect(result.events.some((event) => event.kind === "brick")).toBe(true);
  });

  test("falling below bottom loses one life and does not score/brick", () => {
    const ball: Ball = {
      pos: { x: 230, y: 175 },
      vel: { x: 0, y: 80 },
      radius: 5,
      speed: 320,
    };
    const paddle: Paddle = { x: 80, y: 160, width: 80, height: 14 };
    const bricks: Brick[] = [
      {
        id: 2,
        x: 20,
        y: 30,
        width: 120,
        height: 16,
        alive: true,
      },
    ];

    const result = stepPhysics(ball, paddle, bricks, baseConfig, 1 / 5);

    expect(result.livesLost).toBe(1);
    expect(result.collision.brick).toBe(0);
    expect(result.scoreGain).toBe(0);
    expect(result.events.some((event) => event.kind === "miss")).toBe(true);
  });

  test("clear becomes true when all bricks destroyed", () => {
    const config: GameConfig = { ...baseConfig, fixedDeltaSec: 1 / 60 };
    const ball: Ball = {
      pos: { x: 40, y: 38 },
      vel: { x: 0, y: 80 },
      radius: 8,
      speed: 320,
    };
    const paddle: Paddle = { x: 80, y: 140, width: 80, height: 14 };
    const bricks: Brick[] = [
      {
        id: 1,
        x: 30,
        y: 30,
        width: 20,
        height: 10,
        alive: true,
      },
    ];

    const result = stepPhysics(ball, paddle, bricks, config, config.fixedDeltaSec);

    expect(result.collision.brick).toBe(1);
    expect(result.scoreGain).toBe(100);
    expect(result.cleared).toBe(true);
    expect(result.events.some((event) => event.kind === "brick")).toBe(true);
  });

  test("maxBallSpeed override clamps speed during update", () => {
    const config: GameConfig = { ...baseConfig, fixedDeltaSec: 1 / 60 };
    const ball: Ball = {
      pos: { x: 120, y: 130 },
      vel: { x: 320, y: 280 },
      radius: 8,
      speed: 320,
    };
    const paddle: Paddle = { x: 80, y: 150, width: 80, height: 14 };
    const bricks: Brick[] = [];

    stepPhysics(ball, paddle, bricks, config, config.fixedDeltaSec, { maxBallSpeed: 260 });
    const speed = Math.hypot(ball.vel.x, ball.vel.y);
    expect(speed).toBeLessThanOrEqual(260.0001);
  });

  test("collision at paddle edge still reflects upward", () => {
    const ball: Ball = {
      pos: { x: 92, y: 149.5 },
      vel: { x: -20, y: 75 },
      radius: 8,
      speed: 320,
    };
    const paddle: Paddle = { x: 90, y: 140, width: 80, height: 14 };
    const bricks: Brick[] = [];

    const result = stepPhysics(ball, paddle, bricks, baseConfig, baseConfig.fixedDeltaSec);

    expect(result.collision.paddle).toBe(true);
    expect(ball.vel.y).toBeLessThan(0);
  });

  test("onMiss handler can rescue ball without losing life", () => {
    const ball: Ball = {
      pos: { x: 120, y: 178 },
      vel: { x: 30, y: 140 },
      radius: 6,
      speed: 320,
    };
    const paddle: Paddle = { x: 60, y: 155, width: 90, height: 14 };
    const bricks: Brick[] = [];
    const rescued: { value: boolean } = { value: false };

    const result = stepPhysics(ball, paddle, bricks, baseConfig, 1 / 8, {
      onMiss: (target) => {
        rescued.value = true;
        target.pos.y = baseConfig.height - target.radius - 10;
        target.vel.y = -Math.abs(target.vel.y);
        return true;
      },
    });

    expect(rescued.value).toBe(true);
    expect(result.livesLost).toBe(0);
    expect(result.events.some((event) => event.kind === "wall")).toBe(true);
    expect(ball.vel.y).toBeLessThan(0);
  });
});
