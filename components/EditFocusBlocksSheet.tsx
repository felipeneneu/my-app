"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Clock, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { updateFocusModes, type FocusBlock } from "@/lib/actions/focus-modes";

const defaultBlocks: FocusBlock[] = [
  { id: "deep", label: "Modo Foco Profundo", hours: "09:00 → 13:00", tone: "emerald", start: 540, end: 780 },
  { id: "meet", label: "Reuniões com Clientes", hours: "14:00 → 16:00", tone: "violet", start: 840, end: 960 },
  { id: "design", label: "Sessão de UI/UX Design", hours: "16:30 → 18:30", tone: "emerald", start: 990, end: 1110 },
  { id: "admin", label: "Admin e Faturamento", hours: "18:30 → 19:00", tone: "amber", start: 1110, end: 1140 },
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  blocks: FocusBlock[];
}

const toneMap: Record<string, string> = {
  emerald: "border-emerald-glow/30 bg-emerald-glow/5",
  violet: "border-violet-glow/30 bg-violet-glow/5",
  amber: "border-amber-glow/30 bg-amber-glow/5",
};

export function EditFocusBlocksSheet({ open, onOpenChange, blocks }: Props) {
  const router = useRouter();
  const [editing, setEditing] = useState<FocusBlock[]>(blocks);
  const [saving, setSaving] = useState(false);

  function handleChange(idx: number, field: "label" | "hours", value: string) {
    setEditing((prev) => prev.map((b, i) => (i === idx ? { ...b, [field]: value } : b)));
  }

  function parseHours(hours: string) {
    const [startStr, endStr] = hours.split(" → ").map((s) => s.trim());
    if (!startStr || !endStr) return null;
    const [sh, sm] = startStr.split(":").map(Number);
    const [eh, em] = endStr.split(":").map(Number);
    return { start: sh * 60 + (sm || 0), end: eh * 60 + (em || 0) };
  }

  async function handleSave() {
    const valid = editing.every((b) => {
      const p = parseHours(b.hours);
      return p && p.start < p.end;
    });
    if (!valid) {
      toast.error("Horários inválidos. Use formato HH:MM → HH:MM");
      return;
    }
    setSaving(true);
    const blocksWithParsed = editing.map((b) => {
      const p = parseHours(b.hours);
      return { ...b, start: p!.start, end: p!.end };
    });
    await updateFocusModes(blocksWithParsed);
    setSaving(false);
    onOpenChange(false);
    router.refresh();
    toast.success("Horários atualizados");
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-sm">
        <SheetHeader>
          <SheetTitle>Modos de Foco</SheetTitle>
          <SheetDescription>Edite os horários dos blocos de foco diários.</SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-4 p-4 pt-6">
          {editing.map((block, idx) => (
            <div key={block.id} className={`rounded-xl border p-4 ${toneMap[block.tone] || "border-hairline"}`}>
              <div className="mb-3 flex items-center gap-2">
                <Clock size={14} className="text-muted-foreground" />
                <Label className="text-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  {block.label}
                </Label>
              </div>
              <Input
                value={block.hours}
                onChange={(e) => handleChange(idx, "hours", e.target.value)}
                placeholder="09:00 → 13:00"
                className="border-hairline bg-(--surface-2) text-sm font-mono"
              />
            </div>
          ))}
          <Button onClick={handleSave} disabled={saving} className="mt-2">
            {saving ? "Salvando…" : "Salvar horários"}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setEditing([...defaultBlocks])}
            className="text-muted-foreground"
          >
            <RotateCcw size={12} className="mr-1" /> Restaurar padrão
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
