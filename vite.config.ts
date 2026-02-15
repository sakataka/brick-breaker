import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const githubPagesBase = "/brick-breaker/";

export default defineConfig({
  plugins: [react()],
  base: process.env.GITHUB_ACTIONS === "true" ? githubPagesBase : "/",
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          phaser: ["phaser"],
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
