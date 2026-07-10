"use client";

import React from "react";
import { Document, Page, Text, View, StyleSheet, pdf } from "@react-pdf/renderer";

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
  totalPrice?: number;
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

const COLORS = {
  bg: "#0f0f1a",
  text: "#ffffff",
  muted: "#9ca3af",
  accent: "#06b6d4",
  green: "#10b981",
  violet: "#8b5cf6",
  rose: "#f43f5e",
  amber: "#f59e0b",
  surface: "rgba(255,255,255,0.05)",
  border: "rgba(255,255,255,0.1)",
};

const s = StyleSheet.create({
  page: { padding: 0, backgroundColor: COLORS.bg, color: COLORS.text, fontFamily: "Helvetica" },
  cover: { flex: 1, justifyContent: "center", alignItems: "center", padding: 60 },
  coverTitle: { fontSize: 42, fontWeight: "bold", textAlign: "center", marginBottom: 12, color: COLORS.text },
  coverSubtitle: { fontSize: 9, fontWeight: "bold", textTransform: "uppercase", letterSpacing: 4, color: COLORS.accent, marginBottom: 24 },
  coverMeta: { fontSize: 10, color: COLORS.muted, textAlign: "center", marginTop: 30, lineHeight: 1.8 },
  coverMetaLabel: { fontWeight: "bold", color: "#e5e7eb" },

  section: { padding: "40 50", flex: 1 },
  sectionLabel: { fontSize: 8, fontWeight: "bold", textTransform: "uppercase", letterSpacing: 3, color: COLORS.accent, marginBottom: 14 },
  sectionLabelGreen: { fontSize: 8, fontWeight: "bold", textTransform: "uppercase", letterSpacing: 3, color: COLORS.green, marginBottom: 14 },
  sectionLabelViolet: { fontSize: 8, fontWeight: "bold", textTransform: "uppercase", letterSpacing: 3, color: COLORS.violet, marginBottom: 14 },
  sectionLabelRose: { fontSize: 8, fontWeight: "bold", textTransform: "uppercase", letterSpacing: 3, color: COLORS.rose, marginBottom: 14 },
  heading: { fontSize: 22, fontWeight: "bold", color: COLORS.text, marginBottom: 16 },
  body: { fontSize: 11, color: "#d1d5db", lineHeight: 1.7, maxWidth: 480 },

  card: { backgroundColor: COLORS.surface, border: `1 solid ${COLORS.border}`, borderRadius: 6, padding: "12 16", marginBottom: 10 },
  cardTitle: { fontSize: 10, fontWeight: "bold", color: COLORS.accent, marginBottom: 4 },
  cardDesc: { fontSize: 9, color: COLORS.muted, lineHeight: 1.5 },

  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: 20 },

  table: { marginBottom: 16 },
  tableRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 8, borderBottom: `1 solid rgba(255,255,255,0.05)` },
  tableRowLast: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 8 },
  tableCell: { fontSize: 10, color: "#d1d5db" },
  tableCellBold: { fontSize: 12, fontWeight: "bold", color: COLORS.green },

  timeline: { flexDirection: "row", alignItems: "flex-start", marginBottom: 10, backgroundColor: COLORS.surface, border: `1 solid ${COLORS.border}`, borderRadius: 6, padding: "10 14" },
  timelineWeeks: { flexDirection: "row", flexWrap: "wrap", gap: 4, minWidth: 100, marginRight: 14 },
  weekBadge: { backgroundColor: "rgba(6,182,212,0.2)", color: COLORS.accent, fontSize: 7, fontWeight: "bold", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 3 },
  timelineText: { fontSize: 9, color: "#d1d5db", flex: 1, lineHeight: 1.5 },

  paymentOption: { flexDirection: "row", alignItems: "flex-start", marginBottom: 10 },
  paymentBadge: { backgroundColor: "rgba(245,158,11,0.2)", color: COLORS.amber, fontSize: 7, fontWeight: "bold", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, marginRight: 10, minWidth: 50, textAlign: "center" },
  paymentTitle: { fontSize: 10, fontWeight: "bold", color: "#e5e7eb" },
  paymentDesc: { fontSize: 9, color: COLORS.muted, marginTop: 2 },

  footer: { padding: "16 50", alignItems: "center" },
  footerText: { fontSize: 8, color: COLORS.muted, textAlign: "center" },

  stamp: { marginTop: 40, alignItems: "center" },
  stampLine: { width: 80, height: 1, backgroundColor: COLORS.violet, marginBottom: 16 },
  stampName: { fontSize: 16, fontWeight: "bold", color: COLORS.text },
  stampRole: { fontSize: 9, color: COLORS.muted, marginTop: 4 },
  stampInfo: { fontSize: 8, color: COLORS.muted, marginTop: 10, lineHeight: 1.6, textAlign: "center" },
});

function CoverPage({ data, company }: { data: ProposalData; company?: CompanyInfo | null }) {
  const capa = data.proposta.capa;
  return (
    <Page size="A4" style={s.page} orientation="landscape">
      <View style={s.cover}>
        {company?.tradingName && (
          <Text style={{ fontSize: 9, fontWeight: "bold", textTransform: "uppercase", letterSpacing: 4, color: COLORS.muted, marginBottom: 20 }}>
            {company.tradingName}
          </Text>
        )}
        <Text style={s.coverSubtitle}>{capa.subtitulo}</Text>
        <Text style={s.coverTitle}>{capa.titulo}</Text>
        <View style={s.coverMeta}>
          <Text>
            <Text style={s.coverMetaLabel}>Cliente: </Text>
            {capa.metadados.cliente}
          </Text>
          {capa.metadados.empresa && (
            <Text>
              <Text style={s.coverMetaLabel}>Empresa: </Text>
              {capa.metadados.empresa}
            </Text>
          )}
          <Text>
            <Text style={s.coverMetaLabel}>Data: </Text>
            {capa.metadados.data}
          </Text>
        </View>
      </View>
      <View style={s.footer}>
        <Text style={s.footerText}>{company?.tradingName || "Studio One"} — Proposta Comercial</Text>
      </View>
    </Page>
  );
}

function IntroPage({ data }: { data: ProposalData }) {
  const intro = data.proposta.introducao;
  if (!intro.saudacao) return null;
  return (
    <Page size="A4" style={s.page} orientation="landscape">
      <View style={s.section}>
        <Text style={s.sectionLabelViolet}>INTRODUÇÃO</Text>
        <Text style={[s.heading, { fontSize: 28, marginBottom: 20 }]}>{intro.saudacao}</Text>
        <Text style={s.body}>{intro.mensagem_destaque}</Text>
      </View>
      <SlideFooter />
    </Page>
  );
}

function StageCoverPage({ etapa }: { etapa: Etapa; index: number }) {
  const accentColor = etapa.categoria === "BRANDING" ? COLORS.accent : etapa.categoria === "EXPERIÊNCIA DIGITAL" ? COLORS.violet : COLORS.green;
  return (
    <Page size="A4" style={s.page} orientation="landscape">
      <View style={{ flex: 1, justifyContent: "center", paddingLeft: 60 }}>
        <Text style={{ fontSize: 9, fontWeight: "bold", textTransform: "uppercase", letterSpacing: 4, color: accentColor, marginBottom: 8 }}>
          Etapa {etapa.numero}
        </Text>
        <Text style={{ fontSize: 40, fontWeight: "bold", color: COLORS.text, textTransform: "uppercase" }}>
          {etapa.titulo}
        </Text>
      </View>
      <View style={s.footer}>
        <Text style={s.footerText}>{etapa.categoria}</Text>
      </View>
    </Page>
  );
}

function EtapaPage({ etapa, slide, slideIdx, slideTotal }: { etapa: Etapa; slide: Slide; slideIdx: number; slideTotal: number }) {
  const accentColor = etapa.categoria === "BRANDING" ? COLORS.accent : etapa.categoria === "EXPERIÊNCIA DIGITAL" ? COLORS.violet : COLORS.green;
  const labelStyle = etapa.categoria === "BRANDING" ? s.sectionLabel : etapa.categoria === "EXPERIÊNCIA DIGITAL" ? s.sectionLabelViolet : s.sectionLabelGreen;

  return (
    <Page size="A4" style={s.page} orientation="landscape">
      <View style={s.section}>
        <Text style={labelStyle}>{etapa.categoria}</Text>
        <Text style={s.heading}>{etapa.titulo}</Text>

        {slide.tipo === "conceito" && (
          <View style={{ borderLeftWidth: 2, borderLeftColor: accentColor, paddingLeft: 16, marginTop: 10 }}>
            {slide.pergunta && <Text style={{ fontSize: 8, fontWeight: "bold", textTransform: "uppercase", letterSpacing: 2, color: COLORS.muted, marginBottom: 8 }}>{slide.pergunta}</Text>}
            <Text style={[s.body, { maxWidth: 520 }]}>{slide.conteudo}</Text>
          </View>
        )}

        {slide.tipo === "dores" && (
          <View style={{ borderLeftWidth: 2, borderLeftColor: COLORS.rose, paddingLeft: 16, marginTop: 10 }}>
            {slide.pergunta && <Text style={{ fontSize: 8, fontWeight: "bold", textTransform: "uppercase", letterSpacing: 2, color: COLORS.muted, marginBottom: 8 }}>{slide.pergunta}</Text>}
            {slide.paragrafos?.map((p, i) => (
              <Text key={i} style={[s.body, { marginBottom: 8 }]}>{p}</Text>
            ))}
          </View>
        )}

        {slide.tipo === "entregaveis" && (
          <View style={{ marginTop: 10 }}>
            {slide.pergunta && <Text style={{ fontSize: 8, fontWeight: "bold", textTransform: "uppercase", letterSpacing: 2, color: COLORS.muted, marginBottom: 12 }}>{slide.pergunta}</Text>}
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {slide.itens?.map((item, i) => (
                <View key={i} style={[s.card, { width: "30%", marginBottom: 0 }]}>
                  <Text style={s.cardTitle}>{item.titulo}</Text>
                  <Text style={s.cardDesc}>{item.descricao}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </View>
      <SlideFooter current={slideIdx} total={slideTotal} />
    </Page>
  );
}

function CronogramaPage({ data }: { data: ProposalData }) {
  const crono = data.proposta.cronograma;
  if (crono.fluxo.length === 0) return null;
  return (
    <Page size="A4" style={s.page} orientation="landscape">
      <View style={s.section}>
        <Text style={s.sectionLabelViolet}>{crono.titulo}</Text>
        <Text style={[s.heading, { marginBottom: 8 }]}>{crono.subtitulo}</Text>
        <View style={{ marginTop: 10 }}>
          {crono.fluxo.map((f, i) => (
            <View key={i} style={s.timeline}>
              <View style={s.timelineWeeks}>
                {f.semanas.map((w, j) => (
                  <Text key={j} style={s.weekBadge}>{w}</Text>
                ))}
              </View>
              <View style={{ width: 1, backgroundColor: COLORS.border, alignSelf: "stretch", marginRight: 14 }} />
              <Text style={s.timelineText}>{f.atividades}</Text>
            </View>
          ))}
        </View>
      </View>
      <SlideFooter />
    </Page>
  );
}

function FinanceiroPage({ data }: { data: ProposalData }) {
  const fin = data.proposta.financeiro;
  if (fin.orcamento_itens.length === 0) return null;
  return (
    <Page size="A4" style={s.page} orientation="landscape">
      <View style={s.section}>
        <Text style={s.sectionLabelGreen}>{fin.titulo}</Text>
        <View style={[s.table, { maxWidth: 420, backgroundColor: COLORS.surface, border: `1 solid ${COLORS.border}`, borderRadius: 6, padding: "8 16" }]}>
          {fin.orcamento_itens.map((item, i) => {
            const isTotal = item.servico === "TOTAL";
            const isLast = i === fin.orcamento_itens.length - 1;
            return (
              <View key={i} style={isLast ? s.tableRowLast : s.tableRow}>
                <Text style={isTotal ? { fontWeight: "bold", color: COLORS.green, fontSize: 10 } : s.tableCell}>{item.servico}</Text>
                <Text style={isTotal ? { fontWeight: "bold", color: COLORS.green, fontSize: 13 } : s.tableCell}>{item.valor}</Text>
              </View>
            );
          })}
        </View>

        <View style={{ maxWidth: 420, backgroundColor: "rgba(245,158,11,0.05)", border: `1 solid rgba(245,158,11,0.2)`, borderRadius: 6, padding: 16, marginTop: 12 }}>
          <Text style={{ fontSize: 8, fontWeight: "bold", textTransform: "uppercase", letterSpacing: 2, color: COLORS.amber, marginBottom: 12 }}>
            {fin.condicoes_pagamento.titulo}
          </Text>
          {fin.condicoes_pagamento.opcoes.map((op, i) => (
            <View key={i} style={s.paymentOption}>
              <Text style={s.paymentBadge}>{op.nome}</Text>
              <View style={{ flex: 1 }}>
                <Text style={s.paymentTitle}>{op.modalidade}</Text>
                <Text style={s.paymentDesc}>{op.descricao}</Text>
              </View>
            </View>
          ))}
          {fin.condicoes_pagamento.nota_rodape && (
            <Text style={{ fontSize: 8, color: COLORS.muted, marginTop: 8, fontStyle: "italic" }}>{fin.condicoes_pagamento.nota_rodape}</Text>
          )}
        </View>
      </View>
      <SlideFooter />
    </Page>
  );
}

function AssinaturaPage({ data, company }: { data: ProposalData; company?: CompanyInfo | null }) {
  const assinatura = data.proposta.assinatura;
  if (!assinatura.nome_prestador) return null;
  return (
    <Page size="A4" style={s.page} orientation="landscape">
      <View style={[s.section, { justifyContent: "center", alignItems: "center" }]}>
        <View style={s.stamp}>
          <View style={s.stampLine} />
          <Text style={s.stampName}>{assinatura.nome_prestador}</Text>
          <Text style={s.stampRole}>{assinatura.cargo}</Text>
          <View style={s.stampInfo}>
            {assinatura.portfolio_url && <Text>{assinatura.portfolio_url}</Text>}
            {assinatura.contato_email && <Text>{assinatura.contato_email}</Text>}
            {assinatura.endereco && <Text>{assinatura.endereco}</Text>}
          </View>
        </View>
      </View>
      <View style={s.footer}>
        <Text style={s.footerText}>{company?.tradingName || "Studio One"} — Proposta gerada em {data.proposta.capa.metadados.data}</Text>
      </View>
    </Page>
  );
}

function SlideFooter({ current, total }: { current?: number; total?: number }) {
  return (
    <View style={{ paddingHorizontal: 50, paddingBottom: 16, alignItems: "flex-end" }}>
      {current !== undefined && total !== undefined && (
        <Text style={{ fontSize: 8, color: COLORS.muted }}>{current + 1} / {total}</Text>
      )}
    </View>
  );
}

function ProposalDocument({ data, company }: { data: ProposalData; company?: CompanyInfo | null }) {
  return (
    <Document>
      <CoverPage data={data} company={company} />
      <IntroPage data={data} />
      {data.proposta.etapas.map((etapa, ei) => (
        <React.Fragment key={etapa.id}>
          <StageCoverPage etapa={etapa} index={ei} />
          {etapa.slides.map((slide, si) => (
            <EtapaPage
              key={`${etapa.id}-slide-${si}`}
              etapa={etapa}
              slide={slide}
              slideIdx={si}
              slideTotal={etapa.slides.length}
            />
          ))}
        </React.Fragment>
      ))}
      <CronogramaPage data={data} />
      <FinanceiroPage data={data} />
      <AssinaturaPage data={data} company={company} />
    </Document>
  );
}

export async function generateProposalPdf(data: ProposalData, company?: CompanyInfo | null) {
  const blob = await pdf(
    <ProposalDocument data={data} company={company} />
  ).toBlob();

  const name = data.proposta.capa.metadados.cliente
    .replace(/\s+/g, "-")
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "") || "proposta";

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `proposta-${name}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export { ProposalDocument };
