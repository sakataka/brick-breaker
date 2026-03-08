import type { BossAttackState, EncounterState } from "./types";

export function createBossAttackState(): BossAttackState {
  return {
    actionCooldownSec: 0,
    nextProjectileId: 1,
    telegraph: null,
    projectiles: [],
    sweep: null,
  };
}

export function createEncounterState(
  kind: EncounterState["kind"] = "none",
  profile: EncounterState["profile"] = "none",
): EncounterState {
  return {
    ...createBossAttackState(),
    kind,
    profile,
    phase: 0,
    summonCooldownSec: 0,
    vulnerabilitySec: 0,
    vulnerabilityMaxSec: 0,
  };
}
