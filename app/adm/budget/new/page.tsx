import { getClients } from "@/lib/actions/clients";
import { getCompany } from "@/lib/actions/company";
import { getBudgets } from "@/lib/actions/budget";
import { BudgetNewClient } from "./client";

export default async function BudgetNewPage() {
  const [clients, company, budgets] = await Promise.all([
    getClients(),
    getCompany(),
    getBudgets(),
  ]);
  return (
    <BudgetNewClient
      clients={clients.map(c => ({ id: c.id, name: c.name, email: c.email ?? "", document: c.document ?? "", notes: c.notes ?? "" }))}
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
