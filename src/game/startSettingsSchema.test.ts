import { describe, expect, test } from "vite-plus/test";
import { ITEM_ORDER } from "./itemRegistry";
import {
  buildStartSettingsPatch,
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
    expect(buildStartSettingsPatch("enableNewItemStacks", true)).toEqual({
      enableNewItemStacks: true,
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
    expect(START_SETTINGS_DEFAULT.enabledItems).toEqual(ITEM_ORDER);
  });
});
