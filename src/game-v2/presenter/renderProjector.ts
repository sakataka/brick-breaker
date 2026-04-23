import { getItemColor } from "../public/items";
import type { GameState, RenderViewState } from "../public";
import { getStageModifier } from "../engine/stateFactory";
import { buildModifierLanes, calculateProgressRatio } from "./projectionHelpers";
import { createVisualState } from "./visualProjector";

export function projectRenderView(state: GameState): RenderViewState {
  const visual = createVisualState(state);
  const modifier = getStageModifier(state.run.threatTier, state.encounter.stageNumber);
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
    progressRatio: calculateProgressRatio(state),
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
