"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  ArrowLeft, ClipboardList, Search, ChevronDown, ChevronUp,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  Columns3, Plus, ExternalLink, Check, Clock, Play,
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
type OSDoc = {
  id: string;
  contentJson: string;
};

type OSRow = {
  id: string;
  clientName: string;
  scope: string;
  totalPrice: number;
  status: string;
  createdAt: string;
};

function formatBRL(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function safeParse(json: string) {
  try {
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
}

const statusBadge: Record<string, { label: string; icon: typeof Check; variant: "default" | "secondary" | "outline" }> = {
  completed: { label: "Concluída", icon: Check, variant: "default" },
  active: { label: "Ativa", icon: Play, variant: "secondary" },
  cancelled: { label: "Cancelada", icon: Clock, variant: "outline" },
};

const columnHelper = createColumnHelper<OSRow>();

export function OSListClient({ docs }: { docs: OSDoc[] }) {
  const [sorting, setSorting] = useState<SortingState>([{ id: "createdAt", desc: true }]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });

  const data = useMemo(() => {
    return docs.map((doc) => {
      const d = safeParse(doc.contentJson);
      return {
        id: doc.id,
        clientName: (d?.clientName as string) ?? "Sem nome",
        scope: (d?.scope as string) ?? "",
        totalPrice: (d?.totalPrice as number) ?? 0,
        status: (d?.status as string) ?? "active",
        createdAt: (d?.createdAt as string) ?? "",
      };
    });
  }, [docs]);

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
            aria-label={`Selecionar ${row.original.clientName}`}
          />
        ),
        enableSorting: false,
        enableColumnFilter: false,
      }),
      columnHelper.accessor("clientName", {
        header: "Cliente",
        cell: (info) => (
          <Link
            href={`/adm/os/${info.row.original.id}`}
            className="font-medium text-foreground hover:text-violet-500 transition-colors"
          >
            {info.getValue()}
            <ExternalLink size={11} className="ml-1.5 inline-block text-muted-foreground opacity-0 group-hover:opacity-100" />
          </Link>
        ),
      }),
      columnHelper.accessor("scope", {
        header: "Escopo",
        cell: (info) => (
          <span className="text-muted-foreground max-w-[200px] truncate block">{info.getValue() || "—"}</span>
        ),
      }),
      columnHelper.accessor("totalPrice", {
        header: "Valor",
        sortingFn: "basic",
        cell: (info) => (
          <span className="font-mono text-sm font-semibold text-violet-600">{formatBRL(info.getValue())}</span>
        ),
      }),
      columnHelper.accessor("status", {
        header: "Status",
        cell: (info) => {
          const s = statusBadge[info.getValue()] ?? statusBadge.active;
          const Icon = s.icon;
          return (
            <Badge variant={s.variant} className="gap-1 text-[11px]">
              <Icon size={10} /> {s.label}
            </Badge>
          );
        },
      }),
      columnHelper.accessor("createdAt", {
        header: "Criada em",
        sortingFn: "datetime",
        cell: (info) => (
          <span className="text-mono text-[11px] text-muted-foreground">
            {info.getValue() ? new Date(info.getValue()).toLocaleDateString("pt-BR") : "—"}
          </span>
        ),
      }),
    ],
    [],
  );

  const table = useReactTable({
    data,
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

  if (data.length === 0) {
    return (
      <>
        <header className="flex items-center justify-between border-b border-hairline px-8 py-4">
          <div className="flex items-center gap-3">
            <Link href="/adm" className="inline-flex items-center gap-1.5 rounded-md border border-hairline px-2 py-1 text-[11px] text-muted-foreground hover:text-foreground">
              <ArrowLeft size={12} /> Painel
            </Link>
            <ClipboardList size={16} className="text-violet-500" />
            <p className="text-mono text-[11px] uppercase tracking-widest text-muted-foreground">Ordens de Serviço</p>
          </div>
          <Link href="/adm/os/new">
            <Button size="sm"><Plus size={14} /> Nova OS</Button>
          </Link>
        </header>
        <section className="px-8 py-6">
          <div className="flex flex-col items-center gap-3 border border-dashed border-hairline/50 px-8 py-16 text-center">
            <ClipboardList size={32} className="text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">Nenhuma Ordem de Serviço encontrada</p>
            <Link href="/adm/os/new"><Button><Plus size={14} /> Criar primeira OS</Button></Link>
          </div>
        </section>
      </>
    );
  }

  return (
    <>
      <header className="flex items-center justify-between border-b border-hairline px-8 py-4">
        <div className="flex items-center gap-3">
          <Link href="/adm" className="inline-flex items-center gap-1.5 rounded-md border border-hairline px-2 py-1 text-[11px] text-muted-foreground hover:text-foreground">
            <ArrowLeft size={12} /> Painel
          </Link>
          <ClipboardList size={16} className="text-violet-500" />
          <p className="text-mono text-[11px] uppercase tracking-widest text-muted-foreground">Ordens de Serviço</p>
        </div>
        <div className="flex items-center gap-3">
          {selectedCount > 0 && (
            <span className="text-mono text-[11px] text-muted-foreground">
              {selectedCount} selecionada{selectedCount !== 1 ? "s" : ""}
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
          <Link href="/adm/os/new">
            <Button size="sm"><Plus size={14} /> Nova OS</Button>
          </Link>
        </div>
      </header>

      <section className="flex flex-col gap-4 px-8 py-6">
        <div className="flex items-center gap-3">
          <div className="relative max-w-xs flex-1">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar OS…"
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
                            asc: <ChevronUp size={12} className="text-violet-500" />,
                            desc: <ChevronDown size={12} className="text-violet-500" />,
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
                    Nenhuma OS encontrada para esta busca.
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
      </section>
    </>
  );
}
