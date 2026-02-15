import { describe, expect, test } from "bun:test";
import { GAME_CONFIG } from "../config";
import { createInitialGameState } from "../stateFactory";
import type { RandomSource } from "../types";
import { purchaseShopOption, rerollShopOffer } from "./shopActions";

const random: RandomSource = { next: () => 0.3 };

describe("session/shopActions", () => {
  test("purchaseShopOption applies item and marks stage purchase", () => {
    const state = createInitialGameState(GAME_CONFIG, true, "playing");
    state.scene = "playing";
    state.score = 5_000;
    state.shop.lastOffer = ["shield", "multiball"];

    const picked = purchaseShopOption(state, 1, GAME_CONFIG, random);

    expect(picked).toBe("multiball");
    expect(state.shop.usedThisStage).toBe(true);
    expect(state.shop.purchaseCount).toBe(1);
    expect(state.shop.lastChosen).toBe("multiball");
    expect(state.score).toBeLessThan(5_000);
  });

  test("rerollShopOffer only works once before purchase", () => {
    const state = createInitialGameState(GAME_CONFIG, true, "playing");
    state.scene = "playing";
    state.shop.lastOffer = ["shield", "multiball"];

    expect(rerollShopOffer(state, random)).toBe(true);
    expect(state.shop.rerolledThisStage).toBe(true);
    expect(rerollShopOffer(state, random)).toBe(false);

    state.shop.usedThisStage = true;
    expect(rerollShopOffer(state, random)).toBe(false);
  });
});
