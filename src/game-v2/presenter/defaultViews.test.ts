import { describe, expect, test } from "vite-plus/test";
import { DEFAULT_META_PROGRESS } from "../public/metaProgress";
import {
  createDefaultHudView,
  createDefaultOverlayView,
  createDefaultShopView,
  createInitialStartSettings,
} from "./defaultViews";

describe("game-v2 presenter defaults", () => {
  test("keeps the shipped top-level ui models aligned with README defaults", () => {
    const hud = createDefaultHudView();
    const overlay = createDefaultOverlayView(DEFAULT_META_PROGRESS);
    const shop = createDefaultShopView();

    expect(hud.stage.total).toBe(12);
    expect(overlay.scene).toBe("start");
    expect(overlay.record.courseBestScore).toBe(0);
    expect(shop.visible).toBe(false);
  });

  test("derives the public start settings surface from accessibility only", () => {
    expect(
      createInitialStartSettings({
        reducedMotion: true,
        highContrast: false,
      }),
    ).toEqual({
      difficulty: "standard",
      reducedMotionEnabled: true,
      highContrastEnabled: false,
      bgmEnabled: true,
      sfxEnabled: true,
    });
  });
});
