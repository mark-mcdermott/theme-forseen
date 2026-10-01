import { defineConfig, devices } from '@playwright/test';

// A port of the tests' own: 3000 is whatever else happens to be running a dev server
const port = Number(process.env.TF_TEST_PORT ?? 5373);
const origin = `http://localhost:${port}`;

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: origin,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: `npx serve . -l ${port}`,
    // The fixtures themselves, so a server that is not this repository's is never mistaken for it
    url: `${origin}/tests/fixtures/`,
    reuseExistingServer: !process.env.CI,
  },
});
