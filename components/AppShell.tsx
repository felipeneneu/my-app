"use client";

import { useState, useMemo } from "react";
import {
  LayoutDashboard,
  Swords,
  FileSignature,
  CalendarSync,
  Settings,
  Search,
  Filter,
  Hash,
  ChevronDown,
  Dumbbell,
  Wallet,
  Plus,
  FolderOpen,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { NotificationsBell } from "@/components/NotificationsBell";
import { EditWorkspaceSheet } from "@/components/EditWorkspaceSheet";

type Project = {
  id: string;
  name: string;
  status: string;
  clientName?: string;
  price?: number;
};

type WorkspaceConfig = {
  workspaceName: string;
  userName: string;
  userRole: string;
  userInitials: string;
};

const railItems = [
  { icon: LayoutDashboard, label: "Painel", href: "/adm" },
  { icon: Swords, label: "Sistema Hunter", href: "/adm/hunter-system" },
  { icon: FileSignature, label: "Orçamentos", href: "/adm/quotations" },
  { icon: Dumbbell, label: "Evolução", href: "/adm/growth" },
  { icon: Wallet, label: "Financeiro", href: "/adm/financial" },
  { icon: CalendarSync, label: "Agenda", href: "/adm" },
  { icon: FolderOpen, label: "Perfil", href: "/adm/profile" },
  { icon: Settings, label: "Config", href: "/adm" },
];

const filterOptions = ["Todos", "Ativos", "Aguardando fatura", "Atrasados", "Arquivados"];
const statusMap: Record<string, string[]> = {
  Todos: [],
  Ativos: ["active", "prod", "meet"],
  "Aguardando fatura": ["pending_invoice"],
  Atrasados: ["overdue"],
  Arquivados: ["completed", "cancelled", "idle"],
};

function IconRail({ config }: { config: WorkspaceConfig }) {
  const pathname = usePathname();

  return (
    <aside className="flex w-[68px] shrink-0 flex-col items-center gap-2 border-r border-hairline bg-[color:var(--surface-0)] py-4">
      <Link
        href="/adm"
        className="mb-2 flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-glow to-violet-glow text-[color:var(--surface-0)] font-black"
      >
        {config.workspaceName.charAt(0)}
      </Link>
      <div className="h-px w-8 bg-hairline" />
      {railItems.map((it) => {
        const Icon = it.icon;
        const active = pathname === it.href || pathname.startsWith(it.href + "/");
        return (
          <Link
            key={it.label}
            href={it.href}
            title={it.label}
            className={[
              "group relative flex h-11 w-11 items-center justify-center rounded-2xl transition-all",
              active
                ? "bg-[color:var(--surface-2)] text-foreground"
                : "text-muted-foreground hover:bg-[color:var(--surface-2)] hover:text-foreground hover:rounded-xl",
            ].join(" ")}
          >
            {active && <span className="absolute -left-4 h-8 w-1 rounded-r-full bg-emerald-glow" />}
            <Icon size={20} strokeWidth={1.8} />
          </Link>
        );
      })}
      <div className="mt-auto flex h-11 w-11 items-center justify-center rounded-full bg-[color:var(--surface-2)] text-xs font-semibold">
        {config.userInitials}
      </div>
    </aside>
  );
}

function ProjectSidebar({
  projects,
  config,
  onEditWorkspace,
}: {
  projects: Project[];
  config: WorkspaceConfig;
  onEditWorkspace?: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("Todos");

  const filteredProjects = useMemo(() => {
    const statusFilter = statusMap[activeFilter] ?? [];
    return projects.filter((p) => {
      if (statusFilter.length > 0 && !statusFilter.includes(p.status)) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          p.name.toLowerCase().includes(q) ||
          (p.clientName && p.clientName.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [projects, activeFilter, searchQuery]);

  return (
    <aside className="flex w-[268px] shrink-0 flex-col border-r border-hairline bg-(--surface-1) h-full">
      <div className="flex items-center justify-between px-4 pb-3 pt-5">
        <div>
          <p className="text-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            Espaço de trabalho
          </p>
          <button onClick={onEditWorkspace} className="text-left">
            <h2 className="text-[15px] font-semibold text-foreground hover:text-emerald-glow transition-colors">{config.workspaceName}</h2>
          </button>
        </div>
        <ChevronDown size={16} className="text-muted-foreground" />
      </div>

      <div className="mx-3 mb-3 flex items-center gap-2 rounded-lg bg-[color:var(--surface-2)] px-3 py-2 text-sm">
        <Search size={14} className="text-muted-foreground shrink-0" />
        <input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Buscar projetos, clientes…"
          className="flex-1 bg-transparent text-xs text-foreground outline-none placeholder:text-muted-foreground"
        />
        <kbd className="ml-auto text-mono text-[10px] text-muted-foreground/70">⌘K</kbd>
      </div>

      <div className="px-4 pb-2 pt-1">
        <p className="text-mono text-[10px] uppercase tracking-widest text-muted-foreground">Filtros</p>
      </div>
      <div className="flex flex-wrap gap-1.5 px-3 pb-4">
        {filterOptions.map((f) => (
          <button
            key={f}
            onClick={() => setActiveFilter(f)}
            className={[
              "inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] transition-colors",
              activeFilter === f
                ? "bg-emerald-glow/10 text-emerald-glow border-emerald-glow/30"
                : "border-hairline text-muted-foreground hover:text-foreground",
            ].join(" ")}
          >
            <Filter size={10} />
            {f}
          </button>
        ))}
      </div>

      <div className="px-4 pb-2 pt-2">
        <p className="text-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          Projetos {activeFilter !== "Todos" && `· ${activeFilter.toLowerCase()}`}
          <span className="ml-1 text-muted-foreground/60">({filteredProjects.length})</span>
        </p>
      </div>

      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-2 pb-4">
        {filteredProjects.length === 0 ? (
          <div className="flex flex-col items-center gap-3 px-3 py-8 text-center">
            <FolderOpen size={24} className="text-muted-foreground/30" />
            <p className="text-xs text-muted-foreground">
              {searchQuery
                ? "Nenhum projeto encontrado para esta busca"
                : "Nenhum projeto ainda"}
            </p>
            <button onClick={() => router.push("/adm?newProject=1")} className="inline-flex items-center gap-1 rounded-md bg-emerald-glow px-3 py-1.5 text-[11px] font-semibold text-[color:var(--surface-0)] hover:brightness-110">
              <Plus size={12} /> Criar primeiro projeto
            </button>
          </div>
        ) : (
          filteredProjects.map((p) => {
            const href = `/adm/${p.id}`;
            const active = pathname === href || pathname.startsWith(`${href}/`);
            const dot =
              p.status === "active" || p.status === "prod"
                ? "bg-emerald-glow"
                : p.status === "meet"
                  ? "bg-violet-glow"
                  : "bg-muted-foreground/50";
            return (
              <Link
                key={p.id}
                href={href}
                className={[
                  "group flex items-center gap-2 rounded-md px-2 py-1.5 text-left",
                  active ? "bg-[color:var(--surface-2)]" : "hover:bg-[color:var(--surface-2)]",
                ].join(" ")}
              >
                <Hash size={14} className="text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm text-foreground">{p.name}</p>
                  {p.clientName && (
                    <p className="truncate text-[11px] text-muted-foreground">{p.clientName}</p>
                  )}
                </div>
                <span className={`h-2 w-2 rounded-full shrink-0 ${dot}`} />
              </Link>
            );
          })
        )}
      </nav>

      <div className="mt-auto flex items-center gap-2 border-t border-hairline px-4 py-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-emerald-glow to-violet-glow text-xs font-bold text-[color:var(--surface-0)]">
          {config.userInitials}
        </div>
        <div className="flex-1 leading-tight min-w-0">
          <p className="truncate text-sm text-foreground">{config.userName}</p>
          <p className="truncate text-[11px] text-muted-foreground">{config.userRole}</p>
        </div>
        <NotificationsBell />
      </div>
    </aside>
  );
}

export function AppShell({
  children,
  projects,
  config,
}: {
  children: ReactNode;
  projects: Project[];
  config: WorkspaceConfig;
}) {
  const [workspaceEditOpen, setWorkspaceEditOpen] = useState(false);

  return (
    <div className="flex h-screen w-full bg-[color:var(--surface-0)] text-foreground">
      <IconRail config={config} />
      <div className="hidden md:block">
        <ProjectSidebar projects={projects} config={config} onEditWorkspace={() => setWorkspaceEditOpen(true)} />
      </div>
      <main className="flex flex-1 flex-col overflow-y-auto">{children}</main>
      <EditWorkspaceSheet open={workspaceEditOpen} onOpenChange={setWorkspaceEditOpen} config={config} />
    </div>
  );
}