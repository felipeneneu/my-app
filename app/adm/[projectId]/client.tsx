"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft, CheckCircle2, Circle,
  ClipboardList,
  Clock, Hash,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { updateOSItemStatus, type OSItem } from "@/lib/actions/os";

type ProjectData = { id: string; name: string; clientName: string; price: number; status: string; startDate: string };
type TaskData = { id: string; title: string; blockType: string; dueDate: string; startTime: string | null; endTime: string | null; completed: boolean };
const blockTypeMeta: Record<string, { label: string; color: string }> = {
  deep_focus: { label: "Foco Profundo", color: "text-emerald-glow" },
  meeting: { label: "Reunião", color: "text-violet-glow" },
  deadline: { label: "Prazo", color: "text-amber-glow" },
  design: { label: "UI/UX Design", color: "text-cyan-glow" },
  admin: { label: "Admin", color: "text-amber-glow" },
};

function formatBRL(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

type OSItemEntry = {
  id: string;
  name: string;
  status: "pending" | "in_progress" | "completed";
  deadline?: string;
  blockType?: string;
};

export function ProjectDetailClient({ project, contractData, osId, osItems: initialOsItems, projectTasks }: {
  project: ProjectData;
  contractData: Record<string, unknown> | null;
  osId: string | null;
  osItems: OSItemEntry[];
  projectTasks: TaskData[];
}) {
  const [osItems, setOsItems] = useState<OSItemEntry[]>(initialOsItems);

  const doneCount = osItems.filter((i) => i.status === "completed").length;
  const progress = osItems.length > 0 ? (doneCount / osItems.length) * 100 : 0;

  async function handleToggleItemStatus(idx: number) {
    const current = osItems[idx];
    if (!current || !osId) return;
    const nextStatus = current.status === "completed" ? "pending" : current.status === "in_progress" ? "completed" : "in_progress";
    try {
      await updateOSItemStatus(osId, idx, nextStatus as OSItem["status"]);
    } catch {}
    setOsItems((prev) => prev.map((item, i) => i === idx ? { ...item, status: nextStatus as OSItem["status"] } : item));
  }

  return (
    <>
      <header className="flex items-center justify-between border-b border-hairline px-8 py-4">
        <div className="flex items-center gap-3">
          <Link href="/adm" className="inline-flex items-center gap-1.5 rounded-md border border-hairline px-2 py-1 text-[11px] text-muted-foreground hover:text-foreground">
            <ArrowLeft size={12} /> Painel
          </Link>
          <p className="text-mono text-[11px] uppercase tracking-widest text-muted-foreground">Sprint OS / Projeto ativo</p>
        </div>
        <Badge variant="outline"><span className="text-mono">{project.status}</span></Badge>
      </header>

      {/* Project Summary */}
      <section className="px-8 pt-8">
        <div className="rounded-2xl border border-hairline bg-(--surface-1) p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-mono text-[10px] uppercase tracking-widest text-emerald-glow">Projeto ativo · {project.status.toUpperCase()}</p>
              <h1 className="text-display mt-1 text-4xl text-foreground">{project.name}</h1>
              <div className="mt-4 grid grid-cols-2 gap-x-8 gap-y-3">
                <div>
                  <p className="text-mono text-[10px] uppercase tracking-widest text-muted-foreground">Cliente</p>
                  <p className="text-sm text-foreground">{contractData?.clientName as string || project.clientName}</p>
                </div>
                <div>
                  <p className="text-mono text-[10px] uppercase tracking-widest text-muted-foreground">Valor</p>
                  <p className="text-sm text-foreground">{formatBRL(project.price)}</p>
                </div>
                <div>
                  <p className="text-mono text-[10px] uppercase tracking-widest text-muted-foreground">Escopo</p>
                  <p className="text-sm text-foreground">{contractData?.scope as string || "—"}</p>
                </div>
                <div>
                  <p className="text-mono text-[10px] uppercase tracking-widest text-muted-foreground">Prazo</p>
                  <p className="text-sm text-foreground">{contractData?.deadline as string || "—"}</p>
                </div>
              </div>
            </div>
            <div className="shrink-0 flex flex-col items-center gap-2 pl-6">
              <div className="relative flex h-20 w-20 items-center justify-center">
                <svg viewBox="0 0 100 100" className="h-20 w-20 -rotate-90">
                  <circle cx="50" cy="50" r="42" strokeWidth="8" fill="none" className="stroke-(--surface-2)" />
                  <circle cx="50" cy="50" r="42" strokeWidth="8" fill="none" strokeLinecap="round" strokeDasharray={264} strokeDashoffset={264 - (264 * progress) / 100} className="stroke-emerald-glow drop-shadow-[0_0_10px_rgba(0,255,180,0.6)] transition-all" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center"><span className="text-display text-xl text-foreground">{Math.round(progress)}%</span></div>
              </div>
              <p className="text-mono text-[9px] uppercase tracking-widest text-muted-foreground">{doneCount}/{osItems.length} itens</p>
            </div>
          </div>

          {projectTasks.length > 0 && (
            <div className="mt-5 border-t border-hairline pt-4">
              <p className="text-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-2">Próximas tarefas</p>
              <div className="flex flex-col gap-1.5">
                {projectTasks.filter(t => !t.completed).slice(0, 5).map(t => {
                  const meta = blockTypeMeta[t.blockType] || { label: t.blockType, color: "text-muted-foreground" };
                  const timeRange = t.startTime && t.endTime ? `${t.startTime.slice(0, 5)}-${t.endTime.slice(0, 5)}` : null;
                  return (
                    <div key={t.id} className="flex items-center gap-2 rounded-md bg-(--surface-2) px-3 py-1.5 text-sm">
                      <span className="flex-1 text-foreground">{t.title}</span>
                      {timeRange && <span className="text-mono text-[11px] text-muted-foreground">{timeRange}</span>}
                      <span className={`text-mono text-[10px] ${meta.color}`}>{meta.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-hairline pt-4">
            <Link href={`/adm/project/${project.id}/briefing`}
              className="inline-flex items-center gap-1.5 rounded-md border border-hairline px-3 py-1.5 text-[11px] text-muted-foreground hover:text-foreground hover:border-cyan-glow/40 transition-colors">
              <Hash size={12} /> Briefing
            </Link>
          </div>
        </div>
      </section>

      {/* Delivery Items (from OS) */}
      <section className="px-8 pt-8">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-mono text-[10px] uppercase tracking-widest text-muted-foreground">Itens de entrega</p>
                <CardTitle className="text-display text-xl">Ordem de Serviço</CardTitle>
              </div>
              <ClipboardList size={16} className="text-violet-glow" />
            </div>
          </CardHeader>
          <CardContent>
            {osItems.length === 0 ? (
              <p className="py-4 text-center text-xs text-muted-foreground">
                Nenhum item de OS encontrado. Crie um orçamento para gerar a OS automaticamente.
              </p>
            ) : (
              <div className="flex flex-col divide-y divide-hairline">
                {osItems.map((item, idx) => {
                  const isCompleted = item.status === "completed";
                  const isInProgress = item.status === "in_progress";
                  return (
                    <div key={idx} className="flex items-center gap-3 py-3">
                      <button onClick={() => handleToggleItemStatus(idx)} className="shrink-0">
                        {isCompleted ? (
                          <CheckCircle2 size={18} className="text-emerald-glow" />
                        ) : isInProgress ? (
                          <Clock size={18} className="text-violet-glow" />
                        ) : (
                          <Circle size={18} className="text-muted-foreground" />
                        )}
                      </button>
                      <div className="min-w-0 flex-1">
                        <p className={`text-sm ${isCompleted ? "text-muted-foreground line-through" : "text-foreground"}`}>
                          {item.name}
                        </p>
                        {item.deadline && (
                          <p className="text-[10px] text-muted-foreground">Prazo: {item.deadline}</p>
                        )}
                      </div>
                      <Badge variant={isCompleted ? "default" : isInProgress ? "secondary" : "outline"} className="text-[10px]">
                        {isCompleted ? "Concluído" : isInProgress ? "Em andamento" : "Pendente"}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </>
  );
}
