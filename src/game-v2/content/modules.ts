import { ITEM_ORDER, ITEM_REGISTRY } from "../public/items";
import type { ItemType, StagePreviewTag } from "../public/types";

export type PublicModuleCategory = "core" | "tactical" | "active";
export type PublicModuleRole = "offense" | "control" | "survival" | "break";

export interface PublicModuleDefinition {
  type: ItemType;
  category: PublicModuleCategory;
  role: PublicModuleRole;
  previewTags: readonly StagePreviewTag[];
  counterplayTags: readonly StagePreviewTag[];
  encounterBias?: "midboss" | "boss" | "any";
}

export interface PublicModuleCatalog {
  core: readonly PublicModuleDefinition[];
  tactical: readonly PublicModuleDefinition[];
  active: readonly PublicModuleDefinition[];
}

function resolveCategory(type: ItemType): PublicModuleCategory {
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

function resolveRole(type: ItemType): PublicModuleRole {
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

function toPublicModule(type: ItemType): PublicModuleDefinition {
  const module = ITEM_REGISTRY[type];
  return {
    type,
    category: resolveCategory(type),
    role: resolveRole(type),
    previewTags: module.previewAffinity,
    counterplayTags: module.counterplayTags,
    encounterBias: module.encounterBias,
  };
}

const ALL_MODULES = ITEM_ORDER.map((type) => toPublicModule(type));

export const PUBLIC_MODULE_CATALOG: PublicModuleCatalog = {
  core: ALL_MODULES.filter((module) => module.category === "core"),
  tactical: ALL_MODULES.filter((module) => module.category === "tactical"),
  active: ALL_MODULES.filter((module) => module.category === "active"),
};

export function listPublicModules(): readonly PublicModuleDefinition[] {
  return [
    ...PUBLIC_MODULE_CATALOG.core,
    ...PUBLIC_MODULE_CATALOG.tactical,
    ...PUBLIC_MODULE_CATALOG.active,
  ];
}
