import { getPublicEncounterCatalog } from "../content";
import { getItemColor, ITEM_REGISTRY } from "../public/items";
import { createHiddenShopView, type ShopUiView } from "../public/shopView";
import type {
  BossLane,
  GameState,
  MetaProgress,
  OverlayViewModel,
  RenderViewState,
  StageModifierKey,
} from "../public";
import type { HudViewModel } from "../public/renderTypes";
import { getVisualProfile } from "../public/themes";
import {
  clampBannerProgress,
  resolveEncounterEmphasis,
  resolveUiThemeTokens,
  type VisualState,
} from "../public/uiTheme";
import { getStageModifier } from "../engine/stateFactory";

function createVisualState(state: GameState): VisualState {
  const profile = getVisualProfile(state.encounter.themeId);
  return {
    themeId: profile.id,
    assetProfileId: profile.id,
    chapterLabel: profile.label,
    warningLevel: state.ui.warningLevel,
    encounterEmphasis: resolveEncounterEmphasis(profile.id),
    motionProfile: state.ui.a11y.reducedMotion ? "reduced" : "full",
    tokens: resolveUiThemeTokens(profile, {
      warningLevel: state.ui.warningLevel,
      highContrast: state.ui.a11y.highContrast,
    }),
    backdropDepth: profile.backdropDepth,
    arenaFrame: profile.arenaFrame,
    blockMaterial: profile.blockMaterial,
    particleDensity: profile.particleDensity,
    cameraIntensity: profile.cameraIntensity,
    bossTone: profile.bossTone,
    banner:
      state.scene === "playing" && state.encounter.elapsedSec < 1.5
        ? {
            kind:
              profile.id === "midboss"
                ? "boss"
                : profile.id === "finalboss"
                  ? "boss"
                  : profile.id === "tier2"
                    ? "tier2"
                    : "stage",
            progress: clampBannerProgress(1 - state.encounter.elapsedSec / 1.5),
          }
        : undefined,
    bossPhase: state.encounter.boss
      ? {
          phase: state.encounter.boss.phase,
          warningLevel: state.ui.warningLevel,
        }
      : undefined,
  };
}

function buildModifierLanes(modifierKey?: StageModifierKey): BossLane[] | undefined {
  if (modifierKey === "enemy_flux") {
    return ["left", "right"];
  }
  if (modifierKey === "flux") {
    return ["center"];
  }
  return undefined;
}

export function projectHudView(state: GameState, meta: MetaProgress): HudViewModel {
  const visual = createVisualState(state);
  return {
    score: state.run.score,
    lives: state.run.lives,
    elapsedSec: state.run.elapsedSec,
    comboMultiplier: state.run.comboMultiplier,
    scoreFeed: [],
    stage: {
      current: state.run.progress.currentStageNumber,
      total: state.run.progress.totalEncounters,
      modifierKey: state.encounter.modifierKey,
      scoreFocus: state.encounter.scoreFocus,
      boss: state.encounter.boss
        ? {
            hp: state.encounter.boss.hp,
            maxHp: state.encounter.boss.maxHp,
            phase: state.encounter.boss.phase,
            intent: state.encounter.boss.intent,
            castProgress: state.encounter.boss.telegraphProgress,
            weakWindowProgress: state.encounter.boss.punishProgress,
          }
        : undefined,
      threatLevel: state.encounter.threatLevel,
      previewTags: state.encounter.previewTags,
    },
    missionProgress: [],
    activeItems: state.run.activeItems,
    visual,
    flags: {
      hazardBoostActive: state.encounter.modifierKey === "speed_ball",
      pierceSlowSynergy:
        state.run.activeItems.some((item) => item.type === "pierce") &&
        state.run.activeItems.some((item) => item.type === "slow_ball"),
      magicCooldownSec: state.combat.activeSkill.remainingCooldownSec,
      warpLegendVisible: state.encounter.modifierKey === "warp_zone",
      steelLegendVisible: state.combat.bricks.some((brick) => brick.kind === "steel"),
      generatorLegendVisible: state.combat.bricks.some((brick) => brick.kind === "generator"),
      gateLegendVisible: state.combat.bricks.some((brick) => brick.kind === "gate"),
      turretLegendVisible: state.combat.bricks.some((brick) => brick.kind === "turret"),
    },
    progressRatio:
      state.run.progress.totalEncounters <= 1
        ? 1
        : (state.run.progress.currentEncounterIndex + 1) / state.run.progress.totalEncounters,
    styleBonus: {
      chainLevel: Math.round(state.run.comboMultiplier * 10) / 10,
      lastBonusLabel: state.run.comboMultiplier > 1 ? "CHAIN" : null,
      lastBonusScore: state.run.comboMultiplier > 1 ? 100 : 0,
    },
    record: {
      currentRunRecord: state.run.record.currentRunRecord,
      deltaToBest: state.run.record.deltaToBest,
      courseBestScore:
        state.run.threatTier === 2 ? meta.records.tier2BestScore : meta.records.tier1BestScore,
    },
    pickupToast: state.ui.pickupToast,
  };
}

export function projectOverlayView(state: GameState, meta: MetaProgress): OverlayViewModel {
  const visual = createVisualState(state);
  const courseBest =
    state.run.threatTier === 2 ? meta.records.tier2BestScore : meta.records.tier1BestScore;
  return {
    scene: state.scene,
    score: state.run.score,
    lives: state.run.lives,
    stage: {
      current: state.run.progress.currentStageNumber,
      total: state.run.progress.totalEncounters,
    },
    visual,
    record: {
      overallBestScore: meta.records.overallBestScore,
      courseBestScore: courseBest,
      latestRunScore: meta.records.latestRunScore,
      deltaToBest: state.run.score - courseBest,
      currentRunRecord: state.run.score >= courseBest && state.run.score > 0,
    },
    clearElapsedSec: state.scene === "clear" ? state.run.elapsedSec : undefined,
    error: state.ui.overlayError,
    stageResult:
      state.scene === "stageclear"
        ? state.run.stageResults[state.run.stageResults.length - 1]
        : undefined,
    campaignResults: state.scene === "clear" ? state.run.stageResults : undefined,
  };
}

export function projectShopView(state: GameState): ShopUiView {
  const offer = state.encounter.shop.lastOffer;
  if (!offer || state.scene !== "playing") {
    return createHiddenShopView();
  }
  const encounters = getPublicEncounterCatalog(state.run.threatTier);
  const nextEncounter = encounters[state.run.progress.currentEncounterIndex + 1] ?? null;
  const optionA = ITEM_REGISTRY[offer.options[0]];
  const optionB = ITEM_REGISTRY[offer.options[1]];
  const disabled = state.encounter.shop.purchased || state.run.score < offer.cost;
  return {
    visible: true,
    status: state.encounter.shop.purchased ? "purchased" : "one_time",
    cost: offer.cost,
    priceBandVisible: true,
    optionAType: offer.options[0],
    optionBType: offer.options[1],
    optionADisabled: disabled,
    optionBDisabled: disabled,
    optionA: {
      type: offer.options[0],
      role: optionA.roleTag,
      previewAffinity: optionA.previewAffinity,
      counterplayTags: optionA.counterplayTags,
    },
    optionB: {
      type: offer.options[1],
      role: optionB.roleTag,
      previewAffinity: optionB.previewAffinity,
      counterplayTags: optionB.counterplayTags,
    },
    previewStageNumber: nextEncounter?.stageNumber ?? null,
    previewFocus: nextEncounter?.scoreFocus ?? null,
    previewTags: nextEncounter?.previewTags ?? [],
  };
}

export function projectRenderView(state: GameState): RenderViewState {
  const visual = createVisualState(state);
  const modifier = getStageModifier(state.encounter.stageNumber);
  return {
    scene: state.scene,
    elapsedSec: state.run.elapsedSec,
    bricks: state.combat.bricks,
    paddle: {
      ...state.combat.paddle,
      glowActive: state.ui.warningLevel !== "calm",
    },
    balls: state.combat.balls,
    trail: state.combat.trail,
    particles: state.combat.particles,
    impactRings: state.combat.impactRings,
    floatingTexts: state.combat.floatingTexts,
    flashMs: state.combat.flashMs,
    flashColor: visual.tokens.danger,
    reducedMotion: state.ui.a11y.reducedMotion,
    highContrast: state.ui.a11y.highContrast,
    shake: {
      active: state.ui.warningLevel !== "calm",
      offset: { x: 0, y: 0 },
    },
    fallingItems: state.combat.fallingItems,
    progressRatio:
      state.run.progress.totalEncounters <= 1
        ? 1
        : (state.run.progress.currentEncounterIndex + 1) / state.run.progress.totalEncounters,
    themeBandId: visual.themeId,
    visual,
    arena: {
      depth: visual.backdropDepth,
      frame: visual.arenaFrame,
      blockMaterial: visual.blockMaterial,
      particleDensity: visual.particleDensity,
      cameraIntensity: visual.cameraIntensity,
      threatLevel: state.encounter.threatLevel,
    },
    slowBallActive: state.run.activeItems.some((item) => item.type === "slow_ball"),
    multiballActive: state.run.activeItems.some((item) => item.type === "multiball"),
    shieldCharges: state.run.activeItems.find((item) => item.type === "shield")?.count ?? 0,
    showSceneOverlayTint: state.scene !== "playing",
    enemies:
      state.encounter.modifierKey === "enemy_flux"
        ? [{ id: 1, x: 220, y: 170, radius: 12, alive: true }]
        : [],
    laserProjectiles: [],
    bossProjectiles: state.combat.bossProjectiles,
    bossTelegraph:
      state.encounter.boss && state.encounter.boss.telegraphProgress > 0
        ? {
            kind: state.encounter.boss.intent ?? "volley",
            lane: state.encounter.boss.lane,
            targetX: state.encounter.boss.targetX,
            spread: state.encounter.boss.spread,
            progress: state.encounter.boss.telegraphProgress,
          }
        : undefined,
    bossSweep:
      state.encounter.boss &&
      state.encounter.boss.intent === "sweep" &&
      state.encounter.boss.attackProgress > 0
        ? {
            lane: state.encounter.boss.lane ?? "center",
            progress: state.encounter.boss.attackProgress,
          }
        : undefined,
    dangerLanes: buildModifierLanes(state.encounter.modifierKey),
    encounterCast:
      state.encounter.boss && state.encounter.boss.telegraphProgress > 0
        ? {
            kind: state.encounter.boss.intent ?? "volley",
            progress: state.encounter.boss.telegraphProgress,
          }
        : undefined,
    activeCues:
      state.ui.warningLevel === "calm"
        ? []
        : [
            {
              kind: "warning",
              severity: state.encounter.threatLevel,
              progress: 1,
            },
          ],
    fluxFieldActive:
      state.encounter.modifierKey === "enemy_flux" || state.encounter.modifierKey === "flux",
    stageModifierKey: state.encounter.modifierKey,
    warpZones: modifier.warpZones,
    paddleAuraColor: state.run.activeItems.find((item) => item.type === "shield")
      ? getItemColor("shield")
      : undefined,
    ballAuraColor: state.run.activeItems.find((item) => item.type === "slow_ball")
      ? getItemColor("slow_ball")
      : undefined,
  };
}
