import { describe, expect, test } from "vite-plus/test";
import { ITEM_ORDER } from "./itemRegistryData";
import {
  buildStartSettingsPatch,
  getDefaultCustomStageJson,
  parseCustomStageCatalog,
  START_SETTINGS_DEFAULT,
  toggleEnabledItem,
} from "./startSettingsSchema";
import type { ItemType } from "./types";

describe("startSettingsSchema", () => {
  test("coerces select and toggle values through the shared patch builder", () => {
    expect(buildStartSettingsPatch("initialLives", "6")).toEqual({ initialLives: 6 });
    expect(buildStartSettingsPatch("debugRecordResults", "true")).toEqual({
      debugRecordResults: true,
    });
    expect(buildStartSettingsPatch("campaignCourse", "ex")).toEqual({ campaignCourse: "ex" });
    expect(buildStartSettingsPatch("challengeSeedCode", "  demo  ")).toEqual({
      challengeSeedCode: "demo",
    });
  });

  test("toggleEnabledItem keeps at least one item active", () => {
    const disabledAllButOne = ITEM_ORDER.slice(0, -1) as ItemType[];
    expect(
      toggleEnabledItem({ enabledItems: ITEM_ORDER as ItemType[] }, ITEM_ORDER[0], false)
        .enabledItems?.length,
    ).toBe(ITEM_ORDER.length - 1);
    expect(
      toggleEnabledItem({ enabledItems: [ITEM_ORDER[0] as ItemType] }, ITEM_ORDER[0], false)
        .enabledItems,
    ).toEqual([ITEM_ORDER[0]]);
    expect(
      toggleEnabledItem({ enabledItems: disabledAllButOne }, ITEM_ORDER.at(-1) as ItemType, true)
        .enabledItems,
    ).toHaveLength(ITEM_ORDER.length);
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
