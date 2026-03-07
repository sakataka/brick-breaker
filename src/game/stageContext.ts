import {
  getStageForCampaign,
  getStageModifier,
  getThemeBandByStageIndex,
  MODE_CONFIG,
  STAGE_CATALOG,
} from "./config";
import type { StageModifier } from "./config/stages";
import type { ThemeBandDefinition } from "./config/themes";
import type { GameConfig, GameMode, GameState, StageDefinition, StageRoute } from "./types";

export interface StageContextInput {
  stageIndex: number;
  gameMode: GameMode;
  route: StageRoute | null;
  customStageCatalog: GameState["options"]["customStageCatalog"];
}

export interface StageMetadata {
  activeCatalog: readonly StageDefinition[];
  effectiveStageIndex: number;
  totalStages: number;
  stage: StageDefinition;
  stageModifier?: StageModifier;
  themeBand: ThemeBandDefinition;
}

export interface StageContext extends StageMetadata {
  initialBallSpeed: number;
  maxBallSpeed: number;
}

export function resolveStageMetadata(input: StageContextInput): StageMetadata {
  const activeCatalog = getActiveStageCatalog(input.customStageCatalog);
  const effectiveStageIndex = getModeEffectiveStageIndex(
    input.stageIndex,
    input.gameMode,
    activeCatalog.length,
  );
  return {
    activeCatalog,
    effectiveStageIndex,
    totalStages: getTotalStagesForMode(input.gameMode, activeCatalog.length),
    stage: getStageDefinition(input, activeCatalog, effectiveStageIndex),
    stageModifier: getStageModifier(effectiveStageIndex + 1),
    themeBand: getThemeBandByStageIndex(effectiveStageIndex),
  };
}

export function resolveStageContext(
  input: StageContextInput,
  config: Pick<GameConfig, "initialBallSpeed" | "maxBallSpeed">,
): StageContext {
  const metadata = resolveStageMetadata(input);
  return {
    ...metadata,
    initialBallSpeed: getModeScaledBallSpeed(config.initialBallSpeed, input, metadata.activeCatalog.length),
    maxBallSpeed: getModeScaledBallSpeed(config.maxBallSpeed, input, metadata.activeCatalog.length),
  };
}

export function resolveStageMetadataFromState(state: Pick<GameState, "campaign" | "options">): StageMetadata {
  return resolveStageMetadata({
    stageIndex: state.campaign.stageIndex,
    gameMode: state.options.gameMode,
    route: state.campaign.resolvedRoute,
    customStageCatalog: state.options.customStageCatalog,
  });
}

export function resolveStageContextFromState(
  state: Pick<GameState, "campaign" | "options">,
  config: Pick<GameConfig, "initialBallSpeed" | "maxBallSpeed">,
): StageContext {
  return resolveStageContext(
    {
      stageIndex: state.campaign.stageIndex,
      gameMode: state.options.gameMode,
      route: state.campaign.resolvedRoute,
      customStageCatalog: state.options.customStageCatalog,
    },
    config,
  );
}

export function getStageInitialBallSpeed(
  config: Pick<GameConfig, "initialBallSpeed">,
  input: StageContextInput,
): number {
  return getModeScaledBallSpeed(
    config.initialBallSpeed,
    input,
    getActiveStageCatalog(input.customStageCatalog).length,
  );
}

export function getStageMaxBallSpeed(
  config: Pick<GameConfig, "maxBallSpeed">,
  input: StageContextInput,
): number {
  return getModeScaledBallSpeed(
    config.maxBallSpeed,
    input,
    getActiveStageCatalog(input.customStageCatalog).length,
  );
}

export function getTotalStagesForMode(mode: GameMode, stageCount: number): number {
  const safeStageCount = Math.max(1, stageCount);
  if (mode === "endless") {
    return MODE_CONFIG.endlessVirtualStages;
  }
  if (mode === "boss_rush") {
    return MODE_CONFIG.bossRushRounds;
  }
  return safeStageCount;
}

export function getModeEffectiveStageIndex(
  stageIndex: number,
  mode: GameMode,
  stageCount = STAGE_CATALOG.length,
): number {
  const safeStageCount = Math.max(1, stageCount);
  if (mode === "boss_rush") {
    return safeStageCount - 1;
  }
  if (mode === "endless") {
    return stageIndex % safeStageCount;
  }
  return stageIndex;
}

function getActiveStageCatalog(
  customStageCatalog: GameState["options"]["customStageCatalog"],
): readonly StageDefinition[] {
  if (customStageCatalog && customStageCatalog.length > 0) {
    return customStageCatalog;
  }
  return STAGE_CATALOG;
}

function getStageDefinition(
  input: StageContextInput,
  activeCatalog: readonly StageDefinition[],
  effectiveStageIndex: number,
): StageDefinition {
  if (input.customStageCatalog && activeCatalog.length > 0) {
    return activeCatalog[effectiveStageIndex] ?? activeCatalog[activeCatalog.length - 1] ?? STAGE_CATALOG[0];
  }
  return getStageForCampaign(effectiveStageIndex, input.gameMode === "campaign" ? input.route : null);
}

function getModeScaledBallSpeed(baseSpeed: number, input: StageContextInput, stageCount: number): number {
  const effectiveStageIndex = getModeEffectiveStageIndex(input.stageIndex, input.gameMode, stageCount);
  const stage = getStageDefinition(
    input,
    getActiveStageCatalog(input.customStageCatalog),
    effectiveStageIndex,
  );
  const baseScale = stage.speedScale;
  if (input.gameMode !== "boss_rush") {
    return baseSpeed * baseScale;
  }
  const rushScale = 1 + Math.max(0, input.stageIndex) * MODE_CONFIG.bossRushSpeedScaleStep;
  return baseSpeed * baseScale * rushScale;
}
