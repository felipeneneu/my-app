"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowLeft, Globe, Plus, Trash2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createDeliverable, deleteDeliverable, updateDeliverable } from "@/lib/actions/deliverables";

type Deliverable = {
  id: string;
  name: string;
  url: string | null;
  status: "online" | "inactive" | "maintenance";
  type: string;
  deliveryDate: string | null;
  note: string | null;
};

const STATUS_META: Record<string, { label: string; color: string }> = {
  online: { label: "Online", color: "bg-emerald-100 text-emerald-800" },
  inactive: { label: "Inativo", color: "bg-gray-100 text-gray-800" },
  maintenance: { label: "Manutenção", color: "bg-amber-100 text-amber-800" },
};

export function DeliverablesClient({ initialItems }: { initialItems: Deliverable[] }) {
  const [items, setItems] = useState<Deliverable[]>(initialItems);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [type, setType] = useState("site");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const handleCreate = useCallback(async () => {
    if (!name.trim()) {
      toast.error("Nome é obrigatório");
      return;
    }

    setSaving(true);
    try {
      const result = await createDeliverable({
        name: name.trim(),
        url: url.trim() || undefined,
        type,
        deliveryDate: deliveryDate || undefined,
        note: note.trim() || undefined,
      });

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      setItems(prev => [...prev, result.data]);
      setShowForm(false);
      setName("");
      setUrl("");
      setType("site");
      setDeliveryDate("");
      setNote("");
      toast.success("Entrega adicionada!");
    } catch {
      toast.error("Erro ao adicionar");
    } finally {
      setSaving(false);
    }
  }, [name, url, type, deliveryDate, note]);

  const handleDelete = useCallback(async (id: string) => {
    const result = await deleteDeliverable(id);
    if (result.success) {
      setItems(prev => prev.filter(i => i.id !== id));
      toast.success("Entrega removida");
    }
  }, []);

  const handleToggleStatus = useCallback(async (item: Deliverable) => {
    const nextStatus = item.status === "online" ? "maintenance" : item.status === "maintenance" ? "inactive" : "online";
    const result = await updateDeliverable(item.id, { status: nextStatus });
    if (result.success) {
      setItems(prev => prev.map(i => i.id === item.id ? { ...i, status: nextStatus } : i));
    }
  }, []);

  return (
    <>
      <header className="flex items-center justify-between border-b border-hairline px-8 py-4">
        <div className="flex items-center gap-3">
          <Link href="/adm" className="inline-flex items-center gap-1.5 rounded-md border border-hairline px-2 py-1 text-[11px] text-muted-foreground hover:text-foreground">
            <ArrowLeft size={12} /> Painel
          </Link>
          <Globe size={16} className="text-cyan-500" />
          <p className="text-mono text-[11px] uppercase tracking-widest text-muted-foreground">Portfólio de Entregas</p>
        </div>
        <Button size="sm" onClick={() => setShowForm(true)}>
          <Plus size={14} /> Nova Entrega
        </Button>
      </header>

      <section className="px-8 py-6">
        {showForm && (
          <Card className="mb-6">
            <CardContent className="p-5">
              <h3 className="mb-4 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Nova Entrega</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="mb-1 block text-[10px] font-semibold text-muted-foreground">Nome *</label>
                  <input value={name} onChange={e => setName(e.target.value)}
                    className="w-full rounded border border-hairline bg-transparent px-2.5 py-1.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-cyan-500/30" />
                </div>
                <div>
                  <label className="mb-1 block text-[10px] font-semibold text-muted-foreground">URL</label>
                  <input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://..."
                    className="w-full rounded border border-hairline bg-transparent px-2.5 py-1.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-cyan-500/30" />
                </div>
                <div>
                  <label className="mb-1 block text-[10px] font-semibold text-muted-foreground">Tipo</label>
                  <select value={type} onChange={e => setType(e.target.value)}
                    className="w-full rounded border border-hairline bg-transparent px-2.5 py-1.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-cyan-500/30">
                    <option value="site">Site</option>
                    <option value="app">App</option>
                    <option value="landing">Landing Page</option>
                    <option value="logo">Logo</option>
                    <option value="branding">Branding</option>
                    <option value="other">Outro</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-[10px] font-semibold text-muted-foreground">Data de Entrega</label>
                  <input type="date" value={deliveryDate} onChange={e => setDeliveryDate(e.target.value)}
                    className="w-full rounded border border-hairline bg-transparent px-2.5 py-1.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-cyan-500/30" />
                </div>
                <div>
                  <label className="mb-1 block text-[10px] font-semibold text-muted-foreground">Observação</label>
                  <input value={note} onChange={e => setNote(e.target.value)}
                    className="w-full rounded border border-hairline bg-transparent px-2.5 py-1.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-cyan-500/30" />
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <Button size="sm" onClick={handleCreate} disabled={saving}>
                  {saving ? "Salvando…" : "Salvar"}
                </Button>
                <Button size="sm" variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {items.length === 0 && !showForm && (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <Globe size={32} className="text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">Nenhuma entrega cadastrada</p>
            <p className="text-xs text-muted-foreground/60">Adicione sites, apps e projetos finalizados ao seu portfólio.</p>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {items.map(item => {
            const meta = STATUS_META[item.status] ?? STATUS_META.inactive;
            return (
              <Card key={item.id}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-foreground">{item.name}</p>
                      <p className="text-[10px] text-muted-foreground">{item.type}</p>
                    </div>
                    <button onClick={() => handleToggleStatus(item)}>
                      <Badge className={`ml-2 ${meta.color}`}>{meta.label}</Badge>
                    </button>
                  </div>
                  {item.url && (
                    <a href={item.url} target="_blank" rel="noopener noreferrer"
                      className="mt-2 inline-flex items-center gap-1 text-[10px] text-cyan-600 hover:text-cyan-700">
                      <ExternalLink size={10} /> {item.url.replace(/^https?:\/\//, "").slice(0, 30)}
                    </a>
                  )}
                  {item.deliveryDate && (
                    <p className="mt-2 text-[10px] text-muted-foreground">
                      Entregue em: {new Date(item.deliveryDate).toLocaleDateString("pt-BR")}
                    </p>
                  )}
                  {item.note && (
                    <p className="mt-1 text-[10px] text-muted-foreground/60 line-clamp-2">{item.note}</p>
                  )}
                  <div className="mt-3 flex justify-end">
                    <button onClick={() => handleDelete(item.id)}
                      className="text-[10px] text-muted-foreground hover:text-red-500">
                      <Trash2 size={12} />
                    </button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>
    </>
  );
}
