import type { StageBlueprint } from "./types";

export const CAMPAIGN_CHAPTER_1_BLUEPRINTS: readonly StageBlueprint[] = [
  {
    id: "campaign-1",
    rows: ["0011111100", "0011111100", "0001111000", "0000110000", "0000000000", "0000000000"],
  },
  {
    id: "campaign-2",
    rows: ["0011111100", "0010011000", "0011111100", "0001100000", "0001111000", "0000000000"],
  },
  {
    id: "campaign-3",
    rows: ["0111111110", "0001100000", "0011111000", "0001100000", "0011111000", "0000000000"],
  },
] as const;
