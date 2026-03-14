import { beforeEach, describe, expect, test } from "vite-plus/test";
import { START_SETTINGS_DEFAULT } from "../game/startSettingsSchema";
import { appStore, useAppStore } from "./store";

describe("app store", () => {
  beforeEach(() => {
    useAppStore.setState({
      startSettings: { ...START_SETTINGS_DEFAULT },
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
    expect(state.startSettings.enabledItems.length).toBeGreaterThan(0);
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
