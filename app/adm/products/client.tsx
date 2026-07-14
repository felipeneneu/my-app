"use client";

import { useState, useMemo, useCallback } from "react";
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
  ArrowLeft, Plus, Trash2, Edit3, Save, X, Package, Sparkles,
  Search, ChevronDown, ChevronUp,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  Columns3,
} from "lucide-react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  createColumnHelper,
  type SortingState,
  type ColumnFiltersState,
  type VisibilityState,
  type RowSelectionState,
} from "@tanstack/react-table";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";

const CATEGORIES: { value: string; label: string; color: string }[] = [
  { value: "branding", label: "Branding", color: "text-violet-glow" },
  { value: "ui-ux", label: "UI/UX Design", color: "text-sky-glow" },
  { value: "dev", label: "Desenvolvimento", color: "text-emerald-glow" },
  { value: "consulting", label: "Consultoria", color: "text-amber-glow" },
  { value: "other", label: "Outros", color: "text-muted-foreground" },
];

const CATEGORY_MAP = Object.fromEntries(CATEGORIES.map((c) => [c.value, c]));

function formatBRL(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2 });
}

const columnHelper = createColumnHelper<Product>();

export function ProductsClient({
  initialProducts,
  totalCount,
}: {
  initialProducts: Product[];
  totalCount: number;
}) {
  const queryClient = useQueryClient();
  const [sorting, setSorting] = useState<SortingState>([{ id: "name", desc: false }]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });

  const categoryFilter = columnFilters.find((f) => f.id === "category");
  const activeCategory = (categoryFilter?.value as string) ?? "all";

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

  const openCreate = useCallback(() => {
    setEditingId(null);
    setForm({ name: "", description: "", estimatedHours: 0, materialCost: 0, category: "other" });
    setDialogOpen(true);
  }, []);

  const openEdit = useCallback((p: Product) => {
    setEditingId(p.id);
    setForm({
      name: p.name,
      description: p.description ?? "",
      estimatedHours: p.estimatedHours,
      materialCost: p.materialCost,
      category: p.category,
    });
    setDialogOpen(true);
  }, []);

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

  const columns = useMemo(
    () => [
      columnHelper.display({
        id: "select",
        header: ({ table }) => (
          <Checkbox
            checked={table.getIsAllRowsSelected()}
            onCheckedChange={(val) => table.toggleAllRowsSelected(!!val)}
            aria-label="Selecionar todos"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(val) => row.toggleSelected(!!val)}
            aria-label={`Selecionar ${row.original.name}`}
          />
        ),
        enableSorting: false,
        enableColumnFilter: false,
      }),
      columnHelper.accessor("name", {
        header: "Produto",
        cell: (info) => (
          <span className="font-medium text-foreground">{info.getValue()}</span>
        ),
      }),
      columnHelper.accessor("description", {
        header: "Descrição",
        cell: (info) => (
          <span className="text-muted-foreground line-clamp-1 max-w-[240px] block">
            {info.getValue() || "—"}
          </span>
        ),
      }),
      columnHelper.accessor("category", {
        header: "Categoria",
        cell: (info) => {
          const cat = CATEGORY_MAP[info.getValue()];
          return cat ? (
            <Badge variant="outline" className={`text-[10px] ${cat.color}`}>{cat.label}</Badge>
          ) : (
            <span className="text-muted-foreground">—</span>
          );
        },
      }),
      columnHelper.accessor("estimatedHours", {
        header: "Horas",
        cell: (info) => (
          <span className="text-mono text-[11px] text-muted-foreground">{info.getValue()}h</span>
        ),
      }),
      columnHelper.accessor("materialCost", {
        header: "Custo (R$)",
        cell: (info) => {
          const val = info.getValue();
          return val > 0 ? (
            <span className="text-mono text-[11px] text-muted-foreground">{formatBRL(val)}</span>
          ) : (
            <span className="text-muted-foreground">—</span>
          );
        },
      }),
      columnHelper.accessor("createdAt", {
        header: "Criação",
        sortingFn: "datetime",
        cell: (info) => (
          <span className="text-mono text-[11px] text-muted-foreground">
            {new Date(info.getValue()).toLocaleDateString("pt-BR")}
          </span>
        ),
      }),
      columnHelper.display({
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <button
              onClick={() => openEdit(row.original)}
              className="inline-flex items-center justify-center rounded-md p-1 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Editar"
            >
              <Edit3 size={14} />
            </button>
            <button
              onClick={() => handleDelete(row.original.id, row.original.name)}
              className="inline-flex items-center justify-center rounded-md p-1 text-muted-foreground hover:text-rose-glow transition-colors"
              aria-label="Remover"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ),
        enableSorting: false,
        enableColumnFilter: false,
      }),
    ],
    [openEdit],
  );

  const table = useReactTable({
    data: products,
    columns,
    state: {
      sorting,
      globalFilter,
      columnFilters,
      columnVisibility,
      rowSelection,
      pagination,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    enableRowSelection: true,
    globalFilterFn: "includesString",
  });

  const pageCount = table.getPageCount();
  const canGoPrev = table.getCanPreviousPage();
  const canGoNext = table.getCanNextPage();
  const selectedCount = Object.keys(rowSelection).length;

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
          <p className="text-mono text-[11px] uppercase tracking-widest text-muted-foreground">Produtos</p>
        </div>
        <div className="flex items-center gap-2">
          {selectedCount > 0 && (
            <span className="text-mono text-[11px] text-muted-foreground">
              {selectedCount} selecionado{selectedCount !== 1 ? "s" : ""}
            </span>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger>
              <Button variant="outline" size="sm" type="button">
                <Columns3 size={14} /> Colunas
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {table.getAllLeafColumns().map((column) => {
                if (column.id === "select" || column.id === "actions") return null;
                return (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    checked={column.getIsVisible()}
                    onCheckedChange={(val) => column.toggleVisibility(!!val)}
                  >
                    {typeof column.columnDef.header === "string"
                      ? column.columnDef.header
                      : column.id}
                  </DropdownMenuCheckboxItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
          {products.length === 0 && (
            <Button variant="outline" size="sm" onClick={handleSeed} disabled={seeding}>
              <Sparkles size={14} /> {seeding ? "Carregando..." : "Carregar padrão"}
            </Button>
          )}
          <Button size="sm" onClick={openCreate}>
            <Plus size={14} /> Novo produto
          </Button>
        </div>
      </header>

      <section className="flex flex-col gap-4 px-8 py-6">
        <div className="flex items-center gap-3">
          <div className="relative max-w-xs flex-1">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar produtos…"
              value={globalFilter}
              onChange={(e) => {
                setGlobalFilter(e.target.value);
                setPagination((p) => ({ ...p, pageIndex: 0 }));
              }}
              className="border-hairline bg-(--surface-2) pl-8"
            />
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant={activeCategory === "all" ? "default" : "ghost"}
              size="sm"
              onClick={() => {
                setColumnFilters((prev) => prev.filter((f) => f.id !== "category"));
                setPagination((p) => ({ ...p, pageIndex: 0 }));
              }}
              className="text-[11px]"
            >
              Todas
            </Button>
            {CATEGORIES.map((cat) => (
              <Button
                key={cat.value}
                variant={activeCategory === cat.value ? "default" : "ghost"}
                size="sm"
                onClick={() => {
                  setColumnFilters((prev) => {
                    const rest = prev.filter((f) => f.id !== "category");
                    return [...rest, { id: "category", value: cat.value }];
                  });
                  setPagination((p) => ({ ...p, pageIndex: 0 }));
                }}
                className="text-[11px]"
              >
                {cat.label}
              </Button>
            ))}
          </div>
          <span className="text-mono text-[11px] text-muted-foreground">
            {table.getFilteredRowModel().rows.length} registro{table.getFilteredRowModel().rows.length !== 1 ? "s" : ""}
          </span>
        </div>

        <div className="rounded-xl border border-hairline bg-(--surface-1) overflow-hidden">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id}>
                      {header.isPlaceholder ? null : (
                        <button
                          type="button"
                          className="group inline-flex items-center gap-1 text-mono text-[10px] uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {{
                            asc: <ChevronUp size={12} className="text-emerald-glow" />,
                            desc: <ChevronDown size={12} className="text-emerald-glow" />,
                          }[header.column.getIsSorted() as string] ?? null}
                        </button>
                      )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-32 text-center text-muted-foreground">
                    {products.length === 0
                      ? "Nenhum produto cadastrado."
                      : "Nenhum produto encontrado para esta busca."}
                  </TableCell>
                </TableRow>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id} data-state={row.getIsSelected() ? "selected" : undefined}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-mono text-[11px] text-muted-foreground">
              Página {pagination.pageIndex + 1} de {pageCount}
            </span>
            <Select
              value={String(pagination.pageSize)}
              onValueChange={(v) => setPagination({ pageIndex: 0, pageSize: Number(v) })}
            >
              <SelectTrigger className="h-7 w-24 border-hairline bg-(--surface-2) text-[11px] text-muted-foreground">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[5, 10, 20, 50].map((size) => (
                  <SelectItem key={size} value={String(size)}>
                    {size} / pág
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon-sm" onClick={() => table.setPageIndex(0)} disabled={!canGoPrev}>
              <ChevronsLeft size={14} />
            </Button>
            <Button variant="ghost" size="icon-sm" onClick={() => table.previousPage()} disabled={!canGoPrev}>
              <ChevronLeft size={14} />
            </Button>
            {Array.from({ length: Math.min(5, pageCount) }, (_, i) => {
              const end = Math.min(pageCount, Math.max(5, pagination.pageIndex + 3));
              const start = Math.max(0, end - 5);
              const page = start + i;
              if (page >= pageCount) return null;
              return (
                <Button
                  key={page}
                  variant={page === pagination.pageIndex ? "default" : "ghost"}
                  size="icon-sm"
                  onClick={() => table.setPageIndex(page)}
                >
                  {page + 1}
                </Button>
              );
            })}
            <Button variant="ghost" size="icon-sm" onClick={() => table.nextPage()} disabled={!canGoNext}>
              <ChevronRight size={14} />
            </Button>
            <Button variant="ghost" size="icon-sm" onClick={() => table.setPageIndex(pageCount - 1)} disabled={!canGoNext}>
              <ChevronsRight size={14} />
            </Button>
          </div>
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
