import type { ThemeBandId } from "../game/content/themes";

export interface ThemeArtPalette {
  panelBase: string;
  panelAccent: string;
  panelLine: string;
  panelGlow: string;
  backdropBase: string;
  backdropAccent: string;
  backdropAccentAlt: string;
  motifAccent: string;
  warningAccent: string;
}

export const THEME_ART_PALETTES: Record<ThemeBandId, ThemeArtPalette> = {
  chapter1: {
    panelBase: "#0d1a34",
    panelAccent: "#6aefff",
    panelLine: "#a9fbff",
    panelGlow: "#3cc8ff",
    backdropBase: "#0b152b",
    backdropAccent: "#53dfff",
    backdropAccentAlt: "#6b94ff",
    motifAccent: "#d5ffff",
    warningAccent: "#ffd17a",
  },
  chapter2: {
    panelBase: "#241322",
    panelAccent: "#ffb35e",
    panelLine: "#ffe1bb",
    panelGlow: "#ff8752",
    backdropBase: "#20131a",
    backdropAccent: "#ffb968",
    backdropAccentAlt: "#ff7e4f",
    motifAccent: "#ffe7c8",
    warningAccent: "#ff9d5c",
  },
  chapter3: {
    panelBase: "#211131",
    panelAccent: "#ff7ee7",
    panelLine: "#ffc5f4",
    panelGlow: "#bc79ff",
    backdropBase: "#180f29",
    backdropAccent: "#ff88da",
    backdropAccentAlt: "#9f6bff",
    motifAccent: "#ffe1ff",
    warningAccent: "#ff91cb",
  },
  midboss: {
    panelBase: "#24111c",
    panelAccent: "#ff9c6a",
    panelLine: "#ffd7c1",
    panelGlow: "#ff6d86",
    backdropBase: "#1c1017",
    backdropAccent: "#ff9a73",
    backdropAccentAlt: "#ff688f",
    motifAccent: "#ffe7d7",
    warningAccent: "#ffca77",
  },
  finalboss: {
    panelBase: "#271022",
    panelAccent: "#ff72cb",
    panelLine: "#ffd2f3",
    panelGlow: "#ff6b90",
    backdropBase: "#180b18",
    backdropAccent: "#ff7bd3",
    backdropAccentAlt: "#8c52ff",
    motifAccent: "#ffe0f8",
    warningAccent: "#ff7f78",
  },
  tier2: {
    panelBase: "#102221",
    panelAccent: "#63f5bd",
    panelLine: "#d6fff0",
    panelGlow: "#42d7d2",
    backdropBase: "#0d1d1f",
    backdropAccent: "#5cefb0",
    backdropAccentAlt: "#3fd9d7",
    motifAccent: "#ddfff5",
    warningAccent: "#ffe88c",
  },
};
