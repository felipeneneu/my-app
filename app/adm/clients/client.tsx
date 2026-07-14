"use client";

import { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getClientsWithStats, deleteClient, type ClientWithStats } from "@/lib/actions/clients";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import {
  ArrowLeft, User, Search, ChevronDown, ChevronUp,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  Columns3, Trash2, Plus, ExternalLink,
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
import { toast } from "sonner";
import Link from "next/link";

const columnHelper = createColumnHelper<ClientWithStats>();

export function ClientsClient({ initial }: { initial: ClientWithStats[] }) {
  const queryClient = useQueryClient();
  const [sorting, setSorting] = useState<SortingState>([{ id: "name", desc: false }]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });

  const { data: clients } = useQuery({
    queryKey: ["clients"],
    queryFn: getClientsWithStats,
    initialData: initial,
  });

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
        header: "Nome",
        cell: (info) => (
          <Link
            href={`/adm/clients/${info.row.original.id}`}
            className="font-medium text-foreground hover:text-emerald-glow transition-colors"
          >
            {info.getValue()}
            <ExternalLink size={11} className="ml-1.5 inline-block text-muted-foreground opacity-0 group-hover:opacity-100" />
          </Link>
        ),
      }),
      columnHelper.accessor("email", {
        header: "Email",
        cell: (info) => (
          <span className="text-muted-foreground">{info.getValue() || "—"}</span>
        ),
      }),
      columnHelper.accessor("phone", {
        header: "Telefone",
        cell: (info) => (
          <span className="text-muted-foreground">{info.getValue() || "—"}</span>
        ),
      }),
      columnHelper.accessor("document", {
        header: "Documento",
        cell: (info) => (
          <span className="text-muted-foreground">{info.getValue() || "—"}</span>
        ),
      }),
      columnHelper.accessor("projectCount", {
        header: "Projetos",
        cell: (info) => (
          <Badge variant="outline" className="text-[11px]">{info.getValue()}</Badge>
        ),
      }),
      columnHelper.accessor("budgetCount", {
        header: "Orçamentos",
        cell: (info) => (
          <Badge variant="outline" className="text-[11px]">{info.getValue()}</Badge>
        ),
      }),
      columnHelper.accessor("createdAt", {
        header: "Cadastro",
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
          <ConfirmDialog
            title="Remover cliente"
            description={`Deletar "${row.original.name}" permanentemente?`}
            confirmLabel="Remover"
            onConfirm={async () => {
              await deleteClient(row.original.id);
              queryClient.invalidateQueries({ queryKey: ["clients"] });
              toast.success("Cliente removido");
            }}
          >
            <Button variant="ghost" size="icon-sm" className="text-muted-foreground hover:text-rose-glow">
              <Trash2 size={14} />
            </Button>
          </ConfirmDialog>
        ),
        enableSorting: false,
        enableColumnFilter: false,
      }),
    ],
    [queryClient],
  );

  const table = useReactTable({
    data: clients,
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

  if (clients.length === 0) {
    return (
      <>
        <header className="flex items-center justify-between border-b border-hairline px-8 py-4">
          <div className="flex items-center gap-3">
            <Link href="/adm" className="inline-flex items-center gap-1.5 rounded-md border border-hairline px-2 py-1 text-[11px] text-muted-foreground hover:text-foreground">
              <ArrowLeft size={12} /> Painel
            </Link>
            <User size={16} className="text-emerald-glow" />
            <p className="text-mono text-[11px] uppercase tracking-widest text-muted-foreground">Clientes</p>
          </div>
          <Link href="/adm/clients/new">
            <Button size="sm"><Plus size={14} /> Novo cliente</Button>
          </Link>
        </header>
        <section className="px-8 py-6">
          <div className="flex flex-col items-center gap-3 border border-dashed border-hairline/50 px-8 py-16 text-center">
            <User size={32} className="text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">Nenhum cliente cadastrado</p>
            <Link href="/adm/clients/new"><Button><Plus size={14} /> Cadastrar primeiro cliente</Button></Link>
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
          <User size={16} className="text-emerald-glow" />
          <p className="text-mono text-[11px] uppercase tracking-widest text-muted-foreground">Clientes</p>
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
          <Link href="/adm/clients/new">
            <Button size="sm"><Plus size={14} /> Novo cliente</Button>
          </Link>
        </div>
      </header>

      <section className="flex flex-col gap-4 px-8 py-6">
        <div className="flex items-center gap-3">
          <div className="relative max-w-xs flex-1">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar clientes…"
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
                    Nenhum cliente encontrado para esta busca.
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
