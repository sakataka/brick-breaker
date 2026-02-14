import "./styles.css";
import { createElement } from "react";
import { createRoot } from "react-dom/client";
import { AppUi } from "./app/AppUi";
import { Game } from "./game/Game";
import { getRequiredElement } from "./util/dom";

declare global {
  interface Window {
    __brickBreaker?: Game;
  }
}

const canvas = getRequiredElement<HTMLCanvasElement>(document, "#game-canvas", "canvas要素が見つかりません");
const uiRootElement = getRequiredElement<HTMLDivElement>(document, "#ui-root", "ui-root要素が見つかりません");
const uiRoot = createRoot(uiRootElement);
uiRoot.render(createElement(AppUi));

const game = new Game(canvas);

game.start();
window.__brickBreaker = game;
window.addEventListener("beforeunload", () => {
  game.destroy();
  uiRoot.unmount();
});
