import { describe, expect, test } from "vitest";
import { DEFAULT_GAME_CONFIG } from "./config";
import { createInitialGameState } from "./stateFactory";
import { hasRuntimeStateContract, projectRuntimeStateContract } from "./runtimeContract";

describe("game-v2 runtime contract", () => {
  test("projects the shipped runtime state into the five-zone contract", () => {
    const state = createInitialGameState(DEFAULT_GAME_CONFIG, false, "start");
    const projected = projectRuntimeStateContract(state);

    expect(projected.scene).toBe("start");
    expect(projected.run.progress.totalEncounters).toBe(12);
    expect(projected.encounter.shop.lastOffer).toBeNull();
    expect(projected.combat.balls).toHaveLength(1);
    expect(projected.ui.a11y.highContrast).toBe(false);
    expect(hasRuntimeStateContract(projected)).toBe(true);
  });
});
