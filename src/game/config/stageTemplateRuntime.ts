import { validateStageCatalog } from "../configSchema";
import type {
  EncounterTimelineEvent,
  EnemyShotProfile,
  ScoreFocus,
  StageBoardMechanic,
  StageBonusRule,
  StageDefinition,
  StageHazardScript,
  StagePreviewTag,
  StageVisualProfileDefinition,
} from "../types";
import {
  CAMPAIGN_STAGE_BLUEPRINT_CATALOG,
  getStageBlueprint,
  THREAT_TIER_2_STAGE_BLUEPRINT_CATALOG,
  type StageBlueprint,
  type StageBlueprintCatalogEntry,
} from "../content/stageBlueprints";
import { RATING_CONFIG } from "./gameplay";

export interface BrickLayout {
  cols: number;
  rows: number;
  marginX: number;
  marginY: number;
  gapX: number;
  gapY: number;
  boardWidth: number;
  brickHeight: number;
}

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

export const BRICK_LAYOUT: BrickLayout = {
  cols: 10,
  rows: 6,
  marginX: 50,
  marginY: 80,
  gapX: 8,
  gapY: 10,
  boardWidth: 840,
  brickHeight: 24,
};

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

function buildCatalog(entries: readonly StageBlueprintCatalogEntry[]): StageDefinition[] {
  return entries.map((entry, index, allEntries) =>
    buildStageDefinitionFromCatalogEntry(entry, index, allEntries),
  );
}

export const STAGE_CATALOG: StageDefinition[] = buildCatalog(CAMPAIGN_STAGE_BLUEPRINT_CATALOG);
const THREAT_TIER_2_STAGE_CATALOG: StageDefinition[] = buildCatalog(
  THREAT_TIER_2_STAGE_BLUEPRINT_CATALOG,
);

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

export function getStageByIndex(stageIndex: number): StageDefinition {
  const safeIndex = Math.max(0, Math.min(STAGE_CATALOG.length - 1, stageIndex));
  return STAGE_CATALOG[safeIndex];
}

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

function inferStageMissions(
  stageNumber: number,
  blueprint: StageBlueprint,
): StageDefinition["missions"] {
  if (blueprint.tags?.includes("generator")) {
    return ["shutdown_generator", "no_shop"];
  }
  if (blueprint.tags?.includes("turret")) {
    return ["destroy_turret_first", "combo_x2"];
  }
  if (blueprint.encounter) {
    return ["time_limit", "combo_x2"];
  }
  return stageNumber >= 9 ? ["time_limit", "combo_x2"] : ["time_limit", "no_shop"];
}

function inferVisualProfile(
  entry: StageBlueprintCatalogEntry,
  blueprint: StageBlueprint,
): StageVisualProfileDefinition {
  if (blueprint.encounter?.kind === "tier2_boss") {
    return {
      depth: "fortress",
      arenaFrame: "citadel",
      blockMaterial: "core",
      particleDensity: 1.3,
      cameraIntensity: "assault",
      bossTone: "overlord",
    };
  }
  if (blueprint.encounter?.profile === "final_core") {
    return {
      depth: "fortress",
      arenaFrame: "citadel",
      blockMaterial: "core",
      particleDensity: 1.24,
      cameraIntensity: "assault",
      bossTone: "citadel",
    };
  }
  if (blueprint.encounter?.profile === "artillery") {
    return {
      depth: "orbital",
      arenaFrame: "hazard",
      blockMaterial: "alloy",
      particleDensity: 1.12,
      cameraIntensity: "alert",
      bossTone: "artillery",
    };
  }
  if (blueprint.encounter?.profile === "warden") {
    return {
      depth: "orbital",
      arenaFrame: "hazard",
      blockMaterial: "armor",
      particleDensity: 1.05,
      cameraIntensity: "alert",
      bossTone: "hunter",
    };
  }
  switch (entry.chapter) {
    case 4:
      return {
        depth: "fortress",
        arenaFrame: "hazard",
        blockMaterial: "armor",
        particleDensity: 1.12,
        cameraIntensity: "alert",
        bossTone: "citadel",
      };
    case 3:
      return {
        depth: "orbital",
        arenaFrame: "hazard",
        blockMaterial: "alloy",
        particleDensity: 1,
        cameraIntensity: "alert",
        bossTone: "artillery",
      };
    case 2:
      return {
        depth: "orbital",
        arenaFrame: "hazard",
        blockMaterial: "alloy",
        particleDensity: 0.94,
        cameraIntensity: "alert",
        bossTone: "hunter",
      };
    default:
      return {
        depth: "stellar",
        arenaFrame: "clean",
        blockMaterial: "glass",
        particleDensity: 0.86,
        cameraIntensity: "steady",
        bossTone: "hunter",
      };
  }
}

function inferBoardMechanics(blueprint: StageBlueprint): readonly StageBoardMechanic[] {
  const mechanics: StageBoardMechanic[] = [];
  if (blueprint.tags?.includes("gate")) {
    mechanics.push({ role: "shield", label: "Gate Grid", intensity: "medium" });
  }
  if (blueprint.tags?.includes("generator")) {
    mechanics.push({ role: "relay", label: "Relay Core", intensity: "high" });
  }
  if (blueprint.tags?.includes("turret")) {
    mechanics.push({ role: "turret", label: "Turret Lane", intensity: "high" });
  }
  if (blueprint.tags?.includes("enemy_pressure")) {
    mechanics.push({ role: "hazard", label: "Pressure Wave", intensity: "high" });
  }
  if (blueprint.encounter) {
    mechanics.push({
      role: blueprint.encounter.profile === "final_core" ? "reactor" : "shield",
      label:
        blueprint.encounter.profile === "artillery"
          ? "Artillery Window"
          : blueprint.encounter.profile === "final_core"
            ? "Fortress Core"
            : "Boss Guard",
      intensity: blueprint.encounter.kind === "tier2_boss" ? "critical" : "high",
    });
  }
  return mechanics.slice(0, 2);
}

function inferHazardScript(blueprint: StageBlueprint): StageHazardScript {
  if (blueprint.encounter) {
    return {
      id: "boss_arena",
      intensity: blueprint.encounter.kind === "tier2_boss" ? "critical" : "high",
    };
  }
  if (blueprint.events?.includes("turret_fire")) {
    return { id: "turret_crossfire", intensity: "high" };
  }
  if (blueprint.events?.includes("gate_cycle")) {
    return { id: "gate_pulse", intensity: "medium" };
  }
  if (blueprint.events?.includes("enemy_pressure")) {
    return { id: "flux_field", intensity: "high" };
  }
  if (blueprint.tags?.includes("generator")) {
    return { id: "reactor_chain", intensity: "medium" };
  }
  return { id: "none", intensity: "low" };
}

function inferEncounterTimeline(blueprint: StageBlueprint): StageDefinition["encounterTimeline"] {
  const timeline: EncounterTimelineEvent[] = [
    { trigger: "stage_start", cue: "shield_online", threatLevel: "low", durationSec: 1.2 },
  ];
  if (blueprint.events?.includes("turret_fire")) {
    timeline.push({
      trigger: "elapsed_10",
      cue: "turret_crossfire",
      threatLevel: "high",
      durationSec: 1.4,
    });
  }
  if (blueprint.tags?.includes("generator")) {
    timeline.push({
      trigger: "generator_down",
      cue: "reactor_critical",
      threatLevel: "medium",
      durationSec: 1.35,
    });
  }
  if (blueprint.encounter) {
    timeline.push({
      trigger: "boss_phase_2",
      cue: "boss_phase_shift",
      threatLevel: "high",
      durationSec: 1.25,
    });
    timeline.push({
      trigger: "boss_phase_3",
      cue: "stage_breakthrough",
      threatLevel: "critical",
      durationSec: 1.35,
    });
  }
  return timeline;
}

function inferPreviewTags(blueprint: StageBlueprint): readonly StagePreviewTag[] {
  const tags: StagePreviewTag[] = [];
  if (blueprint.events?.includes("gate_cycle")) {
    tags.push("shielded_grid", "gate_pressure");
  }
  if (blueprint.tags?.includes("generator")) {
    tags.push("relay_chain", "reactor_chain");
  }
  if (blueprint.tags?.includes("turret")) {
    tags.push("turret_lane");
  }
  if (blueprint.events?.includes("enemy_pressure")) {
    tags.push("hazard_flux", "survival_check");
  }
  if (blueprint.encounter) {
    tags.push("boss_break");
    if (
      blueprint.encounter.profile === "final_core" ||
      blueprint.encounter.profile === "tier2_overlord"
    ) {
      tags.push("fortress_core");
    }
    if (
      blueprint.encounter.profile === "warden" ||
      blueprint.encounter.profile === "tier2_overlord"
    ) {
      tags.push("sweep_alert");
    }
  }
  if (tags.length <= 0) {
    tags.push("survival_check");
  }
  return [...new Set(tags)].slice(0, 3);
}

function inferScoreFocus(blueprint: StageBlueprint): ScoreFocus {
  if (blueprint.encounter) {
    return "boss_break";
  }
  if (blueprint.tags?.includes("turret") || blueprint.events?.includes("turret_fire")) {
    return "turret_cancel";
  }
  if (blueprint.tags?.includes("generator")) {
    return "reactor_chain";
  }
  return "survival_chain";
}

function inferBonusRules(blueprint: StageBlueprint): readonly StageBonusRule[] {
  const rules: StageBonusRule[] = [];
  if (blueprint.events?.includes("enemy_pressure")) {
    rules.push("hazard_first");
  }
  if (blueprint.tags?.includes("turret") || blueprint.events?.includes("turret_fire")) {
    rules.push("cancel_shots");
  }
  if (blueprint.encounter) {
    rules.push("weak_window_burst");
  }
  if (!blueprint.tags?.includes("turret") && !blueprint.encounter) {
    rules.push("no_drop_chain");
  }
  return rules;
}

function inferEnemyShotProfile(blueprint: StageBlueprint): EnemyShotProfile {
  if (
    blueprint.encounter?.profile === "final_core" ||
    blueprint.encounter?.profile === "tier2_overlord"
  ) {
    return "void_core";
  }
  if (blueprint.tags?.includes("turret") || blueprint.events?.includes("turret_fire")) {
    return "plasma_bolt";
  }
  return "spike_orb";
}

function inferVisualSetId(entry: StageBlueprintCatalogEntry, blueprint: StageBlueprint): string {
  if (blueprint.encounter?.kind === "tier2_boss") {
    return "sfc-arcade-tier2";
  }
  if (blueprint.encounter) {
    return `sfc-arcade-${blueprint.encounter.profile}`;
  }
  return `sfc-arcade-ch${entry.chapter}`;
}

validateStageCatalog(STAGE_CATALOG);
validateStageCatalog(THREAT_TIER_2_STAGE_CATALOG);
