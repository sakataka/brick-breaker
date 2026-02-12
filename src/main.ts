import './styles.css';
import { Game } from './game/Game';
import { getOverlayElements } from './ui/overlay';

const canvas = document.querySelector('#game-canvas') as HTMLCanvasElement;
const scoreEl = document.querySelector('#score') as HTMLSpanElement;
const livesEl = document.querySelector('#lives') as HTMLSpanElement;
const timeEl = document.querySelector('#time') as HTMLSpanElement;

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
