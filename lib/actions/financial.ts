"use server";

import { db } from "@/db";
import { fixedCosts, businessExpenses, revenues, projects, workspaceConfig } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getFixedCosts() {
  return db.select().from(fixedCosts).where(eq(fixedCosts.active, true));
}

export async function addFixedCost(data: { label: string; amount: number; category: string }) {
  await db.insert(fixedCosts).values(data);
  revalidatePath("/adm/financial");
}

export async function deleteFixedCost(id: string) {
  await db.delete(fixedCosts).where(eq(fixedCosts.id, id));
  revalidatePath("/adm/financial");
}

export async function getProjectCosts() {
  return db.select().from(businessExpenses);
}

export async function addProjectCost(data: { projectId: string; label: string; amount: number; type: string }) {
  await db.insert(businessExpenses).values(data as any);
  revalidatePath("/adm/financial");
  revalidatePath("/adm/[projectId]");
}

export async function deleteProjectCost(id: string) {
  await db.delete(businessExpenses).where(eq(businessExpenses.id, id));
  revalidatePath("/adm/financial");
  revalidatePath("/adm/[projectId]");
}

export async function getRevenues() {
  return db.select().from(revenues);
}

export async function addRevenue(data: { projectId: string; label: string; amount: number }) {
  await db.insert(revenues).values(data);
  revalidatePath("/adm/financial");
}

export async function getProjectsForDropdown() {
  return db.select({ id: projects.id, name: projects.name }).from(projects);
}

export async function getMonthlyGoal() {
  const config = await db.select().from(workspaceConfig).limit(1).then(r => r[0]);
  return config?.monthlyGoal ?? 15000;
}
