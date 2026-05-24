import { Game } from './core/Game.js';

const canvas = document.getElementById('game');

// We need to size the canvas BEFORE constructing the Game (Camera reads
// canvas.width/height once in its constructor). Then on resize/orientation we
// update both the canvas and the live Camera.
let game = null;

function sizeCanvasToViewport() {
  // Cap the buffer to avoid massive draws on 4K displays.
  const maxW = 1600, maxH = 1200;
  const w = Math.min(window.innerWidth,  maxW);
  const h = Math.min(window.innerHeight, maxH);
  canvas.width = w;
  canvas.height = h;
  return { w, h };
}

function onResize() {
  const { w, h } = sizeCanvasToViewport();
  if (game) {
    game.camera.viewW = w;
    game.camera.viewH = h;
    game.touch?.layout?.(w, h);
  }
}

sizeCanvasToViewport();
game = new Game(canvas);
game.start();

window.addEventListener('resize', onResize);
window.addEventListener('orientationchange', onResize);

window.__game = game;
