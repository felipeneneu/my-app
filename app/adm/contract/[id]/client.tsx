"use client";

import { useRef, useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowLeft, FileSignature, Check, Printer, Download, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { approveContract } from "@/lib/actions/contract";

type ContractData = {
  id: string;
  projectId: string;
  contentJson: string;
};

type CompanyData = {
  tradingName: string;
  document: string;
  logo: string | null;
  street: string;
  number: string;
  neighborhood: string;
  city: string;
  state: string;
  bankName: string;
  bankAgency: string;
  bankAccount: string;
  pixKey: string;
  pixKeyType: string;
} | null;

function formatBRL(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function ContractDetailClient({ contract, company }: { contract: ContractData; company: CompanyData }) {
  const previewRef = useRef<HTMLDivElement>(null);
  const [approving, setApproving] = useState(false);
  const [receiptId, setReceiptId] = useState<string | null>(null);

  const data = useMemo(() => {
    try {
      return JSON.parse(contract.contentJson) as Record<string, unknown>;
    } catch {
      return null;
    }
  }, [contract.contentJson]);

  const isApproved = data?.status === "approved";

  const handleApprove = useCallback(async () => {
    setApproving(true);
    try {
      const result = await approveContract(contract.id);
      setReceiptId(result.receipt.id);
      toast.success("Contrato aprovado", {
        description: "Recibo gerado com sucesso.",
      });
    } catch {
      toast.error("Erro ao aprovar contrato");
    } finally {
      setApproving(false);
    }
  }, [contract.id]);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  const handleDownloadPdf = useCallback(async () => {
    if (!previewRef.current) return;
    const html2canvas = (await import("html2canvas")).default;
    const jsPDF = (await import("jspdf")).default;
    const canvas = await html2canvas(previewRef.current, { scale: 2, useCORS: true });
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({ format: "a4", unit: "mm" });
    const pdfW = pdf.internal.pageSize.getWidth();
    const pdfH = (canvas.height * pdfW) / canvas.width;
    pdf.addImage(imgData, "PNG", 0, 0, pdfW, pdfH);
    pdf.save(`contrato-${data?.clientName ?? "sem-nome"}.pdf`);
    toast.success("PDF baixado");
  }, [data]);

  if (!data) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-center">
        <p className="text-sm text-muted-foreground">Erro ao carregar dados do contrato</p>
        <Link href="/adm/contract">
          <Button variant="outline" size="sm"><ArrowLeft size={12} /> Voltar</Button>
        </Link>
      </div>
    );
  }

  const clientName = (data.clientName as string) ?? "—";
  const clientDocument = (data.clientDocument as string) ?? "";
  const scope = (data.scope as string) ?? "";
  const totalPrice = (data.totalPrice as number) ?? 0;
  const deliverables = (data.deliverables as string[]) ?? [];
  const deadline = (data.deadline as string) ?? "30 dias corridos";
  const createdAt = data.createdAt ? new Date(data.createdAt as string).toLocaleDateString("pt-BR") : "";

  return (
    <>
      <header className="flex items-center justify-between border-b border-hairline px-8 py-4 print:hidden">
        <div className="flex items-center gap-3">
          <Link href="/adm/contract" className="inline-flex items-center gap-1.5 rounded-md border border-hairline px-2 py-1 text-[11px] text-muted-foreground hover:text-foreground">
            <ArrowLeft size={12} /> Contratos
          </Link>
          <FileSignature size={16} className="text-emerald-glow" />
          <p className="text-mono text-[11px] uppercase tracking-widest text-muted-foreground">
            Contrato · {clientName}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isApproved ? (
            <Badge variant="default" className="gap-1">
              <Check size={10} /> Aprovado
            </Badge>
          ) : (
            <>
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer size={14} /> Imprimir
              </Button>
              <Button variant="outline" size="sm" onClick={handleDownloadPdf}>
                <Download size={14} /> PDF
              </Button>
              <Button size="sm" onClick={handleApprove} disabled={approving}>
                <Check size={14} /> {approving ? "Aprovando…" : "Aprovar Contrato"}
              </Button>
            </>
          )}
        </div>
      </header>

      {receiptId && (
        <div className="px-8 pt-4 print:hidden">
          <div className="flex items-center gap-3 rounded-xl border border-emerald-glow/30 bg-emerald-glow/5 px-4 py-3">
            <Check size={16} className="text-emerald-glow" />
            <p className="flex-1 text-sm text-emerald-glow">Recibo gerado automaticamente.</p>
            <Link href={`/adm/receipt/${receiptId}`}>
              <Button size="sm" variant="outline">
                <ExternalLink size={12} /> Ver Recibo
              </Button>
            </Link>
          </div>
        </div>
      )}

      <section className="px-8 py-6 print:px-0 print:py-0">
        <div ref={previewRef} className="mx-auto max-w-[210mm] rounded-2xl border border-hairline bg-white p-8 text-black shadow-sm print:rounded-none print:border-none print:shadow-none">
          <div className="flex items-start justify-between border-b border-gray-300 pb-6">
            <div>
              {company?.logo && (
                <img src={company.logo} alt={company.tradingName} className="mb-3 h-12 w-auto object-contain" />
              )}
              <h1 className="text-2xl font-bold text-gray-900">CONTRATO DE PRESTAÇÃO DE SERVIÇOS</h1>
              <p className="mt-1 text-sm text-gray-500">
                {clientName} {createdAt ? `· ${createdAt}` : ""}
              </p>
            </div>
            <div className="text-right text-sm text-gray-600">
              <p className="font-semibold">{company?.tradingName ?? "Studio One"}</p>
              {company?.document && <p className="text-xs">{company.document}</p>}
              {company?.street && (
                <p className="text-xs">{company.street}, {company.number} — {company.neighborhood}</p>
              )}
              {company?.city && <p className="text-xs">{company.city}/{company.state}</p>}
            </div>
          </div>

          <div className="py-6 space-y-4 text-sm text-gray-800">
            <Section title="1. DAS PARTES">
              <p><strong>CONTRATANTE:</strong> {clientName}{clientDocument ? `, inscrito(a) sob CPF/CNPJ nº ${clientDocument}` : ""}</p>
              <p><strong>CONTRATADO:</strong> {company?.tradingName ?? "Studio One"}, inscrito(a) sob CPF/CNPJ nº {company?.document ?? "—"}</p>
            </Section>

            <Section title="2. DO OBJETO">
              <p>O presente contrato tem por objeto a prestação de serviços de desenvolvimento e design, conforme escopo descrito a seguir:</p>
              <p className="mt-2 rounded-lg border border-gray-200 bg-gray-50 p-3 text-gray-700">{scope}</p>
            </Section>

            <Section title="3. DAS ENTREGAS">
              {deliverables.length > 0 ? (
                <ul className="list-disc pl-5 space-y-1">
                  {deliverables.map((d, i) => <li key={i}>{d}</li>)}
                </ul>
              ) : (
                <p>Conforme escopo acordado entre as partes.</p>
              )}
            </Section>

            <Section title="4. DO VALOR E CONDIÇÕES DE PAGAMENTO">
              <p>O valor total do presente contrato é de <strong>{formatBRL(totalPrice)}</strong>.</p>
              <p className="mt-1">Condições de pagamento: 50% no aceite da proposta e 50% na entrega final.</p>
            </Section>

            <Section title="5. DO PRAZO">
              <p>O prazo para execução dos serviços é de {deadline}, contados a partir da assinatura do presente contrato e pagamento da primeira parcela.</p>
            </Section>

            <Section title="6. DADOS BANCÁRIOS / PIX">
              {company?.pixKey ? (
                <p>PIX ({company.pixKeyType?.toUpperCase() ?? "CHAVE"}): <strong>{company.pixKey}</strong></p>
              ) : (
                <p>PIX: {company?.pixKey ?? "—"}</p>
              )}
              {company?.bankName && (
                <p className="mt-1">
                  Banco: {company.bankName} · Agência: {company.bankAgency} · Conta: {company.bankAccount}
                </p>
              )}
            </Section>
          </div>

          <div className="border-t border-gray-300 pt-6 text-center text-sm text-gray-500">
            <p className="mb-8">{createdAt}</p>
            <div className="flex justify-between">
              <div className="text-center">
                <div className="mb-2 h-px w-48 bg-gray-400 mx-auto" />
                <p className="font-semibold text-gray-700">{clientName}</p>
                <p className="text-xs">CONTRATANTE</p>
              </div>
              <div className="text-center">
                <div className="mb-2 h-px w-48 bg-gray-400 mx-auto" />
                <p className="font-semibold text-gray-700">{company?.tradingName ?? "Studio One"}</p>
                <p className="text-xs">CONTRATADO</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-base font-semibold text-gray-900 mb-2">{title}</h2>
      {children}
    </div>
  );
}
