import type {
  HudViewModel,
  MetaProgress,
  OverlayViewModel,
  ShopUiView,
  StartSettingsSelection,
} from "../public";
import { START_SETTINGS_DEFAULT } from "../public/startSettings";
import { getFallbackThemeTokens } from "../public/uiTheme";

export interface AccessibilitySnapshot {
  reducedMotion: boolean;
  highContrast: boolean;
}

const fallbackTokens = getFallbackThemeTokens();

export function createDefaultHudView(): HudViewModel {
  return {
    score: 0,
    lives: 4,
    elapsedSec: 0,
    comboMultiplier: 1,
    scoreFeed: [],
    stage: {
      current: 1,
      total: 12,
      scoreFocus: "survival_chain",
      threatLevel: "low",
      previewTags: [],
    },
    activeItems: [],
    visual: {
      themeId: "chapter1",
      assetProfileId: "chapter1",
      chapterLabel: "Chapter 1",
      warningLevel: "calm",
      encounterEmphasis: "chapter",
      motionProfile: "full",
      backdropDepth: "stellar",
      arenaFrame: "clean",
      blockMaterial: "glass",
      particleDensity: 1,
      cameraIntensity: "steady",
      bossTone: "hunter",
      tokens: fallbackTokens,
    },
    missionProgress: [],
    flags: {
      hazardBoostActive: false,
      pierceSlowSynergy: false,
      magicCooldownSec: 0,
      warpLegendVisible: false,
      steelLegendVisible: false,
      generatorLegendVisible: false,
      gateLegendVisible: false,
      turretLegendVisible: false,
    },
    progressRatio: 0,
    styleBonus: {
      chainLevel: 0,
      lastBonusLabel: null,
      lastBonusScore: 0,
    },
    record: {
      currentRunRecord: false,
      deltaToBest: 0,
      courseBestScore: 0,
    },
  };
}

export function createDefaultOverlayView(metaProgress?: MetaProgress): OverlayViewModel {
  return {
    scene: "start",
    score: 0,
    lives: 4,
    stage: {
      current: 1,
      total: 12,
    },
    visual: {
      themeId: "chapter1",
      assetProfileId: "chapter1",
      chapterLabel: "Chapter 1",
      warningLevel: "calm",
      encounterEmphasis: "chapter",
      motionProfile: "full",
      backdropDepth: "stellar",
      arenaFrame: "clean",
      blockMaterial: "glass",
      particleDensity: 1,
      cameraIntensity: "steady",
      bossTone: "hunter",
      tokens: fallbackTokens,
    },
    record: {
      overallBestScore: metaProgress?.records.overallBestScore ?? 0,
      courseBestScore: metaProgress?.records.tier1BestScore ?? 0,
      latestRunScore: metaProgress?.records.latestRunScore ?? 0,
      deltaToBest: 0,
      currentRunRecord: false,
    },
  };
}

export function createDefaultShopView(): ShopUiView {
  return {
    visible: false,
    status: "hidden",
    cost: 0,
    priceBandVisible: false,
    optionAType: null,
    optionBType: null,
    optionADisabled: true,
    optionBDisabled: true,
    optionA: { type: null, role: null, previewAffinity: [], counterplayTags: [] },
    optionB: { type: null, role: null, previewAffinity: [], counterplayTags: [] },
    previewStageNumber: null,
    previewFocus: null,
    previewTags: [],
  };
}

export function createInitialStartSettings(
  accessibility?: AccessibilitySnapshot | null,
): StartSettingsSelection {
  return {
    ...START_SETTINGS_DEFAULT,
    reducedMotionEnabled:
      accessibility?.reducedMotion ?? START_SETTINGS_DEFAULT.reducedMotionEnabled,
    highContrastEnabled: accessibility?.highContrast ?? START_SETTINGS_DEFAULT.highContrastEnabled,
  };
}
