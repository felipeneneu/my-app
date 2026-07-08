"use server";

import { db } from "@/db";
import { documents, companyInfo } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { emitNotification } from "./notifications";

export async function getContracts() {
  return db.select().from(documents).where(eq(documents.type, "contract")).orderBy(documents.id);
}

export async function getContract(id: string) {
  return db.select().from(documents).where(eq(documents.id, id)).then(r => r[0] ?? null);
}

export async function approveContract(contractId: string) {
  const contract = await db.select().from(documents).where(eq(documents.id, contractId)).then(r => r[0]);
  if (!contract) throw new Error("Contrato não encontrado");

  const data = JSON.parse(contract.contentJson);
  const company = await db.select().from(companyInfo).limit(1).then(r => r[0] ?? null);

  const receiptContent = {
    projectId: contract.projectId,
    clientName: data.clientName,
    clientDocument: data.clientDocument,
    totalPrice: data.totalPrice,
    scope: data.scope,
    company: company ? {
      tradingName: company.tradingName,
      document: company.document,
    } : null,
    status: "approved",
    approvedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  };

  const receipt = await db.insert(documents).values({
    projectId: contract.projectId,
    type: "receipt",
    contentJson: JSON.stringify(receiptContent),
  }).returning();

  await db.update(documents).set({
    contentJson: JSON.stringify({ ...data, status: "approved", approvedAt: new Date().toISOString() }),
  }).where(eq(documents.id, contractId));

  await emitNotification("info", "Contrato aprovado", `Contrato de "${data.clientName}" aprovado. Recibo gerado.`, "medium");

  revalidatePath("/adm/contract");
  revalidatePath("/adm/receipt");

  return { receipt: receipt[0] };
}
