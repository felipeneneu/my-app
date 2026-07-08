import { getBudgets } from "@/lib/actions/budget";
import { BudgetListClient } from "./client";

export default async function BudgetListPage() {
  const budgets = await getBudgets();
  return <BudgetListClient budgets={budgets.map(b => ({ id: b.id, contentJson: b.contentJson }))} />;
}
