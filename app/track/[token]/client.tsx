"use client";

import {
  CheckCircle2,
  Clock,
  Circle,
  FileText,
  MessageSquare,
  ArrowUpRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

type MilestoneData = { id: string; label: string; status: string };
type NoteData = { content: string; createdAt: string };
type DocumentData = { id: string; type: string };

type TrackingData = {
  project: {
    id: string;
    name: string;
    status: string;
    price: number;
    progress: number;
  };
  milestones: MilestoneData[];
  notes: NoteData[];
  documents: DocumentData[];
};

const statusLabels: Record<string, { label: string; color: string }> = {
  active: { label: "Ativo", color: "bg-emerald-glow/20 text-emerald-glow border-emerald-glow/30" },
  paused: { label: "Pausado", color: "bg-amber-glow/20 text-amber-glow border-amber-glow/30" },
  completed: { label: "Concluído", color: "bg-violet-glow/20 text-violet-glow border-violet-glow/30" },
  cancelled: { label: "Cancelado", color: "bg-rose-glow/20 text-rose-glow border-rose-glow/30" },
};

const milestoneIcons: Record<string, typeof CheckCircle2> = {
  done: CheckCircle2,
  delivered: CheckCircle2,
  pending: Circle,
};

const milestoneColors: Record<string, string> = {
  done: "text-emerald-glow",
  delivered: "text-violet-glow",
  pending: "text-muted-foreground",
};

const docTypeLabels: Record<string, string> = {
  contract: "Contrato",
  invoice: "Fatura",
  proposal: "Proposta",
  budget: "Orçamento",
  receipt: "Recibo",
  os: "Ordem de Serviço",
};

function formatDate(iso: string) {
  const d = new Date(iso);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

export function TrackClient({ data }: { data: TrackingData }) {
  const { project, milestones, notes, documents } = data;
  const statusInfo = statusLabels[project.status] ?? { label: project.status, color: "bg-muted text-muted-foreground border-hairline" };

  return (
    <div className="mx-auto min-h-screen w-full max-w-2xl px-4 py-8">
      <div className="rounded-2xl border border-hairline bg-(--surface-1) p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-display text-2xl text-foreground">{project.name}</h1>
            <p className="mt-1 text-sm text-muted-foreground">Acompanhamento de projeto</p>
          </div>
          <Badge className={`border text-[11px] font-mono uppercase tracking-widest ${statusInfo.color}`}>
            {statusInfo.label}
          </Badge>
        </div>

        <div className="mt-6">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progresso</span>
            <span className="font-mono text-emerald-glow">{project.progress}%</span>
          </div>
          <div className="mt-2 h-3 w-full overflow-hidden rounded-full bg-(--surface-2)">
            <div
              className="h-full rounded-full bg-linear-to-r from-emerald-glow to-violet-glow transition-all duration-1000 ease-out"
              style={{ width: `${project.progress}%` }}
            />
          </div>
          <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
            <span>0%</span>
            <span>100%</span>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <h2 className="flex items-center gap-2 text-sm font-medium text-foreground">
          <Clock size={14} className="text-violet-glow" />
          Marcos do Projeto
        </h2>
        <div className="mt-3 divide-y divide-hairline rounded-xl border border-hairline bg-(--surface-1)">
          {milestones.length === 0 ? (
            <p className="px-4 py-6 text-center text-xs text-muted-foreground">Nenhum marco cadastrado.</p>
          ) : (
            milestones.map((m) => {
              const Icon = milestoneIcons[m.status] ?? Circle;
              const color = milestoneColors[m.status] ?? "text-muted-foreground";
              const isDone = m.status === "done" || m.status === "delivered";
              return (
                <div key={m.id} className="flex items-center gap-3 px-4 py-3">
                  <Icon size={16} className={`shrink-0 ${color}`} />
                  <span className={`text-sm ${isDone ? "text-muted-foreground line-through" : "text-foreground"}`}>
                    {m.label}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>

      {notes.length > 0 && (
        <div className="mt-6">
          <h2 className="flex items-center gap-2 text-sm font-medium text-foreground">
            <MessageSquare size={14} className="text-emerald-glow" />
            Notas Recentes
          </h2>
          <div className="mt-3 space-y-2">
            {notes.slice(-5).reverse().map((n, i) => (
              <div
                key={i}
                className="rounded-xl border border-hairline bg-(--surface-1) px-4 py-3"
              >
                <p className="whitespace-pre-wrap text-sm text-foreground/90">{n.content}</p>
                <p className="mt-1 text-[10px] text-muted-foreground">{formatDate(n.createdAt)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {documents.length > 0 && (
        <div className="mt-6">
          <h2 className="flex items-center gap-2 text-sm font-medium text-foreground">
            <FileText size={14} className="text-amber-glow" />
            Documentos
          </h2>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {documents.map((d) => (
              <div
                key={d.id}
                className="flex items-center gap-2 rounded-xl border border-hairline bg-(--surface-1) px-4 py-3 text-sm text-foreground"
              >
                <FileText size={14} className="shrink-0 text-amber-glow" />
                <span>{docTypeLabels[d.type] ?? d.type}</span>
                <ArrowUpRight size={12} className="ml-auto shrink-0 text-muted-foreground" />
              </div>
            ))}
          </div>
        </div>
      )}

      <footer className="mt-10 border-t border-hairline pt-6 text-center text-[11px] text-muted-foreground">
        Studio One — © 2026
      </footer>
    </div>
  );
}
