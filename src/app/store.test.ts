import { beforeEach, describe, expect, test } from "bun:test";
import { appStore, useAppStore } from "./store";

describe("app store", () => {
  beforeEach(() => {
    useAppStore.setState({
      startSettings: {
        difficulty: "standard",
        initialLives: 4,
        speedPreset: "1.00",
        routePreference: "auto",
        multiballMaxBalls: 4,
        riskMode: false,
        enableNewItemStacks: false,
        debugModeEnabled: false,
        debugStartStage: 1,
        debugScenario: "normal",
        debugItemPreset: "none",
        debugRecordResults: false,
        challengeMode: false,
        dailyMode: false,
        bgmEnabled: true,
        sfxEnabled: true,
      },
      rogueSelection: "score_core",
      handlers: {
        primaryAction: () => {},
        shopOption: () => {},
      },
    });
  });

  test("updates start settings with partial patch", () => {
    appStore.getState().setStartSettings({
      initialLives: 6,
      speedPreset: "1.25",
      difficulty: "hard",
    });
    const state = appStore.getState();
    expect(state.startSettings.initialLives).toBe(6);
    expect(state.startSettings.speedPreset).toBe("1.25");
    expect(state.startSettings.difficulty).toBe("hard");
    expect(state.startSettings.bgmEnabled).toBe(true);
    expect(state.startSettings.debugModeEnabled).toBe(false);
    expect(state.startSettings.debugStartStage).toBe(1);
    expect(state.startSettings.debugRecordResults).toBe(false);
  });

  test("routes UI trigger callbacks through registered handlers", () => {
    let primaryFired = false;
    let selectedIndex: 0 | 1 | -1 = -1;
    appStore.getState().setHandlers({
      primaryAction: () => {
        primaryFired = true;
      },
      shopOption: (index) => {
        selectedIndex = index;
      },
    });

    appStore.getState().triggerPrimaryAction();
    appStore.getState().triggerShopOption(1);

    expect(primaryFired).toBe(true);
    expect(selectedIndex as number).toBe(1);
  });
});
