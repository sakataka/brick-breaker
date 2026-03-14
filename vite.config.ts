import react from "@vitejs/plugin-react";
import { defineConfig } from "vite-plus";

const githubPagesBase = "/brick-breaker/";
const phaserPackagePattern = /node_modules[\\/]phaser[\\/]/;
const trackedTaskEnvs = ["CI", "GITHUB_ACTIONS"];
const untrackedTaskEnvs = ["PLAYWRIGHT_WEB_SERVER_COMMAND"];

export default defineConfig({
  plugins: [react()],
  lint: {
    ignorePatterns: ["dist/**", "node_modules/**", "playwright-report/**", "test-results/**"],
  },
  test: {
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    exclude: ["e2e/**", "dist/**", "node_modules/**"],
    globals: false,
    environment: "node",
  },
  staged: {
    "*": "vp check --fix",
  },
  base: process.env.GITHUB_ACTIONS === "true" ? githubPagesBase : "/",
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              name: "phaser",
              test: phaserPackagePattern,
              priority: 10,
            },
          ],
        },
      },
    },
  },
  server: {
    host: true,
  },
  preview: {
    host: true,
  },
  run: {
    tasks: {
      "check:fast": {
        command: "vp check && vp test && vp run deadcode",
        env: trackedTaskEnvs,
        untrackedEnv: untrackedTaskEnvs,
      },
      "guard:local": {
        command: "vp run check:fast && vp run check:arch",
        env: trackedTaskEnvs,
        untrackedEnv: untrackedTaskEnvs,
      },
      "guard:ci": {
        command: "vp run guard:local && vp run verify:change-coverage && vp run e2e:ci",
        env: trackedTaskEnvs,
        untrackedEnv: untrackedTaskEnvs,
      },
    },
  },
});
