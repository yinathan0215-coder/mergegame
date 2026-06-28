import { MODES } from '../data/config';

// Game mode + remaining-count state (docs/20-core-loop/game-modes · 30-systems/launch-count).
// Pure session state — GameScene owns the board, popups, and end detection and queries this for
// the current mode, count budget, and stage definition. Count is the shared launch budget: a fire
// spends 1, Infinite charge/black-hole add to it, and 0 blocks firing.
export type GameMode = 'Infinite' | 'Stage';

export interface StageDef {
  count: number;
  target: number; // tier to create for clear
  rack: { tier: number; x: number; y: number }[];
  queue: number[];
}

export class ModeController {
  mode: GameMode = MODES.startMode as GameMode;
  count = 0;
  stageIndex = 0;

  get isStage(): boolean {
    return this.mode === 'Stage';
  }

  // Current stage definition (clamped to the last defined level).
  get stageDef(): StageDef {
    const levels = MODES.stage.levels as StageDef[];
    return levels[Math.min(this.stageIndex, levels.length - 1)];
  }

  // Tier that clears the current stage (0 in Infinite — no target).
  get targetTier(): number {
    return this.isStage ? this.stageDef.target : 0;
  }

  setMode(m: GameMode) {
    this.mode = m;
  }

  // Set the count budget for a fresh session of the current mode.
  startSession() {
    this.count = this.isStage ? this.stageDef.count : MODES.infinite.startCount;
  }

  canFire(): boolean {
    return this.count > 0;
  }
  consume() {
    if (this.count > 0) this.count--;
  }
  addCount(n: number) {
    this.count += n;
  }

  // Advance to the next stage (clamped at the last defined level — placeholder has one).
  nextStage() {
    const last = (MODES.stage.levels as StageDef[]).length - 1;
    if (this.stageIndex < last) this.stageIndex++;
  }
}
