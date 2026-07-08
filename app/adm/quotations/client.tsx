"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Calculator, FileText, Download, Signature } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const HOURS_PER_MONTH = 120;

function formatBRL(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2 });
}

export function QuotationsClient({ leads, monthlyGoal: initialGoal }: {
  leads: { id: string; businessName: string; email: string; status: string; createdAt: string }[];
  monthlyGoal: number;
}) {
  const [client, setClient] = useState(leads[0]?.businessName ?? "Cliente");
  const [scope, setScope] = useState("Landing page institucional + integração WhatsApp");
  const [meta, setMeta] = useState(initialGoal);
  const [hours, setHours] = useState(40);
  const [extras, setExtras] = useState(320);
  const [deadline, setDeadline] = useState("30 dias corridos");

  const hourlyRate = meta / HOURS_PER_MONTH;
  const laborCost = hours * hourlyRate;
  const finalPrice = laborCost + extras;

  const today = useMemo(
    () => new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" }),
    [],
  );

  const exportPdf = () => {
    toast.success("PDF simulado gerado", {
      description: `Contrato ${client} · ${formatBRL(finalPrice)}`,
    });
  };

  return (
    <>
      <header className="flex items-center justify-between border-b border-hairline px-8 py-4">
        <div className="flex items-center gap-3">
          <Calculator size={16} className="text-emerald-glow" />
          <p className="text-mono text-[11px] uppercase tracking-widest text-muted-foreground">
            Sprint OS / Orçamentos Inteligentes
          </p>
        </div>
        <Button onClick={exportPdf}>
          <Download size={14} /> Exportar PDF simulado
        </Button>
      </header>

      <section className="grid grid-cols-1 gap-6 px-8 py-8 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <p className="text-mono text-[10px] uppercase tracking-widest text-emerald-glow">Calculadora de precificação</p>
            <CardTitle className="text-display text-2xl">Preço mínimo garantido</CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">
              Fórmula: <span className="text-mono text-foreground">Preço = (Horas × (Meta / 120h)) + Custos extras</span>
            </p>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div>
              <Label className="text-mono text-[10px] uppercase tracking-widest text-muted-foreground">Nome do cliente</Label>
              <Input value={client} onChange={(e) => setClient(e.target.value)} className="mt-1.5 border-hairline bg-[color:var(--surface-2)]" />
            </div>
            <div>
              <Label className="text-mono text-[10px] uppercase tracking-widest text-muted-foreground">Escopo resumido</Label>
              <Input value={scope} onChange={(e) => setScope(e.target.value)} className="mt-1.5 border-hairline bg-[color:var(--surface-2)]" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-mono text-[10px] uppercase tracking-widest text-muted-foreground">Meta mensal (R$)</Label>
                <Input type="number" value={meta} onChange={(e) => setMeta(Number(e.target.value) || 0)} className="mt-1.5 border-hairline bg-[color:var(--surface-2)]" />
              </div>
              <div>
                <Label className="text-mono text-[10px] uppercase tracking-widest text-muted-foreground">Horas do projeto</Label>
                <Input type="number" value={hours} onChange={(e) => setHours(Number(e.target.value) || 0)} className="mt-1.5 border-hairline bg-[color:var(--surface-2)]" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-mono text-[10px] uppercase tracking-widest text-muted-foreground">Custos extras (R$)</Label>
                <Input type="number" value={extras} onChange={(e) => setExtras(Number(e.target.value) || 0)} className="mt-1.5 border-hairline bg-[color:var(--surface-2)]" />
                <p className="mt-1 text-[10px] text-muted-foreground">Domínio, hospedagem, licenças, assets premium.</p>
              </div>
              <div>
                <Label className="text-mono text-[10px] uppercase tracking-widest text-muted-foreground">Prazo</Label>
                <Input value={deadline} onChange={(e) => setDeadline(e.target.value)} className="mt-1.5 border-hairline bg-[color:var(--surface-2)]" />
              </div>
            </div>

            <div className="mt-2 rounded-xl border border-emerald-glow/30 bg-emerald-glow/5 p-4">
              <p className="text-mono text-[10px] uppercase tracking-widest text-emerald-glow">Cálculo em tempo real</p>
              <div className="mt-3 grid grid-cols-3 gap-3 text-center">
                <div>
                  <p className="text-mono text-[10px] text-muted-foreground">Hora/valor</p>
                  <p className="text-display text-lg text-foreground">{formatBRL(hourlyRate)}</p>
                </div>
                <div>
                  <p className="text-mono text-[10px] text-muted-foreground">Mão de obra</p>
                  <p className="text-display text-lg text-foreground">{formatBRL(laborCost)}</p>
                </div>
                <div>
                  <p className="text-mono text-[10px] text-muted-foreground">Extras</p>
                  <p className="text-display text-lg text-foreground">{formatBRL(extras)}</p>
                </div>
              </div>
              <div className="mt-4 flex items-baseline justify-between border-t border-hairline pt-3">
                <p className="text-mono text-[11px] uppercase tracking-widest text-muted-foreground">Preço final mínimo</p>
                <p className="text-display text-3xl text-emerald-glow">{formatBRL(finalPrice)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText size={14} className="text-violet-glow" />
              <p className="text-mono text-[10px] uppercase tracking-widest text-muted-foreground">Previewer do documento</p>
            </div>
            <Button variant="outline" size="sm" onClick={exportPdf}><Download size={12} /> Exportar PDF simulado</Button>
          </div>

          <div className="rounded-2xl border border-hairline bg-white p-8 text-[13px] leading-relaxed text-neutral-800 shadow-2xl">
            <div className="mb-6 flex items-center justify-between border-b border-neutral-200 pb-4">
              <div>
                <p className="text-[10px] font-mono uppercase tracking-widest text-neutral-500">Contrato de prestação de serviços</p>
                <p className="text-xl font-bold text-neutral-900">Studio One · Jordan Diaz</p>
              </div>
              <div className="text-right text-[10px] font-mono uppercase text-neutral-500">
                <p>São Paulo</p>
                <p>{today}</p>
              </div>
            </div>

            <p>Pelo presente instrumento particular, de um lado <strong>Jordan Diaz — Studio One</strong> (CONTRATADO), e de outro, <strong>{client || "{{CLIENT_NAME}}"}</strong> (CONTRATANTE), ficam acertadas as condições abaixo para a execução do escopo descrito.</p>

            <h3 className="mt-5 text-sm font-bold uppercase tracking-wide text-neutral-900">1. Objeto</h3>
            <p>Prestação de serviços de desenvolvimento e design compreendendo: <em>{scope || "{{SCOPE}}"}</em>.</p>

            <h3 className="mt-4 text-sm font-bold uppercase tracking-wide text-neutral-900">2. Valor</h3>
            <p>Fica pactuado o valor total de <strong className="text-emerald-700">{formatBRL(finalPrice)}</strong>, sendo {formatBRL(laborCost)} referentes a {hours} horas de execução técnica e {formatBRL(extras)} de custos de infraestrutura.</p>

            <h3 className="mt-4 text-sm font-bold uppercase tracking-wide text-neutral-900">3. Prazo</h3>
            <p>A entrega será concluída em <strong>{deadline}</strong> a partir da aprovação desta proposta e pagamento da primeira parcela (50%).</p>

            <h3 className="mt-4 text-sm font-bold uppercase tracking-wide text-neutral-900">4. Propriedade intelectual</h3>
            <p>Após quitação integral, os direitos patrimoniais do produto final serão transferidos ao CONTRATANTE, ressalvado ao CONTRATADO o direito de exibição em portfólio.</p>

            <h3 className="mt-4 text-sm font-bold uppercase tracking-wide text-neutral-900">5. Foro</h3>
            <p>Fica eleito o foro da comarca de São Paulo/SP para dirimir dúvidas oriundas do presente contrato.</p>

            <div className="mt-8 grid grid-cols-2 gap-6 border-t border-neutral-200 pt-6 text-center text-[11px] text-neutral-600">
              <div>
                <Signature size={16} className="mx-auto text-neutral-400" />
                <p className="mt-1">{client || "{{CLIENT_NAME}}"}</p>
                <p className="text-[10px] text-neutral-400">CONTRATANTE</p>
              </div>
              <div>
                <Signature size={16} className="mx-auto text-neutral-400" />
                <p className="mt-1">Jordan Diaz</p>
                <p className="text-[10px] text-neutral-400">Studio One · CONTRATADO</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
