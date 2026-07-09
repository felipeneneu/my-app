"use client";

import { useMemo, useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft, ChevronRight, Plus, Clock, Hash,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CreateTaskSheet } from "@/components/CreateTaskSheet";

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

const blockTypeColors: Record<string, string> = {
  deep_focus: "bg-emerald-glow/15 border-emerald-glow/40 text-emerald-glow",
  meeting: "bg-violet-glow/15 border-violet-glow/40 text-violet-glow",
  deadline: "bg-amber-glow/15 border-amber-glow/40 text-amber-glow",
  design: "bg-cyan-glow/15 border-cyan-glow/40 text-cyan-glow",
  admin: "bg-amber-glow/10 border-amber-glow/30 text-amber-glow",
};

const blockTypeBg: Record<string, string> = {
  deep_focus: "bg-emerald-glow/5",
  meeting: "bg-violet-glow/5",
  design: "bg-cyan-glow/5",
  admin: "bg-amber-glow/5",
};

function getWeekDays(date: Date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));
  const days: Date[] = [];
  for (let i = 0; i < 7; i++) {
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

  const currentDayIndex = now.getDay() === 0 ? 6 : now.getDay() - 1;

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

  const getTasksForDay = useCallback((day: Date) => {
    const dateStr = day.toISOString().split("T")[0];
    return tasks.filter(t => {
      if (t.startTime) {
        return t.dueDate === dateStr;
      }
      return t.dueDate === dateStr;
    });
  }, [tasks]);

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
            {days[0].toLocaleDateString("pt-BR", { day: "numeric", month: "short" })} - {days[6].toLocaleDateString("pt-BR", { day: "numeric", month: "short", year: "numeric" })}
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
                  {/* Day header */}
                  <div className={`flex h-10 flex-col items-center justify-center border-b border-hairline ${isToday ? "bg-emerald-glow/5" : ""}`}>
                    <span className={`text-mono text-[10px] uppercase tracking-widest ${isToday ? "text-emerald-glow" : "text-muted-foreground"}`}>
                      {dayName}
                    </span>
                    <span className={`text-sm font-semibold ${isToday ? "text-emerald-glow" : "text-foreground"}`}>
                      {dayNum}
                    </span>
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

                    {/* Tasks */}
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
                          className={`absolute z-10 overflow-hidden rounded-md border px-1.5 py-1 text-[11px] ${color} ${task.completed ? "opacity-50" : ""}`}
                          title={task.title}
                        >
                          <p className="truncate font-semibold">{task.title}</p>
                          {project && <p className="truncate opacity-70">{project.name}</p>}
                          {task.startTime && task.endTime && (
                            <p className="text-[10px] opacity-60">
                              {task.startTime.slice(0, 5)} - {task.endTime.slice(0, 5)}
                            </p>
                          )}
                        </div>
                      );
                    })}

                    {/* Tasks without time - show at top */}
                    {dayTasks.filter(t => !t.startTime).slice(0, 3).map((task, i) => {
                      const color = blockTypeColors[task.blockType] || "bg-muted/15 border-muted/40 text-muted-foreground";
                      return (
                        <div
                          key={task.id}
                          style={{ top: 4 + i * 22, left: 4, right: 4 }}
                          className="absolute z-10 truncate rounded px-1.5 py-0.5 text-[10px] border"
                        >
                          <span className={color.split(" ").slice(2).join(" ")}>{task.title}</span>
                        </div>
                      );
                    })}

                    {/* Current time indicator */}
                    {isToday && currentTimePosition >= 0 && currentTimePosition < TOTAL_HOURS * HOUR_HEIGHT && (
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

      <CreateTaskSheet
        open={taskSheetOpen}
        onOpenChange={setTaskSheetOpen}
        defaultDate={defaultTaskDate}
        projects={projects}
      />
    </div>
  );
}
