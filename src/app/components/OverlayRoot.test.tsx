import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import type { OverlayViewModel } from "../../game/renderTypes";
import { START_SETTINGS_DEFAULT, type StartSettingsSelection } from "../../game/startSettingsSchema";
import { OverlayRoot } from "./OverlayRoot";

const BASE_SETTINGS: StartSettingsSelection = { ...START_SETTINGS_DEFAULT };

const BASE_OVERLAY: OverlayViewModel = {
  scene: "start",
  score: 0,
  lives: 4,
  stage: {
    mode: "campaign",
    current: 1,
    total: 12,
    debugModeEnabled: false,
    debugRecordResults: false,
  },
};

function render(settings: StartSettingsSelection, overlay: OverlayViewModel): string {
  return renderToStaticMarkup(
    <OverlayRoot
      locale="ja"
      overlay={overlay}
      startSettings={settings}
      rogueSelection="score_core"
      onStartSettingsChange={() => {}}
      onLocaleChange={() => {}}
      onRogueSelectionChange={() => {}}
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
    expect(markup).not.toContain('value="pseudo"');
    expect(markup).toContain('id="setting-sticky-item-enabled"');
    expect(markup).not.toContain('id="app-summary-pdf-link"');
  });

  test("debug options remain collapsed when debug mode is OFF", () => {
    const markup = render(BASE_SETTINGS, BASE_OVERLAY);
    expect(markup).not.toContain('id="setting-debug-start-stage"');
    expect(markup).toContain("デバッグモードをONにすると検証用オプションを表示します");
  });

  test("debug options expand when debug mode is ON", () => {
    const settings: StartSettingsSelection = {
      ...BASE_SETTINGS,
      debugModeEnabled: true,
    };
    const markup = render(settings, BASE_OVERLAY);
    expect(markup).toContain('id="setting-debug-start-stage"');
    expect(markup).toContain('id="setting-debug-scenario"');
    expect(markup).toContain('id="setting-debug-item-preset"');
    expect(markup).toContain('id="setting-debug-record-results"');
  });
});
