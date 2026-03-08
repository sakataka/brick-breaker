export type Scene = "start" | "story" | "playing" | "paused" | "gameover" | "stageclear" | "clear" | "error";
export type Difficulty = "casual" | "standard" | "hard";
export type ItemType =
  | "paddle_plus"
  | "slow_ball"
  | "multiball"
  | "shield"
  | "pierce"
  | "bomb"
  | "laser"
  | "homing"
  | "rail"
  | "shockwave"
  | "pulse";
export type BrickKind =
  | "normal"
  | "steel"
  | "generator"
  | "gate"
  | "turret"
  | "durable"
  | "armored"
  | "regen"
  | "hazard"
  | "boss"
  | "split"
  | "summon"
  | "thorns";

export interface Vector2 {
  x: number;
  y: number;
}

export interface RandomSource {
  next(): number;
}

export interface Ball {
  pos: Vector2;
  vel: Vector2;
  radius: number;
  speed: number;
  lastDamageBrickId?: number;
  warpCooldownSec?: number;
}

export interface Paddle {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Brick {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  alive: boolean;
  kind?: BrickKind;
  hp?: number;
  maxHp?: number;
  regenCharges?: number;
  row?: number;
  col?: number;
  color?: string;
  cooldownSec?: number;
}

export interface GameConfig {
  width: number;
  height: number;
  difficulty: Difficulty;
  fixedDeltaSec: number;
  initialLives: number;
  initialBallSpeed: number;
  maxBallSpeed: number;
  multiballMaxBalls: number;
  assistDurationSec: number;
  assistPaddleScale: number;
  assistMaxSpeedScale: number;
}

export interface GameAudioSettings {
  bgmEnabled: boolean;
  sfxEnabled: boolean;
}

export interface StageDefinition {
  id: number;
  speedScale: number;
  layout: number[][];
  course?: CampaignCourse;
  chapter?: 1 | 2 | 3 | 4;
  archetype?: StageArchetype;
  tags?: StageTag[];
  events?: StageEventKey[];
  specials?: StageSpecialPlacement[];
  elite?: StageElitePlacement[];
  missions?: readonly StageMissionKey[];
  encounter?: StageEncounterDefinition;
}

export type CampaignCourse = "normal" | "ex";

export type StageArchetype =
  | "wide_open"
  | "corridor"
  | "chokepoint"
  | "control"
  | "split_lane"
  | "boss_arena"
  | "ex_arena";

export type StageTag = "steel" | "generator" | "gate" | "turret" | "enemy_pressure" | "boss" | "midboss";

export type StageEventKey =
  | "generator_respawn"
  | "enemy_pressure"
  | "boss_duel"
  | "gate_cycle"
  | "turret_fire"
  | "midboss_duel";

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

export type EncounterKind = "none" | "midboss" | "boss" | "ex_boss";
export type EncounterProfile = "none" | "warden" | "artillery" | "final_core" | "ex_overlord";

export interface StageEncounterDefinition {
  kind: EncounterKind;
  profile: EncounterProfile;
}

export type MusicCueId = "title" | "chapter1" | "chapter2" | "chapter3" | "midboss" | "finalboss" | "ex";

export interface MusicCue {
  id: MusicCueId;
  variant: number;
}
