import { getOS } from "@/lib/actions/os";
import { db } from "@/db";
import { payments, companyInfo } from "@/db/schema";
import { eq } from "drizzle-orm";
import { OSDetailClient } from "./client";

export default async function OSDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const doc = await getOS(id);
  if (!doc) return <div className="p-8 text-sm text-muted-foreground">OS não encontrada.</div>;

  const projectId = doc.projectId;
  const [osPayments, company] = await Promise.all([
    projectId ? db.select().from(payments).where(eq(payments.projectId, projectId)).orderBy(payments.date) : [],
    db.select().from(companyInfo).limit(1).then(r => r[0] ?? null),
  ]);

  return (
    <OSDetailClient
      os={{ id: doc.id, projectId: doc.projectId, contentJson: doc.contentJson }}
      payments={osPayments.map(p => ({
        id: p.id,
        amount: p.amount,
        date: p.date,
        method: p.method,
        note: p.note,
        receiptId: p.receiptId,
      }))}
      company={company ? {
        tradingName: company.tradingName,
        document: company.document,
        bankName: company.bankName,
        bankAgency: company.bankAgency,
        bankAccount: company.bankAccount,
        pixKey: company.pixKey,
        pixKeyType: company.pixKeyType,
        city: company.city,
      } : null}
    />
  );
}
