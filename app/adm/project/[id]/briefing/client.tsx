"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Hash,
  Send,
  Info,
  ListChecks,
  Flag,
  GitCommit,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { addActivityNote } from "@/lib/actions/briefing";
import type { ActivityEvent } from "@/lib/data/briefing";

function formatTime(iso: string) {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function formatDateLabel(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (d.toDateString() === today.toDateString()) return "Hoje";
  if (d.toDateString() === yesterday.toDateString()) return "Ontem";

  return d.toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function isSameDay(a: string, b: string) {
  return new Date(a).toDateString() === new Date(b).toDateString();
}

const avatarColors = [
  "bg-emerald-500",
  "bg-violet-500",
  "bg-amber-500",
  "bg-rose-500",
  "bg-sky-500",
  "bg-pink-500",
];

function getAvatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return avatarColors[Math.abs(hash) % avatarColors.length];
}

const systemIcons: Record<string, React.ReactNode> = {
  system: <Info size={14} />,
  task_created: <ListChecks size={14} />,
  milestone: <Flag size={14} />,
  commit: <GitCommit size={14} />,
};

export function BriefingClient({
  projectId,
  projectName,
  initialEvents,
  userName,
}: {
  projectId: string;
  projectName: string;
  initialEvents: ActivityEvent[];
  userName: string;
}) {
  const router = useRouter();
  const [events, setEvents] = useState<ActivityEvent[]>(initialEvents);
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    setEvents(initialEvents);
  }, [initialEvents]);

  useEffect(() => {
    scrollToBottom();
  }, [events, scrollToBottom]);

  async function handleSend() {
    const trimmed = content.trim();
    if (!trimmed || sending) return;
    setSending(true);
    try {
      await addActivityNote(projectId, trimmed);
      setContent("");
      router.refresh();
    } catch {
    } finally {
      setSending(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

 function renderTimeline() {
    const elements: React.ReactNode[] = [];
    let lastDate = "";

    for (let i = 0; i < events.length; i++) {
      const event = events[i];
      const isLast = i === events.length - 1;
      const isNote = event.authorType === "user";

      // date separator
      if (!isSameDay(event.createdAt, lastDate || event.createdAt)) {
        lastDate = event.createdAt;
        elements.push(
          <div key={`date-${event.id}`} className="pb-3 pt-6 text-center">
            <span className="text-[11px] font-medium text-muted-foreground/60">
              {formatDateLabel(event.createdAt)}
            </span>
          </div>,
        );
      }

      const icon = systemIcons[event.type] ?? <Info size={14} />;

      elements.push(
        <div key={event.id} className="flex gap-4">
          {/* Marker column */}
          <div className="flex w-9 shrink-0 flex-col items-center">
            {isNote ? (
              <>
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold text-white ${getAvatarColor(userName)}`}
                >
                  {userName.charAt(0).toUpperCase()}
                </div>
              </>
            ) : (
              <>
                <div className="flex h-9 w-9 items-center justify-center rounded-full border border-hairline bg-(--surface-1) text-muted-foreground">
                  {icon}
                </div>
              </>
            )}
            {!isLast && <div className="w-px flex-1 bg-hairline" />}
          </div>

          {/* Content */}
          <div className="min-w-0 flex-1 pb-6">
            {isNote ? (
              <>
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-semibold text-foreground">
                    {userName}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    {formatTime(event.createdAt)}
                  </span>
                </div>
                <p className="mt-0.5 whitespace-pre-wrap text-[15px] leading-relaxed text-foreground/90">
                  {event.content}
                </p>
              </>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">{event.content}</p>
                <span className="mt-0.5 block text-[11px] text-muted-foreground/40">
                  {formatTime(event.createdAt)}
                </span>
              </>
            )}
          </div>
        </div>,
      );
    }

    return elements;
  }

  return (
    <div className="flex h-full flex-col bg-(--surface-0)">
      <header className="flex items-center gap-3 border-b border-hairline px-6 py-2.5">
        <Link
          href={`/adm/${projectId}`}
          className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft size={12} /> Voltar
        </Link>
        <div className="flex items-center gap-2 text-sm">
          <Hash size={16} className="text-muted-foreground" />
          <span className="font-semibold text-foreground">{projectName}</span>
        </div>
      </header>

      <ScrollArea className="flex-1">
        <div className="mx-auto max-w-2xl px-6 py-3">
          {events.length === 0 ? (
            <div className="mt-16 flex flex-col items-center gap-3 text-center text-muted-foreground">
              <Hash size={40} className="opacity-20" />
              <p className="text-sm">Nenhuma atividade registrada.</p>
              <p className="text-xs text-muted-foreground/60">
                O histórico do briefing aparecerá aqui.
              </p>
            </div>
          ) : (
            renderTimeline()
          )}
        </div>
        <div ref={bottomRef} />
      </ScrollArea>

      <div className="border-t border-hairline px-4 py-4">
        <div className="mx-auto max-w-2xl">
          <div className="flex items-end gap-2 rounded-lg bg-(--surface-1) px-4 py-2 focus-within:ring-1 focus-within:ring-emerald-glow/50">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Nota sobre #${projectName.toLowerCase().replace(/\s+/g, "-")}`}
              className="max-h-[144px] min-h-[44px] flex-1 resize-none bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground/50"
              rows={1}
            />
            <Button
              onClick={handleSend}
              disabled={!content.trim() || sending}
              size="icon"
              className="mb-0.5 shrink-0"
            >
              <Send size={14} />
            </Button>
          </div>
          <p className="mt-1 px-1 text-[11px] text-muted-foreground/40">
            Enter para enviar · Shift+Enter para nova linha
          </p>
        </div>
      </div>
    </div>
  );
}
