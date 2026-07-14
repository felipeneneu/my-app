"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Bell, CheckCheck, Trash2, Sparkles, AlertTriangle, Timer, Info, Swords } from "lucide-react";
import { useNotificationStream } from "@/hooks/use-notification-stream";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { markAsReadAction, markAllAsReadAction, dismissNotificationAction, clearAllReadAction } from "@/lib/actions/notifications";

export function NotificationsBell() {
  const { unreadCount, notifications, connected } = useNotificationStream();
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const getIcon = (type: string) => {
    const map: Record<string, typeof Sparkles> = {
      deadline: Timer,
      warning: AlertTriangle,
      insight: Swords,
      suggestion: Sparkles,
      info: Info,
      system: Bell,
    };
    const Icon = map[type] ?? Bell;
    return <Icon size={14} />;
  };

  const toneMap: Record<string, string> = {
    deadline: "text-rose-glow",
    warning: "text-amber-glow",
    insight: "text-violet-glow",
    suggestion: "text-emerald-glow",
    info: "text-muted-foreground",
    system: "text-muted-foreground",
  };

  const handleMarkAllRead = useCallback(async () => {
    await markAllAsReadAction();
    router.refresh();
  }, [router]);

  const handleClearAllRead = useCallback(async () => {
    await clearAllReadAction();
    router.refresh();
  }, [router]);

  const handleMarkRead = useCallback(async (id: string) => {
    await markAsReadAction(id);
    router.refresh();
  }, [router]);

  const handleDismiss = useCallback(async (id: string) => {
    await dismissNotificationAction(id);
    router.refresh();
  }, [router]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-hairline bg-(--surface-1) hover:bg-(--surface-2) transition-colors">
        <Bell size={16} className="text-muted-foreground" />
        {unreadCount > 0 && (
          <Badge className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-glow px-1 text-[9px] font-bold text-(--surface-0)">
            {unreadCount > 9 ? "9+" : unreadCount}
          </Badge>
        )}
        {connected && (
          <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-glow" />
        )}
      </PopoverTrigger>
      <PopoverContent align="end" sideOffset={8} className="w-[380px] p-0">
        <div className="flex max-h-[560px] flex-col">
          <div className="flex shrink-0 items-center justify-between border-b border-hairline px-4 py-3">
            <p className="text-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              Notificações {unreadCount > 0 && <span className="text-rose-glow">· {unreadCount} nova(s)</span>}
            </p>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <Button variant="ghost" size="xs" onClick={handleMarkAllRead}>
                  <CheckCheck size={12} /> Ler todas
                </Button>
              )}
              <Button variant="ghost" size="xs" onClick={handleClearAllRead}>
                <Trash2 size={12} /> Limpar lidas
              </Button>
            </div>
          </div>

          <ScrollArea className="flex-1">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
                <Bell size={20} className="text-muted-foreground/40" />
                <p className="text-[11px] text-muted-foreground">Nenhuma notificação por enquanto</p>
              </div>
            ) : (
              <div className="flex flex-col">
                {notifications.map((n) => (
                  <div key={n.id} className={["group flex gap-3 border-b border-hairline px-4 py-3 transition-colors", n.read ? "opacity-50" : "hover:bg-(--surface-2)"].join(" ")}>
                    <div className={`mt-0.5 ${toneMap[n.type] ?? "text-muted-foreground"}`}>
                      {getIcon(n.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={["text-sm", n.read ? "text-muted-foreground" : "text-foreground"].join(" ")}>{n.title}</p>
                      <p className="mt-0.5 text-[11px] text-muted-foreground line-clamp-2">{n.message}</p>
                      <p className="mt-1 text-mono text-[9px] text-muted-foreground/60">
                        {new Date(n.createdAt).toLocaleString("pt-BR")}
                      </p>
                    </div>
                    <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      {!n.read && (
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => handleMarkRead(n.id)}
                          title="Marcar como lida"
                        >
                          <CheckCheck size={12} />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => handleDismiss(n.id)}
                        title="Remover"
                      >
                        <Trash2 size={12} />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          <Separator />
          <div className="shrink-0 px-4 py-2">
            <Link href="/adm/notifications" className="text-mono text-[10px] uppercase tracking-widest text-emerald-glow hover:brightness-110">
              Ver todas as notificações →
            </Link>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
