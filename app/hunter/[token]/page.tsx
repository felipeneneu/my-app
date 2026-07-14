import { db } from "@/db";
import { personalAccessTokens, hunterStatus, dailyQuests, habits, achievements } from "@/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { notFound } from "next/navigation";
import { HunterMobileClient } from "./client";

export default async function HunterTokenPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  const pat = await db
    .select()
    .from(personalAccessTokens)
    .where(eq(personalAccessTokens.token, token))
    .then(r => r[0] ?? null);

  if (!pat) notFound();

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

  if (!hunter) notFound();

  return (
    <HunterMobileClient
      hunter={{
        level: hunter.level,
        currentXp: hunter.currentXp,
        maxXp: hunter.maxXp,
        goldBalance: hunter.goldBalance,
        hunterRank: hunter.hunterRank,
        strength: hunter.strength,
        intelligence: hunter.intelligence,
        wisdom: hunter.wisdom,
      }}
      quests={quests.map(q => ({
        id: q.id,
        description: q.description,
        progressCurrent: q.progressCurrent,
        progressTarget: q.progressTarget,
        completed: q.completed,
        type: q.type,
      }))}
      habits={habitList.map(h => ({
        id: h.id,
        label: h.label,
        attribute: h.attribute,
        xpReward: h.xpReward,
        goldReward: h.goldReward,
        category: h.category,
        done: h.done,
      }))}
      achievements={achievementList.map(a => ({
        id: a.id,
        name: a.name,
        description: a.description,
        conditionType: a.conditionType,
        conditionValue: a.conditionValue,
        xpBonus: a.xpBonus,
        icon: a.icon,
      }))}
    />
  );
}
