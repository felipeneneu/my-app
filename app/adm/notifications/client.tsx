"use client";

import { useState, useEffect, useMemo } from "react";
import { Bell, CheckCheck, Trash2, Timer, AlertTriangle, Sparkles, Swords, Info, ArrowLeft, X } from "lucide-react";
import Link from "next/link";
import { useNotificationStream } from "@/hooks/use-notification-stream";
import { markAsReadAction, markAllAsReadAction, dismissNotificationAction, clearAllReadAction } from "@/lib/actions/notifications";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetClose,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";

const toneMap: Record<string, string> = {
  deadline: "border-rose-glow/30 bg-rose-glow/5 text-rose-glow",
  warning: "border-amber-glow/30 bg-amber-glow/5 text-amber-glow",
  insight: "border-violet-glow/30 bg-violet-glow/5 text-violet-glow",
  suggestion: "border-emerald-glow/30 bg-emerald-glow/5 text-emerald-glow",
  info: "border-hairline bg-(--surface-2) text-muted-foreground",
  system: "border-hairline bg-(--surface-2) text-muted-foreground",
};

const toneIcon: Record<string, string> = {
  deadline: "text-rose-glow",
  warning: "text-amber-glow",
  insight: "text-violet-glow",
  suggestion: "text-emerald-glow",
  info: "text-muted-foreground",
  system: "text-muted-foreground",
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
  const { notifications: liveNotifications, unreadCount } = useNotificationStream();
  const [notifs, setNotifs] = useState(initialNotifications);
  const [tab, setTab] = useState("all");
  const [selected, setSelected] = useState<Notification | null>(null);

  // Merge SSE live updates into local state
  useEffect(() => {
    if (liveNotifications.length > 0) {
      setNotifs(liveNotifications as Notification[]);
    }
  }, [liveNotifications]);

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
    if (selected?.id === id) setSelected(null);
  };

  const handleClearRead = async () => {
    await clearAllReadAction();
    setNotifs((prev) => prev.filter((n) => !n.read));
  };

  const handleOpen = (n: Notification) => {
    setSelected(n);
    if (!n.read) handleMarkRead(n.id);
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
            <Button variant="outline" size="sm" onClick={handleMarkAllRead}>
              <CheckCheck size={12} /> Marcar todas como lidas
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={handleClearRead}>
            <Trash2 size={12} /> Limpar lidas
          </Button>
          <Badge variant="outline" className="text-[10px]">
            {unread.length} não lida{unread.length !== 1 ? "s" : ""}
          </Badge>
        </div>
      </header>

      <section className="flex flex-1 flex-col gap-4 px-8 py-6">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="all">Todas ({notifs.length})</TabsTrigger>
            <TabsTrigger value="unread">Não lidas ({unread.length})</TabsTrigger>
          </TabsList>

          <TabsContent value={tab} className="mt-4">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center gap-3 border border-dashed border-hairline/50 px-8 py-16 text-center">
                <Bell size={32} className="text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">
                  {tab === "unread" ? "Nenhuma notificação não lida" : "Nenhuma notificação ainda"}
                </p>
                <p className="text-[11px] text-muted-foreground/60">As notificações aparecerão aqui conforme o sistema gerar insights.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {filtered.map((n) => (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => handleOpen(n)}
                    className={`flex items-start gap-4 rounded-xl border p-4 text-left transition-all hover:brightness-110 ${n.read ? "opacity-60" : ""} ${toneMap[n.type] ?? "border-hairline bg-(--surface-1)"}`}
                  >
                    <div className={`mt-0.5 ${n.read ? "text-muted-foreground/50" : toneIcon[n.type] ?? "text-muted-foreground"}`}>
                      {getIcon(n.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={`text-sm font-medium ${n.read ? "text-muted-foreground" : "text-foreground"}`}>{n.title}</p>
                        {!n.read && <span className="h-2 w-2 rounded-full bg-emerald-glow shrink-0" />}
                        {n.priority === "high" && (
                          <Badge variant="destructive" className="text-[9px] px-1 py-0">ALTA</Badge>
                        )}
                      </div>
                      <p className="mt-1 text-[11px] text-muted-foreground line-clamp-2">{n.message}</p>
                      <p className="mt-2 text-mono text-[10px] text-muted-foreground/60">
                        {new Date(n.createdAt).toLocaleString("pt-BR")}
                      </p>
                    </div>
                    <div className="flex flex-col gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                      {!n.read && (
                        <Button variant="outline" size="icon-xs" onClick={() => handleMarkRead(n.id)} title="Marcar como lida">
                          <CheckCheck size={12} />
                        </Button>
                      )}
                      <Button variant="outline" size="icon-xs" onClick={() => handleDismiss(n.id)} title="Remover">
                        <Trash2 size={12} />
                      </Button>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </section>

      {/* Gmail-style Sheet */}
      <Sheet open={!!selected} onOpenChange={(open) => { if (!open) setSelected(null); }}>
        <SheetContent className="w-[520px] sm:max-w-[520px]">
          <SheetHeader className="border-b border-hairline pb-4">
            <div className="flex items-center justify-between">
              <SheetTitle className="flex items-center gap-2">
                {selected && (
                  <>
                    <span className={toneIcon[selected.type] ?? ""}>{getIcon(selected.type)}</span>
                    {selected.title}
                  </>
                )}
              </SheetTitle>
              <SheetClose>
                <X size={16} className="text-muted-foreground hover:text-foreground" />
              </SheetClose>
            </div>
          </SheetHeader>

          {selected && (
            <ScrollArea className="flex-1 -mx-6 px-6">
              <div className="flex flex-col gap-6 py-6">
                {/* Meta info */}
                <div className="flex items-center justify-between text-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  <span>{new Date(selected.createdAt).toLocaleString("pt-BR")}</span>
                  {selected.priority === "high" && (
                    <Badge variant="destructive" className="text-[9px]">Prioridade Alta</Badge>
                  )}
                </div>

                {/* Type badge */}
                <div>
                  <Badge variant="outline" className="text-[10px] uppercase">
                    {selected.type}
                  </Badge>
                </div>

                {/* Full message */}
                <div className="rounded-xl border border-hairline bg-(--surface-1) p-5">
                  <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap">
                    {selected.message}
                  </p>
                </div>

                {/* ID */}
                <p className="text-mono text-[9px] text-muted-foreground/40">
                  ID: {selected.id}
                </p>

                {/* Actions */}
                <div className="flex items-center gap-2 border-t border-hairline pt-4">
                  {selected.read ? (
                    <p className="text-mono text-[10px] text-muted-foreground">Lida</p>
                  ) : (
                    <Button variant="outline" size="sm" onClick={() => handleMarkRead(selected.id)}>
                      <CheckCheck size={12} /> Marcar como lida
                    </Button>
                  )}
                  <Button variant="outline" size="sm" onClick={() => handleDismiss(selected.id)}>
                    <Trash2 size={12} /> Remover
                  </Button>
                </div>
              </div>
            </ScrollArea>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
