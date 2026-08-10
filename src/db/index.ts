import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

import { env } from "@/env";

const connectionString = env.DATABASE_URL;

const isTest = process.env.NODE_ENV === "test";
const schemaName = env.DB_SCHEMA;

const postgresOptions: postgres.Options<{}> = { prepare: false };

if (isTest && schemaName) {
  postgresOptions.onnotice = () => {};
  postgresOptions.options = `-c search_path="${schemaName}",public`;
}

// Disable prefetch in serverless/Next.js environments
export const client = postgres(connectionString, postgresOptions);

export const db = drizzle(client, { schema });

export type DB = typeof db;
