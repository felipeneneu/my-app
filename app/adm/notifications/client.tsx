"use client";

import { useState } from "react";
import { Bell, CheckCheck, Trash2, Timer, AlertTriangle, Sparkles, Swords, Info, Coins, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { markAsReadAction, markAllAsReadAction, dismissNotificationAction } from "@/lib/actions/notifications";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

const iconMap: Record<string, typeof Bell> = { Bell, Timer, AlertTriangle, Sparkles, Swords, Info, Coins };
const toneMap: Record<string, string> = {
  deadline: "border-rose-glow/30 bg-rose-glow/5 text-rose-glow",
  warning: "border-amber-glow/30 bg-amber-glow/5 text-amber-glow",
  insight: "border-violet-glow/30 bg-violet-glow/5 text-violet-glow",
  suggestion: "border-emerald-glow/30 bg-emerald-glow/5 text-emerald-glow",
  info: "border-cyan-glow/30 bg-cyan-glow/5 text-cyan-glow",
  system: "border-hairline bg-[color:var(--surface-2)] text-muted-foreground",
};

type Notification = {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  priority: string;
  createdAt: string;
};

export function NotificationsClient({ initialNotifications }: { initialNotifications: Notification[] }) {
  const [notifs, setNotifs] = useState(initialNotifications);
  const [tab, setTab] = useState("all");

  const unread = notifs.filter((n) => !n.read);
  const filtered = tab === "unread" ? unread : notifs;

  const handleMarkRead = async (id: string) => {
    await markAsReadAction(id);
    setNotifs((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const handleMarkAllRead = async () => {
    await markAllAsReadAction();
    setNotifs((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleDismiss = async (id: string) => {
    await dismissNotificationAction(id);
    setNotifs((prev) => prev.filter((n) => n.id !== id));
  };

  const getIcon = (type: string) => {
    const icons: Record<string, typeof Bell> = { deadline: Timer, warning: AlertTriangle, insight: Swords, suggestion: Sparkles, info: Info, system: Bell };
    const Icon = icons[type] ?? Bell;
    return <Icon size={16} />;
  };

  return (
    <>
      <header className="flex items-center justify-between border-b border-hairline px-8 py-4">
        <div className="flex items-center gap-3">
          <Link href="/adm" className="inline-flex items-center gap-1.5 rounded-md border border-hairline px-2 py-1 text-[11px] text-muted-foreground hover:text-foreground">
            <ArrowLeft size={12} /> Painel
          </Link>
          <Bell size={16} className="text-emerald-glow" />
          <p className="text-mono text-[11px] uppercase tracking-widest text-muted-foreground">Central de Notificações</p>
        </div>
        <div className="flex items-center gap-2">
          {unread.length > 0 && (
            <button onClick={handleMarkAllRead} className="inline-flex items-center gap-1.5 rounded-md border border-hairline px-2.5 py-1.5 text-[11px] text-muted-foreground hover:text-foreground">
              <CheckCheck size={12} /> Marcar todas como lidas
            </button>
          )}
          <Badge variant="outline" className="text-[10px]">
            {unread.length} não lida{unread.length !== 1 ? "s" : ""}
          </Badge>
        </div>
      </header>

      <section className="px-8 py-6">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="all">Todas ({notifs.length})</TabsTrigger>
            <TabsTrigger value="unread">Não lidas ({unread.length})</TabsTrigger>
          </TabsList>

          <TabsContent value={tab} className="mt-4">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-16 text-center">
                <Bell size={32} className="text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">
                  {tab === "unread" ? "Nenhuma notificação não lida" : "Nenhuma notificação ainda"}
                </p>
                <p className="text-xs text-muted-foreground/60">As notificações aparecerão aqui conforme o sistema gerar insights.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {filtered.map((n) => (
                  <div key={n.id} className={`flex items-start gap-4 rounded-xl border p-4 transition-all ${toneMap[n.type] ?? "border-hairline bg-[color:var(--surface-1)]"}`}>
                    <div className="mt-0.5">{getIcon(n.type)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-foreground">{n.title}</p>
                        {!n.read && <span className="h-2 w-2 rounded-full bg-emerald-glow shrink-0" />}
                        {n.priority === "high" && (
                          <Badge variant="destructive" className="text-[9px] px-1 py-0">ALTA</Badge>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">{n.message}</p>
                      <p className="mt-2 text-mono text-[10px] text-muted-foreground/60">
                        {new Date(n.createdAt).toLocaleString("pt-BR")}
                      </p>
                    </div>
                    <div className="flex flex-col gap-1 shrink-0">
                      {!n.read && (
                        <button onClick={() => handleMarkRead(n.id)} className="flex h-7 w-7 items-center justify-center rounded-md border border-hairline text-muted-foreground hover:text-emerald-glow hover:border-emerald-glow/40" title="Marcar como lida">
                          <CheckCheck size={12} />
                        </button>
                      )}
                      <button onClick={() => handleDismiss(n.id)} className="flex h-7 w-7 items-center justify-center rounded-md border border-hairline text-muted-foreground hover:text-rose-glow hover:border-rose-glow/40" title="Remover">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </section>
    </>
  );
}