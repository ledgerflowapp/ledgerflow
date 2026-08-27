import { defineConfig, devices } from '@playwright/test';
import { loadEnvConfig } from '@next/env';
loadEnvConfig(process.cwd());
process.env.E2E_TEST = 'true';
import { env } from './src/env';

const workers = process.env.CI ? 2 : 2;

export default defineConfig({
    testDir: './e2e',
    globalSetup: require.resolve('./e2e/global-setup.ts'),
    fullyParallel: true,
    forbidOnly: !!env.CI,
    retries: env.CI ? 2 : 0,
    workers: workers,
    reporter: 'html',
    use: {
        trace: 'on-first-retry',
        screenshot: 'only-on-failure',
    },
    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },
    ],
    webServer: Array.from({ length: workers }).map((_, index) => ({
        command: `pnpm start --port 300${index}`,
        url: `http://127.0.0.1:300${index}`,
        reuseExistingServer: false,
        env: {
            E2E_TEST: 'true',
            TEST_PARALLEL_INDEX: `${index}`,
            BETTER_AUTH_URL: `http://127.0.0.1:300${index}`,
        },
    })),
});
