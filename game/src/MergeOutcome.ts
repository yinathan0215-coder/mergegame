import type { Body } from 'matter-js';
import { SCORING } from './data/config';
import { tierData, SUN_TIER, MAX_TIER } from './data/planets';
import { sound } from './SoundManager';
import { eventLog } from './EventLog';
import type { ScoreSystem } from './ScoreSystem';
import type { Combo } from './Combo';
import type { Effects } from './Effects';
import type { MetaStore } from './MetaStore';
import type { MergeSystem } from './MergeSystem';
import type { ModeController } from './modes/ModeController';
import type { PlanetSystem } from './PlanetSystem';
import type { Economy } from './Economy';
import type { Planet } from './Planet';

// Host = the GameScene-owned FLOW/STATE the reward rules defer to. MergeOutcome owns the REWARD
// fan-out (score / combo / juice / sound / meta missions); the host owns the phase machine, the
// unlock modal, the stage-clear trigger and the session stats — so a created tier can win a stage
// or open the unlock modal without MergeOutcome knowing how those work.
export interface MergeOutcomeHost {
  bumpStats(tier: number): void;            // stats.merges++, maxTier, sunReached
  trackCombo(comboValue: number): void;     // session combo peak (Infinite result)
  setComboBonus(bonus: number): void;       // most recent combo milestone bonus (verification hook)
  canStageClear(): boolean;                 // phase 'playing'|'pendingEnd' && stage not already cleared
  triggerStageClear(tier: number, x: number, y: number, planet: Planet): void; // clearFx.start + phase='clearing'
  canUnlock(): boolean;                     // phase === 'playing'
  triggerUnlock(tier: number): void;        // pendingUnlockTier/phase/bonus/addCount/info/unlockModal/sound
  unlockedTier(): number;                   // highest tier merges may currently create
}

interface MergeOutcomeDeps {
  score: ScoreSystem;
  combo: Combo;
  effects: Effects;
  meta: MetaStore;
  merge: MergeSystem;
  modeC: ModeController;
  planetSys: PlanetSystem;
  economy: Economy;
  host: MergeOutcomeHost;
}

// Merge reward fan-out + collision scoring, extracted out of the GameScene orchestrator
// (methodology-audit D2/D5). Pure reward rules: what a merge / collision is worth and the juice it
// fires. Flow control (modal, stage-clear, phase) lives in GameScene and is reached via the host.
export class MergeOutcome {
  constructor(private d: MergeOutcomeDeps) {}

  // A merge created tier `t` at (x,y). `now` = performance.now() (combo timer anchor).
  onMerge(tier: number, x: number, y: number, planet: Planet, now: number): void {
    eventLog.emit('ITEM_MERGED', { tier });
    this.d.host.bumpStats(tier);
    const d = tierData(tier);
    this.d.effects.mergeBurst(x, y, d.colors[0], d.radius); // 발산 버스트(모드 공통 juice)
    sound.play('merge', { pitch: 1 + (tier - 1) * 0.05 }); // 생성 등급↑ → 피치↑ (docs/50-art-ux/sound-design)
    // Stage는 점수·콤보를 집계/표시하지 않는다 (docs/30-systems/stage-mode §인게임 상단 표시)
    if (!this.d.modeC.isStage) {
      const pts = this.d.score.onMerge(tier);
      this.d.effects.scorePopup(pts, x, y); // +N at the merge location
      const comboBonus = this.d.combo.onMerge(now); // chain counter; returns milestone bonus
      if (comboBonus > 0) {
        eventLog.emit('COMBO_MILESTONE', { bonus: comboBonus });
        this.d.score.addBonus(comboBonus); // combo 5/10/15… milestone → large bonus score
        this.d.effects.comboBonus(comboBonus, this.d.combo.value); // "+N(combo M)" at screen centre
        this.d.host.setComboBonus(comboBonus);
        sound.play('comboMilestone');
      }
    }
    this.d.meta.onMerge(this.d.combo.value, tier === SUN_TIER); // daily missions: merge count / combo peak / sun
    this.d.host.trackCombo(this.d.combo.value); // session combo peak (Infinite result)
    // Stage clear: created the target tier (docs/30-systems/stage-mode) — launches the fly-to-target
    // animation (which then opens the clear window). Already-cleared stage: no reward → falls through.
    if (this.d.modeC.isStage && this.d.host.canStageClear() && tier >= this.d.modeC.targetTier) {
      this.d.host.triggerStageClear(tier, x, y, planet);
      return;
    }
    // first time a NEW tier is created → unlock modal + pause (docs/30-systems/tier-unlock).
    // Infinite only — Stage starts fully unlocked and never shows the modal (docs/30-systems/stage-mode).
    if (!this.d.modeC.isStage && this.d.host.canUnlock() && tier > this.d.host.unlockedTier()) {
      this.d.host.triggerUnlock(tier);
    }
  }

  // A physics collisionStart between bodies a/b (impact = closing speed along the normal;
  // (cx,cy)=contact point; (bx,by)=unit bounce dir). Queues same-tier merges and scores real bounces.
  onCollision(a: Body, b: Body, impact: number, cx: number, cy: number, bx: number, by: number): void {
    const aP = a.label === 'planet';
    const bP = b.label === 'planet';
    if (aP && bP) {
      this.d.merge.queuePair(a, b); // 머지 큐잉은 impact와 무관(동급 접촉 시)
      if (impact >= SCORING.minImpact) {
        eventLog.emit('COLLISION', { impact });
        if (!this.d.modeC.isStage) this.d.score.onBallHit(); // 행성–행성 충돌 +3 (Stage 미집계)
        this.d.effects.hitBurst(cx, cy, bx, by);
        sound.play('ballHit'); // 다발 충돌은 throttle로 솎임 (docs/50-art-ux/sound-design)
      }
    } else if (aP || bP) {
      if (impact >= SCORING.minImpact) {
        eventLog.emit('COLLISION', { impact });
        if (!this.d.modeC.isStage) this.d.score.onWallHit(); // 벽(inner line)·발사대 원 충돌 +1 (Stage 미집계)
        this.d.effects.hitBurst(cx, cy, bx, by);
        sound.play('wall');
      }
    }
  }

  // Black hole + black hole (Infinite only): consume both for +blackHoleBonusCount count, no spawn
  // (ADR docs/30-systems/decisions/2026-06-28-blackhole-infinite-count). Other modes: no merge.
  onTerminalMerge(pa: Planet, pb: Planet): boolean {
    if (this.d.modeC.mode !== 'Infinite') return false;
    const x = (pa.body.position.x + pb.body.position.x) / 2;
    const y = (pa.body.position.y + pb.body.position.y) / 2;
    this.d.planetSys.remove(pa);
    this.d.planetSys.remove(pb);
    this.d.economy.terminalMergeBonus(); // Infinite 카운트 +blackHoleBonusCount (economy rules)
    const d = tierData(MAX_TIER);
    this.d.effects.mergeBurst(x, y, d.colors[0], d.radius);
    sound.play('merge', { pitch: 0.55 });
    eventLog.emit('TERMINAL_MERGE', {});
    return true;
  }
}
