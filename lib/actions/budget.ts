"use server";

import { db } from "@/db";
import { documents, projects, clients, projectTokens, companyInfo } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { emitNotification } from "./notifications";
import { createHash } from "crypto";

export async function getBudgets() {
  return db.select().from(documents).where(eq(documents.type, "budget")).orderBy(documents.id);
}

export async function getBudget(id: string) {
  return db.select().from(documents).where(eq(documents.id, id)).then(r => r[0] ?? null);
}

export async function createBudget(data: Record<string, any>) {
  const doc = await db.insert(documents).values({
    projectId: undefined as any,
    type: "budget",
    contentJson: JSON.stringify({ ...data, status: "pending", createdAt: new Date().toISOString() }),
  }).returning();

  revalidatePath("/adm/budget");
  return doc[0];
}

export async function approveBudget(budgetId: string) {
  const budget = await db.select().from(documents).where(eq(documents.id, budgetId)).then(r => r[0]);
  if (!budget) throw new Error("Orçamento não encontrado");

  const data = JSON.parse(budget.contentJson);
  const updated = { ...data, status: "approved", approvedAt: new Date().toISOString() };

  // Handle both old flat format and new proposal format
  const isProposal = data.configuracoes_layout !== undefined;
  const clientName = isProposal ? data.proposta?.capa?.metadados?.cliente ?? "Cliente" : data.clientName;
  const clientId = isProposal ? data.clientId : (data.clientId || null);
  const totalPrice = isProposal ? (data.totalPrice ?? 0) : data.totalPrice;
  const deliverables = isProposal ? [] : (data.deliverables ?? []);

  const company = await db.select().from(companyInfo).limit(1).then(r => r[0] ?? null);

  const project = await db.insert(projects).values({
    name: clientName,
    clientName,
    clientId,
    price: Math.round(totalPrice),
    status: "active",
    startDate: new Date().toISOString().split("T")[0],
  }).returning();

  const tokenRaw = `${project[0].id}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const token = createHash("sha256").update(tokenRaw).digest("hex").slice(0, 32);

  await db.insert(projectTokens).values({ projectId: project[0].id, token });

  const contractContent = {
    projectId: project[0].id,
    clientName,
    clientDocument: isProposal ? "" : data.clientDocument,
    totalPrice,
    deliverables,
    scope: isProposal ? data.proposta?.etapas?.map((e: any) => e.titulo).join(", ") : data.scope,
    deadline: data.deadline ?? "30 dias corridos",
    company: company ? {
      tradingName: company.tradingName,
      document: company.document,
      street: company.street,
      number: company.number,
      neighborhood: company.neighborhood,
      city: company.city,
      state: company.state,
    } : null,
    status: "pending",
    createdAt: new Date().toISOString(),
  };

  const contract = await db.insert(documents).values({
    projectId: project[0].id,
    type: "contract",
    contentJson: JSON.stringify(contractContent),
  }).returning();

  await db.update(documents).set({
    projectId: project[0].id,
    contentJson: JSON.stringify(updated),
  }).where(eq(documents.id, budgetId));

  await emitNotification("info", "Orçamento aprovado", `Orçamento para "${clientName}" aprovado. Contrato e projeto criados.`, "medium");

  revalidatePath("/adm/budget");
  revalidatePath("/adm/contract");
  revalidatePath("/adm");

  return { project: project[0], contract: contract[0], token };
}
