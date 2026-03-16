import { describe, expect, test } from "vite-plus/test";

import {
  applyRunScoreToMeta,
  DEFAULT_META_PROGRESS,
  readMetaProgress,
  shouldUnlockThreatTier2,
} from "./metaProgress";

describe("metaProgress", () => {
  test("migrates legacy save with only exUnlocked", () => {
    const storage = {
      getItem: (key: string) =>
        key === "brick_breaker:meta_progress" ? JSON.stringify({ exUnlocked: true }) : null,
    };

    expect(readMetaProgress(storage)).toEqual({
      ...DEFAULT_META_PROGRESS,
      progression: {
        threatTier2Unlocked: true,
      },
    });
  });

  test("updates overall and threat-tier best scores from a run", () => {
    const updated = applyRunScoreToMeta(
      {
        progression: {
          threatTier2Unlocked: true,
        },
        records: {
          overallBestScore: 4200,
          tier1BestScore: 4200,
          tier2BestScore: 2100,
          latestRunScore: 2100,
        },
      },
      { score: 5600, threatTier: 1 },
    );

    expect(updated.records.latestRunScore).toBe(5600);
    expect(updated.records.overallBestScore).toBe(5600);
    expect(updated.records.tier1BestScore).toBe(5600);
    expect(updated.records.tier2BestScore).toBe(2100);
  });

  test("unlocks threat tier 2 only for recordable tier 1 clear", () => {
    expect(
      shouldUnlockThreatTier2({
        scene: "clear",
        options: {
          threatTier: 1,
        },
      }),
    ).toBe(true);

    expect(
      shouldUnlockThreatTier2({
        scene: "clear",
        options: {
          threatTier: 2,
        },
      }),
    ).toBe(false);
  });
});
