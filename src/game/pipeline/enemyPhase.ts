import { COMBAT_CONFIG } from "../config";
import type { Ball, GameConfig, GameState, RandomSource } from "../types";

export interface EnemyHitEvent {
  kind: "brick";
  x: number;
  y: number;
  color?: string;
}

export interface EnemyHitResult {
  scoreGain: number;
  events: EnemyHitEvent[];
}

export function updateEnemies(state: GameState, config: GameConfig, deltaSec: number): void {
  if (state.enemies.length <= 0) {
    return;
  }
  for (const enemy of state.enemies) {
    if (!enemy.alive) {
      continue;
    }
    enemy.x += enemy.vx * deltaSec;
    const left = enemy.radius + 8;
    const right = config.width - enemy.radius - 8;
    if (enemy.x <= left) {
      enemy.x = left;
      enemy.vx = Math.abs(enemy.vx);
    } else if (enemy.x >= right) {
      enemy.x = right;
      enemy.vx = -Math.abs(enemy.vx);
    }
  }
}

export function updateEnemyWaveEvent(
  state: GameState,
  config: Pick<GameConfig, "width">,
  random: RandomSource,
  deltaSec: number,
  enabled: boolean,
): boolean {
  if (!enabled) {
    state.combat.enemyWaveCooldownSec = 0;
    return false;
  }
  state.combat.enemyWaveCooldownSec = Math.max(0, state.combat.enemyWaveCooldownSec - deltaSec);
  if (state.combat.enemyWaveCooldownSec > 0) {
    return false;
  }
  if (state.enemies.length >= 4) {
    state.combat.enemyWaveCooldownSec = 3.5;
    return false;
  }
  const nextId = state.enemies.reduce((max, enemy) => Math.max(max, enemy.id), 0) + 1;
  const stageFactor = Math.min(0.7, state.campaign.stageIndex * 0.035);
  const intervalSec = Math.max(3.2, 6.5 - stageFactor);
  state.combat.enemyWaveCooldownSec = intervalSec;
  state.enemies.push({
    id: nextId,
    x: 100 + random.next() * (config.width - 200),
    y: 136 + random.next() * 20,
    vx: random.next() > 0.5 ? 108 : -108,
    radius: 10,
    alive: true,
  });
  return true;
}

export function resolveEnemyHits(state: GameState, balls: Ball[], scoreScale: number): EnemyHitResult {
  let scoreGain = 0;
  const events: EnemyHitEvent[] = [];

  for (const ball of balls) {
    for (const enemy of state.enemies) {
      if (!enemy.alive) {
        continue;
      }
      const dx = ball.pos.x - enemy.x;
      const dy = ball.pos.y - enemy.y;
      const distanceSq = dx * dx + dy * dy;
      const limit = ball.radius + enemy.radius;
      if (distanceSq > limit * limit) {
        continue;
      }

      enemy.alive = false;
      scoreGain += Math.round(COMBAT_CONFIG.enemyDefeatScore * scoreScale);
      events.push({
        kind: "brick",
        x: enemy.x,
        y: enemy.y,
        color: "rgba(255, 168, 104, 0.9)",
      });

      const nextDy = Math.abs(ball.vel.y) < 80 ? -120 : -Math.abs(ball.vel.y);
      ball.vel.y = nextDy;
      ball.vel.x += dx >= 0 ? 24 : -24;
    }
  }

  state.enemies = state.enemies.filter((enemy) => enemy.alive);
  return { scoreGain, events };
}
