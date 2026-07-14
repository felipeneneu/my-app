"use server";

import { db } from "@/db";
import { standardFases } from "@/db/schema";
import { DEFAULT_FASES } from "@/lib/seed-fases";
import { revalidatePath } from "next/cache";

export async function seedDefaultFases() {
  const existing = await db.select().from(standardFases).limit(1);
  if (existing.length > 0) return { seeded: false, count: 0 };

  for (const f of DEFAULT_FASES) {
    await db.insert(standardFases).values(f);
  }

  revalidatePath("/testadm/budget/new");
  return { seeded: true, count: DEFAULT_FASES.length };
}
