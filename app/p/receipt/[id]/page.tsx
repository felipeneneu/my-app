import { notFound } from "next/navigation";
import { getReceipt } from "@/lib/actions/receipt";
import { getCompany } from "@/lib/actions/company";
import { PublicReceiptClient } from "./client";

export default async function PublicReceiptPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [receipt, company] = await Promise.all([
    getReceipt(id),
    getCompany(),
  ]);

  if (!receipt) notFound();

  return (
    <PublicReceiptClient
      receipt={{ id: receipt.id, contentJson: receipt.contentJson }}
      company={company ? {
        tradingName: company.tradingName,
        document: company.document,
        logo: company.logo ?? null,
        pixKey: company.pixKey ?? "",
        pixKeyType: company.pixKeyType ?? "random",
        merchantCity: company.city ?? "",
      } : null}
    />
  );
}
