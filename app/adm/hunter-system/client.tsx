"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Swords, Trophy, Mail, Globe, Rocket, Coffee, Gamepad2, Sparkles, Coins,
  ShieldCheck, Copy, Pizza, LayoutTemplate, Building2, Wand2, Flame,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { completeQuest, addXp, addGold } from "@/lib/actions/hunter";

type Quest = { id: string; description: string; progressCurrent: number; progressTarget: number; completed: boolean; type: string };
type HunterInfo = { level: number; currentXp: number; maxXp: number; goldBalance: number; hunterRank: string };

const questTemplates = [
  { id: "cold", label: "Enviar 10 cold emails", goal: 10, icon: Mail, tone: "text-emerald-glow" },
  { id: "linkedin", label: "Mensagem para 3 leads no LinkedIn", goal: 3, icon: Globe, tone: "text-violet-glow" },
  { id: "portfolio", label: "Otimizar LP do Portfólio", goal: 1, icon: Rocket, tone: "text-amber-glow" },
];

const templates = {
  pizzaria: {
    label: "Armadura: Pitch Pizzaria",
    icon: Pizza,
    body: (biz: string) => `Olá, equipe da ${biz || "[NEGÓCIO]"} 🍕\n\nSou Jordan, desenvolvedor especializado em sistemas para pizzarias que aumentam ticket médio via cardápio digital e WhatsApp integrado.\n\nAnalisei rapidamente o cardápio de vocês e identifiquei 3 oportunidades para +18% em pedidos nos próximos 30 dias:\n\n  1. Cardápio digital com QR code na mesa e delivery unificado\n  2. Fluxo de recompra automatizado via WhatsApp\n  3. Painel de gestão em tempo real (produção + entregas)\n\nPosso enviar um mini diagnóstico gratuito em vídeo (5 min) mostrando exatamente onde vocês estão perdendo pedidos hoje?\n\nAbraço,\nJordan Diaz — Studio One`,
  },
  landing: {
    label: "Armadura: Pitch Landing Page",
    icon: LayoutTemplate,
    body: (biz: string) => `Olá, ${biz || "[NEGÓCIO]"} 👋\n\nSou Jordan, designer e dev full-stack. Construo landing pages de alta conversão (média de 12–24% CTR) em 7 dias úteis.\n\nVi que o site atual de vocês está deixando dinheiro na mesa em três pontos:\n\n  • Hero sem promessa clara de valor\n  • Nenhuma prova social acima da dobra\n  • CTA único forçando decisão de alta fricção\n\nPosso te mandar um Loom de 4 minutos com o redesenho conceitual da home — sem custo e sem compromisso.\n\nTopa?\n\nJordan — Studio One`,
  },
  sistema: {
    label: "Armadura: Pitch Sistema Web",
    icon: Building2,
    body: (biz: string) => `Oi, time da ${biz || "[NEGÓCIO]"}!\n\nTrabalho construindo sistemas web sob medida (dashboards, CRMs, plataformas SaaS internas) para empresas que já não cabem mais em planilhas.\n\nSe vocês estão nesse ponto onde:\n  – Excel virou fonte da verdade\n  – Cada nova regra de negócio quebra o processo\n  – A equipe perde 6h/semana em tarefas manuais\n\n… normalmente entrego um MVP funcional em 3 semanas com stack moderno (React + TanStack + Postgres).\n\nRola uma call de 20 min essa semana pra eu entender o gargalo?\n\nAbraço,\nJordan Diaz — Studio One`,
  },
};

type TemplateId = keyof typeof templates;

const inventory = [
  { id: "coffee", name: "Token de Café Especial", price: 25, icon: Coffee, tone: "amber" as const },
  { id: "gaming", name: "Passe Gamer 2h", price: 80, icon: Gamepad2, tone: "violet" as const },
  { id: "focus", name: "Poção de Foco (+30% XP)", price: 150, icon: Flame, tone: "emerald" as const },
  { id: "cheat", name: "Cheat Day Delivery", price: 220, icon: Pizza, tone: "amber" as const },
];

export function HunterSystemClient({ hunter, quests: initialQuests }: { hunter: HunterInfo; quests: Quest[] }) {
  const [gold, setGold] = useState(hunter.goldBalance);
  const [xp, setXp] = useState(hunter.currentXp);
  const [level, setLevel] = useState(hunter.level);
  const [rank, setRank] = useState(hunter.hunterRank);
  const [maxXp, setMaxXp] = useState(hunter.maxXp);
  const [localQuests, setLocalQuests] = useState(questTemplates.map(q => ({
    ...q,
    progress: questTemplates.find(t => t.id === q.id)
      ? (initialQuests.find(iq => iq.description === q.label)?.progressCurrent ?? 0)
      : 0,
  })));
  const [biz, setBiz] = useState("");
  const [email, setEmail] = useState("");
  const [template, setTemplate] = useState<TemplateId>("pizzaria");
  const [script, setScript] = useState<string | null>(null);

  async function handleStrike() {
    if (!biz.trim()) { toast.error("Informe o nome do negócio-alvo primeiro."); return; }
    setScript(templates[template].body(biz.trim()));
    await addGold(10);
    const updated = await addXp(50);
    if (updated) {
      if (updated.level > level) {
        toast.success(`Nível ${updated.level} alcançado!`, { description: `Rank: ${updated.hunterRank}` });
      }
      setGold(updated.goldBalance);
      setXp(updated.currentXp);
      setLevel(updated.level);
      setMaxXp(updated.maxXp);
    } else {
      setGold(g => g + 10);
      setXp(x => x + 50);
    }
    toast.success("+50 XP e +10 Gold conquistados!", { description: "Roteiro forjado. Copie e dispare." });
  }

  async function handleQuestCheck(questId: string, done: boolean) {
    const dbQuest = initialQuests.find(q => q.description === questTemplates.find(t => t.id === questId)?.label);
    if (dbQuest && done) {
      await completeQuest(dbQuest.id);
      await addXp(30);
      await addGold(15);
      toast.success("Quest concluída! +30 XP +15 Gold");
    }
    setLocalQuests(qs => qs.map(q => q.id === questId ? { ...q, progress: done ? q.goal : 0 } : q));
  }

  function incrementProgress(questId: string) {
    setLocalQuests(qs => qs.map(q =>
      q.id === questId ? { ...q, progress: Math.min(q.goal, q.progress + 1) } : q
    ));
  }

  const buy = (item: typeof inventory[number]) => {
    if (gold < item.price) { toast.error("Gold insuficiente. Complete mais quests."); return; }
    setGold(g => g - item.price);
    toast.success(`Comprado: ${item.name}`, { description: `-${item.price} gold` });
  };

  const copyScript = async () => {
    if (!script) return;
    await navigator.clipboard.writeText(script);
    toast.success("Roteiro copiado para a área de transferência.");
  };

  return (
    <>
      <header className="border-b border-hairline bg-[color:var(--surface-1)] px-8 py-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald-glow/40 bg-emerald-glow/10 text-emerald-glow glow-emerald">
              <Swords size={26} />
            </div>
            <div>
              <p className="text-mono text-[10px] uppercase tracking-widest text-emerald-glow">Sistema Hunter · Registro</p>
              <h1 className="text-display text-3xl text-foreground">REGISTRO DO CAÇADOR</h1>
              <p className="text-xs text-muted-foreground">Prospecção diária no modo Solo Leveling.</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 rounded-xl border border-hairline bg-[color:var(--surface-0)] px-3 py-2">
              <ShieldCheck size={16} className="text-violet-glow" />
              <div className="leading-tight">
                <p className="text-mono text-[10px] uppercase text-muted-foreground">Rank</p>
                <p className="text-display text-lg text-violet-glow">{rank}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-hairline bg-[color:var(--surface-0)] px-3 py-2">
              <Coins size={16} className="text-amber-glow" />
              <div className="leading-tight">
                <p className="text-mono text-[10px] uppercase text-muted-foreground">Gold</p>
                <p className="text-display text-lg text-amber-glow">{gold}</p>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-6">
          <div className="mb-2 flex items-center justify-between text-mono text-[11px] uppercase tracking-widest">
            <span className="text-emerald-glow">LVL {level}</span>
            <span className="text-muted-foreground">{xp} → LVL {level + 1}</span>
          </div>
          <div className="relative h-3 w-full overflow-hidden rounded-full border border-hairline bg-[color:var(--surface-0)]">
            <div className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-emerald-glow via-emerald-glow to-violet-glow shadow-[0_0_20px_rgba(0,255,180,0.4)] transition-all" style={{ width: `${(xp / maxXp) * 100}%` }} />
            <div className="pointer-events-none absolute inset-0 animate-pulse bg-gradient-to-r from-transparent via-white/5 to-transparent" />
          </div>
        </div>
      </header>

      <section className="grid grid-cols-1 gap-6 px-8 py-8 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-mono text-[10px] uppercase tracking-widest text-muted-foreground">Quests do dia</p>
                <CardTitle className="text-display text-xl">Checklist do Caçador</CardTitle>
              </div>
              <Trophy size={18} className="text-amber-glow" />
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {localQuests.map((q) => {
              const done = q.progress >= q.goal;
              return (
                <div key={q.id} className={`flex items-center gap-4 rounded-xl border p-4 transition-all ${done ? "border-emerald-glow/50 bg-emerald-glow/10 glow-emerald" : "border-hairline bg-[color:var(--surface-2)]"}`}>
                  <Checkbox checked={done} onCheckedChange={(v) => handleQuestCheck(q.id, !!v)} />
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-hairline bg-[color:var(--surface-0)]"><q.icon size={18} className={q.tone} /></div>
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${done ? "line-through text-muted-foreground" : "text-foreground"}`}>{q.label}</p>
                    <div className="mt-1.5 flex items-center gap-2">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[color:var(--surface-0)]"><div className={`h-full rounded-full ${done ? "bg-emerald-glow" : "bg-violet-glow"}`} style={{ width: `${(q.progress / q.goal) * 100}%` }} /></div>
                      <span className="text-mono text-[10px] text-muted-foreground">{q.progress}/{q.goal}</span>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => incrementProgress(q.id)}>+1</Button>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-mono text-[10px] uppercase tracking-widest text-violet-glow">Exploração do Portal</p>
                <CardTitle className="text-display text-xl">Forjar Cold Email</CardTitle>
              </div>
              <Wand2 size={18} className="text-violet-glow" />
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div>
              <Label className="text-mono text-[10px] uppercase tracking-widest text-muted-foreground">Nome do negócio</Label>
              <Input value={biz} onChange={(e) => setBiz(e.target.value)} placeholder="Ex: Pizzaria Bella Napoli" className="mt-1.5 border-hairline bg-[color:var(--surface-2)]" />
            </div>
            <div>
              <Label className="text-mono text-[10px] uppercase tracking-widest text-muted-foreground">E-mail alvo</Label>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="contato@negocio.com.br" className="mt-1.5 border-hairline bg-[color:var(--surface-2)]" />
            </div>
            <div>
              <Label className="text-mono text-[10px] uppercase tracking-widest text-muted-foreground">Armadura do template</Label>
              <Select value={template} onValueChange={(v) => setTemplate(v as TemplateId)}>
                <SelectTrigger className="mt-1.5 border-hairline bg-[color:var(--surface-2)]"><SelectValue /></SelectTrigger>
                <SelectContent>{(Object.keys(templates) as TemplateId[]).map((k) => (<SelectItem key={k} value={k}>{templates[k].label}</SelectItem>))}</SelectContent>
              </Select>
            </div>
            <Button onClick={handleStrike} className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-glow to-emerald-glow px-4 py-3 text-sm font-bold text-[color:var(--surface-0)] shadow-[0_0_30px_rgba(140,90,255,0.35)] transition hover:brightness-110">
              <Sparkles size={16} /> Atacar o Portal (Gerar Roteiro)
            </Button>
            {script && (
              <div className="mt-2 overflow-hidden rounded-xl border border-emerald-glow/30 bg-[color:var(--surface-0)]">
                <div className="flex items-center justify-between border-b border-hairline px-4 py-2">
                  <p className="text-mono text-[10px] uppercase tracking-widest text-emerald-glow">Roteiro forjado</p>
                  <Button variant="outline" size="sm" onClick={copyScript}><Copy size={12} /> Copiar</Button>
                </div>
                <pre className="max-h-72 overflow-auto whitespace-pre-wrap px-4 py-3 text-mono text-[12px] leading-relaxed text-foreground">{script}</pre>
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="px-8 pb-12">
        <div className="mb-4 flex items-end justify-between">
          <div>
            <p className="text-mono text-[10px] uppercase tracking-widest text-muted-foreground">O Inventário do Sistema</p>
            <h2 className="text-display text-2xl text-foreground">Loja de Recompensas</h2>
          </div>
          <Badge variant="outline" className="border-amber-glow/40 bg-amber-glow/10 text-amber-glow"><Coins size={12} /> {gold} gold disponível</Badge>
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {inventory.map((it) => {
            const toneBorder = it.tone === "emerald" ? "border-emerald-glow/30 hover:glow-emerald" : it.tone === "violet" ? "border-violet-glow/30 hover:glow-violet" : "border-amber-glow/30 hover:glow-amber";
            const toneText = it.tone === "emerald" ? "text-emerald-glow" : it.tone === "violet" ? "text-violet-glow" : "text-amber-glow";
            return (
              <div key={it.id} className={`flex flex-col gap-3 rounded-2xl border bg-[color:var(--surface-1)] p-4 transition ${toneBorder}`}>
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg bg-[color:var(--surface-0)] ${toneText}`}><it.icon size={18} /></div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{it.name}</p>
                  <p className="text-mono text-[10px] uppercase text-muted-foreground">Item consumível</p>
                </div>
                <div className="mt-auto flex items-center justify-between">
                  <span className={`text-mono text-[11px] ${toneText}`}>{it.price} gold</span>
                  <Button variant="outline" size="sm" onClick={() => buy(it)} disabled={gold < it.price}>Comprar</Button>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </>
  );
}
