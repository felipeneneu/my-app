"use server";

import { db } from "@/db";
import { clients, projects, documents } from "@/db/schema";
import { eq, like, and, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export type Client = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  document: string | null;
  notes: string | null;
  createdAt: string;
};

export async function getClients() {
  return db.select().from(clients).orderBy(clients.name) as Promise<Client[]>;
}

export async function getClient(id: string) {
  return db.select().from(clients).where(eq(clients.id, id)).then(r => r[0] ?? null) as Promise<Client | null>;
}

export async function createClient(data: {
  name: string;
  email?: string;
  phone?: string;
  document?: string;
  notes?: string;
}) {
  const client = await db.insert(clients).values({
    name: data.name,
    email: data.email ?? null,
    phone: data.phone ?? null,
    document: data.document ?? null,
    notes: data.notes ?? null,
  }).returning() as unknown as Client[];

  revalidatePath("/adm");
  return client[0];
}

export async function updateClient(id: string, data: Partial<{
  name: string;
  email: string;
  phone: string;
  document: string;
  notes: string;
}>) {
  await db.update(clients).set(data).where(eq(clients.id, id));
  revalidatePath("/adm");
}

export async function deleteClient(id: string) {
  await db.delete(clients).where(eq(clients.id, id));
  revalidatePath("/adm");
}

export async function getClientProjects(clientId: string) {
  return db.select().from(projects).where(eq(projects.clientId, clientId));
}

export async function getClientBudgets(clientId: string) {
  const all = await db.select().from(documents).where(eq(documents.type, "budget"));
  return all.filter((d) => {
    try {
      const json = JSON.parse(d.contentJson);
      return json.clientId === clientId;
    } catch {
      return false;
    }
  });
}

export type ClientWithStats = Client & { projectCount: number; budgetCount: number };

export async function getClientsWithStats() {
  const allClients = await db.select().from(clients).orderBy(clients.name);
  const allProjects = await db.select({ clientId: projects.clientId }).from(projects);
  const allBudgetDocs = await db.select({ id: documents.id, contentJson: documents.contentJson }).from(documents).where(eq(documents.type, "budget"));

  const projectCounts: Record<string, number> = {};
  for (const p of allProjects) {
    if (p.clientId) projectCounts[p.clientId] = (projectCounts[p.clientId] ?? 0) + 1;
  }

  const budgetCounts: Record<string, number> = {};
  for (const b of allBudgetDocs) {
    try {
      const json = JSON.parse(b.contentJson);
      if (json.clientId) budgetCounts[json.clientId] = (budgetCounts[json.clientId] ?? 0) + 1;
    } catch { /* skip */ }
  }

  return allClients.map((c) => ({
    ...c,
    projectCount: projectCounts[c.id] ?? 0,
    budgetCount: budgetCounts[c.id] ?? 0,
  })) as ClientWithStats[];
}


