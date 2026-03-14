import { countAliveObjectiveBricks } from "./brickRules";
import { getStageStory } from "./config";
import { getActiveItemEntries } from "./itemSystem";
import type { HudViewModel, OverlayViewModel, RenderViewState } from "./renderTypes";
import { getStageClearTimeSec } from "./roundSystem";
import { resolveStageMetadataFromState } from "./stageContext";
import type { GameState } from "./types";
import {
  clampBannerProgress,
  resolveEncounterEmphasis,
  resolveUiThemeTokens,
  type VisualState,
} from "./uiTheme";

export function buildRenderViewState(state: GameState): RenderViewState {
  const stageContext = resolveStageMetadataFromState(state);
  const progressRatio = computeProgressRatio(state);
  const warningLevel = resolveWarningLevel(state);
  const stageIntro = buildStageIntro(state, stageContext);

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
    flashColor: state.vfx.flashColor,
    reducedMotion: state.vfx.reducedMotion,
    highContrast: state.a11y.highContrast,
    shake: {
      active: !state.vfx.reducedMotion && state.vfx.shakeMs > 0 && state.vfx.shakePx > 0,
      offset: state.vfx.shakeOffset,
    },
    fallingItems: state.items.falling,
    progressRatio,
    themeBandId: stageContext.themeBand.id,
    visual: buildVisualState(state, stageContext, warningLevel, stageIntro),
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
    bossProjectiles: state.combat.bossAttackState.projectiles.map((shot) => ({
      id: shot.id,
      x: shot.x,
      y: shot.y,
      radius: shot.radius,
    })),
    dangerLanes:
      state.combat.bossAttackState.telegraph?.lane !== undefined
        ? [state.combat.bossAttackState.telegraph.lane]
        : [],
    encounterCast: state.combat.bossAttackState.telegraph
      ? {
          kind: state.combat.bossAttackState.telegraph.kind,
          progress:
            1 -
            state.combat.bossAttackState.telegraph.remainingSec /
              Math.max(0.001, state.combat.bossAttackState.telegraph.maxSec),
        }
      : undefined,
    bossTelegraph: state.combat.bossAttackState.telegraph
      ? {
          kind: state.combat.bossAttackState.telegraph.kind,
          lane: state.combat.bossAttackState.telegraph.lane,
          targetX: state.combat.bossAttackState.telegraph.targetX,
          spread: state.combat.bossAttackState.telegraph.spread,
          progress:
            1 -
            state.combat.bossAttackState.telegraph.remainingSec /
              Math.max(0.001, state.combat.bossAttackState.telegraph.maxSec),
        }
      : undefined,
    bossSweep: state.combat.bossAttackState.sweep
      ? {
          lane: state.combat.bossAttackState.sweep.lane,
          progress:
            1 -
            state.combat.bossAttackState.sweep.remainingSec /
              Math.max(0.001, state.combat.bossAttackState.sweep.maxSec),
        }
      : undefined,
    fluxFieldActive: stageContext.stageModifier?.fluxField ?? false,
    stageModifierKey: stageContext.stageModifier?.key,
    warpZones: stageContext.stageModifier?.warpZones,
    paddleAuraColor: state.vfx.pickupAuraMs > 0 ? state.vfx.pickupAuraColor : undefined,
    ballAuraColor: state.vfx.pickupAuraMs > 0 ? state.vfx.pickupAuraColor : undefined,
  };
}

export function buildHudViewModel(state: GameState): HudViewModel {
  const stageContext = resolveStageMetadataFromState(state);
  const progressRatio = computeProgressRatio(state);
  const activeItems = getActiveItemEntries(state.items);
  const warningLevel = resolveWarningLevel(state);
  const hazardBoostActive = state.elapsedSec < state.hazard.speedBoostUntilSec;
  const pierceSlowSynergy =
    state.items.active.pierceStacks > 0 && state.items.active.slowBallStacks > 0;
  const boss = buildBossHud(state);
  const stageIntro = buildStageIntro(state, stageContext);
  return {
    score: state.score,
    lives: state.lives,
    elapsedSec: state.elapsedSec,
    comboMultiplier: state.combo.streak > 1 ? state.combo.multiplier : 1,
    stage: {
      current: state.campaign.stageIndex + 1,
      total: state.campaign.totalStages,
      route: state.campaign.resolvedRoute,
      modifierKey: stageContext.stageModifier?.key,
      boss,
      debugModeEnabled: state.options.debugModeEnabled,
      debugRecordResults: state.options.debugRecordResults,
    },
    activeItems,
    visual: buildVisualState(state, stageContext, warningLevel, stageIntro),
    missionProgress: state.stageStats.missionResults ?? [],
    flags: {
      hazardBoostActive,
      pierceSlowSynergy,
      magicCooldownSec: state.magic.cooldownSec,
      warpLegendVisible: Boolean(stageContext.stageModifier?.warpZones?.length),
      steelLegendVisible: stageContext.stageTags?.includes("steel") ?? false,
      generatorLegendVisible: stageContext.stageTags?.includes("generator") ?? false,
      gateLegendVisible: stageContext.stageTags?.includes("gate") ?? false,
      turretLegendVisible: stageContext.stageTags?.includes("turret") ?? false,
    },
    progressRatio,
    pickupToast: state.vfx.pickupToast
      ? {
          type: state.vfx.pickupToast.itemType,
          color: state.vfx.pickupToast.color,
          progress: state.vfx.pickupToast.lifeMs / Math.max(1, state.vfx.pickupToast.maxLifeMs),
        }
      : undefined,
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
    phase: Math.max(1, state.combat.bossPhase) as 1 | 2 | 3,
    intent:
      state.combat.bossAttackState.telegraph?.kind ??
      (state.combat.bossAttackState.sweep ? "sweep" : undefined),
    castProgress: state.combat.bossAttackState.telegraph
      ? 1 -
        state.combat.bossAttackState.telegraph.remainingSec /
          Math.max(0.001, state.combat.bossAttackState.telegraph.maxSec)
      : undefined,
    weakWindowProgress:
      state.combat.encounterState.vulnerabilitySec > 0
        ? state.combat.encounterState.vulnerabilitySec /
          Math.max(0.001, state.combat.encounterState.vulnerabilityMaxSec)
        : undefined,
  };
}

function buildStageIntro(
  state: GameState,
  stageContext: ReturnType<typeof resolveStageMetadataFromState>,
): VisualState["banner"] {
  if (state.scene !== "playing") {
    return undefined;
  }
  const sinceStart = state.elapsedSec - state.stageStats.startedAtSec;
  if (sinceStart < 0 || sinceStart > 1.15) {
    return undefined;
  }
  if (stageContext.stage.course === "ex") {
    return { kind: "ex", progress: sinceStart / 1.15 };
  }
  if (stageContext.stage.encounter?.kind === "boss") {
    return { kind: "boss", progress: sinceStart / 1.15 };
  }
  if (stageContext.stage.encounter?.kind === "midboss") {
    return { kind: "midboss", progress: sinceStart / 1.15 };
  }
  return { kind: "stage", progress: sinceStart / 1.15 };
}

function resolveWarningLevel(state: GameState): "calm" | "elevated" | "critical" {
  if (
    state.combat.bossAttackState.sweep ||
    state.combat.bossAttackState.telegraph?.kind === "gate_sweep"
  ) {
    return "critical";
  }
  if (state.combat.bossAttackState.telegraph || state.combat.encounterState.vulnerabilitySec > 0) {
    return "elevated";
  }
  return "calm";
}

export function buildOverlayViewModel(state: GameState): OverlayViewModel {
  const stageContext = resolveStageMetadataFromState(state);
  const warningLevel = resolveWarningLevel(state);
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
      current: state.campaign.stageIndex + 1,
      total: state.campaign.totalStages,
      debugModeEnabled: state.options.debugModeEnabled,
      debugRecordResults: state.options.debugRecordResults,
    },
    visual: buildVisualState(
      state,
      stageContext,
      warningLevel,
      buildStageIntro(state, stageContext),
    ),
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
    storyStageNumber:
      state.scene === "story" && typeof state.story.activeStageNumber === "number"
        ? (getStageStory(state.story.activeStageNumber) ?? undefined)
        : undefined,
  };
}

function buildVisualState(
  state: GameState,
  stageContext: ReturnType<typeof resolveStageMetadataFromState>,
  warningLevel: VisualState["warningLevel"],
  banner: VisualState["banner"],
): VisualState {
  const themeId = stageContext.visualProfile.id;
  return {
    themeId,
    assetProfileId: themeId,
    chapterLabel: stageContext.visualProfile.label,
    warningLevel,
    encounterEmphasis: resolveEncounterEmphasis(themeId),
    motionProfile: state.vfx.reducedMotion ? "reduced" : "full",
    banner: banner
      ? {
          kind: banner.kind,
          progress: clampBannerProgress(banner.progress),
        }
      : undefined,
    bossPhase:
      state.combat.bossPhase > 0
        ? {
            phase: Math.max(1, state.combat.bossPhase) as 1 | 2 | 3,
            warningLevel,
          }
        : undefined,
    tokens: resolveUiThemeTokens(stageContext.visualProfile, {
      warningLevel,
      highContrast: state.a11y.highContrast,
    }),
  };
}

function computeProgressRatio(state: GameState): number {
  const total = state.bricks.filter((brick) => (brick.kind ?? "normal") !== "steel").length;
  const alive = countAliveObjectiveBricks(state.bricks);
  return total <= 0 ? 0 : Math.max(0, Math.min(1, (total - alive) / total));
}
