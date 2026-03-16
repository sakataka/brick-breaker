import { getCurrentMaxBallSpeed } from "../assistSystem";
import { countAliveObjectiveBricks } from "../brickRules";
import { getGameplayBalance, HAZARD_CONFIG } from "../config";
import { updateEncounterRuntime } from "../encounterSystem";
import {
  getBombRadiusTiles,
  getHomingStrength,
  getLaserLevel,
  getPierceDepth,
  getRailLevel,
  getSlowBallMaxSpeedScale,
} from "../itemSystem";
import { updateBossPhase } from "./bossPhase";
import { resolveStageContextFromState } from "../stageContext";
import type { GameState } from "../types";
import type { GamePipelineDeps, TickContext } from "./gamePipelineTypes";

export function deriveTickContext(state: GameState, deps: GamePipelineDeps): TickContext {
  const balance = getGameplayBalance(deps.config.difficulty);
  const hadAliveBricksBeforeTick = countAliveObjectiveBricks(state.combat.bricks) > 0;
  const stageContext = resolveStageContextFromState(state, deps.config);
  const pipelineDeltaSec = deps.config.fixedDeltaSec;
  state.combat.magic.cooldownSec = Math.max(0, state.combat.magic.cooldownSec - pipelineDeltaSec);
  state.run.elapsedSec += pipelineDeltaSec;
  const bossPhaseSpeedScale = updateBossPhase(
    state,
    deps.config,
    deps.random,
    deps.sfx,
    pipelineDeltaSec,
  );
  const maxWithAssist = getCurrentMaxBallSpeed(
    stageContext.maxBallSpeed,
    state.combat.assist,
    state.run.elapsedSec,
  );
  const hazardSpeedScale =
    state.run.elapsedSec < state.combat.hazard.speedBoostUntilSec ? HAZARD_CONFIG.maxSpeedScale : 1;
  const modifierSpeedScale = stageContext.stageModifier?.maxSpeedScale ?? 1;
  updateEncounterRuntime(state, stageContext, pipelineDeltaSec);
  return {
    balance,
    hadAliveBricksBeforeTick,
    stageContext,
    pipelineDeltaSec,
    maxWithAssist,
    effectiveMaxSpeed:
      maxWithAssist *
      getSlowBallMaxSpeedScale(state.combat.items) *
      hazardSpeedScale *
      modifierSpeedScale *
      bossPhaseSpeedScale,
    pierceDepth: getPierceDepth(state.combat.items),
    bombRadiusTiles: getBombRadiusTiles(state.combat.items),
    homingStrength: getHomingStrength(state.combat.items),
    railLevel: getRailLevel(state.combat.items),
    laserLevel: getLaserLevel(state.combat.items),
    scoreScale: 1,
    scoreFocus: stageContext.stage.scoreFocus ?? "survival_chain",
  };
}
