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

    state.run.progress.encounterIndex = 0;
    expect(buildRenderViewState(state).themeBandId).toBe("chapter1");
    state.run.progress.encounterIndex = 3;
    expect(buildRenderViewState(state).themeBandId).toBe("midboss");
    state.run.progress.encounterIndex = 4;
    expect(buildRenderViewState(state).themeBandId).toBe("chapter2");
    state.run.progress.encounterIndex = 10;
    expect(buildRenderViewState(state).themeBandId).toBe("chapter3");
    state.run.progress.encounterIndex = 11;
    expect(buildRenderViewState(state).themeBandId).toBe("finalboss");
  });

  test("builds stage result view for stageclear and clear scenes", () => {
    const state = createInitialGameState(GAME_CONFIG, false, "playing");
    resetRoundState(state, GAME_CONFIG, false, fixedRandom);
    state.encounter.stats.startedAtSec = 0;
    state.run.elapsedSec = 52;
    state.encounter.stats.hitsTaken = 1;
    state.run.lives = 3;
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

    state.run.combo.streak = 3;
    state.run.combo.multiplier = 1.5;
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
    state.encounter.stats.startedAtSec = 0;
    state.run.elapsedSec = 40;
    state.run.lives = 3;
    finalizeStageStats(state);

    state.run.progress.encounterIndex = 1;
    state.encounter.stats.startedAtSec = 40;
    state.run.elapsedSec = 90;
    state.run.lives = 2;
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
    state.encounter.story.activeStageNumber = 4;

    const view = buildOverlayViewModel(state);

    expect(view.storyStageNumber).toBeDefined();
  });

  test("projects encounter threat and active cues into HUD and render view", () => {
    const state = createInitialGameState(GAME_CONFIG, false, "playing");
    state.scene = "playing";
    state.encounter.threatLevel = "critical";
    state.encounter.runtime.activeCues = [
      { kind: "boss_phase_shift", severity: "critical", remainingSec: 0.6, maxSec: 1.2 },
    ];

    const hud = buildHudViewModel(state);
    const render = buildRenderViewState(state);

    expect(hud.stage.threatLevel).toBe("critical");
    expect(Array.isArray(hud.stage.previewTags)).toBe(true);
    expect(render.arena.threatLevel).toBe("critical");
    expect(render.activeCues[0]?.kind).toBe("boss_phase_shift");
  });

  test("uses preserved final score on gameover overlay", () => {
    const state = createInitialGameState(GAME_CONFIG, false, "gameover");
    state.run.score = 0;
    state.run.lastGameOverScore = 1900;

    const overlay = buildOverlayViewModel(state);

    expect(overlay.score).toBe(1900);
  });

  test("projects record state and enemy projectile styles into the view models", () => {
    const state = createInitialGameState(GAME_CONFIG, false, "playing");
    state.run.options.threatTier = 2;
    state.run.score = 6400;
    state.run.records.overallBestScore = 5000;
    state.run.records.tier2BestScore = 5800;
    state.run.records.latestRunScore = 5100;
    state.run.records.currentRunRecord = true;
    state.run.records.deltaToBest = 600;
    state.combat.enemyProjectileStyle = {
      defaultProfile: "spike_orb",
      turretProfile: "plasma_bolt",
      bossProfile: "void_core",
    };
    state.encounter.runtime.projectiles = [
      { id: 1, x: 120, y: 80, vx: 0, vy: 120, radius: 10, source: "boss" },
      { id: 2, x: 240, y: 140, vx: 0, vy: 120, radius: 8, source: "turret" },
    ];

    const hud = buildHudViewModel(state);
    const overlay = buildOverlayViewModel(state);
    const render = buildRenderViewState(state);

    expect(hud.record.currentRunRecord).toBe(true);
    expect(hud.record.courseBestScore).toBe(5800);
    expect(overlay.record.latestRunScore).toBe(5100);
    expect(render.bossProjectiles[0]?.style).toBe("void_core");
    expect(render.bossProjectiles[1]?.style).toBe("plasma_bolt");
  });
});
