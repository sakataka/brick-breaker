import type { SfxManager } from "../../audio/sfx";
import { createEncounterState } from "../bossState";
import { getBossDefinition } from "../config/bosses";
import { BOSS_PHASE_CONFIG } from "../config";
import { resolveStageMetadataFromState } from "../stageContext";
import type { GameConfig, GameState, RandomSource } from "../types";
import {
  spawnBossAdd,
  updateBossProjectiles,
  updateBossSweep,
  updateBossTelegraph,
} from "./bossPhaseActions";
import {
  applyPhaseTransitionFeedback,
  pushBossPhaseCue,
  resolveBossPhase,
  resolvePhaseThreat,
} from "./bossPhaseHelpers";

export function updateBossPhase(
  state: GameState,
  config: GameConfig,
  random: RandomSource,
  sfx: SfxManager,
  deltaSec: number,
): number {
  const metadata = resolveStageMetadataFromState(state);
  const encounter = state.encounter.runtime;
  const boss = state.combat.bricks.find((brick) => brick.alive && brick.kind === "boss");
  if (!boss) {
    state.encounter.bossPhase = 0;
    state.encounter.bossPhaseSummonCooldownSec = 0;
    if (encounter.projectiles.length <= 0) {
      state.encounter.runtime = createEncounterState();
    } else {
      updateBossProjectiles(state, config, deltaSec);
    }
    state.encounter.forcedBallLoss = false;
    return 1;
  }

  const hp = Math.max(0, boss.hp ?? 0);
  const maxHp = Math.max(hp, boss.maxHp ?? 18);
  const phase = resolveBossPhase(hp, maxHp);
  const profile =
    metadata.stage.encounter?.profile ??
    (state.run.progress.encounterIndex >= 11 ? "final_core" : "warden");
  const bossDefinition = metadata.stage.encounter?.bossDefinition ?? getBossDefinition(profile);
  encounter.kind = metadata.stage.encounter?.kind ?? "boss";
  encounter.profile = profile;
  encounter.phase = phase;
  encounter.stageThreatLevel = resolvePhaseThreat(phase, bossDefinition);
  state.encounter.threatLevel = encounter.stageThreatLevel;
  if (state.encounter.bossPhase !== phase) {
    state.encounter.bossPhase = phase;
    encounter.lastTriggeredPhase = phase;
    if (phase >= 2) {
      applyPhaseTransitionFeedback(state, boss, phase as 2 | 3, sfx);
    }
    encounter.actionCooldownSec = BOSS_PHASE_CONFIG.actionCooldownSecByPhase[phase - 1];
    pushBossPhaseCue(state, phase as 2 | 3);
  }

  updateBossProjectiles(state, config, deltaSec);
  updateBossSweep(state, config, deltaSec);
  encounter.vulnerabilitySec = Math.max(0, encounter.vulnerabilitySec - deltaSec);

  if (phase <= 2 && profile !== "artillery") {
    state.encounter.bossPhaseSummonCooldownSec = Math.max(
      0,
      state.encounter.bossPhaseSummonCooldownSec - deltaSec,
    );
    encounter.summonCooldownSec = state.encounter.bossPhaseSummonCooldownSec;
    if (state.encounter.bossPhaseSummonCooldownSec <= 0) {
      spawnBossAdd(state, config, random);
      state.encounter.bossPhaseSummonCooldownSec = BOSS_PHASE_CONFIG.summonIntervalSec;
    }
  } else {
    state.encounter.bossPhaseSummonCooldownSec = 0;
    encounter.summonCooldownSec = 0;
  }

  updateBossTelegraph(state, boss, config, random, deltaSec, profile, bossDefinition);

  return BOSS_PHASE_CONFIG.speedScaleByPhase[phase - 1];
}
