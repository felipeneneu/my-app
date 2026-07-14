"use server";

import { db } from "@/db";
import { personalAccessTokens, hunterStatus, dailyQuests, habits, achievements } from "@/db/schema";
import { eq, isNull } from "drizzle-orm";
import { createHash } from "crypto";

export async function generateAccessToken(name?: string) {
  try {
    const raw = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    const token = createHash("sha256").update(raw).digest("hex").slice(0, 32);

    await db.insert(personalAccessTokens).values({
      token,
      name: name ?? "Mobile Access",
    });

    return { success: true as const, data: { token, url: `/hunter/${token}` } };
  } catch (error) {
    return { success: false as const, error: error instanceof Error ? error.message : "Erro ao gerar token" };
  }
}

export async function getHunterDataByToken(token: string) {
  try {
    const pat = await db
      .select()
      .from(personalAccessTokens)
      .where(eq(personalAccessTokens.token, token))
      .then(r => r[0] ?? null);

    if (!pat) {
      return { success: false as const, error: "Token inválido" };
    }

    await db
      .update(personalAccessTokens)
      .set({ lastUsedAt: new Date().toISOString() })
      .where(eq(personalAccessTokens.id, pat.id));

    const hunter = await db.select().from(hunterStatus).limit(1).then(r => r[0] ?? null);
    const quests = await db.select().from(dailyQuests).where(eq(dailyQuests.completed, false));
    const habitList = await db.select().from(habits);
    const achievementList = await db
      .select()
      .from(achievements)
      .where(isNull(achievements.unlockedAt));

    return {
      success: true as const,
      data: { hunter, quests, habits: habitList, achievements: achievementList },
    };
  } catch (error) {
    return { success: false as const, error: error instanceof Error ? error.message : "Erro ao buscar dados do hunter" };
  }
}
