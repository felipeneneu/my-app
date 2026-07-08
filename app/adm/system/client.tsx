"use client";

import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import {
  Download, Upload, Database, Shield, AlertTriangle, CheckCircle2,
  XCircle, HardDrive, Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { exportBackup, type SystemHealth, type BackupData } from "@/lib/actions/system";

type EntityType = {
  id: string;
  label: string;
  tables: string[];
};

const ENTITY_TYPES: EntityType[] = [
  { id: "clients", label: "Clientes", tables: ["clients"] },
  { id: "leads", label: "Leads", tables: ["leads"] },
  { id: "projects", label: "Projetos", tables: ["projects", "milestones"] },
  { id: "tasks", label: "Tarefas", tables: ["tasks"] },
  { id: "finances", label: "Finanças", tables: ["fixed_costs", "revenues", "business_expenses"] },
  { id: "hunter", label: "Hunter", tables: ["hunter_status", "daily_quests", "habits"] },
  { id: "checklists", label: "Checklists", tables: ["checklist_templates", "checklist_template_items", "project_checklist_items"] },
  { id: "config", label: "Configurações", tables: ["workspace_config"] },
];

const LAST_EXPORT_KEY = "sprint-os-last-export";

function getStoredLastExport(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(LAST_EXPORT_KEY);
}

function setStoredLastExport(date: string) {
  localStorage.setItem(LAST_EXPORT_KEY, date);
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", {
    dateStyle: "long",
    timeStyle: "short",
  });
}

function exportToFile(data: BackupData, tablesToInclude: string[]) {
  const filtered: BackupData = {
    ...data,
    data: Object.fromEntries(
      Object.entries(data.data).filter(([key]) => tablesToInclude.includes(key))
    ),
  };

  const blob = new Blob([JSON.stringify(filtered, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const dateStr = new Date().toISOString().split("T")[0];
  a.download = `sprint-os-backup-${dateStr}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

const RECORD_LABELS: Record<string, string> = {
  clients: "Clientes",
  leads: "Leads",
  projects: "Projetos",
  tasks: "Tarefas",
  fixed_costs: "Custos Fixos",
  revenues: "Receitas",
  habits: "Hábitos",
  checklist_templates: "Templates",
  workspace_config: "Configurações",
  hunter_status: "Hunter",
  daily_quests: "Missões",
  notifications: "Notificações",
  milestones: "Marcos",
  business_expenses: "Despesas",
  documents: "Documentos",
};

export function SystemClient({ health }: { health: SystemHealth }) {
  const [selectedEntities, setSelectedEntities] = useState<Set<string>>(
    () => new Set(ENTITY_TYPES.map((e) => e.id))
  );
  const [lastExportAt, setLastExportAt] = useState<string | null>(
    getStoredLastExport()
  );
  const [exporting, setExporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExportFull = useCallback(async () => {
    setExporting(true);
    try {
      const data = await exportBackup();
      exportToFile(data, Object.keys(data.data));
      const now = new Date().toISOString();
      setStoredLastExport(now);
      setLastExportAt(now);
      toast.success("Backup completo exportado com sucesso");
    } catch {
      toast.error("Erro ao exportar backup");
    } finally {
      setExporting(false);
    }
  }, []);

  const handleExportSelected = useCallback(async () => {
    const tables = ENTITY_TYPES
      .filter((e) => selectedEntities.has(e.id))
      .flatMap((e) => e.tables);
    if (tables.length === 0) {
      toast.error("Selecione pelo menos um tipo de entidade");
      return;
    }
    setExporting(true);
    try {
      const data = await exportBackup();
      exportToFile(data, tables);
      const now = new Date().toISOString();
      setStoredLastExport(now);
      setLastExportAt(now);
      toast.success("Backup selecionado exportado com sucesso");
    } catch {
      toast.error("Erro ao exportar backup");
    } finally {
      setExporting(false);
    }
  }, [selectedEntities]);

  const toggleEntity = (id: string) => {
    setSelectedEntities((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const statusOnline = health.status === "online";
  const recordEntries = Object.entries(health.recordCounts);

  return (
    <>
      <header className="border-b border-hairline px-8 py-6">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-glow/40 bg-cyan-glow/10 text-cyan-glow">
            <HardDrive size={26} />
          </div>
          <div>
            <p className="text-mono text-[10px] uppercase tracking-widest text-cyan-glow">Sistema · Administrativo</p>
            <h1 className="text-display text-3xl text-foreground">Configurações do Sistema</h1>
          </div>
        </div>
      </header>

      <section className="grid grid-cols-1 gap-6 px-8 py-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-hairline bg-(--surface-1) p-6 lg:col-span-3">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Database size={20} className={statusOnline ? "text-emerald-glow" : "text-rose-glow"} />
              <div>
                <p className="text-mono text-[10px] uppercase tracking-widest text-muted-foreground">Status do Banco de Dados</p>
                <p className="text-display text-xl text-foreground">
                  {statusOnline ? "Online" : "Offline"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {statusOnline ? (
                <CheckCircle2 size={18} className="text-emerald-glow" />
              ) : (
                <XCircle size={18} className="text-rose-glow" />
              )}
              <span className={`text-mono text-[11px] ${statusOnline ? "text-emerald-glow" : "text-rose-glow"}`}>
                {statusOnline ? "Sistema operacional" : "Falha de conexão"}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {recordEntries.map(([key, value]) => (
              <div key={key} className="rounded-xl border border-hairline bg-(--surface-2) p-3">
                <p className="text-mono text-[9px] uppercase tracking-widest text-muted-foreground">
                  {RECORD_LABELS[key] ?? key}
                </p>
                <p className="text-display mt-1 text-2xl text-foreground">{value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-hairline bg-(--surface-1) p-6 lg:col-span-3">
          <div className="mb-6 flex items-center gap-3">
            <Shield size={20} className="text-violet-glow" />
            <div>
              <p className="text-mono text-[10px] uppercase tracking-widest text-violet-glow">Backup & Restore</p>
              <p className="text-display text-xl text-foreground">Exportar Dados</p>
            </div>
          </div>

          <div className="mb-6 flex items-center justify-between rounded-xl border border-hairline bg-(--surface-2) p-4">
            <div className="flex items-center gap-3">
              <Download size={18} className="text-emerald-glow" />
              <div>
                <p className="text-sm font-medium text-foreground">Exportar Backup Completo</p>
                <p className="text-mono text-[10px] text-muted-foreground">
                  Todas as tabelas do banco de dados
                </p>
              </div>
            </div>
            <Button variant="default" onClick={handleExportFull} disabled={exporting}>
              <Download size={14} />
              {exporting ? "Exportando..." : "Exportar Backup Completo"}
            </Button>
          </div>

          <div className="mb-6 rounded-xl border border-hairline bg-(--surface-2) p-4">
            <p className="text-mono mb-3 text-[10px] uppercase tracking-widest text-muted-foreground">
              Exportação Seletiva
            </p>
            <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {ENTITY_TYPES.map((entity) => (
                <div key={entity.id} className="flex items-center gap-2">
                  <Checkbox
                    id={entity.id}
                    checked={selectedEntities.has(entity.id)}
                    onCheckedChange={() => toggleEntity(entity.id)}
                  />
                  <Label htmlFor={entity.id} className="cursor-pointer text-sm text-foreground">
                    {entity.label}
                  </Label>
                </div>
              ))}
            </div>
            <Button
              variant="outline"
              onClick={handleExportSelected}
              disabled={exporting || selectedEntities.size === 0}
            >
              <Download size={14} />
              Exportar Selecionados
            </Button>
          </div>

          {lastExportAt && (
            <div className="flex items-center gap-2 rounded-xl border border-cyan-glow/20 bg-cyan-glow/5 px-4 py-3">
              <Clock size={14} className="text-cyan-glow" />
              <p className="text-mono text-[11px] text-cyan-glow">
                Última exportação: {formatDate(lastExportAt)}
              </p>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-rose-glow/30 bg-rose-glow/5 p-6 lg:col-span-3">
          <div className="mb-4 flex items-center gap-3">
            <AlertTriangle size={20} className="text-rose-glow" />
            <div>
              <p className="text-mono text-[10px] uppercase tracking-widest text-rose-glow">Zona de Perigo</p>
              <p className="text-display text-xl text-foreground">Restaurar Backup</p>
            </div>
          </div>
          <div className="rounded-xl border border-rose-glow/20 bg-(--surface-2) p-4">
            <p className="mb-3 text-sm text-muted-foreground">
              Selecione um arquivo .json de backup para restaurar os dados. Esta ação substituirá todos os dados atuais.
            </p>
            <div className="flex items-center gap-3">
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                className="hidden"
                onChange={() => {
                  toast.info("Funcionalidade em desenvolvimento");
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
              />
              <Button
                variant="destructive"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload size={14} />
                Restaurar Backup
              </Button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
