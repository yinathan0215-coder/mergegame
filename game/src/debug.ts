import type { GameScene } from './GameScene';
import { DESIGN, PLAY, LINE_Y, LAUNCHER, GAUGE, LAUNCH } from './data/config';
import { tierData, MAX_TIER } from './data/planets';
import type { GameMode } from './modes/ModeController';
import { eventLog } from './EventLog';

// Verification hooks (Playwright). Not part of the player-facing game.
export function exposeDebug(g: GameScene): void {
  const a = g as any;
  (window as any).__game = {
    scene: () => a.scene,
    transitioning: () => a.trans !== null, // true while the scene-fade overlay still captures input
    events: () => eventLog.recent(), // recent-event ring buffer (docs/30-systems/event-catalog §디버그)

    fgRect: () => {
      const s = Math.min(a.app.screen.width / DESIGN.w, a.app.screen.height / DESIGN.h);
      return { w: DESIGN.w * s, h: DESIGN.h * s }; // 전경(9:16) 화면 크기
    },
    startGame: (mode?: GameMode) => { if (mode) a.modeC.setMode(mode); a.setScene('PoolInGame'); },
    showTitle: () => a.setScene('Title'),
    skipLoad: () => { if (a.scene === 'Loading' && !a.trans) a.setScene('Title'); }, // 테스트용 로딩 floor 건너뛰기
    loadingActive: () => a.scene === 'Loading',
    unlockedTier: () => a.unlockedTier,
    unlockPending: () => a.paused,
    unlockModalScale: () => (a.unlockModal.container.parent as any)?.scale?.x ?? 0, // parent layer scale (contain sFg, not cover) — docs/50-art-ux/popup-system
    okUnlock: () => a.onUnlockOk(),
    unlockAll: () => {
      a.unlockedTier = MAX_TIER;
    },
    stats: () => ({ ...a.stats }),
    score: () => a.score.score,
    // game modes (docs/20-core-loop/game-modes)
    mode: () => a.modeC.mode,
    count: () => a.modeC.count,
    setCount: (n: number) => { a.modeC.count = n; a.info.setCount(n); },
    targetTier: () => a.modeC.targetTier,
    nextTier: () => a.queue.next(),
    maxCombo: () => a.maxCombo,
    bestScore: () => a.meta.bestScore,
    chargeBuy: (n: number) => a.buyCharge(n),
    resultShown: () => a.result.isOpen,
    gestureHintShown: () => a.gestureHint.container.visible,
    stageCleared: () => a.stageClear.isOpen,
    stageFailed: () => a.stageFail.isOpen,
    stageNo: () => a.modeC.stageIndex + 1, // 현재 플레이 스테이지 번호
    stageProgress: () => a.meta.stageProgress, // 영속 진행도(0-based)
    clearing: () => !!a.clearFly, // Stage 클리어 비행 연출 진행 중
    launcherLoaded: () => a.launcher.loaded, // 발사대에 대기 행성이 있는가
    comboValue: () => a.combo.value,
    comboBonusAwarded: () => a.lastComboBonus,
    planetCount: () => a.planets.length,
    queue: () => a.queue.peek(),
    tiersOnBoard: () => a.planets.map((p: any) => p.tier).sort((x: number, y: number) => x - y),
    snapshot: () =>
      a.planets.map((p: any) => ({
        tier: p.tier,
        x: p.body.position.x,
        y: p.body.position.y,
        speed: Math.hypot(p.body.velocity.x, p.body.velocity.y),
        inPlayArea: p.inPlayArea,
        inBoard:
          p.body.position.x > PLAY.x - 30 &&
          p.body.position.x < PLAY.x + PLAY.w + 30 &&
          p.body.position.y > PLAY.y - 30 &&
          p.body.position.y < LINE_Y + 90,
      })),
    lineY: () => LINE_Y,
    launcher: () => ({ x: LAUNCHER.x, y: LAUNCHER.y, r: LAUNCHER.r }),
    bounds: () => {
      const floorY = GAUGE.cy + GAUGE.r;
      return { x: PLAY.x, y: PLAY.y, w: PLAY.w, h: floorY - PLAY.y, lineY: floorY };
    },
    fire: (angleRad: number, power: number) => {
      a.cooldownUntil = 0;
      const speed = Math.max(0, Math.min(power, 1)) * LAUNCH.vMax;
      return a.fire(a.queue.current(), Math.cos(angleRad) * speed, Math.sin(angleRad) * speed);
    },
    clearBoard: () => {
      for (const p of [...a.planets]) a.removePlanet(p);
    },
    spawnPair: (tier: number) => {
      const now = performance.now() - 1000;
      const cx = PLAY.x + PLAY.w / 2;
      const cy = PLAY.y + PLAY.h * 0.5;
      const r = tierData(tier).radius;
      a.spawnPlanet(tier, cx - r - 1, cy, 5, 0, now, true);
      a.spawnPlanet(tier, cx + r + 1, cy, -5, 0, now, true);
    },
    // meta layer (coin wallet + missions + attendance + wheel) — docs/30-systems/meta-economy
    meta: () => ({ coins: a.meta.coins, completed: a.meta.completedCount(), attendanceDay: a.meta.attendanceDay, best: a.meta.bestScore, current: a.meta.currentScore }),
    metaMissions: () => a.meta.missionRows(),
    metaReset: () => a.meta.__reset(),
    metaAddCoins: (n: number) => a.meta.addCoins(n),
    openPopup: (kind: 'dailyMission' | 'attendance' | 'wheel' | 'shop') => a.metaUI.open(kind),
    openPopupKind: () => a.metaUI.openKind(),
    // in-game ≡ HUD dropdown (docs/50-art-ux/layout §2-c)
    hudMenuOpen: () => a.hud.menuIsOpen,
    hudMenuBurger: () => a.hud.toggleMenu(),
    hudMenuItemCount: () => a.hud.menuItemCount,
    hudMenuItem: (i: number) => a.hud.tapMenuItem(i),
    hudMenuOutside: () => a.hud.closeMenu(),
    claimAttendance: () => a.meta.claimAttendance(),
    claimMission: (id: string) => a.meta.claimMission(id),
    claimMilestone: (n: number) => a.meta.claimMilestone(n),
    wheelStart: () => a.metaUI.wheel.startSpin(),
    wheelStop: (i: number) => a.metaUI.wheel.stopOn(i),
    wheelWin: () => a.metaUI.wheel.lastWin,
  };
}
