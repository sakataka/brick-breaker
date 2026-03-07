import { describe, expect, test } from "bun:test";
import {
  buildStartSettingsPatch,
  getDefaultCustomStageJson,
  parseCustomStageCatalog,
  START_SETTINGS_DEFAULT,
} from "./startSettingsSchema";

describe("startSettingsSchema", () => {
  test("coerces select and toggle values through the shared patch builder", () => {
    expect(buildStartSettingsPatch("initialLives", "6")).toEqual({ initialLives: 6 });
    expect(buildStartSettingsPatch("debugRecordResults", "true")).toEqual({ debugRecordResults: true });
    expect(buildStartSettingsPatch("stickyItemEnabled", true)).toEqual({ stickyItemEnabled: true });
    expect(buildStartSettingsPatch("challengeSeedCode", "  demo  ")).toEqual({ challengeSeedCode: "demo" });
  });

  test("parses valid custom stage json and rejects invalid input", () => {
    const valid = parseCustomStageCatalog({
      customStageJsonEnabled: true,
      customStageJson: getDefaultCustomStageJson(),
    });

    expect(valid).not.toBeNull();
    expect(valid?.length).toBeGreaterThan(0);
    expect(
      parseCustomStageCatalog({
        ...START_SETTINGS_DEFAULT,
        customStageJsonEnabled: true,
        customStageJson: "{invalid",
      }),
    ).toBeNull();
  });
});
