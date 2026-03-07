import { describe, expect, test } from "bun:test";
import { GAME_CONFIG, MODE_CONFIG, STAGE_CATALOG } from "./config";
import { resolveStageContext, resolveStageMetadata } from "./stageContext";

describe("stageContext", () => {
  test("resolves campaign metadata from the shared stage catalog", () => {
    const stage = resolveStageMetadata({
      stageIndex: 5,
      gameMode: "campaign",
      route: null,
      customStageCatalog: null,
    });

    expect(stage.effectiveStageIndex).toBe(5);
    expect(stage.totalStages).toBe(STAGE_CATALOG.length);
    expect(stage.stage.id).toBe(6);
    expect(stage.stageModifier?.key).toBe("warp_zone");
    expect(stage.themeBand.id).toBe("mid");
  });

  test("resolves endless stage index modulo the active catalog", () => {
    const stage = resolveStageMetadata({
      stageIndex: 14,
      gameMode: "endless",
      route: null,
      customStageCatalog: null,
    });

    expect(stage.effectiveStageIndex).toBe(2);
    expect(stage.totalStages).toBe(MODE_CONFIG.endlessVirtualStages);
    expect(stage.stage.id).toBe(3);
  });

  test("resolves boss rush against the last stage and applies rush speed scale", () => {
    const stage = resolveStageContext(
      {
        stageIndex: 3,
        gameMode: "boss_rush",
        route: null,
        customStageCatalog: null,
      },
      GAME_CONFIG,
    );

    expect(stage.effectiveStageIndex).toBe(STAGE_CATALOG.length - 1);
    expect(stage.totalStages).toBe(MODE_CONFIG.bossRushRounds);
    expect(stage.stage.id).toBe(12);
    expect(stage.initialBallSpeed).toBeGreaterThan(GAME_CONFIG.initialBallSpeed * stage.stage.speedScale);
    expect(stage.maxBallSpeed).toBeGreaterThan(GAME_CONFIG.maxBallSpeed * stage.stage.speedScale);
  });

  test("uses custom stage catalog as the single source for stage and speed resolution", () => {
    const stage = resolveStageContext(
      {
        stageIndex: 4,
        gameMode: "campaign",
        route: "B",
        customStageCatalog: [
          {
            id: 101,
            speedScale: 0.9,
            layout: [[1]],
          },
          {
            id: 102,
            speedScale: 1.4,
            layout: [[1, 1]],
          },
        ],
      },
      GAME_CONFIG,
    );

    expect(stage.effectiveStageIndex).toBe(4);
    expect(stage.totalStages).toBe(2);
    expect(stage.stage.id).toBe(102);
    expect(stage.initialBallSpeed).toBe(GAME_CONFIG.initialBallSpeed * 1.4);
    expect(stage.maxBallSpeed).toBe(GAME_CONFIG.maxBallSpeed * 1.4);
  });
});
