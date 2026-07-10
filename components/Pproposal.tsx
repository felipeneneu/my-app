"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, Loader2, Download } from "lucide-react";
import { approvePublicBudget } from "@/lib/actions/public-budget";
import { generateProposalPdf } from "@/components/proposal-pdf";
import { cn } from "@/lib/utils";

type Slide = {
  tipo: string;
  pergunta?: string;
  conteudo?: string;
  paragrafos?: string[];
  itens?: { titulo: string; descricao: string }[];
};

type Etapa = {
  id: string;
  numero: number;
  categoria: string;
  titulo: string;
  slides: Slide[];
};

type CronogramaFluxo = {
  semanas: string[];
  atividades: string;
};

type OrcamentoItem = {
  servico: string;
  valor: string;
};

type OpcaoPagamento = {
  nome: string;
  modalidade: string;
  descricao: string;
};

type ProposalData = {
  proposta: {
    capa: { titulo: string; subtitulo: string; metadados: { cliente: string; empresa: string; data: string } };
    introducao: { saudacao: string; mensagem_destaque: string };
    etapas: Etapa[];
    cronograma: { titulo: string; subtitulo: string; fluxo: CronogramaFluxo[] };
    financeiro: {
      titulo: string;
      orcamento_itens: OrcamentoItem[];
      condicoes_pagamento: { titulo: string; opcoes: OpcaoPagamento[]; nota_rodape: string };
    };
    assinatura: { nome_prestador: string; cargo: string; portfolio_url: string; contato_email: string; endereco: string };
  };
};

type CompanyInfo = {
  tradingName: string;
  logo: string | null;
};

function formatBRL(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2 });
}

function SectionDivider() {
  return <div className="my-16 h-px bg-gray-200" />;
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-[10px] font-bold uppercase tracking-[0.3em] text-gray-400 mb-6">{children}</h2>;
}

function SlideConceito({ pergunta, conteudo }: { pergunta?: string; conteudo?: string }) {
  return (
    <div className="border-l-2 border-black pl-5 py-2">
      {pergunta && <p className="text-xs font-bold uppercase tracking-[0.15em] text-gray-500 mb-2">{pergunta}</p>}
      {conteudo && <p className="text-base leading-relaxed text-gray-800 max-w-3xl">{conteudo}</p>}
    </div>
  );
}

function SlideDores({ pergunta, paragrafos }: { pergunta?: string; paragrafos?: string[] }) {
  return (
    <div className="border-l-2 border-gray-400 pl-5 py-2">
      {pergunta && <p className="text-xs font-bold uppercase tracking-[0.15em] text-gray-500 mb-2">{pergunta}</p>}
      {paragrafos && (
        <div className="flex flex-col gap-3 max-w-3xl">
          {paragrafos.map((p, i) => (
            <p key={i} className="text-sm leading-relaxed text-gray-700">{p}</p>
          ))}
        </div>
      )}
    </div>
  );
}

function SlideEntregaveis({ pergunta, itens }: { pergunta?: string; itens?: { titulo: string; descricao: string }[] }) {
  return (
    <div className="border-l-2 border-gray-600 pl-5 py-2">
      {pergunta && <p className="text-xs font-bold uppercase tracking-[0.15em] text-gray-500 mb-3">{pergunta}</p>}
      {itens && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {itens.map((item, i) => (
            <div key={i} className="border border-gray-200 rounded-lg p-4">
              <p className="text-sm font-bold text-black">{item.titulo}</p>
              <p className="mt-1.5 text-xs leading-relaxed text-gray-600">{item.descricao}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function Pproposal({
  data,
  company,
  budgetId,
  status,
  approvedAt,
}: {
  data: ProposalData;
  company: CompanyInfo | null;
  budgetId: string;
  status: string;
  approvedAt: string | null;
}) {
  const router = useRouter();
  const [approving, setApproving] = useState(false);
  const [approved, setApproved] = useState(status === "approved");
  const [exportingPdf, setExportingPdf] = useState(false);

  const handleApprove = useCallback(async () => {
    if (!confirm("Tem certeza que deseja aprovar esta proposta?")) return;
    setApproving(true);
    try {
      await approvePublicBudget(budgetId);
      setApproved(true);
      toast.success("Proposta aprovada com sucesso!");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao aprovar proposta");
    } finally {
      setApproving(false);
    }
  }, [budgetId, router]);

  const handleDownloadPdf = useCallback(async () => {
    setExportingPdf(true);
    try {
      await generateProposalPdf(data, company);
      toast.success("PDF baixado!");
    } catch {
      toast.error("Erro ao gerar PDF");
    } finally {
      setExportingPdf(false);
    }
  }, [data, company]);

  const p = data.proposta;

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-8 lg:px-12 py-12 sm:py-16 lg:py-20">
      {/* Capa */}
      <section className="text-center py-12 sm:py-20">
        {company?.logo && (
          <img
            src={company.logo}
            alt={company.tradingName}
            className="mx-auto mb-6 h-14 w-auto object-contain opacity-90"
          />
        )}
        {company?.tradingName && (
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-gray-500 mb-4">
            {company.tradingName}
          </p>
        )}
        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-gray-400 mb-4">
          {p.capa.subtitulo}
        </p>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-black leading-tight">
          {p.capa.titulo}
        </h1>
        <div className="mt-10 flex flex-col gap-1.5 text-sm text-gray-500">
          <p><span className="font-semibold text-gray-700">Cliente:</span> {p.capa.metadados.cliente}</p>
          {p.capa.metadados.empresa && (
            <p><span className="font-semibold text-gray-700">Empresa:</span> {p.capa.metadados.empresa}</p>
          )}
          <p><span className="font-semibold text-gray-700">Data:</span> {p.capa.metadados.data}</p>
        </div>
      </section>

      <SectionDivider />

      {/* Introdução */}
      {p.introducao.saudacao && (
        <section>
          <SectionTitle>Introdução</SectionTitle>
          <p className="text-2xl font-bold text-black mb-4">{p.introducao.saudacao}</p>
          <p className="text-base leading-relaxed text-gray-700 max-w-3xl">{p.introducao.mensagem_destaque}</p>
        </section>
      )}

      {/* Etapas */}
      {p.etapas.map((etapa) => (
        <section key={etapa.id}>
          <SectionDivider />
          <SectionTitle>{etapa.categoria}</SectionTitle>
          <h3 className="text-lg font-bold text-black mb-6">{etapa.titulo}</h3>
          <div className="flex flex-col gap-6">
            {etapa.slides.map((slide, si) => {
              if (slide.tipo === "conceito") return <SlideConceito key={si} pergunta={slide.pergunta} conteudo={slide.conteudo} />;
              if (slide.tipo === "dores") return <SlideDores key={si} pergunta={slide.pergunta} paragrafos={slide.paragrafos} />;
              if (slide.tipo === "entregaveis") return <SlideEntregaveis key={si} pergunta={slide.pergunta} itens={slide.itens} />;
              return null;
            })}
          </div>
        </section>
      ))}

      {/* Cronograma */}
      {p.cronograma.fluxo.length > 0 && (
        <section>
          <SectionDivider />
          <SectionTitle>{p.cronograma.titulo}</SectionTitle>
          {p.cronograma.subtitulo && (
            <p className="text-base font-semibold text-black mb-4">{p.cronograma.subtitulo}</p>
          )}
          <div className="flex flex-col gap-3 max-w-3xl">
            {p.cronograma.fluxo.map((f, i) => (
              <div key={i} className="flex flex-col sm:flex-row sm:items-start gap-3 border border-gray-200 rounded-lg p-4">
                <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                  {f.semanas.map((s, j) => (
                    <span key={j} className="rounded bg-gray-200 px-2 py-0.5 text-[10px] font-bold text-gray-700">{s}</span>
                  ))}
                </div>
                <div className="hidden sm:block w-px bg-gray-200 self-stretch" />
                <p className="text-sm text-gray-700">{f.atividades}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Financeiro */}
      {p.financeiro.orcamento_itens.length > 0 && (
        <section>
          <SectionDivider />
          <SectionTitle>{p.financeiro.titulo}</SectionTitle>
          <div className="border border-gray-200 rounded-lg overflow-hidden max-w-2xl">
            {p.financeiro.orcamento_itens.map((item, i) => {
              const isTotal = item.servico === "TOTAL";
              return (
                <div
                  key={i}
                  className={cn(
                    "flex items-center justify-between px-5 py-3",
                    i < p.financeiro.orcamento_itens.length - 1 && "border-b border-gray-100",
                    isTotal && "bg-gray-50"
                  )}
                >
                  <p className={cn("text-sm", isTotal ? "font-bold text-black" : "text-gray-700")}>
                    {item.servico}
                  </p>
                  <p className={cn("text-sm", isTotal ? "font-bold text-black text-lg" : "text-gray-900")}>
                    {item.valor}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="mt-6 border border-gray-200 rounded-lg p-5 max-w-2xl">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500 mb-3">
              {p.financeiro.condicoes_pagamento.titulo}
            </p>
            <div className="flex flex-col gap-3">
              {p.financeiro.condicoes_pagamento.opcoes.map((op, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className="shrink-0 rounded bg-gray-200 px-2.5 py-0.5 text-[10px] font-bold text-gray-700">
                    {op.nome}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-black">{op.modalidade}</p>
                    <p className="text-xs text-gray-500">{op.descricao}</p>
                  </div>
                </div>
              ))}
            </div>
            {p.financeiro.condicoes_pagamento.nota_rodape && (
              <p className="mt-3 text-[11px] text-gray-400 italic">{p.financeiro.condicoes_pagamento.nota_rodape}</p>
            )}
          </div>
        </section>
      )}

      {/* Assinatura */}
      {p.assinatura.nome_prestador && (
        <section>
          <SectionDivider />
          <SectionTitle>Assinatura</SectionTitle>
          <div className="text-center py-8">
            <div className="mx-auto mb-6 h-px w-24 bg-gray-300" />
            {company?.logo && (
              <img
                src={company.logo}
                alt={company.tradingName}
                className="mx-auto mb-4 h-10 w-auto object-contain opacity-70"
              />
            )}
            <p className="text-xl font-bold text-black">{p.assinatura.nome_prestador}</p>
            <p className="text-sm text-gray-500">{p.assinatura.cargo}</p>
            <div className="mt-4 flex flex-col gap-1 text-xs text-gray-400">
              <p>{p.assinatura.portfolio_url}</p>
              <p>{p.assinatura.contato_email}</p>
              <p>{p.assinatura.endereco}</p>
            </div>
          </div>
        </section>
      )}

      <SectionDivider />

      {/* Approve / Status */}
      <section className="text-center py-8">
        {approved ? (
          <div className="inline-flex flex-col items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-black">
              <Check size={24} className="text-white" />
            </div>
            <p className="text-lg font-bold text-black">Proposta aprovada</p>
            {approvedAt && (
              <p className="text-sm text-gray-500">
                Aprovada em {new Date(approvedAt).toLocaleDateString("pt-BR")} às{" "}
                {new Date(approvedAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
              </p>
            )}
            <button
              onClick={handleDownloadPdf}
              disabled={exportingPdf}
              className="mt-2 inline-flex items-center gap-2 rounded-lg border border-gray-300 px-6 py-2.5 text-sm font-medium text-black transition-colors hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {exportingPdf ? (
                <><Loader2 size={14} className="animate-spin" /> Gerando PDF...</>
              ) : (
                <><Download size={14} /> Baixar PDF</>
              )}
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <p className="text-sm text-gray-500">
              Ao aprovar, você concorda com os termos e condições apresentados nesta proposta.
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={handleDownloadPdf}
                disabled={exportingPdf}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-6 py-3 text-sm font-medium text-black transition-colors hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {exportingPdf ? (
                  <><Loader2 size={16} className="animate-spin" /> Gerando PDF...</>
                ) : (
                  <><Download size={16} /> Baixar PDF</>
                )}
              </button>
              <button
                onClick={handleApprove}
                disabled={approving}
                className="inline-flex items-center gap-2 rounded-lg bg-black px-8 py-3 text-sm font-semibold text-white transition-colors hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {approving ? (
                  <><Loader2 size={16} className="animate-spin" /> Aprovando...</>
                ) : (
                  <><Check size={16} /> Aprovar Proposta</>
                )}
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Footer */}
      <p className="mt-12 text-center text-[10px] text-gray-400">
        {company?.tradingName || "Studio One"} — Proposta gerada em {new Date().toLocaleDateString("pt-BR")}
      </p>
    </div>
  );
}
