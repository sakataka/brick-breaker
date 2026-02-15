import type Phaser from "phaser";

export interface ParsedColor {
  value: number;
  alpha: number;
}

export function readDevicePixelRatio(scene: Phaser.Scene): number {
  const ratio = scene.game.canvas.ownerDocument?.defaultView?.devicePixelRatio ?? 1;
  return Math.max(1, Math.min(2, ratio));
}

export function snapPixel(value: number): number {
  return Math.round(value) + 0.5;
}

export function parseColor(input: string, fallback: ParsedColor): ParsedColor {
  if (input.startsWith("#")) {
    const normalized = normalizeHex(input);
    if (!normalized) {
      return fallback;
    }
    return {
      value: Number.parseInt(normalized, 16),
      alpha: 1,
    };
  }

  const rgba = input.match(
    /^rgba?\(\s*([0-9]+(?:\.[0-9]+)?)\s*,\s*([0-9]+(?:\.[0-9]+)?)\s*,\s*([0-9]+(?:\.[0-9]+)?)(?:\s*,\s*([0-9]+(?:\.[0-9]+)?))?\s*\)$/i,
  );
  if (!rgba) {
    return fallback;
  }

  const r = clampColorChannel(Number.parseFloat(rgba[1]));
  const g = clampColorChannel(Number.parseFloat(rgba[2]));
  const b = clampColorChannel(Number.parseFloat(rgba[3]));
  const alpha = rgba[4] ? Math.max(0, Math.min(1, Number.parseFloat(rgba[4]))) : 1;
  return {
    value: (r << 16) | (g << 8) | b,
    alpha,
  };
}

function clampColorChannel(value: number): number {
  return Math.max(0, Math.min(255, Math.round(value)));
}

function normalizeHex(value: string): string | null {
  const text = value.trim().replace("#", "");
  if (/^[0-9a-fA-F]{6}$/.test(text)) {
    return text;
  }
  if (/^[0-9a-fA-F]{3}$/.test(text)) {
    return `${text[0]}${text[0]}${text[1]}${text[1]}${text[2]}${text[2]}`;
  }
  return null;
}
