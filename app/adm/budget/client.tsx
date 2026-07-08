"use client";

import Link from "next/link";
import { ArrowLeft, Calculator, Check, Clock, FileSignature, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type BudgetItem = {
  id: string;
  contentJson: string;
};

export function BudgetListClient({ budgets }: { budgets: BudgetItem[] }) {
  const parsed = budgets.map(b => {
    const data = JSON.parse(b.contentJson);
    return { id: b.id, ...data };
  });

  return (
    <>
      <header className="flex items-center justify-between border-b border-hairline px-8 py-4">
        <div className="flex items-center gap-3">
          <Link href="/adm" className="inline-flex items-center gap-1.5 rounded-md border border-hairline px-2 py-1 text-[11px] text-muted-foreground hover:text-foreground">
            <ArrowLeft size={12} /> Painel
          </Link>
          <Calculator size={16} className="text-emerald-glow" />
          <p className="text-mono text-[11px] uppercase tracking-widest text-muted-foreground">Orçamentos</p>
        </div>
        <Link href="/adm/budget/new">
          <Button size="sm"><Plus size={14} /> Novo Orçamento</Button>
        </Link>
      </header>

      <section className="px-8 py-6">
        {parsed.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <FileSignature size={32} className="text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">Nenhum orçamento criado</p>
            <Link href="/adm/budget/new">
              <Button><Plus size={14} /> Criar primeiro orçamento</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {parsed.map((b) => (
              <Link key={b.id} href={`/adm/budget/${b.id}`} className="block transition-opacity hover:opacity-80">
                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-base">{b.clientName}</CardTitle>
                      <Badge variant={b.status === "approved" ? "default" : "secondary"} className={b.status === "approved" ? "bg-emerald-600 text-white" : "bg-amber-600 text-white"}>
                        {b.status === "approved" ? <Check size={12} /> : <Clock size={12} />}
                        {b.status === "approved" ? "Aprovado" : "Pendente"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-1.5 text-sm text-muted-foreground">
                    <p className="text-display text-lg text-emerald-glow">
                      {b.totalPrice?.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2 }) ?? "—"}
                    </p>
                    {b.deadline && <p className="text-xs">{b.deadline}</p>}
                    {b.createdAt && (
                      <p className="text-[10px] text-muted-foreground/60">
                        {new Date(b.createdAt).toLocaleDateString("pt-BR")}
                      </p>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
