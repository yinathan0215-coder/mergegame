// Recent-event debug ring buffer (DEV verification hook). Records the named events from the
// event catalog (docs/30-systems/event-catalog) so window.__game.events() can surface the
// recent Core-Loop communication flow. Recording only — never alters game logic.
export interface GameEvent { name: string; t: number; [k: string]: unknown; }

const buf: GameEvent[] = [];
const MAX = 60;

export const eventLog = {
  emit(name: string, payload: Record<string, unknown> = {}) {
    buf.push({ name, t: performance.now(), ...payload });
    if (buf.length > MAX) buf.shift();
  },
  recent(): GameEvent[] { return buf.slice(); },
};
