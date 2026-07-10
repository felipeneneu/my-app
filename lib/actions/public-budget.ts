"use server";

import { db } from "@/db";
import { documents } from "@/db/schema";
import { eq } from "drizzle-orm";
import { approveBudget } from "./budget";

export async function getPublicBudget(id: string) {
  const budget = await db.select().from(documents).where(eq(documents.id, id)).then(r => r[0] ?? null);
  if (!budget) return null;

  const data = JSON.parse(budget.contentJson);
  return {
    id: budget.id,
    status: data.status,
    approvedAt: data.approvedAt ?? null,
    data,
  };
}

export async function approvePublicBudget(budgetId: string) {
  const budget = await db.select().from(documents).where(eq(documents.id, budgetId)).then(r => r[0] ?? null);
  if (!budget) throw new Error("Orçamento não encontrado");

  const data = JSON.parse(budget.contentJson);
  if (data.status !== "pending") throw new Error("Orçamento já foi processado");

  return approveBudget(budgetId);
}
