"use server";

import { db } from "@/db";
import { checklistTemplates, checklistTemplateItems, projectChecklistItems } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getChecklistTemplates() {
  return db.select().from(checklistTemplates).orderBy(checklistTemplates.name);
}

export async function getTemplateItems(templateId: string) {
  return db.select()
    .from(checklistTemplateItems)
    .where(eq(checklistTemplateItems.templateId, templateId))
    .orderBy(asc(checklistTemplateItems.orderIndex));
}

export async function createChecklistTemplate(name: string, description?: string) {
  const template = await db.insert(checklistTemplates).values({ name, description: description ?? null }).returning();
  revalidatePath("/adm");
  return template[0];
}

export async function addTemplateItem(templateId: string, label: string, orderIndex?: number) {
  const items = await db.select().from(checklistTemplateItems).where(eq(checklistTemplateItems.templateId, templateId));
  const item = await db.insert(checklistTemplateItems).values({
    templateId,
    label,
    orderIndex: orderIndex ?? items.length,
  }).returning();
  revalidatePath("/adm");
  return item[0];
}

export async function deleteTemplateItem(id: string) {
  await db.delete(checklistTemplateItems).where(eq(checklistTemplateItems.id, id));
  revalidatePath("/adm");
}

export async function getProjectChecklistItems(projectId: string) {
  return db.select()
    .from(projectChecklistItems)
    .where(eq(projectChecklistItems.projectId, projectId))
    .orderBy(asc(projectChecklistItems.createdAt));
}

export async function applyTemplateToProject(templateId: string, projectId: string) {
  const items = await db.select()
    .from(checklistTemplateItems)
    .where(eq(checklistTemplateItems.templateId, templateId))
    .orderBy(asc(checklistTemplateItems.orderIndex));

  for (const item of items) {
    await db.insert(projectChecklistItems).values({
      projectId,
      templateId,
      label: item.label,
    });
  }

  revalidatePath("/adm/[projectId]");
}

export async function addProjectChecklistItem(projectId: string, label: string) {
  const item = await db.insert(projectChecklistItems).values({ projectId, label }).returning();
  revalidatePath("/adm/[projectId]");
  return item[0];
}

export async function toggleProjectChecklistItem(id: string) {
  const item = await db.select().from(projectChecklistItems).where(eq(projectChecklistItems.id, id)).then(r => r[0]);
  if (!item) return;
  await db.update(projectChecklistItems).set({ completed: !item.completed }).where(eq(projectChecklistItems.id, id));
  revalidatePath("/adm/[projectId]");
}

export async function deleteProjectChecklistItem(id: string) {
  await db.delete(projectChecklistItems).where(eq(projectChecklistItems.id, id));
  revalidatePath("/adm/[projectId]");
}
