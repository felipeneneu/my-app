"use server";

import { db } from "@/db";
import { briefingNotes } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getBriefingNotes(projectId: string) {
  return db.select().from(briefingNotes).where(eq(briefingNotes.projectId, projectId)).orderBy(briefingNotes.createdAt);
}

export async function addBriefingNote(projectId: string, content: string) {
  await db.insert(briefingNotes).values({ projectId, content });
  revalidatePath(`/adm/project/${projectId}/briefing`);
}

export async function getProjectForBriefing(projectId: string) {
  const { projects } = await import("@/db/schema");
  return db.select().from(projects).where(eq(projects.id, projectId)).then(r => r[0] ?? null);
}
