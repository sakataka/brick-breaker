import type { SfxManager } from "../../audio/sfx";
import { BOSS_PHASE_CONFIG } from "../config";
import { pushEncounterCue } from "../encounterSystem";
import { getBossDefinition } from "../config/bosses";
import type { GameState, RandomSource, ThreatLevel } from "../types";

export function resolveBossPhase(hp: number, maxHp: number): 1 | 2 | 3 {
  if (hp <= maxHp * BOSS_PHASE_CONFIG.phase3Ratio) {
    return 3;
  }
  if (hp <= maxHp * BOSS_PHASE_CONFIG.phase2Ratio) {
    return 2;
  }
  return 1;
}

export function applyPhaseTransitionFeedback(
  state: GameState,
  boss: GameState["combat"]["bricks"][number],
  phase: 2 | 3,
  sfx: SfxManager,
): void {
  state.ui.vfx.flashMs = Math.max(state.ui.vfx.flashMs, BOSS_PHASE_CONFIG.phaseChangeFlashMs);
  state.ui.vfx.flashColor = phase === 3 ? "rgba(255, 92, 138, 0.92)" : "rgba(255, 196, 112, 0.95)";
  state.ui.vfx.shakeMs = Math.max(state.ui.vfx.shakeMs, 96);
  state.ui.vfx.shakePx = Math.max(state.ui.vfx.shakePx, 4.5);
  state.ui.vfx.floatingTexts.push({
    key: phase === 3 ? "boss_phase_3" : "boss_phase_2",
    pos: { x: boss.x + boss.width / 2, y: boss.y + boss.height / 2 },
    lifeMs: 640,
    maxLifeMs: 640,
    color: phase === 3 ? "rgba(255, 128, 168, 0.96)" : "rgba(255, 196, 112, 0.95)",
  });
  void sfx.play("combo_fill");
}

export function resolvePhaseThreat(
  phase: 1 | 2 | 3,
  bossDefinition: ReturnType<typeof getBossDefinition>,
): ThreatLevel {
  return bossDefinition?.phaseRules.find((rule) => rule.phase === phase)?.threatLevel ?? "high";
}

export function resolvePunishWindowSec(
  phase: 1 | 2 | 3,
  profile: NonNullable<GameState["encounter"]["runtime"]["profile"]>,
  bossDefinition: ReturnType<typeof getBossDefinition>,
): number {
  const configured = bossDefinition?.phaseRules.find(
    (rule) => rule.phase === phase,
  )?.punishWindowSec;
  if (configured) {
    return configured;
  }
  return profile === "tier2_overlord" ? 1.1 : 1.8;
}

export function selectBossAttack(
  state: GameState,
  profile: NonNullable<GameState["encounter"]["runtime"]["profile"]>,
  random: RandomSource,
  bossDefinition: ReturnType<typeof getBossDefinition>,
): NonNullable<GameState["encounter"]["runtime"]["telegraph"]>["kind"] {
  const pattern = bossDefinition?.attackPatterns.find(
    (entry) => entry.phase === state.encounter.bossPhase,
  );
  const attacks = pattern?.attacks;
  if (attacks && attacks.length > 0) {
    const index = Math.floor(random.next() * attacks.length);
    return attacks[index] ?? attacks[attacks.length - 1];
  }
  if (profile === "warden") {
    return "gate_sweep";
  }
  if (profile === "artillery") {
    return "burst";
  }
  return state.encounter.bossPhase >= 3 && random.next() > 0.45 ? "sweep" : "volley";
}

export function pushBossPhaseCue(state: GameState, phase: 2 | 3): void {
  pushEncounterCue(
    state,
    "boss_phase_shift",
    phase === 3 ? "critical" : "high",
    phase === 3 ? 1.45 : 1.2,
  );
}
