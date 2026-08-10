/**
 * Vitest global test setup.
 * Ensures environment variables are populated from .env.test for unit test runs.
 */
import { loadEnvConfig } from '@next/env';

const projectDir = process.cwd();
loadEnvConfig(projectDir);

import { TestEnv } from './db/test-helpers';

// Load DB_SCHEMA from temp file created by globalSetup if it exists
const testEnvSchema = TestEnv.readSchema();
if (testEnvSchema) {
  process.env.DB_SCHEMA = testEnvSchema;
}

