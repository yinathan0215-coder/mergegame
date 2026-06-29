import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

// Guards the generated Stage 1~100 data against the balance methodology (docs/40-balancing/stage-balance):
// planet value = 2^tier; rack value + queue value(first count-N) > target value; max value > target; etc.

interface Level { count: number; target: number; rack: { tier: number; count: number }[]; queue: number[] }
const balance = JSON.parse(readFileSync(new URL('../src/data/balance.json', import.meta.url), 'utf8')) as {
  modes: { stage: { levels: Level[] } };
};
const levels = balance.modes.stage.levels;

const value = (t: number) => 2 ** t;
const sumVal = (a: number[]) => a.reduce((s, t) => s + value(t), 0);
const rackVal = (r: { tier: number; count: number }[]) => r.reduce((s, e) => s + e.count * value(e.tier), 0);
const cadence = (s: number) => (s % 10 === 0 ? 30 : s % 3 === 0 || s % 5 === 0 || s % 8 === 0 ? 15 : 20);
const slackN = (s: number) => Math.max(0, 10 - Math.floor(s / 10));

test('Stage 1~100 데이터가 밸런스 기조(밸류=2^단계)를 100/100 만족한다', () => {
  expect(levels.length).toBe(100);
  levels.forEach((L, i) => {
    const s = i + 1;
    const N = slackN(s);
    const Q = sumVal(L.queue);
    const Qeff = sumVal(L.queue.slice(0, L.count - N)); // value of the first (count-N) launches
    const R = rackVal(L.rack);
    const tv = value(L.target);
    expect(L.count, `s${s} count cadence`).toBe(cadence(s));
    expect(L.queue.length, `s${s} queue length = count`).toBe(L.count);
    expect(L.queue.every((t) => t >= 1 && t <= 5), `s${s} queue <= Earth(5)`).toBe(true);
    if (s !== 1) expect(R, `s${s} rack:queue = 5:5`).toBe(Q); // Stage 1 = 손튜닝 역삼각형(5:5 면제)
    expect(R + Qeff, `s${s} difficulty: rack + queue(count-N) > target`).toBeGreaterThan(tv);
    expect(R + Q, `s${s} winnable: max > target`).toBeGreaterThan(tv);
    expect(L.target, `s${s} target above queue cap (forces a merge)`).toBeGreaterThan(Math.max(...L.queue));
    expect(L.rack.every((e) => e.tier < L.target), `s${s} rack tiers below target`).toBe(true);
  });
  // Stage 1: 손튜닝 역삼각형(▽) 튜토리얼 — 위가 넓은 고정 구성(금성4·수성3·금성2·소행성1), 5:5 면제
  expect(levels[0].rack, 'Stage 1 역삼각형 rack').toEqual([
    { tier: 4, count: 4 }, { tier: 2, count: 3 }, { tier: 4, count: 2 }, { tier: 1, count: 1 },
  ]);
  // 디자인 다양성: 100스테이지의 (랙+큐) 조합이 모두 서로 다르다 — 동일 디자인 금지
  const designs = levels.map((L) => JSON.stringify(L.rack) + '|' + JSON.stringify(L.queue));
  expect(new Set(designs).size, '고유 랙+큐 디자인 수').toBe(100);
});

test('Stage 모드: Stage 1 랙이 구성대로 스폰된다(보드 밸류 = 랙 밸류, 합성 보존)', async ({ page }) => {
  // 세이브를 심어 Title 경유 부팅을 강제(빈 localStorage = 최초 실행 → Title 건너뛰고 Stage 직행, screen-flow §최초 실행)
  await page.addInitScript(() => { if (!localStorage.getItem('ppm.meta.v1')) localStorage.setItem('ppm.meta.v1', JSON.stringify({ coins: 0 })); });
  await page.goto('/');
  await page.waitForFunction(() => !!(window as any).__game && (window as any).__game.scene() === 'Title', null, { timeout: 15000 });
  await page.evaluate(() => (window as any).__game.startGame('Stage'));
  await page.waitForFunction(() => (window as any).__game.scene() === 'PoolInGame' && (window as any).__game.planetCount() > 0, null, { timeout: 15000 });
  await page.waitForFunction(() => !(window as any).__game.transitioning(), null, { timeout: 5000 });
  expect(await page.evaluate(() => (window as any).__game.mode())).toBe('Stage');
  expect(await page.evaluate(() => (window as any).__game.targetTier())).toBe(levels[0].target); // Stage 1 target
  // 발사 전 보드 총 밸류 = Stage 1 랙 밸류(합성으로 줄지 않음). buildStageRack이 구성대로 스폰했음을 검증.
  const boardVal = await page.evaluate(() => (window as any).__game.tiersOnBoard().reduce((s: number, t: number) => s + 2 ** t, 0));
  expect(boardVal).toBe(rackVal(levels[0].rack));
});

test('Stage 모드: 합성을 반복해도 점수·콤보가 집계되지 않는다(Stage는 점수/콤보 미집계)', async ({ page }) => {
  // 세이브를 심어 Title 경유 부팅을 강제(빈 localStorage = 최초 실행 → Title 건너뛰고 Stage 직행, screen-flow §최초 실행)
  await page.addInitScript(() => { if (!localStorage.getItem('ppm.meta.v1')) localStorage.setItem('ppm.meta.v1', JSON.stringify({ coins: 0 })); });
  await page.goto('/');
  await page.waitForFunction(() => !!(window as any).__game && (window as any).__game.scene() === 'Title', null, { timeout: 15000 });
  await page.evaluate(() => (window as any).__game.startGame('Stage'));
  await page.waitForFunction(() => (window as any).__game.scene() === 'PoolInGame' && (window as any).__game.planetCount() > 0, null, { timeout: 15000 });
  await page.waitForFunction(() => !(window as any).__game.transitioning(), null, { timeout: 5000 });
  await page.evaluate(() => { (window as any).__game.unlockAll(); (window as any).__game.clearBoard(); });
  // 콤보가 쌓일 만큼(유지창 안) 연속 합성. 매번 보드를 비워 목표(해왕성)로 체이닝되어 클리어되는 것을 방지.
  for (let i = 0; i < 4; i++) {
    await page.evaluate(() => { (window as any).__game.clearBoard(); (window as any).__game.spawnPair(3); }); // 화성 쌍 → 금성(목표 미만)
    await page.waitForTimeout(250);
  }
  await page.waitForTimeout(300);
  expect(await page.evaluate(() => (window as any).__game.score())).toBe(0); // 점수 미집계(합성·충돌 모두)
  expect(await page.evaluate(() => (window as any).__game.comboValue())).toBe(0); // 콤보 카운터 미작동
  expect(await page.evaluate(() => (window as any).__game.comboBonusAwarded())).toBe(0); // 콤보 보너스 없음
});
