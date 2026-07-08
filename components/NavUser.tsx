"use client";

import { NotificationsBell } from "@/components/NotificationsBell";

export function NavUser({
  userName,
  userRole,
  userInitials,
}: {
  userName: string;
  userRole: string;
  userInitials: string;
}) {
  return (
    <div className="flex items-center gap-2 border-t border-hairline px-4 py-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-emerald-glow to-violet-glow text-xs font-bold text-(--surface-0)">
        {userInitials}
      </div>
      <div className="min-w-0 flex-1 leading-tight">
        <p className="truncate text-sm text-foreground">{userName}</p>
        <p className="truncate text-[11px] text-muted-foreground">{userRole}</p>
      </div>
      <NotificationsBell />
    </div>
  );
}
