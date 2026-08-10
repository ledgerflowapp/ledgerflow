import { setupTestDatabase, seedTestFixtures, TestEnv, teardownTestDatabase } from "./db/test-helpers";
import { loadEnvConfig } from "@next/env";

export default async function globalSetup() {
  loadEnvConfig(process.cwd());

  const timestamp = Date.now();
  const schemaName = `test_run_${timestamp}`;

  process.env.DB_SCHEMA = schemaName;
  TestEnv.writeSchema(schemaName);

  await setupTestDatabase(schemaName);
  await seedTestFixtures(schemaName);

  // Return teardown function so Playwright automatically registers it
  return async () => {
    await teardown();
  };
}

export async function teardown() {
  const schemaName = process.env.DB_SCHEMA || TestEnv.readSchema();
  if (schemaName) {
    await teardownTestDatabase(schemaName);
  }
  TestEnv.clean();
}
