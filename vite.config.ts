import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

const githubPagesBase = "/brick-breaker/";
const phaserPackagePattern = /node_modules[\\/]phaser[\\/]/;

export default defineConfig({
  plugins: [react()],
  test: {
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    exclude: ["e2e/**", "dist/**", "node_modules/**"],
    globals: false,
    environment: "node",
    pool: "forks",
    fileParallelism: false,
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
});
