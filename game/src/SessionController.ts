import { RESULT } from './data/config';
import type { ModeController } from './modes/ModeController';
import type { Economy } from './Economy';
import type { PlanetSystem } from './PlanetSystem';
import type { ResultPopup } from './popups/ResultPopup';
import type { StageClearPopup, StageFailPopup } from './popups/StageEndPopup';

export type EndKind = 'result' | 'clear' | 'fail';

// GameScene exposes the phase machine + end-window plumbing to the controller; the controller triggers
// transitions by calling host.setPhase(...) so GameScene keeps setPhase as the single guarded transition
// point (audit D4) — same host-callback pattern as MergeOutcome/StageClearFx/Economy.
export interface SessionHost {
  phase(): string;                 // GameScene.phase
  isEnded(): boolean;              // GameScene.isEnded
  setPhase(to: 'pendingFail' | 'result' | 'stageClear' | 'stageFail'): void;
  endSkipOn(on: boolean): void;    // endSkip.eventMode = on ? 'static' : 'none'
  resultData(): { score: number; maxCombo: number; prevBest: number };
}

// End-of-session flow (docs/30-systems/launch-count): decides when a run ends and shows the matching
// end window. Stage arms a delayed fail window; Infinite ends once the count is gone and planets settle.
export class SessionController {
  private endAt = 0; // pendingFail 종료창 등장 예정 시각(performance.now 기준)

  constructor(
    private d: {
      modeC: ModeController;
      economy: Economy;
      planetSys: PlanetSystem;
      result: ResultPopup;
      stageClear: StageClearPopup;
      stageFail: StageFailPopup;
      host: SessionHost;
    },
  ) {}

  reset(): void { this.endAt = 0; } // called by startSession

  // End-of-session check (docs/30-systems/launch-count). Stage: arm the end window after a delay.
  // Infinite: end only once the count is gone AND every planet has settled (no fixed delay).
  check(): void {
    if (this.d.host.phase() !== 'playing') return;
    if (this.d.modeC.count > 0) return;
    if (this.d.modeC.isStage) {
      this.scheduleEnd();
      return;
    }
    if (this.d.planetSys.planets.some((p) => Math.hypot(p.body.velocity.x, p.body.velocity.y) > 0.6)) return;
    this.showEnd('result');
  }

  // Arm the Stage fail window after RESULT.endDelayMs (docs/50-art-ux/result-window); a screen tap skips
  // the delay (endSkip → showEnd). A target merged during the delay still wins via its own
  // clearing→stageClear path. Already armed (pendingFail) → don't re-arm.
  private scheduleEnd(): void {
    if (this.d.host.isEnded()) return;
    if (this.d.host.phase() === 'pendingFail') return;
    this.endAt = performance.now() + RESULT.endDelayMs;
    this.d.host.endSkipOn(true); // 지연 중 화면 탭 → 즉시 종료창(showEnd)
    this.d.host.setPhase('pendingFail');
  }

  // Show an end window — Stage after the armed delay (tickEnd), Infinite immediately on settle. The kind
  // ('result'|'clear'|'fail') maps to the first-class end phase (result|stageClear|stageFail).
  showEnd(kind: EndKind): void {
    if (this.d.host.isEnded()) return;
    this.d.host.endSkipOn(false);
    if (kind === 'result') {
      this.d.host.setPhase('result');
      const { score, maxCombo, prevBest } = this.d.host.resultData();
      this.d.result.show(score, maxCombo, score > prevBest);
    } else if (kind === 'clear') {
      this.d.host.setPhase('stageClear');
      this.d.economy.awardStageClear(); // 클리어 기록 + 코인 + 다음 스테이지 전진·영속 (economy rules)
      this.d.stageClear.open();
    } else if (kind === 'fail') {
      this.d.host.setPhase('stageFail');
      this.d.stageFail.open();
    }
  }

  // Stage 종료창 지연 등장: pendingFail 동안 예정 시각 도달 시 실패창을 띄운다.
  tickEnd(nowMs: number): void {
    if (this.d.host.phase() === 'pendingFail' && nowMs >= this.endAt) this.showEnd('fail');
  }
}
