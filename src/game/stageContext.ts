import { MODE_CONFIG } from "./config/gameplay";
import type { StageModifier } from "./config/stages";
import {
  EX_STAGE_CATALOG,
  getExStageByIndex,
  getStageForCampaign,
  getStageModifier,
  STAGE_CATALOG,
} from "./config/stages";
import type { StageVisualProfile } from "./config/themes";
import { getVisualProfile } from "./config/themes";
import type { GameConfig, GameMode, GameState, MusicCue, StageDefinition, StageRoute } from "./types";

export interface StageContextInput {
  stageIndex: number;
  gameMode: GameMode;
  campaignCourse: GameState["options"]["campaignCourse"];
  route: StageRoute | null;
  customStageCatalog: GameState["options"]["customStageCatalog"];
}

export interface StageMetadata {
  activeCatalog: readonly StageDefinition[];
  effectiveStageIndex: number;
  totalStages: number;
  stage: StageDefinition;
  chapter: number;
  stageArchetype?: StageDefinition["archetype"];
  stageTags: StageDefinition["tags"];
  stageEvents: StageDefinition["events"];
  stageModifier?: StageModifier;
  themeBand: StageVisualProfile;
  visualProfile: StageVisualProfile;
  musicCue: MusicCue;
}

export interface StageContext extends StageMetadata {
  initialBallSpeed: number;
  maxBallSpeed: number;
}

export function resolveStageMetadata(input: StageContextInput): StageMetadata {
  const activeCatalog = getActiveStageCatalog(input.customStageCatalog, input.campaignCourse);
  const effectiveStageIndex = getModeEffectiveStageIndex(
    input.stageIndex,
    input.gameMode,
    activeCatalog.length,
  );
  const stage = getStageDefinition(input, activeCatalog, effectiveStageIndex);
  return {
    activeCatalog,
    effectiveStageIndex,
    totalStages: getTotalStagesForMode(input.gameMode, activeCatalog.length),
    stage,
    chapter: stage.chapter ?? inferChapter(effectiveStageIndex),
    stageArchetype: stage.archetype,
    stageTags: stage.tags ?? [],
    stageEvents: stage.events ?? [],
    stageModifier: getStageModifier(effectiveStageIndex + 1),
    themeBand: resolveVisualProfile(stage),
    visualProfile: resolveVisualProfile(stage),
    musicCue: resolveMusicCue(stage, effectiveStageIndex),
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
    campaignCourse: state.options.campaignCourse,
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
      campaignCourse: state.options.campaignCourse,
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
    getActiveStageCatalog(input.customStageCatalog, input.campaignCourse).length,
  );
}

export function getStageMaxBallSpeed(
  config: Pick<GameConfig, "maxBallSpeed">,
  input: StageContextInput,
): number {
  return getModeScaledBallSpeed(
    config.maxBallSpeed,
    input,
    getActiveStageCatalog(input.customStageCatalog, input.campaignCourse).length,
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
  campaignCourse: GameState["options"]["campaignCourse"],
): readonly StageDefinition[] {
  if (customStageCatalog && customStageCatalog.length > 0) {
    return customStageCatalog;
  }
  return campaignCourse === "ex" ? EX_STAGE_CATALOG : STAGE_CATALOG;
}

function getStageDefinition(
  input: StageContextInput,
  activeCatalog: readonly StageDefinition[],
  effectiveStageIndex: number,
): StageDefinition {
  if (input.customStageCatalog && activeCatalog.length > 0) {
    return activeCatalog[effectiveStageIndex] ?? activeCatalog[activeCatalog.length - 1] ?? STAGE_CATALOG[0];
  }
  if (input.campaignCourse === "ex") {
    return getExStageByIndex(effectiveStageIndex);
  }
  return getStageForCampaign(effectiveStageIndex, input.gameMode === "campaign" ? input.route : null);
}

function getModeScaledBallSpeed(baseSpeed: number, input: StageContextInput, stageCount: number): number {
  const effectiveStageIndex = getModeEffectiveStageIndex(input.stageIndex, input.gameMode, stageCount);
  const stage = getStageDefinition(
    input,
    getActiveStageCatalog(input.customStageCatalog, input.campaignCourse),
    effectiveStageIndex,
  );
  const baseScale = stage.speedScale;
  if (input.gameMode !== "boss_rush") {
    return baseSpeed * baseScale;
  }
  const rushScale = 1 + Math.max(0, input.stageIndex) * MODE_CONFIG.bossRushSpeedScaleStep;
  return baseSpeed * baseScale * rushScale;
}

function inferChapter(stageIndex: number): number {
  if (stageIndex >= 11) {
    return 4;
  }
  if (stageIndex >= 8) {
    return 4;
  }
  if (stageIndex >= 5) {
    return 3;
  }
  if (stageIndex >= 3) {
    return 2;
  }
  return 1;
}

function resolveVisualProfile(stage: StageDefinition): StageVisualProfile {
  if (stage.course === "ex") {
    return getVisualProfile("ex");
  }
  if (stage.encounter?.kind === "boss") {
    return getVisualProfile("finalboss");
  }
  if (stage.encounter?.kind === "ex_boss") {
    return getVisualProfile("ex");
  }
  if (stage.encounter?.kind === "midboss") {
    return getVisualProfile("midboss");
  }
  switch (stage.chapter) {
    case 2:
      return getVisualProfile("chapter2");
    case 3:
      return getVisualProfile("chapter3");
    case 4:
      return getVisualProfile("chapter3");
    default:
      return getVisualProfile("chapter1");
  }
}

function resolveMusicCue(stage: StageDefinition, effectiveStageIndex: number): MusicCue {
  if (stage.course === "ex") {
    return {
      id: "ex",
      variant: (effectiveStageIndex % 4) + 1,
    };
  }
  if (stage.encounter?.kind === "boss") {
    return { id: "finalboss", variant: 1 };
  }
  if (stage.encounter?.kind === "midboss") {
    return { id: "midboss", variant: stage.id >= 8 ? 2 : 1 };
  }
  switch (stage.chapter) {
    case 2:
      return { id: "chapter2", variant: Math.min(3, Math.max(1, stage.id - 3)) };
    case 3:
      return { id: "chapter3", variant: Math.min(3, Math.max(1, stage.id - 6)) };
    case 4:
      return { id: "chapter3", variant: Math.min(3, Math.max(1, stage.id - 9)) };
    default:
      return { id: "chapter1", variant: Math.min(3, Math.max(1, effectiveStageIndex + 1)) };
  }
}
