"use client";

import { Dumbbell, BrainCircuit, BookOpen, Coins, ShieldCheck, Swords } from "lucide-react";

type Hunter = {
  id: string;
  level: number;
  currentXp: number;
  maxXp: number;
  goldBalance: number;
  hunterRank: string;
  strength: number;
  intelligence: number;
  wisdom: number;
};

export function ProfileClient({ hunter }: { hunter: Hunter }) {
  const attrs = [
    { key: "STR", label: "Força", value: hunter.strength, icon: Dumbbell, tone: "text-rose-glow" },
    { key: "INT", label: "Inteligência", value: hunter.intelligence, icon: BrainCircuit, tone: "text-cyan-glow" },
    { key: "WIS", label: "Sabedoria", value: hunter.wisdom, icon: BookOpen, tone: "text-emerald-glow" },
  ];

  return (
    <>
      <header className="border-b border-hairline px-8 py-6">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-violet-glow/40 bg-violet-glow/10 text-violet-glow">
            <Swords size={26} />
          </div>
          <div>
            <p className="text-mono text-[10px] uppercase tracking-widest text-violet-glow">Perfil do Hunter</p>
            <h1 className="text-display text-3xl text-foreground">FICHA DO PERSONAGEM</h1>
          </div>
        </div>
      </header>

      <section className="grid grid-cols-1 gap-4 px-8 py-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-hairline bg-(--surface-1) p-6">
          <p className="text-mono text-[10px] uppercase tracking-widest text-muted-foreground">Rank</p>
          <div className="mt-3 flex items-center gap-3">
            <ShieldCheck size={24} className="text-violet-glow" />
            <p className="text-display text-4xl text-violet-glow">{hunter.hunterRank}</p>
          </div>
        </div>
        <div className="rounded-2xl border border-hairline bg-(--surface-1) p-6">
          <p className="text-mono text-[10px] uppercase tracking-widest text-muted-foreground">Nível</p>
          <p className="text-display text-4xl text-emerald-glow">{hunter.level}</p>
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-(--surface-2)">
            <div className="h-full rounded-full bg-linear-to-r from-emerald-glow to-violet-glow" style={{ width: `${(hunter.currentXp / hunter.maxXp) * 100}%` }} />
          </div>
          <p className="mt-1 text-mono text-[11px] text-muted-foreground">{hunter.currentXp} / {hunter.maxXp} XP</p>
        </div>
        <div className="rounded-2xl border border-hairline bg-(--surface-1) p-6">
          <p className="text-mono text-[10px] uppercase tracking-widest text-muted-foreground">Gold</p>
          <div className="mt-3 flex items-center gap-3">
            <Coins size={24} className="text-amber-glow" />
            <p className="text-display text-4xl text-amber-glow">{hunter.goldBalance}</p>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-3 gap-4 px-8 py-4">
        {attrs.map((attr) => (
          <div key={attr.key} className={`rounded-2xl border border-hairline bg-(--surface-1) p-6 ${attr.tone}`}>
            <div className="flex items-center gap-3">
              <attr.icon size={20} />
              <div>
                <p className="text-mono text-[10px] uppercase tracking-widest">{attr.label}</p>
                <p className="text-display text-3xl">{attr.value}</p>
              </div>
            </div>
          </div>
        ))}
      </section>
    </>
  );
}
