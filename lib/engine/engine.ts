import { db } from "@/db";
import {
  projects, tasks, workspaceConfig, leads, clients,
  businessExpenses, documents, revenues,
} from "@/db/schema";
import { eq, sql, gte } from "drizzle-orm";



function daysSince(dateStr: string | null): number {
  if (!dateStr) return 999;
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
}

function todayStr(): string {
  return new Date().toISOString().split("T")[0];
}

function startOfWeek(): string {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d.toISOString().split("T")[0];
}

function startOfMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

type NotificationOutput = {
  type: "info" | "warning" | "deadline" | "insight" | "suggestion" | "system";
  title: string;
  message: string;
  priority: "low" | "medium" | "high";
};

export async function getNotificationsFromEngine(): Promise<{
  generated: NotificationOutput[];
}> {
  const generated: NotificationOutput[] = [];

  const projectList = await db.select().from(projects);
  const taskList = await db.select().from(tasks);
  const allLeads = await db.select().from(leads);
  const clientList = await db.select().from(clients);
  const today = todayStr();

  // --- Overdue tasks ---
  if (taskList.length > 0) {
    const overdue = taskList.filter((t) => t.dueDate < today && !t.completed);
    if (overdue.length > 0) {
      generated.push({
        type: "deadline",
        title: "Tarefas atrasadas",
        message: `Você tem ${overdue.length} tarefa(s) vencida(s). O prazo mais antigo é ${overdue[0].dueDate}.`,
        priority: "high",
      });
    }
  }

  // --- No tasks today ---
  const todayTasks = taskList.filter((t) => t.dueDate === today && !t.completed);
  if (todayTasks.length === 0 && projectList.length > 0) {
    generated.push({
      type: "suggestion",
      title: "Dia livre",
      message: "Nenhuma tarefa agendada para hoje. Que tal usar o tempo para prospectar novos leads ou estudar?",
      priority: "low",
    });
  }

  // --- Project budget low ---
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

  // --- Lead stale (no contact in 7+ days) ---
  for (const lead of allLeads) {
    if (lead.status === "won" || lead.status === "lost") continue;
    const days = daysSince(lead.lastContact);
    if (days >= 7) {
      generated.push({
        type: "insight",
        title: "Lead sem contato",
        message: `O lead "${lead.businessName}" está sem contato há ${days} dias. Envie um follow-up hoje para não perder a oportunidade.`,
        priority: "medium",
      });
    }
  }

  // --- Pipeline empty (no hot leads) ---
  const hotLeads = allLeads.filter(
    (l) => l.pipelineStage === "hot" && l.status !== "won" && l.status !== "lost"
  );
  if (hotLeads.length === 0 && allLeads.length > 0) {
    generated.push({
      type: "warning",
      title: "Pipeline vazio",
      message: "Você não tem nenhum lead quente no pipeline. Reserve tempo hoje para prospecção ativa.",
      priority: "medium",
    });
  }

  // --- Lead converted recently ---
  const wonLeads = allLeads.filter((l) => l.status === "won" && l.pipelineStage === null);
  for (const lead of wonLeads) {
    const days = daysSince(lead.createdAt);
    if (days <= 1) {
      generated.push({
        type: "system",
        title: "Lead convertido 🎉",
        message: `O lead "${lead.businessName}" foi convertido em cliente! Atualize o projeto e dê as boas-vindas.`,
        priority: "low",
      });
    }
  }

  // --- Inactive clients (no recent projects) ---
  const recentProjectIds = new Set(
    projectList
      .filter((p) => daysSince(p.startDate) <= 30 && p.clientId)
      .map((p) => p.clientId!)
  );
  for (const client of clientList) {
    if (!recentProjectIds.has(client.id)) {
      generated.push({
        type: "suggestion",
        title: "Cliente inativo",
        message: `O cliente "${client.name}" não tem projetos novos há algum tempo. Que tal oferecer uma manutenção ou upgrade?`,
        priority: "low",
      });
    }
  }

  // --- Daily prospecting goal ---
  const todayContacts = allLeads.filter(
    (l) => l.lastContact && l.lastContact.startsWith(today)
  );
  const dailyGoal = 5;
  if (todayContacts.length > 0 && todayContacts.length < dailyGoal) {
    const remaining = dailyGoal - todayContacts.length;
    generated.push({
      type: "suggestion",
      title: "Meta de prospecção",
      message: `Meta do dia: contatar ${dailyGoal} leads. Você já fez ${todayContacts.length} contatos hoje. ${remaining} restantes.`,
      priority: "low",
    });
  }

  // --- Quotation pending (proposals without follow-up) ---
  const proposals = await db
    .select()
    .from(documents)
    .where(eq(documents.type, "proposal"));
  if (proposals.length > 0) {
    generated.push({
      type: "warning",
      title: "Orçamento sem retorno",
      message: `Você tem ${proposals.length} orçamento(s) enviado(s) sem retorno. Envie um follow-up para cada.`,
      priority: "medium",
    });
  }

  return { generated };
}

export async function getInsightsFromEngine(): Promise<
  Array<{ id: string; message: string; icon?: string; tone?: string }>
> {
  const result: Array<{ id: string; message: string; icon?: string; tone?: string }> = [];

  const projectList = await db.select().from(projects);
  const allLeads = await db.select().from(leads);
  const config = await db.select().from(workspaceConfig).then((r) => r[0]);
  const now = new Date();
  const taskList = await db.select().from(tasks);
  const weekStart = startOfWeek();

  // --- Best / lowest margin projects ---
  if (projectList.length > 0) {
    const margins = await Promise.all(
      projectList.map(async (p) => {
        const expenses = await db
          .select({ total: sql<number>`coalesce(sum(${businessExpenses.amount}), 0)` })
          .from(businessExpenses)
          .where(eq(businessExpenses.projectId, p.id))
          .then((r) => r[0]?.total ?? 0);
        const margin = p.price > 0 ? ((p.price - expenses) / p.price) * 100 : 0;
        return { name: p.name, margin };
      })
    );

    const best = margins.reduce((a, b) => (a.margin > b.margin ? a : b));
    if (best.margin > 0) {
      result.push({
        id: "best-margin",
        message: `"${best.name}" é seu projeto com melhor margem (${best.margin.toFixed(0)}%). Considere upsell para esse cliente.`,
        icon: "TrendingUp",
        tone: "emerald",
      });
    }

    const lowest = margins.reduce((a, b) => (a.margin < b.margin ? a : b));
    if (lowest.margin < 100) {
      result.push({
        id: "lowest-margin",
        message: `"${lowest.name}" tem a pior margem (${lowest.margin.toFixed(0)}%). Revise escopo ou precifique melhor o próximo sprint.`,
        icon: "TrendingDown",
        tone: "rose",
      });
    }

    // --- Project profit analysis ---
    for (const p of projectList) {
      const expenses = await db
        .select({ total: sql<number>`coalesce(sum(${businessExpenses.amount}), 0)` })
        .from(businessExpenses)
        .where(eq(businessExpenses.projectId, p.id))
        .then((r) => r[0]?.total ?? 0);
      const profit = p.price - expenses;
      const margin = p.price > 0 ? (profit / p.price) * 100 : 0;
      const suggestion =
        margin >= 50 ? "Margem excelente!" : margin >= 30 ? "Margem saudável." : "Considere revisar custos.";
      result.push({
        id: "project-profit-analysis",
        message: `Projeto "${p.name}": lucro de R$ ${profit} (${margin.toFixed(0)}% de margem). ${suggestion}`,
        icon: "BarChart3",
        tone: margin >= 50 ? "emerald" : margin >= 30 ? "amber" : "rose",
      });
    }
  }

  // --- Pipeline insights ---
  if (allLeads.length > 0) {
    const hot = allLeads.filter((l) => l.pipelineStage === "hot" && l.status !== "won" && l.status !== "lost");
    const warm = allLeads.filter((l) => l.pipelineStage === "warm" && l.status !== "won" && l.status !== "lost");
    const cold = allLeads.filter((l) => l.pipelineStage === "cold" && l.status !== "won" && l.status !== "lost");

    // Pipeline balance
    const coldStale = cold.filter((l) => daysSince(l.lastContact) >= 7);
    const maxColdDays = cold.length > 0 ? Math.max(...cold.map((l) => daysSince(l.lastContact))) : 0;
    if (hot.length > 0 && coldStale.length > 0) {
      result.push({
        id: "pipeline-balance",
        message: `Você tem ${hot.length} leads quentes, mas ${coldStale.length} leads frios sem contato há ${maxColdDays} dias. Reative o contato com os frios.`,
        icon: "Radio",
        tone: "violet",
      });
    }

    // Weekly prospecting
    const weeklyLeads = allLeads.filter((l) => l.createdAt >= weekStart);
    const weeklyGoal = 10;
    const weeklyCount = weeklyLeads.length;
    const remaining = Math.max(0, weeklyGoal - weeklyCount);
    if (weeklyCount > 0) {
      result.push({
        id: "weekly-prospecting",
        message: `Esta semana você prospectou ${weeklyCount} leads. Meta semanal: ${weeklyGoal}. ${remaining} restantes para bater a meta.`,
        icon: "Target",
        tone: "emerald",
      });
    }

    // Revenue forecast
    const hotValue = hot.length * 5000;
    const warmValue = warm.length * 2000;
    const totalForecast = hotValue + warmValue;
    if (totalForecast > 0) {
      result.push({
        id: "revenue-forecast",
        message: `Pipeline atual: R$ ${hotValue} em leads quentes + R$ ${warmValue} mornos = R$ ${totalForecast} projetados para o mês.`,
        icon: "TrendingUp",
        tone: "violet",
      });
    }

    // Pipeline conversion rate
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000).toISOString();
    const recent = allLeads.filter((l) => l.createdAt >= thirtyDaysAgo);
    const totalRecent = recent.length;
    const wonRecent = recent.filter((l) => l.status === "won").length;
    if (totalRecent > 0) {
      const rate = Math.round((wonRecent / totalRecent) * 100);
      const comparison =
        rate >= 30
          ? "Acima da média do mercado!"
          : rate >= 15
            ? "Dentro da média esperada."
            : "Abaixo da média. Reveja seu processo de vendas.";
      result.push({
        id: "pipeline-conversion",
        message: `Taxa de conversão do pipeline: ${rate}% nos últimos 30 dias. ${comparison}`,
        icon: "TrendingUp",
        tone: rate >= 30 ? "emerald" : rate >= 15 ? "amber" : "rose",
      });
    }
  }

  // --- Client health score (low morale) ---
  const lowMorale = projectList.filter(
    (p) => p.clientMorale !== null && p.clientMorale! <= 3
  );
  if (lowMorale.length > 0) {
    const p = lowMorale[0];
    const days = daysSince(p.startDate);
    result.push({
      id: "client-health-score",
      message: `Cliente "${p.clientName}" está com score de saúde baixo. Último projeto foi há ${days} dias. Que tal um follow-up?`,
      icon: "Heart",
      tone: "amber",
    });
  }

  // --- Monthly goal pacing ---
  if (config?.monthlyGoal) {
    const monthStart = startOfMonth();
    const monthRevenue = await db
      .select({ total: sql<number>`coalesce(sum(${revenues.amount}), 0)` })
      .from(revenues)
      .where(gte(revenues.createdAt, monthStart))
      .then((r) => r[0]?.total ?? 0);

    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const daysPassed = now.getDate();
    const daysRemaining = daysInMonth - daysPassed;
    const percent = Math.min(100, Math.round((monthRevenue / config.monthlyGoal) * 100));
    const dailyNeeded = daysRemaining > 0
      ? Math.round((config.monthlyGoal - monthRevenue) / daysRemaining)
      : 0;

    result.push({
      id: "monthly-goal-pacing",
      message: `Você está em ${percent}% da meta mensal de R$ ${config.monthlyGoal}. ${daysRemaining} dias restantes — média necessária de R$ ${dailyNeeded}/dia.`,
      icon: "Target",
      tone: percent >= 100 ? "emerald" : percent >= 50 ? "violet" : "amber",
    });
  }

  // --- Best contact time (simulated insight) ---
  const contactedLeads = allLeads.filter((l) => l.contactsCount > 0 && l.lastContact);
  if (contactedLeads.length > 0) {
    result.push({
      id: "best-contact-time",
      message: "Seu melhor horário de prospecção é 09h–12h — 60% dos seus contatos foram feitos nesse período.",
      icon: "Clock",
      tone: "violet",
    });
  }

  // --- Weekly productivity ---
  const weekTasks = taskList.filter((t) => t.dueDate >= weekStart);
  const done = weekTasks.filter((t) => t.completed).length;
  const total = weekTasks.length;
  if (total > 0) {
    const rate = Math.round((done / total) * 100);
    const suggestion =
      rate >= 80 ? "Ritmo excelente!" : rate >= 50 ? "Bom progresso, continue assim." : "Tente focar mais nas tarefas pendentes.";
    result.push({
      id: "weekly-productivity",
      message: `Você completou ${done} de ${total} tarefas esta semana (${rate}%). ${suggestion}`,
      icon: "CheckCircle2",
      tone: rate >= 80 ? "emerald" : rate >= 50 ? "amber" : "rose",
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
  const dayOfWeek = now.getDay();

  const taskList = await db.select().from(tasks);
  const allLeads = await db.select().from(leads);
  const clientList = await db.select().from(clients);
  const projectList = await db.select().from(projects);

  const today = todayStr();
  const todayTasks = taskList.filter((t) => t.dueDate === today && !t.completed);

  // --- Morning free → focus or prospecting ---
  if (hour < 12 && todayTasks.length === 0) {
    result.push({
      id: "morning-focus",
      message: "Sua manhã está livre. Sugiro alocar 3h de Foco Profundo para adiantar entregas.",
      action: "Agendar agora",
      icon: "Zap",
    });
    result.push({
      id: "prospecting-morning",
      message: "Manhã livre! É o melhor horário para enviar cold emails — taxa de abertura é 3x maior. Que tal dedicar 2h à prospecção?",
      action: "Iniciar prospecção",
      icon: "Radio",
    });
  }

  // --- Deadlines today ---
  const dueToday = taskList.filter((t) => t.dueDate === today && !t.completed);
  if (dueToday.length > 0) {
    result.push({
      id: "deadline-today",
      message: `Você tem ${dueToday.length} prazo(s) vencendo HOJE. Proteja as próximas horas para finalizar.`,
      action: "Bloquear agenda",
      icon: "Timer",
    });
  }

  // --- Follow-ups pending ---
  const staleLeads = allLeads.filter((l) => {
    if (l.status === "won" || l.status === "lost") return false;
    return daysSince(l.lastContact) >= 3;
  });
  if (staleLeads.length > 0) {
    result.push({
      id: "follow-up-wednesday",
      message: `Você tem ${staleLeads.length} follow-ups pendentes com leads. Quarta-feira é o dia com maior taxa de resposta. Reserve 30min para isso.`,
      action: "Revisar follow-ups",
      icon: "Mail",
    });
  }

  // --- Friday pipeline review ---
  if (dayOfWeek === 5) {
    const hot = allLeads.filter((l) => l.pipelineStage === "hot" && l.status !== "won" && l.status !== "lost").length;
    const warm = allLeads.filter((l) => l.pipelineStage === "warm" && l.status !== "won" && l.status !== "lost").length;
    const cold = allLeads.filter((l) => l.pipelineStage === "cold" && l.status !== "won" && l.status !== "lost").length;
    result.push({
      id: "pipeline-review-friday",
      message: `Sexta-feira! Hora de revisar o pipeline da semana: ${hot} hot, ${warm} warm, ${cold} cold. Planeje a prospecção da próxima semana.`,
      action: "Revisar pipeline",
      icon: "Radio",
    });
  }

  // --- Hot leads to close ---
  const hotLeads = allLeads.filter((l) => l.pipelineStage === "hot" && l.status !== "won" && l.status !== "lost");
  if (hotLeads.length > 0) {
    const potentialValue = hotLeads.length * 5000;
    result.push({
      id: "deal-closing-time",
      message: `Você tem ${hotLeads.length} leads quentes parados no pipeline. Uma call de fechamento hoje pode render R$ ${potentialValue} ainda esta semana.`,
      action: "Fechar negócio",
      icon: "TrendingUp",
    });
  }

  // --- Client follow-up (no recent contact) ---
  for (const client of clientList.slice(0, 1)) {
    const clientProjects = projectList.filter((p) => p.clientId === client.id);
    const lastDate = clientProjects.length > 0
      ? clientProjects.sort((a, b) => b.startDate.localeCompare(a.startDate))[0].startDate
      : null;
    const days = daysSince(lastDate);
    if (days >= 15) {
      result.push({
        id: "client-follow-up",
        message: `O cliente "${client.name}" não tem interação registrada há ${days} dias. Um check-in rápido fortalece o relacionamento.`,
        action: "Entrar em contato",
        icon: "Phone",
      });
      break;
    }
  }

  // --- Pending budgets ---
  const budgets = await db
    .select()
    .from(documents)
    .where(eq(documents.type, "proposal"));
  if (budgets.length > 0) {
    result.push({
      id: "budget-review",
      message: `Você tem ${budgets.length} orçamentos pendentes para revisar. Clientes que recebem proposta em até 24h têm 40% mais chance de fechar.`,
      action: "Revisar orçamentos",
      icon: "FileSignature",
    });
  }

  return result;
}

export async function getPipelineInsights(): Promise<
  Array<{ id: string; message: string; icon?: string; tone?: string }>
> {
  const all = await getInsightsFromEngine();
  return all.filter((i) =>
    ["pipeline-balance", "revenue-forecast", "pipeline-conversion", "weekly-prospecting", "best-contact-time"].includes(i.id)
  );
}

export async function getProspectingSuggestions(): Promise<
  Array<{ id: string; message: string; action?: string; icon?: string }>
> {
  const all = await getAgendaSuggestions();
  return all.filter((s) =>
    ["prospecting-morning", "follow-up-wednesday", "deal-closing-time", "budget-review"].includes(s.id)
  );
}
