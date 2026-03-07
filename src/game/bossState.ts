import type { BossAttackState } from "./types";

export function createBossAttackState(): BossAttackState {
  return {
    actionCooldownSec: 0,
    nextProjectileId: 1,
    telegraph: null,
    projectiles: [],
    sweep: null,
  };
}
