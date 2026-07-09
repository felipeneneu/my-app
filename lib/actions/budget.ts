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

export async function createBudget(data: {
  clientName: string;
  clientDocument?: string;
  clientId?: string;
  scope: string;
  hours: number;
  hourlyRate: number;
  laborCost: number;
  extraCosts: number;
  totalPrice: number;
  estimatedCosts: number;
  deadline: string;
  deliverables: string[];
}) {
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

  const company = await db.select().from(companyInfo).limit(1).then(r => r[0] ?? null);

  const clientId = data.clientId || null;

  const project = await db.insert(projects).values({
    name: data.clientName,
    clientName: data.clientName,
    clientId,
    price: data.totalPrice,
    status: "active",
    startDate: new Date().toISOString().split("T")[0],
  }).returning();

  const tokenRaw = `${project[0].id}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const token = createHash("sha256").update(tokenRaw).digest("hex").slice(0, 32);

  await db.insert(projectTokens).values({ projectId: project[0].id, token });

  const contractContent = {
    projectId: project[0].id,
    clientName: data.clientName,
    clientDocument: data.clientDocument,
    scope: data.scope,
    hours: data.hours,
    hourlyRate: data.hourlyRate,
    laborCost: data.laborCost,
    extraCosts: data.extraCosts,
    totalPrice: data.totalPrice,
    estimatedCosts: data.estimatedCosts,
    deadline: data.deadline,
    deliverables: data.deliverables,
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

  await emitNotification("info", "Orçamento aprovado", `Orçamento para "${data.clientName}" aprovado. Contrato e projeto criados.`, "medium");

  revalidatePath("/adm/budget");
  revalidatePath("/adm/contract");
  revalidatePath("/adm");

  return { project: project[0], contract: contract[0], token };
}
