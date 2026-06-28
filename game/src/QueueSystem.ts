import { QUEUE_SIZE } from './data/config';
import { randomQueueTier } from './data/planets';

// 3-slot launch queue. slot[0] = current (fires next). On fire: shift left, refill last
// slot from the low-5 uniform candidates (§5.3).
export class QueueSystem {
  private slots: number[] = [];

  constructor(private onChange: (slots: number[]) => void) {
    for (let i = 0; i < QUEUE_SIZE; i++) this.slots.push(randomQueueTier());
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
    this.slots.push(randomQueueTier());
    this.onChange(this.peek());
  }
}
