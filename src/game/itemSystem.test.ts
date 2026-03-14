import { describe, expect, test } from "vite-plus/test";
import { ITEM_ORDER } from "./itemRegistry";

import {
  applyItemPickup,
  canUseShield,
  clearActiveItemEffects,
  cloneActiveItemState,
  consumeShield,
  createItemState,
  ensureMultiballCount,
  getActiveItemEntries,
  getBombRadiusTiles,
  getLaserLevel,
  getPaddleScale,
  getPierceDepth,
  getSlowBallMaxSpeedScale,
  getTargetBallCount,
  spawnDropsFromBrickEvents,
  spawnGuaranteedDrop,
  updateFallingItems,
} from "./itemSystem";
import type { Ball, CollisionEvent, Paddle, RandomSource } from "./types";
import { createVfxState } from "./vfxSystem";

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
    applyItemPickup(items, "pierce", [createBall()]);
    applyItemPickup(items, "bomb", [createBall()]);
    applyItemPickup(items, "bomb", [createBall()]);

    expect(items.active.paddlePlusStacks).toBe(2);
    expect(getPaddleScale(items)).toBeCloseTo(1.36, 5);
    expect(getPierceDepth(items)).toBe(4);
    expect(getBombRadiusTiles(items)).toBe(1);
    expect(items.active.pierceStacks).toBe(1);
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

    const expanded = ensureMultiballCount(
      items,
      [createBall()],
      sequenceRandom([0.4, 0.6, 0.2]),
      4,
    );
    expect(expanded).toHaveLength(4);

    const trimmed = ensureMultiballCount(
      items,
      [...expanded, createBall()],
      sequenceRandom([0.5]),
      4,
    );
    expect(trimmed).toHaveLength(4);
  });

  test("newly spawned multiballs clear contact latch state", () => {
    const items = createItemState();
    items.active.multiballStacks = 2;
    const sourceBall: Ball = {
      ...createBall(),
      lastDamageBrickId: 99,
    };

    const expanded = ensureMultiballCount(items, [sourceBall], sequenceRandom([0.5, 0.5]), 4);

    expect(expanded).toHaveLength(3);
    expect(expanded[1]?.lastDamageBrickId).toBeUndefined();
    expect(expanded[2]?.lastDamageBrickId).toBeUndefined();
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

  test("spawnGuaranteedDrop can pick extended attack item types", () => {
    const items = createItemState();
    const random = sequenceRandom([0.65, 0.82, 0.9]);
    spawnGuaranteedDrop(items, random, 100, 90);
    spawnGuaranteedDrop(items, random, 110, 90);
    spawnGuaranteedDrop(items, random, 120, 90);

    expect(items.falling).toHaveLength(2);
    expect(items.falling.map((drop) => drop.type)).toEqual(["pulse", "laser"]);
  });

  test("spawnGuaranteedDrop always enqueues one drop when space is available", () => {
    const items = createItemState();

    const created = spawnGuaranteedDrop(items, sequenceRandom([0.3]), 120, 80);

    expect(created).toBe(true);
    expect(items.falling).toHaveLength(1);
    expect(items.falling[0]?.pos).toEqual({ x: 120, y: 80 });
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

  test("pierce does not drop while pierce is active", () => {
    const items = createItemState();
    items.active.pierceStacks = 1;
    const events: CollisionEvent[] = Array.from({ length: 20 }, () => ({
      kind: "brick",
      x: 110,
      y: 90,
    }));

    spawnDropsFromBrickEvents(items, events, sequenceRandom(Array(40).fill(0.02)));
    expect(items.falling.every((drop) => drop.type !== "pierce")).toBe(true);
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

  test("active item entries are always listed with stack counts", () => {
    const items = createItemState();
    applyItemPickup(items, "multiball", [createBall()]);
    applyItemPickup(items, "pierce", [createBall()]);
    applyItemPickup(items, "pierce", [createBall()]);
    applyItemPickup(items, "laser", [createBall()]);
    applyItemPickup(items, "homing", [createBall()]);
    applyItemPickup(items, "rail", [createBall()]);

    const labels = getActiveItemEntries(items);
    expect(labels).toHaveLength(11);
    expect(labels.find((label) => label.type === "multiball")?.count).toBe(1);
    expect(labels.find((label) => label.type === "pierce")?.count).toBe(1);
    expect(labels.find((label) => label.type === "bomb")?.count).toBe(0);
    expect(labels.find((label) => label.type === "laser")?.count).toBe(1);
    expect(labels.find((label) => label.type === "homing")?.count).toBe(1);
    expect(labels.find((label) => label.type === "rail")?.count).toBe(1);
  });

  test("normal brick drops are capped to one per tick while guaranteed drops stay available", () => {
    const items = createItemState();
    const events: CollisionEvent[] = Array.from({ length: 4 }, () => ({
      kind: "brick",
      x: 110,
      y: 90,
    }));

    spawnDropsFromBrickEvents(items, events, sequenceRandom(Array(12).fill(0.01)));
    expect(items.falling).toHaveLength(1);

    const guaranteed = spawnGuaranteedDrop(items, sequenceRandom([0.99]), 140, 90);
    expect(guaranteed).toBe(true);
    expect(items.falling).toHaveLength(2);
  });

  test("shockwave pickup damages nearby normal bricks when gameplay state is provided", () => {
    const items = createItemState();
    const balls = [createBall()];
    const bricks = [
      {
        id: 1,
        x: 90,
        y: 90,
        width: 24,
        height: 12,
        alive: true,
        kind: "normal" as const,
        hp: 1,
        maxHp: 1,
      },
      {
        id: 2,
        x: 210,
        y: 90,
        width: 24,
        height: 12,
        alive: true,
        kind: "normal" as const,
        hp: 1,
        maxHp: 1,
      },
    ];

    const impact = applyItemPickup(items, "shockwave", balls, {
      gameState: {
        bricks,
        vfx: createVfxState(true),
      },
      scorePerBrick: 100,
    });

    expect(impact.collisionEvents?.length).toBe(1);
    expect(impact.scoreGain).toBe(100);
    expect(bricks[0]?.alive).toBe(false);
    expect(bricks[1]?.alive).toBe(true);
  });

  test("laser stacks respect their caps", () => {
    const items = createItemState();
    applyItemPickup(items, "laser", [createBall()]);
    applyItemPickup(items, "laser", [createBall()]);
    applyItemPickup(items, "laser", [createBall()]);

    expect(items.active.laserStacks).toBe(2);
    expect(getLaserLevel(items)).toBe(2);
  });

  test("new item stacking can be disabled per pickup option", () => {
    const items = createItemState();
    applyItemPickup(items, "laser", [createBall()], { enableNewItemStacks: false });
    applyItemPickup(items, "laser", [createBall()], { enableNewItemStacks: false });

    expect(items.active.laserStacks).toBe(1);
    expect(getLaserLevel(items)).toBe(1);
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

  test("disabled item pools exclude removed items from drops", () => {
    const items = createItemState();
    const events: CollisionEvent[] = Array.from({ length: 20 }, () => ({
      kind: "brick",
      x: 120,
      y: 90,
    }));
    const enabled = ITEM_ORDER.filter((type) => type !== "pulse");

    spawnDropsFromBrickEvents(items, events, sequenceRandom(Array(40).fill(0.99)), {
      enabledItems: enabled,
    });
    expect(items.falling.every((drop) => drop.type !== "pulse")).toBe(true);
  });
});
