"use client";

import { useMemo, useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft, ChevronRight, Plus, Clock, Hash, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerClose } from "@/components/ui/drawer";
import { CreateTaskSheet } from "@/components/CreateTaskSheet";
import { getTasks, skipDay as skipDayAction } from "@/lib/actions/tasks";
import { updateTaskStatus } from "@/lib/actions/tasks";

type TaskItem = {
  id: string;
  title: string;
  projectId: string;
  blockType: string;
  dueDate: string;
  startTime: string | null;
  endTime: string | null;
  completed: boolean;
};

type ProjectItem = {
  id: string;
  name: string;
};

const HOUR_HEIGHT = 60;
const START_HOUR = 6;
const END_HOUR = 22;
const TOTAL_HOURS = END_HOUR - START_HOUR;
const MAX_TITLE_LEN = 30;

const blockTypeColors: Record<string, string> = {
  deep_focus: "bg-emerald-glow/15 border-emerald-glow/40 text-emerald-glow",
  meeting: "bg-violet-glow/15 border-violet-glow/40 text-violet-glow",
  deadline: "bg-amber-glow/15 border-amber-glow/40 text-amber-glow",
  design: "bg-cyan-glow/15 border-cyan-glow/40 text-cyan-glow",
  admin: "bg-amber-glow/10 border-amber-glow/30 text-amber-glow",
};

const blockTypeLabels: Record<string, string> = {
  deep_focus: "Foco Profundo",
  meeting: "Reunião",
  deadline: "Prazo",
  design: "UI/UX Design",
  admin: "Admin",
};

function trunc(s: string, max = MAX_TITLE_LEN) {
  return s.length > max ? s.slice(0, max) + "..." : s;
}

function getWeekDays(date: Date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));
  const days: Date[] = [];
  for (let i = 0; i < 5; i++) {
    const day = new Date(monday);
    day.setDate(monday.getDate() + i);
    days.push(day);
  }
  return days;
}

function isSameDay(a: Date, b: Date) {
  return a.toDateString() === b.toDateString();
}

function formatDateHeader(date: Date) {
  const days = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  const dayName = days[date.getDay()];
  const dayNum = date.getDate();
  const isToday = isSameDay(date, new Date());
  return { dayName, dayNum, isToday };
}

function formatHour(hour: number) {
  return `${String(hour).padStart(2, "0")}:00`;
}

export function CalendarClient({ initialTasks, projects }: { initialTasks: TaskItem[]; projects: ProjectItem[] }) {
  const router = useRouter();
  const [weekStart, setWeekStart] = useState(() => {
    const monday = getWeekDays(new Date())[0];
    return monday;
  });
  const [tasks, setTasks] = useState<TaskItem[]>(initialTasks);
  const [taskSheetOpen, setTaskSheetOpen] = useState(false);
  const [defaultTaskDate, setDefaultTaskDate] = useState<string>("");
  const nowRef = useRef<HTMLDivElement>(null);
  const [now, setNow] = useState(new Date());

  // Task detail dialog
  const [selectedTask, setSelectedTask] = useState<TaskItem | null>(null);

  // Day tasks drawer
  const [drawerDay, setDrawerDay] = useState<Date | null>(null);

  const days = useMemo(() => getWeekDays(weekStart), [weekStart]);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    nowRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, []);

  const currentTimePosition = useMemo(() => {
    const hours = now.getHours() + now.getMinutes() / 60;
    return (hours - START_HOUR) * HOUR_HEIGHT;
  }, [now]);

  const currentDayIndex = (() => {
    const day = now.getDay();
    if (day >= 1 && day <= 5) return day - 1;
    return -1;
  })();

  const goToday = useCallback(() => {
    const monday = getWeekDays(new Date())[0];
    setWeekStart(monday);
  }, []);

  const goPrev = useCallback(() => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() - 7);
    setWeekStart(d);
  }, [weekStart]);

  const goNext = useCallback(() => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + 7);
    setWeekStart(d);
  }, [weekStart]);

  const handleCellClick = useCallback((day: Date, hour: number) => {
    const dateStr = day.toISOString().split("T")[0];
    const timeStr = `${String(hour).padStart(2, "0")}:00`;
    setDefaultTaskDate(dateStr);
    setTaskSheetOpen(true);
  }, []);

  const handleDayHeaderClick = useCallback((day: Date) => {
    setDrawerDay(day);
  }, []);

  const handleTaskCreated = useCallback(async () => {
    const fresh = await getTasks();
    setTasks(fresh.map(t => ({
      id: t.id,
      title: t.title,
      projectId: t.projectId,
      blockType: t.blockType,
      dueDate: t.dueDate,
      startTime: t.startTime,
      endTime: t.endTime,
      completed: t.completed,
    })));
  }, []);

  const handleToggleComplete = useCallback(async (task: TaskItem) => {
    await updateTaskStatus(task.id, !task.completed);
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, completed: !t.completed } : t));
    setSelectedTask(prev => prev && prev.id === task.id ? { ...prev, completed: !prev.completed } : prev);
    router.refresh();
  }, [router]);

  const handleSkipDay = useCallback(async (day: Date) => {
    const dateStr = day.toISOString().split("T")[0];
    const label = day.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });
    const confirmed = window.confirm(`Pular ${label}?\n\nTarefas não concluídas serão removidas e todos os prazos futuros serão adiados em 1 dia útil.`);
    if (!confirmed) return;

    await skipDayAction(dateStr);
    const fresh = await getTasks();
    setTasks(fresh.map(t => ({
      id: t.id,
      title: t.title,
      projectId: t.projectId,
      blockType: t.blockType,
      dueDate: t.dueDate,
      startTime: t.startTime,
      endTime: t.endTime,
      completed: t.completed,
    })));
    router.refresh();
  }, [router]);

  const getTasksForDay = useCallback((day: Date) => {
    const dateStr = day.toISOString().split("T")[0];
    return tasks.filter(t => t.dueDate === dateStr);
  }, [tasks]);

  const selectedProject = selectedTask ? projects.find(p => p.id === selectedTask.projectId) : null;
  const drawerTasks = drawerDay ? getTasksForDay(drawerDay) : [];

  return (
    <div className="flex h-full flex-col bg-(--surface-0)">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-hairline px-6 py-3">
        <div className="flex items-center gap-3">
          <h1 className="text-display text-lg text-foreground">Agenda Semanal</h1>
          <Badge variant="outline" className="text-[10px]">
            <Clock size={10} className="mr-1" /> {START_HOUR}:00 - {END_HOUR}:00
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={goPrev}>
            <ChevronLeft size={14} />
          </Button>
          <Button variant="outline" size="sm" onClick={goToday} className="text-[11px]">
            Hoje
          </Button>
          <Button variant="outline" size="sm" onClick={goNext}>
            <ChevronRight size={14} />
          </Button>
          <div className="ml-2 text-sm text-muted-foreground">
            {days[0].toLocaleDateString("pt-BR", { day: "numeric", month: "short" })} - {days[4].toLocaleDateString("pt-BR", { day: "numeric", month: "short", year: "numeric" })}
          </div>
        </div>
      </header>

      {/* Calendar Grid */}
      <div className="flex flex-1 overflow-auto">
        <div className="flex w-full">
          {/* Time column */}
          <div className="w-16 shrink-0 border-r border-hairline">
            <div className="h-10 border-b border-hairline" />
            {Array.from({ length: TOTAL_HOURS }).map((_, i) => {
              const hour = START_HOUR + i;
              return (
                <div
                  key={hour}
                  style={{ height: HOUR_HEIGHT }}
                  className="flex items-start justify-center border-b border-hairline/50 pt-1"
                >
                  <span className="text-mono text-[10px] text-muted-foreground">{formatHour(hour)}</span>
                </div>
              );
            })}
          </div>

          {/* Day columns */}
          <div className="flex flex-1">
            {days.map((day, dayIdx) => {
              const { dayName, dayNum, isToday } = formatDateHeader(day);
              const dayTasks = getTasksForDay(day);

              return (
                <div key={dayIdx} className="flex-1 border-r border-hairline last:border-r-0">
                  {/* Day header — click to open drawer */}
                  <div className="relative group">
                    <div
                      onClick={() => handleDayHeaderClick(day)}
                      className={`flex h-10 cursor-pointer flex-col items-center justify-center border-b border-hairline hover:bg-(--surface-1) transition-colors ${isToday ? "bg-emerald-glow/5" : ""}`}
                    >
                      <span className={`text-mono text-[10px] uppercase tracking-widest ${isToday ? "text-emerald-glow" : "text-muted-foreground"}`}>
                        {dayName}
                      </span>
                      <span className={`text-sm font-semibold ${isToday ? "text-emerald-glow" : "text-foreground"}`}>
                        {dayNum}
                      </span>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleSkipDay(day); }}
                      className="absolute right-0.5 top-0.5 p-0.5 rounded text-muted-foreground/30 hover:text-rose-500 hover:bg-rose-500/10 opacity-0 group-hover:opacity-100 transition-all"
                      title="Pular dia (remover tarefas + adiar prazos)"
                    >
                      <X size={10} />
                    </button>
                  </div>

                  {/* Time slots */}
                  <div className="relative">
                    {Array.from({ length: TOTAL_HOURS }).map((_, i) => {
                      const hour = START_HOUR + i;
                      return (
                        <div
                          key={`${dayIdx}-${hour}`}
                          style={{ height: HOUR_HEIGHT }}
                          onClick={() => handleCellClick(day, hour)}
                          className="relative cursor-pointer border-b border-hairline/30 hover:bg-(--surface-1) transition-colors"
                        />
                      );
                    })}

                    {/* Scheduled tasks */}
                    {dayTasks.filter(t => t.startTime).map(task => {
                      const startHour = task.startTime ? parseInt(task.startTime.split(":")[0]) + parseInt(task.startTime.split(":")[1]) / 60 : 0;
                      const endHour = task.endTime ? parseInt(task.endTime.split(":")[0]) + parseInt(task.endTime.split(":")[1]) / 60 : startHour + 1;
                      const top = (startHour - START_HOUR) * HOUR_HEIGHT;
                      const height = Math.max((endHour - startHour) * HOUR_HEIGHT, 24);
                      const color = blockTypeColors[task.blockType] || "bg-muted/15 border-muted/40 text-muted-foreground";
                      const project = projects.find(p => p.id === task.projectId);

                      return (
                        <div
                          key={task.id}
                          style={{ top: top, height: height, left: 2, right: 2 }}
                          onClick={() => setSelectedTask(task)}
                          className={`absolute z-10 cursor-pointer overflow-hidden rounded-md border px-1.5 py-1 text-[11px] ${color} ${task.completed ? "opacity-50" : ""}`}
                        >
                          <p className="truncate font-semibold">{trunc(task.title)}</p>
                          {project && <p className="truncate opacity-70">{trunc(project.name)}</p>}
                          {task.startTime && task.endTime && (
                            <p className="text-[10px] opacity-60">
                              {task.startTime.slice(0, 5)} - {task.endTime.slice(0, 5)}
                            </p>
                          )}
                        </div>
                      );
                    })}

                    {/* Deadline tasks */}
                    {dayTasks.filter(t => !t.startTime).slice(0, 3).map((task, i) => {
                      const color = blockTypeColors[task.blockType] || "bg-muted/15 border-muted/40 text-muted-foreground";
                      return (
                        <div
                          key={task.id}
                          style={{ top: 4 + i * 22, left: 4, right: 4 }}
                          onClick={() => setSelectedTask(task)}
                          className="absolute z-10 cursor-pointer truncate rounded px-1.5 py-0.5 text-[10px] border"
                        >
                          <span className={color.split(" ").slice(2).join(" ")}>{trunc(task.title)}</span>
                        </div>
                      );
                    })}

                    {/* Current time indicator */}
                    {isToday && currentDayIndex >= 0 && currentTimePosition >= 0 && currentTimePosition < TOTAL_HOURS * HOUR_HEIGHT && (
                      <div
                        ref={nowRef}
                        style={{ top: currentTimePosition }}
                        className="absolute left-0 right-0 z-20 flex items-center pointer-events-none"
                      >
                        <div className="h-0.5 w-full bg-rose-glow" />
                        <div className="absolute -left-1 h-2.5 w-2.5 rounded-full bg-rose-glow" />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Day Tasks Drawer — left swipe */}
      <Drawer open={!!drawerDay} onOpenChange={(open) => { if (!open) setDrawerDay(null); }} swipeDirection="left">
        <DrawerContent>
          <DrawerHeader>
            <div className="flex items-center justify-between">
              <DrawerTitle className="text-lg">
                {drawerDay ? drawerDay.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" }) : ""}
              </DrawerTitle>
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
                  const project = projects.find(p => p.id === t.projectId);
                  const meta = blockTypeLabels[t.blockType] || t.blockType;
                  const color = blockTypeColors[t.blockType] || "text-muted-foreground";
                  const colorClass = color.split(" ").slice(2).join(" ");
                  const timeRange = t.startTime && t.endTime
                    ? `${t.startTime.slice(0, 5)} - ${t.endTime.slice(0, 5)}`
                    : null;
                  return (
                    <div key={t.id} className="flex items-start gap-3 py-3">
                      <button onClick={() => { updateTaskStatus(t.id, !t.completed); setTasks(prev => prev.map(pt => pt.id === t.id ? { ...pt, completed: !pt.completed } : pt)); router.refresh(); }} className="shrink-0 mt-0.5">
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
                          <span className={`text-mono text-[10px] ${colorClass}`}>{meta}</span>
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

      {/* Task Detail Dialog */}
      <Dialog open={!!selectedTask} onOpenChange={(open) => !open && setSelectedTask(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span>{selectedTask?.title}</span>
              {selectedTask && (
                <Badge variant={selectedTask.completed ? "default" : "outline"}
                  className={selectedTask.completed ? "bg-emerald-glow text-xs" : "text-xs"}>
                  {selectedTask.completed ? "Concluída" : "Pendente"}
                </Badge>
              )}
            </DialogTitle>
            <DialogDescription>
              {selectedTask && (
                <div className="mt-4 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-mono text-[10px] uppercase tracking-widest text-muted-foreground">Projeto</p>
                      <p className="text-sm text-foreground">{selectedProject?.name || "—"}</p>
                    </div>
                    <div>
                      <p className="text-mono text-[10px] uppercase tracking-widest text-muted-foreground">Tipo</p>
                      <p className="text-sm text-foreground">{blockTypeLabels[selectedTask.blockType] || selectedTask.blockType}</p>
                    </div>
                    <div>
                      <p className="text-mono text-[10px] uppercase tracking-widest text-muted-foreground">Data</p>
                      <p className="text-sm text-foreground">{new Date(selectedTask.dueDate).toLocaleDateString("pt-BR")}</p>
                    </div>
                    <div>
                      <p className="text-mono text-[10px] uppercase tracking-widest text-muted-foreground">Horário</p>
                      <p className="text-sm text-foreground">
                        {selectedTask.startTime && selectedTask.endTime
                          ? `${selectedTask.startTime.slice(0, 5)} - ${selectedTask.endTime.slice(0, 5)}`
                          : "—"}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 pt-2">
                    <Button size="sm" variant={selectedTask.completed ? "outline" : "default"}
                      onClick={() => handleToggleComplete(selectedTask)}>
                      {selectedTask.completed ? "Reabrir" : "Marcar como concluída"}
                    </Button>
                    {selectedTask.completed && (
                      <Button size="sm" variant="outline"
                        onClick={async () => {
                          const { advanceProjectDeadlines } = await import("@/lib/actions/tasks");
                          await advanceProjectDeadlines(selectedTask.projectId, 1);
                          router.refresh();
                        }}
                        className="text-emerald-glow border-emerald-glow/30 hover:bg-emerald-glow/10"
                      >
                        Adiantar prazo +1 dia
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>

      <CreateTaskSheet
        open={taskSheetOpen}
        onOpenChange={setTaskSheetOpen}
        defaultDate={defaultTaskDate}
        projects={projects}
        onCreated={handleTaskCreated}
      />
    </div>
  );
}
