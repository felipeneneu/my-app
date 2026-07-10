import { notFound } from "next/navigation";
import { getPublicBudget } from "@/lib/actions/public-budget";
import { getCompany } from "@/lib/actions/company";
import { Pproposal } from "@/components/Pproposal";

export default async function PublicProposalPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [budget, company] = await Promise.all([
    getPublicBudget(id),
    getCompany(),
  ]);

  if (!budget) notFound();

  return (
    <Pproposal
      data={budget.data}
      company={company ? { tradingName: company.tradingName, logo: company.logo } : null}
      budgetId={budget.id}
      status={budget.status}
      approvedAt={budget.approvedAt}
    />
  );
}
