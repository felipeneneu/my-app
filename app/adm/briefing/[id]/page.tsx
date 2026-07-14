import { getBriefing } from "@/lib/actions/briefing";
import { emptyBriefing } from "@/lib/data/briefing";
import { db } from "@/db";
import { projects } from "@/db/schema";
import { eq } from "drizzle-orm";
import BriefingForm from "@/components/BriefingForm";

export default async function BriefingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const existing = await getBriefing(id);
  if (!existing) return <p className="p-8 text-sm text-muted-foreground">Briefing não encontrado.</p>;

  const project = existing.projectId
    ? await db.select().from(projects).where(eq(projects.id, existing.projectId)).then((r) => r[0] ?? null)
    : null;

  const clientName = project?.clientName ?? "Cliente";
  const data = existing.data ?? emptyBriefing(clientName);

  return <BriefingForm id={id} clientName={clientName} projectName={project?.name ?? ""} initial={data} />;
}
