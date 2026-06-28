import { SCORING } from './data/config';
import { tierData } from './data/planets';

// Score model (docs/30-systems/scoring-combo · 40-balancing/combo-scoring): every ball-ball
// collision adds a flat point; a merge adds the created tier's base score. NO combo (removed
// 2026-06-28 — ADR 40-balancing/decisions/2026-06-28-remove-combo).
export class ScoreSystem {
  score = 0;

  constructor(private onChange: (score: number) => void) {}

  // +1 per ball-ball collision (wall/line collisions are excluded by the caller).
  onCollision() {
    this.score += SCORING.collisionPoint;
    this.onChange(this.score);
  }

  // Merge → base score of the created tier (no multiplier). Returns the points gained.
  onMerge(tier: number): number {
    const pts = tierData(tier).score;
    this.score += pts;
    this.onChange(this.score);
    return pts;
  }
}
