import { describe, expect, test } from "vite-plus/test";

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
      if (stage.id >= 9) {
        expect((stage.elite ?? []).length).toBeGreaterThan(0);
      }
    }

    expect(ids.size).toBe(12);
  });

  test("buildBricksFromStage creates bricks from layout cells", () => {
    const stage = STAGE_CATALOG[0];
    const expectedCount =
      stage.layout.flat().filter((cell) => cell === 1).length + (stage.specials?.length ?? 0);
    const bricks = buildBricksFromStage(stage);

    expect(bricks).toHaveLength(expectedCount);
    for (const brick of bricks) {
      expect(brick.width).toBeGreaterThan(0);
      expect(brick.height).toBe(BRICK_LAYOUT.brickHeight);
      expect(brick.alive).toBe(true);
      expect(brick.hp).toBeGreaterThanOrEqual(1);
    }
  });

  test("buildBricksFromStage applies elite kind and hp", () => {
    const stage = STAGE_CATALOG[8];
    const bricks = buildBricksFromStage(stage);
    const eliteBricks = bricks.filter((brick) => brick.kind && brick.kind !== "normal");

    expect(eliteBricks.length).toBeGreaterThan(0);
    for (const brick of eliteBricks) {
      if (brick.kind === "durable" || brick.kind === "armored" || brick.kind === "regen") {
        expect(brick.hp).toBe(2);
      } else if (brick.kind === "hazard" || brick.kind === "split" || brick.kind === "summon") {
        expect(brick.hp).toBe(1);
      } else {
        expect(brick.hp).toBeGreaterThanOrEqual(1);
      }
    }
    const regenBricks = eliteBricks.filter((brick) => brick.kind === "regen");
    expect(regenBricks.length).toBeGreaterThan(0);
    for (const brick of regenBricks) {
      expect(brick.regenCharges).toBe(1);
    }
    const hazardBricks = eliteBricks.filter((brick) => brick.kind === "hazard");
    expect(hazardBricks.length).toBeGreaterThan(0);
    for (const brick of hazardBricks) {
      expect(brick.hp).toBe(1);
    }
  });

  test("buildBricksFromStage injects steel and generator specials", () => {
    const stage = STAGE_CATALOG[7];
    const bricks = buildBricksFromStage(stage);

    expect(bricks.some((brick) => brick.kind === "steel")).toBe(true);
    expect(bricks.some((brick) => brick.kind === "generator")).toBe(true);
  });

  test("stage 12 is a single boss target", () => {
    const stage = STAGE_CATALOG[11];
    const bricks = buildBricksFromStage(stage);

    expect(bricks.filter((brick) => brick.kind === "boss")).toHaveLength(1);
    expect(bricks.some((brick) => brick.kind === "steel")).toBe(true);
    const boss = bricks.find((brick) => brick.kind === "boss");
    expect(boss?.hp).toBe(18);
    expect(boss?.maxHp).toBe(18);
  });
});
