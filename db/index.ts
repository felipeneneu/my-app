import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import "dotenv/config";

const client = createClient({ url: process.env.TURSO_DB_URL ?? "file:local.db" });
export const db = drizzle({ client, logger: true });