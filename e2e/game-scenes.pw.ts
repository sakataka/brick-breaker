import { expect, type Page, test } from "@playwright/test";

async function presetLocale(page: Page, locale: "ja" | "en") {
  await page.addInitScript((value) => {
    window.localStorage.setItem("brick_breaker:locale", value);
  }, locale);
}

async function forceScene(page: Page, scene: "stageclear" | "gameover" | "clear" | "error") {
  await page.evaluate((target) => {
    window.__brickBreakerTest?.forceScene(target);
  }, scene);
}

async function assertPlayCanvasLayout(page: Page) {
  const topbarBox = await page.locator("#play-topbar").boundingBox();
  const playAreaBox = await page.locator("#play-area").boundingBox();
  const canvasBox = await page.locator("#game-canvas").boundingBox();
  const shopBox = await page.locator("#shop-panel").boundingBox();
  const progressBox = await page.locator("#hud-progress-track").boundingBox();
  expect(topbarBox).not.toBeNull();
  expect(playAreaBox).not.toBeNull();
  expect(canvasBox).not.toBeNull();
  expect(shopBox).not.toBeNull();
  expect(progressBox).not.toBeNull();
  if (!topbarBox || !playAreaBox || !canvasBox || !shopBox || !progressBox) {
    throw new Error("play layout bounding box is missing");
  }

  expect(topbarBox.y + topbarBox.height).toBeLessThanOrEqual(canvasBox.y + 1);
  expect(shopBox.y + shopBox.height).toBeLessThanOrEqual(canvasBox.y + 1);
  expect(progressBox.y + progressBox.height).toBeLessThanOrEqual(canvasBox.y + 1);
  expect(canvasBox.x).toBeGreaterThanOrEqual(playAreaBox.x - 1);
  expect(canvasBox.y).toBeGreaterThanOrEqual(playAreaBox.y - 1);
  expect(canvasBox.x + canvasBox.width).toBeLessThanOrEqual(playAreaBox.x + playAreaBox.width + 1);
  expect(canvasBox.y + canvasBox.height).toBeLessThanOrEqual(
    playAreaBox.y + playAreaBox.height + 1,
  );
  expect(canvasBox.width / canvasBox.height).toBeGreaterThan(1.74);
  expect(canvasBox.width / canvasBox.height).toBeLessThan(1.82);

  return { canvasBox, playAreaBox, topbarBox };
}

test("start -> playing -> paused -> playing", async ({ page }) => {
  await presetLocale(page, "ja");
  await page.goto("/");
  await expect.poll(async () => page.evaluate(() => Boolean(window.__brickBreakerTest))).toBe(true);

  await expect(page.locator("#overlay")).toBeVisible();
  await expect(page.locator("#overlay")).toHaveAttribute("data-scene", "start");
  await expect(page.locator("#stage-wrap")).not.toHaveClass(/layout-play/);

  await page.locator("#overlay-button").click();
  await expect(page.locator("#overlay")).toHaveClass(/hidden/);
  await expect(page.locator("#stage-wrap")).toHaveClass(/layout-play/);
  await expect(page.locator("#play-topbar")).toHaveClass(/active/);
  await assertPlayCanvasLayout(page);

  await page.keyboard.press("KeyP");
  await expect(page.locator("#overlay")).toHaveAttribute("data-scene", "paused");
  await expect(page.locator("#stage-wrap")).toHaveClass(/layout-play/);

  await page.locator("#overlay-button").click();
  await expect(page.locator("#overlay")).toHaveClass(/hidden/);
});

test("scene overlays can be forced for regression checks", async ({ page }) => {
  await presetLocale(page, "ja");
  await page.goto("/");

  await forceScene(page, "stageclear");
  await expect(page.locator("#overlay")).toHaveAttribute("data-scene", "stageclear");
  await expect(page.locator("#overlay-button")).toHaveText("次へ");

  await forceScene(page, "gameover");
  await expect(page.locator("#overlay")).toHaveAttribute("data-scene", "gameover");
  await expect(page.locator("#overlay-button")).toHaveText("もう一度");

  await forceScene(page, "clear");
  await expect(page.locator("#overlay")).toHaveAttribute("data-scene", "clear");
  await expect(page.locator("#overlay-button")).toHaveText("タイトルへ戻る");

  await forceScene(page, "error");
  await expect(page.locator("#overlay")).toHaveAttribute("data-scene", "error");
  await expect(page.locator("#overlay-button")).toHaveText("再読み込み");
});

test("gameover overlay shows preserved final score", async ({ page }) => {
  await presetLocale(page, "ja");
  await page.goto("/");
  await page.evaluate(() => {
    window.__brickBreakerTest?.setGameOverScore(2400, 1);
  });
  await expect(page.locator("#overlay")).toHaveAttribute("data-scene", "gameover");
  await expect(page.locator("#overlay-sub")).toContainText("最終スコア 2400 / 残機 1");
});

test("start screen locale switch keeps CTA visible with shipped settings only", async ({
  page,
}) => {
  await page.goto("/");

  await expect(page.locator("#setting-language option")).toHaveCount(2);
  await expect(page.locator("#setting-difficulty")).toBeVisible();
  await expect(page.locator("#setting-reduced-motion-enabled")).toBeVisible();
  await expect(page.locator("#setting-high-contrast-enabled")).toBeVisible();
  await expect(page.locator("#setting-bgm-enabled")).toBeVisible();
  await expect(page.locator("#setting-sfx-enabled")).toBeVisible();

  await page.locator("#setting-language").selectOption("en");
  await expect(page.locator("#overlay-button")).toHaveText("Start Game");
  await expect
    .poll(async () =>
      page.locator("#overlay").evaluate((element) => {
        return getComputedStyle(element).getPropertyValue("--art-panel-fill").trim();
      }),
    )
    .toContain("data:image/svg+xml");

  const buttonBox = await page.locator("#overlay-button").boundingBox();
  const footerBox = await page.locator(".overlay-fixed-footer").boundingBox();
  expect(buttonBox).not.toBeNull();
  expect(footerBox).not.toBeNull();
  if (buttonBox && footerBox) {
    expect(buttonBox.y).toBeGreaterThanOrEqual(footerBox.y);
    expect(buttonBox.y + buttonBox.height).toBeLessThanOrEqual(footerBox.y + footerBox.height + 1);
  }
});

test("threat tier 2 unlock persists in saved progression", async ({ page }) => {
  await presetLocale(page, "en");
  await page.goto("/");

  await page.evaluate(() => {
    window.__brickBreakerTest?.unlockThreatTier2();
  });

  await expect
    .poll(async () =>
      page.evaluate(() => {
        const raw = window.localStorage.getItem("brick_breaker:progression");
        return raw ? JSON.parse(raw).threatTier2Unlocked === true : false;
      }),
    )
    .toBe(true);

  await page.reload();
  await expect
    .poll(async () =>
      page.evaluate(() => {
        const raw = window.localStorage.getItem("brick_breaker:progression");
        return raw ? JSON.parse(raw).threatTier2Unlocked === true : false;
      }),
    )
    .toBe(true);
});

test("shop preview exposes next encounter score focus and tags", async ({ page }) => {
  await presetLocale(page, "ja");
  await page.goto("/");
  await page.locator("#overlay-button").click();
  await expect(page.locator("#overlay")).toHaveClass(/hidden/);
  await expect(page.locator("#shop-panel")).toBeVisible();
  await expect(page.locator(".shop-preview-line")).toContainText("NEXT STAGE 2");
});

test("item pickup toast does not block pause input after a real shop purchase", async ({
  page,
}) => {
  await presetLocale(page, "ja");
  await page.goto("/");
  await page.locator("#overlay-button").click();
  await page.locator("#shop-option-a").click();
  await expect(page.locator(".hud-pickup-toast")).toBeVisible();
  await page.keyboard.press("KeyP");
  await expect(page.locator("#overlay")).toHaveAttribute("data-scene", "paused");
});

test.describe("dpi regression", () => {
  test.use({
    viewport: { width: 1280, height: 720 },
    deviceScaleFactor: 2,
  });

  test("brick area remains stable at DPR2", async ({ page }) => {
    await presetLocale(page, "ja");
    await page.goto("/");
    await page.locator("#overlay-button").click();
    await expect(page.locator("#overlay")).toHaveClass(/hidden/);
    await page.waitForTimeout(150);

    const { canvasBox, playAreaBox } = await assertPlayCanvasLayout(page);

    const clipWidth = Math.floor(Math.max(120, canvasBox.width * 0.9));
    const clipHeight = Math.floor(Math.max(80, canvasBox.height * 0.42));
    expect(clipWidth).toBeGreaterThan(780);
    expect(clipHeight).toBeGreaterThan(200);
    expect(canvasBox.width).toBeLessThanOrEqual(playAreaBox.width + 1);
    expect(canvasBox.height).toBeLessThanOrEqual(playAreaBox.height + 1);
  });
});
