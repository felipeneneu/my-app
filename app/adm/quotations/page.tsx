import { getBudgets } from "@/lib/actions/budget";
import { getContracts } from "@/lib/actions/contract";
import { getReceipts } from "@/lib/actions/receipt";
import { QuotationsHubClient } from "./client";

export default async function QuotationsHubPage() {
  const [budgets, contracts, receipts] = await Promise.all([
    getBudgets(),
    getContracts(),
    getReceipts(),
  ]);

  return (
    <QuotationsHubClient
      budgets={budgets.map(b => ({ id: b.id, contentJson: b.contentJson }))}
      contracts={contracts.map(c => ({ id: c.id, contentJson: c.contentJson }))}
      receipts={receipts.map(r => ({ id: r.id, contentJson: r.contentJson }))}
    />
  );
}
