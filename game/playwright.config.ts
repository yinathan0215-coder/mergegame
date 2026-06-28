import { defineConfig } from '@playwright/test';

// Real play-test verification of the Planet Pool Merge vertical slice against
// docs/70-verification (KPI + 완료 체크리스트). Runs on desktop + mobile viewports.
export default defineConfig({
  testDir: './tests',
  timeout: 40000,
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:5199',
    trace: 'off',
    screenshot: 'off',
  },
  projects: [
    { name: 'desktop', use: { viewport: { width: 1280, height: 800 } } },
    { name: 'mobile', use: { viewport: { width: 390, height: 844 } } },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5199',
    reuseExistingServer: true,
    timeout: 30000,
  },
});
