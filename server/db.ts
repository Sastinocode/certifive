import { drizzle } from "drizzle-orm/node-postgres";
import pkg from "pg";
const { Pool } = pkg;
import * as schema from "../shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set. Did you forget to provision a database?");
}

const isExternalUrl = process.env.DATABASE_URL.includes("proxy.rlwy.net");
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: isExternalUrl ? { rejectUnauthorized: false } : false,
});
export const db = drizzle(pool, { schema });