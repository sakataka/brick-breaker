import { getThemeBandByStageIndex } from "./config";
import { getActiveItemLabels } from "./itemSystem";
import type { HudViewModel, OverlayViewModel, RenderViewState } from "./renderTypes";
import { getStageClearTimeSec } from "./roundSystem";
import type { GameState } from "./types";

export function buildRenderViewState(state: GameState): RenderViewState {
  const total = state.bricks.length;
  const alive = state.bricks.reduce((count, brick) => count + (brick.alive ? 1 : 0), 0);
  const progressRatio = total <= 0 ? 0 : Math.max(0, Math.min(1, (total - alive) / total));
  const themeBand = getThemeBandByStageIndex(state.campaign.stageIndex);

  return {
    scene: state.scene,
    elapsedSec: state.elapsedSec,
    bricks: state.bricks,
    paddle: {
      x: state.paddle.x,
      y: state.paddle.y,
      width: state.paddle.width,
      height: state.paddle.height,
      glowActive: state.items.active.paddlePlusStacks > 0,
    },
    balls: state.balls,
    trail: state.vfx.trail,
    particles: state.vfx.particles,
    impactRings: state.vfx.impactRings,
    floatingTexts: state.vfx.floatingTexts,
    flashMs: state.vfx.flashMs,
    reducedMotion: state.vfx.reducedMotion,
    shake: {
      active: !state.vfx.reducedMotion && state.vfx.shakeMs > 0 && state.vfx.shakePx > 0,
      offset: state.vfx.shakeOffset,
    },
    fallingItems: state.items.falling,
    progressRatio,
    themeBandId: themeBand.id,
    slowBallActive: state.items.active.slowBallStacks > 0,
    multiballActive: state.items.active.multiballStacks > 0,
    shieldCharges: state.items.active.shieldCharges,
    showSceneOverlayTint: state.scene !== "playing",
  };
}

export function buildHudViewModel(state: GameState): HudViewModel {
  const activeItems = getActiveItemLabels(state.items);
  const themeBand = getThemeBandByStageIndex(state.campaign.stageIndex);
  const comboVisible = state.combo.streak > 1;
  return {
    scoreText: `スコア: ${state.score}`,
    livesText: `残機: ${state.lives}`,
    timeText: `時間: ${formatTime(state.elapsedSec)}`,
    stageText: `ステージ: ${state.campaign.stageIndex + 1}/${state.campaign.totalStages}`,
    comboText: comboVisible ? `コンボ x${state.combo.multiplier.toFixed(2)}` : "コンボ x1.00",
    itemsText: `アイテム: ${activeItems.join(" / ")}`,
    accentColor: comboVisible ? COMBO_ACTIVE_COLOR : themeBand.hudAccent,
  };
}

export function buildOverlayViewModel(state: GameState): OverlayViewModel {
  const clearSec = getStageClearTimeSec(state);
  return {
    scene: state.scene,
    score: state.score,
    lives: state.lives,
    clearTime: state.scene === "clear" ? formatTime(state.elapsedSec) : undefined,
    errorMessage: state.errorMessage ?? undefined,
    stageLabel: `ステージ ${state.campaign.stageIndex + 1} / ${state.campaign.totalStages}`,
    stageResult:
      typeof state.stageStats.starRating === "number" &&
      typeof state.stageStats.ratingScore === "number" &&
      clearSec !== null
        ? {
            stars: state.stageStats.starRating,
            ratingScore: state.stageStats.ratingScore,
            clearTime: formatTime(clearSec),
            hitsTaken: state.stageStats.hitsTaken,
            livesLeft: state.lives,
          }
        : undefined,
    campaignResults:
      state.scene === "clear"
        ? state.campaign.results.map((result) => ({
            stageNumber: result.stageNumber,
            stars: result.stars,
            ratingScore: result.ratingScore,
            clearTime: formatTime(result.clearTimeSec),
            livesLeft: result.livesAtClear,
          }))
        : undefined,
  };
}

const COMBO_ACTIVE_COLOR = "#ffd46b";

function formatTime(totalSec: number): string {
  const min = Math.floor(totalSec / 60);
  const sec = Math.floor(totalSec % 60);
  return `${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}
