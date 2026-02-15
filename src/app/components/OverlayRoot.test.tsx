import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import type { OverlayViewModel } from "../../game/renderTypes";
import type { StartSettingsSelection } from "../store";
import { OverlayRoot } from "./OverlayRoot";

const BASE_SETTINGS: StartSettingsSelection = {
  difficulty: "standard",
  initialLives: 4,
  speedPreset: "1.00",
  routePreference: "auto",
  multiballMaxBalls: 4,
  riskMode: false,
  enableNewItemStacks: false,
  stickyItemEnabled: false,
  debugModeEnabled: false,
  debugStartStage: 1,
  debugScenario: "normal",
  debugItemPreset: "none",
  debugRecordResults: false,
  challengeMode: false,
  dailyMode: false,
  bgmEnabled: true,
  sfxEnabled: true,
};

const BASE_OVERLAY: OverlayViewModel = {
  scene: "start",
  score: 0,
  lives: 4,
  stageLabel: "ステージ 1 / 12",
};

function render(settings: StartSettingsSelection, overlay: OverlayViewModel): string {
  return renderToStaticMarkup(
    <OverlayRoot
      overlay={overlay}
      startSettings={settings}
      rogueSelection="score_core"
      onStartSettingsChange={() => {}}
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
    expect(markup).toContain('id="setting-sticky-item-enabled"');
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
