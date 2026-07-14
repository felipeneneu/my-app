"use server";

import { addXp } from "./hunter";
import { checkAchievements } from "./achievements";

export async function awardTaskCompletedOnTime(_taskId: string) {
  try {
    await addXp(50);
    await checkAchievements("task_ontime", 1);
    return { success: true as const };
  } catch (error) {
    return { success: false as const, error: error instanceof Error ? error.message : "Erro ao conceder XP" };
  }
}

export async function awardMilestoneDelivered(_milestoneId: string) {
  try {
    await addXp(150);
    await checkAchievements("milestone_delivered", 1);
    return { success: true as const };
  } catch (error) {
    return { success: false as const, error: error instanceof Error ? error.message : "Erro ao conceder XP" };
  }
}

export async function awardProjectCompleted(_projectId: string) {
  try {
    await addXp(500);
    await checkAchievements("project_completed", 1);
    return { success: true as const };
  } catch (error) {
    return { success: false as const, error: error instanceof Error ? error.message : "Erro ao conceder XP" };
  }
}

export async function awardPhaseEarly(_phaseName: string) {
  try {
    await addXp(100);
    await checkAchievements("phase_early", 1);
    return { success: true as const };
  } catch (error) {
    return { success: false as const, error: error instanceof Error ? error.message : "Erro ao conceder XP" };
  }
}

export async function awardPaymentReceived() {
  try {
    await addXp(30);
    await checkAchievements("payment_received", 1);
    return { success: true as const };
  } catch (error) {
    return { success: false as const, error: error instanceof Error ? error.message : "Erro ao conceder XP" };
  }
}
