import { getClients } from "@/lib/actions/clients";
import { getCompany } from "@/lib/actions/company";
import { getWorkspaceConfig } from "@/lib/actions/workspace";
import { getProducts } from "@/lib/actions/products";
import { BudgetNewClient } from "./client";

export default async function BudgetNewPage(props: { searchParams?: Promise<{ clientId?: string }> }) {
  const searchParams = await props.searchParams;
  const preselectedClientId = searchParams?.clientId ?? null;

  const [clients, company, wc, products] = await Promise.all([
    getClients(),
    getCompany(),
    getWorkspaceConfig(),
    getProducts(),
  ]);
  return (
    <BudgetNewClient
      clients={clients.map(c => ({ id: c.id, name: c.name, email: c.email ?? "", document: c.document ?? "", notes: c.notes ?? "" }))}
      products={products}
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
      workspaceConfig={wc ? {
        monthlyGoal: wc.monthlyGoal,
        proposalDefaultDiscount: wc.proposalDefaultDiscount,
        proposalDownPayment: wc.proposalDownPayment,
        proposalInstallments: wc.proposalInstallments,
        proposalSignatureName: wc.proposalSignatureName,
        proposalSignatureRole: wc.proposalSignatureRole,
        proposalSignatureSite: wc.proposalSignatureSite,
        proposalSignatureEmail: wc.proposalSignatureEmail,
        proposalSignatureCity: wc.proposalSignatureCity,
        proposalIntroMessage: wc.proposalIntroMessage,
      } : null}
      preselectedClientId={preselectedClientId}
    />
  );
}
