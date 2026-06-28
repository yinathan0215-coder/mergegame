import { QUEUE_SIZE } from './data/config';
import { randomQueueTier } from './data/planets';

// Launch queue. slot[0] = current (fires next). Refill is uniform over tiers 1..maxTier(), the
// unlock-gated range (docs/30-systems/launch-queue · tier-unlock).
export class QueueSystem {
  private slots: number[] = [];

  constructor(private onChange: (slots: number[]) => void, private maxTier: () => number) {
    for (let i = 0; i < QUEUE_SIZE; i++) this.slots.push(randomQueueTier(this.maxTier()));
    this.onChange(this.peek());
  }

  current(): number {
    return this.slots[0];
  }

  peek(): number[] {
    return [...this.slots];
  }

  shift() {
    this.slots.shift();
    this.slots.push(randomQueueTier(this.maxTier()));
    this.onChange(this.peek());
  }
}
