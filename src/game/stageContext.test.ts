import { describe, expect, test } from "vite-plus/test";
import { GAME_CONFIG, STAGE_CATALOG } from "./config";
import { resolveStageContext, resolveStageMetadata } from "./stageContext";

describe("stageContext", () => {
  test("resolves campaign metadata from the shared stage catalog", () => {
    const stage = resolveStageMetadata({
      stageIndex: 5,
      threatTier: 1,
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
      threatTier: 1,
    });

    expect(stage.effectiveStageIndex).toBe(STAGE_CATALOG.length - 1);
    expect(stage.stage.id).toBe(12);
  });

  test("uses threat tier 2 encounters for the high-threat sequence", () => {
    const stage = resolveStageContext(
      {
        stageIndex: 1,
        threatTier: 2,
      },
      GAME_CONFIG,
    );

    expect(stage.totalStages).toBe(4);
    expect(stage.musicCue.id).toBe("tier2");
    expect(stage.visualProfile.id).toBe("tier2");
    expect(stage.initialBallSpeed).toBe(GAME_CONFIG.initialBallSpeed * stage.stage.speedScale);
    expect(stage.maxBallSpeed).toBe(GAME_CONFIG.maxBallSpeed * stage.stage.speedScale);
  });
});
