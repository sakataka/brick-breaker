import "./styles.css";
import { Game } from "./game/Game";
import { getOverlayElements } from "./ui/overlay";
import { getRequiredElement } from "./util/dom";

const canvas = getRequiredElement<HTMLCanvasElement>(document, "#game-canvas", "canvas要素が見つかりません");
const scoreEl = getRequiredElement<HTMLSpanElement>(document, "#score", "score要素が見つかりません");
const livesEl = getRequiredElement<HTMLSpanElement>(document, "#lives", "lives要素が見つかりません");
const timeEl = getRequiredElement<HTMLSpanElement>(document, "#time", "time要素が見つかりません");
const stageEl = getRequiredElement<HTMLSpanElement>(document, "#stage", "stage要素が見つかりません");
const comboEl = getRequiredElement<HTMLSpanElement>(document, "#combo", "combo要素が見つかりません");
const itemsEl = getRequiredElement<HTMLSpanElement>(document, "#items", "items要素が見つかりません");
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
  },
  overlayElements,
);

game.start();
window.addEventListener("beforeunload", () => game.destroy());
