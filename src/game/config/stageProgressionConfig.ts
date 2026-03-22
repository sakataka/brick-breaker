import { RATING_CONFIG } from "./gameplay";

export interface WarpZone {
  inXMin: number;
  inXMax: number;
  inYMin: number;
  inYMax: number;
  outX: number;
  outY: number;
}

export interface StageModifier {
  key?: StageModifierKey;
  maxSpeedScale?: number;
  warpZones?: WarpZone[];
  spawnEnemy?: boolean;
  fluxField?: boolean;
}

export type StageModifierKey = "warp_zone" | "speed_ball" | "enemy_flux" | "flux";

const STAGE_MODIFIERS: Partial<Record<number, StageModifier>> = {
  6: {
    key: "warp_zone",
    warpZones: [
      {
        inXMin: 100,
        inXMax: 170,
        inYMin: 130,
        inYMax: 260,
        outX: 790,
        outY: 160,
      },
      {
        inXMin: 760,
        inXMax: 840,
        inYMin: 130,
        inYMax: 260,
        outX: 160,
        outY: 160,
      },
    ],
  },
  8: {
    key: "speed_ball",
    maxSpeedScale: 1.12,
  },
  9: {
    key: "enemy_flux",
    spawnEnemy: true,
    fluxField: true,
  },
  10: {
    key: "enemy_flux",
    spawnEnemy: true,
    fluxField: true,
  },
  11: {
    key: "flux",
    fluxField: true,
  },
};

export function getStageModifier(stageNumber: number): StageModifier | undefined {
  return STAGE_MODIFIERS[stageNumber];
}

export function getStageStory(stageNumber: number): number | null {
  if (stageNumber === 4 || stageNumber === 8 || stageNumber === 12) {
    return stageNumber;
  }
  return null;
}

export function getStageTimeTargetSec(stageIndex: number): number {
  return RATING_CONFIG.baseTargetSec + stageIndex * RATING_CONFIG.targetSecPerStage;
}
