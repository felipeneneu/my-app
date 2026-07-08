"use server";

import { db } from "@/db";
import { leads, documents, leadStatus } from "@/db/schema";
import { revalidatePath } from "next/cache";

export async function getLeads() {
  return db.select().from(leads);
}

export async function createLead(data: { businessName: string; email?: string; status?: string }) {
  await db.insert(leads).values({
    businessName: data.businessName,
    email: data.email,
    status: (data.status ?? "new") as (typeof leadStatus)[number],
  });
  revalidatePath("/adm/quotations");
}

export async function generateQuotationPDF(data: {
  clientName: string;
  clientDocument?: string;
  scope: string;
  hours: number;
  hourlyRate: number;
  extraCosts: number;
  totalPrice: number;
  deadline: string;
}) {
  return { ...data, generatedAt: new Date().toISOString(), id: crypto.randomUUID() };
}

export async function generateOS(data: {
  projectId: string;
  clientName: string;
  scope: string;
  deadline: string;
  price: number;
  deliverables: string[];
}) {
  return { ...data, generatedAt: new Date().toISOString(), id: crypto.randomUUID() };
}

export async function saveDocument(projectId: string, type: "contract" | "invoice" | "proposal" | "budget" | "receipt" | "os", content: unknown) {
  await db.insert(documents).values({
    projectId,
    type: type as "contract" | "invoice" | "proposal" | "budget" | "receipt" | "os",
    contentJson: JSON.stringify(content),
  });
  revalidatePath("/adm");
  revalidatePath(`/adm/${projectId}`);
}
