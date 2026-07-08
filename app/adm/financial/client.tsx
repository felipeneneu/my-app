"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Wallet, TrendingUp, TrendingDown, Plus, Trash2, Target, Receipt, Building2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { addFixedCost, deleteFixedCost, addProjectCost, deleteProjectCost, addRevenue } from "@/lib/actions/financial";

type FixedCost = { id: string; label: string; amount: number; category: string };
type ProjectCost = { id: string; projectId: string; label: string; amount: number; type: string };
type Revenue = { id: string; projectId: string; label: string; amount: number };
type ProjectOption = { id: string; name: string };

function formatBRL(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function FinancialClient({ fixedCosts: initialFixed, projectCosts: initialProjectCosts, revenues: initialRevenues, projects, monthlyGoal: initialGoal }: {
  fixedCosts: FixedCost[];
  projectCosts: ProjectCost[];
  revenues: Revenue[];
  projects: ProjectOption[];
  monthlyGoal: number;
}) {
  const [fixed, setFixed] = useState<FixedCost[]>(initialFixed);
  const [projectCosts, setProjectCosts] = useState<ProjectCost[]>(initialProjectCosts);
  const [revenues] = useState<Revenue[]>(initialRevenues);
  const [monthlyGoal, setMonthlyGoal] = useState(initialGoal);

  const [nfLabel, setNfLabel] = useState("");
  const [nfAmount, setNfAmount] = useState<number | "">("");
  const [nfCat, setNfCat] = useState("Software");

  const [npProject, setNpProject] = useState(projects[0]?.id ?? "");
  const [npLabel, setNpLabel] = useState("");
  const [npAmount, setNpAmount] = useState<number | "">("");

  const totalFixed = useMemo(() => fixed.reduce((s, f) => s + f.amount, 0), [fixed]);
  const totalProjectCosts = useMemo(() => projectCosts.reduce((s, p) => s + p.amount, 0), [projectCosts]);
  const totalRevenue = useMemo(() => revenues.reduce((s, r) => s + r.amount, 0), [revenues]);
  const totalCosts = totalFixed + totalProjectCosts;
  const netProfit = totalRevenue - totalCosts;
  const goalProgress = monthlyGoal > 0 ? Math.min(100, (netProfit / monthlyGoal) * 100) : 0;
  const remainingToGoal = Math.max(0, monthlyGoal - netProfit);

  const projectPnL = useMemo(() => {
    return projects.map((p) => {
      const rev = revenues.filter((r) => r.projectId === p.id).reduce((s, r) => s + r.amount, 0);
      const cost = projectCosts.filter((c) => c.projectId === p.id).reduce((s, c) => s + c.amount, 0);
      return { ...p, rev, cost, profit: rev - cost };
    });
  }, [revenues, projectCosts, projects]);

  async function addFixed() {
    if (!nfLabel.trim() || !nfAmount || Number(nfAmount) <= 0) { toast.error("Descrição e valor são obrigatórios."); return; }
    await addFixedCost({ label: nfLabel.trim(), amount: Number(nfAmount), category: nfCat });
    setFixed((f) => [...f, { id: crypto.randomUUID(), label: nfLabel.trim(), amount: Number(nfAmount), category: nfCat }]);
    setNfLabel(""); setNfAmount(""); toast.success("Custo fixo registrado.");
  }

  async function removeFixed(id: string) {
    await deleteFixedCost(id);
    setFixed((xs) => xs.filter((x) => x.id !== id));
  }

  async function addProjCost() {
    if (!npLabel.trim() || !npAmount || Number(npAmount) <= 0) { toast.error("Descrição e valor são obrigatórios."); return; }
    await addProjectCost({ projectId: npProject, label: npLabel.trim(), amount: Number(npAmount), type: "variable" });
    setProjectCosts((c) => [...c, { id: crypto.randomUUID(), projectId: npProject, label: npLabel.trim(), amount: Number(npAmount), type: "variable" }]);
    setNpLabel(""); setNpAmount(""); toast.success("Custo do projeto registrado.");
  }

  async function removeProjCost(id: string) {
    await deleteProjectCost(id);
    setProjectCosts((xs) => xs.filter((x) => x.id !== id));
  }

  return (
    <>
      <header className="flex items-center justify-between border-b border-hairline px-8 py-4">
        <div>
          <p className="text-mono text-[11px] uppercase tracking-widest text-cyan-glow">PDV Financeiro · Livro-caixa</p>
          <h1 className="text-display mt-1 text-3xl text-foreground">Central Financeira do Negócio</h1>
        </div>
        <Badge variant="outline"><Wallet size={12} /> Mês atual · atualizado agora</Badge>
      </header>

      <section className="grid grid-cols-1 gap-4 px-8 pt-8 lg:grid-cols-3">
        <div className="rounded-2xl border border-emerald-glow/30 bg-emerald-glow/5 p-6">
          <p className="text-mono text-[10px] uppercase tracking-widest text-emerald-glow">Receita bruta</p>
          <p className="text-display mt-2 text-3xl text-emerald-glow">{formatBRL(totalRevenue)}</p>
          <p className="mt-1 flex items-center gap-1 text-xs text-emerald-glow/80"><TrendingUp size={12} /> {revenues.length} entradas</p>
        </div>
        <div className="rounded-2xl border border-rose-glow/30 bg-rose-glow/5 p-6">
          <p className="text-mono text-[10px] uppercase tracking-widest text-rose-glow">Custos totais</p>
          <p className="text-display mt-2 text-3xl text-rose-glow">-{formatBRL(totalCosts)}</p>
          <p className="mt-1 flex items-center gap-1 text-xs text-rose-glow/80"><TrendingDown size={12} /> Fixos {formatBRL(totalFixed)} · Projetos {formatBRL(totalProjectCosts)}</p>
        </div>
        <div className={`rounded-2xl border p-6 ${netProfit >= 0 ? "border-cyan-glow/30 bg-cyan-glow/5" : "border-rose-glow/40 bg-rose-glow/10"}`}>
          <p className="text-mono text-[10px] uppercase tracking-widest text-cyan-glow">Lucro líquido real</p>
          <p className={`text-display mt-2 text-3xl ${netProfit >= 0 ? "text-cyan-glow" : "text-rose-glow"}`}>{formatBRL(netProfit)}</p>
          <p className="mt-1 text-xs text-muted-foreground">Receita − (fixos + custos por projeto)</p>
        </div>
      </section>

      <section className="px-8 pt-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-mono text-[10px] uppercase tracking-widest text-muted-foreground">Meta mensal</p>
                <div className="mt-1 flex items-center gap-2">
                  <Target size={18} className="text-emerald-glow" />
                  <input type="number" value={monthlyGoal} onChange={(e) => setMonthlyGoal(Number(e.target.value) || 0)} className="w-40 border-b border-hairline bg-transparent text-display text-2xl text-foreground outline-none focus:border-emerald-glow" />
                </div>
              </div>
              <div className="text-right">
                <p className="text-mono text-[10px] uppercase tracking-widest text-muted-foreground">{goalProgress >= 100 ? "Meta batida" : "Falta para a meta"}</p>
                <p className={`text-display text-2xl ${goalProgress >= 100 ? "text-emerald-glow" : "text-amber-glow"}`}>{goalProgress >= 100 ? "✓ 100%" : formatBRL(remainingToGoal)}</p>
              </div>
            </div>
            <div className="mt-4 h-3 w-full overflow-hidden rounded-full bg-(--surface-2)">
              <div className="h-full rounded-full bg-linear-to-r from-emerald-glow via-cyan-glow to-violet-glow transition-all" style={{ width: `${goalProgress}%` }} />
            </div>
            <p className="mt-2 text-mono text-[11px] text-muted-foreground">{goalProgress.toFixed(1)}% da meta atingido · lucro líquido / {formatBRL(monthlyGoal)}</p>
          </CardContent>
        </Card>
      </section>

      <section className="grid grid-cols-1 gap-6 px-8 pt-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-mono text-[10px] uppercase tracking-widest text-violet-glow">Custos fixos mensais</p>
                <CardTitle className="text-display text-lg">Operação recorrente · {formatBRL(totalFixed)}</CardTitle>
              </div>
              <Building2 size={16} className="text-violet-glow" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-3 flex flex-wrap items-center gap-2 rounded-xl border border-hairline bg-(--surface-2) px-3 py-2">
              <Input value={nfLabel} onChange={(e) => setNfLabel(e.target.value)} placeholder="Descrição" className="flex-1 bg-transparent text-sm" />
              <select value={nfCat} onChange={(e) => setNfCat(e.target.value)} className="rounded-md border border-hairline bg-(--surface-1) px-2 py-1 text-xs text-muted-foreground">
                {["Software", "Infra", "Espaço", "Serviços", "Outros"].map((c) => (<option key={c} value={c}>{c}</option>))}
              </select>
              <Input type="number" value={nfAmount} onChange={(e) => setNfAmount(e.target.value === "" ? "" : Number(e.target.value))} placeholder="R$" className="w-24 bg-transparent text-right text-mono text-sm" />
              <Button variant="default" size="sm" onClick={addFixed}><Plus size={12} /> Fixo</Button>
            </div>
            <ul className="divide-y divide-hairline">
              {fixed.map((f) => (
                <li key={f.id} className="flex items-center gap-3 py-2 text-sm">
                  <span className="flex-1 text-foreground">{f.label}</span>
                  <span className="text-mono text-[10px] uppercase text-muted-foreground">{f.category}</span>
                  <span className="w-24 text-right text-mono text-rose-glow">-{formatBRL(f.amount)}</span>
                  <Button variant="ghost" size="icon" onClick={() => removeFixed(f.id)}><Trash2 size={13} /></Button>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-mono text-[10px] uppercase tracking-widest text-amber-glow">Custos por projeto</p>
                <CardTitle className="text-display text-lg">Alocação direta · {formatBRL(totalProjectCosts)}</CardTitle>
              </div>
              <Receipt size={16} className="text-amber-glow" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-3 flex flex-wrap items-center gap-2 rounded-xl border border-hairline bg-(--surface-2) px-3 py-2">
              <select value={npProject} onChange={(e) => setNpProject(e.target.value)} className="rounded-md border border-hairline bg-(--surface-1) px-2 py-1 text-xs text-foreground">
                {projects.map((p) => (<option key={p.id} value={p.id}>{p.name}</option>))}
              </select>
              <Input value={npLabel} onChange={(e) => setNpLabel(e.target.value)} placeholder="Descrição do custo" className="flex-1 bg-transparent text-sm" />
              <Input type="number" value={npAmount} onChange={(e) => setNpAmount(e.target.value === "" ? "" : Number(e.target.value))} placeholder="R$" className="w-24 bg-transparent text-right text-mono text-sm" />
              <Button variant="default" size="sm" onClick={addProjCost}><Plus size={12} /> Custo</Button>
            </div>
            <ul className="divide-y divide-hairline">
              {projectCosts.map((c) => {
                const p = projects.find((x) => x.id === c.projectId);
                return (
                  <li key={c.id} className="flex items-center gap-3 py-2 text-sm">
                    <span className="w-32 truncate text-mono text-[10px] uppercase text-muted-foreground">{p?.name ?? c.projectId}</span>
                    <span className="flex-1 text-foreground">{c.label}</span>
                    <span className="w-24 text-right text-mono text-rose-glow">-{formatBRL(c.amount)}</span>
                    <Button variant="ghost" size="icon" onClick={() => removeProjCost(c.id)}><Trash2 size={13} /></Button>
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>
      </section>

      <section className="px-8 py-8">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-mono text-[10px] uppercase tracking-widest text-emerald-glow">DRE por projeto</p>
                <CardTitle className="text-display text-lg">Rentabilidade individual</CardTitle>
              </div>
              <Button variant="outline" size="sm" onClick={() => { const p = projects[0]; if (p) addRevenue({ projectId: p.id, label: "Nova entrada manual", amount: 1500 }); }}>
                <Plus size={12} /> Entrada rápida
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-hidden rounded-xl border border-hairline">
              <table className="w-full text-sm">
                <thead className="bg-(--surface-2) text-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  <tr><th className="px-4 py-2 text-left">Projeto</th><th className="px-4 py-2 text-right">Receita</th><th className="px-4 py-2 text-right">Custos</th><th className="px-4 py-2 text-right">Lucro</th><th className="px-4 py-2 text-right">Margem</th></tr>
                </thead>
                <tbody>
                  {projectPnL.map((p) => {
                    const margin = p.rev > 0 ? (p.profit / p.rev) * 100 : 0;
                    return (
                      <tr key={p.id} className="border-t border-hairline">
                        <td className="px-4 py-2 text-foreground">{p.name}</td>
                        <td className="px-4 py-2 text-right text-mono text-emerald-glow">{formatBRL(p.rev)}</td>
                        <td className="px-4 py-2 text-right text-mono text-rose-glow">-{formatBRL(p.cost)}</td>
                        <td className="px-4 py-2 text-right text-mono text-cyan-glow">{formatBRL(p.profit)}</td>
                        <td className={`px-4 py-2 text-right text-mono ${margin >= 60 ? "text-emerald-glow" : margin >= 30 ? "text-amber-glow" : "text-rose-glow"}`}>{margin.toFixed(1)}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </section>
    </>
  );
}

