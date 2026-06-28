import { LAUNCHER, LAUNCH } from './data/config';
import { tierData } from './data/planets';
import { sound } from './SoundManager';
import { eventLog } from './EventLog';
import type { PlanetSystem } from './PlanetSystem';
import type { QueueSystem } from './QueueSystem';
import type { ModeController } from './modes/ModeController';

// Launch execution (the act of firing a planet) extracted from the GameScene orchestrator (audit D2).
// Owns the per-shot cooldown gate + spawn-point geometry; the host supplies the play-gate, stat/HUD
// side effects, and the first-gesture flag so the controller stays free of scene/phase state.
export interface LaunchHost {
  canFire(): boolean;        // this.scene === 'PoolInGame' && this.phase === 'playing'
  bumpShots(): void;         // this.stats.shots++
  onFired(): void;           // this.gestureDone = true
  syncCount(): void;         // this.info.setCount(this.modeC.count)
}

export class LaunchController {
  private cooldownUntil = 0;
  constructor(private d: { planets: PlanetSystem; queue: QueueSystem; modeC: ModeController; host: LaunchHost }) {}

  resetCooldown(): void { this.cooldownUntil = 0; } // debug fire hook

  fire(tier: number, vx: number, vy: number): boolean {
    if (!this.d.host.canFire()) return false;
    if (!this.d.modeC.canFire()) return false; // 카운트 소진 → 발사 불가 (docs/30-systems/launch-count)
    const now = performance.now();
    if (now < this.cooldownUntil) return false;
    this.cooldownUntil = now + LAUNCH.cooldownMs;
    // spawn just OUTSIDE the launcher circle, along the fire direction, so the ball never starts
    // inside the collision pocket (no spin-in-pocket). collidesLauncher=false → it clears cleanly.
    const r = tierData(tier).radius;
    const sp = LAUNCHER.r + r + 1;
    const spd = Math.hypot(vx, vy) || 1;
    const sx = LAUNCHER.x + (vx / spd) * sp;
    const sy = LAUNCHER.y + (vy / spd) * sp;
    // bornAt in the past → a launched ball merges on its FIRST collision (the re-merge delay is
    // only for freshly MERGED balls — docs/30-systems/merge-rules).
    this.d.planets.spawn(tier, sx, sy, vx, vy, now - 1000, false);
    this.d.queue.shift();
    this.d.host.bumpShots();
    this.d.modeC.consume(); // 카운트 -1 (docs/30-systems/launch-count)
    this.d.host.syncCount();
    this.d.host.onFired(); // 첫 발사 → 손가락 코치 종료(docs/50-art-ux/input-ux)
    sound.play('launch', { pitch: 0.85 + Math.min(1, Math.hypot(vx, vy) / LAUNCH.vMax) * 0.5 }); // 파워↑ → 피치↑
    eventLog.emit('FIRE', { tier });
    return true;
  }
}
