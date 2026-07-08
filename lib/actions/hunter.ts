"use server";

import { db } from "@/db";
import { hunterStatus, dailyQuests, notifications } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getHunterStatus() {
  const result = await db.select().from(hunterStatus).limit(1);
  return result[0] ?? null;
}

export async function createHunter(data: {
  strength: number;
  intelligence: number;
  wisdom: number;
}) {
  const existing = await db.select().from(hunterStatus).limit(1);
  if (existing.length > 0) return existing[0];

  const hunter = await db
    .insert(hunterStatus)
    .values({
      level: 1,
      currentXp: 0,
      maxXp: 100,
      goldBalance: 0,
      hunterRank: "E",
      strength: data.strength,
      intelligence: data.intelligence,
      wisdom: data.wisdom,
    })
    .returning();

  revalidatePath("/adm");
  return hunter[0];
}

export async function updateHunter(data: {
  level?: number;
  currentXp?: number;
  maxXp?: number;
  goldBalance?: number;
  hunterRank?: "E" | "D" | "C" | "B" | "A" | "S";
  strength?: number;
  intelligence?: number;
  wisdom?: number;
}) {
  const existing = await db.select().from(hunterStatus).limit(1);
  if (existing.length === 0) return null;

  const updated = await db
    .update(hunterStatus)
    .set(data)
    .where(eq(hunterStatus.id, existing[0].id))
    .returning();

  revalidatePath("/adm");
  revalidatePath("/adm/hunter-system");
  revalidatePath("/adm/growth");
  revalidatePath("/adm/profile");
  return updated[0];
}

export async function addXp(amount: number) {
  const existing = await db.select().from(hunterStatus).limit(1);
  if (existing.length === 0) return null;
  const h = existing[0];
  let newXp = h.currentXp + amount;
  let newLevel = h.level;
  const rankList = ["E", "D", "C", "B", "A", "S"] as const;
  let newRank = h.hunterRank;
  let maxXp = h.maxXp;

  while (newXp >= maxXp) {
    newXp -= maxXp;
    newLevel += 1;
    maxXp = Math.round(maxXp * 1.3);
    if (newLevel % 5 === 0) {
      const idx = rankList.indexOf(newRank as typeof rankList[number]);
      if (idx < rankList.length - 1) newRank = rankList[idx + 1];
    }
  }

  const updated = await db
    .update(hunterStatus)
    .set({ currentXp: newXp, level: newLevel, maxXp, hunterRank: newRank })
    .where(eq(hunterStatus.id, h.id))
    .returning();

  if (newLevel > h.level) {
    await db.insert(notifications).values({
      type: "system",
      title: "Level Up!",
      message: `Você subiu para o nível ${newLevel}! Rank atual: ${newRank}.`,
      priority: "high",
      read: false,
    });
  }

  revalidatePath("/adm/hunter-system");
  revalidatePath("/adm/growth");
  revalidatePath("/adm/profile");
  return updated[0];
}

export async function addGold(amount: number) {
  const existing = await db.select().from(hunterStatus).limit(1);
  if (existing.length === 0) return null;
  const updated = await db
    .update(hunterStatus)
    .set({ goldBalance: existing[0].goldBalance + amount })
    .where(eq(hunterStatus.id, existing[0].id))
    .returning();
  revalidatePath("/adm/hunter-system");
  revalidatePath("/adm/growth");
  return updated[0];
}

export async function getDailyQuests() {
  const result = await db.select().from(dailyQuests).where(eq(dailyQuests.completed, false));
  return result;
}

export async function completeQuest(questId: string) {
  const quest = await db.select().from(dailyQuests).where(eq(dailyQuests.id, questId)).then(r => r[0]);
  if (!quest) return null;
  const updated = await db
    .update(dailyQuests)
    .set({ completed: true, progressCurrent: quest.progressTarget })
    .where(eq(dailyQuests.id, questId))
    .returning();
  revalidatePath("/adm/hunter-system");
  return updated[0];
}