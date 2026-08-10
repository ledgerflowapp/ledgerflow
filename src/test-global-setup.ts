import { setupTestDatabase, seedTestFixtures } from "./db/test-helpers";
import { loadEnvConfig } from "@next/env";

export default async function globalSetup() {
  loadEnvConfig(process.cwd());

  const timestamp = Date.now();
  // We use process.env.VITEST_WORKER_ID or similar if needed, but a global run timestamp is good.
  const schemaName = `test_run_${timestamp}`;

  // Store it in process.env so it's accessible.
  // Note: Playwright passes process.env modifications to workers natively.
  // For Vitest, we might need a workaround if process.env modifications don't propagate, 
  // but we can set it here for Playwright and single-threaded Vitest.
  process.env.DB_SCHEMA = schemaName;

  // For Vitest workers, write to a temp file since process.env doesn't propagate automatically
  const fs = await import("fs");
  const path = await import("path");
  fs.writeFileSync(path.join(process.cwd(), ".test-env"), `DB_SCHEMA=${schemaName}`);

  await setupTestDatabase(schemaName);
  await seedTestFixtures(schemaName);
}

export async function teardown() {
  const schemaName = process.env.DB_SCHEMA;
  if (schemaName) {
    const { teardownTestDatabase } = await import("./db/test-helpers");
    await teardownTestDatabase(schemaName);
  }

  const fs = await import("fs");
  const path = await import("path");
  const tempFile = path.join(process.cwd(), ".test-env");
  if (fs.existsSync(tempFile)) {
    fs.unlinkSync(tempFile);
  }
}
