import { defineConfig } from "@playwright/test";

const webServerCommand =
  process.env.PLAYWRIGHT_WEB_SERVER_COMMAND ?? "vp dev --host 127.0.0.1 --port 4173";

export default defineConfig({
  testDir: "./e2e",
  testMatch: "**/*.pw.ts",
  snapshotPathTemplate: "{testDir}/{testFilePath}-snapshots/{arg}{ext}",
  timeout: 30_000,
  retries: process.env.CI ? 2 : 0,
  use: {
    baseURL: "http://127.0.0.1:4173",
    headless: true,
  },
  webServer: {
    command: webServerCommand,
    url: "http://127.0.0.1:4173",
    timeout: 120_000,
    reuseExistingServer: !process.env.CI,
  },
});
