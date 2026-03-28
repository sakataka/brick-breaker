import type { ThemeBandId } from "./types";
export type { ThemeBandId } from "./types";

export interface BrickTheme {
  palette: readonly string[];
}

export interface StageVisualProfile {
  id: ThemeBandId;
  label: string;
  backdropStart: string;
  backdropEnd: string;
  backdropStroke: string;
  progressBar: string;
  hudAccent: string;
  dangerAccent: string;
  panelGlow: string;
  patternColor: string;
  brickPalette: BrickTheme["palette"];
  backdropDepth: "stellar" | "orbital" | "fortress";
  arenaFrame: "clean" | "hazard" | "citadel";
  blockMaterial: "glass" | "alloy" | "armor" | "core";
  particleDensity: number;
  cameraIntensity: "steady" | "alert" | "assault";
  bossTone: "hunter" | "artillery" | "citadel" | "overlord";
}

const BRICK_PALETTE: BrickTheme["palette"] = [
  "rgba(255, 122, 122, 0.45)",
  "rgba(255, 196, 118, 0.45)",
  "rgba(122, 232, 176, 0.45)",
  "rgba(125, 165, 255, 0.45)",
  "rgba(182, 125, 255, 0.45)",
  "rgba(255, 144, 210, 0.45)",
] as const;

const MID_BRICK_PALETTE: BrickTheme["palette"] = [
  "rgba(255, 149, 98, 0.48)",
  "rgba(255, 223, 124, 0.46)",
  "rgba(122, 238, 210, 0.45)",
  "rgba(104, 193, 255, 0.46)",
  "rgba(189, 144, 255, 0.47)",
  "rgba(255, 164, 230, 0.45)",
] as const;

const LATE_BRICK_PALETTE: BrickTheme["palette"] = [
  "rgba(255, 118, 138, 0.52)",
  "rgba(255, 186, 112, 0.52)",
  "rgba(153, 255, 206, 0.5)",
  "rgba(122, 168, 255, 0.5)",
  "rgba(212, 135, 255, 0.52)",
  "rgba(255, 112, 190, 0.5)",
] as const;

export const THEME_BANDS: readonly StageVisualProfile[] = [
  {
    id: "chapter1",
    label: "Chapter 1",
    backdropStart: "rgba(64, 244, 255, 0.32)",
    backdropEnd: "rgba(64, 174, 255, 0.06)",
    backdropStroke: "rgba(166, 247, 255, 0.44)",
    progressBar: "rgba(64, 244, 255, 0.96)",
    hudAccent: "#40f4ff",
    dangerAccent: "#ff7e67",
    panelGlow: "rgba(64, 244, 255, 0.34)",
    patternColor: "rgba(145, 250, 255, 0.18)",
    brickPalette: BRICK_PALETTE,
    backdropDepth: "stellar",
    arenaFrame: "clean",
    blockMaterial: "glass",
    particleDensity: 0.85,
    cameraIntensity: "steady",
    bossTone: "hunter",
  },
  {
    id: "chapter2",
    label: "Chapter 2",
    backdropStart: "rgba(255, 170, 86, 0.32)",
    backdropEnd: "rgba(255, 112, 56, 0.07)",
    backdropStroke: "rgba(255, 228, 178, 0.4)",
    progressBar: "rgba(255, 165, 78, 0.96)",
    hudAccent: "#ffb15c",
    dangerAccent: "#ff5740",
    panelGlow: "rgba(255, 165, 78, 0.28)",
    patternColor: "rgba(255, 218, 156, 0.18)",
    brickPalette: MID_BRICK_PALETTE,
    backdropDepth: "orbital",
    arenaFrame: "hazard",
    blockMaterial: "alloy",
    particleDensity: 1,
    cameraIntensity: "alert",
    bossTone: "artillery",
  },
  {
    id: "chapter3",
    label: "Chapter 3",
    backdropStart: "rgba(255, 106, 205, 0.28)",
    backdropEnd: "rgba(160, 86, 255, 0.08)",
    backdropStroke: "rgba(255, 162, 224, 0.42)",
    progressBar: "rgba(255, 96, 196, 0.98)",
    hudAccent: "#ff72c8",
    dangerAccent: "#ff7060",
    panelGlow: "rgba(255, 114, 200, 0.32)",
    patternColor: "rgba(249, 180, 255, 0.16)",
    brickPalette: LATE_BRICK_PALETTE,
    backdropDepth: "fortress",
    arenaFrame: "hazard",
    blockMaterial: "armor",
    particleDensity: 1.12,
    cameraIntensity: "alert",
    bossTone: "citadel",
  },
  {
    id: "midboss",
    label: "Midboss",
    backdropStart: "rgba(255, 122, 84, 0.3)",
    backdropEnd: "rgba(255, 57, 98, 0.1)",
    backdropStroke: "rgba(255, 220, 188, 0.48)",
    progressBar: "rgba(255, 122, 84, 0.98)",
    hudAccent: "#ff9d70",
    dangerAccent: "#ff4f72",
    panelGlow: "rgba(255, 122, 84, 0.32)",
    patternColor: "rgba(255, 188, 164, 0.18)",
    brickPalette: MID_BRICK_PALETTE,
    backdropDepth: "orbital",
    arenaFrame: "hazard",
    blockMaterial: "alloy",
    particleDensity: 1.15,
    cameraIntensity: "alert",
    bossTone: "hunter",
  },
  {
    id: "finalboss",
    label: "Final Boss",
    backdropStart: "rgba(255, 76, 126, 0.28)",
    backdropEnd: "rgba(119, 44, 255, 0.12)",
    backdropStroke: "rgba(255, 181, 226, 0.52)",
    progressBar: "rgba(255, 96, 176, 0.98)",
    hudAccent: "#ff74d1",
    dangerAccent: "#ff5d78",
    panelGlow: "rgba(255, 116, 209, 0.36)",
    patternColor: "rgba(255, 174, 229, 0.18)",
    brickPalette: LATE_BRICK_PALETTE,
    backdropDepth: "fortress",
    arenaFrame: "citadel",
    blockMaterial: "core",
    particleDensity: 1.28,
    cameraIntensity: "assault",
    bossTone: "citadel",
  },
  {
    id: "tier2",
    label: "Threat Tier 2",
    backdropStart: "rgba(134, 245, 132, 0.28)",
    backdropEnd: "rgba(33, 231, 208, 0.1)",
    backdropStroke: "rgba(191, 255, 214, 0.48)",
    progressBar: "rgba(84, 245, 182, 0.98)",
    hudAccent: "#54f5b6",
    dangerAccent: "#ff8a5b",
    panelGlow: "rgba(84, 245, 182, 0.34)",
    patternColor: "rgba(166, 255, 210, 0.16)",
    brickPalette: MID_BRICK_PALETTE,
    backdropDepth: "fortress",
    arenaFrame: "citadel",
    blockMaterial: "core",
    particleDensity: 1.34,
    cameraIntensity: "assault",
    bossTone: "overlord",
  },
] as const;

export function getVisualProfile(themeId: ThemeBandId): StageVisualProfile {
  return THEME_BANDS.find((theme) => theme.id === themeId) ?? THEME_BANDS[0];
}
