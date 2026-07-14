"use server";

import { db } from "@/db";
import { addresses } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export type Address = {
  id: string;
  clientId: string;
  label: string;
  cep: string | null;
  street: string | null;
  number: string | null;
  neighborhood: string | null;
  city: string | null;
  state: string | null;
  createdAt: string;
};

export async function getClientAddresses(clientId: string) {
  return db
    .select()
    .from(addresses)
    .where(eq(addresses.clientId, clientId))
    .orderBy(addresses.createdAt) as Promise<Address[]>;
}

export async function createAddress(data: {
  clientId: string;
  label?: string;
  cep?: string;
  street?: string;
  number?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
}) {
  await db.insert(addresses).values({
    clientId: data.clientId,
    label: data.label ?? "Principal",
    cep: data.cep ?? null,
    street: data.street ?? null,
    number: data.number ?? null,
    neighborhood: data.neighborhood ?? null,
    city: data.city ?? null,
    state: data.state ?? null,
  });
  revalidatePath(`/adm/clients/${data.clientId}`);
}

export async function updateAddress(id: string, clientId: string, data: Partial<{
  label: string;
  cep: string;
  street: string;
  number: string;
  neighborhood: string;
  city: string;
  state: string;
}>) {
  await db.update(addresses).set(data).where(eq(addresses.id, id));
  revalidatePath(`/adm/clients/${clientId}`);
}

export async function deleteAddress(id: string, clientId: string) {
  await db.delete(addresses).where(eq(addresses.id, id));
  revalidatePath(`/adm/clients/${clientId}`);
}
