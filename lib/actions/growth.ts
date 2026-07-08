"use server";

import { db } from "@/db";
import { habits, hunterStatus } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getHunterStatus, addXp, addGold } from "./hunter";

export async function getTodaysHabits() {
  const today = new Date().toISOString().split("T")[0];
  const result = await db.select().from(habits).where(eq(habits.date, today));
  return result;
}

export async function createHabit(data: {
  label: string;
  attribute: "STR" | "INT" | "WIS";
  xpReward?: number;
  goldReward?: number;
  category?: string;
}) {
  const today = new Date().toISOString().split("T")[0];
  await db.insert(habits).values({ ...data, date: today });
  revalidatePath("/adm/growth");
}

export async function toggleHabit(habitId: string) {
  const habit = await db.select().from(habits).where(eq(habits.id, habitId)).then(r => r[0]);
  if (!habit) return null;

  const nowDone = !habit.done;
  if (nowDone) {
    await addXp(habit.xpReward);
    await addGold(habit.goldReward);
  }

  await db.update(habits).set({ done: nowDone }).where(eq(habits.id, habitId));
  revalidatePath("/adm/growth");
  revalidatePath("/adm/hunter-system");
  return { ...habit, done: nowDone };
}

export async function resetHabits() {
  const today = new Date().toISOString().split("T")[0];
  await db.update(habits).set({ done: false }).where(eq(habits.date, today));
  revalidatePath("/adm/growth");
}
