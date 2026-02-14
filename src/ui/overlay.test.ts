import { describe, expect, test } from "bun:test";

import { type OverlayElements, readStartSettings } from "./overlay";

describe("overlay start settings", () => {
  test("reads audio toggles and gameplay setup", () => {
    const elements = {
      difficulty: { value: "standard" },
      initialLives: { value: "4" },
      speedPreset: { value: "1.25" },
      multiballMaxBalls: { value: "6" },
      bgmEnabled: { checked: true },
      sfxEnabled: { checked: false },
    } as unknown as OverlayElements;

    const selected = readStartSettings(elements);
    expect(selected.difficulty).toBe("standard");
    expect(selected.initialLives).toBe(4);
    expect(selected.speedPreset).toBe("1.25");
    expect(selected.multiballMaxBalls).toBe(6);
    expect(selected.bgmEnabled).toBe(true);
    expect(selected.sfxEnabled).toBe(false);
  });
});
