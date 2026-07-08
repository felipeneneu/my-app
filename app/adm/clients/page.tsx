import { getClients } from "@/lib/actions/clients";
import { ClientsClient } from "./client";

export default async function ClientsPage() {
  const data = await getClients();
  return <ClientsClient initial={data} />;
}

