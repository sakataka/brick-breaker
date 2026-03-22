import { describe, expect, test } from "vite-plus/test";
import { getStageModifier, getStageStory, getStageTimeTargetSec } from "./stageProgressionConfig";

describe("stageProgressionConfig", () => {
  test("returns configured stage modifiers", () => {
    expect(getStageModifier(6)).toMatchObject({
      key: "warp_zone",
      warpZones: [expect.objectContaining({ outX: 790 }), expect.objectContaining({ outX: 160 })],
    });
    expect(getStageModifier(11)).toEqual({ key: "flux", fluxField: true });
    expect(getStageModifier(1)).toBeUndefined();
  });

  test("returns story checkpoints and time targets", () => {
    expect(getStageStory(4)).toBe(4);
    expect(getStageStory(5)).toBeNull();
    expect(getStageTimeTargetSec(0)).toBeGreaterThan(0);
    expect(getStageTimeTargetSec(3)).toBeGreaterThan(getStageTimeTargetSec(2));
  });
});
