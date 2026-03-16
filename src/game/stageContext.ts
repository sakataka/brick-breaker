import type { StageModifier } from "./config/stages";
import { getStageModifier, STAGE_CATALOG } from "./config/stages";
import type { StageVisualProfile } from "./config/themes";
import { getVisualProfile } from "./config/themes";
import { getEncounterDefinition, getRunDefinition, type ThreatTier } from "./content/runDefinition";
import type { GameConfig, GameState, MusicCue, StageDefinition, StagePreviewTag } from "./types";

export interface StageContextInput {
  stageIndex: number;
  threatTier: ThreatTier;
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
  const run = getRunDefinition(input.threatTier);
  const activeCatalog = run.encounters.map((entry) => entry.stage);
  const effectiveStageIndex = clampStageIndex(input.stageIndex, activeCatalog.length);
  const stage = getEncounterDefinition(input.threatTier, effectiveStageIndex).stage;
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
    themeBand: resolveVisualProfile(stage, input.threatTier),
    visualProfile: resolveVisualProfile(stage, input.threatTier),
    musicCue: resolveMusicCue(stage, effectiveStageIndex, input.threatTier),
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

export function resolveStageMetadataFromState(state: Pick<GameState, "run">): StageMetadata {
  return resolveStageMetadata({
    stageIndex: state.run.progress.encounterIndex,
    threatTier: resolveThreatTier(state.run.options),
  });
}

export function resolveUpcomingStagePreviewFromState(state: Pick<GameState, "run">): {
  stageNumber: number;
  previewTags: readonly StagePreviewTag[];
  scoreFocus: NonNullable<StageDefinition["scoreFocus"]>;
} | null {
  const current = resolveStageMetadataFromState(state);
  const nextStageIndex = current.effectiveStageIndex + 1;
  if (nextStageIndex >= current.activeCatalog.length) {
    return null;
  }
  const stage = resolveStageMetadata({
    stageIndex: nextStageIndex,
    threatTier: resolveThreatTier(state.run.options),
  }).stage;
  return {
    stageNumber: nextStageIndex + 1,
    previewTags: stage.previewTags ?? [],
    scoreFocus: stage.scoreFocus ?? "survival_chain",
  };
}

export function resolveStageContextFromState(
  state: Pick<GameState, "run">,
  config: Pick<GameConfig, "initialBallSpeed" | "maxBallSpeed">,
): StageContext {
  return resolveStageContext(
    {
      stageIndex: state.run.progress.encounterIndex,
      threatTier: resolveThreatTier(state.run.options),
    },
    config,
  );
}

export function getStageInitialBallSpeed(
  config: Pick<GameConfig, "initialBallSpeed">,
  input: StageContextInput,
): number {
  return config.initialBallSpeed * resolveStageMetadata(input).stage.speedScale;
}

function clampStageIndex(stageIndex: number, stageCount = STAGE_CATALOG.length): number {
  const lastIndex = Math.max(0, stageCount - 1);
  return Math.max(0, Math.min(lastIndex, stageIndex));
}

function resolveThreatTier(
  options: Partial<Pick<GameState["run"]["options"], "threatTier">>,
): ThreatTier {
  return options.threatTier ?? 1;
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

function resolveVisualProfile(stage: StageDefinition, threatTier: ThreatTier): StageVisualProfile {
  if (threatTier === 2) {
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

function resolveMusicCue(
  stage: StageDefinition,
  effectiveStageIndex: number,
  threatTier: ThreatTier,
): MusicCue {
  if (threatTier === 2) {
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
