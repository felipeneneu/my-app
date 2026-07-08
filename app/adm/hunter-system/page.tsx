import { getHunterStatus, getDailyQuests } from "@/lib/actions/hunter";
import { HunterSystemClient } from "./client";

export default async function HunterSystemPage() {
  const hunter = await getHunterStatus();
  const quests = await getDailyQuests();

  return (
    <HunterSystemClient
      hunter={hunter ? {
        level: hunter.level,
        currentXp: hunter.currentXp,
        maxXp: hunter.maxXp,
        goldBalance: hunter.goldBalance,
        hunterRank: hunter.hunterRank,
      } : { level: 1, currentXp: 0, maxXp: 100, goldBalance: 0, hunterRank: "E" }}
      quests={quests.map(q => ({
        id: q.id,
        description: q.description,
        progressCurrent: q.progressCurrent,
        progressTarget: q.progressTarget,
        completed: q.completed,
        type: q.type,
      }))}
    />
  );
}
