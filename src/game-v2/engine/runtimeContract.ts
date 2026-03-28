import type { GameState } from "../public/types";

export interface RuntimeStateContract {
  scene: GameState["scene"];
  run: GameState["run"];
  encounter: GameState["encounter"];
  combat: GameState["combat"];
  ui: GameState["ui"];
}

export function projectRuntimeStateContract(state: GameState): RuntimeStateContract {
  return {
    scene: state.scene,
    run: state.run,
    encounter: state.encounter,
    combat: state.combat,
    ui: state.ui,
  };
}

export function hasRuntimeStateContract(value: unknown): value is RuntimeStateContract {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<Record<keyof RuntimeStateContract, unknown>>;
  return (
    "scene" in candidate &&
    "run" in candidate &&
    "encounter" in candidate &&
    "combat" in candidate &&
    "ui" in candidate
  );
}
