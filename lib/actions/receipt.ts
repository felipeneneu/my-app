"use server";

import { db } from "@/db";
import { documents } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function getReceipts() {
  return db.select().from(documents).where(eq(documents.type, "receipt")).orderBy(documents.id);
}

export async function getReceipt(id: string) {
  return db.select().from(documents).where(eq(documents.id, id)).then(r => r[0] ?? null);
}
