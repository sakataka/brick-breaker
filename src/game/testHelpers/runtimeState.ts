import type { EncounterRuntimeState, GameState, ItemType, ThreatLevel } from "../types";

export function setEncounterIndex(
  state: GameState,
  encounterIndex: number,
  totalEncounters?: number,
): void {
  state.run.progress.encounterIndex = encounterIndex;
  if (typeof totalEncounters === "number") {
    state.run.progress.totalEncounters = totalEncounters;
  }
}

export function setRunScore(state: GameState, score: number): void {
  state.run.score = score;
}

export function setShopOffer(state: GameState, offer: [ItemType, ItemType]): void {
  state.encounter.shop.lastOffer = offer;
  state.encounter.shop.usedThisStage = false;
}

export function setBossRuntime(
  state: GameState,
  runtime: Partial<EncounterRuntimeState> & {
    phase?: 0 | 1 | 2 | 3;
    threatLevel?: ThreatLevel;
  } = {},
): void {
  const phase = runtime.phase ?? state.encounter.bossPhase;
  const threatLevel = runtime.threatLevel ?? state.encounter.threatLevel;

  Object.assign(state.encounter.runtime, runtime);
  state.encounter.bossPhase = phase;
  state.encounter.runtime.phase = phase;
  state.encounter.threatLevel = threatLevel;
  state.encounter.activeTelegraphs = state.encounter.runtime.telegraph
    ? [state.encounter.runtime.telegraph]
    : [];
}
