import { test, expect, type Page } from '@playwright/test';

// Verifies docs/70-verification KPI + 완료 체크리스트 against the running prototype.
// Game exposes a debug API on window.__game (see GameScene.exposeDebug).

declare global {
  interface Window {
    __game: {
      scene: () => 'Title' | 'PoolInGame';
      transitioning: () => boolean;
      startGame: (mode?: 'Infinite' | 'Stage') => void;
      showTitle: () => void;
      unlockedTier: () => number;
      unlockPending: () => boolean;
      unlockModalScale: () => number;
      okUnlock: () => void;
      stats: () => { shots: number; merges: number; maxTier: number; sunReached: boolean };
      score: () => number;
      mode: () => 'Infinite' | 'Stage';
      count: () => number;
      setCount: (n: number) => void;
      targetTier: () => number;
      nextTier: () => number;
      maxCombo: () => number;
      bestScore: () => number;
      chargeBuy: (n: number) => boolean;
      resultShown: () => boolean;
      stageCleared: () => boolean;
      stageFailed: () => boolean;
      stageNo: () => number;
      stageProgress: () => number;
      clearing: () => boolean;
      launcherLoaded: () => boolean;
      planetCount: () => number;
      queue: () => number[];
      tiersOnBoard: () => number[];
      snapshot: () => { tier: number; x: number; y: number; speed: number; inBoard: boolean; inPlayArea: boolean }[];
      lineY: () => number;
      launcher: () => { x: number; y: number; r: number };
      bounds: () => { x: number; y: number; w: number; h: number; lineY: number };
      fire: (angleRad: number, power: number) => boolean;
      spawnPair: (tier: number) => void;
      clearBoard: () => void;
      comboValue: () => number;
      comboBonusAwarded: () => number;
      unlockAll: () => void;
      // meta layer (docs/30-systems/meta-economy)
      meta: () => { coins: number; completed: number; attendanceDay: number; best: number; current: number };
      metaMissions: () => { id: string; name: string; type: string; target: number; progress: number; done: boolean; claimed: boolean }[];
      metaReset: () => void;
      metaAddCoins: (n: number) => void;
      openPopup: (kind: 'dailyMission' | 'attendance' | 'wheel' | 'shop') => void;
      openPopupKind: () => 'dailyMission' | 'attendance' | 'wheel' | 'shop' | null;
      hudMenuOpen: () => boolean;
      hudMenuBurger: () => void;
      hudMenuItemCount: () => number;
      hudMenuItem: (i: number) => void;
      hudMenuOutside: () => void;
      claimAttendance: () => number;
      claimMission: (id: string) => boolean;
      claimMilestone: (n: number) => boolean;
      wheelStart: () => boolean;
      wheelStop: (i: number) => void;
      wheelWin: () => number;
    };
  }
}

// Seed a (non-fresh) save before boot so the app lands on Title — a truly empty localStorage is
// treated as first-run and skips Title straight into Stage 1 (docs/20-core-loop/screen-flow §최초 실행).
// Only seeds when absent so a test that writes its own save and reloads (persistence tests) isn't clobbered.
async function seedSave(page: Page) {
  await page.addInitScript(() => {
    if (!localStorage.getItem('ppm.meta.v1')) localStorage.setItem('ppm.meta.v1', JSON.stringify({ coins: 0 }));
  });
}

async function ready(page: Page) {
  await seedSave(page);
  await page.goto('/');
  await page.waitForFunction(() => !!window.__game && window.__game.scene() === 'Title', null, {
    timeout: 15000,
  });
  await page.evaluate(() => window.__game.startGame('Infinite'));
  await page.waitForFunction(() => window.__game.scene() === 'PoolInGame' && window.__game.planetCount() > 0, null, {
    timeout: 15000,
  });
  // wait out the scene-fade overlay (still captures pointer input) so real-pointer clicks land
  await page.waitForFunction(() => !window.__game.transitioning(), null, { timeout: 5000 });
}

test('초기 상태: 중앙 랙 10 + 발사대(현재 행성), 군더더기 UI 없음', async ({ page }) => {
  await ready(page);
  expect(await page.evaluate(() => window.__game.planetCount())).toBe(10);
  const q = await page.evaluate(() => window.__game.queue());
  expect(q.length).toBe(2); // 현재 + Next 미리보기 (docs/30-systems/launch-queue)
  expect(q[0]).toBeGreaterThanOrEqual(1);
  expect(q[0]).toBeLessThanOrEqual(5);
  expect(await page.locator('canvas').count()).toBe(1);
  // 포켓/Shake/Change Ball/광고 보상 = DOM 컨트롤 없음
  expect(await page.locator('button').count()).toBe(0);
});

test('전경(인게임/UI) 9:16 비율 유지 (UI 겹침 방지 기준)', async ({ page }) => {
  await ready(page);
  // 캔버스는 뷰포트 크기(배경 cover 채움). 전경(contain 9:16)은 fgRect로 검증.
  const fg = await page.evaluate(() => (window as any).__game.fgRect());
  const ratio = fg.w / fg.h;
  expect(Math.abs(ratio - 450 / 800)).toBeLessThan(0.02);
});

test('발사 후 발사대에 새 행성이 로드된다 (현재 + Next 미리보기)', async ({ page }) => {
  await ready(page);
  const shots0 = await page.evaluate(() => window.__game.stats().shots);
  await page.evaluate(() => window.__game.fire(-Math.PI / 2, 0.9));
  const q = await page.evaluate(() => window.__game.queue());
  expect(q.length).toBe(2);
  expect(q[0]).toBeGreaterThanOrEqual(1);
  expect(q[0]).toBeLessThanOrEqual(5); // 낮은 5종 랜덤
  expect(await page.evaluate(() => window.__game.stats().shots)).toBe(shots0 + 1);
});

test('동급 충돌 → 다음 등급 합성(100%) + 점수 증가 + 충돌 방향 이동', async ({ page }) => {
  await ready(page);
  await page.evaluate(() => window.__game.clearBoard()); // 격리: 랙 간섭 제거
  const score0 = await page.evaluate(() => window.__game.score());
  const merges0 = await page.evaluate(() => window.__game.stats().merges);
  await page.evaluate(() => window.__game.spawnPair(5));
  await page.waitForFunction((m) => window.__game.stats().merges > m, merges0, { timeout: 5000 });
  const tiers = await page.evaluate(() => window.__game.tiersOnBoard());
  expect(tiers).toContain(6);
  expect(await page.evaluate(() => window.__game.score())).toBeGreaterThan(score0);
  const t6 = (await page.evaluate(() => window.__game.snapshot())).find((p) => p.tier === 6);
  expect(t6).toBeTruthy();
  expect(t6!.speed).toBeGreaterThan(0.5); // 제자리 정지 방지 — 최소 속도
});

test('첫 해금: 잠긴 등급(해왕성) 머지 → 해금 팝업·일시정지 → OK로 해금', async ({ page }) => {
  await ready(page);
  await page.evaluate(() => window.__game.clearBoard()); // 랙 격리
  expect(await page.evaluate(() => window.__game.unlockedTier())).toBe(5);
  await page.evaluate(() => window.__game.spawnPair(5));
  await page.waitForFunction(() => window.__game.unlockPending(), null, { timeout: 5000 });
  expect(await page.evaluate(() => window.__game.tiersOnBoard())).toContain(6);
  // 일시정지(물리·입력 정지) 중에는 발사 불가
  expect(await page.evaluate(() => window.__game.fire(-Math.PI / 2, 0.9))).toBe(false);
  // OK → 해왕성(6) 해금 + 게임 재개
  await page.evaluate(() => window.__game.okUnlock());
  expect(await page.evaluate(() => window.__game.unlockPending())).toBe(false);
  expect(await page.evaluate(() => window.__game.unlockedTier())).toBe(6);
});

test('해금 모달: 와이드(웹 16:9)에서도 콘텐츠가 정상 크기(contain 스케일, cover 아님)', async ({ page }) => {
  await page.setViewportSize({ width: 1600, height: 900 }); // 16:9 와이드 웹
  await ready(page);
  await page.evaluate(() => window.__game.clearBoard());
  await page.evaluate(() => window.__game.spawnPair(5)); // 지구+지구 → 6단계(해왕성) → 해금 모달
  await page.waitForFunction(() => window.__game.unlockPending(), null, { timeout: 5000 });
  const fg = await page.evaluate(() => (window.__game as any).fgRect());
  const sFg = fg.w / 450; // contain 스케일(이 화면비에서 ≈1.125), cover(sBg)≈3.56과 크게 다름
  // 모달은 contain 레이어에 있어 콘텐츠가 sFg(정상)로 그려진다 — cover였다면 ~3배 커진다.
  const modalScale = await page.evaluate(() => window.__game.unlockModalScale());
  expect(Math.abs(modalScale - sFg)).toBeLessThan(0.02);
});

test('콤보 카운터: 유지 시간(4s) 안에 연속 머지하면 콤보가 1→2로 오른다', async ({ page }) => {
  await ready(page);
  await page.evaluate(() => {
    window.__game.unlockAll(); // 언락 모달/포즈 방지
    window.__game.clearBoard(); // 랙 격리
  });
  await page.evaluate(() => window.__game.spawnPair(5)); // 첫 머지 → 콤보 1
  await page.waitForFunction(() => window.__game.comboValue() >= 1, null, { timeout: 5000 });
  expect(await page.evaluate(() => window.__game.comboValue())).toBe(1);
  await page.evaluate(() => window.__game.spawnPair(5)); // 유지 시간 안 두 번째 머지 → 콤보 증가(리셋 아님)
  await page.waitForFunction(() => window.__game.comboValue() >= 2, null, { timeout: 5000 });
  expect(await page.evaluate(() => window.__game.comboValue())).toBeGreaterThanOrEqual(2);
});

test('콤보 마일스톤: 5단위 도달 시 큰 보너스 점수 지급(콤보값×bonusPer)', async ({ page }) => {
  await ready(page);
  await page.evaluate(() => {
    window.__game.unlockAll();
    window.__game.clearBoard();
  });
  // 연속 머지로 콤보를 5 이상 쌓는다(유지 5s 안)
  for (let i = 0; i < 6; i++) {
    await page.evaluate(() => window.__game.spawnPair(5));
    await page.waitForTimeout(250);
  }
  await page.waitForFunction(() => window.__game.comboBonusAwarded() > 0, null, { timeout: 6000 });
  const bonus = await page.evaluate(() => window.__game.comboBonusAwarded());
  expect(bonus).toBeGreaterThanOrEqual(2000); // 첫 마일스톤(콤보5) = 5×400
  expect((bonus / 400) % 5).toBe(0); // 5의 배수 콤보에서만 지급
});

test('태양끼리는 블랙홀로 합성, Infinite는 블랙홀끼리 합성 시 카운트 +20·둘 다 소멸', async ({ page }) => {
  await ready(page); // 기본 Infinite
  await page.evaluate(() => {
    window.__game.unlockAll();
    window.__game.clearBoard();
  });
  const merges0 = await page.evaluate(() => window.__game.stats().merges);
  await page.evaluate(() => window.__game.spawnPair(10));
  await page.waitForFunction((m) => window.__game.stats().merges > m, merges0, { timeout: 5000 });
  expect(await page.evaluate(() => window.__game.tiersOnBoard())).toContain(11);

  // Infinite 한정: 블랙홀 + 블랙홀 → 둘 다 소멸 + 카운트 +20 (ADR 2026-06-28-blackhole-infinite-count)
  await page.evaluate(() => window.__game.clearBoard());
  const count0 = await page.evaluate(() => window.__game.count());
  await page.evaluate(() => window.__game.spawnPair(11));
  await page.waitForFunction((c) => window.__game.count() >= c + 20, count0, { timeout: 5000 });
  expect(await page.evaluate(() => window.__game.count())).toBe(count0 + 20);
  const tiers = await page.evaluate(() => window.__game.tiersOnBoard());
  expect(tiers.length).toBe(0); // 두 블랙홀 모두 사라짐
});

test('첫 5발 내 ≥1 합성 + 모든 행성이 보드 안(벽 반사, 누출 없음)', async ({ page }) => {
  await ready(page);
  for (let i = 0; i < 5; i++) {
    const ang = -Math.PI / 2 + (i - 2) * 0.12;
    await page.evaluate((a) => window.__game.fire(a, 0.97), ang);
    await page.waitForTimeout(750);
  }
  await page.waitForTimeout(900);
  expect(await page.evaluate(() => window.__game.stats().merges)).toBeGreaterThanOrEqual(1);
  const snap = await page.evaluate(() => window.__game.snapshot());
  expect(snap.length).toBeGreaterThan(0);
  expect(snap.every((p) => p.inBoard)).toBe(true);
});

test('일방향 경계: 발사된 행성은 발사대 원 안으로 되돌아오지 않는다', async ({ page }) => {
  await ready(page);
  await page.evaluate(() => window.__game.clearBoard());
  const L = await page.evaluate(() => window.__game.launcher());
  // 발사: 위로(살짝 비스듬) — 발사대 원을 빠져나가 플레이 영역 진입
  await page.evaluate(() => window.__game.fire(-Math.PI / 2 + 0.12, 0.96));
  await page.waitForFunction(() => window.__game.snapshot().some((p) => p.inPlayArea), null, {
    timeout: 4000,
  });
  // 진입(inPlayArea) 후 행성 중심이 발사대 원 내부로 침투하지 않음 — 원이 단단해진다
  let reentered = false;
  for (let i = 0; i < 12; i++) {
    const bad = await page.evaluate(
      (l) =>
        window.__game.snapshot().some((p) => {
          if (!p.inPlayArea) return false;
          return Math.hypot(p.x - l.x, p.y - l.y) < l.r - 4;
        }),
      L
    );
    if (bad) {
      reentered = true;
      break;
    }
    await page.waitForTimeout(160);
  }
  expect(reentered).toBe(false);
});

test('실드래그 발사(press-drag-release) 동작 + 스크린샷', async ({ page }, testInfo) => {
  await ready(page);
  const shots0 = await page.evaluate(() => window.__game.stats().shots);
  const box = (await page.locator('canvas').boundingBox())!;
  const lx = box.x + box.width * 0.5;
  const ly = box.y + box.height * 0.86; // 발사대 근처
  await page.mouse.move(lx, ly);
  await page.mouse.down();
  await page.mouse.move(lx - 18, ly + 64, { steps: 10 }); // 아래로 당김 → 위로 발사
  await page.screenshot({ path: testInfo.outputPath(`aim-${testInfo.project.name}.png`) });
  await page.mouse.up();
  await page.waitForTimeout(600);
  expect(await page.evaluate(() => window.__game.stats().shots)).toBeGreaterThan(shots0);
  await page.screenshot({ path: testInfo.outputPath(`play-${testInfo.project.name}.png`) });
});

test('메타: 코인 0 시작, 미션 달성 후 보상 버튼으로 50 수령', async ({ page }) => {
  await ready(page);
  await page.evaluate(() => {
    window.__game.metaReset();
    window.__game.unlockAll(); // 해금 모달 포즈 방지
    window.__game.clearBoard();
  });
  expect(await page.evaluate(() => window.__game.meta().coins)).toBe(0);
  // 연속 머지로 콤보 피크 ≥5 달성 → 콤보5 미션 완료(달성). 달성만으로는 지급되지 않음(수령식).
  for (let i = 0; i < 6; i++) {
    await page.evaluate(() => window.__game.spawnPair(5));
    await page.waitForTimeout(250);
  }
  await page.waitForFunction(() => window.__game.meta().completed >= 1, null, { timeout: 8000 });
  expect(await page.evaluate(() => window.__game.meta().coins)).toBe(0); // 아직 미수령
  // 보상 버튼 수령 → +50, 재수령 불가
  expect(await page.evaluate(() => window.__game.claimMission('combo5'))).toBe(true);
  expect(await page.evaluate(() => window.__game.meta().coins)).toBe(50);
  expect(await page.evaluate(() => window.__game.claimMission('combo5'))).toBe(false);
});

test('메타 출석: 받기 시 1일차 100 지급·일차 진행, 하루 1회만', async ({ page }) => {
  await ready(page);
  await page.evaluate(() => window.__game.metaReset());
  expect(await page.evaluate(() => window.__game.meta().attendanceDay)).toBe(1);
  expect(await page.evaluate(() => window.__game.claimAttendance())).toBe(100); // 1일차 = 100
  expect(await page.evaluate(() => window.__game.meta().coins)).toBe(100);
  expect(await page.evaluate(() => window.__game.meta().attendanceDay)).toBe(2); // 일차 진행
  expect(await page.evaluate(() => window.__game.claimAttendance())).toBe(0); // 같은 KST 날 재청구 불가
  expect(await page.evaluate(() => window.__game.meta().coins)).toBe(100);
});

test('메타 돌림판: 100 코인 소모 후 결정된 칸(균등 랜덤) 보상 지급', async ({ page }) => {
  await ready(page);
  await page.evaluate(() => {
    window.__game.metaReset();
    window.__game.metaAddCoins(100);
    window.__game.openPopup('wheel'); // 보이는 동안만 회전 애니메이션이 돈다
  });
  expect(await page.evaluate(() => window.__game.wheelStart())).toBe(true);
  expect(await page.evaluate(() => window.__game.meta().coins)).toBe(0); // 100 소모
  await page.evaluate(() => window.__game.wheelStop(0)); // 0번 칸 = 10 (결정론적)
  await page.waitForFunction(() => window.__game.wheelWin() > 0, null, { timeout: 6000 });
  expect(await page.evaluate(() => window.__game.wheelWin())).toBe(10);
  expect(await page.evaluate(() => window.__game.meta().coins)).toBe(10); // 보상 10 지급
});

test('메타 영속 호환: 구버전 저장(claimed 필드 없음)을 열어도 일일 미션이 크래시 없이 동작', async ({ page }) => {
  await ready(page);
  // per-mission이 granted였고 claimed 필드가 없던 구버전 저장을 직접 주입 후 리로드 → load() 정규화로 복구.
  await page.evaluate(() => {
    const today = new Date(Date.now() + 9 * 3600000).toISOString().slice(0, 10); // KST 날짜
    localStorage.setItem(
      'ppm.meta.v1',
      JSON.stringify({
        coins: 777,
        missions: { comboPeak: 0, mergeCount: 0, sunCount: 0, granted: [], claimedMilestones: [], resetDate: today },
        attendance: { day: 1, lastClaimDate: '' },
      })
    );
  });
  await page.reload();
  await page.waitForFunction(() => !!window.__game && window.__game.scene() === 'Title', null, { timeout: 15000 });
  expect(await page.evaluate(() => window.__game.meta().coins)).toBe(777); // 코인 보존
  // 일일 미션 열기(= missionRows 호출)가 던지지 않고 8행 + 모두 미수령으로 반환된다.
  const rows = await page.evaluate(() => {
    window.__game.openPopup('dailyMission');
    return window.__game.metaMissions();
  });
  expect(rows.length).toBe(8);
  expect(rows.every((r) => r.claimed === false)).toBe(true);
});

test('메타 레코드: 점수가 영속되어 리로드 후에도 최고 점수가 유지된다', async ({ page }) => {
  await ready(page);
  await page.evaluate(() => {
    window.__game.metaReset();
    window.__game.unlockAll(); // 해금 모달 포즈 방지
    window.__game.clearBoard();
  });
  expect(await page.evaluate(() => window.__game.meta().best)).toBe(0);
  // 머지로 점수 획득 → records.best/current 갱신(최고 갱신 시 즉시 저장)
  await page.evaluate(() => window.__game.spawnPair(5));
  await page.waitForFunction(() => window.__game.meta().best > 0, null, { timeout: 6000 });
  const best = await page.evaluate(() => window.__game.meta().best);
  expect(best).toBeGreaterThan(0);
  // 리로드 → localStorage에서 최고 점수가 복원된다
  await page.reload();
  await page.waitForFunction(() => !!window.__game && window.__game.scene() === 'Title', null, { timeout: 15000 });
  expect(await page.evaluate(() => window.__game.meta().best)).toBe(best);
});

test('인게임 ≡ 메뉴: 햄버거 토글·바깥 탭 닫힘 + 4아이콘이 해당 팝업을 연다(설정=동작 공유)', async ({ page }) => {
  await ready(page);
  // 닫힘이 기본. 햄버거(≡)를 누르면 드롭다운이 열리고 아이콘이 4개다.
  expect(await page.evaluate(() => window.__game.hudMenuOpen())).toBe(false);
  await page.evaluate(() => window.__game.hudMenuBurger());
  expect(await page.evaluate(() => window.__game.hudMenuOpen())).toBe(true);
  expect(await page.evaluate(() => window.__game.hudMenuItemCount())).toBe(4);
  // 햄버거를 다시 누르면 닫힌다.
  await page.evaluate(() => window.__game.hudMenuBurger());
  expect(await page.evaluate(() => window.__game.hudMenuOpen())).toBe(false);
  // 바깥(다른 화면)을 누르면 닫힌다.
  await page.evaluate(() => window.__game.hudMenuBurger());
  await page.evaluate(() => window.__game.hudMenuOutside());
  expect(await page.evaluate(() => window.__game.hudMenuOpen())).toBe(false);
  // 설정(항목 3): Title 설정과 동일 — 전용 팝업이 없으므로 아무 팝업도 열리지 않고 리스트만 닫힌다.
  await page.evaluate(() => window.__game.hudMenuBurger());
  await page.evaluate(() => window.__game.hudMenuItem(3));
  expect(await page.evaluate(() => window.__game.hudMenuOpen())).toBe(false);
  expect(await page.evaluate(() => window.__game.openPopupKind())).toBe(null);
  // 항목 0·1·2 → 일일미션·출석·돌림판 팝업을 열고 리스트는 닫힌다(한 번에 하나).
  for (const [i, kind] of [[0, 'dailyMission'], [1, 'attendance'], [2, 'wheel']] as const) {
    await page.evaluate(() => window.__game.hudMenuBurger());
    await page.evaluate((idx) => window.__game.hudMenuItem(idx), i);
    expect(await page.evaluate(() => window.__game.hudMenuOpen())).toBe(false);
    expect(await page.evaluate(() => window.__game.openPopupKind())).toBe(kind);
  }
});

test('인게임 ≡ 메뉴 실포인터: 햄버거로 열기·바깥 탭으로 닫힘(실 히트테스트·z-order)', async ({ page }) => {
  await ready(page);
  // 캔버스는 뷰포트 가득, 전경(9:16)은 contain·중앙. 디자인 좌표 → 화면 좌표 변환.
  const box = (await page.locator('canvas').boundingBox())!;
  const fg = await page.evaluate(() => (window.__game as any).fgRect());
  const toScreen = (dx: number, dy: number) => ({
    x: box.x + (box.width - fg.w) / 2 + (dx / 450) * fg.w,
    y: box.y + (box.height - fg.h) / 2 + (dy / 800) * fg.h,
  });
  const burger = toScreen(450 - 28, 27); // ≡ 버튼 중심
  const outside = toScreen(225, 430); // 보드 중앙(메뉴 바깥)

  // 실제 입력은 항상 move가 down보다 먼저 와서 Pixi 히트테스트를 갱신한다. 합성 탭은 move+프레임을
  // 줘야 첫 down이 갱신된 타깃을 맞춘다(아니면 stage로 새어 발사된다).
  const tap = async (x: number, y: number) => {
    await page.mouse.move(x, y);
    await page.waitForTimeout(50);
    await page.mouse.down();
    await page.mouse.up();
  };

  // 햄버거 실클릭 → 드롭다운 열림(스크림 위 ≡ 버튼이 실제로 눌린다)
  await tap(burger.x, burger.y);
  expect(await page.evaluate(() => window.__game.hudMenuOpen())).toBe(true);
  // 바깥(보드) 실클릭 → 닫힘(투명 스크림이 바깥 탭을 가로채 닫는다 — z-order 정상)
  await tap(outside.x, outside.y);
  expect(await page.evaluate(() => window.__game.hudMenuOpen())).toBe(false);
  // 햄버거 재탭 → 열림 → 다시 재탭 → 닫힘(토글)
  await tap(burger.x, burger.y);
  expect(await page.evaluate(() => window.__game.hudMenuOpen())).toBe(true);
  await tap(burger.x, burger.y);
  expect(await page.evaluate(() => window.__game.hudMenuOpen())).toBe(false);
});

test('절대 영역: 최대 파워 발사·강한 충돌에도 행성이 플레이 영역을 벗어나지 않는다', async ({ page }) => {
  await ready(page);
  const b = await page.evaluate(() => window.__game.bounds());
  // 최대 파워(1.0)로 난사 → 강한 충돌·고속 이동 유발(터널링 조건)
  for (let i = 0; i < 18; i++) {
    const ang = -Math.PI / 2 + ((i % 7) - 3) * 0.28; // 부채꼴 전역(테이퍼 측면까지) 강타
    await page.evaluate((a) => window.__game.fire(a, 1), ang);
    await page.waitForTimeout(160);
  }
  await page.waitForTimeout(900);
  const snap = await page.evaluate(() => window.__game.snapshot());
  // 어떤 행성도 캔버스(보드) 밖으로 멀리 튕겨나가지 않는다 — 강한 충돌 탈출 = 구조적 결함.
  expect(snap.filter((p) => p.x < -30 || p.x > 480 || p.y < -30 || p.y > 830)).toEqual([]);
  // 진입한 행성은 사각 경계 안(2px 여유) + 벌지 하단 floor 아래로 내려가지 않는다.
  const escaped = snap.filter(
    (p) => p.inPlayArea && (p.x < b.x - 2 || p.x > b.x + b.w + 2 || p.y < b.y - 2 || p.y > b.lineY + 2)
  );
  expect(escaped).toEqual([]);
});

// ── 게임 모드 (docs/20-core-loop/game-modes) ──────────────────────────────────────────────────

async function readyStage(page: Page) {
  await seedSave(page);
  await page.goto('/');
  await page.waitForFunction(() => !!window.__game && window.__game.scene() === 'Title', null, { timeout: 15000 });
  await page.evaluate(() => window.__game.startGame('Stage'));
  await page.waitForFunction(() => window.__game.scene() === 'PoolInGame' && window.__game.planetCount() > 0, null, { timeout: 15000 });
  await page.waitForFunction(() => !window.__game.transitioning(), null, { timeout: 5000 });
}

test('Infinite 모드: 카운트 50으로 시작', async ({ page }) => {
  await ready(page); // startGame('Infinite')
  expect(await page.evaluate(() => window.__game.mode())).toBe('Infinite');
  expect(await page.evaluate(() => window.__game.count())).toBe(50);
});

test('기본 모드 = Stage: Title 토글 기본 선택', async ({ page }) => {
  await seedSave(page); // 세이브 있음 → Title 경유
  await page.goto('/');
  await page.waitForFunction(() => !!window.__game && window.__game.scene() === 'Title', null, { timeout: 15000 });
  expect(await page.evaluate(() => window.__game.mode())).toBe('Stage'); // startMode 기본 = Stage
});

test('최초 실행(저장 없음): Title 건너뛰고 Stage 1 직행', async ({ page }) => {
  // 세이브를 심지 않은 fresh 컨텍스트 = 게임 최초 실행 (docs/20-core-loop/screen-flow §최초 실행)
  await page.goto('/');
  await page.waitForFunction(() => !!window.__game && window.__game.scene() === 'PoolInGame' && window.__game.planetCount() > 0, null, { timeout: 15000 });
  expect(await page.evaluate(() => window.__game.scene())).toBe('PoolInGame');
  expect(await page.evaluate(() => window.__game.mode())).toBe('Stage');
  expect(await page.evaluate(() => window.__game.count())).toBeGreaterThan(0);
  expect(await page.evaluate(() => window.__game.targetTier())).toBeGreaterThan(0);
});

test('카운트: 발사마다 1 감소, 0이면 발사 불가', async ({ page }) => {
  await ready(page);
  const c0 = await page.evaluate(() => window.__game.count());
  await page.evaluate(() => window.__game.fire(-Math.PI / 2, 0.9));
  expect(await page.evaluate(() => window.__game.count())).toBe(c0 - 1);
  await page.evaluate(() => window.__game.setCount(0));
  expect(await page.evaluate(() => window.__game.fire(-Math.PI / 2, 0.9))).toBe(false);
});

test('Infinite 종료: 카운트 0 → 2초 뒤 결과창', async ({ page }) => {
  await ready(page);
  await page.evaluate(() => { window.__game.clearBoard(); window.__game.setCount(0); });
  await page.waitForFunction(() => window.__game.resultShown(), null, { timeout: 5000 });
  expect(await page.evaluate(() => window.__game.resultShown())).toBe(true);
});

test('Infinite 해금 보너스: 새 단계 해금 팝업 시 카운트 +10', async ({ page }) => {
  await ready(page); // Infinite, count 50
  await page.evaluate(() => window.__game.clearBoard());
  const c0 = await page.evaluate(() => window.__game.count());
  await page.evaluate(() => window.__game.spawnPair(5)); // 지구+지구 → 넵튠(6) → 첫 해금 팝업
  await page.waitForFunction(() => window.__game.unlockPending(), null, { timeout: 5000 });
  expect(await page.evaluate(() => window.__game.count())).toBe(c0 + 10); // 해금 시 +10 (Infinite)
});

test('행성 충전: 코인으로 카운트 구매(10당 100), 잔액 부족 시 실패', async ({ page }) => {
  await ready(page); // Infinite
  await page.evaluate(() => window.__game.metaReset());
  expect(await page.evaluate(() => window.__game.chargeBuy(10))).toBe(false); // 잔액 0
  await page.evaluate(() => window.__game.metaAddCoins(100));
  const c0 = await page.evaluate(() => window.__game.count());
  expect(await page.evaluate(() => window.__game.chargeBuy(10))).toBe(true); // 100코인 → +10
  expect(await page.evaluate(() => window.__game.count())).toBe(c0 + 10);
  expect(await page.evaluate(() => window.__game.meta().coins)).toBe(0); // 100 소모
});

test('Stage 모드: 목표 행성·지정 카운트로 시작', async ({ page }) => {
  await readyStage(page);
  expect(await page.evaluate(() => window.__game.mode())).toBe('Stage');
  expect(await page.evaluate(() => window.__game.targetTier())).toBeGreaterThan(0);
  expect(await page.evaluate(() => window.__game.count())).toBeGreaterThan(0);
});

test('Stage 클리어: 목표 행성 합성 → +300코인 + 클리어 결과창', async ({ page }) => {
  await readyStage(page);
  await page.evaluate(() => window.__game.metaReset());
  const target = await page.evaluate(() => window.__game.targetTier());
  const coins0 = await page.evaluate(() => window.__game.meta().coins);
  await page.evaluate(() => { window.__game.unlockAll(); window.__game.clearBoard(); });
  await page.evaluate((t) => window.__game.spawnPair(t - 1), target); // 목표 직전 등급 쌍 → 합성 → 목표 생성
  await page.waitForFunction(() => window.__game.stageCleared(), null, { timeout: 5000 });
  expect(await page.evaluate(() => window.__game.stageCleared())).toBe(true);
  expect(await page.evaluate(() => window.__game.meta().coins)).toBe(coins0 + 300);
});

test('Stage 모드: 합성 단계 해금 팝업이 뜨지 않는다(언락은 Infinite 전용)', async ({ page }) => {
  await readyStage(page);
  expect(await page.evaluate(() => window.__game.unlockedTier())).toBe(11); // Stage는 시작부터 전 단계 해금
  await page.evaluate(() => { window.__game.clearBoard(); window.__game.spawnPair(3); }); // 화성 쌍 → 금성(4) 생성
  await page.waitForTimeout(150);
  expect(await page.evaluate(() => window.__game.unlockPending())).toBe(false); // 해금 모달/일시정지 없음
});

test('Stage 클리어 연출: 목표 합성 시 발사 정지·발사대 비움 후 클리어창', async ({ page }) => {
  await readyStage(page);
  await page.evaluate(() => { window.__game.metaReset(); window.__game.unlockAll(); window.__game.clearBoard(); });
  const target = await page.evaluate(() => window.__game.targetTier());
  await page.evaluate((t) => window.__game.spawnPair(t - 1), target); // 목표 생성 → 클리어 비행 연출 시작
  await page.waitForFunction(() => window.__game.clearing(), null, { timeout: 3000 });
  // 연출 중: 추가 발사 정지 + 발사대 비움
  expect(await page.evaluate(() => window.__game.fire(-Math.PI / 2, 0.9))).toBe(false);
  expect(await page.evaluate(() => window.__game.launcherLoaded())).toBe(false);
  // 연출 종료 → 클리어창 등장
  await page.waitForFunction(() => window.__game.stageCleared(), null, { timeout: 3000 });
  expect(await page.evaluate(() => window.__game.clearing())).toBe(false);
});

test('Stage 실패: 카운트 0 + 목표 미달 → 실패 결과창', async ({ page }) => {
  await readyStage(page);
  await page.evaluate(() => { window.__game.clearBoard(); window.__game.setCount(0); });
  await page.waitForFunction(() => window.__game.stageFailed(), null, { timeout: 5000 });
  expect(await page.evaluate(() => window.__game.stageFailed())).toBe(true);
});

test('첫 제스처 코치: 게임 진입 시 표시, 첫 발사 후 사라짐', async ({ page }) => {
  await ready(page); // Infinite 진입
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  expect(await page.evaluate(() => (window.__game as any).gestureHintShown())).toBe(true);
  await page.evaluate(() => window.__game.fire(-Math.PI / 2, 0.9)); // 첫 발사
  await page.waitForTimeout(80);
  expect(await page.evaluate(() => (window.__game as any).gestureHintShown())).toBe(false);
});

test('Stage 진행: 클리어 시 다음 스테이지로 전진되고 영속된다', async ({ page }) => {
  await readyStage(page);
  await page.evaluate(() => { window.__game.metaReset(); window.__game.unlockAll(); window.__game.clearBoard(); });
  expect(await page.evaluate(() => window.__game.stageNo())).toBe(1); // 진행 0 → Stage 1
  const target = await page.evaluate(() => window.__game.targetTier());
  await page.evaluate((t) => window.__game.spawnPair(t - 1), target); // 클리어
  await page.waitForFunction(() => window.__game.stageCleared(), null, { timeout: 6000 });
  expect(await page.evaluate(() => window.__game.stageNo())).toBe(2); // 클리어 → Stage 2로 전진
  expect(await page.evaluate(() => window.__game.stageProgress())).toBe(1);
  // 영속: 리로드 후에도 Title은 Stage 2(진행도 1)
  await page.reload();
  await page.waitForFunction(() => !!window.__game && window.__game.scene() === 'Title', null, { timeout: 15000 });
  expect(await page.evaluate(() => window.__game.stageProgress())).toBe(1);
});
