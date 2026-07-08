"use server";

import { db } from "@/db";
import { projectTokens, projects, milestones, briefingNotes, documents } from "@/db/schema";
import { eq } from "drizzle-orm";

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
