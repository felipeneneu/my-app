"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { updateWorkspaceConfig } from "@/lib/actions/workspace";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  config: Record<string, string | number>;
}

export function EditWorkspaceSheet({ open, onOpenChange, config }: Props) {
  const router = useRouter();
  const [name, setName] = useState(String(config.workspaceName ?? ""));
  const [userName, setUserName] = useState(String(config.userName ?? ""));
  const [role, setRole] = useState(String(config.userRole ?? ""));
  const [monthlyGoal, setMonthlyGoal] = useState(String(config.monthlyGoal ?? "15000"));
  const [proposalDiscount, setProposalDiscount] = useState(String(config.proposalDefaultDiscount ?? "10"));
  const [proposalDownPayment, setProposalDownPayment] = useState(String(config.proposalDownPayment ?? "50"));
  const [proposalInstallments, setProposalInstallments] = useState(String(config.proposalInstallments ?? "6"));
  const [proposalSignatureName, setProposalSignatureName] = useState(String(config.proposalSignatureName ?? ""));
  const [proposalSignatureRole, setProposalSignatureRole] = useState(String(config.proposalSignatureRole ?? ""));
  const [proposalSignatureSite, setProposalSignatureSite] = useState(String(config.proposalSignatureSite ?? ""));
  const [proposalSignatureEmail, setProposalSignatureEmail] = useState(String(config.proposalSignatureEmail ?? ""));
  const [proposalSignatureCity, setProposalSignatureCity] = useState(String(config.proposalSignatureCity ?? ""));
  const [proposalIntroMessage, setProposalIntroMessage] = useState(String(config.proposalIntroMessage ?? ""));
  const [showProposal, setShowProposal] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await updateWorkspaceConfig({
      workspaceName: name,
      userName,
      userRole: role,
      monthlyGoal: Number(monthlyGoal),
      proposalDefaultDiscount: Number(proposalDiscount),
      proposalDownPayment: Number(proposalDownPayment),
      proposalInstallments: Number(proposalInstallments),
      proposalSignatureName,
      proposalSignatureRole,
      proposalSignatureSite,
      proposalSignatureEmail,
      proposalSignatureCity,
      proposalIntroMessage,
    });
    setLoading(false);
    onOpenChange(false);
    router.refresh();
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-sm overflow-y-auto">
        <SheetHeader><SheetTitle>Editar Workspace</SheetTitle></SheetHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-4 pt-2">
          <div className="flex flex-col gap-1.5">
            <Label className="text-mono text-[10px] uppercase tracking-widest text-muted-foreground">Workspace</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-mono text-[10px] uppercase tracking-widest text-muted-foreground">Seu nome</Label>
            <Input value={userName} onChange={(e) => setUserName(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-mono text-[10px] uppercase tracking-widest text-muted-foreground">Cargo</Label>
            <Input value={role} onChange={(e) => setRole(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-mono text-[10px] uppercase tracking-widest text-muted-foreground">Meta mensal (R$)</Label>
            <Input type="number" value={monthlyGoal} onChange={(e) => setMonthlyGoal(e.target.value)} />
          </div>

          <button type="button" onClick={() => setShowProposal(!showProposal)} className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground mt-2">
            {showProposal ? "▼" : "▶"} Configurações da Proposta
          </button>

          {showProposal && (
            <div className="flex flex-col gap-3 border-t border-hairline pt-3">
              <div className="grid grid-cols-3 gap-2">
                <div className="flex flex-col gap-1.5">
                  <Label className="text-mono text-[9px] uppercase tracking-widest text-muted-foreground">Desconto (%)</Label>
                  <Input type="number" value={proposalDiscount} onChange={(e) => setProposalDiscount(e.target.value)} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-mono text-[9px] uppercase tracking-widest text-muted-foreground">Entrada (%)</Label>
                  <Input type="number" value={proposalDownPayment} onChange={(e) => setProposalDownPayment(e.target.value)} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-mono text-[9px] uppercase tracking-widest text-muted-foreground">Parcelas</Label>
                  <Input type="number" value={proposalInstallments} onChange={(e) => setProposalInstallments(e.target.value)} />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-mono text-[9px] uppercase tracking-widest text-muted-foreground">Nome na assinatura</Label>
                <Input value={proposalSignatureName} onChange={(e) => setProposalSignatureName(e.target.value)} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-mono text-[9px] uppercase tracking-widest text-muted-foreground">Cargo</Label>
                <Input value={proposalSignatureRole} onChange={(e) => setProposalSignatureRole(e.target.value)} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-mono text-[9px] uppercase tracking-widest text-muted-foreground">Site</Label>
                <Input value={proposalSignatureSite} onChange={(e) => setProposalSignatureSite(e.target.value)} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-mono text-[9px] uppercase tracking-widest text-muted-foreground">E-mail</Label>
                <Input value={proposalSignatureEmail} onChange={(e) => setProposalSignatureEmail(e.target.value)} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-mono text-[9px] uppercase tracking-widest text-muted-foreground">Cidade/UF</Label>
                <Input value={proposalSignatureCity} onChange={(e) => setProposalSignatureCity(e.target.value)} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-mono text-[9px] uppercase tracking-widest text-muted-foreground">Mensagem de introdução</Label>
                <Textarea value={proposalIntroMessage} onChange={(e) => setProposalIntroMessage(e.target.value)} rows={3} />
              </div>
            </div>
          )}

          <Button type="submit" disabled={loading} className="mt-2">
            {loading ? "Salvando…" : "Salvar"}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
