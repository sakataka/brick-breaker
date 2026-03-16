import { getDefaultBrickHp } from "../brickDamage";
import { isGeneratorRespawnTarget } from "../brickRules";
import { STAGE_CONTROL_CONFIG } from "../config";
import { pushEncounterCue } from "../encounterSystem";
import type { Brick, GameState } from "../types";

export function updateStageControlBricks(
  state: GameState,
  options: {
    generatorActive: boolean;
    gateActive: boolean;
    turretActive: boolean;
  },
  deltaSec: number,
): void {
  for (const brick of state.combat.bricks) {
    if (brick.kind === "generator" && brick.alive && options.generatorActive) {
      updateGenerator(state, brick, deltaSec);
      continue;
    }
    if (brick.kind === "gate" && options.gateActive) {
      updateGate(state, brick, deltaSec);
      continue;
    }
    if (brick.kind === "turret" && brick.alive && options.turretActive) {
      updateTurret(state, brick, deltaSec);
    }
  }
}

function updateGenerator(state: GameState, brick: Brick, deltaSec: number): void {
  brick.cooldownSec = Math.max(0, (brick.cooldownSec ?? 0) - deltaSec);
  if ((brick.cooldownSec ?? 0) > 0) {
    return;
  }
  const target = findGeneratorTarget(state.combat.bricks, brick);
  brick.cooldownSec = STAGE_CONTROL_CONFIG.generatorRespawnIntervalSec;
  if (!target) {
    return;
  }
  target.alive = true;
  target.hp = getDefaultBrickHp(target);
  target.maxHp = getDefaultBrickHp(target);
  state.encounter.stats.generatorShutdown = false;
  state.ui.vfx.floatingTexts.push({
    key: "generator",
    pos: { x: target.x + target.width / 2, y: target.y + target.height / 2 },
    lifeMs: 360,
    maxLifeMs: 360,
    color: "rgba(132, 255, 196, 0.95)",
  });
  state.ui.vfx.impactRings.push({
    pos: { x: target.x + target.width / 2, y: target.y + target.height / 2 },
    radiusStart: 4,
    radiusEnd: 24,
    lifeMs: 200,
    maxLifeMs: 200,
    color: "rgba(132, 255, 196, 0.82)",
  });
  pushEncounterCue(state, "relay_online", "medium", 1.15);
}

function updateGate(state: GameState, brick: Brick, deltaSec: number): void {
  brick.cooldownSec = Math.max(0, (brick.cooldownSec ?? 0) - deltaSec);
  if ((brick.cooldownSec ?? 0) > 0) {
    return;
  }
  brick.cooldownSec = STAGE_CONTROL_CONFIG.gateCycleSec;
  brick.alive = !brick.alive;
  state.ui.vfx.floatingTexts.push({
    key: "gate",
    pos: { x: brick.x + brick.width / 2, y: brick.y + brick.height / 2 },
    lifeMs: 260,
    maxLifeMs: 260,
    color: brick.alive ? "rgba(255, 214, 142, 0.92)" : "rgba(130, 180, 255, 0.9)",
  });
  pushEncounterCue(state, "shield_online", "medium", 0.95);
}

function updateTurret(state: GameState, brick: Brick, deltaSec: number): void {
  brick.cooldownSec = Math.max(0, (brick.cooldownSec ?? 0) - deltaSec);
  if ((brick.cooldownSec ?? 0) > 0) {
    return;
  }
  brick.cooldownSec = STAGE_CONTROL_CONFIG.turretFireIntervalSec;
  const targetX = state.combat.paddle.x + state.combat.paddle.width / 2;
  const centerX = brick.x + brick.width / 2;
  const centerY = brick.y + brick.height + 10;
  const dx = targetX - centerX;
  const dy = state.combat.paddle.y - centerY;
  const length = Math.max(1, Math.hypot(dx, dy));
  state.encounter.runtime.projectiles.push({
    id: state.encounter.runtime.nextProjectileId,
    x: centerX,
    y: centerY,
    vx: (dx / length) * STAGE_CONTROL_CONFIG.turretProjectileSpeed,
    vy: (dy / length) * STAGE_CONTROL_CONFIG.turretProjectileSpeed,
    radius: STAGE_CONTROL_CONFIG.turretProjectileRadius,
    source: "turret",
  });
  state.encounter.runtime.nextProjectileId += 1;
  pushEncounterCue(state, "warning_lane", "high", 0.9);
  state.ui.vfx.floatingTexts.push({
    key: "turret",
    pos: { x: centerX, y: centerY },
    lifeMs: 220,
    maxLifeMs: 220,
    color: "rgba(255, 186, 132, 0.92)",
  });
}

function findGeneratorTarget(bricks: Brick[], generator: Brick): Brick | null {
  const generatorRow = generator.row ?? -99;
  const generatorCol = generator.col ?? -99;
  const inRange = bricks
    .filter(
      (brick) =>
        !brick.alive &&
        isGeneratorRespawnTarget(brick) &&
        typeof brick.row === "number" &&
        typeof brick.col === "number" &&
        Math.abs(brick.row - generatorRow) <= STAGE_CONTROL_CONFIG.generatorRespawnRange &&
        Math.abs(brick.col - generatorCol) <= STAGE_CONTROL_CONFIG.generatorRespawnRange,
    )
    .sort((a, b) => {
      const aDistance =
        Math.abs((a.row ?? 0) - generatorRow) + Math.abs((a.col ?? 0) - generatorCol);
      const bDistance =
        Math.abs((b.row ?? 0) - generatorRow) + Math.abs((b.col ?? 0) - generatorCol);
      if (aDistance !== bDistance) {
        return aDistance - bDistance;
      }
      return (a.id ?? 0) - (b.id ?? 0);
    });
  return inRange[0] ?? null;
}
