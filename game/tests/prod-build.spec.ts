import { test, expect } from '@playwright/test';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

// Production single-file smoke test (methodology audit D3 cap).
// `npm run build:single` inlines JS + all PNG art into dist/galaxy-pinball.html, meant to run
// from file:// with no server. In production `import.meta.env.DEV` is false, so the dev debug
// API (window.__game) is stripped — this spec verifies the SHIPPED artifact via OBSERVABLE
// signals ONLY: it boots, a canvas is present and sized, and no runtime/console errors occur
// over a few seconds of real play time. It loads the file directly (no dev webServer / baseURL).

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distFile = path.resolve(__dirname, '../dist/galaxy-pinball.html');
const distUrl = pathToFileURL(distFile).href;

test('프로덕션 단일파일(galaxy-pinball.html): file://에서 부팅·캔버스 렌더·에러 0건', async ({ page }) => {
  test.skip(!existsSync(distFile), 'run npm run build:single first');

  // Register error collectors BEFORE navigation so boot-time errors are also captured.
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push('console.error: ' + m.text());
  });

  // Absolute file:// URL — does NOT use the shared baseURL/webServer.
  await page.goto(distUrl);

  // Canvas mounts on boot, becomes visible, and has a non-zero on-screen size.
  const canvas = page.locator('canvas');
  await expect(canvas).toBeVisible({ timeout: 15000 });
  const box = await canvas.boundingBox();
  expect(box, 'canvas has a layout box').not.toBeNull();
  expect(box!.width).toBeGreaterThan(0);
  expect(box!.height).toBeGreaterThan(0);

  // Drawing buffer is actually allocated (prod build has no __game — observable signal only).
  const buffer = await page.evaluate(() => {
    const c = document.querySelector('canvas') as HTMLCanvasElement | null;
    return c ? { w: c.width, h: c.height } : null;
  });
  expect(buffer, 'canvas element exists').not.toBeNull();
  expect(buffer!.w).toBeGreaterThan(0);
  expect(buffer!.h).toBeGreaterThan(0);

  // ~3s of real wall-clock play time — let boot, asset decode, physics and render settle.
  await page.waitForTimeout(3000);

  // No runtime / console errors across boot + play. A failure here is a real shipped bug.
  expect(errors, errors.join('\n')).toEqual([]);
});
