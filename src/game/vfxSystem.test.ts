import { describe, expect, test } from "bun:test";

import type { CollisionEvent, RandomSource } from "./types";
import {
  applyCollisionEvents,
  computeParticleSpawnCount,
  createVfxState,
  nextDensityScale,
  spawnItemPickupFeedback,
  triggerHitFreeze,
  updateVfxState,
} from "./vfxSystem";

const deterministicRandom: RandomSource = {
  next: () => 0.5,
};

describe("vfxSystem helpers", () => {
  test("nextDensityScale drops during low FPS and recovers otherwise", () => {
    expect(nextDensityScale(1, 0.05, "playing")).toBeLessThan(1);
    expect(nextDensityScale(0.46, 0.08, "playing")).toBeGreaterThanOrEqual(0.45);
    expect(nextDensityScale(0.6, 1 / 120, "playing")).toBeGreaterThan(0.6);
    expect(nextDensityScale(0.6, 1 / 120, "paused")).toBe(0.6);
  });

  test("computeParticleSpawnCount respects reduced motion", () => {
    expect(computeParticleSpawnCount(14, 1, false)).toBe(14);
    expect(computeParticleSpawnCount(14, 1, true)).toBe(7);
    expect(computeParticleSpawnCount(14, 0.5, false)).toBe(7);
    expect(computeParticleSpawnCount(1, 0.1, true)).toBe(1);
  });
});

describe("applyCollisionEvents", () => {
  test("spawns particles and updates flash/shake for miss", () => {
    const vfx = createVfxState(false);
    const events: CollisionEvent[] = [{ kind: "miss", x: 10, y: 20 }];

    applyCollisionEvents(vfx, events, deterministicRandom);

    expect(vfx.particles.length).toBeGreaterThan(0);
    expect(vfx.flashMs).toBeGreaterThan(0);
    expect(vfx.shakeMs).toBeGreaterThan(0);
    expect(vfx.shakePx).toBeGreaterThan(0);
  });

  test("spawns impact ring and hit freeze on brick", () => {
    const vfx = createVfxState(false);
    applyCollisionEvents(vfx, [{ kind: "brick", x: 25, y: 40 }], deterministicRandom);

    expect(vfx.impactRings.length).toBeGreaterThan(0);
    expect(vfx.hitFreezeMs).toBeGreaterThan(0);
  });
});

describe("new feedback effects", () => {
  test("triggerHitFreeze is disabled with reduced motion", () => {
    const normal = createVfxState(false);
    const reduced = createVfxState(true);
    triggerHitFreeze(normal, 20);
    triggerHitFreeze(reduced, 20);

    expect(normal.hitFreezeMs).toBe(20);
    expect(reduced.hitFreezeMs).toBe(0);
  });

  test("spawnItemPickupFeedback adds floating text and impact ring", () => {
    const vfx = createVfxState(false);
    spawnItemPickupFeedback(vfx, "shield", 90, 160);

    expect(vfx.floatingTexts).toHaveLength(1);
    expect(vfx.floatingTexts[0]?.text).toContain("シールド");
    expect(vfx.impactRings).toHaveLength(1);
  });

  test("updateVfxState decays freeze and then updates effects", () => {
    const vfx = createVfxState(false);
    triggerHitFreeze(vfx, 20);
    spawnItemPickupFeedback(vfx, "paddle_plus", 120, 200);
    const beforeY = vfx.floatingTexts[0]?.pos.y ?? 0;

    updateVfxState(vfx, 1 / 120, deterministicRandom);
    expect(vfx.hitFreezeMs).toBeGreaterThan(0);
    expect(vfx.floatingTexts[0]?.pos.y).toBe(beforeY);

    updateVfxState(vfx, 0.1, deterministicRandom);
    expect(vfx.hitFreezeMs).toBe(0);
    expect((vfx.floatingTexts[0]?.pos.y ?? 999) < beforeY).toBe(true);
  });
});
