import { applyDirectBrickDamage } from "../brickDamage";
import { resolveEnemyHits } from "./enemyPhase";
import { runPhysicsForBalls } from "../physicsApply";
import { processEliteBrickEvents } from "./elitePhase";
import { processShieldBurst } from "./shieldPhase";
import type { CollisionEvent, GameState } from "../types";
import type {
  CombatSimulationPhaseResult,
  EncounterScriptPhaseResult,
  GamePipelineDeps,
  TickContext,
} from "./gamePipelineTypes";

export function runCombatSimulationPhase(
  state: GameState,
  deps: GamePipelineDeps,
  ctx: TickContext,
  encounter: EncounterScriptPhaseResult,
): CombatSimulationPhaseResult {
  const physics = runPhysicsForBalls(
    state.combat.balls,
    state.combat.paddle,
    state.combat.bricks,
    deps.config,
    ctx.pipelineDeltaSec,
    {
      maxBallSpeed: ctx.effectiveMaxSpeed,
      initialBallSpeed: ctx.stageContext.initialBallSpeed,
      pierceDepth: ctx.pierceDepth,
      bombRadiusTiles: ctx.bombRadiusTiles,
      explodeOnHit: ctx.bombRadiusTiles > 0,
      homingStrength: ctx.homingStrength,
      fluxField: ctx.stageContext.stageModifier?.fluxField,
      warpZones: ctx.stageContext.stageModifier?.warpZones,
      onMiss: (target) => deps.tryShieldRescue(target, ctx.effectiveMaxSpeed),
    },
  );
  if (encounter.projectileEvents.length > 0) {
    physics.events.push(...encounter.projectileEvents);
  }
  if (state.combat.items.active.pulseStacks > 0) {
    const pulseEvents = applyPulseStrike(state, physics.events, ctx.balance.scorePerBrick);
    if (pulseEvents.length > 0) {
      physics.events.push(...pulseEvents);
    }
  }

  const enemyHits = resolveEnemyHits(state, physics.survivors, ctx.scoreScale);
  if (enemyHits.events.length > 0) {
    physics.events.push(...enemyHits.events);
  }
  const burstEvents = processShieldBurst(
    state,
    physics.survivors,
    ctx.effectiveMaxSpeed,
    deps.sfx,
    deps.random,
  );
  if (burstEvents.length > 0) {
    physics.events.push(...burstEvents);
  }
  const eliteEffects = processEliteBrickEvents(state, physics.events, deps.config, deps.random);
  const destroyedBricks = physics.events.filter((event) => event.kind === "brick").length;
  const firstDestroyed = physics.events.find((event) => event.kind === "brick");
  const triggeredHazard = physics.events.some(
    (event) => event.kind === "brick" && event.brickKind === "hazard",
  );

  return {
    physics,
    destroyedBricks,
    firstDestroyedBrickKind:
      firstDestroyed?.kind === "brick" ? firstDestroyed.brickKind : undefined,
    triggeredHazard,
    weakWindowActive: state.encounter.runtime.vulnerabilitySec > 0,
    enemyScoreGain: enemyHits.scoreGain,
    eliteScorePenalty: eliteEffects.scorePenalty,
  };
}

function applyPulseStrike(
  state: GameState,
  events: CollisionEvent[],
  scorePerBrick: number,
): CollisionEvent[] {
  const paddleHits = events.filter((event) => event.kind === "paddle");
  if (paddleHits.length <= 0) {
    return [];
  }
  const centerX = state.combat.paddle.x + state.combat.paddle.width / 2;
  const centerY = state.combat.paddle.y - 18;
  const collisionEvents: CollisionEvent[] = [];
  for (const brick of state.combat.bricks) {
    if (
      !brick.alive ||
      (brick.kind ?? "normal") === "steel" ||
      (brick.kind ?? "normal") === "gate"
    ) {
      continue;
    }
    const dx = brick.x + brick.width / 2 - centerX;
    const dy = brick.y + brick.height / 2 - centerY;
    if (dx * dx + dy * dy > 84 * 84) {
      continue;
    }
    if (!applyDirectBrickDamage(brick)) {
      continue;
    }
    collisionEvents.push({
      kind: "brick",
      x: brick.x + brick.width / 2,
      y: brick.y + brick.height / 2,
      color: brick.color,
      brickKind: brick.kind ?? "normal",
      brickId: brick.id,
    });
    state.run.score += scorePerBrick;
  }
  if (collisionEvents.length > 0) {
    state.ui.vfx.impactRings.push({
      pos: { x: centerX, y: centerY },
      radiusStart: 8,
      radiusEnd: 64,
      lifeMs: 220,
      maxLifeMs: 220,
      color: "rgba(168, 228, 255, 0.8)",
    });
  }
  return collisionEvents;
}
