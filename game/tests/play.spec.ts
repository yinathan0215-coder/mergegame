import { test, expect, type Page } from '@playwright/test';

// Verifies docs/70-verification KPI + 완료 체크리스트 against the running prototype.
// Game exposes a debug API on window.__game (see GameScene.exposeDebug).

declare global {
  interface Window {
    __game: {
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
    };
  }
}

async function ready(page: Page) {
  await page.goto('/');
  await page.waitForFunction(() => !!window.__game && window.__game.planetCount() > 0, null, {
    timeout: 15000,
  });
}

test('초기 상태: 중앙 랙 10 + 발사대(현재 행성), 군더더기 UI 없음', async ({ page }) => {
  await ready(page);
  expect(await page.evaluate(() => window.__game.planetCount())).toBe(10); // 수성4+화성3+금성2+지구1
  const q = await page.evaluate(() => window.__game.queue());
  expect(q.length).toBe(1); // Next 미리보기 없음 — 현재 행성 1개만
  expect(q[0]).toBeGreaterThanOrEqual(1);
  expect(q[0]).toBeLessThanOrEqual(5);
  expect(await page.locator('canvas').count()).toBe(1);
  // 포켓/Shake/Change Ball/광고 보상 = DOM 컨트롤 없음
  expect(await page.locator('button').count()).toBe(0);
});

test('9:16 비율 유지 (UI 겹침 방지 기준)', async ({ page }) => {
  await ready(page);
  const box = await page.locator('canvas').boundingBox();
  expect(box).not.toBeNull();
  const ratio = box!.width / box!.height;
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
  // 해왕성(5) 2개 → 천왕성(6). 빈 보드라 6의 등장 = 합성 증거.
  await page.evaluate(() => window.__game.spawnPair(5));
  await page.waitForFunction((m) => window.__game.stats().merges > m, merges0, { timeout: 5000 });
  const tiers = await page.evaluate(() => window.__game.tiersOnBoard());
  expect(tiers).toContain(6);
  expect(await page.evaluate(() => window.__game.score())).toBeGreaterThan(score0);
  const t6 = (await page.evaluate(() => window.__game.snapshot())).find((p) => p.tier === 6);
  expect(t6).toBeTruthy();
  expect(t6!.speed).toBeGreaterThan(0.5); // 제자리 정지 방지 — 최소 속도
});

test('태양(최종 단계)은 합성되지 않는다', async ({ page }) => {
  await ready(page);
  await page.evaluate(() => window.__game.clearBoard()); // 격리: 태양만 남기고 검증
  const merges0 = await page.evaluate(() => window.__game.stats().merges);
  await page.evaluate(() => window.__game.spawnPair(9));
  await page.waitForTimeout(1500);
  expect(await page.evaluate(() => window.__game.stats().merges)).toBe(merges0); // 합성 0
  const tiers = await page.evaluate(() => window.__game.tiersOnBoard());
  expect(tiers.length).toBe(2); // 두 태양 그대로
  expect(tiers.every((t) => t === 9)).toBe(true);
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

test('절대 영역: 최대 파워 발사·강한 충돌에도 행성이 플레이 영역을 벗어나지 않는다', async ({ page }) => {
  await ready(page);
  const b = await page.evaluate(() => window.__game.bounds());
  // 최대 파워(1.0)로 난사 → 강한 충돌·고속 이동 유발(터널링 조건)
  for (let i = 0; i < 14; i++) {
    const ang = -Math.PI / 2 + ((i % 5) - 2) * 0.2;
    await page.evaluate((a) => window.__game.fire(a, 1), ang);
    await page.waitForTimeout(180);
  }
  await page.waitForTimeout(900);
  const snap = await page.evaluate(() => window.__game.snapshot());
  // 진입한 행성은 모두 사각 경계 안(2px 여유). 이탈 = 구조적 결함(절대 영역 아님).
  const escaped = snap.filter(
    (p) => p.inPlayArea && (p.x < b.x - 2 || p.x > b.x + b.w + 2 || p.y < b.y - 2 || p.y > b.lineY + 2)
  );
  expect(escaped).toEqual([]);
  // 하단 바닥: 진입한 행성은 벌지 하단(floor) 아래로 내려가지 않는다(벽처럼 막힘)
  expect(snap.filter((p) => p.inPlayArea && p.y > b.lineY + 2)).toEqual([]);
});
