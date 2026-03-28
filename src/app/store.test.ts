import { beforeEach, describe, expect, test } from "vite-plus/test";
import { START_SETTINGS_DEFAULT } from "../game-v2/public/startSettings";
import { appStore, useAppStore } from "./store";

describe("app store", () => {
  beforeEach(() => {
    useAppStore.setState({
      startSettings: { ...START_SETTINGS_DEFAULT },
      handlers: {
        primaryAction: () => {},
        shopOption: () => {},
      },
    });
  });

  test("updates start settings with partial patch", () => {
    appStore.getState().setStartSettings({
      difficulty: "hard",
      reducedMotionEnabled: true,
      highContrastEnabled: true,
    });
    const state = appStore.getState();
    expect(state.startSettings.difficulty).toBe("hard");
    expect(state.startSettings.reducedMotionEnabled).toBe(true);
    expect(state.startSettings.highContrastEnabled).toBe(true);
    expect(state.startSettings.bgmEnabled).toBe(true);
    expect(state.startSettings.sfxEnabled).toBe(true);
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
