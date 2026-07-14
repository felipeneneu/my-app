import type { ReactNode } from "react";

export const metadata = {
  title: "Hunter Mobile",
  description: "Acompanhe quests, hábitos e evolução do seu Hunter",
  manifest: "/manifest.json",
  themeColor: "#09090b",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "Hunter" },
};

export default function HunterLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
