import { THEME_BANDS, type ThemeBandId } from "../public/themes";

export interface PublicThemeDefinition {
  id: ThemeBandId;
  label: string;
  hudAccent: string;
  dangerAccent: string;
  backdropDepth: "stellar" | "orbital" | "fortress";
  arenaFrame: "clean" | "hazard" | "citadel";
  blockMaterial: "glass" | "alloy" | "armor" | "core";
  cameraIntensity: "steady" | "alert" | "assault";
  bossTone: "hunter" | "artillery" | "citadel" | "overlord";
}

export const PUBLIC_THEME_DEFINITIONS: readonly PublicThemeDefinition[] = THEME_BANDS.map(
  (theme) => ({
    id: theme.id,
    label: theme.label,
    hudAccent: theme.hudAccent,
    dangerAccent: theme.dangerAccent,
    backdropDepth: theme.backdropDepth,
    arenaFrame: theme.arenaFrame,
    blockMaterial: theme.blockMaterial,
    cameraIntensity: theme.cameraIntensity,
    bossTone: theme.bossTone,
  }),
);

export function getPublicThemeDefinition(themeId: ThemeBandId): PublicThemeDefinition {
  return (
    PUBLIC_THEME_DEFINITIONS.find((theme) => theme.id === themeId) ?? PUBLIC_THEME_DEFINITIONS[0]
  );
}
