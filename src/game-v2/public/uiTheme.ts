import { formatHex, formatRgb, interpolate, parse } from "culori";
import type { StageVisualProfile, ThemeBandId } from "./themes";

export type WarningLevel = "calm" | "elevated" | "critical";
export type MotionProfile = "full" | "reduced";
export type EncounterEmphasis = "chapter" | "midboss" | "finalboss" | "tier2";
export type BannerKind = "stage" | "midboss" | "boss" | "tier2";

export interface UiThemeTokens {
  surface: string;
  surfaceRaised: string;
  border: string;
  accent: string;
  accentSoft: string;
  danger: string;
  success: string;
  text: string;
  muted: string;
  glow: string;
  backdrop: string;
  backdropTop: string;
  pattern: string;
  frame: string;
  shadow: string;
  progressTrack: string;
}

export interface VisualBannerState {
  kind: BannerKind;
  progress: number;
}

export interface BossPhaseBannerState {
  phase: 1 | 2 | 3;
  warningLevel: WarningLevel;
}

export interface VisualState {
  themeId: ThemeBandId;
  assetProfileId: ThemeBandId;
  chapterLabel: string;
  warningLevel: WarningLevel;
  encounterEmphasis: EncounterEmphasis;
  motionProfile: MotionProfile;
  tokens: UiThemeTokens;
  backdropDepth: "stellar" | "orbital" | "fortress";
  arenaFrame: "clean" | "hazard" | "citadel";
  blockMaterial: "glass" | "alloy" | "armor" | "core";
  particleDensity: number;
  cameraIntensity: "steady" | "alert" | "assault";
  bossTone: "hunter" | "artillery" | "citadel" | "overlord";
  banner?: VisualBannerState;
  bossPhase?: BossPhaseBannerState;
}

interface ThemeTokenOptions {
  warningLevel: WarningLevel;
  highContrast: boolean;
}

const WHITE = "#f8fbff";
const SOFT_WHITE = "#dce9ff";
const DEEP_BG = "#050814";
const SUCCESS = "#66ffb3";

export function resolveUiThemeTokens(
  profile: StageVisualProfile,
  { warningLevel, highContrast }: ThemeTokenOptions,
): UiThemeTokens {
  if (highContrast) {
    return {
      surface: "#050505",
      surfaceRaised: "#111111",
      border: "#f5f5f5",
      accent: "#f5e76a",
      accentSoft: "rgba(245, 231, 106, 0.16)",
      danger: "#ff8a80",
      success: "#7bffbe",
      text: "#ffffff",
      muted: "#d5d5d5",
      glow: "rgba(245, 231, 106, 0.24)",
      backdrop: "#000000",
      backdropTop: "#161616",
      pattern: "rgba(255, 255, 255, 0.18)",
      frame: "#ffffff",
      shadow: "rgba(255, 255, 255, 0.16)",
      progressTrack: "rgba(255, 255, 255, 0.14)",
    };
  }

  const accent = profile.hudAccent;
  const dangerBase =
    warningLevel === "critical"
      ? mixColors(profile.dangerAccent, "#ff4d8a", 0.32)
      : warningLevel === "elevated"
        ? mixColors(profile.dangerAccent, "#ffae61", 0.18)
        : profile.dangerAccent;

  const surface = rgba(mixColors(profile.backdropEnd, DEEP_BG, 0.56), 0.86);
  const surfaceRaised = rgba(mixColors(profile.backdropStart, "#12172a", 0.44), 0.94);
  const border = rgba(mixColors(profile.backdropStroke, WHITE, 0.38), 0.62);
  const accentSoft = rgba(mixColors(accent, WHITE, 0.2), 0.18);
  const glow = rgba(mixColors(profile.panelGlow, accent, 0.3), 0.34);
  const backdrop = mixColors(profile.backdropEnd, "#07111f", 0.58);
  const backdropTop = mixColors(profile.backdropStart, "#14243b", 0.48);
  const progressTrack = rgba(mixColors(accent, DEEP_BG, 0.72), 0.42);
  const frame = mixColors(profile.backdropStroke, accent, 0.28);

  return {
    surface,
    surfaceRaised,
    border,
    accent,
    accentSoft,
    danger: dangerBase,
    success: SUCCESS,
    text: WHITE,
    muted: SOFT_WHITE,
    glow,
    backdrop,
    backdropTop,
    pattern: profile.patternColor,
    frame,
    shadow: rgba(mixColors(accent, "#000000", 0.74), 0.38),
    progressTrack,
  };
}

export function resolveEncounterEmphasis(themeId: ThemeBandId): EncounterEmphasis {
  if (themeId === "midboss") {
    return "midboss";
  }
  if (themeId === "finalboss") {
    return "finalboss";
  }
  if (themeId === "tier2") {
    return "tier2";
  }
  return "chapter";
}

function mixColors(left: string, right: string, ratio: number): string {
  const clampedRatio = Math.max(0, Math.min(1, ratio));
  return formatHex(interpolate([left, right], "rgb")(clampedRatio)) ?? left;
}

function rgba(color: string, alpha: number): string {
  const parsed = parse(color);
  if (!parsed) {
    return color;
  }
  return formatRgb({ ...parsed, alpha });
}

export function clampBannerProgress(progress: number): number {
  return Math.max(0, Math.min(1, progress));
}

export function getFallbackThemeTokens(): UiThemeTokens {
  const accent = "#40f4ff";
  return {
    surface: "rgba(10, 16, 30, 0.88)",
    surfaceRaised: "rgba(19, 28, 48, 0.94)",
    border: "rgba(160, 228, 255, 0.5)",
    accent,
    accentSoft: rgba(accent, 0.16),
    danger: "#ff7e67",
    success: SUCCESS,
    text: WHITE,
    muted: SOFT_WHITE,
    glow: rgba(accent, 0.32),
    backdrop: "#071224",
    backdropTop: mixColors(WHITE, DEEP_BG, 0.12),
    pattern: "rgba(170, 240, 255, 0.16)",
    frame: accent,
    shadow: "rgba(0, 0, 0, 0.36)",
    progressTrack: "rgba(64, 244, 255, 0.22)",
  };
}
