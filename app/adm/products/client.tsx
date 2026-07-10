"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  seedDefaultProducts,
  type Product,
} from "@/lib/actions/products";
import { toast } from "sonner";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Edit3,
  Save,
  X,
  Package,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const CATEGORIES: { value: string; label: string; color: string }[] = [
  { value: "branding", label: "Branding", color: "text-violet-glow" },
  { value: "ui-ux", label: "UI/UX Design", color: "text-sky-glow" },
  { value: "dev", label: "Desenvolvimento", color: "text-emerald-glow" },
  { value: "consulting", label: "Consultoria", color: "text-amber-glow" },
  { value: "other", label: "Outros", color: "text-muted-foreground" },
];

function formatBRL(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2 });
}

export function ProductsClient({
  initialProducts,
  totalCount,
}: {
  initialProducts: Product[];
  totalCount: number;
}) {
  const queryClient = useQueryClient();
  const [filterCategory, setFilterCategory] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [seeding, setSeeding] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    estimatedHours: 0,
    materialCost: 0,
    category: "other",
  });

  const { data: products } = useQuery({
    queryKey: ["products"],
    queryFn: () => getProducts(),
    initialData: initialProducts,
  });

  const filtered = filterCategory === "all"
    ? products
    : products.filter((p) => p.category === filterCategory);

  function openCreate() {
    setEditingId(null);
    setForm({ name: "", description: "", estimatedHours: 0, materialCost: 0, category: "other" });
    setDialogOpen(true);
  }

  function openEdit(p: Product) {
    setEditingId(p.id);
    setForm({
      name: p.name,
      description: p.description ?? "",
      estimatedHours: p.estimatedHours,
      materialCost: p.materialCost,
      category: p.category,
    });
    setDialogOpen(true);
  }

  async function handleSave() {
    if (!form.name.trim()) return;
    if (editingId) {
      await updateProduct(editingId, form);
      toast.success("Produto atualizado");
    } else {
      await createProduct(form);
      toast.success("Produto criado");
    }
    setDialogOpen(false);
    queryClient.invalidateQueries({ queryKey: ["products"] });
  }

  async function handleDelete(id: string, name: string) {
    await deleteProduct(id);
    queryClient.invalidateQueries({ queryKey: ["products"] });
    toast.success(`"${name}" removido`);
  }

  async function handleSeed() {
    setSeeding(true);
    const result = await seedDefaultProducts();
    if (result.seeded) {
      toast.success(`${result.count} produtos padrão carregados!`);
      queryClient.invalidateQueries({ queryKey: ["products"] });
    } else {
      toast.error("Já existem produtos cadastrados. Remova-os primeiro para recarregar.");
    }
    setSeeding(false);
  }

  const categoryLabel = (cat: string) => CATEGORIES.find(c => c.value === cat);

  return (
    <>
      <header className="flex items-center justify-between border-b border-hairline px-8 py-4">
        <div className="flex items-center gap-3">
          <Link
            href="/adm"
            className="inline-flex items-center gap-1.5 rounded-md border border-hairline px-2 py-1 text-[11px] text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft size={12} /> Painel
          </Link>
          <Package size={16} className="text-emerald-glow" />
          <p className="text-mono text-[11px] uppercase tracking-widest text-muted-foreground">
            Produtos
          </p>
        </div>
        <div className="flex items-center gap-2">
          {totalCount === 0 && (
            <Button variant="outline" size="sm" onClick={handleSeed} disabled={seeding}>
              <Sparkles size={14} /> {seeding ? "Carregando..." : "Carregar padrão"}
            </Button>
          )}
          <Button size="sm" onClick={openCreate}>
            <Plus size={14} /> Novo produto
          </Button>
        </div>
      </header>

      <section className="px-8 py-6">
        <div className="mb-4 flex items-center gap-2">
          <Button
            variant={filterCategory === "all" ? "default" : "ghost"}
            size="sm"
            onClick={() => setFilterCategory("all")}
          >
            Todos
          </Button>
          {CATEGORIES.map((cat) => (
            <Button
              key={cat.value}
              variant={filterCategory === cat.value ? "default" : "ghost"}
              size="sm"
              onClick={() => setFilterCategory(cat.value)}
            >
              {cat.label}
            </Button>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p) => {
            const cat = categoryLabel(p.category);
            return (
              <Card key={p.id} className="bg-(--surface-1)">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground truncate">{p.name}</p>
                      {p.description && (
                        <p className="mt-0.5 text-[11px] text-muted-foreground line-clamp-2">{p.description}</p>
                      )}
                    </div>
                    <button
                      onClick={() => handleDelete(p.id, p.name)}
                      className="shrink-0 text-muted-foreground/40 hover:text-rose-glow"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    {cat && <Badge variant="outline" className={`text-[10px] ${cat.color}`}>{cat.label}</Badge>}
                    <span className="text-[11px] text-muted-foreground">{p.estimatedHours}h</span>
                    {p.materialCost > 0 && (
                      <span className="text-[11px] text-muted-foreground">· Custo: {formatBRL(p.materialCost)}</span>
                    )}
                  </div>
                  <button
                    onClick={() => openEdit(p)}
                    className="mt-2 flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground"
                  >
                    <Edit3 size={10} /> Editar
                  </button>
                </CardContent>
              </Card>
            );
          })}
          {filtered.length === 0 && (
            <div className="col-span-full flex flex-col items-center gap-3 py-12 text-center">
              <Package size={32} className="text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">Nenhum produto encontrado</p>
              <Button size="sm" onClick={totalCount === 0 ? handleSeed : openCreate}>
                {totalCount === 0 ? <Sparkles size={14} /> : <Plus size={14} />}
                {totalCount === 0 ? "Carregar produtos padrão" : "Criar primeiro produto"}
              </Button>
            </div>
          )}
        </div>
      </section>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar produto" : "Novo produto"}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label>Nome *</Label>
              <Input value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Ex: Site Institucional" />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Descrição</Label>
              <Textarea value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-2">
                <Label>Horas estimadas</Label>
                <Input type="number" value={form.estimatedHours} onChange={(e) => setForm(f => ({ ...f, estimatedHours: Number(e.target.value) || 0 }))} />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Custo material (R$)</Label>
                <Input type="number" value={form.materialCost} onChange={(e) => setForm(f => ({ ...f, materialCost: Number(e.target.value) || 0 }))} />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Label>Categoria</Label>
              <Select value={form.category} onValueChange={(v) => setForm(f => ({ ...f, category: v ?? "other" }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(c => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleSave} disabled={!form.name.trim()}>
              <Save size={14} /> {editingId ? "Salvar alterações" : "Criar produto"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
