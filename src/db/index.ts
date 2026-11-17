import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

function createDb() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required to use the database.");
  }

  return drizzle(neon(databaseUrl), { schema });
}

let dbInstance: ReturnType<typeof createDb> | undefined;

export function getDb() {
  dbInstance ??= createDb();
  return dbInstance;
}
