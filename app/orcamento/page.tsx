"use client";

import { useMemo, useState, useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";
import {
  Calculator, Download, Sparkles, Layers, Code2, Palette,
  CalendarDays, Wallet, Loader2, Search, Check, X, User, ChevronDown,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { ReactNode } from "react";
import { getClients } from "@/lib/actions/clients";
import { getCompany } from "@/lib/actions/company";


const PROJECT_TYPES = [
  { id: "landing", label: "Landing Page" },
  { id: "uiux", label: "UI/UX Design" },
  { id: "sistema", label: "Sistema Web" },
  { id: "identidade", label: "Identidade Visual" },
  { id: "branding", label: "Branding Completo" },
  { id: "app", label: "Aplicativo Mobile" },
  { id: "api", label: "API / Back-end" },
  { id: "consultoria", label: "Consultoria Digital" },
] as const;

function formatBRL(v: number) {
  return v.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

type ClientData = { id: string; name: string; email: string | null; phone: string | null; document: string | null };

export default function Quotations() {
  const [clients, setClients] = useState<ClientData[]>([]);
  const [companyData, setCompanyData] = useState<{ tradingName: string; logo: string | null } | null>(null);

  useEffect(() => {
    getClients().then(setClients).catch(() => {});
    getCompany().then(setCompanyData).catch(() => {});
  }, []);

  const [clientName, setClientName] = useState("");
  const [clientCompany, setClientCompany] = useState("");
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const [selectedTypes, setSelectedTypes] = useState<string[]>(["landing", "uiux", "sistema"]);
  const [problem, setProblem] = useState(
    "A empresa nasceu para oferecer algo diferente, porém tem dificuldade em comunicar isso na web, o que reduz o interesse de novos clientes e trava a conversão."
  );
  const [solution, setSolution] = useState(
    "Vamos entregar uma presença digital clara e comercial: uma landing page focada em conversão, um sistema de gestão online e um painel administrativo simples para acompanhar leads e clientes ativos."
  );

  const [priceStrategy, setPriceStrategy] = useState(4800);
  const [priceDesign, setPriceDesign] = useState(6200);
  const [priceDev, setPriceDev] = useState(9800);


  const [weeks, setWeeks] = useState(9);
  const [startDate, setStartDate] = useState("05/10/2026");
  const [endDate, setEndDate] = useState("18/12/2026");

  const [exportingPdf, setExportingPdf] = useState(false);
  const previewPagesRef = useRef<HTMLDivElement>(null);

  // Collapsible cards state
  const [openCards, setOpenCards] = useState<Record<string, boolean>>({
    client: true,
    pricing: true,
    schedule: true,
  });

  function toggleCard(key: string) {
    setOpenCards(prev => ({ ...prev, [key]: !prev[key] }));
  }

  const total = priceStrategy + priceDesign + priceDev;
  const avista = Math.round(total * 0.9);
  const sinal = Math.round(total * 0.4);
  const parcela = Math.round((total - sinal) / 2);

  const projectTypeLabel = useMemo(() => {
    return selectedTypes
      .map(id => PROJECT_TYPES.find(t => t.id === id)?.label)
      .filter(Boolean)
      .join(" / ") || "PROPOSTA PERSONALIZADA";
  }, [selectedTypes]);

  const today = useMemo(
    () =>
      new Date().toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      }),
    [],
  );

  const filteredClients = useMemo(
    () => clients.filter(c =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.email && c.email.toLowerCase().includes(searchQuery.toLowerCase()))
    ),
    [clients, searchQuery],
  );

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowClientDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleSelectClient(c: ClientData) {
    setClientName(c.name);
    setSelectedClientId(c.id);
    setSearchQuery(c.name);
    setShowClientDropdown(false);
  }

  function handleClearClient() {
    setClientName("");
    setSelectedClientId(null);
    setSearchQuery("");
    setShowClientDropdown(false);
  }

  function toggleType(typeId: string) {
    setSelectedTypes(prev =>
      prev.includes(typeId) ? prev.filter(id => id !== typeId) : [...prev, typeId]
    );
  }

  const stripLabSupports = useCallback(() => {
    for (let i = 0; i < document.styleSheets.length; i++) {
      try {
        const sheet = document.styleSheets[i];
        for (let j = sheet.cssRules.length - 1; j >= 0; j--) {
          const rule = sheet.cssRules[j];
          if (
            rule instanceof CSSSupportsRule &&
            rule.conditionText.includes("lab(")
          ) {
            sheet.deleteRule(j);
          }
        }
      } catch {
        /* cross-origin stylesheet */
      }
    }
  }, []);

  const exportPdf = useCallback(async () => {
    if (!clientName.trim()) {
      toast.error("Selecione ou informe o nome do cliente");
      return;
    }
    setExportingPdf(true);
    try {
      const html2canvas = (await import("html2canvas")).default;
      const { jsPDF } = await import("jspdf");

      const container = previewPagesRef.current;
      if (!container) throw new Error("Preview não encontrado");

      const pages = container.querySelectorAll<HTMLElement>("[data-pdf-page]");
      if (pages.length === 0) throw new Error("Nenhuma página encontrada");

      stripLabSupports();

      const pdf = new jsPDF({ orientation: "landscape", unit: "px", format: [1920, 1080] });

      for (let i = 0; i < pages.length; i++) {
        const canvas = await html2canvas(pages[i], {
          scale: 2,
          useCORS: true,
          backgroundColor: null,
          logging: false,
        });

        const imgData = canvas.toDataURL("image/png");
        if (i > 0) pdf.addPage([1920, 1080], "landscape");
        pdf.addImage(imgData, "PNG", 0, 0, 1920, 1080);
      }

      const name = clientName.replace(/\s+/g, "-").toLowerCase().replace(/[^a-z0-9-]/g, "") || "proposta";
      pdf.save(`proposta-${name}.pdf`);
      toast.success("PDF gerado com sucesso!");
    } catch (err) {
      console.error(err);
      toast.error("Erro ao gerar PDF");
    } finally {
      setExportingPdf(false);
    }
  }, [clientName, stripLabSupports]);

  const schedule = [
    { w: "Semana 1", d: "Kickoff, briefing e coleta de referências." },
    { w: "Semana 2", d: "Desenvolvimento da estratégia e reuniões com a equipe." },
    { w: "Semana 3", d: "Definição de escopo funcional e arquitetura de informação." },
    { w: "Semana 4", d: "Finalização da estratégia e entrega do guia." },
    { w: "Semana 5", d: "Início do projeto de UI/UX · wireframes." },
    { w: "Semana 6", d: "Desenvolvimento do design de interface e protótipo." },
    { w: "Semana 7", d: "Implementação front-end e integrações." },
    { w: "Semana 8", d: "Apresentação, ajustes e QA." },
    { w: "Semana 9", d: "Deploy, handover e documentação técnica." },
  ];

  return (
    <div className="flex h-screen flex-col overflow-y-auto bg-(--surface-0)">
      <header className="flex shrink-0 items-center justify-between border-b border-hairline px-8 py-4">
        <div className="flex items-center gap-3">
          <Calculator size={16} className="text-emerald-glow" />
          <p className="text-mono text-[11px] uppercase tracking-widest text-muted-foreground">
            Sprint OS / Propostas Comerciais
          </p>
        </div>
        <Button
          onClick={exportPdf}
          disabled={exportingPdf}
          className="gap-2 bg-emerald-glow text-[color:var(--surface-0)] hover:brightness-110"
        >
          {exportingPdf ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
          {exportingPdf ? "Gerando..." : "Exportar PDF"}
        </Button>
      </header>

      <section className="grid flex-1 grid-cols-1 gap-6 px-8 py-6 2xl:grid-cols-[380px_1fr]">
        {/* Editor */}
        <ScrollArea className="pr-2 h-full">
          <div className="flex flex-col gap-4">
          {/* Client search */}
          <div className="rounded-2xl border border-hairline bg-[color:var(--surface-1)]">
            <button
              onClick={() => toggleCard("client")}
              className="flex w-full items-center justify-between p-5"
            >
              <p className="text-mono text-[10px] uppercase tracking-widest text-emerald-glow">
                Dados do cliente
              </p>
              <ChevronDown
                size={14}
                className={`text-muted-foreground transition-transform duration-200 ${openCards.client ? "rotate-180" : ""}`}
              />
            </button>
            {openCards.client && (
              <div className="px-5 pb-5">
                <div className="flex flex-col gap-3">
                  <div ref={searchRef} className="relative">
                <Label className="text-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  Cliente
                </Label>
                <div className="relative mt-1.5">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setShowClientDropdown(true);
                      if (!e.target.value) handleClearClient();
                    }}
                    onFocus={() => setShowClientDropdown(true)}
                    placeholder="Buscar cliente..."
                    className="border-hairline bg-[color:var(--surface-2)] pl-9 pr-8"
                  />
                  {searchQuery && (
                    <button
                      onClick={handleClearClient}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
                {showClientDropdown && searchQuery && (
                  <div className="absolute z-50 mt-1 w-full rounded-lg border border-hairline bg-[color:var(--surface-1)] shadow-lg">
                    {filteredClients.length > 0 ? (
                      <div className="max-h-48 overflow-y-auto p-1">
                        {filteredClients.map((c) => (
                          <button
                            key={c.id}
                            onClick={() => handleSelectClient(c)}
                            className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm hover:bg-[color:var(--surface-2)]"
                          >
                            <User size={14} className="shrink-0 text-muted-foreground" />
                            <div className="min-w-0 flex-1">
                              <p className="truncate font-medium">{c.name}</p>
                              {c.email && (
                                <p className="truncate text-[11px] text-muted-foreground">{c.email}</p>
                              )}
                            </div>
                            {selectedClientId === c.id && <Check size={14} className="shrink-0 text-emerald-glow" />}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="px-3 py-4 text-center text-sm text-muted-foreground">
                        Nenhum cliente encontrado
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div>
                <Label className="text-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  Empresa
                </Label>
                <Input
                  value={clientCompany}
                  onChange={(e) => setClientCompany(e.target.value)}
                  className="mt-1.5 border-hairline bg-[color:var(--surface-2)]"
                />
              </div>
              <div>
                <Label className="text-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  Tipo de projeto
                </Label>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {PROJECT_TYPES.map((type) => (
                    <label
                      key={type.id}
                      className="flex cursor-pointer items-center gap-2 rounded-lg border border-hairline bg-[color:var(--surface-2)] px-3 py-2 text-sm transition-colors hover:border-emerald-glow/50 data-[checked]:border-emerald-glow/50 data-[checked]:bg-emerald-glow/5"
                    >
                      <Checkbox
                        checked={selectedTypes.includes(type.id)}
                        onCheckedChange={() => toggleType(type.id)}
                      />
                      <span className="text-[12px]">{type.label}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <Label className="text-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  Dor a ser resolvida
                </Label>
                <Textarea
                  value={problem}
                  onChange={(e) => setProblem(e.target.value)}
                  rows={4}
                  className="mt-1.5 border-hairline bg-[color:var(--surface-2)] text-xs"
                />
              </div>
              <div>
                <Label className="text-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  Solução proposta
                </Label>
                <Textarea
                  value={solution}
                  onChange={(e) => setSolution(e.target.value)}
                  rows={4}
                  className="mt-1.5 border-hairline bg-[color:var(--surface-2)] text-xs"
                />
              </div>
            </div>
              </div>
            )}
          </div>

          {/* Prices */}
          <div className="rounded-2xl border border-hairline bg-[color:var(--surface-1)]">
            <button
              onClick={() => toggleCard("pricing")}
              className="flex w-full items-center justify-between p-5"
            >
              <p className="text-mono text-[10px] uppercase tracking-widest text-violet-glow">
                Investimento por etapa
              </p>
              <ChevronDown
                size={14}
                className={`text-muted-foreground transition-transform duration-200 ${openCards.pricing ? "rotate-180" : ""}`}
              />
            </button>
            {openCards.pricing && (
              <div className="px-5 pb-5">
                <div className="grid grid-cols-1 gap-3">
              <PriceField label="Estratégia / Descoberta" value={priceStrategy} onChange={setPriceStrategy} />
              <PriceField label="UI/UX Design" value={priceDesign} onChange={setPriceDesign} />
              <PriceField label="Desenvolvimento Web" value={priceDev} onChange={setPriceDev} />
            </div>
            <div className="mt-4 flex items-baseline justify-between border-t border-hairline pt-3">
              <p className="text-mono text-[11px] uppercase tracking-widest text-muted-foreground">
                Total
              </p>
              <p className="text-display text-2xl text-emerald-glow">{formatBRL(total)}</p>
            </div>
              </div>
            )}
          </div>

          {/* Schedule */}
          <div className="rounded-2xl border border-hairline bg-[color:var(--surface-1)]">
            <button
              onClick={() => toggleCard("schedule")}
              className="flex w-full items-center justify-between p-5"
            >
              <p className="text-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                Cronograma
              </p>
              <ChevronDown
                size={14}
                className={`text-muted-foreground transition-transform duration-200 ${openCards.schedule ? "rotate-180" : ""}`}
              />
            </button>
            {openCards.schedule && (
              <div className="px-5 pb-5">
                <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-mono text-[10px] uppercase text-muted-foreground">Início</Label>
                <Input
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="mt-1.5 border-hairline bg-[color:var(--surface-2)]"
                />
              </div>
              <div>
                <Label className="text-mono text-[10px] uppercase text-muted-foreground">Entrega</Label>
                <Input
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="mt-1.5 border-hairline bg-[color:var(--surface-2)]"
                />
              </div>
              <div className="col-span-2">
                <Label className="text-mono text-[10px] uppercase text-muted-foreground">
                  Prazo (semanas)
                </Label>
                <Input
                  type="number"
                  value={weeks}
                  onChange={(e) => setWeeks(Number(e.target.value) || 0)}
                  className="mt-1.5 border-hairline bg-[color:var(--surface-2)]"
                />
              </div>
            </div>
              </div>
            )}
          </div>
          </div>
        </ScrollArea>

        {/* Preview */}
        <div className="flex flex-col gap-4 pl-2">
          <div className="flex items-center justify-between">
            <p className="text-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              Preview da proposta · {weeks} páginas
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={exportPdf}
              disabled={exportingPdf}
              className="gap-1.5"
            >
              {exportingPdf ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />}
              Exportar
            </Button>
          </div>

          <div ref={previewPagesRef} className="flex flex-col gap-6 pb-8">
            {/* PAGE 1 · Cover */}
            <ProposalPage number="01 / Capa">
              <div className="flex h-full flex-col justify-between bg-white p-12 text-neutral-900">
                <div>
                  <p className="text-mono text-[10px] uppercase tracking-[0.3em] text-emerald-600">
                    {companyData?.tradingName || "studio one®"}
                  </p>
                </div>
                <div className="mx-auto max-w-2xl text-center">
                  <p className="text-mono text-[11px] uppercase tracking-widest text-neutral-400">
                    Proposta
                  </p>
                  <h1 className="mt-3 text-5xl font-black leading-tight text-neutral-900">
                    {projectTypeLabel}
                  </h1>
                  <div className="mt-10 grid grid-cols-3 gap-8 border-t border-neutral-200 pt-8">
                    <MetaBlock label="Cliente" value={clientName || "—"} />
                    <MetaBlock label="Empresa" value={clientCompany || "—"} />
                    <MetaBlock label="Data" value={today} />
                  </div>
                </div>
                <div className="flex items-center justify-between text-[10px] font-mono uppercase text-neutral-400">
                  <span>Felipe Neneu · Full-stack Developer</span>
                  <span>01</span>
                </div>
              </div>
            </ProposalPage>

            {/* PAGE 2 · Intro */}
            <ProposalPage number="02 / Introdução">
              <div className="flex h-full flex-col bg-white p-12 text-neutral-800">
                <p className="text-mono text-[10px] uppercase tracking-widest text-neutral-400">
                  {companyData?.tradingName || "studio one®"}
                </p>
                <div className="flex flex-1 flex-col items-center justify-center text-center">
                  <p className="text-3xl font-bold uppercase text-neutral-900">
                    Olá {(clientName || "CLIENTE")}.
                  </p>
                  <p className="mt-4 max-w-lg text-3xl font-bold uppercase leading-snug text-neutral-900">
                    Esta proposta é dividida em <u>3 etapas</u>:{" "}
                    <u>estratégia</u>, <u>design</u> e <u>desenvolvimento</u>.
                  </p>
                </div>
              </div>
            </ProposalPage>

            {/* Etapa 1 */}
            <StageCover
              stage="Etapa 1"
              title="Estratégia"
              icon={<Layers size={28} />}
              accent="black"
            />

            <ProposalPage number="04 / O que é a estratégia?">
              <div className="flex h-full items-center gap-[40px] bg-white p-12  text-black">
                <div className="max-w-[852px]">
                  <p className="text-mono text-[16px] uppercase tracking-widest">
                    Etapa 1 — Estratégia
                  </p>
                  <h2 className="mt-4 text-[58px] font-black uppercase leading-tight text-neutral-900">
                    1. O que é a{" "}
                    <span className="underline">estratégia?</span>
                  </h2>
                </div>
                <p className="max-w-[694px] text-[24px] leading-snug">
                  A primeira etapa entrega um entendimento claro sobre o que a{" "}
                  <strong>{clientCompany || "empresa"}</strong> é, o que tem de único, como quer ser
                  vista e lembrada pelos seus clientes — tudo traduzido em uma
                  estratégia digital que guiará a comunicação com o público.
                </p>
              </div>
            </ProposalPage>

            <ProposalPage number="05 / Dores">
              <div className="flex h-full items-center gap-[40px] bg-white p-12 text-black">
                <div className="max-w-[852px]">
                  <p className="text-mono text-[16px] uppercase tracking-widest ">
                    Etapa 1 — Estratégia
                  </p>
                  <h2 className="mt-4 text-[58px] font-black uppercase leading-tight text-neutral-900">
                    2. Quais dores serão{" "}
                    <span className="underline">solucionadas?</span>
                  </h2>
                </div>
                <div className="w-[694px] space-y-4 text-[24px] leading-snug">
                  <p>{problem}</p>
                  <p>{solution}</p>
                </div>
              </div>
            </ProposalPage>

            <ProposalPage number="06 / Entregáveis">
              <div className="flex h-full items-center gap-[40px] bg-white p-12  text-black">
                <div className="max-w-[852px]">
                  <p className="text-mono text-[16px] uppercase tracking-widest ">
                    Etapa 1 — Estratégia
                  </p>
                  <h2 className="mt-4 text-[58px] font-black uppercase leading-tight text-neutral-900">
                    3. O que será{" "}
                    <span className="underline">entregue?</span>
                  </h2>
                </div>
                <div className="flex-1 max-w-[694px] grid grid-cols-1 gap-6">
                  <DeliverableBlock
                    n="1"
                    title="Essência digital"
                    desc="DNA, propósito, visão e valores traduzidos para a presença online."
                  />
                  <DeliverableBlock
                    n="2"
                    title="Estratégia de produto"
                    desc="Posicionamento, promessa, pontos de contato, público e personas."
                  />
                  <DeliverableBlock
                    n="3"
                    title="Guia de estratégia"
                    desc="Documento vivo que orienta decisões de produto ao longo do tempo."
                  />
                </div>
              </div>
            </ProposalPage>

            {/* Etapa 2 */}
            <StageCover
              stage="Etapa 2"
              title="Identidade Visual & UI"
              icon={<Palette size={28} />}
              accent="violet"
            />

            <ProposalPage number="08 / UI/UX">
              <div className="flex h-full items-center gap-[40px] bg-white p-12  text-black">
                <div className="max-w-[852px]">
                  <p className="text-mono text-[16px] uppercase tracking-widest ">
                    Etapa 2 — Identidade Visual & UI
                  </p>
                  <h2 className="mt-4 text-[58px] font-black uppercase leading-tight text-neutral-900">
                    1. O que é a{" "}
                    <span className="underline">identidade visual?</span>
                  </h2>
                </div>
                <p className="w-[694px] text-[24px] leading-snug">
                  É o conjunto de elementos visuais criados para tangibilizar
                  tudo que foi proposto na etapa de <strong>Estratégia</strong>.
                  Vamos usar o DNA da marca para dar vida à interface da{" "}
                  {clientCompany || "empresa"}, criando um sistema visual capaz de conectar com o
                  público em cada ponto de contato digital.
                </p>
              </div>
            </ProposalPage>

            <ProposalPage number="09 / Entregáveis UI">
              <div className="flex h-full items-center gap-[40px] bg-white p-12  text-black">
                <div className="max-w-[852px]">
                  <p className="text-mono text-[16px] uppercase tracking-widest ">
                    Etapa 2 — Identidade Visual & UI
                  </p>
                  <h2 className="mt-4 text-[58px] font-black uppercase leading-tight text-neutral-900">
                    2. O que será{" "}
                    <span className="underline">entregue?</span>
                  </h2>
                </div>
                <ul className="w-[694px] grid grid-cols-2 gap-x-8 gap-y-3 text-[24px]">
                  {[
                    "Identidade visual",
                    "Design system",
                    "Tela: Landing page",
                    "Tela: Dashboard",
                    "Tela: Onboarding",
                    "Tela: Mobile responsivo",
                    "Brand pack (assets)",
                    "Brand book (manual)",
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-3">
                      <span className="h-2 w-2 rounded-full bg-neutral-900 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </ProposalPage>

            {/* Etapa 3 */}
            <StageCover
              stage="Etapa 3"
              title="Desenvolvimento Web"
              icon={<Code2 size={28} />}
              accent="emerald"
            />

            <ProposalPage number="11 / Stack técnica">
              <div className="flex h-full items-center gap-[40px] bg-white p-12  text-black">
                <div className="max-w-[852px]">
                  <p className="text-mono text-[16px] uppercase tracking-widest ">
                    Etapa 3 — Desenvolvimento Web
                  </p>
                  <h2 className="mt-4 text-[58px] font-black uppercase leading-tight text-neutral-900">
                    Detalhes do{" "}
                    <span className="underline">desenvolvimento</span>
                  </h2>
                </div>
                <div className="max-w-[694px] grid grid-cols-2 gap-8">
                  <TechBlock
                    title="Front-end"
                    items={["React + TypeScript", "TailwindCSS", "Animações Motion", "Acessibilidade AA"]}
                  />
                  <TechBlock
                    title="Back-end"
                    items={["Node / Edge Functions", "PostgreSQL", "Autenticação", "APIs REST"]}
                  />
                  <TechBlock
                    title="Integrações"
                    items={["Pagamentos", "E-mail transacional", "WhatsApp API", "Analytics"]}
                  />
                  <TechBlock
                    title="Entrega"
                    items={["Deploy contínuo", "Domínio + SSL", "Painel admin", "Documentação"]}
                  />
                </div>
              </div>
            </ProposalPage>

            {/* Cronograma */}
            <StageCover
              stage=""
              title="Cronograma"
              icon={<CalendarDays size={28} />}
              accent="violet"
            />

            <ProposalPage number="13 / Datas">
              <div className="flex h-full flex-col justify-center p-16 text-neutral-800">
                <h2 className="text-lg font-bold uppercase text-neutral-900">
                  Estratégia · Design · Desenvolvimento
                </h2>
                <div className="mt-8 grid grid-cols-2 gap-6">
                  <div className="rounded-lg border border-neutral-200 p-5">
                    <p className="text-mono text-[10px] uppercase text-neutral-400">Início</p>
                    <p className="text-display mt-2 text-3xl font-black">{startDate}</p>
                  </div>
                  <div className="rounded-lg border border-neutral-200 p-5">
                    <p className="text-mono text-[10px] uppercase text-neutral-400">Entrega</p>
                    <p className="text-display mt-2 text-3xl font-black">{endDate}</p>
                  </div>
                </div>
                <p className="mt-6 max-w-lg text-[11px] italic text-neutral-500">
                  * Datas válidas caso a proposta seja aprovada até 5 dias após
                  o envio. Após esse prazo, o cronograma pode sofrer alterações.
                </p>
              </div>
            </ProposalPage>

            <ProposalPage number="14 / Semanas">
              <div className="flex h-full flex-col justify-center p-16 text-neutral-800">
                <p className="text-mono text-[10px] uppercase tracking-widest text-neutral-400">
                  Cronograma
                </p>
                <h2 className="mt-2 text-2xl font-black uppercase text-neutral-900">
                  Prazo total: {weeks} semanas
                </h2>
                <div className="mt-6 overflow-hidden rounded-lg border border-neutral-200">
                  {schedule.slice(0, weeks).map((row, i) => (
                    <div
                      key={row.w}
                      className={`grid grid-cols-[110px_1fr] gap-4 border-b border-neutral-200 px-4 py-2.5 text-[13px] last:border-b-0 ${
                        i % 2 === 0 ? "bg-neutral-50" : "bg-white"
                      }`}
                    >
                      <span className="font-semibold text-neutral-900">{row.w}</span>
                      <span className="text-neutral-700">{row.d}</span>
                    </div>
                  ))}
                </div>
              </div>
            </ProposalPage>

            {/* Investimento */}
            <StageCover
              stage=""
              title="Investimento"
              icon={<Wallet size={28} />}
              accent="emerald"
            />

            <ProposalPage number="16 / Valores">
              <div className="flex h-full flex-col justify-center p-16 text-neutral-800">
                <p className="text-mono text-[10px] uppercase tracking-widest text-neutral-400">
                  {companyData?.tradingName || "studio one®"} · Investimento
                </p>

                <div className="mt-8 flex flex-col gap-2 text-[15px]">
                  <InvestRow label="Estratégia de produto" value={priceStrategy} />
                  <InvestRow label="UI/UX Design" value={priceDesign} />
                  <InvestRow label="Desenvolvimento web" value={priceDev} />
                  <div className="mt-2 flex items-baseline justify-between border-t-2 border-neutral-900 pt-3">
                    <span className="text-lg font-black uppercase">Total</span>
                    <span className="text-display text-2xl font-black">
                      {formatBRL(total)}
                    </span>
                  </div>
                </div>

                <div className="mt-10">
                  <p className="text-mono text-[10px] uppercase tracking-widest text-neutral-400">
                    Opções de pagamento
                  </p>
                  <div className="mt-4 grid grid-cols-2 gap-4">
                    <div className="rounded-xl border border-emerald-500/40 bg-emerald-50 p-5">
                      <p className="text-[10px] font-mono uppercase text-emerald-700">
                        Opção 1 · À vista
                      </p>
                      <p className="text-display mt-2 text-3xl font-black text-neutral-900">
                        {formatBRL(avista)}
                      </p>
                      <p className="mt-1 text-[11px] text-neutral-600">
                        10% de desconto no pagamento integral.
                      </p>
                    </div>
                    <div className="rounded-xl border border-neutral-300 bg-white p-5">
                      <p className="text-[10px] font-mono uppercase text-neutral-500">
                        Opção 2 · Entrada + 2 parcelas
                      </p>
                      <p className="mt-2 text-[13px]">
                        Sinal: <strong>{formatBRL(sinal)}</strong>{" "}
                        <span className="text-neutral-500">
                          (para dar início ao projeto)
                        </span>
                      </p>
                      <p className="mt-1 text-[13px]">
                        + 2 parcelas de <strong>{formatBRL(parcela)}</strong>
                      </p>
                    </div>
                  </div>
                  <p className="mt-4 max-w-md text-[11px] italic text-neutral-500">
                    Caso prefira outra opção de pagamento basta solicitar.
                    Ficarei feliz em ajudar a encontrar o melhor formato.
                  </p>
                </div>
              </div>
            </ProposalPage>

            {/* Contato */}
            <ProposalPage number="17 / Contato">
              <div className="flex h-full flex-col items-center justify-center bg-white p-16">
                <p className="text-display mt-4 text-3xl font-bold text-neutral-900">Felipe Neneu</p>
                <p className="mt-2 text-sm text-neutral-500">
                  Full-stack Developer & Designer
                </p>
                <div className="mt-8 flex flex-col items-center gap-1.5 text-sm text-neutral-600">
                  <span>www.felipeneneu.com.br</span>
                  <span>contato@felipeneneu.com.br</span>
                  <span>Brasil</span>
                </div>
              </div>
            </ProposalPage>
          </div>
        </div>
      </section>
    </div>
  );
}

/* ---------- Sub-components ---------- */

function PriceField({
  label,
  value,
  onChange,
  compact,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  compact?: boolean;
}) {
  return (
    <div>
      <Label className="text-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        {label}
      </Label>
      <Input
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
        className={`mt-1.5 border-hairline bg-[color:var(--surface-2)] ${
          compact ? "h-8 text-xs" : ""
        }`}
      />
    </div>
  );
}

function ProposalPage({
  number,
  children,
}: {
  number: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        {number}
      </p>
      <div data-pdf-page className="aspect-video w-full overflow-hidden rounded-2xl border border-hairline bg-white shadow-2xl">
        {children}
      </div>
    </div>
  );
}

function StageCover({
  stage,
  title,
  icon: _icon,
  accent,
}: {
  stage: string;
  title: string;
  icon: ReactNode;
  accent: "emerald" | "violet" | "black";
}) {
  const text = accent === "emerald" ? "text-emerald-600" : "text-violet-600";
  return (
    <ProposalPage number={`${stage || "Seção"}`}>
      <div className="flex h-full flex-col items-center justify-center bg-white p-16 text-center">
        {stage && (
          <p className={`text-mono text-[11px] uppercase tracking-widest text-black`}>
            {stage}
          </p>
        )}
        <h2 className="mt-3 text-6xl font-black uppercase leading-none text-neutral-900">
          {title}
        </h2>
      </div>
    </ProposalPage>
  );
}

function MetaBlock({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-mono text-[10px] uppercase tracking-widest text-neutral-400">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-neutral-900">{value}</p>
    </div>
  );
}

function DeliverableBlock({
  n,
  title,
  desc,
}: {
  n: string;
  title: string;
  desc: string;
}) {
  return (
    <div className="border-l-2 border-neutral-900 pl-4">
      <p className="text-mono text-[10px] uppercase text-neutral-400">
        {n.padStart(2, "0")}
      </p>
      <p className="text-sm font-bold uppercase text-neutral-900">{title}</p>
      <p className="mt-1 text-[13px] text-neutral-600">{desc}</p>
    </div>
  );
}

function TechBlock({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <p className="text-[10px] font-mono uppercase text-neutral-400">{title}</p>
      <ul className="mt-2 space-y-1">
        {items.map((i) => (
          <li key={i} className="flex items-center gap-2">
            <span className="h-1 w-1 rounded-full bg-neutral-900" />
            {i}
          </li>
        ))}
      </ul>
    </div>
  );
}

function InvestRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-baseline justify-between border-b border-dashed border-neutral-300 pb-2">
      <span className="uppercase">{label}</span>
      <span className="text-mono font-semibold">{formatBRL(value)}</span>
    </div>
  );
}
