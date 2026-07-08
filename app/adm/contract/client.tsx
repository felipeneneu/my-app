"use client";

import Link from "next/link";
import { ArrowLeft, FileSignature, Check, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type ContractItem = {
  id: string;
  contentJson: string;
};

function formatBRL(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function ContractListClient({ contracts }: { contracts: ContractItem[] }) {
  return (
    <>
      <header className="flex items-center justify-between border-b border-hairline px-8 py-4">
        <div className="flex items-center gap-3">
          <Link href="/adm" className="inline-flex items-center gap-1.5 rounded-md border border-hairline px-2 py-1 text-[11px] text-muted-foreground hover:text-foreground">
            <ArrowLeft size={12} /> Painel
          </Link>
          <FileSignature size={16} className="text-emerald-glow" />
          <p className="text-mono text-[11px] uppercase tracking-widest text-muted-foreground">Contratos</p>
        </div>
      </header>

      <section className="px-8 py-6">
        {contracts.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <FileSignature size={32} className="text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">Nenhum contrato encontrado</p>
            <p className="text-xs text-muted-foreground/60">Os contratos aparecerão aqui após serem gerados.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {contracts.map((c) => {
              const data = safeParse(c.contentJson);
              const status = data?.status ?? "pending";
              const isApproved = status === "approved";
              return (
                <Link key={c.id} href={`/adm/contract/${c.id}`}>
                  <Card className="cursor-pointer transition-all hover:ring-2 hover:ring-emerald-glow/40">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-foreground truncate">
                            {(data?.clientName as string) ?? "Sem nome"}
                          </p>
                          <p className="mt-1 text-mono text-[11px] text-muted-foreground">
                            {(data?.scope as string) ? (
                              <span className="line-clamp-1">{data?.scope as string}</span>
                            ) : "Sem escopo"}
                          </p>
                        </div>
                        <Badge variant={isApproved ? "default" : "secondary"} className="shrink-0 ml-3">
                          {isApproved ? <Check size={10} /> : <Clock size={10} />}
                          <span className="ml-1">{isApproved ? "Aprovado" : "Pendente"}</span>
                        </Badge>
                      </div>
                      <div className="mt-4 flex items-center justify-between text-sm">
                        <span className="text-mono text-emerald-glow font-semibold">
                          {data?.totalPrice != null ? formatBRL(data?.totalPrice as number) : "—"}
                        </span>
                        {data && (data.createdAt as string) && (
                          <span className="text-mono text-[10px] text-muted-foreground">
                            {new Date(data.createdAt as string).toLocaleDateString("pt-BR")}
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
