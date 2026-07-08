import { db } from "@/db";
import { projects, tasks, notifications, workspaceConfig, leads, hunterStatus, businessExpenses } from "@/db/schema";
import { and, eq, sql, lt, gt, count, gte, lte } from "drizzle-orm";
import notificationTemplates from "./templates/notifications.json";
import insightTemplates from "./templates/insights.json";
import agendaTemplates from "./templates/agenda-suggestions.json";

type Pattern = {
  id: string;
  trigger: string;
  priority: string;
  type: string;
  title: string;
  message: string;
  icon?: string;
};

type Insight = {
  id: string;
  condition: string;
  message: string;
  icon?: string;
  tone?: string;
};

type Suggestion = {
  id: string;
  condition: string;
  message: string;
  action?: string;
  icon?: string;
};

async function evalCondition(
  condition: string,
  vars: Record<string, number | string>
): Promise<boolean> {
  if (typeof vars[condition] === "number") return (vars[condition] as number) > 0;
  if (typeof vars[condition] === "string") return !!vars[condition];
  return false;
}

export async function getNotificationsFromEngine(): Promise<{
  generated: Array<{ type: string; title: string; message: string; priority: string }>;
}> {
  const generated: Array<{ type: string; title: string; message: string; priority: string }> = [];

  const projectList = await db.select().from(projects);
  const taskList = await db.select().from(tasks);
  const existingNotifications = await db.select().from(notifications);
  const config = await db.select().from(workspaceConfig).then((r) => r[0]);

  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];

  // Overdue tasks
  if (taskList.length > 0) {
    const overdue = taskList.filter(
      (t) => t.dueDate < todayStr && !t.completed
    );
    if (overdue.length > 0) {
      generated.push({
        type: "deadline",
        title: "Tarefas atrasadas",
        message: `Você tem ${overdue.length} tarefa(s) vencida(s). O prazo mais antigo é ${overdue[0].dueDate}.`,
        priority: "high",
      });
    }
  }

  // No tasks today
  const todayTasks = taskList.filter((t) => t.dueDate === todayStr && !t.completed);
  if (todayTasks.length === 0 && projectList.length > 0) {
    generated.push({
      type: "suggestion",
      title: "Dia livre",
      message: "Nenhuma tarefa agendada para hoje. Que tal usar o tempo para prospectar novos leads ou estudar?",
      priority: "low",
    });
  }

  // Project budget low (using price as budget proxy)
  for (const p of projectList) {
    const expenses = await db
      .select({ total: sql<number>`coalesce(sum(${businessExpenses.amount}), 0)` })
      .from(businessExpenses)
      .where(eq(businessExpenses.projectId, p.id))
      .then((r) => r[0]?.total ?? 0);
    if (p.price > 0 && expenses / p.price > 0.7) {
      generated.push({
        type: "warning",
        title: `Orçamento crítico: ${p.name}`,
        message: `O projeto "${p.name}" já consumiu ${Math.round((expenses / p.price) * 100)}% do orçamento (R$ ${expenses}/${p.price}).`,
        priority: "high",
      });
    }
  }

  return { generated };
}

export async function getInsightsFromEngine(): Promise<
  Array<{ id: string; message: string; icon?: string; tone?: string }>
> {
  const result: Array<{ id: string; message: string; icon?: string; tone?: string }> = [];
  const insights = insightTemplates.insights as Insight[];

  const projectList = await db.select().from(projects);

  if (projectList.length > 0) {
    const margins = projectList.map((p) => ({
      name: p.name,
      margin: p.price > 0 ? ((p.price - 0) / p.price) * 100 : 0,
    }));
    const best = margins.reduce((a, b) => (a.margin > b.margin ? a : b));
    result.push({
      id: "best-margin",
      message: `"${best.name}" é seu projeto com melhor margem (${best.margin.toFixed(0)}%). Considere upsell para esse cliente.`,
      icon: "TrendingUp",
      tone: "emerald",
    });
  }

  return result;
}

export async function getAgendaSuggestions(): Promise<
  Array<{ id: string; message: string; action?: string; icon?: string }>
> {
  const result: Array<{ id: string; message: string; action?: string; icon?: string }> = [];
  const now = new Date();
  const hour = now.getHours();

  const taskList = await db.select().from(tasks);
  const todayStr = now.toISOString().split("T")[0];
  const todayTasks = taskList.filter((t) => t.dueDate === todayStr && !t.completed);

  // Morning empty
  if (hour < 12 && todayTasks.length === 0) {
    result.push({
      id: "morning-focus",
      message: "Sua manhã está livre. Sugiro alocar 3h de Foco Profundo para adiantar entregas.",
      action: "Agendar agora",
      icon: "Zap",
    });
  }

  // Deadlines today
  const dueToday = taskList.filter((t) => t.dueDate === todayStr && !t.completed);
  if (dueToday.length > 0) {
    result.push({
      id: "deadline-today",
      message: `Você tem ${dueToday.length} prazo(s) vencendo HOJE. Proteja as próximas horas para finalizar.`,
      action: "Bloquear agenda",
      icon: "Timer",
    });
  }

  return result;
}