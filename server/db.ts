// database connection setup
// uses postgres via drizzle ORM — needs DATABASE_URL env var
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  console.warn(
    "⚠️  DATABASE_URL not set — database features won't work. Set it to a Postgres connection string."
  );
}

export const pool = process.env.DATABASE_URL
  ? new Pool({ connectionString: process.env.DATABASE_URL })
  : (null as any);

export const db = process.env.DATABASE_URL
  ? drizzle(pool, { schema })
  : (null as any);
