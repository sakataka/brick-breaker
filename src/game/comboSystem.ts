import { COMBO_CONFIG } from "./config";
import type { ComboState } from "./types";

export function resetCombo(combo: ComboState): void {
  combo.multiplier = COMBO_CONFIG.baseMultiplier;
  combo.streak = 0;
  combo.lastHitSec = -1;
  combo.rewardGranted = false;
}

export function normalizeCombo(combo: ComboState, nowSec: number): void {
  if (combo.streak <= 0 || combo.lastHitSec < 0) {
    return;
  }
  if (nowSec - combo.lastHitSec > COMBO_CONFIG.windowSec) {
    resetCombo(combo);
  }
}

export function applyComboHits(
  combo: ComboState,
  nowSec: number,
  hitCount: number,
  baseScorePerHit: number,
): number {
  if (hitCount <= 0) {
    normalizeCombo(combo, nowSec);
    return 0;
  }

  const chainContinues =
    combo.streak > 0 && combo.lastHitSec >= 0 && nowSec - combo.lastHitSec <= COMBO_CONFIG.windowSec;
  if (!chainContinues) {
    resetCombo(combo);
  }

  let gained = 0;
  for (let i = 0; i < hitCount; i += 1) {
    if (combo.streak > 0) {
      combo.multiplier = Math.min(COMBO_CONFIG.maxMultiplier, combo.multiplier + COMBO_CONFIG.step);
    }
    combo.streak += 1;
    if (!combo.rewardGranted && combo.multiplier >= 2) {
      combo.rewardGranted = true;
    }
    gained += Math.round(baseScorePerHit * combo.multiplier);
  }

  combo.lastHitSec = nowSec;
  return gained;
}
