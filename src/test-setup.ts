/**
 * Vitest global test setup.
 * Ensures environment variables are populated from .env.test for unit test runs.
 */
import { loadEnvConfig } from '@next/env';

const projectDir = process.cwd();
loadEnvConfig(projectDir);

import * as fs from 'fs';
import * as path from 'path';

// Load DB_SCHEMA from temp file created by globalSetup if it exists
const testEnvPath = path.join(projectDir, '.test-env');
if (fs.existsSync(testEnvPath)) {
  const content = fs.readFileSync(testEnvPath, 'utf-8');
  const match = content.match(/DB_SCHEMA=(.+)/);
  if (match) {
    process.env.DB_SCHEMA = match[1].trim();
  }
}

