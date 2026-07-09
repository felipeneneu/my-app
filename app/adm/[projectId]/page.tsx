import { getProject, getMilestones, getProjectExpenses } from "@/lib/actions/project-detail";
import { getChecklistTemplates, getProjectChecklistItems } from "@/lib/actions/checklists";
import { getProjectToken } from "@/lib/actions/tracking";
import { db } from "@/db";
import { documents, tasks } from "@/db/schema";
import { eq } from "drizzle-orm";
import { ProjectDetailClient } from "./client";

export default async function ProjectDetailPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const [project, milestones, expenses, checklistTemplates, checklistItems, docs, projectTasks, token] = await Promise.all([
    getProject(projectId),
    getMilestones(projectId),
    getProjectExpenses(projectId),
    getChecklistTemplates(),
    getProjectChecklistItems(projectId),
    db.select().from(documents).where(eq(documents.projectId, projectId)),
    db.select().from(tasks).where(eq(tasks.projectId, projectId)),
    getProjectToken(projectId),
  ]);

  let contractData: Record<string, unknown> | null = null;
  const contract = docs.find(d => d.type === "contract");
  if (contract) {
    try { contractData = JSON.parse(contract.contentJson); } catch {}
  }

  return (
    <ProjectDetailClient
      project={project ? {
        id: project.id,
        name: project.name,
        clientName: project.clientName,
        price: project.price,
        status: project.status,
        startDate: project.startDate,
      } : { id: projectId, name: "Projeto não encontrado", clientName: "", price: 0, status: "unknown", startDate: "" }}
      contractData={contractData}
      milestones={milestones.map(m => ({ id: m.id, label: m.label, status: m.status }))}
      expenses={expenses.map(e => ({ id: e.id, label: e.description, amount: e.amount, category: e.type }))}
      checklistTemplates={checklistTemplates.map(t => ({ id: t.id, name: t.name }))}
      checklistItems={checklistItems.map(i => ({ id: i.id, label: i.label, completed: i.completed }))}
      projectTasks={projectTasks.map(t => ({
        id: t.id,
        title: t.title,
        blockType: t.blockType,
        dueDate: t.dueDate,
        startTime: t.startTime,
        endTime: t.endTime,
        completed: t.completed,
      }))}
      projectToken={token ? { token: token.token, active: token.active } : null}
    />
  );
}
