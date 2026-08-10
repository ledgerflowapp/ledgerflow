import { setupTestDatabase, seedTestFixtures, teardownTestDatabase } from "./test-helpers";

async function main() {
  const schemaName = process.env.DB_SCHEMA || "public";
  console.log(`Starting manual test database reset for schema: ${schemaName}`);
  
  await teardownTestDatabase(schemaName);
  await setupTestDatabase(schemaName);
  await seedTestFixtures(schemaName);
  
  console.log(`Manual test database reset complete.`);
  process.exit(0);
}

main().catch((err) => {
  console.error("Reset failed!", err);
  process.exit(1);
});
