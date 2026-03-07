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
  | "sticky"
  | "homing"
  | "rail"
  | "shockwave";
export type BrickKind =
  | "normal"
  | "steel"
  | "generator"
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
  stickTimerSec?: number;
  stickCooldownSec?: number;
  stickOffsetRatio?: number;
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
  chapter?: 1 | 2 | 3 | 4;
  archetype?: StageArchetype;
  tags?: StageTag[];
  events?: StageEventKey[];
  specials?: StageSpecialPlacement[];
  elite?: StageElitePlacement[];
}

export type StageArchetype =
  | "wide_open"
  | "corridor"
  | "chokepoint"
  | "control"
  | "split_lane"
  | "boss_arena";

export type StageTag = "steel" | "generator" | "enemy_pressure" | "boss";

export type StageEventKey = "generator_respawn" | "enemy_pressure" | "boss_duel";

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
  kind: Extract<BrickKind, "steel" | "generator">;
}
