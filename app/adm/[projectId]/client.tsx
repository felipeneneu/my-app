"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  ArrowLeft, CheckCircle2, Circle, Plus, Smile, Meh, Frown, Trash2,
  Wallet, TrendingUp, Target, FileText, ClipboardList,
  ExternalLink, Clock, Hash, Send,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toggleMilestoneStatus, addProjectExpense, deleteProjectExpense } from "@/lib/actions/project-detail";
import { applyTemplateToProject, addProjectChecklistItem, toggleProjectChecklistItem, deleteProjectChecklistItem } from "@/lib/actions/checklists";

type MilestoneData = { id: string; label: string; status: string };
type ExpenseData = { id: string; label: string; amount: number; category: string };
type ProjectData = { id: string; name: string; clientName: string; price: number; status: string; startDate: string };
type ChecklistItemData = { id: string; label: string; completed: boolean };
type ChecklistTemplateData = { id: string; name: string };
type TaskData = { id: string; title: string; blockType: string; dueDate: string; startTime: string | null; endTime: string | null; completed: boolean };
type TokenData = { token: string; active: boolean } | null;

const blockTypeMeta: Record<string, { label: string; icon: string; color: string }> = {
  deep_focus: { label: "Foco Profundo", icon: "🎯", color: "text-emerald-glow" },
  meeting: { label: "Reunião", icon: "📹", color: "text-violet-glow" },
  deadline: { label: "Prazo", icon: "⏰", color: "text-amber-glow" },
  design: { label: "UI/UX Design", icon: "🎨", color: "text-cyan-glow" },
  admin: { label: "Admin", icon: "💼", color: "text-amber-glow" },
};

function formatBRL(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function ProjectDetailClient({ project, contractData, milestones: initialMilestones, expenses: initialExpenses, checklistTemplates, checklistItems: initialChecklistItems, projectTasks, projectToken }: {
  project: ProjectData;
  contractData: Record<string, unknown> | null;
  milestones: MilestoneData[];
  expenses: ExpenseData[];
  checklistTemplates: ChecklistTemplateData[];
  checklistItems: ChecklistItemData[];
  projectTasks: TaskData[];
  projectToken: TokenData;
}) {
  const [milestones, setMilestones] = useState<MilestoneData[]>(initialMilestones.length > 0 ? initialMilestones : [
    { id: "m1", label: "Kickoff e escopo", status: "done" },
    { id: "m2", label: "Design inicial", status: "pending" },
  ]);
  const [expenses, setExpenses] = useState<ExpenseData[]>(initialExpenses);
  const [checklistItems, setChecklistItems] = useState<ChecklistItemData[]>(initialChecklistItems);
  const [newLabel, setNewLabel] = useState("");
  const [newAmount, setNewAmount] = useState<number | "">("");
  const [newChecklistLabel, setNewChecklistLabel] = useState("");

  const budget = project.price;
  const totalExpenses = useMemo(() => expenses.reduce((s, e) => s + e.amount, 0), [expenses]);
  const netProfit = budget - totalExpenses;
  const margin = budget > 0 ? (netProfit / budget) * 100 : 0;

  const doneCount = milestones.filter((m) => m.status === "done" || m.status === "delivered").length;
  const progress = milestones.length > 0 ? (doneCount / milestones.length) * 100 : 0;
  const deliveredRate = milestones.length > 0 ? milestones.filter((m) => m.status === "delivered").length / milestones.length : 0;

  const morale = deliveredRate >= 0.6
    ? { label: "Feliz", icon: Smile, tone: "emerald", note: "Entregas consistentes" }
    : deliveredRate >= 0.3
      ? { label: "Neutro", icon: Meh, tone: "amber", note: "Ritmo aceitável" }
      : { label: "Precisa de atenção", icon: Frown, tone: "rose", note: "Poucas entregas confirmadas" };

  const toneRing = morale.tone === "emerald"
    ? "border-emerald-glow/40 text-emerald-glow bg-emerald-glow/10"
    : morale.tone === "amber"
      ? "border-amber-glow/40 text-amber-glow bg-amber-glow/10"
      : "border-rose-glow/40 text-rose-glow bg-rose-glow/10";

  async function handleAddExpense() {
    if (!newLabel.trim() || !newAmount || Number(newAmount) <= 0) { toast.error("Informe descrição e valor válido."); return; }
    await addProjectExpense(project.id, { label: newLabel.trim(), amount: Number(newAmount) });
    setExpenses((es) => [...es, { id: crypto.randomUUID(), label: newLabel.trim(), amount: Number(newAmount), category: "variable" }]);
    setNewLabel(""); setNewAmount(""); toast.success("Custo adicionado ao livro-razão.");
  }

  async function handleToggleMilestone(mid: string, key: "done" | "delivered") {
    await toggleMilestoneStatus(mid, key);
    setMilestones((ms) => ms.map((m) => {
      if (m.id !== mid) return m;
      const newStatus = key === "done"
        ? (m.status === "done" ? "pending" : "done")
        : (m.status === "delivered" ? "done" : "delivered");
      return { ...m, status: newStatus };
    }));
  }

  async function handleDeleteExpense(id: string) {
    await deleteProjectExpense(id);
    setExpenses((xs) => xs.filter((x) => x.id !== id));
  }

  async function handleApplyTemplate(templateId: string) {
    await applyTemplateToProject(templateId, project.id);
    const { getProjectChecklistItems } = await import("@/lib/actions/checklists");
    const items = await getProjectChecklistItems(project.id);
    setChecklistItems(items.map((i) => ({ id: i.id, label: i.label, completed: i.completed })));
    toast.success("Template aplicado ao projeto");
  }

  async function handleAddChecklistItem() {
    if (!newChecklistLabel.trim()) return;
    await addProjectChecklistItem(project.id, newChecklistLabel.trim());
    setChecklistItems((prev) => [...prev, { id: crypto.randomUUID(), label: newChecklistLabel.trim(), completed: false }]);
    setNewChecklistLabel("");
    toast.success("Item adicionado");
  }

  async function handleToggleChecklistItem(id: string) {
    await toggleProjectChecklistItem(id);
    setChecklistItems((prev) => prev.map((i) => i.id === id ? { ...i, completed: !i.completed } : i));
  }

  async function handleDeleteChecklistItem(id: string) {
    await deleteProjectChecklistItem(id);
    setChecklistItems((prev) => prev.filter((i) => i.id !== id));
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

      {/* Resumo do Projeto */}
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
              {!!contractData && (contractData.deliverables as string[] | undefined) && (
                <div className="mt-3">
                  <p className="text-mono text-[10px] uppercase tracking-widest text-muted-foreground">Entregáveis</p>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {(contractData.deliverables as string[]).map((d: string, i: number) => (
                      <span key={i} className="rounded-md border border-hairline bg-(--surface-2) px-2 py-0.5 text-[11px] text-muted-foreground">{d}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="shrink-0 flex flex-col items-center gap-2 pl-6">
              <div className="relative flex h-20 w-20 items-center justify-center">
                <svg viewBox="0 0 100 100" className="h-20 w-20 -rotate-90">
                  <circle cx="50" cy="50" r="42" strokeWidth="8" fill="none" className="stroke-(--surface-2)" />
                  <circle cx="50" cy="50" r="42" strokeWidth="8" fill="none" strokeLinecap="round" strokeDasharray={264} strokeDashoffset={264 - (264 * progress) / 100} className="stroke-emerald-glow drop-shadow-[0_0_10px_rgba(0,255,180,0.6)] transition-all" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center"><span className="text-display text-xl text-foreground">{Math.round(progress)}%</span></div>
              </div>
              <p className="text-mono text-[9px] uppercase tracking-widest text-muted-foreground">{doneCount}/{milestones.length} marcos</p>
            </div>
          </div>
          {projectTasks.length > 0 && (
            <div className="mt-5 border-t border-hairline pt-4">
              <p className="text-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-2">Próximas tarefas</p>
              <div className="flex flex-col gap-1.5">
                {projectTasks.filter(t => !t.completed).slice(0, 5).map(t => {
                  const meta = blockTypeMeta[t.blockType] || { label: t.blockType, icon: "📋", color: "text-muted-foreground" };
                  const timeRange = t.startTime && t.endTime ? `${t.startTime.slice(0, 5)}-${t.endTime.slice(0, 5)}` : null;
                  return (
                    <div key={t.id} className="flex items-center gap-2 rounded-md bg-(--surface-2) px-3 py-1.5 text-sm">
                      <span>{meta.icon}</span>
                      <span className="flex-1 text-foreground">{t.title}</span>
                      {timeRange && <span className="text-mono text-[11px] text-muted-foreground">{timeRange}</span>}
                      <span className={`text-mono text-[10px] ${meta.color}`}>{meta.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          {/* Quick links */}
          <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-hairline pt-4">
            <Link href={`/adm/project/${project.id}/briefing`}
              className="inline-flex items-center gap-1.5 rounded-md border border-hairline px-3 py-1.5 text-[11px] text-muted-foreground hover:text-foreground hover:border-cyan-glow/40 transition-colors">
              <Hash size={12} /> Briefing
            </Link>
            <Link href={`/adm/budget`}
              className="inline-flex items-center gap-1.5 rounded-md border border-hairline px-3 py-1.5 text-[11px] text-muted-foreground hover:text-foreground hover:border-emerald-glow/40 transition-colors">
              <FileText size={12} /> Orçamento
            </Link>
            <button
              onClick={async () => {
                const { generateProjectToken } = await import("@/lib/actions/tracking");
                const result = await generateProjectToken(project.id);
                const fullUrl = `${window.location.origin}${result.url}`;
                await navigator.clipboard.writeText(fullUrl);
                toast.success("Link do cliente copiado!");
              }}
              className="inline-flex items-center gap-1.5 rounded-md border border-hairline px-3 py-1.5 text-[11px] text-muted-foreground hover:text-foreground hover:border-violet-glow/40 transition-colors"
            >
              <ExternalLink size={12} /> Link do Cliente
            </button>
          </div>
        </div>
      </section>

      {/* Moral do cliente */}
      <section className="px-8 pt-4">
        <div className={`rounded-2xl border p-5 ${toneRing}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-current bg-(--surface-0)"><morale.icon size={22} /></div>
              <div>
                <p className="text-mono text-[10px] uppercase tracking-widest opacity-70">Moral do cliente</p>
                <p className="text-display text-xl">{morale.label}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-mono text-[10px] uppercase tracking-widest opacity-50">Termômetro</span>
              <div className="flex gap-0.5">
                {Array.from({ length: 10 }).map((_, i) => (
                  <span key={i} className={`h-2 w-2 rounded-full ${i < Math.round(deliveredRate * 10) ? "bg-current" : "bg-current/20"}`} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-8 pt-8">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-mono text-[10px] uppercase tracking-widest text-muted-foreground">Marcos de entrega</p>
                <CardTitle className="text-display text-xl">Checklist do projeto</CardTitle>
              </div>
              <Target size={16} className="text-violet-glow" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col divide-y divide-hairline">
              {milestones.map((m) => {
                const isDone = m.status === "done" || m.status === "delivered";
                const isDelivered = m.status === "delivered";
                return (
                  <div key={m.id} className="flex items-center gap-3 py-3">
                    <button onClick={() => handleToggleMilestone(m.id, "done")} className="text-emerald-glow">{isDone ? <CheckCircle2 size={18} /> : <Circle size={18} className="text-muted-foreground" />}</button>
                    <p className={`flex-1 text-sm ${isDone ? "text-muted-foreground line-through" : "text-foreground"}`}>{m.label}</p>
                    <button onClick={() => handleToggleMilestone(m.id, "delivered")} className={`rounded-md border px-2 py-0.5 text-[10px] font-mono uppercase tracking-widest ${isDelivered ? "border-emerald-glow/40 bg-emerald-glow/10 text-emerald-glow" : "border-hairline text-muted-foreground hover:text-foreground"}`}>{isDelivered ? "Entregue" : "Pendente"}</button>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="px-8 pt-8">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-mono text-[10px] uppercase tracking-widest text-muted-foreground">Checklist do projeto</p>
                <CardTitle className="text-display text-xl">Itens de entrega</CardTitle>
              </div>
              <div className="flex items-center gap-2">
                {checklistTemplates.map((t) => (
                  <Button key={t.id} variant="outline" size="sm" onClick={() => handleApplyTemplate(t.id)}>
                    <ClipboardList size={12} /> {t.name}
                  </Button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-3 flex items-center gap-2">
              <Input
                value={newChecklistLabel}
                onChange={(e) => setNewChecklistLabel(e.target.value)}
                placeholder="Adicionar item…"
                className="flex-1 text-sm"
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddChecklistItem())}
              />
              <Button size="sm" onClick={handleAddChecklistItem}><Plus size={12} /> Adicionar</Button>
            </div>
            <div className="flex flex-col divide-y divide-hairline">
              {checklistItems.length === 0 && (
                <p className="py-4 text-center text-xs text-muted-foreground">Nenhum item. Adicione manualmente ou aplique um template.</p>
              )}
              {checklistItems.map((item) => (
                <div key={item.id} className="flex items-center gap-3 py-2.5">
                  <Checkbox
                    checked={item.completed}
                    onCheckedChange={() => handleToggleChecklistItem(item.id)}
                  />
                  <p className={`flex-1 text-sm ${item.completed ? "text-muted-foreground line-through" : "text-foreground"}`}>
                    {item.label}
                  </p>
                  <Button variant="ghost" size="icon" onClick={() => handleDeleteChecklistItem(item.id)}>
                    <Trash2 size={14} className="text-muted-foreground hover:text-rose-glow" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="px-8 pt-8">
        <Card>
          <CardHeader>
            <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-mono text-[10px] uppercase tracking-widest text-amber-glow">Livro-razão de custos</p>
                <CardTitle className="text-display text-xl">Despesas do projeto</CardTitle>
              </div>
              <div className="grid grid-cols-3 gap-3 text-right">
                <div><p className="text-mono text-[10px] uppercase text-muted-foreground">Orçamento</p><p className="text-display text-lg text-foreground">{formatBRL(budget)}</p></div>
                <div><p className="text-mono text-[10px] uppercase text-muted-foreground">Custos</p><p className="text-display text-lg text-rose-glow">-{formatBRL(totalExpenses)}</p></div>
                <div><p className="text-mono text-[10px] uppercase text-muted-foreground">Margem líquida</p><p className={`text-display text-lg ${margin >= 60 ? "text-emerald-glow" : margin >= 30 ? "text-amber-glow" : "text-rose-glow"}`}>{margin.toFixed(1)}%</p></div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-hairline bg-(--surface-2) px-3 py-2">
              <Wallet size={14} className="text-muted-foreground" />
              <Input value={newLabel} onChange={(e) => setNewLabel(e.target.value)} placeholder="Descrição" className="flex-1 bg-transparent text-sm border-none" />
              <Input type="number" value={newAmount} onChange={(e) => setNewAmount(e.target.value === "" ? "" : Number(e.target.value))} placeholder="R$" className="w-24 bg-transparent text-right text-mono text-sm border-none" />
              <Button size="sm" onClick={handleAddExpense}><Plus size={12} /> Registrar</Button>
            </div>
            <div className="overflow-hidden rounded-xl border border-hairline">
              <Table>
                <TableHeader className="bg-(--surface-2)">
                  <TableRow>
                    <TableHead className="text-mono text-[10px] uppercase tracking-widest">Descrição</TableHead>
                    <TableHead className="text-mono text-[10px] uppercase tracking-widest">Categoria</TableHead>
                    <TableHead className="text-mono text-[10px] uppercase tracking-widest text-right">Valor</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expenses.length === 0 && (
                    <TableRow><TableCell colSpan={4} className="text-center text-xs text-muted-foreground py-6">Nenhum custo lançado.</TableCell></TableRow>
                  )}
                  {expenses.map((e) => (
                    <TableRow key={e.id}>
                      <TableCell className="text-foreground">{e.label}</TableCell>
                      <TableCell className="text-muted-foreground">{e.category}</TableCell>
                      <TableCell className="text-right text-mono text-rose-glow">-{formatBRL(e.amount)}</TableCell>
                      <TableCell className="text-right"><Button variant="ghost" size="icon" onClick={() => handleDeleteExpense(e.id)} title="Remover"><Trash2 size={14} /></Button></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="mt-4 flex items-center justify-between rounded-xl border border-emerald-glow/30 bg-emerald-glow/5 px-4 py-3">
              <div className="flex items-center gap-2 text-emerald-glow"><TrendingUp size={16} /><p className="text-sm font-semibold">Lucro líquido projetado</p></div>
              <p className="text-display text-2xl text-emerald-glow">{formatBRL(netProfit)}</p>
            </div>
          </CardContent>
        </Card>
      </section>

    </>
  );
}


