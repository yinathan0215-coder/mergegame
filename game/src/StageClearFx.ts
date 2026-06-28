import { Container } from 'pixi.js';
import { makePlanetSprite } from './PlanetFactory';
import { tierData } from './data/planets';
import { sound } from './SoundManager';
import type { Planet } from './Planet';

// Stage clear animation (docs/30-systems/stage-mode §클리어): the just-made target planet is removed
// from the board and a render-only sprite arcs to the bottom-right target UI, where it bursts and
// vanishes (no real merge); the clear window opens once the animation finishes. This module owns the
// animation run + its sprite lifecycle; GameScene drives firing/physics freeze via its phase machine.
export interface ClearFxHost {
  removePlanet(p: Planet): void;
  clearChamber(): void;                  // launcher.clearChamber()
  targetPos(): { x: number; y: number }; // info.targetPos()
  burst(x: number, y: number, color: number, r: number): void; // effects.mergeBurst
  onComplete(): void;                    // GameScene → showEnd('clear')
}

export class StageClearFx {
  private run: { sprite: Container | null; phase: 'fly' | 'burst'; t0: number; from: { x: number; y: number }; to: { x: number; y: number }; r0: number; tier: number } | null = null;

  constructor(private layer: Container, private host: ClearFxHost) {}

  get active(): boolean { return this.run !== null; }

  // Begin the fly: target planet removed from the board, launcher chamber emptied, a render-only
  // sprite spawned at the merge spot to arc toward the target UI.
  start(tier: number, x: number, y: number, planet: Planet, now: number): void {
    if (this.run) return;
    this.host.removePlanet(planet); // 목표 행성은 보드에서 제거 — 실제 합성이 아니라 연출 스프라이트가 날아간다
    this.host.clearChamber(); // 발사대 비움(추가 발사 정지는 fire()가 phase로 차단)
    const sprite = makePlanetSprite(tier); // scale 1 = 보드 크기(diameter = radius*2)
    sprite.x = x;
    sprite.y = y;
    this.layer.addChild(sprite);
    this.run = { sprite, phase: 'fly', t0: now, from: { x, y }, to: this.host.targetPos(), r0: tierData(tier).radius, tier };
    sound.play('merge', { pitch: 1.5 });
  }

  // Drive the clear animation each frame; on completion notify the host (→ clear window).
  update(now: number): void {
    const cf = this.run;
    if (!cf) return;
    if (cf.phase === 'fly') {
      const k = Math.min(1, (now - cf.t0) / 650);
      const e = k < 0.5 ? 2 * k * k : 1 - ((-2 * k + 2) ** 2) / 2; // easeInOutQuad
      const endScale = 44 / (cf.r0 * 2); // 목표 UI 행성 크기(44px, GameInfoPanel)
      if (cf.sprite) {
        cf.sprite.x = cf.from.x + (cf.to.x - cf.from.x) * e;
        cf.sprite.y = cf.from.y + (cf.to.y - cf.from.y) * e - 90 * Math.sin(Math.PI * e); // 위로 솟는 포물선
        cf.sprite.rotation = now * 0.02;
        cf.sprite.scale.set(1 + (endScale - 1) * e);
      }
      if (k >= 1) {
        this.host.burst(cf.to.x, cf.to.y, tierData(cf.tier).colors[0], cf.r0); // 합쳐지는 이펙트
        sound.play('merge', { pitch: 1.7 });
        if (cf.sprite) { this.layer.removeChild(cf.sprite); cf.sprite.destroy({ children: true }); cf.sprite = null; }
        cf.phase = 'burst';
        cf.t0 = now;
      }
    } else if (now - cf.t0 >= 300) { // 버스트가 잠깐 보인 뒤 클리어창
      this.run = null;
      this.host.onComplete();
    }
  }

  // Tear down any in-flight clear animation sprite (new session / cleanup).
  clear(): void {
    if (this.run?.sprite) { this.layer.removeChild(this.run.sprite); this.run.sprite.destroy({ children: true }); }
    this.run = null;
  }
}
