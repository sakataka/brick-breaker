import { describe, expect, test } from "vite-plus/test";
import { shouldExposeTestBridge } from "./testBridge";

describe("game-v2 test bridge exposure", () => {
  test("requires explicit env opt-in so production builds keep the bridge hidden by default", () => {
    expect(shouldExposeTestBridge({})).toBe(false);
    expect(shouldExposeTestBridge({ VITE_BRICK_BREAKER_TEST_BRIDGE: "0" })).toBe(false);
    expect(shouldExposeTestBridge({ VITE_BRICK_BREAKER_TEST_BRIDGE: "1" })).toBe(true);
  });
});
