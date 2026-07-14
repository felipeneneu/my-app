"use client";

import Link from "next/link";
import { FileQuestion, ArrowLeft } from "lucide-react";

export default function AdmNotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
      <FileQuestion size={40} className="text-muted-foreground/30" />
      <h1 className="mt-3 text-lg font-bold text-foreground">Página não encontrada</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Esta seção não existe no painel.
      </p>
      <Link
        href="/adm"
        className="mt-4 inline-flex items-center gap-1.5 rounded-md border border-hairline px-3 py-1.5 text-xs text-foreground hover:bg-(--surface-2)"
      >
        <ArrowLeft size={12} /> Painel
      </Link>
    </div>
  );
}
