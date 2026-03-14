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
import type { GameConfig, GameState, MusicCue, StageDefinition, StageRoute } from "./types";

export interface StageContextInput {
  stageIndex: number;
  campaignCourse: GameState["options"]["campaignCourse"];
  route: StageRoute | null;
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
  const activeCatalog = getActiveStageCatalog(input.campaignCourse);
  const effectiveStageIndex = clampStageIndex(input.stageIndex, activeCatalog.length);
  const stage = getStageDefinition(input, effectiveStageIndex);
  return {
    activeCatalog,
    effectiveStageIndex,
    totalStages: activeCatalog.length,
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
  const stage = metadata.stage;
  return {
    ...metadata,
    initialBallSpeed: config.initialBallSpeed * stage.speedScale,
    maxBallSpeed: config.maxBallSpeed * stage.speedScale,
  };
}

export function resolveStageMetadataFromState(
  state: Pick<GameState, "campaign" | "options">,
): StageMetadata {
  return resolveStageMetadata({
    stageIndex: state.campaign.stageIndex,
    campaignCourse: state.options.campaignCourse,
    route: state.campaign.resolvedRoute,
  });
}

export function resolveStageContextFromState(
  state: Pick<GameState, "campaign" | "options">,
  config: Pick<GameConfig, "initialBallSpeed" | "maxBallSpeed">,
): StageContext {
  return resolveStageContext(
    {
      stageIndex: state.campaign.stageIndex,
      campaignCourse: state.options.campaignCourse,
      route: state.campaign.resolvedRoute,
    },
    config,
  );
}

export function getStageInitialBallSpeed(
  config: Pick<GameConfig, "initialBallSpeed">,
  input: StageContextInput,
): number {
  return (
    config.initialBallSpeed *
    getStageDefinition(input, clampStageIndex(input.stageIndex)).speedScale
  );
}

function getActiveStageCatalog(
  campaignCourse: GameState["options"]["campaignCourse"],
): readonly StageDefinition[] {
  return campaignCourse === "ex" ? EX_STAGE_CATALOG : STAGE_CATALOG;
}

function getStageDefinition(
  input: StageContextInput,
  effectiveStageIndex: number,
): StageDefinition {
  if (input.campaignCourse === "ex") {
    return getExStageByIndex(effectiveStageIndex);
  }
  return getStageForCampaign(effectiveStageIndex, input.route);
}

function clampStageIndex(stageIndex: number, stageCount = STAGE_CATALOG.length): number {
  const lastIndex = Math.max(0, stageCount - 1);
  return Math.max(0, Math.min(lastIndex, stageIndex));
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
    return { id: "ex", variant: 0 };
  }
  if (stage.encounter?.kind === "boss") {
    return { id: "finalboss", variant: 0 };
  }
  if (stage.encounter?.kind === "midboss") {
    return { id: "midboss", variant: 0 };
  }
  if (effectiveStageIndex >= 8) {
    return { id: "chapter3", variant: 0 };
  }
  if (effectiveStageIndex >= 4) {
    return { id: "chapter2", variant: 0 };
  }
  return { id: "chapter1", variant: 0 };
}
