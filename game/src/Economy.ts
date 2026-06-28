import { MODES } from './data/config';
import type { MetaStore } from './MetaStore';
import type { ModeController } from './modes/ModeController';

// Economy/progression rules (docs/60-implementation/architecture · docs/30-systems/{stage-mode,planet-charge,launch-count}).
export class Economy {
  constructor(private meta: MetaStore, private modeC: ModeController, private syncCount: () => void) {}
  // syncCount = () => info.setCount(modeC.count)
  awardStageClear(): void {
    this.meta.markStageCleared(this.modeC.stageIndex);
    this.meta.addCoins(MODES.stage.clearReward);
    this.modeC.nextStage();
    this.meta.setStageProgress(this.modeC.stageIndex);
  }
  buyCharge(n: number): boolean {
    if (this.modeC.isStage) return false;
    const c = MODES.infinite.charge;
    const cost = (n / c.stepPlanets) * c.coinPer10;
    if (!this.meta.spendCoins(cost)) return false;
    this.modeC.addCount(n);
    this.syncCount();
    return true;
  }
  terminalMergeBonus(): void {
    this.modeC.addCount(MODES.infinite.blackHoleBonusCount);
    this.syncCount();
  }
}
