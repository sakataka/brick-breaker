import { describe, expect, test } from "bun:test";

import { GAME_CONFIG } from "./config";
import { buildShopUiView } from "./shopUi";
import { createInitialGameState } from "./stateFactory";

describe("shopUi", () => {
  test("returns hidden panel outside playing scene", () => {
    const state = createInitialGameState(GAME_CONFIG, true, "start");
    const view = buildShopUiView(state);

    expect(view.visible).toBe(false);
    expect(view.rerollVisible).toBe(false);
  });

  test("shows emoji + label and current dynamic price", () => {
    const state = createInitialGameState(GAME_CONFIG, true, "playing");
    state.scene = "playing";
    state.shop.lastOffer = ["shield", "laser"];
    state.shop.purchaseCount = 2;
    state.score = 5000;

    const view = buildShopUiView(state);

    expect(view.visible).toBe(true);
    expect(view.currentCostText).toBe("2200点");
    expect(view.optionALabel).toContain("🛡");
    expect(view.optionALabel).toContain("シールド");
    expect(view.optionBLabel).toContain("🔫");
    expect(view.optionBLabel).toContain("レーザー");
    expect(view.rerollDisabled).toBe(false);
    expect(view.optionADisabled).toBe(false);
  });

  test("disables reroll after one use in current stage", () => {
    const state = createInitialGameState(GAME_CONFIG, true, "playing");
    state.scene = "playing";
    state.shop.lastOffer = ["shield", "laser"];
    state.shop.rerolledThisStage = true;
    state.score = 9999;

    const view = buildShopUiView(state);
    expect(view.rerollDisabled).toBe(true);
    expect(view.rerollLabel).toBe("リロール済み");
  });
});
