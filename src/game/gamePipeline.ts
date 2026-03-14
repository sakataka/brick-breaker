import type { SfxManager } from "../audio/sfx";
import { applyAssistToPaddle, getCurrentMaxBallSpeed } from "./assistSystem";
import { applyDirectBrickDamage } from "./brickDamage";
import { countAliveObjectiveBricks } from "./brickRules";
import { playCollisionSounds } from "./collisionEffects";
import { applyComboHits, normalizeCombo, resetCombo } from "./comboSystem";
import { getGameplayBalance, HAZARD_CONFIG } from "./config";
import {
  applyItemPickup,
  clearActiveItemEffects,
  ensureMultiballCount,
  getBombRadiusTiles,
  getHomingStrength,
  getLaserLevel,
  getPaddleScale,
  getPierceDepth,
  getRailLevel,
  getSlowBallMaxSpeedScale,
  spawnDropsFromBrickEvents,
  spawnGuaranteedDrop,
  syncMultiballStacksWithBallCount,
  updateFallingItems,
} from "./itemSystem";
import { runPhysicsForBalls } from "./physicsApply";
import { updateBossPhase } from "./pipeline/bossPhase";
import { processEliteBrickEvents } from "./pipeline/elitePhase";
import { resolveEnemyHits, updateEnemies, updateEnemyWaveEvent } from "./pipeline/enemyPhase";
import {
  syncHeldBallsSnapshot,
  updateAutoLaserSpawner,
  updateLaserProjectiles,
} from "./pipeline/laserPhase";
import { castMagicStrike } from "./pipeline/magicPhase";
import { processShieldBurst } from "./pipeline/shieldPhase";
import { ensureShopOffer } from "./pipeline/shopPhase";
import { updateStageControlBricks } from "./pipeline/stagePhase";
import { resolveStageContextFromState } from "./stageContext";
import type { Ball, CollisionEvent, GameConfig, GameState, ItemType, RandomSource } from "./types";
import { applyCollisionEvents, spawnItemPickupFeedback } from "./vfxSystem";

export { generateShopOffer } from "./pipeline/shopPhase";

export type PipelineOutcome = "continue" | "stageclear" | "ballloss";

export interface GamePipelineDeps {
  config: GameConfig;
  random: RandomSource;
  sfx: SfxManager;
  tryShieldRescue: (ball: Ball, maxSpeed: number) => boolean;
  playPickupSfx: (itemType: ItemType) => void;
  playComboFillSfx: () => void;
  playMagicCastSfx: () => void;
}

interface PlayingTickContext {
  balance: ReturnType<typeof getGameplayBalance>;
  hadAliveBricksBeforeTick: boolean;
  stageContext: ReturnType<typeof resolveStageContextFromState>;
  pipelineDeltaSec: number;
  maxWithAssist: number;
  effectiveMaxSpeed: number;
  pierceDepth: number;
  bombRadiusTiles: number;
  homingStrength: number;
  railLevel: number;
  laserLevel: number;
  scoreScale: number;
}

export function stepPlayingPipeline(state: GameState, deps: GamePipelineDeps): PipelineOutcome {
  const ctx = derivePlayingTickContext(state, deps);
  runStageSystemsPhase(state, deps, ctx);

  const projectileEvents = updateLaserProjectiles(state, ctx.pipelineDeltaSec, ctx.railLevel);

  const basePaddleWidth = ctx.balance.paddleWidth * getPaddleScale(state.items);
  applyAssistToPaddle(
    state.paddle,
    basePaddleWidth,
    deps.config.width,
    state.assist,
    state.elapsedSec,
  );

  const physics = runPhysicsForBalls(
    state.balls,
    state.paddle,
    state.bricks,
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
  if (projectileEvents.length > 0) {
    physics.events.push(...projectileEvents);
  }
  if (state.items.active.pulseStacks > 0) {
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
  state.score += enemyHits.scoreGain;

  const destroyedBricks = physics.events.filter((event) => event.kind === "brick").length;
  const firstDestroyed = physics.events.find((event) => event.kind === "brick");
  if (!state.stageStats.firstDestroyedKind && firstDestroyed?.kind === "brick") {
    state.stageStats.firstDestroyedKind = firstDestroyed.brickKind;
  }
  const triggeredHazard = physics.events.some(
    (event) => event.kind === "brick" && event.brickKind === "hazard",
  );
  const comboRewardBefore = state.combo.rewardGranted;
  const comboFillBefore = state.combo.fillTriggered;
  const baseScoreGain = applyComboHits(
    state.combo,
    state.elapsedSec,
    destroyedBricks,
    ctx.balance.scorePerBrick,
  );
  state.score += Math.round(baseScoreGain * ctx.scoreScale);
  if (eliteEffects.scorePenalty > 0) {
    state.score = Math.max(0, state.score - eliteEffects.scorePenalty);
  }
  if (!comboFillBefore && state.combo.multiplier >= 2.5) {
    state.combo.fillTriggered = true;
    deps.playComboFillSfx();
  }
  const comboRewardTriggered = !comboRewardBefore && state.combo.rewardGranted;
  const hadBallDrop = physics.lostBalls > 0;
  const lostAllBalls = physics.survivors.length <= 0;
  playCollisionSounds(deps.sfx, physics.events);
  applyCollisionEvents(state.vfx, physics.events, deps.random);
  spawnDropsFromBrickEvents(state.items, physics.events, deps.random, {
    enabledItems: state.options.enabledItems,
  });
  if (comboRewardTriggered) {
    const rewardOrigin = physics.survivors[0] ?? state.balls[0];
    const rewardX = rewardOrigin?.pos.x ?? state.paddle.x + state.paddle.width / 2;
    const rewardY = rewardOrigin?.pos.y ?? state.paddle.y - 28;
    spawnGuaranteedDrop(state.items, deps.random, rewardX, rewardY, {
      enabledItems: state.options.enabledItems,
    });
  }

  const picks = updateFallingItems(
    state.items,
    state.paddle,
    deps.config.height,
    ctx.pipelineDeltaSec,
  );
  let pickedMultiball = false;
  const pickupCollisionEvents: CollisionEvent[] = [];
  for (const pick of picks) {
    const impact = applyItemPickup(state.items, pick.type, physics.survivors, {
      enableNewItemStacks: state.options.enableNewItemStacks,
      gameState: state,
      scorePerBrick: ctx.balance.scorePerBrick,
    });
    if ((impact.scoreGain ?? 0) > 0) {
      state.score += Math.round((impact.scoreGain ?? 0) * ctx.scoreScale);
    }
    if (impact.collisionEvents?.length) {
      pickupCollisionEvents.push(...impact.collisionEvents);
    }
    if (pick.type === "multiball") {
      pickedMultiball = true;
    }
    spawnItemPickupFeedback(state.vfx, pick.type, pick.pos.x, pick.pos.y);
  }
  if (pickupCollisionEvents.length > 0) {
    applyCollisionEvents(state.vfx, pickupCollisionEvents, deps.random);
  }
  for (const pick of picks.slice(0, 2)) {
    deps.playPickupSfx(pick.type);
  }

  if (triggeredHazard) {
    state.items.active.slowBallStacks = 0;
    state.hazard.speedBoostUntilSec = state.elapsedSec + HAZARD_CONFIG.durationSec;
    const boostedMaxSpeed = ctx.maxWithAssist * HAZARD_CONFIG.maxSpeedScale;
    for (const ball of physics.survivors) {
      const speed = Math.hypot(ball.vel.x, ball.vel.y);
      const target = Math.min(boostedMaxSpeed, speed * HAZARD_CONFIG.instantSpeedScale);
      if (speed <= 0 || target <= 0) {
        continue;
      }
      const scale = target / speed;
      ball.vel.x *= scale;
      ball.vel.y *= scale;
      ball.speed = target;
    }
  }
  if (!state.bricks.some((brick) => brick.alive && brick.kind === "generator")) {
    state.stageStats.generatorShutdown = true;
  }

  if (lostAllBalls) {
    clearActiveItemEffects(state.items);
    state.combat.laserProjectiles = [];
    state.combat.laserCooldownSec = 0;
  }
  castMagicStrike(state, ctx.scoreScale, deps.random, deps.playMagicCastSfx);
  if (hadBallDrop) {
    resetCombo(state.combo);
  } else {
    normalizeCombo(state.combo, state.elapsedSec);
  }

  state.balls =
    pickedMultiball && !hadBallDrop
      ? ensureMultiballCount(
          state.items,
          physics.survivors,
          deps.random,
          deps.config.multiballMaxBalls,
        )
      : physics.survivors;
  syncMultiballStacksWithBallCount(state.items, state.balls);
  syncHeldBallsSnapshot(state);
  if (!lostAllBalls) {
    updateAutoLaserSpawner(state, ctx.pipelineDeltaSec, ctx.laserLevel);
  }

  const forcedBallLoss = state.combat.forcedBallLoss;
  if (forcedBallLoss) {
    state.combat.forcedBallLoss = false;
    clearActiveItemEffects(state.items);
    state.balls = [];
    state.combat.laserProjectiles = [];
    state.combat.laserCooldownSec = 0;
    return "ballloss";
  }

  const clearedAfterMagic =
    ctx.hadAliveBricksBeforeTick && countAliveObjectiveBricks(state.bricks) <= 0;
  if (physics.hasClear || clearedAfterMagic) {
    return "stageclear";
  }
  if (state.balls.length <= 0) {
    return "ballloss";
  }
  return "continue";
}

function derivePlayingTickContext(state: GameState, deps: GamePipelineDeps): PlayingTickContext {
  const balance = getGameplayBalance(deps.config.difficulty);
  const hadAliveBricksBeforeTick = countAliveObjectiveBricks(state.bricks) > 0;
  const stageContext = resolveStageContextFromState(state, deps.config);
  const pipelineDeltaSec = deps.config.fixedDeltaSec;
  state.magic.cooldownSec = Math.max(0, state.magic.cooldownSec - pipelineDeltaSec);
  state.elapsedSec += pipelineDeltaSec;
  const bossPhaseSpeedScale = updateBossPhase(
    state,
    deps.config,
    deps.random,
    deps.sfx,
    pipelineDeltaSec,
  );
  const maxWithAssist = getCurrentMaxBallSpeed(
    stageContext.maxBallSpeed,
    state.assist,
    state.elapsedSec,
  );
  const hazardSpeedScale =
    state.elapsedSec < state.hazard.speedBoostUntilSec ? HAZARD_CONFIG.maxSpeedScale : 1;
  const modifierSpeedScale = stageContext.stageModifier?.maxSpeedScale ?? 1;
  return {
    balance,
    hadAliveBricksBeforeTick,
    stageContext,
    pipelineDeltaSec,
    maxWithAssist,
    effectiveMaxSpeed:
      maxWithAssist *
      getSlowBallMaxSpeedScale(state.items) *
      hazardSpeedScale *
      modifierSpeedScale *
      bossPhaseSpeedScale,
    pierceDepth: getPierceDepth(state.items),
    bombRadiusTiles: getBombRadiusTiles(state.items),
    homingStrength: getHomingStrength(state.items),
    railLevel: getRailLevel(state.items),
    laserLevel: getLaserLevel(state.items),
    scoreScale: 1,
  };
}

function runStageSystemsPhase(
  state: GameState,
  deps: GamePipelineDeps,
  ctx: PlayingTickContext,
): void {
  ensureShopOffer(
    state,
    deps.random,
    state.options.enabledItems,
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
    state.vfx.floatingTexts.push({
      key: "reinforce",
      pos: { x: deps.config.width / 2, y: 114 },
      lifeMs: 440,
      maxLifeMs: 440,
      color: "rgba(255, 182, 122, 0.95)",
    });
  }
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
  const centerX = state.paddle.x + state.paddle.width / 2;
  const centerY = state.paddle.y - 18;
  const collisionEvents: CollisionEvent[] = [];
  for (const brick of state.bricks) {
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
    state.score += scorePerBrick;
  }
  if (collisionEvents.length > 0) {
    state.vfx.impactRings.push({
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
