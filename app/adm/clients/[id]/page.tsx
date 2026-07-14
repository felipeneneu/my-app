import { getClient, getClientProjects } from "@/lib/actions/clients";
import { getClientContacts } from "@/lib/actions/client-contacts";
import { getClientAddresses } from "@/lib/actions/addresses";
import { ClientDetailClient } from "./client";

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [client, projects, contacts, addresses] = await Promise.all([
    getClient(id),
    getClientProjects(id),
    getClientContacts(id),
    getClientAddresses(id),
  ]);
  if (!client) return <div className="p-8 text-muted-foreground">Cliente não encontrado</div>;

  return (
    <ClientDetailClient
      client={client}
      projects={projects}
      contacts={contacts}
      addresses={addresses}
    />
  );
}
