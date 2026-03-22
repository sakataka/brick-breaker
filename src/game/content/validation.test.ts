import { describe, expect, test } from "vite-plus/test";
import {
  STAGE_ARCHETYPES,
  STAGE_ELITE_KINDS,
  STAGE_EVENT_KEYS,
  STAGE_SPECIAL_KINDS,
  STAGE_TAGS,
} from "../types";
import { getStageBlueprintCatalog } from "./stageBlueprintCatalog";
import { getStageBlueprint } from "./stageBlueprints";
import { validateGameContent } from "./validation";

describe("content validation", () => {
  test("all shipped content passes the schema contract", () => {
    expect(validateGameContent()).toEqual([]);
  });

  test("shipped stage blueprint literals stay inside the shared source-of-truth sets", () => {
    const archetypes = new Set(STAGE_ARCHETYPES);
    const tags = new Set(STAGE_TAGS);
    const events = new Set(STAGE_EVENT_KEYS);
    const specialKinds = new Set(STAGE_SPECIAL_KINDS);
    const eliteKinds = new Set(STAGE_ELITE_KINDS);

    for (const threatTier of [1, 2] as const) {
      for (const entry of getStageBlueprintCatalog(threatTier)) {
        expect(archetypes.has(entry.archetype)).toBe(true);
        const blueprint = getStageBlueprint(entry.blueprintId);
        for (const tag of blueprint.tags ?? []) {
          expect(tags.has(tag)).toBe(true);
        }
        for (const event of blueprint.events ?? []) {
          expect(events.has(event)).toBe(true);
        }
        for (const special of blueprint.specials ?? []) {
          expect(specialKinds.has(special.kind)).toBe(true);
        }
        for (const elite of blueprint.elite ?? []) {
          expect(eliteKinds.has(elite.kind)).toBe(true);
        }
      }
    }
  });
});
