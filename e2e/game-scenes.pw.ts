import { expect, type Page, test } from "@playwright/test";

async function presetLocale(page: Page, locale: "ja" | "en") {
  await page.addInitScript((value) => {
    window.localStorage.setItem("brick_breaker:locale", value);
  }, locale);
}

async function presetExUnlocked(page: Page) {
  await page.addInitScript(() => {
    window.localStorage.setItem(
      "brick_breaker:meta_progress",
      JSON.stringify({ exUnlocked: true }),
    );
  });
}

async function accessDebugController<T>(page: Page, callback: () => T): Promise<T> {
  return page.evaluate(callback);
}

interface DebugWindowHandle {
  __brickBreaker?: {
    session?: {
      controller?: {
        state: {
          paddle: { x: number; y: number; width: number };
          items: {
            falling: Array<{
              id: number;
              type: string;
              pos: { x: number; y: number };
              speed: number;
              size: number;
            }>;
          };
          bricks: Array<{ kind?: string; hp?: number; maxHp?: number }>;
          combat: {
            bossPhase: number;
            bossAttackState: {
              telegraph: {
                kind: string;
                remainingSec: number;
                maxSec: number;
                targetX?: number;
                spread?: number;
              } | null;
            };
          };
        };
      };
    };
  };
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
  await expect(page.locator("#shop-reroll")).toHaveCount(0);

  await page.keyboard.press("KeyP");
  await expect(page.locator("#overlay")).toHaveAttribute("data-scene", "paused");
  await expect(page.locator("#stage-wrap")).toHaveClass(/layout-play/);

  await page.locator("#overlay-button").click();
  await expect(page.locator("#overlay")).toHaveClass(/hidden/);
});

test("scene overlays can be forced for regression checks", async ({ page }) => {
  await presetLocale(page, "ja");
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
  await presetLocale(page, "ja");
  await page.goto("/");
  await page.evaluate(() => {
    window.__brickBreaker?.debugSetGameOverScore(2400, 1);
  });
  await expect(page.locator("#overlay")).toHaveAttribute("data-scene", "gameover");
  await expect(page.locator("#overlay-sub")).toContainText("最終スコア 2400 / 残機 1");
});

test("start screen locale switch keeps CTA visible for long translations", async ({ page }) => {
  await page.goto("/");

  await expect(page.locator("#setting-language option")).toHaveCount(2);
  await expect(page.locator("#setting-language")).not.toContainText("Pseudo");

  await page.locator("#setting-language").selectOption("en");
  await expect(page.locator("#overlay-button")).toHaveText("Start Game");
  await expect(page.locator("#setting-item-pool")).toContainText("Item Pool");
  await expect(page.locator("#setting-item-pool input[type='checkbox']")).toHaveCount(11);
  await expect(page.locator("#setting-campaign-course")).toHaveCount(0);
  await expect(page.locator("#daily-challenge-label")).toHaveCount(0);
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

test("ex course selector appears after unlock", async ({ page }) => {
  await presetLocale(page, "en");
  await presetExUnlocked(page);
  await page.goto("/");

  await expect(page.locator("#setting-campaign-course")).toBeVisible();
  await page.locator("#setting-campaign-course").selectOption("ex");
  await expect(page.locator("#setting-campaign-course")).toHaveValue("ex");
});

test("debug stage 11 shows steel, generator, and turret legends in HUD", async ({ page }) => {
  await presetLocale(page, "ja");
  await page.goto("/");

  await page.locator("#setting-debug-mode").click();
  await page.locator("#setting-debug-start-stage").selectOption("11");
  await page.locator("#overlay-button").click();
  await expect(page.locator("#overlay")).toHaveClass(/hidden/);
  await expect(page.locator("#items")).toContainText("鋼壁: 破壊不可");
  await expect(page.locator("#items")).toContainText("発生装置: 周辺再生");
  await expect(page.locator("#items")).toContainText("砲台: 敵弾発射");
});

test("item pickup toast does not block pause input", async ({ page }) => {
  await presetLocale(page, "ja");
  await page.goto("/");
  await page.locator("#overlay-button").click();
  await expect(page.locator("#overlay")).toHaveClass(/hidden/);

  await accessDebugController(page, () => {
    const game = (window as Window & DebugWindowHandle).__brickBreaker;
    const controller = game?.session?.controller;
    if (!controller) {
      throw new Error("debug controller unavailable");
    }
    const state = controller.state;
    state.items.falling.push({
      id: 999,
      type: "shockwave",
      pos: { x: state.paddle.x + state.paddle.width / 2, y: state.paddle.y - 6 },
      speed: 0,
      size: 16,
    });
  });

  await expect(page.locator(".hud-pickup-toast")).toBeVisible();
  await page.keyboard.press("KeyP");
  await expect(page.locator("#overlay")).toHaveAttribute("data-scene", "paused");
});

test("boss telegraph appears during debug boss fight", async ({ page }) => {
  await presetLocale(page, "ja");
  await page.goto("/");

  await page.locator("#setting-debug-mode").click();
  await page.locator("#setting-debug-scenario").selectOption("boss_check");
  await page.locator("#overlay-button").click();
  await expect(page.locator("#overlay")).toHaveClass(/hidden/);

  await accessDebugController(page, () => {
    const game = (window as Window & DebugWindowHandle).__brickBreaker;
    const controller = game?.session?.controller;
    if (!controller) {
      throw new Error("debug controller unavailable");
    }
    const state = controller.state;
    const boss = state.bricks.find((brick: { kind?: string }) => brick.kind === "boss");
    if (!boss) {
      throw new Error("boss unavailable");
    }
    boss.hp = 5;
    boss.maxHp = 18;
    state.combat.bossPhase = 3;
    state.combat.bossAttackState.telegraph = {
      kind: "volley",
      remainingSec: 1,
      maxSec: 1,
      targetX: state.paddle.x + state.paddle.width / 2,
      spread: 92,
    };
  });

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

test("item pool can disable drops but keeps at least one item enabled", async ({ page }) => {
  await presetLocale(page, "en");
  await page.goto("/");

  const itemPool = page.locator("#setting-item-pool");
  const paddlePlus = page.locator("#setting-item-paddle_plus");
  await expect(itemPool).toBeVisible();
  await expect(page.locator("#setting-item-sticky")).toHaveCount(0);

  const checkboxes = itemPool.locator("input[type='checkbox']");
  const count = await checkboxes.count();
  expect(count).toBe(11);
  for (let index = 1; index < count; index += 1) {
    const checkbox = checkboxes.nth(index);
    if (await checkbox.isChecked()) {
      await checkbox.uncheck();
    }
  }
  await expect(paddlePlus).toBeChecked();

  await paddlePlus.click();
  await expect(paddlePlus).toBeChecked();
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
