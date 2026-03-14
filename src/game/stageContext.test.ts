import { describe, expect, test } from "vite-plus/test";
import { GAME_CONFIG, STAGE_CATALOG } from "./config";
import { resolveStageContext, resolveStageMetadata } from "./stageContext";

describe("stageContext", () => {
  test("resolves campaign metadata from the shared stage catalog", () => {
    const stage = resolveStageMetadata({
      stageIndex: 5,
      campaignCourse: "normal",
      route: null,
    });

    expect(stage.effectiveStageIndex).toBe(5);
    expect(stage.totalStages).toBe(STAGE_CATALOG.length);
    expect(stage.stage.id).toBe(6);
    expect(stage.stageModifier?.key).toBe("warp_zone");
    expect(stage.themeBand.id).toBe("chapter2");
    expect(stage.musicCue.id).toBe("chapter2");
  });

  test("clamps stage index to the final stage", () => {
    const stage = resolveStageMetadata({
      stageIndex: 99,
      campaignCourse: "normal",
      route: null,
    });

    expect(stage.effectiveStageIndex).toBe(STAGE_CATALOG.length - 1);
    expect(stage.stage.id).toBe(12);
  });

  test("uses EX catalog for EX course speed resolution", () => {
    const stage = resolveStageContext(
      {
        stageIndex: 1,
        campaignCourse: "ex",
        route: null,
      },
      GAME_CONFIG,
    );

    expect(stage.totalStages).toBe(4);
    expect(stage.stage.course).toBe("ex");
    expect(stage.initialBallSpeed).toBe(GAME_CONFIG.initialBallSpeed * stage.stage.speedScale);
    expect(stage.maxBallSpeed).toBe(GAME_CONFIG.maxBallSpeed * stage.stage.speedScale);
  });
});
