import { loadEnvConfig } from "@next/env";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";

export default async function globalSetup() {
  loadEnvConfig(process.cwd());

  const workers = process.env.CI ? 2 : 2;
  const baseUrl = process.env.DATABASE_URL;
  
  if (!baseUrl) {
    throw new Error("DATABASE_URL is required in .env.test");
  }

  const adminClient = postgres(baseUrl, { max: 1 });

  for (let i = 0; i < workers; i++) {
    const dbName = `test_db_worker_${i}`;
    console.log(`[Global Setup] Provisioning database: ${dbName}`);

    await adminClient.unsafe(`DROP DATABASE IF EXISTS "${dbName}" WITH (FORCE);`);
    await adminClient.unsafe(`CREATE DATABASE "${dbName}";`);

    const workerUrl = new URL(baseUrl);
    workerUrl.pathname = `/${dbName}`;

    const migrationClient = postgres(workerUrl.toString(), { max: 1 });
    const db = drizzle(migrationClient);

    console.log(`[Global Setup] Running migrations for ${dbName}...`);
    await migrate(db, { migrationsFolder: "./drizzle" });
    
    await migrationClient.end();
  }

  await adminClient.end();
}
