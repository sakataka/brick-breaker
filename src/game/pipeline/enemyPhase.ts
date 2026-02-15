import { COMBAT_CONFIG } from "../config";
import type { Ball, GameConfig, GameState } from "../types";

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
