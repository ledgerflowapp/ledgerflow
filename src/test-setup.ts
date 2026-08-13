/**
 * Vitest global test setup.
 * Ensures environment variables are populated from .env.test for unit test runs.
 */
import { loadEnvConfig } from '@next/env';

const projectDir = process.cwd();
loadEnvConfig(projectDir);



