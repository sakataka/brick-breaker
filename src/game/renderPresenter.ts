import { getActiveItemLabels } from "./itemSystem";
import type { HudViewModel, OverlayViewModel, RenderViewState } from "./renderTypes";
import type { GameState } from "./types";

export function buildRenderViewState(state: GameState): RenderViewState {
  const total = state.bricks.length;
  const alive = state.bricks.reduce((count, brick) => count + (brick.alive ? 1 : 0), 0);
  const progressRatio = total <= 0 ? 0 : Math.max(0, Math.min(1, (total - alive) / total));

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
    slowBallActive: state.items.active.slowBallStacks > 0,
    multiballActive: state.items.active.multiballStacks > 0,
    shieldCharges: state.items.active.shieldCharges,
    showSceneOverlayTint: state.scene !== "playing",
  };
}

export function buildHudViewModel(state: GameState): HudViewModel {
  const activeItems = getActiveItemLabels(state.items);
  return {
    scoreText: `SCORE: ${state.score}`,
    livesText: `LIVES: ${state.lives}`,
    timeText: `TIME: ${formatTime(state.elapsedSec)}`,
    stageText: `STAGE: ${state.campaign.stageIndex + 1}/${state.campaign.totalStages}`,
    itemsText: activeItems.length > 0 ? `ITEM: ${activeItems.join(" / ")}` : "ITEM: -",
  };
}

export function buildOverlayViewModel(state: GameState): OverlayViewModel {
  return {
    scene: state.scene,
    score: state.score,
    lives: state.lives,
    clearTime: state.scene === "clear" ? formatTime(state.elapsedSec) : undefined,
    errorMessage: state.errorMessage ?? undefined,
    stageLabel: `STAGE ${state.campaign.stageIndex + 1} / ${state.campaign.totalStages}`,
  };
}

function formatTime(totalSec: number): string {
  const min = Math.floor(totalSec / 60);
  const sec = Math.floor(totalSec % 60);
  return `${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}
