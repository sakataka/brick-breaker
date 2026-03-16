import { describe, expect, test } from "vite-plus/test";

import { GAME_CONFIG } from "./config";
import { buildShopUiView } from "./shopUi";
import { createInitialGameState } from "./stateFactory";
import { setEncounterIndex, setRunScore, setShopOffer } from "./testHelpers/runtimeState";

describe("shopUi", () => {
  test("returns hidden panel outside playing scene", () => {
    const state = createInitialGameState(GAME_CONFIG, true, "start");
    const view = buildShopUiView(state);

    expect(view.visible).toBe(false);
  });

  test("shows offer types and current dynamic price", () => {
    const state = createInitialGameState(GAME_CONFIG, true, "playing");
    state.scene = "playing";
    setEncounterIndex(state, 6);
    setShopOffer(state, ["shield", "laser"]);
    state.encounter.shop.purchaseCount = 2;
    setRunScore(state, 5000);

    const view = buildShopUiView(state);

    expect(view.visible).toBe(true);
    expect(view.cost).toBe(2200);
    expect(view.priceBandVisible).toBe(true);
    expect(view.optionAType).toBe("shield");
    expect(view.optionBType).toBe("laser");
    expect(view.optionADisabled).toBe(false);
    expect(view.previewStageNumber).toBe(8);
    expect(view.previewTags.length).toBeGreaterThan(0);
    expect(view.optionB.previewAffinity).toContain("fortress_core");
  });
});
