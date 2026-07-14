"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowLeft, ClipboardList, Plus, Trash2, Package, Layers, ChevronDown, ChevronRight, Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import {
  Command,
  CommandInput,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { createOS } from "@/lib/actions/os";
import { cn } from "@/lib/utils";

type Client = {
  id: string;
  name: string;
  document: string | null;
};

type ProductItem = {
  id: string;
  name: string;
  estimatedHours: number;
  materialCost: number;
};

type StandardFase = {
  nome: string;
  prazo_dias: number;
};

type Phase = {
  name: string;
  deadlineDays: number;
};

type SelectedProduct = {
  productId: string;
  name: string;
  estimatedHours: number;
  materialCost: number;
  phases: Phase[];
};

const paymentOptions = [
  { value: "pix-1x", label: "PIX à vista", description: "Pagamento único via PIX", splits: 1, signal: 1, signalLabel: "Total" },
  { value: "pix-2x", label: "PIX 2×", description: "50% entrada + 50% na entrega", splits: 2, signal: 0.5, signalLabel: "50% entrada" },
  { value: "pix-3x", label: "PIX 3×", description: "33% entrada + 33% + 34%", splits: 3, signal: 0.34, signalLabel: "34% entrada" },
  { value: "transfer-1x", label: "Transferência", description: "Transferência bancária única", splits: 1, signal: 1, signalLabel: "Total" },
] as const;

function formatBRL(v: number) {
  return (v / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatCurrencyInput(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (!digits) return "";
  const num = parseInt(digits, 10);
  const reais = Math.floor(num / 100);
  const centavos = num % 100;
  return `${reais},${String(centavos).padStart(2, "0")}`;
}

function parseCurrencyToCents(value: string): number {
  const cleaned = value.replace(/[^0-9,]/g, "").replace(",", ".");
  return Math.round((parseFloat(cleaned) || 0) * 100);
}

function generatePaymentTerms(option: typeof paymentOptions[number], totalCents: number): string {
  if (totalCents <= 0) return "";

  const parts: string[] = [];

  if (option.splits === 1) {
    parts.push(`Pagamento único via ${option.label.replace("1×", "").trim()}: ${formatBRL(totalCents)}`);
  } else {
    const signalValue = Math.round(totalCents * option.signal);
    const remaining = totalCents - signalValue;
    const restValue = option.splits > 2 ? Math.round(remaining / (option.splits - 1)) : remaining;

    parts.push(`${option.signalLabel}: ${formatBRL(signalValue)}`);

    if (option.splits === 2) {
      parts.push(`Saldo na entrega: ${formatBRL(restValue)}`);
    } else {
      for (let i = 1; i < option.splits; i++) {
        const isLast = i === option.splits - 1;
        const val = isLast ? totalCents - signalValue - restValue * (option.splits - 2) : restValue;
        parts.push(`${i + 1}ª parcela: ${formatBRL(val)}`);
      }
    }
  }

  return parts.join(" · ");
}

export function NewOSClient({ clients, products, standardFases }: {
  clients: Client[];
  products: ProductItem[];
  standardFases: StandardFase[];
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [clientId, setClientId] = useState("");
  const [clientOpen, setClientOpen] = useState(false);
  const [clientSearch, setClientSearch] = useState("");
  const [totalValue, setTotalValue] = useState("");
  const [paymentOption, setPaymentOption] = useState("pix-1x");
  const [selectedProducts, setSelectedProducts] = useState<SelectedProduct[]>([]);
  const [expandedProduct, setExpandedProduct] = useState<string | null>(null);
  const [productToAdd, setProductToAdd] = useState("");

  const selectedClient = clients.find((c) => c.id === clientId);
  const totalHours = selectedProducts.reduce((s, p) => s + (p.estimatedHours || 0), 0);
  const totalCents = parseCurrencyToCents(totalValue);
  const allPhases = selectedProducts.flatMap(p => p.phases);
  const currentOption = paymentOptions.find(o => o.value === paymentOption)!;
  const paymentTerms = generatePaymentTerms(currentOption, totalCents);

  const handleTotalValueChange = useCallback((raw: string) => {
    const digits = raw.replace(/\D/g, "");
    setTotalValue(formatCurrencyInput(digits));
  }, []);

  const handleAddProduct = useCallback(() => {
    if (!productToAdd) return;
    const product = products.find(p => p.id === productToAdd);
    if (!product) return;
    if (selectedProducts.some(p => p.productId === product.id)) {
      toast.error("Produto já adicionado");
      return;
    }
    setSelectedProducts(prev => [...prev, {
      productId: product.id,
      name: product.name,
      estimatedHours: product.estimatedHours,
      materialCost: product.materialCost,
      phases: [],
    }]);
    setExpandedProduct(product.id);
    setProductToAdd("");
  }, [productToAdd, products, selectedProducts]);

  const handleRemoveProduct = useCallback((productId: string) => {
    setSelectedProducts(prev => prev.filter(p => p.productId !== productId));
    setExpandedProduct(prev => prev === productId ? null : prev);
  }, []);

  const handleLoadStandardPhases = useCallback((productId: string) => {
    setSelectedProducts(prev => prev.map(p =>
      p.productId === productId
        ? { ...p, phases: standardFases.map(f => ({ name: f.nome, deadlineDays: f.prazo_dias })) }
        : p
    ));
  }, [standardFases]);

  const handleAddPhase = useCallback((productId: string) => {
    setSelectedProducts(prev => prev.map(p =>
      p.productId === productId
        ? { ...p, phases: [...p.phases, { name: "", deadlineDays: 15 }] }
        : p
    ));
  }, []);

  const handleRemovePhase = useCallback((productId: string, phaseIdx: number) => {
    setSelectedProducts(prev => prev.map(p =>
      p.productId === productId
        ? { ...p, phases: p.phases.filter((_, i) => i !== phaseIdx) }
        : p
    ));
  }, []);

  const handlePhaseChange = useCallback((productId: string, phaseIdx: number, field: "name" | "deadlineDays", value: string | number) => {
    setSelectedProducts(prev => prev.map(p =>
      p.productId === productId
        ? { ...p, phases: p.phases.map((ph, i) => i === phaseIdx ? { ...ph, [field]: value } : ph) }
        : p
    ));
  }, []);

  const handleSave = useCallback(async () => {
    if (!clientId || !selectedClient) {
      toast.error("Selecione um cliente");
      return;
    }

    if (selectedProducts.length === 0) {
      toast.error("Adicione pelo menos um produto");
      return;
    }

    const validPhases = allPhases.filter(p => p.name.trim());
    if (validPhases.length === 0) {
      toast.error("Defina pelo menos uma fase com nome em cada produto");
      return;
    }

    if (totalCents <= 0) {
      toast.error("Defina o valor total do projeto");
      return;
    }

    setSaving(true);
    try {
      const result = await createOS({
        clientId,
        clientName: selectedClient.name,
        totalValue: totalCents,
        paymentTerms,
        phases: validPhases.map(p => ({ ...p, estimatedHours: 0 })),
        products: selectedProducts.map(p => ({
          productId: p.productId,
          name: p.name,
          estimatedHours: p.estimatedHours,
          materialCost: p.materialCost,
        })),
      });

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success("OS criada com sucesso!");
      router.push(`/adm/os/${result.data.osId}`);
    } catch {
      toast.error("Erro ao criar OS");
    } finally {
      setSaving(false);
    }
  }, [clientId, selectedClient, selectedProducts, allPhases, totalCents, paymentTerms, router]);

  const availableProducts = products.filter(p => !selectedProducts.some(sp => sp.productId === p.id));
  const filteredClients = clients.filter(c =>
    c.name.toLowerCase().includes(clientSearch.toLowerCase()) ||
    (c.document && c.document.includes(clientSearch))
  );

  return (
    <>
      <header className="flex items-center justify-between border-b border-hairline px-8 py-4">
        <div className="flex items-center gap-3">
          <Link href="/adm/os" className="inline-flex items-center gap-1.5 rounded-md border border-hairline px-2 py-1 text-[11px] text-muted-foreground hover:text-foreground">
            <ArrowLeft size={12} /> OS
          </Link>
          <ClipboardList size={16} className="text-violet-500" />
          <p className="text-mono text-[11px] uppercase tracking-widest text-muted-foreground">Nova Ordem de Serviço</p>
        </div>
        <Button size="sm" onClick={handleSave} disabled={saving || !clientId}>
          {saving ? "Salvando…" : "Criar OS + Projeto"}
        </Button>
      </header>

      <section className="mx-auto max-w-3xl px-8 py-6 space-y-8">
        {/* Client Picker */}
        <div className="space-y-2">
          <Label className="text-mono text-[10px] uppercase tracking-widest text-muted-foreground">Cliente</Label>
          <Popover open={clientOpen} onOpenChange={setClientOpen}>
            <PopoverTrigger className="w-full">
              <div
                role="combobox"
                aria-expanded={clientOpen}
                className="flex w-full items-center justify-between rounded-lg border border-hairline bg-(--surface-2) px-3 py-2 text-sm"
              >
                {selectedClient
                  ? <span>{selectedClient.name} {selectedClient.document ? `· ${selectedClient.document}` : ""}</span>
                  : <span className="text-muted-foreground">Selecione um cliente…</span>
                }
                <ChevronsUpDown size={14} className="ml-2 shrink-0 opacity-50" />
              </div>
            </PopoverTrigger>
            <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
              <Command>
                <CommandInput
                  placeholder="Buscar cliente…"
                  value={clientSearch}
                  onValueChange={setClientSearch}
                />
                <CommandList>
                  <CommandEmpty>Nenhum cliente encontrado.</CommandEmpty>
                  <CommandGroup>
                    {filteredClients.map((c) => (
                      <CommandItem
                        key={c.id}
                        value={c.id}
                        onSelect={(currentValue) => {
                          setClientId(currentValue);
                          setClientOpen(false);
                          setClientSearch("");
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            clientId === c.id ? "opacity-100" : "opacity-0"
                          )}
                        />
                        {c.name}
                        {c.document && (
                          <span className="ml-2 text-[11px] text-muted-foreground">· {c.document}</span>
                        )}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        {/* Total Value & Hours */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-mono text-[10px] uppercase tracking-widest text-muted-foreground">Valor Total</Label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">R$</span>
              <Input
                value={totalValue}
                onChange={(e) => handleTotalValueChange(e.target.value)}
                placeholder="0,00"
                className="pl-9"
              />
            </div>
            {totalCents > 0 && (
              <p className="text-[10px] text-muted-foreground">{formatBRL(totalCents)}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label className="text-mono text-[10px] uppercase tracking-widest text-muted-foreground">Total de Horas</Label>
            <div className="flex h-10 items-center rounded-lg border border-hairline bg-(--surface-2) px-3 text-sm font-semibold text-violet-600">
              {totalHours}h
            </div>
          </div>
        </div>

        {/* Payment Terms */}
        <div className="space-y-3">
          <Label className="text-mono text-[10px] uppercase tracking-widest text-muted-foreground">Condições de Pagamento</Label>
          <RadioGroup value={paymentOption} onValueChange={setPaymentOption} className="grid grid-cols-2 gap-2">
            {paymentOptions.map((opt) => {
              const selected = paymentOption === opt.value;
              return (
                <label
                  key={opt.value}
                  className={cn(
                    "flex cursor-pointer items-start gap-3 rounded-lg border px-4 py-3 transition-colors",
                    selected
                      ? "border-violet-500/50 bg-violet-500/10"
                      : "border-hairline bg-(--surface-1) hover:border-violet-500/30"
                  )}
                >
                  <RadioGroupItem value={opt.value} className="mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{opt.label}</p>
                    <p className="text-[11px] text-muted-foreground">{opt.description}</p>
                    {selected && totalCents > 0 && (
                      <div className="mt-2 space-y-1 border-t border-violet-500/20 pt-2">
                        {currentOption.splits === 1 ? (
                          <p className="text-xs font-semibold text-violet-600">
                            {formatBRL(totalCents)}
                          </p>
                        ) : (
                          <>
                            {totalCents > 0 && (
                              <>
                                <p className="text-xs text-violet-600">
                                  {currentOption.signalLabel}: <span className="font-semibold">{formatBRL(Math.round(totalCents * currentOption.signal))}</span>
                                </p>
                                <p className="text-xs text-violet-600">
                                  Saldo: <span className="font-semibold">{formatBRL(totalCents - Math.round(totalCents * currentOption.signal))}</span>
                                </p>
                              </>
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </label>
              );
            })}
          </RadioGroup>

          {totalCents > 0 && (
            <div className="rounded-lg border border-hairline bg-(--surface-1) px-4 py-3">
              <p className="text-mono text-[9px] uppercase tracking-widest text-muted-foreground mb-1">Resumo</p>
              <p className="text-sm text-foreground">{paymentTerms}</p>
            </div>
          )}
        </div>

        {/* Product Picker */}
        <div className="space-y-3">
          <Label className="text-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            Produtos do Escopo ({selectedProducts.length} adicionado{selectedProducts.length !== 1 ? "s" : ""})
          </Label>

          {availableProducts.length > 0 && (
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <Select value={productToAdd} onValueChange={(v) => setProductToAdd(v ?? "")}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione um produto do catálogo…" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableProducts.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name} ({p.estimatedHours}h)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button variant="outline" size="sm" onClick={handleAddProduct} disabled={!productToAdd}>
                <Package size={14} /> Adicionar
              </Button>
            </div>
          )}

          {selectedProducts.length === 0 ? (
            <div className="rounded-lg border border-dashed border-hairline px-4 py-8 text-center">
              <Package size={24} className="mx-auto mb-2 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">Nenhum produto adicionado</p>
              <p className="text-[11px] text-muted-foreground/60">
                Selecione um produto do catálogo acima para compor o escopo desta sprint
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {selectedProducts.map((sp) => {
                const isExpanded = expandedProduct === sp.productId;
                const phaseCount = sp.phases.filter(ph => ph.name.trim()).length;
                return (
                  <div key={sp.productId} className="rounded-lg border border-hairline bg-(--surface-1)">
                    <div className="flex items-center gap-3 px-4 py-3">
                      <button
                        onClick={() => setExpandedProduct(isExpanded ? null : sp.productId)}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                      </button>
                      <Package size={14} className="text-violet-500 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{sp.name}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {sp.estimatedHours}h estimadas · {phaseCount} fase{phaseCount !== 1 ? "s" : ""}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          variant="link"
                          size="sm"
                          onClick={() => handleLoadStandardPhases(sp.productId)}
                          className="text-violet-600"
                        >
                          <Layers size={12} /> Carregar fases
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => handleRemoveProduct(sp.productId)}
                          className="text-muted-foreground hover:text-red-500"
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="border-t border-hairline px-4 py-3 space-y-2">
                        {sp.phases.length === 0 ? (
                          <p className="text-center text-[11px] text-muted-foreground py-2">
                            Nenhuma fase definida.{" "}
                            <button
                              onClick={() => handleLoadStandardPhases(sp.productId)}
                              className="text-violet-600 hover:text-violet-700 underline"
                            >
                              Carregar fases padrão
                            </button>{" "}
                            ou adicione manualmente.
                          </p>
                        ) : (
                          sp.phases.map((phase, phaseIdx) => (
                            <div key={phaseIdx} className="flex items-start gap-2">
                              <span className="mt-2.5 text-[9px] font-bold text-muted-foreground/40 w-4 text-right shrink-0">
                                {phaseIdx + 1}
                              </span>
                              <div className="grid flex-1 grid-cols-12 gap-2">
                                <Input
                                  value={phase.name}
                                  onChange={(e) => handlePhaseChange(sp.productId, phaseIdx, "name", e.target.value)}
                                  placeholder="Nome da fase (ex: Design UI)"
                                  className="col-span-12 text-sm"
                                />
                                <div className="col-span-12 space-y-1">
                                  <Label className="text-[9px] text-muted-foreground">Prazo (dias)</Label>
                                  <Input
                                    type="number"
                                    min={1}
                                    value={phase.deadlineDays || ""}
                                    onChange={(e) => handlePhaseChange(sp.productId, phaseIdx, "deadlineDays", Number(e.target.value) || 0)}
                                  />
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                onClick={() => handleRemovePhase(sp.productId, phaseIdx)}
                                className="mt-1 text-muted-foreground hover:text-red-500 shrink-0"
                              >
                                <Trash2 size={12} />
                              </Button>
                            </div>
                          ))
                        )}

                        <Button variant="link" size="sm" onClick={() => handleAddPhase(sp.productId)} className="text-violet-600">
                          <Plus size={12} /> Adicionar fase
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Summary */}
        <div className="rounded-lg border border-violet-500/20 bg-violet-500/10 px-4 py-3">
          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold text-violet-900 dark:text-violet-300">
              {selectedProducts.length} produto(s) · {allPhases.filter(p => p.name.trim()).length} fase(s) · {totalHours}h
            </span>
            <span className="font-bold text-violet-700 dark:text-violet-400">{formatBRL(totalCents || 0)}</span>
          </div>
        </div>
      </section>
    </>
  );
}
