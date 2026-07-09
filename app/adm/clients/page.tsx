import { getClientsWithStats } from "@/lib/actions/clients";
import { ClientsClient } from "./client";

export default async function ClientsPage() {
  const data = await getClientsWithStats();
  return <ClientsClient initial={data} />;
}

