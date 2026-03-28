import "@fontsource/public-sans/400.css";
import "@fontsource/public-sans/600.css";
import "@fontsource/space-grotesk/600.css";
import "@fontsource/space-grotesk/700.css";
import "./styles.css";
import { createElement } from "react";
import { createRoot } from "react-dom/client";
import { AppUi } from "./app/AppUi";
import { GameSession } from "./game-v2/session/GameSession";
import type { BrickBreakerTestBridge } from "./game-v2/public/testBridge";
import { getRequiredElement } from "./util/dom";

declare global {
  interface Window {
    __brickBreakerTest?: BrickBreakerTestBridge;
  }
}

const canvas = getRequiredElement<HTMLCanvasElement>(
  document,
  "#game-canvas",
  "canvas要素が見つかりません",
);
const uiRootElement = getRequiredElement<HTMLDivElement>(
  document,
  "#ui-root",
  "ui-root要素が見つかりません",
);
const uiRoot = createRoot(uiRootElement);
uiRoot.render(createElement(AppUi));

const game = new GameSession(canvas);

game.start();
window.__brickBreakerTest = game.createTestBridge();
window.addEventListener("beforeunload", () => {
  delete window.__brickBreakerTest;
  game.destroy();
  uiRoot.unmount();
});
