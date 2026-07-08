"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createChecklistTemplate, getTemplateItems, addTemplateItem, deleteTemplateItem, getChecklistTemplates } from "@/lib/actions/checklists";
import { ClipboardList, Plus, Trash2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import Link from "next/link";

type Template = { id: string; name: string; description: string | null; createdAt: string };

export function ChecklistTemplatesClient({ initial }: { initial: Template[] }) {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [newItemLabel, setNewItemLabel] = useState("");

  const { data: templates } = useQuery({
    queryKey: ["checklist-templates"],
    queryFn: getChecklistTemplates,
    initialData: initial,
  });

  const { data: expandedItems } = useQuery({
    queryKey: ["template-items", expandedId],
    queryFn: () => getTemplateItems(expandedId!),
    enabled: !!expandedId,
  });

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    await createChecklistTemplate(name.trim(), description.trim() || undefined);
    setName(""); setDescription("");
    setLoading(false);
    setDialogOpen(false);
    queryClient.invalidateQueries({ queryKey: ["checklist-templates"] });
    toast.success("Template criado");
  }

  async function handleAddItem(templateId: string) {
    if (!newItemLabel.trim()) return;
    await addTemplateItem(templateId, newItemLabel.trim());
    setNewItemLabel("");
    queryClient.invalidateQueries({ queryKey: ["template-items", templateId] });
  }

  async function handleDeleteItem(itemId: string) {
    await deleteTemplateItem(itemId);
    queryClient.invalidateQueries({ queryKey: ["template-items", expandedId] });
  }

  return (
    <>
      <header className="flex items-center justify-between border-b border-hairline px-8 py-4">
        <div className="flex items-center gap-3">
          <Link href="/adm" className="inline-flex items-center gap-1.5 rounded-md border border-hairline px-2 py-1 text-[11px] text-muted-foreground hover:text-foreground">
            <ArrowLeft size={12} /> Painel
          </Link>
          <ClipboardList size={16} className="text-emerald-glow" />
          <p className="text-mono text-[11px] uppercase tracking-widest text-muted-foreground">Templates de Checklist</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger>
            <Button size="sm"><Plus size={14} /> Novo template</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar template de checklist</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label>Nome *</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Desenvolvimento Web" />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Descrição</Label>
                <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Template padrão para sites" />
              </div>
              <Button type="submit" disabled={loading || !name.trim()}>
                {loading ? "Criando…" : "Criar template"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </header>

      <section className="px-8 py-6">
        {templates.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <ClipboardList size={32} className="text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">Nenhum template de checklist</p>
            <Button onClick={() => setDialogOpen(true)}><Plus size={14} /> Criar primeiro template</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {templates.map((t) => (
              <Card key={t.id}>
                <CardHeader className="pb-2">
                  <button onClick={() => setExpandedId(expandedId === t.id ? null : t.id)} className="w-full text-left">
                    <CardTitle className="text-base">{t.name}</CardTitle>
                    {t.description && (
                      <p className="text-xs text-muted-foreground mt-1">{t.description}</p>
                    )}
                  </button>
                </CardHeader>
                {expandedId === t.id && (
                  <CardContent>
                    <div className="flex items-center gap-2 mb-3">
                      <Input
                        value={newItemLabel}
                        onChange={(e) => setNewItemLabel(e.target.value)}
                        placeholder="Novo item…"
                        className="flex-1 text-sm"
                        onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddItem(t.id))}
                      />
                      <Button size="sm" onClick={() => handleAddItem(t.id)}><Plus size={12} /></Button>
                    </div>
                    <div className="flex flex-col gap-1">
                      {expandedItems?.map((item) => (
                        <div key={item.id} className="flex items-center gap-2 rounded-md border border-hairline px-2 py-1.5 text-sm">
                          <span className="flex-1">{item.label}</span>
                          <button onClick={() => handleDeleteItem(item.id)} className="text-muted-foreground hover:text-rose-glow">
                            <Trash2 size={12} />
                          </button>
                        </div>
                      ))}
                      {expandedItems?.length === 0 && (
                        <p className="text-xs text-muted-foreground text-center py-2">Nenhum item ainda</p>
                      )}
                    </div>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        )}
      </section>
    </>
  );
}

