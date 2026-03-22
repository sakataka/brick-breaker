import { describe, expect, test } from "vite-plus/test";
import {
  inferBonusRules,
  inferHazardScript,
  inferPreviewTags,
  inferStageMissions,
  inferVisualProfile,
} from "./stageDefinitionDefaults";
import type { StageBlueprint, StageBlueprintCatalogEntry } from "./stageBlueprints";

describe("stageDefinitionDefaults", () => {
  test("infers generator missions and reactor hazards", () => {
    const blueprint: StageBlueprint = {
      id: "generator-test",
      rows: ["1111"],
      tags: ["generator"],
    };

    expect(inferStageMissions(3, blueprint)).toEqual(["shutdown_generator", "no_shop"]);
    expect(inferHazardScript(blueprint)).toEqual({ id: "reactor_chain", intensity: "medium" });
  });

  test("caps preview tags and keeps boss alerts for tier 2 boss content", () => {
    const blueprint: StageBlueprint = {
      id: "tier2-test",
      rows: ["1111"],
      tags: ["generator", "turret"],
      events: ["enemy_pressure"],
      encounter: { kind: "tier2_boss", profile: "tier2_overlord" },
    };

    expect(inferPreviewTags(blueprint)).toEqual(["relay_chain", "reactor_chain", "turret_lane"]);
    expect(inferBonusRules(blueprint)).toEqual([
      "hazard_first",
      "cancel_shots",
      "weak_window_burst",
    ]);
  });

  test("uses encounter- and chapter-specific visual defaults", () => {
    const entry: StageBlueprintCatalogEntry = {
      encounterId: "encounter-1",
      blueprintId: "campaign-1",
      chapter: 4,
      archetype: "boss_arena",
    };
    const blueprint: StageBlueprint = {
      id: "boss-test",
      rows: ["1111"],
      encounter: { kind: "boss", profile: "final_core" },
    };

    expect(inferVisualProfile(entry, blueprint)).toEqual({
      depth: "fortress",
      arenaFrame: "citadel",
      blockMaterial: "core",
      particleDensity: 1.24,
      cameraIntensity: "assault",
      bossTone: "citadel",
    });
  });
});
