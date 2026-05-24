import { Game } from './core/Game.js';

const canvas = document.getElementById('game');
const game = new Game(canvas);
game.start();

// Expose for debug console poking
window.__game = game;
