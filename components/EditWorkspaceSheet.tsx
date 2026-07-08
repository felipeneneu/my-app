"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateWorkspaceConfig } from "@/lib/actions/workspace";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  config: { workspaceName: string; userName: string; userRole: string };
}

export function EditWorkspaceSheet({ open, onOpenChange, config }: Props) {
  const router = useRouter();
  const [name, setName] = useState(config.workspaceName);
  const [userName, setUserName] = useState(config.userName);
  const [role, setRole] = useState(config.userRole);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await updateWorkspaceConfig({ workspaceName: name, userName, userRole: role });
    setLoading(false);
    onOpenChange(false);
    router.refresh();
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-sm">
        <SheetHeader><SheetTitle>Editar Workspace</SheetTitle></SheetHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-6 p-4 pt-2">
          <div className="flex flex-col gap-2">
            <Label>Nome do workspace</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} className="mt-1.5" />
          </div>
          <div className="flex flex-col gap-2">
            <Label>Seu nome</Label>
            <Input value={userName} onChange={(e) => setUserName(e.target.value)} className="mt-1.5" />
          </div>
          <div className="flex flex-col gap-2">
            <Label>Cargo</Label>
            <Input value={role} onChange={(e) => setRole(e.target.value)} className="mt-1.5" />
          </div>
          <Button type="submit" disabled={loading}>
            {loading ? "Salvando…" : "Salvar"}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
