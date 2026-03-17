import { describe, expect, test } from "vite-plus/test";

import { getBossDefinition } from "./bosses";

describe("boss definitions", () => {
  test("define three phases and punish windows for major bosses", () => {
    const finalCore = getBossDefinition("final_core");
    const tier2Overlord = getBossDefinition("tier2_overlord");

    expect(finalCore?.phaseRules).toHaveLength(3);
    expect(finalCore?.attackPatterns).toHaveLength(3);
    expect(finalCore?.punishWindows[2]).toBeLessThan(finalCore?.punishWindows[0] ?? 99);
    expect(tier2Overlord?.arenaEffects).toContain("hazard_surge");
  });
});
