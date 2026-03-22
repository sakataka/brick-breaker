import type { StageBlueprint } from "./types";

export const CAMPAIGN_CHAPTER_4_BLUEPRINTS: readonly StageBlueprint[] = [
  {
    id: "campaign-10",
    rows: ["1110011111", "1110011111", "0011111100", "1110011111", "1110011111", "0001110000"],
    tags: ["steel", "enemy_pressure", "turret"],
    events: ["enemy_pressure", "turret_fire"],
    specials: [
      { row: 0, col: 2, kind: "steel" },
      { row: 0, col: 7, kind: "steel" },
      { row: 3, col: 2, kind: "steel" },
      { row: 3, col: 7, kind: "steel" },
      { row: 5, col: 4, kind: "turret" },
    ],
    elite: [
      { row: 1, col: 1, kind: "durable" },
      { row: 1, col: 8, kind: "armored" },
      { row: 2, col: 4, kind: "hazard" },
      { row: 4, col: 1, kind: "regen" },
      { row: 4, col: 8, kind: "summon" },
    ],
    missions: ["destroy_turret_first", "combo_x2"],
  },
  {
    id: "campaign-11",
    rows: ["1111111111", "1001111001", "1111111111", "0011111100", "1110011111", "0001110000"],
    tags: ["steel", "generator", "enemy_pressure", "turret"],
    events: ["generator_respawn", "enemy_pressure", "turret_fire"],
    specials: [
      { row: 1, col: 1, kind: "steel" },
      { row: 1, col: 8, kind: "steel" },
      { row: 2, col: 4, kind: "generator" },
      { row: 4, col: 4, kind: "steel" },
      { row: 5, col: 2, kind: "turret" },
      { row: 5, col: 7, kind: "turret" },
    ],
    elite: [
      { row: 0, col: 2, kind: "armored" },
      { row: 0, col: 7, kind: "durable" },
      { row: 2, col: 6, kind: "thorns" },
      { row: 3, col: 3, kind: "hazard" },
      { row: 4, col: 7, kind: "regen" },
    ],
    missions: ["shutdown_generator", "no_shop"],
  },
  {
    id: "campaign-12",
    rows: ["0000000000", "0010000100", "0000100000", "0000000000", "0000000000", "0000000000"],
    tags: ["steel", "boss"],
    events: ["boss_duel"],
    specials: [
      { row: 1, col: 2, kind: "steel" },
      { row: 1, col: 7, kind: "steel" },
      { row: 2, col: 1, kind: "steel" },
      { row: 2, col: 8, kind: "steel" },
      { row: 3, col: 2, kind: "steel" },
      { row: 3, col: 7, kind: "steel" },
    ],
    elite: [{ row: 2, col: 4, kind: "boss" }],
    missions: ["time_limit", "no_miss_stage"],
    encounter: { kind: "boss", profile: "final_core" },
  },
] as const;
