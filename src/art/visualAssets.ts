import type { ThemeBandId } from "../game/config/themes";
import type { BrickKind } from "../game/types";

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

interface ThemeArtPalette {
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

const PALETTES: Record<ThemeBandId, ThemeArtPalette> = {
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
  const palette = PALETTES[themeId];
  const profile: VisualAssetProfile = {
    id: themeId,
    panelSet: `${themeId}-panel`,
    backdropPatternSet: `${themeId}-pattern`,
    brickSkinSet: `${themeId}-brick`,
    warningDecalSet: `${themeId}-warning`,
    density: resolveDensity(themeId, encounterEmphasis),
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
  const palette = PALETTES[profile.id];
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

function resolveDensity(themeId: ThemeBandId, encounterEmphasis: ArtEncounterEmphasis): number {
  const base = themeId === "chapter1" ? 0.82 : themeId === "chapter2" ? 0.96 : 1.08;
  if (encounterEmphasis === "chapter") {
    return base;
  }
  return base + 0.12;
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

function buildPanelFillSvg(_themeId: ThemeBandId, palette: ThemeArtPalette): string {
  return wrapSvg(`
    <rect width="64" height="64" fill="${palette.panelBase}" />
    <path d="M0 0 H64 V64" stroke="${withAlpha(palette.panelAccent, 0.18)}" stroke-width="2" fill="none" />
    <path d="M0 16 H64 M0 48 H64" stroke="${withAlpha(palette.panelLine, 0.12)}" stroke-width="1" />
    <path d="M16 0 V64 M48 0 V64" stroke="${withAlpha(palette.panelAccent, 0.1)}" stroke-width="1" />
    <circle cx="12" cy="12" r="2" fill="${withAlpha(palette.panelLine, 0.26)}" />
    <circle cx="52" cy="12" r="2" fill="${withAlpha(palette.panelLine, 0.26)}" />
    <circle cx="12" cy="52" r="2" fill="${withAlpha(palette.panelLine, 0.26)}" />
    <circle cx="52" cy="52" r="2" fill="${withAlpha(palette.panelLine, 0.26)}" />
  `);
}

function buildPanelFrameSvg(_themeId: ThemeBandId, palette: ThemeArtPalette): string {
  return wrapSvg(`
    <rect x="2" y="2" width="60" height="60" rx="8" fill="none" stroke="${withAlpha(palette.panelLine, 0.52)}" stroke-width="2" />
    <path d="M8 6 H24 L28 10 H36 L40 6 H56" stroke="${withAlpha(palette.panelAccent, 0.7)}" stroke-width="2" fill="none" />
    <path d="M8 58 H24 L28 54 H36 L40 58 H56" stroke="${withAlpha(palette.panelAccent, 0.5)}" stroke-width="2" fill="none" />
    <path d="M6 12 V24 L10 28 V36 L6 40 V52" stroke="${withAlpha(palette.panelLine, 0.46)}" stroke-width="2" fill="none" />
    <path d="M58 12 V24 L54 28 V36 L58 40 V52" stroke="${withAlpha(palette.panelLine, 0.46)}" stroke-width="2" fill="none" />
  `);
}

function buildPanelBadgeSvg(_themeId: ThemeBandId, palette: ThemeArtPalette): string {
  return wrapSvg(
    `
    <rect width="64" height="18" fill="${withAlpha(palette.panelAccent, 0.18)}" />
    <path d="M0 17 H64" stroke="${withAlpha(palette.panelLine, 0.44)}" stroke-width="2" />
    <path d="M-12 18 L6 0 M4 18 L22 0 M20 18 L38 0 M36 18 L54 0 M52 18 L70 0" stroke="${withAlpha(palette.panelGlow, 0.24)}" stroke-width="2" />
  `,
    64,
    18,
  );
}

function buildBackdropPatternSvg(themeId: ThemeBandId, palette: ThemeArtPalette): string {
  if (themeId === "chapter2") {
    return wrapSvg(`
      <rect width="64" height="64" fill="${withAlpha(palette.backdropBase, 0.22)}" />
      <rect x="0" y="0" width="64" height="64" rx="8" fill="none" stroke="${withAlpha(palette.backdropAccent, 0.16)}" stroke-width="1" />
      <path d="M0 16 H64 M0 32 H64 M0 48 H64" stroke="${withAlpha(palette.backdropAccentAlt, 0.16)}" stroke-width="1" />
      <path d="M16 0 V64 M32 0 V64 M48 0 V64" stroke="${withAlpha(palette.motifAccent, 0.08)}" stroke-width="1" />
      <circle cx="16" cy="16" r="2" fill="${withAlpha(palette.panelLine, 0.18)}" />
      <circle cx="48" cy="16" r="2" fill="${withAlpha(palette.panelLine, 0.18)}" />
      <circle cx="16" cy="48" r="2" fill="${withAlpha(palette.panelLine, 0.18)}" />
      <circle cx="48" cy="48" r="2" fill="${withAlpha(palette.panelLine, 0.18)}" />
    `);
  }
  if (themeId === "chapter3") {
    return wrapSvg(`
      <rect width="64" height="64" fill="${withAlpha(palette.backdropBase, 0.2)}" />
      <path d="M0 8 H64 M0 24 H64 M0 40 H64 M0 56 H64" stroke="${withAlpha(palette.backdropAccent, 0.14)}" stroke-width="1" />
      <path d="M8 0 V64 M24 0 V64 M40 0 V64 M56 0 V64" stroke="${withAlpha(palette.backdropAccentAlt, 0.14)}" stroke-width="1" />
      <path d="M8 8 H24 V16 H40 V8 H56" stroke="${withAlpha(palette.panelLine, 0.16)}" stroke-width="1.5" fill="none" />
      <path d="M8 40 H20 V48 H36 V32 H56" stroke="${withAlpha(palette.motifAccent, 0.12)}" stroke-width="1.5" fill="none" />
    `);
  }
  return wrapSvg(`
    <rect width="64" height="64" fill="${withAlpha(palette.backdropBase, 0.18)}" />
    <path d="M0 20 C16 16 24 28 40 24 C52 22 58 12 64 18" stroke="${withAlpha(palette.backdropAccent, 0.18)}" stroke-width="2" fill="none" />
    <path d="M0 44 C12 38 24 50 36 44 C48 40 56 52 64 46" stroke="${withAlpha(palette.backdropAccentAlt, 0.16)}" stroke-width="2" fill="none" />
    <path d="M0 0 H64 V64" stroke="${withAlpha(palette.panelLine, 0.08)}" stroke-width="1" fill="none" />
  `);
}

function buildBackdropMotifSvg(themeId: ThemeBandId, palette: ThemeArtPalette): string {
  if (themeId === "chapter2") {
    return wrapSvg(
      `
      <rect width="128" height="128" fill="transparent" />
      <rect x="18" y="18" width="36" height="36" rx="6" fill="${withAlpha(palette.backdropAccent, 0.12)}" />
      <rect x="74" y="22" width="32" height="32" rx="6" fill="${withAlpha(palette.backdropAccentAlt, 0.1)}" />
      <path d="M10 86 H118" stroke="${withAlpha(palette.panelLine, 0.14)}" stroke-width="4" />
      <path d="M20 70 V118 M108 70 V118" stroke="${withAlpha(palette.panelLine, 0.12)}" stroke-width="3" />
    `,
      128,
      128,
    );
  }
  if (themeId === "chapter3") {
    return wrapSvg(
      `
      <rect width="128" height="128" fill="transparent" />
      <path d="M16 24 H52 V40 H78 V18 H112" stroke="${withAlpha(palette.backdropAccent, 0.16)}" stroke-width="4" fill="none" />
      <path d="M18 84 H40 V66 H70 V96 H110" stroke="${withAlpha(palette.backdropAccentAlt, 0.16)}" stroke-width="4" fill="none" />
      <circle cx="54" cy="40" r="4" fill="${withAlpha(palette.motifAccent, 0.24)}" />
      <circle cx="70" cy="96" r="4" fill="${withAlpha(palette.motifAccent, 0.24)}" />
    `,
      128,
      128,
    );
  }
  if (themeId === "midboss" || themeId === "finalboss" || themeId === "tier2") {
    return wrapSvg(
      `
      <rect width="128" height="128" fill="transparent" />
      <circle cx="64" cy="64" r="42" fill="none" stroke="${withAlpha(palette.backdropAccent, 0.16)}" stroke-width="6" />
      <circle cx="64" cy="64" r="26" fill="none" stroke="${withAlpha(palette.backdropAccentAlt, 0.14)}" stroke-width="3" />
      <path d="M64 10 V30 M64 98 V118 M10 64 H30 M98 64 H118" stroke="${withAlpha(palette.panelLine, 0.18)}" stroke-width="4" />
    `,
      128,
      128,
    );
  }
  return wrapSvg(
    `
    <rect width="128" height="128" fill="transparent" />
    <path d="M0 24 H128 M0 104 H128" stroke="${withAlpha(palette.motifAccent, 0.08)}" stroke-width="2" />
    <path d="M18 34 C42 8 86 8 110 34" stroke="${withAlpha(palette.backdropAccent, 0.16)}" stroke-width="5" fill="none" />
    <path d="M14 94 C40 70 88 70 114 94" stroke="${withAlpha(palette.backdropAccentAlt, 0.14)}" stroke-width="5" fill="none" />
  `,
    128,
    128,
  );
}

function buildWarningStripeSvg(_themeId: ThemeBandId, palette: ThemeArtPalette): string {
  return wrapSvg(
    `
    <rect width="96" height="32" fill="${withAlpha(palette.warningAccent, 0.08)}" />
    <path d="M-16 32 L8 0 M8 32 L32 0 M32 32 L56 0 M56 32 L80 0 M80 32 L104 0" stroke="${withAlpha(palette.warningAccent, 0.32)}" stroke-width="8" />
    <path d="M0 31 H96" stroke="${withAlpha(palette.panelLine, 0.18)}" stroke-width="2" />
  `,
    96,
    32,
  );
}

function wrapSvg(content: string, width = 64, height = 64): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" shape-rendering="geometricPrecision">${content}</svg>`;
}

function svgToDataUri(svg: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function withAlpha(hex: string, alpha: number): string {
  const normalized = hex.replace("#", "");
  if (normalized.length !== 6) {
    return hex;
  }
  const r = Number.parseInt(normalized.slice(0, 2), 16);
  const g = Number.parseInt(normalized.slice(2, 4), 16);
  const b = Number.parseInt(normalized.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${Math.max(0, Math.min(1, alpha))})`;
}

function mixHex(left: string, right: string, ratio: number): string {
  const [lr, lg, lb] = parseHex(left);
  const [rr, rg, rb] = parseHex(right);
  const clamped = Math.max(0, Math.min(1, ratio));
  const r = Math.round(lr + (rr - lr) * clamped);
  const g = Math.round(lg + (rg - lg) * clamped);
  const b = Math.round(lb + (rb - lb) * clamped);
  return `rgb(${r}, ${g}, ${b})`;
}

function parseHex(value: string): [number, number, number] {
  const normalized = value.replace("#", "");
  if (normalized.length !== 6) {
    return [255, 255, 255];
  }
  return [
    Number.parseInt(normalized.slice(0, 2), 16),
    Number.parseInt(normalized.slice(2, 4), 16),
    Number.parseInt(normalized.slice(4, 6), 16),
  ];
}
