"use server";

import { db } from "@/db";
import { leads, clients } from "@/db/schema";
import { eq, desc, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export type PipelineLead = {
  id: string;
  businessName: string;
  email: string | null;
  phone: string | null;
  status: "new" | "contacted" | "negotiating" | "won" | "lost";
  pipelineStage: "hot" | "warm" | "cold" | null;
  notes: string | null;
  lastContact: string | null;
  contactsCount: number;
  createdAt: string;
};

export type PipelineStats = {
  hot: number;
  warm: number;
  cold: number;
  won: number;
  lost: number;
  total: number;
};

export async function getPipelineLeads() {
  return db
    .select()
    .from(leads)
    .where(sql`${leads.pipelineStage} IS NOT NULL`)
    .orderBy(desc(leads.lastContact)) as Promise<PipelineLead[]>;
}

export async function getPipelineStats() {
  const rows = await db
    .select({
      stage: sql<string>`CASE 
        WHEN ${leads.status} = 'won' THEN 'won'
        WHEN ${leads.status} = 'lost' THEN 'lost'
        ELSE ${leads.pipelineStage}
      END`,
      count: sql<number>`count(*)`,
    })
    .from(leads)
    .groupBy(
      sql`CASE 
        WHEN ${leads.status} = 'won' THEN 'won'
        WHEN ${leads.status} = 'lost' THEN 'lost'
        ELSE ${leads.pipelineStage}
      END`
    );

  const stats: PipelineStats = { hot: 0, warm: 0, cold: 0, won: 0, lost: 0, total: 0 };
  for (const r of rows) {
    if (r.stage === "hot") stats.hot = r.count;
    else if (r.stage === "warm") stats.warm = r.count;
    else if (r.stage === "cold") stats.cold = r.count;
    else if (r.stage === "won") stats.won = r.count;
    else if (r.stage === "lost") stats.lost = r.count;
    stats.total += r.count;
  }
  return stats;
}

export async function createPipelineLead(data: {
  businessName: string;
  email?: string;
  phone?: string;
  pipelineStage?: string;
}) {
  const stage = data.pipelineStage ?? null;
  const validStage =
    stage && ["hot", "warm", "cold"].includes(stage)
      ? (stage as "hot" | "warm" | "cold")
      : null;

  const lead = await db
    .insert(leads)
    .values({
      businessName: data.businessName,
      email: data.email ?? null,
      phone: data.phone ?? null,
      pipelineStage: validStage,
      status: "new",
    })
    .returning() as unknown as PipelineLead[];

  revalidatePath("/adm/pipeline");
  return lead[0];
}

export async function updatePipelineStage(
  id: string,
  stage: "hot" | "warm" | "cold" | "won" | "lost"
) {
  if (stage === "won" || stage === "lost") {
    await db
      .update(leads)
      .set({ pipelineStage: null, status: stage })
      .where(eq(leads.id, id));
  } else {
    await db
      .update(leads)
      .set({ pipelineStage: stage, status: "new" })
      .where(eq(leads.id, id));
  }
  revalidatePath("/adm/pipeline");
}

export async function logContact(id: string, note: string) {
  const existing = await db
    .select()
    .from(leads)
    .where(eq(leads.id, id))
    .then((r) => r[0]);

  if (!existing) return;

  const now = new Date().toISOString();
  const updatedNotes = note
    ? [existing.notes, `[${now}] ${note}`].filter(Boolean).join("\n")
    : existing.notes;

  await db
    .update(leads)
    .set({
      lastContact: now,
      contactsCount: (existing.contactsCount ?? 0) + 1,
      notes: updatedNotes,
    })
    .where(eq(leads.id, id));

  revalidatePath("/adm/pipeline");
}

export async function deletePipelineLead(id: string) {
  await db.delete(leads).where(eq(leads.id, id));
  revalidatePath("/adm/pipeline");
}

export async function convertToClient(leadId: string) {
  const lead = await db
    .select()
    .from(leads)
    .where(eq(leads.id, leadId))
    .then((r) => r[0]);

  if (!lead) throw new Error("Lead not found");

  const client = await db
    .insert(clients)
    .values({
      name: lead.businessName,
      email: lead.email,
      phone: lead.phone,
      notes: lead.notes,
    })
    .returning() as unknown as {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    notes: string | null;
    createdAt: string;
  }[];

  await db
    .update(leads)
    .set({ pipelineStage: null, status: "won" })
    .where(eq(leads.id, leadId));

  revalidatePath("/adm/pipeline");
  revalidatePath("/adm");
  return client[0];
}
