import { SCORING } from './data/config';
import { tierData } from './data/planets';

// Score model (docs/30-systems/scoring-combo · 40-balancing/combo-scoring): a wall collision adds
// wallPoint, a ball-ball collision adds ballPoint, and a merge adds the created tier's base score.
export class ScoreSystem {
  score = 0;

  constructor(private onChange: (score: number) => void) {}

  // +wallPoint when a planet hits a boundary wall (inner line / launcher circle).
  onWallHit() {
    this.score += SCORING.wallPoint;
    this.onChange(this.score);
  }

  // +ballPoint when two planets collide (whether or not it triggers a merge).
  onBallHit() {
    this.score += SCORING.ballPoint;
    this.onChange(this.score);
  }

  // Merge → base score of the created tier. Returns the points gained.
  onMerge(tier: number): number {
    const pts = tierData(tier).score;
    this.score += pts;
    this.onChange(this.score);
    return pts;
  }

  // Combo milestone bonus (docs/30-systems/scoring-combo) — a large flat reward at every 5th combo.
  addBonus(pts: number) {
    this.score += pts;
    this.onChange(this.score);
  }
}
