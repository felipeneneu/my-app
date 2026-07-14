"use server";

import { db } from "@/db";
import { achievements } from "@/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { emitNotification } from "./notifications";

type ConditionType = "task_ontime" | "milestone_delivered" | "project_completed" | "phase_early" | "payment_received";

export async function getAchievements() {
  try {
    const result = await db.select().from(achievements);
    return { success: true as const, data: result };
  } catch (error) {
    return { success: false as const, error: error instanceof Error ? error.message : "Erro ao buscar achievements" };
  }
}

export async function createAchievement(data: {
  name: string;
  description?: string;
  conditionType: ConditionType;
  conditionValue: number;
  xpBonus: number;
  icon?: string;
}) {
  try {
    const [item] = await db
      .insert(achievements)
      .values({
        name: data.name,
        description: data.description ?? null,
        conditionType: data.conditionType,
        conditionValue: data.conditionValue,
        xpBonus: data.xpBonus,
        icon: data.icon ?? null,
      })
      .returning();

    return { success: true as const, data: item };
  } catch (error) {
    return { success: false as const, error: error instanceof Error ? error.message : "Erro ao criar achievement" };
  }
}

export async function deleteAchievement(id: string) {
  try {
    await db.delete(achievements).where(eq(achievements.id, id));
    return { success: true as const };
  } catch (error) {
    return { success: false as const, error: error instanceof Error ? error.message : "Erro ao remover achievement" };
  }
}

export async function checkAchievements(eventType: ConditionType, count: number) {
  try {
    const eligible = await db
      .select()
      .from(achievements)
      .where(
        and(
          eq(achievements.conditionType, eventType),
          eq(achievements.conditionValue, count),
          isNull(achievements.unlockedAt)
        )
      );

    for (const ach of eligible) {
      await db
        .update(achievements)
        .set({ unlockedAt: new Date().toISOString() })
        .where(eq(achievements.id, ach.id));

      await emitNotification(
        "system",
        "🏆 Achievement desbloqueado!",
        `"${ach.name}" — ${ach.description ?? "Continue assim!"} (+${ach.xpBonus} XP)`,
        "high"
      );
    }

    return { success: true as const, data: eligible };
  } catch (error) {
    return { success: false as const, error: error instanceof Error ? error.message : "Erro ao verificar achievements" };
  }
}
