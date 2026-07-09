"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Hash, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { addBriefingNote } from "@/lib/actions/briefing";

type Note = { id: string; content: string; createdAt: string; authorName?: string };

function formatTime(iso: string) {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (d.toDateString() === today.toDateString()) return "Hoje";
  if (d.toDateString() === yesterday.toDateString()) return "Ontem";

  return d.toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" });
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

export function BriefingClient({
  projectId,
  projectName,
  initialNotes,
  userName,
}: {
  projectId: string;
  projectName: string;
  initialNotes: Note[];
  userName: string;
}) {
  const router = useRouter();
  const [notes, setNotes] = useState<Note[]>(initialNotes);
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    setNotes(initialNotes);
  }, [initialNotes]);

  useEffect(() => {
    scrollToBottom();
  }, [notes, scrollToBottom]);

  async function handleSend() {
    const trimmed = content.trim();
    if (!trimmed || sending) return;
    setSending(true);
    try {
      await addBriefingNote(projectId, trimmed);
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

  const getAvatarColor = (authorName: string) => {
    let hash = 0;
    for (let i = 0; i < authorName.length; i++) {
      hash = authorName.charCodeAt(i) + ((hash << 5) - hash);
    }
    return avatarColors[Math.abs(hash) % avatarColors.length];
  };

  function renderMessages() {
    const elements: React.ReactNode[] = [];
    let lastDate = "";

    for (let i = 0; i < notes.length; i++) {
      const note = notes[i];
      const noteDate = formatDate(note.createdAt);
      const author = note.authorName || userName;

      if (!isSameDay(note.createdAt, lastDate || note.createdAt)) {
        lastDate = note.createdAt;
        elements.push(
          <div key={`divider-${note.id}`} className="flex items-center gap-3 py-4">
            <div className="h-px flex-1 bg-hairline" />
            <span className="text-[11px] font-medium text-muted-foreground">{noteDate}</span>
            <div className="h-px flex-1 bg-hairline" />
          </div>,
        );
      }

      const avatarColor = getAvatarColor(author);
      elements.push(
        <div key={note.id} className="group flex items-start gap-3 px-4 pt-2 hover:bg-(--surface-1/50)">
          <div
            className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${avatarColor}`}
          >
            {author.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline gap-2">
              <span className="text-sm font-semibold text-foreground hover:underline cursor-pointer">
                {author}
              </span>
              <span className="text-[10px] text-muted-foreground">{formatTime(note.createdAt)}</span>
            </div>
            <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-foreground/90">
              {note.content}
            </p>
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
        <div className="py-2">
          {notes.length === 0 ? (
            <div className="mt-16 flex flex-col items-center gap-3 text-center text-muted-foreground">
              <Hash size={40} className="opacity-20" />
              <p className="text-sm">Nenhuma mensagem ainda.</p>
              <p className="text-xs text-muted-foreground/60">
                Início do histórico de briefing do projeto.
              </p>
            </div>
          ) : (
            renderMessages()
          )}
        </div>
        <div ref={bottomRef} />
      </ScrollArea>

      <div className="border-t border-hairline px-4 py-4">
        <div className="mx-auto max-w-3xl">
          <div className="flex items-end gap-2 rounded-lg bg-(--surface-1) px-4 py-2 focus-within:ring-1 focus-within:ring-emerald-glow/50">
            <textarea
              ref={inputRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Mensagem para #${projectName.toLowerCase().replace(/\s+/g, "-")}`}
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
