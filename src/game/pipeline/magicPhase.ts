import { destroyBrickImmediately } from "../brickDamage";
import { COMBAT_CONFIG } from "../config";
import type { GameState, RandomSource } from "../types";

export function castMagicStrike(
  state: GameState,
  scoreScale: number,
  random: RandomSource,
  playMagicCastSfx: () => void,
): void {
  if (!state.magic.requestCast) {
    return;
  }
  state.magic.requestCast = false;
  if (state.magic.cooldownSec > 0) {
    return;
  }
  const target = selectMagicTarget(state);
  if (!target) {
    return;
  }
  if (!destroyBrickImmediately(target)) {
    return;
  }
  state.score += Math.round(COMBAT_CONFIG.magicStrikeScore * scoreScale);
  state.magic.cooldownSec = state.magic.cooldownMaxSec;
  state.vfx.flashMs = Math.max(state.vfx.flashMs, 90);
  state.vfx.shakeMs = Math.max(state.vfx.shakeMs, 80);
  state.vfx.shakePx = Math.max(state.vfx.shakePx, 3);
  state.vfx.floatingTexts.push({
    text: "SPELL",
    pos: { x: target.x + target.width / 2, y: target.y + target.height / 2 },
    lifeMs: 420,
    maxLifeMs: 420,
    color: "rgba(130, 247, 255, 0.92)",
  });
  state.vfx.impactRings.push({
    pos: { x: target.x + target.width / 2, y: target.y + target.height / 2 },
    radiusStart: 6,
    radiusEnd: 28,
    lifeMs: 220,
    maxLifeMs: 220,
    color: "rgba(130, 247, 255, 0.82)",
  });
  for (let i = 0; i < 8; i += 1) {
    const angle = random.next() * Math.PI * 2;
    const speed = 90 + random.next() * 110;
    state.vfx.particles.push({
      pos: { x: target.x + target.width / 2, y: target.y + target.height / 2 },
      vel: { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed },
      lifeMs: 240,
      maxLifeMs: 240,
      size: 2 + random.next() * 2.4,
      color: "rgba(130, 247, 255, 0.9)",
    });
  }
  playMagicCastSfx();
}

function selectMagicTarget(state: GameState): GameState["bricks"][number] | null {
  let best: GameState["bricks"][number] | null = null;
  let bestDistance = Number.POSITIVE_INFINITY;
  const originX = state.paddle.x + state.paddle.width / 2;
  const originY = state.paddle.y;
  for (const brick of state.bricks) {
    if (!brick.alive) {
      continue;
    }
    const cx = brick.x + brick.width / 2;
    const cy = brick.y + brick.height / 2;
    const dx = cx - originX;
    const dy = cy - originY;
    const distance = dx * dx + dy * dy;
    if (distance < bestDistance) {
      bestDistance = distance;
      best = brick;
    }
  }
  return best;
}
