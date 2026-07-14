"use server";

import { db } from "@/db";
import { clientContacts } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export type ClientContact = {
  id: string;
  clientId: string;
  type: "call" | "email" | "meeting" | "note" | "other";
  subject: string;
  description: string | null;
  createdAt: string;
};

export async function getClientContacts(clientId: string) {
  return db
    .select()
    .from(clientContacts)
    .where(eq(clientContacts.clientId, clientId))
    .orderBy(desc(clientContacts.createdAt)) as Promise<ClientContact[]>;
}

export async function createClientContact(data: {
  clientId: string;
  type: "call" | "email" | "meeting" | "note" | "other";
  subject: string;
  description?: string;
}) {
  await db.insert(clientContacts).values({
    clientId: data.clientId,
    type: data.type,
    subject: data.subject,
    description: data.description ?? null,
  });
  revalidatePath(`/adm/clients/${data.clientId}`);
}

export async function deleteClientContact(id: string, clientId: string) {
  await db.delete(clientContacts).where(eq(clientContacts.id, id));
  revalidatePath(`/adm/clients/${clientId}`);
}
