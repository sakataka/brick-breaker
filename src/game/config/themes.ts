import { STAGE_CATALOG } from "./stages";

export interface BrickTheme {
  palette: readonly string[];
}

export type ThemeBandId = "early" | "mid" | "late";

export interface ThemeBandDefinition {
  id: ThemeBandId;
  startStage: number;
  endStage: number;
  backdropStart: string;
  backdropEnd: string;
  backdropStroke: string;
  progressBar: string;
  hudAccent: string;
  brickPalette: BrickTheme["palette"];
}

export const BRICK_PALETTE: BrickTheme["palette"] = [
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

export const THEME_BANDS: ThemeBandDefinition[] = [
  {
    id: "early",
    startStage: 1,
    endStage: 4,
    backdropStart: "rgba(255, 255, 255, 0.25)",
    backdropEnd: "rgba(255, 255, 255, 0.04)",
    backdropStroke: "rgba(255, 255, 255, 0.2)",
    progressBar: "rgba(41, 211, 255, 0.9)",
    hudAccent: "#29d3ff",
    brickPalette: BRICK_PALETTE,
  },
  {
    id: "mid",
    startStage: 5,
    endStage: 8,
    backdropStart: "rgba(255, 210, 168, 0.24)",
    backdropEnd: "rgba(255, 192, 112, 0.06)",
    backdropStroke: "rgba(255, 220, 160, 0.34)",
    progressBar: "rgba(255, 169, 84, 0.9)",
    hudAccent: "#ffad61",
    brickPalette: MID_BRICK_PALETTE,
  },
  {
    id: "late",
    startStage: 9,
    endStage: 12,
    backdropStart: "rgba(255, 122, 168, 0.22)",
    backdropEnd: "rgba(126, 86, 232, 0.08)",
    backdropStroke: "rgba(255, 162, 224, 0.36)",
    progressBar: "rgba(255, 106, 174, 0.92)",
    hudAccent: "#ff7fb8",
    brickPalette: LATE_BRICK_PALETTE,
  },
] as const;

export function getBrickPaletteColor(row: number, palette: BrickTheme["palette"] = BRICK_PALETTE): string {
  return palette[row % palette.length];
}

export function getThemeBandByStage(stageNumber: number): ThemeBandDefinition {
  const normalized = Math.max(1, Math.min(STAGE_CATALOG.length, stageNumber));
  const found = THEME_BANDS.find((band) => normalized >= band.startStage && normalized <= band.endStage);
  return found ?? THEME_BANDS[0];
}

export function getThemeBandByStageIndex(stageIndex: number): ThemeBandDefinition {
  return getThemeBandByStage(stageIndex + 1);
}

export function getBrickPaletteForStage(stageIndex: number): BrickTheme["palette"] {
  return getThemeBandByStageIndex(stageIndex).brickPalette;
}
