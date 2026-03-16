import type { StageModifierKey } from "../config";
import type { StageMissionStatus } from "../types";
import type { VisualState } from "../uiTheme";
import type { BossAttackKind, ItemType, ScoreFocus, StagePreviewTag, ThreatLevel } from "../types";

export interface HudActiveItemView {
  type: ItemType;
  count: number;
}

export interface HudScoreFeedView {
  label: string;
  amount: number;
  tone: "score" | "style" | "record";
  progress: number;
}

export interface HudViewModel {
  score: number;
  lives: number;
  elapsedSec: number;
  comboMultiplier: number;
  scoreFeed: HudScoreFeedView[];
  stage: {
    current: number;
    total: number;
    modifierKey?: StageModifierKey;
    scoreFocus: ScoreFocus;
    boss?: {
      hp: number;
      maxHp: number;
      phase: 1 | 2 | 3;
      intent?: BossAttackKind;
      castProgress?: number;
      weakWindowProgress?: number;
    };
    threatLevel: ThreatLevel;
    previewTags: readonly StagePreviewTag[];
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
  styleBonus: {
    chainLevel: number;
    lastBonusLabel: string | null;
    lastBonusScore: number;
  };
  record: {
    currentRunRecord: boolean;
    deltaToBest: number;
    courseBestScore: number;
  };
  pickupToast?: {
    type: ItemType;
    color: string;
    progress: number;
  };
}
