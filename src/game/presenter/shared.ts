import { countAliveObjectiveBricks } from "../brickRules";
import type { StageMetadata } from "../stageContext";
import type { GameState } from "../types";
import {
  clampBannerProgress,
  resolveEncounterEmphasis,
  resolveUiThemeTokens,
  type VisualState,
} from "../uiTheme";

export function computeProgressRatio(state: GameState): number {
  const total = state.combat.bricks.filter((brick) => (brick.kind ?? "normal") !== "steel").length;
  const alive = countAliveObjectiveBricks(state.combat.bricks);
  return total <= 0 ? 0 : Math.max(0, Math.min(1, (total - alive) / total));
}

export function resolveWarningLevel(state: GameState): "calm" | "elevated" | "critical" {
  if (state.encounter.threatLevel === "critical") {
    return "critical";
  }
  if (state.encounter.threatLevel === "high") {
    return "elevated";
  }
  if (state.encounter.runtime.sweep || state.encounter.runtime.telegraph?.kind === "gate_sweep") {
    return "critical";
  }
  if (state.encounter.runtime.telegraph || state.encounter.runtime.vulnerabilitySec > 0) {
    return "elevated";
  }
  return "calm";
}

export function buildStageIntro(
  state: GameState,
  stageContext: StageMetadata,
): VisualState["banner"] {
  if (state.scene !== "playing") {
    return undefined;
  }
  const sinceStart = state.run.elapsedSec - state.encounter.stats.startedAtSec;
  if (sinceStart < 0 || sinceStart > 1.15) {
    return undefined;
  }
  if (state.run.options.threatTier === 2) {
    return { kind: "ex", progress: sinceStart / 1.15 };
  }
  if (stageContext.stage.encounter?.kind === "boss") {
    return { kind: "boss", progress: sinceStart / 1.15 };
  }
  if (stageContext.stage.encounter?.kind === "midboss") {
    return { kind: "midboss", progress: sinceStart / 1.15 };
  }
  return { kind: "stage", progress: sinceStart / 1.15 };
}

export function buildVisualState(
  state: GameState,
  stageContext: StageMetadata,
  warningLevel: VisualState["warningLevel"],
  banner: VisualState["banner"],
): VisualState {
  const themeId = stageContext.visualProfile.id;
  return {
    themeId,
    assetProfileId: themeId,
    chapterLabel: stageContext.visualProfile.label,
    warningLevel,
    encounterEmphasis: resolveEncounterEmphasis(themeId),
    motionProfile: state.ui.vfx.reducedMotion ? "reduced" : "full",
    backdropDepth:
      stageContext.stage.visualProfile?.depth ?? stageContext.visualProfile.backdropDepth,
    arenaFrame:
      stageContext.stage.visualProfile?.arenaFrame ?? stageContext.visualProfile.arenaFrame,
    blockMaterial:
      stageContext.stage.visualProfile?.blockMaterial ?? stageContext.visualProfile.blockMaterial,
    particleDensity:
      stageContext.stage.visualProfile?.particleDensity ??
      stageContext.visualProfile.particleDensity,
    cameraIntensity:
      stageContext.stage.visualProfile?.cameraIntensity ??
      stageContext.visualProfile.cameraIntensity,
    bossTone: stageContext.stage.visualProfile?.bossTone ?? stageContext.visualProfile.bossTone,
    banner: banner
      ? {
          kind: banner.kind,
          progress: clampBannerProgress(banner.progress),
        }
      : undefined,
    bossPhase:
      state.encounter.bossPhase > 0
        ? {
            phase: Math.max(1, state.encounter.bossPhase) as 1 | 2 | 3,
            warningLevel,
          }
        : undefined,
    tokens: resolveUiThemeTokens(stageContext.visualProfile, {
      warningLevel,
      highContrast: state.ui.a11y.highContrast,
    }),
  };
}
