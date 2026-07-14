"use client";

import { useState, useCallback } from "react";
import { toast } from "sonner";
import {
  Swords, Star, Zap, Brain, Eye,
  CheckCircle2, Circle, Trophy, ScrollText,
  User, ListChecks, Sparkles,
} from "lucide-react";
import { toggleHabit } from "@/lib/actions/growth";
import { completeQuest } from "@/lib/actions/hunter";

type HunterData = {
  level: number;
  currentXp: number;
  maxXp: number;
  goldBalance: number;
  hunterRank: string;
  strength: number;
  intelligence: number;
  wisdom: number;
};

type QuestData = {
  id: string;
  description: string;
  progressCurrent: number;
  progressTarget: number;
  completed: boolean;
  type: string;
};

type HabitData = {
  id: string;
  label: string;
  attribute: string;
  xpReward: number;
  goldReward: number;
  category: string;
  done: boolean;
};

type AchievementData = {
  id: string;
  name: string;
  description: string | null;
  conditionType: string;
  conditionValue: number;
  xpBonus: number;
  icon: string | null;
};

const RANK_COLORS: Record<string, string> = {
  E: "text-zinc-400", D: "text-green-400", C: "text-cyan-400",
  B: "text-violet-400", A: "text-amber-400", S: "text-red-400",
};

const ATTR_ICONS: Record<string, typeof Zap> = {
  STR: Zap, INT: Brain, WIS: Eye,
};

const ATTR_COLORS: Record<string, string> = {
  STR: "text-red-400", INT: "text-cyan-400", WIS: "text-amber-400",
};

const QUEST_LABELS: Record<string, string> = {
  lead: "Prospecção", project: "Projeto", xp: "XP", general: "Geral",
};

const TAB_ICONS: Record<string, typeof User> = {
  status: User, quests: ListChecks, habits: ScrollText, achievements: Trophy,
};

export function HunterMobileClient({
  hunter, quests: initialQuests, habits: initialHabits, achievements,
}: {
  hunter: HunterData;
  quests: QuestData[];
  habits: HabitData[];
  achievements: AchievementData[];
}) {
  const [tab, setTab] = useState<string>("status");
  const [quests, setQuests] = useState(initialQuests);
  const [habitsState, setHabits] = useState(initialHabits);

  const handleToggleHabit = useCallback(async (id: string) => {
    const habit = habitsState.find(h => h.id === id);
    if (!habit) return;
    const result = await toggleHabit(id);
    if (result) {
      setHabits(prev => prev.map(h => h.id === id ? { ...h, done: !h.done } : h));
      toast.success(!habit.done ? "Hábito concluído!" : "Hábito desmarcado");
    }
  }, [habitsState]);

  const handleCompleteQuest = useCallback(async (id: string) => {
    await completeQuest(id);
    setQuests(prev => prev.filter(q => q.id !== id));
    toast.success("Quest concluída!");
  }, []);

  const tabs = [
    { id: "status", label: "Status", icon: User },
    { id: "quests", label: "Quests", icon: ListChecks },
    { id: "habits", label: "Hábitos", icon: ScrollText },
    { id: "achievements", label: "Troféus", icon: Trophy },
  ];

  return (
    <div className="flex min-h-dvh flex-col bg-zinc-950 text-white">
      {/* Header */}
      <header className="flex items-center gap-2 border-b border-zinc-800 px-4 py-3">
        <Swords size={20} className="text-violet-400" />
        <span className="text-sm font-bold">Hunter</span>
        <span className={`ml-auto text-xs font-bold ${RANK_COLORS[hunter.hunterRank] ?? "text-zinc-400"}`}>
          Rank {hunter.hunterRank}
        </span>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {tab === "status" && <StatusTab hunter={hunter} />}
        {tab === "quests" && (
          <QuestsTab quests={quests} onComplete={handleCompleteQuest} />
        )}
        {tab === "habits" && (
          <HabitsTab habits={habitsState} onToggle={handleToggleHabit} />
        )}
        {tab === "achievements" && (
          <AchievementsTab achievements={achievements} />
        )}
      </div>

      {/* Bottom Tab Bar */}
      <nav className="flex border-t border-zinc-800 bg-zinc-900">
        {tabs.map(t => {
          const Icon = t.icon;
          const isActive = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-medium transition-colors ${
                isActive ? "text-violet-400" : "text-zinc-600"
              }`}
            >
              <Icon size={18} />
              {t.label}
            </button>
          );
        })}
      </nav>
    </div>
  );
}

function StatusTab({ hunter }: { hunter: HunterData }) {
  const xpPct = Math.round((hunter.currentXp / hunter.maxXp) * 100);
  return (
    <div className="space-y-6">
      {/* Level & XP */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-zinc-500">Nível</p>
            <p className="text-3xl font-bold">{hunter.level}</p>
          </div>
          <span className={`text-lg font-bold ${RANK_COLORS[hunter.hunterRank] ?? "text-zinc-400"}`}>
            {hunter.hunterRank}
          </span>
        </div>
        <div className="mt-3">
          <div className="flex items-center justify-between text-xs text-zinc-500">
            <span>XP</span>
            <span>{hunter.currentXp} / {hunter.maxXp}</span>
          </div>
          <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-zinc-800">
            <div className="h-full rounded-full bg-violet-500 transition-all" style={{ width: `${xpPct}%` }} />
          </div>
        </div>
      </div>

      {/* Gold */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
        <div className="flex items-center gap-2">
          <Star size={16} className="text-amber-400" />
          <span className="text-xs text-zinc-500">Gold</span>
          <span className="ml-auto text-lg font-bold text-amber-400">{hunter.goldBalance}</span>
        </div>
      </div>

      {/* Attributes */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
        <p className="mb-3 text-[10px] uppercase tracking-widest text-zinc-500">Atributos</p>
        <div className="grid grid-cols-3 gap-3">
          {(["STR", "INT", "WIS"] as const).map(attr => {
            const Icon = ATTR_ICONS[attr];
            const value = attr === "STR" ? hunter.strength : attr === "INT" ? hunter.intelligence : hunter.wisdom;
            return (
              <div key={attr} className="flex flex-col items-center gap-1 rounded-lg bg-zinc-800/50 p-3">
                <Icon size={18} className={ATTR_COLORS[attr]} />
                <span className={`text-xs font-bold ${ATTR_COLORS[attr]}`}>{attr}</span>
                <span className="text-lg font-bold">{value}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function QuestsTab({ quests, onComplete }: { quests: QuestData[]; onComplete: (id: string) => void }) {
  if (quests.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-12 text-center">
        <ListChecks size={28} className="text-zinc-700" />
        <p className="text-sm text-zinc-600">Todas as quests concluídas!</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {quests.map(q => {
        const pct = q.progressTarget > 0 ? Math.round((q.progressCurrent / q.progressTarget) * 100) : 0;
        const isComplete = q.progressCurrent >= q.progressTarget;
        return (
          <div key={q.id} className={`rounded-xl border p-4 ${isComplete ? "border-emerald-800/50 bg-emerald-900/10" : "border-zinc-800 bg-zinc-900/50"}`}>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-xs text-zinc-400">{QUEST_LABELS[q.type] ?? q.type}</p>
                <p className="mt-0.5 text-sm text-white">{q.description}</p>
              </div>
              {isComplete ? (
                <button onClick={() => onComplete(q.id)}
                  className="rounded-lg bg-emerald-600 px-3 py-1.5 text-[10px] font-semibold text-white">
                  Coletar
                </button>
              ) : null}
            </div>
            <div className="mt-2">
              <div className="flex items-center justify-between text-[10px] text-zinc-500">
                <span>{q.progressCurrent}/{q.progressTarget}</span>
                <span>{pct}%</span>
              </div>
              <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
                <div className={`h-full rounded-full transition-all ${isComplete ? "bg-emerald-500" : "bg-violet-500"}`}
                  style={{ width: `${pct}%` }} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function HabitsTab({ habits: habitsList, onToggle }: { habits: HabitData[]; onToggle: (id: string) => void }) {
  const today = new Date().toISOString().split("T")[0];
  const todayHabits = habitsList.filter(h => h.category === today || habitsList.length <= 10);
  const doneCount = habitsList.filter(h => h.done).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-xs text-zinc-500">
        <span>{doneCount}/{habitsList.length} concluídos</span>
      </div>
      <div className="space-y-1.5">
        {habitsList.length === 0 ? (
          <p className="py-8 text-center text-xs text-zinc-600">Nenhum hábito hoje</p>
        ) : (
          habitsList.map(h => {
            const Icon = ATTR_ICONS[h.attribute as keyof typeof ATTR_ICONS] ?? Sparkles;
            return (
              <button
                key={h.id}
                onClick={() => onToggle(h.id)}
                className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition-colors ${
                  h.done ? "border-emerald-800/30 bg-emerald-900/10" : "border-zinc-800 bg-zinc-900/50"
                }`}
              >
                {h.done ? (
                  <CheckCircle2 size={18} className="shrink-0 text-emerald-500" />
                ) : (
                  <Circle size={18} className="shrink-0 text-zinc-600" />
                )}
                <span className={`flex-1 text-sm ${h.done ? "text-zinc-500 line-through" : "text-white"}`}>
                  {h.label}
                </span>
                <Icon size={14} className={ATTR_COLORS[h.attribute] ?? "text-zinc-500"} />
                <div className="text-right text-[10px] text-zinc-500">
                  <p>+{h.xpReward} XP</p>
                  <p>+{h.goldReward} gold</p>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

function AchievementsTab({ achievements: list }: { achievements: AchievementData[] }) {
  if (list.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-12 text-center">
        <Trophy size={28} className="text-zinc-700" />
        <p className="text-sm text-zinc-600">Nenhum achievement disponível</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {list.map(a => (
        <div key={a.id} className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
          <div className="flex items-start gap-3">
            <Trophy size={18} className="mt-0.5 shrink-0 text-amber-500" />
            <div>
              <p className="text-sm font-semibold text-white">{a.name}</p>
              {a.description && (
                <p className="mt-0.5 text-xs text-zinc-500">{a.description}</p>
              )}
              <p className="mt-1 text-[10px] text-violet-400">
                {a.conditionValue}x {a.conditionType.replace(/_/g, " ")} · +{a.xpBonus} XP
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
