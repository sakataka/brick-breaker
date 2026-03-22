import type { StageBlueprint } from "./types";

export const CAMPAIGN_CHAPTER_2_BLUEPRINTS: readonly StageBlueprint[] = [
  {
    id: "campaign-4",
    rows: ["0111111110", "0100110010", "0111111110", "0001111000", "0000100000", "0000000000"],
    tags: ["steel", "gate", "midboss"],
    events: ["gate_cycle", "midboss_duel"],
    specials: [
      { row: 1, col: 3, kind: "steel" },
      { row: 1, col: 6, kind: "steel" },
      { row: 3, col: 3, kind: "gate" },
      { row: 3, col: 6, kind: "gate" },
      { row: 2, col: 4, kind: "steel" },
      { row: 2, col: 5, kind: "steel" },
    ],
    elite: [{ row: 3, col: 4, kind: "boss" }],
    missions: ["time_limit", "no_miss_stage"],
    encounter: { kind: "midboss", profile: "warden" },
  },
  {
    id: "campaign-5",
    rows: ["1111111111", "1011111101", "0110011000", "0111111110", "0011111100", "0000000000"],
    tags: ["steel", "gate"],
    events: ["gate_cycle"],
    specials: [
      { row: 1, col: 1, kind: "steel" },
      { row: 1, col: 8, kind: "steel" },
      { row: 2, col: 4, kind: "steel" },
      { row: 2, col: 5, kind: "steel" },
      { row: 4, col: 4, kind: "gate" },
    ],
    missions: ["time_limit", "no_shop"],
  },
  {
    id: "campaign-6",
    rows: ["1111111111", "1001111001", "1110011111", "0001111000", "0011111100", "0000000000"],
    tags: ["steel", "gate"],
    events: ["gate_cycle"],
    specials: [
      { row: 1, col: 4, kind: "steel" },
      { row: 1, col: 5, kind: "steel" },
      { row: 2, col: 3, kind: "steel" },
      { row: 2, col: 6, kind: "steel" },
      { row: 4, col: 3, kind: "gate" },
      { row: 4, col: 6, kind: "gate" },
    ],
    missions: ["time_limit", "combo_x2"],
  },
] as const;
