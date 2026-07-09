"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getPipelineLeads,
  getPipelineStats,
  createPipelineLead,
  updatePipelineStage,
  logContact,
  deletePipelineLead,
  convertToClient,
  type PipelineLead,
  type PipelineStats,
} from "@/lib/actions/pipeline";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import {
  Plus,
  ArrowLeft,
  ArrowRight,
  MessageCircle,
  Phone,
  Mail,
  Trash2,
  UserCheck,
  StickyNote,
  GripVertical,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import { useDroppable } from "@dnd-kit/core";
import { useDraggable } from "@dnd-kit/core";


type ColumnKey = "hot" | "warm" | "cold" | "won" | "lost";

const COLUMNS: { key: ColumnKey; label: string; icon: string }[] = [
  { key: "hot", label: "Hot", icon: "🔥" },
  { key: "warm", label: "Warm", icon: "☀️" },
  { key: "cold", label: "Cold", icon: "🧊" },
  { key: "won", label: "Won", icon: "🏆" },
  { key: "lost", label: "Lost", icon: "❌" },
];

const NEXT_STAGE: Partial<Record<ColumnKey, ColumnKey>> = {
  cold: "warm",
  warm: "hot",
  hot: "won",
};

const PREV_STAGE: Partial<Record<ColumnKey, ColumnKey>> = {
  hot: "warm",
  warm: "cold",
};

function getLeadColumn(lead: PipelineLead): ColumnKey {
  if (lead.status === "won") return "won";
  if (lead.status === "lost") return "lost";
  if (lead.pipelineStage === "hot") return "hot";
  if (lead.pipelineStage === "warm") return "warm";
  if (lead.pipelineStage === "cold") return "cold";
  return "cold";
}

function getNextStage(column: ColumnKey): ColumnKey | null {
  return NEXT_STAGE[column] ?? null;
}

function getPrevStage(column: ColumnKey): ColumnKey | null {
  return PREV_STAGE[column] ?? null;
}

function timeAgo(iso: string | null): string {
  if (!iso) return "—";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "agora";
  const hours = Math.floor(mins / 60);
  if (hours < 1) return `${mins} min atrás`;
  const days = Math.floor(hours / 24);
  if (days < 1) return `${hours}h atrás`;
  if (days < 30) return `${days} dias atrás`;
  const months = Math.floor(days / 30);
  return `${months} mês atrás`;
}

function getWhatsAppUrl(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  return `https://wa.me/55${digits}`;
}

const columnColor: Record<ColumnKey, string> = {
  hot: "text-rose-glow",
  warm: "text-amber-400",
  cold: "text-cyan-glow",
  won: "text-emerald-glow",
  lost: "text-muted-foreground",
};

const columnBg: Record<ColumnKey, string> = {
  hot: "bg-rose-glow/5",
  warm: "bg-amber-400/5",
  cold: "bg-cyan-glow/5",
  won: "bg-emerald-glow/5",
  lost: "bg-muted-foreground/5",
};

function DraggableCard({
  lead,
  column,
  onMove,
  onContact,
  onConvert,
  onDelete,
}: {
  lead: PipelineLead;
  column: ColumnKey;
  onMove: (id: string, col: ColumnKey, dir: "prev" | "next") => void;
  onContact: (id: string) => void;
  onConvert: (id: string) => void;
  onDelete: (id: string, name: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: lead.id,
    data: { lead, column },
  });

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`, zIndex: 50 }
    : undefined;

  return (
    <div ref={setNodeRef} style={style} className={cn(isDragging && "opacity-30")}>
      <Card className="bg-(--surface-1)">
        <CardHeader className="pb-1">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <button
                {...attributes}
                {...listeners}
                className="mt-0.5 shrink-0 cursor-grab text-muted-foreground/40 hover:text-muted-foreground touch-none"
              >
                <GripVertical size={14} />
              </button>
              <CardTitle className="text-sm leading-tight truncate">
                {lead.businessName}
              </CardTitle>
            </div>
            <div className="flex items-center gap-0.5 shrink-0">
              {getPrevStage(column) && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-6"
                  onClick={() => onMove(lead.id, column, "prev")}
                >
                  <ArrowLeft size={12} />
                </Button>
              )}
              {getNextStage(column) && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-6"
                  onClick={() => onMove(lead.id, column, "next")}
                >
                  <ArrowRight size={12} />
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-1.5 pb-3">
          {lead.email && (
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground ml-7">
              <Mail size={10} /> {lead.email}
            </span>
          )}
          {lead.phone && (
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground ml-7">
              <Phone size={10} /> {lead.phone}
            </span>
          )}
          <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground/60 ml-7">
            <StickyNote size={10} />
            Último contato: {timeAgo(lead.lastContact)} ({lead.contactsCount}{" "}
            {lead.contactsCount === 1 ? "contato" : "contatos"})
          </span>

          <div className="mt-2 flex flex-wrap items-center gap-1.5 ml-7">
            {lead.phone && (
              <a
                href={getWhatsAppUrl(lead.phone)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] text-emerald-glow hover:brightness-110"
              >
                <MessageCircle size={11} /> WhatsApp
              </a>
            )}
            <button
              type="button"
              className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] text-muted-foreground hover:text-foreground"
              onClick={() => onContact(lead.id)}
            >
              <StickyNote size={11} /> Log
            </button>
            {column === "won" && (
              <button
                type="button"
                className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] text-emerald-glow hover:brightness-110"
                onClick={() => onConvert(lead.id)}
              >
                <UserCheck size={11} /> Cliente
              </button>
            )}
            <ConfirmDialog
              title="Remover lead"
              description={`Deletar "${lead.businessName}" permanentemente?`}
              confirmLabel="Remover"
              onConfirm={() => onDelete(lead.id, lead.businessName)}
            >
              <button
                type="button"
                className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] text-muted-foreground hover:text-rose-glow"
              >
                <Trash2 size={11} />
              </button>
            </ConfirmDialog>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function DroppableColumn({
  column,
  leads,
  onMove,
  onContact,
  onConvert,
  onDelete,
  isOver,
}: {
  column: (typeof COLUMNS)[number];
  leads: PipelineLead[];
  onMove: (id: string, col: ColumnKey, dir: "prev" | "next") => void;
  onContact: (id: string) => void;
  onConvert: (id: string) => void;
  onDelete: (id: string, name: string) => void;
  isOver: boolean;
}) {
  const { setNodeRef } = useDroppable({ id: column.key });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex min-w-[260px] flex-1 flex-col gap-3 rounded-xl p-3 transition-colors",
        isOver && columnBg[column.key],
      )}
    >
      <div className="flex items-center gap-2 px-1">
        <span className={cn("text-sm font-semibold", columnColor[column.key])}>
          {column.icon} {column.label}
        </span>
        <Badge variant="secondary" className="text-[11px]">
          {leads.length}
        </Badge>
      </div>

      <div className="flex flex-col gap-2 min-h-[120px]">
        {leads.length === 0 ? (
          <div className="flex items-center justify-center rounded-lg border border-dashed border-hairline/50 py-8">
            <p className="text-[11px] text-muted-foreground/40">Arraste um lead aqui</p>
          </div>
        ) : (
          leads.map((lead) => (
            <DraggableCard
              key={lead.id}
              lead={lead}
              column={column.key}
              onMove={onMove}
              onContact={onContact}
              onConvert={onConvert}
              onDelete={onDelete}
            />
          ))
        )}
      </div>
    </div>
  );
}

export function PipelineClient({
  initialLeads,
  initialStats,
}: {
  initialLeads: PipelineLead[];
  initialStats: PipelineStats;
}) {
  const queryClient = useQueryClient();
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [contactDialogOpen, setContactDialogOpen] = useState(false);
  const [contactLeadId, setContactLeadId] = useState<string | null>(null);
  const [contactNote, setContactNote] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);

  const [businessName, setBusinessName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [initialStage, setInitialStage] = useState<"hot" | "warm" | "cold">("cold");
  const [loading, setLoading] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  const { data: leads } = useQuery({
    queryKey: ["pipeline-leads"],
    queryFn: getPipelineLeads,
    initialData: initialLeads,
  });

  const { data: stats } = useQuery({
    queryKey: ["pipeline-stats"],
    queryFn: getPipelineStats,
    initialData: initialStats,
  });

  const grouped = COLUMNS.map((col) => ({
    ...col,
    leads: leads.filter((l) => getLeadColumn(l) === col.key),
    count: stats[col.key],
  }));

  const activeLead = activeId ? leads.find((l) => l.id === activeId) ?? null : null;
  const activeColumn = activeLead ? getLeadColumn(activeLead) : null;

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!businessName.trim()) return;
    setLoading(true);
    await createPipelineLead({
      businessName: businessName.trim(),
      email,
      phone,
      pipelineStage: initialStage,
    });
    setBusinessName("");
    setEmail("");
    setPhone("");
    setInitialStage("cold");
    setLoading(false);
    setAddDialogOpen(false);
    queryClient.invalidateQueries({ queryKey: ["pipeline-leads"] });
    queryClient.invalidateQueries({ queryKey: ["pipeline-stats"] });
    toast.success("Lead adicionado ao pipeline");
  }

  async function handleMove(id: string, column: ColumnKey, direction: "prev" | "next") {
    const target =
      direction === "next" ? getNextStage(column) : getPrevStage(column);
    if (!target) return;
    await updatePipelineStage(id, target);
    queryClient.invalidateQueries({ queryKey: ["pipeline-leads"] });
    queryClient.invalidateQueries({ queryKey: ["pipeline-stats"] });
    toast.success("Lead movido");
  }

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string);
  }

  async function handleDragEnd(event: DragEndEvent) {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;

    const leadId = active.id as string;
    const targetColumn = over.id as ColumnKey;
    const currentColumn = active.data.current?.column as ColumnKey;

    if (!targetColumn || !currentColumn || targetColumn === currentColumn) return;

    await updatePipelineStage(leadId, targetColumn);
    queryClient.invalidateQueries({ queryKey: ["pipeline-leads"] });
    queryClient.invalidateQueries({ queryKey: ["pipeline-stats"] });
    toast.success("Lead movido");
  }

  async function handleContact() {
    if (!contactLeadId || !contactNote.trim()) return;
    await logContact(contactLeadId, contactNote.trim());
    setContactNote("");
    setContactLeadId(null);
    setContactDialogOpen(false);
    queryClient.invalidateQueries({ queryKey: ["pipeline-leads"] });
    toast.success("Contato registrado");
  }

  async function handleDelete(id: string, name: string) {
    await deletePipelineLead(id);
    queryClient.invalidateQueries({ queryKey: ["pipeline-leads"] });
    queryClient.invalidateQueries({ queryKey: ["pipeline-stats"] });
    toast.success(`"${name}" removido`);
  }

  async function handleConvert(id: string) {
    await convertToClient(id);
    queryClient.invalidateQueries({ queryKey: ["pipeline-leads"] });
    queryClient.invalidateQueries({ queryKey: ["pipeline-stats"] });
    toast.success("Lead convertido em cliente");
  }

  return (
    <>
      <header className="flex items-center justify-between border-b border-hairline px-8 py-4">
        <div className="flex items-center gap-3">
          <Link
            href="/adm"
            className="inline-flex items-center gap-1.5 rounded-md border border-hairline px-2 py-1 text-[11px] text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft size={12} /> Painel
          </Link>
          <MessageCircle size={16} className="text-emerald-glow" />
          <p className="text-mono text-[11px] uppercase tracking-widest text-muted-foreground">
            Pipeline
          </p>
        </div>
        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogTrigger>
            <Button size="sm">
              <Plus size={14} /> Novo lead
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar lead ao pipeline</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label>Nome do negócio *</Label>
                <Input
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="Ex: João Móveis Planejados"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@exemplo.com"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Telefone</Label>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(11) 99999-9999"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Estágio inicial</Label>
                <Select
                  value={initialStage}
                  onValueChange={(v) => setInitialStage(v as "hot" | "warm" | "cold")}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cold">🧊 Cold</SelectItem>
                    <SelectItem value="warm">☀️ Warm</SelectItem>
                    <SelectItem value="hot">🔥 Hot</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" disabled={loading || !businessName.trim()}>
                {loading ? "Salvando…" : "Adicionar lead"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </header>

      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <section className="flex gap-2 overflow-x-auto px-6 py-6 h-full">
          {grouped.map((col) => (
            <DroppableColumn
              key={col.key}
              column={col}
              leads={col.leads}
              onMove={handleMove}
              onContact={(id) => {
                setContactLeadId(id);
                setContactDialogOpen(true);
              }}
              onConvert={handleConvert}
              onDelete={handleDelete}
              isOver={activeId !== null && activeColumn !== col.key}
            />
          ))}
        </section>

        <DragOverlay>
          {activeLead && (
            <Card className="w-[260px] bg-(--surface-1) shadow-xl opacity-90">
              <CardHeader className="pb-1">
                <CardTitle className="text-sm">{activeLead.businessName}</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-1.5 pb-3">
                {activeLead.email && (
                  <span className="text-xs text-muted-foreground">{activeLead.email}</span>
                )}
                {activeLead.phone && (
                  <span className="text-xs text-muted-foreground">{activeLead.phone}</span>
                )}
              </CardContent>
            </Card>
          )}
        </DragOverlay>
      </DndContext>

      <Dialog open={contactDialogOpen} onOpenChange={setContactDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar contato</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <Textarea
              value={contactNote}
              onChange={(e) => setContactNote(e.target.value)}
              placeholder="Descreva o contato realizado…"
              rows={4}
            />
            <Button onClick={handleContact} disabled={!contactNote.trim()}>
              Registrar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
