import { getReceipts } from "@/lib/actions/receipt";
import { ReceiptListClient } from "./client";

export default async function ReceiptListPage() {
  const receipts = await getReceipts();
  return <ReceiptListClient receipts={receipts.map(r => ({ id: r.id, contentJson: r.contentJson }))} />;
}
