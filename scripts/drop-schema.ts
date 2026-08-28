import postgres from "postgres";

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("Error: DATABASE_URL is required");
    process.exit(1);
  }

  // Create a single connection to execute the drop/create queries
  const sql = postgres(url, { max: 1 });

  try {
    await sql`DROP SCHEMA IF EXISTS public CASCADE`;
    await sql`CREATE SCHEMA public`;
    console.log("Successfully dropped and recreated public schema.");
  } catch (error) {
    console.error("Failed to reset schema:", error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

main();
