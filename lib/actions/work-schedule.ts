"use server";

import { db } from "@/db";
import { workSchedule } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

type ScheduleEntry = {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  blockType: "work" | "focus" | "meeting" | "break" | "unavailable";
};

export async function getWorkSchedule() {
  try {
    const result = await db
      .select()
      .from(workSchedule)
      .orderBy(workSchedule.dayOfWeek, workSchedule.startTime);
    return { success: true as const, data: result };
  } catch (error) {
    return { success: false as const, error: error instanceof Error ? error.message : "Erro ao buscar agenda" };
  }
}

export async function upsertWorkSchedule(entries: ScheduleEntry[]) {
  try {
    await db.delete(workSchedule);

    if (entries.length > 0) {
      await db.insert(workSchedule).values(
        entries.map(e => ({
          dayOfWeek: e.dayOfWeek,
          startTime: e.startTime,
          endTime: e.endTime,
          blockType: e.blockType,
        }))
      );
    }

    revalidatePath("/adm/settings/work-schedule");
    return { success: true as const };
  } catch (error) {
    return { success: false as const, error: error instanceof Error ? error.message : "Erro ao salvar agenda" };
  }
}

export async function deleteWorkSchedule(id: string) {
  try {
    await db.delete(workSchedule).where(eq(workSchedule.id, id));
    revalidatePath("/adm/settings/work-schedule");
    return { success: true as const };
  } catch (error) {
    return { success: false as const, error: error instanceof Error ? error.message : "Erro ao remover bloco" };
  }
}


