"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import {
  ArrowLeft, User, Mail, Phone, Building2, ExternalLink,
  Plus, Calculator, Save, StickyNote, Trash2, Edit3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { updateClient, deleteClient, type Client } from "@/lib/actions/clients";

type Project = {
  id: string;
  name: string;
  status: string;
  price: number;
  startDate: string;
};

type BudgetItem = {
  id: string;
  contentJson: string;
};

export function ClientDetailClient({
  client: initial,
  projects,
  budgets,
}: {
  client: Client;
  projects: Project[];
  budgets: BudgetItem[];
}) {
  const router = useRouter();
  const [client, setClient] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: client.name,
    email: client.email ?? "",
    phone: client.phone ?? "",
    document: client.document ?? "",
    notes: client.notes ?? "",
  });

  const parsedBudgets = budgets.map(b => {
    try { return { id: b.id, ...JSON.parse(b.contentJson) }; }
    catch { return { id: b.id, clientName: "—", totalPrice: 0, status: "pending", createdAt: "" }; }
  });

  const statusColor: Record<string, string> = {
    active: "bg-emerald-glow",
    paused: "bg-amber-glow",
    completed: "bg-sky-glow",
    cancelled: "bg-muted-foreground/50",
  };

  async function handleSave() {
    if (!form.name.trim()) return;
    setSaving(true);
    await updateClient(client.id, form);
    setClient(prev => ({ ...prev, ...form }));
    setSaving(false);
    setEditing(false);
    toast.success("Cliente atualizado");
  }

  async function handleDelete() {
    await deleteClient(client.id);
    toast.success("Cliente removido");
    router.push("/adm/clients");
  }

  return (
    <>
      <header className="flex items-center justify-between border-b border-hairline px-8 py-4">
        <div className="flex items-center gap-3">
          <Link href="/adm/clients" className="inline-flex items-center gap-1.5 rounded-md border border-hairline px-2 py-1 text-[11px] text-muted-foreground hover:text-foreground">
            <ArrowLeft size={12} /> Clientes
          </Link>
          <User size={16} className="text-emerald-glow" />
          <p className="text-mono text-[11px] uppercase tracking-widest text-muted-foreground">
            {client.name}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setEditing(!editing)}>
            <Edit3 size={14} /> {editing ? "Cancelar" : "Editar"}
          </Button>
          <Link href={`/adm/budget/new?clientId=${client.id}`}>
            <Button size="sm"><Plus size={14} /> Novo Orçamento</Button>
          </Link>
        </div>
      </header>

      <section className="grid grid-cols-1 gap-6 px-8 py-6 xl:grid-cols-3">
        <div className="flex flex-col gap-6 xl:col-span-2">
          <Card>
            <CardHeader>
              <p className="text-mono text-[10px] uppercase tracking-widest text-muted-foreground">Dados do cliente</p>
              <CardTitle className="text-display text-xl">Informações</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {editing ? (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <Label className="text-mono text-[10px] uppercase tracking-widest text-muted-foreground">Nome</Label>
                      <Input value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label className="text-mono text-[10px] uppercase tracking-widest text-muted-foreground">Email</Label>
                      <Input value={form.email} onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <Label className="text-mono text-[10px] uppercase tracking-widest text-muted-foreground">Telefone</Label>
                      <Input value={form.phone} onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))} />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label className="text-mono text-[10px] uppercase tracking-widest text-muted-foreground">CPF / CNPJ</Label>
                      <Input value={form.document} onChange={(e) => setForm(f => ({ ...f, document: e.target.value }))} />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-mono text-[10px] uppercase tracking-widest text-muted-foreground">Observações</Label>
                    <Textarea value={form.notes} onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))} rows={3} />
                  </div>
                  <div className="flex items-center gap-2">
                    <Button onClick={handleSave} disabled={saving || !form.name.trim()}>
                      <Save size={14} /> {saving ? "Salvando…" : "Salvar alterações"}
                    </Button>
                    <Button variant="outline" onClick={() => {
                      setEditing(false);
                      setForm({ name: client.name, email: client.email ?? "", phone: client.phone ?? "", document: client.document ?? "", notes: client.notes ?? "" });
                    }}>
                      Cancelar
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-mono text-[10px] uppercase tracking-widest text-muted-foreground">Nome</p>
                      <p className="text-sm text-foreground mt-0.5">{client.name}</p>
                    </div>
                    <div>
                      <p className="text-mono text-[10px] uppercase tracking-widest text-muted-foreground">Email</p>
                      <p className="text-sm text-foreground mt-0.5">{client.email || "—"}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-mono text-[10px] uppercase tracking-widest text-muted-foreground">Telefone</p>
                      <p className="text-sm text-foreground mt-0.5">{client.phone || "—"}</p>
                    </div>
                    <div>
                      <p className="text-mono text-[10px] uppercase tracking-widest text-muted-foreground">CPF / CNPJ</p>
                      <p className="text-sm text-foreground mt-0.5">{client.document || "—"}</p>
                    </div>
                  </div>
                  {client.notes && (
                    <div>
                      <p className="text-mono text-[10px] uppercase tracking-widest text-muted-foreground">Observações</p>
                      <p className="text-sm text-muted-foreground mt-0.5 whitespace-pre-wrap">{client.notes}</p>
                    </div>
                  )}
                  <div className="flex items-center gap-3">
                    <p className="text-[11px] text-muted-foreground">Cadastrado em {new Date(client.createdAt).toLocaleDateString("pt-BR")}</p>
                    <span className="text-muted-foreground/30">·</span>
                    <button onClick={handleDelete} className="text-[11px] text-rose-glow/70 hover:text-rose-glow transition-colors">
                      Remover cliente
                    </button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <p className="text-mono text-[10px] uppercase tracking-widest text-muted-foreground">Projetos vinculados</p>
              <CardTitle className="text-display text-xl">Projetos</CardTitle>
            </CardHeader>
            <CardContent>
              {projects.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">Nenhum projeto vinculado a este cliente.</p>
              ) : (
                <div className="flex flex-col divide-y divide-hairline">
                  {projects.map((p) => (
                    <Link key={p.id} href={`/adm/${p.id}`} className="flex items-center gap-3 py-3 group hover:bg-(--surface-2) -mx-4 px-4 rounded-lg transition-colors">
                      <span className={`h-2 w-2 shrink-0 rounded-full ${statusColor[p.status] || "bg-muted-foreground/50"}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{p.name}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {p.startDate} · {p.price.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2 })}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-[10px]">{p.status}</Badge>
                      <ExternalLink size={12} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <p className="text-mono text-[10px] uppercase tracking-widest text-muted-foreground">Orçamentos</p>
              <CardTitle className="text-display text-xl">Orçamentos</CardTitle>
            </CardHeader>
            <CardContent>
              {parsedBudgets.length === 0 ? (
                <div className="flex flex-col items-center gap-3 py-6 text-center">
                  <Calculator size={24} className="text-muted-foreground/30" />
                  <p className="text-sm text-muted-foreground">Nenhum orçamento para este cliente</p>
                  <Link href={`/adm/budget/new?clientId=${client.id}`}>
                    <Button size="sm"><Plus size={14} /> Criar orçamento</Button>
                  </Link>
                </div>
              ) : (
                <div className="flex flex-col divide-y divide-hairline">
                  {parsedBudgets.map((b: any) => (
                    <Link key={b.id} href={`/adm/budget/${b.id}`} className="flex items-center gap-3 py-3 group hover:bg-(--surface-2) -mx-4 px-4 rounded-lg transition-colors">
                      <Calculator size={14} className="shrink-0 text-muted-foreground" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{b.clientName || "Orçamento"}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {b.createdAt ? new Date(b.createdAt).toLocaleDateString("pt-BR") : "—"}
                        </p>
                      </div>
                      <p className="text-sm font-semibold text-emerald-glow">
                        {b.totalPrice?.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2 }) ?? "—"}
                      </p>
                      <Badge variant={b.status === "approved" ? "default" : "secondary"} className={b.status === "approved" ? "bg-emerald-600 text-white text-[10px]" : "bg-amber-600 text-white text-[10px]"}>
                        {b.status === "approved" ? "Aprovado" : "Pendente"}
                      </Badge>
                      <ExternalLink size={12} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <p className="text-mono text-[10px] uppercase tracking-widest text-muted-foreground">Histórico</p>
              <CardTitle className="text-display text-xl">Contatos & Notas</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground text-center py-8">
                Em breve: histórico de contatos e notas registradas.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
    </>
  );
}
