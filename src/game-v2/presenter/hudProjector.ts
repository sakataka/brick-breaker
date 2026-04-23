import type { GameState, MetaProgress } from "../public";
import type { HudViewModel } from "../public/renderTypes";
import {
  calculateProgressRatio,
  getCourseBestScore,
  projectHudBoss,
  projectHudFlags,
} from "./projectionHelpers";
import { createVisualState } from "./visualProjector";

export function projectHudView(state: GameState, meta: MetaProgress): HudViewModel {
  return {
    score: state.run.score,
    lives: state.run.lives,
    elapsedSec: state.run.elapsedSec,
    comboMultiplier: state.run.comboMultiplier,
    scoreFeed: [],
    stage: {
      current: state.run.progress.currentStageNumber,
      total: state.run.progress.totalEncounters,
      modifierKey: state.encounter.modifierKey,
      scoreFocus: state.encounter.scoreFocus,
      boss: projectHudBoss(state),
      threatLevel: state.encounter.threatLevel,
      previewTags: state.encounter.previewTags,
    },
    missionProgress: [],
    activeItems: state.run.activeItems,
    visual: createVisualState(state),
    flags: projectHudFlags(state),
    progressRatio: calculateProgressRatio(state),
    styleBonus: {
      chainLevel: Math.round(state.run.comboMultiplier * 10) / 10,
      lastBonusLabel: state.run.comboMultiplier > 1 ? "CHAIN" : null,
      lastBonusScore: state.run.comboMultiplier > 1 ? 100 : 0,
    },
    record: {
      currentRunRecord: state.run.record.currentRunRecord,
      deltaToBest: state.run.record.deltaToBest,
      courseBestScore: getCourseBestScore(state, meta),
    },
    pickupToast: state.ui.pickupToast,
  };
}
