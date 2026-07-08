"use client";

import { useMemo, useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import {
  ArrowLeft, Calculator, Download, Plus, Trash2, X, User, Search,
  Check, FileSignature, Clock, Building2, Banknote,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createBudget, approveBudget } from "@/lib/actions/budget";

const HOURS_PER_MONTH = 120;

function formatBRL(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2 });
}

function parseCurrency(raw: string): number {
  return Number(raw.replace(/[^\d]/g, "")) / 100;
}

function maskCurrency(raw: string): string {
  const nums = raw.replace(/[^\d]/g, "");
  const padded = nums.padStart(3, "0");
  const integer = padded.slice(0, -2);
  const decimal = padded.slice(-2);
  return `${Number(integer).toLocaleString("pt-BR")},${decimal}`;
}

type ClientData = {
  id: string;
  name: string;
  email: string;
  document: string;
  notes: string;
};

type CompanyData = {
  tradingName: string;
  document: string;
  logo: string | null;
  street: string | null;
  number: string | null;
  neighborhood: string | null;
  city: string | null;
  state: string | null;
  bankName: string | null;
  bankAgency: string | null;
  bankAccount: string | null;
  pixKey: string | null;
  pixKeyType: string | null;
};

export function BudgetNewClient({ clients, company }: {
  clients: ClientData[];
  company: CompanyData | null;
}) {
  const router = useRouter();
  const [clientName, setClientName] = useState("");
  const [clientDoc, setClientDoc] = useState("");
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [scope, setScope] = useState("");
  const [metaRaw, setMetaRaw] = useState("15000,00");
  const [hours, setHours] = useState(40);
  const [extrasRaw, setExtrasRaw] = useState("0,00");
  const [estimatedCostsRaw, setEstimatedCostsRaw] = useState("1200,00");
  const [deadline, setDeadline] = useState("30 dias corridos");
  const [deliverables, setDeliverables] = useState<string[]>([
    "Design de interface (UI/UX)",
    "Desenvolvimento front-end",
    "Integração de APIs",
    "Testes e deploy",
  ]);
  const [newDeliverable, setNewDeliverable] = useState("");
  const [saving, setSaving] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowClientDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const meta = parseCurrency(metaRaw);
  const extras = parseCurrency(extrasRaw);
  const estimatedCosts = parseCurrency(estimatedCostsRaw);

  const hourlyRate = meta / HOURS_PER_MONTH;
  const laborCost = hours * hourlyRate;
  const finalPrice = laborCost + extras;
  const netProfit = finalPrice - estimatedCosts;
  const margin = finalPrice > 0 ? (netProfit / finalPrice) * 100 : 0;

  const today = useMemo(
    () => new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" }),
    [],
  );

  const filteredClients = useMemo(
    () => clients.filter(c =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email.toLowerCase().includes(searchQuery.toLowerCase())
    ),
    [clients, searchQuery],
  );

  const handleSelectClient = useCallback((c: ClientData) => {
    setClientName(c.name);
    setClientDoc(c.document);
    setSelectedClientId(c.id);
    setSearchQuery(c.name);
    setShowClientDropdown(false);
    if (c.notes && c.notes.length > 10) {
      setScope(c.notes);
    }
  }, []);

  const addDeliverable = useCallback(() => {
    const trimmed = newDeliverable.trim();
    if (!trimmed) return;
    setDeliverables(prev => [...prev, trimmed]);
    setNewDeliverable("");
  }, [newDeliverable]);

  const removeDeliverable = useCallback((index: number) => {
    setDeliverables(prev => prev.filter((_, i) => i !== index));
  }, []);

  const handleApprove = useCallback(async () => {
    if (!selectedClientId) {
      toast.error("Selecione um cliente primeiro");
      return;
    }
    setSaving(true);
    try {
      const budget = await createBudget({
        clientName,
        clientDocument: clientDoc,
        clientId: selectedClientId,
        scope,
        hours,
        hourlyRate,
        laborCost,
        extraCosts: extras,
        totalPrice: finalPrice,
        estimatedCosts,
        deadline,
        deliverables,
      });
      const result = await approveBudget(budget.id);
      toast.success("Orçamento aprovado!", {
        description: `Contrato criado para "${clientName}".`,
      });
      router.push(`/adm/contract/${result.contract.id}`);
    } catch (err) {
      toast.error("Erro ao aprovar orçamento", {
        description: err instanceof Error ? err.message : "Erro desconhecido",
      });
    } finally {
      setSaving(false);
    }
  }, [selectedClientId, clientName, clientDoc, scope, hours, hourlyRate, laborCost, extras, finalPrice, estimatedCosts, deadline, deliverables, router]);

  const marginColor = margin >= 60 ? "text-emerald-glow" : margin >= 30 ? "text-amber-glow" : "text-rose-glow";

  async function generatePdf() {
    const html2canvas = (await import("html2canvas")).default;
    const element = document.getElementById("budget-preview");
    if (!element) return;
    const canvas = await html2canvas(element, { scale: 2, useCORS: true });
    const imgData = canvas.toDataURL("image/png");
    const jsPDF = (await import("jspdf")).default;
    const pdf = new jsPDF("p", "mm", "a4");
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
    pdf.save(`orcamento-${clientName.replace(/\s+/g, "-").toLowerCase()}.pdf`);
    toast.success("PDF gerado com sucesso");
  }

  return (
    <>
      <header className="flex items-center justify-between border-b border-hairline px-8 py-4">
        <div className="flex items-center gap-3">
          <Link href="/adm/budget" className="inline-flex items-center gap-1.5 rounded-md border border-hairline px-2 py-1 text-[11px] text-muted-foreground hover:text-foreground">
            <ArrowLeft size={12} /> Orçamentos
          </Link>
          <FileSignature size={16} className="text-emerald-glow" />
          <p className="text-mono text-[11px] uppercase tracking-widest text-muted-foreground">Novo Orçamento</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={generatePdf}>
            <Download size={14} /> Exportar PDF
          </Button>
          <Button size="sm" onClick={handleApprove} disabled={saving || !selectedClientId}>
            {saving ? "Aprovando…" : <><Check size={14} /> Aprovar Orçamento</>}
          </Button>
        </div>
      </header>

      <section className="grid grid-cols-1 gap-6 px-8 py-8 xl:grid-cols-2">
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <p className="text-mono text-[10px] uppercase tracking-widest text-muted-foreground">Seleção de cliente</p>
              <CardTitle className="text-display text-xl">Dados do contratante</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div ref={searchRef} className="relative">
                <Label className="text-mono text-[10px] uppercase tracking-widest text-muted-foreground">Cliente</Label>
                <div className="relative mt-1.5">
                  <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => { setSearchQuery(e.target.value); setShowClientDropdown(true); }}
                    onFocus={() => setShowClientDropdown(true)}
                    placeholder="Buscar cliente..."
                    className="border-hairline bg-(--surface-2) pl-8"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => { setSearchQuery(""); setClientName(""); setClientDoc(""); setSelectedClientId(null); }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      <X size={14} />
                    </button>
                  )}
                  {showClientDropdown && (
                    <div className="absolute z-10 mt-1 w-full rounded-xl border border-hairline bg-(--surface-0) py-1 shadow-2xl">
                      {filteredClients.length === 0 ? (
                        <p className="py-3 text-center text-xs text-muted-foreground">Nenhum cliente encontrado</p>
                      ) : (
                        filteredClients.map(c => (
                          <button
                            key={c.id}
                            onClick={() => handleSelectClient(c)}
                            className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm hover:bg-(--surface-2)"
                          >
                            <User size={14} className="shrink-0 text-muted-foreground" />
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-foreground">{c.name}</p>
                              <p className="truncate text-[10px] text-muted-foreground">{c.email}</p>
                            </div>
                            {c.document && (
                              <Badge variant="outline" className="shrink-0 text-[9px]">{c.document}</Badge>
                            )}
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <Label className="text-mono text-[10px] uppercase tracking-widest text-muted-foreground">Nome do cliente</Label>
                <Input value={clientName} onChange={(e) => setClientName(e.target.value)} className="mt-1.5 border-hairline bg-(--surface-2)" />
              </div>

              <div>
                <Label className="text-mono text-[10px] uppercase tracking-widest text-muted-foreground">CPF / CNPJ</Label>
                <Input value={clientDoc} onChange={(e) => setClientDoc(e.target.value)} className="mt-1.5 border-hairline bg-(--surface-2)" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <p className="text-mono text-[10px] uppercase tracking-widest text-emerald-glow">Calculadora de precificação</p>
              <CardTitle className="text-display text-2xl">Preço mínimo garantido</CardTitle>
              <p className="mt-1 text-xs text-muted-foreground">
                Fórmula: <span className="text-mono text-foreground">Preço = (Horas × (Meta / 120h)) + Custos extras</span>
              </p>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div>
                <Label className="text-mono text-[10px] uppercase tracking-widest text-muted-foreground">Escopo resumido</Label>
                <Input value={scope} onChange={(e) => setScope(e.target.value)} className="mt-1.5 border-hairline bg-(--surface-2)" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-mono text-[10px] uppercase tracking-widest text-muted-foreground">Meta mensal (R$)</Label>
                  <Input
                    value={`R$ ${metaRaw}`}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9,]/g, "").replace(",", "");
                      setMetaRaw(maskCurrency(val));
                    }}
                    className="mt-1.5 border-hairline bg-(--surface-2)"
                  />
                </div>
                <div>
                  <Label className="text-mono text-[10px] uppercase tracking-widest text-muted-foreground">Horas do projeto</Label>
                  <Input type="number" value={hours} onChange={(e) => setHours(Number(e.target.value) || 0)} className="mt-1.5 border-hairline bg-(--surface-2)" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-mono text-[10px] uppercase tracking-widest text-muted-foreground">Custos extras (R$)</Label>
                  <Input
                    value={`R$ ${extrasRaw}`}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9,]/g, "").replace(",", "");
                      setExtrasRaw(maskCurrency(val));
                    }}
                    className="mt-1.5 border-hairline bg-(--surface-2)"
                  />
                  <p className="mt-1 text-[10px] text-muted-foreground">Domínio, hospedagem, licenças, assets premium.</p>
                </div>
                <div>
                  <Label className="text-mono text-[10px] uppercase tracking-widest text-muted-foreground">Prazo</Label>
                  <Input value={deadline} onChange={(e) => setDeadline(e.target.value)} className="mt-1.5 border-hairline bg-(--surface-2)" />
                </div>
              </div>

              <div className="rounded-xl border border-emerald-glow/30 bg-emerald-glow/5 p-4">
                <p className="text-mono text-[10px] uppercase tracking-widest text-emerald-glow">Cálculo em tempo real</p>
                <div className="mt-3 grid grid-cols-3 gap-3 text-center">
                  <div>
                    <p className="text-mono text-[10px] text-muted-foreground">Hora/valor</p>
                    <p className="text-display text-lg text-foreground">{formatBRL(hourlyRate)}</p>
                  </div>
                  <div>
                    <p className="text-mono text-[10px] text-muted-foreground">Mão de obra</p>
                    <p className="text-display text-lg text-foreground">{formatBRL(laborCost)}</p>
                  </div>
                  <div>
                    <p className="text-mono text-[10px] text-muted-foreground">Extras</p>
                    <p className="text-display text-lg text-foreground">{formatBRL(extras)}</p>
                  </div>
                </div>
                <div className="mt-4 flex items-baseline justify-between border-t border-hairline pt-3">
                  <p className="text-mono text-[11px] uppercase tracking-widest text-muted-foreground">Preço final mínimo</p>
                  <p className="text-display text-3xl text-emerald-glow">{formatBRL(finalPrice)}</p>
                </div>
              </div>

              <div className="rounded-xl border border-amber-glow/30 bg-amber-glow/5 p-4">
                <p className="text-mono text-[10px] uppercase tracking-widest text-amber-glow">Rentabilidade do projeto</p>
                <div className="mt-3 grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-mono text-[10px] uppercase tracking-widest text-muted-foreground">Custos estimados (R$)</Label>
                    <Input
                      value={`R$ ${estimatedCostsRaw}`}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9,]/g, "").replace(",", "");
                        setEstimatedCostsRaw(maskCurrency(val));
                      }}
                      className="mt-1.5 border-hairline bg-(--surface-2)"
                    />
                  </div>
                  <div className="flex flex-col justify-end">
                    <p className="text-mono text-[10px] uppercase tracking-widest text-muted-foreground">Margem líquida</p>
                    <p className={`text-display text-2xl ${marginColor}`}>
                      {margin >= 0 ? "+" : ""}{margin.toFixed(1)}%
                    </p>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2 rounded-lg border border-hairline bg-(--surface-2) px-3 py-2">
                    <Banknote size={14} className="shrink-0 text-muted-foreground" />
                    <div>
                      <p className="text-mono text-[9px] uppercase tracking-widest text-muted-foreground">Custos</p>
                      <p className="text-display text-sm text-rose-glow">-{formatBRL(estimatedCosts)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 rounded-lg border border-hairline bg-(--surface-2) px-3 py-2">
                    <Building2 size={14} className="shrink-0 text-emerald-glow" />
                    <div>
                      <p className="text-mono text-[9px] uppercase tracking-widest text-muted-foreground">Lucro líquido</p>
                      <p className={`text-display text-sm ${netProfit >= 0 ? "text-emerald-glow" : "text-rose-glow"}`}>
                        {netProfit >= 0 ? "" : "-"}{formatBRL(Math.abs(netProfit))}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <Card>
                <CardHeader>
                  <p className="text-mono text-[10px] uppercase tracking-widest text-violet-glow">Entregas</p>
                  <CardTitle className="text-display text-xl">Deliverables</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="mb-3 flex items-center gap-2">
                    <Input
                      value={newDeliverable}
                      onChange={(e) => setNewDeliverable(e.target.value)}
                      placeholder="Adicionar entrega…"
                      className="flex-1 text-sm"
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addDeliverable())}
                    />
                    <Button size="sm" onClick={addDeliverable}><Plus size={12} /> Add</Button>
                  </div>
                  <div className="flex flex-col divide-y divide-hairline">
                    {deliverables.length === 0 && (
                      <p className="py-3 text-center text-xs text-muted-foreground">Nenhuma entrega cadastrada.</p>
                    )}
                    {deliverables.map((d, i) => (
                      <div key={i} className="flex items-center gap-3 py-2.5">
                        <span className="flex size-5 shrink-0 items-center justify-center rounded-full border border-hairline text-[10px] text-muted-foreground">{i + 1}</span>
                        <p className="flex-1 text-sm text-foreground">{d}</p>
                        <button onClick={() => removeDeliverable(i)} className="text-muted-foreground hover:text-rose-glow">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <FileSignature size={14} className="text-violet-glow" />
            <p className="text-mono text-[10px] uppercase tracking-widest text-muted-foreground">Preview do orçamento</p>
          </div>

          <div id="budget-preview" className="flex flex-col rounded-2xl border border-hairline bg-(--surface-0) p-8 text-sm">
            {company?.logo && (
              <img src={company.logo} alt={company.tradingName} className="mb-6 max-h-16 w-fit object-contain" />
            )}
            {company && (
              <div className="mb-6 text-xs text-muted-foreground">
                <p className="font-semibold text-foreground">{company.tradingName}</p>
                {company.document && <p>CNPJ: {company.document}</p>}
                {company.street && (
                  <p>{company.street}{company.number ? `, ${company.number}` : ""}{company.neighborhood ? ` - ${company.neighborhood}` : ""}</p>
                )}
                {company.city && company.state && <p>{company.city}/${company.state}</p>}
              </div>
            )}

            <div className="mb-6 border-b border-hairline pb-4">
              <h2 className="text-display text-xl font-semibold text-foreground">Orçamento</h2>
              <p className="mt-1 text-xs text-muted-foreground">{today}</p>
            </div>

            <div className="mb-4">
              <p className="text-mono text-[10px] uppercase tracking-widest text-muted-foreground">Cliente</p>
              <p className="text-foreground">{clientName || "—"}</p>
              {clientDoc && <p className="text-xs text-muted-foreground">{clientDoc}</p>}
            </div>

            <div className="mb-4">
              <p className="text-mono text-[10px] uppercase tracking-widest text-muted-foreground">Escopo</p>
              <p className="text-foreground">{scope || "—"}</p>
            </div>

            <div className="mb-4">
              <p className="text-mono text-[10px] uppercase tracking-widest text-muted-foreground">Investimento</p>
              <div className="mt-1 space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Mão de obra ({hours}h × {formatBRL(hourlyRate)}/h)</span>
                  <span className="text-foreground">{formatBRL(laborCost)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Infraestrutura</span>
                  <span className="text-foreground">{formatBRL(extras)}</span>
                </div>
                <div className="flex justify-between border-t border-hairline pt-1 font-semibold">
                  <span className="text-foreground">Total</span>
                  <span className="text-emerald-glow">{formatBRL(finalPrice)}</span>
                </div>
              </div>
            </div>

            <div className="mb-4">
              <p className="text-mono text-[10px] uppercase tracking-widest text-muted-foreground">Prazo</p>
              <p className="text-foreground">{deadline}</p>
            </div>

            {deliverables.length > 0 && (
              <div className="mb-4">
                <p className="text-mono text-[10px] uppercase tracking-widest text-muted-foreground">Entregas</p>
                <ul className="mt-1 list-inside list-disc text-sm text-foreground">
                  {deliverables.map((d, i) => <li key={i}>{d}</li>)}
                </ul>
              </div>
            )}

            {company && (company.bankName || company.pixKey) && (
              <div className="mt-6 border-t border-hairline pt-4">
                <p className="text-mono text-[10px] uppercase tracking-widest text-muted-foreground">Dados bancários</p>
                <div className="mt-1 text-xs text-muted-foreground">
                  {company.bankName && <p>Banco: {company.bankName}</p>}
                  {company.bankAgency && <p>Agência: {company.bankAgency}</p>}
                  {company.bankAccount && <p>Conta: {company.bankAccount}</p>}
                  {company.pixKey && <p>PIX ({company.pixKeyType}): {company.pixKey}</p>}
                </div>
              </div>
            )}

            <div className="mt-6 border-t border-hairline pt-4 text-center text-xs text-muted-foreground">
              <p>Orçamento gerado em {today}</p>
              <p className="mt-1 font-semibold text-foreground">{company?.tradingName || "Studio One"}</p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
