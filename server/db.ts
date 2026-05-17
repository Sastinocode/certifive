import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "../shared/schema";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set. Did you forget to provision a database?");
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL.includes("railway.internal")
    ? false                           // Railway internal — sin SSL
    : { rejectUnauthorized: false },  // Neon / externo — SSL sin verificar cert
});

export const db = drizzle(pool, { schema });
