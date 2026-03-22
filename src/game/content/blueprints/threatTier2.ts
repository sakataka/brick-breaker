import type { StageBlueprint } from "./types";

export const THREAT_TIER_2_BLUEPRINTS: readonly StageBlueprint[] = [
  {
    id: "tier2-1",
    rows: ["0111111110", "0100010010", "0111111110", "0010101000", "0001110000", "0000000000"],
    tags: ["steel", "gate", "midboss"],
    events: ["gate_cycle", "midboss_duel"],
    specials: [
      { row: 1, col: 2, kind: "steel" },
      { row: 1, col: 7, kind: "steel" },
      { row: 3, col: 3, kind: "gate" },
      { row: 3, col: 6, kind: "gate" },
    ],
    elite: [{ row: 4, col: 4, kind: "boss" }],
    missions: ["no_miss_stage", "combo_x2"],
    encounter: { kind: "midboss", profile: "warden" },
  },
  {
    id: "tier2-2",
    rows: ["1111111111", "1000000001", "1111011111", "0011111100", "0001100000", "0000000000"],
    tags: ["generator", "turret", "enemy_pressure"],
    events: ["generator_respawn", "turret_fire", "enemy_pressure"],
    specials: [
      { row: 1, col: 4, kind: "turret" },
      { row: 1, col: 5, kind: "turret" },
      { row: 2, col: 4, kind: "generator" },
    ],
    missions: ["shutdown_generator", "destroy_turret_first"],
  },
  {
    id: "tier2-3",
    rows: ["1110011111", "0011111100", "1110011111", "0011111100", "0001110000", "0000000000"],
    tags: ["steel", "turret", "midboss"],
    events: ["turret_fire", "midboss_duel"],
    specials: [
      { row: 0, col: 2, kind: "steel" },
      { row: 0, col: 7, kind: "steel" },
      { row: 3, col: 2, kind: "turret" },
      { row: 3, col: 7, kind: "turret" },
    ],
    elite: [{ row: 4, col: 4, kind: "boss" }],
    missions: ["destroy_turret_first", "combo_x2"],
    encounter: { kind: "midboss", profile: "artillery" },
  },
  {
    id: "tier2-4",
    rows: ["0000000000", "0010000100", "0000100000", "0010000100", "0000000000", "0000000000"],
    tags: ["steel", "boss", "turret"],
    events: ["boss_duel", "turret_fire"],
    specials: [
      { row: 1, col: 2, kind: "steel" },
      { row: 1, col: 7, kind: "steel" },
      { row: 3, col: 2, kind: "turret" },
      { row: 3, col: 7, kind: "turret" },
    ],
    elite: [{ row: 2, col: 4, kind: "boss" }],
    missions: ["time_limit", "combo_x2"],
    encounter: { kind: "tier2_boss", profile: "tier2_overlord" },
  },
] as const;
