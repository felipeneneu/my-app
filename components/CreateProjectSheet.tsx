"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createProject } from "@/lib/actions/projects";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (project: { id: string; name: string }) => void;
}

export function CreateProjectSheet({ open, onOpenChange, onCreated }: Props) {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);

    const project = await createProject(name.trim());

    setName("");
    setLoading(false);
    onOpenChange(false);
    onCreated?.(project);
    queryClient.invalidateQueries({ queryKey: ["projects"] });
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-sm">
        <SheetHeader>
          <SheetTitle>Criar projeto</SheetTitle>
          <SheetDescription>Adicione um novo projeto ao seu estúdio.</SheetDescription>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-6 p-4 pt-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="projectName">Nome do projeto</Label>
            <Input
              id="projectName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Site Hotel Bela Vista"
            />
          </div>
          <Button type="submit" disabled={loading || !name.trim()}>
            {loading ? "Criando…" : "Criar projeto"}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}