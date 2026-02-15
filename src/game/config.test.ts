import { describe, expect, test } from "bun:test";

import { buildStartConfig, GAME_CONFIG, getGameplayBalance, getShopPurchaseCost } from "./config";

describe("config helpers", () => {
  test("buildStartConfig applies difficulty and speed only to ball speed", () => {
    const config = buildStartConfig(GAME_CONFIG, {
      difficulty: "hard",
      initialLives: 5,
      speedPreset: "1.25",
      multiballMaxBalls: 6,
    });

    expect(config.difficulty).toBe("hard");
    expect(config.initialLives).toBe(5);
    expect(config.initialBallSpeed).toBeCloseTo(425, 5);
    expect(config.maxBallSpeed).toBeCloseTo(850, 5);
    expect(config.multiballMaxBalls).toBe(6);
  });

  test("getGameplayBalance returns difficulty specific paddle width", () => {
    const casual = getGameplayBalance("casual");
    const hard = getGameplayBalance("hard");
    expect(casual.paddleWidth).toBeGreaterThan(hard.paddleWidth);
  });

  test("getShopPurchaseCost scales by 1.35x and rounds to 100", () => {
    expect(getShopPurchaseCost(0)).toBe(1200);
    expect(getShopPurchaseCost(1)).toBe(1600);
    expect(getShopPurchaseCost(2)).toBe(2200);
    expect(getShopPurchaseCost(3)).toBe(3000);
  });
});
