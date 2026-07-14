"use server";

import { db } from "@/db";
import { workspaceConfig } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export type FocusBlock = {
  id: string;
  label: string;
  hours: string;
  tone: "emerald" | "violet" | "amber";
  start: number;
  end: number;
};

export type FocusToggle = Record<string, boolean>;

const defaultBlocks: FocusBlock[] = [
  { id: "deep", label: "Modo Foco Profundo", hours: "09:00 → 13:00", tone: "emerald", start: 540, end: 780 },
  { id: "meet", label: "Reuniões com Clientes", hours: "14:00 → 16:00", tone: "violet", start: 840, end: 960 },
  { id: "design", label: "Sessão de UI/UX Design", hours: "16:30 → 18:30", tone: "emerald", start: 990, end: 1110 },
  { id: "admin", label: "Admin e Faturamento", hours: "18:30 → 19:00", tone: "amber", start: 1110, end: 1140 },
];

export async function getFocusModes(): Promise<{ blocks: FocusBlock[]; toggles: FocusToggle }> {
  const config = await db.select().from(workspaceConfig).limit(1).then((r) => r[0]);
  let blocks: FocusBlock[] = [...defaultBlocks];
  let toggles: FocusToggle = { deep: true, meet: false, design: true, admin: false };

  if (config?.focusBlocks) {
    try {
      const parsed = JSON.parse(config.focusBlocks);
      if (Array.isArray(parsed) && parsed.length > 0) {
        blocks = parsed.map((b: any) => ({
          id: b.id,
          label: b.label,
          hours: b.hours,
          tone: b.tone as "emerald" | "violet" | "amber",
          start: b.start,
          end: b.end,
        }));
      }
    } catch {}
  }

  return { blocks, toggles };
}

export async function updateFocusModes(blocks: FocusBlock[]) {
  const existing = await db.select().from(workspaceConfig).limit(1);
  const value = { focusBlocks: JSON.stringify(blocks) };
  if (existing.length > 0) {
    await db.update(workspaceConfig).set(value).where(eq(workspaceConfig.id, existing[0].id));
  } else {
    await db.insert(workspaceConfig).values(value as any);
  }
  revalidatePath("/adm");
}
