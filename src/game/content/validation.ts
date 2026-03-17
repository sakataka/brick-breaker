import { getBossDefinition } from "../config/bosses";
import { ACTIVE_SKILL_CATALOG, CORE_MODULE_CATALOG, TACTICAL_PICKUP_CATALOG } from "./modules";
import { CAMPAIGN_ENCOUNTERS, THREAT_TIER_2_ENCOUNTERS } from "./encounters";
import {
  getStageBlueprintCatalog,
  getStageBlueprintForEncounter,
  validateStageBlueprintCatalog,
} from "./stageBlueprintCatalog";
import { runDefinitionSchema } from "./schemas";
import {
  bossDefinitionSchema,
  encounterDefinitionSchema,
  moduleCatalogSchema,
  themeDefinitionSchema,
} from "./schemas";
import { getRunDefinition } from "./runDefinition";
import { THEME_DEFINITIONS } from "./themes";

export function validateGameContent(): string[] {
  const issues: string[] = [];
  for (const threatTier of [1, 2] as const) {
    const result = validateStageBlueprintCatalog(getStageBlueprintCatalog(threatTier));
    if (!result.valid) {
      issues.push(
        ...result.issues.map((issue) => `stage blueprint catalog ${threatTier}: ${issue}`),
      );
    }
  }

  for (const theme of THEME_DEFINITIONS) {
    const result = themeDefinitionSchema.safeParse(theme);
    if (!result.success) {
      issues.push(
        `theme ${theme.id}: ${result.error.issues.map((issue) => issue.message).join(", ")}`,
      );
    }
  }

  for (const encounter of [...CAMPAIGN_ENCOUNTERS, ...THREAT_TIER_2_ENCOUNTERS]) {
    try {
      getStageBlueprintForEncounter(encounter.id);
    } catch (error) {
      issues.push(
        error instanceof Error
          ? `encounter ${encounter.id}: ${error.message}`
          : `encounter ${encounter.id}: missing stage blueprint`,
      );
      continue;
    }
    const result = encounterDefinitionSchema.safeParse(encounter);
    if (!result.success) {
      issues.push(
        `encounter ${encounter.id}: ${result.error.issues.map((issue) => issue.message).join(", ")}`,
      );
    }
  }

  for (const threatTier of [1, 2] as const) {
    const run = getRunDefinition(threatTier);
    const result = runDefinitionSchema.safeParse(run);
    if (!result.success) {
      issues.push(
        `run ${threatTier}: ${result.error.issues.map((issue) => issue.message).join(", ")}`,
      );
    }
  }

  const moduleCatalog = {
    core: CORE_MODULE_CATALOG,
    tactical: TACTICAL_PICKUP_CATALOG,
    active: ACTIVE_SKILL_CATALOG,
  };
  const moduleResult = moduleCatalogSchema.safeParse(moduleCatalog);
  if (!moduleResult.success) {
    issues.push(
      `module catalog: ${moduleResult.error.issues.map((issue) => issue.message).join(", ")}`,
    );
  }

  for (const profile of ["warden", "artillery", "final_core", "tier2_overlord"] as const) {
    const definition = getBossDefinition(profile);
    const result = bossDefinitionSchema.safeParse(definition);
    if (!result.success) {
      issues.push(
        `boss ${profile}: ${result.error.issues.map((issue) => issue.message).join(", ")}`,
      );
    }
  }

  return issues;
}

export function assertValidGameContent(): void {
  const issues = validateGameContent();
  if (issues.length > 0) {
    throw new Error(`invalid game content:\n${issues.join("\n")}`);
  }
}
