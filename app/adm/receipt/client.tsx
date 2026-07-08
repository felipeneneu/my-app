"use client";

import Link from "next/link";
import { ArrowLeft, Receipt, Check } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type ReceiptItem = {
  id: string;
  contentJson: string;
};

function formatBRL(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function ReceiptListClient({ receipts }: { receipts: ReceiptItem[] }) {
  return (
    <>
      <header className="flex items-center justify-between border-b border-hairline px-8 py-4">
        <div className="flex items-center gap-3">
          <Link href="/adm" className="inline-flex items-center gap-1.5 rounded-md border border-hairline px-2 py-1 text-[11px] text-muted-foreground hover:text-foreground">
            <ArrowLeft size={12} /> Painel
          </Link>
          <Receipt size={16} className="text-violet-glow" />
          <p className="text-mono text-[11px] uppercase tracking-widest text-muted-foreground">Recibos</p>
        </div>
      </header>

      <section className="px-8 py-6">
        {receipts.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <Receipt size={32} className="text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">Nenhum recibo encontrado</p>
            <p className="text-xs text-muted-foreground/60">Os recibos são gerados automaticamente ao aprovar um contrato.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {receipts.map((r) => {
              const data = safeParse(r.contentJson);
              return (
                <Link key={r.id} href={`/adm/receipt/${r.id}`}>
                  <Card className="cursor-pointer transition-all hover:ring-2 hover:ring-violet-glow/40">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-foreground truncate">
                            {(data?.clientName as string) ?? "Sem nome"}
                          </p>
                          {data && (data.scope as string) && (
                            <p className="mt-1 text-mono text-[11px] text-muted-foreground line-clamp-1">
                              {data.scope as string}
                            </p>
                          )}
                        </div>
                        <Badge variant="default" className="shrink-0 ml-3 gap-1">
                          <Check size={10} /> Aprovado
                        </Badge>
                      </div>
                      <div className="mt-4 flex items-center justify-between text-sm">
                        <span className="text-mono text-emerald-glow font-semibold">
                          {data?.totalPrice != null ? formatBRL(data.totalPrice as number) : "—"}
                        </span>
                        {data && (data.approvedAt as string) && (
                          <span className="text-mono text-[10px] text-muted-foreground">
                            {new Date(data.approvedAt as string).toLocaleDateString("pt-BR")}
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </>
  );
}

function safeParse(json: string) {
  try {
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
}
