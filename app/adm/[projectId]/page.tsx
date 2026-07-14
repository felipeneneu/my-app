import { getProject } from "@/lib/actions/project-detail";
import { db } from "@/db";
import { documents, tasks } from "@/db/schema";
import { eq } from "drizzle-orm";
import { ProjectDetailClient } from "./client";

export default async function ProjectDetailPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const [project, docs, projectTasks] = await Promise.all([
    getProject(projectId),
    db.select().from(documents).where(eq(documents.projectId, projectId)),
    db.select().from(tasks).where(eq(tasks.projectId, projectId)),
  ]);

  let contractData: Record<string, unknown> | null = null;
  let osId: string | null = null;
  let osItems: { id: string; name: string; status: "pending" | "in_progress" | "completed"; deadline?: string; blockType?: string }[] = [];

  for (const doc of docs) {
    if (doc.type === "contract") {
      try { contractData = JSON.parse(doc.contentJson); } catch {}
    }
    if (doc.type === "os") {
      osId = doc.id;
      try {
        const content = JSON.parse(doc.contentJson);
        const items = content.items || [];
        osItems = items.map((item: any) => ({
          id: item.name || String(Math.random()),
          name: item.name || "Item",
          status: (item.status || "pending") as "pending" | "in_progress" | "completed",
          deadline: item.deadline,
          blockType: item.blockType,
        }));
      } catch {}
    }
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
      osId={osId}
      osItems={osItems}
      projectTasks={projectTasks.map(t => ({
        id: t.id,
        title: t.title,
        blockType: t.blockType,
        dueDate: t.dueDate,
        startTime: t.startTime,
        endTime: t.endTime,
        completed: t.completed,
      }))}
    />
  );
}
