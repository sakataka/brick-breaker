import { describe, expect, test } from "bun:test";

import { applyComboHits, normalizeCombo, resetCombo } from "./comboSystem";
import type { ComboState } from "./types";

function createComboState(): ComboState {
  return {
    multiplier: 1,
    streak: 0,
    lastHitSec: -1,
    rewardGranted: false,
  };
}

describe("comboSystem", () => {
  test("raises multiplier when hits happen within combo window", () => {
    const combo = createComboState();
    const first = applyComboHits(combo, 1, 1, 100);
    const second = applyComboHits(combo, 1.5, 1, 100);

    expect(first).toBe(100);
    expect(second).toBe(125);
    expect(combo.multiplier).toBe(1.25);
    expect(combo.streak).toBe(2);
  });

  test("resets multiplier when window is exceeded", () => {
    const combo = createComboState();
    applyComboHits(combo, 1, 2, 100);
    normalizeCombo(combo, 4);

    expect(combo.multiplier).toBe(1);
    expect(combo.streak).toBe(0);
    expect(combo.lastHitSec).toBe(-1);
  });

  test("resetCombo clears streak immediately", () => {
    const combo = createComboState();
    applyComboHits(combo, 1, 3, 100);
    resetCombo(combo);

    expect(combo.multiplier).toBe(1);
    expect(combo.streak).toBe(0);
    expect(combo.lastHitSec).toBe(-1);
    expect(combo.rewardGranted).toBe(false);
  });

  test("sets reward flag once when multiplier reaches x2.0", () => {
    const combo = createComboState();

    applyComboHits(combo, 1, 1, 100);
    applyComboHits(combo, 1.2, 2, 100);
    applyComboHits(combo, 1.4, 2, 100);

    expect(combo.multiplier).toBe(2);
    expect(combo.rewardGranted).toBe(true);

    applyComboHits(combo, 1.6, 1, 100);
    expect(combo.rewardGranted).toBe(true);
  });
});
