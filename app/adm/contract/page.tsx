import { getContracts } from "@/lib/actions/contract";
import { ContractListClient } from "./client";

export default async function ContractListPage() {
  const contracts = await getContracts();
  return <ContractListClient contracts={contracts.map(c => ({ id: c.id, contentJson: c.contentJson }))} />;
}
