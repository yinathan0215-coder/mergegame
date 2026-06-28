import { test, expect, type Page } from '@playwright/test';

// Verifies docs/70-verification KPI + 완료 체크리스트 against the running prototype.
// Game exposes a debug API on window.__game (see GameScene.exposeDebug).

declare global {
  interface Window {
    __game: {
      scene: () => 'Title' | 'PoolInGame';
      transitioning: () => boolean;
      startGame: () => void;
      showTitle: () => void;
      unlockedTier: () => number;
      unlockPending: () => boolean;
      okUnlock: () => void;
      stats: () => { shots: number; merges: number; maxTier: number; sunReached: boolean };
      score: () => number;
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
      meta: () => { coins: number; completed: number; attendanceDay: number };
      metaMissions: () => { id: string; name: string; type: string; target: number; progress: number; done: boolean }[];
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

async function ready(page: Page) {
  await page.goto('/');
  await page.waitForFunction(() => !!window.__game && window.__game.scene() === 'Title', null, {
    timeout: 15000,
  });
  await page.evaluate(() => window.__game.startGame());
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
  expect(q.length).toBe(1); // Next 미리보기 없음 — 현재 행성 1개만
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

test('발사 후 발사대에 새 행성이 로드된다 (Next 미리보기 없음)', async ({ page }) => {
  await ready(page);
  const shots0 = await page.evaluate(() => window.__game.stats().shots);
  await page.evaluate(() => window.__game.fire(-Math.PI / 2, 0.9));
  const q = await page.evaluate(() => window.__game.queue());
  expect(q.length).toBe(1);
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

test('태양끼리는 블랙홀로 합성되고 블랙홀은 최종 단계다', async ({ page }) => {
  await ready(page);
  await page.evaluate(() => {
    window.__game.unlockAll();
    window.__game.clearBoard();
  });
  const merges0 = await page.evaluate(() => window.__game.stats().merges);
  await page.evaluate(() => window.__game.spawnPair(10));
  await page.waitForFunction((m) => window.__game.stats().merges > m, merges0, { timeout: 5000 });
  expect(await page.evaluate(() => window.__game.tiersOnBoard())).toContain(11);

  await page.evaluate(() => window.__game.clearBoard());
  const merges1 = await page.evaluate(() => window.__game.stats().merges);
  await page.evaluate(() => window.__game.spawnPair(11));
  await page.waitForTimeout(1500);
  expect(await page.evaluate(() => window.__game.stats().merges)).toBe(merges1);
  const tiers = await page.evaluate(() => window.__game.tiersOnBoard());
  expect(tiers.length).toBe(2);
  expect(tiers.every((t) => t === 11)).toBe(true);
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

test('메타 돌림판: 120 코인 소모 후 결정된 칸(균등 랜덤) 보상 지급', async ({ page }) => {
  await ready(page);
  await page.evaluate(() => {
    window.__game.metaReset();
    window.__game.metaAddCoins(120);
    window.__game.openPopup('wheel'); // 보이는 동안만 회전 애니메이션이 돈다
  });
  expect(await page.evaluate(() => window.__game.wheelStart())).toBe(true);
  expect(await page.evaluate(() => window.__game.meta().coins)).toBe(0); // 120 소모
  await page.evaluate(() => window.__game.wheelStop(0)); // 0번 칸 = 25 (결정론적)
  await page.waitForFunction(() => window.__game.wheelWin() > 0, null, { timeout: 6000 });
  expect(await page.evaluate(() => window.__game.wheelWin())).toBe(25);
  expect(await page.evaluate(() => window.__game.meta().coins)).toBe(25); // 보상 25 지급
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

test('인게임 ≡ 메뉴 실포인터: 햄버거 클릭 열기·바깥 클릭 닫기·아이콘 클릭으로 팝업', async ({ page }) => {
  await ready(page);
  // 캔버스는 뷰포트 가득, 전경(9:16)은 contain·중앙. 디자인 좌표 → 화면 좌표 변환.
  const box = (await page.locator('canvas').boundingBox())!;
  const fg = await page.evaluate(() => window.__game.fgRect());
  const toScreen = (dx: number, dy: number) => ({
    x: box.x + (box.width - fg.w) / 2 + (dx / 450) * fg.w,
    y: box.y + (box.height - fg.h) / 2 + (dy / 800) * fg.h,
  });
  const burger = toScreen(450 - 28, 27); // ≡ 버튼 중심
  const item0 = toScreen(450 - 28, 86 + 20); // 드롭다운 첫 아이콘(일일 미션) 중심
  const outside = toScreen(225, 430); // 보드 중앙(메뉴 바깥)

  // 햄버거 실클릭 → 드롭다운 열림
  await page.mouse.click(burger.x, burger.y);
  expect(await page.evaluate(() => window.__game.hudMenuOpen())).toBe(true);
  await page.screenshot({ path: 'C:/Users/USER/AppData/Local/Temp/claude/D--Project-mergegame/eecd4a92-a482-4aab-a182-173df7c72b0b/scratchpad/hud-menu-open.png' });
  // 바깥(보드) 실클릭 → 닫힘(투명 스크림이 탭을 가로채 닫는다)
  await page.mouse.click(outside.x, outside.y);
  expect(await page.evaluate(() => window.__game.hudMenuOpen())).toBe(false);
  // 햄버거 → 첫 아이콘 실클릭 → 일일 미션 팝업이 열리고 리스트는 닫힌다
  await page.mouse.click(burger.x, burger.y);
  await page.mouse.click(item0.x, item0.y);
  expect(await page.evaluate(() => window.__game.hudMenuOpen())).toBe(false);
  expect(await page.evaluate(() => window.__game.openPopupKind())).toBe('dailyMission');
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
