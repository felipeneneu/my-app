"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function AdmError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error); }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="flex flex-col items-center gap-4 text-center max-w-sm">
        <AlertTriangle size={36} className="text-red-500" />
        <h1 className="text-base font-bold text-foreground">Erro no painel</h1>
        <p className="text-xs text-muted-foreground">
          {error.message || "Ocorreu um erro ao carregar esta página."}
        </p>
        <div className="flex gap-2">
          <Button onClick={reset} size="sm" className="gap-2">
            <RefreshCw size={12} /> Tentar novamente
          </Button>
          <Link href="/adm">
            <Button variant="outline" size="sm" className="gap-2">
              <ArrowLeft size={12} /> Painel
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
