"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createHunter } from "@/lib/actions/hunter";
import { Dumbbell, BrainCircuit, BookOpen, Sparkles, Swords } from "lucide-react";

const TOTAL_POINTS = 30;

const classes = [
  { id: "solo", label: "Caçador Solo", desc: "Balanço entre força e estratégia", icon: Swords },
  { id: "mage", label: "Mago Digital", desc: "Foco em inteligência e automação", icon: BrainCircuit },
  { id: "warrior", label: "Guerreiro Dev", desc: "Força bruta e disciplina", icon: Dumbbell },
];

const classDefaults: Record<string, { STR: number; INT: number; WIS: number }> = {
  solo: { STR: 10, INT: 10, WIS: 10 },
  mage: { STR: 5, INT: 18, WIS: 7 },
  warrior: { STR: 18, INT: 5, WIS: 7 },
};

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [selectedClass, setSelectedClass] = useState("solo");
  const [attrs, setAttrs] = useState(classDefaults.solo);
  const [loading, setLoading] = useState(false);

  function handleClassSelect(id: string) {
    setSelectedClass(id);
    setAttrs(classDefaults[id]);
  }

  function adjustAttr(key: "STR" | "INT" | "WIS", delta: number) {
    const total = attrs.STR + attrs.INT + attrs.WIS;
    if (delta > 0 && total >= TOTAL_POINTS) return;
    if (delta < 0 && attrs[key] <= 1) return;
    setAttrs((a) => ({ ...a, [key]: a[key] + delta }));
  }

  async function handleCreate() {
    setLoading(true);
    try {
      await createHunter({
        strength: attrs.STR,
        intelligence: attrs.INT,
        wisdom: attrs.WIS,
      });
      toast.success("Personagem criado!");
      router.push("/adm");
    } catch {
      toast.error("Erro ao criar personagem");
    }
    setLoading(false);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-(--surface-0)">
      <div className="w-full max-w-lg">
        {step === 0 && (
          <div className="flex flex-col gap-6 rounded-2xl border border-hairline bg-(--surface-1) p-8">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-glow/40 bg-emerald-glow/10 text-emerald-glow">
                <Sparkles size={24} />
              </div>
              <div>
                <p className="text-mono text-[10px] uppercase tracking-widest text-emerald-glow">Bem-vindo ao Sprint OS</p>
                <h1 className="text-display text-2xl text-foreground">Crie seu Personagem</h1>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              O Sprint OS precisa saber quem você é para personalizar a experiência. Escolha sua classe inicial — você poderá evoluir com o tempo.
            </p>
            <div className="flex flex-col gap-3">
              {classes.map((c) => {
                const Icon = c.icon;
                const active = selectedClass === c.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => handleClassSelect(c.id)}
                    className={`flex items-center gap-4 rounded-xl border p-4 text-left transition-all ${
                      active
                        ? "border-emerald-glow/40 bg-emerald-glow/10"
                        : "border-hairline bg-(--surface-2) hover:border-hairline/60"
                    }`}
                  >
                    <div className={`flex h-10 w-10 items-center justify-center rounded-lg border ${
                      active ? "border-emerald-glow/40 text-emerald-glow" : "border-hairline text-muted-foreground"
                    }`}>
                      <Icon size={18} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{c.label}</p>
                      <p className="text-xs text-muted-foreground">{c.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => setStep(1)}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-glow px-4 py-3 text-sm font-bold text-(--surface-0) hover:brightness-110"
            >
              Próximo: Distribuir Atributos →
            </button>
          </div>
        )}

        {step === 1 && (
          <div className="flex flex-col gap-6 rounded-2xl border border-hairline bg-(--surface-1) p-8">
            <div>
              <p className="text-mono text-[10px] uppercase tracking-widest text-emerald-glow">Atributos</p>
              <h2 className="text-display text-xl text-foreground">Distribua {TOTAL_POINTS} pontos</h2>
              <p className="text-xs text-muted-foreground">Pontos restantes: {TOTAL_POINTS - (attrs.STR + attrs.INT + attrs.WIS)}</p>
            </div>
            {[
              { key: "STR" as const, label: "Força", icon: Dumbbell, tone: "text-rose-glow", desc: "Disciplina física, energia, resiliência" },
              { key: "INT" as const, label: "Inteligência", icon: BrainCircuit, tone: "text-cyan-glow", desc: "Raciocínio lógico, aprendizado técnico" },
              { key: "WIS" as const, label: "Sabedoria", icon: BookOpen, tone: "text-emerald-glow", desc: "Gestão, negócios, visão estratégica" },
            ].map((attr) => (
              <div key={attr.key} className="flex items-center gap-4 rounded-xl border border-hairline bg-(--surface-2) p-4">
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg border ${attr.tone} bg-(--surface-0)`}>
                  <attr.icon size={18} className={attr.tone} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-foreground">{attr.label}</p>
                  <p className="text-[10px] text-muted-foreground">{attr.desc}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => adjustAttr(attr.key, -1)} className="flex h-7 w-7 items-center justify-center rounded-md border border-hairline text-sm text-muted-foreground hover:text-foreground">−</button>
                  <span className="w-8 text-center text-display text-lg text-foreground">{attrs[attr.key]}</span>
                  <button onClick={() => adjustAttr(attr.key, 1)} className="flex h-7 w-7 items-center justify-center rounded-md border border-hairline text-sm text-muted-foreground hover:text-foreground">+</button>
                </div>
              </div>
            ))}
            <div className="flex gap-3">
              <button onClick={() => setStep(0)} className="flex-1 rounded-xl border border-hairline px-4 py-3 text-sm text-muted-foreground hover:text-foreground">Voltar</button>
              <button onClick={() => setStep(2)} className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-glow px-4 py-3 text-sm font-bold text-(--surface-0) hover:brightness-110">Revisar →</button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col gap-6 rounded-2xl border border-hairline bg-(--surface-1) p-8">
            <div>
              <p className="text-mono text-[10px] uppercase tracking-widest text-emerald-glow">Confirmação</p>
              <h2 className="text-display text-xl text-foreground">Ficha do Personagem</h2>
            </div>
            <div className="flex items-center gap-4 rounded-xl border border-hairline bg-(--surface-2) p-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald-glow/40 bg-emerald-glow/10 text-emerald-glow">
                <Swords size={24} />
              </div>
              <div>
                <p className="text-mono text-[10px] uppercase tracking-widest text-muted-foreground">Classe</p>
                <p className="text-display text-xl text-foreground">{classes.find((c) => c.id === selectedClass)?.label}</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[
                { key: "STR", label: "Força", value: attrs.STR, tone: "text-rose-glow", icon: Dumbbell },
                { key: "INT", label: "Inteligência", value: attrs.INT, tone: "text-cyan-glow", icon: BrainCircuit },
                { key: "WIS", label: "Sabedoria", value: attrs.WIS, tone: "text-emerald-glow", icon: BookOpen },
              ].map((attr) => {
                const Icon = attr.icon;
                return (
                  <div key={attr.key} className={`flex flex-col items-center gap-2 rounded-xl border border-hairline bg-(--surface-2) p-4 ${attr.tone}`}>
                    <Icon size={18} />
                    <p className="text-mono text-[10px] uppercase">{attr.label}</p>
                    <p className="text-display text-2xl">{attr.value}</p>
                  </div>
                );
              })}
            </div>
            <div className="flex gap-3">
              <button onClick={() => setStep(1)} className="flex-1 rounded-xl border border-hairline px-4 py-3 text-sm text-muted-foreground hover:text-foreground">Voltar</button>
              <button onClick={handleCreate} disabled={loading} className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-glow px-4 py-3 text-sm font-bold text-(--surface-0) hover:brightness-110 disabled:opacity-50">
                {loading ? "Criando…" : "Criar Personagem →"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}