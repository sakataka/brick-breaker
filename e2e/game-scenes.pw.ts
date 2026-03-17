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

test("start -> playing -> paused -> playing", async ({ page }) => {
  await presetLocale(page, "ja");
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

test("stage 11 legends appear in HUD via test scenario", async ({ page }) => {
  await presetLocale(page, "ja");
  await page.goto("/");

  await page.evaluate(() => {
    window.__brickBreakerTest?.loadScenario("stage11_legends");
  });

  await expect(page.locator("#overlay")).toHaveClass(/hidden/);
  await expect(page.locator("#items")).toContainText("鋼壁: 破壊不可");
  await expect(page.locator("#items")).toContainText("発生装置: 周辺再生");
  await expect(page.locator("#items")).toContainText("砲台: 敵弾発射");
});

test("item pickup toast does not block pause input", async ({ page }) => {
  await presetLocale(page, "ja");
  await page.goto("/");

  await page.evaluate(() => {
    window.__brickBreakerTest?.loadScenario("pickup_toast");
  });

  await expect(page.locator(".hud-pickup-toast")).toBeVisible();
  await page.keyboard.press("KeyP");
  await expect(page.locator("#overlay")).toHaveAttribute("data-scene", "paused");
});

test("boss telegraph appears during boss scenario", async ({ page }) => {
  await presetLocale(page, "ja");
  await page.goto("/");

  await page.evaluate(() => {
    window.__brickBreakerTest?.loadScenario("boss_telegraph");
  });

  await expect(page.locator("#overlay")).toHaveClass(/hidden/);
  await expect(page.locator(".hud-stage-combat")).toContainText(
    /射撃予兆|制圧予兆|集中弾予兆|遮断掃射予兆/,
  );
  await expect(page.locator(".hud-boss-banner")).toBeVisible();
  await expect(page.locator("#stage-wrap")).toHaveAttribute("data-theme", /finalboss|midboss/);
  await expect
    .poll(async () =>
      page.locator("#stage-wrap").evaluate((element) => {
        return getComputedStyle(element).getPropertyValue("--art-backdrop-pattern").trim();
      }),
    )
    .toContain("data:image/svg+xml");
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

    const canvas = page.locator("#game-canvas");
    const box = await canvas.boundingBox();
    expect(box).not.toBeNull();
    if (!box) {
      throw new Error("canvas bounding box is missing");
    }

    const clipWidth = Math.floor(Math.max(120, box.width * 0.9));
    const clipHeight = Math.floor(Math.max(80, box.height * 0.42));
    expect(clipWidth).toBeGreaterThan(780);
    expect(clipHeight).toBeGreaterThan(200);
    expect(box.height / box.width).toBeGreaterThan(0.45);
    expect(box.height / box.width).toBeLessThan(0.7);
  });
});
