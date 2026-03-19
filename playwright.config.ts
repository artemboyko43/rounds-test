import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, devices } from '@playwright/test';

const root = path.dirname(fileURLToPath(import.meta.url));
const isCI = Boolean(process.env.CI);

export default defineConfig({
  testDir: './e2e',
  globalSetup: path.join(root, 'e2e/global-setup.ts'),
  fullyParallel: false,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: isCI ? 1 : undefined,
  reporter: isCI ? [['html', { open: 'never' }], ['github'], ['list']] : [['list'], ['html']],
  timeout: 120_000,
  expect: { timeout: 25_000 },

  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    ...devices['Desktop Chrome'],
  },

  webServer: [
    {
      command: 'node dist/index.js',
      cwd: path.join(root, 'server'),
      url: 'http://127.0.0.1:4000/health',
      reuseExistingServer: !isCI,
      timeout: 120_000,
      env: {
        ...process.env,
        NODE_ENV: 'production',
        PORT: '4000',
        DATABASE_URL: 'file:./prisma/e2e.db',
        DISABLE_SCHEDULER: 'true',
      },
    },
    {
      command: 'npx vite preview --host 127.0.0.1 --port 4173 --strictPort',
      cwd: path.join(root, 'web'),
      url: 'http://127.0.0.1:4173',
      reuseExistingServer: !isCI,
      timeout: 120_000,
    },
  ],
});
