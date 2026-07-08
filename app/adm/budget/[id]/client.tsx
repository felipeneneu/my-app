"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, Calculator, Check, Download, Printer, ExternalLink, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { approveBudget } from "@/lib/actions/budget";

function formatBRL(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2 });
}

type CompanyInfo = {
  tradingName: string;
  document: string;
  logo: string | null;
  street: string | null;
  number: string | null;
  neighborhood: string | null;
  city: string | null;
  state: string | null;
  bankName: string | null;
  bankAgency: string | null;
  bankAccount: string | null;
  pixKey: string | null;
  pixKeyType: string | null;
};

export function BudgetDetailClient({ budget, company }: {
  budget: { id: string; projectId: string; contentJson: string };
  company: CompanyInfo | null;
}) {
  const router = useRouter();
  const [approving, setApproving] = useState(false);
  const data = (() => { try { return JSON.parse(budget.contentJson); } catch { return {}; } })();
  const isApproved = data.status === "approved";

  const handleApprove = useCallback(async () => {
    setApproving(true);
    try {
      const result = await approveBudget(budget.id);
      toast.success("Orçamento aprovado!", { description: `Projeto "${data.clientName}" criado.` });
      router.push(`/adm/contract/${result.contract.id}`);
    } catch {
      toast.error("Erro ao aprovar orçamento");
    } finally {
      setApproving(false);
    }
  }, [budget.id, data.clientName, router]);

  const handlePrint = useCallback(() => window.print(), []);

  const handlePdf = useCallback(async () => {
    const html2canvas = (await import("html2canvas")).default;
    const jsPDF = (await import("jspdf")).default;
    const el = document.getElementById("budget-preview");
    if (!el) return;
    const canvas = await html2canvas(el, { scale: 2, useCORS: true });
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");
    const pw = pdf.internal.pageSize.getWidth();
    const ph = (canvas.height * pw) / canvas.width;
    pdf.addImage(imgData, "PNG", 0, 0, pw, ph);
    pdf.save(`orcamento-${data.clientName || "sem-nome"}.pdf`);
    toast.success("PDF gerado");
  }, [data.clientName]);

  return (
    <>
      <header className="flex items-center justify-between border-b border-hairline px-8 py-4 print:hidden">
        <div className="flex items-center gap-3">
          <Link href="/adm/budget" className="inline-flex items-center gap-1.5 rounded-md border border-hairline px-2 py-1 text-[11px] text-muted-foreground hover:text-foreground">
            <ArrowLeft size={12} /> Orçamentos
          </Link>
          <Calculator size={16} className="text-cyan-glow" />
          <p className="text-mono text-[11px] uppercase tracking-widest text-muted-foreground">
            Sprint OS / Orçamento
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handlePdf}>
            <Download size={14} /> PDF
          </Button>
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer size={14} /> Imprimir
          </Button>
          {!isApproved && (
            <Button size="sm" onClick={handleApprove} disabled={approving}>
              <Check size={14} /> {approving ? "Aprovando..." : "Aprovar Orçamento"}
            </Button>
          )}
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-8 py-8 print:px-0 print:py-0">
        <div id="budget-preview" className="rounded-2xl border border-hairline bg-white p-8 text-black print:border-none print:shadow-none">
          {/* Header with logo */}
          <div className="flex items-start justify-between border-b border-gray-200 pb-6">
            <div>
              {company?.logo && (
                <img src={company.logo} alt="Logo" className="mb-2 h-16 w-auto object-contain" />
              )}
              <h1 className="text-2xl font-bold text-gray-900">{company?.tradingName || "Studio One"}</h1>
              {company?.document && <p className="text-sm text-gray-500">CNPJ/CPF: {company.document}</p>}
              {company?.street && (
                <p className="text-sm text-gray-500">
                  {company.street}, {company.number} {company.neighborhood && `- ${company.neighborhood}`}
                  <br />{company.city}/{company.state}
                </p>
              )}
            </div>
            <div className="text-right">
              <p className="text-xs uppercase tracking-widest text-gray-400">Orçamento</p>
              <p className="text-lg font-bold text-gray-900">#{budget.id.slice(0, 8)}</p>
              <p className="text-sm text-gray-500">{data.createdAt ? new Date(data.createdAt).toLocaleDateString("pt-BR") : "—"}</p>
              <Badge className={isApproved ? "mt-1 bg-emerald-100 text-emerald-700" : "mt-1 bg-amber-100 text-amber-700"}>
                {isApproved ? "✓ Aprovado" : "⏳ Pendente"}
              </Badge>
            </div>
          </div>

          {/* Client */}
          <div className="border-b border-gray-200 py-6">
            <h2 className="text-xs uppercase tracking-widest text-gray-400 mb-1">Cliente</h2>
            <p className="text-lg font-medium text-gray-900">{data.clientName || "—"}</p>
            {data.clientDocument && <p className="text-sm text-gray-500">{data.clientDocument}</p>}
          </div>

          {/* Scope */}
          <div className="border-b border-gray-200 py-6">
            <h2 className="text-xs uppercase tracking-widest text-gray-400 mb-1">Escopo</h2>
            <p className="text-sm text-gray-700">{data.scope || "—"}</p>
          </div>

          {/* Pricing */}
          <div className="border-b border-gray-200 py-6">
            <h2 className="text-xs uppercase tracking-widest text-gray-400 mb-3">Investimento</h2>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-xs uppercase text-gray-400">
                  <th className="pb-2 font-medium">Descrição</th>
                  <th className="pb-2 text-right font-medium">Valor</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-50">
                  <td className="py-2 text-gray-700">Mão de obra ({data.hours || 0}h × {formatBRL(data.hourlyRate || 0)}/h)</td>
                  <td className="py-2 text-right text-gray-900">{formatBRL(data.laborCost || 0)}</td>
                </tr>
                <tr className="border-b border-gray-50">
                  <td className="py-2 text-gray-700">Custos extras (domínio, hospedagem, etc.)</td>
                  <td className="py-2 text-right text-gray-900">{formatBRL(data.extraCosts || 0)}</td>
                </tr>
                <tr>
                  <td className="py-3 text-base font-bold text-gray-900">Total</td>
                  <td className="py-3 text-right text-base font-bold text-gray-900">{formatBRL(data.totalPrice || 0)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Deliverables */}
          {data.deliverables && data.deliverables.length > 0 && (
            <div className="border-b border-gray-200 py-6">
              <h2 className="text-xs uppercase tracking-widest text-gray-400 mb-3">Entregas</h2>
              <ul className="list-inside list-disc text-sm text-gray-700">
                {data.deliverables.map((d: string, i: number) => (
                  <li key={i}>{d}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Payment */}
          <div className="border-b border-gray-200 py-6">
            <h2 className="text-xs uppercase tracking-widest text-gray-400 mb-3">Condições de Pagamento</h2>
            <p className="text-sm text-gray-700">50% no aceite da proposta · 50% na entrega final.</p>
            <p className="text-sm text-gray-500 mt-1">Prazo: {data.deadline || "—"}</p>
          </div>

          {/* Bank */}
          {company?.bankName && (
            <div className="border-b border-gray-200 py-6">
              <h2 className="text-xs uppercase tracking-widest text-gray-400 mb-3">Dados Bancários</h2>
              <p className="text-sm text-gray-700">
                {company.bankName} · Ag {company.bankAgency} · C/C {company.bankAccount}
              </p>
              {company.pixKey && (
                <p className="text-sm text-gray-700 mt-1">PIX ({company.pixKeyType}): {company.pixKey}</p>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="pt-6 text-center text-xs text-gray-400">
            <p>{company?.tradingName || "Studio One"} — Documento gerado em {new Date().toLocaleDateString("pt-BR")}</p>
          </div>
        </div>

        {/* Link to contract if approved */}
        {isApproved && (
          <div className="mt-6 print:hidden">
            <Link href="/adm/contract">
              <Button variant="outline" className="w-full">
                <FileText size={14} /> Ver Contrato Gerado
              </Button>
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
