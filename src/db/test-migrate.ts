import { setupTestDatabase, seedTestFixtures } from "./test-helpers";

async function main() {
  const schemaName = process.env.DB_SCHEMA || "public";
  console.log(`Starting manual test database migration for schema: ${schemaName}`);
  
  await setupTestDatabase(schemaName);
  await seedTestFixtures(schemaName);
  
  console.log(`Manual test database migration complete.`);
  process.exit(0);
}

main().catch((err) => {
  console.error("Migration failed!", err);
  process.exit(1);
});
