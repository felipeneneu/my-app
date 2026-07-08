import { db } from "@/db";
import { projects, workspaceConfig } from "@/db/schema";
import { AppShell } from "@/components/AppShell";
import { redirect } from "next/navigation";
import { getHunterStatus } from "@/lib/actions/hunter";

export const dynamic = "force-dynamic";

export default async function AdmLayout({ children }: { children: React.ReactNode }) {
  const dbProjects = await db.select().from(projects);
  const config = await db.select().from(workspaceConfig).then((r) => r[0]) ?? {
    workspaceName: "Studio One",
    userName: "Felipe Neneu",
    userRole: "Autônomo · Pro",
    userInitials: "FN",
  };
const hunter = await getHunterStatus();
if (!hunter) {
  redirect("/onboarding");  // ← sem /adm/
}

  return (
    <AppShell projects={dbProjects} config={config}>
      {children}
    </AppShell>
  );
}
