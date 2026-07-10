"use client";

import { useState, useMemo } from "react";
import {
  LayoutDashboard,
  Users,
  Swords,
  Radio,
  FileSignature,
  Calculator,
  FileText,
  Receipt,
  Dumbbell,
  Wallet,
  CalendarSync,
  ClipboardList,
  FolderOpen,
  Building2,
  Shield,
  Search,
  Filter,
  Hash,
  ChevronDown,
  Plus,
  Trash2,
  MessageSquare,
  ExternalLink,
  Package,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { EditWorkspaceSheet } from "@/components/EditWorkspaceSheet";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { NavUser } from "@/components/NavUser";
import { deleteProject } from "@/lib/actions/projects";
import { Kbd } from "@/components/ui/kbd";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
} from "@/components/ui/context-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";

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

const navGroups: { label: string; items: { icon: typeof LayoutDashboard; label: string; href: string }[] }[] = [
  {
    label: "Gestão",
    items: [
      { icon: LayoutDashboard, label: "Painel", href: "/adm" },
      { icon: Users, label: "Clientes", href: "/adm/clients" },
    ],
  },
  {
    label: "Prospecção",
    items: [
      { icon: Swords, label: "Hunter", href: "/adm/hunter-system" },
      { icon: Radio, label: "Pipeline", href: "/adm/pipeline" },
    ],
  },
  {
    label: "Comercial",
    items: [
      { icon: Calculator, label: "Orçamento", href: "/adm/budget" },
      { icon: Package, label: "Produtos", href: "/adm/products" },
      { icon: FileText, label: "Contrato", href: "/adm/contract" },
      { icon: Receipt, label: "Recibo", href: "/adm/receipt" },
    ],
  },
  {
    label: "Desenvolvimento",
    items: [
      { icon: MessageSquare, label: "Briefing", href: "/adm/project" },
      { icon: ExternalLink, label: "Portal Cliente", href: "/track" },
    ],
  },
  {
    label: "Pessoal",
    items: [
      { icon: Dumbbell, label: "Evolução", href: "/adm/growth" },
      { icon: CalendarSync, label: "Agenda", href: "/adm/calendar" },
      { icon: ClipboardList, label: "Checklists", href: "/adm/checklist-templates" },
    ],
  },
  {
    label: "Sistema",
    items: [
      { icon: Building2, label: "Empresa", href: "/adm/company" },
      { icon: FolderOpen, label: "Perfil", href: "/adm/profile" },
      { icon: Shield, label: "Sistema", href: "/adm/system" },
    ],
  },
];

const allRailItems = navGroups.flatMap((g) => g.items);

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
  const router = useRouter();

  const groupIcon = (groupLabel: string) => {
    switch (groupLabel) {
      case "Gestão": return LayoutDashboard;
      case "Prospecção": return Swords;
      case "Comercial": return FileSignature;
      case "Desenvolvimento": return MessageSquare;
      case "Pessoal": return Dumbbell;
      case "Sistema": return Shield;
      default: return LayoutDashboard;
    }
  };

  return (
    <TooltipProvider>
      <aside className="flex w-[68px] shrink-0 flex-col items-center gap-2 border-r border-hairline bg-(--surface-0) py-4">
        <Link
          href="/adm"
          className="mb-2 flex h-11 w-11 items-center justify-center rounded-2xl bg-linear-to-br from-emerald-glow to-violet-glow text-(--surface-0) font-black"
        >
          {config.workspaceName.charAt(0)}
        </Link>
        <div className="h-px w-8 bg-hairline" />

        {allRailItems.map((it) => {
          const Icon = it.icon;
          const active = pathname === it.href || pathname.startsWith(it.href + "/");
          const group = navGroups.find((g) => g.items.includes(it));
          const groupItems = group?.items ?? [];

          const iconEl = (
            <Link
              href={it.href}
              title={it.label}
              className={[
                "group relative flex h-11 w-11 items-center justify-center rounded-2xl transition-all",
                active
                  ? "bg-(--surface-2) text-foreground"
                  : "text-muted-foreground hover:bg-(--surface-2) hover:text-foreground hover:rounded-xl",
              ].join(" ")}
            >
              {active && <span className="absolute -left-4 h-8 w-1 rounded-r-full bg-emerald-glow" />}
              <Icon size={20} strokeWidth={1.8} />
            </Link>
          );

          if (!group || groupItems.length <= 1) {
            return (
              <Tooltip key={it.label}>
                <TooltipTrigger>{iconEl}</TooltipTrigger>
                <TooltipContent side="right">{it.label}</TooltipContent>
              </Tooltip>
            );
          }

          return (
            <ContextMenu key={it.label}>
              <ContextMenuTrigger>
                <Tooltip>
                  <TooltipTrigger>{iconEl}</TooltipTrigger>
                  <TooltipContent side="right">{it.label}</TooltipContent>
                </Tooltip>
              </ContextMenuTrigger>
              <ContextMenuContent className="w-48">
                <p className="px-2 py-1 text-[10px] uppercase tracking-widest text-muted-foreground">
                  {group.label}
                </p>
                <ContextMenuSeparator />
                {groupItems.map((gi) => {
                  const Gi = gi.icon;
                  const giActive = pathname === gi.href || pathname.startsWith(gi.href + "/");
                  return (
                    <ContextMenuItem key={gi.label} onClick={() => router.push(gi.href)}>
                      <span className={`flex items-center gap-2 ${giActive ? "text-emerald-glow" : ""}`}>
                        <Gi size={14} /> {gi.label}
                      </span>
                    </ContextMenuItem>
                  );
                })}
              </ContextMenuContent>
            </ContextMenu>
          );
        })}

        <div className="mt-auto flex h-11 w-11 items-center justify-center rounded-full bg-(--surface-2) text-xs font-semibold">
          {config.userInitials}
        </div>
      </aside>
    </TooltipProvider>
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

      <div className="mx-3 mb-3 flex items-center gap-2 rounded-lg bg-(--surface-2) px-3 py-2 text-sm">
        <Search size={14} className="text-muted-foreground shrink-0" />
        <input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Buscar projetos, clientes…"
          className="flex-1 bg-transparent text-xs text-foreground outline-none placeholder:text-muted-foreground"
        />
        <Kbd className="ml-auto">⌘K</Kbd>
      </div>

      <div className="px-4 pb-2 pt-1">
        <p className="text-mono text-[10px] uppercase tracking-widest text-muted-foreground">Filtros</p>
      </div>
      <div className="flex flex-wrap gap-1.5 px-3 pb-4">
        {filterOptions.map((f) => (
          <Badge
            key={f}
            variant={activeFilter === f ? "default" : "outline"}
            className="cursor-pointer text-[11px]"
            onClick={() => setActiveFilter(f)}
          >
            <Filter size={10} className="mr-1" />
            {f}
          </Badge>
        ))}
      </div>

      <div className="px-4 pb-2 pt-2">
        <p className="text-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          Projetos {activeFilter !== "Todos" && `· ${activeFilter.toLowerCase()}`}
          <span className="ml-1 text-muted-foreground/60">({filteredProjects.length})</span>
        </p>
      </div>

      <ScrollArea className="flex-1 px-2">
        <div className="flex flex-col gap-0.5 pb-4">
          {filteredProjects.length === 0 ? (
            <div className="flex flex-col items-center gap-3 px-3 py-8 text-center">
              <FolderOpen size={24} className="text-muted-foreground/30" />
              <p className="text-xs text-muted-foreground">
                {searchQuery
                  ? "Nenhum projeto encontrado para esta busca"
                  : "Nenhum projeto ainda"}
              </p>
              <button onClick={() => router.push("/adm?newProject=1")} className="inline-flex items-center gap-1 rounded-md bg-emerald-glow px-3 py-1.5 text-[11px] font-semibold text-(--surface-0) hover:brightness-110">
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
                <div key={p.id} className={["group flex items-center gap-2 rounded-md px-2 py-1.5", active ? "bg-(--surface-2)" : "hover:bg-(--surface-2)"].join(" ")}>
                  <Link href={href} className="flex flex-1 items-center gap-2 min-w-0">
                    <Hash size={14} className="text-muted-foreground shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm text-foreground">{p.name}</p>
                      {p.clientName && (
                        <p className="truncate text-[11px] text-muted-foreground">{p.clientName}</p>
                      )}
                    </div>
                    <span className={`h-2 w-2 rounded-full shrink-0 ${dot}`} />
                  </Link>
                  <ConfirmDialog
                    title="Deletar projeto"
                    description={`Remover "${p.name}" permanentemente? Esta ação não pode ser desfeita.`}
                    confirmLabel="Deletar"
                    onConfirm={async () => {
                      await deleteProject(p.id);
                      router.refresh();
                      toast.success("Projeto removido");
                    }}
                  >
                    <span
                      className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-rose-glow transition-opacity cursor-pointer"
                      title="Deletar projeto"
                    >
                      <Trash2 size={12} />
                    </span>
                  </ConfirmDialog>
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>

      <NavUser userName={config.userName} userRole={config.userRole} userInitials={config.userInitials} />
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
    <div className="flex h-screen w-full bg-(--surface-0) text-foreground">
      <IconRail config={config} />
      <div className="hidden md:block">
        <ProjectSidebar projects={projects} config={config} onEditWorkspace={() => setWorkspaceEditOpen(true)} />
      </div>
      <main className="flex flex-1 flex-col overflow-y-auto">{children}</main>
      <EditWorkspaceSheet open={workspaceEditOpen} onOpenChange={setWorkspaceEditOpen} config={config} />
    </div>
  );
}
