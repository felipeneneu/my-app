"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ExternalLink, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function TrackPortalPage() {
  const [token, setToken] = useState("");
  const router = useRouter();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = token.trim();
    if (trimmed) router.push(`/track/${trimmed}`);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-(--surface-0) p-6">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-linear-to-br from-emerald-glow to-violet-glow">
            <ExternalLink size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Portal do Cliente</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Acompanhe o andamento do seu projeto. Insira o token fornecido pela nossa equipe.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="token" className="block text-xs font-medium text-muted-foreground mb-1.5">
              Token de Acesso
            </label>
            <input
              id="token"
              type="text"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Cole seu token aqui..."
              className="w-full rounded-lg border border-hairline bg-(--surface-1) px-4 py-3 text-sm text-foreground outline-none placeholder:text-muted-foreground/40 focus:border-emerald-glow/50 focus:ring-1 focus:ring-emerald-glow/30"
            />
          </div>
          <Button
            type="submit"
            disabled={!token.trim()}
            className="w-full"
          >
            Acompanhar Projeto
            <ArrowRight size={14} className="ml-2" />
          </Button>
        </form>

        <p className="mt-6 text-center text-[11px] text-muted-foreground/40">
          Não tem um token? Entre em contato conosco para receber o seu link de acompanhamento.
        </p>
      </div>
    </div>
  );
}
