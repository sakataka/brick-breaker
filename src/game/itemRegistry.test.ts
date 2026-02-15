import { describe, expect, test } from "bun:test";

import {
  createItemModifiers,
  createItemStacks,
  getDropSuppressedTypes,
  getItemEmoji,
  getItemPickupSfxEvent,
  ITEM_REGISTRY,
  pickWeightedItemType,
  validateItemRegistry,
} from "./itemRegistry";

describe("itemRegistry", () => {
  test("includes all item definitions with valid weights", () => {
    const result = validateItemRegistry();
    expect(result.valid).toBe(true);
    expect(Object.keys(ITEM_REGISTRY)).toHaveLength(8);
  });

  test("detects invalid definition shape", () => {
    const result = validateItemRegistry({
      ...ITEM_REGISTRY,
      bomb: {
        ...ITEM_REGISTRY.bomb,
        type: "shield",
        weight: -1,
      },
    });
    expect(result.valid).toBe(false);
    expect(result.issues.length).toBeGreaterThan(0);
  });

  test("creates consistent modifier bundle from stacks", () => {
    const stacks = createItemStacks();
    stacks.paddlePlusStacks = 2;
    stacks.slowBallStacks = 5;
    stacks.multiballStacks = 4;
    stacks.shieldCharges = 3;
    stacks.pierceStacks = 2;
    stacks.bombStacks = 1;
    stacks.laserStacks = 3;
    stacks.stickyStacks = 1;

    const modifiers = createItemModifiers(stacks, 5);
    expect(modifiers.paddleScale).toBeGreaterThan(1);
    expect(modifiers.maxSpeedScale).toBeGreaterThanOrEqual(0.35);
    expect(modifiers.targetBallCount).toBe(5);
    expect(modifiers.shieldCharges).toBe(3);
    expect(modifiers.pierceDepth).toBe(5);
    expect(modifiers.bombRadiusTiles).toBe(1);
    expect(modifiers.explodeOnHit).toBe(true);
    expect(modifiers.laserLevel).toBe(2);
    expect(modifiers.stickyEnabled).toBe(true);
  });

  test("pierce + slow_ball synergy adds extra pierce depth", () => {
    const stacks = createItemStacks();
    stacks.pierceStacks = 1;
    stacks.slowBallStacks = 1;

    const modifiers = createItemModifiers(stacks, 4);

    expect(modifiers.pierceDepth).toBe(5);
  });

  test("pickWeightedItemType excludes requested item types", () => {
    const random = { next: () => 0.999 };
    const picked = pickWeightedItemType(random, ["bomb"]);
    expect(picked).not.toBe("bomb");
  });

  test("drop suppression and sfx mapping are driven by registry definitions", () => {
    const stacks = createItemStacks();
    stacks.bombStacks = 1;
    stacks.pierceStacks = 1;

    const suppressed = getDropSuppressedTypes(stacks);
    expect(suppressed).toEqual(["pierce", "bomb"]);
    expect(getItemPickupSfxEvent("shield")).toBe("item_shield");
  });

  test("all item definitions expose emoji labels", () => {
    const emojis = Object.values(ITEM_REGISTRY).map((item) => item.emoji);
    expect(emojis.every((emoji) => emoji.length > 0)).toBe(true);
    expect(getItemEmoji("bomb")).toBe("💣");
  });
});
