import { describe, expect, test } from "bun:test";

import {
  applyItemPickup,
  canUseShield,
  clearActiveItemEffects,
  cloneActiveItemState,
  consumeShield,
  createItemState,
  ensureMultiballCount,
  getActiveItemLabels,
  getBombRadiusTiles,
  getPaddleScale,
  getPierceDepth,
  getSlowBallMaxSpeedScale,
  getTargetBallCount,
  spawnDropsFromBrickEvents,
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
  test("stacking increases power without overwrite", () => {
    const items = createItemState();

    applyItemPickup(items, "paddle_plus", [createBall()]);
    applyItemPickup(items, "paddle_plus", [createBall()]);
    applyItemPickup(items, "pierce", [createBall()]);
    applyItemPickup(items, "bomb", [createBall()]);
    applyItemPickup(items, "bomb", [createBall()]);

    expect(items.active.paddlePlusStacks).toBe(2);
    expect(getPaddleScale(items)).toBeCloseTo(1.36, 5);
    expect(getPierceDepth(items)).toBe(4);
    expect(getBombRadiusTiles(items)).toBe(1);
    expect(items.active.bombStacks).toBe(1);
  });

  test("slow_ball applies instant velocity reduction and scaled max-speed", () => {
    const items = createItemState();
    const balls = [createBall()];

    const before = Math.hypot(balls[0].vel.x, balls[0].vel.y);
    applyItemPickup(items, "slow_ball", balls);
    applyItemPickup(items, "slow_ball", balls);
    const after = Math.hypot(balls[0].vel.x, balls[0].vel.y);

    expect(after).toBeLessThan(before);
    expect(getSlowBallMaxSpeedScale(items)).toBeLessThan(1);
  });

  test("multiball stacks respect configured max-ball cap", () => {
    const items = createItemState();
    applyItemPickup(items, "multiball", [createBall()]);
    applyItemPickup(items, "multiball", [createBall()]);
    applyItemPickup(items, "multiball", [createBall()]);
    applyItemPickup(items, "multiball", [createBall()]);
    applyItemPickup(items, "multiball", [createBall()]);

    expect(getTargetBallCount(items, 4)).toBe(4);
    expect(getTargetBallCount(items, 6)).toBe(6);

    const expanded = ensureMultiballCount(items, [createBall()], sequenceRandom([0.4, 0.6, 0.2]), 4);
    expect(expanded).toHaveLength(4);

    const trimmed = ensureMultiballCount(items, [...expanded, createBall()], sequenceRandom([0.5]), 4);
    expect(trimmed).toHaveLength(4);
  });

  test("shield accumulates charges and consumes one by one", () => {
    const items = createItemState();
    applyItemPickup(items, "shield", [createBall()]);
    applyItemPickup(items, "shield", [createBall()]);

    expect(canUseShield(items)).toBe(true);
    expect(consumeShield(items)).toBe(true);
    expect(items.active.shieldCharges).toBe(1);
    expect(consumeShield(items)).toBe(true);
    expect(canUseShield(items)).toBe(false);
  });

  test("spawnDrops includes new item types with weighted picker", () => {
    const items = createItemState();
    const events: CollisionEvent[] = Array.from({ length: 6 }, (_, idx) => ({
      kind: "brick",
      x: 100 + idx,
      y: 90,
    }));

    spawnDropsFromBrickEvents(items, events, sequenceRandom([0.1, 0.85, 0.1, 0.95, 0.1, 0.99]));
    expect(items.falling.length).toBeGreaterThan(0);

    // 2番目=0.85 は pierce/bomb 帯域に入る
    const hasAdvanced = items.falling.some((drop) => drop.type === "pierce" || drop.type === "bomb");
    expect(hasAdvanced).toBe(true);
  });

  test("bomb does not drop while bomb effect is active", () => {
    const items = createItemState();
    items.active.bombStacks = 1;
    const events: CollisionEvent[] = Array.from({ length: 20 }, () => ({
      kind: "brick",
      x: 110,
      y: 90,
    }));

    spawnDropsFromBrickEvents(items, events, sequenceRandom(Array(40).fill(0.02)));
    expect(items.falling.every((drop) => drop.type !== "bomb")).toBe(true);
  });

  test("updateFallingItems returns picked item payload", () => {
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
        type: "bomb",
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

  test("active labels are stack-based", () => {
    const items = createItemState();
    applyItemPickup(items, "multiball", [createBall()]);
    applyItemPickup(items, "pierce", [createBall()]);
    applyItemPickup(items, "pierce", [createBall()]);

    const labels = getActiveItemLabels(items);
    expect(labels.some((label) => label.includes("マルチ x1"))).toBe(true);
    expect(labels.some((label) => label.includes("貫通 x2"))).toBe(true);
  });

  test("clearActiveItemEffects resets all active stacks", () => {
    const items = createItemState();
    applyItemPickup(items, "multiball", [createBall()]);
    applyItemPickup(items, "shield", [createBall()]);
    applyItemPickup(items, "pierce", [createBall()]);

    clearActiveItemEffects(items);

    expect(items.active.multiballStacks).toBe(0);
    expect(items.active.shieldCharges).toBe(0);
    expect(items.active.pierceStacks).toBe(0);
  });

  test("cloneActiveItemState returns detached copy", () => {
    const items = createItemState();
    items.active.multiballStacks = 2;
    items.active.shieldCharges = 1;

    const copied = cloneActiveItemState(items.active);
    copied.multiballStacks = 4;
    copied.shieldCharges = 0;

    expect(items.active.multiballStacks).toBe(2);
    expect(items.active.shieldCharges).toBe(1);
  });
});
