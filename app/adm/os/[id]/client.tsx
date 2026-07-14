"use client";

import { useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowLeft, ClipboardList, Check, Play, X, CreditCard, FileText, FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { completeOS } from "@/lib/actions/os";
import { confirmPayment } from "@/lib/actions/payments";
import type { OSData, OSItem } from "@/lib/actions/os";

type PaymentRow = {
  id: string;
  amount: number;
  date: string;
  method: string;
  note: string | null;
  receiptId: string | null;
};

type CompanyData = {
  tradingName: string | null;
  document: string | null;
  bankName: string | null;
  bankAgency: string | null;
  bankAccount: string | null;
  pixKey: string | null;
  pixKeyType: string | null;
  city: string | null;
};

function formatBRL(v: number) {
  return (v / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

const methodLabel: Record<string, string> = {
  pix: "PIX",
  transfer: "Transferência",
  cash: "Dinheiro",
  credit: "Cartão de Crédito",
  debit: "Cartão de Débito",
  other: "Outro",
};

export function OSDetailClient({ os, payments: initialPayments, company }: {
  os: { id: string; projectId: string | null; contentJson: string };
  payments: PaymentRow[];
  company: CompanyData | null;
}) {
  const [completing, setCompleting] = useState(false);
  const [payments, setPayments] = useState<PaymentRow[]>(initialPayments);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [payAmount, setPayAmount] = useState("");
  const [payDate, setPayDate] = useState(new Date().toISOString().split("T")[0]);
  const [payMethod, setPayMethod] = useState<string>("pix");
  const [payNote, setPayNote] = useState("");
  const [paySaving, setPaySaving] = useState(false);
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const [hiringBonus, setHiringBonus] = useState("");

  const data = useMemo(() => {
    try {
      const parsed = JSON.parse(os.contentJson);
      if (!parsed.items) {
        parsed.items = (parsed.phases || []).map((p: { name: string; estimatedHours?: number }) => ({
          name: p.name,
          hours: p.estimatedHours ?? 0,
          value: 0,
          status: "pending",
        }));
      }
      if (!parsed.scope) {
        parsed.scope = (parsed.products || []).map((p: { name: string }) => p.name).join(", ");
      }
      if (!parsed.deadline) {
        parsed.deadline = "";
      }
      return parsed as OSData;
    } catch {
      return null;
    }
  }, [os.contentJson]);

  const totalPaid = payments.reduce((s, p) => s + p.amount, 0);
  const osValue = data?.totalPrice ?? 0;
  const remaining = osValue - totalPaid;

  const handleComplete = useCallback(async () => {
    setCompleting(true);
    try {
      await completeOS(os.id);
      toast.success("OS concluída com sucesso");
    } catch {
      toast.error("Erro ao concluir OS");
    } finally {
      setCompleting(false);
    }
  }, [os.id]);

  const handleConfirmPayment = useCallback(async () => {
    if (!os.projectId) {
      toast.error("OS sem projeto vinculado");
      return;
    }

    const amountCents = Math.round((parseFloat(payAmount.replace(/[^0-9,]/g, "").replace(",", ".")) || 0) * 100);
    if (amountCents <= 0) {
      toast.error("Valor inválido");
      return;
    }

    setPaySaving(true);
    try {
      const result = await confirmPayment({
        projectId: os.projectId,
        osId: os.id,
        amount: amountCents,
        date: payDate,
        method: payMethod as any,
        note: payNote.trim() || undefined,
      });

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      setPayments(prev => [...prev, {
        id: result.data.payment.id,
        amount: amountCents,
        date: payDate,
        method: payMethod,
        note: payNote.trim() || null,
        receiptId: result.data.receipt.id,
      }]);

      toast.success("Pagamento confirmado!");
      setPaymentOpen(false);
      setPayAmount("");
      setPayDate(new Date().toISOString().split("T")[0]);
      setPayMethod("pix");
      setPayNote("");
    } catch {
      toast.error("Erro ao confirmar pagamento");
    } finally {
      setPaySaving(false);
    }
  }, [os.projectId, os.id, payAmount, payDate, payMethod, payNote]);

  if (!data) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-center">
        <p className="text-sm text-muted-foreground">Erro ao carregar dados da OS</p>
        <Link href="/adm/os"><Button variant="outline" size="sm"><ArrowLeft size={12} /> Voltar</Button></Link>
      </div>
    );
  }

  const isComplete = data.status === "completed";
  const isCancelled = data.status === "cancelled";

  return (
    <>
      <header className="flex items-center justify-between border-b border-hairline px-8 py-4">
        <div className="flex items-center gap-3">
          <Link href="/adm/os" className="inline-flex items-center gap-1.5 rounded-md border border-hairline px-2 py-1 text-[11px] text-muted-foreground hover:text-foreground">
            <ArrowLeft size={12} /> OS
          </Link>
          <ClipboardList size={16} className="text-violet-500" />
          <p className="text-mono text-[11px] uppercase tracking-widest text-muted-foreground">
            OS · {data.clientName}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Dialog open={paymentOpen} onOpenChange={setPaymentOpen}>
            <DialogTrigger>
              <Button size="sm" variant="outline" disabled={isComplete || isCancelled}>
                <CreditCard size={14} /> Confirmar Pagamento
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Confirmar Pagamento</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-[11px] font-semibold text-muted-foreground">Valor (R$)</label>
                  <input
                    value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value)}
                    placeholder="R$ 0,00"
                    className="w-full rounded-lg border border-hairline bg-transparent px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-violet-500/30"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] font-semibold text-muted-foreground">Data</label>
                  <input
                    type="date"
                    value={payDate}
                    onChange={(e) => setPayDate(e.target.value)}
                    className="w-full rounded-lg border border-hairline bg-transparent px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-violet-500/30"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] font-semibold text-muted-foreground">Método</label>
                  <select
                    value={payMethod}
                    onChange={(e) => setPayMethod(e.target.value)}
                    className="w-full rounded-lg border border-hairline bg-transparent px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-violet-500/30"
                  >
                    {Object.entries(methodLabel).map(([v, l]) => (
                      <option key={v} value={v}>{l}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-[11px] font-semibold text-muted-foreground">Observação</label>
                  <input
                    value={payNote}
                    onChange={(e) => setPayNote(e.target.value)}
                    placeholder="Opcional"
                    className="w-full rounded-lg border border-hairline bg-transparent px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-violet-500/30"
                  />
                </div>
                <Button onClick={handleConfirmPayment} className="w-full" disabled={paySaving}>
                  {paySaving ? "Confirmando…" : "Confirmar Pagamento"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={invoiceOpen} onOpenChange={setInvoiceOpen}>
            <DialogTrigger>
              <Button size="sm" variant="outline" className="text-emerald-glow border-emerald-glow/30 hover:bg-emerald-glow/10">
                <FileDown size={14} /> Fatura
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Gerar Fatura</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-[11px] text-muted-foreground">Bônus de Contratação (R$)</Label>
                  <Input
                    value={hiringBonus}
                    onChange={(e) => setHiringBonus(e.target.value)}
                    placeholder="0,00"
                  />
                  <p className="text-[10px] text-muted-foreground">Valor opcional de desconto concedido como bônus de contratação.</p>
                </div>
                <div className="rounded-lg border border-hairline bg-(--surface-1) px-4 py-3 space-y-1">
                  <p className="text-[11px] text-muted-foreground">
                    <span className="font-semibold text-foreground">{formatBRL(data.totalPrice)}</span> valor total
                  </p>
                  {data.paymentTerms?.toLowerCase().includes("pix") && !data.paymentTerms?.includes("2×") && (
                    <p className="text-[10px] text-emerald-600">
                      Desconto PIX (10%) será aplicado automaticamente
                    </p>
                  )}
                </div>
                <a
                  href={`/adm/os/${os.id}/invoice?bonus=${encodeURIComponent(hiringBonus.replace(/\D/g, ""))}`}
                  target="_blank"
                  className="block"
                >
                  <Button className="w-full" onClick={() => setInvoiceOpen(false)}>
                    <FileDown size={14} /> Baixar Fatura PDF
                  </Button>
                </a>
              </div>
            </DialogContent>
          </Dialog>
          {isComplete ? (
            <Badge variant="default" className="gap-1"><Check size={10} /> Concluída</Badge>
          ) : isCancelled ? (
            <Badge variant="destructive" className="gap-1"><X size={10} /> Cancelada</Badge>
          ) : (
            <Button size="sm" onClick={handleComplete} disabled={completing}>
              <Check size={14} /> {completing ? "Concluindo…" : "Concluir OS"}
            </Button>
          )}
        </div>
      </header>

      <section className="mx-auto max-w-4xl px-8 py-6">
        {/* Info header */}
        <div className="mb-8 grid grid-cols-2 gap-6 md:grid-cols-4">
          <InfoBlock label="Cliente" value={data.clientName} />
          <InfoBlock label="Valor Total" value={formatBRL(data.totalPrice)} highlight />
          <InfoBlock label="Prazo" value={data.deadline} />
          <InfoBlock label="Criada em" value={new Date(data.createdAt).toLocaleDateString("pt-BR")} />
        </div>

        {/* Payment Progress */}
        <Card className="mb-8">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[11px] font-bold uppercase tracking-[0.15em] text-muted-foreground">Financeiro</h3>
              <span className="text-xs text-muted-foreground">
                {formatBRL(totalPaid)} recebido de {formatBRL(osValue)}
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-(--surface-2)">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all"
                style={{ width: `${osValue > 0 ? Math.min(100, (totalPaid / osValue) * 100) : 0}%` }}
              />
            </div>
            {remaining > 0 && (
              <p className="mt-2 text-xs text-muted-foreground">
                Saldo pendente: {formatBRL(remaining)}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Payments List */}
        {payments.length > 0 && (
          <Card className="mb-8">
            <CardContent className="p-5">
              <h3 className="mb-3 text-[11px] font-bold uppercase tracking-[0.15em] text-muted-foreground">Pagamentos Recebidos</h3>
              <div className="space-y-2">
                {payments.map((p) => (
                  <div key={p.id} className="flex items-center justify-between rounded-lg border border-hairline px-4 py-3">
                    <div className="flex items-center gap-3">
                      <CreditCard size={14} className="text-emerald-500" />
                      <div>
                        <p className="text-sm font-medium text-foreground">{formatBRL(p.amount)}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {new Date(p.date).toLocaleDateString("pt-BR")} · {methodLabel[p.method] ?? p.method}
                          {p.note ? ` · ${p.note}` : ""}
                        </p>
                      </div>
                    </div>
                    {p.receiptId && (
                      <Link
                        href={`/adm/os/${os.id}/receipt/${p.receiptId}`}
                        className="inline-flex items-center gap-1 text-[11px] text-violet-600 hover:text-violet-700"
                      >
                        <FileText size={12} /> Recibo
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Scope */}
        <Card className="mb-8">
          <CardContent className="p-5">
            <h3 className="mb-2 text-[11px] font-bold uppercase tracking-[0.15em] text-muted-foreground">Escopo</h3>
            <p className="whitespace-pre-wrap text-sm text-foreground">{data.scope}</p>
            {data.paymentTerms && (
              <p className="mt-2 text-xs text-muted-foreground">Condições: {data.paymentTerms}</p>
            )}
          </CardContent>
        </Card>

        {/* Items */}
        {data.items.length > 0 && (
          <div className="mb-8">
            <h3 className="mb-3 text-[11px] font-bold uppercase tracking-[0.15em] text-muted-foreground">Itens da OS</h3>
            <div className="space-y-2">
              {data.items.map((item, idx) => (
                <OSItemRow key={idx} item={item} idx={idx} />
              ))}
            </div>
          </div>
        )}

        {/* Notes */}
        {data.notes && (
          <Card>
            <CardContent className="p-5">
              <h3 className="mb-2 text-[11px] font-bold uppercase tracking-[0.15em] text-muted-foreground">Observações</h3>
              <p className="whitespace-pre-wrap text-sm text-foreground">{data.notes}</p>
            </CardContent>
          </Card>
        )}
      </section>
    </>
  );
}

function InfoBlock({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div>
      <p className="mb-0.5 text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground">{label}</p>
      <p className={`text-sm font-semibold ${highlight ? "text-violet-600" : "text-foreground"}`}>{value}</p>
    </div>
  );
}

function OSItemRow({ item, idx }: { item: OSItem; idx: number }) {
  return (
    <div className="flex items-center gap-4 rounded-lg border border-hairline px-4 py-3">
      <span className="text-[11px] font-bold text-muted-foreground/40">{String(idx + 1).padStart(2, "0")}</span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground">{item.name}</p>
        <p className="text-[11px] text-muted-foreground">{item.hours}h · {formatBRL(item.value)}</p>
      </div>
      <div className="flex items-center gap-3">
        {item.deadline && (
          <span className="text-[10px] text-muted-foreground">{new Date(item.deadline).toLocaleDateString("pt-BR")}</span>
        )}
        <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${statusColor[item.status] ?? statusColor.pending}`}>
          {statusLabel[item.status] ?? item.status}
        </span>
      </div>
    </div>
  );
}

const statusColor: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  in_progress: "bg-blue-100 text-blue-800",
  completed: "bg-emerald-100 text-emerald-800",
};

const statusLabel: Record<string, string> = {
  pending: "Pendente",
  in_progress: "Em andamento",
  completed: "Concluído",
};
