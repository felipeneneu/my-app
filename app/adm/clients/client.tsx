"use client";

import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getClientsWithStats, createClient, deleteClient, type ClientWithStats } from "@/lib/actions/clients";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Mail, Phone, Building2, Trash2, Plus, ArrowLeft, User, Search, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import Link from "next/link";

export function ClientsClient({ initial }: { initial: ClientWithStats[] }) {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [document, setDocument] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  const { data: clients } = useQuery({
    queryKey: ["clients"],
    queryFn: getClientsWithStats,
    initialData: initial,
  });

  const filtered = useMemo(() => {
    if (!search.trim()) return clients;
    const q = search.toLowerCase();
    return clients.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.email && c.email.toLowerCase().includes(q)) ||
        (c.phone && c.phone.toLowerCase().includes(q)) ||
        (c.document && c.document.toLowerCase().includes(q)),
    );
  }, [clients, search]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    await createClient({ name: name.trim(), email, phone, document, notes });
    setName(""); setEmail(""); setPhone(""); setDocument(""); setNotes("");
    setLoading(false);
    setDialogOpen(false);
    queryClient.invalidateQueries({ queryKey: ["clients"] });
    toast.success("Cliente cadastrado");
  }

  async function handleDelete(id: string) {
    await deleteClient(id);
    queryClient.invalidateQueries({ queryKey: ["clients"] });
    toast.success("Cliente removido");
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
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger>
            <Button size="sm"><Plus size={14} /> Novo cliente</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Cadastrar cliente</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label>Nome *</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome do cliente" />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Email</Label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@exemplo.com" />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Telefone</Label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(11) 99999-9999" />
              </div>
              <div className="flex flex-col gap-2">
                <Label>CPF / CNPJ</Label>
                <Input value={document} onChange={(e) => setDocument(e.target.value)} placeholder="Apenas números" />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Observações</Label>
                <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
              </div>
              <Button type="submit" disabled={loading || !name.trim()}>
                {loading ? "Salvando…" : "Salvar cliente"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </header>

      <section className="px-8 py-6">
        <div className="mb-4 flex items-center gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar clientes…"
              className="border-hairline bg-(--surface-2) pl-8 text-sm"
            />
          </div>
          <p className="text-xs text-muted-foreground">{filtered.length} cliente{filtered.length !== 1 ? "s" : ""}</p>
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <User size={32} className="text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">
              {search ? "Nenhum cliente encontrado para esta busca" : "Nenhum cliente cadastrado"}
            </p>
            {!search && <Button onClick={() => setDialogOpen(true)}><Plus size={14} /> Cadastrar primeiro cliente</Button>}
          </div>
        ) : (
          <Tabs defaultValue="table">
            <TabsList className="mb-4">
              <TabsTrigger value="table">Tabela</TabsTrigger>
              <TabsTrigger value="cards">Cards</TabsTrigger>
            </TabsList>

            <TabsContent value="table">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>Documento</TableHead>
                    <TableHead className="text-center">Projetos</TableHead>
                    <TableHead className="text-center">Orçamentos</TableHead>
                    <TableHead>Cadastro</TableHead>
                    <TableHead className="w-16" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((c) => (
                    <TableRow key={c.id} className="group">
                      <TableCell>
                        <Link href={`/adm/clients/${c.id}`} className="flex items-center gap-1.5 font-medium text-foreground hover:text-emerald-glow transition-colors">
                          {c.name}
                          <ExternalLink size={11} className="opacity-0 group-hover:opacity-100 text-muted-foreground" />
                        </Link>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{c.email || "—"}</TableCell>
                      <TableCell className="text-muted-foreground">{c.phone || "—"}</TableCell>
                      <TableCell className="text-muted-foreground">{c.document || "—"}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className="text-[11px]">{c.projectCount}</Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className="text-[11px]">{c.budgetCount}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-[11px]">
                        {new Date(c.createdAt).toLocaleDateString("pt-BR")}
                      </TableCell>
                      <TableCell>
                        <ConfirmDialog
                          title="Remover cliente"
                          description={`Deletar "${c.name}" permanentemente?`}
                          confirmLabel="Remover"
                          onConfirm={() => handleDelete(c.id)}
                        >
                          <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100">
                            <Trash2 size={14} className="text-muted-foreground hover:text-rose-glow" />
                          </Button>
                        </ConfirmDialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>

            <TabsContent value="cards">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filtered.map((c) => (
                  <Link key={c.id} href={`/adm/clients/${c.id}`} className="block transition-opacity hover:opacity-80">
                    <Card>
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between">
                          <CardTitle className="text-base">{c.name}</CardTitle>
                          <div className="flex items-center gap-1">
                            {c.projectCount > 0 && (
                              <Badge variant="outline" className="text-[9px]">{c.projectCount} projeto{c.projectCount !== 1 ? "s" : ""}</Badge>
                            )}
                            <div onClick={(e) => e.stopPropagation()}>
                              <ConfirmDialog
                                title="Remover cliente"
                                description={`Deletar "${c.name}" permanentemente?`}
                                confirmLabel="Remover"
                                onConfirm={() => handleDelete(c.id)}
                              >
                                <Button variant="ghost" size="icon">
                                  <Trash2 size={14} className="text-muted-foreground hover:text-rose-glow" />
                                </Button>
                              </ConfirmDialog>
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="flex flex-col gap-2 text-sm text-muted-foreground">
                        {c.email && (
                          <span className="flex items-center gap-2"><Mail size={12} /> {c.email}</span>
                        )}
                        {c.phone && (
                          <span className="flex items-center gap-2"><Phone size={12} /> {c.phone}</span>
                        )}
                        {c.document && (
                          <span className="flex items-center gap-2"><Building2 size={12} /> {c.document}</span>
                        )}
                        {c.notes && (
                          <p className="mt-1 text-xs text-muted-foreground/70 line-clamp-2">{c.notes}</p>
                        )}
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        )}
      </section>
    </>
  );
}
