import { getClient, getClientProjects, getClientBudgets } from "@/lib/actions/clients";
import { ClientDetailClient } from "./client";

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [client, projects, budgets] = await Promise.all([
    getClient(id),
    getClientProjects(id),
    getClientBudgets(id),
  ]);
  if (!client) return <div className="p-8 text-muted-foreground">Cliente não encontrado</div>;

  return (
    <ClientDetailClient
      client={client}
      projects={projects}
      budgets={budgets.map(b => ({ id: b.id, contentJson: b.contentJson }))}
    />
  );
}
