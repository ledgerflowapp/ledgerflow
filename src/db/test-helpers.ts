import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import * as schema from "./schema";
import { env } from "@/env";
import { sql } from "drizzle-orm";
import * as fs from "fs";
import * as path from "path";

/**
 * Encapsulates inter-process communication for test environment schemas.
 * (e.g., passing dynamic schemas from global setup hooks to worker threads)
 */
export const TestEnv = {
  get path() {
    return path.join(process.cwd(), ".test-env");
  },
  writeSchema(schemaName: string) {
    fs.writeFileSync(this.path, `DB_SCHEMA=${schemaName}`);
  },
  readSchema(): string | undefined {
    if (fs.existsSync(this.path)) {
      const content = fs.readFileSync(this.path, "utf-8");
      const match = content.match(/DB_SCHEMA=(.+)/);
      return match ? match[1].trim() : undefined;
    }
    return undefined;
  },
  clean() {
    if (fs.existsSync(this.path)) {
      fs.unlinkSync(this.path);
    }
  },
};

/**
 * Instantiates a scoped Postgres client targeting a specific schema.
 */
function getScopedClient(schemaName: string) {
  return postgres(env.DATABASE_URL, {
    max: 1,
    onnotice: () => {},
    onconnect: async (s: any) => {
      await s.unsafe(`SET search_path TO "${schemaName}", public`);
    },
  } as any);
}

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
  const scopedClient = getScopedClient(schemaName);
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
  const seedClient = getScopedClient(schemaName);
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
