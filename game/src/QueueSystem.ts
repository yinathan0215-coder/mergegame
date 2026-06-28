import { QUEUE_SIZE } from './data/config';
import { randomQueueTier } from './data/planets';

// Launch queue. slot[0] = current (fires next), slot[1] = Next (shown in the bottom-left HUD,
// docs/30-systems/launch-queue · launch-count). Infinite refills uniformly over tiers 1..maxTier()
// (unlock-gated). Stage plays a deterministic scripted sequence (docs/30-systems/stage-mode); when
// the script runs out it falls back to the random refill.
export class QueueSystem {
  private slots: number[] = [];
  private script: number[] | null = null;
  private sp = 0;

  constructor(private onChange: (slots: number[]) => void, private maxTier: () => number) {
    this.fill();
  }

  private nextTier(): number {
    if (this.script && this.sp < this.script.length) return this.script[this.sp++];
    return randomQueueTier(this.maxTier());
  }

  private fill() {
    this.slots = [];
    this.sp = 0;
    for (let i = 0; i < QUEUE_SIZE; i++) this.slots.push(this.nextTier());
    this.onChange(this.peek());
  }

  // Start a fresh session: null = Infinite random, array = Stage scripted sequence.
  reset(script: number[] | null) {
    this.script = script;
    this.fill();
  }

  current(): number {
    return this.slots[0];
  }

  // The upcoming planet (Next preview). Falls back to current if the queue is size 1.
  next(): number {
    return this.slots[1] ?? this.slots[0];
  }

  peek(): number[] {
    return [...this.slots];
  }

  shift() {
    this.slots.shift();
    this.slots.push(this.nextTier());
    this.onChange(this.peek());
  }
}
