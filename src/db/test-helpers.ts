import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import * as schema from "./schema";
import { env } from "@/env";
import { sql } from "drizzle-orm";

/**
 * Creates a dynamic schema, runs migrations against it, and returns the schema name.
 */
export async function setupTestDatabase(schemaName: string) {
  // Connect to the database without a specific schema first to create it
  const migrationClient = postgres(env.DATABASE_URL, { max: 1 });
  const db = drizzle(migrationClient);

  console.log(`[Test DB] Creating schema: ${schemaName}`);
  await db.execute(sql.raw(`CREATE SCHEMA IF NOT EXISTS "${schemaName}";`));

  // Now connect WITH the schema in the search path to run migrations
  const scopedClient = postgres(env.DATABASE_URL, {
    max: 1,
    onnotice: () => {},
    options: `-c search_path="${schemaName}",public`,
  });
  const scopedDb = drizzle(scopedClient);

  console.log(`[Test DB] Running migrations on schema: ${schemaName}...`);
  await migrate(scopedDb, { migrationsFolder: "./drizzle" });

  await scopedClient.end();
  await migrationClient.end();

  console.log(`[Test DB] Migrations complete for schema: ${schemaName}`);
  return schemaName;
}

/**
 * Seeds baseline fixtures required for tests to run (e.g., system roles, default settings).
 */
export async function seedTestFixtures(schemaName: string) {
  const seedClient = postgres(env.DATABASE_URL, {
    max: 1,
    onnotice: () => {},
    options: `-c search_path="${schemaName}",public`,
  });
  const db = drizzle(seedClient, { schema });

  console.log(`[Test DB] Seeding fixtures on schema: ${schemaName}...`);
  
  // TODO: Add any base seeding logic here, like:
  // await db.insert(schema.users).values({ id: 'test-admin', name: 'Admin' }).onConflictDoNothing();

  await seedClient.end();
  console.log(`[Test DB] Seeding complete for schema: ${schemaName}`);
}

/**
 * Drops the dynamic test schema to clean up after test execution.
 */
export async function teardownTestDatabase(schemaName: string) {
  const cleanupClient = postgres(env.DATABASE_URL, { max: 1 });
  const db = drizzle(cleanupClient);

  console.log(`[Test DB] Dropping schema: ${schemaName}...`);
  await db.execute(sql.raw(`DROP SCHEMA IF EXISTS "${schemaName}" CASCADE;`));

  await cleanupClient.end();
  console.log(`[Test DB] Teardown complete for schema: ${schemaName}`);
}
