import { describe, expect, test } from "bun:test";

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
    expect(buildRenderViewState(state).themeBandId).toBe("early");
    state.campaign.stageIndex = 6;
    expect(buildRenderViewState(state).themeBandId).toBe("mid");
    state.campaign.stageIndex = 10;
    expect(buildRenderViewState(state).themeBandId).toBe("late");
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
    expect(buildOverlayViewModel(state).stageResult?.stars).toBe(3);
    state.scene = "clear";
    expect(buildOverlayViewModel(state).stageResult?.clearTime).toBe("00:52");
  });

  test("shows combo text only when streak is active", () => {
    const state = createInitialGameState(GAME_CONFIG, false, "playing");
    const idle = buildHudViewModel(state);
    expect(idle.comboText).toBe("コンボ x1.00");

    state.combo.streak = 3;
    state.combo.multiplier = 1.5;
    const active = buildHudViewModel(state);
    expect(active.comboText).toBe("コンボ x1.50");
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
  });
});
