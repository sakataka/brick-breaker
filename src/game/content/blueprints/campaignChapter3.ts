import type { StageBlueprint } from "./types";

export const CAMPAIGN_CHAPTER_3_BLUEPRINTS: readonly StageBlueprint[] = [
  {
    id: "campaign-7",
    rows: ["1111111111", "1011111101", "1110011111", "0011111000", "0001110000", "0000000000"],
    tags: ["generator", "turret"],
    events: ["generator_respawn", "turret_fire"],
    specials: [
      { row: 1, col: 2, kind: "generator" },
      { row: 1, col: 7, kind: "generator" },
      { row: 3, col: 4, kind: "turret" },
    ],
    missions: ["shutdown_generator", "no_shop"],
  },
  {
    id: "campaign-8",
    rows: ["1111111111", "1100000011", "1111111111", "0011111000", "0001100000", "0000000000"],
    tags: ["steel", "generator", "turret"],
    events: ["generator_respawn", "turret_fire"],
    specials: [
      { row: 1, col: 4, kind: "steel" },
      { row: 1, col: 5, kind: "steel" },
      { row: 2, col: 3, kind: "generator" },
      { row: 2, col: 6, kind: "generator" },
      { row: 4, col: 4, kind: "turret" },
    ],
    missions: ["shutdown_generator", "destroy_turret_first"],
  },
  {
    id: "campaign-9",
    rows: ["1111111111", "1110111111", "0111111110", "0011111100", "0010011000", "0001110000"],
    tags: ["generator", "enemy_pressure", "turret", "midboss"],
    events: ["generator_respawn", "enemy_pressure", "turret_fire", "midboss_duel"],
    specials: [
      { row: 0, col: 4, kind: "generator" },
      { row: 1, col: 2, kind: "generator" },
      { row: 5, col: 4, kind: "turret" },
    ],
    elite: [
      { row: 0, col: 7, kind: "durable" },
      { row: 1, col: 6, kind: "armored" },
      { row: 2, col: 4, kind: "regen" },
      { row: 3, col: 5, kind: "hazard" },
      { row: 4, col: 2, kind: "split" },
      { row: 5, col: 5, kind: "boss" },
    ],
    missions: ["destroy_turret_first", "combo_x2"],
    encounter: { kind: "midboss", profile: "artillery" },
  },
] as const;
