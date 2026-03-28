import type { ThemeBandId } from "../game-v2/public/themes";
import type { BrickKind } from "../game-v2/public/types";
import { THEME_ART_PALETTES, type ThemeArtPalette } from "./themePalettes";
import {
  buildBackdropMotifSvg,
  buildBackdropPatternSvg,
  buildPanelBadgeSvg,
  buildPanelFillSvg,
  buildPanelFrameSvg,
  buildWarningStripeSvg,
  mixHex,
  resolveTextureDensity,
} from "./textureFactories";

export type ArtAssetId =
  | `backdrop-pattern:${string}`
  | `backdrop-motif:${string}`
  | `panel-fill:${string}`
  | `panel-frame:${string}`
  | `panel-badge:${string}`
  | `warning-stripe:${string}`;

export type ArtWarningLevel = "calm" | "elevated" | "critical";
export type ArtEncounterEmphasis = "chapter" | "midboss" | "finalboss" | "tier2";

interface TextureEntry {
  id: ArtAssetId;
  key: string;
  dataUri: string;
}

export interface BackdropTileSet {
  patternTextureKey: string;
  motifTextureKey: string;
  patternDataUri: string;
  motifDataUri: string;
  patternOpacity: number;
  motifOpacity: number;
  patternScrollX: number;
  motifScrollX: number;
}

export interface PanelChrome {
  fillDataUri: string;
  frameDataUri: string;
  badgeDataUri: string;
}

export interface WarningDecalSet {
  stripeTextureKey: string;
  stripeDataUri: string;
  stripeOpacity: number;
}

export interface BrickSkinSpec {
  baseColor: string;
  insetColor: string;
  edgeColor: string;
  glowColor: string;
  markerColor: string;
  pattern:
    | "panel"
    | "plate"
    | "circuit"
    | "rivets"
    | "core"
    | "barrier"
    | "turret"
    | "hazard"
    | "armor"
    | "split"
    | "summon"
    | "thorns";
}

export interface VisualAssetProfile {
  id: ThemeBandId;
  panelSet: string;
  backdropPatternSet: string;
  brickSkinSet: string;
  warningDecalSet: string;
  density: number;
  textureScale: number;
  panel: PanelChrome;
  backdrop: BackdropTileSet;
  warning: WarningDecalSet;
}

const PROFILE_CACHE = new Map<string, VisualAssetProfile>();
const TEXTURE_CACHE = new Map<ArtAssetId, TextureEntry>();

export function resolveVisualAssetProfile(
  themeId: ThemeBandId,
  warningLevel: ArtWarningLevel,
  encounterEmphasis: ArtEncounterEmphasis,
): VisualAssetProfile {
  const cacheKey = `${themeId}:${warningLevel}:${encounterEmphasis}`;
  const cached = PROFILE_CACHE.get(cacheKey);
  if (cached) {
    return cached;
  }
  const palette = THEME_ART_PALETTES[themeId];
  const profile: VisualAssetProfile = {
    id: themeId,
    panelSet: `${themeId}-panel`,
    backdropPatternSet: `${themeId}-pattern`,
    brickSkinSet: `${themeId}-brick`,
    warningDecalSet: `${themeId}-warning`,
    density: resolveTextureDensity(themeId, encounterEmphasis),
    textureScale: themeId === "chapter1" ? 1 : themeId === "chapter2" ? 1.1 : 1.18,
    panel: {
      fillDataUri: getTextureEntry(`panel-fill:${themeId}`, buildPanelFillSvg(themeId, palette))
        .dataUri,
      frameDataUri: getTextureEntry(`panel-frame:${themeId}`, buildPanelFrameSvg(themeId, palette))
        .dataUri,
      badgeDataUri: getTextureEntry(`panel-badge:${themeId}`, buildPanelBadgeSvg(themeId, palette))
        .dataUri,
    },
    backdrop: resolveBackdropTileSet(themeId, palette, warningLevel, encounterEmphasis),
    warning: resolveWarningDecalSet(themeId, palette, warningLevel),
  };
  PROFILE_CACHE.set(cacheKey, profile);
  return profile;
}

export function getBackdropTileSet(profile: VisualAssetProfile): BackdropTileSet {
  return profile.backdrop;
}

export function getBrickSkin(
  kind: BrickKind | undefined,
  profile: VisualAssetProfile,
  fallbackColor: string,
): BrickSkinSpec {
  const palette = THEME_ART_PALETTES[profile.id];
  const normal = createNormalBrickSkin(profile.id, fallbackColor, palette);
  switch (kind ?? "normal") {
    case "steel":
      return {
        baseColor: "#74879e",
        insetColor: "#a9bfd9",
        edgeColor: "#eff7ff",
        glowColor: "#adcfff",
        markerColor: "#edf5ff",
        pattern: "rivets",
      };
    case "generator":
      return {
        baseColor: "#1f4157",
        insetColor: "#2c6c7e",
        edgeColor: "#c9fff1",
        glowColor: "#73ffd2",
        markerColor: "#e1fff0",
        pattern: "core",
      };
    case "gate":
      return {
        baseColor: "#56453b",
        insetColor: "#7f5f50",
        edgeColor: "#fff1c7",
        glowColor: "#ffd975",
        markerColor: "#fff0be",
        pattern: "barrier",
      };
    case "turret":
      return {
        baseColor: "#57362f",
        insetColor: "#8b5242",
        edgeColor: "#ffd6b5",
        glowColor: "#ffab70",
        markerColor: "#ffe5c8",
        pattern: "turret",
      };
    case "durable":
      return {
        ...normal,
        edgeColor: "#ffe27e",
        glowColor: "#ffd36d",
        markerColor: "#ffe89f",
        pattern: "plate",
      };
    case "armored":
      return {
        ...normal,
        edgeColor: "#dce8ff",
        glowColor: "#a8c8ff",
        markerColor: "#edf4ff",
        pattern: "armor",
      };
    case "regen":
      return {
        ...normal,
        edgeColor: "#c7ffdd",
        glowColor: "#70f7a7",
        markerColor: "#e6fff0",
        pattern: "core",
      };
    case "hazard":
      return {
        baseColor: "#5b1f24",
        insetColor: "#8d3742",
        edgeColor: "#ffd0a6",
        glowColor: "#ff8061",
        markerColor: "#ffe7be",
        pattern: "hazard",
      };
    case "boss":
      return {
        baseColor: "#431839",
        insetColor: "#74305a",
        edgeColor: "#ffd7f4",
        glowColor: "#ff75ca",
        markerColor: "#fff0fb",
        pattern: "summon",
      };
    case "split":
      return {
        ...normal,
        edgeColor: "#fff2b0",
        glowColor: "#ffe57f",
        markerColor: "#fff7d3",
        pattern: "split",
      };
    case "summon":
      return {
        ...normal,
        edgeColor: "#ffd6ae",
        glowColor: "#ffb57a",
        markerColor: "#fff0dc",
        pattern: "summon",
      };
    case "thorns":
      return {
        baseColor: "#4e183b",
        insetColor: "#7f2d60",
        edgeColor: "#ffd7ef",
        glowColor: "#ff9bd6",
        markerColor: "#ffeaf7",
        pattern: "thorns",
      };
    default:
      return normal;
  }
}

export function getArtCssVars(profile: VisualAssetProfile): Record<string, string> {
  return {
    "--art-panel-fill": `url("${profile.panel.fillDataUri}")`,
    "--art-panel-frame": `url("${profile.panel.frameDataUri}")`,
    "--art-panel-badge": `url("${profile.panel.badgeDataUri}")`,
    "--art-warning-stripe":
      profile.warning.stripeOpacity > 0 ? `url("${profile.warning.stripeDataUri}")` : "none",
    "--art-backdrop-pattern": `url("${profile.backdrop.patternDataUri}")`,
    "--art-backdrop-motif": `url("${profile.backdrop.motifDataUri}")`,
    "--art-texture-scale": `${profile.textureScale}`,
    "--art-density": `${profile.density}`,
    "--art-warning-opacity": `${profile.warning.stripeOpacity}`,
  };
}

export function getAllArtTextureEntries(): TextureEntry[] {
  const profiles = (
    ["chapter1", "chapter2", "chapter3", "midboss", "finalboss", "tier2"] as const
  ).flatMap((themeId) =>
    (["calm", "elevated", "critical"] as const).flatMap((warningLevel) =>
      (["chapter", "midboss", "finalboss", "tier2"] as const).map((encounterEmphasis) =>
        resolveVisualAssetProfile(themeId, warningLevel, encounterEmphasis),
      ),
    ),
  );
  const entries = new Map<string, TextureEntry>();
  for (const profile of profiles) {
    const backdrop = getBackdropTileSet(profile);
    const warning = profile.warning;
    const textureEntries = [
      TEXTURE_CACHE.get(`backdrop-pattern:${profile.id}`),
      TEXTURE_CACHE.get(`backdrop-motif:${profile.id}`),
      TEXTURE_CACHE.get(`warning-stripe:${profile.id}`),
    ];
    for (const entry of textureEntries) {
      if (entry) {
        entries.set(entry.key, entry);
      }
    }
    const patternEntry = TEXTURE_CACHE.get(`backdrop-pattern:${profile.id}`);
    const motifEntry = TEXTURE_CACHE.get(`backdrop-motif:${profile.id}`);
    const warningEntry = TEXTURE_CACHE.get(`warning-stripe:${profile.id}`);
    if (patternEntry) {
      entries.set(backdrop.patternTextureKey, patternEntry);
    }
    if (motifEntry) {
      entries.set(backdrop.motifTextureKey, motifEntry);
    }
    if (warningEntry) {
      entries.set(warning.stripeTextureKey, warningEntry);
    }
  }
  return [...entries.values()];
}

function resolveBackdropTileSet(
  themeId: ThemeBandId,
  palette: ThemeArtPalette,
  warningLevel: ArtWarningLevel,
  encounterEmphasis: ArtEncounterEmphasis,
): BackdropTileSet {
  const patternEntry = getTextureEntry(
    `backdrop-pattern:${themeId}`,
    buildBackdropPatternSvg(themeId, palette),
  );
  const motifEntry = getTextureEntry(
    `backdrop-motif:${themeId}`,
    buildBackdropMotifSvg(themeId, palette),
  );
  const emphasisBoost = encounterEmphasis === "chapter" ? 0 : 0.08;
  return {
    patternTextureKey: patternEntry.key,
    motifTextureKey: motifEntry.key,
    patternDataUri: patternEntry.dataUri,
    motifDataUri: motifEntry.dataUri,
    patternOpacity: warningLevel === "critical" ? 0.26 + emphasisBoost : 0.18 + emphasisBoost,
    motifOpacity: warningLevel === "calm" ? 0.12 : 0.18,
    patternScrollX: themeId === "chapter1" ? 0.25 : themeId === "chapter2" ? -0.18 : 0.14,
    motifScrollX: encounterEmphasis === "chapter" ? 0.08 : 0.18,
  };
}

function resolveWarningDecalSet(
  themeId: ThemeBandId,
  palette: ThemeArtPalette,
  warningLevel: ArtWarningLevel,
): WarningDecalSet {
  const stripeEntry = getTextureEntry(
    `warning-stripe:${themeId}`,
    buildWarningStripeSvg(themeId, palette),
  );
  return {
    stripeTextureKey: stripeEntry.key,
    stripeDataUri: stripeEntry.dataUri,
    stripeOpacity: warningLevel === "critical" ? 0.3 : warningLevel === "elevated" ? 0.18 : 0,
  };
}

function createNormalBrickSkin(
  themeId: ThemeBandId,
  fallbackColor: string,
  palette: ThemeArtPalette,
): BrickSkinSpec {
  return {
    baseColor: fallbackColor,
    insetColor: mixHex(fallbackColor, "#ffffff", themeId === "chapter1" ? 0.2 : 0.15),
    edgeColor: mixHex(palette.panelLine, "#ffffff", 0.2),
    glowColor: mixHex(palette.panelAccent, "#ffffff", 0.14),
    markerColor: palette.panelLine,
    pattern: themeId === "chapter3" ? "circuit" : themeId === "chapter2" ? "plate" : "panel",
  };
}

function getTextureEntry(id: ArtAssetId, svg: string): TextureEntry {
  const cached = TEXTURE_CACHE.get(id);
  if (cached) {
    return cached;
  }
  const entry = {
    id,
    key: `art:${id}`,
    dataUri: svgToDataUri(svg),
  };
  TEXTURE_CACHE.set(id, entry);
  return entry;
}

function svgToDataUri(svg: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
