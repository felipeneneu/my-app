import { getBudget } from "@/lib/actions/budget";
import { getCompany } from "@/lib/actions/company";
import { BudgetDetailClient } from "./client";

export default async function BudgetDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [budget, company] = await Promise.all([getBudget(id), getCompany()]);
  if (!budget) return <div className="p-8 text-muted-foreground">Orçamento não encontrado</div>;

  return (
    <BudgetDetailClient
      budget={{ id: budget.id, projectId: budget.projectId, contentJson: budget.contentJson }}
      company={company ? {
        tradingName: company.tradingName,
        document: company.document,
        logo: company.logo,
        street: company.street,
        number: company.number,
        neighborhood: company.neighborhood,
        city: company.city,
        state: company.state,
        bankName: company.bankName,
        bankAgency: company.bankAgency,
        bankAccount: company.bankAccount,
        pixKey: company.pixKey,
        pixKeyType: company.pixKeyType,
      } : null}
    />
  );
}
