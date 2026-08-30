/**
 * Vitest global test setup.
 * Ensures environment variables are populated from .env.test for unit test runs.
 */
import { loadEnvConfig } from '@next/env';

const projectDir = process.cwd();
loadEnvConfig(projectDir);

import { vi } from 'vitest';

vi.mock('next/font/google', () => ({
  Inter: () => ({ className: 'font-inter', variable: '--font-inter' }),
  Plus_Jakarta_Sans: () => ({ className: 'font-jakarta', variable: '--font-jakarta' }),
  Geist_Mono: () => ({ className: 'font-geist-mono', variable: '--font-geist-mono' }),
}));
