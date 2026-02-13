import { describe, expect, test } from "bun:test";

import type { CollisionEvent, RandomSource } from "./types";
import {
  applyCollisionEvents,
  computeParticleSpawnCount,
  createVfxState,
  nextDensityScale,
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
});
