import { describe, expect, test } from "vite-plus/test";
import { prepareEncounter } from "./transitions";
import { DEFAULT_GAME_CONFIG } from "./config";
import { createInitialGameState } from "./stateFactory";
import { applyShopSelection } from "./shop";

describe("game-v2 shop contract", () => {
  test("keeps the shipped two-option one-time purchase flow", () => {
    const state = createInitialGameState(DEFAULT_GAME_CONFIG, false, "playing");

    prepareEncounter(state);
    expect(state.encounter.shop.lastOffer?.options).toHaveLength(2);

    const picked = applyShopSelection(state, 0);

    expect(picked).toBe(state.encounter.shop.lastOffer?.options[0]);
    expect(state.encounter.shop.purchased).toBe(true);
    expect(state.run.activeItems).toHaveLength(1);
    expect(applyShopSelection(state, 1)).toBeNull();
  });
});
