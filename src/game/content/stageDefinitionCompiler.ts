import type { StageDefinition } from "../types";
import { getStageBlueprint, type StageBlueprintCatalogEntry } from "./stageBlueprints";
import {
  inferBoardMechanics,
  inferBonusRules,
  inferEncounterTimeline,
  inferEnemyShotProfile,
  inferHazardScript,
  inferPreviewTags,
  inferScoreFocus,
  inferStageMissions,
  inferVisualProfile,
  inferVisualSetId,
} from "./stageDefinitionDefaults";

function parseStageLayout(rows: readonly string[]): number[][] {
  return rows.map((row) => row.split("").map((cell) => (cell === "1" ? 1 : 0)));
}

function computeStageSpeedScale(index: number, total: number): number {
  if (total <= 1) {
    return 1;
  }
  const min = 1;
  const max = 1.18;
  const ratio = index / (total - 1);
  return min + (max - min) * ratio;
}

export function buildStageDefinitionFromCatalogEntry(
  entry: StageBlueprintCatalogEntry,
  index: number,
  allEntries: readonly StageBlueprintCatalogEntry[],
): StageDefinition {
  const blueprint = getStageBlueprint(entry.blueprintId);
  return {
    id: index + 1,
    speedScale: Number(computeStageSpeedScale(index, allEntries.length).toFixed(3)),
    layout: parseStageLayout(blueprint.rows),
    chapter: entry.chapter,
    archetype: entry.archetype,
    tags: blueprint.tags,
    events: blueprint.events,
    specials: blueprint.specials,
    elite: blueprint.elite,
    missions: blueprint.missions ?? inferStageMissions(index + 1, blueprint),
    visualProfile: blueprint.visualProfile ?? inferVisualProfile(entry, blueprint),
    boardMechanics: blueprint.boardMechanics ?? inferBoardMechanics(blueprint),
    hazardScript: blueprint.hazardScript ?? inferHazardScript(blueprint),
    encounterTimeline: blueprint.encounterTimeline ?? inferEncounterTimeline(blueprint),
    previewTags: blueprint.previewTags ?? inferPreviewTags(blueprint),
    scoreFocus: blueprint.scoreFocus ?? inferScoreFocus(blueprint),
    bonusRules: blueprint.bonusRules ?? inferBonusRules(blueprint),
    enemyShotProfile: blueprint.enemyShotProfile ?? inferEnemyShotProfile(blueprint),
    visualSetId: blueprint.visualSetId ?? inferVisualSetId(entry, blueprint),
    encounter: blueprint.encounter,
  };
}

export function buildStageCatalog(
  entries: readonly StageBlueprintCatalogEntry[],
): StageDefinition[] {
  return entries.map((entry, index, allEntries) =>
    buildStageDefinitionFromCatalogEntry(entry, index, allEntries),
  );
}
