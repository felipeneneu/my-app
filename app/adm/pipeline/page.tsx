import { getPipelineLeads, getPipelineStats } from "@/lib/actions/pipeline";
import { PipelineClient } from "./client";

export default async function PipelinePage() {
  const leads = await getPipelineLeads();
  const stats = await getPipelineStats();
  return <PipelineClient initialLeads={leads} initialStats={stats} />;
}
