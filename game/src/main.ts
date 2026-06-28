import { GameScene } from './GameScene';

const mount = document.getElementById('app');
if (!mount) throw new Error('#app mount not found');
// eslint-disable-next-line @typescript-eslint/no-new
new GameScene(mount);
