"use server";

import { db } from "@/db";
import { projectTokens, projects, milestones, briefingNotes, documents } from "@/db/schema";
import { eq } from "drizzle-orm";
import { createHash } from "crypto";
import { revalidatePath } from "next/cache";

export async function generateProjectToken(projectId: string) {
  const existing = await db.select().from(projectTokens)
    .where(eq(projectTokens.projectId, projectId))
    .then(r => r[0] ?? null);

  if (existing?.active) {
    return { token: existing.token, url: `/track/${existing.token}` };
  }

  if (existing && !existing.active) {
    await db.update(projectTokens).set({ active: true }).where(eq(projectTokens.id, existing.id));
    return { token: existing.token, url: `/track/${existing.token}` };
  }

  const raw = `${projectId}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const token = createHash("sha256").update(raw).digest("hex").slice(0, 32);
  await db.insert(projectTokens).values({ projectId, token, active: true });
  revalidatePath(`/adm/${projectId}`);
  return { token, url: `/track/${token}` };
}

export async function deactivateProjectToken(projectId: string) {
  const existing = await db.select().from(projectTokens)
    .where(eq(projectTokens.projectId, projectId))
    .then(r => r[0] ?? null);
  if (existing) {
    await db.update(projectTokens).set({ active: false }).where(eq(projectTokens.id, existing.id));
    revalidatePath(`/adm/${projectId}`);
  }
}

export async function getProjectToken(projectId: string) {
  return db.select().from(projectTokens)
    .where(eq(projectTokens.projectId, projectId))
    .then(r => r[0] ?? null);
}

export async function getProjectByToken(token: string) {
  const pt = await db.select().from(projectTokens).where(eq(projectTokens.token, token)).then(r => r[0] ?? null);
  if (!pt || !pt.active) return null;

  const project = await db.select().from(projects).where(eq(projects.id, pt.projectId)).then(r => r[0] ?? null);
  if (!project) return null;

  const projectMilestones = await db.select().from(milestones).where(eq(milestones.projectId, project.id));
  const notes = await db.select().from(briefingNotes).where(eq(briefingNotes.projectId, project.id)).orderBy(briefingNotes.createdAt);
  const docs = await db.select().from(documents).where(eq(documents.projectId, project.id));

  const totalMilestones = projectMilestones.length;
  const doneMilestones = projectMilestones.filter((m) => m.status === "done" || m.status === "delivered").length;
  const progress = totalMilestones > 0 ? Math.round((doneMilestones / totalMilestones) * 100) : 0;

  return {
    project: {
      id: project.id,
      name: project.name,
      status: project.status,
      price: project.price,
      startDate: project.startDate,
      progress,
    },
    milestones: projectMilestones,
    notes: notes.map((n) => ({ content: n.content, createdAt: n.createdAt })),
    documents: docs.map((d) => ({ id: d.id, type: d.type })),
  };
}
