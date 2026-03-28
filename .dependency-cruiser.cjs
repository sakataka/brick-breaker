/** @type {import("dependency-cruiser").IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: "game-v2-no-app",
      comment: "The v2 runtime stays app-agnostic outside the dedicated store bridge adapter.",
      severity: "error",
      from: {
        path: "^src/game-v2/",
        pathNot: "^src/game-v2/adapters/storeBridge.ts$",
      },
      to: {
        path: "^src/app/",
      },
    },
    {
      name: "no-legacy-game-or-core",
      comment: "All runtime ownership lives in src/game-v2; legacy paths must not be reintroduced.",
      severity: "error",
      from: {
        path: "^src/",
      },
      to: {
        path: "^src/(game|core)/",
      },
    },
    {
      name: "ui-host-no-legacy-game",
      comment:
        "App, Phaser, and main entrypoints should depend on v2 public contracts instead of legacy paths.",
      severity: "error",
      from: {
        path: "^src/(app/|phaser/|main\\.ts$)",
      },
      to: {
        path: "^src/(game|core)/",
      },
    },
  ],
  options: {
    tsConfig: {
      fileName: "tsconfig.app.json",
    },
    doNotFollow: {
      path: "node_modules",
    },
    includeOnly: "^src/",
    reporterOptions: {
      dot: {
        collapsePattern: "node_modules/[^/]+",
      },
    },
  },
};
