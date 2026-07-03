import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/snapshots',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:6006',
    trace: 'on-first-retry',
    viewport: { width: 1440, height: 900 },
    colorScheme: 'dark',
    deviceScaleFactor: 1,
    ignoreHTTPSErrors: true,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chromium'] },
    },
  ],

  webServer: {
    command: 'npm run storybook',
    url: 'http://localhost:6006',
    reuseExistingServer: !process.env.CI,
  },
});
