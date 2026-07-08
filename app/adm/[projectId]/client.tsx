"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  ArrowLeft, CheckCircle2, Circle, Plus, Smile, Meh, Frown, Trash2,
  Wallet, TrendingUp, Target, FileText, ClipboardList, Receipt, Copy, Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toggleMilestoneStatus, addProjectExpense, deleteProjectExpense } from "@/lib/actions/project-detail";

type MilestoneData = { id: string; label: string; status: string };
type ExpenseData = { id: string; label: string; amount: number; category: string };
type ProjectData = { id: string; name: string; clientName: string; price: number; status: string; startDate: string };
type DocTab = "briefing" | "os" | "recibos";

function formatBRL(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function ProjectDetailClient({ project, milestones: initialMilestones, expenses: initialExpenses }: {
  project: ProjectData;
  milestones: MilestoneData[];
  expenses: ExpenseData[];
}) {
  const [milestones, setMilestones] = useState<MilestoneData[]>(initialMilestones.length > 0 ? initialMilestones : [
    { id: "m1", label: "Kickoff e escopo", status: "done" },
    { id: "m2", label: "Design inicial", status: "pending" },
  ]);
  const [expenses, setExpenses] = useState<ExpenseData[]>(initialExpenses);
  const [newLabel, setNewLabel] = useState("");
  const [newAmount, setNewAmount] = useState<number | "">("");

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

      <section className="grid grid-cols-1 gap-4 px-8 pt-8 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-2xl border border-hairline bg-[color:var(--surface-1)] p-6">
          <p className="text-mono text-[10px] uppercase tracking-widest text-emerald-glow">Projeto ativo · {project.status.toUpperCase()}</p>
          <h1 className="text-display mt-1 text-4xl text-foreground">{project.name}</h1>
          <p className="mt-2 text-sm text-muted-foreground">Acompanhamento de progresso, entregas e saúde financeira em tempo real.</p>
          <div className="mt-6 flex items-center gap-4">
            <div className="relative flex h-24 w-24 items-center justify-center">
              <svg viewBox="0 0 100 100" className="h-24 w-24 -rotate-90">
                <circle cx="50" cy="50" r="42" strokeWidth="8" fill="none" className="stroke-[color:var(--surface-2)]" />
                <circle cx="50" cy="50" r="42" strokeWidth="8" fill="none" strokeLinecap="round" strokeDasharray={264} strokeDashoffset={264 - (264 * progress) / 100} className="stroke-emerald-glow drop-shadow-[0_0_10px_rgba(0,255,180,0.6)] transition-all" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center"><span className="text-display text-xl text-foreground">{Math.round(progress)}%</span></div>
            </div>
            <div className="flex-1">
              <p className="text-mono text-[10px] uppercase tracking-widest text-muted-foreground">Progresso das entregas</p>
              <p className="mt-1 text-sm text-foreground">{doneCount} de {milestones.length} marcos concluídos</p>
              <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-[color:var(--surface-2)]">
                <div className="h-full rounded-full bg-gradient-to-r from-emerald-glow to-violet-glow" style={{ width: `${progress}%` }} />
              </div>
            </div>
          </div>
        </div>

        <div className={`rounded-2xl border p-6 ${toneRing}`}>
          <p className="text-mono text-[10px] uppercase tracking-widest">Moral do cliente</p>
          <div className="mt-4 flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-current bg-[color:var(--surface-0)]"><morale.icon size={26} /></div>
            <div>
              <p className="text-display text-2xl">{morale.label}</p>
              <p className="text-xs opacity-80">{morale.note}</p>
            </div>
          </div>
          <div className="mt-5 space-y-1.5 text-[11px]">
            <p className="text-mono uppercase tracking-widest opacity-70">Termômetro</p>
            <div className="flex gap-1">
              {Array.from({ length: 10 }).map((_, i) => (
                <span key={i} className={`h-2 flex-1 rounded-full ${i < Math.round(deliveredRate * 10) ? "bg-current" : "bg-current/20"}`} />
              ))}
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

      <section className="px-8 py-8">
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
            <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-hairline bg-[color:var(--surface-2)] px-3 py-2">
              <Wallet size={14} className="text-muted-foreground" />
              <Input value={newLabel} onChange={(e) => setNewLabel(e.target.value)} placeholder="Descrição" className="flex-1 bg-transparent text-sm border-none" />
              <Input type="number" value={newAmount} onChange={(e) => setNewAmount(e.target.value === "" ? "" : Number(e.target.value))} placeholder="R$" className="w-24 bg-transparent text-right text-mono text-sm border-none" />
              <Button size="sm" onClick={handleAddExpense}><Plus size={12} /> Registrar</Button>
            </div>
            <div className="overflow-hidden rounded-xl border border-hairline">
              <table className="w-full text-sm">
                <thead className="bg-[color:var(--surface-2)] text-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  <tr><th className="px-4 py-2 text-left">Descrição</th><th className="px-4 py-2 text-left">Categoria</th><th className="px-4 py-2 text-right">Valor</th><th className="px-4 py-2" /></tr>
                </thead>
                <tbody>
                  {expenses.length === 0 && (<tr><td colSpan={4} className="px-4 py-6 text-center text-xs text-muted-foreground">Nenhum custo lançado.</td></tr>)}
                  {expenses.map((e) => (
                    <tr key={e.id} className="border-t border-hairline">
                      <td className="px-4 py-2 text-foreground">{e.label}</td>
                      <td className="px-4 py-2 text-muted-foreground">{e.category}</td>
                      <td className="px-4 py-2 text-right text-mono text-rose-glow">-{formatBRL(e.amount)}</td>
                      <td className="px-4 py-2 text-right"><Button variant="ghost" size="icon" onClick={() => handleDeleteExpense(e.id)} title="Remover"><Trash2 size={14} /></Button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 flex items-center justify-between rounded-xl border border-emerald-glow/30 bg-emerald-glow/5 px-4 py-3">
              <div className="flex items-center gap-2 text-emerald-glow"><TrendingUp size={16} /><p className="text-sm font-semibold">Lucro líquido projetado</p></div>
              <p className="text-display text-2xl text-emerald-glow">{formatBRL(netProfit)}</p>
            </div>
          </CardContent>
        </Card>
      </section>

      <ProjectDocumentsSection projectName={project.name} budget={budget} />
    </>
  );
}

function ProjectDocumentsSection({ projectName, budget }: { projectName: string; budget: number }) {
  const [tab, setTab] = useState<DocTab>("briefing");
  const [clientName, setClientName] = useState("Cliente");
  const [clientDoc, setClientDoc] = useState("CNPJ");
  const [briefingGoal, setBriefingGoal] = useState("Aumentar resultados digitais.");
  const [briefingScope, setBriefingScope] = useState("Desenvolvimento web + integrações.");
  const [briefingDeadline, setBriefingDeadline] = useState("45 dias corridos");
  const [osScope, setOsScope] = useState("Desenvolvimento full-stack, design de interface, deploy em produção e 30 dias de suporte pós-entrega.");

  const half = budget / 2;
  const today = new Date().toLocaleDateString("pt-BR");

  const briefingText = `BRIEFING DE PROJETO — ${projectName.toUpperCase()}\n\nCliente: ${clientName}\nDocumento: ${clientDoc}\nData: ${today}\n\n1. OBJETIVO DE NEGÓCIO\n${briefingGoal}\n\n2. ESCOPO PROPOSTO\n${briefingScope}\n\n3. PRAZO\n${briefingDeadline}\n\n4. INVESTIMENTO TOTAL\n${half.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} × 2 parcelas (50/50)\nTotal: ${(half * 2).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}`;

  const osText = `ORDEM DE SERVIÇO — ${projectName.toUpperCase()}\n\nCONTRATANTE: ${clientName} · ${clientDoc}\nCONTRATADO: Jordan Diaz · MEI\n\nESCOPO DE SERVIÇO\n${osScope}\n\nCONDIÇÕES\n- Início: mediante pagamento da 1ª parcela (50%).\n- Revisões incluídas: 2 rodadas por marco entregue.\n- Prazo: ${briefingDeadline}.\n\nVALOR\nTotal: ${(half * 2).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}\nForma: 50% no aceite · 50% na entrega final.\n\n${today} — Jordan Diaz`;

  const recibo1 = `RECIBO Nº 001/2 — SINAL 50%\n\nRecebi de ${clientName} (${clientDoc}) a importância de\n${half.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}\nreferente à 1ª parcela do projeto "${projectName}", como sinal para início dos trabalhos.\n\nData: ${today}\n_____________________________________\nJordan Diaz · MEI`;

  const recibo2 = `RECIBO Nº 002/2 — QUITAÇÃO FINAL 50%\n\nRecebi de ${clientName} (${clientDoc}) a importância de\n${half.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}\nreferente à 2ª e última parcela do projeto "${projectName}", dando total quitação.\n\nData: ${today}\n_____________________________________\nJordan Diaz · MEI`;

  const copy = (txt: string, label: string) => { navigator.clipboard.writeText(txt).then(() => toast.success(`${label} copiado`), () => toast.error("Falha ao copiar")); };
  const download = (txt: string, filename: string) => { const blob = new Blob([txt], { type: "text/plain;charset=utf-8" }); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = filename; a.click(); URL.revokeObjectURL(url); toast.success(`${filename} baixado`); };

  const tabs: { id: DocTab; label: string; icon: typeof FileText; tone: string }[] = [
    { id: "briefing", label: "Briefing", icon: FileText, tone: "text-cyan-glow" },
    { id: "os", label: "Ordem de Serviço", icon: ClipboardList, tone: "text-violet-glow" },
    { id: "recibos", label: "Recibos 50/50", icon: Receipt, tone: "text-emerald-glow" },
  ];

  return (
    <section className="px-8 pb-10">
      <Card>
        <CardHeader>
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-mono text-[10px] uppercase tracking-widest text-cyan-glow">Documentos do projeto</p>
              <CardTitle className="text-display text-xl">Central de contratos e recibos</CardTitle>
            </div>
            <div className="flex gap-1 rounded-xl border border-hairline bg-[color:var(--surface-2)] p-1">
              {tabs.map((t) => {
                const Icon = t.icon;
                const active = tab === t.id;
                return (
                  <button key={t.id} onClick={() => setTab(t.id)} className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-semibold transition-all ${active ? `bg-[color:var(--surface-0)] ${t.tone}` : "text-muted-foreground hover:text-foreground"}`}>
                    <Icon size={12} /> {t.label}
                  </button>
                );
              })}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-5 grid grid-cols-1 gap-3 md:grid-cols-2">
            <label className="flex flex-col gap-1"><span className="text-mono text-[10px] uppercase tracking-widest text-muted-foreground">Cliente</span><input value={clientName} onChange={(e) => setClientName(e.target.value)} className="rounded-md border border-hairline bg-[color:var(--surface-2)] px-3 py-2 text-sm outline-none focus:border-cyan-glow" /></label>
            <label className="flex flex-col gap-1"><span className="text-mono text-[10px] uppercase tracking-widest text-muted-foreground">Documento</span><input value={clientDoc} onChange={(e) => setClientDoc(e.target.value)} className="rounded-md border border-hairline bg-[color:var(--surface-2)] px-3 py-2 text-sm outline-none focus:border-cyan-glow" /></label>
          </div>

          {tab === "briefing" && (
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              <div className="flex flex-col gap-3">
                <label className="flex flex-col gap-1"><span className="text-mono text-[10px] uppercase tracking-widest text-muted-foreground">Objetivo de negócio</span><textarea value={briefingGoal} onChange={(e) => setBriefingGoal(e.target.value)} rows={3} className="rounded-md border border-hairline bg-[color:var(--surface-2)] px-3 py-2 text-sm outline-none focus:border-cyan-glow" /></label>
                <label className="flex flex-col gap-1"><span className="text-mono text-[10px] uppercase tracking-widest text-muted-foreground">Escopo</span><textarea value={briefingScope} onChange={(e) => setBriefingScope(e.target.value)} rows={3} className="rounded-md border border-hairline bg-[color:var(--surface-2)] px-3 py-2 text-sm outline-none focus:border-cyan-glow" /></label>
                <label className="flex flex-col gap-1"><span className="text-mono text-[10px] uppercase tracking-widest text-muted-foreground">Prazo</span><input value={briefingDeadline} onChange={(e) => setBriefingDeadline(e.target.value)} className="rounded-md border border-hairline bg-[color:var(--surface-2)] px-3 py-2 text-sm outline-none focus:border-cyan-glow" /></label>
              </div>
              <DocPreview text={briefingText} onCopy={() => copy(briefingText, "Briefing")} onDownload={() => download(briefingText, `briefing-${projectName}.txt`)} tone="cyan" />
            </div>
          )}

          {tab === "os" && (
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              <div className="flex flex-col gap-3">
                <label className="flex flex-col gap-1"><span className="text-mono text-[10px] uppercase tracking-widest text-muted-foreground">Escopo executivo da OS</span><textarea value={osScope} onChange={(e) => setOsScope(e.target.value)} rows={6} className="rounded-md border border-hairline bg-[color:var(--surface-2)] px-3 py-2 text-sm outline-none focus:border-violet-glow" /></label>
                <div className="rounded-md border border-hairline bg-[color:var(--surface-2)] px-3 py-2 text-xs text-muted-foreground">Valor total: R$ {(half * 2).toLocaleString("pt-BR")} · Parcelas 50/50 de R$ {half.toLocaleString("pt-BR")}</div>
              </div>
              <DocPreview text={osText} onCopy={() => copy(osText, "Ordem de Serviço")} onDownload={() => download(osText, `os-${projectName}.txt`)} tone="violet" />
            </div>
          )}

          {tab === "recibos" && (
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              <DocPreview title="1ª parcela · Sinal 50%" text={recibo1} onCopy={() => copy(recibo1, "Recibo 1")} onDownload={() => download(recibo1, `recibo-1-${projectName}.txt`)} tone="emerald" />
              <DocPreview title="2ª parcela · Quitação 50%" text={recibo2} onCopy={() => copy(recibo2, "Recibo 2")} onDownload={() => download(recibo2, `recibo-2-${projectName}.txt`)} tone="emerald" />
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}

function DocPreview({ text, onCopy, onDownload, tone, title }: { text: string; onCopy: () => void; onDownload: () => void; tone: "cyan" | "violet" | "emerald"; title?: string }) {
  const toneClass = tone === "cyan" ? "border-cyan-glow/30 text-cyan-glow" : tone === "violet" ? "border-violet-glow/30 text-violet-glow" : "border-emerald-glow/30 text-emerald-glow";
  return (
    <div className={`flex flex-col rounded-xl border bg-[color:var(--surface-0)] ${toneClass}`}>
      <div className="flex items-center justify-between border-b border-hairline px-4 py-2">
        <p className="text-mono text-[10px] uppercase tracking-widest">{title ?? "Preview do documento"}</p>
        <div className="flex gap-1">
          <Button variant="outline" size="sm" onClick={onCopy}><Copy size={11} /> Copiar</Button>
          <Button variant="outline" size="sm" onClick={onDownload}><Download size={11} /> .txt</Button>
        </div>
      </div>
      <pre className="max-h-[420px] overflow-auto whitespace-pre-wrap px-4 py-3 text-mono text-[12px] leading-relaxed text-foreground/90">{text}</pre>
    </div>
  );
}
