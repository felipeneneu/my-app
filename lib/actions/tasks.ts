"use server";

import { db } from "@/db";
import { tasks } from "@/db/schema";
import { revalidatePath } from "next/cache";
import { z } from "zod";

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