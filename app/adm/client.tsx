"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  CalendarSync,
  Zap,
  Diamond,
  Smile,
  Circle,
  Sparkles,
  Coffee,
  Video,
  Palette,
  Code2,
  Rocket,
  Pizza,
  GraduationCap,
  ShoppingBag,
  Briefcase,
  Plus,
  Timer,
  AlertTriangle,
} from "lucide-react";
import { getProjects } from "@/lib/actions/projects";
import { getTasks } from "@/lib/actions/tasks";
import { useNotificationStream } from "@/hooks/use-notification-stream";
import { CreateTaskSheet } from "@/components/CreateTaskSheet";
import { CreateProjectSheet } from "@/components/CreateProjectSheet";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type Day = {
  name: string;
  num: number;
  type: "prod" | "meet" | "deadline" | "past" | "empty";
  label: string;
  detail?: string;
  client?: { name: string; icon: React.ComponentType<{ size?: number; className?: string }>; tone: string };
  today?: boolean;
};

type Project = { id: string; name: string; clientName?: string; price?: number; status: string };

function getISOWeek(d: Date) {
  const temp = new Date(d.valueOf());
  const dayNum = (d.getDay() + 6) % 7;
  temp.setDate(temp.getDate() - dayNum + 3);
  const firstThursday = temp.valueOf();
  temp.setMonth(0, 1);
  if (temp.getDay() !== 4) {
    temp.setMonth(0, 1 + ((4 - temp.getDay()) + 7) % 7);
  }
  return 1 + Math.ceil((firstThursday - temp.valueOf()) / 604800000);
}

function buildWeek(tasks?: { dueDate: string; title: string; blockType: string; projectName?: string }[]): Day[] {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const diffToWednesday = dayOfWeek <= 3 ? 3 - dayOfWeek : 10 - dayOfWeek;
  const wednesday = new Date(today);
  wednesday.setDate(today.getDate() + diffToWednesday - 3);
  const names = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SÁB"];
  const days: Day[] = [];

  for (let i = 0; i < 9; i++) {
    const date = new Date(wednesday);
    date.setDate(wednesday.getDate() + i);
    const dayIndex = date.getDay();
    const isToday = date.toDateString() === today.toDateString();
    const dayNum = date.getDate();
    const dateStr = date.toISOString().split("T")[0];

    const dayTasks = (tasks ?? []).filter((t) => t.dueDate === dateStr);
    const day: Day = {
      name: names[dayIndex],
      num: dayNum,
      type: "empty",
      label: dayTasks.length > 0 ? dayTasks[0].title : "Slot Livre",
      detail: dayTasks.length > 0 ? dayTasks.map((t) => t.title).join(", ") : undefined,
      today: isToday || undefined,
    };

    if (dayTasks.length > 0) {
      const types = dayTasks.map((t) => t.blockType);
      if (types.includes("deadline")) day.type = "deadline";
      else if (types.includes("meeting")) day.type = "meet";
      else day.type = "prod";
    } else if (date < today) {
      day.type = "past";
      day.label = "Entregue";
    }

    days.push(day);
  }
  return days;
}

function MetricCard({ icon: Icon, label, value, sub, tone, children }: {
  icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
  label: string; value: string; sub: string;
  tone: "emerald" | "violet" | "amber";
  children?: React.ReactNode;
}) {
  const toneRing = tone === "emerald" ? "text-emerald-glow" : tone === "violet" ? "text-violet-glow" : "text-amber-glow";
  const bg = tone === "emerald" ? "bg-emerald-glow/10" : tone === "violet" ? "bg-violet-glow/10" : "bg-amber-glow/10";
  return (
    <div className="relative flex-1 overflow-hidden rounded-2xl border border-hairline bg-(--surface-1) p-5">
      <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full opacity-30 blur-3xl"
        style={{ background: tone === "emerald" ? "var(--emerald-glow)" : tone === "violet" ? "var(--violet-glow)" : "var(--amber-glow)" }} />
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${bg}`}><Icon size={16} className={toneRing} strokeWidth={2} /></div>
          <p className="text-mono text-[10px] uppercase tracking-widest text-muted-foreground">{label}</p>
        </div>
        <span className="text-mono text-[10px] text-muted-foreground">LIVE</span>
      </div>
      <div className="flex items-baseline gap-2">
        <p className="text-display text-4xl text-foreground">{value}</p>
        <p className="text-xs text-muted-foreground">{sub}</p>
      </div>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function DayCard({ d, onAddTask }: { d: Day; onAddTask?: (date: string) => void }) {
  const base = "relative flex h-[172px] w-full flex-col overflow-hidden rounded-xl border p-3 transition-all";
  const today = new Date();
  const month = String(today.getMonth() + 1).padStart(2, "0");

  if (d.type === "empty") {
    return (
      <div className={`${base} border-dashed border-hairline bg-(--surface-1) opacity-60 hover:opacity-100 hover:border-emerald-glow/40`}>
        <p className="text-mono text-[10px] tracking-widest text-muted-foreground">{d.name}</p>
        <p className="text-display text-3xl text-muted-foreground">{String(d.num).padStart(2, "0")}</p>
        <div className="mt-auto flex flex-col items-center gap-2">
          <p className="text-[11px] text-muted-foreground">Slot Livre</p>
          <button type="button" onClick={() => onAddTask?.(`${today.getFullYear()}-${month}-${String(d.num).padStart(2, "0")}`)}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-emerald-glow/40 bg-emerald-glow/10 text-emerald-glow hover:bg-emerald-glow/20 transition-colors">
            <Plus size={14} strokeWidth={2.5} />
          </button>
        </div>
      </div>
    );
  }

  const styles = {
    prod: "border-emerald-glow/30 bg-emerald-glow/10 hover:glow-emerald",
    meet: "border-violet-glow/30 bg-violet-glow/10 hover:glow-violet",
    deadline: "border-amber-glow/40 bg-linear-to-br from-amber-glow/15 to-rose-glow/10 hover:glow-amber",
    past: "border-hairline bg-(--surface-1) opacity-60",
  }[d.type];

  const nameColor = d.type === "prod" ? "text-emerald-glow" : d.type === "meet" ? "text-violet-glow" : d.type === "deadline" ? "text-amber-glow" : "text-muted-foreground";

  return (
    <div className={`${base} ${styles}`}>
      {d.today && <span className="absolute right-2 top-2 rounded-md bg-foreground px-1.5 py-0.5 text-[9px] font-bold text-(--surface-0)">HOJE</span>}
      <p className={`text-mono text-[10px] tracking-widest ${nameColor}`}>{d.name}</p>
      <p className="text-display text-3xl text-foreground">{String(d.num).padStart(2, "0")}</p>
      <div className="mt-auto">
        <div className="mb-2 flex gap-1">
          {Array.from({ length: 6 }).map((_, i) => (
            <span key={i} className={`h-1.5 flex-1 rounded-full ${d.type === "prod" ? "bg-emerald-glow/60" : d.type === "meet" ? "bg-violet-glow/60" : "bg-muted-foreground/30"} ${i > (d.type === "past" ? 5 : d.type === "prod" ? 4 : 3) ? "opacity-30" : ""}`} />
          ))}
        </div>
        <p className="text-[11px] font-semibold text-foreground">{d.label}</p>
        {d.detail && <p className="text-[10px] text-muted-foreground">{d.detail}</p>}
      </div>
    </div>
  );
}

const focusModes = [
  { id: "deep", label: "Modo Foco Profundo", icon: Code2, tone: "emerald" as const, hours: "09:00 → 13:00" },
  { id: "meet", label: "Reuniões com Clientes", icon: Video, tone: "violet" as const, hours: "14:00 → 16:00" },
  { id: "design", label: "Sessão de UI/UX Design", icon: Palette, tone: "emerald" as const, hours: "16:30 → 18:30" },
  { id: "admin", label: "Admin e Faturamento", icon: Briefcase, tone: "amber" as const, hours: "18:30 → 19:00" },
];

function AutomationPanel() {
  const [active, setActive] = useState<Record<string, boolean>>({ deep: true, meet: false, design: true, admin: false });
  const { nextBlock } = useNotificationStream();

  const currentBlock = (() => {
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const blocks = [
      { id: "deep", start: 9 * 60, end: 13 * 60, label: "Foco Profundo", icon: Code2, tone: "emerald" as const },
      { id: "meet", start: 14 * 60, end: 16 * 60, label: "Reuniões com Clientes", icon: Video, tone: "violet" as const },
      { id: "design", start: 16.5 * 60, end: 18.5 * 60, label: "UI/UX Design", icon: Palette, tone: "emerald" as const },
      { id: "admin", start: 18.5 * 60, end: 19 * 60, label: "Admin e Faturamento", icon: Briefcase, tone: "amber" as const },
    ];
    for (const b of blocks) {
      if (currentMinutes >= b.start && currentMinutes < b.end) {
        const remaining = b.end - currentMinutes;
        return { ...b, remaining: `${Math.floor(remaining / 60)}h ${remaining % 60}m` };
      }
    }
    return null;
  })();

  return (
    <div className="flex w-full flex-col overflow-hidden rounded-2xl border border-hairline bg-(--surface-1)">
      <div className="flex items-center justify-between border-b border-hairline px-5 py-4">
        <div>
          <p className="text-mono text-[10px] uppercase tracking-widest text-muted-foreground">Regras da agenda</p>
          <h3 className="text-base font-semibold text-foreground">Modos de foco diários</h3>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-glow/30 bg-violet-glow/10 px-2.5 py-1 text-[10px] font-semibold text-violet-glow">
          <CalendarSync size={12} /> Sincroniza com o Google Calendar
        </span>
      </div>
      <div className="flex flex-col gap-2 p-4">
        {focusModes.map((m) => {
          const on = active[m.id];
          const toneText = m.tone === "emerald" ? "text-emerald-glow" : m.tone === "violet" ? "text-violet-glow" : "text-amber-glow";
          const toneBg = m.tone === "emerald" ? "bg-emerald-glow" : m.tone === "violet" ? "bg-violet-glow" : "bg-amber-glow";
          return (
            <div key={m.id} className="flex items-center gap-3 rounded-xl border border-hairline bg-(--surface-2) px-3 py-2.5">
              <div className={`flex h-9 w-9 items-center justify-center rounded-lg bg-(--surface-0) ${toneText}`}><m.icon size={16} /></div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">{m.label}</p>
                <p className="text-mono text-[10px] text-muted-foreground">{m.hours}</p>
              </div>
              <Switch checked={on} onCheckedChange={() => setActive((a) => ({ ...a, [m.id]: !a[m.id] }))} className={on ? toneBg : ""} />
            </div>
          );
        })}
      </div>
      <div className="border-t border-hairline p-4">
        <p className="mb-2 text-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          {currentBlock ? "Bloco atual" : nextBlock ? "Próximo bloco" : "Próxima automação"}
        </p>
        <div className="flex items-center gap-3">
          {currentBlock ? (
            <>
              <Timer size={16} className="text-emerald-glow" />
              <p className="text-sm text-foreground">
                <span className="font-semibold">{currentBlock.label}</span> — restam{" "}
                <span className="text-mono text-emerald-glow">{currentBlock.remaining}</span>
              </p>
            </>
          ) : nextBlock ? (
            <>
              <Sparkles size={16} className="text-emerald-glow" />
              <p className="text-sm text-foreground">
                Bloco de <span className="font-semibold">{nextBlock.label}</span> começa em{" "}
                <span className="text-mono text-emerald-glow">{nextBlock.hoursUntil}h {nextBlock.minutesUntil}m</span>
              </p>
            </>
          ) : (
            <>
              <Sparkles size={16} className="text-emerald-glow" />
              <p className="text-sm text-foreground">Nenhum bloco agendado para hoje</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export function DashboardClient({ autoOpenProject = false }: { autoOpenProject?: boolean }) {
  const [taskSheetOpen, setTaskSheetOpen] = useState(false);
  const [projectSheetOpen, setProjectSheetOpen] = useState(autoOpenProject);
  const [selectedDate, setSelectedDate] = useState<string | undefined>();
  const { unreadCount } = useNotificationStream();

  const { data: allProjectsData = [] } = useQuery({
    queryKey: ["projects"],
    queryFn: () => getProjects(),
  });

  const { data: tasksData = [] } = useQuery({
    queryKey: ["tasks"],
    queryFn: () => getTasks(),
  });

  const allProjects: Project[] = allProjectsData.map((p: any) => ({
    id: p.id, name: p.name, clientName: p.clientName, price: p.price, status: p.status,
  }));

  const tasks = tasksData.map((t: any) => ({
    dueDate: t.dueDate, title: t.title, blockType: t.blockType, projectName: t.projectName,
  }));

  const totalRevenue = allProjects.reduce((s, p) => s + (p.price || 0), 0);
  const activeClients = allProjects.filter((p) => p.status === "active").length;
  const completedTasks = tasksData.filter((t: any) => t.completed).length;
  const totalTasks = tasksData.length;
  const taskCompletion = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const week = buildWeek(tasks);
  const today = new Date();
  const month = today.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "").toUpperCase();
  const dayNum = today.getDate();
  const weekday = today.toLocaleDateString("pt-BR", { weekday: "long" }).toUpperCase();
  const sprintWeek = getISOWeek(today);
  const sprintNumber = Math.floor((sprintWeek - 1) / 2) + 1;

  function handleAddTask(date?: string) { setSelectedDate(date); setTaskSheetOpen(true); }
  function handleProjectCreated(_project: { id: string; name: string }) {
    if (autoOpenProject) {
      window.history.replaceState({}, "", "/adm");
    }
  }

  function exportWeek() {
    const rows = week.map((d) => `${d.name}\t${d.num}\t${d.label}\t${d.detail || ""}`).join("\n");
    const csv = `Dia\tNúmero\tAtividade\tDetalhe\n${rows}`;
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sprint-semana-${sprintWeek}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Semana exportada como CSV");
  }

  return (
    <>
      <CreateTaskSheet open={taskSheetOpen} onOpenChange={setTaskSheetOpen}
        defaultDate={selectedDate} projects={allProjects}
        onNewProject={() => setProjectSheetOpen(true)} />
      <CreateProjectSheet open={projectSheetOpen} onOpenChange={setProjectSheetOpen}
        onCreated={handleProjectCreated} />

      <header className="flex items-center justify-between border-b border-hairline px-8 py-4">
        <div className="flex items-center gap-3">
          <Rocket size={16} className="text-emerald-glow" />
          <p className="text-mono text-[11px] uppercase tracking-widest text-muted-foreground">
            Sprint OS / Central de Comando {unreadCount > 0 && `· ${unreadCount} notificação${unreadCount !== 1 ? "ões" : ""}`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={exportWeek}>Exportar semana</Button>
          <Button size="sm" className="bg-emerald-glow text-(--surface-0) hover:brightness-110">Iniciar sessão de foco</Button>
        </div>
      </header>

      <section className="grid grid-cols-12 gap-6 px-8 pt-8">
        <div className="col-span-12 flex items-start gap-6 xl:col-span-7">
          <div className="flex flex-col items-center rounded-2xl border border-hairline bg-(--surface-1) px-5 py-4">
            <p className="text-mono text-[11px] tracking-widest text-emerald-glow">{month}</p>
            <p className="text-display text-6xl text-foreground">{dayNum}</p>
            <p className="text-mono text-[10px] text-muted-foreground">{weekday}</p>
          </div>
          <div className="pt-1">
            <p className="text-mono text-[11px] uppercase tracking-widest text-muted-foreground">Semana {sprintWeek} · Sprint {sprintNumber}</p>
            <h1 className="text-display mt-1 text-5xl text-foreground">Sprint Diário <span className="text-emerald-glow">Freelance</span></h1>
            <p className="mt-3 max-w-xl text-sm text-muted-foreground">
              Uma entrega concreta por dia. Reuniões concentradas em um único bloco. Foco profundo protegido. Prazos inegociáveis — a timeline abaixo é seu contrato com o você do futuro.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-glow/30 bg-emerald-glow/10 px-2.5 py-1 text-[11px] font-medium text-emerald-glow">
                <Circle size={8} fill="currentColor" /> No prazo
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-hairline px-2.5 py-1 text-[11px] text-muted-foreground">
                <Coffee size={12} /> {allProjects.length} projeto{allProjects.length !== 1 ? "s" : ""} ativo{allProjects.length !== 1 ? "s" : ""}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-hairline px-2.5 py-1 text-[11px] text-muted-foreground">
                {taskSheetOpen ? "Criando tarefa…" : `${week.filter((d) => d.type !== "empty").length} entrega${week.filter((d) => d.type !== "empty").length !== 1 ? "s" : ""} nesta semana`}
              </span>
            </div>
          </div>
        </div>
        <div className="col-span-12 xl:col-span-5">
          <AutomationPanel />
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 px-8 pt-8 md:grid-cols-3">
        <MetricCard icon={Zap} label="Projetos Ativos" value={String(allProjects.length)} sub={allProjects.length === 0 ? "crie seu primeiro projeto" : "total em andamento"} tone="emerald">
          <div className="h-2 w-full overflow-hidden rounded-full bg-(--surface-2)">
            <div className="h-full rounded-full bg-linear-to-r from-emerald-glow to-emerald-glow/60" style={{ width: `${Math.min(100, allProjects.length * 20)}%` }} />
          </div>
        </MetricCard>
        <MetricCard icon={Diamond} label="Tarefas da Semana" value={String(week.filter((d) => d.type !== "empty").length)} sub="blocos preenchidos" tone="violet">
          <div className="flex gap-1">
            {Array.from({ length: 9 }).map((_, i) => (
              <span key={i} className={`h-6 flex-1 rounded-sm ${week[i] && week[i].type !== "empty" ? "bg-violet-glow" : "bg-(--surface-2)"}`} />
            ))}
          </div>
        </MetricCard>
        <MetricCard icon={Smile} label={`Cliente${allProjects.length !== 1 ? 's' : ''}`} value={String(allProjects.length)} sub={allProjects.length === 0 ? "nenhum cliente ainda" : `cadastrado${allProjects.length !== 1 ? 's' : ''}`} tone="amber">
          <div className="flex items-center gap-2">
            {allProjects.length === 0 ? (
              <p className="text-[10px] text-muted-foreground w-full text-center">Nenhum projeto cadastrado</p>
            ) : (
              allProjects.slice(0, 5).map((p, i) => (
                <div key={p.id} className="flex flex-1 flex-col items-center gap-1 rounded-md border border-hairline bg-(--surface-2) px-2 py-1.5">
                  <span className={`h-1.5 w-full rounded-full ${i === 4 ? "bg-amber-glow" : "bg-emerald-glow"}`} />
                  <span className="text-[9px] text-muted-foreground truncate w-full text-center">{p.name}</span>
                </div>
              ))
            )}
          </div>
        </MetricCard>
      </section>

      <section className="px-8 pb-10 pt-10">
        <div className="mb-4 flex items-end justify-between">
          <div>
            <p className="text-mono text-[10px] uppercase tracking-widest text-muted-foreground">Agenda semanal · modo carreira</p>
            <h2 className="text-display mt-1 text-2xl text-foreground">Próximos 9 dias</h2>
          </div>
          <div className="flex items-center gap-3 text-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-emerald-glow" /> Foco profundo</span>
            <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-violet-glow" /> Reuniões</span>
            <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-amber-glow" /> Prazo</span>
          </div>
        </div>
        <div className="grid grid-cols-9 gap-2">
          {week.map((d, i) => (
            <DayCard key={`${d.name}-${d.num}-${i}`} d={d} onAddTask={handleAddTask} />
          ))}
        </div>
        <div className="mt-4 flex items-center justify-between rounded-xl border border-hairline bg-(--surface-1) px-4 py-3 text-xs text-muted-foreground">
          <span className="text-mono uppercase tracking-widest">Timeline sincronizada com o Google Calendar · dados do banco local</span>
          <button className="text-emerald-glow hover:brightness-110">Reorganizar semana →</button>
        </div>
      </section>
    </>
  );
}
