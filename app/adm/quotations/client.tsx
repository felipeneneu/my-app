"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { ArrowLeft, FileSignature, Calculator, FileText, Receipt, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

type DocItem = { id: string; contentJson: string };

function parseDoc(json: string) {
  try { return JSON.parse(json); } catch { return {}; }
}

function formatBRL(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2 });
}

function DocCard({ item, href, typeLabel, status }: { item: DocItem; href: string; typeLabel: string; status: string }) {
  const data = parseDoc(item.contentJson);
  const clientName = data.clientName || "—";
  const price = data.totalPrice ?? data.price ?? 0;
  const createdAt = data.createdAt ? new Date(data.createdAt).toLocaleDateString("pt-BR") : "—";

  return (
    <Link href={href} className="block">
      <Card className="transition-colors hover:border-emerald-glow/40">
        <CardContent className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-(--surface-2)">
              {typeLabel === "budget" && <Calculator size={18} className="text-cyan-glow" />}
              {typeLabel === "contract" && <FileText size={18} className="text-emerald-glow" />}
              {typeLabel === "receipt" && <Receipt size={18} className="text-violet-glow" />}
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">{clientName}</p>
              <p className="text-[11px] text-muted-foreground">{createdAt} · {formatBRL(price)}</p>
            </div>
          </div>
          <Badge variant={status === "approved" ? "default" : "outline"} className={status === "approved" ? "bg-emerald-glow/10 text-emerald-glow" : ""}>
            {status === "approved" ? "Aprovado" : "Pendente"}
          </Badge>
        </CardContent>
      </Card>
    </Link>
  );
}

export function QuotationsHubClient({ budgets, contracts, receipts }: {
  budgets: DocItem[];
  contracts: DocItem[];
  receipts: DocItem[];
}) {
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("all");

  const filtered = useMemo(() => {
    const items: { item: DocItem; type: "budget" | "contract" | "receipt" }[] = [];
    if (tab === "all" || tab === "budget") budgets.forEach((b) => items.push({ item: b, type: "budget" }));
    if (tab === "all" || tab === "contract") contracts.forEach((c) => items.push({ item: c, type: "contract" }));
    if (tab === "all" || tab === "receipt") receipts.forEach((r) => items.push({ item: r, type: "receipt" }));
    return items.filter(({ item }) => {
      if (!search.trim()) return true;
      const data = parseDoc(item.contentJson);
      const q = search.toLowerCase();
      return (data.clientName || "").toLowerCase().includes(q);
    });
  }, [budgets, contracts, receipts, search, tab]);

  return (
    <>
      <header className="flex items-center justify-between border-b border-hairline px-8 py-4">
        <div className="flex items-center gap-3">
          <Link href="/adm" className="inline-flex items-center gap-1.5 rounded-md border border-hairline px-2 py-1 text-[11px] text-muted-foreground hover:text-foreground">
            <ArrowLeft size={12} /> Painel
          </Link>
          <FileSignature size={16} className="text-emerald-glow" />
          <p className="text-mono text-[11px] uppercase tracking-widest text-muted-foreground">
            Sprint OS / Histórico Comercial
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar cliente..."
              className="h-8 w-48 border-hairline bg-(--surface-2) pl-8 text-xs"
            />
          </div>
          <Link href="/adm/budget/new">
            <Button size="sm"><Plus size={14} /> Novo Orçamento</Button>
          </Link>
        </div>
      </header>

      <div className="px-8 py-6">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="all">Todos ({budgets.length + contracts.length + receipts.length})</TabsTrigger>
            <TabsTrigger value="budget">Orçamentos ({budgets.length})</TabsTrigger>
            <TabsTrigger value="contract">Contratos ({contracts.length})</TabsTrigger>
            <TabsTrigger value="receipt">Recibos ({receipts.length})</TabsTrigger>
          </TabsList>

          <TabsContent value={tab} className="mt-0">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center gap-4 py-16">
                <FileSignature size={40} className="text-muted-foreground/20" />
                <p className="text-sm text-muted-foreground">Nenhum documento encontrado</p>
                <Link href="/adm/budget/new">
                  <Button variant="outline" size="sm"><Plus size={14} /> Criar primeiro orçamento</Button>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                {filtered.map(({ item, type }) => {
                  const data = parseDoc(item.contentJson);
                  const href = type === "budget" ? `/adm/budget/${item.id}` : type === "contract" ? `/adm/contract/${item.id}` : `/adm/receipt/${item.id}`;
                  return <DocCard key={item.id} item={item} href={href} typeLabel={type} status={data.status || "pending"} />;
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
