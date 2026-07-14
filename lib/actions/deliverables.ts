"use server";

import { db } from "@/db";
import { projectDeliverables } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

type CreateDeliverableInput = {
  name: string;
  url?: string;
  status?: "online" | "inactive" | "maintenance";
  type?: string;
  deliveryDate?: string;
  note?: string;
};

export async function getDeliverables() {
  try {
    const result = await db
      .select()
      .from(projectDeliverables)
      .orderBy(projectDeliverables.deliveryDate);
    return { success: true as const, data: result };
  } catch (error) {
    return { success: false as const, error: error instanceof Error ? error.message : "Erro ao buscar entregas" };
  }
}

export async function createDeliverable(data: CreateDeliverableInput) {
  try {
    const [item] = await db
      .insert(projectDeliverables)
      .values({
        name: data.name,
        url: data.url ?? null,
        status: data.status ?? "online",
        type: data.type ?? "site",
        deliveryDate: data.deliveryDate ?? null,
        note: data.note ?? null,
      })
      .returning();

    revalidatePath("/adm/deliverables");
    return { success: true as const, data: item };
  } catch (error) {
    return { success: false as const, error: error instanceof Error ? error.message : "Erro ao criar entrega" };
  }
}

export async function updateDeliverable(id: string, data: Partial<CreateDeliverableInput>) {
  try {
    const [item] = await db
      .update(projectDeliverables)
      .set(data)
      .where(eq(projectDeliverables.id, id))
      .returning();

    revalidatePath("/adm/deliverables");
    return { success: true as const, data: item };
  } catch (error) {
    return { success: false as const, error: error instanceof Error ? error.message : "Erro ao atualizar entrega" };
  }
}

export async function deleteDeliverable(id: string) {
  try {
    await db.delete(projectDeliverables).where(eq(projectDeliverables.id, id));
    revalidatePath("/adm/deliverables");
    return { success: true as const };
  } catch (error) {
    return { success: false as const, error: error instanceof Error ? error.message : "Erro ao remover entrega" };
  }
}
