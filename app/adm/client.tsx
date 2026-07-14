"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  Briefcase,
  Plus,
  Timer,
  Settings2,
  Sun,
  Moon,
  Sunset,
  X,
} from "lucide-react";
import { getProjects } from "@/lib/actions/projects";
import { getTasks } from "@/lib/actions/tasks";
import { updateTaskStatus } from "@/lib/actions/tasks";
import { getFocusModes, type FocusBlock } from "@/lib/actions/focus-modes";
import { useNotificationStream } from "@/hooks/use-notification-stream";
import { CreateTaskSheet } from "@/components/CreateTaskSheet";
import { CreateProjectSheet } from "@/components/CreateProjectSheet";
import { EditFocusBlocksSheet } from "@/components/EditFocusBlocksSheet";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerClose } from "@/components/ui/drawer";
import { toast } from "sonner";

const MAX_TITLE_LEN = 30;

function trunc(s: string, max = MAX_TITLE_LEN) {
  return s.length > max ? s.slice(0, max) + "..." : s;
}

const blockTypeLabels: Record<string, string> = {
  deep_focus: "Foco Profundo",
  meeting: "Reunião",
  deadline: "Prazo",
  design: "UI/UX Design",
  admin: "Admin",
};

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

function buildWeek(tasks?: { dueDate: string; title: string; blockType: string; projectName?: string; startTime?: string | null; endTime?: string | null }[]): Day[] {
  const today = new Date();
  const names = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SÁB"];
  const days: Day[] = [];

  for (let i = 0; i < 9; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
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
      detail: dayTasks.length > 0 ? dayTasks.map((t) => {
        const timeStr = t.startTime && t.endTime ? ` (${t.startTime.slice(0, 5)}-${t.endTime.slice(0, 5)})` : "";
        return `${t.title}${timeStr}`;
      }).join(", ") : undefined,
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

function DayCard({ d, onAddTask, onClick }: { d: Day; onAddTask?: (date: string) => void; onClick?: () => void }) {
  const base = "relative flex h-[172px] w-full flex-col overflow-hidden rounded-xl border p-3 transition-all cursor-pointer";
  const today = new Date();
  const month = String(today.getMonth() + 1).padStart(2, "0");

  if (d.type === "empty") {
    return (
      <div onClick={onClick} className={`${base} border-dashed border-hairline bg-(--surface-1) opacity-60 hover:opacity-100 hover:border-emerald-glow/40`}>
        <p className="text-mono text-[10px] tracking-widest text-muted-foreground">{d.name}</p>
        <p className="text-display text-3xl text-muted-foreground">{String(d.num).padStart(2, "0")}</p>
        <div className="mt-auto flex flex-col items-center gap-2">
          <p className="text-[11px] text-muted-foreground">Slot Livre</p>
          <button type="button" onClick={(e) => { e.stopPropagation(); onAddTask?.(`${today.getFullYear()}-${month}-${String(d.num).padStart(2, "0")}`); }}
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
    <div onClick={onClick} className={`${base} ${styles}`}>
      {d.today && <span className="absolute right-2 top-2 rounded-md bg-foreground px-1.5 py-0.5 text-[9px] font-bold text-(--surface-0)">HOJE</span>}
      <p className={`text-mono text-[10px] tracking-widest ${nameColor}`}>{d.name}</p>
      <p className="text-display text-3xl text-foreground">{String(d.num).padStart(2, "0")}</p>
      <div className="mt-auto">
        <div className="mb-2 flex gap-1">
          {Array.from({ length: 6 }).map((_, i) => (
            <span key={i} className={`h-1.5 flex-1 rounded-full ${d.type === "prod" ? "bg-emerald-glow/60" : d.type === "meet" ? "bg-violet-glow/60" : "bg-muted-foreground/30"} ${i > (d.type === "past" ? 5 : d.type === "prod" ? 4 : 3) ? "opacity-30" : ""}`} />
          ))}
        </div>
        <p className="text-[11px] font-semibold text-foreground truncate">{trunc(d.label)}</p>
        {d.detail && <p className="text-[10px] text-muted-foreground truncate">{trunc(d.detail)}</p>}
      </div>
    </div>
  );
}



const blockIcons: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  deep: Code2, meet: Video, design: Palette, admin: Briefcase,
};

function AutomationPanel({ blocks, toggles: initialToggles, onEdit, todayTasks }: {
  blocks: FocusBlock[];
  toggles: Record<string, boolean>;
  onEdit: () => void;
  todayTasks?: { title: string; startTime?: string | null; endTime?: string | null; projectName?: string; blockType: string }[];
}) {
  const [active, setActive] = useState<Record<string, boolean>>(initialToggles);
  const { nextBlock } = useNotificationStream();

  const currentBlock = (() => {
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    for (const b of blocks) {
      if (currentMinutes >= b.start && currentMinutes < b.end) {
        const remaining = b.end - currentMinutes;
        const Icon = blockIcons[b.id] || Code2;
        return { ...b, remaining: `${Math.floor(remaining / 60)}h ${remaining % 60}m`, icon: Icon };
      }
    }
    return null;
  })();

  const upcomingTasks = (todayTasks || [])
    .filter(t => t.startTime)
    .sort((a, b) => (a.startTime || "").localeCompare(b.startTime || ""));

  return (
    <div className="flex w-full flex-col overflow-hidden rounded-2xl border border-hairline bg-(--surface-1)">
      <div className="flex items-center justify-between border-b border-hairline px-5 py-4">
        <div>
          <p className="text-mono text-[10px] uppercase tracking-widest text-muted-foreground">Regras da agenda</p>
          <h3 className="text-base font-semibold text-foreground">Modos de foco diários</h3>
        </div>
        <Link href="/adm/calendar" className="inline-flex items-center gap-1.5 rounded-full border border-violet-glow/30 bg-violet-glow/10 px-2.5 py-1 text-[10px] font-semibold text-violet-glow hover:brightness-110 transition-all">
          <CalendarSync size={12} /> Ver calendário semanal
        </Link>
      </div>
      <div className="flex flex-col gap-2 p-4">
          {blocks.map((m) => {
            const on = active[m.id];
            const toneText = m.tone === "emerald" ? "text-emerald-glow" : m.tone === "violet" ? "text-violet-glow" : "text-amber-glow";
            const toneBg = m.tone === "emerald" ? "bg-emerald-glow" : m.tone === "violet" ? "bg-violet-glow" : "bg-amber-glow";
            const Icon = blockIcons[m.id] || Code2;
            return (
              <div key={m.id} className="flex items-center gap-3 rounded-xl border border-hairline bg-(--surface-2) px-3 py-2.5">
                <div className={`flex h-9 w-9 items-center justify-center rounded-lg bg-(--surface-0) ${toneText}`}><Icon size={16} /></div>
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
        <div className="mb-2 flex items-center justify-between">
          <p className="text-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            Próximos compromissos do dia
          </p>
          <button onClick={onEdit} className="inline-flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors">
            <Settings2 size={12} /> Editar blocos
          </button>
        </div>
        <div className="space-y-2">
          {upcomingTasks.length === 0 ? (
            <p className="text-[11px] text-muted-foreground">Nenhum compromisso hoje</p>
          ) : (
            upcomingTasks.slice(0, 4).map((t, i) => {
              const toneMap: Record<string, string> = {
                deep_focus: "text-emerald-glow border-emerald-glow/30",
                meeting: "text-violet-glow border-violet-glow/30",
                deadline: "text-amber-glow border-amber-glow/30",
                design: "text-cyan-glow border-cyan-glow/30",
                admin: "text-amber-glow/70 border-amber-glow/20",
              };
              const tone = toneMap[t.blockType] || "text-muted-foreground border-hairline";
              return (
                <div key={i} className={`flex items-center gap-2 rounded-md border ${tone} bg-(--surface-2) px-2.5 py-1.5`}>
                  <Timer size={12} className="shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">{t.title}</p>
                    {t.projectName && <p className="text-[10px] text-muted-foreground truncate">{t.projectName}</p>}
                  </div>
                  {t.startTime && (
                    <span className="text-mono text-[10px] text-muted-foreground shrink-0">
                      {t.startTime.slice(0, 5)}{t.endTime ? `-${t.endTime.slice(0, 5)}` : ""}
                    </span>
                  )}
                </div>
              );
            })
          )}
          {upcomingTasks.length > 4 && (
            <p className="text-[10px] text-muted-foreground text-center">+{upcomingTasks.length - 4} mais compromissos hoje</p>
          )}
        </div>
      </div>
    </div>
  );
}

export function DashboardClient({ autoOpenProject = false }: { autoOpenProject?: boolean }) {
  const router = useRouter();
  const [taskSheetOpen, setTaskSheetOpen] = useState(false);
  const [projectSheetOpen, setProjectSheetOpen] = useState(autoOpenProject);
  const [selectedDate, setSelectedDate] = useState<string | undefined>();
  const [focusEditOpen, setFocusEditOpen] = useState(false);
  const [drawerDate, setDrawerDate] = useState<string | null>(null);
  const [dailyVerse, setDailyVerse] = useState<{ text: string; reference: string } | null>(null);
  const { unreadCount } = useNotificationStream();

  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    const cached = localStorage.getItem(`bible_verse_${today}`);
    if (cached) {
      setDailyVerse(JSON.parse(cached));
      return;
    }
    fetch("https://bible-api.com/?random=verse&translation=almeida")
      .then(r => r.json())
      .then(data => {
        const verse = { text: data.text, reference: data.reference };
        localStorage.setItem(`bible_verse_${today}`, JSON.stringify(verse));
        setDailyVerse(verse);
      })
      .catch(() => {});
  }, []);

  const { data: allProjectsData = [] } = useQuery({
    queryKey: ["projects"],
    queryFn: () => getProjects(),
    staleTime: 30000,
  });

  const { data: tasksData = [] } = useQuery({
    queryKey: ["tasks"],
    queryFn: () => getTasks(),
    staleTime: 30000,
  });

  const { data: focusData } = useQuery({
    queryKey: ["focusModes"],
    queryFn: () => getFocusModes(),
    staleTime: 60000,
  });

  const allProjects: Project[] = allProjectsData.map((p) => ({
    id: p.id, name: p.name, clientName: p.clientName, price: p.price, status: p.status,
  }));

  const tasks = tasksData.map((t) => ({
    id: t.id, dueDate: t.dueDate, title: t.title, blockType: t.blockType,
    startTime: t.startTime, endTime: t.endTime, projectId: t.projectId, completed: t.completed,
  }));

  const focusBlocks: FocusBlock[] = focusData?.blocks ?? [];
  const focusToggles: Record<string, boolean> = focusData?.toggles ?? {};

  const week = buildWeek(tasks);
  const today = new Date();
  const month = today.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "").toUpperCase();
  const dayNum = today.getDate();
  const weekday = today.toLocaleDateString("pt-BR", { weekday: "long" }).toUpperCase();
  const sprintWeek = getISOWeek(today);
  const sprintNumber = Math.floor((sprintWeek - 1) / 2) + 1;

  const greeting = today.getHours() < 12 ? "Bom dia" : today.getHours() < 18 ? "Boa tarde" : "Boa noite";

  function handleAddTask(date?: string) { setSelectedDate(date); setTaskSheetOpen(true); }

  const handleDayClick = useCallback((dayIndex: number) => {
    const date = new Date();
    date.setDate(date.getDate() + dayIndex);
    setDrawerDate(date.toISOString().split("T")[0]);
  }, []);

  const drawerTasks = drawerDate ? tasks.filter(t => t.dueDate === drawerDate) : [];
  const drawerDayLabel = drawerDate ? new Date(drawerDate + "T12:00:00").toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" }) : "";

  function handleProjectCreated() {
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
      <EditFocusBlocksSheet open={focusEditOpen} onOpenChange={setFocusEditOpen}
        blocks={focusBlocks} />

      {/* Day Tasks Drawer */}
      <Drawer open={!!drawerDate} onOpenChange={(open) => { if (!open) setDrawerDate(null); }} swipeDirection="left">
        <DrawerContent>
          <DrawerHeader>
            <div className="flex items-center justify-between">
              <DrawerTitle className="text-lg">{drawerDayLabel}</DrawerTitle>
              <DrawerClose render={<Button variant="ghost" size="icon"><X size={16} /></Button>} />
            </div>
            <DrawerDescription>
              {drawerTasks.length} {drawerTasks.length === 1 ? "tarefa" : "tarefas"}
            </DrawerDescription>
          </DrawerHeader>
          <div className="flex-1 overflow-auto px-4 pb-4">
            {drawerTasks.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">Nenhuma tarefa neste dia</p>
            ) : (
              <div className="flex flex-col divide-y divide-hairline">
                {drawerTasks.map(t => {
                  const project = allProjects.find(p => p.id === t.projectId);
                  const meta = blockTypeLabels[t.blockType] || t.blockType;
                  const timeRange = t.startTime && t.endTime
                    ? `${t.startTime.slice(0, 5)} - ${t.endTime.slice(0, 5)}`
                    : null;
                  return (
                    <div key={t.id} className="flex items-start gap-3 py-3">
                      <button
                        onClick={async () => {
                          await updateTaskStatus(t.id, !t.completed);
                          router.refresh();
                        }}
                        className="shrink-0 mt-0.5"
                      >
                        {t.completed ? (
                          <div className="h-4 w-4 rounded-full bg-emerald-glow/20 border border-emerald-glow flex items-center justify-center">
                            <div className="h-2 w-2 rounded-full bg-emerald-glow" />
                          </div>
                        ) : (
                          <div className="h-4 w-4 rounded-full border border-hairline" />
                        )}
                      </button>
                      <div className="min-w-0 flex-1">
                        <p className={`text-sm ${t.completed ? "text-muted-foreground line-through" : "text-foreground"}`}>
                          {t.title}
                        </p>
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5">
                          {project && <span className="text-[11px] text-muted-foreground">{project.name}</span>}
                          {timeRange && <span className="text-[11px] text-muted-foreground">{timeRange}</span>}
                          <span className="text-mono text-[10px] text-muted-foreground">{meta}</span>
                          {t.completed && <span className="text-[10px] text-emerald-glow">Concluída</span>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </DrawerContent>
      </Drawer>

      <header className="flex items-center justify-between border-b border-hairline px-8 py-4">
        <div className="flex items-center gap-3">
          {greeting === "Bom dia" ? <Sun size={16} className="text-amber-glow" /> : greeting === "Boa tarde" ? <Sunset size={16} className="text-amber-glow" /> : <Moon size={16} className="text-violet-glow" />}
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
            <p className="text-mono text-[11px] uppercase tracking-widest text-muted-foreground">Semana {sprintWeek} · Sprint {sprintNumber} — {greeting}</p>
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
          <AutomationPanel blocks={focusBlocks} toggles={focusToggles} onEdit={() => setFocusEditOpen(true)}
            todayTasks={tasks
              .filter(t => t.dueDate === today.toISOString().split("T")[0])
              .map(t => ({
                ...t,
                projectName: allProjects.find(p => p.id === t.projectId)?.name,
              }))} />
        </div>
      </section>

      {dailyVerse && (
        <section className="px-8 pt-6">
          <div className="flex items-start gap-3 rounded-xl border border-hairline bg-(--surface-1) px-5 py-4">
            <span className="text-lg leading-none opacity-30 select-none">\"</span>
            <div className="flex-1">
              <p className="text-sm italic text-foreground leading-relaxed">{dailyVerse.text}</p>
              <p className="mt-1 text-[10px] text-muted-foreground text-right tracking-widest">{dailyVerse.reference}</p>
            </div>
            <span className="self-end text-lg leading-none opacity-30 select-none">\"</span>
          </div>
        </section>
      )}

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
            <DayCard key={`${d.name}-${d.num}-${i}`} d={d} onAddTask={handleAddTask} onClick={() => handleDayClick(i)} />
          ))}
        </div>
        <div className="mt-4 flex items-center justify-between rounded-xl border border-hairline bg-(--surface-1) px-4 py-3 text-xs text-muted-foreground">
          <span className="text-mono uppercase tracking-widest">Calendário interno · dados salvos no banco local</span>
          <Link href="/adm/calendar" className="text-emerald-glow hover:brightness-110">Ver calendário completo →</Link>
        </div>
      </section>
    </>
  );
}
