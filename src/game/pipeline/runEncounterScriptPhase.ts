import { getBossDefinition } from "../config/bosses";
import { pushEncounterCue } from "../encounterSystem";
import { updateEnemies, updateEnemyWaveEvent } from "./enemyPhase";
import { updateLaserProjectiles } from "./laserPhase";
import { ensureShopOffer } from "./shopPhase";
import { updateStageControlBricks } from "./stagePhase";
import type { GameState } from "../types";
import type {
  EncounterScriptPhaseResult,
  GamePipelineDeps,
  TickContext,
} from "./gamePipelineTypes";

export function runEncounterScriptPhase(
  state: GameState,
  deps: GamePipelineDeps,
  ctx: TickContext,
): EncounterScriptPhaseResult {
  ensureShopOffer(
    state,
    deps.random,
    state.run.modulePolicy.enabledTypes,
    ctx.stageContext.effectiveStageIndex,
  );
  updateStageControlBricks(
    state,
    {
      generatorActive: ctx.stageContext.stageEvents?.includes("generator_respawn") === true,
      gateActive: ctx.stageContext.stageEvents?.includes("gate_cycle") === true,
      turretActive: ctx.stageContext.stageEvents?.includes("turret_fire") === true,
    },
    ctx.pipelineDeltaSec,
  );
  updateEnemies(state, deps.config, ctx.pipelineDeltaSec);
  if (
    updateEnemyWaveEvent(
      state,
      deps.config,
      deps.random,
      ctx.pipelineDeltaSec,
      (ctx.stageContext.stageModifier?.spawnEnemy ?? false) ||
        ctx.stageContext.stageEvents?.includes("enemy_pressure") === true,
    )
  ) {
    pushEncounterCue(state, "hazard_surge", "high", 1.3);
    state.ui.vfx.floatingTexts.push({
      key: "reinforce",
      pos: { x: deps.config.width / 2, y: 114 },
      lifeMs: 440,
      maxLifeMs: 440,
      color: "rgba(255, 182, 122, 0.95)",
    });
  }

  const projectileEvents = updateLaserProjectiles(state, ctx.pipelineDeltaSec, ctx.railLevel);
  const cancelResult = resolveEnemyProjectileCancels(state, ctx);
  return {
    projectileEvents,
    canceledShots: cancelResult.canceledShots,
    cancelScoreGain: cancelResult.scoreGain,
  };
}

function resolveEnemyProjectileCancels(
  state: GameState,
  ctx: TickContext,
): { canceledShots: number; scoreGain: number } {
  const projectiles = state.encounter.runtime.projectiles;
  if (projectiles.length <= 0) {
    return { canceledShots: 0, scoreGain: 0 };
  }
  const bossDefinition = getBossDefinition(state.encounter.runtime.profile);
  const cancelReward = bossDefinition?.cancelReward ?? 90;
  const remaining = [];
  let canceledShots = 0;
  for (const projectile of projectiles) {
    const canceledByLaser = state.combat.laserProjectiles.some(
      (laser) =>
        Math.abs(laser.x - projectile.x) <= projectile.radius + 8 &&
        Math.abs(laser.y - projectile.y) <= 18,
    );
    const canceledByBall = state.combat.balls.some((ball) => {
      const dx = ball.pos.x - projectile.x;
      const dy = ball.pos.y - projectile.y;
      return dx * dx + dy * dy <= (ball.radius + projectile.radius + 2) ** 2;
    });
    if (!canceledByLaser && !canceledByBall) {
      remaining.push(projectile);
      continue;
    }
    canceledShots += 1;
    state.ui.vfx.impactRings.push({
      pos: { x: projectile.x, y: projectile.y },
      radiusStart: 6,
      radiusEnd: 22,
      lifeMs: 180,
      maxLifeMs: 180,
      color: canceledByLaser ? "rgba(255, 210, 118, 0.92)" : "rgba(128, 244, 255, 0.9)",
    });
  }
  if (canceledShots > 0) {
    pushEncounterCue(state, "warning_lane", "medium", 0.55);
  }
  state.encounter.runtime.projectiles = remaining;
  return {
    canceledShots,
    scoreGain: canceledShots * Math.round(cancelReward * Math.max(1, ctx.scoreScale)),
  };
}
