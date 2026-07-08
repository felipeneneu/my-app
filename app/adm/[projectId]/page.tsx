import { getProject, getMilestones, getProjectExpenses } from "@/lib/actions/project-detail";
import { getChecklistTemplates, getProjectChecklistItems } from "@/lib/actions/checklists";
import { ProjectDetailClient } from "./client";

export default async function ProjectDetailPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const [project, milestones, expenses, checklistTemplates, checklistItems] = await Promise.all([
    getProject(projectId),
    getMilestones(projectId),
    getProjectExpenses(projectId),
    getChecklistTemplates(),
    getProjectChecklistItems(projectId),
  ]);

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
      milestones={milestones.map(m => ({ id: m.id, label: m.label, status: m.status }))}
      expenses={expenses.map(e => ({ id: e.id, label: e.description, amount: e.amount, category: e.type }))}
      checklistTemplates={checklistTemplates.map(t => ({ id: t.id, name: t.name }))}
      checklistItems={checklistItems.map(i => ({ id: i.id, label: i.label, completed: i.completed }))}
    />
  );
}
