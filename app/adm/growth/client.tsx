"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Dumbbell, BrainCircuit, BookOpen, Coins, Flame, CheckCircle2,
  Circle, ShieldAlert, Timer, Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toggleHabit, resetHabits } from "@/lib/actions/growth";

type AttrKey = "STR" | "INT" | "WIS";
type HabitData = { id: string; label: string; attribute: AttrKey; xpReward: number; goldReward: number; category: string; done: boolean };

const attrMeta: Record<AttrKey, { label: string; icon: typeof Dumbbell; tone: string; ring: string; note: string }> = {
  STR: { label: "Força", icon: Dumbbell, tone: "text-rose-glow", ring: "border-rose-glow/40 bg-rose-glow/5", note: "Treino físico · Krav Maga" },
  INT: { label: "Inteligência", icon: BrainCircuit, tone: "text-cyan-glow", ring: "border-cyan-glow/40 bg-cyan-glow/5", note: "Next.js · UI/UX técnico" },
  WIS: { label: "Sabedoria", icon: BookOpen, tone: "text-emerald-glow", ring: "border-emerald-glow/40 bg-emerald-glow/5", note: "Gestão · negócios · filosofia" },
};

function xpForLevel(level: number) {
  return 100 + level * 40;
}

function useCountdownToMidnight() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  const end = useMemo(() => {
    const d = new Date(now);
    d.setHours(23, 59, 59, 999);
    return d;
  }, [now]);
  const msLeft = Math.max(0, end.getTime() - now.getTime());
  const h = Math.floor(msLeft / 3_600_000);
  const m = Math.floor((msLeft % 3_600_000) / 60_000);
  const s = Math.floor((msLeft % 60_000) / 1000);
  const totalDay = 24 * 60 * 60 * 1000;
  const dayProgress = 1 - msLeft / totalDay;
  return { h, m, s, msLeft, dayProgress };
}

export function GrowthClient({ hunter, habits: initialHabits }: {
  hunter: { level: number; currentXp: number; maxXp: number; goldBalance: number; strength: number; intelligence: number; wisdom: number };
  habits: HabitData[];
}) {
  const [habits, setHabits] = useState<HabitData[]>(initialHabits.length > 0 ? initialHabits : [
    { id: "h1", label: "Treino de força · 60min", attribute: "STR", xpReward: 60, goldReward: 40, category: "Corpo", done: false },
    { id: "h2", label: "Sessão de Krav Maga", attribute: "STR", xpReward: 80, goldReward: 55, category: "Combate", done: false },
    { id: "h3", label: "Deep work Next.js · 2h", attribute: "INT", xpReward: 90, goldReward: 60, category: "Técnico", done: false },
    { id: "h4", label: "Estudo de UI/UX (case)", attribute: "INT", xpReward: 50, goldReward: 30, category: "Design", done: false },
    { id: "h5", label: "Leitura de gestão · 30min", attribute: "WIS", xpReward: 45, goldReward: 25, category: "Negócios", done: false },
    { id: "h6", label: "Revisão semanal do negócio", attribute: "WIS", xpReward: 70, goldReward: 50, category: "Estratégia", done: false },
  ]);
  const [gold, setGold] = useState(hunter.goldBalance);
  const [attrs, setAttrs] = useState<Record<AttrKey, { xp: number; level: number }>>({
    STR: { xp: 0, level: Math.floor(hunter.strength / 5) || 1 },
    INT: { xp: 0, level: Math.floor(hunter.intelligence / 5) || 1 },
    WIS: { xp: 0, level: Math.floor(hunter.wisdom / 5) || 1 },
  });
  const { h, m, s, msLeft, dayProgress } = useCountdownToMidnight();

  const growthDone = habits.filter((x) => x.done).length;
  const growthTotal = habits.length;
  const growthPct = growthTotal > 0 ? (growthDone / growthTotal) * 100 : 0;
  const penaltyActive = growthPct < 60 && msLeft < 2 * 60 * 60 * 1000;
  const penaltyRisk = growthPct < 60 && msLeft < 6 * 60 * 60 * 1000 && !penaltyActive;

  async function handleToggle(id: string) {
    const target = habits.find((x) => x.id === id);
    if (!target) return;
    const nowDone = !target.done;
    setHabits((hs) => hs.map((x) => (x.id === id ? { ...x, done: nowDone } : x)));

    if (nowDone) {
      await toggleHabit(id).then(result => {
        if (result) {
          setGold(result.goldReward > 0 ? g => g + result.goldReward : g => g);
        }
      });
      const attr = attrs[target.attribute];
      const newXp = attr.xp + target.xpReward;
      let newLevel = attr.level;
      let xpForThisLevel = xpForLevel(newLevel);
      let remainingXp = newXp;
      while (remainingXp >= xpForThisLevel) {
        remainingXp -= xpForThisLevel;
        newLevel += 1;
        xpForThisLevel = xpForLevel(newLevel);
        toast.success(`${attrMeta[target.attribute].label} subiu para o nível ${newLevel}!`);
      }
      setAttrs(a => ({ ...a, [target.attribute]: { xp: remainingXp, level: newLevel } }));
      setGold(g => g + target.goldReward);
      toast.success(`+${target.xpReward} XP · +${target.goldReward} gold`);
    } else {
      await toggleHabit(id);
      setAttrs(a => {
        const current = a[target.attribute];
        let xp = current.xp - target.xpReward;
        let level = current.level;
        while (xp < 0 && level > 1) { level -= 1; xp += xpForLevel(level); }
        return { ...a, [target.attribute]: { xp: Math.max(0, xp), level } };
      });
      setGold(g => Math.max(0, g - target.goldReward));
    }
  }

  async function handleReset() {
    setHabits(hs => hs.map(x => ({ ...x, done: false })));
    await resetHabits();
    toast.success("Novo dia iniciado");
  }

  return (
    <>
      <header className="flex items-center justify-between border-b border-hairline px-8 py-4">
        <div>
          <p className="text-mono text-[11px] uppercase tracking-widest text-emerald-glow">Evolução do Hunter · Growth System</p>
          <h1 className="text-display mt-1 text-3xl text-foreground">Desenvolvimento Pessoal</h1>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="border-amber-glow/40 bg-amber-glow/10 text-amber-glow"><Coins size={12} /> {gold.toLocaleString("pt-BR")} gold</Badge>
          <Badge variant="outline" className="border-rose-glow/40 bg-rose-glow/10 text-rose-glow"><Flame size={12} /> {hunter.level * 3} dias de streak</Badge>
        </div>
      </header>

      <section className="px-8 pt-6">
        <div className={`flex items-center justify-between rounded-2xl border p-5 transition-all ${penaltyActive ? "border-rose-glow/60 bg-rose-glow/10 animate-pulse" : penaltyRisk ? "border-amber-glow/50 bg-amber-glow/10" : "border-cyan-glow/30 bg-cyan-glow/5"}`}>
          <div className="flex items-center gap-4">
            <div className={`flex h-14 w-14 items-center justify-center rounded-2xl border ${penaltyActive ? "border-rose-glow text-rose-glow" : penaltyRisk ? "border-amber-glow text-amber-glow" : "border-cyan-glow text-cyan-glow"}`}>
              {penaltyActive ? <ShieldAlert size={28} /> : <Timer size={28} />}
            </div>
            <div>
              <p className="text-mono text-[10px] uppercase tracking-widest opacity-80">Penalty Zone · encerramento diário 23:59</p>
              <p className={`text-display text-2xl ${penaltyActive ? "text-rose-glow" : penaltyRisk ? "text-amber-glow" : "text-cyan-glow"}`}>
                {penaltyActive ? "PENALIDADE ATIVADA · Loja bloqueada por 24h" : penaltyRisk ? "Risco alto · complete missões antes que anoiteça" : "Status estável · Hunter no ritmo"}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">{growthDone}/{growthTotal} missões de crescimento cumpridas hoje</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-mono text-[10px] uppercase tracking-widest text-muted-foreground">Tempo restante do dia</p>
            <p className={`text-display text-4xl ${penaltyActive ? "text-rose-glow" : "text-foreground"}`}>{String(h).padStart(2, "0")}:{String(m).padStart(2, "0")}:{String(s).padStart(2, "0")}</p>
            <div className="mt-2 h-1.5 w-56 overflow-hidden rounded-full bg-[color:var(--surface-2)]">
              <div className={`h-full rounded-full ${penaltyActive ? "bg-rose-glow" : penaltyRisk ? "bg-amber-glow" : "bg-cyan-glow"}`} style={{ width: `${dayProgress * 100}%` }} />
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 px-8 pt-6 lg:grid-cols-3">
        {(Object.keys(attrMeta) as AttrKey[]).map((key) => {
          const meta = attrMeta[key];
          const a = attrs[key];
          const need = xpForLevel(a.level);
          const pct = need > 0 ? (a.xp / need) * 100 : 0;
          const Icon = meta.icon;
          return (
            <div key={key} className={`rounded-2xl border p-6 ${meta.ring}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-2xl border border-current ${meta.tone} bg-[color:var(--surface-0)]`}><Icon size={22} /></div>
                  <div>
                    <p className="text-mono text-[10px] uppercase tracking-widest opacity-80">{key} · {meta.note}</p>
                    <p className={`text-display text-xl ${meta.tone}`}>{meta.label}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-mono text-[10px] uppercase text-muted-foreground">Nível</p>
                  <p className={`text-display text-3xl ${meta.tone}`}>{a.level}</p>
                </div>
              </div>
              <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-[color:var(--surface-2)]">
                <div className={`h-full rounded-full bg-current ${meta.tone} transition-all`} style={{ width: `${Math.min(100, pct)}%` }} />
              </div>
              <p className="mt-2 text-mono text-[11px] text-muted-foreground">{a.xp} / {need} XP para o próximo nível</p>
            </div>
          );
        })}
      </section>

      <section className="px-8 py-8">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-mono text-[10px] uppercase tracking-widest text-emerald-glow">Quests de desenvolvimento diário</p>
                <CardTitle className="text-display text-xl">Checklist de hábitos</CardTitle>
              </div>
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-cyan-glow" />
                <span className="text-mono text-[11px] text-muted-foreground">{growthDone}/{growthTotal} concluídas · {growthPct.toFixed(0)}%</span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-4 h-1.5 w-full overflow-hidden rounded-full bg-[color:var(--surface-2)]">
              <div className="h-full rounded-full bg-gradient-to-r from-emerald-glow to-cyan-glow transition-all" style={{ width: `${growthPct}%` }} />
            </div>
            <ul className="grid grid-cols-1 gap-2 md:grid-cols-2">
              {habits.map((q) => {
                const meta = attrMeta[q.attribute];
                return (
                  <li key={q.id} className={`flex items-center gap-3 rounded-xl border p-3 transition-all ${q.done ? "border-emerald-glow/40 bg-emerald-glow/5" : "border-hairline bg-[color:var(--surface-2)]"}`}>
                    <button onClick={() => handleToggle(q.id)} className={q.done ? "text-emerald-glow" : "text-muted-foreground"}>{q.done ? <CheckCircle2 size={20} /> : <Circle size={20} />}</button>
                    <div className="flex-1">
                      <p className={`text-sm ${q.done ? "text-muted-foreground line-through" : "text-foreground"}`}>{q.label}</p>
                      <p className="text-mono text-[10px] uppercase text-muted-foreground">{q.category}</p>
                    </div>
                    <div className="flex flex-col items-end gap-0.5">
                      <span className={`inline-flex items-center gap-1 rounded-md border border-current px-1.5 py-0.5 text-[10px] font-mono ${meta.tone}`}>+{q.xpReward} {q.attribute}</span>
                      <span className="inline-flex items-center gap-1 text-[10px] font-mono text-amber-glow"><Coins size={10} /> +{q.goldReward}</span>
                    </div>
                  </li>
                );
              })}
            </ul>
            <div className="mt-5 flex items-center justify-between rounded-xl border border-cyan-glow/30 bg-cyan-glow/5 px-4 py-3">
              <p className="text-sm text-cyan-glow">Complete pelo menos 60% das quests antes das 23:59 para evitar penalidade.</p>
              <Button variant="outline" onClick={handleReset} className="border-cyan-glow/50 text-cyan-glow hover:bg-cyan-glow/10">Zerar dia</Button>
            </div>
          </CardContent>
        </Card>
      </section>
    </>
  );
}
