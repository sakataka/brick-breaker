import { describe, expect, test } from "vite-plus/test";
import type { BrickKind } from "../game-v2/public/types";
import { BRICK_SURFACE_PATTERN_ORDER } from "../phaser/render/layers/renderers/bricksRenderer";
import {
  BRICK_SKIN_KIND_ORDER,
  getAllArtTextureEntries,
  getBrickSkin,
  resolveVisualAssetProfile,
  type BrickSkinSpec,
} from "./visualAssets";

const EXPECTED_BRICK_KINDS: Record<BrickKind, true> = {
  normal: true,
  steel: true,
  generator: true,
  gate: true,
  turret: true,
  durable: true,
  armored: true,
  regen: true,
  hazard: true,
  boss: true,
  split: true,
  summon: true,
  thorns: true,
};

const EXPECTED_BRICK_PATTERNS: Record<BrickSkinSpec["pattern"], true> = {
  panel: true,
  plate: true,
  circuit: true,
  rivets: true,
  core: true,
  barrier: true,
  turret: true,
  hazard: true,
  armor: true,
  split: true,
  summon: true,
  thorns: true,
};

describe("visualAssets", () => {
  test("resolves distinct texture sets for chapter and boss themes", () => {
    const chapter = resolveVisualAssetProfile("chapter1", "calm", "chapter");
    const boss = resolveVisualAssetProfile("finalboss", "critical", "finalboss");

    expect(chapter.panelSet).not.toBe(boss.panelSet);
    expect(chapter.backdrop.patternTextureKey).not.toBe(boss.backdrop.patternTextureKey);
    expect(boss.warning.stripeOpacity).toBeGreaterThan(chapter.warning.stripeOpacity);
  });

  test("art texture manifest exposes unique texture keys", () => {
    const keys = getAllArtTextureEntries().map((entry) => entry.key);
    expect(new Set(keys).size).toBe(keys.length);
    expect(keys.length).toBeGreaterThanOrEqual(18);
  });

  test("brick skins distinguish special blocks from chapter normals", () => {
    const chapter = resolveVisualAssetProfile("chapter2", "calm", "chapter");
    const normal = getBrickSkin("normal", chapter, "rgba(255, 170, 86, 0.32)");
    const steel = getBrickSkin("steel", chapter, "rgba(255, 170, 86, 0.32)");
    const turret = getBrickSkin("turret", chapter, "rgba(255, 170, 86, 0.32)");

    expect(normal.pattern).toBe("plate");
    expect(steel.pattern).toBe("rivets");
    expect(turret.pattern).toBe("turret");
    expect(steel.baseColor).not.toBe(normal.baseColor);
  });

  test("brick skin and surface pattern registries cover the public brick kinds", () => {
    const chapter = resolveVisualAssetProfile("chapter1", "calm", "chapter");
    const patterns = new Set<BrickSkinSpec["pattern"]>();

    expect(BRICK_SKIN_KIND_ORDER).toEqual(Object.keys(EXPECTED_BRICK_KINDS));
    for (const kind of BRICK_SKIN_KIND_ORDER) {
      patterns.add(getBrickSkin(kind, chapter, "rgba(64, 244, 255, 0.32)").pattern);
    }

    expect(BRICK_SURFACE_PATTERN_ORDER).toEqual(Object.keys(EXPECTED_BRICK_PATTERNS));
    expect([...patterns].every((pattern) => BRICK_SURFACE_PATTERN_ORDER.includes(pattern))).toBe(
      true,
    );
  });
});
