import { describe, expect, test } from "bun:test";

import { BRICK_LAYOUT, STAGE_CATALOG } from "./config";
import { buildBricksFromStage } from "./level";

describe("stage catalog", () => {
  test("contains 12 valid stage definitions", () => {
    expect(STAGE_CATALOG).toHaveLength(12);
    const ids = new Set<number>();

    for (const stage of STAGE_CATALOG) {
      ids.add(stage.id);
      expect(stage.layout).toHaveLength(6);
      for (const row of stage.layout) {
        expect(row).toHaveLength(10);
      }
      expect(stage.speedScale).toBeGreaterThanOrEqual(1);
      expect(stage.speedScale).toBeLessThanOrEqual(1.18);
    }

    expect(ids.size).toBe(12);
  });

  test("buildBricksFromStage creates bricks from layout cells", () => {
    const stage = STAGE_CATALOG[0];
    const expectedCount = stage.layout.flat().filter((cell) => cell === 1).length;
    const bricks = buildBricksFromStage(stage);

    expect(bricks).toHaveLength(expectedCount);
    for (const brick of bricks) {
      expect(brick.width).toBeGreaterThan(0);
      expect(brick.height).toBe(BRICK_LAYOUT.brickHeight);
      expect(brick.alive).toBe(true);
    }
  });
});
