import { applyScoringPhase } from "./pipeline/applyScoringPhase";
import type { GamePipelineDeps, PipelineOutcome } from "./pipeline/gamePipelineTypes";
import { resolveCollisionPhase } from "./pipeline/resolveCollisionPhase";
import { resolveInputPhase } from "./pipeline/resolveInputPhase";
import { resolveRewardsAndTransitionPhase } from "./pipeline/resolveRewardsAndTransitionPhase";
import { runCombatSimulationPhase } from "./pipeline/runCombatSimulationPhase";
import { runEncounterScriptPhase } from "./pipeline/runEncounterScriptPhase";
import { deriveTickContext } from "./pipeline/tickContext";
import type { GameState } from "./types";

export { generateShopOffer } from "./pipeline/shopPhase";
export type { GamePipelineDeps, PipelineOutcome } from "./pipeline/gamePipelineTypes";

export function stepPlayingPipeline(state: GameState, deps: GamePipelineDeps): PipelineOutcome {
  const ctx = deriveTickContext(state, deps);
  resolveInputPhase(state, deps, ctx);
  const encounter = runEncounterScriptPhase(state, deps, ctx);
  const combat = runCombatSimulationPhase(state, deps, ctx, encounter);
  const collision = resolveCollisionPhase(state, deps, ctx, encounter, combat);
  const scoring = applyScoringPhase(state, ctx, encounter, combat, collision);
  return resolveRewardsAndTransitionPhase(state, deps, ctx, collision, scoring);
}
