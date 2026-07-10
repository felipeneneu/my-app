"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import {
  ArrowLeft, Plus, Trash2, X, User, Search, Check, FileSignature, Save,
  Calculator, Download, Loader2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { createBudget, approveBudget } from "@/lib/actions/budget";
import { generateProposalPdf } from "@/components/proposal-pdf";
import type { Product } from "@/lib/actions/products";
import { ProposalPages } from "@/components/ProposalPages";
import { ProposalSlides } from "@/components/ProposalSlides";

const HOURS_PER_MONTH = 120;

function formatBRL(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2 });
}

function formatBRL0(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

type ClientData = { id: string; name: string; email: string; document: string; notes: string };
type CompanyData = {
  tradingName: string; document: string; logo: string | null;
  street: string | null; number: string | null; neighborhood: string | null;
  city: string | null; state: string | null; bankName: string | null;
  bankAgency: string | null; bankAccount: string | null;
  pixKey: string | null; pixKeyType: string | null;
};
type WorkspaceConfigData = {
  monthlyGoal: number; proposalDefaultDiscount: number; proposalDownPayment: number;
  proposalInstallments: number; proposalSignatureName: string; proposalSignatureRole: string;
  proposalSignatureSite: string; proposalSignatureEmail: string; proposalSignatureCity: string;
  proposalIntroMessage: string;
};

type BudgetItem = {
  id: string;
  productId: string | null;
  name: string;
  estimatedHours: number;
  materialCost: number;
  quantity: number;
};

export function BudgetNewClient({
  clients, products, company, preselectedClientId, workspaceConfig,
}: {
  clients: ClientData[];
  products: Product[];
  company: CompanyData | null;
  preselectedClientId?: string | null;
  workspaceConfig: WorkspaceConfigData | null;
}) {
  const router = useRouter();

  // Client
  const [clientName, setClientName] = useState("");
  const [clientDoc, setClientDoc] = useState("");
  const [clientCompany, setClientCompany] = useState("");
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Project
  const [projectType, setProjectType] = useState("DESENVOLVIMENTO WEB / UI UX DESIGN / IDENTIDADE VISUAL");
  const [problem, setProblem] = useState("");
  const [solution, setSolution] = useState(workspaceConfig?.proposalIntroMessage ?? "");

  // Items
  const [items, setItems] = useState<BudgetItem[]>([]);
  const [showProductSearch, setShowProductSearch] = useState(false);
  const [productSearch, setProductSearch] = useState("");
  const [productFilterCat, setProductFilterCat] = useState("all");

  // Per-stage prices (manual overrides)
  const [priceStrategy, setPriceStrategy] = useState(0);
  const [priceDesign, setPriceDesign] = useState(0);
  const [priceDev, setPriceDev] = useState(0);

  // Minimum price validator
  const [minHours, setMinHours] = useState(48);
  const [minExtras, setMinExtras] = useState(0);

  // Schedule
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toLocaleDateString("pt-BR");
  });
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 70);
    return d.toLocaleDateString("pt-BR");
  });
  const [weeks, setWeeks] = useState(9);

  // Preview
  const [previewMode, setPreviewMode] = useState<"pages" | "slides">("pages");

  // Saving
  const [saving, setSaving] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [budgetId, setBudgetId] = useState<string | null>(null);

  const allProducts = products;
  const monthlyGoal = workspaceConfig?.monthlyGoal ?? 15000;
  const hourlyRate = monthlyGoal / HOURS_PER_MONTH;

  // Calculate item summaries
  const itemSummaries = useMemo(() => items.map(item => {
    const itemPrice = (item.estimatedHours * hourlyRate) + item.materialCost;
    return { ...item, unitPrice: itemPrice, totalPrice: itemPrice * item.quantity };
  }), [items, hourlyRate]);

  const totalHours = itemSummaries.reduce((s, i) => s + i.estimatedHours * i.quantity, 0);
  const itemsTotalPrice = itemSummaries.reduce((s, i) => s + i.totalPrice, 0);

  // Manual stage prices override itemsTotalPrice when set
  const manualTotal = priceStrategy + priceDesign + priceDev;
  const totalPrice = manualTotal > 0 ? manualTotal : itemsTotalPrice;

  // Group items by category
  const brandingItems = itemSummaries.filter(i => {
    const p = allProducts.find(ap => ap.id === i.productId);
    return p?.category === "branding" || i.name.toLowerCase().includes("marca") || i.name.toLowerCase().includes("brand");
  });
  const uiuxItems = itemSummaries.filter(i => {
    const p = allProducts.find(ap => ap.id === i.productId);
    return p?.category === "ui-ux" || i.name.toLowerCase().includes("ui") || i.name.toLowerCase().includes("ux") || i.name.toLowerCase().includes("design") || i.name.toLowerCase().includes("interface");
  });
  const devItems = itemSummaries.filter(i => {
    const p = allProducts.find(ap => ap.id === i.productId);
    return p?.category === "dev" || (!brandingItems.includes(i) && !uiuxItems.includes(i));
  });

  const brandingTotal = manualTotal > 0 ? priceStrategy : brandingItems.reduce((s, i) => s + i.totalPrice, 0);
  const uiuxTotal = manualTotal > 0 ? priceDesign : uiuxItems.reduce((s, i) => s + i.totalPrice, 0);
  const devTotal = manualTotal > 0 ? priceDev : devItems.reduce((s, i) => s + i.totalPrice, 0);

  // Minimum price
  const minimumPrice = (minHours * hourlyRate) + minExtras;

  // Generate proposal data
  const proposalData = useMemo(() => {
    const today = new Date().toLocaleDateString("pt-BR");
    const firstClientName = clientName.split(" ")[0].toUpperCase() || "CLIENTE";
    const discount = workspaceConfig?.proposalDefaultDiscount ?? 10;
    const downPayment = workspaceConfig?.proposalDownPayment ?? 50;
    const installments = workspaceConfig?.proposalInstallments ?? 6;
    const upfrontDiscountAmount = totalPrice * (discount / 100);
    const upfrontValue = totalPrice - upfrontDiscountAmount;
    const downValue = totalPrice * (downPayment / 100);
    const installmentValue = (totalPrice - downValue) / installments;

    const filteredBranding = brandingItems.filter(i => i.totalPrice > 0);
    const filteredUiux = uiuxItems.filter(i => i.totalPrice > 0);
    const filteredDev = devItems.filter(i => i.totalPrice > 0);

    const etapas: any[] = [];

    if (filteredBranding.length > 0 || priceStrategy > 0) {
      etapas.push({
        id: "etapa_1", numero: 1, categoria: "BRANDING",
        titulo: "ESTRATÉGIA & IDENTIDADE VISUAL",
        slides: [
          { tipo: "conceito", pergunta: "O QUE É A ESTRATÉGIA?", conteudo: problem || "A primeira etapa entrega um entendimento claro sobre o que o seu negócio é, o que tem de único, como quer ser visto e lembrado pelos seus clientes, traduzido em uma estratégia que guiará a empresa a se comunicar de forma inteligível com o seu público." },
          ...(filteredBranding.length > 0 ? [{
            tipo: "entregaveis", pergunta: "O QUE SERÁ ENTREGUE NESTA ETAPA?",
            itens: filteredBranding.map((i, idx) => ({ titulo: `${idx + 1}. ${i.name}`, descricao: `${i.quantity}x · ${i.estimatedHours}h cada · ${formatBRL(i.totalPrice)}` })),
          }] : []),
        ],
      });
    }

    if (filteredUiux.length > 0 || priceDesign > 0) {
      etapas.push({
        id: "etapa_2", numero: 2, categoria: "EXPERIÊNCIA DIGITAL",
        titulo: "UI / UX DESIGN",
        slides: [
          { tipo: "conceito", pergunta: "O QUE É O DESIGN DE INTERFACE (UI/UX)?", conteudo: "É o mapeamento e a construção da experiência digital do usuário dentro do sistema. Utilizaremos as definições estratégicas e a identidade visual para dar vida a telas intuitivas, responsivas e focadas na conversão do seu público-alvo." },
          ...(filteredUiux.length > 0 ? [{
            tipo: "entregaveis", pergunta: "O QUE SERÁ ENTREGUE NESTA ETAPA?",
            itens: filteredUiux.map((i, idx) => ({ titulo: `${idx + 1}. ${i.name}`, descricao: `${i.quantity}x · ${i.estimatedHours}h cada · ${formatBRL(i.totalPrice)}` })),
          }] : []),
        ],
      });
    }

    if (filteredDev.length > 0 || priceDev > 0) {
      etapas.push({
        id: "etapa_3", numero: 3, categoria: "TECNOLOGIA",
        titulo: "DESENVOLVIMENTO DE SOFTWARE",
        slides: [
          { tipo: "conceito", pergunta: "O QUE É O DESENVOLVIMENTO TECNOLÓGICO?", conteudo: "A transformação dos protótipos de UI/UX aprovados em código limpo, performático e seguro. Implementamos o front-end responsivo alinhado às regras de negócio e integrações robustas no back-end." },
          ...(filteredDev.length > 0 ? [{
            tipo: "entregaveis", pergunta: "O QUE SERÁ ENTREGUE NESTA ETAPA?",
            itens: filteredDev.map((i, idx) => ({ titulo: `${idx + 1}. ${i.name}`, descricao: `${i.quantity}x · ${i.estimatedHours}h cada · ${formatBRL(i.totalPrice)}` })),
          }] : []),
        ],
      });
    }

    const weeksPerEtapa = (hours: number) => Math.max(1, Math.round(hours / 40));
    const totalWeeks = weeks || Math.max(1, Math.round(totalHours / 40));

    const cronogramaFluxo: any[] = [];
    let weekOffset = 0;

    if (filteredBranding.length > 0 || priceStrategy > 0) {
      const w = weeksPerEtapa(filteredBranding.reduce((s, i) => s + i.estimatedHours * i.quantity, 0) || 40);
      const weekLabels: string[] = [];
      for (let j = 1; j <= w; j++) weekLabels.push(`Semana ${weekOffset + j}`);
      cronogramaFluxo.push({ semanas: weekLabels, atividades: "Estratégia de Marca, Criação de Naming, Identidade Visual e Brand Book." });
      weekOffset += w;
    }

    if (filteredUiux.length > 0 || priceDesign > 0) {
      const w = weeksPerEtapa(filteredUiux.reduce((s, i) => s + i.estimatedHours * i.quantity, 0) || 40);
      const weekLabels: string[] = [];
      for (let j = 1; j <= w; j++) weekLabels.push(`Semana ${weekOffset + j}`);
      cronogramaFluxo.push({ semanas: weekLabels, atividades: "Arquitetura de Informação, Wireframes, Design de Interface (UI/UX) e Protótipo Navegável." });
      weekOffset += w;
    }

    if (filteredDev.length > 0 || priceDev > 0) {
      const w = weeksPerEtapa(filteredDev.reduce((s, i) => s + i.estimatedHours * i.quantity, 0) || 40);
      const weekLabels: string[] = [];
      for (let j = 1; j <= w; j++) weekLabels.push(`Semana ${weekOffset + j}`);
      cronogramaFluxo.push({ semanas: weekLabels, atividades: "Desenvolvimento Front-end e Back-end, Integrações, Testes e Deploy." });
      weekOffset += w;
    }

    const orcamentoItens: any[] = [];
    if (brandingTotal > 0) orcamentoItens.push({ servico: "ESTRATÉGIA DE MARCA & IDENTIDADE VISUAL", valor: formatBRL(brandingTotal) });
    if (uiuxTotal > 0) orcamentoItens.push({ servico: "INTERFACE DIGITAL (UI/UX DESIGN)", valor: formatBRL(uiuxTotal) });
    if (devTotal > 0) orcamentoItens.push({ servico: "DESENVOLVIMENTO DE SOFTWARE", valor: formatBRL(devTotal) });
    orcamentoItens.push({ servico: "TOTAL", valor: formatBRL(totalPrice) });

    return {
      configuracoes_layout: {
        proporcao: "16:9", orientacao: "landscape", unidade_medida: "px",
        dimensoes_sugeridas: { largura: 1920, altura: 1080 },
        estilo_base: { cor_fundo: "#FFFFFF", cor_texto_principal: "#000000", cor_texto_secundario: "#707070", font_family: "Helvetica Neue, Arial, sans-serif" },
      },
      proposta: {
        capa: {
          titulo: projectType,
          subtitulo: projectType,
          metadados: { cliente: clientName, empresa: clientCompany, data: today },
        },
        introducao: {
          saudacao: `OLÁ ${firstClientName}.`,
          mensagem_destaque: solution,
        },
        etapas,
        cronograma: {
          titulo: "CRONOGRAMA",
          subtitulo: `PRAZO TOTAL: ${totalWeeks} ${totalWeeks === 1 ? "SEMANA" : "SEMANAS"}`,
          fluxo: cronogramaFluxo,
        },
        financeiro: {
          titulo: "INVESTIMENTO",
          orcamento_itens: orcamentoItens,
          condicoes_pagamento: {
            titulo: "OPÇÕES DE PAGAMENTO",
            opcoes: [
              { nome: "Opção 1", modalidade: "À vista", descricao: `${formatBRL(upfrontValue)} com ${discount}% de desconto via PIX.` },
              { nome: "Opção 2", modalidade: "Entrada + Parcelas", descricao: `Sinal de ${formatBRL(downValue)} para início imediato do projeto + ${installments}x de ${formatBRL(installmentValue)} via boleto ou cartão.` },
            ],
            nota_rodape: "Caso prefira outra opção de pagamento basta solicitar. Ficarei feliz em ajudar a encontrar o melhor formato.",
          },
        },
        assinatura: {
          nome_prestador: workspaceConfig?.proposalSignatureName ?? "Felipe Neneu",
          cargo: workspaceConfig?.proposalSignatureRole ?? "Full-Stack Developer & Designer",
          portfolio_url: workspaceConfig?.proposalSignatureSite ?? "",
          contato_email: workspaceConfig?.proposalSignatureEmail ?? "",
          endereco: workspaceConfig?.proposalSignatureCity ?? "",
        },
      },
      clientId: selectedClientId,
      clientName,
      totalPrice,
      totalHours,
      hourlyRate,
      monthlyGoal,
      deadline: `${weeks} semanas`,
      items: items.map(i => ({
        productId: i.productId, name: i.name, estimatedHours: i.estimatedHours,
        materialCost: i.materialCost, quantity: i.quantity,
        calculatedPrice: ((i.estimatedHours * hourlyRate) + i.materialCost) * i.quantity,
      })),
    };
  }, [
    clientName, clientCompany, selectedClientId, items, projectType, problem, solution,
    totalPrice, totalHours, hourlyRate, monthlyGoal, weeks,
    brandingItems, uiuxItems, devItems, brandingTotal, uiuxTotal, devTotal,
    priceStrategy, priceDesign, priceDev, workspaceConfig,
  ]);

  // Click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setShowClientDropdown(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Preselect client
  useEffect(() => {
    if (preselectedClientId) {
      const found = clients.find(c => c.id === preselectedClientId);
      if (found) handleSelectClient(found);
    }
  }, [preselectedClientId, clients]);

  const filteredClients = useMemo(
    () => clients.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.email.toLowerCase().includes(searchQuery.toLowerCase())),
    [clients, searchQuery],
  );

  const filteredProducts = useMemo(() => {
    let list = allProducts;
    if (productFilterCat !== "all") list = list.filter(p => p.category === productFilterCat);
    if (productSearch) list = list.filter(p => p.name.toLowerCase().includes(productSearch.toLowerCase()));
    return list;
  }, [allProducts, productFilterCat, productSearch]);

  function handleSelectClient(c: ClientData) {
    setClientName(c.name);
    setClientDoc(c.document);
    setSelectedClientId(c.id);
    setSearchQuery(c.name);
    setShowClientDropdown(false);
  }

  function addItem(product: Product) {
    const existing = items.find(i => i.productId === product.id);
    if (existing) {
      setItems(prev => prev.map(i => i.id === existing.id ? { ...i, quantity: i.quantity + 1 } : i));
    } else {
      setItems(prev => [...prev, { id: crypto.randomUUID(), productId: product.id, name: product.name, estimatedHours: product.estimatedHours, materialCost: product.materialCost, quantity: 1 }]);
    }
    setShowProductSearch(false);
    setProductSearch("");
  }

  function addCustomItem() {
    const name = prompt("Nome do item avulso:");
    if (!name) return;
    const hours = Number(prompt("Horas estimadas:") || "0");
    const cost = Number(prompt("Custo material (R$):") || "0");
    setItems(prev => [...prev, { id: crypto.randomUUID(), productId: null, name, estimatedHours: hours, materialCost: cost, quantity: 1 }]);
  }

  function removeItem(id: string) {
    setItems(prev => prev.filter(i => i.id !== id));
  }

  function updateItemQty(id: string, qty: number) {
    if (qty < 1) qty = 1;
    setItems(prev => prev.map(i => i.id === id ? { ...i, quantity: qty } : i));
  }

  async function handleSave() {
    if (!selectedClientId) { toast.error("Selecione um cliente"); return; }
    if (totalPrice === 0) { toast.error("Defina pelo menos um preço"); return; }
    setSaving(true);
    try {
      const budget = await createBudget(proposalData);
      setBudgetId(budget.id);
      toast.success("Proposta salva!");
    } catch {
      toast.error("Erro ao salvar proposta");
    } finally {
      setSaving(false);
    }
  }

  async function handleApprove() {
    if (!budgetId) { toast.error("Salve a proposta primeiro"); return; }
    setSaving(true);
    try {
      const result = await approveBudget(budgetId);
      toast.success("Proposta aprovada!", { description: `Projeto "${clientName}" criado.` });
      router.push(`/adm/contract/${result.contract.id}`);
    } catch {
      toast.error("Erro ao aprovar proposta");
    } finally {
      setSaving(false);
    }
  }

  async function handleExportPdf() {
    setExportingPdf(true);
    try {
      await generateProposalPdf(proposalData as any, company);
      toast.success("PDF gerado!");
    } catch {
      toast.error("Erro ao gerar PDF");
    } finally {
      setExportingPdf(false);
    }
  }

  return (
    <>
      <header className="flex items-center justify-between border-b border-hairline px-8 py-4">
        <div className="flex items-center gap-3">
          <Link href="/adm/budget" className="inline-flex items-center gap-1.5 rounded-md border border-hairline px-2 py-1 text-[11px] text-muted-foreground hover:text-foreground">
            <ArrowLeft size={12} /> Propostas
          </Link>
          <FileSignature size={16} className="text-emerald-glow" />
          <p className="text-mono text-[11px] uppercase tracking-widest text-muted-foreground">Nova Proposta</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExportPdf} disabled={exportingPdf}>
            {exportingPdf ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />} {exportingPdf ? "Gerando..." : "PDF"}
          </Button>
          <Button variant="outline" size="sm" onClick={handleSave} disabled={saving}>
            <Save size={14} /> {saving ? "Salvando..." : "Salvar"}
          </Button>
          {budgetId && (
            <Button size="sm" onClick={handleApprove} disabled={saving}>
              <Check size={14} /> {saving ? "Aprovando..." : "Aprovar"}
            </Button>
          )}
        </div>
      </header>

      <section className="grid grid-cols-1 gap-6 px-8 py-8 2xl:grid-cols-[380px_1fr]">
        {/* Editor */}
        <div className="flex flex-col gap-4">
          {/* Client data */}
          <div className="rounded-2xl border border-hairline bg-[color:var(--surface-1)] p-5">
            <p className="text-mono text-[10px] uppercase tracking-widest text-emerald-glow">Dados do cliente</p>
            <div className="mt-4 flex flex-col gap-3">
              <div ref={searchRef} className="relative">
                <Label className="text-mono text-[10px] uppercase tracking-widest text-muted-foreground">Cliente</Label>
                <div className="relative mt-1.5">
                  <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setShowClientDropdown(true); }} onFocus={() => setShowClientDropdown(true)} placeholder="Buscar cliente..." className="border-hairline bg-[color:var(--surface-2)] pl-8" />
                  {searchQuery && (
                    <button onClick={() => { setSearchQuery(""); setClientName(""); setClientDoc(""); setClientCompany(""); setSelectedClientId(null); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"><X size={14} /></button>
                  )}
                  {showClientDropdown && (
                    <div className="absolute z-10 mt-1 w-full rounded-xl border border-hairline bg-[color:var(--surface-0)] py-1 shadow-2xl">
                      {filteredClients.length === 0 ? (
                        <p className="py-3 text-center text-xs text-muted-foreground">Nenhum cliente encontrado</p>
                      ) : (
                        filteredClients.map(c => (
                          <button key={c.id} onClick={() => handleSelectClient(c)} className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm hover:bg-[color:var(--surface-2)]">
                            <User size={14} className="shrink-0 text-muted-foreground" />
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-foreground">{c.name}</p>
                              <p className="truncate text-[10px] text-muted-foreground">{c.email}</p>
                            </div>
                            {c.document && <Badge variant="outline" className="shrink-0 text-[9px]">{c.document}</Badge>}
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>
              <div>
                <Label className="text-mono text-[10px] uppercase tracking-widest text-muted-foreground">Nome do cliente</Label>
                <Input value={clientName} onChange={(e) => setClientName(e.target.value)} className="mt-1.5 border-hairline bg-[color:var(--surface-2)]" />
              </div>
              <div>
                <Label className="text-mono text-[10px] uppercase tracking-widest text-muted-foreground">CPF / CNPJ</Label>
                <Input value={clientDoc} onChange={(e) => setClientDoc(e.target.value)} className="mt-1.5 border-hairline bg-[color:var(--surface-2)]" />
              </div>
              <div>
                <Label className="text-mono text-[10px] uppercase tracking-widest text-muted-foreground">Empresa</Label>
                <Input value={clientCompany} onChange={(e) => setClientCompany(e.target.value)} placeholder="Ex: Academia Lorem Fit" className="mt-1.5 border-hairline bg-[color:var(--surface-2)]" />
              </div>
              <div>
                <Label className="text-mono text-[10px] uppercase tracking-widest text-muted-foreground">Tipo de projeto</Label>
                <Input value={projectType} onChange={(e) => setProjectType(e.target.value)} className="mt-1.5 border-hairline bg-[color:var(--surface-2)]" />
              </div>
              <div>
                <Label className="text-mono text-[10px] uppercase tracking-widest text-muted-foreground">Dor a ser resolvida</Label>
                <Textarea value={problem} onChange={(e) => setProblem(e.target.value)} rows={3} className="mt-1.5 border-hairline bg-[color:var(--surface-2)] text-xs" />
              </div>
              <div>
                <Label className="text-mono text-[10px] uppercase tracking-widest text-muted-foreground">Solução proposta</Label>
                <Textarea value={solution} onChange={(e) => setSolution(e.target.value)} rows={3} className="mt-1.5 border-hairline bg-[color:var(--surface-2)] text-xs" />
              </div>
            </div>
          </div>

          {/* Products */}
          <div className="rounded-2xl border border-hairline bg-[color:var(--surface-1)] p-5">
            <p className="text-mono text-[10px] uppercase tracking-widest text-violet-glow">Produtos & Itens</p>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Hora/valor: <span className="font-semibold text-foreground">{formatBRL(hourlyRate)}/h</span>
            </p>
            <div className="mt-4 flex flex-col gap-2">
              {itemSummaries.length === 0 ? (
                <p className="py-3 text-center text-xs text-muted-foreground">Nenhum item adicionado</p>
              ) : (
                itemSummaries.map((item) => (
                  <div key={item.id} className="flex items-center gap-2 rounded-lg border border-hairline bg-[color:var(--surface-2)] px-3 py-2">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium text-foreground">{item.name}</p>
                      <p className="text-[10px] text-muted-foreground">{item.estimatedHours}h · {formatBRL(item.materialCost)}</p>
                    </div>
                    <Input type="number" min={1} value={item.quantity} onChange={(e) => updateItemQty(item.id, Number(e.target.value) || 1)} className="w-12 h-7 text-center text-[10px]" />
                    <p className="w-20 text-right text-xs font-semibold text-emerald-glow">{formatBRL(item.totalPrice)}</p>
                    <button onClick={() => removeItem(item.id)} className="text-muted-foreground/40 hover:text-rose-glow"><Trash2 size={12} /></button>
                  </div>
                ))
              )}
            </div>
            <div className="mt-3 flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowProductSearch(true)} className="h-7 text-[11px]">
                <Plus size={12} /> Produto
              </Button>
              <Button variant="ghost" size="sm" onClick={addCustomItem} className="h-7 text-[11px]">
                <Plus size={12} /> Avulso
              </Button>
            </div>
            {showProductSearch && (
              <div className="mt-3 rounded-xl border border-hairline bg-[color:var(--surface-2)] p-3">
                <div className="mb-2 flex items-center gap-2">
                  <Input value={productSearch} onChange={(e) => setProductSearch(e.target.value)} placeholder="Buscar..." className="flex-1 text-xs" autoFocus />
                  <div className="flex gap-1">
                    {["all", "branding", "ui-ux", "dev"].map(cat => (
                      <button key={cat} onClick={() => setProductFilterCat(cat)} className={`px-1.5 py-0.5 rounded text-[9px] font-medium ${productFilterCat === cat ? "bg-foreground text-[color:var(--surface-0)]" : "text-muted-foreground hover:text-foreground"}`}>
                        {cat === "all" ? "Todos" : cat}
                      </button>
                    ))}
                  </div>
                  <button onClick={() => setShowProductSearch(false)} className="text-muted-foreground hover:text-foreground"><X size={12} /></button>
                </div>
                <div className="flex flex-col gap-0.5 max-h-40 overflow-y-auto">
                  {filteredProducts.length === 0 && <p className="py-2 text-center text-[10px] text-muted-foreground">Nenhum</p>}
                  {filteredProducts.map(p => (
                    <button key={p.id} onClick={() => addItem(p)} className="flex items-center gap-2 rounded px-2 py-1.5 text-left text-xs hover:bg-[color:var(--surface-1)]">
                      <Plus size={10} className="shrink-0 text-emerald-glow" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-foreground">{p.name}</p>
                        <p className="text-[9px] text-muted-foreground">{p.estimatedHours}h · {formatBRL(p.materialCost)}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Per-stage prices */}
          <div className="rounded-2xl border border-hairline bg-[color:var(--surface-1)] p-5">
            <p className="text-mono text-[10px] uppercase tracking-widest text-violet-glow">Investimento por etapa</p>
            <p className="mt-1 text-[11px] text-muted-foreground">Defina preços manuais ou use os valores dos itens.</p>
            <div className="mt-4 grid grid-cols-1 gap-3">
              <div>
                <Label className="text-mono text-[10px] uppercase tracking-widest text-muted-foreground">Estratégia / Descoberta</Label>
                <Input type="number" value={priceStrategy || ""} onChange={(e) => setPriceStrategy(Number(e.target.value) || 0)} placeholder={formatBRL0(brandingItems.reduce((s, i) => s + i.totalPrice, 0))} className="mt-1.5 border-hairline bg-[color:var(--surface-2)]" />
              </div>
              <div>
                <Label className="text-mono text-[10px] uppercase tracking-widest text-muted-foreground">UI/UX Design</Label>
                <Input type="number" value={priceDesign || ""} onChange={(e) => setPriceDesign(Number(e.target.value) || 0)} placeholder={formatBRL0(uiuxItems.reduce((s, i) => s + i.totalPrice, 0))} className="mt-1.5 border-hairline bg-[color:var(--surface-2)]" />
              </div>
              <div>
                <Label className="text-mono text-[10px] uppercase tracking-widest text-muted-foreground">Desenvolvimento Web</Label>
                <Input type="number" value={priceDev || ""} onChange={(e) => setPriceDev(Number(e.target.value) || 0)} placeholder={formatBRL0(devItems.reduce((s, i) => s + i.totalPrice, 0))} className="mt-1.5 border-hairline bg-[color:var(--surface-2)]" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline justify-between border-t border-hairline pt-3">
              <p className="text-mono text-[11px] uppercase tracking-widest text-muted-foreground">Total</p>
              <p className="text-display text-2xl text-emerald-glow">{formatBRL(totalPrice)}</p>
            </div>
          </div>

          {/* Minimum price validator */}
          <div className="rounded-2xl border border-hairline bg-[color:var(--surface-1)] p-5">
            <p className="text-mono text-[10px] uppercase tracking-widest text-emerald-glow">
              <Calculator size={12} className="inline mr-1" />Validador de preço mínimo
            </p>
            <p className="mt-1 text-[11px] text-muted-foreground">Fórmula: (Horas × Meta/120h) + Extras</p>
            <div className="mt-3 grid grid-cols-3 gap-2">
              <div>
                <Label className="text-mono text-[10px] uppercase text-muted-foreground">Meta</Label>
                <Input type="number" value={monthlyGoal} readOnly className="mt-1.5 border-hairline bg-[color:var(--surface-2)] h-8 text-xs" />
              </div>
              <div>
                <Label className="text-mono text-[10px] uppercase text-muted-foreground">Horas</Label>
                <Input type="number" value={minHours} onChange={(e) => setMinHours(Number(e.target.value) || 0)} className="mt-1.5 border-hairline bg-[color:var(--surface-2)] h-8 text-xs" />
              </div>
              <div>
                <Label className="text-mono text-[10px] uppercase text-muted-foreground">Extras</Label>
                <Input type="number" value={minExtras} onChange={(e) => setMinExtras(Number(e.target.value) || 0)} className="mt-1.5 border-hairline bg-[color:var(--surface-2)] h-8 text-xs" />
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between rounded-lg border border-emerald-glow/30 bg-emerald-glow/5 px-3 py-2">
              <span className="text-mono text-[10px] uppercase text-emerald-glow">Preço mínimo</span>
              <span className="text-display text-base text-foreground">{formatBRL(minimumPrice)}</span>
            </div>
            {totalPrice > 0 && totalPrice < minimumPrice && (
              <p className="mt-2 text-[11px] text-rose-400">⚠ Total abaixo do preço mínimo saudável.</p>
            )}
          </div>

          {/* Schedule */}
          <div className="rounded-2xl border border-hairline bg-[color:var(--surface-1)] p-5">
            <p className="text-mono text-[10px] uppercase tracking-widest text-muted-foreground">Cronograma</p>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div>
                <Label className="text-mono text-[10px] uppercase text-muted-foreground">Início</Label>
                <Input value={startDate} onChange={(e) => setStartDate(e.target.value)} className="mt-1.5 border-hairline bg-[color:var(--surface-2)]" />
              </div>
              <div>
                <Label className="text-mono text-[10px] uppercase text-muted-foreground">Entrega</Label>
                <Input value={endDate} onChange={(e) => setEndDate(e.target.value)} className="mt-1.5 border-hairline bg-[color:var(--surface-2)]" />
              </div>
              <div className="col-span-2">
                <Label className="text-mono text-[10px] uppercase text-muted-foreground">Prazo (semanas)</Label>
                <Input type="number" value={weeks} onChange={(e) => setWeeks(Number(e.target.value) || 0)} className="mt-1.5 border-hairline bg-[color:var(--surface-2)]" />
              </div>
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <p className="text-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              Preview da proposta
            </p>
            <div className="flex items-center gap-1 rounded-lg border border-hairline p-0.5">
              <button
                onClick={() => setPreviewMode("pages")}
                className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors ${
                  previewMode === "pages" ? "bg-foreground text-[color:var(--surface-0)]" : "text-muted-foreground hover:text-foreground"
                }`}
              >📄 Páginas</button>
              <button
                onClick={() => setPreviewMode("slides")}
                className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors ${
                  previewMode === "slides" ? "bg-foreground text-[color:var(--surface-0)]" : "text-muted-foreground hover:text-foreground"
                }`}
              >🎞 Slides</button>
            </div>
          </div>

          {previewMode === "pages" ? (
            <ProposalPages data={proposalData as any} company={company} />
          ) : (
            <ProposalSlides data={proposalData as any} totalPrice={totalPrice} company={company} />
          )}
        </div>
      </section>
    </>
  );
}
