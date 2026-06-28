import type { Body } from 'matter-js';
import type { Container } from 'pixi.js';

// ECS-lite entity: (Matter body, authoritative) + (tier data) + (Pixi sprite, read-only render).
export interface Planet {
  id: number;
  tier: number;
  body: Body;
  sprite: Container;
  bornAt: number; // ms — for re-merge delay AND the merge-spawn pop animation clock
  merging: boolean; // merge lock (one merge per tick per planet)
  inPlayArea: boolean; // true once it has fully entered the play area (one-way line then blocks return)
  popMs?: number; // >0 → play the merge spawn pop (small→big→settle) for this many ms from bornAt
}
