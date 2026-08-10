import { teardownTestDatabase } from "./db/test-helpers";
import { loadEnvConfig } from "@next/env";

export default async function globalTeardown() {
  loadEnvConfig(process.cwd());

  const schemaName = process.env.DB_SCHEMA;

  if (schemaName) {
    await teardownTestDatabase(schemaName);
  }

  const fs = await import("fs");
  const path = await import("path");
  const tempFile = path.join(process.cwd(), ".test-env");
  if (fs.existsSync(tempFile)) {
    fs.unlinkSync(tempFile);
  }
}
