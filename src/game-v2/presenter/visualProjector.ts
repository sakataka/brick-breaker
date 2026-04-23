import type { GameState } from "../public";
import { getVisualProfile } from "../public/themes";
import {
  clampBannerProgress,
  resolveEncounterEmphasis,
  resolveUiThemeTokens,
  type VisualState,
} from "../public/uiTheme";

export function createVisualState(state: GameState): VisualState {
  const profile = getVisualProfile(state.encounter.themeId);
  return {
    themeId: profile.id,
    assetProfileId: profile.id,
    chapterLabel: profile.label,
    warningLevel: state.ui.warningLevel,
    encounterEmphasis: resolveEncounterEmphasis(profile.id),
    motionProfile: state.ui.a11y.reducedMotion ? "reduced" : "full",
    tokens: resolveUiThemeTokens(profile, {
      warningLevel: state.ui.warningLevel,
      highContrast: state.ui.a11y.highContrast,
    }),
    backdropDepth: profile.backdropDepth,
    arenaFrame: profile.arenaFrame,
    blockMaterial: profile.blockMaterial,
    particleDensity: profile.particleDensity,
    cameraIntensity: profile.cameraIntensity,
    bossTone: profile.bossTone,
    banner:
      state.scene === "playing" && state.encounter.elapsedSec < 1.5
        ? {
            kind:
              profile.id === "midboss"
                ? "boss"
                : profile.id === "finalboss"
                  ? "boss"
                  : profile.id === "tier2"
                    ? "tier2"
                    : "stage",
            progress: clampBannerProgress(1 - state.encounter.elapsedSec / 1.5),
          }
        : undefined,
    bossPhase: state.encounter.boss
      ? {
          phase: state.encounter.boss.phase,
          warningLevel: state.ui.warningLevel,
        }
      : undefined,
  };
}
