import { getHunterStatus } from "@/lib/actions/hunter";
import { getTodaysHabits } from "@/lib/actions/growth";
import { GrowthClient } from "./client";

export default async function GrowthPage() {
  const hunter = await getHunterStatus();
  const habits = await getTodaysHabits();

  return (
    <GrowthClient
      hunter={hunter ? {
        level: hunter.level,
        currentXp: hunter.currentXp,
        maxXp: hunter.maxXp,
        goldBalance: hunter.goldBalance,
        strength: hunter.strength,
        intelligence: hunter.intelligence,
        wisdom: hunter.wisdom,
      } : { level: 1, currentXp: 0, maxXp: 100, goldBalance: 0, strength: 10, intelligence: 10, wisdom: 10 }}
      habits={habits.map(h => ({
        id: h.id,
        label: h.label,
        attribute: h.attribute as "STR" | "INT" | "WIS",
        xpReward: h.xpReward,
        goldReward: h.goldReward,
        category: h.category,
        done: h.done,
      }))}
    />
  );
}

