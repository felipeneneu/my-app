"use server";

import { db } from "@/db";
import { projects, milestones, businessExpenses, tasks } from "@/db/schema";
import { eq, and, asc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { awardMilestoneDelivered } from "./gamification";

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

  if (newStatus === "delivered") {
    await awardMilestoneDelivered(id);
  }

  // Auto-advance deadlines when marking a milestone as done
  if (newStatus === "done") {
    await advanceProjectDeadlines(ms.projectId);
  }

  revalidatePath("/adm/[projectId]");
}

async function advanceProjectDeadlines(projectId: string) {
  const allProjectTasks = await db.select()
    .from(tasks)
    .where(and(eq(tasks.projectId, projectId), eq(tasks.completed, false)))
    .orderBy(asc(tasks.dueDate));

  if (allProjectTasks.length === 0) return;

  const today = new Date().toISOString().split("T")[0];

  // Group tasks by their original dueDate (same-day tasks form one "batch")
  const batches: { date: string; tasks: typeof allProjectTasks }[] = [];
  for (const task of allProjectTasks) {
    const existing = batches.find(b => b.date === task.dueDate);
    if (existing) {
      existing.tasks.push(task);
    } else {
      batches.push({ date: task.dueDate, tasks: [task] });
    }
  }

  // Compress remaining batches: keep relative spacing but start from today
  if (batches.length <= 1) return;

  const firstDate = new Date(batches[0].date);
  const lastDate = new Date(batches[batches.length - 1].date);
  const totalSpan = Math.max(1, Math.round((lastDate.getTime() - firstDate.getTime()) / 86400000));
  const daysPerBatch = Math.ceil(totalSpan / batches.length);

  for (let i = 0; i < batches.length; i++) {
    const newDate = new Date(today);
    newDate.setDate(newDate.getDate() + i * daysPerBatch);
    const dateStr = newDate.toISOString().split("T")[0];

    for (const task of batches[i].tasks) {
      await db.update(tasks)
        .set({ dueDate: dateStr })
        .where(eq(tasks.id, task.id));
    }
  }
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
