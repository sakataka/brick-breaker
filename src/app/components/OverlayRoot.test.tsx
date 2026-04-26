import { describe, expect, test } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import type { OverlayViewModel } from "../../game-v2/public/renderTypes";
import {
  START_SETTINGS_DEFAULT,
  type StartSettingsSelection,
} from "../../game-v2/public/startSettings";
import { getFallbackThemeTokens } from "../../game-v2/public/uiTheme";
import { OverlayRoot } from "./OverlayRoot";

const BASE_SETTINGS: StartSettingsSelection = { ...START_SETTINGS_DEFAULT };

const BASE_OVERLAY: OverlayViewModel = {
  scene: "start",
  score: 0,
  lives: 4,
  stage: {
    current: 1,
    total: 12,
  },
  visual: {
    themeId: "chapter1",
    assetProfileId: "chapter1",
    chapterLabel: "Chapter 1",
    warningLevel: "calm",
    encounterEmphasis: "chapter",
    motionProfile: "full",
    backdropDepth: "stellar",
    arenaFrame: "clean",
    blockMaterial: "glass",
    particleDensity: 1,
    cameraIntensity: "steady",
    bossTone: "hunter",
    tokens: getFallbackThemeTokens(),
  },
  record: {
    overallBestScore: 0,
    courseBestScore: 0,
    latestRunScore: 0,
    deltaToBest: 0,
    currentRunRecord: false,
  },
};

function render(settings: StartSettingsSelection, overlay: OverlayViewModel): string {
  return renderToStaticMarkup(
    <OverlayRoot
      locale="ja"
      overlay={overlay}
      startSettings={settings}
      onStartSettingsChange={() => {}}
      onLocaleChange={() => {}}
      onPrimaryAction={() => {}}
    />,
  );
}

describe("OverlayRoot", () => {
  test("start scene renders scroll area and fixed footer", () => {
    const markup = render(BASE_SETTINGS, BASE_OVERLAY);
    expect(markup).toContain("overlay-card-layout");
    expect(markup).toContain("overlay-settings-scroll");
    expect(markup).toContain("overlay-fixed-footer");
    expect(markup).toContain('id="setting-reduced-motion-enabled"');
    expect(markup).toContain('id="setting-high-contrast-enabled"');
  });

  test("minimal shipped settings include only current public controls", () => {
    const markup = render(BASE_SETTINGS, BASE_OVERLAY);
    expect(markup).toContain('id="setting-language"');
    expect(markup).toContain('id="setting-difficulty"');
    expect(markup).toContain('id="setting-bgm-enabled"');
    expect(markup).toContain('id="setting-sfx-enabled"');
  });
});
