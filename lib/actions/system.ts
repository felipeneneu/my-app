"use server";

import { db } from "@/db";
import {
  clients, leads, projects, tasks, fixedCosts, revenues,
  habits, checklistTemplates, workspaceConfig, hunterStatus,
  dailyQuests, notifications, milestones, businessExpenses,
  documents, checklistTemplateItems, projectChecklistItems,
} from "@/db/schema";
import { count } from "drizzle-orm";

export type SystemHealth = {
  status: string;
  recordCounts: Record<string, number>;
  lastExportAt: string | null;
};

export type BackupData = {
  version: number;
  exportedAt: string;
  data: Record<string, unknown[]>;
};

export async function getSystemHealth(): Promise<SystemHealth> {
  try {
    const [
      clientCount, leadCount, projectCount, taskCount, fixedCostCount,
      revenueCount, habitCount, templateCount, configCount, hunterCount,
      questCount, notifCount, milestoneCount, expenseCount, docCount,
    ] = await Promise.all([
      db.select({ value: count() }).from(clients).then(r => r[0]?.value ?? 0),
      db.select({ value: count() }).from(leads).then(r => r[0]?.value ?? 0),
      db.select({ value: count() }).from(projects).then(r => r[0]?.value ?? 0),
      db.select({ value: count() }).from(tasks).then(r => r[0]?.value ?? 0),
      db.select({ value: count() }).from(fixedCosts).then(r => r[0]?.value ?? 0),
      db.select({ value: count() }).from(revenues).then(r => r[0]?.value ?? 0),
      db.select({ value: count() }).from(habits).then(r => r[0]?.value ?? 0),
      db.select({ value: count() }).from(checklistTemplates).then(r => r[0]?.value ?? 0),
      db.select({ value: count() }).from(workspaceConfig).then(r => r[0]?.value ?? 0),
      db.select({ value: count() }).from(hunterStatus).then(r => r[0]?.value ?? 0),
      db.select({ value: count() }).from(dailyQuests).then(r => r[0]?.value ?? 0),
      db.select({ value: count() }).from(notifications).then(r => r[0]?.value ?? 0),
      db.select({ value: count() }).from(milestones).then(r => r[0]?.value ?? 0),
      db.select({ value: count() }).from(businessExpenses).then(r => r[0]?.value ?? 0),
      db.select({ value: count() }).from(documents).then(r => r[0]?.value ?? 0),
    ]);

    return {
      status: "online",
      recordCounts: {
        clients: clientCount,
        leads: leadCount,
        projects: projectCount,
        tasks: taskCount,
        fixed_costs: fixedCostCount,
        revenues: revenueCount,
        habits: habitCount,
        checklist_templates: templateCount,
        workspace_config: configCount,
        hunter_status: hunterCount,
        daily_quests: questCount,
        notifications: notifCount,
        milestones: milestoneCount,
        business_expenses: expenseCount,
        documents: docCount,
      },
      lastExportAt: null,
    };
  } catch {
    return {
      status: "offline",
      recordCounts: {},
      lastExportAt: null,
    };
  }
}

export async function exportBackup(): Promise<BackupData> {
  const [
    hunterData, questData, leadData, clientData, projectData,
    templateData, templateItemData, projectChecklistData,
    expenseData, documentData, taskData, notificationData,
    milestoneData, fixedCostData, revenueData, habitData, configData,
  ] = await Promise.all([
    db.select().from(hunterStatus),
    db.select().from(dailyQuests),
    db.select().from(leads),
    db.select().from(clients),
    db.select().from(projects),
    db.select().from(checklistTemplates),
    db.select().from(checklistTemplateItems),
    db.select().from(projectChecklistItems),
    db.select().from(businessExpenses),
    db.select().from(documents),
    db.select().from(tasks),
    db.select().from(notifications),
    db.select().from(milestones),
    db.select().from(fixedCosts),
    db.select().from(revenues),
    db.select().from(habits),
    db.select().from(workspaceConfig),
  ]);

  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    data: {
      hunter_status: hunterData,
      daily_quests: questData,
      leads: leadData,
      clients: clientData,
      projects: projectData,
      checklist_templates: templateData,
      checklist_template_items: templateItemData,
      project_checklist_items: projectChecklistData,
      business_expenses: expenseData,
      documents: documentData,
      tasks: taskData,
      notifications: notificationData,
      milestones: milestoneData,
      fixed_costs: fixedCostData,
      revenues: revenueData,
      habits: habitData,
      workspace_config: configData,
    },
  };
}
