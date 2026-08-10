import { defineConfig, devices } from '@playwright/test';
import { loadEnvConfig } from '@next/env';
loadEnvConfig(process.cwd());
import { env } from './src/env';

const PORT = env.PORT || 3005;

export default defineConfig({
    testDir: './e2e',
    globalSetup: './src/test-global-setup.ts',
    fullyParallel: true,
    forbidOnly: !!env.CI,
    retries: env.CI ? 2 : 0,
    workers: env.CI ? 1 : undefined,
    reporter: 'html',
    use: {
        baseURL: `http://localhost:${PORT}`,
        trace: 'on-first-retry',
    },
    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },
    ],
    webServer: {
        command: `PORT=${PORT} pnpm run dev`,
        url: `http://localhost:${PORT}`,
        reuseExistingServer: false,
    },
});
