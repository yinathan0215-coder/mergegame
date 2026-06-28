import { PLAY } from './data/config';
import { INITIAL_RACK, tierData } from './data/planets';
import type { PlanetSystem } from './PlanetSystem';

// Builds a session's starting board ("rack") by computing PLAY-relative spawn positions and asking the
// PlanetSystem to spawn each planet. Extracted from the GameScene orchestrator (methodology-audit D2/D5):
// pure spawn-geometry, no flow/state. Positions form the "shape"; physics settles them.
export class RackBuilder {
  constructor(private planets: PlanetSystem) {}

  buildInitial(): void {
    const cx = PLAY.x + PLAY.w / 2;
    const cy = PLAY.y + PLAY.h * 0.36;
    const spacing = 58;
    const rowGap = 56;
    const rows = INITIAL_RACK.map(({ tier, count }) => Array<number>(count).fill(tier));
    const born = performance.now() - 1000;
    rows.forEach((row, ri) => {
      const y = cy + (ri - 1.5) * rowGap;
      row.forEach((tier, ci) => {
        const x = cx + (ci - (row.length - 1) / 2) * spacing;
        this.planets.spawn(tier, x, y, 0, 0, born, true);
      });
    });
  }

  // Stage rack: lay out the stage's composition ({tier,count}) as one centred row per tier, stacked
  // top→down with tier-aware spacing so big planets never spawn overlapping (docs/30-systems/stage-mode ·
  // 40-balancing/stage-balance). Positions form the "shape"; physics settles them.
  buildStage(rack: { tier: number; count: number }[]): void {
    const born = performance.now() - 1000;
    const cx = PLAY.x + PLAY.w / 2;
    let y = PLAY.y + PLAY.h * 0.22;
    for (const r of rack) {
      const rad = tierData(r.tier).radius;
      const want = 2 * rad + 6; // spacing that avoids spawn overlap
      const maxW = PLAY.w - 2 * rad - 8;
      const spacing = r.count > 1 && (r.count - 1) * want > maxW ? maxW / (r.count - 1) : want;
      for (let ci = 0; ci < r.count; ci++) {
        const x = cx + (ci - (r.count - 1) / 2) * spacing;
        this.planets.spawn(r.tier, x, y, 0, 0, born, true);
      }
      y += 2 * rad + 10; // next row below, spaced by this row's planet size
    }
  }
}
