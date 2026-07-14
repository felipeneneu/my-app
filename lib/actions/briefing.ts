"use server";

import { db } from "@/db";
import { documents, clients, projects, briefingNotes } from "@/db/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import type { BriefingData, ActivityEvent } from "@/lib/data/briefing";
import { emptyBriefing } from "@/lib/data/briefing";

export type BriefingListItem = {
  id: string;
  projectId: string;
  projectName: string;
  clientName: string;
  createdAt: string;
  updatedAt: string;
};

export async function getAllBriefings(): Promise<BriefingListItem[]> {
  const rows = await db
    .select({
      id: documents.id,
      projectId: documents.projectId,
      contentJson: documents.contentJson,
      projectName: projects.name,
      clientName: projects.clientName,
    })
    .from(documents)
    .leftJoin(projects, eq(documents.projectId, projects.id))
    .where(eq(documents.type, "briefing"))
    .orderBy(desc(documents.id));

  return rows.map((r) => {
    let createdAt = "";
    let updatedAt = "";
    try {
      const content = JSON.parse(r.contentJson);
      createdAt = (content.createdAt as string) ?? "";
      updatedAt = (content.updatedAt as string) ?? "";
    } catch { /* ignore */ }
    return {
      id: r.id,
      projectId: r.projectId ?? "",
      projectName: r.projectName ?? "Sem projeto",
      clientName: r.clientName ?? "Sem cliente",
      createdAt,
      updatedAt,
    };
  });
}

export async function getBriefing(id: string) {
  const doc = await db
    .select()
    .from(documents)
    .where(and(eq(documents.type, "briefing"), eq(documents.id, id)))
    .then((r) => r[0] ?? null);
  if (!doc) return null;
  return { id: doc.id, projectId: doc.projectId, data: JSON.parse(doc.contentJson) as BriefingData };
}

export async function saveBriefing(id: string, data: BriefingData) {
  const existing = await db
    .select()
    .from(documents)
    .where(eq(documents.id, id))
    .then((r) => r[0] ?? null);

  if (!existing) throw new Error("Briefing não encontrado");

  await db
    .update(documents)
    .set({ contentJson: JSON.stringify({ ...data, updatedAt: new Date().toISOString() }) })
    .where(eq(documents.id, id));

  revalidatePath(`/adm/briefing/${id}`);
  revalidatePath("/adm/briefing");
  return { success: true };
}

export async function createBriefing(projectId: string, clientName: string) {
  const existing = await db
    .select()
    .from(documents)
    .where(and(eq(documents.type, "briefing"), eq(documents.projectId, projectId)))
    .then((r) => r[0] ?? null);

  if (existing) return { id: existing.id, created: false };

  const data = emptyBriefing(clientName);
  const doc = await db.insert(documents).values({
    type: "briefing",
    projectId,
    contentJson: JSON.stringify({ ...data, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }),
  }).returning();

  revalidatePath("/adm/briefing");
  return { id: doc[0].id, created: true };
}

export async function deleteBriefing(id: string) {
  await db.delete(documents).where(eq(documents.id, id));
  revalidatePath("/adm/briefing");
  return { success: true };
}

export async function listClients() {
  return db.select({ id: clients.id, name: clients.name }).from(clients).orderBy(clients.name);
}

export async function listProjectsWithoutBriefing() {
  const briefings = await db
    .select({ projectId: documents.projectId })
    .from(documents)
    .where(eq(documents.type, "briefing"));

  const briefedIds = new Set(briefings.map((b) => b.projectId));

  const allProjects = await db
    .select({ id: projects.id, name: projects.name, clientName: projects.clientName })
    .from(projects)
    .orderBy(projects.name);

  return allProjects.filter((p) => !briefedIds.has(p.id));
}

// ── activity feed ──

const SYSTEM_EVENT_RE = /^\[([^\]]+)\]\s*/;

export async function getActivityFeed(projectId: string): Promise<ActivityEvent[]> {
  const notes = await db
    .select()
    .from(briefingNotes)
    .where(eq(briefingNotes.projectId, projectId))
    .orderBy(desc(briefingNotes.createdAt))
    .then((r) => r.reverse());

  return notes.map((n) => {
    const match = n.content.match(SYSTEM_EVENT_RE);
    if (match) {
      return {
        id: n.id,
        projectId: n.projectId,
        type: match[1] as ActivityEvent["type"],
        content: n.content.slice(match[0].length),
        authorType: "system" as const,
        metadata: null,
        createdAt: n.createdAt,
      };
    }
    return {
      id: n.id,
      projectId: n.projectId,
      type: "note" as const,
      content: n.content,
      authorType: "user" as const,
      metadata: null,
      createdAt: n.createdAt,
    };
  });
}

export async function addActivityNote(projectId: string, content: string) {
  await db.insert(briefingNotes).values({ projectId, content });
  revalidatePath(`/adm/project/${projectId}/briefing`);
  return { success: true };
}

export async function addSystemEvent(
  projectId: string,
  type: ActivityEvent["type"],
  content: string,
) {
  await db.insert(briefingNotes).values({
    projectId,
    content: `[${type}] ${content}`,
  });
  revalidatePath(`/adm/project/${projectId}/briefing`);
  return { success: true };
}

export async function getProjectForBriefing(projectId: string) {
  return db
    .select({ id: projects.id, name: projects.name, clientName: projects.clientName })
    .from(projects)
    .where(eq(projects.id, projectId))
    .then((r) => r[0] ?? null);
}

// backward-compat aliases
export const getBriefingNotes = getActivityFeed;
export const addBriefingNote = addActivityNote;
