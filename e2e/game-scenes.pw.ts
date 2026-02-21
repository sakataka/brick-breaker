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
  const shopBox = await page.locator("#shop-panel").boundingBox();
  const progressBox = await page.locator("#hud-progress-track").boundingBox();
  expect(topbarBox).not.toBeNull();
  expect(canvasBox).not.toBeNull();
  expect(shopBox).not.toBeNull();
  expect(progressBox).not.toBeNull();
  if (topbarBox && canvasBox && shopBox && progressBox) {
    expect(topbarBox.y + topbarBox.height).toBeLessThanOrEqual(canvasBox.y + 1);
    expect(shopBox.y + shopBox.height).toBeLessThanOrEqual(canvasBox.y + 1);
    expect(progressBox.y + progressBox.height).toBeLessThanOrEqual(canvasBox.y + 1);
  }
  await expect(page.locator("#shop-reroll")).toHaveCount(0);

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

test("gameover overlay shows preserved final score", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => {
    window.__brickBreaker?.debugSetGameOverScore(2400, 1);
  });
  await expect(page.locator("#overlay")).toHaveAttribute("data-scene", "gameover");
  await expect(page.locator("#overlay-sub")).toContainText("最終スコア 2400 / 残機 1");
});

test.describe("dpi regression", () => {
  test.use({
    viewport: { width: 1280, height: 720 },
    deviceScaleFactor: 2,
  });

  test("brick area remains stable at DPR2", async ({ page }) => {
    await page.goto("/");
    await page.locator("#overlay-button").click();
    await expect(page.locator("#overlay")).toHaveClass(/hidden/);
    await page.waitForTimeout(150);

    const canvas = page.locator("#game-canvas");
    const box = await canvas.boundingBox();
    expect(box).not.toBeNull();
    if (!box) {
      throw new Error("canvas bounding box is missing");
    }

    const clipWidth = Math.floor(Math.max(120, box.width * 0.9));
    const clipHeight = Math.floor(Math.max(80, box.height * 0.42));
    const clipX = Math.floor(box.x + (box.width - clipWidth) * 0.5);
    const clipY = Math.floor(box.y + box.height * 0.02);
    const screenshot = await page.screenshot({
      clip: {
        x: clipX,
        y: clipY,
        width: clipWidth,
        height: clipHeight,
      },
    });

    expect(screenshot).toMatchSnapshot("brick-area-dpr2.png", {
      maxDiffPixelRatio: 0.02,
    });
  });
});
