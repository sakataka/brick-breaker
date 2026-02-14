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

  test("pierceDepth destroys multiple bricks in one trajectory", () => {
    const config: GameConfig = { ...baseConfig, fixedDeltaSec: 1 / 60 };
    const ball: Ball = {
      pos: { x: 42, y: 92 },
      vel: { x: 0, y: -140 },
      radius: 7,
      speed: 320,
    };
    const paddle: Paddle = { x: 80, y: 160, width: 80, height: 14 };
    const bricks: Brick[] = [
      { id: 1, x: 30, y: 70, width: 24, height: 10, alive: true, row: 2, col: 1 },
      { id: 2, x: 30, y: 56, width: 24, height: 10, alive: true, row: 1, col: 1 },
      { id: 3, x: 30, y: 42, width: 24, height: 10, alive: true, row: 0, col: 1 },
    ];

    const result = stepPhysics(ball, paddle, bricks, config, 0.2, {
      pierceDepth: 4,
      maxMove: 12,
      maxSubSteps: 24,
    });

    expect(result.collision.brick).toBeGreaterThanOrEqual(2);
    expect(result.scoreGain).toBeGreaterThanOrEqual(200);
  });

  test("bombRadiusTiles destroys area in 3x3 range", () => {
    const config: GameConfig = { ...baseConfig, fixedDeltaSec: 1 / 60 };
    const ball: Ball = {
      pos: { x: 72, y: 72 },
      vel: { x: 0, y: -80 },
      radius: 8,
      speed: 320,
    };
    const paddle: Paddle = { x: 80, y: 160, width: 80, height: 14 };
    const bricks: Brick[] = [
      { id: 1, x: 60, y: 64, width: 20, height: 10, alive: true, row: 1, col: 1 },
      { id: 2, x: 84, y: 64, width: 20, height: 10, alive: true, row: 1, col: 2 },
      { id: 3, x: 36, y: 64, width: 20, height: 10, alive: true, row: 1, col: 0 },
      { id: 4, x: 60, y: 50, width: 20, height: 10, alive: true, row: 0, col: 1 },
      { id: 5, x: 60, y: 78, width: 20, height: 10, alive: true, row: 2, col: 1 },
      { id: 6, x: 132, y: 64, width: 20, height: 10, alive: true, row: 1, col: 4 },
    ];

    const result = stepPhysics(ball, paddle, bricks, config, config.fixedDeltaSec, {
      bombRadiusTiles: 1,
      explodeOnHit: true,
    });

    expect(result.collision.brick).toBeGreaterThanOrEqual(4);
    expect(bricks[5]?.alive).toBe(true);
  });

  test("pierce and bomb can be active simultaneously", () => {
    const config: GameConfig = { ...baseConfig, fixedDeltaSec: 1 / 60 };
    const ball: Ball = {
      pos: { x: 72, y: 96 },
      vel: { x: 0, y: -180 },
      radius: 8,
      speed: 320,
    };
    const paddle: Paddle = { x: 80, y: 160, width: 80, height: 14 };
    const bricks: Brick[] = [
      { id: 1, x: 60, y: 82, width: 20, height: 10, alive: true, row: 2, col: 1 },
      { id: 2, x: 60, y: 68, width: 20, height: 10, alive: true, row: 1, col: 1 },
      { id: 3, x: 60, y: 54, width: 20, height: 10, alive: true, row: 0, col: 1 },
      { id: 4, x: 84, y: 68, width: 20, height: 10, alive: true, row: 1, col: 2 },
    ];

    const result = stepPhysics(ball, paddle, bricks, config, 0.18, {
      pierceDepth: 4,
      bombRadiusTiles: 1,
      explodeOnHit: true,
      maxMove: 12,
      maxSubSteps: 32,
    });

    expect(result.collision.brick).toBeGreaterThanOrEqual(3);
    expect(result.events.filter((event) => event.kind === "brick").length).toBe(result.collision.brick);
  });

  test("bomb does not chain recursively from exploded bricks", () => {
    const config: GameConfig = { ...baseConfig, fixedDeltaSec: 1 / 60 };
    const ball: Ball = {
      pos: { x: 72, y: 72 },
      vel: { x: 0, y: -120 },
      radius: 8,
      speed: 320,
    };
    const paddle: Paddle = { x: 80, y: 160, width: 80, height: 14 };
    const bricks: Brick[] = [
      { id: 1, x: 60, y: 64, width: 20, height: 10, alive: true, row: 1, col: 1 },
      { id: 2, x: 84, y: 64, width: 20, height: 10, alive: true, row: 1, col: 2 },
      { id: 3, x: 108, y: 64, width: 20, height: 10, alive: true, row: 1, col: 3 },
      { id: 4, x: 132, y: 64, width: 20, height: 10, alive: true, row: 1, col: 4 },
    ];

    const result = stepPhysics(ball, paddle, bricks, config, config.fixedDeltaSec, {
      bombRadiusTiles: 1,
      explodeOnHit: true,
    });

    // 連鎖がないため、1段先（col:4）は残る
    expect(result.collision.brick).toBeLessThan(4);
    expect(bricks[3]?.alive).toBe(true);
  });
});
