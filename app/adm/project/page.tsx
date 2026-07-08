import Link from "next/link";
import { MessageSquare, Hash } from "lucide-react";
import { db } from "@/db";
import { projects } from "@/db/schema";

export default async function ProjectListPage() {
  const allProjects = await db.select().from(projects).orderBy(projects.startDate);

  return (
    <div className="mx-auto flex h-full w-full max-w-4xl flex-col px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Briefing</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Selecione um projeto para visualizar ou adicionar notas de briefing.
        </p>
      </div>

      {allProjects.length === 0 ? (
        <div className="mt-16 flex flex-col items-center gap-3 text-center text-muted-foreground">
          <MessageSquare size={40} className="opacity-20" />
          <p className="text-sm">Nenhum projeto encontrado.</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {allProjects.map((p) => (
            <Link
              key={p.id}
              href={`/adm/project/${p.id}/briefing`}
              className="group flex items-center gap-4 rounded-lg border border-hairline bg-(--surface-1) px-5 py-4 transition-all hover:border-emerald-glow/30 hover:bg-(--surface-2)"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-glow/10 text-emerald-glow">
                <Hash size={18} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground group-hover:text-emerald-glow">
                  {p.name}
                </p>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                  {p.clientName}
                </p>
              </div>
              <span className="shrink-0 text-xs text-muted-foreground">{p.status}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
