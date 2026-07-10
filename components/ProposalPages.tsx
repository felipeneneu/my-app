"use client";

import { useMemo } from "react";
import {
  Layers, Palette, Code2, Sparkles,
} from "lucide-react";

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

type CronogramaFluxo = { semanas: string[]; atividades: string };
type OrcamentoItem = { servico: string; valor: string };
type OpcaoPagamento = { nome: string; modalidade: string; descricao: string };

export type ProposalData = {
  configuracoes_layout?: Record<string, unknown>;
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
  totalPrice?: number;
};

type CompanyInfo = {
  tradingName: string;
  logo: string | null;
};

function formatBRL(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

const stageIcons: Record<string, React.ReactNode> = {
  BRANDING: <Layers size={28} />,
  "EXPERIÊNCIA DIGITAL": <Palette size={28} />,
  TECNOLOGIA: <Code2 size={28} />,
};

const stageAccents: Record<string, "emerald" | "violet"> = {
  BRANDING: "emerald",
  "EXPERIÊNCIA DIGITAL": "violet",
  TECNOLOGIA: "emerald",
};

function PageShell({ number, children }: { number: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-mono text-[10px] uppercase tracking-widest text-muted-foreground">{number}</p>
      <div className="aspect-[4/3] w-full overflow-hidden rounded-2xl border border-hairline bg-white shadow-2xl">
        {children}
      </div>
    </div>
  );
}

function CoverPage({ data, company }: { data: ProposalData; company?: CompanyInfo | null }) {
  const c = data.proposta.capa;
  return (
    <PageShell number="01 / Capa">
      <div className="flex h-full flex-col justify-between bg-gradient-to-br from-neutral-900 via-neutral-900 to-black p-10 text-neutral-50">
        <div>
          {company?.tradingName && (
            <p className="text-mono text-[10px] uppercase tracking-[0.3em] text-emerald-400">{company.tradingName}</p>
          )}
        </div>
        <div>
          <p className="text-mono text-[11px] uppercase tracking-widest text-neutral-400">{c.subtitulo}</p>
          <h1 className="mt-2 text-4xl font-black leading-tight text-white">{c.titulo}</h1>
          <div className="mt-8 grid grid-cols-3 gap-6 border-t border-neutral-700 pt-6">
            <div>
              <p className="text-mono text-[10px] uppercase tracking-widest text-neutral-500">Cliente</p>
              <p className="mt-1 text-sm font-semibold text-neutral-100">{c.metadados.cliente}</p>
            </div>
            {c.metadados.empresa && (
              <div>
                <p className="text-mono text-[10px] uppercase tracking-widest text-neutral-500">Empresa</p>
                <p className="mt-1 text-sm font-semibold text-neutral-100">{c.metadados.empresa}</p>
              </div>
            )}
            <div>
              <p className="text-mono text-[10px] uppercase tracking-widest text-neutral-500">Data</p>
              <p className="mt-1 text-sm font-semibold text-neutral-100">{c.metadados.data}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between text-[10px] font-mono uppercase text-neutral-500">
          <span>{data.proposta.assinatura.nome_prestador} · {data.proposta.assinatura.cargo}</span>
          <span>01</span>
        </div>
      </div>
    </PageShell>
  );
}

function IntroPage({ data }: { data: ProposalData }) {
  const i = data.proposta.introducao;
  if (!i.saudacao) return null;
  return (
    <PageShell number="02 / Introdução">
      <div className="flex h-full flex-col justify-center p-16 text-neutral-800">
        {data.proposta.assinatura.nome_prestador && (
          <p className="text-mono text-[10px] uppercase tracking-widest text-neutral-400">{data.proposta.assinatura.nome_prestador}</p>
        )}
        <p className="mt-10 text-2xl font-bold uppercase text-neutral-900">{i.saudacao}</p>
        {i.mensagem_destaque && (
          <p className="mt-4 max-w-lg text-2xl font-bold uppercase leading-snug text-neutral-900">{i.mensagem_destaque}</p>
        )}
      </div>
    </PageShell>
  );
}

function StageCoverPage({ etapa, index }: { etapa: Etapa; index: number }) {
  const accent = stageAccents[etapa.categoria] ?? "emerald";
  const icon = stageIcons[etapa.categoria] ?? <Layers size={28} />;
  const bg = accent === "emerald"
    ? "from-emerald-500/15 via-neutral-900 to-black"
    : "from-violet-500/15 via-neutral-900 to-black";
  const text = accent === "emerald" ? "text-emerald-400" : "text-violet-400";

  return (
    <PageShell number={`${String(index + 3).padStart(2, "0")} / ${etapa.categoria}`}>
      <div className={`flex h-full flex-col justify-center bg-gradient-to-br ${bg} p-16 text-neutral-50`}>
        <p className={`text-mono text-[11px] uppercase tracking-widest ${text}`}>Etapa {etapa.numero}</p>
        <div className={`mt-3 flex items-center gap-3 ${text}`}>{icon}</div>
        <h2 className="mt-3 text-5xl font-black uppercase leading-none text-white">{etapa.titulo}</h2>
      </div>
    </PageShell>
  );
}

function ConceptPage({ slide, pageNum }: { slide: Slide; pageNum: number }) {
  return (
    <PageShell number={`${String(pageNum).padStart(2, "0")} / ${slide.pergunta || "Conteúdo"}`}>
      <div className="flex h-full flex-col justify-center p-16 text-neutral-800">
        {slide.pergunta && <h2 className="text-lg font-bold uppercase text-neutral-900">{slide.pergunta}</h2>}
        {slide.conteudo && <p className="mt-6 max-w-xl text-[15px] leading-relaxed">{slide.conteudo}</p>}
      </div>
    </PageShell>
  );
}

function DoresPage({ slide, pageNum }: { slide: Slide; pageNum: number }) {
  return (
    <PageShell number={`${String(pageNum).padStart(2, "0")} / ${slide.pergunta || "Dores"}`}>
      <div className="flex h-full flex-col justify-center p-16 text-neutral-800">
        {slide.pergunta && <h2 className="text-lg font-bold uppercase text-neutral-900">{slide.pergunta}</h2>}
        {slide.paragrafos?.map((p, i) => (
          <p key={i} className="mt-4 max-w-xl text-[15px] leading-relaxed">{p}</p>
        ))}
      </div>
    </PageShell>
  );
}

function EntregaveisPage({ slide, pageNum }: { slide: Slide; pageNum: number }) {
  return (
    <PageShell number={`${String(pageNum).padStart(2, "0")} / ${slide.pergunta || "Entregáveis"}`}>
      <div className="flex h-full flex-col justify-center p-16 text-neutral-800">
        {slide.pergunta && <h2 className="text-lg font-bold uppercase text-neutral-900">{slide.pergunta}</h2>}
        <div className="mt-8 grid max-w-md grid-cols-2 gap-y-2 text-[14px]">
          {slide.itens?.map((item, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-neutral-900" />
              <div>
                <p className="font-semibold text-neutral-900">{item.titulo}</p>
                <p className="text-[12px] text-neutral-500">{item.descricao}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </PageShell>
  );
}

function CronogramaPage({ data, pageNum }: { data: ProposalData; pageNum: number }) {
  const crono = data.proposta.cronograma;
  if (crono.fluxo.length === 0) return null;
  return (
    <PageShell number={`${String(pageNum).padStart(2, "0")} / Cronograma`}>
      <div className="flex h-full flex-col justify-center p-16 text-neutral-800">
        <p className="text-mono text-[10px] uppercase tracking-widest text-neutral-400">Cronograma</p>
        <h2 className="mt-2 text-2xl font-black uppercase text-neutral-900">{crono.subtitulo}</h2>
        <div className="mt-6 overflow-hidden rounded-lg border border-neutral-200">
          {crono.fluxo.map((f, i) => (
            <div
              key={i}
              className={`grid grid-cols-[110px_1fr] gap-4 border-b border-neutral-200 px-4 py-2.5 text-[13px] last:border-b-0 ${
                i % 2 === 0 ? "bg-neutral-50" : "bg-white"
              }`}
            >
              <span className="font-semibold text-neutral-900">{f.semanas.join(", ")}</span>
              <span className="text-neutral-700">{f.atividades}</span>
            </div>
          ))}
        </div>
      </div>
    </PageShell>
  );
}

function InvestimentoPage({ data, pageNum }: { data: ProposalData; pageNum: number }) {
  const fin = data.proposta.financeiro;
  if (fin.orcamento_itens.length === 0) return null;
  const total = data.totalPrice ?? 0;
  const avista = Math.round(total * 0.9);
  const sinal = Math.round(total * 0.4);
  const parcela = Math.round((total - sinal) / 2);

  return (
    <PageShell number={`${String(pageNum).padStart(2, "0")} / Investimento`}>
      <div className="flex h-full flex-col justify-center p-16 text-neutral-800">
        <p className="text-mono text-[10px] uppercase tracking-widest text-neutral-400">{fin.titulo}</p>
        <div className="mt-8 flex flex-col gap-2 text-[15px]">
          {fin.orcamento_itens.filter(i => i.servico !== "TOTAL").map((item, i) => (
            <div key={i} className="flex items-baseline justify-between border-b border-dashed border-neutral-300 pb-2">
              <span className="uppercase">{item.servico}</span>
              <span className="text-mono font-semibold">{item.valor}</span>
            </div>
          ))}
          <div className="mt-2 flex items-baseline justify-between border-t-2 border-neutral-900 pt-3">
            <span className="text-lg font-black uppercase">Total</span>
            <span className="text-display text-2xl font-black">{formatBRL(total)}</span>
          </div>
        </div>

        <div className="mt-10">
          <p className="text-mono text-[10px] uppercase tracking-widest text-neutral-400">
            {fin.condicoes_pagamento.titulo}
          </p>
          <div className="mt-4 grid grid-cols-2 gap-4">
            {fin.condicoes_pagamento.opcoes.map((op, i) => (
              <div key={i} className={`rounded-xl border p-5 ${
                i === 0 ? "border-emerald-500/40 bg-emerald-50" : "border-neutral-300 bg-white"
              }`}>
                <p className={`text-[10px] font-mono uppercase ${
                  i === 0 ? "text-emerald-700" : "text-neutral-500"
                }`}>{op.nome} · {op.modalidade}</p>
                {i === 0 ? (
                  <p className="text-display mt-2 text-3xl font-black text-neutral-900">{formatBRL(avista)}</p>
                ) : (
                  <div className="mt-2">
                    <p className="text-[13px]">Sinal: <strong>{formatBRL(sinal)}</strong></p>
                    <p className="mt-1 text-[13px]">+ 2 parcelas de <strong>{formatBRL(parcela)}</strong></p>
                  </div>
                )}
                <p className="mt-1 text-[11px] text-neutral-600">{op.descricao}</p>
              </div>
            ))}
          </div>
          {fin.condicoes_pagamento.nota_rodape && (
            <p className="mt-4 max-w-md text-[11px] italic text-neutral-500">{fin.condicoes_pagamento.nota_rodape}</p>
          )}
        </div>
      </div>
    </PageShell>
  );
}

function ContatoPage({ data, company }: { data: ProposalData; company?: CompanyInfo | null }) {
  const a = data.proposta.assinatura;
  if (!a.nome_prestador) return null;
  return (
    <PageShell number="Contato">
      <div className="flex h-full flex-col items-center justify-center bg-neutral-900 p-16 text-neutral-100">
        <Sparkles size={22} className="text-emerald-400" />
        {company?.logo && (
          <img src={company.logo} alt="" className="mt-4 h-10 w-auto object-contain brightness-0 invert opacity-60" />
        )}
        <p className="text-display mt-4 text-2xl font-bold">{a.nome_prestador}</p>
        <p className="text-[13px] text-neutral-400">{a.cargo}</p>
        <div className="mt-6 flex flex-col items-center gap-1 text-[12px] text-neutral-300">
          {a.portfolio_url && <span>{a.portfolio_url}</span>}
          {a.contato_email && <span>{a.contato_email}</span>}
          {a.endereco && <span>{a.endereco}</span>}
        </div>
      </div>
    </PageShell>
  );
}

export function ProposalPages({ data, company }: { data: ProposalData; company?: CompanyInfo | null }) {
  const pages = useMemo(() => {
    const result: React.ReactNode[] = [];
    let pageNum = 3;

    result.push(<CoverPage key="cover" data={data} company={company} />);
    result.push(<IntroPage key="intro" data={data} />);

    data.proposta.etapas.forEach((etapa, ei) => {
      result.push(<StageCoverPage key={`stage-${etapa.id}`} etapa={etapa} index={ei} />);
      etapa.slides.forEach((slide) => {
        if (slide.tipo === "conceito") {
          result.push(<ConceptPage key={`${etapa.id}-concept-${pageNum}`} slide={slide} pageNum={pageNum} />);
        } else if (slide.tipo === "dores") {
          result.push(<DoresPage key={`${etapa.id}-dores-${pageNum}`} slide={slide} pageNum={pageNum} />);
        } else if (slide.tipo === "entregaveis") {
          result.push(<EntregaveisPage key={`${etapa.id}-entreg-${pageNum}`} slide={slide} pageNum={pageNum} />);
        }
        pageNum++;
      });
    });

    if (data.proposta.cronograma.fluxo.length > 0) {
      result.push(<CronogramaPage key="cronograma" data={data} pageNum={pageNum} />);
      pageNum++;
    }

    if (data.proposta.financeiro.orcamento_itens.length > 0) {
      result.push(<InvestimentoPage key="investimento" data={data} pageNum={pageNum} />);
      pageNum++;
    }

    result.push(<ContatoPage key="contato" data={data} company={company} />);

    return result;
  }, [data, company]);

  return (
    <div className="flex flex-col gap-6">
      <p className="text-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        Preview · {pages.length} páginas
      </p>
      {pages}
    </div>
  );
}
