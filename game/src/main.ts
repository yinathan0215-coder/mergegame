import { BatchRenderer } from 'pixi.js';
import { GameScene } from './GameScene';

BatchRenderer.defaultMaxTextures = 4;

const mount = document.getElementById('app');
if (!mount) throw new Error('#app mount not found');
// eslint-disable-next-line @typescript-eslint/no-new
new GameScene(mount);
