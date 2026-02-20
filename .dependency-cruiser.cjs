/** @type {import("dependency-cruiser").IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: "core-no-ui-host-audio",
      comment: "Core should remain framework-agnostic and side-effect free.",
      severity: "error",
      from: {
        path: "^src/core/",
      },
      to: {
        path: "^src/(app|phaser|audio)/",
      },
    },
    {
      name: "game-no-app",
      comment:
        "Game layer should not directly import app UI modules (except current GameSession->store bridge).",
      severity: "error",
      from: {
        path: "^src/game/",
        pathNot: "^src/game/GameSession.ts$",
      },
      to: {
        path: "^src/app/",
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
