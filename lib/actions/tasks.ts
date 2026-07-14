"use server";

import { db } from "@/db";
import { tasks } from "@/db/schema";
import { and, eq, gt } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { awardTaskCompletedOnTime } from "./gamification";

const schema = z.object({
  title: z.string().min(1, "O nome da tarefa é obrigatório"),
  projectId: z.string().min(1, "Selecione um projeto"),
  blockType: z.enum(["deep_focus", "meeting", "deadline", "design", "admin"]),
  dueDate: z.string().min(1, "A data de entrega é obrigatória"),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
});

export async function getTasks() {
  const result = await db.select().from(tasks);
  return result;
}

export async function updateTaskStatus(id: string, completed: boolean) {
  const task = await db.select().from(tasks).where(eq(tasks.id, id)).then(r => r[0] ?? null);
  if (!task) return;

  await db.update(tasks).set({ completed }).where(eq(tasks.id, id));

  if (completed && task.dueDate >= new Date().toISOString().split("T")[0]) {
    await awardTaskCompletedOnTime(id);
  }

  revalidatePath("/adm");
  revalidatePath("/adm/calendar");
}

export async function createTask(prevState: unknown, formData: FormData) {
  const raw = Object.fromEntries(formData);
  const parsed = schema.safeParse(raw);

  if (!parsed.success) {
    return { success: false as const, error: parsed.error.flatten().fieldErrors };
  }

  await db.insert(tasks).values(parsed.data);
  revalidatePath("/adm");
  return { success: true as const };
}

function addBusinessDays(date: Date, days: number): Date {
  const result = new Date(date);
  let remaining = Math.abs(days);
  const direction = days >= 0 ? 1 : -1;
  while (remaining > 0) {
    result.setDate(result.getDate() + direction);
    if (result.getDay() !== 0 && result.getDay() !== 6) {
      remaining--;
    }
  }
  return result;
}

export async function skipDay(date: string) {
  try {
    await db.delete(tasks).where(
      and(eq(tasks.dueDate, date), eq(tasks.completed, false))
    );

    const futureTasks = await db
      .select()
      .from(tasks)
      .where(
        and(gt(tasks.dueDate, date), eq(tasks.completed, false))
      );

    for (const task of futureTasks) {
      const newDate = addBusinessDays(new Date(task.dueDate), 1);
      await db.update(tasks)
        .set({ dueDate: newDate.toISOString().split("T")[0] })
        .where(eq(tasks.id, task.id));
    }

    revalidatePath("/adm/calendar");
    revalidatePath("/adm");
    return { success: true as const };
  } catch (error) {
    return { success: false as const, error: error instanceof Error ? error.message : "Erro ao pular dia" };
  }
}

export async function advanceProjectDeadlines(projectId: string, daysToAdvance: number) {
  try {
    const pendingTasks = await db
      .select()
      .from(tasks)
      .where(and(eq(tasks.projectId, projectId), eq(tasks.completed, false)))
      .orderBy(tasks.dueDate);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (const task of pendingTasks) {
      const newDate = addBusinessDays(new Date(task.dueDate), -daysToAdvance);
      if (newDate < today) newDate.setTime(today.getTime());
      await db.update(tasks)
        .set({ dueDate: newDate.toISOString().split("T")[0] })
        .where(eq(tasks.id, task.id));
    }

    revalidatePath("/adm/calendar");
    revalidatePath("/adm");
    return { success: true as const };
  } catch (error) {
    return { success: false as const, error: error instanceof Error ? error.message : "Erro ao adiantar prazos" };
  }
}