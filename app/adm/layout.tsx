import { db } from "@/db";
import { projects, workspaceConfig } from "@/db/schema";
import { AppShell } from "@/components/AppShell";
import { redirect } from "next/navigation";
import { getHunterStatus } from "@/lib/actions/hunter";

export default async function AdmLayout({ children }: { children: React.ReactNode }) {
  const dbProjects = await db.select().from(projects);
  const config = await db.select().from(workspaceConfig).then((r) => r[0]) ?? {
    workspaceName: "Studio One",
    userName: "Felipe Neneu",
    userRole: "Autônomo · Pro",
    userInitials: "FN",
    monthlyGoal: 15000,
    proposalDefaultDiscount: 10,
    proposalDownPayment: 50,
    proposalInstallments: 6,
    proposalSignatureName: "Felipe Neneu",
    proposalSignatureRole: "Full-Stack Developer & Designer",
    proposalSignatureSite: "www.felipeneneu.com.br",
    proposalSignatureEmail: "contato@felipeneneu.com.br",
    proposalSignatureCity: "São Paulo / SP",
    proposalIntroMessage: "ESTA PROPOSTA É DIVIDIDA EM 3 ETAPAS PRINCIPAIS: BRANDING, DESIGN DE INTERFACE (UI/UX) E DESENVOLVIMENTO TECNOLÓGICO.",
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
