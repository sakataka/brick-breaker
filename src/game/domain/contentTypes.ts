import type { BrickKind } from "./combatTypes";

export const STAGE_ARCHETYPES = [
  "wide_open",
  "corridor",
  "chokepoint",
  "control",
  "split_lane",
  "boss_arena",
  "tier2_arena",
] as const;

export type StageArchetype = (typeof STAGE_ARCHETYPES)[number];

export const STAGE_TAGS = [
  "steel",
  "generator",
  "gate",
  "turret",
  "enemy_pressure",
  "boss",
  "midboss",
] as const;

export type StageTag = (typeof STAGE_TAGS)[number];

export const STAGE_EVENT_KEYS = [
  "generator_respawn",
  "enemy_pressure",
  "boss_duel",
  "gate_cycle",
  "turret_fire",
  "midboss_duel",
] as const;

export type StageEventKey = (typeof STAGE_EVENT_KEYS)[number];

export const THREAT_LEVELS = ["low", "medium", "high", "critical"] as const;

export type ThreatLevel = (typeof THREAT_LEVELS)[number];

export const STAGE_PREVIEW_TAGS = [
  "shielded_grid",
  "relay_chain",
  "reactor_chain",
  "turret_lane",
  "hazard_flux",
  "gate_pressure",
  "boss_break",
  "survival_check",
  "fortress_core",
  "sweep_alert",
] as const;

export type StagePreviewTag = (typeof STAGE_PREVIEW_TAGS)[number];

export const SCORE_FOCUSES = [
  "reactor_chain",
  "turret_cancel",
  "boss_break",
  "survival_chain",
] as const;

export type ScoreFocus = (typeof SCORE_FOCUSES)[number];

export const STAGE_BONUS_RULES = [
  "hazard_first",
  "cancel_shots",
  "weak_window_burst",
  "no_drop_chain",
] as const;

export type StageBonusRule = (typeof STAGE_BONUS_RULES)[number];

export const ENEMY_SHOT_PROFILES = ["spike_orb", "plasma_bolt", "void_core"] as const;

export type EnemyShotProfile = (typeof ENEMY_SHOT_PROFILES)[number];

export const STAGE_MECHANIC_ROLES = ["shield", "relay", "reactor", "turret", "hazard"] as const;

export type StageMechanicRole = (typeof STAGE_MECHANIC_ROLES)[number];

export const STAGE_HAZARD_SCRIPT_IDS = [
  "none",
  "gate_pulse",
  "turret_crossfire",
  "flux_field",
  "reactor_chain",
  "boss_arena",
] as const;

export type StageHazardScriptId = (typeof STAGE_HAZARD_SCRIPT_IDS)[number];

export const STAGE_VISUAL_DEPTHS = ["stellar", "orbital", "fortress"] as const;

export type StageVisualDepth = (typeof STAGE_VISUAL_DEPTHS)[number];

export const STAGE_ARENA_FRAMES = ["clean", "hazard", "citadel"] as const;

export type StageArenaFrame = (typeof STAGE_ARENA_FRAMES)[number];

export const STAGE_BLOCK_MATERIALS = ["glass", "alloy", "armor", "core"] as const;

export type StageBlockMaterial = (typeof STAGE_BLOCK_MATERIALS)[number];

export const STAGE_CAMERA_INTENSITIES = ["steady", "alert", "assault"] as const;

export type StageCameraIntensity = (typeof STAGE_CAMERA_INTENSITIES)[number];

export const STAGE_BOSS_TONES = ["hunter", "artillery", "citadel", "overlord"] as const;

export type StageBossTone = (typeof STAGE_BOSS_TONES)[number];

export const ENCOUNTER_CUE_KINDS = [
  "boss_phase_shift",
  "shield_online",
  "relay_online",
  "reactor_critical",
  "warning_lane",
  "turret_crossfire",
  "stage_breakthrough",
  "punish_window",
  "hazard_surge",
] as const;

export type EncounterCueKind = (typeof ENCOUNTER_CUE_KINDS)[number];

export const ENCOUNTER_TIMELINE_TRIGGERS = [
  "stage_start",
  "elapsed_10",
  "elapsed_20",
  "boss_phase_2",
  "boss_phase_3",
  "generator_down",
  "turret_destroyed",
  "board_clear",
] as const;

export type EncounterTimelineTrigger = (typeof ENCOUNTER_TIMELINE_TRIGGERS)[number];

export const STAGE_SPECIAL_KINDS = [
  "steel",
  "generator",
  "gate",
  "turret",
] as const satisfies readonly BrickKind[];

export type StageSpecialKind = (typeof STAGE_SPECIAL_KINDS)[number];

export const STAGE_ELITE_KINDS = [
  "durable",
  "armored",
  "regen",
  "hazard",
  "boss",
  "split",
  "summon",
  "thorns",
] as const satisfies readonly BrickKind[];

export type StageEliteKind = (typeof STAGE_ELITE_KINDS)[number];

export const STAGE_MISSION_KEYS = [
  "time_limit",
  "no_shop",
  "no_miss_stage",
  "combo_x2",
  "destroy_turret_first",
  "shutdown_generator",
] as const;

export type StageMissionKey = (typeof STAGE_MISSION_KEYS)[number];

export const ENCOUNTER_KINDS = ["none", "midboss", "boss", "tier2_boss"] as const;

export type EncounterKind = (typeof ENCOUNTER_KINDS)[number];

export const ENCOUNTER_PROFILES = [
  "none",
  "warden",
  "artillery",
  "final_core",
  "tier2_overlord",
] as const;

export type EncounterProfile = (typeof ENCOUNTER_PROFILES)[number];

export const MUSIC_CUE_IDS = [
  "title",
  "chapter1",
  "chapter2",
  "chapter3",
  "midboss",
  "finalboss",
  "tier2",
] as const;

export type MusicCueId = (typeof MUSIC_CUE_IDS)[number];

export const BOSS_ATTACK_KINDS = ["summon", "volley", "sweep", "burst", "gate_sweep"] as const;

export type BossAttackKind = (typeof BOSS_ATTACK_KINDS)[number];

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

export interface StageBoardMechanic {
  role: StageMechanicRole;
  label: string;
  intensity: ThreatLevel;
}

export interface StageHazardScript {
  id: StageHazardScriptId;
  intensity: ThreatLevel;
}

export interface StageVisualProfileDefinition {
  depth: StageVisualDepth;
  arenaFrame: StageArenaFrame;
  blockMaterial: StageBlockMaterial;
  particleDensity: number;
  cameraIntensity: StageCameraIntensity;
  bossTone: StageBossTone;
}

export interface EncounterTimelineEvent {
  trigger: EncounterTimelineTrigger;
  cue: EncounterCueKind;
  threatLevel: ThreatLevel;
  durationSec: number;
}

export interface StageElitePlacement {
  row: number;
  col: number;
  kind: StageEliteKind;
}

export interface StageSpecialPlacement {
  row: number;
  col: number;
  kind: StageSpecialKind;
}

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

export interface MusicCue {
  id: MusicCueId;
  variant: number;
}
