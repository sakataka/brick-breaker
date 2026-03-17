import type { BrickKind } from "./combatTypes";

export interface StageDefinition {
  id: number;
  speedScale: number;
  layout: number[][];
  chapter?: 1 | 2 | 3 | 4;
  archetype?: StageArchetype;
  tags?: StageTag[];
  events?: StageEventKey[];
  specials?: StageSpecialPlacement[];
  elite?: StageElitePlacement[];
  missions?: readonly StageMissionKey[];
  visualProfile?: StageVisualProfileDefinition;
  boardMechanics?: readonly StageBoardMechanic[];
  hazardScript?: StageHazardScript;
  encounterTimeline?: readonly EncounterTimelineEvent[];
  previewTags?: readonly StagePreviewTag[];
  scoreFocus?: ScoreFocus;
  bonusRules?: readonly StageBonusRule[];
  enemyShotProfile?: EnemyShotProfile;
  visualSetId?: string;
  encounter?: StageEncounterDefinition;
}

export type StageArchetype =
  | "wide_open"
  | "corridor"
  | "chokepoint"
  | "control"
  | "split_lane"
  | "boss_arena"
  | "tier2_arena";

export type StageTag =
  | "steel"
  | "generator"
  | "gate"
  | "turret"
  | "enemy_pressure"
  | "boss"
  | "midboss";

export type StageEventKey =
  | "generator_respawn"
  | "enemy_pressure"
  | "boss_duel"
  | "gate_cycle"
  | "turret_fire"
  | "midboss_duel";

export type ThreatLevel = "low" | "medium" | "high" | "critical";

export type StagePreviewTag =
  | "shielded_grid"
  | "relay_chain"
  | "reactor_chain"
  | "turret_lane"
  | "hazard_flux"
  | "gate_pressure"
  | "boss_break"
  | "survival_check"
  | "fortress_core"
  | "sweep_alert";

export type ScoreFocus = "reactor_chain" | "turret_cancel" | "boss_break" | "survival_chain";

export type StageBonusRule =
  | "hazard_first"
  | "cancel_shots"
  | "weak_window_burst"
  | "no_drop_chain";

export type EnemyShotProfile = "spike_orb" | "plasma_bolt" | "void_core";

export type StageMechanicRole = "shield" | "relay" | "reactor" | "turret" | "hazard";

export interface StageBoardMechanic {
  role: StageMechanicRole;
  label: string;
  intensity: ThreatLevel;
}

export interface StageHazardScript {
  id: "none" | "gate_pulse" | "turret_crossfire" | "flux_field" | "reactor_chain" | "boss_arena";
  intensity: ThreatLevel;
}

export interface StageVisualProfileDefinition {
  depth: "stellar" | "orbital" | "fortress";
  arenaFrame: "clean" | "hazard" | "citadel";
  blockMaterial: "glass" | "alloy" | "armor" | "core";
  particleDensity: number;
  cameraIntensity: "steady" | "alert" | "assault";
  bossTone: "hunter" | "artillery" | "citadel" | "overlord";
}

export type EncounterCueKind =
  | "boss_phase_shift"
  | "shield_online"
  | "relay_online"
  | "reactor_critical"
  | "warning_lane"
  | "turret_crossfire"
  | "stage_breakthrough"
  | "punish_window"
  | "hazard_surge";

export interface EncounterTimelineEvent {
  trigger:
    | "stage_start"
    | "elapsed_10"
    | "elapsed_20"
    | "boss_phase_2"
    | "boss_phase_3"
    | "generator_down"
    | "turret_destroyed"
    | "board_clear";
  cue: EncounterCueKind;
  threatLevel: ThreatLevel;
  durationSec: number;
}

export interface StageElitePlacement {
  row: number;
  col: number;
  kind: Extract<
    BrickKind,
    "durable" | "armored" | "regen" | "hazard" | "boss" | "split" | "summon" | "thorns"
  >;
}

export interface StageSpecialPlacement {
  row: number;
  col: number;
  kind: Extract<BrickKind, "steel" | "generator" | "gate" | "turret">;
}

export type StageMissionKey =
  | "time_limit"
  | "no_shop"
  | "no_miss_stage"
  | "combo_x2"
  | "destroy_turret_first"
  | "shutdown_generator";

export type EncounterKind = "none" | "midboss" | "boss" | "tier2_boss";
export type EncounterProfile = "none" | "warden" | "artillery" | "final_core" | "tier2_overlord";

export interface StageEncounterDefinition {
  kind: EncounterKind;
  profile: EncounterProfile;
  bossDefinition?: BossDefinition;
}

export interface BossPhaseRule {
  phase: 1 | 2 | 3;
  hpRatioThreshold: number;
  threatLevel: ThreatLevel;
  punishWindowSec: number;
}

export interface BossAttackPattern {
  phase: 1 | 2 | 3;
  attacks: readonly BossAttackKind[];
}

export interface BossDefinition {
  profile: EncounterProfile;
  label: string;
  telegraphSet: readonly BossAttackKind[];
  phaseRules: readonly BossPhaseRule[];
  attackPatterns: readonly BossAttackPattern[];
  breakpoints: readonly number[];
  punishWindows: readonly number[];
  arenaEffects: readonly EncounterCueKind[];
  projectileSkin: EnemyShotProfile;
  cancelReward: number;
  phaseScoreRules: readonly BossPhaseScoreRule[];
}

export interface BossPhaseScoreRule {
  phase: 1 | 2 | 3;
  bonusPerWeakHit: number;
}

export type MusicCueId =
  | "title"
  | "chapter1"
  | "chapter2"
  | "chapter3"
  | "midboss"
  | "finalboss"
  | "tier2";

export interface MusicCue {
  id: MusicCueId;
  variant: number;
}

export type BossAttackKind = "summon" | "volley" | "sweep" | "burst" | "gate_sweep";
