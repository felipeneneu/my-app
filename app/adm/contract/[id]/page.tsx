import { getContract } from "@/lib/actions/contract";
import { getCompany } from "@/lib/actions/company";
import { ContractDetailClient } from "./client";

export default async function ContractDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [contract, company] = await Promise.all([getContract(id), getCompany()]);
  if (!contract) return <div>Contrato não encontrado</div>;
  return (
    <ContractDetailClient
      contract={{ id: contract.id, projectId: contract.projectId, contentJson: contract.contentJson }}
      company={company ? {
        tradingName: company.tradingName,
        document: company.document,
        logo: company.logo ?? null,
        street: company.street ?? "",
        number: company.number ?? "",
        neighborhood: company.neighborhood ?? "",
        city: company.city ?? "",
        state: company.state ?? "",
        bankName: company.bankName ?? "",
        bankAgency: company.bankAgency ?? "",
        bankAccount: company.bankAccount ?? "",
        pixKey: company.pixKey ?? "",
        pixKeyType: company.pixKeyType ?? "random",
      } : null}
    />
  );
}
