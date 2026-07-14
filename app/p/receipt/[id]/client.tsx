"use client";

import { useMemo } from "react";

type CompanyData = {
  tradingName: string;
  document: string;
  logo: string | null;
  pixKey: string;
  pixKeyType: string;
  merchantCity: string;
} | null;

function formatBRL(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function PublicReceiptClient({
  receipt,
  company,
}: {
  receipt: { id: string; contentJson: string };
  company: CompanyData;
}) {
  const data = useMemo(() => {
    try {
      return JSON.parse(receipt.contentJson) as Record<string, unknown>;
    } catch {
      return null;
    }
  }, [receipt.contentJson]);

  if (!data) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-center">
        <p className="text-sm text-muted-foreground">Erro ao carregar dados do recibo</p>
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
    <div className="mx-auto max-w-[210mm] px-4 py-12 sm:px-8 sm:py-16 lg:px-12 lg:py-20">
      <div className="rounded-2xl border border-gray-200 bg-white p-8 text-black shadow-sm">
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

        <div className="space-y-4 py-8 text-sm text-gray-800">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">Recebemos de</p>
              <p className="mt-1 font-semibold text-gray-900">{clientName}</p>
              {clientDocument && <p className="text-xs text-gray-500">CPF/CNPJ: {clientDocument}</p>}
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">Emitente</p>
              <p className="mt-1 font-semibold text-gray-900">{company?.tradingName ?? "Studio One"}</p>
              {company?.document && <p className="text-xs text-gray-500">{company.document}</p>}
            </div>
          </div>

          <div className="border-t border-gray-200 pt-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">Descrição</p>
            <p className="mt-1 text-gray-800">{scope || "Prestação de serviços de desenvolvimento e design."}</p>
          </div>

          <div className="border-t border-gray-200 pt-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">Valor</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">{formatBRL(totalPrice)}</p>
          </div>

          {company?.pixKey && (
            <div className="border-t border-gray-200 pt-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 mb-3">Pagamento via PIX</p>
              <div className="space-y-1 text-xs text-gray-600">
                <p><span className="font-semibold">Chave:</span> {company.pixKey}</p>
                <p><span className="font-semibold">Tipo:</span> {company.pixKeyType.toUpperCase()}</p>
                <p><span className="font-semibold">Valor:</span> {formatBRL(totalPrice)}</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 border-t border-gray-200 pt-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">Data de emissão</p>
              <p className="mt-1 text-gray-800">{createdAt || approvedAt}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">Data de aprovação</p>
              <p className="mt-1 text-gray-800">{approvedAt}</p>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-300 pt-6 text-center text-sm text-gray-500">
          <div className="mx-auto mb-2 h-px w-48 bg-gray-400" />
          <p className="font-semibold text-gray-700">{company?.tradingName ?? "Studio One"}</p>
          <p className="text-xs">Recebedor</p>
        </div>
      </div>
    </div>
  );
}
