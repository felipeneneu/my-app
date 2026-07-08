"use server";

function formatWaLink(phone: string | undefined | null): string | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 10) return null;
  return `https://wa.me/55${digits}`;
}

const templates: Record<
  string,
  { subject: (biz: string) => string; body: (biz: string) => string }
> = {
  pizzaria: {
    subject: (biz: string) =>
      `+18% em pedidos? Diagnóstico gratuito para ${biz || "sua pizzaria"} 🍕`,
    body: (biz: string) =>
      `Olá, equipe da ${biz || "[NEGÓCIO]"} 🍕

Sou Jordan, desenvolvedor especializado em sistemas para pizzarias que aumentam ticket médio via cardápio digital e WhatsApp integrado.

Analisei rapidamente o cardápio de vocês e identifiquei 3 oportunidades para +18% em pedidos nos próximos 30 dias:

  1. Cardápio digital com QR code na mesa e delivery unificado
  2. Fluxo de recompra automatizado via WhatsApp
  3. Painel de gestão em tempo real (produção + entregas)

Posso enviar um mini diagnóstico gratuito em vídeo (5 min) mostrando exatamente onde vocês estão perdendo pedidos hoje?

Abraço,
Jordan Diaz — Studio One`,
  },
  landing: {
    subject: (biz: string) =>
      `Landing page de alta conversão para ${biz || "seu negócio"} 👋`,
    body: (biz: string) =>
      `Olá, ${biz || "[NEGÓCIO]"} 👋

Sou Jordan, designer e dev full-stack. Construo landing pages de alta conversão (média de 12–24% CTR) em 7 dias úteis.

Vi que o site atual de vocês está deixando dinheiro na mesa em três pontos:

  • Hero sem promessa clara de valor
  • Nenhuma prova social acima da dobra
  • CTA único forçando decisão de alta fricção

Posso te mandar um Loom de 4 minutos com o redesenho conceitual da home — sem custo e sem compromisso.

Topa?

Jordan — Studio One`,
  },
  sistema: {
    subject: (biz: string) =>
      `Sistema web sob medida para ${biz || "sua empresa"} — chega de planilhas`,
    body: (biz: string) =>
      `Oi, time da ${biz || "[NEGÓCIO]"}!

Trabalho construindo sistemas web sob medida (dashboards, CRMs, plataformas SaaS internas) para empresas que já não cabem mais em planilhas.

Se vocês estão nesse ponto onde:
  – Excel virou fonte da verdade
  – Cada nova regra de negócio quebra o processo
  – A equipe perde 6h/semana em tarefas manuais

… normalmente entrego um MVP funcional em 3 semanas com stack moderno (React + TanStack + Postgres).

Rola uma call de 20 min essa semana pra eu entender o gargalo?

Abraço,
Jordan Diaz — Studio One`,
  },
  "follow-up": {
    subject: (biz: string) =>
      `Sobre ${biz || "sua proposta"} — posso ajudar com mais informações?`,
    body: (biz: string) =>
      `Olá, tudo bem?

Notei que não tive retorno sobre ${biz || "[NEGÓCIO]"}.

Sei que o dia a dia é corrido, então resolvi mandar esta mensagem para oferecer mais alguns detalhes que podem ajudar na sua decisão.

Se preferir, posso agendar uma call rápida de 15 min para alinharmos sem compromisso.

Fico à disposição!

Abraço,
Jordan Diaz — Studio One`,
  },
  proposal: {
    subject: (biz: string) =>
      `Proposta comercial — ${biz || "sua empresa"}`,
    body: (biz: string) =>
      `Olá!

Segue proposta comercial para ${biz || "[NEGÓCIO]"} conforme conversamos.

Desenvolvo soluções web sob medida com foco em resultados rápidos e escalabilidade. Tudo que combinamos está detalhado na proposta em anexo.

Pontos principais:
  • Escopo definido com entregas claras
  • Cronograma estimado
  • Investimento e condições de pagamento

Fico disponível para esclarecer qualquer dúvida e ajustar o que for necessário.

Abraço,
Jordan Diaz — Studio One`,
  },
};

export async function generateEmailContent(
  templateId: string,
  lead: { businessName?: string; email?: string; phone?: string; notes?: string }
) {
  const tpl = templates[templateId];
  if (!tpl) throw new Error(`Unknown template: ${templateId}`);

  const biz = lead.businessName?.trim() || "[NEGÓCIO]";

  return {
    subject: tpl.subject(biz),
    body: tpl.body(biz),
    waLink: formatWaLink(lead.phone),
  };
}
