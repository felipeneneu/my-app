import { getReceipt } from "@/lib/actions/receipt";
import { getCompany } from "@/lib/actions/company";
import { ReceiptDetailClient } from "./client";

export default async function ReceiptDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [receipt, company] = await Promise.all([getReceipt(id), getCompany()]);
  if (!receipt) return <div>Recibo não encontrado</div>;
  return (
    <ReceiptDetailClient
      receipt={{ id: receipt.id, projectId: receipt.projectId, contentJson: receipt.contentJson }}
      company={company ? { tradingName: company.tradingName, document: company.document, logo: company.logo } : null}
    />
  );
}
