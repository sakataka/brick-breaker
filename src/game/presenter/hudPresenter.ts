import { getActiveItemEntries } from "../itemSystem";
import type { HudViewModel } from "../renderTypes";
import {
  resolveStageMetadataFromState,
  resolveUpcomingStagePreviewFromState,
} from "../stageContext";
import type { GameState } from "../types";
import {
  buildStageIntro,
  buildVisualState,
  computeProgressRatio,
  resolveWarningLevel,
} from "./shared";

export function buildHudViewModel(state: GameState): HudViewModel {
  const stageContext = resolveStageMetadataFromState(state);
  const upcoming = resolveUpcomingStagePreviewFromState(state);
  const progressRatio = computeProgressRatio(state);
  const activeItems = getActiveItemEntries(state.combat.items);
  const warningLevel = resolveWarningLevel(state);
  const hazardBoostActive = state.run.elapsedSec < state.combat.hazard.speedBoostUntilSec;
  const pierceSlowSynergy =
    state.combat.items.active.pierceStacks > 0 && state.combat.items.active.slowBallStacks > 0;
  const boss = buildBossHud(state);
  const stageIntro = buildStageIntro(state, stageContext);
  return {
    score: state.run.score,
    lives: state.run.lives,
    elapsedSec: state.run.elapsedSec,
    comboMultiplier: state.run.combo.streak > 1 ? state.run.combo.multiplier : 1,
    scoreFeed: state.ui.scoreFeed.map((entry) => ({
      label: entry.label,
      amount: entry.amount,
      tone: entry.tone,
      progress: entry.lifeMs / Math.max(1, entry.maxLifeMs),
    })),
    stage: {
      current: state.run.progress.encounterIndex + 1,
      total: state.run.progress.totalEncounters,
      modifierKey: stageContext.stageModifier?.key,
      scoreFocus: stageContext.stage.scoreFocus ?? "survival_chain",
      boss,
      threatLevel: state.encounter.threatLevel,
      previewTags: upcoming?.previewTags ?? [],
    },
    activeItems,
    visual: buildVisualState(state, stageContext, warningLevel, stageIntro),
    missionProgress: state.encounter.stats.missionResults ?? [],
    flags: {
      hazardBoostActive,
      pierceSlowSynergy,
      magicCooldownSec: state.combat.magic.cooldownSec,
      warpLegendVisible: Boolean(stageContext.stageModifier?.warpZones?.length),
      steelLegendVisible: stageContext.stageTags?.includes("steel") ?? false,
      generatorLegendVisible: stageContext.stageTags?.includes("generator") ?? false,
      gateLegendVisible: stageContext.stageTags?.includes("gate") ?? false,
      turretLegendVisible: stageContext.stageTags?.includes("turret") ?? false,
    },
    progressRatio,
    styleBonus: {
      chainLevel: state.ui.styleBonus.chainLevel,
      lastBonusLabel: state.ui.styleBonus.lastBonusLabel,
      lastBonusScore: state.ui.styleBonus.lastBonusScore,
    },
    record: {
      currentRunRecord: state.run.records.currentRunRecord,
      deltaToBest: state.run.records.deltaToBest,
      courseBestScore:
        state.run.options.threatTier === 2
          ? state.run.records.tier2BestScore
          : state.run.records.tier1BestScore,
    },
    pickupToast: state.ui.vfx.pickupToast
      ? {
          type: state.ui.vfx.pickupToast.itemType,
          color: state.ui.vfx.pickupToast.color,
          progress:
            state.ui.vfx.pickupToast.lifeMs / Math.max(1, state.ui.vfx.pickupToast.maxLifeMs),
        }
      : undefined,
  };
}

function buildBossHud(state: GameState): HudViewModel["stage"]["boss"] | undefined {
  const boss = state.combat.bricks.find((brick) => brick.alive && brick.kind === "boss");
  if (!boss) {
    return undefined;
  }
  const hp = Math.max(0, boss.hp ?? 0);
  const maxHp = Math.max(hp, boss.maxHp ?? 12);
  return {
    hp,
    maxHp,
    phase: Math.max(1, state.encounter.bossPhase) as 1 | 2 | 3,
    intent:
      state.encounter.runtime.telegraph?.kind ??
      (state.encounter.runtime.sweep ? "sweep" : undefined),
    castProgress: state.encounter.runtime.telegraph
      ? 1 -
        state.encounter.runtime.telegraph.remainingSec /
          Math.max(0.001, state.encounter.runtime.telegraph.maxSec)
      : undefined,
    weakWindowProgress:
      state.encounter.runtime.vulnerabilitySec > 0
        ? state.encounter.runtime.vulnerabilitySec /
          Math.max(0.001, state.encounter.runtime.vulnerabilityMaxSec)
        : undefined,
  };
}
