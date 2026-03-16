import { HAZARD_CONFIG } from "../config";
import {
  applyItemPickup,
  clearActiveItemEffects,
  spawnDropsFromBrickEvents,
  updateFallingItems,
} from "../itemSystem";
import { playCollisionSounds } from "../collisionEffects";
import { pushScoreFeed } from "../scoreSystem";
import { applyCollisionEvents, spawnItemPickupFeedback } from "../vfxSystem";
import type { CollisionEvent, GameState } from "../types";
import type {
  CollisionPhaseResult,
  CombatSimulationPhaseResult,
  EncounterScriptPhaseResult,
  GamePipelineDeps,
  TickContext,
} from "./gamePipelineTypes";

export function resolveCollisionPhase(
  state: GameState,
  deps: GamePipelineDeps,
  ctx: TickContext,
  encounter: EncounterScriptPhaseResult,
  combat: CombatSimulationPhaseResult,
): CollisionPhaseResult {
  playCollisionSounds(deps.sfx, combat.physics.events);
  applyCollisionEvents(state.ui.vfx, combat.physics.events, deps.random);
  spawnDropsFromBrickEvents(state.combat.items, combat.physics.events, deps.random, {
    enabledItems: state.run.modulePolicy.enabledTypes,
  });

  const hadBallDrop = combat.physics.lostBalls > 0;
  const lostAllBalls = combat.physics.survivors.length <= 0;
  const comboRewardBefore = state.run.combo.rewardGranted;
  const comboFillBefore = state.run.combo.fillTriggered;
  let pickedMultiball = false;

  const picks = updateFallingItems(
    state.combat.items,
    state.combat.paddle,
    deps.config.height,
    ctx.pipelineDeltaSec,
  );
  const pickupCollisionEvents: CollisionEvent[] = [];
  for (const pick of picks) {
    const impact = applyItemPickup(state.combat.items, pick.type, combat.physics.survivors, {
      enableNewItemStacks: state.run.modulePolicy.allowExtendedStacks,
      gameState: { combat: state.combat, ui: state.ui },
      scorePerBrick: ctx.balance.scorePerBrick,
    });
    if ((impact.scoreGain ?? 0) > 0) {
      const gain = Math.round((impact.scoreGain ?? 0) * ctx.scoreScale);
      state.run.score += gain;
      pushScoreFeed(state, createFeedEntry("ITEM BURST", gain, "score"));
    }
    if (impact.collisionEvents?.length) {
      pickupCollisionEvents.push(...impact.collisionEvents);
    }
    if (pick.type === "multiball") {
      pickedMultiball = true;
    }
    spawnItemPickupFeedback(state.ui.vfx, pick.type, pick.pos.x, pick.pos.y);
  }
  if (pickupCollisionEvents.length > 0) {
    applyCollisionEvents(state.ui.vfx, pickupCollisionEvents, deps.random);
  }
  for (const pick of picks.slice(0, 2)) {
    deps.playPickupSfx(pick.type);
  }

  if (encounter.canceledShots > 0) {
    state.encounter.stats.canceledShots =
      (state.encounter.stats.canceledShots ?? 0) + encounter.canceledShots;
  }
  if (!state.encounter.stats.firstDestroyedKind && combat.firstDestroyedBrickKind) {
    state.encounter.stats.firstDestroyedKind = combat.firstDestroyedBrickKind;
  }
  if (combat.triggeredHazard) {
    state.combat.items.active.slowBallStacks = 0;
    state.combat.hazard.speedBoostUntilSec = state.run.elapsedSec + HAZARD_CONFIG.durationSec;
    const boostedMaxSpeed = ctx.maxWithAssist * HAZARD_CONFIG.maxSpeedScale;
    for (const ball of combat.physics.survivors) {
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
  if (!state.combat.bricks.some((brick) => brick.alive && brick.kind === "generator")) {
    state.encounter.stats.generatorShutdown = true;
  }
  if (lostAllBalls) {
    clearActiveItemEffects(state.combat.items);
    state.combat.laserProjectiles = [];
    state.combat.laserCooldownSec = 0;
  }

  return {
    hadBallDrop,
    lostAllBalls,
    pickedMultiball,
    comboRewardBefore,
    comboFillBefore,
    physics: combat.physics,
  };
}

function createFeedEntry(
  label: string,
  amount: number,
  tone: "score" | "style" | "record",
): {
  label: string;
  amount: number;
  tone: "score" | "style" | "record";
  lifeMs: number;
  maxLifeMs: number;
} {
  return {
    label,
    amount,
    tone,
    lifeMs: 1600,
    maxLifeMs: 1600,
  };
}
