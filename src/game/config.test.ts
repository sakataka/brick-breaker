import { describe, expect, test } from "vite-plus/test";

import { buildStartConfig, GAME_CONFIG, getGameplayBalance, getShopPurchaseCost } from "./config";

describe("config helpers", () => {
  test("buildStartConfig applies difficulty presets for the shipped campaign", () => {
    const config = buildStartConfig(GAME_CONFIG, {
      difficulty: "hard",
    });

    expect(config.difficulty).toBe("hard");
    expect(config.initialLives).toBe(2);
    expect(config.initialBallSpeed).toBe(340);
    expect(config.maxBallSpeed).toBe(680);
    expect(config.multiballMaxBalls).toBe(GAME_CONFIG.multiballMaxBalls);
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
