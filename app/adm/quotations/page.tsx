import { getLeads } from "@/lib/actions/quotations";
import { getMonthlyGoal } from "@/lib/actions/financial";
import { QuotationsClient } from "./client";

export default async function QuotationsPage() {
  const [leads, monthlyGoal] = await Promise.all([
    getLeads(),
    getMonthlyGoal(),
  ]);

  return (
    <QuotationsClient
      leads={leads.map(l => ({ id: l.id, businessName: l.businessName, email: l.email ?? "", status: l.status, createdAt: l.createdAt }))}
      monthlyGoal={monthlyGoal}
    />
  );
}
