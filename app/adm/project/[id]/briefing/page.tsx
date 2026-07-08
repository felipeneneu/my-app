import { db } from "@/db";
import { getBriefingNotes, getProjectForBriefing } from "@/lib/actions/briefing";
import { workspaceConfig } from "@/db/schema";
import { BriefingClient } from "./client";

export default async function BriefingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [project, notes, config] = await Promise.all([
    getProjectForBriefing(id),
    getBriefingNotes(id),
    db.select().from(workspaceConfig).then(r => r[0] ?? null),
  ]);
  if (!project) return <div>Projeto não encontrado</div>;

  return (
    <BriefingClient
      projectId={id}
      projectName={project.name}
      userName={config?.userName ?? "Usuário"}
      initialNotes={notes.map(n => ({ id: n.id, content: n.content, createdAt: n.createdAt }))}
    />
  );
}
