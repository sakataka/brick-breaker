import { describe, expect, test } from "vitest";
import { getAllArtTextureEntries, getBrickSkin, resolveVisualAssetProfile } from "./visualAssets";

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
});
