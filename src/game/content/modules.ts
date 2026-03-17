import { ITEM_ORDER, ITEM_REGISTRY } from "../itemRegistry";
import type { ItemType, StagePreviewTag } from "../types";

export type ModuleRole = "offense" | "control" | "survival" | "break";
export type ModuleCategory = "core" | "tactical" | "active";

export interface ModuleDefinition {
  type: ItemType;
  category: ModuleCategory;
  role: ModuleRole;
  color: string;
  encounterBias?: "midboss" | "boss" | "any";
  synergyTags: readonly ("offense" | "control" | "survival" | "boss_break")[];
  counterplayTags: readonly StagePreviewTag[];
  previewTags: readonly StagePreviewTag[];
}

export interface ModuleCatalog {
  core: readonly ModuleDefinition[];
  tactical: readonly ModuleDefinition[];
  active: readonly ModuleDefinition[];
}

function resolveModuleRole(type: ItemType): ModuleRole {
  switch (type) {
    case "shield":
    case "slow_ball":
      return "survival";
    case "pierce":
    case "rail":
      return "break";
    case "laser":
    case "pulse":
      return "offense";
    default:
      return ITEM_REGISTRY[type].roleTag === "control" ? "control" : "offense";
  }
}

function resolveModuleCategory(type: ItemType): ModuleCategory {
  switch (type) {
    case "bomb":
    case "shockwave":
      return "tactical";
    case "laser":
    case "pulse":
      return "active";
    default:
      return "core";
  }
}

function buildDefinitions(): ModuleDefinition[] {
  return ITEM_ORDER.map((type) => ({
    type,
    category: resolveModuleCategory(type),
    role: resolveModuleRole(type),
    color: ITEM_REGISTRY[type].color,
    encounterBias: ITEM_REGISTRY[type].encounterBias,
    synergyTags: ITEM_REGISTRY[type].synergyTags,
    counterplayTags: ITEM_REGISTRY[type].counterplayTags,
    previewTags: ITEM_REGISTRY[type].previewAffinity,
  }));
}

const ALL_MODULES = buildDefinitions();

const MODULE_CATALOG: ModuleCatalog = {
  core: ALL_MODULES.filter((entry) => entry.category === "core"),
  tactical: ALL_MODULES.filter((entry) => entry.category === "tactical"),
  active: ALL_MODULES.filter((entry) => entry.category === "active"),
};

export const CORE_MODULE_CATALOG = MODULE_CATALOG.core;
export const TACTICAL_PICKUP_CATALOG = MODULE_CATALOG.tactical;
export const ACTIVE_SKILL_CATALOG = MODULE_CATALOG.active;

export function validateModuleCatalog(catalog: ModuleCatalog = MODULE_CATALOG): string[] {
  const issues: string[] = [];
  const allEntries = [...catalog.core, ...catalog.tactical, ...catalog.active];
  if (allEntries.length !== ITEM_ORDER.length) {
    issues.push(`module catalog size mismatch: ${allEntries.length}/${ITEM_ORDER.length}`);
  }
  for (const type of ITEM_ORDER) {
    if (!allEntries.some((entry) => entry.type === type)) {
      issues.push(`missing module definition: ${type}`);
    }
  }
  return issues;
}
