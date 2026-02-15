import { expect, test } from "@playwright/test";

test("start -> playing -> paused -> playing", async ({ page }) => {
  await page.goto("/");

  await expect(page.locator("#overlay")).toBeVisible();
  await expect(page.locator("#overlay")).toHaveAttribute("data-scene", "start");
  await expect(page.locator("#stage-wrap")).not.toHaveClass(/layout-play/);

  await page.locator("#overlay-button").click();
  await expect(page.locator("#overlay")).toHaveClass(/hidden/);
  await expect(page.locator("#stage-wrap")).toHaveClass(/layout-play/);
  await expect(page.locator("#play-topbar")).toHaveClass(/active/);

  const topbarBox = await page.locator("#play-topbar").boundingBox();
  const canvasBox = await page.locator("#game-canvas").boundingBox();
  expect(topbarBox).not.toBeNull();
  expect(canvasBox).not.toBeNull();
  if (topbarBox && canvasBox) {
    expect(topbarBox.y + topbarBox.height).toBeLessThanOrEqual(canvasBox.y + 1);
  }

  await page.keyboard.press("KeyP");
  await expect(page.locator("#overlay")).toHaveAttribute("data-scene", "paused");
  await expect(page.locator("#stage-wrap")).toHaveClass(/layout-play/);

  await page.locator("#overlay-button").click();
  await expect(page.locator("#overlay")).toHaveClass(/hidden/);
});

test("scene overlays can be forced for regression checks", async ({ page }) => {
  await page.goto("/");

  const forceScene = async (scene: "stageclear" | "gameover" | "clear" | "error") => {
    await page.evaluate((target) => {
      window.__brickBreaker?.debugForceScene(target);
    }, scene);
    await expect(page.locator("#overlay")).toHaveAttribute("data-scene", scene);
  };

  await forceScene("stageclear");
  await expect(page.locator("#overlay-button")).toHaveText("次へ");

  await forceScene("gameover");
  await expect(page.locator("#overlay-button")).toHaveText("もう一度");

  await forceScene("clear");
  await expect(page.locator("#overlay-button")).toHaveText("タイトルへ戻る");

  await forceScene("error");
  await expect(page.locator("#overlay-button")).toHaveText("再読み込み");
});
