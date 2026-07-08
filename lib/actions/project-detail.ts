"use server";

import { db } from "@/db";
import { projects, milestones, businessExpenses } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getProject(id: string) {
  const project = await db.select().from(projects).where(eq(projects.id, id)).then(r => r[0]);
  return project ?? null;
}

export async function getMilestones(projectId: string) {
  return db.select().from(milestones).where(eq(milestones.projectId, projectId));
}

export async function addMilestone(projectId: string, label: string) {
  await db.insert(milestones).values({ projectId, label });
  revalidatePath("/adm/[projectId]");
}

export async function toggleMilestoneStatus(id: string, key: "done" | "delivered") {
  const ms = await db.select().from(milestones).where(eq(milestones.id, id)).then(r => r[0]);
  if (!ms) return;
  const newStatus = key === "done"
    ? (ms.status === "done" ? "pending" : "done")
    : (ms.status === "delivered" ? "done" : "delivered");
  await db.update(milestones).set({ status: newStatus }).where(eq(milestones.id, id));
  revalidatePath("/adm/[projectId]");
}

export async function getProjectExpenses(projectId: string) {
  return db.select().from(businessExpenses).where(eq(businessExpenses.projectId, projectId));
}

export async function addProjectExpense(projectId: string, data: { label: string; amount: number }) {
  await db.insert(businessExpenses).values({
    projectId,
    description: data.label,
    amount: data.amount,
    type: "variable",
  });
  revalidatePath("/adm/[projectId]");
  revalidatePath("/adm/financial");
}

export async function deleteProjectExpense(id: string) {
  await db.delete(businessExpenses).where(eq(businessExpenses.id, id));
  revalidatePath("/adm/[projectId]");
  revalidatePath("/adm/financial");
}
