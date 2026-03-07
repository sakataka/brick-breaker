import type { BossAttackState, EncounterState, OverdriveState, RiskChainState } from "./types";

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

export function createRiskChainState(): RiskChainState {
  return {
    value: 0,
    max: 100,
    threshold: 100,
    decayPerSec: 18,
  };
}

export function createOverdriveState(): OverdriveState {
  return {
    active: false,
    remainingSec: 0,
    maxSec: 5.5,
    damageScale: 1.35,
    scoreScale: 1.5,
  };
}
