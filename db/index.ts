import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import * as schema from "./schema";
import "dotenv/config";

const client = createClient({ url: process.env.TURSO_DB_URL ?? "file:local.db" });
export const db = drizzle({ client, schema, logger: true } as any);