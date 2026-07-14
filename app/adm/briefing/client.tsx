"use client";

import { useState, useMemo, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, FileText, Search, ChevronDown, ChevronUp,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  Columns3, Plus, Trash2, ExternalLink, Loader2,
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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { toast } from "sonner";
import {
  getAllBriefings,
  createBriefing,
  deleteBriefing,
  listProjectsWithoutBriefing,
  type BriefingListItem,
} from "@/lib/actions/briefing";

const columnHelper = createColumnHelper<BriefingListItem & { _actions?: undefined }>();

export function BriefingListClient({ briefings: initial }: { briefings: BriefingListItem[] }) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [sorting, setSorting] = useState<SortingState>([{ id: "updatedAt", desc: true }]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [sheetOpen, setSheetOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  const { data: briefings } = useQuery({
    queryKey: ["briefings"],
    queryFn: () => getAllBriefings(),
    initialData: initial,
  });

  const { data: availableProjects } = useQuery({
    queryKey: ["projects-without-briefing"],
    queryFn: () => listProjectsWithoutBriefing(),
    enabled: sheetOpen,
  });

  const handleCreate = useCallback(async (projectId: string, clientName: string) => {
    setCreating(true);
    try {
      const result = await createBriefing(projectId, clientName);
      if (result.created) {
        toast.success("Briefing criado!");
        setSheetOpen(false);
        queryClient.invalidateQueries({ queryKey: ["briefings"] });
        router.push(`/adm/briefing/${result.id}`);
      } else {
        toast.error("Este projeto já tem um briefing.");
      }
    } catch {
      toast.error("Erro ao criar briefing");
    } finally {
      setCreating(false);
    }
  }, [queryClient, router]);

  const handleDelete = useCallback(async (id: string, projectName: string) => {
    await deleteBriefing(id);
    queryClient.invalidateQueries({ queryKey: ["briefings"] });
    toast.success(`Briefing de "${projectName}" removido`);
  }, [queryClient]);

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
            aria-label={`Selecionar ${row.original.projectName}`}
          />
        ),
        enableSorting: false,
        enableColumnFilter: false,
      }),
      columnHelper.accessor("projectName", {
        header: "Projeto",
        cell: (info) => (
          <Link
            href={`/adm/briefing/${info.row.original.id}`}
            className="font-medium text-foreground hover:text-emerald-glow transition-colors"
          >
            {info.getValue()}
            <ExternalLink size={11} className="ml-1.5 inline-block text-muted-foreground" />
          </Link>
        ),
      }),
      columnHelper.accessor("clientName", {
        header: "Cliente",
        cell: (info) => (
          <span className="text-muted-foreground">{info.getValue()}</span>
        ),
      }),
      columnHelper.accessor("createdAt", {
        header: "Criação",
        sortingFn: "datetime",
        cell: (info) => {
          const val = info.getValue();
          return val ? (
            <span className="text-mono text-[11px] text-muted-foreground">
              {new Date(val).toLocaleDateString("pt-BR")}
            </span>
          ) : (
            <span className="text-muted-foreground">—</span>
          );
        },
      }),
      columnHelper.accessor("updatedAt", {
        header: "Atualização",
        sortingFn: "datetime",
        cell: (info) => {
          const val = info.getValue();
          return val ? (
            <span className="text-mono text-[11px] text-muted-foreground">
              {new Date(val).toLocaleDateString("pt-BR")}
            </span>
          ) : (
            <span className="text-muted-foreground">—</span>
          );
        },
      }),
      columnHelper.display({
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <button
              onClick={() => handleDelete(row.original.id, row.original.projectName)}
              className="inline-flex items-center justify-center rounded-md p-1 text-muted-foreground hover:text-rose-glow transition-colors"
              aria-label="Remover briefing"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ),
        enableSorting: false,
        enableColumnFilter: false,
      }),
    ],
    [handleDelete],
  );

  const table = useReactTable({
    data: briefings,
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
  });

  const pageCount = table.getPageCount();
  const canGoPrev = table.getCanPreviousPage();
  const canGoNext = table.getCanNextPage();
  const selectedCount = Object.keys(rowSelection).length;

  return (
    <>
      <header className="flex items-center justify-between border-b border-hairline px-8 py-4">
        <div className="flex items-center gap-3">
          <Link href="/adm" className="inline-flex items-center gap-1.5 rounded-md border border-hairline px-2 py-1 text-[11px] text-muted-foreground hover:text-foreground">
            <ArrowLeft size={12} /> Painel
          </Link>
          <FileText size={16} className="text-emerald-glow" />
          <p className="text-mono text-[11px] uppercase tracking-widest text-muted-foreground">Briefings</p>
        </div>
        <div className="flex items-center gap-3">
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
          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger>
              <Button size="sm" type="button"><Plus size={14} /> Novo briefing</Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Novo Briefing</SheetTitle>
              </SheetHeader>
              <div className="mt-6 flex flex-col gap-2">
                {availableProjects && availableProjects.length === 0 && (
                  <p className="text-sm text-muted-foreground">Todos os projetos já têm briefing.</p>
                )}
                {availableProjects?.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    disabled={creating}
                    onClick={() => handleCreate(p.id, p.clientName)}
                    className="flex items-center justify-between rounded-lg border border-hairline bg-(--surface-1) px-4 py-3 text-left text-sm transition-colors hover:bg-(--surface-2) disabled:opacity-50"
                  >
                    <div>
                      <p className="font-medium text-foreground">{p.name}</p>
                      <p className="text-[11px] text-muted-foreground">{p.clientName}</p>
                    </div>
                    {creating && <Loader2 size={14} className="animate-spin text-muted-foreground" />}
                  </button>
                ))}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      <section className="flex flex-col gap-4 px-8 py-6">
        <div className="flex items-center gap-3">
          <div className="relative max-w-xs flex-1">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar briefings…"
              value={globalFilter}
              onChange={(e) => {
                setGlobalFilter(e.target.value);
                setPagination((p) => ({ ...p, pageIndex: 0 }));
              }}
              className="border-hairline bg-(--surface-2) pl-8"
            />
          </div>
          <span className="text-mono text-[11px] text-muted-foreground">
            {table.getFilteredRowModel().rows.length} registro{table.getFilteredRowModel().rows.length !== 1 ? "s" : ""}
          </span>
        </div>

        {briefings.length === 0 ? (
          <div className="flex flex-col items-center gap-3 border border-dashed border-hairline/50 px-8 py-16 text-center">
            <FileText size={32} className="text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">Nenhum briefing criado</p>
            <p className="text-[11px] text-muted-foreground/60">Crie um briefing vinculado a um projeto existente.</p>
            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
              <SheetTrigger>
                <Button size="sm" type="button"><Plus size={14} /> Criar primeiro briefing</Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Novo Briefing</SheetTitle>
                </SheetHeader>
                <div className="mt-6 flex flex-col gap-2">
                  {availableProjects && availableProjects.length === 0 && (
                    <p className="text-sm text-muted-foreground">Nenhum projeto disponível. Crie um projeto primeiro.</p>
                  )}
                  {availableProjects?.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      disabled={creating}
                      onClick={() => handleCreate(p.id, p.clientName)}
                      className="flex items-center justify-between rounded-lg border border-hairline bg-(--surface-1) px-4 py-3 text-left text-sm transition-colors hover:bg-(--surface-2) disabled:opacity-50"
                    >
                      <div>
                        <p className="font-medium text-foreground">{p.name}</p>
                        <p className="text-[11px] text-muted-foreground">{p.clientName}</p>
                      </div>
                      {creating && <Loader2 size={14} className="animate-spin text-muted-foreground" />}
                    </button>
                  ))}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        ) : (
          <>
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
                        Nenhum briefing encontrado para esta busca.
                      </TableCell>
                    </TableRow>
                  ) : (
                    table.getRowModel().rows.map((row) => (
                      <TableRow key={row.id} data-state={row.getIsSelected() ? "selected" : undefined} className="group">
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
          </>
        )}
      </section>
    </>
  );
}
