"use server";

import { db } from "@/db";
import { payments, documents, companyInfo } from "@/db/schema";
import { eq } from "drizzle-orm";
import { awardPaymentReceived } from "./gamification";

type ConfirmPaymentInput = {
  projectId: string;
  osId?: string;
  amount: number;
  date: string;
  method: "pix" | "transfer" | "cash" | "credit" | "debit" | "other";
  note?: string;
};

export async function confirmPayment(data: ConfirmPaymentInput) {
  try {
    const { projectId, osId, amount, date, method, note } = data;

    if (!projectId || amount <= 0) {
      return { success: false as const, error: "Dados de pagamento inválidos" };
    }

    const company = await db.select().from(companyInfo).limit(1).then(r => r[0]);

    const result = await db.transaction(async (tx) => {
      const receiptContent = {
        projectId,
        osId: osId ?? null,
        amount,
        date,
        method,
        note: note ?? "",
        companyName: company?.tradingName ?? "",
        companyDocument: company?.document ?? "",
        pixKey: method === "pix" ? company?.pixKey ?? "" : null,
        pixKeyType: method === "pix" ? company?.pixKeyType ?? "random" : null,
        bankName: method !== "pix" ? company?.bankName ?? "" : null,
        bankAgency: method !== "pix" ? company?.bankAgency ?? "" : null,
        bankAccount: method !== "pix" ? company?.bankAccount ?? "" : null,
        createdAt: new Date().toISOString(),
      };

      const [receiptDoc] = await tx
        .insert(documents)
        .values({
          projectId,
          type: "receipt",
          contentJson: JSON.stringify(receiptContent),
        })
        .returning();

      const [payment] = await tx
        .insert(payments)
        .values({
          projectId,
          osId: osId ?? null,
          amount,
          date,
          method,
          note: note ?? null,
          receiptId: receiptDoc.id,
        })
        .returning();

      return { payment, receipt: receiptDoc };
    });

    await awardPaymentReceived();

    return { success: true as const, data: result };
  } catch (error) {
    return { success: false as const, error: error instanceof Error ? error.message : "Erro ao confirmar pagamento" };
  }
}

export async function getPayments(projectId: string) {
  try {
    const result = await db
      .select()
      .from(payments)
      .where(eq(payments.projectId, projectId))
      .orderBy(payments.date);
    return { success: true as const, data: result };
  } catch (error) {
    return { success: false as const, error: error instanceof Error ? error.message : "Erro ao buscar pagamentos" };
  }
}

export async function getPayment(id: string) {
  try {
    const result = await db.select().from(payments).where(eq(payments.id, id)).then(r => r[0] ?? null);
    return { success: true as const, data: result };
  } catch (error) {
    return { success: false as const, error: error instanceof Error ? error.message : "Erro ao buscar pagamento" };
  }
}

export async function getPaymentsByOS(osId: string) {
  try {
    const result = await db
      .select()
      .from(payments)
      .where(eq(payments.osId, osId))
      .orderBy(payments.date);
    return { success: true as const, data: result };
  } catch (error) {
    return { success: false as const, error: error instanceof Error ? error.message : "Erro ao buscar pagamentos da OS" };
  }
}
