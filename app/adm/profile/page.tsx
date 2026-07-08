import { getHunterStatus } from "@/lib/actions/hunter";
import { ProfileClient } from "./client";

export default async function ProfilePage() {
  const hunter = await getHunterStatus();
  if (!hunter) return <p className="p-8 text-muted-foreground">Personagem não encontrado. Crie um em /onboarding</p>;
  return <ProfileClient hunter={hunter} />;
}
