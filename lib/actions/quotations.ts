"use server";

import { db } from "@/db";
import { leads } from "@/db/schema";
import { revalidatePath } from "next/cache";

export async function getLeads() {
  return db.select().from(leads);
}

export async function createLead(data: { businessName: string; email?: string; status?: string }) {
  await db.insert(leads).values({
    businessName: data.businessName,
    email: data.email,
    status: (data.status as any) ?? "new",
  });
  revalidatePath("/adm/quotations");
}
