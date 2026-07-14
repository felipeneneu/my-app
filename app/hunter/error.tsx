"use client";

import { useEffect } from "react";
import { RefreshCw, AlertTriangle } from "lucide-react";

export default function HunterError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error); }, [error]);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-zinc-950 px-6 text-center">
      <AlertTriangle size={32} className="text-red-500" />
      <h1 className="mt-4 text-base font-bold text-white">Erro</h1>
      <p className="mt-2 text-xs text-zinc-500">Nao foi possivel carregar o Hunter Mobile.</p>
      <button
        onClick={reset}
        className="mt-6 inline-flex items-center gap-1.5 rounded-lg bg-violet-600 px-4 py-2 text-xs font-semibold text-white hover:bg-violet-700"
      >
        <RefreshCw size={14} /> Tentar novamente
      </button>
    </div>
  );
}
