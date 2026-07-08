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

type ColumnKey = "hot" | "warm" | "cold" | "won" | "lost";

const COLUMNS: { key: ColumnKey; label: string; icon: string }[] = [
  { key: "hot", label: "Hot", icon: "🔥" },
  { key: "warm", label: "Warm", icon: "☀️" },
  { key: "cold", label: "Cold", icon: "🧊" },
  { key: "won", label: "Won", icon: "🏆" },
  { key: "lost", label: "Lost", icon: "❌" },
];

function getLeadColumn(lead: PipelineLead): ColumnKey {
  if (lead.status === "won") return "won";
  if (lead.status === "lost") return "lost";
  if (lead.pipelineStage === "hot") return "hot";
  if (lead.pipelineStage === "warm") return "warm";
  if (lead.pipelineStage === "cold") return "cold";
  return "cold";
}

function getNextStage(column: ColumnKey): ColumnKey | null {
  const flow: Partial<Record<ColumnKey, ColumnKey>> = {
    cold: "warm",
    warm: "hot",
    hot: "won",
  };
  return flow[column] ?? null;
}

function getPrevStage(column: ColumnKey): ColumnKey | null {
  const flow: Partial<Record<ColumnKey, ColumnKey>> = {
    hot: "warm",
    warm: "cold",
  };
  return flow[column] ?? null;
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

  const [businessName, setBusinessName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [initialStage, setInitialStage] = useState<"hot" | "warm" | "cold">("cold");
  const [loading, setLoading] = useState(false);

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

  const columnColor: Record<ColumnKey, string> = {
    hot: "text-rose-glow",
    warm: "text-amber-400",
    cold: "text-cyan-glow",
    won: "text-emerald-glow",
    lost: "text-muted-foreground",
  };

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

      <section className="flex gap-4 overflow-x-auto px-8 py-6">
        {grouped.map((col) => (
          <div
            key={col.key}
            className="flex min-w-[260px] flex-1 flex-col gap-3"
          >
            <div className="flex items-center gap-2">
              <span className={cn("text-sm font-semibold", columnColor[col.key])}>
                {col.icon} {col.label}
              </span>
              <Badge variant="secondary" className="text-[11px]">
                {col.count}
              </Badge>
            </div>

            <div className="flex flex-col gap-2">
              {col.leads.length === 0 ? (
                <div className="flex items-center justify-center rounded-lg border border-hairline/50 py-8">
                  <p className="text-[11px] text-muted-foreground/40">Vazio</p>
                </div>
              ) : (
                col.leads.map((lead) => (
                  <Card key={lead.id} className="bg-(--surface-1)">
                    <CardHeader className="pb-1">
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-sm leading-tight">
                          {lead.businessName}
                        </CardTitle>
                        <div className="flex items-center gap-0.5">
                          {getPrevStage(col.key) && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-6"
                              onClick={() => handleMove(lead.id, col.key, "prev")}
                            >
                              <ArrowLeft size={12} />
                            </Button>
                          )}
                          {getNextStage(col.key) && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-6"
                              onClick={() => handleMove(lead.id, col.key, "next")}
                            >
                              <ArrowRight size={12} />
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-1.5 pb-3">
                      {lead.email && (
                        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Mail size={10} /> {lead.email}
                        </span>
                      )}
                      {lead.phone && (
                        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Phone size={10} /> {lead.phone}
                        </span>
                      )}
                      <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground/60">
                        <StickyNote size={10} />
                        Último contato: {timeAgo(lead.lastContact)} ({lead.contactsCount}{" "}
                        {lead.contactsCount === 1 ? "contato" : "contatos"})
                      </span>

                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
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
                          onClick={() => {
                            setContactLeadId(lead.id);
                            setContactDialogOpen(true);
                          }}
                        >
                          <StickyNote size={11} /> Log
                        </button>
                        {col.key === "won" && (
                          <button
                            type="button"
                            className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] text-emerald-glow hover:brightness-110"
                            onClick={() => handleConvert(lead.id)}
                          >
                            <UserCheck size={11} /> Cliente
                          </button>
                        )}
                        <ConfirmDialog
                          title="Remover lead"
                          description={`Deletar "${lead.businessName}" permanentemente?`}
                          confirmLabel="Remover"
                          onConfirm={() => handleDelete(lead.id, lead.businessName)}
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
                ))
              )}
            </div>
          </div>
        ))}
      </section>

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
