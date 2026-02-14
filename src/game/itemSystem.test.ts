import { describe, expect, test } from "bun:test";

import {
  applyItemPickup,
  canUseShield,
  consumeShield,
  createItemState,
  ensureMultiballCount,
  getPaddleScale,
  getSlowBallMaxSpeedScale,
  spawnDropsFromBrickEvents,
  trimBallsWhenMultiballEnds,
  updateFallingItems,
} from "./itemSystem";
import type { Ball, CollisionEvent, Paddle, RandomSource } from "./types";

function sequenceRandom(values: number[]): RandomSource {
  let index = 0;
  return {
    next: () => {
      const value = values[index] ?? values[values.length - 1] ?? 0.5;
      index += 1;
      return value;
    },
  };
}

function createBall(): Ball {
  return {
    pos: { x: 100, y: 120 },
    vel: { x: 120, y: -200 },
    radius: 8,
    speed: 260,
  };
}

describe("itemSystem", () => {
  test("paddle_plus stacking extends only duration", () => {
    const items = createItemState();
    const balls = [createBall()];

    applyItemPickup(items, "paddle_plus", 10, balls);
    const firstUntil = items.active.paddlePlus.untilSec;
    applyItemPickup(items, "paddle_plus", 11, balls);

    expect(firstUntil).toBe(22);
    expect(items.active.paddlePlus.untilSec).toBe(31);
    expect(getPaddleScale(items, 12)).toBeGreaterThan(1);
  });

  test("slow_ball applies instant velocity reduction and max-speed scale", () => {
    const items = createItemState();
    const balls = [createBall()];

    const before = Math.hypot(balls[0].vel.x, balls[0].vel.y);
    applyItemPickup(items, "slow_ball", 5, balls);
    const after = Math.hypot(balls[0].vel.x, balls[0].vel.y);

    expect(after).toBeLessThan(before);
    expect(getSlowBallMaxSpeedScale(items, 5.2)).toBeLessThan(1);
  });

  test("multiball keeps max two balls and trims when expired", () => {
    const items = createItemState();
    applyItemPickup(items, "multiball", 2, [createBall()]);

    const expanded = ensureMultiballCount(items, 2.1, [createBall()], sequenceRandom([0.4]));
    expect(expanded).toHaveLength(2);

    const trimmed = trimBallsWhenMultiballEnds(items, 40, expanded);
    expect(trimmed).toHaveLength(1);
  });

  test("shield can be consumed only once", () => {
    const items = createItemState();
    applyItemPickup(items, "shield", 1, [createBall()]);

    expect(canUseShield(items, 1.2)).toBe(true);
    expect(consumeShield(items, 1.2)).toBe(true);
    expect(canUseShield(items, 1.3)).toBe(false);
    expect(consumeShield(items, 1.3)).toBe(false);
  });

  test("spawnDrops respects chance and max count", () => {
    const items = createItemState();
    const events: CollisionEvent[] = Array.from({ length: 5 }, (_, idx) => ({
      kind: "brick",
      x: 120 + idx,
      y: 80,
    }));

    // drop判定0.1で生成、種類抽選0.2。2件目は0.7で生成されない。
    spawnDropsFromBrickEvents(
      items,
      events,
      sequenceRandom([0.1, 0.2, 0.7, 0.2, 0.1, 0.9, 0.1, 0.3, 0.1, 0.4]),
    );

    expect(items.falling.length).toBeGreaterThan(0);
    expect(items.falling.length).toBeLessThanOrEqual(3);
  });

  test("updateFallingItems collects on paddle and removes out-of-screen", () => {
    const items = createItemState();
    items.falling.push(
      {
        id: 1,
        type: "paddle_plus",
        pos: { x: 120, y: 100 },
        speed: 0,
        size: 16,
      },
      {
        id: 2,
        type: "slow_ball",
        pos: { x: 60, y: 600 },
        speed: 0,
        size: 16,
      },
    );

    const paddle: Paddle = { x: 90, y: 95, width: 80, height: 20 };
    const picked = updateFallingItems(items, paddle, 540, 1 / 60);

    expect(picked).toHaveLength(1);
    expect(picked[0]?.type).toBe("paddle_plus");
    expect(items.falling).toHaveLength(0);
  });
});
