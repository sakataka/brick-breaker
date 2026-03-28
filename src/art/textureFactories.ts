import type { ThemeBandId } from "../game-v2/public/themes";
import type { ArtEncounterEmphasis } from "./visualAssets";
import type { ThemeArtPalette } from "./themePalettes";

export function resolveTextureDensity(
  themeId: ThemeBandId,
  encounterEmphasis: ArtEncounterEmphasis,
): number {
  const base = themeId === "chapter1" ? 0.82 : themeId === "chapter2" ? 0.96 : 1.08;
  if (encounterEmphasis === "chapter") {
    return base;
  }
  return base + 0.12;
}

export function buildPanelFillSvg(_themeId: ThemeBandId, palette: ThemeArtPalette): string {
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

export function buildPanelFrameSvg(_themeId: ThemeBandId, palette: ThemeArtPalette): string {
  return wrapSvg(`
    <rect x="2" y="2" width="60" height="60" rx="8" fill="none" stroke="${withAlpha(palette.panelLine, 0.52)}" stroke-width="2" />
    <path d="M8 6 H24 L28 10 H36 L40 6 H56" stroke="${withAlpha(palette.panelAccent, 0.7)}" stroke-width="2" fill="none" />
    <path d="M8 58 H24 L28 54 H36 L40 58 H56" stroke="${withAlpha(palette.panelAccent, 0.5)}" stroke-width="2" fill="none" />
    <path d="M6 12 V24 L10 28 V36 L6 40 V52" stroke="${withAlpha(palette.panelLine, 0.46)}" stroke-width="2" fill="none" />
    <path d="M58 12 V24 L54 28 V36 L58 40 V52" stroke="${withAlpha(palette.panelLine, 0.46)}" stroke-width="2" fill="none" />
  `);
}

export function buildPanelBadgeSvg(_themeId: ThemeBandId, palette: ThemeArtPalette): string {
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

export function buildBackdropPatternSvg(themeId: ThemeBandId, palette: ThemeArtPalette): string {
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

export function buildBackdropMotifSvg(themeId: ThemeBandId, palette: ThemeArtPalette): string {
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

export function buildWarningStripeSvg(_themeId: ThemeBandId, palette: ThemeArtPalette): string {
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

export function mixHex(left: string, right: string, ratio: number): string {
  const [lr, lg, lb] = parseHex(left);
  const [rr, rg, rb] = parseHex(right);
  const clamped = Math.max(0, Math.min(1, ratio));
  const r = Math.round(lr + (rr - lr) * clamped);
  const g = Math.round(lg + (rg - lg) * clamped);
  const b = Math.round(lb + (rb - lb) * clamped);
  return `rgb(${r}, ${g}, ${b})`;
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

function wrapSvg(content: string, width = 64, height = 64): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" shape-rendering="geometricPrecision">${content}</svg>`;
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
