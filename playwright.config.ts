import { defineConfig } from '@playwright/test';

const isLocalhost = process.env.E2E_BASE_URL?.includes('localhost');

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [['html'], ['list']],
  timeout: 30000,
  use: {
    baseURL: process.env.E2E_BASE_URL || 'https://legitas.hu',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    locale: 'hu-HU',
  },
  projects: [
    {
      name: 'setup',
      testMatch: /auth\.setup\.ts/,
    },
    {
      name: 'chromium',
      use: { browserName: 'chromium' },
      dependencies: ['setup'],
    },
  ],
  ...(isLocalhost && {
    webServer: [
      {
        command: 'npm run start:dev',
        cwd: './backend',
        port: 3001,
        reuseExistingServer: true,
        timeout: 30000,
      },
      {
        command: 'npm run dev',
        cwd: './frontend',
        port: 3000,
        reuseExistingServer: true,
        timeout: 30000,
      },
    ],
  }),
});
