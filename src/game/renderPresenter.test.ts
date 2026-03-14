import { describe, expect, test } from "vite-plus/test";

import { GAME_CONFIG } from "./config";
import { buildHudViewModel, buildOverlayViewModel, buildRenderViewState } from "./renderPresenter";
import { finalizeStageStats, resetRoundState } from "./roundSystem";
import { createInitialGameState } from "./stateFactory";
import type { RandomSource } from "./types";

const fixedRandom: RandomSource = { next: () => 0.5 };

describe("renderPresenter", () => {
  test("switches theme band by stage range", () => {
    const state = createInitialGameState(GAME_CONFIG, false, "playing");

    state.campaign.stageIndex = 0;
    expect(buildRenderViewState(state).themeBandId).toBe("chapter1");
    state.campaign.stageIndex = 3;
    expect(buildRenderViewState(state).themeBandId).toBe("midboss");
    state.campaign.stageIndex = 4;
    expect(buildRenderViewState(state).themeBandId).toBe("chapter2");
    state.campaign.stageIndex = 10;
    expect(buildRenderViewState(state).themeBandId).toBe("chapter3");
    state.campaign.stageIndex = 11;
    expect(buildRenderViewState(state).themeBandId).toBe("finalboss");
  });

  test("builds stage result view for stageclear and clear scenes", () => {
    const state = createInitialGameState(GAME_CONFIG, false, "playing");
    resetRoundState(state, GAME_CONFIG, false, fixedRandom);
    state.stageStats.startedAtSec = 0;
    state.elapsedSec = 52;
    state.stageStats.hitsTaken = 1;
    state.lives = 3;
    finalizeStageStats(state);

    state.scene = "stageclear";
    const stageClearView = buildOverlayViewModel(state);
    expect(stageClearView.stageResult?.stars).toBe(3);
    expect(stageClearView.stageResult?.missionAchieved).toBe(true);
    expect(stageClearView.stageResult?.missionTargetSec).toBe(92);
    expect(stageClearView.stageResult?.missionResults).toHaveLength(2);
    state.scene = "clear";
    expect(buildOverlayViewModel(state).stageResult?.clearTimeSec).toBe(52);
  });

  test("shows combo text only when streak is active", () => {
    const state = createInitialGameState(GAME_CONFIG, false, "playing");
    const idle = buildHudViewModel(state);
    expect(idle.comboMultiplier).toBe(1);

    state.combo.streak = 3;
    state.combo.multiplier = 1.5;
    const active = buildHudViewModel(state);
    expect(active.comboMultiplier).toBe(1.5);
  });

  test("includes reduced motion and high contrast status in ViewState", () => {
    const state = createInitialGameState(GAME_CONFIG, true, "playing", true);
    const render = buildRenderViewState(state);

    expect(render.reducedMotion).toBe(true);
    expect(render.highContrast).toBe(true);
  });

  test("builds campaign result list for clear scene", () => {
    const state = createInitialGameState(GAME_CONFIG, false, "playing");
    resetRoundState(state, GAME_CONFIG, false, fixedRandom);
    state.stageStats.startedAtSec = 0;
    state.elapsedSec = 40;
    state.lives = 3;
    finalizeStageStats(state);

    state.campaign.stageIndex = 1;
    state.stageStats.startedAtSec = 40;
    state.elapsedSec = 90;
    state.lives = 2;
    finalizeStageStats(state);

    state.scene = "clear";
    const view = buildOverlayViewModel(state);
    expect(view.campaignResults).toHaveLength(2);
    expect(view.campaignResults?.[0]?.stageNumber).toBe(1);
    expect(view.campaignResults?.[1]?.stageNumber).toBe(2);
    expect(view.campaignResults?.[0]?.missionAchieved).toBe(true);
  });

  test("builds story text for story scene", () => {
    const state = createInitialGameState(GAME_CONFIG, false, "story");
    state.story.activeStageNumber = 4;

    const view = buildOverlayViewModel(state);

    expect(view.storyStageNumber).toBeDefined();
  });

  test("shows debug badges in HUD and overlay when debug recording is off", () => {
    const state = createInitialGameState(GAME_CONFIG, false, "stageclear");
    state.options.debugModeEnabled = true;
    state.options.debugRecordResults = false;

    const hud = buildHudViewModel(state);
    const overlay = buildOverlayViewModel(state);

    expect(hud.stage.debugModeEnabled).toBe(true);
    expect(hud.stage.debugRecordResults).toBe(false);
    expect(overlay.stage.debugModeEnabled).toBe(true);
    expect(overlay.stage.debugRecordResults).toBe(false);
  });

  test("uses preserved final score on gameover overlay", () => {
    const state = createInitialGameState(GAME_CONFIG, false, "gameover");
    state.score = 0;
    state.lastGameOverScore = 1900;

    const overlay = buildOverlayViewModel(state);

    expect(overlay.score).toBe(1900);
  });
});
