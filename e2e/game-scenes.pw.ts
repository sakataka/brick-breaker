import { expect, test } from "@playwright/test";

test("start -> playing -> paused -> playing", async ({ page }) => {
  await page.goto("/");

  await expect(page.locator("#overlay")).toBeVisible();
  await expect(page.locator("#overlay")).toHaveAttribute("data-scene", "start");

  await page.locator("#overlay-button").click();
  await expect(page.locator("#overlay")).toHaveClass(/hidden/);

  await page.keyboard.press("KeyP");
  await expect(page.locator("#overlay")).toHaveAttribute("data-scene", "paused");

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
