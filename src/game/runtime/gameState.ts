import type { Scene } from "../domainTypes";
import type { CombatState } from "./combatState";
import type { EncounterSessionState } from "./encounterState";
import type { RunState } from "./runState";
import type { UiProjectionSource } from "./uiState";

export interface GameState {
  scene: Scene;
  run: RunState;
  encounter: EncounterSessionState;
  combat: CombatState;
  ui: UiProjectionSource;
}
