import { describe, expect, test } from "vite-plus/test";
import { buildStartSettingsPatch, START_SETTINGS_DEFAULT } from "./startSettingsSchema";

describe("startSettingsSchema", () => {
  test("coerces public start-setting patches through the shared builder", () => {
    expect(buildStartSettingsPatch("difficulty", "hard")).toEqual({ difficulty: "hard" });
    expect(buildStartSettingsPatch("reducedMotionEnabled", true)).toEqual({
      reducedMotionEnabled: true,
    });
    expect(buildStartSettingsPatch("highContrastEnabled", false)).toEqual({
      highContrastEnabled: false,
    });
    expect(buildStartSettingsPatch("bgmEnabled", false)).toEqual({ bgmEnabled: false });
  });

  test("defaults to the minimal browser-first settings surface", () => {
    expect(START_SETTINGS_DEFAULT).toEqual({
      difficulty: "standard",
      reducedMotionEnabled: false,
      highContrastEnabled: false,
      bgmEnabled: true,
      sfxEnabled: true,
    });
  });
});
