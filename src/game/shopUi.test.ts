import { describe, expect, test } from "bun:test";

import { GAME_CONFIG } from "./config";
import { buildShopUiView } from "./shopUi";
import { createInitialGameState } from "./stateFactory";

describe("shopUi", () => {
  test("returns hidden panel outside playing scene", () => {
    const state = createInitialGameState(GAME_CONFIG, true, "start");
    const view = buildShopUiView(state);

    expect(view.visible).toBe(false);
  });

  test("shows offer types and current dynamic price", () => {
    const state = createInitialGameState(GAME_CONFIG, true, "playing");
    state.scene = "playing";
    state.shop.lastOffer = ["shield", "laser"];
    state.shop.purchaseCount = 2;
    state.score = 5000;

    const view = buildShopUiView(state);

    expect(view.visible).toBe(true);
    expect(view.cost).toBe(2200);
    expect(view.priceBandVisible).toBe(true);
    expect(view.optionAType).toBe("shield");
    expect(view.optionBType).toBe("laser");
    expect(view.optionADisabled).toBe(false);
  });
});
