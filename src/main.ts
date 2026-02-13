import "./styles.css";
import { Game } from "./game/Game";
import { getOverlayElements } from "./ui/overlay";
import { getRequiredElement } from "./util/dom";

const canvas = getRequiredElement<HTMLCanvasElement>(document, "#game-canvas", "canvas要素が見つかりません");
const scoreEl = getRequiredElement<HTMLSpanElement>(document, "#score", "score要素が見つかりません");
const livesEl = getRequiredElement<HTMLSpanElement>(document, "#lives", "lives要素が見つかりません");
const timeEl = getRequiredElement<HTMLSpanElement>(document, "#time", "time要素が見つかりません");
const overlayElements = getOverlayElements(document);

const game = new Game(
  canvas,
  {
    score: scoreEl,
    lives: livesEl,
    time: timeEl,
  },
  overlayElements,
);

game.start();
window.addEventListener("beforeunload", () => game.destroy());
