"use server";

import { db } from "@/db";
import { projects, documents, milestones, tasks, clients, payments, companyInfo } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { emitNotification } from "./notifications";
import { awardProjectCompleted, awardPaymentReceived } from "./gamification";

type PhaseInput = {
  name: string;
  deadlineDays: number;
  estimatedHours: number;
};

type ProductInput = {
  productId: string;
  name: string;
  estimatedHours: number;
  materialCost: number;
};

type CreateOSInput = {
  clientId: string;
  clientName: string;
  totalValue: number;
  paymentTerms: string;
  phases: PhaseInput[];
  products: ProductInput[];
};

export async function createOS(data: CreateOSInput) {
  try {
    const { clientId, clientName, totalValue, paymentTerms, phases, products } = data;

    if (!clientId || !clientName || phases.length === 0) {
      return { success: false as const, error: "Dados incompletos para criar OS" };
    }

    const client = await db.select().from(clients).where(eq(clients.id, clientId)).then(r => r[0]);
    if (!client) {
      return { success: false as const, error: "Cliente não encontrado" };
    }

    const now = new Date().toISOString();
    const today = now.split("T")[0];
    const totalHours = phases.reduce((s, p) => s + p.estimatedHours, 0);
    let cumulativeDays = 0;

    const result = await db.transaction(async (tx) => {
      const [project] = await tx
        .insert(projects)
        .values({
          name: clientName,
          clientName,
          clientId,
          price: totalValue,
          status: "active",
          startDate: today,
          totalHours,
        })
        .returning();

      let cumulativeDeadline = 0;
      for (const phase of phases) {
        cumulativeDeadline += phase.deadlineDays;
      }
      const deadlineDate = new Date(today);
      deadlineDate.setDate(deadlineDate.getDate() + cumulativeDeadline);

      const osContent: OSData = {
        projectId: project.id,
        clientName,
        clientDocument: client.document ?? "",
        paymentTerms,
        totalPrice: totalValue,
        status: "active",
        scope: products.map(p => p.name).join(", "),
        deadline: deadlineDate.toISOString().split("T")[0],
        items: phases.map((p) => ({
          name: p.name,
          hours: p.estimatedHours,
          value: 0,
          status: "pending",
          deadline: "",
          blockType: "deadline",
          taskGenerated: false,
        })),
        createdAt: now,
        updatedAt: now,
      };

      const [osDoc] = await tx
        .insert(documents)
        .values({
          projectId: project.id,
          type: "os",
          contentJson: JSON.stringify(osContent),
        })
        .returning();

      for (const phase of phases) {
        cumulativeDays += phase.deadlineDays;
        const dueDate = new Date(today);
        dueDate.setDate(dueDate.getDate() + cumulativeDays);

        await tx.insert(milestones).values({
          projectId: project.id,
          label: phase.name,
          status: "pending",
          estimatedHours: phase.estimatedHours,
        });

        await tx.insert(tasks).values({
          title: phase.name,
          projectId: project.id,
          blockType: "deadline",
          dueDate: dueDate.toISOString().split("T")[0],
          estimatedHours: phase.estimatedHours,
          completed: false,
        });
      }

      return { projectId: project.id, osId: osDoc.id };
    });

    await emitNotification(
      "info",
      "OS criada",
      `Ordem de Serviço criada para "${clientName}" com ${phases.length} fase(s) e ${totalHours}h estimadas.`,
      "medium"
    );

    revalidatePath("/adm");
    revalidatePath("/adm/os");

    return { success: true as const, data: result };
  } catch (error) {
    return { success: false as const, error: error instanceof Error ? error.message : "Erro ao criar OS" };
  }
}

export type OSItem = {
  name: string;
  hours: number;
  value: number;
  status: "pending" | "in_progress" | "completed";
  deadline?: string;
  blockType?: string;
  taskGenerated?: boolean;
};

export type OSData = {
  projectId?: string;
  clientName: string;
  clientDocument?: string;
  scope: string;
  totalPrice: number;
  deadline: string;
  status: "active" | "completed" | "cancelled";
  items: OSItem[];
  budgetId?: string;
  paymentTerms?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
};

export async function listOS() {
  return db.select().from(documents).where(eq(documents.type, "os")).orderBy(documents.id);
}

export async function getOS(id: string) {
  return db.select().from(documents).where(eq(documents.id, id)).then((r) => r[0] ?? null);
}

export async function updateOS(id: string, data: Partial<OSData>) {
  const existing = await getOS(id);
  if (!existing) throw new Error("OS não encontrada");

  const current = JSON.parse(existing.contentJson) as OSData;
  const updated = { ...current, ...data, updatedAt: new Date().toISOString() };

  await db.update(documents).set({ contentJson: JSON.stringify(updated) }).where(eq(documents.id, id));
  revalidatePath("/adm/os");
  revalidatePath(`/adm/os/${id}`);
  return { success: true };
}

export async function completeOS(id: string) {
  const existing = await getOS(id);
  if (!existing) throw new Error("OS não encontrada");

  const current = JSON.parse(existing.contentJson) as OSData;
  if (current.items.some((i) => i.status !== "completed")) {
    throw new Error("Todos os itens devem estar concluídos antes de completar a OS");
  }

  let projectStartDate = current.projectId
    ? await db.select({ startDate: projects.startDate }).from(projects)
        .where(eq(projects.id, current.projectId)).then((r) => r[0]?.startDate || new Date().toISOString().split("T")[0])
    : new Date().toISOString().split("T")[0];

  if (isNaN(new Date(projectStartDate).getTime())) {
    projectStartDate = new Date().toISOString().split("T")[0];
  }
  const startBase = new Date(projectStartDate);
  let cumulativeWeeks = 0;

  for (const item of current.items) {
    if (item.taskGenerated) continue;

    const itemWeeks = item.deadline ? parseDeadlineWeeks(item.deadline) : 1;
    cumulativeWeeks += itemWeeks;
    const dueDate = new Date(startBase);
    dueDate.setDate(dueDate.getDate() + cumulativeWeeks * 7);

    const blockType = item.blockType || "deep_focus";
    const timeRange = blockTimeMap[blockType] || blockTimeMap.deep_focus;

    await db.insert(tasks).values({
      title: item.name,
      projectId: current.projectId || "",
      blockType: blockType as any,
      dueDate: dueDate.toISOString().split("T")[0],
      startTime: timeRange.start || null,
      endTime: timeRange.end || null,
      completed: false,
    });

    item.taskGenerated = true;
  }

  const now = new Date().toISOString();
  const updated: OSData = {
    ...current,
    status: "completed",
    updatedAt: now,
  };

  await db.update(documents).set({ contentJson: JSON.stringify(updated) }).where(eq(documents.id, id));

  const isTwoInstallments = current.paymentTerms?.includes("2×") || current.paymentTerms?.toLowerCase().includes("entrada");
  if (current.projectId && isTwoInstallments) {
    const existingPayments = await db
      .select()
      .from(payments)
      .where(and(eq(payments.projectId, current.projectId), eq(payments.osId, id)))
      .orderBy(payments.date);

    const firstPayment = existingPayments[0];
    const paidAmount = existingPayments.reduce((s, p) => s + p.amount, 0);
    const remainingAmount = current.totalPrice - paidAmount;

    if (remainingAmount > 0) {
      const company = await db.select().from(companyInfo).limit(1).then(r => r[0] ?? null);

      const receiptContent = {
        projectId: current.projectId,
        osId: id,
        amount: remainingAmount,
        date: now.split("T")[0],
        method: firstPayment?.method || "pix",
        note: "2ª parcela - Saldo na entrega",
        companyName: company?.tradingName ?? "",
        companyDocument: company?.document ?? "",
        pixKey: company?.pixKey ?? null,
        pixKeyType: company?.pixKeyType ?? null,
        bankName: company?.bankName ?? null,
        bankAgency: company?.bankAgency ?? null,
        bankAccount: company?.bankAccount ?? null,
        createdAt: now,
      };

      const [receiptDoc] = await db
        .insert(documents)
        .values({
          projectId: current.projectId,
          type: "receipt",
          contentJson: JSON.stringify(receiptContent),
        })
        .returning();

      await db.insert(payments).values({
        projectId: current.projectId,
        osId: id,
        amount: remainingAmount,
        date: now.split("T")[0],
        method: firstPayment?.method || "pix",
        note: "2ª parcela - Saldo na entrega",
        receiptId: receiptDoc.id,
      });

      await awardPaymentReceived();
    }
  }

  const taskCount = current.items.filter((i) => !i.taskGenerated).length;
  await emitNotification("info", "OS concluída",
    `Ordem de Serviço para "${current.clientName}" concluída. ${taskCount} tarefa(s) gerada(s) no calendário.${isTwoInstallments ? " 2ª parcela gerada automaticamente." : ""}`, "high");

  if (current.projectId) {
    await awardProjectCompleted(current.projectId);
  }

  revalidatePath("/adm/os");
  revalidatePath(`/adm/os/${id}`);
  revalidatePath("/adm");
  return { success: true };
}

export async function updateOSItemStatus(osId: string, itemIndex: number, status: OSItem["status"]) {
  const existing = await getOS(osId);
  if (!existing) throw new Error("OS não encontrada");

  const current = JSON.parse(existing.contentJson) as OSData;
  if (!current.items[itemIndex]) throw new Error("Item não encontrado");

  current.items[itemIndex].status = status;
  current.updatedAt = new Date().toISOString();

  const allDone = current.items.every(i => i.status === "completed");
  if (allDone) {
    current.status = "completed";
    if (current.projectId) {
      await db.update(tasks).set({ completed: true }).where(eq(tasks.projectId, current.projectId));
    }
    await emitNotification("info", "OS concluída",
      `Ordem de Serviço para "${current.clientName}" concluída automaticamente.`, "high");
  }

  await db.update(documents).set({ contentJson: JSON.stringify(current) }).where(eq(documents.id, osId));

  revalidatePath("/adm/os");
  revalidatePath(`/adm/os/${osId}`);
  revalidatePath("/adm");
  if (allDone) revalidatePath("/adm/calendar");
  return { success: true };
}

export async function getProjectsWithoutOS() {
  const osDocs = await db.select({ projectId: documents.projectId }).from(documents).where(eq(documents.type, "os"));
  const osProjectIds = new Set(osDocs.map((d) => d.projectId).filter(Boolean));

  const allProjects = await db
    .select({ id: projects.id, name: projects.name, clientName: projects.clientName })
    .from(projects)
    .orderBy(projects.name);

  return allProjects.filter((p) => !osProjectIds.has(p.id));
}

function parseDeadlineWeeks(deadline: string): number {
  const num = parseInt(deadline, 10);
  if (isNaN(num)) return 2;
  if (deadline.includes("semana") || deadline.includes("sem")) return num;
  if (deadline.includes("dia") || deadline.includes("d")) return Math.ceil(num / 7);
  return num;
}

const blockTimeMap: Record<string, { start: string; end: string }> = {
  deep_focus: { start: "09:00", end: "13:00" },
  meeting: { start: "14:00", end: "16:00" },
  design: { start: "16:30", end: "18:30" },
  admin: { start: "18:30", end: "19:00" },
  deadline: { start: "", end: "" },
};
