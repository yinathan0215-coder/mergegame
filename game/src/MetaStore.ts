import { ECONOMY, MISSIONS, ATTENDANCE } from './data/config';

// Single owner of meta-layer state — coin wallet + daily missions + attendance — with localStorage
// persistence and a KST (UTC+9) daily boundary (docs/30-systems/meta-economy). Mutations notify
// subscribers (Title coin pill + the open popup) so the UI stays in sync. Render code never writes
// these numbers directly; it calls the methods here.

const KST_OFFSET = 9 * 3600_000; // Korea Standard Time = UTC+9 (no DST)
const DAY_MS = 86_400_000;
const SAVE_KEY = 'ppm.meta.v1';

// KST calendar day of a wall-clock instant, as YYYY-MM-DD. Date-only logic (resets, "claimed today")
// keys off this string so it flips exactly at KST midnight regardless of the device's local zone.
export function kstDateStr(nowMs: number): string {
  return new Date(nowMs + KST_OFFSET).toISOString().slice(0, 10);
}
// ms remaining until the next KST midnight (for the attendance "다음 보상 시간" countdown).
export function msUntilNextKstMidnight(nowMs: number): number {
  return DAY_MS - ((nowMs + KST_OFFSET) % DAY_MS);
}

type MissionType = 'comboPeak' | 'mergeCount' | 'sunCount' | 'dummy';
interface MissionDef {
  id: string;
  type: MissionType;
  target: number;
  name: string;
}
const LIST = MISSIONS.list as MissionDef[];
const MILESTONES = Object.keys(MISSIONS.milestones).map(Number).sort((a, b) => a - b); // [2,5,8]

interface MetaState {
  coins: number;
  missions: {
    comboPeak: number;
    mergeCount: number;
    sunCount: number;
    claimed: string[]; // mission ids whose per-mission reward (보상 버튼) has been claimed
    claimedMilestones: number[]; // milestone thresholds already claimed (2/5/8)
    resetDate: string; // KST day this mission set belongs to
  };
  attendance: {
    day: number; // next day to claim, 1..7
    lastClaimDate: string; // KST day of the last claim ('' = never)
  };
}

function freshMissions(date: string): MetaState['missions'] {
  return { comboPeak: 0, mergeCount: 0, sunCount: 0, claimed: [], claimedMilestones: [], resetDate: date };
}

export class MetaStore {
  private s: MetaState;
  private listeners = new Set<() => void>();

  constructor() {
    const today = kstDateStr(Date.now());
    this.s = this.load() ?? {
      coins: ECONOMY.startCoins,
      missions: freshMissions(today),
      attendance: { day: 1, lastClaimDate: '' },
    };
    this.rollover(today);
  }

  // ── subscription ───────────────────────────────────────────────────────────
  subscribe(fn: () => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }
  private changed() {
    this.save();
    for (const fn of this.listeners) fn();
  }

  // ── coins ──────────────────────────────────────────────────────────────────
  get coins(): number {
    return this.s.coins;
  }
  addCoins(n: number) {
    this.s.coins += n;
    this.changed();
  }
  /** spend n coins; returns false (no change) if the balance is insufficient. */
  spendCoins(n: number): boolean {
    if (this.s.coins < n) return false;
    this.s.coins -= n;
    this.changed();
    return true;
  }

  // ── daily missions ─────────────────────────────────────────────────────────
  private rollover(today: string) {
    if (this.s.missions.resetDate !== today) this.s.missions = freshMissions(today);
  }
  private missionDone(m: MissionDef): boolean {
    const mp = this.s.missions;
    if (m.type === 'comboPeak') return mp.comboPeak >= m.target;
    if (m.type === 'mergeCount') return mp.mergeCount >= m.target;
    if (m.type === 'sunCount') return mp.sunCount >= m.target;
    return false; // dummy (광고 보기) never completes
  }
  /** Claim a single mission's per-mission reward (보상 버튼). No-op unless done and unclaimed. */
  claimMission(id: string): boolean {
    this.rollover(kstDateStr(Date.now()));
    const m = LIST.find((x) => x.id === id);
    if (!m || !this.missionDone(m) || this.s.missions.claimed.includes(id)) return false;
    this.s.missions.claimed.push(id);
    this.s.coins += MISSIONS.perMission;
    this.changed();
    return true;
  }

  /** Gameplay report from a single merge (docs/30-systems/meta-economy "게임플레이 → 미션 보고"). */
  onMerge(comboValue: number, isSun: boolean) {
    this.rollover(kstDateStr(Date.now()));
    const mp = this.s.missions;
    mp.mergeCount += 1;
    mp.comboPeak = Math.max(mp.comboPeak, comboValue);
    if (isSun) mp.sunCount += 1;
    this.changed();
  }

  /** Per-mission view for the popup: current progress, target, done flag, in list order. */
  missionRows() {
    this.rollover(kstDateStr(Date.now()));
    const mp = this.s.missions;
    const progressOf = (m: MissionDef): number =>
      m.type === 'comboPeak' ? mp.comboPeak : m.type === 'mergeCount' ? mp.mergeCount : m.type === 'sunCount' ? mp.sunCount : 0;
    return LIST.map((m) => ({ id: m.id, name: m.name, type: m.type, target: m.target, progress: Math.min(progressOf(m), m.target), done: this.missionDone(m), claimed: this.s.missions.claimed.includes(m.id) }));
  }
  /** Number of completed missions (drives the cumulative reward bar position). */
  completedCount(): number {
    this.rollover(kstDateStr(Date.now()));
    return LIST.filter((m) => this.missionDone(m)).length;
  }
  /** Milestone view: threshold, reward, reached, claimed. */
  milestoneRows() {
    const done = this.completedCount();
    const claimed = this.s.missions.claimedMilestones;
    return MILESTONES.map((th) => ({
      threshold: th,
      reward: (MISSIONS.milestones as Record<string, number>)[String(th)],
      reached: done >= th,
      claimed: claimed.includes(th),
    }));
  }
  /** Claim a cumulative milestone (받기). No-op unless reached and unclaimed. */
  claimMilestone(threshold: number): boolean {
    if (this.completedCount() < threshold || this.s.missions.claimedMilestones.includes(threshold)) return false;
    this.s.missions.claimedMilestones.push(threshold);
    this.s.coins += (MISSIONS.milestones as Record<string, number>)[String(threshold)];
    this.changed();
    return true;
  }

  // ── attendance ─────────────────────────────────────────────────────────────
  /** Can the player claim today's attendance reward? (once per KST day) */
  attendanceCanClaim(): boolean {
    return this.s.attendance.lastClaimDate !== kstDateStr(Date.now());
  }
  get attendanceDay(): number {
    return this.s.attendance.day;
  }
  attendanceRewards(): number[] {
    return ATTENDANCE.rewards;
  }
  /** Claim today's reward; advances the streak day (7→1 wrap). Returns coins granted, or 0. */
  claimAttendance(): number {
    if (!this.attendanceCanClaim()) return 0;
    const day = this.s.attendance.day;
    const reward = ATTENDANCE.rewards[day - 1];
    this.s.attendance.lastClaimDate = kstDateStr(Date.now());
    this.s.attendance.day = (day % ATTENDANCE.rewards.length) + 1;
    this.s.coins += reward;
    this.changed();
    return reward;
  }

  // ── persistence ────────────────────────────────────────────────────────────
  // Load + NORMALISE. A save written by an older build can be missing fields (e.g. before per-mission
  // `claimed` replaced `granted`), so every field is filled from defaults here — a stale save must never
  // crash missionRows()/claim*(). Coins/progress are preserved; only the shape is repaired.
  private load(): MetaState | null {
    let p: { coins?: unknown; missions?: Record<string, unknown>; attendance?: Record<string, unknown> };
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return null;
      p = JSON.parse(raw);
    } catch {
      return null; // private/blocked/corrupt storage → run from defaults
    }
    const m = p.missions ?? {};
    const a = p.attendance ?? {};
    return {
      coins: typeof p.coins === 'number' ? p.coins : ECONOMY.startCoins,
      missions: {
        comboPeak: typeof m.comboPeak === 'number' ? m.comboPeak : 0,
        mergeCount: typeof m.mergeCount === 'number' ? m.mergeCount : 0,
        sunCount: typeof m.sunCount === 'number' ? m.sunCount : 0,
        claimed: Array.isArray(m.claimed) ? (m.claimed as string[]) : [],
        claimedMilestones: Array.isArray(m.claimedMilestones) ? (m.claimedMilestones as number[]) : [],
        resetDate: typeof m.resetDate === 'string' ? m.resetDate : kstDateStr(Date.now()),
      },
      attendance: {
        day: typeof a.day === 'number' ? a.day : 1,
        lastClaimDate: typeof a.lastClaimDate === 'string' ? a.lastClaimDate : '',
      },
    };
  }
  private save() {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(this.s));
    } catch {
      /* ignore — keep going from memory */
    }
  }

  /** Test/verification hook only. */
  __reset() {
    localStorage.removeItem(SAVE_KEY);
    this.s = { coins: ECONOMY.startCoins, missions: freshMissions(kstDateStr(Date.now())), attendance: { day: 1, lastClaimDate: '' } };
    this.changed();
  }
}
