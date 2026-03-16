import type { BossAttackState, EncounterRuntimeState } from "./types";

function createBossAttackState(): BossAttackState {
  return {
    actionCooldownSec: 0,
    nextProjectileId: 1,
    telegraph: null,
    projectiles: [],
    sweep: null,
  };
}

export function createEncounterState(
  kind: EncounterRuntimeState["kind"] = "none",
  profile: EncounterRuntimeState["profile"] = "none",
): EncounterRuntimeState {
  return {
    ...createBossAttackState(),
    kind,
    profile,
    phase: 0,
    summonCooldownSec: 0,
    vulnerabilitySec: 0,
    vulnerabilityMaxSec: 0,
    stageThreatLevel: "low",
    activeMechanics: [],
    activeCues: [],
    cueCursor: 0,
    triggeredTimelineEvents: [],
    lastTriggeredPhase: 0,
  };
}
