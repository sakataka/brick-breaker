import { describe, expect, test } from "vite-plus/test";
import { GAME_CONFIG } from "../config";
import { createInitialGameState } from "../stateFactory";
import { setRunScore, setShopOffer } from "../testHelpers/runtimeState";
import type { RandomSource } from "../types";
import { purchaseShopOption } from "./shopActions";

const random: RandomSource = { next: () => 0.3 };

describe("session/shopActions", () => {
  test("purchaseShopOption applies item and marks stage purchase", () => {
    const state = createInitialGameState(GAME_CONFIG, true, "playing");
    state.scene = "playing";
    setRunScore(state, 5_000);
    setShopOffer(state, ["shield", "multiball"]);

    const picked = purchaseShopOption(state, 1, GAME_CONFIG, random);

    expect(picked).toBe("multiball");
    expect(state.encounter.shop.usedThisStage).toBe(true);
    expect(state.encounter.shop.purchaseCount).toBe(1);
    expect(state.encounter.shop.lastChosen).toBe("multiball");
    expect(state.run.score).toBeLessThan(5_000);
  });
});
