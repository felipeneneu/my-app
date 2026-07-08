"use server";

import { db } from "@/db";
import { clients } from "@/db/schema";
import { eq } from "drizzle-orm";
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
