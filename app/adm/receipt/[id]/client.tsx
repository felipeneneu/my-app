"use client";

import { useRef, useMemo, useCallback } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowLeft, Receipt, Printer, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

type ReceiptData = {
  id: string;
  projectId: string | null;
  contentJson: string;
};

type CompanyData = {
  tradingName: string;
  document: string;
  logo: string | null;
} | null;

function formatBRL(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function ReceiptDetailClient({ receipt, company }: { receipt: ReceiptData; company: CompanyData }) {
  const previewRef = useRef<HTMLDivElement>(null);

  const data = useMemo(() => {
    try {
      return JSON.parse(receipt.contentJson) as Record<string, unknown>;
    } catch {
      return null;
    }
  }, [receipt.contentJson]);

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
    pdf.save(`recibo-${data?.clientName ?? "sem-nome"}.pdf`);
    toast.success("PDF baixado");
  }, [data]);

  if (!data) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-center">
        <p className="text-sm text-muted-foreground">Erro ao carregar dados do recibo</p>
        <Link href="/adm/receipt">
          <Button variant="outline" size="sm"><ArrowLeft size={12} /> Voltar</Button>
        </Link>
      </div>
    );
  }

  const clientName = (data.clientName as string) ?? "—";
  const clientDocument = (data.clientDocument as string) ?? "";
  const scope = (data.scope as string) ?? "";
  const totalPrice = (data.totalPrice as number) ?? 0;
  const approvedAt = data.approvedAt ? new Date(data.approvedAt as string).toLocaleDateString("pt-BR") : "";
  const createdAt = data.createdAt ? new Date(data.createdAt as string).toLocaleDateString("pt-BR") : "";

  return (
    <>
      <header className="flex items-center justify-between border-b border-hairline px-8 py-4 print:hidden">
        <div className="flex items-center gap-3">
          <Link href="/adm/receipt" className="inline-flex items-center gap-1.5 rounded-md border border-hairline px-2 py-1 text-[11px] text-muted-foreground hover:text-foreground">
            <ArrowLeft size={12} /> Recibos
          </Link>
          <Receipt size={16} className="text-violet-glow" />
          <p className="text-mono text-[11px] uppercase tracking-widest text-muted-foreground">
            Recibo · {clientName}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer size={14} /> Imprimir
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownloadPdf}>
            <Download size={14} /> PDF
          </Button>
        </div>
      </header>

      <section className="px-8 py-6 print:px-0 print:py-0">
        <div ref={previewRef} className="mx-auto max-w-[210mm] rounded-2xl border border-hairline bg-white p-8 text-black shadow-sm print:rounded-none print:border-none print:shadow-none">
          <div className="flex items-start justify-between border-b border-gray-300 pb-6">
            <div>
              {company?.logo && (
                <img src={company.logo} alt={company.tradingName} className="mb-3 h-12 w-auto object-contain" />
              )}
              <h1 className="text-2xl font-bold text-gray-900">RECIBO DE PAGAMENTO</h1>
              <p className="mt-1 text-sm text-gray-500">
                {clientName} {approvedAt ? `· ${approvedAt}` : ""}
              </p>
            </div>
            <div className="text-right text-sm text-gray-600">
              <p className="font-semibold">{company?.tradingName ?? "Studio One"}</p>
              {company?.document && <p className="text-xs">{company.document}</p>}
            </div>
          </div>

          <div className="py-8 space-y-4 text-sm text-gray-800">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-mono text-[10px] uppercase tracking-widest text-gray-400">Recebemos de</p>
                <p className="mt-1 font-semibold text-gray-900">{clientName}</p>
                {clientDocument && <p className="text-xs text-gray-500">CPF/CNPJ: {clientDocument}</p>}
              </div>
              <div className="text-right">
                <p className="text-mono text-[10px] uppercase tracking-widest text-gray-400">Emitente</p>
                <p className="mt-1 font-semibold text-gray-900">{company?.tradingName ?? "Studio One"}</p>
                {company?.document && <p className="text-xs text-gray-500">{company.document}</p>}
              </div>
            </div>

            <div className="border-t border-gray-200 pt-4">
              <p className="text-mono text-[10px] uppercase tracking-widest text-gray-400">Descrição</p>
              <p className="mt-1 text-gray-800">{scope || "Prestação de serviços de desenvolvimento e design."}</p>
            </div>

            <div className="border-t border-gray-200 pt-4">
              <p className="text-mono text-[10px] uppercase tracking-widest text-gray-400">Valor</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">{formatBRL(totalPrice)}</p>
            </div>

            <div className="border-t border-gray-200 pt-4 grid grid-cols-2 gap-4">
              <div>
                <p className="text-mono text-[10px] uppercase tracking-widest text-gray-400">Data de emissão</p>
                <p className="mt-1 text-gray-800">{createdAt || approvedAt}</p>
              </div>
              <div className="text-right">
                <p className="text-mono text-[10px] uppercase tracking-widest text-gray-400">Data de aprovação</p>
                <p className="mt-1 text-gray-800">{approvedAt}</p>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-300 pt-6 text-center text-sm text-gray-500">
            <div className="mb-2 h-px w-48 bg-gray-400 mx-auto" />
            <p className="font-semibold text-gray-700">{company?.tradingName ?? "Studio One"}</p>
            <p className="text-xs">Recebedor</p>
          </div>
        </div>
      </section>
    </>
  );
}
