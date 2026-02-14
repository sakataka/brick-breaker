import { describe, expect, test } from "bun:test";

import { type OverlayElements, readStartSettings } from "./overlay";

describe("overlay start settings", () => {
  test("reads audio toggles and gameplay setup", () => {
    const elements = {
      difficulty: { value: "standard" },
      initialLives: { value: "4" },
      speedPreset: { value: "1.25" },
      routePreference: { value: "B" },
      multiballMaxBalls: { value: "6" },
      riskMode: { checked: true },
      challengeMode: { checked: true },
      dailyMode: { checked: false },
      bgmEnabled: { checked: true },
      sfxEnabled: { checked: false },
    } as unknown as OverlayElements;

    const selected = readStartSettings(elements);
    expect(selected.difficulty).toBe("standard");
    expect(selected.initialLives).toBe(4);
    expect(selected.speedPreset).toBe("1.25");
    expect(selected.routePreference).toBe("B");
    expect(selected.multiballMaxBalls).toBe(6);
    expect(selected.riskMode).toBe(true);
    expect(selected.challengeMode).toBe(true);
    expect(selected.dailyMode).toBe(false);
    expect(selected.bgmEnabled).toBe(true);
    expect(selected.sfxEnabled).toBe(false);
  });
});
