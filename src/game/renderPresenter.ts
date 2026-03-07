import { getStageStory, ROGUE_CONFIG } from "./config";
import { getGhostPlaybackSample } from "./ghostSystem";
import { getActiveItemEntries } from "./itemSystem";
import type { HudViewModel, OverlayViewModel, RenderViewState } from "./renderTypes";
import { getStageClearTimeSec } from "./roundSystem";
import { resolveStageMetadataFromState } from "./stageContext";
import type { GameState } from "./types";

export function buildRenderViewState(state: GameState): RenderViewState {
  const stageContext = resolveStageMetadataFromState(state);
  const progressRatio = computeProgressRatio(state);
  const ghostSample =
    state.options.ghostReplayEnabled && state.ghost.playbackEnabled
      ? getGhostPlaybackSample(state.ghost.playback, state.elapsedSec)
      : null;

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
    highContrast: state.a11y.highContrast,
    shake: {
      active: !state.vfx.reducedMotion && state.vfx.shakeMs > 0 && state.vfx.shakePx > 0,
      offset: state.vfx.shakeOffset,
    },
    fallingItems: state.items.falling,
    progressRatio,
    themeBandId: stageContext.themeBand.id,
    slowBallActive: state.items.active.slowBallStacks > 0,
    multiballActive: state.items.active.multiballStacks > 0,
    shieldCharges: state.items.active.shieldCharges,
    showSceneOverlayTint: state.scene !== "playing",
    enemies: state.enemies,
    laserProjectiles: state.combat.laserProjectiles.map((shot) => ({
      id: shot.id,
      x: shot.x,
      y: shot.y,
    })),
    fluxFieldActive: stageContext.stageModifier?.fluxField ?? false,
    stageModifierKey: stageContext.stageModifier?.key,
    warpZones: stageContext.stageModifier?.warpZones,
    ghostPlayback: ghostSample
      ? {
          paddleX: ghostSample.paddleX,
          ballX: ghostSample.ballX,
          ballY: ghostSample.ballY,
        }
      : undefined,
  };
}

export function buildHudViewModel(state: GameState): HudViewModel {
  const stageContext = resolveStageMetadataFromState(state);
  const progressRatio = computeProgressRatio(state);
  const activeItems = getActiveItemEntries(state.items);
  const comboVisible = state.combo.streak > 1;
  const hazardBoostActive = state.elapsedSec < state.hazard.speedBoostUntilSec;
  const pierceSlowSynergy = state.items.active.pierceStacks > 0 && state.items.active.slowBallStacks > 0;
  const boss = buildBossHud(state);
  return {
    score: state.score,
    lives: state.lives,
    elapsedSec: state.elapsedSec,
    comboMultiplier: state.combo.streak > 1 ? state.combo.multiplier : 1,
    stage: {
      mode: state.options.gameMode,
      current: state.campaign.stageIndex + 1,
      total: state.campaign.totalStages,
      route: state.campaign.resolvedRoute,
      modifierKey: stageContext.stageModifier?.key,
      boss,
      debugModeEnabled: state.options.debugModeEnabled,
      debugRecordResults: state.options.debugRecordResults,
    },
    activeItems,
    flags: {
      hazardBoostActive,
      pierceSlowSynergy,
      riskMode: state.options.riskMode,
      rogueUpgradesTaken: state.rogue.upgradesTaken,
      rogueUpgradeCap: ROGUE_CONFIG.maxUpgrades,
      magicCooldownSec: state.magic.cooldownSec,
      warpLegendVisible: Boolean(stageContext.stageModifier?.warpZones?.length),
    },
    progressRatio,
    accentColor: comboVisible ? COMBO_ACTIVE_COLOR : stageContext.themeBand.hudAccent,
  };
}

function buildBossHud(state: GameState): HudViewModel["stage"]["boss"] | undefined {
  const boss = state.bricks.find((brick) => brick.alive && brick.kind === "boss");
  if (!boss) {
    return undefined;
  }
  const hp = Math.max(0, boss.hp ?? 0);
  const maxHp = Math.max(hp, boss.maxHp ?? 12);
  return {
    hp,
    maxHp,
    phase: state.combat.bossPhase >= 2 ? 2 : 1,
  };
}

export function buildOverlayViewModel(state: GameState): OverlayViewModel {
  const clearSec = getStageClearTimeSec(state);
  const overlayScore =
    state.scene === "gameover" && typeof state.lastGameOverScore === "number"
      ? state.lastGameOverScore
      : state.score;
  return {
    scene: state.scene,
    score: overlayScore,
    lives: state.lives,
    stage: {
      mode: state.options.gameMode,
      current: state.campaign.stageIndex + 1,
      total: state.campaign.totalStages,
      debugModeEnabled: state.options.debugModeEnabled,
      debugRecordResults: state.options.debugRecordResults,
    },
    clearElapsedSec: state.scene === "clear" ? state.elapsedSec : undefined,
    error: state.error ?? undefined,
    stageResult:
      typeof state.stageStats.starRating === "number" &&
      typeof state.stageStats.ratingScore === "number" &&
      clearSec !== null
        ? {
            stars: state.stageStats.starRating,
            ratingScore: state.stageStats.ratingScore,
            clearTimeSec: clearSec,
            hitsTaken: state.stageStats.hitsTaken,
            livesLeft: state.lives,
            missionTargetSec: state.stageStats.missionTargetSec,
            missionAchieved: state.stageStats.missionAchieved ?? false,
            missionResults: state.stageStats.missionResults ?? [],
          }
        : undefined,
    campaignResults:
      state.scene === "clear"
        ? state.campaign.results.map((result) => ({
            stageNumber: result.stageNumber,
            stars: result.stars,
            ratingScore: result.ratingScore,
            clearTimeSec: result.clearTimeSec,
            livesLeft: result.livesAtClear,
            missionTargetSec: result.missionTargetSec,
            missionAchieved: result.missionAchieved,
            missionResults: result.missionResults,
          }))
        : undefined,
    rogueOffer:
      state.scene === "stageclear" && state.rogue.pendingOffer
        ? {
            options: state.rogue.pendingOffer,
            remaining: Math.max(0, ROGUE_CONFIG.maxUpgrades - state.rogue.upgradesTaken),
          }
        : undefined,
    storyStageNumber:
      state.scene === "story" && typeof state.story.activeStageNumber === "number"
        ? (getStageStory(state.story.activeStageNumber) ?? undefined)
        : undefined,
  };
}

const COMBO_ACTIVE_COLOR = "#ffd46b";

function computeProgressRatio(state: GameState): number {
  const total = state.bricks.length;
  const alive = state.bricks.reduce((count, brick) => count + (brick.alive ? 1 : 0), 0);
  return total <= 0 ? 0 : Math.max(0, Math.min(1, (total - alive) / total));
}
