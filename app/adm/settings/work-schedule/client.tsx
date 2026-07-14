"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowLeft, Clock, Plus, Trash2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { upsertWorkSchedule } from "@/lib/actions/work-schedule";

type ScheduleEntry = {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  blockType: "work" | "focus" | "meeting" | "break" | "unavailable";
};

const DAY_LABELS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

const BLOCK_LABELS: Record<string, string> = {
  work: "Trabalho",
  focus: "Foco",
  meeting: "Reunião",
  break: "Pausa",
  unavailable: "Indisponível",
};

const BLOCK_COLORS: Record<string, string> = {
  work: "border-emerald-500/30 bg-emerald-500/10",
  focus: "border-violet-500/30 bg-violet-500/10",
  meeting: "border-amber-500/30 bg-amber-500/10",
  break: "border-blue-500/30 bg-blue-500/10",
  unavailable: "border-red-500/30 bg-red-500/10",
};

export function WorkScheduleClient({ initialSchedule }: { initialSchedule: ScheduleEntry[] }) {
  const router = useRouter();
  const [schedule, setSchedule] = useState<ScheduleEntry[]>(initialSchedule);
  const [saving, setSaving] = useState(false);

  const getSlotsForDay = useCallback((day: number) => {
    return schedule.filter(s => s.dayOfWeek === day).sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [schedule]);

  const addSlot = useCallback((day: number) => {
    setSchedule(prev => [...prev, {
      id: `temp-${Date.now()}-${Math.random()}`,
      dayOfWeek: day,
      startTime: "09:00",
      endTime: "10:00",
      blockType: "work",
    }]);
  }, []);

  const updateSlot = useCallback((id: string, field: string, value: string | number) => {
    setSchedule(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
  }, []);

  const removeSlot = useCallback((id: string) => {
    setSchedule(prev => prev.filter(s => s.id !== id));
  }, []);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      const entries = schedule.map(s => ({
        dayOfWeek: s.dayOfWeek,
        startTime: s.startTime,
        endTime: s.endTime,
        blockType: s.blockType as "work" | "focus" | "meeting" | "break" | "unavailable",
      }));
      const result = await upsertWorkSchedule(entries);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Agenda salva!");
      router.refresh();
    } catch {
      toast.error("Erro ao salvar");
    } finally {
      setSaving(false);
    }
  }, [schedule, router]);

  return (
    <>
      <header className="flex items-center justify-between border-b border-hairline px-8 py-4">
        <div className="flex items-center gap-3">
          <Link href="/adm" className="inline-flex items-center gap-1.5 rounded-md border border-hairline px-2 py-1 text-[11px] text-muted-foreground hover:text-foreground">
            <ArrowLeft size={12} /> Painel
          </Link>
          <Clock size={16} className="text-emerald-500" />
          <p className="text-mono text-[11px] uppercase tracking-widest text-muted-foreground">Capacidade Semanal</p>
        </div>
        <Button size="sm" onClick={handleSave} disabled={saving}>
          <Save size={14} /> {saving ? "Salvando…" : "Salvar Agenda"}
        </Button>
      </header>

      <section className="mx-auto max-w-4xl px-8 py-6">
        <p className="mb-6 text-xs text-muted-foreground">
          Defina sua disponibilidade semanal. Use "Trabalho" para blocos normais, "Foco" para deep work,
          "Pausa" para intervalos, "Indisponível" para horários ocupados.
        </p>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {DAY_LABELS.map((label, day) => {
            const slots = getSlotsForDay(day);
            return (
              <div key={day} className="rounded-lg border border-hairline p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-[11px] font-bold uppercase tracking-widest text-foreground">{label}</h3>
                  <button
                    onClick={() => addSlot(day)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <Plus size={14} />
                  </button>
                </div>
                {slots.length === 0 && (
                  <p className="text-[10px] text-muted-foreground/50">Nenhum bloco</p>
                )}
                <div className="space-y-1.5">
                  {slots.map(slot => (
                    <div key={slot.id} className={`rounded border px-2.5 py-2 ${BLOCK_COLORS[slot.blockType] ?? "border-hairline"}`}>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="time"
                          value={slot.startTime}
                          onChange={(e) => updateSlot(slot.id, "startTime", e.target.value)}
                          className="w-14 bg-transparent text-[10px] text-foreground outline-none"
                        />
                        <span className="text-[9px] text-muted-foreground">→</span>
                        <input
                          type="time"
                          value={slot.endTime}
                          onChange={(e) => updateSlot(slot.id, "endTime", e.target.value)}
                          className="w-14 bg-transparent text-[10px] text-foreground outline-none"
                        />
                      </div>
                      <div className="mt-1 flex items-center gap-1">
                        <select
                          value={slot.blockType}
                          onChange={(e) => updateSlot(slot.id, "blockType", e.target.value)}
                          className="flex-1 bg-transparent text-[9px] text-foreground outline-none"
                        >
                          {Object.entries(BLOCK_LABELS).map(([v, l]) => (
                            <option key={v} value={v}>{l}</option>
                          ))}
                        </select>
                        <button
                          onClick={() => removeSlot(slot.id)}
                          className="text-muted-foreground hover:text-red-500"
                        >
                          <Trash2 size={10} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </>
  );
}
