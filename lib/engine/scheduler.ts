type FocusBlock = {
  id: string;
  label: string;
  startHour: number;
  endHour: number;
  icon: string;
  tone: "emerald" | "violet" | "amber";
};

const focusBlocks: FocusBlock[] = [
  { id: "deep", label: "Foco Profundo", startHour: 9, endHour: 13, icon: "Code2", tone: "emerald" },
  { id: "meet", label: "Reuniões com Clientes", startHour: 14, endHour: 16, icon: "Video", tone: "violet" },
  { id: "design", label: "UI/UX Design", startHour: 16.5, endHour: 18.5, icon: "Palette", tone: "emerald" },
  { id: "admin", label: "Admin e Faturamento", startHour: 18.5, endHour: 19, icon: "Briefcase", tone: "amber" },
];

export function getCurrentBlock() {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  for (const block of focusBlocks) {
    const startMinutes = block.startHour * 60;
    const endMinutes = block.endHour * 60;
    if (currentMinutes >= startMinutes && currentMinutes < endMinutes) {
      const remainingMs = (endMinutes - currentMinutes) * 60 * 1000;
      return { ...block, remainingMs, isActive: true };
    }
  }
  return null;
}

export function getNextBlock() {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const future = focusBlocks
    .map((b) => ({ ...b, startMinutes: b.startHour * 60 }))
    .filter((b) => b.startMinutes > currentMinutes)
    .sort((a, b) => a.startMinutes - b.startMinutes);

  if (future.length > 0) {
    const next = future[0];
    const msUntil = (next.startMinutes - currentMinutes) * 60 * 1000;
    const hours = Math.floor(msUntil / 3600000);
    const minutes = Math.floor((msUntil % 3600000) / 60000);
    return { ...next, msUntil, hoursUntil: hours, minutesUntil: minutes };
  }
  return null;
}

export function getBlocksForDay(activeIds: string[]) {
  return focusBlocks.map((b) => ({
    ...b,
    active: activeIds.includes(b.id),
  }));
}

export function formatCountdown(ms: number) {
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  return `${String(h).padStart(2, "0")}h ${String(m).padStart(2, "0")}m`;
}