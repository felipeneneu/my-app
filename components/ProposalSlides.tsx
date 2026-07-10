"use client";

import { useState, useMemo, useRef, useCallback } from "react";
import { ChevronLeft, ChevronRight, Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { generateProposalPdf } from "@/components/proposal-pdf";

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
  configuracoes_layout?: any;
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
  document?: string;
  street?: string | null;
  number?: string | null;
  neighborhood?: string | null;
  city?: string | null;
  state?: string | null;
};

function formatBRL(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2 });
}

function SlideFooter({ slideNum, totalSlides, company }: { slideNum: number; totalSlides: number; company?: CompanyInfo | null }) {
  return (
    <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between border-t border-white/10 bg-black/5 px-8 py-2 text-[10px] text-muted-foreground/60">
      <div className="flex items-center gap-2">
        {company?.logo && <img src={company.logo} alt="" className="h-4 w-auto object-contain opacity-50" />}
        {company?.tradingName && <span>{company.tradingName}</span>}
      </div>
      <span>{slideNum} / {totalSlides}</span>
    </div>
  );
}

function SlideConceito({ pergunta, conteudo, slideNum, totalSlides, company }: { pergunta?: string; conteudo?: string; slideNum: number; totalSlides: number; company?: CompanyInfo | null }) {
  return (
    <div className="relative flex h-full items-center" style={{ background: "linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #16213e 100%)" }}>
      <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "radial-gradient(circle at 25% 50%, #fff 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
      <div className="absolute left-0 top-0 h-full w-1.5 bg-gradient-to-b from-cyan-400 to-blue-600" />
      <div className="relative z-10 flex flex-col gap-5 px-14 py-12">
        {pergunta && <span className="inline-block rounded-full bg-cyan-500/15 px-4 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-400">{pergunta}</span>}
        {conteudo && <p className="text-xl leading-relaxed text-gray-200/90 max-w-3xl">{conteudo}</p>}
      </div>
      <SlideFooter slideNum={slideNum} totalSlides={totalSlides} company={company} />
    </div>
  );
}

function SlideDores({ pergunta, paragrafos, slideNum, totalSlides, company }: { pergunta?: string; paragrafos?: string[]; slideNum: number; totalSlides: number; company?: CompanyInfo | null }) {
  return (
    <div className="relative flex h-full items-center" style={{ background: "linear-gradient(135deg, #1a0f0f 0%, #2e1a1a 50%, #3e1616 100%)" }}>
      <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "radial-gradient(circle at 75% 30%, #fff 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
      <div className="absolute left-0 top-0 h-full w-1.5 bg-gradient-to-b from-rose-400 to-red-600" />
      <div className="relative z-10 flex flex-col gap-5 px-14 py-12">
        {pergunta && <span className="inline-block rounded-full bg-rose-500/15 px-4 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-rose-400">{pergunta}</span>}
        {paragrafos && (
          <div className="flex flex-col gap-4 max-w-3xl">
            {paragrafos.map((p, i) => (
              <p key={i} className="text-base leading-relaxed text-gray-300/85">{p}</p>
            ))}
          </div>
        )}
      </div>
      <SlideFooter slideNum={slideNum} totalSlides={totalSlides} company={company} />
    </div>
  );
}

function SlideEntregaveis({ pergunta, itens, slideNum, totalSlides, company }: { pergunta?: string; itens?: { titulo: string; descricao: string }[]; slideNum: number; totalSlides: number; company?: CompanyInfo | null }) {
  return (
    <div className="relative flex h-full items-center" style={{ background: "linear-gradient(135deg, #0f1a0f 0%, #1a2e1a 50%, #163e16 100%)" }}>
      <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "radial-gradient(circle at 50% 25%, #fff 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
      <div className="absolute left-0 top-0 h-full w-1.5 bg-gradient-to-b from-emerald-400 to-green-600" />
      <div className="relative z-10 flex flex-col gap-5 px-14 py-12 w-full">
        {pergunta && <span className="inline-block rounded-full bg-emerald-500/15 px-4 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-400 self-start">{pergunta}</span>}
        {itens && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {itens.map((item, i) => (
              <div key={i} className="rounded-xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
                <p className="text-sm font-bold text-emerald-300">{item.titulo}</p>
                <p className="mt-2 text-xs leading-relaxed text-gray-400">{item.descricao}</p>
              </div>
            ))}
          </div>
        )}
      </div>
      <SlideFooter slideNum={slideNum} totalSlides={totalSlides} company={company} />
    </div>
  );
}

function SlideCapa({ data, company }: { data: ProposalData["proposta"]["capa"]; company?: CompanyInfo | null }) {
  return (
    <div className="relative flex h-full flex-col items-center justify-center gap-6 p-12 text-center" style={{ background: "linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 50%, #0f0f1a 100%)" }}>
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-violet-500/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "radial-gradient(circle at 50% 50%, #fff 1px, transparent 1px)", backgroundSize: "30px 30px" }} />
      </div>
      <div className="relative z-10 flex flex-col items-center gap-4">
        {company?.logo && (
          <img src={company.logo} alt={company.tradingName} className="mb-2 h-16 w-auto object-contain brightness-0 invert opacity-80" />
        )}
        {company?.tradingName && (
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-gray-500">{company.tradingName}</p>
        )}
        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-cyan-400">{data.subtitulo}</p>
        <h1 className="text-7xl font-black tracking-tight text-white drop-shadow-lg">{data.titulo}</h1>
        <div className="mt-8 flex flex-col gap-1 text-sm text-gray-400">
          <p><span className="font-semibold text-gray-200">Cliente:</span> {data.metadados.cliente}</p>
          {data.metadados.empresa && <p><span className="font-semibold text-gray-200">Empresa:</span> {data.metadados.empresa}</p>}
          <p><span className="font-semibold text-gray-200">Data:</span> {data.metadados.data}</p>
        </div>
      </div>
    </div>
  );
}

function SlideIntroducao({ saudacao, mensagem_destaque, slideNum, totalSlides, company }: { saudacao: string; mensagem_destaque: string; slideNum: number; totalSlides: number; company?: CompanyInfo | null }) {
  return (
    <div className="relative flex h-full items-center" style={{ background: "linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #16213e 100%)" }}>
      <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "radial-gradient(circle at 25% 25%, #fff 1px, transparent 1px)", backgroundSize: "50px 50px" }} />
      <div className="absolute left-0 top-0 h-full w-1.5 bg-gradient-to-b from-violet-400 to-purple-600" />
      <div className="relative z-10 flex flex-col gap-6 px-14 py-12 max-w-4xl">
        <span className="inline-block rounded-full bg-violet-500/15 px-4 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-violet-400 self-start">introdução</span>
        <p className="text-3xl font-bold text-white">{saudacao}</p>
        <p className="text-lg leading-relaxed text-gray-300/80">{mensagem_destaque}</p>
      </div>
      <SlideFooter slideNum={slideNum} totalSlides={totalSlides} company={company} />
    </div>
  );
}

function SlideCronograma({ data, slideNum, totalSlides, company }: { data: ProposalData["proposta"]["cronograma"]; slideNum: number; totalSlides: number; company?: CompanyInfo | null }) {
  return (
    <div className="relative flex h-full items-center" style={{ background: "linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #16213e 100%)" }}>
      <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "radial-gradient(circle at 75% 75%, #fff 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
      <div className="absolute left-0 top-0 h-full w-1.5 bg-gradient-to-b from-violet-400 to-purple-600" />
      <div className="relative z-10 flex flex-col gap-5 px-14 py-12 w-full">
        <span className="inline-block rounded-full bg-violet-500/15 px-4 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-violet-400 self-start">{data.titulo}</span>
        {data.subtitulo && <p className="text-lg font-semibold text-white">{data.subtitulo}</p>}
        <div className="flex flex-col gap-3 max-w-3xl">
          {data.fluxo.map((f, i) => (
            <div key={i} className="flex items-start gap-4 rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
              <div className="flex shrink-0 flex-wrap items-center gap-1 min-w-[120px]">
                {f.semanas.map((s, j) => (
                  <span key={j} className="rounded bg-cyan-500/20 px-2 py-0.5 text-[10px] font-bold text-cyan-400">{s}</span>
                ))}
              </div>
              <div className="h-8 w-px bg-white/10" />
              <p className="text-sm text-gray-300/85">{f.atividades}</p>
            </div>
          ))}
        </div>
      </div>
      <SlideFooter slideNum={slideNum} totalSlides={totalSlides} company={company} />
    </div>
  );
}

function SlideFinanceiro({ financeiro, totalPrice, slideNum, totalSlides, company }: { financeiro: ProposalData["proposta"]["financeiro"]; totalPrice?: number; slideNum: number; totalSlides: number; company?: CompanyInfo | null }) {
  return (
    <div className="relative flex h-full items-center" style={{ background: "linear-gradient(135deg, #0f1a0f 0%, #1a2e1a 50%, #163e16 100%)" }}>
      <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "radial-gradient(circle at 25% 75%, #fff 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
      <div className="absolute left-0 top-0 h-full w-1.5 bg-gradient-to-b from-emerald-400 to-green-600" />
      <div className="relative z-10 flex flex-col gap-5 px-14 py-12 w-full">
        <span className="inline-block rounded-full bg-emerald-500/15 px-4 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-400 self-start">{financeiro.titulo}</span>
        <div className="rounded-xl border border-white/10 bg-white/5 max-w-2xl">
          {financeiro.orcamento_itens.map((item, i) => {
            const isTotal = item.servico === "TOTAL";
            return (
              <div key={i} className={cn("flex items-center justify-between px-6 py-3", i < financeiro.orcamento_itens.length - 1 && "border-b border-white/10")}>
                <p className={cn("text-sm", isTotal ? "font-bold text-emerald-300" : "text-gray-300/80")}>{item.servico}</p>
                <p className={cn("text-sm", isTotal ? "font-bold text-emerald-400 text-lg" : "text-gray-200")}>{item.valor}</p>
              </div>
            );
          })}
        </div>
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-5 max-w-2xl">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-400 mb-3">{financeiro.condicoes_pagamento.titulo}</p>
          <div className="flex flex-col gap-3">
            {financeiro.condicoes_pagamento.opcoes.map((op, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className="shrink-0 rounded-full bg-amber-500/20 px-2.5 py-0.5 text-[10px] font-bold text-amber-400">{op.nome}</span>
                <div>
                  <p className="text-sm font-semibold text-gray-200">{op.modalidade}</p>
                  <p className="text-xs text-gray-400">{op.descricao}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-3 text-[11px] text-gray-500 italic">{financeiro.condicoes_pagamento.nota_rodape}</p>
        </div>
      </div>
      <SlideFooter slideNum={slideNum} totalSlides={totalSlides} company={company} />
    </div>
  );
}

function SlideAssinatura({ data, slideNum, totalSlides, company }: { data: ProposalData["proposta"]["assinatura"]; slideNum: number; totalSlides: number; company?: CompanyInfo | null }) {
  return (
    <div className="relative flex h-full flex-col items-center justify-center gap-4 p-12 text-center" style={{ background: "linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 50%, #0f0f1a 100%)" }}>
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-500/5 blur-3xl" />
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "radial-gradient(circle at 50% 50%, #fff 1px, transparent 1px)", backgroundSize: "30px 30px" }} />
      </div>
      <div className="relative z-10 flex flex-col items-center gap-3">
        <div className="mb-2 h-px w-24 bg-gradient-to-r from-transparent via-violet-400 to-transparent" />
        {company?.logo && (
          <img src={company.logo} alt={company.tradingName} className="h-10 w-auto object-contain brightness-0 invert opacity-60" />
        )}
        <p className="text-2xl font-bold text-white">{data.nome_prestador}</p>
        <p className="text-sm text-gray-400">{data.cargo}</p>
        <div className="mt-4 flex flex-col gap-1 text-xs text-gray-500">
          <p>{data.portfolio_url}</p>
          <p>{data.contato_email}</p>
          <p>{data.endereco}</p>
        </div>
      </div>
      <SlideFooter slideNum={slideNum} totalSlides={totalSlides} company={company} />
    </div>
  );
}

function renderSlide(slide: Slide | null, data: ProposalData, totalPrice: number | undefined, slideNum: number, totalSlides: number, company: CompanyInfo | null | undefined) {
  if (!slide) return null;

  if (slide.tipo === "conceito") return <SlideConceito pergunta={slide.pergunta} conteudo={slide.conteudo} slideNum={slideNum} totalSlides={totalSlides} company={company} />;
  if (slide.tipo === "dores") return <SlideDores pergunta={slide.pergunta} paragrafos={slide.paragrafos} slideNum={slideNum} totalSlides={totalSlides} company={company} />;
  if (slide.tipo === "entregaveis") return <SlideEntregaveis pergunta={slide.pergunta} itens={slide.itens} slideNum={slideNum} totalSlides={totalSlides} company={company} />;
  return null;
}

export function ProposalSlides({
  data,
  totalPrice,
  company,
  onExportPdf,
}: {
  data: ProposalData;
  totalPrice?: number;
  company?: CompanyInfo | null;
  onExportPdf?: () => void;
}) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const slidesRef = useRef<HTMLDivElement>(null);

  const slides = useMemo(() => {
    const builders: ((sn: number, t: number) => { id: string; label: string; render: React.ReactNode })[] = [];

    builders.push((sn, t) => ({
      id: "capa", label: "Capa",
      render: <SlideCapa data={data.proposta.capa} company={company} />,
    }));

    if (data.proposta.introducao.saudacao) {
      builders.push((sn, t) => ({
        id: "intro", label: "Introdução",
        render: <SlideIntroducao saudacao={data.proposta.introducao.saudacao} mensagem_destaque={data.proposta.introducao.mensagem_destaque} slideNum={sn} totalSlides={t} company={company} />,
      }));
    }

    data.proposta.etapas.forEach((etapa) => {
      etapa.slides.forEach((slide, si) => {
        builders.push((sn, t) => ({
          id: `${etapa.id}-slide-${si}`,
          label: `${etapa.categoria} ${si + 1}`,
          render: renderSlide(slide, data, totalPrice, sn, t, company),
        }));
      });
    });

    if (data.proposta.cronograma.fluxo.length > 0) {
      builders.push((sn, t) => ({
        id: "cronograma", label: "Cronograma",
        render: <SlideCronograma data={data.proposta.cronograma} slideNum={sn} totalSlides={t} company={company} />,
      }));
    }

    if (data.proposta.financeiro.orcamento_itens.length > 0) {
      builders.push((sn, t) => ({
        id: "financeiro", label: "Investimento",
        render: <SlideFinanceiro financeiro={data.proposta.financeiro} totalPrice={totalPrice} slideNum={sn} totalSlides={t} company={company} />,
      }));
    }

    if (data.proposta.assinatura.nome_prestador) {
      builders.push((sn, t) => ({
        id: "assinatura", label: "Assinatura",
        render: <SlideAssinatura data={data.proposta.assinatura} slideNum={sn} totalSlides={t} company={company} />,
      }));
    }

    const total = builders.length;
    return builders.map((fn, i) => fn(i + 1, total));
  }, [data, totalPrice, company]);

  const current = slides[currentSlide];
  const total = slides.length;

  const [exportingPdf, setExportingPdf] = useState(false);

  const handleExportPdf = useCallback(async () => {
    if (exportingPdf) return;
    setExportingPdf(true);
    try {
      await generateProposalPdf(data, company);
    } catch (err) {
      console.error("PDF export error:", err);
    } finally {
      setExportingPdf(false);
    }
  }, [data, company, exportingPdf]);

  return (
    <div id="budget-slides" ref={slidesRef} className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-[11px] text-muted-foreground">
          {current?.label ?? ""} · {currentSlide + 1}/{total}
        </p>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="size-7" disabled={currentSlide === 0} onClick={() => setCurrentSlide(s => s - 1)}>
            <ChevronLeft size={14} />
          </Button>
          <Button variant="ghost" size="icon" className="size-7" disabled={currentSlide >= total - 1} onClick={() => setCurrentSlide(s => s + 1)}>
            <ChevronRight size={14} />
          </Button>
          <Button variant="outline" size="sm" onClick={onExportPdf ?? handleExportPdf} disabled={exportingPdf}>
            {exportingPdf ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />} {exportingPdf ? "Gerando..." : "PDF"}
          </Button>
        </div>
      </div>

      <div className="relative w-full" style={{ aspectRatio: "16 / 9" }}>
        <div className="slides-wrapper absolute inset-0 overflow-hidden rounded-2xl border border-hairline shadow-lg">
          {slides.map((slide, i) => (
            <div
              key={slide.id}
              data-slide-id={slide.id}

              className={cn(
                "absolute inset-0",
                i === currentSlide ? "opacity-100" : "opacity-0 pointer-events-none",
              )}
            >
              {slide.render}
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-center gap-1.5">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentSlide(i)}
            className={cn(
              "h-1.5 rounded-full transition-all",
              i === currentSlide ? "w-6 bg-foreground" : "w-1.5 bg-muted-foreground/30 hover:bg-muted-foreground/50",
            )}
          />
        ))}
      </div>
    </div>
  );
}
