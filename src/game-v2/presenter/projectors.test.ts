import { describe, expect, test } from "vite-plus/test";
import { getPublicEncounterCatalog } from "../content";
import { DEFAULT_META_PROGRESS } from "../public/metaProgress";
import { DEFAULT_GAME_CONFIG } from "../engine/config";
import {
  createCombatState,
  createEncounterState,
  createInitialGameState,
} from "../engine/stateFactory";
import { prepareEncounter } from "../engine/transitions";
import {
  projectHudView,
  projectOverlayView,
  projectRenderView,
  projectShopView,
} from "./projectors";

describe("game-v2 presenter projectors", () => {
  test("projects HUD records, shop preview, and render modifier state without UI logic", () => {
    const state = createInitialGameState(DEFAULT_GAME_CONFIG, false, "playing");
    prepareEncounter(state);

    const hud = projectHudView(state, {
      ...DEFAULT_META_PROGRESS,
      records: {
        ...DEFAULT_META_PROGRESS.records,
        tier1BestScore: 2200,
      },
    });
    const shop = projectShopView(state);
    const overlay = projectOverlayView(state, DEFAULT_META_PROGRESS);

    expect(hud.record.courseBestScore).toBe(2200);
    expect(hud.progressRatio).toBe(1 / 12);
    expect(shop.previewStageNumber).toBe(2);
    expect(shop.previewFocus).toBe(getPublicEncounterCatalog(1)[1].scoreFocus);
    expect(overlay.record.currentRunRecord).toBe(true);
  });

  test("projects blueprint-backed render hazards and HUD legends", () => {
    const state = createInitialGameState(DEFAULT_GAME_CONFIG, false, "playing");
    const stage6 = getPublicEncounterCatalog(1)[5];
    state.run.progress.currentEncounterIndex = 5;
    state.run.progress.currentStageNumber = 6;
    state.encounter = createEncounterState(stage6);
    state.combat = createCombatState(DEFAULT_GAME_CONFIG, stage6);

    const hud = projectHudView(state, DEFAULT_META_PROGRESS);
    const render = projectRenderView(state);

    expect(hud.flags.warpLegendVisible).toBe(true);
    expect(hud.flags.gateLegendVisible).toBe(true);
    expect(render.stageModifierKey).toBe("warp_zone");
    expect(render.warpZones).toHaveLength(2);
  });
});
