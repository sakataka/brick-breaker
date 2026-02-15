import { applyDirectBrickDamage } from "../brickDamage";
import { COMBAT_CONFIG, ITEM_BALANCE } from "../config";
import type { GameState } from "../types";

export interface LaserHitEvent {
  kind: "brick";
  x: number;
  y: number;
  color?: string;
  brickKind?: GameState["bricks"][number]["kind"];
}

export function updateLaserProjectiles(state: GameState, deltaSec: number, railLevel = 0): LaserHitEvent[] {
  if (state.combat.laserProjectiles.length <= 0) {
    return [];
  }
  const maxHitsPerShot =
    railLevel >= 2
      ? ITEM_BALANCE.railPierceHitsByLevel[1]
      : railLevel >= 1
        ? ITEM_BALANCE.railPierceHitsByLevel[0]
        : 1;
  const events: LaserHitEvent[] = [];
  const nextProjectiles = [];
  for (const shot of state.combat.laserProjectiles) {
    const nextY = shot.y - shot.speed * deltaSec;
    const yTop = Math.min(nextY, shot.y);
    const yBottom = Math.max(nextY, shot.y);
    const candidates = state.bricks
      .filter(
        (brick) =>
          brick.alive &&
          shot.x >= brick.x &&
          shot.x <= brick.x + brick.width &&
          yBottom >= brick.y &&
          yTop <= brick.y + brick.height,
      )
      .sort((a, b) => b.y - a.y);
    let hits = 0;
    for (const hitBrick of candidates) {
      const destroyed = applyDirectBrickDamage(hitBrick);
      if (destroyed) {
        events.push({
          kind: "brick",
          x: hitBrick.x + hitBrick.width / 2,
          y: hitBrick.y + hitBrick.height / 2,
          color: hitBrick.color,
          brickKind: hitBrick.kind ?? "normal",
        });
      }
      hits += 1;
      if (hits >= maxHitsPerShot) {
        break;
      }
    }
    if (hits >= maxHitsPerShot || nextY < 0) {
      continue;
    }
    nextProjectiles.push({
      ...shot,
      y: nextY,
    });
  }
  state.combat.laserProjectiles = nextProjectiles;
  return events;
}

export function updateAutoLaserSpawner(state: GameState, deltaSec: number, laserLevel: number): void {
  if (laserLevel <= 0) {
    state.combat.laserCooldownSec = 0;
    state.combat.laserProjectiles = [];
    return;
  }
  const interval =
    laserLevel >= 2
      ? ITEM_BALANCE.laserFireIntervalSecByLevel[1]
      : ITEM_BALANCE.laserFireIntervalSecByLevel[0];
  state.combat.laserCooldownSec = Math.max(0, state.combat.laserCooldownSec - deltaSec);
  while (state.combat.laserCooldownSec <= 0) {
    if (state.combat.laserProjectiles.length < COMBAT_CONFIG.laserMaxProjectiles) {
      state.combat.laserProjectiles.push({
        id: state.combat.nextLaserId,
        x: state.paddle.x + state.paddle.width / 2,
        y: state.paddle.y - COMBAT_CONFIG.laserSpawnYOffset,
        speed: ITEM_BALANCE.laserProjectileSpeed,
      });
      state.combat.nextLaserId += 1;
    }
    state.combat.laserCooldownSec += interval;
  }
}

export function syncHeldBallsSnapshot(state: GameState): void {
  state.combat.heldBalls = state.balls
    .filter((ball) => (ball.stickTimerSec ?? 0) > 0)
    .map((ball) => ({
      xOffsetRatio: ball.stickOffsetRatio ?? 0,
      remainingSec: ball.stickTimerSec ?? 0,
    }));
}
