import "./styles.css";
import { Game } from "./game/Game";
import { getOverlayElements } from "./ui/overlay";
import { getRequiredElement } from "./util/dom";

declare global {
  interface Window {
    __brickBreaker?: Game;
  }
}

const canvas = getRequiredElement<HTMLCanvasElement>(document, "#game-canvas", "canvas要素が見つかりません");
const scoreEl = getRequiredElement<HTMLSpanElement>(document, "#score", "score要素が見つかりません");
const livesEl = getRequiredElement<HTMLSpanElement>(document, "#lives", "lives要素が見つかりません");
const timeEl = getRequiredElement<HTMLSpanElement>(document, "#time", "time要素が見つかりません");
const stageEl = getRequiredElement<HTMLSpanElement>(document, "#stage", "stage要素が見つかりません");
const comboEl = getRequiredElement<HTMLSpanElement>(document, "#combo", "combo要素が見つかりません");
const itemsEl = getRequiredElement<HTMLSpanElement>(document, "#items", "items要素が見つかりません");
const a11yEl = getRequiredElement<HTMLSpanElement>(document, "#a11y-badge", "a11y-badge要素が見つかりません");
const overlayElements = getOverlayElements(document);

const game = new Game(
  canvas,
  {
    score: scoreEl,
    lives: livesEl,
    time: timeEl,
    stage: stageEl,
    combo: comboEl,
    items: itemsEl,
    a11y: a11yEl,
  },
  overlayElements,
);

game.start();
window.__brickBreaker = game;
window.addEventListener("beforeunload", () => game.destroy());
