import type { StageModifierKey } from "../config";
import type { StageMissionStatus, StageRoute } from "../types";
import type { VisualState } from "../uiTheme";
import type { BossAttackKind, ItemType } from "../types";

export interface HudActiveItemView {
  type: ItemType;
  count: number;
}

export interface HudViewModel {
  score: number;
  lives: number;
  elapsedSec: number;
  comboMultiplier: number;
  stage: {
    current: number;
    total: number;
    route: StageRoute | null;
    modifierKey?: StageModifierKey;
    boss?: {
      hp: number;
      maxHp: number;
      phase: 1 | 2 | 3;
      intent?: BossAttackKind;
      castProgress?: number;
      weakWindowProgress?: number;
    };
    debugModeEnabled: boolean;
    debugRecordResults: boolean;
  };
  missionProgress: StageMissionStatus[];
  activeItems: HudActiveItemView[];
  visual: VisualState;
  flags: {
    hazardBoostActive: boolean;
    pierceSlowSynergy: boolean;
    magicCooldownSec: number;
    warpLegendVisible: boolean;
    steelLegendVisible: boolean;
    generatorLegendVisible: boolean;
    gateLegendVisible: boolean;
    turretLegendVisible: boolean;
  };
  progressRatio: number;
  pickupToast?: {
    type: ItemType;
    color: string;
    progress: number;
  };
}
