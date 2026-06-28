// Planet ladder + queue/rack loader. SINGLE SOURCE OF TRUTH = ./balance.json (edit there).
//   order → docs/10-concept, radius/score → docs/40-balancing, colour/pattern → docs/50-art-ux.
// This file declares NO balance literals — it loads, parses, validates, and types the JSON.
import balance from './balance.json';

export type PatternKind =
  | 'crater'
  | 'craterDark'
  | 'dots'
  | 'earth'
  | 'waves'
  | 'stripesLight'
  | 'ring'
  | 'bigStripes'
  | 'sun';

export interface PlanetTier {
  tier: number; // 1..9
  name: string;
  radius: number; // px (40-balancing §1)
  score: number; // base score when CREATED by merge; 0 for 수성 (never a merge result)
  colors: number[]; // [main, accent] (50-art-ux §4)
  pattern: PatternKind;
}

const hex = (s: string): number => parseInt(s.replace('#', ''), 16);

export const TIERS: PlanetTier[] = balance.planets.map((p) => ({
  tier: p.tier,
  name: p.name,
  radius: p.radius,
  score: p.score,
  colors: p.colors.map(hex),
  pattern: p.pattern as PatternKind,
}));

// Integrity guards — give the balance-tuner immediate feedback on a malformed edit.
if (TIERS.length !== 9) {
  throw new Error(`balance.json: expected 9 planet tiers, got ${TIERS.length}`);
}
TIERS.forEach((t, i) => {
  if (t.tier !== i + 1) throw new Error(`balance.json: planets[${i}].tier must be ${i + 1}, got ${t.tier}`);
});

export const MAX_TIER = TIERS.length; // 9 (태양, terminal)

export function tierData(tier: number): PlanetTier {
  return TIERS[tier - 1];
}

// Queue refill candidates: low 5 (수성..해왕성), each uniform (§5.3 / 40-balancing §3).
export const QUEUE_CANDIDATES: number[] = balance.queue.candidates;

export function randomQueueTier(): number {
  return QUEUE_CANDIDATES[Math.floor(Math.random() * QUEUE_CANDIDATES.length)];
}

// Initial rack composition (§5.1 / 40-balancing §4): 수성4·화성3·금성2·지구1 = 10.
export const INITIAL_RACK: { tier: number; count: number }[] = balance.rack;
