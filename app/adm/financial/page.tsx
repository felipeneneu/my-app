import { getFixedCosts, getProjectCosts, getRevenues, getProjectsForDropdown, getMonthlyGoal } from "@/lib/actions/financial";
import { FinancialClient } from "./client";

export default async function FinancialPage() {
  const [fixedCosts, projectCosts, revenues, projects, monthlyGoal] = await Promise.all([
    getFixedCosts(),
    getProjectCosts(),
    getRevenues(),
    getProjectsForDropdown(),
    getMonthlyGoal(),
  ]);

  return (
    <FinancialClient
      fixedCosts={fixedCosts.map(f => ({ id: f.id, label: f.label, amount: f.amount, category: f.category }))}
      projectCosts={projectCosts.map(pc => ({ id: pc.id, projectId: pc.projectId ?? "", label: pc.description, amount: pc.amount, type: pc.type }))}
      revenues={revenues.map(r => ({ id: r.id, projectId: r.projectId, label: r.label, amount: r.amount }))}
      projects={projects}
      monthlyGoal={monthlyGoal}
    />
  );
}
