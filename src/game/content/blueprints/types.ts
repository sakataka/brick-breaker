import type {
  EnemyShotProfile,
  ScoreFocus,
  StageArchetype,
  StageBoardMechanic,
  StageBonusRule,
  StageDefinition,
  StageEventKey,
  StageHazardScript,
  StagePreviewTag,
  StageSpecialPlacement,
  StageTag,
  StageVisualProfileDefinition,
} from "../../types";

export interface StageBlueprint {
  id: string;
  rows: readonly string[];
  tags?: StageTag[];
  events?: StageEventKey[];
  specials?: StageSpecialPlacement[];
  elite?: StageDefinition["elite"];
  missions?: StageDefinition["missions"];
  visualProfile?: StageVisualProfileDefinition;
  boardMechanics?: readonly StageBoardMechanic[];
  hazardScript?: StageHazardScript;
  encounterTimeline?: StageDefinition["encounterTimeline"];
  previewTags?: readonly StagePreviewTag[];
  scoreFocus?: ScoreFocus;
  bonusRules?: readonly StageBonusRule[];
  enemyShotProfile?: EnemyShotProfile;
  visualSetId?: string;
  encounter?: StageDefinition["encounter"];
}

export interface StageBlueprintCatalogEntry {
  encounterId: string;
  blueprintId: StageBlueprint["id"];
  chapter: 1 | 2 | 3 | 4;
  archetype: StageArchetype;
}
