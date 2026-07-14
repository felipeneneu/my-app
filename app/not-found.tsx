"use client";

import Link from "next/link";
import { FileQuestion, Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center">
      <FileQuestion size={48} className="text-muted-foreground/30" />
      <h1 className="mt-4 text-2xl font-bold text-foreground">Página não encontrada</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        A página que você procura não existe ou foi movida.
      </p>
      <Link
        href="/"
        className="mt-6 inline-flex items-center gap-2 rounded-lg border border-hairline px-4 py-2 text-sm text-foreground hover:bg-(--surface-2)"
      >
        <Home size={14} /> Voltar ao início
      </Link>
    </div>
  );
}
