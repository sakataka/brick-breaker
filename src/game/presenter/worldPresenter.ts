import type { RenderViewState } from "../renderTypes";
import { resolveStageMetadataFromState } from "../stageContext";
import type { GameState } from "../types";
import {
  buildStageIntro,
  buildVisualState,
  computeProgressRatio,
  resolveWarningLevel,
} from "./shared";

export function buildRenderViewState(state: GameState): RenderViewState {
  const stageContext = resolveStageMetadataFromState(state);
  const progressRatio = computeProgressRatio(state);
  const warningLevel = resolveWarningLevel(state);
  const stageIntro = buildStageIntro(state, stageContext);

  return {
    scene: state.scene,
    elapsedSec: state.run.elapsedSec,
    bricks: state.combat.bricks,
    paddle: {
      x: state.combat.paddle.x,
      y: state.combat.paddle.y,
      width: state.combat.paddle.width,
      height: state.combat.paddle.height,
      glowActive: state.combat.items.active.paddlePlusStacks > 0,
    },
    balls: state.combat.balls,
    trail: state.ui.vfx.trail,
    particles: state.ui.vfx.particles,
    impactRings: state.ui.vfx.impactRings,
    floatingTexts: state.ui.vfx.floatingTexts,
    flashMs: state.ui.vfx.flashMs,
    flashColor: state.ui.vfx.flashColor,
    reducedMotion: state.ui.vfx.reducedMotion,
    highContrast: state.ui.a11y.highContrast,
    shake: {
      active: !state.ui.vfx.reducedMotion && state.ui.vfx.shakeMs > 0 && state.ui.vfx.shakePx > 0,
      offset: state.ui.vfx.shakeOffset,
    },
    fallingItems: state.combat.items.falling,
    progressRatio,
    themeBandId: stageContext.themeBand.id,
    visual: buildVisualState(state, stageContext, warningLevel, stageIntro),
    arena: {
      depth: stageContext.stage.visualProfile?.depth ?? stageContext.visualProfile.backdropDepth,
      frame: stageContext.stage.visualProfile?.arenaFrame ?? stageContext.visualProfile.arenaFrame,
      blockMaterial:
        stageContext.stage.visualProfile?.blockMaterial ?? stageContext.visualProfile.blockMaterial,
      particleDensity:
        stageContext.stage.visualProfile?.particleDensity ??
        stageContext.visualProfile.particleDensity,
      cameraIntensity:
        stageContext.stage.visualProfile?.cameraIntensity ??
        stageContext.visualProfile.cameraIntensity,
      threatLevel: state.encounter.threatLevel,
    },
    slowBallActive: state.combat.items.active.slowBallStacks > 0,
    multiballActive: state.combat.items.active.multiballStacks > 0,
    shieldCharges: state.combat.items.active.shieldCharges,
    showSceneOverlayTint: state.scene !== "playing",
    enemies: state.combat.enemies,
    laserProjectiles: state.combat.laserProjectiles.map((shot) => ({
      id: shot.id,
      x: shot.x,
      y: shot.y,
    })),
    bossProjectiles: state.encounter.runtime.projectiles.map((shot) => ({
      id: shot.id,
      x: shot.x,
      y: shot.y,
      radius: shot.radius,
      source: shot.source,
      style:
        shot.source === "turret"
          ? state.combat.enemyProjectileStyle.turretProfile
          : state.combat.enemyProjectileStyle.bossProfile,
    })),
    dangerLanes:
      state.encounter.runtime.telegraph?.lane !== undefined
        ? [state.encounter.runtime.telegraph.lane]
        : [],
    encounterCast: state.encounter.runtime.telegraph
      ? {
          kind: state.encounter.runtime.telegraph.kind,
          progress:
            1 -
            state.encounter.runtime.telegraph.remainingSec /
              Math.max(0.001, state.encounter.runtime.telegraph.maxSec),
        }
      : undefined,
    bossTelegraph: state.encounter.runtime.telegraph
      ? {
          kind: state.encounter.runtime.telegraph.kind,
          lane: state.encounter.runtime.telegraph.lane,
          targetX: state.encounter.runtime.telegraph.targetX,
          spread: state.encounter.runtime.telegraph.spread,
          progress:
            1 -
            state.encounter.runtime.telegraph.remainingSec /
              Math.max(0.001, state.encounter.runtime.telegraph.maxSec),
        }
      : undefined,
    bossSweep: state.encounter.runtime.sweep
      ? {
          lane: state.encounter.runtime.sweep.lane,
          progress:
            1 -
            state.encounter.runtime.sweep.remainingSec /
              Math.max(0.001, state.encounter.runtime.sweep.maxSec),
        }
      : undefined,
    activeCues: state.encounter.runtime.activeCues.map((cue) => ({
      kind: cue.kind,
      severity: cue.severity,
      progress: 1 - cue.remainingSec / Math.max(0.001, cue.maxSec),
    })),
    fluxFieldActive: stageContext.stageModifier?.fluxField ?? false,
    stageModifierKey: stageContext.stageModifier?.key,
    warpZones: stageContext.stageModifier?.warpZones,
    paddleAuraColor: state.ui.vfx.pickupAuraMs > 0 ? state.ui.vfx.pickupAuraColor : undefined,
    ballAuraColor: state.ui.vfx.pickupAuraMs > 0 ? state.ui.vfx.pickupAuraColor : undefined,
  };
}
